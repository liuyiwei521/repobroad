import { useEffect, useMemo, useRef, useState } from "react";

import { FilterDivider, FilterLabel } from "../../components/ui/FilterControls";
import {
  ACCOUNT_TYPE_OPTIONS,
  COLLATERAL_OPTIONS,
  INSTITUTION_FILTER_OPTIONS,
} from "./quoteBoard.data";
import {
  fuzzyTextMatch,
  normalizeAccountRequirement,
  normalizeCollateralRequirement,
} from "./quoteBoard.utils";
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
    <div className={`flex min-w-0 flex-wrap items-center gap-x-1 gap-y-1 whitespace-nowrap text-mini text-slate-400 ${className}`}>
      <FilterLabel>金额</FilterLabel>
      <CompactSearchField
        value={amountMin}
        placeholder="0"
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
      <AutoCompleteField
        value={accountSearch}
        placeholder="自营 / 专户"
        options={ACCOUNT_TYPE_OPTIONS}
        alias={(option) => normalizeAccountRequirement(option)}
        onChange={onAccountSearchChange}
        className="w-[116px]"
      />
      <FilterDivider compact />
      <FilterLabel>质押要求</FilterLabel>
      <AutoCompleteField
        value={collateralSearch}
        placeholder="利率 / 存单"
        options={COLLATERAL_OPTIONS}
        alias={(option) => normalizeCollateralRequirement(option)}
        onChange={onCollateralSearchChange}
        className="w-[116px]"
      />
    </div>
  );
}

export function InstitutionSearchField({
  value,
  onChange,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <AutoCompleteField
      value={value}
      placeholder="搜索发送人 / 机构"
      options={INSTITUTION_FILTER_OPTIONS}
      onChange={onChange}
      className={className}
    />
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
      className="tk-field h-6 w-[56px] px-2 text-mini text-slate-100 outline-none placeholder:text-slate-600"
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function AutoCompleteField({
  value,
  placeholder,
  options,
  alias,
  onChange,
  className = "",
}: {
  value: string;
  placeholder: string;
  options: readonly string[];
  alias?: (value: string) => string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const filtered = useMemo(() => {
    const query = search.trim();
    const results = options.filter((option) => {
      const text = alias ? `${option} ${alias(option)}` : option;
      return fuzzyTextMatch(text, query);
    });
    return results.slice(0, 8);
  }, [alias, options, search]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <input
        className="tk-field h-6 w-full px-2 text-mini text-slate-100 outline-none placeholder:text-slate-600"
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          const nextValue = event.target.value;
          onChange(nextValue);
          setSearch(nextValue);
          setOpen(true);
        }}
        onFocus={() => {
          setSearch(value);
          setOpen(true);
        }}
      />
      {open ? (
        <div className="absolute left-0 top-full z-50 mt-0.5 max-h-56 w-full min-w-[160px] overflow-y-auto rounded border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark)] shadow-lg">
          <button
            className="flex w-full items-center px-2 py-1.5 text-left text-mini text-slate-400 hover:bg-[var(--tk-color-surface-selected)]"
            onClick={() => {
              onChange("");
              setSearch("");
              setOpen(false);
            }}
            type="button"
          >
            不限
          </button>
          {filtered.map((option) => {
            const aliasText = alias?.(option);
            return (
              <button
                key={option}
                className={`flex w-full items-center justify-between gap-3 px-2 py-1.5 text-left text-mini hover:bg-[var(--tk-color-surface-selected)] ${value === option ? "text-[color:var(--tk-color-brand-cyan)]" : "text-slate-200"}`}
                onClick={() => {
                  onChange(option);
                  setSearch(option);
                  setOpen(false);
                }}
                type="button"
              >
                <span className="truncate">{option}</span>
                {aliasText && aliasText !== option ? (
                  <span className="shrink-0 text-[11px] text-slate-500">{aliasText}</span>
                ) : null}
              </button>
            );
          })}
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
