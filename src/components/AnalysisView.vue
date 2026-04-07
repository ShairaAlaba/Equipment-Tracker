<template>
  <div class="analysis-wrap">

    <!-- ── Page Header ── -->
    <div class="page-header">
      <div class="header-left">
        <h2> Equipment Analysis</h2>
        <p>Live view of all equipment currently borrowed and not yet returned.</p>
      </div>
      <div class="header-stats">
        <div class="stat-card">
          <span class="stat-num">{{ totalUnreturned }}</span>
          <span class="stat-lbl">Units Out</span>
        </div>
        <div class="stat-card stat-card--warn" v-if="overdueCount > 0">
          <span class="stat-num">{{ overdueCount }}</span>
          <span class="stat-lbl">Overdue</span>
        </div>
        <div class="stat-card stat-card--green">
          <span class="stat-num">{{ uniqueBorrowers }}</span>
          <span class="stat-lbl">Borrowers</span>
        </div>
        <div class="stat-card stat-card--blue">
          <span class="stat-num">{{ uniqueEquipment }}</span>
          <span class="stat-lbl">Equipment Types</span>
        </div>
      </div>
    </div>

    <!-- ── Filters ── -->
    <div class="filter-bar">
      <div class="filter-search">
        <span class="search-ico"></span>
        <input
          type="text"
          v-model="search"
          placeholder="Search borrower, project, or equipment…"
          class="search-input"
        />
        <button v-if="search" class="clear-x" @click="search = ''">✕</button>
      </div>
      <div class="filter-right">
        <div class="filter-group">
          <label class="filter-lbl">Sort by</label>
          <select v-model="sortBy" class="filter-select">
            <option value="date">Date Borrowed</option>
            <option value="equipment">Equipment Name</option>
            <option value="borrower">Borrower Name</option>
            <option value="overdue">Overdue First</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-lbl">Section</label>
          <select v-model="filterSection" class="filter-select">
            <option value="all">All Sections</option>
            <option value="new">New / Good Condition</option>
            <option value="old">Old / Damaged</option>
          </select>
        </div>
      </div>
    </div>

    <!-- ── Empty State ── -->
    <div v-if="filteredRows.length === 0" class="empty-state">
      <div class="empty-icon">✅</div>
      <div class="empty-title">
        {{ search || filterSection !== 'all' ? 'No matches found.' : 'All Equipment Returned!' }}
      </div>
      <div class="empty-sub">
        {{ search || filterSection !== 'all'
          ? 'Try clearing your search or filters.'
          : 'There are no outstanding borrowed equipment at this time.' }}
      </div>
    </div>

    <!-- ── Unreturned Table ── -->
    <div v-else class="table-card">
      <div class="table-header-bar">
        <span class="table-title">Unreturned Equipment Records</span>
        <span class="table-count">{{ filteredRows.length }} record{{ filteredRows.length !== 1 ? 's' : '' }}</span>
      </div>

      <div class="table-scroll-wrap" ref="tableWrap">
        <table class="analysis-table">
          <thead>
            <tr>
              <th class="th-num">#</th>
              <th class="th-section">Section</th>
              <th class="th-date">Record Date</th>
              <th class="th-equip">Equipment / Tool</th>
              <th class="th-code">Code No.</th>
              <th class="th-borrower">Borrower</th>
              <th class="th-project">Project</th>
              <th class="th-ctrl">Control No.</th>
              <th class="th-wd">Withdrawn</th>
              <th class="th-cond">Condition Out</th>
              <th class="th-dmgnotes">Checkout Notes</th>
              <th class="th-borrowed">Date Borrowed</th>
              <th class="th-time">Time</th>
              <th class="th-duration">Days Out</th>
              <th class="th-status">Status</th>
              <th class="th-edit">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, idx) in filteredRows"
              :key="item._key"
              :class="['data-row', { 'row-overdue': item.isOverdue, 'row-long': item.daysOut >= 3 }]"
            >
              <td class="td-num">{{ idx + 1 }}</td>

              <td class="td-section">
                <span :class="['section-badge', item.section === 'new' ? 'badge-new' : 'badge-old']">
                  {{ item.section === 'new' ? '✦ New' : '⚠ Old' }}
                </span>
              </td>

              <td class="td-date mono">{{ item.recordDate }}</td>

              <td class="td-equip">
                <span class="equip-name">{{ item.toolName || '—' }}</span>
              </td>

              <td class="td-code">
                <span class="code-pill">{{ item.codeNo || '—' }}</span>
              </td>

              <td class="td-borrower">
                <span class="borrower-name">{{ item.borrower.name || '—' }}</span>
              </td>

              <td class="td-project">{{ item.borrower.project || '—' }}</td>

              <td class="td-ctrl mono">{{ item.borrower.controlNo || '—' }}</td>

              <td class="td-wd">
                <span class="wd-badge">{{ item.borrower.withdraw || 0 }}</span>
              </td>

              <td class="td-cond">
                <span v-if="item.borrower.conditionCheckout" :class="'cond-badge condition-' + item.borrower.conditionCheckout">
                  {{ item.borrower.conditionCheckout }}
                </span>
                <span v-else class="cond-none">—</span>
              </td>

              <td class="td-dmgnotes">
                <span v-if="item.borrower.conditionCheckoutNotes" class="dmgnotes-text">{{ item.borrower.conditionCheckoutNotes }}</span>
                <span v-else class="cond-none">—</span>
              </td>

              <td class="td-borrowed mono">{{ item.borrower.dateBorrowed || '—' }}</td>

              <td class="td-time mono">{{ fmt12(item.borrower.timeBorrowed) }}</td>

              <td class="td-duration">
                <span :class="['days-badge', daysClass(item.daysOut)]">
                  {{ item.daysOut >= 0 ? item.daysOut + 'd' : '—' }}
                </span>
              </td>

              <td class="td-status">
                <span :class="['status-badge', item.isOverdue ? 'status-overdue' : 'status-out']">
                  {{ item.isOverdue ? '⚠ Overdue' : '📤 Out' }}
                </span>
              </td>

              <td class="td-edit">
                <button class="edit-record-btn" @click="goToRecord(item)" title="Go to Daily Record to re-record this equipment">
                  Edit
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Fixed scrollbar -->
      <div class="fixed-scroll-bar" ref="fixedBar">
        <div class="fixed-scroll-inner" ref="fixedInner"></div>
      </div>
    </div>

    <!-- ── Equipment Summary Cards ── -->
    <div class="summary-section" v-if="equipmentSummary.length > 0">
      <div class="summary-title">Equipment Overview</div>
      <div class="summary-grid">
        <div
          v-for="eq in equipmentSummary"
          :key="eq.name"
          class="summary-card"
          :class="eq.allOut ? 'summary-card--allout' : 'summary-card--partial'"
        >
          <div class="summary-card-top">
            <span class="summary-equip-name">{{ eq.name }}</span>
            <span class="summary-code-list">{{ eq.codes.join(', ') }}</span>
          </div>
          <div class="summary-card-bottom">
            <div class="summary-stat">
              <span class="summary-stat-num" style="color:#b83232">{{ eq.unreturnedCount }}</span>
              <span class="summary-stat-lbl">units out</span>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-stat">
              <span class="summary-stat-num" style="color:#555">{{ eq.totalQty }}</span>
              <span class="summary-stat-lbl">total</span>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-stat">
              <span class="summary-stat-num" style="color:#2a7a22">{{ eq.totalQty - eq.unreturnedCount }}</span>
              <span class="summary-stat-lbl">available</span>
            </div>
          </div>
          <div class="summary-bar-wrap">
            <div
              class="summary-bar-fill"
              :style="{ width: Math.min(100, (eq.unreturnedCount / eq.totalQty) * 100) + '%' }"
              :class="eq.allOut ? 'bar-fill--danger' : 'bar-fill--warn'"
            ></div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useEquipmentStore } from '../composables/useEquipmentStore.js'

