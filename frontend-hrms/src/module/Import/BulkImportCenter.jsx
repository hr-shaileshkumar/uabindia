import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  getImportEntities,
  getImportSchema,
  downloadImportTemplate,
  validateImportFile,
  commitImport
} from '../../api/import'
import { useToast } from '../../components/ToastProvider'
import PageHeader from '../../components/PageHeader'
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Database,
  Layers,
  Search,
  Filter,
  RefreshCw,
  Table,
  Check,
  Info,
  ChevronRight,
  Sparkles,
  Users,
  Clock,
  Compass,
  Briefcase,
  Award,
  GitBranch,
  MapPin,
  Building2,
  FolderKanban,
  UserCog,
  FileText,
  AlertCircle
} from 'lucide-react'

export default function BulkImportCenter() {
  const toast = useToast()
  const navigate = useNavigate()

  // State
  const [entities, setEntities] = useState([])
  const [selectedEntityId, setSelectedEntityId] = useState('')
  const [selectedSchema, setSelectedSchema] = useState(null)
  const [loadingEntities, setLoadingEntities] = useState(true)
  const [loadingSchema, setLoadingSchema] = useState(false)

  // Upload & Validation state
  const [file, setFile] = useState(null)
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState(null)
  const [isCommitting, setIsCommitting] = useState(false)
  const [commitResult, setCommitResult] = useState(null)
  const [importValidOnly, setImportValidOnly] = useState(true)

  // UI state
  const [activeTab, setActiveTab] = useState('schema') // 'schema' | 'preview' | 'errors'
  const [filterCategory, setFilterCategory] = useState('all')
  const [entitySearch, setEntitySearch] = useState('')
  const [downloadingFormat, setDownloadingFormat] = useState(null)

  // Load available entities
  const loadEntities = React.useCallback(async () => {
    try {
      setLoadingEntities(true)
      const data = await getImportEntities()
      const list = Array.isArray(data) ? data : []
      setEntities(list)
      if (list.length > 0 && !selectedEntityId) {
        setSelectedEntityId(list[0].id)
      }
    } catch (err) {
      toast(err?.response?.data?.message || 'Failed to load import entities', 'error')
    } finally {
      setLoadingEntities(false)
    }
  }, [selectedEntityId, toast])

  useEffect(() => {
    loadEntities()
  }, [loadEntities])

  // Load schema when selectedEntityId changes
  useEffect(() => {
    if (!selectedEntityId) return
    let cancelled = false
    async function load() {
      try {
        setLoadingSchema(true)
        setFile(null)
        setValidationResult(null)
        setCommitResult(null)
        const schema = await getImportSchema(selectedEntityId)
        if (!cancelled) setSelectedSchema(schema)
      } catch (err) {
        if (!cancelled) {
          toast(err?.response?.data?.message || 'Failed to load table schema', 'error')
        }
      } finally {
        if (!cancelled) setLoadingSchema(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [selectedEntityId])

  // Icon mapper
  const getEntityIcon = (iconName) => {
    switch (iconName) {
      case 'Users': return Users
      case 'Clock': return Clock
      case 'Compass': return Compass
      case 'Briefcase': return Briefcase
      case 'Award': return Award
      case 'GitBranch': return GitBranch
      case 'MapPin': return MapPin
      case 'Building2': return Building2
      case 'FolderKanban': return FolderKanban
      case 'UserCog': return UserCog
      default: return Table
    }
  }

  // Filtered entities list
  const filteredEntities = useMemo(() => {
    return entities.filter(ent => {
      if (!ent) return false
      if (filterCategory !== 'all' && ent.category !== filterCategory) return false
      if (entitySearch.trim()) {
        const q = entitySearch.toLowerCase()
        return (ent.name || '').toLowerCase().includes(q) ||
               (ent.targetTable || '').toLowerCase().includes(q) ||
               (ent.description || '').toLowerCase().includes(q)
      }
      return true
    })
  }, [entities, filterCategory, entitySearch])

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(entities.map(e => e.category).filter(Boolean))
    return ['all', ...Array.from(set)]
  }, [entities])

  // Handle template download
  const handleDownloadTemplate = async (format) => {
    if (!selectedEntityId) return
    try {
      setDownloadingFormat(format)
      await downloadImportTemplate(selectedEntityId, format)
      toast(`Downloaded ${selectedEntityId} template (.${format})`, 'success')
    } catch (err) {
      toast('Failed to download template', 'error')
    } finally {
      setDownloadingFormat(null)
    }
  }

  // Handle file selection
  const handleFileChange = (e) => {
    const selected = e.target.files && e.target.files[0]
    if (!selected) return
    setFile(selected)
    setValidationResult(null)
    setCommitResult(null)
  }

  // Handle file validation
  const handleValidate = async () => {
    if (!file || !selectedEntityId) {
      toast('Please select a file to import', 'warning')
      return
    }

    try {
      setIsValidating(true)
      const res = await validateImportFile(file, selectedEntityId)
      setValidationResult(res)
      if (res.isValid) {
        toast(`File validated: All ${res.validRowsCount} rows are ready to import!`, 'success')
        setActiveTab('preview')
      } else {
        toast(`Validation finished: ${res.errorRowsCount} row error(s) found`, 'warning')
        setActiveTab('errors')
      }
    } catch (err) {
      toast(err?.response?.data?.message || 'File validation failed', 'error')
    } finally {
      setIsValidating(false)
    }
  }

  // Handle commit / import
  const handleCommit = async () => {
    if (!file || !selectedEntityId) return

    try {
      setIsCommitting(true)
      const res = await commitImport(file, selectedEntityId, importValidOnly)
      setCommitResult(res)
      toast(res.message || 'Bulk import completed successfully!', 'success')
    } catch (err) {
      toast(err?.response?.data?.message || 'Bulk import failed', 'error')
    } finally {
      setIsCommitting(false)
    }
  }

  // Reset current upload
  const handleReset = () => {
    setFile(null)
    setValidationResult(null)
    setCommitResult(null)
    setActiveTab('schema')
  }

  return (
    <div className="space-y-4 antialiased pb-8 select-none">
      <PageHeader
        icon={UploadCloud}
        title="Universal Bulk Import Center"
        badge="Database Engine"
        badgeTone="purple"
      >
        <button
          type="button"
          onClick={loadEntities}
          disabled={loadingEntities}
          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
        >
          <RefreshCw size={12} className={loadingEntities ? 'animate-spin text-purple-700' : 'text-slate-500'} />
          <span>Refresh</span>
        </button>
      </PageHeader>

      {/* ========================================================= */}
      {/* STEP 1: Select Target Table / Entity                      */}
      {/* ========================================================= */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs font-extrabold">
                1
              </span>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Select Target Table / Entity to Import Data Into
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 pl-8">
              Choose which module page or database table you wish to upload records to.
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={entitySearch}
              onChange={e => setEntitySearch(e.target.value)}
              placeholder="Search table or entity..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-1.5 pl-8 pr-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-purple-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100 transition"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pl-8">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition capitalize whitespace-nowrap ${
                filterCategory === cat
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {cat === 'all' ? 'All Tables' : cat}
            </button>
          ))}
        </div>

        {/* Entity Card Selector Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
          {filteredEntities.map(ent => {
            const Icon = getEntityIcon(ent.icon)
            const isSelected = selectedEntityId === ent.id

            return (
              <button
                key={ent.id}
                type="button"
                onClick={() => setSelectedEntityId(ent.id)}
                className={`flex flex-col text-left p-3.5 rounded-xl border transition-all text-xs relative ${
                  isSelected
                    ? 'border-purple-600 bg-purple-50/60 ring-2 ring-purple-100 shadow-xs'
                    : 'border-slate-200/90 bg-white hover:border-purple-300 hover:bg-slate-50/70'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-purple-700 text-white shadow-2xs' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Icon size={16} />
                  </div>
                  {isSelected && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-700 text-white">
                      <Check size={12} />
                    </span>
                  )}
                </div>

                <div className="font-bold text-slate-900 truncate leading-snug">
                  {ent.name}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                  {ent.targetTable}
                </div>
                <div className="mt-2 text-[10.5px] text-purple-700 font-semibold flex items-center gap-1">
                  <span>{ent.columns?.length || 0} Columns</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* STEP 2: Schema Identification & Template Download         */}
      {/* ========================================================= */}
      {selectedSchema && (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs font-extrabold">
                  2
                </span>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Table Format & Columns Identification: {selectedSchema.name}
                </h2>
              </div>
              <div className="flex items-center gap-2 mt-1 pl-8 text-xs text-slate-500">
                <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold">
                  {selectedSchema.targetTable}
                </span>
                <span>•</span>
                <span>{selectedSchema.columns.filter(c => c.isRequired).length} Required Columns</span>
                <span>•</span>
                <span>{selectedSchema.columns.length} Total Columns</span>
              </div>
            </div>

            {/* Template Download Buttons */}
            <div className="flex items-center gap-2 pl-8 md:pl-0">
              <button
                type="button"
                onClick={() => handleDownloadTemplate('xlsx')}
                disabled={downloadingFormat === 'xlsx'}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 text-xs font-bold shadow-xs transition"
              >
                <FileSpreadsheet size={14} />
                <span>{downloadingFormat === 'xlsx' ? 'Generating...' : 'Download Excel (.xlsx)'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadTemplate('csv')}
                disabled={downloadingFormat === 'csv'}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-2 text-xs font-bold transition"
              >
                <Download size={13} />
                <span>CSV Template</span>
              </button>
            </div>
          </div>

          {/* Instructions Alert */}
          {selectedSchema.instructions && selectedSchema.instructions.length > 0 && (
            <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3.5 text-xs text-purple-900 flex items-start gap-2.5">
              <Info size={16} className="text-purple-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-purple-900">Database Reference Guidelines for this table:</div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-[11.5px]">
                  {selectedSchema.instructions.map((inst, i) => (
                    <li key={i}>{inst}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Columns Specification Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Column Name</th>
                  <th className="py-2.5 px-3">Field Label</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Data Type</th>
                  <th className="py-2.5 px-3">Database Reference / Lookup</th>
                  <th className="py-2.5 px-3">Sample Value</th>
                  <th className="py-2.5 px-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {selectedSchema.columns.map((col, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 font-mono font-bold text-purple-950">
                      {col.Name}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-800">
                      {col.Label}
                    </td>
                    <td className="py-2 px-3">
                      {col.IsRequired ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-red-50 text-red-700 border border-red-200">
                          REQUIRED
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500">
                          Optional
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                      {col.Type}
                    </td>
                    <td className="py-2 px-3">
                      {col.LookupRef ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200/60 font-semibold">
                          <Database size={10} />
                          {col.LookupRef}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Direct Value</span>
                      )}
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-600 text-[11px]">
                      {col.SampleValue}
                    </td>
                    <td className="py-2 px-3 text-slate-500 text-[11px]">
                      {col.Description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STEP 3: File Upload & Backend Verification                */}
      {/* ========================================================= */}
      {selectedSchema && (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs font-extrabold">
              3
            </span>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Upload Data File & Verify Against Database References
            </h2>
          </div>

          {/* Upload Dropzone */}
          <div className="rounded-2xl border-2 border-dashed border-slate-300 hover:border-purple-400 bg-slate-50/50 p-6 text-center transition">
            <input
              type="file"
              id="bulk-import-file-input"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="bulk-import-file-input"
              className="cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center shadow-xs">
                <UploadCloud size={24} />
              </div>

              <div className="space-y-1">
                <div className="text-sm font-bold text-slate-800">
                  {file ? file.name : 'Click to select or drag & drop file here'}
                </div>
                <div className="text-xs text-slate-500">
                  Supported formats: Excel Workbook (.xlsx, .xls) or Comma Separated (.csv) • Max 50MB
                </div>
              </div>

              {file && (
                <div className="text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200 mt-2">
                  File Size: {(file.size / 1024).toFixed(1)} KB
                </div>
              )}
            </label>
          </div>

          {/* Verification CTA Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-xs text-slate-500">
              Backend will verify headers, column formats, and database references before importing.
            </div>

            <div className="flex items-center gap-2.5">
              {file && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Clear File
                </button>
              )}

              <button
                type="button"
                onClick={handleValidate}
                disabled={!file || isValidating}
                className="inline-flex items-center gap-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 text-xs font-bold shadow-xs transition disabled:opacity-50"
              >
                {isValidating ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Verifying with Database...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Verify Data File</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* VALIDATION RESULTS DASHBOARD                              */}
          {/* ========================================================= */}
          {validationResult && (
            <div className="pt-4 border-t border-slate-200 space-y-4">
              {/* Stat Counters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-center">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Total Rows Read</div>
                  <div className="text-2xl font-extrabold text-slate-900 mt-1">{validationResult.totalRows}</div>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-center">
                  <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">Valid Rows Verified</div>
                  <div className="text-2xl font-extrabold text-emerald-700 mt-1">{validationResult.validRowsCount}</div>
                </div>

                <div className={`rounded-xl border p-3.5 text-center ${
                  validationResult.errorRowsCount > 0 ? 'border-red-200 bg-red-50/70' : 'border-slate-200 bg-slate-50'
                }`}>
                  <div className="text-[11px] font-bold text-red-800 uppercase tracking-wide">Rows with Errors</div>
                  <div className={`text-2xl font-extrabold mt-1 ${validationResult.errorRowsCount > 0 ? 'text-red-700' : 'text-slate-500'}`}>
                    {validationResult.errorRowsCount}
                  </div>
                </div>
              </div>

              {/* Status Banner */}
              {validationResult.isValid ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center justify-between gap-3 text-emerald-900">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-bold text-xs">All records passed validation!</div>
                      <div className="text-[11px] text-emerald-700">
                        Required columns and database foreign references matched successfully. You may now commit the upload.
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start justify-between gap-3 text-amber-900">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs">
                        {validationResult.missingRequiredColumns?.length > 0
                          ? 'Missing Required Columns in File'
                          : `${validationResult.errorRowsCount} row(s) failed database reference / format checks`}
                      </div>
                      <div className="text-[11px] text-amber-800 mt-0.5">
                        Review the errors below. You can fix the file and re-upload, or toggle &quot;Import valid rows only&quot; to proceed with valid records.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Switcher: Preview Rows vs. Errors */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeTab === 'preview'
                      ? 'bg-purple-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Preview Data Rows ({validationResult.previewRows?.length || 0})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('errors')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeTab === 'errors'
                      ? 'bg-red-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Validation Errors ({validationResult.errors?.length || 0})
                </button>
              </div>

              {/* Tab 1: Preview Table */}
              {activeTab === 'preview' && (
                <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-72">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10.5px] font-bold text-slate-500 uppercase sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Row #</th>
                        <th className="py-2 px-3">Status</th>
                        {selectedSchema.columns.slice(0, 7).map((col, idx) => (
                          <th key={idx} className="py-2 px-3">{col.Label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {validationResult.previewRows?.map((row, rIdx) => (
                        <tr key={rIdx} className={row.isValid ? 'hover:bg-slate-50/50' : 'bg-red-50/30'}>
                          <td className="py-2 px-3 font-mono font-bold text-slate-400">
                            {row.rowNumber}
                          </td>
                          <td className="py-2 px-3">
                            {row.isValid ? (
                              <span className="inline-flex items-center gap-1 rounded bg-emerald-100 text-emerald-800 px-1.5 py-0.5 text-[10px] font-bold">
                                <Check size={10} /> Valid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded bg-red-100 text-red-800 px-1.5 py-0.5 text-[10px] font-bold">
                                <XCircle size={10} /> Error
                              </span>
                            )}
                          </td>
                          {selectedSchema.columns.slice(0, 7).map((col, cIdx) => (
                            <td key={cIdx} className="py-2 px-3 font-mono text-[11px] truncate max-w-[160px]">
                              {row.data[col.Name] || '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab 2: Error Breakdown Table */}
              {activeTab === 'errors' && (
                <div className="overflow-x-auto rounded-xl border border-red-200 max-h-72">
                  {validationResult.errors?.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      No errors detected! All rows are clean and ready.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-red-50 text-[10.5px] font-bold text-red-800 uppercase sticky top-0 border-b border-red-200">
                        <tr>
                          <th className="py-2 px-3">Row #</th>
                          <th className="py-2 px-3">Column / Field</th>
                          <th className="py-2 px-3">Uploaded Value</th>
                          <th className="py-2 px-3">Database Verification Failure Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-red-100 text-slate-700">
                        {validationResult.errors?.map((err, eIdx) => (
                          <tr key={eIdx} className="hover:bg-red-50/40">
                            <td className="py-2 px-3 font-mono font-bold text-red-700">
                              Row {err.rowNumber}
                            </td>
                            <td className="py-2 px-3 font-semibold text-slate-800">
                              {err.column}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-600 text-[11px]">
                              {err.value || '<Empty>'}
                            </td>
                            <td className="py-2 px-3 text-red-700 font-medium">
                              {err.message}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* STEP 4: Final Commit & Import Execution                   */}
              {/* ========================================================= */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="import-valid-only-toggle"
                    checked={importValidOnly}
                    onChange={e => setImportValidOnly(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="import-valid-only-toggle" className="text-xs text-slate-700 font-semibold cursor-pointer">
                    Import valid rows only (Skip rows with reference / format errors)
                  </label>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleCommit}
                    disabled={isCommitting || (validationResult.validRowsCount === 0 && !importValidOnly)}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-700 to-rose-600 hover:from-purple-800 hover:to-rose-700 text-white px-5 py-2.5 text-xs font-bold shadow-md shadow-purple-500/20 transition disabled:opacity-50"
                  >
                    {isCommitting ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Committing Data to Database...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud size={15} />
                        <span>Confirm & Upload {importValidOnly ? validationResult.validRowsCount : validationResult.totalRows} Records</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Commit Success Result Banner */}
              {commitResult && commitResult.success && (
                <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-5 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    <span>{commitResult.message}</span>
                  </div>
                  <div className="text-xs text-emerald-700">
                    All valid records have been saved into the database table with proper tenant and sequence keys.
                  </div>
                  <div className="pt-1 flex items-center gap-3">
                    <Link
                      to={selectedEntityId === 'employees' ? '/module/hrms/employee-master' :
                          selectedEntityId === 'attendance' ? '/module/hrms/attendance/combined' :
                          selectedEntityId === 'companies' ? '/module/hrms/company-master' :
                          selectedEntityId === 'projects' ? '/module/hrms/projects' :
                          selectedEntityId === 'users' ? '/administration/users' : '/module/hrms/setup'}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-1.5 text-xs font-bold shadow-2xs transition"
                    >
                      <span>View Uploaded Records</span>
                      <ArrowRight size={13} />
                    </Link>

                    <button
                      type="button"
                      onClick={handleReset}
                      className="rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                    >
                      Import Another File
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
