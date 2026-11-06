import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  Building2,
  FolderKanban,
  SlidersHorizontal,
  Layers,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  Plus,
  Calendar,
  Briefcase,
  CheckCircle2,
  Save,
  Clock,
  Award
} from 'lucide-react'
import { listCompanies, getCompany } from '../../api/companies'
import { listProjects } from '../../api/projects'
import { listTenants } from '../../api/tenants'
import CompanySetupPanel from './CompanyMaster/CompanySetupPanel'
import PageHeader from '../../components/PageHeader'
import LayoutVersionBadge from '../../components/LayoutVersionBadge'

function readLocal(key) {
  try {
    if (typeof window === 'undefined') return ''
    return window.localStorage.getItem(key) || ''
  } catch {
    return ''
  }
}

export default function SetupCenter() {
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams()

  const [activeStep, setActiveStep] = useState(3) // Default to Step 3 (Master Data / Location Setup)
  const [companyId, setCompanyId] = useState(
    params.companyId || new URLSearchParams(location.search).get('companyId') || readLocal('sel_company_id') || ''
  )
  const [companies, setCompanies] = useState([])
  const [companyDetails, setCompanyDetails] = useState(null)
  const [tenants, setTenants] = useState([])
  const [projects, setProjects] = useState([])
  const [healthStats, setHealthStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [policySaved, setPolicySaved] = useState(false)
  const [policies, setPolicies] = useState(() => {
    try {
      const saved = localStorage.getItem('hrms_company_policies')
      if (saved) return JSON.parse(saved)
    } catch {}
    return {
      geofenceRadiusMeters: 200,
      lateMarkGraceMinutes: 15,
      autoHalfDayLateCount: 3,
      annualCLDays: 12,
      annualSLDays: 10,
      annualELDays: 15,
      maxELCarryForward: 45,
      probationDurationDays: 180,
      noticePeriodDays: 60,
      statutoryPFPercent: 12,
      statutoryESICPercent: 0.75,
      epfWageCeiling: 15000,
      esicGrossCeiling: 21000
    }
  })

  const handleSavePolicies = (e) => {
    e.preventDefault()
    try {
      localStorage.setItem('hrms_company_policies', JSON.stringify(policies))
      setPolicySaved(true)
      setTimeout(() => setPolicySaved(false), 2500)
    } catch {}
  }

  // 1. Load Companies and Tenants
  useEffect(() => {
    async function init() {
      setLoading(true)
      try {
        const [compRes, tenantRes] = await Promise.allSettled([
          listCompanies({ status: 'active' }),
          listTenants()
        ])

        const compList = compRes.status === 'fulfilled' && Array.isArray(compRes.value) ? compRes.value : []
        setCompanies(compList)

        let tenantList = []
        if (tenantRes.status === 'fulfilled') {
          tenantList = tenantRes.value?.items || (Array.isArray(tenantRes.value) ? tenantRes.value : [])
        }
        setTenants(tenantList)

        if (!companyId && compList.length > 0) {
          const firstId = compList[0].companyId || compList[0].id
          setCompanyId(firstId)
        }
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  // 2. Load Selected Company Details & Projects
  useEffect(() => {
    setHealthStats(null)
    if (!companyId) return
    async function loadDetails() {
      try {
        const [compDetail, projRes] = await Promise.allSettled([
          getCompany(companyId),
          listProjects({ companyId, status: 'all' })
        ])

        if (compDetail.status === 'fulfilled') {
          setCompanyDetails(compDetail.value)
        }
        if (projRes.status === 'fulfilled' && Array.isArray(projRes.value)) {
          setProjects(projRes.value)
        }
      } catch {
        // graceful fallback
      }
    }
    loadDetails()
  }, [companyId])

  const selectedCompany = companies.find(c => String(c.companyId || c.id) === String(companyId)) || companyDetails
  const activeTenant = tenants.find(t => String(t.tenantId || t.companyId) === String(selectedCompany?.tenantId)) || tenants[0]

  const steps = [
    {
      num: 1,
      title: 'Tenant Account',
      subtitle: 'SaaS Subscription & Isolation',
      badge: 'Layer 1',
      icon: ShieldCheck,
      desc: 'Account registration, subdomain verification, plan tier, isolation model & auth policies.'
    },
    {
      num: 2,
      title: 'Company Legal Entity',
      subtitle: 'Statutory & Financials',
      badge: 'Layer 2',
      icon: Building2,
      desc: 'PAN/GSTIN, CIN, PF/ESIC codes, payout banking, work week policies & authorized signatory.'
    },
    {
      num: 3,
      title: 'Hierarchy & Masters',
      subtitle: '7-Level Pipeline & Masters',
      badge: 'Layer 3',
      icon: Layers,
      desc: '7-level location pipeline (Country to Posting Location), departments, designations, shifts & holidays.'
    },
    {
      num: 4,
      title: 'Projects & Mapping',
      subtitle: 'Cost Centers & Operations',
      badge: 'Layer 4',
      icon: FolderKanban,
      desc: 'Active client/internal projects, billing rates, budgets, project managers & timesheet rules.'
    },
    {
      num: 5,
      title: 'Policy & Rule Engine',
      subtitle: 'No-Code Rules & Limits',
      badge: 'Layer 5',
      icon: SlidersHorizontal,
      desc: 'Attendance geofencing radius, leave accruals, probation thresholds, statutory caps & custom rules.'
    }
  ]

  return (
    <div className="space-y-4 antialiased pb-8">
      <PageHeader
        icon={SlidersHorizontal}
        title="Enterprise Setup & Onboarding"
        badge="Configuration Center"
        badgeTone="purple"
      >
        <LayoutVersionBadge entity="setup_center" version={1.0} />
        {companies.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Company:</span>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-2xs focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              {companies.map(c => (
                <option key={c.companyId || c.id} value={c.companyId || c.id}>
                  {c.companyName} {c.companyCode ? `(${c.companyCode})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate('/module/hrms/company-master')}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
        >
          <Building2 size={13} className="text-slate-500" />
          <span>Companies Directory</span>
        </button>
      </PageHeader>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">

        {/* 5-Step Architecture Hierarchy Bar */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {steps.map((st) => {
            const Icon = st.icon
            const isCurrent = activeStep === st.num
            return (
              <button
                key={st.num}
                type="button"
                onClick={() => setActiveStep(st.num)}
                className={`relative flex flex-col text-left p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
                  isCurrent
                    ? 'border-purple-600 bg-purple-50/50 shadow-xs ring-1 ring-purple-600'
                    : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                    isCurrent ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Icon size={16} />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isCurrent ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {st.badge}
                  </span>
                </div>
                <div className="font-bold text-xs sm:text-sm text-slate-900">{st.title}</div>
                <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{st.subtitle}</div>
              </button>
            )
          })}
        </div>

        {/* Unified Readiness Bar inside the SAME top card when on Hierarchy & Masters */}
        {activeStep === 3 && healthStats && (
          <div className="mt-5 pt-4 border-t border-slate-100 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold mb-2">
              <div className="flex items-center gap-2 text-slate-700">
                <span className="font-bold">Overall Setup Readiness:</span>
                <span className="font-extrabold text-blue-600">{healthStats.percentage}%</span>
                <span className="text-slate-400">({healthStats.totalConfigured}/{healthStats.totalMasters} Masters Configured)</span>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-200/70">
                  <span className="h-2 w-2 rounded-full bg-blue-500" /> Location: <strong className="text-slate-900">{healthStats.locConfigured}/{healthStats.locTotal}</strong>
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-200/70">
                  <span className="h-2 w-2 rounded-full bg-purple-500" /> Org: <strong className="text-slate-900">{healthStats.orgConfigured}/{healthStats.orgTotal}</strong>
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-200/70">
                  <span className="h-2 w-2 rounded-full bg-teal-500" /> Payroll: <strong className="text-slate-900">{healthStats.payConfigured}/{healthStats.payTotal}</strong>
                </span>
              </div>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 transition-all duration-500 shadow-xs"
                style={{ width: `${healthStats.percentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Content based on Active Step */}
      {activeStep === 1 && (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="text-blue-600" size={20} />
                Step 1: Tenant Account & SaaS Subscription Layer
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Data isolation boundary, tenant subdomain routing, licensing limits, and security policies.
              </p>
            </div>
            <Link
              to="/tenant-master"
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition w-fit"
            >
              <span>Manage All Tenants</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {activeTenant ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4">
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Active Tenant</div>
                  <div className="mt-1 text-base font-bold text-slate-900">{activeTenant.companyName || 'Primary Account'}</div>
                  <div className="mt-0.5 text-xs text-slate-500">Subdomain: <span className="font-mono text-blue-600 font-semibold">{activeTenant.subdomain || 'app'}</span></div>
                </div>

                <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4">
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Subscription & Tier</div>
                  <div className="mt-1 text-base font-bold text-emerald-700">{activeTenant.planName || 'Enterprise'} Plan</div>
                  <div className="mt-0.5 text-xs text-slate-500">{activeTenant.billingCycle || 'Yearly'} Billing · {activeTenant.storageQuotaGb || 50} GB Storage</div>
                </div>

                <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4">
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Data Isolation Model</div>
                  <div className="mt-1 text-base font-bold text-slate-900">
                    {activeTenant.isolationModel === 'SeparateDatabase' ? 'Separate DB per Tenant' : 'Shared DB with Tenant_ID'}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">Region: {activeTenant.dataRegion || 'ap-south-1 (Mumbai)'}</div>
                </div>

                <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4">
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Security & Auth Policy</div>
                  <div className="mt-1 text-base font-bold text-slate-900">{activeTenant.authPolicy || 'Email & Password'}</div>
                  <div className="mt-0.5 text-xs text-slate-500">MFA: {activeTenant.mfaEnforced ? 'Mandatory' : 'Standard Auth'}</div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">Tenant Routing URL:</span>{' '}
                  <span className="font-mono text-blue-600">https://{activeTenant.subdomain || 'app'}.yourdomain.com</span>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/tenant-master/view/${activeTenant.tenantId || activeTenant.companyId}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <ExternalLink size={14} /> View Tenant Profile
                  </Link>
                  <Link
                    to={`/tenant-master/edit/${activeTenant.tenantId || activeTenant.companyId}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Edit Tier & Policies
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <ShieldCheck size={40} className="mx-auto text-slate-300 mb-2" />
              <div className="font-semibold text-slate-700">No Tenant Account Loaded</div>
              <p className="text-xs text-slate-500 mt-1">Create or select a tenant account to configure subscription limits.</p>
              <Link to="/tenant-master/create" className="btn btn-primary btn-sm mt-3 inline-flex">Create Tenant</Link>
            </div>
          )}
        </div>
      )}

      {activeStep === 2 && (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="text-indigo-600" size={20} />
                Step 2: Company Legal Entity & Statutory Initialization
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Child of Tenant: registered entity details, PAN, GSTIN, PF/ESIC codes, payout bank accounts, and employment policies.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                to="/module/hrms/company-master/create"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <Plus size={14} /> New Subsidiary
              </Link>
              {companyId && (
                <Link
                  to={`/module/hrms/company-master/edit/${companyId}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
                >
                  Edit Legal Entity
                </Link>
              )}
            </div>
          </div>

          {selectedCompany ? (
            <div className="space-y-6">
              {/* Legal Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="rounded-xl border border-slate-200/90 bg-white p-4">
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Entity Registration</div>
                  <div className="mt-1 text-base font-bold text-slate-900">{selectedCompany.companyName}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Code: <span className="font-semibold text-slate-700">{selectedCompany.companyCode || '-'}</span> · {selectedCompany.companyType || 'Private Limited'}</div>
                  <div className="text-xs text-slate-500 mt-1">CIN: <span className="font-mono text-slate-700">{selectedCompany.cinNumber || '-'}</span></div>
                </div>

                <div className="rounded-xl border border-slate-200/90 bg-white p-4">
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Tax & Statutory (India)</div>
                  <div className="mt-1 text-xs text-slate-700 space-y-1">
                    <div><span className="text-slate-400">PAN:</span> <span className="font-mono font-semibold">{selectedCompany.panNumber || '-'}</span></div>
                    <div><span className="text-slate-400">GSTIN:</span> <span className="font-mono font-semibold">{selectedCompany.gstinNumber || '-'}</span></div>
                    <div><span className="text-slate-400">PF / ESIC:</span> <span className="font-mono">{selectedCompany.pfNumber || '-'} / {selectedCompany.esicNumber || '-'}</span></div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200/90 bg-white p-4">
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Payout Banking</div>
                  <div className="mt-1 text-xs text-slate-700 space-y-1">
                    <div><span className="text-slate-400">Bank:</span> <span className="font-semibold">{selectedCompany.bankName || '-'}</span></div>
                    <div><span className="text-slate-400">A/C:</span> <span className="font-mono">{selectedCompany.bankAccountNumber || '-'}</span></div>
                    <div><span className="text-slate-400">IFSC:</span> <span className="font-mono">{selectedCompany.ifscCode || '-'}</span></div>
                  </div>
                </div>
              </div>

              {/* Work Policies & Signatory */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200/90 bg-slate-50/60 p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                    <Calendar size={14} className="text-slate-500" /> Work & Attendance Policies
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div>Standard Daily Hours: <span className="font-semibold text-slate-900">{selectedCompany.standardDailyHours || 8} hrs</span></div>
                    <div>Weekly Off: <span className="font-semibold text-slate-900">{selectedCompany.weeklyOff || 'Sunday'}</span></div>
                    <div>Fiscal Year Cycle: <span className="font-semibold text-slate-900">{selectedCompany.fiscalYearStart || 'April - March'}</span></div>
                    <div>Base Currency: <span className="font-semibold text-slate-900">{selectedCompany.baseCurrency || 'INR (₹)'}</span></div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200/90 bg-slate-50/60 p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                    <Briefcase size={14} className="text-slate-500" /> Authorized Signatory & Compliance
                  </h4>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div>Signatory: <span className="font-semibold text-slate-900">{selectedCompany.authorizedSignatoryName || selectedCompany.contactPerson || '-'}</span></div>
                    <div>Designation: <span className="text-slate-700">{selectedCompany.authorizedSignatoryDesignation || selectedCompany.contactDesignation || 'Director'}</span></div>
                    <div>Official Contact: <span className="text-slate-700">{selectedCompany.contactEmail || selectedCompany.hrEmail || '-'}</span></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <Building2 size={40} className="mx-auto text-slate-300 mb-2" />
              <div className="font-semibold text-slate-700">No Company Selected</div>
              <p className="text-xs text-slate-500 mt-1">Please select or register a legal company entity.</p>
            </div>
          )}
        </div>
      )}

      {activeStep === 3 && (
        <div>
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
              Loading Location Hierarchy and Organization Masters...
            </div>
          ) : companyId ? (
            <CompanySetupPanel
              companyId={companyId}
              companyName={selectedCompany?.companyName || 'Active Company'}
              onStatsChange={setHealthStats}
            />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <Layers size={36} className="mx-auto text-slate-400 mb-3" />
              <h4 className="text-base font-semibold text-slate-900">No Company Selected</h4>
              <p className="mt-1 text-xs text-slate-500">
                Please select a company above to configure its 7-Level Location Hierarchy and Masters.
              </p>
            </div>
          )}
        </div>
      )}

      {activeStep === 4 && (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FolderKanban className="text-emerald-600" size={20} />
                Step 4: Project & Operational Resource Mapping
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Execution units under company: work allocation, billable hours, project budgets, and timesheet governance.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                to="/module/hrms/projects"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                All Projects
              </Link>
              <Link
                to="/module/hrms/projects/create"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
              >
                <Plus size={14} /> New Project
              </Link>
            </div>
          </div>

          {projects.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <div className="text-xs font-semibold uppercase text-slate-400">Total Projects</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">{projects.length}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{projects.filter(p => p.isActive).length} currently active</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <div className="text-xs font-semibold uppercase text-slate-400">Total Budget Allocated</div>
                  <div className="text-2xl font-bold text-emerald-700 mt-1">
                    INR {projects.reduce((acc, p) => acc + Number(p.budgetAllocated || 0), 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Across all tracked cost centers</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <div className="text-xs font-semibold uppercase text-slate-400">Timesheets & Governance</div>
                  <div className="text-2xl font-bold text-blue-700 mt-1">
                    {projects.filter(p => p.allowTimesheets).length} Projects
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Timesheet logging enabled</div>
                </div>
              </div>

              {/* Projects Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200/90">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Project Key & Name</th>
                      <th className="py-3 px-4">Client / Cost Center</th>
                      <th className="py-3 px-4">Billing Type</th>
                      <th className="py-3 px-4">Budget</th>
                      <th className="py-3 px-4">Project Manager</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {projects.map((proj) => (
                      <tr key={proj.projectId} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          <div>{proj.projectName}</div>
                          <span className="font-mono text-[11px] font-normal text-slate-500">{proj.projectCode}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{proj.clientName || 'Internal'}</td>
                        <td className="py-3 px-4">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                            {proj.billingType || 'Hourly'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {proj.currency || 'INR'} {Number(proj.budgetAllocated || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{proj.projectManagerName || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            proj.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {proj.status || (proj.isActive ? 'Active' : 'Inactive')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            to={`/module/hrms/projects/view/${proj.projectId}`}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                          >
                            View &rarr;
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
              <FolderKanban size={36} className="mx-auto text-slate-300 mb-2" />
              <div className="font-semibold text-slate-700">No Projects Found for this Company</div>
              <p className="text-xs text-slate-500 mt-1">Configure active projects to enable time tracking and cost center allocation.</p>
              <Link to="/module/hrms/projects/create" className="btn btn-primary btn-sm mt-3 inline-flex">
                <Plus size={14} /> Add First Project
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Step 5: No-Code Policy & Business Rule Engine */}
      {activeStep === 5 && (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="text-purple-600" size={20} />
                Step 5: No-Code Policy & Business Rule Engine
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Configure attendance geofencing radius, leave accruals, probation thresholds, and statutory wage caps.
              </p>
            </div>
            {policySaved && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800 animate-in fade-in">
                <CheckCircle2 size={13} className="text-emerald-600" /> Policy Configuration Saved!
              </span>
            )}
          </div>

          <form onSubmit={handleSavePolicies} className="space-y-6">
            {/* Section 1: Attendance & Geofence Rules */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">
                <Clock size={15} className="text-purple-600" />
                <span>Attendance & Geofencing Parameters</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Allowed Geofence Radius (Meters)
                  </label>
                  <input
                    type="number"
                    value={policies.geofenceRadiusMeters}
                    onChange={(e) => setPolicies({ ...policies, geofenceRadiusMeters: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Mobile check-in allowed within this perimeter</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Late Mark Grace Period (Minutes)
                  </label>
                  <input
                    type="number"
                    value={policies.lateMarkGraceMinutes}
                    onChange={(e) => setPolicies({ ...policies, lateMarkGraceMinutes: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Ex: Shift start 09:30 AM &rarr; Late after 09:45 AM</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Auto Half-Day Late Mark Threshold
                  </label>
                  <input
                    type="number"
                    value={policies.autoHalfDayLateCount}
                    onChange={(e) => setPolicies({ ...policies, autoHalfDayLateCount: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Every N late marks convert to 0.5 Day LOP</span>
                </div>
              </div>
            </div>

            {/* Section 2: Leave Entitlements & Carry Forward */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">
                <Calendar size={15} className="text-emerald-600" />
                <span>Annual Leave Accruals & Carry Forward</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Casual Leave (CL)</label>
                  <input
                    type="number"
                    value={policies.annualCLDays}
                    onChange={(e) => setPolicies({ ...policies, annualCLDays: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Days credited per financial year</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sick Leave (SL)</label>
                  <input
                    type="number"
                    value={policies.annualSLDays}
                    onChange={(e) => setPolicies({ ...policies, annualSLDays: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Days credited per financial year</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Earned Leave (EL)</label>
                  <input
                    type="number"
                    value={policies.annualELDays}
                    onChange={(e) => setPolicies({ ...policies, annualELDays: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Prorated privilege leave</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max EL Carry-Forward</label>
                  <input
                    type="number"
                    value={policies.maxELCarryForward}
                    onChange={(e) => setPolicies({ ...policies, maxELCarryForward: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Maximum days encashable/carried</span>
                </div>
              </div>
            </div>

            {/* Section 3: Statutory Caps & Lifecycle Controls */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">
                <ShieldCheck size={15} className="text-blue-600" />
                <span>Statutory Thresholds & Lifecycle Durations</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Standard Probation</label>
                  <input
                    type="number"
                    value={policies.probationDurationDays}
                    onChange={(e) => setPolicies({ ...policies, probationDurationDays: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Days before confirmation review</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Period</label>
                  <input
                    type="number"
                    value={policies.noticePeriodDays}
                    onChange={(e) => setPolicies({ ...policies, noticePeriodDays: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Standard separation notice days</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">EPF Statutory Cap (₹)</label>
                  <input
                    type="number"
                    value={policies.epfWageCeiling}
                    onChange={(e) => setPolicies({ ...policies, epfWageCeiling: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Maximum wage ceiling for PF 12%</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ESIC Gross Cap (₹)</label>
                  <input
                    type="number"
                    value={policies.esicGrossCeiling}
                    onChange={(e) => setPolicies({ ...policies, esicGrossCeiling: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Gross wage limit for ESI coverage</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-purple-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-purple-800 transition cursor-pointer"
              >
                <Save size={14} />
                <span>Save Company Business Policies</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
