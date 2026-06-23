import { Pin } from "lucide-react";

import type { QuoteDetailRow, RepoQuoteSection } from "../../types";
import {
  buildOpponentChatQuote,
  formatInstitutionSender,
  formatUnifiedReplyStatus,
  getVisibleOpponentCards,
  opponentQuoteTimeText,
  pinnedQuoteFromRow,
  sortOpponentCardsForDisplay,
} from "./quoteBoard.utils";
import type { ExpandStatus, OpponentQuoteCard, PinnedQuote } from "./quoteBoard.types";

export function OpponentExpandPanel({
  row,
  groupName,
  section,
  cards,
  status,
  onStatusChange,
  pinnedKeys,
  onTogglePin,
  onSend,
  showColumnHeader = true,
}: {
  row: QuoteDetailRow;
  groupName: string;
  section: RepoQuoteSection;
  cards: readonly OpponentQuoteCard[];
  status: ExpandStatus;
  onStatusChange: (status: ExpandStatus) => void;
  pinnedKeys: ReadonlySet<string>;
  onTogglePin: (item: PinnedQuote) => void;
  onSend: (quote: ReturnType<typeof buildOpponentChatQuote>) => void;
  showColumnHeader?: boolean;
}) {
  const visibleCards = sortOpponentCardsForDisplay(
    getVisibleOpponentCards(row, cards, status),
    section.id === "reverse",
  );
  const parentPin = pinnedQuoteFromRow(row, groupName, section);
  const pinned = pinnedKeys.has(parentPin.key);
  const inlineMode = !showColumnHeader;

  return (
    <div className={showColumnHeader ? "border-b border-[color:var(--tk-color-border-divider)] bg-[rgba(18,19,27,0.98)] px-3 pb-3 pt-2" : "bg-[rgba(18,19,27,0.62)]"}>
      {showColumnHeader ? (
        <div className="grid grid-cols-[1.4fr_0.55fr_0.7fr_0.75fr_0.9fr_0.85fr_0.7fr_0.8fr_1.05fr] border-y border-[color:var(--tk-color-border-divider-dark)] bg-[rgba(255,255,255,0.03)] px-4 py-1.5 text-mini font-medium tracking-[0.02em] text-slate-400">
          <span>对手 / 机构</span>
          <span className="text-right">期限</span>
          <span className="text-right">金额</span>
          <span className="text-right">利率(报价)</span>
          <span className="text-right">账户要求</span>
          <span className="text-right">质押要求</span>
          <span className="text-right">回复状态</span>
          <span className="text-right">报价时间</span>
          <span className="text-right">操作</span>
        </div>
      ) : null}

      <div className={`${
        showColumnHeader
          ? "divide-y divide-[color:var(--tk-color-border-divider)] border-b border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-page)]"
          : inlineMode
            ? "bg-transparent"
            : "divide-y divide-[color:var(--tk-color-border-divider)] bg-[rgba(255,255,255,0.02)]"
      }`}>
        {visibleCards.map((card) => (
          <div
            key={card.id}
            className={`grid grid-cols-[1.4fr_0.55fr_0.7fr_0.75fr_0.9fr_0.85fr_0.7fr_0.8fr_1.05fr] items-center px-4 py-2 text-left text-xs text-slate-200 transition hover:bg-[rgba(255,255,255,0.03)] ${
              inlineMode ? "bg-transparent" : ""
            }`}
          >
            <div className="flex min-w-0 items-center gap-2">
              {card.core ? (
                <span className="inline-flex shrink-0 items-center rounded border border-emerald-500/40 bg-emerald-500/15 px-1.5 py-0.5 text-micro text-emerald-300">
                  核心
                </span>
              ) : null}
              {card.special ? (
                <span className="inline-flex shrink-0 items-center rounded border border-amber-500/40 bg-amber-500/15 px-1.5 py-0.5 text-micro text-amber-300">
                  特殊
                </span>
              ) : null}
              <div className="min-w-0 truncate text-slate-100">
                {formatInstitutionSender(card.institution, card.name)}
              </div>
            </div>
            <span className="text-right">{card.tenor}</span>
            <span className="text-right">{card.amount ?? "--"}</span>
            <span className="text-right font-semibold text-amber-300">{card.rate}</span>
            <span className="truncate pl-3 text-right text-xs text-slate-300" title={card.account ?? ""}>
              {card.account ?? ""}
            </span>
            <span className="truncate pl-3 text-right text-xs text-slate-300" title={card.pledge ?? ""}>
              {card.pledge ?? ""}
            </span>
            <span className="text-right text-xs text-slate-400">
              {formatUnifiedReplyStatus(card.status)}
            </span>
            <span className="text-right text-xs tabular-nums text-slate-400">
              {opponentQuoteTimeText(card)}
            </span>
            <span className="flex items-center justify-end gap-1">
              <button
                className={`inline-flex h-6 w-6 items-center justify-center rounded border transition ${
                  pinned
                    ? "border-amber-400/60 bg-amber-400/20 text-amber-200"
                    : "border-[color:var(--tk-color-border-panel)] bg-white/5 text-slate-500 hover:text-amber-200"
                }`}
                onClick={() => onTogglePin(parentPin)}
                title={pinned ? "取消固定主报价" : "固定主报价"}
                type="button"
              >
                <Pin size={12} fill={pinned ? "currentColor" : "none"} />
              </button>
              <button
                className="tk-inline-action whitespace-nowrap rounded-md border border-blue-500/30 bg-blue-500/20 text-blue-300"
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
