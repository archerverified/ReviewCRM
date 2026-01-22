'use client'

import { useState, useRef, ChangeEvent, useCallback } from 'react'
import Papa from 'papaparse'
import { supabase } from '@/lib/supabase'
import { D7FieldMapping } from '@/types'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Select } from './ui/Select'
import { toast } from 'sonner'

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
  const [step, setStep] = useState<'upload' | 'mapping' | 'importing' | 'complete'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<any[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [mappings, setMappings] = useState<D7FieldMapping>(DEFAULT_MAPPINGS)
  const [progress, setProgress] = useState(0)
  const [importedCount, setImportedCount] = useState(0)
  const [errors, setErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

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
              return {
                business_name: row[mappings.business_name]?.trim() || '',
                contact_name: row[mappings.contact_name]?.trim() || null,
                email: row[mappings.email]?.trim() || null,
                website_url: row[mappings.website_url]?.trim() || null,
                gmaps_url: row[mappings.gmaps_url]?.trim() || null,
                city: row[mappings.city]?.trim() || null,
                state: row[mappings.state]?.trim() || null,
                google_rating: parseFloat(row[mappings.google_rating]) || null,
                total_reviews: parseInt(row[mappings.total_reviews]) || 0,
                one_star_reviews: parseInt(row[mappings.one_star_reviews]) || 0,
                two_star_reviews: parseInt(row[mappings.two_star_reviews]) || 0,
                three_star_reviews: parseInt(row[mappings.three_star_reviews]) || 0,
                four_star_reviews: parseInt(row[mappings.four_star_reviews]) || 0,
                five_star_reviews: parseInt(row[mappings.five_star_reviews]) || 0,
                one_star_media_reviews: parseInt(row[mappings.one_star_media_reviews]) || 0,
                two_star_media_reviews: parseInt(row[mappings.two_star_media_reviews]) || 0,
                // GENERATED columns (total_media_reviews, projected_rating, pricing_tier, price_per_review, total_project_value)
                // are computed automatically by PostgreSQL
                email_verification_status: 'unverified' as const,
                email_outreach_status: 'not_sent' as const,
                pipeline_stage: 'lead_scraped' as const,
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
  }, [file, mappings])

  const resetModal = useCallback(() => {
    setFile(null)
    setCsvData([])
    setHeaders([])
    setStep('upload')
    if (fileInputRef.current) fileInputRef.current.value = ''
    onClose()
  }, [onClose])

  const columnOptions = headers.map(h => ({ value: h, label: h }))

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
              onClick={handleImport}
              disabled={!file}
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
            <label className="inline-block">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button variant="primary">
                Choose File
              </Button>
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
                <Select
                  key={field}
                  label={field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  value={mappings[field]}
                  onChange={(v) => handleMappingChange(field, v)}
                  options={[{ value: '', label: '-- Select Column --' }, ...columnOptions]}
                />
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
    </Modal>
  )
}
