'use client';

import { useState, useRef, useEffect } from 'react';

interface OutreachMessageCellProps {
  businessId: string;
  message: string | null;
  onSave: (businessId: string, message: string) => Promise<void>;
  onGenerateSingle?: (businessId: string) => void;
  isGenerating?: boolean;
}

export function OutreachMessageCell({
  businessId,
  message,
  onSave,
  onGenerateSingle,
  isGenerating = false,
}: OutreachMessageCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message || '');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset edit value when message changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditValue(message || '');
    }
  }, [message, isEditing]);

  // Auto-resize textarea
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    if (!isGenerating && !isSaving) {
      setIsEditing(true);
      setEditValue(message || '');
    }
  };

  const handleSave = async () => {
    const trimmedValue = editValue.trim();

    // Only save if value changed
    if (trimmedValue !== (message || '').trim()) {
      setIsSaving(true);
      try {
        await onSave(businessId, trimmedValue);
      } finally {
        setIsSaving(false);
      }
    }

    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditValue(message || '');
      setIsEditing(false);
    } else if (e.key === 'Enter' && e.metaKey) {
      handleSave();
    }
  };

  // Generating state
  if (isGenerating) {
    return (
      <div className="flex items-center gap-2 text-gray-400 py-2">
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
        <span className="text-sm">Generating...</span>
      </div>
    );
  }

  // Saving state
  if (isSaving) {
    return (
      <div className="flex items-center gap-2 text-gray-400 py-2">
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
        <span className="text-sm">Saving...</span>
      </div>
    );
  }

  // Edit mode
  if (isEditing) {
    return (
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="w-full min-h-[80px] px-2 py-1 text-sm border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Enter outreach message..."
        />
        <div className="absolute bottom-1 right-1 text-xs text-gray-400">
          Cmd+Enter to save, Esc to cancel
        </div>
      </div>
    );
  }

  // Empty state
  if (!message) {
    return (
      <button
        type="button"
        onClick={onGenerateSingle ? () => onGenerateSingle(businessId) : handleStartEdit}
        className="flex items-center gap-2 text-gray-400 hover:text-gray-600 py-2 transition-colors group"
      >
        <svg
          className="w-4 h-4"
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
        <span className="text-sm group-hover:underline">
          {onGenerateSingle ? 'Generate' : 'Add message'}
        </span>
      </button>
    );
  }

  // Display mode with message
  return (
    <button
      type="button"
      onClick={handleStartEdit}
      className="text-left w-full py-1 hover:bg-gray-50 rounded transition-colors group"
    >
      <div className="text-sm text-gray-700 line-clamp-3">
        {message}
      </div>
      <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
        Click to edit
      </div>
    </button>
  );
}
