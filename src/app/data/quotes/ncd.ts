import type { Quote } from '../types';

export const ncdQuotes: Quote[] = [
  { period: '1M', bidRate: 2.25, askRate: 2.27, bidVolume: 0, askVolume: 0, changeBp: 0.02, weightedAvg: 2.26 },
  { period: '3M', bidRate: 2.35, askRate: 2.37, bidVolume: 0, askVolume: 0, changeBp: 0.03, weightedAvg: 2.36 },
  { period: '6M', bidRate: 2.48, askRate: 2.50, bidVolume: 0, askVolume: 0, changeBp: 0.01, weightedAvg: 2.49 },
  { period: '9M', bidRate: 2.62, askRate: 2.64, bidVolume: 0, askVolume: 0, changeBp: -0.01, weightedAvg: 2.63 },
  { period: '1Y', bidRate: 2.75, askRate: 2.77, bidVolume: 0, askVolume: 0, changeBp: 0, weightedAvg: 2.76 },
];
