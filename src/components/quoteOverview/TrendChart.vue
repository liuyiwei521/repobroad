<script setup lang="ts">
import { computed, ref } from 'vue';
import { TIMELINE, type ChartSeries } from '../../data/quoteOverviewMock';

const props = defineProps<{
  series: ChartSeries[];
  yUnit: string;
  yLabel: string;
  timeline?: readonly string[];
}>();

const PADDING = { top: 32, right: 24, bottom: 36, left: 56 };
const WIDTH = 960;
const HEIGHT = 360;
const plotW = WIDTH - PADDING.left - PADDING.right;
const plotH = HEIGHT - PADDING.top - PADDING.bottom;

const hoverIndex = ref<number | null>(null);
const svgRef = ref<SVGSVGElement | null>(null);

const chartTimeline = computed(() => (props.timeline?.length ? props.timeline : TIMELINE));
const xPositions = computed(() => {
  const slots = Math.max(chartTimeline.value.length - 1, 1);
  return chartTimeline.value.map((_, i) => PADDING.left + (i / slots) * plotW);
});
const tIndex = computed(() => new Map(chartTimeline.value.map((t, i) => [t, i])));

const yRange = computed(() => {
  let min = Infinity;
  let max = -Infinity;
  for (const s of props.series) {
    for (const p of s.points) {
      if (p.value < min) min = p.value;
      if (p.value > max) max = p.value;
    }
  }
  if (!isFinite(min)) return { min: 0, max: 10 };
  const margin = (max - min) * 0.15 || 1;
  return { min: min - margin, max: max + margin };
});

const yTicks = computed(() => {
  const { min, max } = yRange.value;
  const count = 5;
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, i) => {
    const value = max - i * step;
    return {
      value,
      y: PADDING.top + (i / (count - 1)) * plotH,
      label: value < 10 ? value.toFixed(2) : Math.round(value).toString(),
    };
  });
});

const toY = (value: number) => {
  const { min, max } = yRange.value;
  return PADDING.top + (1 - (value - min) / (max - min)) * plotH;
};

const pathD = (s: ChartSeries) => {
  return s.points
    .map((p, i) => {
      const xi = tIndex.value.get(p.t) ?? i;
      return `${i === 0 ? 'M' : 'L'}${xPositions.value[xi]},${toY(p.value)}`;
    })
    .join('');
};

interface PeakInfo {
  seriesKey: string;
  label: string;
  color: string;
  time: string;
  value: number;
  x: number;
  y: number;
  formattedValue: string;
}

const peaks = computed<PeakInfo[]>(() => {
  const result: PeakInfo[] = [];
  for (const s of props.series) {
    if (s.lineStyle === 'dashed' || s.points.length === 0) continue;
    let best = s.points[0];
    for (const p of s.points) {
      if (p.value > best.value) best = p;
    }
    const xi = tIndex.value.get(best.t) ?? 0;
    result.push({
      seriesKey: s.key,
      label: s.label,
      color: s.color,
      time: best.t,
      value: best.value,
      x: xPositions.value[xi],
      y: toY(best.value),
      formattedValue: props.yUnit === '%' ? best.value.toFixed(2) + '%'
        : props.yUnit === 'BP' ? Math.round(best.value) + 'BP'
        : Math.round(best.value) + props.yUnit,
    });
  }
  return result;
});

const peakLabelY = (peak: PeakInfo, index: number) => {
  const base = peak.y - 14;
  const tooHigh = base < PADDING.top + 4;
  const offset = tooHigh ? 20 : 0;
  // stagger overlapping labels
  const nearby = peaks.value.filter((p, i) => i < index && Math.abs(p.x - peak.x) < 60 && Math.abs(p.y - peak.y) < 28);
  return base + offset + nearby.length * 16;
};

const onMouseMove = (event: MouseEvent) => {
  const svg = svgRef.value;
  if (!svg) return;
  const rect = svg.getBoundingClientRect();
  const mx = ((event.clientX - rect.left) / rect.width) * WIDTH;
  let closest = 0;
  let minDist = Infinity;
  for (let i = 0; i < xPositions.value.length; i++) {
    const d = Math.abs(mx - xPositions.value[i]);
    if (d < minDist) { minDist = d; closest = i; }
  }
  hoverIndex.value = minDist < plotW / Math.max(chartTimeline.value.length - 1, 1) ? closest : null;
};

const tooltipValues = computed(() => {
  if (hoverIndex.value == null) return null;
  const t = chartTimeline.value[hoverIndex.value];
  return {
    time: t,
    x: xPositions.value[hoverIndex.value],
    items: props.series.map(s => {
      const pt = s.points.find(p => p.t === t);
      return { label: s.label, color: s.color, value: pt?.value, dashed: s.lineStyle === 'dashed' };
    }),
  };
});

