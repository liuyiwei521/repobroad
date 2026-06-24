import { useEffect, useMemo, useRef, useState } from "react";

import { FilterDivider, FilterLabel } from "../../components/ui/FilterControls";
import {
  ACCOUNT_TYPE_OPTIONS,
  BROKER_OPTIONS,
  COLLATERAL_OPTIONS,
  COUNTERPARTY_TAG_OPTIONS,
  INSTITUTION_FILTER_OPTIONS,
  PINNED_INSTITUTION_FILTER_OPTIONS,
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
      pinnedOptions={PINNED_INSTITUTION_FILTER_OPTIONS}
      includeEmptyOption={false}
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
  pinnedOptions = [],
  alias,
  includeEmptyOption = true,
  onChange,
  className = "",
}: {
  value: string;
  placeholder: string;
  options: readonly string[];
  pinnedOptions?: readonly string[];
  alias?: (value: string) => string;
  includeEmptyOption?: boolean;
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

  const visibleOptions = useMemo(() => {
    const pinnedSet = new Set(pinnedOptions);
    return [...pinnedOptions, ...filtered.filter((option) => !pinnedSet.has(option))];
  }, [filtered, pinnedOptions]);

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
          {includeEmptyOption ? (
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
          ) : null}
          {visibleOptions.map((option) => {
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
          {!visibleOptions.length ? (
            <div className="px-2 py-1.5 text-mini text-slate-500">无匹配项</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function BrokerFilterButton({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <DropdownFilterButton
      label="中介"
      value={value}
      options={BROKER_OPTIONS as unknown as string[]}
      onChange={onChange}
    />
  );
}

export function CounterpartyTagFilterButton({
  value,
  onChange,
}: {
  value: readonly string[];
  onChange: (value: readonly string[]) => void;
}) {
  return (
    <DropdownFilterButton
      label="对手标签"
      value={value}
      options={COUNTERPARTY_TAG_OPTIONS as unknown as string[]}
      multi
      onChange={onChange}
    />
  );
}

function DropdownFilterButton({
  label,
  value,
  options,
  multi = false,
  onChange,
}: {
  label: string;
  value: string | readonly string[];
  options: readonly string[];
  multi?: boolean;
  onChange: (value: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  const hasValue = multi
    ? (value as readonly string[]).length > 0
    : (value as string) !== "";

  const displayText = multi
    ? (value as readonly string[]).length > 0
      ? (value as readonly string[]).join(", ")
      : label
    : (value as string) || label;

  return (
    <div ref={ref} className="relative">
      <button
        className={`inline-flex h-7 items-center gap-1 rounded-md border px-2.5 text-[13px] font-medium transition-all duration-150 ${
          hasValue
            ? "border-[color:var(--tk-color-brand-primary)] bg-[rgba(180,47,50,0.08)] text-[color:var(--tk-color-brand-primary)]"
            : "border-[#d1d5db] bg-white text-slate-500 hover:border-slate-400 hover:text-slate-700"
        }`}
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        <span className="max-w-[80px] truncate">{displayText}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M2 4L5 7L8 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-50 mt-0.5 min-w-[140px] overflow-hidden rounded border border-[color:var(--tk-color-border-panel)] bg-white shadow-lg">
          {!multi ? (
            <button
              className={`flex w-full items-center px-3 py-2 text-left text-[13px] hover:bg-[#f5f5f5] ${
                !hasValue ? "font-medium text-[color:var(--tk-color-brand-primary)]" : "text-slate-500"
              }`}
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              type="button"
            >
              全部
            </button>
          ) : null}
          {options.map((option) => {
            const selected = multi
              ? (value as readonly string[]).includes(option)
              : value === option;
            return (
              <button
                key={option}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-[#f5f5f5] ${
                  selected ? "font-medium text-[color:var(--tk-color-brand-primary)]" : "text-slate-700"
                }`}
                onClick={() => {
                  if (multi) {
                    const current = value as readonly string[];
                    onChange(
                      current.includes(option)
                        ? current.filter((v) => v !== option)
                        : [...current, option],
                    );
                  } else {
                    onChange(option);
                    setOpen(false);
                  }
                }}
                type="button"
              >
                {multi ? (
                  <span className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    selected
                      ? "border-[color:var(--tk-color-brand-primary)] bg-[color:var(--tk-color-brand-primary)] text-white"
                      : "border-slate-300 bg-white"
                  }`}>
                    {selected ? (
                      <svg width="10" height="10" viewBox="0 0 10 10">
                        <path d="M2 5L4 7L8 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : null}
                  </span>
                ) : null}
                <span>{option}</span>
              </button>
            );
          })}
          {multi && hasValue ? (
            <>
              <div className="border-t border-[color:var(--tk-color-border-divider)]" />
              <button
                className="flex w-full items-center px-3 py-2 text-left text-[13px] text-slate-400 hover:bg-[#f5f5f5]"
                onClick={() => {
                  onChange([]);
                  setOpen(false);
                }}
                type="button"
              >
                清除筛选
              </button>
            </>
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
