import { useEffect, useState, type ReactNode } from "react";
import { BadgePercent } from "lucide-react";
import {
  ChartTooltip,
  LegendDot,
  buildAreaPath,
  buildLinePath,
  useChartTooltip,
} from "../../components/ui/ChartPrimitives";
import { StructuredTable } from "../../components/ui/StructuredTable";
import { chartPalette, moduleEntries } from "../shell/shell.data";
import type {
  FrameOpenOptions,
  ModuleEntryId,
  QuoteTenorFilter,
} from "../../types";
import type { NcdPeriod, NcdPrimaryGroup, NcdTrendRange } from "./ncd.types";
import {
  NCD_PERIOD_OFFSET,
  NCD_TREND_COUNTS,
  auxChartLabels,
  compactAuxChartLabels,
  createNcdTrendDates,
  ncdAllPeriodsData,
  ncdColHeaders,
  ncdOneYearSeries,
  ncdPrimary1MGroups,
  ncdPrimaryAAABase6m,
  ncdPrimaryAABase6m,
  ncdPrimaryAAPlsBase6m,
  ncdPrimaryGovBase6m,
  ncdPrimaryPeriods,
  ncdSecondaryAA6m,
  ncdSecondaryAAA6m,
  ncdSecondaryAAPlus6m,
  ncdSecondaryGov6m,
  ncdTableRows,
  ncdThreeMonthSeries,
  ncdTrendRangeTabs,
  ncdTrendSeries,
} from "./ncd.data";
import { quoteTenorToNcdPeriod, shiftSeries } from "./ncd.utils";

function auxTabClass(active: boolean) {
  return active
    ? "tk-chip tk-chip-active tk-segmented-tab"
    : "tk-chip tk-segmented-tab";
}

function resolveEntryTitle(id: ModuleEntryId) {
  return moduleEntries.find((entry) => entry.id === id)?.title ?? "NCD";
}

function resolveEntryIcon(id: ModuleEntryId) {
  return moduleEntries.find((entry) => entry.id === id)?.icon ?? BadgePercent;
}

