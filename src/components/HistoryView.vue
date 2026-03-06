<template>
  <div class="history-wrap">

    <!-- ══════════════════════════════════════
         TOOLBAR
    ══════════════════════════════════════ -->
    <div class="toolbar">
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
        <div class="tb-group">
          <label class="tb-label">Date</label>
          <input type="date" v-model="searchDate" class="date-input" />
          <button v-if="searchDate" class="clear-x small" @click="searchDate = ''">✕</button>
        </div>

        <div class="view-toggle">
          <button :class="['vt', { 'vt--active': viewMode === 'all' }]"     @click="viewMode = 'all'">All</button>
          <button :class="['vt', { 'vt--active': viewMode === 'weekly' }]"  @click="viewMode = 'weekly'">Weekly</button>
          <button :class="['vt', { 'vt--active': viewMode === 'monthly' }]" @click="viewMode = 'monthly'">Monthly</button>
        </div>

        <div class="result-pill">
          <span class="result-num">{{ flatFiltered.length }}</span>
          <span class="result-lbl">record{{ flatFiltered.length !== 1 ? 's' : '' }}</span>
        </div>
      </div>
    </div>

    <div v-if="searchQuery && flatFiltered.length > 0" class="search-hint">
      Showing results for <strong>"{{ searchQuery }}"</strong>
      <button class="clear-hint" @click="searchQuery = ''">Clear search</button>
    </div>

    <!-- EMPTY STATE -->
    <div v-if="flatFiltered.length === 0" class="empty-state">
      <div class="empty-icon">🗂</div>
      <p v-if="searchQuery || searchDate">No records match your search.</p>
      <p v-else>No records yet.</p>
      <p class="sub">Save a daily record first from the <strong>Daily Record</strong> tab.</p>
    </div>

    <!-- ══════════════════════════════════════
         ALL VIEW
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
        <div class="period-header period-header--week">
          <div class="period-left">
            <span class="period-badge badge--week">WEEK</span>
            <div class="period-info">
              <span class="period-title">{{ week.label }}</span>
              <span class="period-meta">
                {{ week.records.length }} day{{ week.records.length !== 1 ? 's' : '' }}
                &nbsp;·&nbsp; {{ groupTotalRows(week.records) }} equipment rows
                &nbsp;·&nbsp; {{ groupTotalBorrowers(week.records) }} borrowers
              </span>
            </div>
          </div>
          <button class="print-group-btn" @click="printGroup(week.records, 'Weekly Report', week.label)">
            🖨 Print Week
          </button>
        </div>
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
        <div class="period-header period-header--month">
          <div class="period-left">
            <span class="period-badge badge--month">MONTH</span>
            <div class="period-info">
              <span class="period-title">{{ month.label }}</span>
              <span class="period-meta">
                {{ month.records.length }} day{{ month.records.length !== 1 ? 's' : '' }}
                &nbsp;·&nbsp; {{ groupTotalRows(month.records) }} equipment rows
                &nbsp;·&nbsp; {{ groupTotalBorrowers(month.records) }} borrowers
              </span>
            </div>
          </div>
          <button class="print-group-btn" @click="printGroup(month.records, 'Monthly Report', month.label)">
            🖨 Print Month
          </button>
        </div>
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
            <button class="btn btn-primary btn-sm"   @click="printSingle(viewing)">🖨 Print</button>
            <button class="btn btn-danger btn-sm"    @click="confirmDeleteRecord(viewing.date)">🗑 Delete Day</button>
            <button class="btn btn-secondary btn-sm" @click="viewing = null">✕ Close</button>
          </div>
        </div>

        <div class="print-content">

          <!-- ── Section A ── -->
          <div class="detail-section">
            <div class="detail-section-header header-new">
              ✦ Section A — New / Good Condition Equipment
              <span class="section-count">({{ mergedNew.length }} items)</span>
            </div>
            <div v-if="mergedNew.length === 0" class="no-data">No entries for this section.</div>

            <div v-for="(row, ri) in mergedNew" :key="'n'+ri" class="equip-card">
              <!-- Row-level actions (hidden in print) -->
              <div class="row-actions no-print">
                <button class="row-btn row-btn--edit"   @click="startEditRow('new', ri, row)">✏️ Edit</button>
                <button class="row-btn row-btn--delete" @click="confirmDeleteRow('new', ri)">🗑 Delete</button>
              </div>

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
                  <thead>
                    <tr>
                      <th>#</th><th>Borrower Name</th><th>Project</th><th>Control No.</th>
                      <th>Withdraw</th><th>Date Borrowed</th><th>Time</th>
                      <th>Return Date</th><th>Return Time</th>
                      <th>Checkout Cond.</th><th>Return Cond.</th>
                      <th class="no-print">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(b, bi) in row.borrowers" :key="bi">
                      <td class="tc">{{ bi+1 }}</td>
                      <td>{{ b.name||'—' }}</td>
                      <td>{{ b.project||'—' }}</td>
                      <td class="mono">{{ b.controlNo||'—' }}</td>
                      <td class="tc mono chip-blue">{{ b.withdraw||0 }}</td>
                      <td class="mono">{{ b.dateBorrowed||'—' }}</td>
                      <td class="mono">{{ b.timeBorrowed||'—' }}</td>
                      <td class="mono">{{ b.returnDate||'—' }}</td>
                      <td class="mono">{{ b.returnTime||'—' }}</td>
                      <td><span :class="'condition-'+b.conditionCheckout">{{ b.conditionCheckout||'—' }}</span></td>
                      <td><span :class="'condition-'+b.conditionReturn">{{ b.conditionReturn||'—' }}</span></td>
                      <td class="tc no-print">
                        <button
                          class="borrower-edit-btn"
                          @click="editBorrowerInRecord(viewing, 'new', ri, bi, row, b)"
                          title="Go to Daily Record to edit this borrower"
                        >✏️ Edit</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="no-borrowers-note">No borrower entries.</div>
            </div>
          </div>

          <!-- ── Section B ── -->
          <div class="detail-section">
            <div class="detail-section-header header-old">
              ⚠ Section B — Old / Damaged Equipment
              <span class="section-count">({{ mergedOld.length }} items)</span>
            </div>
            <div v-if="mergedOld.length === 0" class="no-data">No entries for this section.</div>

            <div v-for="(row, ri) in mergedOld" :key="'o'+ri" class="equip-card equip-card--old">
              <div class="row-actions no-print">
                <button class="row-btn row-btn--edit"   @click="startEditRow('old', ri, row)">✏️ Edit</button>
                <button class="row-btn row-btn--delete" @click="confirmDeleteRow('old', ri)">🗑 Delete</button>
              </div>

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
                  <thead>
                    <tr>
                      <th>#</th><th>Borrower Name</th><th>Project</th><th>Control No.</th>
                      <th>Date Borrowed</th><th>Time</th><th>Return Date</th><th>Return Time</th>
                      <th class="no-print">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(b, bi) in row.borrowers" :key="bi">
                      <td class="tc">{{ bi+1 }}</td>
                      <td>{{ b.name||'—' }}</td>
                      <td>{{ b.project||'—' }}</td>
                      <td class="mono">{{ b.controlNo||'—' }}</td>
                      <td class="mono">{{ b.dateBorrowed||'—' }}</td>
                      <td class="mono">{{ b.timeBorrowed||'—' }}</td>
                      <td class="mono">{{ b.returnDate||'—' }}</td>
                      <td class="mono">{{ b.returnTime||'—' }}</td>
                      <td class="tc no-print">
                        <button
                          class="borrower-edit-btn"
                          @click="editBorrowerInRecord(viewing, 'old', ri, bi, row, b)"
                          title="Go to Daily Record to edit this borrower"
                        >✏️ Edit</button>
                      </td>
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

    <!-- ══════════════════════════════════════
         INLINE ROW EDIT MODAL
    ══════════════════════════════════════ -->
    <div class="modal-overlay" v-if="editingRow" @click.self="editingRow = null">
      <div class="modal-box modal-box--edit">
        <div class="modal-toolbar">
          <div class="modal-title">✏️ Edit Equipment Row</div>
          <div class="modal-actions">
            <button class="btn btn-primary btn-sm"  @click="saveEditRow">💾 Save Changes</button>
            <button class="btn btn-secondary btn-sm" @click="editingRow = null">✕ Cancel</button>
          </div>
        </div>
        <div class="edit-form" v-if="editingRow">
          <div class="edit-grid">
            <label class="ef-label">Tool Name<input type="text" v-model="editingRow.draft.toolName" class="ef-input" /></label>
            <label class="ef-label">Code No.<input type="text" v-model="editingRow.draft.codeNo" class="ef-input" /></label>
            <label class="ef-label">Total QTY<input type="number" v-model.number="editingRow.draft.totalQty" class="ef-input" /></label>
            <label class="ef-label">Condition
              <select v-model="editingRow.draft.condition" class="ef-input">
                <option value="">— Select —</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </label>
            <label class="ef-label" style="grid-column:1/-1">Damage Notes<textarea v-model="editingRow.draft.damageNotes" class="ef-input" rows="2"></textarea></label>
            <label class="ef-label" style="grid-column:1/-1">Remarks<input type="text" v-model="editingRow.draft.remarks" class="ef-input" /></label>
          </div>

          <!-- Borrower table edit -->
          <div class="borrowers-title" style="margin-top:16px">Borrower Records</div>
          <div v-if="editingRow.draft.borrowers && editingRow.draft.borrowers.length" style="overflow-x:auto">
            <table class="detail-table">
              <thead>
                <tr>
                  <th>#</th><th>Name</th><th>Project</th><th>Control No.</th>
                  <th>Withdraw</th><th>Date Borrowed</th><th>Time</th>
                  <th>Return Date</th><th>Return Time</th>
                  <th>Checkout Cond.</th><th>Return Cond.</th><th>Del</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(b, bi) in editingRow.draft.borrowers" :key="bi">
                  <td class="tc">{{ bi+1 }}</td>
                  <td><input type="text" v-model="b.name" style="min-width:120px" /></td>
                  <td><input type="text" v-model="b.project" style="min-width:100px" /></td>
                  <td><input type="text" v-model="b.controlNo" style="min-width:90px" /></td>
                  <td><input type="number" v-model.number="b.withdraw" style="width:55px;text-align:center" /></td>
                  <td><input type="date" v-model="b.dateBorrowed" /></td>
                  <td><input type="time" v-model="b.timeBorrowed" /></td>
                  <td><input type="date" v-model="b.returnDate" /></td>
                  <td><input type="time" v-model="b.returnTime" /></td>
                  <td>
                    <select v-model="b.conditionCheckout" style="min-width:90px">
                      <option value="">—</option><option value="excellent">Excellent</option>
                      <option value="good">Good</option><option value="fair">Fair</option><option value="poor">Poor</option>
                    </select>
                  </td>
                  <td>
                    <select v-model="b.conditionReturn" style="min-width:90px">
                      <option value="">—</option><option value="excellent">Excellent</option>
                      <option value="good">Good</option><option value="fair">Fair</option><option value="poor">Poor</option>
                    </select>
                  </td>
                  <td><button class="del-btn-sm" @click="editingRow.draft.borrowers.splice(bi,1)">✕</button></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="no-borrowers-note">No borrowers on this row.</div>
        </div>
      </div>
    </div>

  </div>

  <!-- ══════════════════════════════════════
       BORROWER CARD MODAL (edit from history)
  ══════════════════════════════════════ -->
  <BorrowerCardModal
    v-if="borrowerCard"
    :borrower="borrowerCard.borrower"
    :row="borrowerCard.row"
    :record-date="borrowerCard.recordDate"
    @close="closeBorrowerCard"
    @save-changes="closeBorrowerCard"
    @save-row="onBorrowerSaveRow"
  />

