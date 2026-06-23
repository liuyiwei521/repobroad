import { topBoardFilters } from "./quoteBoard.data";

export function QuoteBoardGlobalFilterFrame() {
  return (
    <div className="tk-panel grid h-full min-h-0 place-items-center border">
      <div className="tk-panel-soft w-[520px] rounded border border-[color:var(--tk-color-border-panel)] p-5">
        <div className="tk-title">金额 / 利率筛选</div>
        <div className="mt-4 grid gap-3 text-sm">
          <div className="flex items-center justify-between border-b border-[color:var(--tk-color-border-divider-dark)] pb-3">
            <span className="text-slate-500">金额区间</span>
            <span className="font-mono text-slate-200">
              {topBoardFilters.amountMin} - {topBoardFilters.amountMax} 亿
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">利率区间</span>
            <span className="font-mono text-slate-200">
              {topBoardFilters.rateMin} - {topBoardFilters.rateMax} %
            </span>
          </div>
        </div>
        <div className="mt-4 text-xs text-slate-500">
          筛选入口已迁入页框，编辑能力后续接入。
        </div>
      </div>
    </div>
  );
}
