export const QUOTE_TENOR_DISPLAY_LABELS = Object.freeze({
  R001: "1d",
  R007: "7d",
  R014: "14d",
  R021: "21d",
  R028: "其他",
});

export function quoteTenorDisplayLabel(tenor) {
  return QUOTE_TENOR_DISPLAY_LABELS[tenor] ?? tenor;
}

export function toggleMultiSelect(current, value) {
  return current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
}

export const XREPO_HISTORY_TABS = Object.freeze([
  { id: "today", label: "当日" },
  { id: "5d", label: "5日" },
  { id: "1m", label: "1M" },
  { id: "6m", label: "半年" },
]);

export function getXrepoHistoryPointCount(range, compact) {
  if (range === "today") return compact ? 10 : 14;
  if (range === "5d") return 5;
  if (range === "1m") return 22;
  return compact ? 36 : 78;
}

export function buildXrepoTodayLabels(count) {
  const slots = [
    "09:00",
    "09:15",
    "09:30",
    "09:45",
    "10:00",
    "10:15",
    "10:30",
    "10:45",
    "11:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
  ];
  if (count <= 0) return [];
  if (count >= slots.length) return [...slots];
  if (count === 1) return [slots[0]];

  return Array.from({ length: count }, (_, index) => {
    const slotIndex = Math.round((index / (count - 1)) * (slots.length - 1));
    return slots[slotIndex];
  });
}

export function getSentimentState(score) {
  if (score >= 60) {
    return {
      tone: "good",
      status: "宽松",
      accentClass:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
      statusClass: "text-emerald-600",
    };
  }
  if (score >= 45) {
    return {
      tone: "neutral",
      status: "平衡",
      accentClass:
        "border-slate-200 bg-slate-50 text-slate-700",
      statusClass: "text-slate-600",
    };
  }
  if (score >= 30) {
    return {
      tone: "alert",
      status: "紧张",
      accentClass:
        "border-red-200 bg-red-50 text-red-700",
      statusClass: "text-red-600",
    };
  }
  return {
    tone: "danger",
    status: "异常紧张",
    accentClass:
      "border-red-300 bg-red-100 text-red-800",
    statusClass: "text-red-700",
  };
}

export function buildChartDomain(
  values,
  { paddingRatio = 0.08, minSpan = 0.04, clampMin, clampMax } = {},
) {
  const finiteValues = values.filter((value) => Number.isFinite(value));
  if (finiteValues.length === 0) {
    return { min: 0, max: 1 };
  }

  let min = Math.min(...finiteValues);
  let max = Math.max(...finiteValues);
  const span = Math.max(max - min, minSpan);
  const padding = span * paddingRatio;

  if (min === max) {
    min -= minSpan / 2;
    max += minSpan / 2;
  } else {
    min -= padding;
    max += padding;
  }

  if (typeof clampMin === "number") {
    min = Math.max(clampMin, min);
  }
  if (typeof clampMax === "number") {
    max = Math.min(clampMax, max);
  }

  if (min >= max) {
    const center = finiteValues[0];
    min = center - minSpan / 2;
    max = center + minSpan / 2;
  }

  return {
    min: Number(min.toFixed(4)),
    max: Number(max.toFixed(4)),
  };
}

export function buildLinearTicks(min, max, count, precision = 3) {
  if (count <= 1) {
    return [Number(max.toFixed(precision))];
  }

  return Array.from({ length: count }, (_, index) =>
    Number((max - ((max - min) * index) / (count - 1)).toFixed(precision)),
  );
}

