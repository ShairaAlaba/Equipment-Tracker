<template>
  <!-- BorrowerForm.vue — for NEW equipment section -->
  <tr class="borrower-panel-row">
    <td :colspan="11">
      <div class="borrower-panel panel-new">

        <div class="panel-label">
          ↳ Borrower Records — {{ row.toolName || 'Equipment' }}
        </div>

        <div class="borrower-table-wrap" v-if="row.borrowers.length">
          <table class="borrower-table">
            <thead>
              <tr>
                <th style="width:30px">#</th>
                <th style="min-width:160px">Name of Borrower</th>
                <th style="min-width:140px">Assigned Project</th>
                <th style="min-width:120px">Control No.</th>
                <th class="wd-th" style="min-width:80px">Withdraw</th>
                <th class="group-header" style="min-width:120px">Condition at Check-Out</th>
                <th class="group-header" style="min-width:150px">Checkout Damage Notes</th>
                <th class="group-header" style="min-width:118px">Date Borrowed</th>
                <th class="group-header" style="min-width:96px">Time Borrowed</th>
                <th class="group-header" style="min-width:118px">Return Date</th>
                <th class="group-header" style="min-width:96px">Return Time</th>
                <th class="group-header" style="min-width:120px">Condition Upon Return</th>
                <th class="group-header" style="min-width:150px">Return Damage Notes</th>
                <th class="action-th" style="min-width:140px">Actions</th>
                <th style="width:36px">Del</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(b, bi) in row.borrowers"
                :key="b.id"
                :class="{ 'row-returned': b.returned }"
              >
                <td class="row-num">{{ bi + 1 }}</td>
                <td><input type="text" v-model="b.name" placeholder="Full name" data-col="0" @keydown.enter.prevent="focusNext($event)" /></td>
                <td><input type="text" v-model="b.project" placeholder="Project" data-col="1" @keydown.enter.prevent="focusNext($event)" /></td>
                <td><input type="text" v-model="b.controlNo" placeholder="CTRL-0001" class="ctrl-input" data-col="2" @keydown.enter.prevent="focusNext($event)" /></td>

                <td class="wd-cell">
                  <input type="number" min="0" v-model.number="b.withdraw" placeholder="0" class="wd-input" data-col="3" @keydown.enter.prevent="focusNext($event)" />
                </td>

                <td>
                  <select v-model="b.conditionCheckout" :class="'condition-' + b.conditionCheckout" data-col="4" @keydown.enter.prevent="focusNext($event)">
                    <option value="">— Select —</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </td>

                <td>
                  <textarea v-model="b.conditionCheckoutNotes" placeholder="Damage notes at checkout..." rows="2" data-col="5" @keydown.enter.prevent="focusNext($event)" />
                </td>

                <td><input type="date" v-model="b.dateBorrowed" data-col="6" @keydown.enter.prevent="focusNext($event)" /></td>
                <td><input type="time" v-model="b.timeBorrowed" data-col="7" @keydown.enter.prevent="focusNext($event)" /></td>

                <!-- Return Date — highlighted green after Returned clicked -->
                <td :class="{ 'returned-cell': b.returned }">
                  <input type="date" v-model="b.returnDate" data-col="8" @keydown.enter.prevent="focusNext($event)" />
                  <span v-if="b.returned" class="returned-tag">✓ Returned</span>
                </td>

                <td :class="{ 'returned-cell': b.returned }">
                  <input type="time" v-model="b.returnTime" data-col="9" @keydown.enter.prevent="focusNext($event)" />
                </td>

                <td>
                  <select v-model="b.conditionReturn" :class="'condition-' + b.conditionReturn" data-col="10" @keydown.enter.prevent="focusNext($event)">
                    <option value="">— Select —</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </td>

                <td>
                  <textarea v-model="b.conditionReturnNotes" placeholder="Damage notes upon return..." rows="2" data-col="11" @keydown.enter.prevent="focusNext($event)" />
                </td>

                <!-- ── ACTIONS column ── -->
                <td class="action-cell">
                  <!-- RETURNED button -->
                  <button
                    class="action-btn btn-returned"
                    :class="{ 'btn-returned--done': b.returned }"
                    @click="markReturned(b)"
                    :title="b.returned ? 'Already marked returned' : 'Mark as Returned — auto-fills return date & time'"
                  >
                    {{ b.returned ? '✓ Returned' : '↩ Return' }}
                  </button>

                  <!-- VIEW button -->
                  <button
                    class="action-btn btn-view"
                    @click="openCard(b)"
                    title="View & print borrower card"
                  >
                    👁 View Card
                  </button>
                </td>

                <td>
                  <button class="del-btn" @click="$emit('remove-borrower', row, bi)" title="Remove">✕</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="no-borrowers">No borrower entries yet.</div>

        <!-- Live inventory summary -->
        <div class="inv-summary">
          <span class="inv-chip">Total QTY: <strong>{{ row.totalQty || 0 }}</strong></span>
          <span class="inv-sep">—</span>
          <span class="inv-chip">Withdrawn: <strong class="chip-blue">{{ totalWithdrawn }}</strong></span>
          <span class="inv-sep">=</span>
          <span class="inv-chip">
            Available:
            <strong :class="available <= 0 ? 'chip-red' : 'chip-green'">
              {{ available <= 0 ? 'No Equipment Available' : available }}
            </strong>
          </span>
          <span v-if="returnedCount > 0" class="inv-sep">·</span>
          <span v-if="returnedCount > 0" class="inv-chip">
            <strong class="chip-returned">{{ returnedCount }} returned</strong>
          </span>
        </div>

        <button class="add-borrower-btn add-borrower-new" @click="$emit('add-borrower', row)">
          ＋ Add Borrower Entry
        </button>

      </div>
    </td>
  </tr>

  <!-- ══════════════════════════════════════
       BORROWER CARD MODAL
  ══════════════════════════════════════ -->
  <BorrowerCardModal
    v-if="viewingBorrower"
    :borrower="viewingBorrower"
    :row="row"
    :record-date="recordDate"
    @close="viewingBorrower = null"
    @save-row="handleSaveRow"
  />
