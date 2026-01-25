'use client';

import { useState } from 'react';
import { Button } from './ui/Button';
import { exportToPlusvibe, downloadCSV, generateExportFilename } from '@/lib/export';
import type { Business } from '@/types';
import { toast } from 'sonner';
import { businessQueries } from '@/lib/supabase';

interface GenerateMessageRequest {
  businessName: string;
  city: string;
  mediaReviews: number;
  negativeReviews: number;
  instructions?: string;
  template?: string;
}

interface GenerateMessageResponse {
  message: string;
}

interface ExportButtonProps {
  businesses: Business[];
  campaignName: string;
  disabled?: boolean;
}

export function ExportButton({ businesses, campaignName, disabled }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleExport = async () => {
    // Validate that we have businesses to export
    if (businesses.length === 0) {
      toast.error('No businesses selected for export');
      return;
    }

    setExporting(true);
    setProgress({ current: 0, total: businesses.length });

    try {
      // Identify businesses that need AI message generation
      const businessesNeedingMessages = businesses.filter(b => !b.personalized_message);

      if (businessesNeedingMessages.length > 0) {
        toast.info(`Generating ${businessesNeedingMessages.length} personalized messages...`);

        const batchSize = 5;
        const updatedBusinesses = [...businesses];
        let successCount = 0;
        let failureCount = 0;

        // Process in batches of 5 concurrent API calls
        for (let i = 0; i < businessesNeedingMessages.length; i += batchSize) {
          const batch = businessesNeedingMessages.slice(i, i + batchSize);

          const results = await Promise.allSettled(
            batch.map(async (business) => {
              try {
                const request: GenerateMessageRequest = {
                  businessName: business.business_name,
                  city: business.city || '',
                  mediaReviews: business.total_media_reviews,
                  negativeReviews: business.one_star_reviews + business.two_star_reviews
                };

                const response = await fetch('/api/generate-message', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(request)
                });

                if (!response.ok) {
                  const error = await response.json();
                  throw new Error(error.error || 'Failed to generate message');
                }

                const data: GenerateMessageResponse = await response.json();

                // Update database with generated message
                await businessQueries.updatePersonalizedMessage(business.id, data.message);

                // Update local state array
                const index = updatedBusinesses.findIndex(b => b.id === business.id);
                if (index !== -1) {
                  updatedBusinesses[index] = {
                    ...updatedBusinesses[index],
                    personalized_message: data.message
                  };
                }

                return { business, message: data.message };
              } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.error(`Failed to generate message for ${business.business_name}:`, errorMessage);
                throw error;
              }
            })
          );

          // Update progress after each batch
          const batchEnd = Math.min(i + batchSize, businessesNeedingMessages.length);
          setProgress({ current: batchEnd, total: businessesNeedingMessages.length });

          // Track successes and failures
          results.forEach(result => {
            if (result.status === 'fulfilled') {
              successCount++;
            } else {
              failureCount++;
            }
          });

          console.log(`Batch ${Math.floor(i / batchSize) + 1}: ${results.filter(r => r.status === 'fulfilled').length}/${batch.length} successful`);
        }

        // Show appropriate toast based on results
        if (failureCount > 0) {
          toast.warning(`Generated ${successCount} messages, ${failureCount} failed`);
        }

        // Export with updated businesses
        const csvContent = exportToPlusvibe(updatedBusinesses, campaignName);
        const filename = generateExportFilename(campaignName);
        downloadCSV(csvContent, filename);

        toast.success(`Exported ${businesses.length} businesses to ${filename}`);
      } else {
        // All businesses already have messages - export immediately
        const csvContent = exportToPlusvibe(businesses, campaignName);
        const filename = generateExportFilename(campaignName);
        downloadCSV(csvContent, filename);

        toast.success(`Exported ${businesses.length} businesses to ${filename}`);
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Export error:', errorMessage);
      toast.error(`Export failed: ${errorMessage}`);
    } finally {
      setExporting(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={disabled || businesses.length === 0 || exporting}
      variant="secondary"
      size="sm"
    >
      {exporting ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Generating... ({progress.current}/{progress.total})
        </>
      ) : (
        <>
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export to Plusvibe ({businesses.length})
        </>
      )}
    </Button>
  );
}
