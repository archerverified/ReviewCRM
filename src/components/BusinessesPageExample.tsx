'use client';

/**
 * BUSINESSES PAGE INTEGRATION EXAMPLE
 *
 * This example demonstrates how to integrate the BusinessDetailModal and
 * DeleteConfirmationModal into a businesses listing page with:
 * - Checkbox selection for bulk actions
 * - Delete button in toolbar when businesses are selected
 * - Click on row to view business details
 * - Delete confirmation with business list
 *
 * Usage:
 * 1. Copy this pattern into your actual businesses page
 * 2. Connect to your Supabase queries
 * 3. Customize the table columns as needed
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Business } from '@/types';
import { Button } from '@/components/ui/Button';
import { BusinessDetailModal } from '@/components/BusinessDetailModal';
import { DeleteConfirmationModal } from '@/components/DeleteConfirmationModal';

export default function BusinessesPageExample() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBusinesses();
  }, []);

  async function loadBusinesses() {
    setLoading(true);
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load businesses:', error);
    } else {
      setBusinesses((data || []) as Business[]);
    }
    setLoading(false);
  }

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(businesses.map(b => b.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  // Row click handler (opens detail modal)
  const handleRowClick = (business: Business, event: React.MouseEvent) => {
    // Don't open modal if clicking on checkbox
    const target = event.target as HTMLElement;
    if (target.type === 'checkbox' || target.closest('input[type="checkbox"]')) {
      return;
    }

    setSelectedBusiness(business);
    setIsDetailModalOpen(true);
  };

  // Delete handlers
  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);

    const idsToDelete = Array.from(selectedIds);
    const { error } = await supabase
      .from('businesses')
      .delete()
      .in('id', idsToDelete);

    if (error) {
      console.error('Failed to delete businesses:', error);
      alert('Failed to delete businesses. Please try again.');
    } else {
      // Remove deleted businesses from state
      setBusinesses(businesses.filter(b => !selectedIds.has(b.id)));
      setSelectedIds(new Set());
      setIsDeleteModalOpen(false);
    }

    setIsDeleting(false);
  };

  // Stage change handler
  const handleStageChange = async (businessId: string, newStage: string) => {
    const { error } = await supabase
      .from('businesses')
      .update({ pipeline_stage: newStage, updated_at: new Date().toISOString() })
      .eq('id', businessId);

    if (error) {
      console.error('Failed to update stage:', error);
      alert('Failed to update stage. Please try again.');
    } else {
      // Update local state
      setBusinesses(businesses.map(b =>
        b.id === businessId ? { ...b, pipeline_stage: newStage as any } : b
      ));
      if (selectedBusiness?.id === businessId) {
        setSelectedBusiness({ ...selectedBusiness, pipeline_stage: newStage as any });
      }
    }
  };

  const selectedBusinesses = businesses.filter(b => selectedIds.has(b.id));
  const allSelected = businesses.length > 0 && selectedIds.size === businesses.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < businesses.length;

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
          <p className="text-gray-500 mt-1">Manage your business leads and pipeline</p>
        </div>
        <Button variant="primary">
          Import CSV
        </Button>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-blue-900">
              {selectedIds.size} {selectedIds.size === 1 ? 'business' : 'businesses'} selected
            </span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear selection
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm">
              Export Selected
            </Button>
            <Button variant="secondary" size="sm">
              Change Stage
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteClick}>
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Businesses Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={input => {
                      if (input) input.indeterminate = someSelected;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Business
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Reviews
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Media Reviews
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Stage
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {businesses.map((business) => (
                <tr
                  key={business.id}
                  onClick={(e) => handleRowClick(business, e)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(business.id)}
                      onChange={(e) => handleSelectOne(business.id, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{business.business_name}</p>
                      {business.contact_name && (
                        <p className="text-sm text-gray-500">{business.contact_name}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {business.city && business.state
                      ? `${business.city}, ${business.state}`
                      : business.city || business.state || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {business.google_rating?.toFixed(1) || 'N/A'}
                      </span>
                      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      <span className="text-sm text-gray-500">({business.total_reviews})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {business.total_media_reviews > 0 ? (
                      <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        {business.total_media_reviews}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">0</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    ${business.total_project_value.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">
                      {business.pipeline_stage.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {businesses.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No businesses</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by importing a CSV file.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <BusinessDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        business={selectedBusiness}
        onDelete={(id) => {
          setSelectedIds(new Set([id]));
          setIsDetailModalOpen(false);
          setIsDeleteModalOpen(true);
        }}
        onStageChange={handleStageChange}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        businesses={selectedBusinesses}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}
