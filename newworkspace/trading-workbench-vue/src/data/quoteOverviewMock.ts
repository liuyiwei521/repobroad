import type { Tenor } from './mockData';

export const TIMELINE = ['09:00', '09:30', '10:00', '10:30', '11:00', '13:30', '14:00', '14:30', '15:00'] as const;
export type TimeSlot = (typeof TIMELINE)[number];

export type OverviewMetric = 'heat' | 'price' | 'offset' | 'collateral' | 'account' | 'fill';
export type OverviewDimension = 'all' | 'tenor' | 'collateral' | 'account' | 'institution';
export type DirectionFilter = 'all' | 'reverse' | 'repo';

export interface SeriesPoint {
  t: TimeSlot;
  value: number;
}

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
  lineStyle: 'solid' | 'dashed';
  points: SeriesPoint[];
}

export interface OverviewSlice {
  metric: OverviewMetric;
  dimension: OverviewDimension;
  yUnit: string;
  yLabel: string;
  series: ChartSeries[];
  insight: string;
}

export interface PersonalVsOrgPoint {
  t: TimeSlot;
  personalRate: number | null;
  orgRate: number | null;
  personalCount: number;
  orgCount: number;
}

export interface PersonalVsOrgSeries {
  tenor: Tenor;
  color: string;
  points: PersonalVsOrgPoint[];
}

export interface PersonalVsOrgSlice {
  series: PersonalVsOrgSeries[];
  insight: string;
}

export const metricOptions: Array<{ value: OverviewMetric; label: string }> = [
  { value: 'heat', label: '报价热度' },
  { value: 'price', label: '价格水平' },
  { value: 'offset', label: '偏移水平' },
  { value: 'collateral', label: '押券偏好' },
  { value: 'account', label: '账户限制' },
  { value: 'fill', label: '成交质量' },
];

export const dimensionOptions: Array<{ value: OverviewDimension; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'tenor', label: '按期限' },
  { value: 'collateral', label: '按押券类型' },
  { value: 'account', label: '按账户要求' },
  { value: 'institution', label: '按机构类型' },
];

export const directionOptions: Array<{ value: DirectionFilter; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'reverse', label: '逆回购' },
  { value: 'repo', label: '正回购' },
];

const TENOR_COLORS: Record<string, string> = {
  R001: '#1872f6',
  R007: '#02adb0',
  R014: '#e9b842',
  R021: '#763df2',
  R028: '#ff6b4a',
};

const COLLATERAL_COLORS: Record<string, string> = {
  利率债: '#1872f6',
  地方债: '#02adb0',
  同业存单: '#e9b842',
  商金债: '#763df2',
  信用债: '#ff6b4a',
};

const ACCOUNT_COLORS: Record<string, string> = {
  限基金: '#1872f6',
  限理财: '#02adb0',
  限券商: '#e9b842',
  不限户: '#763df2',
  限白名单: '#ff6b4a',
};

const INSTITUTION_COLORS: Record<string, string> = {
  大行: '#1872f6',
  股份行: '#02adb0',
  城商农商: '#e9b842',
  券商: '#763df2',
  基金: '#ff6b4a',
  理财子: '#a138f5',
};

const rand = (min: number, max: number) => Math.round((min + Math.random() * (max - min)) * 100) / 100;
const randInt = (min: number, max: number) => Math.floor(min + Math.random() * (max - min + 1));

const makePoints = (base: number[], noise: number): SeriesPoint[] =>
  TIMELINE.map((t, i) => ({ t, value: Math.max(0, base[i] + rand(-noise, noise)) }));

