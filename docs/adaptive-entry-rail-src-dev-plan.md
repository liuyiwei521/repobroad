# 左侧自适应入口栏开发计划

## 1. 背景

当前后续开发基于 `src` 目录进行，目标是调整资金实时行情看板的主页面结构：

- 中间 `MainQuoteBoard / 非银报价` 保持常驻，作为主工作区。
- 除中间内容外，原左侧行情摘要和右侧趋势分析模块收缩为左侧入口栏。
- 左侧入口栏根据宽度自动适配不同展示形态。
- 点击入口后打开一个较大的网页页框，承载对应模块内容。

## 2. 目标交互

左侧入口栏需要支持三种核心形态：

| 形态 | 使用场景 | 展示内容 |
|---|---|---|
| 图标态 | 左侧很窄 | 只显示图标 |
| 简述态 | 左侧中等宽度 | 显示图标、标题、简述或状态 |
| 小弹窗态 | hover / focus 入口 | 展示入口说明、状态、更新时间 |

点击任意入口后，打开统一的大页框 `PageFrame`：

- 页框居中或贴近主区域弹出。
- 页框内展示对应模块原有内容。
- 关闭页框后，中间报价板状态不丢失。
- 同一时间默认只打开一个大页框。

## 3. 目标布局

```text
+----------------------+---------------------------------------------------------------+
| AdaptiveEntryRail     | MainQuoteBoard                                                |
|                      |                                                               |
| [入口] 今天大行价格    | 非银报价主工作区                                               |
| [入口] XREPO          | 期限筛选 / 1级2级 / 报价列表 / 报价编辑                         |
| [入口] 交易所回购      |                                                               |
| [入口] NCD            |                                                               |
| [入口] 加权价格走势    |                                                               |
| [入口] 匿名成交走势    |                                                               |
| [入口] 机构分期限统计  |                                                               |
+----------------------+---------------------------------------------------------------+

点击入口后：

+--------------------------------------------------------------------------+
| PageFrame: 对应模块标题                                  [刷新] [下载] [关闭] |
+--------------------------------------------------------------------------+
| 对应模块内容                                                               |
+--------------------------------------------------------------------------+
```

## 4. 宽度自适应规则

建议使用左侧栏自身宽度判断，而不是窗口宽度判断。

技术方案：

- 使用 `ResizeObserver` 监听 `AdaptiveEntryRail` 容器宽度。
- 根据容器宽度计算 `displayMode`。
- 保留未来拖拽或折叠时的自适应能力。

建议断点：

| 左侧栏宽度 | displayMode | 展示规则 |
|---|---|---|
| `<= 72px` | `icon` | 只显示图标 |
| `73px - 180px` | `compact` | 显示图标 + 标题 |
| `181px - 280px` | `summary` | 显示图标 + 标题 + 一行简述 |
| `> 280px` | `wide` | 显示分组、标题、简述、状态 |

## 5. 组件拆分计划

### 5.1 新增组件

```text
src/app/components/AdaptiveEntryRail.tsx
src/app/components/ModuleEntryItem.tsx
src/app/components/EntryPreviewPopover.tsx
src/app/components/PageFrame.tsx
```

### 5.2 组件职责

| 组件 | 职责 |
|---|---|
| `AdaptiveEntryRail` | 左侧入口栏容器，负责宽度监听、分组渲染、displayMode 计算 |
| `ModuleEntryItem` | 单个入口，负责图标、标题、简述、状态、点击事件 |
| `EntryPreviewPopover` | 小弹窗，负责 hover / focus 说明 |
| `PageFrame` | 大页框容器，负责标题、关闭、操作按钮、内容承载 |

### 5.3 状态类型建议

```ts
type EntryDisplayMode = "icon" | "compact" | "summary" | "wide";

type ModuleEntryId =
  | "big-bank-price"
  | "xrepo"
  | "exchange-repo"
  | "ncd"
  | "weighted-price"
  | "anonymous-trade"
  | "institution-period"
  | "global-filter"
  | "market-sentiment";

type ActiveFrame = {
  id: ModuleEntryId;
  title: string;
} | null;
```

## 6. 入口配置

建议用配置数组统一管理入口，避免入口信息散落在 JSX 中。

```ts
const moduleEntries = [
  {
    id: "big-bank-price",
    group: "行情摘要",
    title: "今天大行价格",
    description: "大行当日隔夜和7天资金价格",
    statusText: "10:53:27",
  },
  {
    id: "xrepo",
    group: "行情摘要",
    title: "XREPO",
    description: "匿名回购报价、发送与下载",
    statusText: "R001/R007",
  },
  {
    id: "weighted-price",
    group: "趋势分析",
    title: "加权价格走势",
    description: "R001 历史走势、成交量和对比品种",
    statusText: "R001",
  },
];
```

图标建议使用 `lucide-react`：

