// ── 中栏 4 张图表共用的洞察 mock 数据 ────────────────────────────
// 加权价格走势 / 匿名成交走势 / 个人机构对比
import type { Tenor } from './mockData';
import { TIMELINE } from './quoteOverviewMock';

export type Timeframe = '5d' | '1m' | '6m';

export const timeframeOptions: { value: Timeframe; label: string }[] = [
  { value: '5d', label: '近5日' },
  { value: '1m', label: '近1M' },
  { value: '6m', label: '近半年' }
];

export type CompareMode = 'none' | 'yesterday' | 'lastweek';

export const compareModeOptions: { value: CompareMode; label: string }[] = [
  { value: 'none', label: '不对比' },
  { value: 'yesterday', label: '与昨日' },
  { value: 'lastweek', label: '与上周' }
];

// ── 加权价格 ─ 上半段折线(加权价格) + 下半段量柱(红跌绿涨) ──────
export interface WeightedPricePoint {
  time: string;
  price: number; // %
  volume: number; // 亿
  trend: 'up' | 'down';
}

const seedSeq = (base: number, count: number, swing: number, seed: number) => {
  // 简易伪随机：避免引入依赖
  const out: number[] = [];
  let s = seed;
  for (let i = 0; i < count; i += 1) {
    s = (s * 9301 + 49297) % 233280;
    const noise = (s / 233280 - 0.5) * 2 * swing;
    out.push(Number((base + noise).toFixed(3)));
  }
  return out;
};

const buildWeightedSeries = (
  labels: string[],
  basePrice: number,
  swing: number,
  baseVolume: number,
  seed: number
): WeightedPricePoint[] => {
  const prices = seedSeq(basePrice, labels.length, swing, seed);
  const volumes = seedSeq(baseVolume, labels.length, baseVolume * 0.4, seed + 17).map((v) =>
    Math.max(120, Math.round(v))
  );
  return labels.map((time, i) => ({
    time,
    price: prices[i],
    volume: volumes[i],
    trend: i === 0 || prices[i] >= prices[i - 1] ? 'up' : 'down'
  }));
};

const labels5d = ['12-02', '12-03', '12-04', '12-05', '12-06'];
const labels1m = Array.from({ length: 20 }, (_, i) => `D-${20 - i}`);
const labels6m = Array.from({ length: 24 }, (_, i) => `W-${24 - i}`);

export const weightedPrice: Record<Timeframe, Partial<Record<Tenor, WeightedPricePoint[]>>> = {
  '5d': {
    R001: buildWeightedSeries(labels5d, 1.24, 0.08, 1100, 11),
    R007: buildWeightedSeries(labels5d, 1.66, 0.05, 850, 13)
  },
  '1m': {
    R001: buildWeightedSeries(labels1m, 1.22, 0.12, 1050, 21),
    R007: buildWeightedSeries(labels1m, 1.68, 0.07, 820, 23)
  },
  '6m': {
    R001: buildWeightedSeries(labels6m, 1.34, 0.22, 980, 31),
    R007: buildWeightedSeries(labels6m, 1.7, 0.18, 760, 33)
  }
};

// ── 匿名成交（当日时序 + 可叠加品种） ─────────────────────────────
export interface AnonymousPoint {
  time: string;
  rate: number; // %
  volume: number; // 亿
}

