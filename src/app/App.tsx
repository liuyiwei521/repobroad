import { useEffect, useState } from 'react';

type AuxChartTab = 'ncd' | 'institution-repo' | 'fund-structure';

const leftSections = [
  {
    title: '当日大行价格',
    columns: ['机构', '非银利率', '银行利率', '涨跌bp', '更新时间'],
    rows: [
      ['工商银行', '1.95%', '2.00%', '-2', '10:53:27'],
      ['建设银行', '1.94%', '1.99%', '-1', '10:53:27'],
      ['农业银行', '1.96%', '2.01%', '+1', '10:53:27'],
      ['中国银行', '1.95%', '2.00%', '0', '10:53:27'],
    ],
    greenColumns: [1],
    redColumns: [2],
    deltaColumns: [3],
  },
  {
    title: 'XREPO',
    columns: ['期限', '正档位', '正回购金额', '逆回购利率', '正回购利率', '逆回购金额', '逆档位', '操作'],
    rows: [
      ['R001', '(4)', '442亿', '1.95%', '2.00%', '442亿', '(12)', '发送'],
      ['R007', '(4)', '28亿', '1.25%', '2.00%', '442亿', '(12)', '发送'],
      ['R014', '(4)', '442亿', '1.95%', '2.00%', '442亿', '(12)', '发送'],
      ['R021', '(4)', '442亿', '1.95%', '2.00%', '442亿', '(12)', '发送'],
      ['R028', '(4)', '442亿', '1.95%', '2.00%', '442亿', '(12)', '发送'],
    ],
    greenColumns: [3],
    redColumns: [4],
    emphasisColumns: [1, 6],
    buttonColumn: 7,
    fitToWidth: true,
  },
  {
    title: '交易所回购',
    columns: ['品种', '最新', '涨跌bp', '涨跌%', '成交金额', '最高', '最低', '开盘'],
    rows: [
      ['GC001', '1.3700', '-1.00', '-0.72', '14.93亿', '1.4050', '1.3250', '1.3300'],
      ['GC007', '1.3750', '-1.00', '-0.72', '14.00亿', '1.4200', '1.3250', '1.3500'],
      ['R001', '1.3900', '-1.50', '-1.07', '8.21亿', '1.4100', '1.3600', '1.3950'],
      ['R007', '1.4000', '-0.50', '-0.36', '309.17亿', '1.4100', '1.3800', '1.4100'],
      ['R014', '1.4050', '-0.50', '-0.35', '26.98亿', '1.4200', '1.3550', '1.3550'],
      ['R028', '1.4000', '-1.00', '-0.71', '5.91亿', '1.4450', '1.3800', '1.3850'],
      ['CG014', '1.3800', '-1.50', '-1.08', '2,975.70万', '1.4000', '1.3550', '1.3550'],
    ],
    greenColumns: [1, 6],
    redColumns: [5, 7],
    deltaColumns: [2, 3],
    fitToWidth: true,
  },
] as const;

const middleSections = [
  {
    id: 'non-bank-best',
    title: '非银最优',
    columns: ['期限', '正回购金额', '逆回购利率', '正回购利率', '逆回购金额', '操作'],
    rows: [
      ['R001', '1.0', '1.95%', '2.00%', '0.3', '发送'],
      ['R007', '0.9', '1.95%', '2.00%', '0.8', '发送'],
      ['R014', '0.88', '1.95%', '2.00%', '0.3', '发送'],
      ['R028', '0.39', '1.95%', '2.00%', '0.2', '发送'],
      ['R028+', '0.91', '1.95%', '2.00%', '0.5', '发送'],
    ],
    greenColumns: [2],
    redColumns: [3],
    buttonColumn: 5,
  },
  {
    id: 'non-bank',
    title: '非银报价',
    columns: ['机构', '期限', '正回购金额', '正回购利率', '逆回购利率', '逆回购金额', '时间', '操作'],
    rows: [
      ['中信证券', 'R007', '200亿', '2.05%', '1.98%', '200亿', '10:53:27', '发送'],
      ['中泰证券', 'R014', '120亿', '2.06%', '1.97%', '90亿', '10:53:27', '发送'],
      ['鹏扬基金', 'R007', '50亿', '2.08%', '1.95%', '50亿', '10:53:27', '发送'],
      ['XX基金', 'R028', '80亿', '2.10%', '2.01%', '60亿', '10:53:27', '发送'],
      ['XX证券', 'R021', '90亿', '2.07%', '1.99%', '70亿', '10:53:27', '发送'],
      ['XX基金', 'R014', '60亿', '2.09%', '1.96%', '45亿', '10:53:27', '发送'],
      ['XX证券', 'R007', '110亿', '2.04%', '1.97%', '85亿', '10:53:27', '发送'],
      ['XX基金', 'R001', '70亿', '2.03%', '1.95%', '65亿', '10:53:27', '发送'],
    ],
    greenColumns: [4],
    redColumns: [3],
    buttonColumn: 7,
  },
] as const;

