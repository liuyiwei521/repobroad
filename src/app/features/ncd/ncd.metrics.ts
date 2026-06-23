import type { ModuleEntryMetric, QuoteTenorFilter } from "../../types";
import { chartPalette } from "../shell/shell.data";
import {
  ncdOneYearSeries,
  ncdPrimaryPeriods,
  ncdThreeMonthSeries,
  ncdTrendSeries,
} from "./ncd.data";
import type { NcdPeriod } from "./ncd.types";
import { quoteTenorToNcdPeriod } from "./ncd.utils";

export function getNcdModuleEntryData(
  tenorFilter: QuoteTenorFilter = "all",
): ModuleEntryMetric {
  const ncdPeriod = quoteTenorToNcdPeriod(tenorFilter);
  const periodIndex = ncdPrimaryPeriods.indexOf(ncdPeriod as NcdPeriod);
  const oneMonth = ncdTrendSeries.at(-1) ?? 0;
  const threeMonth = ncdThreeMonthSeries.at(-1) ?? 0;
  const oneYear = ncdOneYearSeries.at(-1) ?? 0;
  const mappedValue =
    ncdPeriod === "1M"
      ? oneMonth
      : ncdPeriod === "3M"
        ? threeMonth
        : ncdPeriod === "1Y"
          ? oneYear
          : oneMonth + Math.max(periodIndex, 0) * 0.025;

  return {
    summary:
      tenorFilter === "all"
        ? `1M ${oneMonth.toFixed(3)}% / 3M ${threeMonth.toFixed(3)}% / 1Y ${oneYear.toFixed(3)}%`
        : `${tenorFilter} 映射 ${ncdPeriod} ${mappedValue.toFixed(3)}%`,
    badge: tenorFilter === "all" ? "近14日" : ncdPeriod,
    rows:
      tenorFilter === "all"
        ? [
            ["1M", `${oneMonth.toFixed(3)}%`],
            ["3M", `${threeMonth.toFixed(3)}%`],
            ["1Y", `${oneYear.toFixed(3)}%`],
          ]
        : [
            [ncdPeriod, `${mappedValue.toFixed(3)}%`],
            ["映射筛选", tenorFilter],
          ],
    chips:
      tenorFilter === "all"
        ? [
            { label: "1M", value: `${oneMonth.toFixed(3)}%`, tone: "neutral" as const },
            { label: "3M", value: `${threeMonth.toFixed(3)}%`, tone: "neutral" as const },
            { label: "1Y", value: `${oneYear.toFixed(3)}%`, tone: "neutral" as const },
          ]
        : [
            { label: ncdPeriod, value: `${mappedValue.toFixed(3)}%`, tone: "neutral" as const },
            { label: "口径", value: "一级", tone: "muted" as const },
          ],
    trendValues: ncdTrendSeries,
    trendColor: chartPalette.amber,
    trendLabel: `一级 ${ncdPeriod}`,
  };
}
