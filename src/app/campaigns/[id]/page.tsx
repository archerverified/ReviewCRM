'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase, businessQueries } from '@/lib/supabase';
import { Campaign, Business, PlusvibeExportRow } from '@/types';
import { CellState, BatchProgress } from '@/types/campaign';
import {
  CampaignToolbar,
  CellDetailPanel,
  CellStateIndicator,
  EnrichmentSidePanel,
} from '@/components/campaign';
import { toast } from 'sonner';

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Panel states
  const [showEnrichPanel, setShowEnrichPanel] = useState(false);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  // Generation state
  const [cellStates, setCellStates] = useState<Map<string, CellState>>(new Map());
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);

  const campaignId = params.id as string;

  useEffect(() => {
    loadData();
  }, [campaignId]);

  async function loadData() {
    setLoading(true);

    const [campaignRes, businessesRes] = await Promise.all([
      supabase.from('campaigns').select('*').eq('id', campaignId).single(),
      supabase.from('businesses').select('*').eq('campaign_id', campaignId),
    ]);

    if (campaignRes.data) setCampaign(campaignRes.data as Campaign);
    if (businessesRes.data) setBusinesses(businessesRes.data as Business[]);

    setLoading(false);
  }

  // Toggle row selection
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Toggle all selection
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === businesses.length && businesses.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(businesses.map((b) => b.id)));
    }
  }, [businesses, selectedIds.size]);

  // Open detail panel for a cell
  const handleCellClick = useCallback((business: Business) => {
    setSelectedBusiness(business);
    setShowDetailPanel(true);
    setShowEnrichPanel(false);
  }, []);

  // Save message from detail panel
  const handleSaveMessage = useCallback(async (businessId: string, message: string) => {
    try {
      await businessQueries.updateOutreachMessage(businessId, message);

      // Update local state
      setBusinesses((prev) =>
        prev.map((b) => (b.id === businessId ? { ...b, outreach_message: message } : b))
      );

      toast.success('Message saved');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Save failed: ${errorMessage}`);
      throw error;
    }
  }, []);

  // Handle batch generation from enrich panel
  const handleGenerate = useCallback(
    async (prompt: string) => {
      const selectedList = businesses.filter((b) => selectedIds.has(b.id));
      if (selectedList.length === 0) return;

      // Initialize cell states
      const newStates = new Map<string, CellState>();
      selectedList.forEach((b) => newStates.set(b.id, 'queued'));
      setCellStates(newStates);

      // Set batch progress
      setBatchProgress({
        total: selectedList.length,
        completed: 0,
        failed: 0,
        running: true,
      });

      // Update campaign status
      await supabase
        .from('campaigns')
        .update({ status: 'generating' })
        .eq('id', campaignId);

      // Process in smaller batches for better UX
      const batchSize = 5;
      let completed = 0;
      let failed = 0;

      for (let i = 0; i < selectedList.length; i += batchSize) {
        const batch = selectedList.slice(i, i + batchSize);

        // Mark batch as running
        const runningStates = new Map(cellStates);
        batch.forEach((b) => runningStates.set(b.id, 'running'));
        setCellStates(runningStates);

        try {
          const response = await fetch('/api/generate-batch-messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              businesses: batch.map((b) => ({
                id: b.id,
                business_name: b.business_name,
                city: b.city,
                google_rating: b.google_rating,
                total_reviews: b.total_reviews,
                one_star_reviews: b.one_star_reviews,
                two_star_reviews: b.two_star_reviews,
                total_media_reviews: b.total_media_reviews,
                projected_rating: b.projected_rating,
                industry: b.industry,
              })),
              prompt,
              campaignDescription: campaign?.description,
              template: campaign?.message_template,
            }),
          });

          if (!response.ok) {
            throw new Error('Generation failed');
          }

          const data = await response.json();

          // Update states and local data
          const updatedStates = new Map(cellStates);
          const messageMap = new Map<string, string>();

          data.results.forEach(
            (result: { businessId: string; success: boolean; message?: string }) => {
              if (result.success && result.message) {
                updatedStates.set(result.businessId, 'complete');
                messageMap.set(result.businessId, result.message);
                completed++;
              } else {
                updatedStates.set(result.businessId, 'error');
                failed++;
              }
            }
          );

          setCellStates(updatedStates);

          // Update businesses with messages
          setBusinesses((prev) =>
            prev.map((b) =>
              messageMap.has(b.id) ? { ...b, outreach_message: messageMap.get(b.id)! } : b
            )
          );

          // Update progress
          setBatchProgress((prev) =>
            prev
              ? {
                  ...prev,
                  completed: completed,
                  failed: failed,
                }
              : null
          );
        } catch (error) {
          // Mark batch as error
          const errorStates = new Map(cellStates);
          batch.forEach((b) => {
            errorStates.set(b.id, 'error');
            failed++;
          });
          setCellStates(errorStates);
        }

        // Small delay between batches
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      // Complete
      setBatchProgress((prev) =>
        prev ? { ...prev, running: false, completed, failed } : null
      );

      // Update campaign status
      await supabase
        .from('campaigns')
        .update({ status: 'ready', generated_count: completed })
        .eq('id', campaignId);

      // Reload data
      await loadData();

      // Show summary
      if (completed > 0) {
        toast.success(`Generated ${completed} message${completed !== 1 ? 's' : ''}`);
      }
      if (failed > 0) {
        toast.error(`${failed} message${failed !== 1 ? 's' : ''} failed`);
      }

      // Close enrich panel
      setShowEnrichPanel(false);
      setSelectedIds(new Set());
    },
    [businesses, selectedIds, campaignId, campaign, cellStates]
  );

  // Export to Plusvibe
  function handleExportPlusvibe() {
    if (!campaign) return;

    const rows: PlusvibeExportRow[] = businesses
      .filter((b) => b.personalized_message || b.outreach_message)
      .map((b) => {
        const nameParts = b.business_name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        return {
          FirstName: firstName,
          LastName: lastName,
          Email: b.email || '',
          CompanyName: b.business_name,
          City: b.city || '',
          Phone: b.phone || '',
          MediaReviews: b.total_media_reviews,
          ProjectValue: b.total_project_value,
          PersonalizedMessage: b.outreach_message || b.personalized_message || '',
        };
      });

    const headers = Object.keys(rows[0] || {}).join(',');
    const csvRows = rows.map((row) =>
      Object.values(row)
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = [headers, ...csvRows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${campaign.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    supabase.from('campaigns').update({ status: 'exported' }).eq('id', campaignId);

    toast.success('Exported successfully');
  }

  // Get cell state for a business
  const getCellState = (businessId: string): CellState => {
    if (cellStates.has(businessId)) {
      return cellStates.get(businessId)!;
    }
    const business = businesses.find((b) => b.id === businessId);
    if (business?.outreach_message || business?.personalized_message) {
      return 'complete';
    }
    return 'empty';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Campaign not found</p>
      </div>
    );
  }

  const messagesGenerated = businesses.filter(
    (b) => b.personalized_message || b.outreach_message
  ).length;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Toolbar */}
      <CampaignToolbar
        campaign={campaign}
        businesses={businesses}
        selectedCount={selectedIds.size}
        progress={batchProgress}
        onEnrichClick={() => {
          setShowEnrichPanel(true);
          setShowDetailPanel(false);
        }}
      />

      {/* Stats Bar */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-8 text-sm">
          <div>
            <span className="text-gray-500">Total:</span>
            <span className="ml-2 font-medium text-gray-900">{businesses.length}</span>
          </div>
          <div>
            <span className="text-gray-500">Generated:</span>
            <span className="ml-2 font-medium text-green-600">{messagesGenerated}</span>
          </div>
          <div>
            <span className="text-gray-500">Pipeline Value:</span>
            <span className="ml-2 font-medium text-gray-900">
              ${businesses.reduce((sum, b) => sum + b.total_project_value, 0).toLocaleString()}
            </span>
          </div>
          {selectedIds.size > 0 && (
            <div className="ml-auto">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                {selectedIds.size} selected
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === businesses.length && businesses.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left w-12 text-xs font-medium text-gray-500">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Business
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  City
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Reviews
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Project Value
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-[200px]">
                  AI Outreach
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {businesses.map((business, index) => {
                const state = getCellState(business.id);
                const isSelected = selectedIds.has(business.id);

                return (
                  <tr
                    key={business.id}
                    className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(business.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{business.business_name}</div>
                      <div className="text-sm text-gray-500">{business.email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{business.city || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <span className="font-medium">{business.total_media_reviews}</span>
                        <span className="text-gray-500"> media</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      ${business.total_project_value.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <CellStateIndicator
                        state={state}
                        content={business.outreach_message || business.personalized_message || undefined}
                        onClick={() => handleCellClick(business)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Empty state */}
          {businesses.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No businesses in this campaign.</p>
            </div>
          )}
        </div>

        {/* Overlay for panels */}
        {(showEnrichPanel || showDetailPanel) && (
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => {
              setShowEnrichPanel(false);
              setShowDetailPanel(false);
            }}
          />
        )}

        {/* Enrichment Side Panel */}
        <EnrichmentSidePanel
          isOpen={showEnrichPanel}
          onClose={() => setShowEnrichPanel(false)}
          selectedCount={selectedIds.size}
          onGenerate={handleGenerate}
          isGenerating={batchProgress?.running || false}
        />

        {/* Cell Detail Panel */}
        <CellDetailPanel
          isOpen={showDetailPanel}
          onClose={() => setShowDetailPanel(false)}
          business={selectedBusiness}
          onSave={handleSaveMessage}
          onRegenerate={(id) => {
            setSelectedIds(new Set([id]));
            setShowDetailPanel(false);
            setShowEnrichPanel(true);
          }}
        />
      </div>
    </div>
  );
}
