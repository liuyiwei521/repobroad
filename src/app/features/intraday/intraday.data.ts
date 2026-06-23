import type {
  AnonymousTrendProduct,
  BaseTrendProduct,
  CompareProduct,
  HistoryRange,
  OverlayProduct,
  TrendMode,
} from "../../types";

function randomWalk(
  anchor: number,
  count: number,
  dailyVol: number,
  _seed: number,
): number[] {
  const result: number[] = new Array(count);
  result[count - 1] = anchor;
  for (let i = count - 2; i >= 0; i -= 1) {
    const r = Math.random();
    let jump: number;
    if (r < 0.4) {
      jump = (Math.random() - 0.5) * dailyVol * 1.5;
    } else if (r < 0.78) {
      jump = (Math.random() - 0.5) * dailyVol * 7;
    } else {
      jump = (Math.random() - 0.5) * dailyVol * 18;
    }
    result[i] = Math.max(0, Number((result[i + 1] + jump).toFixed(4)));
  }
  return result;
}

const clampRateAboveOne = (series: number[]) =>
  series.map((value) => Number(Math.max(1.02, value).toFixed(4)));

export const overlayProductOptions: Array<{ id: OverlayProduct; label: string }> = [
  { id: "none", label: "涓嶅彔鍔?" },
  { id: "dr001", label: "DR001" },
  { id: "dr007", label: "DR007" },
  { id: "gc001", label: "GC001" },
  { id: "gc007", label: "GC007" },
  { id: "r001", label: "R001" },
  { id: "r002", label: "R002" },
  { id: "r007", label: "R007" },
  { id: "r014", label: "R014" },
  { id: "r030", label: "R030" },
];

export const baseTrendProductOptions: Array<{
  id: BaseTrendProduct;
  label: string;
}> = [
  { id: "r001", label: "R001" },
  { id: "r007", label: "R007" },
];

export const anonymousTrendProductOptions: Array<{
  id: AnonymousTrendProduct;
  label: string;
}> = [
  { id: "r001", label: "R001" },
  { id: "r002", label: "R002" },
  { id: "r007", label: "R007" },
  { id: "r014", label: "R014" },
  { id: "r030", label: "R030" },
  { id: "r180", label: "R180" },
  { id: "r365", label: "R365" },
];

export const compareProductOptions: Array<{ id: CompareProduct; label: string }> = [
  { id: "none", label: "涓嶅姣?" },
  { id: "dr001", label: "DR001" },
  { id: "dr007", label: "DR007" },
  { id: "gc007", label: "GC007" },
  { id: "r007", label: "R007" },
];

export const trendModeTabs: Array<{ id: TrendMode; label: string }> = [
  { id: "intraday", label: "鍒嗘椂" },
  { id: "history", label: "鍘嗗彶" },
  { id: "comparison", label: "瀵规瘮" },
];

export const trendRateSeries = randomWalk(2.017, 60, 0.02, 11);
export const trendVolumeSeries = randomWalk(1040, 60, 220, 12).map((value) =>
  Math.round(value),
);

export const trendVolumeColors = trendVolumeSeries.map((_, index) =>
  index % 3 === 0 || index % 5 === 0 ? "#ff8a26" : "#22c1dc",
);

export const trendAxisLabels = [
  "3/12",
  "3/19",
  "3/25",
  "3/31",
  "4/7",
  "4/14",
  "4/20",
  "4/26",
  "5/2",
  "5/10",
] as const;

export const trendPriceTicks = [2.107, 2.028, 1.948, 1.868] as const;
export const trendVolumeTicks = ["2k", "1k", "900", "450", "0"] as const;

export const intradaySeries = clampRateAboveOne(randomWalk(1.979, 40, 0.055, 13));
export const intradayVolumeSeries = randomWalk(200, 40, 90, 14).map((value) =>
  Math.round(value),
);

export const intradayOverlaySeriesByProduct: Record<
  Exclude<OverlayProduct, "none">,
  number[]
