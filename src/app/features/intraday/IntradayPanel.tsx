import {
  buildAreaPath,
  buildLinePath,
  ChartTooltip,
  LegendDot,
  useChartTooltip,
} from "../../components/ui/ChartPrimitives";
import { buildChartDomain, buildLinearTicks } from "../../dashboardUtils.js";
import { chartPalette } from "../shell/shell.data";
import type { AnonymousTrendProduct, OverlayProduct } from "../../types";
import {
  anonymousTrendProductOptions,
  intradayAllTimeLabels,
  intradayTimeLabels,
} from "./intraday.data";
import {
  anonymousTrendProductLabel,
  buildOverlaySeries,
  getIntradayRateSeries,
  overlayProductLabel,
} from "./intraday.utils";
import { OverlayProductSelect } from "./OverlayProductSelect";

export function IntradayPanel({
  product,
  overlayProduct,
  onProductChange,
  onOverlayChange,
}: {
  product: AnonymousTrendProduct;
  overlayProduct: OverlayProduct;
  onProductChange: (product: AnonymousTrendProduct) => void;
  onOverlayChange: (product: OverlayProduct) => void;
}) {
  const productLabel = anonymousTrendProductLabel(product);
  const mainSeries = getIntradayRateSeries(product);
  const overlaySeries =
    overlayProduct === "none"
      ? null
      : buildOverlaySeries(mainSeries, overlayProduct);
  const barValues = overlaySeries
    ? mainSeries.map((value, index) =>
        Number(((value - overlaySeries[index]) * 100).toFixed(1)),
      )
    : null;
  const { min, max } = buildChartDomain([...mainSeries, ...(overlaySeries ?? [])], {
    paddingRatio: 0.12,
    minSpan: 0.05,
    clampMin: 0,
  });
  const yTicks = buildLinearTicks(min, max, 4);
  const mainPath = buildLinePath(mainSeries, 680, 178, min, max);
  const areaPath = buildAreaPath(mainSeries, 680, 178, min, max);
  const overlayPath = overlaySeries
    ? buildLinePath(overlaySeries, 680, 178, min, max)
    : null;
  const { tooltipState, containerRef, handleMouseMove, handleMouseLeave } =
    useChartTooltip(mainSeries.length);
  const ti = tooltipState?.index ?? null;

  return (
    <section className="grid h-full min-h-0 grid-rows-[auto_1fr] overflow-hidden rounded-xl border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-soft)] px-3 py-2">
        <div className="tk-matrix-card-title shrink-0 whitespace-nowrap">
          鍖垮悕鎴愪氦璧板娍鍥?
        </div>
        <label className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs text-slate-400">
          <span>浜у搧</span>
          <select
            className="rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-page)] px-1.5 py-0.5 text-xs text-slate-200 outline-none"
            value={product}
            onChange={(event) =>
              onProductChange(event.target.value as AnonymousTrendProduct)
            }
          >
            {anonymousTrendProductOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="shrink-0">
          <OverlayProductSelect value={overlayProduct} onChange={onOverlayChange} />
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-3 text-micro text-slate-500">
          <LegendDot color={chartPalette.blue} label={productLabel} />
          {overlaySeries ? (
            <LegendDot
              color={chartPalette.amber}
              label={overlayProductLabel(overlayProduct)}
            />
          ) : null}
        </div>
      </div>
      <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_1.25rem] px-3 pb-2 pt-2">
        <div className="grid min-h-0 grid-cols-[3.4rem_1fr]">
          <div className="flex flex-col justify-between pb-6 pr-2 text-right text-micro text-slate-400">
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
                key={`intraday-grid-${index}`}
                className="absolute inset-x-0 border-t border-dashed border-[color:var(--tk-color-border-divider)]"
                style={{ top: `${(index / 3) * 100}%` }}
              />
            ))}
            <div className="absolute inset-x-0 top-[58%] border-t border-dashed border-[color:var(--tk-color-warning)]" />
            <div className="absolute inset-x-0 bottom-0 top-0">
              <svg
                className="h-full w-full"
                preserveAspectRatio="none"
                viewBox="0 0 680 178"
              >
                <defs>
                  <linearGradient id="intraday-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5ea3ff" stopOpacity="0.24" />
                    <stop offset="100%" stopColor="#5ea3ff" stopOpacity="0.04" />
                  </linearGradient>
                </defs>
                <path d={areaPath} fill="url(#intraday-fill)" />
                <path
                  d={mainPath}
                  fill="none"
                  stroke={chartPalette.blue}
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {overlayPath ? (
                  <path
                    d={overlayPath}
                    fill="none"
                    stroke={chartPalette.amber}
                    strokeWidth="2"
                    strokeDasharray="5 4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : null}
                {ti !== null ? (
                  <line
                    x1={(ti / (mainSeries.length - 1)) * 680}
                    x2={(ti / (mainSeries.length - 1)) * 680}
                    y1={0}
                    y2={178}
                    stroke="#5ea3ff"
                    strokeWidth="1"
                    strokeDasharray="4 3"
                    strokeOpacity="0.6"
                  />
                ) : null}
              </svg>
            </div>
            {tooltipState !== null && ti !== null ? (
              <ChartTooltip
                clientX={tooltipState.clientX}
                clientY={tooltipState.clientY}
              >
                <div className="mb-1 font-medium text-slate-400">
                  {intradayAllTimeLabels[ti]}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: chartPalette.blue }}
                  />
                  <span className="text-slate-400">{productLabel}</span>
                  <span className="ml-1 font-semibold text-slate-100">
                    {mainSeries[ti].toFixed(3)}%
                  </span>
                </div>
                {overlaySeries ? (
                  <div className="flex items-center gap-2">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: chartPalette.amber }}
                    />
                    <span className="text-slate-400">
                      {overlayProductLabel(overlayProduct)}
                    </span>
                    <span className="ml-1 font-semibold text-slate-100">
                      {overlaySeries[ti].toFixed(3)}%
                    </span>
                  </div>
                ) : null}
                {overlaySeries && barValues ? (
                  <div className="mt-1 border-t border-[color:var(--tk-color-border-divider)] pt-1 text-slate-400">
                    鍒╁樊{" "}
                    <span
                      className={`font-semibold ${
                        barValues[ti] >= 0 ? "text-red-400" : "text-emerald-400"
                      }`}
                    >
                      {barValues[ti] > 0 ? "+" : ""}
                      {barValues[ti]}bp
                    </span>
                  </div>
                ) : null}
              </ChartTooltip>
            ) : null}
          </div>
        </div>
        <div className="grid grid-cols-[3rem_1fr] pt-1">
          <div />
          <div className="grid grid-cols-8 text-micro text-slate-400">
            {intradayTimeLabels.map((label) => (
              <div key={label} className="text-center">
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
