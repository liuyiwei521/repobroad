import { MiniChartSkeleton } from "./PersonalInstitutionCompareCard";

export function BarometerSegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-mini text-slate-400">{label}</span>
      <div className="inline-flex overflow-hidden rounded-sm border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-muted)]">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`tk-chip tk-segmented-tab--compact rounded-none border border-transparent px-2 text-mini transition-colors ${
              option.value === value
                ? "tk-chip-active"
                : "text-slate-300 hover:border-[color:var(--tdx-red)] hover:bg-[rgba(180,47,50,0.04)] hover:text-slate-100"
            }`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MatrixPlaceholderCard({
  title,
  tag,
  hint,
  index,
}: {
  title: string;
  tag: string;
  hint: string;
  index: number;
}) {
  return (
    <div className="grid min-h-0 grid-rows-[auto_1fr] overflow-hidden rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)]">
      <div className="flex items-center justify-between gap-2 border-b border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-dark-soft)] px-2 py-0.5">
        <div className="min-w-0">
          <div className="tk-matrix-card-title truncate">{title}</div>
          <div className="tk-matrix-card-subtitle mt-0.5 truncate">{hint}</div>
        </div>
        <span className="tk-matrix-tag shrink-0 rounded border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-muted)] px-1.5 py-0.5 text-slate-400">
          {tag}
        </span>
      </div>
      <div className="relative min-h-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-45"
          style={{
            background:
              "repeating-linear-gradient(45deg, rgba(71,85,105,0.18) 0, rgba(71,85,105,0.18) 1px, transparent 1px, transparent 8px)",
          }}
        />
        <MiniChartSkeleton activeIndex={index} />
      </div>
    </div>
  );
}
