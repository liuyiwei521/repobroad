import type {
  CfetsBondMetricKey,
  CfetsInstPeriod,
  CfetsMetricKey,
  CfetsTrendBlock,
} from "../../types";
import { TODAY_STR } from "../shell/shell.data";
import type {
  CfetsBondKey,
  CfetsBondRow,
  CfetsInstKey,
  CfetsInstMetricMode,
  CfetsMetricDef,
  CfetsTermRow,
  FundStructureRange,
} from "./institutionPeriod.types";

export const fundStructureLegendItems = [
  { color: "#7286d3", label: "大行" },
  { color: "#a9d57f", label: "股份行" },
  { color: "#f4cf68", label: "理财" },
  { color: "#f6a960", label: "理财子" },
  { color: "#ea7878", label: "券商" },
  { color: "#8bc6de", label: "基金" },
  { color: "#63b383", label: "保险" },
] as const;

export const fundStructureRangeTabs: Array<{ id: FundStructureRange; label: string }> =
  [
    { id: "14d", label: "14D" },
    { id: "1m", label: "1M" },
    { id: "6m", label: "6M" },
  ];

export const cfetsMatrixRowLabels = ["大型银行", "中小型银行", "其他"] as const;
export const cfetsMatrixColLabels = [
  "大型银行",
  "中小型银行",
  "基金公司及产品",
  "其他",
] as const;
export const cfetsMatrixRates: (number | null)[][] = [
  [1.2384, 1.2593, null, 1.3076],
  [1.1821, 1.2603, null, 1.3119],
  [1.3067, 1.3067, 1.4071, 1.3384],
];

