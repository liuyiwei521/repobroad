<script setup lang="ts">
import type { ChatThread } from '../../data/mockData';
import { tenorLabel } from '../../data/mockData';
import type { OpponentThreadView } from './types';

defineProps<{
  item: OpponentThreadView;
}>();

const emit = defineEmits<{
  openChat: [chat: ChatThread, event: MouseEvent];
}>();

const formatAmount = (amount: number | undefined | null) => {
  if (amount == null || amount <= 0) return '';
  return Number.isInteger(amount) ? String(amount) : String(Number(amount.toFixed(1)));
};

const formatRate = (rate: number | undefined | null) => {
  if (rate == null) return '';
  return Number(rate).toFixed(2);
};
</script>

<template>
  <button
    type="button"
    class="opponent-card"
    @click="emit('openChat', item.chat, $event)"
  >
    <div class="opponent-card__header">
      <span class="opponent-card__name">{{ item.chat.username }} · {{ item.chat.counterparty }}</span>
      <span
        class="opponent-card__wait"
        :class="{
          'is-pending': item.chat.status === 'unreplied',
          'is-warm': item.chat.status === 'unreplied' && ((item.level === 'level1' && item.quote?.status === 'second') || (item.level === 'level2' && item.quote?.status === 'best')),
          'is-urgent': item.chat.status === 'unreplied' && item.level === 'level1' && item.quote?.status === 'best'
        }"
      >
        <template v-if="item.chat.status === 'unreplied'">等 {{ item.waitLabel }}</template>
        <template v-else>{{ item.chat.time }}</template>
      </span>
    </div>

    <div class="opponent-card__price-row">
      <span v-if="item.chat.chatAmount" class="opponent-card__volume">{{ formatAmount(item.chat.chatAmount) }}<small>亿</small></span>
      <span v-if="item.chat.chatRate" class="opponent-card__at">@</span>
      <span v-if="item.chat.chatRate" class="opponent-card__rate">{{ formatRate(item.chat.chatRate) }}</span>
      <span v-if="!item.chat.chatAmount && !item.chat.chatRate" class="opponent-card__no-quote">待报价</span>
    </div>

    <div class="opponent-card__tags">
      <span v-if="item.chat.chatTenor" class="opponent-card__tag opponent-card__tag--tenor">{{ tenorLabel(item.chat.chatTenor) }}</span>
      <span v-if="item.chat.chatGroup" class="opponent-card__tag">{{ item.chat.chatGroup }}</span>
      <span v-if="item.chat.chatLimit" class="opponent-card__tag">{{ item.chat.chatLimit }}</span>
      <span v-if="item.chat.collateral" class="opponent-card__tag">{{ item.chat.collateral }}</span>
      <em v-if="item.isBest" class="opponent-card__best">最优</em>
    </div>

    <div class="opponent-card__latest">
      <p>{{ item.chat.latest }}</p>
      <time>{{ item.chat.time }}</time>
    </div>
  </button>
</template>
