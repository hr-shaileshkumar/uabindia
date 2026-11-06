import React, { useState, useEffect, useMemo } from 'react'
import {
  Sliders,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  Sparkles,
  Info,
  Layers,
  Settings2
} from 'lucide-react'

// Default enterprise custom fields for Employee Master
const DEFAULT_EMPLOYEE_FIELDS = [
  {
    key: 'uniformSize',
    label: 'Uniform / T-Shirt Size',
    type: 'select',
    options: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
    required: false,
    placeholder: 'Select uniform size',
    category: 'Workplace & Assets'
  },
  {
    key: 'laptopAssetTag',
    label: 'Laptop / Asset Serial No',
    type: 'text',
    required: false,
    placeholder: 'e.g. LAP-DELL-2024-001',
    category: 'Workplace & Assets'
  },
  {
    key: 'workStationNo',
    label: 'Workstation / Desk Number',
    type: 'text',
    required: false,
    placeholder: 'e.g. Floor 2, Bay C-14',
    category: 'Workplace & Assets'
  },
  {
    key: 'medicalInsuranceCardNo',
    label: 'Medical Insurance Card No',
    type: 'text',
    required: false,
    placeholder: 'e.g. MED-778219-X',
    category: 'Statutory & Medical'
  },
  {
    key: 'visaExpiryDate',
    label: 'Visa / Work Permit Expiry',
    type: 'date',
    required: false,
    placeholder: '',
    category: 'Statutory & Medical'
  },
  {
    key: 'prevPfTransferDone',
    label: 'Previous PF Transfer Completed',
    type: 'boolean',
    required: false,
    category: 'Statutory & Medical'
  },
  {
    key: 'specialEmergencyInstructions',
    label: 'Special Medical / Emergency Notes',
    type: 'textarea',
    required: false,
    placeholder: 'Allergies, chronic conditions or emergency instructions...',
    category: 'Emergency & Notes'
  }
]

