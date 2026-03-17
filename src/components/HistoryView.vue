<template>
  <div class="history-wrap">

    <!-- ══════════════════════════════════════
         TOOLBAR
    ══════════════════════════════════════ -->
    <div class="toolbar">
      <div class="tb-search-wrap">
        <span class="search-icon"></span>
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
          <button :class="['vt', { 'vt--active': viewMode === 'all' }]"      @click="viewMode = 'all'">All</button>
          <button :class="['vt', { 'vt--active': viewMode === 'weekly' }]"   @click="viewMode = 'weekly'">Weekly</button>
          <button :class="['vt', { 'vt--active': viewMode === 'monthly' }]"  @click="viewMode = 'monthly'">Monthly</button>
          <button :class="['vt', { 'vt--active': viewMode === 'yearly' }]"   @click="viewMode = 'yearly'">Yearly</button>
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
          <div class="btn-group-row">
            <button class="print-group-btn" @click="printGroup(week.records, 'Weekly Report', week.label)">
              🖨 Print Week
            </button>
            <button class="print-group-btn export-group-btn" @click="exportGroupExcel(week.records, 'Weekly Report', week.label)">
               Export Week
            </button>
          </div>
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
          <div class="btn-group-row">
            <button class="print-group-btn" @click="printGroup(month.records, 'Monthly Report', month.label)">
              🖨 Print Month
            </button>
            <button class="print-group-btn export-group-btn" @click="exportGroupExcel(month.records, 'Monthly Report', month.label)">
               Export Month
            </button>
          </div>
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
         YEARLY VIEW
    ══════════════════════════════════════ -->
    <template v-if="viewMode === 'yearly' && flatFiltered.length > 0">
      <div v-for="year in groupedYearly" :key="year.key" class="period-block">
        <div class="period-header period-header--year">
          <div class="period-left">
            <span class="period-badge badge--year">YEAR</span>
            <div class="period-info">
              <span class="period-title">{{ year.label }}</span>
              <span class="period-meta">
                {{ year.records.length }} day{{ year.records.length !== 1 ? 's' : '' }}
                &nbsp;·&nbsp; {{ groupTotalRows(year.records) }} equipment rows
                &nbsp;·&nbsp; {{ groupTotalBorrowers(year.records) }} borrowers
              </span>
            </div>
          </div>
          <div class="btn-group-row">
            <button class="print-group-btn" @click="printGroup(year.records, 'Yearly Report', year.label)">
              🖨 Print Year
            </button>
            <button class="print-group-btn export-group-btn" @click="exportGroupExcel(year.records, 'Yearly Report', year.label)">
               Export Year
            </button>
          </div>
        </div>
        <div class="record-list period-inner">
          <div
            v-for="rec in year.records"
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
            <button class="btn btn-excel btn-sm"     @click="exportSingleExcel(viewing)">Excel</button>
            <button class="btn btn-edit btn-sm"      @click="editDay(viewing)">Edit Day</button>
            <button class="btn btn-danger btn-sm"    @click="confirmDeleteRecord(viewing.date)">Delete Day</button>
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
                      <td class="mono">{{ fmt12(b.timeBorrowed) }}</td>
                      <td class="mono">{{ b.returnDate||'—' }}</td>
                      <td class="mono">{{ fmt12(b.returnTime) }}</td>
                      <td><span :class="'condition-'+b.conditionCheckout">{{ b.conditionCheckout||'—' }}</span></td>
                      <td><span :class="'condition-'+b.conditionReturn">{{ b.conditionReturn||'—' }}</span></td>
                      <td class="tc no-print">
                        <button
                          class="borrower-edit-btn"
                          @click="editBorrowerInRecord(viewing, 'new', ri, bi, row, b)"
                          title="Go to Daily Record to edit this borrower"
                        >Edit</button>
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
                      <td class="mono">{{ fmt12(b.timeBorrowed) }}</td>
                      <td class="mono">{{ b.returnDate||'—' }}</td>
                      <td class="mono">{{ fmt12(b.returnTime) }}</td>
                      <td class="tc no-print">
                        <button
                          class="borrower-edit-btn"
                          @click="editBorrowerInRecord(viewing, 'old', ri, bi, row, b)"
                          title="Go to Daily Record to edit this borrower"
                        >Edit</button>
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
          <div class="modal-title">Edit Equipment Row</div>
          <div class="modal-actions">
            <button class="btn btn-primary btn-sm"  @click="saveEditRow">Save Changes</button>
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

