import type { NcdAllPeriodGroup, NcdPeriod, NcdPrimaryGroup, NcdTrendRange } from "./ncd.types";
import { generateTradingDates, randomWalk } from "./ncd.utils";

export const NCD_ENTRY_TITLE = "NCD";
export const NCD_ENTRY_BADGE = "近14日";
export const NCD_SECONDARY_BADGE = "一级";

export const ncdTrendSeries = randomWalk(2.03, 14, 0.015, 15);
export const ncdThreeMonthSeries = randomWalk(2.07, 14, 0.015, 16);
export const ncdOneYearSeries = randomWalk(2.13, 14, 0.015, 17);
export const ncdSecondaryGov6m = randomWalk(1.98, 130, 0.006, 40);
export const ncdSecondaryAAA6m = randomWalk(2.03, 130, 0.006, 41);
export const ncdSecondaryAAPlus6m = randomWalk(2.08, 130, 0.007, 42);
export const ncdSecondaryAA6m = randomWalk(2.13, 130, 0.007, 43);

export const auxChartLabels = [
  "4/27",
  "4/28",
  "4/29",
  "4/30",
  "5/1",
  "5/2",
  "5/3",
  "5/4",
  "5/5",
  "5/6",
  "5/7",
  "5/8",
  "5/9",
  "5/10",
] as const;

export const compactAuxChartLabels = [
  "4/27",
  "4/29",
  "5/1",
  "5/3",
  "5/5",
  "5/7",
  "5/10",
] as const;

export const ncdTableRows = [
  ["14D", "2.01%", "+1", "1.99%", "10:53:27"],
  ["1M", "2.03%", "+2", "2.01%", "10:53:27"],
  ["2M", "2.05%", "+1", "2.03%", "10:53:27"],
  ["3M", "2.07%", "+1", "2.05%", "10:53:27"],
  ["6M", "2.11%", "+1", "2.08%", "10:53:27"],
  ["9M", "2.14%", "0", "2.11%", "10:53:27"],
  ["1Y", "2.13%", "-1", "2.10%", "10:53:27"],
  ["18M", "2.16%", "-1", "2.13%", "10:53:27"],
  ["2Y", "2.18%", "-2", "2.15%", "10:53:27"],
  ["3Y", "2.22%", "-2", "2.18%", "10:53:27"],
] as const;

export const ncdPrimaryPeriods: NcdPeriod[] = ["1M", "3M", "6M", "9M", "1Y"];

export const NCD_PERIOD_OFFSET: Record<NcdPeriod, number> = {
  "1M": 0,
  "3M": 0.1,
  "6M": 0.2,
  "9M": 0.25,
  "1Y": 0.28,
};

export const ncdPrimaryGovBase = [
  1.96, 1.95, 1.96, 1.97, 1.96, 1.97, 1.97, 1.98, 1.97, 1.98, 1.99, 1.98, 1.99,
  2.0,
];

export const ncdPrimaryAAABase = [
  2.0, 2.0, 2.01, 2.02, 2.01, 2.02, 2.02, 2.03, 2.03, 2.04, 2.04, 2.03, 2.05,
  2.05,
];

export const ncdPrimaryAAPlsBase = [
  2.05, 2.04, 2.06, 2.06, 2.06, 2.07, 2.07, 2.08, 2.08, 2.09, 2.09, 2.09, 2.1,
  2.1,
];

export const ncdPrimaryAABase = [
  2.1, 2.1, 2.11, 2.12, 2.11, 2.12, 2.12, 2.13, 2.13, 2.14, 2.14, 2.14, 2.15,
  2.15,
];

export const NCD_TREND_COUNTS: Record<NcdTrendRange, number> = {
  "14d": 14,
  "1m": 22,
  "3m": 65,
  "6m": 130,
};

export const ncdTrendRangeTabs: Array<{ id: NcdTrendRange; label: string }> = [
  { id: "14d", label: "14D" },
  { id: "1m", label: "1M" },
  { id: "3m", label: "3M" },
  { id: "6m", label: "6M" },
];