const props = defineProps({
  history: { type: Array, required: true }
})

const emit = defineEmits(['go-to-record'])

const { equipmentList } = useEquipmentStore()

// ── Filters ──────────────────────────────────────────────────
const search        = ref('')
const sortBy        = ref('date')
const filterSection = ref('all')

// ── Fixed scrollbar ───────────────────────────────────────────
const tableWrap  = ref(null)
const fixedBar   = ref(null)
const fixedInner = ref(null)
let _cleanupScroll = null

function setupFixedBar() {
  const wrap  = tableWrap.value
  const bar   = fixedBar.value
  const inner = fixedInner.value
  if (!wrap || !bar || !inner) return

  function update() {
    inner.style.width = wrap.scrollWidth + 'px'
    const rect = wrap.getBoundingClientRect()
    bar.style.left  = rect.left + 'px'
    bar.style.width = rect.width + 'px'
  }

  let _fw = false, _fb = false
  function onWrap() { if (_fb) { _fb = false; return }; _fw = true; bar.scrollLeft = wrap.scrollLeft }
  function onBar()  { if (_fw) { _fw = false; return }; _fb = true; wrap.scrollLeft = bar.scrollLeft }

  wrap.addEventListener('scroll', onWrap)
  bar.addEventListener('scroll', onBar)
  const ro = new ResizeObserver(update)
  ro.observe(wrap)
  window.addEventListener('resize', update)
  window.addEventListener('scroll', update)
  update()

  return () => {
    wrap.removeEventListener('scroll', onWrap)
    bar.removeEventListener('scroll', onBar)
    ro.disconnect()
    window.removeEventListener('resize', update)
    window.removeEventListener('scroll', update)
  }
}

