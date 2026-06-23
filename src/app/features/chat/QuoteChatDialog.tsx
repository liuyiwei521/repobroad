import { useEffect, useState } from "react";
import type { QuoteChatContext } from "./chat.types";

export function QuoteChatDialog({
  context,
  onClose,
}: {
  context: QuoteChatContext | null;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [localMessages, setLocalMessages] = useState<
    Array<{ id: string; from: "counterparty" | "trader"; text: string; time: string }>
  >([]);

  useEffect(() => {
    if (!context) return;
    setDraft(
      `${context.quote.tenor} ${context.quote.rate}，${context.quote.amount}，${context.quote.collateral}。`,
    );
    setLocalMessages([
      {
        id: "quote",
        from: "counterparty",
        text: `${context.quote.contactName}：${context.quote.tenor} ${context.quote.rate}，${context.quote.amount}，${context.quote.collateral}，${context.quote.account}。`,
        time: context.quote.updatedAt,
      },
    ]);
  }, [context]);

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

  const quickReplies = [
    {
      label: "确认可成交",
      text: `这笔可以，${context.quote.tenor} ${context.quote.rate}，${context.quote.amount} 按这个要素发我方确认。`,
    },
    {
      label: "价格可谈",
      text: `${context.quote.tenor} 价格还能再谈一下吗？目前看到 ${context.quote.rate}。`,
    },
    {
      label: "金额多少",
      text: `这边想确认一下 ${context.quote.tenor} 现在最多还能给多少量？`,
    },
    {
      label: "补充要素",
      text: "麻烦补一下完整要素：期限、金额、利率、质押和账户要求。",
    },
    {
      label: "稍后回复",
      text: "收到，我这边确认一下账户和额度，稍后回复你。",
    },
    {
      label: "改报利率",
      text: `${context.quote.tenor} 如果按我方价格再调整一点，可以继续沟通。`,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(17,24,39,0.38)] px-4"
      onMouseDown={onClose}
    >
      <aside
        className="grid h-[520px] w-full max-w-[560px] grid-rows-[auto_1fr_auto] overflow-hidden rounded-xl border border-[color:var(--tk-color-border-panel)] bg-[var(--tk-color-surface-dark-deep)] shadow-2xl"
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
            <div className="grid grid-cols-4 gap-1.5 text-micro text-slate-400">
              <span className="tk-field truncate px-2 py-1">{context.quote.amount}</span>
              <span className="tk-field truncate px-2 py-1">{context.quote.rate}</span>
              <span className="tk-field truncate px-2 py-1">{context.quote.collateral}</span>
              <span className="tk-field truncate px-2 py-1">{context.quote.account}</span>
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
          <div className="mb-2 flex flex-wrap gap-1.5">
            {quickReplies.map((reply) => (
              <button
                key={reply.label}
                className="tk-chip rounded border text-micro transition-colors hover:border-[color:var(--tdx-red)] hover:text-slate-100"
                onClick={() => setDraft(reply.text)}
                type="button"
              >
                {reply.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="tk-field h-8 min-w-0 flex-1 px-3 text-xs text-slate-100 outline-none placeholder:text-slate-600"
              value={draft}
              placeholder="输入消息，Enter 发送"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") send();
              }}
            />
            <button className="tk-button tk-button-success" onClick={send} type="button">
              发送
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
