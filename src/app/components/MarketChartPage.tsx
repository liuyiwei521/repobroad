import { useState, useMemo } from 'react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { X } from 'lucide-react';

const PERIODS = ['1', '7', '14', '21', '28+'];
const PERIOD_LABELS: Record<string, string> = {
  '1': '001', '7': '007', '14': '014', '21': '021', '28+': '028+',
};

const chartTheme = {
  page: 'var(--tk-color-surface-dark-deep)',
  border: 'color-mix(in srgb, var(--tk-color-border-dark) 34%, transparent)',
  borderSoft: 'color-mix(in srgb, var(--tk-color-border-dark) 20%, transparent)',
  text: 'var(--tk-color-text-inverse-secondary)',
  heading: 'var(--tk-color-text-inverse)',
  muted: 'var(--tk-color-text-tertiary)',
  success: 'var(--tk-color-success)',
  danger: 'var(--tk-color-danger)',
  warning: 'var(--tk-color-warning)',
} as const;

const INST_TYPES = [
  { id: 'xrepo',   label: '大行匿名', baseColor: chartTheme.heading, activeText: chartTheme.page },
  { id: 'qtrade',  label: '指定机构', baseColor: 'var(--tk-color-chart-blue)', activeText: chartTheme.heading },
  { id: 'nonbank', label: '非银',     baseColor: chartTheme.warning, activeText: chartTheme.page },
];

const BASE_RATES: Record<string, Record<string, number>> = {
  xrepo:   { '1': 1.95, '7': 2.15, '14': 2.28, '21': 2.30, '28+': 2.35 },
  qtrade:  { '1': 1.92, '7': 2.10, '14': 2.22, '21': 2.28, '28+': 2.32 },
  nonbank: { '1': 1.98, '7': 2.18, '14': 2.28, '21': 2.41, '28+': 2.58 },
};

const PERIOD_DASH: Record<string, string> = {
  '1': '0', '7': '0', '14': '5 3', '21': '2 2', '28+': '8 2 2 2',
};

const PALETTE: Record<string, string[]> = {
  xrepo: [
    chartTheme.heading,
    'color-mix(in srgb, var(--tk-color-text-inverse) 82%, transparent)',
    'color-mix(in srgb, var(--tk-color-text-inverse) 68%, transparent)',
    'color-mix(in srgb, var(--tk-color-text-inverse) 52%, transparent)',
    'color-mix(in srgb, var(--tk-color-text-inverse) 38%, transparent)',
  ],
  qtrade: [
    'color-mix(in srgb, var(--tk-color-chart-blue) 42%, var(--tk-color-text-inverse))',
    'color-mix(in srgb, var(--tk-color-chart-blue) 58%, var(--tk-color-text-inverse))',
    'var(--tk-color-chart-blue)',
    'var(--tk-color-brand-primary-hover)',
    'var(--tk-color-brand-primary)',
  ],
  nonbank: [
    'color-mix(in srgb, var(--tk-color-warning) 42%, var(--tk-color-text-inverse))',
    'color-mix(in srgb, var(--tk-color-warning) 62%, var(--tk-color-text-inverse))',
    'var(--tk-color-warning)',
    'var(--tk-color-warning-strong)',
    'color-mix(in srgb, var(--tk-color-warning) 78%, var(--tk-color-danger))',
  ],
};

const TIME_RANGES = [
  { label: '1D',  days: 1,  granularityMin: 1  },
  { label: '3D',  days: 3,  granularityMin: 5  },
  { label: '5D',  days: 5,  granularityMin: 5  },
  { label: '10D', days: 10, granularityMin: 15 },
];

interface DataPoint {
  timestamp: number;
  timeLabel: string;
  volume: number;
  volUp: boolean;
  [key: string]: number | string | boolean;
}

function formatTimeLabel(date: Date, days: number): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  if (days <= 1) return `${hh}:${min}`;
  return `${mm}-${dd} ${hh}:${min}`;
}

function isTradingTime(h: number, m: number): boolean {
  return (h === 9 && m >= 15) || h === 10 || (h === 11 && m <= 30) ||
         (h >= 13 && h < 17) || (h === 17 && m === 0);
}

function generateData(
  days: number,
  granularityMin: number,
  instTypes: string[],
  periods: string[],
): DataPoint[] {
  const keys: string[] = [];
  for (const inst of instTypes) for (const p of periods) keys.push(`${inst}_${p}`);

  const rates: Record<string, number> = {};
  for (const k of keys) {
    const [inst, period] = k.split('_');
    rates[k] = BASE_RATES[inst]?.[period] ?? 2.0;
  }

  let seed = 98765;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0x100000000;
  };

  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  start.setHours(9, 0, 0, 0);

  const intervalMs = granularityMin * 60 * 1000;
  const points: DataPoint[] = [];
  let t = new Date(start);

  while (t.getTime() <= end.getTime()) {
    const dow = t.getDay();
    const h = t.getHours();
    const m = t.getMinutes();
    if (dow !== 0 && dow !== 6 && isTradingTime(h, m)) {
      const pt: DataPoint = {
        timestamp: t.getTime(),
        timeLabel: formatTimeLabel(t, days),
        volume: Math.floor(rand() * 1500 + 100),
        volUp: rand() > 0.45,
      };
      for (const k of keys) {
        const shock = (rand() - 0.49) * 0.012 + (rand() - 0.5) * 0.003;
        rates[k] = Math.max(1.0, Math.min(4.5, rates[k] + shock));
        pt[k] = parseFloat(rates[k].toFixed(4));
      }
      points.push(pt);
    }
    t = new Date(t.getTime() + intervalMs);
  }

  if (points.length > 700) {
    const step = Math.ceil(points.length / 700);
    return points.filter((_, i) => i % step === 0);
  }
  return points;
}

