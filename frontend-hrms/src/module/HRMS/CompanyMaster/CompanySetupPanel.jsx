import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Award,
  Briefcase,
  Building2,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Compass,
  CreditCard,
  Edit3,
  ExternalLink,
  FileText,
  GitBranch,
  Globe,
  Hash,
  Landmark,
  Layers,
  MapPin,
  Navigation,
  Network,
  Plus,
  ArrowLeft,
  RefreshCw,
  Search,
  ShieldCheck,
  Sliders,
  Trash2,
  Users,
  X,
  Sparkles,
} from 'lucide-react'
import { getPrioritizedParentTypes, resolveLocationAncestry } from '../../../utils/locationHierarchy'
import {
  createCompanySetupItem,
  deleteCompanySetupItem,
  getCompanySetup,
  updateCompanySetupItem,
} from '../../../api/companySetup'
import { getCompanySequences, getPreviewSequence, updateCompanySequence } from '../../../api/sequences'
import { listProjects } from '../../../api/projects'
import { useConfirm } from '../../../components/ConfirmProvider'

// Standard Enterprise Prefix Dictionary for Auto-Generated IDs
export const MASTER_PREFIXES = {
  Country: 'CTRY',
  Zone: 'ZONE',
  Region: 'REG',
  State: 'ST',
  Cluster: 'CLS',
  District: 'DST',
  Branch: 'BR',
  Location: 'LOC',
  Department: 'DEP',
  SubDepartment: 'SDEP',
  Designation: 'DES',
  Grade: 'GRD',
  Shift: 'SFT',
  CostCenter: 'CC',
  EmploymentType: 'EMPT',
  Holiday: 'HOL',
  LeaveType: 'LV',
  ReportingHierarchy: 'RPT',
}

export function generateAutoCode(itemType, existingItems = []) {
  const prefix = MASTER_PREFIXES[itemType] || (itemType ? itemType.slice(0, 3).toUpperCase() : 'MAS')
  const matching = (existingItems || []).filter(i => i.itemType === itemType)
  const existingCodes = new Set(matching.map(i => (i.setupCode || '').toUpperCase()))

  for (let seq = matching.length + 1; seq <= 9999; seq++) {
    const candidate = `${prefix}-${String(seq).padStart(3, '0')}`
    if (!existingCodes.has(candidate)) return candidate
  }
  return `${prefix}-${Math.floor(100 + Math.random() * 900)}`
}

// All Setup Masters categorized cleanly with clean light theme styling (16 Complete Enterprise Masters)
export const SETUP_MASTERS = [
  // --- Category 1: Location Hierarchy (Strict 7 Levels) ---
  {
    key: 'Country',
    itemType: 'Country',
    label: 'Country',
    plural: 'Countries',
    category: 'Location Hierarchy',
    level: 1,
    levelTag: 'Level 1 • Apex',
    icon: Globe,
    lightIconBg: 'bg-blue-50 text-blue-600 border-blue-200/80',
    activeIconBg: 'bg-blue-600 text-white',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    parentTypes: [],
    parentRequired: false,
    routePath: '/module/hrms/country',
    description: 'National apex boundary (e.g. India, International entities)',
  },
  {
    key: 'Zone',
    itemType: 'Zone',
    label: 'Zone',
    plural: 'Zones',
    category: 'Location Hierarchy',
    level: 2,
    levelTag: 'Level 2 • Macro Zone',
    icon: Layers,
    lightIconBg: 'bg-slate-100 text-slate-700 border-slate-200',
    activeIconBg: 'bg-slate-800 text-white',
    badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
    parentTypes: ['Country'],
    parentRequired: true,
    routePath: '/module/hrms/zone',
    description: 'Macro operational zones (e.g. East Zone, North Zone, Central Zone)',
  },
  {
    key: 'Region',
    itemType: 'Region',
    label: 'Region',
    plural: 'Regions',
    category: 'Location Hierarchy',
    level: 3,
    levelTag: 'Level 3 • Region',
    icon: Compass,
    lightIconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200/80',
    activeIconBg: 'bg-indigo-600 text-white',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    parentTypes: ['Zone', 'Country'],
    parentRequired: true,
    routePath: '/module/hrms/region',
    description: 'Multi-state regional divisions for operations control',
  },
  {
    key: 'State',
    itemType: 'State',
    label: 'State',
    plural: 'States',
    category: 'Location Hierarchy',
    level: 4,
    levelTag: 'Level 4 • State',
    icon: Landmark,
    lightIconBg: 'bg-teal-50 text-teal-600 border-teal-200/80',
    activeIconBg: 'bg-teal-600 text-white',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
    parentTypes: ['Region', 'Zone'],
    parentRequired: true,
    routePath: '/module/hrms/state',
    description: 'State jurisdictions (e.g. Bihar, Jharkhand, Uttar Pradesh)',
  },
  {
    key: 'Cluster',
    itemType: 'Cluster',
    label: 'Cluster',
    plural: 'Clusters',
    category: 'Location Hierarchy',
    level: 5,
    levelTag: 'Level 5 • Cluster',
    icon: Network,
    lightIconBg: 'bg-amber-50 text-amber-600 border-amber-200/80',
    activeIconBg: 'bg-amber-600 text-white',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    parentTypes: ['State', 'Region'],
    parentRequired: true,
    routePath: '/module/hrms/cluster',
    description: 'Operational multi-district supervisory clusters (e.g. Patna Cluster, Tirhut)',
  },
  {
    key: 'District',
    itemType: 'District',
    label: 'District',
    plural: 'Districts',
    category: 'Location Hierarchy',
    level: 6,
    levelTag: 'Level 6 • District',
    icon: MapPin,
    lightIconBg: 'bg-sky-50 text-sky-600 border-sky-200/80',
    activeIconBg: 'bg-sky-600 text-white',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    parentTypes: ['Cluster', 'State'],
    parentRequired: true,
    routePath: '/module/hrms/district',
    description: 'Operational revenue districts (e.g. Patna, Gaya, Muzaffarpur)',
  },
  {
    key: 'Location',
    itemType: 'Location',
    label: 'Posting Location',
    plural: 'Posting Locations',
    category: 'Location Hierarchy',
    level: 7,
    levelTag: 'Level 7 • Duty Station',
    icon: Navigation,
    lightIconBg: 'bg-rose-50 text-rose-600 border-rose-200/80',
    activeIconBg: 'bg-rose-600 text-white',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    parentTypes: ['District', 'Branch', 'Cluster'],
    parentRequired: true,
    routePath: '/module/hrms/location',
    description: 'Specific employee duty stations with live GPS coordinates & geofence perimeter',
  },

  // --- Category 2: Organization Masters ---
  {
    key: 'Department',
    itemType: 'Department',
    label: 'Department',
    plural: 'Departments',
    category: 'Organization Masters',
    icon: Briefcase,
    lightIconBg: 'bg-blue-50 text-blue-600 border-blue-200/80',
    activeIconBg: 'bg-blue-600 text-white',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    parentTypes: ['Department'],
    parentRequired: false,
    routePath: '/module/hrms/department',
    description: 'Core functional divisions (Operations, IT, HR, Finance, Medical / 1962 Services)',
  },
  {
    key: 'Designation',
    itemType: 'Designation',
    label: 'Designation',
    plural: 'Designations',
    category: 'Organization Masters',
    icon: Award,
    lightIconBg: 'bg-purple-50 text-purple-600 border-purple-200/80',
    activeIconBg: 'bg-purple-600 text-white',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    parentTypes: ['Department'],
    parentRequired: false,
    routePath: '/module/hrms/designation',
    description: 'Official job titles, executive cadres, and seniority rank definitions',
  },
  {
    key: 'Branch',
    itemType: 'Branch',
    label: 'Branch Office',
    plural: 'Branch Offices',
    category: 'Organization Masters',
    icon: GitBranch,
    lightIconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
    activeIconBg: 'bg-emerald-600 text-white',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    parentTypes: ['Location', 'District', 'State'],
    parentRequired: false,
    routePath: '/module/hrms/branch',
    description: 'Physical branches, regional operating centers, and corporate facilities',
  },
  {
    key: 'ReportingHierarchy',
    itemType: 'ReportingHierarchy',
    label: 'Reporting Manager Setup',
    plural: 'Reporting Manager Setups',
    category: 'Organization Masters',
    icon: GitBranch,
    lightIconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200/80',
    activeIconBg: 'bg-indigo-600 text-white',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    parentTypes: ['Department'],
    parentRequired: false,
    routePath: '/module/hrms/reporting-manager',
    description: 'Company-wise & project-wise default L1/L2/L3 reporting manager chains, approval overrides, and fallback hierarchy',
  },

  // --- Category 3: Payroll & Work Structure ---
  {
    key: 'Grade',
    itemType: 'Grade',
    label: 'Grade / Band',
    plural: 'Grades & Bands',
    category: 'Payroll & Work Structure',
    icon: ShieldCheck,
    lightIconBg: 'bg-amber-50 text-amber-600 border-amber-200/80',
    activeIconBg: 'bg-amber-600 text-white',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    parentTypes: [],
    parentRequired: false,
    routePath: '/module/hrms/grade',
    description: 'Pay scale bands (e.g. M1, M2, E1), probation duration, and notice periods',
  },
  {
    key: 'Shift',
    itemType: 'Shift',
    label: 'Work Shift',
    plural: 'Work Shifts',
    category: 'Payroll & Work Structure',
    icon: Clock,
    lightIconBg: 'bg-cyan-50 text-cyan-600 border-cyan-200/80',
    activeIconBg: 'bg-cyan-600 text-white',
    badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    parentTypes: [],
    parentRequired: false,
    routePath: '/module/hrms/shift',
    description: 'Attendance rosters, shift start/end windows, grace rules, and night allowances',
  },
  {
    key: 'CostCenter',
    itemType: 'CostCenter',
    label: 'Cost Center',
    plural: 'Cost Centers',
    category: 'Payroll & Work Structure',
    icon: CreditCard,
    lightIconBg: 'bg-violet-50 text-violet-600 border-violet-200/80',
    activeIconBg: 'bg-violet-600 text-white',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
    parentTypes: [],
    parentRequired: false,
    routePath: '/module/hrms/cost-center',
    description: 'Accounting cost heads for project-level and departmental payroll allocation',
  },
  {
    key: 'EmploymentType',
    itemType: 'EmploymentType',
    label: 'Employment Type',
    plural: 'Employment Types',
    category: 'Payroll & Work Structure',
    icon: Users,
    lightIconBg: 'bg-rose-50 text-rose-600 border-rose-200/80',
    activeIconBg: 'bg-rose-600 text-white',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    parentTypes: [],
    parentRequired: false,
    routePath: '/module/hrms/employment-type',
    description: 'Regular Permanent, Contractual, Deputation, Consultant, and Trainee rules',
  },
  {
    key: 'Holiday',
    itemType: 'Holiday',
    label: 'Holiday Calendar',
    plural: 'Holiday Calendars',
    category: 'Payroll & Work Structure',
    icon: Calendar,
    lightIconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
    activeIconBg: 'bg-emerald-600 text-white',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    parentTypes: ['State', 'Country'],
    parentRequired: false,
    routePath: '/module/hrms/holiday-calendar',
    description: 'National gazetted, restricted, and state public holidays for payroll and leave runs',
  },
  {
    key: 'LeaveType',
    itemType: 'LeaveType',
    label: 'Leave Type',
    plural: 'Leave Types',
    category: 'Payroll & Work Structure',
    icon: FileText,
    lightIconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200/80',
    activeIconBg: 'bg-indigo-600 text-white',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    parentTypes: [],
    parentRequired: false,
    routePath: '/module/hrms/leave-type',
    description: 'Casual Leave (CL), Sick (SL), Earned (EL), Maternity (ML), and Loss of Pay (LOP) quotas',
  },
]

