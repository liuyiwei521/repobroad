import type { QuoteTenorFilter } from "../../types";
import { getXrepoRowsByTenor } from "./xrepo.utils";

export function XrepoSummaryOverview({
  tenorFilter,
}: {
  tenorFilter: QuoteTenorFilter;
}) {
  const rows = getXrepoRowsByTenor(tenorFilter).slice(0, 5);

  return (
    <div className="mt-1 border-t border-[color:var(--tk-color-border-divider-dark)] pt-1">
      <div className="tk-table-shell overflow-hidden rounded border">
        <div className="grid grid-cols-[1.1fr_0.85fr_0.7fr_0.7fr_0.9fr] border-b border-[color:var(--tk-color-border-divider-dark)] bg-[var(--tk-color-surface-dark-soft)] px-1.5 py-0.5 text-micro leading-tight text-[color:var(--tk-color-text-tertiary)]">
          <span className="truncate">合约</span>
          <span className="truncate text-right">正量</span>
          <span className="truncate text-right">正利率</span>
          <span className="truncate text-right">逆利率</span>
          <span className="truncate text-right">逆量</span>
        </div>
        <div className="divide-y divide-[color:var(--tk-color-border-divider-dark)]">
          {rows.length ? (
            rows.map((row, index) => (
              <div
                key={`${row[0]}-${index}`}
                className="grid grid-cols-[1.1fr_0.85fr_0.7fr_0.7fr_0.9fr] px-1.5 py-1 text-mini"
              >
                <span className="truncate font-semibold text-slate-100">
                  {row[0]}
                </span>
                <span className="truncate text-right text-[color:var(--tdx-yellow)]">
                  {row[1]}
                </span>
                <span className="truncate text-right text-red-300">{row[2]}</span>
                <span className="truncate text-right text-emerald-300">{row[3]}</span>
                <span className="truncate text-right text-[color:var(--tdx-yellow)]">
                  {row[4]}
                </span>
              </div>
            ))
          ) : (
            <div className="px-2 py-2 text-micro text-slate-500">暂无相关报价</div>
          )}
        </div>
      </div>
    </div>
  );
}
