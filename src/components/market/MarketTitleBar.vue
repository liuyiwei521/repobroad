<script setup lang="ts">
import type { Direction, Tenor } from '../../data/mockData';
import type { TenorFilter } from './types';

defineProps<{
  activeTenor: TenorFilter;
  tenors: Tenor[];
  activeDirection: Direction;
  directionTabs: Array<{ value: Direction; label: string }>;
}>();

const emit = defineEmits<{
  'update:activeTenor': [value: TenorFilter];
  'update:activeDirection': [value: Direction];
}>();
</script>

<template>
  <div class="market-title-bar">
    <div class="market-title-main">
      <h2>非银报价</h2>
      <div class="direction-tabs" role="tablist" aria-label="报价方向">
        <button
          v-for="tab in directionTabs"
          :key="tab.value"
          :class="{ 'is-active': activeDirection === tab.value }"
          type="button"
          @click="emit('update:activeDirection', tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>
      <div class="tenor-tabs" role="tablist" aria-label="期限标签">
        <button :class="{ 'is-active': activeTenor === 'all' }" type="button" @click="emit('update:activeTenor', 'all')">
          全部
        </button>
        <button
          v-for="tenor in tenors"
          :key="tenor"
          :class="{ 'is-active': activeTenor === tenor }"
          type="button"
          @click="emit('update:activeTenor', tenor)"
        >
          {{ tenor }}
        </button>
      </div>
    </div>
  </div>
</template>