> = {
  dr001: clampRateAboveOne(randomWalk(1.964, 40, 0.035, 70)),
  dr007: clampRateAboveOne(randomWalk(2.012, 40, 0.04, 71)),
  gc001: clampRateAboveOne(randomWalk(1.836, 40, 0.05, 79)),
  gc007: clampRateAboveOne(randomWalk(1.852, 40, 0.062, 72)),
  r001: clampRateAboveOne(randomWalk(1.986, 40, 0.046, 80)),
  r002: clampRateAboveOne(randomWalk(2.004, 40, 0.048, 84)),
  r007: clampRateAboveOne(randomWalk(2.058, 40, 0.052, 73)),
  r014: clampRateAboveOne(randomWalk(2.086, 40, 0.045, 85)),
  r030: clampRateAboveOne(randomWalk(2.128, 40, 0.04, 86)),
};

export const anonymousIntradaySeriesByProduct: Record<
  AnonymousTrendProduct,
  number[]
> = {
  r001: intradaySeries,
  r002: clampRateAboveOne(randomWalk(2.002, 40, 0.049, 74)),
  r007: intradayOverlaySeriesByProduct.r007,
  r014: clampRateAboveOne(randomWalk(2.086, 40, 0.045, 75)),
  r030: clampRateAboveOne(randomWalk(2.128, 40, 0.04, 76)),
  r180: clampRateAboveOne(randomWalk(2.182, 40, 0.034, 77)),
  r365: clampRateAboveOne(randomWalk(2.238, 40, 0.03, 78)),
};

export const intradayTimeLabels = [
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
] as const;

export const intradayAllTimeLabels: string[] = (() => {
  const segments = [
    { start: "09:30", count: 5 },
    { start: "10:00", count: 5 },
    { start: "10:30", count: 5 },
    { start: "11:00", count: 5 },
    { start: "13:30", count: 5 },
    { start: "14:00", count: 5 },
    { start: "14:30", count: 5 },
    { start: "15:00", count: 5 },
  ];
  return segments.flatMap(({ start, count }) => {
    const [h, m] = start.split(":").map(Number);
    return Array.from({ length: count }, (_, index) => {
      const total = h * 60 + m + index * 6;
      return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
    });
  });
})();

export const historyRangeTabs: Array<{ id: HistoryRange; label: string }> = [
  { id: "5d", label: "5鏃?" },
  { id: "1m", label: "1M" },
  { id: "6m", label: "鍗婂勾" },
];

function buildSixMonthDailyDataset() {
  const labels: string[] = [];
  const cursor = new Date("2025-11-04T00:00:00");
  const points = 126;

  while (labels.length < points) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      labels.push(`${cursor.getMonth() + 1}/${cursor.getDate()}`);
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  const close = randomWalk(1.215, points, 0.03, 7);
  const volume = randomWalk(2280, points, 200, 8).map((value) =>
    Math.round(value),
  );

  return { labels, close, volume };
}

export const historicalCloseDatasets: Record<
  HistoryRange,
  {
    labels: readonly string[];
    close: readonly number[];
    volume: readonly number[];
  }
> = {
  "5d": (() => {
    const labels = ["5/4", "5/5", "5/6", "5/7", "5/8"];
    const close = randomWalk(1.28, 5, 0.18, 1);
    const volume = randomWalk(1620, 5, 180, 2).map((value) =>
      Math.round(value),
    );
    return { labels, close, volume };
  })(),
  "1m": (() => {
    const labels = [
      "4/9",
      "4/10",
      "4/11",
      "4/12",
      "4/13",
      "4/14",
      "4/15",
      "4/16",
      "4/17",
      "4/20",
      "4/21",
      "4/22",
      "4/23",
      "4/24",
      "4/25",
      "4/26",
      "4/27",
      "4/28",
      "4/29",
      "4/30",
      "5/1",
      "5/2",
      "5/3",
      "5/4",
      "5/5",
      "5/6",
      "5/7",
      "5/8",
    ];
    const close = randomWalk(1.236, 28, 0.025, 3);
    const volume = randomWalk(1710, 28, 140, 4).map((value) =>
      Math.round(value),
    );
    return { labels, close, volume };
  })(),
  "6m": buildSixMonthDailyDataset(),
};

