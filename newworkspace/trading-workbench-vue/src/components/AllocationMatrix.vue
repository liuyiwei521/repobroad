<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { AccountRow, MarketQuote, Tenor } from '../data/mockData';
import { useFocusTrap } from '../composables/useFocusTrap';

const matrixEl = ref<HTMLElement | null>(null);
useFocusTrap(matrixEl, { initialFocus: '.matrix__actions button' });

const props = defineProps<{
  accounts: AccountRow[];
  quotes: MarketQuote[];
  tenors: Tenor[];
}>();

const emit = defineEmits<{
  close: [];
  save: [payload: Array<{ accountId: string; quoteId: string; amount: number }>];
}>();

const drafts = ref<Record<string, number>>({});
const hasUnsaved = ref(false);

const activeQuotes = computed(() => props.quotes.filter((quote) => quote.amount > 0));

const keyFor = (accountId: string, quoteId: string) => `${accountId}__${quoteId}`;

const remainingAccount = (account: AccountRow) => Math.max(account.targetAmount - account.allocatedAmount, 0);

const accountDraftTotal = (accountId: string) =>
  activeQuotes.value.reduce((sum, quote) => sum + Number(drafts.value[keyFor(accountId, quote.id)] || 0), 0);

const quoteDraftTotal = (quoteId: string) =>
  props.accounts.reduce((sum, account) => sum + Number(drafts.value[keyFor(account.id, quoteId)] || 0), 0);

const quoteDiff = (quote: MarketQuote) => Number((quote.amount - quoteDraftTotal(quote.id)).toFixed(1));

const accountDiff = (account: AccountRow) =>
  Number((remainingAccount(account) - accountDraftTotal(account.id)).toFixed(1));

// ── 汇总计算 ──────────────────────────────────────────────────
// 横向：所有对手列的总量合计 / 差额合计
const totalQuoteAmount = computed(() =>
  Number(activeQuotes.value.reduce((s, q) => s + q.amount, 0).toFixed(1))
);
const totalQuoteDiff = computed(() =>
  Number(activeQuotes.value.reduce((s, q) => s + quoteDiff(q), 0).toFixed(1))
);

// 纵向：所有账户行的指令总量 / 差额合计
const totalTargetAmount = computed(() =>
  Number(props.accounts.reduce((s, a) => s + a.targetAmount, 0).toFixed(1))
);
const totalAccountDiff = computed(() =>
  Number(props.accounts.reduce((s, a) => s + accountDiff(a), 0).toFixed(1))
);

const diffClass = (val: number) =>
  val === 0 ? 'is-zero' : val > 0 ? 'is-positive' : 'is-negative';

const isAllowed = (account: AccountRow, quote: MarketQuote) =>
  quote.allowedAccounts.includes(account.id) && Boolean(quote.rates[account.tenor]);

const autoDraft = () => {
  const next: Record<string, number> = {};
  const quoteRemaining = new Map(activeQuotes.value.map((q) => [q.id, q.amount]));
  for (const account of props.accounts) {
    let need = remainingAccount(account);
    if (need <= 0) continue;
    for (const quote of activeQuotes.value) {
      if (!isAllowed(account, quote)) continue;
      const left = quoteRemaining.get(quote.id) ?? 0;
      const amount = Math.min(need, left);
      if (amount > 0) {
        next[keyFor(account.id, quote.id)] = Number(amount.toFixed(1));
        need -= amount;
        quoteRemaining.set(quote.id, Number((left - amount).toFixed(1)));
      }
      if (need <= 0) break;
    }
  }
  drafts.value = next;
  hasUnsaved.value = true;
};

watch(
  () => [props.accounts.length, props.quotes.length],
  () => autoDraft(),
  { immediate: true }
);

const updateCell = (accountId: string, quoteId: string, value: string) => {
  drafts.value[keyFor(accountId, quoteId)] = Math.max(Number(value), 0);
  hasUnsaved.value = true;
};

const clearDraft = () => {
  drafts.value = {};
  hasUnsaved.value = true;
};

const save = () => {
  const payload = Object.entries(drafts.value)
    .map(([key, amount]) => {
      const [accountId, quoteId] = key.split('__');
      return { accountId, quoteId, amount: Number(amount || 0) };
    })
    .filter((item) => item.amount > 0);
  emit('save', payload);
  hasUnsaved.value = false;
};

