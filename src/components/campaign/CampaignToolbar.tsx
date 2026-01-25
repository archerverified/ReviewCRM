'use client';

import { ExportButton } from '@/components/ExportButton';
import type { Business, Campaign } from '@/types';
import type { BatchProgress } from '@/types/campaign';

interface CampaignToolbarProps {
  campaign: Campaign;
  businesses: Business[];
  selectedCount: number;
  progress: BatchProgress | null;
  onEnrichClick: () => void;
}

export function CampaignToolbar({
  campaign,
  businesses,
  selectedCount,
  progress,
  onEnrichClick,
}: CampaignToolbarProps) {
  const getStatusBadge = () => {
    const statusColors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      generating: 'bg-yellow-100 text-yellow-700',
      ready: 'bg-green-100 text-green-700',
      exported: 'bg-blue-100 text-blue-700',
      active: 'bg-purple-100 text-purple-700',
      paused: 'bg-orange-100 text-orange-700',
      completed: 'bg-gray-100 text-gray-700',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[campaign.status] || statusColors.draft}`}>
        {campaign.status}
      </span>
    );
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Campaign Info */}
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-gray-900">{campaign.name}</h1>
              {getStatusBadge()}
            </div>
            {campaign.description && (
              <p className="text-sm text-gray-500 mt-0.5">{campaign.description}</p>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Running Cells Indicator */}
          {progress && progress.running && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-lg">
              <svg
                className="w-4 h-4 text-purple-600 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
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
              <span className="text-sm font-medium text-purple-700">
                {progress.completed}/{progress.total} cells
              </span>
            </div>
          )}

          {/* Enrich Data Button */}
          <button
            type="button"
            onClick={onEnrichClick}
            disabled={selectedCount === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
              selectedCount > 0
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Enrich Data
            {selectedCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                {selectedCount}
              </span>
            )}
          </button>

          {/* Export Button */}
          <ExportButton
            businesses={businesses.filter((b) => b.outreach_message || b.personalized_message)}
            campaignName={campaign.name}
          />
        </div>
      </div>
    </div>
  );
}
