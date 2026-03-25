// src/composables/useRecords.js
// ============================================================
//  Central state & business logic for the Equipment Tracker
// ============================================================

import { ref, computed, watch } from 'vue'

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
    // Check-out
    conditionCheckout: '',
    conditionCheckoutNotes: '',
    // Withdrawal
    withdraw: 0,       // qty withdrawn (number)
    dateBorrowed: '',
    timeBorrowed: '',
    // Return
    returned: false,   // true once the borrower has returned the item
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
    // Also restore the active daily record if one was in-progress
    try {
      const savedActive = localStorage.getItem('eqt_active_record')
      if (savedActive) {
        const active = JSON.parse(savedActive)
        if (active.recordDate) recordDate.value = active.recordDate
        if (active.newEquipRows && active.newEquipRows.length) newEquipRows.value = active.newEquipRows
        if (active.oldEquipRows && active.oldEquipRows.length) oldEquipRows.value = active.oldEquipRows
      }
    } catch (e) {
      console.error('Failed to load active record', e)
    }
  }

  function persistHistory() {
    localStorage.setItem('eqt_history', JSON.stringify(history.value))
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
    persistActive()
    return record
  }

  function loadRecord(record) {
    recordDate.value = record.date
    newEquipRows.value = JSON.parse(JSON.stringify(record.newEquipRows))
    oldEquipRows.value = JSON.parse(JSON.stringify(record.oldEquipRows))
    persistActive()
  }

  function deleteRecord(date) {
    history.value = history.value.filter(r => r.date !== date)
    persistHistory()
  }

  /** Replace an existing record in-place (used by HistoryView inline edits) */
  function updateRecord(updatedRecord) {
    const idx = history.value.findIndex(r => r.date === updatedRecord.date)
    if (idx !== -1) {
      history.value.splice(idx, 1, { ...updatedRecord })
    }
    persistHistory()
  }

  /** Rename a record's date key — moves it from oldDate to newDate.
   *  If newDate already exists, merges rows into it and removes oldDate. */
  function renameRecord(oldDate, newDate) {
    const srcIdx = history.value.findIndex(r => r.date === oldDate)
    if (srcIdx === -1) return
    const src = history.value[srcIdx]

    const destIdx = history.value.findIndex(r => r.date === newDate)
    if (destIdx !== -1) {
      // Merge into existing record
      const dest = history.value[destIdx]
      dest.newEquipRows = [...(dest.newEquipRows || []), ...(src.newEquipRows || [])]
      dest.oldEquipRows = [...(dest.oldEquipRows || []), ...(src.oldEquipRows || [])]
      dest.savedAt = new Date().toISOString()
      history.value.splice(srcIdx, 1)
    } else {
      // Simple rename
      history.value.splice(srcIdx, 1, { ...src, date: newDate, savedAt: new Date().toISOString() })
    }
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

  // Auto-persist whenever rows or date change (covers inline edits)
  watch([recordDate, newEquipRows, oldEquipRows], () => {
    persistActive()
  }, { deep: true })

  const sortedHistory = computed(() =>
    [...history.value].sort((a, b) => b.date.localeCompare(a.date))
  )

  // ---- Set of dates that have a saved history record ----
  const savedDates = computed(() => new Set(history.value.map(r => r.date)))

  // ---- True when the active daily record has any non-empty rows ----
  const hasDraft = computed(() => {
    const hasData = rows => rows.some(r =>
      r.codeNo || r.toolName || r.borrowers.length > 0
    )
    return hasData(newEquipRows.value) || hasData(oldEquipRows.value)
  })

  // ---- Switch active date; auto-load saved record if one exists ----
  function switchToDate(date) {
    const existing = history.value.find(r => r.date === date)
    if (existing) {
      // Load the saved record for that date into the daily view
      recordDate.value = existing.date
      newEquipRows.value = JSON.parse(JSON.stringify(existing.newEquipRows || [makeRow()]))
      oldEquipRows.value = JSON.parse(JSON.stringify(existing.oldEquipRows || [makeRow()]))
      // Ensure at least one blank row per section
      if (!newEquipRows.value.length) newEquipRows.value = [makeRow()]
      if (!oldEquipRows.value.length) oldEquipRows.value = [makeRow()]
    } else {
      // No saved record — clear rows and set the date
      recordDate.value = date
      newEquipRows.value = [makeRow()]
      oldEquipRows.value = [makeRow()]
    }
    persistActive()
  }

  return {
    recordDate,
    newEquipRows,
    oldEquipRows,
    history,
    sortedHistory,
    savedDates,
    hasDraft,
    loadHistory,
    switchToDate,
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