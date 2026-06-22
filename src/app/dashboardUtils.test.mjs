import test from "node:test";
import assert from "node:assert/strict";

import {
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
