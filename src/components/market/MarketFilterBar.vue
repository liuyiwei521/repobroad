<script setup lang="ts">
import { tenorLabel, type QuoteLevel, type Tenor } from '../../data/mockData';

type AmountUnit = '亿' | '万';

defineProps<{
  activeLevel: QuoteLevel;
  tenors: Tenor[];
  minTenor: Tenor | '';
  maxTenor: Tenor | '';
  minAmount: string;
  maxAmount: string;
  amountUnit: AmountUnit;
  minRate: string;
  maxRate: string;
  accountKeyword: string;
  collateralKeyword: string;
  onlySame: boolean;
}>();

const emit = defineEmits<{
  'update:activeLevel': [value: QuoteLevel];
  'update:minTenor': [value: Tenor | ''];
  'update:maxTenor': [value: Tenor | ''];
  'update:minAmount': [value: string];
  'update:maxAmount': [value: string];
  'update:amountUnit': [value: AmountUnit];
  'update:minRate': [value: string];
  'update:maxRate': [value: string];
  'update:accountKeyword': [value: string];
  'update:collateralKeyword': [value: string];
  'update:onlySame': [value: boolean];
  exportQuotes: [];
}>();

const inputValue = (event: Event) => (event.target as HTMLInputElement).value;
const checkedValue = (event: Event) => (event.target as HTMLInputElement).checked;
const selectTenorValue = (event: Event) => (event.target as HTMLSelectElement).value as Tenor | '';
const selectAmountUnitValue = (event: Event) => (event.target as HTMLSelectElement).value as AmountUnit;
</script>

<template>
  <div class="market-filter-bar" aria-label="报价筛选">
    <div class="market-filter-row">
      <label class="market-range-field market-range-field--amount">
        <span>金额</span>
        <input
          :value="minAmount"
          type="number"
          min="0"
          step="0.1"
          placeholder="0"
          aria-label="最小金额"
          @input="emit('update:minAmount', inputValue($event))"
        />
        <em>~</em>
        <input
          :value="maxAmount"
          type="number"
          min="0"
          step="0.1"
          placeholder="不限"
          aria-label="最大金额"
          @input="emit('update:maxAmount', inputValue($event))"
        />
        <select :value="amountUnit" aria-label="金额单位" @change="emit('update:amountUnit', selectAmountUnitValue($event))">
          <option value="亿">亿</option>
          <option value="万">万</option>
        </select>
      </label>

      <label class="market-range-field market-range-field--rate">
        <span>利率</span>
        <input
          :value="minRate"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          aria-label="最低利率"
          @input="emit('update:minRate', inputValue($event))"
        />
        <em>~</em>
        <input
          :value="maxRate"
          type="number"
          min="0"
          step="0.01"
          placeholder="不限"
          aria-label="最高利率"
          @input="emit('update:maxRate', inputValue($event))"
        />
        <small>%</small>
      </label>

      <label class="market-tenor-field">
        <span>期限</span>
        <select :value="minTenor" aria-label="最短期限" @change="emit('update:minTenor', selectTenorValue($event))">
          <option value="">不限</option>
          <option v-for="tenor in tenors" :key="tenor" :value="tenor">{{ tenorLabel(tenor) }}</option>
        </select>
        <em>~</em>
        <select :value="maxTenor" aria-label="最长期限" @change="emit('update:maxTenor', selectTenorValue($event))">
          <option value="">不限</option>
          <option v-for="tenor in tenors" :key="tenor" :value="tenor">{{ tenorLabel(tenor) }}</option>
        </select>
      </label>

      <label class="market-keyword-field">
        <span>账户要求</span>
        <input
          :value="accountKeyword"
          type="search"
          placeholder="关键词"
          aria-label="账户要求关键词"
          @input="emit('update:accountKeyword', inputValue($event))"
        />
      </label>

      <label class="market-keyword-field">
        <span>质押要求</span>
        <input
          :value="collateralKeyword"
          type="search"
          placeholder="关键词"
          aria-label="质押要求关键词"
          @input="emit('update:collateralKeyword', inputValue($event))"
        />
      </label>

      <label class="market-match-toggle">
        <input :checked="onlySame" type="checkbox" @change="emit('update:onlySame', checkedValue($event))" />
        <span>仅看匹配账户</span>
      </label>

      <div class="market-action-bar">
        <button :class="{ 'is-active': activeLevel === 'level1' }" type="button" @click="emit('update:activeLevel', 'level1')">
          1级
        </button>
        <button :class="{ 'is-active': activeLevel === 'level2' }" type="button" @click="emit('update:activeLevel', 'level2')">
          2级
        </button>
        <button class="is-download" type="button" @click="emit('exportQuotes')">下载</button>
      </div>
    </div>
  </div>
</template>
