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
  { id: "today", label: "当天" },
  { id: "5d", label: "5日" },
  { id: "1m", label: "1M" },
  { id: "6m", label: "半年" },
]);

export function getXrepoHistoryPointCount(range, compact) {
  if (range === "today") return compact ? 16 : 20;
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
  if (score <= 44) {
    return {
      tone: "alert",
      status: "紧张",
      accentClass:
        "border-amber-200 bg-amber-50 text-amber-700",
      statusClass: "text-amber-600",
    };
  }
  return {
    tone: "neutral",
    status: "一般",
    accentClass:
      "border-slate-200 bg-slate-50 text-slate-700",
    statusClass: "text-slate-600",
  };
}