// 时间轴: 09:00 09:30 10:00 10:30 11:00 13:30 14:00 14:30 15:00
// 双峰形态: 09:30 开盘冲量(主峰) + 14:30 尾盘抢量(次峰), 13:30 午休谷底
const heatBase = [18, 95, 58, 32, 20, 8, 28, 82, 12];
const buildHeatByTenor = (): OverviewSlice => ({
  metric: 'heat',
  dimension: 'tenor',
  yUnit: '条',
  yLabel: '报价条数',
  series: [
    { key: 'R001', label: 'R001', color: TENOR_COLORS.R001, lineStyle: 'solid', points: makePoints(heatBase.map(v => v * 0.25), 2) },
    { key: 'R007', label: 'R007', color: TENOR_COLORS.R007, lineStyle: 'solid', points: makePoints(heatBase.map(v => v * 0.48), 3) },
    { key: 'R014', label: 'R014', color: TENOR_COLORS.R014, lineStyle: 'solid', points: makePoints(heatBase.map(v => v * 0.15), 1.5) },
    { key: 'R021', label: 'R021', color: TENOR_COLORS.R021, lineStyle: 'solid', points: makePoints(heatBase.map(v => v * 0.08), 1) },
    { key: 'R028', label: 'R028', color: TENOR_COLORS.R028, lineStyle: 'solid', points: makePoints(heatBase.map(v => v * 0.04), 0.5) },
  ],
  insight: '09:30 开盘涌入 95 条报价（主峰），午休跌至 8 条，14:30 尾盘抢量形成第二波峰值（82 条）。',
});

const buildHeatAll = (): OverviewSlice => ({
  metric: 'heat',
  dimension: 'all',
  yUnit: '条',
  yLabel: '报价条数',
  series: [
    { key: 'total', label: '全部报价', color: TENOR_COLORS.R001, lineStyle: 'solid', points: makePoints(heatBase, 4) },
  ],
  insight: '今日累计报价 353 条，09:30 主峰 95 条、14:30 次峰 82 条，午休近乎归零。',
});

// 价格走势：开盘竞价压低 → 盘中回升 → 午后再度下探 → 尾盘情绪推高
const priceR001Base = [1.54, 1.52, 1.55, 1.56, 1.57, 1.56, 1.55, 1.53, 1.58];
const priceR007Base = [1.73, 1.70, 1.74, 1.75, 1.76, 1.74, 1.73, 1.71, 1.77];
const priceR014Base = [1.89, 1.86, 1.90, 1.91, 1.92, 1.90, 1.89, 1.87, 1.93];
const buildPriceByTenor = (): OverviewSlice => ({
  metric: 'price',
  dimension: 'tenor',
  yUnit: '%',
  yLabel: '均价利率',
  series: [
    { key: 'R001', label: 'R001', color: TENOR_COLORS.R001, lineStyle: 'solid', points: makePoints(priceR001Base, 0.01) },
    { key: 'R007', label: 'R007', color: TENOR_COLORS.R007, lineStyle: 'solid', points: makePoints(priceR007Base, 0.01) },
    { key: 'R014', label: 'R014', color: TENOR_COLORS.R014, lineStyle: 'solid', points: makePoints(priceR014Base, 0.01) },
  ],
  insight: '09:30 开盘竞价压低均价（R007 低至 1.70%），14:30 尾盘抢量推至 1.71%；15:00 收盘跳升至 1.77%。',
});

const buildPriceAll = (): OverviewSlice => ({
  metric: 'price',
  dimension: 'all',
  yUnit: '%',
  yLabel: '均价利率',
  series: [
    { key: 'avg', label: '均价', color: '#1872f6', lineStyle: 'solid', points: makePoints(priceR007Base, 0.02) },
    { key: 'best', label: '最优价', color: '#02adb0', lineStyle: 'dashed', points: makePoints(priceR007Base.map(v => v - 0.05), 0.015) },
  ],
  insight: '均价在两个峰值时段被压低（09:30 / 14:30），最优价与均价价差 4-5BP。',
});

// 偏移走势：开盘抢量时偏移收窄甚至转负 → 闲时回正 → 尾盘再压
const offsetBase = [3, -2, 4, 5, 6, 2, 5, -1, 8];
const buildOffsetByTenor = (): OverviewSlice => ({
  metric: 'offset',
  dimension: 'tenor',
  yUnit: 'BP',
  yLabel: '偏移 BP',
  series: [
    { key: 'R001', label: 'R001 vs DR001', color: TENOR_COLORS.R001, lineStyle: 'solid', points: makePoints(offsetBase.map(v => v * 0.6), 0.8) },
    { key: 'R007', label: 'R007 vs DR007', color: TENOR_COLORS.R007, lineStyle: 'solid', points: makePoints(offsetBase, 1.2) },
    { key: 'R014', label: 'R014 vs DR014', color: TENOR_COLORS.R014, lineStyle: 'solid', points: makePoints(offsetBase.map(v => v * 1.3), 1.5) },
  ],
  insight: '09:30 开盘抢量时 R007 偏移转负（-2BP），14:30 尾盘再次压至 -1BP；闲时回正 +4~+6BP。',
});

