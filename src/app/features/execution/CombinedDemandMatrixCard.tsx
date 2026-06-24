import {
  DEFAULT_TRADING_NOTICE_TEXT,
  DEFAULT_TRADING_STATUS_TEXT,
} from "../../components/dialogs/TradingNoticeEditorModal";
import {
  demandRowsByDirection,
  demandTenors,
  executionRows,
} from "./execution.data";
import { buildDemandMatrix } from "./execution.utils";
import type { DemandAmount, ExecutionRow } from "./execution.types";

export function CombinedDemandMatrixCard() {
  const repoMatrix = buildDemandMatrix(demandRowsByDirection.repo, demandTenors);
  const reverseMatrix = buildDemandMatrix(
    demandRowsByDirection.reverse,
    demandTenors,
  );

  const demandBuckets = [
    {
      key: "1d",
      label: "1d",
      repo: repoMatrix.columnTotals.R001,
      reverse: reverseMatrix.columnTotals.R001,
    },
    {
      key: "7d",
      label: "7d",
      repo: repoMatrix.columnTotals.R007,
      reverse: reverseMatrix.columnTotals.R007,
    },
    {
      key: "14d",
      label: "14d",
      repo: { need: 18.6, done: 12.1 },
      reverse: { need: 13.7, done: 9.5 },
    },
    {
      key: "21d",
      label: "21d",
      repo: { need: 10.2, done: 6.4 },
      reverse: { need: 8.4, done: 4.9 },
    },
    {
      key: "other",
      label: "其他",
      repo: { need: 6.1, done: 3.0 },
      reverse: { need: 4.8, done: 2.3 },
    },
  ] as const;

  const demandSummaryRows = [
    {
      key: "repo",
      label: "正回购总计",
      accent: "var(--tdx-red)",
      amounts: demandBuckets.map((bucket) => bucket.repo),
    },
    {
      key: "reverse",
      label: "逆回购总计",
      accent: "var(--tk-color-brand-cyan)",
      amounts: demandBuckets.map((bucket) => bucket.reverse),
    },
  ].map((row) => ({
    ...row,
    total: sumDemandAmounts(row.amounts),
  }));

  return (
    <section className="tk-panel grid h-full min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] overflow-hidden border">
      <div className="tk-panel-header border-b px-3 py-2">
        <div className="tk-title">资金缺口 / 在途指令</div>
      </div>

      <div className="overflow-hidden border-b border-[color:var(--tk-color-border-panel)] px-1.5 py-1">
        <table className="tk-table w-full border-separate border-spacing-0 text-xs">
          <thead>
            <tr>
              <DemandTableHeader label="方向" />
              {demandBuckets.map((bucket) => (
                <DemandTableHeader
                  key={bucket.key}
                  label={bucket.label}
                  align="right"
                />
              ))}
              <DemandTableHeader label="合计" align="right" />
            </tr>
          </thead>
          <tbody>
            {demandSummaryRows.map((row) => (
              <tr key={row.key}>
                <DemandRowHeader label={row.label} color={row.accent} />
                {row.amounts.map((amount, index) => (
                  <DemandCompactCell
                    key={`${row.key}-${demandBuckets[index].key}`}
                    amount={amount}
                  />
                ))}
                <DemandCompactCell amount={row.total} strong />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="min-h-0 overflow-auto">
        <table className="tk-table w-full border-separate border-spacing-0 text-xs">
          <thead className="sticky top-0 z-10">
            <tr>
              <TableHeaderCell label="账户" />
              <TableHeaderCell label="总额" align="right" />
              <TableHeaderCell label="完成" align="right" />
              <TableHeaderCell label="剩余" align="right" />
              <TableHeaderCell label="完成百分比" />
              <TableHeaderCell label="下达时间" align="right" />
              <TableHeaderCell label="交易备注" />
              <TableHeaderCell label="投资备注" />
              <TableHeaderCell label="对手标签" />
            </tr>
          </thead>
          <tbody>
            {executionRows.map((row) => {
              const status = resolveExecutionStatus(row);

              return (
                <tr key={row.account}>
                  <td className="border-b px-3 py-1.5">
                    <span className="tk-strong font-semibold">{row.account}</span>
                  </td>
                  <td className="border-b px-3 py-1.5 text-right">
                    <span className="whitespace-nowrap font-medium tk-strong">
                      {row.total.toFixed(1)}
                    </span>
                  </td>
                  <td className="border-b px-3 py-1.5 text-right">
                    <span className="whitespace-nowrap font-medium text-[color:var(--tdx-green)]">
                      {row.done.toFixed(1)}
                    </span>
                  </td>
                  <td className="border-b px-3 py-1.5 text-right">
                    <span className={`whitespace-nowrap font-medium ${row.remaining > 0 ? "text-[color:var(--tdx-red)]" : "tk-muted"}`}>
                      {row.remaining.toFixed(1)}
                    </span>
                  </td>
                  <td className="border-b px-3 py-1.5">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <span className={executionStatusChipClass(status.tone)}>
                        {status.label}
                      </span>
                      <span className={executionStatusValueClass(status.tone)}>
                        {status.value}
                      </span>
                    </div>
                  </td>
                  <td className="border-b px-3 py-1.5 text-right">
                    <span className="whitespace-nowrap tk-strong">
                      {row.issuedAt ?? "--"}
                    </span>
                  </td>
                  <td className="border-b px-3 py-1.5">
                    <span className="tk-muted max-w-[8rem] truncate inline-block" title={row.tradeNote || undefined}>
                      {row.tradeNote || "--"}
                    </span>
                  </td>
                  <td className="border-b px-3 py-1.5">
                    <span className="tk-muted max-w-[8rem] truncate inline-block" title={row.investNote || undefined}>
                      {row.investNote || "--"}
                    </span>
                  </td>
                  <td className="border-b px-3 py-1.5">
                    {row.counterpartyTag ? (
                      <span className="rounded border border-[rgba(59,130,246,0.28)] bg-[rgba(59,130,246,0.08)] px-1.5 py-0.5 text-[color:var(--tk-color-brand-cyan)] whitespace-nowrap">
                        {row.counterpartyTag}
                      </span>
                    ) : (
                      <span className="tk-muted">--</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function MiddleMatrixNoticeBar({
  variant = "stacked",
  statusText = DEFAULT_TRADING_STATUS_TEXT,
  noticeText = DEFAULT_TRADING_NOTICE_TEXT,
  onOpenEditor,
}: {
  variant?: "stacked" | "inline";
  statusText?: string;
  noticeText?: string;
  onOpenEditor?: () => void;
}) {
  if (variant === "inline") {
    return (
      <button
        className="group grid w-full min-w-0 cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-center gap-10 overflow-hidden text-left outline-none"
        onClick={onOpenEditor}
        type="button"
        title="编辑交易提醒"
      >
        <span className="shrink-0 whitespace-nowrap text-[13px] font-semibold text-slate-200">
          {statusText}
        </span>
        <div className="tk-marquee relative flex min-w-0 items-center overflow-hidden">
          <div className="tk-marquee__track flex shrink-0 items-center gap-12 whitespace-nowrap text-[13px] font-semibold text-slate-200">
            <span>{noticeText}</span>
            <span aria-hidden="true">{noticeText}</span>
            <span aria-hidden="true">{noticeText}</span>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="grid shrink-0 grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] gap-2 border-b border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-soft)] px-3 py-2 text-micro">
      <div className="min-w-0">
        <div className="tk-muted truncate">提示信息</div>
        <div className="mt-0.5 truncate font-semibold text-slate-200">
          1d 需求仍偏活跃，优先关注正逆方向的缺口补齐。
        </div>
      </div>
      <div className="min-w-0">
        <div className="tk-muted truncate">最新动作</div>
        <div className="mt-0.5 truncate text-amber-300">
          中间下方区域已收成单一需求矩阵，只保留正逆回购汇总内容。
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="rounded border border-[rgba(231,53,58,0.48)] bg-[rgba(231,53,58,0.16)] px-1.5 py-0.5 text-red-200">
          2 条提醒
        </span>
      </div>
    </div>
  );
}

function DemandTableHeader({
  label,
  align = "left",
}: {
  label: string;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`border-b bg-[var(--tdx-bg-panel)] px-2 py-1.5 text-[12px] font-medium tracking-[0] text-[color:var(--tdx-text-muted)] ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {label}
    </th>
  );
}

function DemandCompactCell({
  amount,
  strong = false,
}: {
  amount: DemandAmount;
  strong?: boolean;
}) {
  const empty = amount.need <= 0;

  return (
    <td className="border-b bg-[var(--tdx-bg-panel)] px-2 py-1.5 text-right">
      <span
        className={`inline-flex min-w-[5.75rem] justify-end whitespace-nowrap px-1 tabular-nums ${
          strong ? "font-medium tk-strong" : empty ? "tk-muted" : "tk-strong"
        } ${empty ? "opacity-45" : ""}`}
      >
        {amount.need.toFixed(1)} / {amount.done.toFixed(1)}
      </span>
    </td>
  );
}

function DemandRowHeader({ label, color }: { label: string; color: string }) {
  return (
    <td className="border-b bg-[var(--tdx-bg-panel)] px-2 py-1.5 text-left">
      <span className="inline-flex items-center gap-2">
        <span
          className="h-4 w-0.5 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="tk-strong font-medium">{label}</span>
      </span>
    </td>
  );
}

function TableHeaderCell({
  label,
  align = "left",
}: {
  label: string;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`border-b px-3 py-2 text-mini font-medium tracking-[0] ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {label}
    </th>
  );
}

function resolveExecutionStatus(row: ExecutionRow): {
  label: string;
  value: string;
  tone: "idle" | "active" | "done";
} {
  if (row.progress == null) {
    return { label: "未下达", value: "--", tone: "idle" };
  }

  if (row.progress >= 100) {
    return { label: "已完成", value: `${row.progress}%`, tone: "done" };
  }

  return { label: "进行中", value: `${row.progress}%`, tone: "active" };
}

function executionStatusChipClass(tone: "idle" | "active" | "done") {
  if (tone === "done") {
    return "rounded border border-[rgba(20,160,20,0.28)] bg-[rgba(20,160,20,0.08)] px-1.5 py-0.5 text-[color:var(--tdx-green)]";
  }

  if (tone === "active") {
    return "rounded border border-[rgba(231,53,58,0.22)] bg-[rgba(231,53,58,0.08)] px-1.5 py-0.5 text-[color:var(--tdx-red)]";
  }

  return "rounded border border-[rgba(148,163,184,0.24)] bg-[rgba(148,163,184,0.08)] px-1.5 py-0.5 text-[color:var(--tdx-text-muted)]";
}

function executionStatusValueClass(tone: "idle" | "active" | "done") {
  if (tone === "done") {
    return "text-[color:var(--tdx-green)]";
  }

  if (tone === "active") {
    return "text-[color:var(--tdx-red)]";
  }

  return "tk-muted";
}

function sumDemandAmounts(amounts: readonly DemandAmount[]): DemandAmount {
  return amounts.reduce(
    (total, amount) => ({
      need: Number((total.need + amount.need).toFixed(1)),
      done: Number((total.done + amount.done).toFixed(1)),
    }),
    { need: 0, done: 0 },
  );
}
