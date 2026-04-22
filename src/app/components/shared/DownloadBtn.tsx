export function DownloadBtn({ title = "导出数据" }: { title?: string }) {
  return (
    <button
      title={title}
      className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-[#8aa0b8] border border-[#2a4466] rounded hover:text-blue-400 hover:border-blue-400/60 transition-colors"
    >
      <svg
        width="10"
        height="10"
        viewBox="0 0 12 12"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M6 8.5L2.5 5H4.5V1.5H7.5V5H9.5L6 8.5Z" />
        <rect x="1.5" y="9.5" width="9" height="1.5" rx="0.5" />
      </svg>
      导出
    </button>
  );
}
