<template>
  <div class="master-wrap">

    <!-- Page header -->
    <div class="page-header">
      <div>
        <h2>🗄 Equipment Master List</h2>
        <p>Manage all equipment, code numbers and quantities. Changes apply instantly to the Daily Record.</p>
      </div>
      <div class="header-stat">
        <span class="stat-num">{{ equipmentList.length }}</span>
        <span class="stat-lbl">Equipment Types</span>
      </div>
    </div>

    <!-- ── Add / Edit form ── -->
    <div class="form-card" :class="{ 'form-card--editing': editingId }">
      <div class="form-title">
        {{ editingId ? '✏️ Edit Equipment' : '＋ Add New Equipment' }}
      </div>

      <div class="form-row">
        <!-- Name -->
        <div class="form-field form-field--lg">
          <label>Equipment / Tool Name <span class="req">*</span></label>
          <input
            type="text"
            v-model="form.name"
            placeholder="e.g. JIGSAW"
            class="f-input"
            @keyup.enter="commitForm"
          />
        </div>

        <!-- Code numbers -->
        <div class="form-field form-field--lg">
          <label>
            Code Number(s)
            <span class="f-hint">— one per unit, press Enter or comma to add</span>
          </label>
          <div class="code-tags-wrap">
            <span
              v-for="(c, ci) in form.codes"
              :key="ci"
              class="code-tag"
            >
              {{ c }}
              <button class="tag-del" @click="removeCode(ci)">×</button>
            </span>
            <input
              type="text"
              v-model="codeInput"
              placeholder="Type code &amp; press Enter"
              class="f-input tag-input"
              @keydown.enter.prevent="pushCode"
              @keydown.comma.prevent="pushCode"
              @blur="pushCode"
            />
          </div>
        </div>

        <!-- QTY (auto) -->
        <div class="form-field form-field--xs">
          <label>QTY</label>
          <div class="qty-display">{{ form.codes.length || 0 }}</div>
        </div>
      </div>

      <!-- Default Condition / Damage / Accessories row -->
      <div class="form-row form-row--defaults">
        <!-- Default Condition -->
        <div class="form-field form-field--sm">
          <label>Default Condition</label>
          <select v-model="form.condition" class="f-input" :class="'condition-' + form.condition">
            <option value="">— None —</option>
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>
        </div>

        <!-- Default Damage Notes -->
        <div class="form-field form-field--xl">
          <label>Default Damage Notes <span class="f-hint">— pre-filled when code is entered in the daily record</span></label>
          <input
            type="text"
            v-model="form.damageNotes"
            placeholder="e.g. Minor scratches on body, blade guard loose…"
            class="f-input"
          />
        </div>

        <!-- Default Accessories Returned -->
        <div class="form-field form-field--sm">
          <label>Accessories Returned</label>
          <div class="toggle-wrap-form">
            <button
              class="toggle-btn-form toggle-yes"
              :class="{ active: form.accessoriesReturned === true }"
              type="button"
              @click="form.accessoriesReturned = form.accessoriesReturned === true ? null : true"
            >YES</button>
            <button
              class="toggle-btn-form toggle-no"
              :class="{ active: form.accessoriesReturned === false }"
              type="button"
              @click="form.accessoriesReturned = form.accessoriesReturned === false ? null : false"
            >NO</button>
            <span v-if="form.accessoriesReturned === null" class="toggle-none-label">Not set</span>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button class="btn btn-primary" @click="commitForm" :disabled="!form.name.trim() || form.codes.length === 0">
          {{ editingId ? '✔ Save Changes' : '＋ Add Equipment' }}
        </button>
        <button v-if="editingId" class="btn btn-secondary" @click="cancelEdit">Cancel</button>
      </div>
    </div>

    <!-- ── Master table ── -->
    <div class="table-card">
      <div class="table-toolbar">
        <input type="text" v-model="search" placeholder="🔍  Search equipment or code…" class="search-input" />
        <span class="total-label">{{ filtered.length }} / {{ equipmentList.length }} shown</span>
      </div>

      <div class="master-table-wrap">
        <table class="master-table">
          <thead>
            <tr>
              <th style="width:40px">#</th>
              <th>Equipment / Tool Name</th>
              <th style="min-width:280px">Code Numbers (one per unit)</th>
              <th style="width:60px; text-align:center">QTY</th>
              <th style="width:100px; text-align:center">Available</th>
              <th style="width:110px; text-align:center">Condition</th>
              <th style="min-width:200px">Damage Notes</th>
              <th style="width:110px; text-align:center">Accessories</th>
              <th style="width:110px; text-align:center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(eq, i) in filtered" :key="eq.id" :class="{ 'row-editing': editingId === eq.id }">
              <td class="td-num">{{ i + 1 }}</td>

              <td class="td-name">
                <div class="name-avail-wrap">
                  <span
                    class="avail-dot"
                    :class="getAvailableQty(eq) > 0 ? 'avail-dot--green' : 'avail-dot--red'"
                    :title="getAvailableQty(eq) > 0 ? getAvailableQty(eq) + ' unit(s) available' : 'No units available — fully borrowed out'"
                  ></span>
                  {{ eq.name }}
                </div>
              </td>

              <td class="td-codes">
                <div class="codes-list">
                  <span
                    v-for="(c, ci) in eq.codes"
                    :key="ci"
                    class="code-pill"
                  >
                    {{ c }}
                  </span>
                </div>
              </td>

              <td class="td-qty">
                <span class="qty-badge">{{ eq.qty }}</span>
              </td>

              <td class="td-avail">
                <span
                  class="avail-count-badge"
                  :class="getAvailableQty(eq) > 0 ? 'avail-count--ok' : 'avail-count--none'"
                >
                  {{ getAvailableQty(eq) > 0 ? getAvailableQty(eq) + ' avail.' : 'None' }}
                </span>
              </td>

              <td class="td-condition">
                <span v-if="eq.condition" class="condition-badge" :class="'condition-' + eq.condition">
                  {{ eq.condition.charAt(0).toUpperCase() + eq.condition.slice(1) }}
                </span>
                <span v-else class="condition-badge condition-unset">—</span>
              </td>

              <td class="td-damage-notes">
                <span v-if="eq.damageNotes" class="damage-text">{{ eq.damageNotes }}</span>
                <span v-else class="damage-none">—</span>
              </td>

              <td class="td-accessories">
                <span
                  v-if="eq.accessoriesReturned === true"
                  class="acc-badge acc-yes"
                >YES</span>
                <span
                  v-else-if="eq.accessoriesReturned === false"
                  class="acc-badge acc-no"
                >NO</span>
                <span v-else class="acc-badge acc-unset">—</span>
              </td>

              <td class="td-actions">
                <button class="act-btn act-edit" @click="startEdit(eq)" title="Edit">✏️</button>
                <button class="act-btn act-del"  @click="confirmDelete(eq)" title="Delete">🗑</button>
              </td>
            </tr>

            <tr v-if="filtered.length === 0">
              <td colspan="9" class="empty-row">
                {{ search ? 'No equipment matches your search.' : 'No equipment yet. Add one above.' }}
              </td>
            </tr>
          </tbody>
        </table>
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
              ✅ <strong>{{ lookupResult.name }}</strong>
              <span class="result-meta">QTY {{ lookupResult.qty }} · Codes: {{ lookupResult.codes.join(', ') }}</span>
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
import { ref, computed, inject } from 'vue'
import { useEquipmentStore } from '../composables/useEquipmentStore.js'