function calcMA(data: DataPoint[], key: string, period: number): (number | null)[] {
  return data.map((_, i) => {
    if (i < period - 1) return null;
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += (data[j][key] as number) || 0;
    return parseFloat((sum / period).toFixed(4));
  });
}

interface Props { onClose: () => void; }

export function MarketChartPage({ onClose }: Props) {
  const [timeRange, setTimeRange] = useState(TIME_RANGES[0]);
  const [selectedInsts, setSelectedInsts] = useState<Set<string>>(new Set(['xrepo']));
  const [selectedPeriods, setSelectedPeriods] = useState<Set<string>>(new Set(['7']));
  const [showLegend, setShowLegend] = useState(true);

  const toggleInst = (id: string) =>
    setSelectedInsts(prev => {
      const next = new Set(prev);
      if (next.has(id) && next.size > 1) next.delete(id);
      else next.add(id);
      return next;
    });

  const togglePeriod = (p: string) =>
    setSelectedPeriods(prev => {
      const next = new Set(prev);
      if (next.has(p) && next.size > 1) next.delete(p);
      else next.add(p);
      return next;
    });

  const toggleAllInsts = () =>
    setSelectedInsts(prev =>
      prev.size === INST_TYPES.length ? new Set([INST_TYPES[0].id]) : new Set(INST_TYPES.map(i => i.id))
    );

  const toggleAllPeriods = () =>
    setSelectedPeriods(prev =>
      prev.size === PERIODS.length ? new Set([PERIODS[1]]) : new Set(PERIODS)
    );

  const activeSeries = useMemo(() => {
    const series: Array<{ key: string; label: string; color: string; dash: string }> = [];
    for (const inst of INST_TYPES) {
      if (!selectedInsts.has(inst.id)) continue;
      PERIODS.forEach((p, pidx) => {
        if (!selectedPeriods.has(p)) return;
        series.push({
          key: `${inst.id}_${p}`,
          label: `${inst.label} ${PERIOD_LABELS[p]}`,
          color: PALETTE[inst.id][pidx],
          dash: PERIOD_DASH[p],
        });
      });
    }
    return series;
  }, [selectedInsts, selectedPeriods]);

  const chartData = useMemo(() =>
    generateData(timeRange.days, timeRange.granularityMin, [...selectedInsts], [...selectedPeriods]),
    [timeRange, selectedInsts, selectedPeriods]
  );

  const primaryKey = activeSeries[0]?.key;
  const maValues = useMemo(() =>
    primaryKey ? calcMA(chartData, primaryKey, 20) : [],
    [chartData, primaryKey]
  );

  const dataWithMA = useMemo(() =>
    chartData.map((d, i) => ({ ...d, __ma: maValues[i] ?? undefined })),
    [chartData, maValues]
  );

  const yDomain = useMemo((): [number, number] => {
    if (!dataWithMA.length) return [1.5, 2.5];
    let min = Infinity, max = -Infinity;
    for (const d of dataWithMA) {
      for (const s of activeSeries) {
        const v = d[s.key] as number;
        if (v) { min = Math.min(min, v); max = Math.max(max, v); }
      }
    }
    const pad = Math.max((max - min) * 0.15, 0.05);
    return [parseFloat((min - pad).toFixed(3)), parseFloat((max + pad).toFixed(3))];
  }, [dataWithMA, activeSeries]);

  const xInterval = Math.max(1, Math.floor(dataWithMA.length / 8));

  const CustomVolBar = (props: any) => {
    const { x, y, width, height, index } = props;
    const color = dataWithMA[index]?.volUp ? chartTheme.success : chartTheme.danger;
    return <rect x={x} y={y} width={width} height={height} fill={color} opacity={0.75} />;
  };

  return (
    <div className="tdx-dark-board fixed inset-0 z-50 flex flex-col">
      {/* Header */}
      <div className="tdx-dark-filterbar justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-bold" style={{ color: chartTheme.heading }}>行情走势图</h2>
          {/* Time range */}
          <div className="flex gap-1">
            {TIME_RANGES.map(r => (
              <button key={r.label} onClick={() => setTimeRange(r)}
                className={timeRange.label === r.label ? 'tdx-dark-chip-active' : 'tdx-dark-chip'}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLegend(v => !v)}
            className="tdx-dark-chip"
          >
            {showLegend ? '隐藏图例' : '显示图例'}
          </button>
          <button onClick={onClose} className="tdx-dark-chip h-7 w-7 p-0" aria-label="关闭行情走势图">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="tdx-dark-filterbar">
        {/* Institution */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs" style={{ color: chartTheme.muted }}>机构类型：</span>
          <button onClick={toggleAllInsts}
            className={selectedInsts.size === INST_TYPES.length ? 'tdx-dark-chip-active' : 'tdx-dark-chip'}>全选</button>
          {INST_TYPES.map(inst => (
            <button key={inst.id} onClick={() => toggleInst(inst.id)}
              className="tdx-dark-chip"
              style={{
                background: selectedInsts.has(inst.id) ? inst.baseColor : 'transparent',
                borderColor: selectedInsts.has(inst.id) ? inst.baseColor : chartTheme.border,
                color: selectedInsts.has(inst.id) ? inst.activeText : chartTheme.muted,
                fontWeight: selectedInsts.has(inst.id) ? 600 : 400,
              }}>
              {inst.label}
            </button>
          ))}
        </div>
        {/* Period */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs" style={{ color: chartTheme.muted }}>期限：</span>
          <button onClick={toggleAllPeriods}
            className={selectedPeriods.size === PERIODS.length ? 'tdx-dark-chip-active' : 'tdx-dark-chip'}>全选</button>
          {PERIODS.map(p => (
            <button key={p} onClick={() => togglePeriod(p)}
              className={selectedPeriods.has(p) ? 'tdx-dark-chip-active' : 'tdx-dark-chip'}>
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
        <span className="text-xs ml-auto" style={{ color: chartTheme.muted }}>
          粒度 {timeRange.granularityMin}min · {dataWithMA.length} 点
        </span>
      </div>

      {/* Charts */}
      <div className="flex-1 flex flex-col overflow-hidden px-3 pt-3 pb-2 gap-1">
        {/* Price chart */}
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dataWithMA} margin={{ top: 8, right: 65, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="1 4" stroke={chartTheme.borderSoft} vertical={false} />
              <XAxis
                dataKey="timeLabel"
                tick={{ fill: chartTheme.muted, fontSize: 10 }}
                interval={xInterval}
                axisLine={{ stroke: chartTheme.border }}
                tickLine={false}
              />
              <YAxis
                domain={yDomain}
                tick={{ fill: chartTheme.muted, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => v.toFixed(3)}
                width={52}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={yDomain}
                tick={{ fill: chartTheme.muted, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={62}
                tickFormatter={v => {
                  const mid = (yDomain[0] + yDomain[1]) / 2;
                  const bp = ((v - mid) * 100).toFixed(1);
                  return `${bp}BP`;
                }}
              />
              <Tooltip
                contentStyle={{
                  background: 'color-mix(in srgb, var(--tk-color-surface-dark-deep) 94%, transparent)',
                  border: `1px solid ${chartTheme.border}`,
                  borderRadius: 2,
                  fontSize: 10,
                }}
                labelStyle={{ color: chartTheme.text }}
                itemStyle={{ color: chartTheme.text }}
                formatter={(v: number, name: string) => [`${v?.toFixed(4)}%`, name]}
              />
              {showLegend && (
                <Legend
                  wrapperStyle={{ fontSize: 10, color: chartTheme.muted, paddingTop: 4 }}
                  iconType="line"
                />
              )}
              {activeSeries.map(s => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stroke={s.color}
                  strokeWidth={1.5}
                  strokeDasharray={s.dash}
                  dot={false}
                  name={s.label}
                  isAnimationActive={false}
                />
              ))}
              {primaryKey && (
                <Line
                  type="monotone"
                  dataKey="__ma"
                  stroke={chartTheme.warning}
                  strokeWidth={1.5}
                  dot={false}
                  name="MA20"
                  isAnimationActive={false}
                  connectNulls
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Volume chart */}
        <div style={{ height: 90 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dataWithMA} margin={{ top: 0, right: 65, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="1 4" stroke={chartTheme.borderSoft} vertical={false} />
              <XAxis dataKey="timeLabel" tick={false} axisLine={{ stroke: chartTheme.border }} tickLine={false} />
              <YAxis
                tick={{ fill: chartTheme.muted, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={52}
                tickFormatter={v => `${Math.round(v)}亿`}
              />
              <YAxis yAxisId="right" orientation="right" width={62} tick={false} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'color-mix(in srgb, var(--tk-color-surface-dark-deep) 94%, transparent)',
                  border: `1px solid ${chartTheme.border}`,
                  borderRadius: 2,
                  fontSize: 10,
                }}
                labelStyle={{ color: chartTheme.text }}
                formatter={(v: number) => [`${v}亿`, '成交量']}
              />
              <Bar dataKey="volume" shape={<CustomVolBar />} isAnimationActive={false} name="成交量" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
