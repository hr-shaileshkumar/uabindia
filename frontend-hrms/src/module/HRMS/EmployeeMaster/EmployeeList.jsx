import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, UserCheck, Building2, Briefcase, RefreshCw, Plus, ShieldCheck } from 'lucide-react'
import { deleteEmployee, listEmployees } from '../../../api/employees'
import { useConfirm } from '../../../components/ConfirmProvider'
import PageHeader from '../../../components/PageHeader'
import LayoutVersionBadge from '../../../components/LayoutVersionBadge'
import { getMetadataSchema, syncSchemaFromDb } from '../../../engine/metadataStore'
import DynamicTableRenderer from '../../../engine/renderers/DynamicTableRenderer'
import { Button, Badge } from '../../../components/ui'

function clean(value) {
  return String(value ?? '').trim()
}

function valueOf(item, key, fallback = '') {
  return item?.[key] ?? item?.[key.charAt(0).toUpperCase() + key.slice(1)] ?? fallback
}

function valueAny(item, ...keys) {
  for (const key of keys) {
    const value = valueOf(item, key, undefined)
    if (value !== undefined && value !== null) return value
  }
  return ''
}

function normalizeEmployee(employee) {
  const first = clean(valueAny(employee, 'firstName'))
  const middle = clean(valueAny(employee, 'middleName'))
  const last = clean(valueAny(employee, 'lastName'))
  const fallbackName = [first, middle, last].filter(Boolean).join(' ')
  const name = clean(valueAny(employee, 'fullName')) || fallbackName || '-'
  const companyName = clean(valueAny(employee, 'companyName')) || clean(valueAny(employee, 'companyCode'))
  const projectName = clean(valueAny(employee, 'projectName')) || clean(valueAny(employee, 'projectCode'))
  const status = clean(valueAny(employee, 'status')) || (valueAny(employee, 'companyId') ? 'Active' : 'Draft')

  let customAttrs = {}
  if (employee?.customAttributes && typeof employee.customAttributes === 'object') {
    customAttrs = employee.customAttributes
  } else if (employee?.customFieldsJson) {
    try { customAttrs = JSON.parse(employee.customFieldsJson) } catch {}
  }

  const mobile = clean(valueAny(employee, 'mobile', 'mobileNumber', 'phone', 'contactNumber', 'alternateMobile'))
  const email = clean(valueAny(employee, 'companyEmail', 'personalEmail', 'email', 'preferredEmail'))
  const department = clean(valueAny(employee, 'departmentName', 'department', 'departmentId'))
  const designation = clean(valueAny(employee, 'designationName', 'designation', 'designationId', 'jobTitle', 'roleName'))
  const branch = clean(valueAny(employee, 'branchName', 'branch', 'branchId'))
  const location = clean(valueAny(employee, 'locationName', 'location', 'locationId'))
  const grade = clean(valueAny(employee, 'grade', 'gradeName'))

  return {
    ...customAttrs,
    id: valueAny(employee, 'id', 'employeeId'),
    code: clean(valueAny(employee, 'employeeCode')) || '-',
    name,
    companyId: valueAny(employee, 'companyId'),
    companyName: companyName || '-',
    projectId: valueAny(employee, 'projectId'),
    projectName: projectName || '-',
    department: department || '-',
    designation: designation || '-',
    branch: branch || '-',
    location: location || '-',
    employmentType: clean(valueAny(employee, 'employmentType')) || 'Full Time',
    grade: grade || '-',
    status,
    mobile: mobile || '-',
    email: email || '-',
    ctc: valueAny(employee, 'ctc', 'CTC'),
    salaryCurrency: clean(valueAny(employee, 'salaryCurrency')) || 'INR',
    raw: employee,
  }
}

