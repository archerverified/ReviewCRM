'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { FilterBar } from '@/components/FilterBar';
import { ImportModal } from '@/components/ImportModal';
import { ExportButton } from '@/components/ExportButton';
import { BusinessDetailModal } from '@/components/BusinessDetailModal';
import { DeleteConfirmationModal } from '@/components/DeleteConfirmationModal';
import { AddContactModal, AddBusinessModal, AddPartnerModal } from '@/components/contacts';
import { supabase, contactQueries } from '@/lib/supabase';
import type { Business, FilterState, PipelineStage, EmailOutreachStatus, Tag, ContactCategory, BusinessTag } from '@/types';
import { PIPELINE_STAGES, EMAIL_OUTREACH_STATUSES, CONTACT_CATEGORIES } from '@/types';
import { toast } from 'sonner';
import {
  Users,
  Upload,
  UserPlus,
  Handshake,
  ShoppingBag,
  ChevronDown,
  Mail,
  TrendingUp,
  Trash2,
  X,
  Inbox,
  Building2,
  MapPin,
  Star,
  DollarSign,
  Tag as TagIcon,
  ArrowUpDown,
  Filter,
  UserCircle2,
  Phone,
  Activity,
  Clock,
  Briefcase,
  CheckCircle2,
  XCircle,
  Ban
} from 'lucide-react';

type TabType = 'all' | 'businesses' | 'partners' | 'customers';

