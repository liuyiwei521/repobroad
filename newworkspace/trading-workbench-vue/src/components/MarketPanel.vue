<script setup lang="ts">
import { computed, ref } from 'vue';
import type { AccountRow, ChatThread, Direction, MarketQuote, Tenor } from '../data/mockData';

const props = defineProps<{
  quotes: MarketQuote[];
  chats: ChatThread[];
  tenors: Tenor[];
  selectedAccount: AccountRow | undefined;
  selectedQuoteId: string;
}>();

const emit = defineEmits<{
  openQuote: [quote: MarketQuote, tenor: Tenor];
  sendQuote: [quote: MarketQuote, tenor: Tenor];
  openChat: [chat: ChatThread];
}>();

const activeLevel = ref<'level1' | 'level2'>('level1');
const activeTenor = ref<Tenor | 'all'>('all');
const chatTab = ref<'unreplied' | 'replied' | 'all'>('unreplied');
const onlySame = ref(false);
const direction = ref<Direction>('reverse');

const filteredQuotes = computed(() => {
  return props.quotes.filter((quote) => {
    if (quote.direction !== direction.value) return false;
    if (onlySame.value && props.selectedAccount && !quote.allowedAccounts.includes(props.selectedAccount.id)) {
      return false;
    }
    if (activeTenor.value !== 'all' && !quote.rates[activeTenor.value]) {
      return false;
    }
    return true;
  });
});

const quoteGroups = computed(() => {
  const groups = new Map<string, MarketQuote[]>();
  for (const quote of filteredQuotes.value) {
    groups.set(quote.group, [...(groups.get(quote.group) ?? []), quote]);
  }
  return Array.from(groups.entries());
});

const filteredChats = computed(() => {
  return props.chats.filter((chat) => {
    const relatedQuote = props.quotes.find((q) => q.id === chat.relatedQuoteId);
    if (relatedQuote && relatedQuote.direction !== direction.value) return false;
    if (chatTab.value === 'all') return true;
    return chat.status === chatTab.value;
  });
});

const isMatch = (quote: MarketQuote, tenor: Tenor) => {
  if (!props.selectedAccount) return false;
  const rate = quote.rates[tenor];
  return Boolean(
    rate &&
    quote.allowedAccounts.includes(props.selectedAccount.id) &&
    props.selectedAccount.tenor === tenor &&
    rate >= props.selectedAccount.breakevenRate
  );
};

const groupTotal = (rows: MarketQuote[]) =>
  rows.reduce((s, q) => s + q.amount, 0).toFixed(0);

const groupAvgRate = (rows: MarketQuote[]) => {
  let sum = 0, count = 0;
  for (const q of rows) {
    for (const rate of Object.values(q.rates)) {
      if (rate) { sum += rate; count++; }
    }
  }
  return count > 0 ? (sum / count).toFixed(2) : '--';
};
</script>

