import { useEffect, useState, type ReactNode } from "react";

import type {
  ExchangeMarketSplitSection,
  FrameOpenOptions,
  FrameRenderMode,
  QuoteTenorFilter,
} from "../../types";
import { ExchangeRepoSingleTrendChart } from "./ExchangeRepoSingleTrendChart";

type ExchangeRepoView = "core" | "sse" | "szse";

const exchangeRepoViewTabs: readonly { id: ExchangeRepoView; label: string }[] = [
  { id: "core", label: "核心" },
  { id: "sse", label: "上交所" },
  { id: "szse", label: "深交所" },
];

type ExchangeRepoFrameProps = {
  section?: ExchangeMarketSplitSection;
  embeddedPreview?: boolean;
  onOpen?: (options?: FrameOpenOptions) => void;
  initialContract?: string;
  tenorFilter?: QuoteTenorFilter;
  frameMode?: FrameRenderMode;
  renderEmbeddedHeader?: (actions: ReactNode) => ReactNode;
  renderHistoryChart?: (contractName: string) => ReactNode;
  fallback?: ReactNode;
};

type ExchangeRepoCardProps = {
  title: string;
  markets: ExchangeMarketSplitSection["markets"];
  embeddedPreview?: boolean;
  onOpen?: (options?: FrameOpenOptions) => void;
  onSelectContract?: (contractName: string) => void;
  selectedContract?: string;
  tenorFilter?: QuoteTenorFilter;
  renderEmbeddedHeader?: (actions: ReactNode) => ReactNode;
};

const exchangeRepoOneMonthMarketRows: Record<
  "sse" | "szse",
  readonly (readonly string[])[]
> = {
  sse: [
    ["1天", "GC001", "1.3700", "-1.00", "10:31"],
    ["7天", "GC007", "1.3750", "-1.00", "10:28"],
    ["14天", "GC014", "1.3920", "-0.50", "10:22"],
    ["21天", "GC021", "1.4180", "0.00", "10:15"],
    ["1M", "GC028", "1.4460", "0.50", "10:10"],
  ],
  szse: [
    ["1天", "R-001", "1.3900", "-1.50", "10:30"],
    ["7天", "R-007", "1.4000", "-0.50", "10:25"],
    ["14天", "R-014", "1.4230", "0.00", "10:20"],
    ["21天", "R-021", "1.4520", "0.50", "10:12"],
    ["1M", "R-028", "1.4850", "1.00", "10:08"],
  ],
};

export function ExchangeRepoFrame({
  section,
  embeddedPreview = false,
  onOpen,
  initialContract,
  tenorFilter = "all",
  frameMode = "panel",
  renderEmbeddedHeader,
  renderHistoryChart,
  fallback = null,
}: ExchangeRepoFrameProps) {
  if (!section) return <>{fallback}</>;

  const defaultContract =
    initialContract ?? exchangeRepoDefaultContract(section.markets);
  const [selectedContract, setSelectedContract] = useState(defaultContract);

  useEffect(() => {
    setSelectedContract(defaultContract);
  }, [defaultContract]);

  function handleSelectContract(contractName: string) {
    if (embeddedPreview && onOpen) {
      onOpen({ contract: contractName });
      return;
    }
    setSelectedContract(contractName);
  }

  if (frameMode === "page") {
    return (
      <div className="h-full min-h-0 overflow-hidden">
        <ExchangeRepoTrendPanel
          contractName={selectedContract}
          renderHistoryChart={renderHistoryChart}
        />
      </div>
    );
  }

  return (
    <ExchangeRepoCard
      title={section.title}
      markets={section.markets}
      embeddedPreview={embeddedPreview}
      onOpen={onOpen}
      onSelectContract={handleSelectContract}
      selectedContract={selectedContract}
      tenorFilter={tenorFilter}
      renderEmbeddedHeader={renderEmbeddedHeader}
    />
  );
}

