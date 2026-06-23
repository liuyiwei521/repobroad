import { XrepoInlineHistoryChart } from "./XrepoInlineHistoryChart";

export function XrepoHistoryBack({
  contractName,
  compact = false,
  onBack,
  standalone = false,
  showHeader = true,
}: {
  contractName: string;
  compact?: boolean;
  onBack: () => void;
  standalone?: boolean;
  showHeader?: boolean;
}) {
  const wrapperClassName = showHeader
    ? `grid h-full min-h-0 grid-rows-[auto_1fr] overflow-hidden ${
        standalone ? "gap-2" : compact ? "" : "gap-2 p-3"
      }`
    : "h-full min-h-0 overflow-hidden";

  return (
    <div
      className={wrapperClassName}
      onClick={standalone ? undefined : onBack}
    >
      {showHeader ? (
        <div
          className={`flex items-center justify-between gap-3 ${
            standalone
              ? "border-b border-[color:var(--tk-color-border-divider)] px-1 pb-2"
              : "border-b border-[color:var(--tk-color-border-divider)] bg-[var(--tk-color-surface-dark-soft)]"
          } ${standalone ? "" : compact ? "px-2 py-0.5" : "rounded-md px-3 py-1"}`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="min-w-0 flex-1">
            <div
              className={`${compact ? "text-xs" : "text-sm"} truncate whitespace-nowrap font-semibold text-slate-100`}
            >
              {"历史成交走势对比 - "}
              {contractName}
            </div>
          </div>
          <button
            className={`tk-button ${compact ? "px-1.5 py-0.5 text-micro" : "px-2.5 py-0.5 text-xs"}`}
            onClick={(event) => {
              event.stopPropagation();
              onBack();
            }}
            type="button"
          >
            {"返回"}
          </button>
        </div>
      ) : null}
      <div
        className={`h-full min-h-0 overflow-hidden ${
          showHeader && !standalone && !compact ? "rounded-md" : ""
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <XrepoInlineHistoryChart contractName={contractName} compact={compact} />
      </div>
    </div>
  );
}
