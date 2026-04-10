// src/composables/useRecords.js
// ============================================================
// Central state & business logic for Equipment Tracker
// - Real-time Firestore sync
// - LocalStorage fallback
// - Shared singleton state
// ============================================================

import { ref, computed, watch } from 'vue'
import { db } from '../firebase'
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore'

const HISTORY_COL = 'records'

let _uid = 0
const uid = () => ++_uid

// ── Factory: blank equipment row ──
export function makeRow() {
  return {
    id: uid(),
    codeNo: '',
    qty: '',
    toolName: '',
    controlNo: '',
    condition: '',
    damageNotes: '',
    accessoriesReturned: null,
    accessoriesNotes: '',
    remarks: '',
    showBorrowers: false,
    borrowers: []
  }
}

// ── Factory: blank borrower ──
export function makeBorrower() {
  return {
    id: uid(),
    name: '',
    project: '',
    conditionCheckout: '',
    conditionCheckoutNotes: '',
    withdraw: 0,
    dateBorrowed: '',
    timeBorrowed: '',
    returned: false,
    returnDate: '',
    returnTime: '',
    conditionReturn: '',
    conditionReturnNotes: ''
  }
}

// ─────────────────────────────────────
// 🔥 SHARED STATE (IMPORTANT)
// ─────────────────────────────────────
const recordDate = ref(new Date().toISOString().slice(0, 10))
const newEquipRows = ref([makeRow()])
const oldEquipRows = ref([makeRow()])
const history = ref([])
const historySyncStatus = ref('connecting')

// ─────────────────────────────────────
// 🔥 FIRESTORE REAL-TIME LISTENER
// ─────────────────────────────────────
const colRef = collection(db, HISTORY_COL)

onSnapshot(
  colRef,
  (snapshot) => {
    history.value = snapshot.docs.map(d => ({
      ...d.data(),
      date: d.id
    }))
    historySyncStatus.value = 'synced'
    _persistHistoryLocal()
  },
  (err) => {
    console.error('Firestore error:', err)
    historySyncStatus.value = 'error'
    _loadHistoryLocal()
  }
)

// ─────────────────────────────────────
// 📦 LOCAL STORAGE (fallback)
// ─────────────────────────────────────
function _loadHistoryLocal() {
  try {
    const saved = localStorage.getItem('eqt_history')
    if (saved) history.value = JSON.parse(saved)
  } catch (e) {
    console.error('Local load error', e)
  }
}

function _persistHistoryLocal() {
  localStorage.setItem('eqt_history', JSON.stringify(history.value))
}

function _loadActiveLocal() {
  try {
    const saved = localStorage.getItem('eqt_active_record')
    if (saved) {
      const active = JSON.parse(saved)
      recordDate.value = active.recordDate || recordDate.value
      if (active.newEquipRows?.length) newEquipRows.value = active.newEquipRows
      if (active.oldEquipRows?.length) oldEquipRows.value = active.oldEquipRows
    }
  } catch (e) {
    console.error('Active load error', e)
  }
}

function _persistActiveLocal() {
  localStorage.setItem('eqt_active_record', JSON.stringify({
    recordDate: recordDate.value,
    newEquipRows: JSON.parse(JSON.stringify(newEquipRows.value)),
    oldEquipRows: JSON.parse(JSON.stringify(oldEquipRows.value))
  }))
}

// ─────────────────────────────────────
// 🔥 FIRESTORE WRITE HELPERS
// ─────────────────────────────────────
async function _writeRecord(record) {
  _persistHistoryLocal()
  try {
    await setDoc(doc(db, HISTORY_COL, record.date), record)
  } catch (e) {
    console.error('Write failed:', e)
    historySyncStatus.value = 'error'
  }
}

async function _deleteRecord(date) {
  try {
    await deleteDoc(doc(db, HISTORY_COL, date))
  } catch (e) {
    console.error('Delete failed:', e)
    historySyncStatus.value = 'error'
  }
}

// ─────────────────────────────────────
// INIT
// ─────────────────────────────────────
function loadHistory() {
  _loadActiveLocal()
}

// ─────────────────────────────────────
// ROW OPERATIONS
// ─────────────────────────────────────
function addRow(section) {
  if (section === 'new') newEquipRows.value.push(makeRow())
  else oldEquipRows.value.push(makeRow())
  _persistActiveLocal()
}

function removeRow(section, index) {
  if (section === 'new') newEquipRows.value.splice(index, 1)
  else oldEquipRows.value.splice(index, 1)
  _persistActiveLocal()
}

