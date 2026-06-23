export type SentimentPoint = {
  label: string;
  total: number;
  bigBank: number;
  smallBank: number;
  nonBank: number;
};

function generateSentimentSeries(
  count: number,
  _seed: number,
  base: number,
  amp: number,
): number[] {
  const result: number[] = new Array(count);
  result[0] = base + (Math.random() - 0.5) * amp;
  for (let i = 1; i < count; i++) {
    const r = Math.random();
    let jump: number;
    if (r < 0.6) {
      jump = (Math.random() - 0.5) * amp * 0.4;
    } else if (r < 0.9) {
      jump = (Math.random() - 0.5) * amp * 1.2;
    } else {
      jump = (Math.random() - 0.5) * amp * 3;
    }
    result[i] = Math.max(
      0,
      Math.min(100, Math.round((result[i - 1] + jump) * 10) / 10),
    );
  }
  return result;
}

export const sentimentTrendData: SentimentPoint[] = (() => {
  const dates = [
    "04-07",
    "04-08",
    "04-09",
    "04-10",
    "04-11",
    "04-13",
    "04-14",
    "04-15",
    "04-16",
    "04-17",
    "04-20",
    "04-21",
    "04-22",
    "04-23",
    "04-24",
    "04-27",
    "04-28",
    "04-29",
    "04-30",
    "05-07",
  ];
  const total = generateSentimentSeries(20, 1, 49.5, 2.8);
  const bigBank = generateSentimentSeries(20, 7, 47.2, 2.2);
  const smallBank = generateSentimentSeries(20, 13, 50.8, 2.5);
  const nonBank = generateSentimentSeries(20, 19, 49.0, 3.0);

  return dates.map((label, index) => ({
    label,
    total: total[index],
    bigBank: bigBank[index],
    smallBank: smallBank[index],
    nonBank: nonBank[index],
  }));
})();

export const sentimentRealtimeData: SentimentPoint[] = (() => {
  const labels: string[] = [];
  for (let i = 0; i < 40; i++) {
    const totalMinutes = 9 * 60 + 30 + i * 6;
    labels.push(
      `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`,
    );
  }

  const total = generateSentimentSeries(40, 3, 50.5, 1.5);
  const bigBank = generateSentimentSeries(40, 9, 47.5, 1.8);
  const smallBank = generateSentimentSeries(40, 15, 50.8, 1.3);
  const nonBank = generateSentimentSeries(40, 21, 49.2, 2.0);

  return labels.map((label, index) => ({
    label,
    total: total[index],
    bigBank: bigBank[index],
    smallBank: smallBank[index],
    nonBank: nonBank[index],
  }));
})();
