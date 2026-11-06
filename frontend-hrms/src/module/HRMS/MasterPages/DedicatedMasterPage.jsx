import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Globe,
  Layers,
  Compass,
  Landmark,
  Network,
  MapPin,
  Navigation,
  Briefcase,
  Award,
  GitBranch,
  ShieldCheck,
  Clock,
  CreditCard,
  Users,
  Calendar,
  FileText,
  Plus,
  Search,
  ArrowLeft,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter,
  SlidersHorizontal
} from 'lucide-react'
import TableColumnCustomizerModal from '../../../components/TableColumnCustomizerModal'
import {
  getMasterItems,
  createMasterItem,
  updateMasterItem,
  deleteMasterItem
} from '../../../api/masterData'
import { getUiLayout } from '../../../api/layout'
import LayoutVersionBadge from '../../../components/LayoutVersionBadge'
import { useConfirm } from '../../../components/ConfirmProvider'

// Master entity dictionary with strictly typed relational mappings
export const MASTER_PAGE_CONFIGS = {
  country: {
    entity: 'countries',
    typeKey: 'country',
    route: '/module/hrms/country',
    singular: 'Country',
    plural: 'Countries',
    category: 'Location Hierarchy',
    levelTag: 'Level 1 • Apex Boundary',
    icon: Globe,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    headerGradient: 'from-blue-600 to-indigo-700',
    description: 'National apex boundary (e.g. India, International entities) governing all macro zones and regional territories.',
    idField: 'CountryId',
    codeField: 'CountryCode',
    nameField: 'CountryName',
    parentEntity: null,
    fields: [
      { key: 'currency', label: 'Default Currency', type: 'text', default: 'INR', placeholder: 'INR' },
      { key: 'dialCode', label: 'ISD Dial Code', type: 'text', default: '+91', placeholder: '+91' }
    ]
  },
  zone: {
    entity: 'zones',
    typeKey: 'zone',
    route: '/module/hrms/zone',
    singular: 'Zone',
    plural: 'Zones',
    category: 'Location Hierarchy',
    levelTag: 'Level 2 • Macro Zone',
    icon: Layers,
    color: 'text-slate-700 bg-slate-100 border-slate-300',
    headerGradient: 'from-slate-700 to-slate-900',
    description: 'Macro operational zones (East Zone, North Zone, Central Zone) grouping multiple state regions.',
    idField: 'ZoneId',
    codeField: 'ZoneCode',
    nameField: 'ZoneName',
    parentEntity: 'countries',
    parentLabel: 'Parent Country',
    parentIdField: 'countryId',
    parentDisplayField: 'CountryName',
    parentSelectId: 'CountryId',
    fields: [
      { key: 'zonalHeadName', label: 'Zonal Head / Director', type: 'text', placeholder: 'e.g. Dr. Rajesh Sharma' }
    ]
  },
  region: {
    entity: 'regions',
    typeKey: 'region',
    route: '/module/hrms/region',
    singular: 'Region',
    plural: 'Regions',
    category: 'Location Hierarchy',
    levelTag: 'Level 3 • Territorial Division',
    icon: Compass,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    headerGradient: 'from-indigo-600 to-purple-700',
    description: 'Multi-state regional divisions managing states and administrative hubs.',
    idField: 'RegionId',
    codeField: 'RegionCode',
    nameField: 'RegionName',
    parentEntity: 'zones',
    parentLabel: 'Parent Zone',
    parentIdField: 'zoneId',
    parentDisplayField: 'ZoneName',
    parentSelectId: 'ZoneId',
    fields: [
      { key: 'regionalManager', label: 'Regional Manager', type: 'text', placeholder: 'e.g. S. K. Verma' }
    ]
  },
  state: {
    entity: 'states',
    typeKey: 'state',
    route: '/module/hrms/state',
    singular: 'State',
    plural: 'States',
    category: 'Location Hierarchy',
    levelTag: 'Level 4 • State Jurisdiction',
    icon: Landmark,
    color: 'text-teal-600 bg-teal-50 border-teal-200',
    headerGradient: 'from-teal-600 to-emerald-700',
    description: 'State jurisdictions (e.g. Bihar, Jharkhand, Uttar Pradesh) governing clusters and revenue districts.',
    idField: 'StateId',
    codeField: 'StateCode',
    nameField: 'StateName',
    parentEntity: 'regions',
    parentLabel: 'Parent Region',
    parentIdField: 'regionId',
    parentDisplayField: 'RegionName',
    parentSelectId: 'RegionId',
    fields: [
      { key: 'capital', label: 'State Capital', type: 'text', placeholder: 'e.g. Patna' },
      { key: 'tinCode', label: 'State TIN / GST Code', type: 'text', placeholder: 'e.g. 10' }
    ]
  },
  cluster: {
    entity: 'clusters',
    typeKey: 'cluster',
    route: '/module/hrms/cluster',
    singular: 'Cluster',
    plural: 'Clusters',
    category: 'Location Hierarchy',
    levelTag: 'Level 5 • Multi-District Cluster',
    icon: Network,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    headerGradient: 'from-amber-600 to-orange-700',
    description: 'Operational multi-district supervisory clusters (e.g. Patna Cluster, Tirhut Cluster).',
    idField: 'ClusterId',
    codeField: 'ClusterCode',
    nameField: 'ClusterName',
    parentEntity: 'states',
    parentLabel: 'Parent State',
    parentIdField: 'stateId',
    parentDisplayField: 'StateName',
    parentSelectId: 'StateId',
    fields: [
      { key: 'clusterHead', label: 'Cluster Coordinator / Incharge', type: 'text', placeholder: 'e.g. Amit Kumar' }
    ]
  },
  district: {
    entity: 'districts',
    typeKey: 'district',
    route: '/module/hrms/district',
    singular: 'District',
    plural: 'Districts',
    category: 'Location Hierarchy',
    levelTag: 'Level 6 • Revenue District',
    icon: MapPin,
    color: 'text-sky-600 bg-sky-50 border-sky-200',
    headerGradient: 'from-sky-600 to-blue-700',
    description: 'Operational revenue districts (Patna, Gaya, Muzaffarpur, Bhagalpur) containing field offices & duty stations.',
    idField: 'DistrictId',
    codeField: 'DistrictCode',
    nameField: 'DistrictName',
    parentEntity: 'clusters',
    parentLabel: 'Parent Cluster',
    parentIdField: 'clusterId',
    parentDisplayField: 'ClusterName',
    parentSelectId: 'ClusterId',
    fields: [
      { key: 'headquarter', label: 'District Headquarter', type: 'text', placeholder: 'e.g. Patna Sadar' }
    ]
  },
  location: {
    entity: 'locations',
    typeKey: 'location',
    route: '/module/hrms/location',
    singular: 'Posting Location',
    plural: 'Posting Locations',
    category: 'Location Hierarchy',
    levelTag: 'Level 7 • Duty Station',
    icon: Navigation,
    color: 'text-rose-600 bg-rose-50 border-rose-200',
    headerGradient: 'from-rose-600 to-pink-700',
    description: 'Specific employee duty stations with live GPS coordinates, attendance geofence, and facility specs.',
    idField: 'LocationId',
    codeField: 'LocationCode',
    nameField: 'LocationName',
    parentEntity: 'districts',
    parentLabel: 'Parent District',
    parentIdField: 'districtId',
    parentDisplayField: 'DistrictName',
    parentSelectId: 'DistrictId',
    fields: [
      { key: 'latitude', label: 'GPS Latitude', type: 'number', step: 'any', placeholder: '25.5941' },
      { key: 'longitude', label: 'GPS Longitude', type: 'number', step: 'any', placeholder: '85.1376' },
      { key: 'radiusMeters', label: 'Geofence Radius (Meters)', type: 'number', default: 200, placeholder: '200' },
      { key: 'workStationType', label: 'Station Category', type: 'select', options: ['Field / Duty Station', 'Urban Regional Hub', 'Rural Mobile Camp', 'Headquarters'], default: 'Field / Duty Station' }
    ]
  },

  // Organization Masters
  department: {
    entity: 'departments',
    typeKey: 'department',
    route: '/module/hrms/department',
    singular: 'Department',
    plural: 'Departments',
    category: 'Organization Masters',
    levelTag: 'Organizational Division',
    icon: Briefcase,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    headerGradient: 'from-purple-600 to-indigo-700',
    description: 'Corporate and operational divisions (Operations, IT, HR, Finance, Medical / 1962 Services).',
    idField: 'DepartmentId',
    codeField: 'DepartmentCode',
    nameField: 'DepartmentName',
    parentEntity: 'departments',
    parentLabel: 'Parent Department (Optional)',
    parentIdField: 'parentDepartmentId',
    parentDisplayField: 'ParentDepartmentName',
    parentSelectId: 'DepartmentId',
    parentRequired: false,
    fields: [
      { key: 'departmentHead', label: 'Department Head / VP', type: 'text', placeholder: 'e.g. Chief Operating Officer' }
    ]
  },
  designation: {
    entity: 'designations',
    typeKey: 'designation',
    route: '/module/hrms/designation',
    singular: 'Designation',
    plural: 'Designations',
    category: 'Organization Masters',
    levelTag: 'Job Title & Cadre',
    icon: Award,
    color: 'text-pink-600 bg-pink-50 border-pink-200',
    headerGradient: 'from-pink-600 to-rose-700',
    description: 'Official job titles, executive cadres, seniority levels, and reporting designations.',
    idField: 'DesignationId',
    codeField: 'DesignationCode',
    nameField: 'DesignationName',
    parentEntity: 'departments',
    parentLabel: 'Mapped Department',
    parentIdField: 'departmentId',
    parentDisplayField: 'DepartmentName',
    parentSelectId: 'DepartmentId',
    fields: [
      { key: 'seniorityLevel', label: 'Seniority Level', type: 'select', options: ['Executive', 'Team Lead', 'Manager', 'Senior Manager', 'Director', 'Executive Leadership'], default: 'Executive' },
      { key: 'minExperienceYears', label: 'Min Experience (Years)', type: 'number', default: 0, placeholder: '2' }
    ]
  },
  branch: {
    entity: 'branches',
    typeKey: 'branch',
    route: '/module/hrms/branch',
    singular: 'Branch Office',
    plural: 'Branch Offices',
    category: 'Organization Masters',
    levelTag: 'Field Office Facility',
    icon: GitBranch,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    headerGradient: 'from-emerald-600 to-teal-700',
    description: 'Physical branches, regional operating centers, and corporate office facilities.',
    idField: 'BranchId',
    codeField: 'BranchCode',
    nameField: 'BranchName',
    parentEntity: 'districts',
    parentLabel: 'Assigned District',
    parentIdField: 'districtId',
    parentDisplayField: 'DistrictName',
    parentSelectId: 'DistrictId',
    fields: [
      { key: 'branchType', label: 'Branch Type', type: 'select', options: ['Field Office', 'Regional Hub', 'Service Center', 'Corporate HQ'], default: 'Field Office' },
      { key: 'address', label: 'Office Address', type: 'text', placeholder: 'Full street address' },
      { key: 'contactNumber', label: 'Contact Phone', type: 'text', placeholder: '+91 9876543210' },
      { key: 'email', label: 'Office Email', type: 'email', placeholder: 'branch@uabindia.in' }
    ]
  },
  'reporting-manager': {
    entity: 'reporting-hierarchies',
    typeKey: 'reporting-manager',
    route: '/module/hrms/reporting-manager',
    singular: 'Reporting Manager Setup',
    plural: 'Reporting Manager Setups',
    category: 'Organization Masters',
    levelTag: 'Approval & Reporting Chain',
    icon: GitBranch,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    headerGradient: 'from-indigo-600 to-violet-700',
    description: 'Default multi-level reporting chains (L1 / L2 / L3 managers) and workflow approval rules.',
    idField: 'HierarchyId',
    codeField: 'HierarchyCode',
    nameField: 'HierarchyName',
    parentEntity: 'departments',
    parentLabel: 'Department',
    parentIdField: 'departmentId',
    parentDisplayField: 'DepartmentName',
    parentSelectId: 'DepartmentId',
    fields: [
      { key: 'approvalType', label: 'Approval Flow Type', type: 'select', options: ['Sequential (L1 -> L2)', 'Single Direct Manager', 'Department Head Override'], default: 'Sequential' }
    ]
  },

  // Payroll & Work Structure
  grade: {
    entity: 'grades',
    typeKey: 'grade',
    route: '/module/hrms/grade',
    singular: 'Grade / Band',
    plural: 'Grades & Bands',
    category: 'Payroll & Work Structure',
    levelTag: 'Pay Scale Band',
    icon: ShieldCheck,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    headerGradient: 'from-amber-600 to-orange-700',
    description: 'Pay scale bands (e.g. M1, M2, E1), probation duration, and notice period policies.',
    idField: 'GradeId',
    codeField: 'GradeCode',
    nameField: 'GradeName',
    parentEntity: null,
    fields: [
      { key: 'bandLevel', label: 'Cadre / Band', type: 'text', placeholder: 'e.g. Executive, Middle Management' },
      { key: 'minSalary', label: 'Min Salary Scale (INR)', type: 'number', placeholder: '25000' },
      { key: 'maxSalary', label: 'Max Salary Scale (INR)', type: 'number', placeholder: '50000' },
      { key: 'probationMonths', label: 'Probation Duration (Months)', type: 'number', default: 6, placeholder: '6' },
      { key: 'noticePeriodDays', label: 'Notice Period (Days)', type: 'number', default: 30, placeholder: '30' }
    ]
  },
  shift: {
    entity: 'shifts',
    typeKey: 'shift',
    route: '/module/hrms/shift',
    singular: 'Work Shift',
    plural: 'Work Shifts',
    category: 'Payroll & Work Structure',
    levelTag: 'Attendance Roster',
    icon: Clock,
    color: 'text-cyan-600 bg-cyan-50 border-cyan-200',
    headerGradient: 'from-cyan-600 to-blue-700',
    description: 'Attendance rosters, shift start/end windows, grace minutes, and night allowances.',
    idField: 'ShiftId',
    codeField: 'ShiftCode',
    nameField: 'ShiftName',
    parentEntity: null,
    fields: [
      { key: 'startTime', label: 'Shift Start Time', type: 'text', default: '09:00', placeholder: '09:00' },
      { key: 'endTime', label: 'Shift End Time', type: 'text', default: '18:00', placeholder: '18:00' },
      { key: 'graceMinutes', label: 'Late Mark Grace (Minutes)', type: 'number', default: 15, placeholder: '15' },
      { key: 'halfDayMinutes', label: 'Half Day Cutoff (Minutes)', type: 'number', default: 240, placeholder: '240' },
      { key: 'isNightShift', label: 'Night Shift Allowance Applies', type: 'checkbox', default: false }
    ]
  },
  'cost-center': {
    entity: 'cost-centers',
    typeKey: 'cost-center',
    route: '/module/hrms/cost-center',
    singular: 'Cost Center',
    plural: 'Cost Centers',
    category: 'Payroll & Work Structure',
    levelTag: 'Accounting Cost Head',
    icon: CreditCard,
    color: 'text-violet-600 bg-violet-50 border-violet-200',
    headerGradient: 'from-violet-600 to-purple-700',
    description: 'Accounting cost heads for project-level and departmental payroll allocation.',
    idField: 'CostCenterId',
    codeField: 'CostCenterCode',
    nameField: 'CostCenterName',
    parentEntity: null,
    fields: [
      { key: 'budgetAmount', label: 'Annual Allocated Budget (INR)', type: 'number', placeholder: '5000000' },
      { key: 'expenseType', label: 'Cost Allocation Type', type: 'select', options: ['Operational', 'Direct Project Head', 'Corporate Admin', 'Capital / Asset'], default: 'Operational' }
    ]
  },
  'employment-type': {
    entity: 'employment-types',
    typeKey: 'employment-type',
    route: '/module/hrms/employment-type',
    singular: 'Employment Type',
    plural: 'Employment Types',
    category: 'Payroll & Work Structure',
    levelTag: 'Contractual Category',
    icon: Users,
    color: 'text-rose-600 bg-rose-50 border-rose-200',
    headerGradient: 'from-rose-600 to-pink-700',
    description: 'Regular Permanent, Contractual, Deputation, Consultant, and Trainee statutory rules.',
    idField: 'EmploymentTypeId',
    codeField: 'EmploymentTypeCode',
    nameField: 'EmploymentTypeName',
    parentEntity: null,
    fields: [
      { key: 'isContractual', label: 'Fixed Term Contract', type: 'checkbox', default: false },
      { key: 'isPfEligible', label: 'PF & Statutory Pension Eligible', type: 'checkbox', default: true },
      { key: 'isEsicEligible', label: 'ESIC Medical Coverage Eligible', type: 'checkbox', default: true },
      { key: 'defaultProbationDays', label: 'Standard Probation (Days)', type: 'number', default: 180, placeholder: '180' },
      { key: 'noticePeriodDays', label: 'Notice Period (Days)', type: 'number', default: 60, placeholder: '60' }
    ]
  },
  'holiday-calendar': {
    entity: 'holiday-calendars',
    typeKey: 'holiday-calendar',
    route: '/module/hrms/holiday-calendar',
    singular: 'Holiday Calendar',
    plural: 'Holiday Calendars',
    category: 'Payroll & Work Structure',
    levelTag: 'Statutory Holiday',
    icon: Calendar,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    headerGradient: 'from-emerald-600 to-teal-700',
    description: 'National gazetted, restricted, and state public holidays for payroll and leave runs.',
    idField: 'HolidayId',
    codeField: 'HolidayCode',
    nameField: 'HolidayName',
    parentEntity: 'states',
    parentLabel: 'Applicable State',
    parentIdField: 'stateId',
    parentDisplayField: 'StateName',
    parentSelectId: 'StateId',
    parentRequired: false,
    fields: [
      { key: 'holidayDate', label: 'Holiday Date', type: 'date', default: new Date().toISOString().slice(0, 10), required: true },
      { key: 'holidayType', label: 'Holiday Category', type: 'select', options: ['National Gazetted', 'State Public Holiday', 'Restricted Optional Holiday', 'Festival Holiday'], default: 'National Gazetted' },
      { key: 'applicableFor', label: 'Jurisdiction Scope', type: 'text', default: 'All Locations', placeholder: 'All Locations' }
    ]
  },
  'leave-type': {
    entity: 'leave-types',
    typeKey: 'leave-type',
    route: '/module/hrms/leave-type',
    singular: 'Leave Type',
    plural: 'Leave Types',
    category: 'Payroll & Work Structure',
    levelTag: 'Absence Quota',
    icon: FileText,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    headerGradient: 'from-indigo-600 to-purple-700',
    description: 'Casual Leave (CL), Sick (SL), Earned (EL), Maternity (ML), and Loss of Pay (LOP) quotas.',
    idField: 'LeaveTypeId',
    codeField: 'LeaveTypeCode',
    nameField: 'LeaveTypeName',
    parentEntity: null,
    fields: [
      { key: 'annualQuota', label: 'Annual Entitlement (Days)', type: 'number', default: 12, placeholder: '12' },
      { key: 'carryForwardMax', label: 'Max Carry Forward (Days)', type: 'number', default: 30, placeholder: '30' },
      { key: 'isEncashable', label: 'Encashable on Exit / Year End', type: 'checkbox', default: false },
      { key: 'requiresProof', label: 'Medical Proof Required', type: 'checkbox', default: false }
    ]
  }
}

