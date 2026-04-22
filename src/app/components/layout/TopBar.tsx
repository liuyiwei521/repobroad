import { useEffect, useState } from 'react';

export function TopBar() {
  const [now, setNow] = useState(new Date());
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setLastUpdate(new Date()), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="h-10 flex-shrink-0 bg-[#0a1628] border-b border-[#1e3352] flex items-center justify-between px-4">
      <div className="flex items-center gap-6">
        <h1 className="text-base font-semibold text-[#e4ecf5]">资金实时行情看板</h1>
        <div className="flex items-center gap-1">
          <span className="text-[#8aa0b8] text-xs">系统时间：</span>
          <span className="text-[#e4ecf5] text-xs font-mono">
            {now.toLocaleString('zh-CN', {
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit', second: '2-digit',
              hour12: false,
            })}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[#8aa0b8] text-xs">数据更新：</span>
          <span className="text-emerald-400 text-xs font-mono">
            {lastUpdate.toLocaleTimeString('zh-CN', { hour12: false })}
          </span>
        </div>
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
