import type {
  DemandDirection,
  DemandRow,
  DemandTenor,
  ExecutionRow,
  FundGapRow,
  InflightRow,
  CounterpartyTag,
} from "./execution.types";

export const demandTenors: DemandTenor[] = ["R001", "R007"];

export const demandDirectionLabels: Record<DemandDirection, string> = {
  repo: "正回购",
  reverse: "逆回购",
};

export const demandAccountsByDirection: Record<
  DemandDirection,
  Record<DemandTenor, readonly string[]>
> = {
  repo: {
    R001: ["自营稳健户", "理财增强户", "专户现金管理"],
    R007: ["理财增强户", "资管专户", "自营稳健户"],
  },
  reverse: {
    R001: ["现金融出户", "短久期专户", "流动性备付户"],
    R007: ["短久期专户", "现金融出户", "同业配置户"],
  },
};

export const demandRowsByDirection: Record<DemandDirection, DemandRow[]> = {
  repo: [
    {
      label: "利率地方",
      color: "var(--tk-color-chart-blue)",
      cells: {
        R001: { need: 40.6, done: 31.2 },
        R007: { need: 16.4, done: 13.1 },
      },
    },
    {
      label: "存单商金",
      color: "var(--tk-color-chart-gold)",
      cells: {
        R001: { need: 0, done: 0 },
        R007: { need: 25.3, done: 18.4 },
      },
    },
    {
      label: "信用",
      color: "var(--tk-color-chart-purple)",
      cells: {
        R001: { need: 9.2, done: 7.1 },
        R007: { need: 15.7, done: 15.7 },
      },
    },
  ],
  reverse: [
    {
      label: "利率地方",
      color: "var(--tk-color-chart-blue)",
      cells: {
        R001: { need: 29.4, done: 24.3 },
        R007: { need: 20.2, done: 15.5 },
      },
    },
    {
      label: "存单商金",
      color: "var(--tk-color-chart-gold)",
      cells: {
        R001: { need: 0, done: 0 },
        R007: { need: 18.6, done: 12.4 },
      },
    },
    {
      label: "信用",
      color: "var(--tk-color-chart-purple)",
      cells: {
        R001: { need: 6.3, done: 5.1 },
        R007: { need: 9.5, done: 7.2 },
      },
    },
  ],
};

export const fundGapRows = [
  { account: "泰康稳健增利A", total: 15.0 },
  { account: "泰康丰盈债券", total: 8.5 },
  { account: "泰康沪港深精选", total: 5.0 },
  { account: "泰康颐年混合", total: 12.0 },
  { account: "泰康安益纯债", total: 6.0 },
  { account: "泰康裕泰回报", total: 20.0 },
  { account: "泰康策略配置7号", total: 10.0 },
  { account: "泰康宏观回报", total: 25.0 },
  { account: "泰康鑫选利90天", total: 4.0 },
  { account: "泰康添润6个月", total: 9.5 },
  { account: "泰康恒泰回报", total: 3.0 },
  { account: "泰康均衡优选", total: 7.0 },
  { account: "泰康瑞坤纯债", total: 18.0 },
  { account: "泰康稳固收益A", total: 2.5 },
  { account: "泰康新机遇", total: 30.0 },
  { account: "泰康长江经济带", total: 5.5 },
] as const satisfies readonly FundGapRow[];

export const inflightRows = [
  { account: "泰康稳健增利A", total: 15.0, done: 11.7, progress: 78, issuedAt: "09:32", tradeNote: "R001质押回购", investNote: "利率债配置", counterpartyTag: "稳定出钱" as CounterpartyTag },
  { account: "泰康丰盈债券", total: 8.5, done: 3.8, progress: 45, issuedAt: "09:45", tradeNote: "R007逆回购", investNote: "", counterpartyTag: null },
  { account: "泰康颐年混合", total: 12.0, done: 1.4, progress: 12, issuedAt: "10:05", tradeNote: "R001正回购", investNote: "久期匹配", counterpartyTag: null },
  { account: "泰康裕泰回报", total: 20.0, done: 12.0, progress: 60, issuedAt: "10:18", tradeNote: "", investNote: "", counterpartyTag: "保险/保障" as CounterpartyTag },
  { account: "泰康安益纯债", total: 6.0, done: 6.0, progress: 100, issuedAt: "10:22", tradeNote: "已全部成交", investNote: "", counterpartyTag: null },
  { account: "泰康宏观回报", total: 25.0, done: 8.0, progress: 32, issuedAt: "09:28", tradeNote: "R007质押回购", investNote: "流动性备付", counterpartyTag: null },
  { account: "泰康策略配置7号", total: 10.0, done: 9.0, progress: 90, issuedAt: "09:35", tradeNote: "", investNote: "", counterpartyTag: null },
  { account: "泰康新机遇", total: 30.0, done: 2.4, progress: 8, issuedAt: "10:30", tradeNote: "R001逆回购", investNote: "大额待匹配", counterpartyTag: "券商自营" as CounterpartyTag },
  { account: "泰康瑞坤纯债", total: 18.0, done: 9.9, progress: 55, issuedAt: "09:50", tradeNote: "", investNote: "", counterpartyTag: null },
  { account: "泰康添润6个月", total: 9.5, done: 9.5, progress: 100, issuedAt: "09:40", tradeNote: "已全部成交", investNote: "", counterpartyTag: null },
  { account: "泰康均衡优选", total: 7.0, done: 4.8, progress: 68, issuedAt: "10:12", tradeNote: "", investNote: "", counterpartyTag: null },
  { account: "泰康鑫选利90天", total: 4.0, done: 4.0, progress: 100, issuedAt: "10:08", tradeNote: "已全部成交", investNote: "", counterpartyTag: null },
  { account: "泰康长江经济带", total: 5.5, done: 1.1, progress: 20, issuedAt: "10:35", tradeNote: "R001正回购", investNote: "", counterpartyTag: null },
] as const satisfies readonly InflightRow[];

const fundGapRowsByAccount = new Map(fundGapRows.map((row) => [row.account, row]));
const inflightRowsByAccount = new Map(inflightRows.map((row) => [row.account, row]));

export const executionRows: ExecutionRow[] = [
  ...fundGapRows.map((row) => {
    const inflight = inflightRowsByAccount.get(row.account);
    const total = row.total;
    const done = inflight?.done ?? 0;

    return {
      account: row.account,
      total,
      done,
      remaining: Number((total - done).toFixed(1)),
      progress: inflight?.progress ?? null,
      issuedAt: inflight?.issuedAt ?? null,
      tradeNote: inflight?.tradeNote ?? "",
      investNote: inflight?.investNote ?? "",
      counterpartyTag: inflight?.counterpartyTag ?? null,
    };
  }),
  ...inflightRows
    .filter((row) => !fundGapRowsByAccount.has(row.account))
    .map((row) => ({
      account: row.account,
      total: row.total,
      done: row.done,
      remaining: Number((row.total - row.done).toFixed(1)),
      progress: row.progress,
      issuedAt: row.issuedAt,
      tradeNote: row.tradeNote,
      investNote: row.investNote,
      counterpartyTag: row.counterpartyTag,
    })),
];
