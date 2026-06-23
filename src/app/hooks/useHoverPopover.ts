import { useRef, useState } from "react";

export function useHoverPopover(enterDelay = 80, leaveDelay = 120) {
  const [visible, setVisible] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const enterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  function scheduleShow() {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    enterTimer.current = setTimeout(() => {
      setAnchorRect(anchorRef.current?.getBoundingClientRect() ?? null);
      setVisible(true);
    }, enterDelay);
  }

  function scheduleHide() {
    if (enterTimer.current) clearTimeout(enterTimer.current);
    leaveTimer.current = setTimeout(() => setVisible(false), leaveDelay);
  }

  function cancelHide() {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
  }

  return {
    visible,
    anchorRect,
    anchorRef,
    scheduleShow,
    scheduleHide,
    cancelHide,
  };
}
