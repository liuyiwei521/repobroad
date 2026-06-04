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
      <div class="dock-filter-group">
        <span class="dock-filter-label">指标</span>
        <div class="segmented dock-segmented">
          <button
            v-for="o in metricOptions"
            :key="o.value"
            type="button"
            :class="{ 'is-active': metric === o.value }"
            @click="emit('setMetric', o.value)"
          >{{ o.label }}</button>
        </div>
      </div>
      <div class="dock-filter-group">
        <span class="dock-filter-label">维度</span>
        <div class="segmented dock-segmented">
          <button
            v-for="o in dimensionOptions"
            :key="o.value"
            type="button"
            :disabled="!availableDimensions.includes(o.value)"
            :class="{
              'is-active': dimension === o.value,
              'is-disabled': !availableDimensions.includes(o.value),
            }"
            @click="emit('setDimension', o.value)"
          >{{ o.label }}</button>
        </div>
      </div>
      <div class="dock-filter-group">
        <span class="dock-filter-label">方向</span>
        <div class="segmented dock-segmented">
          <button
            v-for="o in directionOptions"
            :key="o.value"
            type="button"
            :class="{ 'is-active': direction === o.value }"
            @click="emit('setDirection', o.value)"
          >{{ o.label }}</button>
        </div>
      </div>
      <button
        type="button"
        class="dock-toggle"
        :class="{ 'is-active': showYesterday }"
        @click="emit('update:showYesterday', !showYesterday)"
      >昨日对比</button>
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
