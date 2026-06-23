import { useState } from "react";
import type { CfetsBondMetricKey } from "../../types";
import {
  cfetsBondLabels,
  cfetsBondMetricDefs,
  cfetsBondTrend,
  fundStructureLegendItems,
  fundStructureRangeTabs,
} from "./institutionPeriod.data";
import { MultiSeriesChart } from "./CfetsDailyPanel";
import { LegendDot, auxTabClass } from "./institutionPeriod.shared";
import type { CfetsBondKey, FundStructureRange } from "./institutionPeriod.types";

function CfetsBondPanel() {
  const [bondType, setBondType] = useState<CfetsBondKey>("利率债");
  const [range, setRange] = useState<FundStructureRange>("14d");
  const [metricKey, setMetricKey] = useState<CfetsBondMetricKey>("buyRate");
  const metricDef = cfetsBondMetricDefs.find((d) => d.key === metricKey)!;
  const block = cfetsBondTrend[bondType][metricKey][range];

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      {/* 控件行 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {cfetsBondLabels.map((bt) => (
            <button
              key={bt}
              type="button"
              className={`rounded-md px-2.5 py-1 text-mini transition-colors ${
                bondType === bt
                  ? "bg-[var(--tk-color-surface-selected)] font-semibold text-slate-100"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              onClick={() => setBondType(bt)}
            >
              {bt}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select
            className="rounded border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-soft)] px-2 py-1 text-mini text-slate-200 focus:outline-none"
            value={metricKey}
            onChange={(e) => setMetricKey(e.target.value as CfetsBondMetricKey)}
          >
            {cfetsBondMetricDefs.map((d) => (
              <option key={d.key} value={d.key}>
                {d.label}
              </option>
            ))}
          </select>
          <div className="flex gap-1">
            {fundStructureRangeTabs.map((t) => (
              <button
                key={t.id}
                type="button"
                className={auxTabClass(t.id === range)}
                onClick={() => setRange(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* 图例 */}
      <div className="flex flex-wrap gap-3 text-mini text-slate-400">
        {fundStructureLegendItems.map((item) => (
          <LegendDot key={item.label} color={item.color} label={item.label} />
        ))}
      </div>
      {/* 图表 */}
      <MultiSeriesChart
        block={block}
        chartType={metricDef.chartType}
        unit={metricDef.unit}
        axisLabel={metricDef.axisLabel}
      />
      {/* 说明 */}
      <div className="text-micro text-slate-500">{metricDef.desc}</div>
    </div>
  );
}


export { CfetsBondPanel };
