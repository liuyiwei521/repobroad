type StructuredTableProps = {
  columns: readonly string[];
  rows: readonly (readonly string[])[];
  greenColumns?: readonly number[];
  redColumns?: readonly number[];
  deltaColumns?: readonly number[];
  emphasisColumns?: readonly number[];
  buttonColumn?: number;
  fitToWidth?: boolean;
  columnWidths?: readonly string[];
  compact?: boolean;
  flush?: boolean;
  nowrapHeader?: boolean;
  adaptiveHeight?: boolean;
  scrollY?: boolean;
  onRowClick?: (row: readonly string[], rowIndex: number) => void;
};

function cellClassName(
  value: string,
  columnIndex: number,
  greenColumns: readonly number[],
  redColumns: readonly number[],
  deltaColumns: readonly number[],
  emphasisColumns: readonly number[],
) {
  if (columnIndex === 0) return "tk-strong font-semibold";
  if (value.trim() === "--") return "tk-muted font-medium";
  if (deltaColumns.includes(columnIndex)) {
    if (value.startsWith("-")) return "tk-positive font-semibold";
    if (value.startsWith("+")) return "tk-negative font-semibold";
    return "tk-strong font-medium";
  }
  if (greenColumns.includes(columnIndex)) return "tk-positive font-semibold";
  if (redColumns.includes(columnIndex)) return "tk-negative font-semibold";
  if (emphasisColumns.includes(columnIndex)) return "tk-negative font-medium";
  return "tk-strong";
}

export function StructuredTable({
  columns,
  rows,
  greenColumns = [],
  redColumns = [],
  deltaColumns = [],
  emphasisColumns = [],
  buttonColumn,
  fitToWidth = false,
  columnWidths,
  compact = false,
  flush = false,
  nowrapHeader = false,
  adaptiveHeight = false,
  scrollY = false,
  onRowClick,
}: StructuredTableProps) {
  return (
    <div
      className={`tk-table-shell ${adaptiveHeight ? "" : "h-full min-h-0"} ${
        scrollY
          ? "overflow-y-auto overflow-x-hidden"
          : fitToWidth || adaptiveHeight
            ? "overflow-hidden"
            : "overflow-auto"
      } ${flush ? "rounded-none border-0" : "border"}`}
    >
      <table
        className={`tk-table border-separate border-spacing-0 text-xs ${
          fitToWidth
            ? "w-full table-fixed"
            : "min-w-full whitespace-nowrap"
        }`}
      >
        {columnWidths ? (
          <colgroup>
            {columnWidths.map((width, index) => (
              <col key={`col-${index}`} style={{ width }} />
            ))}
          </colgroup>
        ) : null}
        <thead className="sticky top-0 z-10">
          <tr>
            {columns.map((column, index) => (
              <th
                key={`${column}-${index}`}
                className={`border-b px-3 py-2 text-mini font-medium tracking-[0] ${
                  index === 0 ? "text-left" : "text-right"
                } ${compact ? "px-2 py-1.5" : "px-3 py-2.5"} ${
                  fitToWidth
                    ? columnWidths || nowrapHeader
                      ? "whitespace-nowrap leading-tight"
                      : "whitespace-normal break-all leading-tight"
                    : ""
                }`}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={`${row[0]}-${rowIndex}`}
              onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
              className={`${rowIndex % 2 === 0 ? "bg-transparent" : ""} ${
                onRowClick
                  ? "cursor-pointer transition-colors hover:bg-[rgba(231,53,58,0.12)]"
                  : ""
              }`}
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={`${row[0]}-${cellIndex}`}
                  className={`border-b ${compact ? "px-2 py-1.5" : "px-3 py-2.5"} ${
                    cellIndex === 0 ? "text-left" : "text-right"
                  } ${
                    fitToWidth && buttonColumn !== cellIndex
                      ? "overflow-hidden text-ellipsis whitespace-nowrap"
                      : ""
                  }`}
                >
                  {buttonColumn === cellIndex ? (
                    <button
                      className={`tk-button tk-button-primary font-medium ${
                        compact ? "px-1.5 py-0.5 text-micro" : "px-3 py-1 text-xs"
                      }`}
                      type="button"
                    >
                      {cell}
                    </button>
                  ) : (
                    <span
                      className={cellClassName(
                        cell,
                        cellIndex,
                        greenColumns,
                        redColumns,
                        deltaColumns,
                        emphasisColumns,
                      )}
                    >
                      {cell}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
