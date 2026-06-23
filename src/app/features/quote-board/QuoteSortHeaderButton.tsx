import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";

import type { QuoteTableSortDirection } from "./quoteBoard.types";

export function QuoteSortHeaderButton({
  label,
  activeDirection,
  align = "right",
  onToggle,
}: {
  label: string;
  activeDirection: QuoteTableSortDirection | null;
  align?: "left" | "right";
  onToggle: () => void;
}) {
  const justifyClass = align === "left" ? "justify-start" : "justify-end";
  const icon = activeDirection === "asc"
    ? <ChevronUp size={12} />
    : activeDirection === "desc"
      ? <ChevronDown size={12} />
      : <ArrowUpDown size={12} />;

  return (
    <button
      className={`inline-flex w-full items-center gap-1 ${justifyClass} text-mini text-current transition hover:text-slate-200`}
      onClick={onToggle}
      type="button"
    >
      <span>{label}</span>
      <span className={activeDirection ? "text-slate-200" : "text-slate-500"}>
        {icon}
      </span>
    </button>
  );
}
