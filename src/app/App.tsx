import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Gauge,
  GripHorizontal,
  LineChart as LineChartIcon,
  SlidersHorizontal,
} from "lucide-react";
import {
  buildSeededWalk as randomWalk,
  buildChartDomain,
  buildLinearTicks,
  getSentimentState,
} from "./dashboardUtils.js";
import { useColumnLayout } from "./hooks/useColumnLayout";
import { useCenterSplit } from "./hooks/useCenterSplit";
import { ColumnSplitter as ShellColumnSplitter } from "./components/shell/ColumnSplitter";
import { FloatingBall as ShellFloatingBall } from "./components/shell/FloatingBall";
import { PageFrame as ShellPageFrame } from "./components/shell/PageFrame";
import { BankRateEditorModal as ShellBankRateEditorModal } from "./components/dialogs/BankRateEditorModal";
import {
  DEFAULT_TRADING_NOTICE_TEXT,
  TradingNoticeEditorModal as ShellTradingNoticeEditorModal,
} from "./components/dialogs/TradingNoticeEditorModal";
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
  QuoteTenorFilter,
  RightLowerTab,
  SpreadProduct,
  SentimentTab,
  SummaryTableSection,
  TrendMode,
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
  leftSections as shellLeftSections,
  sentimentRealtimeData as shellSentimentRealtimeData,
  sentimentTrendData as shellSentimentTrendData,
} from "./features/shell";
import {
  MainQuoteBoard,
  quoteBoardGlobalFilterMetric,
  QuoteBoardGlobalFilterFrame,
} from "./features/quote-board";
import {
  LeftNcdCard as NcdFeatureCard,
  getNcdModuleEntryData,
} from "./features/ncd";
import { miniChipClass } from "./components/ui/FilterControls";
import { StructuredTable } from "./components/ui/StructuredTable";
import {
  CombinedDemandMatrixCard,
  MiddleMatrixNoticeBar,
} from "./features/execution";
import {
  bankRateSpread,
  BigBankPricingTrendChart,
  BigBankSpreadDiffRechartsPlot,
  buildAnchoredBankHistorySeries,
  bankHistorySessionLabel,
  defaultBigBankWhitelist,
  deriveHasQuote,
  initialBankRateRows,
  makeEmptyBankRow,
  rateDeltaValue,
  rateWithDelta,
} from "./features/big-bank";
import { ExchangeRepoCard, ExchangeRepoFrame } from "./features/exchange-repo";
import { BarometerMatrixCard } from "./features/barometer";
import {
  CfetsBondPanel,
  CfetsInstPanel,
  CfetsMatrixPanel,
  InstitutionPeriodMatrixCard,
  cfetsInstPeriodLabels,
  cfetsMetricDefs,
  type FundStructureRange,
} from "./features/institution-period";
import {
  fundStructureLegendItems as institutionFundStructureLegendItems,
  fundStructureRangeData as institutionFundStructureRangeData,
  fundStructureRangeTabs as institutionFundStructureRangeTabs,
  rightLowerTabs as institutionRightLowerTabs,
} from "./features/institution-period/institutionPeriod.aux-data";
import {
  buildXrepoMetric,
  XrepoFrame as XrepoFeatureFrame,
  XrepoHistoryBack as XrepoFeatureHistoryBack,
  XrepoSummaryOverview as XrepoFeatureSummaryOverview,
  xrepoR001Rows,
} from "./features/xrepo";

/* const leftSections: readonly (
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

*/
const exchangeRepoSection = shellLeftSections.find(
  (section): section is ExchangeMarketSplitSection =>
    section.layout === "exchange-split",
);

