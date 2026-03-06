<template>
  <!-- ============================================================
    DailyRecord.vue
    Sidebar lets you pick which section to work on:
      New Equipment (Section A) or Old Equipment (Section B)
    Each section has its own isolated EquipmentTable.
  ============================================================ -->
  <div class="daily-layout">

    <!-- ── Sidebar ── -->
    <aside class="sidebar">
      <div class="sidebar-title">Equipment</div>

      <button
        class="sidebar-btn"
        :class="{ 'sidebar-btn--active-new': activeSection === 'new' }"
        @click="activeSection = 'new'"
      >
        <span class="sidebar-icon">✦</span>
        <span class="sidebar-text">
          <strong>POWER TOOLS</strong>
          <small>Section A</small>
        </span>
        <span class="sidebar-count sidebar-count--new">{{ newEquipRows.length }}</span>
      </button>

      <button
        class="sidebar-btn"
        :class="{ 'sidebar-btn--active-old': activeSection === 'old' }"
        @click="activeSection = 'old'"
      >
        <span class="sidebar-icon">⚠</span>
        <span class="sidebar-text">
          <strong>Old Equipment</strong>
          <small>Section B</small>
        </span>
        <span class="sidebar-count sidebar-count--old">{{ oldEquipRows.length }}</span>
      </button>

      <div class="sidebar-divider"></div>

      <!-- Date picker inside sidebar -->
      <div class="sidebar-date">
        <label>Record Date</label>
        <input
          type="date"
          :value="recordDate"
          @input="$emit('update:recordDate', $event.target.value)"
        />
      </div>

      <!-- Summary -->
      <div class="sidebar-summary">
        <div class="summary-row">
          <span>Total Rows</span>
          <strong>{{ newEquipRows.length + oldEquipRows.length }}</strong>
        </div>
        <div class="summary-row">
          <span>New</span>
          <strong style="color: var(--accent)">{{ newEquipRows.length }}</strong>
        </div>
        <div class="summary-row">
          <span>Old / Dmg</span>
          <strong style="color: var(--accent2)">{{ oldEquipRows.length }}</strong>
        </div>
      </div>
    </aside>

    <!-- ── Main Content ── -->
    <div class="daily-main">

      <!-- Section A — New / Good (only shown when activeSection === 'new') -->
      <EquipmentTable
        v-show="activeSection === 'new'"
        :rows="newEquipRows"
        section="new"
        section-label="New / Good Condition Equipment"
        section-code="SECTION A"
        :record-date="recordDate"
        @add-row="$emit('add-row', 'new')"
        @add-picked-row="(data) => $emit('add-picked-row', data)"
        @remove-row="(i) => $emit('remove-row', 'new', i)"
        @toggle-borrowers="(row) => $emit('toggle-borrowers', row)"
        @add-borrower="(row) => $emit('add-borrower', row)"
        @remove-borrower="(row, i) => $emit('remove-borrower', row, i)"
        @save-row="(row) => $emit('save-row', 'new', row)"
      />

      <!-- Section B — Old / Damaged (only shown when activeSection === 'old') -->
      <EquipmentTable
        v-show="activeSection === 'old'"
        :rows="oldEquipRows"
        section="old"
        section-label="Old / Damaged Equipment"
        section-code="SECTION B"
        :record-date="recordDate"
        @add-row="$emit('add-row', 'old')"
        @remove-row="(i) => $emit('remove-row', 'old', i)"
        @toggle-borrowers="(row) => $emit('toggle-borrowers', row)"
        @add-borrower="(row) => $emit('add-borrower', row)"
        @remove-borrower="(row, i) => $emit('remove-borrower', row, i)"
        @save-row="(row) => $emit('save-row', 'old', row)"
      />

    </div>

    <!-- ── Sticky Save Bar ── -->
    <div class="save-bar">
      <div class="save-info">
        Record Date: <strong>{{ recordDate }}</strong>
        &nbsp;·&nbsp; Total Rows: {{ newEquipRows.length + oldEquipRows.length }}
      </div>
      <div class="save-actions">
        <button class="btn btn-secondary" @click="$emit('clear-all')">Clear</button>
        <button class="btn btn-primary" @click="$emit('save')">💾 Save Record</button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import EquipmentTable from './EquipmentTable.vue'