const buildOffsetAll = (): OverviewSlice => ({
  metric: 'offset',
  dimension: 'all',
  yUnit: 'BP',
  yLabel: '偏移 BP',
  series: [
    { key: 'avg', label: '均价偏移', color: '#1872f6', lineStyle: 'solid', points: makePoints(offsetBase, 1.5) },
  ],
  insight: '偏移在两个峰值时段被压至负值，闲时维持 +4~+6BP。',
});

// 押券偏好占比：整体稳定，但尾盘信用债占比微升（尾盘不挑押券）
const collateralBase = [36, 40, 38, 37, 36, 32, 37, 42, 34];
const buildCollateral = (): OverviewSlice => ({
  metric: 'collateral',
  dimension: 'collateral',
  yUnit: '%',
  yLabel: '占比',
  series: [
    { key: '利率债', label: '利率债', color: COLLATERAL_COLORS['利率债'], lineStyle: 'solid', points: makePoints(collateralBase, 2) },
    { key: '地方债', label: '地方债', color: COLLATERAL_COLORS['地方债'], lineStyle: 'solid', points: makePoints(collateralBase.map(v => v * 0.6), 1.5) },
    { key: '同业存单', label: '同业存单', color: COLLATERAL_COLORS['同业存单'], lineStyle: 'solid', points: makePoints(collateralBase.map(v => v * 0.35), 1) },
    { key: '信用债', label: '信用债', color: COLLATERAL_COLORS['信用债'], lineStyle: 'solid', points: makePoints([4, 3, 4, 5, 5, 6, 5, 8, 5], 1) },
  ],
  insight: '利率债占比在 09:30 峰值升至 40%；14:30 尾盘信用债占比微升至 8%（抢量不挑券）。',
});

const buildCollateralAll = (): OverviewSlice => ({
  metric: 'collateral',
  dimension: 'all',
  yUnit: '条',
  yLabel: '报价条数',
  series: [
    { key: 'total', label: '全部押券', color: '#1872f6', lineStyle: 'solid', points: makePoints(heatBase.map(v => v * 0.9), 3) },
  ],
  insight: '含押券要求报价走势与总量一致，双峰形态明显。',
});

// 账户要求：开盘高峰时限制最多（大量报价涌入带来挑户），午休最少
const accountReqBase = [10, 42, 24, 14, 8, 3, 12, 35, 6];
const buildAccountReq = (): OverviewSlice => ({
  metric: 'account',
  dimension: 'account',
  yUnit: '次',
  yLabel: '出现次数',
  series: [
    { key: '限基金', label: '限基金', color: ACCOUNT_COLORS['限基金'], lineStyle: 'solid', points: makePoints(accountReqBase, 2) },
    { key: '限理财', label: '限理财', color: ACCOUNT_COLORS['限理财'], lineStyle: 'solid', points: makePoints(accountReqBase.map(v => v * 0.7), 1.5) },
    { key: '不限户', label: '不限户', color: ACCOUNT_COLORS['不限户'], lineStyle: 'solid', points: makePoints(accountReqBase.map(v => v * 0.4), 1) },
    { key: '限白名单', label: '限白名单', color: ACCOUNT_COLORS['限白名单'], lineStyle: 'solid', points: makePoints(accountReqBase.map(v => v * 0.2), 0.5) },
  ],
  insight: '09:30 "限基金"出现 42 次（峰值），14:30 再达 35 次；午休时段近零。',
});

