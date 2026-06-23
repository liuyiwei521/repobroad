import { useRef, useState } from "react";

export function FloatingBall() {
  const [pos, setPos] = useState({
    x: window.innerWidth - 80,
    y: window.innerHeight - 80,
  });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    setPos({
      x: e.clientX - offset.current.x,
      y: e.clientY - offset.current.y,
    });
  };

  const onPointerUp = () => {
    dragging.current = false;
  };

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{ left: pos.x, top: pos.y }}
      className="tdx-terminal-float fixed z-[30] flex h-14 w-14 cursor-grab select-none items-center justify-center active:cursor-grabbing"
    >
      <span className="tk-number text-lg font-bold">42</span>
    </div>
  );
}
