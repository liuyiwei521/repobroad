import { useEffect, useState } from "react";
import { X } from "lucide-react";

export const DEFAULT_TRADING_STATUS_TEXT = "市场宽松";
export const DEFAULT_TRADING_NOTICE_TEXT =
  "【资金交易提示】：早盘资金面整体宽松，存款类机构融出充裕，非银融出价格上升5-10bp。目前质押信用债的价格，隔夜R001+8bp，7天1.85%，14天1.90%，最新国际货币资金面情绪指数51";
export const AI_TRADING_NOTICE_TEXT =
  "AI提示：央行逆回购净投放带动资金面偏宽松，建议关注R001/R007边际变化及尾盘跨期需求。";

type TradingNoticeFormState = {
  morningMarket: string;
  depositInstitutionSupply: string;
  nonBankSupplyMove: string;
  overnightR001Bp: string;
  day7Rate: string;
  day14Rate: string;
  internationalSentiment: string;
  extraNote: string;
};

const BASE_TEXT_STYLE = {
  fontFamily: "var(--tk-font-family-base)",
  fontSize: "var(--tk-font-size-md)",
};

const LABEL_TEXT_STYLE = {
  fontFamily: "var(--tk-font-family-base)",
  fontSize: "var(--tk-font-size-xs)",
  lineHeight: "var(--tk-line-height-normal)",
  fontWeight: "var(--tk-font-weight-medium)",
};

const NUMBER_TEXT_STYLE = {
  fontFamily: "var(--tk-font-family-number)",
  fontVariantNumeric: "tabular-nums",
};

const DEFAULT_TRADING_NOTICE_FORM: TradingNoticeFormState = {
  morningMarket: "整体宽松",
  depositInstitutionSupply: "充裕",
  nonBankSupplyMove: "上升5-10bp",
  overnightR001Bp: "8",
  day7Rate: "1.85",
  day14Rate: "1.90",
  internationalSentiment: "51",
  extraNote: "",
};

function buildTradingNoticeText(form: TradingNoticeFormState) {
  const baseText =
    `【资金交易提示】：早盘资金面${form.morningMarket.trim() || "XXX"}，` +
    `存款类机构融出${form.depositInstitutionSupply.trim() || "XXX"}，` +
    `非银融出价格${form.nonBankSupplyMove.trim() || "XXX"}。` +
    `目前质押信用债的价格，隔夜R001+${form.overnightR001Bp.trim() || "XXX"}bp，` +
    `7天${form.day7Rate.trim() || "XXX"}%，14天${form.day14Rate.trim() || "XXX"}%，` +
    `最新国际货币资金面情绪指数${form.internationalSentiment.trim() || "XXX"}`;
  const extraNote = form.extraNote.trim();
  return extraNote ? `${baseText}\n${extraNote}` : baseText;
}

