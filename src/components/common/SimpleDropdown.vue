<script setup lang="ts" generic="T extends string | number">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

const props = defineProps<{
  modelValue: T | T[];
  options: { value: T; label: string }[];
  multiple?: boolean;
  placeholder?: string;
  label?: string;
}>();
const emit = defineEmits<{ 'update:modelValue': [value: T | T[]] }>();

const open = ref(false);
const rootRef = ref<HTMLElement | null>(null);

const selectedValues = computed<T[]>(() =>
  Array.isArray(props.modelValue) ? props.modelValue : props.modelValue == null ? [] : [props.modelValue]
);

const display = computed(() => {
  if (selectedValues.value.length === 0) return props.placeholder ?? '请选择';
  const labels = props.options
    .filter((opt) => selectedValues.value.includes(opt.value))
    .map((opt) => opt.label);
  if (labels.length === 0) return props.placeholder ?? '请选择';
  if (props.multiple && labels.length > 2) return `${labels.slice(0, 2).join('、')} +${labels.length - 2}`;
  return labels.join('、');
});

const toggle = () => (open.value = !open.value);

const choose = (value: T) => {
  if (props.multiple) {
    const current = selectedValues.value.slice();
    const idx = current.indexOf(value);
    if (idx >= 0) current.splice(idx, 1);
    else current.push(value);
    emit('update:modelValue', current as T[]);
  } else {
    emit('update:modelValue', value);
    open.value = false;
  }
};

const handleDocClick = (event: MouseEvent) => {
  if (!rootRef.value) return;
  if (!rootRef.value.contains(event.target as Node)) open.value = false;
};

onMounted(() => document.addEventListener('mousedown', handleDocClick));
onBeforeUnmount(() => document.removeEventListener('mousedown', handleDocClick));
</script>

<template>
  <div ref="rootRef" class="simple-dropdown" :class="{ 'is-open': open }">
    <span v-if="label" class="simple-dropdown__label">{{ label }}</span>
    <button type="button" class="simple-dropdown__trigger" @click="toggle">
      <span class="simple-dropdown__value">{{ display }}</span>
      <svg width="10" height="6" viewBox="0 0 10 6" aria-hidden="true">
        <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
    <ul v-if="open" class="simple-dropdown__menu" role="listbox">
      <li
        v-for="opt in options"
        :key="String(opt.value)"
        role="option"
        :class="{ 'is-active': selectedValues.includes(opt.value) }"
        @click="choose(opt.value)"
      >
        <span class="simple-dropdown__check" aria-hidden="true">{{ selectedValues.includes(opt.value) ? '✓' : '' }}</span>
        <span>{{ opt.label }}</span>
      </li>
    </ul>
  </div>
</template>
