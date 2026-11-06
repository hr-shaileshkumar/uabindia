import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Save, RotateCcw, X, CheckCircle2, AlertCircle } from 'lucide-react'
import MetadataTabRenderer from './MetadataTabRenderer'
import DynamicFieldRenderer from './DynamicFieldRenderer'

export default function DynamicFormRenderer({
  schema,
  initialValues = {},
  onSubmit,
  onCancel,
  readOnly = false,
  title,
  subtitle,
  showHeader = false,
  actions = true,
  className = '',
}) {
  const [formData, setFormData] = useState(() => ({ ...initialValues }))
  const [errors, setErrors] = useState({})
  const [isDirty, setIsDirty] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Active Tab for multi-tab forms
  const hasTabs = Array.isArray(schema?.tabs) && schema.tabs.length > 0
  const [activeTabId, setActiveTabId] = useState(() => schema?.tabs?.[0]?.id || '')

  // Keep activeTabId synchronized if schema tabs reorder or change
  useEffect(() => {
    if (hasTabs && (!activeTabId || !schema.tabs.some(t => t.id === activeTabId))) {
      setActiveTabId(schema.tabs[0]?.id || '')
    }
  }, [schema?.tabs, hasTabs, activeTabId])

  // Sync initialValues when they load asynchronously
  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setFormData(prev => ({ ...prev, ...initialValues }))
    }
  }, [initialValues])

  // Field change handler
  const handleFieldChange = useCallback((fieldId, value) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }))
    setIsDirty(true)
    // Clear error on edit
    setErrors(prev => {
      if (!prev[fieldId]) return prev
      const updated = { ...prev }
      delete updated[fieldId]
      return updated
    })
  }, [])

  // Validation engine
  const validateForm = useCallback(() => {
    const newErrors = {}
    const fields = schema?.fields || []

    fields.forEach(field => {
      // Check conditional visibility
      if (field.condition && typeof field.condition === 'function') {
        if (!field.condition(formData)) return
      }

      const val = formData[field.id]

      // Required validation
      if (field.required) {
        if (val === undefined || val === null || String(val).trim() === '') {
          newErrors[field.id] = `${field.label} is required`
          return
        }
      }

      // Email format validation
      if (field.type === 'email' && val) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(String(val))) {
          newErrors[field.id] = 'Please enter a valid email address'
          return
        }
      }

      // Phone format validation
      if (field.type === 'phone' && val) {
        const phoneClean = String(val).replace(/[^0-9]/g, '')
        if (phoneClean.length < 10) {
          newErrors[field.id] = 'Phone number must have at least 10 digits'
          return
        }
      }

      // Numeric range validation
      if ((field.type === 'number' || field.type === 'currency') && val !== '' && val !== null && val !== undefined) {
        const num = Number(val)
        if (Number.isNaN(num)) {
          newErrors[field.id] = 'Must be a valid numeric value'
          return
        }
        if (field.min !== undefined && num < field.min) {
          newErrors[field.id] = `Minimum allowed value is ${field.min}`
          return
        }
        if (field.max !== undefined && num > field.max) {
          newErrors[field.id] = `Maximum allowed value is ${field.max}`
          return
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [schema, formData])

  // Form submit handler
  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    setSubmitError('')
    setSubmitSuccess(false)

    const isValid = validateForm()
    if (!isValid) {
      // If error is in another tab, switch to the tab containing the first error
      if (hasTabs) {
        const firstErrorField = schema.fields.find(f => errors[f.id])
        if (firstErrorField?.tabId && firstErrorField.tabId !== activeTabId) {
          setActiveTabId(firstErrorField.tabId)
        }
      }
      return
    }

    if (onSubmit) {
      try {
        setSubmitting(true)
        await onSubmit(formData)
        setSubmitSuccess(true)
        setIsDirty(false)
        setTimeout(() => setSubmitSuccess(false), 3000)
      } catch (err) {
        setSubmitError(err.message || 'Failed to submit form.')
      } finally {
        setSubmitting(false)
      }
    }
  }

  // Reset handler
  const handleReset = () => {
    setFormData({ ...initialValues })
    setErrors({})
    setIsDirty(false)
    setSubmitError('')
  }

  // Group fields by active tab or all fields
  const activeFields = useMemo(() => {
    const fields = schema?.fields || []
    if (!hasTabs) return fields
    return fields.filter(f => f.tabId === activeTabId)
  }, [schema, hasTabs, activeTabId])

  // Count errors per tab for badge indicators
  const tabErrorBadges = useMemo(() => {
    if (!hasTabs) return {}
    const counts = {}
    schema.fields.forEach(f => {
      if (f.tabId && errors[f.id]) {
        counts[f.tabId] = (counts[f.tabId] || 0) + 1
      }
    })
    return counts
  }, [schema, hasTabs, errors])

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`} noValidate>
      {/* Header Info (Optional - only when showHeader is explicitly enabled) */}
      {showHeader && (title || subtitle || schema?.title) && (
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div>
            <h2 className="text-sm md:text-base font-extrabold text-slate-900">
              {title || schema.title}
            </h2>
            {(subtitle || schema.subtitle) && (
              <p className="text-xs text-slate-400 mt-0.5">{subtitle || schema.subtitle}</p>
            )}
          </div>
          {isDirty && !readOnly && (
            <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Unsaved changes
            </span>
          )}
        </div>
      )}

      {/* Tabs Navigation (if defined in schema) */}
      {hasTabs && (
        <MetadataTabRenderer
          tabs={schema.tabs}
          activeTabId={activeTabId}
          onTabChange={setActiveTabId}
          badges={tabErrorBadges}
        />
      )}

      {/* Success Notification */}
      {submitSuccess && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>Form saved successfully!</span>
        </div>
      )}

      {/* Error Notification */}
      {submitError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Render Fields in Responsive Grid (Configurable 1 to 6 columns across width) */}
      {(() => {
        const gridColsCount = Number(schema?.gridColumns || schema?.columnsCount || 2)
        const gridClassMap = {
          1: 'grid-cols-1',
          2: 'grid-cols-1 md:grid-cols-2',
          3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
          4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
          5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
          6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
        }
        const activeGridClass = gridClassMap[gridColsCount] || 'grid-cols-1 md:grid-cols-2'

        return (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className={`grid ${activeGridClass} gap-4`}>
              {activeFields.map((field) => {
                // Conditional visibility
                if (field.condition && typeof field.condition === 'function') {
                  if (!field.condition(formData)) return null
                }

                return (
                  <DynamicFieldRenderer
                    key={field.id}
                    field={field}
                    value={formData[field.id]}
                    onChange={handleFieldChange}
                    error={errors[field.id]}
                    disabled={submitting}
                    readOnly={readOnly}
                    gridColumns={gridColsCount}
                  />
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* Bottom Action Buttons (Save, Reset, Cancel) */}
      {actions && !readOnly && (
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            {isDirty && (
              <>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Reset</span>
                </button>
                {!showHeader && !readOnly && (
                  <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    Unsaved changes
                  </span>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer"
              >
                <X size={14} />
                <span>Cancel</span>
              </button>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Save size={14} className={submitting ? 'animate-spin' : ''} />
              <span>{submitting ? 'Saving...' : 'Save & Update'}</span>
            </button>
          </div>
        </div>
      )}
    </form>
  )
}
