import { useEffect, useState } from 'react';

type AuxChartTab = 'ncd' | 'institution-repo' | 'fund-structure';
type TrendMode = 'intraday' | 'history' | 'comparison';

const chartPalette = {
  emerald: '#34d399',
  blue: '#60a5fa',
  violet: '#a78bfa',
  amber: '#fbbf24',
  pink: '#f472b6',
} as const;

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
    scrollable: false,
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
    scrollable: false,
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
      ['GC014', '1.3820', '-0.80', '-0.58', '9.26亿', '1.3980', '1.3600', '1.3880'],
      ['GC028', '1.3960', '-0.70', '-0.50', '6.88亿', '1.4220', '1.3820', '1.4010'],
      ['GC091', '1.4180', '-1.20', '-0.84', '2.75亿', '1.4360', '1.4010', '1.4250'],
      ['GC182', '1.4350', '-1.50', '-1.03', '1.92亿', '1.4600', '1.4200', '1.4420'],
      ['R091', '1.3950', '-2.00', '-1.41', '6,157.20万', '1.4050', '1.3700', '1.3700'],
      ['R182', '1.3800', '-1.50', '-1.08', '2,975.70万', '1.4000', '1.3550', '1.3550'],
      ['R273', '1.4120', '-1.10', '-0.77', '1.86亿', '1.4390', '1.4010', '1.4200'],
      ['R364', '1.4280', '-0.90', '-0.63', '1.24亿', '1.4500', '1.4120', '1.4370'],
      ['CG007', '1.3680', '-0.90', '-0.66', '4.52亿', '1.3900', '1.3500', '1.3720'],
      ['CG014', '1.3800', '-1.50', '-1.08', '2,975.70万', '1.4000', '1.3550', '1.3550'],
      ['CG028', '1.3920', '-1.00', '-0.71', '1.48亿', '1.4100', '1.3800', '1.3990'],
      ['CF001', '1.3620', '-0.80', '-0.58', '3.14亿', '1.3810', '1.3500', '1.3660'],
      ['CF007', '1.3740', '-0.70', '-0.51', '2.87亿', '1.3910', '1.3610', '1.3790'],
      ['CF014', '1.3860', '-0.60', '-0.43', '1.92亿', '1.4010', '1.3720', '1.3900'],
      ['CF028', '1.3980', '-0.50', '-0.36', '1.45亿', '1.4160', '1.3840', '1.4020'],
    ],
    greenColumns: [1, 6],
    redColumns: [5, 7],
    deltaColumns: [2, 3],
    fitToWidth: true,
    scrollable: true,
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
    scrollable: false,
  },
  {
    id: 'non-bank',
    title: '非银报价',
    columns: ['机构', '期限', '正回购金额', '正回购利率', '逆回购利率', '逆回购金额', '时间', '操作'],
    rows: [
      ['中信证券', 'R007', '200亿', '2.05%', '1.98%', '200亿', '10:53:27', '发送'],
      ['中泰证券', 'R014', '120亿', '2.06%', '1.97%', '90亿', '10:53:27', '发送'],
      ['鹏扬基金', 'R007', '50亿', '2.08%', '1.95%', '50亿', '10:53:27', '发送'],
      ['兴全基金', 'R028', '80亿', '2.10%', '2.01%', '60亿', '10:53:27', '发送'],
      ['东方证券', 'R021', '90亿', '2.07%', '1.99%', '70亿', '10:53:27', '发送'],
      ['工银瑞信', 'R014', '60亿', '2.09%', '1.96%', '45亿', '10:53:27', '发送'],
      ['光大证券', 'R007', '110亿', '2.04%', '1.97%', '85亿', '10:53:27', '发送'],
      ['华夏基金', 'R001', '70亿', '2.03%', '1.95%', '65亿', '10:53:27', '发送'],
      ['华泰证券', 'R007', '160亿', '2.06%', '1.98%', '140亿', '10:53:27', '发送'],
      ['国泰君安', 'R014', '130亿', '2.07%', '1.99%', '120亿', '10:53:27', '发送'],
      ['招商证券', 'R001', '95亿', '2.02%', '1.94%', '88亿', '10:53:27', '发送'],
      ['广发证券', 'R021', '105亿', '2.08%', '2.00%', '92亿', '10:53:27', '发送'],
      ['易方达基金', 'R007', '68亿', '2.09%', '1.96%', '55亿', '10:53:27', '发送'],
      ['南方基金', 'R014', '72亿', '2.10%', '1.97%', '60亿', '10:53:27', '发送'],
      ['嘉实基金', 'R028', '84亿', '2.11%', '2.02%', '73亿', '10:53:27', '发送'],
      ['博时基金', 'R001', '58亿', '2.04%', '1.95%', '50亿', '10:53:27', '发送'],
      ['中金公司', 'R007', '142亿', '2.05%', '1.98%', '136亿', '10:53:27', '发送'],
      ['申万宏源', 'R014', '118亿', '2.06%', '1.97%', '101亿', '10:53:27', '发送'],
      ['兴证证券', 'R021', '97亿', '2.07%', '1.99%', '84亿', '10:53:27', '发送'],
      ['中欧基金', 'R007', '61亿', '2.08%', '1.96%', '54亿', '10:53:27', '发送'],
      ['富国基金', 'R014', '66亿', '2.09%', '1.97%', '58亿', '10:53:27', '发送'],
      ['汇添富基金', 'R028', '79亿', '2.10%', '2.01%', '68亿', '10:53:27', '发送'],
      ['平安理财', 'R007', '88亿', '2.06%', '1.98%', '72亿', '10:53:27', '发送'],
      ['招银理财', 'R014', '92亿', '2.07%', '1.99%', '81亿', '10:53:27', '发送'],
    ],
    greenColumns: [4],
    redColumns: [3],
    buttonColumn: 7,
    fitToWidth: true,
    scrollable: true,
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

const trendModeTabs: Array<{ id: TrendMode; label: string }> = [
  { id: 'intraday', label: '分时' },
  { id: 'history', label: '历史' },
  { id: 'comparison', label: '对比' },
];

const trendRateSeries = [
  1.932, 1.914, 1.923, 1.941, 1.937, 1.916, 1.908, 1.907, 1.906, 1.935, 1.905, 1.924,
  1.921, 1.911, 1.884, 1.906, 1.908, 1.909, 1.884, 1.911, 1.897, 1.883, 1.859, 1.839,
  1.831, 1.85, 1.832, 1.87, 1.878, 1.905, 1.925, 1.918, 1.904, 1.879, 1.876, 1.872,
  1.891, 1.906, 1.905, 1.879, 1.917, 1.923, 1.944, 1.933, 1.948, 1.947, 1.959, 1.943,
  1.975, 2.0, 2.014, 2.01, 1.999, 2.001, 2.027, 2.031, 2.038, 2.058, 2.028, 2.017,
] as const;

const trendVolumeSeries = [
  880, 460, 420, 980, 1050, 780, 1320, 1540, 1210, 470, 1660, 1100, 980, 1370, 760,
  1600, 1420, 310, 340, 1030, 470, 1040, 620, 1320, 740, 1580, 1200, 980, 960, 640,
  360, 510, 570, 1020, 480, 1030, 460, 450, 1700, 620, 460, 1110, 980, 760, 890, 1180,
  430, 1010, 480, 980, 460, 990, 300, 1090, 380, 1540, 320, 1190, 810, 1040,
] as const;

const trendVolumeColors = trendVolumeSeries.map((_, index) =>
  index % 3 === 0 || index % 5 === 0 ? '#ff8a26' : '#22c1dc',
);

const trendAxisLabels = ['2/22', '3/1', '3/7', '3/13', '3/20', '3/27', '4/2', '4/8', '4/14', '4/22'] as const;
const trendPriceTicks = [2.107, 2.028, 1.948, 1.868] as const;
const trendVolumeTicks = ['2k', '1k', '900', '450', '0'] as const;

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
    <aside className="flex h-full min-h-0 min-w-0 flex-col gap-3 overflow-hidden pr-1">
      {leftSections.map((section) => (
        <div key={section.title} className={section.scrollable ? 'min-h-0 flex-1' : 'shrink-0'}>
          <PanelCard
            title={section.title}
            bodyClassName="min-h-0 flex-1"
            bodyPaddingClassName="p-0"
            bodyFill
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
              adaptiveHeight={!section.scrollable}
              scrollY={section.scrollable}
            />
          </PanelCard>
        </div>
      ))}
    </aside>
  );
}

