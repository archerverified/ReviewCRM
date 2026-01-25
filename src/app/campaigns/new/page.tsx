'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, tagQueries, businessQueries, TagWithCount } from '@/lib/supabase'
import { Business } from '@/types'
import { toast } from 'sonner'

export default function NewCampaignPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [tags, setTags] = useState<TagWithCount[]>([])
  const [businessesByTag, setBusinessesByTag] = useState<Map<string, Business[]>>(new Map())

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [template, setTemplate] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoadingData(true)
    try {
      // Load tags with business counts
      const tagsWithCounts = await tagQueries.getTagsWithBusinessCount()
      setTags(tagsWithCounts)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  // Load businesses when tags are selected
  useEffect(() => {
    async function loadBusinessesForTags() {
      if (selectedTagIds.length === 0) {
        setBusinessesByTag(new Map())
        return
      }

      try {
        const businesses = await businessQueries.getByTagIds(selectedTagIds)
        // Group by tag for display
        const byTag = new Map<string, Business[]>()
        businesses.forEach((b) => {
          selectedTagIds.forEach((tagId) => {
            if (!byTag.has(tagId)) byTag.set(tagId, [])
          })
        })
        // Since we get unique businesses, we just store them all together
        byTag.set('all', businesses)
        setBusinessesByTag(byTag)
      } catch (error) {
        console.error('Failed to load businesses:', error)
      }
    }

    loadBusinessesForTags()
  }, [selectedTagIds])

  // Calculate total unique businesses across selected tags
  const selectedBusinesses = useMemo(() => {
    return businessesByTag.get('all') || []
  }, [businessesByTag])

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    )
  }

  async function handleCreate() {
    if (!name || !instructions || selectedBusinesses.length === 0) return

    setLoading(true)

    try {
      // Create campaign
      // Note: user_id is required by DB but app is unauthenticated, using placeholder
      const { data: campaign, error } = await supabase
        .from('campaigns')
        .insert({
          name,
          description: description || '',
          ai_instructions: instructions,
          message_template: template || '',
          template: template || '',
          custom_instructions: instructions,
          status: 'draft',
          total_count: selectedBusinesses.length,
          generated_count: 0,
          user_id: '00000000-0000-0000-0000-000000000000', // Placeholder for unauthenticated app
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating campaign:', error)
        toast.error(`Failed to create campaign: ${error.message}`)
        setLoading(false)
        return
      }

      // Link businesses to campaign
      await businessQueries.bulkAssignToCampaign(
        selectedBusinesses.map((b) => b.id),
        campaign.id
      )

      toast.success('Campaign created successfully!')
      router.push(`/campaigns/${campaign.id}`)
    } catch (error) {
      console.error('Error creating campaign:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Failed to create campaign: ${errorMessage}`)
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-clay-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-clay-900">Create New Campaign</h1>
        <p className="text-sm text-clay-500 mt-1">
          Select businesses by tag and set up AI instructions for personalized messages
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

        {/* Target Audience - Tag Selection */}
        <div className="clay-card">
          <h2 className="text-lg font-medium text-clay-900 mb-4">Target Audience</h2>
          <p className="text-sm text-clay-500 mb-4">
            Select one or more tags to include businesses from those imports.
          </p>

          {tags.length === 0 ? (
            <div className="text-center py-8 bg-clay-50 rounded-lg">
              <p className="text-clay-500 mb-2">No tags found.</p>
              <p className="text-sm text-clay-400">
                Import businesses and assign tags to create campaigns.
              </p>
            </div>
          ) : (
            <>
              {/* Tag Selection Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {tags.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id)
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-clay-200 hover:border-clay-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className={`font-medium ${isSelected ? 'text-blue-900' : 'text-clay-900'}`}>
                          {tag.name}
                        </span>
                      </div>
                      <span className={`text-sm ${isSelected ? 'text-blue-600' : 'text-clay-500'}`}>
                        {tag.business_count} business{tag.business_count !== 1 ? 'es' : ''}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Selected Count */}
              <div className="bg-clay-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-semibold text-clay-900">
                  {selectedBusinesses.length}
                </div>
                <div className="text-sm text-clay-500">
                  unique business{selectedBusinesses.length !== 1 ? 'es' : ''} will receive messages
                </div>
                {selectedTagIds.length > 0 && (
                  <div className="mt-2 flex flex-wrap justify-center gap-2">
                    {selectedTagIds.map((tagId) => {
                      const tag = tags.find((t) => t.id === tagId)
                      return tag ? (
                        <span
                          key={tagId}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: tag.color }}
                        >
                          {tag.name}
                        </span>
                      ) : null
                    })}
                  </div>
                )}
              </div>
            </>
          )}
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
            disabled={!name || !instructions || selectedBusinesses.length === 0 || loading}
            className="clay-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : `Create Campaign (${selectedBusinesses.length} businesses)`}
          </button>
        </div>
      </div>
    </div>
  )
}
