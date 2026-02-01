'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import type { Business } from '@/types';

interface CellDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  business: Business | null;
  onSave: (businessId: string, message: string) => Promise<void>;
  onRegenerate?: (businessId: string) => void;
}

export function CellDetailPanel({
  isOpen,
  onClose,
  business,
  onSave,
  onRegenerate,
}: CellDetailPanelProps) {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Sync content with business data
  useEffect(() => {
    if (business) {
      setContent(business.outreach_message || business.personalized_message || '');
      setIsDirty(false);
    }
  }, [business]);

  const handleContentChange = (value: string) => {
    setContent(value);
    setIsDirty(value !== (business?.outreach_message || business?.personalized_message || ''));
  };

  const handleSave = async () => {
    if (!business || !isDirty) return;

    setIsSaving(true);
    try {
      await onSave(business.id, content);
      setIsDirty(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerate = () => {
    if (business && onRegenerate) {
      onRegenerate(business.id);
    }
  };

  const handleClose = () => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Discard them?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen || !business) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[480px] bg-white shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{business.business_name}</h2>
          <p className="text-sm text-gray-500">{business.city || 'No location'}</p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Business Info */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Rating:</span>
            <span className="ml-2 font-medium text-gray-900">{business.google_rating || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-500">Reviews:</span>
            <span className="ml-2 font-medium text-gray-900">{business.total_reviews}</span>
          </div>
          <div>
            <span className="text-gray-500">Media:</span>
            <span className="ml-2 font-medium text-gray-900">{business.total_media_reviews}</span>
          </div>
          <div>
            <span className="text-gray-500">Projected:</span>
            <span className="ml-2 font-medium text-green-600">{business.projected_rating || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-500">Tier:</span>
            <span className="ml-2 font-medium text-gray-900 capitalize">{business.pricing_tier || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-500">Value:</span>
            <span className="ml-2 font-medium text-gray-900">${business.total_project_value.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Content Editor */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Generated Message
            </label>
            {isDirty && (
              <span className="text-xs text-amber-600 font-medium">Unsaved changes</span>
            )}
          </div>

          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            rows={12}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="No message generated yet. Select this row and use Enrich Data to generate."
          />

          {/* Character Count */}
          <div className="text-xs text-gray-500 text-right">
            {content.length} characters
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-gray-200 p-6 space-y-3">
        <div className="flex gap-3">
          {onRegenerate && (
            <Button
              variant="secondary"
              onClick={handleRegenerate}
              className="flex-1"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Regenerate
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            loading={isSaving}
            className="flex-1"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