onMounted(async () => {
  await nextTick()
  _cleanupScroll = setupFixedBar()
})
onUnmounted(() => { if (_cleanupScroll) _cleanupScroll() })

// ── Helpers ───────────────────────────────────────────────────
function fmt12(t) {
  if (!t) return '—'
  const [hStr, mStr] = t.split(':')
  let h = parseInt(hStr, 10)
  const m = mStr || '00'
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return h + ':' + m + ' ' + ampm
}

function daysOut(dateBorrowedStr) {
  if (!dateBorrowedStr) return -1
  const borrowed = new Date(dateBorrowedStr + 'T00:00:00')
  const today    = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.floor((today - borrowed) / 86400000)
}

function daysClass(days) {
  if (days < 0)  return 'days-unknown'
  if (days === 0) return 'days-today'
  if (days <= 2)  return 'days-short'
  if (days <= 7)  return 'days-medium'
  return 'days-long'
}

// ── Build flat list of all unreturned borrowers ───────────────
const allUnreturned = computed(() => {
  const rows = []

  // Scan history records
  for (const record of props.history) {
    const sections = [
      { key: 'newEquipRows', section: 'new' },
      { key: 'oldEquipRows', section: 'old' },
    ]
    for (const { key, section } of sections) {
      for (const row of (record[key] || [])) {
        for (const borrower of (row.borrowers || [])) {
          if (!borrower.returned) {
            const days = daysOut(borrower.dateBorrowed)
            rows.push({
              _key:       record.date + '-' + row.id + '-' + borrower.id,
              recordDate: record.date,
              section,
              toolName:   row.toolName || '',
              codeNo:     row.codeNo   || '',
              borrower,
              daysOut:    days,
              isOverdue:  days > 7,
            })
          }
        }
      }
    }
  }

  return rows
})

// ── Filtered + sorted ─────────────────────────────────────────
const filteredRows = computed(() => {
  let list = [...allUnreturned.value]

  // Section filter
  if (filterSection.value !== 'all') {
    list = list.filter(r => r.section === filterSection.value)
  }

  // Search
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter(r =>
      (r.toolName || '').toLowerCase().includes(q) ||
      (r.codeNo   || '').toLowerCase().includes(q) ||
      (r.borrower.name    || '').toLowerCase().includes(q) ||
      (r.borrower.project || '').toLowerCase().includes(q) ||
      (r.borrower.controlNo || '').toLowerCase().includes(q)
    )
  }

  // Sort
  if (sortBy.value === 'date') {
    list.sort((a, b) => (a.borrower.dateBorrowed || '').localeCompare(b.borrower.dateBorrowed || ''))
  } else if (sortBy.value === 'equipment') {
    list.sort((a, b) => a.toolName.localeCompare(b.toolName))
  } else if (sortBy.value === 'borrower') {
    list.sort((a, b) => (a.borrower.name || '').localeCompare(b.borrower.name || ''))
  } else if (sortBy.value === 'overdue') {
    list.sort((a, b) => b.daysOut - a.daysOut)
  }

  return list
})

// ── Summary stats ─────────────────────────────────────────────
const totalUnreturned = computed(() =>
  allUnreturned.value.reduce((s, r) => s + (parseInt(r.borrower.withdraw) || 1), 0)
)
const overdueCount = computed(() => allUnreturned.value.filter(r => r.isOverdue).length)
const uniqueBorrowers = computed(() =>
  new Set(allUnreturned.value.map(r => r.borrower.name).filter(Boolean)).size
)
const uniqueEquipment = computed(() =>
  new Set(allUnreturned.value.map(r => r.toolName).filter(Boolean)).size
)

