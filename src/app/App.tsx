import { Fragment, useEffect, useRef, useState } from "react";

type TrendMode = "intraday" | "history" | "comparison";
type SentimentTab = "realtime" | "trend";
type OverlayProduct = "none" | "dr007" | "gc007" | "r007";
type RightLowerTab = "matrix" | "inst" | "bond";
type HistoryRange = "5d" | "1m" | "6m";
type SpreadProduct = "dr001" | "dr007" | "gc007" | "r007";
type CompareProduct = "none" | SpreadProduct;
type CfetsMetricKey =
  | "buyRate"
  | "sellRate"
  | "buyAmt"
  | "sellAmt"
  | "netInflow";
type CfetsTrendBlock = { dates: string[]; series: number[][] };

type BankRateRow = {
  institution: string;
  nonBankRate: string;
  refNonBankRate: string;
  deltaNonBankBp: string;
  bankRate: string;
  refBankRate: string;
  deltaBp: string;
  updatedAt: string;
};
type QuoteRank = "最优" | "次优" | "报价";
type QuoteDetailRow = {
  id: string;
  institution: string;
  tenor: string;
  amount: string;
  rate: string;
  collateral: string;
  rank: QuoteRank;
  reason: string;
  accountType: string;
  minimum: string;
  updatedAt: string;
};
type QuoteGroup = {
  id: string;
  name: string;
  tenorSummary: string;
  totalAmount: string;
  averageRate: string;
  collateral: string;
  badges: readonly string[];
  rows: readonly QuoteDetailRow[];
};
type RepoQuoteSection = {
  id: "reverse" | "forward";
  title: string;
  groups: readonly QuoteGroup[];
};

type SummaryTableSection = {
  layout: "table";
  title: string;
  columns: readonly string[];
  rows: readonly (readonly string[])[];
  greenColumns?: readonly number[];
  redColumns?: readonly number[];
  deltaColumns?: readonly number[];
  emphasisColumns?: readonly number[];
  buttonColumn?: number;
  fitToWidth?: boolean;
  columnWidths?: readonly string[];
  scrollable: boolean;
};

type ExchangeMarketSplitSection = {
  layout: "exchange-split";
  title: string;
  scrollable: boolean;
  markets: readonly {
    id: "sse" | "szse";
    title: string;
    columns: readonly string[];
    rows: readonly (readonly string[])[];
    greenColumns?: readonly number[];
    deltaColumns?: readonly number[];
  }[];
};

const chartPalette = {
  emerald: "#34d399",
  blue: "#60a5fa",
  violet: "#a78bfa",
  amber: "#fbbf24",
  pink: "#f472b6",
  red: "#f87171",
} as const;

const initialBankRateRows: readonly BankRateRow[] = [
  {
    institution: "工商银行",
    nonBankRate: "1.95%",
    refNonBankRate: "1.96%",
    deltaNonBankBp: "-1",
    bankRate: "2.00%",
    refBankRate: "2.02%",
    deltaBp: "-2",
    updatedAt: "10:53:27",
  },
  {
    institution: "建设银行",
    nonBankRate: "1.94%",
    refNonBankRate: "1.95%",
    deltaNonBankBp: "-1",
    bankRate: "1.99%",
    refBankRate: "2.00%",
    deltaBp: "-1",
    updatedAt: "10:53:27",
  },
  {
    institution: "农业银行",
    nonBankRate: "1.96%",
    refNonBankRate: "1.96%",
    deltaNonBankBp: "0",
    bankRate: "2.01%",
    refBankRate: "2.00%",
    deltaBp: "+1",
    updatedAt: "10:53:27",
  },
  {
    institution: "中国银行",
    nonBankRate: "1.95%",
    refNonBankRate: "1.94%",
    deltaNonBankBp: "+1",
    bankRate: "2.00%",
    refBankRate: "2.00%",
    deltaBp: "0",
    updatedAt: "10:53:27",
  },
] as const;

const leftSections: readonly (
  | SummaryTableSection
  | ExchangeMarketSplitSection
)[] = [
  {
    layout: "table",
    title: "当日大行价格",
    columns: ["机构", "非银利率", "涨跌", "银行利率", "涨跌", "更新时间"],
    rows: [],
    greenColumns: [1],
    redColumns: [3],
    deltaColumns: [2, 4],
    scrollable: false,
  },
  {
    layout: "table",
    title: "XREPO",
    columns: [
      "期限",
      "可点击量",
      "正回购金额",
      "正回购利率",
      "逆回购利率",
      "逆回购金额",
      "可点击量",
      "操作",
    ],
    rows: [
      ["R001", "(4)", "442亿", "2.00%", "1.95%", "442亿", "(12)", "发送"],
      ["R007", "(4)", "28亿", "2.00%", "1.25%", "442亿", "(12)", "发送"],
      ["R014", "(4)", "442亿", "2.00%", "1.95%", "442亿", "(12)", "发送"],
      ["R021", "(4)", "442亿", "2.00%", "1.95%", "442亿", "(12)", "发送"],
      ["R028", "(4)", "442亿", "2.00%", "1.95%", "442亿", "(12)", "发送"],
    ],
    greenColumns: [4],
    redColumns: [3],
    emphasisColumns: [1, 6],
    buttonColumn: 7,
    fitToWidth: true,
    columnWidths: ["8%", "10%", "14%", "12%", "12%", "14%", "10%", "20%"],
    scrollable: false,
  },
  {
    layout: "exchange-split",
    title: "交易所回购",
    markets: [
      {
        id: "sse",
        title: "上交所",
        columns: ["期限", "品种", "最新", "涨跌bp"],
        rows: [
          ["1天", "GC001", "1.3700", "-1.00"],
          ["7天", "GC007", "1.3750", "-1.00"],
          ["14天", "GC014", "1.3820", "-0.80"],
          ["21天", "GC021", "1.3890", "-0.70"],
          ["28天", "GC028", "1.3960", "-0.70"],
        ],
        greenColumns: [2],
        deltaColumns: [3],
      },
      {
        id: "szse",
        title: "深交所",
        columns: ["期限", "品种", "最新", "涨跌bp"],
        rows: [
          ["1天", "R-001", "1.3900", "-1.50"],
          ["7天", "R-007", "1.4000", "-0.50"],
          ["14天", "R-014", "1.4050", "-0.50"],
          ["21天", "R-021", "1.4030", "-0.60"],
          ["28天", "R-028", "1.4000", "-1.00"],
        ],
        greenColumns: [2],
        deltaColumns: [3],
      },
    ],
    scrollable: false,
  },
] as const;

const repoQuoteSections: readonly RepoQuoteSection[] = [
  {
    id: "reverse",
    title: "逆回购报价",
    groups: [
      {
        id: "reverse-rate-local",
        name: "利率地方",
        tenorSummary: "R001 / R007 / R014",
        totalAmount: "25亿",
        averageRate: "1.40%",
        collateral: "利率债 / 地方债",
        badges: ["R001 最优", "R007 次优", "R014 最优"],
        rows: [
          {
            id: "reverse-rate-local-citic",
            institution: "中信银行",
            tenor: "R001",
            amount: "10亿",
            rate: "1.35%",
            collateral: "利率",
            rank: "最优",
            reason: "这是 R001 最优",
            accountType: "自营户",
            minimum: "5亿起",
            updatedAt: "10:53:27",
          },
          {
            id: "reverse-rate-local-bj",
            institution: "北京银行",
            tenor: "R007",
            amount: "5亿",
            rate: "1.40%",
            collateral: "利率地方存单商金",
            rank: "最优",
            reason: "这是 R007 最优",
            accountType: "商金户",
            minimum: "2亿起",
            updatedAt: "10:53:27",
          },
          {
            id: "reverse-rate-local-shrcb",
            institution: "上海农商行",
            tenor: "R001",
            amount: "10亿",
            rate: "1.41%",
            collateral: "利率",
            rank: "次优",
            reason: "R001 次优",
            accountType: "商金户",
            minimum: "5亿起",
            updatedAt: "10:53:27",
          },
          {
            id: "reverse-rate-local-gz",
            institution: "广州银行",
            tenor: "R014",
            amount: "6亿",
            rate: "1.43%",
            collateral: "利率地方存单商金",
            rank: "最优",
            reason: "这是 R014 最优",
            accountType: "自营户",
            minimum: "3亿起",
            updatedAt: "10:53:27",
          },
          {
            id: "reverse-rate-local-cmb",
            institution: "招商银行",
            tenor: "R001",
            amount: "8亿",
            rate: "1.42%",
            collateral: "利率",
            rank: "报价",
            reason: "R001 一般报价",
            accountType: "股份行自营",
            minimum: "3亿起",
            updatedAt: "10:53:18",
          },
          {
            id: "reverse-rate-local-spdb",
            institution: "浦发银行",
            tenor: "R007",
            amount: "4亿",
            rate: "1.43%",
            collateral: "地方债",
            rank: "次优",
            reason: "R007 次优",
            accountType: "股份行自营",
            minimum: "2亿起",
            updatedAt: "10:53:14",
          },
          {
            id: "reverse-rate-local-cmbc",
            institution: "民生银行",
            tenor: "R001",
            amount: "3亿",
            rate: "1.44%",
            collateral: "利率",
            rank: "报价",
            reason: "R001 一般报价",
            accountType: "股份行自营",
            minimum: "1亿起",
            updatedAt: "10:53:08",
          },
          {
            id: "reverse-rate-local-zhrcb",
            institution: "珠海农商行",
            tenor: "R007",
            amount: "2亿",
            rate: "1.45%",
            collateral: "利率地方",
            rank: "报价",
            reason: "R007 一般报价",
            accountType: "商金户",
            minimum: "1亿起",
            updatedAt: "10:52:55",
          },
          {
            id: "reverse-rate-local-cqrcb",
            institution: "重庆农商行",
            tenor: "R014",
            amount: "3亿",
            rate: "1.46%",
            collateral: "地方债",
            rank: "报价",
            reason: "R014 一般报价",
            accountType: "商金户",
            minimum: "1亿起",
            updatedAt: "10:52:42",
          },
        ],
      },
      {
        id: "reverse-cd-sj",
        name: "存单商金",
        tenorSummary: "R001 / R007",
        totalAmount: "7亿",
        averageRate: "1.41%",
        collateral: "大行存单 / 商金",
        badges: ["R001 最优", "R007 次优"],
        rows: [
          {
            id: "reverse-cd-sj-bj",
            institution: "北京银行",
            tenor: "R001",
            amount: "5亿",
            rate: "1.40%",
            collateral: "利率地方存单商金",
            rank: "最优",
            reason: "这是 R001 最优",
            accountType: "商金户",
            minimum: "5亿起",
            updatedAt: "10:53:27",
          },
          {
            id: "reverse-cd-sj-nongyin",
            institution: "农银理财",
            tenor: "R007",
            amount: "2亿",
            rate: "1.42%",
            collateral: "大行存单",
            rank: "最优",
            reason: "这是 R007 最优",
            accountType: "理财子",
            minimum: "2亿起",
            updatedAt: "10:53:27",
          },
          {
            id: "reverse-cd-sj-yangguang",
            institution: "阳光资产",
            tenor: "R007",
            amount: "5亿",
            rate: "1.40%",
            collateral: "利率地方存单商金",
            rank: "次优",
            reason: "R007 次优",
            accountType: "保险资管",
            minimum: "3亿起",
            updatedAt: "10:53:27",
          },
          {
            id: "reverse-cd-sj-cmbwm",
            institution: "招银理财",
            tenor: "R001",
            amount: "3亿",
            rate: "1.41%",
            collateral: "大行存单",
            rank: "报价",
            reason: "R001 一般报价",
            accountType: "理财子",
            minimum: "1亿起",
            updatedAt: "10:53:21",
          },
          {
            id: "reverse-cd-sj-icbcwm",
            institution: "工银理财",
            tenor: "R007",
            amount: "4亿",
            rate: "1.43%",
            collateral: "商金存单",
            rank: "报价",
            reason: "R007 一般报价",
            accountType: "理财子",
            minimum: "2亿起",
            updatedAt: "10:53:11",
          },
          {
            id: "reverse-cd-sj-taikang",
            institution: "泰康资产",
            tenor: "R001",
            amount: "5亿",
            rate: "1.42%",
            collateral: "国股存单",
            rank: "次优",
            reason: "R001 次优",
            accountType: "保险资管",
            minimum: "3亿起",
            updatedAt: "10:53:04",
          },
          {
            id: "reverse-cd-sj-bocomwm",
            institution: "交银理财",
            tenor: "R007",
            amount: "2亿",
            rate: "1.44%",
            collateral: "商金存单",
            rank: "报价",
            reason: "R007 一般报价",
            accountType: "理财子",
            minimum: "1亿起",
            updatedAt: "10:52:48",
          },
        ],
      },
      {
        id: "reverse-credit",
        name: "信用",
        tenorSummary: "R001 / R007 / R014",
        totalAmount: "12.45亿",
        averageRate: "1.44%",
        collateral: "信用债 / 年金户",
        badges: ["R001 最优", "R007 最优", "R014 最优"],
        rows: [
          {
            id: "reverse-credit-penghua",
            institution: "鹏华基金",
            tenor: "R007",
            amount: "4亿",
            rate: "1.45%",
            collateral: "信用",
            rank: "最优",
            reason: "这是 R007 最优",
            accountType: "公募基金",
            minimum: "1亿起",
            updatedAt: "10:53:27",
          },
          {
            id: "reverse-credit-pingan",
            institution: "平安资产",
            tenor: "R001",
            amount: "10亿",
            rate: "1.43%",
            collateral: "单笔 1e 起",
            rank: "次优",
            reason: "R001 次优",
            accountType: "保险资管",
            minimum: "单笔 1e 起",
            updatedAt: "10:53:27",
          },
          {
            id: "reverse-credit-cncbsec",
            institution: "中信建投证券",
            tenor: "R001",
            amount: "2.45亿",
            rate: "1.43%",
            collateral: "年金户",
            rank: "最优",
            reason: "这是 R001 最优",
            accountType: "券商自营",
            minimum: "2亿起",
            updatedAt: "10:53:27",
          },
          {
            id: "reverse-credit-huaan",
            institution: "华安基金",
            tenor: "R014",
            amount: "3亿",
            rate: "1.45%",
            collateral: "信用",
            rank: "最优",
            reason: "这是 R014 最优",
            accountType: "公募基金",
            minimum: "1亿起",
            updatedAt: "10:53:27",
          },
          {
            id: "reverse-credit-citicsec",
            institution: "中信证券",
            tenor: "R007",
            amount: "5亿",
            rate: "1.46%",
            collateral: "信用",
            rank: "次优",
            reason: "R007 次优",
            accountType: "券商自营",
            minimum: "2亿起",
            updatedAt: "10:53:19",
          },
          {
            id: "reverse-credit-eastspring",
            institution: "东方红资产",
            tenor: "R014",
            amount: "2亿",
            rate: "1.47%",
            collateral: "年金户",
            rank: "次优",
            reason: "R014 次优",
            accountType: "券商资管",
            minimum: "1亿起",
            updatedAt: "10:53:09",
          },
          {
            id: "reverse-credit-bosc",
            institution: "上海银行",
            tenor: "R001",
            amount: "4亿",
            rate: "1.46%",
            collateral: "信用",
            rank: "报价",
            reason: "R001 一般报价",
            accountType: "城商行自营",
            minimum: "2亿起",
            updatedAt: "10:52:58",
          },
          {
            id: "reverse-credit-gtja",
            institution: "国泰君安",
            tenor: "R007",
            amount: "3亿",
            rate: "1.48%",
            collateral: "信用",
            rank: "报价",
            reason: "R007 一般报价",
            accountType: "券商自营",
            minimum: "1亿起",
            updatedAt: "10:52:46",
          },
          {
            id: "reverse-credit-hsfund",
            institution: "华夏基金",
            tenor: "R014",
            amount: "2亿",
            rate: "1.49%",
            collateral: "信用",
            rank: "报价",
            reason: "R014 一般报价",
            accountType: "公募基金",
            minimum: "1亿起",
            updatedAt: "10:52:31",
          },
        ],
      },
    ],
  },
  {
    id: "forward",
    title: "正回购报价",
    groups: [
      {
        id: "forward-rate-local",
        name: "利率地方",
        tenorSummary: "R001 / R007 / R014",
        totalAmount: "18亿",
        averageRate: "1.52%",
        collateral: "利率债 / 地方债",
        badges: ["R001 最优", "R007 最优", "R014 次优"],
        rows: [
          {
            id: "forward-rate-local-boc",
            institution: "中国银行",
            tenor: "R001",
            amount: "8亿",
            rate: "1.51%",
            collateral: "利率",
            rank: "最优",
            reason: "这是 R001 最优",
            accountType: "大行自营",
            minimum: "5亿起",
            updatedAt: "10:53:27",
          },
          {
            id: "forward-rate-local-ccb",
            institution: "建设银行",
            tenor: "R007",
            amount: "6亿",
            rate: "1.53%",
            collateral: "利率地方",
            rank: "最优",
            reason: "这是 R007 最优",
            accountType: "大行自营",
            minimum: "3亿起",
            updatedAt: "10:53:27",
          },
          {
            id: "forward-rate-local-jt",
            institution: "交通银行",
            tenor: "R014",
            amount: "4亿",
            rate: "1.54%",
            collateral: "利率地方",
            rank: "次优",
            reason: "R014 次优",
            accountType: "股份行",
            minimum: "2亿起",
            updatedAt: "10:53:27",
          },
          {
            id: "forward-rate-local-abc",
            institution: "农业银行",
            tenor: "R001",
            amount: "6亿",
            rate: "1.52%",
            collateral: "利率",
            rank: "次优",
            reason: "R001 次优",
            accountType: "大行自营",
            minimum: "3亿起",
            updatedAt: "10:53:18",
          },
          {
            id: "forward-rate-local-icbc",
            institution: "工商银行",
            tenor: "R007",
            amount: "5亿",
            rate: "1.54%",
            collateral: "利率",
            rank: "次优",
            reason: "R007 次优",
            accountType: "大行自营",
            minimum: "3亿起",
            updatedAt: "10:53:09",
          },
          {
            id: "forward-rate-local-cmbc",
            institution: "民生银行",
            tenor: "R001",
            amount: "3亿",
            rate: "1.53%",
            collateral: "利率地方",
            rank: "报价",
            reason: "R001 一般报价",
            accountType: "股份行",
            minimum: "2亿起",
            updatedAt: "10:52:58",
          },
          {
            id: "forward-rate-local-cib",
            institution: "兴业银行",
            tenor: "R014",
            amount: "2亿",
            rate: "1.55%",
            collateral: "地方债",
            rank: "报价",
            reason: "R014 一般报价",
            accountType: "股份行",
            minimum: "1亿起",
            updatedAt: "10:52:43",
          },
        ],
      },
      {
        id: "forward-cd-sj",
        name: "存单商金",
        tenorSummary: "R001 / R007",
        totalAmount: "9亿",
        averageRate: "1.57%",
        collateral: "国股存单 / 商金",
        badges: ["R001 次优", "R007 最优"],
        rows: [
          {
            id: "forward-cd-sj-cmbwm",
            institution: "招银理财",
            tenor: "R007",
            amount: "4亿",
            rate: "1.58%",
            collateral: "国股存单",
            rank: "最优",
            reason: "这是 R007 最优",
            accountType: "理财子",
            minimum: "2亿起",
            updatedAt: "10:53:27",
          },
          {
            id: "forward-cd-sj-icbcwm",
            institution: "工银理财",
            tenor: "R001",
            amount: "3亿",
            rate: "1.56%",
            collateral: "商金存单",
            rank: "次优",
            reason: "R001 次优",
            accountType: "理财子",
            minimum: "2亿起",
            updatedAt: "10:53:27",
          },
          {
            id: "forward-cd-sj-bjrcb",
            institution: "北京农商行",
            tenor: "R007",
            amount: "2亿",
            rate: "1.59%",
            collateral: "商金存单",
            rank: "次优",
            reason: "R007 次优",
            accountType: "商金户",
            minimum: "1亿起",
            updatedAt: "10:53:27",
          },
          {
            id: "forward-cd-sj-ccbwm",
            institution: "建信理财",
            tenor: "R001",
            amount: "4亿",
            rate: "1.57%",
            collateral: "国股存单",
            rank: "最优",
            reason: "这是 R001 最优",
            accountType: "理财子",
            minimum: "2亿起",
            updatedAt: "10:53:14",
          },
          {
            id: "forward-cd-sj-bocwm",
            institution: "中银理财",
            tenor: "R007",
            amount: "3亿",
            rate: "1.60%",
            collateral: "商金存单",
            rank: "报价",
            reason: "R007 一般报价",
            accountType: "理财子",
            minimum: "2亿起",
            updatedAt: "10:53:01",
          },
          {
            id: "forward-cd-sj-shrcb",
            institution: "上海农商行",
            tenor: "R001",
            amount: "2亿",
            rate: "1.58%",
            collateral: "国股存单",
            rank: "报价",
            reason: "R001 一般报价",
            accountType: "商金户",
            minimum: "1亿起",
            updatedAt: "10:52:46",
          },
        ],
      },
      {
        id: "forward-credit",
        name: "信用",
        tenorSummary: "R001 / R007 / R021",
        totalAmount: "13.2亿",
        averageRate: "1.61%",
        collateral: "信用债 / 专户 / 年金",
        badges: ["R001 最优", "R007 次优", "R021 最优"],
        rows: [
          {
            id: "forward-credit-citicsec",
            institution: "中信证券",
            tenor: "R001",
            amount: "5亿",
            rate: "1.60%",
            collateral: "信用",
            rank: "最优",
            reason: "这是 R001 最优",
            accountType: "券商自营",
            minimum: "1亿起",
            updatedAt: "10:53:27",
          },
          {
            id: "forward-credit-pinganam",
            institution: "平安资管",
            tenor: "R007",
            amount: "3.2亿",
            rate: "1.62%",
            collateral: "信用债专户",
            rank: "次优",
            reason: "R007 次优",
            accountType: "保险资管",
            minimum: "2亿起",
            updatedAt: "10:53:27",
          },
          {
            id: "forward-credit-eastspring",
            institution: "东方红资产",
            tenor: "R021",
            amount: "5亿",
            rate: "1.63%",
            collateral: "年金户",
            rank: "最优",
            reason: "这是 R021 最优",
            accountType: "券商资管",
            minimum: "2亿起",
            updatedAt: "10:53:27",
          },
          {
            id: "forward-credit-bofcom",
            institution: "交银施罗德",
            tenor: "R001",
            amount: "3亿",
            rate: "1.61%",
            collateral: "信用",
            rank: "次优",
            reason: "R001 次优",
            accountType: "公募基金",
            minimum: "1亿起",
            updatedAt: "10:53:13",
          },
          {
            id: "forward-credit-cmbsec",
            institution: "招商证券",
            tenor: "R007",
            amount: "4亿",
            rate: "1.63%",
            collateral: "信用债",
            rank: "报价",
            reason: "R007 一般报价",
            accountType: "券商自营",
            minimum: "2亿起",
            updatedAt: "10:53:02",
          },
          {
            id: "forward-credit-pinganfund",
            institution: "平安基金",
            tenor: "R021",
            amount: "2亿",
            rate: "1.64%",
            collateral: "年金户",
            rank: "次优",
            reason: "R021 次优",
            accountType: "公募基金",
            minimum: "1亿起",
            updatedAt: "10:52:51",
          },
          {
            id: "forward-credit-cinda",
            institution: "信达证券",
            tenor: "R001",
            amount: "2亿",
            rate: "1.62%",
            collateral: "信用",
            rank: "报价",
            reason: "R001 一般报价",
            accountType: "券商自营",
            minimum: "1亿起",
            updatedAt: "10:52:38",
          },
          {
            id: "forward-credit-htsec",
            institution: "海通证券",
            tenor: "R007",
            amount: "3亿",
            rate: "1.65%",
            collateral: "信用",
            rank: "报价",
            reason: "R007 一般报价",
            accountType: "券商自营",
            minimum: "2亿起",
            updatedAt: "10:52:24",
          },
        ],
      },
    ],
  },
] as const;

const topBoardFilters = {
  periods: ["全部", "1", "7", "14", "21", "28+"],
  amountMin: "0",
  amountMax: "不限",
  rateMin: "0.00",
  rateMax: "不限",
} as const;

const overlayProductOptions: Array<{ id: OverlayProduct; label: string }> = [
  { id: "none", label: "不叠加" },
  { id: "dr007", label: "DR007" },
  { id: "gc007", label: "GC007" },
  { id: "r007", label: "R007" },
];

const compareProductOptions: Array<{ id: CompareProduct; label: string }> = [
  { id: "none", label: "不对比" },
  { id: "dr001", label: "DR001" },
  { id: "dr007", label: "DR007" },
  { id: "gc007", label: "GC007" },
  { id: "r007", label: "R007" },
];

const rightLowerTabs: Array<{ id: RightLowerTab; label: string }> = [
  { id: "matrix", label: "市场公开信息" },
  { id: "inst", label: "机构分期限统计" },
  { id: "bond", label: "机构分债券统计" },
];

const trendModeTabs: Array<{ id: TrendMode; label: string }> = [
  { id: "intraday", label: "分时" },
  { id: "history", label: "历史" },
  { id: "comparison", label: "对比" },
];

const trendRateSeries = randomWalk(2.017, 60, 0.02, 11);
const trendVolumeSeries = randomWalk(1040, 60, 220, 12).map((v) =>
  Math.round(v),
);

const trendVolumeColors = trendVolumeSeries.map((_, index) =>
  index % 3 === 0 || index % 5 === 0 ? "#ff8a26" : "#22c1dc",
);

const trendAxisLabels = [
  "2/22",
  "3/1",
  "3/7",
  "3/13",
  "3/20",
  "3/27",
  "4/2",
  "4/8",
  "4/14",
  "4/22",
] as const;
const trendPriceTicks = [2.107, 2.028, 1.948, 1.868] as const;
const trendVolumeTicks = ["2k", "1k", "900", "450", "0"] as const;

