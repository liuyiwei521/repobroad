import {
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  barometerData,
  barometerMetricOptions,
  barometerRangeOptions,
  barometerTimeline,
  qtInstitutionOptions,
  qtInstitutionProfiles,
} from "./barometer.data";
import { BarometerSegmentedControl } from "./BarometerSegmentedControl";
import type {
  BarometerMetric,
  BarometerRange,
  BarometerSlice,
  QtInstitutionType,
} from "./barometer.types";
import {
  buildInstitutionBarometerPoints,
  buildInstitutionBarometerPricePoints,
} from "./barometer.utils";

const visibleTimeLabels = new Set([
  "08:15",
  "09:15",
  "10:15",
  "11:15",
  "15:00",
  "16:00",
]);

export function BarometerMatrixCard() {
  const [range, setRange] = useState<BarometerRange>("overnight");
  const [metric, setMetric] = useState<BarometerMetric>("volume");
  const [institutionType, setInstitutionType] =
    useState<QtInstitutionType>("all");

  const institutionProfile =
    qtInstitutionProfiles[institutionType] ?? qtInstitutionProfiles.all;
  const rawSlice = barometerData[range][metric];
  const currentSlice: BarometerSlice = {
    ...rawSlice,
    series: rawSlice.series.map((series) => ({
      ...series,
      points:
        metric === "price"
          ? buildInstitutionBarometerPricePoints(
              series.points,
              institutionProfile,
              series.key,
            )
          : buildInstitutionBarometerPoints(
              series.points,
              institutionProfile,
              series.key,
            ),
    })),
  };
  const allValues = currentSlice.series.flatMap((series) =>
    series.points.map((point) => point.value),
  );
  const isPrice = metric === "price";
  const rawMax = Math.max(...allValues, 1);
  const rawMin = isPrice ? Math.min(...allValues) : 0;
  const pad = isPrice ? 0.01 : 0;
  const max = rawMax + pad;
  const min = isPrice ? rawMin - pad : 0;
  const width = 320;
  const height = 110;
  const yTicks = [
    max,
    min + (max - min) * 0.66,
    min + (max - min) * 0.33,
    min,
  ].map((value) => (isPrice ? Number(value.toFixed(3)) : Math.round(value)));
  const { tooltipState, containerRef, handleMouseMove, handleMouseLeave } =
    useChartTooltip(barometerTimeline.length);
  const tooltipIndex = tooltipState?.index ?? null;

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_auto_minmax(0,1fr)_auto] overflow-hidden rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]">
      <div className="flex items-center justify-between gap-2 border-b border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-dark-soft)] px-3 py-2.5">
        <div className="tk-matrix-card-title shrink-0 whitespace-nowrap">
          {"\u673a\u6784\u70ed\u5ea6\u8d70\u52bf"}
        </div>
        <div className="text-micro text-slate-500">
          {"\u622a\u81f3 16:00"}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-[color:var(--tk-color-border-divider)] px-3 py-2.5 text-xs">
        <label className="flex items-center gap-1.5 text-mini text-slate-400">
          {"\u5206\u673a\u6784"}
          <select
            className="tk-field tk-field--compact min-w-[104px] rounded px-2 text-mini text-slate-100 outline-none"
            value={institutionType}
            onChange={(event) =>
              setInstitutionType(event.target.value as QtInstitutionType)
            }
          >
            {qtInstitutionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <BarometerSegmentedControl
          label="期限"
          options={barometerRangeOptions}
          value={range}
          onChange={setRange}
        />
        <BarometerSegmentedControl
          label="指标"
          options={barometerMetricOptions}
          value={metric}
          onChange={setMetric}
        />
      </div>

      <div className="grid min-h-0 grid-cols-[2.7rem_minmax(0,1fr)] grid-rows-[minmax(0,1fr)_1rem] px-3 pb-1 pt-2">
        <div className="flex flex-col justify-between pr-2 text-right text-micro text-slate-500">
          <div className="text-micro text-slate-500">{currentSlice.yLabel}</div>
          {yTicks.map((tick) => (
            <div key={tick}>{tick}</div>
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
              key={`barometer-grid-${index}`}
              className="absolute inset-x-0 border-t border-[color:var(--tk-color-border-divider)] opacity-60"
              style={{ top: `${(index / 3) * 100}%` }}
            />
          ))}
          <svg
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="none"
            viewBox={`0 0 ${width} ${height}`}
          >
            {currentSlice.series.map((series) => (
              <path
                key={series.key}
                d={buildLinePath(
                  series.points.map((point) => point.value),
                  width,
                  height,
                  min,
                  max,
                )}
                fill="none"
                stroke={series.color}
                strokeDasharray={series.lineStyle === "dashed" ? "7 5" : undefined}
                strokeLinecap="square"
                strokeLinejoin="miter"
                strokeWidth={series.lineStyle === "dashed" ? 1.7 : 2.1}
              />
            ))}
            {tooltipIndex !== null ? (
              <line
                x1={(tooltipIndex / (barometerTimeline.length - 1)) * width}
                x2={(tooltipIndex / (barometerTimeline.length - 1)) * width}
                y1={0}
                y2={height}
                stroke="#94a3b8"
                strokeDasharray="4 4"
                strokeOpacity="0.5"
              />
            ) : null}
          </svg>
          {tooltipState !== null && tooltipIndex !== null ? (
            <ChartTooltip
              clientX={tooltipState.clientX}
              clientY={tooltipState.clientY}
            >
              <div className="mb-1 font-medium text-slate-300">
                {barometerTimeline[tooltipIndex]}
              </div>
              <div className="grid gap-1">
                {currentSlice.series.map((series) => (
                  <div key={series.key} className="flex items-center gap-2">
                    <span
                      className="h-1.5 w-3"
                      style={{
                        borderTop: `2px ${
                          series.lineStyle === "dashed" ? "dashed" : "solid"
                        } ${series.color}`,
                      }}
                    />
                    <span className="text-slate-400">{series.label}</span>
                    <span className="font-medium text-slate-100">
                      {currentSlice.yUnit === "%"
                        ? series.points[tooltipIndex].value.toFixed(3)
                        : series.points[tooltipIndex].value}
                      {currentSlice.yUnit}
                    </span>
                  </div>
                ))}
              </div>
            </ChartTooltip>
          ) : null}
        </div>
        <div className="col-start-2 row-start-2 flex items-end justify-between text-micro leading-none text-slate-500">
          {barometerTimeline.map((label) => (
            <span key={label}>{visibleTimeLabels.has(label) ? label : ""}</span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 pb-2 pt-1 text-xs text-slate-100">
        {currentSlice.series.map((series) => (
          <span
            key={series.key}
            className="inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <svg width="26" height="10" viewBox="0 0 26 10">
              <line
                x1="1"
                y1="5"
                x2="25"
                y2="5"
                stroke={series.color}
                strokeDasharray={series.lineStyle === "dashed" ? "6 4" : undefined}
                strokeWidth={series.lineStyle === "dashed" ? 1.7 : 2.2}
              />
            </svg>
            {series.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function useChartTooltip(dataLength: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<{
    index: number;
    clientX: number;
    clientY: number;
  } | null>(null);

  function getIndexFromEvent(e: ReactMouseEvent<HTMLDivElement>) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || dataLength <= 0) return null;
    const x = e.clientX - rect.left;
    if (dataLength === 1) return 0;
    return Math.max(
      0,
      Math.min(dataLength - 1, Math.round((x / rect.width) * (dataLength - 1))),
    );
  }

  function handleMouseMove(e: ReactMouseEvent<HTMLDivElement>) {
    const index = getIndexFromEvent(e);
    if (index === null) return;
    setState({ index, clientX: e.clientX, clientY: e.clientY });
  }

  function handleMouseLeave() {
    setState(null);
  }

  return {
    tooltipState: state,
    containerRef,
    handleMouseMove,
    handleMouseLeave,
  };
}

function ChartTooltip({
  clientX,
  clientY,
  children,
}: {
  clientX: number;
  clientY: number;
  children: ReactNode;
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
    const padding = 8;
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
  }, [children, clientX, clientY]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={tooltipRef}
      className="tdx-terminal-tooltip pointer-events-none fixed z-[200] px-3 py-2 text-xs"
      style={{ left: position.left, top: position.top }}
    >
      {children}
    </div>,
    document.body,
  );
}

function buildLinePath(
  values: readonly number[],
  width: number,
  height: number,
  min: number,
  max: number,
) {
  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / (max - min)) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}
