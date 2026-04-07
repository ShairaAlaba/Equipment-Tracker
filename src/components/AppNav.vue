<template>
  <nav class="app-nav">
    <button
      class="nav-btn"
      :class="{ active: activeTab === 'daily' }"
      @click="$emit('change', 'daily')"
    >
      Daily Record
    </button>
    <button
      class="nav-btn"
      :class="{ active: activeTab === 'history' }"
      @click="$emit('change', 'history')"
    >
      History
    </button>
    <button
      class="nav-btn nav-btn--equip"
      :class="{ active: activeTab === 'equipment' }"
      @click="$emit('change', 'equipment')"
    >
      Equipment List
    </button>
    <button
      class="nav-btn nav-btn--analysis"
      :class="{ active: activeTab === 'analysis' }"
      @click="$emit('change', 'analysis')"
    >
      Analysis
    </button>
  </nav>
</template>

<script setup>
defineProps({
  activeTab: { type: String, required: true }
})
defineEmits(['change'])
</script>

<style scoped>
.app-nav {
  background: #ffffff;
  border-bottom: 1.5px solid var(--border);
  padding: 0 32px;
  display: flex;
  gap: 4px;
}

.nav-btn {
  padding: 14px 28px;
  background: none;
  border: none;
  color: var(--muted);
  font-family: 'Nunito', sans-serif;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
  margin-bottom: -1.5px;
}

.nav-btn:hover { color: var(--text); }

.nav-btn.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

/* Equipment tab gets a subtle tint to distinguish it as a settings-like page */
.nav-btn--equip.active {
  color: #2a6099;
  border-bottom-color: #2a6099;
}

/* Analysis tab — amber/warning tint */
.nav-btn--analysis.active {
  color: #7a5200;
  border-bottom-color: #8a6200;
}
</style>