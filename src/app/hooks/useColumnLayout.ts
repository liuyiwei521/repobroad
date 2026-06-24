import { useEffect, useRef, useState } from "react";

const DEFAULT_COLUMN_RATIOS: [number, number, number] = [22, 45, 33];
const COLUMN_RATIOS_KEY = "boardColumnRatios.v6";
const COLUMN_MIN: [number, number, number] = [2, 32, 22];

function clampColumns(next: [number, number, number]): [number, number, number] {
  let [l, m, r] = next;
  const sum = l + m + r;
  if (sum <= 0) return DEFAULT_COLUMN_RATIOS;

  l = (l / sum) * 100;
  m = (m / sum) * 100;
  r = (r / sum) * 100;

  const arr = [l, m, r];
  const mins = COLUMN_MIN;
  for (let i = 0; i < 3; i += 1) {
    if (arr[i] < mins[i]) {
      const need = mins[i] - arr[i];
      arr[i] = mins[i];
      const others = [0, 1, 2]
        .filter((j) => j !== i)
        .sort((a, b) => arr[b] - arr[a]);
      let remaining = need;
      for (const j of others) {
        const avail = arr[j] - mins[j];
        const take = Math.min(avail, remaining);
        arr[j] -= take;
        remaining -= take;
        if (remaining <= 0) break;
      }
    }
  }

  return [arr[0], arr[1], arr[2]];
}

export function useColumnLayout() {
  const mainRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState<[number, number, number]>(() => {
    if (typeof window === "undefined") return DEFAULT_COLUMN_RATIOS;
    try {
      const raw = window.localStorage.getItem(COLUMN_RATIOS_KEY);
      if (!raw) return DEFAULT_COLUMN_RATIOS;
      const parsed = JSON.parse(raw);
      if (
        Array.isArray(parsed) &&
        parsed.length === 3 &&
        parsed.every((v) => typeof v === "number" && Number.isFinite(v))
      ) {
        return clampColumns([parsed[0], parsed[1], parsed[2]]);
      }
    } catch {
      // ignore storage parse errors
    }
    return DEFAULT_COLUMN_RATIOS;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(COLUMN_RATIOS_KEY, JSON.stringify(columns));
    } catch {
      // ignore storage write errors
    }
  }, [columns]);

  function startDragSplitter(
    event: React.MouseEvent<HTMLDivElement>,
    boundary: 0 | 1,
  ) {
    event.preventDefault();
    const container = mainRef.current;
    if (!container) return;
    const startX = event.clientX;
    const startCols: [number, number, number] = [...columns] as [number, number, number];
    const totalWidth = container.getBoundingClientRect().width;
    if (totalWidth <= 0) return;

    function onMove(ev: MouseEvent) {
      const deltaPct = ((ev.clientX - startX) / totalWidth) * 100;
      const next: [number, number, number] = [...startCols] as [number, number, number];
      if (boundary === 0) {
        next[0] = startCols[0] + deltaPct;
        next[1] = startCols[1] - deltaPct;
      } else {
        next[1] = startCols[1] + deltaPct;
        next[2] = startCols[2] - deltaPct;
      }
      setColumns(clampColumns(next));
    }

    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    }

    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function resetColumns() {
    setColumns(DEFAULT_COLUMN_RATIOS);
  }

  return {
    columns,
    mainRef,
    resetColumns,
    startDragSplitter,
    gridTemplate: `${columns[0]}% 6px ${columns[1]}% 6px ${columns[2]}%`,
  };
}
