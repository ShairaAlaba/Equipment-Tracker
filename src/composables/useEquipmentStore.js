// useEquipmentStore.js
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for the master equipment list.
// Both EquipmentTable and EquipmentMaster import from here so they always
// share the exact same reactive array.
// ─────────────────────────────────────────────────────────────────────────────
import { ref } from 'vue'

// Each entry:
// {
//   id:       unique string
//   name:     'TABLE SAW'
//   codes:    ['8160']          ← one code per physical unit
//   qty:      1                 ← = codes.length (kept in sync)
// }

const equipmentList = ref([
  { id: 'eq-1',  name: 'TABLE SAW',                     codes: ['8160'],               qty: 1 },
  { id: 'eq-2',  name: 'THICKNESS PLANER',               codes: ['8156'],               qty: 1 },
  { id: 'eq-3',  name: 'INDUSTRIAL DEMOLITION BREAKER',  codes: ['8143'],               qty: 1 },
  { id: 'eq-4',  name: 'HAMMER (BRUSHLESS MOTOR)',        codes: ['8133'],               qty: 1 },
  { id: 'eq-5',  name: 'CUT-OFF SAW',                    codes: ['8144'],               qty: 1 },
  { id: 'eq-6',  name: 'CIRCULAR SAW',                   codes: ['8155'],               qty: 1 },
  { id: 'eq-7',  name: 'ELECTRIC IMPACT DRILL',          codes: ['8147', '8149'],       qty: 2 },
  { id: 'eq-8',  name: 'PORTABLE DRILL',                 codes: ['8158'],               qty: 1 },
  { id: 'eq-9',  name: 'PORTABLE GRINDER',               codes: ['8153'],               qty: 1 },
  { id: 'eq-10', name: 'LEVELING LASER',                 codes: ['8136'],               qty: 1 },
  { id: 'eq-11', name: 'MITER SAW',                      codes: ['8137'],               qty: 1 },
  { id: 'eq-12', name: 'WELDING MACHINE',                codes: ['8151', '8140', '8168'], qty: 3 },
  { id: 'eq-13', name: 'TIN SNIP CUTTER',               codes: ['8135', '8170'],       qty: 2 },
  { id: 'eq-14', name: 'RIVETER GUN',                    codes: ['8169'],               qty: 1 },
  { id: 'eq-15', name: 'ELECTRIC ANGLE GRINDER',         codes: ['8152'],               qty: 1 },
  { id: 'eq-16', name: 'CORDLESS DRILL',                 codes: ['8158', '8161', '8159'], qty: 3 },
  { id: 'eq-17', name: 'CORDLESS ANGLE GRINDER',         codes: ['8131'],               qty: 1 },
  { id: 'eq-18', name: 'ELECTRIC GRINDER',               codes: ['8145'],               qty: 1 },
  { id: 'eq-19', name: 'RIVETER GUN (SET)',               codes: ['8150', '8132'],       qty: 2 },
  { id: 'eq-20', name: 'AIR SPRAY GUN',                  codes: ['8148'],               qty: 1 },
])

/** Look up equipment by a single code number. Returns the entry or null. */
function findByCode(code) {
  const c = String(code).trim()
  return equipmentList.value.find(eq => eq.codes.includes(c)) || null
}

/** Add a new equipment entry */
function addEquipment({ name, codes }) {
  const id = 'eq-' + Date.now()
  const cleanCodes = codes.map(c => c.trim()).filter(Boolean)
  equipmentList.value.push({
    id,
    name: name.trim().toUpperCase(),
    codes: cleanCodes,
    qty: cleanCodes.length || 1,
  })
}

/** Remove an entry by id */
function removeEquipment(id) {
  const idx = equipmentList.value.findIndex(e => e.id === id)
  if (idx !== -1) equipmentList.value.splice(idx, 1)
}

/** Update an existing entry in-place */
function updateEquipment(id, { name, codes }) {
  const entry = equipmentList.value.find(e => e.id === id)
  if (!entry) return
  entry.name  = name.trim().toUpperCase()
  entry.codes = codes.map(c => c.trim()).filter(Boolean)
  entry.qty   = entry.codes.length || 1
}

export function useEquipmentStore() {
  return { equipmentList, findByCode, addEquipment, removeEquipment, updateEquipment }
}
