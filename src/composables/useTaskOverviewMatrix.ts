import type { AccountRow, Direction, Tenor } from '../data/mockData';

export type TaskOverviewFilterScope = 'cell' | 'termLine' | 'row' | 'column' | 'segment' | 'total' | 'all';

export interface TaskOverviewFilter {
  scope: TaskOverviewFilterScope;
  term?: Tenor;
  pledgeRequirement?: string;
  pledgeGroup?: string[];
  pledgeGroupLabel?: string;
  accountType?: string;
  /** 中栏 6 宫格新增：正/逆回购方向过滤 */
  direction?: Direction;
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

export interface TaskOverviewPledgeLine extends TaskOverviewAmount {
  pledgeRequirement: string;
  pledgeOption: TaskOverviewEnumOption;
  term?: Tenor;
  accountType?: string;
}

export interface TaskOverviewTermCell {
  accountType: string;
  term: Tenor;
  lines: TaskOverviewPledgeLine[];
  total: TaskOverviewAmount;
}

export interface TaskOverviewTermRow {
  id: string;
  term: Tenor;
  cells: Record<string, TaskOverviewTermCell>;
  pledgeTotals: TaskOverviewPledgeLine[];
  total: TaskOverviewAmount;
}

export interface TaskOverviewTermColumn {
  accountType: string;
  accountOption: TaskOverviewEnumOption;
  pledgeTotals: TaskOverviewPledgeLine[];
  total: TaskOverviewAmount;
}

export interface TaskOverviewTermMatrix {
  columns: TaskOverviewTermColumn[];
  rows: TaskOverviewTermRow[];
  pledgeTotals: TaskOverviewPledgeLine[];
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
export const termOverviewTerms: Tenor[] = ['R001', 'R007', 'R014'];
const termOverviewTermSet = new Set<Tenor>(termOverviewTerms);

export const compactOverviewTerms: Tenor[] = ['R001', 'R007'];
const compactOverviewTermSet = new Set<Tenor>(compactOverviewTerms);

export interface TaskCompactGroup {
  id: string;
  label: string;
  members: string[];
  color: string;
}

export const compactGroups: TaskCompactGroup[] = [
  { id: 'rates_local', label: '利率地方', members: ['利率债', '地方债'], color: '#1872f6' },
  { id: 'cd_fin',      label: '存单商金', members: ['国股存单', '同业存单', '金融债'], color: '#e9b842' },
  {
    id: 'credit',
    label: '信用',
    members: [
      '信用债', '短融', '中票', '超短融SCP', '企业债', '非公开定向融资工具PPN',
      '次级债', '永续债', '二级', '次永', '二永',
      '大行次级', '国股次级', '大行永续', '国股永续',
      '大行二级', '国股二级', '大行次永', '国股次永', '大行二永', '国股二永',
      '资产支持证券ABS', 'ABN', '可转债', '可交换债', '保险公司债', '铁道债'
    ],
    color: '#763df2'
  }
];

const compactGroupByMember = new Map<string, TaskCompactGroup>(
  compactGroups.flatMap((group) => group.members.map((name) => [name, group] as const))
);

export interface TaskCompactCell extends TaskOverviewAmount {
  groupId: string;
  groupLabel: string;
  term: Tenor;
  pledgeGroup: string[];
}

export interface TaskCompactRow {
  group: TaskCompactGroup;
  cells: Record<Tenor, TaskCompactCell>;
  total: TaskOverviewAmount;
}

export interface TaskCompactMatrix {
  terms: Tenor[];
  rows: TaskCompactRow[];
  termTotals: Record<Tenor, TaskOverviewAmount>;
  grandTotal: TaskOverviewAmount;
}

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
    ? [
        filter.scope,
        filter.term ?? '',
        filter.pledgeRequirement ?? '',
        (filter.pledgeGroup ?? []).join(','),
        filter.accountType ?? '',
        filter.direction ?? ''
      ].join('|')
    : '';

const roundAmount = (value: number) => Number(value.toFixed(2));
const emptyAmount = (): TaskOverviewAmount => ({ total: 0, allocated: 0, pending: 0 });

const addAmount = (target: TaskOverviewAmount, total: number, allocated: number) => {
  target.total = roundAmount(target.total + total);
  target.allocated = roundAmount(target.allocated + allocated);
  target.pending = Math.max(roundAmount(target.total - target.allocated), 0);
};

const sortOptions = (values: TaskOverviewEnumOption[]) =>
  [...values].sort((a, b) => a.code - b.code || a.name.localeCompare(b.name, 'zh-CN'));

const optionMapByName = (options: TaskOverviewEnumOption[]) =>
  new Map(options.map((option) => [option.name, option]));

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

const pledgeLineFromAmount = (
  pledgeOption: TaskOverviewEnumOption,
  amount: TaskOverviewAmount,
  term?: Tenor,
  accountType?: string
): TaskOverviewPledgeLine => ({
  pledgeRequirement: pledgeOption.name,
  pledgeOption,
  term,
  accountType,
  total: amount.total,
  allocated: amount.allocated,
  pending: amount.pending
});

const toTermLines = (
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

const toPledgeLines = (
  amountsByPledge: Map<string, TaskOverviewAmount>,
  pledgeOptionIndex: Map<string, TaskOverviewEnumOption>,
  term?: Tenor,
  accountType?: string
) =>
  sortOptions(
    Array.from(amountsByPledge.keys()).map((name) => pledgeOptionIndex.get(name) ?? fallbackOption(name, 99))
  )
    .map((option) => {
      const amount = amountsByPledge.get(option.name);
      return amount && amount.total > 0 ? pledgeLineFromAmount(option, amount, term, accountType) : null;
    })
    .filter((line): line is TaskOverviewPledgeLine => Boolean(line));

const ensureStringAmount = (map: Map<string, TaskOverviewAmount>, key: string) => {
  const current = map.get(key) ?? emptyAmount();
  map.set(key, current);
  return current;
};

const ensureTermAmount = (map: Map<Tenor, TaskOverviewAmount>, term: Tenor) => {
  const current = map.get(term) ?? emptyAmount();
  map.set(term, current);
  return current;
};

const ensureNestedTermAmount = (map: Map<string, Map<Tenor, TaskOverviewAmount>>, key: string, term: Tenor) => {
  const termMap = map.get(key) ?? new Map<Tenor, TaskOverviewAmount>();
  const amount = termMap.get(term) ?? emptyAmount();
  termMap.set(term, amount);
  map.set(key, termMap);
  return amount;
};

const ensureNestedStringAmount = (map: Map<string, Map<string, TaskOverviewAmount>>, key: string, subKey: string) => {
  const nestedMap = map.get(key) ?? new Map<string, TaskOverviewAmount>();
  const amount = nestedMap.get(subKey) ?? emptyAmount();
  nestedMap.set(subKey, amount);
  map.set(key, nestedMap);
  return amount;
};

const ensureTermPledgeAmount = (map: Map<Tenor, Map<string, TaskOverviewAmount>>, term: Tenor, pledgeRequirement: string) => {
  const pledgeMap = map.get(term) ?? new Map<string, TaskOverviewAmount>();
  const amount = pledgeMap.get(pledgeRequirement) ?? emptyAmount();
  pledgeMap.set(pledgeRequirement, amount);
  map.set(term, pledgeMap);
  return amount;
};

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

  for (const account of accounts) {
    const accountType = accountTypeOf(account);
    const pledgeRequirement = pledgeRequirementOf(account);
    const term = account.tenor;
    const total = roundAmount(account.targetAmount);
    const allocated = Math.min(roundAmount(account.allocatedAmount), total);
    const cellKey = `${pledgeRequirement}__${accountType}`;

    addAmount(ensureStringAmount(columnTotals, accountType), total, allocated);
    addAmount(ensureNestedTermAmount(columnTermTotals, accountType, term), total, allocated);
    addAmount(ensureStringAmount(rowTotals, pledgeRequirement), total, allocated);
    addAmount(ensureNestedTermAmount(rowTermTotals, pledgeRequirement, term), total, allocated);
    addAmount(ensureStringAmount(cellTotals, cellKey), total, allocated);
    addAmount(ensureNestedTermAmount(cellTermTotals, cellKey, term), total, allocated);
    addAmount(ensureTermAmount(matrixTermTotals, term), total, allocated);
    addAmount(grandTotal, total, allocated);
  }

  const columns = accountTypes.map<TaskOverviewColumn>((option) => ({
    accountType: option.name,
    accountOption: option,
    total: columnTotals.get(option.name) ?? emptyAmount(),
    termTotals: toTermLines(columnTermTotals.get(option.name) ?? new Map(), '', option.name)
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
            lines: toTermLines(cellTermTotals.get(key) ?? new Map(), option.name, column.accountType),
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
      termTotals: toTermLines(rowTermTotals.get(option.name) ?? new Map(), option.name),
      total: rowTotals.get(option.name) ?? emptyAmount()
    };
  });

  return {
    columns,
    rows,
    termTotals: toTermLines(matrixTermTotals, ''),
    grandTotal
  };
};

export const buildTaskTermOverviewMatrix = (accounts: AccountRow[]): TaskOverviewTermMatrix => {
  const accountOptionIndex = optionMapByName(accountTypeEnums);
  const pledgeOptionIndex = optionMapByName(pledgeRequirementEnums);
  const termAccounts = accounts.filter((account) => termOverviewTermSet.has(account.tenor));
  const accountTypes = sortOptions(
    Array.from(new Set(termAccounts.map(accountTypeOf))).map((name) => accountOptionIndex.get(name) ?? fallbackOption(name, 99))
  );

  const rowTotals = new Map<Tenor, TaskOverviewAmount>();
  const rowPledgeTotals = new Map<Tenor, Map<string, TaskOverviewAmount>>();
  const columnTotals = new Map<string, TaskOverviewAmount>();
  const columnPledgeTotals = new Map<string, Map<string, TaskOverviewAmount>>();
  const cellTotals = new Map<string, TaskOverviewAmount>();
  const cellPledgeTotals = new Map<string, Map<string, TaskOverviewAmount>>();
  const grandPledgeTotals = new Map<string, TaskOverviewAmount>();
  const grandTotal = emptyAmount();

  for (const account of termAccounts) {
    const accountType = accountTypeOf(account);
    const pledgeRequirement = pledgeRequirementOf(account);
    const term = account.tenor;
    const total = roundAmount(account.targetAmount);
    const allocated = Math.min(roundAmount(account.allocatedAmount), total);
    const cellKey = `${term}__${accountType}`;

    addAmount(ensureTermAmount(rowTotals, term), total, allocated);
    addAmount(ensureTermPledgeAmount(rowPledgeTotals, term, pledgeRequirement), total, allocated);
    addAmount(ensureStringAmount(columnTotals, accountType), total, allocated);
    addAmount(ensureNestedStringAmount(columnPledgeTotals, accountType, pledgeRequirement), total, allocated);
    addAmount(ensureStringAmount(cellTotals, cellKey), total, allocated);
    addAmount(ensureNestedStringAmount(cellPledgeTotals, cellKey, pledgeRequirement), total, allocated);
    addAmount(ensureStringAmount(grandPledgeTotals, pledgeRequirement), total, allocated);
    addAmount(grandTotal, total, allocated);
  }

  const columns = accountTypes.map<TaskOverviewTermColumn>((option) => ({
    accountType: option.name,
    accountOption: option,
    pledgeTotals: toPledgeLines(columnPledgeTotals.get(option.name) ?? new Map(), pledgeOptionIndex, undefined, option.name),
    total: columnTotals.get(option.name) ?? emptyAmount()
  }));

  const rows = termOverviewTerms.map<TaskOverviewTermRow>((term) => {
    const cells = Object.fromEntries(
      columns.map((column) => {
        const key = `${term}__${column.accountType}`;
        return [
          column.accountType,
          {
            accountType: column.accountType,
            term,
            lines: toPledgeLines(cellPledgeTotals.get(key) ?? new Map(), pledgeOptionIndex, term, column.accountType),
            total: cellTotals.get(key) ?? emptyAmount()
          }
        ];
      })
    ) as Record<string, TaskOverviewTermCell>;

    return {
      id: term,
      term,
      cells,
      pledgeTotals: toPledgeLines(rowPledgeTotals.get(term) ?? new Map(), pledgeOptionIndex, term),
      total: rowTotals.get(term) ?? emptyAmount()
    };
  });

  return {
    columns,
    rows,
    pledgeTotals: toPledgeLines(grandPledgeTotals, pledgeOptionIndex),
    grandTotal
  };
};

export const buildTaskCompactMatrix = (accounts: AccountRow[]): TaskCompactMatrix => {
  const rowTotals = new Map<string, TaskOverviewAmount>(
    compactGroups.map((group) => [group.id, emptyAmount()])
  );
  const cellAmounts = new Map<string, TaskOverviewAmount>();
  const termTotalsMap = new Map<Tenor, TaskOverviewAmount>(
    compactOverviewTerms.map((term) => [term, emptyAmount()])
  );
  const grandTotal = emptyAmount();

  for (const account of accounts) {
    if (!compactOverviewTermSet.has(account.tenor)) continue;
    const pledge = pledgeRequirementOf(account);
    const group = compactGroupByMember.get(pledge);
    if (!group) continue;

    const total = roundAmount(account.targetAmount);
    const allocated = Math.min(roundAmount(account.allocatedAmount), total);
    const cellKey = `${group.id}__${account.tenor}`;

    addAmount(rowTotals.get(group.id)!, total, allocated);
    addAmount(termTotalsMap.get(account.tenor)!, total, allocated);
    addAmount(ensureStringAmount(cellAmounts, cellKey), total, allocated);
    addAmount(grandTotal, total, allocated);
  }

  const rows = compactGroups.map<TaskCompactRow>((group) => {
    const cells = Object.fromEntries(
      compactOverviewTerms.map((term) => {
        const amount = cellAmounts.get(`${group.id}__${term}`) ?? emptyAmount();
        const cell: TaskCompactCell = {
          groupId: group.id,
          groupLabel: group.label,
          term,
          pledgeGroup: group.members,
          total: amount.total,
          allocated: amount.allocated,
          pending: amount.pending
        };
        return [term, cell];
      })
    ) as Record<Tenor, TaskCompactCell>;

    return {
      group,
      cells,
      total: rowTotals.get(group.id) ?? emptyAmount()
    };
  });

  const termTotals = Object.fromEntries(
    compactOverviewTerms.map((term) => [term, termTotalsMap.get(term) ?? emptyAmount()])
  ) as Record<Tenor, TaskOverviewAmount>;

  return {
    terms: compactOverviewTerms,
    rows,
    termTotals,
    grandTotal
  };
};

// ── 中栏「正回购需求 / 逆回购需求」面板专用矩阵 ───────────────────────
// 行 = 押券分组 (利率地方 / 存单商金 / 信用)
// 列 = 期限 (合计 / R001 / R007)
// 单元 = { total, allocated, pending }
export const demandPanelTerms: Tenor[] = ['R001', 'R007'];
const demandPanelTermSet = new Set<Tenor>(demandPanelTerms);

export interface DirectionDemandCell extends TaskOverviewAmount {
  groupId: string;
  groupLabel: string;
  pledgeGroup: string[];
  term: Tenor;
}

export interface DirectionDemandRow {
  group: TaskCompactGroup;
  total: TaskOverviewAmount;
  cells: Record<Tenor, DirectionDemandCell>;
}

export interface DirectionDemandMatrix {
  direction: Direction;
  terms: Tenor[];
  rows: DirectionDemandRow[];
  termTotals: Record<Tenor, TaskOverviewAmount>;
  grandTotal: TaskOverviewAmount;
}

export const buildDirectionDemandMatrix = (
  accounts: AccountRow[],
  direction: Direction
): DirectionDemandMatrix => {
  const filtered = accounts.filter(
    (account) => account.direction === direction && demandPanelTermSet.has(account.tenor)
  );

  const rowTotals = new Map<string, TaskOverviewAmount>(
    compactGroups.map((group) => [group.id, emptyAmount()])
  );
  const cellAmounts = new Map<string, TaskOverviewAmount>();
  const termTotalsMap = new Map<Tenor, TaskOverviewAmount>(
    demandPanelTerms.map((term) => [term, emptyAmount()])
  );
  const grandTotal = emptyAmount();

  for (const account of filtered) {
    const pledge = pledgeRequirementOf(account);
    const group = compactGroupByMember.get(pledge);
    if (!group) continue;

    const total = roundAmount(account.targetAmount);
    const allocated = Math.min(roundAmount(account.allocatedAmount), total);
    const cellKey = `${group.id}__${account.tenor}`;

    addAmount(rowTotals.get(group.id)!, total, allocated);
    addAmount(termTotalsMap.get(account.tenor)!, total, allocated);
    addAmount(ensureStringAmount(cellAmounts, cellKey), total, allocated);
    addAmount(grandTotal, total, allocated);
  }

  const rows = compactGroups.map<DirectionDemandRow>((group) => {
    const cells = Object.fromEntries(
      demandPanelTerms.map((term) => {
        const amount = cellAmounts.get(`${group.id}__${term}`) ?? emptyAmount();
        const cell: DirectionDemandCell = {
          groupId: group.id,
          groupLabel: group.label,
          pledgeGroup: group.members,
          term,
          total: amount.total,
          allocated: amount.allocated,
          pending: amount.pending
        };
        return [term, cell];
      })
    ) as Record<Tenor, DirectionDemandCell>;

    return {
      group,
      total: rowTotals.get(group.id) ?? emptyAmount(),
      cells
    };
  });

  const termTotals = Object.fromEntries(
    demandPanelTerms.map((term) => [term, termTotalsMap.get(term) ?? emptyAmount()])
  ) as Record<Tenor, TaskOverviewAmount>;

  return {
    direction,
    terms: demandPanelTerms,
    rows,
    termTotals,
    grandTotal
  };
};
