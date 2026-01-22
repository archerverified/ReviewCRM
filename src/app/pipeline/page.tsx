'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Business, PIPELINE_STAGES, PipelineStage } from '@/types'

export default function PipelinePage() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBusinesses()
  }, [])

  async function loadBusinesses() {
    setLoading(true)
    const { data } = await supabase
      .from('businesses')
      .select('*')
      .order('updated_at', { ascending: false })

    if (data) setBusinesses(data as Business[])
    setLoading(false)
  }

  async function handleStageChange(businessId: string, newStage: PipelineStage, oldStage: string) {
    // Update business stage
    const { error } = await supabase
      .from('businesses')
      .update({ pipeline_stage: newStage })
      .eq('id', businessId)

    if (error) {
      console.error('Error updating stage:', error)
      return
    }

    // Log stage change
    await supabase.from('stage_history').insert({
      business_id: businessId,
      from_stage: oldStage,
      to_stage: newStage,
    })

    // Update local state
    setBusinesses((prev) =>
      prev.map((b) =>
        b.id === businessId ? { ...b, pipeline_stage: newStage as any } : b
      )
    )
  }

  // Group businesses by stage
  const businessesByStage = PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage.id] = businesses.filter((b) => b.pipeline_stage === stage.id)
    return acc
  }, {} as Record<PipelineStage, Business[]>)

  const stageColors: Record<string, string> = {
    gray: 'bg-clay-100 border-clay-300',
    blue: 'bg-blue-50 border-blue-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    green: 'bg-green-50 border-green-200',
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-clay-500">Loading pipeline...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-clay-900">Pipeline</h1>
        <p className="text-sm text-clay-500 mt-1">
          {businesses.length} total businesses across {PIPELINE_STAGES.length} stages
        </p>
      </div>

      {/* Pipeline Kanban */}
      <div className="overflow-x-auto pb-4">
        <div className="flex space-x-4" style={{ minWidth: 'max-content' }}>
          {PIPELINE_STAGES.map((stage) => {
            const stageBusinesses = businessesByStage[stage.id] || []
            const stageValue = stageBusinesses.reduce(
              (sum, b) => sum + b.total_project_value,
              0
            )

            return (
              <div
                key={stage.id}
                className={`w-72 flex-shrink-0 rounded-xl border ${stageColors[stage.color]} p-3`}
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-clay-900 text-sm">{stage.name}</h3>
                    <p className="text-xs text-clay-500">
                      {stageBusinesses.length} businesses
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-clay-900">
                      ${stageValue.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Business Cards */}
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {stageBusinesses.length === 0 ? (
                    <div className="text-center py-8 text-clay-400 text-sm">
                      No businesses
                    </div>
                  ) : (
                    stageBusinesses.map((business) => (
                      <div
                        key={business.id}
                        className="bg-white rounded-lg p-3 shadow-sm border border-clay-200 hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-clay-900 text-sm truncate">
                              {business.business_name}
                            </h4>
                            <p className="text-xs text-clay-500 mt-0.5">
                              {business.city || 'Unknown City'}
                            </p>
                          </div>
                          <select
                            value={business.pipeline_stage}
                            onChange={(e) =>
                              handleStageChange(
                                business.id,
                                e.target.value as PipelineStage,
                                business.pipeline_stage
                              )
                            }
                            className="text-xs border border-clay-200 rounded px-1 py-0.5 bg-white text-clay-600 ml-2"
                          >
                            {PIPELINE_STAGES.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-clay-100">
                          <span className="text-xs text-clay-500">
                            {business.total_media_reviews} reviews
                          </span>
                          <span className="text-xs font-medium text-clay-900">
                            ${business.total_project_value.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
