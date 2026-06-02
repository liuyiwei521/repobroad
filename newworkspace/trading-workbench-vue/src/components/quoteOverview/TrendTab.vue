<script setup lang="ts">
import type { OverviewDimension, OverviewMetric, OverviewSlice } from '../../data/quoteOverviewMock';
import { dimensionOptions, metricOptions, directionOptions, type DirectionFilter } from '../../data/quoteOverviewMock';
import ChartLegend from './ChartLegend.vue';
import TrendChart from './TrendChart.vue';

defineProps<{
  metric: OverviewMetric;
  dimension: OverviewDimension;
  direction: DirectionFilter;
  showYesterday: boolean;
  availableDimensions: OverviewDimension[];
  slice: OverviewSlice | undefined;
}>();

const emit = defineEmits<{
  setMetric: [value: OverviewMetric];
  setDimension: [value: OverviewDimension];
  setDirection: [value: DirectionFilter];
  'update:showYesterday': [value: boolean];
}>();
</script>

<template>
  <div class="trend-tab">
    <div class="trend-tab__toolbar">
      <label class="trend-tab__field">
        <span>指标</span>
        <select :value="metric" @change="emit('setMetric', ($event.target as HTMLSelectElement).value as OverviewMetric)">
          <option v-for="o in metricOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </label>
      <label class="trend-tab__field">
        <span>维度</span>
        <select :value="dimension" @change="emit('setDimension', ($event.target as HTMLSelectElement).value as OverviewDimension)">
          <option
            v-for="o in dimensionOptions" :key="o.value" :value="o.value"
            :disabled="!availableDimensions.includes(o.value)"
          >{{ o.label }}</option>
        </select>
      </label>
      <label class="trend-tab__field">
        <span>方向</span>
        <select :value="direction" @change="emit('setDirection', ($event.target as HTMLSelectElement).value as DirectionFilter)">
          <option v-for="o in directionOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </label>
      <label class="trend-tab__toggle">
        <input type="checkbox" :checked="showYesterday" @change="emit('update:showYesterday', ($event.target as HTMLInputElement).checked)" />
        <span>昨日对比</span>
      </label>
    </div>

    <div v-if="slice" class="trend-tab__chart-area">
      <TrendChart :series="slice.series" :y-unit="slice.yUnit" :y-label="slice.yLabel" />
      <ChartLegend :series="slice.series" />
      <p class="trend-tab__insight">{{ slice.insight }}</p>
    </div>
    <div v-else class="trend-tab__empty">
      暂无该口径数据
    </div>
  </div>
</template>
