import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import {
  GitBranch,
  Award,
  Briefcase,
  MapPin,
  Landmark,
  Compass,
  Globe,
  Layers,
  Plus,
  Search,
  Download,
  RotateCw,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  X,
  Network,
  Navigation,
  ExternalLink
} from 'lucide-react'
import {
  getCompanySetup,
  createCompanySetupItem,
  updateCompanySetupItem,
  deleteCompanySetupItem,
  seedCompanySetupDefaults
} from '../../../api/companySetup'
import { getPrioritizedParentTypes, resolveLocationAncestry } from '../../../utils/locationHierarchy'
import PageHeader from '../../../components/PageHeader'
import LayoutVersionBadge from '../../../components/LayoutVersionBadge'

// Configuration for each master type in requested sequence
const MASTER_CONFIG = {
  // --- Location Hierarchy (Country -> Zone -> Region -> State -> Cluster -> District -> Posting Location) ---
  country: {
    key: 'country',
    itemType: 'Country',
    label: 'Countries',
    singular: 'Country',
    group: 'Location',
    level: 1,
    parentType: null,
    parentTypes: [],
    parentRequired: false,
    codePrefix: 'CTRY-',
    icon: Globe,
    color: 'from-blue-700 to-indigo-800',
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
    description: 'First level in Location Hierarchy: Apex sovereign national boundary (e.g. India)',
    hierarchyNote: 'First level (Apex) in Location Hierarchy spanning across all macro Zones'
  },
  zone: {
    key: 'zone',
    itemType: 'Zone',
    label: 'Zones',
    singular: 'Zone',
    group: 'Location',
    level: 2,
    parentType: 'Country',
    parentTypes: ['Country'],
    parentRequired: true,
    codePrefix: 'ZONE-',
    icon: Layers,
    color: 'from-slate-700 to-slate-900',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    description: 'Second level in Location Hierarchy: Macro operational zones (e.g. East Zone, North Zone, Central Zone)',
    hierarchyNote: 'Second level in Location Hierarchy, belonging to Country and governing member Regions'
  },
  region: {
    key: 'region',
    itemType: 'Region',
    label: 'Regions',
    singular: 'Region',
    group: 'Location',
    level: 3,
    parentType: 'Zone',
    parentTypes: ['Zone', 'Country'],
    parentRequired: true,
    codePrefix: 'REG-',
    icon: Compass,
    color: 'from-violet-600 to-purple-600',
    badgeColor: 'bg-violet-50 text-violet-700 border-violet-200',
    description: 'Third level in Location Hierarchy: Regional supervisory divisions and multi-state territories',
    hierarchyNote: 'Third level in Location Hierarchy, belonging to Zone and governing member States'
  },
  state: {
    key: 'state',
    itemType: 'State',
    label: 'States',
    singular: 'State',
    group: 'Location',
    level: 4,
    parentType: 'Region',
    parentTypes: ['Region', 'Zone'],
    parentRequired: true,
    codePrefix: 'ST-',
    icon: Landmark,
    color: 'from-emerald-600 to-teal-600',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Fourth level in Location Hierarchy: State jurisdictions (e.g. Bihar, Jharkhand, Uttar Pradesh)',
    hierarchyNote: 'Fourth level in Location Hierarchy, belonging to Region and encompassing operational Clusters'
  },
  cluster: {
    key: 'cluster',
    itemType: 'Cluster',
    label: 'Clusters',
    singular: 'Cluster',
    group: 'Location',
    level: 5,
    parentType: 'State',
    parentTypes: ['State', 'Region'],
    parentRequired: true,
    codePrefix: 'CLS-',
    icon: Network,
    color: 'from-amber-600 to-orange-600',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Fifth level in Location Hierarchy: Operational multi-district supervisory clusters',
    hierarchyNote: 'Fifth level in Location Hierarchy, belonging to State and governing operational Districts'
  },
  district: {
    key: 'district',
    itemType: 'District',
    label: 'Districts',
    singular: 'District',
    group: 'Location',
    level: 6,
    parentType: 'Cluster',
    parentTypes: ['Cluster', 'State'],
    parentRequired: true,
    codePrefix: 'DST-',
    icon: MapPin,
    color: 'from-cyan-600 to-blue-600',
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    description: 'Sixth level in Location Hierarchy: Administrative districts for operational coverage',
    hierarchyNote: 'Sixth level in Location Hierarchy, belonging to Cluster and encompassing Posting Locations & Branches'
  },
  location: {
    key: 'location',
    itemType: 'Location',
    label: 'Posting Locations',
    singular: 'Posting Location',
    group: 'Location',
    level: 7,
    parentType: 'District',
    parentTypes: ['District', 'Branch', 'Cluster'],
    parentRequired: true,
    codePrefix: 'LOC-',
    icon: Navigation,
    color: 'from-rose-600 to-pink-600',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    description: 'Seventh level in Location Hierarchy: Specific employee duty stations and work centers',
    hierarchyNote: 'Seventh level in Location Hierarchy, duty stations assigned under a District or Branch'
  },

  // --- Organization Masters (Departments, Designations, Branches) ---
  department: {
    key: 'department',
    itemType: 'Department',
    label: 'Departments',
    singular: 'Department',
    group: 'Organization',
    level: 1,
    parentType: null,
    parentTypes: [],
    parentRequired: false,
    codePrefix: 'DEP-',
    icon: Briefcase,
    color: 'from-purple-700 to-indigo-700',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'Functional organizational divisions, operational units, and corporate departments',
    hierarchyNote: 'Top-level organization entities containing child designations and staff'
  },
  designation: {
    key: 'designation',
    itemType: 'Designation',
    label: 'Designations',
    singular: 'Designation',
    group: 'Organization',
    level: 2,
    parentType: 'Department',
    parentTypes: ['Department', 'SubDepartment'],
    parentRequired: true,
    codePrefix: 'DES-',
    icon: Award,
    color: 'from-rose-600 to-pink-600',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    description: 'Official job titles, executive roles, and operational designations',
    hierarchyNote: 'Designations are mapped to a Department to structure reporting hierarchy'
  },
  branch: {
    key: 'branch',
    itemType: 'Branch',
    label: 'Branches',
    singular: 'Branch',
    group: 'Organization',
    level: 3,
    parentType: 'District',
    parentTypes: ['District', 'Cluster', 'State'],
    parentRequired: true,
    codePrefix: 'BR-',
    icon: GitBranch,
    color: 'from-blue-600 to-indigo-600',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Company branches, field offices, and operational hub facilities',
    hierarchyNote: 'Branches are mapped to an administrative District for regional reporting'
  }
}


