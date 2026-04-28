import { useEffect, useState } from 'react';

type AuxChartTab = 'ncd' | 'institution-repo' | 'fund-structure';
type TrendMode = 'intraday' | 'history' | 'comparison';
type OverlayProduct = 'none' | 'dr007' | 'gc007' | 'r007';
type RightLowerTab = 'cfets' | 'fund-structure';

type SummaryTableSection = {
  layout: 'table';
  title: string;
  columns: readonly string[];
  rows: readonly (readonly string[])[];
  greenColumns?: readonly number[];
  redColumns?: readonly number[];
  deltaColumns?: readonly number[];
  emphasisColumns?: readonly number[];
  buttonColumn?: number;
  fitToWidth?: boolean;
  columnWidths?: readonly string[];
  scrollable: boolean;
};

type ExchangeMarketSplitSection = {
  layout: 'exchange-split';
  title: string;
  scrollable: boolean;
  markets: readonly {
    id: 'sse' | 'szse';
    title: string;
    columns: readonly string[];
    rows: readonly (readonly string[])[];
    greenColumns?: readonly number[];
    deltaColumns?: readonly number[];
  }[];
};

const chartPalette = {
  emerald: '#34d399',
  blue: '#60a5fa',
  violet: '#a78bfa',
  amber: '#fbbf24',
  pink: '#f472b6',
  red: '#f87171',
} as const;

