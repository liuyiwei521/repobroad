import { useWorkstation } from "../../context/WorkstationContext";
import { primarySources } from "../../data/sources";
import { xrepoQuotes } from "../../data/quotes/xrepo";
import { bankPriceRows } from "../../data/quotes/bankPrice";
import { DownloadBtn } from "../shared/DownloadBtn";
import type { PrimarySourceId, Quote } from "../../data/types";

// ── XRepo 表 ────────────────────────────────────────────────
const XCOL = "grid-cols-[3.5rem_1fr_1fr_1fr_1fr_3.5rem]";

function XrepoHeader() {
  const cls = "text-[10px] text-[#6a7f98] text-right first:text-left";
  return (
    <div className={`grid ${XCOL} px-2 py-1 bg-[#0f1e31] border-b border-[#1e3352] flex-shrink-0`}>
      <div className={cls}>期限</div>
      <div className={cls}>正回购金额</div>
      <div className={cls}>正回购利率</div>
      <div className={cls}>逆回购利率</div>
      <div className={cls}>逆回购金额</div>
      <div className="text-[10px] text-[#6a7f98] text-center">操作</div>
    </div>
  );
}

function XrepoRow({ q, idx }: { q: Quote; idx: number }) {
  return (
    <div
      className={`grid ${XCOL} px-2 py-1.5 text-xs border-b border-[#1e3352]/30 hover:bg-[#18293f] transition-colors ${
        idx % 2 === 0 ? "bg-[#0a1628]" : "bg-[#0d1a2e]"
      }`}
    >
      <div className="text-[#e4ecf5] font-mono font-semibold">{q.period}</div>
      <div className="text-right font-mono text-[#b0c1d6]">{q.bidVolume.toFixed(2)}</div>
      <div className="text-right font-mono text-sky-400">{q.bidRate.toFixed(4)}</div>
      <div className="text-right font-mono text-emerald-400">{q.askRate.toFixed(4)}</div>
      <div className="text-right font-mono text-[#b0c1d6]">{q.askVolume.toFixed(2)}</div>
      <div className="flex justify-center">
        <button className="px-1.5 py-0.5 text-[10px] border border-[#2a4466] text-[#8aa0b8] rounded hover:border-blue-400 hover:text-blue-400 transition-colors">
          报价
        </button>
      </div>
    </div>
  );
}

// ── 大行价格表 ───────────────────────────────────────────────
const BCOL = "grid-cols-[6rem_1fr_1fr_5rem_3rem]";

function BankHeader() {
  const cls = "text-[10px] text-[#6a7f98] text-right first:text-left";
  return (
    <div className={`grid ${BCOL} px-2 py-1 bg-[#0f1e31] border-b border-[#1e3352] flex-shrink-0`}>
      <div className={cls}>机构</div>
      <div className={cls}>银行利率</div>
      <div className={cls}>非银利率</div>
      <div className={cls}>更新时间</div>
      <div className="text-[10px] text-[#6a7f98] text-center">操作</div>
    </div>
  );
}

function BankRow({ r, idx }: { r: (typeof bankPriceRows)[0]; idx: number }) {
  return (
    <div
      className={`grid ${BCOL} px-2 py-1.5 text-xs border-b border-[#1e3352]/30 hover:bg-[#18293f] transition-colors ${
        idx % 2 === 0 ? "bg-[#0a1628]" : "bg-[#0d1a2e]"
      }`}
    >
      <div className="text-[#e4ecf5] font-semibold truncate">{r.institution}</div>
      <div className="text-right font-mono text-sky-400">{r.bankRate.toFixed(4)}</div>
      <div className="text-right font-mono text-emerald-400">{r.nonbankRate.toFixed(4)}</div>
      <div className="text-right font-mono text-[#8aa0b8] text-[11px]">{r.updateTime}</div>
      <div className="flex justify-center">
        {/* 编辑按钮 */}
        <button
          title="编辑"
          className="p-0.5 text-[#8aa0b8] hover:text-blue-400 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
            <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.609zm1.414 1.06a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354l-1.086-1.086zM11.189 6.25 9.75 4.81 3.34 11.22a.25.25 0 0 0-.064.108l-.558 1.953 1.953-.558a.249.249 0 0 0 .108-.064L11.19 6.25z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── 主组件 ───────────────────────────────────────────────────
export function MainMarketTable() {
  const { activeSource, setActiveSource, selectedPeriod, amountRange, rateRange } =
    useWorkstation();

  const isBank = activeSource === "bankPrice";

  // XRepo 过滤
  const minRate = rateRange.min !== "" ? parseFloat(rateRange.min) : null;
  const maxRate = rateRange.max !== "" ? parseFloat(rateRange.max) : null;
  const minAmt  = amountRange.min !== "" ? parseFloat(amountRange.min) : null;
  const maxAmt  = amountRange.max !== "" ? parseFloat(amountRange.max) : null;

  const xRows = xrepoQuotes.filter((q) => {
    if (selectedPeriod !== "all" && q.period !== selectedPeriod) return false;
    const vol = Math.max(q.bidVolume, q.askVolume);
    if (minAmt !== null && vol < minAmt) return false;
    if (maxAmt !== null && vol > maxAmt) return false;
    if (minRate !== null && q.askRate < minRate) return false;
    if (maxRate !== null && q.bidRate > maxRate) return false;
    return true;
  });

  // 大行价格过滤（只按利率范围）
  const bRows = bankPriceRows.filter((r) => {
    if (minRate !== null && r.bankRate < minRate) return false;
    if (maxRate !== null && r.nonbankRate > maxRate) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-[#0a1628] border border-[#1e3352] rounded overflow-hidden">
      {/* 卡头 */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#132238] border-b border-[#1e3352] flex-shrink-0">
        <div className="flex gap-0.5">
          {primarySources.map((s) => {
            const active = activeSource === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSource(s.id as PrimarySourceId)}
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
          <span className="text-[10px] text-[#8aa0b8] font-mono">数据更新 10:53:27</span>
          <DownloadBtn />
        </div>
      </div>

      {/* 列头 */}
      {isBank ? <BankHeader /> : <XrepoHeader />}

      {/* 数据行 */}
      <div className="flex-1 overflow-auto">
        {isBank ? (
          bRows.length === 0 ? (
            <div className="p-4 text-xs text-[#6a7f98] text-center">无匹配数据</div>
          ) : (
            bRows.map((r, i) => <BankRow key={r.institution} r={r} idx={i} />)
          )
        ) : xRows.length === 0 ? (
          <div className="p-4 text-xs text-[#6a7f98] text-center">无匹配数据</div>
        ) : (
          xRows.map((q, i) => <XrepoRow key={q.period} q={q} idx={i} />)
        )}
      </div>
    </div>
  );
}
