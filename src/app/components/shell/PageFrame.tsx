import { useEffect } from "react";
import { Download, RefreshCcw, X } from "lucide-react";

export function PageFrame({
  title,
  onClose,
  headerContent,
  headerActions,
  children,
}: {
  title: string;
  onClose: () => void;
  headerContent?: React.ReactNode;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="tk-overlay fixed inset-0 z-[40] flex items-center justify-center px-3 py-3"
      onMouseDown={onClose}
    >
      <section
        className="tk-modal grid h-[94vh] w-[min(1560px,calc(100vw-24px))] grid-rows-[auto_1fr] overflow-hidden border"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="tk-panel-header flex items-center justify-between gap-3 border-b px-4 py-3">
          {headerContent ? (
            <div className="min-w-0 flex-1">{headerContent}</div>
          ) : (
            <div className="min-w-0">
              <div className="tk-title-lg truncate">{title}</div>
            </div>
          )}
          <div className="flex shrink-0 items-center gap-2">
            {headerActions}
            <button
              className="tk-button inline-flex items-center gap-1.5 opacity-60"
              disabled
              type="button"
              title="刷新"
            >
              <RefreshCcw size={13} />
              刷新
            </button>
            <button
              className="tk-button inline-flex items-center gap-1.5 opacity-60"
              disabled
              type="button"
              title="下载"
            >
              <Download size={13} />
              下载
            </button>
            <button
              className="tk-button tk-icon-button inline-flex items-center justify-center"
              onClick={onClose}
              type="button"
              title="关闭"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="min-h-0 overflow-hidden p-2">{children}</div>
      </section>
    </div>
  );
}
