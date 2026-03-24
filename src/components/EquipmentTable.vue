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

    <!-- ══════════════════════════════════════════════════════
         LIVE EQUIPMENT AVAILABILITY PANEL  (new section only)
    ═══════════════════════════════════════════════════════ -->
    <div v-if="section === 'new'" class="avail-panel">

      <!-- Panel header bar -->
      <div class="avail-panel-header">
        <span class="avail-panel-icon"></span>
        <span class="avail-panel-title">Equipment Availability</span>
        <span class="avail-panel-sub">Live · updates when borrowers withdraw or return</span>
        <span class="avail-legend">
          <span class="legend-pip legend-pip--green"></span>Available
          <span class="legend-pip legend-pip--red" style="margin-left:12px"></span>Fully Out
        </span>
      </div>

      <!-- Card grid — one card per master-list item -->
      <div class="avail-grid">
        <template v-if="equipmentList.length > 0">
          <div
            v-for="eq in equipmentList"
            :key="eq.id"
            class="avail-card"
            :class="masterAvail(eq) > 0 ? 'avail-card--ok' : 'avail-card--out'"
          >
            <!-- Status dot -->
            <span
              class="avail-dot"
              :class="masterAvail(eq) > 0 ? 'avail-dot--green' : 'avail-dot--red'"
            ></span>

            <!-- Name + codes -->
            <div class="avail-info">
              <div class="avail-name">{{ eq.name }}</div>
              <div class="avail-codes">{{ (eq.codes || []).join(' · ') }}</div>
            </div>

            <!-- Qty block -->
            <div class="avail-qty">
              <span
                class="avail-num"
                :class="masterAvail(eq) > 0 ? 'avail-num--ok' : 'avail-num--out'"
              >{{ masterAvail(eq) }}</span>
              <span class="avail-total">/ {{ eq.qty }}</span>
              <span class="avail-lbl">{{ masterAvail(eq) > 0 ? 'avail.' : 'none' }}</span>
            </div>
          </div>
        </template>

        <div v-else class="avail-empty">
          No equipment in the master list yet — add items in the
          <strong>Equipment Master</strong> tab and they'll appear here automatically.
        </div>
      </div>
    </div>

    <!-- NEW EQUIPMENT TABLE -->
    <div v-if="section === 'new'" class="table-wrap wrap-new">
      <table class="new-section">
        <thead>
          <tr>
            <th style="width:34px">#</th>
            <th style="min-width:200px">Code No.</th>
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
            <tr class="equip-row" :class="{ 'row-error': row._codeError }">
              <td class="row-num">{{ ri + 1 }}</td>

              <!-- Code No. — primary input -->
              <td>
                <div class="code-input-wrap">
                  <input
                    type="text"
                    v-model="row.codeNo"
                    placeholder="e.g. 8160"
                    class="code-input"
                    :class="{ 'code-input--error': row._codeError }"
                    @input="onCodeInput(row)"
                    @blur="onCodeInput(row)"
                  />
                  <!-- Normal match dot (no error) -->
                  <span
                    v-if="row.codeNo && !row._codeError"
                    class="code-match-dot"
                    :class="findByCode(row.codeNo) ? 'dot-match' : 'dot-unknown'"
                    :title="findByCode(row.codeNo) ? 'Matched: ' + findByCode(row.codeNo).name : 'Not in master list — you can still type the name manually'"
                  ></span>
                </div>

                <!-- Error banner: duplicate code -->
                <div v-if="row._codeError === 'duplicate'" class="code-error-banner">
                  ⚠ Code <strong>{{ row.codeNo }}</strong> is already used in another row.
                  Please input a different code number.
                </div>

                <!-- Error banner: out of stock -->
                <div v-if="row._codeError === 'outofstock'" class="code-error-banner code-error-banner--oos">
                  🚫 <strong>{{ row._blockedName || 'This equipment' }}</strong> is fully borrowed out — out of stock.
                  Please input another code number.
                </div>
              </td>

              <!-- Equipment Name — auto-filled when code matches -->
              <td class="equip-name-cell">
                <div v-if="!row._codeError && findByCode(row.codeNo)" class="equip-name-matched">
                  <span class="equip-name-text">{{ row.toolName }}</span>
                  <span class="auto-filled-tag">auto</span>
                </div>
                <input
                  v-else-if="!row._codeError"
                  type="text"
                  v-model="row.toolName"
                  placeholder="Enter equipment name"
                  class="equip-name-input"
                />
                <!-- Blocked state — greyed out placeholder -->
                <div v-else class="equip-name-blocked">—</div>
              </td>

              <!-- Total QTY — fleet total from master list, read-only -->
              <td class="inv-cell">
                <div class="fleet-qty-display">
                  <span class="fleet-num" :class="{ 'fleet-num--na': row._codeError }">
                    {{ row._codeError ? '—' : fleetTotalQty(row) }}
                  </span>
                  <span class="auto-tag">fleet</span>
                </div>
              </td>

              <!-- Withdrawn — fleet sum -->
              <td class="inv-cell inv-cell--auto">
                <span class="withdrawn-val">{{ row._codeError ? '—' : fleetWithdrawn(row) }}</span>
                <span class="auto-tag">auto</span>
              </td>

              <!-- Available — fleet available -->
              <td class="inv-cell">
                <span v-if="!row._codeError"
                  class="available-badge"
                  :class="{ 'avail-ok': fleetAvailable(row) > 0, 'avail-none': fleetAvailable(row) <= 0 }"
                >
                  {{ fleetAvailable(row) <= 0 ? 'No Equipment Available' : fleetAvailable(row) }}
                </span>
                <span v-else class="available-badge avail-blocked">—</span>
              </td>

              <td>
                <select class="condition-select" v-model="row.condition" :class="'condition-' + row.condition" :disabled="!!row._codeError">
                  <option value="">— Select —</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </td>

              <td><textarea v-model="row.damageNotes" placeholder="Describe damage (if any)..." rows="2" :disabled="!!row._codeError" /></td>

              <td>
                <div class="toggle-wrap">
                  <button class="toggle-btn toggle-yes" :class="{ active: row.accessoriesReturned === true }" @click="row.accessoriesReturned = true" :disabled="!!row._codeError">YES</button>
                  <button class="toggle-btn toggle-no"  :class="{ active: row.accessoriesReturned === false }" @click="row.accessoriesReturned = false" :disabled="!!row._codeError">NO</button>
                </div>
              </td>

              <td><textarea v-model="row.remarks" placeholder="Additional remarks..." rows="2" :disabled="!!row._codeError" /></td>

              <td class="actions-cell">
                <button
                  class="btn btn-sm"
                  :class="row.showBorrowers ? 'borrower-btn-active' : 'btn-secondary'"
                  @click="$emit('toggle-borrowers', row)"
                  style="margin-bottom:4px;width:100%"
                  :disabled="!!row._codeError"
                >
                  {{ row.showBorrowers ? '▲' : '▼' }} Borrowers
                  <span class="borrower-count">{{ row.borrowers.length }}</span>
                </button>
                <button class="btn btn-sm btn-danger" style="width:100%" @click="$emit('remove-row', ri)">✕ Remove</button>
              </td>
            </tr>

            <BorrowerForm
              v-if="row.showBorrowers && !row._codeError"
              :row="row"
              :section="section"
              :record-date="recordDate"
              @add-borrower="(r) => $emit('add-borrower', r)"
              @remove-borrower="(r, i) => $emit('remove-borrower', r, i)"
              @save-row="(r) => $emit('save-row', r)"
            />
          </template>

          <tr v-if="rows.length === 0">
            <td colspan="11" class="empty-row">No records yet — click "Add Row" below to begin.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- OLD / DAMAGED EQUIPMENT TABLE (UNCHANGED) -->
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
              <td><input type="text" v-model="row.codeNo" placeholder="e.g. 8100" class="code-input" @input="onCodeInput(row)" @blur="onCodeInput(row)" /></td>
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
              <td><textarea v-model="row.remarks" placeholder="Additional remarks..." rows="2" /></td>
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
import { inject, ref } from 'vue'
import { useEquipmentStore } from '../composables/useEquipmentStore.js'

