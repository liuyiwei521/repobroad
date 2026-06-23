import type { QuoteDetailRow, QuoteOverride, QuoteRank } from "../../types";

export function QuoteEditorModal({
  row,
  draft,
  onChange,
  onClose,
  onSave,
}: {
  row: QuoteDetailRow | null;
  draft: QuoteOverride;
  onChange: (field: keyof QuoteOverride, value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  if (!row) return null;

  const textFields: {
    key: keyof QuoteOverride;
    label: string;
    placeholder?: string;
  }[] = [
    { key: "groupName", label: "分组", placeholder: "如 利率地方" },
    { key: "institution", label: "机构", placeholder: "如 中信银行" },
    { key: "tenor", label: "期限", placeholder: "如 R007" },
    { key: "rate", label: "利率", placeholder: "如 1.40%" },
    { key: "amount", label: "金额", placeholder: "如 5亿" },
    { key: "minimum", label: "起投门槛", placeholder: "如 5亿起" },
    { key: "accountType", label: "账户类型", placeholder: "如 自营户" },
    { key: "collateral", label: "质押品", placeholder: "如 利率/地方/存单" },
  ];
  const rankOptions: QuoteRank[] = ["最优", "次优", "报价"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(17,24,39,0.32)] px-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] shadow-[0_12px_28px_rgba(17,24,39,0.12)]">
        <div className="border-b border-[color:var(--tk-color-border-divider-dark)] bg-[var(--tk-color-surface-dark-soft)] px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="tk-title">修正报价</div>
            </div>
            <button className="tk-button" onClick={onClose} type="button">
              关闭
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 px-5 py-4">
          {textFields.map((f) => (
            <label key={f.key} className="flex flex-col gap-1 text-mini text-slate-400">
              <span>{f.label}</span>
              <input
                className="rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-[color:var(--tk-color-brand-primary-hover)]"
                value={(draft[f.key] as string) ?? ""}
                placeholder={f.placeholder}
                onChange={(e) => onChange(f.key, e.target.value)}
              />
            </label>
          ))}
          <label className="flex flex-col gap-1 text-mini text-slate-400">
            <span>评级</span>
            <select
              className="rounded-md border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-[color:var(--tk-color-brand-primary-hover)]"
              value={(draft.rank as string) ?? row.rank}
              onChange={(e) => onChange("rank", e.target.value)}
            >
              {rankOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-[color:var(--tk-color-border-divider-dark)] bg-[var(--tk-color-surface-dark-deep)] px-5 py-4">
          <button className="tk-button" onClick={onClose} type="button">
            取消
          </button>
          <button className="tk-button tk-button-success" onClick={onSave} type="button">
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