const leftSections: readonly (SummaryTableSection | ExchangeMarketSplitSection)[] = [
  {
    layout: 'table',
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
    layout: 'table',
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
    columnWidths: ['11%', '10%', '16%', '15%', '15%', '16%', '10%', '7%'],
    scrollable: false,
  },
  {
    layout: 'exchange-split',
    title: '交易所回购',
    markets: [
      {
        id: 'sse',
        title: '上交所',
        columns: ['期限', '品种', '最新', '涨跌bp'],
        rows: [
          ['1天', 'GC001', '1.3700', '-1.00'],
          ['7天', 'GC007', '1.3750', '-1.00'],
          ['14天', 'GC014', '1.3820', '-0.80'],
          ['21天', 'GC021', '1.3890', '-0.70'],
          ['28天', 'GC028', '1.3960', '-0.70'],
        ],
        greenColumns: [2],
        deltaColumns: [3],
      },
      {
        id: 'szse',
        title: '深交所',
        columns: ['期限', '品种', '最新', '涨跌bp'],
        rows: [
          ['1天', 'R-001', '1.3900', '-1.50'],
          ['7天', 'R-007', '1.4000', '-0.50'],
          ['14天', 'R-014', '1.4050', '-0.50'],
          ['21天', 'R-021', '1.4030', '-0.60'],
          ['28天', 'R-028', '1.4000', '-1.00'],
        ],
        greenColumns: [2],
        deltaColumns: [3],
      },
    ],
    scrollable: false,
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

const topBoardFilters = {
  periods: ['全部', '1', '7', '14', '21', '28+'],
  amountMin: '0',
  amountMax: '不限',
  rateMin: '0.00',
  rateMax: '不限',
} as const;

const auxChartTabs: Array<{ id: AuxChartTab; label: string }> = [
  { id: 'ncd', label: 'NCD' },
  { id: 'institution-repo', label: '分机构回购' },
  { id: 'fund-structure', label: '机构资金结构' },
];

const overlayProductOptions: Array<{ id: OverlayProduct; label: string }> = [
  { id: 'none', label: '不叠加' },
  { id: 'dr007', label: 'DR007' },
  { id: 'gc007', label: 'GC007' },
  { id: 'r007', label: 'R007' },
];

const rightLowerTabs: Array<{ id: RightLowerTab; label: string }> = [
  { id: 'cfets', label: 'CFETS日报统计' },
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

const intradaySeries = [
  1.948, 1.946, 1.944, 1.945, 1.947, 1.95, 1.948, 1.946, 1.943, 1.941, 1.942, 1.944,
  1.945, 1.943, 1.942, 1.939, 1.936, 1.934, 1.933, 1.936, 1.939, 1.943, 1.946, 1.948,
  1.949, 1.951, 1.954, 1.956, 1.955, 1.957, 1.96, 1.963, 1.966, 1.968, 1.967, 1.969,
  1.971, 1.974, 1.976, 1.979,
] as const;

const intradayTimeLabels = ['09:30', '10:00', '10:30', '11:00', '13:30', '14:00', '14:30', '15:00'] as const;

const cfetsSummaryCards = [
  { label: '净融出', value: '+428亿', tone: 'good' },
  { label: 'DR007', value: '2.15%', tone: 'alert' },
  { label: '非银占比', value: '49.8%', tone: 'neutral' },
  { label: '成交总额', value: '5,824亿', tone: 'neutral' },
] as const;

const cfetsDetailRows = [
  ['回购成交', '4,631亿', '较昨 +6.2%'],
  ['XREPO成交', '782亿', '较昨 -1.5%'],
  ['大行净融出', '+215亿', '边际走松'],
  ['非银需求', '偏强', '隔夜至 14D 活跃'],
] as const;

const ncdTrendSeries = [1.94, 1.95, 1.96, 1.97, 1.98, 1.97, 1.99, 2.0, 1.99, 2.01, 2.02, 2.01, 2.02, 2.03] as const;
const ncdThreeMonthSeries = [1.99, 2.0, 2.01, 2.02, 2.03, 2.02, 2.03, 2.04, 2.05, 2.05, 2.06, 2.05, 2.06, 2.07] as const;
const ncdOneYearSeries = [2.08, 2.08, 2.09, 2.09, 2.1, 2.09, 2.1, 2.11, 2.11, 2.12, 2.12, 2.11, 2.12, 2.13] as const;
const auxChartLabels = ['4/9', '4/10', '4/11', '4/12', '4/13', '4/14', '4/15', '4/16', '4/17', '4/18', '4/19', '4/20', '4/21', '4/22'] as const;
const compactAuxChartLabels = ['4/9', '4/11', '4/13', '4/15', '4/17', '4/19', '4/22'] as const;
const ncdTableRows = [
  ['1M', '2.03%', '+2', '2.01%', '10:53:27'],
  ['3M', '2.07%', '+1', '2.05%', '10:53:27'],
  ['6M', '2.11%', '+1', '2.08%', '10:53:27'],
  ['9M', '2.14%', '0', '2.11%', '10:53:27'],
  ['1Y', '2.13%', '-1', '2.10%', '10:53:27'],
] as const;
const fundStructureBars = [
  [700, 560, 360, 180, 630, 480, 640],
  [760, 420, 420, 270, 780, 610, 820],
  [820, 930, 520, 360, 560, 720, 980],
  [720, 510, 390, 250, 710, 540, 860],
  [260, 180, 410, 230, 1030, 390, 600],
  [320, 1120, 540, 350, 240, 520, 640],
  [1040, 320, 370, 240, 540, 440, 720],
  [220, 410, 300, 170, 590, 710, 820],
  [980, 360, 620, 420, 740, 610, 620],
  [440, 870, 410, 260, 660, 920, 860],
  [820, 210, 690, 490, 370, 560, 680],
  [1010, 720, 300, 220, 840, 430, 640],
  [760, 340, 520, 320, 690, 520, 710],
  [690, 560, 240, 190, 520, 390, 560],
] as const;
const fundStructureLegendItems = [
  { color: '#7286d3', label: '大行' },
  { color: '#a9d57f', label: '股份行' },
  { color: '#f4cf68', label: '理财' },
  { color: '#f6a960', label: '理财子' },
  { color: '#ea7878', label: '券商' },
  { color: '#8bc6de', label: '基金' },
  { color: '#63b383', label: '保险' },
] as const;

function App() {
  const [currentTime, setCurrentTime] = useState(new Date());

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
          <RightSidebar />
        </main>
      </div>
    </div>
  );
}

function TopBar({ currentTime }: { currentTime: Date }) {
  return (
    <header className="border-b border-[#1b2a42] bg-[#0d1726] px-4 py-3 shadow-[inset_0_-1px_0_rgba(74,101,140,0.18)]">
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <div className="text-[28px] font-semibold tracking-[0.04em] text-slate-50">资金实时行情看板</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 text-sm text-slate-400">
            <FilterLabel>期限</FilterLabel>
            <div className="flex flex-wrap items-center gap-1.5">
              {topBoardFilters.periods.map((item, index) => (
                <ToolbarChip key={item} active={index === 0}>
                  {item}
                </ToolbarChip>
              ))}
            </div>
            <FilterDivider />
            <FilterLabel>金额</FilterLabel>
            <RangeFilterField value={topBoardFilters.amountMin} />
            <span className="text-slate-500">~</span>
            <RangeFilterField value={topBoardFilters.amountMax} />
            <span className="text-slate-500">亿</span>
            <FilterDivider />
            <FilterLabel>利率</FilterLabel>
            <RangeFilterField value={topBoardFilters.rateMin} />
            <span className="text-slate-500">~</span>
            <RangeFilterField value={topBoardFilters.rateMax} />
            <span className="text-slate-500">%</span>
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
  const summarySections = leftSections.filter((section): section is SummaryTableSection => section.layout === 'table');
  const exchangeRepoSection = leftSections.find(
    (section): section is ExchangeMarketSplitSection => section.layout === 'exchange-split',
  );

  return (
    <aside className="flex h-full min-h-0 min-w-0 flex-col gap-3 overflow-hidden pr-1">
      {summarySections.map((section) => (
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
              columnWidths={section.columnWidths}
              compact
              flush
              adaptiveHeight={!section.scrollable}
              scrollY={section.scrollable}
            />
          </PanelCard>
        </div>
      ))}
      {exchangeRepoSection ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="h-[284px] shrink-0 overflow-hidden">
            <ExchangeRepoCard title={exchangeRepoSection.title} markets={exchangeRepoSection.markets} />
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            <LeftNcdCard />
          </div>
        </div>
      ) : null}
    </aside>
  );
}

function LeftNcdCard() {
  const [mode, setMode] = useState<'trend' | 'table'>('trend');

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1e2f48] bg-[#0d1726] shadow-[0_12px_28px_rgba(3,8,18,0.32)]">
      <div className="border-b border-[#18263b] bg-[#101b2c] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold tracking-[0.02em] text-slate-50">NCD</div>
          <div className="flex items-center gap-2">
            <button className={auxTabClass(mode === 'trend')} onClick={() => setMode('trend')} type="button">
              趋势图
            </button>
            <button className={auxTabClass(mode === 'table')} onClick={() => setMode('table')} type="button">
              表格
            </button>
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden p-2">
        {mode === 'trend' ? (
          <NcdTrendPanel compact />
        ) : (
          <div className="h-full min-h-0">
            <StructuredTable
              columns={['期限', '最新', '涨跌bp', '参考收益', '更新时间']}
              rows={ncdTableRows}
              greenColumns={[1]}
              deltaColumns={[2]}
              fitToWidth
              columnWidths={['14%', '18%', '16%', '22%', '30%']}
              compact
              flush={false}
              scrollY
            />
          </div>
        )}
      </div>
    </section>
  );
}

function ExchangeRepoCard({
  title,
  markets,
}: {
  title: string;
  markets: ExchangeMarketSplitSection['markets'];
}) {
  const [activeView, setActiveView] = useState<'core' | 'sse' | 'szse'>('core');
  const filteredMarkets =
    activeView === 'core' ? markets : markets.filter((market) => market.id === activeView);

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1e2f48] bg-[#0d1726] shadow-[0_12px_28px_rgba(3,8,18,0.32)]">
      <div className="border-b border-[#18263b] bg-[#101b2c] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold tracking-[0.02em] text-slate-50">{title}</div>
          <div className="flex items-center gap-2">
            {[
              { id: 'core', label: '核心' },
              { id: 'sse', label: '上交所' },
              { id: 'szse', label: '深交所' },
            ].map((tab) => (
              <button
                key={tab.id}
                className={auxTabClass(tab.id === activeView)}
                onClick={() => setActiveView(tab.id as 'core' | 'sse' | 'szse')}
                type="button"
              >
                {tab.label}
              </button>
            ))}
            <button
              className="rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300"
              type="button"
            >
              下载
            </button>
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 p-2">
        {activeView === 'core' ? (
          <ExchangeCoreCompactBoard markets={markets} />
        ) : (
          <div className="grid h-full min-h-0 grid-cols-1">
            {filteredMarkets.map((market) => (
              <ExchangeMarketTable
                key={`${activeView}-${market.id}`}
                market={market}
                rows={market.rows}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ExchangeCoreCompactBoard({
  markets,
}: {
  markets: ExchangeMarketSplitSection['markets'];
}) {
  return (
    <div className="grid h-full min-h-0 grid-cols-1 grid-rows-2 gap-2">
      {markets.map((market) => (
        <div key={`core-board-${market.id}`} className="min-h-0">
          <ExchangeCoreCompactBlock rows={market.rows.slice(0, 2)} />
        </div>
      ))}
    </div>
  );
}

function ExchangeCoreCompactBlock({
  rows,
}: {
  rows: readonly (readonly string[])[];
}) {
  return (
    <div
      className="grid h-full min-h-0 overflow-hidden rounded-xl border border-[#1c2b42] bg-[#0a1322]"
      style={{ gridTemplateRows: `auto repeat(${rows.length}, minmax(0, 1fr))` }}
    >
      <div className="grid grid-cols-[0.7fr_1fr_1fr_0.8fr] border-b border-[#22324d] bg-[#111d30] px-4 py-1.5 text-[11px] font-medium tracking-[0.02em] text-slate-400">
        <span className="text-left">期限</span>
        <span className="text-left">品种</span>
        <span className="text-right">最新</span>
        <span className="text-right">涨跌bp</span>
      </div>
      {rows.map((row, rowIndex) => (
        <div
          key={`${row[1]}-${rowIndex}`}
          className={`grid grid-cols-[0.7fr_1fr_1fr_0.8fr] items-center px-4 text-sm ${
            rowIndex === 0 ? 'border-b border-[#162439]' : ''
          }`}
        >
          <span className="font-semibold text-slate-100">{row[0]}</span>
          <span className="font-semibold text-slate-100">{row[1]}</span>
          <span className="text-right font-semibold text-emerald-300">{row[2]}</span>
          <span className={`text-right ${cellClassName(row[3], 1, [], [], [1], [])}`}>{row[3]}</span>
        </div>
      ))}
    </div>
  );
}

function ExchangeMarketTable({
  market,
  rows,
}: {
  market: ExchangeMarketSplitSection['markets'][number];
  rows?: readonly (readonly string[])[];
}) {
  const displayRows = rows ?? market.rows;

  return (
    <div
      className="grid h-full min-h-0 min-w-0 overflow-hidden rounded-xl border border-[#1c2b42] bg-[#0a1322]"
      style={{ gridTemplateRows: `auto repeat(${displayRows.length}, minmax(0, 1fr))` }}
    >
      <div className="grid grid-cols-4 border-b border-[#22324d] bg-[#111d30] text-[11px] font-medium tracking-[0.02em] text-slate-400">
        {market.columns.map((column, index) => (
          <div
            key={`${market.title}-${column}`}
            className={`px-2 py-1.5 ${
              index === 0 ? 'text-left' : 'text-right'
            } ${index === 1 ? 'truncate' : ''}`}
          >
            {column}
          </div>
        ))}
      </div>
      {displayRows.map((row, rowIndex) => (
        <div
          key={`${market.title}-${row[0]}-${rowIndex}`}
          className={`grid min-h-0 grid-cols-4 border-b border-[#162439] text-xs ${
            rowIndex % 2 === 0 ? 'bg-transparent' : 'bg-[#0d1726]/55'
          }`}
        >
          {row.map((cell, cellIndex) => (
            <div
              key={`${market.title}-${row[0]}-${cellIndex}`}
              className={`flex min-h-0 items-center px-2 py-1.5 ${
                cellIndex === 0 ? 'justify-start' : 'justify-end'
              } ${cellIndex === 1 ? 'truncate' : ''}`}
              title={cell}
            >
              <span className={cellClassName(cell, cellIndex, market.greenColumns, [], market.deltaColumns, [])}>
                {cell}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
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

function RightSidebar() {
  const [overlayProduct, setOverlayProduct] = useState<OverlayProduct>('none');
  const [activeLowerTab, setActiveLowerTab] = useState<RightLowerTab>('cfets');

  return (
    <aside className="grid min-h-0 min-w-0 grid-rows-[24fr_38fr_38fr] gap-3 overflow-hidden">
      <div className="min-h-0 overflow-hidden">
        <IntradayPanel overlayProduct={overlayProduct} onOverlayChange={setOverlayProduct} />
      </div>

      <div className="min-h-0 overflow-hidden">
        <KLinePanel overlayProduct={overlayProduct} />
      </div>

      <div className="min-h-0 overflow-hidden">
        <RightLowerPanel activeTab={activeLowerTab} onTabChange={setActiveLowerTab} />
      </div>
    </aside>
  );
}

function IntradayPanel({
  overlayProduct,
  onOverlayChange,
}: {
  overlayProduct: OverlayProduct;
  onOverlayChange: (product: OverlayProduct) => void;
}) {
  const overlaySeries = overlayProduct === 'none' ? null : buildOverlaySeries(intradaySeries, overlayProduct);
  const mainPath = buildLinePath(intradaySeries, 680, 150, 1.928, 1.986);
  const overlayPath = overlaySeries ? buildLinePath(overlaySeries, 680, 150, 1.928, 1.986) : null;

  return (
    <section className="grid h-full min-h-0 grid-rows-[auto_1fr] overflow-hidden rounded-xl border border-[#284164] bg-[#0b1728]">
      <div className="flex items-center justify-between gap-3 border-b border-[#203551] bg-[#101d32] px-3 py-2">
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold text-slate-100">分时</div>
          <OverlayProductSelect value={overlayProduct} onChange={onOverlayChange} />
        </div>
        <div className="text-xs text-slate-400">nonbankBest · R014</div>
      </div>
      <div className="grid min-h-0 grid-cols-[3rem_1fr] px-3 pb-2 pt-2">
        <div className="flex flex-col justify-between pr-2 text-right text-[10px] text-slate-400">
          {['1.980', '1.964', '1.948', '1.932'].map((tick) => (
            <div key={tick}>{tick}</div>
          ))}
        </div>
        <div className="relative min-h-0">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={`intraday-grid-${index}`}
              className="absolute inset-x-0 border-t border-dashed border-[#29476e]"
              style={{ top: `${(index / 3) * 100}%` }}
            />
          ))}
          <div className="absolute inset-x-0 top-[56%] border-t border-dashed border-[#ff8a26]" />
          <div className="absolute inset-x-0 bottom-5 top-1">
            <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 680 150">
              <path d={mainPath} fill="none" stroke={chartPalette.blue} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {overlayPath ? (
                <path
                  d={overlayPath}
                  fill="none"
                  stroke={chartPalette.amber}
                  strokeWidth="2"
                  strokeDasharray="5 4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}
            </svg>
          </div>
          <div className="absolute right-2 top-1 flex flex-wrap items-center gap-3 text-[10px] text-slate-300">
            <LegendDot color={chartPalette.blue} label="当前品种" />
            {overlayProduct !== 'none' ? <LegendDot color={chartPalette.amber} label={overlayProductLabel(overlayProduct)} /> : null}
          </div>
          <div className="absolute inset-x-0 bottom-0 grid grid-cols-8 text-[10px] text-slate-400">
            {intradayTimeLabels.map((label) => (
              <div key={label} className="text-center">
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function KLinePanel({ overlayProduct }: { overlayProduct: OverlayProduct }) {
  const candles = buildCandlesFromSeries(trendRateSeries.slice(-32));
  const candleMin = Math.min(...candles.map((item) => item.low)) - 0.01;
  const candleMax = Math.max(...candles.map((item) => item.high)) + 0.01;
  const overlaySeries = overlayProduct === 'none' ? null : buildOverlaySeries(candles.map((item) => item.close), overlayProduct);
  const overlayPath = overlaySeries ? buildLinePath(overlaySeries, 720, 210, candleMin, candleMax) : null;
  const volumeMax = Math.max(...candles.map((item) => item.volume));

  return (
    <section className="grid h-full min-h-0 grid-rows-[auto_1fr] overflow-hidden rounded-xl border border-[#284164] bg-[#0b1728]">
      <div className="flex items-center justify-between gap-3 border-b border-[#203551] bg-[#101d32] px-3 py-2">
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold text-slate-100">K线</div>
          <div className="text-xs text-slate-400">
            叠加：
            <span className="ml-1 text-slate-200">{overlayProductLabel(overlayProduct)}</span>
          </div>
        </div>
        <div className="text-xs text-slate-400">历史 · 近 30 日</div>
      </div>
      <div className="grid min-h-0 grid-rows-[68fr_24fr_auto] px-3 pb-2 pt-2">
        <div className="grid min-h-0 grid-cols-[3.25rem_1fr]">
          <div className="flex flex-col justify-between pr-2 text-right text-[10px] text-slate-400">
            {buildAxisLabels(candleMin, candleMax, 4).map((label) => (
              <div key={label}>{label}</div>
            ))}
          </div>
          <div className="relative min-h-0">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={`k-grid-${index}`}
                className="absolute inset-x-0 border-t border-dashed border-[#29476e]"
                style={{ top: `${(index / 3) * 100}%` }}
              />
            ))}
            <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 720 210">
              {candles.map((candle, index) => {
                const x = ((index + 0.5) / candles.length) * 720;
                const openY = valueToY(candle.open, 210, candleMin, candleMax);
                const closeY = valueToY(candle.close, 210, candleMin, candleMax);
                const highY = valueToY(candle.high, 210, candleMin, candleMax);
                const lowY = valueToY(candle.low, 210, candleMin, candleMax);
                const bullish = candle.close >= candle.open;
                const color = bullish ? chartPalette.emerald : chartPalette.red;
                const bodyTop = Math.min(openY, closeY);
                const bodyHeight = Math.max(Math.abs(closeY - openY), 2);
                return (
                  <g key={`candle-${index}`}>
                    <line x1={x} x2={x} y1={highY} y2={lowY} stroke={color} strokeWidth="1.5" />
                    <rect x={x - 8} y={bodyTop} width={16} height={bodyHeight} fill={bullish ? `${color}55` : color} stroke={color} strokeWidth="1.2" rx="1" />
                  </g>
                );
              })}
              {overlayPath ? (
                <path
                  d={overlayPath}
                  fill="none"
                  stroke={chartPalette.amber}
                  strokeWidth="2"
                  strokeDasharray="5 4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}
            </svg>
          </div>
        </div>
        <div className="grid min-h-0 grid-cols-[3.25rem_1fr] border-t border-[#1d3250] pt-2">
          <div className="flex flex-col justify-between pr-2 text-right text-[10px] text-slate-400">
            {['1.8k', '1.2k', '600', '0'].map((tick) => (
              <div key={tick}>{tick}</div>
            ))}
          </div>
          <div className="relative min-h-0">
            <div className="absolute inset-0 flex items-end gap-[4px]">
              {candles.map((candle, index) => (
                <div
                  key={`k-vol-${index}`}
                  className="min-w-0 flex-1 rounded-t-[2px]"
                  style={{
                    height: `${(candle.volume / volumeMax) * 100}%`,
                    backgroundColor: candle.close >= candle.open ? '#22c1dc' : '#ff8a26',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-[3.25rem_1fr] pt-2">
          <div />
          <div className="grid grid-cols-8 text-[10px] text-slate-400">
            {['3/1', '3/5', '3/10', '3/15', '3/20', '4/1', '4/10', '4/22'].map((label) => (
              <div key={label} className="text-center">
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function RightLowerPanel({
  activeTab,
  onTabChange,
}: {
  activeTab: RightLowerTab;
  onTabChange: (tab: RightLowerTab) => void;
}) {
  return (
    <section className="grid h-full min-h-0 grid-rows-[auto_1fr] overflow-hidden rounded-xl border border-[#284164] bg-[#0b1728]">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[#203551] bg-[#101d32] px-2 py-2">
        {rightLowerTabs.map((tab) => (
          <button
            key={tab.id}
            className={auxTabClass(tab.id === activeTab)}
            onClick={() => onTabChange(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="h-full min-h-0 overflow-hidden p-2.5">
        {activeTab === 'cfets' ? <CfetsDailyPanel /> : <AuxTabPanel type={activeTab} />}
      </div>
    </section>
  );
}

function CfetsDailyPanel() {
  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_auto_1fr] gap-2">
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        {cfetsSummaryCards.map((card) => (
          <div key={card.label} className="rounded-lg border border-[#223754] bg-[#0f1a2d] px-3 py-2">
            <div className="text-[11px] text-slate-500">{card.label}</div>
            <div className={`mt-1 text-base font-semibold ${card.tone === 'good' ? 'text-emerald-300' : card.tone === 'alert' ? 'text-amber-300' : 'text-slate-100'}`}>
              {card.value}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs xl:grid-cols-4">
        {cfetsDetailRows.map((row) => (
          <div key={row[0]} className="rounded-lg border border-[#1d3250] bg-[#0d1726] px-3 py-2">
            <div className="text-slate-500">{row[0]}</div>
            <div className="mt-1 font-semibold text-slate-100">{row[1]}</div>
            <div className="mt-1 text-slate-400">{row[2]}</div>
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-lg border border-[#1c2f49] bg-[#0d1726]">
        <table className="min-w-full text-xs">
          <thead className="bg-[#101d32] text-slate-400">
            <tr>
              {['日期', '公开市场操作', '净投放', 'MLF', '关注点'].map((column) => (
                <th key={column} className="px-3 py-2 text-left font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['2026-04-22', '逆回购 7D', '+40亿', '--', '短端偏稳'],
              ['2026-04-21', '逆回购到期', '-10亿', '--', '大行融出维持'],
              ['2026-04-20', '逆回购 7D', '+5亿', '--', '非银需求回升'],
              ['2026-04-17', '逆回购 7D', '+1985亿', '--', '月内跨季预期升温'],
            ].map((row) => (
              <tr key={row[0]} className="border-t border-[#162439] text-slate-300">
                {row.map((cell, index) => (
                  <td key={`${row[0]}-${index}`} className="px-3 py-2">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AuxTabPanel({ type }: { type: Exclude<RightLowerTab, 'cfets'> }) {
  if (type === 'fund-structure') {
    return <FundStructurePanel />;
  }
  return null;
}

function NcdTrendPanel({ compact = false }: { compact?: boolean }) {
  const allSeries = [ncdTrendSeries, ncdThreeMonthSeries, ncdOneYearSeries];
  const min = Math.min(...allSeries.flat()) - 0.02;
  const max = Math.max(...allSeries.flat()) + 0.02;
  const width = compact ? 520 : 720;
  const height = compact ? 120 : 180;
  const oneMonthPath = buildLinePath(ncdTrendSeries, width, height, min, max);
  const threeMonthPath = buildLinePath(ncdThreeMonthSeries, width, height, min, max);
  const oneYearPath = buildLinePath(ncdOneYearSeries, width, height, min, max);
  const area = buildAreaPath(ncdTrendSeries, width, height, min, max);
  const labels = compact ? compactAuxChartLabels : auxChartLabels;

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_1fr_auto] gap-2 overflow-hidden rounded-lg border border-[#1c2f49] bg-[#0d1726] p-2">
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex flex-wrap items-center gap-3">
          <LegendDot color={chartPalette.blue} label="1M" />
          <LegendDot color={chartPalette.emerald} label="3M" />
          <LegendDot color={chartPalette.amber} label="1Y" />
        </div>
        <span>近14天</span>
      </div>
      <div className="relative min-h-0 overflow-hidden rounded-md border border-dashed border-[#2f456b]">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={`ncd-grid-${index}`}
            className="absolute inset-x-0 border-t border-dashed border-[#29476e]"
            style={{ top: `${(index / 3) * 100}%` }}
          />
        ))}
        <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <linearGradient id="ncd-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5ea3ff" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#5ea3ff" stopOpacity="0.04" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#ncd-fill)" />
          <path d={oneMonthPath} fill="none" stroke={chartPalette.blue} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d={threeMonthPath} fill="none" stroke={chartPalette.emerald} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d={oneYearPath} fill="none" stroke={chartPalette.amber} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className={`grid ${compact ? 'grid-cols-7' : 'grid-cols-14'} text-center text-[9px] text-slate-400`}>
        {labels.map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>
    </div>
  );
}

function FundStructurePanel() {
  const yTicks = [5000, 4000, 3000, 2000, 1000, 0] as const;

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_1fr_auto] gap-2 overflow-hidden rounded-lg border border-[#1c2f49] bg-[#0d1726] p-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex flex-wrap items-center gap-3">
          {fundStructureLegendItems.map((item) => (
            <LegendDot key={item.label} color={item.color} label={item.label} />
          ))}
        </div>
        <span>近14天</span>
      </div>
      <div className="grid min-h-0 grid-cols-[3rem_1fr] gap-2">
        <div className="flex flex-col justify-between pb-2 pt-1 text-right text-[10px] text-slate-400">
          {yTicks.map((tick) => (
            <div key={tick}>{tick.toLocaleString()}</div>
          ))}
        </div>
        <div className="relative min-h-0 overflow-hidden rounded-md border border-dashed border-[#2f456b]">
          {yTicks.map((tick, index) => (
            <div
              key={`fund-grid-${tick}`}
              className="absolute inset-x-0 border-t border-dashed border-[#29476e]"
              style={{ top: `${(index / (yTicks.length - 1)) * 100}%` }}
            />
          ))}
          <div className="absolute inset-x-3 bottom-2 top-2 flex items-end gap-1.5">
            {fundStructureBars.map((values, index) => (
              <div key={`fund-bar-${index}`} className="flex h-full min-w-0 flex-1 items-end">
                <div className="flex h-full w-full flex-col justify-end overflow-hidden rounded-t-[3px]">
                  {values.map((value, partIndex) => (
                    <div
                      key={`fund-bar-${index}-${partIndex}`}
                      className={partIndex === values.length - 1 ? 'rounded-t-[3px]' : ''}
                      style={{
                        height: `${(value / 5000) * 100}%`,
                        backgroundColor: fundStructureLegendItems[partIndex].color,
                        opacity: 0.9,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-[3rem_1fr]">
        <div />
        <div className="grid grid-cols-14 text-[9px] text-slate-400">
          {auxChartLabels.map((label) => (
            <div key={`fund-label-${label}`} className="flex justify-center overflow-visible">
              <span className="origin-top-left -rotate-45 whitespace-nowrap">{`2026-${label}`}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OverlayProductSelect({
  value,
  onChange,
}: {
  value: OverlayProduct;
  onChange: (product: OverlayProduct) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-slate-400">
      <span>叠加品种</span>
      <select
        className="rounded-md border border-[#2a4164] bg-[#0f1b2f] px-2 py-1 text-xs text-slate-200 outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value as OverlayProduct)}
      >
        {overlayProductOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
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
  columnWidths,
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
  columnWidths?: readonly string[];
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
        {columnWidths ? (
          <colgroup>
            {columnWidths.map((width, index) => (
              <col key={`col-${index}`} style={{ width }} />
            ))}
          </colgroup>
        ) : null}
        <thead className="sticky top-0 z-10 bg-[#111d30]">
          <tr>
            {columns.map((column, index) => (
              <th
                key={column}
                className={`border-b border-[#22324d] px-3 py-2 text-[11px] font-medium tracking-[0.02em] text-slate-400 ${
                  index === 0 ? 'text-left' : 'text-right'
                } ${compact ? 'px-2 py-1.5' : 'px-3 py-2.5'} ${
                  fitToWidth ? (columnWidths ? 'whitespace-nowrap leading-tight' : 'whitespace-normal break-all leading-tight') : ''
                }`}
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

function overlayProductLabel(product: OverlayProduct) {
  return overlayProductOptions.find((option) => option.id === product)?.label ?? '不叠加';
}

function buildOverlaySeries(values: readonly number[], product: OverlayProduct) {
  const delta = product === 'dr007' ? 0.012 : product === 'gc007' ? -0.008 : 0.004;
  return values.map((value, index) => value + delta + Math.sin(index / 3.2) * 0.0025);
}

function buildCandlesFromSeries(values: readonly number[]) {
  const candles = [];
  for (let index = 0; index < values.length - 1; index += 2) {
    const open = values[index];
    const close = values[index + 1];
    const high = Math.max(open, close) + 0.006 + (index % 3) * 0.0015;
    const low = Math.min(open, close) - 0.006 - (index % 2) * 0.001;
    const volume = 520 + ((index * 97) % 1100);
    candles.push({ open, close, high, low, volume });
  }
  return candles;
}

function buildAxisLabels(min: number, max: number, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const value = max - ((max - min) * index) / (count - 1);
    return value.toFixed(3);
  });
}

function valueToY(value: number, height: number, min: number, max: number) {
  return height - ((value - min) / (max - min)) * height;
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

function FilterLabel({ children }: { children: React.ReactNode }) {
  return <span className="px-1 text-slate-400">{children}</span>;
}

function FilterDivider() {
  return <div className="mx-2 h-6 w-px bg-[#243552]" />;
}

function RangeFilterField({ value }: { value: string }) {
  return (
    <div className="flex h-8 min-w-[96px] items-center rounded-lg border border-[#2a4164] bg-[#101a2b] px-3 text-sm text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      {value}
    </div>
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
