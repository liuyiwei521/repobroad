import { useState } from "react";
import { BANK_TENOR_LABEL, type BankRateRow } from "../../types";

function ModalInput({
  value,
  onChange,
  align = "left",
}: {
  value: string;
  onChange: (value: string) => void;
  align?: "left" | "right";
}) {
  return (
    <input
      className={`tk-field w-full px-3 py-2 text-sm outline-none transition focus:border-[color:var(--tk-color-brand-primary-hover)] ${
        align === "right" ? "text-right" : "text-left"
      }`}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function BankRateEditorModal({
  open,
  rows,
  onChange,
  onAddInstitution,
  onClose,
  onReset,
  onSave,
}: {
  open: boolean;
  rows: readonly BankRateRow[];
  onChange: (index: number, field: keyof BankRateRow, value: string) => void;
  onAddInstitution: (name: string) => void;
  onClose: () => void;
  onReset: () => void;
  onSave: () => void;
}) {
  const [newInstName, setNewInstName] = useState("");

  if (!open) {
    return null;
  }

  function commitAddInstitution() {
    if (!newInstName.trim()) return;
    onAddInstitution(newInstName);
    setNewInstName("");
  }

  return (
    <div className="tk-overlay fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="tk-modal w-full max-w-4xl overflow-hidden border">
        <div className="tk-panel-header border-b px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="tk-title-lg">今天大行价格手工输入</div>
            </div>
            <button className="tk-button" onClick={onClose} type="button">
              关闭
            </button>
          </div>
        </div>
        <div className="px-5 py-4">
          <div className="tk-table-shell overflow-hidden rounded border">
            <div className="grid grid-cols-[1.4fr_0.7fr_1fr_1fr] border-b border-[color:var(--tk-color-border-divider-dark)] bg-[var(--tk-color-surface-dark-soft)] px-4 py-2 text-mini font-medium tracking-[0] text-[color:var(--tk-color-text-tertiary)]">
              <span>机构</span>
              <span className="text-center">期限</span>
              <span className="text-right">非银利率</span>
              <span className="text-right">银行利率</span>
            </div>
            {rows.map((row, index) => (
              <div
                key={`${row.institution}-${row.tenor}-${index}`}
                className={`grid grid-cols-[1.4fr_0.7fr_1fr_1fr] items-center gap-3 border-b border-[color:var(--tk-color-border-divider-dark)] px-4 py-3 ${
                  index % 2 === 0 ? "bg-transparent" : "bg-[rgba(255,255,255,0.025)]"
                }`}
              >
                <div className="tk-title">{row.institution}</div>
                <div className="text-center text-xs text-slate-300">
                  {BANK_TENOR_LABEL[row.tenor]}
                </div>
                <ModalInput
                  align="right"
                  value={row.nonBankRate}
                  onChange={(value) => onChange(index, "nonBankRate", value)}
                />
                <ModalInput
                  align="right"
                  value={row.bankRate}
                  onChange={(value) => onChange(index, "bankRate", value)}
                />
              </div>
            ))}
          </div>
          <div className="tk-muted mt-3 flex items-center gap-2 text-xs">
            <span className="text-slate-500">新增机构</span>
            <input
              className="tk-field w-44 px-2 py-1.5 text-xs outline-none focus:border-[color:var(--tk-color-brand-primary-hover)]"
              placeholder="如 交通银行"
              value={newInstName}
              onChange={(e) => setNewInstName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitAddInstitution();
                }
              }}
            />
            <button
              className="tk-button tk-button-success"
              onClick={commitAddInstitution}
              type="button"
            >
              + 添加机构
            </button>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-[color:var(--tk-color-border-divider-dark)] bg-[var(--tk-color-surface-dark-deep)] px-5 py-4">
          <button className="tk-button" onClick={onReset} type="button">
            重置
          </button>
          <button className="tk-button" onClick={onClose} type="button">
            取消
          </button>
          <button className="tk-button tk-button-primary" onClick={onSave} type="button">
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
