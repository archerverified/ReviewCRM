'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface TabProps {
  active: boolean;
  children: ReactNode;
  count?: number;
  onClick: () => void;
  className?: string;
}

export function Tab({ active, children, count, onClick, className }: TabProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'bg-transparent border-none cursor-pointer px-4 py-3 text-sm flex items-center gap-2',
        'border-b-2 transition-colors',
        active
          ? 'border-clay-900 text-clay-900 font-semibold'
          : 'border-transparent text-clay-500 hover:text-clay-700',
        className
      )}
    >
      {children}
      {count !== undefined && (
        <span
          className={cn(
            'px-2 py-0.5 rounded-full text-[11px] font-medium',
            active
              ? 'bg-clay-900 text-white'
              : 'bg-clay-200 text-clay-600'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
