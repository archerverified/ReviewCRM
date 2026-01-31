'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Business, Campaign, PIPELINE_STAGES } from '@/types'
import { StatCard, Badge } from '@/components/ui'

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

  // Stage counts (using new pipeline stages)
  const leadScraped = businesses.filter((b) => b.pipeline_stage === 'lead_scraped').length
  const emailVerified = businesses.filter((b) => b.pipeline_stage === 'email_verified').length
  const campaignReady = businesses.filter((b) => b.pipeline_stage === 'campaign_ready').length
  const outreachSent = businesses.filter((b) => b.pipeline_stage === 'outreach_sent').length
  const positiveReply = businesses.filter((b) => b.pipeline_stage === 'positive_reply').length
  const proposalSent = businesses.filter((b) => b.pipeline_stage === 'proposal_sent').length
  const dealsClosed = businesses.filter((b) => b.pipeline_stage === 'deal_closed').length
  const inDelivery = businesses.filter((b) => b.pipeline_stage === 'in_service_delivery').length

  // Campaign stats
  const totalCampaigns = campaigns.length

  // Email verification status breakdown (Brainzey)
  const emailGood = businesses.filter((b) => b.email_verification_status === 'good').length
  const emailRisky = businesses.filter((b) => b.email_verification_status === 'risky').length
  const emailBad = businesses.filter((b) => b.email_verification_status === 'bad').length
  const emailUnverified = businesses.filter((b) => b.email_verification_status === 'unverified').length

  // Pricing tier breakdown
  const tierStandard = businesses.filter((b) => b.pricing_tier === 'standard').length
  const tierVolume = businesses.filter((b) => b.pricing_tier === 'volume').length
  const tierEnterprise = businesses.filter((b) => b.pricing_tier === 'enterprise').length

  // Total media reviews
  const totalMediaReviews = businesses.reduce((sum, b) => sum + b.total_media_reviews, 0)

  const primaryMetrics: MetricCard[] = [
    {
      label: 'Total Pipeline Value',
      value: `$${totalPipelineValue.toLocaleString()}`,
      subValue: `${totalBusinesses} businesses`,
      trend: 'up',
    },
    {
      label: 'Avg Project Value',
      value: `$${avgProjectValue.toLocaleString()}`,
      subValue: 'per business',
      trend: 'up',
    },
    {
      label: 'Deals Closed',
      value: dealsClosed,
      subValue: `$${businesses
        .filter((b) => b.pipeline_stage === 'deal_closed')
        .reduce((sum, b) => sum + b.total_project_value, 0)
        .toLocaleString()} value`,
      trend: 'up',
    },
    {
      label: 'Total Media Reviews',
      value: totalMediaReviews.toLocaleString(),
      subValue: `${totalCampaigns} campaigns`,
      trend: 'neutral',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-clay-600"></div>
      </div>
    )
  }

  // Pipeline stages with colors
  const pipelineStages = [
    { label: 'Lead Scraped', count: leadScraped, color: 'bg-clay-300' },
    { label: 'Email Verified', count: emailVerified, color: 'bg-clay-400' },
    { label: 'Campaign Ready', count: campaignReady, color: 'bg-clay-500' },
    { label: 'Outreach Sent', count: outreachSent, color: 'bg-clay-600' },
    { label: 'Positive Reply', count: positiveReply, color: 'bg-status-green-dot' },
    { label: 'Proposal Sent', count: proposalSent, color: 'bg-status-yellow-dot' },
    { label: 'Deals Closed', count: dealsClosed, color: 'bg-status-green-text' },
    { label: 'In Delivery', count: inDelivery, color: 'bg-clay-700' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-clay-900">Metrics & Analytics</h1>
          <p className="text-[13px] text-clay-500 mt-0.5">
            Real-time performance insights for your review removal business
          </p>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-clay-50 rounded-lg p-4 border border-clay-200">
          <div className="text-[11px] font-medium text-clay-500 uppercase tracking-wide mb-1">Pipeline Value</div>
          <div className="text-2xl font-semibold text-clay-900">${(totalPipelineValue / 1000).toFixed(0)}K</div>
        </div>
        <div className="bg-clay-50 rounded-lg p-4 border border-clay-200">
          <div className="text-[11px] font-medium text-clay-500 uppercase tracking-wide mb-1">Active Leads</div>
          <div className="text-2xl font-semibold text-clay-900">{totalBusinesses}</div>
        </div>
        <div className="bg-clay-50 rounded-lg p-4 border border-clay-200">
          <div className="text-[11px] font-medium text-clay-500 uppercase tracking-wide mb-1">Closed Deals</div>
          <div className="text-2xl font-semibold text-clay-900">{dealsClosed}</div>
        </div>
        <div className="bg-clay-50 rounded-lg p-4 border border-clay-200">
          <div className="text-[11px] font-medium text-clay-500 uppercase tracking-wide mb-1">Campaigns</div>
          <div className="text-2xl font-semibold text-clay-900">{totalCampaigns}</div>
        </div>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-4 gap-4">
        {primaryMetrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-white rounded-lg border border-clay-200 p-5 hover:border-clay-300 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-clay-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-clay-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              {metric.trend && (
                <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  metric.trend === 'up' ? 'bg-status-green-bg text-status-green-text' :
                  metric.trend === 'down' ? 'bg-status-red-bg text-status-red-text' :
                  'bg-clay-100 text-clay-500'
                }`}>
                  {metric.trend === 'up' && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                  {metric.trend === 'down' && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                  {metric.trend === 'up' ? '+12%' : metric.trend === 'down' ? '-5%' : '0%'}
                </div>
              )}
            </div>

            <div className="text-[12px] text-clay-500 mb-1">{metric.label}</div>
            <div className="text-2xl font-semibold text-clay-900">
              {metric.value}
            </div>
            {metric.subValue && (
              <div className="text-[11px] text-clay-400 mt-1">{metric.subValue}</div>
            )}
          </div>
        ))}
      </div>

      {/* Pipeline Funnel & Email Quality */}
      <div className="grid grid-cols-2 gap-6">
        {/* Pipeline Funnel */}
        <div className="bg-white rounded-lg border border-clay-200 p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-6 h-6 rounded bg-clay-100 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-clay-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <h2 className="text-[15px] font-semibold text-clay-900">Pipeline Funnel</h2>
          </div>

          <div className="space-y-3">
            {pipelineStages.map((stage) => {
              const percentage = totalBusinesses > 0 ? (stage.count / totalBusinesses) * 100 : 0

              return (
                <div key={stage.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-medium text-clay-700">{stage.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-clay-400">{percentage.toFixed(0)}%</span>
                      <span className="text-[12px] font-semibold text-clay-900 min-w-[1.5rem] text-right">
                        {stage.count}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-clay-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${stage.color} rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Email Quality */}
        <div className="bg-white rounded-lg border border-clay-200 p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-6 h-6 rounded bg-clay-100 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-clay-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-clay-900">Email Quality</h2>
              <p className="text-[11px] text-clay-400">Brainzey Verification Status</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Good */}
            <div className="rounded-lg bg-status-green-bg border border-status-green-dot/20 p-4">
              <div className="flex items-center justify-between mb-2">
                <svg className="w-5 h-5 text-status-green-text" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-[10px] font-medium text-status-green-text bg-white/50 px-1.5 py-0.5 rounded">
                  {totalBusinesses > 0 ? ((emailGood / totalBusinesses) * 100).toFixed(0) : 0}%
                </span>
              </div>
              <div className="text-2xl font-bold text-status-green-text mb-0.5">{emailGood}</div>
              <div className="text-[11px] font-medium text-status-green-text/80">Good</div>
            </div>

            {/* Risky */}
            <div className="rounded-lg bg-status-yellow-bg border border-status-yellow-dot/20 p-4">
              <div className="flex items-center justify-between mb-2">
                <svg className="w-5 h-5 text-status-yellow-text" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-[10px] font-medium text-status-yellow-text bg-white/50 px-1.5 py-0.5 rounded">
                  {totalBusinesses > 0 ? ((emailRisky / totalBusinesses) * 100).toFixed(0) : 0}%
                </span>
              </div>
              <div className="text-2xl font-bold text-status-yellow-text mb-0.5">{emailRisky}</div>
              <div className="text-[11px] font-medium text-status-yellow-text/80">Risky</div>
            </div>

            {/* Bad */}
            <div className="rounded-lg bg-status-red-bg border border-status-red-dot/20 p-4">
              <div className="flex items-center justify-between mb-2">
                <svg className="w-5 h-5 text-status-red-text" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-[10px] font-medium text-status-red-text bg-white/50 px-1.5 py-0.5 rounded">
                  {totalBusinesses > 0 ? ((emailBad / totalBusinesses) * 100).toFixed(0) : 0}%
                </span>
              </div>
              <div className="text-2xl font-bold text-status-red-text mb-0.5">{emailBad}</div>
              <div className="text-[11px] font-medium text-status-red-text/80">Bad</div>
            </div>

            {/* Unverified */}
            <div className="rounded-lg bg-clay-100 border border-clay-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <svg className="w-5 h-5 text-clay-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <span className="text-[10px] font-medium text-clay-600 bg-white/50 px-1.5 py-0.5 rounded">
                  {totalBusinesses > 0 ? ((emailUnverified / totalBusinesses) * 100).toFixed(0) : 0}%
                </span>
              </div>
              <div className="text-2xl font-bold text-clay-700 mb-0.5">{emailUnverified}</div>
              <div className="text-[11px] font-medium text-clay-500">Unverified</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Tiers */}
      <div className="bg-white rounded-lg border border-clay-200 p-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-6 h-6 rounded bg-clay-100 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-clay-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-[15px] font-semibold text-clay-900">Pricing Tier Distribution</h2>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Standard */}
          <div className="rounded-lg border border-clay-200 bg-clay-50 p-5 hover:border-clay-300 transition-colors">
            <div className="text-[12px] font-medium text-clay-500 mb-2">Standard</div>
            <div className="text-4xl font-bold text-clay-900 mb-2">{tierStandard}</div>
            <div className="text-[11px] text-clay-600 font-medium mb-0.5">$125 per review</div>
            <div className="text-[10px] text-clay-400">1-24 reviews</div>
            <div className="mt-3 pt-3 border-t border-clay-200">
              <div className="text-[10px] text-clay-400">Est. Value</div>
              <div className="text-[14px] font-semibold text-clay-700">
                ${(tierStandard * 125 * 10).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Volume */}
          <div className="rounded-lg border-2 border-clay-400 bg-white p-5 relative">
            <div className="absolute -top-2 right-3">
              <span className="px-2 py-0.5 bg-clay-800 text-white text-[9px] font-semibold rounded uppercase tracking-wide">
                Popular
              </span>
            </div>
            <div className="text-[12px] font-medium text-clay-600 mb-2">Volume</div>
            <div className="text-4xl font-bold text-clay-900 mb-2">{tierVolume}</div>
            <div className="text-[11px] text-clay-600 font-medium mb-0.5">$110 per review</div>
            <div className="text-[10px] text-clay-400">25-49 reviews</div>
            <div className="mt-3 pt-3 border-t border-clay-200">
              <div className="text-[10px] text-clay-400">Est. Value</div>
              <div className="text-[14px] font-semibold text-clay-800">
                ${(tierVolume * 110 * 30).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Enterprise */}
          <div className="rounded-lg border border-clay-200 bg-clay-50 p-5 hover:border-clay-300 transition-colors">
            <div className="text-[12px] font-medium text-clay-500 mb-2">Enterprise</div>
            <div className="text-4xl font-bold text-clay-900 mb-2">{tierEnterprise}</div>
            <div className="text-[11px] text-clay-600 font-medium mb-0.5">$90 per review</div>
            <div className="text-[10px] text-clay-400">50+ reviews</div>
            <div className="mt-3 pt-3 border-t border-clay-200">
              <div className="text-[10px] text-clay-400">Est. Value</div>
              <div className="text-[14px] font-semibold text-clay-700">
                ${(tierEnterprise * 90 * 75).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stage Breakdown Grid */}
      <div className="bg-white rounded-lg border border-clay-200 p-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-6 h-6 rounded bg-clay-100 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-clay-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <h2 className="text-[15px] font-semibold text-clay-900">All Pipeline Stages</h2>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {PIPELINE_STAGES.map((stage, index) => {
            const count = businesses.filter((b) => b.pipeline_stage === stage.id).length
            const value = businesses
              .filter((b) => b.pipeline_stage === stage.id)
              .reduce((sum, b) => sum + b.total_project_value, 0)

            // Grayscale intensity based on position
            const bgColors = [
              'bg-clay-50',
              'bg-clay-100',
              'bg-clay-50',
              'bg-clay-100',
              'bg-clay-50',
              'bg-clay-100',
              'bg-clay-50',
              'bg-clay-100',
            ]

            return (
              <div
                key={stage.id}
                className={`${bgColors[index % bgColors.length]} rounded-lg p-4 border border-clay-200 hover:border-clay-300 transition-colors cursor-pointer`}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-clay-900 mb-1">{count}</div>
                  <div className="text-[11px] font-medium text-clay-600 truncate" title={stage.name}>
                    {stage.name}
                  </div>
                  <div className="mt-2 pt-2 border-t border-clay-200">
                    <div className="text-[12px] font-semibold text-clay-500">
                      ${(value / 1000).toFixed(1)}K
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
