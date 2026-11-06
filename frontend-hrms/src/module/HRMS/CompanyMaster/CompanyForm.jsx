import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ImagePlus,
  Landmark,
  MapPin,
  Phone,
  RefreshCw,
  Save,
  Settings2,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { brandingLogoUrl } from '../../../api/branding'
import { getPreviewSequence } from '../../../api/sequences'
import PageHeader from '../../../components/PageHeader'
import LayoutVersionBadge from '../../../components/LayoutVersionBadge'
import PageCustomizationMenu from '../../../components/PageCustomizationMenu'

export function generateCompanyCode() {
  return ''
}

const emptyCompany = {
  tenantId: '',
  companyCode: '',
  companyName: '',
  tradeName: '',
  companyType: 'Private Limited Company',
  cinNumber: '',
  incorporationDate: '',
  isActive: true,
  logoUrl: '',
  notes: '',

  // Statutory & Tax Compliance
  gstinNumber: '',
  panNumber: '',
  tanNumber: '',
  pfNumber: '',
  esicNumber: '',
  ptNumber: '',
  linNumber: '',
  udyamNumber: '',
  taxId: '',

  // Address
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  country: 'India',
  postalCode: '',
  corporateAddress: '',

  // Contact
  contactPerson: '',
  contactDesignation: '',
  contactEmail: '',
  contactPhone: '',
  hrEmail: '',
  supportPhone: '',
  websiteUrl: '',

  // Banking
  bankName: '',
  bankBranch: '',
  accountHolderName: '',
  bankAccountNumber: '',
  ifscCode: '',
  accountType: 'Current Account',

  // HRMS & Payroll Policies
  payFrequency: 'Monthly',
  payDay: '1st of month',
  standardDailyHours: 8.0,
  weeklyOff: 'Sunday Only',
  attendanceTrackingMode: 'Biometric + Mobile App',
  fiscalYearStart: 'April - March',
  baseCurrency: 'INR',
  probationPeriodDays: 90,
  noticePeriodDays: 30,
  authorizedSignatoryName: '',
  authorizedSignatoryDesignation: '',
}

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

export function toCompanyForm(value = {}) {
  return {
    ...emptyCompany,
    tenantId: value.tenantId || value.TenantId || '',
    companyCode: value.companyCode || value.CompanyCode || '',
    companyName: value.companyName || value.CompanyName || '',
    tradeName: value.tradeName || value.TradeName || '',
    companyType: value.companyType || value.CompanyType || 'Private Limited Company',
    cinNumber: value.cinNumber || value.CinNumber || '',
    incorporationDate: formatDate(value.incorporationDate || value.IncorporationDate),
    isActive: typeof value.isActive === 'boolean' ? value.isActive : value.IsActive ?? true,
    logoUrl: value.logoUrl || value.LogoUrl || '',
    notes: value.notes || value.Notes || '',

    // Statutory
    gstinNumber: value.gstinNumber || value.GstinNumber || '',
    panNumber: value.panNumber || value.PanNumber || '',
    tanNumber: value.tanNumber || value.TanNumber || '',
    pfNumber: value.pfNumber || value.PfNumber || '',
    esicNumber: value.esicNumber || value.EsicNumber || '',
    ptNumber: value.ptNumber || value.PtNumber || '',
    linNumber: value.linNumber || value.LinNumber || '',
    udyamNumber: value.udyamNumber || value.UdyamNumber || '',
    taxId: value.taxId || value.TaxId || '',

    // Address
    addressLine1: value.addressLine1 || value.AddressLine1 || '',
    addressLine2: value.addressLine2 || value.AddressLine2 || '',
    city: value.city || value.City || '',
    state: value.state || value.State || '',
    country: value.country || value.Country || 'India',
    postalCode: value.postalCode || value.PostalCode || '',
    corporateAddress: value.corporateAddress || value.CorporateAddress || '',

    // Contact
    contactPerson: value.contactPerson || value.ContactPerson || '',
    contactDesignation: value.contactDesignation || value.ContactDesignation || '',
    contactEmail: value.contactEmail || value.ContactEmail || '',
    contactPhone: value.contactPhone || value.ContactPhone || '',
    hrEmail: value.hrEmail || value.HrEmail || '',
    supportPhone: value.supportPhone || value.SupportPhone || '',
    websiteUrl: value.websiteUrl || value.WebsiteUrl || '',

    // Banking
    bankName: value.bankName || value.BankName || '',
    bankBranch: value.bankBranch || value.BankBranch || '',
    accountHolderName: value.accountHolderName || value.AccountHolderName || '',
    bankAccountNumber: value.bankAccountNumber || value.BankAccountNumber || '',
    ifscCode: value.ifscCode || value.IfscCode || '',
    accountType: value.accountType || value.AccountType || 'Current Account',

    // Policies
    payFrequency: value.payFrequency || value.PayFrequency || 'Monthly',
    payDay: value.payDay || value.PayDay || '1st of month',
    standardDailyHours: value.standardDailyHours ?? value.StandardDailyHours ?? 8.0,
    weeklyOff: value.weeklyOff || value.WeeklyOff || 'Sunday Only',
    attendanceTrackingMode: value.attendanceTrackingMode || value.AttendanceTrackingMode || 'Biometric + Mobile App',
    fiscalYearStart: value.fiscalYearStart || value.FiscalYearStart || 'April - March',
    baseCurrency: value.baseCurrency || value.BaseCurrency || 'INR',
    probationPeriodDays: Number(value.probationPeriodDays ?? value.ProbationPeriodDays ?? 90),
    noticePeriodDays: Number(value.noticePeriodDays ?? value.NoticePeriodDays ?? 30),
    authorizedSignatoryName: value.authorizedSignatoryName || value.AuthorizedSignatoryName || '',
    authorizedSignatoryDesignation: value.authorizedSignatoryDesignation || value.AuthorizedSignatoryDesignation || '',
  }
}