const emit = defineEmits(['load-record', 'delete-record', 'update-history', 'edit-borrower-in-record', 'load-record-for-edit'])

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
function getYearKey(dateStr) { return dateStr.slice(0, 4) }
function yearLabel(key) { return key }

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

const groupedYearly = computed(() => {
  const map = new Map()
  for (const rec of flatFiltered.value) {
    const key = getYearKey(rec.date)
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(rec)
  }
  return [...map.entries()].sort(([a],[b]) => b.localeCompare(a))
    .map(([key, records]) => ({ key, label: yearLabel(key), records: records.sort((a,b) => b.date.localeCompare(a.date)) }))
})

// ── Modal open/close ───────────────────────────────────────────
function openRecord(rec) { viewing.value = rec }

// ── Load record back into Daily Record for editing ─────────
function editDay(rec) {
  if (!confirm(`Load the record for ${rec.date} into Daily Record for editing?\n\nThe current unsaved Daily Record will be replaced.`)) return
  emit('load-record-for-edit', JSON.parse(JSON.stringify(rec)))
  viewing.value = null
}

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
// TIME FORMATTER — convert HH:MM (24h) → h:MM AM/PM
// ══════════════════════════════════════════════════════════════
function fmt12(t) {
  if (!t) return '—'
  const [hStr, mStr] = t.split(':')
  let h = parseInt(hStr, 10)
  const m = mStr || '00'
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return h + ':' + m + ' ' + ampm
}

// ══════════════════════════════════════════════════════════════
// PRINT HELPERS — build borrower rows HTML
// ══════════════════════════════════════════════════════════════
function buildBorrowerRowsNew(borrowers) {
  if (!borrowers || !borrowers.length) return '<tr><td colspan="11" style="text-align:center;color:#888;font-style:italic;padding:6px">No borrower entries.</td></tr>'
  return borrowers.map((b, i) => `
    <tr>
      <td class="tc">${i + 1}</td>
      <td>${b.name || '—'}</td>
      <td>${b.project || '—'}</td>
      <td class="mono">${b.controlNo || '—'}</td>
      <td class="tc mono" style="color:#2a6099;font-weight:700">${b.withdraw || 0}</td>
      <td class="mono">${b.dateBorrowed || '—'}</td>
      <td class="mono">${fmt12(b.timeBorrowed)}</td>
      <td class="mono">${b.returnDate || '—'}</td>
      <td class="mono">${fmt12(b.returnTime)}</td>
      <td class="cond-${b.conditionCheckout || ''}">${b.conditionCheckout || '—'}</td>
      <td class="cond-${b.conditionReturn || ''}">${b.conditionReturn || '—'}</td>
    </tr>`).join('')
}

function buildBorrowerRowsOld(borrowers) {
  if (!borrowers || !borrowers.length) return '<tr><td colspan="8" style="text-align:center;color:#888;font-style:italic;padding:6px">No borrower entries.</td></tr>'
  return borrowers.map((b, i) => `
    <tr>
      <td class="tc">${i + 1}</td>
      <td>${b.name || '—'}</td>
      <td>${b.project || '—'}</td>
      <td class="mono">${b.controlNo || '—'}</td>
      <td class="mono">${b.dateBorrowed || '—'}</td>
      <td class="mono">${fmt12(b.timeBorrowed)}</td>
      <td class="mono">${b.returnDate || '—'}</td>
      <td class="mono">${fmt12(b.returnTime)}</td>
    </tr>`).join('')
}

