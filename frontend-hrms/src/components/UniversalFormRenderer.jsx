import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  User,
  Building2,
  IdCard,
  Laptop,
  Sparkles,
  FolderKanban,
  CreditCard,
  Target,
  LogOut,
  CalendarDays,
  Users,
  ShieldCheck,
  Landmark,
  Sliders,
  Award,
  AlignLeft,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Paperclip,
  Calendar,
  Hash,
  Type,
  ChevronDown,
  ToggleLeft
} from 'lucide-react'
import { getFormSchema } from '../utils/formSchemaStore'

const ICON_MAP = {
  User,
  Building2,
  IdCard,
  Laptop,
  Sparkles,
  FolderKanban,
  CreditCard,
  Target,
  LogOut,
  CalendarDays,
  Users,
  ShieldCheck,
  Landmark,
  Sliders,
  Award,
  AlignLeft
}

export default function UniversalFormRenderer({
  entityType = 'employee',
  companyId = 'default',
  initialValues = {},
  onSubmit,
  onCancel,
  readOnly = false,
  title,
  subtitle,
  canCustomize = true,
  className = ''
}) {
  const [schema, setSchema] = useState(() => getFormSchema(entityType, companyId))
  const [activeTabId, setActiveTabId] = useState(() => schema.tabs?.[0]?.id || '')
  const [formData, setFormData] = useState(() => ({ ...initialValues }))
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submittedSuccess, setSubmittedSuccess] = useState(false)

  // Listen for live updates when schema is saved in FormStudio
  useEffect(() => {
    const handleUpdate = (e) => {
      if (e.detail?.entityType === entityType) {
        const updated = getFormSchema(entityType, companyId)
        setSchema(updated)
        if (!updated.tabs.some(t => t.id === activeTabId)) {
          setActiveTabId(updated.tabs[0]?.id || '')
        }
      }
    }
    window.addEventListener('hrms:form-schema-updated', handleUpdate)
    return () => window.removeEventListener('hrms:form-schema-updated', handleUpdate)
  }, [entityType, companyId, activeTabId])

  // Sync initial values
  useEffect(() => {
    setFormData(prev => ({ ...prev, ...initialValues }))
  }, [initialValues])

  // Make sure activeTab is valid
  useEffect(() => {
    if (schema.tabs?.length > 0 && !schema.tabs.some(t => t.id === activeTabId)) {
      setActiveTabId(schema.tabs[0].id)
    }
  }, [schema, activeTabId])

  const fieldsByTab = useMemo(() => {
    const map = {}
    schema.tabs.forEach(t => { map[t.id] = [] })
    schema.fields.forEach(f => {
      if (map[f.tabId]) {
        map[f.tabId].push(f)
      } else if (schema.tabs[0]) {
        map[schema.tabs[0].id].push(f)
      }
    })
    return map
  }, [schema])

  const handleChange = (fieldId, value) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }))
    if (errors[fieldId]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[fieldId]
        return next
      })
    }
  }

  const validate = () => {
    const newErrors = {}
    schema.fields.forEach(f => {
      if (f.required) {
        const val = formData[f.id]
        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
          newErrors[f.id] = `${f.label} is required`
        }
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) {
      // Find first tab containing error and switch to it
      for (const tab of schema.tabs) {
        const tabFields = fieldsByTab[tab.id] || []
        const hasErr = tabFields.some(f => errors[f.id] || (f.required && !formData[f.id]))
        if (hasErr) {
          setActiveTabId(tab.id)
          break
        }
      }
      return
    }

    setSubmitting(true)
    try {
      if (onSubmit) {
        await onSubmit(formData)
      }
      setSubmittedSuccess(true)
      setTimeout(() => setSubmittedSuccess(false), 4000)
    } catch (err) {
      console.error('Submission failed', err)
    } finally {
      setSubmitting(false)
    }
  }

  const currentTab = schema.tabs.find(t => t.id === activeTabId) || schema.tabs[0]
  const currentFields = fieldsByTab[activeTabId] || []

  return (
    <div className={`space-y-4 antialiased pb-8 ${className}`}>
      {/* Header bar with Customize Shortcut */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {title || schema.title}
            </h2>
            <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-extrabold text-purple-700 border border-purple-200">
              Metadata Driven
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {subtitle || schema.description}
          </p>
        </div>

        {canCustomize && (
          <Link
            to={`/administration/form-studio?entity=${entityType}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-purple-300 bg-purple-50/70 px-3 py-1.5 text-xs font-bold text-purple-800 hover:bg-purple-100 transition shadow-2xs shrink-0"
            title="Open Form Studio to add/move tabs or fields for this page"
          >
            <SlidersHorizontal size={13} className="text-purple-600" />
            <span>Customize Form & Tabs</span>
          </Link>
        )}
      </div>

      {submittedSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>Form saved successfully! All tabbed attributes updated.</span>
        </div>
      )}

      {/* Tabs navigation bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 scrollbar-thin">
        {schema.tabs.map((tab, idx) => {
          const IconComp = ICON_MAP[tab.icon] || User
          const isSelected = tab.id === activeTabId
          const count = (fieldsByTab[tab.id] || []).length
          const tabHasError = (fieldsByTab[tab.id] || []).some(f => errors[f.id])

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTabId(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                isSelected
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-white border border-slate-200/80'
              }`}
            >
              <IconComp size={14} className={isSelected ? 'text-white' : 'text-purple-600'} />
              <span>{tab.title}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                isSelected ? 'bg-purple-800 text-purple-200' : 'bg-slate-100 text-slate-500'
              }`}>
                {count}
              </span>
              {tabHasError && (
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
          )
        })}
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-purple-600" />
              {currentTab?.title}
            </h3>
            <span className="text-[11px] text-slate-400">
              Tab contains {currentFields.length} field{currentFields.length === 1 ? '' : 's'}
            </span>
          </div>

          <span className="text-[11px] text-slate-400">
            Fields marked with <span className="text-rose-500 font-bold">*</span> are required
          </span>
        </div>

        {currentFields.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
            This tab has no fields configured yet. Go to Form Studio to drag or shift fields into this tab.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentFields.map(field => {
              const val = formData[field.id] ?? ''
              const err = errors[field.id]

              // Responsive column span
              const colSpanClass = field.width === 'full'
                ? 'col-span-1 md:col-span-2 lg:col-span-3'
                : field.width === '1/2'
                  ? 'col-span-1 md:col-span-1 lg:col-span-1'
                  : 'col-span-1'

              return (
                <div key={field.id} className={`space-y-1 ${colSpanClass}`}>
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    {field.label}
                    {field.required && <span className="text-rose-500">*</span>}
                  </label>

                  {/* Field input switch based on field.type */}
                  {field.type === 'textarea' ? (
                    <textarea
                      disabled={readOnly || submitting}
                      value={val}
                      rows={3}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                      className={`w-full rounded-xl border px-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 ${
                        err ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20' : 'border-slate-200 focus:border-purple-500 focus:ring-purple-500'
                      }`}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      disabled={readOnly || submitting}
                      value={val}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      className={`w-full rounded-xl border px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 ${
                        err ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20' : 'border-slate-200 focus:border-purple-500 focus:ring-purple-500'
                      }`}
                    >
                      <option value="">{field.placeholder || `-- Select ${field.label} --`}</option>
                      {(field.options || []).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : field.type === 'boolean' ? (
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-2.5">
                      <span className="text-xs text-slate-600 font-medium">{val ? 'Active / Yes' : 'Disabled / No'}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={readOnly || submitting}
                          checked={Boolean(val)}
                          onChange={(e) => handleChange(field.id, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  ) : field.type === 'file' ? (
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 p-2 bg-slate-50/50">
                      <Paperclip size={14} className="text-purple-600 shrink-0" />
                      <input
                        type="file"
                        disabled={readOnly || submitting}
                        onChange={(e) => handleChange(field.id, e.target.files?.[0]?.name || '')}
                        className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                      />
                    </div>
                  ) : (
                    <input
                      type={field.type || 'text'}
                      disabled={readOnly || submitting}
                      value={val}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                      className={`w-full rounded-xl border px-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 ${
                        err ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20' : 'border-slate-200 focus:border-purple-500 focus:ring-purple-500'
                      }`}
                    />
                  )}

                  {err && (
                    <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-0.5">
                      <AlertCircle size={11} /> {err}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Action button footer */}
        {!readOnly && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setFormData({ ...initialValues })
                setErrors({})
              }}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Reset Values</span>
            </button>

            <div className="flex items-center gap-2">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white hover:bg-purple-700 transition shadow-xs cursor-pointer disabled:opacity-60"
              >
                <Save size={14} />
                <span>{submitting ? 'Saving...' : 'Save & Submit Form'}</span>
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
