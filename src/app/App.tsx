import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  Activity,
  ArrowUpDown,
  BadgePercent,
  Banknote,
  ChevronDown,
  ChevronUp,
  Download,
  Gauge,
  GripHorizontal,
  Landmark,
  LineChart as LineChartIcon,
  Network,
  Pin,
  RefreshCcw,
  Repeat,
  SlidersHorizontal,
  X,
  type LucideIcon,
} from "lucide-react";

type TrendMode = "intraday" | "history" | "comparison";
type SentimentTab = "realtime" | "trend";
type BaseTrendProduct = "r001" | "r007";
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
  | "netInflow"
  | "netInflowAmt"
  | "buyBalance"
  | "sellBalance";
type CfetsBondMetricKey = Exclude<
  CfetsMetricKey,
  "netInflow" | "netInflowAmt" | "buyBalance" | "sellBalance"
>;
type CfetsTrendBlock = { dates: string[]; series: number[][] };

type BankTenor = "ON" | "7D";
type BankRateRow = {
  institution: string;
  tenor: BankTenor;
  nonBankRate: string;
  refNonBankRate: string;
  deltaNonBankBp: string;
  bankRate: string;
  refBankRate: string;
  deltaBp: string;
  updatedAt: string;
  hasQuote: boolean;
};
const BANK_TENOR_LABEL: Record<BankTenor, string> = {
  ON: "隔夜",
  "7D": "7天",
};
const defaultBigBankWhitelist: readonly string[] = [
  "工商银行",
  "建设银行",
  "农业银行",
  "中国银行",
];
const BANK_TENORS: readonly BankTenor[] = ["ON", "7D"];
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

type EntryDisplayMode = "icon" | "compact" | "narrow-summary" | "summary" | "wide-preview";
type ModuleEntryId =
  | "big-bank-price"
  | "xrepo"
  | "exchange-repo"
  | "ncd"
  | "weighted-price"
  | "anonymous-trade"
  | "institution-period"
  | "global-filter"
  | "market-sentiment";
type ActiveFrame = {
  id: ModuleEntryId;
  title: string;
  bank?: string;
  contract?: string;
  cfetsPeriod?: CfetsInstPeriod;
  cfetsMetric?: CfetsMetricKey;
} | null;
type FrameOpenOptions = {
  bank?: string;
  contract?: string;
  cfetsPeriod?: CfetsInstPeriod;
  cfetsMetric?: CfetsMetricKey;
};
type ModuleEntryConfig = {
  id: ModuleEntryId;
  group: string;
  title: string;
  description: string;
  statusText: string;
  icon: LucideIcon;
};
type OverviewTone = "neutral" | "good" | "alert" | "muted";
type ModuleEntryMetric = {
  summary: string;
  badge: string;
  rows: readonly (readonly [string, string])[];
  chips?: readonly {
    label: string;
    value: string;
    tone?: OverviewTone;
  }[];
  detailRows?: readonly (readonly [string, string, string?])[];
  trendValues?: readonly number[];
  trendColor?: string;
  trendLabel?: string;
};
type NarrowRailSummaryItem = {
  id: ModuleEntryId;
  label: string;
  value: string;
  tone?: OverviewTone;
  badge?: string;
  badgeTone?: "warning" | "danger";
};

const integratedPreviewEntryIds = new Set<ModuleEntryId>([
  "big-bank-price",
  "xrepo",
  "exchange-repo",
  "ncd",
]);

const TODAY_STR = "2026-05-10";

const chartPalette = {
  emerald: "var(--tk-color-success)",
  blue: "var(--tk-color-chart-blue)",
  violet: "var(--tk-color-chart-purple)",
  amber: "var(--tk-color-chart-gold)",
  pink: "var(--tk-color-chart-violet)",
  red: "var(--tk-color-danger)",
} as const;

const moduleEntries: readonly ModuleEntryConfig[] = [
  {
    id: "big-bank-price",
    group: "行情摘要",
    title: "今天大行价格",
    description: "大行当日隔夜和 7 天资金价格",
    statusText: "10:53:27",
    icon: Banknote,
  },
  {
    id: "xrepo",
    group: "行情摘要",
    title: "XREPO",
    description: "匿名回购报价、发送与下载",
    statusText: "R001 / R007",
    icon: Repeat,
  },
  {
    id: "exchange-repo",
    group: "行情摘要",
    title: "交易所回购",
    description: "上交所、深交所核心期限行情",
    statusText: "GC001 / R-001",
    icon: Landmark,
  },
  {
    id: "ncd",
    group: "行情摘要",
    title: "NCD",
    description: "一级、二级存单收益率曲线",
    statusText: "1M / 3M / 1Y",
    icon: BadgePercent,
  },
  {
    id: "institution-period",
    group: "趋势分析",
    title: "机构分期限统计",
    description: "期限、指标、机构图例、多线图",
    statusText: "R001",
    icon: Network,
  },
] as const;

const leftRailEntries = moduleEntries.filter(
  (entry) => entry.id !== "institution-period",
);

const narrowRailSummaryItems: readonly NarrowRailSummaryItem[] = [
  { id: "big-bank-price", label: "大行价格", value: "R001 1.58 / 1.66" },
  {
    id: "xrepo",
    label: "XREPO",
    value: "R001 1.58 / 1.66",
    badge: "R001",
    badgeTone: "warning",
  },
  {
    id: "exchange-repo",
    label: "交易所回购",
    value: "GC007 1.55",
    badge: "延迟",
    badgeTone: "warning",
  },
  { id: "ncd", label: "NCD 同业存单", value: "AAA 1M 1.88" },
] as const;

const initialBankRateRows: readonly BankRateRow[] = [
  {
    institution: "工商银行",
    tenor: "ON",
    nonBankRate: "1.95%",
    refNonBankRate: "1.96%",
    deltaNonBankBp: "",
    bankRate: "2.00%",
    refBankRate: "",
    deltaBp: "",
    updatedAt: "10:53:27",
    hasQuote: true,
  },
  {
    institution: "工商银行",
    tenor: "7D",
    nonBankRate: "",
    refNonBankRate: "2.04%",
    deltaNonBankBp: "",
    bankRate: "2.10%",
    refBankRate: "2.12%",
    deltaBp: "",
    updatedAt: "10:53:27",
    hasQuote: true,
  },
  {
    institution: "建设银行",
    tenor: "ON",
    nonBankRate: "1.94%",
    refNonBankRate: "",
    deltaNonBankBp: "",
    bankRate: "",
    refBankRate: "2.00%",
    deltaBp: "",
    updatedAt: "10:53:27",
    hasQuote: true,
  },
  {
    institution: "建设银行",
    tenor: "7D",
    nonBankRate: "",
    refNonBankRate: "",
    deltaNonBankBp: "",
    bankRate: "",
    refBankRate: "",
    deltaBp: "",
    updatedAt: "",
    hasQuote: false,
  },
  {
    institution: "农业银行",
    tenor: "ON",
    nonBankRate: "",
    refNonBankRate: "1.96%",
    deltaNonBankBp: "",
    bankRate: "2.01%",
    refBankRate: "2.00%",
    deltaBp: "",
    updatedAt: "10:53:27",
    hasQuote: true,
  },
  {
    institution: "农业银行",
    tenor: "7D",
    nonBankRate: "",
    refNonBankRate: "",
    deltaNonBankBp: "",
    bankRate: "",
    refBankRate: "",
    deltaBp: "",
    updatedAt: "",
    hasQuote: false,
  },
  {
    institution: "中国银行",
    tenor: "ON",
    nonBankRate: "",
    refNonBankRate: "1.94%",
    deltaNonBankBp: "",
    bankRate: "",
    refBankRate: "2.00%",
    deltaBp: "",
    updatedAt: "",
    hasQuote: false,
  },
  {
    institution: "中国银行",
    tenor: "7D",
    nonBankRate: "",
    refNonBankRate: "2.05%",
    deltaNonBankBp: "",
    bankRate: "",
    refBankRate: "2.11%",
    deltaBp: "",
    updatedAt: "",
    hasQuote: false,
  },
] as const;

const leftSections: readonly (
  | SummaryTableSection
  | ExchangeMarketSplitSection
)[] = [
  {
    layout: "table",
    title: "今天大行价格",
    columns: [
      "机构",
      "期限",
      "非银利率(涨跌)",
      "银行利率(涨跌)",
      "利差",
    ],
    rows: [],
    greenColumns: [2],
    redColumns: [3],
    scrollable: true,
  },
  {
    layout: "table",
    title: "XREPO",
    columns: [
      "合约名称",
      "正回购量(亿)",
      "正回购利率(%)",
      "逆回购利率(%)",
      "逆回购量(亿)",
      "时间",
    ],
    rows: [
      ["R001", "5 (0)", "1.36", "1.25", "1185 (0)", "10:31"],
      ["R001", "-", "-", "1.36", "30 (7)", "10:28"],
      ["R001", "-", "-", "1.38", "70 (62)", "10:25"],
      ["R001_mini", "0.6 (0)", "1.38", "1.30", "12 (0)", "10:30"],
      ["DFR001_mini", "5 (0)", "1.37", "1.38", "47 (34)", "10:29"],
      ["CDR001_mini", "20.6 (0)", "1.40", "1.41", "20 (10)", "10:27"],
      ["R004", "-", "-", "1.42", "3 (0)", "10:22"],
      ["R007", "2 (0)", "1.42", "1.40", "132 (0)", "10:31"],
      ["R007_mini", "-", "-", "-", "-", "--"],
      ["R014", "-", "-", "1.45", "5 (0)", "10:18"],
      ["R014_mini", "-", "-", "-", "-", "--"],
    ],
    greenColumns: [3],
    redColumns: [2],
    emphasisColumns: [1, 4],
    fitToWidth: true,
    columnWidths: ["20%", "16%", "16%", "16%", "16%", "16%"],
    scrollable: true,
  },
  {
    layout: "exchange-split",
    title: "交易所回购",
    markets: [
      {
        id: "sse",
        title: "上交所",
        columns: ["期限", "品种", "最新", "涨跌bp", "时间"],
        rows: [
          ["1天", "GC001", "1.3700", "-1.00", "10:31"],
          ["7天", "GC007", "1.3750", "-1.00", "10:28"],
        ],
        greenColumns: [2],
        deltaColumns: [3],
      },
      {
        id: "szse",
        title: "深交所",
        columns: ["期限", "品种", "最新", "涨跌bp", "时间"],
        rows: [
          ["1天", "R-001", "1.3900", "-1.50", "10:30"],
          ["7天", "R-007", "1.4000", "-0.50", "10:25"],
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
    title: "逆回购",
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
            institution: "太保资产",
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
            collateral: "AAA",
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
            collateral: "AAA",
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
            collateral: "AA+",
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
            collateral: "AA+",
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
            collateral: "AA+",
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
            collateral: "AAA",
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
    title: "正回购",
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
            collateral: "AA+",
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
            collateral: "AAA",
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
            collateral: "AA+",
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
            collateral: "AA+",
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

type AmountFilterUnit = "yi" | "wan";

const overlayProductOptions: Array<{ id: OverlayProduct; label: string }> = [
  { id: "none", label: "不叠加" },
  { id: "dr007", label: "DR007" },
  { id: "gc007", label: "GC007" },
  { id: "r007", label: "R007" },
];

const baseTrendProductOptions: Array<{ id: BaseTrendProduct; label: string }> = [
  { id: "r001", label: "R001" },
  { id: "r007", label: "R007" },
];

const trendProductLabel = (product: BaseTrendProduct) =>
  baseTrendProductOptions.find((option) => option.id === product)?.label ?? "R001";

const compareProductOptions: Array<{ id: CompareProduct; label: string }> = [
  { id: "none", label: "不对比" },
  { id: "dr001", label: "DR001" },
  { id: "dr007", label: "DR007" },
  { id: "gc007", label: "GC007" },
  { id: "r007", label: "R007" },
];

const rightLowerTabs: Array<{ id: RightLowerTab; label: string }> = [
  { id: "inst", label: "机构分期限统计" },
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
  "3/12",
  "3/19",
  "3/25",
  "3/31",
  "4/7",
  "4/14",
  "4/20",
  "4/26",
  "5/2",
  "5/10",
] as const;
const trendPriceTicks = [2.107, 2.028, 1.948, 1.868] as const;
const trendVolumeTicks = ["2k", "1k", "900", "450", "0"] as const;

const clampRateAboveOne = (series: number[]) =>
  series.map((v) => Number(Math.max(1.02, v).toFixed(4)));

const intradaySeries = clampRateAboveOne(randomWalk(1.979, 40, 0.055, 13));
const intradayVolumeSeries = randomWalk(200, 40, 90, 14).map((v) =>
  Math.round(v),
);

// 各品种独立的盘中序列：自有锚点 + 自有日内波动，避免与主线视觉重合
const intradayOverlaySeriesByProduct: Record<
  Exclude<OverlayProduct, "none">,
  number[]
> = {
  dr007: clampRateAboveOne(randomWalk(2.012, 40, 0.04, 71)),
  gc007: clampRateAboveOne(randomWalk(1.852, 40, 0.062, 72)),
  r007: clampRateAboveOne(randomWalk(2.058, 40, 0.052, 73)),
};

function getIntradayRateSeries(product: BaseTrendProduct) {
  return product === "r001"
    ? intradaySeries
    : intradayOverlaySeriesByProduct.r007;
}

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
  { id: "5d", label: "5日" },
  { id: "1m", label: "1M" },
  { id: "6m", label: "半年" },
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
    const labels = ["5/4", "5/5", "5/6", "5/7", "5/8"];
    const close = randomWalk(1.28, 5, 0.18, 1);
    const volume = randomWalk(1620, 5, 180, 2).map((v) => Math.round(v));
    return { labels, close, volume };
  })(),
  "1m": (() => {
    const labels = [
      "4/9",
      "4/10",
      "4/11",
      "4/12",
      "4/13",
      "4/14",
      "4/15",
      "4/16",
      "4/17",
      "4/20",
      "4/21",
      "4/22",
      "4/23",
      "4/24",
      "4/25",
      "4/26",
      "4/27",
      "4/28",
      "4/29",
      "4/30",
      "5/1",
      "5/2",
      "5/3",
      "5/4",
      "5/5",
      "5/6",
      "5/7",
      "5/8",
    ];
    const close = randomWalk(1.236, 28, 0.025, 3);
    const volume = randomWalk(1710, 28, 140, 4).map((v) => Math.round(v));
    return { labels, close, volume };
  })(),
  "6m": buildSixMonthDailyDataset(),
};

// 历史对比品种独立序列：与主线 (dr001) 长度对齐，但用各自的锚点 / 波动 / 种子
const historicalProductAnchors: Record<
  Exclude<OverlayProduct | SpreadProduct, "none" | "dr001">,
  {
    anchor5d: number;
    anchor1m: number;
    anchor6m: number;
    vol5d: number;
    vol1m: number;
    vol6m: number;
    seed: number;
  }
> = {
  dr007: {
    anchor5d: 1.36,
    anchor1m: 1.31,
    anchor6m: 1.5,
    vol5d: 0.15,
    vol1m: 0.028,
    vol6m: 0.012,
    seed: 81,
  },
  gc007: {
    anchor5d: 1.21,
    anchor1m: 1.18,
    anchor6m: 1.42,
    vol5d: 0.2,
    vol1m: 0.035,
    vol6m: 0.018,
    seed: 82,
  },
  r007: {
    anchor5d: 1.42,
    anchor1m: 1.36,
    anchor6m: 1.58,
    vol5d: 0.16,
    vol1m: 0.03,
    vol6m: 0.014,
    seed: 83,
  },
};
const historicalProductSeries: Record<
  HistoryRange,
  Record<Exclude<OverlayProduct | SpreadProduct, "none" | "dr001">, number[]>
> = {
  "5d": {
    dr007: randomWalk(
      historicalProductAnchors.dr007.anchor5d,
      historicalCloseDatasets["5d"].close.length,
      historicalProductAnchors.dr007.vol5d,
      historicalProductAnchors.dr007.seed,
    ),
    gc007: randomWalk(
      historicalProductAnchors.gc007.anchor5d,
      historicalCloseDatasets["5d"].close.length,
      historicalProductAnchors.gc007.vol5d,
      historicalProductAnchors.gc007.seed,
    ),
    r007: randomWalk(
      historicalProductAnchors.r007.anchor5d,
      historicalCloseDatasets["5d"].close.length,
      historicalProductAnchors.r007.vol5d,
      historicalProductAnchors.r007.seed,
    ),
  },
  "1m": {
    dr007: randomWalk(
      historicalProductAnchors.dr007.anchor1m,
      historicalCloseDatasets["1m"].close.length,
      historicalProductAnchors.dr007.vol1m,
      historicalProductAnchors.dr007.seed + 1,
    ),
    gc007: randomWalk(
      historicalProductAnchors.gc007.anchor1m,
      historicalCloseDatasets["1m"].close.length,
      historicalProductAnchors.gc007.vol1m,
      historicalProductAnchors.gc007.seed + 1,
    ),
    r007: randomWalk(
      historicalProductAnchors.r007.anchor1m,
      historicalCloseDatasets["1m"].close.length,
      historicalProductAnchors.r007.vol1m,
      historicalProductAnchors.r007.seed + 1,
    ),
  },
  "6m": {
    dr007: randomWalk(
      historicalProductAnchors.dr007.anchor6m,
      historicalCloseDatasets["6m"].close.length,
      historicalProductAnchors.dr007.vol6m,
      historicalProductAnchors.dr007.seed + 2,
    ),
    gc007: randomWalk(
      historicalProductAnchors.gc007.anchor6m,
      historicalCloseDatasets["6m"].close.length,
      historicalProductAnchors.gc007.vol6m,
      historicalProductAnchors.gc007.seed + 2,
    ),
    r007: randomWalk(
      historicalProductAnchors.r007.anchor6m,
      historicalCloseDatasets["6m"].close.length,
      historicalProductAnchors.r007.vol6m,
      historicalProductAnchors.r007.seed + 2,
    ),
  },
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
  "4/27",
  "4/28",
  "4/29",
  "4/30",
  "5/1",
  "5/2",
  "5/3",
  "5/4",
  "5/5",
  "5/6",
  "5/7",
  "5/8",
  "5/9",
  "5/10",
] as const;
const compactAuxChartLabels = [
  "4/27",
  "4/29",
  "5/1",
  "5/3",
  "5/5",
  "5/7",
  "5/10",
] as const;
const ncdTableRows = [
  ["14D", "2.01%", "+1", "1.99%", "10:53:27"],
  ["1M", "2.03%", "+2", "2.01%", "10:53:27"],
  ["2M", "2.05%", "+1", "2.03%", "10:53:27"],
  ["3M", "2.07%", "+1", "2.05%", "10:53:27"],
  ["6M", "2.11%", "+1", "2.08%", "10:53:27"],
  ["9M", "2.14%", "0", "2.11%", "10:53:27"],
  ["1Y", "2.13%", "-1", "2.10%", "10:53:27"],
  ["18M", "2.16%", "-1", "2.13%", "10:53:27"],
  ["2Y", "2.18%", "-2", "2.15%", "10:53:27"],
  ["3Y", "2.22%", "-2", "2.18%", "10:53:27"],
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
const ncdTrendDates6m = generateTradingDates(TODAY_STR, 130);

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
      className="tdx-terminal-float fixed z-[30] flex h-14 w-14 cursor-grab select-none items-center justify-center active:cursor-grabbing"
    >
      <span className="tk-number text-lg font-bold">42</span>
    </div>
  );
}

const DEFAULT_COLUMN_RATIOS: [number, number, number] = [22, 45, 33];
const COLUMN_RATIOS_KEY = "boardColumnRatios.v6";
const COLUMN_MIN: [number, number, number] = [16, 32, 22];

function clampColumns(
  next: [number, number, number],
): [number, number, number] {
  let [l, m, r] = next;
  // 让总和先归一为 100
  const sum = l + m + r;
  if (sum <= 0) return DEFAULT_COLUMN_RATIOS;
  l = (l / sum) * 100;
  m = (m / sum) * 100;
  r = (r / sum) * 100;
  // 应用最小值约束：缺多少从最大的那一栏借
  const mins = COLUMN_MIN;
  const arr = [l, m, r];
  for (let i = 0; i < 3; i++) {
    if (arr[i] < mins[i]) {
      const need = mins[i] - arr[i];
      arr[i] = mins[i];
      const others = [0, 1, 2]
        .filter((j) => j !== i)
        .sort((a, b) => arr[b] - arr[a]);
      let remaining = need;
      for (const j of others) {
        const avail = arr[j] - mins[j];
        const take = Math.min(avail, remaining);
        arr[j] -= take;
        remaining -= take;
        if (remaining <= 0) break;
      }
    }
  }
  return [arr[0], arr[1], arr[2]];
}

function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [columns, setColumns] = useState<[number, number, number]>(() => {
    if (typeof window === "undefined") return DEFAULT_COLUMN_RATIOS;
    try {
      const raw = window.localStorage.getItem(COLUMN_RATIOS_KEY);
      if (!raw) return DEFAULT_COLUMN_RATIOS;
      const parsed = JSON.parse(raw);
      if (
        Array.isArray(parsed) &&
        parsed.length === 3 &&
        parsed.every((v) => typeof v === "number" && Number.isFinite(v))
      ) {
        return clampColumns([parsed[0], parsed[1], parsed[2]]);
      }
    } catch {
      /* ignore */
    }
    return DEFAULT_COLUMN_RATIOS;
  });
  const [activeFrame, setActiveFrame] = useState<ActiveFrame>(null);
  const [overlayProduct, setOverlayProduct] = useState<OverlayProduct>("none");
  const [historyRange, setHistoryRange] = useState<HistoryRange>("5d");
  const [compareProduct, setCompareProduct] = useState<CompareProduct>("none");
  const [baseProduct, setBaseProduct] = useState<BaseTrendProduct>("r001");
  const [quoteTenorFilter, setQuoteTenorFilter] =
    useState<QuoteTenorFilter>("all");
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(COLUMN_RATIOS_KEY, JSON.stringify(columns));
    } catch {
      /* ignore */
    }
  }, [columns]);

  function startDragSplitter(
    event: React.MouseEvent<HTMLDivElement>,
    boundary: 0 | 1,
  ) {
    event.preventDefault();
    const container = mainRef.current;
    if (!container) return;
    const startX = event.clientX;
    const startCols: [number, number, number] = [...columns] as [
      number,
      number,
      number,
    ];
    const totalWidth = container.getBoundingClientRect().width;
    if (totalWidth <= 0) return;

    function onMove(ev: MouseEvent) {
      const deltaPct = ((ev.clientX - startX) / totalWidth) * 100;
      const next: [number, number, number] = [...startCols] as [
        number,
        number,
        number,
      ];
      if (boundary === 0) {
        next[0] = startCols[0] + deltaPct;
        next[1] = startCols[1] - deltaPct;
      } else {
        next[1] = startCols[1] + deltaPct;
        next[2] = startCols[2] - deltaPct;
      }
      setColumns(clampColumns(next));
    }

    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    }

    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function resetColumns() {
    setColumns(DEFAULT_COLUMN_RATIOS);
  }

  function openFrame(entry: ModuleEntryConfig, options: FrameOpenOptions = {}) {
    setActiveFrame({ id: entry.id, title: entry.title, ...options });
  }

  const gridTemplate = `${columns[0]}% 6px ${columns[1]}% 6px ${columns[2]}%`;
  return (
    <div className="tk-app-shell h-screen w-screen overflow-hidden">
      <div className="flex h-full flex-col">
        <TopBar
          currentTime={currentTime}
          onResetColumns={resetColumns}
        />
        <main
          ref={mainRef}
          className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)] overflow-hidden px-2 pb-1.5 pt-1"
          style={{ gridTemplateColumns: gridTemplate, columnGap: 0 }}
        >
          <LeftInfoColumn />
          <ColumnSplitter onMouseDown={(e) => startDragSplitter(e, 0)} />
          <CenterColumn
            tenorFilter={quoteTenorFilter}
            onTenorFilterChange={setQuoteTenorFilter}
          />
          <ColumnSplitter onMouseDown={(e) => startDragSplitter(e, 1)} />
          <RightChartColumn />
        </main>
      </div>
      {activeFrame ? (
        <PageFrame
          title={activeFrame.title}
          onClose={() => setActiveFrame(null)}
        >
          {activeFrame.id === "big-bank-price" ? (
            <BigBankPriceFrame
              initialBank={activeFrame.bank}
            />
          ) : activeFrame.id === "weighted-price" ? (
            <div className="h-full min-h-0">
              <HistoryClosePanel
                activeRange={historyRange}
                baseProduct={baseProduct}
                overlayProduct={overlayProduct}
                compareProduct={compareProduct}
                onRangeChange={setHistoryRange}
                onBaseProductChange={setBaseProduct}
                onCompareChange={setCompareProduct}
              />
            </div>
          ) : activeFrame.id === "anonymous-trade" ? (
            <div className="h-full min-h-0">
              <IntradayPanel
                baseProduct={baseProduct}
                overlayProduct={overlayProduct}
                onBaseProductChange={setBaseProduct}
                onOverlayChange={setOverlayProduct}
              />
            </div>
          ) : activeFrame.id === "institution-period" ? (
            <div className="tk-panel h-full min-h-0 border p-3">
              <CfetsInstPanel
                initialPeriod={activeFrame.cfetsPeriod}
                initialMetric={activeFrame.cfetsMetric}
              />
            </div>
          ) : activeFrame.id === "xrepo" ? (
            <XrepoFrame
              initialContract={activeFrame.contract}
              tenorFilter={quoteTenorFilter}
            />
          ) : activeFrame.id === "exchange-repo" ? (
            <ExchangeRepoFrame tenorFilter={quoteTenorFilter} />
          ) : activeFrame.id === "ncd" ? (
            <LeftNcdCard tenorFilter={quoteTenorFilter} />
          ) : activeFrame.id === "global-filter" ? (
            <GlobalFilterFrame />
          ) : activeFrame.id === "market-sentiment" ? (
            <MarketSentimentFrame />
          ) : (
            <ReservedModuleFrame />
          )}
        </PageFrame>
      ) : null}
      <FloatingBall />
    </div>
  );
}

function ColumnSplitter({
  onMouseDown,
}: {
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="拖动调整列宽"
      title="拖动调整列宽"
      onMouseDown={onMouseDown}
      className="group relative h-full cursor-col-resize border-l border-[rgba(255,255,255,0.04)] bg-transparent transition-colors hover:bg-[rgba(231,53,58,0.18)]"
      style={{ width: "100%", minWidth: 4 }}
    >
      <span className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-[2px] -translate-x-1/2 -translate-y-1/2 rounded bg-[rgba(255,255,255,0.1)] group-hover:bg-[var(--tdx-red)]" />
    </div>
  );
}

function AdaptiveEntryRail({
  entries,
  activeId,
  onOpen,
  tenorFilter,
}: {
  entries: readonly ModuleEntryConfig[];
  activeId: ModuleEntryId | null;
  onOpen: (entry: ModuleEntryConfig, options?: FrameOpenOptions) => void;
  tenorFilter: QuoteTenorFilter;
}) {
  const railRef = useRef<HTMLElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const node = railRef.current;
    if (!node) return;
    const update = () => setWidth(node.getBoundingClientRect().width);
    update();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }
    const observer = new ResizeObserver(() => {
      setWidth(node.getBoundingClientRect().width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const displayMode: EntryDisplayMode =
    width < 80
      ? "icon"
      : width < 325
        ? "narrow-summary"
        : width <= 400
          ? "summary"
          : "wide-preview";
  const groupedDisplayMode: EntryDisplayMode =
    displayMode === "narrow-summary"
      ? "compact"
      : displayMode;
  const groups = Array.from(new Set(entries.map((entry) => entry.group)));

  return (
    <aside
      ref={railRef}
      className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden pr-1"
    >
      <div className="tk-panel flex min-h-0 flex-1 flex-col overflow-hidden border">
        <div
          className={`tk-panel-header border-b ${
            displayMode === "icon" ? "px-1.5 py-2" : "px-3 py-2.5"
          }`}
        >
          {displayMode === "icon" ? (
            <div className="tk-muted text-center text-micro font-semibold">
              入口
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="tk-title truncate">
                  行情摘要
                </div>
              </div>
              {displayMode === "narrow-summary" ? null : (
                <div className="tk-chip rounded border text-micro">
                  {Math.round(width)}px
                </div>
              )}
            </div>
          )}
        </div>
        <div
          className={`min-h-0 flex-1 overflow-y-auto ${
            displayMode === "icon" ? "p-1.5" : "p-2"
          }`}
        >
          {displayMode === "narrow-summary" ? (
            <NarrowRailSummary
              entries={entries}
              activeId={activeId}
              onOpen={onOpen}
            />
          ) : null}
          {displayMode === "narrow-summary" ? null : displayMode === "icon" ? (
            groups.map((group) => (
              <div
                key={group}
                className={displayMode === "icon" ? "space-y-1.5" : "space-y-2"}
              >
                {entries
                  .filter((entry) => entry.group === group)
                  .map((entry) => (
                    <ModuleEntryItem
                      key={entry.id}
                      entry={entry}
                      active={entry.id === activeId}
                      displayMode={groupedDisplayMode}
                      tenorFilter={tenorFilter}
                      onOpen={(options) => onOpen(entry, options)}
                    />
                  ))}
              </div>
            ))
          ) : (
            <ResizableEntryStack
              entries={entries}
              activeId={activeId}
              displayMode={displayMode}
              tenorFilter={tenorFilter}
              onOpen={onOpen}
            />
          )}
        </div>
      </div>
    </aside>
  );
}

const LEFT_ENTRY_DELTA_KEY = "leftEntryDelta.v3";
const LEFT_ENTRY_COLLAPSED_PX = 38;

const NATURAL_MIN_BY_MODE: Record<EntryDisplayMode, number> = {
  icon: 44,
  compact: 64,
  "narrow-summary": 110,
  summary: 96,
  "wide-preview": 240,
};

const NATURAL_MIN_OVERRIDES: Partial<
  Record<ModuleEntryId, Partial<Record<EntryDisplayMode, number>>>
> = {
  ncd: { "wide-preview": 310, summary: 110, "narrow-summary": 130 },
  xrepo: { "narrow-summary": 130 },
  "institution-period": { "wide-preview": 260 },
};

function getNaturalMinHeight(id: ModuleEntryId, mode: EntryDisplayMode) {
  return NATURAL_MIN_OVERRIDES[id]?.[mode] ?? NATURAL_MIN_BY_MODE[mode];
}

function parseEntryDeltas(raw: string | null): Record<string, number> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const result: Record<string, number> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
        result[key] = Math.round(value);
      }
    }
    return result;
  } catch {
    return {};
  }
}

function loadEntryDeltas(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return parseEntryDeltas(window.localStorage.getItem(LEFT_ENTRY_DELTA_KEY));
  } catch {
    return {};
  }
}

function persistEntryDeltas(deltas: Record<string, number>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LEFT_ENTRY_DELTA_KEY, JSON.stringify(deltas));
  } catch {
    /* ignore */
  }
}

type EntryRuntimeState = { flipped?: boolean };

const FLIPPED_MIN_OVERRIDES: Partial<
  Record<ModuleEntryId, Partial<Record<EntryDisplayMode, number>>>
> = {
  "big-bank-price": { "wide-preview": 540, summary: 280, "narrow-summary": 240 },
  xrepo: { "wide-preview": 360, summary: 260, "narrow-summary": 220 },
};

function slotHeight(
  id: ModuleEntryId,
  mode: EntryDisplayMode,
  deltas: Record<string, number>,
  runtime: Record<string, EntryRuntimeState> = {},
) {
  let base = getNaturalMinHeight(id, mode);
  if (runtime[id]?.flipped) {
    const override = FLIPPED_MIN_OVERRIDES[id]?.[mode];
    if (override !== undefined) base = Math.max(base, override);
  }
  return base + Math.max(0, deltas[id] ?? 0);
}

function ResizableEntryStack({
  entries,
  activeId,
  displayMode,
  tenorFilter,
  onOpen,
}: {
  entries: readonly ModuleEntryConfig[];
  activeId: ModuleEntryId | null;
  displayMode: EntryDisplayMode;
  tenorFilter: QuoteTenorFilter;
  onOpen: (entry: ModuleEntryConfig, options?: FrameOpenOptions) => void;
}) {
  const stackRef = useRef<HTMLDivElement>(null);
  const [collapsedIds, setCollapsedIds] = useState<ReadonlySet<ModuleEntryId>>(
    () => new Set(),
  );
  const [deltas, setDeltas] = useState<Record<string, number>>(() => loadEntryDeltas());
  const [runtime, setRuntime] = useState<Record<string, EntryRuntimeState>>({});

  const handleFlipChange = useCallback(
    (id: ModuleEntryId) => (flipped: boolean) => {
      setRuntime((current) => {
        if ((current[id]?.flipped ?? false) === flipped) return current;
        return { ...current, [id]: { ...current[id], flipped } };
      });
    },
    [],
  );

  useEffect(() => {
    persistEntryDeltas(deltas);
  }, [deltas]);

  function startResize(event: React.MouseEvent<HTMLDivElement>, index: number) {
    event.preventDefault();
    const id = entries[index].id;
    const startY = event.clientY;
    const startDelta = Math.max(0, deltas[id] ?? 0);

    function onMove(ev: MouseEvent) {
      const dragPx = ev.clientY - startY;
      const next = Math.max(0, Math.round(startDelta + dragPx));
      setDeltas((current) =>
        current[id] === next ? current : { ...current, [id]: next },
      );
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

  function resetDelta(id: ModuleEntryId) {
    setDeltas((current) => {
      if (!(id in current)) return current;
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function toggleCollapsed(id: ModuleEntryId) {
    setCollapsedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div ref={stackRef} className="flex h-full min-h-0 flex-col overflow-y-auto pr-1">
      {entries.map((entry, index) => {
        const collapsed = collapsedIds.has(entry.id);
        const Icon = entry.icon;
        const minH = collapsed
          ? LEFT_ENTRY_COLLAPSED_PX
          : slotHeight(entry.id, displayMode, deltas, runtime);

        return (
        <Fragment key={entry.id}>
          <div
            className={`group/entry relative ${collapsed ? "overflow-hidden rounded-lg border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]" : ""}`}
            style={{
              flex: "0 0 auto",
              minHeight: minH,
            }}
          >
            {collapsed ? (
              <button
                className="flex h-full w-full min-w-0 items-center gap-2 px-2.5 text-left text-xs text-slate-300 hover:text-slate-100"
                type="button"
                aria-expanded={false}
                onClick={() => toggleCollapsed(entry.id)}
              >
                <Icon size={14} className="shrink-0 text-[color:var(--tk-color-text-inverse-secondary)]" />
                <span className="min-w-0 flex-1 truncate font-semibold">{entry.title}</span>
                <ChevronDown size={14} className="shrink-0 text-slate-500" />
              </button>
            ) : (
              <>
                <div className="absolute right-1.5 top-1.5 z-30 opacity-70 transition-opacity group-hover/entry:opacity-100">
                  <button
                    className="inline-flex h-5 w-5 items-center justify-center rounded border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] text-slate-400 hover:text-slate-100"
                    type="button"
                    aria-expanded={true}
                    aria-label={`折叠${entry.title}`}
                    title="折叠"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleCollapsed(entry.id);
                    }}
                  >
                    <ChevronUp size={13} />
                  </button>
                </div>
                <ModuleEntryItem
                  entry={entry}
                  active={entry.id === activeId}
                  displayMode={displayMode}
                  tenorFilter={tenorFilter}
                  onOpen={(options) => onOpen(entry, options)}
                  onFlippedChange={handleFlipChange(entry.id)}
                />
              </>
            )}
          </div>
          {index < entries.length - 1 ? (
            <div
              role="separator"
              aria-orientation="horizontal"
              aria-label="调整左侧组件高度"
              title="拖动调整高度，双击恢复自适应"
              className="group relative my-0.5 h-2 shrink-0 cursor-row-resize rounded bg-transparent transition-colors hover:bg-[rgba(231,53,58,0.18)]"
              onMouseDown={(event) => startResize(event, index)}
              onDoubleClick={() => resetDelta(entry.id)}
            >
              <GripHorizontal className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-600 group-hover:text-red-200" size={18} />
            </div>
          ) : null}
        </Fragment>
        );
      })}
    </div>
  );
}

function RailTenorFilter({
  compact,
  value,
  onChange,
}: {
  compact?: boolean;
  value: QuoteTenorFilter;
  onChange: (tenor: QuoteTenorFilter) => void;
}) {
  const options: readonly QuoteTenorFilter[] = ["all", ...QUOTE_TENOR_OPTIONS];

  return (
    <div
      className={`mt-2 flex min-w-0 gap-1 ${
        compact ? "flex-wrap" : "flex-nowrap overflow-x-auto"
      }`}
      aria-label="左侧期限筛选"
    >
      {options.map((tenor) => (
        <button
          key={tenor}
          className={miniChipClass(value === tenor)}
          onClick={() => onChange(tenor)}
          type="button"
          title={tenor === "all" ? "全部期限" : tenor}
        >
          {tenor === "all" ? "全部" : tenor}
        </button>
      ))}
    </div>
  );
}

function NarrowRailSummary({
  entries,
  activeId,
  onOpen,
}: {
  entries: readonly ModuleEntryConfig[];
  activeId: ModuleEntryId | null;
  onOpen: (entry: ModuleEntryConfig, options?: FrameOpenOptions) => void;
}) {
  const items = narrowRailSummaryItems
    .map((item) => ({
      item,
      entry: entries.find((candidate) => candidate.id === item.id),
    }))
    .filter((pair): pair is { item: NarrowRailSummaryItem; entry: ModuleEntryConfig } =>
      Boolean(pair.entry),
    );
  const stackRef = useRef<HTMLDivElement>(null);
  const [institutionPeriod, setInstitutionPeriod] = useState<CfetsInstPeriod>("R001");
  const [institutionMetric, setInstitutionMetric] = useState<CfetsMetricKey>("buyAmt");
  const [inlineXrepoContract, setInlineXrepoContract] = useState<string | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<ReadonlySet<ModuleEntryId>>(
    () => new Set(),
  );
  const [deltas, setDeltas] = useState<Record<string, number>>(() => loadEntryDeltas());
  const [runtime, setRuntime] = useState<Record<string, EntryRuntimeState>>({});

  useEffect(() => {
    setRuntime((current) => {
      const flipped = inlineXrepoContract !== null;
      if ((current["xrepo"]?.flipped ?? false) === flipped) return current;
      return { ...current, xrepo: { ...current["xrepo"], flipped } };
    });
  }, [inlineXrepoContract]);

  useEffect(() => {
    persistEntryDeltas(deltas);
  }, [deltas]);

  function startResize(event: React.MouseEvent<HTMLDivElement>, index: number) {
    event.preventDefault();
    const id = items[index].item.id;
    const startY = event.clientY;
    const startDelta = Math.max(0, deltas[id] ?? 0);

    function onMove(ev: MouseEvent) {
      const dragPx = ev.clientY - startY;
      const next = Math.max(0, Math.round(startDelta + dragPx));
      setDeltas((current) =>
        current[id] === next ? current : { ...current, [id]: next },
      );
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

  function resetDelta(id: ModuleEntryId) {
    setDeltas((current) => {
      if (!(id in current)) return current;
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function toggleCollapsed(id: ModuleEntryId) {
    setCollapsedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div ref={stackRef} className="flex h-full min-h-0 flex-col overflow-y-auto pr-1">
      {items.map(({ item, entry }, index) => {
        const isInstitution = item.id === "institution-period";
        const isXrepo = item.id === "xrepo";
        const collapsed = collapsedIds.has(item.id);
        const Icon = entry.icon;
        const institutionMetricDef = cfetsMetricDefs.find(
          (metric) => metric.key === institutionMetric,
        );
        const displayValue = isInstitution
          ? `${institutionPeriod} · ${institutionMetricDef?.label ?? ""}`
          : item.value;
        const cardClassName = `group w-full min-w-0 rounded border px-3 py-2.5 text-left transition-colors hover:border-[color:var(--tdx-red)] hover:bg-[rgba(231,53,58,0.12)] ${
          activeId === item.id
            ? "tk-selected"
            : "border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]"
        }`;
        const summary = (
          <>
            <div className="flex min-w-0 items-start justify-between gap-2">
              <span className="min-w-0 truncate text-[14px] font-semibold leading-5 text-[color:var(--tdx-text-heading)]">
                {item.label}
              </span>
              {item.badge ? (
                <span
                  className={`shrink-0 rounded-full border px-1.5 py-0.5 text-micro leading-none ${
                    item.badgeTone === "danger"
                      ? "border-[color:rgba(231,53,58,0.45)] bg-[rgba(231,53,58,0.16)] text-[color:var(--tdx-red)]"
                      : "border-[color:rgba(246,180,84,0.45)] bg-[rgba(246,180,84,0.14)] text-[color:var(--tdx-yellow)]"
                  }`}
                >
                  {item.badge}
                </span>
              ) : null}
            </div>
            <div
              className={`mt-1 min-w-0 break-words text-xl font-bold leading-6 ${
                item.tone === "alert"
                  ? "text-[color:var(--tdx-red)]"
                  : "text-[color:var(--tdx-yellow)]"
              }`}
            >
              {displayValue}
            </div>
          </>
        );

        let content: ReactNode;

        if (isXrepo) {
          if (inlineXrepoContract) {
            content = (
              <div
                className={`h-full min-h-0 w-full min-w-0 overflow-hidden rounded border transition-colors ${
                  activeId === item.id
                    ? "tk-selected"
                    : "border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]"
                }`}
              >
                <XrepoHistoryBack
                  compact
                  contractName={inlineXrepoContract}
                  onBack={() => setInlineXrepoContract(null)}
                />
              </div>
            );
          } else {
            content = (
              <button
                type="button"
                aria-label={item.label}
                onClick={() => setInlineXrepoContract("R001")}
                className={`${cardClassName} h-full`}
              >
                {summary}
              </button>
            );
          }
        } else if (isInstitution) {
          const openInstitutionFrame = () =>
            onOpen(entry, {
              cfetsPeriod: institutionPeriod,
              cfetsMetric: institutionMetric,
            });
          content = (
            <div className={`${cardClassName} h-full`}>
              <button
                type="button"
                aria-label={item.label}
                onClick={openInstitutionFrame}
                className="w-full text-left"
              >
                {summary}
              </button>
              <div className="mt-2 grid gap-1.5">
                <select
                  className="tk-field h-7 w-full rounded px-2 text-mini text-slate-100 outline-none"
                  value={institutionPeriod}
                  onChange={(event) => setInstitutionPeriod(event.target.value as CfetsInstPeriod)}
                >
                  {cfetsInstPeriodLabels.map((period) => (
                    <option key={period} value={period}>
                      {period}
                    </option>
                  ))}
                </select>
                <select
                  className="tk-field h-7 w-full rounded px-2 text-mini text-slate-100 outline-none"
                  value={institutionMetric}
                  onChange={(event) => setInstitutionMetric(event.target.value as CfetsMetricKey)}
                >
                  {cfetsMetricDefs.map((metric) => (
                    <option key={metric.key} value={metric.key}>
                      {metric.label}
                    </option>
                  ))}
                </select>
                <button
                  className="tk-button w-full text-mini"
                  onClick={openInstitutionFrame}
                  type="button"
                >
                  打开大图
                </button>
              </div>
            </div>
          );
        } else {
          content = (
            <button
              type="button"
              aria-label={item.label}
              onClick={() => onOpen(entry)}
              className={`${cardClassName} h-full`}
            >
              {summary}
            </button>
          );
        }

        const minH = collapsed
          ? LEFT_ENTRY_COLLAPSED_PX
          : slotHeight(item.id, "narrow-summary", deltas, runtime);

        return (
          <Fragment key={item.id}>
            <div
              className={`group/entry relative ${collapsed ? "overflow-hidden rounded border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]" : ""}`}
              style={{
                flex: "0 0 auto",
                minHeight: minH,
              }}
            >
              {collapsed ? (
                <button
                  className="flex h-full w-full min-w-0 items-center gap-2 px-2.5 text-left text-xs text-slate-300 hover:text-slate-100"
                  type="button"
                  aria-expanded={false}
                  onClick={() => toggleCollapsed(item.id)}
                >
                  <Icon size={14} className="shrink-0 text-[color:var(--tk-color-text-inverse-secondary)]" />
                  <span className="min-w-0 flex-1 truncate font-semibold">{item.label}</span>
                  <ChevronDown size={14} className="shrink-0 text-slate-500" />
                </button>
              ) : (
                <>
                  <div className="absolute right-1.5 top-1.5 z-30 opacity-70 transition-opacity group-hover/entry:opacity-100">
                    <button
                      className="inline-flex h-5 w-5 items-center justify-center rounded border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] text-slate-400 hover:text-slate-100"
                      type="button"
                      aria-expanded={true}
                      aria-label={`折叠${item.label}`}
                      title="折叠"
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleCollapsed(item.id);
                      }}
                    >
                      <ChevronUp size={13} />
                    </button>
                  </div>
                  {content}
                </>
              )}
            </div>
            {index < items.length - 1 ? (
              <div
                role="separator"
                aria-orientation="horizontal"
                aria-label="调整左侧组件高度"
                title="拖动调整高度，双击恢复自适应"
                className="group relative my-0.5 h-2 shrink-0 cursor-row-resize rounded bg-transparent transition-colors hover:bg-[rgba(231,53,58,0.18)]"
                onMouseDown={(event) => startResize(event, index)}
                onDoubleClick={() => resetDelta(item.id)}
              >
                <GripHorizontal className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-600 group-hover:text-red-200" size={18} />
              </div>
            ) : null}
          </Fragment>
        );
      })}
    </div>
  );
}

function AdaptiveEntryRailLegacyUnused({
  entries,
  activeId,
  onOpen,
}: {
  entries: readonly ModuleEntryConfig[];
  activeId: ModuleEntryId | null;
  onOpen: (entry: ModuleEntryConfig, options?: FrameOpenOptions) => void;
}) {
  const railRef = useRef<HTMLElement>(null);
  const width = 0;
  const displayMode: EntryDisplayMode =
    false
      ? "icon"
      : false
        ? "compact"
        : false
          ? "summary"
          : "wide-preview";
  const groups = Array.from(new Set(entries.map((entry) => entry.group)));

  return (
    <aside
      ref={railRef}
      className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden pr-1"
    >
      <div className="tk-panel flex min-h-0 flex-1 flex-col overflow-hidden border">
        <div
          className={`tk-panel-header border-b ${
            displayMode === "icon" ? "px-1.5 py-2" : "px-3 py-2.5"
          }`}
        >
          {displayMode === "icon" ? (
            <div className="tk-muted text-center text-micro font-semibold">
              入口
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="tk-title truncate">
                  行情入口
                </div>
              </div>
              <div className="tk-chip rounded border text-micro">
                {Math.round(width)}px
              </div>
            </div>
          )}
        </div>
        <div
          className={`min-h-0 flex-1 overflow-y-auto ${
            displayMode === "icon" ? "p-1.5" : "p-2"
          }`}
        >
          {displayMode === "summary" ? <RailMarketOverview /> : null}
          {displayMode === "compact" ? (
            <div className="flex min-h-full flex-col justify-evenly gap-2">
              {entries.map((entry) => (
                <ModuleEntryItem
                  key={entry.id}
                  entry={entry}
                  active={entry.id === activeId}
                  displayMode={displayMode}
                  onOpen={(options) => onOpen(entry, options)}
                />
              ))}
            </div>
          ) : (
            groups.map((group) => (
              <div
                key={group}
                className={displayMode === "icon" ? "space-y-1.5" : "space-y-2"}
              >
                {entries
                  .filter((entry) => entry.group === group)
                  .map((entry) => (
                    <ModuleEntryItem
                      key={entry.id}
                      entry={entry}
                      active={entry.id === activeId}
                      displayMode={displayMode}
                      onOpen={(options) => onOpen(entry, options)}
                    />
                  ))}
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}

function ModuleEntryItem({
  entry,
  active,
  displayMode,
  tenorFilter = "all",
  onOpen,
  onFlippedChange,
}: {
  entry: ModuleEntryConfig;
  active: boolean;
  displayMode: EntryDisplayMode;
  tenorFilter?: QuoteTenorFilter;
  onOpen: (options?: FrameOpenOptions) => void;
  onFlippedChange?: (flipped: boolean) => void;
}) {
  const Icon = entry.icon;
  const metric = getModuleEntryData(entry.id, tenorFilter);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  function showPreview() {
    if (displayMode === "wide-preview") return;
    setAnchorRect(buttonRef.current?.getBoundingClientRect() ?? null);
  }

  function hidePreview() {
    setAnchorRect(null);
  }

  const compact = displayMode === "icon" || displayMode === "compact";

  if (displayMode === "wide-preview") {
    if (integratedPreviewEntryIds.has(entry.id)) {
      return (
        <div
          className={`flex h-full min-h-0 w-full flex-col overflow-hidden rounded-lg border transition-colors ${
            active
              ? "tk-selected"
              : "tk-chip"
          }`}
        >
          <ModuleEntryPreview
            id={entry.id}
            tenorFilter={tenorFilter}
            onOpen={onOpen}
            onFlippedChange={onFlippedChange}
          />
        </div>
      );
    }

    return (
      <div
        className={`flex h-full min-h-0 w-full flex-col overflow-hidden rounded-lg border transition-colors ${
          active
            ? "tk-selected"
            : "tk-chip"
        }`}
      >
        <button
          ref={buttonRef}
          type="button"
          aria-label={entry.title}
          onClick={() => onOpen()}
          className="group w-full px-2.5 py-1.5 text-left transition-colors hover:bg-[rgba(231,53,58,0.12)]"
        >
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${
                active
                  ? "border-[color:var(--tdx-red)] bg-[rgba(143,32,38,0.42)] text-[color:var(--tdx-text-heading)]"
                  : "border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] text-[color:var(--tk-color-text-inverse-secondary)]"
              }`}
            >
              <Icon size={15} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="tk-title-sm block truncate">
                {entry.title}
              </span>
            </span>
            <span className="tk-chip shrink-0 rounded border text-micro">
              {metric.badge}
            </span>
          </div>
        </button>
        <div className="flex-1 min-h-0 border-t border-[color:var(--tk-color-border-divider)] p-2">
          <ModuleEntryPreview id={entry.id} tenorFilter={tenorFilter} />
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={entry.title}
        onClick={() => onOpen()}
        onFocus={showPreview}
        onBlur={hidePreview}
        onMouseEnter={showPreview}
        onMouseLeave={hidePreview}
        className={`group w-full min-w-0 overflow-hidden rounded-lg border text-left transition-colors ${
          active
            ? "tk-selected"
            : "tk-chip hover:bg-[rgba(231,53,58,0.12)]"
        } ${
          displayMode === "icon" || displayMode === "compact"
            ? "flex items-center justify-center px-0"
            : "px-2.5 py-1.5"
        } ${
          displayMode === "compact"
            ? "h-16"
            : displayMode === "icon"
              ? "h-11"
              : ""
        }`}
      >
        <div
          className={`flex min-w-0 items-center ${
            displayMode === "icon" || displayMode === "compact"
              ? "justify-center"
              : "gap-2"
          }`}
        >
          <span
            className={`inline-flex shrink-0 items-center justify-center rounded-md border ${
              active
                ? "border-[color:var(--tdx-red)] bg-[rgba(143,32,38,0.42)] text-[color:var(--tdx-text-heading)]"
                : "border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] text-[color:var(--tk-color-text-inverse-secondary)]"
            } ${displayMode === "icon" ? "h-8 w-8" : displayMode === "compact" ? "h-10 w-10" : "h-7 w-7"}`}
          >
            <Icon size={displayMode === "icon" ? 17 : displayMode === "compact" ? 19 : 15} />
          </span>
          {displayMode !== "icon" && displayMode !== "compact" ? (
            <span className="min-w-0 flex-1">
              <span className="tk-title-sm block truncate">
                {entry.title}
              </span>
            </span>
          ) : null}
          {!compact && displayMode !== "wide-preview" ? (
            <span className="tk-chip shrink-0 rounded border text-micro">
              {metric.badge}
            </span>
          ) : null}
        </div>
        {displayMode === "summary" ? (
          <ModuleSummaryOverview
            id={entry.id}
            metric={metric}
            tenorFilter={tenorFilter}
          />
        ) : null}
        {displayMode === "wide-preview" ? (
          <div className="mt-2 border-t border-[color:var(--tk-color-border-divider-dark)] pt-2">
            <ModuleEntryPreview id={entry.id} tenorFilter={tenorFilter} />
          </div>
        ) : null}
      </button>
      {anchorRect ? (
        <EntryPreviewPopover
          anchorRect={anchorRect}
          entry={entry}
          tenorFilter={tenorFilter}
        />
      ) : null}
    </>
  );
}

function RailMarketOverview() {
  const dataset = historicalCloseDatasets["5d"];
  const latest = dataset.close.at(-1) ?? 0;
  const volume = dataset.volume.at(-1) ?? 0;
  const sentiment = Math.round(sentimentTrendData.at(-1)?.total ?? 51);

  return (
    <div className="tk-panel-soft mb-2 rounded border border-[color:var(--tk-color-border-panel)] p-2.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="tk-strong text-mini font-semibold">
          今日概览
        </span>
        <span className="tk-chip rounded border text-micro">
          实时
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <OverviewStat label="DR007" value="2.15%" tone="alert" />
        <OverviewStat label="情绪" value={`${sentiment}`} tone="good" />
        <OverviewStat label="R001" value={`${latest.toFixed(3)}%`} />
        <OverviewStat label="成交" value={`${volume}亿`} tone="muted" />
      </div>
    </div>
  );
}

function OverviewStat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: OverviewTone;
}) {
  return (
    <div className="tk-field min-w-0 rounded px-2 py-1.5">
      <div className="tk-muted truncate text-micro">{label}</div>
      <div className={`tk-number mt-0.5 truncate text-xs font-semibold ${overviewToneClass(tone)}`}>
        {value}
      </div>
    </div>
  );
}

function ModuleSummaryOverview({
  id,
  metric,
  tenorFilter,
}: {
  id: ModuleEntryId;
  metric: ModuleEntryMetric;
  tenorFilter: QuoteTenorFilter;
}) {
  if (id === "xrepo") return <XrepoSummaryOverview tenorFilter={tenorFilter} />;

  return (
    <div className="mt-2 space-y-2 border-t border-[color:var(--tk-color-border-divider-dark)] pt-2">
      {metric.chips?.length ? (
        <div className="grid grid-cols-3 gap-1.5">
          {metric.chips.slice(0, 3).map((chip) => (
            <div
              key={`${chip.label}-${chip.value}`}
              className="tk-field min-w-0 rounded px-2 py-1"
            >
              <div className="tk-muted truncate text-micro">
                {chip.label}
              </div>
              <div
                className={`tk-number mt-0.5 truncate text-mini font-semibold ${overviewToneClass(
                  chip.tone ?? "neutral",
                )}`}
              >
                {chip.value}
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {metric.detailRows?.length ? (
        <div className="space-y-1">
          {metric.detailRows.slice(0, 2).map(([label, value, extra]) => (
            <div
              key={`${label}-${value}`}
              className="tk-field grid grid-cols-[0.9fr_1fr_auto] items-center gap-2 rounded px-2 py-1 text-micro"
            >
              <span className="tk-muted truncate">{label}</span>
              <span className="tk-number tk-strong truncate font-semibold">
                {value}
              </span>
              {extra ? (
                <span className="tk-muted truncate text-right">
                  {extra}
                </span>
              ) : (
                <span />
              )}
            </div>
          ))}
        </div>
      ) : null}
      {metric.trendValues?.length ? (
        <SummarySparkline
          values={metric.trendValues}
          color={metric.trendColor ?? chartPalette.blue}
          label={metric.trendLabel ?? "趋势"}
        />
      ) : null}
    </div>
  );
}

function XrepoSummaryOverview({
  tenorFilter,
}: {
  tenorFilter: QuoteTenorFilter;
}) {
  const section = leftSections.find(
    (item): item is SummaryTableSection =>
      item.layout === "table" && item.title === "XREPO",
  );
  const rows = filterRowsByQuoteTenor(
    xrepoR001Rows(section?.rows ?? []),
    tenorFilter,
    [0],
  ).slice(0, 5);

  return (
    <div className="mt-1 border-t border-[color:var(--tk-color-border-divider-dark)] pt-1">
      <div className="tk-table-shell overflow-hidden rounded border">
        <div className="grid grid-cols-[1.1fr_0.85fr_0.7fr_0.7fr_0.9fr] border-b border-[color:var(--tk-color-border-divider-dark)] bg-[var(--tk-color-surface-dark-soft)] px-1.5 py-0.5 text-micro leading-tight text-[color:var(--tk-color-text-tertiary)]">
          <span className="truncate">合约</span>
          <span className="truncate text-right">正量</span>
          <span className="truncate text-right">正利率</span>
          <span className="truncate text-right">逆利率</span>
          <span className="truncate text-right">逆量</span>
        </div>
        {rows.length ? rows.map((row, index) => (
          <div
            key={`${row[0]}-${index}`}
            className={`grid grid-cols-[1.1fr_0.85fr_0.7fr_0.7fr_0.9fr] items-center gap-1 border-b border-[color:var(--tk-color-border-divider-dark)] px-1.5 py-0.5 text-micro leading-tight last:border-b-0 ${
              index === 0 ? "bg-[rgba(143,32,38,0.24)]" : ""
            }`}
          >
            <span className="tk-strong truncate font-semibold">
              {row[0]}
            </span>
            <span className="tk-number tk-strong truncate text-right">
              {row[1]}
            </span>
            <span className="tk-number tk-negative truncate text-right font-semibold">
              {row[2]}
            </span>
            <span className="tk-number tk-positive truncate text-right font-semibold">
              {row[3]}
            </span>
            <span className="tk-number tk-strong truncate text-right">
              {row[4]}
            </span>
          </div>
        )) : (
          <div className="px-2 py-3 text-center text-micro text-slate-500">
            当前期限暂无报价
          </div>
        )}
      </div>
    </div>
  );
}

function SummarySparkline({
  values,
  color,
  label,
}: {
  values: readonly number[];
  color: string;
  label: string;
}) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 120;
      const y = 28 - ((value - min) / range) * 22;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  const latest = values[values.length - 1];

  return (
    <div className="tk-field rounded px-2 py-1.5">
      <div className="mb-1 flex items-center justify-between gap-2 text-micro">
        <span className="tk-muted truncate">{label}</span>
        <span className="tk-number tk-strong font-semibold">
          {latest.toFixed(latest > 100 ? 0 : 3)}
        </span>
      </div>
      <svg
        className="h-8 w-full overflow-visible"
        viewBox="0 0 120 32"
        preserveAspectRatio="none"
      >
        <path
          d={`${points} L 120 32 L 0 32 Z`}
          fill={color}
          opacity="0.12"
        />
        <path
          d={points}
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}

function overviewToneClass(tone: OverviewTone) {
  if (tone === "good") return "tk-positive";
  if (tone === "alert") return "tk-negative";
  if (tone === "muted") return "tk-muted";
  return "text-[color:var(--tdx-yellow)]";
}

function quoteTenorSuffix(tenor: QuoteTenorFilter) {
  return tenor === "all" ? null : tenor.replace(/^R/, "");
}

function quoteTenorToBankTenor(tenor: QuoteTenorFilter): BankTenor | null {
  if (tenor === "R001") return "ON";
  if (tenor === "R007") return "7D";
  return null;
}

function quoteTenorToNcdPeriod(tenor: QuoteTenorFilter): NcdPeriod {
  if (tenor === "R007") return "3M";
  if (tenor === "R014") return "6M";
  if (tenor === "R021") return "9M";
  if (tenor === "R028") return "1Y";
  return "1M";
}

function textMatchesQuoteTenor(text: string, tenor: QuoteTenorFilter) {
  const suffix = quoteTenorSuffix(tenor);
  if (!suffix) return true;
  const normalized = text.replace(/[-_\s]/g, "").toUpperCase();
  return normalized.includes(suffix);
}

function filterRowsByQuoteTenor<T extends readonly string[]>(
  rows: readonly T[],
  tenor: QuoteTenorFilter,
  columns: readonly number[],
) {
  if (tenor === "all") return [...rows];
  return rows.filter((row) =>
    columns.some((column) => textMatchesQuoteTenor(row[column] ?? "", tenor)),
  );
}

function getModuleEntryData(
  id: ModuleEntryId,
  tenorFilter: QuoteTenorFilter = "all",
): ModuleEntryMetric {
  if (id === "big-bank-price") {
    const rows = initialBankRateRows.filter(
      (row) => row.institution === "工商银行",
    );
    const on = rows.find((row) => row.tenor === "ON");
    const seven = rows.find((row) => row.tenor === "7D");
    return {
      summary: `ON 非银 ${on?.nonBankRate ?? "-"} / 银行 ${on?.bankRate ?? "-"} · 7D ${seven?.nonBankRate ?? "-"}`,
      badge: on?.updatedAt.slice(0, 5) ?? "实时",
      rows: rows.length ? rows.map((row) => [
        `工商 ${BANK_TENOR_LABEL[row.tenor]}`,
        `非银 ${row.nonBankRate || "-"} / 银行 ${row.bankRate || "-"}`,
      ]) : [
        ["大行", "暂无数据"],
      ],
      chips: rows.length ? rows.map((row) => ({
        label: BANK_TENOR_LABEL[row.tenor],
        value: row.nonBankRate || "-",
        tone: "good" as const,
      })).slice(0, 3) : [
        { label: "大行", value: "暂无", tone: "muted" as const },
      ],
      detailRows: rows.length ? rows.map((row) => [
        `工商 ${BANK_TENOR_LABEL[row.tenor]}`,
        row.nonBankRate || "-",
        `银行 ${row.bankRate || "-"}`,
      ]) : [
        ["大行", "暂无数据"],
      ],
    };
  }

  if (id === "xrepo") {
    const section = leftSections.find(
      (item): item is SummaryTableSection =>
        item.layout === "table" && item.title === "XREPO",
    );
    const rows = filterRowsByQuoteTenor(
      xrepoR001Rows(section?.rows ?? []),
      tenorFilter,
      [0],
    );
    const first = rows[0];
    const mini = rows.find((row) => row[0]?.includes("mini"));
    const label = tenorFilter === "all" ? first?.[0] ?? "XREPO" : tenorFilter;
    return {
      summary: first
        ? `${label} 正 ${first[1]}@${first[2]} · 逆 ${first[4]}@${first[3]}`
        : `${label} 相关报价待更新`,
      badge: label,
      rows: rows.length ? [
        [label, first ? `正 ${first[1]}@${first[2]} / 逆 ${first[4]}@${first[3]}` : "-"],
        [mini?.[0] ?? `${label}-mini`, mini ? `正 ${mini[1]}@${mini[2]} / 逆 ${mini[4]}@${mini[3]}` : "-"],
      ] : [
        [label, "暂无报价"],
      ],
      chips: [
        { label: "正利率", value: first?.[2] ?? "-", tone: "alert" },
        { label: "逆利率", value: first?.[3] ?? "-", tone: "good" },
        { label: "逆量", value: first?.[4] ?? "-", tone: "neutral" },
      ],
      detailRows: rows.length ? [
        [label, first ? `正 ${first[1]} / 逆 ${first[4]}` : "-", first ? `${first[2]} / ${first[3]}` : undefined],
        [mini?.[0] ?? `${label}-mini`, mini ? `正 ${mini[1]} / 逆 ${mini[4]}` : "-", mini ? `${mini[2]} / ${mini[3]}` : undefined],
      ] : [
        [label, "暂无报价"],
      ],
    };
  }

  if (id === "exchange-repo") {
    const section = leftSections.find(
      (item): item is ExchangeMarketSplitSection => item.layout === "exchange-split",
    );
    const rows = filterRowsByQuoteTenor(
      section?.markets.flatMap((market) => market.rows) ?? [],
      tenorFilter,
      [1],
    );
    const first = rows[0];
    const second = rows[1];
    const label = tenorFilter === "all" ? "双市" : tenorFilter;
    return {
      summary: first
        ? `${first[1]} ${first[2]}(${first[3]}bp)${second ? ` · ${second[1]} ${second[2]}(${second[3]}bp)` : ""}`
        : `${label} 暂无交易所行情`,
      badge: label,
      rows: rows.length ? rows.slice(0, 3).map((row) => [
        row[1],
        `${row[2]} / ${row[3]}bp`,
      ]) : [
        [label, "暂无数据"],
      ],
      chips: rows.length ? rows.slice(0, 3).map((row) => ({
        label: row[1],
        value: row[2],
        tone: "good" as const,
      })) : [
        { label, value: "暂无", tone: "muted" as const },
      ],
      detailRows: rows.length ? rows.slice(0, 2).map((row) => [
        row[1].startsWith("GC") ? "上交所" : "深交所",
        `${row[1]} ${row[2]}`,
        `${row[3]}bp`,
      ]) : [
        [label, "暂无数据"],
      ],
    };
  }

  if (id === "ncd") {
    const ncdPeriod = quoteTenorToNcdPeriod(tenorFilter);
    const periodIndex = ncdPrimaryPeriods.indexOf(ncdPeriod as NcdPeriod);
    const oneMonth = ncdTrendSeries.at(-1) ?? 0;
    const threeMonth = ncdThreeMonthSeries.at(-1) ?? 0;
    const oneYear = ncdOneYearSeries.at(-1) ?? 0;
    const mappedValue =
      ncdPeriod === "1M"
        ? oneMonth
        : ncdPeriod === "3M"
          ? threeMonth
          : ncdPeriod === "1Y"
            ? oneYear
            : oneMonth + Math.max(periodIndex, 0) * 0.025;
    return {
      summary:
        tenorFilter === "all"
          ? `1M ${oneMonth.toFixed(3)}% · 3M ${threeMonth.toFixed(3)}% · 1Y ${oneYear.toFixed(3)}%`
          : `${tenorFilter} 映射 ${ncdPeriod} ${mappedValue.toFixed(3)}%`,
      badge: tenorFilter === "all" ? "近14日" : ncdPeriod,
      rows: tenorFilter === "all" ? [
        ["1M", `${oneMonth.toFixed(3)}%`],
        ["3M", `${threeMonth.toFixed(3)}%`],
        ["1Y", `${oneYear.toFixed(3)}%`],
      ] : [
        [ncdPeriod, `${mappedValue.toFixed(3)}%`],
        ["映射筛选", tenorFilter],
      ],
      chips: tenorFilter === "all" ? [
        { label: "1M", value: `${oneMonth.toFixed(3)}%`, tone: "neutral" },
        { label: "3M", value: `${threeMonth.toFixed(3)}%`, tone: "neutral" },
        { label: "1Y", value: `${oneYear.toFixed(3)}%`, tone: "neutral" },
      ] : [
        { label: ncdPeriod, value: `${mappedValue.toFixed(3)}%`, tone: "neutral" },
        { label: "口径", value: "一级", tone: "muted" },
      ],
      trendValues: ncdTrendSeries,
      trendColor: chartPalette.amber,
      trendLabel: `一级 ${ncdPeriod}`,
    };
  }

  if (id === "weighted-price") {
    const dataset = historicalCloseDatasets["5d"];
    const latest = dataset.close.at(-1) ?? 0;
    const prev = dataset.close.at(-2) ?? latest;
    const volume = dataset.volume.at(-1) ?? 0;
    const bp = ((latest - prev) * 100).toFixed(1);
    return {
      summary: `R001 ${latest.toFixed(3)}% · ${bp.startsWith("-") ? "" : "+"}${bp}bp · 量 ${volume}亿`,
      badge: "5日",
      rows: [
        ["最新加权", `${latest.toFixed(3)}%`],
        ["较前日", `${bp.startsWith("-") ? "" : "+"}${bp}bp`],
        ["成交量", `${volume}亿`],
      ],
      chips: [
        { label: "最新", value: `${latest.toFixed(3)}%`, tone: "neutral" },
        { label: "变化", value: `${bp.startsWith("-") ? "" : "+"}${bp}bp`, tone: bp.startsWith("-") ? "good" : "alert" },
        { label: "量", value: `${volume}亿`, tone: "muted" },
      ],
      trendValues: dataset.close,
      trendColor: chartPalette.blue,
      trendLabel: "R001 5D",
    };
  }

  if (id === "anonymous-trade") {
    const latest = intradaySeries.at(-1) ?? 0;
    const prev = intradaySeries.at(-2) ?? latest;
    const volume = intradayVolumeSeries.at(-1) ?? 0;
    const bp = ((latest - prev) * 100).toFixed(1);
    return {
      summary: `R001 ${latest.toFixed(3)}% · ${bp.startsWith("-") ? "" : "+"}${bp}bp · 成交 ${volume}亿`,
      badge: "日内",
      rows: [
        ["最新成交", `${latest.toFixed(3)}%`],
        ["上一点位", `${prev.toFixed(3)}%`],
        ["成交量", `${volume}亿`],
      ],
      chips: [
        { label: "最新", value: `${latest.toFixed(3)}%`, tone: "neutral" },
        { label: "变化", value: `${bp.startsWith("-") ? "" : "+"}${bp}bp`, tone: bp.startsWith("-") ? "good" : "alert" },
        { label: "成交", value: `${volume}亿`, tone: "muted" },
      ],
      trendValues: intradaySeries,
      trendColor: chartPalette.violet,
      trendLabel: "日内 R001",
    };
  }

  if (id === "institution-period") {
    return {
      summary: "R001 大行买入1.92% · 基金融入1500亿 · 净融入+420亿",
      badge: "R001",
      rows: [
        ["大行", "买入利率 1.92%"],
        ["基金", "融入 1500亿"],
        ["全市场", "净融入 +420亿"],
      ],
      chips: [
        { label: "大行", value: "1.92%", tone: "good" },
        { label: "基金", value: "1500亿", tone: "muted" },
        { label: "净融入", value: "+420亿", tone: "alert" },
      ],
      detailRows: [
        ["大行", "买入 1.92%", "卖出 2.05%"],
        ["基金", "融入 1500亿", "净 +420亿"],
      ],
    };
  }

  if (id === "global-filter") {
    return {
      summary: `金额 ${topBoardFilters.amountMin}-${topBoardFilters.amountMax}亿 · 利率 ${topBoardFilters.rateMin}-${topBoardFilters.rateMax}%`,
      badge: "筛选",
      rows: [
        ["金额", `${topBoardFilters.amountMin} - ${topBoardFilters.amountMax}亿`],
        ["利率", `${topBoardFilters.rateMin} - ${topBoardFilters.rateMax}%`],
      ],
      chips: [
        { label: "金额", value: "0-不限", tone: "muted" },
        { label: "利率", value: "0.00-不限", tone: "muted" },
      ],
      detailRows: [
        ["金额范围", `${topBoardFilters.amountMin}-${topBoardFilters.amountMax}亿`, "已应用"],
        ["利率范围", `${topBoardFilters.rateMin}-${topBoardFilters.rateMax}%`, "已应用"],
      ],
    };
  }

  return {
    summary: "DR007 2.15% · 资金情绪 51 · 平衡",
    badge: "平衡",
    rows: [
      ["DR007", "2.15%"],
      ["资金情绪", "51 / 平衡"],
    ],
    chips: [
      { label: "DR007", value: "2.15%", tone: "alert" },
      { label: "情绪", value: "51", tone: "neutral" },
      { label: "状态", value: "平衡", tone: "good" },
    ],
    trendValues: sentimentTrendData.map((item) => item.total),
    trendColor: chartPalette.emerald,
    trendLabel: "情绪指数",
  };
}

function EntryPreviewPopover({
  anchorRect,
  entry,
  tenorFilter = "all",
}: {
  anchorRect: DOMRect;
  entry: ModuleEntryConfig;
  tenorFilter?: QuoteTenorFilter;
}) {
  const Icon = entry.icon;
  const metric = getModuleEntryData(entry.id, tenorFilter);
  const width = 260;
  const gap = 8;
  const canOpenRight = anchorRect.right + gap + width <= window.innerWidth - 8;
  const left = canOpenRight
    ? anchorRect.right + gap
    : Math.max(8, anchorRect.left - width - gap);
  const top = Math.min(
    Math.max(8, anchorRect.top - 8),
    window.innerHeight - 132,
  );

  return (
    <div
      className="tdx-terminal-tooltip pointer-events-none fixed z-[80] p-3 text-xs"
      style={{ left, top, width }}
    >
      <div className="flex items-start gap-2">
        <Icon className="tk-warning mt-0.5 shrink-0" size={16} />
        <div className="min-w-0">
          <div className="font-semibold text-slate-50">{entry.title}</div>
          <div className="mt-1 leading-5 text-slate-400">{metric.summary}</div>
          <div className="mt-2 space-y-1">
            {metric.rows.map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-3 rounded border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-muted)] px-2 py-1"
              >
                <span className="text-slate-500">{label}</span>
                <span className="font-mono font-semibold text-slate-200">
                  {value}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 inline-flex rounded border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-muted)] px-2 py-0.5 text-mini text-slate-300">
            {metric.badge}
          </div>
        </div>
      </div>
    </div>
  );
}

function IntegratedPreviewHeader({
  id,
  onOpen,
  actions,
  tenorFilter = "all",
}: {
  id: ModuleEntryId;
  onOpen?: (options?: FrameOpenOptions) => void;
  actions?: ReactNode;
  tenorFilter?: QuoteTenorFilter;
}) {
  const entry = moduleEntries.find((item) => item.id === id);
  const metric = getModuleEntryData(id, tenorFilter);
  if (!entry) return null;
  const Icon = entry.icon;

  return (
    <div className="tk-panel-header border-b px-2.5 py-1.5">
      <div className="flex min-w-0 items-center gap-2">
        <button
          className="group flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-0.5 text-left transition-colors hover:bg-[rgba(231,53,58,0.12)]"
          onClick={() => onOpen?.()}
          type="button"
        >
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] text-[color:var(--tk-color-text-inverse-secondary)]">
            <Icon size={15} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="tk-title block truncate">
              {entry.title}
            </span>
          </span>
        </button>
        <span className="tk-chip shrink-0 rounded border text-micro">
          {metric.badge}
        </span>
        {actions ? (
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ModuleEntryPreview({
  id,
  tenorFilter = "all",
  onOpen,
  onFlippedChange,
}: {
  id: ModuleEntryId;
  tenorFilter?: QuoteTenorFilter;
  onOpen?: (options?: FrameOpenOptions) => void;
  onFlippedChange?: (flipped: boolean) => void;
}) {
  if (id === "big-bank-price") {
    return (
      <RichPreviewFrame heightClassName="h-full">
        <BigBankPriceFrame
          embeddedPreview
          onOpen={onOpen}
          onFlippedChange={onFlippedChange}
        />
      </RichPreviewFrame>
    );
  }

  if (id === "xrepo") {
    return (
      <RichPreviewFrame heightClassName="h-full">
        <XrepoFrame
          embeddedPreview
          tenorFilter={tenorFilter}
          onOpen={onOpen}
          onFlippedChange={onFlippedChange}
        />
      </RichPreviewFrame>
    );
  }

  if (id === "exchange-repo") {
    return (
      <RichPreviewFrame heightClassName="h-full">
        <ExchangeRepoFrame
          embeddedPreview
          tenorFilter={tenorFilter}
          onOpen={onOpen}
        />
      </RichPreviewFrame>
    );
  }

  if (id === "ncd") {
    return (
      <RichPreviewFrame heightClassName="h-full">
        <LeftNcdCard
          embeddedPreview
          tenorFilter={tenorFilter}
          onOpen={onOpen}
        />
      </RichPreviewFrame>
    );
  }

  if (id === "weighted-price") {
    return <WeightedPriceEntryPreview />;
  }

  if (id === "anonymous-trade") {
    return <AnonymousTradeEntryPreview />;
  }

  if (id === "institution-period") {
    return (
      <RichPreviewFrame heightClassName="h-[190px]">
        <InstitutionPeriodEntryPreview onOpen={onOpen} />
      </RichPreviewFrame>
    );
  }

  if (id === "global-filter") {
    return (
      <RichPreviewFrame heightClassName="h-[190px]" scrollX>
        <div className="h-full min-w-[540px]">
          <GlobalFilterFrame />
        </div>
      </RichPreviewFrame>
    );
  }

  return (
    <RichPreviewFrame heightClassName="h-[220px]">
      <div className="h-full min-w-0">
        <MarketSentimentFrame />
      </div>
    </RichPreviewFrame>
  );
}

function WeightedPriceEntryPreview() {
  const [activeRange, setActiveRange] = useState<HistoryRange>("5d");
  const [compareProduct, setCompareProduct] = useState<CompareProduct>("none");
  const [baseProduct, setBaseProduct] = useState<BaseTrendProduct>("r001");
  return (
    <RichPreviewFrame heightClassName="h-[260px]">
      <HistoryClosePanel
        activeRange={activeRange}
        baseProduct={baseProduct}
        overlayProduct="none"
        compareProduct={compareProduct}
        onRangeChange={setActiveRange}
        onBaseProductChange={setBaseProduct}
        onCompareChange={setCompareProduct}
      />
    </RichPreviewFrame>
  );
}

function AnonymousTradeEntryPreview() {
  const [overlayProduct, setOverlayProduct] = useState<OverlayProduct>("none");
  const [baseProduct, setBaseProduct] = useState<BaseTrendProduct>("r001");
  return (
    <RichPreviewFrame heightClassName="h-[235px]">
      <IntradayPanel
        baseProduct={baseProduct}
        overlayProduct={overlayProduct}
        onBaseProductChange={setBaseProduct}
        onOverlayChange={setOverlayProduct}
      />
    </RichPreviewFrame>
  );
}

function InstitutionPeriodEntryPreview({
  onOpen,
}: {
  onOpen?: (options?: FrameOpenOptions) => void;
}) {
  const [period, setPeriod] = useState<CfetsInstPeriod>("R001");
  const [metricKey, setMetricKey] = useState<CfetsMetricKey>("buyAmt");
  const metric = cfetsMetricDefs.find((item) => item.key === metricKey);
  const openWithCurrentFilters = () =>
    onOpen?.({ cfetsPeriod: period, cfetsMetric: metricKey });

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_1fr_auto] gap-2 rounded-xl border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] p-2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="tk-title-sm truncate">
            机构分期限统计
          </div>
          <div className="tk-muted mt-0.5 truncate text-micro">
            期限与指标作为大图默认参数
          </div>
        </div>
        <button
          className="tk-button text-micro"
          onClick={openWithCurrentFilters}
          type="button"
        >
          打开大图
        </button>
      </div>
      <div className="grid content-start gap-2">
        <label className="grid gap-1 text-micro text-slate-400">
          <span>期限</span>
          <select
            className="tk-field h-7 rounded px-2 text-xs text-slate-100 outline-none"
            value={period}
            onChange={(event) => setPeriod(event.target.value as CfetsInstPeriod)}
          >
            {cfetsInstPeriodLabels.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-micro text-slate-400">
          <span>指标</span>
          <select
            className="tk-field h-7 rounded px-2 text-xs text-slate-100 outline-none"
            value={metricKey}
            onChange={(event) => setMetricKey(event.target.value as CfetsMetricKey)}
          >
            {cfetsMetricDefs.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid grid-cols-3 gap-1 text-micro">
        <InfoPill label="期限" value={period} />
        <InfoPill label="指标" value={metric?.label ?? "-"} />
        <InfoPill label="视图" value="大弹窗" />
      </div>
    </div>
  );
}

function RichPreviewFrame({
  children,
  heightClassName = "",
  scrollX = false,
  autoHeight = false,
}: {
  children: React.ReactNode;
  heightClassName?: string;
  scrollX?: boolean;
  autoHeight?: boolean;
}) {
  return (
    <div
      className={`min-h-0 rounded-lg ${autoHeight ? "h-auto" : heightClassName} ${
        autoHeight
          ? scrollX
            ? "overflow-x-auto overflow-y-visible"
            : "overflow-visible"
          : scrollX
            ? "overflow-x-auto overflow-y-hidden"
            : "overflow-hidden"
      }`}
    >
      {children}
    </div>
  );
}

function MiniPreviewTable({
  columns,
  rows,
}: {
  columns: readonly string[];
  rows: readonly (readonly string[])[];
}) {
  return (
    <div className="tk-table-shell overflow-hidden rounded border">
      <div
        className="grid border-b border-[color:var(--tk-color-border-divider-dark)] bg-[var(--tk-color-surface-dark-soft)] text-micro text-[color:var(--tk-color-text-tertiary)]"
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
      >
        {columns.map((column) => (
          <div key={column} className="truncate px-1.5 py-1">
            {column}
          </div>
        ))}
      </div>
      {rows.map((row, rowIndex) => (
        <div
          key={`${row[0]}-${rowIndex}`}
          className="tk-strong grid text-micro"
          style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
        >
          {row.map((cell, cellIndex) => (
            <div
              key={`${cell}-${cellIndex}`}
              className={`truncate px-1.5 py-1 ${
                cellIndex > 1 ? "tk-number tk-positive" : ""
              }`}
            >
              {cell}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function MiniSparklinePreview({
  label,
  values,
  color,
  footnote,
}: {
  label: string;
  values: readonly number[];
  color: string;
  footnote: string;
}) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 156;
      const y = 42 - ((value - min) / range) * 34;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="min-w-0 overflow-hidden rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] p-2">
      <div className="mb-1 flex items-center justify-between gap-2 text-micro">
        <span className="truncate font-semibold text-slate-300">{label}</span>
        <span className="font-mono text-slate-500">
          {values[values.length - 1].toFixed(3)}%
        </span>
      </div>
      <svg
        className="h-[46px] w-full overflow-visible"
        viewBox="0 0 156 46"
        preserveAspectRatio="none"
      >
        <path
          d={`${points} L 156 46 L 0 46 Z`}
          fill={color}
          opacity="0.12"
        />
        <path
          d={points}
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
      <div className="mt-1 truncate text-micro text-slate-500">{footnote}</div>
    </div>
  );
}

function MiniInstitutionSeriesPreview({
  label,
  series,
  xLabels,
  chartType,
  unit,
  footnote,
}: {
  label: string;
  series: Array<{ key: string; label: string; color: string; values: readonly number[] }>;
  xLabels?: readonly string[];
  chartType: "line" | "stackedBar" | "divergeBar";
  unit: string;
  footnote: string;
}) {
  const [hiddenKeys, setHiddenKeys] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );
  const [tooltipState, setTooltipState] = useState<{
    index: number;
    clientX: number;
    clientY: number;
  } | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartSize, setChartSize] = useState({ width: 260, height: 120 });
  const visibleSeries = series.filter((item) => !hiddenKeys.has(item.key));
  const plottedSeries = visibleSeries.length ? visibleSeries : series;
  const showAsStackedBars = chartType !== "line";
  const dailyTotals = (plottedSeries[0]?.values ?? []).map((_, index) =>
    plottedSeries.reduce((sum, item) => sum + Math.max(0, item.values[index] ?? 0), 0),
  );
  const allValues = showAsStackedBars
    ? dailyTotals.filter((value) => value > 0)
    : plottedSeries.flatMap((item) => item.values).filter((value) => value > 0);
  const min = showAsStackedBars ? 0 : allValues.length ? Math.min(...allValues) : 0;
  const max = allValues.length ? Math.max(...allValues) : 1;
  const range = max - min || 1;
  const width = Math.max(120, Math.round(chartSize.width));
  const height = Math.max(70, Math.round(chartSize.height));
  const plotLeft = unit === "%" ? 40 : unit === "亿" || unit === "万" ? 44 : 36;
  const plotRight = 10;
  const plotTop = 10;
  const plotBottom = 20;
  const plotWidth = Math.max(20, width - plotLeft - plotRight);
  const plotHeight = Math.max(20, height - plotTop - plotBottom);
  const yAxisLabels = buildAxisLabels(min, max, 4);
  const pointCount = plottedSeries[0]?.values.length ?? 1;
  const tooltipIndex = tooltipState?.index ?? null;
  const tooltipX =
    tooltipIndex === null
      ? null
      : showAsStackedBars
        ? plotLeft + ((tooltipIndex + 0.5) / Math.max(pointCount, 1)) * plotWidth
        : plotLeft + (tooltipIndex / Math.max(pointCount - 1, 1)) * plotWidth;
  const tooltipTotal =
    tooltipIndex === null
      ? 0
      : showAsStackedBars
        ? dailyTotals[tooltipIndex] ?? 0
        : plottedSeries.reduce((sum, item) => sum + Math.max(0, item.values[tooltipIndex] ?? 0), 0);
  const tooltipRows =
    tooltipIndex === null
      ? []
      : plottedSeries
          .map((item) => ({
            ...item,
            value: item.values[tooltipIndex] ?? 0,
          }))
          .filter((item) => item.value > 0)
          .sort((a, b) => b.value - a.value);
  const xLabelIndexes = [0, Math.floor(pointCount / 2), Math.max(pointCount - 1, 0)];
  useEffect(() => {
    const node = chartRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const updateSize = () => {
      const rect = node.getBoundingClientRect();
      setChartSize((current) => {
        const next = {
          width: Math.max(120, Math.round(rect.width)),
          height: Math.max(70, Math.round(rect.height)),
        };
        return current.width === next.width && current.height === next.height
          ? current
          : next;
      });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  function toggleSeries(key: string) {
    setHiddenKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function buildPreviewPath(values: readonly number[]) {
    return values
      .map((value, index) => {
        const x = plotLeft + (index / Math.max(values.length - 1, 1)) * plotWidth;
        const y = plotTop + plotHeight - ((value - min) / range) * plotHeight;
        return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }

  function handlePreviewMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = chartRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || pointCount <= 0) return;
    const viewX = ((event.clientX - rect.left) / rect.width) * width;
    const clampedX = Math.max(plotLeft, Math.min(plotLeft + plotWidth, viewX));
    const ratio = (clampedX - plotLeft) / Math.max(plotWidth, 1);
    const index = showAsStackedBars
      ? Math.min(pointCount - 1, Math.max(0, Math.floor(ratio * pointCount)))
      : Math.min(pointCount - 1, Math.max(0, Math.round(ratio * (pointCount - 1))));
    setTooltipState({ index, clientX: event.clientX, clientY: event.clientY });
  }

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] p-2">
      <div className="mb-1 flex items-center justify-between gap-2 text-micro">
        <span className="truncate font-semibold text-slate-300">{label}</span>
        <span className="shrink-0 font-mono text-slate-500">
          {visibleSeries.length}/{series.length}
        </span>
      </div>
      <div className="flex gap-x-2 overflow-x-auto whitespace-nowrap pb-1 text-micro [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {series.map((item) => {
          const hidden = hiddenKeys.has(item.key);
          return (
            <button
              key={item.key}
              className={`inline-flex items-center gap-1 whitespace-nowrap transition-opacity ${
                hidden ? "opacity-35" : "opacity-100"
              }`}
              type="button"
              title={hidden ? `显示${item.label}` : `隐藏${item.label}`}
              onClick={() => toggleSeries(item.key)}
            >
              <span
                className="h-1.5 w-3 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-slate-400">{item.label}</span>
            </button>
          );
        })}
      </div>
      <div className="min-h-0 flex-1">
        <div
          ref={chartRef}
          className="relative h-full min-h-0 min-w-0 cursor-crosshair"
          onMouseLeave={() => setTooltipState(null)}
          onMouseMove={handlePreviewMouseMove}
        >
        <svg
          className="block h-full w-full"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          <line
            x1={plotLeft}
            x2={plotLeft}
            y1={plotTop}
            y2={plotTop + plotHeight}
            stroke="#263855"
            strokeWidth="0.7"
          />
          <line
            x1={plotLeft}
            x2={plotLeft + plotWidth}
            y1={plotTop + plotHeight}
            y2={plotTop + plotHeight}
            stroke="#263855"
            strokeWidth="0.7"
          />
          {yAxisLabels.map((label, index) => {
            const y = plotTop + (index / Math.max(yAxisLabels.length - 1, 1)) * plotHeight;
            return (
              <Fragment key={label}>
                <line
                  x1={plotLeft}
                  x2={plotLeft + plotWidth}
                  y1={y}
                  y2={y}
                  stroke="#1d3250"
                  strokeWidth="0.5"
                  opacity="0.65"
                />
                <text
                  x={plotLeft - 5}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="8"
                  fill="#64748b"
                >
                  {formatMiniChartValue(Number(label), unit)}
                </text>
              </Fragment>
            );
          })}
          {xLabelIndexes.map((index) => {
            const x =
              showAsStackedBars
                ? plotLeft + ((index + 0.5) / Math.max(pointCount, 1)) * plotWidth
                : plotLeft + (index / Math.max(pointCount - 1, 1)) * plotWidth;
            const axisLabel =
              xLabels?.[index] ??
              (index === 0 ? "起点" : index === xLabelIndexes[xLabelIndexes.length - 1] ? "最新" : "中段");
            return (
              <text
                key={index}
                x={x}
                y={plotTop + plotHeight + 12}
                textAnchor={index === 0 ? "start" : index === xLabelIndexes[xLabelIndexes.length - 1] ? "end" : "middle"}
                fontSize="8"
                fill="#64748b"
              >
                {axisLabel}
              </text>
            );
          })}
          {showAsStackedBars ? (
            <g>
              {dailyTotals.map((total, dateIndex) => {
                let stackY = plotTop + plotHeight;
                const slot = plotWidth / Math.max(pointCount, 1);
                const x = plotLeft + (dateIndex + 0.5) * slot;
                const barWidth = Math.max(3, Math.min(11, slot - 2));
                return (
                  <g key={dateIndex}>
                    {plottedSeries.map((item) => {
                      const value = Math.max(0, item.values[dateIndex] ?? 0);
                      if (value <= 0 || total <= 0) return null;
                      const segmentHeight = (value / max) * plotHeight;
                      stackY -= segmentHeight;
                      return (
                        <rect
                          key={item.key}
                          x={x - barWidth / 2}
                          y={stackY}
                          width={barWidth}
                          height={Math.max(0.6, segmentHeight)}
                          fill={item.color}
                          opacity="0.86"
                          rx="0.9"
                        />
                      );
                    })}
                  </g>
                );
              })}
            </g>
          ) : (
            series.map((item) =>
              hiddenKeys.has(item.key) ? null : (
                <path
                  key={item.key}
                  d={buildPreviewPath(item.values)}
                  fill="none"
                  stroke={item.color}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.7"
                  opacity="0.92"
                />
              ),
            )
          )}
          {tooltipX !== null ? (
            <line
              x1={tooltipX}
              x2={tooltipX}
              y1={plotTop}
              y2={plotTop + plotHeight}
              stroke="var(--tk-color-brand-primary)"
              strokeDasharray="4 4"
              strokeOpacity="0.78"
              strokeWidth="0.8"
            />
          ) : null}
        </svg>
        {tooltipState !== null && tooltipIndex !== null ? (
          <ChartTooltip
            clientX={tooltipState.clientX}
            clientY={tooltipState.clientY}
          >
            <div className="mb-1 font-semibold text-slate-200">
              {xLabels?.[tooltipIndex] ?? `#${tooltipIndex + 1}`}
            </div>
            <div className="mb-1 flex items-center justify-between gap-5 border-b border-[color:var(--tk-color-border-divider-dark)] pb-1 text-mini">
              <span className="text-slate-400">合计</span>
              <span className="font-mono font-semibold text-slate-100">
                {formatMiniChartValue(tooltipTotal, unit)}
              </span>
            </div>
            <div className="grid gap-1">
              {tooltipRows.slice(0, 8).map((item) => (
                <div key={item.key} className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-400">{item.label}</span>
                  <span className="ml-auto pl-3 font-mono font-semibold text-slate-100">
                    {formatMiniChartValue(item.value, unit)}
                  </span>
                </div>
              ))}
              {tooltipRows.length > 8 ? (
                <div className="text-slate-500">其余 {tooltipRows.length - 8} 项略</div>
              ) : null}
            </div>
          </ChartTooltip>
        ) : null}
        </div>
      </div>
      <div className="mt-1 truncate text-micro text-slate-500">{footnote}</div>
    </div>
  );
}

function MiniMetricPreview({
  rows,
}: {
  rows: readonly (readonly [string, string])[];
}) {
  return (
    <div className="space-y-1 rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] p-2">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="flex items-center justify-between gap-2 text-micro"
        >
          <span className="truncate text-slate-500">{label}</span>
          <span className="truncate font-semibold text-slate-300">{value}</span>
        </div>
      ))}
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded border border-[color:var(--tk-color-border-panel)] bg-[rgba(15,23,42,0.54)] px-2 py-1">
      <div className="truncate text-micro text-slate-500">{label}</div>
      <div className="truncate text-mini font-semibold text-slate-200">{value}</div>
    </div>
  );
}

function PageFrame({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="tk-overlay fixed inset-0 z-[40] flex items-center justify-center px-5 py-5"
      onMouseDown={onClose}
    >
      <section
        className="tk-modal grid h-[86vh] w-[min(1380px,calc(100vw-40px))] grid-rows-[auto_1fr] overflow-hidden border"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="tk-panel-header flex items-center justify-between gap-3 border-b px-4 py-3">
          <div className="min-w-0">
            <div className="tk-title-lg truncate">
              {title}
            </div>
            <div className="tk-muted mt-0.5 text-xs">
              入口页框 / Esc 关闭
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              className="tk-button inline-flex items-center gap-1.5 opacity-60"
              disabled
              type="button"
              title="刷新"
            >
              <RefreshCcw size={13} />
              刷新
            </button>
            <button
              className="tk-button inline-flex items-center gap-1.5 opacity-60"
              disabled
              type="button"
              title="下载"
            >
              <Download size={13} />
              下载
            </button>
            <button
              className="tk-button tk-icon-button inline-flex items-center justify-center"
              onClick={onClose}
              type="button"
              title="关闭"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="min-h-0 overflow-hidden p-3">{children}</div>
      </section>
    </div>
  );
}

function TopBar({
  currentTime,
  onResetColumns,
}: {
  currentTime: Date;
  onResetColumns: () => void;
}) {
  const [noticeEditorOpen, setNoticeEditorOpen] = useState(false);
  const [tradingNotice, setTradingNotice] = useState(DEFAULT_TRADING_NOTICE_TEXT);

  return (
    <header className="tk-topbar border-b px-3 py-2 shadow-[0_1px_4px_rgba(0,0,0,0.3)]">
      <div className="grid grid-cols-[minmax(230px,320px)_minmax(320px,1fr)_auto] items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="tk-page-title whitespace-nowrap">
            资金实时行情看板
          </div>
          <button
            className="tk-button text-micro"
            onClick={onResetColumns}
            type="button"
            title="恢复默认三栏宽度"
          >
            ⤺ 布局
          </button>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <SentimentChipWithPopover />
          <div className="min-w-0 flex-1">
            <MiddleMatrixNoticeBar
              variant="inline"
              noticeText={tradingNotice}
              onOpenEditor={() => setNoticeEditorOpen(true)}
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3">
          <TopToolMetricChip
            label="DR007"
            value="2.15%"
            tone="alert"
            title="DR007"
            subtitle="银行间 7D 存款类机构质押式回购利率"
            metrics={[
              { label: "最新", value: "2.15%", tone: "alert" },
              { label: "较昨日", value: "+1.0bp", tone: "alert" },
              { label: "更新时间", value: "10:53:27" },
            ]}
          />
          <SentimentChipWithPopover label="公开资金情绪" />
          <StatusBadgeWithPopover statusText={DEFAULT_TRADING_STATUS_TEXT} />
        </div>
      </div>
      <TradingNoticeEditorModal
        open={noticeEditorOpen}
        value={tradingNotice}
        onClose={() => setNoticeEditorOpen(false)}
        onSave={(nextNotice) => {
          setTradingNotice(nextNotice);
          setNoticeEditorOpen(false);
        }}
      />
    </header>
  );
}

function makeEmptyBankRow(institution: string, tenor: BankTenor): BankRateRow {
  return {
    institution,
    tenor,
    nonBankRate: "",
    refNonBankRate: "",
    deltaNonBankBp: "",
    bankRate: "",
    refBankRate: "",
    deltaBp: "",
    updatedAt: "",
    hasQuote: false,
  };
}

function deriveHasQuote(row: BankRateRow): boolean {
  return (
    (row.nonBankRate ?? "").trim() !== "" || (row.bankRate ?? "").trim() !== ""
  );
}

function parseRatePercent(value: string): number | null {
  const parsed = parseFloat(value.replace("%", ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatBpValue(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${rounded > 0 ? "+" : ""}${text}bp`;
}

function formatDeltaValue(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${rounded > 0 ? "+" : ""}${text}`;
}

function rateDeltaValue(rate: string, refRate: string): string | null {
  const current = parseRatePercent(rate);
  const reference = parseRatePercent(refRate);
  if (current === null || reference === null) return null;
  return formatDeltaValue((current - reference) * 100);
}

function bankRateSpread(row: BankRateRow): string {
  const nonBankRate = parseRatePercent(row.nonBankRate);
  const bankRate = parseRatePercent(row.bankRate);
  if (nonBankRate === null || bankRate === null) return "--";
  return formatBpValue((bankRate - nonBankRate) * 100);
}

function rateWithDelta(rate: string, refRate: string): string {
  const current = parseRatePercent(rate);
  if (current === null) return "--";
  return `${rate.trim()}(${rateDeltaValue(rate, refRate) ?? "--"})`;
}

function bankHistorySessionLabel(tenor?: string) {
  if (!tenor) return "当日";
  return /ON|001|隔夜|1天/.test(tenor) ? "隔夜" : "当日";
}

function buildBankHistorySeries(bank: string) {
  const seed = bank.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return Array.from({ length: 28 }, (_, index) => {
    const wave = Math.sin((index + seed) * 0.42) * 0.035;
    const drift = index > 20 ? (index - 20) * 0.006 : index > 10 ? -0.018 : 0;
    const nonBank = Number((1.36 + wave + drift + (index % 7 === 0 ? 0.018 : 0)).toFixed(3));
    const bankRate = Number((nonBank - 0.055 + Math.cos(index * 0.55 + seed) * 0.014).toFixed(3));
    const spread = Math.max(1, Math.round((nonBank - bankRate) * 100));
    return {
      date: `05-${String(index + 10).padStart(2, "0")}`,
      nonBank,
      bankRate,
      spread,
      bankDiff: Math.max(-1, Math.round((bankRate - 1.31) * 100)),
      nonBankDiff: Math.max(0, Math.round((nonBank - 1.30) * 100)),
    };
  });
}

type BankHistoryPoint = ReturnType<typeof buildBankHistorySeries>[number];

function bankTrendPath(
  values: readonly number[],
  width: number,
  height: number,
  min: number,
  max: number,
  margin: { left: number; right: number; top: number; bottom: number },
) {
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  return values
    .map((value, index) => {
      const x = margin.left + (index / (values.length - 1)) * plotWidth;
      const y = margin.top + (1 - (value - min) / (max - min)) * plotHeight;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function bankTrendX(
  index: number,
  count: number,
  width: number,
  margin: { left: number; right: number },
) {
  return margin.left + (index / (count - 1)) * (width - margin.left - margin.right);
}

function bankTrendY(
  value: number,
  height: number,
  min: number,
  max: number,
  margin: { top: number; bottom: number },
) {
  return margin.top + (1 - (value - min) / (max - min)) * (height - margin.top - margin.bottom);
}

function bankChartTicks(min: number, max: number, count = 4) {
  return Array.from({ length: count }, (_, index) =>
    Number((max - ((max - min) * index) / (count - 1)).toFixed(3)),
  );
}

function bankChartXTickIndices(count: number) {
  return Array.from(
    new Set([0, Math.floor((count - 1) / 3), Math.floor(((count - 1) * 2) / 3), count - 1]),
  );
}

function BigBankRateTrendPlot({
  data,
  sessionLabel,
}: {
  data: readonly BankHistoryPoint[];
  sessionLabel: string;
}) {
  const { tooltipState, containerRef, handleMouseMove, handleMouseLeave } =
    useChartTooltip(data.length);
  const nonBank = data.map((item) => item.nonBank);
  const bankRates = data.map((item) => item.bankRate);
  const spread = data.map((item) => item.spread);
  const minRate = Math.min(...nonBank, ...bankRates) - 0.03;
  const maxRate = Math.max(...nonBank, ...bankRates) + 0.03;
  const maxSpread = Math.max(...spread, 1);
  const width = 360;
  const height = 150;
  const margin = { left: 35, right: 22, top: 16, bottom: 25 };
  const plotBottom = height - margin.bottom;
  const yTicks = bankChartTicks(minRate, maxRate);
  const xTickIndices = bankChartXTickIndices(data.length);
  const tooltipIndex = tooltipState?.index ?? null;
  const hoverX =
    tooltipIndex === null ? null : bankTrendX(tooltipIndex, data.length, width, margin);

  return (
    <div
      ref={containerRef}
      className="relative min-h-0 cursor-crosshair"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${width} ${height}`}>
        <text x={margin.left} y="9" fill="#64748b" fontSize="8">
          利率(%)
        </text>
        <text x={width - 2} y="9" textAnchor="end" fill="#64748b" fontSize="8">
          价差(BP)
        </text>
        {yTicks.map((tick) => {
          const y = bankTrendY(tick, height, minRate, maxRate, margin);
          return (
            <g key={tick}>
              <line
                x1={margin.left}
                x2={width - margin.right}
                y1={y}
                y2={y}
                stroke="rgba(148,163,184,0.18)"
              />
              <text x={margin.left - 6} y={y + 3} textAnchor="end" fill="#64748b" fontSize="8">
                {tick.toFixed(3)}
              </text>
            </g>
          );
        })}
        <line
          x1={margin.left}
          x2={margin.left}
          y1={margin.top}
          y2={plotBottom}
          stroke="rgba(148,163,184,0.28)"
        />
        <line
          x1={margin.left}
          x2={width - margin.right}
          y1={plotBottom}
          y2={plotBottom}
          stroke="rgba(148,163,184,0.28)"
        />
        {xTickIndices.map((index) => {
          const x = bankTrendX(index, data.length, width, margin);
          return (
            <g key={index}>
              <line x1={x} x2={x} y1={plotBottom} y2={plotBottom + 3} stroke="#475569" />
              <text x={x} y={height - 7} textAnchor="middle" fill="#64748b" fontSize="8">
                {data[index].date}
              </text>
            </g>
          );
        })}
        {spread.map((value, index) => {
          const barWidth = Math.max(2, (width - margin.left - margin.right) / spread.length - 3);
          const barHeight = (value / maxSpread) * ((height - margin.top - margin.bottom) * 0.42);
          return (
            <rect
              key={`spread-${index}`}
              x={bankTrendX(index, data.length, width, margin) - barWidth / 2}
              y={plotBottom - barHeight}
              width={barWidth}
              height={barHeight}
              fill="#f4dfaa"
              opacity="0.58"
            />
          );
        })}
        <path
          d={bankTrendPath(nonBank, width, height, minRate, maxRate, margin)}
          fill="none"
          stroke="#cf6b74"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={bankTrendPath(bankRates, width, height, minRate, maxRate, margin)}
          fill="none"
          stroke="#5b8cc9"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {tooltipIndex !== null && hoverX !== null ? (
          <>
            <line
              x1={hoverX}
              x2={hoverX}
              y1={margin.top}
              y2={plotBottom}
              stroke="#7aa2d6"
              strokeDasharray="3 2"
              strokeWidth="0.9"
            />
            <circle
              cx={hoverX}
              cy={bankTrendY(nonBank[tooltipIndex], height, minRate, maxRate, margin)}
              r="3"
              fill="#cf6b74"
              stroke="#0b1020"
            />
            <circle
              cx={hoverX}
              cy={bankTrendY(bankRates[tooltipIndex], height, minRate, maxRate, margin)}
              r="3"
              fill="#5b8cc9"
              stroke="#0b1020"
            />
          </>
        ) : null}
      </svg>
      <div className="pointer-events-none absolute right-2 top-1 rounded border border-[color:var(--tk-color-border-panel)] bg-[rgba(15,23,42,0.72)] px-1.5 py-0.5 text-micro text-slate-300">
        {sessionLabel}
      </div>
      {tooltipIndex !== null && tooltipState ? (
        <ChartTooltip clientX={tooltipState.clientX} clientY={tooltipState.clientY}>
          <div className="mb-1.5 flex items-center justify-between gap-4 font-semibold text-slate-100">
            <span>{data[tooltipIndex].date}</span>
            <span className="rounded border border-[color:var(--tk-color-border-panel)] px-1.5 py-0.5 text-micro text-slate-300">
              {sessionLabel}
            </span>
          </div>
          <TooltipValueRow color="#cf6b74" label="出给非银" value={`${nonBank[tooltipIndex].toFixed(3)}%`} />
          <TooltipValueRow color="#5b8cc9" label="出给银行" value={`${bankRates[tooltipIndex].toFixed(3)}%`} />
          <TooltipValueRow color="#f4dfaa" label="非银-银行价差" value={`${spread[tooltipIndex]}BP`} />
        </ChartTooltip>
      ) : null}
    </div>
  );
}

function BigBankSpreadDiffPlot({
  data,
  sessionLabel,
}: {
  data: readonly BankHistoryPoint[];
  sessionLabel: string;
}) {
  const { tooltipState, containerRef, handleMouseMove, handleMouseLeave } =
    useChartTooltip(data.length);
  const groups = [
    { key: "bank", label: "给银行价差", color: "#5b8cc9", values: data.map((item) => item.bankDiff) },
    { key: "nonBank", label: "给非银价差", color: "#d76370", values: data.map((item) => item.nonBankDiff) },
  ];
  const allValues = groups.flatMap((group) => group.values);
  const maxValue = Math.max(...allValues, 1);
  const width = 360;
  const height = 132;
  const margin = { left: 35, right: 14, top: 12, bottom: 24 };
  const rowHeight = (height - margin.top - margin.bottom - 10) / 2;
  const xTickIndices = bankChartXTickIndices(data.length);
  const tooltipIndex = tooltipState?.index ?? null;
  const hoverX =
    tooltipIndex === null ? null : bankTrendX(tooltipIndex, data.length, width, margin);

  return (
    <div
      ref={containerRef}
      className="relative min-h-0 cursor-crosshair"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${width} ${height}`}>
        <text x={margin.left} y="8" fill="#64748b" fontSize="8">
          BP
        </text>
        {groups.map((group, groupIndex) => {
          const baseline = margin.top + rowHeight * (groupIndex + 1) + groupIndex * 10;
          return (
            <g key={group.key}>
              <text x={margin.left - 6} y={baseline - rowHeight / 2 + 3} textAnchor="end" fill="#64748b" fontSize="8">
                {group.label}
              </text>
              <line
                x1={margin.left}
                x2={width - margin.right}
                y1={baseline}
                y2={baseline}
                stroke="rgba(148,163,184,0.28)"
              />
              <line
                x1={margin.left}
                x2={width - margin.right}
                y1={baseline - rowHeight}
                y2={baseline - rowHeight}
                stroke="rgba(148,163,184,0.14)"
              />
              {group.values.map((value, index) => {
                const barWidth = Math.max(2, (width - margin.left - margin.right) / data.length - 3);
                const barHeight = Math.max(2, (value / maxValue) * (rowHeight - 4));
                return (
                  <rect
                    key={`${group.key}-${index}`}
                    x={bankTrendX(index, data.length, width, margin) - barWidth / 2}
                    y={baseline - barHeight}
                    width={barWidth}
                    height={barHeight}
                    rx="1"
                    fill={group.color}
                    opacity="0.82"
                  />
                );
              })}
            </g>
          );
        })}
        <line
          x1={margin.left}
          x2={margin.left}
          y1={margin.top}
          y2={height - margin.bottom}
          stroke="rgba(148,163,184,0.28)"
        />
        <line
          x1={margin.left}
          x2={width - margin.right}
          y1={height - margin.bottom}
          y2={height - margin.bottom}
          stroke="rgba(148,163,184,0.28)"
        />
        {xTickIndices.map((index) => {
          const x = bankTrendX(index, data.length, width, margin);
          return (
            <g key={index}>
              <line x1={x} x2={x} y1={height - margin.bottom} y2={height - margin.bottom + 3} stroke="#475569" />
              <text x={x} y={height - 7} textAnchor="middle" fill="#64748b" fontSize="8">
                {data[index].date}
              </text>
            </g>
          );
        })}
        {hoverX !== null ? (
          <line
            x1={hoverX}
            x2={hoverX}
            y1={margin.top}
            y2={height - margin.bottom}
            stroke="#7aa2d6"
            strokeDasharray="3 2"
            strokeWidth="0.9"
          />
        ) : null}
      </svg>
      <div className="pointer-events-none absolute right-2 top-1 rounded border border-[color:var(--tk-color-border-panel)] bg-[rgba(15,23,42,0.72)] px-1.5 py-0.5 text-micro text-slate-300">
        {sessionLabel}
      </div>
      {tooltipIndex !== null && tooltipState ? (
        <ChartTooltip clientX={tooltipState.clientX} clientY={tooltipState.clientY}>
          <div className="mb-1.5 flex items-center justify-between gap-4 font-semibold text-slate-100">
            <span>{data[tooltipIndex].date}</span>
            <span className="rounded border border-[color:var(--tk-color-border-panel)] px-1.5 py-0.5 text-micro text-slate-300">
              {sessionLabel}
            </span>
          </div>
          <TooltipValueRow color="#5b8cc9" label="给银行价差" value={`${data[tooltipIndex].bankDiff}BP`} />
          <TooltipValueRow color="#d76370" label="给非银价差" value={`${data[tooltipIndex].nonBankDiff}BP`} />
        </ChartTooltip>
      ) : null}
    </div>
  );
}

function TooltipValueRow({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-slate-400">{label}</span>
      <span className="ml-auto pl-4 font-mono font-semibold text-slate-100">{value}</span>
    </div>
  );
}

function BigBankPricingTrendChart({
  bank,
  tenor,
  className = "",
  compact = false,
}: {
  bank: string;
  tenor?: string;
  className?: string;
  compact?: boolean;
}) {
  const data = buildBankHistorySeries(bank);
  const sessionLabel = bankHistorySessionLabel(tenor);

  return (
    <div
      className={`grid min-h-0 grid-rows-[auto_1fr] rounded border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] ${
        compact ? "p-2.5" : "p-3"
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="tk-title">大行定价走势</div>
          <div className="mt-0.5 text-micro text-slate-500">
            {bank} · {tenor || "全部期限"} · {sessionLabel}
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-x-3 gap-y-1 text-micro text-slate-400">
          <LegendDot color="#cf6b74" label="出给非银价格(%)" />
          <LegendDot color="#5b8cc9" label="出给银行价格(%)" />
          <LegendDot color="#f4dfaa" label="非银-银行价差(BP)" />
        </div>
      </div>
      <BigBankRateTrendPlot data={data} sessionLabel={sessionLabel} />
    </div>
  );
}

function BigBankHistoryBack({
  bank,
  tenor,
  compact = false,
  onBack,
}: {
  bank: string;
  tenor?: string;
  compact?: boolean;
  onBack: () => void;
}) {
  const data = buildBankHistorySeries(bank);
  const sessionLabel = bankHistorySessionLabel(tenor);

  return (
    <div
      className={`grid h-full min-h-0 grid-rows-[auto_1fr] overflow-hidden ${
        compact ? "gap-1.5 p-2" : "gap-2 p-3"
      }`}
      onClick={onBack}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="tk-title">{bank} 多日历史</div>
          <div className="mt-0.5 text-xs text-slate-500">
            {tenor || "全部期限"} · {sessionLabel} · 悬浮查看单日明细
          </div>
        </div>
        <button
          className={`tk-button ${compact ? "text-micro" : ""}`}
          onClick={(event) => {
            event.stopPropagation();
            onBack();
          }}
          type="button"
        >
          返回
        </button>
      </div>
      <div className={`grid min-h-0 grid-rows-2 ${compact ? "gap-1.5" : "gap-3"}`}>
        <div
          className="grid min-h-0 grid-rows-[auto_1fr] rounded border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] p-3"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="tk-title">大行定价走势</div>
            <div className="flex gap-3 text-micro text-slate-400">
              <LegendDot color="#cf6b74" label="出给非银价格(%)" />
              <LegendDot color="#5b8cc9" label="出给银行价格(%)" />
              <LegendDot color="#f4dfaa" label="非银-银行价差(BP)" />
            </div>
          </div>
          <BigBankRateTrendPlot data={data} sessionLabel={sessionLabel} />
        </div>
        <div
          className="grid min-h-0 grid-rows-[auto_1fr] rounded border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] p-3"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="tk-title">大行定价与加权价差</div>
            <div className="flex gap-3 text-micro text-slate-400">
              <LegendDot color="#5b8cc9" label="给银行价差(BP)" />
              <LegendDot color="#d76370" label="给非银价差(BP)" />
            </div>
          </div>
          <BigBankSpreadDiffPlot data={data} sessionLabel={sessionLabel} />
        </div>
      </div>
    </div>
  );
}

function BigBankPriceFrame({
  embeddedPreview = false,
  onOpen,
  initialBank,
  onFlippedChange,
}: {
  embeddedPreview?: boolean;
  onOpen?: () => void;
  initialBank?: string;
  onFlippedChange?: (flipped: boolean) => void;
}) {
  const [flippedBank, setFlippedBank] = useState<string | null>(initialBank ?? null);
  useEffect(() => {
    onFlippedChange?.(flippedBank !== null);
  }, [flippedBank, onFlippedChange]);
  const [flippedTenor, setFlippedTenor] = useState("");
  const [whitelist, setWhitelist] = useState<string[]>([
    ...defaultBigBankWhitelist,
  ]);
  const [bankRateRows, setBankRateRows] = useState<BankRateRow[]>([
    ...initialBankRateRows,
  ]);
  const [draftBankRateRows, setDraftBankRateRows] = useState<BankRateRow[]>([
    ...initialBankRateRows,
  ]);
  const [isBankEditorOpen, setIsBankEditorOpen] = useState(false);

  const rows = bankRateRows
    .filter(
      (row) => whitelist.includes(row.institution),
    )
    .map((row) => [
      row.institution,
      BANK_TENOR_LABEL[row.tenor],
      rateWithDelta(row.nonBankRate, row.refNonBankRate),
      rateWithDelta(row.bankRate, row.refBankRate),
      bankRateSpread(row),
      row.updatedAt ? row.updatedAt.slice(0, 5) : "--",
    ]);
  function buildDraft(): BankRateRow[] {
    const byKey = new Map<string, BankRateRow>();
    for (const row of bankRateRows) {
      byKey.set(`${row.institution}__${row.tenor}`, row);
    }
    const result: BankRateRow[] = [];
    for (const institution of whitelist) {
      for (const tenor of BANK_TENORS) {
        const existing = byKey.get(`${institution}__${tenor}`);
        result.push(
          existing ? { ...existing } : makeEmptyBankRow(institution, tenor),
        );
      }
    }
    return result;
  }

  function openBankEditor() {
    setDraftBankRateRows(buildDraft());
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
        const updated: BankRateRow = { ...row, [field]: value };
        if (field === "bankRate") {
          updated.deltaBp = rateDeltaValue(value, row.refBankRate) ?? "";
        }
        if (field === "nonBankRate") {
          updated.deltaNonBankBp = rateDeltaValue(value, row.refNonBankRate) ?? "";
        }
        return updated;
      }),
    );
  }

  function addInstitution(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!whitelist.includes(trimmed)) {
      setWhitelist((prev) => [...prev, trimmed]);
    }
    setDraftBankRateRows((current) => {
      const exists = current.some((row) => row.institution === trimmed);
      if (exists) return current;
      return [
        ...current,
        makeEmptyBankRow(trimmed, "ON"),
        makeEmptyBankRow(trimmed, "7D"),
      ];
    });
  }

  function resetDraftRows() {
    setWhitelist([...defaultBigBankWhitelist]);
    setDraftBankRateRows(initialBankRateRows.map((row) => ({ ...row })));
  }

  function saveBankRateRows() {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    setBankRateRows(
      draftBankRateRows.map((row) => {
        const hasQuote = deriveHasQuote(row);
        return {
          ...row,
          hasQuote,
          updatedAt: hasQuote ? time : "",
        };
      }),
    );
    setIsBankEditorOpen(false);
  }

  return (
    <>
      <section
        className={`tk-panel flex min-h-0 flex-col border ${
          embeddedPreview ? "h-full overflow-hidden" : "h-full overflow-hidden"
        }`}
      >
        {embeddedPreview ? (
          <IntegratedPreviewHeader
            id="big-bank-price"
            onOpen={onOpen}
            actions={
              <>
                <button
                  className="tk-button"
                  onClick={openBankEditor}
                  type="button"
                >
                  手工输入
                </button>
                <button
                  className="tk-button tk-button-success"
                  type="button"
                >
                  下载
                </button>
              </>
            }
          />
        ) : (
          <div className="tk-panel-header border-b px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <div>
                <div className="tk-title">
                  今天大行价格
                </div>
                <div className="tk-muted mt-1 text-xs">
                  大行当日隔夜和 7 天资金价格
                </div>
              </div>
              <div className="ml-auto flex shrink-0 items-center gap-2">
                <button
                  className="tk-button"
                  onClick={openBankEditor}
                  type="button"
                >
                  手工输入
                </button>
                <button
                  className="tk-button tk-button-success"
                  type="button"
                >
                  下载
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="min-h-0 flex-1">
          <div className={`tk-flip-card h-full min-h-0 ${flippedBank ? "is-flipped" : ""}`}>
            <div className="tk-flip-card__inner h-full min-h-0">
              <div className="tk-flip-card__face h-full min-h-0">
            <StructuredTable
              columns={[
                "机构",
                "期限",
                "非银利率(涨跌)",
                "银行利率(涨跌)",
                "利差",
                "时间",
              ]}
              rows={rows}
              greenColumns={[2]}
              redColumns={[3]}
              nowrapHeader
              fitToWidth
              flush
              compact={embeddedPreview}
              adaptiveHeight={false}
              scrollY
              onRowClick={(row) => {
                setFlippedBank(row[0] ?? null);
                setFlippedTenor(row[1] ?? "");
              }}
            />
              </div>
              <div className="tk-flip-card__face tk-flip-card__face--back h-full min-h-0">
                <BigBankHistoryBack
                  bank={flippedBank ?? rows[0]?.[0] ?? "大行"}
                  tenor={flippedTenor || rows[0]?.[1]}
                  compact={embeddedPreview}
                  onBack={() => {
                    setFlippedBank(null);
                    setFlippedTenor("");
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      <BankRateEditorModal
        open={isBankEditorOpen}
        rows={draftBankRateRows}
        onChange={updateDraftRow}
        onAddInstitution={addInstitution}
        onClose={() => setIsBankEditorOpen(false)}
        onReset={resetDraftRows}
        onSave={saveBankRateRows}
      />
    </>
  );
}

function XrepoFrame({
  embeddedPreview = false,
  onOpen,
  initialContract,
  tenorFilter = "all",
  onFlippedChange,
}: {
  embeddedPreview?: boolean;
  onOpen?: () => void;
  initialContract?: string;
  tenorFilter?: QuoteTenorFilter;
  onFlippedChange?: (flipped: boolean) => void;
}) {
  const [flippedContract, setFlippedContract] = useState<string | null>(initialContract ?? null);
  useEffect(() => {
    onFlippedChange?.(flippedContract !== null);
  }, [flippedContract, onFlippedChange]);
  const section = leftSections.find(
    (item): item is SummaryTableSection =>
      item.layout === "table" && item.title === "XREPO",
  );
  if (!section) return <ReservedModuleFrame />;
  const rows = filterRowsByQuoteTenor(
    xrepoR001Rows(section.rows),
    tenorFilter,
    [0],
  );
  const openInlineHistory = (contractName = rows[0]?.[0] ?? (tenorFilter === "all" ? "R001" : tenorFilter)) =>
    setFlippedContract(contractName);

  return (
    <section
      className="tk-panel flex h-full min-h-0 flex-col overflow-hidden border"
    >
      {embeddedPreview ? (
        <IntegratedPreviewHeader
          id="xrepo"
          onOpen={() => openInlineHistory()}
          tenorFilter={tenorFilter}
          actions={
            <button
              className="tk-button tk-button-success"
              type="button"
            >
              下载
            </button>
          }
        />
      ) : (
        <div className="tk-panel-header border-b px-4 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="tk-title">XREPO</div>
              <div className="tk-muted mt-1 text-xs">
                匿名回购报价、发送与下载
              </div>
            </div>
            <button
              className="tk-button tk-button-success"
              type="button"
            >
              下载
            </button>
          </div>
        </div>
      )}
      <div className="min-h-0 flex-1">
        <div className={`tk-flip-card h-full min-h-0 ${flippedContract ? "is-flipped" : ""}`}>
          <div className="tk-flip-card__inner h-full min-h-0">
            <div className="tk-flip-card__face h-full min-h-0">
              <StructuredTable
                columns={section.columns}
                rows={rows}
                greenColumns={section.greenColumns}
                redColumns={section.redColumns}
                emphasisColumns={section.emphasisColumns}
                buttonColumn={section.buttonColumn}
                fitToWidth
                columnWidths={section.columnWidths}
                compact={embeddedPreview}
                flush
                scrollY
                onRowClick={(row) => openInlineHistory(row[0] ?? "R001")}
              />
            </div>
            <div className="tk-flip-card__face tk-flip-card__face--back h-full min-h-0">
              <XrepoHistoryBack
                contractName={
                  flippedContract ?? rows[0]?.[0] ?? (tenorFilter === "all" ? "R001" : tenorFilter)
                }
                compact={embeddedPreview}
                onBack={() => setFlippedContract(null)}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function XrepoHistoryBack({
  contractName,
  compact = false,
  onBack,
}: {
  contractName: string;
  compact?: boolean;
  onBack: () => void;
}) {
  return (
    <div
      className={`grid h-full min-h-0 grid-rows-[auto_1fr] overflow-hidden ${
        compact ? "" : "gap-2 p-3"
      }`}
      onClick={onBack}
    >
      <div
        className={`flex items-center justify-between gap-3 border-b border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-dark-soft)] ${
          compact ? "px-2 py-0.5" : "rounded-md px-3 py-1"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="min-w-0">
          <div className={`${compact ? "text-xs" : "text-sm"} font-semibold text-slate-100`}>
            历史成交走势对比 - {contractName}
          </div>
          <div className="mt-0.5 text-micro text-slate-500">
            当前合约 / 品种对比 / 价差柱
          </div>
        </div>
        <button
          className={`tk-button ${compact ? "px-1.5 py-0.5 text-micro" : "px-2.5 py-0.5 text-xs"}`}
          onClick={(event) => {
            event.stopPropagation();
            onBack();
          }}
          type="button"
        >
          返回
        </button>
      </div>
      <div
        className={`h-full min-h-0 overflow-hidden ${compact ? "" : "rounded-md"}`}
        onClick={(event) => event.stopPropagation()}
      >
        <XrepoInlineHistoryChart contractName={contractName} compact={compact} />
      </div>
    </div>
  );
}

const xrepoHistoryRangeCounts: Record<HistoryRange, number> = {
  "5d": 5,
  "1m": 22,
  "6m": 78,
};

const xrepoCompareAnchors: Record<SpreadProduct, number> = {
  dr001: 1.26,
  dr007: 1.31,
  gc007: 1.36,
  r007: 1.39,
};

function xrepoHistoryPointCount(range: HistoryRange, compact: boolean) {
  const count = xrepoHistoryRangeCounts[range];
  return compact && range === "6m" ? 36 : count;
}

function xrepoCompareLabel(compareProduct: CompareProduct) {
  return (
    compareProductOptions.find((option) => option.id === compareProduct)
      ?.label ?? "不对比"
  );
}

function buildXrepoHistoryComparison(
  contractName: string,
  count: number,
  compareProduct: CompareProduct,
  range: HistoryRange,
) {
  const seed = contractName
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const labels = generateTradingDates(TODAY_STR, count);
  const rangeSeed = range === "5d" ? 11 : range === "1m" ? 29 : 61;
  const anchor = contractName.includes("mini")
    ? 1.38
    : 1.34 + (seed % 8) * 0.006;
  const current = randomWalk(anchor, count, 0.014, seed + rangeSeed);
  const compare =
    compareProduct === "none"
      ? null
      : randomWalk(
          xrepoCompareAnchors[compareProduct] + (seed % 3) * 0.004,
          count,
          0.012,
          seed + rangeSeed + compareProduct.length * 17,
        ).map((value, index) =>
          Number(
            (value + Math.sin((index + seed) * 0.55) * 0.006).toFixed(4),
          ),
        );
  const spread = compare
    ? current.map((value, index) =>
        Number(((value - compare[index]) * 100).toFixed(1)),
      )
    : null;
  const volume = randomWalk(contractName.includes("mini") ? 72 : 680, count, contractName.includes("mini") ? 18 : 145, seed + 9)
    .map((value) => Math.max(8, Math.round(value)));
  return { labels, current, compare, spread, volume };
}

function XrepoInlineHistoryChart({
  contractName,
  compact = false,
}: {
  contractName: string;
  compact?: boolean;
}) {
  const [compareProduct, setCompareProduct] =
    useState<CompareProduct>("dr007");
  const [range, setRange] = useState<HistoryRange>("1m");
  const pointCount = xrepoHistoryPointCount(range, compact);
  const [data, setData] = useState(() =>
    buildXrepoHistoryComparison(contractName, pointCount, compareProduct, range),
  );
  useEffect(() => {
    setData(buildXrepoHistoryComparison(contractName, pointCount, compareProduct, range));
  }, [contractName, pointCount, compareProduct, range]);
  const compareLabel = xrepoCompareLabel(compareProduct);
  const rateValues = data.compare
    ? [...data.current, ...data.compare]
    : data.current;
  const minRate = Math.max(0, Math.min(...rateValues) - 0.035);
  const maxRate = Math.max(...rateValues) + 0.035;
  const maxVolume = Math.max(...data.volume, 1);
  const maxSpread = Math.max(
    ...(data.spread ?? [0]).map((value) => Math.abs(value)),
    1,
  );
  const width = 520;
  const height = 138;
  const { tooltipState, containerRef, handleMouseMove, handleMouseLeave } =
    useChartTooltip(data.labels.length);
  const tooltipIndex = tooltipState?.index ?? null;
  const tickStep = Math.max(1, Math.ceil(data.labels.length / (compact ? 5 : 7)));

  return (
    <div
      className="relative h-full min-h-0 bg-[var(--tk-color-surface-dark-deep)]"
      data-xrepo-history-chart
    >
      <div
        className="absolute left-2 right-2 top-1 z-20 flex items-start justify-between gap-2 text-micro"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="pointer-events-none flex min-w-0 flex-wrap items-center gap-2 rounded bg-[rgba(15,23,42,0.72)] px-2 py-0.5 text-slate-400">
          <LegendDot color={chartPalette.blue} label={contractName} />
          {data.compare ? (
            <LegendDot color={chartPalette.violet} label={compareLabel} />
          ) : null}
          <LegendDot
            color={data.spread ? chartPalette.green : "rgba(94,163,255,0.32)"}
            label={data.spread ? "价差" : "成交量"}
          />
        </div>
        <div className="flex shrink-0 items-center gap-1 rounded bg-[rgba(15,23,42,0.76)] px-1.5 py-0.5">
          <label className="flex items-center gap-1 whitespace-nowrap text-slate-400">
            <span>对比</span>
            <select
              className="h-5 rounded border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-page)] px-1 text-micro text-slate-100 outline-none"
              value={compareProduct}
              onChange={(event) =>
                setCompareProduct(event.target.value as CompareProduct)
              }
            >
              {compareProductOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-0.5">
            {historyRangeTabs.map((tab) => (
              <button
                key={tab.id}
                className={miniChipClass(tab.id === range)}
                onClick={() => setRange(tab.id)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid h-full min-h-0 grid-cols-[2.5rem_1fr] px-2 pb-1 pt-1">
        <div className="flex flex-col justify-between pb-5 pt-5 pr-1 text-right text-micro text-slate-500">
          {buildAxisLabels(minRate, maxRate, 4).map((tick) => (
            <div key={tick}>{tick}</div>
          ))}
        </div>
        <div
          ref={containerRef}
          className="relative min-h-0 cursor-crosshair overflow-hidden rounded border border-dashed border-[color:var(--tk-color-border-panel)]"
        >
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="absolute inset-x-0 border-t border-[color:var(--tk-color-border-divider)] opacity-70"
              style={{ top: `${(index / 3) * 82}%` }}
            />
          ))}
          {data.spread ? (
            <div className="absolute inset-x-1 bottom-5 top-[58%] flex items-stretch gap-[2px]">
              <div className="pointer-events-none absolute left-0 right-0 top-1/2 border-t border-dashed border-[color:var(--tk-color-border-divider)]" />
              {data.spread.map((value, index) => {
                const barHeight = Math.max(
                  4,
                  (Math.abs(value) / maxSpread) * 48,
                );
                return (
                  <div
                    key={`${data.labels[index]}-spread`}
                    className="relative min-w-0 flex-1"
                  >
                    <div
                      className={`absolute left-0 right-0 rounded-sm ${
                        value >= 0
                          ? "bg-[rgba(248,113,113,0.72)]"
                          : "bg-[rgba(16,185,129,0.72)]"
                      }`}
                      style={{
                        height: `${barHeight}%`,
                        ...(value >= 0
                          ? { bottom: "50%" }
                          : { top: "50%" }),
                      }}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="absolute inset-x-1 bottom-5 top-1 flex items-end gap-[2px]">
              {data.volume.map((value, index) => (
                <div
                  key={`${data.labels[index]}-volume`}
                  className="min-w-0 flex-1 rounded-t-[2px] bg-[rgba(94,163,255,0.28)]"
                  style={{ height: `${(value / maxVolume) * 52}%` }}
                />
              ))}
            </div>
          )}
          <svg
            className="absolute inset-x-1 bottom-5 top-1 h-[calc(100%-1.5rem)] w-[calc(100%-0.5rem)]"
            preserveAspectRatio="none"
            viewBox={`0 0 ${width} ${height}`}
          >
            {data.compare ? (
              <path
                d={buildLinePath(data.compare, width, height, minRate, maxRate)}
                fill="none"
                stroke={chartPalette.violet}
                strokeDasharray="6 5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            ) : null}
            <path
              d={buildLinePath(data.current, width, height, minRate, maxRate)}
              fill="none"
              stroke={chartPalette.blue}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.3"
            />
          </svg>
          {tooltipIndex !== null ? (
            <div
              className="pointer-events-none absolute bottom-5 top-1 w-px bg-[var(--tk-color-brand-primary)]"
              style={{
                left: `${(tooltipIndex / (data.labels.length - 1)) * 100}%`,
              }}
            />
          ) : null}
          <div className="absolute inset-x-0 bottom-0 h-4">
            {data.labels.map((label, index) =>
              index % tickStep === 0 || index === data.labels.length - 1 ? (
                <span
                  key={label}
                  className="absolute top-0 -translate-x-1/2 text-micro text-slate-500"
                  style={{ left: `${(index / (data.labels.length - 1)) * 100}%` }}
                >
                  {label}
                </span>
              ) : null,
            )}
          </div>
          <ChartHoverLayer
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
          />
          {tooltipState && tooltipIndex !== null ? (
            <ChartTooltip
              clientX={tooltipState.clientX}
              clientY={tooltipState.clientY}
            >
              <div className="mb-1 font-semibold text-slate-200">
                {data.labels[tooltipIndex]}
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: chartPalette.blue }} />
                <span className="text-slate-400">当前</span>
                <span className="font-semibold text-slate-100">
                  {data.current[tooltipIndex].toFixed(4)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                {data.compare ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: chartPalette.violet }} />
                    <span className="text-slate-400">{compareLabel}</span>
                    <span className="font-semibold text-slate-100">
                      {data.compare[tooltipIndex].toFixed(4)}%
                    </span>
                  </>
                ) : null}
              </div>
              {data.spread ? (
                <div className="text-slate-400">
                  价差 <span className="font-semibold text-slate-100">{data.spread[tooltipIndex]}bp</span>
                </div>
              ) : (
                <div className="text-slate-400">
                  成交量 <span className="font-semibold text-slate-100">{data.volume[tooltipIndex]}亿</span>
                </div>
              )}
            </ChartTooltip>
          ) : null}
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-1 left-2 right-2 z-10 flex items-center justify-between rounded bg-[rgba(15,23,42,0.66)] px-2 py-0.5 text-micro text-slate-500">
        <span>点击返回 XRepo 表格</span>
        <span>{range === "5d" ? "近5日" : range === "1m" ? "近1M" : "近半年"} / {compareLabel}</span>
      </div>
    </div>
  );
}

function ExchangeRepoFrame({
  embeddedPreview = false,
  onOpen,
  tenorFilter = "all",
}: {
  embeddedPreview?: boolean;
  onOpen?: () => void;
  tenorFilter?: QuoteTenorFilter;
}) {
  const section = leftSections.find(
    (item): item is ExchangeMarketSplitSection =>
      item.layout === "exchange-split",
  );
  if (!section) return <ReservedModuleFrame />;

  return (
    <ExchangeRepoCard
      title={section.title}
      markets={section.markets}
      embeddedPreview={embeddedPreview}
      tenorFilter={tenorFilter}
      onOpen={onOpen}
    />
  );
}

function GlobalFilterFrame() {
  return (
    <div className="tk-panel grid h-full min-h-0 place-items-center border">
      <div className="tk-panel-soft w-[520px] rounded border border-[color:var(--tk-color-border-panel)] p-5">
        <div className="tk-title">
          金额 / 利率筛选
        </div>
        <div className="mt-4 grid gap-3 text-sm">
          <div className="flex items-center justify-between border-b border-[color:var(--tk-color-border-divider-dark)] pb-3">
            <span className="text-slate-500">金额区间</span>
            <span className="font-mono text-slate-200">
              {topBoardFilters.amountMin} - {topBoardFilters.amountMax} 亿
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">利率区间</span>
            <span className="font-mono text-slate-200">
              {topBoardFilters.rateMin} - {topBoardFilters.rateMax} %
            </span>
          </div>
        </div>
        <div className="mt-4 text-xs text-slate-500">
          筛选入口已迁入页框，编辑能力后续接入。
        </div>
      </div>
    </div>
  );
}

function MarketSentimentFrame() {
  return (
    <div className="tk-panel grid h-full min-h-0 grid-cols-[minmax(0,1.45fr)_minmax(112px,0.55fr)] gap-3 overflow-hidden border p-3">
      <div className="tk-panel-soft min-w-0 rounded border border-[color:var(--tk-color-border-panel)] p-4">
        <div className="tk-title">
          DR007 / 泰康资金情况
        </div>
        <div className="mt-4 space-y-3">
          <TopToolMetricChip
            label="DR007"
            value="2.15%"
            tone="alert"
            title="DR007"
            subtitle="银行间 7D 存款类机构质押式回购利率"
            metrics={[
              { label: "最新", value: "2.15%", tone: "alert" },
              { label: "较昨日", value: "+1.0bp", tone: "alert" },
              { label: "更新时间", value: "10:53:27" },
            ]}
          />
          <SentimentChipWithPopover />
          <StatusBadgeWithPopover statusText="平衡" />
        </div>
      </div>
      <div className="tk-panel-soft min-h-0 min-w-0 rounded border border-[color:var(--tk-color-border-panel)] p-3">
        <div className="mb-3 text-xs text-slate-500">近 20 日资金情绪</div>
        <MiniSparklinePreview
          label="全市场"
          values={sentimentTrendData.map((item) => item.total)}
          color={chartPalette.amber}
          footnote="指数越高代表资金越紧"
        />
      </div>
    </div>
  );
}

function ReservedModuleFrame() {
  return (
    <div className="tk-panel grid h-full min-h-0 place-items-center border border-dashed">
      <div className="text-center">
        <div className="text-base font-semibold text-slate-100">模块接入中</div>
        <div className="mt-2 text-sm text-slate-500">
          该功能入口已预留，后续会迁移对应模块。
        </div>
      </div>
    </div>
  );
}

function LeftSummaryPanel() {
  const [whitelist, setWhitelist] = useState<string[]>([
    ...defaultBigBankWhitelist,
  ]);
  const [bankRateRows, setBankRateRows] = useState<BankRateRow[]>([
    ...initialBankRateRows,
  ]);
  const [draftBankRateRows, setDraftBankRateRows] = useState<BankRateRow[]>([
    ...initialBankRateRows,
  ]);
  const [isBankEditorOpen, setIsBankEditorOpen] = useState(false);
  const [flippedBigBankName, setFlippedBigBankName] = useState<string | null>(null);
  const [flippedBigBankTenor, setFlippedBigBankTenor] = useState("");

  const summarySections = leftSections
    .filter(
      (section): section is SummaryTableSection => section.layout === "table",
    )
    .map((section) =>
      section.title === "今天大行价格"
        ? {
            ...section,
            rows: bankRateRows
              .filter(
                (row) => whitelist.includes(row.institution),
              )
              .map((row) => [
                row.institution,
                BANK_TENOR_LABEL[row.tenor],
                rateWithDelta(row.nonBankRate, row.refNonBankRate),
                rateWithDelta(row.bankRate, row.refBankRate),
                bankRateSpread(row),
              ]),
          }
        : section.title === "XREPO"
          ? {
              ...section,
              rows: xrepoR001Rows(section.rows),
            }
          : section,
    );
  const exchangeRepoSection = leftSections.find(
    (section): section is ExchangeMarketSplitSection =>
      section.layout === "exchange-split",
  );

  function buildDraft(): BankRateRow[] {
    const byKey = new Map<string, BankRateRow>();
    for (const row of bankRateRows) {
      byKey.set(`${row.institution}__${row.tenor}`, row);
    }
    const result: BankRateRow[] = [];
    for (const institution of whitelist) {
      for (const tenor of BANK_TENORS) {
        const existing = byKey.get(`${institution}__${tenor}`);
        result.push(
          existing ? { ...existing } : makeEmptyBankRow(institution, tenor),
        );
      }
    }
    return result;
  }

  function openBankEditor() {
    setDraftBankRateRows(buildDraft());
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
        const updated: BankRateRow = { ...row, [field]: value };
        if (field === "bankRate") {
          updated.deltaBp = rateDeltaValue(value, row.refBankRate) ?? "";
        }
        if (field === "nonBankRate") {
          updated.deltaNonBankBp = rateDeltaValue(value, row.refNonBankRate) ?? "";
        }
        return updated;
      }),
    );
  }

  function addInstitution(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!whitelist.includes(trimmed)) {
      setWhitelist((prev) => [...prev, trimmed]);
    }
    setDraftBankRateRows((current) => {
      const exists = current.some((r) => r.institution === trimmed);
      if (exists) return current;
      return [
        ...current,
        makeEmptyBankRow(trimmed, "ON"),
        makeEmptyBankRow(trimmed, "7D"),
      ];
    });
  }

  function resetDraftRows() {
    setWhitelist([...defaultBigBankWhitelist]);
    setDraftBankRateRows(initialBankRateRows.map((row) => ({ ...row })));
  }

  function saveBankRateRows() {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    setBankRateRows(
      draftBankRateRows.map((row) => {
        const hasQuote = deriveHasQuote(row);
        return {
          ...row,
          hasQuote,
          updatedAt: hasQuote ? time : "",
        };
      }),
    );
    setIsBankEditorOpen(false);
  }

  return (
    <>
      <aside className="flex h-full min-h-0 min-w-0 flex-col gap-3 overflow-hidden pr-1">
        {summarySections.map((section) => {
          const isBigBankPrice = section.title === moduleEntries[0].title;
          if (isBigBankPrice) {
            return (
              <div
                key={section.title}
                className={section.scrollable ? "min-h-0 flex-1" : "shrink-0"}
              >
                <div className={`tk-flip-card h-full min-h-0 ${flippedBigBankName ? "is-flipped" : ""}`}>
                  <div className="tk-flip-card__inner h-full min-h-0">
                    <div className="tk-flip-card__face h-full min-h-0">
                      <PanelCard
                        title={section.title}
                        bodyClassName="min-h-0 flex-1"
                        bodyPaddingClassName="p-0"
                        bodyFill
                        actions={
                          <div className="flex items-center gap-2">
                            <button
                              className="tk-button"
                              onClick={openBankEditor}
                              type="button"
                            >
                              手工输入
                            </button>
                            <button
                              className="tk-button tk-button-success"
                              type="button"
                            >
                              下载
                            </button>
                          </div>
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
                          nowrapHeader
                          compact
                          flush
                          adaptiveHeight={!section.scrollable}
                          scrollY={section.scrollable}
                          onRowClick={(row) => {
                            setFlippedBigBankName(row[0] ?? "大行");
                            setFlippedBigBankTenor(row[1] ?? "");
                          }}
                        />
                      </PanelCard>
                    </div>
                    <div className="tk-flip-card__face tk-flip-card__face--back h-full min-h-0">
                      <PanelCard
                        title="大行定价走势"
                        subtitle={flippedBigBankName ? `${flippedBigBankName} 多日历史` : undefined}
                        bodyClassName="min-h-0 flex-1"
                        bodyPaddingClassName="p-2"
                        bodyFill
                        actions={
                          <button
                            className="tk-button"
                            onClick={() => {
                              setFlippedBigBankName(null);
                              setFlippedBigBankTenor("");
                            }}
                            type="button"
                          >
                            返回
                          </button>
                        }
                      >
                        <div className="h-full min-h-[230px]">
                          <BigBankPricingTrendChart
                            bank={flippedBigBankName ?? "大行"}
                            tenor={flippedBigBankTenor}
                            className="h-full"
                            compact
                          />
                        </div>
                      </PanelCard>
                    </div>
                  </div>
                </div>
              </div>
            );
          }
          return (
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
                section.title === "今天大行价格" ? (
                  <div className="flex items-center gap-2">
                    <button
                      className="tk-button"
                      onClick={openBankEditor}
                      type="button"
                    >
                      手工输入
                    </button>
                    <button
                      className="tk-button tk-button-success"
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
                nowrapHeader={isBigBankPrice}
                compact
                flush
                adaptiveHeight={!section.scrollable}
                scrollY={section.scrollable}
                onRowClick={
                  isBigBankPrice
                    ? (row) => {
                        setFlippedBigBankName(row[0] ?? "大行");
                        setFlippedBigBankTenor(row[1] ?? "");
                      }
                    : undefined
                }
              />
            </PanelCard>
          </div>
          );
        })}
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
        onAddInstitution={addInstitution}
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
  onAddInstitution,
  onClose,
  onReset,
  onSave,
}: {
  open: boolean;
  rows: readonly BankRateRow[];
  onChange: (index: number, field: keyof BankRateRow, value: string) => void;
  onAddInstitution: (name: string) => void;
  onClose: () => void;
  onReset: () => void;
  onSave: () => void;
}) {
  const [newInstName, setNewInstName] = useState("");
  if (!open) {
    return null;
  }

  function commitAddInstitution() {
    if (!newInstName.trim()) return;
    onAddInstitution(newInstName);
    setNewInstName("");
  }

  return (
    <div className="tk-overlay fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="tk-modal w-full max-w-4xl overflow-hidden border">
        <div className="tk-panel-header border-b px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="tk-title-lg">
                今天大行价格手工输入
              </div>
            </div>
            <button
              className="tk-button"
              onClick={onClose}
              type="button"
            >
              关闭
            </button>
          </div>
        </div>
        <div className="px-5 py-4">
          <div className="tk-table-shell overflow-hidden rounded border">
            <div className="grid grid-cols-[1.4fr_0.7fr_1fr_1fr] border-b border-[color:var(--tk-color-border-divider-dark)] bg-[var(--tk-color-surface-dark-soft)] px-4 py-2 text-mini font-medium tracking-[0] text-[color:var(--tk-color-text-tertiary)]">
              <span>机构</span>
              <span className="text-center">期限</span>
              <span className="text-right">非银利率</span>
              <span className="text-right">银行利率</span>
            </div>
            {rows.map((row, index) => (
              <div
                key={`${row.institution}-${row.tenor}-${index}`}
                className={`grid grid-cols-[1.4fr_0.7fr_1fr_1fr] items-center gap-3 border-b border-[color:var(--tk-color-border-divider-dark)] px-4 py-3 ${
                  index % 2 === 0 ? "bg-transparent" : "bg-[rgba(255,255,255,0.025)]"
                }`}
              >
                <div className="tk-title">
                  {row.institution}
                </div>
                <div className="text-center text-xs text-slate-300">
                  {BANK_TENOR_LABEL[row.tenor]}
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
          <div className="tk-muted mt-3 flex items-center gap-2 text-xs">
            <span className="text-slate-500">新增机构</span>
            <input
              className="tk-field w-44 px-2 py-1.5 text-xs outline-none focus:border-[color:var(--tk-color-brand-primary-hover)]"
              placeholder="如 交通银行"
              value={newInstName}
              onChange={(e) => setNewInstName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitAddInstitution();
                }
              }}
            />
            <button
              className="tk-button tk-button-success"
              onClick={commitAddInstitution}
              type="button"
            >
              + 添加机构
            </button>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-[color:var(--tk-color-border-divider-dark)] bg-[var(--tk-color-surface-dark-deep)] px-5 py-4">
          <button
            className="tk-button"
            onClick={onReset}
            type="button"
          >
            重置
          </button>
          <button
            className="tk-button"
            onClick={onClose}
            type="button"
          >
            取消
          </button>
          <button
            className="tk-button tk-button-primary"
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
      className={`tk-field w-full px-3 py-2 text-sm outline-none transition focus:border-[color:var(--tk-color-brand-primary-hover)] ${
        align === "right" ? "text-right" : "text-left"
      }`}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function LeftNcdCard({
  embeddedPreview = false,
  onOpen,
  tenorFilter = "all",
}: {
  embeddedPreview?: boolean;
  onOpen?: () => void;
  tenorFilter?: QuoteTenorFilter;
}) {
  const [market, setMarket] = useState<"primary" | "secondary">("primary");
  const [mode, setMode] = useState<"trend" | "table">("trend");
  const [expanded, setExpanded] = useState(false);
  const filteredPeriod = quoteTenorToNcdPeriod(tenorFilter);

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
            className="ml-1 rounded p-0.5 text-slate-400 hover:bg-[var(--tk-color-surface-selected)] hover:text-slate-100"
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
            className="ml-1 rounded p-0.5 text-slate-400 hover:bg-[var(--tk-color-surface-selected)] hover:text-slate-100"
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
        <NcdPrimaryTrendPanel period={filteredPeriod} />
      ) : (
        <NcdPrimaryTable initialPeriod={filteredPeriod} />
      )
    ) : mode === "trend" ? (
      <NcdTrendPanel compact />
    ) : (
      <div className={embeddedPreview ? "min-h-0" : "h-full min-h-0"}>
        <StructuredTable
          columns={["期限", "最新", "涨跌bp", "参考收益", "更新时间"]}
          rows={ncdTableRows}
          greenColumns={[1]}
          deltaColumns={[2]}
          fitToWidth
          columnWidths={["14%", "18%", "16%", "22%", "30%"]}
          compact
          flush={false}
          adaptiveHeight={embeddedPreview}
          scrollY={!embeddedPreview}
        />
      </div>
    );

  return (
    <>
      <section
        className={`tk-panel flex min-h-0 flex-col border ${
          embeddedPreview ? "h-full overflow-hidden" : "h-full overflow-hidden"
        }`}
      >
        {embeddedPreview ? (
          <IntegratedPreviewHeader
            id="ncd"
            onOpen={onOpen}
            tenorFilter={tenorFilter}
            actions={
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
                <button
                  onClick={() => setExpanded(true)}
                  type="button"
                  className="rounded p-0.5 text-slate-400 hover:bg-[var(--tk-color-surface-selected)] hover:text-slate-100"
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
              </div>
            }
          />
        ) : (
          <div className="tk-panel-header border-b px-4 py-2.5">
            {header()}
          </div>
        )}
        <div
          className={
            embeddedPreview
              ? "flex min-h-0 flex-1 flex-col overflow-hidden p-2"
              : "flex min-h-0 flex-1 flex-col overflow-hidden p-2"
          }
        >
          {body}
        </div>
      </section>
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(17,24,39,0.32)]"
          onClick={() => setExpanded(false)}
        >
          <div
            className="relative flex h-[85vh] w-[90vw] max-w-[1400px] flex-col overflow-hidden rounded-2xl border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] shadow-[0_12px_28px_rgba(17,24,39,0.12)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setExpanded(false)}
              type="button"
              className="absolute right-3 top-3 z-10 rounded p-1 text-slate-400 hover:bg-[var(--tk-color-surface-selected)] hover:text-slate-100"
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
                <NcdExpandedDualView period={filteredPeriod} />
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
  embeddedPreview = false,
  onOpen,
  tenorFilter = "all",
}: {
  title: string;
  markets: ExchangeMarketSplitSection["markets"];
  embeddedPreview?: boolean;
  onOpen?: () => void;
  tenorFilter?: QuoteTenorFilter;
}) {
  void tenorFilter;
  const [activeView, setActiveView] = useState<"core" | "sse" | "szse">("core");
  const filteredMarkets =
    activeView === "core"
      ? markets
      : markets.filter((market) => market.id === activeView);
  const displayedMarkets = filteredMarkets.map((market) => ({
    ...market,
    rows: exchangeRepoOneMonthRows(market),
  }));

  return (
    <section
      className={`tk-panel flex min-h-0 flex-col border ${
        embeddedPreview ? "h-full overflow-hidden" : "h-full overflow-hidden"
      }`}
    >
      {embeddedPreview ? (
          <IntegratedPreviewHeader
            id="exchange-repo"
            onOpen={onOpen}
            tenorFilter={tenorFilter}
            actions={
            <>
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
                className="tk-button tk-button-success"
                type="button"
              >
                下载
              </button>
            </>
          }
        />
      ) : (
        <div className="tk-panel-header border-b px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="tk-title">
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
                className="tk-button tk-button-success"
                type="button"
              >
                下载
              </button>
            </div>
          </div>
        </div>
      )}
      <div className={embeddedPreview ? "min-h-0 flex-1 overflow-hidden p-2" : "min-h-0 flex-1 p-2"}>
        {activeView === "core" ? (
          <ExchangeCoreCompactBoard
            markets={displayedMarkets}
            embeddedPreview={embeddedPreview}
          />
        ) : (
          <div
            className={
              embeddedPreview
                ? "grid h-full min-h-0 grid-cols-1"
                : "grid h-full min-h-0 grid-cols-1"
            }
          >
            {displayedMarkets.map((market) => (
              <ExchangeMarketTable
                key={`${activeView}-${market.id}`}
                market={market}
                rows={market.rows}
                embeddedPreview={embeddedPreview}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

const exchangeRepoOneMonthMarketRows: Record<
  "sse" | "szse",
  readonly (readonly string[])[]
> = {
  sse: [
    ["1\u5929", "GC001", "1.3700", "-1.00", "10:31"],
    ["7\u5929", "GC007", "1.3750", "-1.00", "10:28"],
    ["14\u5929", "GC014", "1.3920", "-0.50", "10:22"],
    ["21\u5929", "GC021", "1.4180", "0.00", "10:15"],
    ["1M", "GC028", "1.4460", "0.50", "10:10"],
  ],
  szse: [
    ["1\u5929", "R-001", "1.3900", "-1.50", "10:30"],
    ["7\u5929", "R-007", "1.4000", "-0.50", "10:25"],
    ["14\u5929", "R-014", "1.4230", "0.00", "10:20"],
    ["21\u5929", "R-021", "1.4520", "0.50", "10:12"],
    ["1M", "R-028", "1.4850", "1.00", "10:08"],
  ],
};

function exchangeRepoOneMonthRows(
  market: ExchangeMarketSplitSection["markets"][number],
) {
  const marketRows =
    market.id === "sse" || market.id === "szse"
      ? exchangeRepoOneMonthMarketRows[market.id]
      : market.rows;
  return marketRows.slice(0, 5);
}

function ExchangeCoreCompactBoard({
  markets,
  embeddedPreview = false,
}: {
  markets: ExchangeMarketSplitSection["markets"];
  embeddedPreview?: boolean;
}) {
  const coreRows = markets.flatMap((market) => market.rows.slice(0, 2));
  return (
    <div className={embeddedPreview ? "min-h-0" : "h-full min-h-0"}>
      <ExchangeCoreCompactBlock
        rows={coreRows}
        rowCount={4}
        embeddedPreview={embeddedPreview}
      />
    </div>
  );
}

function ExchangeCoreCompactBlock({
  rows,
  rowCount = 2,
  embeddedPreview = false,
}: {
  rows: readonly (readonly string[])[];
  rowCount?: number;
  embeddedPreview?: boolean;
}) {
  const paddedRows = Array.from(
    { length: rowCount },
    (_, i) => rows[i] ?? null,
  );
  return (
    <div
      className={`flex min-h-0 flex-col rounded-xl border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] ${
        embeddedPreview ? "h-auto overflow-visible" : "h-full overflow-hidden"
      }`}
    >
      <table className="w-full table-fixed shrink-0">
        <thead>
          <tr className="border-b border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-dark-soft)] text-mini font-medium tracking-[0.02em] text-slate-400">
            <th className="w-[15%] px-2 py-1.5 text-left font-medium">期限</th>
            <th className="w-[25%] px-2 py-1.5 text-left font-medium">品种</th>
            <th className="w-[22%] px-2 py-1.5 text-right font-medium">最新</th>
            <th className="w-[20%] px-2 py-1.5 text-right font-medium">涨跌bp</th>
            <th className="w-[18%] px-2 py-1.5 text-right font-medium">时间</th>
          </tr>
        </thead>
      </table>
      <div
        className={
          embeddedPreview ? "min-h-0 overflow-visible" : "min-h-0 flex-1 overflow-y-auto"
        }
      >
        <table className="w-full table-fixed">
          <tbody>
            {paddedRows.map((row, rowIndex) => (
              <tr
                key={row ? `${row[1]}-${rowIndex}` : `empty-${rowIndex}`}
                className={`text-xs ${
                  rowIndex > 0 ? "border-t border-[color:var(--tk-color-border-divider)]" : ""
                }`}
              >
                {row ? (
                  <>
                    <td className="w-[15%] px-2 py-1.5 font-semibold text-slate-100">
                      {row[0]}
                    </td>
                    <td className="w-[25%] px-2 py-1.5 font-semibold text-slate-100">
                      {row[1]}
                    </td>
                    <td className="w-[22%] px-2 py-1.5 text-right font-semibold text-emerald-300">
                      {row[2]}
                    </td>
                    <td
                      className={`w-[20%] px-2 py-1.5 text-right ${cellClassName(row[3], 1, [], [], [1], [])}`}
                    >
                      {row[3]}
                    </td>
                    <td className="w-[18%] px-2 py-1.5 text-right text-slate-400">
                      {row[4] ?? "--"}
                    </td>
                  </>
                ) : (
                  <td colSpan={5} />
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
  embeddedPreview = false,
}: {
  market: ExchangeMarketSplitSection["markets"][number];
  rows?: readonly (readonly string[])[];
  embeddedPreview?: boolean;
}) {
  const displayRows = rows ?? market.rows;

  return (
    <div
      className={`flex min-h-0 flex-col rounded-xl border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] ${
        embeddedPreview ? "h-auto overflow-visible" : "h-full overflow-hidden"
      }`}
    >
      <table className="w-full table-fixed shrink-0">
        <thead>
          <tr className="border-b border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-dark-soft)] text-mini font-medium tracking-[0.02em] text-slate-400">
            {market.columns.map((column, index) => (
              <th
                key={`${market.title}-${column}`}
                className={`px-2 py-1.5 font-medium ${
                  index === 0
                    ? "w-[15%] text-left"
                    : index === 1
                      ? "w-[25%] text-left"
                      : index === 2
                        ? "w-[22%] text-right"
                        : index === 3
                          ? "w-[20%] text-right"
                          : "w-[18%] text-right"
                }`}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
      </table>
      <div
        className={
          embeddedPreview ? "min-h-0 overflow-visible" : "min-h-0 flex-1 overflow-y-auto"
        }
      >
        <table className="w-full table-fixed">
          <tbody>
            {displayRows.map((row, rowIndex) => (
              <tr
                key={`${market.title}-${row[0]}-${rowIndex}`}
                className={`border-b border-[color:var(--tk-color-border-divider)] text-xs ${
                  rowIndex % 2 === 0 ? "bg-transparent" : "bg-[rgba(255,255,255,0.025)]"
                }`}
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={`${market.title}-${row[0]}-${cellIndex}`}
                    className={`px-2 py-1.5 ${
                      cellIndex === 0
                        ? "w-[15%] text-left"
                        : cellIndex === 1
                          ? "w-[25%] text-left truncate"
                          : cellIndex === 2
                            ? "w-[22%] text-right"
                            : cellIndex === 3
                              ? "w-[20%] text-right"
                              : "w-[18%] text-right text-slate-400"
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

const QUOTE_TENOR_OPTIONS = ["R001", "R007", "R014", "R021", "R028"] as const;
type QuoteTenorFilter = (typeof QUOTE_TENOR_OPTIONS)[number] | "all";

type QuoteOverride = Partial<
  Pick<
    QuoteDetailRow,
    | "institution"
    | "tenor"
    | "rank"
    | "amount"
    | "rate"
    | "accountType"
    | "collateral"
    | "minimum"
    | "updatedAt"
  >
> & { groupName?: string };
type QuoteChatPayload = {
  id: string;
  institution: string;
  contactName: string;
  tenor: string;
  amount: string;
  rate: string;
  collateral: string;
  account: string;
  updatedAt: string;
};
type QuoteChatContext = {
  quote: QuoteChatPayload;
  groupName: string;
  sectionTitle: string;
};
type PinnedQuote = {
  key: string;
  sectionId: RepoQuoteSection["id"];
  groupName: string;
  row: QuoteDetailRow;
  institution: string;
  tenor: string;
};
type OpponentQuoteCard = {
  id: string;
  name: string;
  institution: string;
  waitMinutes: number;
  status: "unreplied" | "replied";
  updatedAt: string;
  tenor: string;
  amount: string | null;
  rate: string;
  pledge: string | null;
  account: string | null;
  tags: readonly string[];
  core: boolean;
  special?: boolean;
};

function formatInstitutionSender(institution: string, sender: string) {
  return `${institution} / ${sender}`;
}

function parseOptionalFilterNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "不限") return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseAmountTextToYi(value: string | null | undefined) {
  if (!value || value === "--") return null;
  const normalized = value.replace(/,/g, "").trim();
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) return null;
  if (normalized.includes("万")) return parsed / 10000;
  return parsed;
}

function normalizeAmountFilterToYi(value: string, unit: AmountFilterUnit) {
  const parsed = parseOptionalFilterNumber(value);
  if (parsed === null) return null;
  return unit === "wan" ? parsed / 10000 : parsed;
}

function displayAmountForRow(row: QuoteDetailRow) {
  return showRowAmount(row.id) ? row.amount : null;
}

function formatUnifiedReplyStatus(status: OpponentQuoteCard["status"]) {
  return status === "replied" ? "已回复" : "未回复";
}

function buildPrimaryChatQuote(row: QuoteDetailRow): QuoteChatPayload {
  return {
    id: row.id,
    institution: row.institution,
    contactName: contactNameForInstitution(row.institution),
    tenor: row.tenor,
    amount: displayAmountForRow(row) ?? "--",
    rate: row.rate,
    collateral: row.collateral,
    account: shouldShowAccountRequirement(row.id)
      ? normalizeAccountRequirement(row.accountType)
      : "",
    updatedAt: row.updatedAt,
  };
}

function buildOpponentChatQuote(card: OpponentQuoteCard): QuoteChatPayload {
  return {
    id: card.id,
    institution: card.institution,
    contactName: card.name,
    tenor: card.tenor,
    amount: card.amount ?? "--",
    rate: card.rate,
    collateral: card.pledge ?? "",
    account: card.account ?? "",
    updatedAt: card.updatedAt,
  };
}

type UnifiedQuoteTableRow = {
  id: string;
  kind: "primary" | "supplement";
  coreLabel: string;
  replyStatus: string;
  institution: string;
  sender: string;
  tenor: string;
  amount: string;
  rate: string;
  account: string;
  pledge: string;
  updatedAt: string;
  groupName: string;
  chatQuote: QuoteChatPayload;
  pinItem: PinnedQuote;
};
type QuoteTableSortField = "amount" | "rate";
type QuoteTableSortDirection = "asc" | "desc";
type QuoteTableSortState = {
  field: QuoteTableSortField;
  direction: QuoteTableSortDirection;
};

function nextQuoteTableSortState(
  current: QuoteTableSortState | null,
  field: QuoteTableSortField,
  defaultDirection: QuoteTableSortDirection,
): QuoteTableSortState | null {
  if (!current || current.field !== field) {
    return { field, direction: defaultDirection };
  }
  if (current.direction === defaultDirection) {
    return {
      field,
      direction: defaultDirection === "asc" ? "desc" : "asc",
    };
  }
  return null;
}

function compareOptionalSortNumbers(
  left: number | null,
  right: number | null,
  direction: QuoteTableSortDirection,
) {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return direction === "asc" ? left - right : right - left;
}

function QuoteSortHeaderButton({
  label,
  activeDirection,
  align = "right",
  onToggle,
}: {
  label: string;
  activeDirection: QuoteTableSortDirection | null;
  align?: "left" | "right";
  onToggle: () => void;
}) {
  const justifyClass = align === "left" ? "justify-start" : "justify-end";
  const icon = activeDirection === "asc"
    ? <ChevronUp size={12} />
    : activeDirection === "desc"
      ? <ChevronDown size={12} />
      : <ArrowUpDown size={12} />;

  return (
    <button
      className={`inline-flex w-full items-center gap-1 ${justifyClass} text-mini text-current transition hover:text-slate-200`}
      onClick={onToggle}
      type="button"
    >
      <span>{label}</span>
      <span className={activeDirection ? "text-slate-200" : "text-slate-500"}>
        {icon}
      </span>
    </button>
  );
}

const pinnedQuoteKey = (
  sectionId: RepoQuoteSection["id"],
  groupName: string,
  institution: string,
  tenor: string,
) => `${sectionId}:${groupName}:${institution}:${tenor}`;

function pinnedQuoteFromRow(
  row: QuoteDetailRow,
  groupName: string,
  section: RepoQuoteSection,
): PinnedQuote {
  return {
    key: pinnedQuoteKey(section.id, groupName, row.institution, row.tenor),
    sectionId: section.id,
    groupName,
    row,
    institution: row.institution,
    tenor: row.tenor,
  };
}

const opponentNames = [
  "张经理",
  "孙经理",
  "李经理",
  "罗成",
  "刘佳",
  "孙悦",
  "凯经理",
  "唐敏",
  "邓珊",
  "高远",
  "潘宁",
  "周经理",
] as const;

const opponentInstitutions = [
  "中信银行",
  "建设银行",
  "农业银行",
  "国泰资产",
  "邮储银行",
  "江苏银行",
  "上海农商",
  "招商基金",
  "平安理财",
  "杭州银行",
  "上海银行",
  "华安基金",
] as const;

const quoteContactNames: Record<string, string> = {
  中信银行: "李明轩",
  北京银行: "王知夏",
  上海农商行: "陈以宁",
  广州银行: "周叙白",
  招商银行: "赵予安",
  浦发银行: "刘星野",
  民生银行: "孙若川",
  珠海农商行: "黄景川",
  重庆农商行: "吴书言",
  农银理财: "李见山",
  阳光资产: "许知远",
  招银理财: "周临风",
  工银理财: "张屿川",
  太保资产: "陈北辰",
  交银理财: "赵清和",
  鹏华基金: "林疏桐",
  平安资产: "何沐言",
  中信建投证券: "张砚秋",
  华安基金: "郑知微",
  中信证券: "陆时安",
  东方红资产: "宋景行",
  上海银行: "顾言舟",
  国泰君安: "沈之恒",
  华夏基金: "马清越",
  中国银行: "李承泽",
  建设银行: "孙知行",
  交通银行: "赵元恺",
  农业银行: "李予川",
  工商银行: "张闻野",
  兴业银行: "王牧之",
  北京农商行: "王叙川",
  中银理财: "吴清野",
  平安资管: "何叙安",
  交银施罗德: "赵云澈",
  招商证券: "秦知远",
  平安基金: "何清禾",
  信达证券: "高叙宁",
  海通证券: "唐景川",
};

function contactNameForInstitution(institution: string) {
  return quoteContactNames[institution] ?? "周予安";
}

type DemandDirection = "repo" | "reverse";
type DemandTenor = "R001" | "R007";
type DemandAmount = { need: number; done: number };
type DemandRow = {
  label: string;
  color: string;
  cells: Record<DemandTenor, DemandAmount>;
};
type DemandGapRow = {
  id: string;
  direction: DemandDirection;
  directionLabel: string;
  account: string;
  collateral: string;
  tenor: DemandTenor;
  need: number;
  done: number;
  gap: number;
  progress: number;
  priority: "高" | "中" | "低";
  suggestion: string;
};
type DemandMatrix = {
  rows: DemandRow[];
  rowTotals: Record<string, DemandAmount>;
  columnTotals: Record<DemandTenor, DemandAmount>;
  grandTotal: DemandAmount;
};
type BarometerRange = "overnight" | "7d";
type BarometerMetric = "count" | "volume";
type BarometerLineStyle = "solid" | "dashed";
type BarometerPoint = { t: string; value: number };
type BarometerSeries = {
  key: string;
  label: string;
  color: string;
  lineStyle: BarometerLineStyle;
  points: BarometerPoint[];
};
type BarometerSlice = {
  yUnit: string;
  yLabel: string;
  series: BarometerSeries[];
};

const middleMatrixPlaceholders = [
  { title: "正回购需求", tag: "需求矩阵", hint: "本方正回购 · 押券 × 期限", kind: "matrix", direction: "repo" },
  { title: "逆回购需求", tag: "需求矩阵", hint: "本方逆回购 · 押券 × 期限", kind: "matrix", direction: "reverse" },
] as const;

const demandTenors: DemandTenor[] = ["R001", "R007"];
const demandDirectionLabels: Record<DemandDirection, string> = {
  repo: "正回购",
  reverse: "逆回购",
};
const demandAccountsByDirection: Record<DemandDirection, Record<DemandTenor, readonly string[]>> = {
  repo: {
    R001: ["自营稳健户", "理财增强户", "专户现金管理"],
    R007: ["理财增强户", "资管专户", "自营稳健户"],
  },
  reverse: {
    R001: ["现金融出户", "短久期专户", "流动性备付户"],
    R007: ["短久期专户", "现金融出户", "同业配置户"],
  },
};
const xrepoR001Rows = <T extends readonly string[]>(rows: readonly T[]) =>
  rows.filter((row) => row[0]?.toUpperCase().includes("R001"));

const demandRowsByDirection: Record<DemandDirection, DemandRow[]> = {
  repo: [
    { label: "利率地方", color: "var(--tk-color-chart-blue)", cells: { R001: { need: 40.6, done: 31.2 }, R007: { need: 16.4, done: 13.1 } } },
    { label: "存单商金", color: "var(--tk-color-chart-gold)", cells: { R001: { need: 0, done: 0 }, R007: { need: 25.3, done: 18.4 } } },
    { label: "信用", color: "var(--tk-color-chart-purple)", cells: { R001: { need: 9.2, done: 7.1 }, R007: { need: 15.7, done: 15.7 } } },
  ],
  reverse: [
    { label: "利率地方", color: "var(--tk-color-chart-blue)", cells: { R001: { need: 29.4, done: 24.3 }, R007: { need: 20.2, done: 15.5 } } },
    { label: "存单商金", color: "var(--tk-color-chart-gold)", cells: { R001: { need: 0, done: 0 }, R007: { need: 18.6, done: 12.4 } } },
    { label: "信用", color: "var(--tk-color-chart-purple)", cells: { R001: { need: 6.3, done: 5.1 }, R007: { need: 9.5, done: 7.2 } } },
  ],
};

const roundDemandValue = (value: number) => Number(value.toFixed(1));

const addDemand = (items: DemandAmount[]): DemandAmount => ({
  need: roundDemandValue(items.reduce((sum, item) => sum + item.need, 0)),
  done: roundDemandValue(items.reduce((sum, item) => sum + item.done, 0)),
});

const buildDemandMatrix = (rows: DemandRow[]): DemandMatrix => {
  const rowTotals = Object.fromEntries(
    rows.map((row) => [
      row.label,
      addDemand(demandTenors.map((tenor) => row.cells[tenor])),
    ]),
  ) as Record<string, DemandAmount>;

  const columnTotals = Object.fromEntries(
    demandTenors.map((tenor) => [
      tenor,
      addDemand(rows.map((row) => row.cells[tenor])),
    ]),
  ) as Record<DemandTenor, DemandAmount>;

  return {
    rows,
    rowTotals,
    columnTotals,
    grandTotal: addDemand(demandTenors.map((tenor) => columnTotals[tenor])),
  };
};

const demandGap = (amount: DemandAmount) => Math.max(roundDemandValue(amount.need - amount.done), 0);
const demandProgress = (amount: DemandAmount) =>
  amount.need > 0 ? Math.min(100, Math.round((amount.done / amount.need) * 100)) : 0;
const formatDemandAmount = (value: number) => value.toFixed(1);

const demandPriority = (gap: number): DemandGapRow["priority"] => {
  if (gap >= 8) return "高";
  if (gap >= 3) return "中";
  return "低";
};

const buildDemandGapRows = (): DemandGapRow[] =>
  (["repo", "reverse"] as DemandDirection[])
    .flatMap((direction) =>
      demandRowsByDirection[direction].flatMap((row) =>
        demandTenors.map((tenor) => {
          const amount = row.cells[tenor];
          const gap = demandGap(amount);
          const rowIndex = demandRowsByDirection[direction].findIndex((item) => item.label === row.label);
          return {
            id: `${direction}-${row.label}-${tenor}`,
            direction,
            directionLabel: demandDirectionLabels[direction],
            account: demandAccountsByDirection[direction][tenor][Math.max(rowIndex, 0)] ?? "综合账户",
            collateral: row.label,
            tenor,
            need: amount.need,
            done: amount.done,
            gap,
            progress: demandProgress(amount),
            priority: demandPriority(gap),
            suggestion:
              gap >= 8
                ? "优先匹配可接受押券与价格"
                : gap > 0
                  ? "观察尾盘补量机会"
                  : "缺口已覆盖",
          };
        }),
      ),
    )
    .filter((row) => row.gap > 0)
    .sort((a, b) => b.gap - a.gap);

const barometerRangeOptions: Array<{ value: BarometerRange; label: string }> = [
  { value: "overnight", label: "隔夜" },
  { value: "7d", label: "7D" },
];

const barometerMetricOptions: Array<{ value: BarometerMetric; label: string }> = [
  { value: "count", label: "笔数" },
  { value: "volume", label: "量" },
];
const qtInstitutionOptions = [
  { value: "all", label: "全部机构", factor: 1 },
  { value: "large-bank", label: "大型银行", factor: 1.12 },
  { value: "joint-bank", label: "股份制商业银行", factor: 0.96 },
  { value: "city-bank", label: "城市商业银行", factor: 0.82 },
  { value: "broker", label: "证券公司", factor: 0.74 },
  { value: "fund", label: "基金公司及产品", factor: 0.68 },
] as const;
type QtInstitutionType = (typeof qtInstitutionOptions)[number]["value"];

type BarometerInstitutionProfile = {
  factor: number;
  amPeakShift: number;
  pmPeakShift: number;
  amPeakScale: number;
  pmPeakScale: number;
  amWidth: number;
  pmWidth: number;
  valleyFloor: number;
  drift: number;
  wobble: number;
  seed: number;
};

const qtInstitutionProfiles: Record<QtInstitutionType, BarometerInstitutionProfile> = {
  all: {
    factor: 1,
    amPeakShift: 0,
    pmPeakShift: 0,
    amPeakScale: 1,
    pmPeakScale: 1,
    amWidth: 1.8,
    pmWidth: 2.6,
    valleyFloor: 0,
    drift: 0,
    wobble: 1,
    seed: 0,
  },
  "large-bank": {
    factor: 1.12,
    amPeakShift: -0.25,
    pmPeakShift: -0.15,
    amPeakScale: 1.08,
    pmPeakScale: 0.88,
    amWidth: 1.65,
    pmWidth: 2.35,
    valleyFloor: 0.018,
    drift: -0.018,
    wobble: 0.92,
    seed: 3.7,
  },
  "joint-bank": {
    factor: 0.96,
    amPeakShift: 0.18,
    pmPeakShift: 0.35,
    amPeakScale: 0.92,
    pmPeakScale: 1.04,
    amWidth: 1.95,
    pmWidth: 2.9,
    valleyFloor: 0.026,
    drift: 0.012,
    wobble: 1.1,
    seed: 7.4,
  },
  "city-bank": {
    factor: 0.82,
    amPeakShift: 0.55,
    pmPeakShift: 0.1,
    amPeakScale: 0.82,
    pmPeakScale: 1.18,
    amWidth: 2.15,
    pmWidth: 2.45,
    valleyFloor: 0.04,
    drift: 0.026,
    wobble: 1.22,
    seed: 11.1,
  },
  broker: {
    factor: 0.74,
    amPeakShift: -0.45,
    pmPeakShift: 0.45,
    amPeakScale: 1.22,
    pmPeakScale: 1.06,
    amWidth: 1.45,
    pmWidth: 2.2,
    valleyFloor: 0.012,
    drift: 0.018,
    wobble: 1.34,
    seed: 15.8,
  },
  fund: {
    factor: 0.68,
    amPeakShift: 0.35,
    pmPeakShift: 0.65,
    amPeakScale: 0.72,
    pmPeakScale: 1.28,
    amWidth: 1.9,
    pmWidth: 2.65,
    valleyFloor: 0.034,
    drift: 0.038,
    wobble: 1.18,
    seed: 22.6,
  },
};

const barometerAmSlots = [
  "08:15",
  "08:30",
  "08:45",
  "09:00",
  "09:15",
  "09:30",
  "09:45",
  "10:00",
  "10:15",
  "10:30",
  "10:45",
  "11:00",
  "11:15",
];
const barometerPmSlots = [
  "13:15",
  "13:30",
  "13:45",
  "14:00",
  "14:15",
  "14:30",
  "14:45",
  "15:00",
  "15:15",
  "15:30",
  "15:45",
  "16:00",
];
const barometerTimeline = [...barometerAmSlots, ...barometerPmSlots];
const barometerOutColor = "#ffa028";
const barometerInColor = "#1872f6";

const barometerGauss = (x: number, mu: number, sigma: number) =>
  Math.exp(-((x - mu) ** 2) / (2 * sigma * sigma));

function buildBarometerShape(
  peakAm: number,
  peakPm: number,
  amplitudeAm: number,
  amplitudePm: number,
  noiseSeed: number,
): BarometerPoint[] {
  const amLength = barometerAmSlots.length;
  return barometerTimeline.map((t, index) => {
    const isAm = index < amLength;
    const localIndex = isAm ? index : index - amLength;
    const base = isAm
      ? amplitudeAm * barometerGauss(localIndex, peakAm, 1.8)
      : amplitudePm * barometerGauss(localIndex, peakPm, 2.6);
    const wobble =
      Math.sin((index + noiseSeed) * 1.7) * 0.06 +
      Math.cos(index * 0.9 + noiseSeed) * 0.04;
    return { t, value: Math.max(0, Math.round(base * (1 + wobble))) };
  });
}

const scaleBarometerPoints = (
  points: BarometerPoint[],
  factor: number,
): BarometerPoint[] =>
  points.map((point) => ({ ...point, value: Math.round(point.value * factor) }));

const barometerSeriesSeed = (key: string) =>
  key.split("").reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0) / 97;

function buildInstitutionBarometerPoints(
  points: BarometerPoint[],
  profile: BarometerInstitutionProfile,
  seriesKey: string,
): BarometerPoint[] {
  if (profile.seed === 0) return scaleBarometerPoints(points, profile.factor);

  const amLength = barometerAmSlots.length;
  const amPoints = points.slice(0, amLength);
  const pmPoints = points.slice(amLength);
  const amMax = Math.max(...amPoints.map((point) => point.value), 1);
  const pmMax = Math.max(...pmPoints.map((point) => point.value), 1);
  const seed = profile.seed + barometerSeriesSeed(seriesKey);
  const isReverse = seriesKey.toLowerCase().includes("in");
  const isYesterday = seriesKey.toLowerCase().includes("yesterday");
  const directionShift = isReverse ? 0.18 : -0.08;
  const yesterdayShift = isYesterday ? -0.14 : 0;
  const amPeak = 4 + profile.amPeakShift + directionShift + yesterdayShift;
  const pmPeak = 8 + profile.pmPeakShift - directionShift * 0.7 + yesterdayShift;

  return points.map((point, index) => {
    const isAm = index < amLength;
    const localIndex = isAm ? index : index - amLength;
    const peak = isAm ? amPeak : pmPeak;
    const width = isAm ? profile.amWidth : profile.pmWidth;
    const maxValue = isAm ? amMax : pmMax;
    const peakScale = isAm ? profile.amPeakScale : profile.pmPeakScale;
    const amplitude = maxValue * profile.factor * peakScale;
    const base = amplitude * barometerGauss(localIndex, peak, width);
    const floor = amplitude * profile.valleyFloor;
    const drift = 1 + profile.drift * (index / Math.max(points.length - 1, 1) - 0.5);
    const wobble =
      Math.sin((index + seed) * 1.53) * 0.055 * profile.wobble +
      Math.cos(index * 0.82 + seed * 0.7) * 0.035 * profile.wobble;
    const value = (base + floor) * drift * (1 + wobble);
    return {
      ...point,
      value: Math.max(0, Math.round(value)),
    };
  });
}

function buildBarometerSeries(
  todayOut: BarometerPoint[],
  todayIn: BarometerPoint[],
  yesterdayOut: BarometerPoint[],
  yesterdayIn: BarometerPoint[],
): BarometerSeries[] {
  return [
    {
      key: "todayOut",
      label: "今日正回购",
      color: barometerOutColor,
      lineStyle: "solid",
      points: todayOut,
    },
    {
      key: "todayIn",
      label: "今日逆回购",
      color: barometerInColor,
      lineStyle: "solid",
      points: todayIn,
    },
    {
      key: "yesterdayOut",
      label: "昨日正回购",
      color: barometerOutColor,
      lineStyle: "dashed",
      points: yesterdayOut,
    },
    {
      key: "yesterdayIn",
      label: "昨日逆回购",
      color: barometerInColor,
      lineStyle: "dashed",
      points: yesterdayIn,
    },
  ];
}

const barometerTodayOutCount = buildBarometerShape(4, 8, 226, 148, 0);
const barometerTodayInCount = buildBarometerShape(4, 8, 64, 48, 1.3);
const barometerYesterdayOutCount = buildBarometerShape(4, 8, 198, 132, 2.1);
const barometerYesterdayInCount = buildBarometerShape(4, 8, 58, 42, 3.4);

const barometerData: Record<BarometerRange, Record<BarometerMetric, BarometerSlice>> = {
  overnight: {
    count: {
      yUnit: "笔",
      yLabel: "成交（笔）",
      series: buildBarometerSeries(
        barometerTodayOutCount,
        barometerTodayInCount,
        barometerYesterdayOutCount,
        barometerYesterdayInCount,
      ),
    },
    volume: {
      yUnit: "亿",
      yLabel: "成交（亿）",
      series: buildBarometerSeries(
        scaleBarometerPoints(barometerTodayOutCount, 1.8),
        scaleBarometerPoints(barometerTodayInCount, 2.4),
        scaleBarometerPoints(barometerYesterdayOutCount, 1.7),
        scaleBarometerPoints(barometerYesterdayInCount, 2.3),
      ),
    },
  },
  "7d": {
    count: {
      yUnit: "笔",
      yLabel: "成交（笔）",
      series: buildBarometerSeries(
        scaleBarometerPoints(barometerTodayOutCount, 0.62),
        scaleBarometerPoints(barometerTodayInCount, 0.78),
        scaleBarometerPoints(barometerYesterdayOutCount, 0.6),
        scaleBarometerPoints(barometerYesterdayInCount, 0.74),
      ),
    },
    volume: {
      yUnit: "亿",
      yLabel: "成交（亿）",
      series: buildBarometerSeries(
        scaleBarometerPoints(barometerTodayOutCount, 1.26),
        scaleBarometerPoints(barometerTodayInCount, 1.87),
        scaleBarometerPoints(barometerYesterdayOutCount, 1.02),
        scaleBarometerPoints(barometerYesterdayInCount, 1.61),
      ),
    },
  },
};

function BarometerMatrixCard() {
  const [range, setRange] = useState<BarometerRange>("overnight");
  const [metric, setMetric] = useState<BarometerMetric>("count");
  const [institutionType, setInstitutionType] = useState<QtInstitutionType>("all");
  const institutionProfile = qtInstitutionProfiles[institutionType] ?? qtInstitutionProfiles.all;
  const rawSlice = barometerData[range][metric];
  const currentSlice: BarometerSlice = {
    ...rawSlice,
    series: rawSlice.series.map((series) => ({
      ...series,
      points: buildInstitutionBarometerPoints(
        series.points,
        institutionProfile,
        series.key,
      ),
    })),
  };
  const allValues = currentSlice.series.flatMap((series) =>
    series.points.map((point) => point.value),
  );
  const max = Math.max(...allValues, 1);
  const min = 0;
  const width = 320;
  const height = 110;
  const yTicks = [max, max * 0.66, max * 0.33, 0].map((value) =>
    Math.round(value),
  );
  const visibleTimeLabels = new Set(["08:15", "09:15", "10:15", "11:15", "15:00", "16:00"]);
  const { tooltipState, containerRef, handleMouseMove, handleMouseLeave } =
    useChartTooltip(barometerTimeline.length);
  const tooltipIndex = tooltipState?.index ?? null;

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_auto_minmax(0,1fr)_auto] overflow-hidden rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]">
      <div className="flex items-center justify-between gap-2 border-b border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-dark-soft)] px-3 py-2.5">
        <div className="tk-matrix-card-title shrink-0 whitespace-nowrap">机构报价热度</div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-[color:var(--tk-color-border-divider)] px-3 py-2.5 text-xs">
        <label className="flex items-center gap-1.5 text-mini text-slate-400">
          分机构统计
          <select
            className="tk-field tk-field--compact min-w-[104px] rounded px-2 text-mini text-slate-100 outline-none"
            value={institutionType}
            onChange={(event) => setInstitutionType(event.target.value as QtInstitutionType)}
          >
            {qtInstitutionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <BarometerSegmentedControl
          label="期限"
          options={barometerRangeOptions}
          value={range}
          onChange={setRange}
        />
        <BarometerSegmentedControl
          label="口径"
          options={barometerMetricOptions}
          value={metric}
          onChange={setMetric}
        />
      </div>

      <div className="grid min-h-0 grid-cols-[2.7rem_minmax(0,1fr)] grid-rows-[minmax(0,1fr)_1rem] px-3 pb-1 pt-2">
        <div className="flex flex-col justify-between pr-2 text-right text-micro text-slate-500">
          <div className="text-micro text-slate-500">{currentSlice.yLabel}</div>
          {yTicks.map((tick) => (
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
              key={`barometer-grid-${index}`}
              className="absolute inset-x-0 border-t border-[color:var(--tk-color-border-divider)] opacity-60"
              style={{ top: `${(index / 3) * 100}%` }}
            />
          ))}
          <svg
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="none"
            viewBox={`0 0 ${width} ${height}`}
          >
            {currentSlice.series.map((series) => (
              <path
                key={series.key}
                d={buildLinePath(
                  series.points.map((point) => point.value),
                  width,
                  height,
                  min,
                  max,
                )}
                fill="none"
                stroke={series.color}
                strokeDasharray={series.lineStyle === "dashed" ? "7 5" : undefined}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={series.lineStyle === "dashed" ? 1.7 : 2.1}
              />
            ))}
            {tooltipIndex !== null ? (
              <line
                x1={(tooltipIndex / (barometerTimeline.length - 1)) * width}
                x2={(tooltipIndex / (barometerTimeline.length - 1)) * width}
                y1={0}
                y2={height}
                stroke="#94a3b8"
                strokeDasharray="4 4"
                strokeOpacity="0.5"
              />
            ) : null}
          </svg>
          {tooltipState !== null && tooltipIndex !== null ? (
            <ChartTooltip
              clientX={tooltipState.clientX}
              clientY={tooltipState.clientY}
            >
              <div className="mb-1 font-medium text-slate-300">
                {barometerTimeline[tooltipIndex]}
              </div>
              <div className="grid gap-1">
                {currentSlice.series.map((series) => (
                  <div key={series.key} className="flex items-center gap-2">
                    <span
                      className="h-1.5 w-3"
                      style={{
                        borderTop: `2px ${series.lineStyle === "dashed" ? "dashed" : "solid"} ${series.color}`,
                      }}
                    />
                    <span className="text-slate-400">{series.label}</span>
                    <span className="font-medium text-slate-100">
                      {series.points[tooltipIndex].value}
                      {currentSlice.yUnit}
                    </span>
                  </div>
                ))}
              </div>
            </ChartTooltip>
          ) : null}
        </div>
        <div className="col-start-2 row-start-2 flex items-end justify-between text-micro leading-none text-slate-500">
          {barometerTimeline.map((label) => (
            <span key={label}>
              {visibleTimeLabels.has(label) ? label : ""}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 pb-2 pt-1 text-xs text-slate-100">
        {currentSlice.series.map((series) => (
          <span key={series.key} className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <svg width="26" height="10" viewBox="0 0 26 10">
              <line
                x1="1"
                y1="5"
                x2="25"
                y2="5"
                stroke={series.color}
                strokeDasharray={series.lineStyle === "dashed" ? "6 4" : undefined}
                strokeWidth={series.lineStyle === "dashed" ? 1.7 : 2.2}
              />
            </svg>
            {series.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function InstitutionPeriodMatrixCard() {
  const [period, setPeriod] = useState<CfetsInstPeriod>("R001");
  const [metricKey, setMetricKey] = useState<CfetsMetricKey>("buyAmt");
  const [open, setOpen] = useState(false);
  const metric = cfetsMetricDefs.find((item) => item.key === metricKey);
  const previewBlock = cfetsInstTrend[period]?.[metricKey]?.["14d"];
  const previewSeries = fundStructureLegendItems.map((item, index) => ({
    key: item.label,
    label: item.label,
    color: item.color,
    values: previewBlock?.series?.[index] ?? [],
  }));

  return (
    <>
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]">
        <div className="flex flex-wrap items-center gap-2 border-b border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-dark-soft)] px-3 py-2 text-xs">
          <label className="flex items-center gap-1.5 text-slate-400">
            期限
            <select
              className="tk-field h-6 rounded px-2 text-mini text-slate-100 outline-none"
              value={period}
              onChange={(event) => setPeriod(event.target.value as CfetsInstPeriod)}
            >
              {cfetsInstPeriodLabels.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-0 flex-1 items-center gap-1.5 text-slate-400">
            指标
            <select
              className="tk-field h-6 min-w-0 rounded px-2 text-mini text-slate-100 outline-none"
              value={metricKey}
              onChange={(event) => setMetricKey(event.target.value as CfetsMetricKey)}
            >
              {cfetsMetricDefs.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <button
            className="tk-button ml-auto text-micro"
            onClick={() => setOpen(true)}
            type="button"
          >
            打开大图
          </button>
        </div>
        <div className="min-h-0 p-3">
          <MiniInstitutionSeriesPreview
            label={`${period} ${metric?.label ?? ""}`}
            series={previewSeries}
            xLabels={previewBlock?.dates}
            chartType={metric?.chartType ?? "line"}
            unit={metric?.unit ?? ""}
            footnote="图例可点击筛选 · 点击打开完整大图"
          />
        </div>
      </div>
      {open ? (
        <PageFrame title="机构分期限统计大图" onClose={() => setOpen(false)}>
          <div className="tk-panel h-full min-h-0 border p-3">
            <CfetsInstPanel initialPeriod={period} initialMetric={metricKey} />
          </div>
        </PageFrame>
      ) : null}
    </>
  );
}

function BarometerSegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-mini text-slate-400">{label}</span>
      <div className="inline-flex overflow-hidden rounded-sm border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-muted)]">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`tk-chip tk-segmented-tab--compact rounded-none border-0 px-2 text-mini transition ${
              option.value === value
                ? "bg-[var(--tdx-red)] text-white"
                : "text-slate-300 hover:bg-white/5"
            }`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function MatrixPlaceholderCard({
  title,
  tag,
  hint,
  index,
}: {
  title: string;
  tag: string;
  hint: string;
  index: number;
}) {
  return (
    <div className="grid min-h-0 grid-rows-[auto_1fr] overflow-hidden rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]">
      <div className="flex items-center justify-between gap-2 border-b border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-dark-soft)] px-2 py-0.5">
        <div className="min-w-0">
          <div className="tk-matrix-card-title truncate">
            {title}
          </div>
          <div className="tk-matrix-card-subtitle mt-0.5 truncate">
            {hint}
          </div>
        </div>
        <span className="tk-matrix-tag shrink-0 rounded border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-muted)] px-1.5 py-0.5 text-slate-400">
          {tag}
        </span>
      </div>
      <div className="relative min-h-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-45"
          style={{
            background:
              "repeating-linear-gradient(45deg, rgba(71,85,105,0.18) 0, rgba(71,85,105,0.18) 1px, transparent 1px, transparent 8px)",
          }}
        />
        <MiniChartSkeleton activeIndex={index} />
      </div>
    </div>
  );
}

type DemandBottomTab = "demand" | "gap" | "inflight";

const fundGapRows = [
  { account: "泰康稳健增利A", breakEvenRate: "1.42%", gap: "-3.2 / 15.0", accountReq: "利率债质押", collateralReq: "国债/政金债" },
  { account: "泰康丰盈债券", breakEvenRate: "1.55%", gap: "-1.8 / 8.5", accountReq: "不限", collateralReq: "利率债优先" },
  { account: "泰康沪港深精选", breakEvenRate: "1.38%", gap: "0.0 / 5.0", accountReq: "信用债可用", collateralReq: "AA+以上" },
  { account: "泰康颐年混合", breakEvenRate: "1.60%", gap: "-2.5 / 12.0", accountReq: "利率债质押", collateralReq: "国债" },
  { account: "泰康安益纯债", breakEvenRate: "1.48%", gap: "-0.6 / 6.0", accountReq: "不限", collateralReq: "政金债" },
  { account: "泰康裕泰回报", breakEvenRate: "1.52%", gap: "-4.1 / 20.0", accountReq: "利率债质押", collateralReq: "国债/地方债" },
  { account: "泰康策略配置7号", breakEvenRate: "1.35%", gap: "-1.5 / 10.0", accountReq: "利率债质押", collateralReq: "国债/政金债" },
  { account: "泰康宏观回报", breakEvenRate: "1.62%", gap: "-5.3 / 25.0", accountReq: "不限", collateralReq: "利率债优先" },
  { account: "泰康鑫选利90天", breakEvenRate: "1.45%", gap: "-0.8 / 4.0", accountReq: "信用债可用", collateralReq: "AA+以上" },
  { account: "泰康添润6个月", breakEvenRate: "1.58%", gap: "-2.0 / 9.5", accountReq: "利率债质押", collateralReq: "政金债" },
  { account: "泰康恒泰回报", breakEvenRate: "1.40%", gap: "0.0 / 3.0", accountReq: "不限", collateralReq: "国债" },
  { account: "泰康均衡优选", breakEvenRate: "1.50%", gap: "-1.2 / 7.0", accountReq: "利率债质押", collateralReq: "国债/地方债" },
  { account: "泰康瑞坤纯债", breakEvenRate: "1.43%", gap: "-3.8 / 18.0", accountReq: "不限", collateralReq: "政金债" },
  { account: "泰康稳固收益A", breakEvenRate: "1.56%", gap: "-0.4 / 2.5", accountReq: "信用债可用", collateralReq: "AA+以上" },
  { account: "泰康新机遇", breakEvenRate: "1.65%", gap: "-6.0 / 30.0", accountReq: "利率债质押", collateralReq: "国债/政金债" },
  { account: "泰康长江经济带", breakEvenRate: "1.47%", gap: "-1.0 / 5.5", accountReq: "不限", collateralReq: "利率债优先" },
] as const;

const inflightRows = [
  { account: "泰康稳健增利A", gap: "-3.2 / 15.0", progress: 78, accountReq: "利率债质押", collateralReq: "国债/政金债", issuedAt: "09:32" },
  { account: "泰康丰盈债券", gap: "-1.8 / 8.5", progress: 45, accountReq: "不限", collateralReq: "利率债优先", issuedAt: "09:45" },
  { account: "泰康颐年混合", gap: "-2.5 / 12.0", progress: 12, accountReq: "利率债质押", collateralReq: "国债", issuedAt: "10:05" },
  { account: "泰康裕泰回报", gap: "-4.1 / 20.0", progress: 60, accountReq: "利率债质押", collateralReq: "国债/地方债", issuedAt: "10:18" },
  { account: "泰康安益纯债", gap: "-0.6 / 6.0", progress: 100, accountReq: "不限", collateralReq: "政金债", issuedAt: "10:22" },
  { account: "泰康宏观回报", gap: "-5.3 / 25.0", progress: 32, accountReq: "不限", collateralReq: "利率债优先", issuedAt: "09:28" },
  { account: "泰康策略配置7号", gap: "-1.5 / 10.0", progress: 90, accountReq: "利率债质押", collateralReq: "国债/政金债", issuedAt: "09:35" },
  { account: "泰康新机遇", gap: "-6.0 / 30.0", progress: 8, accountReq: "利率债质押", collateralReq: "国债/政金债", issuedAt: "10:30" },
  { account: "泰康瑞坤纯债", gap: "-3.8 / 18.0", progress: 55, accountReq: "不限", collateralReq: "政金债", issuedAt: "09:50" },
  { account: "泰康添润6个月", gap: "-2.0 / 9.5", progress: 100, accountReq: "利率债质押", collateralReq: "政金债", issuedAt: "09:40" },
  { account: "泰康均衡优选", gap: "-1.2 / 7.0", progress: 68, accountReq: "利率债质押", collateralReq: "国债/地方债", issuedAt: "10:12" },
  { account: "泰康鑫选利90天", gap: "-0.8 / 4.0", progress: 100, accountReq: "信用债可用", collateralReq: "AA+以上", issuedAt: "10:08" },
  { account: "泰康长江经济带", gap: "-1.0 / 5.5", progress: 20, accountReq: "不限", collateralReq: "利率债优先", issuedAt: "10:35" },
] as const;

function CombinedDemandMatrixCard() {
  const [detailOpen, setDetailOpen] = useState(false);
  const [bottomTab, setBottomTab] = useState<DemandBottomTab>("demand");
  const repoMatrix = buildDemandMatrix(demandRowsByDirection.repo);
  const reverseMatrix = buildDemandMatrix(demandRowsByDirection.reverse);
  const reverseByTenor = demandTenors.map((tenor) => reverseMatrix.columnTotals[tenor]);
  const reverseTotal = reverseMatrix.grandTotal;

  const tabItems: { key: DemandBottomTab; label: string }[] = [
    { key: "demand", label: "正/逆回购需求" },
    { key: "gap", label: "资金缺口" },
    { key: "inflight", label: "在途指令" },
  ];

  return (
    <>
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]">
        <div className="flex items-center justify-between gap-2 border-b border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-dark-soft)] px-2.5 py-1.5">
          <div className="flex min-w-0 items-center gap-1.5">
            {tabItems.map((tab) => (
              <button
                key={tab.key}
                className={`tk-chip tk-segmented-tab transition-colors ${
                  bottomTab === tab.key
                    ? "bg-[rgba(248,113,113,0.18)] text-red-200"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                onClick={() => setBottomTab(tab.key)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
          {bottomTab === "demand" && (
            <div className="flex shrink-0 gap-1">
              {demandTenors.map((tenor) => (
                <span key={tenor} className="tk-matrix-tag rounded border px-1 py-0.5">
                  {tenor}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="min-h-0 overflow-auto">
          {bottomTab === "demand" ? (
            <div className="h-full min-h-0 p-1">
              <div className="grid h-full min-h-0 grid-cols-[4.2rem_repeat(3,minmax(0,1fr))] grid-rows-[1.55rem_repeat(5,minmax(0,1fr))] gap-px text-micro">
                <DemandTableHeader label="正回购需求" />
                {demandTenors.map((tenor) => (
                  <DemandTableHeader key={tenor} label={tenor} align="right" />
                ))}
                <DemandTableHeader label="合计" align="right" />
                {repoMatrix.rows.map((row) => (
                  <Fragment key={row.label}>
                    <DemandRowHeader row={row} />
                    {demandTenors.map((tenor) => (
                      <DemandCompactCell key={`${row.label}-${tenor}`} amount={row.cells[tenor]} />
                    ))}
                    <DemandCompactCell amount={repoMatrix.rowTotals[row.label]} strong />
                  </Fragment>
                ))}
                <DemandTableHeader label="合计" />
                {demandTenors.map((tenor) => (
                  <DemandCompactCell key={`repo-total-${tenor}`} amount={repoMatrix.columnTotals[tenor]} strong />
                ))}
                <DemandCompactCell amount={repoMatrix.grandTotal} strong />
                <DemandTableHeader label="逆回购需求" />
                {reverseByTenor.map((amount, index) => (
                  <DemandCompactCell key={`reverse-${demandTenors[index]}`} amount={amount} accent="var(--tk-color-brand-cyan)" />
                ))}
                <DemandCompactCell amount={reverseTotal} strong accent="var(--tk-color-brand-cyan)" />
              </div>
            </div>
          ) : bottomTab === "gap" ? (
            <table className="tk-table w-full border-separate border-spacing-0 text-xs">
              <thead className="sticky top-0 z-10 bg-[var(--tk-color-surface-dark-soft)] text-slate-400">
                <tr>
                  {["账户", "保本利率", "资金缺口/可用额度", "账户要求", "质押要求"].map((col) => (
                    <th key={col} className="border-b border-[color:var(--tk-color-border-divider)] px-2 py-1.5 text-left text-mini font-medium tracking-[0]">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fundGapRows.map((row) => (
                  <tr key={row.account} className="hover:bg-[rgba(255,255,255,0.03)]">
                    <td className="border-b border-[color:var(--tk-color-border-divider)] px-2 py-1.5 font-medium text-slate-200">{row.account}</td>
                    <td className="border-b border-[color:var(--tk-color-border-divider)] px-2 py-1.5 text-amber-300">{row.breakEvenRate}</td>
                    <td className="border-b border-[color:var(--tk-color-border-divider)] px-2 py-1.5 font-semibold text-red-300">{row.gap}</td>
                    <td className="border-b border-[color:var(--tk-color-border-divider)] px-2 py-1.5 text-slate-400">{row.accountReq}</td>
                    <td className="border-b border-[color:var(--tk-color-border-divider)] px-2 py-1.5 text-slate-400">{row.collateralReq}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="tk-table w-full border-separate border-spacing-0 text-xs">
              <thead className="sticky top-0 z-10 bg-[var(--tk-color-surface-dark-soft)] text-slate-400">
                <tr>
                  {["账户", "资金缺口/可用额度", "完成度", "账户要求", "质押要求", "下达时间"].map((col) => (
                    <th key={col} className="border-b border-[color:var(--tk-color-border-divider)] px-2 py-1.5 text-left text-mini font-medium tracking-[0]">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inflightRows.map((row) => (
                  <tr key={row.account} className="hover:bg-[rgba(255,255,255,0.03)]">
                    <td className="border-b border-[color:var(--tk-color-border-divider)] px-2 py-1.5 font-medium text-slate-200">{row.account}</td>
                    <td className="border-b border-[color:var(--tk-color-border-divider)] px-2 py-1.5 font-semibold text-red-300">{row.gap}</td>
                    <td className="border-b border-[color:var(--tk-color-border-divider)] px-2 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1 w-12 overflow-hidden rounded-full bg-slate-700">
                          <div className={`h-full rounded-full ${row.progress >= 100 ? "bg-emerald-500" : "bg-[var(--tdx-red)]"}`} style={{ width: `${Math.min(row.progress, 100)}%` }} />
                        </div>
                        <span className={`${row.progress >= 100 ? "text-emerald-400" : "text-slate-300"}`}>{row.progress}%</span>
                      </div>
                    </td>
                    <td className="border-b border-[color:var(--tk-color-border-divider)] px-2 py-1.5 text-slate-400">{row.accountReq}</td>
                    <td className="border-b border-[color:var(--tk-color-border-divider)] px-2 py-1.5 text-slate-400">{row.collateralReq}</td>
                    <td className="border-b border-[color:var(--tk-color-border-divider)] px-2 py-1.5 text-slate-300">{row.issuedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {detailOpen ? (
        <PageFrame title="IMS 指令" onClose={() => setDetailOpen(false)}>
          <DemandGapDetailFrame onClose={() => setDetailOpen(false)} />
        </PageFrame>
      ) : null}
    </>
  );
}

function DemandGapDetailFrame({ onClose }: { onClose: () => void }) {
  const gapRows = buildDemandGapRows();
  const totals = gapRows.reduce(
    (acc, row) => ({
      need: roundDemandValue(acc.need + row.need),
      done: roundDemandValue(acc.done + row.done),
      gap: roundDemandValue(acc.gap + row.gap),
    }),
    { need: 0, done: 0, gap: 0 },
  );
  const maxGapRow = gapRows[0];
  const completion = totals.need > 0 ? Math.round((totals.done / totals.need) * 100) : 0;

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] px-4 py-3">
        <div className="min-w-0">
          <h2 className="m-0 text-lg font-semibold tracking-wide text-slate-100 underline decoration-[rgba(248,113,113,0.9)] underline-offset-8">
            IMS 指令
          </h2>
          <p className="mt-2 text-xs text-slate-400">
            按账户、方向、押券与期限拆解未覆盖需求，金额单位：亿。
          </p>
        </div>
        <button
          className="tk-button"
          onClick={onClose}
          type="button"
        >
          返回主看板
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 text-xs">
        <DemandGapSummaryCard label="总需求" value={`${formatDemandAmount(totals.need)} 亿`} />
        <DemandGapSummaryCard label="已成交" value={`${formatDemandAmount(totals.done)} 亿`} />
        <DemandGapSummaryCard label="总缺口" value={`${formatDemandAmount(totals.gap)} 亿`} tone="alert" />
        <DemandGapSummaryCard
          label="最大缺口"
          value={maxGapRow ? `${maxGapRow.directionLabel} ${maxGapRow.tenor}` : "-"}
          helper={maxGapRow ? `${maxGapRow.collateral} ${formatDemandAmount(maxGapRow.gap)} 亿` : undefined}
        />
      </div>

      <div className="min-h-0 overflow-hidden rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]">
        <div className="flex items-center justify-between border-b border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-dark-soft)] px-4 py-2">
          <div className="tk-title">缺口明细 Table</div>
          <div className="text-xs text-slate-400">整体完成率 {completion}%</div>
        </div>
        <div className="h-full min-h-0 overflow-auto">
          <table className="w-full min-w-[960px] border-separate border-spacing-0 text-xs">
            <thead className="sticky top-0 z-10 bg-[rgba(15,23,42,0.98)] text-slate-400">
              <tr>
                {["优先级", "账户", "方向", "押券", "期限", "需求", "已成交", "缺口", "完成率", "处理建议"].map((column) => (
                  <th key={column} className="border-b border-[color:var(--tk-color-border-divider)] px-3 py-2 text-left font-medium">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gapRows.map((row) => (
                <tr key={row.id} className="group">
                  <td className="border-b border-[color:var(--tk-color-border-divider)] px-3 py-2">
                    <span className={`rounded px-2 py-0.5 ${
                      row.priority === "高"
                        ? "bg-[rgba(231,53,58,0.16)] text-red-200"
                        : row.priority === "中"
                          ? "bg-[rgba(245,158,11,0.14)] text-amber-200"
                          : "bg-[rgba(148,163,184,0.12)] text-slate-300"
                    }`}>
                      {row.priority}
                    </span>
                  </td>
                  <td className="border-b border-[color:var(--tk-color-border-divider)] px-3 py-2 font-medium text-slate-100">{row.account}</td>
                  <td className="border-b border-[color:var(--tk-color-border-divider)] px-3 py-2 text-slate-200">
                    <span className={row.direction === "repo" ? "text-red-200" : "text-cyan-200"}>
                      {row.directionLabel}
                    </span>
                  </td>
                  <td className="border-b border-[color:var(--tk-color-border-divider)] px-3 py-2 text-slate-300">{row.collateral}</td>
                  <td className="border-b border-[color:var(--tk-color-border-divider)] px-3 py-2 font-semibold text-slate-100">{row.tenor}</td>
                  <td className="border-b border-[color:var(--tk-color-border-divider)] px-3 py-2 text-right text-slate-300">{formatDemandAmount(row.need)}</td>
                  <td className="border-b border-[color:var(--tk-color-border-divider)] px-3 py-2 text-right text-slate-300">{formatDemandAmount(row.done)}</td>
                  <td className="border-b border-[color:var(--tk-color-border-divider)] px-3 py-2 text-right font-semibold text-red-200">{formatDemandAmount(row.gap)}</td>
                  <td className="border-b border-[color:var(--tk-color-border-divider)] px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-[var(--tdx-red)]"
                          style={{ width: `${row.progress}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-slate-300">{row.progress}%</span>
                    </div>
                  </td>
                  <td className="border-b border-[color:var(--tk-color-border-divider)] px-3 py-2 text-slate-400">{row.suggestion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DemandGapSummaryCard({
  label,
  value,
  helper,
  tone = "neutral",
}: {
  label: string;
  value: string;
  helper?: string;
  tone?: "neutral" | "alert";
}) {
  return (
    <div className="rounded-md border border-[color:var(--tk-color-border-panel)] bg-[rgba(15,23,42,0.72)] px-3 py-2">
      <div className="text-mini text-slate-500">{label}</div>
      <div className={`mt-1 text-base font-semibold ${tone === "alert" ? "text-red-200" : "text-slate-100"}`}>
        {value}
      </div>
      {helper ? <div className="mt-1 truncate text-mini text-slate-500">{helper}</div> : null}
    </div>
  );
}

function DemandTableHeader({
  label,
  align = "left",
}: {
  label: string;
  align?: "left" | "right";
}) {
  return (
    <div
      className={`flex min-w-0 items-center overflow-hidden rounded-sm border border-[color:var(--tk-color-border-panel)] bg-[rgba(30,41,59,0.82)] px-1 text-micro font-semibold text-slate-300 ${
        align === "right" ? "justify-end text-right" : ""
      }`}
    >
      <span className="truncate">{label}</span>
    </div>
  );
}

function DemandCompactCell({
  amount,
  strong = false,
  accent = "var(--tdx-red)",
}: {
  amount: DemandAmount;
  strong?: boolean;
  accent?: string;
}) {
  const progress = demandProgress(amount);
  const empty = amount.need <= 0;
  return (
    <div
      className={`grid min-w-0 content-center overflow-hidden rounded-sm border px-1 py-[1px] text-right ${
        strong
          ? "border-[rgba(231,53,58,0.32)] bg-[rgba(30,41,59,0.86)]"
          : "border-[color:var(--tk-color-border-panel)] bg-[rgba(15,23,42,0.66)]"
      } ${empty ? "opacity-40" : ""}`}
    >
      <div className="truncate text-micro font-semibold text-slate-200">
        {formatDemandAmount(amount.need)} / {formatDemandAmount(amount.done)}
      </div>
      <div className="mt-0.5 h-0.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full"
          style={{ width: `${progress}%`, backgroundColor: accent }}
        />
      </div>
    </div>
  );
}

function DemandMatrixCard({
  direction,
  title,
  tag,
  hint,
}: {
  direction: DemandDirection;
  title: string;
  tag: string;
  hint: string;
}) {
  const matrix = buildDemandMatrix(demandRowsByDirection[direction]);
  const directionAccent =
    direction === "repo" ? "var(--tdx-red)" : "var(--tk-color-brand-cyan)";

  return (
    <div className="grid min-h-0 grid-rows-[auto_1fr] overflow-hidden rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]">
      <div className="flex items-center justify-between gap-2 border-b border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-dark-soft)] px-2.5 py-1.5">
        <div className="min-w-0">
          <div className="tk-matrix-card-title truncate">
            {title}
          </div>
          <div className="tk-matrix-card-subtitle truncate">
            {hint}
          </div>
        </div>
        <span
          className="tk-matrix-tag shrink-0 rounded border px-1 py-0.5"
          style={{
            borderColor: directionAccent,
            background: direction === "repo" ? "rgba(231,53,58,0.14)" : "rgba(0,207,232,0.12)",
            color: direction === "repo" ? "#fecaca" : "#a5f3fc",
          }}
        >
          {tag}
        </span>
      </div>

      <div className="min-h-0 overflow-hidden p-[1px]">
        <div className="grid h-full min-h-0 grid-cols-[3.75rem_repeat(3,minmax(0,1fr))] grid-rows-[1.95rem_repeat(3,minmax(0,1fr))] gap-px text-micro">
          <DemandAxisHeader />
          <DemandHeaderCell label="合计" amount={matrix.grandTotal} accent={directionAccent} />
          {demandTenors.map((tenor) => (
            <DemandHeaderCell
              key={tenor}
              label={tenor}
              amount={matrix.columnTotals[tenor]}
              accent={directionAccent}
            />
          ))}

          {matrix.rows.map((row) => {
            const rowTotal = matrix.rowTotals[row.label];
            return (
              <Fragment key={row.label}>
                <DemandRowHeader row={row} />
                <DemandMatrixCell amount={rowTotal} accent={directionAccent} isTotal />
                {demandTenors.map((tenor) => (
                  <DemandMatrixCell
                    key={`${row.label}-${tenor}`}
                    amount={row.cells[tenor]}
                    accent={directionAccent}
                  />
                ))}
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DemandAxisHeader() {
  return (
    <div className="flex min-w-0 items-center overflow-hidden rounded-sm border border-dashed border-[color:var(--tk-color-border-panel)] bg-transparent px-1 text-slate-500">
      <span className="text-[8.5px] leading-none">押券 / 期限</span>
    </div>
  );
}

function DemandHeaderCell({
  label,
  amount,
  accent,
}: {
  label: string;
  amount: DemandAmount;
  accent: string;
}) {
  const progress = demandProgress(amount);
  const done = amount.need > 0 && demandGap(amount) === 0;
  const empty = amount.need <= 0;
  return (
    <div
      className={`flex min-w-0 flex-col justify-center overflow-hidden rounded-sm border px-1 py-[1px] ${
        done
          ? "border-[rgba(148,163,184,0.16)] bg-[rgba(71,85,105,0.22)] text-slate-500"
          : "border-[color:var(--tk-color-border-panel)] bg-[rgba(30,41,59,0.82)] text-slate-300"
      } ${empty ? "opacity-45" : ""}`}
    >
      <div className="text-micro font-semibold leading-none">{label}</div>
      <DemandMiniStats amount={amount} accent={accent} progress={progress} muted={done || empty} />
    </div>
  );
}

function DemandRowHeader({ row }: { row: DemandRow }) {
  return (
    <div
      className="flex min-w-0 items-center overflow-hidden rounded-sm border border-[color:var(--tk-color-border-panel)] bg-[rgba(30,41,59,0.74)] px-1 py-[1px]"
      style={{ borderLeft: `2px solid ${row.color}` }}
    >
      <div className="text-micro font-semibold leading-none text-slate-200">{row.label}</div>
    </div>
  );
}

function DemandMatrixCell({
  amount,
  accent,
  isTotal = false,
}: {
  amount: DemandAmount;
  accent: string;
  isTotal?: boolean;
}) {
  const gap = demandGap(amount);
  const progress = demandProgress(amount);
  const done = amount.need > 0 && gap === 0;
  const empty = amount.need <= 0;
  return (
    <button
      type="button"
      className={`min-w-0 overflow-hidden rounded-sm border px-1 py-[1px] text-left transition ${
        done
          ? "border-[rgba(148,163,184,0.14)] bg-[rgba(71,85,105,0.18)] text-slate-500"
          : isTotal
            ? "border-[rgba(231,53,58,0.32)] bg-[rgba(30,41,59,0.86)] text-slate-200"
            : "border-[color:var(--tk-color-border-panel)] bg-[rgba(15,23,42,0.66)] text-slate-200 hover:border-[color:var(--tk-color-brand-primary-hover)]"
      } ${empty ? "opacity-35" : ""}`}
    >
      <div className="grid h-full min-h-0 content-center grid-rows-[auto_auto] gap-y-[1px]">
        <div className="flex min-w-0 items-baseline justify-between gap-2">
          <DemandCellMetric label="需" value={amount.need} tone="primary" />
          <DemandCellMetric label="差" value={gap} tone={gap > 0 ? "gap" : "muted"} align="right" />
        </div>
        <div className="grid min-w-0 grid-cols-[auto_minmax(14px,1fr)_auto] items-center gap-0.5">
          <DemandCellMetric label="已" value={amount.done} tone="done" />
          <DemandInlineProgress progress={progress} accent={accent} muted={done || empty} />
          <span className="text-micro text-slate-400">{progress}%</span>
        </div>
      </div>
    </button>
  );
}

function DemandCellMetric({
  label,
  value,
  tone,
  align = "left",
}: {
  label: string;
  value: number;
  tone: "primary" | "done" | "gap" | "muted";
  align?: "left" | "right";
}) {
  const valueClass =
    tone === "primary"
      ? "text-slate-100"
      : tone === "done"
        ? "text-slate-300"
        : tone === "gap"
          ? "text-amber-300"
          : "text-slate-500";

  return (
    <div className={`flex min-w-0 items-baseline gap-0.5 ${align === "right" ? "justify-end text-right" : ""}`}>
      <span className="shrink-0 text-micro text-slate-500">{label}</span>
      <span className={`truncate text-[13px] font-semibold leading-none ${valueClass}`}>
        {formatDemandAmount(value)}
      </span>
    </div>
  );
}

function DemandMiniStats({
  amount,
  accent,
  progress,
  muted,
  compact = false,
}: {
  amount: DemandAmount;
  accent: string;
  progress: number;
  muted: boolean;
  compact?: boolean;
}) {
  const gap = demandGap(amount);
  return (
    <div className={`mt-[1px] grid gap-y-0 leading-none text-slate-400 ${compact ? "text-micro" : "text-micro"}`}>
      <div className="flex min-w-0 items-baseline justify-between gap-1">
        <span className="whitespace-nowrap">
          <span className="text-slate-500">需</span>
          <span className="ml-0.5 font-semibold text-slate-200">{formatDemandAmount(amount.need)}</span>
        </span>
        <span className="whitespace-nowrap">
          <span className="text-slate-500">差</span>
          <span className="ml-0.5 font-semibold" style={{ color: gap > 0 ? "var(--tk-color-warning)" : accent }}>
            {formatDemandAmount(gap)}
          </span>
        </span>
      </div>
      <div className={`grid min-w-0 items-center gap-1 ${compact ? "grid-cols-[auto_1fr]" : "grid-cols-[auto_minmax(14px,1fr)]"}`}>
        <span className="whitespace-nowrap">
          <span className="text-slate-500">已</span>
          <span className="ml-0.5 font-semibold text-slate-300">{formatDemandAmount(amount.done)}</span>
        </span>
        <DemandInlineProgress progress={progress} accent={accent} muted={muted} />
      </div>
    </div>
  );
}

function DemandInlineProgress({
  progress,
  accent,
  muted,
}: {
  progress: number;
  accent: string;
  muted: boolean;
}) {
  return (
    <div className="h-[3px] min-w-0 overflow-hidden rounded bg-[rgba(148,163,184,0.14)]">
      <div
        className="h-full rounded transition-[width]"
        style={{
          width: `${progress}%`,
          background: muted ? "rgba(148,163,184,0.48)" : accent,
        }}
      />
    </div>
  );
}

function MiniChartSkeleton({ activeIndex }: { activeIndex: number }) {
  const stroke =
    activeIndex % 2 === 0 ? "var(--tk-color-chart-blue)" : "var(--tdx-red)";
  return (
    <div className="absolute inset-2 bottom-5 grid min-h-0 grid-rows-[1fr_34%] gap-1">
      <div className="relative overflow-hidden rounded-sm border border-dashed border-[color:var(--tk-color-border-panel)] bg-[rgba(15,23,42,0.42)]">
        <svg
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
          viewBox="0 0 100 60"
        >
          {[15, 30, 45].map((y) => (
            <line
              key={y}
              x1="0"
              x2="100"
              y1={y}
              y2={y}
              stroke="rgba(100,116,139,0.28)"
              strokeDasharray="3 3"
              strokeWidth="0.7"
            />
          ))}
          <path
            d="M2 48 L18 42 L34 18 L52 28 L70 24 L88 35 L100 22"
            fill="none"
            stroke={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <path
            d="M2 48 L18 42 L34 18 L52 28 L70 24 L88 35 L100 22 L100 60 L2 60 Z"
            fill={stroke}
            opacity="0.12"
          />
        </svg>
      </div>
      <div className="grid grid-cols-5 gap-1">
        {[58, 68, 76, 62, 84].map((height, index) => (
          <div
            key={`${height}-${index}`}
            className="relative overflow-hidden rounded-sm bg-[rgba(15,23,42,0.58)]"
          >
            <div
              className={`absolute bottom-0 left-0 right-0 ${
                index % 3 === 0 ? "bg-[var(--tdx-red)]" : "bg-emerald-500"
              }`}
              style={{ height: `${height}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

type PersonalInstitutionMode = "tenor" | "collateral";
type PersonalInstitutionKey = "R001" | "R007" | "存单商金" | "信用" | "利率地方";
type PersonalInstitutionCompareItem = {
  key: PersonalInstitutionKey;
  label: string;
  color: string;
  personal: number[];
  institutionWeighted: number[];
  personalCount: number[];
  institutionCount: number[];
};

const personalInstitutionLabels = ["08:00", "09:00", "10:00", "11:00", "13:30", "15:00", "16:00"];
const personalInstitutionAxisLabelIndexes = new Set([0, 1, 3, 4, 5, 6]);

const intradayQuoteHeat = [0.08, 1, 0.46, 0.16, 0.04, 0.22, 0.76];
const intradayRatePressure = [0.12, 1, 0.52, 0.24, 0.02, 0.28, 0.82];
const intradayNoise = [-0.006, 0.012, -0.003, -0.008, -0.012, 0.004, 0.010];
const institutionSpreadShape = [-0.010, 0.030, 0.010, -0.014, -0.020, -0.006, 0.028];

const seededJitter = (seed: number, index: number, amplitude: number) => {
  const raw = Math.sin(seed * 97.13 + index * 41.77) * 10000;
  return (raw - Math.floor(raw) - 0.5) * 2 * amplitude;
};

const keepPeakShape = (value: number, index: number) => {
  if (index === 1) return Math.max(value, 0.92);
  if (index === 6) return Math.max(value, 0.68);
  if (index === 4) return Math.min(value, 0.08);
  return value;
};

const buildIntradayRates = (
  base: number,
  pressureScale: number,
  seed: number,
) =>
  intradayRatePressure.map((pressure, index) => {
    const localPressure = keepPeakShape(
      pressure + seededJitter(seed, index, 0.11) + seededJitter(seed + 19, index, 0.035) * index / 8,
      index,
    );
    const microMove = seededJitter(seed + 37, index, 0.012);
    const value = base + localPressure * pressureScale + intradayNoise[index] + microMove;
    return Number(Math.max(1.02, value).toFixed(3));
  });

const buildInstitutionWeightedRates = (
  personal: number[],
  spreadScale = 1,
  seed: number,
) =>
  personal.map((rate, index) => {
    const baseSpread = Math.abs(institutionSpreadShape[index]) * spreadScale;
    const spreadNoise = Math.abs(seededJitter(seed + 53, index, 0.010));
    const closeWindowPremium = index === 1 || index === 6 ? 0.004 : 0;
    return Number((rate + baseSpread + spreadNoise + closeWindowPremium).toFixed(3));
  });

const buildIntradayCounts = (
  base: number,
  peak: number,
  closeBoost = 0,
  seed: number,
) =>
  intradayQuoteHeat.map((heat, index) => {
    const localHeat = keepPeakShape(heat + seededJitter(seed + 71, index, 0.14), index);
    const countNoise = seededJitter(seed + 89, index, Math.max(1.2, peak * 0.06));
    return Math.max(1, Math.round(base + peak * localHeat + countNoise + (index === 6 ? closeBoost : 0) + (index === 1 ? 2 : 0)));
  });

const makePersonalInstitutionItem = ({
  key,
  label,
  color,
  base,
  pressureScale,
  spreadScale,
  personalBaseCount,
  personalPeakCount,
  institutionBaseCount,
  institutionPeakCount,
  seed,
}: {
  key: PersonalInstitutionKey;
  label: string;
  color: string;
  base: number;
  pressureScale: number;
  spreadScale: number;
  personalBaseCount: number;
  personalPeakCount: number;
  institutionBaseCount: number;
  institutionPeakCount: number;
  seed: number;
}): PersonalInstitutionCompareItem => {
  const personal = buildIntradayRates(base, pressureScale, seed);
  return {
    key,
    label,
    color,
    personal,
    institutionWeighted: buildInstitutionWeightedRates(personal, spreadScale, seed),
    personalCount: buildIntradayCounts(personalBaseCount, personalPeakCount, 2, seed),
    institutionCount: buildIntradayCounts(institutionBaseCount, institutionPeakCount, 5, seed + 11),
  };
};

const personalInstitutionModeOptions: Array<{ key: PersonalInstitutionMode; label: string }> = [
  { key: "tenor", label: "期限" },
  { key: "collateral", label: "押券类型" },
];

const personalInstitutionCompareData: Record<PersonalInstitutionMode, PersonalInstitutionCompareItem[]> = {
  tenor: [
    makePersonalInstitutionItem({
      key: "R001",
      label: "R001",
      color: "#2f86ff",
      base: 1.44,
      pressureScale: 0.108,
      spreadScale: 0.82,
      personalBaseCount: 3,
      personalPeakCount: 14,
      institutionBaseCount: 9,
      institutionPeakCount: 40,
      seed: 101,
    }),
    makePersonalInstitutionItem({
      key: "R007",
      label: "R007",
      color: "#10c6c8",
      base: 1.61,
      pressureScale: 0.154,
      spreadScale: 1.02,
      personalBaseCount: 2,
      personalPeakCount: 13,
      institutionBaseCount: 8,
      institutionPeakCount: 44,
      seed: 207,
    }),
  ],
  collateral: [
    makePersonalInstitutionItem({
      key: "存单商金",
      label: "存单商金",
      color: "#eab308",
      base: 1.53,
      pressureScale: 0.135,
      spreadScale: 1.00,
      personalBaseCount: 3,
      personalPeakCount: 11,
      institutionBaseCount: 8,
      institutionPeakCount: 34,
      seed: 313,
    }),
    makePersonalInstitutionItem({
      key: "信用",
      label: "信用",
      color: "#a855f7",
      base: 1.69,
      pressureScale: 0.176,
      spreadScale: 1.34,
      personalBaseCount: 2,
      personalPeakCount: 8,
      institutionBaseCount: 5,
      institutionPeakCount: 25,
      seed: 419,
    }),
    makePersonalInstitutionItem({
      key: "利率地方",
      label: "利率地方",
      color: "#38bdf8",
      base: 1.43,
      pressureScale: 0.112,
      spreadScale: 0.86,
      personalBaseCount: 4,
      personalPeakCount: 13,
      institutionBaseCount: 10,
      institutionPeakCount: 38,
      seed: 523,
    }),
  ],
};

function PersonalInstitutionCompareCard() {
  const [mode, setMode] = useState<PersonalInstitutionMode>("tenor");
  const [activeKeys, setActiveKeys] = useState<PersonalInstitutionKey[]>(["R001", "R007"]);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [hoveredLegendKey, setHoveredLegendKey] = useState<PersonalInstitutionKey | null>(null);
  const [hoveredSeriesKind, setHoveredSeriesKind] = useState<"personal" | "institution" | null>(null);
  const items = personalInstitutionCompareData[mode];
  const activeItems = items.filter((item) => activeKeys.includes(item.key));
  const visibleItems = activeItems.length ? activeItems : [items[0]];
  const values = visibleItems.flatMap((item) => [...item.personal, ...item.institutionWeighted]);
  const min = Math.min(...values) - 0.03;
  const max = Math.max(...values) + 0.03;

  const handleModeChange = (nextMode: PersonalInstitutionMode) => {
    setMode(nextMode);
    setActiveKeys(personalInstitutionCompareData[nextMode].map((item) => item.key));
  };

  const toggleItem = (key: PersonalInstitutionKey) => {
    setActiveKeys((current) => {
      if (current.includes(key)) {
        return current.length === 1 ? current : current.filter((item) => item !== key);
      }
      return [...current, key];
    });
  };

  const handleChartMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    setHoverIndex(Math.round(ratio * (personalInstitutionLabels.length - 1)));
  };

  const hoverLeft = hoverIndex == null
    ? 0
    : `${(hoverIndex / (personalInstitutionLabels.length - 1)) * 100}%`;
  const hoverRows = hoverIndex == null
    ? []
    : visibleItems.map((item) => {
      const personal = item.personal[hoverIndex];
      const institution = item.institutionWeighted[hoverIndex];
      return {
        key: item.key,
        label: item.label,
        color: item.color,
        personal,
        institution,
        spreadBp: Math.round((institution - personal) * 100),
      };
    });
  const isLegendFiltering = hoveredLegendKey !== null || hoveredSeriesKind !== null;
  const lineOpacity = (
    itemKey: PersonalInstitutionKey,
    kind: "personal" | "institution",
    baseOpacity: number,
  ) => {
    const keyMatches = hoveredLegendKey === null || hoveredLegendKey === itemKey;
    const kindMatches = hoveredSeriesKind === null || hoveredSeriesKind === kind;
    return !isLegendFiltering || (keyMatches && kindMatches) ? baseOpacity : 0.18;
  };
  return (
    <div className="grid min-h-0 grid-rows-[auto_auto_auto_1fr_auto] overflow-hidden rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-dark-soft)] px-2.5 py-1.5">
        <div className="flex shrink-0 items-baseline gap-1.5">
          <span className="tk-matrix-card-title shrink-0 whitespace-nowrap">个人 & 机构</span>
          <span className="shrink-0 whitespace-nowrap text-micro text-slate-500">实线=个人 / 虚线=机构</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-micro text-slate-400">截至 16:00</span>
          {personalInstitutionModeOptions.map((option) => (
            <button
              key={option.key}
              className={`rounded-sm border px-1.5 py-0.5 text-micro font-semibold transition ${
                mode === option.key
                  ? "border-[rgba(231,53,58,0.7)] bg-[var(--tdx-red)] text-white"
                  : "border-[color:var(--tk-color-border-panel)] bg-[rgba(15,23,42,0.45)] text-slate-400 hover:text-slate-200"
              }`}
              onClick={() => handleModeChange(option.key)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5 border-b border-[color:var(--tk-color-border-divider)] px-2 py-1">
        <span className="text-micro text-slate-500">{mode === "tenor" ? "期限" : "押券"}</span>
        {items.map((item) => {
          const active = activeKeys.includes(item.key);
          return (
            <button
              key={item.key}
              className={`rounded-sm border px-1.5 py-0.5 text-micro font-semibold transition ${
                active
                  ? "text-white"
                  : "border-transparent bg-transparent text-slate-500 hover:text-slate-300"
              }`}
              onClick={() => toggleItem(item.key)}
              style={active ? { backgroundColor: item.color, borderColor: item.color } : undefined}
              type="button"
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="flex min-w-0 items-center gap-1.5 overflow-hidden border-b border-[color:var(--tk-color-border-divider)] px-2 py-0.5 text-micro text-slate-400">
        <span className="shrink-0 text-slate-500">图例</span>
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
          {visibleItems.map((item) => (
            <button
              key={item.key}
              className="flex h-5 w-[4.5rem] min-w-0 shrink-0 items-center gap-1 rounded border border-transparent px-1 transition-colors hover:border-[color:var(--tk-color-border-panel)] hover:bg-[var(--tk-color-surface-dark-muted)] hover:text-slate-100"
              onMouseEnter={() => setHoveredLegendKey(item.key)}
              onMouseLeave={() => setHoveredLegendKey(null)}
              type="button"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="min-w-0 truncate text-slate-300">{item.label}</span>
            </button>
          ))}
        </div>
        <LegendDot
          color="var(--tk-color-chart-blue)"
          label="个人"
          interactive
          className="h-5 w-[4.5rem]"
          onMouseEnter={() => setHoveredSeriesKind("personal")}
          onMouseLeave={() => setHoveredSeriesKind(null)}
        />
        <LegendDot
          color="var(--tk-color-chart-gold)"
          label="机构加权"
          interactive
          className="h-5 w-[4.5rem]"
          onMouseEnter={() => setHoveredSeriesKind("institution")}
          onMouseLeave={() => setHoveredSeriesKind(null)}
        />
      </div>
      <div className="grid min-h-0 grid-cols-[2.3rem_1fr] px-2 pt-2">
        <div className="flex flex-col justify-between pb-4 pr-1 text-right text-micro text-slate-500">
          {buildAxisLabels(min, max, 4).map((tick) => (
            <div key={tick}>{tick}</div>
          ))}
        </div>
        <div
          className="relative min-h-0 overflow-hidden"
          onMouseMove={handleChartMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="absolute inset-x-0 border-t border-dashed border-[color:var(--tk-color-border-divider)]"
              style={{ top: `${(index / 3) * 82}%` }}
            />
          ))}
          <svg
            className="absolute inset-0 h-[calc(100%-14px)] w-full"
            preserveAspectRatio="none"
            viewBox="0 0 120 76"
          >
            {visibleItems.flatMap((item) => [
              <path
                key={`${item.key}-personal`}
                d={buildLinePath(item.personal, 120, 76, min, max)}
                fill="none"
                stroke={item.color}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.7"
                opacity={lineOpacity(item.key, "personal", 1)}
              />,
              <path
                key={`${item.key}-institution`}
                d={buildLinePath(item.institutionWeighted, 120, 76, min, max)}
                fill="none"
                stroke={item.color}
                strokeDasharray="4 3"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.4"
                opacity={lineOpacity(item.key, "institution", 0.92)}
              />,
            ])}
          </svg>
          {hoverIndex != null ? (
            <>
              <div
                className="pointer-events-none absolute top-0 h-[calc(100%-14px)] border-l border-dashed border-slate-400/55"
                style={{ left: hoverLeft }}
              />
              <div
                className="pointer-events-none absolute top-1 z-10 min-w-[9.5rem] rounded border border-slate-600/80 bg-slate-950/95 px-2 py-1 text-micro shadow-lg"
                style={{
                  left: hoverIndex > personalInstitutionLabels.length / 2 ? "auto" : `calc(${hoverLeft} + 6px)`,
                  right: hoverIndex > personalInstitutionLabels.length / 2 ? `calc(${100 - (hoverIndex / (personalInstitutionLabels.length - 1)) * 100}% + 6px)` : "auto",
                }}
              >
                <div className="mb-1 font-semibold text-slate-100">
                  {personalInstitutionLabels[hoverIndex]}
                </div>
                <div className="grid gap-0.5">
                  {hoverRows.map((row) => (
                    <div key={row.key} className="grid grid-cols-[auto_1fr_auto] items-center gap-x-1.5 gap-y-0 text-slate-300">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: row.color }} />
                      <span className="truncate">{row.label}</span>
                      <span className="font-semibold" style={{ color: row.color }}>
                        {row.spreadBp >= 0 ? "+" : ""}{row.spreadBp}BP
                      </span>
                      <span />
                      <span className="text-slate-500">个人 {row.personal.toFixed(3)}</span>
                      <span className="text-slate-500">机构 {row.institution.toFixed(3)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
          <div className="absolute inset-x-0 bottom-0 grid grid-cols-7 text-micro text-slate-500">
            {personalInstitutionLabels.map((label, index) => (
              <span key={label} className="text-center">
                {personalInstitutionAxisLabelIndexes.has(index) ? label : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const DEFAULT_TRADING_STATUS_TEXT = "市场宽松";
const DEFAULT_TRADING_NOTICE_TEXT = "交易提示：央行逆回购净投放，预计今日整体市场宽松";
const AI_TRADING_NOTICE_TEXT =
  "AI提示：央行逆回购净投放带动资金面偏宽松，建议关注R001/R007边际变化及尾盘跨期需求。";

function MiddleMatrixNoticeBar({
  variant = "stacked",
  statusText = DEFAULT_TRADING_STATUS_TEXT,
  noticeText = DEFAULT_TRADING_NOTICE_TEXT,
  onOpenEditor,
}: {
  variant?: "stacked" | "inline";
  statusText?: string;
  noticeText?: string;
  onOpenEditor?: () => void;
}) {
  if (variant === "inline") {
    return (
      <button
        className="group grid w-full min-w-0 cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-center gap-10 overflow-hidden text-left outline-none"
        onClick={onOpenEditor}
        type="button"
        title="编辑交易提醒"
      >
        <span className="shrink-0 whitespace-nowrap text-[13px] font-semibold text-slate-200">
          {statusText}
        </span>
        <div className="tk-marquee relative flex min-w-0 items-center overflow-hidden">
          <div className="tk-marquee__track flex shrink-0 items-center gap-12 whitespace-nowrap text-[13px] font-semibold text-slate-200">
            <span>{noticeText}</span>
            <span aria-hidden="true">{noticeText}</span>
            <span aria-hidden="true">{noticeText}</span>
          </div>
        </div>
      </button>
    );
  }
  return (
    <div className="grid shrink-0 grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] gap-2 border-b border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-soft)] px-3 py-2 text-micro">
      <div className="min-w-0">
        <div className="tk-muted truncate">提示信息</div>
        <div className="mt-0.5 truncate font-semibold text-slate-200">
          R001 活跃度上升，关注正/逆需求缺口
        </div>
      </div>
      <div className="min-w-0">
        <div className="tk-muted truncate">最新动作</div>
        <div className="mt-0.5 truncate text-amber-300">
          加权价格与匿名成交已移入底部矩阵
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="rounded border border-[rgba(231,53,58,0.48)] bg-[rgba(231,53,58,0.16)] px-1.5 py-0.5 text-red-200">
          2 条提醒
        </span>
      </div>
    </div>
  );
}

function TradingNoticeEditorModal({
  open,
  value,
  onClose,
  onSave,
}: {
  open: boolean;
  value: string;
  onClose: () => void;
  onSave: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(draft.trim() || DEFAULT_TRADING_NOTICE_TEXT);
  }

  function applyAiNotice() {
    setDraft((current) => {
      const text = current.trim();
      if (!text) return AI_TRADING_NOTICE_TEXT;
      if (text.includes("AI提示")) return text;
      return `${text}\n${AI_TRADING_NOTICE_TEXT}`;
    });
  }

  return (
    <div
      className="tk-overlay fixed inset-0 z-50 flex items-center justify-center px-4"
      onMouseDown={onClose}
    >
      <form
        className="tk-modal w-full max-w-xl overflow-hidden border"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={submit}
      >
        <div className="tk-panel-header flex items-center justify-between gap-3 border-b px-5 py-4">
          <div className="min-w-0">
            <div className="tk-title-lg truncate">编辑交易提醒</div>
          </div>
          <button
            className="tk-button tk-icon-button inline-flex items-center justify-center"
            onClick={onClose}
            title="关闭"
            type="button"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4">
          <label className="grid gap-1.5 text-xs text-slate-400">
            <textarea
              className="tk-field min-h-28 resize-none px-3 py-2 text-sm leading-6 text-slate-100 outline-none focus:border-[color:var(--tk-color-brand-primary-hover)]"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
          </label>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-[color:var(--tk-color-border-divider-dark)] bg-[var(--tk-color-surface-dark-deep)] px-5 py-4">
          <button
            className="tk-button"
            onClick={applyAiNotice}
            type="button"
          >
            AI提示
          </button>
          <div className="flex items-center gap-2">
            <button
              className="tk-button"
              onClick={onClose}
              type="button"
            >
              取消
            </button>
            <button
              className="tk-button tk-button-primary"
              type="submit"
            >
              保存
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function LeftInfoColumn() {
  return (
    <aside className="flex h-full min-h-0 min-w-0 flex-col gap-1 overflow-hidden pr-1 brightness-[0.92]">
      <div className="min-h-0 flex-[1.4]">
        <BigBankPriceFrame embeddedPreview />
      </div>
      <div className="min-h-0 flex-[1.1]">
        <XrepoFrame embeddedPreview />
      </div>
      <div className="min-h-0 flex-[0.8]">
        <ExchangeRepoFrame embeddedPreview />
      </div>
    </aside>
  );
}

const CENTER_SPLIT_KEY = "centerSplitRatio.v1";
const DEFAULT_CENTER_TOP = 78;

function CenterColumn({
  tenorFilter,
  onTenorFilterChange,
}: {
  tenorFilter: QuoteTenorFilter;
  onTenorFilterChange: (tenor: QuoteTenorFilter) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [topPct, setTopPct] = useState(() => {
    try {
      const saved = localStorage.getItem(CENTER_SPLIT_KEY);
      if (saved) {
        const n = Number(saved);
        if (n >= 30 && n <= 90) return n;
      }
    } catch {}
    return DEFAULT_CENTER_TOP;
  });

  useEffect(() => {
    try { localStorage.setItem(CENTER_SPLIT_KEY, String(topPct)); } catch {}
  }, [topPct]);

  function startRowDrag(e: React.MouseEvent) {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    function onMove(ev: MouseEvent) {
      const rect = container!.getBoundingClientRect();
      if (rect.height <= 0) return;
      const pct = ((ev.clientY - rect.top) / rect.height) * 100;
      setTopPct(Math.max(30, Math.min(90, pct)));
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
    <div ref={containerRef} className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden px-1">
      <div className="min-h-0 overflow-hidden" style={{ height: `${topPct}%` }}>
        <MainQuoteBoard
          tenorFilter={tenorFilter}
          onTenorFilterChange={onTenorFilterChange}
        />
      </div>
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label="拖动调整上下高度"
        title="拖动调整上下高度"
        onMouseDown={startRowDrag}
        className="group relative shrink-0 cursor-row-resize py-[2px]"
      >
        <span className="pointer-events-none block h-[2px] w-full rounded bg-[var(--tk-color-border-panel)] group-hover:bg-[var(--tdx-red)]" />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <CombinedDemandMatrixCard />
      </div>
    </div>
  );
}

function RightChartColumn() {
  const [overlayProduct, setOverlayProduct] = useState<OverlayProduct>("none");
  const [baseProduct, setBaseProduct] = useState<BaseTrendProduct>("r001");

  return (
    <aside className="flex h-full min-h-0 min-w-0 flex-col gap-1 overflow-hidden px-1 brightness-[0.92]">
      <div className="min-h-0 flex-[1.2]">
        <BarometerMatrixCard />
      </div>
      <div className="min-h-0 flex-[1.2]">
        <IntradayPanel
          baseProduct={baseProduct}
          overlayProduct={overlayProduct}
          onBaseProductChange={setBaseProduct}
          onOverlayChange={setOverlayProduct}
        />
      </div>
      <div className="min-h-0 flex-[0.8]">
        <LeftNcdCard embeddedPreview />
      </div>
    </aside>
  );
}

function MiddleMatrixColumn() {
  const [overlayProduct, setOverlayProduct] = useState<OverlayProduct>("none");
  const [baseProduct, setBaseProduct] = useState<BaseTrendProduct>("r001");
  const [bottomTab, setBottomTab] = useState<"intraday" | "institution">("intraday");

  return (
    <aside className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden px-1">
      <section className="tk-panel grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden border">
        <div className="tk-panel-header border-b px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="tk-matrix-section-title truncate">任务矩阵区</div>
            </div>
          </div>
        </div>

        <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.25fr)] gap-1.5 overflow-hidden p-1.5">
          <CombinedDemandMatrixCard />
          <BarometerMatrixCard />
          <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]">
            <div className="flex items-center border-b border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-dark-soft)] px-3 py-2">
              <div className="flex items-center gap-1" role="tablist" aria-label="走势与机构统计">
                <button
                  type="button"
                  role="tab"
                  aria-selected={bottomTab === "intraday"}
                  className={auxTabClass(bottomTab === "intraday")}
                  onClick={() => setBottomTab("intraday")}
                >
                  匿名成交走势
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={bottomTab === "institution"}
                  className={auxTabClass(bottomTab === "institution")}
                  onClick={() => setBottomTab("institution")}
                >
                  机构分期限统计
                </button>
              </div>
            </div>
            <div className="min-h-0 overflow-hidden p-1.5">
              <div className={bottomTab === "intraday" ? "h-full min-h-0" : "hidden"}>
                <IntradayPanel
                  baseProduct={baseProduct}
                  overlayProduct={overlayProduct}
                  onBaseProductChange={setBaseProduct}
                  onOverlayChange={setOverlayProduct}
                />
              </div>
              <div className={bottomTab === "institution" ? "h-full min-h-0" : "hidden"}>
                <InstitutionPeriodMatrixCard />
              </div>
            </div>
          </div>
        </div>
      </section>
    </aside>
  );
}

const ACCOUNT_TYPE_OPTIONS = [
  "自营户", "商金户", "股份行自营", "理财子", "保险资管",
  "公募基金", "券商自营", "券商资管", "城商行自营", "大行自营",
  "股份行", "可专户", "年金户",
] as const;

const COLLATERAL_OPTIONS = [
  "利率", "利率地方", "地方债", "利率地方存单商金",
  "大行存单", "商金存单", "国股存单", "大行存单 / 商金",
  "国股存单 / 商金", "信用债", "AAA", "AA+",
] as const;

function QuoteBoardFilterControls({
  amountMin,
  amountMax,
  amountUnit,
  accountSearch,
  collateralSearch,
  onAmountMinChange,
  onAmountMaxChange,
  onAmountUnitChange,
  onAccountSearchChange,
  onCollateralSearchChange,
  className = "",
}: {
  amountMin: string;
  amountMax: string;
  amountUnit: AmountFilterUnit;
  accountSearch: string;
  collateralSearch: string;
  onAmountMinChange: (value: string) => void;
  onAmountMaxChange: (value: string) => void;
  onAmountUnitChange: (value: AmountFilterUnit) => void;
  onAccountSearchChange: (value: string) => void;
  onCollateralSearchChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={`flex min-w-0 items-center gap-x-1.5 gap-y-1 whitespace-nowrap text-mini text-slate-400 ${className}`}>
      <FilterLabel>金额</FilterLabel>
      <CompactSearchField
        value={amountMin}
        placeholder="最小"
        onChange={onAmountMinChange}
      />
      <span className="text-slate-500">~</span>
      <CompactSearchField
        value={amountMax}
        placeholder="不限"
        onChange={onAmountMaxChange}
      />
      <CompactSelectField<AmountFilterUnit>
        value={amountUnit}
        options={["yi", "wan"]}
        onChange={onAmountUnitChange}
        getLabel={(option) => (option === "yi" ? "亿" : "万")}
      />
      <FilterDivider compact />
      <FilterLabel>账户要求</FilterLabel>
      <FilterDropdown
        value={accountSearch}
        placeholder="自营 / 专户"
        options={ACCOUNT_TYPE_OPTIONS as unknown as readonly string[]}
        onChange={onAccountSearchChange}
      />
      <FilterDivider compact />
      <FilterLabel>质押要求</FilterLabel>
      <FilterDropdown
        value={collateralSearch}
        placeholder="利率 / 存单"
        options={COLLATERAL_OPTIONS as unknown as readonly string[]}
        onChange={onCollateralSearchChange}
      />
    </div>
  );
}

function CompactFilterField({ value }: { value: string }) {
  return (
    <div className="tk-field flex h-6 min-w-[48px] items-center justify-center px-2 text-mini">
      {value}
    </div>
  );
}

function CompactSearchField({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      className="tk-field h-6 w-[112px] px-2 text-mini text-slate-100 outline-none placeholder:text-slate-600"
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function FilterDropdown({
  value,
  placeholder,
  options,
  onChange,
}: {
  value: string;
  placeholder: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);
  const filtered = options.filter((opt) =>
    opt.toLowerCase().includes((search || value).toLowerCase()),
  );
  return (
    <div ref={ref} className="relative">
      <input
        className="tk-field h-6 w-[96px] px-2 text-mini text-slate-100 outline-none placeholder:text-slate-600"
        value={value}
        placeholder={placeholder}
        onChange={(e) => { onChange(e.target.value); setSearch(e.target.value); setOpen(true); }}
        onFocus={() => { setSearch(value); setOpen(true); }}
      />
      {open && (
        <div className="absolute left-0 top-full z-50 mt-0.5 max-h-48 w-[160px] overflow-y-auto rounded border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark)] shadow-lg">
          <button
            className="flex w-full items-center px-2 py-1.5 text-left text-mini text-slate-400 hover:bg-[var(--tk-color-surface-selected)]"
            onClick={() => { onChange(""); setOpen(false); }}
            type="button"
          >
            不限
          </button>
          {filtered.map((opt) => (
            <button
              key={opt}
              className={`flex w-full items-center px-2 py-1.5 text-left text-mini hover:bg-[var(--tk-color-surface-selected)] ${value === opt ? "text-[color:var(--tk-color-brand-cyan)]" : "text-slate-200"}`}
              onClick={() => { onChange(opt); setOpen(false); }}
              type="button"
            >
              {opt}
            </button>
          ))}
          {!filtered.length && (
            <div className="px-2 py-1.5 text-mini text-slate-500">无匹配项</div>
          )}
        </div>
      )}
    </div>
  );
}

function MainQuoteBoard({
  tenorFilter,
  onTenorFilterChange,
}: {
  tenorFilter: QuoteTenorFilter;
  onTenorFilterChange: (tenor: QuoteTenorFilter) => void;
}) {
  const [amountMin, setAmountMin] = useState(topBoardFilters.amountMin);
  const [amountMax, setAmountMax] = useState("");
  const [amountUnit, setAmountUnit] = useState<AmountFilterUnit>("yi");
  const [accountSearch, setAccountSearch] = useState("");
  const [collateralSearch, setCollateralSearch] = useState("");
  const [activeSectionId, setActiveSectionId] = useState<
    RepoQuoteSection["id"]
  >(repoQuoteSections[0].id);
  type CollateralFilter = "all" | "利率地方" | "存单商金" | "信用";
  type RankFilter = "best" | "all";
  type SupplementStatusFilter = ExpandStatus;
  const [collateralFilter, setCollateralFilter] = useState<CollateralFilter>("all");
  const [rankFilter, setRankFilter] = useState<RankFilter>("all");
  const [supplementStatusFilter, setSupplementStatusFilter] = useState<SupplementStatusFilter>("all");
  const [overrides, setOverrides] = useState<Record<string, QuoteOverride>>({});
  const [editingRow, setEditingRow] = useState<QuoteDetailRow | null>(null);
  const [editingDraft, setEditingDraft] = useState<QuoteOverride>({});
  const [chatContext, setChatContext] = useState<QuoteChatContext | null>(null);
  const [pinnedQuotes, setPinnedQuotes] = useState<PinnedQuote[]>([]);
  const pinnedKeys = new Set(pinnedQuotes.map((item) => item.key));

  function applyOverride(row: QuoteDetailRow): QuoteDetailRow {
    const ov = overrides[row.id];
    return ov ? { ...row, ...ov } : row;
  }

  function togglePinnedQuote(item: PinnedQuote) {
    setPinnedQuotes((current) => {
      if (current.some((quote) => quote.key === item.key)) {
        return current.filter((quote) => quote.key !== item.key);
      }
      return [item, ...current];
    });
  }

  function openEditor(row: QuoteDetailRow, groupName: string) {
    const merged = applyOverride(row);
    const prevGroup = overrides[row.id]?.groupName;
    setEditingRow(row);
    setEditingDraft({
      groupName: prevGroup ?? groupName,
      institution: merged.institution,
      tenor: merged.tenor,
      rank: merged.rank,
      amount: merged.amount,
      rate: merged.rate,
      accountType: merged.accountType,
      collateral: merged.collateral,
      minimum: merged.minimum,
    });
  }

  function saveEditor() {
    if (!editingRow) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    setOverrides((prev) => ({
      ...prev,
      [editingRow.id]: { ...editingDraft, updatedAt: time },
    }));
    setEditingRow(null);
  }
  const displayLevel: 1 | 2 = rankFilter === "best" ? 1 : 2;

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
      <section className="tk-panel flex min-h-0 flex-1 flex-col overflow-hidden border border-[rgba(255,255,255,0.1)]">
        <div className="tk-panel-header border-b px-4 py-2">
          <div className="flex flex-nowrap items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              <div className="tk-title-lg shrink-0 whitespace-nowrap">
                非银报价
              </div>
              <div className="flex items-center gap-0.5 border-r border-[color:var(--tk-color-border-divider-dark)] pr-3">
                {repoQuoteSections.map((s) => (
                  <button
                    key={s.id}
                    className={`tk-chip tk-segmented-tab whitespace-nowrap transition-colors ${activeSectionId === s.id ? "tk-chip-active" : "text-slate-400 hover:bg-[var(--tk-color-surface-selected)] hover:text-slate-200"}`}
                    onClick={() => setActiveSectionId(s.id)}
                    type="button"
                  >
                    {s.title}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-0.5 border-r border-[color:var(--tk-color-border-divider-dark)] pr-3">
                {([
                  { key: "all" as RankFilter, label: "全部" },
                  { key: "best" as RankFilter, label: "最优" },
                ]).map((tab) => (
                  <button
                    key={tab.key}
                    className={miniChipClass(rankFilter === tab.key)}
                    onClick={() => setRankFilter(tab.key)}
                    type="button"
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-0.5 border-r border-[color:var(--tk-color-border-divider-dark)] pr-3">
                {([
                  { key: "all" as CollateralFilter, label: "全部" },
                  { key: "利率地方" as CollateralFilter, label: "国债地方" },
                  { key: "存单商金" as CollateralFilter, label: "存单商金" },
                  { key: "信用" as CollateralFilter, label: "信用" },
                ]).map((tab) => (
                  <button
                    key={tab.key}
                    className={miniChipClass(collateralFilter === tab.key)}
                    onClick={() => setCollateralFilter(tab.key)}
                    type="button"
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-0.5">
                {([
                  { key: "all" as SupplementStatusFilter, label: "全部" },
                  { key: "replied" as SupplementStatusFilter, label: "已回复" },
                  { key: "unreplied" as SupplementStatusFilter, label: "未回复" },
                ]).map((tab) => (
                  <button
                    key={tab.key}
                    className={miniChipClass(supplementStatusFilter === tab.key)}
                    onClick={() => setSupplementStatusFilter(tab.key)}
                    type="button"
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                className="tk-button tk-button-success whitespace-nowrap text-mini"
                type="button"
              >
                下载
              </button>
            </div>
          </div>
          <div className="mt-1.5 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2 gap-y-1 border-t border-[color:var(--tk-color-border-divider-dark)] pt-1.5">
            <div className="tk-muted flex items-center gap-1 whitespace-nowrap text-xs">
              <FilterLabel>期限</FilterLabel>
              <div className="flex flex-nowrap items-center gap-0.5">
                <button
                  className={miniChipClass(tenorFilter === "all")}
                  onClick={() => onTenorFilterChange("all")}
                  type="button"
                >
                  全部
                </button>
                {QUOTE_TENOR_OPTIONS.map((t) => (
                  <button
                    key={t}
                    className={miniChipClass(tenorFilter === t)}
                    onClick={() => onTenorFilterChange(t)}
                    type="button"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <QuoteBoardFilterControls
              amountMin={amountMin}
              amountMax={amountMax}
              amountUnit={amountUnit}
              accountSearch={accountSearch}
              collateralSearch={collateralSearch}
              onAmountMinChange={setAmountMin}
              onAmountMaxChange={setAmountMax}
              onAmountUnitChange={setAmountUnit}
              onAccountSearchChange={setAccountSearch}
              onCollateralSearchChange={setCollateralSearch}
              className="justify-end border-l border-[color:var(--tk-color-border-divider-dark)] pl-2"
            />
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {repoQuoteSections
            .filter((section) => section.id === activeSectionId)
            .map((section) => {
              const normalizedSection = normalizeRepoQuoteSection(section);
              return (
                <RepoQuoteSectionBoard
                  key={section.id}
                  section={normalizedSection}
                  displayLevel={displayLevel}
                  tenorFilter={tenorFilter}
                  amountMin={amountMin}
                  amountMax={amountMax}
                  amountUnit={amountUnit}
                  accountSearch={accountSearch}
                  collateralSearch={collateralSearch}
                  collateralTab={collateralFilter}
                  supplementStatusFilter={supplementStatusFilter}
                  applyOverride={applyOverride}
                  pinnedQuotes={pinnedQuotes}
                  pinnedKeys={pinnedKeys}
                  onEdit={openEditor}
                  onTogglePin={togglePinnedQuote}
                  onSend={(quote, groupName) =>
                    setChatContext({
                      quote,
                      groupName,
                      sectionTitle: section.title,
                    })
                  }
                />
              );
            })}
        </div>
      </section>
      <QuoteEditorModal
        row={editingRow}
        draft={editingDraft}
        onChange={(field, value) =>
          setEditingDraft((prev) => ({ ...prev, [field]: value }))
        }
        onClose={() => setEditingRow(null)}
        onSave={saveEditor}
      />
      <QuoteChatDialog
        context={chatContext}
        onClose={() => setChatContext(null)}
      />
    </section>
  );
}

function QuoteChatDialog({
  context,
  onClose,
}: {
  context: QuoteChatContext | null;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [localMessages, setLocalMessages] = useState<
    Array<{ id: string; from: "counterparty" | "trader"; text: string; time: string }>
  >([]);

  useEffect(() => {
    if (!context) return;
    setDraft(
      `${context.quote.tenor} ${context.quote.rate}，${context.quote.amount}，${context.quote.collateral}。`,
    );
    setLocalMessages([
      {
        id: "quote",
        from: "counterparty",
        text: `${context.quote.contactName}：${context.quote.tenor} ${context.quote.rate}，${context.quote.amount}，${context.quote.collateral}，${context.quote.account}。`,
        time: context.quote.updatedAt,
      },
    ]);
  }, [context]);

  if (!context) return null;

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    const now = new Date().toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setLocalMessages((messages) => [
      ...messages,
      { id: `msg-${Date.now()}`, from: "trader", text, time: now },
    ]);
    setDraft("");
  };
  const quickReplies = [
    {
      label: "确认可成交",
      text: `这笔可以，${context.quote.tenor} ${context.quote.rate}，${context.quote.amount} 按这个要素发我方确认。`,
    },
    {
      label: "价格可谈",
      text: `${context.quote.tenor} 价格还能再谈一下吗？目前看到 ${context.quote.rate}。`,
    },
    {
      label: "金额多少",
      text: `这边想确认一下 ${context.quote.tenor} 现在最多还能给多少量？`,
    },
    {
      label: "补充要素",
      text: `麻烦补一下完整要素：期限、金额、利率、质押和账户要求。`,
    },
    {
      label: "稍后回复",
      text: `收到，我这边确认一下账户和额度，稍后回复你。`,
    },
    {
      label: "改报利率",
      text: `${context.quote.tenor} 如果按我方价格再调整一点，可以继续沟通。`,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(17,24,39,0.38)] px-4"
      onMouseDown={onClose}
    >
      <aside
        className="grid h-[520px] w-full max-w-[560px] grid-rows-[auto_1fr_auto] overflow-hidden rounded-xl border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
        aria-label="报价对话框"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[color:var(--tk-color-border-divider-dark)] bg-[var(--tk-color-surface-dark-soft)] px-4 py-3">
          <div className="min-w-0">
            <div className="tk-title truncate">
              {context.quote.contactName} · {context.quote.institution}
            </div>
            <div className="mt-0.5 truncate text-mini text-slate-500">
              {context.sectionTitle} / {context.groupName} / {context.quote.tenor}
            </div>
          </div>
          <button
            className="tk-button"
            onClick={onClose}
            type="button"
          >
            关闭
          </button>
        </div>

        <div className="grid min-h-0 grid-rows-[auto_1fr] overflow-hidden">
          <div className="border-b border-[color:var(--tk-color-border-divider-dark)] bg-[var(--tk-color-surface-page)] p-3">
            <div className="grid grid-cols-4 gap-1.5 text-micro text-slate-400">
              <span className="tk-field truncate px-2 py-1">{context.quote.amount}</span>
              <span className="tk-field truncate px-2 py-1">{context.quote.rate}</span>
              <span className="tk-field truncate px-2 py-1">{context.quote.collateral}</span>
              <span className="tk-field truncate px-2 py-1">
                {context.quote.account}
              </span>
            </div>
          </div>

          <div className="min-h-0 space-y-2 overflow-y-auto p-3">
            {localMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.from === "trader" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[78%] rounded-md border px-3 py-2 text-xs leading-5 ${
                    message.from === "trader"
                      ? "border-[rgba(231,53,58,0.46)] bg-[rgba(231,53,58,0.16)] text-red-100"
                      : "border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-muted)] text-slate-200"
                  }`}
                >
                  <div>{message.text}</div>
                  <div className="mt-1 text-right text-micro text-slate-500">
                    {message.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-[color:var(--tk-color-border-divider-dark)] bg-[var(--tk-color-surface-dark-soft)] p-3">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {quickReplies.map((reply) => (
              <button
                key={reply.label}
                className="tk-chip rounded border text-micro transition-colors hover:border-[color:var(--tdx-red)] hover:text-slate-100"
                onClick={() => setDraft(reply.text)}
                type="button"
              >
                {reply.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="tk-field h-8 min-w-0 flex-1 px-3 text-xs text-slate-100 outline-none placeholder:text-slate-600"
              value={draft}
              placeholder="输入消息，Enter 发送"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") send();
              }}
            />
            <button
              className="tk-button tk-button-success"
              onClick={send}
              type="button"
            >
              发送
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function QuoteEditorModal({
  row,
  draft,
  onChange,
  onClose,
  onSave,
}: {
  row: QuoteDetailRow | null;
  draft: QuoteOverride;
  onChange: (field: keyof QuoteOverride, value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  if (!row) return null;
  const textFields: {
    key: keyof QuoteOverride;
    label: string;
    placeholder?: string;
  }[] = [
    { key: "groupName", label: "分组", placeholder: "如 利率地方" },
    { key: "institution", label: "机构", placeholder: "如 中信银行" },
    { key: "tenor", label: "期限", placeholder: "如 R007" },
    { key: "rate", label: "利率", placeholder: "如 1.40%" },
    { key: "amount", label: "金额", placeholder: "如 5亿" },
    { key: "minimum", label: "起投门槛", placeholder: "如 5亿起" },
    { key: "accountType", label: "账户类型", placeholder: "如 自营户" },
    { key: "collateral", label: "质押品", placeholder: "如 利率/地方/存单" },
  ];
  const rankOptions: QuoteRank[] = ["最优", "次优", "报价"];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(17,24,39,0.32)] px-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] shadow-[0_12px_28px_rgba(17,24,39,0.12)]">
        <div className="border-b border-[color:var(--tk-color-border-divider-dark)] bg-[var(--tk-color-surface-dark-soft)] px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="tk-title">
                修正报价
              </div>
            </div>
            <button
              className="tk-button"
              onClick={onClose}
              type="button"
            >
              关闭
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 px-5 py-4">
          {textFields.map((f) => (
            <label
              key={f.key}
              className="flex flex-col gap-1 text-mini text-slate-400"
            >
              <span>{f.label}</span>
              <input
                className="rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-[color:var(--tk-color-brand-primary-hover)]"
                value={(draft[f.key] as string) ?? ""}
                placeholder={f.placeholder}
                onChange={(e) => onChange(f.key, e.target.value)}
              />
            </label>
          ))}
          <label className="flex flex-col gap-1 text-mini text-slate-400">
            <span>评级</span>
            <select
              className="rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-[color:var(--tk-color-brand-primary-hover)]"
              value={(draft.rank as string) ?? row.rank}
              onChange={(e) => onChange("rank", e.target.value)}
            >
              {rankOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-[color:var(--tk-color-border-divider-dark)] bg-[var(--tk-color-surface-dark-deep)] px-5 py-4">
          <button
            className="tk-button"
            onClick={onClose}
            type="button"
          >
            取消
          </button>
          <button
            className="tk-button tk-button-success"
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

function clampRatio(value: number) {
  return Math.max(15, Math.min(85, value));
}

// 60% 行展示 amount，剩下 40% 行展示 "--"。按 id 字典序均匀取 40% 行。
const BLANK_AMOUNT_IDS = (() => {
  const ids: string[] = [];
  for (const section of repoQuoteSections) {
    for (const group of section.groups) {
      for (const row of group.rows) ids.push(row.id);
    }
  }
  ids.sort();
  const blanks = new Set<string>();
  ids.forEach((id, i) => {
    if (i % 5 === 1 || i % 5 === 3) blanks.add(id);
  });
  return blanks;
})();

function showRowAmount(id: string): boolean {
  return !BLANK_AMOUNT_IDS.has(id);
}

type ExpandStatus = "unreplied" | "replied" | "all";

function hashSeed(text: string) {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) % 2147483647;
  }
  return hash;
}

function shiftQuoteTime(baseTime: string, offsetMinutes: number) {
  const [hourText = "10", minuteText = "53", secondText = "00"] = baseTime.split(":");
  const hour = Number.parseInt(hourText, 10);
  const minute = Number.parseInt(minuteText, 10);
  const second = Number.parseInt(secondText, 10);
  const safeHour = Number.isFinite(hour) ? hour : 10;
  const safeMinute = Number.isFinite(minute) ? minute : 53;
  const safeSecond = Number.isFinite(second) ? second : 0;
  const totalMinutes = safeHour * 60 + safeMinute - offsetMinutes;
  const normalizedMinutes = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const nextHour = Math.floor(normalizedMinutes / 60);
  const nextMinute = normalizedMinutes % 60;
  return `${String(nextHour).padStart(2, "0")}:${String(nextMinute).padStart(2, "0")}:${String(safeSecond).padStart(2, "0")}`;
}

type SupplementGroupName = "利率地方" | "存单商金" | "信用";

const supplementAccountOptions = [
  "自营",
  "公募",
  "可专户",
  "专户出老户",
  "非专户",
  "不限户",
] as const;

const supplementPledgeOptionsByGroup: Record<SupplementGroupName, readonly string[]> = {
  利率地方: ["利率", "地方"],
  存单商金: ["国股存单", "存单"],
  信用: [
    "二级",
    "次级",
    "永续",
    "次永",
    "二永",
    "不可二级",
    "不可次级",
    "不可永续",
    "不可次永",
    "不可二永",
    "AAA信用",
    "AA+信用",
    "信用",
    "PPN",
  ],
};

const supplementConfigByGroup: Record<
  SupplementGroupName,
  {
    targetCount: number;
    amountFillRate: number;
    accountFillRate: number;
    pledgeFillRate: number;
  }
> = {
  利率地方: {
    targetCount: 5,
    amountFillRate: 0.3,
    accountFillRate: 0.3,
    pledgeFillRate: 1,
  },
  存单商金: {
    targetCount: 12,
    amountFillRate: 0.6,
    accountFillRate: 0.3,
    pledgeFillRate: 1,
  },
  信用: {
    targetCount: 24,
    amountFillRate: 0.7,
    accountFillRate: 0.3,
    pledgeFillRate: 0.7,
  },
};

function classifyCollateralGroup(collateral?: string | null): SupplementGroupName {
  const normalized = String(collateral ?? "").trim();
  if (!normalized) return "信用";
  if (normalized.includes("存单") || normalized.includes("商金")) return "存单商金";
  if (
    normalized.includes("信用") ||
    normalized.includes("PPN") ||
    normalized.includes("二级") ||
    normalized.includes("次级") ||
    normalized.includes("永续") ||
    normalized.includes("次永") ||
    normalized.includes("二永") ||
    normalized.includes("AAA") ||
    normalized.includes("AA+")
  ) return "信用";
  return "利率地方";
}

function normalizeSupplementGroup(groupName: string): SupplementGroupName {
  if (groupName === "信用") return "信用";
  if (groupName === "存单商金") return "存单商金";
  return "利率地方";
}

function normalizeRepoQuoteSection(section: RepoQuoteSection): RepoQuoteSection {
  const groupOrder: SupplementGroupName[] = ["利率地方", "存单商金", "信用"];
  const groupMeta = new Map(
    section.groups.map((group) => [group.name, group] as const),
  );
  const rowsByGroup = new Map<SupplementGroupName, QuoteDetailRow[]>(
    groupOrder.map((groupName) => [groupName, []]),
  );

  for (const group of section.groups) {
    for (const row of group.rows) {
      const nextGroup = classifyCollateralGroup(row.collateral);
      rowsByGroup.get(nextGroup)!.push(row);
    }
  }

  return {
    ...section,
    groups: groupOrder
      .map((groupName) => {
        const baseGroup = groupMeta.get(groupName);
        if (!baseGroup) return null;
        const rows = rowsByGroup.get(groupName) ?? [];
        return {
          ...baseGroup,
          rows,
          name: groupName,
        };
      })
      .filter(Boolean) as QuoteGroup[],
  };
}

function pickSeededValue<T>(
  options: readonly T[],
  seed: number,
  salt: number,
): T {
  return options[(seed + salt * 17) % options.length]!;
}

function shouldFillSeededField(
  seed: number,
  salt: number,
  fillRate: number,
): boolean {
  const normalized = Math.max(0, Math.min(1, fillRate));
  return ((seed + salt * 131) % 1000) / 1000 < normalized;
}

function buildOpponentCards(
  row: QuoteDetailRow,
  groupName: string,
): OpponentQuoteCard[] {
  const seed = hashSeed(`${row.id}-${groupName}`);
  const supplementGroup = normalizeSupplementGroup(groupName);
  const supplementConfig = supplementConfigByGroup[supplementGroup];
  const cards: OpponentQuoteCard[] = [];
  const targetCount = supplementConfig.targetCount;
  const amountPool = ["3亿", "5亿", "8亿", "10亿", "15亿", "20亿"] as const;
  const rateBase = Number.parseFloat(row.rate.replace("%", ""));
  const anchorAccount = normalizeAccountRequirement(row.accountType);
  const anchorPledge = row.collateral?.trim() ? row.collateral : null;
  const institutionPool = opponentInstitutions.filter((institution) => institution !== row.institution);
  const orderedInstitutions = institutionPool
    .map((institution, index) => ({
      institution,
      sortKey: (seed + index * 29) % 997,
    }))
    .sort((a, b) => a.sortKey - b.sortKey)
    .map((item) => item.institution);
  const anchorCard: OpponentQuoteCard = {
    id: `${row.id}-anchor`,
    name: contactNameForInstitution(row.institution),
    institution: row.institution,
    waitMinutes: 1,
    status: "unreplied",
    updatedAt: row.updatedAt,
    tenor: row.tenor,
    amount: row.amount && row.amount !== "--" ? row.amount : null,
    rate: row.rate,
    pledge: anchorPledge,
    account: anchorAccount,
    tags: [
      `${row.tenor} ${row.rate}`,
      "核心对手",
      anchorPledge,
      anchorAccount,
    ].filter(Boolean) as string[],
    core: true,
  };

  for (let index = 0; index < targetCount - 1; index += 1) {
    const core = index < 1 || (supplementGroup === "信用" && index % 8 === 0);
    const waitMinutes = 1 + ((seed + index * 3) % 19);
    const status: OpponentQuoteCard["status"] =
      index % 5 === 0 ? "replied" : "unreplied";
    const institution = orderedInstitutions[index % orderedInstitutions.length] ?? row.institution;
    const name = contactNameForInstitution(institution);
    const hasAmount = shouldFillSeededField(
      seed,
      index + 1,
      supplementConfig.amountFillRate,
    );
    const hasAccount = shouldFillSeededField(
      seed,
      index + 101,
      supplementConfig.accountFillRate,
    );
    const hasPledge = shouldFillSeededField(
      seed,
      index + 201,
      supplementConfig.pledgeFillRate,
    );
    const account = hasAccount
      ? pickSeededValue(supplementAccountOptions, seed, index + 5)
      : null;
    const pledge = hasPledge
      ? pickSeededValue(
          supplementPledgeOptionsByGroup[supplementGroup],
          seed,
          index + 7,
        )
      : null;
    const tags = [
      `${row.tenor} ${`${(rateBase + ((index % 4) - 1) * 0.01).toFixed(2)}%`}`,
      core ? "核心对手" : "活跃对手",
      pledge,
      account,
    ].filter(Boolean) as string[];

    cards.push({
      id: `${row.id}-opp-${index}`,
      name,
      institution,
      waitMinutes,
      status,
      updatedAt: shiftQuoteTime(row.updatedAt, waitMinutes),
      tenor: row.tenor,
      amount: hasAmount ? amountPool[(seed + index * 11) % amountPool.length] : null,
      rate: row.rate,
      pledge,
      account,
      tags,
      core,
    });
  }

  const specials =
    row.tenor === "R007"
      ? ([
          { tenor: "3D", amount: "5亿", rate: `${(rateBase + 0.01).toFixed(2)}%` },
          { tenor: "6D", amount: null, rate: `${(rateBase + 0.02).toFixed(2)}%` },
          { tenor: "2-7D", amount: "8亿", rate: `${(rateBase + 0.03).toFixed(2)}%` },
        ] as const).map((item, index) => {
          const hasAmount = shouldFillSeededField(
            seed,
            index + 301,
            supplementConfig.amountFillRate,
          );
          const hasAccount = shouldFillSeededField(
            seed,
            index + 401,
            supplementConfig.accountFillRate,
          );
          const hasPledge = shouldFillSeededField(
            seed,
            index + 501,
            supplementConfig.pledgeFillRate,
          );
          const pledge = hasPledge
            ? pickSeededValue(
                supplementPledgeOptionsByGroup[supplementGroup],
                seed,
                index + 11,
              )
            : null;
          const account = hasAccount
            ? pickSeededValue(supplementAccountOptions, seed, index + 13)
            : null;

          return {
            id: `${row.id}-special-${index}`,
            name: contactNameForInstitution(
              orderedInstitutions[(index + targetCount) % orderedInstitutions.length] ?? row.institution,
            ),
            institution: orderedInstitutions[(index + targetCount) % orderedInstitutions.length] ?? row.institution,
            waitMinutes: 2 + index * 2,
            status: "unreplied" as const,
            updatedAt: shiftQuoteTime(row.updatedAt, 2 + index * 2),
            tenor: row.tenor,
            amount: hasAmount ? item.amount : null,
            rate: row.rate,
            pledge,
            account,
            tags: [`${item.tenor} ${item.rate}`, "核心对手", "特殊期限", pledge, account].filter(Boolean) as string[],
            core: true,
            special: true,
          };
        })
      : [];

  const normalCards = cards.sort((a, b) => {
    const aScore =
      (a.core ? 100 : 0) +
      (a.amount ? 30 : 0) +
      (a.status === "unreplied" ? 10 : 0) -
      a.waitMinutes;
    const bScore =
      (b.core ? 100 : 0) +
      (b.amount ? 30 : 0) +
      (b.status === "unreplied" ? 10 : 0) -
      b.waitMinutes;
    return bScore - aScore;
  });

  return [anchorCard, ...normalCards, ...specials];
}

function getVisibleOpponentCards(
  row: QuoteDetailRow,
  cards: readonly OpponentQuoteCard[],
  status: ExpandStatus,
  includeAnchor = false,
) {
  const filtered =
    status === "all"
      ? cards
      : cards.filter((card) => card.status === status || card.special);
  return includeAnchor
    ? filtered
    : filtered.filter((card) => card.id !== `${row.id}-anchor`);
}

function sortOpponentCardsForDisplay(
  cards: readonly OpponentQuoteCard[],
  rateAscending: boolean,
) {
  return [...cards].sort((a, b) => {
    const aRate = Number.parseFloat(a.rate.replace("%", ""));
    const bRate = Number.parseFloat(b.rate.replace("%", ""));
    if (aRate !== bRate) {
      return rateAscending ? aRate - bRate : bRate - aRate;
    }
    const aReplied = a.status === "replied" ? 1 : 0;
    const bReplied = b.status === "replied" ? 1 : 0;
    if (aReplied !== bReplied) return bReplied - aReplied;
    const aCore = a.core ? 1 : 0;
    const bCore = b.core ? 1 : 0;
    if (aCore !== bCore) return bCore - aCore;
    return b.updatedAt.localeCompare(a.updatedAt, "zh-CN");
  });
}

function opponentQuoteTimeText(card: OpponentQuoteCard) {
  return card.updatedAt.slice(0, 5);
}

function normalizeUnifiedTenorValue(tenor: string) {
  if (/^R\d{3}$/i.test(tenor)) return tenor.toUpperCase();
  if (/^\d+D$/i.test(tenor)) {
    const days = Number.parseInt(tenor, 10);
    return Number.isFinite(days) ? `R${String(days).padStart(3, "0")}` : tenor.toUpperCase();
  }
  const range = tenor.match(/^(\d+)-(\d+)D$/i);
  if (range) {
    const from = String(Number.parseInt(range[1] ?? "0", 10)).padStart(3, "0");
    const to = String(Number.parseInt(range[2] ?? "0", 10)).padStart(3, "0");
    return `R${from}-${to}`;
  }
  return tenor.toUpperCase();
}

function tenorSortValue(tenor: string) {
  const normalized = normalizeUnifiedTenorValue(tenor);
  const range = normalized.match(/^R(\d{3})-(\d{3})$/);
  if (range) {
    return Number.parseInt(range[1] ?? "999", 10);
  }
  const single = normalized.match(/^R(\d{3})$/);
  if (single) {
    return Number.parseInt(single[1] ?? "999", 10);
  }
  return 999;
}

function formatUnifiedUpdatedAt(value: string) {
  return value ? value.slice(0, 5) : "--";
}

function displayUnifiedTenorValue(tenor: string) {
  const normalized = normalizeUnifiedTenorValue(tenor);
  const range = normalized.match(/^R(\d{3})-(\d{3})$/);
  if (range) {
    const from = Number.parseInt(range[1] ?? "0", 10);
    const to = Number.parseInt(range[2] ?? "0", 10);
    return `${from}-${to}D`;
  }
  const single = normalized.match(/^R(\d{3})$/);
  if (single) {
    const days = Number.parseInt(single[1] ?? "0", 10);
    return `${days}D`;
  }
  return tenor.toUpperCase();
}

function OpponentExpandPanel({
  row,
  groupName,
  section,
  cards,
  status,
  onStatusChange,
  pinnedKeys,
  onTogglePin,
  onSend,
  showColumnHeader = true,
}: {
  row: QuoteDetailRow;
  groupName: string;
  section: RepoQuoteSection;
  cards: readonly OpponentQuoteCard[];
  status: ExpandStatus;
  onStatusChange: (status: ExpandStatus) => void;
  pinnedKeys: ReadonlySet<string>;
  onTogglePin: (item: PinnedQuote) => void;
  onSend: (quote: QuoteChatPayload) => void;
  showColumnHeader?: boolean;
}) {
  const visibleCards = sortOpponentCardsForDisplay(
    getVisibleOpponentCards(
      row,
      cards,
      status,
    ),
    section.id === "reverse",
  );
  const parentPin = pinnedQuoteFromRow(row, groupName, section);
  const pinned = pinnedKeys.has(parentPin.key);
  const inlineMode = !showColumnHeader;

  return (
    <div className={showColumnHeader ? "border-b border-[color:var(--tk-color-border-divider)] bg-[rgba(18,19,27,0.98)] px-3 pb-3 pt-2" : "bg-[rgba(18,19,27,0.62)]"}>
      {showColumnHeader ? (
        <div className="grid grid-cols-[1.4fr_0.55fr_0.7fr_0.75fr_0.9fr_0.85fr_0.7fr_0.8fr_1.05fr] border-y border-[color:var(--tk-color-border-divider-dark)] bg-[rgba(255,255,255,0.03)] px-4 py-1.5 text-mini font-medium tracking-[0.02em] text-slate-400">
          <span>对手 / 机构</span>
          <span className="text-right">期限</span>
          <span className="text-right">金额</span>
          <span className="text-right">利率(报价)</span>
          <span className="text-right">账户要求</span>
          <span className="text-right">质押要求</span>
          <span className="text-right">回复状态</span>
          <span className="text-right">报价时间</span>
          <span className="text-right">操作</span>
        </div>
      ) : null}

      <div className={`${
        showColumnHeader
          ? "divide-y divide-[color:var(--tk-color-border-divider)] border-b border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-page)]"
          : inlineMode
            ? "bg-transparent"
            : "divide-y divide-[color:var(--tk-color-border-divider)] bg-[rgba(255,255,255,0.02)]"
      }`}>
        {visibleCards.map((card) => {
          return (
            <div
              key={card.id}
              className={`grid grid-cols-[1.4fr_0.55fr_0.7fr_0.75fr_0.9fr_0.85fr_0.7fr_0.8fr_1.05fr] items-center px-4 py-2 text-left text-xs text-slate-200 transition hover:bg-[rgba(255,255,255,0.03)] ${
                inlineMode ? "bg-transparent" : ""
              }`}
            >
              <div className="flex min-w-0 items-center gap-2">
                {card.core ? (
                  <span className="inline-flex shrink-0 items-center rounded border border-emerald-500/40 bg-emerald-500/15 px-1.5 py-0.5 text-micro text-emerald-300">
                    核心
                  </span>
                ) : null}
                {card.special ? (
                  <span className="inline-flex shrink-0 items-center rounded border border-amber-500/40 bg-amber-500/15 px-1.5 py-0.5 text-micro text-amber-300">
                    特殊
                  </span>
                ) : null}
                <div className="min-w-0 truncate text-slate-100">
                  {formatInstitutionSender(card.institution, card.name)}
                </div>
              </div>
              <span className="text-right">{card.tenor}</span>
              <span className="text-right">{card.amount ?? "--"}</span>
              <span className="text-right font-semibold text-amber-300">{card.rate}</span>
              <span
                className="truncate pl-3 text-right text-xs text-slate-300"
                title={card.account ?? ""}
              >
                {card.account ?? ""}
              </span>
              <span
                className="truncate pl-3 text-right text-xs text-slate-300"
                title={card.pledge ?? ""}
              >
                {card.pledge ?? ""}
              </span>
              <span className="text-right text-xs text-slate-400">
                {formatUnifiedReplyStatus(card.status)}
              </span>
              <span className="text-right text-xs tabular-nums text-slate-400">
                {opponentQuoteTimeText(card)}
              </span>
              <span className="flex items-center justify-end gap-1">
                <button
                  className={`inline-flex h-6 w-6 items-center justify-center rounded border transition ${
                    pinned
                      ? "border-amber-400/60 bg-amber-400/20 text-amber-200"
                      : "border-[color:var(--tk-color-border-panel)] bg-white/5 text-slate-500 hover:text-amber-200"
                  }`}
                  onClick={() => onTogglePin(parentPin)}
                  title={pinned ? "取消固定主报价" : "固定主报价"}
                  type="button"
                >
                  <Pin size={12} fill={pinned ? "currentColor" : "none"} />
                </button>
                <button
                  className="tk-inline-action whitespace-nowrap rounded-md border border-blue-500/30 bg-blue-500/20 text-blue-300"
                  onClick={() => onSend(buildOpponentChatQuote(card))}
                  type="button"
                >
                  发送
                </button>
              </span>
            </div>
          );
        })}
        {!visibleCards.length ? (
          <div className="grid min-h-[72px] place-items-center text-xs text-slate-500">
            暂无明细数据
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CompactSelectField<T extends string>({
  value,
  options,
  onChange,
  getLabel,
}: {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  getLabel?: (value: T) => string;
}) {
  return (
    <select
      className="tk-field h-6 min-w-[56px] rounded border px-2 text-mini text-slate-100 outline-none"
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {getLabel ? getLabel(option) : option}
        </option>
      ))}
    </select>
  );
}

function RepoQuoteSectionBoard({
  section,
  displayLevel,
  tenorFilter,
  amountMin,
  amountMax,
  amountUnit,
  accountSearch,
  collateralSearch,
  collateralTab = "all",
  supplementStatusFilter = "all",
  applyOverride,
  pinnedQuotes,
  pinnedKeys,
  onEdit,
  onTogglePin,
  onSend,
}: {
  section: RepoQuoteSection;
  displayLevel: 1 | 2;
  tenorFilter: QuoteTenorFilter;
  amountMin: string;
  amountMax: string;
  amountUnit: AmountFilterUnit;
  accountSearch: string;
  collateralSearch: string;
  collateralTab?: string;
  supplementStatusFilter?: ExpandStatus;
  applyOverride: (row: QuoteDetailRow) => QuoteDetailRow;
  pinnedQuotes: readonly PinnedQuote[];
  pinnedKeys: ReadonlySet<string>;
  onEdit: (row: QuoteDetailRow, groupName: string) => void;
  onTogglePin: (item: PinnedQuote) => void;
  onSend: (quote: QuoteChatPayload, groupName: string) => void;
}) {
  const detailMode = displayLevel === 2;
  const directionRateAscending = section.id === "reverse";
  const defaultRateSortDirection: QuoteTableSortDirection = directionRateAscending ? "asc" : "desc";
  const [sortState, setSortState] = useState<QuoteTableSortState | null>(null);
  const minAmountValue = normalizeAmountFilterToYi(amountMin, amountUnit);
  const maxAmountValue = normalizeAmountFilterToYi(amountMax, amountUnit);
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);
  const [expandedStatusByKey, setExpandedStatusByKey] = useState<Record<string, ExpandStatus>>({});

  const toggleSort = (
    field: QuoteTableSortField,
    defaultDirection: QuoteTableSortDirection,
  ) => {
    setSortState((current) => nextQuoteTableSortState(current, field, defaultDirection));
  };

  const amountSortDirection = sortState?.field === "amount" ? sortState.direction : null;
  const rateSortDirection = sortState?.field === "rate" ? sortState.direction : null;

  const matchTenor = (rowTenor: string) =>
    tenorFilter === "all" || rowTenor === tenorFilter;

  const amountFilterActive = (minAmountValue !== null && minAmountValue > 0) || maxAmountValue !== null;

  const matchAmount = (amountText: string | null | undefined) => {
    const amountValue = parseAmountTextToYi(amountText);
    if (amountValue === null) return !amountFilterActive;
    if (minAmountValue !== null && amountValue < minAmountValue) return false;
    if (maxAmountValue !== null && amountValue > maxAmountValue) return false;
    return true;
  };

  const matchRowFilters = (row: QuoteDetailRow) =>
    matchTenor(row.tenor) &&
    matchAmount(displayAmountForRow(row)) &&
    fuzzyTextMatch(
      `${normalizeAccountRequirement(row.accountType)} ${row.accountType}`,
      accountSearch,
    ) &&
    fuzzyTextMatch(`${row.collateral} ${row.reason}`, collateralSearch);

  const matchNonAmountFilters = (row: QuoteDetailRow) =>
    matchTenor(row.tenor) &&
    fuzzyTextMatch(
      `${normalizeAccountRequirement(row.accountType)} ${row.accountType}`,
      accountSearch,
    ) &&
    fuzzyTextMatch(`${row.collateral} ${row.reason}`, collateralSearch);

  const getLogicalRows = (group: QuoteGroup) => {
    const logicalRows = applyLogicalQuoteAmounts(
      applyLogicalQuoteRanks(group.rows.map(applyOverride), section.id),
    );
    return displayLevel === 1
      ? selectLevel1RowsFromRows(group.name, logicalRows)
      : sortRowsByRank(logicalRows);
  };

  const filteredGroups = collateralTab === "all"
    ? section.groups
    : section.groups.filter((g) => g.name === collateralTab);

  const visibleGroups = filteredGroups
    .map((group) => ({ group, rows: getLogicalRows(group).filter(matchRowFilters) }))
    .filter(({ rows }) => rows.length > 0);

  const flatVisibleRows = visibleGroups.flatMap(({ group, rows }) =>
    rows.map((row) => ({ row, groupName: group.name })),
  );

  const detailCandidates = detailMode
    ? filteredGroups.flatMap((group) =>
        getLogicalRows(group)
          .filter(matchNonAmountFilters)
          .map((row) => ({ row, groupName: group.name })),
      )
    : [];

  const pinnedSectionQuotes = pinnedQuotes
    .filter((item) => item.sectionId === section.id)
    .map((item) => ({ ...item, row: applyOverride(item.row) }))
    .filter((item) => matchRowFilters(item.row));

  const openRowChat = (row: QuoteDetailRow, groupName: string) => {
    onSend(buildPrimaryChatQuote(row), groupName);
  };

  const canExpandRows = !detailMode;

  const toggleExpandedRow = (row: QuoteDetailRow, groupName: string) => {
    if (!canExpandRows) return;
    const key = pinnedQuoteKey(section.id, groupName, row.institution, row.tenor);
    setExpandedRowKey((current) => (current === key ? null : key));
    setExpandedStatusByKey((current) =>
      current[key]
        ? current
        : {
            ...current,
            [key]: "unreplied",
          },
    );
  };

  const setExpandedStatus = (rowKey: string, status: ExpandStatus) => {
    setExpandedStatusByKey((current) => ({ ...current, [rowKey]: status }));
  };

  const buildUnifiedPrimaryRow = (
    row: QuoteDetailRow,
    groupName: string,
    primaryStatus: OpponentQuoteCard["status"] = "unreplied",
  ): UnifiedQuoteTableRow => {
    const mergedRow = applyOverride(row);
    const pinItem = pinnedQuoteFromRow(mergedRow, groupName, section);
    return {
      id: `${mergedRow.id}-primary`,
      kind: "primary",
      coreLabel: "",
      replyStatus: formatUnifiedReplyStatus(primaryStatus),
      institution: formatInstitutionSender(
        mergedRow.institution,
        contactNameForInstitution(mergedRow.institution),
      ),
      sender: "",
      tenor: normalizeUnifiedTenorValue(mergedRow.tenor),
      amount: displayAmountForRow(mergedRow) ?? "--",
      rate: mergedRow.rate,
      account: shouldShowAccountRequirement(mergedRow.id)
        ? normalizeAccountRequirement(mergedRow.accountType)
        : "",
      pledge: mergedRow.collateral,
      updatedAt: formatUnifiedUpdatedAt(mergedRow.updatedAt),
      groupName,
      chatQuote: buildPrimaryChatQuote(mergedRow),
      pinItem,
    };
  };

  const buildUnifiedSupplementRows = (
    row: QuoteDetailRow,
    groupName: string,
    cards?: readonly OpponentQuoteCard[],
  ): UnifiedQuoteTableRow[] => {
    const mergedRow = applyOverride(row);
    const pinItem = pinnedQuoteFromRow(mergedRow, groupName, section);
    return getVisibleOpponentCards(
      mergedRow,
      cards ?? buildOpponentCards(mergedRow, groupName),
      supplementStatusFilter,
    )
      .filter((card) => matchAmount(card.amount))
      .map((card) => ({
        id: `${card.id}-supplement`,
        kind: "supplement",
        coreLabel: card.core ? "核心" : "",
        replyStatus: formatUnifiedReplyStatus(card.status),
        institution: formatInstitutionSender(card.institution, card.name),
        sender: "",
        tenor: normalizeUnifiedTenorValue(mergedRow.tenor),
        amount: card.amount ?? "--",
        rate: mergedRow.rate,
        account: card.account ?? "",
        pledge: card.pledge ?? "",
        updatedAt: formatUnifiedUpdatedAt(card.updatedAt),
        groupName,
        chatQuote: buildOpponentChatQuote(card),
        pinItem,
      }));
  };

  const compareQuoteTableRows = (
    a: Pick<UnifiedQuoteTableRow, "amount" | "rate">,
    b: Pick<UnifiedQuoteTableRow, "amount" | "rate">,
  ) => {
    if (!sortState) return 0;
    if (sortState.field === "amount") {
      return compareOptionalSortNumbers(
        parseAmountTextToYi(a.amount),
        parseAmountTextToYi(b.amount),
        sortState.direction,
      );
    }
    return compareOptionalSortNumbers(
      parseRatePercent(a.rate),
      parseRatePercent(b.rate),
      sortState.direction,
    );
  };

  const sortUnifiedRows = (rows: UnifiedQuoteTableRow[]) =>
    [...rows].sort((a, b) => {
      const sortDiff = compareQuoteTableRows(a, b);
      if (sortDiff !== 0) return sortDiff;

      const tenorDiff = tenorSortValue(a.tenor) - tenorSortValue(b.tenor);
      if (tenorDiff !== 0) return tenorDiff;

      const aRate = parseRatePercent(a.rate) ?? 0;
      const bRate = parseRatePercent(b.rate) ?? 0;
      if (aRate !== bRate) {
        return directionRateAscending ? aRate - bRate : bRate - aRate;
      }

      const aReplied = a.replyStatus === "已回复" ? 1 : 0;
      const bReplied = b.replyStatus === "已回复" ? 1 : 0;
      if (aReplied !== bReplied) return bReplied - aReplied;

      const aCore = a.coreLabel === "核心" ? 1 : 0;
      const bCore = b.coreLabel === "核心" ? 1 : 0;
      if (aCore !== bCore) return bCore - aCore;

      return a.institution.localeCompare(b.institution, "zh-CN");
    });

  const sortDetailRows = (rows: readonly QuoteDetailRow[]) =>
    [...rows].sort((a, b) => {
      const sortDiff = compareQuoteTableRows(
        {
          amount: displayAmountForRow(a) ?? "--",
          rate: a.rate,
        },
        {
          amount: displayAmountForRow(b) ?? "--",
          rate: b.rate,
        },
      );
      if (sortDiff !== 0) return sortDiff;

      if (detailMode) {
        const tenorDiff = tenorSortValue(a.tenor) - tenorSortValue(b.tenor);
        if (tenorDiff !== 0) return tenorDiff;

        const aRate = parseRatePercent(a.rate) ?? 0;
        const bRate = parseRatePercent(b.rate) ?? 0;
        if (aRate !== bRate) {
          return directionRateAscending ? aRate - bRate : bRate - aRate;
        }
      } else {
        const rankDiff = (rankPriority[a.rank] ?? 99) - (rankPriority[b.rank] ?? 99);
        if (rankDiff !== 0) return rankDiff;

        const tenorDiff = tenorSortValue(a.tenor) - tenorSortValue(b.tenor);
        if (tenorDiff !== 0) return tenorDiff;
      }

      return a.institution.localeCompare(b.institution, "zh-CN");
    });

  const unifiedRows = detailMode
    ? sortUnifiedRows(
        detailCandidates.flatMap(({ row, groupName }) => {
          const mergedRow = applyOverride(row);
          const cards = buildOpponentCards(mergedRow, groupName);
          const anchorCard = cards.find((card) => card.id === `${mergedRow.id}-anchor`);
          const supplementRows = buildUnifiedSupplementRows(row, groupName, cards);
          const result: UnifiedQuoteTableRow[] = [];
          if (matchAmount(displayAmountForRow(row))) {
            const primaryRow = buildUnifiedPrimaryRow(
              row,
              groupName,
              anchorCard?.status ?? "unreplied",
            );
            const primaryMatchesStatus =
              supplementStatusFilter === "all" || anchorCard?.status === supplementStatusFilter;
            if (primaryMatchesStatus) result.push(primaryRow);
          }
          result.push(...supplementRows);
          return result;
        }),
      )
    : [];

  const renderUnifiedTableRow = (item: UnifiedQuoteTableRow) => {
    const rowPinned = pinnedKeys.has(item.pinItem.key);
    return (
      <div
        key={item.id}
        className="grid grid-cols-[0.5fr_1.45fr_0.6fr_0.75fr_0.75fr_0.8fr_0.8fr_0.8fr_0.7fr_0.9fr] items-center border-b border-[color:var(--tk-color-border-divider)] px-4 py-2 text-left text-xs text-slate-200 transition hover:bg-[var(--tk-color-surface-selected)]"
      >
        <span className="text-center text-micro text-emerald-300">{item.coreLabel}</span>
        <span className="truncate text-slate-100">{item.institution}</span>
        <span className="text-right">{item.tenor}</span>
        <span className="text-right">{item.amount}</span>
        <span className="text-right font-semibold text-amber-300">{item.rate}</span>
        <span className="truncate pl-3 text-right text-xs text-slate-300" title={item.account}>
          {item.account}
        </span>
        <span className="truncate pl-3 text-right text-xs text-slate-300" title={item.pledge}>
          {item.pledge}
        </span>
        <span className="text-right text-xs text-slate-400">{item.replyStatus}</span>
        <span className="text-right text-xs tabular-nums text-slate-400">{item.updatedAt}</span>
        <span className="flex items-center justify-end gap-1">
          <button
            className={`inline-flex h-6 w-6 items-center justify-center rounded border transition ${
              rowPinned
                ? "border-amber-400/60 bg-amber-400/20 text-amber-200"
                : "border-[color:var(--tk-color-border-panel)] bg-white/5 text-slate-500 hover:text-amber-200"
            }`}
            onClick={() => onTogglePin(item.pinItem)}
            title={rowPinned ? "取消固定" : "固定行情"}
            type="button"
          >
            <Pin size={12} fill={rowPinned ? "currentColor" : "none"} />
          </button>
          <button
            className="tk-inline-action whitespace-nowrap rounded-md border border-blue-500/30 bg-blue-500/20 text-blue-300"
            onClick={() => onSend(item.chatQuote, item.groupName)}
            type="button"
          >
            发送
          </button>
        </span>
      </div>
    );
  };

  const renderDetailRow = (
    row: QuoteDetailRow,
    groupName: string,
    dense: boolean,
    keyPrefix = "",
  ) => {
    const rowPin = pinnedQuoteFromRow(row, groupName, section);
    const rowPinned = pinnedKeys.has(rowPin.key);
    const expanded = canExpandRows && expandedRowKey === rowPin.key;
    const cards = buildOpponentCards(row, groupName);
    const expandedStatus = supplementStatusFilter;
    const inlineVisibleCards = getVisibleOpponentCards(
      row,
      cards,
      supplementStatusFilter,
    ).filter((card) => matchAmount(card.amount));

    return (
      <div key={`${keyPrefix}${row.id}`} className="border-b border-[color:var(--tk-color-border-divider)] last:border-b-0">
        <div
          className={`grid w-full grid-cols-[1.4fr_0.55fr_0.7fr_0.75fr_0.9fr_0.85fr_0.7fr_1.05fr] items-center border-l-[3px] ${
            expanded ? "border-[color:var(--tk-color-brand-cyan)] bg-[rgba(56,113,189,0.08)]" : "border-transparent"
          } ${dense ? "py-1.5" : "py-1.5"} pl-4 pr-4 text-left text-xs text-slate-200 transition hover:bg-[var(--tk-color-surface-selected)]`}
        >
          <div className="flex items-center gap-2">
            {canExpandRows ? (
              <button
                className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
                  expanded
                    ? "border-[color:var(--tk-color-brand-cyan)] bg-[rgba(56,113,189,0.14)] text-[color:var(--tk-color-brand-cyan)]"
                    : "border-[color:var(--tk-color-border-panel)] bg-white/5 text-slate-500 hover:text-slate-200"
                }`}
                onClick={() => toggleExpandedRow(row, groupName)}
                title={expanded ? "收起同期限明细" : "展开同期限明细"}
                type="button"
              >
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            ) : (
              <span className="inline-flex h-5 w-5 shrink-0" aria-hidden="true" />
            )}
            {!detailMode ? (
              <span className="tk-badge shrink-0 rounded-full border px-1.5 py-0.5 text-micro text-cyan-200">
                {groupName}
              </span>
            ) : null}
            {!detailMode && (row.rank === "最优" || row.rank === "次优") ? <RankBadge rank={row.rank} /> : null}
            <span className="truncate text-slate-100">
              {formatInstitutionSender(row.institution, contactNameForInstitution(row.institution))}
            </span>
          </div>
          <span className="text-right">{row.tenor}</span>
          <span className="text-right">{displayAmountForRow(row) ?? "--"}</span>
          <span className="text-right font-semibold text-amber-300">{row.rate}</span>
          <span
            className="truncate pl-3 text-right text-xs text-slate-300"
            title={shouldShowAccountRequirement(row.id) ? normalizeAccountRequirement(row.accountType) : ""}
          >
            {shouldShowAccountRequirement(row.id) ? normalizeAccountRequirement(row.accountType) : ""}
          </span>
          <span
            className="truncate pl-3 text-right text-xs text-slate-300"
            title={`${row.collateral} / ${row.reason}`}
          >
            {row.collateral}
          </span>
          <span className="text-right text-xs tabular-nums text-slate-400">{row.updatedAt}</span>
          <span className="flex items-center justify-end gap-1">
            <button
              className="hidden whitespace-nowrap rounded-md border border-amber-500/40 bg-amber-500/15 px-1.5 py-0.5 text-micro font-medium text-amber-200"
              onClick={() => onEdit(row, groupName)}
              type="button"
            >
              修正
            </button>
            <button
              className={`inline-flex h-6 w-6 items-center justify-center rounded border transition ${
                rowPinned
                  ? "border-amber-400/60 bg-amber-400/20 text-amber-200"
                  : "border-[color:var(--tk-color-border-panel)] bg-white/5 text-slate-500 hover:text-amber-200"
              }`}
              onClick={() => onTogglePin(rowPin)}
              title={rowPinned ? "取消固定" : "固定行情"}
              type="button"
            >
              <Pin size={12} fill={rowPinned ? "currentColor" : "none"} />
            </button>
            <button
              className="tk-inline-action whitespace-nowrap rounded-md border border-blue-500/30 bg-blue-500/20 text-blue-300"
              onClick={() => openRowChat(row, groupName)}
              type="button"
            >
              发送
            </button>
          </span>
        </div>
        {expanded ? (
          <OpponentExpandPanel
            row={row}
            groupName={groupName}
            section={section}
            cards={cards}
            status={expandedStatus}
            onStatusChange={(status) => setExpandedStatus(rowPin.key, status)}
            pinnedKeys={pinnedKeys}
            onTogglePin={onTogglePin}
            onSend={(quote) => onSend(quote, groupName)}
          />
        ) : null}
        {detailMode && inlineVisibleCards.length ? (
          <OpponentExpandPanel
            row={row}
            groupName={groupName}
            section={section}
            cards={cards}
            status={supplementStatusFilter}
            onStatusChange={() => {}}
            pinnedKeys={pinnedKeys}
            onTogglePin={onTogglePin}
            onSend={(quote) => onSend(quote, groupName)}
            showColumnHeader={false}
          />
        ) : null}
      </div>
    );
  };

  return (
    <div className="flex min-h-0 flex-col">
      <div
        className={`min-h-0 ${
          detailMode ? "flex-1 overflow-y-auto" : "overflow-visible"
        }`}
      >
        {detailMode ? (
          <div className="grid grid-cols-[0.5fr_1.45fr_0.6fr_0.75fr_0.75fr_0.8fr_0.8fr_0.8fr_0.7fr_0.9fr] border-y border-[color:var(--tk-color-border-divider-dark)] bg-[var(--tk-color-surface-dark-soft)] px-4 py-1.5 text-mini font-medium tracking-[0.02em] text-slate-400">
            <span className="text-center">核心</span>
            <span>机构 / 发送人</span>
            <span className="text-right">期限</span>
            <span className="text-right">
              <QuoteSortHeaderButton
                label="金额"
                activeDirection={amountSortDirection}
                onToggle={() => toggleSort("amount", "desc")}
              />
            </span>
            <span className="text-right">
              <QuoteSortHeaderButton
                label="利率(报价)"
                activeDirection={rateSortDirection}
                onToggle={() => toggleSort("rate", defaultRateSortDirection)}
              />
            </span>
            <span className="text-right">账户要求</span>
            <span className="text-right">质押要求</span>
            <span className="text-right">回复状态</span>
            <span className="text-right">报价时间</span>
            <span className="text-right">操作</span>
          </div>
        ) : (
          <div className="grid grid-cols-[1.4fr_0.55fr_0.7fr_0.75fr_0.9fr_0.85fr_0.7fr_1.05fr] border-y border-[color:var(--tk-color-border-divider-dark)] bg-[var(--tk-color-surface-dark-soft)] px-4 py-1.5 text-mini font-medium tracking-[0.02em] text-slate-400">
            <span>分组 / 机构</span>
            <span className="text-right">期限</span>
            <span className="text-right">
              <QuoteSortHeaderButton
                label="金额"
                activeDirection={amountSortDirection}
                onToggle={() => toggleSort("amount", "desc")}
              />
            </span>
            <span className="text-right">
              <QuoteSortHeaderButton
                label="利率(报价)"
                activeDirection={rateSortDirection}
                onToggle={() => toggleSort("rate", defaultRateSortDirection)}
              />
            </span>
            <span className="text-right">账户要求</span>
            <span className="text-right">质押要求</span>
            <span className="text-right">获取时间</span>
            <span className="text-right">操作</span>
          </div>
        )}
        {pinnedSectionQuotes.length ? (
          <div className="border-b-2 border-[rgba(234,179,8,0.35)]">
            <div className="grid w-full grid-cols-[1.4fr_0.55fr_0.7fr_0.75fr_0.9fr_0.85fr_0.7fr_1.05fr] items-center border-l-[3px] border-amber-400 bg-[rgba(234,179,8,0.08)] px-4 py-2 text-left shadow-[inset_0_-1px_0_rgba(234,179,8,0.18)]">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/60 bg-amber-400/15 px-2 py-0.5 text-micro font-semibold tracking-[0.08em] text-amber-200">
                  固定
                </span>
                <div className="text-xs font-semibold text-slate-50">
                  固定报价
                </div>
              </div>
              <span aria-hidden="true" />
              <span aria-hidden="true" />
              <span aria-hidden="true" />
              <span aria-hidden="true" />
              <span aria-hidden="true" />
              <span className="text-right text-mini text-amber-200">
                {pinnedSectionQuotes.length} 条
              </span>
              <span />
            </div>
            <div className="divide-y divide-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-page)]">
              {pinnedSectionQuotes.map((item) =>
                renderDetailRow(
                  item.row,
                  item.groupName,
                  detailMode,
                  `pinned-${item.key}-`,
                ),
              )}
            </div>
          </div>
        ) : null}
        {detailMode ? (
          <div className="bg-[var(--tk-color-surface-page)]">
            {unifiedRows.map((item) => renderUnifiedTableRow(item))}
          </div>
        ) : (
          visibleGroups.map(({ group, rows }) => (
            <div key={group.id} className="border-b-2 border-[color:var(--tk-color-border-divider)]">
              <div className="divide-y divide-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-page)]">
                {sortDetailRows(rows).map((row) => renderDetailRow(row, group.name, false))}
              </div>
            </div>
          ))
        )}
        {!visibleGroups.length && !pinnedSectionQuotes.length ? (
          <div className="grid min-h-[160px] place-items-center border-b border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-page)] text-xs text-slate-500">
            暂无匹配报价
          </div>
        ) : null}
      </div>
    </div>
  );
}

function fuzzyTextMatch(text: string, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;
  const normalizedText = text.toLowerCase();
  if (normalizedText.includes(normalizedQuery)) return true;

  let textIndex = 0;
  for (const char of normalizedQuery) {
    textIndex = normalizedText.indexOf(char, textIndex);
    if (textIndex === -1) return false;
    textIndex += 1;
  }
  return true;
}

function shouldShowAccountRequirement(rowId: string) {
  let hash = 0;
  for (let i = 0; i < rowId.length; i++) {
    hash = (hash * 31 + rowId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 5 === 0;
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
  const tenorPriority = new Map(
    QUOTE_TENOR_OPTIONS.map((tenor, index) => [tenor, index]),
  );
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const ta = tenorPriority.get(a.row.tenor as (typeof QUOTE_TENOR_OPTIONS)[number]) ?? 999;
      const tb = tenorPriority.get(b.row.tenor as (typeof QUOTE_TENOR_OPTIONS)[number]) ?? 999;
      if (ta !== tb) return ta - tb;
      const ra = rankPriority[a.row.rank] ?? 99;
      const rb = rankPriority[b.row.rank] ?? 99;
      if (ra !== rb) return ra - rb;
      return a.index - b.index;
    })
    .map(({ row }) => row);
}

function quoteRateValue(row: QuoteDetailRow) {
  return Number.parseFloat(row.rate.replace("%", ""));
}

function quoteAmountValue(row: QuoteDetailRow) {
  return Number.parseFloat(row.amount.replace("亿", ""));
}

function formatAmountValue(value: number) {
  const normalized = Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(/\.?0+$/, "");
  return `${normalized}亿`;
}

function applyLogicalQuoteAmounts(rows: readonly QuoteDetailRow[]): QuoteDetailRow[] {
  const byTenor = new Map<string, QuoteDetailRow[]>();
  for (const row of rows) {
    const list = byTenor.get(row.tenor) ?? [];
    list.push(row);
    byTenor.set(row.tenor, list);
  }

  const adjusted = new Map<string, string>();
  for (const tenorRows of byTenor.values()) {
    const best = tenorRows.find((row) => row.rank === "最优");
    const second = tenorRows.find((row) => row.rank === "次优");
    if (!best || !second) continue;

    const bestAmount = quoteAmountValue(best);
    const secondAmount = quoteAmountValue(second);
    if (!Number.isFinite(bestAmount) || !Number.isFinite(secondAmount)) continue;
    if (bestAmount < secondAmount) continue;

    const nextBest = Math.max(0.5, Number((secondAmount - 0.5).toFixed(2)));
    const nextSecond = Number(Math.max(secondAmount, nextBest + 0.5).toFixed(2));
    adjusted.set(best.id, formatAmountValue(nextBest));
    adjusted.set(second.id, formatAmountValue(nextSecond));
  }

  return rows.map((row) =>
    adjusted.has(row.id) ? { ...row, amount: adjusted.get(row.id)! } : row,
  );
}

function applyLogicalQuoteRanks(
  rows: readonly QuoteDetailRow[],
  sectionId: RepoQuoteSection["id"],
): QuoteDetailRow[] {
  const byTenor = new Map<string, QuoteDetailRow[]>();
  for (const row of rows) {
    const list = byTenor.get(row.tenor) ?? [];
    list.push(row);
    byTenor.set(row.tenor, list);
  }

  const rankedIds = new Map<string, QuoteRank>();
  for (const tenorRows of byTenor.values()) {
    const sorted = [...tenorRows].sort((a, b) => {
      const aRate = quoteRateValue(a);
      const bRate = quoteRateValue(b);
      if (aRate !== bRate) {
        return sectionId === "forward" ? aRate - bRate : bRate - aRate;
      }
      return a.updatedAt.localeCompare(b.updatedAt);
    });
    sorted.forEach((row, index) => {
      rankedIds.set(row.id, index === 0 ? "最优" : index === 1 ? "次优" : "报价");
    });
  }

  return rows.map((row) => {
    const nextRank = rankedIds.get(row.id) ?? "报价";
    if (row.rank === nextRank) return row;
    return {
      ...row,
      rank: nextRank,
      reason:
        nextRank === "最优"
          ? `这是 ${row.tenor} 最优`
          : nextRank === "次优"
            ? `${row.tenor} 次优`
            : `${row.tenor} 一般报价`,
    };
  });
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

function selectLevel1RowsFromRows(
  groupName: string,
  rows: readonly QuoteDetailRow[],
): QuoteDetailRow[] {
  const rule = level1TenorRulesByGroup[groupName];
  const rankRows = rows.filter(
    (row) => row.rank === "最优" || row.rank === "次优",
  );
  if (!rule) return rankRows;
  const tenorIndex = new Map(rule.map((tenor, index) => [tenor, index]));
  return rankRows
    .filter((row) => tenorIndex.has(row.tenor))
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
      className={`inline-flex shrink-0 items-center rounded border px-1.5 py-0.5 text-micro font-medium ${styles}`}
    >
      {rank}
    </span>
  );
}

function RightSidebar() {
  const [overlayProduct, setOverlayProduct] = useState<OverlayProduct>("none");
  const [historyRange, setHistoryRange] = useState<HistoryRange>("5d");
  const [rightLowerTab, setRightLowerTab] = useState<RightLowerTab>("inst");
  const [compareProduct, setCompareProduct] = useState<CompareProduct>("none");
  const [baseProduct, setBaseProduct] = useState<BaseTrendProduct>("r001");

  return (
    <aside
      className="grid min-h-0 min-w-0 gap-3 overflow-hidden"
      style={{
        gridTemplateRows: "minmax(0, 10fr) minmax(0, 9fr) minmax(0, 11fr)",
      }}
    >
      <div className="min-h-0 overflow-hidden">
        <HistoryClosePanel
          activeRange={historyRange}
          baseProduct={baseProduct}
          overlayProduct={overlayProduct}
          compareProduct={compareProduct}
          onRangeChange={setHistoryRange}
          onBaseProductChange={setBaseProduct}
          onCompareChange={setCompareProduct}
        />
      </div>

      <div className="min-h-0 overflow-hidden">
        <IntradayPanel
          baseProduct={baseProduct}
          overlayProduct={overlayProduct}
          onBaseProductChange={setBaseProduct}
          onOverlayChange={setOverlayProduct}
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
    <section className="grid h-full min-h-0 grid-rows-[auto_1fr] overflow-hidden rounded-xl border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]">
      <div className="flex items-center gap-2 border-b border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-soft)] px-3 py-2">
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
  baseProduct,
  overlayProduct,
  onBaseProductChange,
  onOverlayChange,
}: {
  baseProduct: BaseTrendProduct;
  overlayProduct: OverlayProduct;
  onBaseProductChange: (product: BaseTrendProduct) => void;
  onOverlayChange: (product: OverlayProduct) => void;
}) {
  const productLabel = trendProductLabel(baseProduct);
  const mainSeries = getIntradayRateSeries(baseProduct);
  const yesterdaySeries = mainSeries.map((value, index) =>
    Number((value - 0.012 + Math.sin(index * 0.63) * 0.006).toFixed(3)),
  );
  const overlaySeries =
    overlayProduct === "none"
      ? null
      : buildOverlaySeries(mainSeries, overlayProduct);
  const barValues = overlaySeries
    ? mainSeries.map((value, index) =>
        Number(((value - overlaySeries[index]) * 100).toFixed(1)),
      )
    : null;
  const pad = 0.01;
  const min = Math.min(...mainSeries, ...yesterdaySeries, ...(overlaySeries ?? [])) - pad;
  const max = Math.max(...mainSeries, ...yesterdaySeries, ...(overlaySeries ?? [])) + pad;
  const mainPath = buildLinePath(mainSeries, 680, 178, min, max);
  const yesterdayPath = buildLinePath(yesterdaySeries, 680, 178, min, max);
  const areaPath = buildAreaPath(mainSeries, 680, 178, min, max);
  const overlayPath = overlaySeries
    ? buildLinePath(overlaySeries, 680, 178, min, max)
    : null;
  const { tooltipState, containerRef, handleMouseMove, handleMouseLeave } =
    useChartTooltip(mainSeries.length);
  const ti = tooltipState?.index ?? null;

  return (
    <section className="grid h-full min-h-0 grid-rows-[auto_1fr] overflow-hidden rounded-xl border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-soft)] px-3 py-2">
        <div className="tk-matrix-card-title shrink-0 whitespace-nowrap">
          匿名成交走势图
        </div>
        <label className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs text-slate-400">
          <span>产品</span>
          <select
            className="rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-page)] px-1.5 py-0.5 text-xs text-slate-200 outline-none"
            value={baseProduct}
            onChange={(event) => onBaseProductChange(event.target.value as BaseTrendProduct)}
          >
            {baseTrendProductOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="shrink-0">
          <OverlayProductSelect
            value={overlayProduct}
            onChange={onOverlayChange}
          />
        </div>
      </div>
      <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_1.25rem] px-3 pb-2 pt-2">
        <div className="grid min-h-0 grid-cols-[3rem_1fr]">
            <div className="flex flex-col justify-between pb-6 pr-2 text-right text-micro text-slate-400">
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
                className="absolute inset-x-0 border-t border-dashed border-[color:var(--tk-color-border-divider)]"
                style={{ top: `${(index / 3) * 100}%` }}
              />
            ))}
            <div className="absolute inset-x-0 top-[58%] border-t border-dashed border-[color:var(--tk-color-warning)]" />
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
                <path
                  d={yesterdayPath}
                  fill="none"
                  stroke={chartPalette.violet}
                  strokeWidth="2"
                  strokeDasharray="7 5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeOpacity="0.9"
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
                    x1={(ti / (mainSeries.length - 1)) * 680}
                    x2={(ti / (mainSeries.length - 1)) * 680}
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
                  <span className="text-slate-400">{productLabel}</span>
                  <span className="ml-1 font-semibold text-slate-100">
                    {mainSeries[ti].toFixed(3)}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="h-1.5 w-3"
                    style={{
                      borderTop: `2px dashed ${chartPalette.violet}`,
                    }}
                  />
                  <span className="text-slate-400">昨日{productLabel}</span>
                  <span className="ml-1 font-semibold text-slate-100">
                    {yesterdaySeries[ti].toFixed(3)}%
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
                  <div className="mt-1 border-t border-[color:var(--tk-color-border-divider)] pt-1 text-slate-400">
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
            <div className="absolute right-2 top-1 flex flex-wrap items-center gap-3 text-micro text-slate-300">
              <LegendDot color={chartPalette.blue} label={`今日${productLabel}`} />
              <LegendDot color={chartPalette.violet} label={`昨日${productLabel}`} />
              {overlaySeries ? (
                <LegendDot
                  color={chartPalette.amber}
                  label={overlayProductLabel(overlayProduct)}
                />
              ) : null}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-[3rem_1fr] pt-1">
          <div />
          <div className="grid grid-cols-8 text-micro text-slate-400">
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
  baseProduct,
  overlayProduct,
  compareProduct,
  onRangeChange,
  onBaseProductChange,
  onCompareChange,
}: {
  activeRange: HistoryRange;
  baseProduct: BaseTrendProduct;
  overlayProduct: OverlayProduct;
  compareProduct: CompareProduct;
  onRangeChange: (range: HistoryRange) => void;
  onBaseProductChange: (product: BaseTrendProduct) => void;
  onCompareChange: (product: CompareProduct) => void;
}) {
  const dataset = historicalCloseDatasets[activeRange];
  const productLabel = trendProductLabel(baseProduct);
  const baseRateSeries =
    baseProduct === "r001"
      ? dataset.close
      : buildHistoricalSeries(activeRange, "r007");
  const baseVolumeSeries =
    baseProduct === "r001"
      ? dataset.volume
      : dataset.volume.map((value, index) =>
          Math.round(value * (0.84 + ((index % 4) * 0.045))),
        );
  const mainSeries = baseRateSeries;
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
    ? baseRateSeries.map((value, index) =>
        Number(((value - compareSeries[index]) * 100).toFixed(1)),
      )
    : null;
  const pad = 0.015;
  const min =
    Math.min(
      ...mainSeries,
      ...(overlaySeries ?? []),
      ...(compareSeries ?? []),
    ) - pad;
  const max =
    Math.max(
      ...mainSeries,
      ...(overlaySeries ?? []),
      ...(compareSeries ?? []),
    ) + pad;
  const volumeMax = Math.max(...baseVolumeSeries);
  const mainPath = buildLinePath(mainSeries, 720, 186, min, max);
  const areaPath = buildAreaPath(mainSeries, 720, 186, min, max);
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
    <section className="grid h-full min-h-0 grid-rows-[auto_1fr] overflow-hidden rounded-xl border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-soft)] px-3 py-2">
        <div className="tk-matrix-card-title shrink-0 whitespace-nowrap">
          历史成交趋势
        </div>
        <label className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs text-slate-400">
          <span>产品</span>
          <select
            className="rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-page)] px-1.5 py-0.5 text-xs text-slate-200 outline-none"
            value={baseProduct}
            onChange={(e) =>
              onBaseProductChange(e.target.value as BaseTrendProduct)
            }
          >
            {baseTrendProductOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs text-slate-400">
          <span>对比</span>
          <select
            className="rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-page)] px-1.5 py-0.5 text-xs text-slate-200 outline-none"
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
        <div className="flex shrink-0 items-center gap-2">
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
          gridTemplateRows: "minmax(0,68fr) minmax(0,24fr) 1.35rem",
        }}
      >
        <div className="grid min-h-0 grid-cols-[3.25rem_1fr]">
          <div className="flex flex-col justify-between pr-2 text-right text-micro text-slate-400">
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
                className="absolute inset-x-0 border-t border-dashed border-[color:var(--tk-color-border-divider)]"
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
                  x1={(ti / (mainSeries.length - 1)) * 720}
                  x2={(ti / (mainSeries.length - 1)) * 720}
                  y1={0}
                  y2={186}
                  stroke="#5ea3ff"
                  strokeWidth="1"
                  strokeDasharray="4 3"
                  strokeOpacity="0.6"
                />
              ) : null}
            </svg>
            <div className="absolute right-2 top-1 flex flex-wrap items-center gap-3 text-micro text-slate-300">
              <LegendDot color={chartPalette.blue} label={`${productLabel} 加权利率`} />
              {overlaySeries ? (
                <LegendDot
                  color={chartPalette.amber}
                  label={overlayProductLabel(overlayProduct)}
                />
              ) : null}
              {compareSeries ? (
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
                  <span className="text-slate-400">{productLabel}</span>
                  <span className="ml-1 font-semibold text-slate-100">
                    {mainSeries[ti].toFixed(4)}%
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
                  <div className="mt-1 border-t border-[color:var(--tk-color-border-divider)] pt-1 text-slate-400">
                    利差{" "}
                    <span
                      className={`font-semibold ${spreadValues[ti] >= 0 ? "text-red-400" : "text-emerald-400"}`}
                    >
                      {spreadValues[ti] > 0 ? "+" : ""}
                      {spreadValues[ti]}bp
                    </span>
                  </div>
                )}
                <div className="mt-1 border-t border-[color:var(--tk-color-border-divider)] pt-1 text-slate-400">
                  成交量{" "}
                  <span className="font-semibold text-slate-100">
                    {baseVolumeSeries[ti]}亿
                  </span>
                </div>
              </ChartTooltip>
            )}
          </div>
        </div>
        {compareProduct !== "none" && spreadValues ? (
          <div className="grid min-h-0 grid-cols-[3.25rem_1fr] border-t border-[color:var(--tk-color-border-divider)] pt-2 pb-1">
            <div className="flex flex-col justify-between pr-2 text-right text-micro text-slate-400">
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
              <div className="absolute inset-0 flex items-center gap-[4px]">
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
          <div className="grid min-h-0 grid-cols-[3.25rem_1fr] border-t border-[color:var(--tk-color-border-divider)] pt-2 pb-1">
            <div className="flex flex-col justify-between pr-2 text-right text-micro text-slate-400">
              {buildCompactVolumeTicks(volumeMax).map((tick) => (
                <div key={tick}>{tick}</div>
              ))}
            </div>
            <div className="relative min-h-0">
              <span className="absolute top-0.5 left-0.5 text-micro text-slate-500 z-10 pointer-events-none">
                成交量
              </span>
              <div className="absolute inset-0 flex items-end gap-[4px]">
                {baseVolumeSeries.map((value, index) => (
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
            className="grid text-micro text-slate-400"
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
type CfetsInstPeriod =
  | "R001"
  | "R007"
  | "R014"
  | "R021"
  | "R1M"
  | "R2M"
  | "R3M"
  | "R4M"
  | "R6M"
  | "R9M"
  | "R1Y";
const cfetsInstPeriodLabels: CfetsInstPeriod[] = [
  "R001",
  "R007",
  "R014",
  "R021",
  "R1M",
  "R2M",
  "R3M",
  "R4M",
  "R6M",
  "R9M",
  "R1Y",
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
  unit: string;
  axisLabel: string;
}[] = [
  {
    key: "buyRate",
    label: "正回购利率",
    desc: "",
    chartType: "line",
    unit: "%",
    axisLabel: "利率(%)",
  },
  {
    key: "sellRate",
    label: "逆回购利率",
    desc: "以债券质押融出资金的加权利率，利率越高说明融出资金收益越高",
    chartType: "line",
    unit: "%",
    axisLabel: "利率(%)",
  },
  {
    key: "buyAmt",
    label: "正回购金额",
    desc: "各机构今天质押式融入资金规模，反映融资需求强度",
    chartType: "stackedBar",
    unit: "亿",
    axisLabel: "金额(亿元)",
  },
  {
    key: "sellAmt",
    label: "逆回购金额",
    desc: "各机构今天质押式融出资金规模，反映市场流动性供给",
    chartType: "stackedBar",
    unit: "亿",
    axisLabel: "金额(亿元)",
  },
  {
    key: "netInflow",
    label: "机构资金结构",
    desc: "各机构质押式回购融入融出结构，堆叠柱展示每日各机构分布",
    chartType: "divergeBar",
    unit: "亿",
    axisLabel: "金额(亿元)",
  },
  {
    key: "netInflowAmt",
    label: "净融入金额",
    desc: "各机构当日净融入资金（正回购金额 − 逆回购金额）",
    chartType: "stackedBar",
    unit: "百万",
    axisLabel: "金额(百万元)",
  },
  {
    key: "buyBalance",
    label: "正回购余额",
    desc: "各机构未到期正回购融入存量余额",
    chartType: "stackedBar",
    unit: "百万",
    axisLabel: "金额(百万元)",
  },
  {
    key: "sellBalance",
    label: "逆回购余额",
    desc: "各机构未到期逆回购融出存量余额",
    chartType: "stackedBar",
    unit: "百万",
    axisLabel: "金额(百万元)",
  },
];

type CfetsInstMetricMode =
  | "weightedRate"
  | "turnover"
  | "balance"
  | "crossMonth"
  | "netInflow";
type CfetsRepoDirection = "repo" | "reverse";
type CfetsChartKind = "line" | "bar";
type CfetsDimension = "period" | "institution";

const cfetsDenseMetricOptions: Array<{
  key: CfetsInstMetricMode;
  label: string;
}> = [
  { key: "weightedRate", label: "加权利率" },
  { key: "turnover", label: "交易额" },
  { key: "balance", label: "回购余额" },
  { key: "crossMonth", label: "跨月金额" },
  { key: "netInflow", label: "净融入金额" },
];

const cfetsPeriodColors: Record<CfetsInstPeriod, string> = {
  R001: "#637cd8",
  R007: "#8cca72",
  R014: "#f3c65f",
  R021: "#e85c67",
  R1M: "#6fb6d0",
  R2M: "#3fa36d",
  R3M: "#ff8354",
  R4M: "#8e55b0",
  R6M: "#da62b2",
  R9M: "#4f68c5",
  R1Y: "#7fbd64",
};

const cfetsInstitutionOptions = [
  { label: "大型银行", sourceIndex: 0, factor: 0.95, color: "#637cd8" },
  { label: "大型商业/政策性银行", sourceIndex: 0, factor: 0.72, color: "#4f6cc4" },
  { label: "股份制商业银行", sourceIndex: 1, factor: 0.92, color: "#8cca72" },
  { label: "中小型银行", sourceIndex: 1, factor: 0.66, color: "#6fbf89" },
  { label: "城市商业银行", sourceIndex: 1, factor: 0.54, color: "#57b4b5" },
  { label: "农村金融机构", sourceIndex: 1, factor: 0.42, color: "#4aa3a1" },
  { label: "证券公司", sourceIndex: 4, factor: 0.9, color: "#e85c67" },
  { label: "保险公司", sourceIndex: 6, factor: 0.9, color: "#f3a85d" },
  { label: "基金公司及产品", sourceIndex: 5, factor: 0.86, color: "#6fb6d0" },
  { label: "货币市场基金", sourceIndex: 5, factor: 0.62, color: "#74b6e6" },
  { label: "理财子公司及理财类产品", sourceIndex: 3, factor: 0.94, color: "#8e55b0" },
  { label: "其他产品类", sourceIndex: 2, factor: 0.48, color: "#da62b2" },
  { label: "其他", sourceIndex: 2, factor: 0.36, color: "#a1a1aa" },
] as const;
const cfetsDefaultInstitutionIndexes = [0, 2, 6, 7, 8, 10, 12] as const;

const INST_ONLY_METRIC_KEYS = new Set<CfetsMetricKey>([
  "netInflow",
  "netInflowAmt",
  "buyBalance",
  "sellBalance",
]);
const cfetsBondMetricDefs = cfetsMetricDefs.filter(
  (d) => !INST_ONLY_METRIC_KEYS.has(d.key),
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
type CfetsInstAnchorBase = Record<
  Exclude<CfetsMetricKey, "netInflowAmt" | "buyBalance" | "sellBalance">,
  number[]
>;
const cfetsInstAnchorsBase: Record<CfetsInstPeriod, CfetsInstAnchorBase> = {
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
  R2M: {
    buyRate: [1.345, 1.371, 1.432, 1.432, 1.425, 1.536, 1.419],
    sellRate: [
      1.384,
      1.383,
      1.596,
      1.596,
      null as unknown as number,
      null as unknown as number,
      1.431,
    ],
    buyAmt: [3.5, 5, 0.7, 0.7, 0.3, 0, 1.4],
    sellAmt: [2.8, 0.7, 0.07, 0.07, 0, 0, 0.14],
    netInflow: [-0.7, 0.14, 0.35, 0.35, 0.07, 0.03, 0.35],
  },
  R3M: {
    buyRate: [1.375, 1.401, 1.462, 1.462, 1.455, 1.566, 1.449],
    sellRate: [
      1.414,
      1.413,
      1.626,
      1.626,
      null as unknown as number,
      null as unknown as number,
      1.461,
    ],
    buyAmt: [2.5, 3.5, 0.5, 0.5, 0.2, 0, 1],
    sellAmt: [2, 0.5, 0.05, 0.05, 0, 0, 0.1],
    netInflow: [-0.5, 0.1, 0.25, 0.25, 0.05, 0.02, 0.25],
  },
  R4M: {
    buyRate: [1.405, 1.431, 1.492, 1.492, 1.485, 1.596, 1.479],
    sellRate: [
      1.444,
      1.443,
      1.656,
      1.656,
      null as unknown as number,
      null as unknown as number,
      1.491,
    ],
    buyAmt: [1.8, 2.5, 0.35, 0.35, 0.15, 0, 0.7],
    sellAmt: [1.4, 0.35, 0.03, 0.03, 0, 0, 0.07],
    netInflow: [-0.35, 0.07, 0.18, 0.18, 0.04, 0.01, 0.18],
  },
  R6M: {
    buyRate: [1.455, 1.481, 1.542, 1.542, 1.535, 1.646, 1.529],
    sellRate: [
      1.494,
      1.493,
      1.706,
      1.706,
      null as unknown as number,
      null as unknown as number,
      1.541,
    ],
    buyAmt: [1.2, 1.8, 0.25, 0.25, 0.1, 0, 0.5],
    sellAmt: [1, 0.25, 0.02, 0.02, 0, 0, 0.05],
    netInflow: [-0.25, 0.05, 0.12, 0.12, 0.025, 0.01, 0.12],
  },
  R9M: {
    buyRate: [1.505, 1.531, 1.592, 1.592, 1.585, 1.696, 1.579],
    sellRate: [
      1.544,
      1.543,
      1.756,
      1.756,
      null as unknown as number,
      null as unknown as number,
      1.591,
    ],
    buyAmt: [0.8, 1.2, 0.18, 0.18, 0.07, 0, 0.35],
    sellAmt: [0.7, 0.18, 0.015, 0.015, 0, 0, 0.03],
    netInflow: [-0.18, 0.03, 0.09, 0.09, 0.02, 0.005, 0.09],
  },
  R1Y: {
    buyRate: [1.555, 1.581, 1.642, 1.642, 1.635, 1.746, 1.629],
    sellRate: [
      1.594,
      1.593,
      1.806,
      1.806,
      null as unknown as number,
      null as unknown as number,
      1.641,
    ],
    buyAmt: [0.5, 0.8, 0.12, 0.12, 0.05, 0, 0.22],
    sellAmt: [0.4, 0.12, 0.01, 0.01, 0, 0, 0.02],
    netInflow: [-0.12, 0.02, 0.06, 0.06, 0.015, 0.003, 0.06],
  },
};

// 在 base 上派生 3 个 inst-only 指标：净融入金额 / 正回购余额 / 逆回购余额（单位百万）
const cfetsInstAnchors: Record<
  CfetsInstPeriod,
  Record<CfetsMetricKey, number[]>
> = Object.fromEntries(
  Object.entries(cfetsInstAnchorsBase).map(([period, m]) => [
    period,
    {
      ...m,
      netInflowAmt: m.sellAmt.map(
        (s, i) => Math.round((s - m.buyAmt[i]) * 10) / 10,
      ),
      buyBalance: m.buyAmt.map((v) => Math.round(v * 6 * 10) / 10),
      sellBalance: m.sellAmt.map((v) => Math.round(v * 6 * 10) / 10),
    },
  ]),
) as Record<CfetsInstPeriod, Record<CfetsMetricKey, number[]>>;

function buildInstTrendBlock(
  period: CfetsInstPeriod,
  metricKey: CfetsMetricKey,
  range: FundStructureRange,
): CfetsTrendBlock {
  const count = cfetsTrendCounts[range];
  const dates = generateTradingDates(TODAY_STR, count);
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
          "netInflowAmt",
          "buyBalance",
          "sellBalance",
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
  Record<CfetsBondMetricKey, number[]>
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
  metricKey: CfetsBondMetricKey,
  range: FundStructureRange,
): CfetsTrendBlock {
  const count = cfetsTrendCounts[range];
  const dates = generateTradingDates(TODAY_STR, count);
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
  Record<CfetsBondMetricKey, Record<FundStructureRange, CfetsTrendBlock>>
> = Object.fromEntries(
  (["利率债", "信用债", "同业存单"] as CfetsBondKey[]).map((bk) => [
    bk,
    Object.fromEntries(
      (
        ["buyRate", "sellRate", "buyAmt", "sellAmt"] as CfetsBondMetricKey[]
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
  Record<CfetsBondMetricKey, Record<FundStructureRange, CfetsTrendBlock>>
>;

function CfetsDailyPanel() {
  return (
    <div className="h-full min-h-0 overflow-hidden">
      <div className="overflow-hidden rounded-lg border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]">
        <table className="min-w-full text-xs">
          <thead className="bg-[var(--tk-color-surface-dark-soft)] text-slate-400">
            <tr>
              {["日期", "公开市场操作", "净投放"].map((column) => (
                <th key={column} className="px-3 py-2 text-left font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ["2026-05-08", "逆回购 7D", "+40亿"],
              ["2026-05-07", "逆回购到期", "-10亿"],
              ["2026-05-06", "逆回购 7D", "+5亿"],
              ["2026-05-05", "逆回购 7D", "+1985亿"],
            ].map((row) => (
              <tr
                key={row[0]}
                className="border-t border-[color:var(--tk-color-border-divider)] text-slate-300"
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
                <th className="px-2 py-1.5 text-left text-micro font-medium text-slate-500">
                  逆\正
                </th>
                {cfetsMatrixColLabels.map((col) => (
                  <th
                    key={col}
                    className="px-2 py-1.5 text-center text-micro font-medium text-slate-400"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cfetsMatrixRowLabels.map((row, ri) => (
                <tr key={row}>
                  <td className="py-1.5 pr-3 text-mini font-medium text-slate-300">
                    {row}
                  </td>
                  {cfetsMatrixColLabels.map((col, ci) => {
                    const rate = cfetsMatrixRates[ri][ci];
                    return (
                      <td key={col} className="px-1 py-1">
                        {rate === null ? (
                          <div className="flex h-8 w-full items-center justify-center rounded text-micro text-slate-600 bg-[var(--tk-color-surface-dark-deep)]">
                            —
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="flex h-8 w-full cursor-pointer items-center justify-center rounded text-mini font-semibold text-white transition-opacity hover:opacity-80"
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
        <div className="flex items-center gap-2 text-micro text-slate-500">
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
            className="w-80 rounded-xl border border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-dark-deep)] p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-200">
                  {modal.rowLabel} → {modal.colLabel}
                </div>
                <div className="mt-0.5 text-micro text-slate-500">
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
            <div className="mb-3 rounded-lg bg-[var(--tk-color-surface-dark-soft)] px-3 py-2 text-center">
              <span className="text-xl font-semibold text-amber-300">
                {modal.rate.toFixed(4)}%
              </span>
            </div>
            <div className="text-micro text-slate-500">
              正回购方（{modal.colLabel}）期限明细：
            </div>
            <table className="mt-1.5 w-full text-mini">
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
                      className="border-t border-[color:var(--tk-color-border-divider)] text-slate-300"
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
          <div className="overflow-hidden rounded-lg border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]">
            <table className="min-w-full text-xs">
              <thead className="bg-[var(--tk-color-surface-dark-soft)] text-slate-400">
                <tr>
                  {["日期", "公开市场操作", "净投放"].map((column) => (
                    <th
                      key={column}
                      className="px-3 py-2 text-left font-medium"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["2026-05-08", "逆回购 7D", "+40亿"],
                  ["2026-05-07", "逆回购到期", "-10亿"],
                  ["2026-05-06", "逆回购 7D", "+5亿"],
                  ["2026-05-05", "逆回购 7D", "+1985亿"],
                ].map((row) => (
                  <tr
                    key={row[0]}
                    className="border-t border-[color:var(--tk-color-border-divider)] text-slate-300"
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
  unit = "",
  axisLabel,
  hiddenSeries,
}: {
  block: CfetsTrendBlock;
  chartType: "line" | "stackedBar" | "divergeBar";
  unit?: string;
  axisLabel?: string;
  hiddenSeries?: ReadonlySet<number>;
}) {
  const { dates, series } = block;
  const isHidden = (si: number) => hiddenSeries?.has(si) ?? false;
  const axisCaption = axisLabel ?? (unit ? `单位：${unit}` : "");
  const { tooltipState, containerRef, handleMouseMove, handleMouseLeave } =
    useChartTooltip(dates.length);
  const VW = 480;
  const VH = 100;
  const xStep = Math.max(1, Math.ceil(dates.length / 6));
  const xLabels = dates.filter(
    (_, i) => i % xStep === 0 || i === dates.length - 1,
  );

  if (chartType === "line") {
    const visibleFlat = series
      .filter((_, si) => !isHidden(si))
      .flat()
      .filter((v) => v > 0);
    const rawMin = visibleFlat.length ? Math.min(...visibleFlat) : 0;
    const rawMax = visibleFlat.length ? Math.max(...visibleFlat) : 1;
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
          <div className="flex flex-col justify-between py-1 pr-1 text-right text-micro text-slate-500">
            {yTicks.map((t) => (
              <div key={t}>{t}</div>
            ))}
          </div>
          <div
            ref={containerRef}
            className="relative min-h-0 cursor-crosshair overflow-hidden rounded border border-dashed border-[color:var(--tk-color-border-panel)]"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {axisCaption && (
              <div className="pointer-events-none absolute right-1.5 top-0.5 z-10 text-micro text-slate-500">
                {axisCaption}
              </div>
            )}
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
                !isHidden(si) && Math.min(...vals) > 0 ? (
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
                !isHidden(si) && Math.min(...vals) > 0 ? (
                  <div
                    key={si}
                    className="pointer-events-none absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[color:var(--tk-color-surface-page)]"
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
          <div className="relative h-6 pt-1">
            {xLabels.map((label) => (
              <span
                key={label}
                className="absolute -translate-x-1/2 text-micro text-slate-600"
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
            <div className="mb-1 text-mini font-semibold text-slate-300">
              {dates[tooltipState.index]}
            </div>
            {series.map((vals, si) =>
              !isHidden(si) && vals[0] > 0 ? (
                <div
                  key={si}
                  className="flex items-center gap-2 py-0.5 text-mini"
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
                    {unit}
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
      series.reduce(
        (s, vals, si) => s + (isHidden(si) ? 0 : (vals[di] ?? 0)),
        0,
      ),
    );
    const maxTotal = Math.max(...dailyTotals, 1);
    const yTicks = Array.from({ length: 3 }, (_, i) =>
      Math.round((maxTotal * (3 - i)) / 3),
    );
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-1">
        <div className="grid min-h-0 flex-1 grid-cols-[2.8rem_1fr]">
          <div className="flex flex-col justify-between py-1 pr-1 text-right text-micro text-slate-500">
            {[...yTicks, 0].map((t) => (
              <div key={t}>{t}</div>
            ))}
          </div>
          <div
            ref={containerRef}
            className="relative min-h-0 cursor-crosshair overflow-hidden rounded border border-dashed border-[color:var(--tk-color-border-panel)]"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {axisCaption && (
              <div className="pointer-events-none absolute right-1.5 top-0.5 z-10 text-micro text-slate-500">
                {axisCaption}
              </div>
            )}
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="absolute inset-x-0 border-t border-dashed border-[color:var(--tk-color-border-divider)]"
                style={{ top: `${(i / 3) * 100}%` }}
              />
            ))}
            <div className="absolute inset-x-1 bottom-4 top-1.5 flex items-end gap-[2px]">
              {dates.map((_, di) => {
                const total = dailyTotals[di];
                return (
                  <div
                    key={di}
                    className="flex min-w-0 flex-1 flex-col justify-end overflow-hidden rounded-t-[2px]"
                    style={{ height: `${(total / maxTotal) * 100}%` }}
                  >
                    {series.map((vals, si) => {
                      if (isHidden(si)) return null;
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
                className="pointer-events-none absolute inset-y-0 w-px bg-[var(--tk-color-brand-primary)]"
                style={{
                  left: `${(tooltipState.index / (dates.length - 1)) * 100}%`,
                }}
              />
            )}
          </div>
        </div>
        <div className="grid grid-cols-[2.8rem_1fr]">
          <div />
          <div className="relative h-6 pt-1">
            {xLabels.map((label) => (
              <span
                key={label}
                className="absolute -translate-x-1/2 text-micro text-slate-600"
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
            <div className="mb-1 text-mini font-semibold text-slate-300">
              {dates[tooltipState.index]}
            </div>
            {series.map((vals, si) =>
              !isHidden(si) && vals[tooltipState.index] > 0 ? (
                <div
                  key={si}
                  className="flex items-center gap-2 py-0.5 text-mini"
                >
                  <span
                    className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: instColors[si] }}
                  />
                  <span className="text-slate-400">
                    {fundStructureLegendItems[si].label}
                  </span>
                  <span className="ml-auto pl-3 font-semibold text-slate-200">
                    {vals[tooltipState.index].toFixed(0)}
                    {unit}
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
        <div className="flex flex-col justify-between py-1 pr-1 text-right text-micro text-slate-500">
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
          className="relative min-h-0 cursor-crosshair overflow-hidden rounded border border-dashed border-[color:var(--tk-color-border-panel)]"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {axisCaption && (
            <div className="pointer-events-none absolute right-1.5 top-0.5 z-10 text-micro text-slate-500">
              {axisCaption}
            </div>
          )}
          <div className="absolute inset-x-0 top-1/2 border-t border-[color:var(--tk-color-border-divider)]" />
          <div className="absolute inset-x-1 bottom-4 top-1.5 flex items-center gap-[2px]">
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
              className="pointer-events-none absolute inset-y-0 w-px bg-[var(--tk-color-brand-primary)]"
              style={{
                left: `${(tooltipState.index / (dates.length - 1)) * 100}%`,
              }}
            />
          )}
        </div>
      </div>
      <div className="grid grid-cols-[2.8rem_1fr]">
        <div />
        <div className="relative h-6 pt-1">
          {xLabels.map((label) => (
            <span
              key={label}
              className="absolute -translate-x-1/2 text-micro text-slate-600"
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
          <div className="mb-1 text-mini font-semibold text-slate-300">
            {dates[tooltipState.index]}
          </div>
          <div className="text-mini text-slate-400">
            净融入{" "}
            <span
              className={`font-semibold ${netVals[tooltipState.index] >= 0 ? "text-red-400" : "text-emerald-400"}`}
            >
              {netVals[tooltipState.index] >= 0 ? "+" : ""}
              {netVals[tooltipState.index].toFixed(0)}
              {unit}
            </span>
          </div>
        </ChartTooltip>
      )}
    </div>
  );
}

function cfetsModeFromMetricKey(metricKey: CfetsMetricKey): CfetsInstMetricMode {
  if (metricKey === "buyRate" || metricKey === "sellRate") return "weightedRate";
  if (metricKey === "buyAmt" || metricKey === "sellAmt") return "turnover";
  if (metricKey === "buyBalance" || metricKey === "sellBalance") return "balance";
  if (metricKey === "netInflowAmt" || metricKey === "netInflow") return "netInflow";
  return "balance";
}

function cfetsMetricKeyForMode(
  metricMode: CfetsInstMetricMode,
  direction: CfetsRepoDirection,
): CfetsMetricKey {
  if (metricMode === "weightedRate") {
    return direction === "repo" ? "buyRate" : "sellRate";
  }
  if (metricMode === "turnover") {
    return direction === "repo" ? "buyAmt" : "sellAmt";
  }
  if (metricMode === "balance") {
    return direction === "repo" ? "buyBalance" : "sellBalance";
  }
  if (metricMode === "crossMonth") {
    return direction === "repo" ? "buyAmt" : "sellAmt";
  }
  return "netInflowAmt";
}

function cfetsMetricDisplayLabel(metricMode: CfetsInstMetricMode) {
  return cfetsDenseMetricOptions.find((item) => item.key === metricMode)?.label ?? "回购余额";
}

function cfetsMetricUnit(metricMode: CfetsInstMetricMode) {
  return metricMode === "weightedRate" ? "%" : "亿";
}

function cfetsMetricIsRate(metricMode: CfetsInstMetricMode) {
  return metricMode === "weightedRate";
}

function cfetsDefaultChartKindForMetricMode(metricMode: CfetsInstMetricMode): CfetsChartKind {
  return cfetsMetricIsRate(metricMode) ? "line" : "bar";
}

function cfetsValueScale(metricMode: CfetsInstMetricMode) {
  return metricMode === "weightedRate" ? 1 : 0.01;
}

function cfetsCrossMonthFactor(period: CfetsInstPeriod) {
  return period.includes("M") || period === "R1Y" ? 1 : 0.08;
}

function formatCfetsDenseValue(value: number, metricMode: CfetsInstMetricMode) {
  if (metricMode === "weightedRate") return `${value.toFixed(3)}%`;
  if (Math.abs(value) >= 1000) return `${Math.round(value).toLocaleString()}亿`;
  return `${value.toFixed(value >= 100 ? 0 : 1)}亿`;
}

function formatCfetsAxisTick(value: number, metricMode: CfetsInstMetricMode) {
  if (metricMode === "weightedRate") return `${value.toFixed(2)}%`;
  const abs = Math.abs(value);
  if (abs >= 10000) return `${(value / 10000).toFixed(1)}万亿`;
  if (abs >= 1000) return `${Math.round(value).toLocaleString()}亿`;
  return `${value.toFixed(value >= 100 ? 0 : 1)}亿`;
}

function toggleArrayValue<T extends string>(items: readonly T[], value: T) {
  return items.includes(value)
    ? items.filter((item) => item !== value)
    : [...items, value];
}

function buildCfetsDenseSeries({
  metricMode,
  direction,
  dimension,
  selectedPeriods,
  selectedInstitutions,
}: {
  metricMode: CfetsInstMetricMode;
  direction: CfetsRepoDirection;
  dimension: CfetsDimension;
  selectedPeriods: readonly CfetsInstPeriod[];
  selectedInstitutions: readonly number[];
}) {
  const metricKey = cfetsMetricKeyForMode(metricMode, direction);
  const dates = cfetsInstTrend.R001[metricKey]["6m"].dates;
  const isRate = cfetsMetricIsRate(metricMode);
  const valueScale = cfetsValueScale(metricMode);

  const institutionOptions = selectedInstitutions.length
    ? selectedInstitutions.map((index) => cfetsInstitutionOptions[index])
    : [...cfetsInstitutionOptions];
  const periods = selectedPeriods.length ? [...selectedPeriods] : [...cfetsInstPeriodLabels];

  function institutionSeries(period: CfetsInstPeriod, institutionIndex: number) {
    const option = cfetsInstitutionOptions[institutionIndex];
    const raw = cfetsInstTrend[period][metricKey]["6m"].series[option.sourceIndex] ?? [];
    const crossMonthFactor = metricMode === "crossMonth" ? cfetsCrossMonthFactor(period) : 1;
    return raw.map((value) => Math.max(0, value * option.factor * crossMonthFactor * valueScale));
  }

  function combineSeries(seriesList: number[][]) {
    return dates.map((_, index) => {
      const values = seriesList.map((series) => series[index] ?? 0);
      if (isRate) {
        const nonZero = values.filter((value) => value > 0);
        return nonZero.length
          ? nonZero.reduce((sum, value) => sum + value, 0) / nonZero.length
          : 0;
      }
      return values.reduce((sum, value) => sum + value, 0);
    });
  }

  if (dimension === "period") {
    return {
      dates,
      series: periods.map((period) => ({
        key: period,
        label: period,
        color: cfetsPeriodColors[period],
        values: combineSeries(
          institutionOptions.map((option) =>
            institutionSeries(period, cfetsInstitutionOptions.indexOf(option)),
          ),
        ),
      })),
    };
  }

  return {
    dates,
    series: institutionOptions.map((option) => {
      const optionIndex = cfetsInstitutionOptions.indexOf(option);
      return {
        key: option.label,
        label: option.label,
        color: option.color,
        values: combineSeries(periods.map((period) => institutionSeries(period, optionIndex))),
      };
    }),
  };
}

// ─── 机构面板 ───────────────────────────────────────────────
function CfetsInstPanel({
  initialPeriod = "R001",
  initialMetric = "buyAmt",
}: {
  initialPeriod?: CfetsInstPeriod;
  initialMetric?: CfetsMetricKey;
}) {
  const [metricMode, setMetricMode] = useState<CfetsInstMetricMode>(() =>
    cfetsModeFromMetricKey(initialMetric),
  );
  const [direction, setDirection] = useState<CfetsRepoDirection>(
    initialMetric === "sellRate" || initialMetric === "sellAmt" || initialMetric === "sellBalance"
      ? "reverse"
      : "repo",
  );
  const [chartKind, setChartKind] = useState<CfetsChartKind>(() =>
    cfetsDefaultChartKindForMetricMode(cfetsModeFromMetricKey(initialMetric)),
  );
  const [dimension, setDimension] = useState<CfetsDimension>("institution");
  const [selectedPeriods, setSelectedPeriods] = useState<CfetsInstPeriod[]>(
    () => [initialPeriod],
  );
  const [selectedInstitutions, setSelectedInstitutions] = useState<number[]>(
    () => [...cfetsDefaultInstitutionIndexes],
  );
  const [selectedSupplyTags, setSelectedSupplyTags] = useState<string[]>([
    "利率债",
    "同业存单",
    "信用债",
    "有效供给",
  ]);
  const [expandedRule, setExpandedRule] = useState<string | null>("回购比例(~2025)");
  const [activeDetail, setActiveDetail] = useState<{
    date: string;
    label: string;
    value: number;
  } | null>(null);

  const selectedPeriod = selectedPeriods.includes(initialPeriod)
    ? initialPeriod
    : (selectedPeriods[0] ?? initialPeriod);
  const metricLabel = cfetsMetricDisplayLabel(metricMode);
  const chartTitle = `${direction === "repo" ? "正回购" : "逆回购"}-${metricLabel}（${
    chartKind === "bar" ? "柱状图" : "折线图"
  }）`;
  const chartData = buildCfetsDenseSeries({
    metricMode,
    direction,
    dimension,
    selectedPeriods,
    selectedInstitutions,
  });

  function toggleInstitution(index: number) {
    setSelectedInstitutions((current) => toggleArrayValue(current, index));
  }

  function toggleSupplyTag(tag: string) {
    setSelectedSupplyTags((current) => toggleArrayValue(current, tag));
  }

  function setAllPeriods(checked: boolean) {
    setSelectedPeriods(checked ? [...cfetsInstPeriodLabels] : []);
  }

  function setAllInstitutions(checked: boolean) {
    setSelectedInstitutions(
      checked ? cfetsInstitutionOptions.map((_, index) => index) : [],
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[var(--tk-color-surface-page)] text-slate-200">
      <div className="shrink-0 border-b border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-dark-soft)]">
        <DenseOptionRow>
          {cfetsDenseMetricOptions.map((option) => (
            <DenseRadio
              key={option.key}
              checked={metricMode === option.key}
              label={option.label}
              name="cfets-metric-mode"
              onChange={() => {
                setMetricMode(option.key);
                setChartKind(cfetsDefaultChartKindForMetricMode(option.key));
              }}
            />
          ))}
        </DenseOptionRow>
        <DenseOptionRow>
          <DenseCheckbox
            checked={selectedInstitutions.length === cfetsInstitutionOptions.length}
            label="全部机构"
            onChange={setAllInstitutions}
          />
          {cfetsInstitutionOptions.map((option, index) => (
            <DenseCheckbox
              key={option.label}
              checked={selectedInstitutions.includes(index)}
              label={option.label}
              onChange={() => toggleInstitution(index)}
            />
          ))}
        </DenseOptionRow>
        <DenseOptionRow>
          <DenseCheckbox
            checked={selectedPeriods.length === cfetsInstPeriodLabels.length}
            label="全部期限"
            onChange={setAllPeriods}
          />
          {cfetsInstPeriodLabels.map((period) => (
            <DenseCheckbox
              key={period}
              checked={selectedPeriods.includes(period)}
              label={period}
              onChange={() =>
                setSelectedPeriods((current) => toggleArrayValue(current, period))
              }
            />
          ))}
        </DenseOptionRow>
        <div className="grid border-t border-[color:var(--tk-color-border-divider-dark)] text-xs">
          {["回购比例(~2025)", "回购比例(2026~)", "质押券比例(~2025)", "质押券比例(2026~)"].map(
            (rule, index) => (
              <button
                key={rule}
                type="button"
                className={`grid grid-cols-[12rem_1fr_auto] items-center gap-3 border-b border-[color:var(--tk-color-border-divider-dark)] px-4 py-2 text-left last:border-b-0 ${
                  expandedRule === rule
                    ? "bg-[rgba(56,113,189,0.12)] text-slate-100"
                    : "text-slate-400 hover:bg-[rgba(56,113,189,0.08)]"
                }`}
                onClick={() => setExpandedRule(expandedRule === rule ? null : rule)}
              >
                <span>{rule}</span>
                <span className="truncate text-mini text-slate-500">
                  {expandedRule === rule
                    ? `${selectedPeriod} · ${metricLabel} · 机构/期限明细已展开`
                    : "点击展开该口径明细"}
                </span>
                <span className="flex items-center gap-2">
                  {index < 2 ? (
                    <>
                      {["利率债", "同业存单", "信用债"].map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 text-mini"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleSupplyTag(tag);
                          }}
                        >
                          <input
                            checked={selectedSupplyTags.includes(tag)}
                            className="h-3 w-3 accent-[var(--tk-color-brand-primary)]"
                            readOnly
                            type="checkbox"
                          />
                          {tag}
                        </span>
                      ))}
                      <span className="rounded bg-[var(--tk-color-brand-primary)] px-2 py-1 text-mini font-semibold text-white">
                        有效供给
                      </span>
                    </>
                  ) : (
                    <span className="rounded bg-[var(--tk-color-brand-primary)] px-2 py-1 text-mini font-semibold text-white">
                      三四类
                    </span>
                  )}
                </span>
              </button>
            ),
          )}
        </div>
        <DenseOptionRow>
          <DenseRadio
            checked={direction === "repo"}
            label="正回购"
            name="cfets-direction"
            onChange={() => setDirection("repo")}
          />
          <DenseRadio
            checked={direction === "reverse"}
            label="逆回购"
            name="cfets-direction"
            onChange={() => setDirection("reverse")}
          />
        </DenseOptionRow>
        <DenseOptionRow>
          <DenseRadio
            checked={chartKind === "line"}
            label="折线图"
            name="cfets-chart-kind"
            onChange={() => setChartKind("line")}
          />
          <DenseRadio
            checked={chartKind === "bar"}
            label="柱状图"
            name="cfets-chart-kind"
            onChange={() => setChartKind("bar")}
          />
        </DenseOptionRow>
        <DenseOptionRow>
          <DenseRadio
            checked={dimension === "period"}
            label="期限"
            name="cfets-dimension"
            onChange={() => setDimension("period")}
          />
          <DenseRadio
            checked={dimension === "institution"}
            label="机构"
            name="cfets-dimension"
            onChange={() => setDimension("institution")}
          />
        </DenseOptionRow>
      </div>

      <div className="min-h-0 flex-1 px-4 pb-3 pt-4">
        <CfetsDenseChart
          chartKind={chartKind}
          data={chartData}
          metricMode={metricMode}
          title={chartTitle}
          onDetail={setActiveDetail}
        />
      </div>

      <div className="shrink-0 border-t border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-dark-soft)] px-4 py-2 text-xs">
        <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr_auto] items-center gap-3">
          <div className="truncate text-slate-300">
            {activeDetail
              ? `${activeDetail.date} · ${activeDetail.label}`
              : `${expandedRule ?? "回购比例(~2025)"} · ${selectedPeriod} · ${metricLabel}`}
          </div>
          <div className="text-slate-400">
            指标值{" "}
            <span className="font-mono text-slate-100">
              {formatCfetsDenseValue(activeDetail?.value ?? 0, metricMode)}
            </span>
          </div>
          <div className="text-slate-400">
            环比 <span className="text-emerald-300">+2.4%</span>
          </div>
          <div className="text-slate-400">
            更新时间 <span className="font-mono text-slate-100">10:53:27</span>
          </div>
          <button
            className="tk-button text-mini"
            type="button"
            onClick={() => setActiveDetail(null)}
          >
            收起明细
          </button>
        </div>
      </div>
    </div>
  );
}

function DenseOptionRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-8 flex-wrap items-center gap-x-4 gap-y-1 border-b border-[color:var(--tk-color-border-divider-dark)] px-4 py-1.5 text-xs">
      {children}
    </div>
  );
}

function DenseRadio({
  checked,
  label,
  name,
  onChange,
}: {
  checked: boolean;
  label: string;
  name: string;
  onChange: () => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap text-slate-300">
      <input
        checked={checked}
        className="h-3.5 w-3.5 accent-[var(--tk-color-brand-primary)]"
        name={name}
        onChange={onChange}
        type="radio"
      />
      {label}
    </label>
  );
}

function DenseCheckbox({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap text-slate-300">
      <input
        checked={checked}
        className="h-3.5 w-3.5 accent-[var(--tk-color-brand-primary)]"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      {label}
    </label>
  );
}

function CfetsDenseChart({
  chartKind,
  data,
  metricMode,
  title,
  onDetail,
}: {
  chartKind: CfetsChartKind;
  data: {
    dates: string[];
    series: Array<{ key: string; label: string; color: string; values: number[] }>;
  };
  metricMode: CfetsInstMetricMode;
  title: string;
  onDetail: (detail: { date: string; label: string; value: number }) => void;
}) {
  const [hiddenKeys, setHiddenKeys] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );
  const visibleSeries = data.series.filter((series) => !hiddenKeys.has(series.key));
  const isRate = cfetsMetricIsRate(metricMode);
  const unit = cfetsMetricUnit(metricMode);
  const allValues = visibleSeries.flatMap((series) => series.values);
  const maxValue = Math.max(...allValues, 1);
  const minValue = chartKind === "line" && isRate ? Math.min(...allValues, 0) : 0;
  const yMax = maxValue * 1.12;
  const yMin = isRate ? Math.max(0, minValue - (yMax - minValue) * 0.08) : 0;
  const width = 1600;
  const height = 430;
  const xTickStep = Math.max(1, Math.floor(data.dates.length / 16));
  const yTicks = Array.from({ length: 6 }, (_, index) =>
    yMax - ((yMax - yMin) * index) / 5,
  );
  const {
    tooltipState,
    containerRef,
    getIndexFromEvent,
    handleMouseMove,
    handleMouseLeave,
  } =
    useChartTooltip(data.dates.length);
  const tooltipIndex = tooltipState?.index ?? null;

  function toggleLegend(key: string) {
    setHiddenKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function openDetailAtIndex(dateIndex: number) {
    const date = data.dates[dateIndex];
    if (!date) return;
    const total = dailyTotals[dateIndex] || 0;
    const leader =
      visibleSeries
        .slice()
        .sort(
          (a, b) =>
            (b.values[dateIndex] ?? 0) - (a.values[dateIndex] ?? 0),
        )[0] ?? visibleSeries[0];
    onDetail({
      date,
      label: leader?.label ?? "-",
      value: total,
    });
  }

  function handleChartClick(event: React.MouseEvent<HTMLDivElement>) {
    if (chartKind !== "bar") return;
    const dateIndex = getIndexFromEvent(event);
    if (dateIndex === null) return;
    openDetailAtIndex(dateIndex);
  }

  const dailyTotals = data.dates.map((_, index) =>
    visibleSeries.reduce((sum, series) => sum + (series.values[index] ?? 0), 0),
  );
  const maxTotal = Math.max(...dailyTotals, 1);
  const tooltipRows =
    tooltipIndex === null
      ? []
      : visibleSeries
          .map((series) => ({
            ...series,
            value: series.values[tooltipIndex] ?? 0,
          }))
          .filter((series) => series.value > 0)
          .sort((a, b) => b.value - a.value);

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_auto_minmax(0,1fr)_auto] overflow-hidden rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]">
      <div className="flex items-center justify-between gap-3 px-4 pb-1 pt-4">
        <div className="min-w-0 flex-1 text-center text-xl font-semibold text-slate-100">
          {title}
        </div>
        <button
          className="tk-button tk-icon-button"
          type="button"
          title="导出"
        >
          ⤓
        </button>
      </div>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 px-4 pb-2 text-sm">
        {data.series.map((series) => {
          const hidden = hiddenKeys.has(series.key);
          return (
            <button
              key={series.key}
              className={`inline-flex items-center gap-1.5 rounded px-1 transition-opacity ${
                hidden ? "opacity-35" : "opacity-100"
              }`}
              type="button"
              onClick={() => toggleLegend(series.key)}
            >
              <span
                className="h-3 w-6 rounded-sm"
                style={{ backgroundColor: series.color }}
              />
              <span className="text-slate-300">{series.label}</span>
            </button>
          );
        })}
      </div>
      <div className="grid min-h-0 grid-cols-[4.8rem_1fr] px-3 pb-1">
        <div className="flex flex-col justify-between pb-7 pt-1 text-right text-mini text-slate-500">
          {yTicks.map((tick) => (
            <div key={tick}>{formatCfetsAxisTick(tick, metricMode)}</div>
          ))}
          <div>{formatCfetsAxisTick(0, metricMode)}</div>
        </div>
        <div
          ref={containerRef}
          className="relative min-h-0 cursor-crosshair overflow-hidden"
        >
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <div
              key={index}
              className="absolute inset-x-0 border-t border-[color:var(--tk-color-border-divider)] opacity-70"
              style={{ top: `${(index / 5) * 100}%` }}
            />
          ))}
          {chartKind === "bar" ? (
            <div className="absolute inset-x-1 bottom-7 top-1 flex items-end gap-[1px]">
              {data.dates.map((date, dateIndex) => {
                const total = dailyTotals[dateIndex] || 0;
                return (
                  <button
                    key={date}
                    className="flex h-full min-w-0 flex-1 cursor-pointer flex-col justify-end overflow-hidden"
                    style={{ height: `${(total / maxTotal) * 100}%` }}
                    type="button"
                    onClick={() => openDetailAtIndex(dateIndex)}
                  >
                    {visibleSeries.map((series) => {
                      const value = series.values[dateIndex] ?? 0;
                      const pct = total > 0 ? (value / total) * 100 : 0;
                      return pct > 0 ? (
                        <span
                          key={series.key}
                          style={{
                            height: `${pct}%`,
                            backgroundColor: series.color,
                            opacity: tooltipIndex === null || tooltipIndex === dateIndex ? 0.92 : 0.5,
                          }}
                        />
                      ) : null;
                    })}
                  </button>
                );
              })}
            </div>
          ) : (
            <svg
              className="absolute inset-x-1 bottom-7 top-1 h-[calc(100%-2rem)] w-[calc(100%-0.5rem)]"
              preserveAspectRatio="none"
              viewBox={`0 0 ${width} ${height}`}
            >
              {visibleSeries.map((series) => (
                <path
                  key={series.key}
                  d={buildLinePath(series.values, width, height, yMin, yMax)}
                  fill="none"
                  stroke={series.color}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              ))}
            </svg>
          )}
          {tooltipIndex !== null ? (
            <div
              className="pointer-events-none absolute bottom-7 top-1 w-px bg-[var(--tk-color-brand-primary)]"
              style={{ left: `${(tooltipIndex / (data.dates.length - 1)) * 100}%` }}
            />
          ) : null}
          <div className="absolute inset-x-0 bottom-0 h-6">
            {data.dates.map((date, index) =>
              index % xTickStep === 0 || index === data.dates.length - 1 ? (
                <span
                  key={date}
                  className="absolute top-1 -translate-x-1/2 whitespace-nowrap text-micro text-slate-500"
                  style={{ left: `${(index / (data.dates.length - 1)) * 100}%` }}
                >
                  {date}
                </span>
              ) : null,
            )}
          </div>
          <ChartHoverLayer
            onClick={handleChartClick}
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
          />
          {tooltipIndex !== null && tooltipState ? (
            <ChartTooltip
              clientX={tooltipState.clientX}
              clientY={tooltipState.clientY}
            >
              <div className="mb-1 font-semibold text-slate-200">
                {data.dates[tooltipIndex]}
              </div>
              {chartKind === "bar" ? (
                <div className="mb-1 flex items-center justify-between gap-6 border-b border-[color:var(--tk-color-border-divider-dark)] pb-1 text-mini">
                  <span className="text-slate-400">合计</span>
                  <span className="font-mono font-semibold text-slate-100">
                    {formatCfetsDenseValue(dailyTotals[tooltipIndex] ?? 0, metricMode)}
                  </span>
                </div>
              ) : null}
              {tooltipRows.slice(0, 12).map((series) => (
                <div key={series.key} className="flex items-center gap-2 py-0.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: series.color }}
                  />
                  <span className="text-slate-400">{series.label}</span>
                  <span className="ml-auto pl-4 font-mono font-semibold text-slate-100">
                    {formatCfetsDenseValue(series.value, metricMode)}
                  </span>
                </div>
              ))}
              {tooltipRows.length > 12 ? (
                <div className="mt-1 text-slate-500">其余 {tooltipRows.length - 12} 项略</div>
              ) : null}
            </ChartTooltip>
          ) : null}
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-[color:var(--tk-color-border-divider)] px-4 py-2 text-mini text-slate-500">
        <span>单位：{unit}</span>
        <span>图例点击可筛选；点击非图例柱体展开明细</span>
      </div>
    </div>
  );
}

// ─── 债券面板 ───────────────────────────────────────────────
function CfetsBondPanel() {
  const [bondType, setBondType] = useState<CfetsBondKey>("利率债");
  const [range, setRange] = useState<FundStructureRange>("14d");
  const [metricKey, setMetricKey] = useState<CfetsBondMetricKey>("buyRate");
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
              className={`rounded-md px-2.5 py-1 text-mini transition-colors ${
                bondType === bt
                  ? "bg-[var(--tk-color-surface-selected)] font-semibold text-slate-100"
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
            className="rounded border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-soft)] px-2 py-1 text-mini text-slate-200 focus:outline-none"
            value={metricKey}
            onChange={(e) => setMetricKey(e.target.value as CfetsBondMetricKey)}
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
      <div className="flex flex-wrap gap-3 text-mini text-slate-400">
        {fundStructureLegendItems.map((item) => (
          <LegendDot key={item.label} color={item.color} label={item.label} />
        ))}
      </div>
      {/* 图表 */}
      <MultiSeriesChart
        block={block}
        chartType={metricDef.chartType}
        unit={metricDef.unit}
        axisLabel={metricDef.axisLabel}
      />
      {/* 说明 */}
      <div className="text-micro text-slate-500">{metricDef.desc}</div>
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
    <div className="grid h-full min-h-0 flex-1 grid-rows-[auto_1fr_auto] gap-2 overflow-hidden rounded-lg border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] p-2">
      <div className="flex items-center justify-between text-mini text-slate-400">
        <div className="flex flex-wrap items-center gap-3">
          <LegendDot color={chartPalette.blue} label="1M" />
          <LegendDot color={chartPalette.emerald} label="3M" />
          <LegendDot color={chartPalette.amber} label="1Y" />
        </div>
        <span>近14天</span>
      </div>
      <div className="grid min-h-0 grid-cols-[2.8rem_1fr] gap-1">
        <div className="flex flex-col justify-between py-1 pr-1 text-right text-micro text-slate-500">
          {yTicks.map((t) => (
            <div key={t}>{t}%</div>
          ))}
        </div>
        <div
          ref={containerRef}
          className="relative min-h-0 overflow-hidden rounded-md border border-dashed border-[color:var(--tk-color-border-panel)]"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {[0, 1, 2, 3].map((index) => (
            <div
              key={`ncd-grid-${index}`}
              className="absolute inset-x-0 border-t border-dashed border-[color:var(--tk-color-border-divider)]"
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
        className={`grid ${compact ? "grid-cols-7" : "grid-cols-14"} text-center text-micro text-slate-400`}
      >
        {labels.map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>
    </div>
  );
}

function NcdPrimaryTrendPanel({ period = "1M" }: { period?: NcdPeriod }) {
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
    <div className="flex h-full min-h-0 flex-1 flex-col gap-2 overflow-hidden rounded-lg border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] p-2">
      {/* header: legend + range tabs */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-mini text-slate-400">
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
        <div className="flex flex-col justify-between pb-5 pr-1 text-right text-micro text-slate-500">
          {yTicks.map((t) => (
            <div key={t}>{t}%</div>
          ))}
        </div>
        {/* chart area — x-axis ticks + labels are absolutely inside */}
        <div
          ref={containerRef}
          className="relative min-h-0 cursor-crosshair overflow-hidden rounded-md border border-dashed border-[color:var(--tk-color-border-panel)]"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute inset-x-0 border-t border-dashed border-[color:var(--tk-color-border-divider)]"
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
                className="absolute top-[5px] -translate-x-1/2 text-micro leading-none text-slate-400"
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
              <div className="mb-1 text-mini font-medium text-slate-400">
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
    <div className="flex h-full min-h-0 flex-col gap-1 overflow-hidden rounded-lg border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] p-2">
      <div className="flex flex-wrap items-center gap-x-3 text-mini text-slate-400">
        {series.map((s) => (
          <LegendDot key={s.label} color={s.color} label={s.label} />
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[2.8rem_1fr] gap-x-1">
        <div className="flex flex-col justify-between pb-7 pr-1 text-right text-micro text-slate-500">
          {yTicks.map((t) => (
            <div key={t}>{t}%</div>
          ))}
        </div>
        <div
          ref={containerRef}
          className="relative min-h-0 cursor-crosshair overflow-hidden rounded-md border border-dashed border-[color:var(--tk-color-border-panel)]"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute inset-x-0 border-t border-dashed border-[color:var(--tk-color-border-divider)]"
              style={{ top: `${(i / 3) * 100}%` }}
            />
          ))}
          <svg
            className="absolute inset-x-0 top-0 w-full"
            style={{ height: "calc(100% - 26px)" }}
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
          <div className="absolute inset-x-0 bottom-0 h-7">
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
                className="absolute top-[6px] text-xs font-medium leading-none text-slate-300"
                style={{
                  left: `${(i / (count - 1)) * 100}%`,
                  transform:
                    i === 0
                      ? "translateX(0)"
                      : i === count - 1
                        ? "translateX(-100%)"
                        : "translateX(-50%)",
                }}
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
              <div className="mb-1 text-mini font-medium text-slate-400">
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
        <div className="mb-1 text-mini font-medium text-slate-400">一级</div>
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
      <div className="h-px bg-[var(--tk-color-border-divider)]" />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="mb-1 text-mini font-medium text-slate-400">二级</div>
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

function NcdPrimaryTable({ initialPeriod = "1M" }: { initialPeriod?: NcdPeriod }) {
  const [period, setPeriod] = useState<NcdPeriod>(initialPeriod);
  useEffect(() => {
    setPeriod(initialPeriod);
  }, [initialPeriod]);
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]">
      <div className="flex items-center gap-2 border-b border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-dark-soft)] px-3 py-1.5">
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
        <span className="ml-2 text-mini text-slate-500">(周一 26-06-08)</span>
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
            className="border-b border-r border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-dark-soft)] px-2 py-1 text-center text-mini font-medium text-slate-400 last:border-r-0"
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
                className="flex items-center justify-between border-b border-r border-[color:var(--tk-color-border-divider)] px-2 py-[5px] last:border-r-0"
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
                        <span className="ml-0.5 text-micro text-slate-500">
                          ▲
                        </span>
                      )}
                    </span>
                    <div className="flex shrink-0 items-center gap-1">
                      <span className="font-mono text-xs text-amber-400">
                        {row.rate}
                      </span>
                      {row.change && (
                        <span className="text-mini text-emerald-400">
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
          <tr className="bg-[var(--tk-color-surface-dark-soft)]">
            <th className="w-20 border-b border-r border-[color:var(--tk-color-border-divider)] px-2 py-2 text-left text-mini text-slate-500" />
            {ncdPrimaryPeriods.map((p) => {
              const h = ncdColHeaders[p];
              return (
                <th
                  key={p}
                  className="border-b border-r border-[color:var(--tk-color-border-divider)] px-2 py-2 text-center last:border-r-0"
                >
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="font-semibold text-slate-200">{p}</span>
                    <span className="text-micro text-slate-500">
                      ({h.dow} {h.date})
                    </span>
                    {h.count && (
                      <span className="rounded bg-blue-500/20 px-1 text-micro text-blue-300">
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
              <td className="border-b border-r border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-dark-soft)] px-2 py-2 text-mini font-medium text-slate-400">
                {group.label}
              </td>
              {ncdPrimaryPeriods.map((p) => {
                const cells = group.cells[p];
                return (
                  <td
                    key={p}
                    className="border-b border-r border-[color:var(--tk-color-border-divider)] px-2 py-1.5 last:border-r-0"
                  >
                    {cells.length > 0 ? (
                      <div className="flex flex-col gap-[3px]">
                        {cells.map((cell) => (
                          <div
                            key={cell.name}
                            className="flex items-center justify-between gap-1"
                          >
                            <span className="truncate text-mini text-slate-300">
                              {cell.name}
                            </span>
                            <div className="flex shrink-0 items-center gap-1">
                              <span className="font-mono text-mini text-amber-400">
                                {cell.rate}
                              </span>
                              {cell.change && (
                                <span className="text-micro text-emerald-400">
                                  +{cell.change}
                                </span>
                              )}
                              {cell.limitNonBank && (
                                <span className="rounded bg-slate-700/60 px-0.5 text-micro text-slate-400">
                                  限非
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-micro text-slate-600">
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

function FundStructureBars({
  range,
  hiddenSeries,
  unit = "亿",
  axisLabel,
}: {
  range: FundStructureRange;
  hiddenSeries?: ReadonlySet<number>;
  unit?: string;
  axisLabel?: string;
}) {
  const yTicks = [5000, 4000, 3000, 2000, 1000, 0] as const;
  const { bars, labels } = fundStructureRangeData[range];
  const isHidden = (i: number) => hiddenSeries?.has(i) ?? false;
  const axisCaption = axisLabel ?? (unit ? `单位：${unit}` : "");
  const [hoveredBar, setHoveredBar] = useState<{
    index: number;
    clientX: number;
    clientY: number;
  } | null>(null);

  return (
    <div className="grid h-full min-h-0 grid-cols-[3rem_1fr] gap-2">
      <div className="flex flex-col justify-between pb-2 pt-1 text-right text-micro text-slate-400">
        {yTicks.map((tick) => (
          <div key={tick}>{tick.toLocaleString()}</div>
        ))}
      </div>
      <div className="relative min-h-0 overflow-hidden rounded-md border border-dashed border-[color:var(--tk-color-border-panel)]">
        {axisCaption && (
          <div className="pointer-events-none absolute right-1.5 top-0.5 z-10 text-micro text-slate-500">
            {axisCaption}
          </div>
        )}
        {yTicks.map((tick, index) => (
          <div
            key={`fund-grid-${tick}`}
            className="absolute inset-x-0 border-t border-dashed border-[color:var(--tk-color-border-divider)]"
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
                {values.map((value, partIndex) =>
                  isHidden(partIndex) ? null : (
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
                  ),
                )}
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
                  .reduce((s, v, i) => s + (isHidden(i) ? 0 : v), 0)
                  .toLocaleString()}
                {unit}
              </span>
            </div>
            {fundStructureLegendItems.map((item, i) =>
              isHidden(i) ? null : (
                <div key={item.label} className="flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-400">{item.label}</span>
                  <span className="ml-1 font-semibold text-slate-100">
                    {bars[hoveredBar.index][i].toLocaleString()}
                    {unit}
                  </span>
                </div>
              ),
            )}
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
    <div className="grid h-full min-h-0 grid-rows-[auto_1fr_auto] gap-2 overflow-hidden rounded-lg border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] p-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-mini text-slate-400">
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
        <div className="flex flex-col justify-between pb-2 pt-1 text-right text-micro text-slate-400">
          {yTicks.map((tick) => (
            <div key={tick}>{tick.toLocaleString()}</div>
          ))}
        </div>
        <div className="relative min-h-0 overflow-hidden rounded-md border border-dashed border-[color:var(--tk-color-border-panel)]">
          {yTicks.map((tick, index) => (
            <div
              key={`fund-grid-${tick}`}
              className="absolute inset-x-0 border-t border-dashed border-[color:var(--tk-color-border-divider)]"
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
          className="grid pt-0.5 text-micro text-slate-400"
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
        className="rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-page)] px-2 py-1 text-xs text-slate-200 outline-none"
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
          ? "border-[color:var(--tk-color-brand-primary)] bg-[var(--tk-color-surface-page)]"
          : "border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-page)]"
      }`}
    >
      <div className="tk-panel-header border-b px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3 whitespace-nowrap">
            <div className="tk-title">{title}</div>
            <div className="text-xs text-slate-500">数据更新：10:53:27</div>
          </div>
          <button
            className="tk-button tk-button-success"
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
  nowrapHeader = false,
  flush = false,
  adaptiveHeight = false,
  scrollY = false,
  onRowClick,
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
  nowrapHeader?: boolean;
  flush?: boolean;
  adaptiveHeight?: boolean;
  scrollY?: boolean;
  onRowClick?: (row: readonly string[], rowIndex: number) => void;
}) {
  return (
    <div
      className={`tk-table-shell ${adaptiveHeight ? "" : "h-full min-h-0"} ${
        scrollY
          ? "overflow-y-auto overflow-x-hidden"
          : fitToWidth || adaptiveHeight
            ? "overflow-hidden"
            : "overflow-auto"
      } ${
        flush ? "rounded-none border-0" : "border"
      }`}
    >
      <table
        className={`tk-table border-separate border-spacing-0 text-xs ${fitToWidth ? "w-full table-fixed" : "min-w-full whitespace-nowrap"}`}
      >
        {columnWidths ? (
          <colgroup>
            {columnWidths.map((width, index) => (
              <col key={`col-${index}`} style={{ width }} />
            ))}
          </colgroup>
        ) : null}
        <thead className="sticky top-0 z-10">
          <tr>
            {columns.map((column, index) => (
              <th
                key={`${column}-${index}`}
                className={`border-b px-3 py-2 text-mini font-medium tracking-[0] ${
                  index === 0 ? "text-left" : "text-right"
                } ${compact ? "px-2 py-1.5" : "px-3 py-2.5"} ${
                  fitToWidth
                    ? columnWidths || nowrapHeader
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
              onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
              className={`${rowIndex % 2 === 0 ? "bg-transparent" : ""} ${
                onRowClick ? "cursor-pointer transition-colors hover:bg-[rgba(231,53,58,0.12)]" : ""
              }`}
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={`${row[0]}-${cellIndex}`}
                  className={`border-b ${compact ? "px-2 py-1.5" : "px-3 py-2.5"} ${
                    cellIndex === 0 ? "text-left" : "text-right"
                  } ${fitToWidth && buttonColumn !== cellIndex ? "overflow-hidden text-ellipsis whitespace-nowrap" : ""}`}
                >
                  {buttonColumn === cellIndex ? (
                    <button
                      className={`tk-button tk-button-primary font-medium ${
                        compact
                          ? "px-1.5 py-0.5 text-micro"
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
    <div className="grid h-full min-h-0 grid-rows-[auto_1fr] overflow-hidden rounded-xl border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]">
      <div className="flex items-center justify-between border-b border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-soft)] px-4 py-3">
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
          <div className="tk-title">
            nonbankBest · 14
          </div>
          <button
            className="tk-button"
            type="button"
          >
            导出
          </button>
        </div>
      </div>
      <div className="grid min-h-0 grid-rows-[68fr_26fr_auto] gap-0 px-4 pb-4 pt-3">
        <div className="grid min-h-0 grid-cols-[4rem_1fr]">
          <div className="flex flex-col justify-between pr-3 pb-2 pt-6 text-right text-micro text-slate-400">
            {trendPriceTicks.map((tick) => (
              <div key={tick}>{tick.toFixed(3)}</div>
            ))}
          </div>
          <div className="relative min-h-0">
            {trendPriceTicks.map((_, index) => (
              <div
                key={`price-grid-${index}`}
                className="absolute inset-x-0 border-t border-dashed border-[color:var(--tk-color-border-divider)]"
                style={{
                  top: `${(index / (trendPriceTicks.length - 1)) * 100}%`,
                }}
              />
            ))}
            <div
              className="absolute inset-x-0 border-t-2 border-dashed border-[color:var(--tk-color-warning)]"
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
        <div className="grid min-h-0 grid-cols-[4rem_1fr] border-t border-[color:var(--tk-color-border-divider)] pt-2">
          <div className="flex flex-col justify-between pr-3 pb-1 text-right text-micro text-slate-400">
            {trendVolumeTicks.map((tick) => (
              <div key={tick}>{tick}</div>
            ))}
          </div>
          <div className="relative min-h-0">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={`vol-grid-${index}`}
                className="absolute inset-x-0 border-t border-dashed border-[color:var(--tk-color-border-divider)]"
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
          <div className="grid grid-cols-10 text-micro text-slate-400">
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
    <div className="grid h-full min-h-0 grid-rows-[auto_1fr] overflow-hidden rounded-xl border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]">
      <div className="flex items-center justify-between gap-3 border-b border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-soft)] px-3 py-1.5">
        <div className="text-xs font-medium text-slate-200">{title}</div>
        <div className="flex flex-wrap gap-2 text-mini text-slate-500">
          <LegendDot color={chartPalette.emerald} label="1" />
          <LegendDot color={chartPalette.blue} label="7" />
          <LegendDot color={chartPalette.violet} label="14" />
        </div>
      </div>
      <div className="min-h-0 p-1.5">
        <div className="relative h-full min-h-0 overflow-hidden rounded-lg border border-dashed border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]">
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

  function getIndexFromEvent(e: React.MouseEvent<HTMLDivElement>) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || dataLength <= 0) return null;
    const x = e.clientX - rect.left;
    if (dataLength === 1) return 0;
    return Math.max(
      0,
      Math.min(dataLength - 1, Math.round((x / rect.width) * (dataLength - 1))),
    );
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const index = getIndexFromEvent(e);
    if (index === null) return;
    setState({ index, clientX: e.clientX, clientY: e.clientY });
  }

  function handleMouseLeave() {
    setState(null);
  }

  return {
    tooltipState: state,
    containerRef,
    getIndexFromEvent,
    handleMouseMove,
    handleMouseLeave,
  };
}

function ChartHoverLayer({
  onMouseMove,
  onMouseLeave,
  onClick,
}: {
  onMouseMove: (event: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave: () => void;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      className="absolute inset-0 z-20 cursor-crosshair"
      onClick={onClick}
      onMouseLeave={onMouseLeave}
      onMouseMove={onMouseMove}
    />
  );
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
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(() => ({
    left: clientX + 14,
    top: clientY - 10,
  }));

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const tooltip = tooltipRef.current;
    const width = tooltip?.offsetWidth ?? 220;
    const height = tooltip?.offsetHeight ?? 120;
    const padding = 8;
    let left = clientX + 14;
    let top = clientY - 10;

    if (left + width + padding > window.innerWidth) {
      left = clientX - width - 14;
    }
    if (top + height + padding > window.innerHeight) {
      top = clientY - height - 14;
    }

    left = Math.max(padding, Math.min(left, window.innerWidth - width - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - height - padding));
    setPosition({ left, top });
  }, [clientX, clientY, children]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={tooltipRef}
      className="tdx-terminal-tooltip pointer-events-none fixed z-[200] px-3 py-2 text-xs"
      style={{ left: position.left, top: position.top }}
    >
      {children}
    </div>,
    document.body,
  );
}

function LegendDot({
  color,
  label,
  interactive = false,
  className = "",
  onMouseEnter,
  onMouseLeave,
}: {
  color: string;
  label: string;
  interactive?: boolean;
  className?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border border-transparent px-1 py-0.5 transition-colors ${className} ${
        interactive
          ? "cursor-default hover:border-[color:var(--tk-color-border-panel)] hover:bg-[var(--tk-color-surface-dark-muted)] hover:text-slate-100"
          : ""
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="min-w-0 truncate">{label}</span>
    </span>
  );
}

function trendModeButtonClass(active: boolean) {
  return active
    ? "tk-chip tk-chip-active tk-segmented-tab"
    : "tk-chip tk-segmented-tab";
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
  if (product === "none") return values.slice();
  const series = intradayOverlaySeriesByProduct[product];
  // 长度对齐主线；若品种序列长度不同则按比例采样
  if (series.length === values.length) return series.slice();
  return values.map((_, i) => {
    const idx = Math.min(
      series.length - 1,
      Math.round((i * (series.length - 1)) / Math.max(values.length - 1, 1)),
    );
    return series[idx];
  });
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

  // 用独立的 randomWalk 序列，让对比/叠加品种与主线形态不平行
  const series = historicalProductSeries[range][normalized];
  return series.slice(0, baseSeries.length);
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
  const rawMax = Math.max(...values.map(Math.abs), 0);
  const maxAbs = rawMax < 0.005 ? 0 : Math.max(rawMax * 1.2, 0.05);
  if (maxAbs === 0) {
    return ["0", "0", "0", "0", "0"];
  }
  const step = maxAbs / 2;
  const digits = maxAbs >= 1 ? 1 : maxAbs >= 0.1 ? 2 : 3;
  const fmt = (v: number) => {
    const fixed = Number(v.toFixed(digits));
    return (Object.is(fixed, -0) ? 0 : fixed).toFixed(digits);
  };
  return [maxAbs, step, 0, -step, -maxAbs].map(fmt);
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

function formatMiniChartValue(value: number, unit = "") {
  if (!Number.isFinite(value)) return "-";
  if (unit === "%") return value.toFixed(3);
  const abs = Math.abs(value);
  if (abs >= 10000) return `${(value / 10000).toFixed(1)}万`;
  if (abs >= 1000) return Math.round(value).toString();
  if (abs >= 100) return Math.round(value).toString();
  if (abs >= 10) return value.toFixed(0);
  return value.toFixed(1);
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
    <section className="tk-panel flex min-h-0 flex-col overflow-hidden border">
      <div className="tk-panel-header border-b px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="tk-title">
              {title}
            </div>
            {subtitle ? (
              <div className="tk-muted mt-1 text-xs">{subtitle}</div>
            ) : null}
          </div>
          {actions ?? (
            <button
              className="tk-button tk-button-success"
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
  const latestPoint = data[data.length - 1];
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
      className="fixed z-[300] overflow-hidden rounded-xl border border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-dark-deep)] shadow-2xl"
      style={{ left, top, width: panelWidth }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div className="flex items-center gap-2 border-b border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-soft)] px-3 py-2">
        <span className="text-xs font-semibold text-slate-200">泰康资金情绪</span>
        <div className="flex gap-0.5 rounded-md bg-[var(--tk-color-surface-dark-deep)] p-0.5">
          {(["realtime", "trend"] as const).map((t) => (
            <button
              key={t}
              className={`rounded px-2.5 py-0.5 text-mini transition-colors ${
                tab === t
                  ? "bg-[var(--tk-color-brand-primary)] font-semibold text-white"
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
          <span className="text-micro text-slate-500">
            2026-04-10 → 2026-05-10
          </span>
        )}
        <span className="ml-auto cursor-default select-none text-mini text-slate-600">
          ?
        </span>
      </div>

      <div className="flex gap-4 px-3 pb-1 pt-2 text-mini text-slate-400">
        {sentimentSeriesConfig.map(({ key, label, color }) => (
          <LegendDot key={key} color={color} label={label} />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-1.5 px-3 pb-2">
        {sentimentSeriesConfig.map(({ key, label, color }) => (
          <div
            key={key}
            className="rounded border border-[color:var(--tk-color-border-panel)] bg-[rgba(15,23,42,0.46)] px-2 py-1.5"
          >
            <div className="flex items-center gap-1.5 text-micro text-slate-500">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="truncate">{label}</span>
            </div>
            <div className="mt-0.5 font-mono text-[13px] font-semibold text-slate-100">
              {latestPoint?.[key] ?? "-"}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[36px_1fr] px-1 pb-1">
        <div className="flex flex-col justify-between py-1 pr-1 text-right text-micro text-slate-500">
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
                  className="pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[color:var(--tk-color-surface-page)]"
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
              className="absolute -translate-x-1/2 text-micro text-slate-600"
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

type TopToolMetric = {
  label: string;
  value: string;
  tone?: "neutral" | "good" | "alert";
};

function TopToolMetricChip({
  label,
  value,
  tone,
  title,
  subtitle,
  metrics,
}: {
  label: string;
  value: string;
  tone: "neutral" | "good" | "alert";
  title: string;
  subtitle?: string;
  metrics: TopToolMetric[];
}) {
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
      className="inline-flex"
      onMouseEnter={scheduleShow}
      onMouseLeave={scheduleHide}
    >
      <InfoChip label={label} value={value} tone={tone} />
      {visible && anchorRect ? (
        <TopToolValuePopover
          anchorRect={anchorRect}
          metrics={metrics}
          subtitle={subtitle}
          title={title}
          onEnter={cancelHide}
          onLeave={scheduleHide}
        />
      ) : null}
    </div>
  );
}

function StatusBadgeWithPopover({ statusText }: { statusText: string }) {
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
      className="inline-flex"
      onMouseEnter={scheduleShow}
      onMouseLeave={scheduleHide}
    >
      <StatusBadge>{statusText}</StatusBadge>
      {visible && anchorRect ? (
        <TopToolValuePopover
          anchorRect={anchorRect}
          title={statusText}
          subtitle="综合央行投放、DR007、匿名成交与泰康资金情绪判断"
          metrics={[
            { label: "DR007", value: "2.15%", tone: "alert" },
            { label: "泰康资金情绪", value: "51", tone: "neutral" },
            { label: "R001", value: "1.58 / 1.66", tone: "good" },
            { label: "更新时间", value: "10:53:27" },
          ]}
          onEnter={cancelHide}
          onLeave={scheduleHide}
        />
      ) : null}
    </div>
  );
}

function TopToolValuePopover({
  anchorRect,
  title,
  subtitle,
  metrics,
  onEnter,
  onLeave,
}: {
  anchorRect: DOMRect;
  title: string;
  subtitle?: string;
  metrics: TopToolMetric[];
  onEnter: () => void;
  onLeave: () => void;
}) {
  const panelWidth = 284;
  const left = Math.max(
    8,
    Math.min(anchorRect.left, window.innerWidth - panelWidth - 8),
  );
  const top = anchorRect.bottom + 8;

  return (
    <div
      className="tdx-terminal-tooltip fixed z-[320] p-3 text-xs"
      style={{ left, top, width: panelWidth }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div className="font-semibold text-slate-50">{title}</div>
      {subtitle ? (
        <div className="mt-1 leading-5 text-slate-500">{subtitle}</div>
      ) : null}
      <div className="mt-2 grid gap-1.5">
        {metrics.map((metric) => (
          <div
            key={`${metric.label}-${metric.value}`}
            className="flex items-center justify-between gap-3 rounded border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-muted)] px-2 py-1.5"
          >
            <span className="truncate text-slate-500">{metric.label}</span>
            <span
              className={`shrink-0 font-mono font-semibold ${overviewToneClass(
                metric.tone ?? "neutral",
              )}`}
            >
              {metric.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SentimentChipWithPopover({
  label = "泰康资金情绪",
}: {
  label?: string;
}) {
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
      <InfoChip label={label} value="51 / 47 / 50 / 49" tone="neutral" />
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
      ? "border-[color:rgba(0,224,86,0.35)] bg-[rgba(0,224,86,0.1)] text-[color:var(--tk-color-success)]"
      : tone === "alert"
        ? "border-[color:rgba(255,160,40,0.35)] bg-[rgba(255,160,40,0.1)] text-[color:var(--tk-color-warning)]"
        : "border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-muted)] text-[color:var(--tk-color-text-inverse-secondary)]";

  return (
    <div className={`tk-info-chip rounded-full border ${toneStyles}`}>
      <span className="tk-muted">{label}</span>
      <span className="mx-2 text-[color:var(--tk-color-border-panel)]">|</span>
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
      className={`tk-segmented-tab rounded-lg border transition-colors ${
        active
          ? "tk-chip tk-chip-active"
          : "tk-chip"
      }`}
      type="button"
    >
      {children}
    </button>
  );
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return <span className="tk-muted px-1">{children}</span>;
}

function FilterDivider({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`${compact ? "mx-1 h-5" : "mx-2 h-6"} w-px bg-[var(--tk-color-border-divider-dark)]`}
    />
  );
}

function RangeFilterField({ value }: { value: string }) {
  return (
    <div className="tk-field flex min-w-[96px] items-center px-3 text-sm">
      {value}
    </div>
  );
}

function StatusBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="tk-badge tk-status-badge">
      {children}
    </div>
  );
}

function toneClass(tone: "neutral" | "balanced" | "watch") {
  if (tone === "balanced") return "tk-positive text-sm font-semibold";
  if (tone === "watch") return "tk-warning text-sm font-semibold";
  return "tk-strong text-sm font-semibold";
}

function auxTabClass(active: boolean) {
  return active
    ? "tk-chip tk-chip-active tk-segmented-tab"
    : "tk-chip tk-segmented-tab";
}

function miniChipClass(active: boolean) {
  return active
    ? "tk-chip tk-chip-active tk-segmented-tab--compact whitespace-nowrap text-mini"
    : "tk-chip tk-segmented-tab--compact whitespace-nowrap text-mini";
}

function cellClassName(
  value: string,
  columnIndex: number,
  greenColumns: readonly number[],
  redColumns: readonly number[],
  deltaColumns: readonly number[],
  emphasisColumns: readonly number[],
) {
  if (columnIndex === 0) return "tk-strong font-semibold";
  if (value.trim() === "--") return "tk-muted font-medium";
  if (deltaColumns.includes(columnIndex)) {
    if (value.startsWith("-")) return "tk-positive font-semibold";
    if (value.startsWith("+")) return "tk-negative font-semibold";
    return "tk-strong font-medium";
  }
  if (greenColumns.includes(columnIndex))
    return "tk-positive font-semibold";
  if (redColumns.includes(columnIndex)) return "tk-negative font-semibold";
  if (emphasisColumns.includes(columnIndex)) return "tk-negative font-medium";
  return "tk-strong";
}

export default App;
