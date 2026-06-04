<script setup lang="ts">
import { ref } from 'vue';
import PanelToolbar from '../common/PanelToolbar.vue';
import SimpleDropdown from '../common/SimpleDropdown.vue';
import type { Tenor } from '../../data/mockData';

const primary = ref<Tenor>('R001');
const overlays = ref<Tenor[]>([]);

const primaryOptions: { value: Tenor; label: string }[] = [
  { value: 'R001', label: 'R001' },
  { value: 'R007', label: 'R007' }
];

const overlayOptions: { value: Tenor; label: string }[] = [
  { value: 'R001', label: 'R001' },
  { value: 'R007', label: 'R007' },
  { value: 'R014', label: 'R014' },
  { value: 'R021', label: 'R021' },
  { value: 'R028', label: 'R028' }
];
</script>

<template>
  <section class="panel chart-panel chart-panel--placeholder">
    <PanelToolbar title="匿名成交走势图">
      <SimpleDropdown v-model="primary" :options="primaryOptions" />
      <SimpleDropdown
        v-model="overlays"
        :options="overlayOptions"
        multiple
        label="叠加品种"
        placeholder="不叠加"
      />
      <span class="chart-toolbar__legend">匿名成交利率 / 成交量</span>
    </PanelToolbar>
    <div class="chart-placeholder">
      <div class="chart-placeholder__title">匿名成交走势 · 占位</div>
      <div class="chart-placeholder__hint">主线 {{ primary }} · 叠加 {{ overlays.join(' · ') || '无' }}</div>
      <div class="chart-placeholder__hint">Phase 5 接入折线 + 叠加多线</div>
    </div>
  </section>
</template>
