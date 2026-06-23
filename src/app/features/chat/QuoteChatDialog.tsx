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
        "border-red-300 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-400",
    },
    {
      label: "取消",
      onClick: () => setDraft(buildCancelDraft(context)),
      className:
        "border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:border-gray-400",
    },
    {
      label: "价格+1bp",
      onClick: () => setDraft(buildAdjustedRateDraft(context, 1)),
      className:
        "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-400",
    },
    {
      label: "价格+2bp",
      onClick: () => setDraft(buildAdjustedRateDraft(context, 2)),
      className:
        "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-400",
    },
  ];

  const sendDisabled = draft.trim().length === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(17,24,39,0.38)] px-4"
      onMouseDown={onClose}
    >
      <aside
        className="grid h-[560px] w-full max-w-[620px] grid-rows-[auto_1fr_auto] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
        aria-label="报价对话框"
      >
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-gray-900">
              {context.quote.contactName} · {context.quote.institution}
            </div>
            <div className="mt-0.5 truncate text-mini text-gray-500">
              {context.sectionTitle} / {context.groupName} / {context.quote.tenor}
            </div>
          </div>
          <button className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50" onClick={onClose} type="button">
            关闭
          </button>
        </div>

        <div className="grid min-h-0 grid-rows-[auto_1fr] overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 p-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: "金额", value: context.quote.amount },
                { label: "利率", value: context.quote.rate },
                { label: "券池", value: context.quote.collateral },
                { label: "账户", value: context.quote.account },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-md border border-gray-200 bg-white px-2.5 py-2"
                >
                  <div className="text-[11px] text-gray-500">{item.label}</div>
                  <div className="mt-1 truncate text-xs font-medium text-gray-900">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="min-h-0 space-y-2 overflow-y-auto bg-white p-3">
            {localMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.from === "trader" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[78%] rounded-md border px-3 py-2 text-xs leading-5 ${
                    message.from === "trader"
                      ? "border-red-200 bg-red-50 text-gray-900"
                      : "border-gray-200 bg-gray-50 text-gray-900"
                  }`}
                >
                  <div>{message.text}</div>
                  <div className="mt-1 text-right text-micro text-gray-400">
                    {message.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 bg-gray-50 p-3">
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

          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-2.5">
            <textarea
              ref={textareaRef}
              className="min-h-[64px] max-h-24 w-full resize-none border-0 bg-transparent px-1 py-1 text-sm leading-6 text-gray-900 outline-none placeholder:text-gray-400"
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

            <div className="mt-2 flex items-center justify-between gap-2 border-t border-gray-200 px-1 pt-2">
              <div className="text-micro text-gray-500">Enter 发送，Shift+Enter 换行</div>
              <button
                className="rounded-md border border-blue-500 bg-blue-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-600 min-w-[72px] disabled:cursor-not-allowed disabled:opacity-40"
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