// ── 机构 × 期限数据（金额单位：百万，显示时换算为亿）──
export const cfetsInstLabels: CfetsInstKey[] = [
  "大型银行",
  "中小型银行",
  "证券公司",
  "保险公司",
  "基金公司及产品",
  "货币市场基金",
  "理财子公司及理财类产品",
  "其他",
];
export const cfetsInstData: Record<CfetsInstKey, CfetsTermRow[]> = {
  大型银行: [
    {
      term: "R001",
      buyRate: 1.2269,
      buyAmt: 596900.73,
      sellRate: 1.2576,
      sellAmt: 1794867.33,
      netInflow: -330152.08,
      sellBalance: 1794867.33,
    },
    {
      term: "R007",
      buyRate: 1.4302,
      buyAmt: 15500,
      sellRate: 1.4606,
      sellAmt: 52404.88,
      netInflow: 235768.7,
      sellBalance: 2569916.13,
    },
    {
      term: "R014",
      buyRate: 1.45,
      buyAmt: 1000,
      sellRate: 1.4581,
      sellAmt: 3100,
      netInflow: 69473.21,
      sellBalance: 786323.15,
    },
    {
      term: "R021",
      buyRate: null,
      buyAmt: null,
      sellRate: null,
      sellAmt: null,
      netInflow: 1497.6,
      sellBalance: 187785.45,
    },
    {
      term: "R1M",
      buyRate: null,
      buyAmt: null,
      sellRate: 1.68,
      sellAmt: 180,
      netInflow: 16420.13,
      sellBalance: 82666.64,
    },
    {
      term: "R2M",
      buyRate: null,
      buyAmt: null,
      sellRate: null,
      sellAmt: null,
      netInflow: 1000,
      sellBalance: 18788.82,
    },
  ],
  中小型银行: [
    {
      term: "R001",
      buyRate: 1.2509,
      buyAmt: 1078715.08,
      sellRate: 1.2563,
      sellAmt: 454660.22,
      netInflow: 14675.74,
      sellBalance: 454660.22,
    },
    {
      term: "R007",
      buyRate: 1.4284,
      buyAmt: 50123.71,
      sellRate: 1.4226,
      sellAmt: 35404.91,
      netInflow: -147440.66,
      sellBalance: 673011.98,
    },
    {
      term: "R014",
      buyRate: 1.4504,
      buyAmt: 3278,
      sellRate: 1.4168,
      sellAmt: 3278,
      netInflow: -34544.37,
      sellBalance: 419214.42,
    },
    {
      term: "R021",
      buyRate: 1.4271,
      buyAmt: 350,
      sellRate: 1.4271,
      sellAmt: 350,
      netInflow: 402.4,
      sellBalance: 70763.84,
    },
    {
      term: "R1M",
      buyRate: 1.4684,
      buyAmt: 980,
      sellRate: 1.4791,
      sellAmt: 1480,
      netInflow: -2123.5,
      sellBalance: 108500.42,
    },
    {
      term: "R3M",
      buyRate: null,
      buyAmt: null,
      sellRate: 1.68,
      sellAmt: 300,
      netInflow: -300,
      sellBalance: 849.7,
    },
  ],
  证券公司: [
    {
      term: "R001",
      buyRate: 1.2984,
      buyAmt: 72056.66,
      sellRate: null,
      sellAmt: null,
      netInflow: 30407.11,
      sellBalance: null,
    },
    {
      term: "R007",
      buyRate: 1.4194,
      buyAmt: 1400.15,
      sellRate: null,
      sellAmt: null,
      netInflow: -18722.41,
      sellBalance: 71880.95,
    },
    {
      term: "R014",
      buyRate: null,
      buyAmt: null,
      sellRate: null,
      sellAmt: null,
      netInflow: -5560,
      sellBalance: 26977.39,
    },
  ],
  保险公司: [
    {
      term: "R001",
      buyRate: 1.2961,
      buyAmt: 213984.28,
      sellRate: 1.304,
      sellAmt: 77381.77,
      netInflow: 54890.05,
      sellBalance: 77381.77,
    },
    {
      term: "R007",
      buyRate: 1.5186,
      buyAmt: 22338.93,
      sellRate: 1.3379,
      sellAmt: 1763,
      netInflow: -38242.93,
      sellBalance: 324436.44,
    },
    {
      term: "R014",
      buyRate: 1.4,
      buyAmt: 900,
      sellRate: null,
      sellAmt: null,
      netInflow: -22349.84,
      sellBalance: 122083.18,
    },
    {
      term: "R021",
      buyRate: null,
      buyAmt: null,
      sellRate: null,
      sellAmt: null,
      netInflow: -2000,
      sellBalance: 10137.81,
    },
    {
      term: "R1M",
      buyRate: 1.5,
      buyAmt: 500,
      sellRate: null,
      sellAmt: null,
      netInflow: -14000,
      sellBalance: 1901.24,
    },
  ],
  基金公司及产品: [
    {
      term: "R001",
      buyRate: 1.4071,
      buyAmt: 350,
      sellRate: null,
      sellAmt: null,
      netInflow: 2212,
      sellBalance: null,
    },
    {
      term: "R007",
      buyRate: null,
      buyAmt: null,
      sellRate: null,
      sellAmt: null,
      netInflow: 5409,
      sellBalance: 190266.03,
    },
    {
      term: "R014",
      buyRate: null,
      buyAmt: null,
      sellRate: null,
      sellAmt: null,
      netInflow: -166,
      sellBalance: 78201.47,
    },
  ],
  货币市场基金: [
    {
      term: "R001",
      buyRate: null,
      buyAmt: null,
      sellRate: null,
      sellAmt: null,
      netInflow: -3954.94,
      sellBalance: null,
    },
    {
      term: "R007",
      buyRate: null,
      buyAmt: null,
      sellRate: null,
      sellAmt: null,
      netInflow: -1500,
      sellBalance: 558565.45,
    },
    {
      term: "R014",
      buyRate: null,
      buyAmt: null,
      sellRate: null,
      sellAmt: null,
      netInflow: 511,
      sellBalance: 1071531.14,
    },
  ],
  理财子公司及理财类产品: [
    {
      term: "R001",
      buyRate: 1.3088,
      buyAmt: 329386.98,
      sellRate: 1.4665,
      sellAmt: 5617.05,
      netInflow: 181449.19,
      sellBalance: 5617.05,
    },
    {
      term: "R007",
      buyRate: 1.4549,
      buyAmt: 5910.42,
      sellRate: 1.5797,
      sellAmt: 6094.32,
      netInflow: -36067.79,
      sellBalance: 377838.42,
    },
    {
      term: "R014",
      buyRate: 1.4417,
      buyAmt: 1375,
      sellRate: 1.6132,
      sellAmt: 175,
      netInflow: -11263,
      sellBalance: 306395.06,
    },
    {
      term: "R021",
      buyRate: null,
      buyAmt: null,
      sellRate: null,
      sellAmt: null,
      netInflow: 0,
      sellBalance: 27593.06,
    },
    {
      term: "R1M",
      buyRate: null,
      buyAmt: null,
      sellRate: null,
      sellAmt: null,
      netInflow: -246.63,
      sellBalance: 7257.14,
    },
  ],
  其他: [
    {
      term: "R001",
      buyRate: 1.3122,
      buyAmt: 58041.78,
      sellRate: 1.3523,
      sellAmt: 16909.14,
      netInflow: 50472.94,
      sellBalance: 16909.14,
    },
    {
      term: "R007",
      buyRate: 1.5037,
      buyAmt: 2090,
      sellRate: 1.4866,
      sellAmt: 1696.1,
      netInflow: 796.08,
      sellBalance: 632612.62,
    },
    {
      term: "R014",
      buyRate: null,
      buyAmt: null,
      sellRate: null,
      sellAmt: null,
      netInflow: 3899,
      sellBalance: 384370,
    },
    {
      term: "R1M",
      buyRate: 1.68,
      buyAmt: 180,
      sellRate: null,
      sellAmt: null,
      netInflow: 450,
      sellBalance: 46531.46,
    },
    {
      term: "R3M",
      buyRate: 1.68,
      buyAmt: 300,
      sellRate: null,
      sellAmt: null,
      netInflow: 300,
      sellBalance: 8628.78,
    },
  ],
};

