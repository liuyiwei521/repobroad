# 融合方案：B 布局 + A 内容 — 详细实施计划

> 布局沿用方案 B 的「左表 + 右图 + 底栏 + 情绪」结构；
> 内容覆盖方案 A 的全部 6 个行情源 + 4 类参考数据；
> 配色用已做好的 navy 海军蓝。

---

## 一、版面总览

```
┌────────────────────────────────────────────────────────────────────────┐
│ TopBar: 资金实时行情看板 | 系统时间 | 数据更新 | DR007 2.15% ↑0.05 | 资金面 │
├────────────────────────────────────────────────────────────────────────┤
│ SourceTabBar:                                                          │
│ [●XRepo] [非银最优] [大行价格] [交易所回购] [NCD] [同业存款]            │
│ PeriodFilter: 期限 [全部 1 7 14 21 28+]                                │
├──────────────────────────────────────┬─────────────────────────────────┤
│ ① MainMarketTable                    │                                 │
│ 当前 Tab 下的 品种×期限 表           │ ④ BigChartArea                 │
│ 行：R001/R007/R014/R021/R028         │    sub-tabs: 分时 历史 对比     │
│ 列：量 最新 涨跌bp 加权 成交额 操作  │                                 │
│ (选中行会高亮，默认 R007)             │    [价格线图 60%]               │
│                                      │    [成交量柱 30%]               │
├──────────────────────────────────────┤                                 │
│ ② InstitutionCompareTable            │                                 │
│ 搜索框「指定机构：___」               │                                 │
│ 同当前 Tab + 同 ① 选中期限下，        ├─────────────────────────────────┤
│ 各机构明细（大行+非银混合按类型区分） │ ⑤ SentimentCard                │
│ 行：工商/建设/农业/.../中信/鹏扬/...  │    当前指数 51 [平衡]          │
│                                      │    面积图：全市场/大行/中小/非银│
├──────────────────────────────────────┤                                 │
│ ③ BottomDetailTabs                   │                                 │
│ [分机构回购] [NCD曲线] [资金结构]    │                                 │
│ 对应的堆叠柱 / 曲线 / 堆叠柱          │                                 │
└──────────────────────────────────────┴─────────────────────────────────┘
```

**比例建议**（宽度）：
- 左 60% / 右 40%
- 左侧纵向分三段：① 35% / ② 35% / ③ 30%
- 右侧纵向分两段：④ 65% / ⑤ 35%

---

## 二、组件拆分

```
src/app/
├── App.tsx                              # 顶层壳 + 全局状态 Provider
│
├── context/
│   └── WorkstationContext.tsx           # 全局状态（见第四节）
│
├── components/
│   ├── layout/
│   │   ├── TopBar.tsx                   # 标题、时间、DR007、资金面
│   │   ├── SourceTabBar.tsx             # 6 个行情源 Tab
│   │   └── PeriodFilter.tsx             # 期限过滤
│   │
│   ├── area1-main/
│   │   ├── MainMarketTable.tsx          # 主表容器（按 Tab 切数据）
│   │   └── MarketTableRow.tsx           # 行组件（带发送按钮）
│   │
│   ├── area2-institutions/
│   │   ├── InstitutionCompareTable.tsx  # 机构对比表
│   │   └── InstitutionSearchBar.tsx     # 机构搜索
│   │
│   ├── area3-bottom/
│   │   ├── BottomDetailTabs.tsx         # 子 Tab 容器
│   │   ├── InstRepoStacked.tsx          # 分机构回购堆叠柱
│   │   ├── NcdCurveCard.tsx             # NCD 利率曲线
│   │   └── CapitalStructureBar.tsx      # 资金结构堆叠
│   │
│   ├── area4-bigchart/
│   │   ├── BigChartArea.tsx             # 大图容器
│   │   ├── BigChartTabs.tsx             # 分时/历史/对比
│   │   ├── IntradayChart.tsx            # 分时（价+量）
│   │   ├── HistoryChart.tsx             # 历史（价+量）
│   │   └── ComparisonChart.tsx          # 多线对比（= 趋势一览）
│   │
│   ├── area5-sentiment/
│   │   └── SentimentCard.tsx            # 资金情绪指数
│   │
│   ├── shared/
│   │   ├── CardHeader.tsx               # 卡头：图标+标题+更新时间+操作
│   │   ├── PriceCell.tsx                # 涨跌色数字单元
│   │   ├── UpdateBadge.tsx              # "数据更新 10:53:27" 徽章
│   │   ├── InstitutionBadge.tsx         # 机构类型徽章（银/券商/基金/...）
│   │   └── EmptyState.tsx               # 空态
│   │
│   └── MarketChartPage.tsx              # 保留：弹窗大图
```

**废弃**：`LeftPanel.tsx / CenterPanel.tsx / RightPanel.tsx`

---

## 三、数据层

