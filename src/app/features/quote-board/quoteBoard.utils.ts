import {
  QUOTE_TENOR_OPTIONS,
  type QuoteDetailRow,
  type QuoteGroup,
  type QuoteRank,
  type RepoQuoteSection,
} from "../../types";
import { parseRatePercent } from "../big-bank";
import { buildOpponentChatQuote, buildPrimaryChatQuote, type QuoteChatPayload } from "../chat";
import {
  ACCOUNT_TYPE_OPTIONS,
  DEFAULT_AMOUNT_UNIT,
  TAG_COLOR_MAP,
  institutionBrokerMap,
  institutionTagsMap,
  opponentInstitutions,
  quoteContactNames,
  repoQuoteSections,
} from "./quoteBoard.data";
import type {
  AmountFilterUnit,
  OpponentQuoteCard,
  PinnedQuote,
  QuoteOverride,
  QuoteTableSortDirection,
  QuoteTableSortField,
  QuoteTableSortState,
  RankPriorityMap,
  SupplementGroupName,
  UnifiedQuoteTableRow,
} from "./quoteBoard.types";

export { buildOpponentChatQuote, buildPrimaryChatQuote, DEFAULT_AMOUNT_UNIT, TAG_COLOR_MAP };
export type { AmountFilterUnit, OpponentQuoteCard, PinnedQuote, QuoteOverride, QuoteTableSortDirection, QuoteTableSortField, QuoteTableSortState, SupplementGroupName, UnifiedQuoteTableRow, QuoteChatPayload };

const BLANK_AMOUNT_IDS = (() => {
  const ids: string[] = [];
  for (const section of repoQuoteSections) {
    for (const group of section.groups) {
      for (const row of group.rows) ids.push(row.id);
    }
  }
  ids.sort();
  const blanks = new Set<string>();
  ids.forEach((id, index) => {
    if (index % 5 === 1 || index % 5 === 3) blanks.add(id);
  });
  return blanks;
})();

const supplementAccountOptions = [
  "自营",
  "公募",
  "可专户",
  "专户出老户",
  "非专户",
  "不限户",
] as const;

const supplementPledgeOptionsByGroup: Record<SupplementGroupName, readonly string[]> = {
  利率地方: ["利率", "地方"],
  存单商金: ["国股存单", "存单"],
  信用: [
    "二级",
    "次级",
    "永续",
    "次永",
    "二永",
    "不可二级",
    "不可次级",
    "不可永续",
    "不可次永",
    "不可二永",
    "AAA信用",
    "AA+信用",
    "信用",
    "PPN",
  ],
};

const supplementConfigByGroup: Record<
  SupplementGroupName,
  {
    targetCount: number;
    amountFillRate: number;
    accountFillRate: number;
    pledgeFillRate: number;
  }
> = {
  利率地方: {
    targetCount: 5,
    amountFillRate: 0.3,
    accountFillRate: 0.3,
    pledgeFillRate: 1,
  },
  存单商金: {
    targetCount: 12,
    amountFillRate: 0.6,
    accountFillRate: 0.3,
    pledgeFillRate: 1,
  },
  信用: {
    targetCount: 24,
    amountFillRate: 0.7,
    accountFillRate: 0.3,
    pledgeFillRate: 0.7,
  },
};

const level1TenorRulesByGroup: Record<string, readonly string[]> = {
  利率地方: ["R001", "R007"],
  存单商金: ["R001", "R007"],
  信用: ["R001", "R007", "R014"],
};

const rankPriority: RankPriorityMap = {
  最优: 0,
  次优: 1,
  报价: 2,
};

export function formatInstitutionSender(institution: string, sender: string) {
  return `${institution} / ${sender}`;
}

export function normalizeCollateralRequirement(collateral: string) {
  const normalized = collateral.trim();
  if (!normalized) return "";
  if (normalized.includes("利率") || normalized.includes("国债") || normalized.includes("地方")) {
    return "国债地方";
  }
  if (normalized.includes("存单") || normalized.includes("商金")) {
    return "存单商金";
  }
  if (
    normalized.includes("信用") ||
    normalized.includes("AAA") ||
    normalized.includes("AA+") ||
    normalized.includes("年金") ||
    normalized.includes("PPN")
  ) {
    return "信用";
  }
  return normalized;
}

