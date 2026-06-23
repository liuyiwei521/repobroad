import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  Activity,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Gauge,
  GripHorizontal,
  LineChart as LineChartIcon,
  Pin,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  XREPO_HISTORY_TABS,
  buildChartDomain,
  buildLinearTicks,
  buildXrepoTodayLabels,
  getSentimentState,
  getXrepoHistoryPointCount,
  quoteTenorDisplayLabel,
  toggleMultiSelect,
} from "./dashboardUtils.js";
import { useColumnLayout } from "./hooks/useColumnLayout";
import { useCenterSplit } from "./hooks/useCenterSplit";
import { ColumnSplitter as ShellColumnSplitter } from "./components/shell/ColumnSplitter";
import { FloatingBall as ShellFloatingBall } from "./components/shell/FloatingBall";
import { PageFrame as ShellPageFrame } from "./components/shell/PageFrame";
import { BankRateEditorModal as ShellBankRateEditorModal } from "./components/dialogs/BankRateEditorModal";
import {
  DEFAULT_TRADING_NOTICE_TEXT,
  DEFAULT_TRADING_STATUS_TEXT,
  TradingNoticeEditorModal as ShellTradingNoticeEditorModal,
} from "./components/dialogs/TradingNoticeEditorModal";
import { QuoteEditorModal as ShellQuoteEditorModal } from "./components/dialogs/QuoteEditorModal";
import {
  buildOpponentChatQuote,
  buildPrimaryChatQuote,
  QuoteChatDialog as ChatQuoteDialog,
} from "./features/chat";
import type { QuoteChatContext, QuoteChatPayload } from "./features/chat";
import { useHoverPopover } from "./hooks/useHoverPopover";
import type {
  ActiveFrame,
  AnonymousTrendProduct,
  BankRateRow,
  BankTenor,
  BaseTrendProduct,
  CfetsBondMetricKey,
  CfetsInstPeriod,
  CfetsMetricKey,
  CfetsTrendBlock,
  CompareProduct,
  EntryDisplayMode,
  ExchangeMarketSplitSection,
  FrameOpenOptions,
  FrameRenderMode,
  HistoryRange,
  ModuleEntryConfig,
  ModuleEntryId,
  ModuleEntryMetric,
  NarrowRailSummaryItem,
  OverlayProduct,
  OverviewTone,
  QuoteDetailRow,
  QuoteGroup,
  QuoteOverride,
  QuoteRank,
  QuoteTenorFilter,
  RepoQuoteSection,
  RightLowerTab,
  SentimentTab,
  SpreadProduct,
  SummaryTableSection,
  TrendMode,
  XrepoHistoryRange,
} from "./types";
import {
  BANK_TENOR_LABEL,
  BANK_TENORS,
  QUOTE_TENOR_OPTIONS,
} from "./types";
import {
  chartPalette,
  integratedPreviewEntryIds,
  leftRailEntries,
  moduleEntries,
  narrowRailSummaryItems,
  TODAY_STR,
} from "./features/shell/shell.data";
import {
  LeftNcdCard as NcdFeatureCard,
  getNcdModuleEntryData,
} from "./features/ncd";
import {
  CombinedDemandMatrixCard,
  MiddleMatrixNoticeBar,
} from "./features/execution";
import {
  bankRateSpread,
  BigBankHistoryBack,
  BigBankPricingTrendChart,
  defaultBigBankWhitelist,
  deriveHasQuote,
  initialBankRateRows,
  makeEmptyBankRow,
  parseRatePercent,
  rateDeltaValue,
  rateWithDelta,
} from "./features/big-bank";
import { ExchangeRepoCard, ExchangeRepoFrame } from "./features/exchange-repo";
import { BarometerMatrixCard } from "./features/barometer";
import {
  compareProductOptions,
  historicalCloseDatasets,
  HistoryClosePanel,
  IntradayPanel,
  intradaySeries,
  intradayVolumeSeries,
} from "./features/intraday";
import {
  buildXrepoMetric,
  xrepoSummarySection,
  XrepoFrame as XrepoFeatureFrame,
  XrepoHistoryBack as XrepoFeatureHistoryBack,
  XrepoInlineHistoryChart as XrepoFeatureInlineHistoryChart,
  XrepoSummaryOverview as XrepoFeatureSummaryOverview,
  xrepoR001Rows,
} from "./features/xrepo";

const defaultBigBankWhitelist: readonly string[] = [
  "工商银行",
  "建设银行",
  "农业银行",
  "中国银行",
];