// Helper to safely parse metadata JSON
function parseMeta(jsonStr) {
  if (!jsonStr) return {}
  try {
    return JSON.parse(jsonStr) || {}
  } catch {
    return {}
  }
}

// Default initial meta state
const DEFAULT_META = {
  // Location
  latitude: '',
  longitude: '',
  geofenceRadius: 200,
  locationCategory: 'Urban',
  // Shift
  startTime: '09:00',
  endTime: '18:00',
  graceMinutes: 15,
  halfDayHours: 4.5,
  isNightShift: false,
  // Grade
  bandLevel: 'Executive',
  minSalary: '',
  maxSalary: '',
  probationDays: 90,
  noticeDays: 30,
  // Branch
  address: '',
  city: '',
  phone: '',
  email: '',
  branchHead: '',
  // Department
  departmentHead: '',
  costCenterLink: '',
  // Designation
  cadre: 'Executive',
  minExpYears: 1,
  // Cost Center
  expenseHead: 'Operations',
  budget: '',
  // Employment Type
  isPfEligible: true,
  isEsicEligible: true,
  isLeaveEligible: true,
  contractMonths: '',
  // Holiday
  holidayDate: '',
  holidayType: 'Gazetted',
  applicableFor: 'All Locations',
  // Leave Type
  leaveCategory: 'Paid',
  annualQuotaDays: 12,
  carryForwardLimit: 30,
  requiresProof: false,
  // Reporting Hierarchy (Company-Wise & Project-Wise Default)
  hierarchyScope: 'CompanyDefault',
  projectName: '',
  projectId: '',
  l1ManagerRole: 'Project Manager / Direct Lead',
  l1DefaultName: '',
  l2ManagerRole: 'Department Head (HOD) / Project Director',
  l2DefaultName: '',
  l3ManagerRole: 'General Manager / HR Head',
  l3DefaultName: '',
  approvalPriority: 'ProjectFirst',
  autoFallbackToCompany: true,
  appliesToAttendance: true,
  appliesToLeaves: true,
  appliesToTourPlans: true,
  // Country
  currencyCode: 'INR',
  dialCode: '+91',
  // Regional Head
  inchargeName: '',
}

