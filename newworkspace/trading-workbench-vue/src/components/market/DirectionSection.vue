<script setup lang="ts">
import QuoteGroupTable from './QuoteGroupTable.vue';
import type { DirectionSectionView, QuoteLine } from './types';
import { useQuoteColumns } from '../../composables/useQuoteColumns';

defineProps<{
  section: DirectionSectionView;
}>();

const emit = defineEmits<{
  openInstitutionLine: [line: QuoteLine];
  openPricePreview: [line: QuoteLine];
  sendLine: [line: QuoteLine];
  openCardLine: [payload: { line: QuoteLine; trader: string }];
  sendCardLine: [payload: { line: QuoteLine; trader: string }];
}>();

const { startResize } = useQuoteColumns();

const headers = ['分组 / 机构', '期限', '金额(总量)', '利率(均价)', '账户要求', '质押要求', '获取时间', '操作'];
</script>

<template>
  <section class="quote-direction">
    <div class="quote-direction__title">
      <h3>
        {{ section.title }}
        <span v-if="section.direction === 'reverse'">焦点</span>
      </h3>
      <em>层级 {{ section.activeLevel === 'level1' ? '1' : '2' }} / {{ section.totalLevels }}</em>
    </div>

    <div class="market-table">
      <div class="quote-table quote-table--head">
        <span v-for="(label, index) in headers" :key="label" class="quote-head-cell">
          {{ label }}
          <i
            v-if="index < headers.length - 1"
            class="quote-col-resizer"
            role="separator"
            aria-orientation="vertical"
            :aria-label="`调整${label}列宽`"
            @pointerdown="startResize(index, $event)"
          />
        </span>
      </div>

      <QuoteGroupTable
        v-for="group in section.groups"
        :key="group.key"
        :group="group"
        @open-institution-line="emit('openInstitutionLine', $event)"
        @open-price-preview="emit('openPricePreview', $event)"
        @send-line="emit('sendLine', $event)"
        @open-card-line="emit('openCardLine', $event)"
        @send-card-line="emit('sendCardLine', $event)"
      />
    </div>
  </section>
</template>