export function parseOptionalFilterNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "不限") return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseAmountTextToYi(value: string | null | undefined) {
  if (!value || value === "--") return null;
  const normalized = value.replace(/,/g, "").trim();
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) return null;
  if (normalized.includes("万")) return parsed / 10000;
  return parsed;
}

export function normalizeAmountFilterToYi(value: string, unit: AmountFilterUnit = DEFAULT_AMOUNT_UNIT) {
  const parsed = parseOptionalFilterNumber(value);
  if (parsed === null) return null;
  return unit === "wan" ? parsed / 10000 : parsed;
}

export function showRowAmount(id: string): boolean {
  return !BLANK_AMOUNT_IDS.has(id);
}

export function displayAmountForRow(row: QuoteDetailRow) {
  return showRowAmount(row.id) ? row.amount : null;
}

export function formatUnifiedReplyStatus(status: OpponentQuoteCard["status"]) {
  return status === "replied" ? "已回复" : "未回复";
}

export function nextQuoteTableSortState(
  current: QuoteTableSortState | null,
  field: QuoteTableSortField,
  defaultDirection: QuoteTableSortDirection,
): QuoteTableSortState | null {
  if (!current || current.field !== field) {
    return { field, direction: defaultDirection };
  }
  if (current.direction === defaultDirection) {
    return {
      field,
      direction: defaultDirection === "asc" ? "desc" : "asc",
    };
  }
  return null;
}

export function compareOptionalSortNumbers(
  left: number | null,
  right: number | null,
  direction: QuoteTableSortDirection,
) {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return direction === "asc" ? left - right : right - left;
}

export function pinnedQuoteKey(
  sectionId: RepoQuoteSection["id"],
  groupName: string,
  institution: string,
  tenor: string,
) {
  return `${sectionId}:${groupName}:${institution}:${tenor}`;
}

export function pinnedQuoteFromRow(
  row: QuoteDetailRow,
  groupName: string,
  section: RepoQuoteSection,
): PinnedQuote {
  return {
    key: pinnedQuoteKey(section.id, groupName, row.institution, row.tenor),
    sectionId: section.id,
    groupName,
    row,
    institution: row.institution,
    tenor: row.tenor,
  };
}

export function contactNameForInstitution(institution: string) {
  return quoteContactNames[institution] ?? "周予安";
}

function hashSeed(text: string) {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) % 2147483647;
  }
  return hash;
}

function shiftQuoteTime(baseTime: string, offsetMinutes: number) {
  const [hourText = "10", minuteText = "53", secondText = "00"] = baseTime.split(":");
  const hour = Number.parseInt(hourText, 10);
  const minute = Number.parseInt(minuteText, 10);
  const second = Number.parseInt(secondText, 10);
  const safeHour = Number.isFinite(hour) ? hour : 10;
  const safeMinute = Number.isFinite(minute) ? minute : 53;
  const safeSecond = Number.isFinite(second) ? second : 0;
  const totalMinutes = safeHour * 60 + safeMinute - offsetMinutes;
  const normalizedMinutes = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const nextHour = Math.floor(normalizedMinutes / 60);
  const nextMinute = normalizedMinutes % 60;
  return `${String(nextHour).padStart(2, "0")}:${String(nextMinute).padStart(2, "0")}:${String(safeSecond).padStart(2, "0")}`;
}

export function classifyCollateralGroup(collateral?: string | null): SupplementGroupName {
  const normalized = String(collateral ?? "").trim();
  if (!normalized) return "信用";
  if (normalized.includes("存单") || normalized.includes("商金")) return "存单商金";
  if (
    normalized.includes("信用") ||
    normalized.includes("PPN") ||
    normalized.includes("二级") ||
    normalized.includes("次级") ||
    normalized.includes("永续") ||
    normalized.includes("次永") ||
    normalized.includes("二永") ||
    normalized.includes("AAA") ||
    normalized.includes("AA+")
  ) return "信用";
  return "利率地方";
}

