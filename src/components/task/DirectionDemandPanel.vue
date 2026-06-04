<script setup lang="ts">
import { computed } from 'vue';
import PanelToolbar from '../common/PanelToolbar.vue';
import type { AccountRow, Direction, PendingAllocation } from '../../data/mockData';
import { tenorLabel } from '../../data/mockData';
import {
  buildDirectionDemandMatrix,
  taskOverviewFilterKey,
  type DirectionDemandCell,
  type DirectionDemandRow,
  type TaskOverviewFilter
} from '../../composables/useTaskOverviewMatrix';

const props = defineProps<{
  direction: Direction;
  accounts: AccountRow[];
  pendingAllocations: PendingAllocation[];
  activeFilter: TaskOverviewFilter | null;
}>();

const emit = defineEmits<{
  selectFilter: [filter: TaskOverviewFilter];
  openPending: [item: PendingAllocation];
  openMatrix: [];
}>();

const directionLabel = computed(() => (props.direction === 'reverse' ? '逆回购需求' : '正回购需求'));
const eyebrow = '中栏 · 作战地图';

const matrix = computed(() => buildDirectionDemandMatrix(props.accounts, props.direction));

const directionPendings = computed(() =>
  props.pendingAllocations.filter((item) => (item.direction ?? 'reverse') === props.direction)
);

const pendingTotal = computed(() =>
  Number(directionPendings.value.reduce((sum, item) => sum + item.amount, 0).toFixed(2))
);

const activeKey = computed(() => taskOverviewFilterKey(props.activeFilter));

const isActive = (filter: TaskOverviewFilter) => taskOverviewFilterKey(filter) === activeKey.value;

const formatAmount = (value: number) => {
  const rounded = Number(value.toFixed(2));
  return Number.isInteger(rounded) ? rounded.toFixed(1) : String(rounded);
};

const progressPct = (amount: { total: number; allocated: number }) =>
  amount.total > 0 ? Math.min(100, Math.round((amount.allocated / amount.total) * 100)) : 0;

const cellFilter = (row: DirectionDemandRow, cell: DirectionDemandCell): TaskOverviewFilter => ({
  scope: 'cell',
  direction: props.direction,
  pledgeGroup: row.group.members,
  pledgeGroupLabel: row.group.label,
  term: cell.term,
  label: `${directionLabel.value} / ${row.group.label} / ${cell.term}`
});

const rowFilter = (row: DirectionDemandRow): TaskOverviewFilter => ({
  scope: 'row',
  direction: props.direction,
  pledgeGroup: row.group.members,
  pledgeGroupLabel: row.group.label,
  label: `${directionLabel.value} / ${row.group.label}`
});

const rowTotalFilter = (row: DirectionDemandRow): TaskOverviewFilter => ({
  scope: 'segment',
  direction: props.direction,
  pledgeGroup: row.group.members,
  pledgeGroupLabel: row.group.label,
  label: `${directionLabel.value} / ${row.group.label} / 合计`
});

const termFilter = (term: import('../../data/mockData').Tenor): TaskOverviewFilter => ({
  scope: 'column',
  direction: props.direction,
  term,
  label: `${directionLabel.value} / ${term}`
});

const grandTotalFilter = (): TaskOverviewFilter => ({
  scope: 'total',
  direction: props.direction,
  label: `${directionLabel.value} / 合计`
});

const directionColor = computed(() =>
  props.direction === 'reverse' ? 'var(--demand-color-reverse, #02adb0)' : 'var(--demand-color-repo, #ff8a34)'
);
</script>

<template>
  <section class="panel demand-panel" :style="{ '--demand-accent': directionColor }">
    <PanelToolbar :eyebrow="eyebrow" :title="directionLabel">
      <button
        type="button"
        class="demand-panel__chip"
        :class="{ 'is-empty': directionPendings.length === 0 }"
        @click="directionPendings.length && emit('openPending', directionPendings[0])"
      >
        待分 {{ directionPendings.length }} 笔 · {{ formatAmount(pendingTotal) }} 亿
      </button>
      <button type="button" class="button button--secondary" @click="emit('openMatrix')">展开矩阵</button>
    </PanelToolbar>

    <div class="demand-panel__table-wrap">
      <table class="demand-panel__table">
        <thead>
          <tr>
            <th class="demand-panel__th demand-panel__th--axis">押券 / 期限</th>
            <th class="demand-panel__th demand-panel__th--total">
              <button
                type="button"
                class="demand-panel__head-btn"
                :class="{ 'is-active': isActive(grandTotalFilter()) }"
                @click="emit('selectFilter', grandTotalFilter())"
              >
                <span>合计</span>
                <small>{{ formatAmount(matrix.grandTotal.total) }}</small>
              </button>
            </th>
            <th v-for="term in matrix.terms" :key="term" class="demand-panel__th">
              <button
                type="button"
                class="demand-panel__head-btn"
                :class="{ 'is-active': isActive(termFilter(term)) }"
                @click="emit('selectFilter', termFilter(term))"
              >
                <span>{{ tenorLabel(term) }}</span>
                <small>{{ formatAmount(matrix.termTotals[term].total) }}</small>
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in matrix.rows" :key="row.group.id">
            <th class="demand-panel__row-head" :style="{ '--row-color': row.group.color }">
              <button
                type="button"
                class="demand-panel__row-btn"
                :class="{ 'is-active': isActive(rowFilter(row)) }"
                @click="emit('selectFilter', rowFilter(row))"
              >
                <span>{{ row.group.label }}</span>
                <small>{{ formatAmount(row.total.total) }}</small>
              </button>
            </th>
            <td class="demand-panel__cell demand-panel__cell--total">
              <button
                type="button"
                class="demand-panel__cell-btn"
                :class="{ 'is-active': isActive(rowTotalFilter(row)), 'is-empty': row.total.total <= 0 }"
                @click="row.total.total > 0 && emit('selectFilter', rowTotalFilter(row))"
              >
                <strong>{{ formatAmount(row.total.total) }}</strong>
                <small>{{ formatAmount(row.total.allocated) }}/{{ formatAmount(row.total.pending) }}</small>
                <span class="demand-panel__progress" :style="{ '--progress': progressPct(row.total) + '%' }"></span>
              </button>
            </td>
            <td v-for="term in matrix.terms" :key="`${row.group.id}-${term}`" class="demand-panel__cell">
              <button
                type="button"
                class="demand-panel__cell-btn"
                :class="{ 'is-active': isActive(cellFilter(row, row.cells[term])), 'is-empty': row.cells[term].total <= 0 }"
                @click="row.cells[term].total > 0 && emit('selectFilter', cellFilter(row, row.cells[term]))"
              >
                <strong>{{ formatAmount(row.cells[term].total) }}</strong>
                <small>{{ formatAmount(row.cells[term].allocated) }}/{{ formatAmount(row.cells[term].pending) }}</small>
                <span class="demand-panel__progress" :style="{ '--progress': progressPct(row.cells[term]) + '%' }"></span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="demand-panel__legend">单元 = 总额 (已分/待分) · 双击展开完整矩阵</p>
  </section>
</template>