</template>

<script setup>
import { ref, computed } from 'vue'
import BorrowerCardModal from './BorrowerCardModal.vue'

const props = defineProps({
  row:        { type: Object, required: true },
  section:    { type: String, default: 'new' },
  recordDate: { type: String, default: '' }
})

const emit = defineEmits(['add-borrower', 'remove-borrower', 'save-row'])

// ── Card modal state ──
const viewingBorrower = ref(null)

function openCard(b) {
  viewingBorrower.value = b
}

// ── Enter key: move focus to next column in the same row ──
function focusNext(event) {
  const tr = event.target.closest('tr')
  if (!tr) return
  const focusables = Array.from(
    tr.querySelectorAll('input[data-col], select[data-col], textarea[data-col]')
  ).filter(el => !el.disabled)
  const idx = focusables.indexOf(event.target)
  if (idx !== -1 && idx < focusables.length - 1) {
    focusables[idx + 1].focus()
  }
}

// ── Mark Returned: auto-fill date + time, free up availability ──
function markReturned(b) {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10)
  const timeStr = now.toTimeString().slice(0, 5)   // HH:MM
  b.returnDate = dateStr
  b.returnTime = timeStr
  b.returned   = true   // flag used to style the row and reduce withdrawn count
}

// ── Pass save-row up to App.vue ──
function handleSaveRow() {
  viewingBorrower.value = null
  emit('save-row', props.row)
}

// ── Computed inventory ──
// Only count borrowers who have NOT been returned yet
const activeWithdrawn = computed(() =>
  (props.row.borrowers || [])
    .filter(b => !b.returned)
    .reduce((sum, b) => sum + (parseInt(b.withdraw) || 0), 0)
)

const totalWithdrawn = computed(() =>
  (props.row.borrowers || []).reduce((sum, b) => sum + (parseInt(b.withdraw) || 0), 0)
)

const available = computed(() =>
  (parseInt(props.row.totalQty) || 0) - activeWithdrawn.value
)

const returnedCount = computed(() =>
  (props.row.borrowers || []).filter(b => b.returned).length
)
</script>

<style scoped>
.borrower-panel-row td { padding: 0; }
.borrower-panel { padding: 12px 16px 14px; }

.panel-new {
  background: rgba(245,237,224,0.6);
  border-left: 4px solid rgba(138,106,74,0.3);
}

.panel-label {
  font-family: 'Nunito', sans-serif;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-bottom: 10px;
  color: #000000;
}

.borrower-table-wrap {
  overflow-x: auto;
  border-radius: 7px;
  border: 1px solid var(--border);
  margin-bottom: 10px;
}

.borrower-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  min-width: 1700px;
}

