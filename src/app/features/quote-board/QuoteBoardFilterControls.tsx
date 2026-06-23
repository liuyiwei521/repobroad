import { useEffect, useRef, useState } from "react";

import { FilterDivider, FilterLabel } from "../../components/ui/FilterControls";
import { ACCOUNT_TYPE_OPTIONS, COLLATERAL_OPTIONS } from "./quoteBoard.data";
import type { AmountFilterUnit } from "./quoteBoard.types";

export function QuoteBoardFilterControls({
  amountMin,
  amountMax,
  amountUnit,
  accountSearch,
  collateralSearch,
  onAmountMinChange,
  onAmountMaxChange,
  onAmountUnitChange,
  onAccountSearchChange,
  onCollateralSearchChange,
  className = "",
}: {
  amountMin: string;
  amountMax: string;
  amountUnit: AmountFilterUnit;
  accountSearch: string;
  collateralSearch: string;
  onAmountMinChange: (value: string) => void;
  onAmountMaxChange: (value: string) => void;
  onAmountUnitChange: (value: AmountFilterUnit) => void;
  onAccountSearchChange: (value: string) => void;
  onCollateralSearchChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={`flex min-w-0 items-center gap-x-1.5 gap-y-1 whitespace-nowrap text-mini text-slate-400 ${className}`}>
      <FilterLabel>金额</FilterLabel>
      <CompactSearchField
        value={amountMin}
        placeholder="最小"
        onChange={onAmountMinChange}
      />
      <span className="text-slate-500">~</span>
      <CompactSearchField
        value={amountMax}
        placeholder="不限"
        onChange={onAmountMaxChange}
      />
      <CompactSelectField<AmountFilterUnit>
        value={amountUnit}
        options={["yi", "wan"]}
        onChange={onAmountUnitChange}
        getLabel={(option) => (option === "yi" ? "亿" : "万")}
      />
      <FilterDivider compact />
      <FilterLabel>账户要求</FilterLabel>
      <FilterDropdown
        value={accountSearch}
        placeholder="自营 / 专户"
        options={ACCOUNT_TYPE_OPTIONS as unknown as readonly string[]}
        onChange={onAccountSearchChange}
      />
      <FilterDivider compact />
      <FilterLabel>质押要求</FilterLabel>
      <FilterDropdown
        value={collateralSearch}
        placeholder="利率 / 存单"
        options={COLLATERAL_OPTIONS as unknown as readonly string[]}
        onChange={onCollateralSearchChange}
      />
    </div>
  );
}

function CompactSearchField({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      className="tk-field h-6 w-[112px] px-2 text-mini text-slate-100 outline-none placeholder:text-slate-600"
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function FilterDropdown({
  value,
  placeholder,
  options,
  onChange,
}: {
  value: string;
  placeholder: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const filtered = options.filter((option) =>
    option.toLowerCase().includes((search || value).toLowerCase()),
  );

  return (
    <div ref={ref} className="relative">
      <input
        className="tk-field h-6 w-[96px] px-2 text-mini text-slate-100 outline-none placeholder:text-slate-600"
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          onChange(event.target.value);
          setSearch(event.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setSearch(value);
          setOpen(true);
        }}
      />
      {open ? (
        <div className="absolute left-0 top-full z-50 mt-0.5 max-h-48 w-[160px] overflow-y-auto rounded border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark)] shadow-lg">
          <button
            className="flex w-full items-center px-2 py-1.5 text-left text-mini text-slate-400 hover:bg-[var(--tk-color-surface-selected)]"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            type="button"
          >
            不限
          </button>
          {filtered.map((option) => (
            <button
              key={option}
              className={`flex w-full items-center px-2 py-1.5 text-left text-mini hover:bg-[var(--tk-color-surface-selected)] ${value === option ? "text-[color:var(--tk-color-brand-cyan)]" : "text-slate-200"}`}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              type="button"
            >
              {option}
            </button>
          ))}
          {!filtered.length ? (
            <div className="px-2 py-1.5 text-mini text-slate-500">无匹配项</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function CompactSelectField<T extends string>({
  value,
  options,
  onChange,
  getLabel,
}: {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  getLabel?: (value: T) => string;
}) {
  return (
    <select
      className="tk-field h-6 min-w-[56px] rounded border px-2 text-mini text-slate-100 outline-none"
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {getLabel ? getLabel(option) : option}
        </option>
      ))}
    </select>
  );
}
