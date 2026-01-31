'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Tab, Badge, Avatar } from '@/components/ui';
import { FilterBar } from '@/components/FilterBar';
import { ImportModal } from '@/components/ImportModal';
import { ExportButton } from '@/components/ExportButton';
import { BusinessDetailModal } from '@/components/BusinessDetailModal';
import { DeleteConfirmationModal } from '@/components/DeleteConfirmationModal';
import { AddContactModal, AddBusinessModal, AddPartnerModal } from '@/components/contacts';
import { supabase, contactQueries } from '@/lib/supabase';
import type { Business, FilterState, PipelineStage, EmailOutreachStatus, Tag, ContactCategory } from '@/types';
import { PIPELINE_STAGES, EMAIL_OUTREACH_STATUSES, CONTACT_CATEGORIES } from '@/types';
import { toast } from 'sonner';
import {
  Upload,
  UserPlus,
  ChevronDown,
  Mail,
  TrendingUp,
  Trash2,
  X,
  Search,
} from 'lucide-react';

type TabType = 'all' | 'businesses' | 'partners' | 'customers';

const TABS: { id: TabType; label: string; category: ContactCategory | null }[] = [
  { id: 'all', label: 'All Contacts', category: null },
  { id: 'businesses', label: 'Businesses', category: 'business' },
  { id: 'partners', label: 'Partners', category: 'partner' },
];

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

