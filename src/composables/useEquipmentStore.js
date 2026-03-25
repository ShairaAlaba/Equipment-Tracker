// useEquipmentStore.js
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for the master equipment list.
// Each equipment entry now tracks per-unit details via a `units` array.
//
// Data shape:
// {
//   id:    unique string
//   name:  'TABLE SAW'
//   qty:   1               ← = units.length (kept in sync)
//   units: [
//     {
//       code:                '8160'
//       condition:           'good'    ← per-unit condition
//       damageNotes:         ''        ← per-unit damage description
//       accessoriesReturned: null      ← true | false | null
//     }
//   ]
// }
//
// Legacy shape (flat codes/condition/damageNotes/accessoriesReturned) is
// automatically migrated to the new shape on load.
// ─────────────────────────────────────────────────────────────────────────────
import { ref, watch } from 'vue'

function makeUnit(code, condition = '', damageNotes = '', accessoriesReturned = null, accessoriesNotes = '') {
  return { code: String(code).trim(), condition, damageNotes, accessoriesReturned, accessoriesNotes }
}

/** Migrate a legacy flat entry to the new per-unit shape, and ensure all unit fields exist */
function migrate(entry) {
  if (entry.units && Array.isArray(entry.units)) {
    // Already new shape — but ensure accessoriesNotes exists on every unit (added later)
    return {
      ...entry,
      units: entry.units.map(u => ({
        accessoriesNotes: '',   // default for units saved before this field existed
        ...u,                   // existing fields win (preserves any already-saved value)
      })),
    }
  }
  const codes = Array.isArray(entry.codes) ? entry.codes : []
  return {
    id:    entry.id,
    name:  entry.name,
    qty:   codes.length || 1,
    units: codes.map(c => makeUnit(
      c,
      entry.condition           || '',
      entry.damageNotes         || '',
      entry.accessoriesReturned ?? null,
      entry.accessoriesNotes    || '',
    )),
  }
}

const DEFAULT_EQUIPMENT = [
  { id: 'eq-1',  name: 'TABLE SAW',                     codes: ['8160'],                 qty: 1, condition: '', damageNotes: '', accessoriesReturned: null },
  { id: 'eq-2',  name: 'THICKNESS PLANER',               codes: ['8156'],                 qty: 1, condition: '', damageNotes: '', accessoriesReturned: null },
  { id: 'eq-3',  name: 'INDUSTRIAL DEMOLITION BREAKER',  codes: ['8143'],                 qty: 1, condition: '', damageNotes: '', accessoriesReturned: null },
  { id: 'eq-4',  name: 'HAMMER (BRUSHLESS MOTOR)',        codes: ['8133'],                 qty: 1, condition: '', damageNotes: '', accessoriesReturned: null },
  { id: 'eq-5',  name: 'CUT-OFF SAW',                    codes: ['8144'],                 qty: 1, condition: '', damageNotes: '', accessoriesReturned: null },
  { id: 'eq-6',  name: 'CIRCULAR SAW',                   codes: ['8155'],                 qty: 1, condition: '', damageNotes: '', accessoriesReturned: null },
  { id: 'eq-7',  name: 'ELECTRIC IMPACT DRILL',          codes: ['8147', '8149'],         qty: 2, condition: '', damageNotes: '', accessoriesReturned: null },
  { id: 'eq-8',  name: 'PORTABLE DRILL',                 codes: ['8158'],                 qty: 1, condition: '', damageNotes: '', accessoriesReturned: null },
  { id: 'eq-9',  name: 'PORTABLE GRINDER',               codes: ['8153'],                 qty: 1, condition: '', damageNotes: '', accessoriesReturned: null },
  { id: 'eq-10', name: 'LEVELING LASER',                 codes: ['8136'],                 qty: 1, condition: '', damageNotes: '', accessoriesReturned: null },
  { id: 'eq-11', name: 'MITER SAW',                      codes: ['8137'],                 qty: 1, condition: '', damageNotes: '', accessoriesReturned: null },
  { id: 'eq-12', name: 'WELDING MACHINE',                codes: ['8151', '8140', '8168'], qty: 3, condition: '', damageNotes: '', accessoriesReturned: null },
  { id: 'eq-13', name: 'TIN SNIP CUTTER',                codes: ['8135', '8170'],         qty: 2, condition: '', damageNotes: '', accessoriesReturned: null },
  { id: 'eq-14', name: 'RIVETER GUN',                    codes: ['8169'],                 qty: 1, condition: '', damageNotes: '', accessoriesReturned: null },
  { id: 'eq-15', name: 'ELECTRIC ANGLE GRINDER',         codes: ['8152'],                 qty: 1, condition: '', damageNotes: '', accessoriesReturned: null },
  { id: 'eq-16', name: 'CORDLESS DRILL',                 codes: ['8158', '8161', '8159'], qty: 3, condition: '', damageNotes: '', accessoriesReturned: null },
  { id: 'eq-17', name: 'CORDLESS ANGLE GRINDER',         codes: ['8131'],                 qty: 1, condition: '', damageNotes: '', accessoriesReturned: null },
  { id: 'eq-18', name: 'ELECTRIC GRINDER',               codes: ['8145'],                 qty: 1, condition: '', damageNotes: '', accessoriesReturned: null },
  { id: 'eq-19', name: 'RIVETER GUN (SET)',               codes: ['8150', '8132'],         qty: 2, condition: '', damageNotes: '', accessoriesReturned: null },
  { id: 'eq-20', name: 'AIR SPRAY GUN',                  codes: ['8148'],                 qty: 1, condition: '', damageNotes: '', accessoriesReturned: null },
].map(migrate)

