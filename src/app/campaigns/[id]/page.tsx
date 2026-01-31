'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, businessQueries, campaignSequenceQueries } from '@/lib/supabase';
import { Campaign, Business, PlusvibeExportRow, CampaignSequence } from '@/types';
import { CellState, BatchProgress } from '@/types/campaign';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import {
  Badge,
  Avatar,
  StatCard,
  ContextMenu,
  ContextMenuItem,
  EditableCell,
  ColumnHeader,
  AddColumnHeader,
  AddColumnDropdown,
  AddColumnOption,
} from '@/components/ui';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Settings,
  Mail,
  Clock,
  Plus,
  Trash2,
  Edit,
  Download,
  Check,
  AlertCircle,
  Loader2,
  Filter,
  ArrowUpDown,
  Columns3,
  Upload,
  Send,
} from 'lucide-react';

// Column definition for the spreadsheet
interface Column {
  id: string;
  name: string;
  icon: string;
  type: 'text' | 'number' | 'url' | 'email';
  hasPlay?: boolean;
  isEnriched?: boolean;
  isBase?: boolean;
}

const baseColumns: Column[] = [
  { id: 'business_name', name: 'Business Name', icon: 'Aa', type: 'text', hasPlay: true, isBase: true },
  { id: 'email', name: 'Email', icon: '@', type: 'email', hasPlay: true, isBase: true },
  { id: 'city', name: 'City', icon: 'Aa', type: 'text', isBase: true },
  { id: 'google_rating', name: 'Rating', icon: '★', type: 'number', isBase: true },
  { id: 'total_reviews', name: 'Reviews', icon: '#', type: 'number', isBase: true },
  { id: 'one_star_reviews', name: '1 Star', icon: '#', type: 'number', isBase: true },
  { id: 'two_star_reviews', name: '2 Stars', icon: '#', type: 'number', isBase: true },
  { id: 'total_media_reviews', name: 'Media Reviews', icon: '#', type: 'number', isBase: true },
  { id: 'total_project_value', name: 'Value', icon: '$', type: 'number', isBase: true },
];

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Column management
  const [customColumns, setCustomColumns] = useState<Column[]>([]);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [showAddColumn, setShowAddColumn] = useState(false);

  // Cell editing
  const [editingCell, setEditingCell] = useState<{ rowId: string; colId: string } | null>(null);

  // Context menu
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    items: ContextMenuItem[];
  } | null>(null);

  // Panel states
  const [showEnrichPanel, setShowEnrichPanel] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Generation state
  const [cellStates, setCellStates] = useState<Map<string, CellState>>(new Map());
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);

  // Sequence state
  const [sequences, setSequences] = useState<CampaignSequence[]>([]);
  const [showSequenceModal, setShowSequenceModal] = useState(false);
  const [editingSequence, setEditingSequence] = useState<CampaignSequence | null>(null);

  // Delete state
  const [isDeleting, setIsDeleting] = useState(false);

  const campaignId = params.id as string;

  const allColumns = [...baseColumns, ...customColumns];
  const visibleColumns = allColumns.filter((col) => !hiddenColumns.includes(col.id));

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
  const toggleRow = useCallback((id: string) => {
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
  const toggleAll = useCallback(() => {
    if (selectedIds.size === businesses.length && businesses.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(businesses.map((b) => b.id)));
    }
  }, [businesses, selectedIds.size]);

  // Update cell value
  const updateCell = useCallback(
    async (rowId: string, colId: string, value: string | number) => {
      setBusinesses((prev) =>
        prev.map((b) => (b.id === rowId ? { ...b, [colId]: value } : b))
      );

      // Save to database if it's a base column
      if (baseColumns.find((c) => c.id === colId)) {
        try {
          await supabase.from('businesses').update({ [colId]: value }).eq('id', rowId);
        } catch (error) {
          console.error('Failed to save cell:', error);
        }
      }
    },
    []
  );

  // Check if cell is being edited
  const isEditing = useCallback(
    (rowId: string, colId: string) => {
      return editingCell?.rowId === rowId && editingCell?.colId === colId;
    },
    [editingCell]
  );

  // Handle column context menu
  const handleColumnContextMenu = useCallback(
    (e: React.MouseEvent, column: Column) => {
      e.preventDefault();

      const items: ContextMenuItem[] = [
        { icon: '✂', label: 'Cut', shortcut: '⌘X', action: () => {} },
        { icon: '❏', label: 'Copy', shortcut: '⌘C', action: () => {} },
        { icon: '❏', label: 'Paste', shortcut: '⌘V', action: () => {} },
        { divider: true },
        {
          icon: '+',
          label: 'Insert column left',
          action: () => {
            const newColId = `custom_${Date.now()}`;
            const newColumn: Column = {
              id: newColId,
              name: 'New Column',
              icon: 'Aa',
              type: 'text',
              isBase: false,
            };
            setCustomColumns((prev) => [newColumn, ...prev]);
          },
        },
        {
          icon: '+',
          label: 'Insert column right',
          action: () => {
            const newColId = `custom_${Date.now()}`;
            const newColumn: Column = {
              id: newColId,
              name: 'New Column',
              icon: 'Aa',
              type: 'text',
              isBase: false,
            };
            setCustomColumns((prev) => [...prev, newColumn]);
          },
        },
        {
          icon: '−',
          label: 'Delete column',
          destructive: true,
          disabled: column.isBase,
          action: () => {
            if (!column.isBase) {
              setCustomColumns((prev) => prev.filter((c) => c.id !== column.id));
            }
          },
        },
        {
          icon: '○',
          label: 'Clear column',
          action: () => {
            setBusinesses((prev) =>
              prev.map((b) => ({
                ...b,
                [column.id]: column.type === 'number' ? 0 : '',
              }))
            );
          },
        },
        {
          icon: '◐',
          label: 'Hide column',
          action: () => {
            setHiddenColumns((prev) => [...prev, column.id]);
          },
        },
        { divider: true },
        {
          icon: 'A↓',
          label: 'Sort A to Z',
          action: () => {
            setBusinesses((prev) =>
              [...prev].sort((a, b) => {
                const aVal = String((a as Record<string, unknown>)[column.id] || '');
                const bVal = String((b as Record<string, unknown>)[column.id] || '');
                return aVal.localeCompare(bVal);
              })
            );
          },
        },
        {
          icon: 'Z↓',
          label: 'Sort Z to A',
          action: () => {
            setBusinesses((prev) =>
              [...prev].sort((a, b) => {
                const aVal = String((a as Record<string, unknown>)[column.id] || '');
                const bVal = String((b as Record<string, unknown>)[column.id] || '');
                return bVal.localeCompare(aVal);
              })
            );
          },
        },
      ];

      setContextMenu({ x: e.clientX, y: e.clientY, items });
    },
    []
  );

  // Handle cell context menu
  const handleCellContextMenu = useCallback(
    (e: React.MouseEvent, business: Business, column: Column) => {
      e.preventDefault();

      const items: ContextMenuItem[] = [
        {
          icon: '✂',
          label: 'Cut',
          shortcut: '⌘X',
          action: () => {
            const value = (business as Record<string, unknown>)[column.id];
            navigator.clipboard?.writeText(String(value || ''));
            updateCell(business.id, column.id, column.type === 'number' ? 0 : '');
          },
        },
        {
          icon: '❏',
          label: 'Copy',
          shortcut: '⌘C',
          action: () => {
            const value = (business as Record<string, unknown>)[column.id];
            navigator.clipboard?.writeText(String(value || ''));
          },
        },
        {
          icon: '❏',
          label: 'Paste',
          shortcut: '⌘V',
          action: async () => {
            try {
              const text = await navigator.clipboard?.readText();
              if (text) {
                updateCell(
                  business.id,
                  column.id,
                  column.type === 'number' ? parseFloat(text) || 0 : text
                );
              }
            } catch (err) {
              console.error('Paste failed:', err);
            }
          },
        },
        { divider: true },
        {
          icon: '−',
          label: 'Delete row',
          destructive: true,
          action: async () => {
            try {
              await supabase.from('businesses').delete().eq('id', business.id);
              setBusinesses((prev) => prev.filter((b) => b.id !== business.id));
              toast.success('Row deleted');
            } catch (error) {
              toast.error('Failed to delete row');
            }
          },
        },
        {
          icon: '○',
          label: 'Clear cell',
          action: () => {
            updateCell(business.id, column.id, column.type === 'number' ? 0 : '');
          },
        },
      ];

      setContextMenu({ x: e.clientX, y: e.clientY, items });
    },
    [updateCell]
  );

  // Add column handler
  const handleAddColumn = useCallback((option: AddColumnOption) => {
    const newColId = `custom_${Date.now()}`;
    const newColumn: Column = {
      id: newColId,
      name: option.name === 'Enable AI' ? 'AI Column' : `New ${option.name}`,
      icon: option.icon,
      type: option.name === 'Number' || option.name === 'Rating' ? 'number' : 'text',
      isEnriched: option.isAI,
      isBase: false,
    };
    setCustomColumns((prev) => [...prev, newColumn]);
    setShowAddColumn(false);
  }, []);

  // Export to CSV
  const handleExport = useCallback(() => {
    if (!campaign || businesses.length === 0) return;

    const headers = visibleColumns.map((c) => c.name).join(',');
    const rows = businesses.map((b) =>
      visibleColumns
        .map((col) => {
          const value = (b as Record<string, unknown>)[col.id];
          return `"${String(value ?? '').replace(/"/g, '""')}"`;
        })
        .join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${campaign.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Exported successfully');
  }, [campaign, businesses, visibleColumns]);

  // Delete campaign
  const handleDeleteCampaign = useCallback(async () => {
    if (!campaign) return;
    setIsDeleting(true);
    try {
      await supabase.from('businesses').update({ campaign_id: null }).eq('campaign_id', campaignId);
      await supabase.from('campaign_sequences').delete().eq('campaign_id', campaignId);
      await supabase.from('campaigns').delete().eq('id', campaignId);

      toast.success('Campaign deleted');
      router.push('/campaigns');
    } catch (error) {
      toast.error('Failed to delete campaign');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [campaign, campaignId, router]);

  // Update campaign
  const handleUpdateCampaign = useCallback(
    async (updates: Partial<Campaign>) => {
      if (!campaign) return;
      try {
        await supabase
          .from('campaigns')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', campaignId);

        setCampaign({ ...campaign, ...updates });
        setShowSettingsModal(false);
        toast.success('Campaign updated');
      } catch (error) {
        toast.error('Failed to update campaign');
      }
    },
    [campaign, campaignId]
  );

  const hasHiddenColumns = hiddenColumns.length > 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 bg-clay-200 rounded animate-pulse" />
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-1 h-24 bg-clay-100 border border-clay-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-clay-100 border border-clay-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-clay-400 mx-auto mb-4" />
        <p className="text-clay-500">Campaign not found</p>
        <Link href="/campaigns">
          <Button variant="secondary" className="mt-4">
            Back to Campaigns
          </Button>
        </Link>
      </div>
    );
  }

  const getStatusVariant = (status: string) => {
    if (status === 'active' || status === 'ready') return 'green';
    if (status === 'generating') return 'blue';
    if (status === 'paused') return 'yellow';
    return 'gray';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Campaign Header */}
      <div className="py-3 border-b border-clay-200 flex items-center gap-4 mb-4">
        <Link
          href="/campaigns"
          className="flex items-center gap-2 text-sm text-clay-600 hover:text-clay-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Campaigns
        </Link>
        <div className="flex-1" />
        <Badge variant={getStatusVariant(campaign.status)}>{campaign.status}</Badge>
      </div>

      {/* Stats Row */}
      <div className="flex gap-4 mb-5 flex-wrap">
        <StatCard label="Contacts" value={businesses.length.toString()} icon="👥" />
        <StatCard label="Emails Sent" value={campaign.emails_sent.toString()} icon="✉️" />
        <StatCard
          label="Open Rate"
          value={
            campaign.emails_sent > 0
              ? `${((campaign.emails_opened / campaign.emails_sent) * 100).toFixed(1)}%`
              : '0%'
          }
          icon="📬"
        />
        <StatCard
          label="Reply Rate"
          value={
            campaign.emails_sent > 0
              ? `${((campaign.replies_received / campaign.emails_sent) * 100).toFixed(1)}%`
              : '0%'
          }
          icon="↩️"
        />
      </div>

      {/* Spreadsheet Header */}
      <div className="py-2 border-b border-clay-200 flex items-center gap-2 mb-2">
        <span className="text-base font-semibold text-clay-800">{campaign.name}</span>
        <span className="text-[13px] text-clay-500">- Sheet1</span>
      </div>

      {/* Toolbar */}
      <div className="py-2 border-b border-clay-200 flex items-center gap-2 mb-2">
        <button className="px-3 py-1.5 bg-white border border-clay-300 rounded-md text-xs text-clay-600 flex items-center gap-1.5 hover:bg-clay-50">
          <span>≡</span> Default View
        </button>
        <button className="px-3 py-1.5 bg-orange-50 border border-orange-400 rounded-md text-xs text-orange-700 flex items-center gap-1.5 hover:bg-orange-100">
          <Filter className="w-3 h-3" /> Filter
        </button>
        <button className="px-3 py-1.5 bg-white border border-clay-300 rounded-md text-xs text-clay-600 flex items-center gap-1.5 hover:bg-clay-50">
          <ArrowUpDown className="w-3 h-3" /> Sort
        </button>
        <button
          onClick={() => hasHiddenColumns && setHiddenColumns([])}
          className={`px-3 py-1.5 border rounded-md text-xs flex items-center gap-1.5 ${
            hasHiddenColumns
              ? 'bg-blue-50 border-blue-400 text-blue-700 hover:bg-blue-100'
              : 'bg-white border-clay-300 text-clay-600 hover:bg-clay-50'
          }`}
        >
          <Columns3 className="w-3 h-3" /> Columns{' '}
          {hasHiddenColumns && `(${hiddenColumns.length} hidden)`}
        </button>
        <button
          onClick={handleExport}
          className="px-3 py-1.5 bg-white border border-clay-300 rounded-md text-xs text-clay-600 flex items-center gap-1.5 hover:bg-clay-50"
        >
          <Download className="w-3 h-3" /> Export
        </button>

        <div className="flex-1" />

        <button
          onClick={() => setShowSettingsModal(true)}
          className="px-3 py-1.5 bg-white border border-clay-300 rounded-md text-xs text-clay-600 flex items-center gap-1.5 hover:bg-clay-50"
        >
          <Settings className="w-3 h-3" /> Settings
        </button>
        <button className="px-4 py-2 bg-status-green-dot border-none rounded-md text-[13px] text-white font-medium flex items-center gap-1.5 hover:bg-green-600">
          <Upload className="w-3.5 h-3.5" /> Import Data
        </button>
        <button className="px-4 py-2 bg-status-green-dot border-none rounded-md text-[13px] text-white font-medium flex items-center gap-1.5 hover:bg-green-600">
          <Send className="w-3.5 h-3.5" /> Send Data
        </button>
      </div>

      {/* Spreadsheet Table */}
      <div className="flex-1 overflow-auto border border-clay-200 rounded-lg">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {/* Row number header */}
              <th className="w-10 px-1 py-2 bg-clay-50 border-b border-r border-clay-200 sticky left-0 z-[2]" />
              {/* Checkbox header */}
              <th className="w-10 px-2 py-2 bg-clay-50 border-b border-r border-clay-200">
                <input
                  type="checkbox"
                  checked={selectedIds.size === businesses.length && businesses.length > 0}
                  onChange={toggleAll}
                  className="rounded border-clay-300"
                />
              </th>
              {/* Column headers */}
              {visibleColumns.map((col) => (
                <th key={col.id} className="p-0">
                  <ColumnHeader
                    icon={col.icon}
                    name={col.name}
                    hasPlay={col.hasPlay}
                    isEnriched={col.isEnriched}
                    onContextMenu={(e) => handleColumnContextMenu(e, col)}
                  />
                </th>
              ))}
              {/* Add column header */}
              <th className="p-0 relative">
                <AddColumnHeader onClick={() => setShowAddColumn(!showAddColumn)} />
                <AddColumnDropdown
                  isOpen={showAddColumn}
                  onClose={() => setShowAddColumn(false)}
                  onSelect={handleAddColumn}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {businesses.map((business, rowIdx) => (
              <tr
                key={business.id}
                className={`${
                  selectedIds.has(business.id)
                    ? 'bg-blue-50'
                    : rowIdx % 2 === 1
                    ? 'bg-row-alt'
                    : 'bg-white'
                }`}
              >
                {/* Row number */}
                <td className="px-1 py-2 text-center text-[11px] text-clay-400 border-b border-r border-clay-200 bg-clay-50 sticky left-0">
                  {rowIdx + 1}
                </td>
                {/* Checkbox */}
                <td className="px-2 py-2 border-b border-r border-clay-200">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(business.id)}
                    onChange={() => toggleRow(business.id)}
                    className="rounded border-clay-300"
                  />
                </td>
                {/* Data cells */}
                {visibleColumns.map((col) => (
                  <td
                    key={col.id}
                    onContextMenu={(e) => handleCellContextMenu(e, business, col)}
                    className="p-0 border-b border-r border-clay-200 max-w-[150px] min-w-[80px] relative"
                  >
                    <EditableCell
                      value={(business as Record<string, unknown>)[col.id] as string | number ?? ''}
                      onChange={(val) => updateCell(business.id, col.id, val)}
                      type={col.type === 'number' ? 'number' : col.type === 'url' ? 'url' : 'text'}
                      isEditing={isEditing(business.id, col.id)}
                      onStartEdit={() => setEditingCell({ rowId: business.id, colId: col.id })}
                      onEndEdit={() => setEditingCell(null)}
                    />
                  </td>
                ))}
                {/* Empty cell for add column */}
                <td className="border-b border-clay-200" />
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty state */}
        {businesses.length === 0 && (
          <div className="text-center py-16">
            <div className="text-clay-500 mb-4">No contacts in this campaign</div>
            <Button variant="primary">+ Import Contacts</Button>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Settings Modal */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Campaign Settings"
      >
        <CampaignSettingsContent
          campaign={campaign}
          onSave={handleUpdateCampaign}
          onClose={() => setShowSettingsModal(false)}
          onDelete={() => {
            setShowSettingsModal(false);
            setShowDeleteConfirm(true);
          }}
        />
      </Modal>

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
              This will remove all contacts from this campaign. This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
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

// Campaign Settings Content
function CampaignSettingsContent({
  campaign,
  onSave,
  onClose,
  onDelete,
}: {
  campaign: Campaign;
  onSave: (updates: Partial<Campaign>) => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(campaign.name);
  const [description, setDescription] = useState(campaign.description || '');
  const [status, setStatus] = useState(campaign.status);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({ name, description, status });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Input
        label="Campaign Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Campaign name"
      />
      <div>
        <label className="block text-sm font-medium text-clay-700 mb-1.5">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-clay-300 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-clay-400 focus:border-transparent text-sm"
          placeholder="Campaign description..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-clay-700 mb-1.5">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Campaign['status'])}
          className="w-full px-3 py-2 rounded-md border border-clay-300 focus:outline-none focus:ring-2 focus:ring-clay-400 focus:border-transparent text-sm"
        >
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="ready">Ready</option>
          <option value="generating">Generating</option>
          <option value="exported">Exported</option>
          <option value="paused">Paused</option>
        </select>
      </div>
      <div className="flex justify-between items-center pt-4 border-t border-clay-200">
        <button
          onClick={onDelete}
          className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
        >
          <Trash2 className="w-4 h-4" />
          Delete Campaign
        </button>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={isSaving}>
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
    </div>
  );
}
