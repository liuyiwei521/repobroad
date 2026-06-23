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
          <div className="tk-title">{bank} 澶氭棩鍘嗗彶</div>
          <div className="mt-0.5 text-xs text-slate-500">
            {tenor || "鍏ㄩ儴鏈熼檺"} 路 {sessionLabel} 路 鎮诞鏌ョ湅鍗曟棩鏄庣粏
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
          杩斿洖
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
            <div className="tk-title">澶ц瀹氫环璧板娍</div>
            <div className="flex flex-wrap justify-end gap-x-3 gap-y-1 text-micro text-slate-400">
              <LegendDot color="#cf6b74" label="鍑虹粰闈為摱浠锋牸(%)" />
              <LegendDot color="#5b8cc9" label="鍑虹粰閾惰浠锋牸(%)" />
              <LegendDot color="#f4dfaa" label="闈為摱-閾惰浠峰樊(BP)" />
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
            <div className="tk-title">澶ц瀹氫环涓庡姞鏉冧环宸?/div>
            <div className="flex flex-wrap justify-end gap-x-3 gap-y-1 text-micro text-slate-400">
              <LegendDot color="#5b8cc9" label="缁欓摱琛屼环宸?BP)" />
              <LegendDot color="#d76370" label="缁欓潪閾朵环宸?BP)" />
            </div>
          </div>
          <BigBankSpreadDiffRechartsPlot data={data} sessionLabel={sessionLabel} />
        </div>
      </div>
    </div>
  );
}
