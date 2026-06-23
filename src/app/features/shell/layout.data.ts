import type {
  ExchangeMarketSplitSection,
  SummaryTableSection,
} from "../../types";
import { xrepoSummarySection } from "../xrepo";

export const leftSections: readonly (
  | SummaryTableSection
  | ExchangeMarketSplitSection
)[] = [
  {
    layout: "table",
    title: "今天大行价格",
    columns: ["机构", "期限", "非银利率", "银行利率", "利差"],
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