const topQuickFilters = {
  periods: ['全部', '1D', '7D', '14D', '21D', '1M'],
  views: ['今天', '近5日', '更多历史'],
};

const auxChartTabs: Array<{ id: AuxChartTab; label: string }> = [
  { id: 'ncd', label: 'NCD' },
  { id: 'institution-repo', label: '分机构回购' },
  { id: 'fund-structure', label: '机构资金结构' },
];

function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeAuxChart, setActiveAuxChart] = useState<AuxChartTab>('ncd');

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#09111d] text-slate-100">
      <div className="flex h-full flex-col">
        <TopBar currentTime={currentTime} />
        <main className="grid min-h-0 flex-1 grid-cols-[30fr_35fr_35fr] gap-3 overflow-hidden px-3 pb-3 pt-2">
          <LeftSummaryPanel />
          <MainQuoteBoard />
          <RightSidebar activeAuxChart={activeAuxChart} onAuxChartChange={setActiveAuxChart} />
        </main>
      </div>
    </div>
  );
}

function TopBar({ currentTime }: { currentTime: Date }) {
  const formattedDateTime = currentTime.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <header className="border-b border-[#1b2a42] bg-[#0d1726] px-4 py-3 shadow-[inset_0_-1px_0_rgba(74,101,140,0.18)]">
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <div className="text-[28px] font-semibold tracking-[0.04em] text-slate-50">资金实时行情看板</div>
              <div className="mt-1 text-xs text-slate-400">框架 Demo，仅展示最新主报价区与右侧趋势布局关系</div>
            </div>
            <InfoChip label="系统时间" value={formattedDateTime} tone="neutral" />
            <InfoChip label="数据更新" value="10:53:27" tone="good" />
            <InfoChip label="交易日" value="今日" tone="neutral" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {topQuickFilters.periods.map((item, index) => (
              <ToolbarChip key={item} active={index === 0}>
                {item}
              </ToolbarChip>
            ))}
            <div className="mx-1 h-4 w-px bg-[#243552]" />
            {topQuickFilters.views.map((item, index) => (
              <ToolbarChip key={item} active={index === 0}>
                {item}
              </ToolbarChip>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 self-center">
          <InfoChip label="DR007" value="2.15%" tone="alert" />
          <InfoChip label="资金情绪" value="51 / 47 / 50 / 49" tone="neutral" />
          <StatusBadge>平衡</StatusBadge>
        </div>
      </div>
    </header>
  );
}

function LeftSummaryPanel() {
  return (
    <aside className="grid min-h-0 min-w-0 auto-rows-max content-start gap-3 overflow-auto pr-1">
      {leftSections.map((section) => (
        <PanelCard
          key={section.title}
          title={section.title}
          bodyClassName="min-h-0"
          bodyPaddingClassName="p-0"
          bodyFill={false}
        >
          <StructuredTable
            columns={section.columns}
            rows={section.rows}
            greenColumns={section.greenColumns}
            redColumns={section.redColumns}
            deltaColumns={section.deltaColumns}
            emphasisColumns={section.emphasisColumns}
            buttonColumn={section.buttonColumn}
            fitToWidth={section.fitToWidth}
            compact
            flush
            adaptiveHeight
          />
        </PanelCard>
      ))}
    </aside>
  );
}

function MainQuoteBoard() {
  return (
    <section className="grid min-h-0 min-w-0 auto-rows-max content-start gap-3 overflow-auto pr-1">
      {middleSections.map((section, index) => (
        <QuoteSection
          key={section.id}
          title={section.title}
          columns={section.columns}
          rows={section.rows}
          greenColumns={section.greenColumns}
          redColumns={section.redColumns}
          deltaColumns={section.deltaColumns}
          buttonColumn={section.buttonColumn}
          emphasized={index === 0}
        />
      ))}
    </section>
  );
}

function RightSidebar({
  activeAuxChart,
  onAuxChartChange,
}: {
  activeAuxChart: AuxChartTab;
  onAuxChartChange: (tab: AuxChartTab) => void;
}) {
  return (
    <aside className="grid min-h-0 min-w-0 grid-rows-[60fr_40fr] gap-3 overflow-hidden">
      <PanelCard title="趋势一览" bodyClassName="min-h-0">
        <TrendOverviewCard />
      </PanelCard>

      <PanelCard title="其他图表" bodyClassName="min-h-0 flex flex-col" bodyPaddingClassName="p-2.5">
        <div className="grid h-full min-h-0 grid-rows-[auto_1fr] gap-3 overflow-hidden">
          <div className="flex flex-wrap gap-1.5">
            {auxChartTabs.map((tab) => (
              <button
                key={tab.id}
                className={auxTabClass(tab.id === activeAuxChart)}
                onClick={() => onAuxChartChange(tab.id)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="min-h-0 overflow-hidden">
            <MiniChartCard title={auxChartTabs.find((item) => item.id === activeAuxChart)?.label ?? ''} bars={activeAuxChart === 'fund-structure'} />
          </div>
        </div>
      </PanelCard>
    </aside>
  );
}

function QuoteSection({
  title,
  columns,
  rows,
  greenColumns,
  redColumns,
  deltaColumns,
  buttonColumn,
  emphasized,
}: {
  title: string;
  columns: readonly string[];
  rows: readonly (readonly string[])[];
  greenColumns?: readonly number[];
  redColumns?: readonly number[];
  deltaColumns?: readonly number[];
  buttonColumn?: number;
  emphasized?: boolean;
}) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border ${
        emphasized ? 'border-[#3b76f3] bg-[#0c1730]' : 'border-[#1f2f48] bg-[#0c1524]'
      }`}
    >
      <div className="border-b border-[#1b2a42] bg-[#101b2c] px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-base font-semibold text-slate-50">{title}</div>
            <div className="mt-1 text-xs text-slate-500">数据更新：10:53:27</div>
          </div>
          <button
            className="rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300"
            type="button"
          >
            下载
          </button>
        </div>
      </div>

      <div className="min-h-0">
        <StructuredTable
          columns={columns}
          rows={rows}
          greenColumns={greenColumns}
          redColumns={redColumns}
          deltaColumns={deltaColumns}
          buttonColumn={buttonColumn}
          flush
          adaptiveHeight
        />
      </div>
    </section>
  );
}

function StructuredTable({
  columns,
  rows,
  greenColumns = [],
  redColumns = [],
  deltaColumns = [],
  emphasisColumns = [],
  buttonColumn,
  compact = false,
  fitToWidth = false,
  flush = false,
  adaptiveHeight = false,
}: {
  columns: readonly string[];
  rows: readonly (readonly string[])[];
  greenColumns?: readonly number[];
  redColumns?: readonly number[];
  deltaColumns?: readonly number[];
  emphasisColumns?: readonly number[];
  buttonColumn?: number;
  compact?: boolean;
  fitToWidth?: boolean;
  flush?: boolean;
  adaptiveHeight?: boolean;
}) {
  return (
    <div
      className={`${adaptiveHeight ? '' : 'h-full min-h-0'} bg-[#0a1322] ${fitToWidth || adaptiveHeight ? 'overflow-hidden' : 'overflow-auto'} ${
        flush ? 'rounded-none border-0' : 'rounded-xl border border-[#1c2b42]'
      }`}
    >
      <table
        className={`border-separate border-spacing-0 ${fitToWidth ? 'w-full table-fixed' : 'min-w-full whitespace-nowrap'} ${
          compact ? 'text-xs' : 'text-sm'
        }`}
      >
        <thead className="sticky top-0 z-10 bg-[#111d30]">
          <tr>
            {columns.map((column, index) => (
              <th
                key={column}
                className={`border-b border-[#22324d] px-3 py-2 text-[11px] font-medium tracking-[0.02em] text-slate-400 ${
                  index === 0 ? 'text-left' : 'text-right'
                } ${compact ? 'px-2 py-1.5' : 'px-3 py-2.5'} ${fitToWidth ? 'whitespace-normal break-all leading-tight' : ''}`}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`${row[0]}-${rowIndex}`} className={rowIndex % 2 === 0 ? 'bg-transparent' : 'bg-[#0d1726]/55'}>
              {row.map((cell, cellIndex) => (
                <td
                  key={`${row[0]}-${cellIndex}`}
                  className={`border-b border-[#162439] ${compact ? 'px-2.5 py-2' : 'px-3 py-2.5'} ${
                    cellIndex === 0 ? 'text-left' : 'text-right'
                  } ${fitToWidth ? 'overflow-hidden text-ellipsis whitespace-nowrap' : ''}`}
                >
                  {buttonColumn === cellIndex ? (
                    <button
                      className={`rounded-lg border border-blue-500/30 bg-blue-500/20 font-medium text-blue-300 ${
                        compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
                      }`}
                      type="button"
                    >
                      {cell}
                    </button>
                  ) : (
                    <span className={cellClassName(cell, cellIndex, greenColumns, redColumns, deltaColumns, emphasisColumns)}>
                      {cell}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TrendOverviewCard() {
  return (
    <div className="grid h-full min-h-0 grid-rows-[1fr_auto] gap-3">
      <div className="relative min-h-0 overflow-hidden rounded-xl border border-dashed border-[#35507a] bg-[radial-gradient(circle_at_top,#142742,transparent_55%),linear-gradient(180deg,#0d1726,#0a1220)]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(58,81,115,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(58,81,115,0.18)_1px,transparent_1px)] bg-[size:100%_20%,16.66%_100%]" />
        <div className="absolute left-4 top-4 text-xs uppercase tracking-[0.16em] text-slate-500">Trend Overview</div>
        <div className="absolute inset-x-5 bottom-10 top-12">
          <TrendLine color="bg-emerald-400/85" points="8,78 20,82 32,80 44,76 56,74 68,76 80,72 92,70 104,66 116,69 128,64 140,61 152,58 164,60 176,55 188,56 200,52 212,49 224,46 236,45 248,43 260,42 272,44 284,41 296,40" />
          <TrendLine color="bg-blue-400/85" points="8,54 20,50 32,48 44,45 56,42 68,44 80,40 92,39 104,36 116,37 128,34 140,31 152,29 164,30 176,27 188,26 200,23 212,21 224,18 236,20 248,19 260,17 272,18 284,16 296,15" />
          <TrendLine color="bg-violet-400/85" points="8,62 20,64 32,61 44,58 56,55 68,54 80,56 92,53 104,50 116,52 128,49 140,46 152,45 164,44 176,41 188,42 200,40 212,38 224,35 236,36 248,34 260,32 272,30 284,29 296,27" />
          <TrendLine color="bg-amber-400/85" points="8,36 20,34 32,35 44,31 56,29 68,31 80,28 92,26 104,28 116,24 128,22 140,23 152,20 164,19 176,17 188,18 200,16 212,14 224,12 236,13 248,11 260,10 272,9 284,8 296,7" />
        </div>
      </div>
      <div className="rounded-xl border border-[#1c2b42] bg-[#0a1322] px-4 py-3">
        <div className="mb-2 flex flex-wrap gap-2 text-xs text-slate-400">
          <LegendDot color="bg-emerald-400" label="全市场" />
          <LegendDot color="bg-blue-400" label="大行" />
          <LegendDot color="bg-violet-400" label="中小行" />
          <LegendDot color="bg-amber-400" label="非银" />
        </div>
        <div className="text-xs text-slate-500">右侧主图区只保留 1 张趋势总览图，其他图表下沉到底部 40%。</div>
      </div>
    </div>
  );
}

function MiniChartCard({ title, bars = false }: { title: string; bars?: boolean }) {
  return (
    <div className="relative h-full min-h-0 overflow-hidden rounded-xl border border-[#1c2b42] bg-[#0a1322] p-1.5">
      <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-md border border-[#243552] bg-[#0e1827]/90 px-2 py-1">
        <div className="text-xs font-medium text-slate-200">{title}</div>
      </div>
      <div className="pointer-events-none absolute bottom-2.5 left-3 z-10 flex flex-wrap gap-2 text-[11px] text-slate-500">
        <LegendDot color="bg-emerald-400" label="1" />
        <LegendDot color="bg-blue-400" label="7" />
        <LegendDot color="bg-violet-400" label="14" />
      </div>
      <div className="relative h-full min-h-0 overflow-hidden rounded-lg border border-dashed border-[#2f456b] bg-[#0d1726]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(58,81,115,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(58,81,115,0.16)_1px,transparent_1px)] bg-[size:100%_25%,20%_100%]" />
        {bars ? (
          <div className="absolute inset-x-3 bottom-4 top-10 flex items-end gap-2">
            {[58, 74, 65, 82, 70].map((height, index) => (
              <div key={`${title}-${index}`} className="flex flex-1 items-end gap-1">
                {['bg-violet-400/65', 'bg-emerald-400/65', 'bg-blue-400/65', 'bg-pink-400/65'].map((color, barIndex) => (
                  <div
                    key={`${title}-${index}-${barIndex}`}
                    className={`w-full rounded-t ${color}`}
                    style={{ height: `${Math.max(16, height - barIndex * 10)}%` }}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="absolute inset-x-3 bottom-7 top-10">
            <TrendLine color="bg-emerald-400/85" points="6,80 24,76 42,72 60,67 78,61 96,64 114,55 132,48 150,44 168,39" mini />
            <TrendLine color="bg-blue-400/85" points="6,58 24,54 42,47 60,50 78,39 96,35 114,28 132,24 150,19 168,15" mini />
            <TrendLine color="bg-violet-400/85" points="6,69 24,65 42,59 60,54 78,51 96,43 114,39 132,33 150,28 168,23" mini />
          </div>
        )}
      </div>
    </div>
  );
}

function TrendLine({
  color,
  points,
  mini = false,
}: {
  color: string;
  points: string;
  mini?: boolean;
}) {
  return (
    <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox={mini ? '0 0 180 70' : '0 0 304 90'}>
      <polyline
        fill="none"
        points={points}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={mini ? 2 : 2.5}
        className={color.replace('bg-', 'text-')}
      />
    </svg>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span>{label}</span>
    </span>
  );
}

function PanelCard({
  title,
  subtitle,
  bodyClassName,
  bodyPaddingClassName,
  bodyFill = true,
  children,
}: {
  title: string;
  subtitle?: string;
  bodyClassName?: string;
  bodyPaddingClassName?: string;
  bodyFill?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="min-h-0 overflow-hidden rounded-2xl border border-[#1e2f48] bg-[#0d1726] shadow-[0_12px_28px_rgba(3,8,18,0.32)]">
      <div className="border-b border-[#18263b] bg-[#101b2c] px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold tracking-[0.02em] text-slate-50">{title}</div>
            {subtitle ? <div className="mt-1 text-xs text-slate-500">{subtitle}</div> : null}
          </div>
          <button
            className="rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300"
            type="button"
          >
            下载
          </button>
        </div>
      </div>
      <div className={bodyClassName ?? 'p-4'}>
        {bodyClassName ? (
          <div className={`${bodyFill ? 'h-full ' : ''}${bodyPaddingClassName ?? 'p-4'}`}>{children}</div>
        ) : (
          <div className={bodyPaddingClassName ?? 'p-4'}>{children}</div>
        )}
      </div>
    </section>
  );
}

function InfoChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'neutral' | 'good' | 'alert';
}) {
  const toneStyles =
    tone === 'good'
      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
      : tone === 'alert'
        ? 'border-amber-500/20 bg-amber-500/10 text-amber-300'
        : 'border-[#253754] bg-[#101a2b] text-slate-300';

  return (
    <div className={`rounded-full border px-3 py-1.5 text-xs ${toneStyles}`}>
      <span className="text-slate-500">{label}</span>
      <span className="mx-2 text-slate-600">|</span>
      <span>{value}</span>
    </div>
  );
}

function ToolbarChip({ active, children }: { active?: boolean; children: React.ReactNode }) {
  return (
    <button
      className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
        active
          ? 'border-[#3c76f0] bg-[#2551b8] text-white'
          : 'border-[#253754] bg-[#101a2b] text-slate-400 hover:border-[#33507d] hover:text-slate-200'
      }`}
      type="button"
    >
      {children}
    </button>
  );
}

function StatusBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-full border border-[#94712a] bg-[#4b3a10] px-4 py-1.5 text-sm font-semibold text-amber-300">
      {children}
    </div>
  );
}

function toneClass(tone: 'neutral' | 'balanced' | 'watch') {
  if (tone === 'balanced') return 'text-sm font-semibold text-emerald-300';
  if (tone === 'watch') return 'text-sm font-semibold text-amber-300';
  return 'text-sm font-semibold text-slate-300';
}

function auxTabClass(active: boolean) {
  return active
    ? 'rounded-lg border border-[#3c76f0] bg-[#2551b8] px-3 py-1.5 text-xs text-white'
    : 'rounded-lg border border-[#253754] bg-[#101a2b] px-3 py-1.5 text-xs text-slate-400 hover:border-[#33507d] hover:text-slate-200';
}

function cellClassName(
  value: string,
  columnIndex: number,
  greenColumns: readonly number[],
  redColumns: readonly number[],
  deltaColumns: readonly number[],
  emphasisColumns: readonly number[],
) {
  if (columnIndex === 0) return 'font-semibold text-slate-100';
  if (deltaColumns.includes(columnIndex)) {
    if (value.startsWith('-')) return 'font-semibold text-emerald-300';
    if (value.startsWith('+')) return 'font-semibold text-red-400';
    return 'font-medium text-slate-300';
  }
  if (greenColumns.includes(columnIndex)) return 'font-semibold text-emerald-300';
  if (redColumns.includes(columnIndex)) return 'font-semibold text-red-400';
  if (emphasisColumns.includes(columnIndex)) return 'font-medium text-red-400';
  return 'text-slate-300';
}

export default App;
