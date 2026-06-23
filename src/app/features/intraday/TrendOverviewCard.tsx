import { useState } from "react";
import { TrendLine, buildAreaPath, buildLinePath, LegendDot } from "../../components/ui/ChartPrimitives";
import { chartPalette } from "../shell/shell.data";
import { trendAxisLabels, trendModeTabs, trendPriceTicks, trendRateSeries, trendVolumeColors, trendVolumeSeries, trendVolumeTicks } from "./intraday.data";

function trendModeButtonClass(active: boolean) {
  return active ? "tk-chip tk-chip-active tk-segmented-tab" : "tk-chip tk-segmented-tab";
}

export function TrendOverviewCard() {
  const [activeTrendMode, setActiveTrendMode] = useState<"intraday" | "history" | "comparison">("history");
  const linePath = buildLinePath(trendRateSeries, 860, 320, 1.82, 2.12);
  const areaPath = buildAreaPath(trendRateSeries, 860, 320, 1.82, 2.12);

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_1fr] overflow-hidden rounded-xl border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]">
      <div className="flex items-center justify-between border-b border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-soft)] px-4 py-3">
        <div className="flex gap-2">
          {trendModeTabs.map((tab) => (
            <button
              key={tab.id}
              className={trendModeButtonClass(tab.id === activeTrendMode)}
              onClick={() => setActiveTrendMode(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <div className="tk-title">nonbankBest 路 14</div>
          <button className="tk-button" type="button">
            瀵煎嚭
          </button>
        </div>
      </div>
      <div className="grid min-h-0 grid-rows-[68fr_26fr_auto] gap-0 px-4 pb-4 pt-3">
        <div className="grid min-h-0 grid-cols-[4rem_1fr]">
          <div className="flex flex-col justify-between pb-2 pr-3 pt-6 text-right text-micro text-slate-400">
            {trendPriceTicks.map((tick) => (
              <div key={tick}>{tick.toFixed(3)}</div>
            ))}
          </div>
          <div className="relative min-h-0">
            {trendPriceTicks.map((_, index) => (
              <div
                key={`price-grid-${index}`}
                className="absolute inset-x-0 border-t border-dashed border-[color:var(--tk-color-border-divider)]"
                style={{ top: `${(index / (trendPriceTicks.length - 1)) * 100}%` }}
              />
            ))}
            <div
              className="absolute inset-x-0 border-t-2 border-dashed border-[color:var(--tk-color-warning)]"
              style={{ top: "58%" }}
            />
            <div className="absolute right-3 top-2 flex items-center gap-2 text-xs text-blue-300">
              <span className="h-px w-3 bg-blue-300" />
              <span>鏈€鏂板埄鐜?/span>
            </div>
            <svg
              className="absolute inset-0 h-full w-full"
              preserveAspectRatio="none"
              viewBox="0 0 860 320"
            >
              <path d={areaPath} fill="url(#trend-fill)" />
              <path
                d={linePath}
                fill="none"
                stroke={chartPalette.blue}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5ea3ff" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#5ea3ff" stopOpacity="0.04" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
        <div className="grid min-h-0 grid-cols-[4rem_1fr] border-t border-[color:var(--tk-color-border-divider)] pt-2">
          <div className="flex flex-col justify-between pb-1 pr-3 text-right text-micro text-slate-400">
            {trendVolumeTicks.map((tick) => (
              <div key={tick}>{tick}</div>
            ))}
          </div>
          <div className="relative min-h-0">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={`vol-grid-${index}`}
                className="absolute inset-x-0 border-t border-dashed border-[color:var(--tk-color-border-divider)]"
                style={{ top: `${(index / 4) * 100}%` }}
              />
            ))}
            <div className="absolute inset-x-0 bottom-0 top-0 flex items-end gap-[6px]">
              {trendVolumeSeries.map((value, index) => (
                <div
                  key={`vol-${index}`}
                  className="min-w-0 flex-1 rounded-t-[2px]"
                  style={{
                    height: `${(value / 2000) * 100}%`,
                    backgroundColor: trendVolumeColors[index],
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-[4rem_1fr] pt-2">
          <div />
          <div className="grid grid-cols-10 text-micro text-slate-400">
            {trendAxisLabels.map((label) => (
              <div key={label} className="text-center">
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MiniChartCard({
  title,
  bars = false,
}: {
  title: string;
  bars?: boolean;
}) {
  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_1fr] overflow-hidden rounded-xl border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]">
      <div className="flex items-center justify-between gap-3 border-b border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-soft)] px-3 py-1.5">
        <div className="text-xs font-medium text-slate-200">{title}</div>
        <div className="flex flex-wrap gap-2 text-mini text-slate-500">
          <LegendDot color={chartPalette.emerald} label="1" />
          <LegendDot color={chartPalette.blue} label="7" />
          <LegendDot color={chartPalette.violet} label="14" />
        </div>
      </div>
      <div className="min-h-0 p-1.5">
        <div className="relative h-full min-h-0 overflow-hidden rounded-lg border border-dashed border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(58,81,115,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(58,81,115,0.16)_1px,transparent_1px)] bg-[size:100%_25%,20%_100%]" />
          {bars ? (
            <div className="absolute inset-x-2.5 bottom-2.5 top-2.5 flex items-end gap-1.5">
              {[58, 74, 65, 82, 70].map((height, index) => (
                <div key={`${title}-${index}`} className="flex flex-1 items-end gap-1">
                  {[
                    chartPalette.violet,
                    chartPalette.emerald,
                    chartPalette.blue,
                    chartPalette.pink,
                  ].map((color, barIndex) => (
                    <div
                      key={`${title}-${index}-${barIndex}`}
                      className="w-full rounded-t"
                      style={{
                        height: `${Math.max(16, height - barIndex * 10)}%`,
                        backgroundColor: color,
                        opacity: 0.72,
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="absolute inset-2.5">
              <div className="relative h-full w-full">
                <TrendLine
                  stroke={chartPalette.emerald}
                  points="6,80 24,76 42,72 60,67 78,61 96,64 114,55 132,48 150,44 168,39"
                  mini
                />
                <TrendLine
                  stroke={chartPalette.blue}
                  points="6,58 24,54 42,47 60,50 78,39 96,35 114,28 132,24 150,19 168,15"
                  mini
                />
                <TrendLine
                  stroke={chartPalette.violet}
                  points="6,69 24,65 42,59 60,54 78,51 96,43 114,39 132,33 150,28 168,23"
                  mini
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
