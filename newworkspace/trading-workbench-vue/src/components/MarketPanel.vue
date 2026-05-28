<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import type { AccountRow, ChatThread, Direction, MarketGroupSummary, MarketQuote, QuoteLevel, Tenor } from '../data/mockData';
import DirectionSection from './market/DirectionSection.vue';
import MarketFilterBar from './market/MarketFilterBar.vue';
import MarketTitleBar from './market/MarketTitleBar.vue';
import type { DirectionSectionView, QuoteLine } from './market/types';
import { useQuoteColumns } from '../composables/useQuoteColumns';

const { columnTemplate } = useQuoteColumns();

type PopupAnchor = { x: number; y: number };

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
  openChat: [chat: ChatThread, anchor?: PopupAnchor];
}>();

const activeLevel = ref<QuoteLevel>('level1');
const activeTenor = ref<Tenor | 'all'>('all');
const activeDirection = ref<Direction>('reverse');
const chatTab = ref<'unreplied' | 'replied' | 'all'>('unreplied');
const onlySame = ref(false);
const minAmount = ref('');
const maxAmount = ref('');
const minRate = ref('');
const maxRate = ref('');
const accountKeyword = ref('');
const collateralKeyword = ref('');

const directionLabels: Record<Direction, string> = {
  reverse: '逆回购报价',
  repo: '正回购报价'
};

const directionOrder: Direction[] = ['reverse', 'repo'];
const directionTabs = directionOrder.map((value) => ({
  value,
  label: value === 'reverse' ? '逆回购' : '正回购'
}));
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
  const accountKeywordValue = accountKeyword.value.trim().toLowerCase();
  const collateralKeywordValue = collateralKeyword.value.trim().toLowerCase();
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

      const accountRequirement = quote.accountRequirement || quote.limit;
      const collateralRequirement = quote.collateralRequirement || quote.collateral;
      if (accountKeywordValue && !String(accountRequirement ?? '').toLowerCase().includes(accountKeywordValue)) continue;
      if (collateralKeywordValue && !String(collateralRequirement ?? '').toLowerCase().includes(collateralKeywordValue)) continue;

      lines.push({
        id: quote.tenor === tenor ? quote.id : `${quote.id}-${tenor}`,
        quote,
        direction: quote.direction,
        group: quote.group,
        institution: quote.institution || quote.counterparty,
        tenor,
        amount,
        rate,
        accountRequirement,
        collateralRequirement,
        updatedAt: quote.updatedAt,
        status: quote.status,
        isMatched: isMatch(quote, tenor, rate),
        isSelected: quote.id === props.selectedQuoteId,
        isSent: Boolean(quote.sent)
      });
    }
  }

  return lines;
});

const directionSections = computed<DirectionSectionView[]>(() => {
  return [activeDirection.value]
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

const openChatItem = (chat: ChatThread, event: MouseEvent) => {
  emit('openChat', chat, { x: event.clientX, y: event.clientY });
};

const sendLine = (line: QuoteLine) => {
  emit('sendQuote', quoteForLine(line), line.tenor);
};

// Manually adjustable split between the quote board (top) and the chat index
// (bottom). The chat index keeps a draggable pixel height; the quote board takes
// the remaining space.
const panelRef = ref<HTMLElement | null>(null);
const chatHeight = ref(220);
const CHAT_MIN = 120;
const TOP_MIN = 220;

const panelStyle = computed(() => ({
  gridTemplateRows: `minmax(0, 1fr) 8px ${chatHeight.value}px`
}));

let dragStartY = 0;
let dragStartHeight = 0;

const onChatGutterMove = (event: PointerEvent) => {
  const delta = dragStartY - event.clientY;
  const panelHeight = panelRef.value?.clientHeight ?? 0;
  const max = Math.max(CHAT_MIN, panelHeight - TOP_MIN);
  chatHeight.value = Math.min(Math.max(dragStartHeight + delta, CHAT_MIN), max);
};

const onChatGutterUp = () => {
  document.body.classList.remove('is-row-resizing');
  window.removeEventListener('pointermove', onChatGutterMove);
  window.removeEventListener('pointerup', onChatGutterUp);
};

const onChatGutterDown = (event: PointerEvent) => {
  dragStartY = event.clientY;
  dragStartHeight = chatHeight.value;
  document.body.classList.add('is-row-resizing');
  window.addEventListener('pointermove', onChatGutterMove);
  window.addEventListener('pointerup', onChatGutterUp);
};

onBeforeUnmount(onChatGutterUp);

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
  <section ref="panelRef" class="panel market-panel" aria-label="右栏非银行情与聊天" :style="panelStyle">
    <div class="market-top">
      <MarketFilterBar
        v-model:active-level="activeLevel"
        v-model:min-amount="minAmount"
        v-model:max-amount="maxAmount"
        v-model:min-rate="minRate"
        v-model:max-rate="maxRate"
        v-model:account-keyword="accountKeyword"
        v-model:collateral-keyword="collateralKeyword"
        v-model:only-same="onlySame"
        @export-quotes="exportQuotes"
      />

      <MarketTitleBar
        v-model:active-tenor="activeTenor"
        v-model:active-direction="activeDirection"
        :tenors="tenors"
        :direction-tabs="directionTabs"
      />

      <div class="quote-board" :style="{ '--quote-grid': columnTemplate }">
        <DirectionSection
          v-for="section in directionSections"
          :key="section.direction"
          :section="section"
          @open-line="openLine"
          @send-line="sendLine"
        />

        <div v-if="directionSections.length === 0" class="empty-state market-empty">
          当前筛选条件下暂无报价
        </div>
      </div>
    </div>

    <div
      class="panel-gutter"
      role="separator"
      aria-orientation="horizontal"
      aria-label="拖动调整报价与聊天列表比例"
      title="拖动调整上下比例"
      @pointerdown="onChatGutterDown"
    ></div>

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
        :class="chat.status === 'unreplied' ? 'is-unreplied' : 'is-replied'"
        @click="openChatItem(chat, $event)"
        @dblclick="openChatItem(chat, $event)"
      >
        <div class="chat-line1">
          <span class="chat-line1__context">
            {{ chat.chatTenor }}｜{{ chat.chatGroup }}｜{{ chat.chatLimit }}｜{{ chat.chatAmount.toFixed(1) }}亿｜@{{ chat.chatRate.toFixed(2) }}｜{{ chat.collateral }}
          </span>
          <span class="chat-status">
            {{ chat.status === 'unreplied' ? '未回复' : '已回复' }}
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