export default function CompanySetupPanel({ companyId, companyName, onStatsChange }) {
  const navigate = useNavigate()
  const confirm = useConfirm()

  // Selected master key
  const [selectedMasterKey, setSelectedMasterKey] = useState('Country')

  // Category filter for left sidebar
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Search & filters for workspace table
  const [searchTerm, setSearchTerm] = useState('')
  const [parentFilter, setParentFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Projects list for project-wise manager hierarchy linkage
  const [projectsList, setProjectsList] = useState([])

  // Data state
  const [loading, setLoading] = useState(false)
  const [setupPayload, setSetupPayload] = useState({
    categories: [],
    items: [],
    countsByType: {},
  })

  // Modal create/edit state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create' | 'edit'
  const [editingItem, setEditingItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    setupCode: '',
    setupName: '',
    parentId: '',
    sortOrder: 0,
    notes: '',
    isActive: true,
    meta: { ...DEFAULT_META },
  })

  // Number Series & Sequence Modal State
  const [sequenceModalOpen, setSequenceModalOpen] = useState(false)
  const [sequences, setSequences] = useState([])
  const [loadingSequences, setLoadingSequences] = useState(false)
  const [editingSeq, setEditingSeq] = useState(null)
  const [savingSeq, setSavingSeq] = useState(false)

  const handleOpenSequenceModal = async () => {
    setSequenceModalOpen(true)
    if (!companyId) return
    setLoadingSequences(true)
    try {
      const data = await getCompanySequences(companyId)
      setSequences(data || [])
    } catch {
      setSequences([])
    } finally {
      setLoadingSequences(false)
    }
  }

  const handleSaveSequence = async (e) => {
    e.preventDefault()
    if (!companyId || !editingSeq) return
    setSavingSeq(true)
    try {
      await updateCompanySequence(companyId, {
        entityName: editingSeq.entityName,
        prefix: editingSeq.prefix,
        includeYear: editingSeq.includeYear,
        paddingLength: Number(editingSeq.paddingLength) || 3,
        nextNumber: editingSeq.nextNumber ? Number(editingSeq.nextNumber) : undefined,
        isActive: editingSeq.isActive !== false,
      })
      setEditingSeq(null)
      const data = await getCompanySequences(companyId)
      setSequences(data || [])
    } catch {
      // handled
    } finally {
      setSavingSeq(false)
    }
  }

  // Active master object
  const activeMaster = useMemo(
    () => SETUP_MASTERS.find(m => m.key === selectedMasterKey) || SETUP_MASTERS[0],
    [selectedMasterKey]
  )

  // Fetch setup data
  const loadData = async () => {
    if (!companyId) return
    setLoading(true)
    try {
      if (companyId) {
        listProjects({ companyId, status: 'all' })
          .then(projs => {
            if (Array.isArray(projs)) setProjectsList(projs)
          })
          .catch(() => {})
      }
      const res = await getCompanySetup(companyId)
      const items = res?.items || []
      const countsByType = {}
      items.forEach(it => {
        countsByType[it.itemType] = (countsByType[it.itemType] || 0) + 1
      })
      setSetupPayload({
        categories: res?.categories || [],
        items,
        countsByType,
      })
    } catch {
      setSetupPayload({ categories: [], items: [], countsByType: {} })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [companyId])

  // Reset filter when switching master
  useEffect(() => {
    setSearchTerm('')
    setParentFilter('')
    setStatusFilter('all')
  }, [selectedMasterKey])

  const countsByType = setupPayload.countsByType || {}
  const allItems = setupPayload.items || []

  // Filtered rows for currently active master
  const activeMasterRows = useMemo(() => {
    let rows = allItems.filter(i => i.itemType === activeMaster.itemType)

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      rows = rows.filter(r =>
        (r.setupName || '').toLowerCase().includes(q) ||
        (r.setupCode || '').toLowerCase().includes(q) ||
        (r.parentName || '').toLowerCase().includes(q) ||
        (r.notes || '').toLowerCase().includes(q) ||
        (r.metadataJson || '').toLowerCase().includes(q)
      )
    }

    if (parentFilter) {
      rows = rows.filter(r => String(r.parentId) === String(parentFilter))
    }

    if (statusFilter === 'active') {
      rows = rows.filter(r => !!r.isActive)
    } else if (statusFilter === 'inactive') {
      rows = rows.filter(r => !r.isActive)
    }

    return rows
  }, [allItems, activeMaster.itemType, searchTerm, parentFilter, statusFilter])

  // Prioritized parent types based on available tiers in company dataset
  const prioritizedParentTypes = useMemo(() => {
    return getPrioritizedParentTypes(activeMaster.itemType, allItems)
  }, [activeMaster.itemType, allItems])

  // Possible parents strictly filtered to the prioritized tier (e.g. Region shows ONLY Zone when Zone exists)
  const parentOptions = useMemo(() => {
    if (!prioritizedParentTypes || prioritizedParentTypes.length === 0) return []
    return allItems
      .filter(i => prioritizedParentTypes.includes(i.itemType) && i.isActive)
      .sort((a, b) => (a.setupName || '').localeCompare(b.setupName || ''))
  }, [allItems, prioritizedParentTypes])

  // Real-time ancestry relation preview for currently selected parent
  const selectedAncestry = useMemo(() => {
    return resolveLocationAncestry(formData.parentId, allItems)
  }, [formData.parentId, allItems])

  // Overall Setup Health Stats across 16 Masters
  const healthStats = useMemo(() => {
    const totalMasters = SETUP_MASTERS.length
    let configuredCount = 0

    SETUP_MASTERS.forEach(m => {
      if ((countsByType[m.itemType] || 0) > 0) configuredCount++
    })

    const percentage = Math.round((configuredCount / totalMasters) * 100)

    // Location Hierarchy (7 levels)
    const locMasters = SETUP_MASTERS.filter(m => m.category === 'Location Hierarchy')
    const locConfigured = locMasters.filter(m => (countsByType[m.itemType] || 0) > 0).length

    // Org Masters (3)
    const orgMasters = SETUP_MASTERS.filter(m => m.category === 'Organization Masters')
    const orgConfigured = orgMasters.filter(m => (countsByType[m.itemType] || 0) > 0).length

    // Payroll Masters (6)
    const payMasters = SETUP_MASTERS.filter(m => m.category === 'Payroll & Work Structure')
    const payConfigured = payMasters.filter(m => (countsByType[m.itemType] || 0) > 0).length

    let badgeText = 'Initial Setup Stage'
    let badgeColor = 'bg-amber-50 text-amber-700 border-amber-200'
    if (percentage >= 75) {
      badgeText = 'Production Ready'
      badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200'
    } else if (percentage >= 35) {
      badgeText = 'Partially Configured'
      badgeColor = 'bg-blue-50 text-blue-700 border-blue-200'
    }

    return {
      totalMasters,
      totalConfigured: configuredCount,
      percentage,
      badgeText,
      badgeColor,
      locTotal: locMasters.length,
      locConfigured,
      orgTotal: orgMasters.length,
      orgConfigured,
      payTotal: payMasters.length,
      payConfigured,
    }
  }, [countsByType])

  // Notify parent SetupCenter of readiness health stats for merged top card
  useEffect(() => {
    if (onStatsChange && healthStats) {
      onStatsChange(healthStats)
    }
  }, [healthStats, onStatsChange])

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalMode('create')
    setEditingItem(null)
    setFormData({
      setupCode: '',
      setupName: '',
      parentId: parentOptions.length === 1 ? parentOptions[0].id : '',
      sortOrder: (countsByType[activeMaster.itemType] || 0) + 1,
      notes: '',
      isActive: true,
      meta: { ...DEFAULT_META },
    })
    setModalOpen(true)
  }

  // Regenerate Code
  const handleRegenerateCode = async () => {
    try {
      const res = await getPreviewSequence(activeMaster.itemType, companyId)
      if (res?.code) {
        setFormData(prev => ({ ...prev, setupCode: res.code }))
        return
      }
    } catch {
      // fallback
    }
    const code = generateAutoCode(activeMaster.itemType, allItems)
    setFormData(prev => ({ ...prev, setupCode: code }))
  }

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setModalMode('edit')
    setEditingItem(item)
    const existingMeta = parseMeta(item.metadataJson)
    setFormData({
      setupCode: item.setupCode || '',
      setupName: item.setupName || '',
      parentId: item.parentId || '',
      sortOrder: item.sortOrder ?? 0,
      notes: item.notes || '',
      isActive: item.isActive !== false,
      meta: { ...DEFAULT_META, ...existingMeta },
    })
    setModalOpen(true)
  }

  // Save Modal (Create or Edit)
  const handleSaveModal = async (e) => {
    e.preventDefault()
    if (!formData.setupName.trim()) {
      alert('Name is required')
      return
    }

    if (activeMaster.parentRequired && !formData.parentId && parentOptions.length > 0) {
      alert(`Parent ${activeMaster.parentTypes.join('/')} is required for ${activeMaster.label}`)
      return
    }

    setSaving(true)
    try {
      const ancestry = resolveLocationAncestry(formData.parentId, allItems)
      const mergedMeta = {
        ...(formData.meta || {}),
        ...ancestry.relations,
      }

      const payload = {
        itemType: activeMaster.itemType,
        setupCode: editingItem ? (formData.setupCode?.trim().toUpperCase() || null) : null,
        setupName: formData.setupName.trim(),
        parentId: formData.parentId ? formData.parentId : null,
        sortOrder: Number(formData.sortOrder) || 0,
        notes: formData.notes?.trim() || null,
        isActive: !!formData.isActive,
        metadataJson: JSON.stringify(mergedMeta),
      }

      if (modalMode === 'edit' && editingItem) {
        await updateCompanySetupItem(companyId, editingItem.id, payload)
      } else {
        await createCompanySetupItem(companyId, payload)
      }

      setModalOpen(false)
      await loadData()
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to save item')
    } finally {
      setSaving(false)
    }
  }

  // Delete item
  const handleDelete = async (item) => {
    const ok = await confirm({
      message: `Delete ${activeMaster.label} "${item.setupName}"?`,
      confirmLabel: 'Delete',
      tone: 'danger',
    })
    if (!ok) return

    try {
      await deleteCompanySetupItem(companyId, item.id)
      await loadData()
    } catch (err) {
      alert(err?.response?.data?.message || 'Delete failed')
    }
  }

  // Toggle active status
  const handleToggleStatus = async (item) => {
    try {
      await updateCompanySetupItem(companyId, item.id, {
        itemType: item.itemType,
        setupCode: item.setupCode,
        setupName: item.setupName,
        parentId: item.parentId,
        sortOrder: item.sortOrder,
        notes: item.notes,
        metadataJson: item.metadataJson,
        isActive: !item.isActive,
      })
      await loadData()
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update status')
    }
  }

  const ActiveIcon = activeMaster.icon

  // Location Hierarchy 7-level list
  const locationHierarchyMasters = useMemo(
    () => SETUP_MASTERS.filter(m => m.category === 'Location Hierarchy').sort((a, b) => a.level - b.level),
    []
  )

  // Org Masters list
  const orgMastersList = useMemo(
    () => SETUP_MASTERS.filter(m => m.category === 'Organization Masters'),
    []
  )

  // Payroll Masters list (6 items)
  const payrollMastersList = useMemo(
    () => SETUP_MASTERS.filter(m => m.category === 'Payroll & Work Structure'),
    []
  )

  // Render contextual badge column for table row
  const renderRowAttributes = (row) => {
    const meta = parseMeta(row.metadataJson)
    const key = activeMaster.key

    switch (key) {
      case 'Location':
        return (
          <div className="flex flex-col gap-1">
            <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 rounded px-2 py-0.5">
              <Navigation size={10} className="text-rose-600" />
              {meta.latitude && meta.longitude ? `${meta.latitude}, ${meta.longitude} (±${meta.geofenceRadius || 200}m)` : 'GPS Unset'}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Zone: {meta.locationCategory || 'Urban'}</span>
          </div>
        )
      case 'Shift':
        return (
          <div className="flex flex-col gap-1">
            <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-cyan-800 bg-cyan-50 border border-cyan-200/80 rounded px-2 py-0.5">
              <Clock size={10} className="text-cyan-600" />
              {meta.startTime || '09:00'} - {meta.endTime || '18:00'}
            </span>
            <span className="text-[10px] text-slate-500">
              Grace: {meta.graceMinutes || 15}m {meta.isNightShift && '• 🌙 Night Shift'}
            </span>
          </div>
        )
      case 'Grade':
        return (
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 inline-flex items-center gap-1">
              Band: {meta.bandLevel || 'Staff'} {meta.minSalary ? `(₹${Number(meta.minSalary).toLocaleString('en-IN')} - ₹${Number(meta.maxSalary).toLocaleString('en-IN')})` : ''}
            </span>
            <span className="text-[10px] text-slate-500">Probation: {meta.probationDays || 90}d • Notice: {meta.noticeDays || 30}d</span>
          </div>
        )
      case 'Branch':
        return (
          <div className="flex flex-col gap-1 text-[11px]">
            <span className="font-semibold text-slate-800">{meta.city || 'HQ Office'}</span>
            <span className="text-[10px] text-slate-500 truncate max-w-xs">{meta.phone || meta.email || meta.address || '—'}</span>
          </div>
        )
      case 'Department':
        return (
          <div className="flex flex-col gap-0.5 text-[11px]">
            <span className="font-semibold text-slate-800">HOD: {meta.departmentHead || 'Unassigned'}</span>
            {meta.costCenterLink && <span className="text-[10px] text-slate-500">Cost: {meta.costCenterLink}</span>}
          </div>
        )
      case 'Designation':
        return (
          <div className="flex items-center gap-2">
            <span className="rounded bg-purple-50 border border-purple-200 px-2 py-0.5 text-[10px] font-bold text-purple-700">
              {meta.cadre || 'Executive'}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Min Exp: {meta.minExpYears || 0}y</span>
          </div>
        )
      case 'CostCenter':
        return (
          <div className="flex flex-col gap-0.5 text-[11px]">
            <span className="font-semibold text-violet-800">{meta.expenseHead || 'Operational'}</span>
            {meta.budget && <span className="text-[10px] text-slate-500">Budget: ₹{Number(meta.budget).toLocaleString('en-IN')}</span>}
          </div>
        )
      case 'EmploymentType':
        return (
          <div className="flex flex-wrap gap-1">
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${meta.isPfEligible ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
              PF {meta.isPfEligible ? '✓' : '✗'}
            </span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${meta.isEsicEligible ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-500'}`}>
              ESIC {meta.isEsicEligible ? '✓' : '✗'}
            </span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${meta.isLeaveEligible ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-slate-100 text-slate-500'}`}>
              Leave {meta.isLeaveEligible ? '✓' : '✗'}
            </span>
          </div>
        )
      case 'Holiday':
        return (
          <div className="flex flex-col gap-1">
            <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5">
              <Calendar size={10} className="text-emerald-600" />
              {meta.holidayDate || 'Date Pending'}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Type: {meta.holidayType || 'Gazetted'} • {meta.applicableFor || 'All'}</span>
          </div>
        )
      case 'LeaveType':
        return (
          <div className="flex flex-col gap-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 rounded px-2 py-0.5">
              <FileText size={10} className="text-indigo-600" />
              Quota: {meta.annualQuotaDays || 12} Days/Year ({meta.leaveCategory || 'Paid'})
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              Carry Fwd: {meta.carryForwardLimit || 0}d {meta.requiresProof && '• Doc Required'}
            </span>
          </div>
        )
      case 'ReportingHierarchy':
        return (
          <div className="flex flex-col gap-1 text-[11px]">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`px-2 py-0.5 rounded font-bold text-[10px] border ${
                meta.hierarchyScope === 'ProjectWise'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : meta.hierarchyScope === 'DepartmentDefault'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {meta.hierarchyScope === 'ProjectWise'
                  ? `Project: ${meta.projectName || 'Operational Unit'}`
                  : meta.hierarchyScope === 'DepartmentDefault'
                  ? 'Department Default'
                  : 'Company Default'}
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-semibold border border-slate-200">
                {meta.approvalPriority === 'ProjectFirst' ? 'Project First' : 'Company HOD First'}
              </span>
            </div>
            <div className="text-[10px] text-slate-600 font-mono flex items-center gap-1 flex-wrap">
              <span className="font-bold text-slate-800">L1:</span> {meta.l1ManagerRole || 'Project Lead'}
              <span className="text-slate-400">&rarr;</span>
              <span className="font-bold text-slate-800">L2:</span> {meta.l2ManagerRole || 'HOD'}
              <span className="text-slate-400">&rarr;</span>
              <span className="font-bold text-slate-800">L3:</span> {meta.l3ManagerRole || 'HR Head'}
            </div>
            <div className="text-[9px] text-slate-400 flex items-center gap-1">
              <span>{meta.autoFallbackToCompany ? 'Auto HOD Fallback ✓' : 'Strict Approval'}</span>
              <span>•</span>
              <span>{meta.appliesToAttendance && 'Attendance '} {meta.appliesToLeaves && 'Leaves '} {meta.appliesToTourPlans && 'Tours'}</span>
            </div>
          </div>
        )
      case 'Country':
        return (
          <span className="text-[11px] font-mono text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-0.5">
            Currency: {meta.currencyCode || 'INR'} • Dial: {meta.dialCode || '+91'}
          </span>
        )
      default:
        return (
          <span className="text-[11px] text-slate-500">
            {meta.inchargeName ? `In-Charge: ${meta.inchargeName}` : 'Standard Jurisdiction'}
          </span>
        )
    }
  }

  return (
    <div className="space-y-5 antialiased">
      {/* =========================================================================
          MAIN TWO-COLUMN WORKSPACE (RENDERED WHEN NOT EDITING/CREATING):
          LEFT (Feature Plan & Dropdowns) | RIGHT (Main Master Data Table & CRUD)
          ========================================================================= */}
      {!modalOpen && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* =======================================================================
            LEFT SIDE (lg:col-span-4):
            EXECUTIVE MASTER NAVIGATOR & ACTIONS (CLEAN DOMAIN-BASED DESIGN)
            ======================================================================= */}
        <div className="lg:col-span-4 space-y-3.5">
          {/* Master Control Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
            {/* 3 Domain Category Segmented Tabs */}
            <div className="mb-3.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
                Master Domain Category
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100/90 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    if (activeMaster.category !== 'Location Hierarchy') {
                      setSelectedMasterKey(locationHierarchyMasters[0].key)
                    }
                  }}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-center transition ${
                    activeMaster.category === 'Location Hierarchy'
                      ? 'bg-white text-blue-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  <span className="text-[11px] flex items-center gap-1">
                    <Globe size={12} className={activeMaster.category === 'Location Hierarchy' ? 'text-blue-600' : 'text-slate-400'} />
                    Location
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">{healthStats.locConfigured}/7</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (activeMaster.category !== 'Organization Masters') {
                      setSelectedMasterKey(orgMastersList[0].key)
                    }
                  }}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-center transition ${
                    activeMaster.category === 'Organization Masters'
                      ? 'bg-white text-purple-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  <span className="text-[11px] flex items-center gap-1">
                    <Briefcase size={12} className={activeMaster.category === 'Organization Masters' ? 'text-purple-600' : 'text-slate-400'} />
                    Org
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">{healthStats.orgConfigured}/3</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (activeMaster.category !== 'Payroll & Work Structure') {
                      setSelectedMasterKey(payrollMastersList[0].key)
                    }
                  }}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-center transition ${
                    activeMaster.category === 'Payroll & Work Structure'
                      ? 'bg-white text-teal-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  <span className="text-[11px] flex items-center gap-1">
                    <CreditCard size={12} className={activeMaster.category === 'Payroll & Work Structure' ? 'text-teal-600' : 'text-slate-400'} />
                    Payroll
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">{healthStats.payConfigured}/6</span>
                </button>
              </div>
            </div>

            {/* Domain-Filtered Master Selector Dropdown */}
            <div className="mb-3.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1.5">
                <span className="uppercase tracking-wider">
                  {activeMaster.category === 'Location Hierarchy' ? 'Select Location Level' :
                   activeMaster.category === 'Organization Masters' ? 'Select Org Master' :
                   'Select Payroll Policy'}
                </span>
                <span className="text-blue-600 font-semibold">
                  {countsByType[activeMaster.itemType] || 0} {countsByType[activeMaster.itemType] === 1 ? 'record' : 'records'}
                </span>
              </div>
              <select
                value={selectedMasterKey}
                onChange={(e) => setSelectedMasterKey(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-2xs focus:border-blue-500 focus:outline-none transition cursor-pointer"
              >
                {activeMaster.category === 'Location Hierarchy' &&
                  locationHierarchyMasters.map(m => (
                    <option key={m.key} value={m.key}>
                      L{m.level} • {m.label} ({countsByType[m.itemType] || 0} records)
                    </option>
                  ))}

                {activeMaster.category === 'Organization Masters' &&
                  orgMastersList.map(m => (
                    <option key={m.key} value={m.key}>
                      {m.label} ({countsByType[m.itemType] || 0} records)
                    </option>
                  ))}

                {activeMaster.category === 'Payroll & Work Structure' &&
                  payrollMastersList.map(m => (
                    <option key={m.key} value={m.key}>
                      {m.label} ({countsByType[m.itemType] || 0} records)
                    </option>
                  ))}
              </select>
            </div>

            {/* Primary Action Button */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleOpenCreate}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-98 transition"
              >
                <Plus size={15} /> Add New {activeMaster.label}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleOpenSequenceModal}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                  title="Configure Number Series"
                >
                  <Hash size={13} className="text-blue-600" />
                  Series Config
                </button>
                <button
                  type="button"
                  onClick={loadData}
                  disabled={loading}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs disabled:opacity-50"
                >
                  <RefreshCw size={13} className={loading ? 'animate-spin text-blue-600' : 'text-slate-500'} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Interactive List for Active Category */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {activeMaster.category === 'Location Hierarchy' && <Globe size={15} className="text-blue-600" />}
                {activeMaster.category === 'Organization Masters' && <Briefcase size={15} className="text-purple-600" />}
                {activeMaster.category === 'Payroll & Work Structure' && <CreditCard size={15} className="text-teal-600" />}
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  {activeMaster.category === 'Location Hierarchy' ? 'Location Hierarchy (7 Levels)' :
                   activeMaster.category === 'Organization Masters' ? 'Organization Masters' :
                   'Payroll & HR Policies'}
                </span>
              </div>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">
                {activeMaster.category === 'Location Hierarchy' ? `${healthStats.locConfigured}/7` :
                 activeMaster.category === 'Organization Masters' ? `${healthStats.orgConfigured}/3` :
                 `${healthStats.payConfigured}/6`}
              </span>
            </div>

            <div className="space-y-1.5">
              {(activeMaster.category === 'Location Hierarchy' ? locationHierarchyMasters :
                activeMaster.category === 'Organization Masters' ? orgMastersList :
                payrollMastersList
              ).map((m) => {
                const Icon = m.icon
                const count = countsByType[m.itemType] || 0
                const isSelected = selectedMasterKey === m.key
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setSelectedMasterKey(m.key)}
                    className={`w-full flex items-center justify-between rounded-xl p-2.5 text-left transition ${
                      isSelected
                        ? 'border-2 border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-500/20'
                        : 'border border-slate-100 hover:border-slate-200 hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${isSelected ? m.activeIconBg : m.lightIconBg}`}>
                        <Icon size={14} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {m.level && (
                          <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-blue-700' : 'text-slate-400'}`}>
                            L{m.level}
                          </span>
                        )}
                        <span className={`text-xs font-bold ${isSelected ? 'text-blue-950' : 'text-slate-800'}`}>
                          {m.label}
                        </span>
                      </div>
                    </div>

                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      count > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* =======================================================================
            RIGHT SIDE (lg:col-span-8):
            MASTER DATA WORKSPACE (LIST, TABLE, SEARCH, FILTER, CRUD)
            ======================================================================= */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
            {/* Header of Active Master */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${activeMaster.lightIconBg} shadow-2xs`}>
                  <ActiveIcon size={20} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{activeMaster.plural}</h3>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${activeMaster.badgeClass}`}>
                      {activeMaster.levelTag || activeMaster.category}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                      {activeMasterRows.length} {activeMasterRows.length === 1 ? 'record' : 'records'}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{activeMaster.description}</p>
                </div>
              </div>

              {activeMaster.routePath && (
                <button
                  type="button"
                  onClick={() => navigate(activeMaster.routePath)}
                  className="btn btn-primary btn-xs gap-1.5 self-start sm:self-auto shadow-xs font-semibold"
                  title="Open dedicated separate page for this master"
                >
                  Open Dedicated Page <ExternalLink size={13} />
                </button>
              )}
            </div>

            {/* Filter and Search Bar for this Master */}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={`Search ${activeMaster.plural.toLowerCase()} by name, code...`}
                  className="input w-full pl-9 text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {parentOptions.length > 0 && (
                  <select
                    value={parentFilter}
                    onChange={(e) => setParentFilter(e.target.value)}
                    className="input text-xs"
                  >
                    <option value="">All Parents ({activeMaster.parentTypes.join('/')})</option>
                    {parentOptions.map(p => (
                      <option key={p.id} value={p.id}>{p.setupName}</option>
                    ))}
                  </select>
                )}

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input text-xs"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>

            {/* Master Data Table */}
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="border-b border-slate-200 bg-slate-50/80 font-semibold uppercase tracking-wider text-slate-600 text-[11px]">
                  <tr>
                    <th className="px-3.5 py-3">Code</th>
                    <th className="px-3.5 py-3">{activeMaster.label} Name</th>
                    {activeMaster.parentTypes.length > 0 && <th className="px-3.5 py-3">Parent Linkage</th>}
                    <th className="px-3.5 py-3">HR & Operational Config</th>
                    <th className="px-3.5 py-3">Sort</th>
                    <th className="px-3.5 py-3">Status</th>
                    <th className="px-3.5 py-3">Notes</th>
                    <th className="px-3.5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={activeMaster.parentTypes.length > 0 ? 8 : 7} className="px-4 py-10 text-center text-slate-500">
                        <RefreshCw size={22} className="mx-auto mb-2 animate-spin text-blue-600" />
                        Loading {activeMaster.plural.toLowerCase()}...
                      </td>
                    </tr>
                  ) : activeMasterRows.length === 0 ? (
                    <tr>
                      <td colSpan={activeMaster.parentTypes.length > 0 ? 8 : 7} className="px-4 py-12 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                          <ActiveIcon size={24} />
                        </div>
                        <div className="mt-3 text-sm font-bold text-slate-900">
                          No {activeMaster.plural} Configured Yet
                        </div>
                        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                          {searchTerm || parentFilter || statusFilter !== 'all'
                            ? 'No records matched your search filters.'
                            : `Add the first ${activeMaster.label.toLowerCase()} record to get started.`}
                        </p>
                        <button
                          type="button"
                          onClick={handleOpenCreate}
                          className="btn btn-primary btn-xs mt-3 gap-1.5 shadow-sm"
                        >
                          <Plus size={13} /> Add First {activeMaster.label}
                        </button>
                      </td>
                    </tr>
                  ) : (
                    activeMasterRows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-3.5 py-2.5 font-mono font-bold text-slate-800">
                          <span className="rounded border border-slate-200/80 bg-slate-100/80 px-2 py-0.5 text-xs text-slate-700">
                            {row.setupCode || '—'}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5">
                          <div className="font-bold text-slate-900">{row.setupName}</div>
                        </td>
                        {activeMaster.parentTypes.length > 0 && (
                          <td className="px-3.5 py-2.5">
                            {(() => {
                              const meta = parseMeta(row.metadataJson)
                              const lineage = meta.hierarchyPath || (meta.countryName ? `${meta.countryName}${meta.zoneName ? ` › ${meta.zoneName}` : ''}` : '')
                              return row.parentName ? (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-xs text-slate-800 font-medium">
                                    <span className="font-bold text-slate-900">{row.parentType || 'Parent'}:</span> {row.parentName}
                                  </span>
                                  {lineage && (
                                    <div className="text-[10px] text-slate-500 font-medium truncate max-w-[220px]" title={lineage}>
                                      <span className="text-slate-400 font-normal">Ancestry:</span> {lineage}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">None</span>
                              )
                            })()}
                          </td>
                        )}
                        <td className="px-3.5 py-2.5">
                          {renderRowAttributes(row)}
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-600 font-semibold">
                          {row.sortOrder ?? 0}
                        </td>
                        <td className="px-3.5 py-2.5">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(row)}
                            title="Click to toggle status"
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold transition ${
                              row.isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {row.isActive ? <Check size={11} /> : <X size={11} />}
                            {row.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="px-3.5 py-2.5 max-w-xs truncate text-slate-500 text-[11px]">
                          {row.notes || '—'}
                        </td>
                        <td className="px-3.5 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(row)}
                              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition shadow-2xs"
                              title="Edit"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(row)}
                              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:border-red-300 hover:text-red-700 hover:bg-red-50 transition shadow-2xs"
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* 5. ADD / EDIT FULL-SCREEN CONTENT AREA FORM */}
      {modalOpen && (
        <div className="w-full space-y-6 antialiased pb-8 animate-in fade-in">
          {/* Top Breadcrumb & Return to List */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="inline-flex items-center gap-1.5 font-medium text-slate-600 hover:text-blue-600 transition cursor-pointer"
              >
                <ArrowLeft size={16} /> Back to {activeMaster.label} Master
              </button>
              <ChevronRight size={14} className="text-slate-400" />
              <span className="text-slate-900 font-bold">
                {modalMode === 'edit' ? `Edit ${activeMaster.label}` : `Create New ${activeMaster.label}`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="btn btn-outline btn-sm cursor-pointer"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                disabled={saving}
                className="btn btn-primary btn-sm gap-1.5 shadow-sm cursor-pointer"
              >
                {saving && <RefreshCw size={14} className="animate-spin" />}
                {modalMode === 'edit' ? 'Save Changes' : `Save & Create ${activeMaster.label}`}
              </button>
            </div>
          </div>

          {/* Form Header Banner */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${activeMaster.lightIconBg} shadow-sm`}>
                <ActiveIcon size={28} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {modalMode === 'edit' ? `Edit ${activeMaster.label}` : `Create New ${activeMaster.label}`}
                  </h1>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200">
                    {activeMaster.category} • {activeMaster.levelTag || 'Enterprise Master'}
                  </span>
                  {editingItem && (
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-mono font-bold text-blue-700 border border-blue-200">
                      {formData.setupCode}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-500">{activeMaster.desc}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <form onSubmit={handleSaveModal} className="space-y-6">
              {/* Common Section: Name and Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    {activeMaster.label} Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.setupName}
                    onChange={(e) => setFormData(prev => ({ ...prev, setupName: e.target.value }))}
                    placeholder={`e.g. ${activeMaster.label === 'Country' ? 'India' : activeMaster.label === 'Shift' ? 'General Morning Shift' : activeMaster.label === 'Grade' ? 'Grade M1 - Senior Executive' : 'Operations'}`}
                    className="input w-full"
                  />
                </div>

                {editingItem && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                      System Code
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200 whitespace-nowrap">Registered</span>
                    </label>
                    <input
                      type="text"
                      disabled
                      value={formData.setupCode}
                      className="input w-full font-mono uppercase bg-slate-100/80 font-semibold text-slate-500 cursor-not-allowed"
                    />
                    <p className="mt-1 text-[10px] text-slate-400">Prefixed enterprise identifier assigned by system.</p>
                  </div>
                )}
              </div>

              {/* Parent dropdown with strict prioritized hierarchy & auto-linked relations */}
              {prioritizedParentTypes.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <span>Parent Linkage ({prioritizedParentTypes.join(' / ')})</span>
                      {activeMaster.parentRequired && <span className="text-red-500 font-bold">*</span>}
                    </label>
                    {prioritizedParentTypes.length === 1 && activeMaster.parentTypes.length > 1 && (
                      <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        Filtered to {prioritizedParentTypes[0]} tier
                      </span>
                    )}
                  </div>
                  <select
                    value={formData.parentId}
                    onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
                    className="input w-full"
                    required={activeMaster.parentRequired}
                  >
                    <option value="">-- Select Parent ({prioritizedParentTypes.join(' / ')}) --</option>
                    {parentOptions.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.setupName} ({p.itemType}) {p.setupCode ? `[${p.setupCode}]` : ''}
                      </option>
                    ))}
                  </select>
                  {parentOptions.length === 0 ? (
                    <p className="mt-1 text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                      ⚠️ Note: You must first configure a {prioritizedParentTypes.join(' or ')} before creating a {activeMaster.label}.
                    </p>
                  ) : null}

                  {/* Auto-Linked Ancestral Lineage Live Preview */}
                  {selectedAncestry.hierarchyPath && (
                    <div className="mt-2.5 rounded-xl border border-indigo-200/90 bg-indigo-50/60 p-3 text-xs shadow-2xs space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-indigo-900 text-[11px] uppercase tracking-wide">
                        <Sparkles size={13} className="text-indigo-600" />
                        Auto-Linked Ancestral Hierarchy
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 font-semibold text-indigo-950 text-xs">
                        <span className="bg-white/80 border border-indigo-200 px-2 py-0.5 rounded-md text-indigo-800">
                          {selectedAncestry.hierarchyPath}
                        </span>
                        <span className="text-indigo-400 font-bold">›</span>
                        <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-md font-bold shadow-2xs">
                          {formData.setupName || `(New ${activeMaster.label})`}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[11px] text-indigo-700 border-t border-indigo-100">
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

              {/* --- SPECIALIZED DYNAMIC HR ATTRIBUTES BASED ON MASTER KEY --- */}

              {/* A. Posting Location: Geofencing GPS Coordinates */}
              {activeMaster.key === 'Location' && (
                <div className="rounded-xl border border-rose-200/80 bg-rose-50/30 p-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900">
                    <Navigation size={14} className="text-rose-600" />
                    GPS Geofencing Configuration (Mobile Attendance Punch)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="label text-slate-700">Latitude</label>
                      <input
                        type="text"
                        value={formData.meta.latitude || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, latitude: e.target.value } }))}
                        placeholder="e.g. 25.5941"
                        className="input w-full font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="label text-slate-700">Longitude</label>
                      <input
                        type="text"
                        value={formData.meta.longitude || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, longitude: e.target.value } }))}
                        placeholder="e.g. 85.1376"
                        className="input w-full font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="label text-slate-700">Geofence Radius</label>
                      <input
                        type="number"
                        value={formData.meta.geofenceRadius || 200}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, geofenceRadius: Number(e.target.value) } }))}
                        placeholder="Meters (e.g. 200)"
                        className="input w-full text-xs"
                        min="50"
                        max="2000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label text-slate-700">Duty Station Classification</label>
                    <select
                      value={formData.meta.locationCategory || 'Urban'}
                      onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, locationCategory: e.target.value } }))}
                      className="input w-full text-xs"
                    >
                      <option value="Urban">Urban / Metro</option>
                      <option value="Semi-Urban">Semi-Urban</option>
                      <option value="Rural">Rural Field Unit</option>
                      <option value="Hardship Area">Difficult / Hardship Border Area</option>
                    </select>
                  </div>
                </div>
              )}

              {/* B. Work Shift: Timings, Grace Period, Night Shift */}
              {activeMaster.key === 'Shift' && (
                <div className="rounded-xl border border-cyan-200/80 bg-cyan-50/30 p-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-900">
                    <Clock size={14} className="text-cyan-600" />
                    Shift Windows & Attendance Rules
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label text-slate-700">Shift Start Time</label>
                      <input
                        type="time"
                        value={formData.meta.startTime || '09:00'}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, startTime: e.target.value } }))}
                        className="input w-full text-xs"
                      />
                    </div>
                    <div>
                      <label className="label text-slate-700">Shift End Time</label>
                      <input
                        type="time"
                        value={formData.meta.endTime || '18:00'}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, endTime: e.target.value } }))}
                        className="input w-full text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label text-slate-700">Grace Period (Minutes)</label>
                      <input
                        type="number"
                        value={formData.meta.graceMinutes || 15}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, graceMinutes: Number(e.target.value) } }))}
                        placeholder="e.g. 15"
                        className="input w-full text-xs"
                        min="0"
                        max="60"
                      />
                    </div>
                    <div>
                      <label className="label text-slate-700">Half-Day Threshold (Hours)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={formData.meta.halfDayHours || 4.5}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, halfDayHours: Number(e.target.value) } }))}
                        placeholder="e.g. 4.5"
                        className="input w-full text-xs"
                        min="1"
                        max="8"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="isNightShiftCheck"
                      checked={!!formData.meta.isNightShift}
                      onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, isNightShift: e.target.checked } }))}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="isNightShiftCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                      Night Shift (Crosses midnight & qualifies for night allowance)
                    </label>
                  </div>
                </div>
              )}

              {/* C. Grade / Band: Salary Bands, Probation, Notice Period */}
              {activeMaster.key === 'Grade' && (
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/30 p-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                    <ShieldCheck size={14} className="text-amber-600" />
                    Salary Band & Cadre Governance
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="label text-slate-700">Band Tier</label>
                      <select
                        value={formData.meta.bandLevel || 'Staff'}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, bandLevel: e.target.value } }))}
                        className="input w-full text-xs"
                      >
                        <option value="Executive">Executive / CXO</option>
                        <option value="Senior Management">Senior Management</option>
                        <option value="Mid Management">Mid Management</option>
                        <option value="Staff">Professional Staff</option>
                        <option value="Field Support">Field Operations</option>
                      </select>
                    </div>
                    <div>
                      <label className="label text-slate-700">Min Salary (₹)</label>
                      <input
                        type="number"
                        value={formData.meta.minSalary || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, minSalary: e.target.value } }))}
                        placeholder="e.g. 25000"
                        className="input w-full text-xs"
                      />
                    </div>
                    <div>
                      <label className="label text-slate-700">Max Salary (₹)</label>
                      <input
                        type="number"
                        value={formData.meta.maxSalary || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, maxSalary: e.target.value } }))}
                        placeholder="e.g. 50000"
                        className="input w-full text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label text-slate-700">Probation Period (Days)</label>
                      <input
                        type="number"
                        value={formData.meta.probationDays || 90}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, probationDays: Number(e.target.value) } }))}
                        className="input w-full text-xs"
                      />
                    </div>
                    <div>
                      <label className="label text-slate-700">Notice Period (Days)</label>
                      <input
                        type="number"
                        value={formData.meta.noticeDays || 30}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, noticeDays: Number(e.target.value) } }))}
                        className="input w-full text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* D. Branch Office: Address, Contact, Manager */}
              {activeMaster.key === 'Branch' && (
                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/30 p-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                    <Building2 size={14} className="text-emerald-600" />
                    Physical Facility & Contact Information
                  </div>
                  <div>
                    <label className="label text-slate-700">Branch Address</label>
                    <input
                      type="text"
                      value={formData.meta.address || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, address: e.target.value } }))}
                      placeholder="e.g. Plot No 42, Exhibition Road"
                      className="input w-full text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="label text-slate-700">City / District</label>
                      <input
                        type="text"
                        value={formData.meta.city || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, city: e.target.value } }))}
                        placeholder="e.g. Patna"
                        className="input w-full text-xs"
                      />
                    </div>
                    <div>
                      <label className="label text-slate-700">Contact Phone</label>
                      <input
                        type="text"
                        value={formData.meta.phone || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, phone: e.target.value } }))}
                        placeholder="e.g. 0612-2500000"
                        className="input w-full text-xs"
                      />
                    </div>
                    <div>
                      <label className="label text-slate-700">Branch Head / Lead</label>
                      <input
                        type="text"
                        value={formData.meta.branchHead || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, branchHead: e.target.value } }))}
                        placeholder="e.g. Regional Ops Lead"
                        className="input w-full text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* E. Holiday Calendar: Date, Type, Applicability */}
              {activeMaster.key === 'Holiday' && (
                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/30 p-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                    <Calendar size={14} className="text-emerald-600" />
                    Holiday Date & Statutory Classification
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="label text-slate-700">Holiday Date <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        required
                        value={formData.meta.holidayDate || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, holidayDate: e.target.value } }))}
                        className="input w-full text-xs"
                      />
                    </div>
                    <div>
                      <label className="label text-slate-700">Holiday Category</label>
                      <select
                        value={formData.meta.holidayType || 'Gazetted'}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, holidayType: e.target.value } }))}
                        className="input w-full text-xs"
                      >
                        <option value="National">National Public Holiday</option>
                        <option value="Gazetted">Gazetted Mandatory Holiday</option>
                        <option value="Restricted">Restricted / Optional Holiday</option>
                        <option value="State">State Specific Holiday</option>
                      </select>
                    </div>
                    <div>
                      <label className="label text-slate-700">Applicable Scope</label>
                      <select
                        value={formData.meta.applicableFor || 'All Locations'}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, applicableFor: e.target.value } }))}
                        className="input w-full text-xs"
                      >
                        <option value="All Locations">All Operating Locations</option>
                        <option value="State Specific">State Specific Only</option>
                        <option value="Field Units Only">Field Units Only</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* F. Leave Type: Quota, Paid/Unpaid, Carry Forward */}
              {activeMaster.key === 'LeaveType' && (
                <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/30 p-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                    <FileText size={14} className="text-indigo-600" />
                    Leave Entitlement & Accrual Policy
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="label text-slate-700">Leave Nature</label>
                      <select
                        value={formData.meta.leaveCategory || 'Paid'}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, leaveCategory: e.target.value } }))}
                        className="input w-full text-xs"
                      >
                        <option value="Paid">Paid Leave</option>
                        <option value="Unpaid">Unpaid / Loss of Pay (LOP)</option>
                        <option value="Statutory">Statutory Special Leave</option>
                      </select>
                    </div>
                    <div>
                      <label className="label text-slate-700">Annual Quota (Days)</label>
                      <input
                        type="number"
                        value={formData.meta.annualQuotaDays || 12}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, annualQuotaDays: Number(e.target.value) } }))}
                        className="input w-full text-xs"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="label text-slate-700">Max Carry Forward (Days)</label>
                      <input
                        type="number"
                        value={formData.meta.carryForwardLimit || 30}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, carryForwardLimit: Number(e.target.value) } }))}
                        className="input w-full text-xs"
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="requiresProofCheck"
                      checked={!!formData.meta.requiresProof}
                      onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, requiresProof: e.target.checked } }))}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="requiresProofCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                      Requires Supporting Document / Proof (e.g. Medical Certificate for Sick Leave)
                    </label>
                  </div>
                </div>
              )}

              {/* G. Employment Type: Statutory PF / ESIC Rules */}
              {activeMaster.key === 'EmploymentType' && (
                <div className="rounded-xl border border-rose-200/80 bg-rose-50/30 p-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900">
                    <Users size={14} className="text-rose-600" />
                    Statutory Benefit & Contract Rules
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!formData.meta.isPfEligible}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, isPfEligible: e.target.checked } }))}
                        className="rounded border-slate-300 text-blue-600"
                      />
                      <span className="text-xs font-medium text-slate-800">PF Eligible</span>
                    </label>
                    <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!formData.meta.isEsicEligible}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, isEsicEligible: e.target.checked } }))}
                        className="rounded border-slate-300 text-blue-600"
                      />
                      <span className="text-xs font-medium text-slate-800">ESIC Eligible</span>
                    </label>
                    <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!formData.meta.isLeaveEligible}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, isLeaveEligible: e.target.checked } }))}
                        className="rounded border-slate-300 text-blue-600"
                      />
                      <span className="text-xs font-medium text-slate-800">Paid Leave Accrual</span>
                    </label>
                  </div>
                  <div>
                    <label className="label text-slate-700">Contract Duration Cap (Months, leave empty for permanent)</label>
                    <input
                      type="number"
                      value={formData.meta.contractMonths || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, contractMonths: e.target.value } }))}
                      placeholder="e.g. 12 or 24 months"
                      className="input w-full text-xs"
                    />
                  </div>
                </div>
              )}

              {/* H. Department: HOD & Cost Center */}
              {activeMaster.key === 'Department' && (
                <div className="rounded-xl border border-blue-200/80 bg-blue-50/30 p-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                    <Briefcase size={14} className="text-blue-600" />
                    Department Governance & Head
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label text-slate-700">Head of Department (HOD)</label>
                      <input
                        type="text"
                        value={formData.meta.departmentHead || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, departmentHead: e.target.value } }))}
                        placeholder="e.g. Dr. Rajesh Kumar"
                        className="input w-full text-xs"
                      />
                    </div>
                    <div>
                      <label className="label text-slate-700">Default Cost Center</label>
                      <input
                        type="text"
                        value={formData.meta.costCenterLink || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, costCenterLink: e.target.value } }))}
                        placeholder="e.g. CC-OPS-01"
                        className="input w-full text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* I. Designation: Cadre & Min Experience */}
              {activeMaster.key === 'Designation' && (
                <div className="rounded-xl border border-purple-200/80 bg-purple-50/30 p-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                    <Award size={14} className="text-purple-600" />
                    Job Cadre & Experience Threshold
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label text-slate-700">Job Cadre</label>
                      <select
                        value={formData.meta.cadre || 'Executive'}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, cadre: e.target.value } }))}
                        className="input w-full text-xs"
                      >
                        <option value="Executive">Executive Leadership</option>
                        <option value="Medical / Paramedical">Medical / Paramedical (1962)</option>
                        <option value="Field Operations">Field Operations & Support</option>
                        <option value="Technical / IT">Technical & IT</option>
                        <option value="Administrative">Administrative & HR</option>
                      </select>
                    </div>
                    <div>
                      <label className="label text-slate-700">Min Experience Required (Years)</label>
                      <input
                        type="number"
                        value={formData.meta.minExpYears || 1}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, minExpYears: Number(e.target.value) } }))}
                        className="input w-full text-xs"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* J. Cost Center: Expense Head & Annual Budget */}
              {activeMaster.key === 'CostCenter' && (
                <div className="rounded-xl border border-violet-200/80 bg-violet-50/30 p-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-violet-900">
                    <CreditCard size={14} className="text-violet-600" />
                    Accounting Head & Allocation
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label text-slate-700">Expense Category / Head</label>
                      <input
                        type="text"
                        value={formData.meta.expenseHead || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, expenseHead: e.target.value } }))}
                        placeholder="e.g. Field Operations, IT Overhead"
                        className="input w-full text-xs"
                      />
                    </div>
                    <div>
                      <label className="label text-slate-700">Annual Budget Allocation (₹)</label>
                      <input
                        type="number"
                        value={formData.meta.budget || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, budget: e.target.value } }))}
                        placeholder="e.g. 5000000"
                        className="input w-full text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* K. Reporting Manager Setup (Company-wise and Project-wise Default & Hierarchy) */}
              {activeMaster.key === 'ReportingHierarchy' && (
                <div className="rounded-xl border border-indigo-200/90 bg-indigo-50/30 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                      <GitBranch size={15} className="text-indigo-600" />
                      Reporting Hierarchy Governance (Company-Wise & Project-Wise)
                    </div>
                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 rounded-full px-2 py-0.5">
                      Multi-Tier Approval Chain
                    </span>
                  </div>

                  {/* 1. Hierarchy Scope Selector */}
                  <div>
                    <label className="label text-slate-700 font-semibold mb-1">
                      Hierarchy Scope / Applicability <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <label className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                        formData.meta.hierarchyScope === 'CompanyDefault'
                          ? 'border-blue-600 bg-blue-50 font-bold text-blue-900 ring-1 ring-blue-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}>
                        <input
                          type="radio"
                          name="hierarchyScope"
                          value="CompanyDefault"
                          checked={formData.meta.hierarchyScope === 'CompanyDefault'}
                          onChange={() => setFormData(prev => ({
                            ...prev,
                            meta: { ...prev.meta, hierarchyScope: 'CompanyDefault', projectName: '' }
                          }))}
                          className="text-blue-600"
                        />
                        <span>Company-Wide Default</span>
                      </label>

                      <label className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                        formData.meta.hierarchyScope === 'ProjectWise'
                          ? 'border-emerald-600 bg-emerald-50 font-bold text-emerald-900 ring-1 ring-emerald-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}>
                        <input
                          type="radio"
                          name="hierarchyScope"
                          value="ProjectWise"
                          checked={formData.meta.hierarchyScope === 'ProjectWise'}
                          onChange={() => setFormData(prev => ({
                            ...prev,
                            meta: { ...prev.meta, hierarchyScope: 'ProjectWise' }
                          }))}
                          className="text-emerald-600"
                        />
                        <span>Project-Wise Specific</span>
                      </label>

                      <label className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                        formData.meta.hierarchyScope === 'DepartmentDefault'
                          ? 'border-purple-600 bg-purple-50 font-bold text-purple-900 ring-1 ring-purple-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}>
                        <input
                          type="radio"
                          name="hierarchyScope"
                          value="DepartmentDefault"
                          checked={formData.meta.hierarchyScope === 'DepartmentDefault'}
                          onChange={() => setFormData(prev => ({
                            ...prev,
                            meta: { ...prev.meta, hierarchyScope: 'DepartmentDefault', projectName: '' }
                          }))}
                          className="text-purple-600"
                        />
                        <span>Department Default</span>
                      </label>
                    </div>
                  </div>

                  {/* If ProjectWise: Project selector / priority */}
                  {formData.meta.hierarchyScope === 'ProjectWise' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/80">
                      <div>
                        <label className="label text-slate-700 font-semibold">
                          Target Project Name <span className="text-red-500">*</span>
                        </label>
                        {projectsList && projectsList.length > 0 ? (
                          <select
                            value={formData.meta.projectName || ''}
                            onChange={(e) => {
                              const pName = e.target.value
                              const proj = projectsList.find(p => p.projectName === pName)
                              setFormData(prev => ({
                                ...prev,
                                meta: {
                                  ...prev.meta,
                                  projectName: pName,
                                  projectId: proj?.projectId || proj?.id || '',
                                  l1DefaultName: proj?.projectManagerName || prev.meta.l1DefaultName
                                }
                              }))
                            }}
                            className="input w-full text-xs font-semibold"
                          >
                            <option value="">-- Select Company Project --</option>
                            {projectsList.map(p => (
                              <option key={p.projectId || p.id} value={p.projectName}>
                                {p.projectName} {p.projectCode ? `(${p.projectCode})` : ''}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={formData.meta.projectName || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, projectName: e.target.value } }))}
                            placeholder="e.g. Enterprise Workforce Operations Bihar"
                            className="input w-full text-xs"
                          />
                        )}
                      </div>

                      <div>
                        <label className="label text-slate-700 font-semibold">Approval Priority Rule</label>
                        <select
                          value={formData.meta.approvalPriority || 'ProjectFirst'}
                          onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, approvalPriority: e.target.value } }))}
                          className="input w-full text-xs font-semibold"
                        >
                          <option value="ProjectFirst">Project Manager First (Fallback to HOD)</option>
                          <option value="CompanyFirst">Company Functional Head First</option>
                          <option value="DualMatrix">Dual / Matrix Approval (Both PM & HOD)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* 2. Three-Tier Manager Hierarchy Definition */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Level 1 */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Level 1 (L1) Manager</span>
                        <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded font-bold">Immediate</span>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-medium">Designation / Role Title</label>
                        <input
                          type="text"
                          value={formData.meta.l1ManagerRole || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, l1ManagerRole: e.target.value } }))}
                          placeholder="e.g. Project Manager / Team Lead"
                          className="input w-full text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-medium">Default Manager Name</label>
                        <input
                          type="text"
                          value={formData.meta.l1DefaultName || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, l1DefaultName: e.target.value } }))}
                          placeholder="e.g. Project Lead / Assigned PM"
                          className="input w-full text-xs"
                        />
                      </div>
                    </div>

                    {/* Level 2 */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">Level 2 (L2) Manager</span>
                        <span className="text-[9px] bg-purple-50 text-purple-700 px-1.5 py-0.2 rounded font-bold">Reviewer</span>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-medium">Designation / Role Title</label>
                        <input
                          type="text"
                          value={formData.meta.l2ManagerRole || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, l2ManagerRole: e.target.value } }))}
                          placeholder="e.g. Department Head (HOD)"
                          className="input w-full text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-medium">Default Manager Name</label>
                        <input
                          type="text"
                          value={formData.meta.l2DefaultName || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, l2DefaultName: e.target.value } }))}
                          placeholder="e.g. Operations HOD"
                          className="input w-full text-xs"
                        />
                      </div>
                    </div>

                    {/* Level 3 */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">Level 3 (L3) Head</span>
                        <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-bold">Escalation</span>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-medium">Designation / Role Title</label>
                        <input
                          type="text"
                          value={formData.meta.l3ManagerRole || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, l3ManagerRole: e.target.value } }))}
                          placeholder="e.g. HR Head / Director"
                          className="input w-full text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-medium">Default Manager Name</label>
                        <input
                          type="text"
                          value={formData.meta.l3DefaultName || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, l3DefaultName: e.target.value } }))}
                          placeholder="e.g. Managing Director"
                          className="input w-full text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. Operational Policies & Fallback Checkboxes */}
                  <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                      <input
                        type="checkbox"
                        checked={!!formData.meta.autoFallbackToCompany}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, autoFallbackToCompany: e.target.checked } }))}
                        className="rounded text-blue-600"
                      />
                      <span>Auto-fallback to Company Department Head (HOD) if Project Manager is unassigned or on leave</span>
                    </label>

                    <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-4 text-slate-600">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!formData.meta.appliesToAttendance}
                          onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, appliesToAttendance: e.target.checked } }))}
                          className="rounded text-blue-600"
                        />
                        <span>Attendance Punches & Regularization</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!formData.meta.appliesToLeaves}
                          onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, appliesToLeaves: e.target.checked } }))}
                          className="rounded text-blue-600"
                        />
                        <span>Leave Applications</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!formData.meta.appliesToTourPlans}
                          onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, appliesToTourPlans: e.target.checked } }))}
                          className="rounded text-blue-600"
                        />
                        <span>Tour Plans & Travel Orders</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Common: Sort Order and Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: e.target.value }))}
                    className="input w-full"
                    min="0"
                  />
                </div>

                <div>
                  <label className="label">Status</label>
                  <select
                    value={formData.isActive ? '1' : '0'}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === '1' }))}
                    className="input w-full"
                  >
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Remarks / Description</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optional operational notes or compliance details..."
                  className="input w-full py-2"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn btn-outline btn-sm"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm min-w-24 shadow-xs"
                  disabled={saving}
                >
                  {saving ? (
                    <span className="flex items-center gap-1.5">
                      <RefreshCw size={13} className="animate-spin" /> Saving...
                    </span>
                  ) : modalMode === 'edit' ? (
                    'Save Changes'
                  ) : (
                    'Create Master'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. CENTRALIZED SERIAL NUMBER SERIES & SEQUENCES IN-CONTENT PANEL */}
      {sequenceModalOpen && (
        <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600">
                  <Hash size={18} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Enterprise Serial Number Series & Prefixes</h4>
                  <p className="text-[11px] text-slate-500">Atomic, continuous sequence numbering for {companyName || 'Company'} without manual typing.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSequenceModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
              {editingSeq ? (
                <form onSubmit={handleSaveSequence} className="rounded-xl border border-blue-200 bg-blue-50/40 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-blue-100 pb-3">
                    <h5 className="text-sm font-bold text-blue-900">
                      Configure Series for: <span className="underline">{editingSeq.entityName}</span>
                    </h5>
                    <button
                      type="button"
                      onClick={() => setEditingSeq(null)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      Cancel Edit
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="label text-slate-700">Prefix Identifier</label>
                      <input
                        type="text"
                        required
                        value={editingSeq.prefix || ''}
                        onChange={(e) => setEditingSeq(prev => ({ ...prev, prefix: e.target.value.toUpperCase() }))}
                        placeholder="e.g. EMP-, PRJ-, DEP-"
                        className="input w-full font-mono uppercase font-bold"
                      />
                    </div>
                    <div>
                      <label className="label text-slate-700">Zero Padding (Digits)</label>
                      <select
                        value={editingSeq.paddingLength || 3}
                        onChange={(e) => setEditingSeq(prev => ({ ...prev, paddingLength: Number(e.target.value) }))}
                        className="input w-full"
                      >
                        <option value="2">2 Digits (01, 02)</option>
                        <option value="3">3 Digits (001, 002)</option>
                        <option value="4">4 Digits (0001, 0002)</option>
                        <option value="5">5 Digits (00001, 00002)</option>
                        <option value="6">6 Digits (000001)</option>
                      </select>
                    </div>
                    <div>
                      <label className="label text-slate-700">Next Starting Serial</label>
                      <input
                        type="number"
                        min="1"
                        value={editingSeq.nextNumber || (editingSeq.currentNumber + 1)}
                        onChange={(e) => setEditingSeq(prev => ({ ...prev, nextNumber: Number(e.target.value) }))}
                        className="input w-full font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!editingSeq.includeYear}
                        onChange={(e) => setEditingSeq(prev => ({ ...prev, includeYear: e.target.checked }))}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      Include 2-Digit Year (e.g. 26 for 2026)
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingSeq(null)}
                        className="btn btn-outline btn-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingSeq}
                        className="btn btn-primary btn-xs shadow-xs"
                      >
                        {savingSeq ? 'Saving Series...' : 'Save Series Config'}
                      </button>
                    </div>
                  </div>
                </form>
              ) : null}

              {loadingSequences ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  <RefreshCw size={16} className="animate-spin mx-auto mb-2 text-blue-600" />
                  Loading sequence configurations...
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50/80 font-bold text-slate-700">
                      <tr>
                        <th className="px-3.5 py-2.5">Module / Entity</th>
                        <th className="px-3.5 py-2.5">Prefix</th>
                        <th className="px-3.5 py-2.5">Padding</th>
                        <th className="px-3.5 py-2.5">Year Included</th>
                        <th className="px-3.5 py-2.5">Current Count</th>
                        <th className="px-3.5 py-2.5">Next Preview Serial</th>
                        <th className="px-3.5 py-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                      {sequences.map((s) => (
                        <tr key={s.entityName} className="hover:bg-slate-50/70 transition">
                          <td className="px-3.5 py-2.5 font-bold text-slate-900">{s.entityName}</td>
                          <td className="px-3.5 py-2.5 font-mono font-bold text-blue-700">{s.prefix}</td>
                          <td className="px-3.5 py-2.5">{s.paddingLength} Digits</td>
                          <td className="px-3.5 py-2.5">
                            {s.includeYear ? (
                              <span className="rounded bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 text-[10px] font-bold">Yes (26)</span>
                            ) : (
                              <span className="text-slate-400">No</span>
                            )}
                          </td>
                          <td className="px-3.5 py-2.5 font-mono">{s.currentNumber}</td>
                          <td className="px-3.5 py-2.5">
                            <span className="rounded bg-slate-100 border border-slate-200/80 px-2 py-0.5 font-mono font-bold text-slate-800">
                              {s.nextPreviewCode}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => setEditingSeq({ ...s })}
                              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-6 py-3 text-xs text-slate-500">
              <span>All sequences are thread-safe and isolated per tenant & company.</span>
              <button
                type="button"
                onClick={() => setSequenceModalOpen(false)}
                className="btn btn-outline btn-xs"
              >
                Close
              </button>
            </div>
          </div>
      )}
    </div>
  )
}
