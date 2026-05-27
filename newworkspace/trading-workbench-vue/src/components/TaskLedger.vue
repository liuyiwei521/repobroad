<script setup lang="ts">
import { ref } from 'vue';
import type { AccountRow, PendingAllocation } from '../data/mockData';

const props = defineProps<{
  accounts: AccountRow[];
  pendingAllocations: PendingAllocation[];
  selectedAccountId: string;
}>();

const emit = defineEmits<{
  selectAccount: [id: string];
  openPending: [item: PendingAllocation];
  openMatrix: [];
}>();

const remaining = (row: AccountRow) => Math.max(row.targetAmount - row.allocatedAmount, 0);
const progress = (row: AccountRow) => Math.min(Math.round((row.allocatedAmount / row.targetAmount) * 100), 100);

const onRowKeydown = (event: KeyboardEvent, index: number) => {
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    const next = props.accounts[index + 1];
    if (next) emit('selectAccount', next.id);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    const prev = props.accounts[index - 1];
    if (prev) emit('selectAccount', prev.id);
  } else if (event.key === 'Enter') {
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
        <input value="1.66" aria-label="试算利率" />
      </label>
      <button class="button button--primary" type="button">应用</button>
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
        v-for="(row, index) in accounts"
        :key="row.id"
        type="button"
        class="ledger__row ledger__row--button"
        :class="[
          `is-${row.status}`,
          { 'is-selected': row.id === selectedAccountId }
        ]"
        @click="emit('selectAccount', row.id)"
        @dblclick.stop="emit('openMatrix')"
        @keydown="onRowKeydown($event, index)"
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
      <button
        v-for="item in pendingAllocations"
        :key="item.id"
        class="pending__item"
        type="button"
        @click="emit('openPending', item)"
      >
        <span>
          <b>{{ item.counterparty }}</b>
          <small>{{ item.source }} · {{ item.time }}</small>
        </span>
        <span>
          <b class="number">{{ item.amount.toFixed(1) }} 亿</b>
          <small>{{ item.tenor }} · {{ item.rate.toFixed(2) }}%</small>
        </span>
      </button>
    </div>
  </section>
</template>