function NcdPreviewHeader({
  id,
  badge,
  onOpen,
  actions,
}: {
  id: ModuleEntryId;
  badge: string;
  onOpen?: (options?: FrameOpenOptions) => void;
  actions?: ReactNode;
}) {
  const Icon = resolveEntryIcon(id);
  const title = resolveEntryTitle(id);
  return (
    <div className="tk-panel-header border-b px-2.5 py-1.5">
      <div className="flex min-w-0 items-center gap-2">
        <button
          className="group flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-0.5 text-left transition-colors hover:bg-[rgba(231,53,58,0.12)]"
          onClick={() => onOpen?.()}
          type="button"
        >
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] text-[color:var(--tk-color-text-inverse-secondary)]">
            <Icon size={15} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="tk-title block truncate">{title}</span>
          </span>
        </button>
        <span className="tk-chip shrink-0 rounded border text-micro">{badge}</span>
        {actions ? (
          <div className="ml-auto flex shrink-0 items-center gap-1.5">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}

function NcdTrendPanel({ compact = false }: { compact?: boolean }) {
  const allSeries = [ncdTrendSeries, ncdThreeMonthSeries, ncdOneYearSeries];
  const min = Math.min(...allSeries.flat()) - 0.02;
  const max = Math.max(...allSeries.flat()) + 0.02;
  const width = compact ? 520 : 720;
  const height = compact ? 120 : 180;
  const oneMonthPath = buildLinePath(ncdTrendSeries, width, height, min, max);
  const threeMonthPath = buildLinePath(
    ncdThreeMonthSeries,
    width,
    height,
    min,
    max,
  );
  const oneYearPath = buildLinePath(ncdOneYearSeries, width, height, min, max);
  const area = buildAreaPath(ncdTrendSeries, width, height, min, max);
  const labels = compact ? compactAuxChartLabels : auxChartLabels;
  const { tooltipState, containerRef, handleMouseMove, handleMouseLeave } =
    useChartTooltip(ncdTrendSeries.length);
  const ti = tooltipState?.index ?? null;

  const yTicks = Array.from({ length: 4 }, (_, index) =>
    Number((max - ((max - min) * index) / 3).toFixed(3)).toString(),
  );

  return (
    <div className="grid h-full min-h-0 flex-1 grid-rows-[auto_1fr_auto] gap-2 overflow-hidden rounded-lg border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] p-2">
      <div className="flex items-center justify-between text-mini text-slate-400">
        <div className="flex flex-wrap items-center gap-3">
          <LegendDot color={chartPalette.blue} label="1M" />
          <LegendDot color={chartPalette.emerald} label="3M" />
          <LegendDot color={chartPalette.amber} label="1Y" />
        </div>
        <span>近14天</span>
      </div>
      <div className="grid min-h-0 grid-cols-[2.8rem_1fr] gap-1">
        <div className="flex flex-col justify-between py-1 pr-1 text-right text-micro text-slate-500">
          {yTicks.map((tick) => (
            <div key={tick}>{tick}%</div>
          ))}
        </div>
        <div
          ref={containerRef}
          className="relative min-h-0 overflow-hidden rounded-md border border-dashed border-[color:var(--tk-color-border-panel)]"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {[0, 1, 2, 3].map((index) => (
            <div
              key={`ncd-grid-${index}`}
              className="absolute inset-x-0 border-t border-dashed border-[color:var(--tk-color-border-divider)]"
              style={{ top: `${(index / 3) * 100}%` }}
            />
          ))}
          <svg
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="none"
            viewBox={`0 0 ${width} ${height}`}
          >
            <defs>
              <linearGradient id="ncd-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5ea3ff" stopOpacity="0.24" />
                <stop offset="100%" stopColor="#5ea3ff" stopOpacity="0.04" />
              </linearGradient>
            </defs>
            <path d={area} fill="url(#ncd-fill)" />
            <path
              d={oneMonthPath}
              fill="none"
              stroke={chartPalette.blue}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={threeMonthPath}
              fill="none"
              stroke={chartPalette.emerald}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={oneYearPath}
              fill="none"
              stroke={chartPalette.amber}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {ti !== null ? (
              <line
                x1={(ti / (ncdTrendSeries.length - 1)) * width}
                x2={(ti / (ncdTrendSeries.length - 1)) * width}
                y1={0}
                y2={height}
                stroke="#5ea3ff"
                strokeWidth="1"
                strokeDasharray="4 3"
                strokeOpacity="0.6"
              />
            ) : null}
          </svg>
          {tooltipState !== null && ti !== null ? (
            <ChartTooltip clientX={tooltipState.clientX} clientY={tooltipState.clientY}>
              <div className="mb-1 font-medium text-slate-400">{auxChartLabels[ti]}</div>
              <div className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: chartPalette.blue }}
                />
                <span className="text-slate-400">1M</span>
                <span className="ml-1 font-semibold text-slate-100">
                  {ncdTrendSeries[ti].toFixed(3)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: chartPalette.emerald }}
                />
                <span className="text-slate-400">3M</span>
                <span className="ml-1 font-semibold text-slate-100">
                  {ncdThreeMonthSeries[ti].toFixed(3)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: chartPalette.amber }}
                />
                <span className="text-slate-400">1Y</span>
                <span className="ml-1 font-semibold text-slate-100">
                  {ncdOneYearSeries[ti].toFixed(3)}%
                </span>
              </div>
            </ChartTooltip>
          ) : null}
        </div>
      </div>
      <div
        className={`grid ${compact ? "grid-cols-7" : "grid-cols-14"} text-center text-micro text-slate-400`}
      >
        {labels.map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>
    </div>
  );
}

