<template>
  <div class="master-wrap">

    <!-- Page header -->
    <div class="page-header">
      <div>
        <h2> Equipment Master List</h2>
        <p>Manage all equipment, code numbers and per-unit details. Changes apply instantly to the Daily Record.</p>
      </div>
      <div class="header-right">
        <div class="sync-badge" :class="'sync-' + syncStatus" :title="syncStatus === 'synced' ? 'Live — changes sync to all devices instantly' : syncStatus === 'connecting' ? 'Connecting to sync server…' : 'Sync error — working offline'">
          <span class="sync-dot"></span>
          <span class="sync-label">{{ syncStatus === 'synced' ? 'Live Sync' : syncStatus === 'connecting' ? 'Connecting…' : 'Offline' }}</span>
        </div>
        <div class="header-stat">
          <span class="stat-num">{{ equipmentList.length }}</span>
          <span class="stat-lbl">Equipment Types</span>
        </div>
      </div>
    </div>

    <!-- ── Add / Edit form ── -->
    <div class="form-card" :class="{ 'form-card--editing': editingId }">
      <div class="form-title">
        {{ editingId ? '✏️ Edit Equipment' : '＋ Add New Equipment' }}
      </div>

      <!-- Name + QTY row -->
      <div class="form-row">
        <div class="form-field form-field--lg">
          <label>Equipment / Tool Name <span class="req">*</span></label>
          <input
            type="text"
            v-model="form.name"
            placeholder="e.g. JIGSAW"
            class="f-input"
            @keyup.enter="addCodeFromInput"
          />
        </div>
        <div class="form-field form-field--xs">
          <label>QTY</label>
          <div class="qty-display">{{ form.units.length }}</div>
        </div>
      </div>

      <!-- ── Per-unit rows ── -->
      <div class="units-section">
        <div class="units-header">
          <span class="units-header-label">Units / Code Numbers</span>
          <span class="f-hint">— each row = one physical unit with its own code &amp; details</span>
        </div>

        <!-- Column headers -->
        <div class="unit-cols-head" v-if="form.units.length > 0">
          <div class="uh-unit">#</div>
          <div class="uh-code">Code No.</div>
          <div class="uh-cond">Condition</div>
          <div class="uh-dmg">Damage Notes</div>
          <div class="uh-acc">Accessories Returned</div>
          <div class="uh-accnotes">Specifies:</div>
          <div class="uh-del"></div>
        </div>

        <!-- One row per unit -->
        <div
          v-for="(unit, ui) in form.units"
          :key="ui"
          class="unit-row"
        >
          <div class="uh-unit unit-num">{{ ui + 1 }}</div>

          <div class="uh-code">
            <input
              type="text"
              v-model="unit.code"
              placeholder="e.g. 8160"
              class="f-input code-f"
            />
          </div>

          <div class="uh-cond">
            <select
              v-model="unit.condition"
              class="f-input"
              :class="unit.condition ? 'condition-' + unit.condition : ''"
            >
              <option value="">— None —</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>

          <div class="uh-dmg">
            <input
              type="text"
              v-model="unit.damageNotes"
              placeholder="e.g. scratches, blade loose…"
              class="f-input"
            />
          </div>

          <div class="uh-acc">
            <div class="toggle-wrap-form">
              <button
                class="toggle-btn-form toggle-yes"
                :class="{ active: unit.accessoriesReturned === true }"
                type="button"
                @click="unit.accessoriesReturned = unit.accessoriesReturned === true ? null : true"
              >YES</button>
              <button
                class="toggle-btn-form toggle-no"
                :class="{ active: unit.accessoriesReturned === false }"
                type="button"
                @click="unit.accessoriesReturned = unit.accessoriesReturned === false ? null : false"
              >NO</button>
              <span v-if="unit.accessoriesReturned === null" class="toggle-none-label">—</span>
            </div>
          </div>

          <div class="uh-accnotes">
            <input
              type="text"
              v-model="unit.accessoriesNotes"
              placeholder="e.g. charger, blade set…"
              class="f-input"
            />
          </div>

          <div class="uh-del">
            <button class="unit-del-btn" @click="removeUnit(ui)" title="Remove this unit">×</button>
          </div>
        </div>

        <!-- Add unit row -->
        <div class="add-unit-row">
          <div class="add-unit-code-wrap">
            <input
              type="text"
              v-model="codeInput"
              placeholder="Type code &amp; press Enter to add unit…"
              class="f-input add-code-input"
              @keydown.enter.prevent="addCodeFromInput"
              @keydown.comma.prevent="addCodeFromInput"
            />
            <button class="btn btn-secondary btn-sm" @click="addCodeFromInput">+ Add Unit</button>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button
          class="btn btn-primary"
          @click="commitForm"
          :disabled="!form.name.trim() || form.units.length === 0"
        >
          {{ editingId ? '✔ Save Changes' : '＋ Add Equipment' }}
        </button>
        <button v-if="editingId" class="btn btn-secondary" @click="cancelEdit">Cancel</button>
      </div>
    </div>

    <!-- ── Master table ── -->
    <div class="table-card">
      <div class="table-toolbar">
        <input type="text" v-model="search" placeholder="  Search equipment or code…" class="search-input" />
        <span class="total-label">{{ filtered.length }} / {{ equipmentList.length }} shown</span>
      </div>

      <div class="master-table-wrap" ref="tableWrap">
        <table class="master-table">
          <thead>
            <tr>
              <th class="th-num">#</th>
              <th class="th-name">Equipment / Tool Name</th>
              <th class="th-unit">Unit</th>
              <th class="th-code">Code No.</th>
              <th class="th-avail">Available</th>
              <th class="th-cond">Condition</th>
              <th class="th-dmg">Damage Notes</th>
              <th class="th-acc">Accessories</th>
              <th class="th-accnotes">Specifies:</th>
              <th class="th-act">Actions</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(eq, i) in filtered" :key="eq.id">
              <!-- One sub-row per unit -->
              <tr
                v-for="(unit, ui) in eq.units"
                :key="eq.id + '-' + ui"
                :class="[
                  'data-row',
                  ui === 0 ? 'row-first' : 'row-sub',
                  { 'row-editing': editingId === eq.id }
                ]"
              >
                <!-- # — only on first sub-row, rowspan = units count -->
                <td v-if="ui === 0" :rowspan="eq.units.length" class="td-num">{{ i + 1 }}</td>

                <!-- Name — only on first sub-row -->
                <td v-if="ui === 0" :rowspan="eq.units.length" class="td-name">
                  <div class="name-avail-wrap">
                    <span
                      class="avail-dot"
                      :class="getAvailableQty(eq) > 0 ? 'avail-dot--green' : 'avail-dot--red'"
                      :title="getAvailableQty(eq) > 0 ? getAvailableQty(eq) + ' unit(s) available' : 'All units borrowed out'"
                    ></span>
                    <span class="eq-name">{{ eq.name }}</span>
                  </div>
                  <div class="qty-row-badge">
                    <span class="qty-badge">{{ eq.qty }} unit{{ eq.qty !== 1 ? 's' : '' }}</span>
                  </div>
                </td>

                <!-- Unit index badge -->
                <td class="td-unit-idx">
                  <span class="unit-idx-badge">U{{ ui + 1 }}</span>
                </td>

                <!-- Code -->
                <td class="td-code">
                  <span class="code-pill">{{ unit.code }}</span>
                </td>

                <!-- Available (per-unit) -->
                <td class="td-avail">
                  <span
                    class="avail-count-badge"
                    :class="isUnitAvailable(eq, unit) ? 'avail-count--ok' : 'avail-count--none'"
                  >
                    {{ isUnitAvailable(eq, unit) ? 'Avail.' : 'Out' }}
                  </span>
                </td>

                <!-- Condition -->
                <td class="td-condition">
                  <span
                    v-if="unit.condition"
                    class="condition-badge"
                    :class="'condition-' + unit.condition"
                  >
                    {{ unit.condition.charAt(0).toUpperCase() + unit.condition.slice(1) }}
                  </span>
                  <span v-else class="condition-badge condition-unset">—</span>
                </td>

                <!-- Damage Notes -->
                <td class="td-damage-notes">
                  <span v-if="unit.damageNotes" class="damage-text">{{ unit.damageNotes }}</span>
                  <span v-else class="damage-none">—</span>
                </td>

                <!-- Accessories -->
                <td class="td-accessories">
                  <span v-if="unit.accessoriesReturned === true"  class="acc-badge acc-yes">YES</span>
                  <span v-else-if="unit.accessoriesReturned === false" class="acc-badge acc-no">NO</span>
                  <span v-else class="acc-badge acc-unset">—</span>
                </td>

                <!-- Specifies (accessories notes) -->
                <td class="td-accnotes">
                  <span v-if="unit.accessoriesNotes" class="accnotes-text">{{ unit.accessoriesNotes }}</span>
                  <span v-else class="accnotes-none">—</span>
                </td>

                <!-- Actions — only on first sub-row -->
                <td v-if="ui === 0" :rowspan="eq.units.length" class="td-actions">
                  <button class="act-btn act-edit" @click="startEdit(eq)" title="Edit">Edit</button>
                  <button class="act-btn act-del"  @click="confirmDelete(eq)" title="Delete">Delete</button>
                </td>
              </tr>

              <!-- Spacer row between equipment groups -->
              <tr class="group-spacer">
                <td colspan="10"></td>
              </tr>
            </template>

            <tr v-if="filtered.length === 0">
              <td colspan="10" class="empty-row">
                {{ search ? 'No equipment matches your search.' : 'No equipment yet. Add one above.' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Fixed scrollbar pinned to bottom of viewport -->
      <div class="fixed-scroll-bar" ref="fixedBar">
        <div class="fixed-scroll-inner" ref="fixedInner"></div>
      </div>
    </div>

    <!-- ── Quick reference: code → name lookup ── -->
    <div class="lookup-card">
      <div class="lookup-title">🔍 Code Lookup</div>
      <div class="lookup-row">
        <input
          type="text"
          v-model="lookupCode"
          placeholder="Type a code number…"
          class="f-input lookup-input"
        />
        <div class="lookup-result" :class="lookupResult ? 'result-found' : 'result-none'">
          <template v-if="lookupCode.trim()">
            <template v-if="lookupResult">
              ✅ <strong>{{ lookupResult.eq.name }}</strong>
              <span class="result-meta">
                Unit {{ lookupResult.eq.units.indexOf(lookupResult.unit) + 1 }} ·
                Code {{ lookupResult.unit.code }} ·
                <span :class="lookupResult.unit.condition ? 'condition-' + lookupResult.unit.condition : ''">
                  {{ lookupResult.unit.condition || 'No condition set' }}
                </span>
              </span>
            </template>
            <template v-else>
              ❌ No equipment found for code <strong>{{ lookupCode }}</strong>
            </template>
          </template>
          <template v-else>
            <span class="result-placeholder">Enter a code to look it up</span>
          </template>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, onUnmounted, nextTick } from 'vue'
import { useEquipmentStore } from '../composables/useEquipmentStore.js'

const { equipmentList, syncStatus, findUnitByCode, addEquipment, removeEquipment, updateEquipment } = useEquipmentStore()

// Receive all equipment rows from parent via provide/inject
const allEquipRows = inject('allEquipRows', ref([]))

// ── Fixed viewport-bottom scrollbar ──────────────────────────
const tableWrap  = ref(null)
const fixedBar   = ref(null)
const fixedInner = ref(null)

function updateBar() {
  const wrap  = tableWrap.value
  const bar   = fixedBar.value
  const inner = fixedInner.value
  if (!wrap || !bar || !inner) return
  inner.style.width = wrap.scrollWidth + 'px'
  const rect = wrap.getBoundingClientRect()
  bar.style.left  = rect.left + 'px'
  bar.style.width = rect.width + 'px'
}

let _fromWrap = false, _fromBar = false
function onWrapScroll() {
  if (_fromBar) { _fromBar = false; return }
  _fromWrap = true
  if (fixedBar.value) fixedBar.value.scrollLeft = tableWrap.value.scrollLeft
}
function onBarScroll() {
  if (_fromWrap) { _fromWrap = false; return }
  _fromBar = true
  if (tableWrap.value) tableWrap.value.scrollLeft = fixedBar.value.scrollLeft
}

onMounted(async () => {
  await nextTick()
  updateBar()
  tableWrap.value?.addEventListener('scroll', onWrapScroll)
  fixedBar.value?.addEventListener('scroll', onBarScroll)
  const ro = new ResizeObserver(updateBar)
  if (tableWrap.value) ro.observe(tableWrap.value)
  window.addEventListener('resize', updateBar)
  window.addEventListener('scroll', updateBar)
  _ro = ro
})

let _ro = null
onUnmounted(() => {
  tableWrap.value?.removeEventListener('scroll', onWrapScroll)
  fixedBar.value?.removeEventListener('scroll', onBarScroll)
  _ro?.disconnect()
  window.removeEventListener('resize', updateBar)
  window.removeEventListener('scroll', updateBar)
})

// ── Availability helpers ──
/** Total available units for an equipment group */
function getAvailableQty(eq) {
  const totalWithdrawn = allEquipRows.value
    .filter(r => r.toolName && r.toolName === eq.name)
    .reduce((sum, r) => {
      return sum + (r.borrowers || [])
        .filter(b => !b.returned)
        .reduce((s, b) => s + (parseInt(b.withdraw) || 0), 0)
    }, 0)
  return Math.max(0, eq.qty - totalWithdrawn)
}

/** Whether a specific unit (by code) is currently available */
function isUnitAvailable(eq, unit) {
  const borrowedCodes = new Set()
  allEquipRows.value
    .filter(r => r.toolName === eq.name)
    .forEach(r => {
      ;(r.borrowers || [])
        .filter(b => !b.returned && b.withdraw > 0)
        .forEach(b => {
          if (r.codeNo === unit.code) borrowedCodes.add(unit.code)
        })
    })
  return !borrowedCodes.has(unit.code)
}

// ── Search ──
const search = ref('')
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return equipmentList.value
  return equipmentList.value.filter(eq =>
    eq.name.toLowerCase().includes(q) ||
    eq.units.some(u => u.code.includes(q))
  )
})