| 入口 | 建议图标 |
|---|---|
| 今天大行价格 | `Banknote` |
| XREPO | `Send` 或 `Repeat` |
| 交易所回购 | `Landmark` |
| NCD | `BadgePercent` |
| 加权价格走势 | `LineChart` |
| 匿名成交走势图 | `Activity` |
| 机构分期限统计 | `Network` |
| 金额 / 利率筛选 | `SlidersHorizontal` |
| DR007 / 资金情绪 | `Gauge` |

## 7. 迁移映射

| 入口 | 大页框内容 | 当前来源 |
|---|---|---|
| 今天大行价格 | 大行价格表、手工输入 | `LeftSummaryPanel` / `BankRateEditorModal` |
| XREPO | XREPO 表格、发送按钮 | `leftSections` / `StructuredTable` |
| 交易所回购 | 核心 / 上交所 / 深交所 tab | `ExchangeRepoCard` |
| NCD | 一级 / 二级、趋势图 / 表格 | `LeftNcdCard` |
| 加权价格走势 | 历史走势、成交量、对比品种 | `HistoryClosePanel` |
| 匿名成交走势图 | 日内走势、叠加品种 | `IntradayPanel` |
| 机构分期限统计 | 期限、指标、机构图例、多线图 | `CfetsInstPanel` |
| 金额 / 利率筛选 | 金额区间、利率区间 | `TopBar` 筛选区 |
| DR007 / 资金情绪 | DR007、资金情绪浮层 | `TopBar` / `SentimentChipWithPopover` |

## 8. 开发阶段

### 阶段 1：搭建骨架

任务：

- 新增 `AdaptiveEntryRail`。
- 新增 `PageFrame` 空壳。
- 新增入口配置。
- 修改 `App` 布局为「左入口栏 + 中间报价板」。
- 点击入口可打开空白大页框。

验收：

- 左侧入口栏能显示所有入口。
- 中间报价板保持可用。
- 点击入口能打开和关闭大页框。

### 阶段 2：实现宽度自适应

任务：

- 使用 `ResizeObserver` 监听左侧入口栏宽度。
- 实现 `icon`、`compact`、`summary`、`wide` 四种 displayMode。
- 处理文本截断、图标居中、分组标题隐藏规则。

验收：

- `64px` 宽度只显示图标。
- `140px` 宽度显示图标 + 标题。
- `220px` 宽度显示图标 + 标题 + 简述。
- 拖动或调整宽度时，形态实时变化。

### 阶段 3：实现小弹窗

任务：

- 新增 `EntryPreviewPopover`。
- hover / focus 入口时显示小弹窗。
- 小弹窗展示标题、描述、状态。
- 处理弹窗贴边定位。

验收：

- 图标态 hover 时能识别入口含义。
- 键盘 focus 也能触发小弹窗。
- 小弹窗不超出视口边界。

### 阶段 4：接入大页框内容

优先迁移：

1. 今天大行价格
2. 加权价格走势
3. 匿名成交走势图

第二批迁移：

1. 机构分期限统计
2. XREPO
3. 交易所回购
4. NCD

第三批迁移：

1. 金额 / 利率筛选
2. DR007 / 资金情绪

验收：

- 每个入口打开后都有对应内容。
- 原有 tab、筛选、tooltip 可继续使用。
- 关闭页框后，中间报价板状态不丢失。

### 阶段 5：交互细节补齐

任务：

- Escape 关闭大页框。
- 明确点击遮罩是否关闭。
- 未实现的下载 / 发送按钮显示禁用态或提示。
- 二级弹窗层级高于 `PageFrame`。
- 大页框内图表 tooltip 定位正确。

验收：

- 弹窗层级清晰。
- 不出现按钮看似可用但没有反馈的情况。
- 图表 hover tooltip 不偏移。

### 阶段 6：验证

验证项：

- 左侧四种宽度状态。
- 中间报价板筛选、1级 / 2级切换、行编辑。
- 大页框打开和关闭。
- 小弹窗 hover / focus。
- NCD 展开、今天大行价格手工输入等二级弹窗。
- 页面无横向溢出、文字重叠。

## 9. 最小可交付版本

第一版建议只交付：

- `AdaptiveEntryRail`
- `PageFrame`
- 入口宽度自适应
- 入口小弹窗
- 三个入口内容接入：
  - 今天大行价格
  - 加权价格走势
  - 匿名成交走势图

其他入口先显示空态：

```text
模块接入中
该功能入口已预留，后续会迁移对应模块。
```

这样可以最快验证整体交互模式，再逐步迁移剩余模块。

## 10. 风险点

| 风险 | 说明 | 建议 |
|---|---|---|
| 组件状态迁移 | 原左右模块内部有本地 state | 先拆内容组件，再迁移入口 |
| 图表 tooltip 偏移 | 当前 tooltip 使用 fixed 定位 | 在 PageFrame 内重点验证 |
| 跨模块联动 | 加权走势和匿名成交共享叠加品种状态 | 明确迁移后是否继续共享 |
| 操作按钮空转 | 下载 / 发送部分未实现 | 增加禁用态或 toast 提示 |
| 二级弹窗层级 | 手工输入、NCD 展开可能叠在 PageFrame 下 | 统一 z-index 规范 |