// ── Navigate to Daily Record for re-recording ─────────────────
function goToRecord(item) {
  // Emit up to App.vue: switch to daily tab and load that date's record
  emit('go-to-record', {
    date:     item.recordDate,
    section:  item.section,
    codeNo:   item.codeNo,
    toolName: item.toolName,
  })
}

const equipmentSummary = computed(() => {
  const map = new Map()

  for (const item of allUnreturned.value) {
    const name = item.toolName || 'Unknown'
    if (!map.has(name)) {
      // Find master list entry for total qty
      const master = equipmentList.value.find(e => e.name === name)
      map.set(name, {
        name,
        codes: master ? master.units.map(u => u.code) : [item.codeNo].filter(Boolean),
        totalQty: master ? master.qty : 1,
        unreturnedCount: 0,
      })
    }
    map.get(name).unreturnedCount += (parseInt(item.borrower.withdraw) || 1)
  }

  return [...map.values()]
    .map(e => ({ ...e, allOut: e.unreturnedCount >= e.totalQty }))
    .sort((a, b) => b.unreturnedCount - a.unreturnedCount)
})
</script>

<style scoped>
.analysis-wrap {
  padding: 28px 36px 100px;
  max-width: 100%;
  margin: 0 auto;
}

/* ── Page header ── */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 20px;
  flex-wrap: wrap;
}

.header-left h2 {
  font-family: 'Cormorant Garamond', serif;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #000;
  margin-bottom: 5px;
}

.header-left p {
  font-family: 'Nunito', sans-serif;
  font-size: 12px;
  color: var(--muted);
}

