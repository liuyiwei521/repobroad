import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface PeriodData {
  time: string;
  '1': number;
  '7': number;
  '14': number;
  '21': number;
  '28+': number;
}

export function RightPanel() {
  const [xrepoData, setXrepoData] = useState<PeriodData[]>([]);
  const [qtradeData, setQtradeData] = useState<PeriodData[]>([]);
  const [qtradeBestData, setQtradeBestData] = useState<PeriodData[]>([]);
  const [exchangeData, setExchangeData] = useState<PeriodData[]>([]);

  // 初始化历史数据
  useEffect(() => {
    const now = new Date();
    const xrepo: PeriodData[] = [];
    const qtrade: PeriodData[] = [];
    const qtradeBest: PeriodData[] = [];
    const exchange: PeriodData[] = [];

    // 生成过去20个时间点的数据（每5分钟一个点）
    for (let i = 19; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 5 * 60 * 1000);
      const timeStr = time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });

      // 大行匿名报价
      xrepo.push({
        time: timeStr,
        '1': 1.95 + Math.random() * 0.08 - i * 0.001,
        '7': 2.13 + Math.random() * 0.08 - i * 0.001,
        '14': 2.25 + Math.random() * 0.08 - i * 0.0008,
        '21': 2.35 + Math.random() * 0.08 - i * 0.0007,
        '28+': 2.55 + Math.random() * 0.08 - i * 0.0006,
      });

      // 指定机构报价
      qtrade.push({
        time: timeStr,
        '1': 1.92 + Math.random() * 0.10 - i * 0.0012,
        '7': 2.10 + Math.random() * 0.10 - i * 0.0011,
        '14': 2.22 + Math.random() * 0.10 - i * 0.001,
        '21': 2.32 + Math.random() * 0.10 - i * 0.0009,
        '28+': 2.52 + Math.random() * 0.10 - i * 0.0008,
      });

      // 非银最优报价
      qtradeBest.push({
        time: timeStr,
        '1': 1.98 + Math.random() * 0.09 - i * 0.0011,
        '7': 2.15 + Math.random() * 0.09 - i * 0.001,
        '14': 2.28 + Math.random() * 0.09 - i * 0.0009,
        '21': 2.38 + Math.random() * 0.09 - i * 0.0008,
        '28+': 2.58 + Math.random() * 0.09 - i * 0.0007,
      });

      // 交易所回购
      exchange.push({
        time: timeStr,
        '1': 1.99 + Math.random() * 0.07 - i * 0.001,
        '7': 2.16 + Math.random() * 0.07 - i * 0.0009,
        '14': 2.02 + Math.random() * 0.07 - i * 0.0008,
        '21': 2.36 + Math.random() * 0.07 - i * 0.0007,
        '28+': 2.56 + Math.random() * 0.07 - i * 0.0006,
      });
    }

    setXrepoData(xrepo);
    setQtradeData(qtrade);
    setQtradeBestData(qtradeBest);
    setExchangeData(exchange);
  }, []);

  // 模拟实时数据更新
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });

      // 更新大行匿名报价
      setXrepoData((prevData) => {
        const newData = [...prevData.slice(1)];
        const lastData = prevData[prevData.length - 1];
        newData.push({
          time: timeStr,
          '1': Math.max(1.5, Math.min(2.5, lastData['1'] + (Math.random() - 0.5) * 0.04)),
          '7': Math.max(1.8, Math.min(2.6, lastData['7'] + (Math.random() - 0.5) * 0.04)),
          '14': Math.max(2.0, Math.min(2.8, lastData['14'] + (Math.random() - 0.5) * 0.04)),
          '21': Math.max(2.1, Math.min(2.9, lastData['21'] + (Math.random() - 0.5) * 0.04)),
          '28+': Math.max(2.3, Math.min(3.0, lastData['28+'] + (Math.random() - 0.5) * 0.04)),
        });
        return newData;
      });

      // 更新指定机构报价
      setQtradeData((prevData) => {
        const newData = [...prevData.slice(1)];
        const lastData = prevData[prevData.length - 1];
        newData.push({
          time: timeStr,
          '1': Math.max(1.5, Math.min(2.5, lastData['1'] + (Math.random() - 0.5) * 0.05)),
          '7': Math.max(1.8, Math.min(2.6, lastData['7'] + (Math.random() - 0.5) * 0.05)),
          '14': Math.max(2.0, Math.min(2.8, lastData['14'] + (Math.random() - 0.5) * 0.05)),
          '21': Math.max(2.1, Math.min(2.9, lastData['21'] + (Math.random() - 0.5) * 0.05)),
          '28+': Math.max(2.3, Math.min(3.0, lastData['28+'] + (Math.random() - 0.5) * 0.05)),
        });
        return newData;
      });

      // 更新非银最优报价
      setQtradeBestData((prevData) => {
        const newData = [...prevData.slice(1)];
        const lastData = prevData[prevData.length - 1];
        newData.push({
          time: timeStr,
          '1': Math.max(1.6, Math.min(2.6, lastData['1'] + (Math.random() - 0.5) * 0.04)),
          '7': Math.max(1.9, Math.min(2.7, lastData['7'] + (Math.random() - 0.5) * 0.04)),
          '14': Math.max(2.1, Math.min(2.9, lastData['14'] + (Math.random() - 0.5) * 0.04)),
          '21': Math.max(2.2, Math.min(3.0, lastData['21'] + (Math.random() - 0.5) * 0.04)),
          '28+': Math.max(2.4, Math.min(3.1, lastData['28+'] + (Math.random() - 0.5) * 0.04)),
        });
        return newData;
      });

      // 更新交易所回购
      setExchangeData((prevData) => {
        const newData = [...prevData.slice(1)];
        const lastData = prevData[prevData.length - 1];
        newData.push({
          time: timeStr,
          '1': Math.max(1.6, Math.min(2.5, lastData['1'] + (Math.random() - 0.5) * 0.03)),
          '7': Math.max(1.9, Math.min(2.6, lastData['7'] + (Math.random() - 0.5) * 0.03)),
          '14': Math.max(1.8, Math.min(2.5, lastData['14'] + (Math.random() - 0.5) * 0.03)),
          '21': Math.max(2.1, Math.min(2.8, lastData['21'] + (Math.random() - 0.5) * 0.03)),
          '28+': Math.max(2.3, Math.min(2.9, lastData['28+'] + (Math.random() - 0.5) * 0.03)),
        });
        return newData;
      });
    }, 5000); // 每5秒更新一次

    return () => clearInterval(interval);
  }, []);

  const periodColors = {
    '1': '#10b981',
    '7': '#3b82f6',
    '14': '#8b5cf6',
    '21': '#f59e0b',
    '28+': '#ef4444',
  };

  return (
    <div className="p-2 space-y-2 text-xs h-full overflow-y-auto">
      {/* XRepo行情趋势图 */}
      <TrendChart
        title="XRepo行情"
        data={xrepoData}
        periodColors={periodColors}
      />

      {/* 指定机构报价趋势图 */}
      <TrendChart
        title="指定机构报价 (QTrade)"
        data={qtradeData}
        periodColors={periodColors}
      />

      {/* 非银最优报价趋势图 */}
      <TrendChart
        title="非银最优报价"
        data={qtradeBestData}
        periodColors={periodColors}
      />

      {/* 交易所回购趋势图 */}
      <TrendChart
        title="交易所回购"
        data={exchangeData}
        periodColors={periodColors}
      />
    </div>
  );
}

