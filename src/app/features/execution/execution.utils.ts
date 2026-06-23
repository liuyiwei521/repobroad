import type {
  DemandAmount,
  DemandDirection,
  DemandGapRow,
  DemandMatrix,
  DemandRow,
  DemandTenor,
} from "./execution.types";

export const roundDemandValue = (value: number) => Number(value.toFixed(1));

const addDemand = (items: DemandAmount[]): DemandAmount => ({
  need: roundDemandValue(items.reduce((sum, item) => sum + item.need, 0)),
  done: roundDemandValue(items.reduce((sum, item) => sum + item.done, 0)),
});

export const buildDemandMatrix = (
  rows: DemandRow[],
  demandTenors: readonly DemandTenor[],
): DemandMatrix => {
  const rowTotals = Object.fromEntries(
    rows.map((row) => [
      row.label,
      addDemand(demandTenors.map((tenor) => row.cells[tenor])),
    ]),
  ) as Record<string, DemandAmount>;

  const columnTotals = Object.fromEntries(
    demandTenors.map((tenor) => [
      tenor,
      addDemand(rows.map((row) => row.cells[tenor])),
    ]),
  ) as Record<DemandTenor, DemandAmount>;

  return {
    rows,
    rowTotals,
    columnTotals,
    grandTotal: addDemand(demandTenors.map((tenor) => columnTotals[tenor])),
  };
};

export const demandGap = (amount: DemandAmount) =>
  Math.max(roundDemandValue(amount.need - amount.done), 0);

export const demandProgress = (amount: DemandAmount) =>
  amount.need > 0 ? Math.min(100, Math.round((amount.done / amount.need) * 100)) : 0;

export const formatDemandAmount = (value: number) => value.toFixed(1);

const demandPriority = (gap: number): DemandGapRow["priority"] => {
  if (gap >= 8) return "高";
  if (gap >= 3) return "中";
  return "低";
};

export const buildDemandGapRows = ({
  demandRowsByDirection,
  demandTenors,
  demandDirectionLabels,
  demandAccountsByDirection,
}: {
  demandRowsByDirection: Record<DemandDirection, DemandRow[]>;
  demandTenors: readonly DemandTenor[];
  demandDirectionLabels: Record<DemandDirection, string>;
  demandAccountsByDirection: Record<DemandDirection, Record<DemandTenor, readonly string[]>>;
}): DemandGapRow[] =>
  (["repo", "reverse"] as DemandDirection[])
    .flatMap((direction) =>
      demandRowsByDirection[direction].flatMap((row) =>
        demandTenors.map((tenor) => {
          const amount = row.cells[tenor];
          const gap = demandGap(amount);
          const rowIndex = demandRowsByDirection[direction].findIndex(
            (item) => item.label === row.label,
          );
          return {
            id: `${direction}-${row.label}-${tenor}`,
            direction,
            directionLabel: demandDirectionLabels[direction],
            account:
              demandAccountsByDirection[direction][tenor][Math.max(rowIndex, 0)] ??
              "综合账户",
            collateral: row.label,
            tenor,
            need: amount.need,
            done: amount.done,
            gap,
            progress: demandProgress(amount),
            priority: demandPriority(gap),
            suggestion:
              gap >= 8
                ? "优先匹配可接受押券与价格"
                : gap > 0
                  ? "观察尾盘补量机会"
                  : "缺口已覆盖",
          };
        }),
      ),
    )
    .filter((row) => row.gap > 0)
    .sort((a, b) => b.gap - a.gap);
