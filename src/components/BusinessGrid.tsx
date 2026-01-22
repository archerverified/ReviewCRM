'use client'

import { useCallback, useMemo, useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, GridReadyEvent, SelectionChangedEvent, ICellRendererParams, ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { Business, getStageInfo, PIPELINE_STAGES } from '@/types'
import { supabase } from '@/lib/supabase'

// Register AG Grid modules (required for v35+)
ModuleRegistry.registerModules([AllCommunityModule])

interface BusinessGridProps {
  businesses: Business[]
  selectedRows: string[]
  onSelectionChange: (ids: string[]) => void
  onBusinessUpdate: () => void
}

// Custom cell renderer for stage badge
function StageCellRenderer(props: ICellRendererParams) {
  const stage = getStageInfo(props.value)
  const colorClasses: Record<string, string> = {
    gray: 'bg-clay-100 text-clay-700',
    blue: 'bg-blue-100 text-blue-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClasses[stage.color] || colorClasses.gray}`}>
      {stage.name}
    </span>
  )
}

// Custom cell renderer for email status
function EmailStatusRenderer(props: ICellRendererParams) {
  const statusColors: Record<string, string> = {
    good: 'text-green-600',
    risky: 'text-yellow-600',
    bad: 'text-red-600',
    unverified: 'text-clay-400',
  }

  return (
    <span className={`text-sm font-medium ${statusColors[props.value] || statusColors.unverified}`}>
      {props.value || 'unverified'}
    </span>
  )
}

// Custom cell renderer for currency
function CurrencyRenderer(props: ICellRendererParams) {
  const value = props.value || 0
  return (
    <span className="font-medium text-clay-900">
      ${value.toLocaleString()}
    </span>
  )
}

// Custom cell renderer for pricing tier
function TierRenderer(props: ICellRendererParams) {
  const tierColors: Record<string, string> = {
    standard: 'bg-clay-100 text-clay-700',
    volume: 'bg-blue-100 text-blue-700',
    enterprise: 'bg-purple-100 text-purple-700',
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${tierColors[props.value] || tierColors.standard}`}>
      {props.value || 'standard'}
    </span>
  )
}

export function BusinessGrid({ businesses, selectedRows, onSelectionChange, onBusinessUpdate }: BusinessGridProps) {
  const gridRef = useRef<AgGridReact>(null)

  const columnDefs: ColDef[] = useMemo(() => [
    {
      field: 'business_name',
      headerName: 'Business Name',
      flex: 2,
      minWidth: 200,
      checkboxSelection: true,
      headerCheckboxSelection: true,
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1.5,
      minWidth: 180,
    },
    {
      field: 'phone',
      headerName: 'Phone',
      flex: 1,
      minWidth: 120,
    },
    {
      field: 'city',
      headerName: 'City',
      flex: 1,
      minWidth: 100,
    },
    {
      field: 'total_media_reviews',
      headerName: 'Media Reviews',
      flex: 0.8,
      minWidth: 100,
      type: 'numericColumn',
    },
    {
      field: 'pricing_tier',
      headerName: 'Tier',
      flex: 0.8,
      minWidth: 90,
      cellRenderer: TierRenderer,
    },
    {
      field: 'total_project_value',
      headerName: 'Project Value',
      flex: 1,
      minWidth: 110,
      cellRenderer: CurrencyRenderer,
      type: 'numericColumn',
    },
    {
      field: 'email_status',
      headerName: 'Email Status',
      flex: 0.8,
      minWidth: 100,
      cellRenderer: EmailStatusRenderer,
    },
    {
      field: 'pipeline_stage',
      headerName: 'Stage',
      flex: 1.2,
      minWidth: 140,
      cellRenderer: StageCellRenderer,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: PIPELINE_STAGES.map(s => s.id),
      },
      editable: true,
    },
  ], [])

  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
  }), [])

  const onGridReady = useCallback((event: GridReadyEvent) => {
    event.api.sizeColumnsToFit()
  }, [])

  const onSelectionChanged = useCallback((event: SelectionChangedEvent) => {
    const selectedNodes = event.api.getSelectedNodes()
    const selectedIds = selectedNodes.map(node => node.data.id)
    onSelectionChange(selectedIds)
  }, [onSelectionChange])

  const onCellValueChanged = useCallback(async (event: any) => {
    const { data, colDef, newValue } = event

    if (colDef.field === 'pipeline_stage') {
      // Update stage in database
      const { error } = await supabase
        .from('businesses')
        .update({ pipeline_stage: newValue })
        .eq('id', data.id)

      if (error) {
        console.error('Error updating stage:', error)
        // Revert the change
        event.api.refreshCells({ rowNodes: [event.node], columns: [colDef.field] })
      } else {
        // Log stage change to history
        await supabase.from('stage_history').insert({
          business_id: data.id,
          from_stage: event.oldValue,
          to_stage: newValue,
        })
        onBusinessUpdate()
      }
    }
  }, [onBusinessUpdate])

  return (
    <div className="ag-theme-alpine w-full" style={{ height: 'calc(100vh - 280px)', minHeight: '400px' }}>
      <AgGridReact
        ref={gridRef}
        rowData={businesses}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        rowSelection="multiple"
        suppressRowClickSelection={true}
        onGridReady={onGridReady}
        onSelectionChanged={onSelectionChanged}
        onCellValueChanged={onCellValueChanged}
        animateRows={true}
        pagination={true}
        paginationPageSize={50}
        getRowId={(params) => params.data.id}
        theme="legacy"
      />
    </div>
  )
}
