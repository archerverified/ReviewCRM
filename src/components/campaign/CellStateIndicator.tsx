'use client';

import { CellState } from '@/types/campaign';

interface CellStateIndicatorProps {
  state: CellState;
  content?: string;
  onClick?: () => void;
}

export function CellStateIndicator({ state, content, onClick }: CellStateIndicatorProps) {
  const handleClick = () => {
    if (onClick && (state === 'complete' || state === 'error')) {
      onClick();
    }
  };

  if (state === 'empty') {
    return (
      <div className="text-gray-400 text-sm py-2">
        --
      </div>
    );
  }

  if (state === 'queued') {
    return (
      <div className="flex items-center gap-2 text-amber-600 py-2">
        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span className="text-sm">Queued...</span>
      </div>
    );
  }

  if (state === 'running') {
    return (
      <div className="flex items-center gap-2 text-blue-600 py-2">
        <svg
          className="w-4 h-4 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="text-sm">Running...</span>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="flex items-center gap-2 text-red-600 py-2 hover:bg-red-50 rounded px-2 -mx-2 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm">Error - Click to retry</span>
      </button>
    );
  }

  // Complete state - show preview with click to expand
  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-left w-full py-1 hover:bg-gray-50 rounded transition-colors group"
    >
      <div className="flex items-start gap-2">
        <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <div className="text-sm text-gray-700 line-clamp-2 flex-1">
          {content || 'Generated'}
        </div>
      </div>
      <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity mt-1 ml-6">
        Click to view/edit
      </div>
    </button>
  );
}
