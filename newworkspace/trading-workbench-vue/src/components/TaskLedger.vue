<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { AccountRow, PendingAllocation } from '../data/mockData';

const props = defineProps<{
  accounts: AccountRow[];
  pendingAllocations: PendingAllocation[];
  selectedAccountId: string;
  trialRate: number;
}>();

const emit = defineEmits<{
  selectAccount: [id: string];
  applyTrialRate: [rate: number];
  openPending: [item: PendingAllocation];
  openMatrix: [];
}>();

const remaining = (row: AccountRow) => Math.max(row.targetAmount - row.allocatedAmount, 0);
const progress = (row: AccountRow) => Math.min(Math.round((row.allocatedAmount / row.targetAmount) * 100), 100);
const rateInput = ref<HTMLInputElement | null>(null);
const draftRate = ref(props.trialRate.toFixed(2));
const isEditingRate = ref(false);
const parsedDraftRate = computed(() => Number(draftRate.value));
const isDraftRateValid = computed(() => draftRate.value.trim() !== '' && Number.isFinite(parsedDraftRate.value) && parsedDraftRate.value >= 0);

watch(
  () => props.trialRate,
  (rate) => {
    if (!isEditingRate.value) draftRate.value = rate.toFixed(2);
  }
);

const beginRateEdit = (event: FocusEvent) => {
  isEditingRate.value = true;
  draftRate.value = props.trialRate.toFixed(2);
  (event.target as HTMLInputElement).select();
};

const commitRate = () => {
  if (!isDraftRateValid.value) {
    cancelRateEdit();
    return;
  }

  const nextRate = Number(parsedDraftRate.value.toFixed(2));
  draftRate.value = nextRate.toFixed(2);
  isEditingRate.value = false;
  emit('applyTrialRate', nextRate);
};

const commitRateFromKeyboard = () => {
  commitRate();
  rateInput.value?.blur();
};

const cancelRateEdit = () => {
  draftRate.value = props.trialRate.toFixed(2);
  isEditingRate.value = false;
  rateInput.value?.blur();
};

const onRateBlur = () => {
  if (isEditingRate.value) commitRate();
};

const onRowKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    emit('openMatrix');
  }
};
</script>

<template>
  <section class="panel task-panel" aria-label="左栏任务">
    <div class="panel__head">
      <div>
        <p class="eyebrow">左栏 · 任务</p>
        <h2>交易单台账</h2>
      </div>
      <button class="button button--secondary" type="button" @click="emit('openMatrix')">展开矩阵</button>
    </div>

    <div class="rate-box">
      <label>
        <span>试算利率</span>
        <input
          ref="rateInput"
          v-model="draftRate"
          type="number"
          min="0"
          step="0.01"
          inputmode="decimal"
          aria-label="试算利率"
          @focus="beginRateEdit"
          @blur="onRateBlur"
          @keydown.enter.prevent="commitRateFromKeyboard"
          @keydown.esc.prevent.stop="cancelRateEdit"
        />
      </label>
      <button
        class="button button--primary"
        type="button"
        :disabled="!isDraftRateValid"
        @mousedown.prevent
        @click="commitRate"
      >
        应用
      </button>
    </div>

    <div class="ledger">
      <div class="ledger__row ledger__row--head">
        <span>账户</span>
        <span>期限</span>
        <span>未出</span>
        <span>进度</span>
        <span>保本</span>
      </div>
      <button
        v-for="row in accounts"
        :key="row.id"
        type="button"
        class="ledger__row ledger__row--button"
        :class="[
          `is-${row.status}`,
          { 'is-selected': row.id === selectedAccountId }
        ]"
        @click="emit('selectAccount', row.id)"
        @dblclick.stop="emit('openMatrix')"
        @keydown="onRowKeydown"
      >
        <span>
          <b>{{ row.name }}</b>
          <small>{{ row.product }}</small>
        </span>
        <span>{{ row.tenor }}</span>
        <span class="number">{{ remaining(row).toFixed(1) }}</span>
        <span>
          <i class="progress">
            <i :style="{ width: `${progress(row)}%` }"></i>
          </i>
          <small>{{ progress(row) }}%</small>
        </span>
        <span class="number" :class="{ danger: row.status === 'warning' }">{{ row.breakevenRate.toFixed(2) }}</span>
      </button>
    </div>

    <div class="pending">
      <div class="section-title">
        <span></span>
        <strong>待分配额度</strong>
        <em>{{ pendingAllocations.length }} 笔</em>
      </div>
      <div
        v-for="item in pendingAllocations"
        :key="item.id"
        class="pending__item"
      >
        <span>
          <b>{{ item.counterparty }}</b>
          <small>{{ item.source }} · {{ item.time }}</small>
        </span>
        <span>
          <b class="number">{{ item.amount.toFixed(1) }} 亿</b>
          <small>{{ item.tenor }} · {{ item.rate.toFixed(2) }}%</small>
        </span>
        <button class="button button--secondary pending__action" type="button" @click="emit('openPending', item)">分配</button>
      </div>
    </div>
  </section>
</template>