const { equipmentList, findByCode, addEquipment, removeEquipment, updateEquipment } = useEquipmentStore()

// Receive all equipment rows from parent via provide/inject
const allEquipRows = inject('allEquipRows', ref([]))

/** How many units of this equipment are currently borrowed (not returned) */
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

// ── Search ──
const search = ref('')
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return equipmentList.value
  return equipmentList.value.filter(eq =>
    eq.name.toLowerCase().includes(q) ||
    eq.codes.some(c => c.includes(q))
  )
})

// ── Form state ──
const editingId  = ref(null)
const form       = ref({ name: '', codes: [], condition: '', damageNotes: '', accessoriesReturned: null })
const codeInput  = ref('')

function pushCode() {
  const val = codeInput.value.replace(/,/g, '').trim()
  if (val && !form.value.codes.includes(val)) {
    form.value.codes.push(val)
  }
  codeInput.value = ''
}

function removeCode(ci) {
  form.value.codes.splice(ci, 1)
}

function commitForm() {
  pushCode() // flush any pending input
  if (!form.value.name.trim() || form.value.codes.length === 0) return

  const payload = {
    name: form.value.name,
    codes: form.value.codes,
    condition: form.value.condition,
    damageNotes: form.value.damageNotes,
    accessoriesReturned: form.value.accessoriesReturned,
  }

  if (editingId.value) {
    updateEquipment(editingId.value, payload)
    editingId.value = null
  } else {
    addEquipment(payload)
  }
  form.value = { name: '', codes: [], condition: '', damageNotes: '', accessoriesReturned: null }
  codeInput.value = ''
}