function NcdPrimaryTrendPanel({
  period = "1M",
  trendDates6m,
}: {
  period?: NcdPeriod;
  trendDates6m: string[];
}) {
  const [range, setRange] = useState<NcdTrendRange>("14d");
  const off = NCD_PERIOD_OFFSET[period];
  const count = NCD_TREND_COUNTS[range];

  const gov = shiftSeries(ncdPrimaryGovBase6m.slice(-count), off);
  const aaa = shiftSeries(ncdPrimaryAAABase6m.slice(-count), off);
  const aaPlus = shiftSeries(ncdPrimaryAAPlsBase6m.slice(-count), off);
  const aa = shiftSeries(ncdPrimaryAABase6m.slice(-count), off);
  const dates = trendDates6m.slice(-count);

  const allFlat = [...gov, ...aaa, ...aaPlus, ...aa];
  const rawMin = Math.min(...allFlat);
  const rawMax = Math.max(...allFlat);
  const pad = (rawMax - rawMin) * 0.15 || 0.02;
  const min = Math.max(0, rawMin - pad);
  const max = rawMax + pad;

  const width = 600;
  const height = 148;
  const { tooltipState, containerRef, handleMouseMove, handleMouseLeave } =
    useChartTooltip(count);
  const ti = tooltipState?.index ?? null;

  const yTicks = Array.from({ length: 4 }, (_, index) =>
    Number((max - ((max - min) * index) / 3).toFixed(3)).toString(),
  );
  const labelStep =
    range === "14d" ? 1 : range === "1m" ? 2 : range === "3m" ? 7 : 14;
  const xLabels = dates
    .map((d, index) => ({ d, index }))
    .filter(({ index }) => index % labelStep === 0 || index === count - 1);

  const series = [
    { data: gov, color: "#a78bfa", label: "国有/股份制", dash: "" },
    { data: aaa, color: chartPalette.blue, label: "AAA", dash: "" },
    { data: aaPlus, color: chartPalette.emerald, label: "AA+", dash: "5 3" },
    { data: aa, color: chartPalette.amber, label: "AA", dash: "2 2" },
  ];

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-2 overflow-hidden rounded-lg border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] p-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-mini text-slate-400">
        {series.map((item) => (
          <LegendDot key={item.label} color={item.color} label={item.label} />
        ))}
        <div className="ml-auto flex items-center gap-1">
          {ncdTrendRangeTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={auxTabClass(range === tab.id)}
              onClick={() => setRange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[2.8rem_1fr] gap-x-1">
        <div className="flex flex-col justify-between pb-5 pr-1 text-right text-micro text-slate-500">
          {yTicks.map((tick) => (
            <div key={tick}>{tick}%</div>
          ))}
        </div>
        <div
          ref={containerRef}
          className="relative min-h-0 cursor-crosshair overflow-hidden rounded-md border border-dashed border-[color:var(--tk-color-border-panel)]"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="absolute inset-x-0 border-t border-dashed border-[color:var(--tk-color-border-divider)]"
              style={{ top: `${(index / 3) * 100}%` }}
            />
          ))}
          <svg
            className="absolute inset-x-0 top-0 w-full"
            style={{ height: "calc(100% - 20px)" }}
            preserveAspectRatio="none"
            viewBox={`0 0 ${width} ${height}`}
          >
            {series.map((item) => (
              <path
                key={item.label}
                d={buildLinePath(item.data, width, height, min, max)}
                fill="none"
                stroke={item.color}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={item.dash || undefined}
              />
            ))}
            {ti !== null ? (
              <line
                x1={(ti / (count - 1)) * width}
                x2={(ti / (count - 1)) * width}
                y1={0}
                y2={height}
                stroke="#7090b0"
                strokeWidth="1"
                strokeDasharray="4 3"
              />
            ) : null}
          </svg>
          <div className="absolute inset-x-0 bottom-0 h-5">
            <svg
              className="absolute inset-x-0 top-0 w-full"
              height="4"
              preserveAspectRatio="none"
              viewBox={`0 0 ${width} 4`}
            >
              {dates.map((_, index) => (
                <line
                  key={index}
                  x1={(index / (count - 1)) * width}
                  x2={(index / (count - 1)) * width}
                  y1={0}
                  y2={4}
                  stroke="#2a4060"
                  strokeWidth="1.5"
                />
              ))}
            </svg>
            {xLabels.map(({ d, index }) => (
              <span
                key={index}
                className="absolute top-[5px] -translate-x-1/2 text-micro leading-none text-slate-400"
                style={{ left: `${(index / (count - 1)) * 100}%` }}
              >
                {d}
              </span>
            ))}
          </div>
          {tooltipState !== null && ti !== null ? (
            <ChartTooltip clientX={tooltipState.clientX} clientY={tooltipState.clientY}>
              <div className="mb-1 text-mini font-medium text-slate-400">
                {dates[ti]}
              </div>
              {series.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-400">{item.label}</span>
                  <span className="ml-1 font-semibold text-slate-100">
                    {item.data[ti].toFixed(3)}%
                  </span>
                </div>
              ))}
            </ChartTooltip>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function NcdLinkedChartPane({
  series,
  dates,
  range,
  count,
  externalHoverIndex,
  onHoverChange,
}: {
  series: Array<{ data: number[]; color: string; label: string; dash: string }>;
  dates: string[];
  range: NcdTrendRange;
  count: number;
  externalHoverIndex: number | null;
  onHoverChange: (index: number | null) => void;
}) {
  const allFlat = series.flatMap((item) => item.data);
  const rawMin = Math.min(...allFlat);
  const rawMax = Math.max(...allFlat);
  const pad = (rawMax - rawMin) * 0.15 || 0.02;
  const min = Math.max(0, rawMin - pad);
  const max = rawMax + pad;
  const width = 600;
  const height = 148;
  const {
    tooltipState,
    containerRef,
    handleMouseMove: rawHandleMouseMove,
    handleMouseLeave: rawHandleMouseLeave,
  } = useChartTooltip(count);
  const ti = tooltipState?.index ?? null;

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    rawHandleMouseMove(event);
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const x = event.clientX - rect.left;
    const index = Math.max(
      0,
      Math.min(count - 1, Math.round((x / rect.width) * (count - 1))),
    );
    onHoverChange(index);
  };

  const handleMouseLeave = () => {
    rawHandleMouseLeave();
    onHoverChange(null);
  };

  const crosshairIdx = externalHoverIndex !== null ? externalHoverIndex : ti;
  const yTicks = Array.from({ length: 4 }, (_, index) =>
    Number((max - ((max - min) * index) / 3).toFixed(3)).toString(),
  );
  const labelStep =
    range === "14d" ? 1 : range === "1m" ? 2 : range === "3m" ? 7 : 14;
  const xLabels = dates
    .map((d, index) => ({ d, index }))
    .filter(({ index }) => index % labelStep === 0 || index === count - 1);

  return (
    <div className="flex h-full min-h-0 flex-col gap-1 overflow-hidden rounded-lg border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] p-2">
      <div className="flex flex-wrap items-center gap-x-3 text-mini text-slate-400">
        {series.map((item) => (
          <LegendDot key={item.label} color={item.color} label={item.label} />
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[2.8rem_1fr] gap-x-1">
        <div className="flex flex-col justify-between pb-7 pr-1 text-right text-micro text-slate-500">
          {yTicks.map((tick) => (
            <div key={tick}>{tick}%</div>
          ))}
        </div>
        <div
          ref={containerRef}
          className="relative min-h-0 cursor-crosshair overflow-hidden rounded-md border border-dashed border-[color:var(--tk-color-border-panel)]"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="absolute inset-x-0 border-t border-dashed border-[color:var(--tk-color-border-divider)]"
              style={{ top: `${(index / 3) * 100}%` }}
            />
          ))}
          <svg
            className="absolute inset-x-0 top-0 w-full"
            style={{ height: "calc(100% - 26px)" }}
            preserveAspectRatio="none"
            viewBox={`0 0 ${width} ${height}`}
          >
            {series.map((item) => (
              <path
                key={item.label}
                d={buildLinePath(item.data, width, height, min, max)}
                fill="none"
                stroke={item.color}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={item.dash || undefined}
              />
            ))}
            {crosshairIdx !== null ? (
              <line
                x1={(crosshairIdx / (count - 1)) * width}
                x2={(crosshairIdx / (count - 1)) * width}
                y1={0}
                y2={height}
                stroke="#7090b0"
                strokeWidth="1"
                strokeDasharray="4 3"
              />
            ) : null}
          </svg>
          <div className="absolute inset-x-0 bottom-0 h-7">
            <svg
              className="absolute inset-x-0 top-0 w-full"
              height="4"
              preserveAspectRatio="none"
              viewBox={`0 0 ${width} 4`}
            >
              {dates.map((_, index) => (
                <line
                  key={index}
                  x1={(index / (count - 1)) * width}
                  x2={(index / (count - 1)) * width}
                  y1={0}
                  y2={4}
                  stroke="#2a4060"
                  strokeWidth="1.5"
                />
              ))}
            </svg>
            {xLabels.map(({ d, index }) => (
              <span
                key={index}
                className="absolute top-[6px] text-xs font-medium leading-none text-slate-300"
                style={{
                  left: `${(index / (count - 1)) * 100}%`,
                  transform:
                    index === 0
                      ? "translateX(0)"
                      : index === count - 1
                        ? "translateX(-100%)"
                        : "translateX(-50%)",
                }}
              >
                {d}
              </span>
            ))}
          </div>
          {tooltipState !== null && ti !== null ? (
            <ChartTooltip clientX={tooltipState.clientX} clientY={tooltipState.clientY}>
              <div className="mb-1 text-mini font-medium text-slate-400">
                {dates[ti]}
              </div>
              {series.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-400">{item.label}</span>
                  <span className="ml-1 font-semibold text-slate-100">
                    {item.data[ti].toFixed(3)}%
                  </span>
                </div>
              ))}
            </ChartTooltip>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function NcdExpandedDualView({
  period,
  trendDates6m,
}: {
  period: NcdPeriod;
  trendDates6m: string[];
}) {
  const [range, setRange] = useState<NcdTrendRange>("14d");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const count = NCD_TREND_COUNTS[range];
  const off = NCD_PERIOD_OFFSET[period];
  const dates = trendDates6m.slice(-count);

  const primarySeries = [
    {
      data: shiftSeries(ncdPrimaryGovBase6m.slice(-count), off),
      color: "#a78bfa",
      label: "国有/股份制",
      dash: "",
    },
    {
      data: shiftSeries(ncdPrimaryAAABase6m.slice(-count), off),
      color: chartPalette.blue,
      label: "AAA",
      dash: "",
    },
    {
      data: shiftSeries(ncdPrimaryAAPlsBase6m.slice(-count), off),
      color: chartPalette.emerald,
      label: "AA+",
      dash: "5 3",
    },
    {
      data: shiftSeries(ncdPrimaryAABase6m.slice(-count), off),
      color: chartPalette.amber,
      label: "AA",
      dash: "2 2",
    },
  ];

  const secondarySeries = [
    {
      data: ncdSecondaryGov6m.slice(-count),
      color: "#a78bfa",
      label: "国有/股份制",
      dash: "",
    },
    {
      data: ncdSecondaryAAA6m.slice(-count),
      color: chartPalette.blue,
      label: "AAA",
      dash: "",
    },
    {
      data: ncdSecondaryAAPlus6m.slice(-count),
      color: chartPalette.emerald,
      label: "AA+",
      dash: "5 3",
    },
    {
      data: ncdSecondaryAA6m.slice(-count),
      color: chartPalette.amber,
      label: "AA",
      dash: "2 2",
    },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex items-center justify-end gap-1">
        {ncdTrendRangeTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={auxTabClass(range === tab.id)}
            onClick={() => setRange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="mb-1 text-mini font-medium text-slate-400">一级</div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <NcdLinkedChartPane
            series={primarySeries}
            dates={dates}
            range={range}
            count={count}
            externalHoverIndex={hoverIndex}
            onHoverChange={setHoverIndex}
          />
        </div>
      </div>
      <div className="h-px bg-[var(--tk-color-border-divider)]" />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="mb-1 text-mini font-medium text-slate-400">二级</div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <NcdLinkedChartPane
            series={secondarySeries}
            dates={dates}
            range={range}
            count={count}
            externalHoverIndex={hoverIndex}
            onHoverChange={setHoverIndex}
          />
        </div>
      </div>
    </div>
  );
}

function NcdPrimaryTable({ initialPeriod = "1M" }: { initialPeriod?: NcdPeriod }) {
  const [period, setPeriod] = useState<NcdPeriod>(initialPeriod);

  useEffect(() => {
    setPeriod(initialPeriod);
  }, [initialPeriod]);

  const off = NCD_PERIOD_OFFSET[period];
  const groups: NcdPrimaryGroup[] = ncdPrimary1MGroups.map((group) => ({
    ...group,
    rows: group.rows.map((row) => ({
      ...row,
      rate: (parseFloat(row.rate) + off).toFixed(3),
    })),
  }));
  const maxRows = Math.max(...groups.map((group) => group.rows.length));

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]">
      <div className="flex items-center gap-2 border-b border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-dark-soft)] px-3 py-1.5">
        <div className="flex items-center gap-1">
          {ncdPrimaryPeriods.map((item) => (
            <button
              key={item}
              type="button"
              className={auxTabClass(period === item)}
              onClick={() => setPeriod(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <span className="ml-2 text-mini text-slate-500">(周一 26-06-08)</span>
      </div>
      <div
        className="grid overflow-y-auto"
        style={{
          gridTemplateColumns: `repeat(${groups.length}, 1fr)`,
          gridAutoRows: "min-content",
        }}
      >
        {groups.map((group) => (
          <div
            key={group.label}
            className="border-b border-r border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-dark-soft)] px-2 py-1 text-center text-mini font-medium text-slate-400 last:border-r-0"
          >
            {group.label}
          </div>
        ))}
        {Array.from({ length: maxRows }, (_, rowIndex) =>
          groups.map((group) => {
            const row = group.rows[rowIndex];
            return (
              <div
                key={`${group.label}-${rowIndex}`}
                className="flex items-center justify-between border-b border-r border-[color:var(--tk-color-border-divider)] px-2 py-[5px] last:border-r-0"
                style={{
                  borderBottomColor:
                    rowIndex === maxRows - 1 ? "transparent" : undefined,
                }}
              >
                {row ? (
                  <>
                    <span className="truncate text-xs text-slate-300">
                      {row.name}
                      {row.marker ? (
                        <span className="ml-0.5 text-micro text-slate-500">◆</span>
                      ) : null}
                    </span>
                    <div className="flex shrink-0 items-center gap-1">
                      <span className="font-mono text-xs text-amber-400">
                        {row.rate}
                      </span>
                      {row.change ? (
                        <span className="text-mini text-emerald-400">{row.change}</span>
                      ) : null}
                    </div>
                  </>
                ) : null}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}

function NcdPrimaryExpandedTable() {
  return (
    <div className="h-full overflow-auto">
      <table className="w-full border-collapse text-xs">
        <thead className="sticky top-0 z-10">
          <tr className="bg-[var(--tk-color-surface-dark-soft)]">
            <th className="w-20 border-b border-r border-[color:var(--tk-color-border-divider)] px-2 py-2 text-left text-mini text-slate-500" />
            {ncdPrimaryPeriods.map((period) => {
              const header = ncdColHeaders[period];
              return (
                <th
                  key={period}
                  className="border-b border-r border-[color:var(--tk-color-border-divider)] px-2 py-2 text-center last:border-r-0"
                >
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="font-semibold text-slate-200">{period}</span>
                    <span className="text-micro text-slate-500">
                      ({header.dow} {header.date})
                    </span>
                    {header.count ? (
                      <span className="rounded bg-blue-500/20 px-1 text-micro text-blue-300">
                        {header.count}
                      </span>
                    ) : null}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {ncdAllPeriodsData.map((group) => (
            <tr key={group.label} className="align-top">
              <td className="border-b border-r border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-dark-soft)] px-2 py-2 text-mini font-medium text-slate-400">
                {group.label}
              </td>
              {ncdPrimaryPeriods.map((period) => {
                const cells = group.cells[period];
                return (
                  <td
                    key={period}
                    className="border-b border-r border-[color:var(--tk-color-border-divider)] px-2 py-1.5 last:border-r-0"
                  >
                    {cells.length > 0 ? (
                      <div className="flex flex-col gap-[3px]">
                        {cells.map((cell) => (
                          <div
                            key={cell.name}
                            className="flex items-center justify-between gap-1"
                          >
                            <span className="truncate text-mini text-slate-300">
                              {cell.name}
                            </span>
                            <div className="flex shrink-0 items-center gap-1">
                              <span className="font-mono text-mini text-amber-400">
                                {cell.rate}
                              </span>
                              {cell.change ? (
                                <span className="text-micro text-emerald-400">
                                  +{cell.change}
                                </span>
                              ) : null}
                              {cell.limitNonBank ? (
                                <span className="rounded bg-slate-700/60 px-0.5 text-micro text-slate-400">
                                  限非
                                </span>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-micro text-slate-600">--</div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LeftNcdCard({
  embeddedPreview = false,
  onOpen,
  tenorFilter = "all",
  todayStr,
}: {
  embeddedPreview?: boolean;
  onOpen?: (options?: FrameOpenOptions) => void;
  tenorFilter?: QuoteTenorFilter;
  todayStr: string;
}) {
  const [market, setMarket] = useState<"primary" | "secondary">("primary");
  const [mode, setMode] = useState<"trend" | "table">("trend");
  const [expanded, setExpanded] = useState(false);
  const filteredPeriod = quoteTenorToNcdPeriod(tenorFilter);
  const trendDates6m = createNcdTrendDates(todayStr);

  const badge = tenorFilter === "all" ? "近14日" : filteredPeriod;

  const header = (onClose?: () => void) => (
    <div className="flex items-center gap-2">
      <div className="text-sm font-semibold tracking-[0.02em] text-slate-50">NCD</div>
      <div className="flex items-center gap-1">
        <button
          className={auxTabClass(market === "primary")}
          onClick={() => setMarket("primary")}
          type="button"
        >
          一级
        </button>
        <button
          className={auxTabClass(market === "secondary")}
          onClick={() => setMarket("secondary")}
          type="button"
        >
          二级
        </button>
      </div>
      <div className="ml-auto flex items-center gap-1">
        <button
          className={auxTabClass(mode === "trend")}
          onClick={() => setMode("trend")}
          type="button"
        >
          趋势图
        </button>
        <button
          className={auxTabClass(mode === "table")}
          onClick={() => setMode("table")}
          type="button"
        >
          表格
        </button>
        {onClose ? (
          <button
            onClick={onClose}
            type="button"
            className="ml-1 rounded p-0.5 text-slate-400 hover:bg-[var(--tk-color-surface-selected)] hover:text-slate-100"
            title="收起"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 2l4 4M2 2h3M2 2v3M12 12l-4-4M12 12H9M12 12V9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : (
          <button
            onClick={() => setExpanded(true)}
            type="button"
            className="ml-1 rounded p-0.5 text-slate-400 hover:bg-[var(--tk-color-surface-selected)] hover:text-slate-100"
            title="展开"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M5 2H2v3M2 2l4 4M9 12h3V9M12 12l-4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );

  const body =
    market === "primary" ? (
      mode === "trend" ? (
        <NcdPrimaryTrendPanel period={filteredPeriod} trendDates6m={trendDates6m} />
      ) : (
        <NcdPrimaryTable initialPeriod={filteredPeriod} />
      )
    ) : mode === "trend" ? (
      <NcdTrendPanel compact />
    ) : (
      <div className={embeddedPreview ? "min-h-0" : "h-full min-h-0"}>
        <StructuredTable
          columns={["期限", "最新", "涨跌bp", "参考收益", "更新时间"]}
          rows={ncdTableRows}
          greenColumns={[1]}
          deltaColumns={[2]}
          fitToWidth
          columnWidths={["14%", "18%", "16%", "22%", "30%"]}
          compact
          flush={false}
          adaptiveHeight={embeddedPreview}
          scrollY={!embeddedPreview}
        />
      </div>
    );

  return (
    <>
      <section className="tk-panel flex h-full min-h-0 flex-col overflow-hidden border">
        {embeddedPreview ? (
          <NcdPreviewHeader
            id="ncd"
            badge={badge}
            onOpen={onOpen}
            actions={
              <div className="flex items-center gap-1">
                <button
                  className={auxTabClass(market === "primary")}
                  onClick={() => setMarket("primary")}
                  type="button"
                >
                  一级
                </button>
                <button
                  className={auxTabClass(market === "secondary")}
                  onClick={() => setMarket("secondary")}
                  type="button"
                >
                  二级
                </button>
                <button
                  className={auxTabClass(mode === "trend")}
                  onClick={() => setMode("trend")}
                  type="button"
                >
                  趋势图
                </button>
                <button
                  className={auxTabClass(mode === "table")}
                  onClick={() => setMode("table")}
                  type="button"
                >
                  表格
                </button>
                <button
                  onClick={() => setExpanded(true)}
                  type="button"
                  className="rounded p-0.5 text-slate-400 hover:bg-[var(--tk-color-surface-selected)] hover:text-slate-100"
                  title="展开"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M5 2H2v3M2 2l4 4M9 12h3V9M12 12l-4-4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            }
          />
        ) : (
          <div className="tk-panel-header border-b px-4 py-2.5">{header()}</div>
        )}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-2">{body}</div>
      </section>
      {expanded ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(17,24,39,0.32)]"
          onClick={() => setExpanded(false)}
        >
          <div
            className="relative flex h-[85vh] w-[90vw] max-w-[1400px] flex-col overflow-hidden rounded-2xl border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] shadow-[0_12px_28px_rgba(17,24,39,0.12)]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              onClick={() => setExpanded(false)}
              type="button"
              className="absolute right-3 top-3 z-10 rounded p-1 text-slate-400 hover:bg-[var(--tk-color-surface-selected)] hover:text-slate-100"
              title="收起"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M2 2l4 4M2 2h3M2 2v3M12 12l-4-4M12 12H9M12 12V9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div className="min-h-0 flex-1 overflow-hidden p-3">
              {market === "primary" && mode === "table" ? (
                <NcdPrimaryExpandedTable />
              ) : market === "primary" && mode === "trend" ? (
                <NcdExpandedDualView period={filteredPeriod} trendDates6m={trendDates6m} />
              ) : (
                body
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
