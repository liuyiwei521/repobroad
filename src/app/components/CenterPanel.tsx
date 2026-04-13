import { useState, useEffect } from 'react';
import { Send, User, Phone, Clock, Download, ChevronDown, ChevronRight } from 'lucide-react';
import type { Quote } from '../App';

const bankDetailsByPeriod: Record<string, Array<{ name: string; bidRate: number; bidVolume: number; askRate: number; askVolume: number }>> = {
  '1':   [
    { name: '建设银行', bidRate: 1.90, bidVolume: 1000, askRate: 2.00, askVolume: 1000 },
    { name: '工商银行', bidRate: 1.92, bidVolume: 800,  askRate: 2.02, askVolume: 800  },
    { name: '农业银行', bidRate: 1.91, bidVolume: 700,  askRate: 2.01, askVolume: 700  },
    { name: '中国银行', bidRate: 1.93, bidVolume: 600,  askRate: 2.03, askVolume: 600  },
  ],
  '7':   [
    { name: '建设银行', bidRate: 2.10, bidVolume: 1200, askRate: 2.20, askVolume: 1200 },
    { name: '工商银行', bidRate: 2.12, bidVolume: 900,  askRate: 2.22, askVolume: 900  },
    { name: '农业银行', bidRate: 2.08, bidVolume: 800,  askRate: 2.18, askVolume: 800  },
    { name: '中国银行', bidRate: 2.11, bidVolume: 700,  askRate: 2.21, askVolume: 700  },
  ],
  '14':  [
    { name: '建设银行', bidRate: 2.22, bidVolume: 600,  askRate: 2.32, askVolume: 600  },
    { name: '工商银行', bidRate: 2.20, bidVolume: 500,  askRate: 2.30, askVolume: 500  },
    { name: '农业银行', bidRate: 2.23, bidVolume: 450,  askRate: 2.33, askVolume: 450  },
    { name: '中国银行', bidRate: 2.25, bidVolume: 400,  askRate: 2.35, askVolume: 400  },
  ],
  '21':  [
    { name: '建设银行', bidRate: 2.28, bidVolume: 500,  askRate: 2.38, askVolume: 500  },
    { name: '工商银行', bidRate: 2.26, bidVolume: 450,  askRate: 2.36, askVolume: 450  },
    { name: '农业银行', bidRate: 2.30, bidVolume: 400,  askRate: 2.40, askVolume: 400  },
    { name: '中国银行', bidRate: 2.29, bidVolume: 350,  askRate: 2.39, askVolume: 350  },
  ],
  '28+': [
    { name: '建设银行', bidRate: 2.32, bidVolume: 400,  askRate: 2.42, askVolume: 400  },
    { name: '工商银行', bidRate: 2.30, bidVolume: 350,  askRate: 2.40, askVolume: 350  },
    { name: '农业银行', bidRate: 2.33, bidVolume: 300,  askRate: 2.43, askVolume: 300  },
    { name: '中国银行', bidRate: 2.35, bidVolume: 280,  askRate: 2.45, askVolume: 280  },
  ],
};

interface CenterPanelProps {
  onSendToTrade: (quote: Quote) => void;
}

