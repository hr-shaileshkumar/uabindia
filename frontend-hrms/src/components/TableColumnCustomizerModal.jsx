import React, { useState, useEffect, useMemo } from 'react'
import {
  X,
  Sliders,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Search,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react'

/**
 * Enterprise Table Column Visibility Selector
 * Clean, minimalist, user-scoped view customizer.
 * Allows showing/hiding and reordering table columns without altering master database schemas.
 */
export default function TableColumnCustomizerModal({
  isOpen,
  onClose,
  schema,
  schemaId: schemaIdProp,
  tenantId = 'default',
  userId = 'default',
  onSave,
  onSaveSuccess,
}) {
  const [columns, setColumns] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Initialize columns from schema
  useEffect(() => {
    if (isOpen && schema) {
      const initial = (schema.columns || []).map((col, idx) => ({
        ...col,
        id: col.id || col.key || `col_${idx}`,
        key: col.key || col.id,
        label: col.label || col.header || col.name || col.key || `Column ${idx + 1}`,
        visible: col.visible !== false,
      }))
      setColumns(initial)
      setSearchQuery('')
      setError('')
      setSuccess(false)
    }
  }, [isOpen, schema])

  if (!isOpen || !schema) return null

  const rawSchemaId = schema.id || schema.key || schemaIdProp || 'default'
  const schemaId = rawSchemaId === 'candidates' ? 'candidate_pipeline' : rawSchemaId

  // Toggle single column
  const handleToggleVisible = (key) => {
    setColumns(prev =>
      prev.map(c => {
        if ((c.key || c.id) === key) {
          return { ...c, visible: !c.visible }
        }
        return c
      })
    )
  }

  // Move column order
  const handleMove = (index, direction) => {
    const newIdx = direction === 'up' ? index - 1 : index + 1
    if (newIdx < 0 || newIdx >= columns.length) return
    setColumns(prev => {
      const updated = [...prev]
      const [moved] = updated.splice(index, 1)
      updated.splice(newIdx, 0, moved)
      return updated
    })
  }

  // Select all / Deselect all
  const handleSelectAll = (select) => {
    setColumns(prev => prev.map(c => ({ ...c, visible: select })))
  }

  // Reset to default
  const handleResetToDefault = () => {
    const defaultCols = (schema.columns || []).map(c => ({
      ...c,
      visible: true,
    }))
    setColumns(defaultCols)
    setError('')
  }

  // Filter columns by search query
  const filteredColumns = useMemo(() => {
    if (!searchQuery.trim()) return columns
    const q = searchQuery.toLowerCase().trim()
    return columns.filter(c => {
      const label = (c.label || c.header || '').toLowerCase()
      const key = (c.key || c.id || '').toLowerCase()
      return label.includes(q) || key.includes(q)
    })
  }, [columns, searchQuery])

  const visibleCount = columns.filter(c => c.visible !== false).length

  // Save personal column preferences
  const handleSave = async () => {
    const visibleCols = columns.filter(c => c.visible !== false)
    if (visibleCols.length === 0) {
      setError('At least one column must remain visible in the table.')
      return
    }

    try {
      setSaving(true)
      setError('')

      const updatedSchema = {
        ...schema,
        columns,
        version: (schema.version || 1) + 1,
        updatedAt: new Date().toISOString(),
      }

      // 1. Persist user-scoped personal view preference
      const userPrefKey = `uab_table_cols_${schemaId}_${userId || 'default'}`
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(userPrefKey, JSON.stringify(visibleCols))
        // Published fallback cache
        const publishedKey = `hrms_meta_${schemaId}_${tenantId}_published`
        localStorage.setItem(publishedKey, JSON.stringify(updatedSchema))
      }

      // 2. Broadcast live update to any active table view
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('hrms:metadata-updated', {
            detail: { schemaId, tenantOrCompanyId: tenantId, schema: updatedSchema },
          })
        )
      }

      // 3. Callback handlers
      if (onSave) await onSave(updatedSchema)
      if (onSaveSuccess) onSaveSuccess(updatedSchema)

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 350)
    } catch (err) {
      setError(err?.message || 'Failed to save column preferences.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-700 text-white shadow-2xs">
              <Sliders size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Table Columns</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  {visibleCount} of {columns.length} visible
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Customize column visibility and order for your workspace view
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition cursor-pointer"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search & Bulk Action Bar */}
        <div className="px-5 py-3 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-center gap-2 justify-between">
          <div className="relative w-full sm:w-60">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search column..."
              className="w-full pl-8 pr-6 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none text-slate-800 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold self-end sm:self-auto">
            <button
              type="button"
              onClick={() => handleSelectAll(true)}
              className="text-purple-700 hover:text-purple-900 text-[11px] cursor-pointer"
            >
              Show All
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={() => handleSelectAll(false)}
              className="text-slate-500 hover:text-slate-700 text-[11px] cursor-pointer"
            >
              Hide All
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={handleResetToDefault}
              className="text-slate-500 hover:text-slate-700 text-[11px] flex items-center gap-1 cursor-pointer"
              title="Reset to default schema columns"
            >
              <RotateCcw size={10} /> Reset
            </button>
          </div>
        </div>

        {/* Notification alerts */}
        {error && (
          <div className="mx-5 mt-3 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Scrollable Column List */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1.5 divide-y divide-slate-100">
          {filteredColumns.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No columns match &quot;{searchQuery}&quot;
            </div>
          ) : (
            filteredColumns.map((col) => {
              const actualIdx = columns.findIndex(c => (c.key || c.id) === (col.key || col.id))
              const isFirst = actualIdx === 0
              const isLast = actualIdx === columns.length - 1
              const colKey = col.key || col.id
              const displayLabel = col.label || col.header || col.name || colKey

              return (
                <div
                  key={colKey}
                  className={`pt-1.5 first:pt-0 flex items-center justify-between p-2 rounded-xl transition ${
                    col.visible ? 'bg-white hover:bg-slate-50/70' : 'bg-slate-50/50 opacity-60'
                  }`}
                >
                  <label className="flex items-center gap-2.5 cursor-pointer select-none flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={col.visible !== false}
                      onChange={() => handleToggleVisible(colKey)}
                      className="h-4 w-4 rounded text-purple-600 border-slate-300 focus:ring-purple-500 cursor-pointer accent-purple-600"
                    />
                    <div className="flex items-center gap-1.5 truncate">
                      <span className={`text-xs font-semibold truncate ${col.visible ? 'text-slate-800' : 'text-slate-400'}`}>
                        {displayLabel}
                      </span>
                      {col.format && (
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-500">
                          {col.format}
                        </span>
                      )}
                    </div>
                  </label>

                  {/* Reorder Buttons */}
                  <div className="flex items-center gap-0.5 shrink-0 ml-2">
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => handleMove(actualIdx, 'up')}
                      className={`h-6 w-6 flex items-center justify-center rounded transition ${
                        isFirst
                          ? 'text-slate-300 cursor-not-allowed'
                          : 'text-slate-500 hover:text-purple-700 hover:bg-purple-50 cursor-pointer'
                      }`}
                      title="Move Up"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => handleMove(actualIdx, 'down')}
                      className={`h-6 w-6 flex items-center justify-center rounded transition ${
                        isLast
                          ? 'text-slate-300 cursor-not-allowed'
                          : 'text-slate-500 hover:text-purple-700 hover:bg-purple-50 cursor-pointer'
                      }`}
                      title="Move Down"
                    >
                      <ArrowDown size={13} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            View saved to your browser session
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 text-xs font-bold rounded-xl bg-purple-700 hover:bg-purple-800 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {success ? (
                <>
                  <Check size={13} /> Applied!
                </>
              ) : (
                <>
                  <CheckCircle2 size={13} /> Apply Columns
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
