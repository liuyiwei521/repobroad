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

const traderTemplates: Array<{ keyword: string; trader: string }> = [
  { keyword: '建设银行', trader: '孙经理' },
  { keyword: '农业银行', trader: '李经理' },
  { keyword: '农银', trader: '李经理' },
  { keyword: '交通银行', trader: '赵经理' },
  { keyword: '北京银行', trader: '王经理' },
  { keyword: '浦发银行', trader: '刘经理' },
  { keyword: '招商', trader: '周经理' },
  { keyword: '上海农商', trader: '凯经理' },
  { keyword: '宁波通商', trader: '唐敏' },
  { keyword: '泰康', trader: '陈经理' },
  { keyword: '工商银行', trader: '张经理' }
];

export const traderForInstitution = (institution: string) => {
  const matched = traderTemplates.find((template) => institution.includes(template.keyword));
  return matched?.trader ?? '张经理';
};

export const isCoreOpponentLine = (line: QuoteLine) => line.status === 'best' && line.amount > 0;

export const quoteStatusLabel = (status: QuoteStatus) => {
  if (status === 'best') return '最优';
  if (status === 'second') return '次优';
  return '普通';
};
