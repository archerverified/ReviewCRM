'use client'

import { useState, useRef, useEffect, ChangeEvent, useCallback } from 'react'
import Papa from 'papaparse'
import { supabase, tagQueries } from '@/lib/supabase'
import { D7FieldMapping, Tag } from '@/types'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Select } from './ui/Select'
import { toast } from 'sonner'

// Predefined tag colors
const TAG_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

interface ImportModalProps {
  onClose: () => void
  onImportComplete: (count: number) => void
}

// Default D7 Lead Finder field mappings (matching exact CSV column names)
const DEFAULT_MAPPINGS: D7FieldMapping = {
  business_name: 'BusinessName',
  contact_name: 'PersonName',
  email: 'Email',
  website_url: 'WebsiteURL',
  gmaps_url: 'Gmaps_URL',
  city: '',
  state: '',
  google_rating: 'Rating',
  total_reviews: 'Reviews',
  one_star_reviews: '1 Star Reviews',
  two_star_reviews: '2 Star Reviews',
  three_star_reviews: '3 Star Reviews',
  four_star_reviews: '4 Star Reviews',
  five_star_reviews: '5 Star Reviews',
  one_star_media_reviews: '1 Star Reviews w/ Media',
  two_star_media_reviews: '2 Star Reviews w/ Media',
}

// Common column name variations for auto-detection
const COLUMN_VARIATIONS: Record<keyof D7FieldMapping, string[]> = {
  business_name: ['BusinessName', 'Business Name', 'Name', 'Company', 'Company Name', 'Business'],
  contact_name: ['PersonName', 'Person Name', 'Contact', 'Contact Name', 'Owner'],
  email: ['Email', 'Contact Email', 'Email Address', 'E-mail'],
  website_url: ['WebsiteURL', 'Website URL', 'Website', 'URL', 'Web', 'Site'],
  gmaps_url: ['Gmaps_URL', 'Google Maps URL', 'GMaps', 'Maps URL', 'Google Maps'],
  city: ['City', 'Town', 'Location'],
  state: ['State', 'Province', 'Region'],
  google_rating: ['Rating', 'Google Rating', 'Stars', 'Star Rating'],
  total_reviews: ['Reviews', 'Total Reviews', 'Review Count', 'Number of Reviews'],
  one_star_reviews: ['1 Star Reviews', '1-Star Reviews', '1 Star', 'One Star Reviews'],
  two_star_reviews: ['2 Star Reviews', '2-Star Reviews', '2 Star', 'Two Star Reviews'],
  three_star_reviews: ['3 Star Reviews', '3-Star Reviews', '3 Star', 'Three Star Reviews'],
  four_star_reviews: ['4 Star Reviews', '4-Star Reviews', '4 Star', 'Four Star Reviews'],
  five_star_reviews: ['5 Star Reviews', '5-Star Reviews', '5 Star', 'Five Star Reviews'],
  one_star_media_reviews: ['1 Star Reviews w/ Media', '1-Star Media Reviews', '1 Star Media', '1-Star Photos', 'One Star Media'],
  two_star_media_reviews: ['2 Star Reviews w/ Media', '2-Star Media Reviews', '2 Star Media', '2-Star Photos', 'Two Star Media'],
}

