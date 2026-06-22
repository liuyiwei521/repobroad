<script setup lang="ts">
import { computed, ref } from 'vue';
import { normalizeChatTenor, type AccountRow, type ChatStatus, type ChatThread, type Direction, type MarketGroupSummary, type MarketQuote, type QuoteLevel, type Tenor } from '../data/mockData';
import DirectionSection from './market/DirectionSection.vue';
import MarketFilterBar from './market/MarketFilterBar.vue';
import MarketTitleBar from './market/MarketTitleBar.vue';
import OpponentList from './market/OpponentList.vue';
import type { DirectionSectionView, OpponentThreadView, QuoteLine } from './market/types';
import { useQuoteColumns } from '../composables/useQuoteColumns';
import { accountTypeOf, type TaskOverviewFilter } from '../composables/useTaskOverviewMatrix';

const { columnTemplate } = useQuoteColumns();

type PopupAnchor = { x: number; y: number };
type AmountUnit = '亿' | '万';

const props = defineProps<{
  quotes: MarketQuote[];
  groupSummaries: MarketGroupSummary[];
  chats: ChatThread[];
  accounts: AccountRow[];
  tenors: Tenor[];
  selectedAccount: AccountRow | undefined;
  selectedQuoteId: string;
  overviewFilter: TaskOverviewFilter | null;
}>();

const emit = defineEmits<{
  openQuote: [quote: MarketQuote, tenor: Tenor];
  sendQuote: [quote: MarketQuote, tenor: Tenor];
  openChat: [chat: ChatThread, anchor?: PopupAnchor];
  clearOverviewFilter: [];
}>();

const activeView = ref<'opponents' | 'market'>('opponents');
const activeLevel = ref<QuoteLevel>('level1');
const activeTenor = ref<Tenor | 'all'>('all');
const activeDirection = ref<Direction>('reverse');
const opponentStatus = ref<ChatStatus | 'all'>('unreplied');
const opponentLevel = ref<QuoteLevel>('level1');
const onlySame = ref(false);
const minTenor = ref<Tenor | ''>('');
const maxTenor = ref<Tenor | ''>('');
const minAmount = ref('');
const maxAmount = ref('');
const amountUnit = ref<AmountUnit>('亿');
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

const amountUnitDivisor: Record<AmountUnit, number> = {
  亿: 1,
  万: 10000
};

const normalizeAmountFilterValue = (value: string) => {
  const parsed = parseOptionalNumber(value);
  if (parsed === null) return null;
  return parsed / amountUnitDivisor[amountUnit.value];
};

const normalizeText = (value: string | undefined | null) => String(value ?? '').toLowerCase();
const currentLevel = computed(() => (activeView.value === 'opponents' ? opponentLevel.value : activeLevel.value));
const setCurrentLevel = (value: QuoteLevel) => {
  if (activeView.value === 'opponents') {
    opponentLevel.value = value;
  } else {
    activeLevel.value = value;
  }
};

const tenorIndex = computed(() => new Map(props.tenors.map((tenor, index) => [tenor, index])));
const tenorInRange = (tenor: Tenor) => {
  const index = tenorIndex.value.get(tenor);
  if (index === undefined) return false;
  const minIndex = minTenor.value ? tenorIndex.value.get(minTenor.value) : undefined;
  const maxIndex = maxTenor.value ? tenorIndex.value.get(maxTenor.value) : undefined;
  const lower = minIndex ?? 0;
  const upper = maxIndex ?? props.tenors.length - 1;
  return index >= Math.min(lower, upper) && index <= Math.max(lower, upper);
};

const accountById = computed(() => new Map(props.accounts.map((account) => [account.id, account])));
const quoteById = computed(() => new Map(props.quotes.map((quote) => [quote.id, quote])));

const overviewFilterChips = computed(() => {
  const filter = props.overviewFilter;
  if (!filter) return [];

  const chips: Array<{ key: string; label: string }> = [];
  if (filter.term) chips.push({ key: 'term', label: filter.term });
  if (filter.pledgeRequirement) chips.push({ key: 'pledge', label: filter.pledgeRequirement });
  else if (filter.pledgeGroup?.length) chips.push({ key: 'pledge', label: filter.pledgeGroupLabel ?? filter.pledgeGroup.join('/') });
  if (filter.accountType) chips.push({ key: 'account', label: filter.accountType });
  if (chips.length === 0 && filter.label) chips.push({ key: 'label', label: filter.label });
  return chips;
});

