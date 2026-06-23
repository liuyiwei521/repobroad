import {
  BadgePercent,
  Banknote,
  Landmark,
  Network,
  Repeat,
} from "lucide-react";
import type { ModuleEntryConfig, ModuleEntryId, NarrowRailSummaryItem } from "../../types";

export const integratedPreviewEntryIds = new Set<ModuleEntryId>([
  "big-bank-price",
  "xrepo",
  "exchange-repo",
  "ncd",
]);

export const TODAY_STR = "2026-05-10";

export const chartPalette = {
  emerald: "var(--tk-color-success)",
  blue: "var(--tk-color-chart-blue)",
  violet: "var(--tk-color-chart-purple)",
  amber: "var(--tk-color-chart-gold)",
  pink: "var(--tk-color-chart-violet)",
  red: "var(--tk-color-danger)",
} as const;

export const moduleEntries: readonly ModuleEntryConfig[] = [
  {
    id: "big-bank-price",
    group: "行情摘要",
    title: "今天大行价格",
    description: "大行当日隔夜和 7 天资金价格",
    statusText: "10:53:27",
    icon: Banknote,
  },
  {
    id: "xrepo",
    group: "行情摘要",
    title: "XREPO",
    description: "匿名回购报价、发送与下载",
    statusText: "R001 / R007",
    icon: Repeat,
  },
  {
    id: "exchange-repo",
    group: "行情摘要",
    title: "交易所回购",
    description: "上交所、深交所核心期限行情",
    statusText: "GC001 / R-001",
    icon: Landmark,
  },
  {
    id: "ncd",
    group: "行情摘要",
    title: "NCD",
    description: "一级、二级存单收益率曲线",
    statusText: "1M / 3M / 1Y",
    icon: BadgePercent,
  },
  {
    id: "institution-period",
    group: "趋势分析",
    title: "机构分期限统计",
    description: "期限、指标、机构图例、多线图",
    statusText: "R001",
    icon: Network,
  },
] as const;

export const leftRailEntries = moduleEntries.filter(
  (entry) => entry.id !== "institution-period",
);

export const narrowRailSummaryItems: readonly NarrowRailSummaryItem[] = [
  { id: "big-bank-price", label: "大行价格", value: "R001 1.58 / 1.66" },
  {
    id: "xrepo",
    label: "XREPO",
    value: "R001 1.58 / 1.66",
    badge: "R001",
    badgeTone: "warning",
  },
  {
    id: "exchange-repo",
    label: "交易所回购",
    value: "GC007 1.55",
    badge: "延迟",
    badgeTone: "warning",
  },
  { id: "ncd", label: "NCD 同业存单", value: "AAA 1M 1.88" },
] as const;
