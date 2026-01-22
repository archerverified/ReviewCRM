'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Business, Tag, PIPELINE_STAGES } from '@/types'

export default function NewCampaignPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [tags, setTags] = useState<Tag[]>([])

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [template, setTemplate] = useState('')
  const [selectedTag, setSelectedTag] = useState<string>('')
  const [selectedStage, setSelectedStage] = useState<string>('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [businessesRes, tagsRes] = await Promise.all([
      supabase.from('businesses').select('*'),
      supabase.from('tags').select('*'),
    ])

    if (businessesRes.data) setBusinesses(businessesRes.data as Business[])
    if (tagsRes.data) setTags(tagsRes.data as Tag[])
  }

  // Filter businesses based on selection
  const filteredBusinesses = businesses.filter((b) => {
    if (selectedStage && b.pipeline_stage !== selectedStage) return false
    return true
  })

  async function handleCreate() {
    if (!name || !instructions) return

    setLoading(true)

    // Create campaign
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .insert({
        name,
        description: description || null,
        ai_instructions: instructions,
        message_template: template || null,
        status: 'draft',
        total_count: filteredBusinesses.length,
        generated_count: 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating campaign:', error)
      setLoading(false)
      return
    }

    // Link businesses to campaign
    if (filteredBusinesses.length > 0) {
      await supabase
        .from('businesses')
        .update({ campaign_id: campaign.id })
        .in('id', filteredBusinesses.map(b => b.id))
    }

    router.push(`/campaigns/${campaign.id}`)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-clay-900">Create New Campaign</h1>
        <p className="text-sm text-clay-500 mt-1">
          Set up AI instructions to generate personalized messages
        </p>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Campaign Details */}
        <div className="clay-card">
          <h2 className="text-lg font-medium text-clay-900 mb-4">Campaign Details</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-clay-700 mb-1">
                Campaign Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., January Outreach - Restaurants"
                className="clay-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-clay-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this campaign"
                className="clay-input"
              />
            </div>
          </div>
        </div>

        {/* Target Audience */}
        <div className="clay-card">
          <h2 className="text-lg font-medium text-clay-900 mb-4">Target Audience</h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-clay-700 mb-1">
                Filter by Stage
              </label>
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="clay-input"
              >
                <option value="">All Stages</option>
                {PIPELINE_STAGES.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-clay-700 mb-1">
                Filter by Tag
              </label>
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="clay-input"
              >
                <option value="">All Tags</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-clay-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-semibold text-clay-900">
              {filteredBusinesses.length}
            </div>
            <div className="text-sm text-clay-500">businesses will receive messages</div>
          </div>
        </div>

        {/* AI Instructions */}
        <div className="clay-card">
          <h2 className="text-lg font-medium text-clay-900 mb-4">AI Instructions</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-clay-700 mb-1">
                Instructions for Claude *
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g., Focus on building trust quickly. Mention that we've helped similar restaurants in their area. Keep the tone friendly but professional."
                rows={4}
                className="clay-input"
              />
              <p className="text-xs text-clay-500 mt-1">
                These instructions guide how Claude personalizes each message
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-clay-700 mb-1">
                Message Template (Optional)
              </label>
              <textarea
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                placeholder="Provide a template structure if you want messages to follow a specific format"
                rows={4}
                className="clay-input"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={() => router.push('/campaigns')}
            className="clay-btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name || !instructions || loading}
            className="clay-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Campaign'}
          </button>
        </div>
      </div>
    </div>
  )
}
