import type { PriceVolumePoint } from '../types';

/** 生成某品种历史日线（价+量） */
export function generateHistory(base: number, days: number = 30): PriceVolumePoint[] {
  const now = new Date();
  const result: PriceVolumePoint[] = [];
  let price = base;
  for (let i = days - 1; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    price += (Math.random() - 0.5) * 0.06;
    result.push({
      time: `${t.getMonth() + 1}/${t.getDate()}`,
      price: +price.toFixed(4),
      weightedAvg: +(price + (Math.random() - 0.5) * 0.04).toFixed(4),
      volume: Math.floor(200 + Math.random() * 1500),
    });
  }
  return result;
}
