import { useState } from "react";
import { ChevronDown, ChevronUp, Pin } from "lucide-react";

import { QUOTE_TENOR_OPTIONS, type QuoteDetailRow, type QuoteTenorFilter, type RepoQuoteSection } from "../../types";
import { QuoteSortHeaderButton } from "./QuoteSortHeaderButton";
import { OpponentExpandPanel } from "./OpponentExpandPanel";
import {
  TAG_COLOR_MAP,
  applyLogicalQuoteAmounts,
  applyLogicalQuoteRanks,
  buildOpponentCards,
  buildOpponentChatQuote,
  buildPrimaryChatQuote,
  compareOptionalSortNumbers,
  contactNameForInstitution,
  displayAmountForRow,
  formatInstitutionSender,
  formatUnifiedReplyStatus,
  formatUnifiedUpdatedAt,
  fuzzyTextMatch,
  getInstitutionDisplayTags,
  getVisibleOpponentCards,
  matchBrokerFilter,
  matchCounterpartyTags,
  nextQuoteTableSortState,
  normalizeAccountRequirement,
  normalizeAmountFilterToYi,
  normalizeCollateralRequirement,
  normalizeUnifiedTenorValue,
  parseAmountTextToYi,
  pinnedQuoteFromRow,
  pinnedQuoteKey,
  selectLevel1RowsFromRows,
  shouldShowAccountRequirement,
  sortRowsByRank,
  tenorSortValue,
} from "./quoteBoard.utils";
import type {
  AmountFilterUnit,
  OpponentQuoteCard,
  PinnedQuote,
  QuoteOverride,
  QuoteTableSortDirection,
  QuoteTableSortField,
  QuoteTableSortState,
  UnifiedQuoteTableRow,
} from "./quoteBoard.types";
import { parseRatePercent } from "../big-bank";

const rankPriority: Record<string, number> = {
  最优: 0,
  次优: 1,
  报价: 2,
};

function RankBadge({ rank }: { rank: QuoteDetailRow["rank"] }) {
  const styles =
    rank === "最优"
      ? "tk-sheet-table__badge tk-sheet-table__badge--core"
      : rank === "次优"
        ? "tk-sheet-table__badge tk-sheet-table__badge--special"
        : "tk-sheet-table__badge";
  return (
    <span
      className={`inline-flex shrink-0 items-center px-1.5 py-0.5 text-micro font-medium ${styles}`}
    >
      {rank}
    </span>
  );
}

function TagBadges({ tags }: { tags: readonly string[] }) {
  if (!tags.length) return null;
  return (
    <span className="flex flex-wrap gap-0.5" title={tags.join("、")}>
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex shrink-0 items-center rounded-sm px-1 py-px text-[10px] font-medium leading-tight text-white"
          style={{ backgroundColor: TAG_COLOR_MAP[tag] ?? "#64748b" }}
        >
          {tag}
        </span>
      ))}
    </span>
  );
}

function PinnedRowBadge() {
  return (
    <span className="tk-sheet-table__badge tk-sheet-table__badge--pinned inline-flex shrink-0 items-center px-1.5 py-0.5 text-micro">
      固定
    </span>
  );
}

