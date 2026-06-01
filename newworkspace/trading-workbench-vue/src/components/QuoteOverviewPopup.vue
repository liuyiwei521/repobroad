<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useFocusTrap } from '../composables/useFocusTrap';
import { useQuoteOverview } from '../composables/useQuoteOverview';
import CompareTab from './quoteOverview/CompareTab.vue';
import TrendTab from './quoteOverview/TrendTab.vue';

const emit = defineEmits<{ close: [] }>();

const popupEl = ref<HTMLElement | null>(null);
useFocusTrap(popupEl);

const {
  activeTab,
  metric,
  dimension,
  direction,
  showYesterday,
  enabledTenors,
  availableDimensions,
  currentSlice,
  compareSeries,
  compareInsight,
  setMetric,
  setDimension,
  toggleTenor,
} = useQuoteOverview();

const position = ref({ x: 0, y: 0 });
const dragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });

const centerPopup = () => {
  if (typeof window === 'undefined') return;
  position.value = {
    x: Math.max((window.innerWidth - 1060) / 2, 16),
    y: Math.max((window.innerHeight - 660) / 2, 48),
  };
};

const onDragStart = (e: PointerEvent) => {
  dragging.value = true;
  dragOffset.value = { x: e.clientX - position.value.x, y: e.clientY - position.value.y };
  window.addEventListener('pointermove', onDragMove);
  window.addEventListener('pointerup', onDragEnd);
};

const onDragMove = (e: PointerEvent) => {
  if (!dragging.value) return;
  position.value = {
    x: Math.max(0, e.clientX - dragOffset.value.x),
    y: Math.max(0, e.clientY - dragOffset.value.y),
  };
};

const onDragEnd = () => {
  dragging.value = false;
  window.removeEventListener('pointermove', onDragMove);
  window.removeEventListener('pointerup', onDragEnd);
};

const onBackdropClick = (e: MouseEvent) => {
  if (e.target === e.currentTarget) emit('close');
};

onMounted(centerPopup);
onUnmounted(() => {
  window.removeEventListener('pointermove', onDragMove);
  window.removeEventListener('pointerup', onDragEnd);
});
</script>

<template>
  <div class="quote-overview-backdrop" @mousedown="onBackdropClick">
    <div
      ref="popupEl"
      class="quote-overview-popup"
      :style="{ left: position.x + 'px', top: position.y + 'px' }"
      tabindex="-1"
    >
      <div class="quote-overview-popup__head" @pointerdown="onDragStart">
        <div class="quote-overview-popup__title">
          <p class="eyebrow">QTrade</p>
          <h3>报价概览</h3>
        </div>
        <span class="quote-overview-popup__time">09:00 – 15:00 今日</span>
        <button class="close-button" type="button" @click="emit('close')" aria-label="关闭">×</button>
      </div>

      <div class="quote-overview-popup__tabs">
        <button
          type="button"
          class="quote-overview-tab"
          :class="{ 'is-active': activeTab === 'trend' }"
          @click="activeTab = 'trend'"
        >行情走势分析</button>
        <button
          type="button"
          class="quote-overview-tab"
          :class="{ 'is-active': activeTab === 'compare' }"
          @click="activeTab = 'compare'"
        >个人 / 机构对比</button>
      </div>

      <div class="quote-overview-popup__body">
        <TrendTab
          v-if="activeTab === 'trend'"
          :metric="metric"
          :dimension="dimension"
          :direction="direction"
          :show-yesterday="showYesterday"
          :available-dimensions="availableDimensions"
          :slice="currentSlice"
          @set-metric="setMetric"
          @set-dimension="setDimension"
          @set-direction="direction = $event"
          @update:show-yesterday="showYesterday = $event"
        />
        <CompareTab
          v-else
          :enabled-tenors="enabledTenors"
          :series="compareSeries"
          :insight="compareInsight"
          @toggle-tenor="toggleTenor"
        />
      </div>
    </div>
  </div>
</template>
