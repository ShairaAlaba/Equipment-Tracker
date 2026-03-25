<template>
  <!-- ============================================================
    App.vue — Root component
    Coordinates: navigation, daily record view, history view,
    toast notifications, and the useRecords composable.
  ============================================================ -->

  <AppHeader :record-date="recordDate" />
  <AppNav :active-tab="tab" @change="tab = $event" />

  <!-- Daily Record Tab -->
  <DailyRecord
    v-if="tab === 'daily'"
    v-model:record-date="recordDate"
    :new-equip-rows="newEquipRows"
    :old-equip-rows="oldEquipRows"
    :saved-dates="savedDates"
    :has-draft="hasDraft"
    @switch-date="handleSwitchDate"
    @save="handleSave"
    @clear-all="clearAll"
    @add-row="addRow"
    @remove-row="removeRow"
    @toggle-borrowers="toggleBorrowers"
    @add-borrower="addBorrower"
    @remove-borrower="removeBorrower"
    @save-row="handleSaveRow"
  />

  <!-- History Tab -->
  <HistoryView
    v-if="tab === 'history'"
    :history="sortedHistory"
    :total-borrowers="totalBorrowers"
    @load-record="handleLoadRecord"
    @load-record-for-edit="handleLoadRecordForEdit"
    @delete-record="handleDeleteRecord"
    @update-record="handleUpdateRecord"
    @rename-record="handleRenameRecord"
  />

  <!-- Equipment Master Tab -->
  <EquipmentMaster v-if="tab === 'equipment'" />

  <!-- Toast notification -->
  <Transition name="toast-fade">
    <div class="toast" v-if="toastMsg">{{ toastMsg }}</div>
  </Transition>
</template>

<script setup>
import { ref, computed, provide, onMounted } from 'vue'

// Components
import AppHeader   from './components/AppHeader.vue'
import AppNav      from './components/AppNav.vue'
import DailyRecord from './components/DailyRecord.vue'
import HistoryView from './components/HistoryView.vue'
import EquipmentMaster from './components/EquipmentMaster.vue'

// Composable
import { useRecords } from './composables/useRecords.js'

// ---- Tab state ----
const tab = ref('daily')

// ---- Records composable ----



const {
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
} = useRecords()

// Provide all borrow rows to child components (EquipmentTable availability panel)
provide('allEquipRows', computed(() => [
  ...newEquipRows.value,
  ...oldEquipRows.value
]))

// ---- Toast ----
const toastMsg = ref('')
let toastTimer = null

function showToast(msg) {
  toastMsg.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastMsg.value = ''), 2600)
}

// ---- Event handlers ----
function handleSave() {
  saveRecord()
  showToast('✅ Record saved for ' + recordDate.value)
}

function handleSwitchDate(date) {
  switchToDate(date)
  showToast('📅 Switched to ' + date)
}

function handleLoadRecord(record) {
  loadRecord(record)
  tab.value = 'daily'
  showToast('📂 Record loaded for ' + record.date)
}

function handleLoadRecordForEdit(record) {
  loadRecord(record)
  tab.value = 'daily'
  showToast('✏️ Editing record for ' + record.date)
}

function handleDeleteRecord(date) {
  deleteRecord(date)
  showToast('🗑 Record deleted')
}

function handleUpdateRecord(updatedRecord) {
  updateRecord(updatedRecord)
}

function handleRenameRecord({ oldDate, newDate }) {
  renameRecord(oldDate, newDate)
  showToast('📅 Record moved to ' + newDate)
}

/**
 * "Save & Move to History" — called from BorrowerCardModal.
 * Upserts the row into the history record for today:
 *   • If a row with the same ID already exists (put there by saveRecord()),
 *     REPLACE it with the updated version — no duplicate.
 *   • If the row is brand-new (no prior saveRecord()), append it.
 * Then removes the row from the active daily record.
 */
function handleSaveRow(section, row) {
  const today = recordDate.value
  const sectionKey = section === 'new' ? 'newEquipRows' : 'oldEquipRows'
  const rowSnapshot = JSON.parse(JSON.stringify(row))

  const existing = history.value.find(r => r.date === today)

  if (existing) {
    const rows = existing[sectionKey] || []
    const idx = rows.findIndex(r => r.id === row.id)
    if (idx >= 0) {
      // Row already saved → replace it with the updated version
      rows.splice(idx, 1, rowSnapshot)
    } else {
      // Row not yet in history → append
      rows.push(rowSnapshot)
    }
    existing[sectionKey] = rows
    existing.savedAt = new Date().toISOString()
  } else {
    // No history entry for today at all → create one
    const emptyOther = section === 'new' ? 'oldEquipRows' : 'newEquipRows'
    const newEntry = {
      date: today,
      savedAt: new Date().toISOString(),
      newEquipRows: [],
      oldEquipRows: [],
    }
    newEntry[sectionKey] = [rowSnapshot]
    newEntry[emptyOther] = []
    history.value.push(newEntry)
  }

  // Persist to localStorage
  localStorage.setItem('eqt_history', JSON.stringify(history.value))

  // Remove the row from the active daily record
  const rowIndex = (section === 'new' ? newEquipRows : oldEquipRows).value.findIndex(r => r.id === row.id)
  if (rowIndex >= 0) removeRow(section, rowIndex)

  showToast('✅ Row saved to History for ' + today)
}

// ---- Init ----
onMounted(loadHistory)
</script>

<style>
/* Toast transition */
.toast-fade-enter-active { animation: fadeInOut 2.6s ease forwards; }
.toast-fade-leave-active { opacity: 0; }
</style>