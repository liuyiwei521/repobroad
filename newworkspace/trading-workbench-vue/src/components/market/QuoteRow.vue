<script setup lang="ts">
import { computed, ref } from 'vue';
import { isCoreOpponentLine, quoteStatusLabel, traderForInstitution, type QuoteLine } from './types';

const props = defineProps<{
  line: QuoteLine;
}>();

const emit = defineEmits<{
  openLine: [line: QuoteLine];
  sendLine: [line: QuoteLine];
}>();

const expanded = ref(false);

const statusLabel = (status: QuoteLine['status']) => quoteStatusLabel(status);

const formatAmount = (amount: number) => amount > 0 ? `${amount.toFixed(amount % 1 === 0 ? 0 : 1)}亿` : '待报价';

const cardTraders = computed(() => {
  const primary = traderForInstitution(props.line.institution);
  const fallback = '张经理';
  const templates = [primary, fallback, '刘经理', '周经理'];
  return Array.from(new Set(templates)).slice(0, 4);
});

const rowCards = computed(() => cardTraders.value.map((trader, index) => ({
  id: `${props.line.id}-${trader}-${index}`,
  trader,
  isPinned: index === 0,
  isCore: index === 0 || isCoreOpponentLine(props.line)
})));
</script>

<template>
  <div class="quote-row-block">
    <div
      class="quote-table quote-table--row"
      :class="{
        'is-selected': line.isSelected,
        'is-match': line.isMatched,
        'is-sent': line.isSent,
        'is-expanded': expanded
      }"
      role="button"
      tabindex="0"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
      @keydown.enter.prevent="expanded = !expanded"
      @keydown.space.prevent="expanded = !expanded"
    >
      <span class="quote-counterparty">
        <button
          class="quote-row-expand-button"
          type="button"
          :aria-label="`${expanded ? '收起' : '展开'} ${line.institution}`"
          @click.stop="expanded = !expanded"
        >
          {{ expanded ? '收起' : '展开' }}
        </button>
        <i class="quote-tag" :class="`is-${line.status}`">{{ statusLabel(line.status) }}</i>
        <b>{{ line.institution }}</b>
      </span>
      <span class="number">{{ line.tenor }}</span>
      <span class="number">{{ line.amount > 0 ? `${line.amount.toFixed(line.amount % 1 === 0 ? 0 : 1)}亿` : '--' }}</span>
      <button class="quote-rate" type="button" @click.stop="emit('openLine', line)">
        {{ line.rate.toFixed(2) }}%
      </button>
      <span>{{ line.accountRequirement }}</span>
      <span>{{ line.collateralRequirement }}</span>
      <span class="number">{{ line.updatedAt }}</span>
      <span class="quote-actions">
        <button class="quote-actions__send" type="button" @click.stop="emit('sendLine', line)">发送</button>
      </span>
    </div>

    <div v-if="expanded" class="quote-expand-panel quote-expand-panel--row">
      <div
        v-for="card in rowCards"
        :key="card.id"
        role="button"
        tabindex="0"
        class="quote-expand-card"
        :class="{
          'is-pinned': card.isPinned,
          'is-core': card.isCore,
          'is-sent': line.isSent
        }"
        @click="emit('openLine', line)"
        @keydown.enter.prevent="emit('openLine', line)"
        @keydown.space.prevent="emit('openLine', line)"
      >
        <span class="quote-expand-card__head">
          <b>{{ card.trader }} · {{ line.institution }}</b>
          <em v-if="card.isPinned">置顶</em>
        </span>
        <span class="quote-expand-card__main">
          <strong>{{ formatAmount(line.amount) }}</strong>
          <i>@ {{ line.rate.toFixed(2) }}%</i>
        </span>
        <span class="quote-expand-card__meta">
          <span>{{ line.tenor }}</span>
          <span>{{ statusLabel(line.status) }}</span>
          <span v-if="card.isCore" class="quote-expand-card__tag--core">核心对手</span>
          <span>{{ line.accountRequirement }}</span>
          <span>{{ line.collateralRequirement }}</span>
        </span>
        <span class="quote-expand-card__foot">
          <small>{{ line.updatedAt }}</small>
          <button type="button" @click.stop="emit('sendLine', line)">发送</button>
        </span>
      </div>
    </div>
  </div>
</template>