function buildEquipCardNew(row, idx) {
  const avail = (parseInt(row.totalQty) || 0) - (row.borrowers || []).reduce((s, b) => s + (parseInt(b.withdraw) || 0), 0)
  return `
  <div class="equip-card">
    <div class="equip-info-row">
      <div class="equip-num">${idx + 1}</div>
      <div class="equip-fields">
        <div class="field-group"><span class="field-lbl">Equipment / Tool</span><span class="field-val bold">${row.toolName || '—'}</span></div>
        <div class="field-group"><span class="field-lbl">Code No.</span><span class="field-val mono">${row.codeNo || '—'}</span></div>
        <div class="field-group"><span class="field-lbl">Total QTY</span><span class="field-val mono">${row.totalQty || '—'}</span></div>
        <div class="field-group"><span class="field-lbl">Withdrawn</span><span class="field-val mono" style="color:#2a6099;font-weight:700">${(row.borrowers || []).reduce((s, b) => s + (parseInt(b.withdraw) || 0), 0)}</span></div>
        <div class="field-group"><span class="field-lbl">Available</span><span class="field-val" style="color:${avail <= 0 ? '#c0392b' : '#2a7a22'};font-weight:700">${avail <= 0 ? 'None' : avail}</span></div>
        <div class="field-group"><span class="field-lbl">Condition</span><span class="field-val cond-${row.condition || ''}">${row.condition || '—'}</span></div>
        ${row.damageNotes ? `<div class="field-group"><span class="field-lbl">Damage Notes</span><span class="field-val">${row.damageNotes}</span></div>` : ''}
        <div class="field-group"><span class="field-lbl">Accessories</span><span class="field-val">${row.accessoriesReturned === true ? 'YES' : row.accessoriesReturned === false ? 'NO' : '—'}</span></div>
        ${row.remarks ? `<div class="field-group"><span class="field-lbl">Remarks</span><span class="field-val">${row.remarks}</span></div>` : ''}
      </div>
    </div>
    <div class="borrowers-block">
      <div class="borrowers-title">Borrower Records</div>
      <table class="detail-table">
        <thead><tr>
          <th>#</th><th>Borrower Name</th><th>Project</th><th>Control No.</th>
          <th>Withdraw</th><th>Date Borrowed</th><th>Time</th>
          <th>Return Date</th><th>Return Time</th>
          <th>Checkout Cond.</th><th>Return Cond.</th>
        </tr></thead>
        <tbody>${buildBorrowerRowsNew(row.borrowers)}</tbody>
      </table>
    </div>
  </div>`
}

function buildEquipCardOld(row, idx) {
  return `
  <div class="equip-card equip-card--old">
    <div class="equip-info-row">
      <div class="equip-num">${idx + 1}</div>
      <div class="equip-fields">
        <div class="field-group"><span class="field-lbl">Equipment / Tool</span><span class="field-val bold">${row.toolName || '—'}</span></div>
        <div class="field-group"><span class="field-lbl">Code No.</span><span class="field-val mono">${row.codeNo || '—'}</span></div>
        <div class="field-group"><span class="field-lbl">Total QTY</span><span class="field-val mono">${row.totalQty || '—'}</span></div>
        <div class="field-group"><span class="field-lbl">Condition</span><span class="field-val cond-${row.condition || ''}">${row.condition || '—'}</span></div>
        ${row.damageNotes ? `<div class="field-group"><span class="field-lbl">Damage Notes</span><span class="field-val">${row.damageNotes}</span></div>` : ''}
        <div class="field-group"><span class="field-lbl">Accessories</span><span class="field-val">${row.accessoriesReturned === true ? 'YES' : row.accessoriesReturned === false ? 'NO' : '—'}</span></div>
        ${row.remarks ? `<div class="field-group"><span class="field-lbl">Remarks</span><span class="field-val">${row.remarks}</span></div>` : ''}
      </div>
    </div>
    <div class="borrowers-block">
      <div class="borrowers-title">Borrower Records</div>
      <table class="detail-table">
        <thead><tr>
          <th>#</th><th>Borrower Name</th><th>Project</th><th>Control No.</th>
          <th>Date Borrowed</th><th>Time</th><th>Return Date</th><th>Return Time</th>
        </tr></thead>
        <tbody>${buildBorrowerRowsOld(row.borrowers)}</tbody>
      </table>
    </div>
  </div>`
}