const TABS: { id: TabType; label: string; category: ContactCategory | null; icon: React.ReactNode; addLabel: string }[] = [
  { id: 'all', label: 'All Contacts', category: null, icon: <Users className="w-4 h-4" />, addLabel: 'Add Contact' },
  { id: 'businesses', label: 'Businesses', category: 'business', icon: <Building2 className="w-4 h-4" />, addLabel: 'Add Business' },
  { id: 'partners', label: 'Partners', category: 'partner', icon: <Handshake className="w-4 h-4" />, addLabel: 'Add Partner' },
  { id: 'customers', label: 'Customers', category: 'customer', icon: <ShoppingBag className="w-4 h-4" />, addLabel: 'Add Customer' },
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

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [businesses, filters, activeTab]);

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

      // Build a map of business_id -> tags[]
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

    // Apply tab filter (category or contact_type)
    const activeTabConfig = TABS.find(t => t.id === activeTab);
    if (activeTabConfig?.category) {
      filtered = filtered.filter(b =>
        b.category === activeTabConfig.category ||
        (b as any).contact_type === activeTabConfig.category
      );
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
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
      toast.success(`Updated ${ids.length} contacts to ${status.replace('_', ' ')}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Update failed: ${errorMessage}`);
    }
  }

  async function handleBulkCategoryUpdate(category: ContactCategory | null) {
    const ids = Array.from(selectedIds);
    try {
      await contactQueries.bulkUpdateCategory(ids, category);

      setBusinesses(businesses.map(b =>
        selectedIds.has(b.id) ? { ...b, category } : b
      ));

      // Refresh counts
      const counts = await contactQueries.getCategoryCounts();
      setCategoryCounts(counts);

      setSelectedIds(new Set());
      toast.success(`Updated ${ids.length} contacts to ${category || 'uncategorized'}`);
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
      const BATCH_SIZE = 50;
      const batches: string[][] = [];
      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        batches.push(ids.slice(i, i + BATCH_SIZE));
      }

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

      // Refresh counts
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

      // Refresh counts
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

  function handleRowClick(business: Business, event: React.MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' && target.getAttribute('type') === 'checkbox') {
      return;
    }
    setSelectedBusiness(business);
  }

  function getTabCount(tabId: TabType): number {
    switch (tabId) {
      case 'all':
        return categoryCounts.all;
      case 'businesses':
        return categoryCounts.businesses;
      case 'partners':
        return categoryCounts.partners;
      case 'customers':
        return categoryCounts.customers;
      default:
        return 0;
    }
  }

  function handleAddButtonClick() {
    switch (activeTab) {
      case 'all':
        setShowAddContactModal(true);
        break;
      case 'businesses':
        setShowAddBusinessModal(true);
        break;
      case 'partners':
        setShowAddPartnerModal(true);
        break;
      case 'customers':
        setShowAddContactModal(true); // Use same modal for customers with category pre-set
        break;
    }
  }

  function getCurrentTabAddLabel(): string {
    const tab = TABS.find(t => t.id === activeTab);
    return tab?.addLabel || 'Add Contact';
  }

  // Skeleton Loading Component
  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="px-4 py-3">
        <div className="h-6 w-6 bg-gray-200 rounded"></div>
      </td>
      <td className="px-4 py-3">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="h-3 bg-gray-200 rounded w-24"></div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </td>
      <td className="px-4 py-3">
        <div className="h-6 bg-gray-200 rounded-lg w-20"></div>
      </td>
      <td className="px-4 py-3">
        <div className="h-6 bg-gray-200 rounded-lg w-20"></div>
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1">
          <div className="h-5 bg-gray-200 rounded-full w-12"></div>
          <div className="h-5 bg-gray-200 rounded-full w-12"></div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </td>
      <td className="px-4 py-3">
        <div className="h-6 bg-gray-200 rounded-lg w-20"></div>
      </td>
      <td className="px-4 py-3">
        <div className="h-6 bg-gray-200 rounded-lg w-20"></div>
      </td>
    </tr>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
                </th>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                  <th key={i} className="px-4 py-3 text-left">
                    <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <SkeletonRow key={i} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with gradient background */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-6 shadow-sm border border-blue-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white p-3 rounded-xl shadow-sm">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                Contacts
              </h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                {filteredBusinesses.length} {filteredBusinesses.length === 1 ? 'contact' : 'contacts'}
                {selectedIds.size > 0 && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-blue-600 font-medium">{selectedIds.size} selected</span>
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowImportModal(true)}
              variant="secondary"
              className="shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
            <Button
              onClick={handleAddButtonClick}
              className="shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {getCurrentTabAddLabel()}
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Tabs with icons and animations */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <nav className="flex">
          {TABS.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedIds(new Set());
              }}
              className={`flex-1 relative py-4 px-6 font-medium text-sm transition-all duration-200 ${
                activeTab === tab.id
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              } ${index !== 0 ? 'border-l border-gray-200' : ''}`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className={`transition-transform duration-200 ${
                  activeTab === tab.id ? 'scale-110' : ''
                }`}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
                <span className={`inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 scale-105'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {getTabCount(tab.id)}
                </span>
              </div>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 animate-[slideIn_0.2s_ease-out]" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        tags={tags}
      />

      {/* Enhanced Bulk Actions Toolbar with slide-down animation */}
      {selectedIds.size > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-5 shadow-lg animate-[slideDown_0.3s_ease-out]">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 text-white rounded-lg px-3 py-2 font-semibold text-sm shadow-sm">
                {selectedIds.size} selected
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
                className="text-gray-600 hover:text-gray-900 hover:bg-white/50"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            </div>
            <div className="flex gap-2 flex-wrap">
              <div className="relative group">
                <select
                  onChange={(e) => e.target.value && handleBulkStageUpdate(e.target.value as PipelineStage)}
                  className="pl-10 pr-8 py-2 rounded-lg border-2 border-blue-200 text-sm bg-white hover:border-blue-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all cursor-pointer shadow-sm hover:shadow"
                  defaultValue=""
                >
                  <option value="" disabled>Move to stage...</option>
                  {PIPELINE_STAGES.map(stage => (
                    <option key={stage.stage} value={stage.stage}>
                      {stage.label}
                    </option>
                  ))}
                </select>
                <TrendingUp className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative group">
                <select
                  onChange={(e) => e.target.value && handleBulkEmailStatusUpdate(e.target.value as EmailOutreachStatus)}
                  className="pl-10 pr-8 py-2 rounded-lg border-2 border-blue-200 text-sm bg-white hover:border-blue-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all cursor-pointer shadow-sm hover:shadow"
                  defaultValue=""
                >
                  <option value="" disabled>Update email status...</option>
                  {EMAIL_OUTREACH_STATUSES.map(status => (
                    <option key={status} value={status}>
                      {status.replace('_', ' ')}
                    </option>
                  ))}
                </select>
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative group">
                <select
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') return;
                    handleBulkCategoryUpdate(value === 'none' ? null : value as ContactCategory);
                  }}
                  className="pl-10 pr-8 py-2 rounded-lg border-2 border-blue-200 text-sm bg-white hover:border-blue-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all cursor-pointer shadow-sm hover:shadow"
                  defaultValue=""
                >
                  <option value="" disabled>Assign category...</option>
                  <option value="none">Uncategorized</option>
                  {CONTACT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
                <TagIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <ExportButton
                businesses={selectedBusinesses}
                campaignName="export"
              />

              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteModal(true)}
                className="shadow-sm hover:shadow transition-all"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Contacts Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-4 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredBusinesses.length && filteredBusinesses.length > 0}
                    onChange={toggleSelectAll}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer transition-all hover:scale-110"
                  />
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <UserCircle2 className="w-4 h-4" />
                    Contact
                  </div>
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    Phone
                  </div>
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <TagIcon className="w-4 h-4" />
                    Category
                  </div>
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    Contacted?
                  </div>
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    City
                  </div>
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <TagIcon className="w-4 h-4" />
                    Tags
                  </div>
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Last Activity
                  </div>
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    Stage
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredBusinesses.map((business, index) => {
                const stageConfig = PIPELINE_STAGES.find(s => s.stage === business.pipeline_stage);
                const contactTags = businessTags.get(business.id) || [];
                const lastActivity = business.last_activity_at ? new Date(business.last_activity_at) : null;
                const formatRelativeTime = (date: Date) => {
                  const now = new Date();
                  const diffMs = now.getTime() - date.getTime();
                  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                  const diffMinutes = Math.floor(diffMs / (1000 * 60));

                  if (diffDays > 30) return date.toLocaleDateString();
                  if (diffDays > 0) return `${diffDays}d ago`;
                  if (diffHours > 0) return `${diffHours}h ago`;
                  if (diffMinutes > 0) return `${diffMinutes}m ago`;
                  return 'Just now';
                };

                return (
                  <tr
                    key={business.id}
                    className="group hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer transition-all duration-200 hover:shadow-[0_2px_8px_rgba(59,130,246,0.1)] animate-[fadeIn_0.3s_ease-out] hover:scale-[1.01]"
                    style={{ animationDelay: `${index * 30}ms` }}
                    onClick={(e) => handleRowClick(business, e)}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(business.id)}
                        onChange={() => toggleSelection(business.id)}
                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer transition-all hover:scale-110"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white w-10 h-10 rounded-lg flex items-center justify-center font-semibold text-sm shadow-sm flex-shrink-0">
                          {business.business_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors truncate">
                            {business.business_name}
                          </div>
                          <div className="text-sm text-gray-600 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" />
                            {business.email || 'No email'}
                          </div>
                          {business.contact_name && (
                            <div className="text-xs text-gray-500 mt-0.5">{business.contact_name}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {business.phone ? (
                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span>{business.phone}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all group-hover:shadow ${
                        business.category === 'partner' ? 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800' :
                        business.category === 'customer' ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800' :
                        'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700'
                      }`}>
                        {business.category === 'partner' && <Handshake className="w-3 h-3" />}
                        {business.category === 'customer' && <ShoppingBag className="w-3 h-3" />}
                        {business.category ? business.category.charAt(0).toUpperCase() + business.category.slice(1) : 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-sm ${
                        business.contacted === 'yes' ? 'bg-green-100 text-green-700' :
                        business.contacted === 'dnr' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {business.contacted === 'yes' && <CheckCircle2 className="w-3 h-3" />}
                        {business.contacted === 'dnr' && <Ban className="w-3 h-3" />}
                        {business.contacted === 'no' && <XCircle className="w-3 h-3" />}
                        {!business.contacted && <XCircle className="w-3 h-3" />}
                        {business.contacted === 'yes' ? 'Yes' : business.contacted === 'dnr' ? 'DNR' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-700">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        {business.city || '—'}{business.state && `, ${business.state}`}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {contactTags.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {contactTags.slice(0, 3).map((tag) => (
                            <span
                              key={tag.id}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: `${tag.color}20`,
                                color: tag.color
                              }}
                            >
                              {tag.name}
                            </span>
                          ))}
                          {contactTags.length > 3 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              +{contactTags.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {lastActivity ? (
                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                          <Activity className="w-3.5 h-3.5 text-gray-400" />
                          <span>{formatRelativeTime(lastActivity)}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-medium shadow-sm transition-all group-hover:shadow"
                        style={{
                          backgroundColor: stageConfig?.color ? `${stageConfig.color}20` : '#f3f4f6',
                          color: stageConfig?.color || '#6b7280'
                        }}
                      >
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stageConfig?.color }} />
                        {stageConfig?.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Enhanced Empty State */}
        {filteredBusinesses.length === 0 && (
          <div className="text-center py-16 px-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 mb-4">
              <Users className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No contacts found</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              {businesses.length === 0
                ? "Get started by importing your first batch of contacts"
                : "Try adjusting your filters or search criteria"}
            </p>
            {businesses.length === 0 && (
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => setShowImportModal(true)}
                  className="shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import CSV
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => toast.info('Add contact feature coming soon')}
                  className="shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Contact
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

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

      {/* Add Contact/Business/Partner Modals */}
      <AddContactModal
        isOpen={showAddContactModal}
        onClose={() => setShowAddContactModal(false)}
        onContactAdded={async (contact) => {
          setBusinesses([contact, ...businesses]);
          const counts = await contactQueries.getCategoryCounts();
          setCategoryCounts(counts);
        }}
        defaultCategory={activeTab === 'customers' ? 'customer' : undefined}
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

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: scaleX(0);
            opacity: 0;
          }
          to {
            transform: scaleX(1);
            opacity: 1;
          }
        }

        @keyframes slideDown {
          from {
            transform: translateY(-10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
