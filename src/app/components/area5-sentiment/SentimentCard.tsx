import { useState } from "react";
import { DownloadBtn } from "../shared/DownloadBtn";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  currentSentimentIndex,
  sentimentLabel,
} from "../../data/reference/sentiment";
import { institutionRepoSeries } from "../../data/reference/institutionRepo";
import { ncdQuotes } from "../../data/quotes/ncd";
import { interbankQuotes } from "../../data/quotes/interbank";
import { capitalStructureSeries } from "../../data/reference/capitalStructure";
import type { SentimentTab } from "../../data/types";

const TABS: { id: SentimentTab; label: string }[] = [
  { id: "sentiment", label: "资金情绪" },
  { id: "instRepo", label: "分机构回购" },
  { id: "ncd", label: "NCD走势" },
  { id: "structure", label: "资金结构" },
  { id: "interbank", label: "同业存款" },
];

const badgeColor = (label: string) =>
  label === "平衡"
    ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/40"
    : label === "宽松"
      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40"
      : "bg-red-500/15 text-red-400 border-red-500/40";

// ── 资金情绪 ────────────────────────────────────────────────
function SentimentPanel() {
  const items = [
    { label: "全市场", value: 51, color: "text-yellow-400" },
    { label: "大行", value: 46, color: "text-blue-400" },
    { label: "中小行", value: 53, color: "text-indigo-400" },
    { label: "非银", value: 49, color: "text-purple-400" },
  ];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-[#8aa0b8] text-xs">当前指数</span>
        <span className="text-3xl font-bold text-yellow-400 font-mono">
          {currentSentimentIndex}
        </span>
        <span
          className={`px-2 py-0.5 rounded border text-xs ${badgeColor(sentimentLabel)}`}
        >
          {sentimentLabel}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {items.map((item) => (
          <div
            key={item.label}
            className="bg-[#0f1e31] rounded px-2 py-1.5 flex items-center justify-between border border-[#1e3352]"
          >
            <span className="text-[11px] text-[#8aa0b8]">{item.label}</span>
            <span className={`text-sm font-bold font-mono ${item.color}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
      <div className="text-[11px] text-[#6a7f98] border-t border-[#1e3352] pt-2 space-y-0.5">
        <div>• 大行净融出维持高位，流动性偏宽</div>
        <div>• 非银隔夜需求稳定，资金面平衡</div>
        <div>• DR007 较昨日下行 1BP</div>
      </div>
    </div>
  );
}

// ── 分机构回购（堆叠柱图） ──────────────────────────────────
const INST_COLORS: Record<string, string> = {
  大行: "#4361ee",
  中小行: "#06b6d4",
  货币: "#10b981",
  券商: "#3b82f6",
  理财子: "#8b5cf6",
  保险: "#f43f5e",
};

function InstRepoChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={institutionRepoSeries}
        margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
        barCategoryGap="35%"
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#1e3352"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: "#8aa0b8" }}
          axisLine={{ stroke: "#2a4466" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#8aa0b8" }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#132238",
            border: "1px solid #2a4466",
            borderRadius: 4,
            fontSize: 11,
            color: "#e4ecf5",
          }}
          labelStyle={{ color: "#e4ecf5", marginBottom: 4 }}
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
        />
        <Legend
          wrapperStyle={{ fontSize: 10, color: "#8aa0b8", paddingTop: 2 }}
          iconSize={8}
          iconType="square"
        />
        {Object.entries(INST_COLORS).map(([key, color]) => (
          <Bar
            key={key}
            dataKey={key}
            stackId="a"
            fill={color}
            radius={key === "保险" ? [2, 2, 0, 0] : undefined}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── NCD走势 ─────────────────────────────────────────────────
function NcdPanel() {
  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-[3rem_1fr_1fr_3rem_1fr] px-2 py-1 bg-[#0f1e31] border-b border-[#1e3352] flex-shrink-0">
        {["期限", "买入", "卖出", "涨跌BP", "加权"].map((h, i) => (
          <div
            key={h}
            className={`text-[10px] text-[#6a7f98] ${i === 0 ? "text-left" : "text-right"}`}
          >
            {h}
          </div>
        ))}
      </div>
      <div className="flex-1 overflow-auto">
        {ncdQuotes.map((q, i) => {
          const bp = q.changeBp ?? 0;
          const bpCls =
            bp < 0
              ? "text-emerald-400"
              : bp > 0
                ? "text-red-400"
                : "text-[#8aa0b8]";
          return (
            <div
              key={q.period}
              className={`grid grid-cols-[3rem_1fr_1fr_3rem_1fr] px-2 py-1.5 text-xs border-b border-[#1e3352]/30 hover:bg-[#18293f] transition-colors ${i % 2 === 0 ? "bg-[#0a1628]" : "bg-[#0d1a2e]"}`}
            >
              <div className="text-[#e4ecf5] font-mono font-semibold">
                {q.period}
              </div>
              <div className="text-right font-mono text-sky-400">
                {q.bidRate.toFixed(4)}
              </div>
              <div className="text-right font-mono text-emerald-400">
                {q.askRate.toFixed(4)}
              </div>
              <div className={`text-right font-mono ${bpCls}`}>
                {bp > 0 ? "+" : ""}
                {bp.toFixed(2)}
              </div>
              <div className="text-right font-mono text-[#b0c1d6]">
                {q.weightedAvg?.toFixed(4)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 资金结构 ─────────────────────────────────────────────────
const STRUCT_KEYS = [
  "大行",
  "中小行",
  "货币",
  "券商",
  "理财子",
  "保险",
] as const;

function StructurePanel() {
  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-[3.5rem_1fr_1fr_1fr_1fr_1fr_1fr] px-2 py-1 bg-[#0f1e31] border-b border-[#1e3352] flex-shrink-0">
        {["日期", ...STRUCT_KEYS].map((h, i) => (
          <div
            key={h}
            className={`text-[10px] text-[#6a7f98] ${i === 0 ? "text-left" : "text-right"}`}
          >
            {h}
          </div>
        ))}
      </div>
      <div className="flex-1 overflow-auto">
        {capitalStructureSeries.map((row, i) => (
          <div
            key={row.date}
            className={`grid grid-cols-[3.5rem_1fr_1fr_1fr_1fr_1fr_1fr] px-2 py-1.5 text-xs border-b border-[#1e3352]/30 hover:bg-[#18293f] transition-colors ${i % 2 === 0 ? "bg-[#0a1628]" : "bg-[#0d1a2e]"}`}
          >
            <div className="text-[#8aa0b8] font-mono">{row.date}</div>
            {STRUCT_KEYS.map((k) => (
              <div key={k} className="text-right font-mono text-[#b0c1d6]">
                {row[k]}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="px-2 py-1 border-t border-[#1e3352] text-[10px] text-[#4a6080] flex-shrink-0">
        单位：亿元 · 数据源：CFETS日报
      </div>
    </div>
  );
}

// ── 同业存款 ─────────────────────────────────────────────────
function InterbankPanel() {
  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-[3rem_1fr_1fr] px-2 py-1 bg-[#0f1e31] border-b border-[#1e3352] flex-shrink-0">
        {["期限", "买入利率", "卖出利率"].map((h, i) => (
          <div
            key={h}
            className={`text-[10px] text-[#6a7f98] ${i === 0 ? "text-left" : "text-right"}`}
          >
            {h}
          </div>
        ))}
      </div>
      <div className="flex-1 overflow-auto">
        {interbankQuotes.map((q, i) => (
          <div
            key={q.period}
            className={`grid grid-cols-[3rem_1fr_1fr] px-2 py-2 text-xs border-b border-[#1e3352]/30 hover:bg-[#18293f] transition-colors ${i % 2 === 0 ? "bg-[#0a1628]" : "bg-[#0d1a2e]"}`}
          >
            <div className="text-[#e4ecf5] font-mono font-semibold">
              {q.period}
            </div>
            <div className="text-right font-mono text-sky-400">
              {q.bidRate.toFixed(4)}
            </div>
            <div className="text-right font-mono text-emerald-400">
              {q.askRate.toFixed(4)}
            </div>
          </div>
        ))}
      </div>
      <div className="px-2 py-1 border-t border-[#1e3352] text-[10px] text-[#4a6080] flex-shrink-0">
        数据源：泰康已接入 · 日更新
      </div>
    </div>
  );
}

// ── 主组件 ───────────────────────────────────────────────────
export function SentimentCard() {
  const [tab, setTab] = useState<SentimentTab>("sentiment");

  const padded = tab === "sentiment";

  return (
    <div className="flex flex-col h-full bg-[#0a1628] border border-[#1e3352] rounded overflow-hidden">
      {/* 卡头 */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#132238] border-b border-[#1e3352] flex-shrink-0">
        <div className="flex gap-0.5 flex-wrap">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
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
        <DownloadBtn />
      </div>

      {/* 内容区 */}
      <div
        className={`flex-1 min-h-0 overflow-hidden ${padded ? "p-3 overflow-auto" : ""}`}
      >
        {tab === "sentiment" && <SentimentPanel />}
        {tab === "instRepo" && <InstRepoChart />}
        {tab === "ncd" && <NcdPanel />}
        {tab === "structure" && <StructurePanel />}
        {tab === "interbank" && <InterbankPanel />}
      </div>
    </div>
  );
}
