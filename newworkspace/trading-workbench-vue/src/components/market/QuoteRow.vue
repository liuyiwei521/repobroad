<script setup lang="ts">
import type { QuoteLine } from './types';

defineProps<{
  line: QuoteLine;
}>();

const emit = defineEmits<{
  openLine: [line: QuoteLine];
  correctLine: [line: QuoteLine];
  sendLine: [line: QuoteLine];
}>();

const statusLabel = (status: QuoteLine['status']) => {
  if (status === 'best') return '最优';
  if (status === 'second') return '次优';
  return '普通';
};
</script>

<template>
  <div
    class="quote-table quote-table--row"
    :class="{
      'is-selected': line.isSelected,
      'is-match': line.isMatched,
      'is-sent': line.isSent
    }"
  >
    <span class="quote-counterparty">
      <i class="quote-tag" :class="`is-${line.status}`">{{ statusLabel(line.status) }}</i>
      <b>{{ line.institution }}</b>
    </span>
    <span class="number">{{ line.tenor }}</span>
    <span class="number">{{ line.amount > 0 ? `${line.amount.toFixed(line.amount % 1 === 0 ? 0 : 1)}亿` : '--' }}</span>
    <button class="quote-rate" type="button" @click="emit('openLine', line)">
      {{ line.rate.toFixed(2) }}%
    </button>
    <span>{{ line.accountRequirement }}</span>
    <span>{{ line.collateralRequirement }}</span>
    <span class="number">{{ line.updatedAt }}</span>
    <span class="quote-actions">
      <button class="quote-actions__fix" type="button" @click="emit('correctLine', line)">修正</button>
      <button class="quote-actions__send" type="button" @click="emit('sendLine', line)">发送</button>
    </span>
  </div>
</template>
