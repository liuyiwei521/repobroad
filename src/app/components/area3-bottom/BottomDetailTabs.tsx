import { useMemo } from "react";
import { useWorkstation } from "../../context/WorkstationContext";
import { getInstitutionQuotes } from "../../data/institutionQuotes";
import { omoRecords, omoSummary } from "../../data/reference/omo";
import { DownloadBtn } from "../shared/DownloadBtn";
import type { BottomTab, InstQuote, InstitutionType } from "../../data/types";

const TABS: { id: BottomTab; label: string }[] = [
  { id: "omoDetail",     label: "逐笔明细" },
  { id: "omoSummary",    label: "净投放统计" },
  { id: "nonbankDetail", label: "非银明细" },
];

// ── 逐笔明细（转置：字段为行，每条记录为列） ─────────────────
const OMO_FIELDS = [
  {
    label: "日期",
    render: (r: (typeof omoRecords)[0]) => r.date,
    cls: "text-[#8aa0b8] text-[11px]",
  },
  {
    label: "方式",
    render: (r: (typeof omoRecords)[0]) => r.type,
    cls: (r: (typeof omoRecords)[0]) =>
      r.type.includes("到期") ? "text-[#8aa0b8]" : "text-[#e4ecf5] font-semibold",
  },
  {
    label: "期限",
    render: (r: (typeof omoRecords)[0]) => r.period,
    cls: "text-[#e4ecf5] font-bold font-mono",
  },
  {
    label: "利率",
    render: (r: (typeof omoRecords)[0]) => r.rate.toFixed(2),
    cls: "text-emerald-400 font-mono",
  },
];

