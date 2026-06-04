<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import type { AccountRow, ChatThread, MarketQuote, MatrixContextInput, Tenor } from '../data/mockData';
import { useFocusTrap } from '../composables/useFocusTrap';

type PopupAnchor = { x: number; y: number };

const POPUP_WIDTH = 642;
const POPUP_HEIGHT = 640;
const EDGE_GAP = 16;
const TOP_GAP = 64;
const CURSOR_GAP = 12;

const popupEl = ref<HTMLElement | null>(null);
useFocusTrap(popupEl, { initialFocus: '.composer input' });

const props = defineProps<{
  chat: ChatThread;
  quote: MarketQuote;
  tenor: Tenor;
  anchor?: PopupAnchor;
  accounts: AccountRow[];
}>();

const emit = defineEmits<{
  close: [];
  saveAllocation: [payload: Array<{ accountId: string; amount: number }>];
  pushPending: [amount: number];
  openMatrix: [context: MatrixContextInput];
}>();

const dealConfirmed = ref(false);
const hasUnsaved = ref(false);
const draftAmounts = ref<Record<string, number>>({});
const selectedIds = ref<Set<string>>(new Set());
const composerText = ref('');
const visibleMessages = () => props.chat.messages.filter((message) => message.from !== 'ai');
const localMessages = ref(visibleMessages());
const clampPosition = (x: number, y: number) => {
  if (typeof window === 'undefined') return { x, y };
  const maxX = Math.max(window.innerWidth - POPUP_WIDTH - EDGE_GAP, EDGE_GAP);
  const maxY = Math.max(window.innerHeight - POPUP_HEIGHT - EDGE_GAP, TOP_GAP);
  return {
    x: Math.min(Math.max(x, EDGE_GAP), maxX),
    y: Math.min(Math.max(y, TOP_GAP), maxY)
  };
};

const defaultPosition = () => {
  if (typeof window === 'undefined') return clampPosition(720, 92);
  return clampPosition(window.innerWidth - POPUP_WIDTH - 40, 92);
};

const positionFromAnchor = (anchor?: PopupAnchor) => {
  if (!anchor || typeof window === 'undefined') return defaultPosition();
  const hasRoomRight = window.innerWidth - anchor.x >= POPUP_WIDTH + CURSOR_GAP + EDGE_GAP;
  const x = hasRoomRight ? anchor.x + CURSOR_GAP : anchor.x - POPUP_WIDTH - CURSOR_GAP;
  return clampPosition(x, anchor.y + CURSOR_GAP);
};

const position = ref(positionFromAnchor(props.anchor));
const dragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });

const eligibleAccounts = computed(() => {
  return props.accounts.filter((account) => {
    const remaining = account.targetAmount - account.allocatedAmount;
    return remaining > 0 && account.tenor === props.tenor && props.quote.allowedAccounts.includes(account.id);
  });
});

const quoteAmount = computed(() => props.quote.amount > 0 ? props.quote.amount : (props.chat.chatAmount ?? 0));

const remainingOf = (account: AccountRow) => Math.max(account.targetAmount - account.allocatedAmount, 0);
const usableLimit = (account: AccountRow) => Number(Math.min(remainingOf(account), quoteAmount.value ?? 0).toFixed(1));

const allocatedTotal = computed(() => {
  return eligibleAccounts.value
    .filter((a) => selectedIds.value.has(a.id))
    .reduce((sum, account) => sum + Number(draftAmounts.value[account.id] || 0), 0);
});

const difference = computed(() => Number(((quoteAmount.value ?? 0) - allocatedTotal.value).toFixed(2)));

const quoteRate = computed(() => props.quote.rates[props.tenor] ?? props.quote.rate ?? props.chat.chatRate ?? 0);
const senderName = computed(() => props.quote.traderName ?? props.chat.username ?? props.quote.counterparty);
const quoteReason = computed(() => props.quote.quoteReason ?? '');

const resetDraft = () => {
  const next: Record<string, number> = {};
  const nextSelected = new Set<string>();
  let remainingQuote = quoteAmount.value ?? 0;
  for (const account of eligibleAccounts.value) {
    nextSelected.add(account.id);
    const amount = Math.min(remainingOf(account), remainingQuote);
    if (amount > 0) {
      next[account.id] = Number(amount.toFixed(1));
      remainingQuote -= amount;
    } else {
      next[account.id] = 0;
    }
  }
  draftAmounts.value = next;
  selectedIds.value = nextSelected;
  hasUnsaved.value = false;
};

