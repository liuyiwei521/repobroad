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
  relatedQuoteId: string;
  unread: number;
  messages: Array<{
    id: string;
    from: 'trader' | 'counterparty' | 'ai';
    text: string;
    time: string;
  }>;
  // Two-line chat display fields
  username: string;       // e.g. "shrc_kai"
  collateral: string;     // e.g. "利率债", "国股存单"
  chatTenor: Tenor;       // main quoted tenor
  chatRate: number;       // quoted rate
  chatAmount: number;     // quoted amount (亿)
  chatGroup: string;      // e.g. "利率地方"
  chatLimit: string;      // e.g. "自营/理财"
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

export const accounts: AccountRow[] = [
  {
    id: 'acc-zy-001',
    name: '自营一号',
    product: '自营',
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
    tenor: 'R014',
    targetAmount: 11,
    allocatedAmount: 5.5,
    breakevenRate: 1.6,
    status: 'normal',
    rule: '年金户，稳健为主'
  }
];

type MarketQuoteSeed = Omit<MarketQuote, 'counterparty' | 'limit' | 'collateral' | 'rates' | 'tenorAmounts'>;

const createMarketQuote = (quote: MarketQuoteSeed): MarketQuote => ({
  ...quote,
  counterparty: quote.institution,
  limit: quote.accountRequirement,
  collateral: quote.collateralRequirement,
  rates: { [quote.tenor]: quote.rate },
  tenorAmounts: { [quote.tenor]: quote.amount }
});

// ── 逆回购 / 正回购逐行行情（我方融出/融入，供右栏表格直接消费） ─────────────
export const marketQuotes: MarketQuote[] = [
  createMarketQuote({
    id: 'quote-citic-bank-r001',
    direction: 'reverse',
    group: '利率地方',
    institution: '中信银行',
    status: 'best',
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
    status: 'second',
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
    status: 'best',
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
    status: 'second',
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
    status: 'best',
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
    status: 'second',
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
    status: 'best',
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
    status: 'second',
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
    status: 'normal',
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
    status: 'best',
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
    status: 'second',
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
    status: 'best',
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
    status: 'second',
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
    status: 'best',
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
    status: 'second',
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
    status: 'second',
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
    status: 'best',
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
    status: 'best',
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
    status: 'second',
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
    status: 'best',
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
    status: 'second',
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
    status: 'best',
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
    status: 'second',
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
    status: 'best',
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
    status: 'best',
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
    status: 'best',
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

export const chats: ChatThread[] = [
  {
    id: 'chat-shrcb',
    counterparty: '上海农商',
    status: 'unreplied',
    latest: 'R014 1.68，15 亿以内，上午有效',
    time: '10:52',
    relatedQuoteId: 'quote-shrcb',
    unread: 2,
    username: 'shrc_kai',
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
    username: 'hz_amy',
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
    relatedQuoteId: 'quote-nbcb',
    unread: 1,
    username: 'nb_leo',
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
    id: 'chat-icbc-repo',
    counterparty: '工商银行',
    status: 'replied',
    latest: '可以，R007 2.15 给你，国债质押',
    time: '10:28',
    relatedQuoteId: 'quote-icbc-repo',
    unread: 0,
    username: 'icbc_zhang',
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
  }
];

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