const overlayProductOptions: Array<{ id: OverlayProduct; label: string }> = [
  { id: "none", label: "不叠加" },
  { id: "dr001", label: "DR001" },
  { id: "dr007", label: "DR007" },
  { id: "gc001", label: "GC001" },
  { id: "gc007", label: "GC007" },
  { id: "r001", label: "R001" },
  { id: "r002", label: "R002" },
  { id: "r007", label: "R007" },
  { id: "r014", label: "R014" },
  { id: "r030", label: "R030" },
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
  dr001: clampRateAboveOne(randomWalk(1.964, 40, 0.035, 70)),
  dr007: clampRateAboveOne(randomWalk(2.012, 40, 0.04, 71)),
  gc001: clampRateAboveOne(randomWalk(1.836, 40, 0.05, 79)),
  gc007: clampRateAboveOne(randomWalk(1.852, 40, 0.062, 72)),
  r001: clampRateAboveOne(randomWalk(1.986, 40, 0.046, 80)),
  r002: clampRateAboveOne(randomWalk(2.004, 40, 0.048, 84)),
  r007: clampRateAboveOne(randomWalk(2.058, 40, 0.052, 73)),
  r014: clampRateAboveOne(randomWalk(2.086, 40, 0.045, 85)),
  r030: clampRateAboveOne(randomWalk(2.128, 40, 0.04, 86)),
};

