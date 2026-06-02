# 数据清单 — codex 分支

> 补充文档 | 配合 `business-prd.md`、`修正计划-20260514.md` 使用
> 最近更新: 2026-05-18

---

## 数据架构说明

codex 分支的**所有数据都是内联常量**，直接定义在 `src/app/App.tsx` 中。没有独立的 data/ 目录，没有 API 调用，没有异步数据获取。会话级可变状态（白名单、修正 overrides、三栏宽度）用 React state + localStorage。

状态标记说明（用于规划维度）：`✅ 已实现` / `🔶 已有但需改造` / `🆕 新增` / `❓ 待业务确认`。

---

# 第一部分 · 现状数据实体（字段级）

## 1. 非银报价（QT 报价 · 核心实体）

**位置**: `repoQuoteSections` 常量 + `MainQuoteBoard` 的 `overrides` state
**数量**: ~46 条报价记录

| 报价方向 | 分组 | 行数 |
|---|---|---|
| 逆回购 | 利率地方 | 9 |
| 逆回购 | 存单商金 | 7 |
| 逆回购 | 信用 | 9 |
| 正回购 | 利率地方 | 7 |
| 正回购 | 存单商金 | 6 |
| 正回购 | 信用 | 8 |

**行字段（QuoteDetailRow）**: id、institution、tenor、amount、rate、collateral、rank（最优/次优/报价）、reason、accountType、minimum、updatedAt

**修正能力（QuoteOverride）**: 分组(groupName)、机构、期限、评级、利率、金额、起投门槛、账户类型、质押品 均可在「修正」弹窗编辑；保存写入 `overrides[id]` 并刷新 updatedAt；`applyOverride` 在渲染前合并，1 级/2 级视图同步生效。

**约束**: 机构覆盖约 25 家；报价等级为**静态分配**（非动态计算，规划改造见第二部分）；下载/已出完/失效时间为占位未实现。

---

## 2. 大行价格（BankRateRow）

**位置**: `initialBankRateRows` 常量 + `LeftSummaryPanel` 的 `whitelist`/`bankRateRows` state
**结构**: 机构 × 期限（隔夜 ON / 7天 7D）二维

| 字段 | 形态 |
|---|---|
| institution | 工行/建行/农行/中行 + 手工添加（写入 whitelist state）|
| tenor | `ON`(隔夜) / `7D`(7天) |
| nonBankRate / refNonBankRate / deltaNonBankBp | 非银利率 + 参考价 + 涨跌 bp（绿涨）|
| bankRate / refBankRate / deltaBp | 银行利率 + 参考价 + 涨跌 bp（红涨）|
| updatedAt | HH:MM:SS |
| hasQuote | 派生：两利率全空 → false → 列表隐藏该期限 |
| bigBankWhitelist | 会话级 state，控制展示范围 |

**约束**: 手工输入弹窗按「白名单 × {隔夜,7天}」全量铺平，缺值行可编辑；hasQuote 由录入派生。

---

## 3. XREPO

**位置**: `leftSections` 中 XREPO rows
**数量**: 4 条（R001 / R007 / R014 / R021；已删 R028）

字段: 期限、正回购可点击量、正回购金额、正回购利率(红)、逆回购利率(绿)、逆回购金额、逆回购可点击量、操作(发送)。列宽 `fitToWidth` 自适应。

---

## 4. 交易所回购（ExchangeMarketSplitSection）

**位置**: `leftSections` 中 exchange-split section
**视图**: 核心 / 上交所(sse) / 深交所(szse) 三 Tab

字段: 期限(1天~28天)、品种(GC001~GC028 沪 / R-001~R-028 深)、最新价(绿)、涨跌 bp。核心视图为两所合并摘要。

---

## 5. NCD 趋势

**位置**: `ncdTrendSeries` / `ncdThreeMonthSeries` / `ncdOneYearSeries`、`ncdSecondary*6m`、`ncdPrimary*Base6m`
**视图**: 趋势图 / 表格 两 Tab（已移除一级期限 Tab）

| 序列 | 形态 |
|---|---|
| 趋势主序列 | 隔夜 / 3M / 1Y 折线 |
| 二级市场 | Gov / AAA / AA+ / AA 6 个月（130 点）|
| 一级市场 | Gov / AAA / AA+ / AA 基准序列 |

图例按评级分色（国债 / AAA / AA+ / AA）。

---

## 6. 加权价格走势（historicalCloseDatasets）

**位置**: `historicalCloseDatasets` + `historicalProductSeries`
**区间**: 5d(5点) / 1m(28点) / 6m(126点) 三 Tab

| 字段 | 形态 |
|---|---|
| labels | 日期数组（按区间）|
| close[] | 加权价格主线（dr001 基准）|
| volume[] | 成交量柱 |
| overlayProduct / compareProduct | none / dr007 / gc007 / r007 |
| historicalProductSeries | 各品种**独立** randomWalk（独立锚点/波动/种子）|
| 价差柱 | 主线−对比，y 轴精度自适应、`-0` 归一 |

