import { Fragment, useEffect, useRef, useState } from "react";

type AuxChartTab = "ncd" | "institution-repo" | "fund-structure";
type TrendMode = "intraday" | "history" | "comparison";
type OverlayProduct = "none" | "dr007" | "gc007" | "r007";
type RightLowerTab = "cfets" | "spread" | "fund-structure";
type HistoryRange = "5d" | "1m" | "6m";
type SpreadProduct = "dr001" | "dr007" | "gc007" | "r007";
type BankRateRow = {
  institution: string;
  nonBankRate: string;
  bankRate: string;
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
    bankRate: "2.00%",
    deltaBp: "-2",
    updatedAt: "10:53:27",
  },
  {
    institution: "建设银行",
    nonBankRate: "1.94%",
    bankRate: "1.99%",
    deltaBp: "-1",
    updatedAt: "10:53:27",
  },
  {
    institution: "农业银行",
    nonBankRate: "1.96%",
    bankRate: "2.01%",
    deltaBp: "+1",
    updatedAt: "10:53:27",
  },
  {
    institution: "中国银行",
    nonBankRate: "1.95%",
    bankRate: "2.00%",
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
    columns: ["机构", "非银利率", "银行利率", "涨跌bp", "更新时间"],
    rows: [],
    greenColumns: [1],
    redColumns: [2],
    deltaColumns: [3],
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

const auxChartTabs: Array<{ id: AuxChartTab; label: string }> = [
  { id: "ncd", label: "NCD" },
  { id: "institution-repo", label: "分机构回购" },
  { id: "fund-structure", label: "机构资金结构" },
];

const overlayProductOptions: Array<{ id: OverlayProduct; label: string }> = [
  { id: "none", label: "不叠加" },
  { id: "dr007", label: "DR007" },
  { id: "gc007", label: "GC007" },
  { id: "r007", label: "R007" },
];

const rightLowerTabs: Array<{ id: RightLowerTab; label: string }> = [
  { id: "cfets", label: "CFETS日报统计" },
  { id: "spread", label: "利差" },
  { id: "fund-structure", label: "机构资金结构" },
];

const trendModeTabs: Array<{ id: TrendMode; label: string }> = [
  { id: "intraday", label: "分时" },
  { id: "history", label: "历史" },
  { id: "comparison", label: "对比" },
];

const trendRateSeries = [
  1.932, 1.914, 1.923, 1.941, 1.937, 1.916, 1.908, 1.907, 1.906, 1.935, 1.905,
  1.924, 1.921, 1.911, 1.884, 1.906, 1.908, 1.909, 1.884, 1.911, 1.897, 1.883,
  1.859, 1.839, 1.831, 1.85, 1.832, 1.87, 1.878, 1.905, 1.925, 1.918, 1.904,
  1.879, 1.876, 1.872, 1.891, 1.906, 1.905, 1.879, 1.917, 1.923, 1.944, 1.933,
  1.948, 1.947, 1.959, 1.943, 1.975, 2.0, 2.014, 2.01, 1.999, 2.001, 2.027,
  2.031, 2.038, 2.058, 2.028, 2.017,
] as const;

const trendVolumeSeries = [
  880, 460, 420, 980, 1050, 780, 1320, 1540, 1210, 470, 1660, 1100, 980, 1370,
  760, 1600, 1420, 310, 340, 1030, 470, 1040, 620, 1320, 740, 1580, 1200, 980,
  960, 640, 360, 510, 570, 1020, 480, 1030, 460, 450, 1700, 620, 460, 1110, 980,
  760, 890, 1180, 430, 1010, 480, 980, 460, 990, 300, 1090, 380, 1540, 320,
  1190, 810, 1040,
] as const;

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

const intradaySeries = [
  1.948, 1.946, 1.944, 1.945, 1.947, 1.95, 1.948, 1.946, 1.943, 1.941, 1.942,
  1.944, 1.945, 1.943, 1.942, 1.939, 1.936, 1.934, 1.933, 1.936, 1.939, 1.943,
  1.946, 1.948, 1.949, 1.951, 1.954, 1.956, 1.955, 1.957, 1.96, 1.963, 1.966,
  1.968, 1.967, 1.969, 1.971, 1.974, 1.976, 1.979,
] as const;

const intradayVolumeSeries = [
  120, 68, 52, 88, 160, 102, 96, 210, 740, 360, 420, 510, 580, 760, 210, 190,
  120, 86, 74, 132, 248, 184, 226, 288, 344, 192, 168, 141, 198, 902, 334, 248,
  210, 162, 144, 126, 98, 76, 44, 28,
] as const;

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
  "5d": {
    labels: ["4/22", "4/23", "4/24", "4/25", "4/28"],
    close: [1.2218, 1.2232, 1.2291, 1.2328, 1.2364],
    volume: [1320, 980, 1460, 1180, 1620],
  },
  "1m": {
    labels: [
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
    ],
    close: [
      1.214, 1.2146, 1.2153, 1.2161, 1.2169, 1.2176, 1.2184, 1.2192, 1.2198,
      1.2206, 1.2211, 1.2218, 1.2224, 1.223, 1.2237, 1.2243, 1.2252, 1.2261,
      1.2268, 1.2276, 1.2284, 1.2291, 1.2302, 1.231, 1.2321, 1.2334, 1.2348,
      1.236,
    ],
    volume: [
      980, 860, 910, 1420, 1080, 1020, 1180, 1260, 940, 1100, 1320, 1240, 890,
      1430, 1570, 1490, 1360, 1280, 1190, 1250, 1330, 1410, 1380, 1430, 1520,
      1570, 1640, 1710,
    ],
  },
  "6m": buildSixMonthDailyDataset(),
};