export function normalizeSupplementGroup(groupName: string): SupplementGroupName {
  if (groupName === "信用") return "信用";
  if (groupName === "存单商金") return "存单商金";
  return "利率地方";
}

export function normalizeRepoQuoteSection(section: RepoQuoteSection): RepoQuoteSection {
  const groupOrder: SupplementGroupName[] = ["利率地方", "存单商金", "信用"];
  const groupMeta = new Map(section.groups.map((group) => [group.name, group] as const));
  const rowsByGroup = new Map<SupplementGroupName, QuoteDetailRow[]>(
    groupOrder.map((groupName) => [groupName, []]),
  );

  for (const group of section.groups) {
    for (const row of group.rows) {
      const nextGroup = classifyCollateralGroup(row.collateral);
      rowsByGroup.get(nextGroup)!.push(row);
    }
  }

  return {
    ...section,
    groups: groupOrder
      .map((groupName) => {
        const baseGroup = groupMeta.get(groupName);
        if (!baseGroup) return null;
        return {
          ...baseGroup,
          rows: rowsByGroup.get(groupName) ?? [],
          name: groupName,
        };
      })
      .filter(Boolean) as QuoteGroup[],
  };
}

function pickSeededValue<T>(options: readonly T[], seed: number, salt: number): T {
  return options[(seed + salt * 17) % options.length]!;
}

function shouldFillSeededField(seed: number, salt: number, fillRate: number) {
  const normalized = Math.max(0, Math.min(1, fillRate));
  return ((seed + salt * 131) % 1000) / 1000 < normalized;
}

