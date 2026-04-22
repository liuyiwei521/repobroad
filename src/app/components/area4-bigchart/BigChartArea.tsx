import { useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { useWorkstation } from "../../context/WorkstationContext";
import { DownloadBtn } from "../shared/DownloadBtn";
import {
  generateComparisonData,
  comparisonSeries,
} from "../../data/trends/comparison";
import { generateIntraday } from "../../data/trends/intraday";
import { generateHistory } from "../../data/trends/history";
import type { BigChartMode, PriceVolumePoint } from "../../data/types";

const MODES: { id: BigChartMode; label: string }[] = [
  { id: "intraday",   label: "分时" },
  { id: "history",    label: "历史" },
  { id: "comparison", label: "对比" },
];

const AXIS = {
  tick: { fontSize: 10, fill: "#8aa0b8" },
  axisLine: { stroke: "#2a4466" },
  tickLine: false as const,
};
const GRID = { strokeDasharray: "3 3", stroke: "#1e3352", vertical: false };
const TIP_STYLE = {
  backgroundColor: "#132238",
  border: "1px solid #2a4466",
  borderRadius: 4,
  fontSize: 11,
  color: "#e4ecf5",
};

// ── 对比：5条折线 ─────────────────────────────────────────────
function ComparisonChart() {
  const data = useMemo(() => generateComparisonData(), []);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 20, left: -12, bottom: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="time" {...AXIS} />
        <YAxis
          {...AXIS}
          width={48}
          domain={["auto", "auto"]}
          tickFormatter={(v: number) => v.toFixed(2)}
        />
        <Tooltip
          contentStyle={TIP_STYLE}
          labelStyle={{ color: "#e4ecf5", marginBottom: 4 }}
          formatter={(v: number) => v.toFixed(4)}
        />
        <Legend wrapperStyle={{ fontSize: 10, color: "#8aa0b8" }} iconSize={8} />
        {comparisonSeries.map((s) => (
          <Line
            key={s.key}
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── 分时 / 历史：上折线 + 下柱状（分离布局） ─────────────────
function PriceVolumeChart({ data }: { data: PriceVolumePoint[] }) {
  const prices = data.map((d) => d.price);
  const lo = Math.min(...prices);
  const hi = Math.max(...prices);
  const pad = Math.max((hi - lo) * 0.25, 0.01);

  // 参考线：全段平均
  const refLine = +(prices.reduce((s, v) => s + v, 0) / prices.length).toFixed(4);

  // 柱颜色：价格上涨橙色，下跌青色，首条橙色
  const barColors = data.map((d, i) =>
    i === 0 || d.price >= data[i - 1].price ? "#f97316" : "#06b6d4"
  );

  const commonMargin = { top: 4, right: 20, left: -8, bottom: 0 };

  return (
    <div className="flex flex-col h-full">
      {/* 上：价格区域图 68% */}
      <div className="flex-[68] min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ ...commonMargin, top: 8 }}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="time" hide />
            <YAxis
              {...AXIS}
              axisLine={false}
              width={52}
              domain={[lo - pad, hi + pad]}
              tickFormatter={(v: number) => v.toFixed(3)}
            />
            <Tooltip
              contentStyle={TIP_STYLE}
              labelStyle={{ color: "#e4ecf5", marginBottom: 4 }}
              formatter={(v: number, name: string) => [v.toFixed(4), name]}
            />
            <Legend
              wrapperStyle={{ fontSize: 10, color: "#8aa0b8", paddingBottom: 2 }}
              iconSize={8}
              verticalAlign="top"
              align="right"
            />
            <ReferenceLine
              y={refLine}
              stroke="#f97316"
              strokeDasharray="5 3"
              strokeWidth={1}
            />
            <Area
              dataKey="price"
              name="最新利率"
              stroke="#60a5fa"
              fill="url(#priceGrad)"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="weightedAvg"
              name="加权均价"
              stroke="#e2e8f0"
              strokeWidth={1}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 下：成交量柱状图 32% */}
      <div className="flex-[32] min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={commonMargin} barSize={4}>
            <CartesianGrid {...GRID} />
            <XAxis
              dataKey="time"
              {...AXIS}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis
              {...AXIS}
              axisLine={false}
              width={52}
              tickFormatter={(v: number) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
              }
            />
            <Tooltip
              contentStyle={TIP_STYLE}
              formatter={(v: number) => [`${v}`, "成交量"]}
            />
            <Bar dataKey="volume" name="成交量">
              {data.map((_, i) => (
                <Cell key={i} fill={barColors[i]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── 主组件 ───────────────────────────────────────────────────
export function BigChartArea() {
  const { bigChartMode, setBigChartMode, selectedRow } = useWorkstation();

  const baseRate = useMemo(
    () => (selectedRow?.source === "exchange" ? 1.4 : 1.95),
    [selectedRow]
  );
  const intradayData = useMemo(() => generateIntraday(baseRate, 60), [baseRate]);
  const historyData  = useMemo(() => generateHistory(baseRate, 60),  [baseRate]);

  const title =
    bigChartMode === "comparison"
      ? "趋势一览"
      : selectedRow
        ? `${selectedRow.source} · ${selectedRow.period}`
        : "—";

  return (
    <div className="flex flex-col h-full bg-[#0a1628] border border-[#1e3352] rounded overflow-hidden">
      {/* 卡头 */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#132238] border-b border-[#1e3352] flex-shrink-0">
        <div className="flex gap-0.5">
          {MODES.map((m) => {
            const active = bigChartMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setBigChartMode(m.id)}
                className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                  active
                    ? "bg-blue-600 text-white"
                    : "bg-[#0a1628] text-[#b0c1d6] hover:bg-[#18293f] border border-[#2a4466]"
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#e4ecf5]">{title}</span>
          <DownloadBtn />
        </div>
      </div>

      {/* 图表区 */}
      <div className="flex-1 min-h-0 px-1 py-1">
        {bigChartMode === "comparison" && <ComparisonChart />}
        {bigChartMode === "intraday"   && <PriceVolumeChart data={intradayData} />}
        {bigChartMode === "history"    && <PriceVolumeChart data={historyData}  />}
      </div>
    </div>
  );
}
