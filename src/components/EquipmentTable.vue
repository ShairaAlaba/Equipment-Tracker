<template>
  <div class="section-block">

    <!-- Section Header -->
    <div class="section-header" :class="section + '-section'">
      <span class="section-badge" :class="'badge-' + section">
        {{ section === 'new' ? '✦ New Equipment' : '⚠ Old / Damaged Equipment' }}
      </span>
      <span class="section-title">{{ sectionLabel }}</span>
      <span class="section-code">{{ sectionCode }}</span>
    </div>

    <!-- ══════════════════════════════════════
         NEW EQUIPMENT TABLE
    ══════════════════════════════════════ -->
    <div v-if="section === 'new'" class="table-wrap wrap-new">
      <table class="new-section">
        <thead>
          <tr>
            <th style="width:34px">#</th>
            <th style="min-width:130px">Code No.</th>
            <th style="min-width:230px">Equipment / Tool Name</th>
            <th class="inv-group" style="min-width:74px">Total QTY</th>
            <th class="inv-group" style="min-width:94px">Withdrawn</th>
            <th class="inv-group" style="min-width:110px">Available</th>
            <th style="min-width:120px">Condition</th>
            <th style="min-width:160px">Damage Notes</th>
            <th style="min-width:114px">Accessories Returned</th>
            <th style="min-width:160px">Remarks</th>
            <th style="min-width:124px">Actions</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(row, ri) in rows" :key="row.id">
            <tr class="equip-row">
              <td class="row-num">{{ ri + 1 }}</td>

              <!-- ── Code No. — primary input ── -->
              <td>
                <div class="code-input-wrap">
                  <input
                    type="text"
                    v-model="row.codeNo"
                    placeholder="e.g. 8160"
                    class="code-input"
                    @input="onCodeInput(row)"
                    @blur="onCodeInput(row)"
                  />
                  <span
                    v-if="row.codeNo"
                    class="code-match-dot"
                    :class="findByCode(row.codeNo) ? 'dot-match' : 'dot-unknown'"
                    :title="findByCode(row.codeNo) ? 'Matched: ' + findByCode(row.codeNo).name : 'Not in master list — you can still type the name manually'"
                  ></span>
                </div>
              </td>

              <!-- ── Equipment Name — auto-filled when code matches, editable otherwise ── -->
              <td class="equip-name-cell">
                <div v-if="findByCode(row.codeNo)" class="equip-name-matched">
                  <span class="equip-name-text">{{ row.toolName }}</span>
                  <span class="auto-filled-tag">auto</span>
                </div>
                <input
                  v-else
                  type="text"
                  v-model="row.toolName"
                  placeholder="Enter equipment name"
                  class="equip-name-input"
                />
              </td>

              <!-- Total QTY -->
              <td class="inv-cell">
                <input type="number" min="0" v-model.number="row.totalQty" placeholder="0" class="inv-input" />
              </td>

              <!-- Withdrawn (auto-sum) -->
              <td class="inv-cell inv-cell--auto">
                <span class="withdrawn-val">{{ sumWithdrawn(row) }}</span>
                <span class="auto-tag">auto</span>
              </td>

              <!-- Available (auto) -->
              <td class="inv-cell">
                <span class="available-badge" :class="{ 'avail-ok': calcAvailable(row) > 0, 'avail-none': calcAvailable(row) <= 0 }">
                  {{ calcAvailable(row) <= 0 ? 'No Equipment Available' : calcAvailable(row) }}
                </span>
              </td>

              <td>
                <select class="condition-select" v-model="row.condition" :class="'condition-' + row.condition">
                  <option value="">— Select —</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </td>

              <td><textarea v-model="row.damageNotes" placeholder="Describe damage (if any)..." rows="2" /></td>

              <td>
                <div class="toggle-wrap">
                  <button class="toggle-btn toggle-yes" :class="{ active: row.accessoriesReturned === true }" @click="row.accessoriesReturned = true">YES</button>
                  <button class="toggle-btn toggle-no"  :class="{ active: row.accessoriesReturned === false }" @click="row.accessoriesReturned = false">NO</button>
                </div>
              </td>

              <td><input type="text" v-model="row.remarks" placeholder="Additional remarks..." /></td>

              <td class="actions-cell">
                <button
                  class="btn btn-sm"
                  :class="row.showBorrowers ? 'borrower-btn-active' : 'btn-secondary'"
                  @click="$emit('toggle-borrowers', row)"
                  style="margin-bottom:4px;width:100%"
                >
                  {{ row.showBorrowers ? '▲' : '▼' }} Borrowers
                  <span class="borrower-count">{{ row.borrowers.length }}</span>
                </button>
                <button class="btn btn-sm btn-danger" style="width:100%" @click="$emit('remove-row', ri)">✕ Remove</button>
              </td>
            </tr>

            <BorrowerForm
              v-if="row.showBorrowers"
              :row="row"
              :section="section"
              @add-borrower="(r) => $emit('add-borrower', r)"
              @remove-borrower="(r, i) => $emit('remove-borrower', r, i)"
            />
          </template>

          <tr v-if="rows.length === 0">
            <td colspan="11" class="empty-row">No records yet — click "Add Row" below to begin.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ══════════════════════════════════════
         OLD / DAMAGED EQUIPMENT TABLE (UNCHANGED)
    ══════════════════════════════════════ -->
    <div v-if="section === 'old'" class="table-wrap wrap-old">
      <table class="old-section">
        <thead>
          <tr>
            <th style="width:34px">#</th>
            <th style="min-width:120px">Code No.</th>
            <th style="min-width:180px">Equipment / Tool Name</th>
            <th style="min-width:74px">Total QTY</th>
            <th style="min-width:120px">Condition</th>
            <th style="min-width:170px">Damage Notes</th>
            <th style="min-width:114px">Accessories Returned</th>
            <th style="min-width:160px">Remarks</th>
            <th style="min-width:124px">Actions</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(row, ri) in rows" :key="row.id">
            <tr class="equip-row">
              <td class="row-num">{{ ri + 1 }}</td>
              <td><input type="text" v-model="row.codeNo" placeholder="e.g. 8100" class="code-input" /></td>
              <td><input type="text" v-model="row.toolName" placeholder="Tool / Equipment name" /></td>
              <td><input type="number" min="0" v-model.number="row.totalQty" placeholder="0" class="inv-input-old" /></td>
              <td>
                <select class="condition-select" v-model="row.condition" :class="'condition-' + row.condition">
                  <option value="">— Select —</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </td>
              <td><textarea v-model="row.damageNotes" placeholder="Describe damage that needs repair..." rows="2" /></td>
              <td>
                <div class="toggle-wrap">
                  <button class="toggle-btn toggle-yes" :class="{ active: row.accessoriesReturned === true }" @click="row.accessoriesReturned = true">YES</button>
                  <button class="toggle-btn toggle-no"  :class="{ active: row.accessoriesReturned === false }" @click="row.accessoriesReturned = false">NO</button>
                </div>
              </td>
              <td><input type="text" v-model="row.remarks" placeholder="Additional remarks..." /></td>
              <td class="actions-cell">
                <button class="btn btn-sm" :class="row.showBorrowers ? 'borrower-btn-active btn-sm' : 'btn-secondary'"
                  @click="$emit('toggle-borrowers', row)" style="margin-bottom:4px;width:100%">
                  {{ row.showBorrowers ? '▲' : '▼' }} Borrowers
                  <span class="borrower-count">{{ row.borrowers.length }}</span>
                </button>
                <button class="btn btn-sm btn-danger" style="width:100%" @click="$emit('remove-row', ri)">✕ Remove</button>
              </td>
            </tr>

            <BorrowerFormOld
              v-if="row.showBorrowers"
              :row="row"
              :section="section"
              @add-borrower="(r) => $emit('add-borrower', r)"
              @remove-borrower="(r, i) => $emit('remove-borrower', r, i)"
            />
          </template>

          <tr v-if="rows.length === 0">
            <td colspan="10" class="empty-row">No records yet — click "Add Row" below to begin.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add Row -->
    <button class="add-row-btn" :class="'add-row-' + section" @click="$emit('add-row')">
      ＋ Add {{ section === 'new' ? 'New' : 'Old / Damaged' }} Equipment Row
    </button>

  </div>