function clearAll() {
  newEquipRows.value = [makeRow()]
  oldEquipRows.value = [makeRow()]
  localStorage.removeItem('eqt_active_record')
}

// ─────────────────────────────────────
// BORROWERS
// ─────────────────────────────────────
function toggleBorrowers(row) { row.showBorrowers = !row.showBorrowers }
function addBorrower(row) { row.borrowers.push(makeBorrower()); row.showBorrowers = true }
function removeBorrower(row, index) { row.borrowers.splice(index, 1) }

// ─────────────────────────────────────
// SAVE / LOAD
// ─────────────────────────────────────
async function saveRecord() {
  const record = {
    date: recordDate.value,
    savedAt: new Date().toISOString(),
    newEquipRows: JSON.parse(JSON.stringify(newEquipRows.value)),
    oldEquipRows: JSON.parse(JSON.stringify(oldEquipRows.value))
  }

  const idx = history.value.findIndex(r => r.date === record.date)
  if (idx >= 0) history.value[idx] = record
  else history.value.push(record)

  _persistActiveLocal()
  await _writeRecord(record)

  return record
}

function loadRecord(record) {
  recordDate.value = record.date
  newEquipRows.value = JSON.parse(JSON.stringify(record.newEquipRows))
  oldEquipRows.value = JSON.parse(JSON.stringify(record.oldEquipRows))
  _persistActiveLocal()
}

// ─────────────────────────────────────
// DELETE / UPDATE / RENAME
// ─────────────────────────────────────
async function deleteRecord(date) {
  history.value = history.value.filter(r => r.date !== date)
  await _deleteRecord(date)
}

async function updateRecord(updatedRecord) {
  const idx = history.value.findIndex(r => r.date === updatedRecord.date)
  if (idx !== -1) history.value.splice(idx, 1, updatedRecord)
  await _writeRecord(updatedRecord)
}

async function renameRecord(oldDate, newDate) {
  const src = history.value.find(r => r.date === oldDate)
  if (!src) return

  const existing = history.value.find(r => r.date === newDate)

  if (existing) {
    existing.newEquipRows.push(...src.newEquipRows)
    existing.oldEquipRows.push(...src.oldEquipRows)
    await _writeRecord(existing)
  } else {
    const renamed = { ...src, date: newDate }
    await _writeRecord(renamed)
  }

  await _deleteRecord(oldDate)
}

// ─────────────────────────────────────
// COMPUTED
// ─────────────────────────────────────
const sortedHistory = computed(() =>
  [...history.value].sort((a, b) => b.date.localeCompare(a.date))
)

const savedDates = computed(() => new Set(history.value.map(r => r.date)))

const hasDraft = computed(() => {
  const hasData = rows => rows.some(r => r.codeNo || r.toolName || r.borrowers.length)
  return hasData(newEquipRows.value) || hasData(oldEquipRows.value)
})

const totalBorrowers = (record) => {
  let count = 0
  ;[...(record.newEquipRows || []), ...(record.oldEquipRows || [])]
    .forEach(r => count += (r.borrowers || []).length)
  return count
}

// ── AUTO SAVE DRAFT
watch([recordDate, newEquipRows, oldEquipRows], _persistActiveLocal, { deep: true })

// ─────────────────────────────────────
// EXPORT
// ─────────────────────────────────────

// -----------------------------------------
// SWITCH DATE
// -----------------------------------------
function switchToDate(date) {
  const existing = history.value.find(r => r.date === date)
  if (existing) {
    recordDate.value   = existing.date
    newEquipRows.value = JSON.parse(JSON.stringify(existing.newEquipRows?.length ? existing.newEquipRows : [makeRow()]))
    oldEquipRows.value = JSON.parse(JSON.stringify(existing.oldEquipRows?.length ? existing.oldEquipRows : [makeRow()]))
  } else {
    recordDate.value   = date
    newEquipRows.value = [makeRow()]
    oldEquipRows.value = [makeRow()]
  }
  _persistActiveLocal()
}

export function useRecords() {
  return {
    switchToDate,
    recordDate,
    newEquipRows,
    oldEquipRows,
    history,
    sortedHistory,
    savedDates,
    hasDraft,
    historySyncStatus,
    loadHistory,
    addRow,
    removeRow,
    clearAll,
    toggleBorrowers,
    addBorrower,
    removeBorrower,
    saveRecord,
    loadRecord,
    deleteRecord,
    updateRecord,
    renameRecord,
    totalBorrowers
  }
}