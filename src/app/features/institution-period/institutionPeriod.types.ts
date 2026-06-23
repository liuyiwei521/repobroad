import type { CfetsBondMetricKey, CfetsInstPeriod, CfetsMetricKey } from "../../types";

export type FundStructureRange = "14d" | "1m" | "6m";

export type CfetsTermRow = {
  term: string;
  buyRate: number | null;
  buyAmt: number | null;
  sellRate: number | null;
  sellAmt: number | null;
  netInflow: number | null;
  sellBalance: number | null;
};

export type CfetsInstKey =
  | "????"
  | "?????"
  | "????"
  | "????"
  | "???????"
  | "??????"
  | "???????????"
  | "??";

export type CfetsBondKey = "???" | "???" | "????";

export type CfetsBondRow = {
  inst: string;
  buyRate: number | null;
  buyAmt: number | null;
  sellRate: number | null;
  sellAmt: number | null;
};

export type CfetsInstMetricMode =
  | "weightedRate"
  | "turnover"
  | "balance"
  | "crossMonth"
  | "netInflow";

export type CfetsRepoDirection = "repo" | "reverse";
export type CfetsChartKind = "line" | "bar";
export type CfetsDimension = "period" | "institution";

export type CfetsMetricDef = {
  key: CfetsMetricKey;
  label: string;
  desc: string;
  chartType: "line" | "stackedBar" | "divergeBar";
  unit: string;
  axisLabel: string;
};

export type CfetsDenseSeriesData = {
  dates: string[];
  series: Array<{ key: string; label: string; color: string; values: number[] }>;
};

export type CfetsDenseDetail = {
  date: string;
  label: string;
  value: number;
};
