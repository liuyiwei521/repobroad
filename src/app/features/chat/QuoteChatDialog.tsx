import { useEffect, useRef, useState } from "react";
import type { QuoteChatContext } from "./chat.types";

type LocalMessage = {
  id: string;
  from: "counterparty" | "trader";
  text: string;
  time: string;
};

function parseRateValue(rateText: string) {
  const matched = rateText.match(/-?\d+(?:\.\d+)?/);
  return matched ? Number(matched[0]) : null;
}

function formatAdjustedRate(rateText: string, basisPointDelta: number) {
  const baseRate = parseRateValue(rateText);
  if (baseRate === null) return rateText;

  const decimalPartLength = rateText.match(/\.(\d+)/)?.[1]?.length ?? 2;
  const nextRate = baseRate + basisPointDelta / 100;
  return `${nextRate.toFixed(Math.max(decimalPartLength, 2))}%`;
}

function buildConfirmDraft(context: QuoteChatContext) {
  return `确认，${context.quote.tenor} ${context.quote.rate}，${context.quote.amount}，${context.quote.collateral}，请发我方确认。`;
}

function buildCancelDraft(context: QuoteChatContext) {
  return `这笔 ${context.quote.tenor} 先取消，后续有变化我再联系你。`;
}

function buildAdjustedRateDraft(context: QuoteChatContext, basisPointDelta: number) {
  return `如果按 ${context.quote.tenor} ${formatAdjustedRate(context.quote.rate, basisPointDelta)}，${context.quote.amount}，${context.quote.collateral} 这个价格，可以继续沟通。`;
}

export function QuoteChatDialog({
  context,
  onClose,
}: {
  context: QuoteChatContext | null;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!context) return;
    setDraft("");
    setLocalMessages([
      {
        id: "quote",
        from: "counterparty",
        text: `${context.quote.contactName}：${context.quote.tenor} ${context.quote.rate}，${context.quote.amount}，${context.quote.collateral}，${context.quote.account}。`,
        time: context.quote.updatedAt,
      },
    ]);
  }, [context]);

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;

    element.style.height = "0px";
    element.style.height = `${Math.min(element.scrollHeight, 96)}px`;
  }, [draft]);

  if (!context) return null;

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    const now = new Date().toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setLocalMessages((messages) => [
      ...messages,
      { id: `msg-${Date.now()}`, from: "trader", text, time: now },
    ]);
    setDraft("");
  };

  const quickActions = [
    {
      label: "确认",
      onClick: () => setDraft(buildConfirmDraft(context)),
      className:
        "border-[rgba(231,53,58,0.32)] bg-[rgba(231,53,58,0.12)] text-red-100 hover:border-[rgba(231,53,58,0.56)]",
    },
    {
      label: "取消",
      onClick: () => setDraft(buildCancelDraft(context)),
      className:
        "border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-muted)] text-slate-200 hover:border-[color:var(--tk-color-border-divider)]",
    },
    {
      label: "价格+1bp",
      onClick: () => setDraft(buildAdjustedRateDraft(context, 1)),
      className:
        "border-[rgba(251,191,36,0.28)] bg-[rgba(251,191,36,0.1)] text-amber-200 hover:border-[rgba(251,191,36,0.5)]",
    },
    {
      label: "价格+2bp",
      onClick: () => setDraft(buildAdjustedRateDraft(context, 2)),
      className:
        "border-[rgba(251,191,36,0.28)] bg-[rgba(251,191,36,0.1)] text-amber-200 hover:border-[rgba(251,191,36,0.5)]",
    },
  ];

  const sendDisabled = draft.trim().length === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(17,24,39,0.38)] px-4"
      onMouseDown={onClose}
    >
      <aside
        className="grid h-[560px] w-full max-w-[620px] grid-rows-[auto_1fr_auto] overflow-hidden rounded-xl border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
        aria-label="报价对话框"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[color:var(--tk-color-border-divider-dark)] bg-[var(--tk-color-surface-dark-soft)] px-4 py-3">
          <div className="min-w-0">
            <div className="tk-title truncate">
              {context.quote.contactName} · {context.quote.institution}
            </div>
            <div className="mt-0.5 truncate text-mini text-slate-500">
              {context.sectionTitle} / {context.groupName} / {context.quote.tenor}
            </div>
          </div>
          <button className="tk-button" onClick={onClose} type="button">
            关闭
          </button>
        </div>

        <div className="grid min-h-0 grid-rows-[auto_1fr] overflow-hidden">
          <div className="border-b border-[color:var(--tk-color-border-divider-dark)] bg-[var(--tk-color-surface-page)] p-3">
            <div className="grid grid-cols-2 gap-2 text-micro text-slate-400 sm:grid-cols-4">
              {[
                { label: "金额", value: context.quote.amount },
                { label: "利率", value: context.quote.rate },
                { label: "券池", value: context.quote.collateral },
                { label: "账户", value: context.quote.account },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-md border border-[color:var(--tk-color-border-panel)] bg-[rgba(15,23,42,0.4)] px-2.5 py-2"
                >
                  <div className="text-[11px] text-slate-500">{item.label}</div>
                  <div className="mt-1 truncate text-xs text-slate-100">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="min-h-0 space-y-2 overflow-y-auto p-3">
            {localMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.from === "trader" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[78%] rounded-md border px-3 py-2 text-xs leading-5 ${
                    message.from === "trader"
                      ? "border-[rgba(231,53,58,0.46)] bg-[rgba(231,53,58,0.16)] text-red-100"
                      : "border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-muted)] text-slate-200"
                  }`}
                >
                  <div>{message.text}</div>
                  <div className="mt-1 text-right text-micro text-slate-500">
                    {message.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-[color:var(--tk-color-border-divider-dark)] bg-[var(--tk-color-surface-dark-soft)] p-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {quickActions.map((action) => (
              <button
                key={action.label}
                className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors ${action.className}`}
                onClick={action.onClick}
                type="button"
              >
                {action.label}
              </button>
            ))}
          </div>

          <div className="mt-3 rounded-lg border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-page)] p-2.5">
            <textarea
              ref={textareaRef}
              className="min-h-[64px] max-h-24 w-full resize-none border-0 bg-transparent px-1 py-1 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-500"
              value={draft}
              placeholder="输入消息，支持 2-3 行编辑"
              rows={3}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  send();
                }
              }}
            />

            <div className="mt-2 flex items-center justify-between gap-2 border-t border-[color:var(--tk-color-border-divider-dark)] px-1 pt-2">
              <div className="text-micro text-slate-500">Enter 发送，Shift+Enter 换行</div>
              <button
                className="tk-button tk-button-success min-w-[72px] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={sendDisabled}
                onClick={send}
                type="button"
              >
                发送
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