const props = defineProps({
  rows:         { type: Array,  required: true },
  section:      { type: String, default: 'new' },
  sectionLabel: { type: String, default: '' },
  sectionCode:  { type: String, default: '' },
  recordDate:   { type: String, default: '' }
})

defineEmits(['add-row', 'remove-row', 'add-borrower', 'remove-borrower', 'toggle-borrowers', 'save-row'])

// ── Equipment master list (reactive — auto-updates when master list changes) ──
const { equipmentList, findByCode } = useEquipmentStore()

// ── All borrow rows (new + old) injected from parent App so the
//    availability panel can see every live withdrawal across the whole app.
//    Parent must:  provide('allEquipRows', computed(() => [...newRows, ...oldRows]))
const allEquipRows = inject('allEquipRows', ref([]))

/**
 * How many units of `eq` are still available right now.
 * Counts every borrower across ALL rows that hasn't returned yet.
 */
function masterAvail(eq) {
  const borrowed = allEquipRows.value
    .filter(r => r.toolName && r.toolName === eq.name)
    .reduce((sum, r) => {
      return sum + (r.borrowers || [])
        .filter(b => !b.returned)
        .reduce((s, b) => s + (parseInt(b.withdraw) || 0), 0)
    }, 0)
  return Math.max(0, eq.qty - borrowed)
}

