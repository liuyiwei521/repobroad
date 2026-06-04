<script setup lang="ts">
import { computed, defineComponent, h, type PropType } from 'vue';
import type { AccountRow, Tenor } from '../data/mockData';
import {
  buildTaskCompactMatrix,
  taskOverviewFilterKey,
  type TaskCompactCell,
  type TaskCompactRow,
  type TaskOverviewAmount,
  type TaskOverviewFilter
} from '../composables/useTaskOverviewMatrix';

const props = defineProps<{
  accounts: AccountRow[];
  activeFilter: TaskOverviewFilter | null;
}>();

const emit = defineEmits<{
  selectFilter: [filter: TaskOverviewFilter];
}>();

const matrix = computed(() => buildTaskCompactMatrix(props.accounts));
const activeFilterKey = computed(() => taskOverviewFilterKey(props.activeFilter));

const formatAmount = (value: number) => {
  const rounded = Number(value.toFixed(2));
  return Number.isInteger(rounded) ? rounded.toFixed(1) : String(rounded);
};
const amountText = (amount: TaskOverviewAmount) =>
  `${formatAmount(amount.total)}(${formatAmount(amount.allocated)}/${formatAmount(amount.pending)})`;
const hasAmount = (amount: TaskOverviewAmount) => amount.total > 0;
const progressPct = (amount: TaskOverviewAmount) =>
  amount.total > 0 ? Math.min(100, Math.round((amount.allocated / amount.total) * 100)) : 0;

const AmountParts = defineComponent({
  props: {
    amount: { type: Object as PropType<TaskOverviewAmount>, required: true }
  },
  setup(componentProps) {
    return () =>
      h('span', { class: 'task-overview-amount' }, [
        h('strong', formatAmount(componentProps.amount.total)),
        h('small', `${formatAmount(componentProps.amount.allocated)}/${formatAmount(componentProps.amount.pending)}`)
      ]);
  }
});

const isActive = (filter: TaskOverviewFilter) => taskOverviewFilterKey(filter) === activeFilterKey.value;
const choose = (filter: TaskOverviewFilter) => emit('selectFilter', filter);

const allFilter = (): TaskOverviewFilter => ({ scope: 'all', label: '全部任务' });

const rowFilter = (row: TaskCompactRow): TaskOverviewFilter => ({
  scope: 'row',
  pledgeGroup: row.group.members,
  pledgeGroupLabel: row.group.label,
  label: row.group.label
});

const termFilter = (term: Tenor): TaskOverviewFilter => ({
  scope: 'total',
  term,
  label: `${term} / 全部任务`
});

const cellFilter = (cell: TaskCompactCell): TaskOverviewFilter => ({
  scope: 'cell',
  term: cell.term,
  pledgeGroup: cell.pledgeGroup,
  pledgeGroupLabel: cell.groupLabel,
  label: `${cell.groupLabel} / ${cell.term}`
});

const rowStyle = (row: TaskCompactRow) => ({ '--pledge-color': row.group.color });
</script>

<template>
  <table class="task-overview-table task-overview-table--compact">
    <thead>
      <tr>
        <th><span class="task-overview-axis-title">押券 / 期限</span></th>
        <th>
          <button
            class="task-overview-head-button task-overview-head-button--total"
            :class="{ 'is-active': !props.activeFilter }"
            type="button"
            @click="choose(allFilter())"
          >
            <span>合计</span>
            <small>{{ amountText(matrix.grandTotal) }}</small>
          </button>
        </th>
        <th v-for="term in matrix.terms" :key="term">
          <button
            class="task-overview-head-button task-overview-head-button--term"
            :class="{ 'is-active': isActive(termFilter(term)) }"
            type="button"
            @click="choose(termFilter(term))"
          >
            <span>{{ term }}</span>
            <small>{{ amountText(matrix.termTotals[term]) }}</small>
          </button>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in matrix.rows" :key="row.group.id">
        <th :style="rowStyle(row)">
          <button
            class="task-overview-row-button"
            type="button"
            :class="{ 'is-active': isActive(rowFilter(row)) }"
            @click="choose(rowFilter(row))"
          >
            <span>{{ row.group.label }}</span>
            <small>{{ amountText(row.total) }}</small>
          </button>
        </th>
        <td>
          <div class="task-overview-cell-stack task-overview-cell-stack--total task-overview-cell-stack--bottom">
            <button
              v-if="hasAmount(row.total)"
              class="task-overview-term-line task-overview-term-line--sum"
              type="button"
              :class="{ 'is-active': isActive(rowFilter(row)) }"
              @click="choose(rowFilter(row))"
            >
              <b>合计</b>
              <AmountParts :amount="row.total" />
              <span
                class="task-overview-progress"
                :style="{ '--progress': progressPct(row.total) + '%' }"
                :class="{ 'is-done': progressPct(row.total) >= 100 }"
              ></span>
            </button>
            <span v-else class="task-overview-empty"></span>
          </div>
        </td>
        <td v-for="term in matrix.terms" :key="`${row.group.id}-${term}`">
          <div
            class="task-overview-cell-stack task-overview-cell-stack--bottom"
            :style="rowStyle(row)"
            :class="{
              'is-active': isActive(cellFilter(row.cells[term])),
              'is-empty': !hasAmount(row.cells[term])
            }"
            @click.self="hasAmount(row.cells[term]) && choose(cellFilter(row.cells[term]))"
          >
            <button
              v-if="hasAmount(row.cells[term])"
              class="task-overview-term-line"
              type="button"
              :class="{ 'is-active': isActive(cellFilter(row.cells[term])) }"
              @click="choose(cellFilter(row.cells[term]))"
            >
              <b>{{ term }}</b>
              <AmountParts :amount="row.cells[term]" />
              <span
                class="task-overview-progress"
                :style="{ '--progress': progressPct(row.cells[term]) + '%' }"
                :class="{ 'is-done': progressPct(row.cells[term]) >= 100 }"
              ></span>
            </button>
            <span v-else class="task-overview-empty"></span>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>