export const ncdPrimaryGovBase6m = randomWalk(2.0, 130, 0.006, 20);
export const ncdPrimaryAAABase6m = randomWalk(2.05, 130, 0.006, 21);
export const ncdPrimaryAAPlsBase6m = randomWalk(2.1, 130, 0.007, 22);
export const ncdPrimaryAABase6m = randomWalk(2.15, 130, 0.007, 23);

export const ncdPrimary1MGroups: NcdPrimaryGroup[] = [
  {
    label: "国有/股份制",
    rows: [
      { name: "浦发银行", rate: "1.320" },
      { name: "渤海银行", rate: "1.330" },
    ],
  },
  {
    label: "AAA",
    rows: [
      { name: "成都银行", rate: "1.300" },
      { name: "哈尔滨银行", rate: "1.300" },
      { name: "宁波银行", rate: "1.315" },
      { name: "桂林银行", rate: "1.320" },
      { name: "渝农商行", rate: "1.325", change: "+2.5" },
    ],
  },
  {
    label: "AA+",
    rows: [
      { name: "南粤银行", rate: "1.310" },
      { name: "江门农商行", rate: "1.330" },
      { name: "富民银行", rate: "1.500", marker: true },
    ],
  },
  {
    label: "AA",
    rows: [
      { name: "威海银行", rate: "1.380", change: "+5.0" },
      { name: "蒙商银行", rate: "1.420" },
    ],
  },
];

export const ncdColHeaders: Record<
  NcdPeriod,
  { dow: string; date: string; count?: string }
> = {
  "1M": { dow: "周一", date: "26-06-08" },
  "3M": { dow: "周六", date: "26-08-08", count: "2/2" },
  "6M": { dow: "周日", date: "26-11-08", count: "1/1" },
  "9M": { dow: "周一", date: "27-02-08", count: "7/4" },
  "1Y": { dow: "周六", date: "27-05-08", count: "2/2" },
};