// ── Form helpers ──
function makeFormUnit(code = '', condition = '', damageNotes = '', accessoriesReturned = null, accessoriesNotes = '') {
  return { code, condition, damageNotes, accessoriesReturned, accessoriesNotes }
}

// ── Form state ──
const editingId = ref(null)
const form      = ref({ name: '', units: [] })
const codeInput = ref('')

function addCodeFromInput() {
  const val = codeInput.value.replace(/,/g, '').trim()
  if (val) {
    form.value.units.push(makeFormUnit(val))
  }
  codeInput.value = ''
}

function removeUnit(ui) {
  form.value.units.splice(ui, 1)
}

function commitForm() {
  addCodeFromInput()
  if (!form.value.name.trim() || form.value.units.length === 0) return

  const payload = {
    name:  form.value.name,
    units: form.value.units.map(u => ({
      code:                u.code.trim(),
      condition:           u.condition,
      damageNotes:         u.damageNotes,
      accessoriesReturned: u.accessoriesReturned,
      accessoriesNotes:    u.accessoriesNotes || '',
    })).filter(u => u.code),
  }

  if (editingId.value) {
    updateEquipment(editingId.value, payload)
    editingId.value = null
  } else {
    addEquipment(payload)
  }
  form.value  = { name: '', units: [] }
  codeInput.value = ''
}

