import { Repeat } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import type {
  FrameOpenOptions,
  FrameRenderMode,
  QuoteTenorFilter,
} from "../../types";
import { XrepoHistoryBack } from "./XrepoHistoryBack";
import { xrepoSummarySection } from "./xrepo.data";
import { buildXrepoMetric, getXrepoRowsByTenor } from "./xrepo.utils";

function XrepoPreviewHeader({
  onOpen,
  actions,
  tenorFilter = "all",
}: {
  onOpen?: (options?: FrameOpenOptions) => void;
  actions?: ReactNode;
  tenorFilter?: QuoteTenorFilter;
}) {
  const metric = buildXrepoMetric(tenorFilter);

  return (
    <div className="tk-panel-header border-b px-2.5 py-1.5">
      <div className="flex min-w-0 items-center gap-2">
        <button
          className="group flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-0.5 text-left transition-colors hover:bg-[rgba(231,53,58,0.12)]"
          onClick={() => onOpen?.()}
          type="button"
        >
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] text-[color:var(--tk-color-text-inverse-secondary)]">
            <Repeat size={15} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="tk-title block truncate">XREPO</span>
          </span>
        </button>
        <span className="tk-chip shrink-0 rounded border text-micro">
          {metric.badge}
        </span>
        {actions ? (
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function cellClassName(
  value: string,
  columnIndex: number,
  greenColumns: readonly number[],
  redColumns: readonly number[],
  deltaColumns: readonly number[],
  emphasisColumns: readonly number[],
) {
  if (columnIndex === 0) return "tk-strong font-semibold";
  if (value.trim() === "--") return "tk-muted font-medium";
  if (deltaColumns.includes(columnIndex)) {
    if (value.startsWith("-")) return "tk-positive font-semibold";
    if (value.startsWith("+")) return "tk-negative font-semibold";
    return "tk-strong font-medium";
  }
  if (greenColumns.includes(columnIndex)) return "tk-positive font-semibold";
  if (redColumns.includes(columnIndex)) return "tk-negative font-semibold";
  if (emphasisColumns.includes(columnIndex)) return "tk-negative font-medium";
  return "tk-strong";
}

function StructuredTable({
  columns,
  rows,
  greenColumns = [],
  redColumns = [],
  deltaColumns = [],
  emphasisColumns = [],
  buttonColumn,
  compact = false,
  fitToWidth = false,
  columnWidths,
  flush = false,
  scrollY = false,
  onRowClick,
}: {
  columns: readonly string[];
  rows: readonly (readonly string[])[];
  greenColumns?: readonly number[];
  redColumns?: readonly number[];
  deltaColumns?: readonly number[];
  emphasisColumns?: readonly number[];
  buttonColumn?: number;
  compact?: boolean;
  fitToWidth?: boolean;
  columnWidths?: readonly string[];
  flush?: boolean;
  scrollY?: boolean;
  onRowClick?: (row: readonly string[], rowIndex: number) => void;
}) {
  return (
    <div
      className={`tk-table-shell h-full min-h-0 ${
        scrollY
          ? "overflow-y-auto overflow-x-hidden"
          : fitToWidth
            ? "overflow-hidden"
            : "overflow-auto"
      } ${flush ? "rounded-none border-0" : "border"}`}
    >
      <table
        className={`tk-table border-separate border-spacing-0 text-xs ${
          fitToWidth ? "w-full table-fixed" : "min-w-full whitespace-nowrap"
        }`}
      >
        {columnWidths ? (
          <colgroup>
            {columnWidths.map((width, index) => (
              <col key={`col-${index}`} style={{ width }} />
            ))}
          </colgroup>
        ) : null}
        <thead className="sticky top-0 z-10">
          <tr>
            {columns.map((column, index) => (
              <th
                key={`${column}-${index}`}
                className={`border-b text-mini font-medium tracking-[0] ${
                  index === 0 ? "text-left" : "text-right"
                } ${compact ? "px-2 py-1.5" : "px-3 py-2.5"} ${
                  fitToWidth
                    ? columnWidths
                      ? "whitespace-nowrap leading-tight"
                      : "whitespace-normal break-all leading-tight"
                    : ""
                }`}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={`${row[0]}-${rowIndex}`}
              onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
              className={`${onRowClick ? "cursor-pointer transition-colors hover:bg-[rgba(231,53,58,0.12)]" : ""}`}
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={`${row[0]}-${cellIndex}`}
                  className={`border-b ${compact ? "px-2 py-1.5" : "px-3 py-2.5"} ${
                    cellIndex === 0 ? "text-left" : "text-right"
                  } ${
                    fitToWidth && buttonColumn !== cellIndex
                      ? "overflow-hidden text-ellipsis whitespace-nowrap"
                      : ""
                  }`}
                >
                  {buttonColumn === cellIndex ? (
                    <button
                      className={`tk-button tk-button-primary font-medium ${
                        compact ? "px-1.5 py-0.5 text-micro" : "px-3 py-1 text-xs"
                      }`}
                      type="button"
                    >
                      {cell}
                    </button>
                  ) : (
                    <span
                      className={cellClassName(
                        cell,
                        cellIndex,
                        greenColumns,
                        redColumns,
                        deltaColumns,
                        emphasisColumns,
                      )}
                    >
                      {cell}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReservedModuleFrame() {
  return (
    <div className="tk-panel grid h-full min-h-0 place-items-center border border-dashed">
      <div className="text-center">
        <div className="text-base font-semibold text-slate-100">模块接入中</div>
        <div className="mt-2 text-sm text-slate-500">
          该功能入口已预留，后续会迁移对应模块。
        </div>
      </div>
    </div>
  );
}

export function XrepoFrame({
  embeddedPreview = false,
  onOpen,
  initialContract,
  tenorFilter = "all",
  onFlippedChange,
  frameMode = "panel",
  onOpenHistory,
}: {
  embeddedPreview?: boolean;
  onOpen?: (options?: FrameOpenOptions) => void;
  initialContract?: string;
  tenorFilter?: QuoteTenorFilter;
  onFlippedChange?: (flipped: boolean) => void;
  frameMode?: FrameRenderMode;
  onOpenHistory?: (contractName: string) => void;
}) {
  const [flippedContract, setFlippedContract] = useState<string | null>(
    initialContract ?? null,
  );

  useEffect(() => {
    onFlippedChange?.(flippedContract !== null);
  }, [flippedContract, onFlippedChange]);

  const rows = getXrepoRowsByTenor(tenorFilter);
  if (!rows.length) return <ReservedModuleFrame />;

  const openInlineHistory = (
    contractName = rows[0]?.[0] ?? (tenorFilter === "all" ? "R001" : tenorFilter),
  ) => {
    if (onOpenHistory) {
      onOpenHistory(contractName);
      return;
    }
    setFlippedContract(contractName);
  };

  return (
    <section
      className={
        frameMode === "page"
          ? "flex h-full min-h-0 flex-col overflow-hidden"
          : "tk-panel flex h-full min-h-0 flex-col overflow-hidden border"
      }
    >
      {embeddedPreview ? (
        <XrepoPreviewHeader
          onOpen={onOpen}
          tenorFilter={tenorFilter}
          actions={
            <button
              className="tk-button tk-button-success"
              type="button"
            >
              下载
            </button>
          }
        />
      ) : frameMode === "panel" ? (
        <div className="tk-panel-header border-b px-4 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="tk-title">XREPO</div>
              <div className="tk-muted mt-1 text-xs">
                匿名回购报价、发送与下载
              </div>
            </div>
            <button
              className="tk-button tk-button-success"
              type="button"
            >
              下载
            </button>
          </div>
        </div>
      ) : null}
      <div className="min-h-0 flex-1">
        <div className={`tk-flip-card h-full min-h-0 ${flippedContract ? "is-flipped" : ""}`}>
          <div className="tk-flip-card__inner h-full min-h-0">
            <div className="tk-flip-card__face h-full min-h-0">
              <StructuredTable
                columns={xrepoSummarySection.columns}
                rows={rows}
                greenColumns={xrepoSummarySection.greenColumns}
                redColumns={xrepoSummarySection.redColumns}
                emphasisColumns={xrepoSummarySection.emphasisColumns}
                buttonColumn={xrepoSummarySection.buttonColumn}
                fitToWidth
                columnWidths={xrepoSummarySection.columnWidths}
                compact={embeddedPreview}
                flush
                scrollY
                onRowClick={(row) => {
                  const contractName = row[0] ?? "R001";
                  if (embeddedPreview && onOpen) {
                    onOpen({ contract: contractName });
                    return;
                  }
                  openInlineHistory(contractName);
                }}
              />
            </div>
            <div className="tk-flip-card__face tk-flip-card__face--back h-full min-h-0">
              <XrepoHistoryBack
                contractName={
                  flippedContract ?? rows[0]?.[0] ?? (tenorFilter === "all" ? "R001" : tenorFilter)
                }
                compact={embeddedPreview}
                onBack={() => setFlippedContract(null)}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