</template>

<script setup>
import { ref, computed } from 'vue'
import BorrowerCardModal from './BorrowerCardModal.vue'

const props = defineProps({
  history:        { type: Array,    required: true },
  totalBorrowers: { type: Function, required: true }
})

const emit = defineEmits(['load-record', 'delete-record', 'update-history', 'edit-borrower-in-record'])

// ── State ──────────────────────────────────────────────────────
const searchQuery = ref('')
const searchDate  = ref('')
const viewMode    = ref('all')
const viewing     = ref(null)
const editingRow  = ref(null)   // { section, rowIndex, draft }
const borrowerCard = ref(null)  // { borrower, row, recordDate } — for BorrowerCardModal

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
function groupTotalRows(records)     { return records.reduce((s, r) => s + totalRows(r), 0) }
function groupTotalBorrowers(records){ return records.reduce((s, r) => s + totalBorrowers(r), 0) }

// ══════════════════════════════════════════════════════════════
// MERGE ROWS: same date + same codeNo → merge borrowers into one card
// ══════════════════════════════════════════════════════════════
function mergeRows(rows) {
  const seen = new Map()
  const result = []
  for (const row of (rows || [])) {
    const key = (row.codeNo || '').trim() + '||' + (row.toolName || '').trim().toUpperCase()
    if (key !== '||' && seen.has(key)) {
      const existing = seen.get(key)
      existing.borrowers = [...(existing.borrowers || []), ...(row.borrowers || [])]
    } else {
      const clone = JSON.parse(JSON.stringify(row))
      seen.set(key, clone)
      result.push(clone)
    }
  }
  return result
}

