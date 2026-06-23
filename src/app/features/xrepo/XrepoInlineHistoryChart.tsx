import { useEffect, useState } from "react";
import {
  buildChartDomain,
  buildLinearTicks,
  XREPO_HISTORY_TABS,
} from "../../dashboardUtils.js";
import {
  buildLinePath,
  ChartHoverLayer,
  ChartTooltip,
  LegendDot,
  useChartTooltip,
} from "../../components/ui/ChartPrimitives";
import type { CompareProduct, XrepoHistoryRange } from "../../types";
import { xrepoCompareProductOptions } from "./xrepo.data";
import {
  buildXrepoHistoryComparison,
  xrepoCompareLabel,
  xrepoHistoryPointCount,
} from "./xrepo.utils";

const chartPalette = {
  emerald: "var(--tk-color-success)",
  blue: "var(--tk-color-chart-blue)",
  violet: "var(--tk-color-chart-purple)",
} as const;

function miniChipClass(active: boolean) {
  return active
    ? "tk-chip tk-chip-active tk-segmented-tab--compact inline-flex h-6 items-center justify-center whitespace-nowrap text-mini align-middle"
    : "tk-chip tk-segmented-tab--compact inline-flex h-6 items-center justify-center whitespace-nowrap text-mini align-middle";
}

function buildAxisTickLabels(labels: readonly string[], maxVisible: number) {
  if (labels.length <= maxVisible) {
    return [...labels];
  }

  const visibleIndexes = new Set<number>([0, labels.length - 1]);
  const step = (labels.length - 1) / (maxVisible - 1);
  for (let index = 1; index < maxVisible - 1; index += 1) {
    visibleIndexes.add(Math.round(index * step));
  }

  return labels.map((label, index) => (visibleIndexes.has(index) ? label : ""));
}

