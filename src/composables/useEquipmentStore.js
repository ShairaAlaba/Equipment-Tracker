// src/composables/useEquipmentStore.js
// ============================================================
// Equipment Store (FUSED VERSION)
// - Real-time Firestore sync
// - LocalStorage fallback (SAFE)
// - Full original logic preserved
// ============================================================

import { ref, watch } from 'vue'
import { db } from '../firebase'
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch
} from 'firebase/firestore'

// ─────────────────────────────────────
const EQ_COL = 'equipment_master'

// ─────────────────────────────────────
// Helpers
// ─────────────────────────────────────
function makeUnit(code, condition = '', damageNotes = '', accessoriesReturned = null, accessoriesNotes = '') {
  return { code: String(code).trim(), condition, damageNotes, accessoriesReturned, accessoriesNotes }
}

function migrate(entry) {
  if (entry.units && Array.isArray(entry.units)) {
    return {
      ...entry,
      units: entry.units.map(u => ({
        accessoriesNotes: '',
        ...u,
      })),
    }
  }

  const codes = Array.isArray(entry.codes) ? entry.codes : []

  return {
    id: entry.id,
    name: entry.name,
    qty: codes.length || 1,
    units: codes.map(c => makeUnit(
      c,
      entry.condition || '',
      entry.damageNotes || '',
      entry.accessoriesReturned ?? null,
      entry.accessoriesNotes || ''
    )),
  }
}

// ─────────────────────────────────────
// DEFAULT DATA (UNCHANGED)
// ─────────────────────────────────────
const DEFAULT_EQUIPMENT = [
  { id: 'eq-1', name: 'TABLE SAW', codes: ['8160'], qty: 1 },
  { id: 'eq-2', name: 'THICKNESS PLANER', codes: ['8156'], qty: 1 },
  { id: 'eq-3', name: 'INDUSTRIAL DEMOLITION BREAKER', codes: ['8143'], qty: 1 },
  { id: 'eq-4', name: 'HAMMER (BRUSHLESS MOTOR)', codes: ['8133'], qty: 1 },
  { id: 'eq-5', name: 'CUT-OFF SAW', codes: ['8144'], qty: 1 },
  { id: 'eq-6', name: 'CIRCULAR SAW', codes: ['8155'], qty: 1 },
  { id: 'eq-7', name: 'ELECTRIC IMPACT DRILL', codes: ['8147','8149'], qty: 2 },
  { id: 'eq-8', name: 'PORTABLE DRILL', codes: ['8158'], qty: 1 },
  { id: 'eq-9', name: 'PORTABLE GRINDER', codes: ['8153'], qty: 1 },
  { id: 'eq-10', name: 'LEVELING LASER', codes: ['8136'], qty: 1 },
  { id: 'eq-11', name: 'MITER SAW', codes: ['8137'], qty: 1 },
  { id: 'eq-12', name: 'WELDING MACHINE', codes: ['8151','8140','8168'], qty: 3 },
  { id: 'eq-13', name: 'TIN SNIP CUTTER', codes: ['8135','8170'], qty: 2 },
  { id: 'eq-14', name: 'RIVETER GUN', codes: ['8169'], qty: 1 },
  { id: 'eq-15', name: 'ELECTRIC ANGLE GRINDER', codes: ['8152'], qty: 1 },
  { id: 'eq-16', name: 'CORDLESS DRILL', codes: ['8158','8161','8159'], qty: 3 },
  { id: 'eq-17', name: 'CORDLESS ANGLE GRINDER', codes: ['8131'], qty: 1 },
  { id: 'eq-18', name: 'ELECTRIC GRINDER', codes: ['8145'], qty: 1 },
  { id: 'eq-19', name: 'RIVETER GUN (SET)', codes: ['8150','8132'], qty: 2 },
  { id: 'eq-20', name: 'AIR SPRAY GUN', codes: ['8148'], qty: 1 },
].map(migrate)

// ─────────────────────────────────────
// STATE
// ─────────────────────────────────────
const equipmentList = ref([])
const syncStatus = ref('connecting')