const intradaySeries = randomWalk(1.979, 40, 0.055, 13);
const intradayVolumeSeries = randomWalk(200, 40, 90, 14).map((v) =>
  Math.round(v),
);

const intradayTimeLabels = [
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
] as const;

const historyRangeTabs: Array<{ id: HistoryRange; label: string }> = [
  { id: "5d", label: "近5日" },
  { id: "1m", label: "近1M" },
  { id: "6m", label: "近半年" },
];

const historicalCloseDatasets: Record<
  HistoryRange,
  {
    labels: readonly string[];
    close: readonly number[];
    volume: readonly number[];
  }
> = {
  "5d": (() => {
    const labels = ["4/22", "4/23", "4/24", "4/25", "4/28"];
    const close = randomWalk(1.28, 5, 0.18, 1);
    const volume = randomWalk(1620, 5, 180, 2).map((v) => Math.round(v));
    return { labels, close, volume };
  })(),
  "1m": (() => {
    const labels = [
      "3/28",
      "3/29",
      "3/30",
      "3/31",
      "4/1",
      "4/2",
      "4/3",
      "4/4",
      "4/5",
      "4/8",
      "4/9",
      "4/10",
      "4/11",
      "4/12",
      "4/13",
      "4/14",
      "4/15",
      "4/16",
      "4/17",
      "4/18",
      "4/19",
      "4/20",
      "4/21",
      "4/22",
      "4/23",
      "4/24",
      "4/25",
      "4/28",
    ];
    const close = randomWalk(1.236, 28, 0.025, 3);
    const volume = randomWalk(1710, 28, 140, 4).map((v) => Math.round(v));
    return { labels, close, volume };
  })(),
  "6m": buildSixMonthDailyDataset(),
};

const cfetsSummaryCards = [
  { label: "净融出", value: "+428亿", tone: "good" },
  { label: "DR007", value: "2.15%", tone: "alert" },
  { label: "非银占比", value: "49.8%", tone: "neutral" },
  { label: "成交总额", value: "5,824亿", tone: "neutral" },
] as const;

const cfetsDetailRows = [
  ["回购成交", "4,631亿", "较昨 +6.2%"],
  ["XREPO成交", "782亿", "较昨 -1.5%"],
  ["大行净融出", "+215亿", "边际走松"],
  ["非银需求", "偏强", "隔夜至 14D 活跃"],
] as const;

const ncdTrendSeries = randomWalk(2.03, 14, 0.015, 15);
const ncdThreeMonthSeries = randomWalk(2.07, 14, 0.015, 16);
const ncdOneYearSeries = randomWalk(2.13, 14, 0.015, 17);
const ncdSecondaryGov6m = randomWalk(1.98, 130, 0.006, 40);
const ncdSecondaryAAA6m = randomWalk(2.03, 130, 0.006, 41);
const ncdSecondaryAAPlus6m = randomWalk(2.08, 130, 0.007, 42);
const ncdSecondaryAA6m = randomWalk(2.13, 130, 0.007, 43);
const auxChartLabels = [
  "4/9",
  "4/10",
  "4/11",
  "4/12",
  "4/13",
  "4/14",
  "4/15",
  "4/16",
  "4/17",
  "4/18",
  "4/19",
  "4/20",
  "4/21",
  "4/22",
] as const;
const compactAuxChartLabels = [
  "4/9",
  "4/11",
  "4/13",
  "4/15",
  "4/17",
  "4/19",
  "4/22",
] as const;
const ncdTableRows = [
  ["1M", "2.03%", "+2", "2.01%", "10:53:27"],
  ["3M", "2.07%", "+1", "2.05%", "10:53:27"],
  ["6M", "2.11%", "+1", "2.08%", "10:53:27"],
  ["9M", "2.14%", "0", "2.11%", "10:53:27"],
  ["1Y", "2.13%", "-1", "2.10%", "10:53:27"],
] as const;

type NcdPeriod = "1M" | "3M" | "6M" | "9M" | "1Y";
const ncdPrimaryPeriods: NcdPeriod[] = ["1M", "3M", "6M", "9M", "1Y"];
const NCD_PERIOD_OFFSET: Record<NcdPeriod, number> = {
  "1M": 0,
  "3M": 0.1,
  "6M": 0.2,
  "9M": 0.25,
  "1Y": 0.28,
};

const ncdPrimaryGovBase = [
  1.96, 1.95, 1.96, 1.97, 1.96, 1.97, 1.97, 1.98, 1.97, 1.98, 1.99, 1.98, 1.99,
  2.0,
];
const ncdPrimaryAAABase = [
  2.0, 2.0, 2.01, 2.02, 2.01, 2.02, 2.02, 2.03, 2.03, 2.04, 2.04, 2.03, 2.05,
  2.05,
];
const ncdPrimaryAAPlsBase = [
  2.05, 2.04, 2.06, 2.06, 2.06, 2.07, 2.07, 2.08, 2.08, 2.09, 2.09, 2.09, 2.1,
  2.1,
];
const ncdPrimaryAABase = [
  2.1, 2.1, 2.11, 2.12, 2.11, 2.12, 2.12, 2.13, 2.13, 2.14, 2.14, 2.14, 2.15,
  2.15,
];

type NcdTrendRange = "14d" | "1m" | "3m" | "6m";
const NCD_TREND_COUNTS: Record<NcdTrendRange, number> = {
  "14d": 14,
  "1m": 22,
  "3m": 65,
  "6m": 130,
};
const ncdTrendRangeTabs: Array<{ id: NcdTrendRange; label: string }> = [
  { id: "14d", label: "14D" },
  { id: "1m", label: "1M" },
  { id: "3m", label: "3M" },
  { id: "6m", label: "6M" },
];

// 6M (130 pts) base series — last point anchored to 14d series tail
const ncdPrimaryGovBase6m = randomWalk(2.0, 130, 0.006, 20);
const ncdPrimaryAAABase6m = randomWalk(2.05, 130, 0.006, 21);
const ncdPrimaryAAPlsBase6m = randomWalk(2.1, 130, 0.007, 22);
const ncdPrimaryAABase6m = randomWalk(2.15, 130, 0.007, 23);
const ncdTrendDates6m = generateTradingDates("2026-01-04", 130);

function shiftSeries(base: number[], offset: number): number[] {
  return base.map((v) => parseFloat((v + offset).toFixed(4)));
}

type NcdPrimaryRow = {
  name: string;
  rate: string;
  change?: string;
  marker?: boolean;
};
type NcdPrimaryGroup = { label: string; rows: NcdPrimaryRow[] };

const ncdPrimary1MGroups: NcdPrimaryGroup[] = [
  {
    label: "国有/股份制",
    rows: [
      { name: "浦发银行", rate: "1.320" },
      { name: "渤海银行", rate: "1.330" },
    ],
  },
  {
    label: "AAA",
    rows: [
      { name: "成都银行", rate: "1.300" },
      { name: "哈尔滨银行", rate: "1.300" },
      { name: "宁波银行", rate: "1.315" },
      { name: "桂林银行", rate: "1.320" },
      { name: "渝农商行", rate: "1.325", change: "+2.5" },
    ],
  },
  {
    label: "AA+",
    rows: [
      { name: "南粤银行", rate: "1.310" },
      { name: "江门农商行", rate: "1.330" },
      { name: "富民银行", rate: "1.500", marker: true },
    ],
  },
  {
    label: "AA",
    rows: [
      { name: "威海银行", rate: "1.380", change: "+5.0" },
      { name: "蒙商银行", rate: "1.420" },
    ],
  },
];

type NcdAllPeriodCell = {
  name: string;
  rate: string;
  change?: string;
  limitNonBank?: boolean;
};
type NcdAllPeriodGroup = {
  label: string;
  cells: Record<NcdPeriod, NcdAllPeriodCell[]>;
};

const ncdColHeaders: Record<
  NcdPeriod,
  { dow: string; date: string; count?: string }
> = {
  "1M": { dow: "周一", date: "26-06-08" },
  "3M": { dow: "周六", date: "26-08-08", count: "2/2" },
  "6M": { dow: "周日", date: "26-11-08", count: "1/1" },
  "9M": { dow: "周一", date: "27-02-08", count: "7/4" },
  "1Y": { dow: "周六", date: "27-05-08", count: "2/2" },
};

const ncdAllPeriodsData: NcdAllPeriodGroup[] = [
  {
    label: "国有/股份制",
    cells: {
      "1M": [],
      "3M": [
        { name: "浦发银行", rate: "1.33" },
        { name: "渤海银行", rate: "1.36" },
      ],
      "6M": [{ name: "渤海银行", rate: "1.41" }],
      "9M": [{ name: "渤海银行", rate: "1.41" }],
      "1Y": [{ name: "渤海银行", rate: "1.46" }],
    },
  },
  {
    label: "AAA",
    cells: {
      "1M": [
        { name: "成都银行", rate: "1.300" },
        { name: "哈尔滨银行", rate: "1.300" },
        { name: "宁波银行", rate: "1.315" },
        { name: "桂林银行", rate: "1.320" },
        { name: "渝农商行", rate: "1.325", change: "+2.5" },
      ],
      "3M": [
        { name: "成都银行", rate: "1.350" },
        { name: "桂林银行", rate: "1.360" },
        { name: "唐山银行", rate: "1.360" },
        { name: "日照银行", rate: "1.360" },
        { name: "大连银行", rate: "1.390" },
        { name: "富滇银行", rate: "1.390" },
        { name: "哈尔滨银行", rate: "1.390" },
      ],
      "6M": [
        { name: "南京银行", rate: "1.390" },
        { name: "徽商银行", rate: "1.400" },
        { name: "九江银行", rate: "1.400" },
        { name: "成都银行", rate: "1.400" },
        { name: "广州农商行", rate: "1.410" },
        { name: "宁波银行", rate: "1.420" },
        { name: "富滇银行", rate: "1.420" },
        { name: "桂林银行", rate: "1.420" },
        { name: "唐山银行", rate: "1.420" },
        { name: "哈尔滨银行", rate: "1.430" },
        { name: "大连银行", rate: "1.430" },
      ],
      "9M": [
        { name: "徽商银行", rate: "1.430" },
        { name: "南京银行", rate: "1.430" },
        { name: "广州农商行", rate: "1.430" },
        { name: "成都银行", rate: "1.440" },
        { name: "唐山银行", rate: "1.440" },
        { name: "汉口银行", rate: "1.440" },
        { name: "桂林银行", rate: "1.440" },
        { name: "日照银行", rate: "1.450" },
        { name: "宁波银行", rate: "1.450" },
        { name: "富滇银行", rate: "1.460" },
        { name: "大连银行", rate: "1.460" },
        { name: "哈尔滨银行", rate: "1.460" },
      ],
      "1Y": [
        { name: "广州农商行", rate: "1.450" },
        { name: "南京银行", rate: "1.450" },
        { name: "徽商银行", rate: "1.450" },
        { name: "九江银行", rate: "1.460" },
        { name: "唐山银行", rate: "1.460" },
        { name: "汉口银行", rate: "1.460" },
        { name: "成都银行", rate: "1.460" },
        { name: "桂林银行", rate: "1.460" },
        { name: "宁波银行", rate: "1.460" },
        { name: "东莞银行", rate: "1.465" },
        { name: "杭州银行", rate: "1.470" },
        { name: "日照银行", rate: "1.470" },
        { name: "大连银行", rate: "1.480" },
        { name: "哈尔滨银行", rate: "1.480" },
        { name: "富滇银行", rate: "1.480" },
        { name: "渝农商行", rate: "1.480", limitNonBank: true },
      ],
    },
  },
  {
    label: "AA+",
    cells: {
      "1M": [
        { name: "南粤银行", rate: "1.310" },
        { name: "江门农商行", rate: "1.330" },
        { name: "东营银行", rate: "1.350" },
        { name: "廊坊银行", rate: "1.360" },
        { name: "绍兴银行", rate: "1.370" },
        { name: "台州银行", rate: "1.375" },
        { name: "温州银行", rate: "1.380" },
        { name: "广州银行", rate: "1.385" },
        { name: "贵阳银行", rate: "1.390" },
        { name: "郑州银行", rate: "1.395" },
        { name: "青岛农商行", rate: "1.400" },
        { name: "无锡农商行", rate: "1.410" },
        { name: "苏农银行", rate: "1.420" },
        { name: "江阴银行", rate: "1.430" },
        { name: "张家港行", rate: "1.435" },
        { name: "富民银行", rate: "1.500", limitNonBank: true },
      ],
      "3M": [
        { name: "长沙农商行", rate: "1.380" },
        { name: "江门农商行", rate: "1.410" },
        { name: "秦农农商行", rate: "1.420" },
        { name: "南粤银行", rate: "1.420" },
        { name: "中山农商行", rate: "1.420" },
        { name: "台州银行", rate: "1.425" },
        { name: "广州银行", rate: "1.428" },
        { name: "东营银行", rate: "1.430" },
        { name: "廊坊银行", rate: "1.430" },
        { name: "温州银行", rate: "1.432" },
        { name: "南海农商行", rate: "1.435" },
        { name: "绍兴银行", rate: "1.438" },
        { name: "贵阳银行", rate: "1.438" },
        { name: "张家口银行", rate: "1.440" },
        { name: "顺德农商行", rate: "1.440" },
        { name: "郑州银行", rate: "1.442" },
        { name: "青岛农商行", rate: "1.445" },
        { name: "无锡农商行", rate: "1.448" },
        { name: "苏农银行", rate: "1.450" },
        { name: "江阴银行", rate: "1.452" },
        { name: "张家港行", rate: "1.455" },
      ],
      "6M": [
        { name: "长沙农商行", rate: "1.410" },
        { name: "秦农农商行", rate: "1.430" },
        { name: "中山农商行", rate: "1.430" },
        { name: "台州银行", rate: "1.432" },
        { name: "东营银行", rate: "1.435" },
        { name: "广州银行", rate: "1.438" },
        { name: "江门农商行", rate: "1.440" },
        { name: "南粤银行", rate: "1.440" },
        { name: "廊坊银行", rate: "1.440" },
        { name: "温州银行", rate: "1.442" },
        { name: "南海农商行", rate: "1.445" },
        { name: "贵阳银行", rate: "1.448" },
        { name: "顺德农商行", rate: "1.450" },
        { name: "绍兴银行", rate: "1.450" },
        { name: "张家口银行", rate: "1.450" },
        { name: "郑州银行", rate: "1.452" },
        { name: "青岛农商行", rate: "1.455" },
        { name: "石嘴山银行", rate: "1.460" },
        { name: "无锡农商行", rate: "1.460" },
        { name: "苏农银行", rate: "1.462" },
        { name: "江阴银行", rate: "1.465" },
        { name: "张家港行", rate: "1.468" },
      ],
      "9M": [
        { name: "长沙农商行", rate: "1.440" },
        { name: "秦农农商行", rate: "1.440" },
        { name: "新疆银行", rate: "1.450" },
        { name: "中山农商行", rate: "1.450" },
        { name: "台州银行", rate: "1.450" },
        { name: "东营银行", rate: "1.450" },
        { name: "广州银行", rate: "1.452" },
        { name: "廊坊银行", rate: "1.455" },
        { name: "温州银行", rate: "1.455" },
        { name: "南海农商行", rate: "1.458" },
        { name: "贵阳银行", rate: "1.460" },
        { name: "江门农商行", rate: "1.460" },
        { name: "顺德农商行", rate: "1.460" },
        { name: "绍兴银行", rate: "1.462" },
        { name: "长安银行", rate: "1.460", limitNonBank: true },
        { name: "郑州银行", rate: "1.465" },
        { name: "青岛农商行", rate: "1.468" },
        { name: "石嘴山银行", rate: "1.470" },
        { name: "无锡农商行", rate: "1.470" },
        { name: "苏农银行", rate: "1.472" },
        { name: "江阴银行", rate: "1.475" },
        { name: "张家港行", rate: "1.478" },
      ],
      "1Y": [
        { name: "长沙农商行", rate: "1.450" },
        { name: "秦农农商行", rate: "1.450" },
        { name: "南粤银行", rate: "1.460" },
        { name: "台州银行", rate: "1.462" },
        { name: "东营银行", rate: "1.465" },
        { name: "广州银行", rate: "1.465" },
        { name: "中山农商行", rate: "1.470" },
        { name: "新疆银行", rate: "1.470" },
        { name: "廊坊银行", rate: "1.470" },
        { name: "温州银行", rate: "1.470" },
        { name: "江门农商行", rate: "1.470" },
        { name: "贵阳银行", rate: "1.472" },
        { name: "南海农商行", rate: "1.472" },
        { name: "顺德农商行", rate: "1.475" },
        { name: "绍兴银行", rate: "1.478" },
        { name: "郑州银行", rate: "1.478" },
        { name: "长安银行", rate: "1.480", limitNonBank: true },
        { name: "石嘴山银行", rate: "1.485" },
        { name: "青岛农商行", rate: "1.485" },
        { name: "无锡农商行", rate: "1.488" },
        { name: "苏农银行", rate: "1.490" },
        { name: "江阴银行", rate: "1.492" },
        { name: "张家港行", rate: "1.495" },
      ],
    },
  },
  {
    label: "AA",
    cells: {
      "1M": [
        { name: "威海银行", rate: "1.380", change: "+5.0" },
        { name: "蒙商银行", rate: "1.420" },
        { name: "乌鲁木齐银行", rate: "1.450" },
        { name: "齐商银行", rate: "1.460" },
        { name: "葫芦岛银行", rate: "1.480" },
        { name: "盐城银行", rate: "1.490" },
        { name: "晋商银行", rate: "1.495" },
        { name: "泸州银行", rate: "1.500" },
        { name: "昆仑银行", rate: "1.505" },
        { name: "宁夏银行", rate: "1.510" },
        { name: "吉林银行", rate: "1.515" },
        { name: "贵州银行", rate: "1.520" },
        { name: "九台农商行", rate: "1.525" },
        { name: "大庆银行", rate: "1.530" },
        { name: "湖北银行", rate: "1.535" },
      ],
      "3M": [
        { name: "威海银行", rate: "1.420" },
        { name: "泰安银行", rate: "1.450" },
        { name: "蒙商银行", rate: "1.460" },
        { name: "乌鲁木齐银行", rate: "1.470" },
        { name: "齐商银行", rate: "1.475" },
        { name: "龙江银行", rate: "1.480" },
        { name: "盐城银行", rate: "1.485" },
        { name: "葫芦岛银行", rate: "1.490" },
        { name: "晋商银行", rate: "1.492" },
        { name: "赤峰银行", rate: "1.495" },
        { name: "泸州银行", rate: "1.498" },
        { name: "甘肃银行", rate: "1.500" },
        { name: "昆仑银行", rate: "1.502" },
        { name: "宁夏银行", rate: "1.505" },
        { name: "吉林银行", rate: "1.508" },
        { name: "贵州银行", rate: "1.510" },
        { name: "九台农商行", rate: "1.515" },
        { name: "大庆银行", rate: "1.518" },
        { name: "湖北银行", rate: "1.520" },
      ],
      "6M": [
        { name: "威海银行", rate: "1.450" },
        { name: "泰安银行", rate: "1.470" },
        { name: "乌鲁木齐银行", rate: "1.480" },
        { name: "蒙商银行", rate: "1.480" },
        { name: "齐商银行", rate: "1.485" },
        { name: "盐城银行", rate: "1.490" },
        { name: "龙江银行", rate: "1.500" },
        { name: "晋商银行", rate: "1.500" },
        { name: "葫芦岛银行", rate: "1.505" },
        { name: "泸州银行", rate: "1.508" },
        { name: "赤峰银行", rate: "1.510" },
        { name: "甘肃银行", rate: "1.515" },
        { name: "昆仑银行", rate: "1.518" },
        { name: "宁夏银行", rate: "1.520" },
        { name: "吉林银行", rate: "1.522" },
        { name: "贵州银行", rate: "1.525" },
        { name: "九台农商行", rate: "1.528" },
        { name: "大庆银行", rate: "1.530" },
        { name: "湖北银行", rate: "1.535" },
      ],
      "9M": [
        { name: "威海银行", rate: "1.470" },
        { name: "泰安银行", rate: "1.490" },
        { name: "乌鲁木齐银行", rate: "1.495" },
        { name: "蒙商银行", rate: "1.500" },
        { name: "盐城银行", rate: "1.502" },
        { name: "齐商银行", rate: "1.505" },
        { name: "晋商银行", rate: "1.508" },
        { name: "龙江银行", rate: "1.510" },
        { name: "泸州银行", rate: "1.512" },
        { name: "赤峰银行", rate: "1.520" },
        { name: "甘肃银行", rate: "1.525" },
        { name: "昆仑银行", rate: "1.528" },
        { name: "宁夏银行", rate: "1.530" },
        { name: "吉林银行", rate: "1.532" },
        { name: "贵州银行", rate: "1.535" },
        { name: "九台农商行", rate: "1.538" },
        { name: "大庆银行", rate: "1.540" },
        { name: "湖北银行", rate: "1.545" },
      ],
      "1Y": [
        { name: "威海银行", rate: "1.490" },
        { name: "泰安银行", rate: "1.510" },
        { name: "乌鲁木齐银行", rate: "1.515" },
        { name: "齐商银行", rate: "1.518" },
        { name: "盐城银行", rate: "1.518" },
        { name: "蒙商银行", rate: "1.520", change: "+2.5" },
        { name: "晋商银行", rate: "1.522" },
        { name: "龙江银行", rate: "1.525" },
        { name: "泸州银行", rate: "1.525" },
        { name: "葫芦岛银行", rate: "1.530" },
        { name: "赤峰银行", rate: "1.535" },
        { name: "甘肃银行", rate: "1.540" },
        { name: "昆仑银行", rate: "1.542" },
        { name: "宁夏银行", rate: "1.545" },
        { name: "吉林银行", rate: "1.548" },
        { name: "贵州银行", rate: "1.550" },
        { name: "九台农商行", rate: "1.552" },
        { name: "大庆银行", rate: "1.555" },
        { name: "湖北银行", rate: "1.558" },
      ],
    },
  },
];
const fundStructureBars = [
  [700, 560, 360, 180, 630, 480, 640],
  [760, 420, 420, 270, 780, 610, 820],
  [820, 930, 520, 360, 560, 720, 980],
  [720, 510, 390, 250, 710, 540, 860],
  [260, 180, 410, 230, 1030, 390, 600],
  [320, 1120, 540, 350, 240, 520, 640],
  [1040, 320, 370, 240, 540, 440, 720],
  [220, 410, 300, 170, 590, 710, 820],
  [980, 360, 620, 420, 740, 610, 620],
  [440, 870, 410, 260, 660, 920, 860],
  [820, 210, 690, 490, 370, 560, 680],
  [1010, 720, 300, 220, 840, 430, 640],
  [760, 340, 520, 320, 690, 520, 710],
  [690, 560, 240, 190, 520, 390, 560],
] as const;
const fundStructureLegendItems = [
  { color: "#7286d3", label: "大行" },
  { color: "#a9d57f", label: "股份行" },
  { color: "#f4cf68", label: "理财" },
  { color: "#f6a960", label: "理财子" },
  { color: "#ea7878", label: "券商" },
  { color: "#8bc6de", label: "基金" },
  { color: "#63b383", label: "保险" },
] as const;

type FundStructureRange = "14d" | "1m" | "6m";

const fundStructureRangeTabs: Array<{ id: FundStructureRange; label: string }> =
  [
    { id: "14d", label: "14D" },
    { id: "1m", label: "1M" },
    { id: "6m", label: "6M" },
  ];

function generateFundStructureBars(count: number, _seed: number): number[][] {
  const bars: number[][] = [];
  for (let i = 0; i < count; i++) {
    const row: number[] = [];
    for (let j = 0; j < fundStructureLegendItems.length; j++) {
      // 离散随机 + 偶尔大幅跳变
      const r = Math.random();
      let ratio: number;
      if (r < 0.6) {
        ratio = 0.2 + Math.random() * 0.6;
      } else if (r < 0.9) {
        ratio = 0.05 + Math.random() * 0.35;
      } else {
        ratio = 0.7 + Math.random() * 0.3;
      }
      // 引入时段间差异
      const v = Math.round((180 + ratio * 900) * (0.7 + Math.random() * 0.6));
      row.push(v);
    }
    bars.push(row);
  }
  return bars;
}

function generateMonthLabels(count: number): string[] {
  const start = new Date(2026, 2, 24);
  return Array.from({ length: count }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return `${day.getMonth() + 1}/${day.getDate()}`;
  });
}

function generateHalfYearLabels(count: number): string[] {
  const start = new Date(2025, 10, 1);
  return Array.from({ length: count }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index * 7);
    return `${day.getMonth() + 1}/${day.getDate()}`;
  });
}

const fundStructureRangeData: Record<
  FundStructureRange,
  { bars: readonly (readonly number[])[]; labels: readonly string[] }
> = {
  "14d": { bars: fundStructureBars, labels: auxChartLabels },
  "1m": {
    bars: generateFundStructureBars(30, 11),
    labels: generateMonthLabels(30),
  },
  "6m": {
    bars: generateFundStructureBars(26, 47),
    labels: generateHalfYearLabels(26),
  },
};

type SentimentPoint = {
  label: string;
  total: number;
  bigBank: number;
  smallBank: number;
  nonBank: number;
};

function generateSentimentSeries(
  count: number,
  _seed: number,
  base: number,
  amp: number,
): number[] {
  const result: number[] = new Array(count);
  result[0] = base + (Math.random() - 0.5) * amp;
  for (let i = 1; i < count; i++) {
    const r = Math.random();
    let jump: number;
    if (r < 0.6) {
      jump = (Math.random() - 0.5) * amp * 0.4;
    } else if (r < 0.9) {
      jump = (Math.random() - 0.5) * amp * 1.2;
    } else {
      jump = (Math.random() - 0.5) * amp * 3;
    }
    result[i] = Math.max(
      0,
      Math.min(100, Math.round((result[i - 1] + jump) * 10) / 10),
    );
  }
  return result;
}

