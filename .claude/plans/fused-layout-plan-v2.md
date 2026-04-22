# 融合布局 v2 — 详细 Plan

> B 布局 + A 内容。修订自 v1，核心变化：
> 行情源 Tab 下沉至 ①，② 改为跨源横比，③ 扩展为 4 子 Tab + 机构搜索。

---

## 一、版面总览

```
┌────────────────────────────────────────────────────────────────────────────┐
│ TopBar                                                                      │
│ 资金实时行情看板 | 系统时间 | 数据更新 | DR007 2.15% ↑0.05 | 资金面[平衡]    │
├────────────────────────────────────────────────────────────────────────────┤
│ PeriodFilter（全局）                                                         │
│ 期限 [全部 1 7 14 21 28+]       金额筛选 [全部|金额(万)|金额(亿)]             │
│                                 利率筛选 [全部|收益率|加权]                   │
├──────────────────────────────────────────┬─────────────────────────────────┤
│                                          │                                  │
│ ① MainMarketTable                        │ ④ BigChartArea                  │
│   行情源 sub-tabs（内嵌）：               │    sub-tabs: [分时] [历史] [●对比]│
│   [大行价格] [同业存款] [●XRepo]         │                                  │
│                                          │    [价格/利率线图  ≈65%]         │
│   列：正回购金额 正回购利率 逆回购利率 逆回购金额 操作    │                                  │
│   行：R001 / R007 / R014 / R021 / R028   │    [成交量柱      ≈25%]         │
│   （选中行高亮，默认 R007）               │    [图例栏        ≈10%]         │
│                                          │                                  │
├──────────────────────────────────────────┤                                  │
│                                          │                                  │
│ ② InstitutionCompareTable               ├─────────────────────────────────┤
│   同 ① 选中期限下，跨源横比：            │                                  │
│   sub-tabs: [●交易所回购] [非银最优]     │ ⑤ SentimentCard                 │
│                                          │    当前指数 51 [平衡]            │
│   列：机构/品种 | 最新 | 涨跌bp | 量 | 操作            │    面积图：                     │
│   大行+非银混合，按类型用徽章区分         │    全市场 / 大行 / 中小行 / 非银 │
│                                          │                                  │
├──────────────────────────────────────────┤                                  │
│                                          │                                  │
│ ③ BottomDetailTabs                       │                                  │
│   搜索框「指定机构：___」（在顶部）       │                                  │
│   sub-tabs: [分机构回购] [非银明细] [NCD曲线] [资金结构]                     │
│                                          │                                  │
│   [分机构回购] → 堆叠柱（大行/中小行/货币/券商/理财子/保险）                  │
│   [非银明细]  → 机构报价明细表（联动 ① 选中期限 + 机构搜索）                 │
│   [NCD曲线]  → 期限曲线图（1M/3M/6M/9M/1Y）                                │
│   [资金结构]  → 堆叠柱（机构资金结构日频）                                   │
└──────────────────────────────────────────┴─────────────────────────────────┘
```

**比例**：左 60% / 右 40%；左纵向 ①35% / ②30% / ③35%；右纵向 ④65% / ⑤35%

---

## 二、各区块详细定义

### TopBar（不变）
- 标题 / 系统时间（秒级刷新）/ 数据更新时间（5s）
- DR007 当前值 + 涨跌
- 资金面徽章（平衡/偏紧/宽松）

---

### PeriodFilter（全局，变化：增加两个维度筛选）

| 筛选项 | 选项 | 说明 |
|---|---|---|
| 期限 | 全部 / 1 / 7 / 14 / 21 / 28+ | ① ② ③非银明细 均响应 |
| 金额 | 全部 / 金额(万) / 金额(亿) | 控制数字单位显示 |
| 利率 | 全部 / 收益率 / 加权 | 控制利率列展示哪条线 |

---

### ① MainMarketTable（行情主表）

**行情源内嵌 sub-tabs**（不再是全局 Tab）：
- `[大行价格]` `[同业存款]` `[●XRepo]`（默认 XRepo）

> 设计意图：这三个是"同类型"的报价源（逆/正回购互报价），适合并排比较。
> 交易所回购 / NCD / 非银最优 是不同维度，放 ② 和 ③。