const clearOverviewFilter = () => {
  emit('clearOverviewFilter');
};

const textHasAny = (source: string, needles: string[]) => {
  const normalizedSource = normalizeText(source);
  return needles.some((needle) => normalizedSource.includes(normalizeText(needle)));
};

const pledgeAliases: Record<string, string[]> = {
  利率债: ['利率债', '利率', '国债'],
  地方债: ['地方债', '地方'],
  国股存单: ['国股存单', '存单', '商金存单', '大行存单', 'CD'],
  同业存单: ['同业存单', '存单', '国股存单', '商金存单', '大行存单', 'CD'],
  信用债: ['信用债', '信用', '年金户', '债基'],
  非公开定向融资工具PPN: ['非公开定向融资工具', 'PPN'],
  次级债: ['次级债', '次级'],
  永续债: ['永续债', '永续'],
  资产支持证券ABS: ['资产支持证券', 'ABS'],
  超短融SCP: ['超短融', 'SCP']
};

const accountTypeAliases: Record<string, string[]> = {
  专户: ['专户', '可专户', '不限户'],
  专户定制: ['专户', '可专户', '不限户'],
  '专户【1】': ['专户', '可专户', '不限户'],
  公募: ['公募', '公募户', '基金', '非专户', '不限户'],
  公募户: ['公募', '公募户', '基金', '非专户', '不限户'],
  '公募户【2】': ['公募', '公募户', '基金', '非专户', '不限户'],
  自营: ['自营', '自营户', '证券户', '不限户'],
  自营户: ['自营', '自营户', '证券户', '不限户'],
  证券户: ['自营', '自营户', '证券户', '不限户'],
  '自营户/证券户': ['自营', '自营户', '证券户', '不限户'],
  '自营户/证券户【3】': ['自营', '自营户', '证券户', '不限户'],
  理财: ['理财', '资管', '资管户', '非专户', '可专户', '不限户'],
  资管: ['理财', '资管', '资管户', '非专户', '可专户', '不限户'],
  资管户: ['理财', '资管', '资管户', '非专户', '可专户', '不限户'],
  '资管户【4】': ['理财', '资管', '资管户', '非专户', '可专户', '不限户'],
  信托户: ['信托', '信托户', '不限户'],
  私募户: ['私募', '私募户', '不限户'],
  年金: ['年金', '年金户'],
  年金户: ['年金', '年金户'],
  '年金户【7】': ['年金', '年金户'],
  社保户: ['社保', '社保户'],
  养老金户: ['养老金', '养老金户'],
  组合户: ['组合', '组合户'],
  '老户/旧户': ['老户', '旧户']
};

const matchesPledge = (pledgeRequirement: string | undefined, ...fields: string[]) => {
  if (!pledgeRequirement) return true;
  const aliases = pledgeAliases[pledgeRequirement] ?? [pledgeRequirement];
  return textHasAny(fields.join(' '), aliases);
};

const matchesPledgeGroup = (group: string[] | undefined, ...fields: string[]) => {
  if (!group?.length) return true;
  const aliases = group.flatMap((name) => pledgeAliases[name] ?? [name]);
  return textHasAny(fields.join(' '), aliases);
};

const accountRequirementMatches = (accountType: string | undefined, requirement: string) => {
  if (!accountType) return true;
  const aliases = accountTypeAliases[accountType] ?? [accountType];
  return textHasAny(requirement, aliases);
};

const quoteAccountTypeMatches = (quote: MarketQuote, accountType: string | undefined, requirement: string) => {
  if (!accountType) return true;
  const allowedMatches = quote.allowedAccounts.some((accountId) => {
    const account = accountById.value.get(accountId);
    return account ? accountTypeOf(account) === accountType : false;
  });
  return allowedMatches || accountRequirementMatches(accountType, requirement);
};

const overviewMatchWeights = {
  term: 3,
  pledge: 2,
  account: 2
};

