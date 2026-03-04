<template>
  <div class="history-wrap">

    <!-- ══════════════════════════════════════
         TOOLBAR
    ══════════════════════════════════════ -->
    <div class="toolbar">

      <!-- Search bar -->
      <div class="tb-search-wrap">
        <span class="search-icon">🔍</span>
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Search by name, last name, or equipment…"
          class="search-input"
        />
        <button v-if="searchQuery" class="clear-x" @click="searchQuery = ''" title="Clear search">✕</button>
      </div>

      <div class="tb-right">
        <!-- Date filter -->
        <div class="tb-group">
          <label class="tb-label">Date</label>
          <input type="date" v-model="searchDate" class="date-input" />
          <button v-if="searchDate" class="clear-x small" @click="searchDate = ''">✕</button>
        </div>

        <!-- View mode toggle -->
        <div class="view-toggle">
          <button :class="['vt', { 'vt--active': viewMode === 'all' }]"     @click="viewMode = 'all'">All</button>
          <button :class="['vt', { 'vt--active': viewMode === 'weekly' }]"  @click="viewMode = 'weekly'">Weekly</button>
          <button :class="['vt', { 'vt--active': viewMode === 'monthly' }]" @click="viewMode = 'monthly'">Monthly</button>
        </div>

        <!-- Count pill -->
        <div class="result-pill">
          <span class="result-num">{{ flatFiltered.length }}</span>
          <span class="result-lbl">record{{ flatFiltered.length !== 1 ? 's' : '' }}</span>
        </div>
      </div>

    </div>

    <!-- search hint when results are from query -->
    <div v-if="searchQuery && flatFiltered.length > 0" class="search-hint">
      Showing results for <strong>"{{ searchQuery }}"</strong>
      <button class="clear-hint" @click="searchQuery = ''">Clear search</button>
    </div>

    <!-- ══════════════════════════════════════
         EMPTY STATE
    ══════════════════════════════════════ -->
    <div v-if="flatFiltered.length === 0" class="empty-state">
      <div class="empty-icon">🗂</div>
      <p v-if="searchQuery || searchDate">No records match your search.</p>
      <p v-else>No records yet.</p>
      <p class="sub">Save a daily record first from the <strong>Daily Record</strong> tab.</p>
    </div>

    <!-- ══════════════════════════════════════
         ALL VIEW — flat pink card list
    ══════════════════════════════════════ -->
    <template v-if="viewMode === 'all' && flatFiltered.length > 0">
      <div class="record-list">
        <div
          v-for="rec in flatFiltered"
          :key="rec.date"
          class="record-row"
          @click="openRecord(rec)"
        >
          <div class="rec-date">{{ rec.date }}</div>
          <div class="rec-stats">
            <span>{{ totalRows(rec) }} row{{ totalRows(rec) !== 1 ? 's' : '' }}</span>
            <span class="dot-sep">·</span>
            <span>{{ totalBorrowers(rec) }} borrower{{ totalBorrowers(rec) !== 1 ? 's' : '' }}</span>
          </div>
          <button class="edit-btn" @click.stop="openRecord(rec)">VIEW</button>
        </div>
      </div>
    </template>

    <!-- ══════════════════════════════════════
         WEEKLY VIEW
    ══════════════════════════════════════ -->
    <template v-if="viewMode === 'weekly' && flatFiltered.length > 0">
      <div v-for="week in groupedWeekly" :key="week.key" class="period-block">

        <!-- Week header -->
        <div class="period-header period-header--week">
          <div class="period-left">
            <span class="period-badge badge--week">WEEK</span>
            <div class="period-info">
              <span class="period-title">{{ week.label }}</span>
              <span class="period-meta">
                {{ week.records.length }} day{{ week.records.length !== 1 ? 's' : '' }}
                &nbsp;·&nbsp;
                {{ groupTotalRows(week.records) }} equipment rows
                &nbsp;·&nbsp;
                {{ groupTotalBorrowers(week.records) }} borrowers
              </span>
            </div>
          </div>
          <button class="print-group-btn" @click="printGroup(week.records, 'Weekly Report', week.label)">
            🖨 Print Week
          </button>
        </div>

        <!-- Records in this week -->
        <div class="record-list period-inner">
          <div
            v-for="rec in week.records"
            :key="rec.date"
            class="record-row"
            @click="openRecord(rec)"
          >
            <div class="rec-date">{{ rec.date }}</div>
            <div class="rec-stats">
              <span>{{ totalRows(rec) }} row{{ totalRows(rec) !== 1 ? 's' : '' }}</span>
              <span class="dot-sep">·</span>
              <span>{{ totalBorrowers(rec) }} borrower{{ totalBorrowers(rec) !== 1 ? 's' : '' }}</span>
            </div>
            <button class="edit-btn" @click.stop="openRecord(rec)">VIEW</button>
          </div>
        </div>

      </div>
    </template>

    <!-- ══════════════════════════════════════
         MONTHLY VIEW
    ══════════════════════════════════════ -->
    <template v-if="viewMode === 'monthly' && flatFiltered.length > 0">
      <div v-for="month in groupedMonthly" :key="month.key" class="period-block">

        <!-- Month header -->
        <div class="period-header period-header--month">
          <div class="period-left">
            <span class="period-badge badge--month">MONTH</span>
            <div class="period-info">
              <span class="period-title">{{ month.label }}</span>
              <span class="period-meta">
                {{ month.records.length }} day{{ month.records.length !== 1 ? 's' : '' }}
                &nbsp;·&nbsp;
                {{ groupTotalRows(month.records) }} equipment rows
                &nbsp;·&nbsp;
                {{ groupTotalBorrowers(month.records) }} borrowers
              </span>
            </div>
          </div>
          <button class="print-group-btn" @click="printGroup(month.records, 'Monthly Report', month.label)">
            🖨 Print Month
          </button>
        </div>

        <!-- Records in this month -->
        <div class="record-list period-inner">
          <div
            v-for="rec in month.records"
            :key="rec.date"
            class="record-row"
            @click="openRecord(rec)"
          >
            <div class="rec-date">{{ rec.date }}</div>
            <div class="rec-stats">
              <span>{{ totalRows(rec) }} row{{ totalRows(rec) !== 1 ? 's' : '' }}</span>
              <span class="dot-sep">·</span>
              <span>{{ totalBorrowers(rec) }} borrower{{ totalBorrowers(rec) !== 1 ? 's' : '' }}</span>
            </div>
            <button class="edit-btn" @click.stop="openRecord(rec)">VIEW</button>
          </div>
        </div>

      </div>
    </template>

    <!-- ══════════════════════════════════════
         DETAIL MODAL
    ══════════════════════════════════════ -->
    <div class="modal-overlay" v-if="viewing" @click.self="viewing = null">
      <div class="modal-box" ref="modalBox">

        <div class="modal-toolbar">
          <div class="modal-title">📋 Record — {{ viewing.date }}</div>
          <div class="modal-actions">
            <button class="btn btn-secondary btn-sm" @click="loadIntoEditor">✏️ Edit This Record</button>
            <button class="btn btn-primary btn-sm"   @click="printSingle(viewing)">🖨 Print</button>
            <button class="btn btn-danger btn-sm"    @click="confirmDelete(viewing.date)">🗑 Delete</button>
            <button class="btn btn-secondary btn-sm" @click="viewing = null">✕ Close</button>
          </div>
        </div>

        <div class="print-content" id="modal-print-area">

          <!-- Screen-only print header placeholder (hidden on screen, shown in print via printSingle) -->
          <div class="print-only print-doc-header">
            <div>
              <div class="doc-title">EQT Tracker — Equipment Record</div>
              <div class="doc-sub">Equipment Borrow Management System</div>
            </div>
            <div class="doc-meta">
              <div>Date: <strong>{{ viewing.date }}</strong></div>
              <div>Printed: {{ new Date().toLocaleString() }}</div>
            </div>
          </div>

          <!-- Section A -->
          <div class="detail-section">
            <div class="detail-section-header header-new">
              ✦ Section A — New / Good Condition Equipment
              <span class="section-count">({{ (viewing.newEquipRows || []).length }} items)</span>
            </div>
            <div v-if="!viewing.newEquipRows || viewing.newEquipRows.length === 0" class="no-data">No entries for this section.</div>
            <div v-for="(row, ri) in viewing.newEquipRows" :key="'n'+ri" class="equip-card">
              <div class="equip-info-row">
                <div class="equip-num">{{ ri + 1 }}</div>
                <div class="equip-fields">
                  <div class="field-group"><span class="field-lbl">Equipment / Tool</span><span class="field-val bold">{{ row.toolName || '—' }}</span></div>
                  <div class="field-group"><span class="field-lbl">Code No.</span><span class="field-val mono">{{ row.codeNo || '—' }}</span></div>
                  <div class="field-group"><span class="field-lbl">Total QTY</span><span class="field-val mono">{{ row.totalQty || '—' }}</span></div>
                  <div class="field-group"><span class="field-lbl">Withdrawn</span><span class="field-val mono chip-blue">{{ sumWithdrawn(row) }}</span></div>
                  <div class="field-group"><span class="field-lbl">Available</span><span class="field-val" :class="calcAvail(row) <= 0 ? 'chip-red' : 'chip-green'">{{ calcAvail(row) <= 0 ? 'None' : calcAvail(row) }}</span></div>
                  <div class="field-group"><span class="field-lbl">Condition</span><span class="field-val" :class="'condition-'+row.condition">{{ row.condition || '—' }}</span></div>
                  <div class="field-group" v-if="row.damageNotes"><span class="field-lbl">Damage Notes</span><span class="field-val">{{ row.damageNotes }}</span></div>
                  <div class="field-group"><span class="field-lbl">Accessories</span><span class="field-val">{{ row.accessoriesReturned === true ? '✅ YES' : row.accessoriesReturned === false ? '❌ NO' : '—' }}</span></div>
                  <div class="field-group" v-if="row.remarks"><span class="field-lbl">Remarks</span><span class="field-val">{{ row.remarks }}</span></div>
                </div>
              </div>
              <div v-if="row.borrowers && row.borrowers.length" class="borrowers-block">
                <div class="borrowers-title">Borrower Records</div>
                <table class="detail-table">
                  <thead><tr><th>#</th><th>Borrower Name</th><th>Project</th><th>Control No.</th><th>Withdraw</th><th>Date Borrowed</th><th>Time</th><th>Return Date</th><th>Return Time</th><th>Checkout Cond.</th><th>Return Cond.</th></tr></thead>
                  <tbody>
                    <tr v-for="(b, bi) in row.borrowers" :key="bi">
                      <td class="tc">{{ bi+1 }}</td><td>{{ b.name||'—' }}</td><td>{{ b.project||'—' }}</td>
                      <td class="mono">{{ b.controlNo||'—' }}</td><td class="tc mono chip-blue">{{ b.withdraw||0 }}</td>
                      <td class="mono">{{ b.dateBorrowed||'—' }}</td><td class="mono">{{ b.timeBorrowed||'—' }}</td>
                      <td class="mono">{{ b.returnDate||'—' }}</td><td class="mono">{{ b.returnTime||'—' }}</td>
                      <td><span :class="'condition-'+b.conditionCheckout">{{ b.conditionCheckout||'—' }}</span></td>
                      <td><span :class="'condition-'+b.conditionReturn">{{ b.conditionReturn||'—' }}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="no-borrowers-note">No borrower entries.</div>
            </div>
          </div>

          <!-- Section B -->
          <div class="detail-section">
            <div class="detail-section-header header-old">
              ⚠ Section B — Old / Damaged Equipment
              <span class="section-count">({{ (viewing.oldEquipRows || []).length }} items)</span>
            </div>
            <div v-if="!viewing.oldEquipRows || viewing.oldEquipRows.length === 0" class="no-data">No entries for this section.</div>
            <div v-for="(row, ri) in viewing.oldEquipRows" :key="'o'+ri" class="equip-card equip-card--old">
              <div class="equip-info-row">
                <div class="equip-num">{{ ri + 1 }}</div>
                <div class="equip-fields">
                  <div class="field-group"><span class="field-lbl">Equipment / Tool</span><span class="field-val bold">{{ row.toolName || '—' }}</span></div>
                  <div class="field-group"><span class="field-lbl">Code No.</span><span class="field-val mono">{{ row.codeNo || '—' }}</span></div>
                  <div class="field-group"><span class="field-lbl">Total QTY</span><span class="field-val mono">{{ row.totalQty || '—' }}</span></div>
                  <div class="field-group"><span class="field-lbl">Condition</span><span class="field-val" :class="'condition-'+row.condition">{{ row.condition || '—' }}</span></div>
                  <div class="field-group" v-if="row.damageNotes"><span class="field-lbl">Damage Notes</span><span class="field-val">{{ row.damageNotes }}</span></div>
                  <div class="field-group"><span class="field-lbl">Accessories</span><span class="field-val">{{ row.accessoriesReturned === true ? '✅ YES' : row.accessoriesReturned === false ? '❌ NO' : '—' }}</span></div>
                  <div class="field-group" v-if="row.remarks"><span class="field-lbl">Remarks</span><span class="field-val">{{ row.remarks }}</span></div>
                </div>
              </div>
              <div v-if="row.borrowers && row.borrowers.length" class="borrowers-block">
                <div class="borrowers-title">Borrower Records</div>
                <table class="detail-table">
                  <thead><tr><th>#</th><th>Borrower Name</th><th>Project</th><th>Control No.</th><th>Date Borrowed</th><th>Time</th><th>Return Date</th><th>Return Time</th></tr></thead>
                  <tbody>
                    <tr v-for="(b, bi) in row.borrowers" :key="bi">
                      <td class="tc">{{ bi+1 }}</td><td>{{ b.name||'—' }}</td><td>{{ b.project||'—' }}</td>
                      <td class="mono">{{ b.controlNo||'—' }}</td>
                      <td class="mono">{{ b.dateBorrowed||'—' }}</td><td class="mono">{{ b.timeBorrowed||'—' }}</td>
                      <td class="mono">{{ b.returnDate||'—' }}</td><td class="mono">{{ b.returnTime||'—' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="no-borrowers-note">No borrower entries.</div>
            </div>
          </div>

        </div><!-- /print-content -->
      </div><!-- /modal-box -->
    </div><!-- /modal-overlay -->

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  history:        { type: Array,    required: true },
  totalBorrowers: { type: Function, required: true }
})