const initialBankRateRows: readonly BankRateRow[] = [
  {
    institution: "工商银行",
    tenor: "ON",
    nonBankRate: "1.95%",
    refNonBankRate: "1.96%",
    deltaNonBankBp: "-1",
    bankRate: "2.00%",
    refBankRate: "2.00%",
    deltaBp: "0",
    updatedAt: "10:53:27",
    hasQuote: true,
  },
  {
    institution: "工商银行",
    tenor: "7D",
    nonBankRate: "2.04%",
    refNonBankRate: "2.04%",
    deltaNonBankBp: "0",
    bankRate: "2.10%",
    refBankRate: "2.12%",
    deltaBp: "-2",
    updatedAt: "10:53:27",
    hasQuote: true,
  },
  {
    institution: "建设银行",
    tenor: "ON",
    nonBankRate: "1.94%",
    refNonBankRate: "1.94%",
    deltaNonBankBp: "0",
    bankRate: "1.99%",
    refBankRate: "2.00%",
    deltaBp: "-1",
    updatedAt: "10:53:27",
    hasQuote: true,
  },
  {
    institution: "建设银行",
    tenor: "7D",
    nonBankRate: "2.06%",
    refNonBankRate: "2.07%",
    deltaNonBankBp: "-1",
    bankRate: "2.11%",
    refBankRate: "2.13%",
    deltaBp: "-2",
    updatedAt: "10:52:54",
    hasQuote: true,
  },
  {
    institution: "农业银行",
    tenor: "ON",
    nonBankRate: "1.96%",
    refNonBankRate: "1.96%",
    deltaNonBankBp: "0",
    bankRate: "2.01%",
    refBankRate: "2.00%",
    deltaBp: "+1",
    updatedAt: "10:53:27",
    hasQuote: true,
  },
  {
    institution: "农业银行",
    tenor: "7D",
    nonBankRate: "2.05%",
    refNonBankRate: "2.06%",
    deltaNonBankBp: "-1",
    bankRate: "2.09%",
    refBankRate: "2.10%",
    deltaBp: "-1",
    updatedAt: "10:52:31",
    hasQuote: true,
  },
  {
    institution: "中国银行",
    tenor: "ON",
    nonBankRate: "1.93%",
    refNonBankRate: "1.94%",
    deltaNonBankBp: "-1",
    bankRate: "1.98%",
    refBankRate: "2.00%",
    deltaBp: "-2",
    updatedAt: "10:52:12",
    hasQuote: true,
  },
  {
    institution: "中国银行",
    tenor: "7D",
    nonBankRate: "2.05%",
    refNonBankRate: "2.05%",
    deltaNonBankBp: "0",
    bankRate: "2.10%",
    refBankRate: "2.11%",
    deltaBp: "-1",
    updatedAt: "10:51:58",
    hasQuote: true,
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
    columns: xrepoSummarySection.columns,
    rows: xrepoSummarySection.rows,
    greenColumns: xrepoSummarySection.greenColumns,
    redColumns: xrepoSummarySection.redColumns,
    emphasisColumns: xrepoSummarySection.emphasisColumns,
    fitToWidth: xrepoSummarySection.fitToWidth,
    columnWidths: xrepoSummarySection.columnWidths,
    scrollable: xrepoSummarySection.scrollable,
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

const exchangeRepoSection = leftSections.find(
  (section): section is ExchangeMarketSplitSection =>
    section.layout === "exchange-split",
);

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

const anonymousTrendProductOptions: Array<{
  id: AnonymousTrendProduct;
  label: string;
}> = [
  { id: "all", label: "所有种类" },
  { id: "r001", label: "R001" },
  { id: "r002", label: "R002" },
  { id: "r007", label: "R007" },
  { id: "r014", label: "R014" },
  { id: "r030", label: "R030" },
  { id: "r180", label: "R180" },
  { id: "r365", label: "R365" },
];

const anonymousTrendProductLabel = (product: AnonymousTrendProduct) =>
  anonymousTrendProductOptions.find((option) => option.id === product)?.label ??
  "R001";

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

const anonymousIntradaySeriesByProduct: Record<AnonymousTrendProduct, number[]> =
  {
    all: clampRateAboveOne(randomWalk(2.024, 40, 0.045, 69)),
    r001: intradaySeries,
    r002: clampRateAboveOne(randomWalk(2.002, 40, 0.049, 74)),
    r007: intradayOverlaySeriesByProduct.r007,
    r014: clampRateAboveOne(randomWalk(2.086, 40, 0.045, 75)),
    r030: clampRateAboveOne(randomWalk(2.128, 40, 0.04, 76)),
    r180: clampRateAboveOne(randomWalk(2.182, 40, 0.034, 77)),
    r365: clampRateAboveOne(randomWalk(2.238, 40, 0.03, 78)),
  };

function getIntradayRateSeries(product: AnonymousTrendProduct) {
  return anonymousIntradaySeriesByProduct[product];
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

function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { mainRef, resetColumns, startDragSplitter, gridTemplate } =
    useColumnLayout();
  const [activeFrame, setActiveFrame] = useState<ActiveFrame>(null);
  const [overlayProduct, setOverlayProduct] = useState<OverlayProduct>("none");
  const [historyRange, setHistoryRange] = useState<HistoryRange>("5d");
  const [compareProduct, setCompareProduct] = useState<CompareProduct>("none");
  const [baseProduct, setBaseProduct] = useState<BaseTrendProduct>("r001");
  const [anonymousProduct, setAnonymousProduct] =
    useState<AnonymousTrendProduct>("r001");
  const [quoteTenorFilter, setQuoteTenorFilter] =
    useState<QuoteTenorFilter>("all");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  function openFrame(entry: ModuleEntryConfig, options: FrameOpenOptions = {}) {
    setActiveFrame({ id: entry.id, title: entry.title, ...options });
  }

  function openFrameById(id: ModuleEntryId, options: FrameOpenOptions = {}) {
    const entry = moduleEntries.find((item) => item.id === id);
    if (!entry) return;
    openFrame(entry, options);
  }
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
          <LeftInfoColumn onOpenFrame={openFrameById} />
          <ShellColumnSplitter onMouseDown={(e) => startDragSplitter(e, 0)} />
          <CenterColumn
            tenorFilter={quoteTenorFilter}
            onTenorFilterChange={setQuoteTenorFilter}
          />
          <ShellColumnSplitter onMouseDown={(e) => startDragSplitter(e, 1)} />
          <RightChartColumn />
        </main>
      </div>
      {activeFrame ? (
        <ShellPageFrame
          title={activeFrame.title}
          onClose={() => setActiveFrame(null)}
        >
          {activeFrame.id === "big-bank-price" ? (
            <BigBankPriceFrame
              initialBank={activeFrame.bank}
              initialTenor={activeFrame.bankTenor}
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
                product={anonymousProduct}
                overlayProduct={overlayProduct}
                onProductChange={setAnonymousProduct}
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
            activeFrame.contract ? (
              <XrepoFeatureHistoryBack
                contractName={activeFrame.contract}
                standalone
                onBack={() =>
                  setActiveFrame((current) =>
                    current && current.id === "xrepo"
                      ? { ...current, contract: undefined }
                      : current,
                  )
                }
              />
            ) : (
              <XrepoFeatureFrame
                frameMode="page"
                tenorFilter={quoteTenorFilter}
                onOpenHistory={(contractName) =>
                  setActiveFrame((current) =>
                    current && current.id === "xrepo"
                      ? { ...current, contract: contractName }
                      : current,
                  )
                }
              />
            )
          ) : activeFrame.id === "exchange-repo" ? (
            <ExchangeRepoFrame
              frameMode="page"
              initialContract={activeFrame.contract}
              section={exchangeRepoSection}
              tenorFilter={quoteTenorFilter}
              fallback={<ReservedModuleFrame />}
              renderHistoryChart={(contractName) => (
        <XrepoFeatureInlineHistoryChart contractName={contractName} />
              )}
            />
          ) : activeFrame.id === "ncd" ? (
            <NcdFeatureCard tenorFilter={quoteTenorFilter} todayStr={TODAY_STR} />
          ) : activeFrame.id === "global-filter" ? (
            <GlobalFilterFrame />
          ) : activeFrame.id === "market-sentiment" ? (
            <MarketSentimentFrame />
          ) : (
            <ReservedModuleFrame />
          )}
        </ShellPageFrame>
      ) : null}
      <ShellFloatingBall />
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
                <XrepoFeatureHistoryBack
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
  if (id === "xrepo") return <XrepoFeatureSummaryOverview tenorFilter={tenorFilter} />;

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

  if (id === "xrepo") return buildXrepoMetric(tenorFilter);

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
    return getNcdModuleEntryData(tenorFilter);
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
        <XrepoFeatureFrame
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
          onOpen={onOpen}
          section={exchangeRepoSection}
          tenorFilter={tenorFilter}
          fallback={<ReservedModuleFrame />}
          renderEmbeddedHeader={(actions) => (
            <IntegratedPreviewHeader
              id="exchange-repo"
              onOpen={onOpen}
              tenorFilter={tenorFilter}
              actions={actions}
            />
          )}
        />
      </RichPreviewFrame>
    );
  }

  if (id === "ncd") {
    return (
      <RichPreviewFrame heightClassName="h-full">
        <NcdFeatureCard
          embeddedPreview
          tenorFilter={tenorFilter}
          onOpen={onOpen}
          todayStr={TODAY_STR}
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
  const [anonymousProduct, setAnonymousProduct] =
    useState<AnonymousTrendProduct>("r001");
  return (
    <RichPreviewFrame heightClassName="h-[235px]">
      <IntradayPanel
        product={anonymousProduct}
        overlayProduct={overlayProduct}
        onProductChange={setAnonymousProduct}
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
      <ShellTradingNoticeEditorModal
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

function normalizeBankTenor(tenor?: string): BankTenor | undefined {
  if (!tenor) return undefined;
  if (tenor === "ON" || tenor === BANK_TENOR_LABEL.ON || tenor === "R001") {
    return "ON";
  }
  if (tenor === "7D" || tenor === BANK_TENOR_LABEL["7D"] || tenor === "R007") {
    return "7D";
  }
  if (/ON|001/i.test(tenor)) return "ON";
  if (/7D|007/i.test(tenor)) return "7D";
  return undefined;
}

function findBankQuoteAnchor(
  rows: readonly BankRateRow[],
  bank: string,
  tenor?: string,
) {
  const matchingRows = rows.filter((row) => row.institution === bank);
  const normalizedTenor = normalizeBankTenor(tenor);
  if (normalizedTenor) {
    const exact = matchingRows.find(
      (row) => row.tenor === normalizedTenor && row.hasQuote,
    );
    if (exact) return exact;
  }
  return matchingRows.find((row) => row.hasQuote) ?? matchingRows[0] ?? null;
}

function buildAnchoredBankHistorySeries(
  bank: string,
  rows: readonly BankRateRow[],
  tenor?: string,
) {
  const anchorRow = findBankQuoteAnchor(rows, bank, tenor);
  return createBankHistorySeries(bank, TODAY_STR, 28, {
    anchorNonBank:
      anchorRow ? (parseRatePercent(anchorRow.nonBankRate) ?? undefined) : undefined,
    anchorBank:
      anchorRow ? (parseRatePercent(anchorRow.bankRate) ?? undefined) : undefined,
    referenceNonBank:
      anchorRow
        ? (parseRatePercent(anchorRow.refNonBankRate) ?? undefined)
        : undefined,
    referenceBank:
      anchorRow ? (parseRatePercent(anchorRow.refBankRate) ?? undefined) : undefined,
  });
}

type BankHistoryPoint = ReturnType<typeof createBankHistorySeries>[number];

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
  return buildLinearTicks(min, max, count).map((tick) => Number(tick.toFixed(3)));
}

function bankChartXTickIndices(count: number) {
  return Array.from(
    new Set([0, Math.floor((count - 1) / 3), Math.floor(((count - 1) * 2) / 3), count - 1]),
  );
}

function buildRoundedTicks(max: number, count = 3) {
  return Array.from(
    new Set(
      buildLinearTicks(0, Math.max(1, max), count).map((tick) => Math.round(tick)),
    ),
  ).sort((left, right) => left - right);
}


type BigBankReferencePoint = {
  date: string;
  nonBank: number;
  bankRate: number;
  spread: number;
  bankDiff: number;
  nonBankDiff: number;
};

function formatBigBankReferenceDate(value: string) {
  const [month, day] = value.split("/").map(Number);
  if (!month || !day) return value;
  return `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function buildBigBankReferenceSeries(data: readonly BankHistoryPoint[]): BigBankReferencePoint[] {
  const nonBankValues = data.map((item) => Math.max(item.nonBank, item.bankRate));
  const bankValues = data.map((item) => Math.min(item.nonBank, item.bankRate));
  const bankBaseline = bankValues[0] ?? 0;
  const nonBankBaseline = Math.min(...nonBankValues) - 0.01;

  return data.map((item, index) => ({
    date: formatBigBankReferenceDate(item.date),
    nonBank: nonBankValues[index],
    bankRate: bankValues[index],
    spread: Math.max(1, Math.round((nonBankValues[index] - bankValues[index]) * 100)),
    bankDiff: Math.round((bankValues[index] - bankBaseline) * 100),
    nonBankDiff: Math.max(1, Math.round((nonBankValues[index] - nonBankBaseline) * 100)),
  }));
}

function bankReferenceXTickIndices(count: number) {
  const steps = 5;
  return Array.from(
    new Set(
      Array.from({ length: steps + 1 }, (_, index) =>
        Math.round((index / steps) * Math.max(0, count - 1)),
      ),
    ),
  );
}

function lightChartY(
  value: number,
  min: number,
  max: number,
  top: number,
  bottom: number,
) {
  if (max === min) return (top + bottom) / 2;
  return top + ((max - value) / (max - min)) * (bottom - top);
}

function LightChartTooltip({
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
    const padding = 12;
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
      className="pointer-events-none fixed z-[200] rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs text-slate-600 shadow-[0_18px_40px_rgba(15,23,42,0.16)] backdrop-blur-sm"
      style={{ left: position.left, top: position.top }}
    >
      {children}
    </div>,
    document.body,
  );
}

function LightTooltipValueRow({
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
      <span className="text-slate-500">{label}</span>
      <span className="ml-auto pl-4 font-mono font-semibold text-slate-800">{value}</span>
    </div>
  );
}

function BigBankReferenceToolbar() {
  const tools: readonly LucideIcon[] = [Expand, Columns2, Download, RefreshCcw];
  return (
    <div className="flex items-center gap-1 text-slate-500">
      {tools.map((Icon, index) => (
        <button
          key={`${Icon.displayName ?? "tool"}-${index}`}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-slate-100 hover:text-slate-700"
          type="button"
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
}

function BigBankReferenceCardHeader({
  title,
  legends,
}: {
  title: string;
  legends: readonly { color: string; label: string }[];
}) {
  return (
    <div className="border-b border-slate-200">
      <div className="px-6 pt-6 text-[18px] font-semibold tracking-[-0.02em] text-slate-800">
        {title}
      </div>
      <div className="flex flex-wrap items-center gap-3 px-6 py-4">
        <span className="shrink-0 text-[12px] text-slate-400">仅供内部参考</span>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {legends.map((legend) => (
            <LegendDot
              key={`${title}-${legend.label}`}
              color={legend.color}
              label={legend.label}
              className="px-0 text-[13px] text-slate-600"
            />
          ))}
        </div>
        <div className="ml-auto shrink-0">
          <BigBankReferenceToolbar />
        </div>
      </div>
    </div>
  );
}

function BigBankReferenceTrendPlot({
  data,
  sessionLabel,
}: {
  data: readonly BigBankReferencePoint[];
  sessionLabel: string;
}) {
  const { tooltipState, containerRef, handleMouseMove, handleMouseLeave } =
    useChartTooltip(data.length);
  const nonBank = data.map((item) => item.nonBank);
  const bankRates = data.map((item) => item.bankRate);
  const spread = data.map((item) => item.spread);
  const { min: minRate, max: maxRate } = buildChartDomain([...nonBank, ...bankRates], {
    paddingRatio: 0.12,
    minSpan: 0.08,
    clampMin: 0,
  });
  const maxSpread = Math.max(...spread, 1);
  const width = 860;
  const height = 430;
  const margin = { left: 66, right: 58, top: 46, bottom: 44 };
  const plotBottom = height - margin.bottom;
  const yTicks = bankChartTicks(minRate, maxRate, 6);
  const xTickIndices = bankReferenceXTickIndices(data.length);
  const spreadPlotHeight = (height - margin.top - margin.bottom) * 0.46;
  const spreadTicks = [maxSpread, Math.round(maxSpread / 2), 0];
  const tooltipIndex = tooltipState?.index ?? null;
  const hoverX =
    tooltipIndex === null ? null : bankTrendX(tooltipIndex, data.length, width, margin);
  const lastIndex = data.length - 1;
  const lastX = bankTrendX(lastIndex, data.length, width, margin);
  const lastNonBankY = bankTrendY(nonBank[lastIndex], height, minRate, maxRate, margin);
  const lastBankY = bankTrendY(bankRates[lastIndex], height, minRate, maxRate, margin);

  return (
    <div
      ref={containerRef}
      className="relative h-full min-h-[430px] cursor-crosshair"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${width} ${height}`}>
        <text x={margin.left - 22} y={22} fill="#64748b" fontSize="10">
          利率(%)
        </text>
        <text x={width - margin.right + 36} y={22} textAnchor="end" fill="#64748b" fontSize="10">
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
                stroke="#e5e7eb"
              />
              <text x={margin.left - 10} y={y + 4} textAnchor="end" fill="#64748b" fontSize="10">
                {tick.toFixed(2)}
              </text>
            </g>
          );
        })}
        <line x1={margin.left} x2={margin.left} y1={margin.top} y2={plotBottom} stroke="#cbd5e1" />
        <line x1={margin.left} x2={width - margin.right} y1={plotBottom} y2={plotBottom} stroke="#cbd5e1" />
        {xTickIndices.map((index) => {
          const x = bankTrendX(index, data.length, width, margin);
          return (
            <g key={index}>
              <line x1={x} x2={x} y1={plotBottom} y2={plotBottom + 4} stroke="#94a3b8" />
              <text x={x} y={height - 12} textAnchor="middle" fill="#64748b" fontSize="10">
                {data[index].date}
              </text>
            </g>
          );
        })}
        {spread.map((value, index) => {
          const barWidth = Math.max(5, (width - margin.left - margin.right) / spread.length - 4);
          const barHeight = (value / Math.max(maxSpread, 1)) * spreadPlotHeight;
          return (
            <rect
              key={`ref-spread-${index}`}
              x={bankTrendX(index, data.length, width, margin) - barWidth / 2}
              y={plotBottom - barHeight}
              width={barWidth}
              height={barHeight}
              rx="1.5"
              fill="#f3e4b8"
              opacity="0.88"
            />
          );
        })}
        {spreadTicks.map((tick) => {
          const y = plotBottom - (tick / Math.max(maxSpread, 1)) * spreadPlotHeight;
          return (
            <text
              key={`ref-spread-tick-${tick}`}
              x={width - margin.right + 12}
              y={y + 4}
              fill="#64748b"
              fontSize="10"
            >
              {tick}
            </text>
          );
        })}
        <path
          d={bankTrendPath(nonBank, width, height, minRate, maxRate, margin)}
          fill="none"
          stroke="#d97b84"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={bankTrendPath(bankRates, width, height, minRate, maxRate, margin)}
          fill="none"
          stroke="#5b8cc9"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {hoverX !== null && tooltipIndex !== null ? (
          <>
            <line
              x1={hoverX}
              x2={hoverX}
              y1={margin.top}
              y2={plotBottom}
              stroke="#94a3b8"
              strokeDasharray="4 4"
            />
            <circle
              cx={hoverX}
              cy={bankTrendY(nonBank[tooltipIndex], height, minRate, maxRate, margin)}
              r="4"
              fill="#d97b84"
              stroke="#ffffff"
              strokeWidth="2"
            />
            <circle
              cx={hoverX}
              cy={bankTrendY(bankRates[tooltipIndex], height, minRate, maxRate, margin)}
              r="4"
              fill="#5b8cc9"
              stroke="#ffffff"
              strokeWidth="2"
            />
          </>
        ) : null}
        <text x={lastX + 10} y={lastNonBankY - 8} fill="#1e293b" fontSize="13" fontWeight="700">
          {nonBank[lastIndex].toFixed(2)}
        </text>
        <text x={lastX + 10} y={lastBankY + 4} fill="#1e293b" fontSize="13" fontWeight="700">
          {bankRates[lastIndex].toFixed(2)}
        </text>
      </svg>
      {tooltipIndex !== null && tooltipState ? (
        <LightChartTooltip clientX={tooltipState.clientX} clientY={tooltipState.clientY}>
          <div className="mb-2 text-[12px] font-semibold text-slate-700">
            {data[tooltipIndex].date} · {sessionLabel}
          </div>
          <LightTooltipValueRow color="#d97b84" label="出给非银价格" value={`${nonBank[tooltipIndex].toFixed(3)}%`} />
          <LightTooltipValueRow color="#5b8cc9" label="出给银行价格" value={`${bankRates[tooltipIndex].toFixed(3)}%`} />
          <LightTooltipValueRow color="#f3e4b8" label="非银-银行价差" value={`${spread[tooltipIndex]}BP`} />
        </LightChartTooltip>
      ) : null}
    </div>
  );
}

