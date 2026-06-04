<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import PanelToolbar from '../common/PanelToolbar.vue';
import SegmentedSelect from '../common/SegmentedSelect.vue';
import TrendChart from '../quoteOverview/TrendChart.vue';
import ChartLegend from '../quoteOverview/ChartLegend.vue';
import { TIMELINE, type ChartSeries } from '../../data/quoteOverviewMock';
import {
  indivInstitCompareData,
  indivInstitDimensionLabels,
  indivInstitModeOptions,
  type IndivInstitCompareItem,
  type IndivInstitDimensionKey,
  type IndivInstitDimensionMode
} from '../../data/insightMock';

const mode = ref<IndivInstitDimensionMode>('tenor');
const selected = ref<IndivInstitDimensionKey[]>(['R001', 'R007']);

const currentItems = computed(() => indivInstitCompareData[mode.value]);

watch(mode, () => {
  selected.value = currentItems.value.map((item) => item.key);
});

const toggle = (item: IndivInstitCompareItem) => {
  const exists = selected.value.includes(item.key);
  if (exists && selected.value.length === 1) return;
  selected.value = exists
    ? selected.value.filter((key) => key !== item.key)
    : [...selected.value, item.key];
};

const activeItems = computed(() => {
  const active = currentItems.value.filter((item) => selected.value.includes(item.key));
  return active.length ? active : [currentItems.value[0]];
});

const series = computed<ChartSeries[]>(() =>
  activeItems.value.flatMap((item) => [
    {
      key: `${item.key}-personal`,
      label: `个人 ${item.label}`,
      color: item.color,
      lineStyle: 'solid',
      points: item.points.map((point) => ({ t: point.t, value: point.personalRate }))
    },
    {
      key: `${item.key}-institution`,
      label: `机构加权 ${item.label}`,
      color: item.color,
      lineStyle: 'dashed',
      points: item.points.map((point) => ({ t: point.t, value: point.institutionRate }))
    }
  ])
);

const latestRows = computed(() =>
  activeItems.value.map((item) => {
    const latest = item.points[item.points.length - 1];
    const spreadBp = Math.round((latest.institutionRate - latest.personalRate) * 100);
    return {
      key: item.key,
      label: item.label,
      color: item.color,
      personalRate: latest.personalRate.toFixed(2),
      institutionRate: latest.institutionRate.toFixed(2),
      spreadBp,
      personalCount: latest.personalCount,
      institutionCount: latest.institutionCount,
      institutionAmount: latest.institutionAmount
    };
  })
);

const strongestSpread = computed(() =>
  latestRows.value.reduce((best, row) =>
    Math.abs(row.spreadBp) > Math.abs(best.spreadBp) ? row : best
  , latestRows.value[0])
);

const insight = computed(() => {
  const row = strongestSpread.value;
  if (!row) return '请选择至少一个统计维度。';
  const direction = row.spreadBp >= 0 ? '高于' : '低于';
  return `${row.label} 当前机构加权利率${direction}个人收到 ${Math.abs(row.spreadBp)}BP，机构样本 ${row.institutionCount} 条 / ${row.institutionAmount} 亿，可优先观察该维度的报价覆盖。`;
});
</script>

<template>
  <section class="panel chart-panel indiv-instit-chart">
    <PanelToolbar title="个人 & 机构">
      <SegmentedSelect v-model="mode" :options="indivInstitModeOptions" size="sm" />
      <span class="chart-toolbar__legend">— 个人&nbsp;&nbsp;--- 机构加权</span>
    </PanelToolbar>

    <div class="indiv-instit-chart__body">
      <div class="indiv-instit-chart__filters">
        <span class="indiv-instit-chart__filter-label">{{ indivInstitDimensionLabels[mode] }}</span>
        <div class="chart-toolbar__chips">
          <button
            v-for="item in currentItems"
            :key="item.key"
            type="button"
            class="chip indiv-instit-chart__chip"
            :class="{ 'is-active': selected.includes(item.key) }"
            :style="{ '--chip-color': item.color }"
            @click="toggle(item)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>

      <TrendChart :series="series" y-unit="%" y-label="利率" :timeline="TIMELINE" />
      <ChartLegend :series="series" />

      <div class="indiv-instit-chart__summary">
        <div
          v-for="row in latestRows"
          :key="row.key"
          class="indiv-instit-chart__stat"
          :style="{ '--stat-color': row.color }"
        >
          <span class="indiv-instit-chart__stat-name">{{ row.label }}</span>
          <span>个人 {{ row.personalRate }}%</span>
          <span>机构 {{ row.institutionRate }}%</span>
          <b>{{ row.spreadBp >= 0 ? '+' : '' }}{{ row.spreadBp }}BP</b>
        </div>
      </div>

      <p class="compare-tab__insight">{{ insight }}</p>
    </div>
  </section>
</template>