export function createSeededRandom(seed) {
  let state = (seed >>> 0) || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function roundSeriesValue(value, precision) {
  return Number(value.toFixed(precision));
}

export function buildSeededWalk(
  anchor,
  count,
  dailyVol,
  seed,
  {
    clampMin = 0,
    clampMax,
    precision = Math.abs(anchor) < 10 ? 4 : 0,
    meanReversion = Math.abs(anchor) < 10 ? 0.18 : 0.08,
    anchorBand,
  } = {},
) {
  if (count <= 0) return [];

  const isRateSeries = Math.abs(anchor) < 10;
  const band =
    typeof anchorBand === "number"
      ? anchorBand
      : isRateSeries
        ? Math.max(0.05, Math.min(0.22, dailyVol * 1.3))
        : null;
  const lowerBound =
    band == null ? clampMin : Math.max(clampMin, anchor - band);
  const upperBound =
    typeof clampMax === "number"
      ? clampMax
      : band == null
        ? Number.POSITIVE_INFINITY
        : anchor + band;
  const rand = createSeededRandom(seed);
  const result = new Array(count);
  result[count - 1] = roundSeriesValue(anchor, precision);

  for (let index = count - 2; index >= 0; index -= 1) {
    const prev = result[index + 1];
    const baseJump =
      (rand() - 0.5) * dailyVol * (isRateSeries ? 0.55 : 1.2);
    const mediumJump =
      (rand() - 0.5) * dailyVol * (isRateSeries ? 0.35 : 0.8);
    let next = prev + baseJump + mediumJump + (anchor - prev) * meanReversion;

    if (rand() < (isRateSeries ? 0.12 : 0.08)) {
      next +=
        (rand() - 0.5) * dailyVol * (isRateSeries ? 1.1 : 2.4);
    }

    next = Math.max(lowerBound, Math.min(upperBound, next));
    result[index] = roundSeriesValue(next, precision);
  }

  return result;
}

export function generateTradingDates(endDate, count) {
  const [year, month, day] = endDate.split("-").map(Number);
  const end = new Date(year, month - 1, day);
  const dates = [];
  let cursor = new Date(end);

  while (dates.length < count) {
    const weekday = cursor.getDay();
    if (weekday !== 0 && weekday !== 6) {
      dates.unshift(
        `${cursor.getMonth() + 1}/${String(cursor.getDate()).padStart(2, "0")}`,
      );
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  return dates;
}

export function buildBankHistorySeries(
  bank,
  endDate,
  count = 28,
  {
    anchorNonBank,
    anchorBank,
    referenceNonBank,
    referenceBank,
  } = {},
) {
  const seed = bank
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const labels = generateTradingDates(endDate, count);
  const nonBankBase =
    typeof anchorNonBank === "number"
      ? anchorNonBank
      : 1.88 + (seed % 5) * 0.012;
  const bankBase =
    typeof anchorBank === "number"
      ? anchorBank
      : Number((nonBankBase + (4 + (seed % 4)) / 100).toFixed(3));
  const nonBankSeries = buildSeededWalk(
    nonBankBase,
    count,
    0.018,
    seed + 11,
    {
      clampMin: 1.74,
      clampMax: 2.24,
      anchorBand: 0.16,
      precision: 3,
      meanReversion: 0.2,
    },
  );
  const bankRateSeries = buildSeededWalk(
    bankBase,
    count,
    0.02,
    seed + 29,
    {
      clampMin: 1.78,
      clampMax: 2.3,
      anchorBand: 0.18,
      precision: 3,
      meanReversion: 0.2,
    },
  );
  const bankBaseline =
    Math.min(
      typeof referenceBank === "number" ? referenceBank : bankBase,
      ...bankRateSeries,
    ) - 0.008;
  const nonBankBaseline =
    Math.min(
      typeof referenceNonBank === "number" ? referenceNonBank : nonBankBase,
      ...nonBankSeries,
    ) - 0.008;

  return labels.map((date, index) => {
    const nonBank = nonBankSeries[index];
    const bankRate = Number(
      Math.max(nonBank + 0.01, bankRateSeries[index]).toFixed(3),
    );

    return {
      date,
      nonBank,
      bankRate,
      spread: Math.max(1, Math.round(Math.abs(bankRate - nonBank) * 100)),
      bankDiff: Math.max(1, Math.round((bankRate - bankBaseline) * 100)),
      nonBankDiff: Math.max(
        1,
        Math.round((nonBank - nonBankBaseline) * 100),
      ),
    };
  });
}