export function buildCompanyPayload(form) {
  return {
    tenantId: form.tenantId || null,
    companyCode: (form.companyCode || generateCompanyCode()).trim().toUpperCase(),
    companyName: form.companyName.trim(),
    tradeName: form.tradeName.trim() || null,
    companyType: form.companyType || 'Private Limited Company',
    cinNumber: form.cinNumber.trim() || null,
    incorporationDate: form.incorporationDate ? new Date(form.incorporationDate).toISOString() : null,
    isActive: !!form.isActive,
    logoUrl: form.logoUrl.trim() || null,
    notes: form.notes.trim() || null,

    // Statutory
    gstinNumber: form.gstinNumber.trim() || null,
    panNumber: form.panNumber.trim().toUpperCase() || null,
    tanNumber: form.tanNumber.trim().toUpperCase() || null,
    pfNumber: form.pfNumber.trim() || null,
    esicNumber: form.esicNumber.trim() || null,
    ptNumber: form.ptNumber.trim() || null,
    linNumber: form.linNumber.trim() || null,
    udyamNumber: form.udyamNumber.trim() || null,
    taxId: form.taxId.trim() || form.panNumber.trim() || form.gstinNumber.trim() || null,

    // Address
    addressLine1: form.addressLine1.trim(),
    addressLine2: form.addressLine2.trim() || null,
    city: form.city.trim(),
    state: form.state.trim(),
    country: form.country.trim() || 'India',
    postalCode: form.postalCode.trim(),
    corporateAddress: form.corporateAddress.trim() || null,

    // Contact
    contactPerson: form.contactPerson.trim(),
    contactDesignation: form.contactDesignation.trim() || null,
    contactEmail: form.contactEmail.trim(),
    contactPhone: form.contactPhone.trim(),
    hrEmail: form.hrEmail.trim() || null,
    supportPhone: form.supportPhone.trim() || null,
    websiteUrl: form.websiteUrl.trim() || null,

    // Banking
    bankName: form.bankName.trim() || null,
    bankBranch: form.bankBranch.trim() || null,
    accountHolderName: form.accountHolderName.trim() || null,
    bankAccountNumber: form.bankAccountNumber.trim() || null,
    ifscCode: form.ifscCode.trim().toUpperCase() || null,
    accountType: form.accountType || 'Current Account',

    // Policies
    payFrequency: form.payFrequency || 'Monthly',
    payDay: form.payDay || '1st of month',
    standardDailyHours: Number(form.standardDailyHours) || 8.0,
    weeklyOff: form.weeklyOff || 'Sunday Only',
    attendanceTrackingMode: form.attendanceTrackingMode || 'Biometric + Mobile App',
    fiscalYearStart: form.fiscalYearStart || 'April - March',
    baseCurrency: form.baseCurrency || 'INR',
    probationPeriodDays: Number(form.probationPeriodDays) || 90,
    noticePeriodDays: Number(form.noticePeriodDays) || 30,
    authorizedSignatoryName: form.authorizedSignatoryName?.trim() || null,
    authorizedSignatoryDesignation: form.authorizedSignatoryDesignation?.trim() || null,
  }
}

