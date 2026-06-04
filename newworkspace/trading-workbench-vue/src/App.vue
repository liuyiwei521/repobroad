<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import AllocationMatrix from './components/AllocationMatrix.vue';
import BarometerPanel, { type DockTab } from './components/BarometerPanel.vue';
import ChatPopup from './components/ChatPopup.vue';
import MarketPanel from './components/MarketPanel.vue';
import ResearchPanel from './components/ResearchPanel.vue';
import TaskOverviewMatrix from './components/TaskOverviewMatrix.vue';
import TopBar from './components/TopBar.vue';
import { taskOverviewFilterKey, type TaskOverviewFilter } from './composables/useTaskOverviewMatrix';
import {
  accounts as accountSeed,
  allocationCells as allocationCellSeed,
  chats,
  dealColumns as dealColumnSeed,
  institutions as institutionSeed,
  marketGroupSummaries,
  marketQuotes as quoteSeed,
  normalizeChatTenor,
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
const dockTab = ref<DockTab>('barometer');
const matrixExpanded = ref(false);
const matrixContext = ref<MatrixContext | null>(null);
const activeOverviewFilter = ref<TaskOverviewFilter | null>(null);
const lastAction = ref('已加载 mock 数据，点击任务概览可联动右栏行情。');
const activeChat = ref<{
  chat: ChatThread;
  quote: MarketQuote;
  tenor: Tenor;
  anchor?: PopupAnchor;
} | null>(null);

const matrixRef = ref<{ save: () => void; collapse: () => void } | null>(null);

// Three-column workspace: a fixed-width research rail on the far left, a
// draggable matrix in the middle, and the market panel filling the remaining
// space on the right. Only the matrix↔market boundary is draggable; the rail
// stays at a constant width.
const workspaceRef = ref<HTMLElement | null>(null);
const leftWidth = ref(160);
const matrixWidth = ref(520);
const LEFT_MIN = 96;
const LEFT_MAX = 360;
const MATRIX_MIN = 360;
const MATRIX_MAX = 1180;
const RIGHT_MIN = 460;
const GUTTER = 8;
const COLUMN_GUTTERS = 2;
const dockHeight = ref(280);
const DOCK_MIN = 160;
const DOCK_MAX = 520;
const clampWidth = (value: number, min: number, max: number) => {
  const safeMax = Math.max(min, max);
  return Math.min(Math.max(value, min), safeMax);
};

const trackWidth = () => {
  const el = workspaceRef.value;
  if (!el) return Infinity;
  const styles = getComputedStyle(el);
  const padX = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
  return el.clientWidth - padX;
};

const usableColumnWidth = () => trackWidth() - GUTTER * COLUMN_GUTTERS;

const workspaceStyle = computed(() =>
  matrixExpanded.value
    ? undefined
    : {
        gridTemplateColumns: `${leftWidth.value}px ${GUTTER}px ${matrixWidth.value}px ${GUTTER}px minmax(${RIGHT_MIN}px, 1fr)`,
        gridTemplateRows: 'minmax(0, 1fr)',
        gap: '0',
      }
);

const leftPanelMode = computed(() => {
  if (leftWidth.value < 132) return 'compact';
  if (leftWidth.value < 240) return 'summary';
  return 'full';
});

const middleColumnStyle = computed(() =>
  matrixExpanded.value
    ? undefined
    : {
        gridTemplateRows: `minmax(0, 1fr) ${GUTTER}px ${dockHeight.value}px`,
      }
);

// ── Column (matrix width) resize ──
let leftDragging = false;
let leftDragStartX = 0;
let leftDragStartWidth = 0;

const onLeftGutterMove = (event: PointerEvent) => {
  if (!leftDragging) return;
  const delta = event.clientX - leftDragStartX;
  const maxLeft = Math.min(LEFT_MAX, usableColumnWidth() - matrixWidth.value - RIGHT_MIN);
  leftWidth.value = clampWidth(leftDragStartWidth + delta, LEFT_MIN, maxLeft);
};

const onLeftGutterUp = () => {
  leftDragging = false;
  document.body.classList.remove('is-col-resizing');
  window.removeEventListener('pointermove', onLeftGutterMove);
  window.removeEventListener('pointerup', onLeftGutterUp);
};

const onLeftGutterDown = (event: PointerEvent) => {
  leftDragging = true;
  leftDragStartX = event.clientX;
  leftDragStartWidth = leftWidth.value;
  document.body.classList.add('is-col-resizing');
  window.addEventListener('pointermove', onLeftGutterMove);
  window.addEventListener('pointerup', onLeftGutterUp);
};

let dragging = false;
let dragStartX = 0;
let dragStartMatrix = 0;

const onGutterMove = (event: PointerEvent) => {
  if (!dragging) return;
  const delta = event.clientX - dragStartX;
  const maxMatrix = Math.min(MATRIX_MAX, usableColumnWidth() - leftWidth.value - RIGHT_MIN);
  matrixWidth.value = clampWidth(dragStartMatrix + delta, MATRIX_MIN, maxMatrix);
};

const onGutterUp = () => {
  dragging = false;
  document.body.classList.remove('is-col-resizing');
  window.removeEventListener('pointermove', onGutterMove);
  window.removeEventListener('pointerup', onGutterUp);
};

const onGutterDown = (event: PointerEvent) => {
  dragging = true;
  dragStartX = event.clientX;
  dragStartMatrix = matrixWidth.value;
  document.body.classList.add('is-col-resizing');
  window.addEventListener('pointermove', onGutterMove);
  window.addEventListener('pointerup', onGutterUp);
};

// ── Row (dock height) resize ──
let rowDragging = false;
let rowDragStartY = 0;
let rowDragStartDock = 0;

const onRowGutterMove = (event: PointerEvent) => {
  if (!rowDragging) return;
  // Moving up increases dock height (gutter is above the dock)
  const delta = rowDragStartY - event.clientY;
  dockHeight.value = clampWidth(rowDragStartDock + delta, DOCK_MIN, DOCK_MAX);
};

const onRowGutterUp = () => {
  rowDragging = false;
  document.body.classList.remove('is-row-resizing');
  window.removeEventListener('pointermove', onRowGutterMove);
  window.removeEventListener('pointerup', onRowGutterUp);
};

const onRowGutterDown = (event: PointerEvent) => {
  rowDragging = true;
  rowDragStartY = event.clientY;
  rowDragStartDock = dockHeight.value;
  document.body.classList.add('is-row-resizing');
  window.addEventListener('pointermove', onRowGutterMove);
  window.addEventListener('pointerup', onRowGutterUp);
};

const selectedAccount = computed(() => accounts.value.find((account) => account.id === selectedAccountId.value));

const selectedContext = computed(() => {
  if (activeOverviewFilter.value) return `任务概览 / ${activeOverviewFilter.value.label}`;
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
  activeOverviewFilter.value = null;
  activeCard.value = null;
  activeChat.value = null;
  lastAction.value = matrixContext.value
    ? `已将 ${matrixContext.value.counterparty} ${matrixContext.value.term} 成交带入矩阵，并新增 ${matrixContext.value.batchNo} 批次列。`
    : '已展开完整分配矩阵，中栏与右栏压缩让位。';
};

const closeMatrix = () => {
  matrixExpanded.value = false;
  matrixContext.value = null;
  lastAction.value = '已回到左栏任务概览矩阵，待分配信息保持展示。';
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

const selectOverviewFilter = (filter: TaskOverviewFilter) => {
  const sameFilter = taskOverviewFilterKey(activeOverviewFilter.value) === taskOverviewFilterKey(filter);
  activeOverviewFilter.value = sameFilter || filter.scope === 'all' ? null : filter;
  lastAction.value = activeOverviewFilter.value
    ? `已按任务概览筛选右栏：${activeOverviewFilter.value.label}。`
    : '已取消任务概览筛选，右栏回到全量。';
};

const clearOverviewFilter = () => {
  activeOverviewFilter.value = null;
  lastAction.value = '已清除右栏联动筛选，恢复全量对手与行情。';
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
  const quoteContext = quoteForTenor(quote, tenor);
  const sender = quoteContext.traderName ?? '张经理';
  const amountText = quoteContext.amount > 0 ? `${quoteContext.amount.toFixed(quoteContext.amount % 1 === 0 ? 0 : 1)}亿` : '待报价';
  const messageText = `${sender} · ${quoteContext.counterparty}：${tenor} ${amountText} @ ${quoteContext.rate.toFixed(2)}%，${quoteContext.accountRequirement}，押券 ${quoteContext.collateralRequirement}。`;
  const chat: ChatThread = {
    id: `quote-chat-${quote.id}-${tenor}`,
    counterparty: quoteContext.counterparty,
    status: 'unreplied',
    latest: messageText,
    time: quoteContext.updatedAt,
    relatedQuoteId: quote.id,
    username: sender,
    chatTenor: tenor,
    chatRate: quoteContext.rate,
    chatAmount: quoteContext.amount,
    chatGroup: quoteContext.group,
    chatLimit: quoteContext.accountRequirement,
    collateral: quoteContext.collateralRequirement,
    messages: [
      {
        id: `quote-message-${quote.id}-${tenor}`,
        from: 'counterparty',
        text: messageText,
        time: quoteContext.updatedAt
      }
    ]
  };
  activeChat.value = { chat, quote: quoteContext, tenor };
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
  const normalizedChatTenor = normalizeChatTenor(chat.chatTenor);
  const tenor = normalizedChatTenor ?? (
    selectedAccount.value && quote.rates[selectedAccount.value.tenor]
      ? selectedAccount.value.tenor
      : firstRateTenor(quote)
  );
  const chatRate = chat.chatRate ?? quote.rates[tenor] ?? quote.rate;
  const chatAmount = chat.chatAmount ?? quote.tenorAmounts[tenor] ?? quote.amount;
  const quoteContext = {
    ...quoteForTenor(quote, tenor),
    counterparty: chat.counterparty,
    institution: chat.counterparty,
    group: chat.chatGroup ?? quote.group,
    amount: chatAmount,
    rate: chatRate,
    limit: chat.chatLimit ?? quote.limit,
    accountRequirement: chat.chatLimit ?? quote.accountRequirement,
    collateral: chat.collateral ?? quote.collateral,
    collateralRequirement: chat.collateral ?? quote.collateralRequirement,
    traderName: chat.username,
    rates: { ...quote.rates, [tenor]: chatRate },
    tenorAmounts: { ...quote.tenorAmounts, [tenor]: chatAmount }
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
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
  window.removeEventListener('pointermove', onLeftGutterMove);
  window.removeEventListener('pointerup', onLeftGutterUp);
  window.removeEventListener('pointermove', onGutterMove);
  window.removeEventListener('pointerup', onGutterUp);
  window.removeEventListener('pointermove', onRowGutterMove);
  window.removeEventListener('pointerup', onRowGutterUp);
});
</script>

<template>
  <main class="workbench">
    <TopBar :selected-context="selectedContext" :notice-count="noticeCount" :last-action="lastAction" />

    <div ref="workspaceRef" class="workspace-grid" :class="{ 'is-matrix-mode': matrixExpanded }" :style="workspaceStyle">
      <ResearchPanel
        :class="['left-column', `research-panel--${leftPanelMode}`]"
        :cards="researchCards"
        :active-card="activeCard"
        @open-card="activeCard = $event"
        @close-card="activeCard = null"
        @open-quote-overview="dockTab = 'trend'"
      />

      <div
        v-if="!matrixExpanded"
        class="workspace-gutter workspace-gutter--left"
        role="separator"
        aria-orientation="vertical"
        aria-label="拖动调整左侧宽度"
        title="拖动调整左侧宽度"
        @pointerdown="onLeftGutterDown($event)"
      ></div>

      <div v-if="!matrixExpanded" class="middle-column" :style="middleColumnStyle">
        <TaskOverviewMatrix
          class="matrix-workspace"
          :accounts="accounts"
          :pending-allocations="pendingAllocations"
          :active-filter="activeOverviewFilter"
          @select-filter="selectOverviewFilter"
          @open-pending="openPending"
          @open-matrix="openMatrix"
        />

        <div
          class="panel-gutter barometer-row-gutter"
          role="separator"
          aria-orientation="horizontal"
          aria-label="拖动调整图表面板高度"
          @pointerdown="onRowGutterDown($event)"
        />

        <BarometerPanel
          class="barometer-slot"
          v-model:active-tab="dockTab"
        />
      </div>

      <AllocationMatrix
        v-else
        ref="matrixRef"
        class="matrix-workspace matrix-workspace--expanded"
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

      <div
        v-if="!matrixExpanded"
        class="workspace-gutter"
        role="separator"
        aria-orientation="vertical"
        aria-label="拖动调整中间矩阵宽度"
        title="拖动调整矩阵宽度"
        @pointerdown="onGutterDown($event)"
      ></div>

      <MarketPanel
        class="market-panel-slot"
        :quotes="quotes"
        :group-summaries="marketGroupSummaries"
        :chats="chats"
        :accounts="accounts"
        :tenors="tenors"
        :selected-account="selectedAccount"
        :selected-quote-id="selectedQuoteId"
        :overview-filter="activeOverviewFilter"
        @open-quote="openQuote"
        @send-quote="sendQuote"
        @open-chat="openChat"
        @clear-overview-filter="clearOverviewFilter"
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