function MainQuoteBoard() {
  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col gap-3 overflow-hidden pr-1">
      {middleSections.map((section, index) => (
        <div key={section.id} className={section.scrollable ? 'min-h-0 flex-1' : 'shrink-0'}>
          <QuoteSection
            title={section.title}
            columns={section.columns}
            rows={section.rows}
            greenColumns={section.greenColumns}
            redColumns={section.redColumns}
            deltaColumns={section.deltaColumns}
            buttonColumn={section.buttonColumn}
            fitToWidth={section.fitToWidth}
            scrollable={section.scrollable}
            emphasized={index === 0}
          />
        </div>
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
      <div className="min-h-0 overflow-hidden">
        <TrendOverviewCard />
      </div>

      <div className="grid min-h-0 overflow-hidden rounded-xl border border-[#1e2f48] bg-[#0d1726]">
        <div className="grid h-full min-h-0 grid-rows-[auto_1fr] gap-2 overflow-hidden p-2">
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
      </div>
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
  fitToWidth,
  scrollable,
  emphasized,
}: {
  title: string;
  columns: readonly string[];
  rows: readonly (readonly string[])[];
  greenColumns?: readonly number[];
  redColumns?: readonly number[];
  deltaColumns?: readonly number[];
  buttonColumn?: number;
  fitToWidth?: boolean;
  scrollable?: boolean;
  emphasized?: boolean;
}) {
  return (
    <section
      className={`flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border ${
        emphasized ? 'border-[#3b76f3] bg-[#0c1730]' : 'border-[#1f2f48] bg-[#0c1524]'
      }`}
    >
      <div className="border-b border-[#1b2a42] bg-[#101b2c] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3 whitespace-nowrap">
            <div className="text-base font-semibold text-slate-50">{title}</div>
            <div className="text-xs text-slate-500">数据更新：10:53:27</div>
          </div>
          <button
            className="rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300"
            type="button"
          >
            下载
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <StructuredTable
          columns={columns}
          rows={rows}
          greenColumns={greenColumns}
          redColumns={redColumns}
          deltaColumns={deltaColumns}
          buttonColumn={buttonColumn}
          fitToWidth={fitToWidth}
          flush
          adaptiveHeight={!scrollable}
          scrollY={scrollable}
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
  scrollY = false,
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
  scrollY?: boolean;
}) {
  return (
    <div
      className={`${adaptiveHeight ? '' : 'h-full min-h-0'} bg-[#0a1322] ${
        scrollY ? 'overflow-y-auto overflow-x-hidden' : fitToWidth || adaptiveHeight ? 'overflow-hidden' : 'overflow-auto'
      } ${
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
  const [activeTrendMode, setActiveTrendMode] = useState<TrendMode>('history');
  const linePath = buildLinePath(trendRateSeries, 860, 320, 1.82, 2.12);
  const areaPath = buildAreaPath(trendRateSeries, 860, 320, 1.82, 2.12);

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_1fr] overflow-hidden rounded-xl border border-[#284164] bg-[#0b1728]">
      <div className="flex items-center justify-between border-b border-[#203551] bg-[#101d32] px-4 py-3">
        <div className="flex gap-2">
          {trendModeTabs.map((tab) => (
            <button
              key={tab.id}
              className={trendModeButtonClass(tab.id === activeTrendMode)}
              onClick={() => setActiveTrendMode(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm font-semibold text-slate-100">nonbankBest · 14</div>
          <button
            className="rounded-lg border border-[#33507d] bg-[#14223a] px-3 py-1.5 text-xs font-medium text-slate-300"
            type="button"
          >
            导出
          </button>
        </div>
      </div>
      <div className="grid min-h-0 grid-rows-[68fr_26fr_auto] gap-0 px-4 pb-4 pt-3">
        <div className="grid min-h-0 grid-cols-[4rem_1fr]">
          <div className="flex flex-col justify-between pr-3 pb-2 pt-6 text-right text-[10px] text-slate-400">
            {trendPriceTicks.map((tick) => (
              <div key={tick}>{tick.toFixed(3)}</div>
            ))}
          </div>
          <div className="relative min-h-0">
            {trendPriceTicks.map((_, index) => (
              <div
                key={`price-grid-${index}`}
                className="absolute inset-x-0 border-t border-dashed border-[#29476e]"
                style={{ top: `${(index / (trendPriceTicks.length - 1)) * 100}%` }}
              />
            ))}
            <div className="absolute inset-x-0 border-t-2 border-dashed border-[#ff8a26]" style={{ top: '58%' }} />
            <div className="absolute right-3 top-2 flex items-center gap-2 text-xs text-blue-300">
              <span className="h-px w-3 bg-blue-300" />
              <span>最新利率</span>
            </div>
            <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 860 320">
              <path d={areaPath} fill="url(#trend-fill)" />
              <path d={linePath} fill="none" stroke={chartPalette.blue} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5ea3ff" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#5ea3ff" stopOpacity="0.04" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
        <div className="grid min-h-0 grid-cols-[4rem_1fr] border-t border-[#1d3250] pt-2">
          <div className="flex flex-col justify-between pr-3 pb-1 text-right text-[10px] text-slate-400">
            {trendVolumeTicks.map((tick) => (
              <div key={tick}>{tick}</div>
            ))}
          </div>
          <div className="relative min-h-0">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={`vol-grid-${index}`}
                className="absolute inset-x-0 border-t border-dashed border-[#29476e]"
                style={{ top: `${(index / 4) * 100}%` }}
              />
            ))}
            <div className="absolute inset-x-0 bottom-0 top-0 flex items-end gap-[6px]">
              {trendVolumeSeries.map((value, index) => (
                <div
                  key={`vol-${index}`}
                  className="min-w-0 flex-1 rounded-t-[2px]"
                  style={{
                    height: `${(value / 2000) * 100}%`,
                    backgroundColor: trendVolumeColors[index],
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-[4rem_1fr] pt-2">
          <div />
          <div className="grid grid-cols-10 text-[10px] text-slate-400">
            {trendAxisLabels.map((label) => (
              <div key={label} className="text-center">
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniChartCard({ title, bars = false }: { title: string; bars?: boolean }) {
  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_1fr] overflow-hidden rounded-xl border border-[#1c2b42] bg-[#0a1322]">
      <div className="flex items-center justify-between gap-3 border-b border-[#1a2c45] bg-[#0e1827] px-3 py-1.5">
        <div className="text-xs font-medium text-slate-200">{title}</div>
        <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
          <LegendDot color={chartPalette.emerald} label="1" />
          <LegendDot color={chartPalette.blue} label="7" />
          <LegendDot color={chartPalette.violet} label="14" />
        </div>
      </div>
      <div className="min-h-0 p-1.5">
        <div className="relative h-full min-h-0 overflow-hidden rounded-lg border border-dashed border-[#2f456b] bg-[#0d1726]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(58,81,115,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(58,81,115,0.16)_1px,transparent_1px)] bg-[size:100%_25%,20%_100%]" />
        {bars ? (
          <div className="absolute inset-x-2.5 bottom-2.5 top-2.5 flex items-end gap-1.5">
            {[58, 74, 65, 82, 70].map((height, index) => (
              <div key={`${title}-${index}`} className="flex flex-1 items-end gap-1">
                {[chartPalette.violet, chartPalette.emerald, chartPalette.blue, chartPalette.pink].map((color, barIndex) => (
                  <div
                    key={`${title}-${index}-${barIndex}`}
                    className="w-full rounded-t"
                    style={{ height: `${Math.max(16, height - barIndex * 10)}%`, backgroundColor: color, opacity: 0.72 }}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="absolute inset-2.5">
            <div className="relative h-full w-full">
              <TrendLine stroke={chartPalette.emerald} points="6,80 24,76 42,72 60,67 78,61 96,64 114,55 132,48 150,44 168,39" mini />
              <TrendLine stroke={chartPalette.blue} points="6,58 24,54 42,47 60,50 78,39 96,35 114,28 132,24 150,19 168,15" mini />
              <TrendLine stroke={chartPalette.violet} points="6,69 24,65 42,59 60,54 78,51 96,43 114,39 132,33 150,28 168,23" mini />
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

function TrendLine({
  stroke,
  points,
  mini = false,
}: {
  stroke: string;
  points: string;
  mini?: boolean;
}) {
  return (
    <svg className="h-full w-full" preserveAspectRatio="none" viewBox={mini ? '0 0 180 70' : '0 0 304 90'}>
      <polyline
        fill="none"
        points={points}
        stroke={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={mini ? 2 : 2.5}
        strokeOpacity={0.92}
      />
    </svg>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </span>
  );
}

function trendModeButtonClass(active: boolean) {
  return active
    ? 'rounded-lg border border-[#3d74f1] bg-[#2a5fda] px-3 py-1.5 text-sm font-semibold text-white'
    : 'rounded-lg border border-[#2a4164] bg-[#0f1b2f] px-3 py-1.5 text-sm font-semibold text-slate-200';
}

function buildLinePath(values: readonly number[], width: number, height: number, min: number, max: number) {
  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / (max - min)) * height;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

function buildAreaPath(values: readonly number[], width: number, height: number, min: number, max: number) {
  const line = buildLinePath(values, width, height, min, max);
  return `${line} L ${width} ${height} L 0 ${height} Z`;
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
    <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1e2f48] bg-[#0d1726] shadow-[0_12px_28px_rgba(3,8,18,0.32)]">
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
      <div className={bodyClassName ? `min-h-0 flex-1 ${bodyClassName}` : bodyPaddingClassName ?? 'p-4'}>
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
