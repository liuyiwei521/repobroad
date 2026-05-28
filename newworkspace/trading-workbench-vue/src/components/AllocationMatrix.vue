<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import type { AccountRow, AllocationCell, DealColumn, Institution, MatrixContext, PendingAllocation } from '../data/mockData';

const matrixEl = ref<HTMLElement | null>(null);
const matrixTableWrap = ref<HTMLElement | null>(null);

const props = defineProps<{
  accounts: AccountRow[];
  institutions: Institution[];
  dealColumns: DealColumn[];
  cells: AllocationCell[];
  matrixContext: MatrixContext | null;
  pendingAllocations: PendingAllocation[];
  expanded: boolean;
  selectedAccountId: string;
}>();

const emit = defineEmits<{
  expand: [];
  close: [];
  save: [payload: Array<{ accountId: string; dealColumnId: string; amount: number }>];
  openPending: [item: PendingAllocation];
  selectAccount: [id: string];
}>();

const drafts = ref<Record<string, number>>({});
const selectedIds = ref<Set<string>>(new Set());
const hasUnsaved = ref(false);
const aiDraftStatus = ref('待生成');
const lastSavedAt = ref('');
const bottomOpen = ref(true);

// Container width drives progressive disclosure when collapsed: the wider the
// left panel is dragged, the more allocation columns are revealed.
const availWidth = ref(0);
let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  if (matrixEl.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver((entries) => {
      availWidth.value = entries[0]?.contentRect.width ?? 0;
    });
    resizeObserver.observe(matrixEl.value);
  }
});

onUnmounted(() => resizeObserver?.disconnect());

// Reveal 完成度/待分 once there is room beyond the core columns, and the deal
// (机构成交) columns once wider still. Always shown in the expanded takeover.
const showProgressPending = computed(() => props.expanded || availWidth.value >= 648);
const showDeals = computed(() => props.expanded || availWidth.value >= 792);

const collapsedCoreWidth = 494;
const collapsedProgressPendingWidth = 138;
const expandedFrozenLeft = 710;
const dealColumnWidth = 104;
const frozenLeft = computed(() =>
  props.expanded
    ? expandedFrozenLeft
    : collapsedCoreWidth + (showProgressPending.value ? collapsedProgressPendingWidth : 0)
);
const tableMinWidth = computed(() => frozenLeft.value + (showDeals.value ? props.dealColumns.length * dealColumnWidth : 0));

// Resizable frozen columns. Each drag overrides the matching --w-* CSS var
// (which drives both the column width and the cumulative sticky-left offsets),
// so unresized columns keep their collapsed/expanded defaults.
type FrozenKey = 'select' | 'id' | 'name' | 'term' | 'instruction' | 'total' | 'diff' | 'progress' | 'pending';
const frozenColumnMins: Record<FrozenKey, number> = {
  select: 32, id: 56, name: 80, term: 48, instruction: 56, total: 56, diff: 56, progress: 60, pending: 56
};
const frozenWidthOverrides = reactive<Partial<Record<FrozenKey, number>>>({});

const frozenColumnVars = computed(() => {
  const out: Record<string, string> = {};
  for (const key of Object.keys(frozenWidthOverrides) as FrozenKey[]) {
    const value = frozenWidthOverrides[key];
    if (value != null) out[`--w-${key}`] = `${value}px`;
  }
  return out;
});

const startColumnResize = (key: FrozenKey, event: PointerEvent) => {
  event.preventDefault();
  event.stopPropagation();
  const cell = (event.target as HTMLElement).closest('th') as HTMLElement | null;
  const startX = event.clientX;
  const startWidth = frozenWidthOverrides[key] ?? cell?.offsetWidth ?? frozenColumnMins[key];
  const min = frozenColumnMins[key];

  const onMove = (move: PointerEvent) => {
    frozenWidthOverrides[key] = Math.max(min, Math.round(startWidth + (move.clientX - startX)));
  };
  const onUp = () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    document.body.classList.remove('is-col-resizing');
  };

  document.body.classList.add('is-col-resizing');
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
};

const keyFor = (accountId: string, dealColumnId: string) => `${accountId}__${dealColumnId}`;
const roundAmount = (value: number) => Number(value.toFixed(2));
const formatAmount = (value: number) => roundAmount(value).toFixed(2);
const formatRate = (value: number) => `${value.toFixed(2)}%`;

