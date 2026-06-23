import type {
  BarometerInstitutionProfile,
  BarometerMetric,
  BarometerRange,
  BarometerSeries,
  BarometerSlice,
  PersonalInstitutionCompareItem,
  PersonalInstitutionKey,
  PersonalInstitutionMode,
  QtInstitutionType,
} from "./barometer.types";
import {
  barometerTimeline,
  buildBarometerPriceAnchors,
  buildBarometerPricePoints,
  buildBarometerSeries,
  buildBarometerShape,
  buildInstitutionWeightedRates,
  buildIntradayCounts,
  buildIntradayRates,
  scaleBarometerPoints,
} from "./barometer.utils";

export const barometerRangeOptions: Array<{
  value: BarometerRange;
  label: string;
}> = [
  { value: "overnight", label: "\u9694\u591c" },
  { value: "7d", label: "7D" },
];

export const barometerMetricOptions: Array<{
  value: BarometerMetric;
  label: string;
}> = [
  { value: "price", label: "\u4ef7" },
  { value: "count", label: "\u7b14\u6570" },
  { value: "volume", label: "\u91cf" },
];

export const qtInstitutionOptions = [
  { value: "all", label: "\u5168\u90e8\u673a\u6784", factor: 1 },
  { value: "large-bank", label: "\u5927\u578b\u94f6\u884c", factor: 1.12 },
  {
    value: "joint-bank",
    label: "\u80a1\u4efd\u5236\u5546\u4e1a\u94f6\u884c",
    factor: 0.96,
  },
  { value: "city-bank", label: "\u57ce\u5e02\u5546\u4e1a\u94f6\u884c", factor: 0.82 },
  { value: "broker", label: "\u8bc1\u5238\u516c\u53f8", factor: 0.74 },
  {
    value: "fund",
    label: "\u57fa\u91d1\u516c\u53f8\u53ca\u4ea7\u54c1",
    factor: 0.68,
  },
] as const satisfies ReadonlyArray<{
  value: QtInstitutionType;
  label: string;
  factor: number;
}>;

export const qtInstitutionProfiles: Record<
  QtInstitutionType,
  BarometerInstitutionProfile
> = {
  all: {
    factor: 1,
    amPeakShift: 0,
    pmPeakShift: 0,
    amPeakScale: 1,
    pmPeakScale: 1,
    amWidth: 1.8,
    pmWidth: 2.6,
    valleyFloor: 0,
    drift: 0,
    wobble: 1,
    seed: 0,
  },
  "large-bank": {
    factor: 1.12,
    amPeakShift: -0.25,
    pmPeakShift: -0.15,
    amPeakScale: 1.08,
    pmPeakScale: 0.88,
    amWidth: 1.65,
    pmWidth: 2.35,
    valleyFloor: 0.018,
    drift: -0.018,
    wobble: 0.92,
    seed: 3.7,
  },
  "joint-bank": {
    factor: 0.96,
    amPeakShift: 0.18,
    pmPeakShift: 0.35,
    amPeakScale: 0.92,
    pmPeakScale: 1.04,
    amWidth: 1.95,
    pmWidth: 2.9,
    valleyFloor: 0.026,
    drift: 0.012,
    wobble: 1.1,
    seed: 7.4,
  },
  "city-bank": {
    factor: 0.82,
    amPeakShift: 0.55,
    pmPeakShift: 0.1,
    amPeakScale: 0.82,
    pmPeakScale: 1.18,
    amWidth: 2.15,
    pmWidth: 2.45,
    valleyFloor: 0.04,
    drift: 0.026,
    wobble: 1.22,
    seed: 11.1,
  },
  broker: {
    factor: 0.74,
    amPeakShift: -0.45,
    pmPeakShift: 0.45,
    amPeakScale: 1.22,
    pmPeakScale: 1.06,
    amWidth: 1.45,
    pmWidth: 2.2,
    valleyFloor: 0.012,
    drift: 0.018,
    wobble: 1.34,
    seed: 15.8,
  },
  fund: {
    factor: 0.68,
    amPeakShift: 0.35,
    pmPeakShift: 0.65,
    amPeakScale: 0.72,
    pmPeakScale: 1.28,
    amWidth: 1.9,
    pmWidth: 2.65,
    valleyFloor: 0.034,
    drift: 0.038,
    wobble: 1.18,
    seed: 22.6,
  },
};

