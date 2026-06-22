import test from "node:test";
import assert from "node:assert/strict";

import {
  buildChartDomain,
  buildLinearTicks,
  buildXrepoTodayLabels,
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
  assert.equal(getXrepoHistoryPointCount("today", true), 16);
  assert.equal(getXrepoHistoryPointCount("today", false), 20);
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
  assert.equal(getSentimentState(51).status, "一般");
  assert.equal(getSentimentState(44).status, "紧张");
  assert.equal(getSentimentState(41).status, "紧张");
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
