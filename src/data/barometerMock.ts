export type BarometerMetric = 'count' | 'volume';
export type BarometerTab = 'realtime';
export type BarometerTimeframe = 'overnight' | '7d';

export type BarometerSeriesKey = 'todayOut' | 'todayIn' | 'yesterdayOut' | 'yesterdayIn';

export interface BarometerPoint {
  t: string;
  value: number;
}

export interface BarometerSeries {
  key: BarometerSeriesKey;
  label: string;
  color: string;
  lineStyle: 'solid' | 'dashed';
  points: BarometerPoint[];
}

// Lunch gap removed — AM connects directly to PM for continuous lines.
const AM_SLOTS = ['08:15', '08:30', '08:45', '09:00', '09:15', '09:30', '09:45', '10:00', '10:15', '10:30', '10:45', '11:00', '11:15'];
const PM_SLOTS = ['13:15', '13:30', '13:45', '14:00', '14:15', '14:30', '14:45', '15:00', '15:15', '15:30', '15:45', '16:00', '16:15', '16:30', '16:45', '17:00', '17:15'];

export const BAROMETER_TIMELINE: string[] = [...AM_SLOTS, ...PM_SLOTS];

const gauss = (x: number, mu: number, sigma: number) =>
  Math.exp(-((x - mu) ** 2) / (2 * sigma * sigma));

// peakAm / peakPm are indices within their respective slot arrays.
const makeShape = (
  peakAm: number,
  peakPm: number,
  amplitudeAm: number,
  amplitudePm: number,
  noiseSeed: number,
): BarometerPoint[] => {
  const amLen = AM_SLOTS.length;
  return BAROMETER_TIMELINE.map((t, i) => {
    const isAm = i < amLen;
    const localIdx = isAm ? i : i - amLen;
    const base = isAm
      ? amplitudeAm * gauss(localIdx, peakAm, 1.8)
      : amplitudePm * gauss(localIdx, peakPm, 2.6);
    const wobble = Math.sin((i + noiseSeed) * 1.7) * 0.06 + Math.cos(i * 0.9 + noiseSeed) * 0.04;
    return { t, value: Math.max(0, Math.round(base * (1 + wobble))) };
  });
};

// AM peak ~09:15 = am-index 4. PM peak ~15:15 = pm-index 8.
const todayOutCount  = makeShape(4, 8, 226, 148, 0);
const todayInCount   = makeShape(4, 8,  64,  48, 1.3);
const yestOutCount   = makeShape(4, 8, 198, 132, 2.1);
const yestInCount    = makeShape(4, 8,  58,  42, 3.4);

const scalePoints = (pts: BarometerPoint[], f: number): BarometerPoint[] =>
  pts.map((p) => ({ t: p.t, value: Math.round(p.value * f) }));

const BAROMETER_OUT_COLOR = '#ffa028'; // --tk-color-warning
const BAROMETER_IN_COLOR  = '#1872f6'; // --tk-color-chart-blue

const buildSeries = (
  out: BarometerPoint[], inn: BarometerPoint[],
  yOut: BarometerPoint[], yIn: BarometerPoint[],
): BarometerSeries[] => [
  { key: 'todayOut',     label: '今日融出', color: BAROMETER_OUT_COLOR, lineStyle: 'solid',  points: out  },
  { key: 'todayIn',      label: '今日融入', color: BAROMETER_IN_COLOR,  lineStyle: 'solid',  points: inn  },
  { key: 'yesterdayOut', label: '昨日融出', color: BAROMETER_OUT_COLOR, lineStyle: 'dashed', points: yOut },
  { key: 'yesterdayIn',  label: '昨日融入', color: BAROMETER_IN_COLOR,  lineStyle: 'dashed', points: yIn  },
];

interface BarometerSlice { yUnit: string; yLabel: string; series: BarometerSeries[] }
type BarometerDataset = Record<BarometerTimeframe, Record<BarometerMetric, BarometerSlice>>;

export const BAROMETER_DATA: BarometerDataset = {
  overnight: {
    count:  { yUnit: '笔', yLabel: '成交笔数', series: buildSeries(todayOutCount, todayInCount, yestOutCount, yestInCount) },
    volume: { yUnit: '亿', yLabel: '成交量',   series: buildSeries(scalePoints(todayOutCount, 1.8), scalePoints(todayInCount, 2.4), scalePoints(yestOutCount, 1.7), scalePoints(yestInCount, 2.3)) },
  },
  '7d': {
    count:  { yUnit: '笔', yLabel: '成交笔数', series: buildSeries(scalePoints(todayOutCount, 0.62), scalePoints(todayInCount, 0.78), scalePoints(yestOutCount, 0.6), scalePoints(yestInCount, 0.74)) },
    volume: { yUnit: '亿', yLabel: '成交量',   series: buildSeries(scalePoints(todayOutCount, 1.26), scalePoints(todayInCount, 1.87), scalePoints(yestOutCount, 1.02), scalePoints(yestInCount, 1.61)) },
  },
};

export const barometerTimeframeOptions: Array<{ value: BarometerTimeframe; label: string }> = [
  { value: 'overnight', label: '隔夜' },
  { value: '7d', label: '7D' },
];

export const barometerMetricOptions: Array<{ value: BarometerMetric; label: string }> = [
  { value: 'count', label: '笔数' },
  { value: 'volume', label: '量' },
];
