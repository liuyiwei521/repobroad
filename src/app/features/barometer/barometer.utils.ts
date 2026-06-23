import type {
  BarometerInstitutionProfile,
  BarometerPoint,
  BarometerPriceAnchor,
  BarometerSeries,
} from "./barometer.types";

const barometerAmSlots = [
  "08:15",
  "08:30",
  "08:45",
  "09:00",
  "09:15",
  "09:30",
  "09:45",
  "10:00",
  "10:15",
  "10:30",
  "10:45",
  "11:00",
  "11:15",
] as const;

const barometerPmSlots = [
  "13:15",
  "13:30",
  "13:45",
  "14:00",
  "14:15",
  "14:30",
  "14:45",
  "15:00",
  "15:15",
  "15:30",
  "15:45",
  "16:00",
] as const;

export const barometerTimeline = [...barometerAmSlots, ...barometerPmSlots];

const barometerOutColor = "#ffa028";
const barometerInColor = "#1872f6";

const intradayQuoteHeat = [0.08, 1, 0.46, 0.16, 0.04, 0.22, 0.76];
const intradayRatePressure = [0.12, 1, 0.52, 0.24, 0.02, 0.28, 0.82];
const intradayNoise = [-0.006, 0.012, -0.003, -0.008, -0.012, 0.004, 0.01];
const institutionSpreadShape = [-0.01, 0.03, 0.01, -0.014, -0.02, -0.006, 0.028];

const barometerGauss = (x: number, mu: number, sigma: number) =>
  Math.exp(-((x - mu) ** 2) / (2 * sigma * sigma));

export function buildBarometerShape(
  peakAm: number,
  peakPm: number,
  amplitudeAm: number,
  amplitudePm: number,
  noiseSeed: number,
): BarometerPoint[] {
  const amLength = barometerAmSlots.length;

  return barometerTimeline.map((t, index) => {
    const isAm = index < amLength;
    const localIndex = isAm ? index : index - amLength;
    const base = isAm
      ? amplitudeAm * barometerGauss(localIndex, peakAm, 1.8)
      : amplitudePm * barometerGauss(localIndex, peakPm, 2.6);
    const wobble =
      Math.sin((index + noiseSeed) * 1.7) * 0.06 +
      Math.cos(index * 0.9 + noiseSeed) * 0.04;

    return { t, value: Math.max(0, Math.round(base * (1 + wobble))) };
  });
}

export const scaleBarometerPoints = (
  points: BarometerPoint[],
  factor: number,
): BarometerPoint[] =>
  points.map((point) => ({ ...point, value: Math.round(point.value * factor) }));

const barometerSeriesSeed = (key: string) =>
  key
    .split("")
    .reduce(
      (sum, char, index) => sum + char.charCodeAt(0) * (index + 1),
      0,
    ) / 97;

export function buildInstitutionBarometerPoints(
  points: BarometerPoint[],
  profile: BarometerInstitutionProfile,
  seriesKey: string,
): BarometerPoint[] {
  if (profile.seed === 0) {
    return scaleBarometerPoints(points, profile.factor);
  }

  const amLength = barometerAmSlots.length;
  const amPoints = points.slice(0, amLength);
  const pmPoints = points.slice(amLength);
  const amMax = Math.max(...amPoints.map((point) => point.value), 1);
  const pmMax = Math.max(...pmPoints.map((point) => point.value), 1);
  const seed = profile.seed + barometerSeriesSeed(seriesKey);
  const isReverse = seriesKey.toLowerCase().includes("in");
  const isYesterday = seriesKey.toLowerCase().includes("yesterday");
  const directionShift = isReverse ? 0.18 : -0.08;
  const yesterdayShift = isYesterday ? -0.14 : 0;
  const amPeak = 4 + profile.amPeakShift + directionShift + yesterdayShift;
  const pmPeak = 8 + profile.pmPeakShift - directionShift * 0.7 + yesterdayShift;

  return points.map((point, index) => {
    const isAm = index < amLength;
    const localIndex = isAm ? index : index - amLength;
    const peak = isAm ? amPeak : pmPeak;
    const width = isAm ? profile.amWidth : profile.pmWidth;
    const maxValue = isAm ? amMax : pmMax;
    const peakScale = isAm ? profile.amPeakScale : profile.pmPeakScale;
    const amplitude = maxValue * profile.factor * peakScale;
    const base = amplitude * barometerGauss(localIndex, peak, width);
    const floor = amplitude * profile.valleyFloor;
    const drift =
      1 + profile.drift * (index / Math.max(points.length - 1, 1) - 0.5);
    const wobble =
      Math.sin((index + seed) * 1.53) * 0.055 * profile.wobble +
      Math.cos(index * 0.82 + seed * 0.7) * 0.035 * profile.wobble;
    const value = (base + floor) * drift * (1 + wobble);

    return {
      ...point,
      value: Math.max(0, Math.round(value)),
    };
  });
}

