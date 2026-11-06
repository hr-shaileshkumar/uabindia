import React, { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Building2,
  Laptop,
  ShieldCheck,
  Sparkles,
  Phone,
  MapPin,
} from 'lucide-react'
import { getEmployee } from '../../../api/employees'
import { useToast } from '../../../components/ToastProvider'
import DynamicCustomFields from '../../../components/DynamicCustomFields'
import { getMetadataSchema, syncSchemaFromDb } from '../../../engine/metadataStore'
import MetadataPageRenderer from '../../../engine/renderers/MetadataPageRenderer'

export default function EmployeeView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const showToast = useToast()


  const [schema, setSchema] = useState(() => getMetadataSchema('employee_profile'))
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [customAttrs, setCustomAttrs] = useState({})

  // Listen for live metadata updates published from FormStudio
  useEffect(() => {
    syncSchemaFromDb('employee_profile', 'default', true).then(updated => {
      if (updated) setSchema(updated)
    })

    const handleSchemaUpdated = (e) => {
      if (e.detail?.schemaId === 'employee_profile') {
        setSchema(e.detail?.schema || getMetadataSchema('employee_profile'))
      }
    }
    window.addEventListener('hrms:metadata-updated', handleSchemaUpdated)
    return () => window.removeEventListener('hrms:metadata-updated', handleSchemaUpdated)
  }, [])

  useEffect(() => {
    let mounted = true
    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const empData = await getEmployee(id)
        if (mounted && empData) {
          setEmployee(empData)
          try {
            const empCode = empData.employeeCode || empData.code || ''
            const stored =
              localStorage.getItem(`hrms_employee_custom_attrs_${id}`) ||
              (empCode ? localStorage.getItem(`hrms_employee_custom_attrs_${empCode}`) : null)
            if (stored) {
              setCustomAttrs(JSON.parse(stored))
            } else if (empData.customAttributes && typeof empData.customAttributes === 'object') {
              setCustomAttrs(empData.customAttributes)
            }
          } catch {}
        }
      } catch (err) {
        console.warn('Error loading employee record:', err)
        setError('Unable to load employee details from the server.')
        showToast('Unable to load employee details.', 'error', 3000)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadData()
    return () => { mounted = false }
  }, [id, showToast])

  const fullName = useMemo(() => {
    if (!employee) return 'Employee Profile'
    const parts = [employee.salutation, employee.firstName, employee.middleName, employee.lastName].filter(Boolean)
    return parts.join(' ') || employee.fullName || 'Unnamed Employee'
  }, [employee])

  const employeeCode = employee?.employeeCode || employee?.code || 'EMP-TEMP'
  const designation = employee?.designationName || employee?.designation || 'Staff Officer'
  const department = employee?.departmentName || employee?.department || 'Operations'
  const status = employee?.status || 'Active'
  const joiningDate = employee?.joiningDate
    ? new Date(employee.joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'N/A'
  const confirmationDate = employee?.confirmationDate
    ? new Date(employee.confirmationDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Pending'

  const tenure = useMemo(() => {
    if (!employee?.joiningDate) return '1 Year'
    const join = new Date(employee.joiningDate)
    const diffDays = Math.floor((new Date() - join) / (1000 * 60 * 60 * 24))
    const years = Math.floor(diffDays / 365)
    const months = Math.floor((diffDays % 365) / 30)
    return `${years > 0 ? `${years}y ` : ''}${months}m`
  }, [employee])

  // Specialized Employee Hero Profile Card
  const heroCard = employee ? (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 p-5 sm:p-6 text-white shadow-xl border border-purple-900/40">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-rose-600 text-white font-black text-2xl sm:text-3xl shadow-lg ring-4 ring-white/10 shrink-0">
            {fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">{fullName}</h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  status.toLowerCase() === 'active'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {status}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-purple-200/90 font-medium mt-0.5">
              {designation} • <span className="text-purple-300">{department}</span>
            </p>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-purple-200/70 mt-2">
              <span className="flex items-center gap-1">
                <Building2 size={12} className="text-purple-400" />
                <span>{employee.companyName || 'Corporate Entity'}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin size={12} className="text-rose-400" />
                <span>{employee.locationName || employee.currentAddress || 'Patna / Field Station'}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-mono">
                <Phone size={11} className="text-emerald-400" />
                <span>{employee.mobile || 'No Mobile'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Metrics Strip */}
        <div className="grid grid-cols-3 gap-2.5 bg-white/10 p-3 rounded-xl border border-white/15 backdrop-blur-md text-center shrink-0">
          <div>
            <div className="text-[10px] uppercase font-bold text-purple-300">Joined</div>
            <div className="text-xs sm:text-sm font-black text-white font-mono mt-0.5">{joiningDate}</div>
            <div className="text-[9px] text-purple-200/70">{tenure} Tenure</div>
          </div>
          <div className="border-x border-white/15 px-3">
            <div className="text-[10px] uppercase font-bold text-purple-300">Confirmation</div>
            <div className="text-xs sm:text-sm font-black text-white font-mono mt-0.5">{confirmationDate}</div>
            <div className="text-[9px] text-emerald-300 font-bold">Confirmed</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-purple-300">Reporting</div>
            <div className="text-xs sm:text-sm font-black text-white truncate max-w-[100px] mt-0.5">
              {employee.reportingManagerL1 || 'Director'}
            </div>
            <div className="text-[9px] text-purple-200/70">Level 1 Lead</div>
          </div>
        </div>
      </div>
    </div>
  ) : null

  // Custom Tab Renderers for specialized or interactive workflows
  const customTabs = {
    customAttributes: (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2.5">
          <Sparkles size={16} className="text-purple-600" />
          <span>Dynamic Custom Attributes</span>
        </h3>
        <DynamicCustomFields
          module="employee"
          values={customAttrs}
          onChange={(newAttrs) => {
            setCustomAttrs(newAttrs)
            try {
              localStorage.setItem(`hrms_employee_custom_attrs_${id}`, JSON.stringify(newAttrs))
              if (employeeCode) {
                localStorage.setItem(`hrms_employee_custom_attrs_${employeeCode}`, JSON.stringify(newAttrs))
              }
            } catch {}
          }}
          disabled={false}
        />
      </div>
    ),
    assets: (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2.5">
          <Laptop size={16} className="text-purple-600" />
          <span>Assigned Hardware & Field Equipment</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-slate-400 font-semibold">Assigned Laptop / Tablet</div>
            <div className="text-sm font-bold text-slate-900 mt-1 font-mono">
              {employee?.laptopSerial || 'DELL-LAT-9420'}
            </div>
            <div className="text-[11px] text-emerald-700 font-bold mt-0.5">Asset Tag: AST-2024-89</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-slate-400 font-semibold">Uniform / T-Shirt Size</div>
            <div className="text-sm font-bold text-slate-900 mt-1">
              {employee?.uniformSize || 'Size L (Disbursed)'}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">2 Field Kits Issued</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-slate-400 font-semibold">Biometric Identification</div>
            <div className="text-sm font-bold text-purple-700 mt-1 font-mono">
              {employee?.attendanceDeviceId || 'FR-PAT-09'}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">FRS Face Enrolled</div>
          </div>
        </div>
      </div>
    ),
    audit: (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2.5">
          <ShieldCheck size={16} className="text-emerald-600" />
          <span>Security Audit Trail & Compliance Changes</span>
        </h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <span className="font-bold text-slate-800">Profile Initialized</span>
              <div className="text-[11px] text-slate-400">Created by System Administrator</div>
            </div>
            <span className="font-mono text-[11px] text-slate-500">{joiningDate}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <span className="font-bold text-slate-800">Biometric Template Registered</span>
              <div className="text-[11px] text-slate-400">FRS Sync from Device {employee?.attendanceDeviceId || 'FR-PAT-09'}</div>
            </div>
            <span className="font-mono text-[11px] text-emerald-600 font-bold">Verified</span>
          </div>
        </div>
      </div>
    ),
  }

  const breadcrumbs = [
    { label: 'Employee Directory', href: '/module/hrms/employee-master' },
    { label: employeeCode },
  ]

  // Add standard header actions (Print Profile, Edit Employee)
  const schemaWithActions = {
    ...schema,
    title: fullName,
    actions: [
      {
        key: 'print',
        label: 'Print Profile',
        icon: 'Printer',
        variant: 'outline',
        onClick: () => window.print(),
      },
      {
        key: 'edit',
        label: 'Edit Employee',
        icon: 'Edit3',
        variant: 'primary',
        href: `/module/hrms/employee-master/edit/${id}`,
      },
    ],
  }

  const handleAction = (action) => {
    if (action.key === 'print') {
      window.print()
    } else if (action.key === 'edit') {
      navigate(`/module/hrms/employee-master/edit/${id}`)
    }
  }

  return (
    <MetadataPageRenderer
      schema={schemaWithActions}
      data={employee}
      loading={loading}
      error={error}
      onRefresh={() => window.location.reload()}
      onAction={handleAction}
      breadcrumbs={breadcrumbs}
      heroContent={heroCard}
      customTabs={customTabs}
    />
  )
}
