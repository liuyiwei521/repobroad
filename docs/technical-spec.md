# 资金实时行情看板 — 技术实现规格

> 版本: v1.0 | 日期: 2026-05-04 | 角色: 技术负责人
>
> 本文档面向开发团队，描述状态管理、数据流、API 接口、组件实现细节和重构计划。不含业务交互说明——业务交互见 `business-prd.md`。

---

## 目录

1. [技术栈](#1-技术栈)
2. [组件树与状态读写](#2-组件树与状态读写)
3. [状态管理实现](#3-状态管理实现)
4. [组件实现细节](#4-组件实现细节)
5. [数据接口定义](#5-数据接口定义)
6. [过渡动画实现](#6-过渡动画实现)
7. [窗口自适应实现](#7-窗口自适应实现)
8. [多选行交互实现（规划）](#8-多选行交互实现规划)
9. [重构阶段与文件清单](#9-重构阶段与文件清单)
10. [技术债务清单](#10-技术债务清单)

---

## 1. 技术栈

| 层面 | 选择 | 版本 |
|------|------|------|
| 框架 | React | 18.3 |
| 语言 | TypeScript | 5.x |
| 构建 | Vite | 6.3 |
| 样式 | Tailwind CSS | v4 (CSS-first) |
| 图表 | Recharts | 2.15 |
| 状态 | Context + useReducer | — |
| 图标 | Lucide React | 0.487 |
| 类名工具 | clsx + tailwind-merge | — |

**不引入**：react-router、Redux/Zustand、MUI、shadcn/ui 高级组件、CSS Modules、CSS-in-JS。

---

## 2. 组件树与状态读写

### 2.1 组件清单

| 编号 | 组件 | 文件路径 | 状态来源 | 写入 Context |
|------|------|----------|----------|-------------|
| — | TopBar | `layout/TopBar.tsx` | 无（硬编码） | 无 |
| — | PeriodFilter | `layout/PeriodFilter.tsx` | Context (3 fields) | Context (3 actions) |
| ① | MainMarketTable | `area1-main/MainMarketTable.tsx` | Context (4 fields) | Context (1 action) |
| ② | InstitutionCompareTable | `area2-institutions/InstitutionCompareTable.tsx` | Context (5 fields) | Context (2 actions) |
| ③ | BottomDetailTabs | `area3-bottom/BottomDetailTabs.tsx` | Context (4 fields) | Context (2 actions) |
| ④ | BigChartArea | `area4-bigchart/BigChartArea.tsx` | Context (2 fields) | Context (1 action) |
| ⑤ | SentimentCard | `area5-sentiment/SentimentCard.tsx` | 本地 useState | 无 |

### 2.2 共享组件

| 组件 | 文件 | Props | 状态 |
|------|------|-------|------|
| DownloadBtn | `shared/DownloadBtn.tsx` | `title?: string` | 无（纯展示） |
| CardHeader | `shared/CardHeader.tsx` | `title`, `updateTime?`, `right?`, `icon?` | 无（纯展示，当前未使用） |
| RangeInput | `layout/PeriodFilter.tsx` (内部) | `label`, `unit`, `value`, `onChange`, `placeholder?`, `step?` | 无（受控组件） |

### 2.3 待删除组件

| 组件 | 文件 | 原因 |
|------|------|------|
| CenterPanel | `components/CenterPanel.tsx` | 老版左侧面板，App.tsx 未引用 |
| RightPanel | `components/RightPanel.tsx` | 老版右侧面板，App.tsx 未引用 |
| MarketChartPage | `components/MarketChartPage.tsx` | 全屏图表页，App.tsx 未引用 |

---

## 3. 状态管理实现

### 3.1 架构

```
WorkstationProvider (Context + useReducer)
    │
    ├── State: 9 fields (typed)
    ├── Dispatch: 9 action types
    ├── Reducer: pure function with 2 special side-effect cases
    └── useWorkstation() hook → typed context consumer
```

### 3.2 状态定义

```typescript
interface State {
  activeSource: PrimarySourceId;          // "xrepo" | "bankPrice"
  compareSource: CompareSourceId;         // "exchange" | "nonbankBest"
  selectedPeriod: string | "all";         // 全局期限筛选
  amountRange: { min: string; max: string };
  rateRange: { min: string; max: string };
  selectedRow: SelectedRow | null;        // ② 写入，驱动 ③ ④
  bigChartMode: BigChartMode;             // "intraday" | "history" | "comparison"
  bottomTab: BottomTab;                   // "omoDetail" | "omoSummary" | "nonbankDetail"
  institutionSearch: string;              // ③ 搜索文本
}
```

### 3.3 Action Types

```typescript
type Action =
  | { type: "SET_ACTIVE_SOURCE"; source: PrimarySourceId }
  | { type: "SET_COMPARE_SOURCE"; source: CompareSourceId }
  | { type: "SET_SELECTED_PERIOD"; period: string | "all" }
  | { type: "SET_AMOUNT_RANGE"; range: AmountRange }
  | { type: "SET_RATE_RANGE"; range: RateRange }
  | { type: "SET_SELECTED_ROW"; row: SelectedRow | null }
  | { type: "SET_BIG_CHART_MODE"; mode: BigChartMode }
  | { type: "SET_BOTTOM_TAB"; tab: BottomTab }
  | { type: "SET_INSTITUTION_SEARCH"; search: string };
```

### 3.4 Reducer 特殊逻辑

#### SET_COMPARE_SOURCE — 重置 selectedRow

```typescript
case "SET_COMPARE_SOURCE":
  return { ...state, compareSource: action.source, selectedRow: null };
```

**理由**：切换 Area ② 数据源后，之前选中的行（属于旧源）不再有效。Area ④ 图表标题和 Area ③ nonbank period 也随之清除。

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

**理由**：用户在「对比」模式下点击某行，意图是查看该品种的具体走势。自动从对比一览切换到分时图。注意：仅单向自动切换（comparison → intraday），取消选中不会切回 comparison。

### 3.5 数据流图

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

⑤ SentimentCard  ──local tab state──> Self             — 5 面板切换 (不参与 Context)
```

### 3.6 Context 接口

```typescript
interface ContextValue extends State {
  setActiveSource: (source: PrimarySourceId) => void;
  setCompareSource: (source: CompareSourceId) => void;
  setSelectedPeriod: (period: string | "all") => void;
  setAmountRange: (range: AmountRange) => void;
  setRateRange: (range: RateRange) => void;
  setSelectedRow: (row: SelectedRow | null) => void;
  setBigChartMode: (mode: BigChartMode) => void;
  setBottomTab: (tab: BottomTab) => void;
  setInstitutionSearch: (search: string) => void;
}
```

---

## 4. 组件实现细节

### 4.1 App.tsx 根布局

**文件**: `src/app/App.tsx`

```tsx
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

### 4.2 卡片容器规范

所有 5 个内容区共享同一容器模式：

```
外层: flex flex-col h-full bg-[#0a1628] border border-[#1e3352] rounded overflow-hidden
表头: flex items-center justify-between px-3 py-1.5 bg-[#132238] border-b border-[#1e3352] flex-shrink-0
内容: flex-1 min-h-0 overflow-hidden (内部表格则 overflow-auto)
```

### 4.3 PeriodFilter 实现

**文件**: `src/app/components/layout/PeriodFilter.tsx`

```tsx
// 期限按钮组 — 数组: ["all", "1", "7", "14", "21", "28+"]
PERIODS.map(p => (
  <button
    onClick={() => setSelectedPeriod(p)}
    className={`px-2 py-0.5 text-xs rounded transition-colors ${
      active ? "bg-blue-600 text-white" 
             : "bg-[#132238] text-[#b0c1d6] hover:bg-[#18293f] border border-[#2a4466]"
    }`}
  >{p === "all" ? "全部" : p}</button>
))

// 金额范围 — RangeInput 内部组件
// <input type="number" step="0.1" /> ~ <input type="number" step="0.1" /> 亿

// 利率范围 — RangeInput 内部组件
// <input type="number" step="0.01" /> ~ <input type="number" step="0.01" /> %
```

### 4.4 MainMarketTable 过滤逻辑

**文件**: `src/app/components/area1-main/MainMarketTable.tsx`

XRepo 模式过滤：

```typescript
filtered = xrepoQuotes.filter(row => {
  // 期限过滤
  if (selectedPeriod !== "all" && row.period !== selectedPeriod) return false;

  // 金额过滤: max(bidVolume, askVolume)
  if (amountRange.min && Math.max(row.bidVolume, row.askVolume) < parseFloat(amountRange.min)) return false;
  if (amountRange.max && Math.max(row.bidVolume, row.askVolume) > parseFloat(amountRange.max)) return false;

  // 利率过滤: bidRate 为下限，askRate 为上限
  if (rateRange.min && row.bidRate < parseFloat(rateRange.min)) return false;
  if (rateRange.max && row.askRate > parseFloat(rateRange.max)) return false;

  return true;
});
```

大行价格模式过滤：

```typescript
filtered = bankPriceRows.filter(row => {
  if (rateRange.min && row.bankRate < parseFloat(rateRange.min)) return false;
  if (rateRange.max && row.nonbankRate > parseFloat(rateRange.max)) return false;
  // 注意: 不使用 selectedPeriod 和 amountRange
  return true;
});
```

列定义 — XRepo 模式：

```
grid-cols-[3.5rem_1fr_1fr_1fr_1fr_3.5rem]
列: 期限 | 正回购金额(亿) | 正回购利率(%) | 逆回购利率(%) | 逆回购金额(亿) | 操作(报价按钮)
```

列定义 — 大行价格模式：

```
grid-cols-[1fr_1fr_1fr_1fr_2.5rem]
列: 机构 | 银行利率(%) | 非银利率(%) | 更新时间 | 操作(编辑图标)
```

### 4.5 InstitutionCompareTable 实现

**文件**: `src/app/components/area2-institutions/InstitutionCompareTable.tsx`

交易所回购模式过滤（与 XRepo 不同）：

```typescript
// 使用 weightedAvg 匹配 rateRange
// 使用 totalAmount 匹配 amountRange
// 不使用 selectedPeriod（交易所品种用自身代码 GC001 等）
```

列定义 — 交易所回购：

```
grid-cols-[3.5rem_3.5rem_3.5rem_3.5rem_3.5rem_3.5rem_3.5rem]
列: 品种 | 涨跌BP | 加权均价 | 成交(亿) | 最高 | 最低 | 操作
```

BP 着色逻辑：

```typescript
bp < 0 ? "text-emerald-600" : bp > 0 ? "text-red-500" : "text-[#6a7f98]"
```

列定义 — 非银最优：

```
grid-cols-[3.5rem_1fr_1fr_1fr_1fr_3.5rem]
列: 期限 | 正回购金额 | 正回购利率 | 逆回购利率 | 逆回购金额 | 操作
```

选中行视觉：

```typescript
// 选中: bg-blue-900/30 border-l-2 border-l-blue-400
// 表头文字: selectedRow ? `已选: ${period}` : "点击行 → 联动大图"
```

### 4.6 BottomDetailTabs 实现

**文件**: `src/app/components/area3-bottom/BottomDetailTabs.tsx`

非银明细 period 来源：

```typescript
const period = selectedRow?.period ?? "7";
const quotes = useMemo(() => getInstitutionQuotes(compareSource, period), [compareSource, period]);
```

搜索过滤：

```typescript
filtered = quotes.filter(q =>
  q.institutionName.includes(institutionSearch) || q.institutionType.includes(institutionSearch)
);
```

### 4.7 BigChartArea 实现

**文件**: `src/app/components/area4-bigchart/BigChartArea.tsx`

baseRate 计算：

```typescript
const baseRate = useMemo(
  () => (selectedRow?.source === "exchange" ? 1.4 : 1.95),
  [selectedRow]
);
```

图表标题：

```typescript
const title =
  bigChartMode === "comparison"
    ? "趋势一览"
    : selectedRow
      ? `${selectedRow.source} · ${selectedRow.period}`
      : "—";
```

三种图表模式：

| 模式 | 组件 | 数据源 |
|------|------|--------|
| comparison | `ComparisonChart` | `generateComparisonData()` — 5条线 × 20点 |
| intraday | `PriceVolumeChart` | `generateIntraday(baseRate, 60)` — 上面积图 68% + 下柱图 32% |
| history | `PriceVolumeChart` | `generateHistory(baseRate, 60)` — 同上布局 |

Recharts 公共配置：

```typescript
// 网格线
<CartesianGrid strokeDasharray="3 3" stroke="#1e3352" vertical={false} />

// 坐标轴
axisLine: { stroke: "#2a4466" }
tick: { fontSize: 10, fill: "#8aa0b8" }
tickLine: false

// Tooltip
contentStyle: { backgroundColor: "#132238", border: "1px solid #2a4466", borderRadius: 4, fontSize: 11, color: "#e4ecf5" }

// 折线
type="monotone" strokeWidth={1.5} dot={false} activeDot={{ r: 3, strokeWidth: 0 }}
```

### 4.8 SentimentCard 实现

**文件**: `src/app/components/area5-sentiment/SentimentCard.tsx`

本地状态（不参与 Context）：

```typescript
const [tab, setTab] = useState<SentimentTab>("sentiment");
```

5 个子面板：

| tab | 组件 | 数据源 | 渲染方式 |
|-----|------|--------|----------|
| sentiment | `SentimentPanel` | 硬编码常量 | inline div |
| instRepo | `InstRepoChart` | `institutionRepoSeries` | Recharts BarChart |
| ncd | `NcdPanel` | `ncdQuotes` | CSS Grid table |
| structure | `StructurePanel` | `capitalStructureSeries` | CSS Grid table |
| interbank | `InterbankPanel` | `interbankQuotes` | CSS Grid table |

---

## 5. 数据接口定义

以下为重构后预期的 API 接口契约。

### 5.1 报价数据接口

#### GET /api/quotes/xrepo

**返回**: `Quote[]`（5-20 rows）

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

#### GET /api/quotes/exchange

**返回**: `Quote[]`（含 weightedAvg, totalAmount, changeBp, high, low, openRate）

#### GET /api/quotes/nonbankBest

**返回**: `Quote[]`

#### GET /api/quotes/ncd

**返回**: `Quote[]`

#### GET /api/quotes/interbank

**返回**: `Quote[]`

### 5.2 OMO 接口

#### GET /api/omo/records?days=30

**返回**: `OmoRecord[]`

```typescript
interface OmoRecord {
  date: string;          // YYYY-MM-DD
  type: "逆回购" | "逆回购到期" | "MLF" | "MLF到期" | "国库定存" | "TMLF";
  period: string;
  rate: number;
  amount: number;        // 亿，到期为负
}
```

#### GET /api/omo/summary?days=30

**返回**: `OmoSummary[]`

```typescript
interface OmoSummary {
  date: string;
  netInject: number;     // 净投放（亿）
  repo: number;
  repoMaturity: number;
  mlf: number | null;
  mlfMaturity: number | null;
}
```

### 5.3 趋势接口

#### GET /api/trends/intraday?source={source}&period={period}

**返回**: `PriceVolumePoint[]`

```typescript
interface PriceVolumePoint {
  time: string;          // HH:mm
  price: number;
  weightedAvg?: number;
  volume: number;
}
```

#### GET /api/trends/history?source={source}&period={period}&days={days}

**返回**: `PriceVolumePoint[]`（time 格式 YYYY-MM-DD）

#### GET /api/trends/comparison

**返回**: `TimePoint[]`

```typescript
interface TimePoint {
  time: string;
  [seriesKey: string]: number | string;  // 动态键
}
```

### 5.4 参考数据接口

#### GET /api/reference/sentiment

**返回**:
```typescript
{
  currentIndex: number;       // 0-100
  label: "宽松" | "平衡" | "偏紧";
  details: { fullMarket: number; bigBank: number; smallBank: number; nonBank: number; };
}
```

#### GET /api/reference/institutionRepo?days=30

**返回**: `StructurePoint[]`

#### GET /api/reference/capitalStructure?days=30

**返回**: `StructurePoint[]`

#### GET /api/reference/institutions

**返回**: `Institution[]`

### 5.5 机构报价接口

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

### 5.6 错误响应格式

所有 API 在错误时返回统一结构：

```json
{
  "error": {
    "code": "RATE_LIMIT" | "UNAUTHORIZED" | "NOT_FOUND" | "SERVER_ERROR" | "VALIDATION_ERROR",
    "message": "Human-readable error description",
    "details": {}
  }
}
```

HTTP 状态码：

| 状态码 | 含义 | 前端处理 |
|--------|------|----------|
| 200 | 成功 | 渲染数据 |
| 400 | 参数错误 | 静默忽略，使用默认参数 |
| 401 | 未认证 | 跳转登录页 |
| 403 | 无权限 | 显示「无权限访问」 |
| 404 | 数据不存在 | 显示空状态 |
| 429 | 频率限制 | 延长轮询间隔为当前 2 倍 |
| 500 | 服务端错误 | 显示「服务异常，稍后重试」+ 重试按钮 |

### 5.7 数据刷新策略

| 数据 | 方式 | 间隔 | 降级策略 |
|------|------|------|----------|
| ① 报价表 | Polling | 3-5s | 超过 30s 未更新显示「数据过期」 |
| ② 对比表 | Polling | 3-5s | 同上 |
| ④ 分时图 | Polling | 3-5s | 增量更新最后一个点 |
| ③ OMO 数据 | Polling | 60s | 手动刷新 |
| ⑤ 参考数据 | Polling | 30s | 手动刷新 |
| 机构列表 | 静态 | 构建时 | localStorage 缓存 |

---

## 6. 过渡动画实现

### 6.1 Tab 切换

- **实现方式**: CSS `transition: opacity 150ms ease-in-out` + React key 变化触发重新挂载
- **备选方案**: `motion` 库（已安装 `motion` 12.23.24）的 `AnimatePresence` + `fade`

### 6.2 图表数据切换

- **实现方式**: Recharts 内置 `animationDuration={300}` 平滑过渡

### 6.3 选中行高亮

- **实现方式**: CSS `transition: background-color 150ms, border-left-color 150ms`

### 6.4 实时更新闪烁

```css
@keyframes flash-update {
  0%   { background-color: rgba(59, 130, 246, 0.25); }
  100% { background-color: transparent; }
}
animation: flash-update 1.5s ease-out;
```

### 6.5 筛选更新

- 即时更新，无动画。直接修改 filtered 数组。

---

## 7. 窗口自适应实现

### 7.1 布局方案

- **整体**: `h-screen w-screen overflow-hidden` 确保填满视口，无页面级滚动。
- **分栏**: `w-3/5` / `w-2/5` 百分比宽度，自动响应窗口宽度变化。
- **区域高度**: `flex-[30]` / `flex-[28]` / `flex-[42]` / `flex-[65]` / `flex-[35]` flex 比例，自动响应窗口高度变化。
- **内部滚动**: 每个区域的内容区使用 `overflow-auto`，内容超出区域高度时出现独立滚动条。

### 7.2 边界处理

| 条件 | CSS 实现 |
|------|----------|
| 最小宽度限制 | `min-w-[1280px]` on root container（可选） |
| 最小高度限制 | `min-h-[720px]` on root container（可选） |
| 表格列过窄 | `overflow-x-auto` on table container |
| 图表最小尺寸 | `min-w-[300px]` on chart ResponsiveContainer |
| 顶部栏固定 | `h-10 flex-shrink-0` |
| 筛选栏固定 | `flex-shrink-0` |

### 7.3 性能注意

- flex 比例驱动的 resize 在 main thread 同步执行，无需 JS 计算。
- 避免在 resize 事件中进行 setState。所有尺寸计算由 CSS flex 处理。
- Recharts `ResponsiveContainer` 内部使用 `ResizeObserver`，图表自动响应容器尺寸变化。

---

## 8. 多选行交互实现（规划）

### 8.1 状态扩展

```typescript
// 在 State 中新增：
selectedRows: SelectedRow[];  // 替代 selectedRow: SelectedRow | null
```

### 8.2 Reducer 修改

```typescript
case "SET_SELECTED_ROWS":
  // 最多 5 个
  return { ...state, selectedRows: action.rows.slice(0, 5) };

case "TOGGLE_SELECTED_ROW":
  // Ctrl+Click: 切换单行
  const exists = state.selectedRows.find(r => r.period === action.row.period 
    && r.source === action.row.source);
  if (exists) {
    return { ...state, selectedRows: state.selectedRows.filter(r => r !== exists) };
  }
  if (state.selectedRows.length >= 5) return state;
  return { ...state, selectedRows: [...state.selectedRows, action.row] };
```

### 8.3 图表响应

```typescript
// ④ 对比图中：仅渲染 selectedRows 对应的系列
// 如果 selectedRows 为空 → 渲染所有 5 条默认线
// 如果 selectedRows 有值 → 仅渲染选中品种对应的线
```

### 8.4 非银明细响应

```typescript
// 使用第一个选中品种的 period
const period = selectedRows[0]?.period ?? "7";
```

---

## 9. 重构阶段与文件清单

### 9.1 阶段 0: 清理（1-2h）

- [ ] 删除 `CenterPanel.tsx`, `RightPanel.tsx`, `MarketChartPage.tsx`
- [ ] 移除未使用 npm 依赖（MUI, react-dnd, embla-carousel, react-slick, etc.）
- [ ] 确认 `CardHeader` 是否接入所有卡片或删除

### 9.2 阶段 1: 类型与状态（3-4h）

- [ ] 拆分 `Quote` 为 `XrepoQuote`, `ExchangeQuote`, `NcdQuote`, `InterbankQuote`
- [ ] 提取 reducer 到 `context/workstationReducer.ts`
- [ ] 创建 `context/selectors.ts` — memoized 选择器
- [ ] 创建 `hooks/useFilteredQuotes.ts` — 复用筛选逻辑
- [ ] 添加 reducer 单元测试
- [ ] 决定 SentimentCard 本地状态是否提升

### 9.3 阶段 2: 数据层抽象（4-6h）

- [ ] 创建 `services/quoteService.ts`, `trendService.ts`, `omoService.ts`
- [ ] 为每个数据源创建 `useXxxData()` hook（先返回 mock，接口不变）
- [ ] 趋势生成器改为 seeded random 或静态快照
- [ ] 实现 `DownloadBtn` CSV 导出逻辑

### 9.4 阶段 3: UX 完善（4-6h）

- [ ] 每个内容区包裹 `ErrorBoundary`
- [ ] 添加 `LoadingSkeleton` 组件
- [ ] 补全所有空状态（大行价格、交易所回购、非银搜索）
- [ ] 添加错误态 + 重试按钮
- [ ] TopBar 接入实时 DR007 和情绪数据
- [ ] 实现报价/编辑 Modal（替换视觉占位）

### 9.5 阶段 4: 性能与体验（2-3h）

- [ ] 表格行 `React.memo` 优化
- [ ] `useMemo` 审计图表数据
- [ ] 筛选 debounce（行数 > 100 时加 150ms）
- [ ] Tab 切换过渡动画
- [ ] 实时更新行闪烁效果
- [ ] 键盘导航（↑↓ Enter Esc）

### 9.6 文件变更清单

#### 新建

```
src/app/context/workstationReducer.ts       — 提取 Reducer
src/app/context/selectors.ts                — Memoized 选择器
src/hooks/useFilteredQuotes.ts              — 筛选逻辑 hook
src/hooks/useChartData.ts                   — 图表数据 hook
src/services/quoteService.ts                — 报价 API 层
src/services/trendService.ts                — 趋势 API 层
src/services/omoService.ts                  — OMO API 层
src/app/components/common/ErrorBoundary.tsx  — 错误边界
src/app/components/common/LoadingSkeleton.tsx — 加载骨架
src/app/components/common/QuoteModal.tsx     — 报价弹窗
```

#### 删除

```
src/app/components/CenterPanel.tsx
src/app/components/RightPanel.tsx
src/app/components/MarketChartPage.tsx
```

---

## 10. 技术债务清单

| 债务 | 严重度 | 说明 | 影响 |
|------|--------|------|------|
| Quote 类型过载 | **高** | 同一接口承载 XRepo + 交易所 + NCD + 同业存款，可选字段 7 个 | 类型安全缺失、数据校验困难 |
| 趋势数据随机化 | **高** | 5 个生成器每次产生不同结果 | 不可复现、不可测试、视觉回归不可行 |
| 无错误/加载态 | **高** | 所有数据同步获取，无异步处理 | API 化后必须重构所有组件 |
| Direct import 数据 | 中 | 跨层直接引用数据文件 | 无法中间件拦截/缓存/日志 |
| 未使用依赖 ~15 个 | 中 | MUI, react-dnd, embla 等 | 增加 install 时间、安全面 |
| 筛选逻辑重复 | 中 | MainMarketTable 和 InstitutionCompareTable 各自实现 | 维护两处、规则不一致风险 |
| DownloadBtn 无逻辑 | 低 | 视觉占位 | 无实际功能 |
| 报价/编辑按钮无逻辑 | 低 | 视觉占位 | 同上 |
| CardHeader 未统一使用 | 低 | 每个组件自建 header | 样式不一致风险 |
| TopBar 硬编码 | 低 | DR007、情绪值未从数据层获取 | 数据源切换时遗漏 |
| 无测试 | 低 | 0 个测试文件 | 重构缺少安全网 |
| SentimentCard 本地状态 | 低 | 唯一不用 Context 的组件 | 未来如需要外部控制需重构 |

---

> **相关文档**：
> - `business-prd.md` — 业务需求与交互规范
> - `data-inventory.md` — Mock 数据全量普查
> - `user-guide.md` — 用户使用说明
