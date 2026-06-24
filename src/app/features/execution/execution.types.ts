export type DemandDirection = "repo" | "reverse";
export type DemandTenor = "R001" | "R007";

export type DemandAmount = { need: number; done: number };

export type DemandRow = {
  label: string;
  color: string;
  cells: Record<DemandTenor, DemandAmount>;
};

export type DemandGapRow = {
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

export type DemandMatrix = {
  rows: DemandRow[];
  rowTotals: Record<string, DemandAmount>;
  columnTotals: Record<DemandTenor, DemandAmount>;
  grandTotal: DemandAmount;
};

export type DemandBottomTab = "demand" | "execution";

export type CounterpartyTag = "保险/保障" | "稳定出钱" | "出散量" | "应急" | "券商自营";

export type ExecutionRow = {
  account: string;
  total: number;
  done: number;
  remaining: number;
  progress: number | null;
  issuedAt: string | null;
  tradeNote: string;
  investNote: string;
  counterpartyTag: CounterpartyTag | null;
};

export type FundGapRow = {
  account: string;
  total: number;
};

export type InflightRow = {
  account: string;
  total: number;
  done: number;
  progress: number;
  issuedAt: string;
  tradeNote: string;
  investNote: string;
  counterpartyTag: CounterpartyTag | null;
};
