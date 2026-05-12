<template>
  <div class="ppe-app">

    <!-- ── Header ── -->
    <header class="ppe-header">
      <div class="ppe-header-inner">
        <button class="back-btn" @click="$emit('back')">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Back to Hub
        </button>
        <div class="ppe-title-block">
          <h1>PPE Distribution System</h1>
          <span class="ppe-subtitle">Personal Protective Equipment — Issuance Tracker</span>
        </div>
        <div class="sync-pill" :class="ppeSyncStatus">
          <span class="sync-dot"></span>
          {{ ppeSyncStatus === 'synced' ? 'Synced' : ppeSyncStatus === 'error' ? 'Offline' : 'Connecting…' }}
        </div>
      </div>

      <!-- Nav Tabs -->
      <div class="ppe-nav">
        <button :class="['nav-tab', { active: view === 'issue' }]" @click="view = 'issue'">
          Issue PPE
        </button>
        <button :class="['nav-tab', { active: view === 'history' }]" @click="view = 'history'">
          History
          <span v-if="sortedPPERecords.length" class="nav-badge">{{ sortedPPERecords.length }}</span>
        </button>
        <button :class="['nav-tab', { active: view === 'allrecords' }]" @click="view = 'allrecords'">
          All Records
          <span v-if="allFlatEntries.length" class="nav-badge">{{ allFlatEntries.length }}</span>
        </button>
        <button :class="['nav-tab', { active: view === 'analysis' }]" @click="view = 'analysis'">
          Analysis
        </button>
      </div>
    </header>

    <!-- ══════════════════════════════════
         VIEW: ISSUE PPE
    ══════════════════════════════════ -->
    <div v-if="view === 'issue'" class="ppe-body">

      <!-- Step 1: Choose PPE type -->
      <section class="ppe-section" v-if="!selectedPPE">
        <div class="section-label">Step 1 — Select PPE Type</div>
        <div class="ppe-grid">
          <button
            v-for="item in ppeItems"
            :key="item.id"
            class="ppe-item-card"
            :style="{ '--item-color': item.color }"
            @click="selectPPE(item)"
          >
            <span class="ppe-item-icon" v-html="getPPEIconSVG(item.id)"></span>
            <span class="ppe-item-name">{{ item.name }}</span>
          </button>

          <!-- Add new PPE type -->
          <button class="ppe-item-card ppe-item-add" @click="showAddModal = true">
            <span class="ppe-item-icon add-icon" v-html="svgPlus"></span>
            <span class="ppe-item-name">Add New</span>
          </button>
        </div>
      </section>

      <!-- Step 2: Enter worker data -->
      <section class="ppe-section entry-section" v-else>
        <div class="entry-header">
          <button class="back-ppe-btn" @click="resetEntry">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Change PPE Type
          </button>
          <div class="selected-ppe-tag" :style="{ '--item-color': selectedPPE.color }">
            <span v-html="getPPEIconSVG(selectedPPE.id)"></span>
            <span>{{ selectedPPE.name }}</span>
          </div>
        </div>

        <div class="section-label">Step 2 — Enter Worker Information</div>

        <div class="table-wrap">
          <table class="entry-table">
            <thead>
              <tr>
                <th style="width:36px">#</th>
                <th>Full Name</th>
                <th style="width:180px">Designation</th>
                <th style="width:90px">QTY</th>
                <th style="width:130px">Date</th>
                <th style="width:110px">Time</th>
                <th>Remarks</th>
                <th style="width:40px"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in entryRows" :key="row.id">
                <td class="row-num">{{ i + 1 }}</td>
                <td>
                  <input
                    type="text"
                    v-model="row.name"
                    placeholder="Worker full name"
                    class="tbl-input"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    v-model="row.designation"
                    placeholder="e.g. Welder, Mason"
                    class="tbl-input"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    v-model.number="row.qty"
                    min="1"
                    placeholder="1"
                    class="tbl-input tbl-input--qty"
                  />
                </td>
                <td>
                  <input type="date" v-model="row.date" class="tbl-input" />
                </td>
                <td>
                  <input type="time" v-model="row.time" class="tbl-input" />
                </td>
                <td>
                  <input
                    type="text"
                    v-model="row.remarks"
                    placeholder="Optional notes"
                    class="tbl-input"
                  />
                </td>
                <td>
                  <button
                    v-if="entryRows.length > 1"
                    class="del-row-btn"
                    @click="removeEntryRow(i)"
                    title="Remove row"
                  >×</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="entry-actions">
          <button class="btn btn-secondary" @click="addEntryRow()">
            + Add Row
          </button>
          <div class="action-right">
            <button class="btn btn-secondary" @click="resetEntry">
              Cancel
            </button>
            <button class="btn btn-primary" @click="handleSave" :disabled="!hasValidEntries">
              Save Distribution Record
            </button>
          </div>
        </div>
      </section>
    </div>

    <!-- ══════════════════════════════════
         VIEW: HISTORY
    ══════════════════════════════════ -->
    <div v-if="view === 'history'" class="ppe-body">

      <div class="history-top">
        <!-- Search -->
        <div class="search-wrap">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.5"/>
            <path d="M10.5 10.5l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search worker name…"
            class="search-input"
            @input="doSearch"
          />
          <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''; searchResults = []">×</button>
        </div>
      </div>

      <!-- Search Results -->
      <div v-if="searchQuery && searchResults.length" class="search-results-block">
        <div class="section-label">Results for "{{ searchQuery }}"</div>
        <div class="search-results-table-wrap">
          <table class="entry-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>PPE Issued</th>
                <th>Designation</th>
                <th style="width:90px; text-align:center">QTY</th>
                <th>Date</th>
                <th>Time</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(res, i) in searchResults"
                :key="i"
                :class="{ 'duplicate-row': isDuplicate(res) }"
              >
                <td>
                  <span class="worker-name">{{ res.name }}</span>
                  <span v-if="isDuplicate(res)" class="dup-badge">Duplicate</span>
                </td>
                <td>
                  <span class="ppe-badge" :style="getPPEColor(res.ppeItemId)">
                    <span v-html="getPPEIconSVG(res.ppeItemId)" class="badge-icon"></span> {{ res.ppeItemName }}
                  </span>
                </td>
                <td>{{ res.designation }}</td>
                <td style="text-align:center"><span class="qty-pill">{{ res.qty || 1 }}</span></td>
                <td>{{ res.date }}</td>
                <td>{{ res.time }}</td>
                <td>{{ res.remarks }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else-if="searchQuery && !searchResults.length" class="no-results">
        No results found for "{{ searchQuery }}"
      </div>

      <!-- All Records -->
      <div class="section-label" style="margin-top: 24px">All Distribution Records</div>

      <div v-if="!sortedPPERecords.length" class="empty-state">
        <div class="empty-icon" v-html="svgClipboard"></div>
        <p>No records yet. Issue PPE to workers to see history here.</p>
      </div>

      <div class="history-list">
        <div
          v-for="record in sortedPPERecords"
          :key="record.id"
          class="history-card"
          :class="{ expanded: expandedRecords.has(record.id) }"
        >
          <div class="hcard-header" @click="toggleRecord(record.id)">
            <div class="hcard-left">
              <span class="hcard-icon" :style="{ background: getPPEBg(record.ppeItemId) }" v-html="getPPEIconSVG(record.ppeItemId)">
              </span>
              <div>
                <div class="hcard-title">{{ record.ppeItemName }}</div>
                <div class="hcard-meta">{{ formatDate(record.savedAt) }} &mdash; {{ record.entries?.length || 0 }} worker(s)</div>
              </div>
            </div>
            <div class="hcard-right">
              <div class="hcard-actions" @click.stop>
                <button class="btn btn-secondary btn-sm btn-icon" @click="printRecord(record)">
                  <span v-html="svgPrinter"></span> Print
                </button>
                <button class="btn btn-danger btn-sm" @click="confirmDelete(record.id)">
                  Delete
                </button>
              </div>
              <span class="hcard-chevron" :class="{ open: expandedRecords.has(record.id) }" v-html="svgChevron"></span>
            </div>
          </div>

          <!-- Worker table — only shown when expanded -->
          <div class="hcard-table-wrap" v-if="expandedRecords.has(record.id) && record.entries?.length">
            <table class="entry-table hcard-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Designation</th>
                  <th style="width:90px; text-align:center">QTY</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(entry, i) in record.entries" :key="i">
                  <td>{{ entry.name }}</td>
                  <td>{{ entry.designation }}</td>
                  <td style="text-align:center"><span class="qty-pill">{{ entry.qty || 1 }}</span></td>
                  <td>{{ entry.date }}</td>
                  <td>{{ entry.time }}</td>
                  <td>{{ entry.remarks }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════
         VIEW: ALL RECORDS
    ══════════════════════════════════ -->
    <div v-if="view === 'allrecords'" class="ppe-body">

      <!-- Toolbar -->
      <div class="ar-toolbar">
        <div class="search-wrap">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.5"/>
            <path d="M10.5 10.5l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <input type="text" v-model="arSearch" placeholder="Search name or designation…" class="search-input" />
          <button v-if="arSearch" class="search-clear" @click="arSearch = ''">×</button>
        </div>

        <div class="ar-filters">
          <select v-model="arFilterPPE" class="ar-select">
            <option value="">All PPE Types</option>
            <option v-for="item in ppeItems" :key="item.id" :value="item.id">{{ item.name }}</option>
          </select>

          <button class="btn btn-secondary btn-sm btn-icon" @click="printAllRecords">
            <span v-html="svgPrinter"></span> Print All
          </button>
        </div>
      </div>

      <!-- Summary strip -->
      <div class="ar-summary">
        <div class="ar-stat">
          <span class="ar-stat-num">{{ filteredFlatEntries.length }}</span>
          <span class="ar-stat-label">Entries Shown</span>
        </div>
        <div class="ar-stat">
          <span class="ar-stat-num">{{ uniqueWorkerCount }}</span>
          <span class="ar-stat-label">Unique Workers</span>
        </div>
        <div class="ar-stat">
          <span class="ar-stat-num">{{ ppeItems.length }}</span>
          <span class="ar-stat-label">PPE Types</span>
        </div>
        <div class="ar-stat" v-if="arFilterPPE">
          <span class="ar-stat-num">{{ filteredFlatEntries.length }}</span>
          <span class="ar-stat-label">Filtered Results</span>
        </div>
      </div>

      <div v-if="!allFlatEntries.length" class="empty-state">
        <div class="empty-icon" v-html="svgClipboard"></div>
        <p>No records yet. Issue PPE to workers to see them here.</p>
      </div>

      <div v-else-if="!filteredFlatEntries.length" class="empty-state">
        <div class="empty-icon" v-html="svgClipboard"></div>
        <p>No entries match your search or filter.</p>
      </div>

      <div v-else class="table-wrap ar-table-wrap">
        <table class="entry-table">
          <thead>
            <tr>
              <th style="width:36px">#</th>

              <!-- Full Name -->
              <th class="th-sortable" :class="{ 'th-active': arSortField === 'name' }" @click.stop="toggleDropdown('name')">
                <div class="th-inner">
                  Full Name
                  <span class="sort-indicator" v-html="getSortArrow('name')"></span>
                </div>
                <div class="sort-dropdown" v-if="activeDropdown === 'name'" @click.stop>
                  <div class="sort-dd-item" :class="{ active: arSortField==='name' && arSortDir==='asc' }"  @click="applySort('name','asc')">
                    <span class="dd-icon">↑</span> A → Z
                  </div>
                  <div class="sort-dd-item" :class="{ active: arSortField==='name' && arSortDir==='desc' }" @click="applySort('name','desc')">
                    <span class="dd-icon">↓</span> Z → A
                  </div>
                </div>
              </th>

              <!-- Designation -->
              <th class="th-sortable" :class="{ 'th-active': arSortField === 'designation' }" @click.stop="toggleDropdown('designation')">
                <div class="th-inner">
                  Designation
                  <span class="sort-indicator" v-html="getSortArrow('designation')"></span>
                </div>
                <div class="sort-dropdown" v-if="activeDropdown === 'designation'" @click.stop>
                  <div class="sort-dd-item" :class="{ active: arSortField==='designation' && arSortDir==='asc' }"  @click="applySort('designation','asc')">
                    <span class="dd-icon">↑</span> A → Z
                  </div>
                  <div class="sort-dd-item" :class="{ active: arSortField==='designation' && arSortDir==='desc' }" @click="applySort('designation','desc')">
                    <span class="dd-icon">↓</span> Z → A
                  </div>
                </div>
              </th>

              <!-- PPE Issued -->
              <th class="th-sortable" :class="{ 'th-active': arSortField === 'ppe' }" @click.stop="toggleDropdown('ppe')">
                <div class="th-inner">
                  PPE Issued
                  <span class="sort-indicator" v-html="getSortArrow('ppe')"></span>
                </div>
                <div class="sort-dropdown" v-if="activeDropdown === 'ppe'" @click.stop>
                  <div class="sort-dd-item" :class="{ active: arSortField==='ppe' && arSortDir==='asc' }"  @click="applySort('ppe','asc')">
                    <span class="dd-icon">↑</span> A → Z
                  </div>
                  <div class="sort-dd-item" :class="{ active: arSortField==='ppe' && arSortDir==='desc' }" @click="applySort('ppe','desc')">
                    <span class="dd-icon">↓</span> Z → A
                  </div>
                </div>
              </th>

              <!-- QTY -->
              <th class="th-sortable" style="width:90px; text-align:center" :class="{ 'th-active': arSortField === 'qty' }" @click.stop="toggleDropdown('qty')">
                <div class="th-inner" style="justify-content:center">
                  QTY
                  <span class="sort-indicator" v-html="getSortArrow('qty')"></span>
                </div>
                <div class="sort-dropdown" v-if="activeDropdown === 'qty'" @click.stop>
                  <div class="sort-dd-item" :class="{ active: arSortField==='qty' && arSortDir==='desc' }" @click="applySort('qty','desc')">
                    <span class="dd-icon">↓</span> High → Low
                  </div>
                  <div class="sort-dd-item" :class="{ active: arSortField==='qty' && arSortDir==='asc' }"  @click="applySort('qty','asc')">
                    <span class="dd-icon">↑</span> Low → High
                  </div>
                </div>
              </th>

              <!-- Date -->
              <th class="th-sortable" style="width:130px" :class="{ 'th-active': arSortField === 'date' }" @click.stop="toggleDropdown('date')">
                <div class="th-inner">
                  Date
                  <span class="sort-indicator" v-html="getSortArrow('date')"></span>
                </div>
                <div class="sort-dropdown" v-if="activeDropdown === 'date'" @click.stop>
                  <div class="sort-dd-item" :class="{ active: arSortField==='date' && arSortDir==='desc' }" @click="applySort('date','desc')">
                    <span class="dd-icon">🕐</span> Newest First
                  </div>
                  <div class="sort-dd-item" :class="{ active: arSortField==='date' && arSortDir==='asc' }"  @click="applySort('date','asc')">
                    <span class="dd-icon">🕐</span> Oldest First
                  </div>
                </div>
              </th>

              <th style="width:90px">Time</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(entry, i) in filteredFlatEntries"
              :key="i"
              :class="{ 'multi-ppe-row': entry.ppeCount > 1 }"
            >
              <td class="row-num">{{ i + 1 }}</td>
              <td>
                <div class="worker-cell">
                  <span class="worker-name-main">{{ entry.name }}</span>
                  <span v-if="entry.ppeCount > 1" class="multi-badge">{{ entry.ppeCount }} PPE</span>
                </div>
              </td>
              <td class="muted-cell">{{ entry.designation }}</td>
              <td>
                <span class="ppe-badge" :style="getPPEColor(entry.ppeItemId)">
                  <span v-html="getPPEIconSVG(entry.ppeItemId)" class="badge-icon"></span>
                  {{ entry.ppeItemName }}
                </span>
              </td>
              <td style="text-align:center"><span class="qty-pill">{{ entry.qty || 1 }}</span></td>
              <td class="muted-cell mono">{{ entry.date }}</td>
              <td class="muted-cell mono">{{ entry.time }}</td>
              <td class="muted-cell">{{ entry.remarks }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ══════════════════════════════════
         VIEW: ANALYSIS
    ══════════════════════════════════ -->
    <div v-if="view === 'analysis'" class="ppe-body">

      <div class="section-label" style="margin-bottom:20px">Overview</div>

      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon kpi-icon--blue" v-html="svgPeopleIcon"></div>
          <div class="kpi-num">{{ totalWorkers }}</div>
          <div class="kpi-label">Total Issuances</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon kpi-icon--green" v-html="svgWorkerIcon"></div>
          <div class="kpi-num">{{ uniqueNames }}</div>
          <div class="kpi-label">Unique Workers</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon kpi-icon--tan" v-html="svgBoxIcon"></div>
          <div class="kpi-num">{{ totalQtyIssued }}</div>
          <div class="kpi-label">Total Items Issued</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon kpi-icon--tan" v-html="svgBoxIcon"></div>
          <div class="kpi-num">{{ ppeItems.length }}</div>
          <div class="kpi-label">PPE Types</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon kpi-icon--orange" v-html="svgRecordIcon"></div>
          <div class="kpi-num">{{ sortedPPERecords.length }}</div>
          <div class="kpi-label">Distribution Records</div>
        </div>
      </div>

      <!-- Per-PPE breakdown -->
      <div class="section-label" style="margin-top:32px; margin-bottom:16px">Distribution by PPE Type</div>
      <div class="analysis-cards">
        <div
          v-for="item in ppeItems"
          :key="item.id"
          class="analysis-card"
          :style="{ '--ac-color': item.color }"
        >
          <div class="ac-header">
            <div class="ac-icon" :style="{ background: item.color + '20', color: item.color }" v-html="getPPEIconSVG(item.id)"></div>
            <div class="ac-title">{{ item.name }}</div>
          </div>
          <div class="ac-body">
            <div class="ac-stat-row">
              <span class="ac-stat-label">Records</span>
              <span class="ac-stat-val">{{ ppeRecordCount(item.id) }}</span>
            </div>
            <div class="ac-stat-row">
              <span class="ac-stat-label">Workers Issued</span>
              <span class="ac-stat-val ac-stat-big">{{ ppeWorkerCount(item.id) }}</span>
            </div>
            <div class="ac-stat-row">
              <span class="ac-stat-label">Total QTY Issued</span>
              <span class="ac-stat-val ac-stat-big" style="color: var(--ac-color)">{{ ppeTotalQty(item.id) }}</span>
            </div>
            <!-- Bar fill -->
            <div class="ac-bar-track">
              <div
                class="ac-bar-fill"
                :style="{ width: ppeBarWidth(item.id) + '%', background: item.color }"
              ></div>
            </div>
            <div class="ac-pct">{{ ppeBarWidth(item.id) }}% of all issuances</div>
          </div>
          <!-- Recent workers -->
          <div class="ac-recent" v-if="ppeRecentWorkers(item.id).length">
            <div class="ac-recent-label">Recent</div>
            <div v-for="(w,i) in ppeRecentWorkers(item.id)" :key="i" class="ac-worker-chip">
              {{ w.name }}<span v-if="w.designation" class="chip-desig"> — {{ w.designation }}</span>
            </div>
          </div>
        </div>

        <div v-if="!ppeItems.length" class="empty-state">
          <div class="empty-icon" v-html="svgClipboard"></div>
          <p>No PPE types configured yet.</p>
        </div>
      </div>

      <!-- Top Workers Table -->
      <div class="section-label" style="margin-top:36px; margin-bottom:16px">Workers with Most Issuances</div>
      <div class="table-wrap" v-if="topWorkers.length">
        <table class="entry-table">
          <thead>
            <tr>
              <th style="width:36px">#</th>
              <th>Full Name</th>
              <th>Designation</th>
              <th>PPE Items Received</th>
              <th style="width:80px; text-align:center">Count</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(w, i) in topWorkers" :key="i">
              <td class="row-num">{{ i + 1 }}</td>
              <td><strong>{{ w.name }}</strong></td>
              <td class="muted-cell">{{ w.designation }}</td>
              <td>
                <div class="ppe-chips-row">
                  <span
                    v-for="(p, j) in w.ppeList"
                    :key="j"
                    class="ppe-badge"
                    :style="getPPEColor(p.ppeItemId)"
                  >
                    <span v-html="getPPEIconSVG(p.ppeItemId)" class="badge-icon"></span>
                    {{ p.ppeItemName }}
                  </span>
                </div>
              </td>
              <td style="text-align:center">
                <span class="count-pill" :class="{ 'count-multi': w.count > 1 }">{{ w.count }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-state">
        <div class="empty-icon" v-html="svgClipboard"></div>
        <p>No issuance data yet.</p>
      </div>
    </div>

    <!-- ══════════════════════════════════
         MODALS
    ══════════════════════════════════ -->

    <!-- Add PPE Item Modal -->
    <div class="modal-overlay" v-if="showAddModal" @click.self="showAddModal = false">
      <div class="modal">
        <h2>Add New PPE Type</h2>
        <div class="form-group">
          <label class="bf">Equipment Name</label>
          <input type="text" v-model="newItem.name" placeholder="e.g. Face Shield" class="modal-input" />
        </div>
        <div class="form-group">
          <label class="bf">Icon (choose below)</label>
          <div class="icon-picker">
            <button
              v-for="opt in iconOptions"
              :key="opt.id"
              :class="['icon-opt', { active: newItem.iconId === opt.id }]"
              @click="newItem.iconId = opt.id"
              :title="opt.label"
              v-html="opt.svg"
            ></button>
          </div>
        </div>
        <div class="form-group">
          <label class="bf">Color</label>
          <input type="color" v-model="newItem.color" class="color-pick" />
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showAddModal = false">Cancel</button>
          <button class="btn btn-primary" @click="handleAddItem" :disabled="!newItem.name.trim()">Add PPE Type</button>
        </div>
      </div>
    </div>

    <!-- Delete confirm -->
    <div class="modal-overlay" v-if="deleteTargetId" @click.self="deleteTargetId = null">
      <div class="modal" style="max-width: 400px">
        <h2>Delete Record?</h2>
        <p style="color:#555; margin-bottom:24px; font-size:14px">This action cannot be undone.</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="deleteTargetId = null">Cancel</button>
          <button class="btn btn-danger" @click="handleDelete">Delete</button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <Transition name="toast-fade">
      <div class="toast" v-if="toastMsg">{{ toastMsg }}</div>
    </Transition>

    <!-- Print area (hidden) -->
    <div id="ppe-print-area" style="display:none"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { usePPE } from '../composables/usePPE.js'

defineEmits(['back'])

const {
  ppeItems,
  sortedPPERecords,
  ppeSyncStatus,
  addPPEItem,
  removePPEItem,
  savePPEDistribution,
  deletePPEDistribution,
  searchWorker,
} = usePPE()

// ── View state ──
const view = ref('issue')
const selectedPPE = ref(null)

// ── Entry rows ──
let _uid = 0
function makeEntry() {
  const now = new Date()
  return {
    id: ++_uid,
    name: '',
    designation: '',
    qty: 1,
    date: now.toISOString().slice(0, 10),
    time: now.toTimeString().slice(0, 5),
    remarks: ''
  }
}
const entryRows = ref([makeEntry()])

const hasValidEntries = computed(() =>
  entryRows.value.some(r => r.name.trim())
)

function selectPPE(item) {
  selectedPPE.value = item
  entryRows.value = [makeEntry()]
}

function resetEntry() {
  selectedPPE.value = null
  entryRows.value = [makeEntry()]
}

function addEntryRow() {
  entryRows.value.push(makeEntry())
}

function removeEntryRow(i) {
  entryRows.value.splice(i, 1)
}

// ── SVG Icon Library ──
const svgChevron = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`

// ── Expand/collapse history records ──
const expandedRecords = ref(new Set())
function toggleRecord(id) {
  const s = new Set(expandedRecords.value)
  s.has(id) ? s.delete(id) : s.add(id)
  expandedRecords.value = s
}

const svgPlus = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`
const svgClipboard = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>`
const svgPrinter = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`

const iconOptions = [
  {
    // Hard Hat: dome shell + brim + headband stripe
    id: 'helmet', label: 'Hard Hat',
    svg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 14 Q4 6 12 5 Q20 6 20 14"/>
      <path d="M2 14 Q2 16 4 16 L20 16 Q22 16 22 14"/>
      <line x1="6" y1="12" x2="18" y2="12"/>
    </svg>`
  },
  {
    // Face Shield: rectangular visor hanging from a headband
    id: 'shield', label: 'Face Shield',
    svg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 4 Q12 2 19 4"/>
      <line x1="5" y1="4" x2="5" y2="6"/>
      <line x1="19" y1="4" x2="19" y2="6"/>
      <rect x="5" y="6" width="14" height="11" rx="2"/>
      <line x1="8" y1="10" x2="16" y2="10"/>
      <line x1="8" y1="13" x2="16" y2="13"/>
    </svg>`
  },
  {
    // Safety Goggles: two oval lenses + bridge + strap on each side
    id: 'eye', label: 'Safety Goggles',
    svg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <ellipse cx="8" cy="12" rx="4" ry="3"/>
      <ellipse cx="16" cy="12" rx="4" ry="3"/>
      <line x1="12" y1="12" x2="12" y2="12" stroke-width="2"/>
      <line x1="1" y1="12" x2="4" y2="12"/>
      <line x1="20" y1="12" x2="23" y2="12"/>
    </svg>`
  },
  {
    // Safety Vest: V-neck vest body with two horizontal reflective stripes
    id: 'vest', label: 'Safety Vest',
    svg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 3 L8 3 L12 8 L16 3 L20 3 L20 21 L4 21 Z"/>
      <line x1="4" y1="11" x2="20" y2="11"/>
      <line x1="4" y1="15" x2="20" y2="15"/>
    </svg>`
  },
  {
    // Gloves: mitten-shaped hand with thumb + cuff band
    id: 'gloves', label: 'Gloves',
    svg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M7 18 L7 9 Q7 7 9 7 Q11 7 11 9 L11 13 Q13 11 15 12 Q17 13 15 15 L13 17 Q13 19 11 20 L9 20 Q7 20 7 18 Z"/>
      <line x1="7" y1="16" x2="4" y2="16" stroke-width="1.8"/>
      <path d="M4 13 Q3 13 3 16 Q3 19 7 19"/>
    </svg>`
  },
  {
    // Safety Boots: side-profile boot — toe box, ankle, heel, sole
    id: 'boot', label: 'Safety Boots',
    svg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8 4 L8 14 Q8 16 10 16 L18 16 Q20 16 20 18 L4 18 L4 16 Q4 14 6 14 L6 4 Z"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="20" x2="21" y2="20"/>
    </svg>`
  },
  {
    // Welding Mask: rectangular flip-down helmet with dark lens window
    id: 'mask', label: 'Welding Mask',
    svg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 3 Q12 1 19 3 L19 10 Q19 14 12 16 Q5 14 5 10 Z"/>
      <rect x="8" y="7" width="8" height="5" rx="1"/>
      <line x1="8" y1="5" x2="16" y2="5"/>
    </svg>`
  },
  {
    // Harness: chest X-straps + waist belt + shoulder loops
    id: 'harness', label: 'Harness',
    svg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8 3 L8 8 L12 12 L16 8 L16 3"/>
      <path d="M8 3 Q6 3 6 5 L6 10"/>
      <path d="M16 3 Q18 3 18 5 L18 10"/>
      <line x1="6" y1="14" x2="18" y2="14"/>
      <path d="M6 10 Q6 14 12 14 Q18 14 18 10"/>
      <line x1="12" y1="12" x2="12" y2="21"/>
      <line x1="9" y1="21" x2="15" y2="21"/>
    </svg>`
  },
  {
    // Ear Protection: headband arc + two circular ear cups
    id: 'earmuff', label: 'Ear Protection',
    svg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 12 Q6 4 12 4 Q18 4 18 12"/>
      <circle cx="5" cy="14" r="3"/>
      <circle cx="19" cy="14" r="3"/>
    </svg>`
  },
  {
    // Coverall: full-body jumpsuit — collar, sleeves, legs, zipper line
    id: 'coverall', label: 'Coverall',
    svg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 2 L7 5 L3 7 L3 14 L7 14 L7 22 L17 22 L17 14 L21 14 L21 7 L17 5 L15 2 Z"/>
      <line x1="9" y1="2" x2="15" y2="2"/>
      <line x1="12" y1="2" x2="12" y2="10"/>
    </svg>`
  },
]

const ppeIconMap = Object.fromEntries(iconOptions.map(o => [o.id, o.svg]))

function getPPEIconSVG(ppeItemId) {
  const item = ppeItems.value.find(i => i.id === ppeItemId)
  if (!item) return iconOptions[0].svg
  // Support both old emoji-based and new iconId-based
  return ppeIconMap[item.iconId] || iconOptions[0].svg
}

// ── Add PPE item modal ──
const showAddModal = ref(false)
const newItem = ref({ name: '', iconId: 'shield', color: '#8a6a4a' })

async function handleAddItem() {
  await addPPEItem({ ...newItem.value, icon: newItem.value.iconId })
  newItem.value = { name: '', iconId: 'shield', color: '#8a6a4a' }
  showAddModal.value = false
  showToast('PPE type added')
}

// ── Save distribution ──
async function handleSave() {
  try {
    const valid = entryRows.value.filter(r => r.name.trim())
    if (!valid.length) return
    savePPEDistribution({
      ppeItemId: selectedPPE.value.id,
      entries: valid
    })
    selectedPPE.value = null
    entryRows.value = [makeEntry()]
    view.value = 'history'
    showToast('Distribution record saved')
  } catch (err) {
    console.error('Save failed:', err)
    showToast('Save failed — please try again')
  }
}

// ── Delete ──
const deleteTargetId = ref(null)
function confirmDelete(id) { deleteTargetId.value = id }
async function handleDelete() {
  await deletePPEDistribution(deleteTargetId.value)
  deleteTargetId.value = null
  showToast('Record deleted')
}

// ── Search ──
const searchQuery  = ref('')
const searchResults = ref([])

function doSearch() {
  if (!searchQuery.value.trim()) { searchResults.value = []; return }
  searchResults.value = searchWorker(searchQuery.value)
}

function isDuplicate(entry) {
  // Flag if the same worker name appears more than once in results
  return searchResults.value.filter(r =>
    r.name.toLowerCase() === entry.name.toLowerCase()
  ).length > 1
}

// ══════════════════════════════════════
// ALL RECORDS view
// ══════════════════════════════════════

// Flatten all entries from all records into one array with metadata
const allFlatEntries = computed(() => {
  const out = []
  // Build a per-worker PPE count map first
  const workerPPECount = {}
  for (const rec of sortedPPERecords.value) {
    for (const entry of (rec.entries || [])) {
      const key = (entry.name || '').trim().toLowerCase()
      if (!key) continue
      workerPPECount[key] = (workerPPECount[key] || 0) + 1
    }
  }
  for (const rec of sortedPPERecords.value) {
    for (const entry of (rec.entries || [])) {
      if (!entry.name?.trim()) continue
      const key = entry.name.trim().toLowerCase()
      out.push({
        ...entry,
        ppeItemId: rec.ppeItemId,
        ppeItemName: rec.ppeItemName,
        savedAt: rec.savedAt,
        recordId: rec.id,
        ppeCount: workerPPECount[key] || 1
      })
    }
  }
  return out
})

const arSearch    = ref('')
const arSortField = ref('date')
const arSortDir   = ref('desc')
const arFilterPPE = ref('')
const activeDropdown = ref(null)

function toggleDropdown(field) {
  activeDropdown.value = activeDropdown.value === field ? null : field
}

function applySort(field, dir) {
  arSortField.value = field
  arSortDir.value   = dir
  activeDropdown.value = null
}

// Close dropdown when clicking outside the table header
function onDocClick() {
  activeDropdown.value = null
}

onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))

const svgSortAsc  = `<svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M5 2l4 6H1z"/></svg>`
const svgSortDesc = `<svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M5 8L1 2h8z"/></svg>`
const svgSortNone = `<svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" opacity="0.3"><path d="M5 2l3 4H2z M5 8L2 4h6z"/></svg>`

function getSortArrow(field) {
  if (arSortField.value !== field) return svgSortNone
  return arSortDir.value === 'asc' ? svgSortAsc : svgSortDesc
}

const filteredFlatEntries = computed(() => {
  let list = [...allFlatEntries.value]

  // Filter by PPE type
  if (arFilterPPE.value) {
    list = list.filter(e => e.ppeItemId === arFilterPPE.value)
  }

  // Filter by search
  const q = arSearch.value.trim().toLowerCase()
  if (q) {
    list = list.filter(e =>
      (e.name || '').toLowerCase().includes(q) ||
      (e.designation || '').toLowerCase().includes(q) ||
      (e.ppeItemName || '').toLowerCase().includes(q)
    )
  }

  // Sort by column header
  const dir = arSortDir.value === 'asc' ? 1 : -1
  switch (arSortField.value) {
    case 'date':
      list.sort((a, b) => dir * (new Date(a.savedAt || 0) - new Date(b.savedAt || 0)))
      break
    case 'name':
      list.sort((a, b) => dir * (a.name || '').localeCompare(b.name || ''))
      break
    case 'ppe':
      list.sort((a, b) => dir * (a.ppeItemName || '').localeCompare(b.ppeItemName || ''))
      break
    case 'designation':
      list.sort((a, b) => dir * (a.designation || '').localeCompare(b.designation || ''))
      break
    case 'qty':
      list.sort((a, b) => dir * ((Number(a.qty) || 1) - (Number(b.qty) || 1)))
      break
  }
  return list
})

const uniqueWorkerCount = computed(() => {
  const s = new Set(allFlatEntries.value.map(e => (e.name || '').trim().toLowerCase()).filter(Boolean))
  return s.size
})

function printAllRecords() {
  const rows = filteredFlatEntries.value.map((e, i) => [
    '<tr>',
    '<td>' + (i + 1) + '</td>',
    '<td>' + (e.name || '') + '</td>',
    '<td>' + (e.designation || '') + '</td>',
    '<td>' + (e.ppeItemName || '') + '</td>',
    '<td style="text-align:center">' + (Number(e.qty) || 1) + '</td>',
    '<td>' + (e.date || '') + '</td>',
    '<td>' + (e.time || '') + '</td>',
    '<td>' + (e.remarks || '') + '</td>',
    '</tr>'
  ].join('')).join('')

  const count = filteredFlatEntries.value.length
  const printed = new Date().toLocaleString('en-PH')

  const html = '<!DOCTYPE html><html><head><title>All PPE Records</title>'
    + '<style>'
    + 'body{font-family:Arial,sans-serif;padding:32px;color:#111}'
    + 'h1{font-size:18px;margin-bottom:4px}'
    + '.meta{font-size:11px;color:#888;margin-bottom:20px}'
    + 'table{width:100%;border-collapse:collapse;font-size:12px}'
    + 'th{background:#f5f0e8;text-align:left;padding:7px 9px;border:1px solid #ddd;font-size:10px;text-transform:uppercase;letter-spacing:.8px}'
    + 'td{padding:7px 9px;border:1px solid #ddd}'
    + 'tr:nth-child(even) td{background:#faf7f2}'
    + '.footer{margin-top:28px;font-size:10px;color:#aaa;text-align:center}'
    + '@media print{body{padding:0}}'
    + '</style></head><body>'
    + '<h1>CSU — PPE All Records</h1>'
    + '<div class="meta">Printed: ' + printed + ' &nbsp;|&nbsp; ' + count + ' entries</div>'
    + '<table><thead><tr><th>#</th><th>Full Name</th><th>Designation</th><th>PPE Issued</th><th>QTY</th><th>Date</th><th>Time</th><th>Remarks</th></tr></thead>'
    + '<tbody>' + rows + '</tbody></table>'
    + '<div class="footer">Civil Service Unit — PPE Distribution System</div>'
    + '</body></html>'

  const win = window.open('', '_blank', 'width=1000,height=700')
  win.document.write(html)
  win.document.close()
  setTimeout(() => win.print(), 400)
}

// ══════════════════════════════════════
// ANALYSIS view
// ══════════════════════════════════════

const totalWorkers = computed(() => allFlatEntries.value.length)

const uniqueNames = computed(() => {
  const s = new Set(allFlatEntries.value.map(e => (e.name || '').trim().toLowerCase()).filter(Boolean))
  return s.size
})

function ppeRecordCount(ppeItemId) {
  return sortedPPERecords.value.filter(r => r.ppeItemId === ppeItemId).length
}

function ppeWorkerCount(ppeItemId) {
  let count = 0
  for (const rec of sortedPPERecords.value) {
    if (rec.ppeItemId === ppeItemId) count += (rec.entries || []).filter(e => e.name?.trim()).length
  }
  return count
}

function ppeBarWidth(ppeItemId) {
  const total = totalWorkers.value
  if (!total) return 0
  return Math.round((ppeWorkerCount(ppeItemId) / total) * 100)
}

// Sum of all qty values across all entries
const totalQtyIssued = computed(() => {
  let sum = 0
  for (const rec of sortedPPERecords.value) {
    for (const e of (rec.entries || [])) {
      sum += Number(e.qty) || 1
    }
  }
  return sum
})

// Total qty issued for a specific PPE type
function ppeTotalQty(ppeItemId) {
  let sum = 0
  for (const rec of sortedPPERecords.value) {
    if (rec.ppeItemId !== ppeItemId) continue
    for (const e of (rec.entries || [])) {
      sum += Number(e.qty) || 1
    }
  }
  return sum
}

function ppeRecentWorkers(ppeItemId) {
  const entries = []
  for (const rec of sortedPPERecords.value) {
    if (rec.ppeItemId !== ppeItemId) continue
    for (const e of (rec.entries || [])) {
      if (e.name?.trim()) entries.push(e)
    }
  }
  // Already sorted newest first from sortedPPERecords
  return entries.slice(0, 3)
}

// Top workers — sorted by how many PPE items they have received
const topWorkers = computed(() => {
  const map = {}
  for (const rec of sortedPPERecords.value) {
    for (const entry of (rec.entries || [])) {
      const key = (entry.name || '').trim()
      if (!key) continue
      if (!map[key]) map[key] = { name: key, designation: entry.designation || '', count: 0, ppeList: [] }
      map[key].count++
      const already = map[key].ppeList.find(p => p.ppeItemId === rec.ppeItemId)
      if (!already) map[key].ppeList.push({ ppeItemId: rec.ppeItemId, ppeItemName: rec.ppeItemName })
    }
  }
  return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 20)
})

// Extra SVG icons for KPI cards
const svgPeopleIcon = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
const svgWorkerIcon = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
const svgBoxIcon = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`
const svgRecordIcon = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`

// ── Helpers ──
function getPPEItem(id) { return ppeItems.value.find(i => i.id === id) }
function getPPEIcon(id)  { return getPPEItem(id)?.icon || 'shield' }
function getPPEColor(id) {
  const c = getPPEItem(id)?.color || '#8a6a4a'
  return { background: c + '18', color: c, border: `1px solid ${c}40` }
}
function getPPEBg(id) {
  const c = getPPEItem(id)?.color || '#8a6a4a'
  return c + '20'
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

// ── Print ──
function printRecord(record) {
  const item = getPPEItem(record.ppeItemId)
  const rows = (record.entries || []).map((e, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${e.name || ''}</td>
      <td>${e.designation || ''}</td>
      <td style="text-align:center">${Number(e.qty) || 1}</td>
      <td>${e.date || ''}</td>
      <td>${e.time || ''}</td>
      <td>${e.remarks || ''}</td>
    </tr>
  `).join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>PPE Distribution Record</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 32px; color: #111; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        .meta { font-size: 12px; color: #666; margin-bottom: 24px; }
        .ppe-badge { display: inline-block; padding: 4px 14px; border-radius: 20px;
          background: ${item?.color || '#8a6a4a'}20; color: ${item?.color || '#8a6a4a'};
          font-weight: 700; font-size: 13px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { background: #f5f0e8; text-align: left; padding: 8px 10px;
          border: 1px solid #ddd; font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; }
        td { padding: 8px 10px; border: 1px solid #ddd; }
        tr:nth-child(even) td { background: #faf7f2; }
        .footer { margin-top: 32px; font-size: 11px; color: #888; text-align: center; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <h1>CSU — PPE Distribution Record</h1>
      <div class="meta">Printed: ${new Date().toLocaleString('en-PH')}</div>
      <div class="ppe-badge">${record.ppeItemName}</div>
      <table>
        <thead>
          <tr><th>#</th><th>Full Name</th><th>Designation</th><th>QTY</th><th>Date</th><th>Time</th><th>Remarks</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="footer">Civil Service Unit — PPE Distribution System</div>
    </body>
    </html>
  `

  const win = window.open('', '_blank', 'width=900,height=700')
  win.document.write(html)
  win.document.close()
  setTimeout(() => win.print(), 400)
}

// ── Toast ──
const toastMsg = ref('')
let toastTimer = null
function showToast(msg) {
  toastMsg.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastMsg.value = ''), 2600)
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Nunito:wght@300;400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');

* { box-sizing: border-box; }

.ppe-app {
  min-height: 100vh;
  background: #f5ede0;
  font-family: 'Nunito', sans-serif;
  color: #000;
}

/* ── Header ── */
.ppe-header {
  background: #ffffff;
  border-bottom: 1.5px solid #ddd0bc;
  padding: 0;
  position: sticky;
  top: 0;
  z-index: 50;
  box-shadow: 0 2px 16px rgba(138,106,74,0.08);
}

.ppe-header-inner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 48px 16px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: 1.5px solid #ddd0bc;
  border-radius: 20px;
  padding: 6px 14px;
  font-family: 'Nunito', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #8a6a4a;
  cursor: pointer;
  letter-spacing: 0.5px;
  transition: all 0.2s;
  flex-shrink: 0;
}
.back-btn:hover { background: #f5ede0; border-color: #8a6a4a; }

.ppe-title-block {
  flex: 1;
}
.ppe-title-block h1 {
  font-family: 'Cormorant Garamond', serif;
  font-size: 26px;
  font-weight: 700;
  color: #1a1008;
  line-height: 1.1;
}
.ppe-subtitle {
  font-size: 10px;
  color: #8a6a4a;
  font-weight: 700;
  letter-spacing: 1.8px;
  text-transform: uppercase;
}

.sync-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  padding: 5px 12px;
  border-radius: 20px;
  background: #f5f0e8;
  color: #8a6a4a;
  flex-shrink: 0;
}
.sync-pill.synced { background: #eaf3de; color: #3a7a32; }
.sync-pill.error  { background: #fdeaea; color: #b83232; }

.sync-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 1.8s infinite;
}
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

/* ── Nav Tabs ── */
.ppe-nav {
  display: flex;
  gap: 0;
  padding: 0 48px;
  border-top: 1px solid #eee8dc;
}
.nav-tab {
  padding: 13px 24px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  font-family: 'Nunito', sans-serif;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: #a08060;
  cursor: pointer;
  transition: all 0.18s;
  display: flex;
  align-items: center;
  gap: 8px;
}
.nav-tab:hover { color: #5a3a1a; }
.nav-tab.active { color: #8a6a4a; border-bottom-color: #8a6a4a; }

.nav-badge {
  background: #8a6a4a;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  padding: 1px 7px;
  border-radius: 20px;
}

/* ── Body ── */
.ppe-body {
  width: 100%;
  padding: 40px 48px;
}

.ppe-section { margin-bottom: 32px; }

.section-label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #a08060;
  margin-bottom: 16px;
}

/* ── PPE Grid ── */
.ppe-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
}

.ppe-item-card {
  background: #ffffff;
  border: 1.5px solid #ddd0bc;
  border-radius: 16px;
  padding: 28px 20px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  font-family: 'Nunito', sans-serif;
  transition: all 0.22s;
  position: relative;
  overflow: hidden;
}
.ppe-item-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--item-color, #8a6a4a);
  opacity: 0;
  transition: opacity 0.2s;
  border-radius: 14px;
}
.ppe-item-card:hover {
  transform: translateY(-4px);
  border-color: var(--item-color, #8a6a4a);
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}
.ppe-item-card:hover::before { opacity: 0.06; }

.ppe-item-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--item-color, #8a6a4a);
  position: relative;
}
.ppe-item-icon svg { width: 38px; height: 38px; }
.ppe-item-name {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #3a2a1a;
  text-align: center;
  position: relative;
}

.ppe-item-add { border-style: dashed; }

/* ══════════════════════════
   ALL RECORDS VIEW
══════════════════════════ */
.ar-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}
.ar-filters {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-left: auto;
}
.ar-select {
  padding: 7px 12px;
  border: 1.5px solid #ddd0bc;
  border-radius: 20px;
  font-family: 'Nunito', sans-serif;
  font-size: 12px;
  font-weight: 600;
  background: #fff;
  color: #3a2a1a;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;
}
.ar-select:focus { border-color: #8a6a4a; }

.ar-summary {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.ar-stat {
  background: #fff;
  border: 1.5px solid #ddd0bc;
  border-radius: 12px;
  padding: 12px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 100px;
}
.ar-stat-num {
  font-family: 'Cormorant Garamond', serif;
  font-size: 32px;
  font-weight: 700;
  color: #8a6a4a;
  line-height: 1;
}
.ar-stat-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #a08060;
  margin-top: 4px;
}

.ar-table-wrap { margin-top: 0; }

.worker-cell { display: flex; align-items: center; gap: 8px; }
.worker-name-main { font-weight: 700; }
.multi-badge {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  background: #8a6a4a;
  color: #fff;
  padding: 2px 8px;
  border-radius: 10px;
}
.multi-ppe-row td { background: #fdf9f4 !important; }
.muted-cell { color: #6b5540; }
.mono { font-family: 'DM Mono', monospace; font-size: 12px; }

/* ══════════════════════════
   ANALYSIS VIEW
══════════════════════════ */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 0;
}
.kpi-card {
  background: #fff;
  border: 1.5px solid #ddd0bc;
  border-radius: 16px;
  padding: 26px 24px 22px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}
.kpi-icon {
  width: 46px; height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.kpi-icon--blue  { background: #e8f0fa; color: #2a60a0; }
.kpi-icon--green { background: #eaf3de; color: #3a7a32; }
.kpi-icon--tan   { background: #f5ede0; color: #8a6a4a; }
.kpi-icon--orange{ background: #fdf0e0; color: #c07020; }
.kpi-num {
  font-family: 'Cormorant Garamond', serif;
  font-size: 42px;
  font-weight: 700;
  color: #1a1008;
  line-height: 1;
}
.kpi-label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #a08060;
}

.analysis-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
  gap: 18px;
}
.analysis-card {
  background: #fff;
  border: 1.5px solid #ddd0bc;
  border-radius: 16px;
  overflow: hidden;
  transition: box-shadow 0.2s;
}
.analysis-card:hover { box-shadow: 0 6px 20px rgba(138,106,74,0.12); }

.ac-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px 12px;
  border-bottom: 1px solid #f0e8dc;
}
.ac-icon {
  width: 42px; height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.ac-icon svg { width: 20px; height: 20px; }
.ac-title {
  font-size: 15px;
  font-weight: 700;
  color: #1a1008;
}

.ac-body { padding: 14px 18px; }
.ac-stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.ac-stat-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: #a08060;
}
.ac-stat-val {
  font-size: 14px;
  font-weight: 700;
  color: #1a1008;
  font-family: 'DM Mono', monospace;
}
.ac-stat-big {
  font-size: 22px;
  font-family: 'Cormorant Garamond', serif;
}
.ac-bar-track {
  width: 100%;
  height: 6px;
  background: #f0e8dc;
  border-radius: 10px;
  margin: 10px 0 4px;
  overflow: hidden;
}
.ac-bar-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.4s ease;
}
.ac-pct {
  font-size: 10px;
  font-weight: 700;
  color: #b09070;
  letter-spacing: 0.5px;
}

.ac-recent {
  border-top: 1px solid #f0e8dc;
  padding: 10px 18px 14px;
}
.ac-recent-label {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #c8b49a;
  margin-bottom: 6px;
}
.ac-worker-chip {
  font-size: 12px;
  font-weight: 600;
  color: #3a2a1a;
  padding: 2px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.chip-desig { color: #a08060; font-weight: 400; }

.ppe-chips-row { display: flex; flex-wrap: wrap; gap: 4px; }
.count-pill {
  display: inline-block;
  font-family: 'DM Mono', monospace;
  font-size: 13px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 20px;
  background: #f0e8dc;
  color: #8a6a4a;
}
.count-pill.count-multi {
  background: #8a6a4a;
  color: #fff;
}
.add-icon {
  color: #a08060;
}

/* ── Entry section ── */
.entry-section { }

.entry-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
}

.back-ppe-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: 1.5px solid #ddd0bc;
  border-radius: 20px;
  padding: 6px 14px;
  font-family: 'Nunito', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #8a6a4a;
  cursor: pointer;
  transition: all 0.2s;
}
.back-ppe-btn:hover { background: #f5ede0; }

.selected-ppe-tag {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--item-color, #8a6a4a)18;
  border: 1.5px solid var(--item-color, #8a6a4a)40;
  color: var(--item-color, #8a6a4a);
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 700;
}

/* ── Table ── */
.table-wrap {
  overflow-x: auto;
  border-radius: 12px;
  border: 1.5px solid #ddd0bc;
  background: #fff;
}

.entry-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 15px;
}
.entry-table th {
  background: #f9f3eb;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: #8a6a4a;
  padding: 13px 16px;
  text-align: left;
  border-bottom: 1.5px solid #ddd0bc;
  white-space: nowrap;
}
.entry-table td {
  padding: 11px 16px;
  border-bottom: 1px solid #f0e8dc;
  vertical-align: middle;
}
.entry-table tr:last-child td { border-bottom: none; }
.entry-table tr:hover td { background: #faf6f0; }

.row-num {
  font-family: 'DM Mono', monospace;
  font-size: 13px;
  color: #a08060;
  text-align: center;
}

.tbl-input {
  background: #faf6f0;
  border: 1px solid #e8dcd0;
  border-radius: 6px;
  color: #000;
  font-family: 'Nunito', sans-serif;
  font-size: 14px;
  padding: 7px 11px;
  width: 100%;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.tbl-input:focus {
  border-color: #8a6a4a;
  box-shadow: 0 0 0 2px rgba(138,106,74,0.12);
  background: #fff;
}

.del-row-btn {
  width: 26px; height: 26px;
  border-radius: 50%;
  border: 1.5px solid rgba(184,50,50,0.3);
  background: rgba(184,50,50,0.07);
  color: #b83232;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.del-row-btn:hover { background: rgba(184,50,50,0.15); }

.entry-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
  flex-wrap: wrap;
  gap: 10px;
}
.action-right {
  display: flex;
  gap: 10px;
}

/* ── Buttons ── */
.btn {
  padding: 9px 20px;
  border-radius: 20px;
  border: none;
  font-family: 'Nunito', sans-serif;
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;
}
.btn:disabled { opacity: 0.45; cursor: not-allowed; }
.btn-primary {
  background: linear-gradient(135deg, #a07850, #8a6a4a);
  color: #fff;
  box-shadow: 0 4px 14px rgba(138,106,74,0.3);
}
.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(138,106,74,0.45);
}
.btn-secondary {
  background: #fff;
  color: #000;
  border: 1.5px solid #ddd0bc;
}
.btn-secondary:hover { border-color: #8a6a4a; color: #8a6a4a; background: #f9f3eb; }
.btn-danger {
  background: rgba(184,50,50,0.07);
  color: #b83232;
  border: 1.5px solid rgba(184,50,50,0.25);
}
.btn-danger:hover { background: rgba(184,50,50,0.14); }
.btn-sm { padding: 5px 14px; font-size: 11px; }

/* ── History ── */
.history-top {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.search-wrap {
  position: relative;
  flex: 1;
  max-width: 400px;
}
.search-icon {
  position: absolute;
  left: 12px; top: 50%;
  transform: translateY(-50%);
  color: #a08060;
  pointer-events: none;
}
.search-input {
  width: 100%;
  padding: 9px 36px 9px 36px;
  border: 1.5px solid #ddd0bc;
  border-radius: 20px;
  font-family: 'Nunito', sans-serif;
  font-size: 13px;
  background: #fff;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.search-input:focus {
  border-color: #8a6a4a;
  box-shadow: 0 0 0 3px rgba(138,106,74,0.1);
}
.search-clear {
  position: absolute;
  right: 10px; top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #a08060;
  font-size: 18px;
  cursor: pointer;
  line-height: 1;
}

.search-results-block {
  background: #fff;
  border: 1.5px solid #ddd0bc;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 24px;
}
.search-results-table-wrap { overflow-x: auto; }

.duplicate-row td { background: #fff0f0 !important; }
.worker-name { font-weight: 700; }
.dup-badge {
  display: inline-block;
  margin-left: 8px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  background: #b83232;
  color: #fff;
  padding: 2px 8px;
  border-radius: 10px;
}
.ppe-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
}

.no-results {
  background: #fff8f0;
  border: 1.5px dashed #ddd0bc;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  color: #a08060;
  font-size: 13px;
  margin-bottom: 24px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.history-card {
  background: #fff;
  border: 1.5px solid #ddd0bc;
  border-radius: 16px;
  overflow: hidden;
}

.hcard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid transparent;
  flex-wrap: wrap;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}
.hcard-header:hover { background: #faf6f0; }
.history-card.expanded .hcard-header { border-bottom-color: #f0e8dc; }

.hcard-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.hcard-chevron {
  display: flex;
  align-items: center;
  color: #a08060;
  transition: transform 0.22s ease;
}
.hcard-chevron.open { transform: rotate(180deg); }

.hcard-left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.hcard-icon {
  width: 50px; height: 50px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #8a6a4a;
}
.hcard-icon svg { width: 26px; height: 26px; }
.hcard-title {
  font-size: 17px;
  font-weight: 700;
  color: #1a1008;
}
.hcard-meta {
  font-size: 12px;
  color: #a08060;
  font-weight: 600;
  margin-top: 2px;
}
.hcard-actions {
  display: flex;
  gap: 8px;
}

.hcard-table-wrap { overflow-x: auto; }
.hcard-table { font-size: 13px; }
.hcard-table th { padding: 11px 16px; }
.hcard-table td { padding: 9px 16px; }

/* ── Empty state ── */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #a08060;
}
.empty-icon { color: #c8b49a; margin-bottom: 12px; display: flex; justify-content: center; }
.empty-state p { font-size: 14px; font-weight: 600; }

/* ── Modal ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  z-index: 100;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 60px 20px;
  backdrop-filter: blur(6px);
}
.modal {
  background: #fff;
  border: 1.5px solid #ddd0bc;
  border-radius: 20px;
  padding: 32px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.12);
  animation: slideIn 0.25s ease;
}
@keyframes slideIn {
  from { transform: translateY(-16px); opacity: 0; }
  to   { transform: translateY(0);     opacity: 1; }
}
.modal h2 {
  font-family: 'Cormorant Garamond', serif;
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 20px;
}

.form-group { margin-bottom: 16px; }
.bf {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #a08060;
  display: block;
  margin-bottom: 4px;
}
.modal-input {
  width: 100%;
  padding: 9px 12px;
  border: 1.5px solid #ddd0bc;
  border-radius: 8px;
  font-family: 'Nunito', sans-serif;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
}
.modal-input:focus { border-color: #8a6a4a; }
.color-pick {
  width: 60px; height: 36px;
  border: 1.5px solid #ddd0bc;
  border-radius: 8px;
  cursor: pointer;
  padding: 2px;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
}

/* ── Icon Picker ── */
.icon-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}
.icon-opt {
  width: 40px; height: 40px;
  border-radius: 10px;
  border: 1.5px solid #ddd0bc;
  background: #faf6f0;
  color: #8a6a4a;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}
.icon-opt:hover { border-color: #8a6a4a; background: #f5ede0; }
.icon-opt.active {
  border-color: #8a6a4a;
  background: #8a6a4a;
  color: #fff;
}
.icon-opt svg { width: 18px; height: 18px; }

/* ── Button with icon ── */
.btn-icon {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.btn-icon svg { width: 13px; height: 13px; }

/* ── Badge icon ── */
.badge-icon { display: inline-flex; align-items: center; }
.badge-icon svg { width: 12px; height: 12px; }

.toast {
  position: fixed;
  bottom: 32px;
  right: 32px;
  background: #fff;
  border: 1.5px solid #8a6a4a;
  color: #000;
  padding: 12px 22px;
  border-radius: 20px;
  font-family: 'Nunito', sans-serif;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 8px 30px rgba(138,106,74,0.18);
  z-index: 200;
}
.toast-fade-enter-active { animation: fadeInOut 2.6s ease forwards; }
.toast-fade-leave-active { opacity: 0; }
@keyframes fadeInOut {
  0%   { opacity: 0; transform: translateY(10px); }
  15%  { opacity: 1; transform: translateY(0); }
  75%  { opacity: 1; }
  100% { opacity: 0; }
}

/* ── Sortable column headers ── */
.th-sortable {
  cursor: pointer;
  user-select: none;
  position: relative;
  transition: background 0.15s, color 0.15s;
}
.th-sortable:hover { background: #f0e8dc !important; color: #5a3a1a; }
.th-active         { background: #f0e8dc !important; color: #6a4a28 !important; }

.th-inner {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.sort-indicator {
  display: inline-flex;
  align-items: center;
  color: #8a6a4a;
  flex-shrink: 0;
}

/* ── Sort dropdown ── */
.sort-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 160px;
  background: #fff;
  border: 1.5px solid #ddd0bc;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  z-index: 999;
  overflow: hidden;
  animation: ddFadeIn 0.13s ease;
}
@keyframes ddFadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}

.sort-dd-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px;
  font-size: 12px;
  font-weight: 700;
  font-family: 'Nunito', sans-serif;
  color: #5a3a1a;
  cursor: pointer;
  text-transform: none;
  letter-spacing: 0;
  transition: background 0.12s;
  white-space: nowrap;
}
.sort-dd-item:hover   { background: #f9f3eb; }
.sort-dd-item.active  {
  background: #f0e8dc;
  color: #8a6a4a;
}
.sort-dd-item.active::after {
  content: '✓';
  margin-left: auto;
  font-size: 11px;
  color: #8a6a4a;
}
.sort-dd-item + .sort-dd-item { border-top: 1px solid #f0e8dc; }

.dd-icon {
  font-size: 13px;
  width: 16px;
  text-align: center;
  flex-shrink: 0;
}

/* ── QTY pill ── */
.qty-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  padding: 2px 8px;
  background: #f0e8dc;
  color: #6a4a28;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 800;
  font-family: 'DM Mono', monospace;
  border: 1px solid #ddd0bc;
}

/* ── QTY input ── */
.tbl-input--qty {
  text-align: center;
  font-weight: 700;
  font-family: 'DM Mono', monospace;
}
</style>