function parseTradingNoticeText(value: string): TradingNoticeFormState {
  const text = value.trim();
  if (!text) return DEFAULT_TRADING_NOTICE_FORM;

  const pattern =
    /^【资金交易提示】：早盘资金面(.*?)，存款类机构融出(.*?)，非银融出价格(.*?)。目前质押信用债的价格，隔夜R001\+(.*?)bp，7天(.*?)%，14天(.*?)%，最新国际货币资金面情绪指数(.*?)(?:。)?(?:\n([\s\S]*))?$/;
  const matched = text.match(pattern);

  if (!matched) {
    return {
      ...DEFAULT_TRADING_NOTICE_FORM,
      extraNote: text,
    };
  }

  return {
    morningMarket: matched[1]?.trim() || DEFAULT_TRADING_NOTICE_FORM.morningMarket,
    depositInstitutionSupply:
      matched[2]?.trim() || DEFAULT_TRADING_NOTICE_FORM.depositInstitutionSupply,
    nonBankSupplyMove:
      matched[3]?.trim() || DEFAULT_TRADING_NOTICE_FORM.nonBankSupplyMove,
    overnightR001Bp:
      matched[4]?.trim() || DEFAULT_TRADING_NOTICE_FORM.overnightR001Bp,
    day7Rate: matched[5]?.trim() || DEFAULT_TRADING_NOTICE_FORM.day7Rate,
    day14Rate: matched[6]?.trim() || DEFAULT_TRADING_NOTICE_FORM.day14Rate,
    internationalSentiment:
      matched[7]?.trim() || DEFAULT_TRADING_NOTICE_FORM.internationalSentiment,
    extraNote: matched[8]?.trim() || "",
  };
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  numeric = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  numeric?: boolean;
}) {
  return (
    <label className="grid gap-1.5 text-[color:var(--tk-color-text-secondary)]">
      <span style={LABEL_TEXT_STYLE}>{label}</span>
      <input
        className="tk-field px-3 py-2 text-[color:var(--tk-color-text-primary)] outline-none focus:border-[color:var(--tk-color-brand-primary-hover)]"
        placeholder={placeholder}
        style={{
          ...BASE_TEXT_STYLE,
          ...(numeric ? NUMBER_TEXT_STYLE : null),
          lineHeight: "20px",
        }}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

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
  const [form, setForm] = useState<TradingNoticeFormState>(() =>
    parseTradingNoticeText(value),
  );
  const previewText = buildTradingNoticeText(form);

  useEffect(() => {
    if (open) setForm(parseTradingNoticeText(value));
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

  function updateField<K extends keyof TradingNoticeFormState>(
    field: K,
    nextValue: TradingNoticeFormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: nextValue,
    }));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(previewText.trim() || DEFAULT_TRADING_NOTICE_TEXT);
  }

  function applyAiNotice() {
    setForm((current) => {
      if (current.extraNote.includes("AI提示")) return current;
      const extraNote = current.extraNote.trim();
      return {
        ...current,
        extraNote: extraNote ? `${extraNote}\n${AI_TRADING_NOTICE_TEXT}` : AI_TRADING_NOTICE_TEXT,
      };
    });
  }

  return (
    <div
      className="tk-overlay fixed inset-0 z-50 flex items-center justify-center px-4"
      onMouseDown={onClose}
    >
      <form
        className="tk-modal w-full max-w-5xl overflow-hidden border"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={submit}
        style={BASE_TEXT_STYLE}
      >
        <div className="tk-panel-header flex items-center justify-between gap-3 border-b px-5 py-4">
          <div className="min-w-0">
            <div
              className="truncate text-[color:var(--tk-color-text-primary)]"
              style={{
                fontFamily: "var(--tk-font-family-base)",
                fontSize: "var(--tk-font-size-lg)",
                lineHeight: "20px",
                fontWeight: "var(--tk-font-weight-medium)",
              }}
            >
              编辑交易提醒
            </div>
            <div
              className="mt-1 text-[color:var(--tk-color-text-secondary)]"
              style={{
                fontFamily: "var(--tk-font-family-base)",
                fontSize: "var(--tk-font-size-xs)",
                lineHeight: "var(--tk-line-height-normal)",
              }}
            >
              按字段填空，右侧实时生成提示文案，方便快速修改和复核。
            </div>
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
        <div className="grid max-h-[75vh] gap-4 overflow-y-auto px-5 py-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.95fr)]">
          <div className="grid gap-4">
            <div className="grid gap-3 rounded border border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-page)] p-4 sm:grid-cols-2">
              <FormField
                label="早盘资金面"
                placeholder="例如：整体宽松"
                value={form.morningMarket}
                onChange={(nextValue) => updateField("morningMarket", nextValue)}
              />
              <FormField
                label="存款类机构融出"
                placeholder="例如：充裕"
                value={form.depositInstitutionSupply}
                onChange={(nextValue) =>
                  updateField("depositInstitutionSupply", nextValue)
                }
              />
              <FormField
                label="非银融出价格"
                placeholder="例如：上升5-10bp"
                value={form.nonBankSupplyMove}
                onChange={(nextValue) => updateField("nonBankSupplyMove", nextValue)}
              />
              <FormField
                label="国际情绪指数"
                placeholder="例如：51"
                value={form.internationalSentiment}
                onChange={(nextValue) =>
                  updateField("internationalSentiment", nextValue)
                }
                numeric
              />
            </div>
            <div className="grid gap-3 rounded border border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-page)] p-4 sm:grid-cols-3">
              <FormField
                label="隔夜 R001 + bp"
                placeholder="例如：8"
                value={form.overnightR001Bp}
                onChange={(nextValue) => updateField("overnightR001Bp", nextValue)}
                numeric
              />
              <FormField
                label="7天 %"
                placeholder="例如：1.85"
                value={form.day7Rate}
                onChange={(nextValue) => updateField("day7Rate", nextValue)}
                numeric
              />
              <FormField
                label="14天 %"
                placeholder="例如：1.90"
                value={form.day14Rate}
                onChange={(nextValue) => updateField("day14Rate", nextValue)}
                numeric
              />
            </div>
            <label className="grid gap-1.5 text-[color:var(--tk-color-text-secondary)]">
              <span style={LABEL_TEXT_STYLE}>补充说明 / AI提示</span>
              <textarea
                className="tk-field min-h-32 resize-y px-3 py-2 text-[color:var(--tk-color-text-primary)] outline-none focus:border-[color:var(--tk-color-brand-primary-hover)]"
                placeholder="可补充盘中观察、尾盘提醒或 AI 建议。"
                style={{
                  ...BASE_TEXT_STYLE,
                  lineHeight: "24px",
                }}
                value={form.extraNote}
                onChange={(event) => updateField("extraNote", event.target.value)}
              />
            </label>
          </div>
          <div className="grid gap-3">
            <div className="rounded border border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-page)] p-4">
              <div
                className="text-[color:var(--tk-color-text-tertiary)]"
                style={LABEL_TEXT_STYLE}
              >
                提示预览
              </div>
              <div
                className="mt-3 whitespace-pre-wrap text-[color:var(--tk-color-text-primary)]"
                style={{
                  ...BASE_TEXT_STYLE,
                  lineHeight: "28px",
                }}
              >
                {previewText}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-panel)] px-5 py-4">
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
