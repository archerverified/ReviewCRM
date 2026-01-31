'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface ContextMenuItem {
  icon?: string;
  label?: string;
  shortcut?: string;
  action?: () => void;
  divider?: boolean;
  destructive?: boolean;
  disabled?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to prevent menu from going off-screen
  const adjustedX = Math.min(x, window.innerWidth - 220);
  const adjustedY = Math.min(y, window.innerHeight - 400);

  return (
    <div
      ref={menuRef}
      className="fixed bg-white rounded-lg shadow-context w-[200px] z-[1000] overflow-hidden py-1"
      style={{ top: adjustedY, left: adjustedX }}
    >
      {items.map((item, idx) => {
        if (item.divider) {
          return (
            <div
              key={idx}
              className="h-px bg-clay-200 my-1"
            />
          );
        }

        return (
          <div
            key={idx}
            onClick={() => {
              if (!item.disabled && item.action) {
                item.action();
                onClose();
              }
            }}
            className={cn(
              'flex items-center justify-between px-3 py-2 text-[13px] transition-colors cursor-pointer',
              item.disabled
                ? 'text-clay-400 cursor-not-allowed opacity-50'
                : item.destructive
                ? 'text-red-main hover:bg-red-light/50'
                : 'text-clay-700 hover:bg-clay-100'
            )}
          >
            <div className="flex items-center gap-2.5">
              {item.icon && (
                <span
                  className={cn(
                    'w-4 text-xs',
                    item.disabled
                      ? 'text-clay-400'
                      : item.destructive
                      ? 'text-red-main'
                      : 'text-clay-500'
                  )}
                >
                  {item.icon}
                </span>
              )}
              <span>{item.label}</span>
            </div>
            {item.shortcut && (
              <span className="text-[11px] text-clay-400">{item.shortcut}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
