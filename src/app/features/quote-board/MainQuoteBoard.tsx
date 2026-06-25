import { useMemo, useState } from "react";

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
import { QuoteBoardAuxTable, type QuoteBoardAuxTab } from "./QuoteBoardAuxTable";
import { BrokerFilterButton, CounterpartyTagFilterButton, InstitutionSearchField, QuoteBoardFilterControls } from "./QuoteBoardFilterControls";
import { RepoQuoteSectionBoard } from "./RepoQuoteSectionBoard";
import type { PinnedQuote, QuoteOverride } from "./quoteBoard.types";
import { normalizeRepoQuoteSection } from "./quoteBoard.utils";

type QuoteBoardViewMode = "best" | "all" | "rateLocal" | "cd" | "credit";
type QuoteBoardContentTab = "repo" | QuoteBoardAuxTab;

const viewModeOptions: readonly {
  key: QuoteBoardViewMode;
  label: string;
  activeClass: string;
  inactiveClass: string;
}[] = [
  {
    key: "best",
    label: "最优",
    activeClass: "border-[#f7dfb8] bg-[#c77708] text-white shadow-[0_6px_14px_rgba(199,119,8,0.42),inset_0_1px_0_rgba(255,255,255,0.30)] ring-1 ring-white/35 -translate-y-px",
    inactiveClass: "border-transparent bg-[#ebc684] text-white hover:bg-[#dfb266]",
  },
  {
    key: "all",
    label: "全部",
    activeClass: "border-[#e7edf5] bg-[#6c7c92] text-white shadow-[0_6px_14px_rgba(86,104,130,0.32),inset_0_1px_0_rgba(255,255,255,0.26)] ring-1 ring-white/35 -translate-y-px",
    inactiveClass: "border-transparent bg-[#c9d3df] text-white hover:bg-[#b9c6d5]",
  },
  {
    key: "rateLocal",
    label: "国债地方",
    activeClass: "border-[#f0ccd0] bg-[#c45462] text-white shadow-[0_6px_14px_rgba(196,84,98,0.4),inset_0_1px_0_rgba(255,255,255,0.26)] ring-1 ring-white/35 -translate-y-px",
    inactiveClass: "border-transparent bg-[#e3a6ae] text-white hover:bg-[#d98c95]",
  },
  {
    key: "cd",
    label: "存单商金",
    activeClass: "border-[#d7e2f2] bg-[#537dbc] text-white shadow-[0_6px_14px_rgba(83,125,188,0.38),inset_0_1px_0_rgba(255,255,255,0.26)] ring-1 ring-white/35 -translate-y-px",
    inactiveClass: "border-transparent bg-[#aec3e0] text-white hover:bg-[#97b2d7]",
  },
  {
    key: "credit",
    label: "信用",
    activeClass: "border-[#e4d8f2] bg-[#8a5fc4] text-white shadow-[0_6px_14px_rgba(138,95,196,0.4),inset_0_1px_0_rgba(255,255,255,0.26)] ring-1 ring-white/35 -translate-y-px",
    inactiveClass: "border-transparent bg-[#c8b0e3] text-white hover:bg-[#b697d7]",
  },
] as const;

