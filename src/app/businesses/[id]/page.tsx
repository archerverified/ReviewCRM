'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Business, StageHistory, PIPELINE_STAGES, getStageInfo } from '@/types'

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
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-clay-500">Loading business...</div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="p-6 text-center">
        <p className="text-clay-500">Business not found</p>
      </div>
    )
  }

  const stageInfo = getStageInfo(business.pipeline_stage)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <button
            onClick={() => router.push('/')}
            className="text-sm text-clay-500 hover:text-clay-700 mb-2 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Businesses
          </button>
          <h1 className="text-2xl font-semibold text-clay-900">{business.business_name}</h1>
          <div className="flex items-center space-x-3 mt-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                stageInfo.color === 'green'
                  ? 'bg-green-100 text-green-700'
                  : stageInfo.color === 'blue'
                  ? 'bg-blue-100 text-blue-700'
                  : stageInfo.color === 'yellow'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-clay-100 text-clay-700'
              }`}
            >
              {stageInfo.name}
            </span>
            <span className="text-lg font-medium text-clay-900">
              ${business.total_project_value.toLocaleString()}
            </span>
          </div>
        </div>

        <select
          value={business.pipeline_stage}
          onChange={(e) => handleStageChange(e.target.value)}
          className="clay-input w-48"
        >
          {PIPELINE_STAGES.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Contact Info */}
        <div className="col-span-2 space-y-6">
          {/* Contact Information */}
          <div className="clay-card">
            <h2 className="text-lg font-medium text-clay-900 mb-4">Contact Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-clay-500 uppercase tracking-wide">Email</label>
                <p className="text-sm text-clay-900 mt-0.5">
                  {business.email || <span className="text-clay-400">Not available</span>}
                </p>
              </div>
              <div>
                <label className="text-xs text-clay-500 uppercase tracking-wide">Phone</label>
                <p className="text-sm text-clay-900 mt-0.5">
                  {business.phone || <span className="text-clay-400">Not available</span>}
                </p>
              </div>
              <div>
                <label className="text-xs text-clay-500 uppercase tracking-wide">Website</label>
                <p className="text-sm text-clay-900 mt-0.5">
                  {business.website_url ? (
                    <a
                      href={business.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-blue hover:underline"
                    >
                      {business.website_url}
                    </a>
                  ) : (
                    <span className="text-clay-400">Not available</span>
                  )}
                </p>
              </div>
              <div>
                <label className="text-xs text-clay-500 uppercase tracking-wide">Email Verification</label>
                <p className="text-sm mt-0.5">
                  <span
                    className={`font-medium capitalize ${
                      business.email_verification_status === 'good'
                        ? 'text-green-600'
                        : business.email_verification_status === 'risky'
                        ? 'text-yellow-600'
                        : business.email_verification_status === 'bad'
                        ? 'text-red-600'
                        : 'text-clay-400'
                    }`}
                  >
                    {business.email_verification_status}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-xs text-clay-500 uppercase tracking-wide">Location</label>
                <p className="text-sm text-clay-900 mt-0.5">
                  {[business.city, business.state]
                    .filter(Boolean)
                    .join(', ') || <span className="text-clay-400">Not available</span>}
                </p>
              </div>
              <div>
                <label className="text-xs text-clay-500 uppercase tracking-wide">Google Maps</label>
                <p className="text-sm text-clay-900 mt-0.5">
                  {business.gmaps_url ? (
                    <a
                      href={business.gmaps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-blue hover:underline"
                    >
                      View on Maps
                    </a>
                  ) : (
                    <span className="text-clay-400">Not available</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Review Breakdown */}
          <div className="clay-card">
            <h2 className="text-lg font-medium text-clay-900 mb-4">Review Breakdown</h2>
            <div className="grid grid-cols-5 gap-3 mb-4">
              <div className="text-center bg-clay-50 rounded-lg p-3">
                <div className="text-xl font-semibold text-clay-900">
                  {business.google_rating?.toFixed(1) || '-'}
                </div>
                <div className="text-xs text-clay-500 mt-1">Current Rating</div>
              </div>
              <div className="text-center bg-green-50 rounded-lg p-3">
                <div className="text-xl font-semibold text-green-600">
                  {business.projected_rating?.toFixed(1) || '-'}
                </div>
                <div className="text-xs text-clay-500 mt-1">Projected</div>
              </div>
              <div className="text-center bg-clay-50 rounded-lg p-3">
                <div className="text-xl font-semibold text-clay-900">
                  {business.total_reviews}
                </div>
                <div className="text-xs text-clay-500 mt-1">Total Reviews</div>
              </div>
              <div className="text-center bg-red-50 rounded-lg p-3">
                <div className="text-xl font-semibold text-red-600">
                  {business.total_media_reviews}
                </div>
                <div className="text-xs text-clay-500 mt-1">Media Reviews</div>
              </div>
              <div className="text-center bg-blue-50 rounded-lg p-3">
                <div className="text-xl font-semibold text-blue-600">
                  +{((business.projected_rating || 0) - (business.google_rating || 0)).toFixed(1)}
                </div>
                <div className="text-xs text-clay-500 mt-1">Rating Boost</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center bg-red-50 rounded-lg p-3">
                <div className="text-lg font-semibold text-red-600">
                  {business.one_star_media_reviews}
                </div>
                <div className="text-xs text-clay-500 mt-1">1-Star w/ Media</div>
              </div>
              <div className="text-center bg-yellow-50 rounded-lg p-3">
                <div className="text-lg font-semibold text-yellow-600">
                  {business.two_star_media_reviews}
                </div>
                <div className="text-xs text-clay-500 mt-1">2-Star w/ Media</div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="clay-card">
            <h2 className="text-lg font-medium text-clay-900 mb-4">Pricing</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-sm text-clay-500 mb-1">Tier</div>
                <div
                  className={`text-lg font-medium capitalize ${
                    business.pricing_tier === 'enterprise'
                      ? 'text-purple-600'
                      : business.pricing_tier === 'volume'
                      ? 'text-blue-600'
                      : 'text-clay-900'
                  }`}
                >
                  {business.pricing_tier || 'N/A'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-clay-500 mb-1">Price Per Review</div>
                <div className="text-lg font-medium text-clay-900">
                  ${business.price_per_review}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-clay-500 mb-1">Total Value</div>
                <div className="text-lg font-semibold text-green-600">
                  ${business.total_project_value.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Personalized Message */}
          {business.personalized_message && (
            <div className="clay-card">
              <h2 className="text-lg font-medium text-clay-900 mb-4">Personalized Message</h2>
              <div className="bg-clay-50 rounded-lg p-4 text-sm text-clay-700 whitespace-pre-wrap">
                {business.personalized_message}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="clay-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-clay-900">Notes</h2>
              <button
                onClick={handleSaveNotes}
                disabled={saving}
                className="clay-btn-secondary text-sm"
              >
                {saving ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this business..."
              rows={4}
              className="clay-input"
            />
          </div>
        </div>

        {/* Right Column - Activity */}
        <div className="space-y-6">
          {/* Stage History */}
          <div className="clay-card">
            <h2 className="text-lg font-medium text-clay-900 mb-4">Stage History</h2>
            {stageHistory.length === 0 ? (
              <p className="text-sm text-clay-400 text-center py-4">No history yet</p>
            ) : (
              <div className="space-y-3">
                {stageHistory.map((entry) => {
                  const toStage = PIPELINE_STAGES.find((s) => s.id === entry.new_stage)
                  const fromStage = entry.old_stage
                    ? PIPELINE_STAGES.find((s) => s.id === entry.old_stage)
                    : null

                  return (
                    <div
                      key={entry.id}
                      className="flex items-start space-x-3 text-sm"
                    >
                      <div className="w-2 h-2 rounded-full bg-accent-blue mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="text-clay-700">
                          {fromStage ? (
                            <>
                              <span className="text-clay-500">{fromStage.name}</span>
                              {' → '}
                            </>
                          ) : null}
                          <span className="font-medium">{toStage?.name}</span>
                        </p>
                        <p className="text-xs text-clay-400">
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
          <div className="clay-card">
            <h2 className="text-lg font-medium text-clay-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {business.email && (
                <a
                  href={`mailto:${business.email}`}
                  className="clay-btn-secondary w-full justify-center"
                >
                  Send Email
                </a>
              )}
              {business.website_url && (
                <a
                  href={business.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="clay-btn-secondary w-full justify-center"
                >
                  Visit Website
                </a>
              )}
              {business.gmaps_url && (
                <a
                  href={business.gmaps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="clay-btn-secondary w-full justify-center"
                >
                  View on Google Maps
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
