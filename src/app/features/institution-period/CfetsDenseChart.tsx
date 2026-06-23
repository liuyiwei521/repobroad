import { useState, type MouseEvent as ReactMouseEvent } from "react";
import { ChartHoverLayer, ChartTooltip, buildLinePath, useChartTooltip } from "./institutionPeriod.shared";
import { cfetsMetricIsRate, cfetsMetricUnit, formatCfetsAxisTick, formatCfetsDenseValue } from "./institutionPeriod.utils";
import type { CfetsChartKind, CfetsDenseDetail, CfetsDenseSeriesData, CfetsInstMetricMode } from "./institutionPeriod.types";

function CfetsDenseChart({
  chartKind,
  data,
  metricMode,
  title,
  onDetail,
}: {
  chartKind: CfetsChartKind;
  data: CfetsDenseSeriesData;
  metricMode: CfetsInstMetricMode;
  title: string;
  onDetail: (detail: CfetsDenseDetail) => void;
}) {
  const [hiddenKeys, setHiddenKeys] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );
  const visibleSeries = data.series.filter((series) => !hiddenKeys.has(series.key));
  const isRate = cfetsMetricIsRate(metricMode);
  const unit = cfetsMetricUnit(metricMode);
  const allValues = visibleSeries.flatMap((series) => series.values);
  const maxValue = Math.max(...allValues, 1);
  const minValue = chartKind === "line" && isRate ? Math.min(...allValues, 0) : 0;
  const yMax = maxValue * 1.12;
  const yMin = isRate ? Math.max(0, minValue - (yMax - minValue) * 0.08) : 0;
  const width = 1600;
  const height = 430;
  const xTickStep = Math.max(1, Math.floor(data.dates.length / 16));
  const yTicks = Array.from({ length: 6 }, (_, index) =>
    yMax - ((yMax - yMin) * index) / 5,
  );
  const {
    tooltipState,
    containerRef,
    getIndexFromEvent,
    handleMouseMove,
    handleMouseLeave,
  } =
    useChartTooltip(data.dates.length);
  const tooltipIndex = tooltipState?.index ?? null;

  function toggleLegend(key: string) {
    setHiddenKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function openDetailAtIndex(dateIndex: number) {
    const date = data.dates[dateIndex];
    if (!date) return;
    const total = dailyTotals[dateIndex] || 0;
    const leader =
      visibleSeries
        .slice()
        .sort(
          (a, b) =>
            (b.values[dateIndex] ?? 0) - (a.values[dateIndex] ?? 0),
        )[0] ?? visibleSeries[0];
    onDetail({
      date,
      label: leader?.label ?? "-",
      value: total,
    });
  }

  function handleChartClick(event: ReactMouseEvent<HTMLDivElement>) {
    if (chartKind !== "bar") return;
    const dateIndex = getIndexFromEvent(event);
    if (dateIndex === null) return;
    openDetailAtIndex(dateIndex);
  }

  const dailyTotals = data.dates.map((_, index) =>
    visibleSeries.reduce((sum, series) => sum + (series.values[index] ?? 0), 0),
  );
  const maxTotal = Math.max(...dailyTotals, 1);
  const tooltipRows =
    tooltipIndex === null
      ? []
      : visibleSeries
          .map((series) => ({
            ...series,
            value: series.values[tooltipIndex] ?? 0,
          }))
          .filter((series) => series.value > 0)
          .sort((a, b) => b.value - a.value);

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_auto_minmax(0,1fr)_auto] overflow-hidden rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]">
      <div className="flex items-center justify-between gap-3 px-4 pb-1 pt-4">
        <div className="min-w-0 flex-1 text-center text-xl font-semibold text-slate-100">
          {title}
        </div>
        <button
          className="tk-button tk-icon-button"
          type="button"
          title="导出"
        >
          ⤓
        </button>
      </div>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 px-4 pb-2 text-sm">
        {data.series.map((series) => {
          const hidden = hiddenKeys.has(series.key);
          return (
            <button
              key={series.key}
              className={`inline-flex items-center gap-1.5 rounded px-1 transition-opacity ${
                hidden ? "opacity-35" : "opacity-100"
              }`}
              type="button"
              onClick={() => toggleLegend(series.key)}
            >
              <span
                className="h-3 w-6 rounded-sm"
                style={{ backgroundColor: series.color }}
              />
              <span className="text-slate-300">{series.label}</span>
            </button>
          );
        })}
      </div>
      <div className="grid min-h-0 grid-cols-[4.8rem_1fr] px-3 pb-1">
        <div className="flex flex-col justify-between pb-7 pt-1 text-right text-mini text-slate-500">
          {yTicks.map((tick) => (
            <div key={tick}>{formatCfetsAxisTick(tick, metricMode)}</div>
          ))}
          <div>{formatCfetsAxisTick(0, metricMode)}</div>
        </div>
        <div
          ref={containerRef}
          className="relative min-h-0 cursor-crosshair overflow-hidden"
        >
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <div
              key={index}
              className="absolute inset-x-0 border-t border-[color:var(--tk-color-border-divider)] opacity-70"
              style={{ top: `${(index / 5) * 100}%` }}
            />
          ))}
          {chartKind === "bar" ? (
            <div className="absolute inset-x-1 bottom-7 top-1 flex items-end gap-[1px]">
              {data.dates.map((date, dateIndex) => {
                const total = dailyTotals[dateIndex] || 0;
                return (
                  <button
                    key={date}
                    className="flex h-full min-w-0 flex-1 cursor-pointer flex-col justify-end overflow-hidden"
                    style={{ height: `${(total / maxTotal) * 100}%` }}
                    type="button"
                    onClick={() => openDetailAtIndex(dateIndex)}
                  >
                    {visibleSeries.map((series) => {
                      const value = series.values[dateIndex] ?? 0;
                      const pct = total > 0 ? (value / total) * 100 : 0;
                      return pct > 0 ? (
                        <span
                          key={series.key}
                          style={{
                            height: `${pct}%`,
                            backgroundColor: series.color,
                            opacity: tooltipIndex === null || tooltipIndex === dateIndex ? 0.92 : 0.5,
                          }}
                        />
                      ) : null;
                    })}
                  </button>
                );
              })}
            </div>
          ) : (
            <svg
              className="absolute inset-x-1 bottom-7 top-1 h-[calc(100%-2rem)] w-[calc(100%-0.5rem)]"
              preserveAspectRatio="none"
              viewBox={`0 0 ${width} ${height}`}
            >
              {visibleSeries.map((series) => (
                <path
                  key={series.key}
                  d={buildLinePath(series.values, width, height, yMin, yMax)}
                  fill="none"
                  stroke={series.color}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              ))}
            </svg>
          )}
          {tooltipIndex !== null ? (
            <div
              className="pointer-events-none absolute bottom-7 top-1 w-px bg-[var(--tk-color-brand-primary)]"
              style={{ left: `${(tooltipIndex / (data.dates.length - 1)) * 100}%` }}
            />
          ) : null}
          <div className="absolute inset-x-0 bottom-0 h-6">
            {data.dates.map((date, index) =>
              index % xTickStep === 0 || index === data.dates.length - 1 ? (
                <span
                  key={date}
                  className="absolute top-1 -translate-x-1/2 whitespace-nowrap text-micro text-slate-500"
                  style={{ left: `${(index / (data.dates.length - 1)) * 100}%` }}
                >
                  {date}
                </span>
              ) : null,
            )}
          </div>
          <ChartHoverLayer
            onClick={handleChartClick}
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
          />
          {tooltipIndex !== null && tooltipState ? (
            <ChartTooltip
              clientX={tooltipState.clientX}
              clientY={tooltipState.clientY}
            >
              <div className="mb-1 font-semibold text-slate-200">
                {data.dates[tooltipIndex]}
              </div>
              {chartKind === "bar" ? (
                <div className="mb-1 flex items-center justify-between gap-6 border-b border-[color:var(--tk-color-border-divider-dark)] pb-1 text-mini">
                  <span className="text-slate-400">合计</span>
                  <span className="font-mono font-semibold text-slate-100">
                    {formatCfetsDenseValue(dailyTotals[tooltipIndex] ?? 0, metricMode)}
                  </span>
                </div>
              ) : null}
              {tooltipRows.slice(0, 12).map((series) => (
                <div key={series.key} className="flex items-center gap-2 py-0.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: series.color }}
                  />
                  <span className="text-slate-400">{series.label}</span>
                  <span className="ml-auto pl-4 font-mono font-semibold text-slate-100">
                    {formatCfetsDenseValue(series.value, metricMode)}
                  </span>
                </div>
              ))}
              {tooltipRows.length > 12 ? (
                <div className="mt-1 text-slate-500">其余 {tooltipRows.length - 12} 项略</div>
              ) : null}
            </ChartTooltip>
          ) : null}
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-[color:var(--tk-color-border-divider)] px-4 py-2 text-mini text-slate-500">
        <span>单位：{unit}</span>
        <span>图例点击可筛选；点击非图例柱体展开明细</span>
      </div>
    </div>
  );
}

// ─── 债券面板 ───────────────────────────────────────────────

export { CfetsDenseChart };
