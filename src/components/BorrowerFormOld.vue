<template>
  <!-- BorrowerFormOld.vue
       Used by the Old / Damaged equipment section.
       Columns: Name of Borrower, Assigned Project, Control No.,
                Date Borrowed, Time Borrowed, Return Date, Return Time
  -->
  <tr class="borrower-panel-row">
    <td :colspan="10">
      <div class="borrower-panel panel-old">

        <div class="panel-label">
          ↳ Borrower Records — {{ row.toolName || 'Equipment' }}
        </div>

        <div class="borrower-table-wrap" v-if="row.borrowers.length">
          <table class="borrower-table">
            <thead>
              <tr>
                <th style="width:30px">#</th>
                <th style="min-width:160px">Name of Borrower</th>
                <th style="min-width:150px">Assigned Project</th>
                <th style="min-width:130px">Control No.</th>
                <th class="group-header" style="min-width:120px">Date Borrowed</th>
                <th class="group-header" style="min-width:100px">Time Borrowed</th>
                <th class="group-header" style="min-width:120px">Return Date</th>
                <th class="group-header" style="min-width:100px">Return Time</th>
                <th style="width:36px">Del</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(b, bi) in row.borrowers" :key="b.id">
                <td class="row-num">{{ bi + 1 }}</td>

                <td>
                  <input type="text" v-model="b.name" placeholder="Full name" data-col="0" @keydown.enter.prevent="focusNext($event)" />
                </td>

                <td>
                  <input type="text" v-model="b.project" placeholder="Project" data-col="1" @keydown.enter.prevent="focusNext($event)" />
                </td>

                <!-- Control No. per borrower -->
                <td>
                  <input type="text" v-model="b.controlNo" placeholder="CTRL-0001" class="ctrl-input" data-col="2" @keydown.enter.prevent="focusNext($event)" />
                </td>

                <td><input type="date" v-model="b.dateBorrowed" data-col="3" @keydown.enter.prevent="focusNext($event)" /></td>
                <td><input type="time" v-model="b.timeBorrowed" data-col="4" @keydown.enter.prevent="focusNext($event)" /></td>
                <td><input type="date" v-model="b.returnDate" data-col="5" @keydown.enter.prevent="focusNext($event)" /></td>
                <td><input type="time" v-model="b.returnTime" data-col="6" @keydown.enter.prevent="focusNext($event)" /></td>

                <td>
                  <button class="del-btn" @click="$emit('remove-borrower', row, bi)" title="Remove">✕</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="no-borrowers">No borrower entries yet.</div>

        <button class="add-borrower-btn add-borrower-old" @click="$emit('add-borrower', row)">
          ＋ Add Borrower Entry
        </button>

      </div>
    </td>
  </tr>
</template>

<script setup>
defineProps({
  row:     { type: Object, required: true },
  section: { type: String, default: 'old' }
})

defineEmits(['add-borrower', 'remove-borrower'])

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
</script>

<style scoped>
.borrower-panel-row td { padding: 0; }

.borrower-panel {
  padding: 12px 16px 14px;
  background: rgba(255, 246, 240, 0.7);
  border-left: 4px solid rgba(184, 50, 50, 0.2);
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
  min-width: 900px;
}

.borrower-table thead th {
  padding: 8px 10px;
  background:#97704f;
  color: #000000;
  font-family: 'Nunito', sans-serif;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  white-space: nowrap;
  border-bottom: 1.5px solid #e8cfc0;
  text-align: left;
}

.borrower-table .group-header {
  border-left: 1px solid var(--border);
}

.borrower-table tbody tr {
  border-bottom: 1px solid #ede5da;
  transition: background 0.15s;
}
.borrower-table tbody tr:hover { background: #fff5f0; }
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
.add-borrower-old {
  border: 1px dashed rgba(184,50,50,0.3);
  color: rgba(184,50,50,0.65);
}
.add-borrower-old:hover {
  border-color: var(--danger);
  color: var(--danger);
  background: rgba(184,50,50,0.04);
}
</style>