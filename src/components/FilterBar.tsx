'use client'

import { FilterState, Tag, PIPELINE_STAGES, EMAIL_VERIFICATION_STATUSES, EMAIL_OUTREACH_STATUSES } from '@/types'
import { Input } from './ui/Input'
import { Button } from './ui/Button'

interface FilterBarProps {
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
  tags: Tag[]
}

export function FilterBar({ filters, onFilterChange, tags }: FilterBarProps) {
  const handleSearchChange = (value: string) => {
    onFilterChange({ ...filters, search: value })
  }

  const handleStageToggle = (stageId: string) => {
    const newStages = filters.stages.includes(stageId as any)
      ? filters.stages.filter(s => s !== stageId)
      : [...filters.stages, stageId as any]
    onFilterChange({ ...filters, stages: newStages })
  }

  const handleEmailVerificationToggle = (status: string) => {
    const newStatuses = filters.emailVerificationStatuses.includes(status as any)
      ? filters.emailVerificationStatuses.filter(s => s !== status)
      : [...filters.emailVerificationStatuses, status as any]
    onFilterChange({ ...filters, emailVerificationStatuses: newStatuses })
  }

  const handleEmailOutreachToggle = (status: string) => {
    const newStatuses = filters.emailOutreachStatuses.includes(status as any)
      ? filters.emailOutreachStatuses.filter(s => s !== status)
      : [...filters.emailOutreachStatuses, status as any]
    onFilterChange({ ...filters, emailOutreachStatuses: newStatuses })
  }

  const handleClearFilters = () => {
    onFilterChange({
      search: '',
      tags: [],
      stages: [],
      emailVerificationStatuses: [],
      emailOutreachStatuses: [],
      pricingTiers: [],
      cities: [],
      campaigns: [],
    })
  }

  const hasActiveFilters =
    filters.search ||
    filters.tags.length > 0 ||
    filters.stages.length > 0 ||
    filters.emailVerificationStatuses.length > 0 ||
    filters.emailOutreachStatuses.length > 0

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      {/* Search Input */}
      <div className="flex-1 min-w-[200px] max-w-md">
        <Input
          placeholder="Search businesses..."
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          icon={
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          }
        />
      </div>

      {/* Stage Filter */}
      <div className="relative group">
        <button className="clay-btn-secondary">
          Stage
          {filters.stages.length > 0 && (
            <span className="ml-1.5 bg-accent-blue text-white text-xs px-1.5 py-0.5 rounded-full">
              {filters.stages.length}
            </span>
          )}
          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div className="absolute top-full left-0 mt-1 bg-white border border-clay-200 rounded-lg shadow-lg py-2 z-10 hidden group-hover:block min-w-[200px] max-h-[300px] overflow-y-auto">
          {PIPELINE_STAGES.map(stage => (
            <label
              key={stage.id}
              className="flex items-center px-3 py-1.5 hover:bg-clay-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={filters.stages.includes(stage.id)}
                onChange={() => handleStageToggle(stage.id)}
                className="w-4 h-4 rounded border-clay-300 text-accent-blue focus:ring-accent-blue"
              />
              <span className="ml-2 text-sm text-clay-700">{stage.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Email Verification Filter */}
      <div className="relative group">
        <button className="clay-btn-secondary">
          Verification
          {filters.emailVerificationStatuses.length > 0 && (
            <span className="ml-1.5 bg-accent-blue text-white text-xs px-1.5 py-0.5 rounded-full">
              {filters.emailVerificationStatuses.length}
            </span>
          )}
          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div className="absolute top-full left-0 mt-1 bg-white border border-clay-200 rounded-lg shadow-lg py-2 z-10 hidden group-hover:block min-w-[150px]">
          {EMAIL_VERIFICATION_STATUSES.map(status => (
            <label
              key={status}
              className="flex items-center px-3 py-1.5 hover:bg-clay-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={filters.emailVerificationStatuses.includes(status)}
                onChange={() => handleEmailVerificationToggle(status)}
                className="w-4 h-4 rounded border-clay-300 text-accent-blue focus:ring-accent-blue"
              />
              <span className="ml-2 text-sm text-clay-700 capitalize">{status}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Email Outreach Filter */}
      <div className="relative group">
        <button className="clay-btn-secondary">
          Outreach
          {filters.emailOutreachStatuses.length > 0 && (
            <span className="ml-1.5 bg-accent-blue text-white text-xs px-1.5 py-0.5 rounded-full">
              {filters.emailOutreachStatuses.length}
            </span>
          )}
          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div className="absolute top-full left-0 mt-1 bg-white border border-clay-200 rounded-lg shadow-lg py-2 z-10 hidden group-hover:block min-w-[150px]">
          {EMAIL_OUTREACH_STATUSES.map(status => (
            <label
              key={status}
              className="flex items-center px-3 py-1.5 hover:bg-clay-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={filters.emailOutreachStatuses.includes(status)}
                onChange={() => handleEmailOutreachToggle(status)}
                className="w-4 h-4 rounded border-clay-300 text-accent-blue focus:ring-accent-blue"
              />
              <span className="ml-2 text-sm text-clay-700 capitalize">{status.replace('_', ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={handleClearFilters}>
          Clear filters
        </Button>
      )}
    </div>
  )
}
