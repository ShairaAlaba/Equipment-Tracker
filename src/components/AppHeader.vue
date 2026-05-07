<template>
  <header class="app-header">
    <div class="header-left">
      <button class="back-hub-btn" @click="$emit('back')">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 2L4 7l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Hub
      </button>
      <div class="logo">
        <div class="logo-icon">📋</div>
        <div>
          <h1>EQT Tracker</h1>
          <span>Equipment Borrow Management System</span>
        </div>
      </div>
    </div>
    <div class="header-date">
      <strong>{{ dateLabel }}</strong>
      <span>{{ currentTime }}</span>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

defineEmits(['back'])

const props = defineProps({
  recordDate: { type: String, required: true }
})

const currentTime = ref('')
let timerId = null

function tick() {
  currentTime.value = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
}

const dateLabel = computed(() => {
  const d = new Date(props.recordDate + 'T00:00:00')
  return d.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
})

onMounted(() => { tick(); timerId = setInterval(tick, 1000) })
onBeforeUnmount(() => clearInterval(timerId))
</script>

<style scoped>
.app-header {
  background: #ffffff;
  border-bottom: 2px solid var(--border);
  padding: 18px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-hub-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background: none;
  border: 1.5px solid var(--border);
  border-radius: 20px;
  padding: 6px 14px;
  font-family: 'Nunito', sans-serif;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: var(--accent);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}
.back-hub-btn:hover {
  background: var(--bg);
  border-color: var(--accent);
}

.logo {
  display: flex;
  align-items: center;
  gap: 14px;
}

.logo-icon {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #c4a882, #a07850);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  box-shadow: 0 4px 14px rgba(138, 106, 74, 0.25);
}

.logo h1 {
  font-family: 'Cormorant Garamond', serif;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: #000000;
}

.logo span {
  display: block;
  font-size: 11px;
  color: var(--muted);
  letter-spacing: 1.5px;
  font-family: 'Nunito', sans-serif;
  font-weight: 600;
  text-transform: uppercase;
}

.header-date {
  font-family: 'DM Mono', monospace;
  font-size: 13px;
  color: var(--muted);
  text-align: right;
}

.header-date strong {
  display: block;
  color: #000000;
  font-size: 15px;
  font-family: 'Nunito', sans-serif;
}
</style>