import React, { useRef, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Building2, Edit, FolderKanban, Power, Trash2, Upload, Users, BriefcaseBusiness } from 'lucide-react'
import { deleteTenant, getTenant, removeTenantLogo, updateTenantStatus, uploadTenantLogo } from '../../api/tenants'
import { brandingLogoUrl } from '../../api/branding'
import { getPlatformSettings, tenantHost } from '../../api/platformSettings'
import { useConfirm } from '../../components/ConfirmProvider'
import { useToast } from '../../components/ToastProvider'

function get(item, key, fallback = '') {
  return item?.[key] ?? item?.[key.charAt(0).toUpperCase() + key.slice(1)] ?? fallback
}

function Stat({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
          <Icon size={18} />
        </div>
        <div>
          <div className="text-xs font-semibold uppercase text-slate-500">{label}</div>
          <div className="text-xl font-semibold text-slate-900">{value}</div>
          {hint && <div className="text-xs text-slate-500">{hint}</div>}
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <h3 className="mb-4 text-base font-semibold text-slate-900">{title}</h3>
      {children}
    </section>
  )
}

function Row({ label, value }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase text-slate-500">{label}</div>
      <div className="mt-1 break-words text-sm text-slate-900">{value || 'Not set'}</div>
    </div>
  )
}