function startEdit(eq) {
  editingId.value  = eq.id
  form.value       = {
    name: eq.name,
    codes: [...eq.codes],
    condition: eq.condition || '',
    damageNotes: eq.damageNotes || '',
    accessoriesReturned: eq.accessoriesReturned ?? null,
  }
  codeInput.value  = ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cancelEdit() {
  editingId.value = null
  form.value      = { name: '', codes: [], condition: '', damageNotes: '', accessoriesReturned: null }
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
const lookupResult = computed(() => lookupCode.value.trim() ? findByCode(lookupCode.value) : null)
</script>

<style scoped>
.master-wrap {
  padding: 28px 36px 80px;
  max-width: 1100px;
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
  border-radius: 14px;
  padding: 22px 24px;
  margin-bottom: 24px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-card--editing {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(138, 106, 74, 0.1);
}

.form-title {
  font-family: 'Nunito', sans-serif;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #000000;
  margin-bottom: 16px;
}

.form-row {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  align-items: flex-start;
  margin-bottom: 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-field--lg  { flex: 1; min-width: 220px; }
.form-field--xs  { flex: 0 0 64px; }

.form-field label {
  font-family: 'Nunito', sans-serif;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: var(--muted);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.req { color: var(--danger); }

.f-hint {
  font-weight: 400;
  font-size: 9px;
  text-transform: none;
  letter-spacing: 0;
  color: #bbb;
}

.f-input {
  background: #ffffff;
  border: 1.5px solid var(--border);
  border-radius: 8px;
  color: #000000;
  font-family: 'Nunito', sans-serif;
  font-size: 13px;
  padding: 8px 12px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  width: 100%;
}

.f-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(138, 106, 74, 0.1);
}

/* Code tag input */
.code-tags-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  align-items: center;
  background: #ffffff;
  border: 1.5px solid var(--border);
  border-radius: 8px;
  padding: 6px 10px;
  min-height: 40px;
  transition: border-color 0.2s;
}

.code-tags-wrap:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(138, 106, 74, 0.1);
}

.code-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(138, 106, 74, 0.1);
  border: 1px solid rgba(138, 106, 74, 0.3);
  color: var(--accent);
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
}

.tag-del {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0;
  opacity: 0.6;
}
.tag-del:hover { opacity: 1; color: var(--danger); }

.tag-input {
  border: none !important;
  box-shadow: none !important;
  padding: 2px 4px !important;
  min-width: 140px;
  flex: 1;
  font-family: 'DM Mono', monospace;
  font-size: 12px;
}

/* QTY display */
.qty-display {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'DM Mono', monospace;
  font-size: 22px;
  font-weight: 800;
  color: var(--accent);
  background: rgba(138, 106, 74, 0.07);
  border: 1.5px solid rgba(138, 106, 74, 0.2);
  border-radius: 8px;
}

.form-actions {
  display: flex;
  gap: 10px;
}

/* ── Table card ── */
.table-card {
  background: #ffffff;
  border: 1.5px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
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

.master-table-wrap { overflow-x: auto; }

.master-table {
  width: 100%;
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

/* ── Availability dot beside equipment name ── */
.name-avail-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avail-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: background 0.2s, box-shadow 0.2s;
}

.avail-dot--green {
  background: #2a7a22;
  box-shadow: 0 0 6px rgba(42,122,34,0.6);
}

.avail-dot--red {
  background: #b83232;
  box-shadow: 0 0 6px rgba(184,50,50,0.55);
}

/* ── Available column badge ── */
.td-avail { text-align: center; vertical-align: middle; }

.avail-count-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 10px;
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.avail-count--ok {
  background: rgba(42,122,34,0.1);
  color: #2a7a22;
  border: 1px solid rgba(42,122,34,0.3);
}

.avail-count--none {
  background: rgba(184,50,50,0.08);
  color: #b83232;
  border: 1px solid rgba(184,50,50,0.25);
  font-size: 11px;
}

.master-table tbody tr {
  border-bottom: 1px solid #ede5da;
  transition: background 0.13s;
}

.master-table tbody tr:hover { background: #fdf8f3; }
.master-table tbody tr.row-editing { background: rgba(138, 106, 74, 0.06) !important; }

.master-table tbody td { padding: 11px 14px; vertical-align: middle; }

.td-num {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: var(--muted);
  text-align: center;
}

.td-name {
  font-family: 'Nunito', sans-serif;
  font-weight: 700;
  font-size: 13px;
  color: #000000;
}

.td-codes { vertical-align: middle; }

.codes-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.code-pill {
  display: inline-block;
  background: rgba(138, 106, 74, 0.08);
  border: 1px solid rgba(138, 106, 74, 0.25);
  color: var(--accent);
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 6px;
  letter-spacing: 0.5px;
}

.td-qty { text-align: center; }

.qty-badge {
  display: inline-block;
  background: rgba(42, 96, 153, 0.08);
  color: #2a6099;
  border: 1px solid rgba(42, 96, 153, 0.2);
  font-family: 'DM Mono', monospace;
  font-size: 13px;
  font-weight: 800;
  padding: 3px 12px;
  border-radius: 8px;
}

.td-actions {
  text-align: center;
  white-space: nowrap;
}

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

/* ── Default info form row ── */
.form-row--defaults {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1.5px dashed var(--border);
}

.form-field--xl { flex: 2; min-width: 240px; }
.form-field--sm { flex: 0 0 160px; min-width: 130px; }

.toggle-wrap-form {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
  padding-top: 2px;
}

.toggle-btn-form {
  padding: 6px 14px;
  border-radius: 10px;
  border: 1.5px solid var(--border);
  background: none;
  font-size: 11px;
  font-family: 'Nunito', sans-serif;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  color: var(--muted);
}
.toggle-btn-form.toggle-yes.active { background: rgba(58,122,50,0.1); color: var(--success); border-color: rgba(58,122,50,0.4); }
.toggle-btn-form.toggle-no.active  { background: rgba(184,50,50,0.08); color: var(--danger); border-color: rgba(184,50,50,0.3); }
.toggle-none-label { font-size: 11px; color: var(--muted); font-family: 'DM Mono', monospace; }

/* ── Table condition / damage / accessories cells ── */
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

.td-damage-notes { vertical-align: middle; }
.damage-text { font-family: 'Nunito', sans-serif; font-size: 12px; color: #000; }
.damage-none { color: var(--muted); font-family: 'DM Mono', monospace; font-size: 12px; }

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
</style>