import type { PriceVolumePoint } from '../types';

/** 生成某品种今日分时（价+量） */
export function generateIntraday(base: number, points: number = 60): PriceVolumePoint[] {
  const now = new Date();
  const result: PriceVolumePoint[] = [];
  let price = base;
  for (let i = points - 1; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 5 * 60 * 1000);
    price += (Math.random() - 0.5) * 0.03;
    result.push({
      time: t.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
      price: +price.toFixed(4),
      weightedAvg: +(price + (Math.random() - 0.5) * 0.02).toFixed(4),
      volume: Math.floor(100 + Math.random() * 800),
    });
  }
  return result;
}