const sentimentTrendData: SentimentPoint[] = (() => {
  const dates = [
    "04-07",
    "04-08",
    "04-09",
    "04-10",
    "04-11",
    "04-13",
    "04-14",
    "04-15",
    "04-16",
    "04-17",
    "04-20",
    "04-21",
    "04-22",
    "04-23",
    "04-24",
    "04-27",
    "04-28",
    "04-29",
    "04-30",
    "05-07",
  ];
  const t = generateSentimentSeries(20, 1, 49.5, 2.8);
  const b = generateSentimentSeries(20, 7, 47.2, 2.2);
  const s = generateSentimentSeries(20, 13, 50.8, 2.5);
  const n = generateSentimentSeries(20, 19, 49.0, 3.0);
  return dates.map((label, i) => ({
    label,
    total: t[i],
    bigBank: b[i],
    smallBank: s[i],
    nonBank: n[i],
  }));
})();

const sentimentRealtimeData: SentimentPoint[] = (() => {
  const labels: string[] = [];
  for (let i = 0; i < 40; i++) {
    const total = 9 * 60 + 30 + i * 6;
    labels.push(
      `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`,
    );
  }
  const t = generateSentimentSeries(40, 3, 50.5, 1.5);
  const b = generateSentimentSeries(40, 9, 47.5, 1.8);
  const s = generateSentimentSeries(40, 15, 50.8, 1.3);
  const n = generateSentimentSeries(40, 21, 49.2, 2.0);
  return labels.map((label, i) => ({
    label,
    total: t[i],
    bigBank: b[i],
    smallBank: s[i],
    nonBank: n[i],
  }));
})();

function FloatingBall() {
  const [pos, setPos] = useState({
    x: window.innerWidth - 80,
    y: window.innerHeight - 80,
  });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    setPos({
      x: e.clientX - offset.current.x,
      y: e.clientY - offset.current.y,
    });
  };

  const onPointerUp = () => {
    dragging.current = false;
  };

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{ left: pos.x, top: pos.y }}
      className="fixed z-[9999] flex h-16 w-16 cursor-grab select-none items-center justify-center rounded-full bg-blue-600/60 shadow-lg backdrop-blur active:cursor-grabbing"
    >
      <span className="text-xl font-bold text-white">42</span>
    </div>
  );
}

function App() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#09111d] text-slate-100">
      <div className="flex h-full flex-col">
        <TopBar currentTime={currentTime} />
        <main className="grid min-h-0 flex-1 grid-cols-[30fr_35fr_35fr] grid-rows-[minmax(0,1fr)] gap-3 overflow-hidden px-3 pb-3 pt-2">
          <LeftSummaryPanel />
          <MainQuoteBoard />
          <RightSidebar />
        </main>
      </div>
      <FloatingBall />
    </div>
  );
}

function TopBar({ currentTime }: { currentTime: Date }) {
  return (
    <header className="border-b border-[#1b2a42] bg-[#0d1726] px-4 py-2 shadow-[inset_0_-1px_0_rgba(74,101,140,0.18)]">
      <div
        className="grid items-center gap-4"
        style={{ gridTemplateColumns: "auto 1fr auto" }}
      >
        <div className="text-[20px] font-semibold tracking-[0.04em] text-slate-50">
          资金实时行情看板
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-slate-400">
          <FilterLabel>期限</FilterLabel>
          <div className="flex flex-wrap items-center gap-1.5">
            {topBoardFilters.periods.map((item, index) => (
              <ToolbarChip key={item} active={index === 0}>
                {item}
              </ToolbarChip>
            ))}
          </div>
          <FilterDivider />
          <FilterLabel>金额</FilterLabel>
          <RangeFilterField value={topBoardFilters.amountMin} />
          <span className="text-slate-500">~</span>
          <RangeFilterField value={topBoardFilters.amountMax} />
          <span className="text-slate-500">亿</span>
          <FilterDivider />
          <FilterLabel>利率</FilterLabel>
          <RangeFilterField value={topBoardFilters.rateMin} />
          <span className="text-slate-500">~</span>
          <RangeFilterField value={topBoardFilters.rateMax} />
          <span className="text-slate-500">%</span>
        </div>
        <div className="flex items-center gap-3">
          <InfoChip label="DR007" value="2.15%" tone="alert" />
          <SentimentChipWithPopover />
          <StatusBadge>平衡</StatusBadge>
        </div>
      </div>
    </header>
  );
}

