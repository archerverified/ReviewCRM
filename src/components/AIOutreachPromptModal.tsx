'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import type { Business } from '@/types';

interface AIOutreachPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBusinesses: Business[];
  onGenerate: (prompt: string, campaignDescription?: string, template?: string) => Promise<void>;
}

export function AIOutreachPromptModal({
  isOpen,
  onClose,
  selectedBusinesses,
  onGenerate,
}: AIOutreachPromptModalProps) {
  const [prompt, setPrompt] = useState(
    'Create a personalized cold outreach message for this business using their data. The message should be professional, concise (3-4 sentences), and highlight how we can help improve their Google rating by removing negative reviews with media.'
  );
  const [campaignDescription, setCampaignDescription] = useState('');
  const [template, setTemplate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setProgress({ current: 0, total: selectedBusinesses.length });

    try {
      await onGenerate(prompt, campaignDescription || undefined, template || undefined);
    } finally {
      setIsGenerating(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Generate AI Outreach Messages"
      size="lg"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            loading={isGenerating}
            disabled={!prompt.trim() || isGenerating}
          >
            {isGenerating
              ? `Generating ${progress.current}/${progress.total}...`
              : `Generate for ${selectedBusinesses.length} row${selectedBusinesses.length !== 1 ? 's' : ''}`
            }
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Selected count badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
            <svg
              className="w-4 h-4 mr-1.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            {selectedBusinesses.length} business{selectedBusinesses.length !== 1 ? 'es' : ''} selected
          </span>
        </div>

        {/* Main prompt */}
        <div>
          <label htmlFor="ai-prompt" className="block text-sm font-medium text-gray-700 mb-2">
            AI Prompt
          </label>
          <textarea
            id="ai-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            disabled={isGenerating}
            className="w-full px-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="Describe what kind of message you want to generate..."
          />
          <p className="mt-1.5 text-xs text-gray-500">
            Each row&apos;s data (business name, city, reviews, rating) will be injected into the prompt automatically.
          </p>
        </div>

        {/* Advanced options toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Advanced options
        </button>

        {/* Advanced options */}
        {showAdvanced && (
          <div className="space-y-4 pl-6 border-l-2 border-gray-100">
            <div>
              <label htmlFor="campaign-description" className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Description (optional)
              </label>
              <textarea
                id="campaign-description"
                value={campaignDescription}
                onChange={(e) => setCampaignDescription(e.target.value)}
                rows={2}
                disabled={isGenerating}
                className="w-full px-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Describe the campaign context (e.g., targeting restaurants in Chicago)..."
              />
            </div>

            <div>
              <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-2">
                Message Template (optional)
              </label>
              <textarea
                id="template"
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                rows={3}
                disabled={isGenerating}
                className="w-full px-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Provide a template or example message to inspire the AI..."
              />
            </div>
          </div>
        )}

        {/* Progress indicator */}
        {isGenerating && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Generating messages...</span>
              <span className="font-medium text-gray-900">
                {progress.current} / {progress.total}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-600 transition-all duration-300"
                style={{ width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : '0%' }}
              />
            </div>
          </div>
        )}

        {/* Info callout */}
        <div className="flex gap-3 p-4 bg-blue-50 rounded-xl">
          <svg
            className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium">How it works</p>
            <p className="mt-1 text-blue-700">
              The AI will generate a unique, personalized message for each selected row using the business data.
              Messages are saved to the database and can be edited inline before export.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// Export progress update function type for external use
export type ProgressCallback = (current: number, total: number) => void;
