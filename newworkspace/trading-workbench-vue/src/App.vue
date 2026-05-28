<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import AllocationMatrix from './components/AllocationMatrix.vue';
import ChatPopup from './components/ChatPopup.vue';
import MarketPanel from './components/MarketPanel.vue';
import ResearchPanel from './components/ResearchPanel.vue';
import TopBar from './components/TopBar.vue';
import {
  accounts as accountSeed,
  allocationCells as allocationCellSeed,
  chats,
  dealColumns as dealColumnSeed,
  institutions as institutionSeed,
  marketGroupSummaries,
  marketQuotes as quoteSeed,
  pendingAllocations as pendingSeed,
  researchCards,
  tenors,
  type AccountRow,
  type AllocationCell,
  type ChatThread,
  type DealColumn,
  type Institution,
  type MarketQuote,
  type MatrixContext,
  type MatrixContextInput,
  type PendingAllocation,
  type ResearchCard,
  type Tenor
} from './data/mockData';

type PopupAnchor = { x: number; y: number };

const accounts = ref<AccountRow[]>(accountSeed.map((item) => ({ ...item })));
const quotes = ref<MarketQuote[]>(quoteSeed.map((item) => ({ ...item, rates: { ...item.rates }, tenorAmounts: { ...item.tenorAmounts } })));
const pendingAllocations = ref<PendingAllocation[]>(pendingSeed.map((item) => ({ ...item })));
const institutions = ref<Institution[]>(institutionSeed.map((item) => ({ ...item })));
const dealColumns = ref<DealColumn[]>(dealColumnSeed.map((item) => ({ ...item })));
const allocationCells = ref<AllocationCell[]>(allocationCellSeed.map((item) => ({ ...item })));
const initialTrialRate = 1.66;
const trialRate = ref(initialTrialRate);
const baseBreakevenRates = new Map(accountSeed.map((account) => [account.id, account.breakevenRate]));
const baseAllocatedAmounts = new Map(accountSeed.map((account) => [account.id, account.allocatedAmount]));
const quickAllocationTotals = ref<Record<string, number>>({});

const selectedAccountId = ref(accounts.value[0]?.id ?? '');
const selectedQuoteId = ref('');
const activeCard = ref<ResearchCard | null>(null);
const matrixExpanded = ref(false);
const matrixContext = ref<MatrixContext | null>(null);
const lastAction = ref('已加载 mock 数据，点击账户行可联动右栏行情。');
const activeChat = ref<{
  chat: ChatThread;
  quote: MarketQuote;
  tenor: Tenor;
  anchor?: PopupAnchor;
} | null>(null);

const matrixRef = ref<{ save: () => void; collapse: () => void } | null>(null);

const selectedAccount = computed(() => accounts.value.find((account) => account.id === selectedAccountId.value));

const selectedContext = computed(() => {
  if (!selectedAccount.value) return '全账户';
  return `${selectedAccount.value.product} / ${selectedAccount.value.tenor}`;
});

const noticeCount = computed(() => {
  return pendingAllocations.value.length + chats.filter((chat) => chat.status === 'unreplied').length + accounts.value.filter((account) => account.status === 'warning').length;
});

const firstRateTenor = (quote: MarketQuote): Tenor => {
  return tenors.find((tenor) => quote.rates[tenor]) ?? 'R001';
};

const quoteForTenor = (quote: MarketQuote, tenor: Tenor): MarketQuote => {
  const rate = quote.rates[tenor] ?? quote.rate;
  const amount = quote.tenorAmounts[tenor] ?? quote.amount;
  return {
    ...quote,
    tenor,
    rate,
    amount,
    rates: { ...quote.rates, [tenor]: rate },
    tenorAmounts: { ...quote.tenorAmounts, [tenor]: amount }
  };
};

const roundAmount = (value: number) => Number(value.toFixed(2));

const ensureInstitution = (name: string) => {
  const normalizedName = name.trim() || '未命名机构';
  const existing = institutions.value.find((institution) => institution.name === normalizedName);
  if (existing) return existing;

  const next: Institution = {
    id: `inst-live-${Date.now()}-${institutions.value.length + 1}`,
    name: normalizedName
  };
  institutions.value.push(next);
  return next;
};