// ── 机构 × 债券类型数据（金额单位：百万）──
export const cfetsInstPeriodLabels: CfetsInstPeriod[] = [
  "R001",
  "R007",
  "R014",
  "R021",
  "R1M",
  "R2M",
  "R3M",
  "R4M",
  "R6M",
  "R9M",
  "R1Y",
];
export const cfetsBondLabels: CfetsBondKey[] = ["利率债", "信用债", "同业存单"];
export const cfetsBondData: Record<CfetsBondKey, CfetsBondRow[]> = {
  利率债: [
    {
      inst: "大型银行",
      buyRate: 1.232,
      buyAmt: 608301.28,
      sellRate: 1.2597,
      sellAmt: 1717212.35,
    },
    {
      inst: "中小型银行",
      buyRate: 1.259,
      buyAmt: 1121054.59,
      sellRate: 1.2486,
      sellAmt: 342364.61,
    },
    {
      inst: "证券公司",
      buyRate: 1.2915,
      buyAmt: 53468.15,
      sellRate: null,
      sellAmt: null,
    },
    {
      inst: "保险公司",
      buyRate: 1.3144,
      buyAmt: 198955.8,
      sellRate: 1.2242,
      sellAmt: 10280.59,
    },
    {
      inst: "理财子公司及理财类产品",
      buyRate: 1.2698,
      buyAmt: 58431.77,
      sellRate: 1.6512,
      sellAmt: 2374.15,
    },
    {
      inst: "其他",
      buyRate: 1.3005,
      buyAmt: 32227.11,
      sellRate: 1.3638,
      sellAmt: 207,
    },
  ],
  信用债: [
    {
      inst: "大型银行",
      buyRate: 1.3019,
      buyAmt: 2099.45,
      sellRate: 1.3461,
      sellAmt: 28564.6,
    },
    {
      inst: "中小型银行",
      buyRate: 1.3248,
      buyAmt: 8790,
      sellRate: 1.3496,
      sellAmt: 32475.21,
    },
    {
      inst: "证券公司",
      buyRate: 1.3292,
      buyAmt: 16055.08,
      sellRate: null,
      sellAmt: null,
    },
    {
      inst: "保险公司",
      buyRate: 1.3378,
      buyAmt: 33301.4,
      sellRate: 1.3565,
      sellAmt: 29535.56,
    },
    {
      inst: "基金公司及产品",
      buyRate: 1.4,
      buyAmt: 208,
      sellRate: null,
      sellAmt: null,
    },
    {
      inst: "理财子公司及理财类产品",
      buyRate: 1.4136,
      buyAmt: 39731.76,
      sellRate: 1.5118,
      sellAmt: 7877.22,
    },
    {
      inst: "其他",
      buyRate: 1.4284,
      buyAmt: 8372.2,
      sellRate: 1.4283,
      sellAmt: 10105.3,
    },
  ],
  同业存单: [
    {
      inst: "大型银行",
      buyRate: 1.27,
      buyAmt: 3000,
      sellRate: 1.3064,
      sellAmt: 104775.26,
    },
    {
      inst: "中小型银行",
      buyRate: 1.2755,
      buyAmt: 3602.2,
      sellRate: 1.3104,
      sellAmt: 120633.3,
    },
    {
      inst: "证券公司",
      buyRate: 1.3109,
      buyAmt: 3933.58,
      sellRate: null,
      sellAmt: null,
    },
    {
      inst: "保险公司",
      buyRate: 1.3203,
      buyAmt: 5466,
      sellRate: 1.287,
      sellAmt: 39328.63,
    },
    {
      inst: "基金公司及产品",
      buyRate: 1.4176,
      buyAmt: 142,
      sellRate: null,
      sellAmt: null,
    },
    {
      inst: "理财子公司及理财类产品",
      buyRate: 1.3053,
      buyAmt: 238508.87,
      sellRate: 1.4175,
      sellAmt: 1635,
    },
    {
      inst: "其他",
      buyRate: 1.3114,
      buyAmt: 20012.47,
      sellRate: 1.2868,
      sellAmt: 8292.94,
    },
  ],
};