defineProps({
  recordDate:    { type: String, required: true },
  newEquipRows:  { type: Array, required: true },
  oldEquipRows:  { type: Array, required: true }
})

defineEmits([
  'update:recordDate',
  'save',
  'clear-all',
  'add-row',
  'add-picked-row',
  'remove-row',
  'toggle-borrowers',
  'add-borrower',
  'remove-borrower',
  'save-row'
])

const activeSection = ref('new')
</script>

<style scoped>
/* ── Layout ── */
.daily-layout {
  display: flex;
  min-height: calc(100vh - 120px);
  position: relative;
}

/* ── Sidebar ── */
.sidebar {
  width: 220px;
  min-width: 220px;
  background: #ffffff;
  border-right: 1.5px solid var(--border);
  padding: 24px 16px 120px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.sidebar-title {
  font-family: 'Nunito', sans-serif;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.8px;
  text-transform: uppercase;
  color: var(--muted);
  padding: 0 6px;
  margin-bottom: 6px;
}

.sidebar-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 12px;
  border-radius: 12px;
  border: 1.5px solid transparent;
  background: none;
  cursor: pointer;
  font-family: 'Nunito', sans-serif;
  color: #000000;
  transition: all 0.18s;
  text-align: left;
  width: 100%;
}

.sidebar-btn:hover {
  background: var(--surface2);
  border-color: var(--border);
}

.sidebar-icon {
  font-size: 16px;
  flex-shrink: 0;
  width: 20px;
  text-align: center;
}

.sidebar-text {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.sidebar-text strong {
  font-size: 13px;
  font-weight: 700;
  color: #000000;
  line-height: 1.3;
}

.sidebar-text small {
  font-size: 10px;
  color: var(--muted);
  letter-spacing: 1px;
  text-transform: uppercase;
  font-weight: 600;
}

.sidebar-count {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
  flex-shrink: 0;
}

.sidebar-count--new {
  background: rgba(138, 106, 74, 0.1);
  color: var(--accent);
  border: 1px solid rgba(138, 106, 74, 0.25);
}

.sidebar-count--old {
  background: rgba(160, 133, 94, 0.1);
  color: var(--accent2);
  border: 1px solid rgba(160, 133, 94, 0.25);
}

/* Active states */
.sidebar-btn--active-new {
  background: rgba(138, 106, 74, 0.08) !important;
  border-color: rgba(138, 106, 74, 0.35) !important;
}
.sidebar-btn--active-new .sidebar-text strong { color: var(--accent); }

.sidebar-btn--active-old {
  background: rgba(160, 133, 94, 0.08) !important;
  border-color: rgba(160, 133, 94, 0.35) !important;
}
.sidebar-btn--active-old .sidebar-text strong { color: var(--accent2); }

/* Divider */
.sidebar-divider {
  height: 1px;
  background: var(--border);
  margin: 4px 0;
}

/* Date inside sidebar */
.sidebar-date {
  padding: 8px 6px 4px;
}

.sidebar-date label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: var(--muted);
  display: block;
  margin-bottom: 6px;
  font-family: 'Nunito', sans-serif;
}

/* Sidebar summary */
.sidebar-summary {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 12px;
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  font-family: 'Nunito', sans-serif;
}

.summary-row span {
  color: var(--muted);
  font-size: 11px;
}

.summary-row strong {
  font-family: 'DM Mono', monospace;
  font-size: 13px;
  color: #000000;
}

/* ── Main content ── */
.daily-main {
  flex: 1;
  padding: 28px 32px 120px;
  min-width: 0;
}

/* ── Save bar ── */
.save-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--surface);
  border-top: 2px solid var(--accent);
  padding: 14px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.06);
  z-index: 10;
}

.save-info {
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  color: var(--muted);
}

.save-info strong { color: #000000; }
.save-actions { display: flex; gap: 10px; }
</style>