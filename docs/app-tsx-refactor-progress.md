# App.tsx 拆分重构进度

> 最后更新: 2026-06-23  
> 起始行数: 18,535 行  
> 当前行数: **11,616 行**  
> 当前状态: `build:react` 通过

## 总览

| Phase | 模块 | 状态 | 说明 |
| --- | --- | --- | --- |
| 0 | 清理重复代码 | 已完成 | 已删除一批 shell/dialog 重复定义，`useHoverPopover` 已提取 |
| 1 | shell | 部分完成 | `shell.data.ts` 已提取，壳层组件待继续拆 |
| 2 | big-bank | 进行中 | feature 文件已落地并可编译，`App.tsx` 仍有旧定义残留待清理 |
| 3-12 | 其他模块 | 未开始/部分散落 | 以后续实际拆分为准 |

## 本轮完成

### big-bank feature 已创建

已新增:

- `src/app/features/big-bank/bank.data.ts`
- `src/app/features/big-bank/bank.utils.ts`
- `src/app/features/big-bank/BigBankCharts.tsx`
- `src/app/features/big-bank/BigBankHistoryBack.tsx`
- `src/app/features/big-bank/index.ts`

### 共享 UI 已补充

已新增:

- `src/app/components/ui/ChartPrimitives.tsx`

当前包含:

- `TrendLine`
- `ChartHoverLayer`
- `ChartTooltip`
- `LegendDot`
- `useChartTooltip`
- `buildLinePath`
- `buildAreaPath`

### App.tsx 当前状态

已完成:

- 接入 `features/big-bank` 的 import
- 构建通过，说明新增模块本身可用
- `App.tsx` 总行数已降到 `11,616`

未完成:

- `App.tsx` 内仍保留 big-bank 旧定义副本
- 当前是“新模块已落地，但旧实现尚未彻底删除”的过渡态

残留锚点:

- 顶部数据常量仍在 `App.tsx`
  - `defaultBigBankWhitelist`
  - `initialBankRateRows`
- big-bank 工具函数仍在 `App.tsx`
  - `makeEmptyBankRow`
  - `deriveHasQuote`
  - `parseRatePercent`
  - `rateDeltaValue`
  - `rateWithDelta`
  - `bankRateSpread`
- big-bank 图表/历史组件仍在 `App.tsx`
  - `BigBankPricingTrendChart`
  - `BigBankHistoryBack`
  - 相关 reference/recharts 图表函数

## 验证

已执行:

- `npm run build:react`

结果:

- 通过

## 下一步

下一轮建议先完成 Phase 2 的“清残留”工作，再继续拆其它模块：

1. 删除 `App.tsx` 内 big-bank 顶部数据常量副本，统一从 `features/big-bank` 读取。
2. 删除 `App.tsx` 内 big-bank 工具函数副本，统一走 `bank.utils.ts`。
3. 删除 `App.tsx` 内 big-bank 图表与 `BigBankHistoryBack` 副本。
4. 视依赖情况继续提取 `BigBankPriceFrame.tsx`。
5. 再跑一次 `npm run build:react`。

## 备注

- 当前工作树里还有用户自己的并行改动，未做回滚。
- 这轮优先保证“新模块落地 + 可编译”，没有强行一次性清空 `App.tsx` 里的所有 big-bank 旧代码。
