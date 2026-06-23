import type { CfetsInstPeriod, CfetsMetricKey } from "../../types";
import {
  cfetsDenseMetricOptions,
  cfetsInstPeriodLabels,
  cfetsInstTrend,
  cfetsInstitutionOptions,
  cfetsPeriodColors,
} from "./institutionPeriod.data";
import type {
  CfetsChartKind,
  CfetsDenseSeriesData,
  CfetsDimension,
  CfetsInstMetricMode,
  CfetsRepoDirection,
} from "./institutionPeriod.types";

export function fmtAmt(amount: number | null): string {
  if (amount === null) return "-";
  return `${(amount / 100).toFixed(1)}亿`;
}

export function fmtRate(rate: number | null): string {
  if (rate === null) return "-";
  return `${rate.toFixed(4)}%`;
}

export function cfetsModeFromMetricKey(
  metricKey: CfetsMetricKey,
): CfetsInstMetricMode {
  if (metricKey === "buyRate" || metricKey === "sellRate") return "weightedRate";
  if (metricKey === "buyAmt" || metricKey === "sellAmt") return "turnover";
  if (metricKey === "buyBalance" || metricKey === "sellBalance") return "balance";
  if (metricKey === "netInflowAmt" || metricKey === "netInflow") return "netInflow";
  return "balance";
}

export function cfetsMetricKeyForMode(
  metricMode: CfetsInstMetricMode,
  direction: CfetsRepoDirection,
): CfetsMetricKey {
  if (metricMode === "weightedRate") {
    return direction === "repo" ? "buyRate" : "sellRate";
  }
  if (metricMode === "turnover") {
    return direction === "repo" ? "buyAmt" : "sellAmt";
  }
  if (metricMode === "balance") {
    return direction === "repo" ? "buyBalance" : "sellBalance";
  }
  if (metricMode === "crossMonth") {
    return direction === "repo" ? "buyAmt" : "sellAmt";
  }
  return "netInflowAmt";
}

export function cfetsMetricDisplayLabel(metricMode: CfetsInstMetricMode) {
  return cfetsDenseMetricOptions.find((item) => item.key === metricMode)?.label ?? "回购余额";
}

export function cfetsMetricUnit(metricMode: CfetsInstMetricMode) {
  return metricMode === "weightedRate" ? "%" : "亿";
}

export function cfetsMetricIsRate(metricMode: CfetsInstMetricMode) {
  return metricMode === "weightedRate";
}

export function cfetsDefaultChartKindForMetricMode(
  metricMode: CfetsInstMetricMode,
): CfetsChartKind {
  return cfetsMetricIsRate(metricMode) ? "line" : "bar";
}

function cfetsValueScale(metricMode: CfetsInstMetricMode) {
  return metricMode === "weightedRate" ? 1 : 0.01;
}

function cfetsCrossMonthFactor(period: CfetsInstPeriod) {
  return period.includes("M") || period === "R1Y" ? 1 : 0.08;
}

export function formatCfetsDenseValue(
  value: number,
  metricMode: CfetsInstMetricMode,
) {
  if (metricMode === "weightedRate") return `${value.toFixed(3)}%`;
  if (Math.abs(value) >= 1000) return `${Math.round(value).toLocaleString()}亿`;
  return `${value.toFixed(value >= 100 ? 0 : 1)}亿`;
}

export function formatCfetsAxisTick(
  value: number,
  metricMode: CfetsInstMetricMode,
) {
  if (metricMode === "weightedRate") return `${value.toFixed(2)}%`;
  const abs = Math.abs(value);
  if (abs >= 10000) return `${(value / 10000).toFixed(1)}万亿`;
  if (abs >= 1000) return `${Math.round(value).toLocaleString()}亿`;
  return `${value.toFixed(value >= 100 ? 0 : 1)}亿`;
}

export function toggleArrayValue<T extends string | number>(
  items: readonly T[],
  value: T,
): T[] {
  return items.includes(value)
    ? items.filter((item) => item !== value)
    : [...items, value];
}

export function buildCfetsDenseSeries({
  metricMode,
  direction,
  dimension,
  selectedPeriods,
  selectedInstitutions,
}: {
  metricMode: CfetsInstMetricMode;
  direction: CfetsRepoDirection;
  dimension: CfetsDimension;
  selectedPeriods: readonly CfetsInstPeriod[];
  selectedInstitutions: readonly number[];
}): CfetsDenseSeriesData {
  const metricKey = cfetsMetricKeyForMode(metricMode, direction);
  const dates = cfetsInstTrend.R001[metricKey]["6m"].dates;
  const isRate = cfetsMetricIsRate(metricMode);
  const valueScale = cfetsValueScale(metricMode);

  const institutionIndexes = selectedInstitutions.length
    ? [...selectedInstitutions]
    : cfetsInstitutionOptions.map((_, index) => index);
  const institutionSelections = institutionIndexes
    .map((index) => {
      const option = cfetsInstitutionOptions[index];
      return option ? { index, option } : null;
    })
    .filter(
      (
        selection,
      ): selection is {
        index: number;
        option: (typeof cfetsInstitutionOptions)[number];
      } => selection !== null,
    );
  const periods = selectedPeriods.length ? [...selectedPeriods] : [...cfetsInstPeriodLabels];

  function institutionSeries(
    period: CfetsInstPeriod,
    sourceIndex: number,
    factor: number,
  ) {
    const raw = cfetsInstTrend[period][metricKey]["6m"].series[sourceIndex] ?? [];
    const crossMonthFactor = metricMode === "crossMonth" ? cfetsCrossMonthFactor(period) : 1;
    return raw.map((value) =>
      Math.max(0, value * factor * crossMonthFactor * valueScale),
    );
  }

  function combineSeries(seriesList: number[][]) {
    return dates.map((_, index) => {
      const values = seriesList.map((series) => series[index] ?? 0);
      if (isRate) {
        const nonZero = values.filter((value) => value > 0);
        return nonZero.length
          ? nonZero.reduce((sum, value) => sum + value, 0) / nonZero.length
          : 0;
      }
      return values.reduce((sum, value) => sum + value, 0);
    });
  }

  if (dimension === "period") {
    return {
      dates,
      series: periods.map((period) => ({
        key: period,
        label: period,
        color: cfetsPeriodColors[period],
        values: combineSeries(
          institutionSelections.map(({ option }) =>
            institutionSeries(period, option.sourceIndex, option.factor),
          ),
        ),
      })),
    };
  }

  return {
    dates,
    series: institutionSelections.map(({ option }) => {
      return {
        key: option.label,
        label: option.label,
        color: option.color,
        values: combineSeries(
          periods.map((period) =>
            institutionSeries(period, option.sourceIndex, option.factor),
          ),
        ),
      };
    }),
  };
}