const mergedNew = computed(() => viewing.value ? mergeRows(viewing.value.newEquipRows) : [])
const mergedOld = computed(() => viewing.value ? mergeRows(viewing.value.oldEquipRows) : [])

// ── Search matching ────────────────────────────────────────────
function matchesQuery(rec, q) {
  if (!q) return true
  const lower = q.toLowerCase().trim()
  const allRows = [...(rec.newEquipRows || []), ...(rec.oldEquipRows || [])]
  const equipHit    = allRows.some(row => (row.toolName || '').toLowerCase().includes(lower))
  const borrowerHit = allRows.some(row =>
    (row.borrowers || []).some(b =>
      (b.name    || '').toLowerCase().includes(lower) ||
      (b.project || '').toLowerCase().includes(lower)
    )
  )
  return equipHit || borrowerHit
}

const flatFiltered = computed(() => {
  let list = [...props.history].sort((a, b) => b.date.localeCompare(a.date))
  if (searchDate.value)         list = list.filter(r => r.date === searchDate.value)
  if (searchQuery.value.trim()) list = list.filter(r => matchesQuery(r, searchQuery.value))
  return list
})

// ── Grouping helpers ───────────────────────────────────────────
function getMondayKey(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const mon = new Date(d)
  mon.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return mon.toISOString().slice(0, 10)
}
function weekLabel(mondayStr) {
  const mon = new Date(mondayStr + 'T00:00:00')
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
  const fmt = { month: 'short', day: 'numeric' }
  return `${mon.toLocaleDateString('en-US', fmt)} – ${sun.toLocaleDateString('en-US', { ...fmt, year: 'numeric' })}`
}
function getMonthKey(dateStr) { return dateStr.slice(0, 7) }
function monthLabel(key) {
  const [y, m] = key.split('-')
  return new Date(+y, +m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

const groupedWeekly = computed(() => {
  const map = new Map()
  for (const rec of flatFiltered.value) {
    const key = getMondayKey(rec.date)
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(rec)
  }
  return [...map.entries()].sort(([a],[b]) => b.localeCompare(a))
    .map(([key, records]) => ({ key, label: weekLabel(key), records: records.sort((a,b) => b.date.localeCompare(a.date)) }))
})

const groupedMonthly = computed(() => {
  const map = new Map()
  for (const rec of flatFiltered.value) {
    const key = getMonthKey(rec.date)
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(rec)
  }
  return [...map.entries()].sort(([a],[b]) => b.localeCompare(a))
    .map(([key, records]) => ({ key, label: monthLabel(key), records: records.sort((a,b) => b.date.localeCompare(a.date)) }))
})

// ── Modal open/close ───────────────────────────────────────────
function openRecord(rec) { viewing.value = rec }

// ── Delete entire day record ───────────────────────────────────
function confirmDeleteRecord(date) {
  if (confirm(`Delete ALL records for ${date}? This cannot be undone.`)) {
    emit('delete-record', date)
    viewing.value = null
  }
}

// ── Delete single equipment row from the open record ──────────
function confirmDeleteRow(section, rowIndex) {
  if (!confirm('Delete this equipment row and all its borrower entries? This cannot be undone.')) return
  const rec = viewing.value
  const key = section === 'new' ? 'newEquipRows' : 'oldEquipRows'
  const merged = section === 'new' ? mergedNew.value : mergedOld.value
  const targetRow = merged[rowIndex]
  const targetKey = (targetRow.codeNo || '').trim() + '||' + (targetRow.toolName || '').trim().toUpperCase()

  rec[key] = (rec[key] || []).filter(r => {
    const k = (r.codeNo || '').trim() + '||' + (r.toolName || '').trim().toUpperCase()
    return k !== targetKey
  })

  persistAndRefresh(rec)
}

// ── Edit single equipment row ──────────────────────────────────
function startEditRow(section, rowIndex, row) {
  editingRow.value = {
    section,
    rowIndex,
    draft: JSON.parse(JSON.stringify(row))
  }
}

function saveEditRow() {
  const { section, draft } = editingRow.value
  const rec = viewing.value
  const key = section === 'new' ? 'newEquipRows' : 'oldEquipRows'
  const targetKey = (draft.codeNo || '').trim() + '||' + (draft.toolName || '').trim().toUpperCase()

  rec[key] = (rec[key] || []).filter(r => {
    const k = (r.codeNo || '').trim() + '||' + (r.toolName || '').trim().toUpperCase()
    return k !== targetKey
  })
  rec[key].push(draft)

  editingRow.value = null
  persistAndRefresh(rec)
}

// ══════════════════════════════════════════════════════════════
// EDIT BORROWER → Navigate to Daily Record + open BorrowerCardModal
// ══════════════════════════════════════════════════════════════
function editBorrowerInRecord(record, section, rowIndex, borrowerIndex, row, borrower) {
  // Open BorrowerCardModal directly inside HistoryView
  borrowerCard.value = {
    borrower,          // direct reference — BorrowerCardModal mutates it via Object.assign
    row,               // direct reference — toolName/codeNo sync back
    recordDate: record.date
  }
}

// Close borrower card and persist any edits back into history
function closeBorrowerCard() {
  borrowerCard.value = null
  if (viewing.value) persistAndRefresh(viewing.value)
}

// Save & move to history from BorrowerCardModal
function onBorrowerSaveRow() {
  borrowerCard.value = null
  if (viewing.value) persistAndRefresh(viewing.value)
}

// ── Persist changes to localStorage and force reactivity ──────
function persistAndRefresh(rec) {
  const idx = props.history.findIndex(r => r.date === rec.date)
  if (idx !== -1) {
    props.history[idx] = { ...rec }
    viewing.value = props.history[idx]
  }
  localStorage.setItem('eqt_history', JSON.stringify(props.history))
}

// ══════════════════════════════════════════════════════════════
/// PRINT CSS — A4 Landscape, white, full-width header (FIXED)
// ══════════════════════════════════════════════════════════════
const PRINT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');

*{
  box-sizing:border-box;
  margin:0;
  padding:0;
  -webkit-print-color-adjust:exact;
  print-color-adjust:exact;
}

@page{
  size:A4 landscape;
  margin:10mm 12mm;
}

.header-img {
  width: 100vw !important;      /* full viewport width */
  max-width: 100vw !important;  /* prevent shrinking */
  height: auto !important;      /* maintain aspect ratio */
  object-fit: cover;            /* stretch to cover width without gaps */
  display: block;
  margin: 0;                    /* remove default margins */
  padding: 0;
  position: relative;
  left: 50%;
  right: 50%;
  margin-left: -50vw;           /* pull left to edge */
  margin-right: -50vw;          /* pull right to edge */
}

body{
  font-family:'Nunito',sans-serif;
  font-size:10px;
  color:#000 !important;
  background:#fff;
}

/* ── HEADER WRAPPER BREAK OUT OF PAGE MARGINS ── */



/* Divider full width */
.header-divider{
  border:none;
  border-top:1.5px solid #000;
  margin:4px 0 8px;
}

/* ── Report title block ── */
.report-title-block{
  margin-bottom:10px;
  padding-bottom:8px;
  border-bottom:1px solid #000;
  display:flex;
  justify-content:space-between;
  align-items:flex-end;
}

.report-title{
  font-size:13px;
  font-weight:800;
  letter-spacing:2px;
  text-transform:uppercase;
  color:#000 !important;
}

.report-sub{
  font-size:9px;
  color:#000 !important;      /* was gray */
  margin-top:2px;
  font-weight:600;
}

.report-meta{
  font-size:9px;
  color:#000 !important;      /* was gray */
  text-align:right;
  line-height:1.8;
  font-weight:600;
}

.report-meta strong{
  color:#000;
  font-size:10px;
  font-weight:800;
}

/* ── Day divider ── */
.day-header{
  margin:12px 0 6px;
  padding:4px 10px;
  background:#eee;
  border-left:4px solid #000;
  font-size:9.5px;
  font-weight:800;
  letter-spacing:1.2px;
  text-transform:uppercase;
  color:#000;
  display:flex;
  justify-content:space-between;
}

.day-header .dh-meta{
  font-weight:700;
  font-size:9px;
  color:#000 !important;     /* removed opacity */
}

/* ── Section headers ── */
.detail-section{
  margin-bottom:12px;
}

.detail-section-header{
  font-size:9px;
  font-weight:800;
  letter-spacing:1.5px;
  text-transform:uppercase;
  padding:4px 10px;
  margin-bottom:6px;
  border-left:4px solid #000;
  background:#FFC300;
  color:#000;
}

.section-count{
  font-weight:700;
  margin-left:6px;
  color:#000 !important;
}

/* ── Equipment cards ── */
.equip-card{
  border:1px solid #000;
  border-radius:3px;
  padding:6px 9px;
  margin-bottom:6px;
  background: #FFFFC1;
  page-break-inside:avoid;
}

.equip-info-row{
  display:flex;
  gap:8px;
  align-items:flex-start;
  margin-bottom:5px;
}

.equip-num{
  min-width:18px;
  height:18px;
  background:#ddd;
  border-radius:50%;
  display:flex;
  align-items:center;
  justify-content:center;
  font-weight:800;
  font-size:9px;
  color:#000;
  flex-shrink:0;
}

.equip-fields{
  display:flex;
  flex-wrap:wrap;
  gap:8px 18px;
  flex:1;
}

.field-group{
  display:flex;
  flex-direction:column;
  min-width:70px;
}

.field-lbl{
  font-size:7px;
  font-weight:800;
  letter-spacing:0.8px;
  text-transform:uppercase;
  color:#000 !important;  /* was gray */
  margin-bottom:1px;
}

.field-val{
  font-size:10px;
  color:#000 !important;
  font-weight:700;
}

.bold{font-weight:800}
.mono{
  font-family:'DM Mono',monospace;
  font-size:9px;
  font-weight:700;
}

/* Remove colored chips for better print clarity */
.chip-blue,
.chip-green,
.chip-red,
.condition-excellent,
.condition-good,
.condition-fair,
.condition-poor{
  color:#000 !important;
  font-weight:800;
}

/* ── Borrower table ── */
.borrowers-title{
  font-size:7.5px;
  font-weight:800;
  letter-spacing:1.5px;
  text-transform:uppercase;
  background: #ffffff;
  color:#000 !important;
  margin:6px 0 4px;
  padding-top:5px;
  border-top:1px solid #000;
}

.detail-table{
  width:100%;
  border-collapse:collapse;
  font-size:8px;
  margin-bottom:4px;
}

.detail-table thead th{
  background:#000;
  color:#fff;
  font-weight:800;
  font-size:7px;
  letter-spacing:0.8px;
  text-transform:uppercase;
  padding:3px 5px;
  border:1px solid #000;
  text-align:left;
  white-space:nowrap;
}

.detail-table tbody td{
  padding:3px 5px;
  border:1px solid #000;
  vertical-align:middle;
  background: #f5f5f5;
  color:#000 !important;
  font-weight:700;
}

.detail-table tbody tr:nth-child(even) td{
  background:#ffffff;
}

.detail-table tbody tr td:first-child{
  text-align:center;
  font-weight:800;
  color:#000 !important;
  background: #ffffff;
  width:20px;
}

.tc{text-align:center}

.no-borrowers-note,
.no-data{
  font-size:8.5px;
  color:#000 !important;
  font-style:italic;
  padding:4px 0;
  font-weight:700;
}

/* ── Footer ── */
.print-footer{
  margin-top:12px;
  border-top:1px solid #000;
  padding-top:5px;
  display:flex;
  justify-content:space-between;
  font-size:8px;
  color:#000 !important;
  font-weight:700;
}
`
// ══════════════════════════════════════════════════════════════
// BUILD HTML FOR ONE RECORD — with merge logic
// ══════════════════════════════════════════════════════════════
function buildMergedRows(rows) {
  const seen = new Map()
  const result = []
  for (const row of (rows || [])) {
    const key = (row.codeNo || '').trim() + '||' + (row.toolName || '').trim().toUpperCase()
    if (key !== '||' && seen.has(key)) {
      seen.get(key).borrowers = [...(seen.get(key).borrowers || []), ...(row.borrowers || [])]
    } else {
      const clone = JSON.parse(JSON.stringify(row))
      seen.set(key, clone)
      result.push(clone)
    }
  }
  return result
}

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
    const merged = buildMergedRows(rows)
    if (!merged || merged.length === 0) return '<p class="no-data">No entries.</p>'
    return merged.map((row, ri) => {
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
          ? `<div class="borrowers-title">Borrower Records (${(row.borrowers || []).length})</div>
             <table class="detail-table"><thead><tr><th>#</th><th>Borrower Name</th><th>Project</th><th>Control No.</th><th>Withdraw</th><th>Date Borrowed</th><th>Time</th><th>Return Date</th><th>Return Time</th><th>Checkout Cond.</th><th>Return Cond.</th></tr></thead>
             <tbody>${borrowerRowsNew(row.borrowers)}</tbody></table>`
          : `<div class="borrowers-title">Borrower Records (${(row.borrowers || []).length})</div>
             <table class="detail-table"><thead><tr><th>#</th><th>Borrower Name</th><th>Project</th><th>Control No.</th><th>Date Borrowed</th><th>Time</th><th>Return Date</th><th>Return Time</th></tr></thead>
             <tbody>${borrowerRowsOld(row.borrowers)}</tbody></table>`)
        : '<p class="no-borrowers-note">No borrower entries.</p>'

      return `
        <div class="equip-card">
          <div class="equip-info-row">
            <div class="equip-num">${ri + 1}</div>
            <div class="equip-fields">
              <div class="field-group"><span class="field-lbl">Equipment / Tool</span><span class="field-val bold">${row.toolName || '—'}</span></div>
              <div class="field-group"><span class="field-lbl">Code No.</span><span class="field-val mono">${row.codeNo || '—'}</span></div>
              ${extraFields}
              <div class="field-group"><span class="field-lbl">Condition</span><span class="field-val ${cond(row.condition)}">${row.condition || '—'}</span></div>
              ${row.damageNotes ? `<div class="field-group"><span class="field-lbl">Damage Notes</span><span class="field-val">${row.damageNotes}</span></div>` : ''}
              <div class="field-group"><span class="field-lbl">Accessories</span><span class="field-val">${row.accessoriesReturned === true ? 'YES' : row.accessoriesReturned === false ? 'NO' : '—'}</span></div>
              ${row.remarks ? `<div class="field-group"><span class="field-lbl">Remarks</span><span class="field-val">${row.remarks}</span></div>` : ''}
            </div>
          </div>
          <div>${borrowerBlock}</div>
        </div>`
    }).join('')
  }

  return `
    <div>
      <div class="detail-section">
        <div class="detail-section-header">✦ Section A — New / Good Condition Equipment <span class="section-count">(${buildMergedRows(rec.newEquipRows).length} items)</span></div>
        ${equipCards(rec.newEquipRows, true)}
      </div>
      <div class="detail-section">
        <div class="detail-section-header">⚠ Section B — Old / Damaged Equipment <span class="section-count">(${buildMergedRows(rec.oldEquipRows).length} items)</span></div>
        ${equipCards(rec.oldEquipRows, false)}
      </div>
    </div>`
}

// ── Print single record ────────────────────────────────────────
function printSingle(rec) {
  const HEAD_IMG = 'data:image/jpeg;base64,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gAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgD/0f7+KACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgD/0v7+KACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgD/2Q=='
  const now = new Date().toLocaleString('en-PH', { dateStyle: 'long', timeStyle: 'short' })
  const win = window.open('', '_blank', 'width=1100,height=800')
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Equipment Record — ${rec.date}</title>
<style>${PRINT_CSS}</style></head><body>
<img src="${HEAD_IMG}" class="header-img" alt="Caraga State University"/>
<hr class="header-divider"/>
<div class="report-title-block">
  <div>
    <div class="report-title">Power Tools — Daily Record</div>
    <div class="report-sub">General Services Office — Equipment Borrow Management System</div>
  </div>
  <div class="report-meta">Date: <strong>${rec.date}</strong><br/>Printed: ${now}</div>
</div>
${buildRecordHTML(rec)}
<div class="print-footer">
  <span>General Services Office — Caraga State University</span>
  <span>Printed: ${now}</span>
</div>
<script>window.onload=()=>window.print();<\/script>
</body></html>`)
  win.document.close()
}