function validate(form) {
  if (!form.tenantId) return 'Tenant mapping is required'
  if (!form.companyName.trim()) return 'Legal Company Name is required'
  if (form.contactEmail.trim() && !form.contactEmail.includes('@')) return 'Official Contact Email is invalid'
  if (form.hrEmail.trim() && !form.hrEmail.includes('@')) return 'HR Support Email is invalid'
  if (form.contactPhone.trim() && form.contactPhone.replace(/\D/g, '').length !== 10) return 'Primary contact phone must be exactly 10 digits'
  if (form.websiteUrl.trim()) {
    try {
      new URL(form.websiteUrl.trim().startsWith('http') ? form.websiteUrl.trim() : `https://${form.websiteUrl.trim()}`)
    } catch {
      return 'Corporate Website URL is invalid'
    }
  }
  return null
}

const tabs = [
  { key: 'Identity', Icon: Building2 },
  { key: 'Statutory', Icon: ShieldCheck },
  { key: 'Address', Icon: MapPin },
  { key: 'Contact', Icon: Phone },
  { key: 'Banking', Icon: Landmark },
  { key: 'HRMS Policies', Icon: Settings2 },
  { key: 'Setup Status', Icon: CheckCircle2 },
]

export default function CompanyForm({
  initialValue,
  saving = false,
  mode = 'create',
  tenantOptions = [],
  canSelectTenant = false,
  title = mode === 'edit' ? 'Edit Company' : 'Create Company',
  subtitle = 'Capture complete company profile, statutory registrations, banking, and policies required for HRMS, payroll, attendance, and reporting.',
  onSubmit,
  onCancel,
}) {
  const navigate = useNavigate()
  const [form, setForm] = useState(() => toCompanyForm(initialValue))
  const [error, setError] = useState('')
  const [logoFile, setLogoFile] = useState(null)
  const [activeTab, setActiveTab] = useState('Identity')
  const [codeLoading, setCodeLoading] = useState(false)
  const isEdit = mode === 'edit'
  const readOnly = mode === 'view'

  const fetchNextCompanyCode = useCallback(async () => {
    if (isEdit || readOnly) return
    setCodeLoading(true)
    try {
      const res = await getPreviewSequence('Company')
      if (res?.code) {
        setForm(cur => ({ ...cur, companyCode: res.code }))
      }
    } catch {
      // Fallback
    } finally {
      setCodeLoading(false)
    }
  }, [isEdit, readOnly])

  useEffect(() => {
    setForm(toCompanyForm(initialValue))
  }, [initialValue])

  useEffect(() => {
    if (!isEdit && !readOnly && !form.companyCode) {
      fetchNextCompanyCode()
    }
  }, [isEdit, readOnly, form.companyCode, fetchNextCompanyCode])

  const previewLogoUrl = useMemo(() => {
    if (logoFile) return URL.createObjectURL(logoFile)
    return brandingLogoUrl(form)
  }, [form, logoFile])

  useEffect(() => {
    if (!logoFile) return undefined
    return () => URL.revokeObjectURL(previewLogoUrl)
  }, [logoFile, previewLogoUrl])

  const set = (key, value) => setForm(current => ({ ...current, [key]: value }))
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    let finalValue = type === 'checkbox' ? checked : value
    if (['panNumber', 'tanNumber', 'gstinNumber', 'ifscCode', 'companyCode'].includes(name) && typeof finalValue === 'string') {
      finalValue = finalValue.toUpperCase()
    }
    if (['contactPhone'].includes(name) && typeof finalValue === 'string') {
      finalValue = finalValue.replace(/\D/g, '').slice(0, 10)
    }
    set(name, finalValue)
  }

  const currentTabIndex = tabs.findIndex(t => t.key === activeTab)
  const isFirstTab = currentTabIndex === 0
  const isLastTab = currentTabIndex === tabs.length - 1

  const isTabCompleted = useMemo(() => ({
    Identity: (isEdit || readOnly) ? !!(form.companyCode.trim() && form.companyName.trim() && form.tenantId) : !!(form.companyName.trim() && form.tenantId),
    Statutory: !!(form.panNumber.trim() || form.gstinNumber.trim()),
    Address: !!(form.addressLine1.trim() && form.city.trim() && form.state.trim() && form.postalCode.trim()),
    Contact: !!(form.contactPerson.trim() && form.contactEmail.trim() && form.contactPhone.trim()),
    Banking: !!(form.bankName.trim() && form.bankAccountNumber.trim() && form.ifscCode.trim()),
    'HRMS Policies': !!(form.payFrequency && form.standardDailyHours),
    'Setup Status': false,
  }), [form])

  const goToNextTab = () => {
    if (currentTabIndex < tabs.length - 1) {
      setActiveTab(tabs[currentTabIndex + 1].key)
    }
  }

  const goToPrevTab = () => {
    if (currentTabIndex > 0) {
      setActiveTab(tabs[currentTabIndex - 1].key)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const message = validate(form)
    if (message) {
      setError(message)
      return
    }
    setError('')
    onSubmit(buildCompanyPayload(form), { logoFile })
  }

  const handleBack = () => {
    if (onCancel) onCancel()
    else navigate(-1)
  }

  return (
    <div className="space-y-4 antialiased pb-8">
      <PageHeader
        icon={Building2}
        title={title}
        badge={isEdit ? 'Update Entity' : 'New Statutory Entity'}
        badgeTone="blue"
        actions={
          <div className="flex items-center gap-2">
            <LayoutVersionBadge entity="company" version={1.0} />
            <PageCustomizationMenu
              entityType="company"
              schemaId="company"
            />
            <button type="button" onClick={handleBack} className="btn btn-back text-xs py-1 px-2.5">
              <ArrowLeft size={14} /> Back
            </button>
          </div>
        }
      />

      {/* Tab Pills Bar matching Create Employee */}
      <div className="mb-4 overflow-x-auto rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex min-w-max gap-2">
          {tabs.map(({ key, Icon }) => {
            const isCompleted = isTabCompleted[key]
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`btn btn-sm relative ${activeTab === key ? 'btn-primary' : 'btn-secondary'}`}
              >
                <Icon size={15} /> {key}
                {isCompleted && (
                  <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                    ✓
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Form Container */}
      <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        {error && (
          <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* 1. Identity Tab */}
        {activeTab === 'Identity' && (
          <Section
            title="Identity"
            subtitle="Legal entity name, trade name, incorporation, CIN, and core brand identifiers."
          >
            {(isEdit || readOnly) && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    Company Code <span className="text-red-500">*</span>
                    <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">Registered</span>
                  </label>
                </div>
                <input
                  type="text"
                  name="companyCode"
                  value={form.companyCode}
                  onChange={handleChange}
                  placeholder="e.g. CMP-001"
                  required
                  disabled={readOnly}
                  className="input w-full font-mono uppercase font-semibold text-blue-900 bg-slate-50/70 border-slate-300"
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  Official company code assigned in master.
                </p>
              </div>
            )}
            <Input
              label="Legal Company Name"
              name="companyName"
              value={form.companyName}
              onChange={handleChange}
              placeholder="e.g. Uabindia Technologies Private Limited"
              required
            />
            <Input
              label="Trade Name / Brand Name"
              name="tradeName"
              value={form.tradeName}
              onChange={handleChange}
              placeholder="e.g. Uabindia HRMS"
            />
            <Select
              label="Company Entity Type"
              name="companyType"
              value={form.companyType}
              onChange={handleChange}
              required
            >
              <option value="Private Limited Company">Private Limited Company (Pvt Ltd)</option>
              <option value="Public Limited Company">Public Limited Company (Ltd)</option>
              <option value="Limited Liability Partnership">Limited Liability Partnership (LLP)</option>
              <option value="Partnership Firm">Partnership Firm</option>
              <option value="Sole Proprietorship">Sole Proprietorship</option>
              <option value="Government / PSU">Government / PSU / Undertaking</option>
              <option value="Section 8 / Trust / Society">Section 8 / Trust / Society / NGO</option>
            </Select>
            <Input
              label="CIN / Registration Number"
              name="cinNumber"
              value={form.cinNumber}
              onChange={handleChange}
              placeholder="e.g. U72200BR2022PTC123456"
            />
            <Input
              label="Date of Incorporation"
              type="date"
              name="incorporationDate"
              value={form.incorporationDate}
              onChange={handleChange}
            />
            <Select
              label="Tenant Mapping"
              name="tenantId"
              value={form.tenantId}
              onChange={handleChange}
              disabled={!canSelectTenant && tenantOptions.length > 0}
              required
            >
              <option value="">Select Tenant</option>
              {tenantOptions.map(option => (
                <option key={option.tenantId} value={option.tenantId}>
                  {option.companyName}
                </option>
              ))}
            </Select>
            <Select
              label="Status"
              name="isActive"
              value={form.isActive ? 'active' : 'inactive'}
              onChange={e => set('isActive', e.target.value === 'active')}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
            <div className="md:col-span-2 xl:col-span-1">
              <FieldLabel label="Company Logo" />
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-14 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-1.5">
                  <img src={previewLogoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="btn btn-outline btn-sm cursor-pointer gap-1.5">
                    <ImagePlus size={14} /> Upload
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                      className="hidden"
                      onChange={e => setLogoFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  {(logoFile || form.logoUrl) && (
                    <button
                      type="button"
                      className="btn btn-danger btn-sm gap-1"
                      onClick={() => {
                        setLogoFile(null)
                        set('logoUrl', '')
                      }}
                    >
                      <Trash2 size={14} /> Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
            <Textarea
              label="Company Tagline / Setup Remarks"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Brief description or purpose of this company entity in the enterprise HRMS..."
            />
          </Section>
        )}

        {/* 2. Statutory & Tax Compliance Tab */}
        {activeTab === 'Statutory' && (
          <Section
            title="Statutory & Tax Compliance"
            subtitle="GST, PAN, TAN, EPFO PF, ESIC, and labor registration credentials for statutory compliance."
          >
            <Input
              label="GSTIN (15 Characters)"
              name="gstinNumber"
              value={form.gstinNumber}
              onChange={handleChange}
              placeholder="e.g. 10AAAAA0000A1Z5"
            />
            <Input
              label="Permanent Account Number (PAN)"
              name="panNumber"
              value={form.panNumber}
              onChange={handleChange}
              placeholder="e.g. ABCDE1234F"
            />
            <Input
              label="Tax Deduction Account (TAN)"
              name="tanNumber"
              value={form.tanNumber}
              onChange={handleChange}
              placeholder="e.g. PTM012345D"
            />
            <Input
              label="EPFO / PF Establishment Code"
              name="pfNumber"
              value={form.pfNumber}
              onChange={handleChange}
              placeholder="e.g. BR/PAT/0012345/000"
            />
            <Input
              label="ESIC Employer Code"
              name="esicNumber"
              value={form.esicNumber}
              onChange={handleChange}
              placeholder="e.g. 11000123450000101"
            />
            <Input
              label="Professional Tax (PT) Reg No"
              name="ptNumber"
              value={form.ptNumber}
              onChange={handleChange}
              placeholder="e.g. PT-BR-987654"
            />
            <Input
              label="Labour Identification Number (LIN)"
              name="linNumber"
              value={form.linNumber}
              onChange={handleChange}
              placeholder="e.g. 1234567890"
            />
            <Input
              label="MSME / Udyam Registration No"
              name="udyamNumber"
              value={form.udyamNumber}
              onChange={handleChange}
              placeholder="e.g. UDYAM-BR-01-0012345"
            />
            <Input
              label="General Tax ID (Fallback)"
              name="taxId"
              value={form.taxId}
              onChange={handleChange}
              placeholder="Fallback general tax/legal identifier"
            />
          </Section>
        )}

        {/* 3. Address Tab */}
        {activeTab === 'Address' && (
          <Section
            title="Registered & Corporate Address"
            subtitle="Registered legal headquarters and operating office addresses."
          >
            <Input
              label="Registered Address Line 1"
              name="addressLine1"
              value={form.addressLine1}
              onChange={handleChange}
              placeholder="Premises / Plot No, Building, Street"
              required
            />
            <Input
              label="Registered Address Line 2"
              name="addressLine2"
              value={form.addressLine2}
              onChange={handleChange}
              placeholder="Area, Landmark, Sector"
            />
            <Input
              label="City"
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="e.g. Patna"
              required
            />
            <Input
              label="State"
              name="state"
              value={form.state}
              onChange={handleChange}
              placeholder="e.g. Bihar"
              required
            />
            <Input
              label="PIN / Postal Code"
              name="postalCode"
              value={form.postalCode}
              onChange={handleChange}
              placeholder="e.g. 800001"
              required
            />
            <Input
              label="Country"
              name="country"
              value={form.country}
              onChange={handleChange}
              placeholder="India"
              required
            />
            <Textarea
              label="Corporate / Operating Address (If Different)"
              name="corporateAddress"
              value={form.corporateAddress}
              onChange={handleChange}
              placeholder="Enter full operational address if distinct from registered legal office..."
            />
          </Section>
        )}

        {/* 4. Contact Tab */}
        {activeTab === 'Contact' && (
          <Section
            title="Contact & Communication"
            subtitle="Authorised signatory, official corporate email, phone, and helpdesk lines."
          >
            <Input
              label="Authorised Signatory / Primary Contact"
              name="contactPerson"
              value={form.contactPerson}
              onChange={handleChange}
              placeholder="e.g. Shailesh Kumar"
              required
            />
            <Input
              label="Signatory Designation"
              name="contactDesignation"
              value={form.contactDesignation}
              onChange={handleChange}
              placeholder="e.g. Managing Director / HR Head"
            />
            <Input
              label="Official Corporate Email"
              type="email"
              name="contactEmail"
              value={form.contactEmail}
              onChange={handleChange}
              placeholder="admin@company.com"
              required
            />
            <Input
              label="Primary Phone / Mobile"
              name="contactPhone"
              value={form.contactPhone}
              onChange={handleChange}
              maxLength={10}
              inputMode="numeric"
              placeholder="e.g. 9876543210"
              required
            />
            <Input
              label="HR / Payroll Support Email"
              type="email"
              name="hrEmail"
              value={form.hrEmail}
              onChange={handleChange}
              placeholder="hr@company.com"
            />
            <Input
              label="Toll-Free / Support Phone"
              name="supportPhone"
              value={form.supportPhone}
              onChange={handleChange}
              placeholder="e.g. 1800-123-4567"
            />
            <Input
              label="Corporate Website URL"
              name="websiteUrl"
              value={form.websiteUrl}
              onChange={handleChange}
              placeholder="https://www.company.com"
            />
          </Section>
        )}

        {/* 5. Banking Tab */}
        {activeTab === 'Banking' && (
          <Section
            title="Banking & Disbursal Accounts"
            subtitle="Corporate bank account information for salary disbursal and vendor payments."
          >
            <Input
              label="Disbursal Bank Name"
              name="bankName"
              value={form.bankName}
              onChange={handleChange}
              placeholder="e.g. State Bank of India, HDFC Bank"
              required
            />
            <Input
              label="Bank Branch Name"
              name="bankBranch"
              value={form.bankBranch}
              onChange={handleChange}
              placeholder="e.g. Main Branch, Patna"
            />
            <Input
              label="Account Holder / Beneficiary Name"
              name="accountHolderName"
              value={form.accountHolderName}
              onChange={handleChange}
              placeholder="e.g. Uabindia Technologies Pvt Ltd"
              required
            />
            <Input
              label="Bank Account Number"
              name="bankAccountNumber"
              value={form.bankAccountNumber}
              onChange={handleChange}
              placeholder="e.g. 123456789012"
              required
            />
            <Input
              label="IFSC Code"
              name="ifscCode"
              value={form.ifscCode}
              onChange={handleChange}
              placeholder="e.g. SBIN0001234"
              required
            />
            <Select
              label="Account Type"
              name="accountType"
              value={form.accountType}
              onChange={handleChange}
            >
              <option value="Current Account">Current Account</option>
              <option value="Cash Credit (CC)">Cash Credit (CC)</option>
              <option value="Overdraft (OD)">Overdraft (OD)</option>
              <option value="Escrow Account">Escrow Account</option>
            </Select>
          </Section>
        )}

        {/* 6. HRMS Policies Tab */}
        {activeTab === 'HRMS Policies' && (
          <Section
            title="HRMS & Payroll Policies"
            subtitle="Salary cycle, working hours, weekly offs, and attendance tracking modes."
          >
            <Select
              label="Salary Pay Frequency"
              name="payFrequency"
              value={form.payFrequency}
              onChange={handleChange}
            >
              <option value="Monthly">Monthly</option>
              <option value="Semi-Monthly">Semi-Monthly (Twice a month)</option>
              <option value="Bi-Weekly">Bi-Weekly (Every 2 weeks)</option>
              <option value="Weekly">Weekly</option>
            </Select>
            <Select
              label="Salary Disbursal Day"
              name="payDay"
              value={form.payDay}
              onChange={handleChange}
            >
              <option value="1st of month">1st of next month</option>
              <option value="5th of month">5th of next month</option>
              <option value="7th of month">7th of next month</option>
              <option value="10th of month">10th of next month</option>
              <option value="Last working day">Last working day of month</option>
            </Select>
            <Input
              label="Standard Daily Working Hours"
              type="number"
              step="0.5"
              min="4"
              max="16"
              name="standardDailyHours"
              value={form.standardDailyHours}
              onChange={handleChange}
              placeholder="8.0"
            />
            <Select
              label="Weekly Off Pattern"
              name="weeklyOff"
              value={form.weeklyOff}
              onChange={handleChange}
            >
              <option value="Sunday Only">Sunday Only</option>
              <option value="Saturday & Sunday">Saturday & Sunday</option>
              <option value="2nd & 4th Saturday + Sunday">2nd & 4th Saturday + Sunday</option>
              <option value="Custom / Shift Based">Custom / Shift Based</option>
            </Select>
            <Select
              label="Attendance Tracking Mode"
              name="attendanceTrackingMode"
              value={form.attendanceTrackingMode}
              onChange={handleChange}
            >
              <option value="Biometric + Mobile App">Biometric Device + Mobile App (ESS)</option>
              <option value="Biometric Only">Biometric Machine Only</option>
              <option value="Mobile App Only">Mobile App (ESS / GPS) Only</option>
            </Select>
            <Select
              label="Fiscal / Financial Year Cycle"
              name="fiscalYearStart"
              value={form.fiscalYearStart}
              onChange={handleChange}
            >
              <option value="April - March">April 1st - March 31st (India Standard)</option>
              <option value="January - December">January 1st - December 31st (Calendar Year)</option>
            </Select>
            <Select
              label="Base Operating Currency"
              name="baseCurrency"
              value={form.baseCurrency}
              onChange={handleChange}
            >
              <option value="INR">INR (₹) Indian Rupee</option>
              <option value="USD">USD ($) US Dollar</option>
              <option value="EUR">EUR (€) Euro</option>
              <option value="AED">AED (د.إ) UAE Dirham</option>
            </Select>
            <Input
              label="Default Probation Period (Days)"
              type="number"
              min="0"
              max="365"
              name="probationPeriodDays"
              value={form.probationPeriodDays}
              onChange={handleChange}
              placeholder="90"
            />
            <Input
              label="Default Notice Period (Days)"
              type="number"
              min="0"
              max="180"
              name="noticePeriodDays"
              value={form.noticePeriodDays}
              onChange={handleChange}
              placeholder="30"
            />
            <Input
              label="Authorized Signatory Name"
              name="authorizedSignatoryName"
              value={form.authorizedSignatoryName}
              onChange={handleChange}
              placeholder="Full legal name for contracts & payslips"
            />
            <Input
              label="Authorized Signatory Designation"
              name="authorizedSignatoryDesignation"
              value={form.authorizedSignatoryDesignation}
              onChange={handleChange}
              placeholder="e.g. Director, Head of Human Resources"
            />
          </Section>
        )}

        {/* 7. Setup Status Tab */}
        {activeTab === 'Setup Status' && (
          <div>
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-slate-900">Company Master Setup Checklist</h3>
              <p className="mt-1 text-sm text-slate-500">
                A complete company configuration in HRMS requires these interconnected modules. Click on any step to open it directly.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Step 1 Card: switches smoothly to Identity/Statutory tab */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setActiveTab('Identity')}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveTab('Identity') }}
                className="group cursor-pointer rounded-xl border-2 border-emerald-300 bg-emerald-50/60 p-5 shadow-xs transition hover:border-emerald-500 hover:bg-emerald-50 hover:shadow-md text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Step 1 • Profile & Statutory</span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={13} /> Active Tab
                  </span>
                </div>
                <div className="mt-3 text-base font-bold text-slate-900 group-hover:text-emerald-900">
                  Legal Identity & Statutory
                </div>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  Company legal name, GSTIN, PAN, EPFO, address, banking, and policies configured in this form.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-emerald-200/60">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setActiveTab('Identity') }}
                    className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-300 hover:bg-emerald-100"
                  >
                    Identity &rarr;
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setActiveTab('Statutory') }}
                    className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-300 hover:bg-emerald-100"
                  >
                    Statutory &rarr;
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setActiveTab('Banking') }}
                    className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-300 hover:bg-emerald-100"
                  >
                    Banking &rarr;
                  </button>
                </div>
              </div>

              {/* Step 2 Card: navigates smoothly within SPA without logout */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => navigate('/module/hrms/department')}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/module/hrms/department') }}
                className="group cursor-pointer rounded-xl border-2 border-purple-300 bg-purple-50/60 p-5 shadow-xs transition hover:border-purple-500 hover:bg-purple-50 hover:shadow-md text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-800">Step 2 • Org Masters</span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-100/90 px-2 py-0.5 rounded-full">
                    Configure
                  </span>
                </div>
                <div className="mt-3 text-base font-bold text-slate-900 group-hover:text-purple-900">
                  Departments & Designations
                </div>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  Setup organizational hierarchy, departments, designations, employee grades, and company branches.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-purple-200/60">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); navigate('/module/hrms/department') }}
                    className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-purple-800 border border-purple-300 hover:bg-purple-100"
                  >
                    Departments &rarr;
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); navigate('/module/hrms/designation') }}
                    className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-purple-800 border border-purple-300 hover:bg-purple-100"
                  >
                    Designations &rarr;
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); navigate('/module/hrms/branch') }}
                    className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-purple-800 border border-purple-300 hover:bg-purple-100"
                  >
                    Branches &rarr;
                  </button>
                </div>
              </div>

              {/* Step 3 Card: navigates smoothly within SPA without logout */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => navigate('/module/hrms/country')}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/module/hrms/country') }}
                className="group cursor-pointer rounded-xl border-2 border-blue-300 bg-blue-50/60 p-5 shadow-xs transition hover:border-blue-500 hover:bg-blue-50 hover:shadow-md text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-800">Step 3 • Hierarchy</span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-100/90 px-2 py-0.5 rounded-full">
                    Configure
                  </span>
                </div>
                <div className="mt-3 text-base font-bold text-slate-900 group-hover:text-blue-900">
                  7-Level Location Hierarchy
                </div>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  Country &rarr; Zone &rarr; Region &rarr; State &rarr; Cluster &rarr; District &rarr; Posting Location.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-blue-200/60">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); navigate('/module/hrms/country') }}
                    className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-blue-800 border border-blue-300 hover:bg-blue-100"
                  >
                    Country &rarr;
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); navigate('/module/hrms/state') }}
                    className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-blue-800 border border-blue-300 hover:bg-blue-100"
                  >
                    State &rarr;
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); navigate('/module/hrms/district') }}
                    className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-blue-800 border border-blue-300 hover:bg-blue-100"
                  >
                    District &rarr;
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); navigate('/module/hrms/location') }}
                    className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-blue-800 border border-blue-300 hover:bg-blue-100"
                  >
                    Posting Location &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Button matching Create Employee bottom-right */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5">
          <div className="flex items-center gap-3">
            {!isFirstTab && (
              <button
                type="button"
                onClick={goToPrevTab}
                className="btn btn-outline btn-sm"
              >
                &larr; Previous: {tabs[currentTabIndex - 1]?.key}
              </button>
            )}
            {!isLastTab && (
              <button
                type="button"
                onClick={goToNextTab}
                className="btn btn-outline btn-sm text-purple-700 border-purple-200 hover:bg-purple-50"
              >
                Next: {tabs[currentTabIndex + 1]?.key} &rarr;
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              disabled={saving}
              className="btn btn-back"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-save shadow-sm"
            >
              <Save size={16} /> {saving ? 'Saving...' : mode === 'edit' ? 'Update Company' : 'Save Company'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

function Section({ title, subtitle, children }) {
  return (
    <section>
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  )
}

function FieldLabel({ label, required }) {
  return (
    <label className="mb-1 block text-sm font-semibold text-slate-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
  )
}

function Input({ label, required, disabled, className = '', ...props }) {
  return (
    <div>
      <FieldLabel label={label} required={required} />
      <input
        {...props}
        disabled={disabled}
        required={required}
        className={`input w-full disabled:bg-slate-50 disabled:text-slate-500 ${className}`}
      />
    </div>
  )
}

function Select({ label, required, disabled, children, ...props }) {
  return (
    <div>
      <FieldLabel label={label} required={required} />
      <select
        {...props}
        disabled={disabled}
        required={required}
        className="input w-full disabled:bg-slate-50 disabled:text-slate-500"
      >
        {children}
      </select>
    </div>
  )
}

function Textarea({ label, required, disabled, ...props }) {
  return (
    <div className="md:col-span-2 xl:col-span-3">
      <FieldLabel label={label} required={required} />
      <textarea
        {...props}
        rows={3}
        disabled={disabled}
        required={required}
        className="input min-h-[92px] w-full resize-y disabled:bg-slate-50 disabled:text-slate-500"
      />
    </div>
  )
}