const scoreOverviewQuote = (
  quote: MarketQuote,
  tenor: Tenor,
  accountRequirement: string,
  collateralRequirement: string
) => {
  const filter = props.overviewFilter;
  if (!filter) return 0;

  let score = 0;
  if (filter.term && tenor === filter.term) score += overviewMatchWeights.term;
  if (filter.accountType && quoteAccountTypeMatches(quote, filter.accountType, accountRequirement)) {
    score += overviewMatchWeights.account;
  }
  if (filter.pledgeRequirement && matchesPledge(filter.pledgeRequirement, quote.group, collateralRequirement, quote.collateral)) {
    score += overviewMatchWeights.pledge;
  } else if (filter.pledgeGroup?.length && matchesPledgeGroup(filter.pledgeGroup, quote.group, collateralRequirement, quote.collateral)) {
    score += overviewMatchWeights.pledge;
  }
  return score;
};

const scoreOverviewChat = (chat: ChatThread) => {
  const filter = props.overviewFilter;
  if (!filter) return 0;

  let score = 0;
  if (filter.term && normalizeChatTenor(chat.chatTenor) === filter.term) score += overviewMatchWeights.term;
  if (filter.accountType && accountRequirementMatches(filter.accountType, chat.chatLimit ?? '')) {
    score += overviewMatchWeights.account;
  }
  if (filter.pledgeRequirement && matchesPledge(filter.pledgeRequirement, chat.chatGroup ?? '', chat.collateral ?? '')) {
    score += overviewMatchWeights.pledge;
  } else if (filter.pledgeGroup?.length && matchesPledgeGroup(filter.pledgeGroup, chat.chatGroup ?? '', chat.collateral ?? '')) {
    score += overviewMatchWeights.pledge;
  }
  return score;
};

const MARKET_CLOCK_MINUTES = 11 * 60;

const clockMinutes = (time: string) => {
  const [hour, minute] = time.split(':').map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return 0;
  return hour * 60 + minute;
};

const waitMinutesOf = (chat: ChatThread) => {
  if (chat.waitMinutes !== undefined) return chat.waitMinutes;
  const minutes = MARKET_CLOCK_MINUTES - clockMinutes(chat.time);
  return Math.max(minutes, 1);
};

