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
  />

  <!-- History Tab -->
  <HistoryView
    v-if="tab === 'history'"
    :history="sortedHistory"
    :total-borrowers="totalBorrowers"
    @load-record="handleLoadRecord"
    @delete-record="handleDeleteRecord"
  />

  <!-- Toast notification -->
  <Transition name="toast-fade">
    <div class="toast" v-if="toastMsg">{{ toastMsg }}</div>
  </Transition>
   <EquipmentMaster />
</template>

<script setup>
import { ref, onMounted } from 'vue'

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

// ---- Init ----
onMounted(loadHistory)
</script>

<style>
/* Toast transition */
.toast-fade-enter-active { animation: fadeInOut 2.6s ease forwards; }
.toast-fade-leave-active { opacity: 0; }
</style>