export function buildOpponentCards(row: QuoteDetailRow, groupName: string): OpponentQuoteCard[] {
  const seed = hashSeed(`${row.id}-${groupName}`);
  const supplementGroup = normalizeSupplementGroup(groupName);
  const supplementConfig = supplementConfigByGroup[supplementGroup];
  const cards: OpponentQuoteCard[] = [];
  const targetCount = supplementConfig.targetCount;
  const amountPool = ["3亿", "5亿", "8亿", "10亿", "15亿", "20亿"] as const;
  const rateBase = Number.parseFloat(row.rate.replace("%", ""));
  const anchorAccount = normalizeAccountRequirement(row.accountType);
  const anchorPledge = row.collateral?.trim() ? row.collateral : null;
  const institutionPool = opponentInstitutions.filter((institution) => institution !== row.institution);
  const orderedInstitutions = institutionPool
    .map((institution, index) => ({
      institution,
      sortKey: (seed + index * 29) % 997,
    }))
    .sort((a, b) => a.sortKey - b.sortKey)
    .map((item) => item.institution);

  const anchorCard: OpponentQuoteCard = {
    id: `${row.id}-anchor`,
    name: contactNameForInstitution(row.institution),
    institution: row.institution,
    waitMinutes: 1,
    status: "unreplied",
    updatedAt: row.updatedAt,
    tenor: row.tenor,
    amount: row.amount && row.amount !== "--" ? row.amount : null,
    rate: row.rate,
    pledge: anchorPledge,
    account: anchorAccount,
    tags: [
      `${row.tenor} ${row.rate}`,
      "核心对手",
      anchorPledge,
      anchorAccount,
    ].filter(Boolean) as string[],
    core: true,
  };

  for (let index = 0; index < targetCount - 1; index += 1) {
    const core = index < 1 || (supplementGroup === "信用" && index % 8 === 0);
    const waitMinutes = 1 + ((seed + index * 3) % 19);
    const status: OpponentQuoteCard["status"] = index % 5 === 0 ? "replied" : "unreplied";
    const institution = orderedInstitutions[index % orderedInstitutions.length] ?? row.institution;
    const name = contactNameForInstitution(institution);
    const hasAmount = shouldFillSeededField(seed, index + 1, supplementConfig.amountFillRate);
    const hasAccount = shouldFillSeededField(seed, index + 101, supplementConfig.accountFillRate);
    const hasPledge = shouldFillSeededField(seed, index + 201, supplementConfig.pledgeFillRate);
    const account = hasAccount
      ? pickSeededValue(supplementAccountOptions, seed, index + 5)
      : null;
    const pledge = hasPledge
      ? pickSeededValue(supplementPledgeOptionsByGroup[supplementGroup], seed, index + 7)
      : null;
    const tags = [
      `${row.tenor} ${`${(rateBase + ((index % 4) - 1) * 0.01).toFixed(2)}%`}`,
      core ? "核心对手" : "活跃对手",
      pledge,
      account,
    ].filter(Boolean) as string[];

    cards.push({
      id: `${row.id}-opp-${index}`,
      name,
      institution,
      waitMinutes,
      status,
      updatedAt: shiftQuoteTime(row.updatedAt, waitMinutes),
      tenor: row.tenor,
      amount: hasAmount ? amountPool[(seed + index * 11) % amountPool.length] : null,
      rate: row.rate,
      pledge,
      account,
      tags,
      core,
    });
  }

  const specials =
    row.tenor === "R007"
      ? ([
          { tenor: "3D", amount: "5亿", rate: `${(rateBase + 0.01).toFixed(2)}%` },
          { tenor: "6D", amount: null, rate: `${(rateBase + 0.02).toFixed(2)}%` },
          { tenor: "2-7D", amount: "8亿", rate: `${(rateBase + 0.03).toFixed(2)}%` },
        ] as const).map((item, index) => {
          const hasAmount = shouldFillSeededField(seed, index + 301, supplementConfig.amountFillRate);
          const hasAccount = shouldFillSeededField(seed, index + 401, supplementConfig.accountFillRate);
          const hasPledge = shouldFillSeededField(seed, index + 501, supplementConfig.pledgeFillRate);
          const pledge = hasPledge
            ? pickSeededValue(supplementPledgeOptionsByGroup[supplementGroup], seed, index + 11)
            : null;
          const account = hasAccount
            ? pickSeededValue(supplementAccountOptions, seed, index + 13)
            : null;
          const institution =
            orderedInstitutions[(index + targetCount) % orderedInstitutions.length] ?? row.institution;

          return {
            id: `${row.id}-special-${index}`,
            name: contactNameForInstitution(institution),
            institution,
            waitMinutes: 2 + index * 2,
            status: "unreplied" as const,
            updatedAt: shiftQuoteTime(row.updatedAt, 2 + index * 2),
            tenor: row.tenor,
            amount: hasAmount ? item.amount : null,
            rate: row.rate,
            pledge,
            account,
            tags: [`${item.tenor} ${item.rate}`, "核心对手", "特殊期限", pledge, account].filter(Boolean) as string[],
            core: true,
            special: true,
          };
        })
      : [];

  const normalCards = cards.sort((a, b) => {
    const aScore = (a.core ? 100 : 0) + (a.amount ? 30 : 0) + (a.status === "unreplied" ? 10 : 0) - a.waitMinutes;
    const bScore = (b.core ? 100 : 0) + (b.amount ? 30 : 0) + (b.status === "unreplied" ? 10 : 0) - b.waitMinutes;
    return bScore - aScore;
  });

  return [anchorCard, ...normalCards, ...specials];
}

export function getVisibleOpponentCards(
  row: QuoteDetailRow,
  cards: readonly OpponentQuoteCard[],
  includeAnchor = false,
) {
  return includeAnchor
    ? [...cards]
    : cards.filter((card) => card.id !== `${row.id}-anchor`);
}

export function sortOpponentCardsForDisplay(
  cards: readonly OpponentQuoteCard[],
  rateAscending: boolean,
) {
  return [...cards].sort((a, b) => {
    const aRate = Number.parseFloat(a.rate.replace("%", ""));
    const bRate = Number.parseFloat(b.rate.replace("%", ""));
    if (aRate !== bRate) {
      return rateAscending ? aRate - bRate : bRate - aRate;
    }
    const aReplied = a.status === "replied" ? 1 : 0;
    const bReplied = b.status === "replied" ? 1 : 0;
    if (aReplied !== bReplied) return bReplied - aReplied;
    const aCore = a.core ? 1 : 0;
    const bCore = b.core ? 1 : 0;
    if (aCore !== bCore) return bCore - aCore;
    return b.updatedAt.localeCompare(a.updatedAt, "zh-CN");
  });
}

