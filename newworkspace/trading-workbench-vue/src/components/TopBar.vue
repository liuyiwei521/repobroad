<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  selectedContext: string;
  noticeCount: number;
  lastAction: string;
}>();

const noticeOpen = ref(false);
</script>

<template>
  <header class="topbar">
    <div class="topbar__brand">
      <div class="topbar__mark">TK</div>
      <nav class="topbar__nav" aria-label="主导航">
        <button class="topbar__nav-item is-active">工作台</button>
        <button class="topbar__nav-item">交易</button>
        <button class="topbar__nav-item">资金</button>
        <button class="topbar__nav-item">行情</button>
        <button class="topbar__nav-item">配置</button>
      </nav>
    </div>

    <div class="topbar__market" aria-label="资金面基准">
      <span class="metric">DR007 <b>1.74%</b></span>
      <span class="metric">融出 <b>62</b></span>
      <span class="metric">报价 <b>48</b></span>
      <span class="metric">成交 <b>17</b></span>
      <span class="metric metric--good">结论 <b>偏松</b></span>
    </div>

    <div class="topbar__tools">
      <label class="topbar__search">
        <span>搜索</span>
        <input value="R014 上海农商" aria-label="全局搜索" readonly />
      </label>
      <button class="context-button">{{ selectedContext }}⌄</button>
      <button class="icon-button" type="button">消息 3</button>
      <div class="notice">
        <button class="icon-button" type="button" @click="noticeOpen = !noticeOpen">
          通知 {{ noticeCount }}
        </button>
        <div v-if="noticeOpen" class="notice__panel">
          <strong>待处理提醒</strong>
          <button>上海农商 R014 待回复</button>
          <button>公募组合保本预警</button>
          <button>待分配余额 3.5 亿</button>
        </div>
      </div>
      <span class="topbar__user">张三</span>
    </div>
  </header>
  <div v-if="lastAction" class="action-strip">{{ lastAction }}</div>
</template>
