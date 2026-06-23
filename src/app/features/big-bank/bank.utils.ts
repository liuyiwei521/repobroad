import { buildBankHistorySeries as createBankHistorySeries, buildLinearTicks } from "../../dashboardUtils.js";
import { BANK_TENOR_LABEL, type BankRateRow, type BankTenor } from "../../types";
import { TODAY_STR } from "../shell/shell.data";

export function makeEmptyBankRow(institution: string, tenor: BankTenor): BankRateRow {
  return {
    institution,
    tenor,
    nonBankRate: "",
    refNonBankRate: "",
    deltaNonBankBp: "",
    bankRate: "",
    refBankRate: "",
    deltaBp: "",
    updatedAt: "",
    hasQuote: false,
  };
}

export function deriveHasQuote(row: BankRateRow): boolean {
  return (
    (row.nonBankRate ?? "").trim() !== "" || (row.bankRate ?? "").trim() !== ""
  );
}

export function parseRatePercent(value: string): number | null {
  const parsed = parseFloat(value.replace("%", ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatBpValue(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${rounded > 0 ? "+" : ""}${text}bp`;
}

export function formatDeltaValue(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${rounded > 0 ? "+" : ""}${text}`;
}

export function rateDeltaValue(rate: string, refRate: string): string | null {
  const current = parseRatePercent(rate);
  const reference = parseRatePercent(refRate);
  if (current === null || reference === null) return null;
  return formatDeltaValue((current - reference) * 100);
}

export function bankRateSpread(row: BankRateRow): string {
  const nonBankRate = parseRatePercent(row.nonBankRate);
  const bankRate = parseRatePercent(row.bankRate);
  if (nonBankRate === null || bankRate === null) return "--";
  return formatBpValue((bankRate - nonBankRate) * 100);
}

export function rateWithDelta(rate: string, refRate: string): string {
  const current = parseRatePercent(rate);
  if (current === null) return "--";
  return `${rate.trim()}(${rateDeltaValue(rate, refRate) ?? "--"})`;
}

export function bankHistorySessionLabel(tenor?: string) {
  if (!tenor) return "当日";
  return /ON|001|隔夜|1天/.test(tenor) ? "隔夜" : "当日";
}

export function normalizeBankTenor(tenor?: string): BankTenor | undefined {
  if (!tenor) return undefined;
  if (tenor === "ON" || tenor === BANK_TENOR_LABEL.ON || tenor === "R001") {
    return "ON";
  }
  if (tenor === "7D" || tenor === BANK_TENOR_LABEL["7D"] || tenor === "R007") {
    return "7D";
  }
  if (/ON|001/i.test(tenor)) return "ON";
  if (/7D|007/i.test(tenor)) return "7D";
  return undefined;
}

export function findBankQuoteAnchor(
  rows: readonly BankRateRow[],
  bank: string,
  tenor?: string,
) {
  const matchingRows = rows.filter((row) => row.institution === bank);
  const normalizedTenor = normalizeBankTenor(tenor);
  if (normalizedTenor) {
    const exact = matchingRows.find(
      (row) => row.tenor === normalizedTenor && row.hasQuote,
    );
    if (exact) return exact;
  }
  return matchingRows.find((row) => row.hasQuote) ?? matchingRows[0] ?? null;
}

export function buildAnchoredBankHistorySeries(
  bank: string,
  rows: readonly BankRateRow[],
  tenor?: string,
) {
  const anchorRow = findBankQuoteAnchor(rows, bank, tenor);
  return createBankHistorySeries(bank, TODAY_STR, 28, {
    anchorNonBank:
      anchorRow ? (parseRatePercent(anchorRow.nonBankRate) ?? undefined) : undefined,
    anchorBank:
      anchorRow ? (parseRatePercent(anchorRow.bankRate) ?? undefined) : undefined,
    referenceNonBank:
      anchorRow
        ? (parseRatePercent(anchorRow.refNonBankRate) ?? undefined)
        : undefined,
    referenceBank:
      anchorRow ? (parseRatePercent(anchorRow.refBankRate) ?? undefined) : undefined,
  });
}

export type BankHistoryPoint = ReturnType<typeof createBankHistorySeries>[number];

export function bankTrendPath(
  values: readonly number[],
  width: number,
  height: number,
  min: number,
  max: number,
  margin: { left: number; right: number; top: number; bottom: number },
) {
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  return values
    .map((value, index) => {
      const x = margin.left + (index / (values.length - 1)) * plotWidth;
      const y = margin.top + (1 - (value - min) / (max - min)) * plotHeight;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export function bankTrendX(
  index: number,
  count: number,
  width: number,
  margin: { left: number; right: number },
) {
  return margin.left + (index / (count - 1)) * (width - margin.left - margin.right);
}

export function bankTrendY(
  value: number,
  height: number,
  min: number,
  max: number,
  margin: { top: number; bottom: number },
) {
  return margin.top + (1 - (value - min) / (max - min)) * (height - margin.top - margin.bottom);
}

export function bankChartTicks(min: number, max: number, count = 4) {
  return buildLinearTicks(min, max, count).map((tick) => Number(tick.toFixed(3)));
}

export function bankChartXTickIndices(count: number) {
  return Array.from(
    new Set([0, Math.floor((count - 1) / 3), Math.floor(((count - 1) * 2) / 3), count - 1]),
  );
}

export function buildRoundedTicks(max: number, count = 3) {
  return Array.from(
    new Set(
      buildLinearTicks(0, Math.max(1, max), count).map((tick) => Math.round(tick)),
    ),
  ).sort((left, right) => left - right);
}