const historicalProductAnchors: Record<
  Exclude<OverlayProduct | CompareProduct, "none" | "dr001">,
  {
    anchor5d: number;
    anchor1m: number;
    anchor6m: number;
    vol5d: number;
    vol1m: number;
    vol6m: number;
    seed: number;
  }
> = {
  gc001: {
    anchor5d: 1.18,
    anchor1m: 1.15,
    anchor6m: 1.39,
    vol5d: 0.14,
    vol1m: 0.03,
    vol6m: 0.015,
    seed: 87,
  },
  dr007: {
    anchor5d: 1.36,
    anchor1m: 1.31,
    anchor6m: 1.5,
    vol5d: 0.15,
    vol1m: 0.028,
    vol6m: 0.012,
    seed: 81,
  },
  gc007: {
    anchor5d: 1.21,
    anchor1m: 1.18,
    anchor6m: 1.42,
    vol5d: 0.2,
    vol1m: 0.035,
    vol6m: 0.018,
    seed: 82,
  },
  r001: {
    anchor5d: 1.28,
    anchor1m: 1.236,
    anchor6m: 1.47,
    vol5d: 0.17,
    vol1m: 0.026,
    vol6m: 0.013,
    seed: 88,
  },
  r002: {
    anchor5d: 1.31,
    anchor1m: 1.26,
    anchor6m: 1.5,
    vol5d: 0.16,
    vol1m: 0.027,
    vol6m: 0.013,
    seed: 89,
  },
  r007: {
    anchor5d: 1.42,
    anchor1m: 1.36,
    anchor6m: 1.58,
    vol5d: 0.16,
    vol1m: 0.03,
    vol6m: 0.014,
    seed: 83,
  },
  r014: {
    anchor5d: 1.47,
    anchor1m: 1.42,
    anchor6m: 1.64,
    vol5d: 0.15,
    vol1m: 0.028,
    vol6m: 0.014,
    seed: 90,
  },
  r030: {
    anchor5d: 1.52,
    anchor1m: 1.46,
    anchor6m: 1.7,
    vol5d: 0.14,
    vol1m: 0.026,
    vol6m: 0.013,
    seed: 91,
  },
};

export const historicalProductSeries: Record<
  HistoryRange,
  Record<Exclude<OverlayProduct | CompareProduct, "none" | "dr001">, number[]>