const auxTabOptions: readonly {
  key: QuoteBoardAuxTab;
  label: string;
  activeClass: string;
  inactiveClass: string;
}[] = [
  {
    key: "xrepo",
    label: "XREPO",
    activeClass: "border-[#f3d8c4] bg-[#cb6727] text-white shadow-[0_6px_14px_rgba(203,103,39,0.36),inset_0_1px_0_rgba(255,255,255,0.24)] ring-1 ring-white/35 -translate-y-px",
    inactiveClass: "border-transparent bg-[#e3b58d] text-white hover:bg-[#d79f70]",
  },
  {
    key: "ncd",
    label: "NCD",
    activeClass: "border-[#d8ddf1] bg-[#5969b0] text-white shadow-[0_6px_14px_rgba(89,105,176,0.36),inset_0_1px_0_rgba(255,255,255,0.24)] ring-1 ring-white/35 -translate-y-px",
    inactiveClass: "border-transparent bg-[#b7c2e2] text-white hover:bg-[#a1b0d8]",
  },
  {
    key: "exchange",
    label: "交易所",
    activeClass: "border-[#d9e9f6] bg-[#377fc8] text-white shadow-[0_6px_14px_rgba(55,127,200,0.36),inset_0_1px_0_rgba(255,255,255,0.24)] ring-1 ring-white/35 -translate-y-px",
    inactiveClass: "border-transparent bg-[#a7c9e8] text-white hover:bg-[#90bbdf]",
  },
] as const;

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
  const [institutionSearch, setInstitutionSearch] = useState("");
  const [accountSearch, setAccountSearch] = useState("");
  const [collateralSearch, setCollateralSearch] = useState("");
  const [brokerFilter, setBrokerFilter] = useState("");
  const [counterpartyTags, setCounterpartyTags] = useState<readonly string[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<RepoQuoteSection["id"]>(repoQuoteSections[0].id);
  const [viewMode, setViewMode] = useState<QuoteBoardViewMode>("best");
  const [contentTab, setContentTab] = useState<QuoteBoardContentTab>("repo");
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

  const displayLevel: 1 | 2 = viewMode === "best" ? 1 : 2;
  const collateralTab = useMemo(() => {
    if (viewMode === "rateLocal") return "利率地方";
    if (viewMode === "cd") return "存单商金";
    if (viewMode === "credit") return "信用";
    return "all";
  }, [viewMode]);

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
      <section className="tk-panel flex min-h-0 flex-1 flex-col overflow-hidden border border-[color:var(--tk-color-border-default)]">
        <div className="tk-panel-header border-b px-4 py-2">
          <div className="flex min-w-0 items-center justify-between gap-1.5">
            <div className="flex min-w-0 items-center gap-2 overflow-x-auto pr-1">
              <div className="flex shrink-0 items-center gap-1 border-r border-[color:var(--tk-color-border-divider-dark)] pr-2.5">
                {repoQuoteSections.map((section) => (
                  <button
                    key={section.id}
                    className={`inline-flex h-8 items-center justify-center rounded-md border px-3 text-[14px] transition-all duration-150 ${
                      contentTab === "repo" && activeSectionId === section.id
                        ? "border-[#df5349] bg-[#d94a41] font-semibold text-white shadow-[0_6px_14px_rgba(217,74,65,0.22),inset_0_1px_0_rgba(255,255,255,0.18)]"
                        : "border-[#e6b1aa] bg-white font-medium text-[#a48681] hover:border-[#dd5b52] hover:text-[#ca4a42]"
                    }`}
                    onClick={() => {
                      setActiveSectionId(section.id);
                      setContentTab("repo");
                    }}
                    type="button"
                  >
                    {section.title}
                  </button>
                ))}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {viewModeOptions.map((option) => {
                  const active = contentTab === "repo" && viewMode === option.key;
                  return (
                    <button
                      key={option.key}
                      className={`inline-flex h-7 items-center justify-center rounded-md border px-2.5 text-[13px] font-medium tracking-[0.01em] transition-all duration-150 ${
                        active ? option.activeClass : option.inactiveClass
                      }`}
                      onClick={() => {
                        setViewMode(option.key);
                        setContentTab("repo");
                      }}
                      type="button"
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex min-w-0 shrink-0 items-center gap-1.5">
              <div className="flex shrink-0 items-center gap-1.5 border-r border-[color:var(--tk-color-border-divider-dark)] pr-2">
                {auxTabOptions.map((option) => {
                  const active = contentTab === option.key;
                  return (
                    <button
                      key={option.key}
                      className={`inline-flex h-7 items-center justify-center rounded-md border px-2.5 text-[13px] font-medium tracking-[0.01em] transition-all duration-150 ${
                        active ? option.activeClass : option.inactiveClass
                      }`}
                      onClick={() => setContentTab(option.key)}
                      type="button"
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              <BrokerFilterButton
                value={brokerFilter}
                onChange={setBrokerFilter}
              />
              <CounterpartyTagFilterButton
                value={counterpartyTags}
                onChange={setCounterpartyTags}
              />
              <InstitutionSearchField
                value={institutionSearch}
                onChange={setInstitutionSearch}
                className="w-[156px]"
              />
              <button
                className="tk-button whitespace-nowrap text-mini"
                type="button"
              >
                下载
              </button>
            </div>
          </div>
          {contentTab === "repo" ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-[color:var(--tk-color-border-divider-dark)] pt-1.5">
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
                className="min-w-0 flex-1 justify-end border-l border-[color:var(--tk-color-border-divider-dark)] pl-2"
              />
            </div>
          ) : null}
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {contentTab === "repo"
            ? repoQuoteSections
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
                    institutionSearch={institutionSearch}
                    accountSearch={accountSearch}
                    collateralSearch={collateralSearch}
                    collateralTab={collateralTab}
                    brokerFilter={brokerFilter}
                    counterpartyTags={counterpartyTags}
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
                ))
            : <QuoteBoardAuxTable tab={contentTab} />}
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
