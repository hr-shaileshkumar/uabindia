import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { createEmployee, getEmployee, updateEmployee } from '../../../api/employees'
import { getMetadataSchema, syncSchemaFromDb } from '../../../engine/metadataStore'
import DynamicFormRenderer from '../../../engine/renderers/DynamicFormRenderer'
import MetadataLoadingState from '../../../engine/renderers/MetadataLoadingState'
import PageCustomizationMenu from '../../../components/PageCustomizationMenu'

function clean(value) {
  return String(value ?? '').trim()
}

function optionalText(value) {
  const text = clean(value)
  return text || null
}

function optionalNumber(value) {
  if (value === '' || value === null || value === undefined) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function isGuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''))
}

function optionalGuid(value) {
  const text = clean(value)
  return isGuid(text) ? text : null
}

function formatDate(value) {
  if (!value) return ''
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return ''
    return d.toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

export function deriveCompanyPrefix(company) {
  if (!company) return 'CMP'
  const code = clean(company.companyCode || company.code || '')
  if (code && !code.toUpperCase().startsWith('CMP-')) {
    const cleanAlnum = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    if (cleanAlnum.length >= 2) return cleanAlnum.slice(0, 6)
  }
  const name = clean(company.companyName || company.name || '')
  if (name) {
    const words = name.split(/[\s-_]+/).filter(Boolean)
    if (words.length >= 2) {
      const initials = words.map(w => w[0].toUpperCase()).join('').slice(0, 4)
      if (initials.length >= 2) return initials
    }
    const firstWord = words[0].replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    if (firstWord.length >= 3) return firstWord.slice(0, 4)
  }
  return 'CMP'
}

export function deriveProjectPrefix(project) {
  if (!project) return 'CORP'
  const name = clean(project.projectName || project.name || '')
  const yearMatch = name.match(/\b(\d{3,5})\b/)
  if (yearMatch) return yearMatch[1] // e.g. "1962"
  
  const code = clean(project.projectCode || project.code || '')
  if (code && !code.toUpperCase().startsWith('PRJ-')) {
    const cleanAlnum = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    if (cleanAlnum.length >= 2) return cleanAlnum.slice(0, 6)
  }
  return 'PRJ'
}

export function generateEmployeeCode(company = null, project = null, seq = 1) {
  const cPref = deriveCompanyPrefix(company)
  const pPref = deriveProjectPrefix(project)
  const padStr = String(seq).padStart(4, '0')
  return `${cPref}-${pPref}-${padStr}`
}

const STANDARD_FORM_KEYS = new Set([
  'employeeCode', 'salutation', 'firstName', 'middleName', 'lastName',
  'gender', 'dob', 'maritalStatus', 'bloodGroup', 'employmentType', 'grade',
  'status', 'offerDate', 'joiningDate', 'confirmationDate', 'noticePeriodDays',
  'companyId', 'projectId', 'departmentName', 'designationName', 'branchName',
  'locationName', 'reportingManagerL1', 'reportingManagerL2', 'reportingManagerL3',
  'attendanceDeviceId', 'punchId', 'mobile', 'alternateMobile', 'personalEmail',
  'companyEmail', 'currentAddress', 'permanentAddress', 'emergencyContactName',
  'emergencyPhone', 'emergencyRelation', 'ctc', 'salaryCurrency', 'panNumber',
  'aadhaarNumber', 'esiNumber', 'pfAccountNumber', 'uanNumber', 'bankName',
  'bankBranchName', 'accountHolderName', 'accountNumber', 'ifscCode',
  'qualification', 'institution', 'yearOfPassing', 'percentage',
  'previousCompanyName', 'previousDesignation', 'previousSalary', 'reasonForLeaving',
  'customAttributes', 'CustomFieldsJson'
])

function toPayload(form) {
  // Automatically collect any custom or metadata field into CustomFieldsJson
  const dynamicCustom = { ...(form.customAttributes || {}) }
  Object.entries(form).forEach(([k, v]) => {
    if (!STANDARD_FORM_KEYS.has(k) && v !== undefined && v !== null && v !== '') {
      dynamicCustom[k] = v
    }
  })

  return {
    CustomFieldsJson: JSON.stringify(dynamicCustom),
    EmployeeCode: clean(form.employeeCode) || '',
    Salutation: optionalText(form.salutation),
    FirstName: clean(form.firstName),
    MiddleName: optionalText(form.middleName),
    LastName: clean(form.lastName),
    Gender: optionalText(form.gender),
    DateOfBirth: form.dob || null,
    MaritalStatus: optionalText(form.maritalStatus),
    BloodGroup: optionalText(form.bloodGroup),
    EmploymentType: optionalText(form.employmentType),
    Grade: optionalText(form.grade),
    Status: optionalText(form.status) || 'Active',
    OfferDate: form.offerDate || null,
    JoiningDate: form.joiningDate || null,
    ConfirmationDate: form.confirmationDate || null,
    NoticePeriodDays: optionalNumber(form.noticePeriodDays),
    CompanyId: optionalGuid(form.companyId),
    ProjectId: optionalGuid(form.projectId),
    DepartmentName: optionalText(form.departmentName),
    DesignationName: optionalText(form.designationName),
    BranchName: optionalText(form.branchName),
    LocationName: optionalText(form.locationName),
    ReportingManagerL1: optionalText(form.reportingManagerL1),
    ReportingManagerL2: optionalText(form.reportingManagerL2),
    ReportingManagerL3: optionalText(form.reportingManagerL3),
    AttendanceDeviceId: optionalText(form.attendanceDeviceId),
    PunchId: optionalText(form.punchId),
    Mobile: optionalText(form.mobile),
    AlternateMobile: optionalText(form.alternateMobile),
    PersonalEmail: optionalText(form.personalEmail),
    CompanyEmail: optionalText(form.companyEmail),
    CurrentAddress: optionalText(form.currentAddress),
    PermanentAddress: optionalText(form.permanentAddress),
    EmergencyContactName: optionalText(form.emergencyContactName),
    EmergencyPhone: optionalText(form.emergencyPhone),
    EmergencyRelation: optionalText(form.emergencyRelation),
    CTC: optionalNumber(form.ctc),
    SalaryCurrency: optionalText(form.salaryCurrency) || 'INR',
    PANNumber: optionalText(form.panNumber),
    AadhaarNumber: optionalText(form.aadhaarNumber),
    ESINumber: optionalText(form.esiNumber),
    PFAccountNumber: optionalText(form.pfAccountNumber),
    UANNumber: optionalText(form.uanNumber),
    BankName: optionalText(form.bankName),
    BankBranchName: optionalText(form.bankBranchName),
    AccountHolderName: optionalText(form.accountHolderName),
    AccountNumber: optionalText(form.accountNumber),
    IFSCCode: optionalText(form.ifscCode),
    Qualification: optionalText(form.qualification),
    Institution: optionalText(form.institution),
    YearOfPassing: optionalNumber(form.yearOfPassing),
    Percentage: optionalText(form.percentage),
    PreviousCompanyName: optionalText(form.previousCompanyName),
    PreviousDesignation: optionalText(form.previousDesignation),
    PreviousSalary: optionalNumber(form.previousSalary),
    ReasonForLeaving: optionalText(form.reasonForLeaving),
  }
}


export default function EmployeeForm({ initial = null }) {
  const navigate = useNavigate()
  const params = useParams()
  const employeeId = initial?.employeeId || params?.id

  const [schema, setSchema] = useState(() => getMetadataSchema('employee_form'))
  const [initialValues, setInitialValues] = useState({})
  const [loading, setLoading] = useState(!!employeeId)

  // Live schema update listener
  useEffect(() => {
    syncSchemaFromDb('employee_form', 'default', true).then(updated => {
      if (updated) setSchema(updated)
    })

    const handleUpdate = (e) => {
      if (e.detail?.schemaId === 'employee_form') {
        setSchema(e.detail?.schema || getMetadataSchema('employee_form'))
      }
    }
    window.addEventListener('hrms:metadata-updated', handleUpdate)
    return () => window.removeEventListener('hrms:metadata-updated', handleUpdate)
  }, [])

  // Load employee data if edit mode
  useEffect(() => {
    if (!employeeId) {
      // Create mode - initialize default values
      const selCompanyId = localStorage.getItem('sel_company_id') || ''
      const selProjectId = localStorage.getItem('sel_project_id') || ''
      setInitialValues({
        companyId: selCompanyId,
        projectId: selProjectId,
        status: 'Active',
        employmentType: 'Permanent Full-Time',
        salaryCurrency: 'INR',
        noticePeriodDays: 30,
        gender: 'Male',
      })
      return
    }

    let mounted = true
    setLoading(true)
    getEmployee(employeeId)
      .then((emp) => {
        if (!mounted || !emp) return

        let customAttrs = {}
        if (emp.customAttributes && typeof emp.customAttributes === 'object') {
          customAttrs = emp.customAttributes
        } else if (emp.customFieldsJson) {
          try { customAttrs = JSON.parse(emp.customFieldsJson) } catch {}
        }

        setInitialValues({
          ...customAttrs,
          ...emp,
          dob: formatDate(emp.dateOfBirth || emp.dob),
          offerDate: formatDate(emp.offerDate),
          joiningDate: formatDate(emp.joiningDate),
          confirmationDate: formatDate(emp.confirmationDate),
          panNumber: emp.panNumber || emp.PANNumber,
          aadhaarNumber: emp.aadhaarNumber || emp.AadhaarNumber,
          uanNumber: emp.uanNumber || emp.UANNumber,
          pfAccountNumber: emp.pfAccountNumber || emp.PFAccountNumber,
          esiNumber: emp.esiNumber || emp.ESINumber,
          ifscCode: emp.ifscCode || emp.IFSCCode,
          ctc: emp.ctc || emp.CTC,
          customAttributes: customAttrs,
        })
      })

      .catch((err) => {
        console.warn('Failed to load employee for edit:', err)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => { mounted = false }
  }, [employeeId])

  const handleSubmit = async (formValues) => {
    const payload = toPayload(formValues)
    if (employeeId) {
      await updateEmployee(employeeId, payload)
      navigate(`/module/hrms/employee-master/view/${employeeId}`)
    } else {
      const created = await createEmployee(payload)
      const newId = created?.id || created?.employeeId
      if (newId) {
        navigate(`/module/hrms/employee-master/view/${newId}`)
      } else {
        navigate('/module/hrms/employee-master')
      }
    }
  }

  const effectiveSchema = useMemo(() => {
    if (!schema?.fields) return schema
    if (!employeeId) {
      // In create mode, employee code is auto-allocated by sequence service, not shown in form
      return {
        ...schema,
        fields: schema.fields.filter(f => f.id !== 'employeeCode')
      }
    }
    // In edit mode, employee code is displayed as read-only identifier
    return {
      ...schema,
      fields: schema.fields.map(f => f.id === 'employeeCode' ? { ...f, disabled: true, required: false } : f)
    }
  }, [schema, employeeId])

  if (loading) {
    return <MetadataLoadingState type="form" />
  }

  return (
    <div className="space-y-4 antialiased pb-8 select-none">
      {/* 1. Header with Back button & Breadcrumb */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/module/hrms/employee-master')}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-purple-700 hover:bg-purple-50 transition shadow-2xs cursor-pointer"
            title="Back to Directory"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <Link to="/module/hrms/employee-master" className="hover:text-purple-700 transition">
                Employee Directory
              </Link>
              <span>/</span>
              <span className="text-purple-700 font-bold">
                {employeeId ? 'Edit Employee' : 'Add Employee'}
              </span>
            </div>
            <h1 className="text-base md:text-lg font-bold text-slate-900 tracking-tight">
              {employeeId ? 'Edit Employee' : 'Add New Employee'}
            </h1>
          </div>
        </div>

        {/* Right side: Customization Dropdown for Super Admin & Admin */}
        <PageCustomizationMenu
          schema={schema}
          entityType="employee"
          schemaId="employee_form"
          onSchemaUpdated={setSchema}
        />
      </div>

      {/* 2. Metadata-Driven Dynamic Form Engine */}
      <DynamicFormRenderer
        schema={effectiveSchema}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/module/hrms/employee-master')}
        showHeader={false}
      />
    </div>
  )
}
