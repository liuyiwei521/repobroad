import type { OverlayProduct } from "../../types";
import { overlayProductOptions } from "./intraday.data";

export function OverlayProductSelect({
  value,
  onChange,
}: {
  value: OverlayProduct;
  onChange: (product: OverlayProduct) => void;
}) {
  return (
    <label className="flex items-center gap-1 whitespace-nowrap text-xs text-slate-400">
      <span>鍙犲姞</span>
      <select
        className="rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-page)] px-1.5 py-0.5 text-xs text-slate-200 outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value as OverlayProduct)}
      >
        {overlayProductOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
