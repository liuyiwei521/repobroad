export type QuoteChatPayload = {
  id: string;
  institution: string;
  contactName: string;
  tenor: string;
  amount: string;
  rate: string;
  collateral: string;
  account: string;
  updatedAt: string;
};

export type QuoteChatContext = {
  quote: QuoteChatPayload;
  groupName: string;
  sectionTitle: string;
};