</template>

<script setup>
import BorrowerForm    from './BorrowerForm.vue'
import BorrowerFormOld from './BorrowerFormOld.vue'
import { useEquipmentStore } from '../composables/useEquipmentStore.js'

defineProps({
  rows:         { type: Array,  required: true },
  section:      { type: String, default: 'new' },
  sectionLabel: { type: String, default: '' },
  sectionCode:  { type: String, default: '' }
})

defineEmits(['add-row', 'remove-row', 'add-borrower', 'remove-borrower', 'toggle-borrowers'])

const { findByCode } = useEquipmentStore()

/**
 * When user types/pastes a code:
 * - Find it in the master list
 * - If found: auto-fill toolName and totalQty
 * - If not found: leave toolName editable
 */
function onCodeInput(row) {
  const match = findByCode(row.codeNo)
  if (match) {
    row.toolName = match.name
    row.totalQty = match.qty
  }
}

function sumWithdrawn(row) {
  return (row.borrowers || []).reduce((sum, b) => sum + (parseInt(b.withdraw) || 0), 0)
}

function calcAvailable(row) {
  return (parseInt(row.totalQty) || 0) - sumWithdrawn(row)
}
</script>

<style scoped>
.section-block { margin-bottom: 44px; }

.section-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 2px solid;
  flex-wrap: wrap;
}
.new-section.section-header { border-color: #d4bfa8; }
.old-section.section-header { border-color: #c8b090; }

.section-badge {
  padding: 5px 18px;
  border-radius: 20px;
  font-family: 'Nunito', sans-serif;
  font-weight: 800;
  font-size: 12px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #000000;
}
.badge-new { background: rgba(138,106,74,0.1); border: 1.5px solid rgba(138,106,74,0.3); }
.badge-old { background: rgba(184,50,50,0.08); border: 1.5px solid rgba(184,50,50,0.25); }

.section-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 1px;
  color: #000000;
}
.section-code {
  margin-left: auto;
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: var(--muted);
}

.table-wrap {
  overflow-x: auto;
  border-radius: 14px;
  border: 1.5px solid var(--border);
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}

table { width: 100%; border-collapse: collapse; font-size: 13px; background: #ffffff; }
.new-section { min-width: 1250px; }
.old-section  { min-width: 1100px; }

thead th {
  padding: 12px 12px;
  text-align: left;
  font-family: 'Nunito', sans-serif;
  font-weight: 800;
  font-size: 11px;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--surface2);
  color: #000000;
  border-bottom: 2px solid var(--border);
}

.new-section thead th.inv-group {
  background: #f0e8dc;
  color: var(--accent);
  border-left: 1px solid var(--border);
}
.new-section thead th.inv-group:first-of-type {
  border-left: 2px solid rgba(138,106,74,0.4);
}
.old-section thead th { background: #fff8f4; border-bottom-color: #e8cfc0; }

tbody tr { border-bottom: 1px solid #ede5da; transition: background 0.15s; }
tbody tr.equip-row:hover { background: #fdf8f3; }
tbody td { padding: 9px 10px; vertical-align: top; }

.row-num {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: var(--muted);
  text-align: center;
  width: 34px;
}
.actions-cell { vertical-align: top; }

/* ── Code No. cell ── */
.code-input-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.code-input {
  font-family: 'DM Mono', monospace;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 2px;
  width: 100%;
}

.code-match-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: background 0.2s;
}
.dot-match   { background: #2a7a22; box-shadow: 0 0 5px rgba(42,122,34,0.45); }
.dot-unknown { background: #d4b060; }

/* ── Equipment name cell ── */
.equip-name-cell { min-width: 230px; }

.equip-name-matched {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 4px;
  background: rgba(42, 122, 34, 0.04);
  border-radius: 6px;
}

.equip-name-text {
  font-family: 'Nunito', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: #000000;
  flex: 1;
}

.auto-filled-tag {
  display: inline-block;
  font-family: 'Nunito', sans-serif;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  background: rgba(42, 122, 34, 0.1);
  color: #2a7a22;
  border: 1px solid rgba(42, 122, 34, 0.25);
  border-radius: 6px;
  padding: 1px 6px;
  flex-shrink: 0;
}

.equip-name-input {
  width: 100%;
  border-style: dashed !important;
  font-family: 'Nunito', sans-serif;
  font-size: 13px;
}

/* ── Inventory cells ── */
.inv-cell { background: rgba(245,237,224,0.4); border-left: 1px solid var(--border); }
.inv-cell--auto { vertical-align: middle !important; text-align: center; }
.inv-input { width: 64px !important; text-align: center; font-family: 'DM Mono', monospace; font-size: 13px; font-weight: 700; }
.inv-input-old { width: 64px !important; text-align: center; font-family: 'DM Mono', monospace; font-size: 13px; font-weight: 700; }

.withdrawn-val { display: block; font-family: 'DM Mono', monospace; font-size: 18px; font-weight: 800; color: #2a6099; text-align: center; line-height: 1.2; }
.auto-tag { display: block; font-family: 'Nunito', sans-serif; font-size: 9px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: var(--muted); text-align: center; margin-top: 1px; }

.available-badge { display: inline-block; padding: 4px 10px; border-radius: 10px; font-family: 'DM Mono', monospace; font-size: 12px; font-weight: 700; white-space: nowrap; }
.avail-ok   { background: rgba(58,122,50,0.1); color: var(--success); border: 1px solid rgba(58,122,50,0.3); }
.avail-none { background: rgba(184,50,50,0.08); color: var(--danger); border: 1px solid rgba(184,50,50,0.25); font-size: 10px; }

.condition-select { width: 115px; min-width: 90px; }

.toggle-wrap { display: flex; gap: 4px; align-items: center; }
.toggle-btn { padding: 4px 10px; border-radius: 10px; border: 1.5px solid var(--border); background: none; font-size: 11px; font-family: 'Nunito', sans-serif; font-weight: 700; cursor: pointer; transition: all 0.15s; color: var(--muted); }
.toggle-yes.active { background: rgba(58,122,50,0.1); color: var(--success); border-color: rgba(58,122,50,0.4); }
.toggle-no.active  { background: rgba(184,50,50,0.08); color: var(--danger); border-color: rgba(184,50,50,0.3); }

.borrower-btn-active { background: rgba(138,106,74,0.1); color: var(--accent); border: 1.5px solid rgba(138,106,74,0.3); }
.borrower-count { display: inline-block; background: rgba(138,106,74,0.15); color: var(--accent); border-radius: 10px; padding: 0 6px; font-size: 10px; margin-left: 4px; }

.add-row-btn { margin-top: 10px; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 16px; background: none; border-radius: 12px; font-family: 'Nunito', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; width: 100%; transition: all 0.2s; }
.add-row-new { border: 2px dashed rgba(138,106,74,0.35); color: rgba(138,106,74,0.7); }
.add-row-new:hover { border-color: var(--accent); color: var(--accent); background: rgba(138,106,74,0.04); }
.add-row-old { border: 2px dashed rgba(184,50,50,0.25); color: rgba(184,50,50,0.6); }
.add-row-old:hover { border-color: var(--danger); color: var(--danger); background: rgba(184,50,50,0.03); }

.empty-row { text-align: center; padding: 28px; color: var(--muted); font-family: 'DM Mono', monospace; font-size: 12px; }
</style>