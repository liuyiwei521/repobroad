import type { AccountRow, Tenor } from '../data/mockData';

export type TaskOverviewFilterScope = 'cell' | 'termLine' | 'row' | 'column' | 'total' | 'all';

export interface TaskOverviewFilter {
  scope: TaskOverviewFilterScope;
  term?: Tenor;
  pledgeRequirement?: string;
  accountType?: string;
  label: string;
}

export interface TaskOverviewEnumOption {
  code: number;
  name: string;
  label: string;
  aliases: string[];
}

export interface TaskOverviewAmount {
  total: number;
  allocated: number;
  pending: number;
}

export interface TaskOverviewTermLine extends TaskOverviewAmount {
  term: Tenor;
  pledgeRequirement: string;
  accountType?: string;
}

export interface TaskOverviewCell {
  pledgeRequirement: string;
  accountType: string;
  lines: TaskOverviewTermLine[];
  total: TaskOverviewAmount;
}

export interface TaskOverviewRow {
  id: string;
  pledgeRequirement: string;
  pledgeOption: TaskOverviewEnumOption;
  cells: Record<string, TaskOverviewCell>;
  termTotals: TaskOverviewTermLine[];
  total: TaskOverviewAmount;
}

export interface TaskOverviewColumn {
  accountType: string;
  accountOption: TaskOverviewEnumOption;
  total: TaskOverviewAmount;
  termTotals: TaskOverviewTermLine[];
}

export interface TaskOverviewMatrix {
  columns: TaskOverviewColumn[];
  rows: TaskOverviewRow[];
  termTotals: TaskOverviewTermLine[];
  grandTotal: TaskOverviewAmount;
}

export const accountTypeEnums: TaskOverviewEnumOption[] = [
  { code: 1, name: '专户', label: '专户【1】', aliases: ['专户', '专户定制'] },
  { code: 2, name: '公募户', label: '公募户【2】', aliases: ['公募', '公募户', '基金'] },
  { code: 3, name: '自营户/证券户', label: '自营户/证券户【3】', aliases: ['自营', '自营户', '证券户'] },
  { code: 4, name: '资管户', label: '资管户【4】', aliases: ['资管', '资管户', '理财'] },
  { code: 5, name: '信托户', label: '信托户【5】', aliases: ['信托', '信托户'] },
  { code: 6, name: '私募户', label: '私募户【6】', aliases: ['私募', '私募户'] },
  { code: 7, name: '年金户', label: '年金户【7】', aliases: ['年金', '年金户'] },
  { code: 8, name: '社保户', label: '社保户【8】', aliases: ['社保', '社保户'] },
  { code: 9, name: '养老金户', label: '养老金户【9】', aliases: ['养老金', '养老金户'] },
  { code: 10, name: '组合户', label: '组合户【10】', aliases: ['组合', '组合户'] },
  { code: 11, name: '老户/旧户', label: '老户/旧户【11】', aliases: ['老户', '旧户'] }
];

