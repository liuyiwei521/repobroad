<script setup lang="ts">
import { computed, ref } from 'vue';
import type { AccountRow, ChatThread, Direction, MarketGroupSummary, MarketQuote, QuoteLevel, Tenor } from '../data/mockData';
import DirectionSection from './market/DirectionSection.vue';
import MarketFilterBar from './market/MarketFilterBar.vue';
import MarketTitleBar from './market/MarketTitleBar.vue';
import type { DirectionSectionView, QuoteLine } from './market/types';

const props = defineProps<{
  quotes: MarketQuote[];
  groupSummaries: MarketGroupSummary[];
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

const activeLevel = ref<QuoteLevel>('level1');
const activeTenor = ref<Tenor | 'all'>('all');
const chatTab = ref<'unreplied' | 'replied' | 'all'>('unreplied');
const onlySame = ref(false);
const minAmount = ref('');
const maxAmount = ref('');
const minRate = ref('');
const maxRate = ref('');
const correctionLine = ref<QuoteLine | null>(null);
const correctionAmount = ref('');
const correctionRate = ref('');
const correctedLineId = ref('');

const directionLabels: Record<Direction, string> = {
  reverse: '逆回购报价',
  repo: '正回购报价'
};

const directionOrder: Direction[] = ['reverse', 'repo'];
const groupOrder = ['利率地方', '存单商金', '信用'];

const parseOptionalNumber = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

const summaryIndex = computed(() => {
  const index = new Map<string, MarketGroupSummary>();
  for (const summary of props.groupSummaries) {
    index.set(`${summary.direction}-${summary.level}-${summary.group}`, summary);
  }
  return index;
});

const isMatch = (quote: MarketQuote, tenor: Tenor, rate: number) => {
  if (!props.selectedAccount) return false;
  return Boolean(
    quote.allowedAccounts.includes(props.selectedAccount.id) &&
    props.selectedAccount.tenor === tenor &&
    rate >= props.selectedAccount.breakevenRate
  );
};

const quoteLines = computed<QuoteLine[]>(() => {
  const minAmountValue = parseOptionalNumber(minAmount.value);
  const maxAmountValue = parseOptionalNumber(maxAmount.value);
  const minRateValue = parseOptionalNumber(minRate.value);
  const maxRateValue = parseOptionalNumber(maxRate.value);
  const lines: QuoteLine[] = [];

  for (const quote of props.quotes) {
    if (quote.level !== activeLevel.value) continue;
    if (onlySame.value && props.selectedAccount && !quote.allowedAccounts.includes(props.selectedAccount.id)) continue;

    const candidateTenors = quote.tenor ? [quote.tenor] : props.tenors;
    for (const tenor of candidateTenors) {
      if (activeTenor.value !== 'all' && tenor !== activeTenor.value) continue;
      const rate = quote.rates[tenor] ?? (quote.tenor === tenor ? quote.rate : undefined);
      if (!rate) continue;

      const amount = quote.tenorAmounts[tenor] ?? quote.amount ?? 0;
      if (minAmountValue !== null && amount < minAmountValue) continue;
      if (maxAmountValue !== null && amount > maxAmountValue) continue;
      if (minRateValue !== null && rate < minRateValue) continue;
      if (maxRateValue !== null && rate > maxRateValue) continue;

      lines.push({
        id: quote.tenor === tenor ? quote.id : `${quote.id}-${tenor}`,
        quote,
        direction: quote.direction,
        group: quote.group,
        institution: quote.institution || quote.counterparty,
        tenor,
        amount,
        rate,
        accountRequirement: quote.accountRequirement || quote.limit,
        collateralRequirement: quote.collateralRequirement || quote.collateral,
        updatedAt: quote.updatedAt,
        status: quote.status,
        isMatched: isMatch(quote, tenor, rate),
        isSelected: quote.id === props.selectedQuoteId || correctedLineId.value === (quote.tenor === tenor ? quote.id : `${quote.id}-${tenor}`),
        isSent: Boolean(quote.sent)
      });
    }
  }

  return lines;
});

const directionSections = computed<DirectionSectionView[]>(() => {
  return directionOrder
    .map((direction) => {
      const groups = new Map<string, QuoteLine[]>();
      for (const line of quoteLines.value) {
        if (line.direction !== direction) continue;
        groups.set(line.group, [...(groups.get(line.group) ?? []), line]);
      }

      const viewGroups = Array.from(groups.entries())
        .sort(([a], [b]) => {
          const indexA = groupOrder.indexOf(a);
          const indexB = groupOrder.indexOf(b);
          return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
        })
        .map(([group, rows]) => {
          const totalAmount = Number(rows.reduce((sum, row) => sum + row.amount, 0).toFixed(2));
          const avgRate = Number((rows.reduce((sum, row) => sum + row.rate, 0) / Math.max(rows.length, 1)).toFixed(2));
          return {
            key: `${direction}-${activeLevel.value}-${group}`,
            group,
            summary: summaryIndex.value.get(`${direction}-${activeLevel.value}-${group}`),
            totalAmount,
            avgRate,
            rows
          };
        });

      return {
        direction,
        title: directionLabels[direction],
        activeLevel: activeLevel.value,
        totalLevels: 2,
        groups: viewGroups
      };
    })
    .filter((section) => section.groups.length > 0);
});

const filteredChats = computed(() => {
  return props.chats.filter((chat) => {
    if (chatTab.value === 'all') return true;
    return chat.status === chatTab.value;
  });
});

const quoteForLine = (line: QuoteLine): MarketQuote => ({
  ...line.quote,
  institution: line.institution,
  counterparty: line.institution,
  tenor: line.tenor,
  amount: line.amount,
  rate: line.rate,
  accountRequirement: line.accountRequirement,
  limit: line.accountRequirement,
  collateralRequirement: line.collateralRequirement,
  collateral: line.collateralRequirement,
  updatedAt: line.updatedAt,
  rates: { ...line.quote.rates, [line.tenor]: line.rate },
  tenorAmounts: { ...line.quote.tenorAmounts, [line.tenor]: line.amount }
});

const openLine = (line: QuoteLine) => {
  emit('openQuote', quoteForLine(line), line.tenor);
};

const sendLine = (line: QuoteLine) => {
  emit('sendQuote', quoteForLine(line), line.tenor);
};

const correctLine = (line: QuoteLine) => {
  correctionLine.value = line;
  correctionAmount.value = line.amount > 0 ? line.amount.toString() : '';
  correctionRate.value = line.rate.toFixed(2);
};

const closeCorrection = () => {
  correctionLine.value = null;
};

const applyCorrection = () => {
  if (!correctionLine.value) return;
  const lineId = correctionLine.value.id;
  correctedLineId.value = lineId;
  window.setTimeout(() => {
    if (correctedLineId.value === lineId) correctedLineId.value = '';
  }, 1600);
  closeCorrection();
};

const csvCell = (value: string | number) => {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const exportQuotes = () => {
  const rows = [
    ['方向', '分组', '机构', '期限', '金额', '利率', '账户要求', '质押要求', '获取时间', '标签'],
    ...quoteLines.value.map((line) => [
      directionLabels[line.direction],
      line.group,
      line.institution,
      line.tenor,
      line.amount,
      line.rate.toFixed(2),
      line.accountRequirement,
      line.collateralRequirement,
      line.updatedAt,
      line.status === 'best' ? '最优' : line.status === 'second' ? '次优' : '普通'
    ])
  ];
  const blob = new Blob([`\ufeff${rows.map((row) => row.map(csvCell).join(',')).join('\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'market-quotes.csv';
  anchor.click();
  URL.revokeObjectURL(url);
};
</script>

<template>
  <section class="panel market-panel" aria-label="右栏非银行情与聊天">
    <div class="market-top">
      <MarketFilterBar
        v-model:active-level="activeLevel"
        v-model:min-amount="minAmount"
        v-model:max-amount="maxAmount"
        v-model:min-rate="minRate"
        v-model:max-rate="maxRate"
        v-model:only-same="onlySame"
        @export-quotes="exportQuotes"
      />

      <MarketTitleBar v-model:active-tenor="activeTenor" :tenors="tenors" />

      <div class="quote-board">
        <DirectionSection
          v-for="section in directionSections"
          :key="section.direction"
          :section="section"
          @open-line="openLine"
          @correct-line="correctLine"
          @send-line="sendLine"
        />

        <div v-if="directionSections.length === 0" class="empty-state market-empty">
          当前筛选条件下暂无报价
        </div>
      </div>

      <div v-if="correctionLine" class="quote-correction-popover" role="dialog" aria-label="修正报价">
        <div class="quote-correction-popover__head">
          <strong>修正报价</strong>
          <button class="close-button" type="button" aria-label="关闭修正弹窗" @click="closeCorrection">×</button>
        </div>
        <p>{{ correctionLine.institution }} · {{ correctionLine.tenor }} · {{ correctionLine.group }}</p>
        <label>
          <span>金额</span>
          <input v-model="correctionAmount" type="number" min="0" step="0.1" />
          <small>亿</small>
        </label>
        <label>
          <span>利率</span>
          <input v-model="correctionRate" type="number" min="0" step="0.01" />
          <small>%</small>
        </label>
        <div class="quote-correction-popover__actions">
          <button type="button" @click="closeCorrection">取消</button>
          <button type="button" @click="applyCorrection">确认</button>
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