function loadPersistedList() {
  try {
    const saved = localStorage.getItem('eqt_equipment_master')
    if (saved) return JSON.parse(saved).map(migrate)
  } catch (e) {
    console.error('Failed to load equipment master from localStorage', e)
  }
  return JSON.parse(JSON.stringify(DEFAULT_EQUIPMENT))
}

function persistList() {
  try {
    localStorage.setItem('eqt_equipment_master', JSON.stringify(equipmentList.value))
  } catch (e) {
    console.error('Failed to persist equipment master', e)
  }
}

const equipmentList = ref(loadPersistedList())
watch(equipmentList, () => { persistList() }, { deep: true })

/** Look up equipment by a single code number. Returns the entry or null. */
function findByCode(code) {
  const c = String(code).trim()
  return equipmentList.value.find(eq => eq.units.some(u => u.code === c)) || null
}

/** Find the specific unit object for a given code. Returns { eq, unit } or null. */
function findUnitByCode(code) {
  const c = String(code).trim()
  for (const eq of equipmentList.value) {
    const unit = eq.units.find(u => u.code === c)
    if (unit) return { eq, unit }
  }
  return null
}

/** Add a new equipment entry. units = [{ code, condition, damageNotes, accessoriesReturned, accessoriesNotes }] */
function addEquipment({ name, units }) {
  const id = 'eq-' + Date.now()
  const cleanUnits = units
    .map(u => makeUnit(u.code, u.condition, u.damageNotes, u.accessoriesReturned, u.accessoriesNotes || ''))
    .filter(u => u.code)
  equipmentList.value.push({
    id,
    name: name.trim().toUpperCase(),
    qty: cleanUnits.length || 1,
    units: cleanUnits,
  })
}

function removeEquipment(id) {
  const idx = equipmentList.value.findIndex(e => e.id === id)
  if (idx !== -1) equipmentList.value.splice(idx, 1)
}

/** Update an existing entry. units = [{ code, condition, damageNotes, accessoriesReturned, accessoriesNotes }] */
function updateEquipment(id, { name, units }) {
  const entry = equipmentList.value.find(e => e.id === id)
  if (!entry) return
  const cleanUnits = units
    .map(u => makeUnit(u.code, u.condition, u.damageNotes, u.accessoriesReturned, u.accessoriesNotes || ''))
    .filter(u => u.code)
  entry.name  = name.trim().toUpperCase()
  entry.units = cleanUnits
  entry.qty   = cleanUnits.length || 1
}

export function useEquipmentStore() {
  return { equipmentList, findByCode, findUnitByCode, addEquipment, removeEquipment, updateEquipment }
}