export function opponentQuoteTimeText(card: OpponentQuoteCard) {
  return card.updatedAt.slice(0, 5);
}

export function normalizeUnifiedTenorValue(tenor: string) {
  if (/^R\d{3}$/i.test(tenor)) return tenor.toUpperCase();
  if (/^\d+D$/i.test(tenor)) {
    const days = Number.parseInt(tenor, 10);
    return Number.isFinite(days) ? `R${String(days).padStart(3, "0")}` : tenor.toUpperCase();
  }
  const range = tenor.match(/^(\d+)-(\d+)D$/i);
  if (range) {
    const from = String(Number.parseInt(range[1] ?? "0", 10)).padStart(3, "0");
    const to = String(Number.parseInt(range[2] ?? "0", 10)).padStart(3, "0");
    return `R${from}-${to}`;
  }
  return tenor.toUpperCase();
}

export function tenorSortValue(tenor: string) {
  const normalized = normalizeUnifiedTenorValue(tenor);
  const range = normalized.match(/^R(\d{3})-(\d{3})$/);
  if (range) {
    return Number.parseInt(range[1] ?? "999", 10);
  }
  const single = normalized.match(/^R(\d{3})$/);
  if (single) {
    return Number.parseInt(single[1] ?? "999", 10);
  }
  return 999;
}

export function formatUnifiedUpdatedAt(value: string) {
  return value ? value.slice(0, 5) : "--";
}

export function fuzzyTextMatch(text: string, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;
  const normalizedText = text.toLowerCase();
  if (normalizedText.includes(normalizedQuery)) return true;

  let textIndex = 0;
  for (const char of normalizedQuery) {
    textIndex = normalizedText.indexOf(char, textIndex);
    if (textIndex === -1) return false;
    textIndex += 1;
  }
  return true;
}

export function matchBrokerFilter(institution: string, broker: string) {
  if (!broker) return true;
  return institutionBrokerMap[institution] === broker;
}

export function getInstitutionDisplayTags(institution: string): readonly string[] {
  return institutionTagsMap[institution] ?? [];
}

export function matchCounterpartyTags(institution: string, tags: readonly string[]) {
  if (tags.length === 0) return true;
  const institutionTags = institutionTagsMap[institution];
  if (!institutionTags) return false;
  return tags.some((tag) => institutionTags.includes(tag));
}

export function shouldShowAccountRequirement(rowId: string) {
  let hash = 0;
  for (let index = 0; index < rowId.length; index += 1) {
    hash = (hash * 31 + rowId.charCodeAt(index)) | 0;
  }
  return Math.abs(hash) % 5 === 0;
}

export function normalizeAccountRequirement(accountType: string) {
  if (accountType.includes("自营")) return "自营";
  if (accountType.includes("公募")) return "公募";
  if (accountType.includes("券商资管")) return "专户出老户";
  if (accountType.includes("理财子") || accountType.includes("保险资管")) return "可专户";
  if (accountType.includes("商金")) return "非专户";
  if (accountType.includes("股份行")) return "不限户";
  return "不限户";
}

export function sortRowsByRank(rows: readonly QuoteDetailRow[]): QuoteDetailRow[] {
  const tenorPriority = new Map(QUOTE_TENOR_OPTIONS.map((tenor, index) => [tenor, index]));
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const ta = tenorPriority.get(a.row.tenor as (typeof QUOTE_TENOR_OPTIONS)[number]) ?? 999;
      const tb = tenorPriority.get(b.row.tenor as (typeof QUOTE_TENOR_OPTIONS)[number]) ?? 999;
      if (ta !== tb) return ta - tb;
      const ra = rankPriority[a.row.rank] ?? 99;
      const rb = rankPriority[b.row.rank] ?? 99;
      if (ra !== rb) return ra - rb;
      return a.index - b.index;
    })
    .map(({ row }) => row);
}