const filteredOpponentItems = computed<OpponentThreadView[]>(() => {
  const minAmountValue = normalizeAmountFilterValue(minAmount.value);
  const maxAmountValue = normalizeAmountFilterValue(maxAmount.value);
  const minRateValue = parseOptionalNumber(minRate.value);
  const maxRateValue = parseOptionalNumber(maxRate.value);
  const accountKeywordValue = accountKeyword.value.trim().toLowerCase();
  const collateralKeywordValue = collateralKeyword.value.trim().toLowerCase();

  return props.chats
    .map((chat) => {
      const quote = quoteById.value.get(chat.relatedQuoteId);
      return {
        id: chat.id,
        chat,
        quote,
        level: quote?.level ?? 'level1',
        isBest: quote?.status === 'best',
        waitLabel: `${waitMinutesOf(chat)}min`,
        overviewScore: scoreOverviewChat(chat)
      };
    })
    .filter((item) => {
      if (props.overviewFilter && (item.overviewScore ?? 0) <= 0) return false;
      if (opponentStatus.value !== 'all' && item.chat.status !== opponentStatus.value) return false;
      if (item.level !== opponentLevel.value) return false;
      if (onlySame.value && props.selectedAccount && !item.quote?.allowedAccounts.includes(props.selectedAccount.id)) return false;

      const chatTenor = normalizeChatTenor(item.chat.chatTenor);
      if ((minTenor.value || maxTenor.value) && (!chatTenor || !tenorInRange(chatTenor))) return false;
      if (minAmountValue !== null && (item.chat.chatAmount ?? 0) < minAmountValue) return false;
      if (maxAmountValue !== null && (item.chat.chatAmount ?? 0) > maxAmountValue) return false;
      if (minRateValue !== null && (item.chat.chatRate ?? 0) < minRateValue) return false;
      if (maxRateValue !== null && (item.chat.chatRate ?? 0) > maxRateValue) return false;
      if (accountKeywordValue && !normalizeText(item.chat.chatLimit).includes(accountKeywordValue)) return false;
      if (collateralKeywordValue && !normalizeText(`${item.chat.chatGroup ?? ''} ${item.chat.collateral ?? ''}`).includes(collateralKeywordValue)) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (props.overviewFilter) {
        const overviewRank = (b.overviewScore ?? 0) - (a.overviewScore ?? 0);
        if (overviewRank !== 0) return overviewRank;
      }
      const statusRankA = a.chat.status === 'unreplied' ? 0 : 1;
      const statusRankB = b.chat.status === 'unreplied' ? 0 : 1;
      return statusRankA - statusRankB || clockMinutes(b.chat.time) - clockMinutes(a.chat.time);
    });
});

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
  const minAmountValue = normalizeAmountFilterValue(minAmount.value);
  const maxAmountValue = normalizeAmountFilterValue(maxAmount.value);
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
      if ((minTenor.value || maxTenor.value) && !tenorInRange(tenor)) continue;
      const rate = quote.rates[tenor] ?? (quote.tenor === tenor ? quote.rate : undefined);
      if (!rate) continue;

      const amount = quote.tenorAmounts[tenor] ?? quote.amount ?? 0;
      if (minAmountValue !== null && amount < minAmountValue) continue;
      if (maxAmountValue !== null && amount > maxAmountValue) continue;
      if (minRateValue !== null && rate < minRateValue) continue;
      if (maxRateValue !== null && rate > maxRateValue) continue;

      const accountRequirement = quote.accountRequirement || quote.limit;
      const collateralRequirement = quote.collateralRequirement || quote.collateral;
      const overviewScore = scoreOverviewQuote(quote, tenor, accountRequirement, collateralRequirement);
      if (props.overviewFilter && overviewScore <= 0) continue;
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
        isSent: Boolean(quote.sent),
        overviewScore
      });
    }
  }

  if (props.overviewFilter) {
    lines.sort((a, b) => (b.overviewScore ?? 0) - (a.overviewScore ?? 0));
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
  <section class="panel market-panel" aria-label="右栏对手列表与行情">
    <div class="market-panel__switchbar">
      <div class="right-view-tabs" aria-label="右栏视图">
        <button :class="{ 'is-active': activeView === 'opponents' }" type="button" @click="activeView = 'opponents'">
          对手列表
        </button>
        <button :class="{ 'is-active': activeView === 'market' }" type="button" @click="activeView = 'market'">
          行情看板
        </button>
      </div>
    </div>

    <div v-if="overviewFilterChips.length" class="market-panel__filter-line">
      <span>当前过滤:</span>
      <button
        v-for="chip in overviewFilterChips"
        :key="chip.key"
        class="filter-chip-button"
        type="button"
        @click="clearOverviewFilter"
      >
        {{ chip.label }} ×
      </button>
      <button class="filter-clear-button" type="button" @click="clearOverviewFilter">清除全部</button>
    </div>

    <MarketFilterBar
      :active-level="currentLevel"
      :tenors="tenors"
      :min-tenor="minTenor"
      :max-tenor="maxTenor"
      :min-amount="minAmount"
      :max-amount="maxAmount"
      :amount-unit="amountUnit"
      :min-rate="minRate"
      :max-rate="maxRate"
      :account-keyword="accountKeyword"
      :collateral-keyword="collateralKeyword"
      :only-same="onlySame"
      @update:active-level="setCurrentLevel"
      @update:min-tenor="minTenor = $event"
      @update:max-tenor="maxTenor = $event"
      @update:min-amount="minAmount = $event"
      @update:max-amount="maxAmount = $event"
      @update:amount-unit="amountUnit = $event"
      @update:min-rate="minRate = $event"
      @update:max-rate="maxRate = $event"
      @update:account-keyword="accountKeyword = $event"
      @update:collateral-keyword="collateralKeyword = $event"
      @update:only-same="onlySame = $event"
      @export-quotes="exportQuotes"
    />

    <OpponentList
      v-if="activeView === 'opponents'"
      v-model:active-status="opponentStatus"
      v-model:active-level="opponentLevel"
      :items="filteredOpponentItems"
      :show-level-controls="false"
      @open-chat="openChatItem"
    />

    <div v-else class="market-board-view">
      <div class="market-top">
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
    </div>
  </section>
</template>