export const pledgeRequirementEnums: TaskOverviewEnumOption[] = [
  { code: 1, name: '利率债', label: '利率债【1】', aliases: ['利率债', '利率', '国债'] },
  { code: 2, name: '地方债', label: '地方债【2】', aliases: ['地方债', '地方'] },
  { code: 3, name: '国股存单', label: '国股存单【3】', aliases: ['国股存单'] },
  { code: 4, name: '同业存单', label: '同业存单【4】', aliases: ['同业存单', '存单', '大行存单', '商金存单', 'CD'] },
  { code: 5, name: '信用债', label: '信用债【5】', aliases: ['信用债', '信用'] },
  { code: 6, name: '非公开定向融资工具PPN', label: '非公开定向融资工具PPN【6】', aliases: ['PPN', '非公开定向融资工具'] },
  { code: 7, name: '次级债', label: '次级债【7】', aliases: ['次级债', '次级'] },
  { code: 8, name: '永续债', label: '永续债【8】', aliases: ['永续债', '永续'] },
  { code: 9, name: '二级', label: '二级【9】', aliases: ['二级'] },
  { code: 10, name: '次永', label: '次永【10】', aliases: ['次永'] },
  { code: 11, name: '二永', label: '二永【11】', aliases: ['二永'] },
  { code: 12, name: '大行次级', label: '大行次级【12】', aliases: ['大行次级'] },
  { code: 13, name: '国股次级', label: '国股次级【13】', aliases: ['国股次级'] },
  { code: 14, name: '大行永续', label: '大行永续【14】', aliases: ['大行永续'] },
  { code: 15, name: '国股永续', label: '国股永续【15】', aliases: ['国股永续'] },
  { code: 16, name: '大行二级', label: '大行二级【16】', aliases: ['大行二级'] },
  { code: 17, name: '国股二级', label: '国股二级【17】', aliases: ['国股二级'] },
  { code: 18, name: '大行次永', label: '大行次永【18】', aliases: ['大行次永'] },
  { code: 19, name: '国股次永', label: '国股次永【19】', aliases: ['国股次永'] },
  { code: 20, name: '大行二永', label: '大行二永【20】', aliases: ['大行二永'] },
  { code: 21, name: '国股二永', label: '国股二永【21】', aliases: ['国股二永'] },
  { code: 22, name: '铁道债', label: '铁道债【22】', aliases: ['铁道债'] },
  { code: 23, name: '金融债', label: '金融债【23】', aliases: ['金融债'] },
  { code: 24, name: '资产支持证券ABS', label: '资产支持证券ABS【24】', aliases: ['资产支持证券', 'ABS'] },
  { code: 25, name: 'ABN', label: 'ABN【25】', aliases: ['ABN'] },
  { code: 26, name: '短融', label: '短融【26】', aliases: ['短融'] },
  { code: 27, name: '中票', label: '中票【27】', aliases: ['中票'] },
  { code: 28, name: '超短融SCP', label: '超短融SCP【28】', aliases: ['超短融', 'SCP'] },
  { code: 29, name: '可转债', label: '可转债【29】', aliases: ['可转债'] },
  { code: 30, name: '可交换债', label: '可交换债【30】', aliases: ['可交换债'] },
  { code: 31, name: '企业债', label: '企业债【31】', aliases: ['企业债'] },
  { code: 32, name: '保险公司债', label: '保险公司债【32】', aliases: ['保险公司债'] }
];

export const overviewTerms: Tenor[] = ['R001', 'R007', 'R014', 'R021', 'R028'];

const fallbackOption = (name: string, code: number): TaskOverviewEnumOption => ({
  code,
  name,
  label: `${name}【${code}】`,
  aliases: [name]
});

const normalize = (value: string | undefined | null) => String(value ?? '').trim().toLowerCase();

const findOption = (value: string | undefined, options: TaskOverviewEnumOption[], fallbackCode: number) => {
  const normalized = normalize(value);
  const option = options.find((item) => item.aliases.some((alias) => normalize(alias) === normalized) || normalize(item.name) === normalized);
  return option ?? fallbackOption(value?.trim() || '其他', fallbackCode);
};

export const accountTypeOptionOf = (account: AccountRow) =>
  findOption(account.accountType || account.product, accountTypeEnums, 99);

export const pledgeRequirementOptionOf = (account: AccountRow) =>
  findOption(account.pledgeRequirement || '其他', pledgeRequirementEnums, 99);

export const accountTypeOf = (account: AccountRow) => accountTypeOptionOf(account).name;
export const pledgeRequirementOf = (account: AccountRow) => pledgeRequirementOptionOf(account).name;

export const taskOverviewFilterKey = (filter: TaskOverviewFilter | null | undefined) =>
  filter
    ? [filter.scope, filter.term ?? '', filter.pledgeRequirement ?? '', filter.accountType ?? ''].join('|')
    : '';

const roundAmount = (value: number) => Number(value.toFixed(2));

const emptyAmount = (): TaskOverviewAmount => ({
  total: 0,
  allocated: 0,
  pending: 0
});

const addAmount = (target: TaskOverviewAmount, total: number, allocated: number) => {
  target.total = roundAmount(target.total + total);
  target.allocated = roundAmount(target.allocated + allocated);
  target.pending = Math.max(roundAmount(target.total - target.allocated), 0);
};

const lineFromAmount = (
  term: Tenor,
  pledgeRequirement: string,
  amount: TaskOverviewAmount,
  accountType?: string
): TaskOverviewTermLine => ({
  term,
  pledgeRequirement,
  accountType,
  total: amount.total,
  allocated: amount.allocated,
  pending: amount.pending
});

const sortOptions = (values: TaskOverviewEnumOption[]) =>
  [...values].sort((a, b) => a.code - b.code || a.name.localeCompare(b.name, 'zh-CN'));

const optionMapByName = (options: TaskOverviewEnumOption[]) =>
  new Map(options.map((option) => [option.name, option]));

