import type { AccountRow, Tenor } from '../data/mockData';

export type TaskOverviewTerm = Extract<Tenor, 'R001' | 'R007'>;
export type TaskOverviewFilterScope = 'cell' | 'row' | 'column' | 'segment' | 'all';

export interface TaskOverviewFilter {
  scope: TaskOverviewFilterScope;
  term?: TaskOverviewTerm;
  pledgeRequirement?: string;
  accountType?: string;
  label: string;
}

export interface TaskOverviewAmount {
  total: number;
  allocated: number;
  pending: number;
}

export interface TaskOverviewCell extends TaskOverviewAmount {
  term: TaskOverviewTerm;
  pledgeRequirement: string;
  accountType: string;
}

export interface TaskOverviewRow {
  id: string;
  term: TaskOverviewTerm;
  pledgeRequirement: string;
  cells: Record<string, TaskOverviewCell>;
  total: TaskOverviewCell;
}

export interface TaskOverviewSegment {
  term: TaskOverviewTerm;
  rows: TaskOverviewRow[];
  totals: Record<string, TaskOverviewCell>;
  grandTotal: TaskOverviewCell;
}

export interface TaskOverviewMatrix {
  accountTypes: string[];
  segments: TaskOverviewSegment[];
  totals: Record<string, TaskOverviewCell>;
  grandTotal: TaskOverviewCell;
}

export const overviewTerms: TaskOverviewTerm[] = ['R001', 'R007'];

const accountTypeOrder = ['自营', '公募', '理财', '专户', '年金'];
const pledgeOrder = ['利率债', '地方债', '同业存单', '信用债'];

export const accountTypeOf = (account: AccountRow) => account.accountType || account.product || '其他';
export const pledgeRequirementOf = (account: AccountRow) => account.pledgeRequirement || '其他';

export const overviewTermOf = (tenor: Tenor): TaskOverviewTerm | null =>
  tenor === 'R001' || tenor === 'R007' ? tenor : null;

export const taskOverviewFilterKey = (filter: TaskOverviewFilter | null | undefined) =>
  filter
    ? [filter.scope, filter.term ?? '', filter.pledgeRequirement ?? '', filter.accountType ?? ''].join('|')
    : '';

const roundAmount = (value: number) => Number(value.toFixed(2));

const emptyAmount = (
  term: TaskOverviewTerm,
  pledgeRequirement = '',
  accountType = ''
): TaskOverviewCell => ({
  term,
  pledgeRequirement,
  accountType,
  total: 0,
  allocated: 0,
  pending: 0
});

const addAmount = (target: TaskOverviewAmount, total: number, allocated: number) => {
  target.total = roundAmount(target.total + total);
  target.allocated = roundAmount(target.allocated + allocated);
  target.pending = Math.max(roundAmount(target.total - target.allocated), 0);
};

const sortByKnownOrder = (values: string[], order: string[]) =>
  [...values].sort((a, b) => {
    const indexA = order.indexOf(a);
    const indexB = order.indexOf(b);
    return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB) || a.localeCompare(b, 'zh-CN');
  });

export const buildTaskOverviewMatrix = (accounts: AccountRow[]): TaskOverviewMatrix => {
  const relevantAccounts = accounts.filter((account) => overviewTermOf(account.tenor));
  const accountTypes = sortByKnownOrder(Array.from(new Set(relevantAccounts.map(accountTypeOf))), accountTypeOrder);

  const segments = overviewTerms.map<TaskOverviewSegment>((term) => {
    const termAccounts = relevantAccounts.filter((account) => overviewTermOf(account.tenor) === term);
    const pledgeRequirements = sortByKnownOrder(Array.from(new Set(termAccounts.map(pledgeRequirementOf))), pledgeOrder);

    const totals = Object.fromEntries(
      accountTypes.map((accountType) => [accountType, emptyAmount(term, '', accountType)])
    ) as Record<string, TaskOverviewCell>;
    const grandTotal = emptyAmount(term);

    const rows = pledgeRequirements.map<TaskOverviewRow>((pledgeRequirement) => {
      const cells = Object.fromEntries(
        accountTypes.map((accountType) => [accountType, emptyAmount(term, pledgeRequirement, accountType)])
      ) as Record<string, TaskOverviewCell>;
      const rowTotal = emptyAmount(term, pledgeRequirement);

      for (const account of termAccounts) {
        if (pledgeRequirementOf(account) !== pledgeRequirement) continue;
        const accountType = accountTypeOf(account);
        const total = roundAmount(account.targetAmount);
        const allocated = Math.min(roundAmount(account.allocatedAmount), total);
        addAmount(cells[accountType], total, allocated);
        addAmount(rowTotal, total, allocated);
        addAmount(totals[accountType], total, allocated);
        addAmount(grandTotal, total, allocated);
      }

      return {
        id: `${term}-${pledgeRequirement}`,
        term,
        pledgeRequirement,
        cells,
        total: rowTotal
      };
    });

    return {
      term,
      rows,
      totals,
      grandTotal
    };
  });

  const totals = Object.fromEntries(
    accountTypes.map((accountType) => [accountType, emptyAmount('R001', '', accountType)])
  ) as Record<string, TaskOverviewCell>;
  const grandTotal = emptyAmount('R001');

  for (const segment of segments) {
    for (const accountType of accountTypes) {
      const cell = segment.totals[accountType];
      addAmount(totals[accountType], cell.total, cell.allocated);
    }
    addAmount(grandTotal, segment.grandTotal.total, segment.grandTotal.allocated);
  }

  return {
    accountTypes,
    segments,
    totals,
    grandTotal
  };
};