function renderMasterCell(item, col, config) {
  const code = item[config.codeField] || item.Code || item.code || item.CountryCode || item.BranchCode || item.DepartmentCode || item.DesignationCode
  const name = item[config.nameField] || item.Name || item.name || item.CountryName || item.BranchName || item.DepartmentName || item.DesignationName
  const parentDisplay = config.parentDisplayField ? item[config.parentDisplayField] : null
  const alignClass = col.alignment === 'center' ? 'text-center' : col.alignment === 'right' ? 'text-right' : 'text-left'

  const normalizedKey = (col.key || '').toLowerCase()
  let cellContent = null

  if (normalizedKey.includes('code')) {
    cellContent = (
      <span className="rounded-lg bg-slate-100 px-2 py-0.5 border border-slate-200/90 font-mono text-xs font-bold text-purple-700">
        {code || item[col.key] || '—'}
      </span>
    )
  } else if (normalizedKey.includes('name') && !normalizedKey.includes('parent')) {
    cellContent = (
      <div>
        <span className="font-bold text-xs text-slate-900">{name || item[col.key] || '—'}</span>
        {item.Notes && (
          <div className="text-[11px] font-normal text-slate-400 mt-0.5 truncate max-w-xs">
            {item.Notes}
          </div>
        )}
      </div>
    )
  } else if (
    normalizedKey.includes('parent') ||
    normalizedKey === 'district' ||
    normalizedKey === 'state' ||
    normalizedKey === 'zone' ||
    normalizedKey === 'country'
  ) {
    const pVal = parentDisplay || item[col.key] || item.DistrictName || item.StateName || item.CountryName
    cellContent = pVal ? (
      <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-slate-700 text-xs font-semibold">
        {pVal}
      </span>
    ) : (
      <span className="text-slate-400 italic text-xs">None</span>
    )
  } else if (normalizedKey === 'sortorder' || normalizedKey === 'order') {
    cellContent = (
      <span className="font-mono text-xs text-slate-500 font-semibold">
        {item.SortOrder ?? item.sortOrder ?? item[col.key] ?? 0}
      </span>
    )
  } else if (normalizedKey === 'isactive' || normalizedKey === 'status') {
    const active = item.IsActive !== false && item.isActive !== false && item.status !== 'Inactive'
    cellContent = (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold border ${
          active
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-slate-100 text-slate-500 border border-slate-200'
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
        <span>{active ? 'Active' : 'Inactive'}</span>
      </span>
    )
  } else {
    cellContent = item[col.key] !== undefined && item[col.key] !== null ? String(item[col.key]) : '—'
  }

  return (
    <td
      key={col.columnId || col.key}
      style={col.width && col.width !== 'auto' ? { width: col.width } : undefined}
      className={`px-4 py-3.5 ${alignClass}`}
    >
      {cellContent}
    </td>
  )
}

export default function DedicatedMasterPage({ masterKey: propMasterKey }) {
  const { type: paramType } = useParams()
  const navigate = useNavigate()
  const confirm = useConfirm()

  const activeKey = useMemo(() => {
    if (propMasterKey) return propMasterKey.toLowerCase()
    if (paramType) return paramType.toLowerCase()
    const path = window.location.pathname.toLowerCase().split('/').pop()
    if (MASTER_PAGE_CONFIGS[path]) return path
    return 'country'
  }, [propMasterKey, paramType])

  const config = MASTER_PAGE_CONFIGS[activeKey] || MASTER_PAGE_CONFIGS.country
  const IconComponent = config.icon

  // State
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [parentOptions, setParentOptions] = useState([])
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [layoutMeta, setLayoutMeta] = useState(null)
  const [customizerOpen, setCustomizerOpen] = useState(false)

  // Filters
  const [search, setSearchTerm] = useState('')
  const [parentFilter, setParentFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Form View State (Full-Screen in Content Area)
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Form State
  const [formData, setFormData] = useState({})
  const [formErrors, setFormErrors] = useState({})

  // Load parent options if relational
  const loadParentOptions = async () => {
    if (!config.parentEntity) {
      setParentOptions([])
      return
    }
    try {
      const data = await getMasterItems(config.parentEntity)
      setParentOptions(data || [])
    } catch (err) {
      console.warn('Could not load parent options', err)
    }
  }

  // Load items
  const loadItems = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (search) params.search = search
      if (parentFilter && config.parentIdField) params[config.parentIdField] = parentFilter
      const data = await getMasterItems(config.entity, params)
      setItems(data || [])
    } catch (err) {
      console.error(`Failed to load ${config.plural}`, err)
      setError(err?.response?.data?.message || err?.message || `Failed to load ${config.plural}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadParentOptions()
  }, [config.entity, config.parentEntity])

  useEffect(() => {
    loadItems()
  }, [config.entity, parentFilter, search])

  useEffect(() => {
    let mounted = true
    getUiLayout(activeKey).then(data => {
      if (mounted) setLayoutMeta(data)
    }).catch(() => {
      if (mounted) setLayoutMeta(null)
    })
    return () => { mounted = false }
  }, [activeKey])

  // Reset form
  const openCreateModal = () => {
    setEditingItem(null)
    const initial = {
      name: '',
      sortOrder: items.length + 1,
      isActive: true,
      notes: ''
    }
    if (config.parentIdField) {
      initial[config.parentIdField] = parentFilter || ''
    }
    (config.fields || []).forEach(f => {
      initial[f.key] = f.default !== undefined ? f.default : ''
    })
    setFormData(initial)
    setFormErrors({})
    setFormOpen(true)
  }

  const openEditModal = (item) => {
    setEditingItem(item)
    const initial = {
      code: item[config.codeField] || '',
      name: item[config.nameField] || '',
      sortOrder: item.SortOrder ?? 0,
      isActive: item.IsActive ?? true,
      notes: item.Notes || ''
    }
    if (config.parentIdField) {
      // Find parent id from item fields
      const pVal = item[config.parentIdField] || item[config.parentSelectId] || ''
      initial[config.parentIdField] = pVal
    }
    (config.fields || []).forEach(f => {
      // Match key case-insensitively
      const matchingKey = Object.keys(item).find(k => k.toLowerCase() === f.key.toLowerCase())
      initial[f.key] = matchingKey ? item[matchingKey] : (f.default !== undefined ? f.default : '')
    })
    setFormData(initial)
    setFormErrors({})
    setFormOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errors = {}

    if (!formData.name?.trim()) {
      errors.name = `${config.singular} Name is required`
    }
    if (config.parentEntity && config.parentRequired !== false && !formData[config.parentIdField]) {
      errors[config.parentIdField] = `Please select a ${config.parentLabel}`
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        [config.nameField.charAt(0).toLowerCase() + config.nameField.slice(1)]: formData.name.trim(),
        sortOrder: Number(formData.sortOrder) || 0,
        isActive: Boolean(formData.isActive),
        notes: formData.notes || null
      }

      if (editingItem && formData.code) {
        payload[config.codeField.charAt(0).toLowerCase() + config.codeField.slice(1)] = formData.code
      }

      if (config.parentIdField && formData[config.parentIdField]) {
        payload[config.parentIdField] = formData[config.parentIdField]
      }

      // Attach custom specific fields
      (config.fields || []).forEach(f => {
        if (formData[f.key] !== undefined) {
          payload[f.key] = formData[f.key]
        }
      })

      if (editingItem) {
        const id = editingItem[config.idField]
        await updateMasterItem(config.entity, id, payload)
        setSuccessMsg(`${config.singular} updated successfully!`)
      } else {
        await createMasterItem(config.entity, payload)
        setSuccessMsg(`New ${config.singular} created successfully!`)
      }

      setFormOpen(false)
      loadItems()
    } catch (err) {
      console.error('Save failed', err)
      setFormErrors({ submit: err?.response?.data?.message || err?.message || 'Save operation failed' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (item) => {
    const id = item[config.idField]
    const name = item[config.nameField]
    const ok = await confirm({
      title: `Delete ${config.singular}?`,
      message: `Are you sure you want to permanently delete "${name}"? If any dependent records reference it, deletion will be blocked.`
    })
    if (!ok) return

    try {
      await deleteMasterItem(config.entity, id)
      setSuccessMsg(`Deleted "${name}" successfully.`)
      loadItems()
    } catch (err) {
      console.error('Delete error', err)
      alert(err?.response?.data?.message || err?.message || 'Failed to delete record')
    }
  }

  // Filter items locally by status if requested
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (statusFilter === 'ACTIVE' && !item.IsActive) return false
      if (statusFilter === 'INACTIVE' && item.IsActive) return false
      return true
    })
  }, [items, statusFilter])

  // =========================================================================
  // FULL-SCREEN CONTENT AREA FORM VIEW
  // Rendered directly in content area when user clicks Add New or Edit
  // =========================================================================
  if (formOpen) {
    return (
      <div className="w-full space-y-6 p-4 md:p-6 animate-in fade-in">
        {/* Top Breadcrumb & Return to List */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="inline-flex items-center gap-1.5 font-medium text-slate-600 hover:text-blue-600 transition cursor-pointer"
            >
              <ArrowLeft size={16} /> Back to {config.plural}
            </button>
            <ChevronRight size={14} className="text-slate-400" />
            <span className="text-slate-900 font-bold">
              {editingItem ? `Edit ${config.singular}` : `Create New ${config.singular}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="btn btn-outline btn-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="btn btn-primary btn-sm gap-1.5 shadow-sm cursor-pointer"
            >
              {submitting && <RotateCw size={14} className="animate-spin" />}
              {editingItem ? 'Save Changes' : `Save & Create ${config.singular}`}
            </button>
          </div>
        </div>

        {/* Form Header Banner */}
        <div className="rounded-2xl bg-white border border-slate-200/90 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${config.color} shadow-sm`}>
              <IconComponent size={28} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {editingItem ? `Edit ${config.singular}` : `Create New ${config.singular}`}
                </h1>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200">
                  {config.levelTag}
                </span>
                {editingItem && (
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-mono font-bold text-blue-700 border border-blue-200">
                    {formData.code}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">{config.description}</p>
            </div>
          </div>
        </div>

        {/* Main Form Cards Grid (Full Width Content Area) */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {formErrors.submit && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm font-semibold text-rose-700">
              {formErrors.submit}
            </div>
          )}

          {/* Card 1: Core Identity & Relational Linkage */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs font-bold">1</span>
              Basic Identification & Relational Linkage
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Show Code ONLY on Edit; Auto-generated on Create */}
              {editingItem && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    System Identifier Code (Read-Only)
                  </label>
                  <input
                    type="text"
                    value={formData.code || ''}
                    disabled
                    className="input w-full bg-slate-50 font-mono text-xs text-slate-500 cursor-not-allowed"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">Assigned sequentially by database sequence engine</p>
                </div>
              )}

              {/* Parent Relational Dropdown */}
              {config.parentEntity && (
                <div className={editingItem ? '' : 'md:col-span-1'}>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {config.parentLabel} {config.parentRequired !== false && <span className="text-rose-500">*</span>}
                  </label>
                  <select
                    value={formData[config.parentIdField] || ''}
                    onChange={(e) => setFormData({ ...formData, [config.parentIdField]: e.target.value })}
                    className={`input w-full text-sm ${formErrors[config.parentIdField] ? 'border-rose-400 ring-1 ring-rose-300' : ''}`}
                  >
                    <option value="">-- Select {config.parentLabel} --</option>
                    {parentOptions.map((p) => {
                      const id = p[Object.keys(p).find(k => k.toLowerCase().endsWith('id'))]
                      const name = p[Object.keys(p).find(k => k.toLowerCase().endsWith('name'))]
                      return (
                        <option key={id} value={id}>
                          {name}
                        </option>
                      )
                    })}
                  </select>
                  {formErrors[config.parentIdField] && (
                    <p className="mt-1 text-xs text-rose-500">{formErrors[config.parentIdField]}</p>
                  )}
                  <p className="mt-1 text-[11px] text-slate-400">Database Foreign Key linkage</p>
                </div>
              )}

              {/* Name Field */}
              <div className={config.parentEntity ? '' : 'md:col-span-2'}>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {config.singular} Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={`Enter ${config.singular.toLowerCase()} name...`}
                  className={`input w-full text-sm ${formErrors.name ? 'border-rose-400 ring-1 ring-rose-300' : ''}`}
                />
                {formErrors.name && (
                  <p className="mt-1 text-xs text-rose-500">{formErrors.name}</p>
                )}
                <p className="mt-1 text-[11px] text-slate-400">Official recognized designation</p>
              </div>
            </div>
          </div>

          {/* Card 2: Entity Specific Operational Configuration */}
          {config.fields && config.fields.length > 0 && (
            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs font-bold">2</span>
                Operational & Technical Configuration
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {config.fields.map((f) => {
                  if (f.type === 'checkbox') {
                    return (
                      <div key={f.key} className="flex items-center pt-6">
                        <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(formData[f.key])}
                            onChange={(e) => setFormData({ ...formData, [f.key]: e.target.checked })}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>{f.label}</span>
                        </label>
                      </div>
                    )
                  }

                  if (f.type === 'select') {
                    return (
                      <div key={f.key}>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          {f.label}
                        </label>
                        <select
                          value={formData[f.key] || f.default || ''}
                          onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                          className="input w-full text-sm"
                        >
                          {(f.options || []).map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    )
                  }

                  return (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        {f.label} {f.required && <span className="text-rose-500">*</span>}
                      </label>
                      <input
                        type={f.type || 'text'}
                        step={f.step}
                        value={formData[f.key] ?? ''}
                        onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                        placeholder={f.placeholder || ''}
                        className="input w-full text-sm"
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Card 3: Administration, Status & Notes */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs font-bold">3</span>
              Administrative Settings & Remarks
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Sort / Sequence Order</label>
                <input
                  type="number"
                  value={formData.sortOrder ?? 0}
                  onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                  className="input w-full text-sm"
                />
                <p className="mt-1 text-[11px] text-slate-400">Display sorting position in dropdowns & tables</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Record Operational Status</label>
                <select
                  value={formData.isActive ? 'true' : 'false'}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                  className="input w-full text-sm"
                >
                  <option value="true">Active (Live in all operations)</option>
                  <option value="false">Inactive (Suspended from selection)</option>
                </select>
                <p className="mt-1 text-[11px] text-slate-400">Controls visibility in onboarding & allocations</p>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Administrative Notes & Remarks</label>
                <textarea
                  rows={3}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional remarks, regulatory notes, or operational instructions..."
                  className="input w-full text-sm"
                />
              </div>
            </div>
          </div>

          {/* Bottom Action Footer Bar */}
          <div className="flex items-center justify-between rounded-2xl bg-white border border-slate-200 p-4 shadow-2xs">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer shadow-2xs"
            >
              Cancel & Return to Table
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              {submitting && <RotateCw size={14} className="animate-spin" />}
              <span>{editingItem ? 'Save Changes' : `Save & Create ${config.singular}`}</span>
            </button>
          </div>
        </form>
      </div>
    )
  }

  // =========================================================================
  // DATA TABLE VIEW (Rendered in Content Area when not editing)
  // =========================================================================
  return (
    <div className="w-full space-y-6 p-4 md:p-6">
      {/* Top Breadcrumb & Return Link */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
          <Link
            to="/module/hrms/setup"
            className="inline-flex items-center gap-1 text-purple-700 hover:text-purple-900 transition"
          >
            <ArrowLeft size={14} /> Enterprise Setup Hub
          </Link>
          <ChevronRight size={13} className="text-slate-300" />
          <span className="text-slate-500">{config.category}</span>
          <ChevronRight size={13} className="text-slate-300" />
          <span className="text-slate-900 font-bold">{config.plural}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCustomizerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
            title="Customize Table Columns"
          >
            <SlidersHorizontal size={13} className="text-purple-600" />
            <span>Customize Columns</span>
          </button>
          <button
            type="button"
            onClick={loadItems}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
            title="Refresh records"
          >
            <RotateCw size={13} className={loading ? 'animate-spin text-purple-600' : 'text-slate-500'} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-xs hover:shadow transition cursor-pointer"
          >
            <Plus size={14} />
            <span>Add New {config.singular}</span>
          </button>
        </div>
      </div>

      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl border ${config.color} shadow-2xs`}>
              <IconComponent size={24} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{config.plural}</h1>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 border border-slate-200">
                  {config.levelTag}
                </span>
                <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-bold text-purple-700 border border-purple-200">
                  {items.length} {items.length === 1 ? 'Record' : 'Records'}
                </span>
                <LayoutVersionBadge entity={activeKey} version={layoutMeta?.version} />
              </div>
              <p className="mt-1 text-xs text-slate-500 max-w-2xl">{config.description}</p>
            </div>
          </div>

          <Link
            to="/module/hrms/setup"
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-1.5 text-xs font-semibold transition"
          >
            <span>View in Setup Grid</span>
            <ExternalLink size={12} className="text-slate-400" />
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-bold text-emerald-800 shadow-2xs animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-bold text-rose-800 shadow-2xs">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search & Relational Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search ${config.plural.toLowerCase()} by code, name, or keywords...`}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none font-medium text-slate-800 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {config.parentEntity && parentOptions.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Filter size={13} className="text-slate-400" />
              <select
                value={parentFilter}
                onChange={(e) => setParentFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-700 outline-none cursor-pointer focus:border-purple-600 focus:bg-white"
              >
                <option value="">All {config.parentLabel}s</option>
                {parentOptions.map((p) => {
                  const id = p[Object.keys(p).find(k => k.toLowerCase().endsWith('id'))]
                  const name = p[Object.keys(p).find(k => k.toLowerCase().endsWith('name'))]
                  return (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  )
                })}
              </select>
            </div>
          )}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-700 outline-none cursor-pointer focus:border-purple-600 focus:bg-white"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Relational Data Table */}
      <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <tr>
                {layoutMeta?.tableColumns && layoutMeta.tableColumns.length > 0 ? (
                  layoutMeta.tableColumns.map(col => (
                    <th
                      key={col.columnId || col.key}
                      style={col.width && col.width !== 'auto' ? { width: col.width } : undefined}
                      className={`px-4 py-3.5 ${col.alignment === 'center' ? 'text-center' : col.alignment === 'right' ? 'text-right' : 'text-left'}`}
                    >
                      {col.header}
                    </th>
                  ))
                ) : (
                  <>
                    <th className="px-4 py-3.5">Code</th>
                    <th className="px-4 py-3.5">{config.singular} Name</th>
                    {config.parentEntity && <th className="px-4 py-3.5">{config.parentLabel}</th>}
                    <th className="px-4 py-3.5">Operational Details</th>
                    <th className="px-4 py-3.5 text-center">Sort</th>
                    <th className="px-4 py-3.5">Status</th>
                  </>
                )}
                <th className="px-4 py-3.5 text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={(layoutMeta?.tableColumns?.length || 6) + 1} className="px-4 py-12 text-center text-slate-400">
                    <RotateCw size={24} className="mx-auto mb-2 animate-spin text-blue-500" />
                    Loading {config.plural.toLowerCase()}...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={(layoutMeta?.tableColumns?.length || 6) + 1} className="px-4 py-16 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 mb-3 border border-slate-200">
                      <IconComponent size={28} />
                    </div>
                    <p className="text-base font-semibold text-slate-800">No {config.plural} Found</p>
                    <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                      {search || parentFilter
                        ? 'Try clearing your search query or parent filters.'
                        : `Get started by creating your first ${config.singular.toLowerCase()} record.`}
                    </p>
                    <button
                      type="button"
                      onClick={openCreateModal}
                      className="mt-4 btn btn-primary btn-sm gap-1.5"
                    >
                      <Plus size={16} /> Add First {config.singular}
                    </button>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const id = item[config.idField]
                  const code = item[config.codeField]
                  const name = item[config.nameField]
                  const parentDisplay = config.parentDisplayField ? item[config.parentDisplayField] : null

                  return (
                    <tr key={id} className="hover:bg-blue-50/30 transition-colors">
                      {layoutMeta?.tableColumns && layoutMeta.tableColumns.length > 0 ? (
                        layoutMeta.tableColumns.map(col => renderMasterCell(item, col, config))
                      ) : (
                        <>
                          <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-900">
                            <span className="rounded bg-slate-100 px-2 py-0.5 border border-slate-200">
                              {code || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-slate-900">
                            {name}
                            {item.Notes && (
                              <div className="text-xs font-normal text-slate-400 mt-0.5 truncate max-w-xs">
                                {item.Notes}
                              </div>
                            )}
                          </td>
                          {config.parentEntity && (
                            <td className="px-4 py-3.5 text-xs text-slate-600 font-medium">
                              {parentDisplay ? (
                                <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-slate-700">
                                  {parentDisplay}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">None</span>
                              )}
                            </td>
                          )}
                          <td className="px-4 py-3.5 text-xs text-slate-600">
                            <div className="flex flex-wrap items-center gap-1.5 max-w-md">
                              {/* Entity specific preview pill tags */}
                              {item.Currency && (
                                <span className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-700 border border-blue-200">
                                  Currency: {item.Currency}
                                </span>
                              )}
                              {item.DialCode && (
                                <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-indigo-700 border border-indigo-200">
                                  ISD: {item.DialCode}
                                </span>
                              )}
                              {item.Latitude && item.Longitude && (
                                <span className="rounded bg-rose-50 px-1.5 py-0.5 text-rose-700 border border-rose-200">
                                  GPS: {Number(item.Latitude).toFixed(4)}, {Number(item.Longitude).toFixed(4)}
                                </span>
                              )}
                              {item.RadiusMeters && (
                                <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700 border border-emerald-200">
                                  Fence: {item.RadiusMeters}m
                                </span>
                              )}
                              {item.StartTime && item.EndTime && (
                                <span className="rounded bg-cyan-50 px-1.5 py-0.5 text-cyan-700 border border-cyan-200">
                                  Shift: {item.StartTime} - {item.EndTime}
                                </span>
                              )}
                              {item.MinSalary > 0 && (
                                <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-700 border border-amber-200">
                                  Scale: ₹{Number(item.MinSalary).toLocaleString()} - ₹{Number(item.MaxSalary).toLocaleString()}
                                </span>
                              )}
                              {item.HolidayDate && (
                                <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700 border border-emerald-200">
                                  Date: {new Date(item.HolidayDate).toLocaleDateString()}
                                </span>
                              )}
                              {item.AnnualQuota > 0 && (
                                <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-indigo-700 border border-indigo-200">
                                  Quota: {item.AnnualQuota} Days
                                </span>
                              )}
                              {item.DepartmentHead && (
                                <span className="rounded bg-purple-50 px-1.5 py-0.5 text-purple-700 border border-purple-200">
                                  Head: {item.DepartmentHead}
                                </span>
                              )}
                              {item.SeniorityLevel && (
                                <span className="rounded bg-pink-50 px-1.5 py-0.5 text-pink-700 border border-pink-200">
                                  Cadre: {item.SeniorityLevel}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-center text-xs font-mono text-slate-500">
                            {item.SortOrder ?? 0}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                                item.IsActive
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-500 border border-slate-200'
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${item.IsActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                              {item.IsActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </>
                      )}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-purple-50 hover:border-purple-200 text-slate-600 hover:text-purple-700 transition shadow-2xs cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-600 transition shadow-2xs cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table Column Customizer Modal */}
      <TableColumnCustomizerModal
        isOpen={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
        schema={{ id: activeKey || 'dedicated_master', columns: layoutMeta?.tableColumns || [] }}
        schemaId={activeKey || 'dedicated_master'}
        onSaveSuccess={() => {
          getUiLayout(activeKey).then(data => setLayoutMeta(data)).catch(() => {})
        }}
      />
    </div>
  )
}
