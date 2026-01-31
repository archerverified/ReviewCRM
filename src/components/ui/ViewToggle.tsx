'use client';

import { cn } from '@/lib/utils';

interface ViewToggleProps {
  active: string;
  onChange: (view: string) => void;
  views?: string[];
  className?: string;
}

export function ViewToggle({
  active,
  onChange,
  views = ['List', 'Board', 'Calendar'],
  className,
}: ViewToggleProps) {
  return (
    <div className={cn('inline-flex bg-clay-100 rounded-md p-1', className)}>
      {views.map((view) => {
        const viewKey = view.toLowerCase();
        const isActive = active === viewKey;

        return (
          <button
            key={view}
            onClick={() => onChange(viewKey)}
            className={cn(
              'px-4 py-2 rounded text-[13px] transition-all cursor-pointer border-none',
              isActive
                ? 'bg-white text-clay-900 font-medium shadow-sm'
                : 'bg-transparent text-clay-600 hover:text-clay-900'
            )}
          >
            {view}
          </button>
        );
      })}
    </div>
  );
}