const close = () => {
  if (hasUnsaved.value && !window.confirm('矩阵有未保存修改，确认返回三栏？')) return;
  emit('close');
};

defineExpose({ save });
</script>

<template>
  <section ref="matrixEl" class="matrix" aria-label="分配矩阵工作区">
    <header class="matrix__head">
      <div>
        <p class="eyebrow">矩阵工作态</p>
        <h2>账户缺口 × 对手额度</h2>
      </div>
      <div class="matrix__actions">
        <button class="button button--secondary" type="button" @click="autoDraft">AI 自动分配</button>
        <button class="button button--secondary" type="button" @click="clearDraft">清空</button>
        <button class="button button--primary" type="button" @click="save">保存分配</button>
        <button class="button button--secondary" type="button" @click="close">返回三栏</button>
      </div>
    </header>

    <div class="matrix-table" :style="{ '--quote-count': activeQuotes.length }">

      <!-- ── 冻结表头区（三行一体 sticky） ── -->
      <div class="matrix-head-group">

        <!-- 第 1 行：对手名称 -->
        <div class="matrix-row matrix-row--head">
          <span class="sticky-col">账户 / 期限</span>
          <span v-for="quote in activeQuotes" :key="quote.id">
            <b>{{ quote.counterparty }}</b>
            <small>{{ quote.group }}</small>
          </span>
          <span>合计</span>
        </div>

        <!-- 第 2 行：总量（横向，按对手列） -->
        <div class="matrix-row matrix-row--summary">
          <span class="sticky-col matrix-label">总量（亿）</span>
          <span v-for="quote in activeQuotes" :key="quote.id" class="matrix-summary-cell">
            {{ quote.amount.toFixed(1) }}
          </span>
          <span class="matrix-summary-cell">{{ totalQuoteAmount.toFixed(1) }}</span>
        </div>

        <!-- 第 3 行：差额/剩余量（横向，按对手列） -->
        <div class="matrix-row matrix-row--summary">
          <span class="sticky-col matrix-label">差额（亿）</span>
          <span
            v-for="quote in activeQuotes"
            :key="quote.id"
            class="matrix-diff"
            :class="diffClass(quoteDiff(quote))"
          >{{ quoteDiff(quote).toFixed(1) }}</span>
          <span class="matrix-diff" :class="diffClass(totalQuoteDiff)">
            {{ totalQuoteDiff.toFixed(1) }}
          </span>
        </div>

      </div>
      <!-- ── 表头结束 ── -->

      <!-- ── 账户数据行 ── -->
      <div v-for="account in accounts" :key="account.id" class="matrix-row">
        <!-- 纵向：账户列显示指令总量 + 未出 -->
        <span class="sticky-col">
          <b>{{ account.name }}</b>
          <small>{{ account.tenor }}</small>
          <span class="matrix-account-meta">
            <span>指令 {{ account.targetAmount.toFixed(1) }}</span>
            <span>未出 {{ remainingAccount(account).toFixed(1) }}</span>
          </span>
        </span>

        <!-- 分配格子 -->
        <span
          v-for="quote in activeQuotes"
          :key="quote.id"
          class="matrix-cell"
          :class="{ 'is-disabled': !isAllowed(account, quote) }"
        >
          <input
            type="number"
            min="0"
            step="0.1"
            :disabled="!isAllowed(account, quote)"
            :value="drafts[keyFor(account.id, quote.id)] ?? ''"
            @input="updateCell(account.id, quote.id, ($event.target as HTMLInputElement).value)"
          />
          <small v-if="isAllowed(account, quote)">{{ quote.rates[account.tenor]?.toFixed(2) }}%</small>
          <small v-else>不可分</small>
        </span>

        <!-- 纵向：账户行差额（右侧最后列） -->
        <span class="matrix-diff" :class="diffClass(accountDiff(account))">
          {{ accountDiff(account).toFixed(1) }}
        </span>
      </div>

      <!-- ── 汇总行（纵向底部，按账户行合计） ── -->
      <div class="matrix-row matrix-row--total-row">
        <span class="sticky-col matrix-label">账户合计</span>
        <span
          v-for="quote in activeQuotes"
          :key="quote.id"
          class="matrix-summary-cell"
        >{{ Number(quoteDraftTotal(quote.id).toFixed(1)) }}</span>
        <span class="matrix-diff" :class="diffClass(totalAccountDiff)">
          {{ totalAccountDiff.toFixed(1) }}
        </span>
      </div>

    </div>
  </section>
</template>