export default function TenantView() {
  const { id } = useParams()
  const [tenant, setTenant] = useState(null)
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [logoSaving, setLogoSaving] = useState(false)
  const fileRef = useRef(null)
  const toast = useToast()
  const confirm = useConfirm()

  async function load() {
    setLoading(true)
    try {
      const [tenantData, providerSettings] = await Promise.all([getTenant(id), getPlatformSettings()])
      setTenant(tenantData)
      setSettings(providerSettings)
    } catch (error) {
      console.error(error)
      toast('Failed to load tenant', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  async function toggleStatus() {
    const active = !!get(tenant, 'isActive', false)
    const ok = await confirm({
      message: `${active ? 'Deactivate' : 'Activate'} this tenant?`,
      confirmLabel: active ? 'Deactivate' : 'Activate',
      tone: active ? 'danger' : 'primary',
    })
    if (!ok) return

    try {
      await updateTenantStatus(id, !active)
      load()
    } catch (error) {
      console.error(error)
      toast('Status update failed', 'error')
    }
  }

  async function uploadLogo(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setLogoSaving(true)
    try {
      const response = await uploadTenantLogo(id, file)
      const logoUrl = response?.logoUrl || response?.LogoUrl || ''
      setTenant(current => ({ ...current, logoUrl }))
      window.dispatchEvent(new CustomEvent('app:branding-updated'))
    } catch (error) {
      console.error(error)
      toast(error?.response?.data?.message || 'Logo upload failed', 'error')
    } finally {
      setLogoSaving(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function removeLogo() {
    const ok = await confirm({
      message: 'Remove tenant logo?',
      confirmLabel: 'Remove',
      tone: 'danger',
    })
    if (!ok) return

    setLogoSaving(true)
    try {
      await removeTenantLogo(id)
      setTenant(current => ({ ...current, logoUrl: '' }))
      window.dispatchEvent(new CustomEvent('app:branding-updated'))
    } catch (error) {
      console.error(error)
      toast(error?.response?.data?.message || 'Logo remove failed', 'error')
    } finally {
      setLogoSaving(false)
    }
  }

  async function removeTenant() {
    const ok = await confirm({
      message: 'Delete tenant permanently? This works only after deactivation and only when no users, projects, or companies are linked.',
      confirmLabel: 'Delete',
      tone: 'danger',
    })
    if (!ok) return

    try {
      await deleteTenant(id)
      window.location.href = '/tenant-master'
    } catch (error) {
      console.error(error)
      toast(error?.response?.data?.message || 'Delete failed', 'error')
    }
  }

  if (loading) return <div className="p-4 text-sm text-slate-500">Loading tenant...</div>
  if (!tenant) return <div className="p-4 text-sm text-slate-500">Tenant not found.</div>

  const isActive = !!get(tenant, 'isActive', false)
  const users = get(tenant, 'adminUsers', [])
  const companies = get(tenant, 'companies', [])
  const projects = get(tenant, 'projects', [])

  return (
    <div className="space-y-4 antialiased pb-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base md:text-lg font-bold text-slate-900 tracking-tight">{get(tenant, 'companyName')}</h1>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-0.5">{tenantHost(get(tenant, 'subdomain'), settings)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Link to="/tenant-master" className="btn btn-outline text-xs py-1 px-2.5 gap-1.5">
            <ArrowLeft size={14} /> Back
          </Link>
          <Link to={`/tenant-master/edit/${id}`} className="btn btn-outline text-xs py-1 px-2.5 gap-1.5">
            <Edit size={13} /> Edit
          </Link>
          <button className={`${isActive ? 'btn btn-danger' : 'btn btn-primary'} text-xs py-1 px-2.5 gap-1.5`} onClick={toggleStatus}>
            <Power size={13} />
            {isActive ? 'Deactivate' : 'Activate'}
          </button>
          {!isActive && (
            <button className="btn btn-danger gap-2" onClick={removeTenant}>
              <Trash2 size={16} />
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Users} label="Users" value={`${get(tenant, 'userCount', 0)} / ${get(tenant, 'maxUsers', 0)}`} hint="Assigned logins" />
        <Stat icon={FolderKanban} label="Projects" value={`${get(tenant, 'projectCount', 0)} / ${get(tenant, 'maxProjects', 0)}`} hint="Configured projects" />
        <Stat icon={BriefcaseBusiness} label="Companies" value={get(tenant, 'companyCount', 0)} hint="Mapped companies" />
        <Stat icon={Building2} label="Plan" value={get(tenant, 'planName') || 'Standard'} hint="Subscription tier" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Branding">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-20 w-32 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-3">
              <img src={brandingLogoUrl(tenant)} alt="Tenant logo" className="max-h-full max-w-full object-contain" />
            </div>
            <div className="flex flex-wrap gap-2">
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" className="hidden" onChange={uploadLogo} />
              <button type="button" className="btn btn-outline gap-2" disabled={logoSaving} onClick={() => fileRef.current?.click()}>
                <Upload size={16} />
                Upload Logo
              </button>
              {get(tenant, 'logoUrl') && (
                <button type="button" className="btn btn-danger gap-2" disabled={logoSaving} onClick={removeLogo}>
                  <Trash2 size={16} />
                  Remove
                </button>
              )}
            </div>
          </div>
        </Section>

        <Section title="Profile">
          <div className="grid gap-4 sm:grid-cols-2">
            <Row label="Tenant ID" value={get(tenant, 'tenantId')} />
            <Row label="Subdomain" value={get(tenant, 'subdomain')} />
            <Row label="Tax / GST / CIN" value={get(tenant, 'taxId')} />
            <Row label="Created" value={get(tenant, 'createdAt') ? new Date(get(tenant, 'createdAt')).toLocaleString() : ''} />
            <Row label="Updated" value={get(tenant, 'updatedAt') ? new Date(get(tenant, 'updatedAt')).toLocaleString() : ''} />
          </div>
        </Section>

        <Section title="Contact">
          <div className="grid gap-4 sm:grid-cols-2">
            <Row label="Contact person" value={get(tenant, 'contactPerson')} />
            <Row label="Email" value={get(tenant, 'contactEmail')} />
            <Row label="Phone" value={get(tenant, 'contactPhone')} />
            <Row label="Location" value={[get(tenant, 'city'), get(tenant, 'state')].filter(Boolean).join(', ')} />
          </div>
        </Section>

        <Section title="Address">
          <div className="grid gap-4 sm:grid-cols-2">
            <Row label="Address line 1" value={get(tenant, 'addressLine1')} />
            <Row label="Address line 2" value={get(tenant, 'addressLine2')} />
            <Row label="Country" value={get(tenant, 'country')} />
            <Row label="Postal code" value={get(tenant, 'postalCode')} />
          </div>
        </Section>

        <Section title="Subscription & Licensing">
          <div className="grid gap-4 sm:grid-cols-2">
            <Row label="Plan Tier" value={get(tenant, 'planName') || 'Standard'} />
            <Row label="Billing Cycle" value={get(tenant, 'billingCycle') || 'Yearly'} />
            <Row label="User Seat Limit" value={`${get(tenant, 'userCount', 0)} / ${get(tenant, 'maxUsers', 50)} Users`} />
            <Row label="Storage Quota" value={`${get(tenant, 'storageQuotaGb', 50)} GB Cloud / Local`} />
          </div>
        </Section>

        <Section title="Data Isolation & Security">
          <div className="grid gap-4 sm:grid-cols-2">
            <Row label="Isolation Model" value={get(tenant, 'isolationModel') === 'SeparateDatabase' ? 'Separate DB per Tenant' : 'Shared DB with Tenant_ID'} />
            <Row label="Authentication Policy" value={get(tenant, 'authPolicy') || 'Email & Password'} />
            <Row label="MFA Enforcement" value={get(tenant, 'mfaEnforced') ? 'Enabled (Mandatory OTP)' : 'Optional / Disabled'} />
            <Row label="Data Residency" value={get(tenant, 'dataRegion') || 'ap-south-1'} />
          </div>
        </Section>

        <Section title="Regional & Global Defaults">
          <div className="grid gap-4 sm:grid-cols-2">
            <Row label="Master Time Zone" value={get(tenant, 'timeZone') || 'Asia/Kolkata (IST)'} />
            <Row label="Default Currency" value={get(tenant, 'defaultCurrency') || 'INR (₹)'} />
            <Row label="Fiscal Year Start Month" value={`Month ${get(tenant, 'fiscalYearStartMonth', 4)} (April)`} />
            <Row label="Storage Provider" value={get(tenant, 'storageProvider') || 'Local'} />
          </div>
        </Section>

        <Section title="Notes">
          <p className="min-h-16 text-sm leading-6 text-slate-700">{get(tenant, 'notes') || 'No notes recorded.'}</p>
        </Section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Section title="Users">
          {users.length === 0 && <div className="text-sm text-slate-500">No users assigned.</div>}
          <div className="space-y-3">
            {users.map(user => (
              <div key={get(user, 'userId')} className="rounded-md border border-slate-100 p-3">
                <div className="font-semibold text-slate-900">{get(user, 'fullName')}</div>
                <div className="text-xs text-slate-500">{get(user, 'userName')} · {get(user, 'role')} · {get(user, 'mobileNumber')}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Companies">
          {companies.length === 0 && <div className="text-sm text-slate-500">No companies mapped.</div>}
          <div className="space-y-3">
            {companies.map(company => (
              <div key={get(company, 'companyId')} className="rounded-md border border-slate-100 p-3">
                <div className="font-semibold text-slate-900">{get(company, 'companyName')}</div>
                <div className="text-xs text-slate-500">{get(company, 'companyCode') || 'No code'} - {get(company, 'taxId') || 'Tax not set'} - {get(company, 'isActive') ? 'Active' : 'Inactive'}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Projects">
          {projects.length === 0 && <div className="text-sm text-slate-500">No projects configured.</div>}
          <div className="space-y-3">
            {projects.map(project => (
              <div key={get(project, 'projectId')} className="rounded-md border border-slate-100 p-3">
                <div className="font-semibold text-slate-900">{get(project, 'projectName')}</div>
                <div className="text-xs text-slate-500">{get(project, 'projectCode') || 'No code'} - {get(project, 'companyName') || 'Company not linked'} - {get(project, 'isActive') ? 'Active' : 'Inactive'}</div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}
