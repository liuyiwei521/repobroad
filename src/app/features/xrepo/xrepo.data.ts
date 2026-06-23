import type { CompareProduct, SummaryTableSection } from "../../types";

export const xrepoSummarySection = {
  layout: "table",
  title: "XREPO",
  columns: [
    "合约名称",
    "正回购量(亿)",
    "正回购利率(%)",
    "逆回购利率(%)",
    "逆回购量(亿)",
    "时间",
  ],
  rows: [
    ["R001", "5 (0)", "1.36", "1.25", "1185 (0)", "10:31"],
    ["R001", "-", "-", "1.36", "30 (7)", "10:28"],
    ["R001", "-", "-", "1.38", "70 (62)", "10:25"],
    ["R001_mini", "0.6 (0)", "1.38", "1.30", "12 (0)", "10:30"],
    ["DFR001_mini", "5 (0)", "1.37", "1.38", "47 (34)", "10:29"],
    ["CDR001_mini", "20.6 (0)", "1.40", "1.41", "20 (10)", "10:27"],
    ["R004", "-", "-", "1.42", "3 (0)", "10:22"],
    ["R007", "2 (0)", "1.42", "1.40", "132 (0)", "10:31"],
    ["R007_mini", "-", "-", "-", "-", "--"],
    ["R014", "-", "-", "1.45", "5 (0)", "10:18"],
    ["R014_mini", "-", "-", "-", "-", "--"],
  ],
  greenColumns: [3],
  redColumns: [2],
  emphasisColumns: [1, 4],
  fitToWidth: true,
  columnWidths: ["20%", "16%", "16%", "16%", "16%", "16%"],
  scrollable: true,
} as const satisfies SummaryTableSection;

export const xrepoCompareProductOptions: ReadonlyArray<{
  id: CompareProduct;
  label: string;
}> = [
  { id: "none", label: "不对比" },
  { id: "dr001", label: "DR001" },
  { id: "dr007", label: "DR007" },
  { id: "gc007", label: "GC007" },
  { id: "r007", label: "R007" },
];
