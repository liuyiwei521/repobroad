import type { ReactNode } from 'react';

interface Props {
  title: string;
  updateTime?: string;
  right?: ReactNode;
  icon?: ReactNode;
}

export function CardHeader({ title, updateTime, right, icon }: Props) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 bg-[#132238] border-b border-[#1e3352] flex-shrink-0">
      <div className="flex items-center gap-1.5">
        {icon}
        <h3 className="text-xs font-semibold text-[#e4ecf5]">{title}</h3>
        {updateTime && (
          <span className="text-[10px] text-[#8aa0b8] ml-2 font-mono">
            数据更新：{updateTime}
          </span>
        )}
      </div>
      {right && <div className="flex items-center gap-1.5">{right}</div>}
    </div>
  );
}
