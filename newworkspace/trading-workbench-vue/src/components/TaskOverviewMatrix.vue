<script setup lang="ts">
import { computed } from 'vue';
import type { AccountRow, PendingAllocation } from '../data/mockData';
import {
  buildTaskOverviewMatrix,
  taskOverviewFilterKey,
  type TaskOverviewCell,
  type TaskOverviewFilter,
  type TaskOverviewSegment
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
  自营: '#1872f6',
  公募: '#02adb0',
  理财: '#e9b842',
  专户: '#763df2',
  年金: '#ff8a34'
};

const colorOf = (accountType: string) => accountTypeColors[accountType] ?? '#737578';
const formatAmount = (value: number) => {
  const rounded = Number(value.toFixed(2));
  return Number.isInteger(rounded) ? rounded.toFixed(1) : String(rounded);
};
const hasTask = (cell: TaskOverviewCell) => cell.total > 0;

const filterStyle = (accountType: string) => ({
  '--account-type-color': colorOf(accountType)
});

const isActive = (filter: TaskOverviewFilter) => taskOverviewFilterKey(filter) === activeFilterKey.value;

const choose = (filter: TaskOverviewFilter) => {
  emit('selectFilter', filter);
};

const cellFilter = (cell: TaskOverviewCell): TaskOverviewFilter => ({
  scope: 'cell',
  term: cell.term,
  pledgeRequirement: cell.pledgeRequirement,
  accountType: cell.accountType,
  label: `${cell.term} / ${cell.pledgeRequirement} / ${cell.accountType}`
});

const rowFilter = (cell: TaskOverviewCell): TaskOverviewFilter => ({
  scope: 'row',
  term: cell.term,
  pledgeRequirement: cell.pledgeRequirement,
  label: `${cell.term} / ${cell.pledgeRequirement}`
});

const segmentFilter = (segment: TaskOverviewSegment): TaskOverviewFilter => ({
  scope: 'segment',
  term: segment.term,
  label: segment.term
});

const segmentColumnFilter = (segment: TaskOverviewSegment, accountType: string): TaskOverviewFilter => ({
  scope: 'column',
  term: segment.term,
  accountType,
  label: `${segment.term} / ${accountType}`
});

const columnFilter = (accountType: string): TaskOverviewFilter => ({
  scope: 'column',
  accountType,
  label: accountType
});

const allFilter = (): TaskOverviewFilter => ({
  scope: 'all',
  label: '全部任务'
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
      <span>单元格 = 总额 (已分/待分)</span>
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
            <th>押券 / 账户</th>
            <th v-for="accountType in matrix.accountTypes" :key="accountType">
              <button
                class="task-overview-head-button"
                :class="{ 'is-active': isActive(columnFilter(accountType)) }"
                type="button"
                :style="filterStyle(accountType)"
                @click="choose(columnFilter(accountType))"
              >
                <i></i>
                {{ accountType }}
              </button>
            </th>
            <th>合计</th>
          </tr>
        </thead>

        <tbody>
          <template v-for="segment in matrix.segments" :key="segment.term">
            <tr class="task-overview-segment">
              <th :colspan="matrix.accountTypes.length + 2">
                <button
                  type="button"
                  :class="{ 'is-active': isActive(segmentFilter(segment)) }"
                  @click="choose(segmentFilter(segment))"
                >
                  {{ segment.term }}
                </button>
              </th>
            </tr>

            <tr v-for="row in segment.rows" :key="row.id">
              <th>
                <button
                  class="task-overview-row-button"
                  type="button"
                  :class="{ 'is-active': isActive(rowFilter(row.total)) }"
                  @click="choose(rowFilter(row.total))"
                >
                  {{ row.pledgeRequirement }}
                </button>
              </th>
              <td v-for="accountType in matrix.accountTypes" :key="`${row.id}-${accountType}`">
                <button
                  class="task-overview-cell"
                  type="button"
                  :class="{ 'is-active': isActive(cellFilter(row.cells[accountType])), 'is-empty': !hasTask(row.cells[accountType]) }"
                  :style="filterStyle(accountType)"
                  :disabled="!hasTask(row.cells[accountType])"
                  @click="choose(cellFilter(row.cells[accountType]))"
                >
                  <template v-if="hasTask(row.cells[accountType])">
                    <b>{{ formatAmount(row.cells[accountType].total) }}</b>
                    <small>{{ formatAmount(row.cells[accountType].allocated) }}/{{ formatAmount(row.cells[accountType].pending) }}</small>
                  </template>
                  <span v-else>—</span>
                </button>
              </td>
              <td>
                <button
                  class="task-overview-cell task-overview-cell--total"
                  type="button"
                  :class="{ 'is-active': isActive(rowFilter(row.total)) }"
                  :disabled="!hasTask(row.total)"
                  @click="choose(rowFilter(row.total))"
                >
                  <b>{{ formatAmount(row.total.total) }}</b>
                  <small>{{ formatAmount(row.total.allocated) }}/{{ formatAmount(row.total.pending) }}</small>
                </button>
              </td>
            </tr>

            <tr class="task-overview-subtotal">
              <th>小计</th>
              <td v-for="accountType in matrix.accountTypes" :key="`${segment.term}-subtotal-${accountType}`">
                <button
                  class="task-overview-cell task-overview-cell--total"
                  type="button"
                  :class="{ 'is-active': isActive(segmentColumnFilter(segment, accountType)) }"
                  :style="filterStyle(accountType)"
                  :disabled="!hasTask(segment.totals[accountType])"
                  @click="choose(segmentColumnFilter(segment, accountType))"
                >
                  <b>{{ formatAmount(segment.totals[accountType].total) }}</b>
                  <small>{{ formatAmount(segment.totals[accountType].allocated) }}/{{ formatAmount(segment.totals[accountType].pending) }}</small>
                </button>
              </td>
              <td>
                <button
                  class="task-overview-cell task-overview-cell--total"
                  type="button"
                  :class="{ 'is-active': isActive(segmentFilter(segment)) }"
                  :disabled="!hasTask(segment.grandTotal)"
                  @click="choose(segmentFilter(segment))"
                >
                  <b>{{ formatAmount(segment.grandTotal.total) }}</b>
                  <small>{{ formatAmount(segment.grandTotal.allocated) }}/{{ formatAmount(segment.grandTotal.pending) }}</small>
                </button>
              </td>
            </tr>
          </template>
        </tbody>

        <tfoot>
          <tr>
            <th>总计</th>
            <td v-for="accountType in matrix.accountTypes" :key="`grand-${accountType}`">
              <button
                class="task-overview-cell task-overview-cell--total"
                type="button"
                :class="{ 'is-active': isActive(columnFilter(accountType)) }"
                :style="filterStyle(accountType)"
                :disabled="!hasTask(matrix.totals[accountType])"
                @click="choose(columnFilter(accountType))"
              >
                <b>{{ formatAmount(matrix.totals[accountType].total) }}</b>
                <small>{{ formatAmount(matrix.totals[accountType].allocated) }}/{{ formatAmount(matrix.totals[accountType].pending) }}</small>
              </button>
            </td>
            <td>
              <button
                class="task-overview-cell task-overview-cell--total"
                type="button"
                :class="{ 'is-active': isActive(allFilter()) }"
                @click="choose(allFilter())"
              >
                <b>{{ formatAmount(matrix.grandTotal.total) }}</b>
                <small>{{ formatAmount(matrix.grandTotal.allocated) }}/{{ formatAmount(matrix.grandTotal.pending) }}</small>
              </button>
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
