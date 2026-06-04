<script setup lang="ts">
import { tenors, type Tenor } from '../../data/mockData';
import type { ChartSeries } from '../../data/quoteOverviewMock';
import ChartLegend from './ChartLegend.vue';
import TrendChart from './TrendChart.vue';

defineProps<{
  enabledTenors: Set<Tenor>;
  series: ChartSeries[];
  insight: string;
}>();

const emit = defineEmits<{
  toggleTenor: [tenor: Tenor];
}>();
</script>

<template>
  <div class="compare-tab">
    <div class="compare-tab__toolbar">
      <div class="dock-filter-group">
        <span class="dock-filter-label">期限</span>
        <div class="compare-tab__chips">
          <button
            v-for="t in tenors" :key="t"
            type="button"
            class="compare-tab__chip"
            :class="{ 'is-active': enabledTenors.has(t) }"
            @click="emit('toggleTenor', t)"
          >{{ t }}</button>
        </div>
      </div>
      <span class="compare-tab__hint">── 个人（实线）&nbsp;&nbsp;┄┄ 机构（虚线）</span>
    </div>

    <div class="compare-tab__chart-area">
      <TrendChart :series="series" y-unit="%" y-label="收益率" />
      <ChartLegend :series="series" />
      <p class="compare-tab__insight">{{ insight }}</p>
    </div>
  </div>
</template>
