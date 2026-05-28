<script setup lang="ts">
import QuoteRow from './QuoteRow.vue';
import type { QuoteGroupView, QuoteLine } from './types';

defineProps<{
  group: QuoteGroupView;
}>();

const emit = defineEmits<{
  openLine: [line: QuoteLine];
  sendLine: [line: QuoteLine];
}>();
</script>

<template>
  <div class="quote-group-table">
    <div class="quote-table quote-table--summary">
      <span class="quote-summary-name">
        <i>汇总</i>
        <b>{{ group.group }}</b>
      </span>
      <span></span>
      <span class="number">{{ group.totalAmount.toFixed(group.totalAmount % 1 === 0 ? 0 : 1) }}亿</span>
      <span class="quote-summary-rate">{{ group.avgRate.toFixed(2) }}%</span>
      <span></span>
      <span></span>
      <span class="summary-page" v-if="group.summary">第 {{ group.summary.page }} / {{ group.summary.totalPages }} 页</span>
      <span></span>
    </div>
    <QuoteRow
      v-for="line in group.rows"
      :key="line.id"
      :line="line"
      @open-line="emit('openLine', $event)"
      @send-line="emit('sendLine', $event)"
    />
  </div>
</template>
