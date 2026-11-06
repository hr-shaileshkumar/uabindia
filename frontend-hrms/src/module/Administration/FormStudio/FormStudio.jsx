import React, { useState, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutTemplate,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  ArrowRightLeft,
  Settings,
  Eye,
  Save,
  RotateCcw,
  Sparkles,
  Download,
  Upload,
  CheckCircle2,
  X,
  Type,
  Hash,
  Calendar,
  ChevronDown,
  ToggleLeft,
  AlignLeft,
  Paperclip,
  FolderKanban,
  UserCheck,
  Building2,
  LogOut,
  CalendarDays,
  Target,
  User,
  ShieldCheck,
  Laptop,
  CreditCard,
  IdCard,
  Landmark,
  Sliders,
  Award,
  Users,
  Table,
  Check,
  ArrowUpDown,
  Edit3,
} from 'lucide-react'
import TabSequenceModal from '../../../components/TabSequenceModal'
import PageHeader from '../../../components/PageHeader'
import DynamicFormRenderer from '../../../engine/renderers/DynamicFormRenderer'
import DynamicTableRenderer from '../../../engine/renderers/DynamicTableRenderer'
import {
  ENTITY_TYPES,
  FIELD_TYPES,
  getFormSchema,
  saveFormSchema,
  resetFormSchema,
} from '../../../utils/formSchemaStore'
import {
  getMetadataSchema,
  publishSchema,
  saveDraftSchema,
  resetMetadataSchema,
} from '../../../engine/metadataStore'

const AVAILABLE_ICONS = [
  'User', 'Building2', 'IdCard', 'Laptop', 'Sparkles', 'FolderKanban',
  'CreditCard', 'Target', 'LogOut', 'CalendarDays', 'Users', 'ShieldCheck',
  'Landmark', 'Sliders', 'Award', 'AlignLeft'
]

const COLUMN_FORMAT_OPTIONS = [
  { value: 'text', label: 'Standard Text' },
  { value: 'avatar', label: 'Avatar & Employee Name' },
  { value: 'badge', label: 'Status Badge (Color-Coded)' },
  { value: 'date', label: 'Formatted Date' },
  { value: 'currency', label: 'Currency (INR ₹)' },
  { value: 'boolean', label: 'Yes/No Checkmark' },
  { value: 'actions', label: 'Row Action Buttons' },
]