// ─────────────────────────────────────────────────────────────
// CODE INPUT — with duplicate + out-of-stock validation
// ─────────────────────────────────────────────────────────────
function onCodeInput(row) {
  const code = (row.codeNo || '').trim()
  row._codeError   = ''
  row._blockedName = ''

  if (!code) {
    row.toolName = ''
    return
  }

  // 1. Duplicate code check — same code already used in another row
  const duplicate = props.rows.find(r => r.id !== row.id && (r.codeNo || '').trim() === code)
  if (duplicate) {
    row._codeError = 'duplicate'
    row.toolName   = ''
    return
  }

  // 2. Look up in master list
  const match = findByCode(code)
  if (!match) {
    // Unknown code — let user type name manually, no error
    return
  }

  // 3. Out-of-stock check — all units of this equipment are already borrowed
  //    across ALL rows that share the same equipment name (excluding current row)
  const totalWithdrawnFleet = props.rows
    .filter(r => r.id !== row.id && r.toolName === match.name)
    .reduce((sum, r) => sum + (r.borrowers || []).reduce((s, b) => s + (parseInt(b.withdraw) || 0), 0), 0)

  if (totalWithdrawnFleet >= match.qty) {
    row._codeError   = 'outofstock'
    row._blockedName = match.name
    row.toolName     = ''
    return
  }

  // 4. All clear — fill in the name and auto-fill defaults from master list
  row.toolName = match.name
  if (match.condition)           row.condition           = match.condition
  if (match.damageNotes)         row.damageNotes         = match.damageNotes
  if (match.accessoriesReturned !== null && match.accessoriesReturned !== undefined) {
    row.accessoriesReturned = match.accessoriesReturned
  }
}

// ─────────────────────────────────────────────────────────────
// FLEET-WIDE QTY / WITHDRAWN / AVAILABLE
// (All rows with the same equipment name share the same pool)
// ─────────────────────────────────────────────────────────────

/** Per-row borrower withdrawn total */
function sumWithdrawn(row) {
  return (row.borrowers || []).reduce((sum, b) => sum + (parseInt(b.withdraw) || 0), 0)
}

/** Master fleet total for this equipment type */
function fleetTotalQty(row) {
  const match = findByCode(row.codeNo)
  if (match) return match.qty
  // Fallback: count sibling rows with same tool name
  return props.rows.filter(r => r.toolName && r.toolName === row.toolName).length || 1
}

