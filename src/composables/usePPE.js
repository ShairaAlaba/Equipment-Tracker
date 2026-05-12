// src/composables/usePPE.js
// ============================================================
// PPE (Personal Protective Equipment) Distribution Tracker
// - Real-time Firestore sync
// - LocalStorage fallback
// ============================================================

import { ref, computed, watch } from 'vue'
import { db } from '../firebase'
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch
} from 'firebase/firestore'

const PPE_ITEMS_COL  = 'ppe_items'
const PPE_RECORDS_COL = 'ppe_records'

// ── Default PPE types ──
const DEFAULT_PPE_ITEMS = [
  { id: 'ppe-1', name: 'Hard Hat',     icon: '🪖', color: '#e8b84b' },
  { id: 'ppe-2', name: 'Gloves',       icon: '🧤', color: '#a07850' },
  { id: 'ppe-3', name: 'Safety Vest',  icon: '🦺', color: '#e87d2a' },
  { id: 'ppe-4', name: 'Safety Shoes', icon: '👟', color: '#5a7a9a' },
  { id: 'ppe-5', name: 'Welding Mask', icon: '😷', color: '#4a6a4a' },
  { id: 'ppe-6', name: 'Harness',      icon: '🔗', color: '#8a4a8a' },
]

// ── State ──
const ppeItems   = ref([])
const ppeRecords = ref([])   // { id, ppeItemId, ppeItemName, date, entries: [{id,name,designation,date,time,remarks}] }
const ppeSyncStatus = ref('connecting')

// ── Helpers ──
function loadPPEItemsLocal() {
  try {
    const s = localStorage.getItem('ppe_items')
    if (s) return JSON.parse(s)
  } catch {}
  return JSON.parse(JSON.stringify(DEFAULT_PPE_ITEMS))
}
function savePPEItemsLocal() {
  localStorage.setItem('ppe_items', JSON.stringify(ppeItems.value))
}

function loadPPERecordsLocal() {
  try {
    const s = localStorage.getItem('ppe_records')
    if (s) return JSON.parse(s)
  } catch {}
  return []
}
function savePPERecordsLocal() {
  localStorage.setItem('ppe_records', JSON.stringify(ppeRecords.value))
}

// ── Init from local ──
ppeItems.value   = loadPPEItemsLocal()
ppeRecords.value = loadPPERecordsLocal()

// ── Firestore: PPE Items ──
const itemsColRef = collection(db, PPE_ITEMS_COL)

onSnapshot(itemsColRef, async (snap) => {
  if (snap.empty) {
    // Seed defaults
    const batch = writeBatch(db)
    DEFAULT_PPE_ITEMS.forEach(item => {
      const { id, ...data } = item
      batch.set(doc(db, PPE_ITEMS_COL, id), data)
    })
    await batch.commit()
    return
  }
  ppeItems.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  savePPEItemsLocal()
}, err => {
  console.error('PPE items error:', err)
  ppeItems.value = loadPPEItemsLocal()
})

// ── Firestore: PPE Records ──
const recordsColRef = collection(db, PPE_RECORDS_COL)

onSnapshot(recordsColRef, (snap) => {
  const fromServer = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  // Merge: keep any local records not yet on server, add all server records
  const serverIds = new Set(fromServer.map(r => r.id))
  const localOnly = ppeRecords.value.filter(r => !serverIds.has(r.id))
  ppeRecords.value = [...fromServer, ...localOnly]
  ppeSyncStatus.value = 'synced'
  savePPERecordsLocal()
}, err => {
  console.error('PPE records error:', err)
  ppeSyncStatus.value = 'offline'
  // Keep existing in-memory state; already loaded from localStorage at init
})

// ── Write helpers ──
async function writePPERecord(record) {
  const { id, ...data } = record
  try {
    await setDoc(doc(db, PPE_RECORDS_COL, id), data)
  } catch (err) {
    console.warn('Firestore write failed, saved locally only:', err)
  }
}

async function deletePPERecord(id) {
  ppeRecords.value = ppeRecords.value.filter(r => r.id !== id)
  savePPERecordsLocal()
  await deleteDoc(doc(db, PPE_RECORDS_COL, id))
}

async function writePPEItem(item) {
  const { id, ...data } = item
  await setDoc(doc(db, PPE_ITEMS_COL, id), data)
}

async function deletePPEItem(id) {
  ppeItems.value = ppeItems.value.filter(i => i.id !== id)
  savePPEItemsLocal()
  await deleteDoc(doc(db, PPE_ITEMS_COL, id))
}

// ── Public API ──

async function addPPEItem({ name, icon, color }) {
  const item = {
    id: 'ppe-' + Date.now(),
    name: name.trim(),
    icon: icon || '🛡️',
    color: color || '#8a6a4a'
  }
  ppeItems.value.push(item)
  savePPEItemsLocal()
  await writePPEItem(item)
}

async function removePPEItem(id) {
  await deletePPEItem(id)
}

async function updatePPEItem(item) {
  const idx = ppeItems.value.findIndex(i => i.id === item.id)
  if (idx !== -1) {
    ppeItems.value[idx] = { ...ppeItems.value[idx], ...item }
  }
  savePPEItemsLocal()
  await writePPEItem(item)
}

// Save or update a distribution record for a specific PPE type
async function savePPEDistribution({ ppeItemId, entries }) {
  const item = ppeItems.value.find(i => i.id === ppeItemId)
  if (!item) return

  const id = `ppe-rec-${ppeItemId}-${Date.now()}`
  const record = {
    id,
    ppeItemId,
    ppeItemName: item.name,
    savedAt: new Date().toISOString(),
    entries: entries.map(e => ({ ...e }))
  }

  // Always push locally first so UI updates immediately (works offline too)
  const existing = ppeRecords.value.findIndex(r => r.id === id)
  if (existing === -1) {
    ppeRecords.value.push(record)
  }
  savePPERecordsLocal()
  // Then attempt Firestore write (fire and forget — onSnapshot will sync if online)
  writePPERecord(record)
  return record
}

async function deletePPEDistribution(id) {
  await deletePPERecord(id)
}

// Computed: all records sorted by savedAt descending
const sortedPPERecords = computed(() =>
  [...ppeRecords.value].sort((a, b) =>
    new Date(b.savedAt) - new Date(a.savedAt)
  )
)

// Search by worker name — returns all entries across all records that match
function searchWorker(query) {
  if (!query.trim()) return []
  const q = query.trim().toLowerCase()
  const results = []

  for (const record of ppeRecords.value) {
    for (const entry of record.entries || []) {
      if (entry.name && entry.name.toLowerCase().includes(q)) {
        results.push({
          ...entry,
          ppeItemName: record.ppeItemName,
          ppeItemId: record.ppeItemId,
          recordId: record.id,
          savedAt: record.savedAt
        })
      }
    }
  }
  return results
}

watch(ppeItems,   savePPEItemsLocal,   { deep: true })
watch(ppeRecords, savePPERecordsLocal, { deep: true })

export function usePPE() {
  return {
    ppeItems,
    ppeRecords,
    sortedPPERecords,
    ppeSyncStatus,
    addPPEItem,
    removePPEItem,
    updatePPEItem,
    savePPEDistribution,
    deletePPEDistribution,
    searchWorker,
  }
}