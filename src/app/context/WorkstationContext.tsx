import { createContext, useContext, useReducer, type ReactNode } from "react";
import type {
  PrimarySourceId,
  CompareSourceId,
  BigChartMode,
  BottomTab,
  AmountRange,
  RateRange,
  SelectedRow,
} from "../data/types";

// ==================== State ====================
interface State {
  /** ① 主行情表当前源（XRepo / 大行价格） */
  activeSource: PrimarySourceId;

  /** ② 对比行情表当前源（交易所回购/非银最优） */
  compareSource: CompareSourceId;

  /** 全局期限筛选 */
  selectedPeriod: string | "all";

  /** 全局金额范围（亿，空字符串 = 不限） */
  amountRange: AmountRange;

  /** 全局利率范围（%，空字符串 = 不限） */
  rateRange: RateRange;

  /**
   * ② 选中行 → 触发 ④ 切换品种
   * ① 不联动，selectedRow 只由 ② 写入
   */
  selectedRow: SelectedRow | null;

  /** ④ 大图模式 */
  bigChartMode: BigChartMode;

  /** ③ 底部子 Tab */
  bottomTab: BottomTab;

  /** ③ 机构搜索（影响 [非银明细]） */
  institutionSearch: string;
}

const initialState: State = {
  activeSource: "xrepo",
  compareSource: "exchange",
  selectedPeriod: "all",
  amountRange: { min: "", max: "" },
  rateRange: { min: "", max: "" },
  selectedRow: null,
  bigChartMode: "comparison", // 默认：趋势一览
  bottomTab: "omoDetail",
  institutionSearch: "",
};

// ==================== Actions ====================
type Action =
  | { type: "SET_ACTIVE_SOURCE"; source: PrimarySourceId }
  | { type: "SET_COMPARE_SOURCE"; source: CompareSourceId }
  | { type: "SET_SELECTED_PERIOD"; period: string | "all" }
  | { type: "SET_AMOUNT_RANGE"; range: AmountRange }
  | { type: "SET_RATE_RANGE"; range: RateRange }
  | { type: "SET_SELECTED_ROW"; row: SelectedRow | null }
  | { type: "SET_BIG_CHART_MODE"; mode: BigChartMode }
  | { type: "SET_BOTTOM_TAB"; tab: BottomTab }
  | { type: "SET_INSTITUTION_SEARCH"; search: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_ACTIVE_SOURCE":
      return { ...state, activeSource: action.source };
    case "SET_COMPARE_SOURCE":
      return { ...state, compareSource: action.source, selectedRow: null };
    case "SET_SELECTED_PERIOD":
      return { ...state, selectedPeriod: action.period };
    case "SET_AMOUNT_RANGE":
      return { ...state, amountRange: action.range };
    case "SET_RATE_RANGE":
      return { ...state, rateRange: action.range };
    case "SET_SELECTED_ROW":
      return {
        ...state,
        selectedRow: action.row,
        bigChartMode:
          state.bigChartMode === "comparison" && action.row
            ? "intraday"
            : state.bigChartMode,
      };
    case "SET_BIG_CHART_MODE":
      return { ...state, bigChartMode: action.mode };
    case "SET_BOTTOM_TAB":
      return { ...state, bottomTab: action.tab };
    case "SET_INSTITUTION_SEARCH":
      return { ...state, institutionSearch: action.search };
    default:
      return state;
  }
}

// ==================== Context ====================
interface ContextValue extends State {
  setActiveSource: (source: PrimarySourceId) => void;
  setCompareSource: (source: CompareSourceId) => void;
  setSelectedPeriod: (period: string | "all") => void;
  setAmountRange: (range: AmountRange) => void;
  setRateRange: (range: RateRange) => void;
  setSelectedRow: (row: SelectedRow | null) => void;
  setBigChartMode: (mode: BigChartMode) => void;
  setBottomTab: (tab: BottomTab) => void;
  setInstitutionSearch: (search: string) => void;
}

const WorkstationContext = createContext<ContextValue | null>(null);

export function WorkstationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const value: ContextValue = {
    ...state,
    setActiveSource: (source) =>
      dispatch({ type: "SET_ACTIVE_SOURCE", source }),
    setCompareSource: (source) =>
      dispatch({ type: "SET_COMPARE_SOURCE", source }),
    setSelectedPeriod: (period) =>
      dispatch({ type: "SET_SELECTED_PERIOD", period }),
    setAmountRange: (range) => dispatch({ type: "SET_AMOUNT_RANGE", range }),
    setRateRange: (range) => dispatch({ type: "SET_RATE_RANGE", range }),
    setSelectedRow: (row) => dispatch({ type: "SET_SELECTED_ROW", row }),
    setBigChartMode: (mode) => dispatch({ type: "SET_BIG_CHART_MODE", mode }),
    setBottomTab: (tab) => dispatch({ type: "SET_BOTTOM_TAB", tab }),
    setInstitutionSearch: (search) =>
      dispatch({ type: "SET_INSTITUTION_SEARCH", search }),
  };

  return (
    <WorkstationContext.Provider value={value}>
      {children}
    </WorkstationContext.Provider>
  );
}

export function useWorkstation(): ContextValue {
  const ctx = useContext(WorkstationContext);
  if (!ctx)
    throw new Error("useWorkstation must be used within WorkstationProvider");
  return ctx;
}
