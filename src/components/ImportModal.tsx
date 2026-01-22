'use client'

import { useState, useCallback } from 'react'
import Papa from 'papaparse'
import { supabase } from '@/lib/supabase'
import { calculatePricing, D7FieldMapping } from '@/types'

interface ImportModalProps {
  onClose: () => void
  onImportComplete: (count: number) => void
}

// Default D7 Lead Finder field mappings
const DEFAULT_MAPPINGS: D7FieldMapping = {
  business_name: 'Business Name',
  email: 'Email',
  phone: 'Phone',
  website: 'Website',
  address: 'Address',
  city: 'City',
  state: 'State',
  zip: 'Zip',
  total_reviews: 'Total Reviews',
  one_star_media_reviews: '1-Star Media Reviews',
  two_star_media_reviews: '2-Star Media Reviews',
}

// Common column name variations for auto-detection
const COLUMN_VARIATIONS: Record<keyof D7FieldMapping, string[]> = {
  business_name: ['Business Name', 'Name', 'Company', 'Company Name', 'Business'],
  email: ['Email', 'Contact Email', 'Email Address', 'E-mail'],
  phone: ['Phone', 'Telephone', 'Phone Number', 'Tel'],
  website: ['Website', 'URL', 'Web', 'Site'],
  address: ['Address', 'Street', 'Street Address'],
  city: ['City', 'Town'],
  state: ['State', 'Province', 'Region'],
  zip: ['Zip', 'Zip Code', 'Postal Code', 'Zipcode'],
  total_reviews: ['Total Reviews', 'Reviews', 'Review Count'],
  one_star_media_reviews: ['1-Star Media Reviews', '1 Star Media', '1-Star Photos', 'One Star Media'],
  two_star_media_reviews: ['2-Star Media Reviews', '2 Star Media', '2-Star Photos', 'Two Star Media'],
}

export function ImportModal({ onClose, onImportComplete }: ImportModalProps) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'importing' | 'complete'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<any[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [mappings, setMappings] = useState<D7FieldMapping>(DEFAULT_MAPPINGS)
  const [progress, setProgress] = useState(0)
  const [importedCount, setImportedCount] = useState(0)
  const [errors, setErrors] = useState<string[]>([])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
        setErrors([`Error parsing CSV: ${error.message}`])
      },
    })
  }, [])

  const handleMappingChange = useCallback((field: keyof D7FieldMapping, value: string) => {
    setMappings(prev => ({ ...prev, [field]: value }))
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

        // Process in batches of 100
        const batchSize = 100
        for (let i = 0; i < totalRows; i += batchSize) {
          const batch = data.slice(i, i + batchSize)

          const businessRecords = batch
            .filter(row => row[mappings.business_name]?.trim()) // Skip rows without business name
            .map(row => {
              const oneStarMedia = parseInt(row[mappings.one_star_media_reviews]) || 0
              const twoStarMedia = parseInt(row[mappings.two_star_media_reviews]) || 0
              const totalMediaReviews = oneStarMedia + twoStarMedia
              const pricing = calculatePricing(totalMediaReviews)

              return {
                business_name: row[mappings.business_name]?.trim() || '',
                email: row[mappings.email]?.trim() || null,
                phone: row[mappings.phone]?.trim() || null,
                website: row[mappings.website]?.trim() || null,
                address: row[mappings.address]?.trim() || null,
                city: row[mappings.city]?.trim() || null,
                state: row[mappings.state]?.trim() || null,
                zip: row[mappings.zip]?.trim() || null,
                total_reviews: parseInt(row[mappings.total_reviews]) || 0,
                one_star_media_reviews: oneStarMedia,
                two_star_media_reviews: twoStarMedia,
                // total_media_reviews and total_project_value are GENERATED columns in PostgreSQL
                // They are computed automatically from one_star_media_reviews, two_star_media_reviews, and price_per_review
                pricing_tier: pricing.tier,
                price_per_review: pricing.pricePerReview,
                email_status: 'unverified' as const,
                pipeline_stage: 'new_lead',
              }
            })

          if (businessRecords.length > 0) {
            const { error } = await supabase
              .from('businesses')
              .insert(businessRecords)

            if (error) {
              importErrors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`)
            } else {
              imported += businessRecords.length
            }
          }

          setProgress(Math.round(((i + batchSize) / totalRows) * 100))
        }

        setImportedCount(imported)
        setErrors(importErrors)
        setStep('complete')
      },
      error: (error) => {
        setErrors([`Error parsing CSV: ${error.message}`])
        setStep('complete')
      },
    })
  }, [file, mappings])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-clay-200">
          <h2 className="text-lg font-semibold text-clay-900">Import CSV</h2>
          <button
            onClick={onClose}
            className="text-clay-400 hover:text-clay-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {step === 'upload' && (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-clay-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-clay-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-clay-900 mb-2">Upload D7 Lead Finder CSV</h3>
              <p className="text-sm text-clay-500 mb-6">
                Drop your CSV file here or click to browse
              </p>
              <label className="inline-block">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <span className="clay-btn-primary cursor-pointer">
                  Choose File
                </span>
              </label>
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
                  <div key={field}>
                    <label className="block text-sm font-medium text-clay-700 mb-1 capitalize">
                      {field.replace(/_/g, ' ')}
                    </label>
                    <select
                      value={mappings[field]}
                      onChange={(e) => handleMappingChange(field, e.target.value)}
                      className="clay-input"
                    >
                      <option value="">-- Select Column --</option>
                      {headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
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
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-clay-900 mb-2">Import Complete</h3>
              <p className="text-sm text-clay-500 mb-4">
                Successfully imported {importedCount} businesses
              </p>
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

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-clay-200 bg-clay-50">
          {step === 'mapping' && (
            <>
              <button onClick={onClose} className="clay-btn-secondary mr-3">
                Cancel
              </button>
              <button onClick={handleImport} className="clay-btn-primary">
                Import {csvData.length} Rows
              </button>
            </>
          )}
          {step === 'complete' && (
            <button
              onClick={() => onImportComplete(importedCount)}
              className="clay-btn-primary"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
