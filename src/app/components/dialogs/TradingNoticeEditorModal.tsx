import { useEffect, useState } from "react";
import { X } from "lucide-react";

export const DEFAULT_TRADING_STATUS_TEXT = "市场宽松";
export const DEFAULT_TRADING_NOTICE_TEXT =
  "【资金交易提示】：早盘资金面整体宽松，存款类机构融出充裕，非银融出价格上升5-10bp。目前质押信用债的价格，隔夜R001+8bp，7天1.85%，14天1.90%，最新国际货币资金面情绪指数51。";
export const AI_TRADING_NOTICE_TEXT =
  "AI提示：央行逆回购净投放带动资金面偏宽松，建议关注R001/R007边际变化及尾盘跨期需求。";

export function TradingNoticeEditorModal({
  open,
  value,
  onClose,
  onSave,
}: {
  open: boolean;
  value: string;
  onClose: () => void;
  onSave: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(draft.trim() || DEFAULT_TRADING_NOTICE_TEXT);
  }

  function applyAiNotice() {
    setDraft((current) => {
      const text = current.trim();
      if (!text) return AI_TRADING_NOTICE_TEXT;
      if (text.includes("AI提示")) return text;
      return `${text}\n${AI_TRADING_NOTICE_TEXT}`;
    });
  }

  return (
    <div
      className="tk-overlay fixed inset-0 z-50 flex items-center justify-center px-4"
      onMouseDown={onClose}
    >
      <form
        className="tk-modal w-full max-w-xl overflow-hidden border"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={submit}
      >
        <div className="tk-panel-header flex items-center justify-between gap-3 border-b px-5 py-4">
          <div className="min-w-0">
            <div className="tk-title-lg truncate">编辑交易提醒</div>
          </div>
          <button
            className="tk-button tk-icon-button inline-flex items-center justify-center"
            onClick={onClose}
            title="关闭"
            type="button"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4">
          <label className="grid gap-1.5 text-xs text-slate-400">
            <textarea
              className="tk-field min-h-28 resize-none px-3 py-2 text-sm leading-6 text-slate-100 outline-none focus:border-[color:var(--tk-color-brand-primary-hover)]"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
          </label>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-[color:var(--tk-color-border-divider-dark)] bg-[var(--tk-color-surface-dark-deep)] px-5 py-4">
          <button className="tk-button" onClick={applyAiNotice} type="button">
            AI提示
          </button>
          <div className="flex items-center gap-2">
            <button className="tk-button" onClick={onClose} type="button">
              取消
            </button>
            <button className="tk-button tk-button-primary" type="submit">
              保存
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