export const ncdAllPeriodsData: NcdAllPeriodGroup[] = [
  {
    label: "国有/股份制",
    cells: {
      "1M": [],
      "3M": [
        { name: "浦发银行", rate: "1.33" },
        { name: "渤海银行", rate: "1.36" },
      ],
      "6M": [{ name: "渤海银行", rate: "1.41" }],
      "9M": [{ name: "渤海银行", rate: "1.41" }],
      "1Y": [{ name: "渤海银行", rate: "1.46" }],
    },
  },
  {
    label: "AAA",
    cells: {
      "1M": [
        { name: "成都银行", rate: "1.300" },
        { name: "哈尔滨银行", rate: "1.300" },
        { name: "宁波银行", rate: "1.315" },
        { name: "桂林银行", rate: "1.320" },
        { name: "渝农商行", rate: "1.325", change: "+2.5" },
      ],
      "3M": [
        { name: "成都银行", rate: "1.350" },
        { name: "桂林银行", rate: "1.360" },
        { name: "唐山银行", rate: "1.360" },
        { name: "日照银行", rate: "1.360" },
        { name: "大连银行", rate: "1.390" },
        { name: "富滇银行", rate: "1.390" },
        { name: "哈尔滨银行", rate: "1.390" },
      ],
      "6M": [
        { name: "南京银行", rate: "1.390" },
        { name: "徽商银行", rate: "1.400" },
        { name: "九江银行", rate: "1.400" },
        { name: "成都银行", rate: "1.400" },
        { name: "广州农商行", rate: "1.410" },
        { name: "宁波银行", rate: "1.420" },
        { name: "富滇银行", rate: "1.420" },
        { name: "桂林银行", rate: "1.420" },
        { name: "唐山银行", rate: "1.420" },
        { name: "哈尔滨银行", rate: "1.430" },
        { name: "大连银行", rate: "1.430" },
      ],
      "9M": [
        { name: "徽商银行", rate: "1.430" },
        { name: "南京银行", rate: "1.430" },
        { name: "广州农商行", rate: "1.430" },
        { name: "成都银行", rate: "1.440" },
        { name: "唐山银行", rate: "1.440" },
        { name: "汉口银行", rate: "1.440" },
        { name: "桂林银行", rate: "1.440" },
        { name: "日照银行", rate: "1.450" },
        { name: "宁波银行", rate: "1.450" },
        { name: "富滇银行", rate: "1.460" },
        { name: "大连银行", rate: "1.460" },
        { name: "哈尔滨银行", rate: "1.460" },
      ],
      "1Y": [
        { name: "广州农商行", rate: "1.450" },
        { name: "南京银行", rate: "1.450" },
        { name: "徽商银行", rate: "1.450" },
        { name: "九江银行", rate: "1.460" },
        { name: "唐山银行", rate: "1.460" },
        { name: "汉口银行", rate: "1.460" },
        { name: "成都银行", rate: "1.460" },
        { name: "桂林银行", rate: "1.460" },
        { name: "宁波银行", rate: "1.460" },
        { name: "东莞银行", rate: "1.465" },
        { name: "杭州银行", rate: "1.470" },
        { name: "日照银行", rate: "1.470" },
        { name: "大连银行", rate: "1.480" },
        { name: "哈尔滨银行", rate: "1.480" },
        { name: "富滇银行", rate: "1.480" },
        { name: "渝农商行", rate: "1.480", limitNonBank: true },
      ],
    },
  },
  {
    label: "AA+",
    cells: {
      "1M": [
        { name: "南粤银行", rate: "1.310" },
        { name: "江门农商行", rate: "1.330" },
        { name: "东营银行", rate: "1.350" },
        { name: "廊坊银行", rate: "1.360" },
        { name: "绍兴银行", rate: "1.370" },
        { name: "台州银行", rate: "1.375" },
        { name: "温州银行", rate: "1.380" },
        { name: "广州银行", rate: "1.385" },
        { name: "贵阳银行", rate: "1.390" },
        { name: "郑州银行", rate: "1.395" },
        { name: "青岛农商行", rate: "1.400" },
        { name: "无锡农商行", rate: "1.410" },
        { name: "苏农银行", rate: "1.420" },
        { name: "江阴银行", rate: "1.430" },
        { name: "张家港行", rate: "1.435" },
        { name: "富民银行", rate: "1.500", limitNonBank: true },
      ],
      "3M": [
        { name: "长沙农商行", rate: "1.380" },
        { name: "江门农商行", rate: "1.410" },
        { name: "秦农农商行", rate: "1.420" },
        { name: "南粤银行", rate: "1.420" },
        { name: "中山农商行", rate: "1.420" },
        { name: "台州银行", rate: "1.425" },
        { name: "广州银行", rate: "1.428" },
        { name: "东营银行", rate: "1.430" },
        { name: "廊坊银行", rate: "1.430" },
        { name: "温州银行", rate: "1.432" },
        { name: "南海农商行", rate: "1.435" },
        { name: "绍兴银行", rate: "1.438" },
        { name: "贵阳银行", rate: "1.438" },
        { name: "张家口银行", rate: "1.440" },
        { name: "顺德农商行", rate: "1.440" },
        { name: "郑州银行", rate: "1.442" },
        { name: "青岛农商行", rate: "1.445" },
        { name: "无锡农商行", rate: "1.448" },
        { name: "苏农银行", rate: "1.450" },
        { name: "江阴银行", rate: "1.452" },
        { name: "张家港行", rate: "1.455" },
      ],
      "6M": [
        { name: "长沙农商行", rate: "1.410" },
        { name: "秦农农商行", rate: "1.430" },
        { name: "中山农商行", rate: "1.430" },
        { name: "台州银行", rate: "1.432" },
        { name: "东营银行", rate: "1.435" },
        { name: "广州银行", rate: "1.438" },
        { name: "江门农商行", rate: "1.440" },
        { name: "南粤银行", rate: "1.440" },
        { name: "廊坊银行", rate: "1.440" },
        { name: "温州银行", rate: "1.442" },
        { name: "南海农商行", rate: "1.445" },
        { name: "贵阳银行", rate: "1.448" },
        { name: "顺德农商行", rate: "1.450" },
        { name: "绍兴银行", rate: "1.450" },
        { name: "张家口银行", rate: "1.450" },
        { name: "郑州银行", rate: "1.452" },
        { name: "青岛农商行", rate: "1.455" },
        { name: "石嘴山银行", rate: "1.460" },
        { name: "无锡农商行", rate: "1.460" },
        { name: "苏农银行", rate: "1.462" },
        { name: "江阴银行", rate: "1.465" },
        { name: "张家港行", rate: "1.468" },
      ],
      "9M": [
        { name: "长沙农商行", rate: "1.440" },
        { name: "秦农农商行", rate: "1.440" },
        { name: "新疆银行", rate: "1.450" },
        { name: "中山农商行", rate: "1.450" },
        { name: "台州银行", rate: "1.450" },
        { name: "东营银行", rate: "1.450" },
        { name: "广州银行", rate: "1.452" },
        { name: "廊坊银行", rate: "1.455" },
        { name: "温州银行", rate: "1.455" },
        { name: "南海农商行", rate: "1.458" },
        { name: "贵阳银行", rate: "1.460" },
        { name: "江门农商行", rate: "1.460" },
        { name: "顺德农商行", rate: "1.460" },
        { name: "绍兴银行", rate: "1.462" },
        { name: "长安银行", rate: "1.460", limitNonBank: true },
        { name: "郑州银行", rate: "1.465" },
        { name: "青岛农商行", rate: "1.468" },
        { name: "石嘴山银行", rate: "1.470" },
        { name: "无锡农商行", rate: "1.470" },
        { name: "苏农银行", rate: "1.472" },
        { name: "江阴银行", rate: "1.475" },
        { name: "张家港行", rate: "1.478" },
      ],
      "1Y": [
        { name: "长沙农商行", rate: "1.450" },
        { name: "秦农农商行", rate: "1.450" },
        { name: "南粤银行", rate: "1.460" },
        { name: "台州银行", rate: "1.462" },
        { name: "东营银行", rate: "1.465" },
        { name: "广州银行", rate: "1.465" },
        { name: "中山农商行", rate: "1.470" },
        { name: "新疆银行", rate: "1.470" },
        { name: "廊坊银行", rate: "1.470" },
        { name: "温州银行", rate: "1.470" },
        { name: "江门农商行", rate: "1.470" },
        { name: "贵阳银行", rate: "1.472" },
        { name: "南海农商行", rate: "1.472" },
        { name: "顺德农商行", rate: "1.475" },
        { name: "绍兴银行", rate: "1.478" },
        { name: "郑州银行", rate: "1.478" },
        { name: "长安银行", rate: "1.480", limitNonBank: true },
        { name: "石嘴山银行", rate: "1.485" },
        { name: "青岛农商行", rate: "1.485" },
        { name: "无锡农商行", rate: "1.488" },
        { name: "苏农银行", rate: "1.490" },
        { name: "江阴银行", rate: "1.492" },
        { name: "张家港行", rate: "1.495" },
      ],
    },
  },
  {
    label: "AA",
    cells: {
      "1M": [
        { name: "威海银行", rate: "1.380", change: "+5.0" },
        { name: "蒙商银行", rate: "1.420" },
        { name: "乌鲁木齐银行", rate: "1.450" },
        { name: "齐商银行", rate: "1.460" },
        { name: "葫芦岛银行", rate: "1.480" },
        { name: "盐城银行", rate: "1.490" },
        { name: "晋商银行", rate: "1.495" },
        { name: "泸州银行", rate: "1.500" },
        { name: "昆仑银行", rate: "1.505" },
        { name: "宁夏银行", rate: "1.510" },
        { name: "吉林银行", rate: "1.515" },
        { name: "贵州银行", rate: "1.520" },
        { name: "九台农商行", rate: "1.525" },
        { name: "大庆银行", rate: "1.530" },
        { name: "湖北银行", rate: "1.535" },
      ],
      "3M": [
        { name: "威海银行", rate: "1.420" },
        { name: "泰安银行", rate: "1.450" },
        { name: "蒙商银行", rate: "1.460" },
        { name: "乌鲁木齐银行", rate: "1.470" },
        { name: "齐商银行", rate: "1.475" },
        { name: "龙江银行", rate: "1.480" },
        { name: "盐城银行", rate: "1.485" },
        { name: "葫芦岛银行", rate: "1.490" },
        { name: "晋商银行", rate: "1.492" },
        { name: "赤峰银行", rate: "1.495" },
        { name: "泸州银行", rate: "1.498" },
        { name: "甘肃银行", rate: "1.500" },
        { name: "昆仑银行", rate: "1.502" },
        { name: "宁夏银行", rate: "1.505" },
        { name: "吉林银行", rate: "1.508" },
        { name: "贵州银行", rate: "1.510" },
        { name: "九台农商行", rate: "1.515" },
        { name: "大庆银行", rate: "1.518" },
        { name: "湖北银行", rate: "1.520" },
      ],
      "6M": [
        { name: "威海银行", rate: "1.450" },
        { name: "泰安银行", rate: "1.470" },
        { name: "乌鲁木齐银行", rate: "1.480" },
        { name: "蒙商银行", rate: "1.480" },
        { name: "齐商银行", rate: "1.485" },
        { name: "盐城银行", rate: "1.490" },
        { name: "龙江银行", rate: "1.500" },
        { name: "晋商银行", rate: "1.500" },
        { name: "葫芦岛银行", rate: "1.505" },
        { name: "泸州银行", rate: "1.508" },
        { name: "赤峰银行", rate: "1.510" },
        { name: "甘肃银行", rate: "1.515" },
        { name: "昆仑银行", rate: "1.518" },
        { name: "宁夏银行", rate: "1.520" },
        { name: "吉林银行", rate: "1.522" },
        { name: "贵州银行", rate: "1.525" },
        { name: "九台农商行", rate: "1.528" },
        { name: "大庆银行", rate: "1.530" },
        { name: "湖北银行", rate: "1.535" },
      ],
      "9M": [
        { name: "威海银行", rate: "1.470" },
        { name: "泰安银行", rate: "1.490" },
        { name: "乌鲁木齐银行", rate: "1.495" },
        { name: "蒙商银行", rate: "1.500" },
        { name: "盐城银行", rate: "1.502" },
        { name: "齐商银行", rate: "1.505" },
        { name: "晋商银行", rate: "1.508" },
        { name: "龙江银行", rate: "1.510" },
        { name: "泸州银行", rate: "1.512" },
        { name: "赤峰银行", rate: "1.520" },
        { name: "甘肃银行", rate: "1.525" },
        { name: "昆仑银行", rate: "1.528" },
        { name: "宁夏银行", rate: "1.530" },
        { name: "吉林银行", rate: "1.532" },
        { name: "贵州银行", rate: "1.535" },
        { name: "九台农商行", rate: "1.538" },
        { name: "大庆银行", rate: "1.540" },
        { name: "湖北银行", rate: "1.545" },
      ],
      "1Y": [
        { name: "威海银行", rate: "1.490" },
        { name: "泰安银行", rate: "1.510" },
        { name: "乌鲁木齐银行", rate: "1.515" },
        { name: "齐商银行", rate: "1.518" },
        { name: "盐城银行", rate: "1.518" },
        { name: "蒙商银行", rate: "1.520", change: "+2.5" },
        { name: "晋商银行", rate: "1.522" },
        { name: "龙江银行", rate: "1.525" },
        { name: "泸州银行", rate: "1.525" },
        { name: "葫芦岛银行", rate: "1.530" },
        { name: "赤峰银行", rate: "1.535" },
        { name: "甘肃银行", rate: "1.540" },
        { name: "昆仑银行", rate: "1.542" },
        { name: "宁夏银行", rate: "1.545" },
        { name: "吉林银行", rate: "1.548" },
        { name: "贵州银行", rate: "1.550" },
        { name: "九台农商行", rate: "1.552" },
        { name: "大庆银行", rate: "1.555" },
        { name: "湖北银行", rate: "1.558" },
      ],
    },
  },
];

export function createNcdTrendDates(todayStr: string) {
  return generateTradingDates(todayStr, 130);
}