const barometerTodayOutCount = buildBarometerShape(4, 8, 226, 148, 0);
const barometerTodayInCount = buildBarometerShape(4, 8, 64, 48, 1.3);
const barometerYesterdayOutCount = buildBarometerShape(4, 8, 198, 132, 2.1);
const barometerYesterdayInCount = buildBarometerShape(4, 8, 58, 42, 3.4);

const barometerPriceAnchors = {
  todayOut: buildBarometerPriceAnchors([
    0.014, 0.026, 0.019, 0.034, 0.028, 0.041, 0.036, 0.024, 0.029, 0.018,
    0.013, 0.02, 0.006, -0.002, 0.01, 0.004, 0.018, 0.012, 0.028, 0.021,
    0.031, 0.019, 0.025, 0.011, 0.004,
  ]),
  todayIn: buildBarometerPriceAnchors([
    0.007, 0.001, 0.009, -0.004, -0.011, -0.002, -0.016, -0.009, -0.022,
    -0.014, -0.024, -0.017, -0.02, -0.006, 0.003, -0.004, 0.011, 0.006,
    0.017, 0.009, 0.013, -0.001, -0.01, -0.014, -0.018,
  ]),
  yesterdayOut: buildBarometerPriceAnchors([
    0.041, 0.031, 0.036, 0.022, 0.028, 0.014, 0.019, 0.008, 0.014, 0.006,
    0.011, 0.017, 0.013, 0.025, 0.033, 0.041, 0.034, 0.038, 0.029, 0.021,
    0.014, 0.007, 0.001, 0.009, 0.012,
  ]),
  yesterdayIn: buildBarometerPriceAnchors([
    -0.013, -0.022, -0.017, -0.029, -0.024, -0.034, -0.028, -0.018, -0.024,
    -0.011, -0.015, -0.006, -0.002, -0.01, -0.006, -0.016, -0.026, -0.019,
    -0.032, -0.024, -0.039, -0.03, -0.034, -0.02, -0.013,
  ]),
} as const;

const barometerPriceSeries = (base: number): BarometerSeries[] => [
  {
    key: "todayOut",
    label: "\u4eca\u65e5\u6b63\u56de\u8d2d",
    color: "#ffa028",
    lineStyle: "solid",
    points: buildBarometerPricePoints(base, barometerPriceAnchors.todayOut),
  },
  {
    key: "todayIn",
    label: "\u4eca\u65e5\u9006\u56de\u8d2d",
    color: "#1872f6",
    lineStyle: "solid",
    points: buildBarometerPricePoints(base, barometerPriceAnchors.todayIn),
  },
  {
    key: "yesterdayOut",
    label: "\u6628\u65e5\u6b63\u56de\u8d2d",
    color: "#ffa028",
    lineStyle: "dashed",
    points: buildBarometerPricePoints(base, barometerPriceAnchors.yesterdayOut),
  },
  {
    key: "yesterdayIn",
    label: "\u6628\u65e5\u9006\u56de\u8d2d",
    color: "#1872f6",
    lineStyle: "dashed",
    points: buildBarometerPricePoints(base, barometerPriceAnchors.yesterdayIn),
  },
];

export const barometerData: Record<
  BarometerRange,
  Record<BarometerMetric, BarometerSlice>
> = {
  overnight: {
    price: {
      yUnit: "%",
      yLabel: "\u5229\u7387\uff08%\uff09",
      series: barometerPriceSeries(1.58),
    },
    count: {
      yUnit: "\u7b14",
      yLabel: "\u6210\u4ea4\uff08\u7b14\uff09",
      series: buildBarometerSeries(
        barometerTodayOutCount,
        barometerTodayInCount,
        barometerYesterdayOutCount,
        barometerYesterdayInCount,
      ),
    },
    volume: {
      yUnit: "\u4ebf",
      yLabel: "\u6210\u4ea4\uff08\u4ebf\uff09",
      series: buildBarometerSeries(
        scaleBarometerPoints(barometerTodayOutCount, 1.8),
        scaleBarometerPoints(barometerTodayInCount, 2.4),
        scaleBarometerPoints(barometerYesterdayOutCount, 1.7),
        scaleBarometerPoints(barometerYesterdayInCount, 2.3),
      ),
    },
  },
  "7d": {
    price: {
      yUnit: "%",
      yLabel: "\u5229\u7387\uff08%\uff09",
      series: barometerPriceSeries(1.85),
    },
    count: {
      yUnit: "\u7b14",
      yLabel: "\u6210\u4ea4\uff08\u7b14\uff09",
      series: buildBarometerSeries(
        scaleBarometerPoints(barometerTodayOutCount, 0.62),
        scaleBarometerPoints(barometerTodayInCount, 0.78),
        scaleBarometerPoints(barometerYesterdayOutCount, 0.6),
        scaleBarometerPoints(barometerYesterdayInCount, 0.74),
      ),
    },
    volume: {
      yUnit: "\u4ebf",
      yLabel: "\u6210\u4ea4\uff08\u4ebf\uff09",
      series: buildBarometerSeries(
        scaleBarometerPoints(barometerTodayOutCount, 1.26),
        scaleBarometerPoints(barometerTodayInCount, 1.87),
        scaleBarometerPoints(barometerYesterdayOutCount, 1.02),
        scaleBarometerPoints(barometerYesterdayInCount, 1.61),
      ),
    },
  },
};

