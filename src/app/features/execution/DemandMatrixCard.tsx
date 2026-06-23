import { Fragment } from "react";

import {
  demandDirectionLabels,
  demandRowsByDirection,
  demandTenors,
} from "./execution.data";
import {
  buildDemandMatrix,
  demandGap,
  demandProgress,
  formatDemandAmount,
} from "./execution.utils";
import type {
  DemandAmount,
  DemandDirection,
  DemandRow,
} from "./execution.types";

export function DemandMatrixCard({
  direction,
  title,
  tag,
  hint,
}: {
  direction: DemandDirection;
  title: string;
  tag: string;
  hint: string;
}) {
  const matrix = buildDemandMatrix(demandRowsByDirection[direction], demandTenors);
  const directionAccent =
    direction === "repo" ? "var(--tdx-red)" : "var(--tk-color-brand-cyan)";

  return (
    <div className="grid min-h-0 grid-rows-[auto_1fr] overflow-hidden rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]">
      <div className="flex items-center justify-between gap-2 border-b border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-dark-soft)] px-2.5 py-1.5">
        <div className="min-w-0">
          <div className="tk-matrix-card-title truncate">{title}</div>
          <div className="tk-matrix-card-subtitle truncate">{hint}</div>
        </div>
        <span
          className="tk-matrix-tag shrink-0 rounded border px-1 py-0.5"
          style={{
            borderColor: directionAccent,
            background:
              direction === "repo"
                ? "rgba(231,53,58,0.14)"
                : "rgba(0,207,232,0.12)",
            color: direction === "repo" ? "#fecaca" : "#a5f3fc",
          }}
        >
          {tag}
        </span>
      </div>

      <div className="min-h-0 overflow-hidden p-[1px]">
        <div className="grid h-full min-h-0 grid-cols-[3.75rem_repeat(3,minmax(0,1fr))] grid-rows-[1.95rem_repeat(3,minmax(0,1fr))] gap-px text-micro">
          <DemandAxisHeader />
          <DemandHeaderCell
            label="合计"
            amount={matrix.grandTotal}
            accent={directionAccent}
          />
          {demandTenors.map((tenor) => (
            <DemandHeaderCell
              key={tenor}
              label={tenor}
              amount={matrix.columnTotals[tenor]}
              accent={directionAccent}
            />
          ))}

          {matrix.rows.map((row) => {
            const rowTotal = matrix.rowTotals[row.label];
            return (
              <Fragment key={row.label}>
                <DemandRowHeader row={row} />
                <DemandMatrixCell
                  amount={rowTotal}
                  accent={directionAccent}
                  isTotal
                />
                {demandTenors.map((tenor) => (
                  <DemandMatrixCell
                    key={`${row.label}-${tenor}`}
                    amount={row.cells[tenor]}
                    accent={directionAccent}
                  />
                ))}
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DemandAxisHeader() {
  return (
    <div className="flex min-w-0 items-center overflow-hidden rounded-sm border border-dashed border-[color:var(--tk-color-border-panel)] bg-transparent px-1 text-slate-500">
      <span className="text-[8.5px] leading-none">押券 / 期限</span>
    </div>
  );
}

function DemandHeaderCell({
  label,
  amount,
  accent,
}: {
  label: string;
  amount: DemandAmount;
  accent: string;
}) {
  const progress = demandProgress(amount);
  const done = amount.need > 0 && demandGap(amount) === 0;
  const empty = amount.need <= 0;
  return (
    <div
      className={`flex min-w-0 flex-col justify-center overflow-hidden rounded-sm border px-1 py-[1px] ${
        done
          ? "border-[rgba(148,163,184,0.16)] bg-[rgba(71,85,105,0.22)] text-slate-500"
          : "border-[color:var(--tk-color-border-panel)] bg-[rgba(30,41,59,0.82)] text-slate-300"
      } ${empty ? "opacity-45" : ""}`}
    >
      <div className="text-micro font-semibold leading-none">{label}</div>
      <DemandMiniStats
        amount={amount}
        accent={accent}
        progress={progress}
        muted={done || empty}
      />
    </div>
  );
}

function DemandRowHeader({ row }: { row: DemandRow }) {
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

function DemandMatrixCell({
  amount,
  accent,
  isTotal = false,
}: {
  amount: DemandAmount;
  accent: string;
  isTotal?: boolean;
}) {
  const gap = demandGap(amount);
  const progress = demandProgress(amount);
  const done = amount.need > 0 && gap === 0;
  const empty = amount.need <= 0;
  return (
    <button
      type="button"
      className={`min-w-0 overflow-hidden rounded-sm border px-1 py-[1px] text-left transition ${
        done
          ? "border-[rgba(148,163,184,0.14)] bg-[rgba(71,85,105,0.18)] text-slate-500"
          : isTotal
            ? "border-[rgba(231,53,58,0.32)] bg-[rgba(30,41,59,0.86)] text-slate-200"
            : "border-[color:var(--tk-color-border-panel)] bg-[rgba(15,23,42,0.66)] text-slate-200 hover:border-[color:var(--tk-color-brand-primary-hover)]"
      } ${empty ? "opacity-35" : ""}`}
    >
      <div className="grid h-full min-h-0 content-center grid-rows-[auto_auto] gap-y-[1px]">
        <div className="flex min-w-0 items-baseline justify-between gap-2">
          <DemandCellMetric label="需" value={amount.need} tone="primary" />
          <DemandCellMetric
            label="差"
            value={gap}
            tone={gap > 0 ? "gap" : "muted"}
            align="right"
          />
        </div>
        <div className="grid min-w-0 grid-cols-[auto_minmax(14px,1fr)_auto] items-center gap-0.5">
          <DemandCellMetric label="已" value={amount.done} tone="done" />
          <DemandInlineProgress
            progress={progress}
            accent={accent}
            muted={done || empty}
          />
          <span className="text-micro text-slate-400">{progress}%</span>
        </div>
      </div>
    </button>
  );
}

function DemandCellMetric({
  label,
  value,
  tone,
  align = "left",
}: {
  label: string;
  value: number;
  tone: "primary" | "done" | "gap" | "muted";
  align?: "left" | "right";
}) {
  const valueClass =
    tone === "primary"
      ? "text-slate-100"
      : tone === "done"
        ? "text-slate-300"
        : tone === "gap"
          ? "text-amber-300"
          : "text-slate-500";

  return (
    <div
      className={`flex min-w-0 items-baseline gap-0.5 ${
        align === "right" ? "justify-end text-right" : ""
      }`}
    >
      <span className="shrink-0 text-micro text-slate-500">{label}</span>
      <span
        className={`truncate text-[13px] font-semibold leading-none ${valueClass}`}
      >
        {formatDemandAmount(value)}
      </span>
    </div>
  );
}

function DemandMiniStats({
  amount,
  accent,
  progress,
  muted,
}: {
  amount: DemandAmount;
  accent: string;
  progress: number;
  muted: boolean;
}) {
  const gap = demandGap(amount);
  return (
    <div className="mt-[1px] grid gap-y-0 leading-none text-slate-400 text-micro">
      <div className="flex min-w-0 items-baseline justify-between gap-1">
        <span className="whitespace-nowrap">
          <span className="text-slate-500">需</span>
          <span className="ml-0.5 font-semibold text-slate-200">
            {formatDemandAmount(amount.need)}
          </span>
        </span>
        <span className="whitespace-nowrap">
          <span className="text-slate-500">差</span>
          <span
            className="ml-0.5 font-semibold"
            style={{ color: gap > 0 ? "var(--tk-color-warning)" : accent }}
          >
            {formatDemandAmount(gap)}
          </span>
        </span>
      </div>
      <div className="grid min-w-0 grid-cols-[auto_minmax(14px,1fr)] items-center gap-1">
        <span className="whitespace-nowrap">
          <span className="text-slate-500">已</span>
          <span className="ml-0.5 font-semibold text-slate-300">
            {formatDemandAmount(amount.done)}
          </span>
        </span>
        <DemandInlineProgress progress={progress} accent={accent} muted={muted} />
      </div>
    </div>
  );
}

function DemandInlineProgress({
  progress,
  accent,
  muted,
}: {
  progress: number;
  accent: string;
  muted: boolean;
}) {
  return (
    <div className="h-[3px] min-w-0 overflow-hidden rounded bg-[rgba(148,163,184,0.14)]">
      <div
        className="h-full rounded transition-[width]"
        style={{
          width: `${progress}%`,
          background: muted ? "rgba(148,163,184,0.48)" : accent,
        }}
      />
    </div>
  );
}

export const middleMatrixPlaceholders = (
  [
    {
      title: "正回购需求",
      tag: "需求矩阵",
      hint: "本方正回购 · 押券 × 期限",
      kind: "matrix",
      direction: "repo",
    },
    {
      title: "逆回购需求",
      tag: "需求矩阵",
      hint: "本方逆回购 · 押券 × 期限",
      kind: "matrix",
      direction: "reverse",
    },
  ] as const
).map((item) => ({
  ...item,
  directionLabel: demandDirectionLabels[item.direction],
}));
