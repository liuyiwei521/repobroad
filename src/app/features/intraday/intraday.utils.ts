import type {
  AnonymousTrendProduct,
  BaseTrendProduct,
  CompareProduct,
  HistoryRange,
  OverlayProduct,
} from "../../types";
import {
  anonymousIntradaySeriesByProduct,
  anonymousTrendProductOptions,
  baseTrendProductOptions,
  historicalCloseDatasets,
  historicalProductSeries,
  intradayOverlaySeriesByProduct,
  overlayProductOptions,
} from "./intraday.data";

export const trendProductLabel = (product: BaseTrendProduct) =>
  baseTrendProductOptions.find((option) => option.id === product)?.label ?? "R001";

export const anonymousTrendProductLabel = (product: AnonymousTrendProduct) =>
  anonymousTrendProductOptions.find((option) => option.id === product)?.label ??
  "R001";

export function getIntradayRateSeries(product: AnonymousTrendProduct) {
  return anonymousIntradaySeriesByProduct[product];
}

export function overlayProductLabel(product: OverlayProduct) {
  return (
    overlayProductOptions.find((option) => option.id === product)?.label ??
    "涓嶅彔鍔?"
  );
}

export function buildOverlaySeries(
  values: readonly number[],
  product: OverlayProduct,
) {
  if (product === "none") return values.slice();
  const series = intradayOverlaySeriesByProduct[product];
  if (series.length === values.length) return series.slice();
  return values.map((_, index) => {
    const pointIndex = Math.min(
      series.length - 1,
      Math.round((index * (series.length - 1)) / Math.max(values.length - 1, 1)),
    );
    return series[pointIndex];
  });
}

export function buildHistoricalSeries(
  range: HistoryRange,
  product: OverlayProduct | CompareProduct,
) {
  const baseSeries = historicalCloseDatasets[range].close;
  const normalized = product === "none" ? "dr001" : product;

  if (normalized === "dr001") {
    return [...baseSeries];
  }

  const series = historicalProductSeries[range][normalized];
  return series.slice(0, baseSeries.length);
}

export function buildCompactVolumeTicks(max: number) {
  return [max, max * 0.66, max * 0.33, 0].map((value) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return `${Math.round(value)}`;
  });
}

export function buildSpreadAxisLabels(values: number[]) {
  const rawMax = Math.max(...values.map(Math.abs), 0);
  const maxAbs = rawMax < 0.005 ? 0 : Math.max(rawMax * 1.2, 0.05);
  if (maxAbs === 0) {
    return ["0", "0", "0", "0", "0"];
  }
  const step = maxAbs / 2;
  const digits = maxAbs >= 1 ? 1 : maxAbs >= 0.1 ? 2 : 3;
  const format = (value: number) => {
    const fixed = Number(value.toFixed(digits));
    return (Object.is(fixed, -0) ? 0 : fixed).toFixed(digits);
  };
  return [maxAbs, step, 0, -step, -maxAbs].map(format);
}

export function buildAxisTickLabels(labels: readonly string[], maxVisible: number) {
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

export function buildAxisLabels(min: number, max: number, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const value = max - ((max - min) * index) / (count - 1);
    return value.toFixed(3);
  });
}
