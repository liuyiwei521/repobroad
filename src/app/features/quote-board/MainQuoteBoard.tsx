import { useState } from "react";

import { QUOTE_TENOR_OPTIONS, type QuoteDetailRow, type QuoteTenorFilter, type RepoQuoteSection } from "../../types";
import { FilterLabel, miniChipClass } from "../../components/ui/FilterControls";
import { QuoteEditorModal as ShellQuoteEditorModal } from "../../components/dialogs/QuoteEditorModal";
import {
  QuoteChatDialog as ShellQuoteChatDialog,
  type QuoteChatContext,
} from "../chat";
import { quoteTenorDisplayLabel } from "../../dashboardUtils.js";
import {
  DEFAULT_AMOUNT_UNIT,
  repoQuoteSections,
  topBoardFilters,
} from "./quoteBoard.data";
import { QuoteBoardFilterControls } from "./QuoteBoardFilterControls";
import { RepoQuoteSectionBoard } from "./RepoQuoteSectionBoard";
import type { PinnedQuote, QuoteOverride } from "./quoteBoard.types";
import { normalizeRepoQuoteSection } from "./quoteBoard.utils";

export function MainQuoteBoard({
  tenorFilter,
  onTenorFilterChange,
}: {
  tenorFilter: QuoteTenorFilter;
  onTenorFilterChange: (tenor: QuoteTenorFilter) => void;
}) {
  const [amountMin, setAmountMin] = useState(topBoardFilters.amountMin);
  const [amountMax, setAmountMax] = useState("");
  const [amountUnit, setAmountUnit] = useState(DEFAULT_AMOUNT_UNIT);
  const [accountSearch, setAccountSearch] = useState("");
  const [collateralSearch, setCollateralSearch] = useState("");
  const [activeSectionId, setActiveSectionId] = useState<RepoQuoteSection["id"]>(repoQuoteSections[0].id);
  type CollateralFilter = "all" | "利率地方" | "存单商金" | "信用";
  type RankFilter = "best" | "all";
  type SupplementStatusFilter = "unreplied" | "replied" | "all";
  const [collateralFilter, setCollateralFilter] = useState<CollateralFilter>("all");
  const [rankFilter, setRankFilter] = useState<RankFilter>("all");
  const [supplementStatusFilter, setSupplementStatusFilter] = useState<SupplementStatusFilter>("all");
  const [overrides, setOverrides] = useState<Record<string, QuoteOverride>>({});
  const [editingRow, setEditingRow] = useState<QuoteDetailRow | null>(null);
  const [editingDraft, setEditingDraft] = useState<QuoteOverride>({});
  const [chatContext, setChatContext] = useState<QuoteChatContext | null>(null);
  const [pinnedQuotes, setPinnedQuotes] = useState<PinnedQuote[]>([]);
  const pinnedKeys = new Set(pinnedQuotes.map((item) => item.key));

  function applyOverride(row: QuoteDetailRow): QuoteDetailRow {
    const override = overrides[row.id];
    return override ? { ...row, ...override } : row;
  }

  function togglePinnedQuote(item: PinnedQuote) {
    setPinnedQuotes((current) => {
      if (current.some((quote) => quote.key === item.key)) {
        return current.filter((quote) => quote.key !== item.key);
      }
      return [item, ...current];
    });
  }

  function openEditor(row: QuoteDetailRow, groupName: string) {
    const merged = applyOverride(row);
    const previousGroup = overrides[row.id]?.groupName;
    setEditingRow(row);
    setEditingDraft({
      groupName: previousGroup ?? groupName,
      institution: merged.institution,
      tenor: merged.tenor,
      rank: merged.rank,
      amount: merged.amount,
      rate: merged.rate,
      accountType: merged.accountType,
      collateral: merged.collateral,
      minimum: merged.minimum,
    });
  }

  function saveEditor() {
    if (!editingRow) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    setOverrides((previous) => ({
      ...previous,
      [editingRow.id]: { ...editingDraft, updatedAt: time },
    }));
    setEditingRow(null);
  }

  const displayLevel: 1 | 2 = rankFilter === "best" ? 1 : 2;

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
      <section className="tk-panel flex min-h-0 flex-1 flex-col overflow-hidden border border-[rgba(255,255,255,0.1)]">
        <div className="tk-panel-header border-b px-4 py-2">
          <div className="flex flex-nowrap items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex items-center gap-0.5 border-r border-[color:var(--tk-color-border-divider-dark)] pr-3">
                {repoQuoteSections.map((section) => (
                  <button
                    key={section.id}
                    className={`tk-chip tk-segmented-tab whitespace-nowrap transition-colors ${activeSectionId === section.id ? "tk-chip-active" : "text-slate-400 hover:bg-[var(--tk-color-surface-selected)] hover:text-slate-200"}`}
                    onClick={() => setActiveSectionId(section.id)}
                    type="button"
                  >
                    {section.title}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-0.5 border-r border-[color:var(--tk-color-border-divider-dark)] pr-3">
                {([
                  { key: "all" as RankFilter, label: "全部" },
                  { key: "best" as RankFilter, label: "最优" },
                ]).map((tab) => (
                  <button
                    key={tab.key}
                    className={miniChipClass(rankFilter === tab.key)}
                    onClick={() => setRankFilter(tab.key)}
                    type="button"
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-0.5 border-r border-[color:var(--tk-color-border-divider-dark)] pr-3">
                {([
                  { key: "all" as CollateralFilter, label: "全部" },
                  { key: "利率地方" as CollateralFilter, label: "国债地方" },
                  { key: "存单商金" as CollateralFilter, label: "存单商金" },
                  { key: "信用" as CollateralFilter, label: "信用" },
                ]).map((tab) => (
                  <button
                    key={tab.key}
                    className={miniChipClass(collateralFilter === tab.key)}
                    onClick={() => setCollateralFilter(tab.key)}
                    type="button"
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                className="tk-button tk-button-success whitespace-nowrap text-mini"
                type="button"
              >
                下载
              </button>
            </div>
          </div>
          <div className="mt-1.5 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2 gap-y-1 border-t border-[color:var(--tk-color-border-divider-dark)] pt-1.5">
            <div className="tk-muted flex items-center gap-1 whitespace-nowrap text-xs">
              <FilterLabel>期限</FilterLabel>
              <div className="flex flex-nowrap items-center gap-0.5">
                <button
                  className={miniChipClass(tenorFilter === "all")}
                  onClick={() => onTenorFilterChange("all")}
                  type="button"
                >
                  全部
                </button>
                {QUOTE_TENOR_OPTIONS.map((tenor) => (
                  <button
                    key={tenor}
                    className={miniChipClass(tenorFilter === tenor)}
                    onClick={() => onTenorFilterChange(tenor)}
                    type="button"
                  >
                    {quoteTenorDisplayLabel(tenor)}
                  </button>
                ))}
              </div>
            </div>
            <QuoteBoardFilterControls
              amountMin={amountMin}
              amountMax={amountMax}
              amountUnit={amountUnit}
              accountSearch={accountSearch}
              collateralSearch={collateralSearch}
              onAmountMinChange={setAmountMin}
              onAmountMaxChange={setAmountMax}
              onAmountUnitChange={setAmountUnit}
              onAccountSearchChange={setAccountSearch}
              onCollateralSearchChange={setCollateralSearch}
              className="justify-end border-l border-[color:var(--tk-color-border-divider-dark)] pl-2"
            />
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {repoQuoteSections
            .filter((section) => section.id === activeSectionId)
            .map((section) => (
              <RepoQuoteSectionBoard
                key={section.id}
                section={normalizeRepoQuoteSection(section)}
                displayLevel={displayLevel}
                tenorFilter={tenorFilter}
                amountMin={amountMin}
                amountMax={amountMax}
                amountUnit={amountUnit}
                accountSearch={accountSearch}
                collateralSearch={collateralSearch}
                collateralTab={collateralFilter}
                supplementStatusFilter={supplementStatusFilter}
                applyOverride={applyOverride}
                pinnedQuotes={pinnedQuotes}
                pinnedKeys={pinnedKeys}
                onEdit={openEditor}
                onTogglePin={togglePinnedQuote}
                onSend={(quote, groupName) =>
                  setChatContext({
                    quote,
                    groupName,
                    sectionTitle: section.title,
                  })
                }
              />
            ))}
        </div>
      </section>
      <ShellQuoteEditorModal
        row={editingRow}
        draft={editingDraft}
        onChange={(field, value) => setEditingDraft((previous) => ({ ...previous, [field]: value }))}
        onClose={() => setEditingRow(null)}
        onSave={saveEditor}
      />
      <ShellQuoteChatDialog context={chatContext} onClose={() => setChatContext(null)} />
    </section>
  );
}