> = {
  "5d": {
    gc001: randomWalk(
      historicalProductAnchors.gc001.anchor5d,
      historicalCloseDatasets["5d"].close.length,
      historicalProductAnchors.gc001.vol5d,
      historicalProductAnchors.gc001.seed,
    ),
    dr007: randomWalk(
      historicalProductAnchors.dr007.anchor5d,
      historicalCloseDatasets["5d"].close.length,
      historicalProductAnchors.dr007.vol5d,
      historicalProductAnchors.dr007.seed,
    ),
    gc007: randomWalk(
      historicalProductAnchors.gc007.anchor5d,
      historicalCloseDatasets["5d"].close.length,
      historicalProductAnchors.gc007.vol5d,
      historicalProductAnchors.gc007.seed,
    ),
    r001: randomWalk(
      historicalProductAnchors.r001.anchor5d,
      historicalCloseDatasets["5d"].close.length,
      historicalProductAnchors.r001.vol5d,
      historicalProductAnchors.r001.seed,
    ),
    r002: randomWalk(
      historicalProductAnchors.r002.anchor5d,
      historicalCloseDatasets["5d"].close.length,
      historicalProductAnchors.r002.vol5d,
      historicalProductAnchors.r002.seed,
    ),
    r007: randomWalk(
      historicalProductAnchors.r007.anchor5d,
      historicalCloseDatasets["5d"].close.length,
      historicalProductAnchors.r007.vol5d,
      historicalProductAnchors.r007.seed,
    ),
    r014: randomWalk(
      historicalProductAnchors.r014.anchor5d,
      historicalCloseDatasets["5d"].close.length,
      historicalProductAnchors.r014.vol5d,
      historicalProductAnchors.r014.seed,
    ),
    r030: randomWalk(
      historicalProductAnchors.r030.anchor5d,
      historicalCloseDatasets["5d"].close.length,
      historicalProductAnchors.r030.vol5d,
      historicalProductAnchors.r030.seed,
    ),
  },
  "1m": {
    gc001: randomWalk(
      historicalProductAnchors.gc001.anchor1m,
      historicalCloseDatasets["1m"].close.length,
      historicalProductAnchors.gc001.vol1m,
      historicalProductAnchors.gc001.seed + 1,
    ),
    dr007: randomWalk(
      historicalProductAnchors.dr007.anchor1m,
      historicalCloseDatasets["1m"].close.length,
      historicalProductAnchors.dr007.vol1m,
      historicalProductAnchors.dr007.seed + 1,
    ),
    gc007: randomWalk(
      historicalProductAnchors.gc007.anchor1m,
      historicalCloseDatasets["1m"].close.length,
      historicalProductAnchors.gc007.vol1m,
      historicalProductAnchors.gc007.seed + 1,
    ),
    r001: randomWalk(
      historicalProductAnchors.r001.anchor1m,
      historicalCloseDatasets["1m"].close.length,
      historicalProductAnchors.r001.vol1m,
      historicalProductAnchors.r001.seed + 1,
    ),
    r002: randomWalk(
      historicalProductAnchors.r002.anchor1m,
      historicalCloseDatasets["1m"].close.length,
      historicalProductAnchors.r002.vol1m,
      historicalProductAnchors.r002.seed + 1,
    ),
    r007: randomWalk(
      historicalProductAnchors.r007.anchor1m,
      historicalCloseDatasets["1m"].close.length,
      historicalProductAnchors.r007.vol1m,
      historicalProductAnchors.r007.seed + 1,
    ),
    r014: randomWalk(
      historicalProductAnchors.r014.anchor1m,
      historicalCloseDatasets["1m"].close.length,
      historicalProductAnchors.r014.vol1m,
      historicalProductAnchors.r014.seed + 1,
    ),
    r030: randomWalk(
      historicalProductAnchors.r030.anchor1m,
      historicalCloseDatasets["1m"].close.length,
      historicalProductAnchors.r030.vol1m,
      historicalProductAnchors.r030.seed + 1,
    ),
  },
  "6m": {
    gc001: randomWalk(
      historicalProductAnchors.gc001.anchor6m,
      historicalCloseDatasets["6m"].close.length,
      historicalProductAnchors.gc001.vol6m,
      historicalProductAnchors.gc001.seed + 2,
    ),
    dr007: randomWalk(
      historicalProductAnchors.dr007.anchor6m,
      historicalCloseDatasets["6m"].close.length,
      historicalProductAnchors.dr007.vol6m,
      historicalProductAnchors.dr007.seed + 2,
    ),
    gc007: randomWalk(
      historicalProductAnchors.gc007.anchor6m,
      historicalCloseDatasets["6m"].close.length,
      historicalProductAnchors.gc007.vol6m,
      historicalProductAnchors.gc007.seed + 2,
    ),
    r001: randomWalk(
      historicalProductAnchors.r001.anchor6m,
      historicalCloseDatasets["6m"].close.length,
      historicalProductAnchors.r001.vol6m,
      historicalProductAnchors.r001.seed + 2,
    ),
    r002: randomWalk(
      historicalProductAnchors.r002.anchor6m,
      historicalCloseDatasets["6m"].close.length,
      historicalProductAnchors.r002.vol6m,
      historicalProductAnchors.r002.seed + 2,
    ),
    r007: randomWalk(
      historicalProductAnchors.r007.anchor6m,
      historicalCloseDatasets["6m"].close.length,
      historicalProductAnchors.r007.vol6m,
      historicalProductAnchors.r007.seed + 2,
    ),
    r014: randomWalk(
      historicalProductAnchors.r014.anchor6m,
      historicalCloseDatasets["6m"].close.length,
      historicalProductAnchors.r014.vol6m,
      historicalProductAnchors.r014.seed + 2,
    ),
    r030: randomWalk(
      historicalProductAnchors.r030.anchor6m,
      historicalCloseDatasets["6m"].close.length,
      historicalProductAnchors.r030.vol6m,
      historicalProductAnchors.r030.seed + 2,
    ),
  },
};