const nextBatchNo = () => `B${String(dealColumns.value.length + 1).padStart(3, '0')}`;

const createDealColumnFromContext = (input: MatrixContextInput): MatrixContext => {
  const institution = input.institutionId
    ? institutions.value.find((item) => item.id === input.institutionId) ?? ensureInstitution(input.institution ?? input.counterparty)
    : ensureInstitution(input.institution ?? input.counterparty);

  const batchNo = input.batchNo ?? nextBatchNo();
  const dealColumn: DealColumn = {
    id: `deal-live-${Date.now()}-${dealColumns.value.length + 1}`,
    institutionId: institution.id,
    term: input.term,
    dealAmount: roundAmount(input.dealAmount),
    rate: input.rate,
    direction: input.direction,
    dealTime: input.dealTime,
    batchNo,
    source: input.source
  };

  dealColumns.value.unshift(dealColumn);

  return {
    ...input,
    id: `ctx-${Date.now()}`,
    institution: institution.name,
    institutionId: institution.id,
    dealColumnId: dealColumn.id,
    batchNo,
    dealAmount: dealColumn.dealAmount
  };
};

const recomputeAccountAllocations = () => {
  const matrixTotals = new Map<string, number>();
  for (const cell of allocationCells.value) {
    matrixTotals.set(cell.accountId, roundAmount((matrixTotals.get(cell.accountId) ?? 0) + cell.amount));
  }

  for (const account of accounts.value) {
    const baseAmount = baseAllocatedAmounts.get(account.id) ?? 0;
    const quickAmount = quickAllocationTotals.value[account.id] ?? 0;
    const matrixAmount = matrixTotals.get(account.id) ?? 0;
    account.allocatedAmount = Math.min(account.targetAmount, roundAmount(baseAmount + quickAmount + matrixAmount));
    refreshAccountStatus(account);
  }
};

const syncPendingFromMatrixContext = (payload: AllocationCell[]) => {
  const context = matrixContext.value;
  if (!context) return;

  const filled = payload
    .filter((cell) => cell.dealColumnId === context.dealColumnId)
    .reduce((sum, cell) => sum + cell.amount, 0);
  const pendingAmount = Math.max(roundAmount(context.dealAmount - filled), 0);
  const pendingId = context.pendingId ?? (context.source === '待分配' ? context.sourceId : undefined);

  if (pendingId) {
    const index = pendingAllocations.value.findIndex((item) => item.id === pendingId);
    if (pendingAmount <= 0) {
      if (index >= 0) pendingAllocations.value.splice(index, 1);
    } else if (index >= 0) {
      pendingAllocations.value[index] = {
        ...pendingAllocations.value[index],
        amount: pendingAmount,
        rate: context.rate,
        tenor: context.term,
        direction: context.direction,
        time: context.dealTime,
        source: '矩阵未分余额'
      };
    }
    return;
  }

  if (pendingAmount <= 0) return;

  const nextPending: PendingAllocation = {
    id: `pending-matrix-${Date.now()}`,
    counterparty: context.counterparty,
    amount: pendingAmount,
    rate: context.rate,
    tenor: context.term,
    direction: context.direction,
    time: '刚刚',
    source: '矩阵未分余额'
  };
  context.pendingId = nextPending.id;
  pendingAllocations.value.unshift(nextPending);
};

const openMatrix = (contextInput?: MatrixContextInput) => {
  matrixContext.value = contextInput ? createDealColumnFromContext(contextInput) : null;
  matrixExpanded.value = true;
  activeCard.value = null;
  activeChat.value = null;
  lastAction.value = matrixContext.value
    ? `已将 ${matrixContext.value.counterparty} ${matrixContext.value.term} 成交带入矩阵，并新增 ${matrixContext.value.batchNo} 批次列。`
    : '已展开完整分配矩阵，中栏与右栏压缩让位。';
};

const closeMatrix = () => {
  matrixExpanded.value = false;
  matrixContext.value = null;
  lastAction.value = '已收起为矩阵左侧核心列，底部待分配信息保持展示。';
};