const emit = defineEmits(['load-record', 'delete-record'])

// ── State ──────────────────────────────────────────────────────
const searchQuery = ref('')
const searchDate  = ref('')
const viewMode    = ref('all')   // 'all' | 'weekly' | 'monthly'
const viewing     = ref(null)

// ── Row helpers ────────────────────────────────────────────────
function sumWithdrawn(row) {
  return (row.borrowers || []).reduce((s, b) => s + (parseInt(b.withdraw) || 0), 0)
}
function calcAvail(row) {
  return (parseInt(row.totalQty) || 0) - sumWithdrawn(row)
}
function totalRows(rec) {
  return (rec.newEquipRows || []).length + (rec.oldEquipRows || []).length
}
function totalBorrowers(rec) {
  const all = [...(rec.newEquipRows || []), ...(rec.oldEquipRows || [])]
  return all.reduce((s, r) => s + (r.borrowers || []).length, 0)
}
function groupTotalRows(records) {
  return records.reduce((s, r) => s + totalRows(r), 0)
}
function groupTotalBorrowers(records) {
  return records.reduce((s, r) => s + totalBorrowers(r), 0)
}

// ── Search matching ────────────────────────────────────────────
// Searches borrower names (first + last) AND equipment/tool names
function matchesQuery(rec, q) {
  if (!q) return true
  const lower = q.toLowerCase().trim()
  const allRows = [...(rec.newEquipRows || []), ...(rec.oldEquipRows || [])]
  // Equipment name match
  const equipHit = allRows.some(row =>
    (row.toolName || '').toLowerCase().includes(lower)
  )
  // Borrower name / project match
  const borrowerHit = allRows.some(row =>
    (row.borrowers || []).some(b =>
      (b.name    || '').toLowerCase().includes(lower) ||
      (b.project || '').toLowerCase().includes(lower)
    )
  )
  return equipHit || borrowerHit
}

