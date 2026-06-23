import type { QuoteDetailRow, QuoteRank, RepoQuoteSection } from "../../types";
import type { QuoteChatPayload } from "../chat/chat.types";

export type AmountFilterUnit = "yi" | "wan";
export type SupplementGroupName = "利率地方" | "存单商金" | "信用";

export type QuoteOverride = Partial<
  Pick<
    QuoteDetailRow,
    | "institution"
    | "tenor"
    | "rank"
    | "amount"
    | "rate"
    | "accountType"
    | "collateral"
    | "minimum"
    | "updatedAt"
  >
> & { groupName?: string };

export type PinnedQuote = {
  key: string;
  sectionId: RepoQuoteSection["id"];
  groupName: string;
  row: QuoteDetailRow;
  institution: string;
  tenor: string;
};

export type OpponentQuoteCard = {
  id: string;
  name: string;
  institution: string;
  waitMinutes: number;
  status: "unreplied" | "replied";
  updatedAt: string;
  tenor: string;
  amount: string | null;
  rate: string;
  pledge: string | null;
  account: string | null;
  tags: readonly string[];
  core: boolean;
  special?: boolean;
};

export type UnifiedQuoteTableRow = {
  id: string;
  kind: "primary" | "supplement";
  coreLabel: string;
  replyStatus: string;
  institution: string;
  sender: string;
  tenor: string;
  amount: string;
  rate: string;
  account: string;
  pledge: string;
  updatedAt: string;
  groupName: string;
  chatQuote: QuoteChatPayload;
  pinItem: PinnedQuote;
};

export type QuoteTableSortField = "amount" | "rate";
export type QuoteTableSortDirection = "asc" | "desc";

export type QuoteTableSortState = {
  field: QuoteTableSortField;
  direction: QuoteTableSortDirection;
};

export type RankPriorityMap = Record<QuoteRank, number>;
