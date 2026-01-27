'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase, businessQueries, campaignSequenceQueries } from '@/lib/supabase';
import { Campaign, Business, PlusvibeExportRow, CampaignSequence } from '@/types';
import { CellState, BatchProgress } from '@/types/campaign';
import {
  CampaignToolbar,
  CellDetailPanel,
  CellStateIndicator,
  EnrichmentSidePanel,
} from '@/components/campaign';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import {
  Settings,
  Mail,
  Clock,
  ChevronRight,
  Plus,
  Trash2,
  Edit,
  Download,
  Check,
  AlertCircle,
  Loader2,
  Users,
  DollarSign,
  Building2,
  GripVertical,
} from 'lucide-react';

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

  // Sequence state
  const [sequences, setSequences] = useState<CampaignSequence[]>([]);
  const [showSequenceModal, setShowSequenceModal] = useState(false);
  const [editingSequence, setEditingSequence] = useState<CampaignSequence | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Delete campaign state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const campaignId = params.id as string;

  useEffect(() => {
    loadData();
  }, [campaignId]);

  async function loadData() {
    setLoading(true);

    const [campaignRes, businessesRes, sequencesRes] = await Promise.all([
      supabase.from('campaigns').select('*').eq('id', campaignId).single(),
      supabase.from('businesses').select('*').eq('campaign_id', campaignId),
      campaignSequenceQueries.getByCampaign(campaignId),
    ]);

    if (campaignRes.data) setCampaign(campaignRes.data as Campaign);
    if (businessesRes.data) setBusinesses(businessesRes.data as Business[]);
    setSequences(sequencesRes);

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

  // Export to different formats
  function handleExportFormat(format: 'csv' | 'xlsx' | 'json', selectedOnly = false) {
    if (!campaign) return;

    const dataToExport = selectedOnly
      ? businesses.filter((b) => selectedIds.has(b.id) && (b.personalized_message || b.outreach_message))
      : businesses.filter((b) => b.personalized_message || b.outreach_message);

    if (dataToExport.length === 0) {
      toast.error('No data to export');
      return;
    }

    const exportData = dataToExport.map((b) => ({
      business_name: b.business_name,
      contact_name: b.contact_name || '',
      email: b.email || '',
      phone: b.phone || '',
      city: b.city || '',
      total_reviews: b.total_reviews,
      total_media_reviews: b.total_media_reviews,
      project_value: b.total_project_value,
      outreach_message: b.outreach_message || b.personalized_message || '',
    }));

    const filename = `${campaign.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;

    if (format === 'csv') {
      const headers = Object.keys(exportData[0]).join(',');
      const csvRows = exportData.map((row) =>
        Object.values(row)
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      );
      const csv = [headers, ...csvRows].join('\n');
      downloadFile(csv, `${filename}.csv`, 'text/csv');
    } else if (format === 'xlsx') {
      // For XLSX, we'll create a simple CSV that can be opened in Excel
      // Full xlsx support would require the xlsx library
      const headers = Object.keys(exportData[0]).join('\t');
      const tsvRows = exportData.map((row) =>
        Object.values(row)
          .map((v) => String(v).replace(/\t/g, ' '))
          .join('\t')
      );
      const tsv = [headers, ...tsvRows].join('\n');
      downloadFile(tsv, `${filename}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      toast.info('Note: Opens as tab-separated values in Excel');
    } else if (format === 'json') {
      const json = JSON.stringify(exportData, null, 2);
      downloadFile(json, `${filename}.json`, 'application/json');
    }

    toast.success(`Exported ${dataToExport.length} records to ${format.toUpperCase()}`);
  }

  function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
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

  // Sequence management
  async function handleAddSequence(data: Partial<CampaignSequence>) {
    try {
      const newSequence = await campaignSequenceQueries.create({
        ...data,
        campaign_id: campaignId,
        step_number: sequences.length + 1,
      });
      setSequences([...sequences, newSequence]);
      setShowSequenceModal(false);
      toast.success('Sequence step added');
    } catch (error) {
      toast.error('Failed to add sequence step');
    }
  }

  async function handleUpdateSequence(id: string, data: Partial<CampaignSequence>) {
    try {
      const updated = await campaignSequenceQueries.update(id, data);
      setSequences(sequences.map(s => s.id === id ? updated : s));
      setEditingSequence(null);
      toast.success('Sequence step updated');
    } catch (error) {
      toast.error('Failed to update sequence step');
    }
  }

  async function handleDeleteSequence(id: string) {
    try {
      await campaignSequenceQueries.delete(id);
      setSequences(sequences.filter(s => s.id !== id));
      toast.success('Sequence step deleted');
    } catch (error) {
      toast.error('Failed to delete sequence step');
    }
  }

  // Delete campaign
  async function handleDeleteCampaign() {
    if (!campaign) return;
    setIsDeleting(true);
    try {
      // First, unassign businesses from this campaign
      await supabase
        .from('businesses')
        .update({ campaign_id: null })
        .eq('campaign_id', campaignId);

      // Delete campaign sequences
      await supabase
        .from('campaign_sequences')
        .delete()
        .eq('campaign_id', campaignId);

      // Delete the campaign
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;

      toast.success('Campaign deleted');
      router.push('/campaigns');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to delete campaign: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  // Update campaign settings
  async function handleUpdateCampaign(updates: Partial<Campaign>) {
    if (!campaign) return;
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', campaignId);

      if (error) throw error;

      setCampaign({ ...campaign, ...updates });
      setShowSettingsModal(false);
      toast.success('Campaign updated');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to update campaign: ${errorMessage}`);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Header Skeleton */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg w-64 animate-pulse"></div>
        </div>

        {/* Stats Bar Skeleton */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-16 animate-pulse"></div>
                  <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-20 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel Skeleton */}
          <div className="w-80 border-r border-gray-200 bg-white p-4 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>

          {/* Table Skeleton */}
          <div className="flex-1 p-6 space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-16 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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

      {/* Enhanced Stats Bar */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-8">
          {/* Total Businesses */}
          <div className="flex items-center gap-3 group transition-all hover:scale-105">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs text-gray-600 font-medium">Total Businesses</div>
              <div className="text-lg font-bold text-gray-900">{businesses.length}</div>
            </div>
          </div>

          {/* Messages Generated */}
          <div className="flex items-center gap-3 group transition-all hover:scale-105">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs text-gray-600 font-medium">Generated</div>
              <div className="text-lg font-bold text-green-600">{messagesGenerated}</div>
            </div>
          </div>

          {/* Pipeline Value */}
          <div className="flex items-center gap-3 group transition-all hover:scale-105">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs text-gray-600 font-medium">Pipeline Value</div>
              <div className="text-lg font-bold text-gray-900">
                ${businesses.reduce((sum, b) => sum + b.total_project_value, 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Selection Badge */}
          {selectedIds.size > 0 && (
            <div className="ml-auto mr-4">
              <span className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-semibold shadow-md flex items-center gap-2 animate-in fade-in slide-in-from-right">
                <Users className="w-4 h-4" />
                {selectedIds.size} selected
              </span>
            </div>
          )}

          {/* Settings & Delete Buttons */}
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowSettingsModal(true)}
              className="shadow-sm"
            >
              <Settings className="w-4 h-4 mr-1" />
              Settings
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="shadow-sm"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Table Panel */}
        <div className="flex-1 overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            {/* Enhanced Table Header */}
            <thead className="bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-4 text-left w-12">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === businesses.length && businesses.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 h-4 w-4 transition-all hover:scale-110 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-4 text-left w-12">
                  <GripVertical className="w-4 h-4 text-gray-400" />
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Business
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  City
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Reviews
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Project Value
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[200px]">
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
                    className={`transition-all hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 ${
                      isSelected ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(business.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 h-4 w-4 transition-all hover:scale-110 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-400">{index + 1}</td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-900">{business.business_name}</div>
                      <div className="text-sm text-gray-500">{business.email}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">{business.city || '-'}</td>
                    <td className="px-4 py-4">
                      <div className="text-sm">
                        <span className="font-semibold text-gray-900">{business.total_media_reviews}</span>
                        <span className="text-gray-500 ml-1">media</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-bold text-gray-900">
                        ${business.total_project_value.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-4">
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
            <div className="text-center py-16">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No businesses in this campaign.</p>
              <p className="text-sm text-gray-400 mt-1">Import businesses to get started.</p>
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

      {/* Add/Edit Sequence Modal */}
      <SequenceModal
        isOpen={showSequenceModal || !!editingSequence}
        onClose={() => {
          setShowSequenceModal(false);
          setEditingSequence(null);
        }}
        sequence={editingSequence}
        onSave={(data) => {
          if (editingSequence) {
            handleUpdateSequence(editingSequence.id, data);
          } else {
            handleAddSequence(data);
          }
        }}
      />

      {/* Campaign Settings Modal */}
      <CampaignSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        campaign={campaign}
        onSave={handleUpdateCampaign}
        sequences={sequences}
        onAddSequence={() => {
          setShowSettingsModal(false);
          setShowSequenceModal(true);
        }}
        onEditSequence={(seq) => {
          setShowSettingsModal(false);
          setEditingSequence(seq);
        }}
        onDeleteSequence={handleDeleteSequence}
        onExportPlusvibe={handleExportPlusvibe}
        onExportFormat={handleExportFormat}
        selectedCount={selectedIds.size}
        hasGeneratedMessages={businesses.filter(b => b.personalized_message || b.outreach_message).length > 0}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Campaign"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              Are you sure you want to delete <strong>{campaign.name}</strong>?
            </p>
            <p className="text-sm text-red-600 mt-2">
              This will remove all businesses from this campaign (but not delete them). This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteCampaign} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Campaign
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Enhanced Sequence Modal Component
function SequenceModal({
  isOpen,
  onClose,
  sequence,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  sequence: CampaignSequence | null;
  onSave: (data: Partial<CampaignSequence>) => void;
}) {
  const [subject, setSubject] = useState(sequence?.subject_template || '');
  const [body, setBody] = useState(sequence?.body_template || '');
  const [delayDays, setDelayDays] = useState(sequence?.delay_days?.toString() || '0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (sequence) {
      setSubject(sequence.subject_template);
      setBody(sequence.body_template);
      setDelayDays(sequence.delay_days.toString());
    } else {
      setSubject('');
      setBody('');
      setDelayDays('0');
    }
  }, [sequence]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave({
        subject_template: subject,
        body_template: body,
        delay_days: parseInt(delayDays) || 0,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={sequence ? 'Edit Sequence Step' : 'Add Sequence Step'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            label="Subject Line"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Re: Quick question about {{business_name}}"
            required
          />
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <Mail className="w-3 h-3" />
            This will be the email subject line
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Email Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 h-48 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Hi {{contact_name}},

I wanted to follow up on my previous email about improving your Google rating...

Use {{variable_name}} for personalization."
            required
          />
          <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800 font-medium mb-1">Available Variables:</p>
            <div className="flex flex-wrap gap-2">
              {['business_name', 'contact_name', 'city', 'total_media_reviews', 'projected_rating'].map((variable) => (
                <span key={variable} className="px-2 py-1 bg-white text-blue-700 text-xs font-mono rounded border border-blue-300">
                  {'{{' + variable + '}}'}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div>
          <Input
            label="Delay (days)"
            type="number"
            min="0"
            value={delayDays}
            onChange={(e) => setDelayDays(e.target.value)}
            placeholder="0"
          />
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Days after the previous step (or campaign start) to send this email
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                {sequence ? 'Update Step' : 'Add Step'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Campaign Settings Modal Component
function CampaignSettingsModal({
  isOpen,
  onClose,
  campaign,
  onSave,
  sequences,
  onAddSequence,
  onEditSequence,
  onDeleteSequence,
  onExportPlusvibe,
  onExportFormat,
  selectedCount,
  hasGeneratedMessages,
}: {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign;
  onSave: (updates: Partial<Campaign>) => void;
  sequences: CampaignSequence[];
  onAddSequence: () => void;
  onEditSequence: (seq: CampaignSequence) => void;
  onDeleteSequence: (id: string) => void;
  onExportPlusvibe: () => void;
  onExportFormat: (format: 'csv' | 'xlsx' | 'json', selectedOnly?: boolean) => void;
  selectedCount: number;
  hasGeneratedMessages: boolean;
}) {
  const [name, setName] = useState(campaign.name);
  const [description, setDescription] = useState(campaign.description || '');
  const [status, setStatus] = useState(campaign.status);
  const [activeTab, setActiveTab] = useState<'settings' | 'sequences' | 'export'>('settings');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(campaign.name);
    setDescription(campaign.description || '');
    setStatus(campaign.status);
  }, [campaign]);

  async function handleSave() {
    setIsSaving(true);
    try {
      await onSave({ name, description, status });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Campaign Settings" size="lg">
      <div className="min-h-[400px]">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          {(['settings', 'sequences', 'export'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'settings' && <Settings className="w-4 h-4 inline mr-1" />}
              {tab === 'sequences' && <Mail className="w-4 h-4 inline mr-1" />}
              {tab === 'export' && <Download className="w-4 h-4 inline mr-1" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div>
              <Input
                label="Campaign Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Campaign name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Campaign description..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Campaign['status'])}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="ready">Ready</option>
                <option value="generating">Generating</option>
                <option value="exported">Exported</option>
                <option value="paused">Paused</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Sequences Tab */}
        {activeTab === 'sequences' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">Manage your email sequence steps.</p>
              <Button size="sm" onClick={onAddSequence}>
                <Plus className="w-4 h-4 mr-1" />
                Add Step
              </Button>
            </div>
            {sequences.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <Mail className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="font-medium text-gray-600">No sequence steps yet</p>
                <p className="text-xs text-gray-500 mt-1">Add steps to create a multi-step campaign</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {sequences.map((seq) => (
                  <div
                    key={seq.id}
                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm">
                        {seq.step_number}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{seq.subject_template}</p>
                        <p className="text-xs text-gray-500">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {seq.delay_days > 0 ? `+${seq.delay_days} days` : 'Immediate'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditSequence(seq)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteSequence(seq.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Export generated messages in your preferred format.</p>
            {hasGeneratedMessages ? (
              <div className="space-y-3">
                <button
                  onClick={onExportPlusvibe}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export to CSV (Plusvibe Format)
                </button>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => onExportFormat('csv')}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    CSV
                  </button>
                  <button
                    onClick={() => onExportFormat('xlsx')}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Excel
                  </button>
                  <button
                    onClick={() => onExportFormat('json')}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    JSON
                  </button>
                </div>
                {selectedCount > 0 && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-blue-600 mb-2 font-medium">{selectedCount} rows selected</p>
                    <button
                      onClick={() => onExportFormat('csv', true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      Export Selected Only
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-700">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  Generate messages first to enable export options.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
