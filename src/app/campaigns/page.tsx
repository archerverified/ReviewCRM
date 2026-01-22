'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Campaign } from '@/types'

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCampaigns()
  }, [])

  async function loadCampaigns() {
    setLoading(true)
    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setCampaigns(data as Campaign[])
    setLoading(false)
  }

  const getStatusBadge = (status: Campaign['status']) => {
    const statusStyles: Record<Campaign['status'], string> = {
      draft: 'bg-clay-100 text-clay-700',
      generating: 'bg-yellow-100 text-yellow-700',
      ready: 'bg-green-100 text-green-700',
      exported: 'bg-blue-100 text-blue-700',
      active: 'bg-green-100 text-green-700',
      paused: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-clay-100 text-clay-700',
    }
    return statusStyles[status] || statusStyles.draft
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-clay-900">Campaigns</h1>
          <p className="text-sm text-clay-500 mt-1">
            AI-powered message generation campaigns
          </p>
        </div>
        <Link href="/campaigns/new" className="clay-btn-primary">
          New Campaign
        </Link>
      </div>

      {/* Campaigns List */}
      <div className="clay-card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-clay-500">Loading campaigns...</div>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <div className="text-clay-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-clay-500">No campaigns yet</p>
            <p className="text-sm text-clay-400 mt-1">Create your first campaign to start generating personalized messages</p>
          </div>
        ) : (
          <table className="clay-table">
            <thead>
              <tr>
                <th>Campaign Name</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id}>
                  <td>
                    <div>
                      <div className="font-medium text-clay-900">{campaign.name}</div>
                      {campaign.description && (
                        <div className="text-xs text-clay-500 mt-0.5">{campaign.description}</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusBadge(campaign.status)}`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td>
                    <div className="text-sm text-clay-700">
                      {campaign.generated_count} / {campaign.total_count}
                    </div>
                    {campaign.total_count > 0 && (
                      <div className="w-24 bg-clay-200 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-accent-blue h-1.5 rounded-full"
                          style={{ width: `${(campaign.generated_count / campaign.total_count) * 100}%` }}
                        />
                      </div>
                    )}
                  </td>
                  <td className="text-sm text-clay-500">
                    {new Date(campaign.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <Link
                      href={`/campaigns/${campaign.id}`}
                      className="text-sm text-accent-blue hover:text-blue-700"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