export function CenterPanel({ onSendToTrade }: CenterPanelProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [flashingIds, setFlashingIds] = useState<Set<string>>(new Set());
  const [selectedQuoteForDetail, setSelectedQuoteForDetail] = useState<Quote | null>(null);
  const [nonBankSearch, setNonBankSearch] = useState<string>('');

  // 初始化数据
  useEffect(() => {
    const traderNames = ['张伟', '李明', '王芳', '刘强', '陈静', '杨勇', '赵磊', '孙娜'];
    const desks = ['资金交易部', '金融市场部', '同业业务部', '资产负债部'];
    
    const generateTrader = () => ({
      name: traderNames[Math.floor(Math.random() * traderNames.length)],
      institution: '',
      desk: desks[Math.floor(Math.random() * desks.length)],
      phone: `010-${Math.floor(Math.random() * 90000000 + 10000000)}`,
      quoteTime: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
    });

    const initialQuotes: Quote[] = [
      // XRepo 大行匿名报价
      {
        id: 'xr1',
        type: 'xrepo',
        period: '1',
        bidRate: 1.95,
        bidVolume: 500,
        askRate: 2.00,
        askVolume: 500,
        lastPrice: 1.98,
        volume: 500,
        source: 'IDeal',
        trader: { ...generateTrader(), institution: '工商银行' }
      },
      {
        id: 'xr2',
        type: 'xrepo',
        period: '7',
        bidRate: 2.13,
        bidVolume: 1200,
        askRate: 2.18,
        askVolume: 1200,
        lastPrice: 2.15,
        volume: 1200,
        source: 'IDeal',
        trader: { ...generateTrader(), institution: '建设银行' }
      },
      {
        id: 'xr3',
        type: 'xrepo',
        period: '14',
        bidRate: 2.25,
        bidVolume: 800,
        askRate: 2.30,
        askVolume: 800,
        lastPrice: 2.28,
        volume: 800,
        source: 'IDeal',
        trader: { ...generateTrader(), institution: '中国银行' }
      },
      {
        id: 'xr3-2',
        type: 'xrepo',
        period: '21',
        bidRate: 2.28,
        bidVolume: 700,
        askRate: 2.33,
        askVolume: 700,
        lastPrice: 2.30,
        volume: 700,
        source: 'IDeal',
        trader: { ...generateTrader(), institution: '交通银行' }
      },
      {
        id: 'xr4',
        type: 'xrepo',
        period: '28+',
        bidRate: 2.35,
        bidVolume: 600,
        askRate: 2.40,
        askVolume: 600,
        lastPrice: 2.38,
        volume: 600,
        source: 'IDeal',
        trader: { ...generateTrader(), institution: '农业银行' }
      },

      // QTrade 指定机构报价
      {
        id: 'qt1',
        type: 'qtrade',
        period: '1',
        bidRate: 1.92,
        bidVolume: 300,
        askRate: 2.02,
        askVolume: 300,
        lastPrice: 1.97,
        volume: 300,
        institution: '工商银行',
        direction: 'lend',
        source: 'QTrade',
        trader: { ...generateTrader(), institution: '工商银行' }
      },
      {
        id: 'qt2',
        type: 'qtrade',
        period: '7',
        bidRate: 2.10,
        bidVolume: 600,
        askRate: 2.20,
        askVolume: 600,
        lastPrice: 2.15,
        volume: 600,
        institution: '建设银行',
        direction: 'lend',
        source: 'QTrade',
        trader: { ...generateTrader(), institution: '建设银行' }
      },
      {
        id: 'qt3',
        type: 'qtrade',
        period: '14',
        bidRate: 2.22,
        bidVolume: 400,
        askRate: 2.32,
        askVolume: 400,
        lastPrice: 2.27,
        volume: 400,
        institution: '农业银行',
        direction: 'borrow',
        source: 'QTrade',
        trader: { ...generateTrader(), institution: '农业银行' }
      },
      {
        id: 'qt3-2',
        type: 'qtrade',
        period: '21',
        bidRate: 2.28,
        bidVolume: 450,
        askRate: 2.38,
        askVolume: 450,
        lastPrice: 2.33,
        volume: 450,
        institution: '中国银行',
        direction: 'borrow',
        source: 'QTrade',
        trader: { ...generateTrader(), institution: '中国银行' }
      },
      {
        id: 'qt4',
        type: 'qtrade',
        period: '28+',
        bidRate: 2.32,
        bidVolume: 350,
        askRate: 2.42,
        askVolume: 350,
        lastPrice: 2.37,
        volume: 350,
        institution: '招商银行',
        direction: 'lend',
        source: 'QTrade',
        trader: { ...generateTrader(), institution: '招商银行' }
      },

      // 非银最优报价
      {
        id: 'qb1',
        type: 'qtrade-best',
        period: '1',
        bidRate: 1.98,
        bidVolume: 200,
        askRate: 2.05,
        askVolume: 200,
        lastPrice: 2.00,
        volume: 200,
        institution: '券商最优',
        direction: 'lend',
        source: 'QTrade',
        trader: { ...generateTrader(), institution: '中信证券' }
      },
      {
        id: 'qb2',
        type: 'qtrade-best',
        period: '7',
        bidRate: 2.15,
        bidVolume: 350,
        askRate: 2.22,
        askVolume: 350,
        lastPrice: 2.18,
        volume: 350,
        institution: '基金最优',
        direction: 'borrow',
        source: 'QTrade',
        trader: { ...generateTrader(), institution: '华夏基金' }
      },
      {
        id: 'qb2-2',
        type: 'qtrade-best',
        period: '14',
        bidRate: 2.25,
        bidVolume: 280,
        askRate: 2.32,
        askVolume: 280,
        lastPrice: 2.28,
        volume: 280,
        institution: '券商最优',
        direction: 'lend',
        source: 'QTrade',
        trader: { ...generateTrader(), institution: '海通证券' }
      },
      {
        id: 'qb3',
        type: 'qtrade-best',
        period: '21',
        bidRate: 2.38,
        bidVolume: 180,
        askRate: 2.45,
        askVolume: 180,
        lastPrice: 2.41,
        volume: 180,
        institution: '券商最优',
        direction: 'lend',
        source: 'QTrade',
        trader: { ...generateTrader(), institution: '国泰君安' }
      },
      {
        id: 'qb4',
        type: 'qtrade-best',
        period: '28+',
        bidRate: 2.58,
        bidVolume: 120,
        askRate: 2.65,
        askVolume: 120,
        lastPrice: 2.61,
        volume: 120,
        institution: '基金最优',
        direction: 'borrow',
        source: 'QTrade',
        trader: { ...generateTrader(), institution: '易方达基金' }
      },

      // 交易所回购
      {
        id: 'ex1',
        type: 'exchange',
        period: 'GC001',
        bidRate: 1.99,
        bidVolume: 15000,
        askRate: 2.01,
        askVolume: 15000,
        lastPrice: 2.00,
        volume: 15000,
        source: '上交所',
        trader: { name: '市场报价', institution: '上交所', desk: '交易所', phone: '-', quoteTime: new Date().toLocaleTimeString('zh-CN', { hour12: false }) }
      },
      {
        id: 'ex2',
        type: 'exchange',
        period: 'GC007',
        bidRate: 2.16,
        bidVolume: 8500,
        askRate: 2.18,
        askVolume: 8500,
        lastPrice: 2.17,
        volume: 8500,
        source: '上交所',
        trader: { name: '市场报价', institution: '上交所', desk: '交易所', phone: '-', quoteTime: new Date().toLocaleTimeString('zh-CN', { hour12: false }) }
      },
      {
        id: 'ex3',
        type: 'exchange',
        period: 'R-001',
        bidRate: 2.02,
        bidVolume: 12000,
        askRate: 2.04,
        askVolume: 12000,
        lastPrice: 2.03,
        volume: 12000,
        source: '上交所',
        trader: { name: '市场报价', institution: '上交所', desk: '交易所', phone: '-', quoteTime: new Date().toLocaleTimeString('zh-CN', { hour12: false }) }
      },
      {
        id: 'ex4',
        type: 'exchange',
        period: 'GC1M',
        bidRate: 2.36,
        bidVolume: 6500,
        askRate: 2.38,
        askVolume: 6500,
        lastPrice: 2.37,
        volume: 6500,
        source: '上交所',
        trader: { name: '市场报价', institution: '上交所', desk: '交易所', phone: '-', quoteTime: new Date().toLocaleTimeString('zh-CN', { hour12: false }) }
      },
      {
        id: 'ex5',
        type: 'exchange',
        period: 'GC6M',
        bidRate: 2.56,
        bidVolume: 4200,
        askRate: 2.58,
        askVolume: 4200,
        lastPrice: 2.57,
        volume: 4200,
        source: '上交所',
        trader: { name: '市场报价', institution: '上交所', desk: '交易所', phone: '-', quoteTime: new Date().toLocaleTimeString('zh-CN', { hour12: false }) }
      },
      {
        id: 'ex6',
        type: 'exchange',
        period: 'GC1Y',
        bidRate: 2.76,
        bidVolume: 3200,
        askRate: 2.78,
        askVolume: 3200,
        lastPrice: 2.77,
        volume: 3200,
        source: '上交所',
        trader: { name: '市场报价', institution: '上交所', desk: '交易所', phone: '-', quoteTime: new Date().toLocaleTimeString('zh-CN', { hour12: false }) }
      },
    ];
    setQuotes(initialQuotes);
  }, []);

  // 模拟实时数据更新
  useEffect(() => {
    const interval = setInterval(() => {
      setQuotes((prevQuotes) => {
        const newQuotes = prevQuotes.map((quote) => {
          // 随机更新部分报价
          if (Math.random() > 0.7) {
            const rateChange = (Math.random() - 0.5) * 0.1;
            const volumeChange = Math.floor((Math.random() - 0.5) * 200);
            const newQuote = {
              ...quote,
              bidRate: Math.max(0.5, quote.bidRate + rateChange),
              bidVolume: Math.max(50, quote.bidVolume + volumeChange),
              askRate: Math.max(0.6, quote.askRate + rateChange),
              askVolume: Math.max(50, quote.askVolume + volumeChange),
              lastPrice: Math.max(0.55, quote.lastPrice + rateChange),
            };

            // 触发闪烁效果
            setFlashingIds((prev) => new Set(prev).add(quote.id));
            setTimeout(() => {
              setFlashingIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(quote.id);
                return newSet;
              });
            }, 500);

            return newQuote;
          }
          return quote;
        });
        return newQuotes;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // 期限映射：将交易所品种映射到标准期限
  const normalizePeriod = (period: string): string => {
    if (period.includes('001') || period === '1') return '1';
    if (period.includes('007') || period === '7') return '7';
    if (period.includes('014') || period === '14') return '14';
    if (period.includes('021') || period === '21') return '21';
    if (period.includes('1M') || period === '1M' || period.includes('6M') || period === '6M' || period.includes('1Y') || period === '1Y' || period.includes('28') || period === '28+') return '28+';
    return period;
  };

  const filteredQuotes = selectedPeriod === 'all'
    ? quotes
    : quotes.filter(q => normalizePeriod(q.period) === selectedPeriod);

  const periods = ['all', '1', '7', '14', '21', '28+'];

  const periodLabelMap: Record<string, string> = {
    all: '全部',
    '1': '001',
    '7': '007',
    '14': '014',
    '21': '021',
    '28+': '028+',
  };

  const getPeriodLabel = (period: string): string => periodLabelMap[period] ?? period;

  // 生成非银机构明细数据（同一期限下的多个非银机构报价）
  const getNonBankDetails = (quote: Quote | null) => {
    if (!quote) return [];

    const nonBankInstitutions = [
      { name: '中信证券', type: '券商' },
      { name: '国泰君安', type: '券商' },
      { name: '海通证券', type: '券商' },
      { name: '华夏基金', type: '基金' },
      { name: '易方达基金', type: '基金' },
      { name: '南方基金', type: '基金' },
      { name: '中国人寿', type: '保险' },
      { name: '平安保险', type: '保险' },
    ];

    // 利率相同（或极小浮动）
    return nonBankInstitutions.map((inst, index) => ({
      id: `nb-${quote.period}-${index}`,
      institution: inst.name,
      type: inst.type,
      period: quote.period,
      bidRate: quote.bidRate + (Math.random() - 0.5) * 0.01, // 利率相同，只有极小浮动±0.005%
      bidVolume: Math.floor(50 + Math.random() * 200),
      askRate: quote.askRate + (Math.random() - 0.5) * 0.01, // 利率相同，只有极小浮动±0.005%
      askVolume: Math.floor(50 + Math.random() * 200),
    }));
  };

  const nonBankDetails = selectedQuoteForDetail ? getNonBankDetails(selectedQuoteForDetail) : [];

  return (
    <div className="p-3 space-y-3 h-full overflow-y-auto flex flex-col">
      <div className="flex-shrink-0">
        {/* 期限筛选 */}
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200 mb-3">
          <span className="text-gray-600 text-xs">期限筛选：</span>
          <div className="flex gap-1 flex-wrap">
            {periods.map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  selectedPeriod === period
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {getPeriodLabel(period)}
              </button>
            ))}
          </div>
        </div>

        {/* XRepo 大行匿名报价 */}
        <QuoteSection
          title="XRepo行情"
          quotes={filteredQuotes.filter(q => q.type === 'xrepo')}
          flashingIds={flashingIds}
          onSendToTrade={onSendToTrade}
          onRowClick={setSelectedQuoteForDetail}
        />

        {/* QTrade 指定机构报价 */}
        <div className="mt-3">
          <ExpandableBankQuoteSection
            title="大行指定机构报价 (QTrade)"
            quotes={filteredQuotes.filter(q => q.type === 'qtrade')}
            flashingIds={flashingIds}
            onSendToTrade={onSendToTrade}
          />
        </div>

        {/* 非银最优报价 */}
        <div className="mt-3">
          <QuoteSection
            title="非银最优报价 (QTrade)"
            quotes={filteredQuotes.filter(q => q.type === 'qtrade-best')}
            flashingIds={flashingIds}
            onSendToTrade={onSendToTrade}
            onRowClick={setSelectedQuoteForDetail}
            highlight={true}
          />
        </div>

      </div>

      {/* 非银机构报价明细 */}
      {selectedQuoteForDetail && (
        <div className="mt-3 flex-shrink-0">
          <div className="bg-white rounded-lg border border-blue-300 shadow-sm">
            <div className="bg-gradient-to-r from-blue-100 to-blue-50 px-3 py-2 border-b border-blue-300 flex items-center justify-between gap-2">
              <h3 className="font-bold text-gray-900 text-xs shrink-0">
                非银机构报价明细 - {selectedQuoteForDetail.period}期限
              </h3>
              <input
                type="text"
                value={nonBankSearch}
                onChange={e => setNonBankSearch(e.target.value)}
                placeholder="搜索机构名称..."
                className="flex-1 max-w-[180px] px-2 py-0.5 text-xs border border-blue-300 rounded bg-white focus:outline-none focus:border-blue-500"
              />
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    // 准备CSV数据
                    const headers = ['机构名称', '类型', '逆回购量(亿)', '逆回购利率(%)', '正回购利率(%)', '正回购量(亿)'];
                    const rows = nonBankDetails.map(d => [
                      d.institution,
                      d.type,
                      d.bidVolume.toString(),
                      d.bidRate.toFixed(2),
                      d.askRate.toFixed(2),
                      d.askVolume.toString()
                    ]);

                    // 生成CSV内容
                    const csvContent = '\uFEFF' + // UTF-8 BOM for Excel
                      [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

                    // 创建下载链接
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    const url = URL.createObjectURL(blob);
                    link.setAttribute('href', url);
                    link.setAttribute('download', `非银机构报价明细_${selectedQuoteForDetail.period}_${new Date().toISOString().split('T')[0]}.csv`);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                >
                  <Download size={12} />
                  下载
                </button>
                <button
                  onClick={() => { setSelectedQuoteForDetail(null); setNonBankSearch(''); }}
                  className="text-gray-600 hover:text-gray-900 text-xs px-2 py-0.5 hover:bg-white rounded"
                >
                  关闭
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300">
                    <th className="px-3 py-2 text-left font-bold text-gray-700 border-r border-gray-200">机构名称</th>
                    <th className="px-3 py-2 text-left font-bold text-gray-700 border-r border-gray-200">类型</th>
                    <th className="px-3 py-2 text-right font-bold text-gray-700 border-r border-gray-200">逆回购量(亿)</th>
                    <th className="px-3 py-2 text-right font-bold text-gray-700 border-r border-gray-200">逆回购利率(%)</th>
                    <th className="px-3 py-2 text-right font-bold text-gray-700 border-r border-gray-200">正回购利率(%)</th>
                    <th className="px-3 py-2 text-right font-bold text-gray-700">正回购量(亿)</th>
                  </tr>
                </thead>
                <tbody>
                  {nonBankDetails.filter(d => d.institution.includes(nonBankSearch.trim())).map((detail, index) => (
                    <tr
                      key={detail.id}
                      className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-3 py-2 font-bold text-gray-900 border-r border-gray-200">{detail.institution}</td>
                      <td className="px-3 py-2 text-gray-700 border-r border-gray-200">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          detail.type === '券商' ? 'bg-blue-100 text-blue-700' :
                          detail.type === '基金' ? 'bg-purple-100 text-purple-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {detail.type}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right text-gray-800 font-mono font-medium border-r border-gray-200">
                        {detail.bidVolume}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 border-r border-gray-200">
                        {detail.bidRate.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-red-600 border-r border-gray-200">
                        {detail.askRate.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-800 font-mono font-medium">
                        {detail.askVolume}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 交易所回购 */}
      <div className="mt-3">
        <QuoteSection
          title="交易所回购行情"
          quotes={filteredQuotes.filter(q => q.type === 'exchange')}
          flashingIds={flashingIds}
          onSendToTrade={onSendToTrade}
          onRowClick={setSelectedQuoteForDetail}
        />
      </div>
    </div>
  );
}

interface QuoteSectionProps {
  title: string;
  quotes: Quote[];
  flashingIds: Set<string>;
  onSendToTrade: (quote: Quote) => void;
  onRowClick: (quote: Quote) => void;
  highlight?: boolean;
}

function QuoteSection({ title, quotes, flashingIds, onSendToTrade, onRowClick, highlight }: QuoteSectionProps) {
  const [hoveredQuote, setHoveredQuote] = useState<Quote | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  if (quotes.length === 0) return null;

  const handleDownload = () => {
    // 准备CSV数据
    const headers = ['期限', '逆回购量(亿)', '逆回购利率(%)', '正回购利率(%)', '正回购量(亿)'];
    const rows = quotes.map(q => [
      q.period,
      q.bidVolume.toString(),
      q.bidRate.toFixed(2),
      q.askRate.toFixed(2),
      q.askVolume.toString()
    ]);

    // 生成CSV内容
    const csvContent = '\uFEFF' + // UTF-8 BOM for Excel
      [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    // 创建下载链接
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMouseMove = (quote: Quote, event: React.MouseEvent) => {
    const tooltipWidth = 280;
    const tooltipHeight = 200;
    const offset = 10;
    
    let x = event.clientX + offset;
    let y = event.clientY + offset;
    
    // 防止超出右边界
    if (x + tooltipWidth > window.innerWidth) {
      x = event.clientX - tooltipWidth - offset;
    }
    
    // 防止超出底部边界
    if (y + tooltipHeight > window.innerHeight) {
      y = event.clientY - tooltipHeight - offset;
    }
    
    setTooltipPosition({ x, y });
    if (hoveredQuote?.id !== quote.id) {
      setHoveredQuote(quote);
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-300 shadow-sm ${highlight ? 'ring-2 ring-blue-500/50' : ''} relative`}>
      <div className="bg-gradient-to-r from-gray-100 to-gray-50 px-3 py-2 border-b border-gray-300 flex items-center justify-between">
        <h3 className="font-bold text-gray-900 text-xs">{title}</h3>
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
        >
          <Download size={12} />
          下载
        </button>
      </div>
      <div className="overflow-visible">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="px-3 py-2 text-left font-bold text-gray-700 border-r border-gray-200">期限</th>
              <th className="px-3 py-2 text-right font-bold text-gray-700 border-r border-gray-200">逆回购量(亿)</th>
              <th className="px-3 py-2 text-right font-bold text-gray-700 border-r border-gray-200">逆回购利率(%)</th>
              <th className="px-3 py-2 text-right font-bold text-gray-700 border-r border-gray-200">正回购利率(%)</th>
              <th className="px-3 py-2 text-right font-bold text-gray-700 border-r border-gray-200">正回购量(亿)</th>
              <th className="px-3 py-2 text-center font-bold text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((quote, index) => {
              const isFlashing = flashingIds.has(quote.id);

              return (
                <tr
                  key={quote.id}
                  className={`border-b border-gray-200 hover:bg-blue-50 transition-colors cursor-pointer ${
                    isFlashing ? 'bg-blue-100' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                  onClick={() => onRowClick(quote)}
                  onMouseMove={(e) => handleMouseMove(quote, e)}
                  onMouseLeave={() => setHoveredQuote(null)}
                >
                  <td className="px-3 py-2 font-bold text-gray-900 border-r border-gray-200">{quote.period}</td>
                  <td className="px-3 py-2 text-right text-gray-800 font-mono font-medium border-r border-gray-200">
                    {quote.bidVolume.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 border-r border-gray-200">
                    {quote.bidRate.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-red-600 border-r border-gray-200">
                    {quote.askRate.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-800 font-mono font-medium border-r border-gray-200">
                    {quote.askVolume.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSendToTrade(quote);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded font-medium transition-colors shadow-sm"
                    >
                      <Send size={10} />
                      发送
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* 悬浮窗 - 报价人信息 - 跟随鼠标显示 */}
      {hoveredQuote && hoveredQuote.trader && (
        <div 
          className="fixed z-[9999] pointer-events-none"
          style={{ 
            left: `${tooltipPosition.x}px`, 
            top: `${tooltipPosition.y}px` 
          }}
        >
          <div className="bg-white border-2 border-blue-500 rounded-lg shadow-xl p-3 w-[280px]">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
              <User size={14} className="text-blue-600" />
              <span className="font-semibold text-gray-900 text-xs">报价人信息</span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-gray-600 w-16">姓名：</span>
                <span className="text-gray-900 font-semibold">{hoveredQuote.trader.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 w-16">机构：</span>
                <span className="text-gray-900">{hoveredQuote.trader.institution}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 w-16">部门：</span>
                <span className="text-gray-900">{hoveredQuote.trader.desk}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={10} className="text-gray-600" />
                <span className="text-gray-600 w-14">电话：</span>
                <span className="text-gray-900 font-mono">{hoveredQuote.trader.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={10} className="text-gray-600" />
                <span className="text-gray-600 w-14">时间：</span>
                <span className="text-gray-900 font-mono">{hoveredQuote.trader.quoteTime}</span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
              <span>期限 {hoveredQuote.period} | </span>
              <span className="text-emerald-600 font-semibold">买{hoveredQuote.bidRate.toFixed(2)}%</span>
              <span> / </span>
              <span className="text-red-600 font-semibold">卖{hoveredQuote.askRate.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ExpandableBankQuoteSectionProps {
  title: string;
  quotes: Quote[];
  flashingIds: Set<string>;
  onSendToTrade: (quote: Quote) => void;
}

function ExpandableBankQuoteSection({ title, quotes, flashingIds, onSendToTrade }: ExpandableBankQuoteSectionProps) {
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set());

  if (quotes.length === 0) return null;

  const togglePeriod = (period: string) => {
    setExpandedPeriods(prev => {
      const next = new Set(prev);
      if (next.has(period)) next.delete(period);
      else next.add(period);
      return next;
    });
  };

  const handleDownload = () => {
    const headers = ['期限', '机构', '逆回购量(亿)', '逆回购利率(%)', '正回购利率(%)', '正回购量(亿)'];
    const rows: string[][] = [];
    quotes.forEach(q => {
      rows.push([q.period, '最优', q.bidVolume.toString(), q.bidRate.toFixed(2), q.askRate.toFixed(2), q.askVolume.toString()]);
      (bankDetailsByPeriod[q.period] ?? []).forEach(b => {
        rows.push([q.period, b.name, b.bidVolume.toString(), b.bidRate.toFixed(2), b.askRate.toFixed(2), b.askVolume.toString()]);
      });
    });
    const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `大行指定机构报价_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-300 shadow-sm">
      <div className="bg-gradient-to-r from-gray-100 to-gray-50 px-3 py-2 border-b border-gray-300 flex items-center justify-between">
        <h3 className="font-bold text-gray-900 text-xs">{title}</h3>
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
        >
          <Download size={12} />
          下载
        </button>
      </div>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-100 border-b border-gray-300">
            <th className="px-2 py-2 text-left font-bold text-gray-700 border-r border-gray-200 w-6"></th>
            <th className="px-3 py-2 text-left font-bold text-gray-700 border-r border-gray-200">期限</th>
            <th className="px-3 py-2 text-right font-bold text-gray-700 border-r border-gray-200">逆回购量(亿)</th>
            <th className="px-3 py-2 text-right font-bold text-gray-700 border-r border-gray-200">逆回购利率(%)</th>
            <th className="px-3 py-2 text-right font-bold text-gray-700 border-r border-gray-200">正回购利率(%)</th>
            <th className="px-3 py-2 text-right font-bold text-gray-700 border-r border-gray-200">正回购量(亿)</th>
            <th className="px-3 py-2 text-center font-bold text-gray-700">操作</th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((quote, index) => {
            const isExpanded = expandedPeriods.has(quote.period);
            const isFlashing = flashingIds.has(quote.id);
            const bankRows = bankDetailsByPeriod[quote.period] ?? [];
            return (
              <>
                <tr
                  key={quote.id}
                  className={`border-b border-gray-200 hover:bg-blue-50 transition-colors cursor-pointer ${
                    isFlashing ? 'bg-blue-100' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                  onClick={() => togglePeriod(quote.period)}
                >
                  <td className="px-2 py-2 text-center border-r border-gray-200">
                    {isExpanded
                      ? <ChevronDown size={12} className="text-blue-600 mx-auto" />
                      : <ChevronRight size={12} className="text-gray-400 mx-auto" />
                    }
                  </td>
                  <td className="px-3 py-2 font-bold text-gray-900 border-r border-gray-200">{quote.period}</td>
                  <td className="px-3 py-2 text-right text-gray-800 font-mono font-medium border-r border-gray-200">
                    {quote.bidVolume.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 border-r border-gray-200">
                    {quote.bidRate.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-red-600 border-r border-gray-200">
                    {quote.askRate.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-800 font-mono font-medium border-r border-gray-200">
                    {quote.askVolume.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); onSendToTrade(quote); }}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded font-medium transition-colors shadow-sm"
                    >
                      <Send size={10} />
                      发送
                    </button>
                  </td>
                </tr>
                {isExpanded && bankRows.map((bank) => (
                  <tr key={`${quote.period}-${bank.name}`} className="border-b border-gray-100 bg-blue-50/40 hover:bg-blue-50">
                    <td className="border-r border-gray-200"></td>
                    <td className="px-3 py-1.5 border-r border-gray-200">
                      <span className="pl-4 text-gray-700 font-medium">{bank.name}</span>
                    </td>
                    <td className="px-3 py-1.5 text-right text-gray-700 font-mono border-r border-gray-200">
                      {bank.bidVolume.toLocaleString()}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono text-emerald-600 border-r border-gray-200">
                      {bank.bidRate.toFixed(2)}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono text-red-600 border-r border-gray-200">
                      {bank.askRate.toFixed(2)}
                    </td>
                    <td className="px-3 py-1.5 text-right text-gray-700 font-mono border-r border-gray-200">
                      {bank.askVolume.toLocaleString()}
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <button
                        onClick={() => onSendToTrade({ ...quote, id: `${quote.id}-${bank.name}`, trader: { ...quote.trader, institution: bank.name } })}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-400 hover:bg-gray-500 text-white text-xs rounded transition-colors"
                      >
                        <Send size={9} />
                        发送
                      </button>
                    </td>
                  </tr>
                ))}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}