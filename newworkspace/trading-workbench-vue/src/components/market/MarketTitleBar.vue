<script setup lang="ts">
import type { Tenor } from '../../data/mockData';
import type { TenorFilter } from './types';

defineProps<{
  activeTenor: TenorFilter;
  tenors: Tenor[];
}>();

const emit = defineEmits<{
  'update:activeTenor': [value: TenorFilter];
}>();
</script>

<template>
  <div class="market-title-bar">
    <div class="market-title-main">
      <h2>非银报价</h2>
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
