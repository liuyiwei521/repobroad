import { useMemo, useState } from "react";

import {
  buildChartDomain,
  buildLinearTicks,
  buildSeededWalk,
  XREPO_HISTORY_TABS,
} from "../../dashboardUtils.js";
import {
  buildLinePath,
  ChartHoverLayer,
  ChartTooltip,
  useChartTooltip,
} from "../../components/ui/ChartPrimitives";
import { chartPalette } from "../shell/shell.data";
import type { XrepoHistoryRange } from "../../types";

type ExchangeRepoHistoryRange = XrepoHistoryRange;

const RANGE_TABS = XREPO_HISTORY_TABS as readonly {
  id: ExchangeRepoHistoryRange;
  label: string;
}[];

const EXCHANGE_REPO_SERIES_META: Record<
  string,
  {
    anchor: number;
    volatility: Record<ExchangeRepoHistoryRange, number>;
    seed: number;
  }
> = {
  GC001: {
    anchor: 1.37,
    volatility: { today: 0.006, "5d": 0.028, "1m": 0.018, "6m": 0.012 },
    seed: 1101,
  },
  GC007: {
    anchor: 1.375,
    volatility: { today: 0.006, "5d": 0.026, "1m": 0.017, "6m": 0.011 },
    seed: 1107,
  },
  GC014: {
    anchor: 1.392,
    volatility: { today: 0.0058, "5d": 0.024, "1m": 0.016, "6m": 0.011 },
    seed: 1114,
  },
  GC021: {
    anchor: 1.418,
    volatility: { today: 0.0056, "5d": 0.022, "1m": 0.015, "6m": 0.01 },
    seed: 1121,
  },
  GC028: {
    anchor: 1.446,
    volatility: { today: 0.0054, "5d": 0.02, "1m": 0.014, "6m": 0.01 },
    seed: 1128,
  },
  "R-001": {
    anchor: 1.39,
    volatility: { today: 0.0064, "5d": 0.03, "1m": 0.019, "6m": 0.013 },
    seed: 2101,
  },
  "R-007": {
    anchor: 1.4,
    volatility: { today: 0.0062, "5d": 0.028, "1m": 0.018, "6m": 0.012 },
    seed: 2107,
  },
  "R-014": {
    anchor: 1.423,
    volatility: { today: 0.0059, "5d": 0.025, "1m": 0.017, "6m": 0.011 },
    seed: 2114,
  },
  "R-021": {
    anchor: 1.452,
    volatility: { today: 0.0057, "5d": 0.023, "1m": 0.016, "6m": 0.011 },
    seed: 2121,
  },
  "R-028": {
    anchor: 1.485,
    volatility: { today: 0.0055, "5d": 0.021, "1m": 0.015, "6m": 0.01 },
    seed: 2128,
  },
};

const RANGE_POINT_COUNT: Record<ExchangeRepoHistoryRange, number> = {
  today: 120,
  "5d": 5,
  "1m": 22,
  "6m": 78,
};

const RANGE_END_DATE: Record<Exclude<ExchangeRepoHistoryRange, "today">, string> = {
  "5d": "2026-05-10",
  "1m": "2026-05-10",
  "6m": "2026-05-10",
};