function BigBankReferenceDiffPlot({
  data,
  sessionLabel,
}: {
  data: readonly BigBankReferencePoint[];
  sessionLabel: string;
}) {
  const { tooltipState, containerRef, handleMouseMove, handleMouseLeave } =
    useChartTooltip(data.length);
  const bankDiff = data.map((item) => item.bankDiff);
  const nonBankDiff = data.map((item) => item.nonBankDiff);
  const width = 860;
  const height = 430;
  const margin = { left: 60, right: 18, top: 44, bottom: 46 };
  const groupGap = 42;
  const groupHeight = (height - margin.top - margin.bottom - groupGap) / 2;
  const topStart = margin.top;
  const topEnd = topStart + groupHeight;
  const bottomStart = topEnd + groupGap;
  const bottomEnd = bottomStart + groupHeight;
  const topMax = Math.max(8, Math.ceil(Math.max(...bankDiff, 0) / 2) * 2);
  const topMin = Math.min(-2, Math.floor(Math.min(...bankDiff, 0) / 2) * 2);
  const bottomMax = Math.max(8, Math.ceil(Math.max(...nonBankDiff, 0) / 2) * 2);
  const topTicks = Array.from({ length: Math.floor((topMax - topMin) / 2) + 1 }, (_, index) => topMax - index * 2);
  const bottomTicks = Array.from({ length: Math.floor(bottomMax / 2) + 1 }, (_, index) => bottomMax - index * 2);
  const xTickIndices = bankReferenceXTickIndices(data.length);
  const tooltipIndex = tooltipState?.index ?? null;
  const hoverX =
    tooltipIndex === null ? null : bankTrendX(tooltipIndex, data.length, width, margin);
  const topZeroY = lightChartY(0, topMin, topMax, topStart, topEnd);

  return (
    <div
      ref={containerRef}
      className="relative h-full min-h-[430px] cursor-crosshair"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${width} ${height}`}>
        <text x={margin.left - 20} y={22} fill="#64748b" fontSize="10">
          价差(BP)
        </text>
        {topTicks.map((tick) => {
          const y = lightChartY(tick, topMin, topMax, topStart, topEnd);
          return (
            <g key={`top-${tick}`}>
              <line x1={margin.left} x2={width - margin.right} y1={y} y2={y} stroke="#e5e7eb" />
              <text x={margin.left - 10} y={y + 4} textAnchor="end" fill="#64748b" fontSize="10">
                {tick}
              </text>
            </g>
          );
        })}
        {bottomTicks.map((tick) => {
          const y = lightChartY(tick, 0, bottomMax, bottomStart, bottomEnd);
          return (
            <g key={`bottom-${tick}`}>
              <line x1={margin.left} x2={width - margin.right} y1={y} y2={y} stroke="#e5e7eb" />
              <text x={margin.left - 10} y={y + 4} textAnchor="end" fill="#64748b" fontSize="10">
                {tick}
              </text>
            </g>
          );
        })}
        <line x1={margin.left} x2={margin.left} y1={topStart} y2={bottomEnd} stroke="#cbd5e1" />
        <line x1={margin.left} x2={width - margin.right} y1={topZeroY} y2={topZeroY} stroke="#cbd5e1" />
        <line x1={margin.left} x2={width - margin.right} y1={bottomEnd} y2={bottomEnd} stroke="#cbd5e1" />
        {bankDiff.map((value, index) => {
          const barWidth = Math.max(6, (width - margin.left - margin.right) / bankDiff.length - 4);
          const x = bankTrendX(index, data.length, width, margin) - barWidth / 2;
          const valueY = lightChartY(value, topMin, topMax, topStart, topEnd);
          return (
            <rect
              key={`bank-diff-${index}`}
              x={x}
              y={Math.min(valueY, topZeroY)}
              width={barWidth}
              height={Math.max(2, Math.abs(valueY - topZeroY))}
              rx="1.5"
              fill="#5b8cc9"
              opacity="0.92"
            />
          );
        })}
        {nonBankDiff.map((value, index) => {
          const barWidth = Math.max(6, (width - margin.left - margin.right) / nonBankDiff.length - 4);
          const x = bankTrendX(index, data.length, width, margin) - barWidth / 2;
          const valueY = lightChartY(value, 0, bottomMax, bottomStart, bottomEnd);
          return (
            <rect
              key={`non-bank-diff-${index}`}
              x={x}
              y={valueY}
              width={barWidth}
              height={Math.max(2, bottomEnd - valueY)}
              rx="1.5"
              fill="#d97b84"
              opacity="0.92"
            />
          );
        })}
        {xTickIndices.map((index) => {
          const x = bankTrendX(index, data.length, width, margin);
          return (
            <g key={`ref-diff-x-${index}`}>
              <line x1={x} x2={x} y1={bottomEnd} y2={bottomEnd + 4} stroke="#94a3b8" />
              <text x={x} y={height - 12} textAnchor="middle" fill="#64748b" fontSize="10">
                {data[index].date}
              </text>
            </g>
          );
        })}
        {hoverX !== null ? (
          <line
            x1={hoverX}
            x2={hoverX}
            y1={topStart}
            y2={bottomEnd}
            stroke="#94a3b8"
            strokeDasharray="4 4"
          />
        ) : null}
      </svg>
      {tooltipIndex !== null && tooltipState ? (
        <LightChartTooltip clientX={tooltipState.clientX} clientY={tooltipState.clientY}>
          <div className="mb-2 text-[12px] font-semibold text-slate-700">
            {data[tooltipIndex].date} · {sessionLabel}
          </div>
          <LightTooltipValueRow color="#5b8cc9" label="给银行价差" value={`${bankDiff[tooltipIndex]}BP`} />
          <LightTooltipValueRow color="#d97b84" label="给非银价差" value={`${nonBankDiff[tooltipIndex]}BP`} />
        </LightChartTooltip>
      ) : null}
    </div>
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
  const { min: minRate, max: maxRate } = buildChartDomain([...nonBank, ...bankRates], {
    paddingRatio: 0.12,
    minSpan: 0.08,
    clampMin: 0,
  });
  const maxSpread = Math.max(...spread, 1);
  const width = 420;
  const height = 180;
  const margin = { left: 42, right: 34, top: 20, bottom: 30 };
  const plotBottom = height - margin.bottom;
  const yTicks = bankChartTicks(minRate, maxRate);
  const xTickIndices = bankChartXTickIndices(data.length);
  const spreadPlotHeight = (height - margin.top - margin.bottom) * 0.38;
  const spreadTicks = [maxSpread, Math.round(maxSpread / 2), 0];
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
          const barHeight = (value / maxSpread) * spreadPlotHeight;
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
        {spreadTicks.map((tick) => {
          const y = plotBottom - (tick / Math.max(maxSpread, 1)) * spreadPlotHeight;
          return (
            <text
              key={`spread-tick-${tick}`}
              x={width - margin.right + 6}
              y={y + 3}
              fill="#64748b"
              fontSize="8"
            >
              {tick}
            </text>
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
  const width = 420;
  const height = 150;
  const margin = { left: 58, right: 16, top: 14, bottom: 28 };
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

function BigBankHistoryTooltipContent({
  active,
  payload,
  sessionLabel,
  mode,
}: {
  active?: boolean;
  payload?: Array<{ payload?: BankHistoryPoint }>;
  sessionLabel: string;
  mode: "trend" | "diff";
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  return (
    <div className="rounded border border-[color:var(--tk-color-border-panel)] bg-[rgba(15,23,42,0.96)] px-3 py-2 text-xs shadow-xl backdrop-blur-sm">
      <div className="mb-1.5 flex items-center justify-between gap-4 font-semibold text-slate-100">
        <span>{point.date}</span>
        <span className="rounded border border-[color:var(--tk-color-border-panel)] px-1.5 py-0.5 text-micro text-slate-300">
          {sessionLabel}
        </span>
      </div>
      {mode === "trend" ? (
        <>
          <TooltipValueRow color="#cf6b74" label={"\u51fa\u7ed9\u975e\u94f6"} value={`${point.nonBank.toFixed(3)}%`} />
          <TooltipValueRow color="#5b8cc9" label={"\u51fa\u7ed9\u94f6\u884c"} value={`${point.bankRate.toFixed(3)}%`} />
          <TooltipValueRow color="#f4dfaa" label={"\u975e\u94f6-\u94f6\u884c\u4ef7\u5dee"} value={`${point.spread}BP`} />
        </>
      ) : (
        <>
          <TooltipValueRow color="#5b8cc9" label={"\u7ed9\u94f6\u884c\u4ef7\u5dee"} value={`${point.bankDiff}BP`} />
          <TooltipValueRow color="#d76370" label={"\u7ed9\u975e\u94f6\u4ef7\u5dee"} value={`${point.nonBankDiff}BP`} />
        </>
      )}
    </div>
  );
}

function BigBankRateTrendRechartsPlot({
  data,
  sessionLabel,
}: {
  data: readonly BankHistoryPoint[];
  sessionLabel: string;
}) {
  const nonBank = data.map((item) => item.nonBank);
  const bankRates = data.map((item) => item.bankRate);
  const spread = data.map((item) => item.spread);
  const { min: minRate, max: maxRate } = buildChartDomain([...nonBank, ...bankRates], {
    paddingRatio: 0.12,
    minSpan: 0.08,
    clampMin: 0,
  });
  const maxSpread = Math.max(...spread, 1);
  const yTicks = bankChartTicks(minRate, maxRate);
  const spreadTicks = buildRoundedTicks(maxSpread);
  const visibleDates = new Set(
    bankChartXTickIndices(data.length).map((index) => data[index]?.date),
  );

  return (
    <div className="flex h-full min-h-[220px] min-w-0 flex-col">
      <div className="mb-1 flex items-center justify-between gap-3 text-micro text-slate-500">
        <span>{"\u5229\u7387(%)"}</span>
        <div className="flex items-center gap-2">
          <span>{"\u4ef7\u5dee(BP)"}</span>
          <span className="rounded border border-[color:var(--tk-color-border-panel)] bg-[rgba(15,23,42,0.58)] px-1.5 py-0.5 text-slate-300">
            {sessionLabel}
          </span>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 6, right: 6, bottom: 6, left: 6 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.16)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 10 }}
              tickMargin={8}
              minTickGap={24}
              tickFormatter={(value) => (visibleDates.has(value) ? value : "")}
            />
            <YAxis
              yAxisId="rate"
              domain={[minRate, maxRate]}
              ticks={yTicks}
              width={46}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 10 }}
              tickFormatter={(value: number) => value.toFixed(3)}
            />
            <YAxis
              yAxisId="spread"
              orientation="right"
              domain={[0, Math.max(...spreadTicks, maxSpread)]}
              ticks={spreadTicks}
              width={34}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 10 }}
            />
            <Tooltip
              cursor={{ stroke: "#7aa2d6", strokeDasharray: "3 3", strokeWidth: 1 }}
              content={<BigBankHistoryTooltipContent mode="trend" sessionLabel={sessionLabel} />}
            />
            <Bar
              yAxisId="spread"
              dataKey="spread"
              fill="#f4dfaa"
              opacity={0.56}
              radius={[3, 3, 0, 0]}
              maxBarSize={16}
              isAnimationActive={false}
            />
            <Line
              yAxisId="rate"
              type="monotone"
              dataKey="nonBank"
              stroke="#cf6b74"
              strokeWidth={2.4}
              dot={false}
              activeDot={{ r: 4, stroke: "#0b1020", strokeWidth: 1.5 }}
              isAnimationActive={false}
            />
            <Line
              yAxisId="rate"
              type="monotone"
              dataKey="bankRate"
              stroke="#5b8cc9"
              strokeWidth={2.4}
              dot={false}
              activeDot={{ r: 4, stroke: "#0b1020", strokeWidth: 1.5 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function BigBankSpreadDiffRechartsPlot({
  data,
  sessionLabel,
}: {
  data: readonly BankHistoryPoint[];
  sessionLabel: string;
}) {
  const bankMax = Math.max(
    6,
    Math.ceil(Math.max(...data.map((item) => item.bankDiff), 1) / 2) * 2,
  );
  const nonBankMax = Math.max(
    6,
    Math.ceil(Math.max(...data.map((item) => item.nonBankDiff), 1) / 2) * 2,
  );
  const visibleDates = new Set(
    bankChartXTickIndices(data.length).map((index) => data[index]?.date),
  );
  const syncId = "big-bank-diff";

  return (
    <div className="flex h-full min-h-[220px] min-w-0 flex-col">
      <div className="mb-1 flex items-center justify-between gap-3 text-micro text-slate-500">
        <span>BP</span>
        <span className="rounded border border-[color:var(--tk-color-border-panel)] bg-[rgba(15,23,42,0.58)] px-1.5 py-0.5 text-slate-300">
          {sessionLabel}
        </span>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[88px_minmax(0,1fr)] grid-rows-2 gap-x-3 gap-y-3">
        <div className="flex items-center justify-end pr-1 text-xs text-slate-400">{"\u7ed9\u94f6\u884c\u4ef7\u5dee"}</div>
        <div className="min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} syncId={syncId} margin={{ top: 4, right: 6, bottom: 0, left: 6 }}>
              <CartesianGrid stroke="rgba(148,163,184,0.16)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" hide />
              <YAxis
                domain={[0, bankMax]}
                ticks={buildRoundedTicks(bankMax)}
                width={34}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 10 }}
              />
              <Tooltip
                cursor={{ fill: "rgba(122,162,214,0.08)" }}
                content={<BigBankHistoryTooltipContent mode="diff" sessionLabel={sessionLabel} />}
              />
              <Bar dataKey="bankDiff" fill="#5b8cc9" radius={[3, 3, 0, 0]} maxBarSize={18} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-end pr-1 text-xs text-slate-400">{"\u7ed9\u975e\u94f6\u4ef7\u5dee"}</div>
        <div className="min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} syncId={syncId} margin={{ top: 4, right: 6, bottom: 6, left: 6 }}>
              <CartesianGrid stroke="rgba(148,163,184,0.16)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 10 }}
                tickMargin={8}
                minTickGap={24}
                tickFormatter={(value) => (visibleDates.has(value) ? value : "")}
              />
              <YAxis
                domain={[0, nonBankMax]}
                ticks={buildRoundedTicks(nonBankMax)}
                width={34}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 10 }}
              />
              <Tooltip
                cursor={{ fill: "rgba(215,99,112,0.08)" }}
                content={<BigBankHistoryTooltipContent mode="diff" sessionLabel={sessionLabel} />}
              />
              <Bar dataKey="nonBankDiff" fill="#d76370" radius={[3, 3, 0, 0]} maxBarSize={18} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function BigBankPricingTrendChart({
  bank,
  tenor,
  rows = initialBankRateRows,
  className = "",
  compact = false,
}: {
  bank: string;
  tenor?: string;
  rows?: readonly BankRateRow[];
  className?: string;
  compact?: boolean;
}) {
  const data = buildAnchoredBankHistorySeries(bank, rows, tenor);
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
      <BigBankRateTrendRechartsPlot data={data} sessionLabel={sessionLabel} />
    </div>
  );
}

function BigBankHistoryBack({
  bank,
  tenor,
  rows = initialBankRateRows,
  compact = false,
  onBack,
}: {
  bank: string;
  tenor?: string;
  rows?: readonly BankRateRow[];
  compact?: boolean;
  onBack: () => void;
}) {
  const data = buildAnchoredBankHistorySeries(bank, rows, tenor);
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
      <div
        className={`grid min-h-0 flex-1 grid-rows-[minmax(0,1.08fr)_minmax(0,0.92fr)] ${
          compact ? "gap-1.5" : "gap-3"
        }`}
      >
        <div
          className="grid min-h-0 grid-rows-[auto_1fr] overflow-hidden rounded border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] p-3"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="tk-title">大行定价走势</div>
            <div className="flex flex-wrap justify-end gap-x-3 gap-y-1 text-micro text-slate-400">
              <LegendDot color="#cf6b74" label="出给非银价格(%)" />
              <LegendDot color="#5b8cc9" label="出给银行价格(%)" />
              <LegendDot color="#f4dfaa" label="非银-银行价差(BP)" />
            </div>
          </div>
          <BigBankRateTrendRechartsPlot data={data} sessionLabel={sessionLabel} />
        </div>
        <div
          className="grid min-h-0 grid-rows-[auto_1fr] overflow-hidden rounded border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] p-3"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="tk-title">大行定价与加权价差</div>
            <div className="flex flex-wrap justify-end gap-x-3 gap-y-1 text-micro text-slate-400">
              <LegendDot color="#5b8cc9" label="给银行价差(BP)" />
              <LegendDot color="#d76370" label="给非银价差(BP)" />
            </div>
          </div>
          <BigBankSpreadDiffRechartsPlot data={data} sessionLabel={sessionLabel} />
        </div>
      </div>
    </div>
  );
}

function BigBankPriceFrame({
  embeddedPreview = false,
  onOpen,
  initialBank,
  initialTenor,
  onFlippedChange,
}: {
  embeddedPreview?: boolean;
  onOpen?: (options?: FrameOpenOptions) => void;
  initialBank?: string;
  initialTenor?: string;
  onFlippedChange?: (flipped: boolean) => void;
}) {
  const [flippedBank, setFlippedBank] = useState<string | null>(initialBank ?? null);
  useEffect(() => {
    onFlippedChange?.(flippedBank !== null);
  }, [flippedBank, onFlippedChange]);
  const [flippedTenor, setFlippedTenor] = useState(initialTenor ?? "");
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
                const nextBank = row[0] ?? null;
                const nextTenor = row[1] ?? "";
                if (embeddedPreview && onOpen) {
                  onOpen({
                    bank: nextBank ?? undefined,
                    bankTenor: nextTenor || undefined,
                  });
                  return;
                }
                setFlippedBank(nextBank);
                setFlippedTenor(nextTenor);
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
      <ShellBankRateEditorModal
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
                            rows={bankRateRows}
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
              <NcdFeatureCard todayStr={TODAY_STR} />
            </div>
          </div>
        ) : null}
      </aside>
      <ShellBankRateEditorModal
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

function LeftInfoColumn({
  onOpenFrame,
}: {
  onOpenFrame: (id: ModuleEntryId, options?: FrameOpenOptions) => void;
}) {
  return (
    <aside className="flex h-full min-h-0 min-w-0 flex-col gap-1 overflow-hidden pr-1">
      <div className="min-h-0 flex-[1.4]">
        <BigBankPriceFrame
          embeddedPreview
          onOpen={(options) => onOpenFrame("big-bank-price", options)}
        />
      </div>
      <div className="min-h-0 flex-[1.1]">
        <XrepoFeatureFrame
          embeddedPreview
          onOpen={(options) => onOpenFrame("xrepo", options)}
        />
      </div>
      <div className="min-h-0 flex-[0.8]">
        <ExchangeRepoFrame
          embeddedPreview
          onOpen={(options) => onOpenFrame("exchange-repo", options)}
        />
      </div>
    </aside>
  );
}

function CenterColumn({
  tenorFilter,
  onTenorFilterChange,
}: {
  tenorFilter: QuoteTenorFilter;
  onTenorFilterChange: (tenor: QuoteTenorFilter) => void;
}) {
  const { containerRef, topPct, startRowDrag } = useCenterSplit();

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
  const [anonymousProduct, setAnonymousProduct] =
    useState<AnonymousTrendProduct>("r001");

  return (
    <aside className="flex h-full min-h-0 min-w-0 flex-col gap-1 overflow-hidden px-1 brightness-[0.92]">
      <div className="min-h-0 flex-[1.2]">
        <BarometerMatrixCard />
      </div>
      <div className="min-h-0 flex-[1.2]">
        <IntradayPanel
          product={anonymousProduct}
          overlayProduct={overlayProduct}
          onProductChange={setAnonymousProduct}
          onOverlayChange={setOverlayProduct}
        />
      </div>
      <div className="min-h-0 flex-[0.8]">
        <NcdFeatureCard embeddedPreview todayStr={TODAY_STR} />
      </div>
    </aside>
  );
}

function MiddleMatrixColumn() {
  const [overlayProduct, setOverlayProduct] = useState<OverlayProduct>("none");
  const [anonymousProduct, setAnonymousProduct] =
    useState<AnonymousTrendProduct>("r001");
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
                  product={anonymousProduct}
                  overlayProduct={overlayProduct}
                  onProductChange={setAnonymousProduct}
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
                    {quoteTenorDisplayLabel(t)}
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
      <ShellQuoteEditorModal
        row={editingRow}
        draft={editingDraft}
        onChange={(field, value) =>
          setEditingDraft((prev) => ({ ...prev, [field]: value }))
        }
        onClose={() => setEditingRow(null)}
        onSave={saveEditor}
      />
      <ChatQuoteDialog
        context={chatContext}
        onClose={() => setChatContext(null)}
      />
    </section>
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
    onSend(
      buildPrimaryChatQuote(row, {
        contactName: contactNameForInstitution(row.institution),
        amount: displayAmountForRow(row),
        account: shouldShowAccountRequirement(row.id)
          ? normalizeAccountRequirement(row.accountType)
          : "",
      }),
      groupName,
    );
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
      chatQuote: buildPrimaryChatQuote(mergedRow, {
        contactName: contactNameForInstitution(mergedRow.institution),
        amount: displayAmountForRow(mergedRow),
        account: shouldShowAccountRequirement(mergedRow.id)
          ? normalizeAccountRequirement(mergedRow.accountType)
          : "",
      }),
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
  const [anonymousProduct, setAnonymousProduct] =
    useState<AnonymousTrendProduct>("r001");

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
          product={anonymousProduct}
          overlayProduct={overlayProduct}
          onProductChange={setAnonymousProduct}
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
  product,
  overlayProduct,
  onProductChange,
  onOverlayChange,
}: {
  product: AnonymousTrendProduct;
  overlayProduct: OverlayProduct;
  onProductChange: (product: AnonymousTrendProduct) => void;
  onOverlayChange: (product: OverlayProduct) => void;
}) {
  const productLabel = anonymousTrendProductLabel(product);
  const mainSeries = getIntradayRateSeries(product);
  const overlaySeries =
    overlayProduct === "none"
      ? null
      : buildOverlaySeries(mainSeries, overlayProduct);
  const barValues = overlaySeries
    ? mainSeries.map((value, index) =>
        Number(((value - overlaySeries[index]) * 100).toFixed(1)),
      )
    : null;
  const { min, max } = buildChartDomain([...mainSeries, ...(overlaySeries ?? [])], {
    paddingRatio: 0.12,
    minSpan: 0.05,
    clampMin: 0,
  });
  const yTicks = buildLinearTicks(min, max, 4);
  const mainPath = buildLinePath(mainSeries, 680, 178, min, max);
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
            value={product}
            onChange={(event) =>
              onProductChange(event.target.value as AnonymousTrendProduct)
            }
          >
            {anonymousTrendProductOptions.map((option) => (
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
        <div className="ml-auto flex flex-wrap items-center gap-3 text-micro text-slate-500">
          <LegendDot color={chartPalette.blue} label={productLabel} />
          {overlaySeries ? (
            <LegendDot
              color={chartPalette.amber}
              label={overlayProductLabel(overlayProduct)}
            />
          ) : null}
        </div>
      </div>
      <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_1.25rem] px-3 pb-2 pt-2">
        <div className="grid min-h-0 grid-cols-[3.4rem_1fr]">
          <div className="flex flex-col justify-between pb-6 pr-2 text-right text-micro text-slate-400">
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
  const score = 51;
  const sentiment = getSentimentState(score);
  const updatedAt = "10:53";
  const {
    visible,
    anchorRect,
    anchorRef,
    scheduleShow,
    scheduleHide,
    cancelHide,
  } = useHoverPopover();
  const statusColorClass =
    sentiment.tone === "good"
      ? "text-emerald-500"
      : sentiment.tone === "alert"
        ? "text-amber-500"
        : "text-slate-400";
  return (
    <div
      ref={anchorRef}
      onMouseEnter={scheduleShow}
      onMouseLeave={scheduleHide}
    >
      <div className="tk-info-chip flex items-center gap-1.5 rounded-full border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-muted)] px-2.5 py-1 text-xs">
        <span className="tk-muted">{label}</span>
        <span className="font-semibold text-slate-100">{score}</span>
        <span className="text-slate-500">{updatedAt}</span>
        <span className={`font-semibold ${statusColorClass}`}>{sentiment.status}</span>
      </div>
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