interface TrendChartProps {
  title: string;
  data: PeriodData[];
  periodColors: Record<string, string>;
}

function TrendChart({ title, data, periodColors }: TrendChartProps) {
  const periods = ['1', '7', '14', '21', '28+'];

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* 标题 */}
      <div className="bg-gray-50 px-2 py-1.5 border-b border-gray-200 flex items-center gap-1.5">
        <TrendingUp size={12} className="text-blue-600" />
        <h3 className="font-semibold text-gray-900 text-xs">{title}</h3>
      </div>

      {/* 图表区域 */}
      <div className="p-2" style={{ height: '180px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 9, fill: '#6b7280' }}
              stroke="#9ca3af"
              interval="preserveEnd"
              tickCount={4}
            />
            <YAxis
              tick={{ fontSize: 9, fill: '#6b7280' }}
              stroke="#9ca3af"
              domain={['auto', 'auto']}
              tickFormatter={(value) => `${value.toFixed(1)}%`}
              width={35}
            />
            <Tooltip
              contentStyle={{
                fontSize: 10,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: 4,
                padding: 6,
              }}
              formatter={(value: number) => `${value.toFixed(2)}%`}
            />
            {periods.map((period) => (
              <Line
                key={period}
                type="monotone"
                dataKey={period}
                name={period}
                stroke={periodColors[period]}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 图例 */}
      <div className="px-2 pb-2 flex flex-wrap gap-x-3 gap-y-1">
        {periods.map((period) => {
          const latestValue = data[data.length - 1]?.[period as keyof PeriodData];
          return (
            <div key={period} className="flex items-center gap-1">
              <div
                className="w-3 h-0.5"
                style={{ backgroundColor: periodColors[period] }}
              />
              <span className="text-gray-700" style={{ fontSize: '10px' }}>
                {period}
              </span>
              {latestValue && (
                <span
                  className="font-mono font-semibold"
                  style={{ fontSize: '10px', color: periodColors[period] }}
                >
                  {(latestValue as number).toFixed(2)}%
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