const spreadProductOptions: Array<{ id: SpreadProduct; label: string }> = [
  { id: "dr007", label: "DR007" },
  { id: "dr001", label: "DR001" },
  { id: "gc007", label: "GC007" },
  { id: "r007", label: "R007" },
];

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

const ncdTrendSeries = [
  1.94, 1.95, 1.96, 1.97, 1.98, 1.97, 1.99, 2.0, 1.99, 2.01, 2.02, 2.01, 2.02,
  2.03,
] as const;
const ncdThreeMonthSeries = [
  1.99, 2.0, 2.01, 2.02, 2.03, 2.02, 2.03, 2.04, 2.05, 2.05, 2.06, 2.05, 2.06,
  2.07,
] as const;
const ncdOneYearSeries = [
  2.08, 2.08, 2.09, 2.09, 2.1, 2.09, 2.1, 2.11, 2.11, 2.12, 2.12, 2.11, 2.12,
  2.13,
] as const;
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

function generateFundStructureBars(count: number, seed: number): number[][] {
  const bars: number[][] = [];
  for (let i = 0; i < count; i++) {
    const row: number[] = [];
    for (let j = 0; j < fundStructureLegendItems.length; j++) {
      const noise = ((i + 1) * 9301 + (j + 1) * 49297 + seed * 233280) % 233280;
      const ratio = noise / 233280;
      row.push(Math.round(180 + ratio * 900));
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
    </div>
  );
}

function TopBar({ currentTime }: { currentTime: Date }) {
  return (
    <header className="border-b border-[#1b2a42] bg-[#0d1726] px-4 py-2 shadow-[inset_0_-1px_0_rgba(74,101,140,0.18)]">
      <div className="flex items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="text-[20px] font-semibold tracking-[0.04em] text-slate-50">
            资金实时行情看板
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
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
        </div>

        <div className="flex items-center gap-3">
          <InfoChip label="DR007" value="2.15%" tone="alert" />
          <InfoChip label="资金情绪" value="51 / 47 / 50 / 49" tone="neutral" />
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
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    );
  }

  function resetDraftRows() {
    setDraftBankRateRows(initialBankRateRows.map((row) => ({ ...row })));
  }

  function saveBankRateRows() {
    setBankRateRows(draftBankRateRows.map((row) => ({ ...row })));
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
            <div className="h-[284px] shrink-0 overflow-hidden">
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
                按机构维护非银利率、银行利率、涨跌和更新时间。
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
            <div className="grid grid-cols-[1.1fr_1fr_1fr_0.9fr_1fr] border-b border-[#22324d] bg-[#111d30] px-4 py-2 text-[11px] font-medium tracking-[0.02em] text-slate-400">
              <span>机构</span>
              <span className="text-right">非银利率</span>
              <span className="text-right">银行利率</span>
              <span className="text-right">涨跌bp</span>
              <span className="text-right">更新时间</span>
            </div>
            {rows.map((row, index) => (
              <div
                key={`${row.institution}-${index}`}
                className={`grid grid-cols-[1.1fr_1fr_1fr_0.9fr_1fr] items-center gap-3 border-b border-[#162439] px-4 py-3 ${
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
                <ModalInput
                  align="right"
                  value={row.deltaBp}
                  onChange={(value) => onChange(index, "deltaBp", value)}
                />
                <ModalInput
                  align="right"
                  value={row.updatedAt}
                  onChange={(value) => onChange(index, "updatedAt", value)}
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
  const [mode, setMode] = useState<"trend" | "table">("trend");

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1e2f48] bg-[#0d1726] shadow-[0_12px_28px_rgba(3,8,18,0.32)]">
      <div className="border-b border-[#18263b] bg-[#101b2c] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold tracking-[0.02em] text-slate-50">
            NCD
          </div>
          <div className="flex items-center gap-2">
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
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden p-2">
        {mode === "trend" ? (
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
        )}
      </div>
    </section>
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
    <div
      className="grid h-full min-h-0 overflow-hidden rounded-xl border border-[#1c2b42] bg-[#0a1322]"
      style={{ gridTemplateRows: `auto repeat(${rowCount}, minmax(0, 1fr))` }}
    >
      <div className="grid grid-cols-[0.7fr_1fr_1fr_0.8fr] border-b border-[#22324d] bg-[#111d30] px-4 py-1.5 text-[11px] font-medium tracking-[0.02em] text-slate-400">
        <span className="text-left">期限</span>
        <span className="text-left">品种</span>
        <span className="text-right">最新</span>
        <span className="text-right">涨跌bp</span>
      </div>
      {paddedRows.map((row, rowIndex) => (
        <div
          key={row ? `${row[1]}-${rowIndex}` : `empty-${rowIndex}`}
          className={`grid grid-cols-[0.7fr_1fr_1fr_0.8fr] items-center px-4 text-sm ${
            rowIndex > 0 ? "border-t border-[#162439]" : ""
          }`}
        >
          {row ? (
            <>
              <span className="font-semibold text-slate-100">{row[0]}</span>
              <span className="font-semibold text-slate-100">{row[1]}</span>
              <span className="text-right font-semibold text-emerald-300">
                {row[2]}
              </span>
              <span
                className={`text-right ${cellClassName(row[3], 1, [], [], [1], [])}`}
              >
                {row[3]}
              </span>
            </>
          ) : (
            <span className="col-span-4" />
          )}
        </div>
      ))}
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
    <div
      className="grid h-full min-h-0 min-w-0 overflow-hidden rounded-xl border border-[#1c2b42] bg-[#0a1322]"
      style={{
        gridTemplateRows: `auto repeat(${displayRows.length}, minmax(0, 1fr))`,
      }}
    >
      <div className="grid grid-cols-4 border-b border-[#22324d] bg-[#111d30] text-[11px] font-medium tracking-[0.02em] text-slate-400">
        {market.columns.map((column, index) => (
          <div
            key={`${market.title}-${column}`}
            className={`px-2 py-1.5 ${
              index === 0 ? "text-left" : "text-right"
            } ${index === 1 ? "truncate" : ""}`}
          >
            {column}
          </div>
        ))}
      </div>
      {displayRows.map((row, rowIndex) => (
        <div
          key={`${market.title}-${row[0]}-${rowIndex}`}
          className={`grid min-h-0 grid-cols-4 border-b border-[#162439] text-xs ${
            rowIndex % 2 === 0 ? "bg-transparent" : "bg-[#0d1726]/55"
          }`}
        >
          {row.map((cell, cellIndex) => (
            <div
              key={`${market.title}-${row[0]}-${cellIndex}`}
              className={`flex min-h-0 items-center px-2 py-1.5 ${
                cellIndex === 0 ? "justify-start" : "justify-end"
              } ${cellIndex === 1 ? "truncate" : ""}`}
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
            </div>
          ))}
        </div>
      ))}
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
        <div className="grid grid-cols-[1.65fr_0.72fr_0.84fr_0.9fr_1.05fr_1fr] border-y border-[#1c3150] bg-[#111d30] px-4 py-1.5 text-[11px] font-medium tracking-[0.02em] text-slate-400">
          <span>分组 / 机构</span>
          <span className="text-right">期限</span>
          <span className="text-right">金额(总量)</span>
          <span className="text-right">利率(均价)</span>
          <span className="text-right">账户要求</span>
          <span className="text-right">质押要求</span>
        </div>
        {section.groups.map((group) => (
          <div key={group.id} className="border-b-2 border-[#1f3759]">
            <div className="grid w-full grid-cols-[1.65fr_0.72fr_0.84fr_0.9fr_1.05fr_1fr] items-center border-l-[3px] border-sky-500/70 bg-gradient-to-r from-[#15294a] via-[#11223c] to-[#0d1a30] px-4 py-2 text-left shadow-[inset_0_-1px_0_rgba(56,113,189,0.25)]">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 rounded-md border border-sky-400/40 bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold tracking-[0.08em] text-sky-200">
                  汇总
                </span>
                <div className="text-sm font-semibold text-slate-50">
                  {group.name}
                </div>
              </div>
              <span aria-hidden="true" />
              <span className="text-right text-sm font-semibold text-slate-100">
                {group.totalAmount}
              </span>
              <span className="text-right text-sm font-semibold text-amber-300">
                {group.averageRate}
              </span>
              <span
                className="truncate pl-3 text-right text-xs text-slate-300"
                title={summarizeAccountRequirements(group.rows)}
              >
                {summarizeAccountRequirements(group.rows)}
              </span>
              <span
                className="truncate pl-3 text-right text-xs text-slate-300"
                title={group.collateral}
              >
                {group.collateral}
              </span>
            </div>
            {displayLevel === 1 ? (
              <div className="divide-y divide-[#152437] bg-[#080f1c]">
                {selectLevel1Rows(group).map((row) => (
                  <div
                    key={row.id}
                    className="grid w-full grid-cols-[1.65fr_0.72fr_0.84fr_0.9fr_1.05fr_1fr] items-center border-l-[3px] border-transparent py-1.5 pl-8 pr-4 text-left text-sm text-slate-200"
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
                  </div>
                ))}
              </div>
            ) : null}
            {displayLevel === 2 ? (
              <div className="divide-y divide-[#152437] bg-[#080f1c]">
                {group.rows.map((row) => (
                  <div
                    key={row.id}
                    className="grid w-full grid-cols-[1.65fr_0.72fr_0.84fr_0.9fr_1.05fr_1fr] items-center border-l-[3px] border-transparent py-1.5 pl-8 pr-4 text-left text-sm text-slate-200 transition hover:bg-[#11253d]"
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
  const [rightLowerTab, setRightLowerTab] = useState<RightLowerTab>("cfets");
  const [spreadLeft, setSpreadLeft] = useState<SpreadProduct>("dr007");
  const [spreadRight, setSpreadRight] = useState<SpreadProduct>("dr001");

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
          onRangeChange={setHistoryRange}
        />
      </div>

      <div className="min-h-0 overflow-hidden">
        <RightLowerPanel
          activeTab={rightLowerTab}
          activeRange={historyRange}
          leftProduct={spreadLeft}
          rightProduct={spreadRight}
          onTabChange={setRightLowerTab}
          onLeftProductChange={setSpreadLeft}
          onRightProductChange={setSpreadRight}
        />
      </div>
    </aside>
  );
}

function RightLowerPanel({
  activeTab,
  activeRange,
  leftProduct,
  rightProduct,
  onTabChange,
  onLeftProductChange,
  onRightProductChange,
}: {
  activeTab: RightLowerTab;
  activeRange: HistoryRange;
  leftProduct: SpreadProduct;
  rightProduct: SpreadProduct;
  onTabChange: (tab: RightLowerTab) => void;
  onLeftProductChange: (product: SpreadProduct) => void;
  onRightProductChange: (product: SpreadProduct) => void;
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
        {activeTab === "cfets" ? <CfetsDailyPanel /> : null}
        {activeTab === "spread" ? (
          <SpreadPanel
            activeRange={activeRange}
            embedded
            leftProduct={leftProduct}
            rightProduct={rightProduct}
            onLeftProductChange={onLeftProductChange}
            onRightProductChange={onRightProductChange}
          />
        ) : null}
        {activeTab === "fund-structure" ? <FundStructurePanel /> : null}
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
  const volumeMax = Math.max(...intradayVolumeSeries);
  const min = Math.min(...intradaySeries, ...(overlaySeries ?? [])) - 0.01;
  const max = Math.max(...intradaySeries, ...(overlaySeries ?? [])) + 0.01;
  const mainPath = buildLinePath(intradaySeries, 680, 178, min, max);
  const areaPath = buildAreaPath(intradaySeries, 680, 178, min, max);
  const overlayPath = overlaySeries
    ? buildLinePath(overlaySeries, 680, 178, min, max)
    : null;

  return (
    <section className="grid h-full min-h-0 grid-rows-[auto_1fr] overflow-hidden rounded-xl border border-[#284164] bg-[#0b1728]">
      <div className="flex items-center justify-between gap-3 border-b border-[#203551] bg-[#101d32] px-3 py-2">
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold text-slate-100">当日分时</div>
          <div className="rounded border border-[#264167] bg-[#13223a] px-1.5 py-0.5 text-[10px] font-medium text-blue-300">
            DR001
          </div>
          <OverlayProductSelect
            value={overlayProduct}
            onChange={onOverlayChange}
          />
        </div>
        <div className="text-xs text-slate-400">盘中加权利率 / 成交量</div>
      </div>
      <div className="grid min-h-0 grid-rows-[68fr_22fr_auto] px-3 pb-2 pt-2">
        <div className="grid min-h-0 grid-cols-[3rem_1fr]">
          <div className="flex flex-col justify-between pr-2 text-right text-[10px] text-slate-400">
            {buildAxisLabels(min, max, 4).map((tick) => (
              <div key={tick}>{tick}</div>
            ))}
          </div>
          <div className="relative min-h-0">
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
              </svg>
            </div>
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
        <div className="grid min-h-0 grid-cols-[3rem_1fr] border-t border-[#1d3250] pt-2">
          <div className="flex flex-col justify-between pr-2 text-right text-[10px] text-slate-400">
            {["900", "600", "300", "0"].map((tick) => (
              <div key={tick}>{tick}</div>
            ))}
          </div>
          <div className="relative min-h-0">
            <div className="absolute inset-x-0 bottom-0 top-0 flex items-end gap-[4px]">
              {intradayVolumeSeries.map((value, index) => (
                <div
                  key={`intraday-vol-${index}`}
                  className="min-w-0 flex-1 rounded-t-[2px]"
                  style={{
                    height: `${(value / volumeMax) * 100}%`,
                    backgroundColor: index % 4 === 0 ? "#3b82f6" : "#275f9f",
                  }}
                />
              ))}
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
  onRangeChange,
}: {
  activeRange: HistoryRange;
  overlayProduct: OverlayProduct;
  onRangeChange: (range: HistoryRange) => void;
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
  const min = Math.min(...dataset.close, ...(overlaySeries ?? [])) - 0.015;
  const max = Math.max(...dataset.close, ...(overlaySeries ?? [])) + 0.015;
  const volumeMax = Math.max(...dataset.volume);
  const mainPath = buildLinePath(dataset.close, 720, 186, min, max);
  const areaPath = buildAreaPath(dataset.close, 720, 186, min, max);
  const overlayPath = overlaySeries
    ? buildLinePath(overlaySeries, 720, 186, min, max)
    : null;

  return (
    <section className="grid h-full min-h-0 grid-rows-[auto_1fr] overflow-hidden rounded-xl border border-[#284164] bg-[#0b1728]">
      <div className="flex items-center justify-between gap-3 border-b border-[#203551] bg-[#101d32] px-3 py-2">
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold text-slate-100">收盘价走势</div>
          <div className="text-xs text-slate-400">
            产品：
            <span className="ml-1 text-slate-200">DR001</span>
          </div>
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
      <div className="grid min-h-0 grid-rows-[68fr_24fr_auto] px-3 pb-2 pt-2">
        <div className="grid min-h-0 grid-cols-[3.25rem_1fr]">
          <div className="flex flex-col justify-between pr-2 text-right text-[10px] text-slate-400">
            {buildAxisLabels(min, max, 4).map((label) => (
              <div key={label}>{label}</div>
            ))}
          </div>
          <div className="relative min-h-0">
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
            </svg>
            <div className="absolute right-2 top-1 flex flex-wrap items-center gap-3 text-[10px] text-slate-300">
              <LegendDot color={chartPalette.blue} label="收盘价" />
              {overlayProduct !== "none" ? (
                <LegendDot
                  color={chartPalette.amber}
                  label={overlayProductLabel(overlayProduct)}
                />
              ) : null}
            </div>
          </div>
        </div>
        <div className="grid min-h-0 grid-cols-[3.25rem_1fr] border-t border-[#1d3250] pt-2">
          <div className="flex flex-col justify-between pr-2 text-right text-[10px] text-slate-400">
            {buildCompactVolumeTicks(volumeMax).map((tick) => (
              <div key={tick}>{tick}</div>
            ))}
          </div>
          <div className="relative min-h-0">
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

function SpreadPanel({
  activeRange,
  embedded = false,
  leftProduct,
  rightProduct,
  onLeftProductChange,
  onRightProductChange,
}: {
  activeRange: HistoryRange;
  embedded?: boolean;
  leftProduct: SpreadProduct;
  rightProduct: SpreadProduct;
  onLeftProductChange: (product: SpreadProduct) => void;
  onRightProductChange: (product: SpreadProduct) => void;
}) {
  const labels = historicalCloseDatasets[activeRange].labels;
  const axisLabels = buildAxisTickLabels(
    labels,
    activeRange === "5d" ? 5 : activeRange === "1m" ? 7 : 8,
  );
  const spreadValues = buildSpreadSeries(
    activeRange,
    leftProduct,
    rightProduct,
  );
  const min = Math.min(...spreadValues, 0) - 1.5;
  const max = Math.max(...spreadValues, 0) + 1.5;
  const zeroLineY = valueToY(0, 180, min, max);

  return (
    <section
      className={`grid h-full min-h-0 grid-rows-[auto_1fr] overflow-hidden ${embedded ? "rounded-lg border border-[#1c2f49] bg-[#0d1726]" : "rounded-xl border border-[#284164] bg-[#0b1728]"}`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-[#203551] bg-[#101d32] px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold text-slate-100">利差</div>
          <SpreadProductSelect
            value={leftProduct}
            onChange={onLeftProductChange}
          />
          <span className="text-sm text-slate-500">-</span>
          <SpreadProductSelect
            value={rightProduct}
            onChange={onRightProductChange}
          />
        </div>
        <div className="text-xs text-slate-400">
          {historyRangeTabs.find((item) => item.id === activeRange)?.label}
        </div>
      </div>
      <div className="grid min-h-0 grid-rows-[1fr_auto] gap-0 px-3 pb-2 pt-2">
        <div className="grid min-h-0 grid-cols-[3.25rem_1fr]">
          <div className="flex flex-col justify-between pr-2 text-right text-[10px] text-slate-400">
            {buildAxisLabels(min, max, 5).map((tick) => (
              <div key={tick}>{tick}</div>
            ))}
          </div>
          <div className="relative min-h-0 overflow-hidden rounded-md border border-dashed border-[#29476e]">
            {[0, 1, 2, 3, 4].map((index) => (
              <div
                key={`spread-grid-${index}`}
                className="absolute inset-x-0 border-t border-dashed border-[#29476e]"
                style={{ top: `${(index / 4) * 100}%` }}
              />
            ))}
            <svg
              className="absolute inset-0 h-full w-full"
              preserveAspectRatio="none"
              viewBox="0 0 720 180"
            >
              <line
                x1="0"
                x2="720"
                y1={zeroLineY}
                y2={zeroLineY}
                stroke="#9fb9df"
                strokeWidth="1.2"
                strokeDasharray="4 4"
              />
              {spreadValues.map((value, index) => {
                const slotWidth = 720 / spreadValues.length;
                const barWidth = Math.min(22, slotWidth * 0.68);
                const x = slotWidth * index + (slotWidth - barWidth) / 2;
                const y =
                  value >= 0 ? valueToY(value, 180, min, max) : zeroLineY;
                const barHeight = Math.max(
                  2,
                  Math.abs(valueToY(value, 180, min, max) - zeroLineY),
                );

                return (
                  <rect
                    key={`spread-bar-${index}`}
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx="2"
                    fill={value >= 0 ? "#ef5a6f" : "#2fc3de"}
                    opacity="0.92"
                  />
                );
              })}
            </svg>
          </div>
        </div>
        <div className="grid grid-cols-[3.25rem_1fr] pt-2">
          <div />
          <div
            className="grid text-[10px] text-slate-400"
            style={{
              gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))`,
            }}
          >
            {axisLabels.map((label, index) => (
              <div
                key={`spread-label-${labels[index]}-${index}`}
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

function CfetsDailyPanel() {
  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_auto_1fr] gap-2">
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        {cfetsSummaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-[#223754] bg-[#0f1a2d] px-3 py-2"
          >
            <div className="text-[11px] text-slate-500">{card.label}</div>
            <div
              className={`mt-1 text-base font-semibold ${card.tone === "good" ? "text-emerald-300" : card.tone === "alert" ? "text-amber-300" : "text-slate-100"}`}
            >
              {card.value}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs xl:grid-cols-4">
        {cfetsDetailRows.map((row) => (
          <div
            key={row[0]}
            className="rounded-lg border border-[#1d3250] bg-[#0d1726] px-3 py-2"
          >
            <div className="text-slate-500">{row[0]}</div>
            <div className="mt-1 font-semibold text-slate-100">{row[1]}</div>
            <div className="mt-1 text-slate-400">{row[2]}</div>
          </div>
        ))}
      </div>
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

function AuxTabPanel({ type }: { type: Exclude<RightLowerTab, "cfets"> }) {
  if (type === "fund-structure") {
    return <FundStructurePanel />;
  }
  return null;
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
      <div className="relative min-h-0 overflow-hidden rounded-md border border-dashed border-[#2f456b]">
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
        </svg>
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

function FundStructurePanel() {
  const yTicks = [5000, 4000, 3000, 2000, 1000, 0] as const;
  const [range, setRange] = useState<FundStructureRange>("14d");
  const { bars, labels } = fundStructureRangeData[range];
  const rangeSummary =
    range === "14d" ? "近14天" : range === "1m" ? "近1月" : "近半年";

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
      <div className="grid min-h-0 grid-cols-[3rem_1fr] gap-2">
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
          <div className="absolute inset-x-3 bottom-2 top-2 flex items-end gap-1.5">
            {bars.map((values, index) => (
              <div
                key={`fund-bar-${range}-${index}`}
                className="flex h-full min-w-0 flex-1 items-end"
              >
                <div className="flex h-full w-full flex-col justify-end overflow-hidden rounded-t-[3px]">
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
                        opacity: 0.9,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
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

function SpreadProductSelect({
  value,
  onChange,
}: {
  value: SpreadProduct;
  onChange: (product: SpreadProduct) => void;
}) {
  return (
    <select
      className="rounded-md border border-[#2a4164] bg-[#0f1b2f] px-2 py-1 text-xs text-slate-200 outline-none"
      value={value}
      onChange={(event) => onChange(event.target.value as SpreadProduct)}
    >
      {spreadProductOptions.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </select>
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
        className={`border-separate border-spacing-0 ${fitToWidth ? "w-full table-fixed" : "min-w-full whitespace-nowrap"} ${
          compact ? "text-xs" : "text-sm"
        }`}
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

function buildSpreadSeries(
  range: HistoryRange,
  leftProduct: SpreadProduct,
  rightProduct: SpreadProduct,
) {
  const leftSeries = buildHistoricalSeries(range, leftProduct);
  const rightSeries = buildHistoricalSeries(range, rightProduct);
  return leftSeries.map((value, index) =>
    Number(((value - rightSeries[index]) * 10000).toFixed(1)),
  );
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
  const close: number[] = [];
  const volume: number[] = [];
  const cursor = new Date("2025-11-04T00:00:00");
  const points = 126;

  while (labels.length < points) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      const index = labels.length;
      const progress = index / (points - 1);

      let baseline: number;
      if (progress < 0.68) {
        baseline = 1.268 - (progress / 0.68) * 0.042;
      } else if (progress < 0.82) {
        baseline = 1.226 - ((progress - 0.68) / 0.14) * 0.011;
      } else {
        baseline = 1.215 + ((progress - 0.82) / 0.18) * 0.021;
      }

      const wave =
        Math.sin(index / 6.2) * 0.0018 + Math.cos(index / 11.5) * 0.0012;
      const value = Number((baseline + wave).toFixed(4));
      const amount = Math.round(
        2280 +
          Math.sin(index / 7.4) * 280 +
          Math.cos(index / 13.3) * 180 +
          progress * 760,
      );

      labels.push(`${cursor.getMonth() + 1}/${cursor.getDate()}`);
      close.push(value);
      volume.push(amount);
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return { labels, close, volume };
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
