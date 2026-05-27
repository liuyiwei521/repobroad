<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import type { ResearchCard } from '../data/mockData';

const props = defineProps<{
  cards: ResearchCard[];
  activeCard: ResearchCard | null;
}>();

const emit = defineEmits<{
  openCard: [card: ResearchCard];
  closeCard: [];
}>();

const popoverEl = ref<HTMLElement | null>(null);

const statusLabel = (status: ResearchCard['status']) => {
  switch (status) {
    case 'delayed': return '延迟';
    case 'empty':   return '暂缺';
    case 'error':   return '取数失败';
    default:        return '正常';
  }
};

const statusDetail = (card: ResearchCard) => {
  switch (card.status) {
    case 'delayed': return `数据延迟，最近更新 ${card.updatedAt}`;
    case 'empty':   return '暂无数据';
    case 'error':   return '取数失败，可点击重试';
    default:        return `数据正常，更新于 ${card.updatedAt}`;
  }
};

const onDocumentMousedown = (event: MouseEvent) => {
  if (!props.activeCard) return;
  const target = event.target as Node | null;
  if (popoverEl.value && target && popoverEl.value.contains(target)) return;
  // Allow re-clicking on a card to toggle / switch — let the card handler run
  if ((event.target as HTMLElement | null)?.closest('.research-card')) return;
  emit('closeCard');
};

watch(
  () => props.activeCard?.id,
  async (id) => {
    if (!id) return;
    await nextTick();
    popoverEl.value?.querySelector<HTMLElement>('button, [href], input, select, [tabindex]:not([tabindex="-1"])')?.focus();
  }
);

onMounted(() => document.addEventListener('mousedown', onDocumentMousedown));
onUnmounted(() => document.removeEventListener('mousedown', onDocumentMousedown));
</script>

<template>
  <section class="panel research-panel" aria-label="中栏投研行情摘要">
    <div class="panel__head">
      <div>
        <p class="eyebrow">中栏 · 投研 / 行情</p>
        <h2>数据摘要</h2>
      </div>
      <span class="panel__meta">10:55 更新</span>
    </div>

    <div class="research-grid">
      <button
        v-for="card in cards"
        :key="card.id"
        type="button"
        class="research-card"
        :class="[`is-${card.status}`]"
        @click="emit('openCard', card)"
      >
        <span v-if="card.status !== 'normal'" class="card-status" :class="`is-${card.status}`">
          {{ statusLabel(card.status) }}
        </span>
        <span class="research-card__group">{{ card.group }}</span>
        <strong>{{ card.title }}</strong>
        <b>{{ card.value }}</b>
        <small>{{ card.delta }} · {{ card.updatedAt }}</small>
      </button>
    </div>

    <aside v-if="activeCard" ref="popoverEl" class="medium-popover" tabindex="-1">
      <div class="medium-popover__head">
        <div>
          <p class="eyebrow">{{ activeCard.group }}</p>
          <h3>{{ activeCard.title }}</h3>
        </div>
        <button class="close-button" type="button" @click="emit('closeCard')" aria-label="关闭详情">×</button>
      </div>

      <div class="popover-status" :class="`is-${activeCard.status}`">
        <i class="popover-status__dot"></i>
        <span>数据状态：{{ statusLabel(activeCard.status) }}</span>
        <em>{{ statusDetail(activeCard) }}</em>
      </div>

      <div class="detail-metric">
        <span>当前值</span>
        <b>{{ activeCard.value }}</b>
        <em>{{ activeCard.delta }}</em>
      </div>

      <ul v-if="activeCard.details.length" class="detail-list">
        <li v-for="line in activeCard.details" :key="line">{{ line }}</li>
      </ul>
      <div v-else class="empty-state">暂无明细数据。</div>

      <div class="popover-actions">
        <button class="button button--primary" type="button">引用判断</button>
        <button class="button button--secondary" type="button" @click="emit('closeCard')">收起</button>
      </div>
    </aside>
  </section>
</template>
