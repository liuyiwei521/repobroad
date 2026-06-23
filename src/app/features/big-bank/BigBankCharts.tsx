import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Columns2,
  Download,
  Expand,
  RefreshCcw,
  type LucideIcon,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { buildChartDomain } from "../../dashboardUtils.js";
import { ChartTooltip, LegendDot, useChartTooltip } from "../../components/ui/ChartPrimitives";
import type { BankRateRow } from "../../types";
import {
  bankChartTicks,
  bankChartXTickIndices,
  bankHistorySessionLabel,
  bankTrendPath,
  bankTrendX,
  bankTrendY,
  buildAnchoredBankHistorySeries,
  buildRoundedTicks,
  type BankHistoryPoint,
} from "./bank.utils";

type BigBankReferencePoint = {
  date: string;
  nonBank: number;
  bankRate: number;
  spread: number;
  bankDiff: number;
  nonBankDiff: number;
};

function formatBigBankReferenceDate(value: string) {
  const [month, day] = value.split("/").map(Number);
  if (!month || !day) return value;
  return `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function buildBigBankReferenceSeries(data: readonly BankHistoryPoint[]): BigBankReferencePoint[] {
  const nonBankValues = data.map((item) => Math.max(item.nonBank, item.bankRate));
  const bankValues = data.map((item) => Math.min(item.nonBank, item.bankRate));
  const bankBaseline = bankValues[0] ?? 0;
  const nonBankBaseline = Math.min(...nonBankValues) - 0.01;

  return data.map((item, index) => ({
    date: formatBigBankReferenceDate(item.date),
    nonBank: nonBankValues[index],
    bankRate: bankValues[index],
    spread: Math.max(1, Math.round((nonBankValues[index] - bankValues[index]) * 100)),
    bankDiff: Math.round((bankValues[index] - bankBaseline) * 100),
    nonBankDiff: Math.max(1, Math.round((nonBankValues[index] - nonBankBaseline) * 100)),
  }));
}

function bankReferenceXTickIndices(count: number) {
  const steps = 5;
  return Array.from(
    new Set(
      Array.from({ length: steps + 1 }, (_, index) =>
        Math.round((index / steps) * Math.max(0, count - 1)),
      ),
    ),
  );
}

function lightChartY(
  value: number,
  min: number,
  max: number,
  top: number,
  bottom: number,
) {
  if (max === min) return (top + bottom) / 2;
  return top + ((max - value) / (max - min)) * (bottom - top);
}

function LightChartTooltip({
  clientX,
  clientY,
  children,
}: {
  clientX: number;
  clientY: number;
  children: React.ReactNode;
}) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(() => ({
    left: clientX + 14,
    top: clientY - 10,
  }));

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const tooltip = tooltipRef.current;
    const width = tooltip?.offsetWidth ?? 220;
    const height = tooltip?.offsetHeight ?? 120;
    const padding = 12;
    let left = clientX + 14;
    let top = clientY - 10;

    if (left + width + padding > window.innerWidth) {
      left = clientX - width - 14;
    }
    if (top + height + padding > window.innerHeight) {
      top = clientY - height - 14;
    }

    left = Math.max(padding, Math.min(left, window.innerWidth - width - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - height - padding));
    setPosition({ left, top });
  }, [clientX, clientY, children]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={tooltipRef}
      className="pointer-events-none fixed z-[200] rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs text-slate-600 shadow-[0_18px_40px_rgba(15,23,42,0.16)] backdrop-blur-sm"
      style={{ left: position.left, top: position.top }}
    >
      {children}
    </div>,
    document.body,
  );
}

function LightTooltipValueRow({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-slate-500">{label}</span>
      <span className="ml-auto pl-4 font-mono font-semibold text-slate-800">{value}</span>
    </div>
  );
}

function BigBankReferenceToolbar() {
  const tools: readonly LucideIcon[] = [Expand, Columns2, Download, RefreshCcw];
  return (
    <div className="flex items-center gap-1 text-slate-500">
      {tools.map((Icon, index) => (
        <button
          key={`${Icon.displayName ?? "tool"}-${index}`}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-slate-100 hover:text-slate-700"
          type="button"
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
}

function BigBankReferenceCardHeader({
  title,
  legends,
}: {
  title: string;
  legends: readonly { color: string; label: string }[];
}) {
  return (
    <div className="border-b border-slate-200">
      <div className="px-6 pt-6 text-[18px] font-semibold tracking-[-0.02em] text-slate-800">
        {title}
      </div>
      <div className="flex flex-wrap items-center gap-3 px-6 py-4">
        <span className="shrink-0 text-[12px] text-slate-400">仅供内部参考</span>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {legends.map((legend) => (
            <LegendDot
              key={`${title}-${legend.label}`}
              color={legend.color}
              label={legend.label}
              className="px-0 text-[13px] text-slate-600"
            />
          ))}
        </div>
        <div className="ml-auto shrink-0">
          <BigBankReferenceToolbar />
        </div>
      </div>
    </div>
  );
}

export function BigBankReferenceTrendPlot({
  data,
  sessionLabel,
}: {
  data: readonly BigBankReferencePoint[];
  sessionLabel: string;
}) {
  const { tooltipState, containerRef, handleMouseMove, handleMouseLeave } =
    useChartTooltip(data.length);
  const nonBank = data.map((item) => item.nonBank);
  const bankRates = data.map((item) => item.bankRate);
  const spread = data.map((item) => item.spread);
  const { min: minRate, max: maxRate } = buildChartDomain([...nonBank, ...bankRates], {
    paddingRatio: 0.12,
    minSpan: 0.08,
    clampMin: 0,
  });
  const maxSpread = Math.max(...spread, 1);
  const width = 860;
  const height = 430;
  const margin = { left: 66, right: 58, top: 46, bottom: 44 };
  const plotBottom = height - margin.bottom;
  const yTicks = bankChartTicks(minRate, maxRate, 6);
  const xTickIndices = bankReferenceXTickIndices(data.length);
  const spreadPlotHeight = (height - margin.top - margin.bottom) * 0.46;
  const spreadTicks = [maxSpread, Math.round(maxSpread / 2), 0];
  const tooltipIndex = tooltipState?.index ?? null;
  const hoverX =
    tooltipIndex === null ? null : bankTrendX(tooltipIndex, data.length, width, margin);
  const lastIndex = data.length - 1;
  const lastX = bankTrendX(lastIndex, data.length, width, margin);
  const lastNonBankY = bankTrendY(nonBank[lastIndex], height, minRate, maxRate, margin);
  const lastBankY = bankTrendY(bankRates[lastIndex], height, minRate, maxRate, margin);

  return (
    <div
      ref={containerRef}
      className="relative h-full min-h-[430px] cursor-crosshair"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${width} ${height}`}>
        <text x={margin.left - 22} y={22} fill="#64748b" fontSize="10">
          利率(%)
        </text>
        <text x={width - margin.right + 36} y={22} textAnchor="end" fill="#64748b" fontSize="10">
          价差(BP)
        </text>
        {yTicks.map((tick) => {
          const y = bankTrendY(tick, height, minRate, maxRate, margin);
          return (
            <g key={tick}>
              <line
                x1={margin.left}
                x2={width - margin.right}
                y1={y}
                y2={y}
                stroke="#e5e7eb"
              />
              <text x={margin.left - 10} y={y + 4} textAnchor="end" fill="#64748b" fontSize="10">
                {tick.toFixed(2)}
              </text>
            </g>
          );
        })}
        <line x1={margin.left} x2={margin.left} y1={margin.top} y2={plotBottom} stroke="#cbd5e1" />
        <line x1={margin.left} x2={width - margin.right} y1={plotBottom} y2={plotBottom} stroke="#cbd5e1" />
        {xTickIndices.map((index) => {
          const x = bankTrendX(index, data.length, width, margin);
          return (
            <g key={index}>
              <line x1={x} x2={x} y1={plotBottom} y2={plotBottom + 4} stroke="#94a3b8" />
              <text x={x} y={height - 12} textAnchor="middle" fill="#64748b" fontSize="10">
                {data[index].date}
              </text>
            </g>
          );
        })}
        {spread.map((value, index) => {
          const barWidth = Math.max(5, (width - margin.left - margin.right) / spread.length - 4);
          const barHeight = (value / Math.max(maxSpread, 1)) * spreadPlotHeight;
          return (
            <rect
              key={`ref-spread-${index}`}
              x={bankTrendX(index, data.length, width, margin) - barWidth / 2}
              y={plotBottom - barHeight}
              width={barWidth}
              height={barHeight}
              rx="1.5"
              fill="#f3e4b8"
              opacity="0.88"
            />
          );
        })}
        {spreadTicks.map((tick) => {
          const y = plotBottom - (tick / Math.max(maxSpread, 1)) * spreadPlotHeight;
          return (
            <text
              key={`ref-spread-tick-${tick}`}
              x={width - margin.right + 12}
              y={y + 4}
              fill="#64748b"
              fontSize="10"
            >
              {tick}
            </text>
          );
        })}
        <path
          d={bankTrendPath(nonBank, width, height, minRate, maxRate, margin)}
          fill="none"
          stroke="#d97b84"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={bankTrendPath(bankRates, width, height, minRate, maxRate, margin)}
          fill="none"
          stroke="#5b8cc9"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {hoverX !== null && tooltipIndex !== null ? (
          <>
            <line
              x1={hoverX}
              x2={hoverX}
              y1={margin.top}
              y2={plotBottom}
              stroke="#94a3b8"
              strokeDasharray="4 4"
            />
            <circle
              cx={hoverX}
              cy={bankTrendY(nonBank[tooltipIndex], height, minRate, maxRate, margin)}
              r="4"
              fill="#d97b84"
              stroke="#ffffff"
              strokeWidth="2"
            />
            <circle
              cx={hoverX}
              cy={bankTrendY(bankRates[tooltipIndex], height, minRate, maxRate, margin)}
              r="4"
              fill="#5b8cc9"
              stroke="#ffffff"
              strokeWidth="2"
            />
          </>
        ) : null}
        <text x={lastX + 10} y={lastNonBankY - 8} fill="#1e293b" fontSize="13" fontWeight="700">
          {nonBank[lastIndex].toFixed(2)}
        </text>
        <text x={lastX + 10} y={lastBankY + 4} fill="#1e293b" fontSize="13" fontWeight="700">
          {bankRates[lastIndex].toFixed(2)}
        </text>
      </svg>
      {tooltipIndex !== null && tooltipState ? (
        <LightChartTooltip clientX={tooltipState.clientX} clientY={tooltipState.clientY}>
          <div className="mb-2 text-[12px] font-semibold text-slate-700">
            {data[tooltipIndex].date} · {sessionLabel}
          </div>
          <LightTooltipValueRow color="#d97b84" label="出给非银价格" value={`${nonBank[tooltipIndex].toFixed(3)}%`} />
          <LightTooltipValueRow color="#5b8cc9" label="出给银行价格" value={`${bankRates[tooltipIndex].toFixed(3)}%`} />
          <LightTooltipValueRow color="#f3e4b8" label="非银-银行价差" value={`${spread[tooltipIndex]}BP`} />
        </LightChartTooltip>
      ) : null}
    </div>
  );
}