<template>
  <section class="panel market-panel" aria-label="右栏非银行情与聊天">
    <div class="market-top">
      <div class="panel__head">
        <div>
          <p class="eyebrow">右栏 · 主战场</p>
          <h2>非银报价盘</h2>
        </div>
        <div class="head-controls">
          <div class="segmented" aria-label="方向">
            <button :class="{ 'is-active': direction === 'reverse' }" type="button" @click="direction = 'reverse'">逆回购</button>
            <button :class="{ 'is-active': direction === 'repo' }" type="button" @click="direction = 'repo'">正回购</button>
          </div>
          <div class="segmented" aria-label="级别">
            <button :class="{ 'is-active': activeLevel === 'level1' }" type="button" @click="activeLevel = 'level1'">1级</button>
            <button :class="{ 'is-active': activeLevel === 'level2' }" type="button" @click="activeLevel = 'level2'">2级</button>
          </div>
        </div>
      </div>

      <div class="filters">
        <select v-model="activeTenor" aria-label="期限筛选">
          <option value="all">全部期限</option>
          <option v-for="tenor in tenors" :key="tenor" :value="tenor">{{ tenor }}</option>
        </select>
        <label class="switch-line">
          <input v-model="onlySame" type="checkbox" />
          <span>仅看匹配账户</span>
        </label>
        <span class="filter-chip">金额 5-20 亿</span>
        <span class="filter-chip">利率 ≥ 保本</span>
      </div>

      <div class="tenor-tabs" role="tablist" aria-label="期限标签">
        <button :class="{ 'is-active': activeTenor === 'all' }" type="button" @click="activeTenor = 'all'">全部</button>
        <button
          v-for="tenor in tenors"
          :key="tenor"
          :class="{ 'is-active': activeTenor === tenor }"
          type="button"
          @click="activeTenor = tenor"
        >
          {{ tenor }}
        </button>
      </div>

      <div class="quote-board">
        <section v-for="[group, rows] in quoteGroups" :key="group" class="quote-group">
          <div class="quote-group__title">
            <span>{{ group }}</span>
            <span class="group-stats">金额 {{ groupTotal(rows) }}亿 · 均价 {{ groupAvgRate(rows) }}%</span>
          </div>
          <div class="quote-row quote-row--head">
            <span>状态</span>
            <span>发送机构</span>
            <span v-for="tenor in tenors" :key="tenor">{{ tenor }}</span>
            <span>限户</span>
          </div>
          <div
            v-for="quote in rows"
            :key="quote.id"
            class="quote-row"
            :class="{ 'is-selected': quote.id === selectedQuoteId }"
          >
            <span>
              <i class="quote-tag" :class="`is-${quote.status}`">
                {{ quote.status === 'best' ? '最优' : quote.status === 'second' ? '次优' : '普通' }}
              </i>
            </span>
            <strong>{{ quote.counterparty }}</strong>
            <button
              v-for="tenor in tenors"
              :key="tenor"
              type="button"
              class="quote-cell"
              :class="{ 'is-match': isMatch(quote, tenor), 'is-sent': quote.sent }"
              :disabled="!quote.rates[tenor]"
              @click="quote.rates[tenor] && emit('openQuote', quote, tenor)"
              @dblclick="quote.rates[tenor] && emit('sendQuote', quote, tenor)"
            >
              <template v-if="quote.rates[tenor]">
                <span class="cell-rate">{{ quote.rates[tenor]?.toFixed(2) }}</span>
                <span class="cell-amount" v-if="quote.tenorAmounts[tenor]">{{ quote.tenorAmounts[tenor] }}</span>
              </template>
              <template v-else>--</template>
            </button>
            <span>{{ quote.limit }}</span>
          </div>
        </section>

        <div v-if="quoteGroups.length === 0" class="empty-state">
          当前方向暂无报价
        </div>
      </div>
    </div>

    <div class="chat-index">
      <div class="chat-index__head">
        <strong>历史聊天对手</strong>
        <div class="mini-tabs">
          <button :class="{ 'is-active': chatTab === 'unreplied' }" type="button" @click="chatTab = 'unreplied'">未回复</button>
          <button :class="{ 'is-active': chatTab === 'replied' }" type="button" @click="chatTab = 'replied'">已回复</button>
          <button :class="{ 'is-active': chatTab === 'all' }" type="button" @click="chatTab = 'all'">全部</button>
        </div>
      </div>
      <button
        v-for="chat in filteredChats"
        :key="chat.id"
        type="button"
        class="chat-item"
        :class="{ 'is-unreplied': chat.status === 'unreplied' }"
        @click="emit('openChat', chat)"
        @dblclick="emit('openChat', chat)"
      >
        <div class="chat-line1">
          <span class="chat-line1__context">
            {{ chat.chatTenor }}｜{{ chat.chatGroup }}｜{{ chat.chatLimit }}｜{{ chat.chatAmount.toFixed(1) }}亿｜@{{ chat.chatRate.toFixed(2) }}｜{{ chat.collateral }}
          </span>
          <span v-if="chat.unread" class="chat-badge">{{ chat.unread }}</span>
        </div>
        <div class="chat-line2">
          <span class="chat-line2__meta">
            <b>{{ chat.username }}</b>｜{{ chat.counterparty }}　{{ chat.latest }}
          </span>
          <span class="chat-time">{{ chat.time }}</span>
        </div>
      </button>
    </div>
  </section>
</template>
