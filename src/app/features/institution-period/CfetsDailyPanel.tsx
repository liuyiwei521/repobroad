import { useState } from "react";
import type { CfetsTrendBlock } from "../../types";
import {
  cfetsInstData,
  cfetsMatrixColLabels,
  cfetsMatrixRates,
  cfetsMatrixRowLabels,
  fundStructureLegendItems,
} from "./institutionPeriod.data";
import { ChartTooltip, buildLinePath, useChartTooltip } from "./institutionPeriod.shared";
import { fmtAmt, fmtRate } from "./institutionPeriod.utils";
import type { CfetsInstKey } from "./institutionPeriod.types";

function CfetsDailyPanel() {
  return (
    <div className="h-full min-h-0 overflow-hidden">
      <div className="overflow-hidden rounded-lg border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]">
        <table className="min-w-full text-xs">
          <thead className="bg-[var(--tk-color-surface-dark-soft)] text-slate-400">
            <tr>
              {["日期", "公开市场操作", "净投放"].map((column) => (
                <th key={column} className="px-3 py-2 text-left font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ["2026-05-08", "逆回购 7D", "+40亿"],
              ["2026-05-07", "逆回购到期", "-10亿"],
              ["2026-05-06", "逆回购 7D", "+5亿"],
              ["2026-05-05", "逆回购 7D", "+1985亿"],
            ].map((row) => (
              <tr
                key={row[0]}
                className="border-t border-[color:var(--tk-color-border-divider)] text-slate-300"
              >
                {row.map((cell, index) => (
                  <td key={`${row[0]}-${index}`} className="px-3 py-2">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── 矩阵面板 ───────────────────────────────────────────────
function CfetsMatrixPanel({
  includeDaily = false,
}: {
  includeDaily?: boolean;
}) {
  const [modal, setModal] = useState<{
    rowLabel: string;
    colLabel: string;
    rate: number;
  } | null>(null);

  const allRates = cfetsMatrixRates
    .flat()
    .filter((v): v is number => v !== null);
  const minRate = Math.min(...allRates);
  const maxRate = Math.max(...allRates);

  function rateColor(rate: number): string {
    const t = (rate - minRate) / (maxRate - minRate || 1);
    const r = Math.round(26 + t * (180 - 26));
    const g = Math.round(61 + t * (92 - 61));
    const b = Math.round(94 + t * (14 - 94));
    return `rgb(${r},${g},${b})`;
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden p-1">
      <div className="shrink-0 space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="px-2 py-1.5 text-left text-micro font-medium text-slate-500">
                  逆\正
                </th>
                {cfetsMatrixColLabels.map((col) => (
                  <th
                    key={col}
                    className="px-2 py-1.5 text-center text-micro font-medium text-slate-400"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cfetsMatrixRowLabels.map((row, ri) => (
                <tr key={row}>
                  <td className="py-1.5 pr-3 text-mini font-medium text-slate-300">
                    {row}
                  </td>
                  {cfetsMatrixColLabels.map((col, ci) => {
                    const rate = cfetsMatrixRates[ri][ci];
                    return (
                      <td key={col} className="px-1 py-1">
                        {rate === null ? (
                          <div className="flex h-8 w-full items-center justify-center rounded text-micro text-slate-600 bg-[var(--tk-color-surface-dark-deep)]">
                            —
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="flex h-8 w-full cursor-pointer items-center justify-center rounded text-mini font-semibold text-white transition-opacity hover:opacity-80"
                            style={{ backgroundColor: rateColor(rate) }}
                            onClick={() =>
                              setModal({ rowLabel: row, colLabel: col, rate })
                            }
                          >
                            {rate.toFixed(4)}
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-2 text-micro text-slate-500">
          <span>低利率</span>
          <div
            className="h-2 w-24 rounded"
            style={{
              background: `linear-gradient(to right, ${rateColor(minRate)}, ${rateColor(maxRate)})`,
            }}
          />
          <span>高利率</span>
        </div>
      </div>

      {modal && (
        <div
          className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50"
          onClick={() => setModal(null)}
        >
          <div
            className="w-80 rounded-xl border border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-dark-deep)] p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-200">
                  {modal.rowLabel} → {modal.colLabel}
                </div>
                <div className="mt-0.5 text-micro text-slate-500">
                  逆回购方 → 正回购方，加权利率
                </div>
              </div>
              <button
                type="button"
                className="text-slate-500 hover:text-slate-300"
                onClick={() => setModal(null)}
              >
                ✕
              </button>
            </div>
            <div className="mb-3 rounded-lg bg-[var(--tk-color-surface-dark-soft)] px-3 py-2 text-center">
              <span className="text-xl font-semibold text-amber-300">
                {modal.rate.toFixed(4)}%
              </span>
            </div>
            <div className="text-micro text-slate-500">
              正回购方（{modal.colLabel}）期限明细：
            </div>
            <table className="mt-1.5 w-full text-mini">
              <thead>
                <tr className="text-slate-500">
                  <th className="py-1 text-left font-normal">期限</th>
                  <th className="py-1 text-right font-normal">正回购利率</th>
                  <th className="py-1 text-right font-normal">正回购额</th>
                </tr>
              </thead>
              <tbody>
                {(cfetsInstData[modal.colLabel as CfetsInstKey] ?? [])
                  .filter((r) => r.buyRate !== null)
                  .map((r) => (
                    <tr
                      key={r.term}
                      className="border-t border-[color:var(--tk-color-border-divider)] text-slate-300"
                    >
                      <td className="py-1">{r.term}</td>
                      <td className="py-1 text-right">{fmtRate(r.buyRate)}</td>
                      <td className="py-1 text-right">{fmtAmt(r.buyAmt)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {includeDaily && (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="overflow-hidden rounded-lg border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]">
            <table className="min-w-full text-xs">
              <thead className="bg-[var(--tk-color-surface-dark-soft)] text-slate-400">
                <tr>
                  {["日期", "公开市场操作", "净投放"].map((column) => (
                    <th
                      key={column}
                      className="px-3 py-2 text-left font-medium"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["2026-05-08", "逆回购 7D", "+40亿"],
                  ["2026-05-07", "逆回购到期", "-10亿"],
                  ["2026-05-06", "逆回购 7D", "+5亿"],
                  ["2026-05-05", "逆回购 7D", "+1985亿"],
                ].map((row) => (
                  <tr
                    key={row[0]}
                    className="border-t border-[color:var(--tk-color-border-divider)] text-slate-300"
                  >
                    {row.map((cell, index) => (
                      <td key={`${row[0]}-${index}`} className="px-3 py-2">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 通用多系列图表 ──────────────────────────────────────────
const instColors = fundStructureLegendItems.map(
  (i) => i.color,
) as readonly string[];

function MultiSeriesChart({
  block,
  chartType,
  unit = "",
  axisLabel,
  hiddenSeries,
}: {
  block: CfetsTrendBlock;
  chartType: "line" | "stackedBar" | "divergeBar";
  unit?: string;
  axisLabel?: string;
  hiddenSeries?: ReadonlySet<number>;
}) {
  const { dates, series } = block;
  const isHidden = (si: number) => hiddenSeries?.has(si) ?? false;
  const axisCaption = axisLabel ?? (unit ? `单位：${unit}` : "");
  const { tooltipState, containerRef, handleMouseMove, handleMouseLeave } =
    useChartTooltip(dates.length);
  const VW = 480;
  const VH = 100;
  const xStep = Math.max(1, Math.ceil(dates.length / 6));
  const xLabels = dates.filter(
    (_, i) => i % xStep === 0 || i === dates.length - 1,
  );

  if (chartType === "line") {
    const visibleFlat = series
      .filter((_, si) => !isHidden(si))
      .flat()
      .filter((v) => v > 0);
    const rawMin = visibleFlat.length ? Math.min(...visibleFlat) : 0;
    const rawMax = visibleFlat.length ? Math.max(...visibleFlat) : 1;
    const pad = (rawMax - rawMin) * 0.12 || 0.02;
    const min = Math.max(0, rawMin - pad);
    const max = rawMax + pad;
    const yTicks = Array.from({ length: 4 }, (_, i) =>
      Number((max - ((max - min) * i) / 3).toFixed(4)).toString(),
    );
    const crossX =
      tooltipState != null
        ? (tooltipState.index / (dates.length - 1)) * VW
        : null;
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-1">
        <div className="grid min-h-0 flex-1 grid-cols-[2.8rem_1fr]">
          <div className="flex flex-col justify-between py-1 pr-1 text-right text-micro text-slate-500">
            {yTicks.map((t) => (
              <div key={t}>{t}</div>
            ))}
          </div>
          <div
            ref={containerRef}
            className="relative min-h-0 cursor-crosshair overflow-hidden rounded border border-dashed border-[color:var(--tk-color-border-panel)]"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {axisCaption && (
              <div className="pointer-events-none absolute right-1.5 top-0.5 z-10 text-micro text-slate-500">
                {axisCaption}
              </div>
            )}
            <svg
              viewBox={`0 0 ${VW} ${VH}`}
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full"
            >
              {[0, 1, 2, 3].map((gi) => (
                <line
                  key={gi}
                  x1="0"
                  x2={VW}
                  y1={(gi / 3) * VH}
                  y2={(gi / 3) * VH}
                  stroke="#1d3250"
                  strokeWidth="0.5"
                />
              ))}
              {series.map((vals, si) =>
                !isHidden(si) && Math.min(...vals) > 0 ? (
                  <path
                    key={si}
                    d={buildLinePath(vals, VW, VH, min, max)}
                    fill="none"
                    stroke={instColors[si]}
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.9}
                  />
                ) : null,
              )}
              {crossX != null && (
                <line
                  x1={crossX}
                  x2={crossX}
                  y1="0"
                  y2={VH}
                  stroke="#4a7ab5"
                  strokeWidth="0.7"
                  strokeDasharray="3 2"
                />
              )}
            </svg>
            {tooltipState &&
              series.map((vals, si) =>
                !isHidden(si) && Math.min(...vals) > 0 ? (
                  <div
                    key={si}
                    className="pointer-events-none absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[color:var(--tk-color-surface-page)]"
                    style={{
                      left: `${(tooltipState.index / (dates.length - 1)) * 100}%`,
                      top: `${((max - vals[tooltipState.index]) / (max - min)) * 100}%`,
                      backgroundColor: instColors[si],
                    }}
                  />
                ) : null,
              )}
          </div>
        </div>
        <div className="grid grid-cols-[2.8rem_1fr]">
          <div />
          <div className="relative h-6 pt-1">
            {xLabels.map((label) => (
              <span
                key={label}
                className="absolute -translate-x-1/2 text-micro text-slate-600"
                style={{
                  left: `${(dates.indexOf(label) / (dates.length - 1)) * 100}%`,
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
        {tooltipState && (
          <ChartTooltip
            clientX={tooltipState.clientX}
            clientY={tooltipState.clientY}
          >
            <div className="mb-1 text-mini font-semibold text-slate-300">
              {dates[tooltipState.index]}
            </div>
            {series.map((vals, si) =>
              !isHidden(si) && vals[0] > 0 ? (
                <div
                  key={si}
                  className="flex items-center gap-2 py-0.5 text-mini"
                >
                  <span
                    className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: instColors[si] }}
                  />
                  <span className="text-slate-400">
                    {fundStructureLegendItems[si].label}
                  </span>
                  <span className="ml-auto pl-3 font-semibold text-slate-200">
                    {vals[tooltipState.index].toFixed(4)}
                    {unit}
                  </span>
                </div>
              ) : null,
            )}
          </ChartTooltip>
        )}
      </div>
    );
  }

  if (chartType === "stackedBar") {
    const dailyTotals = dates.map((_, di) =>
      series.reduce(
        (s, vals, si) => s + (isHidden(si) ? 0 : (vals[di] ?? 0)),
        0,
      ),
    );
    const maxTotal = Math.max(...dailyTotals, 1);
    const yTicks = Array.from({ length: 3 }, (_, i) =>
      Math.round((maxTotal * (3 - i)) / 3),
    );
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-1">
        <div className="grid min-h-0 flex-1 grid-cols-[2.8rem_1fr]">
          <div className="flex flex-col justify-between py-1 pr-1 text-right text-micro text-slate-500">
            {[...yTicks, 0].map((t) => (
              <div key={t}>{t}</div>
            ))}
          </div>
          <div
            ref={containerRef}
            className="relative min-h-0 cursor-crosshair overflow-hidden rounded border border-dashed border-[color:var(--tk-color-border-panel)]"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {axisCaption && (
              <div className="pointer-events-none absolute right-1.5 top-0.5 z-10 text-micro text-slate-500">
                {axisCaption}
              </div>
            )}
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="absolute inset-x-0 border-t border-dashed border-[color:var(--tk-color-border-divider)]"
                style={{ top: `${(i / 3) * 100}%` }}
              />
            ))}
            <div className="absolute inset-x-1 bottom-4 top-1.5 flex items-end gap-[2px]">
              {dates.map((_, di) => {
                const total = dailyTotals[di];
                return (
                  <div
                    key={di}
                    className="flex min-w-0 flex-1 flex-col justify-end overflow-hidden rounded-t-[2px]"
                    style={{ height: `${(total / maxTotal) * 100}%` }}
                  >
                    {series.map((vals, si) => {
                      if (isHidden(si)) return null;
                      const pct = total > 0 ? (vals[di] / total) * 100 : 0;
                      return pct > 0 ? (
                        <div
                          key={si}
                          style={{
                            height: `${pct}%`,
                            backgroundColor: instColors[si],
                            opacity: 0.85,
                          }}
                        />
                      ) : null;
                    })}
                  </div>
                );
              })}
            </div>
            {tooltipState && (
              <div
                className="pointer-events-none absolute inset-y-0 w-px bg-[var(--tk-color-brand-primary)]"
                style={{
                  left: `${(tooltipState.index / (dates.length - 1)) * 100}%`,
                }}
              />
            )}
          </div>
        </div>
        <div className="grid grid-cols-[2.8rem_1fr]">
          <div />
          <div className="relative h-6 pt-1">
            {xLabels.map((label) => (
              <span
                key={label}
                className="absolute -translate-x-1/2 text-micro text-slate-600"
                style={{
                  left: `${(dates.indexOf(label) / (dates.length - 1)) * 100}%`,
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
        {tooltipState && (
          <ChartTooltip
            clientX={tooltipState.clientX}
            clientY={tooltipState.clientY}
          >
            <div className="mb-1 text-mini font-semibold text-slate-300">
              {dates[tooltipState.index]}
            </div>
            {series.map((vals, si) =>
              !isHidden(si) && vals[tooltipState.index] > 0 ? (
                <div
                  key={si}
                  className="flex items-center gap-2 py-0.5 text-mini"
                >
                  <span
                    className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: instColors[si] }}
                  />
                  <span className="text-slate-400">
                    {fundStructureLegendItems[si].label}
                  </span>
                  <span className="ml-auto pl-3 font-semibold text-slate-200">
                    {vals[tooltipState.index].toFixed(0)}
                    {unit}
                  </span>
                </div>
              ) : null,
            )}
          </ChartTooltip>
        )}
      </div>
    );
  }

  // divergeBar（净融入）—— 仅取 series[0]（全市场合计）
  const netVals = series[0];
  const absMax = Math.max(
    Math.abs(Math.min(...netVals)),
    Math.abs(Math.max(...netVals)),
    1,
  );
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1">
      <div className="grid min-h-0 flex-1 grid-cols-[2.8rem_1fr]">
        <div className="flex flex-col justify-between py-1 pr-1 text-right text-micro text-slate-500">
          {[
            absMax,
            Math.round(absMax / 2),
            0,
            -Math.round(absMax / 2),
            -absMax,
          ].map((t) => (
            <div key={t}>{t > 0 ? `+${t}` : t}</div>
          ))}
        </div>
        <div
          ref={containerRef}
          className="relative min-h-0 cursor-crosshair overflow-hidden rounded border border-dashed border-[color:var(--tk-color-border-panel)]"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {axisCaption && (
            <div className="pointer-events-none absolute right-1.5 top-0.5 z-10 text-micro text-slate-500">
              {axisCaption}
            </div>
          )}
          <div className="absolute inset-x-0 top-1/2 border-t border-[color:var(--tk-color-border-divider)]" />
          <div className="absolute inset-x-1 bottom-4 top-1.5 flex items-center gap-[2px]">
            {netVals.map((val, di) => {
              const isPos = val >= 0;
              const pct = (Math.abs(val) / absMax) * 47;
              return (
                <div
                  key={di}
                  className="flex min-w-0 flex-1 flex-col"
                  style={{ height: "100%" }}
                >
                  {isPos ? (
                    <>
                      <div style={{ flex: 1 }} />
                      <div
                        className="rounded-t-[2px]"
                        style={{
                          height: `${pct}%`,
                          backgroundColor: "#ef5a6f",
                          opacity: 0.85,
                        }}
                      />
                      <div style={{ height: "50%" }} />
                    </>
                  ) : (
                    <>
                      <div style={{ height: "50%" }} />
                      <div
                        className="rounded-b-[2px]"
                        style={{
                          height: `${pct}%`,
                          backgroundColor: "#2fc3de",
                          opacity: 0.85,
                        }}
                      />
                      <div style={{ flex: 1 }} />
                    </>
                  )}
                </div>
              );
            })}
          </div>
          {tooltipState && (
            <div
              className="pointer-events-none absolute inset-y-0 w-px bg-[var(--tk-color-brand-primary)]"
              style={{
                left: `${(tooltipState.index / (dates.length - 1)) * 100}%`,
              }}
            />
          )}
        </div>
      </div>
      <div className="grid grid-cols-[2.8rem_1fr]">
        <div />
        <div className="relative h-6 pt-1">
          {xLabels.map((label) => (
            <span
              key={label}
              className="absolute -translate-x-1/2 text-micro text-slate-600"
              style={{
                left: `${(dates.indexOf(label) / (dates.length - 1)) * 100}%`,
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
      {tooltipState && (
        <ChartTooltip
          clientX={tooltipState.clientX}
          clientY={tooltipState.clientY}
        >
          <div className="mb-1 text-mini font-semibold text-slate-300">
            {dates[tooltipState.index]}
          </div>
          <div className="text-mini text-slate-400">
            净融入{" "}
            <span
              className={`font-semibold ${netVals[tooltipState.index] >= 0 ? "text-red-400" : "text-emerald-400"}`}
            >
              {netVals[tooltipState.index] >= 0 ? "+" : ""}
              {netVals[tooltipState.index].toFixed(0)}
              {unit}
            </span>
          </div>
        </ChartTooltip>
      )}
    </div>
  );
}


export { CfetsDailyPanel, CfetsMatrixPanel, MultiSeriesChart };