export function XrepoInlineHistoryChart({
  contractName,
  compact = false,
}: {
  contractName: string;
  compact?: boolean;
}) {
  const [compareProduct, setCompareProduct] =
    useState<CompareProduct>("dr007");
  const [range, setRange] = useState<XrepoHistoryRange>("today");
  const pointCount = xrepoHistoryPointCount(range, compact);
  const [data, setData] = useState(() =>
    buildXrepoHistoryComparison(contractName, pointCount, compareProduct, range),
  );

  useEffect(() => {
    setData(buildXrepoHistoryComparison(contractName, pointCount, compareProduct, range));
  }, [contractName, pointCount, compareProduct, range]);

  const compareLabel = xrepoCompareLabel(compareProduct);
  const rateValues = data.compare
    ? [...data.current, ...data.compare]
    : data.current;
  const { min: minRate, max: maxRate } = buildChartDomain(rateValues, {
    paddingRatio: 0.12,
    minSpan: 0.08,
    clampMin: 0,
  });
  const maxVolume = Math.max(...data.volume, 1);
  const maxSpread = Math.max(
    ...(data.spread ?? [0]).map((value) => Math.abs(value)),
    1,
  );
  const width = 640;
  const height = 204;
  const { tooltipState, containerRef, handleMouseMove, handleMouseLeave } =
    useChartTooltip(data.labels.length);
  const tooltipIndex = tooltipState?.index ?? null;
  const xAxisLabels = buildAxisTickLabels(data.labels, compact ? 5 : 7);
  const isTodayLineOnly = range === "today";

  return (
    <div
      className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-2 bg-[var(--tk-color-surface-dark-deep)]"
      data-xrepo-history-chart
    >
      <div
        className="flex items-start justify-between gap-2 px-2 pt-1 text-micro"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex min-w-0 flex-wrap items-center gap-2 rounded border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-soft)] px-2 py-1 text-slate-500">
          <LegendDot color={chartPalette.blue} label={contractName} />
          {data.compare ? (
            <LegendDot color={chartPalette.violet} label={compareLabel} />
          ) : null}
          {!isTodayLineOnly ? (
            <LegendDot
              color={data.spread ? chartPalette.emerald : "rgba(94,163,255,0.32)"}
              label={data.spread ? "价差" : "成交量"}
            />
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1 rounded border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-soft)] px-1.5 py-1">
          <label className="flex items-center gap-1 whitespace-nowrap text-slate-400">
            <span>{"对比"}</span>
            <select
              className="h-5 rounded border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-page)] px-1 text-micro text-slate-100 outline-none"
              value={compareProduct}
              onChange={(event) =>
                setCompareProduct(event.target.value as CompareProduct)
              }
            >
              {xrepoCompareProductOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-0.5">
            {XREPO_HISTORY_TABS.map((tab) => (
              <button
                key={tab.id}
                className={miniChipClass(tab.id === range)}
                onClick={() => setRange(tab.id as XrepoHistoryRange)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid h-full min-h-0 grid-cols-[3.4rem_minmax(0,1fr)] px-2">
        <div className="flex flex-col justify-between pb-6 pr-2 pt-2 text-right text-micro text-slate-500">
          <div className="font-medium text-slate-400">{"利率(%)"}</div>
          {buildLinearTicks(minRate, maxRate, 4).map((tick) => (
            <div key={tick}>{tick}</div>
          ))}
        </div>
        <div
          ref={containerRef}
          className="relative min-h-0 cursor-crosshair overflow-hidden rounded border border-dashed border-[color:var(--tk-color-border-panel)]"
        >
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="absolute inset-x-0 border-t border-[color:var(--tk-color-border-divider)] opacity-70"
              style={{ top: `${(index / 3) * 100}%` }}
            />
          ))}
          {!isTodayLineOnly ? (
            data.spread ? (
              <div className="absolute inset-x-1 bottom-6 top-[58%] flex items-stretch gap-[2px]">
                <div className="pointer-events-none absolute left-0 right-0 top-1/2 border-t border-dashed border-[color:var(--tk-color-border-divider)]" />
                {data.spread.map((value, index) => {
                  const barHeight = Math.max(8, (Math.abs(value) / maxSpread) * 92);
                  return (
                    <div
                      key={`${data.labels[index]}-spread`}
                      className="relative min-w-0 flex-1"
                    >
                      <div
                        className={`absolute left-0 right-0 rounded-sm ${
                          value >= 0
                            ? "bg-[rgba(248,113,113,0.72)]"
                            : "bg-[rgba(16,185,129,0.72)]"
                        }`}
                        style={{
                          height: `${barHeight}%`,
                          ...(value >= 0 ? { bottom: "50%" } : { top: "50%" }),
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="absolute inset-x-1 bottom-6 top-1 flex items-end gap-[2px]">
                {data.volume.map((value, index) => (
                  <div
                    key={`${data.labels[index]}-volume`}
                    className="min-w-0 flex-1 rounded-t-[2px] bg-[rgba(94,163,255,0.28)]"
                    style={{ height: `${Math.max(10, (value / maxVolume) * 88)}%` }}
                  />
                ))}
              </div>
            )
          ) : null}
          <svg
            className="absolute inset-x-1 bottom-6 top-1 h-[calc(100%-1.75rem)] w-[calc(100%-0.5rem)]"
            preserveAspectRatio="none"
            viewBox={`0 0 ${width} ${height}`}
          >
            {data.compare ? (
              <path
                d={buildLinePath(data.compare, width, height, minRate, maxRate)}
                fill="none"
                stroke={chartPalette.violet}
                strokeDasharray="6 5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            ) : null}
            <path
              d={buildLinePath(data.current, width, height, minRate, maxRate)}
              fill="none"
              stroke={chartPalette.blue}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.3"
            />
          </svg>
          {tooltipIndex !== null ? (
            <div
              className="pointer-events-none absolute bottom-6 top-1 w-px bg-[var(--tk-color-brand-primary)]"
              style={{
                left: `${(tooltipIndex / (data.labels.length - 1)) * 100}%`,
              }}
            />
          ) : null}
          <div className="absolute inset-x-0 bottom-0 h-5">
            {xAxisLabels.map((label, index) =>
              label ? (
                <span
                  key={`${label}-${index}`}
                  className={`absolute top-0 text-micro text-slate-500 ${
                    index === 0
                      ? "translate-x-0"
                      : index === data.labels.length - 1
                        ? "-translate-x-full"
                        : "-translate-x-1/2"
                  }`}
                  style={{ left: `${(index / (data.labels.length - 1)) * 100}%` }}
                >
                  {label}
                </span>
              ) : null,
            )}
          </div>
          <ChartHoverLayer
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
          />
          {tooltipState && tooltipIndex !== null ? (
            <ChartTooltip
              clientX={tooltipState.clientX}
              clientY={tooltipState.clientY}
            >
              <div className="mb-1 font-semibold text-slate-200">
                {data.labels[tooltipIndex]}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: chartPalette.blue }}
                />
                <span className="text-slate-400">{"当前"}</span>
                <span className="font-semibold text-slate-100">
                  {data.current[tooltipIndex].toFixed(4)}%
                </span>
              </div>
              {data.compare ? (
                <div className="flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: chartPalette.violet }}
                  />
                  <span className="text-slate-400">{compareLabel}</span>
                  <span className="font-semibold text-slate-100">
                    {data.compare[tooltipIndex].toFixed(4)}%
                  </span>
                </div>
              ) : null}
              {!isTodayLineOnly ? (
                data.spread ? (
                  <div className="text-slate-400">
                    {"价差 "}
                    <span className="font-semibold text-slate-100">
                      {data.spread[tooltipIndex]}bp
                    </span>
                  </div>
                ) : (
                  <div className="text-slate-400">
                    {"成交量 "}
                    <span className="font-semibold text-slate-100">
                      {data.volume[tooltipIndex]}亿
                    </span>
                  </div>
                )
              ) : null}
            </ChartTooltip>
          ) : null}
        </div>
      </div>
      <div className="flex items-center justify-between px-2 pb-1 text-micro text-slate-500">
        <span>{"点击返回 XRepo 表格"}</span>
        <span>
          {range === "today"
            ? "当日"
            : range === "5d"
              ? "近5日"
              : range === "1m"
                ? "近1M"
                : "近半年"}{" "}
          / {compareLabel}
        </span>
      </div>
    </div>
  );
}