export const cfetsMetricDefs: CfetsMetricDef[] = [
  {
    key: "buyRate",
    label: "正回购利率",
    desc: "",
    chartType: "line",
    unit: "%",
    axisLabel: "利率(%)",
  },
  {
    key: "sellRate",
    label: "逆回购利率",
    desc: "以债券质押融出资金的加权利率，利率越高说明融出资金收益越高",
    chartType: "line",
    unit: "%",
    axisLabel: "利率(%)",
  },
  {
    key: "buyAmt",
    label: "正回购金额",
    desc: "各机构今天质押式融入资金规模，反映融资需求强度",
    chartType: "stackedBar",
    unit: "亿",
    axisLabel: "金额(亿元)",
  },
  {
    key: "sellAmt",
    label: "逆回购金额",
    desc: "各机构今天质押式融出资金规模，反映市场流动性供给",
    chartType: "stackedBar",
    unit: "亿",
    axisLabel: "金额(亿元)",
  },
  {
    key: "netInflow",
    label: "机构资金结构",
    desc: "各机构质押式回购融入融出结构，堆叠柱展示每日各机构分布",
    chartType: "divergeBar",
    unit: "亿",
    axisLabel: "金额(亿元)",
  },
  {
    key: "netInflowAmt",
    label: "净融入金额",
    desc: "各机构当日净融入资金（正回购金额 − 逆回购金额）",
    chartType: "stackedBar",
    unit: "百万",
    axisLabel: "金额(百万元)",
  },
  {
    key: "buyBalance",
    label: "正回购余额",
    desc: "各机构未到期正回购融入存量余额",
    chartType: "stackedBar",
    unit: "百万",
    axisLabel: "金额(百万元)",
  },
  {
    key: "sellBalance",
    label: "逆回购余额",
    desc: "各机构未到期逆回购融出存量余额",
    chartType: "stackedBar",
    unit: "百万",
    axisLabel: "金额(百万元)",
  },
];

export const cfetsDenseMetricOptions: Array<{
  key: CfetsInstMetricMode;
  label: string;
}> = [
  { key: "weightedRate", label: "加权利率" },
  { key: "turnover", label: "交易额" },
  { key: "balance", label: "回购余额" },
  { key: "crossMonth", label: "跨月金额" },
  { key: "netInflow", label: "净融入金额" },
];

