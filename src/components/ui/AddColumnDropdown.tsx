'use client';

import { cn } from '@/lib/utils';

export interface AddColumnOption {
  icon: string;
  name: string;
  isAI?: boolean;
  divider?: boolean;
}

interface AddColumnDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (option: AddColumnOption) => void;
}

const addColumnOptions: AddColumnOption[] = [
  { icon: 'Ai', name: 'Enable AI', isAI: true },
  { icon: '', name: '', divider: true },
  { icon: 'Aa', name: 'Text' },
  { icon: '#', name: 'Number' },
  { icon: 'D', name: 'Date' },
  { icon: '☑', name: 'Checkbox' },
  { icon: '~', name: 'URL' },
  { icon: '@', name: 'Email' },
  { icon: 'T', name: 'Phone' },
  { icon: '★', name: 'Rating' },
  { icon: '▼', name: 'Select' },
];

export function AddColumnDropdown({ isOpen, onClose, onSelect }: AddColumnDropdownProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100]"
        onClick={onClose}
      />

      {/* Dropdown */}
      <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-context border border-clay-200 w-[180px] z-[101] overflow-hidden">
        {addColumnOptions.map((opt, i) => {
          if (opt.divider) {
            return (
              <div
                key={i}
                className="h-px bg-clay-200 my-1"
              />
            );
          }

          return (
            <div
              key={i}
              onClick={() => {
                onSelect(opt);
                onClose();
              }}
              className={cn(
                'flex items-center gap-2.5 px-3.5 py-2.5 cursor-pointer transition-colors',
                opt.isAI
                  ? 'bg-purple-bg border-l-[3px] border-purple-main hover:bg-purple-light'
                  : 'border-l-[3px] border-transparent hover:bg-clay-50'
              )}
            >
              <span
                className={cn(
                  'text-[10px] font-semibold px-1 py-0.5 rounded-sm min-w-[20px] text-center',
                  opt.isAI
                    ? 'text-purple-dark bg-purple-light'
                    : 'text-clay-500 bg-clay-200'
                )}
              >
                {opt.icon}
              </span>
              <span
                className={cn(
                  'text-[13px]',
                  opt.isAI ? 'font-semibold text-purple-dark' : 'text-clay-700'
                )}
              >
                {opt.name}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}
