'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Business, PIPELINE_STAGES, PipelineStage } from '@/types'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Layers,
  DollarSign,
  Building2,
  MapPin,
  Star,
  GripVertical,
  Plus,
  ChevronDown,
  Users,
  TrendingUp,
  Settings,
  Check,
  Loader2,
  Trash2,
  GripHorizontal,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from 'sonner'

interface CustomStage {
  id: string
  name: string
  color: string
  order: number
  pipeline_id: string | null
}

interface Pipeline {
  id: string
  name: string
  description: string | null
  is_default: boolean
}

// Sortable Stage Column Component
function SortableStageColumn({
  stage,
  businesses,
  stageValue,
  colors,
  onBusinessStageChange,
  onEditStage,
  allStages,
}: {
  stage: CustomStage
  businesses: Business[]
  stageValue: number
  colors: { bg: string; border: string; dot: string; gradient: string }
  onBusinessStageChange: (businessId: string, newStage: PipelineStage, oldStage: string) => void
  onEditStage: (stage: CustomStage) => void
  allStages: CustomStage[]
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`w-80 flex-shrink-0 rounded-xl border-2 ${colors.border} ${colors.bg} shadow-lg hover:shadow-xl transition-all duration-200`}
    >
      {/* Column Header */}
      <div className={`bg-gradient-to-r ${colors.gradient} text-white rounded-t-xl p-4`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button
              {...attributes}
              {...listeners}
              className="p-1 hover:bg-white/20 rounded cursor-grab active:cursor-grabbing"
              title="Drag to reorder"
            >
              <GripHorizontal className="w-4 h-4" />
            </button>
            <div className={`w-3 h-3 ${colors.dot} rounded-full animate-pulse`}></div>
            <h3 className="font-bold text-base">{stage.name}</h3>
          </div>
          <button
            onClick={() => onEditStage(stage)}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            title="Edit stage"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-white/90">
            <Users className="w-3.5 h-3.5" />
            <span>{businesses.length} businesses</span>
          </div>
          <div className="flex items-center gap-1 font-semibold">
            <DollarSign className="w-3.5 h-3.5" />
            <span>${stageValue.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Business Cards */}
      <div className="p-3 space-y-3 max-h-[calc(100vh-350px)] overflow-y-auto">
        {businesses.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-3">
              <Building2 className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm font-medium">No businesses yet</p>
            <p className="text-slate-400 text-xs mt-1">Deals will appear here</p>
          </div>
        ) : (
          businesses.map((business) => {
            const rating = business.google_rating || 0
            const reviewCount = business.total_media_reviews || 0

            return (
              <div
                key={business.id}
                className="bg-white rounded-xl p-4 shadow-md border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className={`w-12 h-12 flex-shrink-0 bg-gradient-to-br ${colors.gradient} rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                    {business.business_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 text-sm truncate group-hover:text-emerald-600 transition-colors">
                      {business.business_name}
                    </h4>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{business.city || 'Unknown City'}</span>
                    </div>
                    {reviewCount > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-slate-600 font-medium">
                          {rating.toFixed(1)}
                        </span>
                        <span className="text-xs text-slate-400">({reviewCount})</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{reviewCount} reviews</span>
                    </div>
                    <div className="flex items-center gap-1 font-bold text-emerald-600">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm">{business.total_project_value.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="relative">
                    <select
                      value={business.pipeline_stage}
                      onChange={(e) =>
                        onBusinessStageChange(
                          business.id,
                          e.target.value as PipelineStage,
                          business.pipeline_stage
                        )
                      }
                      className="w-full text-xs border-2 border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-700 font-medium hover:border-emerald-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all cursor-pointer appearance-none"
                    >
                      {allStages.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Deal Progress</span>
                    <span className="font-medium">
                      {allStages.findIndex(s => s.id === business.pipeline_stage) + 1} / {allStages.length}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${colors.gradient} transition-all duration-500`}
                      style={{
                        width: `${((allStages.findIndex(s => s.id === business.pipeline_stage) + 1) / allStages.length) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default function PipelinePage() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [stages, setStages] = useState<CustomStage[]>([])
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [activePipeline, setActivePipeline] = useState<Pipeline | null>(null)

  // Modal states
  const [showCreatePipeline, setShowCreatePipeline] = useState(false)
  const [showEditStage, setShowEditStage] = useState(false)
  const [editingStage, setEditingStage] = useState<CustomStage | null>(null)

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)

    // Load businesses
    const { data: businessData } = await supabase
      .from('businesses')
      .select('*')
      .order('updated_at', { ascending: false })

    if (businessData) setBusinesses(businessData as Business[])

    // Load pipelines
    const { data: pipelineData } = await supabase
      .from('pipelines')
      .select('*')
      .order('created_at', { ascending: true })

    if (pipelineData && pipelineData.length > 0) {
      setPipelines(pipelineData)
      const defaultPipeline = pipelineData.find(p => p.is_default) || pipelineData[0]
      setActivePipeline(defaultPipeline)

      // Load stages for this pipeline
      const { data: stageData } = await supabase
        .from('pipeline_stages')
        .select('*')
        .eq('pipeline_id', defaultPipeline.id)
        .order('order', { ascending: true })

      if (stageData && stageData.length > 0) {
        setStages(stageData)
      } else {
        // Use default stages if none exist
        setStages(PIPELINE_STAGES.map((s, i) => ({
          id: s.id,
          name: s.name,
          color: s.color,
          order: i,
          pipeline_id: defaultPipeline.id,
        })))
      }
    } else {
      // No pipelines exist, use default stages
      setStages(PIPELINE_STAGES.map((s, i) => ({
        id: s.id,
        name: s.name,
        color: s.color,
        order: i,
        pipeline_id: null,
      })))
    }

    setLoading(false)
  }

  async function handleStageChange(businessId: string, newStage: PipelineStage, oldStage: string) {
    const { error } = await supabase
      .from('businesses')
      .update({ pipeline_stage: newStage })
      .eq('id', businessId)

    if (error) {
      console.error('Error updating stage:', error)
      return
    }

    await supabase.from('stage_history').insert({
      business_id: businessId,
      from_stage: oldStage,
      to_stage: newStage,
    })

    setBusinesses((prev) =>
      prev.map((b) =>
        b.id === businessId ? { ...b, pipeline_stage: newStage as any } : b
      )
    )
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = stages.findIndex((s) => s.id === active.id)
    const newIndex = stages.findIndex((s) => s.id === over.id)

    const newStages = arrayMove(stages, oldIndex, newIndex).map((s, i) => ({
      ...s,
      order: i,
    }))

    setStages(newStages)

    // Save to database if we have a pipeline
    if (activePipeline) {
      for (const stage of newStages) {
        await supabase
          .from('pipeline_stages')
          .upsert({
            id: stage.id,
            pipeline_id: activePipeline.id,
            name: stage.name,
            color: stage.color,
            order: stage.order,
          })
      }
      toast.success('Stage order saved')
    }
  }

  function handleEditStage(stage: CustomStage) {
    setEditingStage(stage)
    setShowEditStage(true)
  }

  async function handleSaveStage(updates: { name: string; color: string }) {
    if (!editingStage) return

    const updatedStages = stages.map((s) =>
      s.id === editingStage.id ? { ...s, ...updates } : s
    )
    setStages(updatedStages)

    if (activePipeline) {
      await supabase
        .from('pipeline_stages')
        .upsert({
          id: editingStage.id,
          pipeline_id: activePipeline.id,
          name: updates.name,
          color: updates.color,
          order: editingStage.order,
        })
    }

    setShowEditStage(false)
    setEditingStage(null)
    toast.success('Stage updated')
  }

  async function handleDeleteStage() {
    if (!editingStage || stages.length <= 1) {
      toast.error('Cannot delete the last stage')
      return
    }

    // Move businesses from this stage to the first remaining stage
    const remainingStages = stages.filter((s) => s.id !== editingStage.id)
    const targetStage = remainingStages[0]

    await supabase
      .from('businesses')
      .update({ pipeline_stage: targetStage.id })
      .eq('pipeline_stage', editingStage.id)

    if (activePipeline) {
      await supabase
        .from('pipeline_stages')
        .delete()
        .eq('id', editingStage.id)
    }

    setStages(remainingStages)
    setShowEditStage(false)
    setEditingStage(null)
    toast.success('Stage deleted')
    loadData()
  }

  async function handleCreatePipeline(name: string, description: string) {
    const { data: newPipeline, error } = await supabase
      .from('pipelines')
      .insert({
        name,
        description,
        is_default: pipelines.length === 0,
      })
      .select()
      .single()

    if (error) {
      toast.error('Failed to create pipeline')
      return
    }

    // Create default stages for the new pipeline
    const defaultStages = PIPELINE_STAGES.map((s, i) => ({
      pipeline_id: newPipeline.id,
      name: s.name,
      color: s.color,
      order: i,
    }))

    await supabase.from('pipeline_stages').insert(defaultStages)

    setPipelines([...pipelines, newPipeline])
    setActivePipeline(newPipeline)
    setShowCreatePipeline(false)
    toast.success('Pipeline created')
    loadData()
  }

  // Group businesses by stage
  const businessesByStage = stages.reduce((acc, stage) => {
    acc[stage.id] = businesses.filter((b) => b.pipeline_stage === stage.id)
    return acc
  }, {} as Record<string, Business[]>)

  // Calculate quick stats
  const totalValue = businesses.reduce((sum, b) => sum + b.total_project_value, 0)
  const activeDeals = businesses.filter(b => b.pipeline_stage !== 'lead_scraped').length

  const stageColors: Record<string, { bg: string; border: string; dot: string; gradient: string }> = {
    gray: { bg: 'bg-slate-50', border: 'border-slate-200', dot: 'bg-slate-400', gradient: 'from-slate-500 to-slate-600' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500', gradient: 'from-blue-500 to-blue-600' },
    yellow: { bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500', gradient: 'from-amber-500 to-amber-600' },
    green: { bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', gradient: 'from-emerald-500 to-emerald-600' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', dot: 'bg-purple-500', gradient: 'from-purple-500 to-purple-600' },
    red: { bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500', gradient: 'from-red-500 to-red-600' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', dot: 'bg-indigo-500', gradient: 'from-indigo-500 to-indigo-600' },
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-500 text-white">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="h-8 w-48 bg-white/20 rounded-lg animate-pulse mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="h-4 w-24 bg-white/20 rounded animate-pulse mb-2"></div>
                  <div className="h-6 w-32 bg-white/20 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex space-x-4 overflow-x-auto pb-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-80 flex-shrink-0 bg-white rounded-xl border border-slate-200 p-4">
                <div className="h-6 w-32 bg-slate-200 rounded animate-pulse mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="h-32 bg-slate-100 rounded-lg animate-pulse"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header with Gradient */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-500 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                <Layers className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Sales Pipeline</h1>
                <p className="text-emerald-100 text-sm mt-1">
                  {activePipeline ? activePipeline.name : 'Track and manage your deals'}
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowCreatePipeline(true)}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Pipeline
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-emerald-100 text-xs font-medium">Total Businesses</p>
                  <p className="text-2xl font-bold">{businesses.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-emerald-100 text-xs font-medium">Active Deals</p>
                  <p className="text-2xl font-bold">{activeDeals}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-emerald-100 text-xs font-medium">Pipeline Value</p>
                  <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Kanban with Drag & Drop */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="overflow-x-auto pb-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={stages.map((s) => s.id)}
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex space-x-4" style={{ minWidth: 'max-content' }}>
                {stages.map((stage) => {
                  const stageBusinesses = businessesByStage[stage.id] || []
                  const stageValue = stageBusinesses.reduce((sum, b) => sum + b.total_project_value, 0)
                  const colors = stageColors[stage.color] || stageColors.gray

                  return (
                    <SortableStageColumn
                      key={stage.id}
                      stage={stage}
                      businesses={stageBusinesses}
                      stageValue={stageValue}
                      colors={colors}
                      onBusinessStageChange={handleStageChange}
                      onEditStage={handleEditStage}
                      allStages={stages}
                    />
                  )
                })}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {/* Create Pipeline Modal */}
      <CreatePipelineModal
        isOpen={showCreatePipeline}
        onClose={() => setShowCreatePipeline(false)}
        onSave={handleCreatePipeline}
      />

      {/* Edit Stage Modal */}
      <EditStageModal
        isOpen={showEditStage}
        onClose={() => {
          setShowEditStage(false)
          setEditingStage(null)
        }}
        stage={editingStage}
        onSave={handleSaveStage}
        onDelete={handleDeleteStage}
      />
    </div>
  )
}

// Create Pipeline Modal
function CreatePipelineModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string, description: string) => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setIsSaving(true)
    await onSave(name, description)
    setIsSaving(false)
    setName('')
    setDescription('')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Pipeline">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Pipeline Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Sales Pipeline"
          required
        />
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Describe this pipeline..."
          />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving || !name.trim()}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create Pipeline
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// Edit Stage Modal
function EditStageModal({
  isOpen,
  onClose,
  stage,
  onSave,
  onDelete,
}: {
  isOpen: boolean
  onClose: () => void
  stage: CustomStage | null
  onSave: (updates: { name: string; color: string }) => void
  onDelete: () => void
}) {
  const [name, setName] = useState(stage?.name || '')
  const [color, setColor] = useState(stage?.color || 'gray')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (stage) {
      setName(stage.name)
      setColor(stage.color)
    }
  }, [stage])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setIsSaving(true)
    await onSave({ name, color })
    setIsSaving(false)
  }

  const colorOptions = [
    { id: 'gray', label: 'Gray', bg: 'bg-slate-500' },
    { id: 'blue', label: 'Blue', bg: 'bg-blue-500' },
    { id: 'yellow', label: 'Yellow', bg: 'bg-amber-500' },
    { id: 'green', label: 'Green', bg: 'bg-emerald-500' },
    { id: 'purple', label: 'Purple', bg: 'bg-purple-500' },
    { id: 'red', label: 'Red', bg: 'bg-red-500' },
    { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-500' },
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Stage">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Stage Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Contacted"
          required
        />
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Stage Color</label>
          <div className="grid grid-cols-7 gap-2">
            {colorOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setColor(opt.id)}
                className={`w-10 h-10 rounded-lg ${opt.bg} flex items-center justify-center transition-all ${
                  color === opt.id ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105'
                }`}
              >
                {color === opt.id && <Check className="w-5 h-5 text-white" />}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-between pt-4 border-t border-gray-200">
          <Button variant="danger" onClick={onDelete} type="button">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Stage
          </Button>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || !name.trim()}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
