'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, tagQueries, businessQueries, TagWithCount } from '@/lib/supabase'
import { Business } from '@/types'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Target,
  Tag,
  Users,
  Sparkles,
  FileText,
  Plus,
  Check,
  Loader2,
  X,
  Info
} from 'lucide-react'

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

  // Form validation
  const [touched, setTouched] = useState({
    name: false,
    instructions: false,
  })

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
      toast.error('Failed to load data')
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

  const removeTag = (tagId: string) => {
    setSelectedTagIds((prev) => prev.filter((id) => id !== tagId))
  }

  async function handleCreate() {
    if (!name || !instructions || selectedBusinesses.length === 0) {
      setTouched({ name: true, instructions: true })
      return
    }

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

  const isFormValid = name.trim() && instructions.trim() && selectedBusinesses.length > 0

  if (loadingData) {
    return (
      <div className="p-6">
        {/* Header Skeleton */}
        <div className="animate-pulse">
          <div className="h-48 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl mb-8" />
          <div className="space-y-6 max-w-4xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
                <div className="space-y-3">
                  <div className="h-10 bg-gray-100 rounded" />
                  <div className="h-10 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Enhanced Header with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-6 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link
                href="/campaigns"
                className="flex items-center justify-center w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                  <span>Campaigns</span>
                  <span>/</span>
                  <span className="text-white font-medium">New Campaign</span>
                </div>
                <h1 className="text-2xl font-bold">Create New Campaign</h1>
              </div>
            </div>
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Target className="w-7 h-7 text-white" />
            </div>
          </div>
          <p className="text-white/80 text-sm max-w-2xl">
            Set up AI-powered personalized messages for your targeted businesses. Select tags, provide instructions, and let Claude generate custom outreach.
          </p>
        </div>
      </div>

      {/* Form Container */}
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Campaign Details */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Campaign Details</h2>
                <p className="text-xs text-gray-500">Basic information about your campaign</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setTouched({ ...touched, name: true })}
                  placeholder="e.g., January Outreach - Restaurants"
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm transition-all duration-200 ${
                    touched.name && !name.trim()
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20 bg-white'
                  } focus:outline-none focus:ring-4`}
                />
              </div>
              {touched.name && !name.trim() && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Campaign name is required
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-gray-400 text-xs font-normal">(optional)</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this campaign"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Target Audience - Tag Selection */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Target Audience</h2>
                  <p className="text-xs text-gray-500">Select businesses by tag</p>
                </div>
              </div>
              {selectedTagIds.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-lg">
                  <Tag className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-semibold text-indigo-600">
                    {selectedTagIds.length} tag{selectedTagIds.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {tags.length === 0 ? (
              <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl border border-gray-200">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Tag className="w-8 h-8 text-gray-500" />
                </div>
                <p className="text-gray-700 font-medium mb-1">No tags found</p>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                  Import businesses and assign tags to create campaigns.
                </p>
                <Link
                  href="/businesses"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-lg shadow-indigo-500/25 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Import Businesses
                </Link>
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
                        className={`group relative flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                          isSelected
                            ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg shadow-indigo-500/20 scale-[1.02]'
                            : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md hover:scale-[1.01]'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                              isSelected ? 'scale-110' : ''
                            }`}
                            style={{ backgroundColor: isSelected ? tag.color : `${tag.color}30` }}
                          >
                            <Tag className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`font-semibold text-sm mb-0.5 ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                              {tag.name}
                            </div>
                            <div className={`text-xs ${isSelected ? 'text-indigo-600' : 'text-gray-500'}`}>
                              {tag.business_count} business{tag.business_count !== 1 ? 'es' : ''}
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center animate-in zoom-in duration-200">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Selected Count Display with Animation */}
                <div className={`relative overflow-hidden rounded-xl transition-all duration-300 ${
                  selectedBusinesses.length > 0
                    ? 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6'
                    : 'bg-gray-100 p-6'
                }`}>
                  {selectedBusinesses.length > 0 && (
                    <>
                      <div className="absolute inset-0 bg-black/10" />
                      <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl" />
                    </>
                  )}

                  <div className="relative z-10 text-center">
                    <div className={`text-5xl font-bold mb-2 transition-all duration-300 ${
                      selectedBusinesses.length > 0 ? 'text-white' : 'text-gray-400'
                    }`}>
                      {selectedBusinesses.length}
                    </div>
                    <div className={`text-sm font-medium mb-4 ${
                      selectedBusinesses.length > 0 ? 'text-white/90' : 'text-gray-500'
                    }`}>
                      unique business{selectedBusinesses.length !== 1 ? 'es' : ''} will receive messages
                    </div>

                    {selectedTagIds.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-2">
                        {selectedTagIds.map((tagId) => {
                          const tag = tags.find((t) => t.id === tagId)
                          return tag ? (
                            <span
                              key={tagId}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-white/20 backdrop-blur-sm border border-white/20 hover:bg-white/30 transition-all duration-200 group"
                            >
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: 'white' }}
                              />
                              {tag.name}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeTag(tagId)
                                }}
                                className="ml-0.5 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ) : null
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* AI Instructions */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">AI Instructions</h2>
                <p className="text-xs text-gray-500">Guide Claude on how to personalize messages</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructions for Claude <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  onBlur={() => setTouched({ ...touched, instructions: true })}
                  placeholder="e.g., Focus on building trust quickly. Mention that we've helped similar restaurants in their area. Keep the tone friendly but professional. Emphasize quick wins and ROI."
                  rows={5}
                  maxLength={1000}
                  className={`w-full px-4 py-3 border rounded-xl text-sm transition-all duration-200 resize-none ${
                    touched.instructions && !instructions.trim()
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20 bg-white'
                  } focus:outline-none focus:ring-4`}
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                  {instructions.length}/1000
                </div>
              </div>
              {touched.instructions && !instructions.trim() ? (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  AI instructions are required
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  These instructions guide how Claude personalizes each message for maximum engagement
                </p>
              )}
            </div>

            {/* Tips Box */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Info className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-blue-900 mb-1">Pro Tips</h3>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Be specific about tone and style (formal, friendly, concise)</li>
                    <li>• Mention key benefits or value propositions to highlight</li>
                    <li>• Include any industry-specific knowledge to reference</li>
                    <li>• Specify desired call-to-action approach</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Template <span className="text-gray-400 text-xs font-normal">(optional)</span>
              </label>
              <textarea
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                placeholder="Provide a template structure if you want messages to follow a specific format. Leave blank to let Claude create freely based on instructions."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 resize-none"
              />
              <p className="mt-1.5 text-xs text-gray-500">
                Optional: Provide a structure for Claude to follow while still personalizing content
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
          <Link
            href="/campaigns"
            className="flex items-center gap-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Cancel
          </Link>
          <button
            onClick={handleCreate}
            disabled={!isFormValid || loading}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              !isFormValid || loading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.02]'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Campaign...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create Campaign ({selectedBusinesses.length} business{selectedBusinesses.length !== 1 ? 'es' : ''})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
