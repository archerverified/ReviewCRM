'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from './Button';

interface CustomFieldInputProps {
  onSave: (name: string) => void;
  onCancel: () => void;
  placeholder?: string;
}

const validateFieldName = (name: string): { valid: boolean; error?: string } => {
  if (!name.trim()) {
    return { valid: false, error: 'Field name is required' };
  }

  if (name.length < 3 || name.length > 50) {
    return { valid: false, error: 'Field name must be 3-50 characters' };
  }

  const validPattern = /^[a-z0-9_]+$/;
  if (!validPattern.test(name)) {
    return { valid: false, error: 'Use only lowercase letters, numbers, and underscores' };
  }

  if (/^[0-9]/.test(name)) {
    return { valid: false, error: 'Field name cannot start with a number' };
  }

  const reservedWords = ['select', 'from', 'where', 'order', 'by', 'group', 'table', 'insert', 'update', 'delete'];
  if (reservedWords.includes(name.toLowerCase())) {
    return { valid: false, error: 'This name is reserved, please choose another' };
  }

  return { valid: true };
};

export function CustomFieldInput({ onSave, onCancel, placeholder = 'e.g., lead_source' }: CustomFieldInputProps) {
  const [value, setValue] = useState('');
  const [validation, setValidation] = useState<{ valid: boolean; error?: string }>({ valid: false });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (value) {
      setValidation(validateFieldName(value));
    } else {
      setValidation({ valid: false });
    }
  }, [value]);

  const handleSave = () => {
    if (validation.valid) {
      onSave(value);
      setValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && validation.valid) {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="bg-clay-50 border border-clay-200 rounded-lg p-3 mt-1" role="group" aria-labelledby="custom-field-label">
      <label id="custom-field-label" className="sr-only">
        Enter custom field name
      </label>

      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`
              w-full font-mono text-sm rounded-lg px-3 py-2
              focus:outline-none focus:ring-2 focus:ring-blue-500
              transition-colors
              ${!value ? 'border border-clay-300 bg-white' :
                validation.valid ? 'border border-green-400 bg-green-50/30' :
                'border border-red-400 bg-red-50/30'}
            `}
            aria-invalid={value ? !validation.valid : undefined}
            aria-describedby="field-helper field-error"
            aria-required={true}
          />

          {value && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {validation.valid ? (
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
          )}
        </div>

        <Button
          size="sm"
          onClick={handleSave}
          disabled={!validation.valid}
          className="px-3 py-1 text-xs"
        >
          Save
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="px-2 py-1 text-xs"
        >
          Cancel
        </Button>
      </div>

      <div className="mt-2">
        <span id="field-helper" className="text-xs text-clay-500">
          Use lowercase with underscores
        </span>

        {value && !validation.valid && validation.error && (
          <span id="field-error" role="alert" className="block text-xs text-red-600 font-medium mt-1">
            {validation.error}
          </span>
        )}
      </div>
    </div>
  );
}
