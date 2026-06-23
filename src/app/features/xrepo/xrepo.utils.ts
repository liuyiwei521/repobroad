import {
  buildXrepoTodayLabels,
  generateTradingDates,
  getXrepoHistoryPointCount,
} from "../../dashboardUtils.js";
import type {
  CompareProduct,
  ModuleEntryMetric,
  QuoteTenorFilter,
  SpreadProduct,
  XrepoHistoryRange,
} from "../../types";
import { xrepoCompareProductOptions, xrepoSummarySection } from "./xrepo.data";

const TODAY_STR = "2026-05-10";

export const xrepoCompareAnchors: Record<SpreadProduct, number> = {
  dr001: 1.26,
  dr007: 1.31,
  gc007: 1.36,
  r007: 1.39,
};

const quoteTenorSuffix = (tenor: QuoteTenorFilter) =>
  tenor === "all" ? null : tenor.replace(/^R/, "");

const textMatchesQuoteTenor = (text: string, tenor: QuoteTenorFilter) => {
  const suffix = quoteTenorSuffix(tenor);
  if (!suffix) return true;
  const normalized = text.replace(/[-_\s]/g, "").toUpperCase();
  return normalized.includes(suffix);
};

function filterRowsByQuoteTenor<T extends readonly string[]>(
  rows: readonly T[],
  tenor: QuoteTenorFilter,
  columns: readonly number[],
) {
  if (tenor === "all") return [...rows];
  return rows.filter((row) =>
    columns.some((column) => textMatchesQuoteTenor(row[column] ?? "", tenor)),
  );
}

export const xrepoR001Rows = <T extends readonly string[]>(rows: readonly T[]) =>
  rows.filter((row) => row[0]?.toUpperCase().includes("R001"));

export function getXrepoRowsByTenor(
  tenorFilter: QuoteTenorFilter,
  rows: readonly (readonly string[])[] = xrepoSummarySection.rows,
) {
  return filterRowsByQuoteTenor(xrepoR001Rows(rows), tenorFilter, [0]);
}

export function buildXrepoMetric(
  tenorFilter: QuoteTenorFilter = "all",
): ModuleEntryMetric {
  const rows = getXrepoRowsByTenor(tenorFilter);
  const first = rows[0];
  const mini = rows.find((row) => row[0]?.includes("mini"));
  const label = tenorFilter === "all" ? first?.[0] ?? "XREPO" : tenorFilter;

  return {
    summary: first
      ? `${label} 正 ${first[1]}@${first[2]} · 逆 ${first[4]}@${first[3]}`
      : `${label} 相关报价待更新`,
    badge: label,
    rows: rows.length
      ? [
          [
            label,
            first ? `正 ${first[1]}@${first[2]} / 逆 ${first[4]}@${first[3]}` : "-",
          ],
          [
            mini?.[0] ?? `${label}-mini`,
            mini ? `正 ${mini[1]}@${mini[2]} / 逆 ${mini[4]}@${mini[3]}` : "-",
          ],
        ]
      : [[label, "暂无报价"]],
    chips: [
      { label: "正利率", value: first?.[2] ?? "-", tone: "alert" },
      { label: "逆利率", value: first?.[3] ?? "-", tone: "good" },
      { label: "逆量", value: first?.[4] ?? "-", tone: "neutral" },
    ],
    detailRows: rows.length
      ? [
          [
            label,
            first ? `正 ${first[1]} / 逆 ${first[4]}` : "-",
            first ? `${first[2]} / ${first[3]}` : undefined,
          ],
          [
            mini?.[0] ?? `${label}-mini`,
            mini ? `正 ${mini[1]} / 逆 ${mini[4]}` : "-",
            mini ? `${mini[2]} / ${mini[3]}` : undefined,
          ],
        ]
      : [[label, "暂无报价"]],
  };
}

export function xrepoHistoryPointCount(
  range: XrepoHistoryRange,
  compact: boolean,
) {
  return getXrepoHistoryPointCount(range, compact);
}

export function buildXrepoHistoryLabels(
  range: XrepoHistoryRange,
  count: number,
) {
  return range === "today"
    ? buildXrepoTodayLabels(count)
    : generateTradingDates(TODAY_STR, count);
}

export function xrepoCompareLabel(compareProduct: CompareProduct) {
  return (
    xrepoCompareProductOptions.find((option) => option.id === compareProduct)
      ?.label ?? "不对比"
  );
}

function randomWalk(
  anchor: number,
  count: number,
  dailyVol: number,
  _seed: number,
): number[] {
  const result: number[] = new Array(count);
  result[count - 1] = anchor;
  for (let index = count - 2; index >= 0; index -= 1) {
    const random = Math.random();
    let jump: number;
    if (random < 0.4) {
      jump = (Math.random() - 0.5) * dailyVol * 1.5;
    } else if (random < 0.78) {
      jump = (Math.random() - 0.5) * dailyVol * 7;
    } else {
      jump = (Math.random() - 0.5) * dailyVol * 18;
    }
    result[index] = Math.max(0, Number((result[index + 1] + jump).toFixed(4)));
  }
  return result;
}

export function buildXrepoHistoryComparison(
  contractName: string,
  count: number,
  compareProduct: CompareProduct,
  range: XrepoHistoryRange,
) {
  const seed = contractName
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const labels = buildXrepoHistoryLabels(range, count);
  const rangeSeed =
    range === "today" ? 7 : range === "5d" ? 11 : range === "1m" ? 29 : 61;
  const drift = range === "today" ? 0.008 : 0.014;
  const compareDrift = range === "today" ? 0.007 : 0.012;
  const anchor = contractName.includes("mini")
    ? 1.38
    : 1.34 + (seed % 8) * 0.006;
  const current = randomWalk(anchor, count, drift, seed + rangeSeed).map(
    (value, index) =>
      Number(
        (
          value +
          (range === "today" ? Math.sin((index + seed) * 0.72) * 0.004 : 0)
        ).toFixed(4),
      ),
  );
  const compare =
    compareProduct === "none"
      ? null
      : randomWalk(
          xrepoCompareAnchors[compareProduct] + (seed % 3) * 0.004,
          count,
          compareDrift,
          seed + rangeSeed + compareProduct.length * 17,
        ).map((value, index) =>
          Number(
            (
              value +
              Math.sin((index + seed) * (range === "today" ? 0.82 : 0.55)) *
                (range === "today" ? 0.004 : 0.006)
            ).toFixed(4),
          ),
        );
  const spread = compare
    ? current.map((value, index) =>
        Number(((value - compare[index]) * 100).toFixed(1)),
      )
    : null;
  const volumeBase = contractName.includes("mini") ? 72 : 680;
  const volumeSwing = contractName.includes("mini") ? 18 : 145;
  const volumeScale = range === "today" ? 0.72 : 1;
  const volume = randomWalk(
    volumeBase * volumeScale,
    count,
    volumeSwing * volumeScale,
    seed + 9,
  ).map((value) => Math.max(8, Math.round(value)));

  return { labels, current, compare, spread, volume };
}
