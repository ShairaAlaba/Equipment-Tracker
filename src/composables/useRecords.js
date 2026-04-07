// src/composables/useRecords.js
// ============================================================
//  Central state & business logic for the Equipment Tracker
// ============================================================

import { ref, computed, watch } from 'vue'
import { db } from '../firebase'
import {
  collection, doc, getDocs, setDoc, deleteDoc
} from 'firebase/firestore'

let _uid = 0
const uid = () => ++_uid

// ---- Factory: blank equipment row ----
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

// ---- Factory: blank borrower entry ----
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

export function useRecords() {
  const recordDate = ref(new Date().toISOString().slice(0, 10))
  const newEquipRows = ref([makeRow()])
  const oldEquipRows = ref([makeRow()])
  const history = ref([])

  // ---- Load all records from Firestore ----
  async function loadHistory() {
    try {
      const snapshot = await getDocs(collection(db, 'records'))
      history.value = snapshot.docs.map(doc => doc.data())
    } catch (e) {
      console.error('Failed to load history from Firestore', e)
    }

    // Still restore active draft from localStorage
    try {
      const savedActive = localStorage.getItem('eqt_active_record')
      if (savedActive) {
        const active = JSON.parse(savedActive)
        if (active.recordDate) recordDate.value = active.recordDate
        if (active.newEquipRows?.length) newEquipRows.value = active.newEquipRows
        if (active.oldEquipRows?.length) oldEquipRows.value = active.oldEquipRows
      }
    } catch (e) {
      console.error('Failed to load active record', e)
    }
  }

  function persistActive() {
    localStorage.setItem('eqt_active_record', JSON.stringify({
      recordDate: recordDate.value,
      newEquipRows: JSON.parse(JSON.stringify(newEquipRows.value)),
      oldEquipRows: JSON.parse(JSON.stringify(oldEquipRows.value)),
    }))
  }

  // ---- Row operations ----
  function addRow(section) {
    if (section === 'new') newEquipRows.value.push(makeRow())
    else oldEquipRows.value.push(makeRow())
    persistActive()
  }

  function removeRow(section, index) {
    if (section === 'new') newEquipRows.value.splice(index, 1)
    else oldEquipRows.value.splice(index, 1)
    persistActive()
  }

  function clearAll() {
    newEquipRows.value = [makeRow()]
    oldEquipRows.value = [makeRow()]
    localStorage.removeItem('eqt_active_record')
  }

  // ---- Borrower operations ----
  function toggleBorrowers(row) { row.showBorrowers = !row.showBorrowers }
  function addBorrower(row) { row.borrowers.push(makeBorrower()); row.showBorrowers = true }
  function removeBorrower(row, index) { row.borrowers.splice(index, 1) }

  // ---- Save to Firestore ----
  async function saveRecord() {
    const record = {
      date: recordDate.value,
      savedAt: new Date().toISOString(),
      newEquipRows: JSON.parse(JSON.stringify(newEquipRows.value)),
      oldEquipRows: JSON.parse(JSON.stringify(oldEquipRows.value))
    }
    try {
      await setDoc(doc(db, 'records', record.date), record)
      const idx = history.value.findIndex(r => r.date === record.date)
      if (idx >= 0) history.value[idx] = record
      else history.value.push(record)
      persistActive()
    } catch (e) {
      console.error('Failed to save record to Firestore', e)
    }
    return record
  }

  function loadRecord(record) {
    recordDate.value = record.date
    newEquipRows.value = JSON.parse(JSON.stringify(record.newEquipRows))
    oldEquipRows.value = JSON.parse(JSON.stringify(record.oldEquipRows))
    persistActive()
  }

  // ---- Delete from Firestore ----
  async function deleteRecord(date) {
    try {
      await deleteDoc(doc(db, 'records', date))
      history.value = history.value.filter(r => r.date !== date)
    } catch (e) {
      console.error('Failed to delete record from Firestore', e)
    }
  }

  // ---- Update in Firestore ----
  async function updateRecord(updatedRecord) {
    try {
      await setDoc(doc(db, 'records', updatedRecord.date), updatedRecord)
      const idx = history.value.findIndex(r => r.date === updatedRecord.date)
      if (idx !== -1) history.value.splice(idx, 1, { ...updatedRecord })
    } catch (e) {
      console.error('Failed to update record in Firestore', e)
    }
  }

  // ---- Rename in Firestore ----
  async function renameRecord(oldDate, newDate) {
    const srcIdx = history.value.findIndex(r => r.date === oldDate)
    if (srcIdx === -1) return
    const src = history.value[srcIdx]
    const destIdx = history.value.findIndex(r => r.date === newDate)

    try {
      if (destIdx !== -1) {
        const dest = history.value[destIdx]
        dest.newEquipRows = [...(dest.newEquipRows || []), ...(src.newEquipRows || [])]
        dest.oldEquipRows = [...(dest.oldEquipRows || []), ...(src.oldEquipRows || [])]
        dest.savedAt = new Date().toISOString()
        await setDoc(doc(db, 'records', newDate), dest)
        await deleteDoc(doc(db, 'records', oldDate))
        history.value.splice(srcIdx, 1)
      } else {
        const renamed = { ...src, date: newDate, savedAt: new Date().toISOString() }
        await setDoc(doc(db, 'records', newDate), renamed)
        await deleteDoc(doc(db, 'records', oldDate))
        history.value.splice(srcIdx, 1, renamed)
      }
    } catch (e) {
      console.error('Failed to rename record in Firestore', e)
    }
  }

  // ---- Computed helpers ----
  const totalBorrowers = (record) => {
    let count = 0
    ;[...(record.newEquipRows || []), ...(record.oldEquipRows || [])].forEach(
      r => (count += (r.borrowers || []).length)
    )
    return count
  }

  watch([recordDate, newEquipRows, oldEquipRows], () => {
    persistActive()
  }, { deep: true })

  const sortedHistory = computed(() =>
    [...history.value].sort((a, b) => b.date.localeCompare(a.date))
  )

  const savedDates = computed(() => new Set(history.value.map(r => r.date)))

  const hasDraft = computed(() => {
    const hasData = rows => rows.some(r => r.codeNo || r.toolName || r.borrowers.length > 0)
    return hasData(newEquipRows.value) || hasData(oldEquipRows.value)
  })

  function switchToDate(date) {
    const existing = history.value.find(r => r.date === date)
    if (existing) {
      recordDate.value = existing.date
      newEquipRows.value = JSON.parse(JSON.stringify(existing.newEquipRows || [makeRow()]))
      oldEquipRows.value = JSON.parse(JSON.stringify(existing.oldEquipRows || [makeRow()]))
      if (!newEquipRows.value.length) newEquipRows.value = [makeRow()]
      if (!oldEquipRows.value.length) oldEquipRows.value = [makeRow()]
    } else {
      recordDate.value = date
      newEquipRows.value = [makeRow()]
      oldEquipRows.value = [makeRow()]
    }
    persistActive()
  }

  return {
    recordDate, newEquipRows, oldEquipRows, history, sortedHistory,
    savedDates, hasDraft, loadHistory, switchToDate, addRow, removeRow,
    clearAll, toggleBorrowers, addBorrower, removeBorrower, saveRecord,
    loadRecord, deleteRecord, updateRecord, renameRecord, totalBorrowers
  }
}