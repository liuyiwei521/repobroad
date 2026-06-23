import { Fragment, useState } from "react";

import {
  DEFAULT_TRADING_NOTICE_TEXT,
  DEFAULT_TRADING_STATUS_TEXT,
} from "../../components/dialogs/TradingNoticeEditorModal";
import { PageFrame as ShellPageFrame } from "../../components/shell/PageFrame";
import {
  demandRowsByDirection,
  demandTenors,
  executionRows,
} from "./execution.data";
import { DemandGapDetailFrame } from "./DemandGapDetailFrame";
import {
  buildDemandMatrix,
  demandProgress,
} from "./execution.utils";
import type { DemandAmount, DemandBottomTab } from "./execution.types";

export function CombinedDemandMatrixCard() {
  const [detailOpen, setDetailOpen] = useState(false);
  const [bottomTab, setBottomTab] = useState<DemandBottomTab>("demand");
  const repoMatrix = buildDemandMatrix(demandRowsByDirection.repo, demandTenors);
  const reverseMatrix = buildDemandMatrix(
    demandRowsByDirection.reverse,
    demandTenors,
  );
  const reverseByTenor = demandTenors.map(
    (tenor) => reverseMatrix.columnTotals[tenor],
  );
  const reverseTotal = reverseMatrix.grandTotal;

  const tabItems: { key: DemandBottomTab; label: string }[] = [
    { key: "demand", label: "正/逆回购需求" },
    { key: "execution", label: "资金缺口 / 在途指令" },
  ];

  return (
    <>
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]">
        <div className="flex items-center justify-between gap-2 border-b border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-dark-soft)] px-2.5 py-1.5">
          <div className="flex min-w-0 items-center gap-1.5">
            {tabItems.map((tab) => (
              <button
                key={tab.key}
                className={`tk-chip tk-segmented-tab transition-colors ${
                  bottomTab === tab.key
                    ? "bg-[rgba(248,113,113,0.18)] text-red-200"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                onClick={() => setBottomTab(tab.key)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
          {bottomTab === "demand" && (
            <div className="flex shrink-0 gap-1">
              {demandTenors.map((tenor) => (
                <span key={tenor} className="tk-matrix-tag rounded border px-1 py-0.5">
                  {tenor}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="min-h-0 overflow-auto">
          {bottomTab === "demand" ? (
            <div className="h-full min-h-0 p-1">
              <div className="grid h-full min-h-0 grid-cols-[4.2rem_repeat(3,minmax(0,1fr))] grid-rows-[1.55rem_repeat(5,minmax(0,1fr))] gap-px text-micro">
                <DemandTableHeader label="正回购需求" />
                {demandTenors.map((tenor) => (
                  <DemandTableHeader key={tenor} label={tenor} align="right" />
                ))}
                <DemandTableHeader label="合计" align="right" />
                {repoMatrix.rows.map((row) => (
                  <Fragment key={row.label}>
                    <DemandRowHeader row={row} />
                    {demandTenors.map((tenor) => (
                      <DemandCompactCell
                        key={`${row.label}-${tenor}`}
                        amount={row.cells[tenor]}
                      />
                    ))}
                    <DemandCompactCell amount={repoMatrix.rowTotals[row.label]} strong />
                  </Fragment>
                ))}
                <DemandTableHeader label="合计" />
                {demandTenors.map((tenor) => (
                  <DemandCompactCell
                    key={`repo-total-${tenor}`}
                    amount={repoMatrix.columnTotals[tenor]}
                    strong
                  />
                ))}
                <DemandCompactCell amount={repoMatrix.grandTotal} strong />
                <DemandTableHeader label="逆回购需求" />
                {reverseByTenor.map((amount, index) => (
                  <DemandCompactCell
                    key={`reverse-${demandTenors[index]}`}
                    amount={amount}
                    accent="var(--tk-color-brand-cyan)"
                  />
                ))}
                <DemandCompactCell
                  amount={reverseTotal}
                  strong
                  accent="var(--tk-color-brand-cyan)"
                />
              </div>
            </div>
          ) : (
            <table className="tk-table w-full border-separate border-spacing-0 text-xs">
              <thead className="sticky top-0 z-10 bg-[var(--tk-color-surface-dark-soft)] text-slate-400">
                <tr>
                  {[
                    "账户",
                    "保本利率",
                    "资金缺口/可用额度",
                    "在途状态",
                    "下达时间",
                    "账户要求",
                    "质押要求",
                  ].map((col) => (
                    <th
                      key={col}
                      className="border-b border-[color:var(--tk-color-border-divider)] px-2 py-1.5 text-left text-mini font-medium tracking-[0]"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {executionRows.map((row) => {
                  const hasInflight = row.progress !== null;
                  const isCompleted = hasInflight && row.progress >= 100;
                  const statusLabel = !hasInflight
                    ? "未下达"
                    : isCompleted
                      ? "已完成"
                      : "进行中";
                  const statusClassName = !hasInflight
                    ? "border-[rgba(148,163,184,0.2)] bg-[rgba(148,163,184,0.12)] text-slate-400"
                    : isCompleted
                      ? "border-[rgba(16,185,129,0.28)] bg-[rgba(16,185,129,0.14)] text-emerald-200"
                      : "border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.14)] text-red-200";

                  return (
                    <tr key={row.account} className="hover:bg-[rgba(255,255,255,0.03)]">
                      <td className="border-b border-[color:var(--tk-color-border-divider)] px-2 py-1.5 font-medium text-slate-200">
                        {row.account}
                      </td>
                      <td className="border-b border-[color:var(--tk-color-border-divider)] px-2 py-1.5 text-amber-300">
                        {row.breakEvenRate}
                      </td>
                      <td className="border-b border-[color:var(--tk-color-border-divider)] px-2 py-1.5 font-semibold text-red-300">
                        {row.gap}
                      </td>
                      <td className="border-b border-[color:var(--tk-color-border-divider)] px-2 py-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded border px-1.5 py-0.5 text-micro font-medium ${statusClassName}`}
                          >
                            {statusLabel}
                          </span>
                          {hasInflight ? (
                            <div className="flex items-center gap-1.5">
                              <div className="h-1 w-12 overflow-hidden rounded-full bg-slate-700">
                                <div
                                  className={`h-full rounded-full ${
                                    isCompleted ? "bg-emerald-500" : "bg-[var(--tdx-red)]"
                                  }`}
                                  style={{ width: `${Math.min(row.progress, 100)}%` }}
                                />
                              </div>
                              <span
                                className={
                                  isCompleted ? "text-emerald-400" : "text-slate-300"
                                }
                              >
                                {row.progress}%
                              </span>
                            </div>
                          ) : null}
                        </div>
                      </td>
                      <td className="border-b border-[color:var(--tk-color-border-divider)] px-2 py-1.5 text-slate-300">
                        {row.issuedAt ?? "--"}
                      </td>
                      <td className="border-b border-[color:var(--tk-color-border-divider)] px-2 py-1.5 text-slate-400">
                        {row.accountReq}
                      </td>
                      <td className="border-b border-[color:var(--tk-color-border-divider)] px-2 py-1.5 text-slate-400">
                        {row.collateralReq}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {detailOpen ? (
        <ShellPageFrame title="IMS 指令" onClose={() => setDetailOpen(false)}>
          <DemandGapDetailFrame onClose={() => setDetailOpen(false)} />
        </ShellPageFrame>
      ) : null}
    </>
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
          R001 活跃度上升，关注正/逆需求缺口
        </div>
      </div>
      <div className="min-w-0">
        <div className="tk-muted truncate">最新动作</div>
        <div className="mt-0.5 truncate text-amber-300">
          加权价格与匿名成交已移入底部矩阵
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
    <div
      className={`flex min-w-0 items-center overflow-hidden rounded-sm border border-[color:var(--tk-color-border-panel)] bg-[rgba(30,41,59,0.82)] px-1 text-micro font-semibold text-slate-300 ${
        align === "right" ? "justify-end text-right" : ""
      }`}
    >
      <span className="truncate">{label}</span>
    </div>
  );
}

function DemandCompactCell({
  amount,
  strong = false,
  accent = "var(--tdx-red)",
}: {
  amount: DemandAmount;
  strong?: boolean;
  accent?: string;
}) {
  const progress = demandProgress(amount);
  const empty = amount.need <= 0;
  return (
    <div
      className={`grid min-w-0 content-center overflow-hidden rounded-sm border px-1 py-[1px] text-right ${
        strong
          ? "border-[rgba(231,53,58,0.32)] bg-[rgba(30,41,59,0.86)]"
          : "border-[color:var(--tk-color-border-panel)] bg-[rgba(15,23,42,0.66)]"
      } ${empty ? "opacity-40" : ""}`}
    >
      <div className="truncate text-micro font-semibold text-slate-200">
        {amount.need.toFixed(1)} / {amount.done.toFixed(1)}
      </div>
      <div className="mt-0.5 h-0.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full"
          style={{ width: `${progress}%`, backgroundColor: accent }}
        />
      </div>
    </div>
  );
}

function DemandRowHeader({
  row,
}: {
  row: (typeof demandRowsByDirection.repo)[number];
}) {
  return (
    <div
      className="flex min-w-0 items-center overflow-hidden rounded-sm border border-[color:var(--tk-color-border-panel)] bg-[rgba(30,41,59,0.74)] px-1 py-[1px]"
      style={{ borderLeft: `2px solid ${row.color}` }}
    >
      <div className="text-micro font-semibold leading-none text-slate-200">
        {row.label}
      </div>
    </div>
  );
}