---

## 7. 匿名成交走势（intradaySeries）

**位置**: `intradaySeries` / `intradayVolumeSeries` / `intradayTimeLabels` / `intradayOverlaySeriesByProduct`
**数量**: 40 点，时间轴 09:30~15:00

字段: 盘中序列(锚 1.979)、成交量柱、叠加品种(none/dr007/gc007/r007，各品种独立序列)、副标题口径「匿名成交利率 / 成交量(或利差bp)」。

---

## 8. 机构分期限统计（CfetsInstPanel）

**位置**: `cfetsInstAnchorsBase` → 派生 `cfetsInstTrend`

| 维度 | 取值 |
|---|---|
| period | R001/R007/R014/R021/R1M/R2M/R3M/R4M/R6M/R9M/R1Y（11 档单选）|
| metricKey | 正/逆回购 利率·交易额·余额·净额（8 项下拉）|
| range | 14d / 1m / 6m |
| instTypes | 大型银行/中小型银行/证券/保险/基金及产品/货基/理财子/其他（8 类多选）|
| series | 大行/股份行/理财/理财子/券商/基金/保险 |
| hiddenSeries | 图例点击切换显隐 |

R2M~R1Y 锚点为 mock 补充值（基于 R1M 递增）。

---

## 9. 顶部 / 全局 / 布局态

| 维度 | 形态 |
|---|---|
| 金额 / 利率筛选 | 静态展示，不参与过滤 |
| DR007 / 资金情绪 / 状态徽章 | 顶部指标 |
| columnRatios | 三栏宽度，可拖拽，localStorage `boardColumnRatios.v1` 持久化，含 clamp(min 16/28/20) + 「⤺布局」恢复默认 |

---

# 第二部分 · QT 报价中心化（规划数据维度）

> 来源: 2026-05-16 业务反馈。核心论点：产品重心从「三栏均衡看板」转向「以 QT 报价为绝对中心的成交工作台」。

## A. QT 报价行 — 需新增/改造的维度

| 维度 | 字段 | 状态 |
|---|---|---|
| 报价方向 | direction | 🔶 现为 section 结构，应入行字段 |
| 对手等级 | counterpartyTier（A/B/C…）| 🆕 来自对手库 |
| 评级 | rank | 🔶 改为 (利率,对手等级,新鲜度) **计算值** |
| 账户要求 | accountType | 🔶 升级为筛选维度 |
| 押券要求 | collateral | 🔶 升级为筛选维度 |
| 报出时间 | quotedAt | 🔶 与 updatedAt 拆分 |
| 新鲜度 | ageSeconds（now−quotedAt）| 🆕 |
| 生命周期 | status（active/stale/expired/filled/replaced）| 🆕 |
| 是否库内 | inCounterpartyLib | 🆕 |
| 关联会话 | qtConversationId | 🆕❓ 依赖 QT 形态 |

## B. 对手库（新实体 Counterparty Master）

| 字段 | 状态 |
|---|---|
| counterpartyId / name | 🆕 |
| tier 优劣等级 | 🆕❓ 档位数待定 |
| instType 机构类型 | 🆕（复用现有 8 类枚举）|
| active 是否在库 | 🆕 |
| qtHandle / conversationId | 🆕❓ 依赖 QT |
| owner / updatedAt | 🆕 |
| 历史成交量 / 履约率（可选）| ❓ 二期 |

## C. 报价生命周期 / 时效

| 字段 | 状态 |
|---|---|
| quotedAt / updatedAt / ageSeconds | 🆕（部分派生）|
| staleThreshold / expireThreshold | 🆕❓ 规则待定 |
| status 流转 active→stale→expired/filled/replaced | 🆕 |
| 失效来源（超时/撤价/已出完/被替代）| 🆕❓ |

## D. 筛选维度（过滤层）

| 维度 | 状态 |
|---|---|
| 期限（多选）| 🔶 现单选 |
| 对手范围（仅库内/全部）| 🆕 |
| 对手等级（A/B/C 多选）| 🆕 |
| 账户要求（多选）| 🆕 |
| 押券要求（多选）| 🆕 |
| 失效状态（隐藏过期/含 stale/全部）| 🆕 |
| 金额 / 利率区间 | 🔶 现静态 |

## E. 复合排序

| 优先级 | 维度 | 状态 |
|---|---|---|
| 1 | 利率（方向决定升降序）| 🔶 逻辑重写 |
| 2 | 价差≤阈值 → 对手等级 | 🆕❓ 阈值待定 |
| 3 | 同级 → 新鲜度（ageSeconds 升序）| 🆕 |
| 4 | 再同 → 金额 / 原序 | 🔶 |

## F. 聊天 / 成交联动

