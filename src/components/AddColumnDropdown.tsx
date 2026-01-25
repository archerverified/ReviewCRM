'use client';

import { useState, useRef, useEffect } from 'react';

interface AddColumnDropdownProps {
  selectedCount: number;
  onSelectAIOutreach: () => void;
  disabled?: boolean;
}

export function AddColumnDropdown({
  selectedCount,
  onSelectAIOutreach,
  disabled = false,
}: AddColumnDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleAIOutreachClick = () => {
    setIsOpen(false);
    onSelectAIOutreach();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center justify-center w-8 h-8 rounded-lg transition-colors
          ${disabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer'
          }
        `}
        title={disabled ? 'Select rows first to add AI column' : 'Add enrichment column'}
        aria-label="Add column"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-black/10 shadow-lg z-50"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Add Column
            </div>

            <button
              type="button"
              onClick={handleAIOutreachClick}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
              role="menuitem"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">AI Outreach</div>
                <div className="text-xs text-gray-500">
                  Generate messages for {selectedCount} row{selectedCount !== 1 ? 's' : ''}
                </div>
              </div>
            </button>

            <button
              type="button"
              disabled
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg opacity-50 cursor-not-allowed text-left"
              role="menuitem"
              aria-disabled="true"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-400">Custom Field</div>
                <div className="text-xs text-gray-400">Coming soon</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
