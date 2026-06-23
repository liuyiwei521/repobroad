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

export type ExecutionRow = {
  account: string;
  breakEvenRate: string;
  gap: string;
  accountReq: string;
  collateralReq: string;
  progress: number | null;
  issuedAt: string | null;
};

export type FundGapRow = {
  account: string;
  breakEvenRate: string;
  gap: string;
  accountReq: string;
  collateralReq: string;
};

export type InflightRow = {
  account: string;
  gap: string;
  progress: number;
  accountReq: string;
  collateralReq: string;
  issuedAt: string;
};