| 维度 | 状态 |
|---|---|
| 会话入口 qtConversationId / deeplink | 🆕❓ |
| 选中报价上下文（机构+等级+期限+量+价+时效）| 🔶 组合现有 |
| 快捷动作（一键聊天/发送/标记成交）| 🆕 |
| 成交回写 status→filled | 🆕 |

## G. 布局 / 会话态（前端 state）

| 维度 | 状态 |
|---|---|
| columnRatios 三栏宽度 | ✅ |
| 左/右栏折叠 collapsed L/R | 🆕 |
| 视图模式 看板 / QT专注 | 🆕 |
| 报价↔聊天分栏比例 | 🆕 |
| 选中报价 selectedQuoteId | 🆕 |

## 推进依赖

```
地基: B 对手库 + C 生命周期  →  解锁  A/D(对手)/E/F
不依赖地基可先做: D 中的 账户/押券筛选(④) + E 利率排序重写(①部分)
阻塞确认项: QT 集成形态(F) / 对手库来源与等级(B) / 失效规则(C) / 同价阈值(E)
```

---

# 第三部分 · 数据校验规则

### 一、非银报价（1-11）

| # | 规则 | 说明 |
|---|---|---|
| 1 | bidRate ≤ askRate | 正回购利率不得高于逆回购利率 |
| 2 | 金额 ≥ 0 | 不允许负值 |
| 3 | 利率 > 0 | 必须为正 |
| 4 | 期限在预期列表 | R001/R007/R014/R021/R028 |
| 5 | 报价等级有效 | 最优/次优/报价 之一 |
| 6 | 机构名非空 | — |
| 7 | 分组合法 | 利率地方/存单商金/信用 |
| 8 | 同组机构名唯一 | — |
| 9 | 质押品非空 | collateral |
| 10 | 账户类型非空 | accountType |
| 11 | 更新时间格式 | HH:mm:ss |

### 二、XREPO（12-15）

| # | 规则 | 说明 |
|---|---|---|
| 12 | bidRate ≤ askRate | 正回购利率 ≤ 逆回购利率 |
| 13 | 金额 ≥ 0 | 正/逆回购金额 |
| 14 | 可点击量 ≥ 0 | 两侧 |
| 15 | 期限在预期列表 | R001/R007/R014/R021（已删 R028）|

### 三、交易所回购（16-18）

| # | 规则 | 说明 |
|---|---|---|
| 16 | 最新价 > 0 | — |
| 17 | 涨跌 bp 绝对值 ≤ 500 | 异常波动阈值 |
| 18 | 成交额 ≥ 0 | — |

### 四、NCD（19-22）

| # | 规则 | 说明 |
|---|---|---|
| 19 | bidRate ≤ askRate | 买入 ≤ 卖出收益率 |
| 20 | 利率 > 0 | — |
| 21 | 期限合法 | 隔夜 / 3M / 1Y（趋势）|
| 22 | 名称非空 | — |

### 五、机构分期限统计（23-25）

| # | 规则 | 说明 |
|---|---|---|
| 23 | buyRate ≤ sellRate（非 null 时）| 正回购利率 ≤ 逆回购利率 |
| 24 | 金额 ≥ 0（非 null 时）| buyAmt/sellAmt/netInflow |
| 25 | 机构类型合法 | 8 类机构枚举 |

### 六、图表数据（26-28）

| # | 规则 | 说明 |
|---|---|---|
| 26 | 数据点按时间排序 | 分时早→晚，历史旧→新 |
| 27 | 价格/成交量 ≥ 0 | — |
| 28 | 数据点 ≥ 2 | 至少 2 点绘线 |

### 七、规划新增校验（QT 中心化，待落地）

| # | 规则 | 说明 |
|---|---|---|
| 29 | 库外对手默认不展示 | inCounterpartyLib=false 隐藏，可一键显示 |
| 30 | 过期报价置底/移除 | status=expired 不参与最优排序 |
| 31 | 对手等级在枚举内 | counterpartyTier ∈ 对手库等级集 |
| 32 | 计算 rank 一致性 | rank 由排序结果导出，不得与排序矛盾 |

---

# 第四部分 · 真实 API 映射建议

| 当前数据 | 建议 API | 刷新频率 |
|---|---|---|
| 大行价格 | GET /api/quotes/bankPrice | 3-5s |
| XREPO | GET /api/quotes/xrepo | 3-5s |
| 交易所回购 | GET /api/quotes/exchange | 3-5s |
| 非银报价 | GET /api/quotes/detail?direction={repo/reverse} | 3-5s |
| NCD | GET /api/quotes/ncd | 10s |
| 匿名成交 | GET /api/trends/intraday?product=DR001 | 3-5s |
| 加权价格走势 | GET /api/trends/history?product=DR001&range={5d/1m/6m} | 手动刷新 |
| 机构分期限统计 | GET /api/reference/instTerm?range={14d/1m/6m} | 日更新 |
| 对手库（规划）| GET /api/counterparty/master | 启动加载 + 变更推送 |
| QT 会话（规划）| QT IM 适配层（形态待定）| 实时 |
