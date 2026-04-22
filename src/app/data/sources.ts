import type { SourceId } from "./types";

export interface SourceMeta {
  id: SourceId;
  label: string;
  periods: string[];
  defaultPeriod: string;
}

/** ① 主行情表的数据源（询价/匿名报价类） */
export const primarySources: SourceMeta[] = [
  {
    id: "xrepo",
    label: "XRepo行情",
    periods: ["1", "7", "14", "21", "28+"],
    defaultPeriod: "7",
  },
  {
    id: "bankPrice",
    label: "大行价格",
    periods: ["1", "7", "14", "21", "28+"],
    defaultPeriod: "7",
  },
  // 同业存款移至 ⑤ 展示
];

/** ② 对比行情表的数据源（有分时走势，可联动 ④） */
export const compareSources: SourceMeta[] = [
  {
    id: "exchange",
    label: "交易所回购",
    periods: ["GC001", "GC007", "GC014", "R-001", "R-007", "R-014", "R-028"],
    defaultPeriod: "GC001",
  },
  {
    id: "nonbankBest",
    label: "非银最优",
    periods: ["1", "7", "14", "28", "28+"],
    defaultPeriod: "7",
  },
];

/** 所有源合并，供 index 查询 */
export const allSources: SourceMeta[] = [
  ...primarySources,
  ...compareSources,
  {
    id: "ncd",
    label: "NCD",
    periods: ["1M", "3M", "6M", "9M", "1Y"],
    defaultPeriod: "3M",
  },
];

export const sourceMap: Record<SourceId, SourceMeta> = Object.fromEntries(
  allSources.map((s) => [s.id, s]),
) as Record<SourceId, SourceMeta>;
