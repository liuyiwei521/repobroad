import type { ReactNode } from "react";

export function FilterLabel({ children }: { children: ReactNode }) {
  return <span className="tk-muted px-1">{children}</span>;
}

export function FilterDivider({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`${compact ? "mx-1 h-5" : "mx-2 h-6"} w-px bg-[var(--tk-color-border-divider-dark)]`}
    />
  );
}

export function miniChipClass(active: boolean) {
  return active
    ? "tk-chip tk-chip-active tk-segmented-tab--compact whitespace-nowrap text-mini"
    : "tk-chip tk-segmented-tab--compact whitespace-nowrap text-mini";
}
