'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { FilterBar } from '@/components/FilterBar';
import { ImportModal } from '@/components/ImportModal';
import { ExportButton } from '@/components/ExportButton';
import { BusinessDetailModal } from '@/components/BusinessDetailModal';
import { DeleteConfirmationModal } from '@/components/DeleteConfirmationModal';
import { supabase } from '@/lib/supabase';
import type { Business, FilterState, PipelineStage, EmailOutreachStatus, Tag } from '@/types';
import { PIPELINE_STAGES, EMAIL_OUTREACH_STATUSES } from '@/types';
import { toast } from 'sonner';

const EMPTY_FILTERS: FilterState = {
  search: '',
  stages: [],
  emailVerificationStatuses: [],
  emailOutreachStatuses: [],
  tags: [],
  pricingTiers: [],
  cities: [],
  campaigns: []
};

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [showImportModal, setShowImportModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [businesses, filters]);

  async function loadData() {
    setLoading(true);
    try {
      const [businessesRes, tagsRes] = await Promise.all([
        supabase.from('businesses').select('*').order('created_at', { ascending: false }),
        supabase.from('tags').select('*').order('name'),
      ]);

      if (businessesRes.data) setBusinesses(businessesRes.data);
      if (tagsRes.data) setTags(tagsRes.data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to load businesses: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...businesses];

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(b =>
        b.business_name.toLowerCase().includes(search) ||
        b.email?.toLowerCase().includes(search) ||
        b.city?.toLowerCase().includes(search)
      );
    }

    if (filters.stages.length > 0) {
      filtered = filtered.filter(b => filters.stages.includes(b.pipeline_stage));
    }

    if (filters.emailOutreachStatuses.length > 0) {
      filtered = filtered.filter(b => filters.emailOutreachStatuses.includes(b.email_outreach_status));
    }

    if (filters.emailVerificationStatuses.length > 0) {
      filtered = filtered.filter(b => filters.emailVerificationStatuses.includes(b.email_verification_status));
    }

    if (filters.pricingTiers.length > 0) {
      filtered = filtered.filter(b => b.pricing_tier && filters.pricingTiers.includes(b.pricing_tier));
    }

    setFilteredBusinesses(filtered);
  }

  async function handleImportComplete(importedCount: number) {
    setShowImportModal(false);
    await loadData();
    toast.success(`Imported ${importedCount} businesses`);
  }

  async function handleBulkStageUpdate(newStage: PipelineStage) {
    const ids = Array.from(selectedIds);
    try {
      const { error } = await supabase
        .from('businesses')
        .update({ pipeline_stage: newStage, updated_at: new Date().toISOString() })
        .in('id', ids);

      if (error) throw error;

      setBusinesses(businesses.map(b =>
        selectedIds.has(b.id) ? { ...b, pipeline_stage: newStage } : b
      ));

      setSelectedIds(new Set());
      const stageLabel = PIPELINE_STAGES.find(s => s.stage === newStage)?.label || newStage;
      toast.success(`Moved ${ids.length} businesses to ${stageLabel}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Update failed: ${errorMessage}`);
    }
  }

  async function handleBulkEmailStatusUpdate(status: EmailOutreachStatus) {
    const ids = Array.from(selectedIds);
    try {
      const { error } = await supabase
        .from('businesses')
        .update({ email_outreach_status: status, updated_at: new Date().toISOString() })
        .in('id', ids);

      if (error) throw error;

      setBusinesses(businesses.map(b =>
        selectedIds.has(b.id) ? { ...b, email_outreach_status: status } : b
      ));

      setSelectedIds(new Set());
      toast.success(`Updated ${ids.length} businesses to ${status.replace('_', ' ')}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Update failed: ${errorMessage}`);
    }
  }

  function toggleSelection(id: string) {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredBusinesses.length && filteredBusinesses.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredBusinesses.map(b => b.id)));
    }
  }

  const selectedBusinesses = businesses.filter(b => selectedIds.has(b.id));

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    setIsDeleting(true);
    try {
      // Batch deletes to avoid URL length limits (max ~50 IDs per request)
      const BATCH_SIZE = 50;
      const batches: string[][] = [];
      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        batches.push(ids.slice(i, i + BATCH_SIZE));
      }

      // Execute all batches
      for (const batch of batches) {
        const { error } = await supabase
          .from('businesses')
          .delete()
          .in('id', batch);

        if (error) throw error;
      }

      setBusinesses(businesses.filter(b => !selectedIds.has(b.id)));
      setSelectedIds(new Set());
      setShowDeleteModal(false);
      toast.success(`Deleted ${ids.length} business${ids.length === 1 ? '' : 'es'}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Delete failed: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleSingleDelete(businessId: string) {
    try {
      const { error } = await supabase
        .from('businesses')
        .delete()
        .eq('id', businessId);

      if (error) throw error;

      setBusinesses(businesses.filter(b => b.id !== businessId));
      setSelectedBusiness(null);
      toast.success('Business deleted');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Delete failed: ${errorMessage}`);
    }
  }

  async function handleStageChange(businessId: string, newStage: string) {
    try {
      const { error } = await supabase
        .from('businesses')
        .update({ pipeline_stage: newStage, updated_at: new Date().toISOString() })
        .eq('id', businessId);

      if (error) throw error;

      setBusinesses(businesses.map(b =>
        b.id === businessId ? { ...b, pipeline_stage: newStage as PipelineStage } : b
      ));

      // Update selected business if viewing detail
      if (selectedBusiness?.id === businessId) {
        setSelectedBusiness({ ...selectedBusiness, pipeline_stage: newStage as PipelineStage });
      }

      const stageLabel = PIPELINE_STAGES.find(s => s.stage === newStage)?.label || newStage;
      toast.success(`Moved to ${stageLabel}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Update failed: ${errorMessage}`);
    }
  }

  function handleRowClick(business: Business, event: React.MouseEvent) {
    // Don't open detail modal if clicking on checkbox
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' && target.getAttribute('type') === 'checkbox') {
      return;
    }
    setSelectedBusiness(business);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Businesses</h1>
          <p className="text-gray-500 mt-1">
            {filteredBusinesses.length} businesses {selectedIds.size > 0 && `• ${selectedIds.size} selected`}
          </p>
        </div>
        <Button onClick={() => setShowImportModal(true)}>
          Import CSV
        </Button>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        tags={tags}
      />

      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-4 flex-wrap">
          <span className="text-sm font-medium text-blue-900">
            {selectedIds.size} selected
          </span>
          <div className="flex gap-2 flex-wrap">
            <select
              onChange={(e) => e.target.value && handleBulkStageUpdate(e.target.value as PipelineStage)}
              className="px-3 py-1.5 rounded-lg border border-blue-200 text-sm bg-white"
              defaultValue=""
            >
              <option value="" disabled>Move to stage...</option>
              {PIPELINE_STAGES.map(stage => (
                <option key={stage.stage} value={stage.stage}>
                  {stage.label}
                </option>
              ))}
            </select>

            <select
              onChange={(e) => e.target.value && handleBulkEmailStatusUpdate(e.target.value as EmailOutreachStatus)}
              className="px-3 py-1.5 rounded-lg border border-blue-200 text-sm bg-white"
              defaultValue=""
            >
              <option value="" disabled>Update email status...</option>
              {EMAIL_OUTREACH_STATUSES.map(status => (
                <option key={status} value={status}>
                  {status.replace('_', ' ')}
                </option>
              ))}
            </select>

            <ExportButton
              businesses={selectedBusinesses}
              campaignName="export"
            />

            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
            >
              Delete Selected
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Business Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filteredBusinesses.length && filteredBusinesses.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviews</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pricing</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Value</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filteredBusinesses.map(business => {
              const stageConfig = PIPELINE_STAGES.find(s => s.stage === business.pipeline_stage);
              const negativeReviews = business.one_star_reviews + business.two_star_reviews;

              return (
                <tr
                  key={business.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={(e) => handleRowClick(business, e)}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(business.id)}
                      onChange={() => toggleSelection(business.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{business.business_name}</div>
                    <div className="text-sm text-gray-500">{business.email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{business.city}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      <span className="font-medium text-gray-900">{negativeReviews}</span>
                      <span className="text-gray-500"> negative</span>
                    </div>
                    <div className="text-xs text-gray-500">{business.total_media_reviews} w/ media</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${
                      business.pricing_tier === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                      business.pricing_tier === 'volume' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {business.pricing_tier || 'standard'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    ${business.total_project_value.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm" style={{ color: stageConfig?.color }}>
                      {stageConfig?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600 capitalize">
                      {business.email_outreach_status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredBusinesses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No businesses found. Import a CSV to get started.</p>
          </div>
        )}
      </div>

      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImportComplete={handleImportComplete}
        />
      )}

      {/* Business Detail Modal */}
      <BusinessDetailModal
        isOpen={!!selectedBusiness}
        onClose={() => setSelectedBusiness(null)}
        business={selectedBusiness}
        onDelete={handleSingleDelete}
        onStageChange={handleStageChange}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        businesses={selectedBusinesses}
        onConfirm={handleBulkDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
