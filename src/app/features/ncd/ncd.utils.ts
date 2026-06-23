import type { QuoteTenorFilter } from "../../types";
import type { NcdPeriod } from "./ncd.types";

export function quoteTenorToNcdPeriod(tenor: QuoteTenorFilter): NcdPeriod {
  if (tenor === "R007") return "3M";
  if (tenor === "R014") return "6M";
  if (tenor === "R021") return "9M";
  if (tenor === "R028") return "1Y";
  return "1M";
}

export function shiftSeries(base: number[], offset: number): number[] {
  return base.map((v) => parseFloat((v + offset).toFixed(4)));
}

export function generateTradingDates(endDate: string, count: number): string[] {
  const [year, month, day] = endDate.split("-").map(Number);
  const end = new Date(year, month - 1, day);
  const dates: string[] = [];
  let cursor = new Date(end);

  while (dates.length < count) {
    const weekday = cursor.getDay();
    if (weekday !== 0 && weekday !== 6) {
      dates.unshift(
        `${cursor.getMonth() + 1}/${String(cursor.getDate()).padStart(2, "0")}`,
      );
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  return dates;
}

export function randomWalk(
  anchor: number,
  count: number,
  dailyVol: number,
  _seed: number,
): number[] {
  const result: number[] = new Array(count);
  result[count - 1] = anchor;
  for (let index = count - 2; index >= 0; index -= 1) {
    const r = Math.random();
    let jump: number;
    if (r < 0.4) {
      jump = (Math.random() - 0.5) * dailyVol * 1.5;
    } else if (r < 0.78) {
      jump = (Math.random() - 0.5) * dailyVol * 7;
    } else {
      jump = (Math.random() - 0.5) * dailyVol * 18;
    }
    result[index] = Math.max(0, Number((result[index + 1] + jump).toFixed(4)));
  }
  return result;
}
