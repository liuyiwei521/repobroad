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
    <QuoteRow
      v-for="line in group.rows"
      :key="line.id"
      :line="line"
      @open-line="emit('openLine', $event)"
      @send-line="emit('sendLine', $event)"
    />
  </div>
</template>