export default function EmployeeList() {
  const navigate = useNavigate()
  const confirm = useConfirm()

  const [schema, setSchema] = useState(() => getMetadataSchema('employee_directory'))
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Listen for live metadata updates published from FormStudio / admin
  useEffect(() => {
    syncSchemaFromDb('employee_directory', 'default', true).then(updated => {
      if (updated) setSchema(updated)
    })

    const handleSchemaUpdated = (e) => {
      if (e.detail?.schemaId === 'employee_directory') {
        setSchema(e.detail?.schema || getMetadataSchema('employee_directory'))
      }
    }
    window.addEventListener('hrms:metadata-updated', handleSchemaUpdated)
    return () => window.removeEventListener('hrms:metadata-updated', handleSchemaUpdated)
  }, [])

  const loadEmployees = async () => {
    setLoading(true)
    setError(null)
    try {
      syncSchemaFromDb('employee_directory', 'default', true).then(updated => {
        if (updated) setSchema(updated)
      })
      const response = await listEmployees()
      const rows = Array.isArray(response) ? response : response?.items || []
      setData(rows.map(normalizeEmployee))
    } catch (err) {
      setError(err.message || 'Unable to load employee roster.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEmployees()
    const handleContextChange = () => loadEmployees()
    window.addEventListener('app:context-changed', handleContextChange)
    return () => window.removeEventListener('app:context-changed', handleContextChange)
  }, [])

  // Summary Metrics
  const stats = useMemo(() => ({
    total: data.length,
    active: data.filter(e => e.status.toLowerCase() === 'active').length,
    withCompany: data.filter(e => e.companyName !== '-').length,
    withProject: data.filter(e => e.projectName !== '-').length,
  }), [data])

  // Handle table row actions (view, edit, delete, custom)
  const handleAction = async (action, row) => {
    if (action.key === 'view' && row?.id) {
      navigate(`/module/hrms/employee-master/view/${row.id}`)
    } else if (action.key === 'edit' && row?.id) {
      navigate(`/module/hrms/employee-master/edit/${row.id}`)
    } else if (action.key === 'create') {
      navigate('/module/hrms/employee-master/create')
    } else if (action.key === 'delete' && row?.id) {
      const ok = await confirm({
        message: `Are you sure you want to delete employee record for ${row.name} (${row.code})?`,
        confirmLabel: 'Delete Record',
        tone: 'danger',
      })
      if (!ok) return

      try {
        await deleteEmployee(row.id)
        setData(current => current.filter(item => item.id !== row.id))
      } catch (err) {
        console.error('Failed to delete employee:', err)
      }
    }
  }

  const pageTitle = schema.title && !schema.title.includes('Master')
    ? schema.title
    : 'Employees'

  return (
    <div className="space-y-4 antialiased pb-8 select-none">
      {/* 1. Page Header */}
      <PageHeader
        icon={Users}
        title={pageTitle}
        description="Manage workforce profiles, roles, and departmental assignments"
        badge={`${data.length} Staff`}
        badgeTone="purple"
      >
        <LayoutVersionBadge entity="employee" version={schema?.version} />

        <Button
          variant="secondary"
          size="sm"
          onClick={loadEmployees}
          disabled={loading}
          icon={RefreshCw}
          className={loading ? '[&_svg]:animate-spin' : ''}
        >
          Refresh
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/module/hrms/employee-master/create')}
          icon={Plus}
        >
          Add Employee
        </Button>
      </PageHeader>

      {/* 2. Responsive Metric Cards (Clean 4-column SaaS Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Metric 1: Total Staff */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span className="uppercase tracking-wider">Total Staff</span>
            <div className="h-7 w-7 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Users size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono mt-1">
            {stats.total}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate">
            All registered profiles
          </div>
        </div>

        {/* Metric 2: Active Roster */}
        <div className="bg-white rounded-2xl border border-emerald-200/80 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-600">
            <span className="uppercase tracking-wider">Active</span>
            <div className="h-7 w-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <UserCheck size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 font-mono mt-1">
            {stats.active}
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 truncate">
            {stats.total > 0 ? `${Math.round((stats.active / stats.total) * 100)}% of workforce` : '0%'}
          </div>
        </div>

        {/* Metric 3: Corporate Linked */}
        <div className="bg-white rounded-2xl border border-blue-200/80 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-[11px] font-semibold text-blue-600">
            <span className="uppercase tracking-wider">Corporate</span>
            <div className="h-7 w-7 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Building2 size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-blue-700 font-mono mt-1">
            {stats.withCompany}
          </div>
          <div className="text-[10px] text-blue-600 mt-0.5 truncate">
            Assigned to legal entity
          </div>
        </div>

        {/* Metric 4: Project Linked */}
        <div className="bg-white rounded-2xl border border-amber-200/80 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-[11px] font-semibold text-amber-600">
            <span className="uppercase tracking-wider">Project Linked</span>
            <div className="h-7 w-7 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Briefcase size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-700 font-mono mt-1">
            {stats.withProject}
          </div>
          <div className="text-[10px] text-amber-600 mt-0.5 truncate">
            Stationed on active units
          </div>
        </div>
      </div>

      {/* 3. Reusable Metadata-Driven Table Engine */}
      <DynamicTableRenderer
        schema={schema}
        data={data}
        loading={loading}
        error={error}
        onRefresh={loadEmployees}
        showToolbarRefresh={false}
        onAction={handleAction}
        onRowClick={(row) => navigate(`/module/hrms/employee-master/view/${row.id}`)}
      />
    </div>
  )
}
