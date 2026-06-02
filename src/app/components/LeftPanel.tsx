import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChevronDown, ChevronUp } from 'lucide-react';

// 模拟数据
const sentimentData = [
  { time: '09:00', value: 52 },
  { time: '10:00', value: 48 },
  { time: '11:00', value: 45 },
  { time: '13:00', value: 50 },
  { time: '14:00', value: 53 },
  { time: '15:00', value: 51 },
];

const rateHistoryData = [
  { date: '03/27', DR001: 1.85, DR007: 2.10, GC001: 1.90 },
  { date: '03/28', DR001: 1.88, DR007: 2.08, GC001: 1.92 },
  { date: '03/31', DR001: 1.90, DR007: 2.12, GC001: 1.95 },
  { date: '04/01', DR001: 1.92, DR007: 2.15, GC001: 1.98 },
  { date: '04/02', DR001: 1.95, DR007: 2.15, GC001: 2.00 },
];

const institutionStructure = [
  { name: '大行', lend: 12000, borrow: 1500 },
  { name: '中小行', lend: 2500, borrow: 5000 },
  { name: '券商', lend: 800, borrow: 3200 },
  { name: '理财子', lend: 600, borrow: 2800 },
  { name: '基金', lend: 1200, borrow: 1500 },
  { name: '保险', lend: 800, borrow: 400 },
];

const ncdRates = [
  { period: '1M', rate: 2.25, change: 0.02 },
  { period: '3M', rate: 2.35, change: 0.03 },
  { period: '6M', rate: 2.48, change: 0.01 },
  { period: '9M', rate: 2.62, change: -0.01 },
  { period: '1Y', rate: 2.75, change: 0.00 },
];

const chartTheme = {
  grid: 'var(--tk-color-border-divider)',
  axis: 'var(--tk-color-text-tertiary)',
  tooltipBackground: 'var(--tk-color-surface-page)',
  tooltipBorder: 'var(--tk-color-border-default)',
  warning: 'var(--tk-color-warning)',
  success: 'var(--tk-color-success)',
  danger: 'var(--tk-color-danger)',
  blue: 'var(--tk-color-chart-blue)',
  purple: 'var(--tk-color-chart-purple)',
} as const;

const lightTooltipStyle = {
  backgroundColor: chartTheme.tooltipBackground,
  border: `1px solid ${chartTheme.tooltipBorder}`,
  borderRadius: 2,
  color: 'var(--tk-color-text-primary)',
  fontSize: '10px',
  padding: '6px 8px',
};

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function CollapsibleSection({ title, children }: SectionProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="tdx-side-section">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="tdx-side-section__trigger"
      >
        <span className="tdx-side-section__title">{title}</span>
        {isOpen ? <ChevronUp size={14} className="tdx-muted" /> : <ChevronDown size={14} className="tdx-muted" />}
      </button>
      {isOpen && <div className="tdx-side-section__body">{children}</div>}
    </div>
  );
}

export function LeftPanel() {
  return (
    <div className="tdx-side-panel text-xs h-full overflow-hidden">
      {/* 资金情绪指数 */}
      <CollapsibleSection title="资金情绪指数">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="tdx-label text-xs">当前指数：</span>
            <div className="flex items-center gap-2">
              <span className="tdx-warning text-xl font-bold">51</span>
              <span className="tdx-status-pill tdx-status-pill--warning">平衡</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={100}>
            <LineChart data={sentimentData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
              <XAxis dataKey="time" stroke={chartTheme.axis} style={{ fontSize: '10px' }} />
              <YAxis stroke={chartTheme.axis} style={{ fontSize: '10px' }} domain={[0, 100]} />
              <Tooltip
                contentStyle={lightTooltipStyle}
              />
              <Line type="monotone" dataKey="value" stroke={chartTheme.warning} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-1 text-xs">
            <div className="tdx-range-card">
              <div className="tdx-muted text-xs">宽松</div>
              <div className="tdx-label text-xs">0-40</div>
            </div>
            <div className="tdx-range-card">
              <div className="tdx-muted text-xs">平衡</div>
              <div className="tdx-warning font-semibold text-xs">40-60</div>
            </div>
            <div className="tdx-range-card">
              <div className="tdx-muted text-xs">偏紧</div>
              <div className="tdx-label text-xs">60-100</div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* 核心利率历史走势 */}
      <CollapsibleSection title="核心利率走势">
        <div className="space-y-2">
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={rateHistoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
              <XAxis dataKey="date" stroke={chartTheme.axis} style={{ fontSize: '10px' }} />
              <YAxis stroke={chartTheme.axis} style={{ fontSize: '10px' }} domain={[1.5, 2.5]} />
              <Tooltip
                contentStyle={lightTooltipStyle}
              />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Line type="monotone" dataKey="DR001" stroke={chartTheme.success} strokeWidth={1.5} />
              <Line type="monotone" dataKey="DR007" stroke={chartTheme.blue} strokeWidth={1.5} />
              <Line type="monotone" dataKey="GC001" stroke={chartTheme.purple} strokeWidth={1.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CollapsibleSection>

      {/* 分机构资金结构 */}
      <CollapsibleSection title="机构资金结构">
        <div className="space-y-2">
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={institutionStructure}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
              <XAxis dataKey="name" stroke={chartTheme.axis} style={{ fontSize: '9px' }} />
              <YAxis stroke={chartTheme.axis} style={{ fontSize: '10px' }} />
              <Tooltip
                contentStyle={lightTooltipStyle}
              />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Bar dataKey="lend" fill={chartTheme.success} name="融出" />
              <Bar dataKey="borrow" fill={chartTheme.danger} name="融入" />
            </BarChart>
          </ResponsiveContainer>
          <div className="text-xs tdx-label space-y-0.5">
            <div className="flex justify-between">
              <span>总融出规模：</span>
              <span className="tdx-positive font-semibold">17,900亿</span>
            </div>
            <div className="flex justify-between">
              <span>总融入规模：</span>
              <span className="tdx-negative font-semibold">14,400亿</span>
            </div>
            <div className="flex justify-between">
              <span>净融出盈余：</span>
              <span className="tdx-positive font-semibold">+3,500亿</span>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* NCD收益率参考 */}
      <CollapsibleSection title="NCD收益率曲线">
        <div className="space-y-1">
          {ncdRates.map((item) => (
            <div key={item.period} className="flex items-center justify-between py-1 border-b border-[color:var(--tk-color-border-divider)] last:border-0">
              <span className="tdx-label text-xs">{item.period}</span>
              <div className="flex items-center gap-1.5">
                <span className={item.change >= 0 ? 'tdx-negative text-xs' : 'tdx-positive text-xs'}>
                  {item.rate.toFixed(2)}%
                </span>
                <span className={`text-xs ${item.change >= 0 ? 'tdx-negative' : 'tdx-positive'}`}>
                  {item.change >= 0 ? '↑' : '↓'}{Math.abs(item.change).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* 更新说明 */}
      <div className="px-3 py-2 text-xs tdx-muted">
        <div className="space-y-0.5">
          <div>· 数据更新：分钟级～日频</div>
          <div>· 仅供参考，不作为交易依据</div>
        </div>
      </div>
    </div>
  );
}