const directionLabel = (direction: DealColumn['direction']) => (direction === 'reverse' ? '逆回购' : '正回购');

const institutionById = computed(() => new Map(props.institutions.map((institution) => [institution.id, institution])));

const institutionGroups = computed(() => {
  const groups = new Map<string, { institution: Institution; columns: DealColumn[] }>();

  for (const column of props.dealColumns) {
    const institution = institutionById.value.get(column.institutionId) ?? {
      id: column.institutionId,
      name: '未知机构'
    };
    const group = groups.get(institution.id) ?? { institution, columns: [] };
    group.columns.push(column);
    groups.set(institution.id, group);
  }

  return Array.from(groups.values());
});

// First deal column id of each institution group — used to draw the divider
// between institutions in the 机构 × 期限 grid.
const groupStartIds = computed(() => {
  const ids = new Set<string>();
  for (const group of institutionGroups.value) {
    if (group.columns[0]) ids.add(group.columns[0].id);
  }
  return ids;
});

const activeDealColumn = computed(() => {
  if (!props.matrixContext) return null;
  return props.dealColumns.find((column) => column.id === props.matrixContext?.dealColumnId) ?? null;
});

const seedDrafts = () => {
  const next: Record<string, number> = {};

  for (const cell of props.cells) {
    if (cell.amount > 0) next[keyFor(cell.accountId, cell.dealColumnId)] = cell.amount;
  }

  const context = props.matrixContext;
  if (context?.dealColumnId && context.draftCells?.length) {
    for (const cell of context.draftCells) {
      if (cell.amount > 0) next[keyFor(cell.accountId, context.dealColumnId)] = roundAmount(cell.amount);
    }
  }

  drafts.value = next;
  aiDraftStatus.value = context?.aiDraftStatus ?? '待生成';
  hasUnsaved.value = false;
  lastSavedAt.value = '';
};

watch(
  [() => props.cells, () => props.dealColumns, () => props.matrixContext?.id],
  seedDrafts,
  { immediate: true, deep: true }
);

watch(
  () => props.accounts.map((account) => account.id).join('|'),
  () => {
    selectedIds.value = new Set(props.accounts.map((account) => account.id));
  },
  { immediate: true }
);

const cellAmount = (accountId: string, dealColumnId: string) => Number(drafts.value[keyFor(accountId, dealColumnId)] || 0);

const rowTotal = (account: AccountRow) =>
  roundAmount(props.dealColumns.reduce((sum, column) => sum + cellAmount(account.id, column.id), 0));

const rowDiff = (account: AccountRow) => roundAmount(account.targetAmount - rowTotal(account));
const rowPending = (account: AccountRow) => Math.max(rowDiff(account), 0);
const rowProgress = (account: AccountRow) => account.targetAmount > 0 ? rowTotal(account) / account.targetAmount : 0;

const columnTotal = (dealColumnId: string) =>
  roundAmount(props.accounts.reduce((sum, account) => sum + cellAmount(account.id, dealColumnId), 0));

const columnDiff = (column: DealColumn) => roundAmount(column.dealAmount - columnTotal(column.id));

const totalInstruction = computed(() => roundAmount(props.accounts.reduce((sum, account) => sum + account.targetAmount, 0)));
const totalAllocated = computed(() => roundAmount(props.accounts.reduce((sum, account) => sum + rowTotal(account), 0)));
const totalDiff = computed(() => roundAmount(totalInstruction.value - totalAllocated.value));
const totalPending = computed(() => roundAmount(props.accounts.reduce((sum, account) => sum + rowPending(account), 0)));
const totalProgress = computed(() => totalInstruction.value > 0 ? totalAllocated.value / totalInstruction.value : 0);
const dealAmountTotal = computed(() => roundAmount(props.dealColumns.reduce((sum, column) => sum + column.dealAmount, 0)));
const columnDiffTotal = computed(() => roundAmount(props.dealColumns.reduce((sum, column) => sum + columnDiff(column), 0)));

const activeFilledAmount = computed(() => {
  const column = activeDealColumn.value;
  return column ? columnTotal(column.id) : totalAllocated.value;
});

const activePendingAmount = computed(() => {
  const column = activeDealColumn.value;
  return column ? Math.max(column.dealAmount - activeFilledAmount.value, 0) : Math.max(totalDiff.value, 0);
});

