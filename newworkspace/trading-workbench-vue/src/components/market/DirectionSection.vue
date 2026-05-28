<script setup lang="ts">
import QuoteGroupTable from './QuoteGroupTable.vue';
import type { DirectionSectionView, QuoteLine } from './types';

defineProps<{
  section: DirectionSectionView;
}>();

const emit = defineEmits<{
  openLine: [line: QuoteLine];
  sendLine: [line: QuoteLine];
}>();
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
        <span>分组 / 机构</span>
        <span>期限</span>
        <span>金额(总量)</span>
        <span>利率(均价)</span>
        <span>账户要求</span>
        <span>质押要求</span>
        <span>获取时间</span>
        <span>操作</span>
      </div>

      <QuoteGroupTable
        v-for="group in section.groups"
        :key="group.key"
        :group="group"
        @open-line="emit('openLine', $event)"
        @send-line="emit('sendLine', $event)"
      />
    </div>
  </section>
</template>
