import { useWorkstation } from "../../context/WorkstationContext";
import { compareSources } from "../../data/sources";
import { exchangeQuotes } from "../../data/quotes/exchange";
import { nonbankBestQuotes } from "../../data/quotes/nonbankBest";
import { DownloadBtn } from "../shared/DownloadBtn";
import type { CompareSourceId, Quote } from "../../data/types";

// ── 交易所回购 ──────────────────────────────────────────────
const EX_COL = "grid-cols-[4.5rem_3rem_1fr_1fr_1fr_1fr_3.5rem]";

function ExchangeHeader() {
  const cls = "text-[10px] text-[#6a7f98] text-right first:text-left";
  return (
    <div
      className={`grid ${EX_COL} px-2 py-1 bg-[#0f1e31] border-b border-[#1e3352] flex-shrink-0`}
    >
      <div className={cls}>品种</div>
      <div className={cls}>涨跌BP</div>
      <div className={cls}>加权均价</div>
      <div className={cls}>成交(亿)</div>
      <div className={cls}>最高</div>
      <div className={cls}>最低</div>
      <div className="text-[10px] text-[#6a7f98] text-center">操作</div>
    </div>
  );
}

function ExchangeRow({
  q,
  idx,
  selected,
  onClick,
}: {
  q: Quote;
  idx: number;
  selected: boolean;
  onClick: () => void;
}) {
  const bp = q.changeBp ?? 0;
  const bpCls =
    bp < 0 ? "text-emerald-400" : bp > 0 ? "text-red-400" : "text-[#8aa0b8]";

  return (
    <div
      onClick={onClick}
      className={`grid ${EX_COL} px-2 py-1.5 text-xs border-b cursor-pointer transition-colors ${
        selected
          ? "bg-blue-900/30 border-l-2 border-l-blue-400 border-b-[#1e3352]/30"
          : `${idx % 2 === 0 ? "bg-[#0a1628]" : "bg-[#0d1a2e]"} border-b-[#1e3352]/30 hover:bg-[#18293f]`
      }`}
    >
      <div className="text-[#e4ecf5] font-mono font-semibold">{q.period}</div>
      <div className={`text-right font-mono ${bpCls}`}>
        {bp > 0 ? "+" : ""}
        {bp.toFixed(1)}
      </div>
      <div className="text-right font-mono text-[#e4ecf5]">
        {q.weightedAvg?.toFixed(4)}
      </div>
      <div className="text-right font-mono text-[#b0c1d6]">
        {q.totalAmount?.toFixed(2)}
      </div>
      <div className="text-right font-mono text-[#b0c1d6]">
        {q.high?.toFixed(4)}
      </div>
      <div className="text-right font-mono text-[#b0c1d6]">
        {q.low?.toFixed(4)}
      </div>
      <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
        <button className="px-1.5 py-0.5 text-[10px] border border-[#2a4466] text-[#8aa0b8] rounded hover:border-blue-400 hover:text-blue-400 transition-colors">
          报价
        </button>
      </div>
    </div>
  );
}

// ── 非银最优 ────────────────────────────────────────────────
const NB_COL = "grid-cols-[3.5rem_1fr_1fr_1fr_1fr_3.5rem]";

function NonbankHeader() {
  const cls = "text-[10px] text-[#6a7f98] text-right first:text-left";
  return (
    <div
      className={`grid ${NB_COL} px-2 py-1 bg-[#0f1e31] border-b border-[#1e3352] flex-shrink-0`}
    >
      <div className={cls}>期限</div>
      <div className={cls}>正回购金额</div>
      <div className={cls}>正回购利率</div>
      <div className={cls}>逆回购利率</div>
      <div className={cls}>逆回购金额</div>
      <div className="text-[10px] text-[#6a7f98] text-center">操作</div>
    </div>
  );
}

function NonbankRow({
  q,
  idx,
  selected,
  onClick,
}: {
  q: Quote;
  idx: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`grid ${NB_COL} px-2 py-1.5 text-xs border-b cursor-pointer transition-colors ${
        selected
          ? "bg-blue-900/30 border-l-2 border-l-blue-400 border-b-[#1e3352]/30"
          : `${idx % 2 === 0 ? "bg-[#0a1628]" : "bg-[#0d1a2e]"} border-b-[#1e3352]/30 hover:bg-[#18293f]`
      }`}
    >
      <div className="text-[#e4ecf5] font-mono font-semibold">{q.period}</div>
      <div className="text-right font-mono text-[#b0c1d6]">
        {q.bidVolume.toFixed(2)}
      </div>
      <div className="text-right font-mono text-sky-400">
        {q.bidRate.toFixed(4)}
      </div>
      <div className="text-right font-mono text-emerald-400">
        {q.askRate.toFixed(4)}
      </div>
      <div className="text-right font-mono text-[#b0c1d6]">
        {q.askVolume.toFixed(2)}
      </div>
      <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
        <button className="px-1.5 py-0.5 text-[10px] border border-[#2a4466] text-[#8aa0b8] rounded hover:border-blue-400 hover:text-blue-400 transition-colors">
          报价
        </button>
      </div>
    </div>
  );
}

// ── 主组件 ──────────────────────────────────────────────────
export function InstitutionCompareTable() {
  const {
    compareSource,
    setCompareSource,
    selectedRow,
    setSelectedRow,
    selectedPeriod,
    amountRange,
    rateRange,
  } = useWorkstation();

  const isExchange = compareSource === "exchange";

  const minAmt = amountRange.min !== "" ? parseFloat(amountRange.min) : null;
  const maxAmt = amountRange.max !== "" ? parseFloat(amountRange.max) : null;
  const minRate = rateRange.min !== "" ? parseFloat(rateRange.min) : null;
  const maxRate = rateRange.max !== "" ? parseFloat(rateRange.max) : null;

  // 交易所回购：过滤逻辑（加权均价当利率，成交量当金额）
  const exRows = exchangeQuotes.filter((q) => {
    if (minRate !== null && (q.weightedAvg ?? 0) < minRate) return false;
    if (maxRate !== null && (q.weightedAvg ?? 0) > maxRate) return false;
    if (minAmt !== null && (q.totalAmount ?? 0) < minAmt) return false;
    if (maxAmt !== null && (q.totalAmount ?? 0) > maxAmt) return false;
    return true;
  });

  // 非银最优：过滤逻辑
  const nbRows = nonbankBestQuotes.filter((q) => {
    if (selectedPeriod !== "all" && q.period !== selectedPeriod) return false;
    const vol = Math.max(q.bidVolume, q.askVolume);
    if (minAmt !== null && vol < minAmt) return false;
    if (maxAmt !== null && vol > maxAmt) return false;
    if (minRate !== null && q.askRate < minRate) return false;
    if (maxRate !== null && q.bidRate > maxRate) return false;
    return true;
  });

  function handleRowClick(period: string) {
    const isSelected =
      selectedRow?.source === compareSource && selectedRow?.period === period;
    setSelectedRow(
      isSelected ? null : { source: compareSource as CompareSourceId, period },
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0a1628] border border-[#1e3352] rounded overflow-hidden">
      {/* 卡头 */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#132238] border-b border-[#1e3352] flex-shrink-0">
        <div className="flex gap-0.5">
          {compareSources.map((s) => {
            const active = compareSource === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setCompareSource(s.id as CompareSourceId)}
                className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                  active
                    ? "bg-blue-600 text-white"
                    : "bg-[#0a1628] text-[#8aa0b8] hover:bg-[#18293f] border border-[#2a4466]"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#8aa0b8] font-mono">
            {selectedRow ? `已选: ${selectedRow.period}` : "点击行 → 联动大图"}
          </span>
          <DownloadBtn />
        </div>
      </div>

      {/* 表头 + 行 */}
      {isExchange ? <ExchangeHeader /> : <NonbankHeader />}

      <div className="flex-1 overflow-auto">
        {isExchange
          ? exRows.map((q, i) => (
              <ExchangeRow
                key={q.period}
                q={q}
                idx={i}
                selected={
                  selectedRow?.source === "exchange" &&
                  selectedRow?.period === q.period
                }
                onClick={() => handleRowClick(q.period)}
              />
            ))
          : nbRows.map((q, i) => (
              <NonbankRow
                key={q.period}
                q={q}
                idx={i}
                selected={
                  selectedRow?.source === "nonbankBest" &&
                  selectedRow?.period === q.period
                }
                onClick={() => handleRowClick(q.period)}
              />
            ))}
      </div>
    </div>
  );
}