function formatTimeLabel(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function buildTodayLabels(count: number) {
  if (count <= 0) return [];
  if (count === 1) return ["09:30"];

  const totalTradingMinutes = 270;
  return Array.from({ length: count }, (_, index) => {
    const progress = index / Math.max(count - 1, 1);
    const offset = Math.round(progress * totalTradingMinutes);
    if (offset <= 120) {
      return formatTimeLabel(9 * 60 + 30 + offset);
    }
    return formatTimeLabel(13 * 60 + (offset - 120));
  });
}

function buildTradingDateLabels(range: ExchangeRepoHistoryRange) {
  if (range === "today") {
    return buildTodayLabels(RANGE_POINT_COUNT.today);
  }
  const endDate = new Date(RANGE_END_DATE[range]);
  const labels: string[] = [];
  const cursor = new Date(endDate);
  while (labels.length < RANGE_POINT_COUNT[range]) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      labels.unshift(`${cursor.getMonth() + 1}/${String(cursor.getDate()).padStart(2, "0")}`);
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return labels;
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

function miniChipClass(active: boolean) {
  return active
    ? "tk-chip tk-chip-active tk-segmented-tab--compact inline-flex h-6 items-center justify-center whitespace-nowrap text-mini align-middle"
    : "tk-chip tk-segmented-tab--compact inline-flex h-6 items-center justify-center whitespace-nowrap text-mini align-middle";
}

function buildExchangeRepoSeries(
  contractName: string,
  range: ExchangeRepoHistoryRange,
) {
  const meta = EXCHANGE_REPO_SERIES_META[contractName] ?? EXCHANGE_REPO_SERIES_META.GC001;
  const baseSeries = buildSeededWalk(
    meta.anchor,
    RANGE_POINT_COUNT[range],
    meta.volatility[range],
    meta.seed + RANGE_POINT_COUNT[range],
    {
      clampMin: 0,
      precision: 4,
      meanReversion: range === "today" ? 0.06 : range === "6m" ? 0.1 : 0.16,
      anchorBand: range === "today" ? 0.035 : range === "6m" ? 0.14 : 0.08,
    },
  );

  if (range !== "today") {
    return baseSeries;
  }

  return baseSeries.map((value, index) =>
    Number(
      (
        value +
        Math.sin((index + meta.seed) * 0.82) * 0.0022 +
        Math.sin((index + meta.seed) * 0.27) * 0.0015 +
        Math.cos((index + meta.seed) * 0.12) * 0.0011
      ).toFixed(4),
    ),
  );
}

export function ExchangeRepoSingleTrendChart({
  contractName,
}: {
  contractName: string;
}) {
  const [range, setRange] = useState<ExchangeRepoHistoryRange>("today");
  const series = useMemo(() => buildExchangeRepoSeries(contractName, range), [contractName, range]);
  const labels = useMemo(() => buildTradingDateLabels(range), [range]);
  const axisLabels = useMemo(
    () =>
      buildAxisTickLabels(
        labels,
        range === "today" ? 8 : range === "5d" ? 5 : range === "1m" ? 7 : 8,
      ),
    [labels, range],
  );
  const previousSeries = useMemo(
    () => [series[0], ...series.slice(0, -1)],
    [series],
  );
  const deltaValues = useMemo(
    () =>
      series.map((value, index) =>
        Number(((value - previousSeries[index]) * 100).toFixed(1)),
      ),
    [previousSeries, series],
  );

  const { min, max } = buildChartDomain(series, {
    paddingRatio: range === "today" ? 0.08 : 0.12,
    minSpan: range === "today" ? 0.02 : 0.04,
    clampMin: 0,
  });
  const yTicks = buildLinearTicks(min, max, range === "today" ? 6 : 4, 4);
  const width = 720;
  const height = 220;
  const mainPath = buildLinePath(series, width, height, min, max);
  const { tooltipState, containerRef, handleMouseMove, handleMouseLeave } =
    useChartTooltip(series.length);
  const ti = tooltipState?.index ?? null;
  const gridRows = yTicks.length;

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-2 bg-white">
      <div className="flex flex-wrap items-center justify-end gap-1 px-2 pt-1">
        <div className="flex items-center gap-1">
          {RANGE_TABS.map((tab) => (
            <button
              key={tab.id}
              className={miniChipClass(tab.id === range)}
              onClick={() => setRange(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid min-h-0 grid-cols-[3.5rem_minmax(0,1fr)] px-2 pb-2">
        <div className="flex flex-col justify-between pr-2 pt-1 text-right text-micro text-slate-500">
          {yTicks.map((tick) => (
            <div key={tick}>{tick.toFixed(4)}%</div>
          ))}
        </div>
        <div
          ref={containerRef}
          className="relative min-h-0 overflow-hidden rounded border border-[color:var(--tk-color-border-panel)] bg-white"
        >
          {Array.from({ length: gridRows }, (_, index) => (
            <div
              key={`exchange-grid-${index}`}
              className="absolute inset-x-0 border-t border-dashed border-[color:var(--tk-color-border-divider)]"
              style={{ top: `${(index / Math.max(gridRows - 1, 1)) * 100}%` }}
            />
          ))}
          <svg
            className="absolute inset-x-1 bottom-6 top-1 h-[calc(100%-1.75rem)] w-[calc(100%-0.5rem)]"
            preserveAspectRatio="none"
            viewBox={`0 0 ${width} ${height}`}
          >
            <path
              d={mainPath}
              fill="none"
              stroke={chartPalette.blue}
              strokeWidth={range === "today" ? "1.8" : "2.8"}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {ti !== null ? (
              <line
                x1={(ti / Math.max(series.length - 1, 1)) * width}
                x2={(ti / Math.max(series.length - 1, 1)) * width}
                y1={0}
                y2={height}
                stroke="#5ea3ff"
                strokeWidth="1"
                strokeDasharray="4 3"
                strokeOpacity="0.7"
              />
            ) : null}
          </svg>
          <div className="absolute inset-x-0 bottom-0 h-5">
            {axisLabels.map((label, index) =>
              label ? (
                <span
                  key={`${label}-${index}`}
                  className={`absolute top-0 text-micro text-slate-500 ${
                    index === 0
                      ? "translate-x-0"
                      : index === labels.length - 1
                        ? "-translate-x-full"
                        : "-translate-x-1/2"
                  }`}
                  style={{ left: `${(index / Math.max(labels.length - 1, 1)) * 100}%` }}
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
          {tooltipState !== null && ti !== null ? (
            <ChartTooltip clientX={tooltipState.clientX} clientY={tooltipState.clientY}>
              <div className="mb-1 font-semibold text-slate-200">{labels[ti]}</div>
              <div className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: chartPalette.blue }}
                />
                <span className="text-slate-400">{contractName}</span>
                <span className="font-semibold text-slate-100">
                  {series[ti].toFixed(4)}%
                </span>
              </div>
              <div className="mt-1 border-t border-[color:var(--tk-color-border-divider)] pt-1 text-slate-400">
                涨跌{" "}
                <span
                  className={`font-semibold ${
                    deltaValues[ti] >= 0 ? "text-red-400" : "text-emerald-400"
                  }`}
                >
                  {deltaValues[ti] > 0 ? "+" : ""}
                  {deltaValues[ti]}bp
                </span>
              </div>
            </ChartTooltip>
          ) : null}
        </div>
      </div>
    </div>
  );
}
