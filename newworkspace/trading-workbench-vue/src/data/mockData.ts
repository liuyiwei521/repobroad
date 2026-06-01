export type AccountStatus = 'normal' | 'warning' | 'done';
export type Tenor = 'R001' | 'R007' | 'R014' | 'R021' | 'R028';
export type QuoteStatus = 'best' | 'second' | 'normal';
export type ChatStatus = 'unreplied' | 'replied';
export type Direction = 'reverse' | 'repo'; // 逆回购 / 正回购
export type QuoteLevel = 'level1' | 'level2';

export interface AccountRow {
  id: string;
  name: string;
  product: string;
  accountType?: string;
  pledgeRequirement?: string;
  tenor: Tenor;
  targetAmount: number;
  allocatedAmount: number;
  breakevenRate: number;
  status: AccountStatus;
  rule: string;
}

export interface PendingAllocation {
  id: string;
  counterparty: string;
  amount: number;
  rate: number;
  tenor: Tenor;
  time: string;
  source: string;
  direction?: Direction;
}

export interface Institution {
  id: string;
  name: string;
}

export interface DealColumn {
  id: string;
  institutionId: string;
  term: Tenor;
  dealAmount: number;
  rate: number;
  direction: Direction;
  dealTime: string;
  batchNo: string;
  source: string;
}

export interface AllocationCell {
  accountId: string;
  dealColumnId: string;
  amount: number;
}

export interface MatrixContextDraftCell {
  accountId: string;
  amount: number;
}

export interface MatrixContextInput {
  source: string;
  sourceId?: string;
  counterparty: string;
  institution?: string;
  institutionId?: string;
  term: Tenor;
  dealAmount: number;
  rate: number;
  direction: Direction;
  dealTime: string;
  batchNo?: string;
  filledAmount?: number;
  pendingAmount?: number;
  aiDraftStatus?: string;
  draftCells?: MatrixContextDraftCell[];
}

export interface MatrixContext extends MatrixContextInput {
  id: string;
  institutionId: string;
  dealColumnId: string;
  batchNo: string;
  pendingId?: string;
}

export interface MarketQuote {
  id: string;
  group: string;
  institution: string;
  counterparty: string;
  status: QuoteStatus;
  level: QuoteLevel;
  allowedAccounts: string[];
  tenor: Tenor;
  rate: number;
  accountRequirement: string;
  limit: string;
  collateralRequirement: string;
  collateral: string;
  updatedAt: string;
  amount: number;
  rates: Partial<Record<Tenor, number>>;
  tenorAmounts: Partial<Record<Tenor, number>>; // per-tenor available amounts for display
  direction: Direction;
  sent?: boolean;
}

