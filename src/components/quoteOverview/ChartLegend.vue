<script setup lang="ts">
import type { ChartSeries } from '../../data/quoteOverviewMock';

defineProps<{
  series: ChartSeries[];
}>();
</script>

<template>
  <div class="chart-legend">
    <span v-for="s in series" :key="s.key" class="chart-legend__item">
      <svg width="20" height="10" viewBox="0 0 20 10">
        <line
          x1="0" y1="5" x2="20" y2="5"
          :stroke="s.color"
          stroke-width="2"
          :stroke-dasharray="s.lineStyle === 'dashed' ? '4,3' : undefined"
        />
        <circle v-if="s.lineStyle !== 'dashed'" cx="10" cy="5" r="3" :fill="s.color" />
      </svg>
      <span>{{ s.label }}</span>
    </span>
  </div>
</template>