const clearDraft = () => {
  const next: Record<string, number> = {};
  for (const account of eligibleAccounts.value) next[account.id] = 0;
  draftAmounts.value = next;
  hasUnsaved.value = true;
};

const toggleAccount = (id: string) => {
  const next = new Set(selectedIds.value);
  if (next.has(id)) {
    next.delete(id);
    draftAmounts.value[id] = 0;
  } else {
    next.add(id);
  }
  selectedIds.value = next;
  hasUnsaved.value = true;
};

watch(
  () => props.chat.id,
  () => {
    localMessages.value = visibleMessages();
    composerText.value = '';
  }
);

watch(
  () => [props.chat.id, props.quote.id, props.tenor],
  () => {
    dealConfirmed.value = false;
    resetDraft();
  },
  { immediate: true }
);

watch(
  () => [props.chat.id, props.anchor?.x, props.anchor?.y],
  () => {
    position.value = positionFromAnchor(props.anchor);
  }
);

const sendMessage = () => {
  const text = composerText.value.trim();
  if (!text) return;
  localMessages.value.push({
    id: `m-${Date.now()}`,
    from: 'trader',
    text,
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  });
  composerText.value = '';
};

const confirmDeal = () => {
  dealConfirmed.value = true;
  hasUnsaved.value = true;
  resetDraft();
};

const updateAmount = (account: AccountRow, value: string) => {
  const max = usableLimit(account);
  const raw = Math.max(Number(value), 0);
  draftAmounts.value[account.id] = Math.min(raw, max);
  if (raw > 0) selectedIds.value = new Set([...selectedIds.value, account.id]);
  hasUnsaved.value = true;
};

const save = () => {
  const payload = eligibleAccounts.value
    .filter((account) => selectedIds.value.has(account.id))
    .map((account) => ({
      accountId: account.id,
      amount: Number(draftAmounts.value[account.id] || 0)
    }))
    .filter((item) => item.amount > 0);
  emit('saveAllocation', payload);
  hasUnsaved.value = false;
  dealConfirmed.value = false;
};

const pushPending = () => {
  if (difference.value > 0) {
    emit('pushPending', difference.value);
    hasUnsaved.value = false;
  }
};

const openMatrixFromQuick = () => {
  const draftCells = eligibleAccounts.value
    .filter((account) => selectedIds.value.has(account.id))
    .map((account) => ({
      accountId: account.id,
      amount: Number(draftAmounts.value[account.id] || 0)
    }))
    .filter((item) => item.amount > 0);

  emit('openMatrix', {
    source: '聊天快捷分配',
    sourceId: props.chat.id,
    counterparty: props.quote.counterparty || props.chat.counterparty,
    institution: props.quote.institution || props.quote.counterparty || props.chat.counterparty,
    term: props.tenor,
    dealAmount: quoteAmount.value ?? 0,
    rate: quoteRate.value,
    direction: props.quote.direction,
    dealTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    filledAmount: allocatedTotal.value,
    pendingAmount: Math.max(difference.value, 0),
    aiDraftStatus: draftCells.length ? '快捷草案已带入' : '待生成',
    draftCells
  });
};

const close = () => {
  if (hasUnsaved.value && !window.confirm('快捷分配尚未保存，确认关闭？')) {
    return;
  }
  emit('close');
};

const startDrag = (event: MouseEvent) => {
  dragging.value = true;
  dragOffset.value = {
    x: event.clientX - position.value.x,
    y: event.clientY - position.value.y
  };
  window.addEventListener('mousemove', onDrag);
  window.addEventListener('mouseup', stopDrag);
};

const onDrag = (event: MouseEvent) => {
  if (!dragging.value) return;
  position.value = clampPosition(event.clientX - dragOffset.value.x, event.clientY - dragOffset.value.y);
};

const stopDrag = () => {
  dragging.value = false;
  window.removeEventListener('mousemove', onDrag);
  window.removeEventListener('mouseup', stopDrag);
};

const onResize = () => {
  position.value = clampPosition(position.value.x, position.value.y);
};

onMounted(() => {
  position.value = positionFromAnchor(props.anchor);
  window.addEventListener('resize', onResize);
});

onUnmounted(() => {
  stopDrag();
  window.removeEventListener('resize', onResize);
});
</script>

