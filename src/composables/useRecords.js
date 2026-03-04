// src/composables/useRecords.js
// ============================================================
//  Central state & business logic for the Equipment Tracker
// ============================================================

import { ref, computed } from 'vue'

let _uid = 0
const uid = () => ++_uid

// ---- Factory: blank equipment row ----
export function makeRow() {
  return {
    id: uid(),
    qty: '',
    toolName: '',
    controlNo: '',
    condition: '',
    damageNotes: '',
    accessoriesReturned: null, // true | false | null
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
    // Check-out
    conditionCheckout: '',
    conditionCheckoutNotes: '',
    // Withdrawal
    dateBorrowed: '',
    timeBorrowed: '',
    // Return
    returnDate: '',
    returnTime: '',
    // Condition upon return
    conditionReturn: '',
    conditionReturnNotes: ''
  }
}

export function useRecords() {
  // ---- Active day ----
  const recordDate = ref(new Date().toISOString().slice(0, 10))

  // Section A — new / good condition
  const newEquipRows = ref([makeRow()])
  // Section B — old / damaged
  const oldEquipRows = ref([makeRow()])

  // ---- History (persisted in localStorage) ----
  const history = ref([])

  function loadHistory() {
    try {
      const saved = localStorage.getItem('eqt_history')
      if (saved) history.value = JSON.parse(saved)
    } catch (e) {
      console.error('Failed to load history', e)
    }
  }

  function persistHistory() {
    localStorage.setItem('eqt_history', JSON.stringify(history.value))
  }

  // ---- Row operations ----
  function addRow(section) {
    if (section === 'new') newEquipRows.value.push(makeRow())
    else oldEquipRows.value.push(makeRow())
  }

  function removeRow(section, index) {
    if (section === 'new') newEquipRows.value.splice(index, 1)
    else oldEquipRows.value.splice(index, 1)
  }

  function clearAll() {
    newEquipRows.value = [makeRow()]
    oldEquipRows.value = [makeRow()]
  }

  // ---- Borrower operations ----
  function toggleBorrowers(row) {
    row.showBorrowers = !row.showBorrowers
  }

  function addBorrower(row) {
    row.borrowers.push(makeBorrower())
    row.showBorrowers = true
  }

  function removeBorrower(row, index) {
    row.borrowers.splice(index, 1)
  }

  // ---- Save / load ----
  function saveRecord() {
    const record = {
      date: recordDate.value,
      savedAt: new Date().toISOString(),
      newEquipRows: JSON.parse(JSON.stringify(newEquipRows.value)),
      oldEquipRows: JSON.parse(JSON.stringify(oldEquipRows.value))
    }
    const idx = history.value.findIndex(r => r.date === recordDate.value)
    if (idx >= 0) history.value[idx] = record
    else history.value.push(record)
    persistHistory()
    return record
  }

  function loadRecord(record) {
    recordDate.value = record.date
    newEquipRows.value = JSON.parse(JSON.stringify(record.newEquipRows))
    oldEquipRows.value = JSON.parse(JSON.stringify(record.oldEquipRows))
  }

  function deleteRecord(date) {
    history.value = history.value.filter(r => r.date !== date)
    persistHistory()
  }

  // ---- Computed helpers ----
  const totalBorrowers = (record) => {
    let count = 0
    ;[...(record.newEquipRows || []), ...(record.oldEquipRows || [])].forEach(
      r => (count += (r.borrowers || []).length)
    )
    return count
  }

  const sortedHistory = computed(() =>
    [...history.value].sort((a, b) => b.date.localeCompare(a.date))
  )

  return {
    recordDate,
    newEquipRows,
    oldEquipRows,
    history,
    sortedHistory,
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
    totalBorrowers
  }
}
