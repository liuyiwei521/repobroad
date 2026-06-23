import { useState, type MouseEvent as ReactMouseEvent } from "react";
import {
  personalInstitutionAxisLabelIndexes,
  personalInstitutionCompareData,
  personalInstitutionLabels,
  personalInstitutionModeOptions,
} from "./barometer.data";
import type {
  PersonalInstitutionKey,
  PersonalInstitutionMode,
} from "./barometer.types";

export function PersonalInstitutionCompareCard() {
  const [mode, setMode] = useState<PersonalInstitutionMode>("tenor");
  const [activeKeys, setActiveKeys] = useState<PersonalInstitutionKey[]>([
    "R001",
    "R007",
  ]);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [hoveredLegendKey, setHoveredLegendKey] =
    useState<PersonalInstitutionKey | null>(null);
  const [hoveredSeriesKind, setHoveredSeriesKind] = useState<
    "personal" | "institution" | null
  >(null);

  const items = personalInstitutionCompareData[mode];
  const activeItems = items.filter((item) => activeKeys.includes(item.key));
  const visibleItems = activeItems.length ? activeItems : [items[0]];
  const values = visibleItems.flatMap((item) => [
    ...item.personal,
    ...item.institutionWeighted,
  ]);
  const min = Math.min(...values) - 0.03;
  const max = Math.max(...values) + 0.03;

  const handleModeChange = (nextMode: PersonalInstitutionMode) => {
    setMode(nextMode);
    setActiveKeys(personalInstitutionCompareData[nextMode].map((item) => item.key));
  };

  const toggleItem = (key: PersonalInstitutionKey) => {
    setActiveKeys((current) => {
      if (current.includes(key)) {
        return current.length === 1
          ? current
          : current.filter((item) => item !== key);
      }
      return [...current, key];
    });
  };

  const handleChartMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    setHoverIndex(Math.round(ratio * (personalInstitutionLabels.length - 1)));
  };

  const hoverLeft =
    hoverIndex == null
      ? 0
      : `${(hoverIndex / (personalInstitutionLabels.length - 1)) * 100}%`;
  const hoverRows =
    hoverIndex == null
      ? []
      : visibleItems.map((item) => {
          const personal = item.personal[hoverIndex];
          const institution = item.institutionWeighted[hoverIndex];
          return {
            key: item.key,
            label: item.label,
            color: item.color,
            personal,
            institution,
            spreadBp: Math.round((institution - personal) * 100),
          };
        });
  const isLegendFiltering =
    hoveredLegendKey !== null || hoveredSeriesKind !== null;
  const lineOpacity = (
    itemKey: PersonalInstitutionKey,
    kind: "personal" | "institution",
    baseOpacity: number,
  ) => {
    const keyMatches = hoveredLegendKey === null || hoveredLegendKey === itemKey;
    const kindMatches =
      hoveredSeriesKind === null || hoveredSeriesKind === kind;
    return !isLegendFiltering || (keyMatches && kindMatches)
      ? baseOpacity
      : 0.18;
  };

  return (
    <div className="grid min-h-0 grid-rows-[auto_auto_auto_1fr_auto] overflow-hidden rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-dark-soft)] px-2.5 py-1.5">
        <div className="flex shrink-0 items-baseline gap-1.5">
          <span className="tk-matrix-card-title shrink-0 whitespace-nowrap">
            {"\u4e2a\u4eba & \u673a\u6784"}
          </span>
          <span className="shrink-0 whitespace-nowrap text-micro text-slate-500">
            {"\u5b9e\u7ebf=\u4e2a\u4eba / \u865a\u7ebf=\u673a\u6784"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-micro text-slate-400">
            {"\u622a\u81f3 16:00"}
          </span>
          {personalInstitutionModeOptions.map((option) => (
            <button
              key={option.key}
              className={`rounded-sm border px-1.5 py-0.5 text-micro font-semibold transition ${
                mode === option.key
                  ? "border-[rgba(231,53,58,0.7)] bg-[var(--tdx-red)] text-white"
                  : "border-[color:var(--tk-color-border-panel)] bg-[rgba(15,23,42,0.45)] text-slate-400 hover:text-slate-200"
              }`}
              onClick={() => handleModeChange(option.key)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5 border-b border-[color:var(--tk-color-border-divider)] px-2 py-1">
        <span className="text-micro text-slate-500">
          {mode === "tenor" ? "\u671f\u9650" : "\u62b5\u5238"}
        </span>
        {items.map((item) => {
          const active = activeKeys.includes(item.key);
          return (
            <button
              key={item.key}
              className={`rounded-sm border px-1.5 py-0.5 text-micro font-semibold transition ${
                active
                  ? "text-white"
                  : "border-transparent bg-transparent text-slate-500 hover:text-slate-300"
              }`}
              onClick={() => toggleItem(item.key)}
              style={
                active
                  ? { backgroundColor: item.color, borderColor: item.color }
                  : undefined
              }
              type="button"
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="flex min-w-0 items-center gap-1.5 overflow-hidden border-b border-[color:var(--tk-color-border-divider)] px-2 py-0.5 text-micro text-slate-400">
        <span className="shrink-0 text-slate-500">{"\u56fe\u4f8b"}</span>
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
          {visibleItems.map((item) => (
            <button
              key={item.key}
              className="flex h-5 w-[4.5rem] min-w-0 shrink-0 items-center gap-1 rounded border border-transparent px-1 transition-colors hover:border-[color:var(--tk-color-border-panel)] hover:bg-[var(--tk-color-surface-dark-muted)] hover:text-slate-100"
              onMouseEnter={() => setHoveredLegendKey(item.key)}
              onMouseLeave={() => setHoveredLegendKey(null)}
              type="button"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="min-w-0 truncate text-slate-300">{item.label}</span>
            </button>
          ))}
        </div>
        <LegendDot
          color="var(--tk-color-chart-blue)"
          label="\u4e2a\u4eba"
          interactive
          className="h-5 w-[4.5rem]"
          onMouseEnter={() => setHoveredSeriesKind("personal")}
          onMouseLeave={() => setHoveredSeriesKind(null)}
        />
        <LegendDot
          color="var(--tk-color-chart-gold)"
          label="\u673a\u6784\u52a0\u6743"
          interactive
          className="h-5 w-[4.5rem]"
          onMouseEnter={() => setHoveredSeriesKind("institution")}
          onMouseLeave={() => setHoveredSeriesKind(null)}
        />
      </div>
      <div className="grid min-h-0 grid-cols-[2.3rem_1fr] px-2 pt-2">
        <div className="flex flex-col justify-between pb-4 pr-1 text-right text-micro text-slate-500">
          {buildAxisLabels(min, max, 4).map((tick) => (
            <div key={tick}>{tick}</div>
          ))}
        </div>
        <div
          className="relative min-h-0 overflow-hidden"
          onMouseMove={handleChartMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="absolute inset-x-0 border-t border-dashed border-[color:var(--tk-color-border-divider)]"
              style={{ top: `${(index / 3) * 82}%` }}
            />
          ))}
          <svg
            className="absolute inset-0 h-[calc(100%-14px)] w-full"
            preserveAspectRatio="none"
            viewBox="0 0 120 76"
          >
            {visibleItems.flatMap((item) => [
              <path
                key={`${item.key}-personal`}
                d={buildLinePath(item.personal, 120, 76, min, max)}
                fill="none"
                stroke={item.color}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.7"
                opacity={lineOpacity(item.key, "personal", 1)}
              />,
              <path
                key={`${item.key}-institution`}
                d={buildLinePath(item.institutionWeighted, 120, 76, min, max)}
                fill="none"
                stroke={item.color}
                strokeDasharray="4 3"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.4"
                opacity={lineOpacity(item.key, "institution", 0.92)}
              />,
            ])}
          </svg>
          {hoverIndex != null ? (
            <>
              <div
                className="pointer-events-none absolute top-0 h-[calc(100%-14px)] border-l border-dashed border-slate-400/55"
                style={{ left: hoverLeft }}
              />
              <div
                className="pointer-events-none absolute top-1 z-10 min-w-[9.5rem] rounded border border-slate-600/80 bg-slate-950/95 px-2 py-1 text-micro shadow-lg"
                style={{
                  left:
                    hoverIndex > personalInstitutionLabels.length / 2
                      ? "auto"
                      : `calc(${hoverLeft} + 6px)`,
                  right:
                    hoverIndex > personalInstitutionLabels.length / 2
                      ? `calc(${
                          100 -
                          (hoverIndex /
                            (personalInstitutionLabels.length - 1)) *
                            100
                        }% + 6px)`
                      : "auto",
                }}
              >
                <div className="mb-1 font-semibold text-slate-100">
                  {personalInstitutionLabels[hoverIndex]}
                </div>
                <div className="grid gap-0.5">
                  {hoverRows.map((row) => (
                    <div
                      key={row.key}
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-x-1.5 gap-y-0 text-slate-300"
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: row.color }}
                      />
                      <span className="truncate">{row.label}</span>
                      <span className="font-semibold" style={{ color: row.color }}>
                        {row.spreadBp >= 0 ? "+" : ""}
                        {row.spreadBp}
                        BP
                      </span>
                      <span />
                      <span className="text-slate-500">
                        {"\u4e2a\u4eba"} {row.personal.toFixed(3)}
                      </span>
                      <span className="text-slate-500">
                        {"\u673a\u6784"} {row.institution.toFixed(3)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
          <div className="absolute inset-x-0 bottom-0 grid grid-cols-7 text-micro text-slate-500">
            {personalInstitutionLabels.map((label, index) => (
              <span key={label} className="text-center">
                {personalInstitutionAxisLabelIndexes.has(index) ? label : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MiniChartSkeleton({ activeIndex }: { activeIndex: number }) {
  const stroke =
    activeIndex % 2 === 0 ? "var(--tk-color-chart-blue)" : "var(--tdx-red)";

  return (
    <div className="absolute inset-2 bottom-5 grid min-h-0 grid-rows-[1fr_34%] gap-1">
      <div className="relative overflow-hidden rounded-sm border border-dashed border-[color:var(--tk-color-border-panel)] bg-[rgba(15,23,42,0.42)]">
        <svg
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
          viewBox="0 0 100 60"
        >
          {[15, 30, 45].map((y) => (
            <line
              key={y}
              x1="0"
              x2="100"
              y1={y}
              y2={y}
              stroke="rgba(100,116,139,0.28)"
              strokeDasharray="3 3"
              strokeWidth="0.7"
            />
          ))}
          <path
            d="M2 48 L18 42 L34 18 L52 28 L70 24 L88 35 L100 22"
            fill="none"
            stroke={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <path
            d="M2 48 L18 42 L34 18 L52 28 L70 24 L88 35 L100 22 L100 60 L2 60 Z"
            fill={stroke}
            opacity="0.12"
          />
        </svg>
      </div>
      <div className="grid grid-cols-5 gap-1">
        {[58, 68, 76, 62, 84].map((height, index) => (
          <div
            key={`${height}-${index}`}
            className="relative overflow-hidden rounded-sm bg-[rgba(15,23,42,0.58)]"
          >
            <div
              className={`absolute bottom-0 left-0 right-0 ${
                index % 3 === 0 ? "bg-[var(--tdx-red)]" : "bg-emerald-500"
              }`}
              style={{ height: `${height}%` }}
            />
          </div>
        ))}
      </div>
    </div>
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
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
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
