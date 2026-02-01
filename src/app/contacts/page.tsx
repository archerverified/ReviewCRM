'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Tab, Badge, Avatar } from '@/components/ui';
import { AnimatedBackground, TextShimmer } from '@/components/motion-primitives';
import { ImportModal } from '@/components/ImportModal';
import { BusinessDetailModal } from '@/components/BusinessDetailModal';
import { DeleteConfirmationModal } from '@/components/DeleteConfirmationModal';
import { AddContactModal, AddBusinessModal, AddPartnerModal } from '@/components/contacts';
import { supabase, contactQueries } from '@/lib/supabase';
import type { Business, FilterState, PipelineStage, Tag, ContactCategory } from '@/types';
import { PIPELINE_STAGES } from '@/types';
import { toast } from 'sonner';
import {
  Upload,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

// Inline SVG icons for crisp rendering (matching dashboard)
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const SortIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 5h10M11 9h7M11 13h4" />
    <path d="M3 17l3 3 3-3M6 18V4" />
  </svg>
);

const FilterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const UserPlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M19 8v6M22 11h-6" />
  </svg>
);

type TabType = 'all' | 'businesses' | 'partners';
type SortColumn = 'name' | 'business' | 'email' | 'rating' | 'reviews' | 'status';
type SortDirection = 'asc' | 'desc';

const TABS: { id: TabType; label: string; category: ContactCategory | null }[] = [
  { id: 'all', label: 'All Contacts', category: null },
  { id: 'businesses', label: 'Businesses', category: 'business' },
  { id: 'partners', label: 'Partners', category: 'partner' },
];

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50];

