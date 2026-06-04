<script setup lang="ts">
import { computed, ref } from 'vue';
import { BAROMETER_TIMELINE, type BarometerSeries } from '../../data/barometerMock';

const props = defineProps<{
  series: BarometerSeries[];
  yUnit: string;
  yLabel: string;
}>();

const PADDING = { top: 24, right: 16, bottom: 28, left: 44 };
const WIDTH = 620;
const HEIGHT = 200;
const plotW = WIDTH - PADDING.left - PADDING.right;
const plotH = HEIGHT - PADDING.top - PADDING.bottom;

const hoverIndex = ref<number | null>(null);
const svgRef = ref<SVGSVGElement | null>(null);

const xPositions = BAROMETER_TIMELINE.map((_, i) => PADDING.left + (i / (BAROMETER_TIMELINE.length - 1)) * plotW);
const tIndex = new Map(BAROMETER_TIMELINE.map((t, i) => [t, i]));

// X-axis tick labels — show every 4th slot to avoid crowding
const xTicks = BAROMETER_TIMELINE
  .map((t, i) => ({ t, x: xPositions[i] }))
  .filter((_, i) => i % 4 === 0);

const yRange = computed(() => {
  let min = Infinity, max = -Infinity;
  for (const s of props.series)
    for (const p of s.points) {
      if (p.value < min) min = p.value;
      if (p.value > max) max = p.value;
    }
  if (!isFinite(min)) return { min: 0, max: 10 };
  const margin = (max - min) * 0.15 || 5;
  return { min: Math.max(0, min - margin), max: max + margin };
});

const yTicks = computed(() => {
  const { min, max } = yRange.value;
  return Array.from({ length: 4 }, (_, i) => {
    const value = max - i * ((max - min) / 3);
    return { value, y: PADDING.top + (i / 3) * plotH, label: value < 10 ? value.toFixed(1) : Math.round(value).toString() };
  });
});

const toY = (v: number) => {
  const { min, max } = yRange.value;
  return PADDING.top + (1 - (v - min) / (max - min)) * plotH;
};

const pathD = (s: BarometerSeries) =>
  s.points.map((p, i) => {
    const xi = tIndex.get(p.t) ?? i;
    return `${i === 0 ? 'M' : 'L'}${xPositions[xi]},${toY(p.value)}`;
  }).join('');

const onMouseMove = (e: MouseEvent) => {
  const svg = svgRef.value;
  if (!svg) return;
  const rect = svg.getBoundingClientRect();
  const mx = ((e.clientX - rect.left) / rect.width) * WIDTH;
  let closest = 0, minDist = Infinity;
  xPositions.forEach((x, i) => { const d = Math.abs(mx - x); if (d < minDist) { minDist = d; closest = i; } });
  hoverIndex.value = minDist < plotW / (BAROMETER_TIMELINE.length - 1) + 4 ? closest : null;
};

const tooltipValues = computed(() => {
  if (hoverIndex.value == null) return null;
  const t = BAROMETER_TIMELINE[hoverIndex.value];
  return {
    time: t,
    x: xPositions[hoverIndex.value],
    items: props.series.map((s) => ({
      label: s.label, color: s.color, dashed: s.lineStyle === 'dashed',
      value: s.points.find((p) => p.t === t)?.value ?? null,
    })),
  };
});
</script>

<template>
  <svg
    ref="svgRef"
    class="barometer-chart"
    :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
    preserveAspectRatio="xMidYMid meet"
    @mousemove="onMouseMove"
    @mouseleave="hoverIndex = null"
  >
    <text :x="2" :y="PADDING.top - 8" class="barometer-chart__axis-label">{{ yLabel }}（{{ yUnit }}）</text>

    <g v-for="tick in yTicks" :key="tick.value">
      <line :x1="PADDING.left" :y1="tick.y" :x2="WIDTH - PADDING.right" :y2="tick.y" class="barometer-chart__grid" />
      <text :x="PADDING.left - 6" :y="tick.y + 4" class="barometer-chart__tick" text-anchor="end">{{ tick.label }}</text>
    </g>

    <text
      v-for="tk in xTicks" :key="tk.t"
      :x="tk.x" :y="HEIGHT - 6"
      class="barometer-chart__tick" text-anchor="middle"
    >{{ tk.t }}</text>

    <path
      v-for="s in series" :key="s.key"
      :d="pathD(s)"
      fill="none"
      :stroke="s.color"
      :stroke-width="s.lineStyle === 'dashed' ? 1.5 : 2"
      :stroke-dasharray="s.lineStyle === 'dashed' ? '6,4' : undefined"
      :stroke-opacity="s.lineStyle === 'dashed' ? 0.55 : 1"
      stroke-linejoin="round" stroke-linecap="round"
    />

    <line
      v-if="hoverIndex != null"
      :x1="xPositions[hoverIndex]" :y1="PADDING.top"
      :x2="xPositions[hoverIndex]" :y2="PADDING.top + plotH"
      class="barometer-chart__crosshair"
    />

    <g v-if="tooltipValues" :transform="`translate(${Math.min(tooltipValues.x + 10, WIDTH - 130)}, ${PADDING.top + 4})`">
      <rect x="0" y="0" width="124" :height="20 + tooltipValues.items.length * 16" rx="3" ry="3" class="barometer-chart__tooltip-bg" />
      <text x="8" y="14" class="barometer-chart__tooltip-time">{{ tooltipValues.time }}</text>
      <g v-for="(item, i) in tooltipValues.items" :key="i" :transform="`translate(8, ${26 + i * 16})`">
        <line v-if="item.dashed" x1="0" y1="-4" x2="10" y2="-4" :stroke="item.color" stroke-width="1.5" stroke-dasharray="3,2" />
        <circle v-else cx="4" cy="-4" r="3.5" :fill="item.color" />
        <text x="14" y="0" class="barometer-chart__tooltip-label">{{ item.label }}</text>
        <text x="118" y="0" class="barometer-chart__tooltip-value" text-anchor="end">{{ item.value ?? '—' }}</text>
      </g>
    </g>
  </svg>
</template>
