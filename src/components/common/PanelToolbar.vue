<script setup lang="ts">
defineProps<{
  eyebrow?: string;
  title: string;
}>();
</script>

<template>
  <header class="panel-toolbar">
    <div class="panel-toolbar__heading">
      <p v-if="eyebrow" class="panel-toolbar__eyebrow">{{ eyebrow }}</p>
      <h3 class="panel-toolbar__title">{{ title }}</h3>
    </div>
    <div class="panel-toolbar__actions">
      <slot />
    </div>
  </header>
</template>