/**
 * Fleet-wide total withdrawn — sums across ALL rows with the same equipment name.
 * E.g. WELDING MACHINE rows 8151 + 8140 + 8168 all pool their withdrawn counts.
 */
function fleetWithdrawn(row) {
  if (!row.toolName) return sumWithdrawn(row)
  return props.rows
    .filter(r => r.toolName && r.toolName === row.toolName)
    .reduce((sum, r) => sum + sumWithdrawn(r), 0)
}

/** Fleet available = fleet total − fleet withdrawn */
function fleetAvailable(row) {
  return fleetTotalQty(row) - fleetWithdrawn(row)
}
</script>

<style scoped>

/* ════════════════════════════════════════════════════════════
   LIVE EQUIPMENT AVAILABILITY PANEL
════════════════════════════════════════════════════════════ */

.avail-panel {
  margin-bottom: 18px;
  border: 1.5px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  background: #fdfaf6;
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
}

/* ── Header bar ── */
.avail-panel-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 18px 10px;
  background: #97704f;
  flex-wrap: wrap;
}

.avail-panel-icon {
  font-size: 14px;
  line-height: 1;
}

.avail-panel-title {
  font-family: 'Nunito', sans-serif;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1.3px;
  text-transform: uppercase;
  color: #000000;
}

.avail-panel-sub {
  flex: 1;
  font-family: 'Nunito', sans-serif;
  font-size: 10px;
  color: rgba(245,236,224,0.55);
}

.avail-legend {
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: 'Nunito', sans-serif;
  font-size: 10px;
  font-weight: 700;
  color: rgba(245,236,224,0.7);
  letter-spacing: 0.4px;
}

.legend-pip {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}
.legend-pip--green { background: #4caf50; box-shadow: 0 0 5px rgba(76,175,80,0.7); }
.legend-pip--red   { background: #e53935; box-shadow: 0 0 5px rgba(229,57,53,0.65); }

/* ── Card grid ── */
.avail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 10px;
  padding: 14px 16px 16px;
}

/* ── Individual card ── */
.avail-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 13px;
  border-radius: 10px;
  border: 1.5px solid;
  transition: background 0.2s, border-color 0.2s;
}

.avail-card--ok {
  background: rgba(42,122,34,0.04);
  border-color: rgba(42,122,34,0.22);
}
.avail-card--ok:hover { background: rgba(42,122,34,0.09); }

.avail-card--out {
  background: rgba(184,50,50,0.04);
  border-color: rgba(184,50,50,0.22);
}
.avail-card--out:hover { background: rgba(184,50,50,0.08); }

/* ── Status dot ── */
.avail-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: background 0.25s, box-shadow 0.25s;
}
.avail-dot--green {
  background: #4caf50;
  box-shadow: 0 0 8px rgba(76,175,80,0.75);
}
.avail-dot--red {
  background: #e53935;
  box-shadow: 0 0 8px rgba(229,57,53,0.7);
}

/* ── Equipment name / codes ── */
.avail-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.avail-name {
  font-family: 'Nunito', sans-serif;
  font-size: 12px;
  font-weight: 800;
  color: #1a1209;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.avail-codes {
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  color: var(--muted);
  letter-spacing: 0.4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Qty block ── */
.avail-qty {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  min-width: 38px;
}

.avail-num {
  font-family: 'DM Mono', monospace;
  font-size: 22px;
  font-weight: 800;
  line-height: 1;
  transition: color 0.25s;
}
.avail-num--ok  { color: #2a7a22; }
.avail-num--out { color: #b83232; }

.avail-total {
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: var(--muted);
  line-height: 1.3;
}

.avail-lbl {
  font-family: 'Nunito', sans-serif;
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--muted);
  margin-top: 1px;
}

/* ── Empty state ── */
.avail-empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 22px 16px;
  color: var(--muted);
  font-family: 'Nunito', sans-serif;
  font-size: 12px;
  font-style: italic;
}

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
  background: #97704f;
  color: #000000;
  border-bottom: 2px solid var(--border);
}

