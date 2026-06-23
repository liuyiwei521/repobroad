import { useEffect, useRef, useState } from "react";

const CENTER_SPLIT_KEY = "centerSplitRatio.v1";
const DEFAULT_CENTER_TOP = 78;

export function useCenterSplit() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [topPct, setTopPct] = useState(() => {
    try {
      const saved = localStorage.getItem(CENTER_SPLIT_KEY);
      if (saved) {
        const n = Number(saved);
        if (n >= 30 && n <= 90) return n;
      }
    } catch {
      // ignore storage read errors
    }
    return DEFAULT_CENTER_TOP;
  });

  useEffect(() => {
    try {
      localStorage.setItem(CENTER_SPLIT_KEY, String(topPct));
    } catch {
      // ignore storage write errors
    }
  }, [topPct]);

  function startRowDrag(event: React.MouseEvent) {
    event.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    function onMove(ev: MouseEvent) {
      const rect = container.getBoundingClientRect();
      if (rect.height <= 0) return;
      const pct = ((ev.clientY - rect.top) / rect.height) * 100;
      setTopPct(Math.max(30, Math.min(90, pct)));
    }

    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    }

    document.body.style.userSelect = "none";
    document.body.style.cursor = "row-resize";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  return {
    containerRef,
    topPct,
    startRowDrag,
  };
}