// ── Print group (weekly / monthly) ────────────────────────────
function printGroup(records, reportType, periodLabel) {
  const HEAD_IMG = 'data:image/jpeg;base64,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gAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgD/0f7+KACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgD/0v7+KACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgD/2Q=='
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date))
  const days   = sorted.length
  const totalB = sorted.reduce((s, r) => s + totalBorrowers(r), 0)
  const totalR = sorted.reduce((s, r) => s + totalRows(r), 0)
  const now    = new Date().toLocaleString('en-PH', { dateStyle: 'long', timeStyle: 'short' })

  const bodyHTML = sorted.map(rec => `
    <div class="day-header">
      <span>&#128197; ${rec.date}</span>
      <span class="dh-meta">${totalRows(rec)} equipment rows &nbsp;·&nbsp; ${totalBorrowers(rec)} borrowers</span>
    </div>
    ${buildRecordHTML(rec)}
  `).join('')

  const win = window.open('', '_blank', 'width=1100,height=800')
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>${reportType} — ${periodLabel}</title>
<style>${PRINT_CSS}</style></head><body>
<img src="${HEAD_IMG}" class="header-img" alt="Caraga State University"/>
<hr class="header-divider"/>
<div class="report-title-block">
  <div>
    <div class="report-title">Power Tools — ${reportType}</div>
    <div class="report-sub">General Services Office — Equipment Borrow Management System</div>
  </div>
  <div class="report-meta">
    Period: <strong>${periodLabel}</strong><br/>
    ${days} day${days !== 1 ? 's' : ''} &nbsp;·&nbsp; ${totalR} equipment rows &nbsp;·&nbsp; ${totalB} borrowers<br/>
    Printed: ${now}
  </div>
