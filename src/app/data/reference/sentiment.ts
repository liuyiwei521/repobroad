import type { SentimentPoint } from '../types';

export const currentSentimentIndex = 51;
export const sentimentLabel: '宽松' | '平衡' | '偏紧' =
  currentSentimentIndex < 40 ? '宽松' : currentSentimentIndex <= 60 ? '平衡' : '偏紧';

export function generateSentimentSeries(points: number = 20): SentimentPoint[] {
  const now = new Date();
  const result: SentimentPoint[] = [];
  for (let i = points - 1; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 30 * 60 * 1000);
    result.push({
      time: t.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
      fullMarket: 48 + Math.random() * 6,
      bigBank:    44 + Math.random() * 6,
      smallBank:  50 + Math.random() * 6,
      nonBank:    46 + Math.random() * 6,
    });
  }
  return result;
}
