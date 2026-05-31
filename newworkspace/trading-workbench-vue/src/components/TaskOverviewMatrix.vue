<script setup lang="ts">
import { computed } from 'vue';
import type { AccountRow, PendingAllocation } from '../data/mockData';
import {
  buildTaskOverviewMatrix,
  taskOverviewFilterKey,
  type TaskOverviewCell,
  type TaskOverviewColumn,
  type TaskOverviewFilter,
  type TaskOverviewRow,
  type TaskOverviewTermLine
} from '../composables/useTaskOverviewMatrix';

const props = defineProps<{
  accounts: AccountRow[];
  pendingAllocations: PendingAllocation[];
  activeFilter: TaskOverviewFilter | null;
}>();

const emit = defineEmits<{
  selectFilter: [filter: TaskOverviewFilter];
  openPending: [item: PendingAllocation];
  openMatrix: [];
}>();

const matrix = computed(() => buildTaskOverviewMatrix(props.accounts));
const activeFilterKey = computed(() => taskOverviewFilterKey(props.activeFilter));
const pendingTotal = computed(() =>
  Number(props.pendingAllocations.reduce((sum, item) => sum + item.amount, 0).toFixed(2))
);

const accountTypeColors: Record<string, string> = {
  '专户': '#763df2',
  '公募户': '#02adb0',
  '自营户/证券户': '#1872f6',
  '资管户': '#e9b842',
  '信托户': '#00a870',
  '私募户': '#a138f5',
  '年金户': '#ff8a34',
  '社保户': '#6764f5',
  '养老金户': '#0060db',
  '组合户': '#737578',
  '老户/旧户': '#8b6b36'
};

const colorOf = (accountType: string) => accountTypeColors[accountType] ?? '#737578';
const formatAmount = (value: number) => {
  const rounded = Number(value.toFixed(2));
  return Number.isInteger(rounded) ? rounded.toFixed(1) : String(rounded);
};
const amountText = (amount: { total: number; allocated: number; pending: number }) =>
  `${formatAmount(amount.total)}(${formatAmount(amount.allocated)}/${formatAmount(amount.pending)})`;
const hasAmount = (amount: { total: number }) => amount.total > 0;
const hasCellTask = (cell: TaskOverviewCell) => cell.lines.length > 0;

const filterStyle = (accountType: string) => ({
  '--account-type-color': colorOf(accountType)
});

const isActive = (filter: TaskOverviewFilter) => taskOverviewFilterKey(filter) === activeFilterKey.value;

const choose = (filter: TaskOverviewFilter) => {
  emit('selectFilter', filter);
};

const allFilter = (): TaskOverviewFilter => ({
  scope: 'all',
  label: '全部任务'
});

const cellFilter = (cell: TaskOverviewCell): TaskOverviewFilter => ({
  scope: 'cell',
  pledgeRequirement: cell.pledgeRequirement,
  accountType: cell.accountType,
  label: `${cell.pledgeRequirement} / ${cell.accountType}`
});

const cellLineFilter = (line: TaskOverviewTermLine): TaskOverviewFilter => ({
  scope: 'termLine',
  term: line.term,
  pledgeRequirement: line.pledgeRequirement || undefined,
  accountType: line.accountType,
  label: [line.pledgeRequirement, line.accountType, line.term].filter(Boolean).join(' / ')
});

const rowFilter = (row: TaskOverviewRow): TaskOverviewFilter => ({
  scope: 'row',
  pledgeRequirement: row.pledgeRequirement,
  label: row.pledgeOption.label
});

const columnFilter = (column: TaskOverviewColumn): TaskOverviewFilter => ({
  scope: 'column',
  accountType: column.accountType,
  label: column.accountOption.label
});

const grandTermFilter = (line: TaskOverviewTermLine): TaskOverviewFilter => ({
  scope: 'total',
  term: line.term,
  label: `${line.term} / 全部任务`
});
</script>

