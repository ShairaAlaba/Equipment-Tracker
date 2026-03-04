<template>
  <!-- BorrowerForm.vue — for NEW equipment section
       Control No. lives here (after Assigned Project), not in the equipment row.
  -->
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
                <th style="width:36px">Del</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(b, bi) in row.borrowers" :key="b.id">
                <td class="row-num">{{ bi + 1 }}</td>

                <td>
                  <input type="text" v-model="b.name" placeholder="Full name" />
                </td>

                <td>
                  <input type="text" v-model="b.project" placeholder="Project" />
                </td>

                <!-- Control No. per borrower entry -->
                <td>
                  <input type="text" v-model="b.controlNo" placeholder="CTRL-0001" class="ctrl-input" />
                </td>

                <!-- Withdraw qty -->
                <td class="wd-cell">
                  <input
                    type="number"
                    min="0"
                    v-model.number="b.withdraw"
                    placeholder="0"
                    class="wd-input"
                  />
                </td>

                <td>
                  <select v-model="b.conditionCheckout" :class="'condition-' + b.conditionCheckout">
                    <option value="">— Select —</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </td>

                <td>
                  <textarea v-model="b.conditionCheckoutNotes" placeholder="Damage notes at checkout..." rows="2" />
                </td>

                <td><input type="date" v-model="b.dateBorrowed" /></td>
                <td><input type="time" v-model="b.timeBorrowed" /></td>
                <td><input type="date" v-model="b.returnDate" /></td>
                <td><input type="time" v-model="b.returnTime" /></td>

                <td>
                  <select v-model="b.conditionReturn" :class="'condition-' + b.conditionReturn">
                    <option value="">— Select —</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </td>

                <td>
                  <textarea v-model="b.conditionReturnNotes" placeholder="Damage notes upon return..." rows="2" />
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
        </div>

        <button class="add-borrower-btn add-borrower-new" @click="$emit('add-borrower', row)">
          ＋ Add Borrower Entry
        </button>

      </div>
    </td>
  </tr>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  row:     { type: Object, required: true },
  section: { type: String, default: 'new' }
})

defineEmits(['add-borrower', 'remove-borrower'])

const totalWithdrawn = computed(() =>
  (props.row.borrowers || []).reduce((sum, b) => sum + (parseInt(b.withdraw) || 0), 0)
)

const available = computed(() =>
  (parseInt(props.row.totalQty) || 0) - totalWithdrawn.value
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
  min-width: 1500px;
}

.borrower-table thead th {
  padding: 8px 10px;
  background: var(--surface2);
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
  background: #e8f4e8;
  color: #2a7a22;
  border-left: 2px solid rgba(58,122,50,0.3);
}

.borrower-table .group-header {
  border-left: 1px solid var(--border);
}

.borrower-table tbody tr {
  border-bottom: 1px solid #ede5da;
  transition: background 0.15s;
}
.borrower-table tbody tr:hover { background: #fdf8f3; }
.borrower-table tbody td { padding: 7px 9px; vertical-align: top; }

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
  color: #2a7a22;
  padding: 4px 6px;
}

/* Live summary */
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
.chip-blue  { color: #2a6099 !important; }
.chip-green { color: #2a7a22 !important; }
.chip-red   { color: var(--danger) !important; font-size: 11px; }
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