export default function OrganizationMaster() {
  const { type: paramType } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  // Determine active type from url path or param
  const activeKey = useMemo(() => {
    if (paramType && MASTER_CONFIG[paramType.toLowerCase()]) {
      return paramType.toLowerCase()
    }
    const pathParts = location.pathname.toLowerCase().split('/')
    const lastPart = pathParts[pathParts.length - 1]
    if (MASTER_CONFIG[lastPart]) return lastPart
    return 'branch'
  }, [paramType, location.pathname])

  const config = MASTER_CONFIG[activeKey] || MASTER_CONFIG.branch
  const IconComponent = config.icon

  // Data state
  const [loading, setLoading] = useState(true)
  const [allItems, setAllItems] = useState([])
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  // Filters & search
  const [searchTerm, setSearchTerm] = useState('')
  const [parentFilter, setParentFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    setupCode: '',
    setupName: '',
    parentId: '',
    sortOrder: 0,
    isActive: true,
    notes: ''
  })
  const [formErrors, setFormErrors] = useState({})

  // Fetch all items from API
  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const resp = await getCompanySetup()
      setAllItems(resp?.items || [])
    } catch (err) {
      console.error('Failed to load company setup items', err)
      setError(err?.response?.data?.message || err?.message || 'Failed to load master data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Auto-dismiss toasts
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [successMsg])

  // Filter items belonging to the current active type
  const typeItems = useMemo(() => {
    return allItems.filter(item =>
      String(item.itemType || '').toLowerCase() === config.itemType.toLowerCase()
    )
  }, [allItems, config.itemType])

  // Prioritized parent types based on available tiers in company dataset
  const prioritizedParentTypes = useMemo(() => {
    return getPrioritizedParentTypes(config.itemType, allItems)
  }, [config.itemType, allItems])

  // Potential parent options strictly filtered to the prioritized tier
  const parentOptions = useMemo(() => {
    if (!prioritizedParentTypes || prioritizedParentTypes.length === 0) return []
    const allowed = prioritizedParentTypes.map(t => t.toLowerCase())
    return allItems
      .filter(item => allowed.includes(String(item.itemType || '').toLowerCase()) && item.isActive)
      .sort((a, b) => (a.setupName || '').localeCompare(b.setupName || ''))
  }, [allItems, prioritizedParentTypes])

  // Real-time ancestry relation preview for currently selected parent
  const selectedAncestry = useMemo(() => {
    return resolveLocationAncestry(formData.parentId, allItems)
  }, [formData.parentId, allItems])

  // Filtered items based on search and filters
  const filteredItems = useMemo(() => {
    return typeItems.filter(item => {
      const s = searchTerm.toLowerCase().trim()
      const matchesSearch =
        !s ||
        (item.setupName && item.setupName.toLowerCase().includes(s)) ||
        (item.setupCode && item.setupCode.toLowerCase().includes(s)) ||
        (item.parentName && item.parentName.toLowerCase().includes(s)) ||
        (item.notes && item.notes.toLowerCase().includes(s))

      const matchesParent =
        !parentFilter || String(item.parentId || '') === String(parentFilter)

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && item.isActive) ||
        (statusFilter === 'INACTIVE' && !item.isActive)

      return matchesSearch && matchesParent && matchesStatus
    })
  }, [typeItems, searchTerm, parentFilter, statusFilter])

  // KPI counts
  const kpis = useMemo(() => {
    const total = typeItems.length
    const active = typeItems.filter(i => i.isActive).length
    const inactive = total - active
    const withParent = typeItems.filter(i => i.parentId).length
    return { total, active, inactive, withParent }
  }, [typeItems])

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingItem(null)
    setFormData({
      setupCode: '',
      setupName: '',
      parentId: parentOptions.length > 0 ? parentOptions[0].id : '',
      sortOrder: typeItems.length + 1,
      isActive: true,
      notes: ''
    })
    setFormErrors({})
    setModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setEditingItem(item)
    setFormData({
      setupCode: item.setupCode || '',
      setupName: item.setupName || '',
      parentId: item.parentId || '',
      sortOrder: item.sortOrder ?? 0,
      isActive: item.isActive !== false,
      notes: item.notes || ''
    })
    setFormErrors({})
    setModalOpen(true)
  }

  // Validate form
  const validateForm = () => {
    const errors = {}
    if (!formData.setupName.trim()) {
      errors.setupName = `${config.singular} name is required`
    }
    if (config.parentRequired && !formData.parentId) {
      errors.parentId = `Parent ${config.parentType} mapping is required`
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Submit Create / Edit
  const handleSave = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setSubmitting(true)
    setError(null)
    try {
      const ancestry = resolveLocationAncestry(formData.parentId, allItems)
      const payload = {
        itemType: config.itemType,
        setupCode: editingItem ? (formData.setupCode?.trim() || null) : null,
        setupName: formData.setupName.trim(),
        parentId: formData.parentId || null,
        sortOrder: Number(formData.sortOrder) || 0,
        isActive: Boolean(formData.isActive),
        notes: formData.notes.trim() || null,
        metadataJson: JSON.stringify(ancestry.relations)
      }

      if (editingItem) {
        await updateCompanySetupItem(editingItem.companyId, editingItem.id, payload)
        setSuccessMsg(`${config.singular} "${formData.setupName}" updated successfully`)
      } else {
        await createCompanySetupItem(null, payload)
        setSuccessMsg(`New ${config.singular} "${formData.setupName}" added successfully`)
      }
      setModalOpen(false)
      await loadData()
    } catch (err) {
      console.error('Failed to save setup item', err)
      setError(err?.response?.data?.message || err?.message || 'Failed to save item')
    } finally {
      setSubmitting(false)
    }
  }

  // Quick toggle active status
  const handleToggleActive = async (item) => {
    try {
      const updated = {
        itemType: item.itemType,
        setupCode: item.setupCode,
        setupName: item.setupName,
        parentId: item.parentId,
        sortOrder: item.sortOrder,
        isActive: !item.isActive,
        notes: item.notes
      }
      await updateCompanySetupItem(item.companyId, item.id, updated)
      setSuccessMsg(`${config.singular} status marked as ${!item.isActive ? 'Active' : 'Inactive'}`)
      await loadData()
    } catch (err) {
      console.error('Failed to toggle status', err)
      setError(err?.response?.data?.message || 'Failed to update status')
    }
  }

  // Delete item
  const handleDelete = async () => {
    if (!deleteConfirmItem) return
    setSubmitting(true)
    try {
      await deleteCompanySetupItem(deleteConfirmItem.companyId, deleteConfirmItem.id)
      setSuccessMsg(`${config.singular} "${deleteConfirmItem.setupName}" deleted successfully`)
      setDeleteConfirmItem(null)
      await loadData()
    } catch (err) {
      console.error('Failed to delete setup item', err)
      setError(err?.response?.data?.message || 'Cannot delete item. It may have child records.')
    } finally {
      setSubmitting(false)
    }
  }

  // Seed defaults if empty
  const handleSeedDefaults = async () => {
    setLoading(true)
    setError(null)
    try {
      const resp = await seedCompanySetupDefaults()
      setSuccessMsg(resp.message || 'Default masters seeded successfully')
      await loadData()
    } catch (err) {
      console.error('Failed to seed defaults', err)
      setError(err?.response?.data?.message || 'Failed to seed defaults')
    } finally {
      setLoading(false)
    }
  }

  // CSV Export
  const handleExportCSV = () => {
    if (filteredItems.length === 0) return
    const headers = ['Code', 'Name', 'Parent_Type', 'Parent_Name', 'Sort_Order', 'Status', 'Notes']
    const rows = filteredItems.map(item => [
      `"${item.setupCode || ''}"`,
      `"${item.setupName || ''}"`,
      `"${item.parentType || ''}"`,
      `"${item.parentName || ''}"`,
      item.sortOrder || 0,
      item.isActive ? 'Active' : 'Inactive',
      `"${(item.notes || '').replace(/"/g, '""')}"`
    ])
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${config.key}_master_export.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // =========================================================================
  // FULL-SCREEN CONTENT AREA FORM VIEW
  // Rendered directly in content area when user clicks Add or Edit
  // =========================================================================
  if (modalOpen) {
    return (
      <div className="w-full space-y-6 antialiased pb-8 animate-in fade-in">
        {/* Top Breadcrumb & Return to List */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="inline-flex items-center gap-1.5 font-medium text-slate-600 hover:text-purple-700 transition cursor-pointer"
            >
              <ArrowLeft size={16} /> Back to {config.label} List
            </button>
            <ChevronRight size={14} className="text-slate-400" />
            <span className="text-slate-900 font-bold">
              {editingItem ? `Edit ${config.singular}` : `Create New ${config.singular}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-900 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-950 disabled:opacity-50 transition cursor-pointer"
            >
              {submitting && <RotateCw size={14} className="animate-spin" />}
              <span>{editingItem ? 'Save Changes' : `Create ${config.singular}`}</span>
            </button>
          </div>
        </div>

        {/* Form Header Banner */}
        <div className="rounded-2xl bg-white border border-slate-200/90 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr ${config.color} text-white shadow-sm`}>
              <IconComponent size={28} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {editingItem ? `Edit ${config.singular}` : `Create New ${config.singular}`}
                </h1>
                <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200">
                  {config.group} Master
                </span>
                {editingItem && (
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-mono font-bold text-blue-700 border border-blue-200">
                    {formData.setupCode}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">{config.description}</p>
            </div>
          </div>
        </div>

        {/* Main Form Cards Grid */}
        <form onSubmit={handleSave} className="space-y-6">
          {/* Card 1: Core Identification & Relational Linkage */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs font-bold">1</span>
              Basic Identification & Relational Linkage
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {editingItem && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Identifier Code (Read-Only)</label>
                  <input
                    type="text"
                    disabled
                    value={formData.setupCode}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-bold text-slate-500 uppercase cursor-not-allowed"
                  />
                  <p className="mt-1 text-[10px] text-slate-400">Official registered identifier assigned by system.</p>
                </div>
              )}

              <div className={editingItem ? 'md:col-span-2' : 'md:col-span-2'}>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {config.singular} Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder={`e.g. ${config.label === 'Branches' ? 'Patna Head Branch' : config.label === 'Departments' ? 'Human Resources' : config.label === 'States' ? 'Bihar' : 'Corporate HQ'}`}
                  value={formData.setupName}
                  onChange={(e) => setFormData({ ...formData, setupName: e.target.value })}
                  className={`w-full rounded-xl border px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 ${
                    formErrors.setupName ? 'border-rose-400 focus:ring-rose-500/20' : 'border-slate-200 focus:border-purple-600 focus:ring-purple-600/20'
                  }`}
                />
                {formErrors.setupName && (
                  <p className="mt-1 text-[11px] text-rose-600 font-semibold">{formErrors.setupName}</p>
                )}
              </div>

              {prioritizedParentTypes.length > 0 && (
                <div className="md:col-span-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Parent ({prioritizedParentTypes.join(' / ')}) {config.parentRequired && <span className="text-rose-500">*</span>}
                    </label>
                    {prioritizedParentTypes.length === 1 && config.parentTypes?.length > 1 && (
                      <span className="text-[10px] text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        Filtered to {prioritizedParentTypes[0]} tier
                      </span>
                    )}
                  </div>
                  {parentOptions.length === 0 ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
                      No active {prioritizedParentTypes.join(' or ')} records found. Please create a {prioritizedParentTypes[0]} first.
                    </div>
                  ) : (
                    <select
                      value={formData.parentId}
                      onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                      className={`w-full rounded-xl border px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 ${
                        formErrors.parentId ? 'border-rose-400 focus:ring-rose-500/20' : 'border-slate-200 focus:border-purple-600 focus:ring-purple-600/20'
                      }`}
                    >
                      <option value="">-- Select Parent ({prioritizedParentTypes.join(' / ')}) --</option>
                      {parentOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.setupName} ({opt.setupCode || opt.itemType})
                        </option>
                      ))}
                    </select>
                  )}
                  {formErrors.parentId && (
                    <p className="mt-1 text-[11px] text-rose-600 font-semibold">{formErrors.parentId}</p>
                  )}

                  {selectedAncestry.hierarchyPath && (
                    <div className="mt-2.5 rounded-xl border border-purple-200/90 bg-purple-50/60 p-3 text-xs shadow-2xs space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-purple-950 text-[11px] uppercase tracking-wide">
                        <Sparkles size={13} className="text-purple-600" />
                        Auto-Linked Ancestral Lineage
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 font-semibold text-purple-900 text-xs">
                        <span className="bg-white/90 border border-purple-200 px-2 py-0.5 rounded-md text-purple-800">
                          {selectedAncestry.hierarchyPath}
                        </span>
                        <span className="text-purple-400 font-bold">›</span>
                        <span className="bg-purple-600 text-white px-2 py-0.5 rounded-md font-bold shadow-2xs">
                          {formData.setupName || `(New ${config.singular})`}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[11px] text-purple-700 border-t border-purple-100">
                        {selectedAncestry.relations.countryName && (
                          <span>National Apex: <strong>{selectedAncestry.relations.countryName}</strong></span>
                        )}
                        {selectedAncestry.relations.zoneName && (
                          <span>• Zone: <strong>{selectedAncestry.relations.zoneName}</strong></span>
                        )}
                        {selectedAncestry.relations.regionName && (
                          <span>• Region: <strong>{selectedAncestry.relations.regionName}</strong></span>
                        )}
                        {selectedAncestry.relations.stateName && (
                          <span>• State: <strong>{selectedAncestry.relations.stateName}</strong></span>
                        )}
                        {selectedAncestry.relations.clusterName && (
                          <span>• Cluster: <strong>{selectedAncestry.relations.clusterName}</strong></span>
                        )}
                        {selectedAncestry.relations.districtName && (
                          <span>• District: <strong>{selectedAncestry.relations.districtName}</strong></span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Administrative Settings & Remarks */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">2</span>
              Administrative Settings & Remarks
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Display Order</label>
                <input
                  type="number"
                  min="0"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value, 10) || 0 })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Status</label>
                <label className="inline-flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-purple-700 focus:ring-purple-600"
                  />
                  <span className="text-xs font-bold text-slate-700">Active & Enabled</span>
                </label>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Description / Remarks</label>
                <textarea
                  rows="3"
                  placeholder="Optional context, coverage notes, or remarks..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-purple-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              disabled={submitting}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-900 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-purple-950 disabled:opacity-50 transition cursor-pointer"
            >
              {submitting && <RotateCw size={14} className="animate-spin" />}
              <span>{editingItem ? 'Save Changes' : `Create ${config.singular}`}</span>
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4 antialiased pb-8">
      {/* ========================================================= */}
      {/* TOP NOTIFICATIONS                                         */}
      {/* ========================================================= */}
      {successMsg && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800">
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-rose-600" />
            <span className="font-medium">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-800">
            <X size={16} />
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* BREADCRUMB & HEADER                                       */}
      {/* ========================================================= */}
      <PageHeader
        icon={IconComponent}
        title={`${config.label} Master`}
        badge={`${config.group} Hierarchy`}
        badgeTone="purple"
      >
        <LayoutVersionBadge entity="organization_master" version={1.0} />
        {allItems.length === 0 && !loading && (
          <button
            type="button"
            onClick={handleSeedDefaults}
            className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 shadow-2xs hover:bg-amber-100 transition"
          >
            <Sparkles size={13} className="text-amber-600" />
            <span>Seed Masters</span>
          </button>
        )}
        <button
          type="button"
          onClick={loadData}
          title="Refresh Data"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
        >
          <RotateCw size={13} className={loading ? 'animate-spin text-purple-700' : 'text-slate-500'} />
          <span>Refresh</span>
        </button>
        <button
          type="button"
          onClick={handleExportCSV}
          disabled={filteredItems.length === 0}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50 transition"
        >
          <Download size={13} className="text-slate-500" />
          <span>Export CSV</span>
        </button>
        <Link
          to={`/module/hrms/${config.key}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 shadow-2xs hover:bg-blue-100 transition"
          title="Open in dedicated separate full page"
        >
          <ExternalLink size={13} />
          <span>Dedicated View</span>
        </Link>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="btn btn-save btn-sm text-xs py-1 px-3"
        >
          <Plus size={14} /> Add {config.singular}
        </button>
      </PageHeader>

      {/* ========================================================= */}
      {/* TABS BAR: STRICTLY SEPARATED BY MODULE                    */}
      {/* ========================================================= */}
      {config.group === 'Organization' ? (
        /* ORGANIZATION MASTERS ONLY (Departments, Designations, Branches) */
        <div className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-1">
                Organization Masters
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'department', label: 'Departments', icon: Briefcase },
                  { key: 'designation', label: 'Designations', icon: Award },
                  { key: 'branch', label: 'Branches', icon: GitBranch }
                ].map(tab => {
                  const TabIcon = tab.icon
                  const isActive = activeKey === tab.key
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => navigate(`/module/hrms/organization/${tab.key}`)}
                      className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                        isActive
                          ? 'bg-purple-900 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-purple-50 hover:text-purple-900'
                      }`}
                    >
                      <TabIcon size={15} />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center">
              <button
                type="button"
                onClick={() => navigate('/module/hrms/location-master/country')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50/70 px-3 py-1.5 text-xs font-bold text-purple-900 hover:bg-purple-100 transition shadow-2xs"
              >
                <Globe size={14} className="text-purple-700" />
                <span>Switch to Location Hierarchy (Country, Zone, State...)</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* LOCATION HIERARCHY ONLY (7-Level Chain: Country -> Zone -> Region -> State -> Cluster -> District -> Posting Location) */
        <div className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-xs space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Geographic Location Hierarchy (1 ➔ 7)
              </span>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200/80">
                Level {config.level || 1} of 7: {config.singular}
              </span>
            </div>

            <button
              type="button"
              onClick={() => navigate('/module/hrms/organization/department')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 hover:underline"
            >
              <Briefcase size={13} />
              <span>Switch to Organization Masters (Departments, Designations, Branches)</span>
              <ChevronRight size={12} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {[
              { key: 'country', step: 1, label: 'Country', icon: Globe },
              { key: 'zone', step: 2, label: 'Zone', icon: Layers },
              { key: 'region', step: 3, label: 'Region', icon: Compass },
              { key: 'state', step: 4, label: 'State', icon: Landmark },
              { key: 'cluster', step: 5, label: 'Cluster', icon: Network },
              { key: 'district', step: 6, label: 'District', icon: MapPin },
              { key: 'location', step: 7, label: 'Posting Location', icon: Navigation }
            ].map((tab, idx) => {
              const TabIcon = tab.icon
              const isActive = activeKey === tab.key
              return (
                <React.Fragment key={tab.key}>
                  <button
                    type="button"
                    onClick={() => navigate(`/module/hrms/location-master/${tab.key}`)}
                    className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isActive
                        ? 'bg-purple-900 text-white shadow-xs ring-2 ring-purple-300/60'
                        : 'bg-slate-50 text-slate-700 hover:bg-purple-50 hover:text-purple-900 border border-slate-200/70'
                    }`}
                  >
                    <span className={`inline-flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold ${
                      isActive ? 'bg-purple-800 text-white' : 'bg-white text-slate-600 shadow-2xs'
                    }`}>
                      {tab.step}
                    </span>
                    <TabIcon size={14} />
                    <span>{tab.label}</span>
                  </button>
                  {idx < 6 && (
                    <ChevronRight size={13} className="text-slate-300 shrink-0" />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>
      )}



      {/* ========================================================= */}
      {/* KPI METRIC CARDS                                          */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total {config.label}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{kpis.total}</span>
            <span className="text-xs text-slate-400">records</span>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
            Active Status
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{kpis.active}</span>
            <span className="text-xs text-emerald-600">in use</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Inactive / Draft
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-700">{kpis.inactive}</span>
            <span className="text-xs text-slate-400">disabled</span>
          </div>
        </div>

        <div className="rounded-2xl border border-purple-100 bg-purple-50/40 p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-purple-900 uppercase tracking-wider">
            {config.parentType ? `Mapped to ${config.parentType}` : 'Apex Category'}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-950">
              {config.parentType ? kpis.withParent : 'Root Node'}
            </span>
            <span className="text-xs text-purple-700">
              {config.parentType ? 'linked' : 'no parent required'}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SEARCH AND FILTER BAR                                     */}
      {/* ========================================================= */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-3 shadow-2xs">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={`Search ${config.label.toLowerCase()} by name, code, parent or notes...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Parent filter */}
          {parentOptions.length > 0 && (
            <select
              value={parentFilter}
              onChange={(e) => setParentFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-purple-600 focus:outline-none"
            >
              <option value="">All {config.parentType}s</option>
              {parentOptions.map(p => (
                <option key={p.id} value={p.id}>{p.setupName}</option>
              ))}
            </select>
          )}

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-purple-600 focus:outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* ========================================================= */}
      {/* DATA TABLE                                                */}
      {/* ========================================================= */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <RotateCw size={28} className="animate-spin text-purple-700 mb-3" />
            <p className="text-xs font-semibold text-slate-600">Loading {config.label} records...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-700 mb-3">
              <IconComponent size={26} />
            </div>
            <h3 className="text-base font-bold text-slate-900">No {config.label} Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
              {typeItems.length === 0
                ? `No ${config.label.toLowerCase()} have been registered yet. Add your first ${config.singular.toLowerCase()} to establish the organizational structure.`
                : 'No records matched your current search filters.'}
            </p>
            {typeItems.length === 0 ? (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-1.5 rounded-xl bg-purple-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-950 transition"
              >
                <Plus size={15} />
                <span>Add First {config.singular}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setSearchTerm(''); setParentFilter(''); setStatusFilter('ALL'); }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">{config.singular} Name</th>
                  {config.parentType && (
                    <th className="px-4 py-3">Parent {config.parentType}</th>
                  )}
                  <th className="px-3 py-3 text-center">Sort Order</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Setup Code */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-800 border border-slate-200/80">
                        {item.setupCode || '—'}
                      </span>
                    </td>

                    {/* Setup Name */}
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 text-sm">
                        {item.setupName}
                      </div>
                    </td>

                    {/* Parent Mapping & Ancestral Lineage */}
                    {config.parentType && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        {item.parentName ? (
                          <div className="space-y-0.5">
                            <div className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-900 border border-purple-200/60">
                              <span className="text-[10px] text-purple-600 font-bold uppercase">{item.parentType || config.parentType}:</span>
                              <span>{item.parentName}</span>
                            </div>
                            {(() => {
                              let meta = null
                              try {
                                meta = typeof item.metadataJson === 'string' ? JSON.parse(item.metadataJson) : item.metadataJson
                              } catch {}
                              const lineage = meta?.hierarchyPath || (meta?.countryName ? `${meta.countryName}${meta.zoneName ? ` › ${meta.zoneName}` : ''}` : '')
                              return lineage ? (
                                <div className="text-[10px] text-slate-500 font-medium truncate max-w-[220px]" title={lineage}>
                                  <span className="text-slate-400 font-normal">Ancestry:</span> {lineage}
                                </div>
                              ) : null
                            })()}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>
                    )}

                    {/* Sort Order */}
                    <td className="px-3 py-3 text-center font-bold text-slate-600">
                      {item.sortOrder ?? 0}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(item)}
                        title="Click to toggle status"
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold border transition ${
                          item.isActive
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${item.isActive ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                        <span>{item.isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>

                    {/* Notes */}
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                      {item.notes || '—'}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          title={`Edit ${config.singular}`}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-purple-50 hover:text-purple-700 transition"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmItem(item)}
                          title={`Delete ${config.singular}`}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-700 transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>



      {/* ========================================================= */}
      {/* IN-CONTENT DELETE CONFIRMATION PANEL                      */}
      {/* ========================================================= */}
      {deleteConfirmItem && (
        <div className="rounded-2xl border-2 border-rose-300 bg-rose-50/50 p-5 shadow-sm animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirm Delete: {config.singular}</h3>
                <p className="text-xs text-slate-600">
                  Are you sure you want to delete <strong className="text-slate-900">&quot;{deleteConfirmItem.setupName}&quot;</strong>? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                disabled={submitting}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
              >
                {submitting && <RotateCw size={14} className="animate-spin" />}
                <span>Yes, Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