.new-section thead th.inv-group {
  background: #97704f;
  color: #000000;
  border-left: 1px solid var(--border);
}
.new-section thead th.inv-group:first-of-type {
  border-left: 2px solid rgb(255, 255, 255);
}
.old-section thead th { background: #97704f; border-bottom-color: #e8cfc0; }

tbody tr { border-bottom: 1px solid #ede5da; transition: background 0.15s; }
tbody tr.equip-row:hover { background: #fdf8f3; }
tbody tr.row-error { background: rgba(184,50,50,0.04) !important; }
tbody td { padding: 9px 10px; vertical-align: top; }

.row-num {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: var(--muted);
  text-align: center;
  width: 34px;
}
.actions-cell { vertical-align: top; }

/* ── Code input ── */
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

.code-input--error {
  border-color: var(--danger) !important;
  background: rgba(184,50,50,0.04) !important;
  box-shadow: 0 0 0 3px rgba(184,50,50,0.1) !important;
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

/* ── Error banners ── */
.code-error-banner {
  margin-top: 6px;
  padding: 7px 10px;
  border-radius: 8px;
  background: rgba(184,50,50,0.07);
  border: 1px solid rgba(184,50,50,0.25);
  color: var(--danger);
  font-family: 'Nunito', sans-serif;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.4;
}

.code-error-banner--oos {
  background: rgba(138,50,50,0.06);
  border-color: rgba(138,50,50,0.3);
}

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

.equip-name-blocked {
  color: var(--muted);
  font-size: 13px;
  padding: 7px 4px;
  opacity: 0.5;
}

/* ── Inventory cells ── */
.inv-cell { background: rgba(245,237,224,0.4); border-left: 1px solid var(--border); }
.inv-cell--auto { vertical-align: middle !important; text-align: center; }

.fleet-qty-display { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 36px; }
.fleet-num { font-family: 'DM Mono', monospace; font-size: 18px; font-weight: 800; color: #2a6099; text-align: center; line-height: 1.2; }
.fleet-num--na { color: var(--muted); font-size: 14px; }

.inv-input { width: 64px !important; text-align: center; font-family: 'DM Mono', monospace; font-size: 13px; font-weight: 700; }
.inv-input-old { width: 64px !important; text-align: center; font-family: 'DM Mono', monospace; font-size: 13px; font-weight: 700; }

.withdrawn-val { display: block; font-family: 'DM Mono', monospace; font-size: 18px; font-weight: 800; color: #2a6099; text-align: center; line-height: 1.2; }
.auto-tag { display: block; font-family: 'Nunito', sans-serif; font-size: 9px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: var(--muted); text-align: center; margin-top: 1px; }

.available-badge { display: inline-block; padding: 4px 10px; border-radius: 10px; font-family: 'DM Mono', monospace; font-size: 12px; font-weight: 700; white-space: nowrap; }
.avail-ok      { background: rgba(58,122,50,0.1);   color: var(--success); border: 1px solid rgba(58,122,50,0.3); }
.avail-none    { background: rgba(184,50,50,0.08);  color: var(--danger);  border: 1px solid rgba(184,50,50,0.25); font-size: 10px; }
.avail-blocked { background: rgba(0,0,0,0.04);       color: var(--muted);   border: 1px solid var(--border); }

.condition-select { width: 115px; min-width: 90px; }
.condition-select:disabled { opacity: 0.4; cursor: not-allowed; }

.toggle-wrap { display: flex; gap: 4px; align-items: center; }
.toggle-btn { padding: 4px 10px; border-radius: 10px; border: 1.5px solid var(--border); background: none; font-size: 11px; font-family: 'Nunito', sans-serif; font-weight: 700; cursor: pointer; transition: all 0.15s; color: var(--muted); }
.toggle-btn:disabled { opacity: 0.35; cursor: not-allowed; }
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