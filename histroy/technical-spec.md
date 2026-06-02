# 资金实时行情看板 — 技术实现规格 (codex 分支)

> 版本: v2.1 (codex) | 日期: 2026-05-14 | 受众: 开发团队
>
> 本文档描述 codex 分支的三栏布局版本的技术实现细节。业务交互见 `business-prd.md`。

---

## 0. 2026-05-14 修订摘要（实现侧）

| 模块 | 变更 | 关键代码位置（`src/app/App.tsx`） |
| --- | --- | --- |
| 顶部 TopBar | 删除「期限」筛选 chip 组；三栏 grid 由 `30fr_35fr_35fr` 调整为 `28fr_42fr_30fr` | `TopBar` / `App` 根 grid |
| 左栏大行价格 | 新增 `BankTenor = "ON" \| "7D"`、`BankRateRow.tenor` / `hasQuote`；`initialBankRateRows` 拆分为机构 × 期限两条；按 `bigBankWhitelist` + `hasQuote` 双重过滤；编辑弹窗新增「期限 / 有报价」字段 | `BankRateRow` / `initialBankRateRows` / `LeftSummaryPanel` / `BankRateEditorModal` |
| 中部报价明细 | 模块头部新增 `tenorFilter` 状态与 chip 组（`QUOTE_TENOR_OPTIONS`）；行 grid 由 7 列扩展为 8 列，加入 `获取时间`（`row.updatedAt`）；`selectLevel1Rows`、`sortRowsByRank` 后接 `.filter(matchTenor)` | `MainQuoteBoard` / `RepoQuoteSectionBoard` |
| 右栏图表 | 重排 `RightSidebar` 子组件顺序：`HistoryClosePanel` 移到第一行、`IntradayPanel` 第二行；标题、副标题、Legend 文案改为「加权价格走势」/「匿名成交走势图」/「加权价格」/「匿名成交利率…」 | `RightSidebar` / `IntradayPanel` / `HistoryClosePanel` |
| 底部统计 | `rightLowerTabs` 仅保留 `inst`；默认 `rightLowerTab="inst"`；`CfetsInstPeriod` 扩展到 11 档，补 `cfetsInstAnchorsBase` 中 R2M~R1Y 的 mock 数据；新增 `cfetsInstInstitutionTypes` 与 `CfetsInstPanel` 中「机构类型」多选 chip（state: `instTypes`）；新增「期限」chip 行 label，原图例移到独立行 | `rightLowerTabs` / `RightSidebar` / `CfetsInstPeriod` / `cfetsInstAnchorsBase` / `CfetsInstPanel` |

未实现 / 占位项：报价下载、「已出完」识别、报价失效时间规则、报价状态字段（`active`/`filled`/`expired`/`replaced` 仅在文档层面预留）。

---

## 目录

