import type { QuoteDetailRow } from "../../types";
import type { QuoteChatPayload } from "./chat.types";

type PrimaryQuoteChatSource = Pick<
  QuoteDetailRow,
  "id" | "institution" | "tenor" | "rate" | "collateral" | "updatedAt"
>;

type PrimaryQuoteChatOptions = {
  contactName: string;
  amount?: string | null;
  account?: string | null;
};

type OpponentQuoteChatSource = {
  id: string;
  institution: string;
  name: string;
  tenor: string;
  amount?: string | null;
  rate: string;
  pledge?: string | null;
  account?: string | null;
  updatedAt: string;
};

export function buildPrimaryChatQuote(
  row: PrimaryQuoteChatSource,
  options: PrimaryQuoteChatOptions,
): QuoteChatPayload {
  return {
    id: row.id,
    institution: row.institution,
    contactName: options.contactName,
    tenor: row.tenor,
    amount: options.amount ?? "--",
    rate: row.rate,
    collateral: row.collateral,
    account: options.account ?? "",
    updatedAt: row.updatedAt,
  };
}

export function buildOpponentChatQuote(card: OpponentQuoteChatSource): QuoteChatPayload {
  return {
    id: card.id,
    institution: card.institution,
    contactName: card.name,
    tenor: card.tenor,
    amount: card.amount ?? "--",
    rate: card.rate,
    collateral: card.pledge ?? "",
    account: card.account ?? "",
    updatedAt: card.updatedAt,
  };
}
