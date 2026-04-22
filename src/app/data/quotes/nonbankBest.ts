import type { Quote } from '../types';

export const nonbankBestQuotes: Quote[] = [
  { period: '1',    bidVolume: 1,    bidRate: 1.95, askRate: 2.00, askVolume: 0.3 },
  { period: '7',    bidVolume: 0.9,  bidRate: 1.95, askRate: 2.00, askVolume: 0.8 },
  { period: '14',   bidVolume: 0.88, bidRate: 1.95, askRate: 2.00, askVolume: 0.3 },
  { period: '28',   bidVolume: 0.39, bidRate: 1.95, askRate: 2.00, askVolume: 0.2 },
  { period: '28+',  bidVolume: 0.91, bidRate: 1.95, askRate: 2.00, askVolume: 0.5 },
];
