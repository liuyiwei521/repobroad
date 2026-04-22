import { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChevronDown, ChevronUp } from "lucide-react";

// 模拟数据
const sentimentData = [
  { time: "09:00", value: 52 },
  { time: "10:00", value: 48 },
  { time: "11:00", value: 45 },
  { time: "13:00", value: 50 },
  { time: "14:00", value: 53 },
  { time: "15:00", value: 51 },
];

const rateHistoryData = [
  { date: "03/27", DR001: 1.85, DR007: 2.1, GC001: 1.9 },
  { date: "03/28", DR001: 1.88, DR007: 2.08, GC001: 1.92 },
  { date: "03/31", DR001: 1.9, DR007: 2.12, GC001: 1.95 },
  { date: "04/01", DR001: 1.92, DR007: 2.15, GC001: 1.98 },
  { date: "04/02", DR001: 1.95, DR007: 2.15, GC001: 2.0 },
];

const institutionStructure = [
  { name: "大行", lend: 12000, borrow: 1500 },
  { name: "中小行", lend: 2500, borrow: 5000 },
  { name: "券商", lend: 800, borrow: 3200 },
  { name: "理财子", lend: 600, borrow: 2800 },
  { name: "基金", lend: 1200, borrow: 1500 },
  { name: "保险", lend: 800, borrow: 400 },
];

const ncdRates = [
  { period: "1M", rate: 2.25, change: 0.02 },
  { period: "3M", rate: 2.35, change: 0.03 },
  { period: "6M", rate: 2.48, change: 0.01 },
  { period: "9M", rate: 2.62, change: -0.01 },
  { period: "1Y", rate: 2.75, change: 0.0 },
];

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function CollapsibleSection({ title, children }: SectionProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="border-b border-[#1e3352]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-[#18293f] transition-colors"
      >
        <span className="font-medium text-[#e4ecf5] text-xs">{title}</span>
        {isOpen ? (
          <ChevronUp size={14} className="text-[#8aa0b8]" />
        ) : (
          <ChevronDown size={14} className="text-[#8aa0b8]" />
        )}
      </button>
      {isOpen && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

export function LeftPanel() {
  return (
    <div className="text-xs h-full overflow-hidden">
      {/* 资金情绪指数 */}
      <CollapsibleSection title="资金情绪指数">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[#8aa0b8] text-xs">当前指数：</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-yellow-600">51</span>
              <span className="px-1.5 py-0.5 bg-yellow-500/15 text-yellow-400 text-xs rounded border border-yellow-500/40">
                平衡
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={100}>
            <LineChart data={sentimentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3352" />
              <XAxis
                dataKey="time"
                stroke="#6a7f98"
                style={{ fontSize: "10px" }}
              />
              <YAxis
                stroke="#6a7f98"
                style={{ fontSize: "10px" }}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#132238',
                  border: "1px solid #1e3352",
                  fontSize: "10px",
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#ca8a04"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-1 text-xs">
            <div className="text-center">
              <div className="text-[#6a7f98] text-xs">宽松</div>
              <div className="text-[#8aa0b8] text-xs">0-40</div>
            </div>
            <div className="text-center">
              <div className="text-[#6a7f98] text-xs">平衡</div>
              <div className="text-yellow-700 font-semibold text-xs">40-60</div>
            </div>
            <div className="text-center">
              <div className="text-[#6a7f98] text-xs">偏紧</div>
              <div className="text-[#8aa0b8] text-xs">60-100</div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* 核心利率历史走势 */}
      <CollapsibleSection title="核心利率走势">
        <div className="space-y-2">
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={rateHistoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3352" />
              <XAxis
                dataKey="date"
                stroke="#6a7f98"
                style={{ fontSize: "10px" }}
              />
              <YAxis
                stroke="#6a7f98"
                style={{ fontSize: "10px" }}
                domain={[1.5, 2.5]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#132238',
                  border: "1px solid #1e3352",
                  fontSize: "10px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "10px" }} />
              <Line
                type="monotone"
                dataKey="DR001"
                stroke="#10b981"
                strokeWidth={1.5}
              />
              <Line
                type="monotone"
                dataKey="DR007"
                stroke="#3b82f6"
                strokeWidth={1.5}
              />
              <Line
                type="monotone"
                dataKey="GC001"
                stroke="#8b5cf6"
                strokeWidth={1.5}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CollapsibleSection>

      {/* 分机构资金结构 */}
      <CollapsibleSection title="机构资金结构">
        <div className="space-y-2">
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={institutionStructure}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3352" />
              <XAxis
                dataKey="name"
                stroke="#6a7f98"
                style={{ fontSize: "9px" }}
              />
              <YAxis stroke="#6a7f98" style={{ fontSize: "10px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#132238',
                  border: "1px solid #1e3352",
                  fontSize: "10px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "10px" }} />
              <Bar dataKey="lend" fill="#10b981" name="融出" />
              <Bar dataKey="borrow" fill="#ef4444" name="融入" />
            </BarChart>
          </ResponsiveContainer>
          <div className="text-xs text-[#8aa0b8] space-y-0.5">
            <div className="flex justify-between">
              <span>总融出规模：</span>
              <span className="text-emerald-600 font-semibold">17,900亿</span>
            </div>
            <div className="flex justify-between">
              <span>总融入规模：</span>
              <span className="text-red-600 font-semibold">14,400亿</span>
            </div>
            <div className="flex justify-between">
              <span>净融出盈余：</span>
              <span className="text-emerald-600 font-semibold">+3,500亿</span>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* NCD收益率参考 */}
      <CollapsibleSection title="NCD收益率曲线">
        <div className="space-y-1">
          {ncdRates.map((item) => (
            <div
              key={item.period}
              className="flex items-center justify-between py-1 border-b border-[#1e3352] last:border-0"
            >
              <span className="text-[#8aa0b8] text-xs">{item.period}</span>
              <div className="flex items-center gap-1.5">
                <span
                  className={
                    item.change >= 0
                      ? "text-red-600 text-xs"
                      : "text-emerald-600 text-xs"
                  }
                >
                  {item.rate.toFixed(2)}%
                </span>
                <span
                  className={`text-xs ${item.change >= 0 ? "text-red-600" : "text-emerald-600"}`}
                >
                  {item.change >= 0 ? "↑" : "↓"}
                  {Math.abs(item.change).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* 更新说明 */}
      <div className="px-3 py-2 text-xs text-[#6a7f98]">
        <div className="space-y-0.5">
          <div>· 数据更新：分钟级～日频</div>
          <div>· 仅供参考，不作为交易依据</div>
        </div>
      </div>
    </div>
  );
}