export const cfetsPeriodColors: Record<CfetsInstPeriod, string> = {
  R001: "#637cd8",
  R007: "#8cca72",
  R014: "#f3c65f",
  R021: "#e85c67",
  R1M: "#6fb6d0",
  R2M: "#3fa36d",
  R3M: "#ff8354",
  R4M: "#8e55b0",
  R6M: "#da62b2",
  R9M: "#4f68c5",
  R1Y: "#7fbd64",
};

export const cfetsInstitutionOptions = [
  { label: "大型银行", sourceIndex: 0, factor: 0.95, color: "#637cd8" },
  { label: "大型商业/政策性银行", sourceIndex: 0, factor: 0.72, color: "#4f6cc4" },
  { label: "股份制商业银行", sourceIndex: 1, factor: 0.92, color: "#8cca72" },
  { label: "中小型银行", sourceIndex: 1, factor: 0.66, color: "#6fbf89" },
  { label: "城市商业银行", sourceIndex: 1, factor: 0.54, color: "#57b4b5" },
  { label: "农村金融机构", sourceIndex: 1, factor: 0.42, color: "#4aa3a1" },
  { label: "证券公司", sourceIndex: 4, factor: 0.9, color: "#e85c67" },
  { label: "保险公司", sourceIndex: 6, factor: 0.9, color: "#f3a85d" },
  { label: "基金公司及产品", sourceIndex: 5, factor: 0.86, color: "#6fb6d0" },
  { label: "货币市场基金", sourceIndex: 5, factor: 0.62, color: "#74b6e6" },
  { label: "理财子公司及理财类产品", sourceIndex: 3, factor: 0.94, color: "#8e55b0" },
  { label: "其他产品类", sourceIndex: 2, factor: 0.48, color: "#da62b2" },
  { label: "其他", sourceIndex: 2, factor: 0.36, color: "#a1a1aa" },
] as const;
export const cfetsDefaultInstitutionIndexes = [0, 2, 6, 7, 8, 10, 12] as const;

const INST_ONLY_METRIC_KEYS = new Set<CfetsMetricKey>([
  "netInflow",
  "netInflowAmt",
  "buyBalance",
  "sellBalance",
]);
export const cfetsBondMetricDefs = cfetsMetricDefs.filter(
  (d) => !INST_ONLY_METRIC_KEYS.has(d.key),
);

// ── 趋势数据生成 ──────────────────────────────────────────
function generateTradingDates(endDate: string, count: number): string[] {
  const [y, m, d] = endDate.split("-").map(Number);
  const end = new Date(y, m - 1, d);
  const dates: string[] = [];
  let cur = new Date(end);
  while (dates.length < count) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) {
      dates.unshift(
        `${cur.getMonth() + 1}/${String(cur.getDate()).padStart(2, "0")}`,
      );
    }
    cur.setDate(cur.getDate() - 1);
  }
  return dates;
}

function randomWalk(
  anchor: number,
  count: number,
  dailyVol: number,
  _seed: number,
): number[] {
  const result: number[] = new Array(count);
  result[count - 1] = anchor;
  for (let i = count - 2; i >= 0; i--) {
    // 离散跳跃：40% 小幅 + 38% 中等 + 22% 大幅，强随机锯齿
    const r = Math.random();
    let jump: number;
    if (r < 0.4) {
      jump = (Math.random() - 0.5) * dailyVol * 1.5;
    } else if (r < 0.78) {
      jump = (Math.random() - 0.5) * dailyVol * 7;
    } else {
      jump = (Math.random() - 0.5) * dailyVol * 18;
    }
    result[i] = Math.max(0, Number((result[i + 1] + jump).toFixed(4)));
  }
  return result;
}

const cfetsTrendCounts: Record<FundStructureRange, number> = {
  "14d": 14,
  "1m": 22,
  "6m": 130,
};

