import type { Quote, SourceId } from '../types';
import { xrepoQuotes } from './xrepo';
import { nonbankBestQuotes } from './nonbankBest';
import { bankPriceQuotes } from './bankPrice';
import { exchangeQuotes } from './exchange';
import { ncdQuotes } from './ncd';
import { interbankQuotes } from './interbank';

export const quotesBySource: Record<SourceId, Quote[]> = {
  xrepo: xrepoQuotes,
  nonbankBest: nonbankBestQuotes,
  bankPrice: bankPriceQuotes,
  exchange: exchangeQuotes,
  ncd: ncdQuotes,
  interbank: interbankQuotes,
};

export function getQuotes(source: SourceId): Quote[] {
  return quotesBySource[source] ?? [];
}