1. [技术架构概览](#1-技术架构概览)
2. [布局实现](#2-布局实现)
3. [组件状态管理](#3-组件状态管理)
4. [品种联动实现](#4-品种联动实现)
5. [中栏实现细节](#5-中栏实现细节)
6. [右栏图表实现](#6-右栏图表实现)
7. [多选品种对比实现](#7-多选品种对比实现)
8. [窗口自适应实现](#8-窗口自适应实现)
9. [左栏编辑弹窗](#9-左栏编辑弹窗)
10. [废弃组件清单](#10-废弃组件清单)
11. [技术债务](#11-技术债务)

---

## 1. 技术架构概览

### 1.1 文件结构

```
src/
├── main.tsx                      — 入口，渲染 <App />
├── app/
│   ├── App.tsx                   — 单体应用 (7388 行)，全部逻辑在此
│   └── components/               — 废弃组件目录 (App.tsx 未引用)
│       ├── LeftPanel.tsx         — 死代码
│       ├── CenterPanel.tsx       — 死代码
│       ├── RightPanel.tsx        — 死代码
│       ├── MarketChartPage.tsx   — 死代码
│       ├── figma/ImageWithFallback.tsx — 死代码
│       └── ui/                   — 45 个 shadcn/ui 组件 (未被 App.tsx 引用)
└── styles/
    ├── index.css                 — CSS 入口
    ├── tailwind.css              — Tailwind v4 + 自定义滚动条
    ├── theme.css                 — CSS 变量 + .dark 主题
    └── fonts.css                 — 空文件
```

### 1.2 技术栈

| 层面 | 选择 | 说明 |
|------|------|------|
| 框架 | React 18.3 | createRoot |
| 状态 | useState + useEffect | 无 Context / Redux / Zustand |
| 样式 | Tailwind CSS v4 | inline className |
| 图表 | 自定义 SVG | 无 Recharts 依赖 |
| 数据 | 内联 const 数组 | 无 API / 无数据文件 / 无异步 |
| 图标 | Lucide React | ChevronUp/Down 等 |

### 1.3 架构特点

- **单体 App.tsx**：7388 行，所有逻辑、数据、UI 全部内联。
- **内联子组件**：LeftSummaryPanel / MainQuoteBoard / RightSidebar 均在 App.tsx 内定义为 function，而非独立文件。
- **零 Context**：所有状态为本地 useState，无跨组件状态共享。
- **零异步**：所有数据为 const 数组，无 fetch/axios/SWR。

---

## 2. 布局实现

### 2.1 根布局

```tsx
<div className="h-screen w-screen overflow-hidden bg-[#09111d] text-slate-100">
  <TopBar />
  <main className="grid min-h-0 flex-1 grid-cols-[30fr_35fr_35fr] grid-rows-[minmax(0,1fr)] gap-3 ...">
    <LeftSummaryPanel />
    <MainQuoteBoard />
    <RightSidebar />
  </main>
</div>
```

- 使用 CSS Grid 实现三栏固定比例 30:35:35。
- 栏间无拖拽调整——grid-template-columns 为固定值。
- 每栏 `overflow-hidden`，内部面板独立滚动。

### 2.2 右栏内部分区

```tsx
<div className="grid min-h-0 min-w-0 gap-3 overflow-hidden"
     style={{ gridTemplateRows: "minmax(0, 10fr) minmax(0, 9fr) minmax(0, 11fr)" }}>
  <IntradayPanel />
  <HistoryClosePanel />
  <RightLowerPanel />
</div>
```

固定 10:9:11 比例，不可拖拽。

### 2.3 自定义滚动条

```css
/* tailwind.css */
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: #0c1524; }
::-webkit-scrollbar-thumb { background: #34527a; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #4a6fa5; }
```

---

## 3. 组件状态管理

### 3.1 状态分布（全部为本地 useState）

| 组件 | 状态 | 类型 | 用途 |
|------|------|------|------|
| App | currentTime | Date | 顶部栏时钟 |
| App | selectedProduct | string | **全局选中品种**，默认 "R001" |
| LeftSummaryPanel | bankRateRows | BankRateRow[] | 可编辑的银行报价 |
| | draftBankRateRows | BankRateRow[] | 编辑弹窗缓冲区 |
| | isBankEditorOpen | boolean | 弹窗开关 |
| MainQuoteBoard | displayLevel | 1 \| 2 | 1级摘要 / 2级全量 |
| | activeSectionId | string \| null | 激活的报价区 |
| | topRatio | number | 上下区垂直比例 |
| RightSidebar | overlayProduct | OverlayProduct | 叠加品种（DR007/GC007/R007） |
| | historyRange | HistoryRange | 历史时间范围（5d/1m/6m） |
| | compareProduct | CompareProduct | 对比品种（DR001~R007） |
| | rightLowerTab | RightLowerTab | 底部 Tab |
| | spreadLeft, spreadRight | SpreadProduct | 利差产品选择 |
| NCD Card | tab | "trend" \| "table" | NCD 趋势图/表格 |
| ExchangeRepoCard | tab | "core" \| "sse" \| "szse" | 交易所 Tab |
| FundStructurePanel | days | 14 \| 30 \| 180 | 资金结构时间范围 |

### 3.2 跨组件通信

**selectedProduct 是唯一跨组件状态**。在 App 组件中作为 useState 管理，通过 props 向下传递：

```
App (selectedProduct, setSelectedProduct)
 ├─ LeftSummaryPanel (selectedProduct, onSelectProduct)
 │    ├─ 点击 XREPO 行 → onSelectProduct("R007")
 │    └─ 点击交易所行 → onSelectProduct("GC007")
 ├─ MainQuoteBoard (onSelectProduct)
 │    └─ 点击报价行 → onSelectProduct(tenor)
 └─ RightSidebar (selectedProduct)
      ├─ IntradayPanel (selectedProduct, ...)
      └─ HistoryClosePanel (selectedProduct, ...)
```

其余状态（overlayProduct、compareProduct、historyRange 等）仍为本地状态，通过 props 在 RightSidebar 内部传递。

### 3.3 持久化

仅中栏的 `topRatio`（上下区比例）通过 localStorage 持久化。其余所有状态在刷新后丢失。

---

## 4. 品种联动实现

### 4.1 全局选中状态

```typescript
// App 组件顶层
type SelectedProduct = string; // e.g. "R001" | "R007" | "GC007" | ...
const [selectedProduct, setSelectedProduct] = useState<SelectedProduct>("R001");
```

`selectedProduct` 是唯一需要跨组件传递的状态——从 App 顶层向下经过 LeftSummaryPanel、MainQuoteBoard、RightSidebar。

### 4.2 左栏入口

```typescript
// XREPO 表行点击
<tr onClick={() => onSelectProduct("R007")} className={selectedProduct === "R007" ? "highlight" : ""}>
  <td>R007</td> ...
</tr>

// 交易所回购行点击
<tr onClick={() => onSelectProduct("GC007")} className={selectedProduct === "GC007" ? "highlight" : ""}>
  <td>GC007</td> ...
</tr>
```

选中行视觉：左侧蓝色竖线 + 背景 `bg-sky-500/10`。其他入口的选中状态互斥（同一个 `selectedProduct` 只会匹配一个入口的行）。

### 4.3 中栏入口

```typescript
// 报价行点击
<tr onClick={() => onSelectProduct(row.tenor)} className="cursor-pointer">
  <td>{row.tenor}</td> ...
</tr>
```

中栏点击不持久高亮——通过短暂的 CSS transition（~300ms `bg-sky-500/20`）反馈点击。因为中栏的核心交互是看报价等级，品种切换是附带操作。

### 4.4 右栏响应

```typescript
// IntradayPanel 和 HistoryClosePanel 接收 selectedProduct 作为 prop
// 主品种数据根据 selectedProduct 从数据集中获取
const mainSeries = getIntradaySeries(selectedProduct);  // 替换硬编码的 intradaySeries
const historyData = getHistoricalData(selectedProduct, activeRange);  // 替换 hardcoded R001
```

- 分时图面积填充、折线、成交量柱状图全部跟随 selectedProduct。
- 收盘价走势主品种同步切换，标题栏显示 selectedProduct 名称。
- 叠加和对比下拉独立，利差 = selectedProduct - compareProduct。

### 4.5 数据扩展

需要将当前单品种数据结构扩展为多品种映射：

```typescript
// 当前：单品种数据
const intradaySeries = [1.32, 1.34, ...];  // 仅 DR001

// 目标：多品种数据映射
const intradayDatasets: Record<string, number[]> = {
  "R001": [1.32, 1.34, ...],
  "R007": [1.45, 1.47, ...],
  "DR007": [1.52, 1.53, ...],
  "GC007": [1.48, 1.50, ...],
  // ...
};

const historicalDatasets: Record<string, Record<HistoryRange, Dataset>> = { ... };
```

---

## 5. 中栏实现细节

### 5.1 1级/2级切换

```typescript
// displayLevel: 1 | 2
// 1 级：每组的 rows 只取 quoteRank === "最优" || "次优"
// 2 级：每组的全部 rows
const filteredRows = displayLevel === 1
  ? group.rows.filter(r => r.quoteRank === "最优" || r.quoteRank === "次优")
  : group.rows;
```

### 5.2 报价分组数据结构

```typescript
interface RepoQuoteGroup {
  id: string;
  label: string;          // "利率地方" | "存单商金" | "信用"
  rows: QuoteDetailRow[];
}

interface QuoteDetailRow {
  id: string;
  institution: string;
  tenor: string;
  amount: number;
  rate: number;
  collateral: string;
  accountType: string;
  quoteRank: "最优" | "次优" | "报价";
}
```

### 5.3 拖拽分隔条实现

```typescript
// 使用 onMouseDown / onMouseMove / onMouseUp
const handleMouseDown = (e: React.MouseEvent) => {
  e.preventDefault();
  const startY = e.clientY;
  const containerHeight = containerRef.current.offsetHeight;
  
  const onMove = (e: MouseEvent) => {
    const delta = e.clientY - startY;
    const newRatio = (startRatio * containerHeight + delta) / containerHeight;
    setTopRatio(newRatio);
  };
  
  const onUp = () => {
    localStorage.setItem('repo-split-ratio', String(topRatio));
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  };
  
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
};
```

### 5.4 区头聚焦

```typescript
// 点击报价区区头 → setActiveSectionId(sectionId)
// activeSectionId === sectionId → 再次点击取消激活
// 激活区 flex-[3]，非激活区 flex-[1]
```

---

## 6. 右栏图表实现

### 6.1 图表库选择

右栏所有图表使用**自定义 SVG**，不使用 Recharts。原因是减少依赖体积。

### 6.2 分时图 SVG 结构

```
<svg viewBox="0 0 {w} {h}">
  <defs>
    <linearGradient> — 面积图渐变填充
  </defs>
  <!-- 网格线 -->
  <!-- 面积图 path -->
  <!-- 叠加线 path (可选，虚线) -->
  <!-- 成交量柱状图 -->
  <!-- X 轴标签 -->
</svg>
```

### 6.3 数据点映射

```typescript
// 40 个数据点 → 映射到 SVG 坐标
const xScale = (i: number) => (i / (dataPoints.length - 1)) * chartWidth;
const yScale = (v: number) => chartHeight - ((v - minPrice) / (maxPrice - minPrice)) * chartHeight;
```

### 6.4 历史数据集

```typescript
const historicalCloseDatasets = {
  "5d": { closes: [1.32, 1.35, 1.28, 1.40, 1.37], volumes: [...] },
  "1m": { closes: [/* 28 points */], volumes: [...] },
  "6m": buildSixMonthDailyDataset(), // 126 个点，正弦波合成
};
```

---

## 7. 多选品种对比实现

### 7.1 类型定义

```typescript
type OverlayProduct = "none" | "dr007" | "gc007" | "r007";
type SpreadProduct = "dr001" | "dr007" | "gc007" | "r007";
type CompareProduct = "none" | SpreadProduct;
```

- `OverlayProduct`：叠加品种，在分时图和收盘价走势图中以虚线叠加。
- `CompareProduct`：对比品种，仅在收盘价走势图中使用，额外展示利差柱状图。

### 7.2 状态管理

```typescript
function RightSidebar() {
  const [overlayProduct, setOverlayProduct] = useState<OverlayProduct>("none");
  const [compareProduct, setCompareProduct] = useState<CompareProduct>("none");
  // overlayProduct 同时传给 IntradayPanel 和 HistoryClosePanel
  // compareProduct 仅传给 HistoryClosePanel
}
```

### 7.3 收盘价走势图的数据计算

```typescript
// 叠加品种数据
const overlaySeries = overlayProduct === "none"
  ? null
  : buildHistoricalSeries(activeRange, overlayProduct);

// 对比品种数据
const compareSeries = compareProduct === "none"
  ? null
  : buildHistoricalSeries(activeRange, compareProduct);

// 利差计算 (bp)
const spreadValues = compareSeries
  ? dataset.close.map((value, index) =>
      Number(((value - compareSeries[index]) * 100).toFixed(1))
    )
  : null;

// min/max 同时考虑三条线
const min = Math.min(...dataset.close, ...(overlaySeries ?? []), ...(compareSeries ?? [])) - 0.015;
const max = Math.max(...dataset.close, ...(overlaySeries ?? []), ...(compareSeries ?? [])) + 0.015;
```

### 7.4 SVG 渲染层级

```
<svg viewBox="0 0 720 186">
  <!-- 1. 面积渐变填充 (主品种) -->
  <!-- 2. 蓝色实线 (主品种 R001) -->
  <!-- 3. 琥珀色虚线 (叠加品种，如有) -->
  <!-- 4. 紫色虚线 (对比品种，如有) -->
  <!-- 5. 十字准星竖线 (tooltip) -->
</svg>
<!-- 6. 利差柱状图面板 (如有对比品种) -->
```

### 7.5 利差柱状图

- 仅在 `compareProduct !== "none"` 时渲染。
- 独立 SVG，grid row 比例 `68fr 24fr auto` 中的 `auto` 部分。
- Y 轴自动适配范围（min/max + 15% padding）。
- 正值红色柱 `#ef4444`，负值青色柱 `#34d399`。

### 7.6 Tooltip 多品种展示

```typescript
// tooltip 中按顺序展示：
// 1. 日期
// 2. R001 价格 (蓝色 dot)
// 3. 叠加品种价格 (琥珀色 dot，如有)
// 4. 对比品种价格 (紫色 dot，如有)
// 5. 利差 (如有对比)
// 6. 成交量
```

---

## 8. 窗口自适应实现

### 8.1 CSS Grid 弹性布局

```css
/* 三栏 30:35:35 — fr 单位随视口自动缩放 */
grid-template-columns: 30fr 35fr 35fr;

/* 右栏三面板 10:9:11 */
grid-template-rows: minmax(0, 10fr) minmax(0, 9fr) minmax(0, 11fr);
```

`minmax(0, Xfr)` 确保面板在内容溢出时可缩小至 0，而非被内容撑大。

### 8.2 Overflow 链

```
h-screen w-screen overflow-hidden          ← 根：无外层滚动
  └─ main overflow-hidden                   ← 主区域
       ├─ 左栏 overflow-hidden               ← 栏级
       │    └─ 面板 overflow-y-auto           ← 面板级独立滚动
       ├─ 中栏 overflow-hidden
       │    └─ 面板 overflow-y-auto
       └─ 右栏 overflow-hidden
            └─ 面板 overflow-y-auto
```

### 8.3 SVG viewBox 自适应

```typescript
// 分时图
<svg viewBox="0 0 680 178" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">

// 收盘价走势图
<svg viewBox="0 0 720 186" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
```

`preserveAspectRatio="none"` 使 SVG 完全填充容器，配合 `absolute inset-0` 实现响应式。

### 8.4 Tooltip 坐标计算

```typescript
function useChartTooltip(dataLength: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  // 通过 containerRef.current.getBoundingClientRect() 获取实时容器尺寸
  // 将鼠标 clientX/clientY 映射到数据点索引
}
```

容器尺寸随窗口 resize 实时变化，tooltip 映射始终准确。

### 8.5 localStorage 持久化

```typescript
// 中栏分隔条比例 — 唯一持久化的状态
localStorage.setItem('repo-split-ratio', String(topRatio));

// 读取
const saved = localStorage.getItem('repo-split-ratio');
if (saved) setTopRatio(Number(saved));
```

窗口 resize 不触发保存，分隔条位置保持不变。

---

## 9. 左栏编辑弹窗

### 9.1 弹窗状态

```typescript
const [isBankEditorOpen, setIsBankEditorOpen] = useState(false);
const [draftBankRateRows, setDraftBankRateRows] = useState([...bankRateRows]);
```

### 9.2 操作逻辑

- **打开**：复制当前数据到 draft，打开弹窗。
- **保存**：draft → bankRateRows，关闭弹窗。
- **重置**：重新从 bankRateRows 复制到 draft。
- **取消**：关闭弹窗，丢弃 draft。

### 9.3 不持久化

修改仅在内存中，刷新页面后恢复为硬编码默认值。

---

## 10. 废弃组件清单

以下文件在 src/app/components/ 中但 App.tsx 未引用：

| 文件 | 行数估算 | 内容 |
|------|----------|------|
| LeftPanel.tsx | ~400 | 旧左栏：情绪指数、利率走势、NCD 图表（使用 Recharts） |
| CenterPanel.tsx | ~550 | 旧中栏：实时更新报价（3s 定时器）、交易员悬浮 tooltip、非银明细展开表、CSV 导出 |
| RightPanel.tsx | ~350 | 旧右栏：4 个 TrendChart 组件（使用 Recharts）、5s 定时器实时更新 |
| MarketChartPage.tsx | ~400 | 全屏图表页：ComposedChart、MA20、时间范围选择、机构/期限筛选 |
| figma/ImageWithFallback.tsx | ~20 | 图片加载失败回退组件 |
| ui/*.tsx (45 files) | ~2000 | shadcn/ui 组件库 |

**建议**：删除所有废弃组件，或移至 `_archive/` 目录保留参考。

---

## 11. 技术债务

| 债务 | 严重度 | 说明 |
|------|--------|------|
| 单体 App.tsx 7388 行 | **高** | 不可维护。需要拆分组件到独立文件。 |
| 无状态管理 | **高** | 所有状态分散在本地 useState。无跨组件通信机制。 |
| 内联数据 | **高** | 数据混在 UI 代码中。无法独立测试数据层。 |
| 自定义 SVG 图表 | 中 | 无动画、无 tooltip、无缩放。与 Recharts 功能差距大。 |
| 静态筛选 | 中 | TopBar 的期限/金额/利率筛选为纯展示，不可交互。 |
| 无错误/加载态 | 中 | 添加异步数据层后需要重构。 |
| 大量死代码 | 中 | ~3500 行废弃组件 + 45 个 ui 文件。 |
| 无 localStorage 清理 | 低 | repo-split-ratio 永远不清理。 |
| 无测试 | 低 | 0 个测试文件。 |

---

> **相关文档**：
> - `business-prd.md` — 业务需求与交互规范
> - `data-inventory.md` — 数据清单与校验规则
> - `user-guide.md` — 用户使用说明
> - `frontend-spec.md` — 原始综合文档（参考）