.borrower-table thead th {
  padding: 8px 10px;
  background: #97704f;
  color: #000000;
  font-family: 'Nunito', sans-serif;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  white-space: nowrap;
  border-bottom: 1.5px solid var(--border);
  text-align: left;
}

.borrower-table .wd-th {
  background: #97704f;
  color: #000000;
  border-left: 2px solid rgba(58,122,50,0.3);
}

.borrower-table .group-header {
  border-left: 1px solid var(--border);
}

.action-th {
  background: #eef4fb !important;
  color: #2a5090 !important;
  border-left: 2px solid rgba(42,80,144,0.25) !important;
  text-align: center !important;
}

.borrower-table tbody tr {
  border-bottom: 1px solid #ede5da;
  transition: background 0.15s;
}
.borrower-table tbody tr:hover { background: #fdf8f3; }
.borrower-table tbody td { padding: 7px 9px; vertical-align: top; }

/* Returned row styling */
.row-returned { background: rgba(42,122,34,0.04) !important; }
.returned-cell { background: rgba(42,122,34,0.07) !important; position: relative; }
.returned-tag {
  display: block;
  font-family: 'Nunito', sans-serif;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #2a7a22;
  margin-top: 3px;
}

.row-num {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: var(--muted);
  text-align: center;
}

.ctrl-input {
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.wd-cell {
  background: rgba(232,244,232,0.45);
  border-left: 2px solid rgba(58,122,50,0.2);
  vertical-align: middle !important;
}

.wd-input {
  width: 66px !important;
  text-align: center;
  font-family: 'DM Mono', monospace;
  font-size: 15px;
  font-weight: 800;
  color: #0c0c0c;
  padding: 4px 6px;
}

/* ── Action buttons ── */
.action-cell {
  vertical-align: middle !important;
  text-align: center;
  border-left: 2px solid rgba(42,80,144,0.15);
  background: rgba(238,244,251,0.4);
}

.action-btn {
  display: block;
  width: 100%;
  margin-bottom: 5px;
  padding: 5px 10px;
  border-radius: 8px;
  border: 1.5px solid;
  font-family: 'Nunito', sans-serif;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.18s;
  white-space: nowrap;
  text-align: center;
}
.action-btn:last-child { margin-bottom: 0; }

.btn-returned {
  background: rgba(42,122,34,0.07);
  border-color: rgba(42,122,34,0.3);
  color: #2a7a22;
}
.btn-returned:hover { background: rgba(42,122,34,0.14); border-color: #2a7a22; }
.btn-returned--done {
  background: rgba(42,122,34,0.12);
  border-color: #2a7a22;
  color: #2a7a22;
  opacity: 0.7;
  cursor: default;
}

.btn-view {
  background: rgba(42,96,153,0.07);
  border-color: rgba(42,96,153,0.3);
  color: #2a6099;
}
.btn-view:hover { background: rgba(42,96,153,0.14); border-color: #2a6099; }

/* ── Live summary ── */
.inv-summary {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  background: #ffffff;
  border: 1.5px solid var(--border);
  border-radius: 10px;
  padding: 8px 16px;
  margin-bottom: 10px;
  font-family: 'Nunito', sans-serif;
  font-size: 12px;
  color: var(--muted);
}
.inv-chip { display: flex; align-items: center; gap: 5px; }
.inv-chip strong { font-family: 'DM Mono', monospace; font-size: 14px; color: #000000; }
.chip-blue     { color: #2a6099 !important; }
.chip-green    { color: #2a7a22 !important; }
.chip-red      { color: var(--danger) !important; font-size: 11px; }
.chip-returned { color: #2a7a22 !important; font-size: 12px; }
.inv-sep { color: var(--border); font-size: 18px; font-weight: 300; line-height: 1; }

.del-btn {
  background: none;
  border: none;
  color: rgba(184,50,50,0.5);
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 4px;
  transition: color 0.15s, background 0.15s;
}
.del-btn:hover { color: var(--danger); background: rgba(184,50,50,0.08); }

.no-borrowers {
  color: var(--muted);
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  padding: 8px 4px;
  margin-bottom: 8px;
}

.add-borrower-btn {
  background: none;
  border-radius: 6px;
  padding: 6px 16px;
  font-size: 12px;
  font-family: 'Nunito', sans-serif;
  font-weight: 700;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  color: #000000;
}
.add-borrower-new {
  border: 1px dashed rgba(138,106,74,0.35);
  color: rgba(138,106,74,0.7);
}
.add-borrower-new:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: rgba(138,106,74,0.05);
}
</style>