<script setup lang="ts">
import type { ChatStatus, ChatThread, QuoteLevel } from '../../data/mockData';
import OpponentCard from './OpponentCard.vue';
import type { OpponentThreadView } from './types';

defineProps<{
  items: OpponentThreadView[];
  activeStatus: ChatStatus | 'all';
  activeLevel: QuoteLevel;
  showLevelControls?: boolean;
}>();

const emit = defineEmits<{
  'update:activeStatus': [value: ChatStatus | 'all'];
  'update:activeLevel': [value: QuoteLevel];
  openChat: [chat: ChatThread, event: MouseEvent];
}>();

const openChat = (chat: ChatThread, event: MouseEvent) => {
  emit('openChat', chat, event);
};
</script>

<template>
  <div class="opponent-list">
    <div class="opponent-list__controls">
      <div class="mini-tabs opponent-status-tabs" aria-label="对手回复状态">
        <button :class="{ 'is-active': activeStatus === 'unreplied' }" type="button" @click="emit('update:activeStatus', 'unreplied')">
          未回复
        </button>
        <button :class="{ 'is-active': activeStatus === 'replied' }" type="button" @click="emit('update:activeStatus', 'replied')">
          已回复
        </button>
        <button :class="{ 'is-active': activeStatus === 'all' }" type="button" @click="emit('update:activeStatus', 'all')">
          全部
        </button>
      </div>

      <div class="opponent-controls-right">
        <div v-if="showLevelControls !== false" class="mini-tabs opponent-level-tabs" aria-label="对手层级">
          <button :class="{ 'is-active': activeLevel === 'level1' }" type="button" @click="emit('update:activeLevel', 'level1')">
            1级
          </button>
          <button :class="{ 'is-active': activeLevel === 'level2' }" type="button" @click="emit('update:activeLevel', 'level2')">
            2级
          </button>
        </div>
        <span class="opponent-legend">颜色=核心/报价优势</span>
      </div>
    </div>

    <div class="opponent-list__body">
      <div v-if="items.length" class="opponent-grid">
        <OpponentCard
          v-for="item in items"
          :key="item.id"
          :item="item"
          @open-chat="openChat"
        />
      </div>

      <div v-else class="empty-state opponent-empty">
        当前条件下暂无对手
      </div>

      <div class="opponent-list__footer">
        <p>── {{ items.length }} 条已全部加载 ──</p>
      </div>
    </div>
  </div>
</template>
