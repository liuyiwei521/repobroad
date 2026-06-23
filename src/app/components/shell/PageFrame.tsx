import { useEffect } from "react";
import { Download, RefreshCcw, X } from "lucide-react";

export function PageFrame({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
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
      className="tk-overlay fixed inset-0 z-[40] flex items-center justify-center px-5 py-5"
      onMouseDown={onClose}
    >
      <section
        className="tk-modal grid h-[86vh] w-[min(1380px,calc(100vw-40px))] grid-rows-[auto_1fr] overflow-hidden border"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="tk-panel-header flex items-center justify-between gap-3 border-b px-4 py-3">
          <div className="min-w-0">
            <div className="tk-title-lg truncate">{title}</div>
            <div className="tk-muted mt-0.5 text-xs">入口页框 / Esc 关闭</div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
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
        <div className="min-h-0 overflow-hidden p-3">{children}</div>
      </section>
    </div>
  );
}