// 机构图例顺序：大行/股份行/理财/理财子/券商/基金/保险
// 锚点取自 2026-01-04 真实数据，顺序对应 fundStructureLegendItems
type CfetsInstAnchorBase = Record<
  Exclude<CfetsMetricKey, "netInflowAmt" | "buyBalance" | "sellBalance">,
  number[]
>;
const cfetsInstAnchorsBase: Record<CfetsInstPeriod, CfetsInstAnchorBase> = {
  R001: {
    buyRate: [1.201, 1.225, 1.283, 1.283, 1.273, 1.382, 1.271],
    sellRate: [
      1.232,
      1.231,
      1.441,
      1.441,
      null as unknown as number,
      null as unknown as number,
      1.279,
    ],
    buyAmt: [4500, 8500, 2500, 2500, 550, 3, 1600],
    sellAmt: [14000, 3500, 40, 40, 0, 0, 600],
    netInflow: [-2600, 110, 1400, 1400, 230, 60, 420],
  },
  R007: {
    buyRate: [1.245, 1.269, 1.327, 1.327, 1.317, 1.426, 1.315],
    sellRate: [
      1.276,
      1.275,
      1.485,
      1.485,
      null as unknown as number,
      null as unknown as number,
      1.323,
    ],
    buyAmt: [1200, 1900, 680, 680, 145, 1, 440],
    sellAmt: [3200, 880, 13, 13, 0, 0, 140],
    netInflow: [-570, 30, 350, 350, 60, 12, 105],
  },
  R014: {
    buyRate: [1.268, 1.292, 1.351, 1.351, 1.342, 1.451, 1.338],
    sellRate: [
      1.301,
      1.3,
      1.511,
      1.511,
      null as unknown as number,
      null as unknown as number,
      1.348,
    ],
    buyAmt: [220, 320, 95, 95, 22, 0, 85],
    sellAmt: [620, 140, 2, 2, 0, 0, 28],
    netInflow: [-108, 4, 55, 55, 12, 3, 20],
  },
  R021: {
    buyRate: [1.292, 1.317, 1.376, 1.376, 1.368, 1.478, 1.363],
    sellRate: [
      1.327,
      1.326,
      1.538,
      1.538,
      null as unknown as number,
      null as unknown as number,
      1.374,
    ],
    buyAmt: [42, 62, 18, 18, 4, 0, 15],
    sellAmt: [125, 26, 0.5, 0.5, 0, 0, 6],
    netInflow: [-22, 1, 10, 10, 2, 0.5, 4],
  },
  R1M: {
    buyRate: [1.315, 1.341, 1.402, 1.402, 1.395, 1.506, 1.389],
    sellRate: [
      1.354,
      1.353,
      1.566,
      1.566,
      null as unknown as number,
      null as unknown as number,
      1.401,
    ],
    buyAmt: [5, 7, 1, 1, 0.5, 0, 2],
    sellAmt: [4, 1, 0.1, 0.1, 0, 0, 0.2],
    netInflow: [-1, 0.2, 0.5, 0.5, 0.1, 0.05, 0.5],
  },
  R2M: {
    buyRate: [1.345, 1.371, 1.432, 1.432, 1.425, 1.536, 1.419],
    sellRate: [
      1.384,
      1.383,
      1.596,
      1.596,
      null as unknown as number,
      null as unknown as number,
      1.431,
    ],
    buyAmt: [3.5, 5, 0.7, 0.7, 0.3, 0, 1.4],
    sellAmt: [2.8, 0.7, 0.07, 0.07, 0, 0, 0.14],
    netInflow: [-0.7, 0.14, 0.35, 0.35, 0.07, 0.03, 0.35],
  },
  R3M: {
    buyRate: [1.375, 1.401, 1.462, 1.462, 1.455, 1.566, 1.449],
    sellRate: [
      1.414,
      1.413,
      1.626,
      1.626,
      null as unknown as number,
      null as unknown as number,
      1.461,
    ],
    buyAmt: [2.5, 3.5, 0.5, 0.5, 0.2, 0, 1],
    sellAmt: [2, 0.5, 0.05, 0.05, 0, 0, 0.1],
    netInflow: [-0.5, 0.1, 0.25, 0.25, 0.05, 0.02, 0.25],
  },
  R4M: {
    buyRate: [1.405, 1.431, 1.492, 1.492, 1.485, 1.596, 1.479],
    sellRate: [
      1.444,
      1.443,
      1.656,
      1.656,
      null as unknown as number,
      null as unknown as number,
      1.491,
    ],
    buyAmt: [1.8, 2.5, 0.35, 0.35, 0.15, 0, 0.7],
    sellAmt: [1.4, 0.35, 0.03, 0.03, 0, 0, 0.07],
    netInflow: [-0.35, 0.07, 0.18, 0.18, 0.04, 0.01, 0.18],
  },
  R6M: {
    buyRate: [1.455, 1.481, 1.542, 1.542, 1.535, 1.646, 1.529],
    sellRate: [
      1.494,
      1.493,
      1.706,
      1.706,
      null as unknown as number,
      null as unknown as number,
      1.541,
    ],
    buyAmt: [1.2, 1.8, 0.25, 0.25, 0.1, 0, 0.5],
    sellAmt: [1, 0.25, 0.02, 0.02, 0, 0, 0.05],
    netInflow: [-0.25, 0.05, 0.12, 0.12, 0.025, 0.01, 0.12],
  },
  R9M: {
    buyRate: [1.505, 1.531, 1.592, 1.592, 1.585, 1.696, 1.579],
    sellRate: [
      1.544,
      1.543,
      1.756,
      1.756,
      null as unknown as number,
      null as unknown as number,
      1.591,
    ],
    buyAmt: [0.8, 1.2, 0.18, 0.18, 0.07, 0, 0.35],
    sellAmt: [0.7, 0.18, 0.015, 0.015, 0, 0, 0.03],
    netInflow: [-0.18, 0.03, 0.09, 0.09, 0.02, 0.005, 0.09],
  },
  R1Y: {
    buyRate: [1.555, 1.581, 1.642, 1.642, 1.635, 1.746, 1.629],
    sellRate: [
      1.594,
      1.593,
      1.806,
      1.806,
      null as unknown as number,
      null as unknown as number,
      1.641,
    ],
    buyAmt: [0.5, 0.8, 0.12, 0.12, 0.05, 0, 0.22],
    sellAmt: [0.4, 0.12, 0.01, 0.01, 0, 0, 0.02],
    netInflow: [-0.12, 0.02, 0.06, 0.06, 0.015, 0.003, 0.06],
  },
};