<template>
  <section class="panel task-overview-panel" aria-label="左栏任务概览矩阵">
    <div class="panel__head">
      <div>
        <p class="eyebrow">左栏 · 作战地图</p>
        <h2>任务概览</h2>
      </div>
      <button class="button button--secondary" type="button" @click="emit('openMatrix')">展开矩阵</button>
    </div>

    <div class="task-overview-meta">
      <span>单元格 = 期限 总额(已分/待分)</span>
      <button
        class="task-overview-filter"
        :class="{ 'is-active': !props.activeFilter }"
        type="button"
        @click="choose(allFilter())"
      >
        全部
      </button>
    </div>

    <div class="task-overview-table-wrap">
      <table class="task-overview-table">
        <thead>
          <tr>
            <th>
              <span class="task-overview-axis-title">押券 / 账户</span>
            </th>
            <th v-for="column in matrix.columns" :key="column.accountType">
              <button
                class="task-overview-head-button"
                :class="{ 'is-active': isActive(columnFilter(column)) }"
                type="button"
                :style="filterStyle(column.accountType)"
                @click="choose(columnFilter(column))"
              >
                <span><i></i>{{ column.accountOption.label }}</span>
                <small>合计{{ amountText(column.total) }}</small>
              </button>
            </th>
            <th>
              <button
                class="task-overview-head-button task-overview-head-button--total"
                :class="{ 'is-active': !props.activeFilter }"
                type="button"
                @click="choose(allFilter())"
              >
                <span>合计</span>
                <small>合计{{ amountText(matrix.grandTotal) }}</small>
              </button>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="row in matrix.rows" :key="row.id">
            <th>
              <button
                class="task-overview-row-button"
                type="button"
                :class="{ 'is-active': isActive(rowFilter(row)) }"
                @click="choose(rowFilter(row))"
              >
                <span>{{ row.pledgeOption.label }}</span>
                <small>合计{{ amountText(row.total) }}</small>
              </button>
            </th>

            <td v-for="column in matrix.columns" :key="`${row.id}-${column.accountType}`">
              <div
                class="task-overview-cell-stack"
                :class="{ 'is-active': isActive(cellFilter(row.cells[column.accountType])), 'is-empty': !hasCellTask(row.cells[column.accountType]) }"
                :style="filterStyle(column.accountType)"
                @click.self="hasCellTask(row.cells[column.accountType]) && choose(cellFilter(row.cells[column.accountType]))"
              >
                <button
                  v-for="line in row.cells[column.accountType].lines"
                  :key="`${row.id}-${column.accountType}-${line.term}`"
                  class="task-overview-term-line"
                  type="button"
                  :class="{ 'is-active': isActive(cellLineFilter(line)) }"
                  @click="choose(cellLineFilter(line))"
                >
                  <b>{{ line.term }}</b>
                  <span>{{ amountText(line) }}</span>
                </button>
                <span v-if="!hasCellTask(row.cells[column.accountType])" class="task-overview-empty">—</span>
              </div>
            </td>

            <td>
              <div class="task-overview-cell-stack task-overview-cell-stack--total">
                <button
                  v-for="line in row.termTotals"
                  :key="`${row.id}-total-${line.term}`"
                  class="task-overview-term-line"
                  type="button"
                  :class="{ 'is-active': isActive(cellLineFilter(line)) }"
                  @click="choose(cellLineFilter(line))"
                >
                  <b>{{ line.term }}</b>
                  <span>{{ amountText(line) }}</span>
                </button>
                <span v-if="!row.termTotals.length" class="task-overview-empty">—</span>
              </div>
            </td>
          </tr>
        </tbody>

        <tfoot>
          <tr>
            <th>
              <button
                class="task-overview-row-button task-overview-row-button--total"
                type="button"
                :class="{ 'is-active': !props.activeFilter }"
                @click="choose(allFilter())"
              >
                <span>小计</span>
                <small>合计{{ amountText(matrix.grandTotal) }}</small>
              </button>
            </th>
            <td v-for="column in matrix.columns" :key="`grand-${column.accountType}`">
              <div
                class="task-overview-cell-stack task-overview-cell-stack--total"
                :style="filterStyle(column.accountType)"
              >
                <button
                  v-for="line in column.termTotals"
                  :key="`grand-${column.accountType}-${line.term}`"
                  class="task-overview-term-line"
                  type="button"
                  :class="{ 'is-active': isActive(cellLineFilter(line)) }"
                  @click="choose(cellLineFilter(line))"
                >
                  <b>{{ line.term }}</b>
                  <span>{{ amountText(line) }}</span>
                </button>
                <button
                  v-if="hasAmount(column.total)"
                  class="task-overview-term-line task-overview-term-line--sum"
                  type="button"
                  :class="{ 'is-active': isActive(columnFilter(column)) }"
                  @click="choose(columnFilter(column))"
                >
                  <b>合计</b>
                  <span>{{ amountText(column.total) }}</span>
                </button>
              </div>
            </td>
            <td>
              <div class="task-overview-cell-stack task-overview-cell-stack--total">
                <button
                  v-for="line in matrix.termTotals"
                  :key="`grand-total-${line.term}`"
                  class="task-overview-term-line"
                  type="button"
                  :class="{ 'is-active': isActive(grandTermFilter(line)) }"
                  @click="choose(grandTermFilter(line))"
                >
                  <b>{{ line.term }}</b>
                  <span>{{ amountText(line) }}</span>
                </button>
                <button
                  class="task-overview-term-line task-overview-term-line--sum"
                  type="button"
                  :class="{ 'is-active': !props.activeFilter }"
                  @click="choose(allFilter())"
                >
                  <b>合计</b>
                  <span>{{ amountText(matrix.grandTotal) }}</span>
                </button>
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div class="task-overview-pending">
      <div class="section-title">
        <span></span>
        <strong>待分配额度</strong>
        <em>{{ pendingAllocations.length }} 笔 · {{ formatAmount(pendingTotal) }} 亿</em>
      </div>
      <div v-if="pendingAllocations.length" class="task-overview-pending__list">
        <button
          v-for="item in pendingAllocations"
          :key="item.id"
          class="task-overview-pending__item"
          type="button"
          @click="emit('openPending', item)"
        >
          <span>
            <b>{{ item.counterparty }}</b>
            <small>{{ item.tenor }} · {{ item.source }} · {{ item.time }}</small>
          </span>
          <span class="number">
            <b>{{ formatAmount(item.amount) }} 亿</b>
            <small>@{{ item.rate.toFixed(2) }}</small>
          </span>
          <i>分配</i>
        </button>
      </div>
      <div v-else class="empty-state task-overview-pending__empty">暂无待分配额度</div>
    </div>
  </section>
</template>
