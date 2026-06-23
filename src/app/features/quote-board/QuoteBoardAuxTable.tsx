import { StructuredTable } from "../../components/ui/StructuredTable";
import { ncdAllPeriodsData, ncdColHeaders, ncdPrimaryPeriods } from "../ncd/ncd.data";
import type { NcdAllPeriodCell, NcdAllPeriodGroup, NcdPeriod } from "../ncd/ncd.types";
import { xrepoSummarySection } from "../xrepo/xrepo.data";

export type QuoteBoardAuxTab = "xrepo" | "ncd" | "exchange";

type ExchangeRepoSnapshotRow = {
  index: string;
  code: string;
  name: string;
  changePct: string;
  lastPrice: string;
  high: string;
  low: string;
  turnover: string;
  incomePer100k: string;
  feePer100k: string;
  availableDate: string;
  withdrawDate: string;
};

const exchangeSnapshotRows: readonly ExchangeRepoSnapshotRow[] = [
  { index: "1", code: "204001", name: "GC001", changePct: "-4.92", lastPrice: "1.45", high: "1.60", low: "1.31", turnover: "2067.87亿", incomePer100k: "3.97", feePer100k: "1.00", availableDate: "20260624", withdrawDate: "20260625" },
  { index: "2", code: "204002", name: "GC002", changePct: "-0.66", lastPrice: "1.51", high: "2.00", low: "1.30", turnover: "254.61亿", incomePer100k: "8.27", feePer100k: "2.00", availableDate: "20260625", withdrawDate: "20260626" },
  { index: "3", code: "204003", name: "GC003", changePct: "0.00", lastPrice: "1.52", high: "1.60", low: "1.41", turnover: "316.13亿", incomePer100k: "20.89", feePer100k: "3.00", availableDate: "20260626", withdrawDate: "20260629" },
  { index: "4", code: "204004", name: "GC004", changePct: "1.32", lastPrice: "1.54", high: "1.57", low: "1.46", turnover: "150.66亿", incomePer100k: "25.32", feePer100k: "4.00", availableDate: "20260629", withdrawDate: "20260630" },
  { index: "5", code: "204007", name: "GC007", changePct: "4.61", lastPrice: "1.59", high: "1.62", low: "1.51", turnover: "1440.56亿", incomePer100k: "30.49", feePer100k: "5.00", availableDate: "20260630", withdrawDate: "20260701" },
  { index: "6", code: "204014", name: "GC014", changePct: "-0.33", lastPrice: "1.53", high: "1.55", low: "1.49", turnover: "318.15亿", incomePer100k: "58.68", feePer100k: "10.00", availableDate: "20260707", withdrawDate: "20260708" },
  { index: "7", code: "204028", name: "GC028", changePct: "0.00", lastPrice: "1.50", high: "1.50", low: "1.41", turnover: "56.22亿", incomePer100k: "114.68", feePer100k: "20.00", availableDate: "20260721", withdrawDate: "20260722" },
  { index: "8", code: "204091", name: "GC091", changePct: "-0.35", lastPrice: "1.42", high: "1.50", low: "1.41", turnover: "3.72亿", incomePer100k: "355.27", feePer100k: "30.00", availableDate: "20260922", withdrawDate: "20260923" },
  { index: "9", code: "204182", name: "GC182", changePct: "0.00", lastPrice: "1.42", high: "1.42", low: "1.40", turnover: "1.65亿", incomePer100k: "708.05", feePer100k: "30.00", availableDate: "20261222", withdrawDate: "20261223" },
  { index: "10", code: "131810", name: "R-001", changePct: "-5.32", lastPrice: "1.42", high: "1.60", low: "1.30", turnover: "2783.39亿", incomePer100k: "3.90", feePer100k: "1.00", availableDate: "20260624", withdrawDate: "20260625" },
  { index: "11", code: "131811", name: "R-002", changePct: "-1.66", lastPrice: "1.49", high: "1.70", low: "1.01", turnover: "23.13亿", incomePer100k: "8.14", feePer100k: "2.00", availableDate: "20260625", withdrawDate: "20260626" },
  { index: "12", code: "131800", name: "R-003", changePct: "0.00", lastPrice: "1.51", high: "1.55", low: "1.43", turnover: "18.63亿", incomePer100k: "20.75", feePer100k: "3.00", availableDate: "20260626", withdrawDate: "20260629" },
  { index: "13", code: "131809", name: "R-004", changePct: "1.00", lastPrice: "1.51", high: "1.57", low: "1.43", turnover: "7.88亿", incomePer100k: "24.90", feePer100k: "4.00", availableDate: "20260629", withdrawDate: "20260630" },
  { index: "14", code: "131801", name: "R-007", changePct: "3.62", lastPrice: "1.58", high: "1.62", low: "1.50", turnover: "116.85亿", incomePer100k: "30.21", feePer100k: "5.00", availableDate: "20260630", withdrawDate: "20260701" },
  { index: "15", code: "131802", name: "R-014", changePct: "0.99", lastPrice: "1.53", high: "1.57", low: "1.46", turnover: "35.23亿", incomePer100k: "58.88", feePer100k: "10.00", availableDate: "20260707", withdrawDate: "20260708" },
  { index: "16", code: "131803", name: "R-028", changePct: "-1.33", lastPrice: "1.48", high: "1.50", low: "1.40", turnover: "3.46亿", incomePer100k: "113.53", feePer100k: "20.00", availableDate: "20260721", withdrawDate: "20260722" },
  { index: "17", code: "131805", name: "R-091", changePct: "0.35", lastPrice: "1.42", high: "1.42", low: "1.38", turnover: "5318.40万", incomePer100k: "355.27", feePer100k: "30.00", availableDate: "20260922", withdrawDate: "20260923" },
  { index: "18", code: "131806", name: "R-182", changePct: "0.00", lastPrice: "1.41", high: "1.42", low: "1.36", turnover: "7044.60万", incomePer100k: "705.56", feePer100k: "30.00", availableDate: "20261222", withdrawDate: "20261223" },
];

