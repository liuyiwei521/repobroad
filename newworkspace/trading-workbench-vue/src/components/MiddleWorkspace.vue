<script setup lang="ts">
import { computed } from 'vue';
import type { AccountRow, PendingAllocation } from '../data/mockData';
import type { DockTab } from './BarometerPanel.vue';
import BarometerPanel from './BarometerPanel.vue';
import TaskOverviewMatrix from './TaskOverviewMatrix.vue';
import TaskOverviewMatrixCompact from './TaskOverviewMatrixCompact.vue';
import type { TaskOverviewFilter } from '../composables/useTaskOverviewMatrix';

const props = defineProps<{
  accounts: AccountRow[];
  pendingAllocations: PendingAllocation[];
  activeFilter: TaskOverviewFilter | null;
  dockHeight: number;
  focusPanel?: DockTab;
}>();

const emit = defineEmits<{
  selectFilter: [filter: TaskOverviewFilter];
  openPending: [item: PendingAllocation];
  openMatrix: [];
  startDockResize: [event: PointerEvent];
}>();

const pendingTotal = computed(() => props.pendingAllocations.reduce((sum, item) => sum + item.amount, 0));
const warningAccounts = computed(() => props.accounts.filter((account) => account.status === 'warning').length);
</script>

<template>
  <div class="middle-workspace" :style="{ '--middle-dock-height': `${dockHeight}px` }">
    <div class="middle-overview-grid">
      <TaskOverviewMatrix
        class="matrix-workspace middle-task-panel"
        :accounts="accounts"
        :pending-allocations="pendingAllocations"
        :active-filter="activeFilter"
        @select-filter="emit('selectFilter', $event)"
        @open-pending="emit('openPending', $event)"
        @open-matrix="emit('openMatrix')"
      />

      <div class="middle-summary-stack">
        <section class="panel middle-demand-panel">
          <div class="panel__head">
            <div>
              <p class="eyebrow">中栏 · 需求看板</p>
              <h2>待分概览</h2>
            </div>
            <span class="panel__meta">{{ pendingAllocations.length }} 笔</span>
          </div>
          <div class="middle-demand-panel__body">
            <div class="middle-demand-panel__stats">
              <div>
                <small>待分总量</small>
                <strong>{{ pendingTotal.toFixed(1) }} 亿</strong>
              </div>
              <div>
                <small>预警账户</small>
                <strong>{{ warningAccounts }}</strong>
              </div>
            </div>
            <div class="middle-demand-panel__list">
              <button
                v-for="item in pendingAllocations.slice(0, 4)"
                :key="item.id"
                type="button"
                class="middle-demand-item"
                @click="emit('openPending', item)"
              >
                <b>{{ item.counterparty }}</b>
                <span>{{ item.tenor }} · {{ item.amount.toFixed(1) }} 亿 · {{ item.rate.toFixed(2) }}%</span>
              </button>
            </div>
            <div class="middle-demand-panel__actions">
              <button class="button button--secondary" type="button" @click="emit('openMatrix')">展开矩阵</button>
            </div>
          </div>
        </section>

        <section class="panel middle-compact-panel">
          <div class="panel__head">
            <div>
              <p class="eyebrow">中栏 · 快览</p>
              <h2>任务概览</h2>
            </div>
            <span class="panel__meta">紧凑视图</span>
          </div>
          <div class="middle-compact-panel__body">
            <TaskOverviewMatrixCompact
              :accounts="accounts"
              :active-filter="activeFilter"
              @select-filter="emit('selectFilter', $event)"
            />
          </div>
        </section>
      </div>
    </div>

    <div
      class="panel-gutter barometer-row-gutter"
      role="separator"
      aria-orientation="horizontal"
      aria-label="拖动调整中栏洞察区高度"
      @pointerdown="emit('startDockResize', $event)"
    />

    <div class="middle-insights-grid">
      <section class="panel middle-insight-card" :class="{ 'is-focused': focusPanel === 'barometer' }">
        <BarometerPanel fixed-tab="barometer" :hide-tabs="true" title="晴雨表" />
      </section>

      <section class="panel middle-insight-card" :class="{ 'is-focused': focusPanel === 'trend' }">
        <BarometerPanel fixed-tab="trend" :hide-tabs="true" title="行情走势" />
      </section>

      <section class="panel middle-insight-card middle-insight-card--wide" :class="{ 'is-focused': focusPanel === 'compare' }">
        <BarometerPanel fixed-tab="compare" :hide-tabs="true" title="个人 & 机构" />
      </section>
    </div>
  </div>
</template>