**列定义**（以 XRepo 为例）：
| 列 | 说明 |
|---|---|
| 期限 | R001 / R007 / R014 / R021 / R028 |
| 正回购金额 (亿) | 左侧量 |
| 正回购利率 | 红色，正回购方 |
| 逆回购利率 | 绿色，逆回购方 |
| 逆回购金额 (亿) | 右侧量 |
| 操作 | [发送] 按钮 → 弹窗确认 |

- 选中行：高亮背景 `#1a2e47`，点击触发 ②④ 联动
- 默认选中：R007

---

### ② InstitutionCompareTable（跨源横比）

**联动**：跟随 ① 选中期限（如 R007）

**sub-tabs**：`[●交易所回购]` `[非银最优]`
- 切换决定这张表的数据来源和行的"品种"含义

**列定义**：
| 列 | 说明 |
|---|---|
| 品种/机构 | GC007 / R-007 等（交易所）或 机构名（非银最优） |
| 最新 | 最新成交利率 |
| 涨跌bp | 红/绿 |
| 加权均值 | |
| 成交额 | |
| 操作 | [发送] |

---

### ③ BottomDetailTabs（底部明细 + 机构搜索）

**顶部**：搜索框「指定机构：___」（影响 [非银明细] Tab 的过滤）

**4 个子 Tab**：

| Tab | 内容 | 数据 |
|---|---|---|
| 分机构回购 | 堆叠柱状图（6 类机构，日频） | `institutionRepo.ts` |
| 非银明细 | 机构报价表（大行+非银，联动①期限 + 搜索框） | `institutionQuotes.ts` |
| NCD曲线 | 期限曲线折线图（1M/3M/6M/9M/1Y） | `ncd.ts` |
| 资金结构 | 堆叠柱（机构资金结构，日频） | `capitalStructure.ts` |

---

### ④ BigChartArea（大图，不变）

**3 个子 Tab**（默认"对比"）：
- `[分时]`：今日单品种价格+量（联动 ① 选中行，选 R007 就看 R007 分时）
- `[历史]`：单品种历史日线+量
- `[●对比]`：趋势一览预设 5 条线（默认，不需要用户操作）

**布局**：价格线图 65% / 量柱 25% / 图例 10%

---

### ⑤ SentimentCard（情绪指数，不变）

- 当前指数大数字 + 徽章
- 面积图：4 条分层曲线（全市场/大行/中小行/非银）

---

## 三、联动规则（修订版）

| 操作 | 状态变化 | 影响区块 |
|---|---|---|
| ① 切行情源 Tab | `activeSource` | ① 数据刷新 |
| 期限筛选（全局） | `selectedPeriod` | ① 行过滤 / ②③非银明细 行过滤 |
| 金额/利率筛选 | `amountUnit` / `rateType` | ① ② 数字单位/列 切换 |
| ① 点选某行 | `selectedRow.period` | ② 刷新 / ④ 分时&历史换品种 |
| ② 切子 Tab | `compareSource` | ② 数据刷新 |
| ③ 切子 Tab | `bottomTab` | ③ 内容切换 |
| ③ 搜索框输入 | `institutionSearch` | ③ [非银明细] 行过滤 |
| ④ 切子 Tab | `bigChartMode` | ④ 图形切换 |
| ① / ② 点"发送" | —— | 弹窗确认 → `onSendToTrade(quote)` |

---

## 四、状态（修订版 WorkstationContext）

```ts
interface State {
  // ① 行情源（内嵌 Tab，不再是全局）
  activeSource: 'xrepo' | 'bankPrice' | 'interbank';

  // 全局期限筛选
  selectedPeriod: string | 'all';

  // 全局金额单位
  amountUnit: 'all' | '万' | '亿';

  // 全局利率类型
  rateType: 'all' | '收益率' | '加权';

  // ① 选中行（联动 ②④）
  selectedRow: { source: string; period: string } | null;

  // ② 子 Tab
  compareSource: 'exchange' | 'nonbankBest';

  // ④ 大图模式
  bigChartMode: 'intraday' | 'history' | 'comparison';

  // ③ 底部子 Tab
  bottomTab: 'instRepo' | 'nonbankDetail' | 'ncd' | 'structure';

  // ③ 机构搜索
  institutionSearch: string;
}
```

---

## 五、组件结构（修订版）

