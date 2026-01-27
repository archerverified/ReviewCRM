'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Business, Campaign, PIPELINE_STAGES } from '@/types'
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  Target,
  Mail,
  CheckCircle,
  AlertCircle,
  XCircle,
  HelpCircle,
  Users,
  Briefcase,
  ArrowUp,
  ArrowDown,
  Activity,
  Star,
  Send,
  MessageSquare,
  FileText,
  CheckSquare,
  Package,
} from 'lucide-react'

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
  const totalEmails = campaigns.reduce((sum, c) => sum + c.emails_sent, 0)

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

  const metricIcons = [DollarSign, TrendingUp, Target, Star]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-500 p-8 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <div className="h-8 w-48 bg-white/20 rounded-lg animate-pulse mb-2"></div>
            <div className="h-4 w-96 bg-white/20 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <div className="grid grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="clay-card h-32 animate-pulse bg-gray-100"></div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="clay-card h-96 animate-pulse bg-gray-100"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Pipeline stages with icons
  const pipelineStages = [
    { label: 'Lead Scraped', count: leadScraped, color: 'from-gray-400 to-gray-500', icon: Users },
    { label: 'Email Verified', count: emailVerified, color: 'from-blue-400 to-blue-500', icon: Mail },
    { label: 'Campaign Ready', count: campaignReady, color: 'from-cyan-400 to-cyan-500', icon: CheckSquare },
    { label: 'Outreach Sent', count: outreachSent, color: 'from-indigo-400 to-indigo-500', icon: Send },
    { label: 'Positive Reply', count: positiveReply, color: 'from-green-400 to-green-500', icon: MessageSquare },
    { label: 'Proposal Sent', count: proposalSent, color: 'from-yellow-400 to-yellow-500', icon: FileText },
    { label: 'Deals Closed', count: dealsClosed, color: 'from-emerald-500 to-emerald-600', icon: CheckCircle },
    { label: 'In Delivery', count: inDelivery, color: 'from-purple-400 to-purple-500', icon: Package },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-500 p-8 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Metrics & Analytics</h1>
          </div>
          <p className="text-purple-100 text-sm ml-14">
            Real-time performance insights for your review removal business
          </p>

          {/* Quick Summary */}
          <div className="mt-6 grid grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <div className="text-purple-100 text-xs font-medium mb-1">Pipeline Value</div>
              <div className="text-white text-xl font-bold">${(totalPipelineValue / 1000).toFixed(0)}K</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <div className="text-purple-100 text-xs font-medium mb-1">Active Leads</div>
              <div className="text-white text-xl font-bold">{totalBusinesses}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <div className="text-purple-100 text-xs font-medium mb-1">Closed Deals</div>
              <div className="text-white text-xl font-bold">{dealsClosed}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <div className="text-purple-100 text-xs font-medium mb-1">Campaigns</div>
              <div className="text-white text-xl font-bold">{totalCampaigns}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Primary Metrics - Enhanced Cards */}
        <div className="grid grid-cols-4 gap-6">
          {primaryMetrics.map((metric, index) => {
            const Icon = metricIcons[index]
            return (
              <div
                key={metric.label}
                className="clay-card relative overflow-hidden group hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-fuchsia-50 opacity-50 group-hover:opacity-70 transition-opacity"></div>

                <div className="relative z-10 p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg shadow-lg">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    {metric.trend && (
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        metric.trend === 'up' ? 'bg-green-100 text-green-700' :
                        metric.trend === 'down' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {metric.trend === 'up' && <ArrowUp className="w-3 h-3" />}
                        {metric.trend === 'down' && <ArrowDown className="w-3 h-3" />}
                        {metric.trend === 'up' ? '+12%' : metric.trend === 'down' ? '-5%' : '0%'}
                      </div>
                    )}
                  </div>

                  <div className="text-sm text-gray-600 mb-1 font-medium">{metric.label}</div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                    {metric.value}
                  </div>
                  {metric.subValue && (
                    <div className="text-xs text-gray-500 mt-2">{metric.subValue}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Pipeline Funnel & Email Quality */}
        <div className="grid grid-cols-2 gap-6">
          {/* Pipeline Funnel - Enhanced */}
          <div className="clay-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Pipeline Funnel</h2>
            </div>

            <div className="space-y-4">
              {pipelineStages.map((stage) => {
                const percentage = totalBusinesses > 0 ? (stage.count / totalBusinesses) * 100 : 0
                const StageIcon = stage.icon

                return (
                  <div key={stage.label} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <StageIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">{stage.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{percentage.toFixed(1)}%</span>
                        <span className="text-sm font-bold text-gray-900 min-w-[2rem] text-right">
                          {stage.count}
                        </span>
                      </div>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                      <div
                        className={`h-full bg-gradient-to-r ${stage.color} rounded-full transition-all duration-1000 ease-out shadow-sm`}
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Email Quality - Enhanced */}
          <div className="clay-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Email Quality</h2>
                <p className="text-xs text-gray-500">Brainzey Verification Status</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Good */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle className="w-6 h-6 text-white/90" />
                    <div className="text-xs font-semibold text-white/80 bg-white/20 px-2 py-1 rounded-full">
                      {totalBusinesses > 0 ? ((emailGood / totalBusinesses) * 100).toFixed(0) : 0}%
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-white mb-1">{emailGood}</div>
                  <div className="text-sm font-medium text-green-100">Good</div>
                </div>
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              </div>

              {/* Risky */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <AlertCircle className="w-6 h-6 text-white/90" />
                    <div className="text-xs font-semibold text-white/80 bg-white/20 px-2 py-1 rounded-full">
                      {totalBusinesses > 0 ? ((emailRisky / totalBusinesses) * 100).toFixed(0) : 0}%
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-white mb-1">{emailRisky}</div>
                  <div className="text-sm font-medium text-yellow-100">Risky</div>
                </div>
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              </div>

              {/* Bad */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-red-500 to-rose-600 p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <XCircle className="w-6 h-6 text-white/90" />
                    <div className="text-xs font-semibold text-white/80 bg-white/20 px-2 py-1 rounded-full">
                      {totalBusinesses > 0 ? ((emailBad / totalBusinesses) * 100).toFixed(0) : 0}%
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-white mb-1">{emailBad}</div>
                  <div className="text-sm font-medium text-red-100">Bad</div>
                </div>
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              </div>

              {/* Unverified */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-500 to-slate-600 p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <HelpCircle className="w-6 h-6 text-white/90" />
                    <div className="text-xs font-semibold text-white/80 bg-white/20 px-2 py-1 rounded-full">
                      {totalBusinesses > 0 ? ((emailUnverified / totalBusinesses) * 100).toFixed(0) : 0}%
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-white mb-1">{emailUnverified}</div>
                  <div className="text-sm font-medium text-gray-100">Unverified</div>
                </div>
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Tiers - Enhanced */}
        <div className="clay-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Pricing Tier Distribution</h2>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Standard */}
            <div className="relative overflow-hidden rounded-xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 hover:shadow-lg transition-all hover:scale-105">
              <div className="absolute top-3 right-3">
                <DollarSign className="w-8 h-8 text-gray-300" />
              </div>
              <div className="relative z-10">
                <div className="text-sm font-medium text-gray-500 mb-2">Standard</div>
                <div className="text-5xl font-bold text-gray-900 mb-3">{tierStandard}</div>
                <div className="text-xs text-gray-600 font-medium mb-1">$125 per review</div>
                <div className="text-xs text-gray-500">1-24 reviews</div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-xs text-gray-500">Total Value</div>
                  <div className="text-lg font-bold text-gray-900">
                    ${(tierStandard * 125 * 10).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Volume - Most Popular */}
            <div className="relative overflow-hidden rounded-xl border-2 border-blue-400 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105">
              <div className="absolute -top-1 -right-1">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg shadow-md">
                  POPULAR
                </div>
              </div>
              <div className="absolute bottom-3 right-3">
                <DollarSign className="w-8 h-8 text-blue-200" />
              </div>
              <div className="relative z-10">
                <div className="text-sm font-medium text-blue-700 mb-2">Volume</div>
                <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-3">
                  {tierVolume}
                </div>
                <div className="text-xs text-blue-700 font-medium mb-1">$110 per review</div>
                <div className="text-xs text-blue-600">25-49 reviews</div>
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="text-xs text-blue-600">Total Value</div>
                  <div className="text-lg font-bold text-blue-700">
                    ${(tierVolume * 110 * 30).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Enterprise */}
            <div className="relative overflow-hidden rounded-xl border-2 border-purple-400 bg-gradient-to-br from-purple-50 to-fuchsia-50 p-6 hover:shadow-lg transition-all hover:scale-105">
              <div className="absolute top-3 right-3">
                <Star className="w-8 h-8 text-purple-200" />
              </div>
              <div className="relative z-10">
                <div className="text-sm font-medium text-purple-700 mb-2">Enterprise</div>
                <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent mb-3">
                  {tierEnterprise}
                </div>
                <div className="text-xs text-purple-700 font-medium mb-1">$90 per review</div>
                <div className="text-xs text-purple-600">50+ reviews</div>
                <div className="mt-4 pt-4 border-t border-purple-200">
                  <div className="text-xs text-purple-600">Total Value</div>
                  <div className="text-lg font-bold text-purple-700">
                    ${(tierEnterprise * 90 * 75).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stage Breakdown - Enhanced Grid */}
        <div className="clay-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg">
              <Target className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">All Pipeline Stages</h2>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {PIPELINE_STAGES.map((stage, index) => {
              const count = businesses.filter((b) => b.pipeline_stage === stage.id).length
              const value = businesses
                .filter((b) => b.pipeline_stage === stage.id)
                .reduce((sum, b) => sum + b.total_project_value, 0)

              // Color scheme based on position in pipeline
              const colors = [
                'from-gray-100 to-gray-200 border-gray-300 text-gray-700',
                'from-blue-100 to-blue-200 border-blue-300 text-blue-700',
                'from-cyan-100 to-cyan-200 border-cyan-300 text-cyan-700',
                'from-indigo-100 to-indigo-200 border-indigo-300 text-indigo-700',
                'from-green-100 to-green-200 border-green-300 text-green-700',
                'from-yellow-100 to-yellow-200 border-yellow-300 text-yellow-700',
                'from-emerald-100 to-emerald-200 border-emerald-300 text-emerald-700',
                'from-purple-100 to-purple-200 border-purple-300 text-purple-700',
              ]

              return (
                <div
                  key={stage.id}
                  className={`bg-gradient-to-br ${colors[index % colors.length]} rounded-xl p-4 border-2 hover:shadow-lg transition-all hover:scale-105 cursor-pointer`}
                >
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-1">{count}</div>
                    <div className="text-xs font-medium truncate px-1" title={stage.name}>
                      {stage.name}
                    </div>
                    <div className="mt-2 pt-2 border-t border-current opacity-30">
                      <div className="text-xs font-semibold">
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
    </div>
  )
}
