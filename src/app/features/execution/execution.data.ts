import type {
  DemandDirection,
  DemandRow,
  DemandTenor,
  ExecutionRow,
  FundGapRow,
  InflightRow,
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
  {
    account: "泰康稳健增利A",
    breakEvenRate: "1.42%",
    gap: "-3.2 / 15.0",
    accountReq: "利率债质押",
    collateralReq: "国债/政金债",
  },
  {
    account: "泰康丰盈债券",
    breakEvenRate: "1.55%",
    gap: "-1.8 / 8.5",
    accountReq: "不限",
    collateralReq: "利率债优先",
  },
  {
    account: "泰康沪港深精选",
    breakEvenRate: "1.38%",
    gap: "0.0 / 5.0",
    accountReq: "信用债可用",
    collateralReq: "AA+以上",
  },
  {
    account: "泰康颐年混合",
    breakEvenRate: "1.60%",
    gap: "-2.5 / 12.0",
    accountReq: "利率债质押",
    collateralReq: "国债",
  },
  {
    account: "泰康安益纯债",
    breakEvenRate: "1.48%",
    gap: "-0.6 / 6.0",
    accountReq: "不限",
    collateralReq: "政金债",
  },
  {
    account: "泰康裕泰回报",
    breakEvenRate: "1.52%",
    gap: "-4.1 / 20.0",
    accountReq: "利率债质押",
    collateralReq: "国债/地方债",
  },
  {
    account: "泰康策略配置7号",
    breakEvenRate: "1.35%",
    gap: "-1.5 / 10.0",
    accountReq: "利率债质押",
    collateralReq: "国债/政金债",
  },
  {
    account: "泰康宏观回报",
    breakEvenRate: "1.62%",
    gap: "-5.3 / 25.0",
    accountReq: "不限",
    collateralReq: "利率债优先",
  },
  {
    account: "泰康鑫选利90天",
    breakEvenRate: "1.45%",
    gap: "-0.8 / 4.0",
    accountReq: "信用债可用",
    collateralReq: "AA+以上",
  },
  {
    account: "泰康添润6个月",
    breakEvenRate: "1.58%",
    gap: "-2.0 / 9.5",
    accountReq: "利率债质押",
    collateralReq: "政金债",
  },
  {
    account: "泰康恒泰回报",
    breakEvenRate: "1.40%",
    gap: "0.0 / 3.0",
    accountReq: "不限",
    collateralReq: "国债",
  },
  {
    account: "泰康均衡优选",
    breakEvenRate: "1.50%",
    gap: "-1.2 / 7.0",
    accountReq: "利率债质押",
    collateralReq: "国债/地方债",
  },
  {
    account: "泰康瑞坤纯债",
    breakEvenRate: "1.43%",
    gap: "-3.8 / 18.0",
    accountReq: "不限",
    collateralReq: "政金债",
  },
  {
    account: "泰康稳固收益A",
    breakEvenRate: "1.56%",
    gap: "-0.4 / 2.5",
    accountReq: "信用债可用",
    collateralReq: "AA+以上",
  },
  {
    account: "泰康新机遇",
    breakEvenRate: "1.65%",
    gap: "-6.0 / 30.0",
    accountReq: "利率债质押",
    collateralReq: "国债/政金债",
  },
  {
    account: "泰康长江经济带",
    breakEvenRate: "1.47%",
    gap: "-1.0 / 5.5",
    accountReq: "不限",
    collateralReq: "利率债优先",
  },
] as const satisfies readonly FundGapRow[];

export const inflightRows = [
  {
    account: "泰康稳健增利A",
    gap: "-3.2 / 15.0",
    progress: 78,
    accountReq: "利率债质押",
    collateralReq: "国债/政金债",
    issuedAt: "09:32",
  },
  {
    account: "泰康丰盈债券",
    gap: "-1.8 / 8.5",
    progress: 45,
    accountReq: "不限",
    collateralReq: "利率债优先",
    issuedAt: "09:45",
  },
  {
    account: "泰康颐年混合",
    gap: "-2.5 / 12.0",
    progress: 12,
    accountReq: "利率债质押",
    collateralReq: "国债",
    issuedAt: "10:05",
  },
  {
    account: "泰康裕泰回报",
    gap: "-4.1 / 20.0",
    progress: 60,
    accountReq: "利率债质押",
    collateralReq: "国债/地方债",
    issuedAt: "10:18",
  },
  {
    account: "泰康安益纯债",
    gap: "-0.6 / 6.0",
    progress: 100,
    accountReq: "不限",
    collateralReq: "政金债",
    issuedAt: "10:22",
  },
  {
    account: "泰康宏观回报",
    gap: "-5.3 / 25.0",
    progress: 32,
    accountReq: "不限",
    collateralReq: "利率债优先",
    issuedAt: "09:28",
  },
  {
    account: "泰康策略配置7号",
    gap: "-1.5 / 10.0",
    progress: 90,
    accountReq: "利率债质押",
    collateralReq: "国债/政金债",
    issuedAt: "09:35",
  },
  {
    account: "泰康新机遇",
    gap: "-6.0 / 30.0",
    progress: 8,
    accountReq: "利率债质押",
    collateralReq: "国债/政金债",
    issuedAt: "10:30",
  },
  {
    account: "泰康瑞坤纯债",
    gap: "-3.8 / 18.0",
    progress: 55,
    accountReq: "不限",
    collateralReq: "政金债",
    issuedAt: "09:50",
  },
  {
    account: "泰康添润6个月",
    gap: "-2.0 / 9.5",
    progress: 100,
    accountReq: "利率债质押",
    collateralReq: "政金债",
    issuedAt: "09:40",
  },
  {
    account: "泰康均衡优选",
    gap: "-1.2 / 7.0",
    progress: 68,
    accountReq: "利率债质押",
    collateralReq: "国债/地方债",
    issuedAt: "10:12",
  },
  {
    account: "泰康鑫选利90天",
    gap: "-0.8 / 4.0",
    progress: 100,
    accountReq: "信用债可用",
    collateralReq: "AA+以上",
    issuedAt: "10:08",
  },
  {
    account: "泰康长江经济带",
    gap: "-1.0 / 5.5",
    progress: 20,
    accountReq: "不限",
    collateralReq: "利率债优先",
    issuedAt: "10:35",
  },
] as const satisfies readonly InflightRow[];

const fundGapRowsByAccount = new Map(fundGapRows.map((row) => [row.account, row]));
const inflightRowsByAccount = new Map(inflightRows.map((row) => [row.account, row]));

export const executionRows: ExecutionRow[] = [
  ...fundGapRows.map((row) => {
    const inflightRow = inflightRowsByAccount.get(row.account);
    return {
      account: row.account,
      breakEvenRate: row.breakEvenRate,
      gap: row.gap,
      accountReq: row.accountReq,
      collateralReq: row.collateralReq,
      progress: inflightRow?.progress ?? null,
      issuedAt: inflightRow?.issuedAt ?? null,
    };
  }),
  ...inflightRows
    .filter((row) => !fundGapRowsByAccount.has(row.account))
    .map((row) => ({
      account: row.account,
      breakEvenRate: "--",
      gap: row.gap,
      accountReq: row.accountReq,
      collateralReq: row.collateralReq,
      progress: row.progress,
      issuedAt: row.issuedAt,
    })),
];