export default function ContactsPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [businessTags, setBusinessTags] = useState<Map<string, Tag[]>>(new Map());
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [showImportModal, setShowImportModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [categoryCounts, setCategoryCounts] = useState({
    all: 0,
    businesses: 0,
    partners: 0,
    customers: 0,
    uncategorized: 0,
  });
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showAddBusinessModal, setShowAddBusinessModal] = useState(false);
  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [businesses, filters, activeTab, searchQuery]);

  async function loadData() {
    setLoading(true);
    try {
      const [businessesRes, tagsRes, businessTagsRes, counts] = await Promise.all([
        supabase.from('businesses').select('*').order('created_at', { ascending: false }),
        supabase.from('tags').select('*').order('name'),
        supabase.from('business_tags').select('business_id, tag_id'),
        contactQueries.getCategoryCounts(),
      ]);

      if (businessesRes.data) setBusinesses(businessesRes.data);
      if (tagsRes.data) setTags(tagsRes.data);

      if (businessTagsRes.data && tagsRes.data) {
        const tagMap = new Map<string, Tag>();
        tagsRes.data.forEach(tag => tagMap.set(tag.id, tag));

        const btMap = new Map<string, Tag[]>();
        businessTagsRes.data.forEach((bt: { business_id: string; tag_id: string }) => {
          const tag = tagMap.get(bt.tag_id);
          if (tag) {
            const existing = btMap.get(bt.business_id) || [];
            existing.push(tag);
            btMap.set(bt.business_id, existing);
          }
        });
        setBusinessTags(btMap);
      }

      setCategoryCounts(counts);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to load contacts: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...businesses];

    const activeTabConfig = TABS.find(t => t.id === activeTab);
    if (activeTabConfig?.category) {
      filtered = filtered.filter(b =>
        b.category === activeTabConfig.category ||
        (b as any).contact_type === activeTabConfig.category
      );
    }

    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      filtered = filtered.filter(b =>
        b.business_name.toLowerCase().includes(search) ||
        b.email?.toLowerCase().includes(search) ||
        b.city?.toLowerCase().includes(search) ||
        b.contact_name?.toLowerCase().includes(search)
      );
    }

    if (filters.stages.length > 0) {
      filtered = filtered.filter(b => filters.stages.includes(b.pipeline_stage));
    }

    setFilteredBusinesses(filtered);
  }

  async function handleImportComplete(importedCount: number) {
    setShowImportModal(false);
    await loadData();
    toast.success(`Imported ${importedCount} contacts`);
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
      toast.success(`Moved ${ids.length} contacts to ${stageLabel}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Update failed: ${errorMessage}`);
    }
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('businesses')
        .delete()
        .in('id', ids);

      if (error) throw error;

      setBusinesses(businesses.filter(b => !selectedIds.has(b.id)));
      setSelectedIds(new Set());
      setShowDeleteModal(false);

      const counts = await contactQueries.getCategoryCounts();
      setCategoryCounts(counts);

      toast.success(`Deleted ${ids.length} contact${ids.length === 1 ? '' : 's'}`);
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

      const counts = await contactQueries.getCategoryCounts();
      setCategoryCounts(counts);

      toast.success('Contact deleted');
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

  function handleRowClick(business: Business, event: React.MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' && target.getAttribute('type') === 'checkbox') {
      return;
    }
    setSelectedBusiness(business);
  }

  function getTabCount(tabId: TabType): number {
    switch (tabId) {
      case 'all': return categoryCounts.all;
      case 'businesses': return categoryCounts.businesses;
      case 'partners': return categoryCounts.partners;
      default: return 0;
    }
  }

  function handleAddButtonClick() {
    switch (activeTab) {
      case 'businesses':
        setShowAddBusinessModal(true);
        break;
      case 'partners':
        setShowAddPartnerModal(true);
        break;
      default:
        setShowAddContactModal(true);
    }
  }

  const selectedBusinesses = businesses.filter(b => selectedIds.has(b.id));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 bg-clay-200 rounded animate-pulse" />
        <div className="bg-white border border-clay-200 rounded-lg p-4">
          <div className="flex gap-4 border-b border-clay-200 pb-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 w-32 bg-clay-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <h1 className="text-2xl font-bold text-clay-900">Contacts</h1>

      {/* Tabs */}
      <div className="bg-white border-b border-clay-200 -mx-8 px-8 -mt-2">
        <div className="flex">
          {TABS.map((tab) => (
            <Tab
              key={tab.id}
              active={activeTab === tab.id}
              count={getTabCount(tab.id)}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedIds(new Set());
              }}
            >
              {tab.label}
            </Tab>
          ))}
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex gap-3 mt-6 mb-4">
        <div className="flex-1 max-w-xs relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-clay-400" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-clay-300 rounded-md text-sm focus:outline-none focus:border-clay-500"
          />
        </div>
        <Button variant="secondary" size="sm">Stage ▼</Button>
        <Button variant="secondary" size="sm">Verification ▼</Button>
        <Button variant="secondary" size="sm">Rating ▼</Button>
        <div className="flex-1" />
        <Button variant="secondary" onClick={() => setShowImportModal(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Import
        </Button>
        <Button variant="primary" onClick={handleAddButtonClick}>
          + Add Contact
        </Button>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-bg border border-blue-main/30 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-clay-800">{selectedIds.size} selected</span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-clay-500 hover:text-clay-700 text-sm"
            >
              Clear
            </button>
          </div>
          <div className="flex gap-2">
            <select
              onChange={(e) => e.target.value && handleBulkStageUpdate(e.target.value as PipelineStage)}
              className="px-3 py-1.5 text-sm border border-clay-300 rounded-md bg-white"
              defaultValue=""
            >
              <option value="" disabled>Move to stage...</option>
              {PIPELINE_STAGES.map(stage => (
                <option key={stage.stage} value={stage.stage}>{stage.label}</option>
              ))}
            </select>
            <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Contacts Table */}
      <div className="bg-white border border-clay-200 rounded-lg overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-clay-50">
              <th className="w-10 px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filteredBusinesses.length && filteredBusinesses.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>
              {['Contact', 'Business', 'Email', 'Rating', 'Reviews', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-medium text-clay-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredBusinesses.slice(0, 10).map((business, i) => {
              const stageConfig = PIPELINE_STAGES.find(s => s.stage === business.pipeline_stage);

              return (
                <tr
                  key={business.id}
                  className="border-b border-clay-100 hover:bg-clay-50 cursor-pointer"
                  onClick={(e) => handleRowClick(business, e)}
                >
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(business.id)}
                      onChange={() => toggleSelection(business.id)}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={business.contact_name || business.business_name} size="md" />
                      <span className="text-sm font-medium text-clay-800">
                        {business.contact_name || business.business_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-clay-700">{business.business_name}</td>
                  <td className="px-4 py-4 text-sm text-clay-600">{business.email || '—'}</td>
                  <td className="px-4 py-4 text-sm text-clay-700">
                    {business.total_reviews ? `⭐ ${(business.google_rating || 0).toFixed(1)}` : '—'}
                  </td>
                  <td className="px-4 py-4 text-sm text-clay-700">{business.total_reviews || '—'}</td>
                  <td className="px-4 py-4">
                    <Badge variant={business.pipeline_stage === 'positive_reply' || business.pipeline_stage === 'qualified_lead' ? 'yellow' : business.pipeline_stage === 'deal_closed' ? 'green' : 'gray'}>
                      {stageConfig?.label || 'Lead'}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredBusinesses.length === 0 && (
          <div className="text-center py-16">
            <div className="text-clay-500 mb-4">No contacts found</div>
            <Button variant="primary" onClick={() => setShowImportModal(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImportComplete={handleImportComplete}
        />
      )}

      <BusinessDetailModal
        isOpen={!!selectedBusiness}
        onClose={() => setSelectedBusiness(null)}
        business={selectedBusiness}
        onDelete={handleSingleDelete}
        onStageChange={handleStageChange}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        businesses={selectedBusinesses}
        onConfirm={handleBulkDelete}
        isDeleting={isDeleting}
      />

      <AddContactModal
        isOpen={showAddContactModal}
        onClose={() => setShowAddContactModal(false)}
        onContactAdded={async (contact) => {
          setBusinesses([contact, ...businesses]);
          const counts = await contactQueries.getCategoryCounts();
          setCategoryCounts(counts);
        }}
      />

      <AddBusinessModal
        isOpen={showAddBusinessModal}
        onClose={() => setShowAddBusinessModal(false)}
        onBusinessAdded={async (business) => {
          setBusinesses([business, ...businesses]);
          const counts = await contactQueries.getCategoryCounts();
          setCategoryCounts(counts);
        }}
      />

      <AddPartnerModal
        isOpen={showAddPartnerModal}
        onClose={() => setShowAddPartnerModal(false)}
        onPartnerAdded={async (partner) => {
          setBusinesses([partner, ...businesses]);
          const counts = await contactQueries.getCategoryCounts();
          setCategoryCounts(counts);
        }}
      />
    </div>
  );
}