const positiveDiffCount = computed(() => props.dealColumns.filter((column) => columnDiff(column) > 0).length);
const negativeDiffCount = computed(() => props.dealColumns.filter((column) => columnDiff(column) < 0).length);

const saveHint = computed(() => {
  if (negativeDiffCount.value > 0) return `${negativeDiffCount.value} 列超分，可保存但已高亮`;
  if (positiveDiffCount.value > 0) return `${positiveDiffCount.value} 列仍有未分额度，可保存`;
  return '全部成交批次已平衡';
});

const saveHintClass = computed(() => {
  if (negativeDiffCount.value > 0) return 'is-negative';
  if (positiveDiffCount.value > 0) return 'is-positive';
  return 'is-zero';
});

const diffClass = (val: number) => (val === 0 ? 'is-zero' : val > 0 ? 'is-positive' : 'is-negative');

const rowClass = (account: AccountRow) => ({
  'is-selected': account.id === props.selectedAccountId,
  'is-done': account.status === 'done',
  'is-warning': account.status === 'warning'
});

const selectAccountRow = (accountId: string) => emit('selectAccount', accountId);

const toggleSelected = (accountId: string) => {
  const next = new Set(selectedIds.value);
  if (next.has(accountId)) next.delete(accountId);
  else next.add(accountId);
  selectedIds.value = next;
  emit('selectAccount', accountId);
};

const updateCell = (accountId: string, dealColumnId: string, value: string) => {
  const next = { ...drafts.value };
  const key = keyFor(accountId, dealColumnId);
  if (value.trim() === '') {
    delete next[key];
  } else {
    const parsed = Number(value);
    next[key] = Number.isFinite(parsed) ? Math.max(roundAmount(parsed), 0) : 0;
  }
  drafts.value = next;
  hasUnsaved.value = true;
};

const targetColumns = () => {
  const activeId = props.matrixContext?.dealColumnId;
  if (activeId) return props.dealColumns.filter((column) => column.id === activeId);
  return props.dealColumns;
};

const autoDraft = () => {
  const targets = targetColumns();
  const targetIds = new Set(targets.map((column) => column.id));
  const next = { ...drafts.value };

  for (const key of Object.keys(next)) {
    const [, dealColumnId] = key.split('__');
    if (targetIds.has(dealColumnId)) delete next[key];
  }

  for (const column of targets) {
    let columnLeft = column.dealAmount;

    for (const account of props.accounts) {
      if (!selectedIds.value.has(account.id) || account.tenor !== column.term) continue;

      const usedByRow = props.dealColumns.reduce((sum, dealColumn) => {
        return sum + Number(next[keyFor(account.id, dealColumn.id)] || 0);
      }, 0);
      const accountNeed = Math.max(account.targetAmount - usedByRow, 0);
      const amount = Math.min(accountNeed, columnLeft);

      if (amount > 0) {
        next[keyFor(account.id, column.id)] = roundAmount(amount);
        columnLeft = roundAmount(columnLeft - amount);
      }

      if (columnLeft <= 0) break;
    }
  }

  drafts.value = next;
  aiDraftStatus.value = 'AI 草案已生成';
  hasUnsaved.value = true;
};

const clearDraft = () => {
  const next = { ...drafts.value };
  const activeId = props.matrixContext?.dealColumnId;

  if (activeId) {
    for (const key of Object.keys(next)) {
      if (key.endsWith(`__${activeId}`)) delete next[key];
    }
  } else {
    for (const key of Object.keys(next)) delete next[key];
  }

  drafts.value = next;
  hasUnsaved.value = true;
};

const payload = () => {
  const dealColumnIds = new Set(props.dealColumns.map((column) => column.id));
  return Object.entries(drafts.value)
    .map(([key, amount]) => {
      const [accountId, dealColumnId] = key.split('__');
      return { accountId, dealColumnId, amount: Number(amount || 0) };
    })
    .filter((item) => item.amount > 0 && dealColumnIds.has(item.dealColumnId));
};

