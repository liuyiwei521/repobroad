<script setup lang="ts">
import type { ChatThread } from '../../data/mockData';
import type { OpponentThreadView } from './types';

defineProps<{
  item: OpponentThreadView;
}>();

const emit = defineEmits<{
  openChat: [chat: ChatThread, event: MouseEvent];
}>();

const formatAmount = (amount: number) => {
  if (amount <= 0) return '?';
  return Number.isInteger(amount) ? amount.toFixed(0) : amount.toFixed(1);
};

const levelLabel = (level: OpponentThreadView['level']) => (level === 'level1' ? '1级' : '2级');
</script>

<template>
  <button
    type="button"
    class="opponent-card"
    :class="item.chat.status === 'unreplied' ? 'is-unreplied' : 'is-replied'"
    @click="emit('openChat', item.chat, $event)"
  >
    <div class="opponent-card__top">
      <strong>{{ item.chat.username }} · {{ item.chat.counterparty }}</strong>
      <span class="opponent-card__level">{{ levelLabel(item.level) }}</span>
    </div>

    <div class="opponent-card__meta">
      <span class="opponent-card__status">
        <i aria-hidden="true"></i>
        <template v-if="item.chat.status === 'unreplied'">未回 等 {{ item.waitLabel }}</template>
        <template v-else>已回 {{ item.chat.time }}</template>
      </span>
      <span>{{ item.chat.chatTenor }}</span>
      <span>{{ item.chat.chatGroup }}</span>
    </div>

    <div class="opponent-card__trade">
      <strong>{{ formatAmount(item.chat.chatAmount) }}亿 @{{ item.chat.chatRate.toFixed(2) }}</strong>
      <span>{{ item.chat.chatLimit }}</span>
      <span>{{ item.chat.collateral }}</span>
      <em v-if="item.isBest">[最优]</em>
    </div>

    <div class="opponent-card__latest">
      <p>{{ item.chat.latest }}</p>
      <time>{{ item.chat.time }}</time>
    </div>
  </button>
</template>
