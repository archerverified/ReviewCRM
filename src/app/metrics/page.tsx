'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Business, Campaign, PIPELINE_STAGES } from '@/types'

interface MetricCard {
  label: string
  value: string | number
  subValue?: string
  trend?: 'up' | 'down' | 'neutral'
}

export default function MetricsPage() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [businessesRes, campaignsRes] = await Promise.all([
      supabase.from('businesses').select('*'),
      supabase.from('campaigns').select('*'),
    ])

    if (businessesRes.data) setBusinesses(businessesRes.data as Business[])
    if (campaignsRes.data) setCampaigns(campaignsRes.data as Campaign[])
    setLoading(false)
  }

  // Calculate metrics
  const totalBusinesses = businesses.length
  const totalPipelineValue = businesses.reduce((sum, b) => sum + b.total_project_value, 0)
  const avgProjectValue = totalBusinesses > 0 ? Math.round(totalPipelineValue / totalBusinesses) : 0

  // Stage counts
  const newLeads = businesses.filter((b) => b.pipeline_stage === 'new_lead').length
  const activeOutreach = businesses.filter((b) => b.pipeline_stage === 'active_outreach').length
  const positiveReplies = businesses.filter((b) => b.pipeline_stage === 'positive_reply').length
  const proposalsSent = businesses.filter((b) => b.pipeline_stage === 'proposal_sent').length
  const dealsClosed = businesses.filter((b) => b.pipeline_stage === 'deal_closed').length
  const inDelivery = businesses.filter((b) => b.pipeline_stage === 'service_delivery').length

  // Campaign stats
  const totalCampaigns = campaigns.length
  const messagesGenerated = campaigns.reduce((sum, c) => sum + c.generated_count, 0)

  // Email status breakdown
  const emailVerified = businesses.filter((b) => b.email_status === 'good').length
  const emailRisky = businesses.filter((b) => b.email_status === 'risky').length
  const emailBad = businesses.filter((b) => b.email_status === 'bad').length
  const emailUnverified = businesses.filter((b) => b.email_status === 'unverified').length

  // Pricing tier breakdown
  const tierStandard = businesses.filter((b) => b.pricing_tier === 'standard').length
  const tierVolume = businesses.filter((b) => b.pricing_tier === 'volume').length
  const tierEnterprise = businesses.filter((b) => b.pricing_tier === 'enterprise').length

  const primaryMetrics: MetricCard[] = [
    {
      label: 'Total Pipeline Value',
      value: `$${totalPipelineValue.toLocaleString()}`,
      subValue: `${totalBusinesses} businesses`,
    },
    {
      label: 'Avg Project Value',
      value: `$${avgProjectValue.toLocaleString()}`,
      subValue: 'per business',
    },
    {
      label: 'Deals Closed',
      value: dealsClosed,
      subValue: `$${businesses
        .filter((b) => b.pipeline_stage === 'deal_closed')
        .reduce((sum, b) => sum + b.total_project_value, 0)
        .toLocaleString()} value`,
    },
    {
      label: 'Messages Generated',
      value: messagesGenerated,
      subValue: `${totalCampaigns} campaigns`,
    },
  ]

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-clay-500">Loading metrics...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-clay-900">Metrics</h1>
        <p className="text-sm text-clay-500 mt-1">
          Overview of your review removal business performance
        </p>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {primaryMetrics.map((metric) => (
          <div key={metric.label} className="clay-card">
            <div className="text-sm text-clay-500 mb-1">{metric.label}</div>
            <div className="text-3xl font-semibold text-clay-900">{metric.value}</div>
            {metric.subValue && (
              <div className="text-xs text-clay-400 mt-1">{metric.subValue}</div>
            )}
          </div>
        ))}
      </div>

      {/* Pipeline Funnel */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="clay-card">
          <h2 className="text-lg font-medium text-clay-900 mb-4">Pipeline Funnel</h2>
          <div className="space-y-3">
            {[
              { label: 'New Leads', count: newLeads, color: 'bg-clay-400' },
              { label: 'Active Outreach', count: activeOutreach, color: 'bg-yellow-400' },
              { label: 'Positive Replies', count: positiveReplies, color: 'bg-green-400' },
              { label: 'Proposals Sent', count: proposalsSent, color: 'bg-blue-400' },
              { label: 'Deals Closed', count: dealsClosed, color: 'bg-green-600' },
              { label: 'In Delivery', count: inDelivery, color: 'bg-purple-400' },
            ].map((item) => (
              <div key={item.label} className="flex items-center">
                <div className="w-32 text-sm text-clay-600">{item.label}</div>
                <div className="flex-1 h-6 bg-clay-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all`}
                    style={{
                      width: `${totalBusinesses > 0 ? (item.count / totalBusinesses) * 100 : 0}%`,
                    }}
                  />
                </div>
                <div className="w-12 text-right text-sm font-medium text-clay-900 ml-3">
                  {item.count}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="clay-card">
          <h2 className="text-lg font-medium text-clay-900 mb-4">Email Quality</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-semibold text-green-700">{emailVerified}</div>
              <div className="text-sm text-green-600">Verified</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-semibold text-yellow-700">{emailRisky}</div>
              <div className="text-sm text-yellow-600">Risky</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-semibold text-red-700">{emailBad}</div>
              <div className="text-sm text-red-600">Bad</div>
            </div>
            <div className="bg-clay-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-semibold text-clay-700">{emailUnverified}</div>
              <div className="text-sm text-clay-600">Unverified</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Tiers */}
      <div className="clay-card">
        <h2 className="text-lg font-medium text-clay-900 mb-4">Pricing Tier Distribution</h2>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl font-semibold text-clay-900">{tierStandard}</div>
            <div className="text-sm text-clay-500 mt-1">Standard</div>
            <div className="text-xs text-clay-400">$125/review (1-24)</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-semibold text-blue-600">{tierVolume}</div>
            <div className="text-sm text-clay-500 mt-1">Volume</div>
            <div className="text-xs text-clay-400">$110/review (25-99)</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-semibold text-purple-600">{tierEnterprise}</div>
            <div className="text-sm text-clay-500 mt-1">Enterprise</div>
            <div className="text-xs text-clay-400">$90/review (100+)</div>
          </div>
        </div>
      </div>

      {/* Stage Breakdown */}
      <div className="mt-6 clay-card">
        <h2 className="text-lg font-medium text-clay-900 mb-4">All Pipeline Stages</h2>
        <div className="grid grid-cols-4 gap-3">
          {PIPELINE_STAGES.map((stage) => {
            const count = businesses.filter((b) => b.pipeline_stage === stage.id).length
            const value = businesses
              .filter((b) => b.pipeline_stage === stage.id)
              .reduce((sum, b) => sum + b.total_project_value, 0)

            return (
              <div
                key={stage.id}
                className="bg-clay-50 rounded-lg p-3 text-center"
              >
                <div className="text-xl font-semibold text-clay-900">{count}</div>
                <div className="text-xs text-clay-600 truncate" title={stage.name}>
                  {stage.name}
                </div>
                <div className="text-xs text-clay-400 mt-0.5">
                  ${value.toLocaleString()}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
