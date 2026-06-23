import {
  buildAreaPath,
  buildLinePath,
  ChartTooltip,
  LegendDot,
  useChartTooltip,
} from "../../components/ui/ChartPrimitives";
import { chartPalette } from "../shell/shell.data";
import type {
  BaseTrendProduct,
  CompareProduct,
  HistoryRange,
  OverlayProduct,
} from "../../types";
import {
  baseTrendProductOptions,
  compareProductOptions,
  historicalCloseDatasets,
  historyRangeTabs,
} from "./intraday.data";
import {
  buildAxisLabels,
  buildAxisTickLabels,
  buildCompactVolumeTicks,
  buildHistoricalSeries,
  overlayProductLabel,
  trendProductLabel,
} from "./intraday.utils";

function auxTabClass(active: boolean) {
  return active ? "tk-chip tk-chip-active tk-segmented-tab" : "tk-chip tk-segmented-tab";
}

export function HistoryClosePanel({
  activeRange,
  baseProduct,
  overlayProduct,
  compareProduct,
  onRangeChange,
  onBaseProductChange,
  onCompareChange,
}: {
  activeRange: HistoryRange;
  baseProduct: BaseTrendProduct;
  overlayProduct: OverlayProduct;
  compareProduct: CompareProduct;
  onRangeChange: (range: HistoryRange) => void;
  onBaseProductChange: (product: BaseTrendProduct) => void;
  onCompareChange: (product: CompareProduct) => void;
}) {
  const dataset = historicalCloseDatasets[activeRange];
  const productLabel = trendProductLabel(baseProduct);
  const baseRateSeries =
    baseProduct === "r001"
      ? dataset.close
      : buildHistoricalSeries(activeRange, "r007");
  const baseVolumeSeries =
    baseProduct === "r001"
      ? dataset.volume
      : dataset.volume.map((value, index) =>
          Math.round(value * (0.84 + ((index % 4) * 0.045))),
        );
  const mainSeries = baseRateSeries;
  const axisLabels = buildAxisTickLabels(
    dataset.labels,
    activeRange === "5d" ? 5 : activeRange === "1m" ? 7 : 8,
  );
  const overlaySeries =
    overlayProduct === "none"
      ? null
      : buildHistoricalSeries(activeRange, overlayProduct);
  const compareSeries =
    compareProduct === "none"
      ? null
      : buildHistoricalSeries(activeRange, compareProduct);
  const spreadValues = compareSeries
    ? baseRateSeries.map((value, index) =>
        Number(((value - compareSeries[index]) * 100).toFixed(1)),
      )
    : null;
  const pad = 0.015;
  const min =
    Math.min(...mainSeries, ...(overlaySeries ?? []), ...(compareSeries ?? [])) - pad;
  const max =
    Math.max(...mainSeries, ...(overlaySeries ?? []), ...(compareSeries ?? [])) + pad;
  const volumeMax = Math.max(...baseVolumeSeries);
  const mainPath = buildLinePath(mainSeries, 720, 186, min, max);
  const areaPath = buildAreaPath(mainSeries, 720, 186, min, max);
  const overlayPath = overlaySeries
    ? buildLinePath(overlaySeries, 720, 186, min, max)
    : null;
  const compareLinePath = compareSeries
    ? buildLinePath(compareSeries, 720, 186, min, max)
    : null;
  const { tooltipState, containerRef, handleMouseMove, handleMouseLeave } =
    useChartTooltip(dataset.close.length);
  const ti = tooltipState?.index ?? null;

  return (
    <section className="grid h-full min-h-0 grid-rows-[auto_1fr] overflow-hidden rounded-xl border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-soft)] px-3 py-2">
        <div className="tk-matrix-card-title shrink-0 whitespace-nowrap">
          鍘嗗彶鎴愪氦瓒嬪娍
        </div>
        <label className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs text-slate-400">
          <span>浜у搧</span>
          <select
            className="rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-page)] px-1.5 py-0.5 text-xs text-slate-200 outline-none"
            value={baseProduct}
            onChange={(event) =>
              onBaseProductChange(event.target.value as BaseTrendProduct)
            }
          >
            {baseTrendProductOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs text-slate-400">
          <span>瀵规瘮</span>
          <select
            className="rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-page)] px-1.5 py-0.5 text-xs text-slate-200 outline-none"
            value={compareProduct}
            onChange={(event) =>
              onCompareChange(event.target.value as CompareProduct)
            }
          >
            {compareProductOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex shrink-0 items-center gap-2">
          {historyRangeTabs.map((tab) => (
            <button
              key={tab.id}
              className={auxTabClass(tab.id === activeRange)}
              onClick={() => onRangeChange(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div
        className="grid min-h-0 px-3 pb-2 pt-2"
        style={{ gridTemplateRows: "minmax(0,68fr) minmax(0,24fr) 1.35rem" }}
      >
        <div className="grid min-h-0 grid-cols-[3.25rem_1fr]">
          <div className="flex flex-col justify-between pr-2 text-right text-micro text-slate-400">
            {buildAxisLabels(min, max, 4).map((label) => (
              <div key={label}>{label}</div>
            ))}
          </div>
          <div
            ref={containerRef}
            className="relative min-h-0"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {[0, 1, 2, 3].map((index) => (
              <div
                key={`k-grid-${index}`}
                className="absolute inset-x-0 border-t border-dashed border-[color:var(--tk-color-border-divider)]"
                style={{ top: `${(index / 3) * 100}%` }}
              />
            ))}
            <svg
              className="absolute inset-0 h-full w-full"
              preserveAspectRatio="none"
              viewBox="0 0 720 186"
            >
              <defs>
                <linearGradient id="history-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5ea3ff" stopOpacity="0.24" />
                  <stop offset="100%" stopColor="#5ea3ff" stopOpacity="0.04" />
                </linearGradient>
              </defs>
              <path d={areaPath} fill="url(#history-fill)" />
              <path
                d={mainPath}
                fill="none"
                stroke={chartPalette.blue}
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {overlayPath ? (
                <path
                  d={overlayPath}
                  fill="none"
                  stroke={chartPalette.amber}
                  strokeWidth="2"
                  strokeDasharray="5 4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}
              {compareLinePath ? (
                <path
                  d={compareLinePath}
                  fill="none"
                  stroke={chartPalette.violet}
                  strokeWidth="2"
                  strokeDasharray="3 3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}
              {ti !== null ? (
                <line
                  x1={(ti / (mainSeries.length - 1)) * 720}
                  x2={(ti / (mainSeries.length - 1)) * 720}
                  y1={0}
                  y2={186}
                  stroke="#5ea3ff"
                  strokeWidth="1"
                  strokeDasharray="4 3"
                  strokeOpacity="0.6"
                />
              ) : null}
            </svg>
            <div className="absolute right-2 top-1 flex flex-wrap items-center gap-3 text-micro text-slate-300">
              <LegendDot
                color={chartPalette.blue}
                label={`${productLabel} 鍔犳潈鍒╃巼`}
              />
              {overlaySeries ? (
                <LegendDot
                  color={chartPalette.amber}
                  label={overlayProductLabel(overlayProduct)}
                />
              ) : null}
              {compareSeries ? (
                <LegendDot
                  color={chartPalette.violet}
                  label={
                    compareProductOptions.find((option) => option.id === compareProduct)
                      ?.label ?? ""
                  }
                />
              ) : null}
            </div>
            {tooltipState !== null && ti !== null ? (
              <ChartTooltip
                clientX={tooltipState.clientX}
                clientY={tooltipState.clientY}
              >
                <div className="mb-1 font-medium text-slate-400">
                  {dataset.labels[ti]}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: chartPalette.blue }}
                  />
                  <span className="text-slate-400">{productLabel}</span>
                  <span className="ml-1 font-semibold text-slate-100">
                    {mainSeries[ti].toFixed(4)}%
                  </span>
                </div>
                {overlaySeries ? (
                  <div className="flex items-center gap-2">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: chartPalette.amber }}
                    />
                    <span className="text-slate-400">
                      {overlayProductLabel(overlayProduct)}
                    </span>
                    <span className="ml-1 font-semibold text-slate-100">
                      {overlaySeries[ti].toFixed(4)}%
                    </span>
                  </div>
                ) : null}
                {compareSeries ? (
                  <div className="flex items-center gap-2">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: chartPalette.violet }}
                    />
                    <span className="text-slate-400">
                      {compareProductOptions.find((option) => option.id === compareProduct)
                        ?.label ?? ""}
                    </span>
                    <span className="ml-1 font-semibold text-slate-100">
                      {compareSeries[ti].toFixed(4)}%
                    </span>
                  </div>
                ) : null}
                {spreadValues ? (
                  <div className="mt-1 border-t border-[color:var(--tk-color-border-divider)] pt-1 text-slate-400">
                    鍒╁樊{" "}
                    <span
                      className={`font-semibold ${
                        spreadValues[ti] >= 0 ? "text-red-400" : "text-emerald-400"
                      }`}
                    >
                      {spreadValues[ti] > 0 ? "+" : ""}
                      {spreadValues[ti]}bp
                    </span>
                  </div>
                ) : null}
                <div className="mt-1 border-t border-[color:var(--tk-color-border-divider)] pt-1 text-slate-400">
                  鎴愪氦閲弡{" "}
                  <span className="font-semibold text-slate-100">
                    {baseVolumeSeries[ti]}浜?
                  </span>
                </div>
              </ChartTooltip>
            ) : null}
          </div>
        </div>
        {compareProduct !== "none" && spreadValues ? (
          <div className="grid min-h-0 grid-cols-[3.25rem_1fr] border-t border-[color:var(--tk-color-border-divider)] pb-1 pt-2">
            <div className="flex flex-col justify-between pr-2 text-right text-micro text-slate-400">
              {(() => {
                const dMax = Math.max(...spreadValues, 0);
                const dMin = Math.min(...spreadValues, 0);
                const pad = (dMax - dMin) * 0.15 || 1;
                const rTop = dMax + pad;
                const rBot = dMin - pad;
                const range = rTop - rBot;
                return Array.from({ length: 5 }, (_, index) => {
                  const value = rTop - (range * index) / 4;
                  return <div key={index}>{value.toFixed(1)}</div>;
                });
              })()}
            </div>
            <div className="relative min-h-0">
              <div className="absolute inset-0 flex items-center gap-[4px]">
                {(() => {
                  const dMax = Math.max(...spreadValues, 0);
                  const dMin = Math.min(...spreadValues, 0);
                  const pad = (dMax - dMin) * 0.15 || 1;
                  const rTop = dMax + pad;
                  const rBot = dMin - pad;
                  const range = rTop - rBot;
                  return spreadValues.map((value, index) => {
                    const isPositive = value >= 0;
                    const spaceTop = isPositive
                      ? ((rTop - value) / range) * 100
                      : (rTop / range) * 100;
                    const barHeight = (Math.abs(value) / range) * 100;
                    const spaceBottom = isPositive
                      ? (-rBot / range) * 100
                      : ((value - rBot) / range) * 100;
                    return (
                      <div
                        key={`spread-${index}`}
                        className="flex min-w-0 flex-1 flex-col"
                        style={{ height: "100%" }}
                      >
                        <div style={{ height: `${spaceTop}%` }} />
                        <div
                          className="min-h-0 rounded-[2px]"
                          style={{
                            height: `${barHeight}%`,
                            backgroundColor: isPositive ? "#ef5a6f" : "#2fc3de",
                            opacity: 0.92,
                          }}
                        />
                        <div style={{ height: `${spaceBottom}%` }} />
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid min-h-0 grid-cols-[3.25rem_1fr] border-t border-[color:var(--tk-color-border-divider)] pb-1 pt-2">
            <div className="flex flex-col justify-between pr-2 text-right text-micro text-slate-400">
              {buildCompactVolumeTicks(volumeMax).map((tick) => (
                <div key={tick}>{tick}</div>
              ))}
            </div>
            <div className="relative min-h-0">
              <span className="pointer-events-none absolute left-0.5 top-0.5 z-10 text-micro text-slate-500">
                鎴愪氦閲?
              </span>
              <div className="absolute inset-0 flex items-end gap-[4px]">
                {baseVolumeSeries.map((value, index) => (
                  <div
                    key={`history-vol-${index}`}
                    className="min-w-0 flex-1 rounded-t-[2px]"
                    style={{
                      height: `${(value / volumeMax) * 100}%`,
                      backgroundColor: index % 3 === 0 ? "#2fc3de" : "#2f6fd0",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-[3.25rem_1fr] pt-2">
          <div />
          <div
            className="grid text-micro text-slate-400"
            style={{
              gridTemplateColumns: `repeat(${dataset.labels.length}, minmax(0, 1fr))`,
            }}
          >
            {axisLabels.map((label, index) => (
              <div
                key={`${dataset.labels[index]}-${index}`}
                className="text-center"
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
