import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { createPortal } from "react-dom";

function useChartTooltip(dataLength: number) {
  const [state, setState] = useState<{
    index: number;
    clientX: number;
    clientY: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
    getIndexFromEvent,
    handleMouseMove,
    handleMouseLeave,
  };
}

function ChartHoverLayer({
  onMouseMove,
  onMouseLeave,
  onClick,
}: {
  onMouseMove: (event: ReactMouseEvent<HTMLDivElement>) => void;
  onMouseLeave: () => void;
  onClick?: (event: ReactMouseEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      className="absolute inset-0 z-20 cursor-crosshair"
      onClick={onClick}
      onMouseLeave={onMouseLeave}
      onMouseMove={onMouseMove}
    />
  );
}

function ChartTooltip({
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
  }, [clientX, clientY, children]);

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

function LegendDot({
  color,
  label,
  interactive = false,
  className = "",
  onMouseEnter,
  onMouseLeave,
}: {
  color: string;
  label: string;
  interactive?: boolean;
  className?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border border-transparent px-1 py-0.5 transition-colors ${className} ${
        interactive
          ? "cursor-default hover:border-[color:var(--tk-color-border-panel)] hover:bg-[var(--tk-color-surface-dark-muted)] hover:text-slate-100"
          : ""
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="min-w-0 truncate">{label}</span>
    </span>
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


function buildAxisLabels(min: number, max: number, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const value = max - ((max - min) * index) / (count - 1);
    return value.toFixed(3);
  });
}


function formatMiniChartValue(value: number, unit = "") {
  if (!Number.isFinite(value)) return "-";
  if (unit === "%") return value.toFixed(3);
  const abs = Math.abs(value);
  if (abs >= 10000) return `${(value / 10000).toFixed(1)}万`;
  if (abs >= 1000) return Math.round(value).toString();
  if (abs >= 100) return Math.round(value).toString();
  if (abs >= 10) return value.toFixed(0);
  return value.toFixed(1);
}


function MiniInstitutionSeriesPreview({
  label,
  series,
  xLabels,
  chartType,
  unit,
  footnote,
}: {
  label: string;
  series: Array<{ key: string; label: string; color: string; values: readonly number[] }>;
  xLabels?: readonly string[];
  chartType: "line" | "stackedBar" | "divergeBar";
  unit: string;
  footnote: string;
}) {
  const [hiddenKeys, setHiddenKeys] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );
  const [tooltipState, setTooltipState] = useState<{
    index: number;
    clientX: number;
    clientY: number;
  } | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartSize, setChartSize] = useState({ width: 260, height: 120 });
  const visibleSeries = series.filter((item) => !hiddenKeys.has(item.key));
  const plottedSeries = visibleSeries.length ? visibleSeries : series;
  const showAsStackedBars = chartType !== "line";
  const dailyTotals = (plottedSeries[0]?.values ?? []).map((_, index) =>
    plottedSeries.reduce((sum, item) => sum + Math.max(0, item.values[index] ?? 0), 0),
  );
  const allValues = showAsStackedBars
    ? dailyTotals.filter((value) => value > 0)
    : plottedSeries.flatMap((item) => item.values).filter((value) => value > 0);
  const min = showAsStackedBars ? 0 : allValues.length ? Math.min(...allValues) : 0;
  const max = allValues.length ? Math.max(...allValues) : 1;
  const range = max - min || 1;
  const width = Math.max(120, Math.round(chartSize.width));
  const height = Math.max(70, Math.round(chartSize.height));
  const plotLeft = unit === "%" ? 40 : unit === "亿" || unit === "万" ? 44 : 36;
  const plotRight = 10;
  const plotTop = 10;
  const plotBottom = 20;
  const plotWidth = Math.max(20, width - plotLeft - plotRight);
  const plotHeight = Math.max(20, height - plotTop - plotBottom);
  const yAxisLabels = buildAxisLabels(min, max, 4);
  const pointCount = plottedSeries[0]?.values.length ?? 1;
  const tooltipIndex = tooltipState?.index ?? null;
  const tooltipX =
    tooltipIndex === null
      ? null
      : showAsStackedBars
        ? plotLeft + ((tooltipIndex + 0.5) / Math.max(pointCount, 1)) * plotWidth
        : plotLeft + (tooltipIndex / Math.max(pointCount - 1, 1)) * plotWidth;
  const tooltipTotal =
    tooltipIndex === null
      ? 0
      : showAsStackedBars
        ? dailyTotals[tooltipIndex] ?? 0
        : plottedSeries.reduce((sum, item) => sum + Math.max(0, item.values[tooltipIndex] ?? 0), 0);
  const tooltipRows =
    tooltipIndex === null
      ? []
      : plottedSeries
          .map((item) => ({
            ...item,
            value: item.values[tooltipIndex] ?? 0,
          }))
          .filter((item) => item.value > 0)
          .sort((a, b) => b.value - a.value);
  const xLabelIndexes = [0, Math.floor(pointCount / 2), Math.max(pointCount - 1, 0)];
  useEffect(() => {
    const node = chartRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const updateSize = () => {
      const rect = node.getBoundingClientRect();
      setChartSize((current) => {
        const next = {
          width: Math.max(120, Math.round(rect.width)),
          height: Math.max(70, Math.round(rect.height)),
        };
        return current.width === next.width && current.height === next.height
          ? current
          : next;
      });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  function toggleSeries(key: string) {
    setHiddenKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function buildPreviewPath(values: readonly number[]) {
    return values
      .map((value, index) => {
        const x = plotLeft + (index / Math.max(values.length - 1, 1)) * plotWidth;
        const y = plotTop + plotHeight - ((value - min) / range) * plotHeight;
        return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }

  function handlePreviewMouseMove(event: ReactMouseEvent<HTMLDivElement>) {
    const rect = chartRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || pointCount <= 0) return;
    const viewX = ((event.clientX - rect.left) / rect.width) * width;
    const clampedX = Math.max(plotLeft, Math.min(plotLeft + plotWidth, viewX));
    const ratio = (clampedX - plotLeft) / Math.max(plotWidth, 1);
    const index = showAsStackedBars
      ? Math.min(pointCount - 1, Math.max(0, Math.floor(ratio * pointCount)))
      : Math.min(pointCount - 1, Math.max(0, Math.round(ratio * (pointCount - 1))));
    setTooltipState({ index, clientX: event.clientX, clientY: event.clientY });
  }

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] p-2">
      <div className="mb-1 flex items-center justify-between gap-2 text-micro">
        <span className="truncate font-semibold text-slate-300">{label}</span>
        <span className="shrink-0 font-mono text-slate-500">
          {visibleSeries.length}/{series.length}
        </span>
      </div>
      <div className="flex gap-x-2 overflow-x-auto whitespace-nowrap pb-1 text-micro [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {series.map((item) => {
          const hidden = hiddenKeys.has(item.key);
          return (
            <button
              key={item.key}
              className={`inline-flex items-center gap-1 whitespace-nowrap transition-opacity ${
                hidden ? "opacity-35" : "opacity-100"
              }`}
              type="button"
              title={hidden ? `显示${item.label}` : `隐藏${item.label}`}
              onClick={() => toggleSeries(item.key)}
            >
              <span
                className="h-1.5 w-3 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-slate-400">{item.label}</span>
            </button>
          );
        })}
      </div>
      <div className="min-h-0 flex-1">
        <div
          ref={chartRef}
          className="relative h-full min-h-0 min-w-0 cursor-crosshair"
          onMouseLeave={() => setTooltipState(null)}
          onMouseMove={handlePreviewMouseMove}
        >
        <svg
          className="block h-full w-full"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          <line
            x1={plotLeft}
            x2={plotLeft}
            y1={plotTop}
            y2={plotTop + plotHeight}
            stroke="#263855"
            strokeWidth="0.7"
          />
          <line
            x1={plotLeft}
            x2={plotLeft + plotWidth}
            y1={plotTop + plotHeight}
            y2={plotTop + plotHeight}
            stroke="#263855"
            strokeWidth="0.7"
          />
          {yAxisLabels.map((label, index) => {
            const y = plotTop + (index / Math.max(yAxisLabels.length - 1, 1)) * plotHeight;
            return (
              <Fragment key={label}>
                <line
                  x1={plotLeft}
                  x2={plotLeft + plotWidth}
                  y1={y}
                  y2={y}
                  stroke="#1d3250"
                  strokeWidth="0.5"
                  opacity="0.65"
                />
                <text
                  x={plotLeft - 5}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="8"
                  fill="#64748b"
                >
                  {formatMiniChartValue(Number(label), unit)}
                </text>
              </Fragment>
            );
          })}
          {xLabelIndexes.map((index) => {
            const x =
              showAsStackedBars
                ? plotLeft + ((index + 0.5) / Math.max(pointCount, 1)) * plotWidth
                : plotLeft + (index / Math.max(pointCount - 1, 1)) * plotWidth;
            const axisLabel =
              xLabels?.[index] ??
              (index === 0 ? "起点" : index === xLabelIndexes[xLabelIndexes.length - 1] ? "最新" : "中段");
            return (
              <text
                key={index}
                x={x}
                y={plotTop + plotHeight + 12}
                textAnchor={index === 0 ? "start" : index === xLabelIndexes[xLabelIndexes.length - 1] ? "end" : "middle"}
                fontSize="8"
                fill="#64748b"
              >
                {axisLabel}
              </text>
            );
          })}
          {showAsStackedBars ? (
            <g>
              {dailyTotals.map((total, dateIndex) => {
                let stackY = plotTop + plotHeight;
                const slot = plotWidth / Math.max(pointCount, 1);
                const x = plotLeft + (dateIndex + 0.5) * slot;
                const barWidth = Math.max(3, Math.min(11, slot - 2));
                return (
                  <g key={dateIndex}>
                    {plottedSeries.map((item) => {
                      const value = Math.max(0, item.values[dateIndex] ?? 0);
                      if (value <= 0 || total <= 0) return null;
                      const segmentHeight = (value / max) * plotHeight;
                      stackY -= segmentHeight;
                      return (
                        <rect
                          key={item.key}
                          x={x - barWidth / 2}
                          y={stackY}
                          width={barWidth}
                          height={Math.max(0.6, segmentHeight)}
                          fill={item.color}
                          opacity="0.86"
                          rx="0.9"
                        />
                      );
                    })}
                  </g>
                );
              })}
            </g>
          ) : (
            series.map((item) =>
              hiddenKeys.has(item.key) ? null : (
                <path
                  key={item.key}
                  d={buildPreviewPath(item.values)}
                  fill="none"
                  stroke={item.color}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.7"
                  opacity="0.92"
                />
              ),
            )
          )}
          {tooltipX !== null ? (
            <line
              x1={tooltipX}
              x2={tooltipX}
              y1={plotTop}
              y2={plotTop + plotHeight}
              stroke="var(--tk-color-brand-primary)"
              strokeDasharray="4 4"
              strokeOpacity="0.78"
              strokeWidth="0.8"
            />
          ) : null}
        </svg>
        {tooltipState !== null && tooltipIndex !== null ? (
          <ChartTooltip
            clientX={tooltipState.clientX}
            clientY={tooltipState.clientY}
          >
            <div className="mb-1 font-semibold text-slate-200">
              {xLabels?.[tooltipIndex] ?? `#${tooltipIndex + 1}`}
            </div>
            <div className="mb-1 flex items-center justify-between gap-5 border-b border-[color:var(--tk-color-border-divider-dark)] pb-1 text-mini">
              <span className="text-slate-400">合计</span>
              <span className="font-mono font-semibold text-slate-100">
                {formatMiniChartValue(tooltipTotal, unit)}
              </span>
            </div>
            <div className="grid gap-1">
              {tooltipRows.slice(0, 8).map((item) => (
                <div key={item.key} className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-400">{item.label}</span>
                  <span className="ml-auto pl-3 font-mono font-semibold text-slate-100">
                    {formatMiniChartValue(item.value, unit)}
                  </span>
                </div>
              ))}
              {tooltipRows.length > 8 ? (
                <div className="text-slate-500">其余 {tooltipRows.length - 8} 项略</div>
              ) : null}
            </div>
          </ChartTooltip>
        ) : null}
        </div>
      </div>
      <div className="mt-1 truncate text-micro text-slate-500">{footnote}</div>
    </div>
  );
}


function auxTabClass(active: boolean) {
  return active
    ? "tk-chip tk-chip-active tk-segmented-tab"
    : "tk-chip tk-segmented-tab";
}

export {
  ChartHoverLayer,
  ChartTooltip,
  LegendDot,
  MiniInstitutionSeriesPreview,
  auxTabClass,
  buildAxisLabels,
  buildLinePath,
  formatMiniChartValue,
  useChartTooltip,
};
