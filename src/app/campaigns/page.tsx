'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { supabase, globalBlocklistQueries } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Campaign, GlobalBlocklistEntry } from '@/types'
import { toast } from 'sonner'
import {
  Search,
  Inbox,
  BarChart3,
  Plus,
  Layers,
  Mail,
  ShieldOff,
  MoreHorizontal,
  Copy,
  Archive,
  Trash2,
  Play,
  Pause,
  Users,
  Send,
  Reply,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Zap,
  Target,
  ChevronRight
} from 'lucide-react'

type TabType = 'sequences' | 'email-accounts' | 'blocklist';

const TABS: { id: TabType; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'sequences', label: 'Sequences', icon: <Layers className="w-4 h-4" />, description: 'Email campaigns' },
  { id: 'email-accounts', label: 'Email Accounts', icon: <Mail className="w-4 h-4" />, description: 'Sending accounts' },
  { id: 'blocklist', label: 'Global Blocklist', icon: <ShieldOff className="w-4 h-4" />, description: 'DNR list' },
];

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [blocklist, setBlocklist] = useState<GlobalBlocklistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('sequences')
  const [showAddBlocklistModal, setShowAddBlocklistModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeMenu, setActiveMenu] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [campaignsRes, blocklistRes] = await Promise.all([
        supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
        globalBlocklistQueries.getAll(),
      ])

      if (campaignsRes.data) setCampaigns(campaignsRes.data as Campaign[])
      setBlocklist(blocklistRes)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: Campaign['status']) => {
    const statusStyles: Record<Campaign['status'], string> = {
      draft: 'bg-gray-100 text-gray-700',
      generating: 'bg-yellow-100 text-yellow-700',
      ready: 'bg-green-100 text-green-700',
      exported: 'bg-blue-100 text-blue-700',
      active: 'bg-green-100 text-green-700',
      paused: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-gray-100 text-gray-700',
    }
    return statusStyles[status] || statusStyles.draft
  }

  async function handleDeleteBlocklistEntry(id: string) {
    try {
      await globalBlocklistQueries.delete(id)
      setBlocklist(blocklist.filter(b => b.id !== id))
      toast.success('Entry removed from blocklist')
    } catch (error) {
      toast.error('Failed to remove entry')
    }
  }

  // Filter campaigns by search
  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (campaign.description && campaign.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Campaign stats
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length
  const totalSent = campaigns.reduce((sum, c) => sum + c.emails_sent, 0)
  const totalReplies = campaigns.reduce((sum, c) => sum + c.replies_received, 0)
  const avgReplyRate = totalSent > 0 ? ((totalReplies / totalSent) * 100).toFixed(1) : '0'

  async function handleDuplicateCampaign(campaignId: string) {
    const campaign = campaigns.find(c => c.id === campaignId)
    if (!campaign) return

    try {
      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          name: `${campaign.name} (Copy)`,
          description: campaign.description,
          status: 'draft',
          template: campaign.template,
          total_count: 0,
          generated_count: 0,
          emails_sent: 0,
          emails_opened: 0,
          replies_received: 0,
        })
        .select()
        .single()

      if (error) throw error
      toast.success('Campaign duplicated')
      await loadData()
    } catch {
      toast.error('Failed to duplicate campaign')
    }
    setActiveMenu(null)
  }

  async function handleArchiveCampaign(campaignId: string) {
    try {
      await supabase
        .from('campaigns')
        .update({ status: 'completed' })
        .eq('id', campaignId)

      setCampaigns(campaigns.map(c =>
        c.id === campaignId ? { ...c, status: 'completed' as const } : c
      ))
      toast.success('Campaign archived')
    } catch {
      toast.error('Failed to archive campaign')
    }
    setActiveMenu(null)
  }

  async function handleDeleteCampaign(campaignId: string) {
    try {
      await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId)

      setCampaigns(campaigns.filter(c => c.id !== campaignId))
      toast.success('Campaign deleted')
    } catch {
      toast.error('Failed to delete campaign')
    }
    setActiveMenu(null)
  }

  async function handleTogglePause(campaignId: string) {
    const campaign = campaigns.find(c => c.id === campaignId)
    if (!campaign) return

    const newStatus = campaign.status === 'active' ? 'paused' : 'active'
    try {
      await supabase
        .from('campaigns')
        .update({ status: newStatus })
        .eq('id', campaignId)

      setCampaigns(campaigns.map(c =>
        c.id === campaignId ? { ...c, status: newStatus } : c
      ))
      toast.success(`Campaign ${newStatus === 'active' ? 'resumed' : 'paused'}`)
    } catch {
      toast.error('Failed to update campaign')
    }
    setActiveMenu(null)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-6 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Target className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Campaigns</h1>
                <p className="text-white/70 text-sm mt-0.5">
                  AI-powered email sequences and outreach automation
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/campaigns/inbox"
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-all duration-200 text-sm font-medium"
              >
                <Inbox className="w-4 h-4" />
                Global Inbox
              </Link>
              <Link
                href="/campaigns/analytics"
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-all duration-200 text-sm font-medium"
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </Link>
              {activeTab === 'sequences' && (
                <Link
                  href="/campaigns/new"
                  className="flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-600 rounded-lg hover:bg-white/90 transition-all duration-200 shadow-lg shadow-black/20 text-sm font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  New Campaign
                </Link>
              )}
              {activeTab === 'blocklist' && (
                <button
                  onClick={() => setShowAddBlocklistModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-600 rounded-lg hover:bg-white/90 transition-all duration-200 shadow-lg shadow-black/20 text-sm font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  Add to Blocklist
                </button>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <Layers className="w-4 h-4" />
                Total Campaigns
              </div>
              <div className="text-2xl font-bold mt-1">{campaigns.length}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <Zap className="w-4 h-4" />
                Active
              </div>
              <div className="text-2xl font-bold mt-1">{activeCampaigns}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <Send className="w-4 h-4" />
                Total Sent
              </div>
              <div className="text-2xl font-bold mt-1">{totalSent.toLocaleString()}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <TrendingUp className="w-4 h-4" />
                Avg Reply Rate
              </div>
              <div className="text-2xl font-bold mt-1">{avgReplyRate}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Tabs */}
      <div className="flex items-center justify-between">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <span className={activeTab === tab.id ? 'text-indigo-600' : 'text-gray-400'}>
                {tab.icon}
              </span>
              {tab.label}
              {tab.id === 'sequences' && campaigns.length > 0 && (
                <span className={`ml-1 py-0.5 px-2 rounded-full text-xs font-semibold ${
                  activeTab === tab.id
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {campaigns.length}
                </span>
              )}
              {tab.id === 'blocklist' && blocklist.length > 0 && (
                <span className={`ml-1 py-0.5 px-2 rounded-full text-xs font-semibold ${
                  activeTab === tab.id
                    ? 'bg-red-100 text-red-600'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {blocklist.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        {activeTab === 'sequences' && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-72 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'sequences' && (
        <SequencesTab
          campaigns={filteredCampaigns}
          loading={loading}
          getStatusBadge={getStatusBadge}
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          onDuplicate={handleDuplicateCampaign}
          onArchive={handleArchiveCampaign}
          onDelete={handleDeleteCampaign}
          onTogglePause={handleTogglePause}
        />
      )}

      {activeTab === 'email-accounts' && (
        <EmailAccountsTab />
      )}

      {activeTab === 'blocklist' && (
        <BlocklistTab
          blocklist={blocklist}
          loading={loading}
          onDelete={handleDeleteBlocklistEntry}
        />
      )}

      {/* Add to Blocklist Modal */}
      <AddBlocklistModal
        isOpen={showAddBlocklistModal}
        onClose={() => setShowAddBlocklistModal(false)}
        onAdd={async (entry) => {
          await loadData()
          setShowAddBlocklistModal(false)
        }}
      />
    </div>
  )
}

// Sequences Tab Component
function SequencesTab({
  campaigns,
  loading,
  getStatusBadge,
  activeMenu,
  setActiveMenu,
  onDuplicate,
  onArchive,
  onDelete,
  onTogglePause,
}: {
  campaigns: Campaign[]
  loading: boolean
  getStatusBadge: (status: Campaign['status']) => string
  activeMenu: string | null
  setActiveMenu: (id: string | null) => void
  onDuplicate: (id: string) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  onTogglePause: (id: string) => void
}) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [setActiveMenu])

  const getReplyRate = (sent: number, replies: number) => {
    if (sent === 0) return '0%'
    return `${((replies / sent) * 100).toFixed(1)}%`
  }

  const getOpenRate = (sent: number, opened: number) => {
    if (sent === 0) return '0%'
    return `${((opened / sent) * 100).toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="animate-pulse p-6 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-12 w-12 bg-gray-200 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
              </div>
              <div className="h-8 w-20 bg-gray-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (campaigns.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mb-4">
            <Target className="w-10 h-10 text-indigo-500" />
          </div>
          <p className="text-gray-900 font-medium text-lg">No campaigns yet</p>
          <p className="text-sm text-gray-500 mt-1 max-w-sm">
            Create your first campaign to start generating personalized email sequences
          </p>
          <Link
            href="/campaigns/new"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-lg shadow-indigo-500/25 font-medium"
          >
            <Plus className="w-4 h-4" />
            Create Campaign
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <table className="min-w-full">
        <thead>
          <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Campaign</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Leads</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Sent</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Open Rate</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reply Rate</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Modified</th>
            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {campaigns.map((campaign, index) => (
            <tr
              key={campaign.id}
              className="group hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/30 transition-all duration-200"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <td className="px-6 py-4">
                <Link href={`/campaigns/${campaign.id}`} className="block">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      campaign.status === 'active'
                        ? 'bg-gradient-to-br from-green-400 to-emerald-500'
                        : campaign.status === 'paused'
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                        : campaign.status === 'draft'
                        ? 'bg-gradient-to-br from-gray-300 to-gray-400'
                        : 'bg-gradient-to-br from-blue-400 to-indigo-500'
                    }`}>
                      <Layers className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                        {campaign.name}
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" />
                      </div>
                      {campaign.description && (
                        <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{campaign.description}</div>
                      )}
                    </div>
                  </div>
                </Link>
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(campaign.status)}`}>
                  {campaign.status === 'active' && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />}
                  {campaign.status === 'paused' && <Pause className="w-3 h-3" />}
                  {campaign.status === 'generating' && <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />}
                  <span className="capitalize">{campaign.status}</span>
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">{campaign.total_count}</span>
                </div>
                {campaign.total_count > 0 && (
                  <div className="w-20 bg-gray-200 rounded-full h-1 mt-1.5">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1 rounded-full transition-all duration-500"
                      style={{ width: `${(campaign.generated_count / campaign.total_count) * 100}%` }}
                    />
                  </div>
                )}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">{campaign.emails_sent}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className={`text-sm font-semibold ${
                    parseFloat(getOpenRate(campaign.emails_sent, campaign.emails_opened)) >= 30
                      ? 'text-green-600'
                      : parseFloat(getOpenRate(campaign.emails_sent, campaign.emails_opened)) >= 15
                      ? 'text-yellow-600'
                      : 'text-gray-600'
                  }`}>
                    {getOpenRate(campaign.emails_sent, campaign.emails_opened)}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <Reply className="w-4 h-4 text-gray-400" />
                  <span className={`text-sm font-semibold ${
                    parseFloat(getReplyRate(campaign.emails_sent, campaign.replies_received)) >= 10
                      ? 'text-green-600'
                      : parseFloat(getReplyRate(campaign.emails_sent, campaign.replies_received)) >= 5
                      ? 'text-yellow-600'
                      : 'text-gray-600'
                  }`}>
                    {getReplyRate(campaign.emails_sent, campaign.replies_received)}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  {new Date(campaign.updated_at || campaign.created_at).toLocaleDateString()}
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/campaigns/${campaign.id}`}
                    className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    View
                  </Link>
                  <div className="relative" ref={activeMenu === campaign.id ? menuRef : null}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveMenu(activeMenu === campaign.id ? null : campaign.id)
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>

                    {/* Dropdown Menu */}
                    {activeMenu === campaign.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        {(campaign.status === 'active' || campaign.status === 'paused') && (
                          <button
                            onClick={() => onTogglePause(campaign.id)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            {campaign.status === 'active' ? (
                              <>
                                <Pause className="w-4 h-4" />
                                Pause Campaign
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4" />
                                Resume Campaign
                              </>
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => onDuplicate(campaign.id)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                          Duplicate
                        </button>
                        <button
                          onClick={() => onArchive(campaign.id)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Archive className="w-4 h-4" />
                          Archive
                        </button>
                        <div className="border-t border-gray-100 my-1" />
                        <button
                          onClick={() => onDelete(campaign.id)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Email Accounts Tab Component
function EmailAccountsTab() {
  const [emailStats, setEmailStats] = useState({ total: 0, active: 0, warming: 0 })

  useEffect(() => {
    async function loadStats() {
      const { data } = await supabase
        .from('email_accounts')
        .select('id, status')

      if (data) {
        setEmailStats({
          total: data.length,
          active: data.filter(a => a.status === 'active').length,
          warming: data.filter(a => a.status === 'warming').length,
        })
      }
    }
    loadStats()
  }, [])

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-indigo-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Email Accounts</h3>
        <p className="text-gray-500 mt-1 mb-4">Manage your email sending accounts for campaigns</p>

        {/* Quick Stats */}
        <div className="flex items-center justify-center gap-6 py-4 border-y border-gray-100 my-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{emailStats.total}</div>
            <div className="text-xs text-gray-500">Total Accounts</div>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{emailStats.active}</div>
            <div className="text-xs text-gray-500">Active</div>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{emailStats.warming}</div>
            <div className="text-xs text-gray-500">Warming Up</div>
          </div>
        </div>

        <Link
          href="/email-accounts"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-lg shadow-indigo-500/25 font-medium"
        >
          <Mail className="w-4 h-4" />
          Manage Email Accounts
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}

// Blocklist Tab Component
function BlocklistTab({
  blocklist,
  loading,
  onDelete,
}: {
  blocklist: GlobalBlocklistEntry[]
  loading: boolean
  onDelete: (id: string) => void
}) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredBlocklist = blocklist.filter(entry =>
    (entry.email && entry.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (entry.domain && entry.domain.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (entry.reason && entry.reason.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const emailCount = blocklist.filter(e => e.email).length
  const domainCount = blocklist.filter(e => e.domain).length

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="animate-pulse p-6 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-8 w-20 bg-gray-200 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
              <div className="h-8 w-16 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (blocklist.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 rounded-2xl flex items-center justify-center mb-4">
            <ShieldOff className="w-10 h-10 text-red-500" />
          </div>
          <p className="text-gray-900 font-medium text-lg">No blocked entries</p>
          <p className="text-sm text-gray-500 mt-1 max-w-sm">
            Add email addresses or domains to prevent sending to them across all campaigns
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Blocklist Stats and Search */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-lg">
            <Mail className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-red-700">{emailCount} Emails</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium text-orange-700">{domainCount} Domains</span>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search blocklist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-64 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Value</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reason</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Added</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredBlocklist.map((entry, index) => (
              <tr
                key={entry.id}
                className="group hover:bg-red-50/30 transition-all duration-200"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                    entry.email
                      ? 'bg-red-100 text-red-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {entry.email ? (
                      <>
                        <Mail className="w-3 h-3" />
                        Email
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3" />
                        Domain
                      </>
                    )}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="font-mono text-sm font-medium text-gray-900">
                    {entry.email || entry.domain}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500">
                    {entry.reason || <span className="text-gray-300">-</span>}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    {new Date(entry.created_at).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => onDelete(entry.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Add to Blocklist Modal
function AddBlocklistModal({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean
  onClose: () => void
  onAdd: (entry: GlobalBlocklistEntry) => void
}) {
  const [type, setType] = useState<'email' | 'domain'>('email')
  const [value, setValue] = useState('')
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const entry = await globalBlocklistQueries.create({
        email: type === 'email' ? value : null,
        domain: type === 'domain' ? value : null,
        reason: reason || null,
      })
      toast.success('Added to blocklist')
      onAdd(entry)
      setValue('')
      setReason('')
    } catch (error) {
      toast.error('Failed to add to blocklist')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add to Blocklist">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Block Type</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType('email')}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${
                type === 'email'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                type === 'email' ? 'bg-red-500' : 'bg-gray-200'
              }`}>
                <Mail className={`w-5 h-5 ${type === 'email' ? 'text-white' : 'text-gray-500'}`} />
              </div>
              <div className="text-left">
                <div className={`font-medium ${type === 'email' ? 'text-red-700' : 'text-gray-700'}`}>
                  Email Address
                </div>
                <div className="text-xs text-gray-500">Block a specific email</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setType('domain')}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${
                type === 'domain'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                type === 'domain' ? 'bg-orange-500' : 'bg-gray-200'
              }`}>
                <AlertTriangle className={`w-5 h-5 ${type === 'domain' ? 'text-white' : 'text-gray-500'}`} />
              </div>
              <div className="text-left">
                <div className={`font-medium ${type === 'domain' ? 'text-orange-700' : 'text-gray-700'}`}>
                  Domain
                </div>
                <div className="text-xs text-gray-500">Block entire domain</div>
              </div>
            </button>
          </div>
        </div>

        {/* Value Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {type === 'email' ? 'Email Address' : 'Domain Name'}
          </label>
          <div className="relative">
            {type === 'email' ? (
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            ) : (
              <AlertTriangle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            )}
            <input
              type={type === 'email' ? 'email' : 'text'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={type === 'email' ? 'user@example.com' : 'example.com'}
              required
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Reason Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Reason <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this being blocked?"
            rows={2}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <button
            type="submit"
            disabled={isSubmitting || !value.trim()}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
              isSubmitting || !value.trim()
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/25'
            }`}
          >
            <ShieldOff className="w-4 h-4" />
            {isSubmitting ? 'Adding...' : 'Add to Blocklist'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
