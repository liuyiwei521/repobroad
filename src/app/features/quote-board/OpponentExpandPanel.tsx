import { Pin } from "lucide-react";

import type { QuoteDetailRow, RepoQuoteSection } from "../../types";
import {
  buildOpponentChatQuote,
  formatInstitutionSender,
  getVisibleOpponentCards,
  opponentQuoteTimeText,
  pinnedQuoteFromRow,
  sortOpponentCardsForDisplay,
} from "./quoteBoard.utils";
import type { OpponentQuoteCard, PinnedQuote } from "./quoteBoard.types";

export function OpponentExpandPanel({
  row,
  groupName,
  section,
  cards,
  pinnedKeys,
  onTogglePin,
  onSend,
  showColumnHeader = true,
}: {
  row: QuoteDetailRow;
  groupName: string;
  section: RepoQuoteSection;
  cards: readonly OpponentQuoteCard[];
  pinnedKeys: ReadonlySet<string>;
  onTogglePin: (item: PinnedQuote) => void;
  onSend: (quote: ReturnType<typeof buildOpponentChatQuote>) => void;
  showColumnHeader?: boolean;
}) {
  const visibleCards = sortOpponentCardsForDisplay(
    getVisibleOpponentCards(row, cards),
    section.id === "reverse",
  );
  const parentPin = pinnedQuoteFromRow(row, groupName, section);
  const pinned = pinnedKeys.has(parentPin.key);
  const inlineMode = !showColumnHeader;

  return (
    <div className={showColumnHeader ? "border-b border-[color:var(--tk-color-border-divider)] bg-[#fcfcfc] px-3 pb-3 pt-2" : "bg-[#fcfcfc]"}>
      {showColumnHeader ? (
        <div className="grid grid-cols-[1.4fr_0.55fr_0.7fr_0.75fr_0.9fr_0.85fr_0.85fr_1.05fr] border-y border-[color:var(--tk-color-border-divider-dark)] bg-[#f5f5f5] px-4 py-1.5 text-mini font-medium tracking-[0.02em] text-slate-500">
          <span>对手 / 机构</span>
          <span className="text-right">期限</span>
          <span className="text-right">金额</span>
          <span className="text-right">利率(报价)</span>
          <span className="text-right">账户要求</span>
          <span className="text-right">质押要求</span>
          <span className="text-right">报价时间</span>
          <span className="text-right">操作</span>
        </div>
      ) : null}

      <div className={`${
        showColumnHeader
          ? "divide-y divide-[color:var(--tk-color-border-divider)] border-b border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-page)]"
          : inlineMode
            ? "bg-transparent"
            : "divide-y divide-[color:var(--tk-color-border-divider)] bg-[#fcfcfc]"
      }`}>
        {visibleCards.map((card) => (
          <div
            key={card.id}
            className={`grid grid-cols-[1.4fr_0.55fr_0.7fr_0.75fr_0.9fr_0.85fr_0.85fr_1.05fr] items-center bg-white px-4 py-2 text-left text-[13px] text-slate-700 transition hover:bg-[#f5f5f5] ${
              inlineMode ? "bg-transparent" : ""
            }`}
          >
            <div className="flex min-w-0 items-center gap-2">
              {card.core ? (
                <span className="tk-sheet-table__badge tk-sheet-table__badge--core inline-flex shrink-0 items-center px-1.5 py-0.5 text-micro">
                  核心
                </span>
              ) : null}
              {card.special ? (
                <span className="tk-sheet-table__badge tk-sheet-table__badge--special inline-flex shrink-0 items-center px-1.5 py-0.5 text-micro">
                  特殊
                </span>
              ) : null}
              <div className="min-w-0 truncate font-semibold text-slate-700">
                {formatInstitutionSender(card.institution, card.name)}
              </div>
            </div>
            <span className="text-right">{card.tenor}</span>
            <span className="text-right">{card.amount ?? "--"}</span>
            <span className="text-right font-semibold tk-warning">{card.rate}</span>
            <span className="truncate pl-3 text-right" title={card.account ?? ""}>
              {card.account ?? ""}
            </span>
            <span className="truncate pl-3 text-right" title={card.pledge ?? ""}>
              {card.pledge ?? ""}
            </span>
            <span className="text-right tabular-nums">
              {opponentQuoteTimeText(card)}
            </span>
            <span className="flex items-center justify-end gap-1">
              <button
                className={`inline-flex h-6 w-6 items-center justify-center rounded border transition ${
                  pinned
                    ? "border-[color:var(--tk-color-brand-primary)] bg-[rgba(180,47,50,0.08)] text-[color:var(--tk-color-brand-primary)]"
                    : "border-[color:var(--tk-color-border-panel)] bg-white text-slate-500 hover:border-[color:var(--tk-color-brand-primary)] hover:text-[color:var(--tk-color-brand-primary)]"
                }`}
                onClick={() => onTogglePin(parentPin)}
                title={pinned ? "取消固定主报价" : "固定主报价"}
                type="button"
              >
                <Pin size={12} fill={pinned ? "currentColor" : "none"} />
              </button>
              <button
                className="tk-inline-action whitespace-nowrap rounded-md"
                onClick={() => onSend(buildOpponentChatQuote(card))}
                type="button"
              >
                发送
              </button>
            </span>
          </div>
        ))}
        {!visibleCards.length ? (
          <div className="grid min-h-[72px] place-items-center text-xs text-slate-500">
            暂无明细数据
          </div>
        ) : null}
      </div>
    </div>
  );
}