const toLines = (
  amountsByTerm: Map<Tenor, TaskOverviewAmount>,
  pledgeRequirement: string,
  accountType?: string
) =>
  overviewTerms
    .map((term) => {
      const amount = amountsByTerm.get(term);
      return amount && amount.total > 0 ? lineFromAmount(term, pledgeRequirement, amount, accountType) : null;
    })
    .filter((line): line is TaskOverviewTermLine => Boolean(line));

export const buildTaskOverviewMatrix = (accounts: AccountRow[]): TaskOverviewMatrix => {
  const accountOptionIndex = optionMapByName(accountTypeEnums);
  const pledgeOptionIndex = optionMapByName(pledgeRequirementEnums);
  const accountTypes = sortOptions(
    Array.from(new Set(accounts.map(accountTypeOf))).map((name) => accountOptionIndex.get(name) ?? fallbackOption(name, 99))
  );
  const pledgeRequirements = sortOptions(
    Array.from(new Set(accounts.map(pledgeRequirementOf))).map((name) => pledgeOptionIndex.get(name) ?? fallbackOption(name, 99))
  );

  const columnTotals = new Map<string, TaskOverviewAmount>();
  const columnTermTotals = new Map<string, Map<Tenor, TaskOverviewAmount>>();
  const rowTotals = new Map<string, TaskOverviewAmount>();
  const rowTermTotals = new Map<string, Map<Tenor, TaskOverviewAmount>>();
  const cellTotals = new Map<string, TaskOverviewAmount>();
  const cellTermTotals = new Map<string, Map<Tenor, TaskOverviewAmount>>();
  const matrixTermTotals = new Map<Tenor, TaskOverviewAmount>();
  const grandTotal = emptyAmount();

  const ensureAmount = (map: Map<string, TaskOverviewAmount>, key: string) => {
    const current = map.get(key) ?? emptyAmount();
    map.set(key, current);
    return current;
  };

  const ensureTermAmount = (map: Map<string, Map<Tenor, TaskOverviewAmount>>, key: string, term: Tenor) => {
    const termMap = map.get(key) ?? new Map<Tenor, TaskOverviewAmount>();
    const amount = termMap.get(term) ?? emptyAmount();
    termMap.set(term, amount);
    map.set(key, termMap);
    return amount;
  };

  const ensureMatrixTermAmount = (term: Tenor) => {
    const amount = matrixTermTotals.get(term) ?? emptyAmount();
    matrixTermTotals.set(term, amount);
    return amount;
  };

  for (const account of accounts) {
    const accountType = accountTypeOf(account);
    const pledgeRequirement = pledgeRequirementOf(account);
    const term = account.tenor;
    const total = roundAmount(account.targetAmount);
    const allocated = Math.min(roundAmount(account.allocatedAmount), total);
    const cellKey = `${pledgeRequirement}__${accountType}`;

    addAmount(ensureAmount(columnTotals, accountType), total, allocated);
    addAmount(ensureTermAmount(columnTermTotals, accountType, term), total, allocated);
    addAmount(ensureAmount(rowTotals, pledgeRequirement), total, allocated);
    addAmount(ensureTermAmount(rowTermTotals, pledgeRequirement, term), total, allocated);
    addAmount(ensureAmount(cellTotals, cellKey), total, allocated);
    addAmount(ensureTermAmount(cellTermTotals, cellKey, term), total, allocated);
    addAmount(ensureMatrixTermAmount(term), total, allocated);
    addAmount(grandTotal, total, allocated);
  }

  const columns = accountTypes.map<TaskOverviewColumn>((option) => ({
    accountType: option.name,
    accountOption: option,
    total: columnTotals.get(option.name) ?? emptyAmount(),
    termTotals: toLines(columnTermTotals.get(option.name) ?? new Map(), '', option.name)
  }));

  const rows = pledgeRequirements.map<TaskOverviewRow>((option) => {
    const cells = Object.fromEntries(
      columns.map((column) => {
        const key = `${option.name}__${column.accountType}`;
        return [
          column.accountType,
          {
            pledgeRequirement: option.name,
            accountType: column.accountType,
            lines: toLines(cellTermTotals.get(key) ?? new Map(), option.name, column.accountType),
            total: cellTotals.get(key) ?? emptyAmount()
          }
        ];
      })
    ) as Record<string, TaskOverviewCell>;

    return {
      id: option.name,
      pledgeRequirement: option.name,
      pledgeOption: option,
      cells,
      termTotals: toLines(rowTermTotals.get(option.name) ?? new Map(), option.name),
      total: rowTotals.get(option.name) ?? emptyAmount()
    };
  });

  return {
    columns,
    rows,
    termTotals: toLines(matrixTermTotals, ''),
    grandTotal
  };
};