function LeftSummaryPanel() {
  const [bankRateRows, setBankRateRows] = useState<BankRateRow[]>([
    ...initialBankRateRows,
  ]);
  const [draftBankRateRows, setDraftBankRateRows] = useState<BankRateRow[]>([
    ...initialBankRateRows,
  ]);
  const [isBankEditorOpen, setIsBankEditorOpen] = useState(false);

  const summarySections = leftSections
    .filter(
      (section): section is SummaryTableSection => section.layout === "table",
    )
    .map((section) =>
      section.title === "当日大行价格"
        ? {
            ...section,
            rows: bankRateRows.map((row) => [
              row.institution,
              row.nonBankRate,
              row.deltaNonBankBp,
              row.bankRate,
              row.deltaBp,
              row.updatedAt,
            ]),
          }
        : section,
    );
  const exchangeRepoSection = leftSections.find(
    (section): section is ExchangeMarketSplitSection =>
      section.layout === "exchange-split",
  );

  function openBankEditor() {
    setDraftBankRateRows(bankRateRows.map((row) => ({ ...row })));
    setIsBankEditorOpen(true);
  }

  function updateDraftRow(
    index: number,
    field: keyof BankRateRow,
    value: string,
  ) {
    setDraftBankRateRows((current) =>
      current.map((row, rowIndex) => {
        if (rowIndex !== index) return row;
        const updated = { ...row, [field]: value };
        if (field === "bankRate") {
          const cur = parseFloat(value.replace("%", ""));
          const ref = parseFloat(row.refBankRate.replace("%", ""));
          if (!isNaN(cur) && !isNaN(ref)) {
            const bp = Math.round((cur - ref) * 100 * 10) / 10;
            updated.deltaBp = bp > 0 ? `+${bp}` : String(bp);
          }
        }
        if (field === "nonBankRate") {
          const cur = parseFloat(value.replace("%", ""));
          const ref = parseFloat(row.refNonBankRate.replace("%", ""));
          if (!isNaN(cur) && !isNaN(ref)) {
            const bp = Math.round((cur - ref) * 100 * 10) / 10;
            updated.deltaNonBankBp = bp > 0 ? `+${bp}` : String(bp);
          }
        }
        return updated;
      }),
    );
  }

  function resetDraftRows() {
    setDraftBankRateRows(initialBankRateRows.map((row) => ({ ...row })));
  }

  function saveBankRateRows() {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    setBankRateRows(
      draftBankRateRows.map((row) => ({ ...row, updatedAt: time })),
    );
    setIsBankEditorOpen(false);
  }

  return (
    <>
      <aside className="flex h-full min-h-0 min-w-0 flex-col gap-3 overflow-hidden pr-1">
        {summarySections.map((section) => (
          <div
            key={section.title}
            className={section.scrollable ? "min-h-0 flex-1" : "shrink-0"}
          >
            <PanelCard
              title={section.title}
              bodyClassName="min-h-0 flex-1"
              bodyPaddingClassName="p-0"
              bodyFill
              actions={
                section.title === "当日大行价格" ? (
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded-lg border border-[#33507d] bg-[#14223a] px-3 py-1 text-xs font-medium text-slate-300"
                      onClick={openBankEditor}
                      type="button"
                    >
                      手工输入
                    </button>
                    <button
                      className="rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300"
                      type="button"
                    >
                      下载
                    </button>
                  </div>
                ) : undefined
              }
            >
              <StructuredTable
                columns={section.columns}
                rows={section.rows}
                greenColumns={section.greenColumns}
                redColumns={section.redColumns}
                deltaColumns={section.deltaColumns}
                emphasisColumns={section.emphasisColumns}
                buttonColumn={section.buttonColumn}
                fitToWidth={section.fitToWidth}
                columnWidths={section.columnWidths}
                compact
                flush
                adaptiveHeight={!section.scrollable}
                scrollY={section.scrollable}
              />
            </PanelCard>
          </div>
        ))}
        {exchangeRepoSection ? (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="h-[250px] shrink-0 overflow-hidden">
              <ExchangeRepoCard
                title={exchangeRepoSection.title}
                markets={exchangeRepoSection.markets}
              />
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <LeftNcdCard />
            </div>
          </div>
        ) : null}
      </aside>
      <BankRateEditorModal
        open={isBankEditorOpen}
        rows={draftBankRateRows}
        onChange={updateDraftRow}
        onClose={() => setIsBankEditorOpen(false)}
        onReset={resetDraftRows}
        onSave={saveBankRateRows}
      />
    </>
  );
}

function BankRateEditorModal({
  open,
  rows,
  onChange,
  onClose,
  onReset,
  onSave,
}: {
  open: boolean;
  rows: readonly BankRateRow[];
  onChange: (index: number, field: keyof BankRateRow, value: string) => void;
  onClose: () => void;
  onReset: () => void;
  onSave: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#02060dcc] px-4">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-[#25406a] bg-[#0d1726] shadow-[0_24px_80px_rgba(2,7,18,0.58)]">
        <div className="border-b border-[#1c3150] bg-[#101d32] px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-base font-semibold text-slate-50">
                当日大行价格手工输入
              </div>
              <div className="mt-1 text-xs text-slate-500">
                按机构维护非银利率和银行利率，涨跌及更新时间自动计算。
              </div>
            </div>
            <button
              className="rounded-lg border border-[#33507d] bg-[#14223a] px-3 py-1.5 text-xs font-medium text-slate-300"
              onClick={onClose}
              type="button"
            >
              关闭
            </button>
          </div>
        </div>
        <div className="px-5 py-4">
          <div className="overflow-hidden rounded-xl border border-[#1c2b42] bg-[#0a1322]">
            <div className="grid grid-cols-[1.4fr_1fr_1fr] border-b border-[#22324d] bg-[#111d30] px-4 py-2 text-[11px] font-medium tracking-[0.02em] text-slate-400">
              <span>机构</span>
              <span className="text-right">非银利率</span>
              <span className="text-right">银行利率</span>
            </div>
            {rows.map((row, index) => (
              <div
                key={`${row.institution}-${index}`}
                className={`grid grid-cols-[1.4fr_1fr_1fr] items-center gap-3 border-b border-[#162439] px-4 py-3 ${
                  index % 2 === 0 ? "bg-transparent" : "bg-[#0d1726]/55"
                }`}
              >
                <div className="text-sm font-semibold text-slate-100">
                  {row.institution}
                </div>
                <ModalInput
                  align="right"
                  value={row.nonBankRate}
                  onChange={(value) => onChange(index, "nonBankRate", value)}
                />
                <ModalInput
                  align="right"
                  value={row.bankRate}
                  onChange={(value) => onChange(index, "bankRate", value)}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-[#1c3150] bg-[#0d1726] px-5 py-4">
          <button
            className="rounded-lg border border-[#33507d] bg-[#14223a] px-3 py-1.5 text-xs font-medium text-slate-300"
            onClick={onReset}
            type="button"
          >
            重置
          </button>
          <button
            className="rounded-lg border border-[#33507d] bg-[#14223a] px-3 py-1.5 text-xs font-medium text-slate-300"
            onClick={onClose}
            type="button"
          >
            取消
          </button>
          <button
            className="rounded-lg border border-blue-500/30 bg-blue-500/20 px-3 py-1.5 text-xs font-medium text-blue-300"
            onClick={onSave}
            type="button"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalInput({
  value,
  onChange,
  align = "left",
}: {
  value: string;
  onChange: (value: string) => void;
  align?: "left" | "right";
}) {
  return (
    <input
      className={`w-full rounded-lg border border-[#284164] bg-[#0f1b2f] px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-blue-400 ${
        align === "right" ? "text-right" : "text-left"
      }`}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function LeftNcdCard() {
  const [market, setMarket] = useState<"primary" | "secondary">("primary");
  const [mode, setMode] = useState<"trend" | "table">("trend");
  const [expanded, setExpanded] = useState(false);

  const header = (onClose?: () => void) => (
    <div className="flex items-center gap-2">
      <div className="text-sm font-semibold tracking-[0.02em] text-slate-50">
        NCD
      </div>
      <div className="flex items-center gap-1">
        <button
          className={auxTabClass(market === "primary")}
          onClick={() => setMarket("primary")}
          type="button"
        >
          一级
        </button>
        <button
          className={auxTabClass(market === "secondary")}
          onClick={() => setMarket("secondary")}
          type="button"
        >
          二级
        </button>
      </div>
      <div className="ml-auto flex items-center gap-1">
        <button
          className={auxTabClass(mode === "trend")}
          onClick={() => setMode("trend")}
          type="button"
        >
          趋势图
        </button>
        <button
          className={auxTabClass(mode === "table")}
          onClick={() => setMode("table")}
          type="button"
        >
          表格
        </button>
        {onClose ? (
          <button
            onClick={onClose}
            type="button"
            className="ml-1 rounded p-0.5 text-slate-400 hover:bg-[#1e3358] hover:text-slate-100"
            title="收起"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 2l4 4M2 2h3M2 2v3M12 12l-4-4M12 12H9M12 12V9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : (
          <button
            onClick={() => setExpanded(true)}
            type="button"
            className="ml-1 rounded p-0.5 text-slate-400 hover:bg-[#1e3358] hover:text-slate-100"
            title="展开"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M5 2H2v3M2 2l4 4M9 12h3V9M12 12l-4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );

  const body =
    market === "primary" ? (
      mode === "trend" ? (
        <NcdPrimaryTrendPanel />
      ) : (
        <NcdPrimaryTable />
      )
    ) : mode === "trend" ? (
      <NcdTrendPanel compact />
    ) : (
      <div className="h-full min-h-0">
        <StructuredTable
          columns={["期限", "最新", "涨跌bp", "参考收益", "更新时间"]}
          rows={ncdTableRows}
          greenColumns={[1]}
          deltaColumns={[2]}
          fitToWidth
          columnWidths={["14%", "18%", "16%", "22%", "30%"]}
          compact
          flush={false}
          scrollY
        />
      </div>
    );

  return (
    <>
      <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1e2f48] bg-[#0d1726] shadow-[0_12px_28px_rgba(3,8,18,0.32)]">
        <div className="border-b border-[#18263b] bg-[#101b2c] px-4 py-2.5">
          {header()}
        </div>
        <div className="min-h-0 flex-1 overflow-hidden p-2">{body}</div>
      </section>
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#02060dcc]"
          onClick={() => setExpanded(false)}
        >
          <div
            className="relative flex h-[85vh] w-[90vw] max-w-[1400px] flex-col overflow-hidden rounded-2xl border border-[#25406a] bg-[#0d1726] shadow-[0_24px_80px_rgba(2,7,18,0.58)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setExpanded(false)}
              type="button"
              className="absolute right-3 top-3 z-10 rounded p-1 text-slate-400 hover:bg-[#1e3358] hover:text-slate-100"
              title="收起"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M2 2l4 4M2 2h3M2 2v3M12 12l-4-4M12 12H9M12 12V9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div className="min-h-0 flex-1 overflow-hidden p-3">
              {market === "primary" && mode === "table" ? (
                <NcdPrimaryExpandedTable />
              ) : market === "primary" && mode === "trend" ? (
                <NcdExpandedDualView period={period} />
              ) : (
                body
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ExchangeRepoCard({
  title,
  markets,
}: {
  title: string;
  markets: ExchangeMarketSplitSection["markets"];
}) {
  const [activeView, setActiveView] = useState<"core" | "sse" | "szse">("core");
  const filteredMarkets =
    activeView === "core"
      ? markets
      : markets.filter((market) => market.id === activeView);

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1e2f48] bg-[#0d1726] shadow-[0_12px_28px_rgba(3,8,18,0.32)]">
      <div className="border-b border-[#18263b] bg-[#101b2c] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold tracking-[0.02em] text-slate-50">
            {title}
          </div>
          <div className="flex items-center gap-2">
            {[
              { id: "core", label: "核心" },
              { id: "sse", label: "上交所" },
              { id: "szse", label: "深交所" },
            ].map((tab) => (
              <button
                key={tab.id}
                className={auxTabClass(tab.id === activeView)}
                onClick={() => setActiveView(tab.id as "core" | "sse" | "szse")}
                type="button"
              >
                {tab.label}
              </button>
            ))}
            <button
              className="rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300"
              type="button"
            >
              下载
            </button>
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 p-2">
        {activeView === "core" ? (
          <ExchangeCoreCompactBoard markets={markets} />
        ) : (
          <div className="grid h-full min-h-0 grid-cols-1">
            {filteredMarkets.map((market) => (
              <ExchangeMarketTable
                key={`${activeView}-${market.id}`}
                market={market}
                rows={market.rows}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ExchangeCoreCompactBoard({
  markets,
}: {
  markets: ExchangeMarketSplitSection["markets"];
}) {
  const combinedRows = markets.flatMap((market) => market.rows.slice(0, 2));
  return (
    <div className="h-full min-h-0">
      <ExchangeCoreCompactBlock rows={combinedRows} rowCount={5} />
    </div>
  );
}

function ExchangeCoreCompactBlock({
  rows,
  rowCount = 2,
}: {
  rows: readonly (readonly string[])[];
  rowCount?: number;
}) {
  const paddedRows = Array.from(
    { length: rowCount },
    (_, i) => rows[i] ?? null,
  );
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[#1c2b42] bg-[#0a1322]">
      <table className="w-full table-fixed shrink-0">
        <thead>
          <tr className="border-b border-[#22324d] bg-[#111d30] text-[11px] font-medium tracking-[0.02em] text-slate-400">
            <th className="w-[18%] px-2 py-1.5 text-left font-medium">期限</th>
            <th className="w-[30%] px-2 py-1.5 text-left font-medium">品种</th>
            <th className="w-[28%] px-2 py-1.5 text-right font-medium">最新</th>
            <th className="w-[24%] px-2 py-1.5 text-right font-medium">
              涨跌bp
            </th>
          </tr>
        </thead>
      </table>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <table className="w-full table-fixed">
          <tbody>
            {paddedRows.map((row, rowIndex) => (
              <tr
                key={row ? `${row[1]}-${rowIndex}` : `empty-${rowIndex}`}
                className={`text-xs ${
                  rowIndex > 0 ? "border-t border-[#162439]" : ""
                }`}
              >
                {row ? (
                  <>
                    <td className="w-[18%] px-2 py-1.5 font-semibold text-slate-100">
                      {row[0]}
                    </td>
                    <td className="w-[30%] px-2 py-1.5 font-semibold text-slate-100">
                      {row[1]}
                    </td>
                    <td className="w-[28%] px-2 py-1.5 text-right font-semibold text-emerald-300">
                      {row[2]}
                    </td>
                    <td
                      className={`w-[24%] px-2 py-1.5 text-right ${cellClassName(row[3], 1, [], [], [1], [])}`}
                    >
                      {row[3]}
                    </td>
                  </>
                ) : (
                  <td colSpan={4} />
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExchangeMarketTable({
  market,
  rows,
}: {
  market: ExchangeMarketSplitSection["markets"][number];
  rows?: readonly (readonly string[])[];
}) {
  const displayRows = rows ?? market.rows;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[#1c2b42] bg-[#0a1322]">
      <table className="w-full table-fixed shrink-0">
        <thead>
          <tr className="border-b border-[#22324d] bg-[#111d30] text-[11px] font-medium tracking-[0.02em] text-slate-400">
            {market.columns.map((column, index) => (
              <th
                key={`${market.title}-${column}`}
                className={`px-2 py-1.5 font-medium ${
                  index === 0
                    ? "w-[18%] text-left"
                    : index === 1
                      ? "w-[30%] text-left"
                      : index === 2
                        ? "w-[28%] text-right"
                        : "w-[24%] text-right"
                }`}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
      </table>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <table className="w-full table-fixed">
          <tbody>
            {displayRows.map((row, rowIndex) => (
              <tr
                key={`${market.title}-${row[0]}-${rowIndex}`}
                className={`border-b border-[#162439] text-xs ${
                  rowIndex % 2 === 0 ? "bg-transparent" : "bg-[#0d1726]/55"
                }`}
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={`${market.title}-${row[0]}-${cellIndex}`}
                    className={`px-2 py-1.5 ${
                      cellIndex === 0
                        ? "w-[18%] text-left"
                        : cellIndex === 1
                          ? "w-[30%] text-left truncate"
                          : cellIndex === 2
                            ? "w-[28%] text-right"
                            : "w-[24%] text-right"
                    }`}
                    title={cell}
                  >
                    <span
                      className={cellClassName(
                        cell,
                        cellIndex,
                        market.greenColumns,
                        [],
                        market.deltaColumns,
                        [],
                      )}
                    >
                      {cell}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const QUOTE_BOARD_RATIO_KEY = "quoteBoardLevel2TopRatio";
const DEFAULT_LEVEL2_TOP_RATIO = 70;

function MainQuoteBoard() {
  const [displayLevel, setDisplayLevel] = useState<1 | 2>(1);
  const [activeSectionId, setActiveSectionId] = useState<
    RepoQuoteSection["id"]
  >(repoQuoteSections[0].id);
  const [topRatio, setTopRatio] = useState<number>(() => {
    if (typeof window === "undefined") return DEFAULT_LEVEL2_TOP_RATIO;
    const saved = window.localStorage.getItem(QUOTE_BOARD_RATIO_KEY);
    const parsed = saved == null ? NaN : parseFloat(saved);
    return Number.isFinite(parsed)
      ? clampRatio(parsed)
      : DEFAULT_LEVEL2_TOP_RATIO;
  });
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(QUOTE_BOARD_RATIO_KEY, String(topRatio));
  }, [topRatio]);

  function startDrag(event: React.MouseEvent<HTMLDivElement>) {
    event.preventDefault();
    const body = bodyRef.current;
    if (!body) return;

    function update(clientY: number) {
      const rect = body!.getBoundingClientRect();
      if (rect.height <= 0) return;
      const next = ((clientY - rect.top) / rect.height) * 100;
      setTopRatio(clampRatio(next));
    }

    function onMove(ev: MouseEvent) {
      update(ev.clientY);
    }

    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    }

    document.body.style.userSelect = "none";
    document.body.style.cursor = "row-resize";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden pr-1">
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#2a4a78] bg-[#0c1730]">
        <div className="border-b border-[#1b2a42] bg-[#101b2c] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-base font-semibold text-slate-50">
                报价明细
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className={auxTabClass(displayLevel === 1)}
                onClick={() => setDisplayLevel(1)}
                type="button"
              >
                1级
              </button>
              <button
                className={auxTabClass(displayLevel === 2)}
                onClick={() => setDisplayLevel(2)}
                type="button"
              >
                2级
              </button>
              <button
                className="rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300"
                type="button"
              >
                下载
              </button>
            </div>
          </div>
        </div>
        <div ref={bodyRef} className="flex min-h-0 flex-1 flex-col">
          {repoQuoteSections.map((section, index) => {
            const isLast = index === repoQuoteSections.length - 1;
            const dragRatio =
              displayLevel === 2
                ? index === 0
                  ? topRatio
                  : 100 - topRatio
                : null;
            return (
              <Fragment key={section.id}>
                <RepoQuoteSectionBoard
                  section={section}
                  displayLevel={displayLevel}
                  withTopBorder={index === 1}
                  isActive={section.id === activeSectionId}
                  onActivate={() => setActiveSectionId(section.id)}
                  dragRatio={dragRatio}
                />
                {displayLevel === 2 && !isLast ? (
                  <div
                    role="separator"
                    aria-orientation="horizontal"
                    onMouseDown={startDrag}
                    className="group relative h-1.5 shrink-0 cursor-row-resize bg-[#18263b] transition-colors hover:bg-sky-500/60"
                  >
                    <span className="pointer-events-none absolute left-1/2 top-1/2 h-[2px] w-10 -translate-x-1/2 -translate-y-1/2 rounded bg-slate-500/60 group-hover:bg-sky-200" />
                  </div>
                ) : null}
              </Fragment>
            );
          })}
        </div>
      </section>
    </section>
  );
}

function clampRatio(value: number) {
  return Math.max(15, Math.min(85, value));
}

function RepoQuoteSectionBoard({
  section,
  displayLevel,
  withTopBorder,
  isActive,
  onActivate,
  dragRatio,
}: {
  section: RepoQuoteSection;
  displayLevel: 1 | 2;
  withTopBorder?: boolean;
  isActive: boolean;
  onActivate: () => void;
  dragRatio: number | null;
}) {
  const useDrag = displayLevel === 2 && dragRatio != null;
  const containerStyle = useDrag
    ? { flex: `${dragRatio} 1 0%`, minHeight: 0 }
    : undefined;
  return (
    <div
      className={`flex min-h-0 flex-col ${
        useDrag
          ? ""
          : displayLevel === 2
            ? isActive
              ? "min-h-0 flex-[7]"
              : "min-h-0 flex-[3]"
            : isActive
              ? "flex-none"
              : "min-h-0 flex-1"
      } ${withTopBorder ? "border-t border-[#18314f]" : ""}`}
      style={containerStyle}
      onFocus={onActivate}
      onClick={onActivate}
      tabIndex={0}
    >
      <div
        className={`flex cursor-pointer items-center justify-between px-4 py-1.5 ${isActive ? "border-l-[3px] border-sky-300 bg-gradient-to-r from-sky-500/40 via-sky-600/25 to-transparent shadow-[inset_0_-1px_0_rgba(125,211,252,0.35)]" : "bg-[#0f1a2d]"}`}
      >
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold text-slate-100">
            {section.title}
          </div>
          {isActive ? (
            <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-medium text-sky-300">
              焦点
            </span>
          ) : null}
        </div>
        <div className="rounded-full border border-[#29456c] bg-[#12203a] px-2 py-0.5 text-[11px] text-slate-400">
          层级 1 / 2
        </div>
      </div>
      <div
        className={`min-h-0 ${
          displayLevel === 2
            ? "flex-1 overflow-y-auto"
            : isActive
              ? "overflow-hidden"
              : "flex-1 overflow-y-auto"
        }`}
      >
        <div className="grid grid-cols-[1.65fr_0.72fr_0.84fr_0.9fr_1.05fr_1fr_0.6fr] border-y border-[#1c3150] bg-[#111d30] px-4 py-1.5 text-[11px] font-medium tracking-[0.02em] text-slate-400">
          <span>分组 / 机构</span>
          <span className="text-right">期限</span>
          <span className="text-right">金额(总量)</span>
          <span className="text-right">利率(均价)</span>
          <span className="text-right">账户要求</span>
          <span className="text-right">质押要求</span>
          <span className="text-right">操作</span>
        </div>
        {section.groups.map((group) => (
          <div key={group.id} className="border-b-2 border-[#1f3759]">
            <div className="grid w-full grid-cols-[1.65fr_0.72fr_0.84fr_0.9fr_1.05fr_1fr_0.6fr] items-center border-l-[3px] border-sky-500/70 bg-gradient-to-r from-[#15294a] via-[#11223c] to-[#0d1a30] px-4 py-2 text-left shadow-[inset_0_-1px_0_rgba(56,113,189,0.25)]">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 rounded-md border border-sky-400/40 bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold tracking-[0.08em] text-sky-200">
                  汇总
                </span>
                <div className="text-xs font-semibold text-slate-50">
                  {group.name}
                </div>
              </div>
              <span aria-hidden="true" />
              <span className="text-right text-xs font-semibold text-slate-100">
                {group.totalAmount}
              </span>
              <span className="text-right text-xs font-semibold text-amber-300">
                {group.averageRate}
              </span>
              <span aria-hidden="true" />
              <span aria-hidden="true" />
              <span />
            </div>
            {displayLevel === 1 ? (
              <div className="divide-y divide-[#152437] bg-[#080f1c]">
                {selectLevel1Rows(group).map((row) => (
                  <div
                    key={row.id}
                    className="grid w-full grid-cols-[1.65fr_0.72fr_0.84fr_0.9fr_1.05fr_1fr_0.6fr] items-center border-l-[3px] border-transparent py-1.5 pl-8 pr-4 text-left text-xs text-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      <RankBadge rank={row.rank} />
                      <span className="text-slate-100">{row.institution}</span>
                    </div>
                    <span className="text-right">{row.tenor}</span>
                    <span className="text-right">{row.amount}</span>
                    <span className="text-right font-semibold text-amber-300">
                      {row.rate}
                    </span>
                    <span
                      className="truncate pl-3 text-right text-xs text-slate-300"
                      title={normalizeAccountRequirement(row.accountType)}
                    >
                      {normalizeAccountRequirement(row.accountType)}
                    </span>
                    <span
                      className="truncate pl-3 text-right text-xs text-slate-300"
                      title={`${row.collateral} / ${row.reason}`}
                    >
                      {row.collateral}
                    </span>
                    <span className="flex items-center justify-end">
                      <button
                        className="rounded-lg border border-blue-500/30 bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-medium text-blue-300"
                        type="button"
                      >
                        发送
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
            {displayLevel === 2 ? (
              <div className="divide-y divide-[#152437] bg-[#080f1c]">
                {sortRowsByRank(group.rows).map((row) => (
                  <div
                    key={row.id}
                    className="grid w-full grid-cols-[1.65fr_0.72fr_0.84fr_0.9fr_1.05fr_1fr_0.6fr] items-center border-l-[3px] border-transparent py-1.5 pl-8 pr-4 text-left text-xs text-slate-200 transition hover:bg-[#11253d]"
                  >
                    <div className="flex items-center gap-2">
                      {row.rank === "最优" || row.rank === "次优" ? (
                        <RankBadge rank={row.rank} />
                      ) : null}
                      <span className="text-slate-100">{row.institution}</span>
                    </div>
                    <span className="text-right">{row.tenor}</span>
                    <span className="text-right">{row.amount}</span>
                    <span className="text-right font-semibold text-amber-300">
                      {row.rate}
                    </span>
                    <span
                      className="truncate pl-3 text-right text-xs text-slate-300"
                      title={normalizeAccountRequirement(row.accountType)}
                    >
                      {normalizeAccountRequirement(row.accountType)}
                    </span>
                    <span
                      className="truncate pl-3 text-right text-xs text-slate-300"
                      title={`${row.collateral} / ${row.reason}`}
                    >
                      {row.collateral}
                    </span>
                    <span className="flex items-center justify-end">
                      <button
                        className="rounded-lg border border-blue-500/30 bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-medium text-blue-300"
                        type="button"
                      >
                        发送
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function normalizeAccountRequirement(accountType: string) {
  if (accountType.includes("自营")) return "自营";
  if (accountType.includes("公募")) return "公募";
  if (accountType.includes("券商资管")) return "专户出老户";
  if (accountType.includes("理财子") || accountType.includes("保险资管"))
    return "可专户";
  if (accountType.includes("商金")) return "非专户";
  if (accountType.includes("股份行")) return "不限户";
  return "不限户";
}

function summarizeAccountRequirements(rows: readonly QuoteDetailRow[]) {
  return Array.from(
    new Set(rows.map((row) => normalizeAccountRequirement(row.accountType))),
  ).join(" / ");
}

const level1TenorRulesByGroup: Record<string, readonly string[]> = {
  利率地方: ["R001", "R007"],
  存单商金: ["R001", "R007"],
  信用: ["R001", "R007", "R014"],
};

const rankPriority: Record<QuoteRank, number> = {
  最优: 0,
  次优: 1,
  报价: 2,
};

function sortRowsByRank(rows: readonly QuoteDetailRow[]): QuoteDetailRow[] {
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const ra = rankPriority[a.row.rank] ?? 99;
      const rb = rankPriority[b.row.rank] ?? 99;
      if (ra !== rb) return ra - rb;
      return a.index - b.index;
    })
    .map(({ row }) => row);
}

function selectLevel1Rows(group: QuoteGroup): QuoteDetailRow[] {
  const rule = level1TenorRulesByGroup[group.name];
  if (!rule) {
    return group.rows.filter(
      (row) => row.rank === "最优" || row.rank === "次优",
    );
  }
  const tenorIndex = new Map(rule.map((tenor, index) => [tenor, index]));
  return group.rows
    .filter(
      (row) =>
        tenorIndex.has(row.tenor) &&
        (row.rank === "最优" || row.rank === "次优"),
    )
    .sort((a, b) => {
      const ta = tenorIndex.get(a.tenor) ?? 999;
      const tb = tenorIndex.get(b.tenor) ?? 999;
      if (ta !== tb) return ta - tb;
      return a.rank === "最优" ? -1 : 1;
    });
}

function RankBadge({ rank }: { rank: QuoteRank }) {
  const styles =
    rank === "最优"
      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
      : rank === "次优"
        ? "border-amber-500/40 bg-amber-500/15 text-amber-300"
        : "border-slate-500/40 bg-slate-500/15 text-slate-300";
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded border px-1.5 py-0.5 text-[10px] font-medium ${styles}`}
    >
      {rank}
    </span>
  );
}

function RightSidebar() {
  const [overlayProduct, setOverlayProduct] = useState<OverlayProduct>("none");
  const [historyRange, setHistoryRange] = useState<HistoryRange>("5d");
  const [rightLowerTab, setRightLowerTab] = useState<RightLowerTab>("matrix");
  const [compareProduct, setCompareProduct] = useState<CompareProduct>("none");

  return (
    <aside
      className="grid min-h-0 min-w-0 gap-3 overflow-hidden"
      style={{
        gridTemplateRows: "minmax(0, 10fr) minmax(0, 9fr) minmax(0, 11fr)",
      }}
    >
      <div className="min-h-0 overflow-hidden">
        <IntradayPanel
          overlayProduct={overlayProduct}
          onOverlayChange={setOverlayProduct}
        />
      </div>

      <div className="min-h-0 overflow-hidden">
        <HistoryClosePanel
          activeRange={historyRange}
          overlayProduct={overlayProduct}
          compareProduct={compareProduct}
          onRangeChange={setHistoryRange}
          onCompareChange={setCompareProduct}
        />
      </div>

      <div className="min-h-0 overflow-hidden">
        <RightLowerPanel
          activeTab={rightLowerTab}
          activeRange={historyRange}
          onTabChange={setRightLowerTab}
        />
      </div>
    </aside>
  );
}

function RightLowerPanel({
  activeTab,
  activeRange,
  onTabChange,
}: {
  activeTab: RightLowerTab;
  activeRange: HistoryRange;
  onTabChange: (tab: RightLowerTab) => void;
}) {
  return (
    <section className="grid h-full min-h-0 grid-rows-[auto_1fr] overflow-hidden rounded-xl border border-[#284164] bg-[#0b1728]">
      <div className="flex items-center gap-2 border-b border-[#203551] bg-[#101d32] px-3 py-2">
        {rightLowerTabs.map((tab) => (
          <button
            key={tab.id}
            className={auxTabClass(tab.id === activeTab)}
            onClick={() => onTabChange(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 overflow-hidden p-2">
        {activeTab === "matrix" && <CfetsMatrixPanel includeDaily />}
        {activeTab === "inst" && <CfetsInstPanel />}
        {activeTab === "bond" && <CfetsBondPanel />}
      </div>
    </section>
  );
}

function IntradayPanel({
  overlayProduct,
  onOverlayChange,
}: {
  overlayProduct: OverlayProduct;
  onOverlayChange: (product: OverlayProduct) => void;
}) {
  const overlaySeries =
    overlayProduct === "none"
      ? null
      : buildOverlaySeries(intradaySeries, overlayProduct);
  const barValues = overlaySeries
    ? intradaySeries.map((value, index) =>
        Number(((value - overlaySeries[index]) * 100).toFixed(1)),
      )
    : null;
  const min = Math.min(...intradaySeries, ...(overlaySeries ?? [])) - 0.01;
  const max = Math.max(...intradaySeries, ...(overlaySeries ?? [])) + 0.01;
  const mainPath = buildLinePath(intradaySeries, 680, 178, min, max);
  const areaPath = buildAreaPath(intradaySeries, 680, 178, min, max);
  const overlayPath = overlaySeries
    ? buildLinePath(overlaySeries, 680, 178, min, max)
    : null;
  const { tooltipState, containerRef, handleMouseMove, handleMouseLeave } =
    useChartTooltip(intradaySeries.length);
  const ti = tooltipState?.index ?? null;

  return (
    <section className="grid h-full min-h-0 grid-rows-[auto_1fr] overflow-hidden rounded-xl border border-[#284164] bg-[#0b1728]">
      <div className="flex items-center justify-between gap-3 border-b border-[#203551] bg-[#101d32] px-3 py-2">
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold text-slate-100">当日分时</div>
          <div className="rounded border border-[#264167] bg-[#13223a] px-1.5 py-0.5 text-[10px] font-medium text-blue-300">
            R001
          </div>
          <OverlayProductSelect
            value={overlayProduct}
            onChange={onOverlayChange}
          />
        </div>
        <div className="text-xs text-slate-400">
          {overlayProduct !== "none"
            ? "盘中加权利率 / 利差(bp)"
            : "盘中加权利率 / 成交量"}
        </div>
      </div>
      <div className="grid min-h-0 grid-rows-[1fr_auto] px-3 pb-2 pt-2">
        <div className="grid min-h-0 grid-cols-[3rem_1fr]">
          <div className="flex flex-col justify-between pr-2 text-right text-[10px] text-slate-400">
            {buildAxisLabels(min, max, 4).map((tick) => (
              <div key={tick}>{tick}</div>
            ))}
          </div>
          <div
            ref={containerRef}
            className="relative min-h-0"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {[0, 1, 2, 3].map((index) => (
              <div
                key={`intraday-grid-${index}`}
                className="absolute inset-x-0 border-t border-dashed border-[#29476e]"
                style={{ top: `${(index / 3) * 100}%` }}
              />
            ))}
            <div className="absolute inset-x-0 top-[58%] border-t border-dashed border-[#ff8a26]" />
            <div className="absolute inset-x-0 bottom-0 top-0">
              <svg
                className="h-full w-full"
                preserveAspectRatio="none"
                viewBox="0 0 680 178"
              >
                <defs>
                  <linearGradient
                    id="intraday-fill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#5ea3ff" stopOpacity="0.24" />
                    <stop
                      offset="100%"
                      stopColor="#5ea3ff"
                      stopOpacity="0.04"
                    />
                  </linearGradient>
                </defs>
                <path d={areaPath} fill="url(#intraday-fill)" />
                <path
                  d={mainPath}
                  fill="none"
                  stroke={chartPalette.blue}
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {overlayPath ? (
                  <path
                    d={overlayPath}
                    fill="none"
                    stroke={chartPalette.amber}
                    strokeWidth="2"
                    strokeDasharray="5 4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : null}
                {ti !== null ? (
                  <line
                    x1={(ti / (intradaySeries.length - 1)) * 680}
                    x2={(ti / (intradaySeries.length - 1)) * 680}
                    y1={0}
                    y2={178}
                    stroke="#5ea3ff"
                    strokeWidth="1"
                    strokeDasharray="4 3"
                    strokeOpacity="0.6"
                  />
                ) : null}
              </svg>
            </div>
            {tooltipState !== null && ti !== null && (
              <ChartTooltip
                clientX={tooltipState.clientX}
                clientY={tooltipState.clientY}
              >
                <div className="mb-1 font-medium text-slate-400">
                  {intradayAllTimeLabels[ti]}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: chartPalette.blue }}
                  />
                  <span className="text-slate-400">R001</span>
                  <span className="ml-1 font-semibold text-slate-100">
                    {intradaySeries[ti].toFixed(3)}%
                  </span>
                </div>
                {overlaySeries && (
                  <div className="flex items-center gap-2">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: chartPalette.amber }}
                    />
                    <span className="text-slate-400">
                      {overlayProductLabel(overlayProduct)}
                    </span>
                    <span className="ml-1 font-semibold text-slate-100">
                      {overlaySeries[ti].toFixed(3)}%
                    </span>
                  </div>
                )}
                {overlaySeries && barValues ? (
                  <div className="mt-1 border-t border-[#1e3352] pt-1 text-slate-400">
                    利差{" "}
                    <span
                      className={`font-semibold ${barValues[ti] >= 0 ? "text-red-400" : "text-emerald-400"}`}
                    >
                      {barValues[ti] > 0 ? "+" : ""}
                      {barValues[ti]}bp
                    </span>
                  </div>
                ) : null}
              </ChartTooltip>
            )}
            <div className="absolute right-2 top-1 flex flex-wrap items-center gap-3 text-[10px] text-slate-300">
              <LegendDot color={chartPalette.blue} label="加权平均(%)" />
              {overlayProduct !== "none" ? (
                <LegendDot
                  color={chartPalette.amber}
                  label={overlayProductLabel(overlayProduct)}
                />
              ) : null}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-[3rem_1fr] pt-2">
          <div />
          <div className="grid grid-cols-8 text-[10px] text-slate-400">
            {intradayTimeLabels.map((label) => (
              <div key={label} className="text-center">
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HistoryClosePanel({
  activeRange,
  overlayProduct,
  compareProduct,
  onRangeChange,
  onCompareChange,
}: {
  activeRange: HistoryRange;
  overlayProduct: OverlayProduct;
  compareProduct: CompareProduct;
  onRangeChange: (range: HistoryRange) => void;
  onCompareChange: (product: CompareProduct) => void;
}) {
  const dataset = historicalCloseDatasets[activeRange];
  const axisLabels = buildAxisTickLabels(
    dataset.labels,
    activeRange === "5d" ? 5 : activeRange === "1m" ? 7 : 8,
  );
  const overlaySeries =
    overlayProduct === "none"
      ? null
      : buildHistoricalSeries(activeRange, overlayProduct);
  const compareSeries =
    compareProduct === "none"
      ? null
      : buildHistoricalSeries(activeRange, compareProduct);
  const spreadValues = compareSeries
    ? dataset.close.map((value, index) =>
        Number(((value - compareSeries[index]) * 100).toFixed(1)),
      )
    : null;
  const min =
    Math.min(
      ...dataset.close,
      ...(overlaySeries ?? []),
      ...(compareSeries ?? []),
    ) - 0.015;
  const max =
    Math.max(
      ...dataset.close,
      ...(overlaySeries ?? []),
      ...(compareSeries ?? []),
    ) + 0.015;
  const volumeMax = Math.max(...dataset.volume);
  const mainPath = buildLinePath(dataset.close, 720, 186, min, max);
  const areaPath = buildAreaPath(dataset.close, 720, 186, min, max);
  const overlayPath = overlaySeries
    ? buildLinePath(overlaySeries, 720, 186, min, max)
    : null;
  const compareLinePath = compareSeries
    ? buildLinePath(compareSeries, 720, 186, min, max)
    : null;
  const { tooltipState, containerRef, handleMouseMove, handleMouseLeave } =
    useChartTooltip(dataset.close.length);
  const ti = tooltipState?.index ?? null;

  return (
    <section className="grid h-full min-h-0 grid-rows-[auto_1fr] overflow-hidden rounded-xl border border-[#284164] bg-[#0b1728]">
      <div className="flex items-center justify-between gap-3 border-b border-[#203551] bg-[#101d32] px-3 py-2">
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold text-slate-100">收盘价走势</div>
          <div className="text-xs text-slate-400">
            产品：
            <span className="ml-1 text-slate-200">R001</span>
          </div>
          <label className="flex items-center gap-1 text-xs text-slate-400">
            <span>对比</span>
            <select
              className="rounded-md border border-[#2a4164] bg-[#0f1b2f] px-1.5 py-0.5 text-xs text-slate-200 outline-none"
              value={compareProduct}
              onChange={(e) =>
                onCompareChange(e.target.value as CompareProduct)
              }
            >
              {compareProductOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex items-center gap-2">
          {historyRangeTabs.map((tab) => (
            <button
              key={tab.id}
              className={auxTabClass(tab.id === activeRange)}
              onClick={() => onRangeChange(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div
        className="grid min-h-0 px-3 pb-2 pt-2"
        style={{
          gridTemplateRows: "68fr 24fr auto",
        }}
      >
        <div className="grid min-h-0 grid-cols-[3.25rem_1fr]">
          <div className="flex flex-col justify-between pr-2 text-right text-[10px] text-slate-400">
            {buildAxisLabels(min, max, 4).map((label) => (
              <div key={label}>{label}</div>
            ))}
          </div>
          <div
            ref={containerRef}
            className="relative min-h-0"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {[0, 1, 2, 3].map((index) => (
              <div
                key={`k-grid-${index}`}
                className="absolute inset-x-0 border-t border-dashed border-[#29476e]"
                style={{ top: `${(index / 3) * 100}%` }}
              />
            ))}
            <svg
              className="absolute inset-0 h-full w-full"
              preserveAspectRatio="none"
              viewBox="0 0 720 186"
            >
              <defs>
                <linearGradient id="history-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5ea3ff" stopOpacity="0.24" />
                  <stop offset="100%" stopColor="#5ea3ff" stopOpacity="0.04" />
                </linearGradient>
              </defs>
              <path d={areaPath} fill="url(#history-fill)" />
              <path
                d={mainPath}
                fill="none"
                stroke={chartPalette.blue}
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {overlayPath ? (
                <path
                  d={overlayPath}
                  fill="none"
                  stroke={chartPalette.amber}
                  strokeWidth="2"
                  strokeDasharray="5 4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}
              {compareLinePath ? (
                <path
                  d={compareLinePath}
                  fill="none"
                  stroke={chartPalette.violet}
                  strokeWidth="2"
                  strokeDasharray="3 3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}
              {ti !== null ? (
                <line
                  x1={(ti / (dataset.close.length - 1)) * 720}
                  x2={(ti / (dataset.close.length - 1)) * 720}
                  y1={0}
                  y2={186}
                  stroke="#5ea3ff"
                  strokeWidth="1"
                  strokeDasharray="4 3"
                  strokeOpacity="0.6"
                />
              ) : null}
            </svg>
            <div className="absolute right-2 top-1 flex flex-wrap items-center gap-3 text-[10px] text-slate-300">
              <LegendDot color={chartPalette.blue} label="收盘价" />
              {overlayProduct !== "none" ? (
                <LegendDot
                  color={chartPalette.amber}
                  label={overlayProductLabel(overlayProduct)}
                />
              ) : null}
              {compareProduct !== "none" ? (
                <LegendDot
                  color={chartPalette.violet}
                  label={
                    compareProductOptions.find((o) => o.id === compareProduct)
                      ?.label ?? ""
                  }
                />
              ) : null}
            </div>
            {tooltipState !== null && ti !== null && (
              <ChartTooltip
                clientX={tooltipState.clientX}
                clientY={tooltipState.clientY}
              >
                <div className="mb-1 font-medium text-slate-400">
                  {dataset.labels[ti]}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: chartPalette.blue }}
                  />
                  <span className="text-slate-400">R001</span>
                  <span className="ml-1 font-semibold text-slate-100">
                    {dataset.close[ti].toFixed(4)}%
                  </span>
                </div>
                {overlaySeries && (
                  <div className="flex items-center gap-2">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: chartPalette.amber }}
                    />
                    <span className="text-slate-400">
                      {overlayProductLabel(overlayProduct)}
                    </span>
                    <span className="ml-1 font-semibold text-slate-100">
                      {overlaySeries[ti].toFixed(4)}%
                    </span>
                  </div>
                )}
                {compareSeries && (
                  <div className="flex items-center gap-2">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: chartPalette.violet }}
                    />
                    <span className="text-slate-400">
                      {compareProductOptions.find(
                        (o) => o.id === compareProduct,
                      )?.label ?? ""}
                    </span>
                    <span className="ml-1 font-semibold text-slate-100">
                      {compareSeries[ti].toFixed(4)}%
                    </span>
                  </div>
                )}
                {spreadValues && (
                  <div className="mt-1 border-t border-[#1e3352] pt-1 text-slate-400">
                    利差{" "}
                    <span
                      className={`font-semibold ${spreadValues[ti] >= 0 ? "text-red-400" : "text-emerald-400"}`}
                    >
                      {spreadValues[ti] > 0 ? "+" : ""}
                      {spreadValues[ti]}bp
                    </span>
                  </div>
                )}
                <div className="mt-1 border-t border-[#1e3352] pt-1 text-slate-400">
                  成交量{" "}
                  <span className="font-semibold text-slate-100">
                    {dataset.volume[ti]}亿
                  </span>
                </div>
              </ChartTooltip>
            )}
          </div>
        </div>
        {compareProduct !== "none" && spreadValues ? (
          <div className="grid min-h-0 grid-cols-[3.25rem_1fr] border-t border-[#1d3250] pt-2 pb-1">
            <div className="flex flex-col justify-between pr-2 text-right text-[10px] text-slate-400">
              {(() => {
                const dMax = Math.max(...spreadValues, 0);
                const dMin = Math.min(...spreadValues, 0);
                const pad = (dMax - dMin) * 0.15 || 1;
                const rTop = dMax + pad;
                const rBot = dMin - pad;
                const rng = rTop - rBot;
                return Array.from({ length: 5 }, (_, i) => {
                  const v = rTop - (rng * i) / 4;
                  return <div key={i}>{v.toFixed(1)}</div>;
                });
              })()}
            </div>
            <div className="relative min-h-0">
              <div className="absolute inset-x-0 top-0 flex items-center gap-[4px] bottom-1">
                {(() => {
                  const dMax = Math.max(...spreadValues, 0);
                  const dMin = Math.min(...spreadValues, 0);
                  const pad = (dMax - dMin) * 0.15 || 1;
                  const rTop = dMax + pad;
                  const rBot = dMin - pad;
                  const rng = rTop - rBot;
                  return spreadValues.map((value, index) => {
                    const isPos = value >= 0;
                    const spaceTop = isPos
                      ? ((rTop - value) / rng) * 100
                      : (rTop / rng) * 100;
                    const barH = (Math.abs(value) / rng) * 100;
                    const spaceBot = isPos
                      ? (-rBot / rng) * 100
                      : ((value - rBot) / rng) * 100;
                    return (
                      <div
                        key={`spread-${index}`}
                        className="flex min-w-0 flex-1 flex-col"
                        style={{ height: "100%" }}
                      >
                        <div style={{ height: `${spaceTop}%` }} />
                        <div
                          className="min-h-0 rounded-[2px]"
                          style={{
                            height: `${barH}%`,
                            backgroundColor: isPos ? "#ef5a6f" : "#2fc3de",
                            opacity: 0.92,
                          }}
                        />
                        <div style={{ height: `${spaceBot}%` }} />
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid min-h-0 grid-cols-[3.25rem_1fr] border-t border-[#1d3250] pt-2 pb-1">
            <div className="flex flex-col justify-between pr-2 text-right text-[10px] text-slate-400">
              {buildCompactVolumeTicks(volumeMax).map((tick) => (
                <div key={tick}>{tick}</div>
              ))}
            </div>
            <div className="relative min-h-0">
              <span className="absolute top-0.5 left-0.5 text-[9px] text-slate-500 z-10 pointer-events-none">
                成交量
              </span>
              <div className="absolute inset-0 flex items-end gap-[4px]">
                {dataset.volume.map((value, index) => (
                  <div
                    key={`history-vol-${index}`}
                    className="min-w-0 flex-1 rounded-t-[2px]"
                    style={{
                      height: `${(value / volumeMax) * 100}%`,
                      backgroundColor: index % 3 === 0 ? "#2fc3de" : "#2f6fd0",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-[3.25rem_1fr] pt-2">
          <div />
          <div
            className="grid text-[10px] text-slate-400"
            style={{
              gridTemplateColumns: `repeat(${dataset.labels.length}, minmax(0, 1fr))`,
            }}
          >
            {axisLabels.map((label, index) => (
              <div
                key={`${dataset.labels[index]}-${index}`}
                className="text-center"
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 矩阵数据（逆回购方 × 正回购方，加权利率 %，null = 无交易）──
const cfetsMatrixRowLabels = ["大型银行", "中小型银行", "其他"] as const;
const cfetsMatrixColLabels = [
  "大型银行",
  "中小型银行",
  "基金公司及产品",
  "其他",
] as const;
const cfetsMatrixRates: (number | null)[][] = [
  [1.2384, 1.2593, null, 1.3076],
  [1.1821, 1.2603, null, 1.3119],
  [1.3067, 1.3067, 1.4071, 1.3384],
];

// ── 机构 × 期限数据（金额单位：百万，显示时换算为亿）──
type CfetsTermRow = {
  term: string;
  buyRate: number | null;
  buyAmt: number | null;
  sellRate: number | null;
  sellAmt: number | null;
  netInflow: number | null;
  sellBalance: number | null;
};
type CfetsInstKey =
  | "大型银行"
  | "中小型银行"
  | "证券公司"
  | "保险公司"
  | "基金公司及产品"
  | "货币市场基金"
  | "理财子公司及理财类产品"
  | "其他";
const cfetsInstLabels: CfetsInstKey[] = [
  "大型银行",
  "中小型银行",
  "证券公司",
  "保险公司",
  "基金公司及产品",
  "货币市场基金",
  "理财子公司及理财类产品",
  "其他",
];
const cfetsInstData: Record<CfetsInstKey, CfetsTermRow[]> = {
  大型银行: [
    {
      term: "R001",
      buyRate: 1.2269,
      buyAmt: 596900.73,
      sellRate: 1.2576,
      sellAmt: 1794867.33,
      netInflow: -330152.08,
      sellBalance: 1794867.33,
    },
    {
      term: "R007",
      buyRate: 1.4302,
      buyAmt: 15500,
      sellRate: 1.4606,
      sellAmt: 52404.88,
      netInflow: 235768.7,
      sellBalance: 2569916.13,
    },
    {
      term: "R014",
      buyRate: 1.45,
      buyAmt: 1000,
      sellRate: 1.4581,
      sellAmt: 3100,
      netInflow: 69473.21,
      sellBalance: 786323.15,
    },
    {
      term: "R021",
      buyRate: null,
      buyAmt: null,
      sellRate: null,
      sellAmt: null,
      netInflow: 1497.6,
      sellBalance: 187785.45,
    },
    {
      term: "R1M",
      buyRate: null,
      buyAmt: null,
      sellRate: 1.68,
      sellAmt: 180,
      netInflow: 16420.13,
      sellBalance: 82666.64,
    },
    {
      term: "R2M",
      buyRate: null,
      buyAmt: null,
      sellRate: null,
      sellAmt: null,
      netInflow: 1000,
      sellBalance: 18788.82,
    },
  ],
  中小型银行: [
    {
      term: "R001",
      buyRate: 1.2509,
      buyAmt: 1078715.08,
      sellRate: 1.2563,
      sellAmt: 454660.22,
      netInflow: 14675.74,
      sellBalance: 454660.22,
    },
    {
      term: "R007",
      buyRate: 1.4284,
      buyAmt: 50123.71,
      sellRate: 1.4226,
      sellAmt: 35404.91,
      netInflow: -147440.66,
      sellBalance: 673011.98,
    },
    {
      term: "R014",
      buyRate: 1.4504,
      buyAmt: 3278,
      sellRate: 1.4168,
      sellAmt: 3278,
      netInflow: -34544.37,
      sellBalance: 419214.42,
    },
    {
      term: "R021",
      buyRate: 1.4271,
      buyAmt: 350,
      sellRate: 1.4271,
      sellAmt: 350,
      netInflow: 402.4,
      sellBalance: 70763.84,
    },
    {
      term: "R1M",
      buyRate: 1.4684,
      buyAmt: 980,
      sellRate: 1.4791,
      sellAmt: 1480,
      netInflow: -2123.5,
      sellBalance: 108500.42,
    },
    {
      term: "R3M",
      buyRate: null,
      buyAmt: null,
      sellRate: 1.68,
      sellAmt: 300,
      netInflow: -300,
      sellBalance: 849.7,
    },
  ],
  证券公司: [
    {
      term: "R001",
      buyRate: 1.2984,
      buyAmt: 72056.66,
      sellRate: null,
      sellAmt: null,
      netInflow: 30407.11,
      sellBalance: null,
    },
    {
      term: "R007",
      buyRate: 1.4194,
      buyAmt: 1400.15,
      sellRate: null,
      sellAmt: null,
      netInflow: -18722.41,
      sellBalance: 71880.95,
    },
    {
      term: "R014",
      buyRate: null,
      buyAmt: null,
      sellRate: null,
      sellAmt: null,
      netInflow: -5560,
      sellBalance: 26977.39,
    },
  ],
  保险公司: [
    {
      term: "R001",
      buyRate: 1.2961,
      buyAmt: 213984.28,
      sellRate: 1.304,
      sellAmt: 77381.77,
      netInflow: 54890.05,
      sellBalance: 77381.77,
    },
    {
      term: "R007",
      buyRate: 1.5186,
      buyAmt: 22338.93,
      sellRate: 1.3379,
      sellAmt: 1763,
      netInflow: -38242.93,
      sellBalance: 324436.44,
    },
    {
      term: "R014",
      buyRate: 1.4,
      buyAmt: 900,
      sellRate: null,
      sellAmt: null,
      netInflow: -22349.84,
      sellBalance: 122083.18,
    },
    {
      term: "R021",
      buyRate: null,
      buyAmt: null,
      sellRate: null,
      sellAmt: null,
      netInflow: -2000,
      sellBalance: 10137.81,
    },
    {
      term: "R1M",
      buyRate: 1.5,
      buyAmt: 500,
      sellRate: null,
      sellAmt: null,
      netInflow: -14000,
      sellBalance: 1901.24,
    },
  ],
  基金公司及产品: [
    {
      term: "R001",
      buyRate: 1.4071,
      buyAmt: 350,
      sellRate: null,
      sellAmt: null,
      netInflow: 2212,
      sellBalance: null,
    },
    {
      term: "R007",
      buyRate: null,
      buyAmt: null,
      sellRate: null,
      sellAmt: null,
      netInflow: 5409,
      sellBalance: 190266.03,
    },
    {
      term: "R014",
      buyRate: null,
      buyAmt: null,
      sellRate: null,
      sellAmt: null,
      netInflow: -166,
      sellBalance: 78201.47,
    },
  ],
  货币市场基金: [
    {
      term: "R001",
      buyRate: null,
      buyAmt: null,
      sellRate: null,
      sellAmt: null,
      netInflow: -3954.94,
      sellBalance: null,
    },
    {
      term: "R007",
      buyRate: null,
      buyAmt: null,
      sellRate: null,
      sellAmt: null,
      netInflow: -1500,
      sellBalance: 558565.45,
    },
    {
      term: "R014",
      buyRate: null,
      buyAmt: null,
      sellRate: null,
      sellAmt: null,
      netInflow: 511,
      sellBalance: 1071531.14,
    },
  ],
  理财子公司及理财类产品: [
    {
      term: "R001",
      buyRate: 1.3088,
      buyAmt: 329386.98,
      sellRate: 1.4665,
      sellAmt: 5617.05,
      netInflow: 181449.19,
      sellBalance: 5617.05,
    },
    {
      term: "R007",
      buyRate: 1.4549,
      buyAmt: 5910.42,
      sellRate: 1.5797,
      sellAmt: 6094.32,
      netInflow: -36067.79,
      sellBalance: 377838.42,
    },
    {
      term: "R014",
      buyRate: 1.4417,
      buyAmt: 1375,
      sellRate: 1.6132,
      sellAmt: 175,
      netInflow: -11263,
      sellBalance: 306395.06,
    },
    {
      term: "R021",
      buyRate: null,
      buyAmt: null,
      sellRate: null,
      sellAmt: null,
      netInflow: 0,
      sellBalance: 27593.06,
    },
    {
      term: "R1M",
      buyRate: null,
      buyAmt: null,
      sellRate: null,
      sellAmt: null,
      netInflow: -246.63,
      sellBalance: 7257.14,
    },
  ],
  其他: [
    {
      term: "R001",
      buyRate: 1.3122,
      buyAmt: 58041.78,
      sellRate: 1.3523,
      sellAmt: 16909.14,
      netInflow: 50472.94,
      sellBalance: 16909.14,
    },
    {
      term: "R007",
      buyRate: 1.5037,
      buyAmt: 2090,
      sellRate: 1.4866,
      sellAmt: 1696.1,
      netInflow: 796.08,
      sellBalance: 632612.62,
    },
    {
      term: "R014",
      buyRate: null,
      buyAmt: null,
      sellRate: null,
      sellAmt: null,
      netInflow: 3899,
      sellBalance: 384370,
    },
    {
      term: "R1M",
      buyRate: 1.68,
      buyAmt: 180,
      sellRate: null,
      sellAmt: null,
      netInflow: 450,
      sellBalance: 46531.46,
    },
    {
      term: "R3M",
      buyRate: 1.68,
      buyAmt: 300,
      sellRate: null,
      sellAmt: null,
      netInflow: 300,
      sellBalance: 8628.78,
    },
  ],
};

// ── 机构 × 债券类型数据（金额单位：百万）──
type CfetsInstPeriod = "R001" | "R007" | "R014" | "R021" | "R1M";
const cfetsInstPeriodLabels: CfetsInstPeriod[] = [
  "R001",
  "R007",
  "R014",
  "R021",
  "R1M",
];
type CfetsBondKey = "利率债" | "信用债" | "同业存单";
type CfetsBondRow = {
  inst: string;
  buyRate: number | null;
  buyAmt: number | null;
  sellRate: number | null;
  sellAmt: number | null;
};
const cfetsBondLabels: CfetsBondKey[] = ["利率债", "信用债", "同业存单"];
const cfetsBondData: Record<CfetsBondKey, CfetsBondRow[]> = {
  利率债: [
    {
      inst: "大型银行",
      buyRate: 1.232,
      buyAmt: 608301.28,
      sellRate: 1.2597,
      sellAmt: 1717212.35,
    },
    {
      inst: "中小型银行",
      buyRate: 1.259,
      buyAmt: 1121054.59,
      sellRate: 1.2486,
      sellAmt: 342364.61,
    },
    {
      inst: "证券公司",
      buyRate: 1.2915,
      buyAmt: 53468.15,
      sellRate: null,
      sellAmt: null,
    },
    {
      inst: "保险公司",
      buyRate: 1.3144,
      buyAmt: 198955.8,
      sellRate: 1.2242,
      sellAmt: 10280.59,
    },
    {
      inst: "理财子公司及理财类产品",
      buyRate: 1.2698,
      buyAmt: 58431.77,
      sellRate: 1.6512,
      sellAmt: 2374.15,
    },
    {
      inst: "其他",
      buyRate: 1.3005,
      buyAmt: 32227.11,
      sellRate: 1.3638,
      sellAmt: 207,
    },
  ],
  信用债: [
    {
      inst: "大型银行",
      buyRate: 1.3019,
      buyAmt: 2099.45,
      sellRate: 1.3461,
      sellAmt: 28564.6,
    },
    {
      inst: "中小型银行",
      buyRate: 1.3248,
      buyAmt: 8790,
      sellRate: 1.3496,
      sellAmt: 32475.21,
    },
    {
      inst: "证券公司",
      buyRate: 1.3292,
      buyAmt: 16055.08,
      sellRate: null,
      sellAmt: null,
    },
    {
      inst: "保险公司",
      buyRate: 1.3378,
      buyAmt: 33301.4,
      sellRate: 1.3565,
      sellAmt: 29535.56,
    },
    {
      inst: "基金公司及产品",
      buyRate: 1.4,
      buyAmt: 208,
      sellRate: null,
      sellAmt: null,
    },
    {
      inst: "理财子公司及理财类产品",
      buyRate: 1.4136,
      buyAmt: 39731.76,
      sellRate: 1.5118,
      sellAmt: 7877.22,
    },
    {
      inst: "其他",
      buyRate: 1.4284,
      buyAmt: 8372.2,
      sellRate: 1.4283,
      sellAmt: 10105.3,
    },
  ],
  同业存单: [
    {
      inst: "大型银行",
      buyRate: 1.27,
      buyAmt: 3000,
      sellRate: 1.3064,
      sellAmt: 104775.26,
    },
    {
      inst: "中小型银行",
      buyRate: 1.2755,
      buyAmt: 3602.2,
      sellRate: 1.3104,
      sellAmt: 120633.3,
    },
    {
      inst: "证券公司",
      buyRate: 1.3109,
      buyAmt: 3933.58,
      sellRate: null,
      sellAmt: null,
    },
    {
      inst: "保险公司",
      buyRate: 1.3203,
      buyAmt: 5466,
      sellRate: 1.287,
      sellAmt: 39328.63,
    },
    {
      inst: "基金公司及产品",
      buyRate: 1.4176,
      buyAmt: 142,
      sellRate: null,
      sellAmt: null,
    },
    {
      inst: "理财子公司及理财类产品",
      buyRate: 1.3053,
      buyAmt: 238508.87,
      sellRate: 1.4175,
      sellAmt: 1635,
    },
    {
      inst: "其他",
      buyRate: 1.3114,
      buyAmt: 20012.47,
      sellRate: 1.2868,
      sellAmt: 8292.94,
    },
  ],
};

function fmtAmt(百万: number | null): string {
  if (百万 === null) return "—";
  return (百万 / 100).toFixed(1) + "亿";
}
function fmtRate(rate: number | null): string {
  if (rate === null) return "—";
  return rate.toFixed(4) + "%";
}
function fmtNetInflow(百万: number | null): string {
  if (百万 === null) return "—";
  const v = (百万 / 100).toFixed(1);
  return 百万 >= 0 ? "+" + v + "亿" : v + "亿";
}

// ── 指标定义 ──────────────────────────────────────────────
const cfetsMetricDefs: {
  key: CfetsMetricKey;
  label: string;
  desc: string;
  chartType: "line" | "stackedBar" | "divergeBar";
}[] = [
  {
    key: "buyRate",
    label: "正回购利率",
    desc: "以债券质押融入资金的加权利率，利率越高说明融资成本越贵",
    chartType: "line",
  },
  {
    key: "sellRate",
    label: "逆回购利率",
    desc: "以债券质押融出资金的加权利率，利率越高说明融出资金收益越高",
    chartType: "line",
  },
  {
    key: "buyAmt",
    label: "正回购金额",
    desc: "各机构当日质押式融入资金规模（亿元），反映融资需求强度",
    chartType: "stackedBar",
  },
  {
    key: "sellAmt",
    label: "逆回购金额",
    desc: "各机构当日质押式融出资金规模（亿元），反映市场流动性供给",
    chartType: "stackedBar",
  },
  {
    key: "netInflow",
    label: "机构资金结构",
    desc: "各机构质押式回购融入融出结构，堆叠柱展示每日各机构分布（亿元）",
    chartType: "divergeBar",
  },
];

const cfetsBondMetricDefs = cfetsMetricDefs.filter(
  (d) => d.key !== "netInflow",
);

// ── 趋势数据生成 ──────────────────────────────────────────
function generateTradingDates(endDate: string, count: number): string[] {
  const [y, m, d] = endDate.split("-").map(Number);
  const end = new Date(y, m - 1, d);
  const dates: string[] = [];
  let cur = new Date(end);
  while (dates.length < count) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) {
      dates.unshift(
        `${cur.getMonth() + 1}/${String(cur.getDate()).padStart(2, "0")}`,
      );
    }
    cur.setDate(cur.getDate() - 1);
  }
  return dates;
}

function randomWalk(
  anchor: number,
  count: number,
  dailyVol: number,
  _seed: number,
): number[] {
  const result: number[] = new Array(count);
  result[count - 1] = anchor;
  for (let i = count - 2; i >= 0; i--) {
    // 离散跳跃：40% 小幅 + 38% 中等 + 22% 大幅，强随机锯齿
    const r = Math.random();
    let jump: number;
    if (r < 0.4) {
      jump = (Math.random() - 0.5) * dailyVol * 1.5;
    } else if (r < 0.78) {
      jump = (Math.random() - 0.5) * dailyVol * 7;
    } else {
      jump = (Math.random() - 0.5) * dailyVol * 18;
    }
    result[i] = Math.max(0, Number((result[i + 1] + jump).toFixed(4)));
  }
  return result;
}

const cfetsTrendCounts: Record<FundStructureRange, number> = {
  "14d": 14,
  "1m": 22,
  "6m": 130,
};

// 机构图例顺序：大行/股份行/理财/理财子/券商/基金/保险
// 锚点取自 2026-01-04 真实数据，顺序对应 fundStructureLegendItems
const cfetsInstAnchors: Record<
  CfetsInstPeriod,
  Record<CfetsMetricKey, number[]>
> = {
  R001: {
    buyRate: [1.201, 1.225, 1.283, 1.283, 1.273, 1.382, 1.271],
    sellRate: [
      1.232,
      1.231,
      1.441,
      1.441,
      null as unknown as number,
      null as unknown as number,
      1.279,
    ],
    buyAmt: [4500, 8500, 2500, 2500, 550, 3, 1600],
    sellAmt: [14000, 3500, 40, 40, 0, 0, 600],
    netInflow: [-2600, 110, 1400, 1400, 230, 60, 420],
  },
  R007: {
    buyRate: [1.245, 1.269, 1.327, 1.327, 1.317, 1.426, 1.315],
    sellRate: [
      1.276,
      1.275,
      1.485,
      1.485,
      null as unknown as number,
      null as unknown as number,
      1.323,
    ],
    buyAmt: [1200, 1900, 680, 680, 145, 1, 440],
    sellAmt: [3200, 880, 13, 13, 0, 0, 140],
    netInflow: [-570, 30, 350, 350, 60, 12, 105],
  },
  R014: {
    buyRate: [1.268, 1.292, 1.351, 1.351, 1.342, 1.451, 1.338],
    sellRate: [
      1.301,
      1.3,
      1.511,
      1.511,
      null as unknown as number,
      null as unknown as number,
      1.348,
    ],
    buyAmt: [220, 320, 95, 95, 22, 0, 85],
    sellAmt: [620, 140, 2, 2, 0, 0, 28],
    netInflow: [-108, 4, 55, 55, 12, 3, 20],
  },
  R021: {
    buyRate: [1.292, 1.317, 1.376, 1.376, 1.368, 1.478, 1.363],
    sellRate: [
      1.327,
      1.326,
      1.538,
      1.538,
      null as unknown as number,
      null as unknown as number,
      1.374,
    ],
    buyAmt: [42, 62, 18, 18, 4, 0, 15],
    sellAmt: [125, 26, 0.5, 0.5, 0, 0, 6],
    netInflow: [-22, 1, 10, 10, 2, 0.5, 4],
  },
  R1M: {
    buyRate: [1.315, 1.341, 1.402, 1.402, 1.395, 1.506, 1.389],
    sellRate: [
      1.354,
      1.353,
      1.566,
      1.566,
      null as unknown as number,
      null as unknown as number,
      1.401,
    ],
    buyAmt: [5, 7, 1, 1, 0.5, 0, 2],
    sellAmt: [4, 1, 0.1, 0.1, 0, 0, 0.2],
    netInflow: [-1, 0.2, 0.5, 0.5, 0.1, 0.05, 0.5],
  },
};

function buildInstTrendBlock(
  period: CfetsInstPeriod,
  metricKey: CfetsMetricKey,
  range: FundStructureRange,
): CfetsTrendBlock {
  const count = cfetsTrendCounts[range];
  const dates = generateTradingDates("2026-01-04", count);
  const anchors = cfetsInstAnchors[period][metricKey];
  const isRate = metricKey === "buyRate" || metricKey === "sellRate";
  const vol = isRate ? 0.04 : metricKey === "netInflow" ? 800 : 2000;
  const series = anchors.map((anchor, i) => {
    const base = anchor ?? 0;
    return randomWalk(base, count, vol, (i + 1) * 7 + metricKey.length);
  });
  return { dates, series };
}

const cfetsInstTrend: Record<
  CfetsInstPeriod,
  Record<CfetsMetricKey, Record<FundStructureRange, CfetsTrendBlock>>
> = Object.fromEntries(
  cfetsInstPeriodLabels.map((period) => [
    period,
    Object.fromEntries(
      (
        [
          "buyRate",
          "sellRate",
          "buyAmt",
          "sellAmt",
          "netInflow",
        ] as CfetsMetricKey[]
      ).map((mk) => [
        mk,
        Object.fromEntries(
          (["14d", "1m", "6m"] as FundStructureRange[]).map((r) => [
            r,
            buildInstTrendBlock(period, mk, r),
          ]),
        ),
      ]),
    ),
  ]),
) as Record<
  CfetsInstPeriod,
  Record<CfetsMetricKey, Record<FundStructureRange, CfetsTrendBlock>>
>;

// 债券趋势锚点：[大行, 股份行, 理财, 理财子, 券商, 基金, 保险]
const cfetsBondAnchors: Record<
  CfetsBondKey,
  Record<Exclude<CfetsMetricKey, "netInflow">, number[]>
> = {
  利率债: {
    buyRate: [
      1.232,
      1.259,
      1.27,
      1.27,
      1.292,
      null as unknown as number,
      1.314,
    ],
    sellRate: [
      1.26,
      1.249,
      1.651,
      1.651,
      null as unknown as number,
      null as unknown as number,
      1.224,
    ],
    buyAmt: [6083, 11211, 584, 584, 535, 0, 1990],
    sellAmt: [17172, 3424, 24, 24, 0, 0, 103],
  },
  信用债: {
    buyRate: [1.302, 1.325, 1.414, 1.414, 1.329, 1.4, 1.338],
    sellRate: [
      1.346,
      1.35,
      1.512,
      1.512,
      null as unknown as number,
      null as unknown as number,
      1.357,
    ],
    buyAmt: [21, 88, 397, 397, 161, 2, 333],
    sellAmt: [286, 325, 79, 79, 0, 0, 295],
  },
  同业存单: {
    buyRate: [1.27, 1.276, 1.305, 1.305, 1.311, 1.418, 1.32],
    sellRate: [
      1.306,
      1.31,
      1.418,
      1.418,
      null as unknown as number,
      null as unknown as number,
      1.287,
    ],
    buyAmt: [30, 36, 2385, 2385, 39, 1, 55],
    sellAmt: [1048, 1206, 16, 16, 0, 0, 393],
  },
};

function buildBondTrendBlock(
  bondKey: CfetsBondKey,
  metricKey: Exclude<CfetsMetricKey, "netInflow">,
  range: FundStructureRange,
): CfetsTrendBlock {
  const count = cfetsTrendCounts[range];
  const dates = generateTradingDates("2026-01-04", count);
  const anchors = cfetsBondAnchors[bondKey][metricKey];
  const isRate = metricKey === "buyRate" || metricKey === "sellRate";
  const vol = isRate ? 0.035 : 1400;
  const series = anchors.map((anchor, i) => {
    const base = anchor ?? 0;
    return randomWalk(base, count, vol, (i + 3) * 11 + bondKey.length);
  });
  return { dates, series };
}

const cfetsBondTrend: Record<
  CfetsBondKey,
  Record<
    Exclude<CfetsMetricKey, "netInflow">,
    Record<FundStructureRange, CfetsTrendBlock>
  >
> = Object.fromEntries(
  (["利率债", "信用债", "同业存单"] as CfetsBondKey[]).map((bk) => [
    bk,
    Object.fromEntries(
      (
        ["buyRate", "sellRate", "buyAmt", "sellAmt"] as Exclude<
          CfetsMetricKey,
          "netInflow"
        >[]
      ).map((mk) => [
        mk,
        Object.fromEntries(
          (["14d", "1m", "6m"] as FundStructureRange[]).map((r) => [
            r,
            buildBondTrendBlock(bk, mk, r),
          ]),
        ),
      ]),
    ),
  ]),
) as Record<
  CfetsBondKey,
  Record<
    Exclude<CfetsMetricKey, "netInflow">,
    Record<FundStructureRange, CfetsTrendBlock>
  >
>;

function CfetsDailyPanel() {
  return (
    <div className="h-full min-h-0 overflow-hidden">
      <div className="overflow-hidden rounded-lg border border-[#1c2f49] bg-[#0d1726]">
        <table className="min-w-full text-xs">
          <thead className="bg-[#101d32] text-slate-400">
            <tr>
              {["日期", "公开市场操作", "净投放", "MLF", "关注点"].map(
                (column) => (
                  <th key={column} className="px-3 py-2 text-left font-medium">
                    {column}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {[
              ["2026-04-22", "逆回购 7D", "+40亿", "--", "短端偏稳"],
              ["2026-04-21", "逆回购到期", "-10亿", "--", "大行融出维持"],
              ["2026-04-20", "逆回购 7D", "+5亿", "--", "非银需求回升"],
              ["2026-04-17", "逆回购 7D", "+1985亿", "--", "月内跨季预期升温"],
            ].map((row) => (
              <tr
                key={row[0]}
                className="border-t border-[#162439] text-slate-300"
              >
                {row.map((cell, index) => (
                  <td key={`${row[0]}-${index}`} className="px-3 py-2">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── 矩阵面板 ───────────────────────────────────────────────
function CfetsMatrixPanel({
  includeDaily = false,
}: {
  includeDaily?: boolean;
}) {
  const [modal, setModal] = useState<{
    rowLabel: string;
    colLabel: string;
    rate: number;
  } | null>(null);

  const allRates = cfetsMatrixRates
    .flat()
    .filter((v): v is number => v !== null);
  const minRate = Math.min(...allRates);
  const maxRate = Math.max(...allRates);

  function rateColor(rate: number): string {
    const t = (rate - minRate) / (maxRate - minRate || 1);
    const r = Math.round(26 + t * (180 - 26));
    const g = Math.round(61 + t * (92 - 61));
    const b = Math.round(94 + t * (14 - 94));
    return `rgb(${r},${g},${b})`;
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden p-1">
      <div className="shrink-0 space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-slate-500">
                  逆\正
                </th>
                {cfetsMatrixColLabels.map((col) => (
                  <th
                    key={col}
                    className="px-2 py-1.5 text-center text-[10px] font-medium text-slate-400"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cfetsMatrixRowLabels.map((row, ri) => (
                <tr key={row}>
                  <td className="py-1.5 pr-3 text-[11px] font-medium text-slate-300">
                    {row}
                  </td>
                  {cfetsMatrixColLabels.map((col, ci) => {
                    const rate = cfetsMatrixRates[ri][ci];
                    return (
                      <td key={col} className="px-1 py-1">
                        {rate === null ? (
                          <div className="flex h-8 w-full items-center justify-center rounded text-[10px] text-slate-600 bg-[#0a1322]">
                            —
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="flex h-8 w-full cursor-pointer items-center justify-center rounded text-[11px] font-semibold text-white transition-opacity hover:opacity-80"
                            style={{ backgroundColor: rateColor(rate) }}
                            onClick={() =>
                              setModal({ rowLabel: row, colLabel: col, rate })
                            }
                          >
                            {rate.toFixed(4)}
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <span>低利率</span>
          <div
            className="h-2 w-24 rounded"
            style={{
              background: `linear-gradient(to right, ${rateColor(minRate)}, ${rateColor(maxRate)})`,
            }}
          />
          <span>高利率</span>
        </div>
      </div>

      {modal && (
        <div
          className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50"
          onClick={() => setModal(null)}
        >
          <div
            className="w-80 rounded-xl border border-[#1d3250] bg-[#0a1322] p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-200">
                  {modal.rowLabel} → {modal.colLabel}
                </div>
                <div className="mt-0.5 text-[10px] text-slate-500">
                  逆回购方 → 正回购方，加权利率
                </div>
              </div>
              <button
                type="button"
                className="text-slate-500 hover:text-slate-300"
                onClick={() => setModal(null)}
              >
                ✕
              </button>
            </div>
            <div className="mb-3 rounded-lg bg-[#0e1827] px-3 py-2 text-center">
              <span className="text-xl font-semibold text-amber-300">
                {modal.rate.toFixed(4)}%
              </span>
            </div>
            <div className="text-[10px] text-slate-500">
              正回购方（{modal.colLabel}）期限明细：
            </div>
            <table className="mt-1.5 w-full text-[11px]">
              <thead>
                <tr className="text-slate-500">
                  <th className="py-1 text-left font-normal">期限</th>
                  <th className="py-1 text-right font-normal">正回购利率</th>
                  <th className="py-1 text-right font-normal">正回购额</th>
                </tr>
              </thead>
              <tbody>
                {(cfetsInstData[modal.colLabel as CfetsInstKey] ?? [])
                  .filter((r) => r.buyRate !== null)
                  .map((r) => (
                    <tr
                      key={r.term}
                      className="border-t border-[#162439] text-slate-300"
                    >
                      <td className="py-1">{r.term}</td>
                      <td className="py-1 text-right">{fmtRate(r.buyRate)}</td>
                      <td className="py-1 text-right">{fmtAmt(r.buyAmt)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {includeDaily && (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="overflow-hidden rounded-lg border border-[#1c2f49] bg-[#0d1726]">
            <table className="min-w-full text-xs">
              <thead className="bg-[#101d32] text-slate-400">
                <tr>
                  {["日期", "公开市场操作", "净投放", "MLF", "关注点"].map(
                    (column) => (
                      <th
                        key={column}
                        className="px-3 py-2 text-left font-medium"
                      >
                        {column}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {[
                  ["2026-04-22", "逆回购 7D", "+40亿", "--", "短端偏稳"],
                  ["2026-04-21", "逆回购到期", "-10亿", "--", "大行融出维持"],
                  ["2026-04-20", "逆回购 7D", "+5亿", "--", "非银需求回升"],
                  [
                    "2026-04-17",
                    "逆回购 7D",
                    "+1985亿",
                    "--",
                    "月内跨季预期升温",
                  ],
                ].map((row) => (
                  <tr
                    key={row[0]}
                    className="border-t border-[#162439] text-slate-300"
                  >
                    {row.map((cell, index) => (
                      <td key={`${row[0]}-${index}`} className="px-3 py-2">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 通用多系列图表 ──────────────────────────────────────────
const instColors = fundStructureLegendItems.map(
  (i) => i.color,
) as readonly string[];

function MultiSeriesChart({
  block,
  chartType,
  unitLabel = "",
}: {
  block: CfetsTrendBlock;
  chartType: "line" | "stackedBar" | "divergeBar";
  unitLabel?: string;
}) {
  const { dates, series } = block;
  const { tooltipState, containerRef, handleMouseMove, handleMouseLeave } =
    useChartTooltip(dates.length);
  const VW = 480;
  const VH = 100;
  const xStep = Math.max(1, Math.ceil(dates.length / 6));
  const xLabels = dates.filter(
    (_, i) => i % xStep === 0 || i === dates.length - 1,
  );

  if (chartType === "line") {
    const flat = series.flat().filter((v) => v > 0);
    const rawMin = Math.min(...flat);
    const rawMax = Math.max(...flat);
    const pad = (rawMax - rawMin) * 0.12 || 0.02;
    const min = Math.max(0, rawMin - pad);
    const max = rawMax + pad;
    const yTicks = Array.from({ length: 4 }, (_, i) =>
      Number((max - ((max - min) * i) / 3).toFixed(4)).toString(),
    );
    const crossX =
      tooltipState != null
        ? (tooltipState.index / (dates.length - 1)) * VW
        : null;
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-1">
        <div className="grid min-h-0 flex-1 grid-cols-[2.8rem_1fr]">
          <div className="flex flex-col justify-between py-1 pr-1 text-right text-[10px] text-slate-500">
            {yTicks.map((t) => (
              <div key={t}>{t}</div>
            ))}
          </div>
          <div
            ref={containerRef}
            className="relative min-h-0 cursor-crosshair overflow-hidden rounded border border-dashed border-[#2a4164]"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <svg
              viewBox={`0 0 ${VW} ${VH}`}
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full"
            >
              {[0, 1, 2, 3].map((gi) => (
                <line
                  key={gi}
                  x1="0"
                  x2={VW}
                  y1={(gi / 3) * VH}
                  y2={(gi / 3) * VH}
                  stroke="#1d3250"
                  strokeWidth="0.5"
                />
              ))}
              {series.map((vals, si) =>
                Math.min(...vals) > 0 ? (
                  <path
                    key={si}
                    d={buildLinePath(vals, VW, VH, min, max)}
                    fill="none"
                    stroke={instColors[si]}
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.9}
                  />
                ) : null,
              )}
              {crossX != null && (
                <line
                  x1={crossX}
                  x2={crossX}
                  y1="0"
                  y2={VH}
                  stroke="#4a7ab5"
                  strokeWidth="0.7"
                  strokeDasharray="3 2"
                />
              )}
            </svg>
            {tooltipState &&
              series.map((vals, si) =>
                Math.min(...vals) > 0 ? (
                  <div
                    key={si}
                    className="pointer-events-none absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#0a1322]"
                    style={{
                      left: `${(tooltipState.index / (dates.length - 1)) * 100}%`,
                      top: `${((max - vals[tooltipState.index]) / (max - min)) * 100}%`,
                      backgroundColor: instColors[si],
                    }}
                  />
                ) : null,
              )}
          </div>
        </div>
        <div className="grid grid-cols-[2.8rem_1fr]">
          <div />
          <div className="relative h-4">
            {xLabels.map((label) => (
              <span
                key={label}
                className="absolute -translate-x-1/2 text-[9px] text-slate-600"
                style={{
                  left: `${(dates.indexOf(label) / (dates.length - 1)) * 100}%`,
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
        {tooltipState && (
          <ChartTooltip
            clientX={tooltipState.clientX}
            clientY={tooltipState.clientY}
          >
            <div className="mb-1 text-[11px] font-semibold text-slate-300">
              {dates[tooltipState.index]}
            </div>
            {series.map((vals, si) =>
              vals[0] > 0 ? (
                <div
                  key={si}
                  className="flex items-center gap-2 py-0.5 text-[11px]"
                >
                  <span
                    className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: instColors[si] }}
                  />
                  <span className="text-slate-400">
                    {fundStructureLegendItems[si].label}
                  </span>
                  <span className="ml-auto pl-3 font-semibold text-slate-200">
                    {vals[tooltipState.index].toFixed(4)}
                    {unitLabel}
                  </span>
                </div>
              ) : null,
            )}
          </ChartTooltip>
        )}
      </div>
    );
  }

  if (chartType === "stackedBar") {
    const dailyTotals = dates.map((_, di) =>
      series.reduce((s, vals) => s + (vals[di] ?? 0), 0),
    );
    const maxTotal = Math.max(...dailyTotals, 1);
    const yTicks = Array.from({ length: 3 }, (_, i) =>
      Math.round((maxTotal * (3 - i)) / 3),
    );
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-1">
        <div className="grid min-h-0 flex-1 grid-cols-[2.8rem_1fr]">
          <div className="flex flex-col justify-between py-1 pr-1 text-right text-[10px] text-slate-500">
            {[...yTicks, 0].map((t) => (
              <div key={t}>{t}</div>
            ))}
          </div>
          <div
            ref={containerRef}
            className="relative min-h-0 cursor-crosshair overflow-hidden rounded border border-dashed border-[#2a4164]"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="absolute inset-x-0 border-t border-dashed border-[#29476e]"
                style={{ top: `${(i / 3) * 100}%` }}
              />
            ))}
            <div className="absolute inset-x-1 bottom-1 top-1 flex items-end gap-[2px]">
              {dates.map((_, di) => {
                const total = dailyTotals[di];
                return (
                  <div
                    key={di}
                    className="flex min-w-0 flex-1 flex-col justify-end overflow-hidden rounded-t-[2px]"
                    style={{ height: `${(total / maxTotal) * 100}%` }}
                  >
                    {series.map((vals, si) => {
                      const pct = total > 0 ? (vals[di] / total) * 100 : 0;
                      return pct > 0 ? (
                        <div
                          key={si}
                          style={{
                            height: `${pct}%`,
                            backgroundColor: instColors[si],
                            opacity: 0.85,
                          }}
                        />
                      ) : null;
                    })}
                  </div>
                );
              })}
            </div>
            {tooltipState && (
              <div
                className="pointer-events-none absolute inset-y-0 w-px bg-[#4a7ab5]/60"
                style={{
                  left: `${(tooltipState.index / (dates.length - 1)) * 100}%`,
                }}
              />
            )}
          </div>
        </div>
        <div className="grid grid-cols-[2.8rem_1fr]">
          <div />
          <div className="relative h-4">
            {xLabels.map((label) => (
              <span
                key={label}
                className="absolute -translate-x-1/2 text-[9px] text-slate-600"
                style={{
                  left: `${(dates.indexOf(label) / (dates.length - 1)) * 100}%`,
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
        {tooltipState && (
          <ChartTooltip
            clientX={tooltipState.clientX}
            clientY={tooltipState.clientY}
          >
            <div className="mb-1 text-[11px] font-semibold text-slate-300">
              {dates[tooltipState.index]}
            </div>
            {series.map((vals, si) =>
              vals[tooltipState.index] > 0 ? (
                <div
                  key={si}
                  className="flex items-center gap-2 py-0.5 text-[11px]"
                >
                  <span
                    className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: instColors[si] }}
                  />
                  <span className="text-slate-400">
                    {fundStructureLegendItems[si].label}
                  </span>
                  <span className="ml-auto pl-3 font-semibold text-slate-200">
                    {vals[tooltipState.index].toFixed(0)}亿
                  </span>
                </div>
              ) : null,
            )}
          </ChartTooltip>
        )}
      </div>
    );
  }

  // divergeBar（净融入）—— 仅取 series[0]（全市场合计）
  const netVals = series[0];
  const absMax = Math.max(
    Math.abs(Math.min(...netVals)),
    Math.abs(Math.max(...netVals)),
    1,
  );
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1">
      <div className="grid min-h-0 flex-1 grid-cols-[2.8rem_1fr]">
        <div className="flex flex-col justify-between py-1 pr-1 text-right text-[10px] text-slate-500">
          {[
            absMax,
            Math.round(absMax / 2),
            0,
            -Math.round(absMax / 2),
            -absMax,
          ].map((t) => (
            <div key={t}>{t > 0 ? `+${t}` : t}</div>
          ))}
        </div>
        <div
          ref={containerRef}
          className="relative min-h-0 cursor-crosshair overflow-hidden rounded border border-dashed border-[#2a4164]"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div className="absolute inset-x-0 top-1/2 border-t border-[#3a5a80]" />
          <div className="absolute inset-x-1 bottom-1 top-1 flex items-center gap-[2px]">
            {netVals.map((val, di) => {
              const isPos = val >= 0;
              const pct = (Math.abs(val) / absMax) * 47;
              return (
                <div
                  key={di}
                  className="flex min-w-0 flex-1 flex-col"
                  style={{ height: "100%" }}
                >
                  {isPos ? (
                    <>
                      <div style={{ flex: 1 }} />
                      <div
                        className="rounded-t-[2px]"
                        style={{
                          height: `${pct}%`,
                          backgroundColor: "#ef5a6f",
                          opacity: 0.85,
                        }}
                      />
                      <div style={{ height: "50%" }} />
                    </>
                  ) : (
                    <>
                      <div style={{ height: "50%" }} />
                      <div
                        className="rounded-b-[2px]"
                        style={{
                          height: `${pct}%`,
                          backgroundColor: "#2fc3de",
                          opacity: 0.85,
                        }}
                      />
                      <div style={{ flex: 1 }} />
                    </>
                  )}
                </div>
              );
            })}
          </div>
          {tooltipState && (
            <div
              className="pointer-events-none absolute inset-y-0 w-px bg-[#4a7ab5]/60"
              style={{
                left: `${(tooltipState.index / (dates.length - 1)) * 100}%`,
              }}
            />
          )}
        </div>
      </div>
      <div className="grid grid-cols-[2.8rem_1fr]">
        <div />
        <div className="relative h-4">
          {xLabels.map((label) => (
            <span
              key={label}
              className="absolute -translate-x-1/2 text-[9px] text-slate-600"
              style={{
                left: `${(dates.indexOf(label) / (dates.length - 1)) * 100}%`,
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
      {tooltipState && (
        <ChartTooltip
          clientX={tooltipState.clientX}
          clientY={tooltipState.clientY}
        >
          <div className="mb-1 text-[11px] font-semibold text-slate-300">
            {dates[tooltipState.index]}
          </div>
          <div className="text-[11px] text-slate-400">
            净融入{" "}
            <span
              className={`font-semibold ${netVals[tooltipState.index] >= 0 ? "text-red-400" : "text-emerald-400"}`}
            >
              {netVals[tooltipState.index] >= 0 ? "+" : ""}
              {netVals[tooltipState.index].toFixed(0)}亿
            </span>
          </div>
        </ChartTooltip>
      )}
    </div>
  );
}

// ─── 机构面板 ───────────────────────────────────────────────
function CfetsInstPanel() {
  const [period, setPeriod] = useState<CfetsInstPeriod>("R001");
  const [range, setRange] = useState<FundStructureRange>("14d");
  const [metricKey, setMetricKey] = useState<CfetsMetricKey>("buyRate");
  const metricDef = cfetsMetricDefs.find((d) => d.key === metricKey)!;
  const block =
    metricKey !== "netInflow"
      ? cfetsInstTrend[period][metricKey][range]
      : null!;

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      {/* 控件行 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {cfetsInstPeriodLabels.map((pt) => (
              <button
                key={pt}
                type="button"
                className={`rounded-md px-2 py-1 text-[11px] transition-colors ${
                  period === pt
                    ? "bg-[#1f3d6b] font-semibold text-slate-100"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                onClick={() => setPeriod(pt)}
              >
                {pt}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 text-[11px] text-slate-400 ml-2">
            {fundStructureLegendItems.map((item) => (
              <LegendDot
                key={item.label}
                color={item.color}
                label={item.label}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="rounded border border-[#253754] bg-[#0e1827] px-2 py-1 text-[11px] text-slate-200 focus:outline-none"
            value={metricKey}
            onChange={(e) => setMetricKey(e.target.value as CfetsMetricKey)}
          >
            {cfetsMetricDefs.map((d) => (
              <option key={d.key} value={d.key}>
                {d.label}
              </option>
            ))}
          </select>
          <div className="flex gap-1">
            {fundStructureRangeTabs.map((t) => (
              <button
                key={t.id}
                type="button"
                className={auxTabClass(t.id === range)}
                onClick={() => setRange(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* 图表 */}
      {metricKey === "netInflow" ? (
        <div className="min-h-0 flex-1">
          <FundStructureBars range={range} />
        </div>
      ) : (
        <MultiSeriesChart
          block={block}
          chartType={metricDef.chartType}
          unitLabel={metricDef.chartType === "line" ? "%" : ""}
        />
      )}
      {/* 说明 */}
      <div className="text-[10px] text-slate-500">{metricDef.desc}</div>
    </div>
  );
}

// ─── 债券面板 ───────────────────────────────────────────────
function CfetsBondPanel() {
  const [bondType, setBondType] = useState<CfetsBondKey>("利率债");
  const [range, setRange] = useState<FundStructureRange>("14d");
  const [metricKey, setMetricKey] =
    useState<Exclude<CfetsMetricKey, "netInflow">>("buyRate");
  const metricDef = cfetsBondMetricDefs.find((d) => d.key === metricKey)!;
  const block = cfetsBondTrend[bondType][metricKey][range];

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      {/* 控件行 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {cfetsBondLabels.map((bt) => (
            <button
              key={bt}
              type="button"
              className={`rounded-md px-2.5 py-1 text-[11px] transition-colors ${
                bondType === bt
                  ? "bg-[#1f3d6b] font-semibold text-slate-100"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              onClick={() => setBondType(bt)}
            >
              {bt}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select
            className="rounded border border-[#253754] bg-[#0e1827] px-2 py-1 text-[11px] text-slate-200 focus:outline-none"
            value={metricKey}
            onChange={(e) =>
              setMetricKey(
                e.target.value as Exclude<CfetsMetricKey, "netInflow">,
              )
            }
          >
            {cfetsBondMetricDefs.map((d) => (
              <option key={d.key} value={d.key}>
                {d.label}
              </option>
            ))}
          </select>
          <div className="flex gap-1">
            {fundStructureRangeTabs.map((t) => (
              <button
                key={t.id}
                type="button"
                className={auxTabClass(t.id === range)}
                onClick={() => setRange(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* 图例 */}
      <div className="flex flex-wrap gap-3 text-[11px] text-slate-400">
        {fundStructureLegendItems.map((item) => (
          <LegendDot key={item.label} color={item.color} label={item.label} />
        ))}
      </div>
      {/* 图表 */}
      <MultiSeriesChart
        block={block}
        chartType={metricDef.chartType}
        unitLabel={metricDef.chartType === "line" ? "%" : ""}
      />
      {/* 说明 */}
      <div className="text-[10px] text-slate-500">{metricDef.desc}</div>
    </div>
  );
}

function NcdTrendPanel({ compact = false }: { compact?: boolean }) {
  const allSeries = [ncdTrendSeries, ncdThreeMonthSeries, ncdOneYearSeries];
  const min = Math.min(...allSeries.flat()) - 0.02;
  const max = Math.max(...allSeries.flat()) + 0.02;
  const width = compact ? 520 : 720;
  const height = compact ? 120 : 180;
  const oneMonthPath = buildLinePath(ncdTrendSeries, width, height, min, max);
  const threeMonthPath = buildLinePath(
    ncdThreeMonthSeries,
    width,
    height,
    min,
    max,
  );
  const oneYearPath = buildLinePath(ncdOneYearSeries, width, height, min, max);
  const area = buildAreaPath(ncdTrendSeries, width, height, min, max);
  const labels = compact ? compactAuxChartLabels : auxChartLabels;
  const { tooltipState, containerRef, handleMouseMove, handleMouseLeave } =
    useChartTooltip(ncdTrendSeries.length);
  const ti = tooltipState?.index ?? null;

  const yTicks = Array.from({ length: 4 }, (_, i) =>
    Number((max - ((max - min) * i) / 3).toFixed(3)).toString(),
  );

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_1fr_auto] gap-2 overflow-hidden rounded-lg border border-[#1c2f49] bg-[#0d1726] p-2">
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex flex-wrap items-center gap-3">
          <LegendDot color={chartPalette.blue} label="1M" />
          <LegendDot color={chartPalette.emerald} label="3M" />
          <LegendDot color={chartPalette.amber} label="1Y" />
        </div>
        <span>近14天</span>
      </div>
      <div className="grid min-h-0 grid-cols-[2.8rem_1fr] gap-1">
        <div className="flex flex-col justify-between py-1 pr-1 text-right text-[10px] text-slate-500">
          {yTicks.map((t) => (
            <div key={t}>{t}%</div>
          ))}
        </div>
        <div
          ref={containerRef}
          className="relative min-h-0 overflow-hidden rounded-md border border-dashed border-[#2f456b]"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {[0, 1, 2, 3].map((index) => (
            <div
              key={`ncd-grid-${index}`}
              className="absolute inset-x-0 border-t border-dashed border-[#29476e]"
              style={{ top: `${(index / 3) * 100}%` }}
            />
          ))}
          <svg
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="none"
            viewBox={`0 0 ${width} ${height}`}
          >
            <defs>
              <linearGradient id="ncd-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5ea3ff" stopOpacity="0.24" />
                <stop offset="100%" stopColor="#5ea3ff" stopOpacity="0.04" />
              </linearGradient>
            </defs>
            <path d={area} fill="url(#ncd-fill)" />
            <path
              d={oneMonthPath}
              fill="none"
              stroke={chartPalette.blue}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={threeMonthPath}
              fill="none"
              stroke={chartPalette.emerald}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={oneYearPath}
              fill="none"
              stroke={chartPalette.amber}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {ti !== null ? (
              <line
                x1={(ti / (ncdTrendSeries.length - 1)) * width}
                x2={(ti / (ncdTrendSeries.length - 1)) * width}
                y1={0}
                y2={height}
                stroke="#5ea3ff"
                strokeWidth="1"
                strokeDasharray="4 3"
                strokeOpacity="0.6"
              />
            ) : null}
          </svg>
          {tooltipState !== null && ti !== null && (
            <ChartTooltip
              clientX={tooltipState.clientX}
              clientY={tooltipState.clientY}
            >
              <div className="mb-1 font-medium text-slate-400">
                {auxChartLabels[ti]}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: chartPalette.blue }}
                />
                <span className="text-slate-400">1M</span>
                <span className="ml-1 font-semibold text-slate-100">
                  {ncdTrendSeries[ti].toFixed(3)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: chartPalette.emerald }}
                />
                <span className="text-slate-400">3M</span>
                <span className="ml-1 font-semibold text-slate-100">
                  {ncdThreeMonthSeries[ti].toFixed(3)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: chartPalette.amber }}
                />
                <span className="text-slate-400">1Y</span>
                <span className="ml-1 font-semibold text-slate-100">
                  {ncdOneYearSeries[ti].toFixed(3)}%
                </span>
              </div>
            </ChartTooltip>
          )}
        </div>
      </div>
      <div
        className={`grid ${compact ? "grid-cols-7" : "grid-cols-14"} text-center text-[9px] text-slate-400`}
      >
        {labels.map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>
    </div>
  );
}

function NcdPrimaryTrendPanel() {
  const [period, setPeriod] = useState<NcdPeriod>("1M");
  const [range, setRange] = useState<NcdTrendRange>("14d");
  const off = NCD_PERIOD_OFFSET[period];
  const count = NCD_TREND_COUNTS[range];

  const gov = shiftSeries(ncdPrimaryGovBase6m.slice(-count), off);
  const aaa = shiftSeries(ncdPrimaryAAABase6m.slice(-count), off);
  const aaPlus = shiftSeries(ncdPrimaryAAPlsBase6m.slice(-count), off);
  const aa = shiftSeries(ncdPrimaryAABase6m.slice(-count), off);
  const dates = ncdTrendDates6m.slice(-count);

  const allFlat = [...gov, ...aaa, ...aaPlus, ...aa];
  const rawMin = Math.min(...allFlat);
  const rawMax = Math.max(...allFlat);
  const pad = (rawMax - rawMin) * 0.15 || 0.02;
  const min = Math.max(0, rawMin - pad);
  const max = rawMax + pad;

  const W = 600;
  const H = 148;
  const XAXIS_H = 14;
  const TOTAL_H = H + XAXIS_H;

  const { tooltipState, containerRef, handleMouseMove, handleMouseLeave } =
    useChartTooltip(count);
  const ti = tooltipState?.index ?? null;

  const yTicks = Array.from({ length: 4 }, (_, i) =>
    Number((max - ((max - min) * i) / 3).toFixed(3)).toString(),
  );

  // X-axis: tick every day, label every N days
  const labelStep =
    range === "14d" ? 1 : range === "1m" ? 2 : range === "3m" ? 7 : 14;
  const xLabels = dates
    .map((d, i) => ({ d, i }))
    .filter(({ i }) => i % labelStep === 0 || i === count - 1);

  const series = [
    { data: gov, color: "#a78bfa", label: "国有/股份制", dash: "" },
    { data: aaa, color: chartPalette.blue, label: "AAA", dash: "" },
    { data: aaPlus, color: chartPalette.emerald, label: "AA+", dash: "5 3" },
    { data: aa, color: chartPalette.amber, label: "AA", dash: "2 2" },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden rounded-lg border border-[#1c2f49] bg-[#0d1726] p-2">
      {/* header: period tabs + legend + range tabs */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
        <div className="flex items-center gap-1">
          {ncdPrimaryPeriods.map((p) => (
            <button
              key={p}
              type="button"
              className={auxTabClass(period === p)}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="mx-0.5 h-3 w-px bg-[#2a3f5f]" />
        {series.map((s) => (
          <LegendDot key={s.label} color={s.color} label={s.label} />
        ))}
        <div className="ml-auto flex items-center gap-1">
          {ncdTrendRangeTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={auxTabClass(range === tab.id)}
              onClick={() => setRange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {/* chart */}
      <div className="grid min-h-0 flex-1 grid-cols-[2.8rem_1fr] gap-x-1">
        {/* y-axis: top portion only (bottom 20px reserved for x-axis) */}
        <div className="flex flex-col justify-between pb-5 pr-1 text-right text-[10px] text-slate-500">
          {yTicks.map((t) => (
            <div key={t}>{t}%</div>
          ))}
        </div>
        {/* chart area — x-axis ticks + labels are absolutely inside */}
        <div
          ref={containerRef}
          className="relative min-h-0 cursor-crosshair overflow-hidden rounded-md border border-dashed border-[#2f456b]"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute inset-x-0 border-t border-dashed border-[#29476e]"
              style={{ top: `${(i / 3) * 100}%` }}
            />
          ))}
          {/* line chart — occupies top 85% so bottom 15% is reserved for x-axis */}
          <svg
            className="absolute inset-x-0 top-0 w-full"
            style={{ height: "calc(100% - 20px)" }}
            preserveAspectRatio="none"
            viewBox={`0 0 ${W} ${H}`}
          >
            {series.map((s) => (
              <path
                key={s.label}
                d={buildLinePath(s.data, W, H, min, max)}
                fill="none"
                stroke={s.color}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={s.dash || undefined}
              />
            ))}
            {ti !== null && (
              <line
                x1={(ti / (count - 1)) * W}
                x2={(ti / (count - 1)) * W}
                y1={0}
                y2={H}
                stroke="#7090b0"
                strokeWidth="1"
                strokeDasharray="4 3"
              />
            )}
          </svg>
          {/* x-axis row: per-day ticks + date labels, pinned to bottom */}
          <div className="absolute inset-x-0 bottom-0 h-5">
            {/* tick marks — fixed 4px tall SVG */}
            <svg
              className="absolute inset-x-0 top-0 w-full"
              height="4"
              preserveAspectRatio="none"
              viewBox={`0 0 ${W} 4`}
            >
              {dates.map((_, i) => (
                <line
                  key={i}
                  x1={(i / (count - 1)) * W}
                  x2={(i / (count - 1)) * W}
                  y1={0}
                  y2={4}
                  stroke="#2a4060"
                  strokeWidth="1.5"
                />
              ))}
            </svg>
            {/* date labels below ticks */}
            {xLabels.map(({ d, i }) => (
              <span
                key={i}
                className="absolute top-[5px] -translate-x-1/2 text-[9px] leading-none text-slate-400"
                style={{ left: `${(i / (count - 1)) * 100}%` }}
              >
                {d}
              </span>
            ))}
          </div>
          {tooltipState !== null && ti !== null && (
            <ChartTooltip
              clientX={tooltipState.clientX}
              clientY={tooltipState.clientY}
            >
              <div className="mb-1 text-[11px] font-medium text-slate-400">
                {dates[ti]}
              </div>
              {series.map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-slate-400">{s.label}</span>
                  <span className="ml-1 font-semibold text-slate-100">
                    {s.data[ti].toFixed(3)}%
                  </span>
                </div>
              ))}
            </ChartTooltip>
          )}
        </div>
      </div>
    </div>
  );
}

function NcdLinkedChartPane({
  series,
  dates,
  range,
  count,
  externalHoverIndex,
  onHoverChange,
}: {
  series: Array<{ data: number[]; color: string; label: string; dash: string }>;
  dates: string[];
  range: NcdTrendRange;
  count: number;
  externalHoverIndex: number | null;
  onHoverChange: (i: number | null) => void;
}) {
  const allFlat = series.flatMap((s) => s.data);
  const rawMin = Math.min(...allFlat);
  const rawMax = Math.max(...allFlat);
  const pad = (rawMax - rawMin) * 0.15 || 0.02;
  const min = Math.max(0, rawMin - pad);
  const max = rawMax + pad;
  const W = 600;
  const H = 148;
  const {
    tooltipState,
    containerRef,
    handleMouseMove: rawHMM,
    handleMouseLeave: rawHML,
  } = useChartTooltip(count);
  const ti = tooltipState?.index ?? null;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    rawHMM(e);
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const x = e.clientX - rect.left;
    const index = Math.max(
      0,
      Math.min(count - 1, Math.round((x / rect.width) * (count - 1))),
    );
    onHoverChange(index);
  };
  const handleMouseLeave = () => {
    rawHML();
    onHoverChange(null);
  };

  const crosshairIdx = externalHoverIndex !== null ? externalHoverIndex : ti;
  const yTicks = Array.from({ length: 4 }, (_, i) =>
    Number((max - ((max - min) * i) / 3).toFixed(3)).toString(),
  );
  const labelStep =
    range === "14d" ? 1 : range === "1m" ? 2 : range === "3m" ? 7 : 14;
  const xLabels = dates
    .map((d, i) => ({ d, i }))
    .filter(({ i }) => i % labelStep === 0 || i === count - 1);

  return (
    <div className="flex h-full min-h-0 flex-col gap-1 overflow-hidden rounded-lg border border-[#1c2f49] bg-[#0d1726] p-2">
      <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-slate-400">
        {series.map((s) => (
          <LegendDot key={s.label} color={s.color} label={s.label} />
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[2.8rem_1fr] gap-x-1">
        <div className="flex flex-col justify-between pb-5 pr-1 text-right text-[10px] text-slate-500">
          {yTicks.map((t) => (
            <div key={t}>{t}%</div>
          ))}
        </div>
        <div
          ref={containerRef}
          className="relative min-h-0 cursor-crosshair overflow-hidden rounded-md border border-dashed border-[#2f456b]"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute inset-x-0 border-t border-dashed border-[#29476e]"
              style={{ top: `${(i / 3) * 100}%` }}
            />
          ))}
          <svg
            className="absolute inset-x-0 top-0 w-full"
            style={{ height: "calc(100% - 20px)" }}
            preserveAspectRatio="none"
            viewBox={`0 0 ${W} ${H}`}
          >
            {series.map((s) => (
              <path
                key={s.label}
                d={buildLinePath(s.data, W, H, min, max)}
                fill="none"
                stroke={s.color}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={s.dash || undefined}
              />
            ))}
            {crosshairIdx !== null && (
              <line
                x1={(crosshairIdx / (count - 1)) * W}
                x2={(crosshairIdx / (count - 1)) * W}
                y1={0}
                y2={H}
                stroke="#7090b0"
                strokeWidth="1"
                strokeDasharray="4 3"
              />
            )}
          </svg>
          <div className="absolute inset-x-0 bottom-0 h-5">
            <svg
              className="absolute inset-x-0 top-0 w-full"
              height="4"
              preserveAspectRatio="none"
              viewBox={`0 0 ${W} 4`}
            >
              {dates.map((_, i) => (
                <line
                  key={i}
                  x1={(i / (count - 1)) * W}
                  x2={(i / (count - 1)) * W}
                  y1={0}
                  y2={4}
                  stroke="#2a4060"
                  strokeWidth="1.5"
                />
              ))}
            </svg>
            {xLabels.map(({ d, i }) => (
              <span
                key={i}
                className="absolute top-[5px] -translate-x-1/2 text-[9px] leading-none text-slate-400"
                style={{ left: `${(i / (count - 1)) * 100}%` }}
              >
                {d}
              </span>
            ))}
          </div>
          {tooltipState !== null && ti !== null && (
            <ChartTooltip
              clientX={tooltipState.clientX}
              clientY={tooltipState.clientY}
            >
              <div className="mb-1 text-[11px] font-medium text-slate-400">
                {dates[ti]}
              </div>
              {series.map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-slate-400">{s.label}</span>
                  <span className="ml-1 font-semibold text-slate-100">
                    {s.data[ti].toFixed(3)}%
                  </span>
                </div>
              ))}
            </ChartTooltip>
          )}
        </div>
      </div>
    </div>
  );
}

function NcdExpandedDualView({ period }: { period: NcdPeriod }) {
  const [range, setRange] = useState<NcdTrendRange>("14d");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const count = NCD_TREND_COUNTS[range];
  const off = NCD_PERIOD_OFFSET[period];
  const dates = ncdTrendDates6m.slice(-count);

  const primarySeries = [
    {
      data: shiftSeries(ncdPrimaryGovBase6m.slice(-count), off),
      color: "#a78bfa",
      label: "国有/股份制",
      dash: "",
    },
    {
      data: shiftSeries(ncdPrimaryAAABase6m.slice(-count), off),
      color: chartPalette.blue,
      label: "AAA",
      dash: "",
    },
    {
      data: shiftSeries(ncdPrimaryAAPlsBase6m.slice(-count), off),
      color: chartPalette.emerald,
      label: "AA+",
      dash: "5 3",
    },
    {
      data: shiftSeries(ncdPrimaryAABase6m.slice(-count), off),
      color: chartPalette.amber,
      label: "AA",
      dash: "2 2",
    },
  ];

  const secondarySeries = [
    {
      data: ncdSecondaryGov6m.slice(-count),
      color: "#a78bfa",
      label: "国有/股份制",
      dash: "",
    },
    {
      data: ncdSecondaryAAA6m.slice(-count),
      color: chartPalette.blue,
      label: "AAA",
      dash: "",
    },
    {
      data: ncdSecondaryAAPlus6m.slice(-count),
      color: chartPalette.emerald,
      label: "AA+",
      dash: "5 3",
    },
    {
      data: ncdSecondaryAA6m.slice(-count),
      color: chartPalette.amber,
      label: "AA",
      dash: "2 2",
    },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex items-center justify-end gap-1">
        {ncdTrendRangeTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={auxTabClass(range === tab.id)}
            onClick={() => setRange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="mb-1 text-[11px] font-medium text-slate-400">一级</div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <NcdLinkedChartPane
            series={primarySeries}
            dates={dates}
            range={range}
            count={count}
            externalHoverIndex={hoverIndex}
            onHoverChange={setHoverIndex}
          />
        </div>
      </div>
      <div className="h-px bg-[#1e2f48]" />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="mb-1 text-[11px] font-medium text-slate-400">二级</div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <NcdLinkedChartPane
            series={secondarySeries}
            dates={dates}
            range={range}
            count={count}
            externalHoverIndex={hoverIndex}
            onHoverChange={setHoverIndex}
          />
        </div>
      </div>
    </div>
  );
}

function NcdPrimaryTable() {
  const [period, setPeriod] = useState<NcdPeriod>("1M");
  const off = NCD_PERIOD_OFFSET[period];
  const groups: NcdPrimaryGroup[] = ncdPrimary1MGroups.map((g) => ({
    ...g,
    rows: g.rows.map((r) => ({
      ...r,
      rate: (parseFloat(r.rate) + off).toFixed(3),
    })),
  }));
  const maxRows = Math.max(...groups.map((g) => g.rows.length));
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-[#1c2f49] bg-[#0d1726]">
      <div className="flex items-center gap-2 border-b border-[#1c3050] bg-[#101d32] px-3 py-1.5">
        <div className="flex items-center gap-1">
          {ncdPrimaryPeriods.map((p) => (
            <button
              key={p}
              type="button"
              className={auxTabClass(period === p)}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
        <span className="ml-2 text-[11px] text-slate-500">(周一 26-06-08)</span>
      </div>
      <div
        className="grid overflow-y-auto"
        style={{
          gridTemplateColumns: `repeat(${groups.length}, 1fr)`,
          gridAutoRows: "min-content",
        }}
      >
        {groups.map((group) => (
          <div
            key={group.label}
            className="border-b border-r border-[#1c3050] bg-[#0f1d30] px-2 py-1 text-center text-[11px] font-medium text-slate-400 last:border-r-0"
          >
            {group.label}
          </div>
        ))}
        {Array.from({ length: maxRows }, (_, rowIdx) =>
          groups.map((group) => {
            const row = group.rows[rowIdx];
            return (
              <div
                key={`${group.label}-${rowIdx}`}
                className="flex items-center justify-between border-b border-r border-[#172436] px-2 py-[5px] last:border-r-0"
                style={{
                  borderBottomColor:
                    rowIdx === maxRows - 1 ? "transparent" : undefined,
                }}
              >
                {row ? (
                  <>
                    <span className="truncate text-xs text-slate-300">
                      {row.name}
                      {row.marker && (
                        <span className="ml-0.5 text-[9px] text-slate-500">
                          ▲
                        </span>
                      )}
                    </span>
                    <div className="flex shrink-0 items-center gap-1">
                      <span className="font-mono text-xs text-amber-400">
                        {row.rate}
                      </span>
                      {row.change && (
                        <span className="text-[11px] text-emerald-400">
                          {row.change}
                        </span>
                      )}
                    </div>
                  </>
                ) : null}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}

function NcdPrimaryExpandedTable() {
  return (
    <div className="h-full overflow-auto">
      <table className="w-full border-collapse text-xs">
        <thead className="sticky top-0 z-10">
          <tr className="bg-[#101d32]">
            <th className="w-20 border-b border-r border-[#1c3050] px-2 py-2 text-left text-[11px] text-slate-500" />
            {ncdPrimaryPeriods.map((p) => {
              const h = ncdColHeaders[p];
              return (
                <th
                  key={p}
                  className="border-b border-r border-[#1c3050] px-2 py-2 text-center last:border-r-0"
                >
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="font-semibold text-slate-200">{p}</span>
                    <span className="text-[10px] text-slate-500">
                      ({h.dow} {h.date})
                    </span>
                    {h.count && (
                      <span className="rounded bg-blue-500/20 px-1 text-[10px] text-blue-300">
                        {h.count}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {ncdAllPeriodsData.map((group) => (
            <tr key={group.label} className="align-top">
              <td className="border-b border-r border-[#1c3050] bg-[#0f1d30] px-2 py-2 text-[11px] font-medium text-slate-400">
                {group.label}
              </td>
              {ncdPrimaryPeriods.map((p) => {
                const cells = group.cells[p];
                return (
                  <td
                    key={p}
                    className="border-b border-r border-[#172436] px-2 py-1.5 last:border-r-0"
                  >
                    {cells.length > 0 ? (
                      <div className="flex flex-col gap-[3px]">
                        {cells.map((cell) => (
                          <div
                            key={cell.name}
                            className="flex items-center justify-between gap-1"
                          >
                            <span className="truncate text-[11px] text-slate-300">
                              {cell.name}
                            </span>
                            <div className="flex shrink-0 items-center gap-1">
                              <span className="font-mono text-[11px] text-amber-400">
                                {cell.rate}
                              </span>
                              {cell.change && (
                                <span className="text-[10px] text-emerald-400">
                                  +{cell.change}
                                </span>
                              )}
                              {cell.limitNonBank && (
                                <span className="rounded bg-slate-700/60 px-0.5 text-[9px] text-slate-400">
                                  限非
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-[10px] text-slate-600">
                        —
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FundStructureBars({ range }: { range: FundStructureRange }) {
  const yTicks = [5000, 4000, 3000, 2000, 1000, 0] as const;
  const { bars, labels } = fundStructureRangeData[range];
  const [hoveredBar, setHoveredBar] = useState<{
    index: number;
    clientX: number;
    clientY: number;
  } | null>(null);

  return (
    <div className="grid h-full min-h-0 grid-cols-[3rem_1fr] gap-2">
      <div className="flex flex-col justify-between pb-2 pt-1 text-right text-[10px] text-slate-400">
        {yTicks.map((tick) => (
          <div key={tick}>{tick.toLocaleString()}</div>
        ))}
      </div>
      <div className="relative min-h-0 overflow-hidden rounded-md border border-dashed border-[#2f456b]">
        {yTicks.map((tick, index) => (
          <div
            key={`fund-grid-${tick}`}
            className="absolute inset-x-0 border-t border-dashed border-[#29476e]"
            style={{ top: `${(index / (yTicks.length - 1)) * 100}%` }}
          />
        ))}
        <div
          className="absolute inset-x-3 bottom-2 top-2 flex items-end gap-1.5"
          onMouseLeave={() => setHoveredBar(null)}
        >
          {bars.map((values, index) => (
            <div
              key={`fund-bar-${range}-${index}`}
              className="flex h-full min-w-0 flex-1 cursor-pointer items-end"
              onMouseEnter={(e) =>
                setHoveredBar({ index, clientX: e.clientX, clientY: e.clientY })
              }
              onMouseMove={(e) =>
                setHoveredBar((prev) =>
                  prev?.index === index
                    ? { index, clientX: e.clientX, clientY: e.clientY }
                    : prev,
                )
              }
            >
              <div
                className="flex h-full w-full flex-col justify-end overflow-hidden rounded-t-[3px] transition-opacity"
                style={{
                  opacity:
                    hoveredBar === null || hoveredBar.index === index
                      ? 0.9
                      : 0.45,
                }}
              >
                {values.map((value, partIndex) => (
                  <div
                    key={`fund-bar-${range}-${index}-${partIndex}`}
                    className={
                      partIndex === values.length - 1 ? "rounded-t-[3px]" : ""
                    }
                    style={{
                      height: `${(value / 5000) * 100}%`,
                      backgroundColor:
                        fundStructureLegendItems[partIndex].color,
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        {hoveredBar !== null && (
          <ChartTooltip
            clientX={hoveredBar.clientX}
            clientY={hoveredBar.clientY}
          >
            <div className="mb-1 font-medium text-slate-400">
              {labels[hoveredBar.index]}
            </div>
            <div className="mb-1 text-slate-300">
              合计{" "}
              <span className="font-semibold text-slate-100">
                {bars[hoveredBar.index]
                  .reduce((s, v) => s + v, 0)
                  .toLocaleString()}
                亿
              </span>
            </div>
            {fundStructureLegendItems.map((item, i) => (
              <div key={item.label} className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-400">{item.label}</span>
                <span className="ml-1 font-semibold text-slate-100">
                  {bars[hoveredBar.index][i].toLocaleString()}亿
                </span>
              </div>
            ))}
          </ChartTooltip>
        )}
      </div>
    </div>
  );
}

function FundStructurePanel() {
  const yTicks = [5000, 4000, 3000, 2000, 1000, 0] as const;
  const [range, setRange] = useState<FundStructureRange>("14d");
  const { bars, labels } = fundStructureRangeData[range];
  const rangeSummary =
    range === "14d" ? "近14天" : range === "1m" ? "近1月" : "近半年";
  const [hoveredBar, setHoveredBar] = useState<{
    index: number;
    clientX: number;
    clientY: number;
  } | null>(null);

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_1fr_auto] gap-2 overflow-hidden rounded-lg border border-[#1c2f49] bg-[#0d1726] p-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex flex-wrap items-center gap-3">
          {fundStructureLegendItems.map((item) => (
            <LegendDot key={item.label} color={item.color} label={item.label} />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {fundStructureRangeTabs.map((tab) => (
              <button
                key={tab.id}
                className={auxTabClass(tab.id === range)}
                onClick={() => setRange(tab.id)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
          <span>{rangeSummary}</span>
        </div>
      </div>
      <div className="grid h-full min-h-0 grid-cols-[3rem_1fr] gap-2">
        <div className="flex flex-col justify-between pb-2 pt-1 text-right text-[10px] text-slate-400">
          {yTicks.map((tick) => (
            <div key={tick}>{tick.toLocaleString()}</div>
          ))}
        </div>
        <div className="relative min-h-0 overflow-hidden rounded-md border border-dashed border-[#2f456b]">
          {yTicks.map((tick, index) => (
            <div
              key={`fund-grid-${tick}`}
              className="absolute inset-x-0 border-t border-dashed border-[#29476e]"
              style={{ top: `${(index / (yTicks.length - 1)) * 100}%` }}
            />
          ))}
          <div
            className="absolute inset-x-3 bottom-2 top-2 flex items-end gap-1.5"
            onMouseLeave={() => setHoveredBar(null)}
          >
            {bars.map((values, index) => (
              <div
                key={`fund-bar-${range}-${index}`}
                className="flex h-full min-w-0 flex-1 cursor-pointer items-end"
                onMouseEnter={(e) =>
                  setHoveredBar({
                    index,
                    clientX: e.clientX,
                    clientY: e.clientY,
                  })
                }
                onMouseMove={(e) =>
                  setHoveredBar((prev) =>
                    prev?.index === index
                      ? { index, clientX: e.clientX, clientY: e.clientY }
                      : prev,
                  )
                }
              >
                <div
                  className="flex h-full w-full flex-col justify-end overflow-hidden rounded-t-[3px] transition-opacity"
                  style={{
                    opacity:
                      hoveredBar === null || hoveredBar.index === index
                        ? 0.9
                        : 0.45,
                  }}
                >
                  {values.map((value, partIndex) => (
                    <div
                      key={`fund-bar-${range}-${index}-${partIndex}`}
                      className={
                        partIndex === values.length - 1 ? "rounded-t-[3px]" : ""
                      }
                      style={{
                        height: `${(value / 5000) * 100}%`,
                        backgroundColor:
                          fundStructureLegendItems[partIndex].color,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          {hoveredBar !== null && (
            <ChartTooltip
              clientX={hoveredBar.clientX}
              clientY={hoveredBar.clientY}
            >
              <div className="mb-1 font-medium text-slate-400">
                {labels[hoveredBar.index]}
              </div>
              <div className="mb-1 text-slate-300">
                合计{" "}
                <span className="font-semibold text-slate-100">
                  {bars[hoveredBar.index]
                    .reduce((s, v) => s + v, 0)
                    .toLocaleString()}
                  亿
                </span>
              </div>
              {fundStructureLegendItems.map((item, i) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-400">{item.label}</span>
                  <span className="ml-1 font-semibold text-slate-100">
                    {bars[hoveredBar.index][i].toLocaleString()}亿
                  </span>
                </div>
              ))}
            </ChartTooltip>
          )}
        </div>
      </div>
      <div className="grid shrink-0 grid-cols-[3rem_1fr]">
        <div />
        <div
          className="grid pt-0.5 text-[9px] text-slate-400"
          style={{
            gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))`,
          }}
        >
          {labels.map((label, index) => (
            <div
              key={`fund-label-${range}-${index}`}
              className="flex justify-center overflow-visible"
            >
              <span className="origin-top-right -rotate-45 whitespace-nowrap">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OverlayProductSelect({
  value,
  onChange,
}: {
  value: OverlayProduct;
  onChange: (product: OverlayProduct) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-slate-400">
      <span>叠加品种</span>
      <select
        className="rounded-md border border-[#2a4164] bg-[#0f1b2f] px-2 py-1 text-xs text-slate-200 outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value as OverlayProduct)}
      >
        {overlayProductOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function QuoteSection({
  title,
  columns,
  rows,
  greenColumns,
  redColumns,
  deltaColumns,
  buttonColumn,
  fitToWidth,
  scrollable,
  emphasized,
}: {
  title: string;
  columns: readonly string[];
  rows: readonly (readonly string[])[];
  greenColumns?: readonly number[];
  redColumns?: readonly number[];
  deltaColumns?: readonly number[];
  buttonColumn?: number;
  fitToWidth?: boolean;
  scrollable?: boolean;
  emphasized?: boolean;
}) {
  return (
    <section
      className={`flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border ${
        emphasized
          ? "border-[#3b76f3] bg-[#0c1730]"
          : "border-[#1f2f48] bg-[#0c1524]"
      }`}
    >
      <div className="border-b border-[#1b2a42] bg-[#101b2c] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3 whitespace-nowrap">
            <div className="text-base font-semibold text-slate-50">{title}</div>
            <div className="text-xs text-slate-500">数据更新：10:53:27</div>
          </div>
          <button
            className="rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300"
            type="button"
          >
            下载
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <StructuredTable
          columns={columns}
          rows={rows}
          greenColumns={greenColumns}
          redColumns={redColumns}
          deltaColumns={deltaColumns}
          buttonColumn={buttonColumn}
          fitToWidth={fitToWidth}
          flush
          adaptiveHeight={!scrollable}
          scrollY={scrollable}
        />
      </div>
    </section>
  );
}

function StructuredTable({
  columns,
  rows,
  greenColumns = [],
  redColumns = [],
  deltaColumns = [],
  emphasisColumns = [],
  buttonColumn,
  compact = false,
  fitToWidth = false,
  columnWidths,
  flush = false,
  adaptiveHeight = false,
  scrollY = false,
}: {
  columns: readonly string[];
  rows: readonly (readonly string[])[];
  greenColumns?: readonly number[];
  redColumns?: readonly number[];
  deltaColumns?: readonly number[];
  emphasisColumns?: readonly number[];
  buttonColumn?: number;
  compact?: boolean;
  fitToWidth?: boolean;
  columnWidths?: readonly string[];
  flush?: boolean;
  adaptiveHeight?: boolean;
  scrollY?: boolean;
}) {
  return (
    <div
      className={`${adaptiveHeight ? "" : "h-full min-h-0"} bg-[#0a1322] ${
        scrollY
          ? "overflow-y-auto overflow-x-hidden"
          : fitToWidth || adaptiveHeight
            ? "overflow-hidden"
            : "overflow-auto"
      } ${
        flush ? "rounded-none border-0" : "rounded-xl border border-[#1c2b42]"
      }`}
    >
      <table
        className={`border-separate border-spacing-0 text-xs ${fitToWidth ? "w-full table-fixed" : "min-w-full whitespace-nowrap"}`}
      >
        {columnWidths ? (
          <colgroup>
            {columnWidths.map((width, index) => (
              <col key={`col-${index}`} style={{ width }} />
            ))}
          </colgroup>
        ) : null}
        <thead className="sticky top-0 z-10 bg-[#111d30]">
          <tr>
            {columns.map((column, index) => (
              <th
                key={`${column}-${index}`}
                className={`border-b border-[#22324d] px-3 py-2 text-[11px] font-medium tracking-[0.02em] text-slate-400 ${
                  index === 0 ? "text-left" : "text-right"
                } ${compact ? "px-2 py-1.5" : "px-3 py-2.5"} ${
                  fitToWidth
                    ? columnWidths
                      ? "whitespace-nowrap leading-tight"
                      : "whitespace-normal break-all leading-tight"
                    : ""
                }`}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={`${row[0]}-${rowIndex}`}
              className={
                rowIndex % 2 === 0 ? "bg-transparent" : "bg-[#0d1726]/55"
              }
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={`${row[0]}-${cellIndex}`}
                  className={`border-b border-[#162439] ${compact ? "px-2.5 py-2" : "px-3 py-2.5"} ${
                    cellIndex === 0 ? "text-left" : "text-right"
                  } ${fitToWidth && buttonColumn !== cellIndex ? "overflow-hidden text-ellipsis whitespace-nowrap" : ""}`}
                >
                  {buttonColumn === cellIndex ? (
                    <button
                      className={`rounded-lg border border-blue-500/30 bg-blue-500/20 font-medium text-blue-300 ${
                        compact
                          ? "px-1.5 py-0.5 text-[10px]"
                          : "px-3 py-1 text-xs"
                      }`}
                      type="button"
                    >
                      {cell}
                    </button>
                  ) : (
                    <span
                      className={cellClassName(
                        cell,
                        cellIndex,
                        greenColumns,
                        redColumns,
                        deltaColumns,
                        emphasisColumns,
                      )}
                    >
                      {cell}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TrendOverviewCard() {
  const [activeTrendMode, setActiveTrendMode] = useState<TrendMode>("history");
  const linePath = buildLinePath(trendRateSeries, 860, 320, 1.82, 2.12);
  const areaPath = buildAreaPath(trendRateSeries, 860, 320, 1.82, 2.12);

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_1fr] overflow-hidden rounded-xl border border-[#284164] bg-[#0b1728]">
      <div className="flex items-center justify-between border-b border-[#203551] bg-[#101d32] px-4 py-3">
        <div className="flex gap-2">
          {trendModeTabs.map((tab) => (
            <button
              key={tab.id}
              className={trendModeButtonClass(tab.id === activeTrendMode)}
              onClick={() => setActiveTrendMode(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm font-semibold text-slate-100">
            nonbankBest · 14
          </div>
          <button
            className="rounded-lg border border-[#33507d] bg-[#14223a] px-3 py-1.5 text-xs font-medium text-slate-300"
            type="button"
          >
            导出
          </button>
        </div>
      </div>
      <div className="grid min-h-0 grid-rows-[68fr_26fr_auto] gap-0 px-4 pb-4 pt-3">
        <div className="grid min-h-0 grid-cols-[4rem_1fr]">
          <div className="flex flex-col justify-between pr-3 pb-2 pt-6 text-right text-[10px] text-slate-400">
            {trendPriceTicks.map((tick) => (
              <div key={tick}>{tick.toFixed(3)}</div>
            ))}
          </div>
          <div className="relative min-h-0">
            {trendPriceTicks.map((_, index) => (
              <div
                key={`price-grid-${index}`}
                className="absolute inset-x-0 border-t border-dashed border-[#29476e]"
                style={{
                  top: `${(index / (trendPriceTicks.length - 1)) * 100}%`,
                }}
              />
            ))}
            <div
              className="absolute inset-x-0 border-t-2 border-dashed border-[#ff8a26]"
              style={{ top: "58%" }}
            />
            <div className="absolute right-3 top-2 flex items-center gap-2 text-xs text-blue-300">
              <span className="h-px w-3 bg-blue-300" />
              <span>最新利率</span>
            </div>
            <svg
              className="absolute inset-0 h-full w-full"
              preserveAspectRatio="none"
              viewBox="0 0 860 320"
            >
              <path d={areaPath} fill="url(#trend-fill)" />
              <path
                d={linePath}
                fill="none"
                stroke={chartPalette.blue}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5ea3ff" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#5ea3ff" stopOpacity="0.04" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
        <div className="grid min-h-0 grid-cols-[4rem_1fr] border-t border-[#1d3250] pt-2">
          <div className="flex flex-col justify-between pr-3 pb-1 text-right text-[10px] text-slate-400">
            {trendVolumeTicks.map((tick) => (
              <div key={tick}>{tick}</div>
            ))}
          </div>
          <div className="relative min-h-0">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={`vol-grid-${index}`}
                className="absolute inset-x-0 border-t border-dashed border-[#29476e]"
                style={{ top: `${(index / 4) * 100}%` }}
              />
            ))}
            <div className="absolute inset-x-0 bottom-0 top-0 flex items-end gap-[6px]">
              {trendVolumeSeries.map((value, index) => (
                <div
                  key={`vol-${index}`}
                  className="min-w-0 flex-1 rounded-t-[2px]"
                  style={{
                    height: `${(value / 2000) * 100}%`,
                    backgroundColor: trendVolumeColors[index],
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-[4rem_1fr] pt-2">
          <div />
          <div className="grid grid-cols-10 text-[10px] text-slate-400">
            {trendAxisLabels.map((label) => (
              <div key={label} className="text-center">
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniChartCard({
  title,
  bars = false,
}: {
  title: string;
  bars?: boolean;
}) {
  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_1fr] overflow-hidden rounded-xl border border-[#1c2b42] bg-[#0a1322]">
      <div className="flex items-center justify-between gap-3 border-b border-[#1a2c45] bg-[#0e1827] px-3 py-1.5">
        <div className="text-xs font-medium text-slate-200">{title}</div>
        <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
          <LegendDot color={chartPalette.emerald} label="1" />
          <LegendDot color={chartPalette.blue} label="7" />
          <LegendDot color={chartPalette.violet} label="14" />
        </div>
      </div>
      <div className="min-h-0 p-1.5">
        <div className="relative h-full min-h-0 overflow-hidden rounded-lg border border-dashed border-[#2f456b] bg-[#0d1726]">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(58,81,115,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(58,81,115,0.16)_1px,transparent_1px)] bg-[size:100%_25%,20%_100%]" />
          {bars ? (
            <div className="absolute inset-x-2.5 bottom-2.5 top-2.5 flex items-end gap-1.5">
              {[58, 74, 65, 82, 70].map((height, index) => (
                <div
                  key={`${title}-${index}`}
                  className="flex flex-1 items-end gap-1"
                >
                  {[
                    chartPalette.violet,
                    chartPalette.emerald,
                    chartPalette.blue,
                    chartPalette.pink,
                  ].map((color, barIndex) => (
                    <div
                      key={`${title}-${index}-${barIndex}`}
                      className="w-full rounded-t"
                      style={{
                        height: `${Math.max(16, height - barIndex * 10)}%`,
                        backgroundColor: color,
                        opacity: 0.72,
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="absolute inset-2.5">
              <div className="relative h-full w-full">
                <TrendLine
                  stroke={chartPalette.emerald}
                  points="6,80 24,76 42,72 60,67 78,61 96,64 114,55 132,48 150,44 168,39"
                  mini
                />
                <TrendLine
                  stroke={chartPalette.blue}
                  points="6,58 24,54 42,47 60,50 78,39 96,35 114,28 132,24 150,19 168,15"
                  mini
                />
                <TrendLine
                  stroke={chartPalette.violet}
                  points="6,69 24,65 42,59 60,54 78,51 96,43 114,39 132,33 150,28 168,23"
                  mini
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TrendLine({
  stroke,
  points,
  mini = false,
}: {
  stroke: string;
  points: string;
  mini?: boolean;
}) {
  return (
    <svg
      className="h-full w-full"
      preserveAspectRatio="none"
      viewBox={mini ? "0 0 180 70" : "0 0 304 90"}
    >
      <polyline
        fill="none"
        points={points}
        stroke={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={mini ? 2 : 2.5}
        strokeOpacity={0.92}
      />
    </svg>
  );
}

const intradayAllTimeLabels: string[] = (() => {
  const segments = [
    { start: "09:30", count: 5 },
    { start: "10:00", count: 5 },
    { start: "10:30", count: 5 },
    { start: "11:00", count: 5 },
    { start: "13:30", count: 5 },
    { start: "14:00", count: 5 },
    { start: "14:30", count: 5 },
    { start: "15:00", count: 5 },
  ];
  return segments.flatMap(({ start, count }) => {
    const [h, m] = start.split(":").map(Number);
    return Array.from({ length: count }, (_, i) => {
      const total = h * 60 + m + i * 6;
      return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
    });
  });
})();

function useChartTooltip(dataLength: number) {
  const [state, setState] = useState<{
    index: number;
    clientX: number;
    clientY: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const x = e.clientX - rect.left;
    const index = Math.max(
      0,
      Math.min(dataLength - 1, Math.round((x / rect.width) * (dataLength - 1))),
    );
    setState({ index, clientX: e.clientX, clientY: e.clientY });
  }

  function handleMouseLeave() {
    setState(null);
  }

  return {
    tooltipState: state,
    containerRef,
    handleMouseMove,
    handleMouseLeave,
  };
}

function ChartTooltip({
  clientX,
  clientY,
  children,
}: {
  clientX: number;
  clientY: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="pointer-events-none fixed z-[200] rounded-lg border border-[#2a4a6e] bg-[#0e1d31]/95 px-3 py-2 text-xs text-slate-200 shadow-xl backdrop-blur-sm"
      style={{ left: clientX + 14, top: clientY - 10 }}
    >
      {children}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
    </span>
  );
}

function trendModeButtonClass(active: boolean) {
  return active
    ? "rounded-lg border border-[#3d74f1] bg-[#2a5fda] px-3 py-1.5 text-sm font-semibold text-white"
    : "rounded-lg border border-[#2a4164] bg-[#0f1b2f] px-3 py-1.5 text-sm font-semibold text-slate-200";
}

function buildLinePath(
  values: readonly number[],
  width: number,
  height: number,
  min: number,
  max: number,
) {
  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / (max - min)) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildAreaPath(
  values: readonly number[],
  width: number,
  height: number,
  min: number,
  max: number,
) {
  const line = buildLinePath(values, width, height, min, max);
  return `${line} L ${width} ${height} L 0 ${height} Z`;
}

function overlayProductLabel(product: OverlayProduct) {
  return (
    overlayProductOptions.find((option) => option.id === product)?.label ??
    "不叠加"
  );
}

function buildOverlaySeries(
  values: readonly number[],
  product: OverlayProduct,
) {
  const delta =
    product === "dr007" ? 0.012 : product === "gc007" ? -0.008 : 0.004;
  return values.map(
    (value, index) => value + delta + Math.sin(index / 3.2) * 0.0025,
  );
}

function buildHistoricalSeries(
  range: HistoryRange,
  product: OverlayProduct | SpreadProduct,
) {
  const baseSeries = historicalCloseDatasets[range].close;
  const normalized = product === "none" ? "dr001" : product;

  if (normalized === "dr001") {
    return [...baseSeries];
  }

  const config = getProductSeriesConfig(normalized);
  return baseSeries.map((value, index) => {
    const wave =
      Math.sin(index / config.waveDivisor) * config.waveAmplitude +
      Math.cos(index / (config.waveDivisor + 3.4)) *
        (config.waveAmplitude * 0.55);
    return Number((value + config.offset + wave).toFixed(4));
  });
}

function getProductSeriesConfig(
  product: Exclude<OverlayProduct | SpreadProduct, "none" | "dr001">,
) {
  switch (product) {
    case "dr007":
      return { offset: 0.00115, waveAmplitude: 0.00015, waveDivisor: 5.8 };
    case "gc007":
      return { offset: 0.00172, waveAmplitude: 0.00018, waveDivisor: 6.5 };
    case "r007":
      return { offset: 0.00138, waveAmplitude: 0.00014, waveDivisor: 5.1 };
    default:
      return { offset: 0, waveAmplitude: 0, waveDivisor: 6 };
  }
}

function buildCompactVolumeTicks(max: number) {
  return [max, max * 0.66, max * 0.33, 0].map((value) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return `${Math.round(value)}`;
  });
}

function buildSpreadAxisLabels(values: number[]) {
  const maxAbs = Math.max(...values.map(Math.abs), 0.1);
  const step = maxAbs / 2;
  return [maxAbs, step, 0, -step, -maxAbs].map((v) => v.toFixed(1));
}

function buildAxisTickLabels(labels: readonly string[], maxVisible: number) {
  if (labels.length <= maxVisible) {
    return [...labels];
  }

  const visibleIndexes = new Set<number>([0, labels.length - 1]);
  const step = (labels.length - 1) / (maxVisible - 1);
  for (let index = 1; index < maxVisible - 1; index += 1) {
    visibleIndexes.add(Math.round(index * step));
  }

  return labels.map((label, index) => (visibleIndexes.has(index) ? label : ""));
}

function buildSixMonthDailyDataset() {
  const labels: string[] = [];
  const cursor = new Date("2025-11-04T00:00:00");
  const points = 126;

  while (labels.length < points) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      labels.push(`${cursor.getMonth() + 1}/${cursor.getDate()}`);
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  // 用 randomWalk 替代 sin/cos，三步趋势模拟下行→平稳→反弹
  const closeWalk = randomWalk(1.215, points, 0.03, 7);
  const volumeWalk = randomWalk(2280, points, 200, 8).map((v) => Math.round(v));

  return { labels, close: closeWalk, volume: volumeWalk };
}

function buildCandlesFromSeries(values: readonly number[]) {
  const candles = [];
  for (let index = 0; index < values.length - 1; index += 2) {
    const open = values[index];
    const close = values[index + 1];
    const high = Math.max(open, close) + 0.006 + (index % 3) * 0.0015;
    const low = Math.min(open, close) - 0.006 - (index % 2) * 0.001;
    const volume = 520 + ((index * 97) % 1100);
    candles.push({ open, close, high, low, volume });
  }
  return candles;
}

function buildAxisLabels(min: number, max: number, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const value = max - ((max - min) * index) / (count - 1);
    return value.toFixed(3);
  });
}

function valueToY(value: number, height: number, min: number, max: number) {
  return height - ((value - min) / (max - min)) * height;
}

function PanelCard({
  title,
  subtitle,
  bodyClassName,
  bodyPaddingClassName,
  bodyFill = true,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  bodyClassName?: string;
  bodyPaddingClassName?: string;
  bodyFill?: boolean;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1e2f48] bg-[#0d1726] shadow-[0_12px_28px_rgba(3,8,18,0.32)]">
      <div className="border-b border-[#18263b] bg-[#101b2c] px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold tracking-[0.02em] text-slate-50">
              {title}
            </div>
            {subtitle ? (
              <div className="mt-1 text-xs text-slate-500">{subtitle}</div>
            ) : null}
          </div>
          {actions ?? (
            <button
              className="rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300"
              type="button"
            >
              下载
            </button>
          )}
        </div>
      </div>
      <div
        className={
          bodyClassName
            ? `min-h-0 flex-1 ${bodyClassName}`
            : (bodyPaddingClassName ?? "p-4")
        }
      >
        {bodyClassName ? (
          <div
            className={`${bodyFill ? "h-full " : ""}${bodyPaddingClassName ?? "p-4"}`}
          >
            {children}
          </div>
        ) : (
          <div className={bodyPaddingClassName ?? "p-4"}>{children}</div>
        )}
      </div>
    </section>
  );
}

function useHoverPopover(enterDelay = 80, leaveDelay = 120) {
  const [visible, setVisible] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const enterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  function scheduleShow() {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    enterTimer.current = setTimeout(() => {
      setAnchorRect(anchorRef.current?.getBoundingClientRect() ?? null);
      setVisible(true);
    }, enterDelay);
  }

  function scheduleHide() {
    if (enterTimer.current) clearTimeout(enterTimer.current);
    leaveTimer.current = setTimeout(() => setVisible(false), leaveDelay);
  }

  function cancelHide() {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
  }

  return {
    visible,
    anchorRect,
    anchorRef,
    scheduleShow,
    scheduleHide,
    cancelHide,
  };
}

const sentimentSeriesConfig = [
  { key: "total" as const, label: "全市场", color: "#e2e8f0" },
  { key: "bigBank" as const, label: "大行", color: "#4ade80" },
  { key: "smallBank" as const, label: "中小行", color: "#60a5fa" },
  { key: "nonBank" as const, label: "非银机构", color: "#fb923c" },
] as const;

function SentimentPopoverPanel({
  anchorRect,
  onEnter,
  onLeave,
}: {
  anchorRect: DOMRect;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const [tab, setTab] = useState<SentimentTab>("trend");
  const data = tab === "trend" ? sentimentTrendData : sentimentRealtimeData;
  const VW = 380;
  const VH = 120;

  const allValues = data.flatMap((p) =>
    sentimentSeriesConfig.map(({ key }) => p[key]),
  );
  const dataMin = Math.floor(Math.min(...allValues)) - 1;
  const dataMax = Math.ceil(Math.max(...allValues)) + 1;

  const { tooltipState, containerRef, handleMouseMove, handleMouseLeave } =
    useChartTooltip(data.length);

  const panelWidth = 440;
  const left = Math.min(
    anchorRect.right - panelWidth,
    window.innerWidth - panelWidth - 8,
  );
  const top = anchorRect.bottom + 8;

  const xTickIndices =
    data.length <= 8
      ? data.map((_, i) => i)
      : Array.from({ length: 5 }, (_, i) =>
          Math.round((i / 4) * (data.length - 1)),
        );

  const yTicks = Array.from({ length: 5 }, (_, i) =>
    Math.round(dataMax - ((dataMax - dataMin) * i) / 4),
  );

  const crosshairX =
    tooltipState != null ? (tooltipState.index / (data.length - 1)) * VW : null;

  return (
    <div
      className="fixed z-[300] overflow-hidden rounded-xl border border-[#1d3250] bg-[#0a1322] shadow-2xl"
      style={{ left, top, width: panelWidth }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div className="flex items-center gap-2 border-b border-[#1a2c45] bg-[#0e1827] px-3 py-2">
        <span className="text-xs font-semibold text-slate-200">资金情绪</span>
        <div className="flex gap-0.5 rounded-md bg-[#0a1322] p-0.5">
          {(["realtime", "trend"] as const).map((t) => (
            <button
              key={t}
              className={`rounded px-2.5 py-0.5 text-[11px] transition-colors ${
                tab === t
                  ? "bg-[#c69b3a] font-semibold text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              type="button"
              onClick={() => setTab(t)}
            >
              {t === "realtime" ? "实时" : "走势"}
            </button>
          ))}
        </div>
        {tab === "trend" && (
          <span className="text-[10px] text-slate-500">
            2026-04-07 → 2026-05-07
          </span>
        )}
        <span className="ml-auto cursor-default select-none text-[11px] text-slate-600">
          ?
        </span>
      </div>

      <div className="flex gap-4 px-3 pb-1 pt-2 text-[11px] text-slate-400">
        {sentimentSeriesConfig.map(({ key, label, color }) => (
          <LegendDot key={key} color={color} label={label} />
        ))}
      </div>

      <div className="grid grid-cols-[36px_1fr] px-1 pb-1">
        <div className="flex flex-col justify-between py-1 pr-1 text-right text-[10px] text-slate-500">
          {yTicks.map((tick) => (
            <div key={tick}>{tick}</div>
          ))}
        </div>
        <div
          ref={containerRef}
          className="relative cursor-crosshair"
          style={{ height: 140 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <svg
            viewBox={`0 0 ${VW} ${VH}`}
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full overflow-visible"
          >
            {yTicks.map((_, gi) => (
              <line
                key={`sg-${gi}`}
                x1="0"
                x2={VW}
                y1={(gi / (yTicks.length - 1)) * VH}
                y2={(gi / (yTicks.length - 1)) * VH}
                stroke="#1d3250"
                strokeWidth="0.5"
              />
            ))}
            {sentimentSeriesConfig.map(({ key, color }) => (
              <path
                key={key}
                d={buildLinePath(
                  data.map((p) => p[key]),
                  VW,
                  VH,
                  dataMin,
                  dataMax,
                )}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.9}
              />
            ))}
            {crosshairX !== null && (
              <line
                x1={crosshairX}
                x2={crosshairX}
                y1="0"
                y2={VH}
                stroke="#4a7ab5"
                strokeWidth="0.8"
                strokeDasharray="3 2"
              />
            )}
          </svg>
          {tooltipState &&
            sentimentSeriesConfig.map(({ key, color }) => {
              const v = data[tooltipState.index][key];
              const cx = (tooltipState.index / (data.length - 1)) * 100;
              const cy = ((dataMax - v) / (dataMax - dataMin)) * 100;
              return (
                <div
                  key={key}
                  className="pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#0a1322]"
                  style={{
                    left: `${cx}%`,
                    top: `${cy}%`,
                    backgroundColor: color,
                  }}
                />
              );
            })}
        </div>
      </div>

      <div className="grid grid-cols-[36px_1fr] pb-2">
        <div />
        <div className="relative h-4 px-1">
          {xTickIndices.map((idx) => (
            <span
              key={idx}
              className="absolute -translate-x-1/2 text-[9px] text-slate-600"
              style={{ left: `${(idx / (data.length - 1)) * 100}%` }}
            >
              {data[idx].label}
            </span>
          ))}
        </div>
      </div>

      {tooltipState && (
        <ChartTooltip
          clientX={tooltipState.clientX}
          clientY={tooltipState.clientY}
        >
          <div className="mb-1.5 font-semibold text-slate-200">
            {data[tooltipState.index].label}
          </div>
          {sentimentSeriesConfig.map(({ key, label, color }) => (
            <div key={key} className="flex items-center gap-2 py-0.5">
              <span
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-slate-400">{label}</span>
              <span className="ml-auto pl-4 font-semibold text-slate-200">
                {data[tooltipState.index][key]}
              </span>
            </div>
          ))}
        </ChartTooltip>
      )}
    </div>
  );
}

function SentimentChipWithPopover() {
  const {
    visible,
    anchorRect,
    anchorRef,
    scheduleShow,
    scheduleHide,
    cancelHide,
  } = useHoverPopover();
  return (
    <div
      ref={anchorRef}
      onMouseEnter={scheduleShow}
      onMouseLeave={scheduleHide}
    >
      <InfoChip label="资金情绪" value="51 / 47 / 50 / 49" tone="neutral" />
      {visible && anchorRect && (
        <SentimentPopoverPanel
          anchorRect={anchorRect}
          onEnter={cancelHide}
          onLeave={scheduleHide}
        />
      )}
    </div>
  );
}

function InfoChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "neutral" | "good" | "alert";
}) {
  const toneStyles =
    tone === "good"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
      : tone === "alert"
        ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
        : "border-[#253754] bg-[#101a2b] text-slate-300";

  return (
    <div className={`rounded-full border px-3 py-1.5 text-xs ${toneStyles}`}>
      <span className="text-slate-500">{label}</span>
      <span className="mx-2 text-slate-600">|</span>
      <span>{value}</span>
    </div>
  );
}

function ToolbarChip({
  active,
  children,
}: {
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
        active
          ? "border-[#3c76f0] bg-[#2551b8] text-white"
          : "border-[#253754] bg-[#101a2b] text-slate-400 hover:border-[#33507d] hover:text-slate-200"
      }`}
      type="button"
    >
      {children}
    </button>
  );
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return <span className="px-1 text-slate-400">{children}</span>;
}

function FilterDivider() {
  return <div className="mx-2 h-6 w-px bg-[#243552]" />;
}

function RangeFilterField({ value }: { value: string }) {
  return (
    <div className="flex h-8 min-w-[96px] items-center rounded-lg border border-[#2a4164] bg-[#101a2b] px-3 text-sm text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      {value}
    </div>
  );
}

function StatusBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-full border border-[#94712a] bg-[#4b3a10] px-4 py-1.5 text-sm font-semibold text-amber-300">
      {children}
    </div>
  );
}

function toneClass(tone: "neutral" | "balanced" | "watch") {
  if (tone === "balanced") return "text-sm font-semibold text-emerald-300";
  if (tone === "watch") return "text-sm font-semibold text-amber-300";
  return "text-sm font-semibold text-slate-300";
}

function auxTabClass(active: boolean) {
  return active
    ? "rounded-lg border border-[#3c76f0] bg-[#2551b8] px-3 py-1.5 text-xs text-white"
    : "rounded-lg border border-[#253754] bg-[#101a2b] px-3 py-1.5 text-xs text-slate-400 hover:border-[#33507d] hover:text-slate-200";
}

function cellClassName(
  value: string,
  columnIndex: number,
  greenColumns: readonly number[],
  redColumns: readonly number[],
  deltaColumns: readonly number[],
  emphasisColumns: readonly number[],
) {
  if (columnIndex === 0) return "font-semibold text-slate-100";
  if (deltaColumns.includes(columnIndex)) {
    if (value.startsWith("-")) return "font-semibold text-emerald-300";
    if (value.startsWith("+")) return "font-semibold text-red-400";
    return "font-medium text-slate-300";
  }
  if (greenColumns.includes(columnIndex))
    return "font-semibold text-emerald-300";
  if (redColumns.includes(columnIndex)) return "font-semibold text-red-400";
  if (emphasisColumns.includes(columnIndex)) return "font-medium text-red-400";
  return "text-slate-300";
}

export default App;