const anonymousIntradaySeriesByProduct: Record<AnonymousTrendProduct, number[]> =
  {
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
  gc001: {
    anchor5d: 1.18,
    anchor1m: 1.15,
    anchor6m: 1.39,
    vol5d: 0.14,
    vol1m: 0.03,
    vol6m: 0.015,
    seed: 87,
  },
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
  r001: {
    anchor5d: 1.28,
    anchor1m: 1.236,
    anchor6m: 1.47,
    vol5d: 0.17,
    vol1m: 0.026,
    vol6m: 0.013,
    seed: 88,
  },
  r002: {
    anchor5d: 1.31,
    anchor1m: 1.26,
    anchor6m: 1.5,
    vol5d: 0.16,
    vol1m: 0.027,
    vol6m: 0.013,
    seed: 89,
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
  r014: {
    anchor5d: 1.47,
    anchor1m: 1.42,
    anchor6m: 1.64,
    vol5d: 0.15,
    vol1m: 0.028,
    vol6m: 0.014,
    seed: 90,
  },
  r030: {
    anchor5d: 1.52,
    anchor1m: 1.46,
    anchor6m: 1.7,
    vol5d: 0.14,
    vol1m: 0.026,
    vol6m: 0.013,
    seed: 91,
  },
};
const historicalProductSeries: Record<
  HistoryRange,
  Record<Exclude<OverlayProduct | SpreadProduct, "none" | "dr001">, number[]>
> = {
  "5d": {
    gc001: randomWalk(
      historicalProductAnchors.gc001.anchor5d,
      historicalCloseDatasets["5d"].close.length,
      historicalProductAnchors.gc001.vol5d,
      historicalProductAnchors.gc001.seed,
    ),
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
    r001: randomWalk(
      historicalProductAnchors.r001.anchor5d,
      historicalCloseDatasets["5d"].close.length,
      historicalProductAnchors.r001.vol5d,
      historicalProductAnchors.r001.seed,
    ),
    r002: randomWalk(
      historicalProductAnchors.r002.anchor5d,
      historicalCloseDatasets["5d"].close.length,
      historicalProductAnchors.r002.vol5d,
      historicalProductAnchors.r002.seed,
    ),
    r007: randomWalk(
      historicalProductAnchors.r007.anchor5d,
      historicalCloseDatasets["5d"].close.length,
      historicalProductAnchors.r007.vol5d,
      historicalProductAnchors.r007.seed,
    ),
    r014: randomWalk(
      historicalProductAnchors.r014.anchor5d,
      historicalCloseDatasets["5d"].close.length,
      historicalProductAnchors.r014.vol5d,
      historicalProductAnchors.r014.seed,
    ),
    r030: randomWalk(
      historicalProductAnchors.r030.anchor5d,
      historicalCloseDatasets["5d"].close.length,
      historicalProductAnchors.r030.vol5d,
      historicalProductAnchors.r030.seed,
    ),
  },
  "1m": {
    gc001: randomWalk(
      historicalProductAnchors.gc001.anchor1m,
      historicalCloseDatasets["1m"].close.length,
      historicalProductAnchors.gc001.vol1m,
      historicalProductAnchors.gc001.seed + 1,
    ),
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
    r001: randomWalk(
      historicalProductAnchors.r001.anchor1m,
      historicalCloseDatasets["1m"].close.length,
      historicalProductAnchors.r001.vol1m,
      historicalProductAnchors.r001.seed + 1,
    ),
    r002: randomWalk(
      historicalProductAnchors.r002.anchor1m,
      historicalCloseDatasets["1m"].close.length,
      historicalProductAnchors.r002.vol1m,
      historicalProductAnchors.r002.seed + 1,
    ),
    r007: randomWalk(
      historicalProductAnchors.r007.anchor1m,
      historicalCloseDatasets["1m"].close.length,
      historicalProductAnchors.r007.vol1m,
      historicalProductAnchors.r007.seed + 1,
    ),
    r014: randomWalk(
      historicalProductAnchors.r014.anchor1m,
      historicalCloseDatasets["1m"].close.length,
      historicalProductAnchors.r014.vol1m,
      historicalProductAnchors.r014.seed + 1,
    ),
    r030: randomWalk(
      historicalProductAnchors.r030.anchor1m,
      historicalCloseDatasets["1m"].close.length,
      historicalProductAnchors.r030.vol1m,
      historicalProductAnchors.r030.seed + 1,
    ),
  },
  "6m": {
    gc001: randomWalk(
      historicalProductAnchors.gc001.anchor6m,
      historicalCloseDatasets["6m"].close.length,
      historicalProductAnchors.gc001.vol6m,
      historicalProductAnchors.gc001.seed + 2,
    ),
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
    r001: randomWalk(
      historicalProductAnchors.r001.anchor6m,
      historicalCloseDatasets["6m"].close.length,
      historicalProductAnchors.r001.vol6m,
      historicalProductAnchors.r001.seed + 2,
    ),
    r002: randomWalk(
      historicalProductAnchors.r002.anchor6m,
      historicalCloseDatasets["6m"].close.length,
      historicalProductAnchors.r002.vol6m,
      historicalProductAnchors.r002.seed + 2,
    ),
    r007: randomWalk(
      historicalProductAnchors.r007.anchor6m,
      historicalCloseDatasets["6m"].close.length,
      historicalProductAnchors.r007.vol6m,
      historicalProductAnchors.r007.seed + 2,
    ),
    r014: randomWalk(
      historicalProductAnchors.r014.anchor6m,
      historicalCloseDatasets["6m"].close.length,
      historicalProductAnchors.r014.vol6m,
      historicalProductAnchors.r014.seed + 2,
    ),
    r030: randomWalk(
      historicalProductAnchors.r030.anchor6m,
      historicalCloseDatasets["6m"].close.length,
      historicalProductAnchors.r030.vol6m,
      historicalProductAnchors.r030.seed + 2,
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

function LeftInfoColumn({
  activeId,
  onOpenFrame,
  tenorFilter,
}: {
  activeId: ModuleEntryId | null;
  onOpenFrame: (id: ModuleEntryId, options?: FrameOpenOptions) => void;
  tenorFilter: QuoteTenorFilter;
}) {
  return (
    <AdaptiveEntryRail
      entries={leftRailEntries}
      activeId={activeId}
      onOpen={(entry, options) => onOpenFrame(entry.id, options)}
      tenorFilter={tenorFilter}
    />
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
        aria-label="调整上下高度"
        title="调整上下高度"
        onMouseDown={startRowDrag}
        className="group relative shrink-0 cursor-row-resize py-[2px]"
      >
        <span className="pointer-events-none block h-[2px] w-full rounded bg-[var(--tk-color-border-panel)] group-hover:bg-[var(--tdx-red)]" />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <CombinedDemandMatrixCard />
        <div className="hidden">
          <div className="tk-panel h-full min-h-0 border p-3">
            <CfetsInstPanel />
          </div>
        </div>
        <div className="hidden">
          <FundStructureSummaryCard />
        </div>
      </div>
    </div>
  );
}

function RightChartColumn() {
  return <RightSidebar />;
}

function formatBigBankFrameTitle(bank?: string, tenor?: string) {
  if (!bank) return "大行价格";
  return tenor ? `大行价格 ${bank} ${tenor}` : `大行价格 ${bank}`;
}

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

  const activeFrameTitle =
    activeFrame?.id === "big-bank-price"
      ? formatBigBankFrameTitle(activeFrame.bank, activeFrame.bankTenor)
      : activeFrame?.title ?? "";
  const isXrepoHistoryPage =
    activeFrame?.id === "xrepo" && Boolean(activeFrame.contract);

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
          <LeftInfoColumn
            activeId={activeFrame?.id ?? null}
            onOpenFrame={openFrameById}
            tenorFilter={quoteTenorFilter}
          />
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
          title={activeFrameTitle}
          headerContent={
            isXrepoHistoryPage ? (
              <div className="flex min-w-0 items-center gap-4">
                <div className="tk-title-lg shrink-0">XREPO</div>
                <div className="min-w-0 truncate text-sm font-semibold text-slate-100">
                  历史成交走势对比 - {activeFrame.contract}
                </div>
              </div>
            ) : undefined
          }
          headerActions={
            isXrepoHistoryPage ? (
              <button
                className="tk-button px-2.5 py-0.5 text-xs"
                onClick={() =>
                  setActiveFrame((current) =>
                    current && current.id === "xrepo"
                      ? { ...current, contract: undefined }
                      : current,
                  )
                }
                type="button"
              >
                返回
              </button>
            ) : undefined
          }
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
                showHeader={false}
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
            />
          ) : activeFrame.id === "ncd" ? (
            <NcdFeatureCard tenorFilter={quoteTenorFilter} todayStr={TODAY_STR} />
          ) : activeFrame.id === "global-filter" ? (
            <QuoteBoardGlobalFilterFrame />
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
      className="left-rail-square flex h-full min-h-0 min-w-0 flex-col overflow-hidden pr-1"
    >
      <div className="left-rail-frame tk-panel flex min-h-0 flex-1 flex-col overflow-hidden border">
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

const LEFT_ENTRY_DELTA_KEY = "leftEntryDelta.v4";
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
  "big-bank-price": { "wide-preview": 300, summary: 190, "narrow-summary": 150 },
  xrepo: { "wide-preview": 236, summary: 180, "narrow-summary": 130 },
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

type EntryRuntimeState = {
  flipped?: boolean;
  naturalHeights?: Partial<Record<EntryDisplayMode, number>>;
};

const FLIPPED_MIN_OVERRIDES: Partial<
  Record<ModuleEntryId, Partial<Record<EntryDisplayMode, number>>>
> = {
  xrepo: { "wide-preview": 300, summary: 220, "narrow-summary": 220 },
};

function slotHeight(
  id: ModuleEntryId,
  mode: EntryDisplayMode,
  deltas: Record<string, number>,
  runtime: Record<string, EntryRuntimeState> = {},
) {
  let base = getNaturalMinHeight(id, mode);
  const naturalHeight = runtime[id]?.naturalHeights?.[mode];
  if (naturalHeight !== undefined) {
    base = Math.max(base, naturalHeight);
  }
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
  const handleNaturalHeightChange = useCallback(
    (id: ModuleEntryId, mode: EntryDisplayMode) => (height: number) => {
      if (!Number.isFinite(height) || height <= 0) return;
      const nextHeight = Math.round(height);
      setRuntime((current) => {
        if (current[id]?.naturalHeights?.[mode] === nextHeight) return current;
        return {
          ...current,
          [id]: {
            ...current[id],
            naturalHeights: {
              ...current[id]?.naturalHeights,
              [mode]: nextHeight,
            },
          },
        };
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
            className={`left-rail-card-shell group/entry relative ${collapsed ? "overflow-hidden rounded-lg border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]" : ""}`}
            style={{
              flex:
                !collapsed &&
                displayMode === "wide-preview" &&
                entry.id === "big-bank-price"
                  ? "1 0 auto"
                  : "0 0 auto",
              ...(displayMode === "wide-preview" || collapsed
                ? { height: minH, minHeight: minH }
                : {}),
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
                <div className="absolute right-1.5 top-1.5 z-30 flex flex-col items-end gap-1 opacity-70 transition-opacity group-hover/entry:opacity-100">
                  {displayMode !== "wide-preview" ? (
                    <span className="tk-chip rounded border text-micro">
                      {getModuleEntryData(entry.id, tenorFilter).badge}
                    </span>
                  ) : null}
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
                  hideBadge={displayMode !== "wide-preview"}
                  onOpen={(options) => onOpen(entry, options)}
                  onFlippedChange={handleFlipChange(entry.id)}
                  onNaturalHeightChange={handleNaturalHeightChange(
                    entry.id,
                    displayMode,
                  )}
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
              className={`left-rail-card-shell group/entry relative ${collapsed ? "overflow-hidden rounded border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]" : ""}`}
              style={{
                flex: "0 0 auto",
                height: minH,
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
  onNaturalHeightChange,
  hideBadge,
}: {
  entry: ModuleEntryConfig;
  active: boolean;
  displayMode: EntryDisplayMode;
  tenorFilter?: QuoteTenorFilter;
  onOpen: (options?: FrameOpenOptions) => void;
  onFlippedChange?: (flipped: boolean) => void;
  onNaturalHeightChange?: (height: number) => void;
  hideBadge?: boolean;
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
              : "border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-subtle)]"
          }`}
        >
          <ModuleEntryPreview
            id={entry.id}
            tenorFilter={tenorFilter}
            onOpen={onOpen}
            onFlippedChange={onFlippedChange}
            onNaturalHeightChange={onNaturalHeightChange}
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
          {!compact && displayMode !== "wide-preview" && !hideBadge ? (
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
  const sentiment = Math.round(shellSentimentTrendData.at(-1)?.total ?? 51);

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
    const section = shellLeftSections.find(
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
    return quoteBoardGlobalFilterMetric;
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
    trendValues: shellSentimentTrendData.map((item) => item.total),
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
          className="group flex min-w-0 shrink items-center gap-2 rounded-md px-1 py-0.5 text-left transition-colors hover:bg-[rgba(231,53,58,0.12)]"
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
          <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-1.5">
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
  onNaturalHeightChange,
}: {
  id: ModuleEntryId;
  tenorFilter?: QuoteTenorFilter;
  onOpen?: (options?: FrameOpenOptions) => void;
  onFlippedChange?: (flipped: boolean) => void;
  onNaturalHeightChange?: (height: number) => void;
}) {
  if (id === "big-bank-price") {
    return (
      <RichPreviewFrame heightClassName="h-full">
        <BigBankPriceFrame
          embeddedPreview
          onOpen={onOpen}
          onFlippedChange={onFlippedChange}
          onNaturalHeightChange={onNaturalHeightChange}
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
          <QuoteBoardGlobalFilterFrame />
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
      <div className="grid grid-cols-[minmax(230px,320px)_minmax(320px,1fr)] items-center gap-3">
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

function BigBankPriceFrame({
  embeddedPreview = false,
  onOpen,
  initialBank,
  initialTenor,
  onFlippedChange,
  onNaturalHeightChange,
}: {
  embeddedPreview?: boolean;
  onOpen?: (options?: FrameOpenOptions) => void;
  initialBank?: string;
  initialTenor?: string;
  onFlippedChange?: (flipped: boolean) => void;
  onNaturalHeightChange?: (height: number) => void;
}) {
  const [selectedBanks, setSelectedBanks] = useState<string[]>(() =>
    initialBank ? [initialBank] : [defaultBigBankWhitelist[0]],
  );
  const [selectedBankTenors, setSelectedBankTenors] = useState<Record<string, string>>(() => ({
    [initialBank ?? defaultBigBankWhitelist[0]]: initialTenor || "隔夜",
  }));
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
  const defaultBank = initialBank ?? defaultBigBankWhitelist[0];
  const defaultTenor = initialTenor || "隔夜";

  useEffect(() => {
    onFlippedChange?.(false);
  }, [onFlippedChange]);

  useEffect(() => {
    if (!initialBank) return;
    setSelectedBanks([initialBank]);
    setSelectedBankTenors({
      [initialBank]: initialTenor || "隔夜",
    });
  }, [initialBank, initialTenor]);

  useEffect(() => {
    setSelectedBanks((current) => {
      const currentBank = current[0];
      if (currentBank && whitelist.includes(currentBank)) {
        return [currentBank];
      }
      const fallback = whitelist[0] ?? defaultBank;
      return fallback ? [fallback] : [];
    });
    setSelectedBankTenors((current) => {
      const currentBank = selectedBanks[0];
      if (currentBank && whitelist.includes(currentBank)) {
        return {
          [currentBank]: current[currentBank] || defaultTenor,
        };
      }
      const fallback = whitelist[0] ?? defaultBank;
      return fallback
        ? {
            [fallback]: current[fallback] || defaultTenor,
          }
        : {};
    });
  }, [defaultBank, defaultTenor, selectedBanks, whitelist]);
  const selectedDetailBanks = selectedBanks.filter((institution) =>
    whitelist.includes(institution),
  );

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
  const institutionChars = rows.reduce(
    (maxChars, row) => Math.max(maxChars, Array.from(row[0] ?? "").length),
    Array.from("机构").length,
  );
  const tenorChars = rows.reduce(
    (maxChars, row) => Math.max(maxChars, Array.from(row[1] ?? "").length),
    Array.from("期限").length,
  );
  const institutionColumnWidth = `${Math.max(
    7.8,
    Math.min(10.8, institutionChars * 1.2 + 3),
  )}em`;
  const tenorColumnWidth = `${Math.max(
    5.6,
    Math.min(7.2, tenorChars * 1.1 + 2.8),
  )}em`;
  const bigBankColumnWidths = [institutionColumnWidth, tenorColumnWidth];

  useLayoutEffect(() => {
    if (!embeddedPreview || !onNaturalHeightChange) return;
    const previewHeaderHeight = 42;
    const tableHeaderHeight = 31;
    const rowHeight = 29;
    const frameBorderHeight = 4;
    const visibleRows = Math.max(4, Math.min(rows.length, 8));
    const naturalHeight =
      previewHeaderHeight +
      tableHeaderHeight +
      visibleRows * rowHeight +
      frameBorderHeight;
    onNaturalHeightChange(naturalHeight);
  }, [embeddedPreview, onNaturalHeightChange, rows.length]);

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

  function handleBankSelection(institution: string, tenorLabel: string) {
    if (embeddedPreview) {
      onOpen?.({
        bank: institution,
        bankTenor: tenorLabel || undefined,
      });
      return;
    }

    setSelectedBankTenors({
      [institution]: tenorLabel,
    });
    setSelectedBanks([institution]);
  }

  function renderBankDetailCards({
    fullHeight = false,
  }: {
    fullHeight?: boolean;
  }) {
    if (!selectedDetailBanks.length) {
      return (
        <div className="flex h-full min-h-[220px] items-center justify-center rounded-md border border-dashed border-[color:var(--tk-color-border-panel)] bg-white/72 px-6 text-sm text-slate-500">
          鐐瑰嚮涓婃柟澶ц琛岄」鐩悗锛屽湪杩欓噷鏌ョ湅瀹氫环璧板娍涓庝环宸姣?
        </div>
      );
    }

    const singleDetail = fullHeight && selectedDetailBanks.length === 1;

    return (
      <div
        className={
          singleDetail
            ? "grid h-full min-h-0"
            : "grid gap-3 xl:grid-cols-2"
        }
      >
        {selectedDetailBanks.map((bank) => {
          const tenorLabel = selectedBankTenors[bank] ?? "闅斿";
          const sessionLabel = bankHistorySessionLabel(tenorLabel);
          const data = buildAnchoredBankHistorySeries(
            bank,
            bankRateRows,
            tenorLabel,
          );

          return (
            <div
              key={bank}
              className={
                singleDetail
                  ? "grid h-full min-h-0 grid-rows-[minmax(0,1fr)] rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-page)] p-2"
                  : "grid min-h-0 gap-2 rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-page)] p-2"
              }
            >
              <div
                className={
                  singleDetail
                    ? "grid min-h-0 grid-rows-[minmax(0,1.35fr)_minmax(0,0.95fr)] gap-2"
                    : "grid gap-2"
                }
              >
                <BigBankPricingTrendChart
                  bank={bank}
                  tenor={tenorLabel}
                  rows={bankRateRows}
                  className={singleDetail ? "h-full min-h-0" : "min-h-[360px]"}
                />
                <div
                  className={`grid grid-rows-[auto_1fr] rounded border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] p-3 ${
                    singleDetail ? "min-h-0" : "min-h-[280px]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="tk-title">大行定价与加权价差</div>
                    <div className="flex gap-3 text-micro text-slate-400">
                      <LegendDot color="#5b8cc9" label="给银行价差(BP)" />
                      <LegendDot color="#d76370" label="给非银价差(BP)" />
                    </div>
                  </div>
                  <BigBankSpreadDiffRechartsPlot
                    data={data}
                    sessionLabel={sessionLabel}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <>
      <section
        className={
          embeddedPreview
            ? "flex h-full min-h-0 flex-col overflow-hidden"
            : "tk-panel flex h-full min-h-0 flex-col overflow-hidden border"
        }
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
          <div className="hidden">
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
        {embeddedPreview ? (
          <div className="min-h-0 flex-1">
            <div className="min-h-0 overflow-hidden">
              <StructuredTable
                columns={[
                  "机构",
                  "期限",
                  "非银利率",
                  "银行利率",
                  "利差",
                  "时间",
                ]}
                rows={rows}
                greenColumns={[2]}
                redColumns={[3]}
                columnWidths={bigBankColumnWidths}
                nowrapHeader
                fitToWidth={false}
                flush
                compact
                adaptiveHeight={false}
                scrollY
                scrollX
                onRowClick={(row) => {
                  const institution = row[0] ?? "";
                  const tenorLabel = row[1] ?? "隔夜";
                  if (!institution) return;
                  handleBankSelection(institution, tenorLabel);
                }}
              />
            </div>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-auto bg-[var(--tk-color-surface-dark-soft)] p-3">
            {renderBankDetailCards({ fullHeight: true })}
          </div>
        )}
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
          values={shellSentimentTrendData.map((item) => item.total)}
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
  const leftSummaryCardHeights = {
    bigBankFront: "h-[332px]",
    bigBankBack: "h-[380px]",
    xrepo: "h-[284px]",
    exchange: "h-auto",
    ncd: "h-[312px]",
  } as const;
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

  const summarySections = shellLeftSections
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
  const exchangeRepoSection = shellLeftSections.find(
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
      <aside className="flex h-full min-h-0 min-w-0 flex-col gap-3 overflow-y-auto pr-1">
        {summarySections.map((section) => {
          const isBigBankPrice = section.title === moduleEntries[0].title;
          const sectionHeightClass =
            isBigBankPrice
              ? flippedBigBankName
                ? leftSummaryCardHeights.bigBankBack
                : leftSummaryCardHeights.bigBankFront
              : section.title === "XREPO"
              ? leftSummaryCardHeights.xrepo
              : leftSummaryCardHeights.bigBankFront;
          if (isBigBankPrice) {
            return (
              <div
                key={section.title}
                className={`min-h-0 shrink-0 ${sectionHeightClass}`}
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
            className={`min-h-0 shrink-0 ${sectionHeightClass}`}
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
          <div className="flex min-h-0 shrink-0 flex-col gap-3">
            <div className={`${leftSummaryCardHeights.exchange} shrink-0 overflow-hidden`}>
              <ExchangeRepoCard
                title={exchangeRepoSection.title}
                markets={exchangeRepoSection.markets}
              />
            </div>
            <div className={`${leftSummaryCardHeights.ncd} min-h-0 shrink-0 overflow-hidden`}>
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

function RightSidebar() {
  const [overlayProduct, setOverlayProduct] = useState<OverlayProduct>("none");
  const [anonymousProduct, setAnonymousProduct] =
    useState<AnonymousTrendProduct>("r001");

  return (
    <aside
      className="grid min-h-0 min-w-0 gap-3 overflow-hidden"
      style={{
        gridTemplateRows: "minmax(0, 10fr) minmax(0, 10fr) minmax(0, 7fr)",
      }}
    >
      <div className="min-h-0 overflow-hidden">
        <BarometerMatrixCard />
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
        <InstitutionPeriodMatrixCard />
      </div>
    </aside>
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
  const { bars, labels } = institutionFundStructureRangeData[range];
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
                          institutionFundStructureLegendItems[partIndex].color,
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
            {institutionFundStructureLegendItems.map((item, i) =>
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
  const { bars, labels } = institutionFundStructureRangeData[range];
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
          {institutionFundStructureLegendItems.map((item) => (
            <LegendDot key={item.label} color={item.color} label={item.label} />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {institutionFundStructureRangeTabs.map((tab) => (
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
                          institutionFundStructureLegendItems[partIndex].color,
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
              {institutionFundStructureLegendItems.map((item, i) => (
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

function FundStructureSummaryCard() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-xl border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]">
        <div className="flex items-center justify-between gap-2 border-b border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-dark-soft)] px-3 py-2">
          <div className="min-w-0">
            <div className="tk-matrix-card-title truncate">资金分机构统计</div>
            <div className="tk-matrix-card-subtitle mt-0.5 truncate">
              保留小图概览，点击打开完整大图
            </div>
          </div>
          <button
            className="tk-button shrink-0 text-micro"
            onClick={() => setOpen(true)}
            type="button"
          >
            打开大图
          </button>
        </div>
        <div className="min-h-0 p-3">
          <FundStructurePanel />
        </div>
      </div>
      {open ? (
        <ShellPageFrame
          title="资金分机构统计"
          onClose={() => setOpen(false)}
        >
          <div className="h-full min-h-0 p-1">
            <FundStructurePanel />
          </div>
        </ShellPageFrame>
      ) : null}
    </>
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
  label,
  onEnter,
  onLeave,
}: {
  anchorRect: DOMRect;
  label: string;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const [tab, setTab] = useState<SentimentTab>("trend");
  const data =
    tab === "trend" ? shellSentimentTrendData : shellSentimentRealtimeData;
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
        <span className="text-xs font-semibold text-slate-200">{label}</span>
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
        <span className="ml-auto cursor-default select-none text-mini text-slate-500">
          全市场 / 大行 / 中小行 / 非银机构
        </span>
      </div>
      <div className="border-b border-[color:var(--tk-color-border-divider)] px-3 py-1.5 text-micro text-slate-500">
        口径说明：大行曲线为纯大行样本，另含全市场、中小行与非银机构对比。
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
  return (
    <div
      className="tk-info-chip flex items-center gap-1.5 rounded-full border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-muted)] px-2.5 py-1 text-xs"
    >
      <span className="text-black">{label}</span>
      <span className={`font-semibold ${sentiment.statusClass}`}>
        {sentiment.status}
      </span>
      <span className="text-slate-500">{updatedAt}</span>
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

export default App;
