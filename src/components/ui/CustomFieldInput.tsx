'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from './button';

interface CustomFieldInputProps {
  onSave: (name: string) => void;
  onCancel: () => void;
  placeholder?: string;
}

const validateFieldName = (name: string): { valid: boolean; error?: string } => {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return { valid: false, error: 'Field name is required' };
  }

  if (trimmedName.length < 1 || trimmedName.length > 100) {
    return { valid: false, error: 'Field name must be 1-100 characters' };
  }

  // Allow letters, numbers, spaces, underscores, hyphens, dots, and common punctuation
  // This matches most CSV column headers while preventing problematic characters
  const validPattern = /^[a-zA-Z0-9\s_\-\.,'()&]+$/;
  if (!validPattern.test(trimmedName)) {
    return { valid: false, error: 'Field name contains invalid characters' };
  }

  return { valid: true };
};

export function CustomFieldInput({ onSave, onCancel, placeholder = 'e.g., Atlanta' }: CustomFieldInputProps) {
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
      onSave(value.trim());
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
          Enter the exact column name from your CSV
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
