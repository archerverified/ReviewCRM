'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Campaign, Business, PlusvibeExportRow } from '@/types'

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  const campaignId = params.id as string

  useEffect(() => {
    loadData()
  }, [campaignId])

  async function loadData() {
    setLoading(true)

    const [campaignRes, businessesRes] = await Promise.all([
      supabase.from('campaigns').select('*').eq('id', campaignId).single(),
      supabase.from('businesses').select('*').eq('campaign_id', campaignId),
    ])

    if (campaignRes.data) setCampaign(campaignRes.data as Campaign)
    if (businessesRes.data) setBusinesses(businessesRes.data as Business[])

    setLoading(false)
  }

  async function handleGenerateMessages() {
    if (!campaign) return

    setGenerating(true)
    setProgress({ current: 0, total: businesses.length })

    // Update campaign status
    await supabase
      .from('campaigns')
      .update({ status: 'generating' })
      .eq('id', campaignId)

    // Generate messages one at a time
    for (let i = 0; i < businesses.length; i++) {
      const business = businesses[i]
      setProgress({ current: i + 1, total: businesses.length })

      try {
        // Call API route for message generation
        const response = await fetch('/api/generate-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            business,
            instructions: campaign.ai_instructions,
            template: campaign.message_template,
          }),
        })

        const result = await response.json()

        if (result.success && result.message) {
          // Update business with generated message
          await supabase
            .from('businesses')
            .update({ personalized_message: result.message })
            .eq('id', business.id)

          // Update campaign progress
          await supabase
            .from('campaigns')
            .update({ generated_count: i + 1 })
            .eq('id', campaignId)
        }
      } catch (error) {
        console.error('Error generating message for', business.business_name, error)
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 200))
    }

    // Mark campaign as ready
    await supabase
      .from('campaigns')
      .update({ status: 'ready', generated_count: businesses.length })
      .eq('id', campaignId)

    setGenerating(false)
    await loadData()
  }

  function handleExportPlusvibe() {
    if (!campaign) return

    // Create Plusvibe format CSV
    const rows: PlusvibeExportRow[] = businesses
      .filter((b) => b.personalized_message)
      .map((b) => {
        // Extract first/last name from business name if possible
        const nameParts = b.business_name.split(' ')
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''

        return {
          FirstName: firstName,
          LastName: lastName,
          Email: b.email || '',
          CompanyName: b.business_name,
          City: b.city || '',
          Phone: b.phone || '',
          MediaReviews: b.total_media_reviews,
          ProjectValue: b.total_project_value,
          PersonalizedMessage: b.personalized_message || '',
        }
      })

    // Convert to CSV
    const headers = Object.keys(rows[0] || {}).join(',')
    const csvRows = rows.map((row) =>
      Object.values(row)
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    )
    const csv = [headers, ...csvRows].join('\n')

    // Download
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${campaign.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)

    // Update campaign status
    supabase
      .from('campaigns')
      .update({ status: 'exported' })
      .eq('id', campaignId)
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-clay-500">Loading campaign...</div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="p-6 text-center">
        <p className="text-clay-500">Campaign not found</p>
      </div>
    )
  }

  const messagesGenerated = businesses.filter((b) => b.personalized_message).length

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-semibold text-clay-900">{campaign.name}</h1>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                campaign.status === 'ready'
                  ? 'bg-green-100 text-green-700'
                  : campaign.status === 'generating'
                  ? 'bg-yellow-100 text-yellow-700'
                  : campaign.status === 'exported'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-clay-100 text-clay-700'
              }`}
            >
              {campaign.status}
            </span>
          </div>
          {campaign.description && (
            <p className="text-sm text-clay-500 mt-1">{campaign.description}</p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {campaign.status === 'draft' && (
            <button
              onClick={handleGenerateMessages}
              disabled={generating || businesses.length === 0}
              className="clay-btn-primary disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate Messages'}
            </button>
          )}
          {(campaign.status === 'ready' || campaign.status === 'exported') && (
            <button onClick={handleExportPlusvibe} className="clay-btn-primary">
              Export to Plusvibe
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {generating && (
        <div className="clay-card mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-clay-700">Generating messages...</span>
            <span className="text-sm text-clay-500">
              {progress.current} / {progress.total}
            </span>
          </div>
          <div className="w-full bg-clay-200 rounded-full h-2">
            <div
              className="bg-accent-blue h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="clay-card text-center">
          <div className="text-3xl font-semibold text-clay-900">{businesses.length}</div>
          <div className="text-sm text-clay-500">Total Businesses</div>
        </div>
        <div className="clay-card text-center">
          <div className="text-3xl font-semibold text-green-600">{messagesGenerated}</div>
          <div className="text-sm text-clay-500">Messages Generated</div>
        </div>
        <div className="clay-card text-center">
          <div className="text-3xl font-semibold text-clay-900">
            ${businesses.reduce((sum, b) => sum + b.total_project_value, 0).toLocaleString()}
          </div>
          <div className="text-sm text-clay-500">Total Pipeline Value</div>
        </div>
      </div>

      {/* AI Instructions */}
      <div className="clay-card mb-6">
        <h2 className="text-lg font-medium text-clay-900 mb-2">AI Instructions</h2>
        <p className="text-sm text-clay-700 whitespace-pre-wrap">{campaign.ai_instructions}</p>
      </div>

      {/* Businesses List */}
      <div className="clay-card p-0 overflow-hidden">
        <table className="clay-table">
          <thead>
            <tr>
              <th>Business</th>
              <th>City</th>
              <th>Media Reviews</th>
              <th>Project Value</th>
              <th>Message Status</th>
            </tr>
          </thead>
          <tbody>
            {businesses.map((business) => (
              <tr key={business.id}>
                <td>
                  <div className="font-medium text-clay-900">{business.business_name}</div>
                  <div className="text-xs text-clay-500">{business.email}</div>
                </td>
                <td className="text-sm text-clay-700">{business.city || '-'}</td>
                <td className="text-sm text-clay-700">{business.total_media_reviews}</td>
                <td className="text-sm font-medium text-clay-900">
                  ${business.total_project_value.toLocaleString()}
                </td>
                <td>
                  {business.personalized_message ? (
                    <span className="inline-flex items-center text-green-600">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Generated
                    </span>
                  ) : (
                    <span className="text-clay-400">Pending</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
