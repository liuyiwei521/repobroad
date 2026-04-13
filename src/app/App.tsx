import { useState, useEffect } from 'react';
import { LeftPanel } from './components/LeftPanel';
import { CenterPanel } from './components/CenterPanel';
import { RightPanel } from './components/RightPanel';
import { MarketChartPage } from './components/MarketChartPage';

export interface Quote {
  id: string;
  type: 'xrepo' | 'qtrade' | 'qtrade-best' | 'exchange';
  period: string;
  bidRate: number;
  bidVolume: number;
  askRate: number;
  askVolume: number;
  lastPrice: number;
  volume: number;
  institution?: string;
  direction?: 'lend' | 'borrow';
  source?: string;
  trader?: {
    name: string;
    institution: string;
    desk: string;
    phone: string;
    quoteTime: string;
  };
}

function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showChart, setShowChart] = useState(false);

  // 更新系统时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 模拟数据更新
  useEffect(() => {
    const timer = setInterval(() => {
      setLastUpdate(new Date());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // 处理报价发送（保留接口但不做处理，因为已改为趋势图）
  const handleSendToTrade = (quote: Quote) => {
    console.log('报价信息:', quote);
  };

  return (
    <>
    <div className="h-screen w-screen flex flex-col bg-white text-gray-900 overflow-hidden">
      {/* 顶部状态栏 */}
      <div className="h-10 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-6">
          <h1 className="text-base font-semibold text-gray-900">资金实时行情看板</h1>
          <div className="flex items-center gap-1">
            <span className="text-gray-600 text-xs">系统时间：</span>
            <span className="text-gray-900 text-xs font-mono">
              {currentTime.toLocaleString('zh-CN', { 
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              })}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-600 text-xs">数据更新：</span>
            <span className="text-emerald-600 text-xs font-mono">
              {lastUpdate.toLocaleTimeString('zh-CN', { hour12: false })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-600 text-xs">DR007：</span>
            <span className="text-red-600 font-semibold text-sm">2.15%</span>
            <span className="text-red-600 text-xs">↑0.05</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 text-xs">资金面：</span>
            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded border border-yellow-300">平衡</span>
          </div>
          <button
            onClick={() => setShowChart(true)}
            className="px-3 py-1 bg-gray-900 hover:bg-gray-800 text-white text-xs rounded border border-gray-600 transition-colors"
          >
            行情图表
          </button>
        </div>
      </div>

      {/* 三栏主体 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧栏：参考数据 22% */}
        <div className="w-[22%] bg-gray-50 border-r border-gray-200 overflow-hidden">
          <LeftPanel />
        </div>

        {/* 中间栏：实时行情 48% */}
        <div className="w-[48%] bg-white overflow-hidden">
          <CenterPanel onSendToTrade={handleSendToTrade} />
        </div>

        {/* 右侧栏：利率趋势图 30% */}
        <div className="w-[30%] bg-gray-50 border-l border-gray-200 overflow-hidden">
          <RightPanel />
        </div>
      </div>
    </div>

    {showChart && <MarketChartPage onClose={() => setShowChart(false)} />}
    </>
  );
}

export default App;