export function RepoQuoteSectionBoard({
  section,
  displayLevel,
  tenorFilter,
  amountMin,
  amountMax,
  amountUnit,
  institutionSearch,
  accountSearch,
  collateralSearch,
  collateralTab = "all",
  brokerFilter,
  counterpartyTags,
  applyOverride,
  pinnedQuotes,
  pinnedKeys,
  onEdit,
  onTogglePin,
  onSend,
}: {
  section: RepoQuoteSection;
  displayLevel: 1 | 2;
  tenorFilter: QuoteTenorFilter;
  amountMin: string;
  amountMax: string;
  amountUnit: AmountFilterUnit;
  institutionSearch: string;
  accountSearch: string;
  collateralSearch: string;
  collateralTab?: string;
  brokerFilter: string;
  counterpartyTags: readonly string[];
  applyOverride: (row: QuoteDetailRow) => QuoteDetailRow;
  pinnedQuotes: readonly PinnedQuote[];
  pinnedKeys: ReadonlySet<string>;
  onEdit: (row: QuoteDetailRow, groupName: string) => void;
  onTogglePin: (item: PinnedQuote) => void;
  onSend: (quote: ReturnType<typeof buildPrimaryChatQuote>, groupName: string) => void;
}) {
  const detailMode = displayLevel === 2;
  const directionRateAscending = section.id === "reverse";
  const defaultRateSortDirection: QuoteTableSortDirection = directionRateAscending ? "asc" : "desc";
  const [sortState, setSortState] = useState<QuoteTableSortState | null>(null);
  const minAmountValue = normalizeAmountFilterToYi(amountMin, amountUnit);
  const maxAmountValue = normalizeAmountFilterToYi(amountMax, amountUnit);
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);

  const toggleSort = (
    field: QuoteTableSortField,
    defaultDirection: QuoteTableSortDirection,
  ) => {
    setSortState((current) => nextQuoteTableSortState(current, field, defaultDirection));
  };

  const amountSortDirection = sortState?.field === "amount" ? sortState.direction : null;
  const rateSortDirection = sortState?.field === "rate" ? sortState.direction : null;

  const matchTenor = (rowTenor: string) => tenorFilter === "all" || rowTenor === tenorFilter;

  const amountFilterActive = (minAmountValue !== null && minAmountValue > 0) || maxAmountValue !== null;

  const matchAmount = (amountText: string | null | undefined) => {
    const amountValue = parseAmountTextToYi(amountText);
    if (amountValue === null) return !amountFilterActive;
    if (minAmountValue !== null && amountValue < minAmountValue) return false;
    if (maxAmountValue !== null && amountValue > maxAmountValue) return false;
    return true;
  };

  const matchRowFilters = (row: QuoteDetailRow) =>
    matchTenor(row.tenor) &&
    matchAmount(displayAmountForRow(row)) &&
    matchBrokerFilter(row.institution, brokerFilter) &&
    matchCounterpartyTags(row.institution, counterpartyTags) &&
    fuzzyTextMatch(
      formatInstitutionSender(
        row.institution,
        contactNameForInstitution(row.institution),
      ),
      institutionSearch,
    ) &&
    fuzzyTextMatch(`${normalizeAccountRequirement(row.accountType)} ${row.accountType}`, accountSearch) &&
    fuzzyTextMatch(`${normalizeCollateralRequirement(row.collateral)} ${row.collateral} ${row.reason}`, collateralSearch);

  const matchNonAmountFilters = (row: QuoteDetailRow) =>
    matchTenor(row.tenor) &&
    matchBrokerFilter(row.institution, brokerFilter) &&
    matchCounterpartyTags(row.institution, counterpartyTags) &&
    fuzzyTextMatch(
      formatInstitutionSender(
        row.institution,
        contactNameForInstitution(row.institution),
      ),
      institutionSearch,
    ) &&
    fuzzyTextMatch(`${normalizeAccountRequirement(row.accountType)} ${row.accountType}`, accountSearch) &&
    fuzzyTextMatch(`${normalizeCollateralRequirement(row.collateral)} ${row.collateral} ${row.reason}`, collateralSearch);

  const getLogicalRows = (group: RepoQuoteSection["groups"][number]) => {
    const logicalRows = applyLogicalQuoteAmounts(
      applyLogicalQuoteRanks(group.rows.map(applyOverride), section.id),
    );
    return displayLevel === 1
      ? selectLevel1RowsFromRows(group.name, logicalRows)
      : sortRowsByRank(logicalRows);
  };

  const filteredGroups = collateralTab === "all"
    ? section.groups
    : section.groups.filter((group) => group.name === collateralTab);

  const visibleGroups = filteredGroups
    .map((group) => ({ group, rows: getLogicalRows(group).filter(matchRowFilters) }))
    .filter(({ rows }) => rows.length > 0);

  const detailCandidates = detailMode
    ? filteredGroups.flatMap((group) =>
        getLogicalRows(group)
          .filter(matchNonAmountFilters)
          .map((row) => ({ row, groupName: group.name })),
      )
    : [];

  const pinnedSectionQuotes = pinnedQuotes
    .filter((item) => item.sectionId === section.id)
    .map((item) => ({ ...item, row: applyOverride(item.row) }))
    .filter((item) => matchRowFilters(item.row));

  const isPinnedDetailRow = (row: QuoteDetailRow, groupName: string) =>
    pinnedKeys.has(pinnedQuoteKey(section.id, groupName, row.institution, row.tenor));

  const visibleUnpinnedGroups = visibleGroups
    .map(({ group, rows }) => ({
      group,
      rows: rows.filter((row) => !isPinnedDetailRow(row, group.name)),
    }))
    .filter(({ rows }) => rows.length > 0);

  const openRowChat = (row: QuoteDetailRow, groupName: string) => {
    onSend(
      buildPrimaryChatQuote(row, {
        contactName: contactNameForInstitution(row.institution),
        amount: displayAmountForRow(row),
        account: shouldShowAccountRequirement(row.id)
          ? normalizeAccountRequirement(row.accountType)
          : "",
      }),
      groupName,
    );
  };

  const canExpandRows = !detailMode;

  const toggleExpandedRow = (row: QuoteDetailRow, groupName: string) => {
    if (!canExpandRows) return;
    const key = pinnedQuoteKey(section.id, groupName, row.institution, row.tenor);
    setExpandedRowKey((current) => (current === key ? null : key));
  };

  const buildUnifiedPrimaryRow = (
    row: QuoteDetailRow,
    groupName: string,
    primaryStatus: OpponentQuoteCard["status"] = "unreplied",
  ): UnifiedQuoteTableRow => {
    const mergedRow = applyOverride(row);
    const pinItem = pinnedQuoteFromRow(mergedRow, groupName, section);
    return {
      id: `${mergedRow.id}-primary`,
      kind: "primary",
      tags: [...getInstitutionDisplayTags(mergedRow.institution)],
      replyStatus: formatUnifiedReplyStatus(primaryStatus),
      institution: formatInstitutionSender(
        mergedRow.institution,
        contactNameForInstitution(mergedRow.institution),
      ),
      sender: "",
      tenor: normalizeUnifiedTenorValue(mergedRow.tenor),
      amount: displayAmountForRow(mergedRow) ?? "--",
      rate: mergedRow.rate,
      account: shouldShowAccountRequirement(mergedRow.id)
        ? normalizeAccountRequirement(mergedRow.accountType)
        : "",
      pledge: mergedRow.collateral,
      updatedAt: formatUnifiedUpdatedAt(mergedRow.updatedAt),
      groupName,
      chatQuote: buildPrimaryChatQuote(mergedRow, {
        contactName: contactNameForInstitution(mergedRow.institution),
        amount: displayAmountForRow(mergedRow),
        account: shouldShowAccountRequirement(mergedRow.id)
          ? normalizeAccountRequirement(mergedRow.accountType)
          : "",
      }),
      pinItem,
    };
  };

  const buildUnifiedSupplementRows = (
    row: QuoteDetailRow,
    groupName: string,
    cards?: readonly OpponentQuoteCard[],
  ): UnifiedQuoteTableRow[] => {
    const mergedRow = applyOverride(row);
    const pinItem = pinnedQuoteFromRow(mergedRow, groupName, section);
    return getVisibleOpponentCards(
      mergedRow,
      cards ?? buildOpponentCards(mergedRow, groupName),
    )
      .filter((card) =>
        fuzzyTextMatch(
          formatInstitutionSender(card.institution, card.name),
          institutionSearch,
        ),
      )
      .filter((card) => matchAmount(card.amount))
      .map((card) => ({
        id: `${card.id}-supplement`,
        kind: "supplement",
        tags: [
          ...(card.core ? ["核心"] : []),
          ...getInstitutionDisplayTags(card.institution),
        ],
        replyStatus: formatUnifiedReplyStatus(card.status),
        institution: formatInstitutionSender(card.institution, card.name),
        sender: "",
        tenor: normalizeUnifiedTenorValue(mergedRow.tenor),
        amount: card.amount ?? "--",
        rate: mergedRow.rate,
        account: card.account ?? "",
        pledge: card.pledge ?? "",
        updatedAt: formatUnifiedUpdatedAt(card.updatedAt),
        groupName,
        chatQuote: buildOpponentChatQuote(card),
        pinItem,
      }));
  };

  const compareQuoteTableRows = (
    a: Pick<UnifiedQuoteTableRow, "amount" | "rate">,
    b: Pick<UnifiedQuoteTableRow, "amount" | "rate">,
  ) => {
    if (!sortState) return 0;
    if (sortState.field === "amount") {
      return compareOptionalSortNumbers(
        parseAmountTextToYi(a.amount),
        parseAmountTextToYi(b.amount),
        sortState.direction,
      );
    }
    return compareOptionalSortNumbers(
      parseRatePercent(a.rate),
      parseRatePercent(b.rate),
      sortState.direction,
    );
  };

  const sortUnifiedRows = (rows: UnifiedQuoteTableRow[]) =>
    [...rows].sort((a, b) => {
      const sortDiff = compareQuoteTableRows(a, b);
      if (sortDiff !== 0) return sortDiff;

      const tenorDiff = tenorSortValue(a.tenor) - tenorSortValue(b.tenor);
      if (tenorDiff !== 0) return tenorDiff;

      const aRate = parseRatePercent(a.rate) ?? 0;
      const bRate = parseRatePercent(b.rate) ?? 0;
      if (aRate !== bRate) {
        return directionRateAscending ? aRate - bRate : bRate - aRate;
      }

      const aReplied = a.replyStatus === "已回复" ? 1 : 0;
      const bReplied = b.replyStatus === "已回复" ? 1 : 0;
      if (aReplied !== bReplied) return bReplied - aReplied;

      const aCore = a.tags.includes("核心") ? 1 : 0;
      const bCore = b.tags.includes("核心") ? 1 : 0;
      if (aCore !== bCore) return bCore - aCore;

      return a.institution.localeCompare(b.institution, "zh-CN");
    });

  const sortDetailRows = (rows: readonly QuoteDetailRow[]) =>
    [...rows].sort((a, b) => {
      const sortDiff = compareQuoteTableRows(
        { amount: displayAmountForRow(a) ?? "--", rate: a.rate },
        { amount: displayAmountForRow(b) ?? "--", rate: b.rate },
      );
      if (sortDiff !== 0) return sortDiff;

      if (detailMode) {
        const tenorDiff = tenorSortValue(a.tenor) - tenorSortValue(b.tenor);
        if (tenorDiff !== 0) return tenorDiff;

        const aRate = parseRatePercent(a.rate) ?? 0;
        const bRate = parseRatePercent(b.rate) ?? 0;
        if (aRate !== bRate) {
          return directionRateAscending ? aRate - bRate : bRate - aRate;
        }
      } else {
        const rankDiff = (rankPriority[a.rank] ?? 99) - (rankPriority[b.rank] ?? 99);
        if (rankDiff !== 0) return rankDiff;

        const tenorDiff = tenorSortValue(a.tenor) - tenorSortValue(b.tenor);
        if (tenorDiff !== 0) return tenorDiff;
      }

      return a.institution.localeCompare(b.institution, "zh-CN");
    });

  const unifiedRows = detailMode
    ? sortUnifiedRows(
        detailCandidates.flatMap(({ row, groupName }) => {
          const mergedRow = applyOverride(row);
          const cards = buildOpponentCards(mergedRow, groupName);
          const anchorCard = cards.find((card) => card.id === `${mergedRow.id}-anchor`);
          const supplementRows = buildUnifiedSupplementRows(row, groupName, cards);
          const result: UnifiedQuoteTableRow[] = [];
          if (matchAmount(displayAmountForRow(row))) {
            result.push(
              buildUnifiedPrimaryRow(
                row,
                groupName,
                anchorCard?.status ?? "unreplied",
              ),
            );
          }
          result.push(...supplementRows);
          return result;
        }),
      )
    : [];

  const visibleUnpinnedUnifiedRows = detailMode
    ? unifiedRows.filter((item) => !(item.kind === "primary" && pinnedKeys.has(item.pinItem.key)))
    : [];

  const visiblePinnedUnifiedRows = detailMode
    ? unifiedRows.filter((item) => item.kind === "primary" && pinnedKeys.has(item.pinItem.key))
    : [];

  const renderUnifiedTableRow = (item: UnifiedQuoteTableRow) => {
    const rowPinned = item.kind === "primary" && pinnedKeys.has(item.pinItem.key);
    return (
      <div
        key={item.id}
        className={`grid grid-cols-[0.9fr_1.35fr_0.6fr_0.7fr_0.7fr_0.75fr_0.75fr_0.75fr_0.85fr] items-center border-b border-[color:var(--tk-color-border-divider)] px-4 py-2 text-left text-[13px] text-slate-700 transition ${
          rowPinned
            ? "bg-[rgba(180,47,50,0.05)] hover:bg-[rgba(180,47,50,0.08)]"
            : "bg-white hover:bg-[#f5f5f5]"
        }`}
      >
        <span className="flex justify-center">
          <TagBadges tags={item.tags} />
        </span>
        <div className="flex min-w-0 items-center gap-2">
          {rowPinned ? <PinnedRowBadge /> : null}
          <span className="truncate font-semibold text-slate-700">{item.institution}</span>
        </div>
        <span className="text-right">{item.tenor}</span>
        <span className="text-right">{item.amount}</span>
        <span className="text-right font-semibold tk-warning">{item.rate}</span>
        <span className="truncate pl-3 text-right" title={item.account}>
          {item.account}
        </span>
        <span className="truncate pl-3 text-right" title={item.pledge}>
          {item.pledge}
        </span>
        <span className="text-right tabular-nums">{item.updatedAt}</span>
        <span className="flex items-center justify-end gap-1">
          <button
            className={`inline-flex h-6 w-6 items-center justify-center rounded border transition ${
              rowPinned
                ? "border-[color:var(--tk-color-brand-primary)] bg-[rgba(180,47,50,0.08)] text-[color:var(--tk-color-brand-primary)]"
                : "border-[color:var(--tk-color-border-panel)] bg-white text-slate-500 hover:border-[color:var(--tk-color-brand-primary)] hover:text-[color:var(--tk-color-brand-primary)]"
            }`}
            onClick={() => onTogglePin(item.pinItem)}
            title={rowPinned ? "取消固定" : "固定行情"}
            type="button"
          >
            <Pin size={12} fill={rowPinned ? "currentColor" : "none"} />
          </button>
          <button
            className="tk-inline-action whitespace-nowrap rounded-md"
            onClick={() => onSend(item.chatQuote, item.groupName)}
            type="button"
          >
            发送
          </button>
        </span>
      </div>
    );
  };

  const renderDetailRow = (
    row: QuoteDetailRow,
    groupName: string,
    dense: boolean,
    keyPrefix = "",
    options: {
      suppressPanels?: boolean;
      suppressGroupBadge?: boolean;
      forcePinned?: boolean;
    } = {},
  ) => {
    const { suppressPanels = false, suppressGroupBadge = false, forcePinned = false } = options;
    const rowPin = pinnedQuoteFromRow(row, groupName, section);
    const rowPinned = forcePinned || isPinnedDetailRow(row, groupName);
    const expanded = !suppressPanels && canExpandRows && expandedRowKey === rowPin.key;
    const cards = buildOpponentCards(row, groupName);
    const inlineVisibleCards = getVisibleOpponentCards(
      row,
      cards,
    ).filter((card) => matchAmount(card.amount));

    return (
      <div key={`${keyPrefix}${row.id}`} className="border-b border-[color:var(--tk-color-border-divider)] last:border-b-0">
        <div
          className={`grid w-full grid-cols-[1.4fr_0.55fr_0.7fr_0.75fr_0.9fr_0.85fr_0.85fr_1.05fr] items-center border-l-[3px] ${
            rowPinned || expanded
              ? "border-[color:var(--tk-color-brand-primary)] bg-[rgba(180,47,50,0.05)]"
              : "border-transparent bg-white"
          } ${dense ? "py-1.5" : "py-1.5"} pl-4 pr-4 text-left text-[13px] text-slate-700 transition ${
            rowPinned || expanded
              ? "hover:bg-[rgba(180,47,50,0.08)]"
              : "hover:bg-[#f5f5f5]"
          }`}
        >
          <div className="flex items-center gap-2">
            {!suppressPanels && canExpandRows ? (
              <button
                className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
                  expanded
                    ? "border-[color:var(--tk-color-brand-primary)] bg-[rgba(180,47,50,0.08)] text-[color:var(--tk-color-brand-primary)]"
                    : "border-[color:var(--tk-color-border-panel)] bg-white text-slate-500 hover:border-[color:var(--tk-color-brand-primary)] hover:text-[color:var(--tk-color-brand-primary)]"
                }`}
                onClick={() => toggleExpandedRow(row, groupName)}
                title={expanded ? "收起同期限明细" : "展开同期限明细"}
                type="button"
              >
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            ) : (
              <span className="inline-flex h-5 w-5 shrink-0" aria-hidden="true" />
            )}
            {!detailMode && !suppressGroupBadge ? (
              <span className="tk-badge shrink-0 rounded-full border px-1.5 py-0.5 text-micro text-cyan-200">
                {groupName}
              </span>
            ) : null}
            {!detailMode && (row.rank === "最优" || row.rank === "次优") ? <RankBadge rank={row.rank} /> : null}
            <span className="truncate font-semibold text-slate-700">
              {formatInstitutionSender(row.institution, contactNameForInstitution(row.institution))}
            </span>
          </div>
          <span className="text-right">{row.tenor}</span>
          <span className="text-right">{displayAmountForRow(row) ?? "--"}</span>
          <span className="text-right font-semibold tk-warning">{row.rate}</span>
          <span
            className="truncate pl-3 text-right"
            title={shouldShowAccountRequirement(row.id) ? normalizeAccountRequirement(row.accountType) : ""}
          >
            {shouldShowAccountRequirement(row.id) ? normalizeAccountRequirement(row.accountType) : ""}
          </span>
          <span
            className="truncate pl-3 text-right"
            title={`${row.collateral} / ${row.reason}`}
          >
            {row.collateral}
          </span>
          <span className="text-right tabular-nums">{row.updatedAt}</span>
          <span className="flex items-center justify-end gap-1">
            <button
              className="hidden whitespace-nowrap rounded-md border border-[color:var(--tk-color-border-panel)] bg-white px-1.5 py-0.5 text-micro font-medium text-slate-500"
              onClick={() => onEdit(row, groupName)}
              type="button"
            >
              修正
            </button>
            <button
              className={`inline-flex h-6 w-6 items-center justify-center rounded border transition ${
                rowPinned
                  ? "border-[color:var(--tk-color-brand-primary)] bg-[rgba(180,47,50,0.08)] text-[color:var(--tk-color-brand-primary)]"
                  : "border-[color:var(--tk-color-border-panel)] bg-white text-slate-500 hover:border-[color:var(--tk-color-brand-primary)] hover:text-[color:var(--tk-color-brand-primary)]"
              }`}
              onClick={() => onTogglePin(rowPin)}
              title={rowPinned ? "取消固定" : "固定行情"}
              type="button"
            >
              <Pin size={12} fill={rowPinned ? "currentColor" : "none"} />
            </button>
            <button
              className="tk-inline-action whitespace-nowrap rounded-md"
              onClick={() => openRowChat(row, groupName)}
              type="button"
            >
              发送
            </button>
          </span>
        </div>
        {!suppressPanels && expanded ? (
          <OpponentExpandPanel
            row={row}
            groupName={groupName}
            section={section}
            cards={cards}
            pinnedKeys={pinnedKeys}
            onTogglePin={onTogglePin}
            onSend={(quote) => onSend(quote, groupName)}
          />
        ) : null}
        {!suppressPanels && detailMode && inlineVisibleCards.length ? (
          <OpponentExpandPanel
            row={row}
            groupName={groupName}
            section={section}
            cards={cards}
            pinnedKeys={pinnedKeys}
            onTogglePin={onTogglePin}
            onSend={(quote) => onSend(quote, groupName)}
            showColumnHeader={false}
          />
        ) : null}
      </div>
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {detailMode ? (
          <div className="sticky top-0 z-10 grid grid-cols-[0.9fr_1.35fr_0.6fr_0.7fr_0.7fr_0.75fr_0.75fr_0.75fr_0.85fr] border-y border-[color:var(--tk-color-border-divider-dark)] bg-[#f5f5f5] px-4 py-1.5 text-mini font-medium tracking-[0.02em] text-slate-500 shadow-[0_1px_0_rgba(221,221,221,0.95)]">
            <span className="text-center">标签</span>
            <span>机构 / 发送人</span>
            <span className="text-right">期限</span>
            <span className="text-right">
              <QuoteSortHeaderButton
                label="金额"
                activeDirection={amountSortDirection}
                onToggle={() => toggleSort("amount", "desc")}
              />
            </span>
            <span className="text-right">
              <QuoteSortHeaderButton
                label="利率(报价)"
                activeDirection={rateSortDirection}
                onToggle={() => toggleSort("rate", defaultRateSortDirection)}
              />
            </span>
            <span className="text-right">账户要求</span>
            <span className="text-right">质押要求</span>
            <span className="text-right">报价时间</span>
            <span className="text-right">操作</span>
          </div>
        ) : (
          <div className="sticky top-0 z-10 grid grid-cols-[1.4fr_0.55fr_0.7fr_0.75fr_0.9fr_0.85fr_0.85fr_1.05fr] border-y border-[color:var(--tk-color-border-divider-dark)] bg-[#f5f5f5] px-4 py-1.5 text-mini font-medium tracking-[0.02em] text-slate-500 shadow-[0_1px_0_rgba(221,221,221,0.95)]">
            <span>分组 / 机构</span>
            <span className="text-right">期限</span>
            <span className="text-right">
              <QuoteSortHeaderButton
                label="金额"
                activeDirection={amountSortDirection}
                onToggle={() => toggleSort("amount", "desc")}
              />
            </span>
            <span className="text-right">
              <QuoteSortHeaderButton
                label="利率(报价)"
                activeDirection={rateSortDirection}
                onToggle={() => toggleSort("rate", defaultRateSortDirection)}
              />
            </span>
            <span className="text-right">账户要求</span>
            <span className="text-right">质押要求</span>
            <span className="text-right">获取时间</span>
            <span className="text-right">操作</span>
          </div>
        )}
        {pinnedSectionQuotes.length ? (
          <div className="border-b border-[color:var(--tk-color-border-divider)]">
            <div className="divide-y divide-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-page)]">
              {detailMode
                ? visiblePinnedUnifiedRows.map((item) => renderUnifiedTableRow(item))
                : pinnedSectionQuotes.map((item) =>
                    renderDetailRow(item.row, item.groupName, detailMode, `pinned-${item.key}-`, {
                      suppressPanels: true,
                      suppressGroupBadge: true,
                      forcePinned: true,
                    }),
                  )}
            </div>
          </div>
        ) : null}
        {detailMode ? (
          <div className="bg-[var(--tk-color-surface-page)]">
            {visibleUnpinnedUnifiedRows.map((item) => renderUnifiedTableRow(item))}
          </div>
        ) : (
          visibleUnpinnedGroups.map(({ group, rows }) => (
            <div key={group.id} className="border-b-2 border-[color:var(--tk-color-border-divider)]">
              <div className="divide-y divide-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-page)]">
                {sortDetailRows(rows).map((row) => renderDetailRow(row, group.name, false))}
              </div>
            </div>
          ))
        )}
        {!visibleGroups.length && !pinnedSectionQuotes.length ? (
          <div className="grid min-h-[160px] place-items-center border-b border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-page)] text-xs text-slate-500">
            暂无匹配报价
          </div>
        ) : null}
      </div>
    </div>
  );
}