export function ExchangeRepoCard({
  title,
  markets,
  embeddedPreview = false,
  onOpen,
  onSelectContract,
  selectedContract,
  tenorFilter = "all",
  renderEmbeddedHeader,
}: ExchangeRepoCardProps) {
  void onOpen;
  void tenorFilter;

  const [activeView, setActiveView] = useState<ExchangeRepoView>(() =>
    exchangeRepoDefaultView(selectedContract),
  );

  useEffect(() => {
    setActiveView(exchangeRepoDefaultView(selectedContract));
  }, [selectedContract]);

  const filteredMarkets =
    activeView === "core"
      ? markets
      : markets.filter((market) => market.id === activeView);
  const displayedMarkets = filteredMarkets.map((market) => ({
    ...market,
    rows: exchangeRepoOneMonthRows(market),
  }));

  const headerActions = (
    <ExchangeRepoHeaderActions
      activeView={activeView}
      onViewChange={setActiveView}
    />
  );

  return (
    <section
      className={
        embeddedPreview
          ? "flex h-full min-h-0 flex-col overflow-hidden"
          : "tk-panel flex h-full min-h-0 flex-col overflow-hidden border"
      }
    >
      {embeddedPreview ? (
        renderEmbeddedHeader ? (
          renderEmbeddedHeader(headerActions)
        ) : (
          <DefaultEmbeddedHeader
            actions={headerActions}
            title={title}
          />
        )
      ) : (
        <div className="tk-panel-header border-b px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="tk-title min-w-0 shrink truncate">
              {title}
            </div>
            <div className="min-w-0 flex-1">
              {headerActions}
            </div>
          </div>
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-hidden">
        {activeView === "core" ? (
          <ExchangeCoreCompactBoard
            markets={displayedMarkets}
            embeddedPreview={embeddedPreview}
            onSelectContract={onSelectContract}
            selectedContract={selectedContract}
          />
        ) : (
          <div className="grid h-full min-h-0 grid-cols-1">
            {displayedMarkets.map((market) => (
              <ExchangeMarketTable
                key={`${activeView}-${market.id}`}
                market={market}
                rows={market.rows}
                embeddedPreview={embeddedPreview}
                onSelectContract={onSelectContract}
                selectedContract={selectedContract}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function DefaultEmbeddedHeader({
  actions,
  title,
}: {
  actions: ReactNode;
  title: string;
}) {
  return (
    <div className="tk-panel-header border-b px-2.5 py-1.5">
      <div className="flex min-w-0 items-center gap-2">
        <div className="min-w-0 shrink rounded-md px-1 py-0.5">
          <span className="tk-title block truncate">
            {title}
          </span>
        </div>
        <div className="ml-auto min-w-0 flex-1">
          {actions}
        </div>
      </div>
    </div>
  );
}

function ExchangeRepoHeaderActions({
  activeView,
  onViewChange,
}: {
  activeView: ExchangeRepoView;
  onViewChange: (view: ExchangeRepoView) => void;
}) {
  return (
    <div className="grid min-w-0 grid-cols-4 gap-1">
      {exchangeRepoViewTabs.map((tab) => (
        <button
          key={tab.id}
          className={`${auxTabClass(tab.id === activeView)} min-w-0 w-full truncate`}
          onClick={() => onViewChange(tab.id)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
      <button
        className="tk-button inline-flex min-w-0 w-full items-center justify-center truncate px-2 text-mini"
        type="button"
      >
        下载
      </button>
    </div>
  );
}

function exchangeRepoOneMonthRows(
  market: ExchangeMarketSplitSection["markets"][number],
) {
  const marketRows =
    market.id === "sse" || market.id === "szse"
      ? exchangeRepoOneMonthMarketRows[market.id]
      : market.rows;
  return marketRows.slice(0, 5);
}

function exchangeRepoDefaultContract(
  markets: ExchangeMarketSplitSection["markets"],
) {
  return (
    markets.flatMap((market) => exchangeRepoOneMonthRows(market))[0]?.[1] ??
    "GC001"
  );
}

function exchangeRepoDefaultView(contractName?: string): ExchangeRepoView {
  if (!contractName) return "core";
  if (
    contractName === "GC001" ||
    contractName === "GC007" ||
    contractName === "R-001" ||
    contractName === "R-007"
  ) {
    return "core";
  }
  return contractName.startsWith("GC") ? "sse" : "szse";
}

function ExchangeCoreCompactBoard({
  markets,
  embeddedPreview = false,
  onSelectContract,
  selectedContract,
}: {
  markets: ExchangeMarketSplitSection["markets"];
  embeddedPreview?: boolean;
  onSelectContract?: (contractName: string) => void;
  selectedContract?: string;
}) {
  const coreRows = markets.flatMap((market) => market.rows.slice(0, 2));
  return (
    <div className={embeddedPreview ? "min-h-0" : "h-full min-h-0"}>
      <ExchangeCoreCompactBlock
        rows={coreRows}
        rowCount={4}
        embeddedPreview={embeddedPreview}
        onSelectContract={onSelectContract}
        selectedContract={selectedContract}
      />
    </div>
  );
}

function ExchangeCoreCompactBlock({
  rows,
  rowCount = 2,
  embeddedPreview = false,
  onSelectContract,
  selectedContract,
}: {
  rows: readonly (readonly string[])[];
  rowCount?: number;
  embeddedPreview?: boolean;
  onSelectContract?: (contractName: string) => void;
  selectedContract?: string;
}) {
  const paddedRows = Array.from(
    { length: rowCount },
    (_, i) => rows[i] ?? null,
  );
  return (
    <div
      className={`flex min-h-0 flex-col ${
        embeddedPreview ? "h-auto overflow-visible" : "h-full overflow-hidden"
      }`}
    >
      <table className="tk-sheet-table w-full table-fixed shrink-0">
        <thead>
          <tr>
            <th className="w-[15%] px-2 py-1.5 text-left font-medium">期限</th>
            <th className="w-[25%] px-2 py-1.5 text-left font-medium">品种</th>
            <th className="w-[22%] px-2 py-1.5 text-right font-medium">最新</th>
            <th className="w-[20%] px-2 py-1.5 text-right font-medium">涨跌bp</th>
            <th className="w-[18%] px-2 py-1.5 text-right font-medium">时间</th>
          </tr>
        </thead>
      </table>
      <div
        className={
          embeddedPreview ? "min-h-0 overflow-visible" : "min-h-0 flex-1 overflow-y-auto"
        }
      >
        <table className="tk-sheet-table w-full table-fixed">
          <tbody>
            {paddedRows.map((row, rowIndex) => (
              <tr
                key={row ? `${row[1]}-${rowIndex}` : `empty-${rowIndex}`}
                className={`${row && onSelectContract ? "cursor-pointer" : ""} ${
                  row && selectedContract === row[1] ? "tk-sheet-table__row--selected" : ""
                }`}
                onClick={
                  row && onSelectContract ? () => onSelectContract(row[1] ?? "GC001") : undefined
                }
              >
                {row ? (
                  <>
                    <td className="w-[15%] px-2 py-1.5 font-semibold text-slate-700">
                      {row[0]}
                    </td>
                    <td className="w-[25%] px-2 py-1.5 font-semibold text-slate-700">
                      {row[1]}
                    </td>
                    <td className="w-[22%] px-2 py-1.5 text-right font-semibold tk-negative">
                      {row[2]}
                    </td>
                    <td
                      className={`w-[20%] px-2 py-1.5 text-right ${cellClassName(row[3], 1, [], [], [1], [])}`}
                    >
                      {row[3]}
                    </td>
                    <td className="w-[18%] px-2 py-1.5 text-right text-slate-500">
                      {row[4] ?? "--"}
                    </td>
                  </>
                ) : (
                  <td colSpan={5} />
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExchangeMarketTable({
  market,
  rows,
  embeddedPreview = false,
  onSelectContract,
  selectedContract,
}: {
  market: ExchangeMarketSplitSection["markets"][number];
  rows?: readonly (readonly string[])[];
  embeddedPreview?: boolean;
  onSelectContract?: (contractName: string) => void;
  selectedContract?: string;
}) {
  const displayRows = rows ?? market.rows;

  return (
    <div
      className={`flex min-h-0 flex-col ${
        embeddedPreview ? "h-auto overflow-visible" : "h-full overflow-hidden"
      }`}
    >
      <table className="tk-sheet-table w-full table-fixed shrink-0">
        <thead>
          <tr>
            {market.columns.map((column, index) => (
              <th
                key={`${market.title}-${column}`}
                className={`px-2 py-1.5 font-medium ${
                  index === 0
                    ? "w-[15%] text-left"
                    : index === 1
                      ? "w-[25%] text-left"
                      : index === 2
                        ? "w-[22%] text-right"
                        : index === 3
                          ? "w-[20%] text-right"
                          : "w-[18%] text-right"
                }`}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
      </table>
      <div
        className={
          embeddedPreview ? "min-h-0 overflow-visible" : "min-h-0 flex-1 overflow-y-auto"
        }
      >
        <table className="tk-sheet-table w-full table-fixed">
          <tbody>
            {displayRows.map((row, rowIndex) => (
              <tr
                key={`${market.title}-${row[0]}-${rowIndex}`}
                className={`${onSelectContract ? "cursor-pointer" : ""} ${
                  selectedContract === row[1] ? "tk-sheet-table__row--selected" : ""
                }`}
                onClick={() => onSelectContract?.(row[1] ?? "GC001")}
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={`${market.title}-${row[0]}-${cellIndex}`}
                    className={`px-2 py-1.5 ${
                      cellIndex === 0
                        ? "w-[15%] text-left"
                        : cellIndex === 1
                          ? "w-[25%] text-left truncate"
                          : cellIndex === 2
                            ? "w-[22%] text-right"
                            : cellIndex === 3
                              ? "w-[20%] text-right"
                              : "w-[18%] text-right text-slate-500"
                    }`}
                    title={cell}
                  >
                    <span
                      className={cellClassName(
                        cell,
                        cellIndex,
                        market.greenColumns,
                        [],
                        market.deltaColumns,
                        [],
                      )}
                    >
                      {cell}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExchangeRepoTrendPanel({
  contractName,
  renderHistoryChart,
}: {
  contractName: string;
  renderHistoryChart?: (contractName: string) => ReactNode;
}) {
  return (
    <section className="tk-sheet-table__panel grid h-full min-h-0 grid-rows-[auto_1fr] overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[color:var(--tk-color-border-divider)] bg-[#f5f5f5] px-3 py-2">
        <div className="min-w-0">
          <div className="tk-matrix-card-title truncate">交易所回购折线图大图</div>
          <div className="mt-0.5 text-micro text-slate-500">
            点击左侧品种切换走势
          </div>
        </div>
        <div className="shrink-0 rounded border border-[color:var(--tk-color-border-panel)] bg-white px-2 py-1 text-xs font-semibold text-slate-700">
          {contractName}
        </div>
      </div>
      <div className="min-h-0 overflow-hidden p-2">
        {renderHistoryChart ? renderHistoryChart(contractName) : (
          <ExchangeRepoSingleTrendChart contractName={contractName} />
        )}
      </div>
    </section>
  );
}

function auxTabClass(active: boolean) {
  return active
    ? "tk-market-tab tk-market-tab--compact is-active"
    : "tk-market-tab tk-market-tab--compact";
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
  if (greenColumns.includes(columnIndex))
    return "tk-positive font-semibold";
  if (redColumns.includes(columnIndex)) return "tk-negative font-semibold";
  if (emphasisColumns.includes(columnIndex)) return "tk-negative font-medium";
  return "tk-strong";
}
