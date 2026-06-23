# App.tsx 拆分重构进度

> 最后更新: 2026-06-23  
> 起始行数: 18,535 行  
> 当前行数: **6,778 行**  
> 当前状态: `build:react` / `test:react-dashboard` 通过

## 总览

| Phase | 模块 | 状态 | 说明 |
| --- | --- | --- | --- |
| 0 | 清理重复代码 | 已完成 | 已删除一批 shell/dialog 重复定义，`useHoverPopover` 已提取 |
| 1 | shell | 部分完成 | `shell.data.ts` 已提取，壳层组件待继续拆 |
| 2 | big-bank | 进行中 | feature 已落地，但 `App.tsx` 内仍保留旧实现残留 |
| 3 | xrepo | 已完成 | 已提取到 `features/xrepo` 并接入 `App.tsx` |
| 4 | institution-period | 已完成 | 已提取到 `features/institution-period` 并接入 `App.tsx` |
| 5 | ncd | 已完成 | 已提取到 `features/ncd`，并移除 `App.tsx` 内旧实现 |
| 6 | quote-board | 已完成 | 已提取到 `features/quote-board`，`App.tsx` 仅保留页面态接线 |
| 7-11 | 其他模块 | 未开始/部分散落 | 以后续实际拆分为准 |
| 12 | 最终清理 | 未开始 | 以剩余残留清理为准 |

## 本轮完成

### ncd feature 已完成

已新增:

- `src/app/features/ncd/ncd.data.ts`
- `src/app/features/ncd/ncd.metrics.ts`
- `src/app/features/ncd/ncd.types.ts`
- `src/app/features/ncd/ncd.utils.ts`
- `src/app/features/ncd/NcdCard.tsx`
- `src/app/features/ncd/index.ts`

已完成:

- 提取 `LeftNcdCard`
- 提取 NCD 趋势图、联动图、表格与展开态内容
- 提取 NCD 独立数据、类型、tenor/period 映射与指标汇总逻辑
- `App.tsx` 改为通过 `features/ncd` 渲染页面态、预览态与模块摘要
- `App.tsx` 内旧的 NCD 数据常量、组件实现、helper 残留已移除

### 共享 UI 已补充

已新增:

- `src/app/components/ui/StructuredTable.tsx`

已完成:

- 将通用表格实现从 `App.tsx` 提取为共享组件
- `App.tsx` 与 `features/ncd` 已统一走共享 `StructuredTable`
- `App.tsx` 内本地 `StructuredTable` / `cellClassName` 副本已移除

### quote-board feature 已完成

已新增/整理:

- `src/app/features/quote-board/quoteBoard.data.ts`
- `src/app/features/quote-board/quoteBoard.types.ts`
- `src/app/features/quote-board/quoteBoard.utils.ts`
- `src/app/features/quote-board/QuoteBoardFilterControls.tsx`
- `src/app/features/quote-board/RepoQuoteSectionBoard.tsx`
- `src/app/features/quote-board/OpponentExpandPanel.tsx`
- `src/app/features/quote-board/MainQuoteBoard.tsx`
- `src/app/features/quote-board/QuoteBoardGlobalFilterFrame.tsx`
- `src/app/features/quote-board/index.ts`
- `src/app/components/ui/FilterControls.tsx`

已完成:

- 提取 `MainQuoteBoard`、`QuoteBoardFilterControls`、`RepoQuoteSectionBoard`、`OpponentExpandPanel`
- 提取 quote-board 独立数据、类型、筛选/排序工具与全局筛选摘要
- `App.tsx` 改为通过 `features/quote-board` 渲染页面态、预览态与模块摘要
- `App.tsx` 内本地 `GlobalFilterFrame` 已移除，不再直接读取 `topBoardFilters`

### App.tsx 当前状态

已完成:

- 接入 `features/xrepo`
- 接入 `features/institution-period`
- 接入 `features/ncd`
- 接入 `features/quote-board`
- `App.tsx` 总行数已调整到 `6,778`

当前残留重点:

- big-bank 旧数据与旧组件仍在 `App.tsx`
- 其他未拆模块仍混在主文件中

## 验证

已执行:

- `npm run build:react`
- `npm run test:react-dashboard`

结果:

- 均通过

说明:

- 本轮 quote-board 收口未引入新的构建或测试问题
- 为恢复构建，这轮顺手修复了 `src/app/features/big-bank/BigBankHistoryBack.tsx`
- 同时修复了 `src/app/features/big-bank/bank.utils.ts`
- 同时修复了 `src/app/features/big-bank/BigBankCharts.tsx`
- 上述修复均为 feature 文件内已有的编码/字符串损坏，不是 NCD 拆分引入的新逻辑问题

## 下一步

下一轮建议优先继续清理 big-bank 残留：

1. 删除 `App.tsx` 内 big-bank 顶部数据常量副本，统一从 `features/big-bank` 读取。
2. 删除 `App.tsx` 内 big-bank 工具函数副本，统一走 `bank.utils.ts`。
3. 删除 `App.tsx` 内 big-bank 图表与历史回看副本。
4. 继续压缩主文件体积后，再推进其它未拆模块。

## 备注

- 当前工作树里还有用户自己的并行改动，未做回滚。
- 这轮已把“步骤 5 / ncd”推进到“新模块接入 + App.tsx 旧实现清理 + 构建通过”的完成态。
- 这轮同时补完了“步骤 6 / quote-board”的最后接线清理：全局筛选摘要与页框占位框已回收至 feature 内。
