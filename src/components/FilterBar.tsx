'use client'

import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { FilterState, Tag, PIPELINE_STAGES, EMAIL_VERIFICATION_STATUSES, EMAIL_OUTREACH_STATUSES, PipelineStage, EmailVerificationStatus, EmailOutreachStatus } from '@/types'
import { Input } from './ui/Input'
import { Button } from './ui/Button'
import { cn } from '@/lib/utils'

interface FilterBarProps {
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
  tags: Tag[]
}

export function FilterBar({ filters, onFilterChange, tags }: FilterBarProps) {
  const handleSearchChange = (value: string) => {
    onFilterChange({ ...filters, search: value })
  }

  const handleStageToggle = (stageId: PipelineStage) => {
    const newStages = filters.stages.includes(stageId)
      ? filters.stages.filter(s => s !== stageId)
      : [...filters.stages, stageId]
    onFilterChange({ ...filters, stages: newStages })
  }

  const handleEmailVerificationToggle = (status: EmailVerificationStatus) => {
    const newStatuses = filters.emailVerificationStatuses.includes(status)
      ? filters.emailVerificationStatuses.filter(s => s !== status)
      : [...filters.emailVerificationStatuses, status]
    onFilterChange({ ...filters, emailVerificationStatuses: newStatuses })
  }

  const handleEmailOutreachToggle = (status: EmailOutreachStatus) => {
    const newStatuses = filters.emailOutreachStatuses.includes(status)
      ? filters.emailOutreachStatuses.filter(s => s !== status)
      : [...filters.emailOutreachStatuses, status]
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
      <Menu as="div" className="relative">
        <Menu.Button className="clay-btn-secondary">
          Stage
          {filters.stages.length > 0 && (
            <span className="ml-1.5 bg-accent-blue text-white text-xs px-1.5 py-0.5 rounded-full">
              {filters.stages.length}
            </span>
          )}
          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Menu.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <Menu.Items className="absolute top-full left-0 mt-1 bg-white border border-clay-200 rounded-lg shadow-lg py-2 z-10 min-w-[200px] max-h-[300px] overflow-y-auto focus:outline-none">
            {PIPELINE_STAGES.map(stage => (
              <Menu.Item key={stage.id}>
                {({ active }) => (
                  <label className={cn(
                    'flex items-center px-3 py-1.5 cursor-pointer',
                    active && 'bg-clay-50'
                  )}>
                    <input
                      type="checkbox"
                      checked={filters.stages.includes(stage.id)}
                      onChange={() => handleStageToggle(stage.id)}
                      className="w-4 h-4 rounded border-clay-300 text-accent-blue focus:ring-accent-blue"
                    />
                    <span className="ml-2 text-sm text-clay-700">{stage.name}</span>
                  </label>
                )}
              </Menu.Item>
            ))}
          </Menu.Items>
        </Transition>
      </Menu>

      {/* Email Verification Filter */}
      <Menu as="div" className="relative">
        <Menu.Button className="clay-btn-secondary">
          Verification
          {filters.emailVerificationStatuses.length > 0 && (
            <span className="ml-1.5 bg-accent-blue text-white text-xs px-1.5 py-0.5 rounded-full">
              {filters.emailVerificationStatuses.length}
            </span>
          )}
          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Menu.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <Menu.Items className="absolute top-full left-0 mt-1 bg-white border border-clay-200 rounded-lg shadow-lg py-2 z-10 min-w-[150px] focus:outline-none">
            {EMAIL_VERIFICATION_STATUSES.map(status => (
              <Menu.Item key={status}>
                {({ active }) => (
                  <label className={cn(
                    'flex items-center px-3 py-1.5 cursor-pointer',
                    active && 'bg-clay-50'
                  )}>
                    <input
                      type="checkbox"
                      checked={filters.emailVerificationStatuses.includes(status)}
                      onChange={() => handleEmailVerificationToggle(status)}
                      className="w-4 h-4 rounded border-clay-300 text-accent-blue focus:ring-accent-blue"
                    />
                    <span className="ml-2 text-sm text-clay-700 capitalize">{status}</span>
                  </label>
                )}
              </Menu.Item>
            ))}
          </Menu.Items>
        </Transition>
      </Menu>

      {/* Email Outreach Filter */}
      <Menu as="div" className="relative">
        <Menu.Button className="clay-btn-secondary">
          Outreach
          {filters.emailOutreachStatuses.length > 0 && (
            <span className="ml-1.5 bg-accent-blue text-white text-xs px-1.5 py-0.5 rounded-full">
              {filters.emailOutreachStatuses.length}
            </span>
          )}
          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Menu.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <Menu.Items className="absolute top-full left-0 mt-1 bg-white border border-clay-200 rounded-lg shadow-lg py-2 z-10 min-w-[150px] focus:outline-none">
            {EMAIL_OUTREACH_STATUSES.map(status => (
              <Menu.Item key={status}>
                {({ active }) => (
                  <label className={cn(
                    'flex items-center px-3 py-1.5 cursor-pointer',
                    active && 'bg-clay-50'
                  )}>
                    <input
                      type="checkbox"
                      checked={filters.emailOutreachStatuses.includes(status)}
                      onChange={() => handleEmailOutreachToggle(status)}
                      className="w-4 h-4 rounded border-clay-300 text-accent-blue focus:ring-accent-blue"
                    />
                    <span className="ml-2 text-sm text-clay-700 capitalize">{status.replace('_', ' ')}</span>
                  </label>
                )}
              </Menu.Item>
            ))}
          </Menu.Items>
        </Transition>
      </Menu>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={handleClearFilters}>
          Clear filters
        </Button>
      )}
    </div>
  )
}