export function BigBankReferenceDiffPlot({
  data,
  sessionLabel,
}: {
  data: readonly BigBankReferencePoint[];
  sessionLabel: string;
}) {
  const { tooltipState, containerRef, handleMouseMove, handleMouseLeave } =
    useChartTooltip(data.length);
  const bankDiff = data.map((item) => item.bankDiff);
  const nonBankDiff = data.map((item) => item.nonBankDiff);
  const width = 860;
  const height = 430;
  const margin = { left: 60, right: 18, top: 44, bottom: 46 };
  const groupGap = 42;
  const groupHeight = (height - margin.top - margin.bottom - groupGap) / 2;
  const topStart = margin.top;
  const topEnd = topStart + groupHeight;
  const bottomStart = topEnd + groupGap;
  const bottomEnd = bottomStart + groupHeight;
  const topMax = Math.max(8, Math.ceil(Math.max(...bankDiff, 0) / 2) * 2);
  const topMin = Math.min(-2, Math.floor(Math.min(...bankDiff, 0) / 2) * 2);
  const bottomMax = Math.max(8, Math.ceil(Math.max(...nonBankDiff, 0) / 2) * 2);
  const topTicks = Array.from({ length: Math.floor((topMax - topMin) / 2) + 1 }, (_, index) => topMax - index * 2);
  const bottomTicks = Array.from({ length: Math.floor(bottomMax / 2) + 1 }, (_, index) => bottomMax - index * 2);
  const xTickIndices = bankReferenceXTickIndices(data.length);
  const tooltipIndex = tooltipState?.index ?? null;
  const hoverX =
    tooltipIndex === null ? null : bankTrendX(tooltipIndex, data.length, width, margin);
  const topZeroY = lightChartY(0, topMin, topMax, topStart, topEnd);

  return (
    <div
      ref={containerRef}
      className="relative h-full min-h-[430px] cursor-crosshair"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${width} ${height}`}>
        <text x={margin.left - 20} y={22} fill="#64748b" fontSize="10">
          价差(BP)
        </text>
        {topTicks.map((tick) => {
          const y = lightChartY(tick, topMin, topMax, topStart, topEnd);
          return (
            <g key={`top-${tick}`}>
              <line x1={margin.left} x2={width - margin.right} y1={y} y2={y} stroke="#e5e7eb" />
              <text x={margin.left - 10} y={y + 4} textAnchor="end" fill="#64748b" fontSize="10">
                {tick}
              </text>
            </g>
          );
        })}
        {bottomTicks.map((tick) => {
          const y = lightChartY(tick, 0, bottomMax, bottomStart, bottomEnd);
          return (
            <g key={`bottom-${tick}`}>
              <line x1={margin.left} x2={width - margin.right} y1={y} y2={y} stroke="#e5e7eb" />
              <text x={margin.left - 10} y={y + 4} textAnchor="end" fill="#64748b" fontSize="10">
                {tick}
              </text>
            </g>
          );
        })}
        <line x1={margin.left} x2={margin.left} y1={topStart} y2={bottomEnd} stroke="#cbd5e1" />
        <line x1={margin.left} x2={width - margin.right} y1={topZeroY} y2={topZeroY} stroke="#cbd5e1" />
        <line x1={margin.left} x2={width - margin.right} y1={bottomEnd} y2={bottomEnd} stroke="#cbd5e1" />
        {bankDiff.map((value, index) => {
          const barWidth = Math.max(6, (width - margin.left - margin.right) / bankDiff.length - 4);
          const x = bankTrendX(index, data.length, width, margin) - barWidth / 2;
          const valueY = lightChartY(value, topMin, topMax, topStart, topEnd);
          return (
            <rect
              key={`bank-diff-${index}`}
              x={x}
              y={Math.min(valueY, topZeroY)}
              width={barWidth}
              height={Math.max(2, Math.abs(valueY - topZeroY))}
              rx="1.5"
              fill="#5b8cc9"
              opacity="0.92"
            />
          );
        })}
        {nonBankDiff.map((value, index) => {
          const barWidth = Math.max(6, (width - margin.left - margin.right) / nonBankDiff.length - 4);
          const x = bankTrendX(index, data.length, width, margin) - barWidth / 2;
          const valueY = lightChartY(value, 0, bottomMax, bottomStart, bottomEnd);
          return (
            <rect
              key={`non-bank-diff-${index}`}
              x={x}
              y={valueY}
              width={barWidth}
              height={Math.max(2, bottomEnd - valueY)}
              rx="1.5"
              fill="#d97b84"
              opacity="0.92"
            />
          );
        })}
        {xTickIndices.map((index) => {
          const x = bankTrendX(index, data.length, width, margin);
          return (
            <g key={`ref-diff-x-${index}`}>
              <line x1={x} x2={x} y1={bottomEnd} y2={bottomEnd + 4} stroke="#94a3b8" />
              <text x={x} y={height - 12} textAnchor="middle" fill="#64748b" fontSize="10">
                {data[index].date}
              </text>
            </g>
          );
        })}
        {hoverX !== null ? (
          <line
            x1={hoverX}
            x2={hoverX}
            y1={topStart}
            y2={bottomEnd}
            stroke="#94a3b8"
            strokeDasharray="4 4"
          />
        ) : null}
      </svg>
      {tooltipIndex !== null && tooltipState ? (
        <LightChartTooltip clientX={tooltipState.clientX} clientY={tooltipState.clientY}>
          <div className="mb-2 text-[12px] font-semibold text-slate-700">
            {data[tooltipIndex].date} · {sessionLabel}
          </div>
          <LightTooltipValueRow color="#5b8cc9" label="给银行价差" value={`${bankDiff[tooltipIndex]}BP`} />
          <LightTooltipValueRow color="#d97b84" label="给非银价差" value={`${nonBankDiff[tooltipIndex]}BP`} />
        </LightChartTooltip>
      ) : null}
    </div>
  );
}

function TooltipValueRow({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[color:var(--tk-color-text-secondary)]">{label}</span>
      <span className="ml-auto pl-4 font-mono font-semibold text-[color:var(--tk-color-text-heading)]">
        {value}
      </span>
    </div>
  );
}

function BigBankHistoryTooltipContent({
  active,
  payload,
  sessionLabel,
  mode,
}: {
  active?: boolean;
  payload?: Array<{ payload?: BankHistoryPoint }>;
  sessionLabel: string;
  mode: "trend" | "diff";
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  return (
    <div className="rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-page)] px-3 py-2 text-xs text-[color:var(--tk-color-text-secondary)] shadow-lg">
      <div className="mb-1.5 flex items-center justify-between gap-4 font-semibold text-[color:var(--tk-color-text-heading)]">
        <span>{point.date}</span>
        <span className="rounded border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-panel)] px-1.5 py-0.5 text-micro text-[color:var(--tk-color-text-secondary)]">
          {sessionLabel}
        </span>
      </div>
      {mode === "trend" ? (
        <>
          <TooltipValueRow color="#cf6b74" label={"出给非银"} value={`${point.nonBank.toFixed(3)}%`} />
          <TooltipValueRow color="#5b8cc9" label={"出给银行"} value={`${point.bankRate.toFixed(3)}%`} />
          <TooltipValueRow color="#f4dfaa" label={"非银-银行价差"} value={`${point.spread}BP`} />
        </>
      ) : (
        <>
          <TooltipValueRow color="#5b8cc9" label={"给银行价差"} value={`${point.bankDiff}BP`} />
          <TooltipValueRow color="#d76370" label={"给非银价差"} value={`${point.nonBankDiff}BP`} />
        </>
      )}
    </div>
  );
}

export function BigBankRateTrendRechartsPlot({
  data,
  sessionLabel,
}: {
  data: readonly BankHistoryPoint[];
  sessionLabel: string;
}) {
  const nonBank = data.map((item) => item.nonBank);
  const bankRates = data.map((item) => item.bankRate);
  const spread = data.map((item) => item.spread);
  const { min: minRate, max: maxRate } = buildChartDomain([...nonBank, ...bankRates], {
    paddingRatio: 0.12,
    minSpan: 0.08,
    clampMin: 0,
  });
  const maxSpread = Math.max(...spread, 1);
  const yTicks = bankChartTicks(minRate, maxRate);
  const spreadTicks = buildRoundedTicks(maxSpread);
  const visibleDates = new Set(
    bankChartXTickIndices(data.length).map((index) => data[index]?.date),
  );

  return (
    <div className="flex h-full min-h-[320px] min-w-0 flex-col">
      <div className="mb-1 flex items-center justify-between gap-3 text-micro text-slate-500">
        <span>{"\u5229\u7387(%)"}</span>
        <div className="flex items-center gap-2">
          <span>{"\u4ef7\u5dee(BP)"}</span>
          <span className="rounded border border-[color:var(--tk-color-border-panel)] bg-[rgba(15,23,42,0.58)] px-1.5 py-0.5 text-slate-300">
            {sessionLabel}
          </span>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 6, right: 6, bottom: 6, left: 6 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.16)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 10 }}
              tickMargin={8}
              minTickGap={24}
              tickFormatter={(value) => (visibleDates.has(value) ? value : "")}
            />
            <YAxis
              yAxisId="rate"
              domain={[minRate, maxRate]}
              ticks={yTicks}
              width={46}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 10 }}
              tickFormatter={(value: number) => value.toFixed(3)}
            />
            <YAxis
              yAxisId="spread"
              orientation="right"
              domain={[0, Math.max(...spreadTicks, maxSpread)]}
              ticks={spreadTicks}
              width={34}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 10 }}
            />
            <Tooltip
              cursor={{ stroke: "#7aa2d6", strokeDasharray: "3 3", strokeWidth: 1 }}
              content={<BigBankHistoryTooltipContent mode="trend" sessionLabel={sessionLabel} />}
            />
            <Bar
              yAxisId="spread"
              dataKey="spread"
              fill="#f4dfaa"
              opacity={0.56}
              radius={[3, 3, 0, 0]}
              maxBarSize={16}
              isAnimationActive={false}
            />
            <Line
              yAxisId="rate"
              type="monotone"
              dataKey="nonBank"
              stroke="#cf6b74"
              strokeWidth={2.4}
              dot={false}
              activeDot={{ r: 4, stroke: "#0b1020", strokeWidth: 1.5 }}
              isAnimationActive={false}
            />
            <Line
              yAxisId="rate"
              type="monotone"
              dataKey="bankRate"
              stroke="#5b8cc9"
              strokeWidth={2.4}
              dot={false}
              activeDot={{ r: 4, stroke: "#0b1020", strokeWidth: 1.5 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function BigBankSpreadDiffRechartsPlot({
  data,
  sessionLabel,
}: {
  data: readonly BankHistoryPoint[];
  sessionLabel: string;
}) {
  const bankMax = Math.max(
    6,
    Math.ceil(Math.max(...data.map((item) => item.bankDiff), 1) / 2) * 2,
  );
  const nonBankMax = Math.max(
    6,
    Math.ceil(Math.max(...data.map((item) => item.nonBankDiff), 1) / 2) * 2,
  );
  const visibleDates = new Set(
    bankChartXTickIndices(data.length).map((index) => data[index]?.date),
  );
  const syncId = "big-bank-diff";

  return (
    <div className="flex h-full min-h-[280px] min-w-0 flex-col">
      <div className="mb-1 flex items-center justify-between gap-3 text-micro text-slate-500">
        <span>BP</span>
        <span className="rounded border border-[color:var(--tk-color-border-panel)] bg-[rgba(15,23,42,0.58)] px-1.5 py-0.5 text-slate-300">
          {sessionLabel}
        </span>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[88px_minmax(0,1fr)] grid-rows-2 gap-x-3 gap-y-3">
        <div className="flex items-center justify-end pr-1 text-xs text-slate-400">{"\u7ed9\u94f6\u884c\u4ef7\u5dee"}</div>
        <div className="min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} syncId={syncId} margin={{ top: 4, right: 6, bottom: 0, left: 6 }}>
              <CartesianGrid stroke="rgba(148,163,184,0.16)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" hide />
              <YAxis
                domain={[0, bankMax]}
                ticks={buildRoundedTicks(bankMax)}
                width={34}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 10 }}
              />
              <Tooltip
                cursor={{ fill: "rgba(122,162,214,0.08)" }}
                content={<BigBankHistoryTooltipContent mode="diff" sessionLabel={sessionLabel} />}
              />
              <Bar dataKey="bankDiff" fill="#5b8cc9" radius={[3, 3, 0, 0]} maxBarSize={18} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-end pr-1 text-xs text-slate-400">{"\u7ed9\u975e\u94f6\u4ef7\u5dee"}</div>
        <div className="min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} syncId={syncId} margin={{ top: 4, right: 6, bottom: 6, left: 6 }}>
              <CartesianGrid stroke="rgba(148,163,184,0.16)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 10 }}
                tickMargin={8}
                minTickGap={24}
                tickFormatter={(value) => (visibleDates.has(value) ? value : "")}
              />
              <YAxis
                domain={[0, nonBankMax]}
                ticks={buildRoundedTicks(nonBankMax)}
                width={34}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 10 }}
              />
              <Tooltip
                cursor={{ fill: "rgba(215,99,112,0.08)" }}
                content={<BigBankHistoryTooltipContent mode="diff" sessionLabel={sessionLabel} />}
              />
              <Bar dataKey="nonBankDiff" fill="#d76370" radius={[3, 3, 0, 0]} maxBarSize={18} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export function BigBankPricingTrendChart({
  bank,
  tenor,
  rows,
  className = "",
  compact = false,
}: {
  bank: string;
  tenor?: string;
  rows: readonly BankRateRow[];
  className?: string;
  compact?: boolean;
}) {
  const data = buildAnchoredBankHistorySeries(bank, rows, tenor);
  const sessionLabel = bankHistorySessionLabel(tenor);

  return (
    <div
      className={`grid min-h-0 grid-rows-[auto_1fr] rounded border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] ${
        compact ? "p-2.5" : "p-3"
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="tk-title">大行定价走势</div>
          <div className="mt-0.5 text-micro text-slate-500">
            {bank} · {tenor || "全部期限"} · {sessionLabel}
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-x-3 gap-y-1 text-micro text-slate-400">
          <LegendDot color="#cf6b74" label="出给非银价格(%)" />
          <LegendDot color="#5b8cc9" label="出给银行价格(%)" />
          <LegendDot color="#f4dfaa" label="非银-银行价差(BP)" />
        </div>
      </div>
      <BigBankRateTrendRechartsPlot data={data} sessionLabel={sessionLabel} />
    </div>
  );
}

export function BigBankReferenceCard({
  title,
  legends,
  children,
}: {
  title: string;
  legends: readonly { color: string; label: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
      <BigBankReferenceCardHeader title={title} legends={legends} />
      <div className="p-4">{children}</div>
    </div>
  );
}