const auxHeaderMeta: Record<QuoteBoardAuxTab, { title: string; subtitle: string }> = {
  xrepo: {
    title: "XREPO",
    subtitle: "匿名回购模拟数据",
  },
  ncd: {
    title: "NCD",
    subtitle: "同业存单模拟报价",
  },
  exchange: {
    title: "交易所",
    subtitle: "交易所回购模拟报价（上交所 + 深交所）",
  },
};

export function QuoteBoardAuxTable({ tab }: { tab: QuoteBoardAuxTab }) {
  const meta = auxHeaderMeta[tab];
  const showHeader = tab !== "ncd";

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      {showHeader ? (
        <div className="border-b border-[color:var(--tk-color-border-divider-dark)] bg-[#fafafa] px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-semibold tracking-[0.02em] text-slate-700">{meta.title}</span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">模拟数据</span>
          </div>
          <div className="mt-1 text-[12px] text-slate-400">{meta.subtitle}</div>
        </div>
      ) : null}
      <div className="min-h-0 flex-1 overflow-hidden">
        {tab === "xrepo" ? <XrepoAuxTable /> : null}
        {tab === "ncd" ? <NcdAuxTable /> : null}
        {tab === "exchange" ? <ExchangeAuxTable /> : null}
      </div>
    </section>
  );
}

function XrepoAuxTable() {
  return (
    <div className="h-full min-h-0 overflow-hidden p-3">
      <StructuredTable
        columns={xrepoSummarySection.columns}
        rows={xrepoSummarySection.rows}
        greenColumns={xrepoSummarySection.greenColumns}
        redColumns={xrepoSummarySection.redColumns}
        emphasisColumns={xrepoSummarySection.emphasisColumns}
        fitToWidth
        columnWidths={xrepoSummarySection.columnWidths}
        scrollY
      />
    </div>
  );
}

