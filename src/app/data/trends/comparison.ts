import type { TimePoint } from '../types';

/** 趋势一览预设 5 条线 */
export const comparisonSeries = [
  { key: 'exchange_R001', label: '交易所-R-001', color: '#10b981' },
  { key: 'nonbank_R001',  label: '非银最优-R001', color: '#ef4444' },
  { key: 'citics_R001',   label: '中信证券-R001', color: '#3b82f6' },
  { key: 'bank_icbc',     label: '大行-工商银行', color: '#a855f7' },
  { key: 'xrepo_R007',    label: 'Xrepo-R007',   color: '#f59e0b' },
] as const;

/** 生成 20 个时间点的历史数据 */
export function generateComparisonData(): TimePoint[] {
  const points: TimePoint[] = [];
  const now = new Date();
  const bases: Record<string, number> = {
    exchange_R001: 2.02,
    nonbank_R001:  2.52,
    citics_R001:   2.30,
    bank_icbc:     2.15,
    xrepo_R007:    2.35,
  };

  for (let i = 19; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 5 * 60 * 1000);
    const timeStr = t.toLocaleTimeString('zh-CN', {
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
    const row: TimePoint = { time: timeStr };
    for (const s of comparisonSeries) {
      row[s.key] = +(bases[s.key] + (Math.random() - 0.5) * 0.08).toFixed(3);
    }
    points.push(row);
  }
  return points;
}
