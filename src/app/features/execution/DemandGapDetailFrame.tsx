import {
  demandAccountsByDirection,
  demandDirectionLabels,
  demandRowsByDirection,
  demandTenors,
} from "./execution.data";
import {
  buildDemandGapRows,
  formatDemandAmount,
  roundDemandValue,
} from "./execution.utils";

export function DemandGapDetailFrame({ onClose }: { onClose: () => void }) {
  const gapRows = buildDemandGapRows({
    demandRowsByDirection,
    demandTenors,
    demandDirectionLabels,
    demandAccountsByDirection,
  });
  const totals = gapRows.reduce(
    (acc, row) => ({
      need: roundDemandValue(acc.need + row.need),
      done: roundDemandValue(acc.done + row.done),
      gap: roundDemandValue(acc.gap + row.gap),
    }),
    { need: 0, done: 0, gap: 0 },
  );
  const maxGapRow = gapRows[0];
  const completion =
    totals.need > 0 ? Math.round((totals.done / totals.need) * 100) : 0;

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] px-4 py-3">
        <div className="min-w-0">
          <h2 className="m-0 text-lg font-semibold tracking-wide text-slate-100 underline decoration-[rgba(248,113,113,0.9)] underline-offset-8">
            IMS 指令
          </h2>
          <p className="mt-2 text-xs text-slate-400">
            按账户、方向、押券与期限拆解未覆盖需求，金额单位：亿。
          </p>
        </div>
        <button className="tk-button" onClick={onClose} type="button">
          返回主看板
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 text-xs">
        <DemandGapSummaryCard
          label="总需求"
          value={`${formatDemandAmount(totals.need)} 亿`}
        />
        <DemandGapSummaryCard
          label="已成交"
          value={`${formatDemandAmount(totals.done)} 亿`}
        />
        <DemandGapSummaryCard
          label="总缺口"
          value={`${formatDemandAmount(totals.gap)} 亿`}
          tone="alert"
        />
        <DemandGapSummaryCard
          label="最大缺口"
          value={maxGapRow ? `${maxGapRow.directionLabel} ${maxGapRow.tenor}` : "-"}
          helper={
            maxGapRow
              ? `${maxGapRow.collateral} ${formatDemandAmount(maxGapRow.gap)} 亿`
              : undefined
          }
        />
      </div>

      <div className="min-h-0 overflow-hidden rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]">
        <div className="flex items-center justify-between border-b border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-dark-soft)] px-4 py-2">
          <div className="tk-title">缺口明细 Table</div>
          <div className="text-xs text-slate-400">整体完成率 {completion}%</div>
        </div>
        <div className="h-full min-h-0 overflow-auto">
          <table className="w-full min-w-[960px] border-separate border-spacing-0 text-xs">
            <thead className="sticky top-0 z-10 bg-[rgba(15,23,42,0.98)] text-slate-400">
              <tr>
                {[
                  "优先级",
                  "账户",
                  "方向",
                  "押券",
                  "期限",
                  "需求",
                  "已成交",
                  "缺口",
                  "完成率",
                  "处理建议",
                ].map((column) => (
                  <th
                    key={column}
                    className="border-b border-[color:var(--tk-color-border-divider)] px-3 py-2 text-left font-medium"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gapRows.map((row) => (
                <tr key={row.id} className="group">
                  <td className="border-b border-[color:var(--tk-color-border-divider)] px-3 py-2">
                    <span
                      className={`rounded px-2 py-0.5 ${
                        row.priority === "高"
                          ? "bg-[rgba(231,53,58,0.16)] text-red-200"
                          : row.priority === "中"
                            ? "bg-[rgba(245,158,11,0.14)] text-amber-200"
                            : "bg-[rgba(148,163,184,0.12)] text-slate-300"
                      }`}
                    >
                      {row.priority}
                    </span>
                  </td>
                  <td className="border-b border-[color:var(--tk-color-border-divider)] px-3 py-2 font-medium text-slate-100">
                    {row.account}
                  </td>
                  <td className="border-b border-[color:var(--tk-color-border-divider)] px-3 py-2 text-slate-200">
                    <span
                      className={
                        row.direction === "repo" ? "text-red-200" : "text-cyan-200"
                      }
                    >
                      {row.directionLabel}
                    </span>
                  </td>
                  <td className="border-b border-[color:var(--tk-color-border-divider)] px-3 py-2 text-slate-300">
                    {row.collateral}
                  </td>
                  <td className="border-b border-[color:var(--tk-color-border-divider)] px-3 py-2 font-semibold text-slate-100">
                    {row.tenor}
                  </td>
                  <td className="border-b border-[color:var(--tk-color-border-divider)] px-3 py-2 text-right text-slate-300">
                    {formatDemandAmount(row.need)}
                  </td>
                  <td className="border-b border-[color:var(--tk-color-border-divider)] px-3 py-2 text-right text-slate-300">
                    {formatDemandAmount(row.done)}
                  </td>
                  <td className="border-b border-[color:var(--tk-color-border-divider)] px-3 py-2 text-right font-semibold text-red-200">
                    {formatDemandAmount(row.gap)}
                  </td>
                  <td className="border-b border-[color:var(--tk-color-border-divider)] px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-[var(--tdx-red)]"
                          style={{ width: `${row.progress}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-slate-300">
                        {row.progress}%
                      </span>
                    </div>
                  </td>
                  <td className="border-b border-[color:var(--tk-color-border-divider)] px-3 py-2 text-slate-400">
                    {row.suggestion}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DemandGapSummaryCard({
  label,
  value,
  helper,
  tone = "neutral",
}: {
  label: string;
  value: string;
  helper?: string;
  tone?: "neutral" | "alert";
}) {
  return (
    <div className="rounded-md border border-[color:var(--tk-color-border-panel)] bg-[rgba(15,23,42,0.72)] px-3 py-2">
      <div className="text-mini text-slate-500">{label}</div>
      <div
        className={`mt-1 text-base font-semibold ${
          tone === "alert" ? "text-red-200" : "text-slate-100"
        }`}
      >
        {value}
      </div>
      {helper ? (
        <div className="mt-1 truncate text-mini text-slate-500">{helper}</div>
      ) : null}
    </div>
  );
}