// 在 base 上派生 3 个 inst-only 指标：净融入金额 / 正回购余额 / 逆回购余额（单位百万）
const cfetsInstAnchors: Record<
  CfetsInstPeriod,
  Record<CfetsMetricKey, number[]>
> = Object.fromEntries(
  Object.entries(cfetsInstAnchorsBase).map(([period, m]) => [
    period,
    {
      ...m,
      netInflowAmt: m.sellAmt.map(
        (s, i) => Math.round((s - m.buyAmt[i]) * 10) / 10,
      ),
      buyBalance: m.buyAmt.map((v) => Math.round(v * 6 * 10) / 10),
      sellBalance: m.sellAmt.map((v) => Math.round(v * 6 * 10) / 10),
    },
  ]),
) as Record<CfetsInstPeriod, Record<CfetsMetricKey, number[]>>;

function buildInstTrendBlock(
  period: CfetsInstPeriod,
  metricKey: CfetsMetricKey,
  range: FundStructureRange,
): CfetsTrendBlock {
  const count = cfetsTrendCounts[range];
  const dates = generateTradingDates(TODAY_STR, count);
  const anchors = cfetsInstAnchors[period][metricKey];
  const isRate = metricKey === "buyRate" || metricKey === "sellRate";
  const vol = isRate ? 0.04 : metricKey === "netInflow" ? 800 : 2000;
  const series = anchors.map((anchor, i) => {
    const base = anchor ?? 0;
    return randomWalk(base, count, vol, (i + 1) * 7 + metricKey.length);
  });
  return { dates, series };
}

