import test from "node:test";
import assert from "node:assert/strict";

import {
  buildBankHistorySeries,
  buildChartDomain,
  buildLinearTicks,
  buildSeededWalk,
  buildXrepoTodayLabels,
  generateTradingDates,
  getSentimentState,
  getXrepoHistoryPointCount,
  quoteTenorDisplayLabel,
  toggleMultiSelect,
} from "./dashboardUtils.js";

test("quoteTenorDisplayLabel maps latest tenor buckets", () => {
  assert.equal(quoteTenorDisplayLabel("R001"), "1d");
  assert.equal(quoteTenorDisplayLabel("R014"), "14d");
  assert.equal(quoteTenorDisplayLabel("R021"), "21d");
  assert.equal(quoteTenorDisplayLabel("R028"), "其他");
  assert.equal(quoteTenorDisplayLabel("R1M"), "R1M");
});

test("toggleMultiSelect adds and removes values predictably", () => {
  assert.deepEqual(toggleMultiSelect([], "工行"), ["工行"]);
  assert.deepEqual(toggleMultiSelect(["工行"], "工行"), []);
  assert.deepEqual(toggleMultiSelect(["工行"], "农行"), ["工行", "农行"]);
});

test("getXrepoHistoryPointCount covers today and compact long-range cases", () => {
  assert.equal(getXrepoHistoryPointCount("today", true), 10);
  assert.equal(getXrepoHistoryPointCount("today", false), 14);
  assert.equal(getXrepoHistoryPointCount("1m", false), 22);
  assert.equal(getXrepoHistoryPointCount("6m", true), 36);
});

test("buildXrepoTodayLabels keeps intraday endpoints visible", () => {
  assert.deepEqual(buildXrepoTodayLabels(0), []);
  assert.deepEqual(buildXrepoTodayLabels(1), ["09:00"]);
  assert.deepEqual(buildXrepoTodayLabels(4), ["09:00", "10:00", "13:30", "15:30"]);
});

test("getSentimentState returns stable status bands", () => {
  assert.equal(getSentimentState(66).status, "宽松");
  assert.equal(getSentimentState(60).status, "宽松");
  assert.equal(getSentimentState(51).status, "平衡");
  assert.equal(getSentimentState(45).status, "平衡");
  assert.equal(getSentimentState(44).status, "紧张");
  assert.equal(getSentimentState(30).status, "紧张");
  assert.equal(getSentimentState(29).status, "异常紧张");
  assert.equal(getSentimentState(10).status, "异常紧张");
});

test("buildChartDomain keeps small spreads readable without oversized blanks", () => {
  assert.deepEqual(buildChartDomain([1.33, 1.35, 1.34]), {
    min: 1.3268,
    max: 1.3532,
  });
  assert.deepEqual(buildChartDomain([1.4, 1.4], { minSpan: 0.02 }), {
    min: 1.39,
    max: 1.41,
  });
  assert.deepEqual(buildChartDomain([1.31, 1.35], { clampMin: 1.32 }), {
    min: 1.32,
    max: 1.3532,
  });
});

test("buildLinearTicks returns evenly spaced axis ticks", () => {
  assert.deepEqual(buildLinearTicks(1.32, 1.36, 4), [1.36, 1.347, 1.333, 1.32]);
  assert.deepEqual(buildLinearTicks(10, 40, 3, 0), [40, 25, 10]);
});

test("buildSeededWalk stays reproducible and respects anchor bounds", () => {
  const series = buildSeededWalk(2.1, 6, 0.03, 17, {
    clampMin: 2,
    clampMax: 2.2,
    precision: 3,
    anchorBand: 0.05,
  });

  assert.deepEqual(
    series,
    buildSeededWalk(2.1, 6, 0.03, 17, {
      clampMin: 2,
      clampMax: 2.2,
      precision: 3,
      anchorBand: 0.05,
    }),
  );
  assert.equal(series.at(-1), 2.1);
  assert.ok(series.every((value) => value >= 2.05 && value <= 2.15));
});

test("generateTradingDates skips weekends for market history", () => {
  assert.deepEqual(generateTradingDates("2026-06-23", 5), [
    "6/17",
    "6/18",
    "6/19",
    "6/22",
    "6/23",
  ]);
});

test("buildBankHistorySeries anchors the latest point to the selected quote", () => {
  const series = buildBankHistorySeries("工商银行", "2026-06-23", 8, {
    anchorNonBank: 2.04,
    anchorBank: 2.1,
    referenceNonBank: 2.04,
    referenceBank: 2.12,
  });

  assert.equal(series.length, 8);
  assert.equal(series.at(-1)?.nonBank, 2.04);
  assert.equal(series.at(-1)?.bankRate, 2.1);
  assert.ok(series.every((point) => point.bankRate > point.nonBank));
  assert.ok(series.every((point) => point.spread >= 1));
  assert.deepEqual(
    series,
    buildBankHistorySeries("工商银行", "2026-06-23", 8, {
      anchorNonBank: 2.04,
      anchorBank: 2.1,
      referenceNonBank: 2.04,
      referenceBank: 2.12,
    }),
  );
});