export default function DynamicCustomFields({
  entityType = 'employee',
  companyId = '',
  values = {},
  onChange,
  readOnly = false,
  className = ''
}) {
  const storageKey = useMemo(() => {
    return `hrms_metadata_fields_${entityType}_${companyId || 'global'}`
  }, [entityType, companyId])

  // Load field definitions from storage or fallback to defaults
  const [fields, setFields] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {}
    return DEFAULT_EMPLOYEE_FIELDS
  })

  // Synchronize when storageKey changes
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFields(parsed)
          return
        }
      }
    } catch {}
    setFields(DEFAULT_EMPLOYEE_FIELDS)
  }, [storageKey])

  const saveFields = (newFields) => {
    setFields(newFields)
    try {
      localStorage.setItem(storageKey, JSON.stringify(newFields))
    } catch (err) {
      console.warn('Failed to persist custom field metadata', err)
    }
  }

  // Manage Schema Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [newField, setNewField] = useState({
    label: '',
    type: 'text',
    optionsText: '',
    category: 'General',
    required: false,
    placeholder: ''
  })
  const [addError, setAddError] = useState('')

  const handleAddField = (e) => {
    e.preventDefault()
    setAddError('')
    const label = newField.label.trim()
    if (!label) {
      setAddError('Field label is required')
      return
    }

    // Auto-generate key
    const baseKey = label
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .split(' ')
      .map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join('')

    if (fields.some(f => f.key.toLowerCase() === baseKey.toLowerCase())) {
      setAddError('A field with this name already exists')
      return
    }

    let parsedOptions = []
    if (newField.type === 'select') {
      parsedOptions = newField.optionsText
        .split(',')
        .map(o => o.trim())
        .filter(Boolean)
      if (parsedOptions.length === 0) {
        setAddError('Please enter at least one comma-separated option for dropdown')
        return
      }
    }

    const fieldDef = {
      key: baseKey || `field_${Date.now()}`,
      label,
      type: newField.type,
      options: parsedOptions,
      category: newField.category.trim() || 'General',
      required: Boolean(newField.required),
      placeholder: newField.placeholder.trim()
    }

    const updated = [...fields, fieldDef]
    saveFields(updated)
    setNewField({
      label: '',
      type: 'text',
      optionsText: '',
      category: 'General',
      required: false,
      placeholder: ''
    })
    setModalOpen(false)
  }

  const handleDeleteField = (keyToDelete) => {
    if (window.confirm(`Are you sure you want to remove this custom attribute? Existing data won't be deleted, but the field will no longer be shown.`)) {
      const updated = fields.filter(f => f.key !== keyToDelete)
      saveFields(updated)
    }
  }

  const handleResetDefaults = () => {
    if (window.confirm('Reset to standard enterprise custom fields?')) {
      saveFields(DEFAULT_EMPLOYEE_FIELDS)
    }
  }

  // Group fields by category
  const categories = useMemo(() => {
    const cats = {}
    fields.forEach(field => {
      const cat = field.category || 'General'
      if (!cats[cat]) cats[cat] = []
      cats[cat].push(field)
    })
    return cats
  }, [fields])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header bar for metadata section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 rounded-xl border border-purple-200/70 bg-gradient-to-r from-purple-50/70 via-indigo-50/40 to-white p-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white shadow-2xs shrink-0">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900 tracking-tight">
                Dynamic Custom Attributes (Metadata Driven)
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100/80 px-2 py-0.5 text-[10px] font-bold text-purple-800 border border-purple-200">
                <Layers size={10} />
                {fields.length} Fields Configured
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Tenant-specific user defined fields (UDF). Configurable on-the-fly without changing application code.
            </p>
          </div>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-purple-300 bg-white px-2.5 py-1 text-xs font-bold text-purple-700 hover:bg-purple-50 transition shadow-2xs cursor-pointer"
            >
              <Settings2 size={13} />
              <span>Configure Fields</span>
            </button>
          </div>
        )}
      </div>

      {/* Dynamic Fields Grid grouped by Category */}
      {Object.entries(categories).map(([categoryName, catFields]) => (
        <div key={categoryName} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
              {categoryName}
            </h4>
            <span className="text-[11px] font-semibold text-slate-400">
              {catFields.length} {catFields.length === 1 ? 'attribute' : 'attributes'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {catFields.map(field => {
              const val = values[field.key] ?? ''

              if (field.type === 'boolean') {
                return (
                  <div key={field.key} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-2.5">
                    <div>
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1 cursor-pointer">
                        {field.label}
                        {field.required && <span className="text-rose-500">*</span>}
                      </label>
                      <span className="text-[10px] text-slate-400">Dynamic Boolean Flag</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        id={`custom-flag-${field.key}`}
                        name={field.key}
                        type="checkbox"
                        disabled={readOnly}
                        checked={Boolean(val)}
                        onChange={(e) => onChange && onChange(field.key, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                )
              }

              if (field.type === 'textarea') {
                return (
                  <div key={field.key} className="col-span-1 sm:col-span-2 lg:col-span-3 space-y-1">
                    <label htmlFor={`custom-textarea-${field.key}`} className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      {field.label}
                      {field.required && <span className="text-rose-500">*</span>}
                    </label>
                    <textarea
                      id={`custom-textarea-${field.key}`}
                      name={field.key}
                      disabled={readOnly}
                      value={val}
                      rows={2}
                      onChange={(e) => onChange && onChange(field.key, e.target.value)}
                      placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                )
              }

              if (field.type === 'select') {
                return (
                  <div key={field.key} className="space-y-1">
                    <label htmlFor={`custom-select-${field.key}`} className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      {field.label}
                      {field.required && <span className="text-rose-500">*</span>}
                    </label>
                    <select
                      id={`custom-select-${field.key}`}
                      name={field.key}
                      disabled={readOnly}
                      value={val}
                      onChange={(e) => onChange && onChange(field.key, e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:bg-slate-50 disabled:text-slate-500"
                    >
                      <option value="">{field.placeholder || `-- Select ${field.label} --`}</option>
                      {(field.options || []).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                )
              }

              return (
                <div key={field.key} className="space-y-1">
                  <label htmlFor={`custom-input-${field.key}`} className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    {field.label}
                    {field.required && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    id={`custom-input-${field.key}`}
                    name={field.key}
                    type={field.type || 'text'}
                    disabled={readOnly}
                    value={val}
                    onChange={(e) => onChange && onChange(field.key, e.target.value)}
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Schema / Field Manager Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                  <Sliders size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Custom Attributes Schema</h3>
                  <p className="text-[11px] text-slate-500">Add or manage dynamic fields for this organization</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* List of current fields with delete option */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Custom Fields</span>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="text-[11px] text-purple-700 hover:underline font-semibold"
                >
                  Reset Defaults
                </button>
              </div>

              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50/40 p-2">
                {fields.map(f => (
                  <div key={f.key} className="flex items-center justify-between py-1.5 px-2 text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{f.label}</span>
                      <span className="ml-2 font-mono text-[10px] text-purple-600">({f.type})</span>
                      <span className="ml-1 text-[10px] text-slate-400">• {f.category}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteField(f.key)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition"
                      title="Delete field"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add New Field Form */}
            <form onSubmit={handleAddField} className="border-t border-slate-100 pt-3 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                <Plus size={12} className="text-purple-600" /> Add New Custom Attribute
              </span>

              {addError && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 p-2 text-xs text-rose-700 font-medium">
                  {addError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div className="col-span-2 space-y-1">
                  <label htmlFor="new-field-label" className="text-xs font-semibold text-slate-700">Attribute Label *</label>
                  <input
                    id="new-field-label"
                    name="newFieldLabel"
                    type="text"
                    required
                    placeholder="e.g. Covid Vaccination Dose 2"
                    value={newField.label}
                    onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="new-field-type" className="text-xs font-semibold text-slate-700">Data Type</label>
                  <select
                    id="new-field-type"
                    name="newFieldType"
                    value={newField.type}
                    onChange={(e) => setNewField({ ...newField, type: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="text">Single Line Text</option>
                    <option value="number">Numeric</option>
                    <option value="date">Date Picker</option>
                    <option value="select">Dropdown Select</option>
                    <option value="boolean">Yes / No Switch</option>
                    <option value="textarea">Multi-line Textarea</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="new-field-category" className="text-xs font-semibold text-slate-700">Category Group</label>
                  <input
                    id="new-field-category"
                    name="newFieldCategory"
                    type="text"
                    placeholder="e.g. Health & Safety"
                    value={newField.category}
                    onChange={(e) => setNewField({ ...newField, category: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                {newField.type === 'select' && (
                  <div className="col-span-2 space-y-1">
                    <label htmlFor="new-field-options" className="text-xs font-semibold text-slate-700">Dropdown Options (Comma-separated) *</label>
                    <input
                      id="new-field-options"
                      name="newFieldOptions"
                      type="text"
                      placeholder="e.g. Covishield, Covaxin, Sputnik, Other"
                      value={newField.optionsText}
                      onChange={(e) => setNewField({ ...newField, optionsText: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-purple-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-purple-700 transition shadow-2xs"
                >
                  Save Attribute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