function OmoDetailPanel() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-auto">
        <table className="border-collapse" style={{ tableLayout: "fixed" }}>
          <tbody>
            {OMO_FIELDS.map((field, fi) => (
              <tr
                key={field.label}
                className={fi % 2 === 0 ? "bg-[#0a1628]" : "bg-[#0d1a2e]"}
              >
                {/* 字段标签（sticky） */}
                <td className="sticky left-0 z-10 px-3 py-2 text-[10px] text-[#6a7f98] bg-[#132238] border-r border-[#1e3352] border-b border-b-[#1e3352]/40 whitespace-nowrap w-14">
                  {field.label}
                </td>
                {/* 每条记录的值 */}
                {omoRecords.map((r, i) => {
                  const cls =
                    typeof field.cls === "function" ? field.cls(r) : field.cls;
                  return (
                    <td
                      key={i}
                      className={`px-3 py-2 text-xs whitespace-nowrap border-b border-b-[#1e3352]/40 border-r border-r-[#1e3352]/20 text-right ${cls} w-28`}
                    >
                      {field.render(r)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── 净投放统计 ────────────────────────────────────────────────
function numStr(v: number | null): string {
  if (v === null) return "--";
  if (v === 0) return "0";
  return v > 0 ? `+${v}` : `${v}`;
}
function numCls(v: number | null): string {
  if (v === null || v === 0) return "text-[#8aa0b8]";
  return v > 0 ? "text-emerald-400" : "text-red-400";
}

function OmoSummaryPanel() {
  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-[5.5rem_1fr_1fr_1fr_1fr_1fr] px-3 py-1 bg-[#0f1e31] border-b border-[#1e3352] flex-shrink-0">
        {["日期", "净投放总额(亿)", "逆回购", "逆回购到期", "MLF", "MLF到期"].map((h, i) => (
          <div key={h} className={`text-[10px] text-[#6a7f98] ${i >= 1 ? "text-right" : ""}`}>
            {h}
          </div>
        ))}
      </div>
      <div className="flex-1 overflow-auto">
        {omoSummary.map((row, i) => (
          <div
            key={row.date}
            className={`grid grid-cols-[5.5rem_1fr_1fr_1fr_1fr_1fr] px-3 py-1.5 text-xs border-b border-[#1e3352]/30 hover:bg-[#18293f] transition-colors ${
              i % 2 === 0 ? "bg-[#0a1628]" : "bg-[#0d1a2e]"
            }`}
          >
            <div className="font-mono text-[11px] text-[#8aa0b8]">{row.date}</div>
            <div className={`text-right font-mono font-bold ${numCls(row.netInject)}`}>
              {numStr(row.netInject)}
            </div>
            <div className={`text-right font-mono ${numCls(row.repo)}`}>{numStr(row.repo)}</div>
            <div className={`text-right font-mono ${numCls(row.repoMaturity)}`}>{numStr(row.repoMaturity)}</div>
            <div className={`text-right font-mono ${numCls(row.mlf)}`}>{numStr(row.mlf)}</div>
            <div className={`text-right font-mono ${numCls(row.mlfMaturity)}`}>{numStr(row.mlfMaturity)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 非银明细（无选中时显示全量，有选中时过滤期限） ────────────
const TYPE_COLOR: Record<InstitutionType, string> = {
  大行:  "text-blue-400   bg-blue-400/10   border-blue-400/30",
  股份行: "text-purple-400 bg-purple-400/10 border-purple-400/30",
  城商行: "text-indigo-400 bg-indigo-400/10 border-indigo-400/30",
  券商:  "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  基金:  "text-orange-400 bg-orange-400/10 border-orange-400/30",
  理财子: "text-pink-400   bg-pink-400/10   border-pink-400/30",
  保险:  "text-teal-400   bg-teal-400/10   border-teal-400/30",
};
const COL = "grid-cols-[5.5rem_3.5rem_1fr_1fr_1fr_1fr_3.5rem]";

function NonbankPanel() {
  const { selectedRow, compareSource, institutionSearch } = useWorkstation();

  // 未选中时使用默认期限 "7"，全量展示；选中时用选中期限
  const period = selectedRow?.period ?? "7";
  const quotes = useMemo(
    () => getInstitutionQuotes(compareSource, period),
    [compareSource, period]
  );

  const searchLower = institutionSearch.toLowerCase();
  const filtered = quotes.filter(
    (q) =>
      !searchLower ||
      q.institutionName.toLowerCase().includes(searchLower) ||
      q.institutionType.includes(institutionSearch)
  );

  return (
    <div className="flex flex-col h-full">
      {/* 列头 */}
      <div className={`grid ${COL} px-3 py-1 bg-[#0f1e31] border-b border-[#1e3352] flex-shrink-0`}>
        {["机构", "类型", "正回购金额", "正回购利率", "逆回购利率", "逆回购金额", "操作"].map(
          (h, i) => (
            <div
              key={h}
              className={`text-[10px] text-[#6a7f98] ${
                i >= 2 && i <= 5 ? "text-right" : i === 6 ? "text-center" : ""
              }`}
            >
              {h}
            </div>
          )
        )}
      </div>
      {/* 状态提示 */}
      {!selectedRow && (
        <div className="px-3 py-1 bg-[#0f1e31]/60 border-b border-[#1e3352] flex-shrink-0">
          <span className="text-[10px] text-[#6a7f98]">
            默认展示期限 <span className="text-blue-400 font-mono">7D</span>，在 ② 点击行可切换期限
          </span>
        </div>
      )}
      {/* 数据行 */}
      <div className="flex-1 overflow-auto">
        {filtered.map((q: InstQuote, i: number) => (
          <div
            key={q.institutionId}
            className={`grid ${COL} px-3 py-1.5 text-xs border-b border-[#1e3352]/30 hover:bg-[#18293f] transition-colors ${
              i % 2 === 0 ? "bg-[#0a1628]" : "bg-[#0d1a2e]"
            }`}
          >
            <div className="text-[#e4ecf5] font-mono truncate" title={q.institutionName}>
              {q.institutionName}
            </div>
            <div className="flex items-center">
              <span className={`px-1 py-0 text-[9px] border rounded ${TYPE_COLOR[q.institutionType]}`}>
                {q.institutionType}
              </span>
            </div>
            <div className="text-right font-mono text-[#b0c1d6]">{q.bidVolume.toFixed(0)}</div>
            <div className="text-right font-mono text-sky-400">{q.bidRate.toFixed(4)}</div>
            <div className="text-right font-mono text-emerald-400">{q.askRate.toFixed(4)}</div>
            <div className="text-right font-mono text-[#b0c1d6]">{q.askVolume.toFixed(0)}</div>
            <div className="flex justify-center">
              <button className="px-1.5 py-0.5 text-[10px] border border-[#2a4466] text-[#8aa0b8] rounded hover:border-blue-400 hover:text-blue-400 transition-colors">
                报价
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 主组件 ───────────────────────────────────────────────────
export function BottomDetailTabs() {
  const {
    bottomTab, setBottomTab,
    institutionSearch, setInstitutionSearch,
    selectedRow,
  } = useWorkstation();

  return (
    <div className="flex flex-col h-full bg-[#0a1628] border border-[#1e3352] rounded overflow-hidden">
      {/* 卡头 */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#132238] border-b border-[#1e3352] flex-shrink-0">
        <div className="flex gap-0.5">
          {TABS.map((t) => {
            const active = bottomTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setBottomTab(t.id)}
                className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                  active
                    ? "bg-blue-600 text-white"
                    : "bg-[#0a1628] text-[#b0c1d6] hover:bg-[#18293f] border border-[#2a4466]"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* 非银明细：期限徽章 + 搜索框 */}
        {bottomTab === "nonbankDetail" && selectedRow && (
          <span className="text-[10px] text-blue-400 font-mono bg-blue-900/20 border border-blue-500/30 px-1.5 rounded">
            {selectedRow.period}
          </span>
        )}
        {bottomTab === "nonbankDetail" && (
          <input
            value={institutionSearch}
            onChange={(e) => setInstitutionSearch(e.target.value)}
            placeholder="机构名 / 类型..."
            className="h-5 px-2 text-[11px] bg-[#0a1628] border border-[#2a4466] text-[#e4ecf5] rounded placeholder:text-[#4a6080] focus:outline-none focus:border-blue-500 w-28"
          />
        )}

        <div className="ml-auto">
          <DownloadBtn />
        </div>
      </div>

      {/* 内容 */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {bottomTab === "omoDetail"     && <OmoDetailPanel />}
        {bottomTab === "omoSummary"    && <OmoSummaryPanel />}
        {bottomTab === "nonbankDetail" && <NonbankPanel />}
      </div>
    </div>
  );
}
