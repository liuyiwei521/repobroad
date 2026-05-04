# 资金实时行情看板 — 前端界面说明文档

> 版本: v1.0 | 日期: 2026-05-04 | 角色: 产品经理

---

## 目录

1. [产品概述](#1-产品概述)
2. [整体布局架构](#2-整体布局架构)
3. [设计系统](#3-设计系统)
4. [组件树与职责](#4-组件树与职责)
5. [状态管理与数据流](#5-状态管理与数据流)
6. [交互规范](#6-交互规范)
7. [数据接口定义](#7-数据接口定义)
8. [UX 规范](#8-ux-规范)
9. [切换与过渡](#9-切换与过渡)
10. [Mock 数据约束](#10-mock-数据约束)
11. [重构优先级与已知技术债务](#11-重构优先级与已知技术债务)

---

## 1. 产品概述

### 1.1 产品名称

**资金实时行情看板** — 银行间货币市场实时行情工作台

### 1.2 目标用户

- 银行间市场资金交易员（日常盯盘、报价决策）
- 金融机构风控/研究部门（市场监控、利率分析）
- 流动性管理人员（公开市场操作跟踪）

### 1.3 核心价值

单一视图聚合全部银行间资金行情 — XRepo匿名报价、大行双边价格、交易所回购、非银最优报价、NCD/同业存单一二级联动、OMO公开市场操作，以及历史分时/日内/对比趋势图。全屏暗色桌面看板，免页面跳转，一站式盯盘。

### 1.4 技术决策约束

| 约束 | 说明 |
|------|------|
| 平台 | Desktop only，不做响应式/移动端 |
| 视口 | 全屏固定布局 `100vh × 100vw` |
| 路由 | SPA，无前端路由（不引入 react-router） |
| 数据 | 当前全量 Mock 数据，无后端 API 调用 |
| 状态 | Context + useReducer，不引入 Redux/Zustand |
| 样式 | Tailwind CSS v4，不引入 CSS Modules / CSS-in-JS |
| 图表 | Recharts 2.x，不更换图表库 |
| 组件库 | 不使用 shadcn/ui 高级组件，保持原生 Tailwind |

### 1.5 当前状态

可运行的原型。所有数据为硬编码 mock，无异步请求、无 loading/error 状态、无 persisted state（localStorage/URL params）。已有 5 个内容区 + 2 个共享组件 + 6 个 mock 数据文件 + 3 个趋势生成器。

另有 3 个弃用组件（CenterPanel / RightPanel / MarketChartPage）来自早期 Figma Make 导出迭代，当前 `App.tsx` 不引用，可直接删除。

---

## 2. 整体布局架构

### 2.1 页面骨架

```
┌──────────────────────────────────────────────────────────────┐
│ TopBar                    h-10 (40px)     flex-shrink-0       │
├──────────────────────────────────────────────────────────────┤
│ PeriodFilter              ~36px           flex-shrink-0       │
├─────────────────────────────────────────────────────┬────────┤
│                                                     │        │
│  ① MainMarketTable         flex-[30]                │  ④     │
│                             (XRepo/大行价格)          │  BigChartArea
│  ─────────────────────────────────────              │  flex-[65]
│  ② InstitutionCompareTable flex-[28]                │  (分时/历史/对比)
│                             (交易所回购/非银最优)      │        │
│  ─────────────────────────────────────              │────────│
│  ③ BottomDetailTabs        flex-[42]                │  ⑤     │
│                             (OMO/净投放/非银明细)      │  SentimentCard
│                                                     │  flex-[35]
│                                                     │  (情绪/机构回购/NCD/资金结构/同业存款)
├─────────────────────────────────────────────────────┴────────┤
│  LEFT COLUMN w-3/5 (60%)            RIGHT COLUMN w-2/5 (40%) │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 根组件 App.tsx

```tsx
// 文件: src/app/App.tsx
<WorkstationProvider>
  <div className="h-screen w-screen flex flex-col bg-[#0f1e31] text-[#e4ecf5] overflow-hidden">
    <TopBar />
    <PeriodFilter />

    <div className="flex-1 flex gap-1 p-1 overflow-hidden min-h-0">
      {/* 左列 60% */}
      <div className="w-3/5 flex flex-col gap-1 min-h-0">
        <div className="flex-[30] min-h-0"><MainMarketTable /></div>
        <div className="flex-[28] min-h-0"><InstitutionCompareTable /></div>
        <div className="flex-[42] min-h-0"><BottomDetailTabs /></div>
      </div>

      {/* 右列 40% */}
      <div className="w-2/5 flex flex-col gap-1 min-h-0">
        <div className="flex-[65] min-h-0"><BigChartArea /></div>
        <div className="flex-[35] min-h-0"><SentimentCard /></div>
      </div>
    </div>
  </div>
</WorkstationProvider>
```

### 2.3 卡片容器规范

所有 5 个内容区共享同一容器模式：

```
┌─ CardHeader ──────────────────────── px-3 py-1.5 bg-[#132238] ─┐
│ [Tab 按钮组]                     [DownloadBtn 或其他右侧操作]    │
├─ CardBody ──────────────────────── flex-1 min-h-0 overflow-auto ─┤
│                                                                  │
│   数据内容（表 / 图 / 面板）                                      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

外层样式：
```
flex flex-col h-full bg-[#0a1628] border border-[#1e3352] rounded overflow-hidden
```

表头样式：
```
flex items-center justify-between px-3 py-1.5 bg-[#132238] border-b border-[#1e3352] flex-shrink-0
```

### 2.4 响应式策略

**不做响应式**。全量使用固定像素/百分比布局 + `overflow-hidden`。所有面板内部使用 `overflow-auto` 实现独立滚动。

---

## 3. 设计系统

### 3.1 色彩系统

#### 页面/卡片层级

| Token | 颜色值 | 用途 |
|-------|--------|------|
| 页面背景 | `#0f1e31` | 页面底色、PeriodFilter 背景 |
| 卡片背景 | `#0a1628` | 所有 5 个内容区底色、表格偶数行 |
| 表行交替色 | `#0d1a2e` | 表格奇数行 |
| 卡片表头 | `#132238` | 所有卡片的标题栏背景 |
| 表行悬停 | `#18293f` | hover 态背景 |
| 边框 | `#1e3352` | 卡片边框、区域分隔线 |
| 输入框边框 | `#2a4466` | 输入框、Tab 按钮轮廓 |

#### 文字层级

| Token | 颜色值 | 用途 |
|-------|--------|------|
| 主文字 | `#e4ecf5` | 标题、数据值 |
| 次要文字 | `#b0c1d6` | Tab 文字、标签 |
| 辅助文字 | `#8aa0b8` | 字段标签、提示 |
| 占位文字 | `#4a6080` | 输入框 placeholder |
| 弱化文字 | `#6a7f98` | 空状态、尾注 |

#### 语义色

| 语义 | 颜色 | 用途 |
|------|------|------|
| 正回购利率（bid） | `#10b981` (emerald) | 买入方向利率 |
| 逆回购利率（ask） | `#ef4444` (red) | 卖出方向利率 |
| 涨（up） | `#ef4444` (red) | BP 变化正值 |
| 跌（down） | `#10b981` (emerald) | BP 变化负值 |
| 零值/中性 | `#6a7f98` (gray) | BP 变化 = 0 |
| 活跃选中 | `#2563eb` (blue-600) | Tab 激活态、选中行左边框 |
| 选中行背景 | `bg-blue-900/30` | 选中行高亮 |
| 宽松标签 | green | 资金情绪 < 40 |
| 平衡标签 | yellow | 资金情绪 40-60 |
| 偏紧标签 | red | 资金情绪 > 60 |

#### 机构类型色

| 机构类型 | 颜色 | 用途 |
|----------|------|------|
| 大行 | blue-400 | 机构类型徽章 |
| 股份行 | purple-400 | 机构类型徽章 |
| 城商行 | indigo-400 | 机构类型徽章 |
| 券商 | yellow-400 | 机构类型徽章 |
| 基金 | orange-400 | 机构类型徽章 |
| 理财子 | pink-400 | 机构类型徽章 |
| 保险 | teal-400 | 机构类型徽章 |
| 货币 | cyan-400 | 图表堆叠 |

#### 图表系列色

| 系列 | 颜色 |
|------|------|
| 交易所-R-001 | `#10b981` |
| 非银最优-R001 | `#ef4444` |
| 中信证券-R001 | `#3b82f6` |
| 大行-工商银行 | `#a855f7` |
| Xrepo-R007 | `#f59e0b` |

### 3.2 字体系统

| 场景 | 字号 | 字重 | 字体 |
|------|------|------|------|
| 页面主标题 | `text-base` (16px) | `font-semibold` | 系统默认 |
| TopBar 指标值 | `text-sm` (14px) | 默认 | `font-mono` |
| 卡片 Tab 按钮 | `text-[11px]` | 默认 | 系统默认 |
| 筛选区标签 | `text-xs` (12px) | 默认 | 系统默认 |
| 表头 | `text-[10px]` | 默认 | 系统默认 |
| 表格数据 | `text-xs` (12px) | 默认 | `font-mono`（数值） |
| 机构徽章 | `text-[9px]` | 默认 | 系统默认 |
| 空状态提示 | `text-xs` (12px) | 默认 | 系统默认 |
| 数据脚注 | `text-[10px]` | 默认 | 系统默认 |

### 3.3 间距系统

| 场景 | 值 | Tailwind |
|------|-----|----------|
| 区域间隙 | 4px | `gap-1` / `p-1` |
| Tab 按钮组间隙 | 2px | `gap-0.5` |
| Tab 按钮内边距 | h:2px w:8px | `px-2 py-0.5` |
| 表头/筛选区内边距 | h:6px w:12px | `px-3 py-1.5` |
| 表格单元格内边距 | h:6px w:8px | `px-2 py-1.5` |
| 区域分隔线 | 1px | `border-b` |

### 3.4 自定义滚动条

定义在 `src/styles/theme.css`：
- 宽度: 5px
- 轨道: `#0a1628`
- 滑块: `#2a4466`，圆角 3px
- 悬停: `#3a5a88`

---

## 4. 组件树与职责

### 4.1 组件清单

| 编号 | 组件 | 文件 | 状态来源 | 状态写入 |
|------|------|------|----------|----------|
| — | TopBar | `layout/TopBar.tsx` | 无（硬编码） | 无 |
| — | PeriodFilter | `layout/PeriodFilter.tsx` | Context | Context |
| ① | MainMarketTable | `area1-main/MainMarketTable.tsx` | Context | Context |
| ② | InstitutionCompareTable | `area2-institutions/InstitutionCompareTable.tsx` | Context | Context |
| ③ | BottomDetailTabs | `area3-bottom/BottomDetailTabs.tsx` | Context | Context |
| ④ | BigChartArea | `area4-bigchart/BigChartArea.tsx` | Context | Context |
| ⑤ | SentimentCard | `area5-sentiment/SentimentCard.tsx` | 本地 useState | 本地 useState |

### 4.2 TopBar（顶部栏）

**文件**: `src/app/components/layout/TopBar.tsx`

**职责**: 显示应用标题和关键市场指标。

**内容**:
- 左: 标题 "资金实时行情看板"（`text-base font-semibold`）
- 右区域（`gap-4`）:
  - DR007 利率: 当前 2.15%，带红色上箭头（`text-red-500`）
  - 资金面状态徽章: "平衡"（黄底 `bg-yellow-500/15 text-yellow-400`）
  - 系统时间 / 操作按钮等辅助元素

**当前约束**: DR007 值和资金面标签均为硬编码字符串。重构时需要从 API / Context 接入。

### 4.3 PeriodFilter（全局筛选栏）

**文件**: `src/app/components/layout/PeriodFilter.tsx`

**职责**: 提供作用于 Area ① 和 Area ② 的全局筛选条件。

**读取 Context**:
- `selectedPeriod` — 当前选中的期限
- `amountRange` — 金额范围 {min, max}
- `rateRange` — 利率范围 {min, max}

**写入 Context**:
- `setSelectedPeriod`
- `setAmountRange`
- `setRateRange`

**UI 结构**（水平排列，`|` 竖线分隔）:

```
[ 期限 ] [全部] [1] [7] [14] [21] [28+]  |  [ 金额 ] [___] ~ [___] 亿  |  [ 利率 ] [___] ~ [___] %
```

**交互细节**:
- 期限按钮: 点击即生效，active 态 `bg-blue-600 text-white`
- 金额输入: `<input type="number" step="0.1">`，实时 onChange 触发过滤，无 debounce
- 利率输入: `<input type="number" step="0.01">`，实时 onChange 触发过滤
- 空字符串 = "不限"

**影响范围**:
- `selectedPeriod` → Area ①（XRepo 模式）+ Area ②（非银最优模式）
- `amountRange` → Area ① + Area ②
- `rateRange` → Area ① + Area ②
- **不影响**: 大行价格模式、交易所回购模式（这些不使用 selectedPeriod/rateRange）

**内部组件**: `RangeInput` — 通用 min/max 数字输入对，接受 label / unit / value / onChange / placeholder / step props。

### 4.4 ① MainMarketTable（主行情表）

**文件**: `src/app/components/area1-main/MainMarketTable.tsx`

**职责**: 展示一级市场核心报价数据，支持两套数据源切换。

**读取 Context**: `activeSource`, `selectedPeriod`, `amountRange`, `rateRange`
**写入 Context**: `setActiveSource`
**数据来源**: `data/quotes/xrepo.ts` (XRepoQuotes) / `data/quotes/bankPrice.ts` (bankPriceRows)

**Tab 切换**:

| Tab | activeSource 值 | 数据文件 | 行数 |
|-----|-----------------|---------|------|
| XRepo行情 | `"xrepo"` | `xrepoQuotes` | 5 行 |
| 大行价格 | `"bankPrice"` | `bankPriceRows` | 7 行 |

**XRepo 模式列定义**（CSS Grid）:

```
grid-cols-[3.5rem_1fr_1fr_1fr_1fr_3.5rem]
列: 期限 | 正回购金额(亿) | 正回购利率(%) | 逆回购利率(%) | 逆回购金额(亿) | 操作
```

**大行价格模式列定义**:

```
grid-cols-[1fr_1fr_1fr_1fr_2.5rem]
列: 机构 | 银行利率(%) | 非银利率(%) | 更新时间 | 操作
```

**客户端过滤逻辑**（XRepo 模式）:

```typescript
filtered = xrepoQuotes.filter(row => {
  if (selectedPeriod !== "all" && row.period !== selectedPeriod) return false;

  // 金额过滤: max(bidVolume, askVolume)
  if (amountRange.min && Math.max(row.bidVolume, row.askVolume) < parseFloat(amountRange.min)) return false;
  if (amountRange.max && Math.max(row.bidVolume, row.askVolume) > parseFloat(amountRange.max)) return false;

  // 利率过滤: bidRate ~ askRate 区间
  if (rateRange.min && row.bidRate < parseFloat(rateRange.min)) return false;
  if (rateRange.max && row.askRate > parseFloat(rateRange.max)) return false;

  return true;
});
```

**大行价格模式过滤逻辑**:

```typescript
filtered = bankPriceRows.filter(row => {
  if (rateRange.min && row.bankRate < parseFloat(rateRange.min)) return false;
  if (rateRange.max && row.nonbankRate > parseFloat(rateRange.max)) return false;
  // 注意: 大行价格不使用 selectedPeriod 和 amountRange
  return true;
});
```

**行样式**:
- 偶数行: `bg-[#0a1628]`
- 奇数行: `bg-[#0d1a2e]`
- 悬停: `hover:bg-[#18293f]`
- 底边: `border-b border-[#1e3352]/30`
- 报价按钮: `px-1.5 py-0.5 text-[10px]` 蓝色边框按钮
- 编辑图标: 仅大行价格模式，行末铅笔图标

**空状态**: 当过滤后无匹配数据时，显示 `<div>无匹配数据</div>`（`p-4 text-xs text-[#6a7f98] text-center`）

**右侧操作区**: 包含 `DownloadBtn` 组件

### 4.5 ② InstitutionCompareTable（对比行情表）★核心联动组件

**文件**: `src/app/components/area2-institutions/InstitutionCompareTable.tsx`

**职责**: 展示对比数据源的报价，同时作为 **selectedRow 的写入者**，驱动 ④ 大图和 ③ 非银明细联动。

**读取 Context**: `compareSource`, `selectedRow`, `selectedPeriod`, `amountRange`, `rateRange`
**写入 Context**: `setCompareSource`, `setSelectedRow`
**数据来源**: `data/quotes/exchange.ts` / `data/quotes/nonbankBest.ts`

**Tab 切换**:

| Tab | compareSource 值 | 数据文件 |
|-----|-----------------|---------|
| 交易所回购 | `"exchange"` | `exchangeQuotes` (7 行) |
| 非银最优 | `"nonbankBest"` | `nonbankBestQuotes` (5 行) |

**切换 compareSource 时的副作用**: Context reducer 自动将 `selectedRow` 重置为 null。

**交易所回购模式列定义**:

```
grid-cols-[3.5rem_3.5rem_3.5rem_3.5rem_3.5rem_3.5rem_3.5rem]
列: 品种 | 涨跌BP | 加权均价 | 成交(亿) | 最高 | 最低 | 操作
```

- BP 正值为红色（`text-red-500`），负值为绿色（`text-emerald-600`），0 为灰色
- 过滤使用 `weightedAvg`（匹配 rateRange）+ `totalAmount`（匹配 amountRange）

**非银最优模式列定义**:

```
grid-cols-[3.5rem_1fr_1fr_1fr_1fr_3.5rem]
列: 期限 | 正回购金额 | 正回购利率 | 逆回购利率 | 逆回购金额 | 操作
```

过滤逻辑与 XRepo 一致（period + amount + rate）。

**选中行交互**（★核心联动入口）:

1. 用户点击某行 → `setSelectedRow({ source: compareSource, period: row.period })`
2. 再次点击同一行 → `setSelectedRow(null)`（取消选中）
3. 点击"报价"按钮 → `e.stopPropagation()` 阻止冒泡，不触发行选中
4. **Reducer 自动行为**: 若 `bigChartMode === "comparison"` 且 row 非 null，自动切换 `bigChartMode → "intraday"`

**选中行视觉**:
```
bg-blue-900/30 border-l-2 border-l-blue-400
```
左侧蓝色竖条 + 蓝色半透明背景。

**表头提示文字**:
- 无选中: `"点击行 → 联动大图"`
- 有选中: `"已选: {period}"`

### 4.6 ③ BottomDetailTabs（底部详情区）

**文件**: `src/app/components/area3-bottom/BottomDetailTabs.tsx`

**职责**: 展示公开市场操作（OMO）明细/统计 和 机构报价明细。

**读取 Context**: `bottomTab`, `institutionSearch`, `selectedRow`, `compareSource`
**写入 Context**: `setBottomTab`, `setInstitutionSearch`

**三个子面板**:

#### 3a. 逐笔明细 (`omoDetail`)

数据: `omoRecords`（17 条记录，直接 import）

**行列转置布局**（列 = 日期，行 = 字段）:

```
            │ 2026-04-21 │ 2026-04-20 │ 2026-04-17 │ ...
────────────┼────────────┼────────────┼────────────┼─────
  日期      │ 2026-04-21 │ 2026-04-20 │ 2026-04-17 │
  方式      │  逆回购到期 │   逆回购   │  国库定存  │
  期限      │    7D      │    7D      │   91D      │
  利率      │   1.40     │   1.40     │   1.70     │
  金额(亿)  │    -10     │     +5     │  +2000     │
```

- "到期"类记录用弱化色（`text-[#6a7f98]`）
- 金额正值绿色、负值红色
- 左侧日期列 sticky 固定

#### 3b. 净投放统计 (`omoSummary`)

数据: `omoSummary`（8 条记录）

列定义: `日期 | 净投放总额(亿) | 逆回购 | 逆回购到期 | MLF | MLF到期`

- 净投放正值绿色（放水）、负值红色（回笼）
- 0 值灰色
- null 值（MLF 无操作日）灰色显示"---"

#### 3c. 非银明细 (`nonbankDetail`)

数据: `getInstitutionQuotes(compareSource, period)` — 动态生成数据

- **period 来源**: `selectedRow?.period ?? "7"` → 如果无选中行则默认展示 "7D" 数据
- **搜索过滤**: `institutionSearch` 匹配机构名和机构类型
- **提示条**: 无选中行时展示 `"默认展示期限 7D，在 ② 点击行可切换期限"`（蓝色文字）

列定义:
```
col: 机构(名称+类型徽章) | 类型 | 正回购金额 | 正回购利率 | 逆回购利率 | 逆回购金额 | 操作(报价按钮)
```

- 机构名前有类型色徽章（7 种机构类型对应 7 种颜色）
- 利率按 bid/ask 方向着色

### 4.7 ④ BigChartArea（大图区）

**文件**: `src/app/components/area4-bigchart/BigChartArea.tsx`

**职责**: 展示价格趋势图表，受 ② selectedRow 驱动。

**读取 Context**: `bigChartMode`, `selectedRow`
**写入 Context**: `setBigChartMode`

**三种模式**:

#### 4a. 对比 (`"comparison"`)

数据: `generateComparisonData()` — 5 条折线，20 个时间点

固定 5 条线:
1. 交易所-R-001 (绿 `#10b981`)
2. 非银最优-R001 (红 `#ef4444`)
3. 中信证券-R001 (蓝 `#3b82f6`)
4. 大行-工商银行 (紫 `#a855f7`)
5. Xrepo-R007 (黄 `#f59e0b`)

Recharts `<LineChart>`，不响应 selectedRow 变化（始终显示固定 5 条线）。

#### 4b. 分时 (`"intraday"`)

数据: `generateIntraday(baseRate, 60)` — 60 个 5 分钟数据点

- **baseRate 来源**: 如果 `selectedRow.source === "exchange"` → `1.4`，否则 `1.95`
- 上区 (68% 高度): 价格面积图 + 加权均价虚线 + 基准参考线
- 下区 (32% 高度): 成交量柱状图（涨橙色 `#f97316`，跌青色 `#06b6d4`）

图表标题: `{selectedRow.source 对应标签} · {selectedRow.period}` 或 无选中时 `"---"`

#### 4c. 历史 (`"history"`)

数据: `generateHistory(baseRate, 60)` — 60 天日线数据

- 同分时图的 PriceVolumeChart 布局
- baseRate 同分时逻辑

**图表标题**:
- 对比模式: "趋势一览"
- 分时/历史模式: `"{交易所回购/非银最优} · {period}"`，无选中行时 `"---"`

**图表公共样式**:
- 网格线: `stroke="#1e3352" strokeDasharray="3 3"`
- 坐标轴: `stroke="#6a7f98" fontSize={10}`
- Tooltip: `backgroundColor="#132238" border="1px solid #1e3352"`
- 折线: `type="monotone" strokeWidth={1.5} dot={false} activeDot={{r:3}}`

### 4.8 ⑤ SentimentCard（情绪参考区）

**文件**: `src/app/components/area5-sentiment/SentimentCard.tsx`

**职责**: 展示市场情绪指标和补充参考数据。**唯一使用本地 useState 的组件**。

**状态**: 本地 `useState<SentimentTab>("sentiment")`，不写入 Context

**五个子面板**:

#### 5a. 资金情绪 (`"sentiment"`)

数据: `currentSentimentIndex` (51), `sentimentLabel` ("平衡")

- 大数字: 51（`text-4xl font-bold font-mono`）
- 状态徽章: "平衡"（黄色 `bg-yellow-500/15 text-yellow-400`）
- 4 个子项: 全市场(51)、大行(46)、中小行(53)、非银(49)，各有独立色
- 静态说明文字（3 条市场解读）

#### 5b. 分机构回购 (`"instRepo"`)

数据: `institutionRepoSeries`（4 天 × 6 类机构）

Recharts 堆叠柱状图，6 个分类（大行/中小行/货币/券商/理财子/保险），每类不同色。

#### 5c. NCD走势 (`"ncd"`)

数据: `ncdQuotes`（5 行）

表格列: `期限 | 买入 | 卖出 | 涨跌BP | 加权`

- BP 正红负绿，与交易所回购一致

#### 5d. 资金结构 (`"structure"`)

数据: `capitalStructureSeries`（4 天 × 6 类机构）

表格列: `日期 | 大行 | 中小行 | 货币 | 券商 | 理财子 | 保险`

数据脚注: "单位：亿元 · 数据源：CFETS日报"

#### 5e. 同业存款 (`"interbank"`)

数据: `interbankQuotes`（4 行）

表格列: `期限 | 买入利率 | 卖出利率`

数据脚注: "数据源：泰康已接入 · 日更新"

### 4.9 共享组件

#### DownloadBtn

- 文件: `src/app/components/shared/DownloadBtn.tsx`
- Props: `title?` (默认 "导出数据")
- 样式: `px-1.5 py-0.5 text-[10px] text-[#8aa0b8] border border-[#2a4466] rounded hover:text-blue-400 hover:border-blue-400/60`
- **注意**: 当前仅为视觉按钮，无实际下载逻辑。重构时需实现 CSV 导出。

#### CardHeader（未使用）

- 文件: `src/app/components/shared/CardHeader.tsx`
- 当前所有卡片直接在组件内构建 header，未使用此共享组件。重构时可选统一。

### 4.10 待删除组件

以下组件来自早期 Figma Make 导出迭代，当前 `App.tsx` 不引用，可直接删除:

| 组件 | 文件 | 说明 |
|------|------|------|
| CenterPanel | `components/CenterPanel.tsx` | 老版左侧面板，含实时更新模拟、trader tooltip、flash 动画 |
| RightPanel | `components/RightPanel.tsx` | 老版右侧面板，含趋势图 + 实时更新动画 |
| MarketChartPage | `components/MarketChartPage.tsx` | 全屏覆盖式图表页，含 MA20、时间范围选择器 |

---

## 5. 状态管理与数据流

### 5.1 架构

```
WorkstationProvider (Context + useReducer)
    │
    ├── State (9 字段)
    ├── Dispatch (9 Action types)
    └── useWorkstation() hook → 暴露给所有子组件
```

### 5.2 完整状态表

| # | 字段 | 类型 | 默认值 | 写入者 | 读取者 |
|---|------|------|--------|--------|--------|
| 1 | `activeSource` | `"xrepo" \| "bankPrice"` | `"xrepo"` | Area ① | Area ① |
| 2 | `compareSource` | `"exchange" \| "nonbankBest"` | `"exchange"` | Area ② | Area ②, ③, ④ |
| 3 | `selectedPeriod` | `string \| "all"` | `"all"` | PeriodFilter | Area ①, ② |
| 4 | `amountRange` | `{min:string, max:string}` | `{min:"", max:""}` | PeriodFilter | Area ①, ② |
| 5 | `rateRange` | `{min:string, max:string}` | `{min:"", max:""}` | PeriodFilter | Area ①, ② |
| 6 | `selectedRow` | `SelectedRow \| null` | `null` | Area ② | Area ③, ④, Reducer |
| 7 | `bigChartMode` | `"intraday" \| "history" \| "comparison"` | `"comparison"` | Area ④, Reducer | Area ④ |
| 8 | `bottomTab` | `"omoDetail" \| "omoSummary" \| "nonbankDetail"` | `"omoDetail"` | Area ③ | Area ③ |
| 9 | `institutionSearch` | `string` | `""` | Area ③ | Area ③ |

### 5.3 Reducer 特殊逻辑

#### SET_COMPARE_SOURCE — 重置 selectedRow

```typescript
case "SET_COMPARE_SOURCE":
  return { ...state, compareSource: action.source, selectedRow: null };
```

**理由**: 切换 Area ② 数据源后，之前的选中行（属于旧数据源）不再有效。Area ④ 的图表标题和 Area ③ 的 nonbank period 也随之清除。

#### SET_SELECTED_ROW — 自动切换图表模式

```typescript
case "SET_SELECTED_ROW":
  return {
    ...state,
    selectedRow: action.row,
    bigChartMode:
      state.bigChartMode === "comparison" && action.row
        ? "intraday"
        : state.bigChartMode,
  };
```

**理由**: 用户在对比模式下点击某行数据，意图是查看该品种的具体走势。自动从「对比一览」切换到「分时图」可以减少手动切换操作。

**注意**: 仅从 "comparison" → "intraday" 的自动切换。不处理反向切换（从 "intraday" 取消选中不会回到 "comparison"）。

### 5.4 数据流图

```
PeriodFilter ──selectedPeriod──> ① MainMarketTable    — 过滤 XRepo 行
             ──amountRange────> ①, ②                  — 过滤金额
             ──rateRange──────> ①, ②                  — 过滤利率

② InstitutionCompareTable
  row click ──selectedRow──> ④ BigChartArea           — 图表标题 + baseRate
          ──selectedRow──> ③ BottomDetailTabs         — nonbank period
          ──selectedRow──> Reducer                     — 自动切换 bigChartMode

④ BigChartArea ──bigChartMode──> Self                 — 图表渲染

③ BottomDetailTabs ──bottomTab───────> Self           — 面板切换
                   ──institutionSearch──> ③ nonbank    — 机构过滤

⑤ SentimentCard  ──local tab state──> Self             — 5 面板切换 (不与 Context 交互)
```

### 5.5 SentimentCard 为何使用本地状态

Area ⑤ 的 Tab 切换仅影响自身面板，无任何跨组件联动。当前用本地 `useState` 是合理选择。若未来有从外部控制情绪面板的需求（如从 ④ 点击联动到 ⑤），需将 SentimentTab 提升到 Context。

---

## 6. 交互规范

### 6.1 全局筛选 (PeriodFilter)

#### 6.1.1 期限切换

| 操作 | 预期行为 |
|------|----------|
| 点击期限按钮 (全部/1/7/14/21/28+) | 立即设置 `selectedPeriod`，① XRepo 和 ② 非银最优实时过滤 |
| 点击已激活按钮 | 无变化（不取消激活） |
| "全部" | 不按期限过滤（`selectedPeriod === "all"`） |

**注意**: 期限筛选不影响 ① 大行价格模式和 ② 交易所回购模式。

#### 6.1.2 金额范围输入

| 操作 | 预期行为 |
|------|----------|
| 输入最小值后失焦/继续输入 | 实时过滤，无 debounce |
| 仅输入最小值 | 仅应用下限过滤（上限为 "不限"） |
| 仅输入最大值 | 仅应用上限过滤（下限为 0） |
| 清空输入框 | 取消该方向过滤 |
| 输入非法值（字母/符号） | 浏览器原生 number input 阻止 |

**过滤字段**:
- ① XRepo + ② 非银最优: `max(bidVolume, askVolume)`
- ② 交易所回购: `totalAmount`
- ① 大行价格: 不适用（无金额字段过滤）

#### 6.1.3 利率范围输入

| 操作 | 预期行为 |
|------|----------|
| 输入范围 | 实时过滤 |
| 仅最小值 | 过滤 bidRate ≥ min（XRepo）/ bankRate ≥ min（大行价格） |
| 仅最大值 | 过滤 askRate ≤ max（XRepo）/ nonbankRate ≤ max（大行价格） |

### 6.2 Area ① 主行情表交互

#### 6.2.1 数据源切换

| 操作 | 预期行为 |
|------|----------|
| 点击 "XRepo行情" Tab | `setActiveSource("xrepo")`，切换表结构和列 |
| 点击 "大行价格" Tab | `setActiveSource("bankPrice")`，切换表结构和列 |
| 切换时状态保持 | 筛选条件不变，但大行价格模式仅应用 rateRange |

#### 6.2.2 报价按钮

| 操作 | 预期行为 |
|------|----------|
| 点击行末 "报价" 按钮 | **当前**: 无行为（视觉按钮） |
| (重构后) 点击 "报价" | 弹出对应品种的报价 Modal，允许用户提交 bid/ask |

#### 6.2.3 编辑按钮（大行价格模式）

| 操作 | 预期行为 |
|------|----------|
| 点击铅笔图标 | **当前**: 无行为（视觉按钮） |
| (重构后) 点击编辑 | 弹出编辑 Modal，可修改该机构报价 |

### 6.3 Area ② 对比行情表交互 ★核心联动

#### 6.3.1 数据源切换

| 操作 | 预期行为 |
|------|----------|
| 点击 "交易所回购" Tab | `setCompareSource("exchange")` + `selectedRow → null` |
| 点击 "非银最优" Tab | `setCompareSource("nonbankBest")` + `selectedRow → null` |

#### 6.3.2 行选中/取消

| 操作 | 预期行为 |
|------|----------|
| 点击未选中行 | `setSelectedRow({ source, period })` |
| 当前 `bigChartMode === "comparison"` | Reducer 自动切换为 `"intraday"` |
| Area ④ 标题变为 `"{交易所回购/非银最优} · {period}"` | 图表数据源变更为对应品种 |
| Area ③ 非银明细 period 变为选中 period | |
| 行获得蓝色左竖线 + 蓝色半透明背景 | |
| 再次点击同一行 | 取消选中 `setSelectedRow(null)`。Area ④ 标题变 `"---"` |
| 点击 "报价" 按钮 | `e.stopPropagation()` — 不触发行选中 |

#### 6.3.3 选中行视觉反馈

```
选中:  bg-blue-900/30  border-l-2  border-l-blue-400
未选中: bg-[#0a1628] 或 bg-[#0d1a2e]  (交替行颜色)
```

### 6.4 Area ③ 底部详情交互

#### 6.4.1 Tab 切换

| 操作 | 预期行为 |
|------|----------|
| 点击 Tab | `setBottomTab` → 对应面板渲染 |
| 切换时状态保持 | 搜索文本保留，返回时不清除 |

#### 6.4.2 非银明细搜索

| 操作 | 预期行为 |
|------|----------|
| 输入搜索关键词 | 实时过滤（无 debounce），匹配机构名和机构类型 |
| 清空搜索框 | 显示全部 22 家机构 |

#### 6.4.3 非银明细联动

| 场景 | 显示的 period |
|------|---------------|
| ② 有选中行 | 使用 `selectedRow.period` |
| ② 无选中行 | 默认 `"7"` |
| 提示横幅 | 无选中行时显示蓝色提示 `"默认展示期限 7D，在 ② 点击行可切换期限"` |

### 6.5 Area ④ 大图区交互

#### 6.5.1 图表模式切换

| 操作 | 预期行为 |
|------|----------|
| 点击 "分时" | `setBigChartMode("intraday")` → 日内分时图 |
| 点击 "历史" | `setBigChartMode("history")` → 历史日线图 |
| 点击 "对比" | `setBigChartMode("comparison")` → 5 线对比图 |

#### 6.5.2 图表联动

| 场景 | ④ 响应 |
|------|--------|
| ② 选中行 | 标题更新为 `"{source} · {period}"`，baseRate 更新，图表数据重新生成 |
| ② 取消选中 | 标题变 `"---"`，图表使用默认 baseRate |
| 点击 "对比" 模式 | 不受 selectedRow 影响，始终显示 5 固定系列 |
| 对比模式 + ② 选中行 | 自动切到 "分时" 模式（Reducer 5.3 逻辑） |

#### 6.5.3 图表内部交互

| 操作 | 预期行为 |
|------|----------|
| 鼠标悬停数据点 | Recharts Tooltip 显示时间 + 价格/成交量 |
| 悬停图例 | Recharts 默认 Legend hover 高亮对应系列 |

### 6.6 Area ⑤ 情绪参考交互

| 操作 | 预期行为 |
|------|----------|
| 点击 5 个 Tab | 本地 useState 切换，不影响其他任何组件 |
| 悬停堆叠柱状图 | Recharts Tooltip 显示各机构类型数值 |

### 6.7 报价/编辑按钮（全局占位）

所有表格中的 "报价" 和 "编辑" 按钮当前均为纯视觉占位符，点击无行为。重构时需实现:

| 按钮 | 出现位置 | 目标行为 |
|------|----------|----------|
| 报价 | ① XRepo 模式、② 非银最优模式、③ 非银明细 | 打开报价 Modal |
| 编辑 | ① 大行价格模式 | 打开编辑 Modal |

---

## 7. 数据接口定义

以下为重构后预期的 API 接口契约。当前所有数据均通过直接 import 获取，重构时替换为 fetch/axios 调用。

### 7.1 报价数据接口

#### GET /api/quotes/{source}

**参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| source | string | `xrepo` / `bankPrice` / `exchange` / `nonbankBest` / `ncd` / `interbank` |

**返回**: `Quote[]`

```typescript
interface Quote {
  period: string;        // 期限，如 "7" "GC001" "3M"
  bidVolume: number;     // 正回购金额（亿）
  bidRate: number;       // 正回购利率（%）
  askRate: number;       // 逆回购利率（%）
  askVolume: number;     // 逆回购金额（亿）
  // 以下仅交易所回购返回
  weightedAvg?: number;  // 加权均价
  totalAmount?: number;  // 成交总量（亿）
  changeBp?: number;     // 涨跌 BP
  high?: number;
  low?: number;
  lastPrice?: number;
  openRate?: number;
  prevClose?: number;
}
```

#### GET /api/quotes/bankPrice

**返回**: `BankPriceRow[]`

```typescript
interface BankPriceRow {
  institution: string;   // 机构名
  bankRate: number;      // 银行利率（%）
  nonbankRate: number;   // 非银利率（%）
  updateTime: string;    // 更新时间 HH:mm:ss
}
```

### 7.2 公开市场操作接口

#### GET /api/omo/records

**返回**: `OmoRecord[]`

```typescript
interface OmoRecord {
  date: string;          // YYYY-MM-DD
  type: "逆回购" | "逆回购到期" | "MLF" | "MLF到期" | "国库定存" | "TMLF";
  period: string;        // 期限，如 "7D" "1Y" "91D"
  rate: number;          // 利率（%）
  amount: number;        // 操作金额（亿），到期为负
}
```

#### GET /api/omo/summary

**返回**: `OmoSummary[]`

```typescript
interface OmoSummary {
  date: string;
  netInject: number;     // 净投放（亿），正=放水，负=回笼
  repo: number;
  repoMaturity: number;
  mlf: number | null;
  mlfMaturity: number | null;
}
```

### 7.3 趋势时序接口

#### GET /api/trends/intraday?source={source}&period={period}

**返回**: `PriceVolumePoint[]`

```typescript
interface PriceVolumePoint {
  time: string;          // HH:mm
  price: number;         // 成交价
  weightedAvg?: number;  // 加权均价
  volume: number;        // 成交量（亿）
}
```

#### GET /api/trends/history?source={source}&period={period}&days={days}

**返回**: `PriceVolumePoint[]`（同上，time 为日期格式 YYYY-MM-DD）

#### GET /api/trends/comparison

**返回**: `TimePoint[]`

```typescript
interface TimePoint {
  time: string;
  [seriesKey: string]: number | string;  // 动态键，如 exchange_R001: 1.38
}
```

### 7.4 参考数据接口

#### GET /api/reference/sentiment

**返回**:
```typescript
{
  currentIndex: number;       // 当前情绪指数 (0-100)
  label: "宽松" | "平衡" | "偏紧";
  details: {
    fullMarket: number;
    bigBank: number;
    smallBank: number;
    nonBank: number;
  };
}
```

#### GET /api/reference/institutionRepo?days={days}

**返回**: `StructurePoint[]`

#### GET /api/reference/capitalStructure?days={days}

**返回**: `StructurePoint[]`

#### GET /api/reference/institutions

**返回**: `Institution[]`（22 家机构列表，通常作为静态数据缓存）

### 7.5 机构报价接口

#### GET /api/quotes/institutions?source={source}&period={period}

**返回**: `InstQuote[]`

```typescript
interface InstQuote {
  institutionId: string;
  institutionName: string;
  institutionType: InstitutionType;
  source: SourceId;
  period: string;
  bidRate: number;
  bidVolume: number;
  askRate: number;
  askVolume: number;
}
```

---

## 8. UX 规范

### 8.1 加载态（重构新增）

当前无任何加载态（数据同步获取）。API 化后需补充:

| 组件 | 加载态行为 |
|------|-----------|
| 全局 | 首次加载时显示全屏加载骨架屏（对应 5 个区域的占位块） |
| ① 表格 | 显示 5/7 行灰色闪烁骨架行（skeleton rows） |
| ② 表格 | 同上，根据当前数据源行数 |
| ③ 面板 | Tab 内容区显示骨架 |
| ④ 图表 | 显示空图表框架 + 中心 spinner |
| ⑤ 面板 | 情绪面板各子项显示骨架 |

**骨架屏实现**: 使用 `ui/skeleton.tsx`（shadcn 骨架组件，已存在但未使用）或纯 Tailwind `animate-pulse bg-[#18293f]`。

**加载超时**: 5 秒后显示"加载超时，点击重试"，提供 `onRetry` 按钮。

### 8.2 空状态

| 场景 | 当前状态 | 规范要求 |
|------|----------|----------|
| ① XRepo 过滤无结果 | `"无匹配数据"` 居中文本 | 保持现有 + 添加"清空筛选"按钮 |
| ① 大行价格过滤无结果 | 无 | 添加空状态（与 XRepo 一致） |
| ② 交易所/非银过滤无结果 | 无 | 添加 `"无匹配数据"` 空状态 |
| ② 无选中行时 ④ 标题 | `"---"` | 保持现有 |
| ③ 非银搜索无结果 | 无 | 添加 `"未找到匹配机构"` 提示 |
| ④ 无选中行时图表 | 仍显示数据 | 保持现有（有默认 baseRate） |
| ⑤ 所有面板 | 总有数据（静态） | API 化后需补充空状态 |

**空状态统一规范**:
```
<div className="flex items-center justify-center h-full">
  <div className="text-center">
    <p className="text-xs text-[#6a7f98]">无匹配数据</p>
    {onClearFilter && <button>清空筛选</button>}
  </div>
</div>
```

### 8.3 错误态（重构新增）

| 错误类型 | 行为 |
|----------|------|
| 网络错误 | 区域级错误提示 "加载失败，请检查网络连接"，带重试按钮 |
| 服务端 5xx | 区域级错误提示 "服务异常，稍后重试" |
| 数据为空 (API 返回 []) | 与空状态一致 |
| 数据格式错误 | 静默降级 + console.error，不崩溃页面 |

**Error Boundary**: 每个内容区域包裹独立 ErrorBoundary，单个区域错误不影响其他区域。

### 8.4 实时更新（重构新增）

重构后的实时数据刷新策略:

| 数据 | 刷新频率 | 方式 |
|------|----------|------|
| ① 报价表 | 3-5s | Polling / WebSocket |
| ② 对比表 | 3-5s | Polling / WebSocket |
| ④ 分时图 | 3-5s（增量更新最后一分钟） | Polling / WebSocket |
| ③ / ⑤ | 手动刷新或较长间隔（10-30s） | Polling |

**刷新视觉反馈**:
- 数据行变化时: 短暂黄色高亮闪烁 (200ms → ease-out 1s)
- 过期提示: 超过 30s 未刷新，TopBar 显示 "数据延迟" 黄色警告

### 8.5 数据精度与格式

| 数据类型 | 格式 | 示例 |
|----------|------|------|
| 利率 | 保留 4 位小数 | 1.3650 |
| 利率（展示） | 保留 2 位小数 | 1.37 |
| 金额 | 亿为单位，保留 2 位 | 14.93 |
| BP 变化 | 保留 1 位小数，带符号 | -1.0 → "-1.0" |
| 百分比 | % 后缀 | "1.37%" |
| 时间 | 24 小时制 HH:mm:ss | 10:32:15 |

### 8.6 键盘导航（重构新增）

| 快捷键 | 行为 |
|--------|------|
| Tab | 在可聚焦元素间切换 |
| ↑ ↓ | 在 ② 表格中移动选中行 |
| Enter | 确认选中 ② 当前行 |
| Escape | 取消选中 / 关闭弹窗 |
| 1/2/3/4/5 | 后续可映射到 5 个区域快捷键 |

### 8.7 行列悬停效果

| 元素 | 行为 |
|------|------|
| 表格行 | `hover:bg-[#18293f]`，平滑过渡 |
| Tab 按钮 | `hover:bg-[#18293f]` 后 `transition-colors` |
| 报价按钮 | `hover:text-blue-400 hover:border-blue-400/60` |
| 下载按钮 | 同上 |
| 输入框 | `focus:outline-none focus:border-blue-500` |

---

## 9. 切换与过渡

### 9.1 Tab 切换动画

**当前状态**: 无动画，直接条件渲染。

**规范要求**:

| 切换场景 | 过渡效果 | 时长 |
|----------|----------|------|
| 所有 Tab 切换（内容区） | 旧内容淡出 → 新内容淡入 | 150ms ease-in-out |
| 表格数据源切换 | 同上（整个表格区域） | 150ms |
| 图表模式切换 | 旧图淡出，新图从当前数据点渐入 | 200ms |

**实现方式**: CSS `transition: opacity` + React key 变化触发重新挂载，或用 `motion` 库已安装的 fade。

### 9.2 图表数据过渡

| 场景 | 行为 |
|------|------|
| ② 选中行变化 → ④ 图表切换品种 | 面积图平滑过渡到新 baseRate（Recharts `animationDuration={300}`） |
| 分时 → 历史 | 图表容器过渡 |
| 对比 → 分时（自动） | 直接切换，不做特殊动画 |

### 9.3 筛选过渡

| 场景 | 行为 |
|------|------|
| 输入金额/利率范围 | 表格行即时过滤（无动画，直接更新列表） |
| 切换期限 | 同上，即时 |
| 搜索输入（非银明细） | 同上 |

**注意**: 当前 `onChange` 无 debounce。如果未来行数增长到 100+ 行且包含虚拟列表，可添加 150ms debounce。

### 9.4 选中行高亮过渡

| 场景 | 行为 |
|------|------|
| 行被选中 | 蓝色左边框 + 淡蓝背景，150ms transition |
| 行被取消选中 | 恢复到交替行颜色，150ms transition |

### 9.5 卡片尺寸变化

各卡片使用固定 flex 比例（`flex-[30]` / `flex-[28]` / `flex-[42]` / `flex-[65]` / `flex-[35]`），切换内容区时不改变卡片尺寸。无尺寸过渡动画。

### 9.6 表格闪烁效果（实时更新时）

模拟实时行情更新时的数据行闪烁:
```
@keyframes flash-update {
  0%   { background-color: rgba(59, 130, 246, 0.25); }  // 蓝色闪烁
  100% { background-color: transparent; }
}
animation: flash-update 1.5s ease-out;
```

### 9.7 滚动行为

| 场景 | 行为 |
|------|------|
| ② 选中行切换 | **不**自动滚动到选中行（当前行为，保持） |
| Tab 切换 | 保持滚动位置（条件渲染替换内容，滚动容器不变） |
| 过滤后行数变化 | 滚动位置不变（`overflow-auto` 自然行为） |

---

## 10. Mock 数据约束

### 10.1 数据量约束

当前 mock 数据为极小样本集，与真实数据量存在显著差异:

| 数据文件 | Mock 行数 | 真实预期 | 差异影响 |
|----------|-----------|----------|----------|
| `xrepoQuotes` | 5 | 可能 10-20 个期限 | 表格行数、过滤性能 |
| `bankPriceRows` | 7 | 可能 15-30 家机构 | 表格高度、滚动 |
| `exchangeQuotes` | 7 | 可能 10-15 个品种 | 一次性全部渲染 OK |
| `nonbankBestQuotes` | 5 | 可能 10+ 个期限 | 过滤逻辑需验证 |
| `ncdQuotes` | 5 | 可能 10+ 个期限 | 小表格，影响不大 |
| `interbankQuotes` | 4 | 可能 6-10 个期限 | 同上 |
| `omoRecords` | 17 | 可能 50-100 条 | 转置表格列数增加，需水平滚动 |
| `institutions` | 22 | 可能 30-50 家 | ③ 非银明细行数增加 |
| 趋势数据点 | 20-60 | 可能 200-1000 点 | 图表渲染性能、Recharts 数据量上限 |

### 10.2 数据值约束

**利率值**: Mock 中所有利率高度雷同（bidRate 几乎全是 1.95，askRate 全是 2.00），真实数据会有更广的数值范围和波动:
- XRepo: bid 1.25-1.95, ask 2.00（只有 1 个变异值）
- 非银最优: 全部 1.95/2.00（无变异）
- 真实市场 bid/ask 利差会变化，不同期限间有期限结构曲线

**金额**: Mock 单笔量 0.2-12 亿，但真实市场单笔可达 50-100 亿+。交易所回购 `totalAmount` 差异大（5.91 ~ 6157.2 亿），这是唯一较真实的值。

### 10.3 随机数据问题

以下生成器每次调用产���**不同的随机数据**，导致:
- 每次渲染图表不同，无法进行视觉回归测试
- 调试时无法复现问题
- 趋势无意义（纯随机游走，非真实市场走势）

| 函数 | 文件 | 影响 |
|------|------|------|
| `generateIntraday()` | `trends/intraday.ts` | ④ 分时图 |
| `generateHistory()` | `trends/history.ts` | ④ 历史图 |
| `generateComparisonData()` | `trends/comparison.ts` | ④ 对比图 |
| `getInstitutionQuotes()` | `institutionQuotes.ts` | ③ 非银明细 |
| `generateSentimentSeries()` | `reference/sentiment.ts` | ⑤ 情绪面板（未使用） |

**解决方案**: 使用 seeded random（如 `seedrandom` 库固定种子）或直接使用静态快照数据。

### 10.4 缺少的字段

当前 mock 数据缺少以下真实场景需要的字段:

| 缺失字段 | 所需组件 | 说明 |
|----------|----------|------|
| 报价人/交易员信息 | ①, ② | 旧 CenterPanel 有，新组件去掉了 |
| 报价状态（有效/过期/撤单） | ①, ② | 行状态标识 |
| 更新时间戳（精确） | 所有表格 | 目前仅大行价格有 `updateTime` |
| 涨跌幅% | ② 交易所 | 当前仅有 BP 变化 |
| 昨收价 `prevClose` | ② 交易所 | Quote 接口已有字段但实际数据未使用 |
| 总市值/存量 | ⑤ 资金结构 | 当前仅交易量数据 |

### 10.5 数据源覆盖不完整

| 缺失数据源 | 说明 |
|------------|------|
| QTrade 报价 | 旧 CenterPanel 有，新版本去掉了 |
| CFETS 官方利率 | ⑤ 资金结构引用了但无独立数据 |
| 外汇交易中心实时行情 | 可作为 DR007 等指标的真实来源 |

### 10.6 硬编码常量

以下值在组件中硬编码，应提取为数据源/配置:

| 值 | 位置 | 应来源 |
|----|------|--------|
| DR007 = 2.15% | TopBar | API /api/indicators/dr007 |
| 资金面 = "平衡" | TopBar | API /api/reference/sentiment |
| baseRate = 1.4 / 1.95 | BigChartArea | 从选中行实际加权均价计算 |
| 情绪指数 = 51 | SentimentCard | API |
| 情绪静态解读文字 | SentimentCard | 动态生成或 CMS |

---

## 11. 重构优先级与已知技术债务

### 11.1 重构阶段

#### 阶段 0: 清理（1-2h）

- [ ] 删除 3 个弃用组件: `CenterPanel.tsx`, `RightPanel.tsx`, `MarketChartPage.tsx`
- [ ] 移除未使用依赖（MUI, react-dnd, embla-carousel 等 ~15 个包）
- [ ] 清理 `hooks/` 空目录或创建第一个 hook
- [ ] 确认 `CardHeader` 组件是否使用，如不用则删除或统一接入所有卡片

#### 阶段 1: 类型与状态（3-4h）

- [ ] 拆分 `Quote` 类型为领域专属类型（`XrepoQuote`, `ExchangeQuote`, `NcdQuote`, 等）
- [ ] 提取 Reducer 到独立文件 `context/workstationReducer.ts`
- [ ] 添加 memoized selectors（如 `useFilteredQuotes`）
- [ ] 创建 `context/selectors.ts`（复用过滤逻辑）
- [ ] 添加 Reducer 单元测试
- [ ] 考虑将 SentimentCard 本地状态是否提升到 Context

#### 阶段 2: 数据层抽象（4-6h）

- [ ] 创建 `services/` 目录 + API service 接口层
- [ ] 为每个数据源创建 `useXxxData()` hook（先返回 mock 数据，接口不变）
- [ ] 将趋势生成器改为 seeded random 或静态快照
- [ ] 添加数据刷新策略（SWR / React Query 或手动 polling）
- [ ] 实现 DownloadBtn 的 CSV 导出逻辑

#### 阶段 3: UX 完善（4-6h）

- [ ] 为每个内容区添加 ErrorBoundary
- [ ] 添加加载骨架屏（LoadingSkeleton）
- [ ] 补全所有空状态
- [ ] 添加错误态 + 重试按钮
- [ ] TopBar 接入实时数据（DR007, 情绪）
- [ ] 添加报价/编辑 Modal（之前为视觉占位）

#### 阶段 4: 性能与体验（2-3h）

- [ ] 表格行 `React.memo` 优化（避免整表重渲染）
- [ ] 图表数据 `useMemo` 审计
- [ ] 筛选 debounce（如果行数增长）
- [ ] Tab 切换过渡动画
- [ ] 实时更新行闪烁效果
- [ ] 键盘导航（↑↓ 选择行、Esc 取消）

### 11.2 技术债务清单

| 债务 | 严重度 | 说明 |
|------|--------|------|
| Quote 类型过载 | 高 | 同类型承载 XRepo + 交易所 + NCD + 同业存款，可选字段可达 7 个 |
| 趋势数据随机化 | 高 | 每次渲染不同，调试不可复现 |
| 无错误/加载态 | 高 | 所有数据同步获取，API 化后必然出现 |
| Direct import 数据 | 中 | 跨层直接引用数据文件，无法中间件拦截/缓存 |
| 未使用依赖过多 | 中 | 约 15 个包未使用，增加安装时间和安全面 |
| 筛选逻辑重复 | 中 | 相似的筛选代码在 MainMarketTable 和 InstitutionCompareTable 各写一遍 |
| DownloadBtn 无逻辑 | 低 | 视觉占位 |
| 报价/编辑按钮无逻辑 | 低 | 视觉占位 |
| CardHeader 未统一使用 | 低 | 每个组件自己写 header，不统一 |
| TopBar 硬编码 | 低 | DR007、情绪值应来自于数据层 |
| 无测试 | 低 | 0 个测试文件、0 个测试依赖 |

### 11.3 不改动的决策

| 决策 | 理由 |
|------|------|
| 不引入前端路由 | SPA 单页看板，无多页面需求 |
| 不做移动端适配 | 产品定位为桌面盯盘工具 |
| 不更换图表库 | Recharts 2.x 满足需求 |
| 不换状态管理 | Context+useReducer 对当前状态复杂度足够（9 字段） |
| 不换 CSS 方案 | Tailwind v4 已全量使用，换框架成本太高 |
| 不引入 SSR/SSG | 纯客户端应用 |

---

## 附录 A: 文件清单

### 保留并修改

```
src/app/App.tsx                                      — 根布局
src/main.tsx                                         — 入口
src/app/context/WorkstationContext.tsx                — 全局状态
src/app/data/types.ts                                — 类型定义
src/app/data/sources.ts                              — 数据源元数据
src/app/data/institutions.ts                         — 机构列表
src/app/data/institutionQuotes.ts                    — 机构报价生成
src/app/data/quotes/xrepo.ts                         — Mock 数据
src/app/data/quotes/bankPrice.ts                     — Mock 数据
src/app/data/quotes/exchange.ts                      — Mock 数据
src/app/data/quotes/nonbankBest.ts                    — Mock 数据
src/app/data/quotes/ncd.ts                           — Mock 数据
src/app/data/quotes/interbank.ts                     — Mock 数据
src/app/data/quotes/index.ts                         — 统一访问入口
src/app/data/reference/omo.ts                        — Mock 数据
src/app/data/reference/sentiment.ts                  — Mock 数据
src/app/data/reference/institutionRepo.ts            — Mock 数据
src/app/data/reference/capitalStructure.ts            — Mock 数据
src/app/data/trends/comparison.ts                    — Mock 数据
src/app/data/trends/intraday.ts                      — Mock 数据
src/app/data/trends/history.ts                       — Mock 数据
src/app/components/layout/TopBar.tsx                 — 顶部栏
src/app/components/layout/PeriodFilter.tsx            — 全局筛选
src/app/components/area1-main/MainMarketTable.tsx     — ① 主行情表
src/app/components/area2-institutions/InstitutionCompareTable.tsx — ② 对比行情表
src/app/components/area3-bottom/BottomDetailTabs.tsx  — ③ 底部详情
src/app/components/area4-bigchart/BigChartArea.tsx    — ④ 大图区
src/app/components/area5-sentiment/SentimentCard.tsx  — ⑤ 情绪参考
src/app/components/shared/DownloadBtn.tsx             — 下载按钮
src/app/components/shared/CardHeader.tsx              — 卡片表头（可选统一）
src/styles/index.css                                 — CSS 入口
src/styles/tailwind.css                              — Tailwind 配置
src/styles/theme.css                                 — 主题 token
src/styles/fonts.css                                 — 字体占位
```

### 删除

```
src/app/components/CenterPanel.tsx                   — 老版左侧面板
src/app/components/RightPanel.tsx                    — 老版右侧面板
src/app/components/MarketChartPage.tsx               — 全屏图表页
```

### 新建

```
src/app/context/workstationReducer.ts                — 提取 Reducer
src/app/context/selectors.ts                         — Memoized 选择器
src/hooks/useFilteredQuotes.ts                       — 筛选逻辑 hook
src/hooks/useChartData.ts                            — 图表数据 hook
src/services/quoteService.ts                         — 报价 API 层
src/services/trendService.ts                         — 趋势 API 层
src/services/omoService.ts                           — OMO API 层
src/app/components/common/ErrorBoundary.tsx           — 错误边界
src/app/components/common/LoadingSkeleton.tsx         — 加载骨架
src/app/components/common/QuoteModal.tsx              — 报价弹窗
```

---

## 附录 B: 状态流转图

```
                    ┌──────────┐
                    │ 用户操作  │
                    └─────┬────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
     PeriodFilter     Area ②          Area ④
     ┌──┴──┐      ┌─────┴─────┐    ┌───┴───┐
     │期限   │      │ 点击行     │    │模式切换│
     │金额   │      │ 切换源     │    └───┬───┘
     │利率   │      └──┬──┬──┘        │
     └──┬──┘         │  │           │
        │            │  │           │
  ┌─────▼──────┐     │  │    ┌──────▼──────┐
  │ ① 重过滤    │     │  │    │ 图表重新渲染 │
  │ ② 重过滤    │     │  │    └─────────────┘
  └────────────┘     │  │
                     │  └────────────┐
                     │               │
          ┌──────────▼──────┐  ┌─────▼──────────┐
          │ selectedRow set │  │ selectedRow null│
          │ → ④ 标题更新    │  │ (取消/切源)     │
          │ → ④ 图表更新    │  │ → ④ 标题 "---" │
          │ → ③ period更新  │  │ → ③ 默认 7D   │
          │ → bigChartMode  │  └────────────────┘
          │   自动切换(可选) │
          └─────────────────┘
```