// ── Build Section A HTML ───────────────────────────────────────
function buildSectionA(newRows) {
  const merged = mergeRows(newRows)
  return `
  <div class="detail-section">
    <div class="detail-section-header">
      ✦ Section A — New / Good Condition Equipment
      <span class="section-count">(${merged.length} items)</span>
    </div>
    ${merged.length === 0
      ? '<div class="no-data">No entries for this section.</div>'
      : merged.map((row, i) => buildEquipCardNew(row, i)).join('')
    }
  </div>`
}

// ── Build Section B HTML — only if data exists ────────────────
function buildSectionB(oldRows) {
  // ✅ Return empty string if no old equipment rows exist
  if (!oldRows || oldRows.length === 0) return ''
  const merged = mergeRows(oldRows)
  if (merged.length === 0) return ''
  return `
  <div class="detail-section">
    <div class="detail-section-header header-old-print">
      ⚠ Section B — Old / Damaged Equipment
      <span class="section-count">(${merged.length} items)</span>
    </div>
    ${merged.map((row, i) => buildEquipCardOld(row, i)).join('')}
  </div>`
}

// ══════════════════════════════════════════════════════════════
// PRINT CSS — A4 Landscape, white, dual-image header
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

body{
  font-family:'Nunito',sans-serif;
  font-size:10px;
  color:#000 !important;
  background:#fff;
}

/* ══════════════════════════════════════
   DUAL-IMAGE HEADER
   1.png → left corner, 2.png → right corner
   with comfortable padding from edges
══════════════════════════════════════ */
.print-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  margin-bottom: 6px;
  border-bottom: 1.5px solid #000;
  padding-bottom: 6px;
}

.print-header-logo {
  height: 64px;
  width: auto;
  object-fit: contain;
  display: block;
  flex-shrink: 0;
}

.print-header-center {
  flex: 1;
  text-align: center;
  padding: 0 16px;
}

/* Divider */
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
  color:#000 !important;
  margin-top:2px;
  font-weight:600;
}

