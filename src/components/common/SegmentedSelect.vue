<script setup lang="ts" generic="T extends string | number">
defineProps<{
  modelValue: T;
  options: { value: T; label: string }[];
  size?: 'sm' | 'md';
}>();
const emit = defineEmits<{ 'update:modelValue': [value: T] }>();
</script>

<template>
  <div class="segmented-select" :class="size === 'sm' ? 'segmented-select--sm' : 'segmented-select--md'">
    <button
      v-for="opt in options"
      :key="String(opt.value)"
      type="button"
      class="segmented-select__btn"
      :class="{ 'is-active': opt.value === modelValue }"
      @click="emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>