```
src/app/
├── context/
│   └── WorkstationContext.tsx       ← 按新 State 重写
│
├── components/
│   ├── layout/
│   │   ├── TopBar.tsx               ← 不变
│   │   └── PeriodFilter.tsx         ← 增加金额/利率两组筛选（删 SourceTabBar）
│   │
│   ├── area1-main/
│   │   ├── MainMarketTable.tsx      ← 内嵌行情源 Tab（大行价格/同业存款/XRepo）
│   │   ├── MarketTableRow.tsx       ← 行组件（发送按钮 → 弹窗）
│   │   └── SendConfirmDialog.tsx    ← 发送确认弹窗（新增）
│   │
│   ├── area2-institutions/
│   │   └── InstitutionCompareTable.tsx  ← 交易所回购/非银最优 sub-tabs
│   │
│   ├── area3-bottom/
│   │   ├── BottomDetailTabs.tsx     ← 搜索框 + 4 子 Tab 容器
│   │   ├── InstRepoStacked.tsx      ← [分机构回购] 堆叠柱
│   │   ├── NonBankDetail.tsx        ← [非银明细] 机构报价表
│   │   ├── NcdCurve.tsx             ← [NCD曲线]
│   │   └── CapitalStructure.tsx     ← [资金结构] 堆叠柱
│   │
│   ├── area4-bigchart/
│   │   ├── BigChartArea.tsx         ← 容器 + 子 Tab
│   │   ├── IntradayChart.tsx        ← [分时] 价格+量
│   │   ├── HistoryChart.tsx         ← [历史] 价格+量
│   │   └── ComparisonChart.tsx      ← [对比] 5 条预设线
│   │
│   ├── area5-sentiment/
│   │   └── SentimentCard.tsx        ← 指数 + 面积图
│   │
│   └── shared/
│       ├── CardHeader.tsx
│       ├── PriceCell.tsx            ← 涨跌色数字
│       ├── InstitutionBadge.tsx     ← 机构类型徽章（大行/券商/基金/...）
│       └── SendConfirmDialog.tsx    ← 发送确认弹窗（也可放 area1）
```

**删除**：`layout/SourceTabBar.tsx`（行情源 Tab 下沉到 ①）

---

## 六、数据层（无变化，v1 已完成）

```
data/
├── types.ts          ← 新增 amountUnit / rateType / compareSource 类型
├── sources.ts
├── institutions.ts
├── quotes/{xrepo, nonbankBest, bankPrice, exchange, ncd, interbank}.ts
├── institutionQuotes.ts
├── trends/{intraday, history, comparison}.ts
└── reference/{sentiment, institutionRepo, capitalStructure}.ts
```

---

## 七、实施步骤（修订，Step 1 骨架需局部调整）

### Step 1 修订（已完成部分需调整）
- [ ] 删 `SourceTabBar.tsx`（行情源移入 ①）
- [ ] `WorkstationContext` 按新 State 更新（增加 `amountUnit` / `rateType` / `compareSource`，`activeSource` 范围缩小）
- [ ] `PeriodFilter` 增加金额/利率两组按钮
- [ ] App.tsx 布局不变，去掉 `<SourceTabBar />`
- [ ] ① 占位改为显示内嵌 Tab（3 个行情源按钮）

### Step 2 — ① + ② + ⑤（填充数据）
- `MainMarketTable`：内嵌 Tab + 列配置驱动 + 发送弹窗
- `InstitutionCompareTable`：交易所/非银 sub-tabs + 联动 ①
- `SentimentCard`：面积图

### Step 3 — ④ 大图区
- `ComparisonChart`（默认，5 条线）
- `IntradayChart` / `HistoryChart`（联动 ① 选中行）
- 子 Tab 切换

### Step 4 — ③ 底部 + 打磨
- 4 个子 Tab 内容
- 机构搜索联动 [非银明细]
- 统一 CardHeader / PriceCell / InstitutionBadge
- 发送弹窗细节

---

## 八、待确认（新增问题）

1. ① 内嵌的 3 个行情源（大行价格 / 同业存款 / XRepo）顺序和标签确认？
2. ② 的"非银最优"和"交易所回购"，列是否统一（最新+涨跌+量+操作），还是各自有差异列？
3. ③ [非银明细] 机构列表是按类型分组（大行组/非银组）还是混排加徽章？
