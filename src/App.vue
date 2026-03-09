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
    @delete-record="handleDeleteRecord"
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

function handleLoadRecord(record) {
  loadRecord(record)
  tab.value = 'daily'
  showToast('📂 Record loaded for ' + record.date)
}

function handleDeleteRecord(date) {
  deleteRecord(date)
  showToast('🗑 Record deleted')
}

/**
 * Save a single equipment row to history and remove it from the daily record.
 * Triggered when the user clicks "Save & Move to History" in the borrower card modal.
 * section: 'new' | 'old'
 * row: the equipment row object
 */
function handleSaveRow(section, row) {
  // Build a history record snapshot with just this one row
  const today = recordDate.value
  const existing = history.value.find(r => r.date === today)

  if (existing) {
    // Append row to the matching day's section
    if (section === 'new') {
      existing.newEquipRows = [...(existing.newEquipRows || []), JSON.parse(JSON.stringify(row))]
    } else {
      existing.oldEquipRows = [...(existing.oldEquipRows || []), JSON.parse(JSON.stringify(row))]
    }
  } else {
    // Create a new history entry for today with just this row
    history.value.push({
      date: today,
      savedAt: new Date().toISOString(),
      newEquipRows: section === 'new' ? [JSON.parse(JSON.stringify(row))] : [],
      oldEquipRows: section === 'old' ? [JSON.parse(JSON.stringify(row))] : [],
    })
  }
  // Persist to localStorage
  localStorage.setItem('eqt_history', JSON.stringify(history.value))

  // Remove the row from the active daily record
  removeRow(section, section === 'new'
    ? newEquipRows.value.findIndex(r => r.id === row.id)
    : oldEquipRows.value.findIndex(r => r.id === row.id)
  )

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