function ExchangeAuxTable() {
  return (
    <div className="h-full min-h-0 overflow-auto bg-white">
      <table className="w-max min-w-full border-collapse whitespace-nowrap text-[13px]">
        <thead className="sticky top-0 z-10 bg-[#fafafa]">
          <tr>
            {["", "代码", "名称", "涨幅%", "现价", "最高", "最低", "成交额", "每10万收益", "每十万元手续费", "资金可用日", "资金可取日"].map((label, index) => (
              <th
                key={`${label}-${index}`}
                className={`border-b border-[color:var(--tk-color-border-divider)] px-3 py-2 text-[13px] font-medium text-slate-500 ${
                  index <= 2 ? "text-left" : "text-right"
                }`}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {exchangeSnapshotRows.map((row) => {
            const trendTone = exchangeTrendTone(row.changePct);
            return (
              <tr key={row.code} className="hover:bg-[rgba(221,87,79,0.05)]">
                <td className="border-b border-[color:var(--tk-color-border-divider)] px-3 py-1.5 text-left text-[13px] text-slate-500">
                  {row.index}
                </td>
                <td className="border-b border-[color:var(--tk-color-border-divider)] px-3 py-1.5 text-left text-[13px] font-medium text-slate-700">
                  {row.code}
                </td>
                <td className="border-b border-[color:var(--tk-color-border-divider)] px-3 py-1.5 text-left text-[13px] font-medium text-slate-700">
                  {row.name}
                </td>
                <td className={`border-b border-[color:var(--tk-color-border-divider)] px-3 py-1.5 text-right text-[13px] font-semibold ${trendTone}`}>
                  {row.changePct}
                </td>
                <td className={`border-b border-[color:var(--tk-color-border-divider)] px-3 py-1.5 text-right text-[13px] font-semibold ${trendTone}`}>
                  {row.lastPrice}
                </td>
                <td className="border-b border-[color:var(--tk-color-border-divider)] px-3 py-1.5 text-right text-[13px] font-semibold text-[#ff5c57]">
                  {row.high}
                </td>
                <td className="border-b border-[color:var(--tk-color-border-divider)] px-3 py-1.5 text-right text-[13px] font-semibold text-[#35a854]">
                  {row.low}
                </td>
                <td className="border-b border-[color:var(--tk-color-border-divider)] px-3 py-1.5 text-right text-[13px] text-slate-700">
                  {row.turnover}
                </td>
                <td className="border-b border-[color:var(--tk-color-border-divider)] px-3 py-1.5 text-right text-[13px] text-slate-700">
                  {row.incomePer100k}
                </td>
                <td className="border-b border-[color:var(--tk-color-border-divider)] px-3 py-1.5 text-right text-[13px] text-slate-700">
                  {row.feePer100k}
                </td>
                <td className="border-b border-[color:var(--tk-color-border-divider)] px-3 py-1.5 text-right text-[13px] text-slate-700">
                  {row.availableDate}
                </td>
                <td className="border-b border-[color:var(--tk-color-border-divider)] px-3 py-1.5 text-right text-[13px] text-slate-700">
                  {row.withdrawDate}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function NcdAuxTable() {
  return (
    <div className="h-full min-h-0 overflow-auto">
      <table className="w-full border-collapse bg-white text-[14px] leading-[1.35]">
        <thead className="sticky top-0 z-10 bg-[#fafafa]">
          <tr>
            <th className="w-[100px] border-b border-r border-[color:var(--tk-color-border-divider)] px-3 py-2 text-left text-[14px] font-medium text-slate-500" />
            {ncdPrimaryPeriods.map((period) => {
              const header = ncdColHeaders[period];
              return (
                <th
                  key={period}
                  className="border-b border-r border-[color:var(--tk-color-border-divider)] px-2 py-2 text-center last:border-r-0"
                >
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-[14px] font-semibold text-slate-700">{period}</span>
                    <span className="text-[12px] text-slate-400">
                      ({header.dow} {header.date})
                    </span>
                    {header.count ? (
                      <span className="rounded bg-blue-50 px-1 text-[12px] font-medium text-blue-500">
                        {header.count}
                      </span>
                    ) : null}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {ncdAllPeriodsData.map((group) => (
            <tr key={group.label} className="align-top">
              <td className="border-b border-r border-[color:var(--tk-color-border-divider)] bg-[#fafafa] px-3 py-2 text-[14px] font-medium text-slate-500">
                {group.label}
              </td>
              {ncdPrimaryPeriods.map((period) => (
                <td
                  key={`${group.label}-${period}`}
                  className="border-b border-r border-[color:var(--tk-color-border-divider)] px-3 py-2 align-top last:border-r-0"
                >
                  <NcdCellList cells={group.cells[period]} period={period} group={group} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function exchangeTrendTone(value: string) {
  const parsed = Number(value);
  if (parsed > 0) return "text-[#ff5c57]";
  if (parsed < 0) return "text-[#35a854]";
  return "text-slate-700";
}

function NcdCellList({
  cells,
  period,
  group,
}: {
  cells: readonly NcdAllPeriodCell[];
  period: NcdPeriod;
  group: NcdAllPeriodGroup;
}) {
  const visibleCells = lowestFiveNcdCells(cells);

  if (!visibleCells.length) {
    return <div className="text-center text-[13px] text-slate-400">--</div>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      {visibleCells.map((cell, index) => (
        <div
          key={`${group.label}-${period}-${cell.name}-${index}`}
          className="flex items-center justify-between gap-2"
        >
          <span className="truncate text-[14px] text-slate-600">{cell.name}</span>
          <div className="flex shrink-0 items-center gap-1">
            <span className="font-mono text-[14px] font-semibold text-[#f97316]">{cell.rate}</span>
            {cell.change ? (
              <span className="text-[13px] font-medium text-emerald-500">{formatNcdChange(cell.change)}</span>
            ) : null}
            {cell.limitNonBank ? (
              <span className="rounded bg-slate-100 px-1 text-[12px] text-slate-500">限非</span>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function lowestFiveNcdCells(cells: readonly NcdAllPeriodCell[]) {
  return [...cells]
    .sort((left, right) => parseNcdRate(left.rate) - parseNcdRate(right.rate))
    .slice(0, 5);
}

function parseNcdRate(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

function formatNcdChange(value: string) {
  return value.startsWith("+") || value.startsWith("-") ? value : `+${value}`;
}