const formatTooltipValue = (value: number | undefined) => {
  if (value == null) return '—';
  if (props.yUnit === '%') return value.toFixed(2);
  return Math.round(value).toString();
};
</script>

<template>
  <svg
    ref="svgRef"
    class="trend-chart"
    :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
    preserveAspectRatio="xMidYMid meet"
    @mousemove="onMouseMove"
    @mouseleave="hoverIndex = null"
  >
    <!-- Y axis label -->
    <text
      :x="4"
      :y="PADDING.top - 12"
      class="trend-chart__axis-label"
    >{{ yLabel }}（{{ yUnit }}）</text>

    <!-- Grid lines + Y tick labels -->
    <g v-for="tick in yTicks" :key="tick.value">
      <line
        :x1="PADDING.left" :y1="tick.y"
        :x2="WIDTH - PADDING.right" :y2="tick.y"
        class="trend-chart__grid"
      />
      <text
        :x="PADDING.left - 8"
        :y="tick.y + 4"
        class="trend-chart__tick"
        text-anchor="end"
      >{{ tick.label }}</text>
    </g>

    <!-- X axis labels -->
    <text
      v-for="(t, i) in chartTimeline" :key="t"
      :x="xPositions[i]"
      :y="HEIGHT - 8"
      class="trend-chart__tick"
      text-anchor="middle"
    >{{ t }}</text>

    <!-- Data lines -->
    <path
      v-for="s in series" :key="s.key"
      :d="pathD(s)"
      fill="none"
      :stroke="s.color"
      :stroke-width="s.lineStyle === 'dashed' ? 1.5 : 2"
      :stroke-dasharray="s.lineStyle === 'dashed' ? '6,4' : undefined"
      :stroke-opacity="s.lineStyle === 'dashed' ? 0.5 : 1"
      stroke-linejoin="round"
      stroke-linecap="round"
    />

    <!-- Data points -->
    <template v-for="s in series" :key="'dots-' + s.key">
      <circle
        v-for="(p, pi) in s.points" :key="pi"
        :cx="xPositions[tIndex.get(p.t) ?? pi]"
        :cy="toY(p.value)"
        :r="hoverIndex === (tIndex.get(p.t) ?? pi) ? 4 : (s.lineStyle === 'dashed' ? 0 : 2.5)"
        :fill="s.color"
        :fill-opacity="s.lineStyle === 'dashed' ? 0.5 : 1"
        class="trend-chart__dot"
      />
    </template>

    <!-- Peak markers (solid lines only) -->
    <g v-for="(peak, pi) in peaks" :key="'peak-' + peak.seriesKey" class="trend-chart__peak">
      <!-- Diamond marker -->
      <polygon
        :points="`${peak.x},${peak.y - 6} ${peak.x + 5},${peak.y} ${peak.x},${peak.y + 6} ${peak.x - 5},${peak.y}`"
        :fill="peak.color"
        stroke="white"
        stroke-width="1.2"
      />
      <!-- Label: value @ time -->
      <rect
        :x="peak.x - 2"
        :y="peakLabelY(peak, pi) - 11"
        :width="peak.formattedValue.length * 7 + peak.time.length * 6 + 16"
        height="16"
        rx="2"
        :fill="peak.color"
        fill-opacity="0.12"
      />
      <text
        :x="peak.x + 4"
        :y="peakLabelY(peak, pi)"
        class="trend-chart__peak-label"
        :fill="peak.color"
      >↑{{ peak.formattedValue }}  {{ peak.time }}</text>
    </g>

    <!-- Hover crosshair -->
    <line
      v-if="hoverIndex != null"
      :x1="xPositions[hoverIndex]" :y1="PADDING.top"
      :x2="xPositions[hoverIndex]" :y2="PADDING.top + plotH"
      class="trend-chart__crosshair"
    />

    <!-- Tooltip -->
    <g v-if="tooltipValues" :transform="`translate(${Math.min(tooltipValues.x + 12, WIDTH - 150)}, ${PADDING.top + 8})`">
      <rect
        x="0" y="0"
        :width="140"
        :height="24 + tooltipValues.items.length * 18"
        rx="3" ry="3"
        class="trend-chart__tooltip-bg"
      />
      <text x="8" y="16" class="trend-chart__tooltip-time">{{ tooltipValues.time }}</text>
      <g v-for="(item, i) in tooltipValues.items" :key="i" :transform="`translate(8, ${32 + i * 18})`">
        <line v-if="item.dashed" x1="0" y1="-4" x2="8" y2="-4" :stroke="item.color" stroke-width="1.5" stroke-dasharray="3,2" />
        <circle v-else cx="4" cy="-4" r="4" :fill="item.color" />
        <text x="14" y="0" class="trend-chart__tooltip-label">{{ item.label }}</text>
        <text x="130" y="0" class="trend-chart__tooltip-value" text-anchor="end">{{ formatTooltipValue(item.value) }}</text>
      </g>
    </g>
  </svg>
</template>
