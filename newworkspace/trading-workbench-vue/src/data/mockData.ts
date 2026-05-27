export type AccountStatus = 'normal' | 'warning' | 'done';
export type Tenor = 'R001' | 'R007' | 'R014' | 'R021' | 'R028';
export type QuoteStatus = 'best' | 'second' | 'normal';
export type ChatStatus = 'unreplied' | 'replied';
export type Direction = 'reverse' | 'repo'; // 逆回购 / 正回购

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
}

export interface MarketQuote {
  id: string;
  group: string;
  counterparty: string;
  status: QuoteStatus;
  allowedAccounts: string[];
  limit: string;
  amount: number;
  rates: Partial<Record<Tenor, number>>;
  tenorAmounts: Partial<Record<Tenor, number>>; // per-tenor available amounts for display
  direction: Direction;
  sent?: boolean;
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
  }
];

// ── 逆回购行情（我方融出，对手提供质押） ──────────────────────
export const marketQuotes: MarketQuote[] = [
  {
    id: 'quote-shrcb',
    group: '利率地方',
    counterparty: '上海农商',
    status: 'best',
    direction: 'reverse',
    allowedAccounts: ['acc-zy-001', 'acc-zy-014', 'acc-lc-014'],
    limit: '自营/理财',
    amount: 15,
    rates: { R001: 1.55, R007: 1.59, R014: 1.68, R021: 1.71 },
    tenorAmounts: { R001: 3, R007: 5, R014: 4, R021: 3 }
  },
  {
    id: 'quote-hzbank',
    group: '利率地方',
    counterparty: '杭州银行',
    status: 'second',
    direction: 'reverse',
    allowedAccounts: ['acc-zy-001', 'acc-lc-007', 'acc-lc-014'],
    limit: '不限户',
    amount: 12,
    rates: { R001: 1.51, R007: 1.57, R014: 1.62, R028: 1.75 },
    tenorAmounts: { R001: 2, R007: 4, R014: 3, R028: 3 }
  },
  {
    id: 'quote-nbcb',
    group: '存单商金',
    counterparty: '宁波通商',
    status: 'normal',
    direction: 'reverse',
    allowedAccounts: ['acc-gm-028', 'acc-lc-014'],
    limit: '公募/理财',
    amount: 8,
    rates: { R007: 1.56, R014: 1.64, R028: 1.78 },
    tenorAmounts: { R007: 2, R014: 3, R028: 3 }
  },
  {
    id: 'quote-sdccb',
    group: '信用',
    counterparty: '山东城商',
    status: 'normal',
    direction: 'reverse',
    allowedAccounts: ['acc-zy-014', 'acc-gm-028'],
    limit: '白名单',
    amount: 6,
    rates: { R014: 1.7, R021: 1.73, R028: 1.8 },
    tenorAmounts: { R014: 2, R021: 2, R028: 2 }
  },
  // ── 正回购行情（我方融入，提供质押） ──────────────────────────
  {
    id: 'quote-icbc-repo',
    group: '利率地方',
    counterparty: '工商银行',
    status: 'best',
    direction: 'repo',
    allowedAccounts: ['acc-zy-001', 'acc-zy-014'],
    limit: '自营',
    amount: 10,
    rates: { R001: 2.05, R007: 2.15, R014: 2.20 },
    tenorAmounts: { R001: 3, R007: 5, R014: 2 }
  },
  {
    id: 'quote-ccb-repo',
    group: '存单商金',
    counterparty: '建设银行',
    status: 'second',
    direction: 'repo',
    allowedAccounts: ['acc-zy-014', 'acc-lc-014'],
    limit: '自营/理财',
    amount: 8,
    rates: { R007: 2.12, R014: 2.18, R028: 2.25 },
    tenorAmounts: { R007: 3, R014: 3, R028: 2 }
  }
];

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