let _suppressNextWrite = false

// ─────────────────────────────────────
// LOCAL STORAGE (SAFE FALLBACK)
// ─────────────────────────────────────
function loadLocal() {
  try {
    const saved = localStorage.getItem('eqt_equipment_master')
    if (saved) return JSON.parse(saved).map(migrate)
  } catch {}
  return JSON.parse(JSON.stringify(DEFAULT_EQUIPMENT))
}

function persistLocal() {
  localStorage.setItem('eqt_equipment_master', JSON.stringify(equipmentList.value))
}

// ─────────────────────────────────────
// FIRESTORE LISTENER
// ─────────────────────────────────────
const colRef = collection(db, EQ_COL)

onSnapshot(colRef, async (snapshot) => {
  if (snapshot.empty && equipmentList.value.length === 0) {
    await seedDefaults()
    return
  }

  if (_suppressNextWrite) {
    _suppressNextWrite = false
    return
  }

  equipmentList.value = snapshot.docs.map(d =>
    migrate({ id: d.id, ...d.data() })
  )

  syncStatus.value = 'synced'
  persistLocal()

}, (err) => {
  console.error('Firestore error:', err)
  syncStatus.value = 'error'
  equipmentList.value = loadLocal()
})

// ─────────────────────────────────────
// SEED DEFAULTS
// ─────────────────────────────────────
async function seedDefaults() {
  const batch = writeBatch(db)
  DEFAULT_EQUIPMENT.forEach(eq => {
    const { id, ...data } = eq
    batch.set(doc(db, EQ_COL, id), data)
  })
  await batch.commit()
}

// ─────────────────────────────────────
// FIRESTORE WRITES
// ─────────────────────────────────────
async function writeEquipment(eq) {
  _suppressNextWrite = true
  persistLocal()
  const { id, ...data } = eq
  await setDoc(doc(db, EQ_COL, id), data)
}

async function deleteEquipmentFS(id) {
  persistLocal()
  await deleteDoc(doc(db, EQ_COL, id))
}

// ─────────────────────────────────────
// PUBLIC API (UNCHANGED)
// ─────────────────────────────────────
function findByCode(code) {
  const c = String(code).trim()
  return equipmentList.value.find(eq => eq.units.some(u => u.code === c)) || null
}

function findUnitByCode(code) {
  const c = String(code).trim()
  for (const eq of equipmentList.value) {
    const unit = eq.units.find(u => u.code === c)
    if (unit) return { eq, unit }
  }
  return null
}

async function addEquipment({ name, units }) {
  const id = 'eq-' + Date.now()
  const cleanUnits = units.map(u => makeUnit(
    u.code, u.condition, u.damageNotes, u.accessoriesReturned, u.accessoriesNotes || ''
  )).filter(u => u.code)

  const entry = {
    id,
    name: name.trim().toUpperCase(),
    qty: cleanUnits.length || 1,
    units: cleanUnits,
  }

  equipmentList.value.push(entry)
  await writeEquipment(entry)
}

async function removeEquipment(id) {
  equipmentList.value = equipmentList.value.filter(e => e.id !== id)
  await deleteEquipmentFS(id)
}

async function updateEquipment(id, { name, units }) {
  const entry = equipmentList.value.find(e => e.id === id)
  if (!entry) return

  const cleanUnits = units.map(u => makeUnit(
    u.code, u.condition, u.damageNotes, u.accessoriesReturned, u.accessoriesNotes || ''
  )).filter(u => u.code)

  entry.name = name.trim().toUpperCase()
  entry.units = cleanUnits
  entry.qty = cleanUnits.length || 1

  await writeEquipment(entry)
}

// ─────────────────────────────────────
// INIT
// ─────────────────────────────────────
equipmentList.value = loadLocal()
watch(equipmentList, persistLocal, { deep: true })

// ─────────────────────────────────────
// EXPORT
// ─────────────────────────────────────
export function useEquipmentStore() {
  return {
    equipmentList,
    syncStatus,
    findByCode,
    findUnitByCode,
    addEquipment,
    removeEquipment,
    updateEquipment,
  }
}