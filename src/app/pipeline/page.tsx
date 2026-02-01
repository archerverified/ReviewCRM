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
  DollarSign,
  Building2,
  MapPin,
  Star,
  GripVertical,
  Plus,
  ChevronDown,
  Settings,
  Check,
  Loader2,
  Trash2,
  MoreHorizontal,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatCard, Badge, Avatar, ViewToggle } from '@/components/ui'
import { HoverCard } from '@/components/ui/HoverCard'
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

// Get stage color classes
function getStageColors(color: string) {
  const colorMap: Record<string, { dot: string; bg: string }> = {
    gray: { dot: 'bg-status-gray-dot', bg: 'bg-clay-50' },
    blue: { dot: 'bg-status-blue-dot', bg: 'bg-blue-50' },
    yellow: { dot: 'bg-status-yellow-dot', bg: 'bg-amber-50' },
    green: { dot: 'bg-status-green-dot', bg: 'bg-green-50' },
    purple: { dot: 'bg-status-purple-dot', bg: 'bg-purple-50' },
    red: { dot: 'bg-status-red-dot', bg: 'bg-red-50' },
    indigo: { dot: 'bg-indigo-500', bg: 'bg-indigo-50' },
  }
  return colorMap[color] || colorMap.gray
}

// Sortable Stage Column Component
function SortableStageColumn({
  stage,
  businesses,
  stageValue,
  onBusinessStageChange,
  onEditStage,
  allStages,
}: {
  stage: CustomStage
  businesses: Business[]
  stageValue: number
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

  const colors = getStageColors(stage.color)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`w-72 flex-shrink-0 rounded-lg overflow-hidden ${colors.bg}`}
    >
      {/* Column Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-clay-200">
        <div className="flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className="p-1 hover:bg-clay-200 rounded cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-4 h-4 text-clay-400" />
          </button>
          <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
          <span className="text-sm font-semibold text-clay-800">{stage.name}</span>
          <span className="bg-clay-200 px-2 py-0.5 rounded-full text-[11px] text-clay-600">
            {businesses.length}
          </span>
        </div>
        <button
          onClick={() => onEditStage(stage)}
          className="p-1 hover:bg-clay-200 rounded transition-colors text-clay-400 hover:text-clay-600"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Business Cards */}
      <div className="p-3 space-y-3 min-h-[300px] max-h-[calc(100vh-350px)] overflow-y-auto">
        {businesses.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-8 h-8 text-clay-300 mx-auto mb-2" />
            <p className="text-clay-500 text-sm">No businesses</p>
          </div>
        ) : (
          businesses.map((business) => {
            const rating = business.google_rating || 0
            const reviewCount = business.total_media_reviews || 0

            return (
              <HoverCard
                key={business.id}
                className="bg-white border border-clay-200 rounded-lg p-4 cursor-grab hover:shadow-clay-md transition-shadow"
              >
                <div className="flex items-start gap-3 mb-3">
                  <Avatar name={business.business_name} size="md" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-clay-800 truncate">
                      {business.business_name}
                    </h4>
                    <div className="flex items-center gap-1 text-xs text-clay-500 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{business.city || 'Unknown'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between py-3 border-t border-b border-clay-100 mb-3">
                  <div>
                    <div className="text-[11px] text-clay-500">Rating</div>
                    <div className="text-sm font-semibold text-clay-800 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {rating > 0 ? rating.toFixed(1) : '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-clay-500">Reviews</div>
                    <div className="text-sm font-semibold text-clay-800">{reviewCount}</div>
                  </div>
                </div>

                <select
                  value={business.pipeline_stage}
                  onChange={(e) =>
                    onBusinessStageChange(
                      business.id,
                      e.target.value as PipelineStage,
                      business.pipeline_stage
                    )
                  }
                  className="w-full text-xs border border-clay-300 rounded-md px-3 py-1.5 bg-white text-clay-700 focus:outline-none focus:ring-2 focus:ring-clay-300 cursor-pointer"
                >
                  {allStages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </HoverCard>
            )
          })
        )}
        <button className="w-full py-2.5 border border-dashed border-clay-300 rounded-lg text-clay-500 text-[13px] hover:border-clay-400 hover:bg-white transition-colors">
          + Add Business
        </button>
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
  const [view, setView] = useState<'List' | 'Board'>('Board')

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

    const { data: businessData } = await supabase
      .from('businesses')
      .select('*')
      .order('updated_at', { ascending: false })

    if (businessData) setBusinesses(businessData as Business[])

    const { data: pipelineData } = await supabase
      .from('pipelines')
      .select('*')
      .order('created_at', { ascending: true })

    if (pipelineData && pipelineData.length > 0) {
      setPipelines(pipelineData)
      const defaultPipeline = pipelineData.find(p => p.is_default) || pipelineData[0]
      setActivePipeline(defaultPipeline)

      const { data: stageData } = await supabase
        .from('pipeline_stages')
        .select('*')
        .eq('pipeline_id', defaultPipeline.id)
        .order('order', { ascending: true })

      if (stageData && stageData.length > 0) {
        setStages(stageData)
      } else {
        setStages(PIPELINE_STAGES.map((s, i) => ({
          id: s.id,
          name: s.name,
          color: s.color,
          order: i,
          pipeline_id: defaultPipeline.id,
        })))
      }
    } else {
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
    toast.success('Stage updated')
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

  // Calculate stats
  const totalValue = businesses.reduce((sum, b) => sum + b.total_project_value, 0)
  const activeDeals = businesses.filter(b => b.pipeline_stage !== 'lead_scraped' && b.pipeline_stage !== 'do_not_contact').length

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 bg-clay-200 rounded animate-pulse" />
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 h-24 bg-clay-100 border border-clay-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-72 flex-shrink-0 bg-clay-100 border border-clay-200 rounded-lg h-96 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <h1 className="text-2xl font-bold text-clay-900">Pipeline</h1>

      {/* Stats Row */}
      <div className="flex gap-4 flex-wrap">
        <StatCard label="Total Businesses" value={businesses.length.toString()} icon="🏢" />
        <StatCard label="Active Deals" value={activeDeals.toString()} icon="🔥" />
        <StatCard label="Pipeline Value" value={`$${totalValue.toLocaleString()}`} icon="💰" />
      </div>

      {/* View Toggle and Actions */}
      <div className="flex items-center justify-between">
        <ViewToggle
          views={['List', 'Board']}
          active={view}
          onChange={(v) => setView(v as 'List' | 'Board')}
        />
        <Button variant="primary" onClick={() => setShowCreatePipeline(true)}>
          <Plus className="w-4 h-4 mr-1" />
          New Pipeline
        </Button>
      </div>

      {/* Pipeline Kanban Board */}
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
            <div className="flex gap-5" style={{ minWidth: 'max-content' }}>
              {stages.map((stage) => {
                const stageBusinesses = businessesByStage[stage.id] || []
                const stageValue = stageBusinesses.reduce((sum, b) => sum + b.total_project_value, 0)

                return (
                  <SortableStageColumn
                    key={stage.id}
                    stage={stage}
                    businesses={stageBusinesses}
                    stageValue={stageValue}
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
          <label className="block text-sm font-medium text-clay-700 mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-clay-300 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-clay-400 focus:border-transparent text-sm"
            placeholder="Describe this pipeline..."
          />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-clay-200">
          <Button variant="secondary" onClick={onClose} type="button">
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
    { id: 'gray', bg: 'bg-clay-500' },
    { id: 'blue', bg: 'bg-status-blue-dot' },
    { id: 'yellow', bg: 'bg-status-yellow-dot' },
    { id: 'green', bg: 'bg-status-green-dot' },
    { id: 'purple', bg: 'bg-status-purple-dot' },
    { id: 'red', bg: 'bg-status-red-dot' },
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
          <label className="block text-sm font-medium text-clay-700 mb-2">Stage Color</label>
          <div className="flex gap-2">
            {colorOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setColor(opt.id)}
                className={`w-8 h-8 rounded-lg ${opt.bg} flex items-center justify-center transition-all ${
                  color === opt.id ? 'ring-2 ring-offset-2 ring-clay-500 scale-110' : 'hover:scale-105'
                }`}
              >
                {color === opt.id && <Check className="w-4 h-4 text-white" />}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-between pt-4 border-t border-clay-200">
          <button
            type="button"
            onClick={onDelete}
            className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" />
            Delete Stage
          </button>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose} type="button">
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
