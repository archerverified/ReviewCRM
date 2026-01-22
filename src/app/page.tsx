'use client'

import { useState, useEffect } from 'react'
import { BusinessGrid } from '@/components/BusinessGrid'
import { ImportModal } from '@/components/ImportModal'
import { FilterBar } from '@/components/FilterBar'
import { supabase } from '@/lib/supabase'
import { Business, Tag, FilterState, PIPELINE_STAGES } from '@/types'

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [showImportModal, setShowImportModal] = useState(false)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    tags: [],
    stages: [],
    emailVerificationStatuses: [],
    emailOutreachStatuses: [],
    pricingTiers: [],
    cities: [],
    campaigns: [],
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [businessesRes, tagsRes] = await Promise.all([
        supabase.from('businesses').select('*').order('created_at', { ascending: false }),
        supabase.from('tags').select('*').order('name'),
      ])

      if (businessesRes.data) setBusinesses(businessesRes.data)
      if (tagsRes.data) setTags(tagsRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
    }
    setLoading(false)
  }

  async function handleImportComplete(importedCount: number) {
    setShowImportModal(false)
    await loadData()
  }

  async function handleBulkDelete() {
    if (selectedRows.length === 0) return
    if (!confirm(`Delete ${selectedRows.length} businesses?`)) return

    const { error } = await supabase
      .from('businesses')
      .delete()
      .in('id', selectedRows)

    if (!error) {
      setSelectedRows([])
      await loadData()
    }
  }

  async function handleBulkUpdateStage(stage: string) {
    if (selectedRows.length === 0) return

    const { error } = await supabase
      .from('businesses')
      .update({ pipeline_stage: stage })
      .in('id', selectedRows)

    if (!error) {
      setSelectedRows([])
      await loadData()
    }
  }

  // Filter businesses based on current filters
  const filteredBusinesses = businesses.filter((business) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesSearch =
        business.business_name?.toLowerCase().includes(searchLower) ||
        business.email?.toLowerCase().includes(searchLower) ||
        business.city?.toLowerCase().includes(searchLower)
      if (!matchesSearch) return false
    }

    if (filters.stages.length > 0 && !filters.stages.includes(business.pipeline_stage)) {
      return false
    }

    if (filters.emailVerificationStatuses.length > 0 && !filters.emailVerificationStatuses.includes(business.email_verification_status)) {
      return false
    }

    if (filters.emailOutreachStatuses.length > 0 && !filters.emailOutreachStatuses.includes(business.email_outreach_status)) {
      return false
    }

    return true
  })

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-clay-900">Businesses</h1>
          <p className="text-sm text-clay-500 mt-1">
            {filteredBusinesses.length} of {businesses.length} businesses
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {selectedRows.length > 0 && (
            <>
              <span className="text-sm text-clay-500">{selectedRows.length} selected</span>
              <button
                onClick={handleBulkDelete}
                className="clay-btn-secondary text-red-600 border-red-300 hover:bg-red-50"
              >
                Delete
              </button>
              <select
                onChange={(e) => e.target.value && handleBulkUpdateStage(e.target.value)}
                className="clay-input w-48"
                defaultValue=""
              >
                <option value="">Change Stage...</option>
                {PIPELINE_STAGES.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
            </>
          )}
          <button
            onClick={() => setShowImportModal(true)}
            className="clay-btn-primary"
          >
            Import CSV
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar filters={filters} onFilterChange={setFilters} tags={tags} />

      {/* Business Grid */}
      <div className="clay-card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-clay-500">Loading businesses...</div>
          </div>
        ) : (
          <BusinessGrid
            businesses={filteredBusinesses}
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
            onBusinessUpdate={loadData}
          />
        )}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImportComplete={handleImportComplete}
        />
      )}
    </div>
  )
}
