# 资金实时行情看板 — 技术实现规格 (codex 分支)

> 版本: v2.0 (codex) | 日期: 2026-05-04 | 受众: 开发团队
>
> 本文档描述 codex 分支的三栏布局版本的技术实现细节。业务交互见 `business-prd.md`。

---

## 目录

1. [技术架构概览](#1-技术架构概览)
2. [布局实现](#2-布局实现)
3. [组件状态管理](#3-组件状态管理)
4. [中栏实现细节](#4-中栏实现细节)
5. [右栏图表实现](#5-右栏图表实现)
6. [左栏编辑弹窗](#6-左栏编辑弹窗)
7. [废弃组件清单](#7-废弃组件清单)
8. [技术债务](#8-技术债务)

---

## 1. 技术架构概览

### 1.1 文件结构

```
src/
├── main.tsx                      — 入口，渲染 <App />
├── app/
│   ├── App.tsx                   — 单体应用 (3727 行)，全部逻辑在此
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

- **单体 App.tsx**：3727 行，所有逻辑、数据、UI 全部内联。
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
<div className="grid grid-rows-[minmax(0,10fr)_minmax(0,9fr)_minmax(0,11fr)] gap-2">
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

### 2.4 窗口自适应

- Grid `30fr_35fr_35fr` 比例随窗口缩放自动适应。
- 各面板 `overflow-auto` 内容过多时独立滚动。
- SVG 图表通过 `viewBox` 自适应容器尺寸。
- 无最小宽高限制（CSS Grid + fr 单位无下限）。

---

## 3. 组件状态管理

### 3.1 状态分布（全部为本地 useState）

| 组件 | 状态 | 类型 | 用途 |
|------|------|------|------|
| App | currentTime | Date | 顶部栏时钟 |
| LeftSummaryPanel | bankRateRows | BankRateRow[] | 可编辑的银行报价 |
| | draftBankRateRows | BankRateRow[] | 编辑弹窗缓冲区 |
| | isBankEditorOpen | boolean | 弹窗开关 |
| MainQuoteBoard | displayLevel | 1 \| 2 | 1级摘要 / 2级全量 |
| | activeSectionId | string \| null | 激活的报价区 |
| | topRatio | number | 上下区垂直比例 |
| RightSidebar | overlayProduct | OverlayProduct | 叠加品种（DR007/GC007/R007） |
| | historyRange | HistoryRange | 历史时间范围（5d/1m/6m） |
| | rightLowerTab | RightLowerTab | 底部 Tab |
| | spreadLeft, spreadRight | SpreadProduct | 利差产品选择 |
| NCD Card | tab | "trend" \| "table" | NCD 趋势图/表格 |
| ExchangeRepoCard | tab | "core" \| "sse" \| "szse" | 交易所 Tab |
| FundStructurePanel | days | 14 \| 30 \| 180 | 资金结构时间范围 |

### 3.2 跨组件通信

**不存在跨组件通信**。每个组件完全独立。编辑弹窗修改的 bankRateRows 仅影响 LeftSummaryPanel 自身。

### 3.3 持久化

仅中栏的 `topRatio`（上下区比例）通过 localStorage 持久化：

```typescript
localStorage.setItem('repo-split-ratio', String(topRatio));
```

其他所有状态在刷新后丢失。

---

## 4. 中栏实现细节

### 4.1 1级/2级切换

```typescript
// displayLevel: 1 | 2
// 1 级：每组的 rows 只取 quoteRank === "最优" || "次优"
// 2 级：每组的全部 rows
const filteredRows = displayLevel === 1
  ? group.rows.filter(r => r.quoteRank === "最优" || r.quoteRank === "次优")
  : group.rows;
```

### 4.2 报价分组数据结构

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

### 4.3 拖拽分隔条实现

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

### 4.4 区头聚焦

```typescript
// 点击报价区区头 → setActiveSectionId(sectionId)
// activeSectionId === sectionId → 再次点击取消激活
// 激活区 flex-[3]，非激活区 flex-[1]
```

---

## 5. 右栏图表实现

### 5.1 图表库选择

右栏所有图表使用**自定义 SVG**，不使用 Recharts。原因是减少依赖体积。

### 5.2 分时图 SVG 结构

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

### 5.3 数据点映射

```typescript
// 40 个数据点 → 映射到 SVG 坐标
const xScale = (i: number) => (i / (dataPoints.length - 1)) * chartWidth;
const yScale = (v: number) => chartHeight - ((v - minPrice) / (maxPrice - minPrice)) * chartHeight;
```

### 5.4 历史数据集

```typescript
const historicalCloseDatasets = {
  "5d": { closes: [1.32, 1.35, 1.28, 1.40, 1.37], volumes: [...] },
  "1m": { closes: [/* 28 points */], volumes: [...] },
  "6m": buildSixMonthDailyDataset(), // 126 个点，正弦波合成
};
```

---

## 6. 左栏编辑弹窗

### 6.1 弹窗状态

```typescript
const [isBankEditorOpen, setIsBankEditorOpen] = useState(false);
const [draftBankRateRows, setDraftBankRateRows] = useState([...bankRateRows]);
```

### 6.2 操作逻辑

- **打开**：复制当前数据到 draft，打开弹窗。
- **保存**：draft → bankRateRows，关闭弹窗。
- **重置**：重新从 bankRateRows 复制到 draft。
- **取消**：关闭弹窗，丢弃 draft。

### 6.3 不持久化

修改仅在内存中，刷新页面后恢复为硬编码默认值。

---

## 7. 废弃组件清单

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

## 8. 技术债务

| 债务 | 严重度 | 说明 |
|------|--------|------|
| 单体 App.tsx 3727 行 | **高** | 不可维护。需要拆分组件到独立文件。 |
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
> - `data-inventory.md` — 数据清单
> - `user-guide.md` — 用户使用说明
