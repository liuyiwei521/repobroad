export function TopBar() {
  return (
    <div className="h-10 flex-shrink-0 bg-[#0a1628] border-b border-[#1e3352] flex items-center justify-between px-4">
      <div className="flex items-center">
        <h1 className="text-base font-semibold text-[#e4ecf5]">资金实时行情看板</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[#8aa0b8] text-xs">DR007：</span>
          <span className="text-red-500 font-semibold text-sm font-mono">2.15%</span>
          <span className="text-red-500 text-xs">↑0.05</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#8aa0b8] text-xs">资金面：</span>
          <span className="px-2 py-0.5 bg-yellow-500/15 text-yellow-400 text-xs rounded border border-yellow-500/40">
            平衡
          </span>
        </div>
      </div>
    </div>
  );
}
