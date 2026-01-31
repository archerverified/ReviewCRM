'use client';

import { cn } from '@/lib/utils';

interface ColumnHeaderProps {
  icon?: string;
  name: string;
  hasPlay?: boolean;
  isEnriched?: boolean;
  onContextMenu?: (e: React.MouseEvent) => void;
  className?: string;
}

export function ColumnHeader({
  icon,
  name,
  hasPlay,
  isEnriched,
  onContextMenu,
  className,
}: ColumnHeaderProps) {
  return (
    <div
      onContextMenu={onContextMenu}
      className={cn(
        'flex items-center gap-1.5 px-3 py-2 border-b border-r border-clay-200 cursor-default min-w-[100px] relative select-none',
        isEnriched ? 'bg-purple-bg' : 'bg-clay-50',
        className
      )}
    >
      {icon && (
        <span className="text-[10px] font-semibold text-clay-500 bg-clay-200 px-1 py-0.5 rounded-sm">
          {icon}
        </span>
      )}
      <span className="text-[11px] font-medium text-clay-700 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
        {name}
      </span>
      {hasPlay && (
        <button
          className={cn(
            'w-[18px] h-[18px] rounded border-none text-white text-[8px] cursor-pointer flex items-center justify-center',
            isEnriched ? 'bg-purple-main' : 'bg-clay-300'
          )}
        >
          ▸
        </button>
      )}
    </div>
  );
}
