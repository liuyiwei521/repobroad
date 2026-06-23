import { useState } from "react";
import type { CfetsInstPeriod, CfetsMetricKey } from "../../types";
import { PageFrame as ShellPageFrame } from "../../components/shell/PageFrame";
import { CfetsInstPanel } from "./CfetsInstPanel";
import {
  cfetsInstPeriodLabels,
  cfetsInstTrend,
  cfetsMetricDefs,
  fundStructureLegendItems,
} from "./institutionPeriod.data";
import { MiniInstitutionSeriesPreview } from "./institutionPeriod.shared";

function InstitutionPeriodMatrixCard() {
  const [period, setPeriod] = useState<CfetsInstPeriod>("R001");
  const [metricKey, setMetricKey] = useState<CfetsMetricKey>("buyAmt");
  const [open, setOpen] = useState(false);
  const metric = cfetsMetricDefs.find((item) => item.key === metricKey);
  const previewBlock = cfetsInstTrend[period]?.[metricKey]?.["14d"];
  const previewSeries = fundStructureLegendItems.map((item, index) => ({
    key: item.label,
    label: item.label,
    color: item.color,
    values: previewBlock?.series?.[index] ?? [],
  }));

  return (
    <>
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]">
        <div className="flex flex-wrap items-center gap-2 border-b border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-dark-soft)] px-3 py-2 text-xs">
          <label className="flex items-center gap-1.5 text-slate-400">
            期限
            <select
              className="tk-field h-6 rounded px-2 text-mini text-slate-100 outline-none"
              value={period}
              onChange={(event) => setPeriod(event.target.value as CfetsInstPeriod)}
            >
              {cfetsInstPeriodLabels.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-0 flex-1 items-center gap-1.5 text-slate-400">
            指标
            <select
              className="tk-field h-6 min-w-0 rounded px-2 text-mini text-slate-100 outline-none"
              value={metricKey}
              onChange={(event) => setMetricKey(event.target.value as CfetsMetricKey)}
            >
              {cfetsMetricDefs.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <button
            className="tk-button ml-auto text-micro"
            onClick={() => setOpen(true)}
            type="button"
          >
            打开大图
          </button>
        </div>
        <div className="min-h-0 p-3">
          <MiniInstitutionSeriesPreview
            label={`${period} ${metric?.label ?? ""}`}
            series={previewSeries}
            xLabels={previewBlock?.dates}
            chartType={metric?.chartType ?? "line"}
            unit={metric?.unit ?? ""}
            footnote="图例可点击筛选 · 点击打开完整大图"
          />
        </div>
      </div>
      {open ? (
        <ShellPageFrame title="机构分期限统计大图" onClose={() => setOpen(false)}>
          <div className="tk-panel h-full min-h-0 border p-3">
            <CfetsInstPanel initialPeriod={period} initialMetric={metricKey} />
          </div>
        </ShellPageFrame>
      ) : null}
    </>
  );
}


export { InstitutionPeriodMatrixCard };
