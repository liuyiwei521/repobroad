import { LegendDot } from "../../components/ui/ChartPrimitives";
import type { BankRateRow } from "../../types";
import {
  BigBankPricingTrendChart,
  BigBankSpreadDiffRechartsPlot,
} from "./BigBankCharts";
import { bankHistorySessionLabel, buildAnchoredBankHistorySeries } from "./bank.utils";

export function BigBankHistoryBack({
  bank,
  tenor,
  rows,
  compact = false,
  onBack,
}: {
  bank: string;
  tenor?: string;
  rows: readonly BankRateRow[];
  compact?: boolean;
  onBack: () => void;
}) {
  const data = buildAnchoredBankHistorySeries(bank, rows, tenor);
  const sessionLabel = bankHistorySessionLabel(tenor);

  return (
    <div
      className={`grid h-full min-h-0 grid-rows-[auto_1fr] overflow-hidden ${
        compact ? "gap-1.5 p-2" : "gap-2 p-3"
      }`}
      onClick={onBack}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="tk-title">{bank} 多日历史</div>
          <div className="mt-0.5 text-xs text-slate-500">
            {tenor || "全部期限"} · {sessionLabel} · 悬浮查看单日明细
          </div>
        </div>
        <button
          className={`tk-button ${compact ? "text-micro" : ""}`}
          onClick={(event) => {
            event.stopPropagation();
            onBack();
          }}
          type="button"
        >
          返回
        </button>
      </div>
      <div
        className={`grid min-h-0 flex-1 grid-rows-[minmax(0,1.08fr)_minmax(0,0.92fr)] ${
          compact ? "gap-1.5" : "gap-3"
        }`}
      >
        <div
          className="grid min-h-0 grid-rows-[auto_1fr] overflow-hidden rounded border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] p-3"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="tk-title">大行定价走势</div>
            <div className="flex flex-wrap justify-end gap-x-3 gap-y-1 text-micro text-slate-400">
              <LegendDot color="#cf6b74" label="出给非银价格(%)" />
              <LegendDot color="#5b8cc9" label="出给银行价格(%)" />
              <LegendDot color="#f4dfaa" label="非银-银行价差(BP)" />
            </div>
          </div>
          <BigBankPricingTrendChart
            bank={bank}
            tenor={tenor}
            rows={rows}
            className="h-full border-0 bg-transparent p-0"
            compact={compact}
          />
        </div>
        <div
          className="grid min-h-0 grid-rows-[auto_1fr] overflow-hidden rounded border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] p-3"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="tk-title">大行定价与加权价差</div>
            <div className="flex flex-wrap justify-end gap-x-3 gap-y-1 text-micro text-slate-400">
              <LegendDot color="#5b8cc9" label="给银行价差(BP)" />
              <LegendDot color="#d76370" label="给非银价差(BP)" />
            </div>
          </div>
          <BigBankSpreadDiffRechartsPlot data={data} sessionLabel={sessionLabel} />
        </div>
      </div>
    </div>
  );
}
