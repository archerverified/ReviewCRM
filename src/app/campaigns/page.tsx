'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge, Avatar, StatCard } from '@/components/ui'
import { AnimatedBackground, TextShimmer } from '@/components/motion-primitives'
import { Campaign } from '@/types'
import { toast } from 'sonner'
import {
  Search,
  Plus,
  MoreHorizontal,
  Copy,
  Archive,
  Trash2,
  Play,
  Pause,
} from 'lucide-react'

type TabType = 'sequences' | 'accounts' | 'blocklist';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('sequences')
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadData()
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false })

      if (data) setCampaigns(data as Campaign[])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const activeCampaigns = campaigns.filter(c => c.status === 'active').length
  const totalSent = campaigns.reduce((sum, c) => sum + c.emails_sent, 0)
  const totalReplies = campaigns.reduce((sum, c) => sum + c.replies_received, 0)
  const avgReplyRate = totalSent > 0 ? `${((totalReplies / totalSent) * 100).toFixed(1)}%` : '0%'

  async function handleDeleteCampaign(campaignId: string) {
    try {
      await supabase.from('campaigns').delete().eq('id', campaignId)
      setCampaigns(campaigns.filter(c => c.id !== campaignId))
      toast.success('Campaign deleted')
    } catch {
      toast.error('Failed to delete campaign')
    }
    setActiveMenu(null)
  }

  // Sample campaigns for demo when empty
  const sampleCampaigns: Campaign[] = [
    { id: '1', name: 'DFW Apartments', status: 'ready', total_count: 281, emails_sent: 0, emails_opened: 0, replies_received: 0, deals_closed: 0, total_revenue: 0, businesses_count: 281, generated_count: 0, description: null, template: null, custom_instructions: null, ai_instructions: null, message_template: null, plusvibe_campaign_id: null, plusvibe_exported_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '2', name: 'Casino Test', status: 'ready', total_count: 383, emails_sent: 0, emails_opened: 0, replies_received: 0, deals_closed: 0, total_revenue: 0, businesses_count: 383, generated_count: 0, description: null, template: null, custom_instructions: null, ai_instructions: null, message_template: null, plusvibe_campaign_id: null, plusvibe_exported_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '3', name: 'Test 2', status: 'draft', total_count: 342, emails_sent: 0, emails_opened: 0, replies_received: 0, deals_closed: 0, total_revenue: 0, businesses_count: 342, generated_count: 0, description: null, template: null, custom_instructions: null, ai_instructions: null, message_template: null, plusvibe_campaign_id: null, plusvibe_exported_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ]

  const displayCampaigns = campaigns.length > 0 ? campaigns : sampleCampaigns

  if (loading) {
    return (
      <div className="space-y-6">
        <TextShimmer className="text-2xl font-bold" duration={1.5}>Loading Campaigns...</TextShimmer>
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-1 h-24 bg-clay-100 border border-clay-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <h1 className="text-2xl font-bold text-clay-900">Campaigns</h1>

      {/* Stats Row with animation */}
      <div className="flex gap-4 flex-wrap">
        <StatCard label="Total Campaigns" value={displayCampaigns.length} icon="📧" animate />
        <StatCard label="Active" value={activeCampaigns} icon="▶️" highlight={activeCampaigns > 0} animate />
        <StatCard label="Total Sent" value={totalSent} icon="✉️" animate />
        <StatCard label="Avg Reply Rate" value={avgReplyRate} icon="↩️" />
      </div>

      {/* Tabs with AnimatedBackground */}
      <div className="bg-white border-b border-clay-200 -mx-8 px-8">
        <AnimatedBackground
          defaultValue={activeTab}
          className="rounded-lg bg-muted"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.3 }}
          enableHover
        >
          {[
            { id: 'sequences', label: 'Sequences', count: displayCampaigns.length },
            { id: 'accounts', label: 'Email Accounts' },
            { id: 'blocklist', label: 'Global Blocklist' },
          ].map((tab) => (
            <button
              key={tab.id}
              data-id={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-4 py-3 text-sm flex items-center gap-2 transition-colors ${
                activeTab === tab.id
                  ? 'text-clay-900 font-semibold'
                  : 'text-clay-500 hover:text-clay-700'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                  activeTab === tab.id
                    ? 'bg-clay-900 text-white'
                    : 'bg-clay-200 text-clay-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </AnimatedBackground>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <div className="flex-1" />
        <Link href="/campaigns/new">
          <Button variant="primary">+ New Campaign</Button>
        </Link>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white border border-clay-200 rounded-lg overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-clay-50">
              {['Campaign', 'Status', 'Leads', 'Sent', 'Open Rate', 'Reply Rate', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-medium text-clay-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayCampaigns.map((campaign) => (
              <tr
                key={campaign.id}
                className="border-b border-clay-100 hover:bg-clay-50 cursor-pointer"
              >
                <td className="px-4 py-4">
                  <Link href={`/campaigns/${campaign.id}`} className="flex items-center gap-3">
                    <Avatar name={campaign.name} size="md" />
                    <span className="text-sm font-medium text-clay-800">{campaign.name}</span>
                  </Link>
                </td>
                <td className="px-4 py-4">
                  <Badge variant={campaign.status === 'ready' || campaign.status === 'active' ? 'green' : 'gray'}>
                    {campaign.status}
                  </Badge>
                </td>
                <td className="px-4 py-4 text-sm text-clay-700">{campaign.total_count}</td>
                <td className="px-4 py-4 text-sm text-clay-700">{campaign.emails_sent}</td>
                <td className="px-4 py-4 text-sm text-clay-700">
                  {campaign.emails_sent > 0
                    ? `${((campaign.emails_opened / campaign.emails_sent) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </td>
                <td className="px-4 py-4 text-sm text-clay-700">
                  {campaign.emails_sent > 0
                    ? `${((campaign.replies_received / campaign.emails_sent) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </td>
                <td className="px-4 py-4">
                  <div className="relative" ref={activeMenu === campaign.id ? menuRef : null}>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setActiveMenu(activeMenu === campaign.id ? null : campaign.id)
                      }}
                      className="p-1.5 text-clay-400 hover:text-clay-600 hover:bg-clay-100 rounded"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {activeMenu === campaign.id && (
                      <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-context border border-clay-200 py-1 z-50">
                        <button
                          onClick={() => {
                            toast.info('Duplicate feature coming soon')
                            setActiveMenu(null)
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-clay-700 hover:bg-clay-50"
                        >
                          <Copy className="w-4 h-4" />
                          Duplicate
                        </button>
                        <button
                          onClick={() => {
                            toast.info('Archive feature coming soon')
                            setActiveMenu(null)
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-clay-700 hover:bg-clay-50"
                        >
                          <Archive className="w-4 h-4" />
                          Archive
                        </button>
                        <div className="h-px bg-clay-200 my-1" />
                        <button
                          onClick={() => handleDeleteCampaign(campaign.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-main hover:bg-red-light/50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {displayCampaigns.length === 0 && (
          <div className="text-center py-16">
            <div className="text-clay-500 mb-4">No campaigns yet</div>
            <Link href="/campaigns/new">
              <Button variant="primary">+ Create Campaign</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