function startEdit(eq) {
  editingId.value = eq.id
  form.value = {
    name:  eq.name,
    units: eq.units.map(u => makeFormUnit(u.code, u.condition, u.damageNotes, u.accessoriesReturned, u.accessoriesNotes || '')),
  }
  codeInput.value = ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cancelEdit() {
  editingId.value = null
  form.value      = { name: '', units: [] }
  codeInput.value = ''
}

function confirmDelete(eq) {
  if (confirm(`Delete "${eq.name}" from the master list?\nThis won't affect already-saved records.`)) {
    removeEquipment(eq.id)
    if (editingId.value === eq.id) cancelEdit()
  }
}

// ── Lookup ──
const lookupCode   = ref('')
const lookupResult = computed(() => lookupCode.value.trim() ? findUnitByCode(lookupCode.value) : null)
</script>

<style scoped>
.master-wrap {
  padding: 28px 36px 80px;
  max-width: 1400px;
  margin: 0 auto;
}

/* ── Page header ── */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 26px;
  gap: 20px;
  flex-wrap: wrap;
}

.page-header h2 {
  font-family: 'Cormorant Garamond', serif;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #000000;
  margin-bottom: 5px;
}

.page-header p {
  font-family: 'Nunito', sans-serif;
  font-size: 12px;
  color: var(--muted);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.sync-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-family: 'Nunito', sans-serif;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.5px;
  cursor: default;
  user-select: none;
}
.sync-synced    { background: rgba(42,122,34,0.1);  color: #2a7a22; border: 1.5px solid rgba(42,122,34,0.3); }
.sync-connecting{ background: rgba(42,96,153,0.08); color: #2a6099; border: 1.5px solid rgba(42,96,153,0.2); }
.sync-error     { background: rgba(184,50,50,0.08); color: #b83232; border: 1.5px solid rgba(184,50,50,0.25); }

.sync-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.sync-synced .sync-dot     { background: #2a7a22; box-shadow: 0 0 5px rgba(42,122,34,0.7); animation: pulse-green 2s infinite; }
.sync-connecting .sync-dot { background: #2a6099; animation: pulse-blue 1s infinite; }
.sync-error .sync-dot      { background: #b83232; }

@keyframes pulse-green { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
@keyframes pulse-blue  { 0%,100% { opacity:1 } 50% { opacity:0.3 } }

.header-stat {
  text-align: center;
  background: var(--surface2);
  border: 1.5px solid var(--border);
  border-radius: 12px;
  padding: 14px 24px;
  flex-shrink: 0;
}

.stat-num {
  display: block;
  font-family: 'DM Mono', monospace;
  font-size: 32px;
  font-weight: 700;
  color: var(--accent);
  line-height: 1;
}

.stat-lbl {
  display: block;
  font-family: 'Nunito', sans-serif;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: var(--muted);
  margin-top: 4px;
}

/* ── Form card ── */
.form-card {
  background: #fdfaf6;
  border: 1.5px solid var(--border);
  border-radius: 16px;
  padding: 24px 28px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.form-card--editing {
  border-color: var(--accent);
  background: rgba(138, 106, 74, 0.03);
  box-shadow: 0 0 0 3px rgba(138, 106, 74, 0.08);
}

.form-title {
  font-family: 'Nunito', sans-serif;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 16px;
}

.form-row {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  align-items: flex-end;
  margin-bottom: 4px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.form-field label {
  font-family: 'Nunito', sans-serif;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--muted);
}
.form-field--lg  { flex: 2; min-width: 200px; }
.form-field--xs  { flex: 0 0 70px; }

.f-input {
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: #000000;
  font-family: 'Nunito', sans-serif;
  font-size: 12px;
  padding: 7px 10px;
  width: 100%;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.f-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(138, 106, 74, 0.1);
}

.f-hint {
  font-family: 'Nunito', sans-serif;
  font-size: 10px;
  color: var(--muted);
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
}

.req { color: var(--danger); }

/* QTY display */
.qty-display {
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'DM Mono', monospace;
  font-size: 20px;
  font-weight: 800;
  color: var(--accent);
  background: rgba(138, 106, 74, 0.07);
  border: 1.5px solid rgba(138, 106, 74, 0.2);
  border-radius: 8px;
}

/* ── Units section ── */
.units-section {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1.5px dashed var(--border);
}

.units-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 10px;
}

.units-header-label {
  font-family: 'Nunito', sans-serif;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--muted);
}

/* Column header row */
.unit-cols-head {
  display: grid;
  grid-template-columns: 30px 110px 1fr 2fr 160px 1.5fr 32px;
  gap: 8px;
  padding: 5px 8px;
  background: rgba(138, 106, 74, 0.06);
  border-radius: 8px 8px 0 0;
  border: 1px solid var(--border);
  border-bottom: none;
}

.unit-cols-head > div {
  font-family: 'Nunito', sans-serif;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1.1px;
  text-transform: uppercase;
  color: var(--muted);
  display: flex;
  align-items: center;
}

/* Unit data row */
.unit-row {
  display: grid;
  grid-template-columns: 30px 110px 1fr 2fr 160px 1.5fr 32px;
  gap: 8px;
  padding: 7px 8px;
  background: #ffffff;
  border: 1px solid var(--border);
  border-top: none;
  align-items: center;
  transition: background 0.15s;
}
.unit-row:hover { background: #fdf9f4; }
.unit-row:last-of-type { border-radius: 0 0 8px 8px; }

.unit-num {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: var(--muted);
  text-align: center;
}

.code-f { font-family: 'DM Mono', monospace; font-size: 12px; }

/* Accessory toggle inside unit row */
.toggle-wrap-form {
  display: flex;
  gap: 4px;
  align-items: center;
}

.toggle-btn-form {
  padding: 4px 10px;
  border-radius: 8px;
  border: 1.5px solid var(--border);
  background: none;
  font-size: 10px;
  font-family: 'Nunito', sans-serif;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  color: var(--muted);
}
.toggle-btn-form.toggle-yes.active { background: rgba(58,122,50,0.1); color: var(--success); border-color: rgba(58,122,50,0.4); }
.toggle-btn-form.toggle-no.active  { background: rgba(184,50,50,0.08); color: var(--danger); border-color: rgba(184,50,50,0.3); }
.toggle-none-label { font-size: 11px; color: var(--muted); font-family: 'DM Mono', monospace; }

.unit-del-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: var(--muted);
  line-height: 1;
  padding: 0 4px;
  border-radius: 4px;
  transition: color 0.15s, background 0.15s;
}
.unit-del-btn:hover { color: var(--danger); background: rgba(184,50,50,0.08); }

/* Add unit row */
.add-unit-row {
  margin-top: 8px;
}

.add-unit-code-wrap {
  display: flex;
  gap: 8px;
  align-items: center;
}

.add-code-input {
  max-width: 260px;
  font-family: 'DM Mono', monospace;
  font-size: 12px;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1.5px dashed var(--border);
}

/* ── Table card ── */
.table-card {
  background: #ffffff;
  border: 1.5px solid var(--border);
  border-radius: 14px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  background: var(--surface2);
  border-bottom: 1.5px solid var(--border);
}

.search-input {
  background: #ffffff;
  border: 1.5px solid var(--border);
  border-radius: 8px;
  color: #000000;
  font-family: 'Nunito', sans-serif;
  font-size: 13px;
  padding: 7px 12px;
  outline: none;
  width: 300px;
  max-width: 100%;
  transition: border-color 0.2s;
}
.search-input:focus { border-color: var(--accent); }

.total-label {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: var(--muted);
  white-space: nowrap;
}

/* Scrollable table container — hides its own scrollbar */
.master-table-wrap {
  overflow-x: auto;
  overflow-y: visible;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.master-table-wrap::-webkit-scrollbar { display: none; }

/* Fixed scrollbar pinned to bottom of viewport */
.fixed-scroll-bar {
  position: fixed;
  bottom: 0;
  z-index: 999;
  overflow-x: auto;
  overflow-y: hidden;
  height: 20px;
  background: var(--surface2);
  border-top: 1.5px solid var(--border);
  /* left and width set dynamically by JS */
}
.fixed-scroll-bar::-webkit-scrollbar { height: 16px; }
.fixed-scroll-bar::-webkit-scrollbar-track { background: var(--surface2); }
.fixed-scroll-bar::-webkit-scrollbar-thumb {
  background: var(--accent2);
  border-radius: 8px;
  border: 2px solid var(--surface2);
}
.fixed-scroll-bar::-webkit-scrollbar-thumb:hover { background: var(--accent); }
.fixed-scroll-inner { height: 1px; }

/* ── Table ── */
.master-table {
  width: 100%;
  min-width: 1100px;
  border-collapse: collapse;
  font-size: 13px;
}

.master-table thead th {
  padding: 11px 14px;
  text-align: left;
  font-family: 'Nunito', sans-serif;
  font-weight: 800;
  font-size: 10px;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  background: #3b2f20;
  color: #f5ece0;
  border-bottom: 2px solid #2a1f12;
  white-space: nowrap;
}

.th-num  { width: 44px; text-align: center; }
.th-name { min-width: 200px; }
.th-unit { width: 60px; text-align: center; }
.th-code { width: 100px; }
.th-avail { width: 90px; text-align: center; }
.th-cond { width: 110px; text-align: center; }
.th-dmg  { min-width: 220px; }
.th-acc  { width: 110px; text-align: center; }
.th-accnotes { min-width: 180px; }
.th-act  { width: 100px; text-align: center; }

/* ── Body rows ── */
.master-table tbody tr.data-row {
  transition: background 0.12s;
}

/* First sub-row of a group — top border to visually separate groups */
.master-table tbody tr.row-first td {
  border-top: 2px solid #ddd0bc;
}

/* Subsequent sub-rows — lighter inner separator */
.master-table tbody tr.row-sub td {
  border-top: 1px dashed #ede5da;
  background: #fdfaf7;
}

.master-table tbody tr.data-row:hover td { background: #fdf4eb !important; }
.master-table tbody tr.row-editing td { background: rgba(138, 106, 74, 0.06) !important; }

.master-table tbody td {
  padding: 10px 14px;
  vertical-align: middle;
}

/* Spacer between equipment groups */
.group-spacer td {
  padding: 4px 0 !important;
  background: var(--bg) !important;
  border: none !important;
}

.td-num {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: var(--muted);
  text-align: center;
  vertical-align: middle;
}

.td-name {
  font-family: 'Nunito', sans-serif;
  font-weight: 700;
  font-size: 13px;
  color: #000000;
  vertical-align: middle;
}

.name-avail-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.eq-name { font-weight: 800; }

.qty-row-badge {
  margin-top: 5px;
}

.avail-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}
.avail-dot--green { background: #2a7a22; box-shadow: 0 0 5px rgba(42,122,34,0.55); }
.avail-dot--red   { background: #b83232; box-shadow: 0 0 5px rgba(184,50,50,0.5); }

.qty-badge {
  display: inline-block;
  background: rgba(42, 96, 153, 0.08);
  color: #2a6099;
  border: 1px solid rgba(42, 96, 153, 0.2);
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 6px;
}

/* Unit index column */
.td-unit-idx { text-align: center; vertical-align: middle; }

.unit-idx-badge {
  display: inline-block;
  background: rgba(138, 106, 74, 0.1);
  color: var(--accent);
  border: 1px solid rgba(138, 106, 74, 0.25);
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 6px;
  letter-spacing: 0.5px;
}

/* Code column */
.td-code { vertical-align: middle; }

.code-pill {
  display: inline-block;
  background: rgba(138, 106, 74, 0.08);
  border: 1px solid rgba(138, 106, 74, 0.25);
  color: var(--accent);
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 6px;
  letter-spacing: 0.5px;
}

/* Available */
.td-avail { text-align: center; vertical-align: middle; }
.avail-count-badge {
  display: inline-block;
  padding: 2px 9px;
  border-radius: 8px;
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}
.avail-count--ok   { background: rgba(42,122,34,0.1); color: #2a7a22; border: 1px solid rgba(42,122,34,0.3); }
.avail-count--none { background: rgba(184,50,50,0.08); color: #b83232; border: 1px solid rgba(184,50,50,0.25); }

/* Condition */
.td-condition { text-align: center; vertical-align: middle; }
.condition-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 10px;
  font-family: 'Nunito', sans-serif;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.condition-excellent { background: rgba(58,122,50,0.1);  color: var(--success); border: 1px solid rgba(58,122,50,0.3); }
.condition-good      { background: rgba(42,96,153,0.08); color: #2a6099; border: 1px solid rgba(42,96,153,0.2); }
.condition-fair      { background: rgba(138,98,0,0.08);  color: var(--warning); border: 1px solid rgba(138,98,0,0.25); }
.condition-poor      { background: rgba(184,50,50,0.07); color: var(--danger);  border: 1px solid rgba(184,50,50,0.25); }
.condition-unset     { background: rgba(0,0,0,0.03); color: var(--muted); border: 1px solid var(--border); }

/* Damage notes */
.td-damage-notes { vertical-align: middle; }
.damage-text { font-family: 'Nunito', sans-serif; font-size: 12px; color: #000; }
.damage-none { color: var(--muted); font-family: 'DM Mono', monospace; font-size: 12px; }

/* Accessories */
.td-accessories { text-align: center; vertical-align: middle; }
.acc-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 10px;
  font-family: 'Nunito', sans-serif;
  font-size: 11px;
  font-weight: 800;
}
.acc-yes   { background: rgba(58,122,50,0.1); color: var(--success); border: 1px solid rgba(58,122,50,0.3); }
.acc-no    { background: rgba(184,50,50,0.07); color: var(--danger); border: 1px solid rgba(184,50,50,0.25); }
.acc-unset { background: rgba(0,0,0,0.03); color: var(--muted); border: 1px solid var(--border); }

/* Accessories Notes (Specifies) */
.td-accnotes { vertical-align: middle; }
.accnotes-text {
  font-family: 'Nunito', sans-serif;
  font-size: 12px;
  color: #000;
  font-style: italic;
}
.accnotes-none {
  color: var(--muted);
  font-family: 'DM Mono', monospace;
  font-size: 12px;
}

/* Actions */
.td-actions { text-align: center; white-space: nowrap; vertical-align: middle; }
.act-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 4px 7px;
  border-radius: 6px;
  transition: background 0.15s;
}
.act-edit:hover { background: rgba(138, 106, 74, 0.1); }
.act-del:hover  { background: rgba(184, 50, 50, 0.1); }

.empty-row {
  text-align: center;
  padding: 32px;
  color: var(--muted);
  font-family: 'DM Mono', monospace;
  font-size: 12px;
}

/* ── Lookup card ── */
.lookup-card {
  background: #ffffff;
  border: 1.5px solid var(--border);
  border-radius: 14px;
  padding: 20px 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.lookup-title {
  font-family: 'Nunito', sans-serif;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 12px;
}

.lookup-row {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.lookup-input { max-width: 200px; font-family: 'DM Mono', monospace; }

.lookup-result {
  flex: 1;
  font-family: 'Nunito', sans-serif;
  font-size: 13px;
  padding: 8px 14px;
  border-radius: 8px;
  min-width: 240px;
}

.result-found  { background: rgba(58, 122, 50, 0.07); color: #2a7a22; border: 1px solid rgba(58, 122, 50, 0.2); }
.result-none   { background: rgba(184, 50, 50, 0.06); color: #b83232; border: 1px solid rgba(184, 50, 50, 0.2); }

.result-meta {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: var(--muted);
  margin-left: 8px;
}

.result-placeholder { color: var(--muted); font-size: 12px; }

/* ── Btn sizes ── */
.btn {
  padding: 9px 20px;
  border-radius: 20px;
  border: none;
  font-family: 'Nunito', sans-serif;
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 1px;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-primary {
  background: linear-gradient(135deg, #a07850, #8a6a4a);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(138, 106, 74, 0.3);
}
.btn-primary:hover {
  box-shadow: 0 6px 20px rgba(138, 106, 74, 0.45);
  transform: translateY(-1px);
}
.btn-primary:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
.btn-secondary {
  background: var(--surface);
  color: #000000;
  border: 1.5px solid var(--border);
}
.btn-secondary:hover { border-color: var(--accent); color: var(--accent); background: #f9f3eb; }
.btn-sm { padding: 5px 14px; font-size: 11px; }
</style>