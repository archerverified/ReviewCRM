'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Business, StageHistory, PIPELINE_STAGES, getStageInfo } from '@/types'
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Star,
  TrendingUp,
  DollarSign,
  History,
  MessageSquare,
  ExternalLink,
  ChevronDown,
  Save,
  Sparkles,
  Camera,
  Shield,
  Zap,
  Target
} from 'lucide-react'

export default function BusinessDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [business, setBusiness] = useState<Business | null>(null)
  const [stageHistory, setStageHistory] = useState<StageHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const businessId = params.id as string

  useEffect(() => {
    loadData()
  }, [businessId])

  async function loadData() {
    setLoading(true)

    const [businessRes, historyRes] = await Promise.all([
      supabase.from('businesses').select('*').eq('id', businessId).single(),
      supabase
        .from('stage_history')
        .select('*')
        .eq('business_id', businessId)
        .order('changed_at', { ascending: false }),
    ])

    if (businessRes.data) {
      setBusiness(businessRes.data as Business)
      setNotes(businessRes.data.notes || '')
    }
    if (historyRes.data) setStageHistory(historyRes.data as StageHistory[])

    setLoading(false)
  }

  async function handleStageChange(newStage: string) {
    if (!business) return

    const oldStage = business.pipeline_stage

    // Update business
    await supabase
      .from('businesses')
      .update({ pipeline_stage: newStage })
      .eq('id', businessId)

    // Log history
    await supabase.from('stage_history').insert({
      business_id: businessId,
      old_stage: oldStage,
      new_stage: newStage,
    })

    await loadData()
  }

  async function handleSaveNotes() {
    if (!business) return
    setSaving(true)

    await supabase
      .from('businesses')
      .update({ notes })
      .eq('id', businessId)

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-6">
        <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded-lg" />
          <div className="h-12 w-72 bg-gray-200 rounded-lg" />
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm h-48" />
              <div className="bg-white rounded-2xl p-6 shadow-sm h-64" />
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm h-96" />
          </div>
        </div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Business Not Found</h2>
            <p className="text-gray-500 mb-6">The business you're looking for doesn't exist or has been removed.</p>
            <button
              onClick={() => router.push('/contacts')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Contacts
            </button>
          </div>
        </div>
      </div>
    )
  }

  const stageInfo = getStageInfo(business.pipeline_stage)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => router.push('/contacts')}
            className="text-sm text-white/80 hover:text-white mb-4 flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Contacts
          </button>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{business.business_name}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm ${
                      stageInfo.color === 'green'
                        ? 'bg-emerald-400/20 text-emerald-100'
                        : stageInfo.color === 'blue'
                        ? 'bg-blue-400/20 text-blue-100'
                        : stageInfo.color === 'yellow'
                        ? 'bg-amber-400/20 text-amber-100'
                        : 'bg-white/20 text-white'
                    }`}
                  >
                    <Target className="w-3.5 h-3.5" />
                    {stageInfo.name}
                  </span>
                  <span className="flex items-center gap-1 text-lg font-semibold text-white">
                    <DollarSign className="w-5 h-5" />
                    {business.total_project_value.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="relative">
              <select
                value={business.pipeline_stage}
                onChange={(e) => handleStageChange(e.target.value)}
                className="appearance-none bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer hover:bg-white/30 transition-colors"
              >
                {PIPELINE_STAGES.map((stage) => (
                  <option key={stage.id} value={stage.id} className="text-gray-900">
                    {stage.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 max-w-5xl mx-auto -mt-4">

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Contact Info */}
        <div className="col-span-2 space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Mail className="w-4 h-4 text-indigo-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide font-medium">Email</label>
                  <p className="text-sm text-gray-900 mt-0.5 font-medium">
                    {business.email || <span className="text-gray-400 font-normal">Not available</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide font-medium">Phone</label>
                  <p className="text-sm text-gray-900 mt-0.5 font-medium">
                    {business.phone || <span className="text-gray-400 font-normal">Not available</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide font-medium">Website</label>
                  <p className="text-sm text-gray-900 mt-0.5">
                    {business.website_url ? (
                      <a
                        href={business.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 group"
                      >
                        {business.website_url.replace(/^https?:\/\//, '').slice(0, 30)}
                        <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ) : (
                      <span className="text-gray-400">Not available</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <Shield className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide font-medium">Email Verification</label>
                  <p className="text-sm mt-0.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                        business.email_verification_status === 'good'
                          ? 'bg-emerald-100 text-emerald-700'
                          : business.email_verification_status === 'risky'
                          ? 'bg-amber-100 text-amber-700'
                          : business.email_verification_status === 'bad'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {business.email_verification_status || 'Unknown'}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide font-medium">Location</label>
                  <p className="text-sm text-gray-900 mt-0.5 font-medium">
                    {[business.city, business.state]
                      .filter(Boolean)
                      .join(', ') || <span className="text-gray-400 font-normal">Not available</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide font-medium">Google Maps</label>
                  <p className="text-sm text-gray-900 mt-0.5">
                    {business.gmaps_url ? (
                      <a
                        href={business.gmaps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 group"
                      >
                        View on Maps
                        <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ) : (
                      <span className="text-gray-400">Not available</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Review Breakdown */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <Star className="w-4 h-4 text-amber-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Review Breakdown</h2>
            </div>
            <div className="grid grid-cols-5 gap-3 mb-4">
              <div className="relative overflow-hidden text-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-100">
                <Star className="w-4 h-4 text-amber-400 absolute top-2 right-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {business.google_rating?.toFixed(1) || '-'}
                </div>
                <div className="text-xs text-gray-500 mt-1 font-medium">Current Rating</div>
              </div>
              <div className="relative overflow-hidden text-center bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-100">
                <TrendingUp className="w-4 h-4 text-emerald-400 absolute top-2 right-2" />
                <div className="text-2xl font-bold text-emerald-600">
                  {business.projected_rating?.toFixed(1) || '-'}
                </div>
                <div className="text-xs text-gray-500 mt-1 font-medium">Projected</div>
              </div>
              <div className="relative overflow-hidden text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-100">
                <MessageSquare className="w-4 h-4 text-blue-400 absolute top-2 right-2" />
                <div className="text-2xl font-bold text-blue-600">
                  {business.total_reviews}
                </div>
                <div className="text-xs text-gray-500 mt-1 font-medium">Total Reviews</div>
              </div>
              <div className="relative overflow-hidden text-center bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-100">
                <Camera className="w-4 h-4 text-red-400 absolute top-2 right-2" />
                <div className="text-2xl font-bold text-red-600">
                  {business.total_media_reviews}
                </div>
                <div className="text-xs text-gray-500 mt-1 font-medium">Media Reviews</div>
              </div>
              <div className="relative overflow-hidden text-center bg-gradient-to-br from-indigo-50 to-purple-100 rounded-xl p-4 border border-indigo-100">
                <Zap className="w-4 h-4 text-indigo-400 absolute top-2 right-2" />
                <div className="text-2xl font-bold text-indigo-600">
                  +{((business.projected_rating || 0) - (business.google_rating || 0)).toFixed(1)}
                </div>
                <div className="text-xs text-gray-500 mt-1 font-medium">Rating Boost</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 border border-red-100">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">⭐</span>
                  <span className="text-lg font-bold text-red-600">
                    {business.one_star_media_reviews}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1 font-medium">1-Star w/ Media</div>
              </div>
              <div className="text-center bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-100">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">⭐⭐</span>
                  <span className="text-lg font-bold text-amber-600">
                    {business.two_star_media_reviews}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1 font-medium">2-Star w/ Media</div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Pricing</h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
                <div className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">Tier</div>
                <div
                  className={`text-lg font-bold capitalize ${
                    business.pricing_tier === 'enterprise'
                      ? 'text-purple-600'
                      : business.pricing_tier === 'volume'
                      ? 'text-blue-600'
                      : 'text-gray-900'
                  }`}
                >
                  {business.pricing_tier || 'N/A'}
                </div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-100">
                <div className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">Per Review</div>
                <div className="text-lg font-bold text-gray-900">
                  ${business.price_per_review}
                </div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-100">
                <div className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">Total Value</div>
                <div className="text-lg font-bold text-emerald-600">
                  ${business.total_project_value.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Personalized Message */}
          {business.personalized_message && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-pink-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Personalized Message</h2>
              </div>
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap border border-indigo-100">
                {business.personalized_message}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
              </div>
              <button
                onClick={handleSaveNotes}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this business..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all resize-none"
            />
          </div>
        </div>

        {/* Right Column - Activity */}
        <div className="space-y-6">
          {/* Stage History */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <History className="w-4 h-4 text-purple-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Stage History</h2>
            </div>
            {stageHistory.length === 0 ? (
              <div className="text-center py-8">
                <History className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No history yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {stageHistory.map((entry, index) => {
                  const toStage = PIPELINE_STAGES.find((s) => s.id === entry.new_stage)
                  const fromStage = entry.old_stage
                    ? PIPELINE_STAGES.find((s) => s.id === entry.old_stage)
                    : null

                  return (
                    <div
                      key={entry.id}
                      className="relative flex items-start gap-3 text-sm pl-4"
                    >
                      {index !== stageHistory.length - 1 && (
                        <div className="absolute left-[7px] top-4 w-0.5 h-full bg-gray-200" />
                      )}
                      <div className="w-3 h-3 rounded-full bg-indigo-500 border-2 border-white shadow-sm flex-shrink-0 mt-0.5 relative z-10" />
                      <div className="flex-1 pb-3">
                        <p className="text-gray-700">
                          {fromStage ? (
                            <>
                              <span className="text-gray-400">{fromStage.name}</span>
                              <span className="text-gray-400 mx-1">→</span>
                            </>
                          ) : null}
                          <span className="font-medium text-gray-900">{toStage?.name}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(entry.changed_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-cyan-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="space-y-2">
              {business.email && (
                <a
                  href={`mailto:${business.email}`}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all shadow-sm hover:shadow-md"
                >
                  <Mail className="w-4 h-4" />
                  Send Email
                </a>
              )}
              {business.website_url && (
                <a
                  href={business.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  Visit Website
                </a>
              )}
              {business.gmaps_url && (
                <a
                  href={business.gmaps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  View on Google Maps
                </a>
              )}
              {!business.email && !business.website_url && !business.gmaps_url && (
                <p className="text-sm text-gray-400 text-center py-4">No actions available</p>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
