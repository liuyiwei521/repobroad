import { useWorkstation } from "../../context/WorkstationContext";
import type { AmountRange, RateRange } from "../../data/types";

const PERIODS = ["all", "1", "7", "14", "21", "28+"];

function RangeInput({
  label,
  unit,
  value,
  onChange,
  placeholder,
  step,
}: {
  label: string;
  unit: string;
  value: { min: string; max: string };
  onChange: (v: { min: string; max: string }) => void;
  placeholder?: { min: string; max: string };
  step?: string;
}) {
  const inputCls =
    "w-16 h-5 px-1.5 text-xs bg-[#0a1628] border border-[#2a4466] text-[#e4ecf5] rounded " +
    "placeholder:text-[#4a6080] focus:outline-none focus:border-blue-500 font-mono text-center";

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[#8aa0b8] text-xs whitespace-nowrap">{label}</span>
      <input
        type="number"
        step={step}
        value={value.min}
        onChange={(e) => onChange({ ...value, min: e.target.value })}
        placeholder={placeholder?.min ?? "最小"}
        className={inputCls}
      />
      <span className="text-[#4a6080] text-xs">~</span>
      <input
        type="number"
        step={step}
        value={value.max}
        onChange={(e) => onChange({ ...value, max: e.target.value })}
        placeholder={placeholder?.max ?? "最大"}
        className={inputCls}
      />
      <span className="text-[#6a7f98] text-[11px]">{unit}</span>
    </div>
  );
}

export function PeriodFilter() {
  const {
    selectedPeriod,
    setSelectedPeriod,
    amountRange,
    setAmountRange,
    rateRange,
    setRateRange,
  } = useWorkstation();

  return (
    <div className="flex items-center gap-4 bg-[#0f1e31] border-b border-[#1e3352] px-3 py-1.5 flex-shrink-0">
      {/* 期限 */}
      <div className="flex items-center gap-2">
        <span className="text-[#8aa0b8] text-xs whitespace-nowrap">期限</span>
        <div className="flex gap-0.5">
          {PERIODS.map((p) => {
            const active = selectedPeriod === p;
            return (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`px-2 py-0.5 text-xs rounded transition-colors ${
                  active
                    ? "bg-blue-600 text-white"
                    : "bg-[#132238] text-[#b0c1d6] hover:bg-[#18293f] border border-[#2a4466]"
                }`}
              >
                {p === "all" ? "全部" : p}
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-px h-4 bg-[#2a4466]" />

      {/* 金额范围（亿） */}
      <RangeInput
        label="金额"
        unit="亿"
        value={amountRange}
        onChange={(r) => setAmountRange(r as AmountRange)}
        placeholder={{ min: "0", max: "不限" }}
        step="0.1"
      />

      <div className="w-px h-4 bg-[#2a4466]" />

      {/* 利率范围（%） */}
      <RangeInput
        label="利率"
        unit="%"
        value={rateRange}
        onChange={(r) => setRateRange(r as RateRange)}
        placeholder={{ min: "0.00", max: "不限" }}
        step="0.01"
      />
    </div>
  );
}
