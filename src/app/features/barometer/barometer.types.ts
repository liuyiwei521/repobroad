export type BarometerRange = "overnight" | "7d";
export type BarometerMetric = "price" | "count";
export type BarometerLineStyle = "solid" | "dashed";

export type BarometerPoint = {
  t: string;
  value: number;
};

export type BarometerSeries = {
  key: string;
  label: string;
  color: string;
  lineStyle: BarometerLineStyle;
  points: BarometerPoint[];
};

export type BarometerSlice = {
  yUnit: string;
  yLabel: string;
  series: BarometerSeries[];
};

export type QtInstitutionType =
  | "all"
  | "large-bank"
  | "joint-bank"
  | "city-bank"
  | "broker"
  | "fund";

export type BarometerInstitutionProfile = {
  factor: number;
  amPeakShift: number;
  pmPeakShift: number;
  amPeakScale: number;
  pmPeakScale: number;
  amWidth: number;
  pmWidth: number;
  valleyFloor: number;
  drift: number;
  wobble: number;
  seed: number;
};

export type BarometerPriceAnchor = {
  index: number;
  offset: number;
};

export type PersonalInstitutionMode = "tenor" | "collateral";

export type PersonalInstitutionKey =
  | "R001"
  | "R007"
  | "\u5b58\u5355\u5546\u91d1"
  | "\u4fe1\u7528"
  | "\u5229\u7387\u5730\u65b9";

export type PersonalInstitutionCompareItem = {
  key: PersonalInstitutionKey;
  label: string;
  color: string;
  personal: number[];
  institutionWeighted: number[];
  personalCount: number[];
  institutionCount: number[];
};
