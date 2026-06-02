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
  openQuoteOverview: [];
}>();

const popoverEl = ref<HTMLElement | null>(null);
const drawerEl = ref<HTMLElement | null>(null);
const railEl = ref<HTMLElement | null>(null);
const drawerOpen = ref(false);

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
  const target = event.target as Node | null;
  if (popoverEl.value && target && popoverEl.value.contains(target)) return;
  // Allow re-clicking on a card to toggle / switch — let the card handler run
  if ((event.target as HTMLElement | null)?.closest('.research-card')) return;
  if (drawerEl.value && target && drawerEl.value.contains(target)) return;
  if (railEl.value && target && railEl.value.contains(target)) return;
  if (props.activeCard) emit('closeCard');
  if (drawerOpen.value) drawerOpen.value = false;
};

const onDocumentKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && drawerOpen.value && !props.activeCard) {
    drawerOpen.value = false;
  }
};

const openSummaryDrawer = () => {
  drawerOpen.value = true;
};

const openCard = (card: ResearchCard) => {
  drawerOpen.value = false;
  emit('openCard', card);
};

watch(
  () => props.activeCard?.id,
  async (id) => {
    if (!id) return;
    await nextTick();
    popoverEl.value?.querySelector<HTMLElement>('button, [href], input, select, [tabindex]:not([tabindex="-1"])')?.focus();
  }
);

onMounted(() => {
  document.addEventListener('mousedown', onDocumentMousedown);
  document.addEventListener('keydown', onDocumentKeydown);
});
onUnmounted(() => {
  document.removeEventListener('mousedown', onDocumentMousedown);
  document.removeEventListener('keydown', onDocumentKeydown);
});
</script>

<template>
  <section class="panel research-panel" aria-label="左栏摘要导航">
    <div class="panel__head">
      <div>
        <p class="eyebrow">左栏 · 投研 / 行情</p>
        <h2>数据摘要</h2>
      </div>
      <span class="panel__meta">10:55 更新</span>
    </div>

    <div ref="railEl" class="research-rail" aria-label="左栏极窄摘要入口">
      <button
        type="button"
        class="research-rail__entry research-rail__entry--overview"
        title="QTrade 报价概览"
        @click="emit('openQuoteOverview')"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 12V4l3 4 3-6 3 5 3-3v8H2z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" fill="none"/></svg>
        <span>概览</span>
      </button>
      <button
        type="button"
        class="research-rail__toggle"
        :class="{ 'is-open': drawerOpen }"
        :aria-expanded="drawerOpen"
        aria-controls="research-summary-drawer"
        @click="drawerOpen ? drawerOpen = false : openSummaryDrawer()"
      >
        <strong>摘要</strong>
        <span>{{ cards.length }}</span>
      </button>
      <button
        v-for="card in cards"
        :key="card.id"
        type="button"
        class="research-rail__item"
        :class="[`is-${card.status}`, { 'is-active': activeCard?.id === card.id }]"
        :title="`${card.title}：${card.value}`"
        @click="openSummaryDrawer"
      >
        <span>{{ card.title.slice(0, 1) }}</span>
        <i v-if="card.status !== 'normal'"></i>
      </button>
    </div>

    <div class="research-grid">
      <button
        v-for="card in cards"
        :key="card.id"
        type="button"
        class="research-card"
        :class="[`is-${card.status}`]"
        @click="openCard(card)"
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

    <aside
      id="research-summary-drawer"
      ref="drawerEl"
      class="research-drawer"
      :class="{ 'is-open': drawerOpen }"
      aria-label="左栏摘要滑出层"
      :aria-hidden="!drawerOpen"
    >
      <div class="research-drawer__head">
        <div>
          <p class="eyebrow">左栏 · 摘要</p>
          <h3>关键数据</h3>
        </div>
        <button class="close-button" type="button" @click="drawerOpen = false" aria-label="收起摘要">×</button>
      </div>

      <div class="research-drawer__list">
        <button
          v-for="card in cards"
          :key="card.id"
          type="button"
          class="research-card research-card--drawer"
          :class="[`is-${card.status}`]"
          @click="openCard(card)"
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
    </aside>

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