.report-meta{
  font-size:9px;
  color:#000 !important;
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
  color:#000 !important;
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

.header-old-print {
  background:#ffe0d0;
  border-left-color:#c0392b;
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
  background: #FFF5E1;
  page-break-inside:avoid;
}

.equip-card--old{
  background:#fff8f5;
  border-color:#c0392b;
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
  background:#ffffff;
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
  color:#000 !important;
  margin-bottom:1px;
}

.field-val{
  font-size:10px;
  color:#000 !important;
  font-weight:700;
}

.field-val.bold { font-weight:800; }
.field-val.mono { font-family:'DM Mono',monospace; font-size:9px; }

.cond-excellent { color:#1a7a1a !important; font-weight:800; }
.cond-good      { color:#2a60a0 !important; font-weight:800; }
.cond-fair      { color:#b07000 !important; font-weight:800; }
.cond-poor      { color:#c0392b !important; font-weight:800; }

/* ── Borrowers ── */
.borrowers-block { margin-top:5px; }

.borrowers-title{
  font-size:8px;
  font-weight:800;
  letter-spacing:1.2px;
  text-transform:uppercase;
  color:#000000;
  background: #ffffff;
  margin-bottom:4px;
}

.detail-table{
  width:100%;
  border-collapse:collapse;
  background: #ffffff;
  font-size:9px;
}

.detail-table thead th{
  background:#000000;
  color:#ffffff;
  font-weight:800;
  font-size:8px;
  letter-spacing:0.8px;
  text-transform:uppercase;
  padding:4px 6px;
  border:1px solid #000000;
  text-align:left;
  white-space:nowrap;
}

.detail-table tbody td{
  padding:4px 6px;
  border:1px solid #000000;
  vertical-align:middle;
  color:#000;
}

.detail-table tbody tr:nth-child(even) td { background:#fafafa; }

.tc { text-align:center; }
.mono { font-family:'DM Mono',monospace; font-size:8px; }
.no-data { font-size:10px; color:#666; font-style:italic; padding:4px 0 8px; }
`

// ══════════════════════════════════════════════════════════════
// BUILD PRINT HEADER — dual logo layout
// ══════════════════════════════════════════════════════════════
function buildPrintHeader() {
  return `
  <div class="print-header">
    <img
      src="/src/assets/1.png"
      class="print-header-logo"
      onerror="this.style.display='none'"
      alt="Logo Left"
    />
    <div class="print-header-center"></div>
    <img
      src="/src/assets/2.png"
      class="print-header-logo"
      onerror="this.style.display='none'"
      alt="Logo Right"
    />
  </div>`
}

// ══════════════════════════════════════════════════════════════
// PRINT SINGLE DAY
// ══════════════════════════════════════════════════════════════
function printSingle(rec) {
  const newRows = rec.newEquipRows || []
  const oldRows = rec.oldEquipRows || []

  const totalR = newRows.length + oldRows.length
  const totalB = [...newRows, ...oldRows].reduce((s, r) => s + (r.borrowers || []).length, 0)

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Record — ${rec.date}</title>
  <style>${PRINT_CSS}</style>
</head>
<body>

  ${buildPrintHeader()}

  <div class="report-title-block">
    <div>
      <div class="report-title">Daily Equipment Record</div>
      <div class="report-sub">General Services Office — Power Tools Monitoring</div>
    </div>
    <div class="report-meta">
      <strong>Date:</strong> ${rec.date}<br>
      <strong>Equipment Rows:</strong> ${totalR} &nbsp;·&nbsp; <strong>Borrowers:</strong> ${totalB}
    </div>
  </div>

  ${buildSectionA(newRows)}
  ${buildSectionB(oldRows)}

</body>
</html>`

  const w = window.open('', '_blank', 'width=1100,height=800')
  w.document.write(html)
  w.document.close()
  w.onload = () => { w.focus(); w.print() }
}

// ══════════════════════════════════════════════════════════════
// PRINT GROUP (Weekly / Monthly)
// ══════════════════════════════════════════════════════════════
function printGroup(records, reportType, periodLabel) {
  const totalR = records.reduce((s, r) => s + (r.newEquipRows || []).length + (r.oldEquipRows || []).length, 0)
  const totalB = records.reduce((s, r) => {
    return s + [...(r.newEquipRows || []), ...(r.oldEquipRows || [])].reduce((ss, row) => ss + (row.borrowers || []).length, 0)
  }, 0)

  const daysHtml = records.map(rec => {
    const newRows = rec.newEquipRows || []
    const oldRows = rec.oldEquipRows || []
    const dR = newRows.length + oldRows.length
    const dB = [...newRows, ...oldRows].reduce((s, r) => s + (r.borrowers || []).length, 0)
    return `
    <div class="day-header">
      <span>${rec.date}</span>
      <span class="dh-meta">${dR} equipment rows &nbsp;·&nbsp; ${dB} borrowers</span>
    </div>
    ${buildSectionA(newRows)}
    ${buildSectionB(oldRows)}`
  }).join('')

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${reportType} — ${periodLabel}</title>
  <style>${PRINT_CSS}</style>
</head>
<body>

  ${buildPrintHeader()}

  <div class="report-title-block">
    <div>
      <div class="report-title">${reportType}</div>
      <div class="report-sub">General Services Office — Power Tools Monitoring</div>
    </div>
    <div class="report-meta">
      <strong>Period:</strong> ${periodLabel}<br>
      <strong>Days:</strong> ${records.length} &nbsp;·&nbsp;
      <strong>Equipment Rows:</strong> ${totalR} &nbsp;·&nbsp;
      <strong>Borrowers:</strong> ${totalB}
    </div>
  </div>

  ${daysHtml}

</body>
</html>`

  const w = window.open('', '_blank', 'width=1100,height=800')
  w.document.write(html)
  w.document.close()
  w.onload = () => { w.focus(); w.print() }
}

// ══════════════════════════════════════════════════════════════
// EXCEL EXPORT — uses SheetJS (loaded on demand from CDN)
// ══════════════════════════════════════════════════════════════

/** Lazy-load SheetJS from CDN, resolves with the XLSX global */
function loadXLSX() {
  return new Promise((resolve, reject) => {
    if (window.XLSX) { resolve(window.XLSX); return }
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
    s.onload  = () => resolve(window.XLSX)
    s.onerror = () => reject(new Error('Failed to load SheetJS'))
    document.head.appendChild(s)
  })
}

/**
 * Build a flat array of row objects for all equipment rows + borrowers.
 * Each borrower occupies one spreadsheet row.
 * Equipment rows without borrowers still get one row (borrower fields blank).
 */
function buildSheetRows(records) {
  const rows = []
  for (const rec of records) {
    const sections = [
      { label: 'Section A — New/Good', rows: rec.newEquipRows || [] },
      { label: 'Section B — Old/Damaged', rows: rec.oldEquipRows || [] },
    ]
    for (const sec of sections) {
      for (const row of sec.rows) {
        const borrowers = row.borrowers && row.borrowers.length ? row.borrowers : [null]
        for (const b of borrowers) {
          rows.push({
            'Date':               rec.date,
            'Section':            sec.label,
            'Equipment / Tool':   row.toolName   || '',
            'Code No.':           row.codeNo      || '',
            'Total QTY':          row.qty         || '',
            'Condition':          row.condition   || '',
            'Damage Notes':       row.damageNotes || '',
            'Accessories Returned': row.accessoriesReturned === true ? 'YES'
                                  : row.accessoriesReturned === false ? 'NO' : '',
            'Remarks':            row.remarks     || '',
            'Borrower Name':      b ? (b.name    || '') : '',
            'Project':            b ? (b.project || '') : '',
            'Withdraw QTY':       b ? (b.withdraw || 0) : '',
            'Date Borrowed':      b ? (b.dateBorrowed || '') : '',
            'Time Borrowed':      b ? (b.timeBorrowed || '') : '',
            'Checkout Condition': b ? (b.conditionCheckout || '') : '',
            'Return Date':        b ? (b.returnDate || '') : '',
            'Return Time':        b ? (b.returnTime || '') : '',
            'Return Condition':   b ? (b.conditionReturn || '') : '',
          })
        }
      }
    }
  }
  return rows
}

/** Style the header row: bold + dark background + white text */
function styleSheet(ws, XLSX) {
  const range = XLSX.utils.decode_range(ws['!ref'])
  for (let C = range.s.c; C <= range.e.c; C++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })]
    if (!cell) continue
    cell.s = {
      font:      { bold: true, color: { rgb: 'FFFFFF' } },
      fill:      { fgColor: { rgb: '3B2A1A' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    }
  }
  // Freeze top row
  ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft' }
}

/** Shared download helper */
async function downloadExcel(records, filename, sheetName) {
  let XLSX
  try { XLSX = await loadXLSX() }
  catch { alert('Could not load Excel library. Check your internet connection.'); return }

  const data  = buildSheetRows(records)
  if (!data.length) { alert('No data to export.'); return }

  const ws = XLSX.utils.json_to_sheet(data)

  // Auto column widths
  const colWidths = Object.keys(data[0]).map(key => ({
    wch: Math.max(key.length, ...data.map(r => String(r[key] ?? '').length)) + 2
  }))
  ws['!cols'] = colWidths

  styleSheet(ws, XLSX)

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31))
  XLSX.writeFile(wb, filename)
}

/** Export a single day record */
async function exportSingleExcel(rec) {
  await downloadExcel([rec], `Equipment_Record_${rec.date}.xlsx`, rec.date)
}

/** Export a group of records (weekly / monthly / yearly) */
async function exportGroupExcel(records, reportType, periodLabel) {
  const safeName = periodLabel.replace(/[^a-zA-Z0-9_\-]/g, '_')
  const safeType = reportType.replace(/\s+/g, '_')
  await downloadExcel(records, `${safeType}_${safeName}.xlsx`, periodLabel.slice(0, 31))
}
</script>

<style scoped>
/* ════════════════════════
   CSS VARIABLES (local fallbacks)
════════════════════════ */
.history-wrap {
  --surface:   #fdf8f5;
  --surface2:  #f7f0e8;
  --border:    #e8ddd0;
  --accent:    #8a6a4a;
  --accent2:   #a0855e;
  --danger:    #c0392b;
  --success:   #27ae60;
  --warning:   #e67e22;
  --muted:     #888;
  padding: 24px 32px 60px;
  max-width: 1200px;
  margin: 0 auto;
}

/* ════════════════════════
   TOOLBAR
════════════════════════ */
.toolbar {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 18px;
  background: #ffffff;
  border: 1.5px solid var(--border);
  border-radius: 14px;
  padding: 12px 18px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.tb-search-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 220px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 6px 12px;
}

.search-icon { font-size: 14px; flex-shrink: 0; }

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-family: 'Nunito', sans-serif;
  font-size: 13px;
  color: #000;
  outline: none;
}

.clear-x {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--muted);
  font-size: 13px;
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
}

.date-input {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 5px 10px;
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  color: #000;
  background: var(--surface2);
  outline: none;
}

/* View toggle */
.view-toggle {
  display: flex;
  gap: 0;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.vt {
  padding: 6px 14px;
  border: none;
  background: none;
  font-family: 'Nunito', sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.15s;
  letter-spacing: 0.5px;
}
.vt:not(:last-child) { border-right: 1px solid var(--border); }
.vt:hover { background: var(--surface2); color: #000; }
.vt--active { background: var(--accent) !important; color: #fff !important; }

/* Result pill */
.result-pill {
  display: flex;
  align-items: baseline;
  gap: 4px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 4px 12px;
}

.result-num {
  font-family: 'DM Mono', monospace;
  font-size: 14px;
  font-weight: 700;
  color: var(--accent);
}

.result-lbl {
  font-family: 'Nunito', sans-serif;
  font-size: 10px;
  color: var(--muted);
  font-weight: 600;
}

/* Search hint */
.search-hint {
  font-family: 'Nunito', sans-serif;
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 12px;
  padding: 8px 14px;
  background: rgba(138,106,74,0.06);
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.clear-hint {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
  font-family: 'Nunito', sans-serif;
  font-size: 11px;
  font-weight: 700;
  text-decoration: underline;
  padding: 0;
}

/* ════════════════════════
   EMPTY STATE
════════════════════════ */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--muted);
  font-family: 'Nunito', sans-serif;
}

.empty-icon { font-size: 48px; margin-bottom: 14px; }

.empty-state p {
  font-size: 15px;
  font-weight: 600;
  color: #555;
  margin-bottom: 6px;
}

.empty-state .sub {
  font-size: 12px;
  color: var(--muted);
  font-weight: 400;
}

/* ════════════════════════
   PERIOD BLOCKS (weekly/monthly)
════════════════════════ */
.period-block { margin-bottom: 24px; }

.period-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  border-radius: 12px 12px 0 0;
  gap: 12px;
  flex-wrap: wrap;
}

.period-header--week  { background: linear-gradient(135deg, #f0e8dc, #e8ddd0); border: 1.5px solid var(--border); }
.period-header--month { background: linear-gradient(135deg, #e8ddd0, #ddd0c4); border: 1.5px solid #d0c4b8; }
.period-header--year  { background: linear-gradient(135deg, #dde8f0, #ccd8e8); border: 1.5px solid #b8ccdc; }

.period-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.period-badge {
  font-family: 'Nunito', sans-serif;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1.5px;
  padding: 3px 8px;
  border-radius: 6px;
  flex-shrink: 0;
}

.badge--week  { background: var(--accent);  color: #fff; }
.badge--month { background: var(--accent2); color: #fff; }
.badge--year  { background: #2a6099;        color: #fff; }

.period-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.period-title {
  font-family: 'Nunito', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #000;
}

.period-meta {
  font-family: 'Nunito', sans-serif;
  font-size: 11px;
  color: var(--muted);
}

.print-group-btn {
  background: #ffffff;
  border: 1.5px solid var(--border);
  border-radius: 8px;
  padding: 7px 16px;
  font-family: 'Nunito', sans-serif;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  color: #000;
  transition: all 0.15s;
  flex-shrink: 0;
}
.print-group-btn:hover { background: var(--surface2); border-color: var(--accent); }

.export-group-btn { background: #eaf4ea; border-color: #27ae60; color: #1a6e3a; }
.export-group-btn:hover { background: #d4edda; border-color: #1e8449; }

.btn-group-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }

.period-inner { border-radius: 0 0 12px 12px; overflow: hidden; }

/* ════════════════════════
   RECORD LIST
════════════════════════ */
.record-list {
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

/* ── Row action buttons ── */
.row-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.row-btn {
  border: none;
  border-radius: 6px;
  padding: 4px 12px;
  font-family: 'Nunito', sans-serif;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
}

.row-btn--edit   { background: #e8f0ff; color: #2a60a0; }
.row-btn--delete { background: #ffe8e8; color: var(--danger); }
.row-btn--edit:hover   { background: #d0e0ff; }
.row-btn--delete:hover { background: #ffd0d0; }

.borrower-edit-btn {
  background: #e8f0ff;
  color: #2a60a0;
  border: none;
  border-radius: 4px;
  padding: 3px 8px;
  font-size: 10px;
  cursor: pointer;
  white-space: nowrap;
}
.borrower-edit-btn:hover { background: #d0e0ff; }

/* ── Button variants ── */
.btn {
  font-family: 'Nunito', sans-serif;
  font-weight: 700;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-sm { padding: 7px 16px; font-size: 12px; }
.btn-primary   { background: var(--accent);  color: #fff; }
.btn-primary:hover   { background: #7a5a3a; }
.btn-edit      { background: #2a6099; color: #fff; }
.btn-edit:hover      { background: #1f4a75; }
.btn-secondary { background: var(--surface2); color: #000; border: 1px solid var(--border); }
.btn-secondary:hover { background: var(--border); }
.btn-danger    { background: var(--danger); color: #fff; }
.btn-danger:hover    { background: #a02020; }
.btn-excel     { background: #27ae60; color: #fff; }
.btn-excel:hover     { background: #1e8449; }

/* ── Edit form ── */
.edit-form { padding: 20px 24px 24px; }

.edit-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 14px;
  margin-bottom: 16px;
}

.ef-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-family: 'Nunito', sans-serif;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--muted);
}

.ef-input {
  border: 1.5px solid var(--border);
  border-radius: 7px;
  padding: 7px 10px;
  font-family: 'Nunito', sans-serif;
  font-size: 13px;
  color: #000;
  background: var(--surface2);
  outline: none;
  width: 100%;
  transition: border-color 0.15s;
}
.ef-input:focus { border-color: var(--accent); }

.del-btn-sm {
  background: #ffe8e8;
  color: var(--danger);
  border: none;
  border-radius: 4px;
  padding: 3px 7px;
  cursor: pointer;
  font-size: 11px;
}
.del-btn-sm:hover { background: #ffd0d0; }

/* ── Modal box edit variant ── */
.modal-box--edit {
  max-width: 1000px;
  overflow-y: auto;
  max-height: 90vh;
}

@media print {
  .modal-toolbar { display: none !important; }
  .print-only    { display: flex !important; }
  .no-print      { display: none !important; }
}
</style>