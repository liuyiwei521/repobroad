// ============== 数据源 ==============
/** ① 主行情表数据源（询价/匿名报价类） */
export type PrimarySourceId = "xrepo" | "bankPrice";

/** ② 对比行情表数据源（有分时走势，联动 ④） */
export type CompareSourceId = "exchange" | "nonbankBest";

/** ⑤ 右下展示的参考数据源 */
export type SentimentPanelSource = "interbank" | "ncd";

export type SourceId = PrimarySourceId | CompareSourceId | SentimentPanelSource;

// ============== 期限 ==============
export type Period = string;

// ============== 机构 ==============
export type InstitutionType =
  | "大行"
  | "股份行"
  | "城商行"
  | "券商"
  | "基金"
  | "理财子"
  | "保险";

export interface Institution {
  id: string;
  name: string;
  type: InstitutionType;
}

// ============== 报价 ==============
export interface Quote {
  period: string;
  bidVolume: number; // 正回购金额（亿）
  bidRate: number; // 正回购利率
  askRate: number; // 逆回购利率
  askVolume: number; // 逆回购金额（亿）
  weightedAvg?: number;
  totalAmount?: number;
  changeBp?: number;
  high?: number;
  low?: number;
  lastPrice?: number;
  openRate?: number;
  prevClose?: number;
}

export interface InstQuote {
  institutionId: string;
  institutionName: string;
  institutionType: InstitutionType;
  source: SourceId;
  period: string;
  bidRate: number;
  bidVolume: number;
  askRate: number;
  askVolume: number;
}

// ============== 时序 ==============
export interface TimePoint {
  time: string;
  [key: string]: number | string;
}

export interface PriceVolumePoint {
  time: string;
  price: number;
  weightedAvg?: number;
  volume: number;
}

export interface SentimentPoint {
  time: string;
  fullMarket: number;
  bigBank: number;
  smallBank: number;
  nonBank: number;
}

export interface StructurePoint {
  date: string;
  大行: number;
  中小行: number;
  货币: number;
  券商: number;
  理财子: number;
  保险: number;
}

// ============== UI 状态 ==============
export type BigChartMode = "intraday" | "history" | "comparison";
export type BottomTab = "omoDetail" | "omoSummary" | "nonbankDetail";
export type SentimentTab =
  | "sentiment"
  | "instRepo"
  | "ncd"
  | "structure"
  | "interbank";
/** 金额范围筛选（单位：亿，空字符串 = 不限） */
export interface AmountRange {
  min: string;
  max: string;
}

/** 利率范围筛选（单位：%，空字符串 = 不限） */
export interface RateRange {
  min: string;
  max: string;
}

export interface SelectedRow {
  source: CompareSourceId; // 只有 ② 才触发联动
  period: string;
}
