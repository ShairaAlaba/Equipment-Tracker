<template>
  <div>
    <div class="fields">
      <span>
        <span class="lbl">QTY</span>
        {{ row.qty || '—' }}
      </span>
      <span>
        <span class="lbl">Tool</span>
        {{ row.toolName || '—' }}
      </span>
      <span>
        <span class="lbl">Ctrl #</span>
        <span class="mono">{{ row.controlNo || '—' }}</span>
      </span>
      <span :class="'condition-' + row.condition">
        <span class="lbl">Condition</span>
        {{ row.condition || '—' }}
      </span>
      <span v-if="row.damageNotes">
        <span class="lbl">Damage</span>
        {{ row.damageNotes }}
      </span>
      <span>
        <span class="lbl">Accessories</span>
        {{
          row.accessoriesReturned === true
            ? '✅ YES'
            : row.accessoriesReturned === false
            ? '❌ NO'
            : '—'
        }}
      </span>
      <span v-if="row.remarks">
        <span class="lbl">Remarks</span>
        {{ row.remarks }}
      </span>
    </div>

    <div v-if="row.borrowers && row.borrowers.length" class="borrower-list">
      <div v-for="(b, bi) in row.borrowers" :key="bi" class="borrower-item">
        👤
        <strong>{{ b.name || '—' }}</strong>
        &nbsp;|&nbsp; Project: {{ b.project || '—' }}
        &nbsp;|&nbsp; Borrowed: {{ b.dateBorrowed || '—' }} {{ b.timeBorrowed || '' }}
        &nbsp;|&nbsp; Returned: {{ b.returnDate || '—' }} {{ b.returnTime || '' }}
        &nbsp;|&nbsp; Checkout:
        <span :class="'condition-' + b.conditionCheckout">{{ b.conditionCheckout || '—' }}</span>
        <span v-if="b.conditionCheckoutNotes"> ({{ b.conditionCheckoutNotes }})</span>
        &nbsp;|&nbsp; Return:
        <span :class="'condition-' + b.conditionReturn">{{ b.conditionReturn || '—' }}</span>
        <span v-if="b.conditionReturnNotes"> ({{ b.conditionReturnNotes }})</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  row: { type: Object, required: true }
})
</script>

<style scoped>
.fields {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  font-size: 13px;
  color: var(--text);
}

.lbl {
  font-family: 'Nunito', sans-serif;
  font-size: 10px;
  font-weight: 800;
  color: var(--muted);
  display: block;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.mono {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
}

.borrower-list { margin-top: 8px; }

.borrower-item {
  font-size: 12px;
  background: #fff8f4;
  border: 1px solid #f0e0d5;
  padding: 6px 10px;
  border-radius: 8px;
  margin-top: 5px;
  line-height: 1.7;
  color: var(--text);
}
</style>
