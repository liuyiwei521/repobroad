import type { LucideIcon } from "lucide-react";

export type TrendMode = "intraday" | "history" | "comparison";
export type SentimentTab = "realtime" | "trend";
export type BaseTrendProduct = "r001" | "r007";
export type AnonymousTrendProduct =
  | "r001"
  | "r002"
  | "r007"
  | "r014"
  | "r030"
  | "r180"
  | "r365";
export type OverlayProduct =
  | "none"
  | "dr001"
  | "dr007"
  | "gc001"
  | "gc007"
  | "r001"
  | "r002"
  | "r007"
  | "r014"
  | "r030";
export type RightLowerTab = "matrix" | "inst" | "bond";
export type HistoryRange = "5d" | "1m" | "6m";
export type XrepoHistoryRange = "today" | HistoryRange;
export type SpreadProduct = "dr001" | "dr007" | "gc007" | "r007";
export type CompareProduct = "none" | SpreadProduct;
export type CfetsMetricKey =
  | "buyRate"
  | "sellRate"
  | "buyAmt"
  | "sellAmt"
  | "netInflow"
  | "netInflowAmt"
  | "buyBalance"
  | "sellBalance";
export type CfetsBondMetricKey = Exclude<
  CfetsMetricKey,
  "netInflow" | "netInflowAmt" | "buyBalance" | "sellBalance"
>;
export type CfetsTrendBlock = { dates: string[]; series: number[][] };
export type BankTenor = "ON" | "7D";
export type BankRateRow = {
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

export const BANK_TENOR_LABEL: Record<BankTenor, string> = {
  ON: "隔夜",
  "7D": "7天",
};

export const BANK_TENORS: readonly BankTenor[] = ["ON", "7D"];

export type QuoteRank = "最优" | "次优" | "报价";
export type QuoteDetailRow = {
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
export type QuoteGroup = {
  id: string;
  name: string;
  tenorSummary: string;
  totalAmount: string;
  averageRate: string;
  collateral: string;
  badges: readonly string[];
  rows: readonly QuoteDetailRow[];
};
export type RepoQuoteSection = {
  id: "reverse" | "forward";
  title: string;
  groups: readonly QuoteGroup[];
};

export type SummaryTableSection = {
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

export type ExchangeMarketSplitSection = {
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

export type EntryDisplayMode =
  | "icon"
  | "compact"
  | "narrow-summary"
  | "summary"
  | "wide-preview";
export type ModuleEntryId =
  | "big-bank-price"
  | "xrepo"
  | "exchange-repo"
  | "ncd"
  | "weighted-price"
  | "anonymous-trade"
  | "institution-period"
  | "global-filter"
  | "market-sentiment";

export type CfetsInstPeriod =
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

export type ActiveFrame = {
  id: ModuleEntryId;
  title: string;
  bank?: string;
  bankTenor?: string;
  contract?: string;
  cfetsPeriod?: CfetsInstPeriod;
  cfetsMetric?: CfetsMetricKey;
} | null;

export type FrameOpenOptions = {
  bank?: string;
  bankTenor?: string;
  contract?: string;
  cfetsPeriod?: CfetsInstPeriod;
  cfetsMetric?: CfetsMetricKey;
};

export type FrameRenderMode = "panel" | "page";

export type ModuleEntryConfig = {
  id: ModuleEntryId;
  group: string;
  title: string;
  description: string;
  statusText: string;
  icon: LucideIcon;
};

export type OverviewTone = "neutral" | "good" | "alert" | "muted";
export type ModuleEntryMetric = {
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
export type NarrowRailSummaryItem = {
  id: ModuleEntryId;
  label: string;
  value: string;
  tone?: OverviewTone;
  badge?: string;
  badgeTone?: "warning" | "danger";
};

export const QUOTE_TENOR_OPTIONS = ["R001", "R007", "R014", "R021", "R028"] as const;
export type QuoteTenorFilter = (typeof QUOTE_TENOR_OPTIONS)[number] | "all";

export type QuoteOverride = Partial<
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
