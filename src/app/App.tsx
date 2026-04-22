import { WorkstationProvider } from './context/WorkstationContext';
import { TopBar } from './components/layout/TopBar';
import { PeriodFilter } from './components/layout/PeriodFilter';
import { MainMarketTable } from './components/area1-main/MainMarketTable';
import { InstitutionCompareTable } from './components/area2-institutions/InstitutionCompareTable';
import { BottomDetailTabs } from './components/area3-bottom/BottomDetailTabs';
import { BigChartArea } from './components/area4-bigchart/BigChartArea';
import { SentimentCard } from './components/area5-sentiment/SentimentCard';

function App() {
  return (
    <WorkstationProvider>
      <div className="h-screen w-screen flex flex-col bg-[#0f1e31] text-[#e4ecf5] overflow-hidden">
        {/* 顶部固定区 */}
        <TopBar />
        <PeriodFilter />

        {/* 主体：左 60% / 右 40% */}
        <div className="flex-1 flex gap-1 p-1 overflow-hidden min-h-0">

          {/* 左列：① ② ③ 三段 */}
          <div className="w-3/5 flex flex-col gap-1 min-h-0">
            <div className="flex-[30] min-h-0"><MainMarketTable /></div>
            <div className="flex-[28] min-h-0"><InstitutionCompareTable /></div>
            <div className="flex-[42] min-h-0"><BottomDetailTabs /></div>
          </div>

          {/* 右列：④ ⑤ 两段 */}
          <div className="w-2/5 flex flex-col gap-1 min-h-0">
            <div className="flex-[65] min-h-0"><BigChartArea /></div>
            <div className="flex-[35] min-h-0"><SentimentCard /></div>
          </div>

        </div>
      </div>
    </WorkstationProvider>
  );
}

export default App;
