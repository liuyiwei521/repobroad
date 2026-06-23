export function ColumnSplitter({
  onMouseDown,
}: {
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="拖动调整列宽"
      title="拖动调整列宽"
      onMouseDown={onMouseDown}
      className="group relative h-full cursor-col-resize border-l border-[rgba(255,255,255,0.04)] bg-transparent transition-colors hover:bg-[rgba(231,53,58,0.18)]"
      style={{ width: "100%", minWidth: 4 }}
    >
      <span className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-[2px] -translate-x-1/2 -translate-y-1/2 rounded bg-[rgba(255,255,255,0.1)] group-hover:bg-[var(--tdx-red)]" />
    </div>
  );
}
