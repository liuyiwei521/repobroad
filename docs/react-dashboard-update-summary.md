# React 看板整体更新计划与落地记录

> 更新时间：2026-06-23
> 适用范围：本轮 React 资金看板需求调整 + `App.tsx` 拆分重构
> 关联文档：
> - `docs/react-dashboard-adjustment-plan.md`
> - `docs/app-tsx-refactor-progress.md`

## 1. 目标范围

这轮更新不是单点修补，而是两条主线一起推进：

1. 产品与交互调整
   - 对齐最新看板需求，调整顶部情绪、广播、左侧入口、中部 tab、右侧走势、XREPO、大行价格、机构分期限统计、正逆回购看板等交互与展示口径。
2. 结构拆分与可维护性改造
   - 将超大 `App.tsx` 逐步拆到 `features/*` 与 `components/ui/*`，降低主文件复杂度，减少重复实现，为后续继续改模块留出空间。

## 2. 整体更新计划

### 主线 A：业务页面调整

按里程碑推进：

| 里程碑 | 计划内容 | 状态 |
| --- | --- | --- |
| M1 | 顶部信息、广播文案、筛选口径收敛 | 已完成 |
| M2 | 大行价格 / XREPO 由翻转改为弹窗与大图交互 | 已完成 |
| M3 | 中部期限与 tab 结构重组 | 已完成 |
| M4 | 右侧机构热度走势增强为“价 / 笔数 / 量”三指标 | 已完成 |
| M5 | React 页面主题回切并对齐 `tdxtheme` | 已完成 |
| M6 | 构建、测试与关键交互回归验证 | 已完成 |

### 主线 B：`App.tsx` 拆分重构

按阶段推进：

| Phase | 模块 | 计划 | 状态 |
| --- | --- | --- | --- |
| 0 | 重复代码清理 | 删除重复 dialog / shell 定义，提取通用 hook | 已完成 |
| 1 | shell | 提取 shell 数据与壳层依赖 | 部分完成 |
| 2 | big-bank | 将大行数据、图表、历史回看迁出主文件 | 进行中 |
| 3 | xrepo | 抽离 XREPO 数据与展示组件 | 已完成 |
| 4 | institution-period | 抽离机构分期限统计模块 | 已完成 |
| 5 | ncd | 抽离 NCD 数据、表格、图表与指标逻辑 | 已完成 |
| 6 | quote-board | 抽离正逆回购报价看板与筛选逻辑 | 已完成 |
| 7-11 | 其他模块 | 继续按功能域拆分 | 未全部开始 |
| 12 | 最终清理 | 清理主文件残留与统一依赖入口 | 未完成 |

## 3. 这轮实际做了什么

### 3.1 业务与交互层

已完成的主要需求包括：

- 顶部 `泰康资金情绪` 改成“文字 + 数字 + 时间 + 状态文案”的表达。
- 顶部滚动广播替换为最新资金交易提示文案。
- `大行价格` 从翻转式交互改为弹窗，并支持多选。
- `XREPO` 新增“当天”维度，并支持大弹窗查看。
- 中部期限显示统一为 `1d / 7d / 14d / 21d / 其他`。
- 删除 `已回复 / 未回复` 筛选项。
- `资金缺口` 与 `在途指令` 合并到同一个 tab。
- `资金分机构统计` 下移到中下区域 tab。
- 删除中上区域“非银报价”标题。
- 右侧 `机构热度走势` 增强为 `价 / 笔数 / 量` 三指标联动展示。
- React 页面运行主题回切并对齐 `tdxtheme`。

### 3.2 结构拆分层

这轮核心是把 `App.tsx` 继续瘦身，并把功能按业务域迁出：

- `xrepo` 已提取到 `src/app/features/xrepo`
- `institution-period` 已提取到 `src/app/features/institution-period`
- `ncd` 已提取到 `src/app/features/ncd`
- `quote-board` 已提取到 `src/app/features/quote-board`
- `StructuredTable` 已提取到 `src/app/components/ui/StructuredTable.tsx`
- `FilterControls` 已提取到 `src/app/components/ui/FilterControls.tsx`
- 图表基础能力已补到 `src/app/components/ui/ChartPrimitives.tsx`

### 3.3 主文件收口结果

- `App.tsx` 起始规模约为 `18,535` 行。
- 当前已降到 `6,778` 行。
- `App.tsx` 现在主要负责页面态接线、弹窗开关、模块组合与少量残留逻辑。

## 4. 本次代码落地清单

### 新增 / 抽离的主要模块

- `src/app/features/ncd/*`
- `src/app/features/quote-board/*`
- `src/app/features/institution-period/*`
- `src/app/features/intraday/*`
- `src/app/components/ui/ChartPrimitives.tsx`
- `src/app/components/ui/FilterControls.tsx`
- `src/app/components/ui/StructuredTable.tsx`

### 重点修改的已有文件

- `src/app/App.tsx`
- `src/app/features/big-bank/BigBankCharts.tsx`
- `src/app/features/big-bank/BigBankHistoryBack.tsx`
- `src/app/features/big-bank/bank.utils.ts`
- `src/app/features/xrepo/XrepoFrame.tsx`
- `src/styles/react-whiteboard.css`
- `src/styles/tdx-react.css`
- `docs/app-tsx-refactor-progress.md`

### 顺手修复的问题

- 为恢复构建，修复了 `big-bank` 相关 feature 文件中的编码/字符串损坏问题。
- 回收了 `App.tsx` 内本地 `StructuredTable`、`cellClassName`、局部筛选 UI 副本，统一改为共享实现。
- 回收了 quote-board 的全局筛选摘要与页框占位逻辑，避免继续留在主文件中。

## 5. 验证结果

本轮已执行：

```bash
npm run build:react
npm run test:react-dashboard
```

结果：

- `build:react` 通过
- `test:react-dashboard` 通过

## 6. 当前剩余事项

下一步最优先继续处理 `big-bank` 残留：

1. 删除 `App.tsx` 内 big-bank 顶部数据常量副本，统一从 `features/big-bank` 读取。
2. 删除 `App.tsx` 内 big-bank 工具函数副本，统一走 `bank.utils.ts`。
3. 删除 `App.tsx` 内 big-bank 图表与历史回看副本。
4. 继续压缩主文件后，再推进其余未拆模块。

## 7. 说明

- 当前工作树里还有并行文件与历史产物，本次提交只整理和提交本轮 React 看板相关变更。
- 这份文档用于汇总“整体更新计划 + 实际已完成内容”，后续可以继续在此基础上追加阶段记录。