export interface MarketGroupSummary {
  id: string;
  direction: Direction;
  level: QuoteLevel;
  group: string;
  totalAmount: number;
  avgRate: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ChatThread {
  id: string;
  counterparty: string;
  status: ChatStatus;
  latest: string;
  time: string;
  waitMinutes?: number;
  relatedQuoteId: string;
  unread?: number;
  messages: Array<{
    id: string;
    from: 'trader' | 'counterparty' | 'ai';
    text: string;
    time: string;
  }>;
  username: string;
  collateral?: string;
  chatTenor?: string;
  chatRate?: number;
  chatAmount?: number;
  chatGroup?: string;
  chatLimit?: string;
}

export interface ResearchCard {
  id: string;
  group: string;
  title: string;
  value: string;
  delta: string;
  status: 'normal' | 'delayed' | 'empty' | 'error';
  updatedAt: string;
  details: string[];
}

export const tenors: Tenor[] = ['R001', 'R007', 'R014', 'R021', 'R028'];

export const tenorLabels: Record<Tenor, string> = {
  R001: '1D',
  R007: '7D',
  R014: '14D',
  R021: '21D',
  R028: '28D'
};

export const tenorLabel = (tenor: string | undefined): string =>
  tenor ? tenorLabels[tenor as Tenor] ?? tenor : '';

export const normalizeChatTenor = (tenor: string | undefined): Tenor | undefined => {
  if (!tenor) return undefined;
  const normalized = tenor.trim().toUpperCase();
  if (normalized === 'R001' || normalized === '1D' || normalized === '1天' || normalized === '1' || normalized === 'O/N' || tenor === '隔夜') return 'R001';
  if (normalized === 'R007' || normalized === '7D' || normalized === '7天' || normalized === '7') return 'R007';
  if (normalized === 'R014' || normalized === '14D' || normalized === '14天' || normalized === '14') return 'R014';
  if (normalized === 'R021' || normalized === '21D' || normalized === '21天' || normalized === '21') return 'R021';
  if (normalized === 'R028' || normalized === '28D' || normalized === '28天' || normalized === '28') return 'R028';
  return undefined;
};

export const accounts: AccountRow[] = [
  {
    id: 'acc-zy-001',
    name: '自营一号',
    product: '自营',
    accountType: '自营',
    pledgeRequirement: '利率债',
    tenor: 'R001',
    targetAmount: 18,
    allocatedAmount: 8.5,
    breakevenRate: 1.53,
    status: 'warning',
    rule: '限自营，优先低久期'
  },
  {
    id: 'acc-zy-014',
    name: '自营稳健',
    product: '自营',
    accountType: '自营',
    pledgeRequirement: '地方债',
    tenor: 'R014',
    targetAmount: 12,
    allocatedAmount: 8.2,
    breakevenRate: 1.66,
    status: 'normal',
    rule: '可做质押，R014 优先'
  },
  {
    id: 'acc-lc-007',
    name: '理财现金',
    product: '理财',
    accountType: '理财',
    pledgeRequirement: '利率债',
    tenor: 'R007',
    targetAmount: 16,
    allocatedAmount: 16,
    breakevenRate: 1.48,
    status: 'done',
    rule: '已完成，仍可微调'
  },
  {
    id: 'acc-lc-014',
    name: '理财增强',
    product: '理财',
    accountType: '理财',
    pledgeRequirement: '地方债',
    tenor: 'R014',
    targetAmount: 20,
    allocatedAmount: 9.8,
    breakevenRate: 1.61,
    status: 'normal',
    rule: '不留趴账，需准入'
  },
  {
    id: 'acc-gm-028',
    name: '公募组合',
    product: '公募',
    accountType: '公募',
    pledgeRequirement: '国股存单',
    tenor: 'R028',
    targetAmount: 10,
    allocatedAmount: 2,
    breakevenRate: 1.72,
    status: 'warning',
    rule: '开 CD 仅限一级'
  },
  {
    id: 'acc-zy-007',
    name: '自营套利',
    product: '自营',
    accountType: '自营',
    pledgeRequirement: '信用债',
    tenor: 'R007',
    targetAmount: 15,
    allocatedAmount: 6,
    breakevenRate: 1.55,
    status: 'normal',
    rule: '日内套利，控制久期'
  },
  {
    id: 'acc-zy-021',
    name: '自营波段',
    product: '自营',
    accountType: '自营',
    pledgeRequirement: '地方债',
    tenor: 'R021',
    targetAmount: 8,
    allocatedAmount: 8,
    breakevenRate: 1.69,
    status: 'done',
    rule: '波段持有，已满仓'
  },
  {
    id: 'acc-lc-001',
    name: '理财活钱',
    product: '理财',
    accountType: '理财',
    pledgeRequirement: '地方债',
    tenor: 'R001',
    targetAmount: 22,
    allocatedAmount: 12.4,
    breakevenRate: 1.5,
    status: 'normal',
    rule: '高流动性，隔夜优先'
  },
  {
    id: 'acc-lc-028',
    name: '理财长盈',
    product: '理财',
    accountType: '理财',
    pledgeRequirement: '同业存单',
    tenor: 'R028',
    targetAmount: 14,
    allocatedAmount: 3,
    breakevenRate: 1.75,
    status: 'warning',
    rule: '拉久期，需准入'
  },
  {
    id: 'acc-gm-007',
    name: '公募货币',
    product: '公募',
    accountType: '公募',
    pledgeRequirement: '国股存单',
    tenor: 'R007',
    targetAmount: 25,
    allocatedAmount: 18,
    breakevenRate: 1.46,
    status: 'normal',
    rule: '货币基金，限一级'
  },
  {
    id: 'acc-gm-014',
    name: '公募债基',
    product: '公募',
    accountType: '公募',
    pledgeRequirement: '信用债',
    tenor: 'R014',
    targetAmount: 16,
    allocatedAmount: 4.5,
    breakevenRate: 1.63,
    status: 'warning',
    rule: '债基配置，看资金面'
  },
  {
    id: 'acc-zx-001',
    name: '专户定制',
    product: '专户',
    accountType: '专户',
    pledgeRequirement: '信用债',
    tenor: 'R001',
    targetAmount: 9,
    allocatedAmount: 9,
    breakevenRate: 1.52,
    status: 'done',
    rule: '专户限定，已完成'
  },
  {
    id: 'acc-nj-014',
    name: '年金组合',
    product: '年金',
    accountType: '年金',
    pledgeRequirement: '信用债',
    tenor: 'R014',
    targetAmount: 11,
    allocatedAmount: 5.5,
    breakevenRate: 1.6,
    status: 'normal',
    rule: '年金户，稳健为主'
  }
];

type MarketQuoteSeed = Omit<MarketQuote, 'counterparty' | 'limit' | 'collateral' | 'rates' | 'tenorAmounts' | 'status'>;

const createMarketQuote = (quote: MarketQuoteSeed): MarketQuote => ({
  ...quote,
  counterparty: quote.institution,
  limit: quote.accountRequirement,
  collateral: quote.collateralRequirement,
  rates: { [quote.tenor]: quote.rate },
  tenorAmounts: { [quote.tenor]: quote.amount },
  status: 'normal'
});

// ── 逆回购 / 正回购逐行行情（我方融出/融入，供右栏表格直接消费） ─────────────
export const marketQuotes: MarketQuote[] = [
  createMarketQuote({
    id: 'quote-citic-bank-r001',
    direction: 'reverse',
    group: '利率地方',
    institution: '中信银行',
    level: 'level1',
    tenor: 'R001',
    amount: 0,
    rate: 1.35,
    accountRequirement: '自营',
    collateralRequirement: '利率',
    updatedAt: '10:53:27',
    allowedAccounts: ['acc-zy-001', 'acc-zy-014']
  }),
  createMarketQuote({
    id: 'quote-shrcb',
    direction: 'reverse',
    group: '利率地方',
    institution: '上海农商行',
    level: 'level1',
    tenor: 'R001',
    amount: 0,
    rate: 1.41,
    accountRequirement: '非专户',
    collateralRequirement: '利率',
    updatedAt: '10:53:27',
    allowedAccounts: ['acc-zy-001', 'acc-lc-007', 'acc-lc-014']
  }),
  createMarketQuote({
    id: 'quote-beijing-r007',
    direction: 'reverse',
    group: '利率地方',
    institution: '北京银行',
    level: 'level1',
    tenor: 'R007',
    amount: 5,
    rate: 1.40,
    accountRequirement: '非专户',
    collateralRequirement: '利率地方存单商金',
    updatedAt: '10:53:27',
    allowedAccounts: ['acc-lc-007', 'acc-lc-014']
  }),
  createMarketQuote({
    id: 'quote-hzbank',
    direction: 'reverse',
    group: '利率地方',
    institution: '浦发银行',
    level: 'level1',
    tenor: 'R007',
    amount: 4,
    rate: 1.43,
    accountRequirement: '自营',
    collateralRequirement: '地方债',
    updatedAt: '10:53:14',
    allowedAccounts: ['acc-zy-001', 'acc-lc-007', 'acc-lc-014']
  }),
  createMarketQuote({
    id: 'quote-bob-ncd-r001',
    direction: 'reverse',
    group: '存单商金',
    institution: '北京银行',
    level: 'level1',
    tenor: 'R001',
    amount: 0,
    rate: 1.40,
    accountRequirement: '非专户',
    collateralRequirement: '利率地方存单商金',
    updatedAt: '10:53:27',
    allowedAccounts: ['acc-zy-001', 'acc-lc-014']
  }),
  createMarketQuote({
    id: 'quote-taikang-r001',
    direction: 'reverse',
    group: '存单商金',
    institution: '泰康资产',
    level: 'level1',
    tenor: 'R001',
    amount: 0,
    rate: 1.42,
    accountRequirement: '可专户',
    collateralRequirement: '国股存单',
    updatedAt: '10:53:04',
    allowedAccounts: ['acc-lc-007', 'acc-lc-014']
  }),
  createMarketQuote({
    id: 'quote-abcwm-r007',
    direction: 'reverse',
    group: '存单商金',
    institution: '农银理财',
    level: 'level1',
    tenor: 'R007',
    amount: 2,
    rate: 1.42,
    accountRequirement: '可专户',
    collateralRequirement: '大行存单',
    updatedAt: '10:53:27',
    allowedAccounts: ['acc-lc-007', 'acc-lc-014']
  }),
  createMarketQuote({
    id: 'quote-sunshine-r007',
    direction: 'reverse',
    group: '存单商金',
    institution: '阳光资产',
    level: 'level1',
    tenor: 'R007',
    amount: 5,
    rate: 1.40,
    accountRequirement: '可专户',
    collateralRequirement: '利率地方存单商金',
    updatedAt: '10:53:27',
    allowedAccounts: ['acc-lc-007', 'acc-lc-014', 'acc-gm-028']
  }),
  createMarketQuote({
    id: 'quote-nbcb',
    direction: 'reverse',
    group: '存单商金',
    institution: '宁波通商',
    level: 'level1',
    tenor: 'R028',
    amount: 8,
    rate: 1.78,
    accountRequirement: '公募/理财',
    collateralRequirement: '国股存单',
    updatedAt: '10:53:27',
    allowedAccounts: ['acc-gm-028', 'acc-lc-014']
  }),
  createMarketQuote({
    id: 'quote-citic',
    direction: 'reverse',
    group: '信用',
    institution: '中信建投证券',
    level: 'level1',
    tenor: 'R001',
    amount: 2.45,
    rate: 1.43,
    accountRequirement: '自营',
    collateralRequirement: '年金户',
    updatedAt: '10:53:27',
    allowedAccounts: ['acc-zy-001', 'acc-lc-014']
  }),
  createMarketQuote({
    id: 'quote-pingan-am-r001',
    direction: 'reverse',
    group: '信用',
    institution: '平安资产',
    level: 'level1',
    tenor: 'R001',
    amount: 0,
    rate: 1.43,
    accountRequirement: '可专户',
    collateralRequirement: '单笔 1e 起',
    updatedAt: '10:53:27',
    allowedAccounts: ['acc-lc-007', 'acc-lc-014']
  }),
  createMarketQuote({
    id: 'quote-penghua-r007',
    direction: 'reverse',
    group: '信用',
    institution: '鹏华基金',
    level: 'level1',
    tenor: 'R007',
    amount: 4,
    rate: 1.45,
    accountRequirement: '公募',
    collateralRequirement: '信用',
    updatedAt: '10:53:27',
    allowedAccounts: ['acc-lc-007', 'acc-gm-028']
  }),
  createMarketQuote({
    id: 'quote-citic-sec-r007',
    direction: 'reverse',
    group: '信用',
    institution: '中信证券',
    level: 'level1',
    tenor: 'R007',
    amount: 5,
    rate: 1.46,
    accountRequirement: '自营',
    collateralRequirement: '信用',
    updatedAt: '10:53:19',
    allowedAccounts: ['acc-zy-001', 'acc-lc-007']
  }),
  createMarketQuote({
    id: 'quote-huaan-r014',
    direction: 'reverse',
    group: '信用',
    institution: '华安基金',
    level: 'level1',
    tenor: 'R014',
    amount: 3,
    rate: 1.45,
    accountRequirement: '公募',
    collateralRequirement: '信用',
    updatedAt: '10:53:27',
    allowedAccounts: ['acc-lc-014', 'acc-gm-028']
  }),
  createMarketQuote({
    id: 'quote-df-r014',
    direction: 'reverse',
    group: '信用',
    institution: '东方红资产',
    level: 'level1',
    tenor: 'R014',
    amount: 0,
    rate: 1.47,
    accountRequirement: '专户出老户',
    collateralRequirement: '年金户',
    updatedAt: '10:53:09',
    allowedAccounts: ['acc-lc-014']
  }),
  createMarketQuote({
    id: 'quote-pingan-am',
    direction: 'reverse',
    group: '信用',
    institution: '平安资产',
    level: 'level2',
    tenor: 'R007',
    amount: 5,
    rate: 1.44,
    accountRequirement: '可专户',
    collateralRequirement: '信用',
    updatedAt: '10:52:57',
    allowedAccounts: ['acc-lc-007', 'acc-lc-014', 'acc-gm-028']
  }),
  createMarketQuote({
    id: 'quote-cmb-fund-r014',
    direction: 'reverse',
    group: '存单商金',
    institution: '招商基金',
    level: 'level2',
    tenor: 'R014',
    amount: 6,
    rate: 1.49,
    accountRequirement: '专户',
    collateralRequirement: '商金存单',
    updatedAt: '10:52:41',
    allowedAccounts: ['acc-lc-014', 'acc-gm-028']
  }),
  createMarketQuote({
    id: 'quote-boc-repo',
    direction: 'repo',
    group: '利率地方',
    institution: '中国银行',
    level: 'level1',
    tenor: 'R001',
    amount: 8,
    rate: 1.51,
    accountRequirement: '自营',
    collateralRequirement: '利率',
    updatedAt: '10:53:27',
    allowedAccounts: ['acc-zy-001', 'acc-zy-014']
  }),
  createMarketQuote({
    id: 'quote-abc-repo',
    direction: 'repo',
    group: '利率地方',
    institution: '农业银行',
    level: 'level1',
    tenor: 'R001',
    amount: 6,
    rate: 1.52,
    accountRequirement: '自营',
    collateralRequirement: '利率',
    updatedAt: '10:53:18',
    allowedAccounts: ['acc-zy-001', 'acc-zy-014']
  }),
  createMarketQuote({
    id: 'quote-ccb-repo-rate',
    direction: 'repo',
    group: '利率地方',
    institution: '建设银行',
    level: 'level1',
    tenor: 'R007',
    amount: 0,
    rate: 1.53,
    accountRequirement: '自营',
    collateralRequirement: '利率地方',
    updatedAt: '10:53:27',
    allowedAccounts: ['acc-zy-001', 'acc-zy-014']
  }),
  createMarketQuote({
    id: 'quote-icbc-repo',
    direction: 'repo',
    group: '利率地方',
    institution: '工商银行',
    level: 'level1',
    tenor: 'R007',
    amount: 5,
    rate: 1.54,
    accountRequirement: '自营',
    collateralRequirement: '利率',
    updatedAt: '10:53:09',
    allowedAccounts: ['acc-zy-001', 'acc-zy-014']
  }),
  createMarketQuote({
    id: 'quote-cbcwm-repo',
    direction: 'repo',
    group: '存单商金',
    institution: '建信理财',
    level: 'level1',
    tenor: 'R001',
    amount: 4,
    rate: 1.57,
    accountRequirement: '可专户',
    collateralRequirement: '国股存单',
    updatedAt: '10:53:14',
    allowedAccounts: ['acc-lc-007', 'acc-lc-014']
  }),
  createMarketQuote({
    id: 'quote-icbcwm-repo',
    direction: 'repo',
    group: '存单商金',
    institution: '工银理财',
    level: 'level1',
    tenor: 'R001',
    amount: 3,
    rate: 1.56,
    accountRequirement: '可专户',
    collateralRequirement: '商金存单',
    updatedAt: '10:53:27',
    allowedAccounts: ['acc-lc-007', 'acc-lc-014']
  }),
  createMarketQuote({
    id: 'quote-cmbwm-repo',
    direction: 'repo',
    group: '存单商金',
    institution: '招银理财',
    level: 'level1',
    tenor: 'R007',
    amount: 0,
    rate: 1.58,
    accountRequirement: '可专户',
    collateralRequirement: '国股存单',
    updatedAt: '10:53:27',
    allowedAccounts: ['acc-lc-007', 'acc-lc-014']
  }),
  createMarketQuote({
    id: 'quote-cmb-repo',
    direction: 'repo',
    group: '存单商金',
    institution: '招商理财',
    level: 'level2',
    tenor: 'R001',
    amount: 7,
    rate: 1.57,
    accountRequirement: '可专户',
    collateralRequirement: '商金存单',
    updatedAt: '10:53:27',
    allowedAccounts: ['acc-lc-007', 'acc-lc-014']
  }),
  createMarketQuote({
    id: 'quote-boc-repo-l2',
    direction: 'repo',
    group: '利率地方',
    institution: '中国银行',
    level: 'level2',
    tenor: 'R007',
    amount: 6,
    rate: 1.53,
    accountRequirement: '自营',
    collateralRequirement: '利率',
    updatedAt: '10:52:59',
    allowedAccounts: ['acc-zy-001', 'acc-zy-014']
  })
];

// ── 动态计算行情最优/次优：按 (方向, 分组, 层级, 期限) 分组，最低利率为最优 ─────────────
const computeQuoteStatuses = (quotes: MarketQuote[]): void => {
  // 按 (方向, 分组, 层级, 期限) 分组
  const groups = new Map<string, MarketQuote[]>();
  for (const quote of quotes) {
    const key = `${quote.direction}|${quote.group}|${quote.level}|${quote.tenor}`;
    const group = groups.get(key);
    if (group) {
      group.push(quote);
    } else {
      groups.set(key, [quote]);
    }
  }

  // 组内按利率升序（利率越低越优），同利率按金额降序（金额越大越优）
  for (const [, group] of groups) {
    group.sort((a, b) => {
      if (a.rate !== b.rate) return a.rate - b.rate;
      return b.amount - a.amount;
    });

    // 第 1 名为最优，第 2 名为次优，其余为普通
    group.forEach((quote, index) => {
      if (index === 0) quote.status = 'best';
      else if (index === 1) quote.status = 'second';
      // else 保持 'normal'（createMarketQuote 默认值）
    });
  }
};

computeQuoteStatuses(marketQuotes);

// 成交列以「机构 × 期限」网格组织：每个机构下并列多个期限列，columns 按机构
// 连续排列，矩阵表头才能用机构分组（colspan）+ 期限子列（dashed 分隔）展示。
interface DealGridGroup {
  institution: string;
  cells: Array<{ term: Tenor; amount: number; rate: number }>;
}

const dealGrid: DealGridGroup[] = [
  {
    institution: '北京银行',
    cells: [
      { term: 'R001', amount: 6, rate: 1.40 },
      { term: 'R007', amount: 5, rate: 1.40 }
    ]
  },
  {
    institution: '浦发银行',
    cells: [
      { term: 'R007', amount: 4, rate: 1.43 },
      { term: 'R014', amount: 3, rate: 1.46 }
    ]
  },
  {
    institution: '农银理财',
    cells: [
      { term: 'R007', amount: 2, rate: 1.42 },
      { term: 'R014', amount: 4, rate: 1.45 }
    ]
  },
  {
    institution: '阳光资产',
    cells: [
      { term: 'R007', amount: 5, rate: 1.40 },
      { term: 'R028', amount: 3, rate: 1.79 }
    ]
  },
  {
    institution: '宁波通商',
    cells: [
      { term: 'R028', amount: 8, rate: 1.78 }
    ]
  },
  {
    institution: '中信证券',
    cells: [
      { term: 'R001', amount: 2.45, rate: 1.43 },
      { term: 'R007', amount: 5, rate: 1.46 }
    ]
  },
  {
    institution: '山西证券',
    cells: [
      { term: 'R001', amount: 3, rate: 1.44 },
      { term: 'R007', amount: 4, rate: 1.47 }
    ]
  },
  {
    institution: '鹏华基金',
    cells: [
      { term: 'R007', amount: 4, rate: 1.45 },
      { term: 'R014', amount: 3, rate: 1.46 }
    ]
  },
  {
    institution: '中信建投证券',
    cells: [
      { term: 'R001', amount: 2.45, rate: 1.43 }
    ]
  }
];

const institutionNames = Array.from(
  new Set([
    ...marketQuotes.map((quote) => quote.institution || quote.counterparty),
    ...dealGrid.map((group) => group.institution)
  ])
);

export const institutions: Institution[] = institutionNames.map((name, index) => ({
  id: `inst-${String(index + 1).padStart(2, '0')}`,
  name
}));

const institutionIdByName = new Map(institutions.map((institution) => [institution.name, institution.id]));

let dealSeq = 0;
export const dealColumns: DealColumn[] = dealGrid.flatMap((group) =>
  group.cells.map((cell) => {
    dealSeq += 1;
    return {
      id: `deal-seed-${String(dealSeq).padStart(2, '0')}`,
      institutionId: institutionIdByName.get(group.institution) ?? institutions[0]?.id ?? 'inst-01',
      term: cell.term,
      dealAmount: cell.amount,
      rate: cell.rate,
      direction: 'reverse' as Direction,
      dealTime: '10:53:27',
      batchNo: `B${String(dealSeq).padStart(3, '0')}`,
      source: '行情成交'
    };
  })
);

export const allocationCells: AllocationCell[] = [];

const groupSummaryKey = (quote: MarketQuote) => `${quote.direction}-${quote.level}-${quote.group}`;

export const marketGroupSummaries: MarketGroupSummary[] = Array.from(
  marketQuotes.reduce((groups, quote) => {
    const key = groupSummaryKey(quote);
    const current = groups.get(key) ?? [];
    current.push(quote);
    groups.set(key, current);
    return groups;
  }, new Map<string, MarketQuote[]>())
).map(([id, rows]) => {
  const [direction, level, group] = id.split('-') as [Direction, QuoteLevel, string];
  const totalAmount = Number(rows.reduce((sum, quote) => sum + quote.amount, 0).toFixed(2));
  const avgRate = Number((rows.reduce((sum, quote) => sum + quote.rate, 0) / Math.max(rows.length, 1)).toFixed(2));
  const pageSize = rows.length >= 6 ? 6 : 4;
  return {
    id,
    direction,
    level,
    group,
    totalAmount,
    avgRate,
    page: 1,
    pageSize,
    totalPages: Math.max(1, Math.ceil(rows.length / pageSize))
  };
});

const baseChats: ChatThread[] = [
  {
    id: 'chat-shrcb',
    counterparty: '上海农商',
    status: 'unreplied',
    latest: 'R014 1.68，15 亿以内，上午有效',
    time: '10:52',
    waitMinutes: 8,
    relatedQuoteId: 'quote-shrcb',
    unread: 2,
    username: '凯经理',
    collateral: '利率债',
    chatTenor: 'R014',
    chatRate: 1.68,
    chatAmount: 15,
    chatGroup: '利率地方',
    chatLimit: '自营/理财',
    messages: [
      { id: 'm1', from: 'counterparty', text: 'R014 1.68，15 亿以内，上午有效。', time: '10:49' },
      { id: 'm2', from: 'ai', text: 'AI 已解析：期限 R014，利率 1.68%，可分 15 亿。', time: '10:50' },
      { id: 'm3', from: 'trader', text: '自营和理财都能接吗？', time: '10:51' },
      { id: 'm4', from: 'counterparty', text: '可以，自营/理财都可以。', time: '10:52' }
    ]
  },
  {
    id: 'chat-hzbank',
    counterparty: '杭州银行',
    status: 'replied',
    latest: 'R007 1.57，可拆 12 亿',
    time: '10:41',
    relatedQuoteId: 'quote-hzbank',
    unread: 0,
    username: '艾米',
    collateral: '利率债',
    chatTenor: 'R007',
    chatRate: 1.57,
    chatAmount: 12,
    chatGroup: '利率地方',
    chatLimit: '不限户',
    messages: [
      { id: 'm1', from: 'counterparty', text: 'R007 1.57，可拆 12 亿。', time: '10:38' },
      { id: 'm2', from: 'trader', text: '收到，先挂着。', time: '10:41' }
    ]
  },
  {
    id: 'chat-nbcb',
    counterparty: '宁波通商',
    status: 'unreplied',
    latest: 'R028 1.78，公募可做',
    time: '10:35',
    waitMinutes: 15,
    relatedQuoteId: 'quote-nbcb',
    unread: 1,
    username: '李欧',
    collateral: '国股存单',
    chatTenor: 'R028',
    chatRate: 1.78,
    chatAmount: 8,
    chatGroup: '存单商金',
    chatLimit: '公募/理财',
    messages: [
      { id: 'm1', from: 'counterparty', text: 'R028 1.78，公募可做，8 亿以内。', time: '10:35' },
      { id: 'm2', from: 'ai', text: 'AI 提示：匹配公募组合，仍需额度校验。', time: '10:35' }
    ]
  },
  {
    id: 'chat-pf-liu',
    counterparty: '浦发银行',
    status: 'unreplied',
    latest: 'R007 1.43，4亿，自营',
    time: '10:48',
    waitMinutes: 1,
    relatedQuoteId: 'quote-hzbank',
    unread: 1,
    username: '刘经理',
    collateral: '地方债',
    chatTenor: 'R007',
    chatRate: 1.43,
    chatAmount: 4,
    chatGroup: '利率地方',
    chatLimit: '自营',
    messages: [
      { id: 'm1', from: 'counterparty', text: 'R007 1.43，4亿，自营。', time: '10:48' },
      { id: 'm2', from: 'ai', text: 'AI 已解析：R007，利率 1.43%，金额 4 亿。', time: '10:48' }
    ]
  },
  {
    id: 'chat-bj-wang',
    counterparty: '北京银行',
    status: 'replied',
    latest: 'R007 1.40，5亿，非专户',
    time: '10:25',
    relatedQuoteId: 'quote-beijing-r007',
    unread: 0,
    username: '王经理',
    collateral: '利率/存单',
    chatTenor: 'R007',
    chatRate: 1.40,
    chatAmount: 5,
    chatGroup: '存单商金',
    chatLimit: '非专户',
    messages: [
      { id: 'm1', from: 'counterparty', text: 'R007 1.40，5亿，非专户。', time: '10:25' },
      { id: 'm2', from: 'trader', text: '价格可以，先记一下。', time: '10:26' }
    ]
  },
  {
    id: 'chat-tk-zhang',
    counterparty: '中信建投',
    status: 'replied',
    latest: 'R001 1.43，2.5亿 年金',
    time: '10:30',
    relatedQuoteId: 'quote-citic',
    unread: 0,
    username: '张经理',
    collateral: '年金户',
    chatTenor: 'R001',
    chatRate: 1.43,
    chatAmount: 2.5,
    chatGroup: '信用',
    chatLimit: '自营',
    messages: [
      { id: 'm1', from: 'counterparty', text: 'R001 1.43，2.5亿，年金户。', time: '10:30' },
      { id: 'm2', from: 'trader', text: '收到，信用口径我确认下。', time: '10:31' }
    ]
  },
  {
    id: 'chat-thk-chen',
    counterparty: '泰康资产',
    status: 'replied',
    latest: 'R001 1.42，可专户',
    time: '10:20',
    relatedQuoteId: 'quote-taikang-r001',
    unread: 0,
    username: '陈经理',
    collateral: '国股存单',
    chatTenor: 'R001',
    chatRate: 1.42,
    chatAmount: 0,
    chatGroup: '存单商金',
    chatLimit: '可专户',
    messages: [
      { id: 'm1', from: 'counterparty', text: 'R001 1.42，可专户。', time: '10:20' },
      { id: 'm2', from: 'trader', text: '好，我放到候选里。', time: '10:21' }
    ]
  },
  {
    id: 'chat-cmb-l2',
    counterparty: '招商基金',
    status: 'unreplied',
    latest: 'R014 1.49，专户可做，6亿',
    time: '10:44',
    waitMinutes: 6,
    relatedQuoteId: 'quote-cmb-fund-r014',
    unread: 1,
    username: '周经理',
    collateral: '商金存单',
    chatTenor: 'R014',
    chatRate: 1.49,
    chatAmount: 6,
    chatGroup: '存单商金',
    chatLimit: '专户',
    messages: [
      { id: 'm1', from: 'counterparty', text: 'R014 1.49，专户可做，6亿。', time: '10:44' },
      { id: 'm2', from: 'ai', text: 'AI 提示：二级报价，需确认户类准入。', time: '10:45' }
    ]
  },
  {
    id: 'chat-icbc-repo',
    counterparty: '工商银行',
    status: 'replied',
    latest: '可以，R007 2.15 给你，国债质押',
    time: '10:28',
    relatedQuoteId: 'quote-icbc-repo',
    unread: 0,
    username: '张经理',
    collateral: '国债',
    chatTenor: 'R007',
    chatRate: 2.15,
    chatAmount: 10,
    chatGroup: '利率地方',
    chatLimit: '自营',
    messages: [
      { id: 'm1', from: 'trader', text: 'R007 正回购，10 亿，价格如何？', time: '10:25' },
      { id: 'm2', from: 'counterparty', text: '可以，R007 2.15 给你，国债质押。', time: '10:28' }
    ]
  },
  {
    id: 'chat-spdb-sparse',
    counterparty: '兴业银行',
    status: 'unreplied',
    latest: '有量吗？短期的都行',
    time: '10:55',
    waitMinutes: 3,
    relatedQuoteId: 'quote-shrcb',
    unread: 1,
    username: '王经理',
    messages: [
      { id: 'm1', from: 'counterparty', text: '有量吗？短期的都行', time: '10:55' },
      { id: 'm2', from: 'ai', text: 'AI 提示：缺少明确期限、金额与价格，需人工追问。', time: '10:55' }
    ]
  },
  {
    id: 'chat-abc-sparse',
    counterparty: '农业银行',
    status: 'unreplied',
    latest: '1.55 能做吗',
    time: '10:58',
    waitMinutes: 2,
    relatedQuoteId: 'quote-shrcb',
    unread: 1,
    username: '李经理',
    chatRate: 1.55,
    messages: [
      { id: 'm1', from: 'counterparty', text: '1.55 能做吗', time: '10:58' },
      { id: 'm2', from: 'ai', text: 'AI 提示：仅识别到利率 1.55%，期限与金额缺失。', time: '10:58' }
    ]
  },
  {
    id: 'chat-bocom-sparse',
    counterparty: '交通银行',
    status: 'replied',
    latest: '20亿 利率债质押 能收就收',
    time: '10:15',
    relatedQuoteId: 'quote-shrcb',
    unread: 0,
    username: '赵经理',
    chatAmount: 20,
    collateral: '利率债',
    messages: [
      { id: 'm1', from: 'counterparty', text: '20亿 利率债质押 能收就收', time: '10:15' },
      { id: 'm2', from: 'trader', text: '好的 等确认', time: '10:16' }
    ]
  },
  {
    id: 'chat-ccb-sparse',
    counterparty: '建设银行',
    status: 'unreplied',
    latest: '问下14天的价格',
    time: '11:02',
    waitMinutes: 1,
    relatedQuoteId: 'quote-shrcb',
    unread: 1,
    username: '孙经理',
    chatTenor: 'R014',
    messages: [
      { id: 'm1', from: 'counterparty', text: '问下14天的价格', time: '11:02' },
      { id: 'm2', from: 'ai', text: 'AI 提示：识别到 14 天需求，金额与质押要求待补充。', time: '11:02' }
    ]
  }
];

const mockContactNames = [
  '张经理', '李明', '王晓晨', '陈老师', '赵总', '刘佳', '孙悦', '周宁', '吴昊', '郑欣',
  '黄晨', '马骁', '何静', '郭磊', '林璐', '高远', '唐敏', '许诺', '宋一凡', '邓琪',
  '韩雪', '曹睿', '袁航', '蒋雯', '沈越', '程曦', '罗成', '梁夏', '谢雨', '潘宁'
];

const mockCounterparties = [
  '工商银行', '农业银行', '中国银行', '建设银行', '交通银行', '邮储银行', '招商银行', '浦发银行',
  '中信银行', '兴业银行', '民生银行', '光大银行', '平安银行', '华夏银行', '北京银行', '上海银行',
  '江苏银行', '南京银行', '宁波银行', '杭州银行', '上海农商行', '重庆农商行', '广州农商行', '成都农商行',
  '中信证券', '国泰君安', '华泰证券', '招商证券', '广发证券', '东方证券', '中金公司', '中信建投证券',
  '易方达基金', '华夏基金', '南方基金', '嘉实基金', '招商基金', '鹏华基金', '博时基金', '华安基金',
  '工银理财', '建信理财', '招银理财', '农银理财', '中银理财', '平安理财', '泰康资产', '太保资产',
  '平安资产', '阳光资产'
];

const mockCollateralOptions = ['利率债', '地方债', '国股存单', '信用债', '商金存单', '大行存单', '国债', '政策性金融债', '年金户'];
const mockChatGroups = ['利率地方', '存单商金', '信用'];
const mockChatLimits = ['自营', '理财', '公募', '可专户', '非专户', '不限户', '专户', '资管户', '自营/理财'];
const mockOneDayTenors = ['R001', '1D', '1天', '隔夜', '1', 'O/N'];
const mockSevenDayTenors = ['R007', '7D', '7天', '7'];
const mockOtherTenors = ['2', '3', '5', '13', 'R014', '14D', '21D', 'R021', 'R028', '跨月'];
const mockRelatedQuoteIds = marketQuotes.map((quote) => quote.id);
const mockRelatedQuoteIdsByStatus = {
  best: marketQuotes.filter((quote) => quote.status === 'best').map((quote) => quote.id),
  second: marketQuotes.filter((quote) => quote.status === 'second').map((quote) => quote.id),
  normal: marketQuotes.filter((quote) => quote.status === 'normal').map((quote) => quote.id)
};

const includeMockField = (index: number, salt: number) => ((index * 7 + salt * 11) % 10) < 4;

const pickMockValue = <T>(values: T[], index: number, salt = 0): T => values[(index * 13 + salt * 5) % values.length];

const pickMockRelatedQuoteId = (index: number) => {
  const score = (index * 37) % 100;
  const pool = score < 3
    ? mockRelatedQuoteIdsByStatus.best
    : score < 15
      ? mockRelatedQuoteIdsByStatus.second
      : mockRelatedQuoteIdsByStatus.normal;
  return pickMockValue(pool.length ? pool : mockRelatedQuoteIds, index, 14);
};

const mockTimeOf = (index: number) => {
  const totalMinutes = 9 * 60 + 30 + ((index * 7) % 93);
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

const mockTenorOf = (index: number) => {
  const bucket = index % 100;
  if (bucket < 80) return pickMockValue(mockOneDayTenors, index, 1);
  if (bucket < 92) return pickMockValue(mockSevenDayTenors, index, 2);
  return pickMockValue(mockOtherTenors, index, 3);
};

const mockRateOf = (tenor: string, index: number) => {
  const normalized = tenor.includes('7') ? 1.48 : tenor.includes('14') || tenor.includes('13') ? 1.58 : tenor.includes('21') || tenor.includes('28') || tenor.includes('跨') ? 1.66 : 1.38;
  return Number((normalized + ((index * 3) % 18) / 100).toFixed(2));
};

const mockAmountOf = (index: number) => {
  const raw = 0.5 + ((index * 17) % 60) / 2;
  return Number(raw.toFixed(raw % 1 === 0 ? 0 : 1));
};

const compactMockParts = (parts: Array<string | undefined>) => parts.filter(Boolean).join('，');

const createMockLatest = (tenor: string | undefined, rate: number | undefined, amount: number | undefined, collateral: string | undefined, limit: string | undefined, index: number) => {
  const structured = compactMockParts([
    tenor,
    rate == null ? undefined : `${rate.toFixed(2)}`,
    amount == null ? undefined : `${amount}亿`,
    collateral,
    limit
  ]);
  if (structured) return structured;
  return pickMockValue(['短端有点量，价格你看下', '隔夜能不能收一点', '今天还有口子吗', '短钱可谈，等你回', '问下今天价格'], index, 9);
};

const createMockMessages = (
  id: string,
  latest: string,
  time: string,
  status: ChatStatus,
  tenor: string | undefined,
  rate: number | undefined,
  amount: number | undefined,
  index: number
): ChatThread['messages'] => {
  const previousMinute = Math.max(Number(time.slice(3, 5)) - 1, 0);
  const previousTime = `${time.slice(0, 3)}${String(previousMinute).padStart(2, '0')}`;
  const messages: ChatThread['messages'] = [
    { id: `${id}-m1`, from: 'counterparty', text: latest, time: previousTime }
  ];

  const parsed = compactMockParts([
    tenor ? `期限 ${tenor}` : undefined,
    rate == null ? undefined : `利率 ${rate.toFixed(2)}%`,
    amount == null ? undefined : `金额 ${amount} 亿`
  ]);
  if (parsed) {
    messages.push({ id: `${id}-m2`, from: 'ai', text: `AI 已解析：${parsed}。`, time: previousTime });
  } else {
    messages.push({ id: `${id}-m2`, from: 'ai', text: 'AI 提示：信息不完整，需补期限/价格/金额。', time: previousTime });
  }

  if (status === 'replied') {
    messages.push({
      id: `${id}-m3`,
      from: 'trader',
      text: pickMockValue(['收到，我先记一下。', '价格我看到了，等我确认账户。', '可以，先挂候选。', '这笔我再核一下准入。'], index, 10),
      time
    });
  } else if (index % 3 === 0) {
    messages.push({
      id: `${id}-m3`,
      from: 'trader',
      text: pickMockValue(['能拆吗？', '可专户吗？', '上午有效还是全天？', '券种限制再确认下。'], index, 11),
      time: previousTime
    });
    messages.push({
      id: `${id}-m4`,
      from: 'counterparty',
      text: pickMockValue(['可以拆，尽快给我量。', '专户要看名单。', '上午先有效。', '券种你发我确认。'], index, 12),
      time
    });
  }

  return messages;
};

const generatedChats: ChatThread[] = Array.from({ length: 200 }, (_, arrayIndex) => {
  const index = arrayIndex + 1;
  const id = `chat-mock-${String(index).padStart(3, '0')}`;
  const status: ChatStatus = index % 10 < 6 ? 'unreplied' : 'replied';
  const time = mockTimeOf(index);
  const tenor = includeMockField(index, 1) ? mockTenorOf(index) : undefined;
  const rate = includeMockField(index, 2) ? mockRateOf(tenor ?? mockTenorOf(index), index) : undefined;
  const amount = includeMockField(index, 3) ? mockAmountOf(index) : undefined;
  const collateral = includeMockField(index, 4) ? pickMockValue(mockCollateralOptions, index, 4) : undefined;
  const chatGroup = includeMockField(index, 5) ? pickMockValue(mockChatGroups, index, 5) : undefined;
  const chatLimit = includeMockField(index, 6) ? pickMockValue(mockChatLimits, index, 6) : undefined;
  const unread = includeMockField(index, 7) ? (status === 'unreplied' ? (index % 3) + 1 : 0) : undefined;
  const latest = createMockLatest(tenor, rate, amount, collateral, chatLimit, index);

  return {
    id,
    counterparty: pickMockValue(mockCounterparties, index),
    status,
    latest,
    time,
    waitMinutes: status === 'unreplied' ? (index % 18) + 1 : undefined,
    relatedQuoteId: pickMockRelatedQuoteId(index),
    unread,
    username: pickMockValue(mockContactNames, index),
    collateral,
    chatTenor: tenor,
    chatRate: rate,
    chatAmount: amount,
    chatGroup,
    chatLimit,
    messages: createMockMessages(id, latest, time, status, tenor, rate, amount, index)
  };
});

export const chats: ChatThread[] = [...baseChats, ...generatedChats];

export const pendingAllocations: PendingAllocation[] = [
  {
    id: 'pending-001',
    counterparty: '上海农商',
    amount: 3.5,
    rate: 1.68,
    tenor: 'R014',
    time: '10:53',
    source: '聊天成交'
  },
  {
    id: 'pending-002',
    counterparty: '宁波通商',
    amount: 2,
    rate: 1.78,
    tenor: 'R028',
    time: '10:36',
    source: 'AI 解析'
  },
  {
    id: 'pending-003',
    counterparty: '杭州银行',
    amount: 5,
    rate: 1.57,
    tenor: 'R007',
    time: '10:41',
    source: '聊天成交'
  },
  {
    id: 'pending-004',
    counterparty: '工商银行',
    amount: 4.2,
    rate: 1.54,
    tenor: 'R007',
    time: '10:29',
    source: 'AI 解析',
    direction: 'repo'
  }
];

export const researchCards: ResearchCard[] = [
  {
    id: 'funding',
    group: '资金面',
    title: '资金情绪',
    value: '偏松 62',
    delta: '+4',
    status: 'normal',
    updatedAt: '10:55',
    details: ['DR007 1.74%，较昨日下行 3bp', '非银融出活跃，短端报价密集', 'AI 判断：上午窗口可优先补 R014']
  },
  {
    id: 'ai-view',
    group: 'AI 判断',
    title: '成交方向',
    value: '先补 R014',
    delta: '置信 82%',
    status: 'normal',
    updatedAt: '10:54',
    details: ['自营稳健与理财增强仍有明显缺口', '上海农商价格覆盖保本要求', '建议先做 8-10 亿，再观察午后资金']
  },
  {
    id: 'benchmark',
    group: '基准价格',
    title: '大行价格',
    value: '1.58 / 1.66',
    delta: 'R007/R014',
    status: 'normal',
    updatedAt: '10:53',
    details: ['R001 1.49，R007 1.58，R014 1.66', '长端报价稳定，R028 可小幅上探']
  },
  {
    id: 'repo',
    group: '基准价格',
    title: '交易所回购',
    value: 'GC007 1.55',
    delta: '-2bp',
    status: 'delayed',
    updatedAt: '10:45',
    details: ['数据延迟 10 分钟', 'GC001 成交量放大，短端波动收窄']
  },
  {
    id: 'xrepo',
    group: '基准价格',
    title: 'XREPO',
    value: '取数失败',
    delta: '请稍后重试',
    status: 'error',
    updatedAt: '10:30',
    details: []
  },
  {
    id: 'ncd',
    group: '基准价格',
    title: 'NCD 同业存单',
    value: 'AAA 1M 1.88',
    delta: '+1bp',
    status: 'normal',
    updatedAt: '10:52',
    details: ['一级发行偏稳', '二级 1M 成交集中在 1.86-1.89']
  },
  {
    id: 'stats',
    group: '结构统计',
    title: '机构分期限统计',
    value: 'R014 最密集',
    delta: '42%',
    status: 'normal',
    updatedAt: '10:51',
    details: ['R014 报价占比 42%', '地方行报价数量增加', '公募限制类报价 2 条']
  }
];