export default function ContactsPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [businessTags, setBusinessTags] = useState<Map<string, Tag[]>>(new Map());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Sorting state
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    loadData();
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

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

  // Filter contacts based on tab and search
  const filteredContacts = useMemo(() => {
    let filtered = [...businesses];

    // Filter by tab category
    const activeTabConfig = TABS.find(t => t.id === activeTab);
    if (activeTabConfig?.category) {
      filtered = filtered.filter(b =>
        b.category === activeTabConfig.category ||
        (b as any).contact_type === activeTabConfig.category
      );
    }

    // Filter by search query
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      filtered = filtered.filter(b =>
        b.business_name.toLowerCase().includes(search) ||
        b.email?.toLowerCase().includes(search) ||
        b.city?.toLowerCase().includes(search) ||
        b.contact_name?.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [businesses, activeTab, searchQuery]);

  // Sort contacts
  const sortedContacts = useMemo(() => {
    if (!sortColumn) return filteredContacts;

    return [...filteredContacts].sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortColumn) {
        case 'name':
          aValue = (a.contact_name || a.business_name || '').toLowerCase();
          bValue = (b.contact_name || b.business_name || '').toLowerCase();
          break;
        case 'business':
          aValue = (a.business_name || '').toLowerCase();
          bValue = (b.business_name || '').toLowerCase();
          break;
        case 'email':
          aValue = (a.email || '').toLowerCase();
          bValue = (b.email || '').toLowerCase();
          break;
        case 'rating':
          aValue = a.google_rating || 0;
          bValue = b.google_rating || 0;
          break;
        case 'reviews':
          aValue = a.total_reviews || 0;
          bValue = b.total_reviews || 0;
          break;
        case 'status':
          aValue = a.pipeline_stage || '';
          bValue = b.pipeline_stage || '';
          break;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredContacts, sortColumn, sortDirection]);

  // Paginate contacts
  const totalPages = Math.ceil(sortedContacts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedContacts = sortedContacts.slice(startIndex, endIndex);

  // Handle sort column click
  function handleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }

  // Sort indicator component
  function SortIndicator({ column }: { column: SortColumn }) {
    if (sortColumn !== column) {
      return <span className="text-clay-300 ml-1">↕</span>;
    }
    return sortDirection === 'asc'
      ? <ChevronUp className="w-3 h-3 ml-1 text-clay-600" />
      : <ChevronDown className="w-3 h-3 ml-1 text-clay-600" />;
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
    if (selectedIds.size === paginatedContacts.length && paginatedContacts.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedContacts.map(b => b.id)));
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
      <div className="space-y-5">
        <TextShimmer className="text-xl font-semibold" duration={1.5}>Loading Contacts...</TextShimmer>
        <div className="flex gap-4 border-b border-clay-200 pb-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 w-28 bg-clay-100 rounded animate-pulse" />
          ))}
        </div>
        <div className="bg-white border border-clay-200 rounded-xl p-4">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-clay-50 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Page Title */}
      <h1 className="text-xl font-semibold text-clay-900">Contacts</h1>

      {/* Tabs with AnimatedBackground */}
      <div className="border-b border-clay-200">
        <AnimatedBackground
          defaultValue={activeTab}
          className="rounded-lg bg-muted"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.3 }}
        >
          <div className="flex">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                data-id={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedIds(new Set());
                }}
                className={`relative px-4 py-2.5 text-sm font-medium transition-colors
                  ${activeTab === tab.id
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <span className="relative z-10">{tab.label}</span>
                {getTabCount(tab.id) > 0 && (
                  <span className={`ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium relative z-10
                    ${activeTab === tab.id
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                    }`}>
                    {getTabCount(tab.id)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </AnimatedBackground>
      </div>

      {/* Search and Actions Bar */}
      <div className="bg-white border border-clay-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm bg-clay-50 border border-clay-200 rounded-lg w-56 focus:outline-none focus:ring-1 focus:ring-clay-300"
              />
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-clay-400 pointer-events-none">
                <SearchIcon />
              </div>
            </div>

            {/* Sort Button */}
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-clay-600 bg-clay-50 border border-clay-200 rounded-lg hover:bg-clay-100 transition-colors">
              <SortIcon /> Sort by
            </button>

            {/* Filter Button */}
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-clay-600 bg-clay-50 border border-clay-200 rounded-lg hover:bg-clay-100 transition-colors">
              <FilterIcon /> Filter
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Import Button */}
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-clay-600 bg-clay-50 border border-clay-200 rounded-lg hover:bg-clay-100 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Import CSV
            </button>

            {/* Add Contact Button */}
            <button
              onClick={handleAddButtonClick}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm text-white bg-clay-900 rounded-lg hover:bg-clay-800 transition-colors"
            >
              <UserPlusIcon />
              Add Contact
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
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
              className="px-3 py-1.5 text-sm border border-clay-200 rounded-lg bg-white focus:outline-none"
              defaultValue=""
            >
              <option value="" disabled>Move to stage...</option>
              {PIPELINE_STAGES.map(stage => (
                <option key={stage.stage} value={stage.stage}>{stage.label}</option>
              ))}
            </select>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Contacts Table */}
      <div className="bg-white border border-clay-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-clay-100 text-left bg-clay-50/50">
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === paginatedContacts.length && paginatedContacts.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-clay-300"
                  />
                </th>
                <th
                  className="px-4 py-3 text-xs font-medium text-clay-500 cursor-pointer hover:text-clay-700 select-none"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Contact
                    <SortIndicator column="name" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-xs font-medium text-clay-500 cursor-pointer hover:text-clay-700 select-none"
                  onClick={() => handleSort('business')}
                >
                  <div className="flex items-center">
                    Business
                    <SortIndicator column="business" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-xs font-medium text-clay-500 cursor-pointer hover:text-clay-700 select-none"
                  onClick={() => handleSort('email')}
                >
                  <div className="flex items-center">
                    Email
                    <SortIndicator column="email" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-xs font-medium text-clay-500 cursor-pointer hover:text-clay-700 select-none"
                  onClick={() => handleSort('rating')}
                >
                  <div className="flex items-center">
                    Rating
                    <SortIndicator column="rating" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-xs font-medium text-clay-500 cursor-pointer hover:text-clay-700 select-none"
                  onClick={() => handleSort('reviews')}
                >
                  <div className="flex items-center">
                    Reviews
                    <SortIndicator column="reviews" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-xs font-medium text-clay-500 cursor-pointer hover:text-clay-700 select-none"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Status
                    <SortIndicator column="status" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedContacts.map((business) => {
                const stageConfig = PIPELINE_STAGES.find(s => s.stage === business.pipeline_stage);
                const getBadgeVariant = () => {
                  if (business.pipeline_stage === 'deal_closed') return 'green';
                  if (business.pipeline_stage === 'positive_reply' || business.pipeline_stage === 'qualified_lead') return 'yellow';
                  if (business.pipeline_stage === 'in_negotiation') return 'blue';
                  return 'gray';
                };

                return (
                  <tr
                    key={business.id}
                    className="border-b border-clay-50 hover:bg-clay-50/50 cursor-pointer transition-colors"
                    onClick={(e) => handleRowClick(business, e)}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(business.id)}
                        onChange={() => toggleSelection(business.id)}
                        className="rounded border-clay-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={business.contact_name || business.business_name} size="md" />
                        <span className="text-sm text-clay-800">
                          {business.contact_name || business.business_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-clay-600">{business.business_name}</td>
                    <td className="px-4 py-3 text-sm text-clay-600">{business.email || '—'}</td>
                    <td className="px-4 py-3 text-sm text-clay-600">
                      {business.google_rating ? `⭐ ${business.google_rating.toFixed(1)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-clay-600">
                      {business.total_reviews || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getBadgeVariant()}>
                        {stageConfig?.label || 'Lead'}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {sortedContacts.length === 0 && (
          <div className="text-center py-16">
            <div className="text-clay-500 mb-4">No contacts found</div>
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white bg-clay-900 rounded-lg hover:bg-clay-800 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Import CSV
            </button>
          </div>
        )}

        {/* Pagination */}
        {sortedContacts.length > 0 && (
          <div className="px-4 py-3 border-t border-clay-100 flex items-center justify-between bg-clay-50/30">
            <div className="flex items-center gap-2 text-sm text-clay-600">
              <span>Showing</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 border border-clay-200 rounded bg-white text-sm focus:outline-none"
              >
                {ITEMS_PER_PAGE_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <span>of {sortedContacts.length} contacts</span>
            </div>

            <div className="flex items-center gap-1">
              {/* First Page */}
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 text-clay-500 hover:text-clay-700 hover:bg-clay-100 rounded disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              {/* Previous Page */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 text-clay-500 hover:text-clay-700 hover:bg-clay-100 rounded disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 text-sm rounded transition-colors ${
                        currentPage === pageNum
                          ? 'bg-clay-900 text-white'
                          : 'text-clay-600 hover:bg-clay-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* Next Page */}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 text-clay-500 hover:text-clay-700 hover:bg-clay-100 rounded disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Last Page */}
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 text-clay-500 hover:text-clay-700 hover:bg-clay-100 rounded disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>

            <div className="text-sm text-clay-500">
              Page {currentPage} of {totalPages}
            </div>
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