```
src/app/data/
├── types.ts
│   ├── SourceId = 'xrepo'|'nonbankBest'|'bankPrice'|'exchange'|'ncd'|'interbank'
│   ├── Period = '1'|'7'|'14'|'21'|'28+' | 'GC001'|'GC007'|'R-001'|...
│   ├── Quote { period, bidRate, bidVolume, askRate, askVolume, weightedAvg, totalAmount, changeBp, highLow, ... }
│   ├── Institution { id, name, type: '大行'|'股份行'|'城商行'|'券商'|'基金'|'理财子'|'保险' }
│   ├── InstQuote { institution, period, bidRate, bidVolume, askRate, askVolume }
│   ├── TimePoint { time, value, volume? }
│   ├── SentimentPoint { time, fullMarket, bigBank, smallBank, nonBank }
│   └── StructurePoint { date, 大行, 中小行, 货币, 券商, 理财子, 保险 }
│
├── sources.ts                    # 6 个数据源元信息（label/icon/默认期限等）
│
├── quotes/
│   ├── xrepo.ts                  # XRepo 明细（期限×量价）
│   ├── nonbankBest.ts            # 非银最优
│   ├── bankPrice.ts              # 大行价格
│   ├── exchange.ts               # 交易所回购
│   ├── ncd.ts                    # NCD（按期限 1M/3M/6M/9M/1Y）
│   └── interbank.ts              # 同业存款
│
├── institutions.ts               # 机构字典（大行 + 非银，含类型）
│
├── institutionQuotes.ts          # 各机构在各源/各期限下的报价（给 ② 用）
│
├── trends/
│   ├── intraday.ts               # 分时（今日每 1 分钟一点）
│   ├── history.ts                # 历史（日线，近 N 天）
│   └── comparison.ts             # 对比预设：5 条跨源线
│
├── reference/
│   ├── sentiment.ts              # 情绪指数时序 + 分层曲线
│   ├── institutionRepo.ts        # 分机构回购（堆叠柱日频）
│   └── capitalStructure.ts       # 资金结构（堆叠柱日频）
│
└── mockGenerator.ts              # 统一的随机波动逻辑（给实时刷新用）
```

**关键设计**：
- **mock 与真实数据接口形状一致**，将来接 CFETS/IDeal/QTrade 只换实现，不改组件
- 每个文件导出 `getXxx()` / `subscribeXxx()` 两套 API，前者一次性取，后者订阅实时推送

---

## 四、全局状态（WorkstationContext）

```ts
interface WorkstationState {
  // 顶部 Tab 选中的行情源
  activeSource: SourceId;             // 默认 'xrepo'

  // 期限过滤（全局）
  selectedPeriod: Period | 'all';     // 默认 'all'

  // ① 中高亮选中的行（联动 ②④）
  selectedRow: {
    source: SourceId;
    period: Period;
  } | null;                           // 默认 { source: 'xrepo', period: '7' }

  // ④ 大图当前模式
  bigChartMode: 'intraday' | 'history' | 'comparison';  // 默认 'comparison'（= 趋势一览）

  // ③ 底部当前子 Tab
  bottomTab: 'instRepo' | 'ncd' | 'structure';  // 默认 'instRepo'

  // ② 机构搜索
  institutionSearch: string;

  // actions
  setActiveSource, setSelectedPeriod, setSelectedRow,
  setBigChartMode, setBottomTab, setInstitutionSearch
}
```

用 React Context + useReducer；不引入 Redux/Zustand。

---

## 五、联动规则（决策依赖）

| 操作 | 改变的状态 | 受影响的区块 |
|---|---|---|
| 点顶部 Tab | `activeSource` | ①（换数据）② ④（标题/默认品种） |
| 点期限 | `selectedPeriod` | ① ② 过滤 |
| 点 ① 某行 | `selectedRow` | ② 刷新为该期限的机构报价 / ④ intraday/history 换品种 |
| ④ 子 Tab | `bigChartMode` | ④ 内部切换 |
| ③ 子 Tab | `bottomTab` | ③ 内部切换 |
| ② 搜索 | `institutionSearch` | ② 过滤行 |
| ① / ② 点"发送" | —— | 触发 `onSendToTrade(quote)`（不改状态） |

---

## 六、六个 Tab 下 ① 主表的列定义差异

不同数据源，列有差异，用「列配置驱动」而不是硬编码：

```ts
// 各源列配置
const columnsBySource: Record<SourceId, ColumnDef[]> = {
  xrepo: [
    { key: 'period', label: '期限' },
    { key: 'bidVolume', label: '量(亿)', align: 'right' },
    { key: 'bidRate', label: '逆回购', color: 'down' },
    { key: 'askRate', label: '正回购', color: 'up' },
    { key: 'askVolume', label: '量(亿)', align: 'right' },
    { key: 'action', label: '操作', render: 'sendButton' },
  ],
  nonbankBest: [...],
  bankPrice: [
    { key: 'institution', label: '银行' },
    { key: 'badge',      label: '(银)' },
    { key: 'bidRate',    label: '逆回购' },
    { key: 'askRate',    label: '正回购' },
    ...
  ],
  exchange: [
    { key: 'period', label: '品种' },       // GC001/R-001
    { key: 'changeBp', label: '涨跌bp' },
    { key: 'weightedAvg', label: '加权平均' },
    { key: 'totalAmount', label: '成交额' },
    { key: 'high', label: '最高' },
    { key: 'low', label: '最低' },
    { key: 'action', label: '操作' },
  ],
  ncd: [
    { key: 'period', label: '期限' },        // 1M/3M/6M/9M/1Y
    { key: 'rate', label: '利率' },
    { key: 'change', label: '变化' },
  ],
  interbank: [...],  // 同业存款类似
};
```

