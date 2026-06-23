import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function TrendLine({
  stroke,
  points,
  mini = false,
}: {
  stroke: string;
  points: string;
  mini?: boolean;
}) {
  return (
    <svg
      className="h-full w-full"
      preserveAspectRatio="none"
      viewBox={mini ? "0 0 180 70" : "0 0 304 90"}
    >
      <polyline
        fill="none"
        points={points}
        stroke={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={mini ? 2 : 2.5}
        strokeOpacity={0.92}
      />
    </svg>
  );
}

export function useChartTooltip(dataLength: number) {
  const [state, setState] = useState<{
    index: number;
    clientX: number;
    clientY: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  function getIndexFromEvent(e: React.MouseEvent<HTMLDivElement>) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || dataLength <= 0) return null;
    const x = e.clientX - rect.left;
    if (dataLength === 1) return 0;
    return Math.max(
      0,
      Math.min(dataLength - 1, Math.round((x / rect.width) * (dataLength - 1))),
    );
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
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

export function ChartHoverLayer({
  onMouseMove,
  onMouseLeave,
  onClick,
}: {
  onMouseMove: (event: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave: () => void;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
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

export function ChartTooltip({
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

export function LegendDot({
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

export function buildLinePath(
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

export function buildAreaPath(
  values: readonly number[],
  width: number,
  height: number,
  min: number,
  max: number,
) {
  const line = buildLinePath(values, width, height, min, max);
  return `${line} L ${width} ${height} L 0 ${height} Z`;
}