// ── Filtered flat list (used by all three views) ───────────────
const flatFiltered = computed(() => {
  let list = [...props.history].sort((a, b) => b.date.localeCompare(a.date))
  if (searchDate.value)       list = list.filter(r => r.date === searchDate.value)
  if (searchQuery.value.trim()) list = list.filter(r => matchesQuery(r, searchQuery.value))
  return list
})

// ── Week grouping helpers ──────────────────────────────────────
function getMondayKey(dateStr) {
  const d   = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()                      // 0=Sun … 6=Sat
  const mon = new Date(d)
  mon.setDate(d.getDate() - ((day + 6) % 7))  // roll back to Monday
  return mon.toISOString().slice(0, 10)
}

function weekLabel(mondayStr) {
  const mon = new Date(mondayStr + 'T00:00:00')
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  const fmt = { month: 'short', day: 'numeric' }
  return `${mon.toLocaleDateString('en-US', fmt)} – ${sun.toLocaleDateString('en-US', { ...fmt, year: 'numeric' })}`
}

// ── Month grouping helpers ─────────────────────────────────────
function getMonthKey(dateStr) { return dateStr.slice(0, 7) }

function monthLabel(key) {
  const [y, m] = key.split('-')
  return new Date(+y, +m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

// ── Grouped computeds ──────────────────────────────────────────
const groupedWeekly = computed(() => {
  const map = new Map()
  for (const rec of flatFiltered.value) {
    const key = getMondayKey(rec.date)
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(rec)
  }
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, records]) => ({
      key,
      label:   weekLabel(key),
      records: records.sort((a, b) => b.date.localeCompare(a.date))
    }))
})

