<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, type ComponentPublicInstance } from 'vue';
import AllocationMatrix from './components/AllocationMatrix.vue';
import ChatPopup from './components/ChatPopup.vue';
import MarketPanel from './components/MarketPanel.vue';
import ResearchPanel from './components/ResearchPanel.vue';
import TaskLedger from './components/TaskLedger.vue';
import TopBar from './components/TopBar.vue';
import {
  accounts as accountSeed,
  chats,
  marketQuotes as quoteSeed,
  pendingAllocations as pendingSeed,
  researchCards,
  tenors,
  type AccountRow,
  type ChatThread,
  type MarketQuote,
  type PendingAllocation,
  type ResearchCard,
  type Tenor
} from './data/mockData';

const accounts = ref<AccountRow[]>(accountSeed.map((item) => ({ ...item })));
const quotes = ref<MarketQuote[]>(quoteSeed.map((item) => ({ ...item, rates: { ...item.rates }, tenorAmounts: { ...item.tenorAmounts } })));
const reverseQuotes = computed(() => quotes.value.filter((q) => q.direction === 'reverse'));
const pendingAllocations = ref<PendingAllocation[]>(pendingSeed.map((item) => ({ ...item })));

const selectedAccountId = ref(accounts.value[0]?.id ?? '');
const selectedQuoteId = ref('');
const activeCard = ref<ResearchCard | null>(null);
const matrixOpen = ref(false);
const lastAction = ref('已加载 mock 数据，点击账户行可联动右栏行情。');
const activeChat = ref<{
  chat: ChatThread;
  quote: MarketQuote;
  tenor: Tenor;
} | null>(null);

const matrixRef = ref<{ save: () => void } | null>(null);

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

const openMatrix = () => {
  matrixOpen.value = true;
  activeCard.value = null;
  activeChat.value = null;
  lastAction.value = '已进入矩阵工作态，左中区域展开分配矩阵，右侧行情保持完整显示。';
};

const closeMatrix = () => {
  matrixOpen.value = false;
  lastAction.value = '已返回三栏工作台。';
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

const openQuote = (quote: MarketQuote, tenor: Tenor) => {
  selectedQuoteId.value = quote.id;
  const chat = chats.find((item) => item.relatedQuoteId === quote.id) ?? chats[0];
  activeChat.value = { chat, quote, tenor };
  lastAction.value = `已打开 ${quote.counterparty} ${tenor} 报价聊天，报价摘要已带入弹窗。`;
};

const sendQuote = (quote: MarketQuote, tenor: Tenor) => {
  const target = quotes.value.find((item) => item.id === quote.id);
  if (target) target.sent = true;
  openQuote(target ?? quote, tenor);
  lastAction.value = `已向 ${quote.counterparty} 发送 ${tenor} 快捷询价，单元格显示已发送状态。`;
  window.setTimeout(() => {
    const current = quotes.value.find((item) => item.id === quote.id);
    if (current) current.sent = false;
  }, 1600);
};

const openChat = (chat: ChatThread) => {
  const quote = quotes.value.find((item) => item.id === chat.relatedQuoteId) ?? quotes.value[0];
  if (!quote) return;
  const tenor = selectedAccount.value && quote.rates[selectedAccount.value.tenor]
    ? selectedAccount.value.tenor
    : firstRateTenor(quote);
  selectedQuoteId.value = quote.id;
  activeChat.value = { chat, quote, tenor };
  lastAction.value = `已打开 ${chat.counterparty} 会话，并定位到最新消息。`;
};

const openPending = (item: PendingAllocation) => {
  const quote = quotes.value.find((quoteItem) => quoteItem.counterparty === item.counterparty) ?? quotes.value[0];
  const chat = chats.find((chatItem) => chatItem.counterparty === item.counterparty) ?? chats[0];
  if (!quote || !chat) return;
  selectedQuoteId.value = quote.id;
  activeChat.value = { chat, quote, tenor: item.tenor };
  lastAction.value = `已从待分配额度打开 ${item.counterparty} 会话，可继续处理 ${item.amount.toFixed(1)} 亿余额。`;
};

const saveQuickAllocation = (payload: Array<{ accountId: string; amount: number }>) => {
  for (const item of payload) {
    const account = accounts.value.find((row) => row.id === item.accountId);
    if (!account) continue;
    account.allocatedAmount = Math.min(account.targetAmount, Number((account.allocatedAmount + item.amount).toFixed(1)));
    refreshAccountStatus(account);
  }
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

const saveMatrix = (payload: Array<{ accountId: string; quoteId: string; amount: number }>) => {
  const accountTotals = new Map<string, number>();
  for (const item of payload) {
    accountTotals.set(item.accountId, Number(((accountTotals.get(item.accountId) ?? 0) + item.amount).toFixed(1)));
  }
  for (const [accountId, amount] of accountTotals) {
    const account = accounts.value.find((row) => row.id === accountId);
    if (!account) continue;
    account.allocatedAmount = Math.min(account.targetAmount, Number((account.allocatedAmount + amount).toFixed(1)));
    refreshAccountStatus(account);
  }
  matrixOpen.value = false;
  lastAction.value = `矩阵分配已保存，${accountTotals.size} 个账户完成回写。`;
};

const closeTopLayer = () => {
  if (matrixOpen.value) {
    closeMatrix();
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

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeTopLayer();
  } else if ((event.ctrlKey || event.metaKey) && event.key === 's' && matrixOpen.value) {
    event.preventDefault();
    matrixRef.value?.save();
  }
};

onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));
</script>

<template>
  <main class="workbench">
    <TopBar :selected-context="selectedContext" :notice-count="noticeCount" :last-action="lastAction" />

    <div class="workspace-grid" :class="{ 'is-matrix-mode': matrixOpen }">
      <template v-if="!matrixOpen">
        <TaskLedger
          :accounts="accounts"
          :pending-allocations="pendingAllocations"
          :selected-account-id="selectedAccountId"
          @select-account="selectAccount"
          @open-pending="openPending"
          @open-matrix="openMatrix"
        />

        <ResearchPanel
          :cards="researchCards"
          :active-card="activeCard"
          @open-card="activeCard = $event"
          @close-card="activeCard = null"
        />

        <MarketPanel
          :quotes="quotes"
          :chats="chats"
          :tenors="tenors"
          :selected-account="selectedAccount"
          :selected-quote-id="selectedQuoteId"
          @open-quote="openQuote"
          @send-quote="sendQuote"
          @open-chat="openChat"
        />
      </template>

      <template v-else>
        <AllocationMatrix
          ref="matrixRef"
          class="matrix-workspace"
          :accounts="accounts"
          :quotes="reverseQuotes"
          :tenors="tenors"
          @close="closeMatrix"
          @save="saveMatrix"
        />

        <MarketPanel
          :quotes="quotes"
          :chats="chats"
          :tenors="tenors"
          :selected-account="selectedAccount"
          :selected-quote-id="selectedQuoteId"
          @open-quote="openQuote"
          @send-quote="sendQuote"
          @open-chat="openChat"
        />
      </template>
    </div>

    <ChatPopup
      v-if="activeChat"
      :chat="activeChat.chat"
      :quote="activeChat.quote"
      :tenor="activeChat.tenor"
      :accounts="accounts"
      @close="activeChat = null"
      @save-allocation="saveQuickAllocation"
      @push-pending="pushPending"
      @open-matrix="openMatrix"
    />
  </main>
</template>
