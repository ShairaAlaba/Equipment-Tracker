<template>
  <div class="landing">
    <div class="landing-bg">
      <div class="bg-orb bg-orb-1"></div>
      <div class="bg-orb bg-orb-2"></div>
      <div class="grid-lines"></div>
    </div>

    <div class="landing-content">
      <!-- Header -->
      <div class="landing-header">
        <div class="logo-mark">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="14" fill="#8a6a4a"/>
            <path d="M12 18h6v12h-6zM21 14h6v16h-6zM30 20h6v10h-6z" fill="white" opacity="0.9"/>
          </svg>
        </div>
        <div class="header-text">
          <h1>EQUIPMENT TRACKER</h1>
          <p>General Services Office</p>
        </div>
      </div>

      <!-- Subtitle -->
      <div class="landing-subtitle">
        <span>Select a system to continue</span>
      </div>

      <!-- Cards -->
      <div class="system-cards">

        <!-- Equipment Tracker Card -->
        <div class="sys-card sys-card--equipment" @click="$emit('go', 'equipment')">
          <div class="card-glow"></div>
          <div class="card-icon-wrap">
            <div class="card-icon">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path d="M8 32V20l12-8 12 8v12" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                <rect x="15" y="23" width="10" height="9" rx="1" stroke="currentColor" stroke-width="2"/>
                <path d="M20 12v-4M16 10h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <circle cx="20" cy="8" r="2" fill="currentColor"/>
              </svg>
            </div>
          </div>
          <div class="card-body">
            <h2>Equipment Tracker</h2>
            <p>Manage tool borrowing, daily records, condition tracking, and equipment history logs.</p>
            <div class="card-tags">
              <span class="tag">Borrowing Records</span>
              <span class="tag">Condition Reports</span>
              <span class="tag">History</span>
            </div>
          </div>
          <div class="card-arrow">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10h12M10 4l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>

        <!-- PPE System Card -->
        <div class="sys-card sys-card--ppe" @click="$emit('go', 'ppe')">
          <div class="card-glow"></div>
          <div class="card-icon-wrap">
            <div class="card-icon">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path d="M20 6C14 6 10 10.5 10 15v2h20v-2C30 10.5 26 6 20 6z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                <path d="M8 17h24v2a4 4 0 01-4 4H12a4 4 0 01-4-4v-2z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                <path d="M14 23v8M20 23v8M26 23v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M11 31h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
          </div>
          <div class="card-body">
            <h2>PPE Distribution</h2>
            <p>Track personal protective equipment issued to workers — hard hats, gloves, vests, shoes, and more.</p>
            <div class="card-tags">
              <span class="tag">Worker Records</span>
              <span class="tag">PPE Issuance</span>
              <span class="tag">History</span>
            </div>
          </div>
          <div class="card-arrow">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10h12M10 4l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>

      </div>

      <!-- Footer -->
      
    </div>
  </div>
</template>

<script setup>
defineEmits(['go'])
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Nunito:wght@300;400;600;700;800&display=swap');

.landing {
  min-height: 100vh;
  background: #f5ede0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  font-family: 'Nunito', sans-serif;
}

.landing-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
}
.bg-orb-1 {
  width: 500px; height: 500px;
  background: radial-gradient(circle, #d4a97a, transparent 70%);
  top: -100px; left: -100px;
}
.bg-orb-2 {
  width: 400px; height: 400px;
  background: radial-gradient(circle, #b8cfa8, transparent 70%);
  bottom: -80px; right: -80px;
}

.grid-lines {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(138,106,74,0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(138,106,74,0.06) 1px, transparent 1px);
  background-size: 50px 50px;
}

.landing-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 860px;
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

/* ── Header ── */
.landing-header {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 10px;
}

.header-text h1 {
  font-family: 'Cormorant Garamond', serif;
  font-size: 36px;
  font-weight: 700;
  color: #1a1008;
  line-height: 1.1;
  letter-spacing: 0.5px;
}

.header-text p {
  font-size: 13px;
  color: #8a6a4a;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-top: 4px;
}

.landing-subtitle {
  margin: 18px 0 36px;
  font-size: 14px;
  color: #a08060;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
}
.landing-subtitle::before,
.landing-subtitle::after {
  content: '';
  display: block;
  width: 40px;
  height: 1px;
  background: #c8a882;
}

/* ── Cards ── */
.system-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  width: 100%;
}

.sys-card {
  position: relative;
  background: #ffffff;
  border: 1.5px solid #ddd0bc;
  border-radius: 20px;
  padding: 32px 28px 28px;
  cursor: pointer;
  transition: all 0.28s cubic-bezier(0.25, 0.8, 0.25, 1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.sys-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 50px rgba(138, 106, 74, 0.2);
  border-color: transparent;
}

.card-glow {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.28s;
  border-radius: 20px;
}

.sys-card--equipment .card-glow {
  background: linear-gradient(135deg, rgba(138,106,74,0.08), rgba(160,133,94,0.04));
}
.sys-card--ppe .card-glow {
  background: linear-gradient(135deg, rgba(107,143,94,0.1), rgba(80,120,70,0.04));
}

.sys-card:hover .card-glow { opacity: 1; }

.card-icon-wrap {
  display: flex;
  align-items: flex-start;
}

.card-icon {
  width: 68px;
  height: 68px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}

.sys-card--equipment .card-icon {
  background: linear-gradient(135deg, #f5ede0, #e8d8c0);
  color: #8a6a4a;
}
.sys-card--ppe .card-icon {
  background: linear-gradient(135deg, #eaf3de, #d4e8c0);
  color: #4a7a3a;
}

.sys-card:hover .card-icon { transform: scale(1.08); }

.card-body h2 {
  font-family: 'Cormorant Garamond', serif;
  font-size: 26px;
  font-weight: 700;
  color: #1a1008;
  letter-spacing: 0.3px;
  margin-bottom: 8px;
}

.card-body p {
  font-size: 13.5px;
  color: #6b5540;
  line-height: 1.65;
  font-weight: 400;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 14px;
}

.tag {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: 20px;
}

.sys-card--equipment .tag {
  background: rgba(138,106,74,0.1);
  color: #7a5a3a;
}
.sys-card--ppe .tag {
  background: rgba(74,122,58,0.1);
  color: #3a6a2a;
}

.card-arrow {
  display: flex;
  justify-content: flex-end;
  opacity: 0;
  transform: translateX(-8px);
  transition: all 0.25s;
}
.sys-card:hover .card-arrow {
  opacity: 1;
  transform: translateX(0);
}

.sys-card--equipment .card-arrow { color: #8a6a4a; }
.sys-card--ppe .card-arrow { color: #4a7a3a; }

/* ── Footer ── */
.landing-footer {
  margin-top: 40px;
  font-size: 11px;
  color: #b09070;
  letter-spacing: 1px;
  text-transform: uppercase;
  font-weight: 600;
}

@media (max-width: 640px) {
  .system-cards { grid-template-columns: 1fr; }
  .header-text h1 { font-size: 26px; }
  .landing-header { flex-direction: column; text-align: center; }
}
</style>
