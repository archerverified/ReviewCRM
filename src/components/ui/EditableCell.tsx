'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface EditableCellProps {
  value: string | number;
  onChange: (value: string | number) => void;
  type?: 'text' | 'number' | 'url';
  isEditing: boolean;
  onStartEdit: () => void;
  onEndEdit: () => void;
  className?: string;
}

export function EditableCell({
  value,
  onChange,
  type = 'text',
  isEditing,
  onStartEdit,
  onEndEdit,
  className,
}: EditableCellProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [editValue, setEditValue] = useState(String(value));

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(String(value));
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onChange(type === 'number' ? parseFloat(editValue) || 0 : editValue);
      onEndEdit();
    } else if (e.key === 'Escape') {
      setEditValue(String(value));
      onEndEdit();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      onChange(type === 'number' ? parseFloat(editValue) || 0 : editValue);
      onEndEdit();
    }
  };

  const handleBlur = () => {
    onChange(type === 'number' ? parseFloat(editValue) || 0 : editValue);
    onEndEdit();
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type={type === 'number' ? 'number' : 'text'}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={cn(
          'w-full h-full px-2 py-1.5 text-xs border-2 border-blue-main rounded-sm outline-none bg-white box-border',
          className
        )}
      />
    );
  }

  return (
    <div
      onClick={onStartEdit}
      className={cn(
        'px-3 py-2 cursor-text min-h-[20px] text-xs text-clay-700 overflow-hidden text-ellipsis whitespace-nowrap',
        className
      )}
    >
      {type === 'url' && value ? (
        <a
          href={String(value)}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-blue-main text-xs hover:underline"
        >
          View
        </a>
      ) : (
        value
      )}
    </div>
  );
}
