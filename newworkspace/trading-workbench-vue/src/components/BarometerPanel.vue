<script setup lang="ts">
import { computed, ref } from 'vue';
import { useBarometer } from '../composables/useBarometer';
import { useQuoteOverview } from '../composables/useQuoteOverview';
import {
  barometerMetricOptions,
  barometerTimeframeOptions,
} from '../data/barometerMock';
import BarometerChart from './barometer/BarometerChart.vue';
import CompareTab from './quoteOverview/CompareTab.vue';
import TrendTab from './quoteOverview/TrendTab.vue';

export type DockTab = 'barometer' | 'trend' | 'compare';

const props = defineProps<{
  activeTab?: DockTab;
  fixedTab?: DockTab;
  hideTabs?: boolean;
  title?: string;
}>();
const emit = defineEmits<{ 'update:activeTab': [tab: DockTab] }>();

const localTab = ref<DockTab>('barometer');
const activeTab = computed<DockTab>({
  get: () => props.fixedTab ?? props.activeTab ?? localTab.value,
  set: (v) => {
    if (props.fixedTab) return;
    localTab.value = v;
    emit('update:activeTab', v);
  },
});

const dockTabs: Array<{ key: DockTab; label: string }> = [
  { key: 'barometer', label: '晴雨表' },
  { key: 'trend',     label: '行情走势' },
  { key: 'compare',   label: '个人 & 机构' },
];

// ── Barometer state ──
const { timeframe, metric, currentSlice } = useBarometer();

// ── Quote overview state (shared for trend + compare tabs) ──
const {
  metric: ovMetric,
  dimension,
  direction,
  showYesterday,
  availableDimensions,
  currentSlice: ovSlice,
  compareSeries,
  compareInsight,
  enabledTenors,
  setMetric,
  setDimension,
  toggleTenor,
} = useQuoteOverview();
</script>

<template>
  <div class="barometer-panel">
    <!-- Header: three tabs -->
    <div class="barometer-panel__head" :class="{ 'barometer-panel__head--static': hideTabs }">
      <div v-if="!hideTabs" class="barometer-panel__tabs">
        <button
          v-for="t in dockTabs"
          :key="t.key"
          type="button"
          class="barometer-tab"
          :class="{ 'is-active': activeTab === t.key }"
          @click="activeTab = t.key"
        >{{ t.label }}</button>
      </div>
      <h3 v-else class="barometer-panel__title">{{ title ?? dockTabs.find((tab) => tab.key === activeTab)?.label }}</h3>
    </div>

    <!-- ── Tab 1: 晴雨表 ── -->
    <template v-if="activeTab === 'barometer'">
      <div class="barometer-panel__toolbar">
        <div class="dock-filter-group">
          <span class="dock-filter-label">期限</span>
          <div class="segmented dock-segmented">
            <button
              v-for="opt in barometerTimeframeOptions"
              :key="opt.value"
              type="button"
              :class="{ 'is-active': timeframe === opt.value }"
              @click="timeframe = opt.value"
            >{{ opt.label }}</button>
          </div>
        </div>
        <div class="dock-filter-group">
          <span class="dock-filter-label">口径</span>
          <div class="segmented dock-segmented">
            <button
              v-for="opt in barometerMetricOptions"
              :key="opt.value"
              type="button"
              :class="{ 'is-active': metric === opt.value }"
              @click="metric = opt.value"
            >{{ opt.label }}</button>
          </div>
        </div>
        <span class="barometer-panel__meta">当日实时成交变化 · 每 15 分钟更新</span>
      </div>
      <div class="barometer-panel__chart-area">
        <BarometerChart
          :series="currentSlice.series"
          :y-unit="currentSlice.yUnit"
          :y-label="currentSlice.yLabel"
        />
      </div>
      <div class="barometer-panel__legend">
        <span v-for="s in currentSlice.series" :key="s.key" class="barometer-legend-item">
          <svg width="22" height="10" viewBox="0 0 22 10">
            <line
              v-if="s.lineStyle === 'dashed'"
              x1="1" y1="5" x2="21" y2="5" :stroke="s.color" stroke-width="1.5" stroke-dasharray="5,3"
            />
            <line v-else x1="1" y1="5" x2="21" y2="5" :stroke="s.color" stroke-width="2" />
          </svg>
          {{ s.label }}
        </span>
      </div>
    </template>

    <!-- ── Tab 2: 行情走势 ── -->
    <TrendTab
      v-else-if="activeTab === 'trend'"
      class="dock-tab-body"
      :metric="ovMetric"
      :dimension="dimension"
      :direction="direction"
      :show-yesterday="showYesterday"
      :available-dimensions="availableDimensions"
      :slice="ovSlice"
      @set-metric="setMetric"
      @set-dimension="setDimension"
      @set-direction="direction = $event"
      @update:show-yesterday="showYesterday = $event"
    />

    <!-- ── Tab 3: 个人 & 机构 ── -->
    <CompareTab
      v-else-if="activeTab === 'compare'"
      class="dock-tab-body"
      :enabled-tenors="enabledTenors"
      :series="compareSeries"
      :insight="compareInsight"
      @toggle-tenor="toggleTenor"
    />
  </div>
</template>