</div>
${bodyHTML}
<div class="print-footer">
  <span>General Services Office — Caraga State University</span>
  <span>Generated: ${now}</span>
</div>
<script>window.onload=()=>window.print();<\/script>
</body></html>`)
  win.document.close()
}
</script>

<style scoped>

/* ── Row-level actions (hidden in print) ── */
.no-print { display: flex; }
@media print { .no-print { display: none !important; } }

.row-actions {
  justify-content: flex-end;
  gap: 6px;
  margin-bottom: 6px;
}

.row-btn {
  font-family: 'Nunito', sans-serif;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 6px;
  border: 1.5px solid;
  cursor: pointer;
  transition: all 0.15s;
}
.row-btn--edit {
  background: rgba(42,96,153,0.07);
  border-color: rgba(42,96,153,0.3);
  color: #2a6099;
}
.row-btn--edit:hover { background: rgba(42,96,153,0.15); }
.row-btn--delete {
  background: rgba(184,50,50,0.07);
  border-color: rgba(184,50,50,0.3);
  color: #b83232;
}
.row-btn--delete:hover { background: rgba(184,50,50,0.15); }

/* ── Borrower-level Edit button ── */
.borrower-edit-btn {
  font-family: 'Nunito', sans-serif;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 5px;
  border: 1.5px solid rgba(42,96,153,0.3);
  background: rgba(42,96,153,0.07);
  color: #2a6099;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}
.borrower-edit-btn:hover {
  background: rgba(42,96,153,0.18);
  border-color: rgba(42,96,153,0.5);
}

/* Actions column header & cell */
.detail-table th.no-print,
.detail-table td.no-print {
  text-align: center;
  white-space: nowrap;
}

/* ── Edit modal ── */
.modal-box--edit {
  max-width: 1100px !important;
}
.edit-form {
  padding: 20px 24px 24px;
  overflow-y: auto;
  max-height: 70vh;
}
.edit-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 120px 1fr;
  gap: 12px 16px;
  margin-bottom: 12px;
}
.ef-label {
  display: flex;
  flex-direction: column;
  font-family: 'Nunito', sans-serif;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--muted);
  gap: 4px;
}
.ef-input {
  font-family: 'Nunito', sans-serif;
  font-size: 12px;
  border: 1.5px solid var(--border);
  border-radius: 7px;
  padding: 6px 10px;
  color: #000;
  outline: none;
  transition: border-color 0.2s;
}
.ef-input:focus { border-color: var(--accent); }

.del-btn-sm {
  background: none;
  border: none;
  color: rgba(184,50,50,0.6);
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 4px;
}
.del-btn-sm:hover { color: var(--danger); background: rgba(184,50,50,0.08); }


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