const groupedMonthly = computed(() => {
  const map = new Map()
  for (const rec of flatFiltered.value) {
    const key = getMonthKey(rec.date)
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(rec)
  }
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, records]) => ({
      key,
      label:   monthLabel(key),
      records: records.sort((a, b) => b.date.localeCompare(a.date))
    }))
})

// ── Modal ──────────────────────────────────────────────────────
function openRecord(rec) { viewing.value = rec }

function confirmDelete(date) {
  if (confirm(`Delete record for ${date}? This cannot be undone.`)) {
    emit('delete-record', date)
    viewing.value = null
  }
}

function loadIntoEditor() {
  emit('load-record', viewing.value)
  viewing.value = null
}

// ══════════════════════════════════════════════════════════════
// SHARED PRINT CSS
// ══════════════════════════════════════════════════════════════
const PRINT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Nunito',sans-serif;font-size:11px;color:#000;background:#fff;padding:18px 22px}

/* ── Print header ── */
.print-header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2.5px solid #8a6a4a;padding-bottom:10px;margin-bottom:16px}
.print-header h1{font-size:17px;font-weight:800;letter-spacing:2px;text-transform:uppercase;font-family:'Nunito',sans-serif}
.print-header .sub{font-size:10px;color:#666;margin-top:3px}
.print-header .meta{font-size:10px;color:#555;text-align:right;line-height:1.7}
.print-header .meta strong{color:#000}

/* ── Period divider (weekly/monthly only) ── */
.period-divider{margin:22px 0 10px;padding:7px 14px;background:#f5ede0;border-radius:6px;border-left:4px solid #8a6a4a;font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#5a3a1a;display:flex;justify-content:space-between;align-items:center}
.period-divider .pd-meta{font-weight:400;opacity:0.7;font-size:9.5px;letter-spacing:0}
.period-divider--month{background:#fff0ee;border-left-color:#b83232;color:#7a1a1a}

/* ── Day separator ── */
.day-header{margin:14px 0 8px;padding:4px 10px;background:#fdfaf6;border-bottom:1px solid #e0d5c5;font-family:'DM Mono',monospace;font-size:11px;font-weight:700;color:#5a3a1a}

/* ── Sections ── */
.detail-section{margin-bottom:14px}
.detail-section-header{font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;padding:5px 10px;border-radius:5px;margin-bottom:7px}
.header-new{background:#f5ede0;color:#5a3a1a;border-left:4px solid #8a6a4a}
.header-old{background:#fff0ee;color:#7a1a1a;border-left:4px solid #b83232}
.section-count{font-weight:400;margin-left:6px;opacity:0.65}

/* ── Equipment cards ── */
.equip-card{background:#fff;border:1px solid #ddd0bc;border-radius:6px;padding:8px 12px;margin-bottom:8px;page-break-inside:avoid}
.equip-card--old{border-color:#e8cfc0;background:#fffaf8}
.equip-info-row{display:flex;gap:8px;align-items:flex-start;margin-bottom:6px}
.equip-num{min-width:20px;height:20px;background:#f0e8dc;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:10px;color:#5a3a1a;flex-shrink:0}
.equip-fields{display:flex;flex-wrap:wrap;gap:10px;flex:1}
.field-group{display:flex;flex-direction:column;min-width:80px}
.field-lbl{font-size:7.5px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#888;margin-bottom:1px}
.field-val{font-size:10.5px;color:#000}
.bold{font-weight:700}
.mono{font-family:'DM Mono',monospace;font-size:9.5px}
.chip-blue{color:#2a6099;font-weight:700}
.chip-green{color:#2a7a22;font-weight:700}
.chip-red{color:#b83232;font-weight:700}

/* ── Conditions ── */
.condition-excellent{color:#2a7a22;font-weight:700}
.condition-good{color:#2a5090;font-weight:700}
.condition-fair{color:#8a6200;font-weight:700}
.condition-poor{color:#b83232;font-weight:700}

/* ── Borrower tables ── */
.borrowers-title{font-size:8px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#888;margin-bottom:5px}
.detail-table{width:100%;border-collapse:collapse;font-size:8.5px}
.detail-table thead th{background:#f5ede0;color:#000;font-weight:800;font-size:7.5px;letter-spacing:0.8px;text-transform:uppercase;padding:4px 6px;border:1px solid #c8b090;text-align:left;white-space:nowrap}
.detail-table tbody td{padding:3.5px 6px;border:1px solid #ddd0bc;vertical-align:middle}
.detail-table tbody tr:nth-child(even) td{background:#fffdf9}
.tc{text-align:center}
.no-borrowers-note{font-size:9px;color:#aaa;font-style:italic;padding:3px 0}
.no-data{font-size:9.5px;color:#aaa;font-style:italic;padding:4px 0 8px}

/* ── Footer ── */
.print-footer{margin-top:18px;border-top:1px solid #ddd0bc;padding-top:7px;display:flex;justify-content:space-between;font-size:8.5px;color:#888}

@page{size:A4 landscape;margin:12mm 10mm}
`

// ══════════════════════════════════════════════════════════════
// BUILD HTML FOR ONE RECORD (used by both single + group print)
// ══════════════════════════════════════════════════════════════
function buildRecordHTML(rec) {
  function cond(c) { return c ? `condition-${c}` : '' }

  function borrowerRowsNew(borrowers) {
    return (borrowers || []).map((b, bi) => `
      <tr>
        <td class="tc">${bi + 1}</td>
        <td>${b.name || '—'}</td>
        <td>${b.project || '—'}</td>
        <td class="mono">${b.controlNo || '—'}</td>
        <td class="tc mono chip-blue">${b.withdraw || 0}</td>
        <td class="mono">${b.dateBorrowed || '—'}</td>
        <td class="mono">${b.timeBorrowed || '—'}</td>
        <td class="mono">${b.returnDate || '—'}</td>
        <td class="mono">${b.returnTime || '—'}</td>
        <td><span class="${cond(b.conditionCheckout)}">${b.conditionCheckout || '—'}</span></td>
        <td><span class="${cond(b.conditionReturn)}">${b.conditionReturn || '—'}</span></td>
      </tr>`).join('')
  }

  function borrowerRowsOld(borrowers) {
    return (borrowers || []).map((b, bi) => `
      <tr>
        <td class="tc">${bi + 1}</td>
        <td>${b.name || '—'}</td>
        <td>${b.project || '—'}</td>
        <td class="mono">${b.controlNo || '—'}</td>
        <td class="mono">${b.dateBorrowed || '—'}</td>
        <td class="mono">${b.timeBorrowed || '—'}</td>
        <td class="mono">${b.returnDate || '—'}</td>
        <td class="mono">${b.returnTime || '—'}</td>
      </tr>`).join('')
  }

  function equipCards(rows, isNew) {
    if (!rows || rows.length === 0) return '<p class="no-data">No entries.</p>'
    return rows.map((row, ri) => {
      const withdrawn = (row.borrowers || []).reduce((s, b) => s + (parseInt(b.withdraw) || 0), 0)
      const avail     = (parseInt(row.totalQty) || 0) - withdrawn
      const hasBorrow = row.borrowers && row.borrowers.length > 0

      const extraFields = isNew
        ? `<div class="field-group"><span class="field-lbl">Total QTY</span><span class="field-val mono">${row.totalQty || '—'}</span></div>
           <div class="field-group"><span class="field-lbl">Withdrawn</span><span class="field-val mono chip-blue">${withdrawn}</span></div>
           <div class="field-group"><span class="field-lbl">Available</span><span class="field-val ${avail <= 0 ? 'chip-red' : 'chip-green'}">${avail <= 0 ? 'None' : avail}</span></div>`
        : `<div class="field-group"><span class="field-lbl">Total QTY</span><span class="field-val mono">${row.totalQty || '—'}</span></div>`

      const borrowerBlock = hasBorrow
        ? (isNew
          ? `<div class="borrowers-title">Borrower Records</div>
             <table class="detail-table"><thead><tr><th>#</th><th>Borrower Name</th><th>Project</th><th>Control No.</th><th>Withdraw</th><th>Date Borrowed</th><th>Time</th><th>Return Date</th><th>Return Time</th><th>Checkout Cond.</th><th>Return Cond.</th></tr></thead>
             <tbody>${borrowerRowsNew(row.borrowers)}</tbody></table>`
          : `<div class="borrowers-title">Borrower Records</div>
             <table class="detail-table"><thead><tr><th>#</th><th>Borrower Name</th><th>Project</th><th>Control No.</th><th>Date Borrowed</th><th>Time</th><th>Return Date</th><th>Return Time</th></tr></thead>
             <tbody>${borrowerRowsOld(row.borrowers)}</tbody></table>`)
        : '<p class="no-borrowers-note">No borrower entries.</p>'

      return `
        <div class="equip-card ${isNew ? '' : 'equip-card--old'}">
          <div class="equip-info-row">
            <div class="equip-num">${ri + 1}</div>
            <div class="equip-fields">
              <div class="field-group"><span class="field-lbl">Equipment</span><span class="field-val bold">${row.toolName || '—'}</span></div>
              <div class="field-group"><span class="field-lbl">Code No.</span><span class="field-val mono">${row.codeNo || '—'}</span></div>
              ${extraFields}
              <div class="field-group"><span class="field-lbl">Condition</span><span class="field-val ${cond(row.condition)}">${row.condition || '—'}</span></div>
              ${row.damageNotes ? `<div class="field-group"><span class="field-lbl">Damage Notes</span><span class="field-val">${row.damageNotes}</span></div>` : ''}
              <div class="field-group"><span class="field-lbl">Accessories</span><span class="field-val">${row.accessoriesReturned === true ? '✅ YES' : row.accessoriesReturned === false ? '❌ NO' : '—'}</span></div>
              ${row.remarks ? `<div class="field-group"><span class="field-lbl">Remarks</span><span class="field-val">${row.remarks}</span></div>` : ''}
            </div>
          </div>
          <div class="borrowers-block">${borrowerBlock}</div>
        </div>`
    }).join('')
  }

  const newCount = (rec.newEquipRows || []).length
  const oldCount = (rec.oldEquipRows || []).length

  return `
    <div>
      <div class="detail-section">
        <div class="detail-section-header header-new">✦ Section A — New / Good Condition Equipment <span class="section-count">(${newCount} items)</span></div>
        ${equipCards(rec.newEquipRows, true)}
      </div>
      <div class="detail-section">
        <div class="detail-section-header header-old">⚠ Section B — Old / Damaged Equipment <span class="section-count">(${oldCount} items)</span></div>
        ${equipCards(rec.oldEquipRows, false)}
      </div>
    </div>`
}

// ── Print a single record ──────────────────────────────────────
function printSingle(rec) {
  const win = window.open('', '_blank', 'width=1100,height=800')
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>EQT Record — ${rec.date}</title>
<style>${PRINT_CSS}</style></head><body>
<div class="print-header">
  <div><h1>📋 EQT Tracker — Daily Record</h1><p class="sub">Equipment Borrow Management System</p></div>
  <div class="meta">Date: <strong>${rec.date}</strong><br/>Printed: ${new Date().toLocaleString()}</div>
</div>
${buildRecordHTML(rec)}
<div class="print-footer">
  <span>EQT Tracker — Equipment Borrow Management System</span>
  <span>Printed ${new Date().toLocaleDateString()}</span>
</div>
<script>window.onload=()=>window.print()<\/script>
</body></html>`)
  win.document.close()
}

// ── Print a group of records (weekly or monthly) ───────────────
function printGroup(records, reportType, periodLabel) {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date))
  const days   = sorted.length
  const totalB = sorted.reduce((s, r) => s + totalBorrowers(r), 0)
  const totalR = sorted.reduce((s, r) => s + totalRows(r), 0)

  const isMonth = reportType.toLowerCase().includes('month')
  const divClass = isMonth ? 'period-divider period-divider--month' : 'period-divider'

  const bodyHTML = sorted.map(rec => `
    <div class="${divClass}" style="margin-top:18px">
      <span>📅 ${rec.date}</span>
      <span class="pd-meta">${totalRows(rec)} rows · ${totalBorrowers(rec)} borrowers</span>
    </div>
    ${buildRecordHTML(rec)}
  `).join('')

  const win = window.open('', '_blank', 'width=1200,height=900')
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>EQT ${reportType} — ${periodLabel}</title>
<style>${PRINT_CSS}</style></head><body>
<div class="print-header">
  <div>
    <h1>📋 EQT Tracker — ${reportType}</h1>
    <p class="sub">${periodLabel}</p>
  </div>
  <div class="meta">
    Period: <strong>${periodLabel}</strong><br/>
    ${days} day${days !== 1 ? 's' : ''} &nbsp;·&nbsp; ${totalR} equipment rows &nbsp;·&nbsp; ${totalB} borrowers<br/>
    Printed: ${new Date().toLocaleString()}
  </div>
</div>
${bodyHTML}
<div class="print-footer">
  <span>EQT Tracker — Equipment Borrow Management System</span>
  <span>Generated ${new Date().toLocaleDateString()}</span>
</div>
<script>window.onload=()=>window.print()<\/script>
</body></html>`)
  win.document.close()
}
</script>

<style scoped>
.history-wrap {
  padding: 28px 32px 60px;
  max-width: 960px;
  margin: 0 auto;
}

/* ════════════════════════
   TOOLBAR
════════════════════════ */
.toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 10px;
  flex-wrap: wrap;
  background: #ffffff;
  border: 1.5px solid var(--border);
  border-radius: 12px;
  padding: 14px 18px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
}

/* Search wrap */
.tb-search-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 220px;
  background: #fdfaf6;
  border: 1.5px solid var(--border);
  border-radius: 9px;
  padding: 0 10px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.tb-search-wrap:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(138,106,74,0.1);
}

.search-icon { font-size: 14px; color: var(--muted); flex-shrink: 0; }

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-family: 'Nunito', sans-serif;
  font-size: 13px;
  color: #000000;
  padding: 8px 0;
  outline: none;
}
.search-input::placeholder { color: #bbb; }

.clear-x {
  background: none;
  border: none;
  color: var(--muted);
  cursor: pointer;
  font-size: 12px;
  padding: 2px 4px;
  border-radius: 4px;
  transition: color 0.15s;
  flex-shrink: 0;
}
.clear-x:hover { color: var(--danger); }
.clear-x.small { font-size: 11px; }

/* Right side controls */
.tb-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.tb-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tb-label {
  font-family: 'Nunito', sans-serif;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: var(--muted);
  white-space: nowrap;
}

.date-input {
  background: #fdfaf6;
  border: 1.5px solid var(--border);
  border-radius: 8px;
  color: #000;
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  padding: 6px 10px;
  outline: none;
  transition: border-color 0.2s;
}
.date-input:focus { border-color: var(--accent); }

/* View toggle */
.view-toggle {
  display: flex;
  border: 1.5px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.vt {
  padding: 7px 16px;
  background: none;
  border: none;
  border-right: 1px solid var(--border);
  font-family: 'Nunito', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.vt:last-child { border-right: none; }
.vt:hover:not(.vt--active) { background: #fdf8f3; color: #000; }
.vt--active { background: var(--accent); color: #ffffff; }

/* Result pill */
.result-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 38px;
}
.result-num {
  font-family: 'DM Mono', monospace;
  font-size: 18px;
  font-weight: 800;
  color: var(--accent);
  line-height: 1;
}
.result-lbl {
  font-family: 'Nunito', sans-serif;
  font-size: 9px;
  font-weight: 700;
  color: var(--muted);
}

/* Search hint bar */
.search-hint {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 14px;
  background: rgba(138,106,74,0.07);
  border: 1px solid rgba(138,106,74,0.2);
  border-radius: 8px;
  margin-bottom: 14px;
  font-family: 'Nunito', sans-serif;
  font-size: 12px;
  color: #000000;
}
.clear-hint {
  margin-left: auto;
  background: none;
  border: 1px solid var(--accent);
  color: var(--accent);
  border-radius: 6px;
  padding: 3px 12px;
  font-family: 'Nunito', sans-serif;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
}
.clear-hint:hover { background: var(--accent); color: #fff; }

/* ════════════════════════
   EMPTY STATE
════════════════════════ */
.empty-state { text-align: center; padding: 60px 20px; color: var(--muted); }
.empty-icon  { font-size: 52px; margin-bottom: 14px; }
.empty-state p { font-size: 14px; margin-bottom: 6px; }
.empty-state .sub { font-size: 12px; }

/* ════════════════════════
   PERIOD BLOCKS
════════════════════════ */
.period-block { margin-bottom: 30px; }

.period-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 18px;
  border-radius: 12px 12px 0 0;
  border: 1.5px solid var(--border);
  border-bottom: none;
  flex-wrap: wrap;
}

.period-header--week  { background: #eef4fb; border-color: #c0d4ea; }
.period-header--month { background: #fdfaf6; border-color: var(--border); }

.period-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.period-badge {
  padding: 3px 12px;
  border-radius: 16px;
  font-family: 'Nunito', sans-serif;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  flex-shrink: 0;
}
.badge--week  { background: rgba(42,96,153,0.1); color: #2a6099; border: 1px solid rgba(42,96,153,0.25); }
.badge--month { background: rgba(138,106,74,0.1); color: var(--accent); border: 1px solid rgba(138,106,74,0.3); }

.period-info { display: flex; flex-direction: column; gap: 2px; }

.period-title {
  font-family: 'Nunito', sans-serif;
  font-size: 15px;
  font-weight: 800;
  color: #000000;
  line-height: 1.2;
}

.period-meta {
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: var(--muted);
}

.print-group-btn {
  padding: 7px 16px;
  border-radius: 8px;
  border: 1.5px solid var(--accent);
  background: #ffffff;
  color: var(--accent);
  font-family: 'Nunito', sans-serif;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.18s;
  white-space: nowrap;
  flex-shrink: 0;
}
.print-group-btn:hover { background: var(--accent); color: #ffffff; }

.period-inner {
  border-radius: 0 0 12px 12px !important;
}

/* ════════════════════════
   RECORD LIST ROWS
════════════════════════ */
.record-list {
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  border: 1.5px solid var(--border);
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.record-row {
  display: flex;
  align-items: center;
  padding: 13px 20px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255,255,255,0.35);
  transition: filter 0.15s;
  gap: 14px;
}
.record-row:last-child { border-bottom: none; }
.record-row:nth-child(odd)  { background: #f5c8d8; }
.record-row:nth-child(even) { background: #f0b8cc; }
.record-row:hover { filter: brightness(0.94); }

.rec-date {
  font-family: 'DM Mono', monospace;
  font-size: 14px;
  font-weight: 700;
  color: #000000;
  min-width: 108px;
}

.rec-stats {
  flex: 1;
  display: flex;
  gap: 6px;
  font-family: 'Nunito', sans-serif;
  font-size: 12px;
  color: #333;
  opacity: 0.7;
  flex-wrap: wrap;
}

.dot-sep { opacity: 0.4; }

.edit-btn {
  background: #d4567a;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  padding: 6px 18px;
  font-family: 'Nunito', sans-serif;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.15s;
  flex-shrink: 0;
}
.edit-btn:hover { background: #c04060; }

/* ════════════════════════
   MODAL
════════════════════════ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 100;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 30px 20px 40px;
  overflow-y: auto;
  backdrop-filter: blur(4px);
}

.modal-box {
  background: #ffffff;
  border-radius: 16px;
  width: 100%;
  max-width: 1100px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  overflow: hidden;
  animation: slideIn 0.22s ease;
}

@keyframes slideIn {
  from { transform: translateY(-14px); opacity: 0; }
  to   { transform: translateY(0);     opacity: 1; }
}

.modal-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 16px 24px;
  background: var(--surface2);
  border-bottom: 1.5px solid var(--border);
  flex-wrap: wrap;
}

.modal-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 20px;
  font-weight: 700;
  color: #000000;
  letter-spacing: 1px;
}

.modal-actions { display: flex; gap: 8px; flex-wrap: wrap; }

.print-content {
  padding: 24px 28px 32px;
  overflow-y: auto;
  max-height: calc(88vh - 70px);
}

/* Print-only header */
.print-only { display: none; }

/* ── Detail card styles ── */
.detail-section { margin-bottom: 26px; }

.detail-section-header {
  font-family: 'Nunito', sans-serif;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  padding: 8px 14px;
  border-radius: 8px;
  margin-bottom: 10px;
}
.header-new { background: #f5ede0; color: #5a3a1a; border-left: 4px solid var(--accent); }
.header-old { background: #fff0ee; color: #7a1a1a; border-left: 4px solid var(--danger); }
.section-count { font-weight: 400; margin-left: 6px; opacity: 0.65; }

.equip-card {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 10px;
}
.equip-card--old { border-color: #e8cfc0; background: #fffaf8; }

.equip-info-row { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 10px; }

.equip-num {
  min-width: 26px; height: 26px;
  background: #f0e8dc; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 11px; color: #5a3a1a;
  flex-shrink: 0; margin-top: 2px;
}

.equip-fields { display: flex; flex-wrap: wrap; gap: 16px; flex: 1; }

.field-group { display: flex; flex-direction: column; min-width: 90px; }

.field-lbl {
  font-family: 'Nunito', sans-serif;
  font-size: 9px; font-weight: 800; letter-spacing: 1.2px;
  text-transform: uppercase; color: var(--muted); margin-bottom: 2px;
}

.field-val { font-size: 13px; color: #000000; }
.field-val.bold { font-weight: 700; }
.field-val.mono { font-family: 'DM Mono', monospace; font-size: 12px; }
.chip-blue  { color: #2a6099; font-weight: 700; }
.chip-green { color: #2a7a22; font-weight: 700; }
.chip-red   { color: var(--danger); font-weight: 700; }

.condition-excellent { color: var(--success); font-weight: 700; }
.condition-good      { color: #2a60a0;        font-weight: 700; }
.condition-fair      { color: var(--warning);  font-weight: 700; }
.condition-poor      { color: var(--danger);   font-weight: 700; }

.borrowers-block { margin-top: 8px; }

.borrowers-title {
  font-family: 'Nunito', sans-serif;
  font-size: 10px; font-weight: 800; letter-spacing: 1.5px;
  text-transform: uppercase; color: var(--muted); margin-bottom: 6px;
}

.detail-table { width: 100%; border-collapse: collapse; font-size: 12px; }

.detail-table thead th {
  background: var(--surface2); color: #000000;
  font-family: 'Nunito', sans-serif; font-size: 10px;
  font-weight: 800; letter-spacing: 1px; text-transform: uppercase;
  padding: 7px 10px; border: 1px solid var(--border);
  text-align: left; white-space: nowrap;
}

.detail-table tbody td {
  padding: 6px 10px; border: 1px solid #ede5da;
  vertical-align: middle; color: #000000;
}
.detail-table tbody tr:nth-child(even) td { background: #fdfaf6; }

.tc   { text-align: center; }
.mono { font-family: 'DM Mono', monospace; font-size: 11px; }

.no-borrowers-note { font-size: 11px; color: var(--muted); font-style: italic; padding: 4px 0; }
.no-data           { font-size: 12px; color: var(--muted); font-style: italic; padding: 4px 0 10px; }

@media print {
  .modal-toolbar { display: none !important; }
  .print-only    { display: flex !important; }
}
</style>