export default function FormStudio() {
  const location = useLocation()
  const navigate = useNavigate()
  const queryParam = new URLSearchParams(location.search).get('entity')

  const [selectedEntity, setSelectedEntity] = useState(queryParam || 'employee')
  const isTableEntity = selectedEntity.includes('directory')

  // Load appropriate schema based on entity
  const [schema, setSchema] = useState(() => {
    if (selectedEntity.includes('directory')) {
      return getMetadataSchema(selectedEntity) || getMetadataSchema('employee_directory')
    }
    return getFormSchema(selectedEntity)
  })

  const [activeTabId, setActiveTabId] = useState(() => schema?.tabs?.[0]?.id || '')
  const [selectedFieldId, setSelectedFieldId] = useState(null)
  const [selectedColKey, setSelectedColKey] = useState(null)
  const [mode, setMode] = useState('design') // 'design' | 'preview' | 'json'
  const [toastMessage, setToastMessage] = useState('')
  const [addTabModalOpen, setAddTabModalOpen] = useState(false)
  const [newTabTitle, setNewTabTitle] = useState('')
  const [newTabIcon, setNewTabIcon] = useState('User')
  const [tabSequenceModalOpen, setTabSequenceModalOpen] = useState(false)
  const [addColModalOpen, setAddColModalOpen] = useState(false)
  const [newColKey, setNewColKey] = useState('')
  const [newColLabel, setNewColLabel] = useState('')
  const [newColFormat, setNewColFormat] = useState('text')
  const [addFieldModalOpen, setAddFieldModalOpen] = useState(false)
  const [newFieldType, setNewFieldType] = useState('text')
  const [newFieldLabel, setNewFieldLabel] = useState('')
  const [newFieldKey, setNewFieldKey] = useState('')
  const [newFieldRequired, setNewFieldRequired] = useState(false)
  const [newFieldWidth, setNewFieldWidth] = useState('1/2')
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState('')
  const [jsonInput, setJsonInput] = useState('')
  const [jsonModalOpen, setJsonModalOpen] = useState(false)

  // Update schema when selectedEntity changes
  useEffect(() => {
    let loaded = null
    if (selectedEntity.includes('directory')) {
      loaded = getMetadataSchema(selectedEntity) || getMetadataSchema('employee_directory')
    } else {
      loaded = getFormSchema(selectedEntity)
    }
    setSchema(loaded)
    setActiveTabId(loaded?.tabs?.[0]?.id || '')
    setSelectedFieldId(null)
    setSelectedColKey(null)
  }, [selectedEntity])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3500)
  }

  // Active Tab object
  const currentTab = useMemo(() => {
    if (!schema?.tabs) return null
    return schema.tabs.find(t => t.id === activeTabId) || schema.tabs[0]
  }, [schema, activeTabId])

  // Fields inside active tab
  const activeTabFields = useMemo(() => {
    if (!schema?.fields) return []
    return schema.fields.filter(f => f.tabId === activeTabId)
  }, [schema, activeTabId])

  // Selected field for Right Inspector
  const selectedField = useMemo(() => {
    if (!schema?.fields) return null
    return schema.fields.find(f => f.id === selectedFieldId) || null
  }, [schema, selectedFieldId])

  // Selected column for Table Column Inspector
  const selectedCol = useMemo(() => {
    if (!schema?.columns) return null
    return schema.columns.find(c => (c.key || c.id) === selectedColKey) || null
  }, [schema, selectedColKey])

  // ==========================================
  // TAB OPERATIONS (ADD, MOVE, DELETE, RENAME)
  // ==========================================
  const handleAddTab = (e) => {
    e.preventDefault()
    if (!newTabTitle.trim()) return

    const newId = `tab_${newTabTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`
    const updatedTabs = [
      ...schema.tabs,
      {
        id: newId,
        title: newTabTitle.trim(),
        label: newTabTitle.trim(),
        icon: newTabIcon || 'User',
      },
    ]
    setSchema({ ...schema, tabs: updatedTabs })
    setActiveTabId(newId)
    setNewTabTitle('')
    setAddTabModalOpen(false)
    showToast(`Tab "${newTabTitle}" created!`)
  }

  const handleDeleteTab = (tabId) => {
    if (schema.tabs.length <= 1) {
      alert('A form must have at least one active tab.')
      return
    }

    const fieldsInTab = schema.fields.filter(f => f.tabId === tabId)
    const confirmed = window.confirm(
      fieldsInTab.length > 0
        ? `This tab contains ${fieldsInTab.length} fields. Deleting it will also delete its fields. Continue?`
        : 'Are you sure you want to delete this tab?'
    )

    if (confirmed) {
      const remainingTabs = schema.tabs.filter(t => t.id !== tabId)
      const remainingFields = schema.fields.filter(f => f.tabId !== tabId)
      setSchema({ ...schema, tabs: remainingTabs, fields: remainingFields })
      setActiveTabId(remainingTabs[0].id)
      setSelectedFieldId(null)
      showToast('Tab deleted.')
    }
  }

  const handleMoveTab = (idx, direction) => {
    const targetIdx = idx + direction
    if (targetIdx < 0 || targetIdx >= schema.tabs.length) return

    const updated = [...schema.tabs]
    const temp = updated[idx]
    updated[idx] = updated[targetIdx]
    updated[targetIdx] = temp

    setSchema({ ...schema, tabs: updated })
  }

  // ==========================================
  // FIELD OPERATIONS (ADD, MOVE, REORDER)
  // ==========================================
  const handleAddField = (fieldTypeId) => {
    if (!activeTabId) return

    const fieldMeta = FIELD_TYPES.find(f => f.id === fieldTypeId)
    const uniqueNum = Date.now().toString().slice(-4)
    const newField = {
      id: `custom_${fieldTypeId}_${uniqueNum}`,
      tabId: activeTabId,
      label: `New ${fieldMeta?.label || 'Field'}`,
      type: fieldTypeId,
      required: false,
      width: '1/2',
      placeholder: `Enter ${fieldMeta?.label || 'value'}`,
      options: fieldTypeId === 'select' ? ['Option 1', 'Option 2', 'Option 3'] : undefined,
    }

    setSchema(prev => ({
      ...prev,
      fields: [...prev.fields, newField],
    }))
    setSelectedFieldId(newField.id)
    showToast(`Added "${newField.label}" to ${currentTab?.title || 'active tab'}.`)
  }

  const handleCreateFieldFromModal = (e) => {
    e.preventDefault()
    if (!activeTabId) return

    const fieldMeta = FIELD_TYPES.find(f => f.id === newFieldType)
    const label = newFieldLabel.trim() || `New ${fieldMeta?.label || 'Field'}`
    const key = newFieldKey.trim()
      ? newFieldKey.trim().replace(/[^a-zA-Z0-9_]/g, '_')
      : `custom_${newFieldType}_${Date.now().toString().slice(-4)}`

    const newField = {
      id: key,
      tabId: activeTabId,
      label,
      type: newFieldType,
      required: newFieldRequired,
      width: newFieldWidth || '1/2',
      placeholder: newFieldPlaceholder.trim() || `Enter ${label}`,
      options: newFieldType === 'select' ? ['Option 1', 'Option 2', 'Option 3'] : undefined,
    }

    setSchema(prev => ({
      ...prev,
      fields: [...prev.fields, newField],
    }))
    setSelectedFieldId(newField.id)
    setAddFieldModalOpen(false)
    showToast(`Added field "${newField.label}" to ${currentTab?.title || 'active tab'}!`)
  }

  const handleDeleteField = (fieldId) => {
    const updated = schema.fields.filter(f => f.id !== fieldId)
    setSchema({ ...schema, fields: updated })
    if (selectedFieldId === fieldId) setSelectedFieldId(null)
    showToast('Field deleted.')
  }

  const handleMoveFieldInTab = (fieldId, direction) => {
    const tabFields = schema.fields.filter(f => f.tabId === activeTabId)
    const currentIdx = tabFields.findIndex(f => f.id === fieldId)
    const targetIdx = currentIdx + direction
    if (targetIdx < 0 || targetIdx >= tabFields.length) return

    const swapped = [...tabFields]
    const temp = swapped[currentIdx]
    swapped[currentIdx] = swapped[targetIdx]
    swapped[targetIdx] = temp

    const otherFields = schema.fields.filter(f => f.tabId !== activeTabId)
    setSchema({ ...schema, fields: [...otherFields, ...swapped] })
  }

  const handleShiftFieldToTab = (fieldId, targetTabId) => {
    const updated = schema.fields.map(f => {
      if (f.id === fieldId) {
        return { ...f, tabId: targetTabId }
      }
      return f
    })
    setSchema({ ...schema, fields: updated })
    const targetTab = schema.tabs.find(t => t.id === targetTabId)
    showToast(`Field moved to "${targetTab?.title || targetTabId}".`)
  }

  const handleUpdateSelectedField = (updates) => {
    const updated = schema.fields.map(f => {
      if (f.id === selectedFieldId) {
        return { ...f, ...updates }
      }
      return f
    })
    setSchema({ ...schema, fields: updated })
  }

  // ==========================================
  // TABLE COLUMN OPERATIONS (ADD, MOVE, DELETE)
  // ==========================================
  const handleAddColumn = (e) => {
    e.preventDefault()
    if (!newColKey.trim() || !newColLabel.trim()) return

    const newCol = {
      key: newColKey.trim(),
      label: newColLabel.trim(),
      format: newColFormat,
      sortable: true,
    }

    const updatedCols = [...(schema.columns || []), newCol]
    setSchema({ ...schema, columns: updatedCols })
    setAddColModalOpen(false)
    setNewColKey('')
    setNewColLabel('')
    setSelectedColKey(newCol.key)
    showToast(`Column "${newCol.label}" added to table!`)
  }

  const handleDeleteColumn = (colKey) => {
    const updated = (schema.columns || []).filter(c => (c.key || c.id) !== colKey)
    setSchema({ ...schema, columns: updated })
    if (selectedColKey === colKey) setSelectedColKey(null)
    showToast('Column removed from table.')
  }

  const handleMoveColumn = (idx, direction) => {
    const targetIdx = idx + direction
    const cols = [...(schema.columns || [])]
    if (targetIdx < 0 || targetIdx >= cols.length) return

    const temp = cols[idx]
    cols[idx] = cols[targetIdx]
    cols[targetIdx] = temp
    setSchema({ ...schema, columns: cols })
  }

  const handleUpdateSelectedColumn = (updates) => {
    const updated = (schema.columns || []).map(c => {
      if ((c.key || c.id) === selectedColKey) {
        return { ...c, ...updates }
      }
      return c
    })
    setSchema({ ...schema, columns: updated })
  }

  // ==========================================
  // SAVE, PUBLISH, RESET, JSON EXPORT/IMPORT
  // ==========================================
  const [isSaving, setIsSaving] = useState(false)

  const handleSaveAndPublish = async () => {
    setIsSaving(true)
    try {
      if (isTableEntity) {
        saveDraftSchema(selectedEntity, schema)
        const res = await publishSchema(selectedEntity)
        if (res.success) {
          showToast(`Table columns for "${selectedEntity}" published to database for all users!`)
        } else {
          showToast(res.errors?.[0] || 'Publish failed', 'error')
        }
      } else {
        const ok = await saveFormSchema(selectedEntity, schema)
        if (ok) {
          showToast(`Form fields for "${selectedEntity}" published to database for all users!`)
        } else {
          showToast('Failed to publish form schema', 'error')
        }
      }
    } catch (err) {
      showToast(`Error publishing schema: ${err.message}`, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (window.confirm('Reset this configuration back to factory enterprise defaults?')) {
      if (isTableEntity) {
        resetMetadataSchema(selectedEntity)
        const def = getMetadataSchema(selectedEntity)
        setSchema(def)
      } else {
        const def = resetFormSchema(selectedEntity)
        setSchema(def)
        setActiveTabId(def.tabs[0]?.id || '')
      }
      setSelectedFieldId(null)
      setSelectedColKey(null)
      showToast('Configuration reset to defaults.')
    }
  }

  const handleExportJSON = () => {
    const json = JSON.stringify(schema, null, 2)
    navigator.clipboard.writeText(json)
    showToast('Schema JSON copied to clipboard!')
  }

  const handleImportJSON = () => {
    try {
      const parsed = JSON.parse(jsonInput)
      setSchema(parsed)
      if (parsed.tabs?.[0]) setActiveTabId(parsed.tabs[0].id)
      setJsonModalOpen(false)
      setJsonInput('')
      showToast('Schema imported successfully!')
    } catch {
      alert('Invalid JSON syntax.')
    }
  }

  // Sample data for Table Preview
  const sampleTableData = [
    { id: '1', name: 'Ramesh Kumar', code: 'CMP-1962-0001', companyName: 'Uabindia Corporate', projectName: 'Mobile Veterinary Clinic', department: 'Technology', designation: 'Senior Engineer', mobile: '+91 98765 43210', email: 'ramesh@company.com', status: 'Active' },
    { id: '2', name: 'Dr. Priya Sharma', code: 'CMP-1962-0002', companyName: 'Uabindia Enterprise', projectName: 'State Diagnostic Hub', department: 'Operations', designation: 'Medical Officer', mobile: '+91 98765 43211', email: 'priya@company.com', status: 'Active' },
    { id: '3', name: 'Amit Verma', code: 'CMP-1962-0003', companyName: 'Uabindia Corporate', projectName: 'Mobile Veterinary Clinic', department: 'Field Operations', designation: 'Station Lead', mobile: '+91 98765 43212', email: 'amit@company.com', status: 'Hold' },
  ]

  return (
    <div className="space-y-4 antialiased pb-12 w-full select-none">
      {/* Studio Header */}
      <PageHeader
        icon={LayoutTemplate}
        title="Visual Form & Metadata Studio"
        badge="Unified Architecture Configurator"
        badgeTone="purple"
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* Entity Selector Switcher */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Schema:</span>
            <select
              value={selectedEntity}
              onChange={(e) => {
                setSelectedEntity(e.target.value)
                navigate(`/administration/form-studio?entity=${e.target.value}`)
              }}
              className="text-xs font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
            >
              {ENTITY_TYPES.map(e => (
                <option key={e.id} value={e.id}>{e.label}</option>
              ))}
            </select>
          </div>

          {/* Mode Switcher: Design | Preview | JSON */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-0.5 text-xs font-bold shadow-2xs">
            <button
              type="button"
              onClick={() => setMode('design')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                mode === 'design' ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Design Canvas
            </button>
            <button
              type="button"
              onClick={() => setMode('preview')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                mode === 'preview' ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Live Preview
            </button>
          </div>

          {/* Quick Actions */}
          <button
            type="button"
            onClick={handleExportJSON}
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer"
            title="Copy JSON"
          >
            <Download size={13} />
            <span className="hidden sm:inline">JSON</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50/60 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 shadow-2xs cursor-pointer"
            title="Reset to Factory Defaults"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveAndPublish}
            className={`flex items-center gap-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white px-3.5 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer ${
              isSaving ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            <Save size={13} className={isSaving ? 'animate-spin' : ''} />
            <span>{isSaving ? 'Publishing to DB...' : 'Publish Changes'}</span>
          </button>
        </div>
      </PageHeader>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-purple-900 px-4 py-2.5 text-xs font-bold text-white shadow-lg animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* PREVIEW MODE                                              */}
      {/* ========================================================= */}
      {mode === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-purple-50 border border-purple-200 px-4 py-2.5 rounded-xl text-xs font-semibold text-purple-900">
            <span>Live Interactive Preview — Testing exact runtime rendering</span>
            <button
              type="button"
              onClick={() => setMode('design')}
              className="text-xs text-purple-700 font-bold hover:underline cursor-pointer"
            >
              Return to Canvas
            </button>
          </div>

          {isTableEntity ? (
            <DynamicTableRenderer
              schema={schema}
              data={sampleTableData}
              loading={false}
              onRefresh={() => {}}
            />
          ) : (
            <DynamicFormRenderer
              schema={schema}
              initialValues={{}}
              onSubmit={(vals) => {
                alert(`Form Validated!\n\n${JSON.stringify(vals, null, 2)}`)
              }}
              onCancel={() => setMode('design')}
            />
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* DESIGN MODE FOR TABLE COLUMNS                             */}
      {/* ========================================================= */}
      {mode === 'design' && isTableEntity && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Center Table Columns Canvas */}
          <div className="lg:col-span-8 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Table size={14} className="text-purple-600" />
                    Table Columns Architecture ({schema.columns?.length || 0} Columns)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Reorder columns or click to inspect and modify cell formatting
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setAddColModalOpen(true)}
                  className="inline-flex items-center gap-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 text-xs font-bold hover:bg-purple-100 transition shadow-2xs cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Add Column</span>
                </button>
              </div>

              {/* Columns List */}
              <div className="space-y-2">
                {(schema.columns || []).map((col, cIdx) => {
                  const colKey = col.key || col.id
                  const isSelected = selectedColKey === colKey
                  return (
                    <div
                      key={colKey || cIdx}
                      onClick={() => setSelectedColKey(colKey)}
                      className={`group rounded-xl border p-3 transition cursor-pointer ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50/40 ring-1 ring-purple-600/30 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            #{cIdx + 1}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                              <span>{col.label}</span>
                              <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200 uppercase">
                                {col.format || 'text'}
                              </span>
                              {col.sortable && (
                                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">
                                  Sortable
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400">
                              Data Key: {colKey}
                            </div>
                          </div>
                        </div>

                        {/* Reorder and Delete Controls */}
                        <div className="flex items-center gap-1">
                          {cIdx > 0 && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleMoveColumn(cIdx, -1) }}
                              className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                              title="Move Left / Up"
                            >
                              <MoveUp size={13} />
                            </button>
                          )}
                          {cIdx < (schema.columns?.length || 0) - 1 && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleMoveColumn(cIdx, 1) }}
                              className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                              title="Move Right / Down"
                            >
                              <MoveDown size={13} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDeleteColumn(colKey) }}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Delete Column"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Column Property Inspector */}
          <div className="lg:col-span-4 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3 sticky top-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Settings size={14} className="text-purple-600" />
                  Column Inspector
                </h3>
                <p className="text-[11px] text-slate-400">
                  {selectedCol ? `Editing "${selectedCol.label}"` : 'Select a column to edit its settings'}
                </p>
              </div>

              {selectedCol ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700">Display Header Label</label>
                    <input
                      type="text"
                      value={selectedCol.label || ''}
                      onChange={(e) => handleUpdateSelectedColumn({ label: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-1.5 font-semibold text-slate-800 outline-none focus:border-purple-600"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700">Cell Formatter</label>
                    <select
                      value={selectedCol.format || 'text'}
                      onChange={(e) => handleUpdateSelectedColumn({ format: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-1.5 font-semibold text-slate-800 outline-none focus:border-purple-600 cursor-pointer"
                    >
                      {COLUMN_FORMAT_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="col_sortable"
                      checked={!!selectedCol.sortable}
                      onChange={(e) => handleUpdateSelectedColumn({ sortable: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <label htmlFor="col_sortable" className="font-bold text-slate-700 cursor-pointer">
                      Enable Column Sorting (Asc/Desc)
                    </label>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Click on any column card on the left to inspect and configure.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DESIGN MODE FOR FORMS (TABS & FIELDS)                     */}
      {/* ========================================================= */}
      {mode === 'design' && !isTableEntity && schema?.tabs && (
        <div className="space-y-4">
          {/* TABS MANAGEMENT TOOLBAR */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-purple-600" />
                  Tabs Architecture ({schema.tabs.length} Tabs Configured)
                </span>
                <span className="text-[11px] text-slate-400">
                  Click tab to view/add its fields • Reorder or shift tabs
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setTabSequenceModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1 text-xs font-bold hover:bg-purple-100 transition shadow-2xs cursor-pointer"
                  title="Rename tabs and set 1, 2, 3 sequence"
                >
                  <Sliders size={13} />
                  <span>Sort & Rename Tabs (1, 2, 3)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAddTabModalOpen(true)}
                  className="inline-flex items-center gap-1 rounded-xl bg-purple-700 text-white px-3 py-1 text-xs font-bold hover:bg-purple-800 transition shadow-2xs cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Add New Tab</span>
                </button>
              </div>
            </div>

            {/* Draggable / Clickable Tab Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {schema.tabs.map((tab, idx) => {
                const isSelected = tab.id === activeTabId
                const fieldCount = (schema.fields || []).filter(f => f.tabId === tab.id).length

                return (
                  <div
                    key={tab.id}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs transition cursor-pointer select-none ${
                      isSelected
                        ? 'bg-purple-900 text-white border-purple-950 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span
                      onClick={() => {
                        setActiveTabId(tab.id)
                        setSelectedFieldId(null)
                      }}
                      className="font-bold flex items-center gap-1.5"
                    >
                      <span>{tab.title || tab.label}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-purple-800 text-purple-200' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {fieldCount}
                      </span>
                    </span>

                    {/* Reorder, Rename and Delete controls */}
                    <div className="flex items-center gap-0.5 ml-1 pl-1 border-l border-current/20">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setTabSequenceModalOpen(true)
                        }}
                        className={`p-0.5 hover:opacity-100 transition ${
                          isSelected ? 'text-purple-200 hover:text-white' : 'text-slate-400 hover:text-purple-700'
                        }`}
                        title="Rename Tab & Set 1, 2, 3 Sequence"
                      >
                        <Edit3 size={11} />
                      </button>
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleMoveTab(idx, -1) }}
                          className="p-0.5 hover:opacity-80"
                          title="Move Tab Left"
                        >
                          <MoveUp size={11} className="-rotate-90" />
                        </button>
                      )}
                      {idx < schema.tabs.length - 1 && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleMoveTab(idx, 1) }}
                          className="p-0.5 hover:opacity-80"
                          title="Move Tab Right"
                        >
                          <MoveDown size={11} className="-rotate-90" />
                        </button>
                      )}
                      {schema.tabs.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleDeleteTab(tab.id) }}
                          className="p-0.5 hover:text-rose-400 text-slate-400 ml-0.5"
                          title="Delete Tab"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 3-COLUMN STUDIO LAYOUT: PALETTE | CANVAS | INSPECTOR */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* COLUMN 1: LEFT FIELD PALETTE */}
            <div className="lg:col-span-3 space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-3">
                <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Plus size={14} className="text-purple-600" />
                      Field Palette
                    </h3>
                    <p className="text-[11px] text-slate-400">Click any type to instantly add</p>
                  </div>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 rounded-md px-1.5 py-0.5">
                    1-Click Add
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-1.5">
                  {FIELD_TYPES.map(ft => (
                    <button
                      key={ft.id}
                      type="button"
                      onClick={() => handleAddField(ft.id)}
                      className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 p-2 text-left hover:border-purple-300 hover:bg-purple-50/70 hover:text-purple-900 transition group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 group-hover:text-purple-600 group-hover:border-purple-200 shadow-2xs">
                          <Plus size={12} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 group-hover:text-purple-900">{ft.label}</div>
                          <div className="text-[10px] text-slate-400 leading-tight">{ft.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* COLUMN 2: CENTER ACTIVE TAB CANVAS */}
            <div className="lg:col-span-6 space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-purple-600" />
                      Tab Canvas: {currentTab?.title || currentTab?.label}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {activeTabFields.length} fields in this tab • Click &quot;+ Add Field&quot; or pick from left Palette
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Screen Width Form Grid Density Selector (1 to 6 Columns) */}
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Grid:</span>
                      {[1, 2, 3, 4, 5, 6].map((cols) => {
                        const activeCols = Number(schema?.gridColumns || schema?.columnsCount || 2)
                        return (
                          <button
                            key={cols}
                            type="button"
                            onClick={() => setSchema(prev => ({ ...prev, gridColumns: cols, columnsCount: cols }))}
                            className={`px-1.5 py-0.5 text-[11px] font-mono font-bold rounded-md transition border cursor-pointer ${
                              activeCols === cols
                                ? 'bg-purple-700 text-white border-purple-800 shadow-2xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-purple-50 hover:text-purple-700'
                            }`}
                            title={`Set form width to ${cols} column${cols > 1 ? 's' : ''}`}
                          >
                            {cols}
                          </button>
                        )
                      })}
                    </div>

                    <button
                      type="button"
                      id="btn-add-field-canvas"
                      onClick={() => {
                        setNewFieldType('text')
                        setNewFieldLabel('')
                        setNewFieldKey('')
                        setNewFieldRequired(false)
                        setNewFieldWidth('1/2')
                        setNewFieldPlaceholder('')
                        setAddFieldModalOpen(true)
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                    >
                      <Plus size={14} />
                      <span>Add Field</span>
                    </button>
                    <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-1 rounded-lg font-bold border border-purple-200">
                      {currentTab?.id}
                    </span>
                  </div>
                </div>

                {activeTabFields.length === 0 ? (
                  <div className="py-14 text-center border-2 border-dashed border-slate-200 rounded-2xl p-6 space-y-3">
                    <div className="h-10 w-10 mx-auto rounded-full bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg border border-purple-200">
                      <Plus size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">This tab is currently empty</p>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-0.5">
                        Click the button below or choose any field from the left Palette to add fields to &ldquo;{currentTab?.title || currentTab?.label}&rdquo;.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setNewFieldType('text')
                        setNewFieldLabel('')
                        setNewFieldKey('')
                        setNewFieldRequired(false)
                        setNewFieldWidth('1/2')
                        setNewFieldPlaceholder('')
                        setAddFieldModalOpen(true)
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                    >
                      <Plus size={14} />
                      <span>Add Field to Tab</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeTabFields.map((field, fIdx) => {
                      const isFieldSelected = field.id === selectedFieldId

                      return (
                        <div
                          key={field.id}
                          onClick={() => setSelectedFieldId(field.id)}
                          className={`group rounded-xl border p-3 transition cursor-pointer ${
                            isFieldSelected
                              ? 'border-purple-600 bg-purple-50/40 ring-1 ring-purple-600/30 shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1 rounded">
                                #{fIdx + 1}
                              </span>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
                                  <span>{field.label}</span>
                                  {field.required && (
                                    <span className="text-rose-500 font-extrabold text-[11px]">*</span>
                                  )}
                                  <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                                    {field.type}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    ({field.width || '1/2'})
                                  </span>
                                </div>
                                <div className="text-[10px] font-mono text-slate-400 truncate">
                                  Key: {field.id}
                                </div>
                              </div>
                            </div>

                            {/* FIELD ACTION TOOLBAR: REORDER, SHIFT TAB, DELETE */}
                            <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                              {/* Move to another Tab selector */}
                              <select
                                value={field.tabId}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => handleShiftFieldToTab(field.id, e.target.value)}
                                className="text-[10px] rounded-lg border border-slate-200 bg-slate-50 px-1.5 py-1 text-slate-700 focus:outline-none cursor-pointer"
                                title="Shift field to another tab"
                              >
                                {schema.tabs.map(t => (
                                  <option key={t.id} value={t.id}>
                                    Move to: {t.title || t.label}
                                  </option>
                                ))}
                              </select>

                              {/* Reorder Up / Down */}
                              {fIdx > 0 && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleMoveFieldInTab(field.id, -1) }}
                                  className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                                  title="Move Up"
                                >
                                  <MoveUp size={13} />
                                </button>
                              )}
                              {fIdx < activeTabFields.length - 1 && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleMoveFieldInTab(field.id, 1) }}
                                  className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                                  title="Move Down"
                                >
                                  <MoveDown size={13} />
                                </button>
                              )}

                              {/* Delete Field */}
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleDeleteField(field.id) }}
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                title="Delete Field"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {/* Add Another Field Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setNewFieldType('text')
                        setNewFieldLabel('')
                        setNewFieldKey('')
                        setNewFieldRequired(false)
                        setNewFieldWidth('1/2')
                        setNewFieldPlaceholder('')
                        setAddFieldModalOpen(true)
                      }}
                      className="w-full py-2.5 rounded-xl border border-dashed border-purple-200 bg-purple-50/40 hover:bg-purple-50 text-purple-700 hover:text-purple-800 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus size={13} />
                      <span>Add Another Field to {currentTab?.title || currentTab?.label}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* COLUMN 3: RIGHT FIELD PROPERTY INSPECTOR */}
            <div className="lg:col-span-3 space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3 sticky top-4">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Settings size={14} className="text-purple-600" />
                    Field Inspector
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {selectedField ? `Editing "${selectedField.label}"` : 'Select a field on the canvas to configure'}
                  </p>
                </div>

                {selectedField ? (
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="font-bold text-slate-700">Display Label</label>
                      <input
                        type="text"
                        value={selectedField.label}
                        onChange={(e) => handleUpdateSelectedField({ label: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-1.5 font-semibold text-slate-800 outline-none focus:border-purple-600"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700">Field Key (Unique Identifier)</label>
                      <input
                        type="text"
                        value={selectedField.id}
                        onChange={(e) => handleUpdateSelectedField({ id: e.target.value.trim() })}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-1.5 font-mono text-xs text-purple-700 outline-none focus:border-purple-600"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700">Placeholder Text</label>
                      <input
                        type="text"
                        value={selectedField.placeholder || ''}
                        onChange={(e) => handleUpdateSelectedField({ placeholder: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-1.5 text-slate-800 outline-none focus:border-purple-600"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700">Responsive Grid Width / Column Span</label>
                      <select
                        value={selectedField.colSpan || selectedField.width || '1'}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val === 'full') {
                            handleUpdateSelectedField({ width: 'full', colSpan: 'full' })
                          } else {
                            const num = Number(val)
                            handleUpdateSelectedField({ width: val, colSpan: Number.isFinite(num) ? num : 1 })
                          }
                        }}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-1.5 font-semibold text-slate-800 outline-none focus:border-purple-600 cursor-pointer"
                      >
                        <option value="1">1 Column Span</option>
                        <option value="2">2 Columns Span</option>
                        <option value="3">3 Columns Span</option>
                        <option value="4">4 Columns Span</option>
                        <option value="5">5 Columns Span</option>
                        <option value="6">6 Columns Span</option>
                        <option value="full">Full Width (Across all columns)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <input
                        type="checkbox"
                        id="field_req_toggle"
                        checked={!!selectedField.required}
                        onChange={(e) => handleUpdateSelectedField({ required: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                      <label htmlFor="field_req_toggle" className="font-bold text-slate-700 cursor-pointer">
                        Mark as Required Field
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    Click any field card in the center canvas to inspect and edit its properties.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add New Tab */}
      {addTabModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">Add New Form Tab</h3>
              <button
                type="button"
                onClick={() => setAddTabModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddTab} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Tab Title</label>
                <input
                  type="text"
                  required
                  value={newTabTitle}
                  onChange={(e) => setNewTabTitle(e.target.value)}
                  placeholder="e.g. Statutory Clearance"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-semibold text-slate-900 outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Tab Icon</label>
                <select
                  value={newTabIcon}
                  onChange={(e) => setNewTabIcon(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-semibold text-slate-900 outline-none focus:border-purple-600 cursor-pointer"
                >
                  {AVAILABLE_ICONS.map(ic => (
                    <option key={ic} value={ic}>{ic}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddTabModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-purple-700 text-white font-bold hover:bg-purple-800 cursor-pointer"
                >
                  Create Tab
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add New Column */}
      {addColModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">Add Table Column</h3>
              <button
                type="button"
                onClick={() => setAddColModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddColumn} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Header Display Label</label>
                <input
                  type="text"
                  required
                  value={newColLabel}
                  onChange={(e) => setNewColLabel(e.target.value)}
                  placeholder="e.g. Joining Date"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-semibold text-slate-900 outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Data Field Key</label>
                <input
                  type="text"
                  required
                  value={newColKey}
                  onChange={(e) => setNewColKey(e.target.value.trim())}
                  placeholder="e.g. joiningDate"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-slate-900 outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Cell Formatter</label>
                <select
                  value={newColFormat}
                  onChange={(e) => setNewColFormat(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-semibold text-slate-900 outline-none focus:border-purple-600 cursor-pointer"
                >
                  {COLUMN_FORMAT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddColModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-purple-700 text-white font-bold hover:bg-purple-800 cursor-pointer"
                >
                  Add Column
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add New Field */}
      {addFieldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                  <Plus size={16} className="text-purple-600" />
                  Add Field to &ldquo;{currentTab?.title || currentTab?.label}&rdquo;
                </h3>
                <p className="text-[11px] text-slate-400">
                  Configure field properties and position it on the active tab
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAddFieldModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateFieldFromModal} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Field Type</label>
                <select
                  value={newFieldType}
                  onChange={(e) => {
                    setNewFieldType(e.target.value)
                    const ft = FIELD_TYPES.find(f => f.id === e.target.value)
                    if (!newFieldLabel) {
                      setNewFieldPlaceholder(`Enter ${ft?.label || 'value'}`)
                    }
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-semibold text-slate-900 outline-none focus:border-purple-600 cursor-pointer"
                >
                  {FIELD_TYPES.map(ft => (
                    <option key={ft.id} value={ft.id}>{ft.label} ({ft.id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700">Display Label</label>
                <input
                  type="text"
                  required
                  value={newFieldLabel}
                  onChange={(e) => {
                    setNewFieldLabel(e.target.value)
                    if (!newFieldKey) {
                      const autoKey = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30)
                      setNewFieldKey(autoKey)
                    }
                  }}
                  placeholder="e.g. Alternate Contact Number"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-semibold text-slate-900 outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Database Column / Key</label>
                <input
                  type="text"
                  value={newFieldKey}
                  onChange={(e) => setNewFieldKey(e.target.value.trim())}
                  placeholder="e.g. alt_contact or leave blank for auto"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-slate-900 outline-none focus:border-purple-600"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Mapped to DB or stored in CustomFieldsJson automatically.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Grid Width</label>
                  <select
                    value={newFieldWidth}
                    onChange={(e) => setNewFieldWidth(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-semibold text-slate-900 outline-none focus:border-purple-600 cursor-pointer"
                  >
                    <option value="1/2">Half Width (50%)</option>
                    <option value="full">Full Width (100%)</option>
                    <option value="1/3">One-Third (33.3%)</option>
                    <option value="1/4">Quarter Width (25%)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700">Placeholder</label>
                  <input
                    type="text"
                    value={newFieldPlaceholder}
                    onChange={(e) => setNewFieldPlaceholder(e.target.value)}
                    placeholder="Hint text..."
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="modal_field_required"
                  checked={newFieldRequired}
                  onChange={(e) => setNewFieldRequired(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <label htmlFor="modal_field_required" className="font-bold text-slate-700 cursor-pointer">
                  Mark this field as Mandatory (Required *)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddFieldModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-purple-700 text-white font-bold hover:bg-purple-800 cursor-pointer shadow-xs"
                >
                  Add Field to Tab
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab Sequence & Renaming Modal */}
      {schema?.tabs && (
        <TabSequenceModal
          isOpen={tabSequenceModalOpen}
          onClose={() => setTabSequenceModalOpen(false)}
          tabs={schema.tabs}
          schemaId={selectedEntity === 'employee' ? 'employee_form' : selectedEntity}
          entityType={selectedEntity}
          onSave={async (updatedTabs) => {
            const updated = {
              ...schema,
              tabs: updatedTabs,
            }
            setSchema(updated)
            if (isTableEntity) {
              saveDraftSchema(selectedEntity, updated)
              await publishSchema(selectedEntity)
            } else {
              await saveFormSchema(selectedEntity, updated)
            }
            showToast('Tab names and sequence (1, 2, 3) updated successfully!')
          }}
        />
      )}
    </div>
  )
}
