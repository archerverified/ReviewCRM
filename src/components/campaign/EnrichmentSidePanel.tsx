'use client';

import { useState } from 'react';
import { EnrichmentType, EnrichmentOption, ENRICHMENT_OPTIONS, PROMPT_VARIABLES } from '@/types/campaign';
import { Button } from '@/components/ui/button';

interface EnrichmentSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
}

export function EnrichmentSidePanel({
  isOpen,
  onClose,
  selectedCount,
  onGenerate,
  isGenerating,
}: EnrichmentSidePanelProps) {
  const [selectedType, setSelectedType] = useState<EnrichmentType>('complete_prompt');
  const [prompt, setPrompt] = useState(ENRICHMENT_OPTIONS[0].defaultPrompt || '');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOptions = ENRICHMENT_OPTIONS.filter((opt) =>
    opt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opt.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectType = (option: EnrichmentOption) => {
    setSelectedType(option.id);
    if (option.defaultPrompt) {
      setPrompt(option.defaultPrompt);
    }
  };

  const handleGenerate = () => {
    if (prompt.trim() && selectedCount > 0) {
      onGenerate(prompt);
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'sparkles':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        );
      case 'document':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'chat':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'code':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Enrich Data</h2>
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search enrichment types..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Enrichment Types */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Enrichment Type
          </label>
          <div className="space-y-2">
            {filteredOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelectType(option)}
                className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                  selectedType === option.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`p-2 rounded-lg ${selectedType === option.id ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>
                  {getIcon(option.icon)}
                </div>
                <div className="flex-1">
                  <div className={`font-medium ${selectedType === option.id ? 'text-purple-900' : 'text-gray-900'}`}>
                    {option.name}
                  </div>
                  <div className={`text-sm ${selectedType === option.id ? 'text-purple-700' : 'text-gray-500'}`}>
                    {option.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Configuration */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            placeholder="Enter your prompt..."
          />
        </div>

        {/* Available Variables */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Available Variables
          </label>
          <div className="flex flex-wrap gap-2">
            {PROMPT_VARIABLES.map((variable) => (
              <button
                key={variable.name}
                type="button"
                onClick={() => setPrompt((prev) => prev + ` {${variable.name}}`)}
                className="px-2 py-1 text-xs rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                title={variable.description}
              >
                {`{${variable.name}}`}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            Click to insert. Variables are automatically replaced with row data.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-6 space-y-3">
        {/* Selection Info */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Selected rows:</span>
          <span className="font-medium text-gray-900">{selectedCount}</span>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={selectedCount === 0 || !prompt.trim() || isGenerating}
          loading={isGenerating}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isGenerating ? 'Generating...' : `Generate for ${selectedCount} row${selectedCount !== 1 ? 's' : ''}`}
        </Button>
      </div>
    </div>
  );
}
