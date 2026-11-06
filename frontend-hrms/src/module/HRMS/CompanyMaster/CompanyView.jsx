import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Landmark,
  MapPin,
  Pencil,
  Phone,
  Power,
  Settings2,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { deleteCompany, getCompany, removeCompanyLogo, updateCompanyStatus } from '../../../api/companies'
import { brandingLogoUrl } from '../../../api/branding'
import { useToast } from '../../../components/ToastProvider'
import { useConfirm } from '../../../components/ConfirmProvider'
import CompanySetupPanel from './CompanySetupPanel'

function Row({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-medium text-slate-800 break-words">{value || '—'}</div>
    </div>
  )
}

function Section({ title, subtitle, children }) {
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
    </div>
  )
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

export default function CompanyView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()
  const location = useLocation()
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Identity')

  const tabParam = new URLSearchParams(location.search).get('tab')
  useEffect(() => {
    if (tabParam) {
      const normalized = tabParam.toLowerCase().replace(/[-_]/g, ' ')
      const match = tabs.find(t => {
        const keyNorm = t.key.toLowerCase()
        return keyNorm === normalized || keyNorm.startsWith(normalized) || normalized.startsWith(keyNorm)
      })
      if (match) setActiveTab(match.key)
    }
  }, [tabParam])

  async function load() {
    setLoading(true)
    try {
      const data = await getCompany(id)
      setCompany(data)
    } catch (error) {
      setCompany(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  async function toggleStatus() {
    if (!company) return
    const active = !!(company.isActive ?? company.IsActive)
    const ok = await confirm({
      message: `${active ? 'Deactivate' : 'Activate'} this company?`,
      confirmLabel: active ? 'Deactivate' : 'Activate',
      tone: active ? 'danger' : 'primary',
    })
    if (!ok) return

    try {
      await updateCompanyStatus(id, !active)
      await load()
    } catch (error) {
      toast(error?.response?.data?.message || 'Status update failed', 'error')
    }
  }

  async function clearLogo() {
    if (!company) return
    const currentLogo = company.logoUrl || company.LogoUrl
    if (!currentLogo) return

    const ok = await confirm({
      message: 'Remove the company logo?',
      confirmLabel: 'Remove Logo',
      tone: 'danger',
    })
    if (!ok) return

    try {
      await removeCompanyLogo(id)
      await load()
    } catch (error) {
      toast(error?.response?.data?.message || 'Logo remove failed', 'error')
    }
  }

  async function removeCompanyRecord() {
    if (!company) return
    const ok = await confirm({
      message: 'Delete company permanently? This works only after deactivation.',
      confirmLabel: 'Delete',
      tone: 'danger',
    })
    if (!ok) return

    try {
      await deleteCompany(id)
      navigate('/module/hrms/company-master', { replace: true })
    } catch (error) {
      toast(error?.response?.data?.message || 'Delete failed', 'error')
    }
  }

  if (loading) {
    return <div className="px-4 py-6 text-sm text-slate-500">Loading company information...</div>
  }

  if (!company) {
    return (
      <div className="px-4 py-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Company not found or access denied.
        </div>
        <Link to="/module/hrms/company-master" className="btn btn-outline mt-4 gap-2">
          <ArrowLeft size={16} /> Back to Company Master
        </Link>
      </div>
    )
  }

  const isActive = !!(company.isActive ?? company.IsActive)
  const logoUrl = company.logoUrl || company.LogoUrl

  return (
    <div className="space-y-4 antialiased pb-8">
      {/* Standard Header bar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 shadow-2xs">
            {logoUrl ? (
              <img src={brandingLogoUrl(company)} alt="Logo" className="max-h-full max-w-full object-contain" />
            ) : (
              <Building2 size={18} className="text-blue-600" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-bold text-slate-900 tracking-tight">{company.companyName || company.CompanyName}</h1>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Code: <span className="font-semibold text-slate-700">{company.companyCode || company.CompanyCode || '—'}</span>
              {company.tenantName || company.TenantName ? ` • Tenant: ${company.tenantName || company.TenantName}` : ''}
              {company.tradeName || company.TradeName ? ` • Brand: ${company.tradeName || company.TradeName}` : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/module/hrms/company-master" className="btn btn-back">
            <ArrowLeft size={16} /> Back
          </Link>
          <Link to={`/module/hrms/company-master/edit/${id}`} className="btn btn-edit">
            <Pencil size={16} /> Edit
          </Link>
          <button className={isActive ? 'btn btn-deactivate' : 'btn btn-primary'} onClick={toggleStatus}>
            <Power size={16} /> {isActive ? 'Deactivate' : 'Activate'}
          </button>
          {!isActive && (
            <button className="btn btn-danger" onClick={removeCompanyRecord}>
              <Trash2 size={16} /> Delete
            </button>
          )}
        </div>
      </div>

      {/* Tab Pills Bar matching Create Employee */}
      <div className="mb-4 overflow-x-auto rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex min-w-max gap-2">
          {tabs.map(({ key, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setActiveTab(key)
                navigate(`${location.pathname}?tab=${key.toLowerCase()}`, { replace: true })
              }}
              className={`btn btn-sm ${activeTab === key ? 'btn-primary' : 'btn-secondary'}`}
            >
              <Icon size={15} /> {key}
            </button>
          ))}
        </div>
      </div>

      {/* Main Container */}
      {activeTab === 'Setup Status' ? (
        <CompanySetupPanel
          companyId={id}
          companyName={company.companyName || company.CompanyName}
        />
      ) : (
        <div className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-xs">
          {/* 1. Identity Tab */}
        {activeTab === 'Identity' && (
          <Section
            title="Identity"
            subtitle="Legal entity name, trade name, incorporation, CIN, and core brand identifiers."
          >
            <Row label="Company Code" value={company.companyCode || company.CompanyCode} />
            <Row label="Legal Company Name" value={company.companyName || company.CompanyName} />
            <Row label="Trade / Brand Name" value={company.tradeName || company.TradeName} />
            <Row label="Entity Type" value={company.companyType || company.CompanyType} />
            <Row label="CIN / Registration No" value={company.cinNumber || company.CinNumber} />
            <Row
              label="Date of Incorporation"
              value={company.incorporationDate || company.IncorporationDate ? new Date(company.incorporationDate || company.IncorporationDate).toLocaleDateString() : '—'}
            />
            <Row label="Tenant" value={company.tenantName || company.TenantName} />
            <Row label="Status" value={isActive ? 'Active' : 'Inactive'} />
            <Row label="Created At" value={company.createdAt || company.CreatedAt ? new Date(company.createdAt || company.CreatedAt).toLocaleDateString() : '—'} />
            {(company.notes || company.Notes) && (
              <div className="md:col-span-2 lg:col-span-3">
                <Row label="Tagline / Notes" value={company.notes || company.Notes} />
              </div>
            )}
          </Section>
        )}

        {/* 2. Statutory Tab */}
        {activeTab === 'Statutory' && (
          <Section
            title="Statutory & Tax Compliance"
            subtitle="GST, PAN, TAN, EPFO PF, ESIC, and labor registration credentials for statutory compliance."
          >
            <Row label="GSTIN (15 Digits)" value={company.gstinNumber || company.GstinNumber} />
            <Row label="Permanent Account Number (PAN)" value={company.panNumber || company.PanNumber} />
            <Row label="Tax Deduction Account (TAN)" value={company.tanNumber || company.TanNumber} />
            <Row label="EPFO / PF Establishment Code" value={company.pfNumber || company.PfNumber} />
            <Row label="ESIC Employer Code" value={company.esicNumber || company.EsicNumber} />
            <Row label="Professional Tax (PT) Reg No" value={company.ptNumber || company.PtNumber} />
            <Row label="Labour Identification Number (LIN)" value={company.linNumber || company.LinNumber} />
            <Row label="MSME / Udyam Reg No" value={company.udyamNumber || company.UdyamNumber} />
            <Row label="General Tax ID (Fallback)" value={company.taxId || company.TaxId} />
          </Section>
        )}

        {/* 3. Address Tab */}
        {activeTab === 'Address' && (
          <Section
            title="Registered & Corporate Address"
            subtitle="Registered legal headquarters and operating office addresses."
          >
            <Row label="Registered Address Line 1" value={company.addressLine1 || company.AddressLine1} />
            <Row label="Registered Address Line 2" value={company.addressLine2 || company.AddressLine2} />
            <Row label="City" value={company.city || company.City} />
            <Row label="State" value={company.state || company.State} />
            <Row label="PIN / Postal Code" value={company.postalCode || company.PostalCode} />
            <Row label="Country" value={company.country || company.Country || 'India'} />
            {(company.corporateAddress || company.CorporateAddress) && (
              <div className="md:col-span-2 lg:col-span-3">
                <Row label="Corporate / Operating Address" value={company.corporateAddress || company.CorporateAddress} />
              </div>
            )}
          </Section>
        )}

        {/* 4. Contact Tab */}
        {activeTab === 'Contact' && (
          <Section
            title="Contact & Communication"
            subtitle="Authorised signatory, official corporate email, phone, and helpdesk lines."
          >
            <Row label="Authorised Signatory" value={company.contactPerson || company.ContactPerson} />
            <Row label="Signatory Designation" value={company.contactDesignation || company.ContactDesignation} />
            <Row label="Official Corporate Email" value={company.contactEmail || company.ContactEmail} />
            <Row label="Primary Phone / Mobile" value={company.contactPhone || company.ContactPhone} />
            <Row label="HR / Payroll Support Email" value={company.hrEmail || company.HrEmail} />
            <Row label="Toll-Free / Support Phone" value={company.supportPhone || company.SupportPhone} />
            <Row label="Corporate Website" value={company.websiteUrl || company.WebsiteUrl} />
          </Section>
        )}

        {/* 5. Banking Tab */}
        {activeTab === 'Banking' && (
          <Section
            title="Banking & Disbursal Accounts"
            subtitle="Corporate bank account information for salary disbursal and vendor payments."
          >
            <Row label="Disbursal Bank Name" value={company.bankName || company.BankName} />
            <Row label="Bank Branch" value={company.bankBranch || company.BankBranch} />
            <Row label="Account Holder Name" value={company.accountHolderName || company.AccountHolderName} />
            <Row label="Bank Account Number" value={company.bankAccountNumber || company.BankAccountNumber} />
            <Row label="IFSC Code" value={company.ifscCode || company.IfscCode} />
            <Row label="Account Type" value={company.accountType || company.AccountType} />
          </Section>
        )}

        {/* 6. HRMS Policies Tab */}
        {activeTab === 'HRMS Policies' && (
          <Section
            title="HRMS & Payroll Policies"
            subtitle="Salary cycle, working hours, weekly offs, and attendance tracking modes."
          >
            <Row label="Salary Pay Frequency" value={company.payFrequency || company.PayFrequency} />
            <Row label="Salary Disbursal Day" value={company.payDay || company.PayDay} />
            <Row
              label="Standard Daily Working Hours"
              value={company.standardDailyHours ?? company.StandardDailyHours ? `${company.standardDailyHours ?? company.StandardDailyHours} hours` : '8.0 hours'}
            />
            <Row label="Fiscal / Financial Year" value={company.fiscalYearStart || company.FiscalYearStart} />
            <Row label="Base Currency" value={company.baseCurrency || company.BaseCurrency || 'INR (₹)'} />
            <Row label="Default Probation Period" value={`${company.probationPeriodDays ?? company.ProbationPeriodDays ?? 90} Days`} />
            <Row label="Default Notice Period" value={`${company.noticePeriodDays ?? company.NoticePeriodDays ?? 30} Days`} />
            <Row label="Authorized Signatory" value={company.authorizedSignatoryName || company.AuthorizedSignatoryName || company.contactPerson || company.ContactPerson || '-'} />
            <Row label="Signatory Title" value={company.authorizedSignatoryDesignation || company.AuthorizedSignatoryDesignation || company.contactDesignation || company.ContactDesignation || '-'} />
          </Section>
        )}

        </div>
      )}
    </div>
  )
}