.header-stats {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.stat-card {
  background: #ffffff;
  border: 1.5px solid var(--border);
  border-radius: 12px;
  padding: 12px 20px;
  text-align: center;
  min-width: 80px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.stat-card--warn { border-color: rgba(184,50,50,0.4); background: rgba(184,50,50,0.04); }
.stat-card--green { border-color: rgba(42,122,34,0.3); background: rgba(42,122,34,0.04); }
.stat-card--blue  { border-color: rgba(42,96,153,0.3); background: rgba(42,96,153,0.04); }

.stat-num {
  display: block;
  font-family: 'DM Mono', monospace;
  font-size: 28px;
  font-weight: 800;
  color: var(--accent);
  line-height: 1;
}
.stat-card--warn  .stat-num { color: #b83232; }
.stat-card--green .stat-num { color: #2a7a22; }
.stat-card--blue  .stat-num { color: #2a6099; }

.stat-lbl {
  display: block;
  font-family: 'Nunito', sans-serif;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: var(--muted);
  margin-top: 4px;
}

/* ── Filter bar ── */
.filter-bar {
  display: flex;
  gap: 14px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 20px;
  background: #ffffff;
  border: 1.5px solid var(--border);
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
}

.filter-search {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 200px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px 10px;
}

.search-ico { font-size: 13px; flex-shrink: 0; }

.search-input {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  font-size: 13px;
  flex: 1;
  padding: 0 !important;
  outline: none;
  color: #000;
}

.clear-x {
  background: none;
  border: none;
  color: var(--muted);
  cursor: pointer;
  font-size: 12px;
  padding: 0 2px;
  flex-shrink: 0;
}
.clear-x:hover { color: var(--danger); }

.filter-right {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.filter-lbl {
  font-family: 'Nunito', sans-serif;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--muted);
}

.filter-select {
  font-size: 12px;
  padding: 5px 10px;
  border-radius: 7px;
  border: 1px solid var(--border);
  background: var(--surface2);
  color: #000;
  font-family: 'Nunito', sans-serif;
  cursor: pointer;
  min-width: 150px;
}

/* ── Empty state ── */
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 52px;
  margin-bottom: 16px;
}

.empty-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 22px;
  font-weight: 600;
  color: #000;
  margin-bottom: 8px;
}

.empty-sub {
  font-family: 'Nunito', sans-serif;
  font-size: 13px;
  color: var(--muted);
}

/* ── Table card ── */
.table-card {
  background: #ffffff;
  border: 1.5px solid var(--border);
  border-radius: 14px;
  margin-bottom: 28px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  overflow: hidden;
}

.table-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 18px;
  background: var(--surface2);
  border-bottom: 1.5px solid var(--border);
}

.table-title {
  font-family: 'Nunito', sans-serif;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.3px;
  text-transform: uppercase;
  color: var(--muted);
}

.table-count {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: var(--muted);
}

/* ── Scroll wrapper — hides native scrollbar ── */
.table-scroll-wrap {
  overflow-x: auto;
  overflow-y: visible;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.table-scroll-wrap::-webkit-scrollbar { display: none; }

/* Fixed scrollbar at viewport bottom */
.fixed-scroll-bar {
  position: fixed;
  bottom: 0;
  z-index: 999;
  overflow-x: auto;
  overflow-y: hidden;
  height: 20px;
  background: var(--surface2);
  border-top: 1.5px solid var(--border);
}
.fixed-scroll-bar::-webkit-scrollbar { height: 16px; }
.fixed-scroll-bar::-webkit-scrollbar-track { background: var(--surface2); }
.fixed-scroll-bar::-webkit-scrollbar-thumb {
  background: var(--accent2);
  border-radius: 8px;
  border: -2px solid var(--surface2);
}
.fixed-scroll-bar::-webkit-scrollbar-thumb:hover { background: var(--accent); }
.fixed-scroll-inner { height: 1px; }

/* ── Analysis table ── */
.analysis-table {
  width: 100%;
  min-width: 1700px;
  border-collapse: collapse;
  font-size: 13px;
}

.analysis-table thead th {
  padding: 11px 13px;
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

.th-num      { width: 44px; text-align: center; }
.th-section  { width: 100px; }
.th-date     { width: 120px; }
.th-equip    { min-width: 220px; }
.th-code     { width: 100px; }
.th-borrower { min-width: 170px; }
.th-project  { min-width: 160px; }
.th-ctrl     { width: 120px; }
.th-wd       { width: 90px; text-align: center; }
.th-cond     { width: 120px; text-align: center; }
.th-dmgnotes { min-width: 180px; }
.th-borrowed { width: 120px; }
.th-time     { width: 100px; }
.th-duration { width: 90px; text-align: center; }
.th-status   { width: 120px; text-align: center; }
.th-edit     { width: 100px; text-align: center; }

/* ── Body rows ── */
.analysis-table tbody tr.data-row {
  border-bottom: 1px solid #ede5da;
  transition: background 0.12s;
}
.analysis-table tbody tr.data-row:hover td { background: #fdf4eb !important; }
.analysis-table tbody tr.row-overdue td { background: rgba(184,50,50,0.03); }
.analysis-table tbody tr.row-long td   { background: rgba(184,130,0,0.03); }

.analysis-table tbody td {
  padding: 10px 13px;
  vertical-align: middle;
}

.td-num { text-align: center; font-family: 'DM Mono', monospace; font-size: 11px; color: var(--muted); }
.td-date.mono, .td-ctrl.mono, .td-borrowed.mono, .td-time.mono { font-family: 'DM Mono', monospace; font-size: 12px; }

/* Section badge */
.section-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 6px;
  font-family: 'Nunito', sans-serif;
  font-size: 10px;
  font-weight: 800;
  white-space: nowrap;
}
.badge-new { background: rgba(138,106,74,0.1); color: var(--accent); border: 1px solid rgba(138,106,74,0.25); }
.badge-old { background: rgba(184,50,50,0.08); color: #b83232; border: 1px solid rgba(184,50,50,0.2); }

/* Equipment name */
.equip-name { font-family: 'Nunito', sans-serif; font-weight: 700; color: #000; }

/* Code pill */
.code-pill {
  display: inline-block;
  background: rgba(138,106,74,0.08);
  border: 1px solid rgba(138,106,74,0.25);
  color: var(--accent);
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  font-weight: 700;
  padding: 2px 9px;
  border-radius: 6px;
  letter-spacing: 0.5px;
}

/* Borrower name */
.borrower-name { font-family: 'Nunito', sans-serif; font-weight: 700; color: #000; }

/* Withdrawn badge */
.td-wd { text-align: center; }
.wd-badge {
  display: inline-block;
  background: rgba(42,96,153,0.08);
  color: #2a6099;
  border: 1px solid rgba(42,96,153,0.2);
  font-family: 'DM Mono', monospace;
  font-size: 14px;
  font-weight: 800;
  padding: 2px 10px;
  border-radius: 6px;
}

/* Condition badge */
.td-cond { text-align: center; }
.cond-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 8px;
  font-family: 'Nunito', sans-serif;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.condition-excellent { background: rgba(58,122,50,0.1);  color: var(--success); border: 1px solid rgba(58,122,50,0.3); }
.condition-good      { background: rgba(42,96,153,0.08); color: #2a6099; border: 1px solid rgba(42,96,153,0.2); }
.condition-fair      { background: rgba(138,98,0,0.08);  color: var(--warning); border: 1px solid rgba(138,98,0,0.25); }
.condition-poor      { background: rgba(184,50,50,0.07); color: var(--danger);  border: 1px solid rgba(184,50,50,0.25); }
.cond-none { color: var(--muted); font-family: 'DM Mono', monospace; font-size: 12px; }

/* Days out badge */
.td-duration { text-align: center; }
.days-badge {
  display: inline-block;
  padding: 2px 9px;
  border-radius: 8px;
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  font-weight: 800;
}
.days-unknown { background: rgba(0,0,0,0.05); color: var(--muted); }
.days-today   { background: rgba(42,122,34,0.1); color: #2a7a22; border: 1px solid rgba(42,122,34,0.25); }
.days-short   { background: rgba(42,96,153,0.08); color: #2a6099; border: 1px solid rgba(42,96,153,0.2); }
.days-medium  { background: rgba(138,98,0,0.08); color: var(--warning); border: 1px solid rgba(138,98,0,0.25); }
.days-long    { background: rgba(184,50,50,0.08); color: #b83232; border: 1px solid rgba(184,50,50,0.25); }

/* Checkout damage notes */
.td-dmgnotes { vertical-align: middle; }
.dmgnotes-text {
  font-family: 'Nunito', sans-serif;
  font-size: 12px;
  color: #000;
}

/* Status badge */
.td-status { text-align: center; }
.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 10px;
  font-family: 'Nunito', sans-serif;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}
.status-out     { background: rgba(42,96,153,0.08); color: #2a6099; border: 1px solid rgba(42,96,153,0.2); }
.status-overdue { background: rgba(184,50,50,0.1); color: #b83232; border: 1px solid rgba(184,50,50,0.3); }

/* Edit action column */
.td-edit { text-align: center; vertical-align: middle; white-space: nowrap; }

.edit-record-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border-radius: 8px;
  border: 1.5px solid rgba(42, 96, 153, 0.35);
  background: rgba(42, 96, 153, 0.07);
  color: #2a6099;
  font-family: 'Nunito', sans-serif;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.edit-record-btn:hover {
  background: rgba(42, 96, 153, 0.15);
  border-color: rgba(42, 96, 153, 0.6);
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(42, 96, 153, 0.15);
}

/* ── Equipment Summary Cards ── */
.summary-section { margin-top: 4px; }

.summary-title {
  font-family: 'Nunito', sans-serif;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.3px;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 14px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}

.summary-card {
  background: #ffffff;
  border: 1.5px solid var(--border);
  border-radius: 12px;
  padding: 14px 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  transition: box-shadow 0.15s;
}
.summary-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
.summary-card--allout  { border-color: rgba(184,50,50,0.4); }
.summary-card--partial { border-color: rgba(138,98,0,0.3); }

.summary-card-top {
  margin-bottom: 10px;
}

.summary-equip-name {
  display: block;
  font-family: 'Nunito', sans-serif;
  font-size: 12px;
  font-weight: 800;
  color: #000;
  margin-bottom: 3px;
}

.summary-code-list {
  display: block;
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: var(--muted);
}

.summary-card-bottom {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.summary-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.summary-stat-num {
  font-family: 'DM Mono', monospace;
  font-size: 20px;
  font-weight: 800;
  line-height: 1;
}

.summary-stat-lbl {
  font-family: 'Nunito', sans-serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--muted);
  margin-top: 3px;
}

.summary-divider {
  width: 1px;
  height: 28px;
  background: var(--border);
  flex-shrink: 0;
}

.summary-bar-wrap {
  height: 5px;
  background: rgba(0,0,0,0.07);
  border-radius: 3px;
  overflow: hidden;
}

.summary-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s ease;
}
.bar-fill--danger { background: #b83232; }
.bar-fill--warn   { background: #8a6200; }
</style>