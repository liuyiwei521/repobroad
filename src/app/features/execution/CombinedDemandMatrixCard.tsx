import { useMemo, useState } from "react";
import {
  DEFAULT_TRADING_NOTICE_TEXT,
  DEFAULT_TRADING_STATUS_TEXT,
} from "../../components/dialogs/TradingNoticeEditorModal";
import {
  executionRows,
  fundGapDataByDirection,
} from "./execution.data";
import type {
  DemandDirection,
  ExecutionRow,
  FundGapColumn,
  FundGapColumnKey,
  FundGapCustomRow,
} from "./execution.types";

type DirectionTab = DemandDirection;
type StatusFilter = "all" | "idle" | "active" | "done";
type SortDirection = "asc" | "desc";

const directionTabOptions: readonly { key: DirectionTab; label: string }[] = [
  { key: "repo", label: "正回购需求" },
  { key: "reverse", label: "逆回购需求" },
];

const statusFilterOptions: readonly { key: StatusFilter; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "idle", label: "未开始" },
  { key: "active", label: "进行中" },
  { key: "done", label: "已完成" },
];

export function CombinedDemandMatrixCard() {
  const [directionTab, setDirectionTab] = useState<DirectionTab>("repo");
  const [accountSearch, setAccountSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  const fundGapData = fundGapDataByDirection[directionTab];

  const filteredRows = useMemo(() => {
    let rows = executionRows.filter((row) => row.direction === directionTab);

    if (accountSearch) {
      const query = accountSearch.toLowerCase();
      rows = rows.filter((row) => row.account.toLowerCase().includes(query));
    }

    if (statusFilter !== "all") {
      rows = rows.filter((row) => resolveExecutionStatus(row).tone === statusFilter);
    }

    rows = [...rows].sort((a, b) =>
      sortDir === "desc" ? b.remaining - a.remaining : a.remaining - b.remaining,
    );

    return rows;
  }, [directionTab, accountSearch, statusFilter, sortDir]);

  function toggleSort() {
    setSortDir((current) => (current === "desc" ? "asc" : "desc"));
  }

  return (
    <section className="tk-panel grid h-full min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] overflow-hidden border">
      {/* Direction tabs — replaces old title */}
      <div className="flex items-center gap-1.5 border-b px-3 py-2">
        {directionTabOptions.map((option) => (
          <button
            key={option.key}
            className={`inline-flex h-7 items-center justify-center rounded-md border px-3 text-[13px] font-medium transition-all duration-150 ${
              directionTab === option.key
                ? option.key === "repo"
                  ? "border-[#f0ccd0] bg-[#c45462] text-white shadow-[0_4px_10px_rgba(196,84,98,0.3)]"
                  : "border-[#d7e2f2] bg-[#537dbc] text-white shadow-[0_4px_10px_rgba(83,125,188,0.3)]"
                : "border-transparent bg-[var(--tdx-bg-panel)] tk-muted hover:bg-[var(--tk-color-surface-hover)]"
            }`}
            onClick={() => setDirectionTab(option.key)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Fund gap table — dynamic columns & custom rows */}
      <div className="overflow-x-auto border-b border-[color:var(--tk-color-border-panel)] px-1.5 py-1">
        <table className="tk-table w-full border-separate border-spacing-0 text-xs">
          <thead>
            <tr>
              <FundGapHeaderCell label="" />
              {fundGapData.columns.map((col) => (
                <FundGapHeaderCell key={col.key} label={col.label} align="right" />
              ))}
            </tr>
          </thead>
          <tbody>
            {fundGapData.rows.map((row) => (
              <FundGapBodyRow
                key={row.label}
                row={row}
                columns={fundGapData.columns}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Inflight toolbar + table */}
      <div className="flex min-h-0 flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b border-[color:var(--tk-color-border-panel)] px-3 py-1.5 text-[13px]">
          <div className="relative">
            <input
              type="text"
              value={accountSearch}
              onChange={(e) => setAccountSearch(e.target.value)}
              placeholder="搜索账户…"
              className="h-7 w-[150px] rounded border border-[color:var(--tk-color-border-default)] bg-[var(--tdx-bg-panel)] pl-2 pr-7 text-[13px] tk-strong outline-none focus:border-[color:var(--tk-color-brand-cyan)]"
            />
            <svg className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 tk-muted" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6.5" cy="6.5" r="5"/><path d="M10 10l4 4"/></svg>
          </div>
          <span className="h-4 w-px bg-[var(--tk-color-border-divider-dark)]" />
          <div className="flex items-center gap-1.5">
            <span className="tk-muted whitespace-nowrap">状态</span>
            {statusFilterOptions.map((opt) => (
              <button
                key={opt.key}
                className={`inline-flex h-6 items-center rounded px-2 text-[13px] transition-colors ${
                  statusFilter === opt.key
                    ? "bg-[rgba(59,130,246,0.12)] font-medium text-[color:var(--tk-color-brand-cyan)]"
                    : "tk-muted hover:bg-[var(--tk-color-surface-hover)]"
                }`}
                onClick={() => setStatusFilter(opt.key)}
                type="button"
              >
                {opt.label}
              </button>
            ))}
          </div>
          <span className="h-4 w-px bg-[var(--tk-color-border-divider-dark)]" />
          <button
            className="inline-flex items-center gap-1 tk-muted hover:text-[color:var(--tk-color-brand-cyan)]"
            onClick={toggleSort}
            type="button"
          >
            按剩余排序
            <span className="text-xs">{sortDir === "desc" ? "↓" : "↑"}</span>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
        <table className="tk-table w-full border-separate border-spacing-0 text-xs">
          <thead className="sticky top-0 z-10">
            <tr>
              <TableHeaderCell label="账户" />
              <TableHeaderCell label="剩余/指令" align="right" />
              <TableHeaderCell label="完成状态" />
              <TableHeaderCell label="下达时间" align="right" />
              <TableHeaderCell label="合规要求" />
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => {
              const status = resolveExecutionStatus(row);
              const compliance = buildComplianceText(row);

              return (
                <tr key={row.account}>
                  <td className="border-b px-3 py-1.5">
                    <span className="tk-strong font-semibold">{row.account}</span>
                  </td>
                  <td className="border-b px-3 py-1.5 text-right">
                    <span className="whitespace-nowrap tabular-nums">
                      <span className={`font-medium ${row.remaining > 0 ? "text-[color:var(--tdx-red)]" : "tk-muted"}`}>
                        {row.remaining.toFixed(1)}
                      </span>
                      <span className="tk-muted"> / {row.total.toFixed(1)}</span>
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
                      {row.issuedAt || "--"}
                    </span>
                  </td>
                  <td className="border-b px-3 py-1.5">
                    {compliance ? (
                      <span className="tk-muted max-w-[14rem] truncate inline-block" title={compliance}>
                        {compliance}
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

function FundGapHeaderCell({
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

function FundGapBodyRow({
  row,
  columns,
}: {
  row: FundGapCustomRow;
  columns: FundGapColumn[];
}) {
  return (
    <tr>
      <td className="border-b bg-[var(--tdx-bg-panel)] px-2 py-1.5 text-left">
        <span className="tk-strong font-medium whitespace-nowrap">{row.label}</span>
      </td>
      {columns.map((col) => (
        <td
          key={col.key}
          className="border-b bg-[var(--tdx-bg-panel)] px-2 py-1.5 text-right"
        >
          {row.type === "paired" && row.pairedValues ? (
            <FundGapPairedValue
              done={row.pairedValues[col.key]?.done ?? 0}
              need={row.pairedValues[col.key]?.need ?? 0}
            />
          ) : (
            <FundGapSingleValue value={row.values[col.key] ?? 0} />
          )}
        </td>
      ))}
    </tr>
  );
}

function FundGapSingleValue({ value }: { value: number }) {
  if (value === 0) {
    return <span className="tk-muted whitespace-nowrap tabular-nums">-</span>;
  }

  return (
    <span
      className={`whitespace-nowrap tabular-nums tk-strong ${
        value < 0 ? "text-[color:var(--tdx-green)]" : ""
      }`}
    >
      {formatGapNumber(value)}
    </span>
  );
}

function FundGapPairedValue({ done, need }: { done: number; need: number }) {
  if (done === 0 && need === 0) {
    return <span className="tk-muted whitespace-nowrap tabular-nums">-</span>;
  }

  return (
    <span className="whitespace-nowrap tabular-nums tk-strong">
      {formatGapNumber(done)}/{formatGapNumber(need)}
    </span>
  );
}

function formatGapNumber(value: number): string {
  return value.toLocaleString("zh-CN");
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
    return { label: "未开始", value: "--", tone: "idle" };
  }

  if (row.progress >= 100) {
    return { label: "已完成", value: `${row.progress}%`, tone: "done" };
  }

  return { label: "进行中", value: `${row.progress}%`, tone: "active" };
}

function buildComplianceText(row: ExecutionRow): string {
  const parts: string[] = [];
  if (row.tradeNote) parts.push(row.tradeNote);
  if (row.investNote) parts.push(row.investNote);
  if (row.counterpartyTag) parts.push(row.counterpartyTag);
  return parts.join(" · ");
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