const refreshAccountStatus = (account: AccountRow) => {
  const remaining = account.targetAmount - account.allocatedAmount;
  if (remaining <= 0.05) {
    account.status = 'done';
    account.allocatedAmount = account.targetAmount;
  } else if (account.breakevenRate >= 1.7 || remaining >= 8) {
    account.status = 'warning';
  } else {
    account.status = 'normal';
  }
};

const selectAccount = (id: string) => {
  selectedAccountId.value = id;
  const account = accounts.value.find((item) => item.id === id);
  lastAction.value = account
    ? `已选中 ${account.name}，右栏展示匹配 ${account.tenor} 且不低于保本的报价。`
    : '已切换账户。';
};

const moveSelectedAccount = (direction: 1 | -1) => {
  if (accounts.value.length === 0) return;
  const currentIndex = Math.max(accounts.value.findIndex((account) => account.id === selectedAccountId.value), 0);
  const nextIndex = Math.min(Math.max(currentIndex + direction, 0), accounts.value.length - 1);
  const nextAccount = accounts.value[nextIndex];
  if (nextAccount && nextAccount.id !== selectedAccountId.value) selectAccount(nextAccount.id);
};

const applyTrialRate = (rate: number) => {
  trialRate.value = rate;
  const delta = rate - initialTrialRate;
  for (const account of accounts.value) {
    const baseRate = baseBreakevenRates.get(account.id) ?? account.breakevenRate;
    account.breakevenRate = Number((baseRate + delta).toFixed(2));
    refreshAccountStatus(account);
  }
  lastAction.value = `试算利率已应用为 ${rate.toFixed(2)}%，账户保本利率已重算。`;
};

const openQuote = (quote: MarketQuote, tenor: Tenor) => {
  selectedQuoteId.value = quote.id;
  const chat = chats.find((item) => item.relatedQuoteId === quote.id) ?? chats[0];
  activeChat.value = { chat, quote: quoteForTenor(quote, tenor), tenor };
  lastAction.value = `已打开 ${quote.counterparty} ${tenor} 报价聊天，报价摘要已带入弹窗。`;
};

const sendQuote = (quote: MarketQuote, tenor: Tenor) => {
  const target = quotes.value.find((item) => item.id === quote.id);
  if (target) target.sent = true;
  openQuote(quote, tenor);
  lastAction.value = `已向 ${quote.counterparty} 发送 ${tenor} 快捷询价，单元格显示已发送状态。`;
  window.setTimeout(() => {
    const current = quotes.value.find((item) => item.id === quote.id);
    if (current) current.sent = false;
  }, 1600);
};

const openChat = (chat: ChatThread, anchor?: PopupAnchor) => {
  const quote = quotes.value.find((item) => item.id === chat.relatedQuoteId) ?? quotes.value[0];
  if (!quote) return;
  const tenor = chat.chatTenor ?? (
    selectedAccount.value && quote.rates[selectedAccount.value.tenor]
      ? selectedAccount.value.tenor
      : firstRateTenor(quote)
  );
  const quoteContext = {
    ...quoteForTenor(quote, tenor),
    counterparty: chat.counterparty,
    institution: chat.counterparty,
    group: chat.chatGroup,
    amount: chat.chatAmount,
    rate: chat.chatRate,
    limit: chat.chatLimit,
    accountRequirement: chat.chatLimit,
    collateral: chat.collateral,
    collateralRequirement: chat.collateral,
    rates: { ...quote.rates, [tenor]: chat.chatRate },
    tenorAmounts: { ...quote.tenorAmounts, [tenor]: chat.chatAmount }
  };
  selectedQuoteId.value = quote.id;
  activeChat.value = { chat, quote: quoteContext, tenor, anchor };
  lastAction.value = `已打开 ${chat.counterparty} 会话，并定位到最新消息。`;
};

const openPending = (item: PendingAllocation) => {
  openMatrix({
    source: '待分配',
    sourceId: item.id,
    counterparty: item.counterparty,
    institution: item.counterparty,
    term: item.tenor,
    dealAmount: item.amount,
    rate: item.rate,
    direction: item.direction ?? 'reverse',
    dealTime: item.time,
    filledAmount: 0,
    pendingAmount: item.amount,
    aiDraftStatus: '待生成',
    draftCells: []
  });
  lastAction.value = `已从待分配池带入 ${item.counterparty} ${item.tenor}，生成新的成交批次列。`;
};