const buildAccountReqAll = (): OverviewSlice => ({
  metric: 'account',
  dimension: 'all',
  yUnit: '次',
  yLabel: '出现次数',
  series: [
    { key: 'total', label: '全部账户要求', color: '#1872f6', lineStyle: 'solid', points: makePoints(accountReqBase.map(v => v * 2.3), 3) },
  ],
  insight: '账户限制类关键词双峰分布，09:30 峰值 97 次、14:30 峰值 81 次。',
});

// 成交转化率：峰值时段转化率反而低（报价太多来不及成交），闲时转化率高
const fillBase = [10, 6, 12, 18, 22, 30, 20, 8, 28];
const buildFill = (): OverviewSlice => ({
  metric: 'fill',
  dimension: 'all',
  yUnit: '%',
  yLabel: '成交转化率',
  series: [
    { key: 'rate', label: '转化率', color: '#1872f6', lineStyle: 'solid', points: makePoints(fillBase, 2) },
  ],
  insight: '09:30 / 14:30 报价洪峰时转化率仅 6%/8%；13:30 闲时转化率达 30%——报价少但更有效。',
});

const buildFillByTenor = (): OverviewSlice => ({
  metric: 'fill',
  dimension: 'tenor',
  yUnit: '%',
  yLabel: '成交转化率',
  series: [
    { key: 'R001', label: 'R001', color: TENOR_COLORS.R001, lineStyle: 'solid', points: makePoints(fillBase.map(v => v * 1.2), 2) },
    { key: 'R007', label: 'R007', color: TENOR_COLORS.R007, lineStyle: 'solid', points: makePoints(fillBase, 2) },
    { key: 'R014', label: 'R014', color: TENOR_COLORS.R014, lineStyle: 'solid', points: makePoints(fillBase.map(v => v * 0.6), 1.5) },
  ],
  insight: 'R001 闲时转化率最高（36%），峰值时段各期限转化率均跌至个位数。',
});

// 机构类型：券商早盘冲量最猛，理财子集中尾盘
const buildInstitutionHeat = (): OverviewSlice => ({
  metric: 'heat',
  dimension: 'institution',
  yUnit: '条',
  yLabel: '报价条数',
  series: [
    { key: '大行', label: '大行', color: INSTITUTION_COLORS['大行'], lineStyle: 'solid', points: makePoints([3, 15, 9, 5, 3, 1, 4, 10, 2], 1) },
    { key: '股份行', label: '股份行', color: INSTITUTION_COLORS['股份行'], lineStyle: 'solid', points: makePoints([4, 20, 12, 7, 4, 2, 6, 16, 3], 1.5) },
    { key: '城商农商', label: '城商农商', color: INSTITUTION_COLORS['城商农商'], lineStyle: 'solid', points: makePoints([3, 16, 10, 6, 4, 1, 5, 14, 2], 1) },
    { key: '券商', label: '券商', color: INSTITUTION_COLORS['券商'], lineStyle: 'solid', points: makePoints([5, 28, 16, 8, 5, 2, 8, 24, 3], 2) },
    { key: '基金', label: '基金', color: INSTITUTION_COLORS['基金'], lineStyle: 'solid', points: makePoints([2, 12, 7, 4, 3, 1, 3, 10, 1], 1) },
    { key: '理财子', label: '理财子', color: INSTITUTION_COLORS['理财子'], lineStyle: 'solid', points: makePoints([1, 4, 4, 2, 1, 1, 2, 8, 1], 0.5) },
  ],
  insight: '券商两个峰值最突出（09:30 达 28 条、14:30 达 24 条），理财子尾盘集中放量（14:30 达 8 条）。',
});

const sliceIndex = new Map<string, OverviewSlice>();
const registerSlice = (slice: OverviewSlice) => {
  sliceIndex.set(`${slice.metric}__${slice.dimension}`, slice);
  return slice;
};

registerSlice(buildHeatByTenor());
registerSlice(buildHeatAll());
registerSlice(buildPriceByTenor());
registerSlice(buildPriceAll());
registerSlice(buildOffsetByTenor());
registerSlice(buildOffsetAll());
registerSlice(buildCollateral());
registerSlice(buildCollateralAll());
registerSlice(buildAccountReq());
registerSlice(buildAccountReqAll());
registerSlice(buildFill());
registerSlice(buildFillByTenor());
registerSlice(buildInstitutionHeat());