export function buildInstitutionBarometerPricePoints(
  points: BarometerPoint[],
  profile: BarometerInstitutionProfile,
  seriesKey: string,
): BarometerPoint[] {
  if (profile.seed === 0 && profile.factor === 1 && profile.drift === 0) {
    return points.map((point) => ({ ...point }));
  }

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 0.001);
  const seed = profile.seed + barometerSeriesSeed(seriesKey);
  const isReverse = seriesKey.toLowerCase().includes("in");
  const isYesterday = seriesKey.toLowerCase().includes("yesterday");
  const directionBias = isReverse ? -1 : 1;
  const dayBias = isYesterday ? -1 : 1;
  const amLength = barometerAmSlots.length;

  return points.map((point, index) => {
    const normalized = (point.value - min) / span - 0.5;
    const isAm = index < amLength;
    const sessionShift =
      (isAm ? profile.amPeakShift : profile.pmPeakShift) * 0.004;
    const sessionScale = isAm ? profile.amPeakScale : profile.pmPeakScale;
    const wobble =
      Math.sin((index + seed) * 0.61) * 0.0045 * profile.wobble +
      Math.cos(index * 0.31 + seed * 0.7) * 0.0028 * profile.wobble;
    const drift = (profile.factor - 1) * 0.03 + profile.drift * 0.01;
    const curveBias =
      normalized * 0.02 * sessionScale +
      directionBias * normalized * 0.004 +
      dayBias * 0.002;
    const value = point.value + curveBias + sessionShift + drift + wobble;

    return {
      ...point,
      value: Number(value.toFixed(3)),
    };
  });
}

export function buildBarometerSeries(
  todayOut: BarometerPoint[],
  todayIn: BarometerPoint[],
  yesterdayOut: BarometerPoint[],
  yesterdayIn: BarometerPoint[],
): BarometerSeries[] {
  return [
    {
      key: "todayOut",
      label: "\u4eca\u65e5\u6b63\u56de\u8d2d",
      color: barometerOutColor,
      lineStyle: "solid",
      points: todayOut,
    },
    {
      key: "todayIn",
      label: "\u4eca\u65e5\u9006\u56de\u8d2d",
      color: barometerInColor,
      lineStyle: "solid",
      points: todayIn,
    },
    {
      key: "yesterdayOut",
      label: "\u6628\u65e5\u6b63\u56de\u8d2d",
      color: barometerOutColor,
      lineStyle: "dashed",
      points: yesterdayOut,
    },
    {
      key: "yesterdayIn",
      label: "\u6628\u65e5\u9006\u56de\u8d2d",
      color: barometerInColor,
      lineStyle: "dashed",
      points: yesterdayIn,
    },
  ];
}

export const buildBarometerPriceAnchors = (
  offsets: readonly number[],
): BarometerPriceAnchor[] => offsets.map((offset, index) => ({ index, offset }));

export function buildBarometerPricePoints(
  base: number,
  anchors: readonly BarometerPriceAnchor[],
): BarometerPoint[] {
  return barometerTimeline.map((t, index) => {
    const first = anchors[0];
    const last = anchors[anchors.length - 1];

    if (index <= first.index) {
      return { t, value: Number((base + first.offset).toFixed(3)) };
    }

    if (index >= last.index) {
      return { t, value: Number((base + last.offset).toFixed(3)) };
    }

    let rightIndex = 1;
    while (rightIndex < anchors.length && anchors[rightIndex].index < index) {
      rightIndex += 1;
    }

    const left = anchors[rightIndex - 1];
    const right = anchors[rightIndex];
    const progress =
      (index - left.index) / Math.max(right.index - left.index, 1);
    const offset = left.offset + (right.offset - left.offset) * progress;

    return { t, value: Number((base + offset).toFixed(3)) };
  });
}

export const seededJitter = (
  seed: number,
  index: number,
  amplitude: number,
) => {
  const raw = Math.sin(seed * 97.13 + index * 41.77) * 10000;
  return (raw - Math.floor(raw) - 0.5) * 2 * amplitude;
};

const keepPeakShape = (value: number, index: number) => {
  if (index === 1) return Math.max(value, 0.92);
  if (index === 6) return Math.max(value, 0.68);
  if (index === 4) return Math.min(value, 0.08);
  return value;
};

export const buildIntradayRates = (
  base: number,
  pressureScale: number,
  seed: number,
) =>
  intradayRatePressure.map((pressure, index) => {
    const localPressure = keepPeakShape(
      pressure +
        seededJitter(seed, index, 0.11) +
        (seededJitter(seed + 19, index, 0.035) * index) / 8,
      index,
    );
    const microMove = seededJitter(seed + 37, index, 0.012);
    const value =
      base + localPressure * pressureScale + intradayNoise[index] + microMove;
    return Number(Math.max(1.02, value).toFixed(3));
  });

export const buildInstitutionWeightedRates = (
  personal: number[],
  spreadScale = 1,
  seed: number,
) =>
  personal.map((rate, index) => {
    const baseSpread = Math.abs(institutionSpreadShape[index]) * spreadScale;
    const spreadNoise = Math.abs(seededJitter(seed + 53, index, 0.01));
    const closeWindowPremium = index === 1 || index === 6 ? 0.004 : 0;
    return Number(
      (rate + baseSpread + spreadNoise + closeWindowPremium).toFixed(3),
    );
  });

export const buildIntradayCounts = (
  base: number,
  peak: number,
  closeBoost = 0,
  seed: number,
) =>
  intradayQuoteHeat.map((heat, index) => {
    const localHeat = keepPeakShape(
      heat + seededJitter(seed + 71, index, 0.14),
      index,
    );
    const countNoise = seededJitter(
      seed + 89,
      index,
      Math.max(1.2, peak * 0.06),
    );

    return Math.max(
      1,
      Math.round(
        base +
          peak * localHeat +
          countNoise +
          (index === 6 ? closeBoost : 0) +
          (index === 1 ? 2 : 0),
      ),
    );
  });