<template>
  <aside ref="popupEl" class="chat-popup" :style="{ left: `${position.x}px`, top: `${position.y}px` }" aria-label="聊天弹窗">
    <div class="chat-popup__head" @mousedown="startDrag">
      <div>
        <p class="eyebrow">聊天弹窗</p>
        <h3>{{ chat.counterparty }}</h3>
      </div>
      <button class="close-button" type="button" aria-label="关闭聊天弹窗" @click.stop="close">×</button>
    </div>

    <div class="quote-summary">
      <span>报价摘要</span>
      <strong>{{ quote.counterparty }} · {{ tenor }} · {{ quoteRate.toFixed(2) }}%</strong>
      <em>发送人：{{ senderName }}</em>
      <em v-if="quoteReason">{{ quoteReason }}</em>
      <em>{{ quote.amount.toFixed(1) }} 亿 · {{ quote.limit }}</em>
    </div>

    <div class="messages" ref="messagesEl">
      <div v-for="message in localMessages" :key="message.id" class="message" :class="`is-${message.from}`">
        <span>{{ message.text }}</span>
        <small>{{ message.time }}</small>
      </div>
    </div>

    <div class="composer">
      <input
        v-model="composerText"
        aria-label="聊天输入"
        placeholder="输入消息，Enter 发送"
        @keydown.enter.exact.prevent="sendMessage"
      />
      <button class="button button--secondary" type="button" @click="sendMessage">发送</button>
      <button class="button button--primary" type="button" @click="confirmDeal">确认成交</button>
    </div>

    <section v-if="dealConfirmed" class="quick-allocation">
      <div class="quick-allocation__head">
        <div>
          <p class="eyebrow">成交后</p>
          <h4>快捷分配</h4>
        </div>
        <span :class="['diff-pill', difference === 0 ? 'is-zero' : difference > 0 ? 'is-positive' : 'is-negative']">
          差额 {{ difference.toFixed(1) }} 亿
        </span>
      </div>

      <div class="alloc-summary">
        <span>已成交 <b>{{ (quoteAmount ?? 0).toFixed(2) }}</b> 亿</span>
        <span>已分配 <b>{{ allocatedTotal.toFixed(2) }}</b> 亿</span>
        <span>待分配 <b>{{ Math.max(difference, 0).toFixed(2) }}</b> 亿</span>
      </div>

      <div class="quick-actions quick-actions--inline">
        <button class="button button--secondary" type="button" @click="resetDraft">AI 自动分配</button>
        <button class="button button--secondary" type="button" @click="clearDraft">清空</button>
      </div>

      <div v-if="eligibleAccounts.length" class="quick-table">
        <div class="quick-table__row quick-table__row--head">
          <span>选择</span>
          <span>账户 / 产品</span>
          <span>期限</span>
          <span>未出</span>
          <span>保本</span>
          <span>可分上限</span>
          <span>分配金额</span>
        </div>
        <div
          v-for="account in eligibleAccounts"
          :key="account.id"
          class="quick-table__row"
          :class="{ 'is-unchecked': !selectedIds.has(account.id) }"
        >
          <span class="check-cell">
            <input
              type="checkbox"
              :checked="selectedIds.has(account.id)"
              :aria-label="`选择 ${account.name}`"
              @change="toggleAccount(account.id)"
            />
          </span>
          <span>
            <b>{{ account.name }}</b>
            <small>{{ account.product }} · {{ account.rule }}</small>
          </span>
          <span class="number">{{ account.tenor }}</span>
          <span class="number">{{ remainingOf(account).toFixed(1) }}</span>
          <span class="number">{{ account.breakevenRate.toFixed(2) }}</span>
          <span class="number">{{ usableLimit(account).toFixed(1) }}</span>
          <input
            type="number"
            min="0"
            step="0.1"
            :max="usableLimit(account)"
            :disabled="!selectedIds.has(account.id)"
            :value="draftAmounts[account.id] ?? 0"
            @input="updateAmount(account, ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>

      <div v-else class="empty-state">
        暂无可快捷分配账户，可挂入待分配或转全屏矩阵。
      </div>

      <p class="alloc-hint">说明：快捷分配只展示可分配账户；不可分配账户不在弹窗内展示。</p>

      <div class="quick-actions">
        <button class="button button--secondary" type="button" :disabled="difference <= 0" @click="pushPending">
          挂入待分配
        </button>
        <button class="button button--secondary" type="button" @click="openMatrixFromQuick">转全屏矩阵</button>
        <button class="button button--primary" type="button" :disabled="!eligibleAccounts.length" @click="save">保存分配</button>
      </div>
    </section>
  </aside>
</template>