function quoteRateValue(row: QuoteDetailRow) {
  return Number.parseFloat(row.rate.replace("%", ""));
}

function quoteAmountValue(row: QuoteDetailRow) {
  return Number.parseFloat(row.amount.replace("亿", ""));
}

function formatAmountValue(value: number) {
  const normalized = Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
  return `${normalized}亿`;
}

export function applyLogicalQuoteAmounts(rows: readonly QuoteDetailRow[]): QuoteDetailRow[] {
  const byTenor = new Map<string, QuoteDetailRow[]>();
  for (const row of rows) {
    const list = byTenor.get(row.tenor) ?? [];
    list.push(row);
    byTenor.set(row.tenor, list);
  }

  const adjusted = new Map<string, string>();
  for (const tenorRows of byTenor.values()) {
    const best = tenorRows.find((row) => row.rank === "最优");
    const second = tenorRows.find((row) => row.rank === "次优");
    if (!best || !second) continue;

    const bestAmount = quoteAmountValue(best);
    const secondAmount = quoteAmountValue(second);
    if (!Number.isFinite(bestAmount) || !Number.isFinite(secondAmount)) continue;
    if (bestAmount < secondAmount) continue;

    const nextBest = Math.max(0.5, Number((secondAmount - 0.5).toFixed(2)));
    const nextSecond = Number(Math.max(secondAmount, nextBest + 0.5).toFixed(2));
    adjusted.set(best.id, formatAmountValue(nextBest));
    adjusted.set(second.id, formatAmountValue(nextSecond));
  }

  return rows.map((row) =>
    adjusted.has(row.id) ? { ...row, amount: adjusted.get(row.id)! } : row,
  );
}

export function applyLogicalQuoteRanks(
  rows: readonly QuoteDetailRow[],
  sectionId: RepoQuoteSection["id"],
): QuoteDetailRow[] {
  const byTenor = new Map<string, QuoteDetailRow[]>();
  for (const row of rows) {
    const list = byTenor.get(row.tenor) ?? [];
    list.push(row);
    byTenor.set(row.tenor, list);
  }

  const rankedIds = new Map<string, QuoteRank>();
  for (const tenorRows of byTenor.values()) {
    const sorted = [...tenorRows].sort((a, b) => {
      const aRate = quoteRateValue(a);
      const bRate = quoteRateValue(b);
      if (aRate !== bRate) {
        return sectionId === "forward" ? aRate - bRate : bRate - aRate;
      }
      return a.updatedAt.localeCompare(b.updatedAt);
    });
    sorted.forEach((row, index) => {
      rankedIds.set(row.id, index === 0 ? "最优" : index === 1 ? "次优" : "报价");
    });
  }

  return rows.map((row) => {
    const nextRank = rankedIds.get(row.id) ?? "报价";
    if (row.rank === nextRank) return row;
    return {
      ...row,
      rank: nextRank,
      reason:
        nextRank === "最优"
          ? `这是 ${row.tenor} 最优`
          : nextRank === "次优"
            ? `${row.tenor} 次优`
            : `${row.tenor} 一般报价`,
    };
  });
}

export function selectLevel1RowsFromRows(
  groupName: string,
  rows: readonly QuoteDetailRow[],
): QuoteDetailRow[] {
  const rule = level1TenorRulesByGroup[groupName];
  const rankRows = rows.filter((row) => row.rank === "最优" || row.rank === "次优");
  if (!rule) return rankRows;
  const tenorIndex = new Map(rule.map((tenor, index) => [tenor, index]));
  return rankRows
    .filter((row) => tenorIndex.has(row.tenor))
    .sort((a, b) => {
      const ta = tenorIndex.get(a.tenor) ?? 999;
      const tb = tenorIndex.get(b.tenor) ?? 999;
      if (ta !== tb) return ta - tb;
      return a.rank === "最优" ? -1 : 1;
    });
}
