import type { ChatThread, Direction, MarketGroupSummary, MarketQuote, QuoteLevel, QuoteStatus, Tenor } from '../../data/mockData';

export type TenorFilter = Tenor | 'all';

export interface QuoteLine {
  id: string;
  quote: MarketQuote;
  direction: Direction;
  group: string;
  institution: string;
  tenor: Tenor;
  amount: number;
  rate: number;
  accountRequirement: string;
  collateralRequirement: string;
  updatedAt: string;
  status: QuoteStatus;
  isMatched: boolean;
  isSelected: boolean;
  isSent: boolean;
  overviewScore?: number;
}

export interface QuoteGroupView {
  key: string;
  group: string;
  summary: MarketGroupSummary | undefined;
  totalAmount: number;
  avgRate: number;
  rows: QuoteLine[];
}

export interface DirectionSectionView {
  direction: Direction;
  title: string;
  activeLevel: QuoteLevel;
  totalLevels: number;
  groups: QuoteGroupView[];
}

export interface OpponentThreadView {
  id: string;
  chat: ChatThread;
  quote: MarketQuote | undefined;
  level: QuoteLevel;
  isBest: boolean;
  waitLabel: string;
  overviewScore?: number;
}