export const getOverviewSlice = (metric: OverviewMetric, dimension: OverviewDimension): OverviewSlice | undefined => {
  return sliceIndex.get(`${metric}__${dimension}`) ?? sliceIndex.get(`${metric}__all`);
};

export const getAvailableDimensions = (metric: OverviewMetric): OverviewDimension[] => {
  const dims: OverviewDimension[] = [];
  for (const [key] of sliceIndex) {
    if (key.startsWith(`${metric}__`)) {
      dims.push(key.split('__')[1] as OverviewDimension);
    }
  }
  const order: OverviewDimension[] = ['all', 'tenor', 'collateral', 'account', 'institution'];
  return order.filter(d => dims.includes(d));
};

const makePersonalVsOrgPoints = (
  personalBase: number[],
  orgBase: number[],
  pNoise: number,
  oNoise: number
): PersonalVsOrgPoint[] =>
  TIMELINE.map((t, i) => ({
    t,
    personalRate: personalBase[i] + rand(-pNoise, pNoise),
    orgRate: orgBase[i] + rand(-oNoise, oNoise),
    personalCount: randInt(2, 8),
    orgCount: randInt(15, 48),
  }));

export const personalVsOrgData: PersonalVsOrgSlice = {
  series: [
    {
      tenor: 'R001',
      color: TENOR_COLORS.R001,
      points: makePersonalVsOrgPoints(
        [1.53, 1.54, 1.55, 1.54, 1.53, 1.52, 1.54, 1.55, 1.54],
        [1.55, 1.56, 1.58, 1.57, 1.56, 1.55, 1.57, 1.58, 1.57],
        0.01, 0.02
      ),
    },
    {
      tenor: 'R007',
      color: TENOR_COLORS.R007,
      points: makePersonalVsOrgPoints(
        [1.70, 1.71, 1.72, 1.73, 1.71, 1.70, 1.72, 1.73, 1.72],
        [1.72, 1.73, 1.75, 1.76, 1.74, 1.73, 1.75, 1.76, 1.75],
        0.01, 0.02
      ),
    },
    {
      tenor: 'R014',
      color: TENOR_COLORS.R014,
      points: makePersonalVsOrgPoints(
        [1.85, 1.86, 1.87, 1.88, 1.87, 1.86, 1.88, 1.89, 1.88],
        [1.88, 1.89, 1.90, 1.91, 1.90, 1.89, 1.91, 1.92, 1.91],
        0.01, 0.02
      ),
    },
    {
      tenor: 'R021',
      color: TENOR_COLORS.R021,
      points: makePersonalVsOrgPoints(
        [1.92, 1.93, 1.94, 1.95, 1.94, 1.93, 1.95, 1.96, 1.95],
        [1.95, 1.96, 1.98, 1.99, 1.97, 1.96, 1.98, 1.99, 1.98],
        0.01, 0.02
      ),
    },
    {
      tenor: 'R028',
      color: TENOR_COLORS.R028,
      points: makePersonalVsOrgPoints(
        [2.00, 2.01, 2.02, 2.03, 2.02, 2.01, 2.03, 2.04, 2.03],
        [2.03, 2.04, 2.06, 2.07, 2.05, 2.04, 2.06, 2.07, 2.06],
        0.01, 0.02
      ),
    },
  ],
  insight: 'R007 上你的报价均价比机构低 3BP，覆盖面偏窄（12/48 条）；R001 差异最小（约 2BP）。',
};

export const generateYesterdaySeries = (todaySeries: ChartSeries[]): ChartSeries[] => {
  return todaySeries
    .filter(s => s.lineStyle === 'solid')
    .map(s => ({
      key: `yd-${s.key}`,
      label: `昨日 ${s.label}`,
      color: s.color,
      lineStyle: 'dashed' as const,
      points: s.points.map(p => ({
        t: p.t,
        value: p.value * (0.85 + Math.random() * 0.3),
      })),
    }));
};
