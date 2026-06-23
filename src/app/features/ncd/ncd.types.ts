export type NcdPeriod = "1M" | "3M" | "6M" | "9M" | "1Y";

export type NcdTrendRange = "14d" | "1m" | "3m" | "6m";

export type NcdPrimaryRow = {
  name: string;
  rate: string;
  change?: string;
  marker?: boolean;
};

export type NcdPrimaryGroup = {
  label: string;
  rows: NcdPrimaryRow[];
};

export type NcdAllPeriodCell = {
  name: string;
  rate: string;
  change?: string;
  limitNonBank?: boolean;
};

export type NcdAllPeriodGroup = {
  label: string;
  cells: Record<NcdPeriod, NcdAllPeriodCell[]>;
};