const intradayLabels = (() => {
  const labels: string[] = [];
  // 09:30 ~ 11:30
  for (let h = 9; h <= 11; h += 1) {
    for (let m = h === 9 ? 30 : 0; m < 60; m += 15) {
      if (h === 11 && m > 30) break;
      labels.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  // 13:30 ~ 15:00
  for (let h = 13; h <= 15; h += 1) {
    for (let m = h === 13 ? 30 : 0; m < 60; m += 15) {
      if (h === 15 && m > 0) break;
      labels.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return labels;
})();

const buildAnonymousSeries = (base: number, swing: number, seed: number): AnonymousPoint[] => {
  const rates = seedSeq(base, intradayLabels.length, swing, seed);
  const volumes = seedSeq(60, intradayLabels.length, 30, seed + 7).map((v) => Math.max(8, Math.round(v)));
  return intradayLabels.map((time, i) => ({
    time,
    rate: rates[i],
    volume: volumes[i]
  }));
};

export const anonymousFlow: Partial<Record<Tenor, AnonymousPoint[]>> = {
  R001: buildAnonymousSeries(1.5, 0.7, 41),
  R007: buildAnonymousSeries(1.72, 0.45, 43),
  R014: buildAnonymousSeries(1.82, 0.35, 45),
  R021: buildAnonymousSeries(1.88, 0.3, 47),
  R028: buildAnonymousSeries(1.95, 0.28, 49)
};

// ── 个人 vs 机构（按期限分组的双线） ──────────────────────────────
export interface IndivInstitPoint {
  time: string;
  indiv: number;
  instit: number;
}

const buildIndivInstit = (baseIndiv: number, baseInstit: number, swing: number, seed: number): IndivInstitPoint[] => {
  const indiv = seedSeq(baseIndiv, intradayLabels.length, swing, seed);
  const instit = seedSeq(baseInstit, intradayLabels.length, swing, seed + 11);
  return intradayLabels.map((time, i) => ({
    time,
    indiv: indiv[i],
    instit: instit[i]
  }));
};

export const indivInstit: Partial<Record<Tenor, IndivInstitPoint[]>> = {
  R001: buildIndivInstit(1.5, 1.53, 0.06, 61),
  R007: buildIndivInstit(1.7, 1.73, 0.05, 63),
  R014: buildIndivInstit(1.78, 1.8, 0.05, 65),
  R021: buildIndivInstit(1.83, 1.85, 0.04, 67),
  R028: buildIndivInstit(1.9, 1.92, 0.04, 69)
};

export const indivInstitInsight = 'R007 上你的报价均价比机构低 3BP，覆盖面偏窄（12/48 条）；R001 差异最小（约 2BP）。';

export type IndivInstitDimensionMode = 'tenor' | 'collateral';
export type IndivInstitTenorKey = Extract<Tenor, 'R001' | 'R007'>;
export type IndivInstitCollateralKey = '存单商金' | '信用' | '利率地方';
export type IndivInstitDimensionKey = IndivInstitTenorKey | IndivInstitCollateralKey;

export interface IndivInstitComparePoint {
  t: (typeof TIMELINE)[number];
  personalRate: number;
  institutionRate: number;
  personalCount: number;
  institutionCount: number;
  institutionAmount: number;
}

export interface IndivInstitCompareItem {
  key: IndivInstitDimensionKey;
  label: string;
  color: string;
  mode: IndivInstitDimensionMode;
  points: IndivInstitComparePoint[];
}

export const indivInstitModeOptions: Array<{ value: IndivInstitDimensionMode; label: string }> = [
  { value: 'tenor', label: '回购期限' },
  { value: 'collateral', label: '券种维度' }
];

export const indivInstitDimensionLabels: Record<IndivInstitDimensionMode, string> = {
  tenor: '期限',
  collateral: '券种'
};

const compareColors: Record<IndivInstitDimensionKey, string> = {
  R001: '#1872f6',
  R007: '#02adb0',
  存单商金: '#e9b842',
  信用: '#ff6b4a',
  利率地方: '#763df2'
};

const buildCompareItem = (
  mode: IndivInstitDimensionMode,
  key: IndivInstitDimensionKey,
  personalRates: number[],
  institutionRates: number[],
  personalCounts: number[],
  institutionCounts: number[],
  institutionAmounts: number[]
): IndivInstitCompareItem => ({
  key,
  label: key,
  color: compareColors[key],
  mode,
  points: TIMELINE.map((t, index) => ({
    t,
    personalRate: personalRates[index],
    institutionRate: institutionRates[index],
    personalCount: personalCounts[index],
    institutionCount: institutionCounts[index],
    institutionAmount: institutionAmounts[index]
  }))
});

export const indivInstitCompareData: Record<IndivInstitDimensionMode, IndivInstitCompareItem[]> = {
  tenor: [
    buildCompareItem(
      'tenor',
      'R001',
      [1.48, 1.50, 1.51, 1.49, 1.50, 1.47, 1.48, 1.52, 1.51],
      [1.51, 1.53, 1.52, 1.51, 1.52, 1.49, 1.50, 1.54, 1.53],
      [6, 15, 11, 8, 7, 3, 6, 13, 5],
      [18, 42, 36, 28, 21, 10, 24, 39, 16],
      [22, 68, 54, 43, 32, 18, 37, 61, 24]
    ),
    buildCompareItem(
      'tenor',
      'R007',
      [1.66, 1.70, 1.72, 1.71, 1.70, 1.68, 1.69, 1.73, 1.74],
      [1.70, 1.74, 1.75, 1.73, 1.72, 1.70, 1.72, 1.76, 1.77],
      [4, 13, 10, 9, 6, 3, 7, 12, 4],
      [16, 48, 38, 33, 24, 12, 28, 44, 19],
      [18, 74, 59, 47, 38, 20, 42, 70, 28]
    )
  ],
  collateral: [
    buildCompareItem(
      'collateral',
      '存单商金',
      [1.54, 1.56, 1.57, 1.56, 1.55, 1.53, 1.55, 1.58, 1.57],
      [1.58, 1.61, 1.60, 1.59, 1.58, 1.56, 1.58, 1.62, 1.61],
      [5, 12, 9, 8, 7, 3, 6, 11, 5],
      [13, 36, 30, 25, 22, 9, 20, 34, 15],
      [16, 52, 43, 35, 29, 14, 31, 50, 20]
    ),
    buildCompareItem(
      'collateral',
      '信用',
      [1.72, 1.76, 1.78, 1.77, 1.76, 1.74, 1.75, 1.79, 1.80],
      [1.79, 1.83, 1.84, 1.82, 1.81, 1.79, 1.81, 1.85, 1.86],
      [3, 8, 7, 5, 5, 2, 4, 8, 3],
      [8, 24, 20, 17, 14, 7, 15, 22, 9],
      [9, 30, 25, 21, 17, 8, 19, 28, 12]
    ),
    buildCompareItem(
      'collateral',
      '利率地方',
      [1.50, 1.52, 1.53, 1.52, 1.51, 1.49, 1.50, 1.54, 1.53],
      [1.53, 1.56, 1.55, 1.54, 1.53, 1.51, 1.53, 1.57, 1.56],
      [6, 14, 12, 9, 8, 4, 7, 13, 6],
      [17, 44, 34, 29, 24, 11, 26, 40, 18],
      [20, 64, 51, 39, 35, 16, 38, 58, 24]
    )
  ]
};
