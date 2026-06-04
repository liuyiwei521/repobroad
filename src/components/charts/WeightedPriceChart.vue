<script setup lang="ts">
import { ref } from 'vue';
import PanelToolbar from '../common/PanelToolbar.vue';
import SegmentedSelect from '../common/SegmentedSelect.vue';
import SimpleDropdown from '../common/SimpleDropdown.vue';
import type { Tenor } from '../../data/mockData';
import { compareModeOptions, timeframeOptions, type CompareMode, type Timeframe } from '../../data/insightMock';

const productOptions: { value: Tenor; label: string }[] = [
  { value: 'R001', label: 'R001' },
  { value: 'R007', label: 'R007' }
];

const product = ref<Tenor>('R001');
const compareMode = ref<CompareMode>('none');
const timeframe = ref<Timeframe>('5d');
</script>

<template>
  <section class="panel chart-panel chart-panel--placeholder">
    <PanelToolbar title="加权价格走势">
      <SimpleDropdown
        v-model="product"
        :options="productOptions"
        label="产品"
      />
      <SimpleDropdown
        v-model="compareMode"
        :options="compareModeOptions"
        label="对比"
      />
      <SegmentedSelect v-model="timeframe" :options="timeframeOptions" size="sm" />
    </PanelToolbar>
    <div class="chart-placeholder">
      <div class="chart-placeholder__title">加权价格走势 · 占位</div>
      <div class="chart-placeholder__hint">{{ product }} / {{ compareMode }} / {{ timeframe }}</div>
      <div class="chart-placeholder__hint">Phase 4 接入折线 + 量柱双段图</div>
    </div>
  </section>
</template>
