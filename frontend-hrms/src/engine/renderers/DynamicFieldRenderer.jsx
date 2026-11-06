import React, { useState, useEffect } from 'react'
import { listCompanies } from '../../api/companies'
import { listProjects } from '../../api/projects'
import { AlertCircle, HelpCircle } from 'lucide-react'

// Cache master reference data across fields to avoid duplicate HTTP requests
const referenceCache = new Map()

export default function DynamicFieldRenderer({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  readOnly = false,
  gridColumns = 2,
  className = '',
}) {
  const [refOptions, setRefOptions] = useState([])
  const [refLoading, setRefLoading] = useState(false)

  // Fetch reference options if ref_select
  useEffect(() => {
    if (field.type === 'ref_select' && field.referenceApi) {
      const cacheKey = field.referenceApi
      if (referenceCache.has(cacheKey)) {
        setRefOptions(referenceCache.get(cacheKey))
        return
      }

      let mounted = true
      setRefLoading(true)

      const fetchRef = async () => {
        try {
          let opts = []
          if (field.referenceApi === 'companies') {
            const data = await listCompanies()
            const items = Array.isArray(data) ? data : data?.items || []
            opts = items.map(c => ({
              value: c.id || c.companyId,
              label: c.companyName || c.name,
              code: c.companyCode || c.code,
            }))
          } else if (field.referenceApi === 'projects') {
            const data = await listProjects()
            const items = Array.isArray(data) ? data : data?.items || []
            opts = items.map(p => ({
              value: p.id || p.projectId,
              label: p.projectName || p.name,
              code: p.projectCode || p.code,
            }))
          }

          referenceCache.set(cacheKey, opts)
          if (mounted) setRefOptions(opts)
        } catch (err) {
          console.warn(`Failed to fetch reference options for ${field.referenceApi}:`, err)
        } finally {
          if (mounted) setRefLoading(false)
        }
      }

      fetchRef()
      return () => { mounted = false }
    }
  }, [field.type, field.referenceApi])

  const handleChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    if (onChange) onChange(field.id, val)
  }

  const inputId = `field_${field.id}`
  const isRequired = !!field.required

  // Dynamic Responsive Column Span calculation according to active form grid (1 to 6 columns)
  let colSpanClass = 'col-span-1'
  if (field.width === 'full' || field.colSpan === 'full' || field.type === 'textarea') {
    colSpanClass = 'col-span-full'
  } else if (typeof field.colSpan === 'number' && field.colSpan > 1) {
    const span = Math.min(field.colSpan, gridColumns)
    colSpanClass = `col-span-1 md:col-span-${span}`
  } else if (field.width === '1/2' && gridColumns >= 4) {
    colSpanClass = `col-span-1 md:col-span-${Math.floor(gridColumns / 2)}`
  } else if (field.width === '1/3' && gridColumns >= 6) {
    colSpanClass = 'col-span-1 md:col-span-2'
  } else {
    colSpanClass = 'col-span-1'
  }

  // Input styling
  const baseInputStyle = `w-full rounded-xl border bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition outline-none placeholder:text-slate-400 ${
    error
      ? 'border-rose-400 focus:border-rose-600 focus:ring-2 focus:ring-rose-100'
      : 'border-slate-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-100'
  } ${disabled || readOnly ? 'bg-slate-50 cursor-not-allowed text-slate-500' : ''}`

  return (
    <div className={`${colSpanClass} ${className} space-y-1.5`}>
      {/* Label and Required indicator */}
      <div className="flex items-center justify-between">
        <label
          htmlFor={inputId}
          className="text-xs font-bold text-slate-700 flex items-center gap-1"
        >
          <span>{field.label}</span>
          {isRequired && <span className="text-rose-500">*</span>}
        </label>
        {field.helpText && (
          <span title={field.helpText} className="text-slate-400 hover:text-slate-600 cursor-help">
            <HelpCircle size={13} />
          </span>
        )}
      </div>

      {/* Field Input Control */}
      {(() => {
        switch (field.type) {
          case 'textarea':
            return (
              <textarea
                id={inputId}
                name={field.id}
                value={value ?? ''}
                onChange={handleChange}
                onBlur={onBlur}
                disabled={disabled}
                readOnly={readOnly}
                rows={field.rows || 3}
                placeholder={field.placeholder || ''}
                className={baseInputStyle}
              />
            )

          case 'select': {
            const options = Array.isArray(field.options) ? field.options : []
            return (
              <select
                id={inputId}
                name={field.id}
                value={value ?? ''}
                onChange={handleChange}
                onBlur={onBlur}
                disabled={disabled || readOnly}
                className={baseInputStyle}
              >
                <option value="">{field.placeholder || '-- Select an option --'}</option>
                {options.map((opt, idx) => {
                  const optVal = typeof opt === 'object' ? opt.value : opt
                  const optLabel = typeof opt === 'object' ? opt.label : opt
                  return (
                    <option key={idx} value={optVal}>
                      {optLabel}
                    </option>
                  )
                })}
              </select>
            )
          }

          case 'ref_select':
            return (
              <select
                id={inputId}
                name={field.id}
                value={value ?? ''}
                onChange={handleChange}
                onBlur={onBlur}
                disabled={disabled || readOnly || refLoading}
                className={baseInputStyle}
              >
                <option value="">
                  {refLoading ? 'Loading options...' : field.placeholder || '-- Select Reference --'}
                </option>
                {refOptions.map((opt, idx) => (
                  <option key={idx} value={opt.value}>
                    {opt.label} {opt.code ? `(${opt.code})` : ''}
                  </option>
                ))}
              </select>
            )

          case 'boolean':
            return (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id={inputId}
                  name={field.id}
                  checked={!!value}
                  onChange={handleChange}
                  disabled={disabled || readOnly}
                  className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <label htmlFor={inputId} className="text-xs font-semibold text-slate-700 cursor-pointer">
                  {field.checkboxLabel || field.label}
                </label>
              </div>
            )

          case 'file':
            return (
              <input
                type="file"
                id={inputId}
                name={field.id}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (onChange) onChange(field.id, file?.name || '')
                }}
                disabled={disabled || readOnly}
                className={baseInputStyle}
              />
            )

          case 'date':
            return (
              <input
                type="date"
                id={inputId}
                name={field.id}
                value={value ? String(value).slice(0, 10) : ''}
                onChange={handleChange}
                onBlur={onBlur}
                disabled={disabled}
                readOnly={readOnly}
                className={baseInputStyle}
              />
            )

          case 'number':
          case 'currency':
            return (
              <input
                type="number"
                id={inputId}
                name={field.id}
                value={value ?? ''}
                onChange={handleChange}
                onBlur={onBlur}
                disabled={disabled}
                readOnly={readOnly}
                placeholder={field.placeholder || ''}
                className={baseInputStyle}
              />
            )

          case 'email':
            return (
              <input
                type="email"
                id={inputId}
                name={field.id}
                value={value ?? ''}
                onChange={handleChange}
                onBlur={onBlur}
                disabled={disabled}
                readOnly={readOnly}
                placeholder={field.placeholder || 'user@example.com'}
                className={baseInputStyle}
              />
            )

          case 'phone':
            return (
              <input
                type="tel"
                id={inputId}
                name={field.id}
                value={value ?? ''}
                onChange={handleChange}
                onBlur={onBlur}
                disabled={disabled}
                readOnly={readOnly}
                placeholder={field.placeholder || '10-digit mobile number'}
                className={baseInputStyle}
              />
            )

          case 'text':
          default:
            return (
              <input
                type="text"
                id={inputId}
                name={field.id}
                value={value ?? ''}
                onChange={handleChange}
                onBlur={onBlur}
                disabled={disabled}
                readOnly={readOnly}
                placeholder={field.placeholder || ''}
                className={baseInputStyle}
              />
            )
        }
      })()}

      {/* Validation Feedback */}
      {error && (
        <p className="flex items-center gap-1 text-[11px] font-semibold text-rose-600">
          <AlertCircle size={12} />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}