const save = () => {
  emit('save', payload());
  hasUnsaved.value = false;
  lastSavedAt.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

const collapse = () => {
  save();
  emit('close');
};

const openPending = (item: PendingAllocation) => {
  save();
  emit('openPending', item);
};

const expand = () => emit('expand');

const toggleBottom = async () => {
  const scrollLeft = matrixTableWrap.value?.scrollLeft ?? 0;
  bottomOpen.value = !bottomOpen.value;
  await nextTick();
  if (matrixTableWrap.value) matrixTableWrap.value.scrollLeft = scrollLeft;
};

defineExpose({ save, collapse });
</script>

<template>
  <section
    ref="matrixEl"
    class="matrix"
    :class="{ 'is-expanded': expanded, 'is-collapsed': !expanded, 'has-deals': showDeals }"
    :style="frozenColumnVars"
    aria-label="分配矩阵工作区"
  >
    <header class="matrix__head">
      <div>
        <p class="eyebrow">左侧任务面板 · 扩展形态</p>
        <h2>分配矩阵</h2>
      </div>

      <div class="matrix__actions">
        <span class="matrix-save-hint" :class="saveHintClass">{{ saveHint }}</span>
        <span v-if="lastSavedAt" class="matrix-save-time">已保存 {{ lastSavedAt }}</span>
        <button v-if="expanded" class="button button--secondary" type="button" @click="autoDraft">AI 自动分配</button>
        <button v-if="expanded" class="button button--secondary" type="button" @click="clearDraft">清空</button>
        <button v-if="expanded" class="button button--secondary" type="button" disabled title="暂未开放">新增需求</button>
        <button v-if="expanded" class="button button--secondary" type="button" disabled title="暂未开放">广播</button>
        <span class="matrix-action-break" aria-hidden="true"></span>
        <button class="button button--primary" type="button" @click="save">保存分配</button>
        <button class="button button--secondary" type="button" @click="toggleBottom">
          {{ bottomOpen ? '隐藏底部' : '展开底部' }}
        </button>
        <button v-if="expanded" class="button button--secondary" type="button" @click="collapse">收起</button>
        <button v-else class="button button--secondary" type="button" @click="expand">展开矩阵</button>
      </div>
    </header>

    <div
      v-if="dealColumns.length"
      ref="matrixTableWrap"
      class="matrix-table-wrap"
      :style="{ '--deal-count': dealColumns.length, '--frozen-left': `${frozenLeft}px`, '--deal-width': `${dealColumnWidth}px` }"
    >
      <table class="matrix-table-v2" :style="{ minWidth: `${tableMinWidth}px` }">
        <thead>
          <tr>
            <th class="frozen frozen-select sticky-top-0" :rowspan="showDeals ? 2 : 1">选择<i class="matrix-col-resizer" @pointerdown="startColumnResize('select', $event)" /></th>
            <th class="frozen frozen-id sticky-top-0" :rowspan="showDeals ? 2 : 1">账户ID<i class="matrix-col-resizer" @pointerdown="startColumnResize('id', $event)" /></th>
            <th class="frozen frozen-name sticky-top-0" :rowspan="showDeals ? 2 : 1">账户简称<i class="matrix-col-resizer" @pointerdown="startColumnResize('name', $event)" /></th>
            <th class="frozen frozen-term sticky-top-0" :rowspan="showDeals ? 2 : 1">期限<i class="matrix-col-resizer" @pointerdown="startColumnResize('term', $event)" /></th>
            <th class="frozen frozen-instruction sticky-top-0" :rowspan="showDeals ? 2 : 1">指令<i class="matrix-col-resizer" @pointerdown="startColumnResize('instruction', $event)" /></th>
            <th class="frozen frozen-total sticky-top-0" :rowspan="showDeals ? 2 : 1">总额<i class="matrix-col-resizer" @pointerdown="startColumnResize('total', $event)" /></th>
            <th class="frozen frozen-diff sticky-top-0" :rowspan="showDeals ? 2 : 1">差额<i class="matrix-col-resizer" @pointerdown="startColumnResize('diff', $event)" /></th>
            <th v-if="showProgressPending" class="frozen frozen-progress sticky-top-0" :rowspan="showDeals ? 2 : 1">完成度<i class="matrix-col-resizer" @pointerdown="startColumnResize('progress', $event)" /></th>
            <th v-if="showProgressPending" class="frozen frozen-pending sticky-top-0" :rowspan="showDeals ? 2 : 1">待分<i class="matrix-col-resizer" @pointerdown="startColumnResize('pending', $event)" /></th>
            <th
              v-if="showDeals"
              v-for="group in institutionGroups"
              :key="group.institution.id"
              class="matrix-group-head sticky-top-0"
              :colspan="group.columns.length"
            >
              {{ group.institution.name }}
            </th>
          </tr>

          <tr v-if="showDeals">
            <template v-for="group in institutionGroups" :key="`${group.institution.id}-batches`">
              <th
                v-for="column in group.columns"
                :key="column.id"
                class="matrix-batch-head sticky-top-1"
                :class="{ 'is-group-start': groupStartIds.has(column.id) }"
              >
                <b>{{ column.term }}</b>
                <small>{{ column.batchNo }} · {{ formatRate(column.rate) }}</small>
              </th>
            </template>
          </tr>

          <tr class="matrix-summary-row">
            <th class="frozen frozen-select sticky-top-2"></th>
            <th class="frozen frozen-id sticky-top-2"></th>
            <th class="frozen frozen-name sticky-top-2">总额行</th>
            <th class="frozen frozen-term sticky-top-2"></th>
            <th class="frozen frozen-instruction sticky-top-2"></th>
            <th class="frozen frozen-total sticky-top-2">{{ formatAmount(showDeals ? dealAmountTotal : totalAllocated) }}</th>
            <th class="frozen frozen-diff sticky-top-2"></th>
            <th v-if="showProgressPending" class="frozen frozen-progress sticky-top-2"></th>
            <th v-if="showProgressPending" class="frozen frozen-pending sticky-top-2"></th>
            <template v-if="showDeals">
              <td
                v-for="column in dealColumns"
                :key="`${column.id}-amount`"
                class="matrix-summary-cell sticky-top-2"
                :class="{ 'is-group-start': groupStartIds.has(column.id) }"
              >
                {{ formatAmount(column.dealAmount) }}
              </td>
            </template>
          </tr>

          <tr class="matrix-summary-row matrix-summary-row--diff">
            <th class="frozen frozen-select sticky-top-3"></th>
            <th class="frozen frozen-id sticky-top-3"></th>
            <th class="frozen frozen-name sticky-top-3">差额行</th>
            <th class="frozen frozen-term sticky-top-3"></th>
            <th class="frozen frozen-instruction sticky-top-3"></th>
            <th class="frozen frozen-total sticky-top-3"></th>
            <th class="frozen frozen-diff sticky-top-3" :class="diffClass(showDeals ? columnDiffTotal : totalDiff)">{{ formatAmount(showDeals ? columnDiffTotal : totalDiff) }}</th>
            <th v-if="showProgressPending" class="frozen frozen-progress sticky-top-3"></th>
            <th v-if="showProgressPending" class="frozen frozen-pending sticky-top-3"></th>
            <template v-if="showDeals">
              <td
                v-for="column in dealColumns"
                :key="`${column.id}-diff`"
                class="matrix-diff"
                :class="[diffClass(columnDiff(column)), { 'is-group-start': groupStartIds.has(column.id) }]"
              >
                {{ formatAmount(columnDiff(column)) }}
              </td>
            </template>
          </tr>
        </thead>

        <tbody>
          <tr v-for="account in accounts" :key="account.id" :class="rowClass(account)" @click="selectAccountRow(account.id)">
            <td class="frozen frozen-select check-cell">
              <input
                type="checkbox"
                :checked="selectedIds.has(account.id)"
                :aria-label="`选择 ${account.name}`"
                @change.stop="toggleSelected(account.id)"
              />
            </td>
            <td class="frozen frozen-id number">{{ account.id.replace('acc-', '').toUpperCase() }}</td>
            <td class="frozen frozen-name">
              <b>{{ account.name }}</b>
              <small>{{ account.product }}</small>
            </td>
            <td class="frozen frozen-term number">{{ account.tenor }}</td>
            <td class="frozen frozen-instruction number">{{ formatAmount(account.targetAmount) }}</td>
            <td class="frozen frozen-total number">{{ formatAmount(rowTotal(account)) }}</td>
            <td class="frozen frozen-diff matrix-diff" :class="diffClass(rowDiff(account))">{{ formatAmount(rowDiff(account)) }}</td>
            <td v-if="showProgressPending" class="frozen frozen-progress number">{{ (rowProgress(account) * 100).toFixed(1) }}%</td>
            <td v-if="showProgressPending" class="frozen frozen-pending number">{{ formatAmount(rowPending(account)) }}</td>
            <template v-if="showDeals">
              <td
                v-for="column in dealColumns"
                :key="`${account.id}-${column.id}`"
                class="matrix-edit-cell"
                :class="{ 'is-group-start': groupStartIds.has(column.id) }"
              >
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  :value="drafts[keyFor(account.id, column.id)] ?? ''"
                  @input="updateCell(account.id, column.id, ($event.target as HTMLInputElement).value)"
                />
              </td>
            </template>
          </tr>
        </tbody>

        <tfoot>
          <tr>
            <th class="frozen frozen-select"></th>
            <th class="frozen frozen-id"></th>
            <th class="frozen frozen-name">总计</th>
            <th class="frozen frozen-term"></th>
            <th class="frozen frozen-instruction number">{{ formatAmount(totalInstruction) }}</th>
            <th class="frozen frozen-total number">{{ formatAmount(totalAllocated) }}</th>
            <th class="frozen frozen-diff matrix-diff" :class="diffClass(totalDiff)">{{ formatAmount(totalDiff) }}</th>
            <th v-if="showProgressPending" class="frozen frozen-progress number">{{ (totalProgress * 100).toFixed(1) }}%</th>
            <th v-if="showProgressPending" class="frozen frozen-pending number">{{ formatAmount(totalPending) }}</th>
            <template v-if="showDeals">
              <td
                v-for="column in dealColumns"
                :key="`${column.id}-total`"
                class="matrix-summary-cell"
                :class="{ 'is-group-start': groupStartIds.has(column.id) }"
              >
                {{ formatAmount(columnTotal(column.id)) }}
              </td>
            </template>
          </tr>
        </tfoot>
      </table>
    </div>

    <div v-else class="empty-state matrix-empty">
      暂无成交批次列，可从待分配或聊天快捷分配带入成交。
    </div>

    <footer class="matrix-bottom" :class="{ 'is-collapsed': !bottomOpen }">
      <div class="matrix-bottom__head">
        <strong>当前成交与待分配</strong>
        <em>{{ pendingAllocations.length }} 笔待分配</em>
      </div>

      <div v-if="bottomOpen" class="matrix-bottom__body">
        <div class="matrix-context">
          <span>
            <small>对手</small>
            <b>{{ matrixContext?.counterparty ?? '全量成交' }}</b>
          </span>
          <span>
            <small>期限</small>
            <b>{{ matrixContext?.term ?? '多期限' }}</b>
          </span>
          <span>
            <small>成交总额</small>
            <b>{{ formatAmount(matrixContext?.dealAmount ?? dealAmountTotal) }} 亿</b>
          </span>
          <span>
            <small>利率 / 方向</small>
            <b>
              {{ matrixContext ? formatRate(matrixContext.rate) : '-' }}
              {{ matrixContext ? directionLabel(matrixContext.direction) : '' }}
            </b>
          </span>
          <span>
            <small>已填 / 待分</small>
            <b>{{ formatAmount(activeFilledAmount) }} / {{ formatAmount(activePendingAmount) }}</b>
          </span>
          <span>
            <small>AI 草案</small>
            <b>{{ aiDraftStatus }}</b>
          </span>
        </div>

        <div class="matrix-pending">
          <div class="matrix-pending__head">
            <strong>待分配额度</strong>
            <em>{{ pendingAllocations.length }} 笔</em>
          </div>
          <table v-if="pendingAllocations.length" class="matrix-pending-table">
            <thead>
              <tr>
                <th>对手</th>
                <th>期限</th>
                <th>金额</th>
                <th>利率</th>
                <th>来源</th>
                <th>时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in pendingAllocations" :key="item.id">
                <td>{{ item.counterparty }}</td>
                <td class="number">{{ item.tenor }}</td>
                <td class="number">{{ formatAmount(item.amount) }} 亿</td>
                <td class="number">{{ formatRate(item.rate) }}</td>
                <td>{{ item.source }}</td>
                <td>{{ item.time }}</td>
                <td>
                  <button class="button button--secondary" type="button" @click="openPending(item)">分配</button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-state matrix-pending-empty">暂无待分配额度</div>
        </div>
      </div>
    </footer>
  </section>
</template>