`MainMarketTable` 就是一个**配置驱动的通用表组件**。

---

## 七、实施步骤（分 4 步，每步可独立验收）

### Step 1 — 数据层 + 骨架（半天）
- 建所有 `data/**` 文件（先用静态 mock）
- 建 `WorkstationContext`
- `App.tsx` 换成新的网格布局（空的 5 个区块）
- 每个区块先放占位符（带标题）
- **验收**：页面能跑，布局正确，点 Tab / 期限能看到 state 变化（用 console.log）
- **产出物**：空骨架但布局已定

### Step 2 — ① + ② + ⑤（半天）
- `MainMarketTable`（配置驱动，6 个源都能渲染）
- `InstitutionCompareTable` + 搜索 + 联动
- `SentimentCard`（迁移现有情绪指数逻辑）
- **验收**：点 Tab / 行能看到 ①② 联动，右下角情绪指数正常
- **产出物**：核心表格功能完整

### Step 3 — ④ 大图区（半天）
- `IntradayChart`（价+量组合）
- `HistoryChart`（同结构不同时间粒度）
- `ComparisonChart`（趋势一览，5 条预设跨源线）
- `BigChartTabs` 切换三种模式
- ① 选中行联动到 intraday/history
- **验收**：三种模式切换流畅；选中品种大图正确；对比模式能看到趋势一览
- **产出物**：核心图表功能完整

### Step 4 — ③ 底部 + 打磨（半天）
- `InstRepoStacked` / `NcdCurveCard` / `CapitalStructureBar`
- `BottomDetailTabs` 切换
- 统一的 `CardHeader` / `UpdateBadge` / 涨跌色规则
- 空态、loading、错误态
- 键盘快捷键（可选）
- **验收**：所有内容就位，交互顺滑
- **产出物**：功能完整可交付

---

## 八、目录结构（最终态）

```
src/app/
├── App.tsx
├── context/
│   └── WorkstationContext.tsx
├── components/
│   ├── layout/{TopBar, SourceTabBar, PeriodFilter}.tsx
│   ├── area1-main/{MainMarketTable, MarketTableRow}.tsx
│   ├── area2-institutions/{InstitutionCompareTable, InstitutionSearchBar}.tsx
│   ├── area3-bottom/{BottomDetailTabs, InstRepoStacked, NcdCurveCard, CapitalStructureBar}.tsx
│   ├── area4-bigchart/{BigChartArea, BigChartTabs, IntradayChart, HistoryChart, ComparisonChart}.tsx
│   ├── area5-sentiment/SentimentCard.tsx
│   ├── shared/{CardHeader, PriceCell, UpdateBadge, InstitutionBadge, EmptyState}.tsx
│   ├── ui/...                  # shadcn 原组件保留
│   └── MarketChartPage.tsx     # 保留
├── data/
│   ├── types.ts
│   ├── sources.ts
│   ├── quotes/{xrepo,nonbankBest,bankPrice,exchange,ncd,interbank}.ts
│   ├── institutions.ts
│   ├── institutionQuotes.ts
│   ├── trends/{intraday,history,comparison}.ts
│   ├── reference/{sentiment,institutionRepo,capitalStructure}.ts
│   └── mockGenerator.ts
└── hooks/
    ├── useQuotes.ts           # 按 activeSource 取 ① 的数据
    ├── useInstitutionQuotes.ts # 取 ② 的数据
    ├── useTimeSeries.ts       # 取 ④ 的数据
    └── useRealtimeRefresh.ts  # 定时触发更新
```

---

## 九、需确认的决策点

1. **默认 Tab** 是 `xrepo` 还是 `exchange`（交易所回购大众更熟悉）？
2. **大图 ④ 默认模式**：`comparison`（进来就看到趋势一览）vs `intraday`（进来看单品种分时）？
3. **② 的显示规则**：
   - 选项 A：始终展示所有机构（用类型徽章区分）
   - 选项 B：当 Tab=大行价格 → 只显示大行；Tab=非银最优 → 只显示非银；Tab=XRepo → 混合
4. **"发送报价"** 点击后的动作：
   - 只是 `console.log`？还是弹窗确认？还是跳转到交易页？
5. **实时刷新频率**：现在是 5 秒，参考图看像是实时推送；保持 5s 还是更快？
6. **Step 验收节奏**：每步做完停下来让你看，还是 4 步一口气？
