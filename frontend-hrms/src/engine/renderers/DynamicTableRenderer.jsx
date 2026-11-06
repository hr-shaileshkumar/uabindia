import React, { useState, useMemo } from 'react'
import {
  Search,
  Filter,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Sliders,
} from 'lucide-react'
import DynamicColumnRenderer from './DynamicColumnRenderer'
import MetadataLoadingState from './MetadataLoadingState'
import MetadataEmptyState from './MetadataEmptyState'
import MetadataErrorState from './MetadataErrorState'
import MetadataActionRenderer from './MetadataActionRenderer'
import TableColumnCustomizerModal from '../../components/TableColumnCustomizerModal'
import { useAuth } from '../../context/AuthContext'
import { DEFAULT_SCHEMAS } from '../metadataStore'

export default function DynamicTableRenderer({
  schema,
  data = [],
  loading = false,
  error = null,
  onRefresh,
  onAction,
  onRowClick,
  className = '',
  showToolbarRefresh = false,
  showTopActions = false,
}) {
  const tableConfig = schema?.tableConfig || {}
  const [columnModalOpen, setColumnModalOpen] = useState(false)
  const { user } = useAuth()

  // Strict role check for column customization
  const canCustomize = useMemo(() => {
    if (!user) return false
    const role = String(user.roleName || user.role || user.Role || '').toLowerCase().trim()
    if (role.includes('superadmin') || role.includes('admin') || role.includes('company admin')) {
      return true
    }
    const allowed = user.allowedPages || user.AllowedPages || []
    if (Array.isArray(allowed)) {
      if (allowed.includes('*')) return true
      return allowed.some(p => ['formstudio', 'customization', 'metadata', 'superadmin', 'admin'].includes(String(p).toLowerCase()))
    }
    return false
  }, [user])

  // Resilient column resolution with default schema fallback
  const columns = useMemo(() => {
    let cols = schema?.columns || []
    if (cols.length === 0 && DEFAULT_SCHEMAS[schema?.id]?.columns?.length > 0) {
      cols = DEFAULT_SCHEMAS[schema.id].columns
    }
    return cols.filter(c => c.visible !== false)
  }, [schema])

  // Search & Filters State
  const [search, setSearch] = useState('')
  const [filterValues, setFilterValues] = useState(() => {
    const init = {}
    ;(schema?.filters || []).forEach(f => {
      init[f.key] = f.defaultValue !== undefined ? f.defaultValue : 'all'
    })
    return init
  })

  // Sorting State
  const [sortKey, setSortKey] = useState(() => tableConfig.defaultSortKey || columns[0]?.key || '')
  const [sortDir, setSortDir] = useState(() => tableConfig.defaultSortDir || 'asc')

  // Pagination State
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(() => tableConfig.pageSize || 15)

  // Selection State
  const [selectedIds, setSelectedIds] = useState([])

  const handleFilterChange = (key, value) => {
    setFilterValues(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const handleSort = (colKey) => {
    if (sortKey === colKey) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(colKey)
      setSortDir('asc')
    }
  }

  // Filter & Search Logic
  const filteredData = useMemo(() => {
    let result = Array.isArray(data) ? [...data] : []

    // 1. Dropdown Filters
    Object.entries(filterValues).forEach(([fKey, fVal]) => {
      if (fVal && fVal !== 'all') {
        result = result.filter(item => {
          const itemVal = String(item[fKey] || '').toLowerCase()
          return itemVal === String(fVal).toLowerCase()
        })
      }
    })

    // 2. Global Search
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      const searchableKeys = tableConfig.searchableKeys || columns.map(c => c.key)
      result = result.filter(item => {
        return searchableKeys.some(k => {
          const val = item[k]
          if (val === null || val === undefined) return false
          return String(val).toLowerCase().includes(q)
        })
      })
    }

    // 3. Sorting
    if (sortKey) {
      result.sort((a, b) => {
        const valA = a[sortKey] ?? ''
        const valB = b[sortKey] ?? ''

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDir === 'asc' ? valA - valB : valB - valA
        }

        const cmp = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' })
        return sortDir === 'asc' ? cmp : -cmp
      })
    }

    return result
  }, [data, filterValues, search, sortKey, sortDir, tableConfig.searchableKeys, columns])

  // Pagination Slice
  const totalItems = filteredData.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, page, pageSize])

  // Bulk Selection Handlers
  const isAllSelected = paginatedData.length > 0 && paginatedData.every(r => selectedIds.includes(r.id))
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(prev => prev.filter(id => !paginatedData.some(r => r.id === id)))
    } else {
      const pageIds = paginatedData.map(r => r.id).filter(Boolean)
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])))
    }
  }

  const toggleSelectRow = (id) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
  }

  // Export Handler
  const handleExportCSV = () => {
    const exportColumns = columns.filter(c => c.format !== 'actions')
    const headers = exportColumns.map(c => c.label).join(',')
    const rows = filteredData.map(r => {
      return exportColumns
        .map(c => {
          const val = r[c.key] ?? ''
          return `"${String(val).replace(/"/g, '""')}"`
        })
        .join(',')
    })

    const csvContent = [headers, ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${schema.id || 'export'}_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const statusFilter = useMemo(() => {
    return (schema?.filters || []).find(f => f.key === 'status' || f.type === 'segmented')
  }, [schema])

  const dropdownFilters = useMemo(() => {
    return (schema?.filters || []).filter(f => f !== statusFilter)
  }, [schema, statusFilter])

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Table Toolbar: Quick Status Tabs, Search, Filters, and Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
          {/* Quick Status Filter Tabs (Segmented Control) */}
          {statusFilter && (
            <div className="inline-flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200/80 shadow-2xs">
              {(statusFilter.options || []).map((opt) => {
                const isSelected = String(filterValues[statusFilter.key] || 'all').toLowerCase() === String(opt.value).toLowerCase()
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleFilterChange(statusFilter.key, opt.value)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                    }`}
                  >
                    <span>{opt.label}</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Global Search Bar */}
          <div className="relative min-w-[200px] max-w-xs flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder={`Search ${schema.title || 'records'}...`}
              className="w-full pl-8 pr-7 py-1 text-xs rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none font-medium text-slate-800 transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setPage(1); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Dynamic Dropdown Filters from Metadata */}
          {dropdownFilters.map((filter) => (
            <div key={filter.key} className="flex items-center">
              <select
                value={filterValues[filter.key]}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                className="px-2.5 py-1 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-700 outline-none cursor-pointer focus:border-purple-600 focus:bg-white shadow-2xs"
              >
                {(filter.options || []).map((opt, i) => (
                  <option key={i} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Right Toolbar: Export, Refresh, Customize Columns */}
        <div className="flex flex-wrap items-center gap-2">
          {tableConfig.showExport && (
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition shadow-2xs cursor-pointer"
              title="Export CSV"
            >
              <Download size={13} className="text-slate-500" />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}

          {showToolbarRefresh && onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition shadow-2xs cursor-pointer"
              title="Refresh Records"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin text-purple-600' : 'text-slate-500'} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}

          {canCustomize && (
            <button
              type="button"
              onClick={() => setColumnModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl border border-purple-200/80 bg-purple-50/60 hover:bg-purple-100/70 text-purple-700 text-xs font-semibold transition shadow-2xs cursor-pointer"
              title="Customize Table Columns (Admin / SuperAdmin)"
            >
              <Sliders size={13} className="text-purple-600" />
              <span>Customize Columns</span>
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-purple-200/70 text-purple-800 text-[10px] font-bold">
                {columns.length}
              </span>
            </button>
          )}

          {/* Custom Metadata Top Actions */}
          {showTopActions && (schema.actions || []).map((action, idx) => (
            <MetadataActionRenderer
              key={action.key || idx}
              action={action}
              onAction={onAction}
            />
          ))}
        </div>
      </div>


      {/* Main Table Content */}
      {loading ? (
        <MetadataLoadingState type="table" rows={pageSize > 10 ? 10 : pageSize} />
      ) : error ? (
        <MetadataErrorState title="Failed to load table records" message={error} onRetry={onRefresh} />
      ) : paginatedData.length === 0 ? (
        <MetadataEmptyState
          title={`No ${schema.title || 'records'} found`}
          message={search ? 'No items match your active search terms or filters.' : 'The directory is currently empty.'}
          actionLabel={schema.actions?.[0]?.label}
          onAction={schema.actions?.[0] ? () => onAction?.(schema.actions[0]) : null}
        />
      ) : (
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/90 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {tableConfig.bulkSelection && (
                    <th className="w-10 px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                    </th>
                  )}
                  {columns.map((col) => {
                    const isSorted = sortKey === col.key
                    const isActions = col.format === 'actions' || col.key === 'actions'
                    return (
                      <th
                        key={col.key}
                        className={`px-4 py-3.5 whitespace-nowrap text-left ${col.width || ''} ${
                          col.align === 'right' || isActions ? 'text-right' : ''
                        } ${col.sortable ? 'cursor-pointer hover:bg-slate-100/70 transition-colors select-none' : ''} ${
                          isActions ? 'sticky right-0 bg-slate-50/95 backdrop-blur-xs shadow-[-6px_0_10px_-2px_rgba(0,0,0,0.06)] z-20' : ''
                        }`}
                        onClick={() => col.sortable && handleSort(col.key)}
                      >
                        <div className={`flex items-center gap-1.5 ${col.align === 'right' || isActions ? 'justify-end' : ''}`}>
                          <span className={isSorted ? 'text-purple-700 font-extrabold' : ''}>{col.label}</span>
                          {col.sortable && (
                            <span className="text-slate-400">
                              {isSorted ? (
                                sortDir === 'asc' ? <ArrowUp size={13} className="text-purple-600" /> : <ArrowDown size={13} className="text-purple-600" />
                              ) : (
                                <ArrowUpDown size={11} className="opacity-40" />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {paginatedData.map((row, rIdx) => {
                  const isSelected = selectedIds.includes(row.id)
                  return (
                    <tr
                      key={row.id || rIdx}
                      className={`group hover:bg-slate-50/80 transition-colors duration-150 ${
                        isSelected ? 'bg-purple-50/30' : ''
                      } ${onRowClick ? 'cursor-pointer' : ''}`}
                      onClick={() => onRowClick && onRowClick(row)}
                    >
                      {tableConfig.bulkSelection && (
                        <td
                          className="px-4 py-3 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(row.id)}
                            className="h-3.5 w-3.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                          />
                        </td>
                      )}
                      {columns.map((col) => {
                        const isActions = col.format === 'actions' || col.key === 'actions'
                        return (
                          <td
                            key={col.key}
                            className={`px-4 py-3.5 whitespace-nowrap ${col.align === 'right' || isActions ? 'text-right' : ''} ${
                              isActions
                                ? 'sticky right-0 bg-white group-hover:bg-slate-50/95 backdrop-blur-xs shadow-[-6px_0_10px_-2px_rgba(0,0,0,0.06)] z-10'
                                : ''
                            }`}
                            onClick={(e) => isActions && e.stopPropagation()}
                          >
                            <DynamicColumnRenderer
                              column={col}
                              row={row}
                              onAction={onAction}
                            />
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-slate-100 bg-slate-50/40 text-xs">
            <div className="flex items-center gap-2 text-slate-500">
              <span>Showing</span>
              <span className="font-semibold text-slate-800">
                {totalItems === 0 ? 0 : (page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalItems)}
              </span>
              <span>of</span>
              <span className="font-semibold text-slate-800">{totalItems}</span>
              <span>records</span>

              {selectedIds.length > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                  {selectedIds.length} selected
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Page size dropdown */}
              <div className="flex items-center gap-1.5 text-slate-500">
                <span>Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setPage(1)
                  }}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 cursor-pointer outline-none focus:border-purple-500"
                >
                  {(tableConfig.pageSizeOptions || [10, 15, 25, 50]).map((sz) => (
                    <option key={sz} value={sz}>
                      {sz}
                    </option>
                  ))}
                </select>
              </div>

              {/* Page navigation buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-slate-700 cursor-pointer shadow-2xs"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-2 font-bold text-slate-700">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-slate-700 cursor-pointer shadow-2xs"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

      )}

      {/* Table Column Customizer Modal */}
      {schema && (
        <TableColumnCustomizerModal
          isOpen={columnModalOpen}
          onClose={() => setColumnModalOpen(false)}
          schema={schema}
          tenantId={user?.tenantId || 'default'}
        />
      )}
    </div>
  )
}