export const cfetsInstTrend: Record<
  CfetsInstPeriod,
  Record<CfetsMetricKey, Record<FundStructureRange, CfetsTrendBlock>>
> = Object.fromEntries(
  cfetsInstPeriodLabels.map((period) => [
    period,
    Object.fromEntries(
      (
        [
          "buyRate",
          "sellRate",
          "buyAmt",
          "sellAmt",
          "netInflow",
          "netInflowAmt",
          "buyBalance",
          "sellBalance",
        ] as CfetsMetricKey[]
      ).map((mk) => [
        mk,
        Object.fromEntries(
          (["14d", "1m", "6m"] as FundStructureRange[]).map((r) => [
            r,
            buildInstTrendBlock(period, mk, r),
          ]),
        ),
      ]),
    ),
  ]),
) as Record<
  CfetsInstPeriod,
  Record<CfetsMetricKey, Record<FundStructureRange, CfetsTrendBlock>>
>;

// 债券趋势锚点：[大行, 股份行, 理财, 理财子, 券商, 基金, 保险]
const cfetsBondAnchors: Record<
  CfetsBondKey,
  Record<CfetsBondMetricKey, number[]>
> = {
  利率债: {
    buyRate: [
      1.232,
      1.259,
      1.27,
      1.27,
      1.292,
      null as unknown as number,
      1.314,
    ],
    sellRate: [
      1.26,
      1.249,
      1.651,
      1.651,
      null as unknown as number,
      null as unknown as number,
      1.224,
    ],
    buyAmt: [6083, 11211, 584, 584, 535, 0, 1990],
    sellAmt: [17172, 3424, 24, 24, 0, 0, 103],
  },
  信用债: {
    buyRate: [1.302, 1.325, 1.414, 1.414, 1.329, 1.4, 1.338],
    sellRate: [
      1.346,
      1.35,
      1.512,
      1.512,
      null as unknown as number,
      null as unknown as number,
      1.357,
    ],
    buyAmt: [21, 88, 397, 397, 161, 2, 333],
    sellAmt: [286, 325, 79, 79, 0, 0, 295],
  },
  同业存单: {
    buyRate: [1.27, 1.276, 1.305, 1.305, 1.311, 1.418, 1.32],
    sellRate: [
      1.306,
      1.31,
      1.418,
      1.418,
      null as unknown as number,
      null as unknown as number,
      1.287,
    ],
    buyAmt: [30, 36, 2385, 2385, 39, 1, 55],
    sellAmt: [1048, 1206, 16, 16, 0, 0, 393],
  },
};

function buildBondTrendBlock(
  bondKey: CfetsBondKey,
  metricKey: CfetsBondMetricKey,
  range: FundStructureRange,
): CfetsTrendBlock {
  const count = cfetsTrendCounts[range];
  const dates = generateTradingDates(TODAY_STR, count);
  const anchors = cfetsBondAnchors[bondKey][metricKey];
  const isRate = metricKey === "buyRate" || metricKey === "sellRate";
  const vol = isRate ? 0.035 : 1400;
  const series = anchors.map((anchor, i) => {
    const base = anchor ?? 0;
    return randomWalk(base, count, vol, (i + 3) * 11 + bondKey.length);
  });
  return { dates, series };
}

export const cfetsBondTrend: Record<
  CfetsBondKey,
  Record<CfetsBondMetricKey, Record<FundStructureRange, CfetsTrendBlock>>
> = Object.fromEntries(
  (["利率债", "信用债", "同业存单"] as CfetsBondKey[]).map((bk) => [
    bk,
    Object.fromEntries(
      (
        ["buyRate", "sellRate", "buyAmt", "sellAmt"] as CfetsBondMetricKey[]
      ).map((mk) => [
        mk,
        Object.fromEntries(
          (["14d", "1m", "6m"] as FundStructureRange[]).map((r) => [
            r,
            buildBondTrendBlock(bk, mk, r),
          ]),
        ),
      ]),
    ),
  ]),
) as Record<
  CfetsBondKey,
  Record<CfetsBondMetricKey, Record<FundStructureRange, CfetsTrendBlock>>
>;