const saveQuickAllocation = (payload: Array<{ accountId: string; amount: number }>) => {
  for (const item of payload) {
    quickAllocationTotals.value[item.accountId] = roundAmount((quickAllocationTotals.value[item.accountId] ?? 0) + item.amount);
  }
  recomputeAccountAllocations();
  lastAction.value = `快捷分配已保存，${payload.length} 个账户台账已回写。`;
};

const pushPending = (amount: number) => {
  if (!activeChat.value || amount <= 0) return;
  pendingAllocations.value.unshift({
    id: `pending-${Date.now()}`,
    counterparty: activeChat.value.quote.counterparty,
    amount,
    rate: activeChat.value.quote.rates[activeChat.value.tenor] ?? 0,
    tenor: activeChat.value.tenor,
    time: '刚刚',
    source: '快捷分配余额'
  });
  lastAction.value = `剩余 ${amount.toFixed(1)} 亿已挂入左栏待分配池。`;
};

const saveMatrix = (payload: Array<{ accountId: string; dealColumnId: string; amount: number }>) => {
  allocationCells.value = payload.map((item) => ({
    accountId: item.accountId,
    dealColumnId: item.dealColumnId,
    amount: roundAmount(item.amount)
  }));
  recomputeAccountAllocations();
  syncPendingFromMatrixContext(allocationCells.value);
  const accountCount = new Set(payload.map((item) => item.accountId)).size;
  lastAction.value = `矩阵分配已保存，${accountCount} 个账户台账已回写。`;
};

const closeTopLayer = () => {
  if (matrixExpanded.value) {
    matrixRef.value?.collapse();
    return;
  }
  if (activeCard.value) {
    activeCard.value = null;
    return;
  }
  if (activeChat.value) {
    activeChat.value = null;
  }
};

const isEditingTarget = (target: EventTarget | null) => {
  const element = target as HTMLElement | null;
  if (!element) return false;
  if (element.isContentEditable) return true;
  return ['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName);
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeTopLayer();
  } else if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault();
    matrixRef.value?.save();
  } else if (
    !matrixExpanded.value &&
    !activeChat.value &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey &&
    !isEditingTarget(event.target) &&
    (event.key === 'ArrowDown' || event.key === 'ArrowUp')
  ) {
    event.preventDefault();
    moveSelectedAccount(event.key === 'ArrowDown' ? 1 : -1);
  }
};

onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));
</script>

<template>
  <main class="workbench">
    <TopBar :selected-context="selectedContext" :notice-count="noticeCount" :last-action="lastAction" />

    <div class="workspace-grid" :class="{ 'is-matrix-mode': matrixExpanded }">
      <AllocationMatrix
        ref="matrixRef"
        class="matrix-workspace"
        :accounts="accounts"
        :institutions="institutions"
        :deal-columns="dealColumns"
        :cells="allocationCells"
        :matrix-context="matrixContext"
        :pending-allocations="pendingAllocations"
        :expanded="matrixExpanded"
        :selected-account-id="selectedAccountId"
        @expand="openMatrix"
        @close="closeMatrix"
        @save="saveMatrix"
        @open-pending="openPending"
        @select-account="selectAccount"
      />

      <ResearchPanel
        :cards="researchCards"
        :active-card="activeCard"
        @open-card="activeCard = $event"
        @close-card="activeCard = null"
      />

      <MarketPanel
        :quotes="quotes"
        :group-summaries="marketGroupSummaries"
        :chats="chats"
        :tenors="tenors"
        :selected-account="selectedAccount"
        :selected-quote-id="selectedQuoteId"
        @open-quote="openQuote"
        @send-quote="sendQuote"
        @open-chat="openChat"
      />
    </div>

    <ChatPopup
      v-if="activeChat"
      :chat="activeChat.chat"
      :quote="activeChat.quote"
      :tenor="activeChat.tenor"
      :anchor="activeChat.anchor"
      :accounts="accounts"
      @close="activeChat = null"
      @save-allocation="saveQuickAllocation"
      @push-pending="pushPending"
      @open-matrix="openMatrix"
    />
  </main>
</template>