export function ImportModal({ onClose, onImportComplete }: ImportModalProps) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'tagging' | 'importing' | 'complete'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<any[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [mappings, setMappings] = useState<D7FieldMapping>(DEFAULT_MAPPINGS)
  const [customFields, setCustomFields] = useState<string[]>([])
  const [progress, setProgress] = useState(0)
  const [importedCount, setImportedCount] = useState(0)
  const [errors, setErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Tagging state
  const [existingTags, setExistingTags] = useState<Tag[]>([])
  const [selectedTagId, setSelectedTagId] = useState<string>('')
  const [isCreatingNewTag, setIsCreatingNewTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0])

  // Load existing tags when component mounts
  useEffect(() => {
    loadExistingTags()
  }, [])

  async function loadExistingTags() {
    try {
      const tags = await tagQueries.getAll()
      setExistingTags(tags)
    } catch (error) {
      console.error('Failed to load tags:', error)
    }
  }

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      preview: 100, // Preview first 100 rows for performance
      complete: (results) => {
        const data = results.data as any[]
        const fileHeaders = Object.keys(data[0] || {})

        setCsvData(data)
        setHeaders(fileHeaders)

        // Auto-detect field mappings
        const detectedMappings = { ...DEFAULT_MAPPINGS }
        for (const [field, variations] of Object.entries(COLUMN_VARIATIONS)) {
          for (const variation of variations) {
            const match = fileHeaders.find(
              h => h.toLowerCase().trim() === variation.toLowerCase()
            )
            if (match) {
              detectedMappings[field as keyof D7FieldMapping] = match
              break
            }
          }
        }
        setMappings(detectedMappings)
        setStep('mapping')
      },
      error: (error) => {
        toast.error(`CSV parse error: ${error.message}`)
      },
    })
  }, [])

  const handleMappingChange = useCallback((field: keyof D7FieldMapping, value: string) => {
    setMappings(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleAddCustomField = useCallback((field: keyof D7FieldMapping, fieldName: string) => {
    // Add to custom fields list
    setCustomFields(prev => [...prev, fieldName])

    // Update mapping to use the custom field
    setMappings(prev => ({ ...prev, [field]: fieldName }))

    // Show success toast
    toast.success(`Custom field '${fieldName}' added`)
  }, [])

  const handleImport = useCallback(async () => {
    if (!file) return

    setStep('importing')
    setProgress(0)
    setErrors([])

    // Parse the full file
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data as any[]
        const totalRows = data.length
        let imported = 0
        const importErrors: string[] = []
        const importedBusinessIds: string[] = []

        // Process in batches of 100
        const batchSize = 100
        for (let i = 0; i < totalRows; i += batchSize) {
          const batch = data.slice(i, i + batchSize)

          const businessRecords = batch
            .filter(row => row[mappings.business_name]?.trim()) // Skip rows without business name
            .map(row => {
              // Build record dynamically, only including fields that have mappings and values
              const record: any = {
                // Required field - always included
                business_name: row[mappings.business_name]?.trim() || '',
                // Required status fields
                email_verification_status: 'unverified' as const,
                email_outreach_status: 'not_sent' as const,
                pipeline_stage: 'lead_scraped' as const,
              }

              // Optional string fields - only include if mapped and has value
              if (mappings.contact_name && row[mappings.contact_name]?.trim()) {
                record.contact_name = row[mappings.contact_name].trim()
              }
              if (mappings.email && row[mappings.email]?.trim()) {
                record.email = row[mappings.email].trim()
              }
              if (mappings.website_url && row[mappings.website_url]?.trim()) {
                record.website_url = row[mappings.website_url].trim()
              }
              if (mappings.gmaps_url && row[mappings.gmaps_url]?.trim()) {
                record.gmaps_url = row[mappings.gmaps_url].trim()
              }
              if (mappings.city && row[mappings.city]?.trim()) {
                record.city = row[mappings.city].trim()
              }
              if (mappings.state && row[mappings.state]?.trim()) {
                record.state = row[mappings.state].trim()
              }

              // Optional numeric fields - only include if mapped and has valid value
              if (mappings.google_rating && row[mappings.google_rating]) {
                const rating = parseFloat(row[mappings.google_rating])
                if (!isNaN(rating)) record.google_rating = rating
              }
              if (mappings.total_reviews && row[mappings.total_reviews]) {
                const reviews = parseInt(row[mappings.total_reviews])
                if (!isNaN(reviews)) record.total_reviews = reviews
              }
              if (mappings.one_star_reviews && row[mappings.one_star_reviews]) {
                const reviews = parseInt(row[mappings.one_star_reviews])
                if (!isNaN(reviews)) record.one_star_reviews = reviews
              }
              if (mappings.two_star_reviews && row[mappings.two_star_reviews]) {
                const reviews = parseInt(row[mappings.two_star_reviews])
                if (!isNaN(reviews)) record.two_star_reviews = reviews
              }
              if (mappings.three_star_reviews && row[mappings.three_star_reviews]) {
                const reviews = parseInt(row[mappings.three_star_reviews])
                if (!isNaN(reviews)) record.three_star_reviews = reviews
              }
              if (mappings.four_star_reviews && row[mappings.four_star_reviews]) {
                const reviews = parseInt(row[mappings.four_star_reviews])
                if (!isNaN(reviews)) record.four_star_reviews = reviews
              }
              if (mappings.five_star_reviews && row[mappings.five_star_reviews]) {
                const reviews = parseInt(row[mappings.five_star_reviews])
                if (!isNaN(reviews)) record.five_star_reviews = reviews
              }
              if (mappings.one_star_media_reviews && row[mappings.one_star_media_reviews]) {
                const reviews = parseInt(row[mappings.one_star_media_reviews])
                if (!isNaN(reviews)) record.one_star_media_reviews = reviews
              }
              if (mappings.two_star_media_reviews && row[mappings.two_star_media_reviews]) {
                const reviews = parseInt(row[mappings.two_star_media_reviews])
                if (!isNaN(reviews)) record.two_star_media_reviews = reviews
              }

              // GENERATED columns (total_media_reviews, projected_rating, pricing_tier, price_per_review, total_project_value)
              // are computed automatically by PostgreSQL

              return record
            })

          if (businessRecords.length > 0) {
            const { data: insertedData, error } = await supabase
              .from('businesses')
              .insert(businessRecords)
              .select('id')

            if (error) {
              importErrors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`)
            } else {
              imported += businessRecords.length
              // Collect imported business IDs for tag assignment
              if (insertedData) {
                importedBusinessIds.push(...insertedData.map((b: { id: string }) => b.id))
              }
            }
          }

          setProgress(Math.round(((i + batchSize) / totalRows) * 100))
        }

        // Assign tag to imported businesses
        if (importedBusinessIds.length > 0) {
          try {
            let tagId = selectedTagId

            // Create new tag if needed
            if (isCreatingNewTag && newTagName.trim()) {
              const newTag = await tagQueries.create({
                name: newTagName.trim(),
                color: newTagColor,
              })
              tagId = newTag.id
              toast.success(`Created tag "${newTagName}"`)
            }

            // Assign tag to all imported businesses
            if (tagId) {
              await tagQueries.assignToBusinesses(tagId, importedBusinessIds)
            }
          } catch (tagError) {
            const errorMessage = tagError instanceof Error ? tagError.message : 'Unknown error'
            importErrors.push(`Tag assignment: ${errorMessage}`)
          }
        }

        setImportedCount(imported)
        setErrors(importErrors)
        setStep('complete')

        if (importErrors.length === 0) {
          toast.success(`Imported ${imported} businesses successfully`)
        } else {
          toast.error(`Import completed with ${importErrors.length} errors`)
        }
      },
      error: (error) => {
        toast.error(`CSV parse error: ${error.message}`)
        setStep('complete')
      },
    })
  }, [file, mappings, selectedTagId, isCreatingNewTag, newTagName, newTagColor])

  const resetModal = useCallback(() => {
    setFile(null)
    setCsvData([])
    setHeaders([])
    setCustomFields([])
    setStep('upload')
    // Reset tagging state
    setSelectedTagId('')
    setIsCreatingNewTag(false)
    setNewTagName('')
    setNewTagColor(TAG_COLORS[0])
    if (fileInputRef.current) fileInputRef.current.value = ''
    onClose()
  }, [onClose])

  // Combine CSV headers with custom fields for dropdown options
  const allColumns = [...headers, ...customFields]
  const columnOptions = allColumns.map(h => ({ value: h, label: h }))

  return (
    <Modal
      isOpen={true}
      onClose={resetModal}
      title="Import D7 Lead Finder CSV"
      size="lg"
      footer={
        step === 'mapping' ? (
          <>
            <Button variant="secondary" onClick={resetModal}>
              Cancel
            </Button>
            <Button
              onClick={() => setStep('tagging')}
              disabled={!file}
            >
              Next: Assign Tag
            </Button>
          </>
        ) : step === 'tagging' ? (
          <>
            <Button variant="secondary" onClick={() => setStep('mapping')}>
              Back
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || (isCreatingNewTag && !newTagName.trim())}
            >
              Import {csvData.length > 0 && `(${csvData.length}+ rows)`}
            </Button>
          </>
        ) : step === 'complete' ? (
          <Button
            onClick={() => onImportComplete(importedCount)}
          >
            Done
          </Button>
        ) : null
      }
    >
      <div className="space-y-6">
        {step === 'upload' && (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-clay-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-clay-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-clay-900 mb-2">Upload D7 Lead Finder CSV</h3>
            <p className="text-sm text-clay-500 mb-2">
              Expected columns: BusinessName, PersonName, Email, WebsiteURL, Gmaps_URL, Rating, Reviews
            </p>
            <p className="text-xs text-clay-400 mb-6">
              Plus star reviews: 1-5 Star Reviews, 1-2 Star Reviews w/ Media
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="primary"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose File
            </Button>
          </div>
        )}

        {step === 'mapping' && (
          <div>
            <h3 className="text-lg font-medium text-clay-900 mb-4">
              Map CSV Columns
            </h3>
            <p className="text-sm text-clay-500 mb-6">
              Found {csvData.length} rows. Preview and adjust field mappings below.
            </p>

            {/* Preview Table */}
            <div className="mb-6 overflow-x-auto">
              <table className="clay-table text-xs">
                <thead>
                  <tr>
                    {headers.slice(0, 6).map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvData.slice(0, 3).map((row, i) => (
                    <tr key={i}>
                      {headers.slice(0, 6).map(h => (
                        <td key={h}>{row[h]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Field Mappings */}
            <div className="grid grid-cols-2 gap-4">
              {(Object.keys(DEFAULT_MAPPINGS) as (keyof D7FieldMapping)[]).map(field => (
                <Select
                  key={field}
                  label={field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  value={mappings[field]}
                  onChange={(v) => handleMappingChange(field, v)}
                  options={[{ value: '', label: '-- Select Column --' }, ...columnOptions]}
                  allowCustomFields={true}
                  onAddCustomField={(fieldName) => handleAddCustomField(field, fieldName)}
                />
              ))}
            </div>
          </div>
        )}

        {step === 'tagging' && (
          <div>
            <h3 className="text-lg font-medium text-clay-900 mb-4">
              Tag Imported Businesses
            </h3>
            <p className="text-sm text-clay-500 mb-6">
              Assign a tag to organize these {csvData.length} businesses. You can use this tag later to create campaigns.
            </p>

            {/* Tag Selection */}
            <div className="space-y-4">
              {/* Existing Tag Selection */}
              <div>
                <label className="block text-sm font-medium text-clay-700 mb-2">
                  Select Existing Tag
                </label>
                <select
                  value={isCreatingNewTag ? '' : selectedTagId}
                  onChange={(e) => {
                    setSelectedTagId(e.target.value)
                    setIsCreatingNewTag(false)
                  }}
                  disabled={isCreatingNewTag}
                  className="w-full px-4 py-2.5 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                >
                  <option value="">-- No tag (skip) --</option>
                  {existingTags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-clay-200" />
                <span className="text-sm text-clay-400">or</span>
                <div className="flex-1 h-px bg-clay-200" />
              </div>

              {/* Create New Tag */}
              <div>
                <label className="flex items-center gap-2 mb-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCreatingNewTag}
                    onChange={(e) => {
                      setIsCreatingNewTag(e.target.checked)
                      if (e.target.checked) setSelectedTagId('')
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-clay-700">Create new tag</span>
                </label>

                {isCreatingNewTag && (
                  <div className="space-y-4 pl-6">
                    {/* Tag Name */}
                    <div>
                      <label className="block text-sm font-medium text-clay-700 mb-1">
                        Tag Name
                      </label>
                      <input
                        type="text"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        placeholder="e.g., January 2026 Import, Restaurants, Chicago"
                        className="w-full px-4 py-2.5 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Tag Color */}
                    <div>
                      <label className="block text-sm font-medium text-clay-700 mb-2">
                        Tag Color
                      </label>
                      <div className="flex gap-2">
                        {TAG_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setNewTagColor(color)}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                              newTagColor === color
                                ? 'border-gray-900 scale-110'
                                : 'border-transparent hover:border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Preview */}
                    {newTagName.trim() && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-clay-500">Preview:</span>
                        <span
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                          style={{ backgroundColor: newTagColor }}
                        >
                          {newTagName.trim()}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="mt-6 p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> Tags help you organize businesses by import batch, industry, or location.
                When creating campaigns, you can select businesses by tag.
              </p>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="text-center py-8">
            <div className="mb-4">
              <div className="w-full bg-clay-200 rounded-full h-3">
                <div
                  className="bg-accent-blue h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <p className="text-lg font-medium text-clay-900">Importing...</p>
            <p className="text-sm text-clay-500">{progress}% complete</p>
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center py-8">
            {importedCount > 0 && errors.length === 0 ? (
              <>
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-clay-900 mb-2">Import Complete</h3>
                <p className="text-sm text-clay-500 mb-4">
                  Successfully imported {importedCount} businesses
                </p>
              </>
            ) : importedCount > 0 && errors.length > 0 ? (
              <>
                <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-clay-900 mb-2">Import Partially Complete</h3>
                <p className="text-sm text-clay-500 mb-4">
                  Imported {importedCount} businesses with some errors
                </p>
              </>
            ) : (
              <>
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-clay-900 mb-2">Import Failed</h3>
                <p className="text-sm text-clay-500 mb-4">
                  No businesses were imported
                </p>
              </>
            )}
            {errors.length > 0 && (
              <div className="text-left bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-red-800 mb-2">Errors:</p>
                <ul className="text-xs text-red-700 list-disc list-inside">
                  {errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