export const personalInstitutionLabels = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "13:30",
  "15:00",
  "16:00",
];

export const personalInstitutionAxisLabelIndexes = new Set([0, 1, 3, 4, 5, 6]);

const makePersonalInstitutionItem = ({
  key,
  label,
  color,
  base,
  pressureScale,
  spreadScale,
  personalBaseCount,
  personalPeakCount,
  institutionBaseCount,
  institutionPeakCount,
  seed,
}: {
  key: PersonalInstitutionKey;
  label: string;
  color: string;
  base: number;
  pressureScale: number;
  spreadScale: number;
  personalBaseCount: number;
  personalPeakCount: number;
  institutionBaseCount: number;
  institutionPeakCount: number;
  seed: number;
}): PersonalInstitutionCompareItem => {
  const personal = buildIntradayRates(base, pressureScale, seed);

  return {
    key,
    label,
    color,
    personal,
    institutionWeighted: buildInstitutionWeightedRates(personal, spreadScale, seed),
    personalCount: buildIntradayCounts(personalBaseCount, personalPeakCount, 2, seed),
    institutionCount: buildIntradayCounts(
      institutionBaseCount,
      institutionPeakCount,
      5,
      seed + 11,
    ),
  };
};

export const personalInstitutionModeOptions: Array<{
  key: PersonalInstitutionMode;
  label: string;
}> = [
  { key: "tenor", label: "\u671f\u9650" },
  { key: "collateral", label: "\u62b5\u5238\u7c7b\u578b" },
];

export const personalInstitutionCompareData: Record<
  PersonalInstitutionMode,
  PersonalInstitutionCompareItem[]
> = {
  tenor: [
    makePersonalInstitutionItem({
      key: "R001",
      label: "R001",
      color: "#2f86ff",
      base: 1.44,
      pressureScale: 0.108,
      spreadScale: 0.82,
      personalBaseCount: 3,
      personalPeakCount: 14,
      institutionBaseCount: 9,
      institutionPeakCount: 40,
      seed: 101,
    }),
    makePersonalInstitutionItem({
      key: "R007",
      label: "R007",
      color: "#10c6c8",
      base: 1.61,
      pressureScale: 0.154,
      spreadScale: 1.02,
      personalBaseCount: 2,
      personalPeakCount: 13,
      institutionBaseCount: 8,
      institutionPeakCount: 44,
      seed: 207,
    }),
  ],
  collateral: [
    makePersonalInstitutionItem({
      key: "\u5b58\u5355\u5546\u91d1",
      label: "\u5b58\u5355\u5546\u91d1",
      color: "#eab308",
      base: 1.53,
      pressureScale: 0.135,
      spreadScale: 1,
      personalBaseCount: 3,
      personalPeakCount: 11,
      institutionBaseCount: 8,
      institutionPeakCount: 34,
      seed: 313,
    }),
    makePersonalInstitutionItem({
      key: "\u4fe1\u7528",
      label: "\u4fe1\u7528",
      color: "#a855f7",
      base: 1.69,
      pressureScale: 0.176,
      spreadScale: 1.34,
      personalBaseCount: 2,
      personalPeakCount: 8,
      institutionBaseCount: 5,
      institutionPeakCount: 25,
      seed: 419,
    }),
    makePersonalInstitutionItem({
      key: "\u5229\u7387\u5730\u65b9",
      label: "\u5229\u7387\u5730\u65b9",
      color: "#38bdf8",
      base: 1.43,
      pressureScale: 0.112,
      spreadScale: 0.86,
      personalBaseCount: 4,
      personalPeakCount: 13,
      institutionBaseCount: 10,
      institutionPeakCount: 38,
      seed: 523,
    }),
  ],
};

export { barometerTimeline };
