import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

export type QuoteChatAnchor = { x: number; y: number };

export type QuoteChatContext = {
  id: string;
  institution: string;
  groupName: string;
  sectionTitle: string;
  tenor: string;
  amount: string;
  rate: string;
  accountRequirement: string;
  collateral: string;
  reason: string;
  updatedAt: string;
  rank: string;
  anchor?: QuoteChatAnchor;
};

type QuoteChatMessage = {
  id: string;
  from: "trader" | "counterparty" | "system";
  text: string;
  time: string;
};

type PopupPosition = { x: number; y: number };

const POPUP_WIDTH = 600;
const POPUP_HEIGHT = 540;
const EDGE_GAP = 12;
const TOP_GAP = 54;
const CURSOR_GAP = 12;

function currentMinuteTime() {
  return new Date().toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function clampPosition(x: number, y: number): PopupPosition {
  if (typeof window === "undefined") return { x, y };

  const width = Math.min(POPUP_WIDTH, window.innerWidth - EDGE_GAP * 2);
  const height = Math.min(POPUP_HEIGHT, window.innerHeight - TOP_GAP - EDGE_GAP);
  const maxX = Math.max(window.innerWidth - width - EDGE_GAP, EDGE_GAP);
  const maxY = Math.max(window.innerHeight - height - EDGE_GAP, TOP_GAP);

  return {
    x: Math.min(Math.max(x, EDGE_GAP), maxX),
    y: Math.min(Math.max(y, TOP_GAP), maxY),
  };
}

function defaultPosition() {
  if (typeof window === "undefined") return { x: 720, y: 82 };
  return clampPosition(window.innerWidth - POPUP_WIDTH - 36, 82);
}

function positionFromAnchor(anchor?: QuoteChatAnchor) {
  if (!anchor || typeof window === "undefined") return defaultPosition();

  const hasRoomRight =
    window.innerWidth - anchor.x >= POPUP_WIDTH + CURSOR_GAP + EDGE_GAP;
  const x = hasRoomRight
    ? anchor.x + CURSOR_GAP
    : anchor.x - POPUP_WIDTH - CURSOR_GAP;

  return clampPosition(x, anchor.y + CURSOR_GAP);
}

function buildInitialMessages(context: QuoteChatContext): QuoteChatMessage[] {
  const time = context.updatedAt || currentMinuteTime();
  const displayAmount = context.amount && context.amount !== "--" ? context.amount : "待确认";

  return [
    {
      id: `${context.id}-system`,
      from: "system",
      text: `已定位 ${context.sectionTitle} / ${context.groupName} 的${context.rank}报价。`,
      time,
    },
    {
      id: `${context.id}-counterparty-1`,
      from: "counterparty",
      text: `${context.tenor} ${displayAmount} @ ${context.rate}，${context.accountRequirement}，押券 ${context.collateral}。`,
      time,
    },
    {
      id: `${context.id}-trader-1`,
      from: "trader",
      text: "收到，我看下账户和额度。",
      time,
    },
  ];
}

export function QuoteChatPopup({
  context,
  onClose,
}: {
  context: QuoteChatContext;
  onClose: () => void;
}) {
  const popupRef = useRef<HTMLElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const scrollInitRef = useRef(true);
  const [position, setPosition] = useState(() =>
    positionFromAnchor(context.anchor),
  );
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [composerText, setComposerText] = useState("");
  const [messages, setMessages] = useState<QuoteChatMessage[]>(() =>
    buildInitialMessages(context),
  );
  const [dealConfirmed, setDealConfirmed] = useState(false);

  useEffect(() => {
    setPosition(positionFromAnchor(context.anchor));
  }, [context.anchor]);

  useEffect(() => {
    setMessages(buildInitialMessages(context));
    setComposerText("");
    setDealConfirmed(false);
    scrollInitRef.current = true;
    inputRef.current?.focus();
  }, [context.id]);

  useEffect(() => {
    const node = messagesRef.current;
    if (!node) return;
    node.scrollTo({
      top: node.scrollHeight,
      behavior: scrollInitRef.current ? "auto" : "smooth",
    });
    scrollInitRef.current = false;
  }, [messages]);

  useEffect(() => {
    function onResize() {
      setPosition((current) => clampPosition(current.x, current.y));
    }

    function onKeydown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeydown);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKeydown);
    };
  }, [onClose]);

  function startDrag(event: MouseEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(true);
    dragOffset.current = {
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    };

    function onMove(moveEvent: globalThis.MouseEvent) {
      setPosition(
        clampPosition(
          moveEvent.clientX - dragOffset.current.x,
          moveEvent.clientY - dragOffset.current.y,
        ),
      );
    }

    function onUp() {
      setDragging(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function sendMessage() {
    const text = composerText.trim();
    if (!text) return;

    setMessages((current) => [
      ...current,
      {
        id: `message-${Date.now()}`,
        from: "trader",
        text,
        time: currentMinuteTime(),
      },
    ]);
    setComposerText("");
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  return (
    <aside
      ref={popupRef}
      aria-label="聊天弹窗"
      className={`tk-chat-popup ${dragging ? "is-dragging" : ""}`}
      style={{ left: position.x, top: position.y }}
    >
      <div className="tk-chat-popup__head" onMouseDown={startDrag}>
        <div className="min-w-0">
          <p>聊天弹窗</p>
          <h3>{context.institution}</h3>
        </div>
        <button
          aria-label="关闭聊天弹窗"
          className="tk-chat-popup__close"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
          type="button"
        >
          x
        </button>
      </div>

      <div className="tk-chat-summary">
        <span>报价摘要</span>
        <strong>
          {context.tenor} / {context.rate}
        </strong>
        <em>{context.amount && context.amount !== "--" ? context.amount : "金额待确认"}</em>
      </div>

      <div className="tk-chat-meta">
        <span title={context.accountRequirement}>{context.accountRequirement}</span>
        <span title={context.collateral}>{context.collateral}</span>
        <span title={context.reason}>{context.reason}</span>
        <span>{context.updatedAt}</span>
      </div>

      <div ref={messagesRef} className="tk-chat-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`tk-chat-message tk-chat-message--${message.from}`}
          >
            <span>{message.text}</span>
            <small>{message.time}</small>
          </div>
        ))}
      </div>

      <div className="tk-chat-composer">
        <textarea
          ref={inputRef}
          aria-label="聊天输入"
          onChange={(event) => setComposerText(event.target.value)}
          onKeyDown={handleComposerKeyDown}
          placeholder="输入消息，Enter 发送"
          rows={2}
          value={composerText}
        />
        <button
          className="tk-btn tk-btn--secondary tk-btn--compact"
          onClick={sendMessage}
          type="button"
        >
          发送
        </button>
        <button
          className={`tk-btn tk-btn--trade tk-btn--compact ${dealConfirmed ? "tk-btn--sent" : ""}`}
          disabled={dealConfirmed}
          onClick={() => {
            if (dealConfirmed) return;
            setDealConfirmed(true);
            setMessages((current) => [
              ...current,
              {
                id: `deal-${Date.now()}`,
                from: "system",
                text: `已确认成交：${context.tenor} ${context.amount && context.amount !== "--" ? context.amount : "待分配"} @ ${context.rate}，等待快捷分配。`,
                time: currentMinuteTime(),
              },
            ]);
          }}
          type="button"
        >
          {dealConfirmed ? "已成交" : "确认成交"}
        </button>
      </div>
    </aside>
  );
}
