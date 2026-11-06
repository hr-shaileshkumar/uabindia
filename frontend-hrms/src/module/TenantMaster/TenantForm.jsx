import React, { useEffect, useMemo, useState } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { brandingLogoUrl } from '../../api/branding'

const emptyTenant = {
  companyName: '',
  subdomain: '',
  contactPerson: '',
  contactEmail: '',
  contactPhone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  country: 'India',
  postalCode: '',
  taxId: '',
  logoUrl: '',
  planName: 'Standard',
  billingCycle: 'Yearly',
  maxUsers: 50,
  maxProjects: 10,
  storageQuotaGb: 50,
  isolationModel: 'SharedDatabase',
  authPolicy: 'EmailPassword',
  mfaEnforced: false,
  storageProvider: 'Local',
  dataRegion: 'ap-south-1',
  timeZone: 'Asia/Kolkata',
  defaultCurrency: 'INR',
  fiscalYearStartMonth: 4,
  notes: '',
  isActive: true,
  createAdminUser: true,
  adminUserName: '',
  adminFullName: '',
  adminMobileNumber: '',
  adminPassword: '',
}

export function toTenantForm(value = {}) {
  return {
    ...emptyTenant,
    companyName: value.companyName || value.CompanyName || '',
    subdomain: value.subdomain || value.Subdomain || '',
    contactPerson: value.contactPerson || value.ContactPerson || '',
    contactEmail: value.contactEmail || value.ContactEmail || '',
    contactPhone: value.contactPhone || value.ContactPhone || '',
    addressLine1: value.addressLine1 || value.AddressLine1 || '',
    addressLine2: value.addressLine2 || value.AddressLine2 || '',
    city: value.city || value.City || '',
    state: value.state || value.State || '',
    country: value.country || value.Country || 'India',
    postalCode: value.postalCode || value.PostalCode || '',
    taxId: value.taxId || value.TaxId || '',
    logoUrl: value.logoUrl || value.LogoUrl || '',
    planName: value.planName || value.PlanName || 'Standard',
    billingCycle: value.billingCycle || value.BillingCycle || 'Yearly',
    maxUsers: Number(value.maxUsers || value.MaxUsers || 50),
    maxProjects: Number(value.maxProjects || value.MaxProjects || 10),
    storageQuotaGb: Number(value.storageQuotaGb || value.StorageQuotaGb || 50),
    isolationModel: value.isolationModel || value.IsolationModel || 'SharedDatabase',
    authPolicy: value.authPolicy || value.AuthPolicy || 'EmailPassword',
    mfaEnforced: typeof value.mfaEnforced === 'boolean' ? value.mfaEnforced : !!value.MfaEnforced,
    storageProvider: value.storageProvider || value.StorageProvider || 'Local',
    dataRegion: value.dataRegion || value.DataRegion || 'ap-south-1',
    timeZone: value.timeZone || value.TimeZone || 'Asia/Kolkata',
    defaultCurrency: value.defaultCurrency || value.DefaultCurrency || 'INR',
    fiscalYearStartMonth: Number(value.fiscalYearStartMonth || value.FiscalYearStartMonth || 4),
    notes: value.notes || value.Notes || '',
    isActive: typeof value.isActive === 'boolean' ? value.isActive : value.IsActive ?? true,
    createAdminUser: false,
    adminUserName: '',
    adminFullName: '',
    adminMobileNumber: '',
    adminPassword: '',
  }
}

export function buildTenantPayload(form, includeAdmin) {
  const payload = {
    companyName: form.companyName.trim(),
    subdomain: form.subdomain.trim().toLowerCase(),
    contactPerson: form.contactPerson.trim(),
    contactEmail: form.contactEmail.trim(),
    contactPhone: form.contactPhone.trim(),
    addressLine1: form.addressLine1.trim(),
    addressLine2: form.addressLine2.trim(),
    city: form.city.trim(),
    state: form.state.trim(),
    country: form.country.trim() || 'India',
    postalCode: form.postalCode.trim(),
    taxId: form.taxId.trim(),
    logoUrl: form.logoUrl?.trim?.() || '',
    planName: form.planName.trim() || 'Standard',
    billingCycle: form.billingCycle || 'Yearly',
    maxUsers: Number(form.maxUsers) || 1,
    maxProjects: Number(form.maxProjects) || 1,
    storageQuotaGb: Number(form.storageQuotaGb) || 50,
    isolationModel: form.isolationModel || 'SharedDatabase',
    authPolicy: form.authPolicy || 'EmailPassword',
    mfaEnforced: !!form.mfaEnforced,
    storageProvider: form.storageProvider || 'Local',
    dataRegion: form.dataRegion || 'ap-south-1',
    timeZone: form.timeZone || 'Asia/Kolkata',
    defaultCurrency: form.defaultCurrency || 'INR',
    fiscalYearStartMonth: Number(form.fiscalYearStartMonth) || 4,
    notes: form.notes.trim(),
    isActive: !!form.isActive,
  }

  if (includeAdmin) {
    payload.createAdminUser = !!form.createAdminUser
    payload.adminUserName = form.adminUserName.trim()
    payload.adminFullName = form.adminFullName.trim()
    payload.adminMobileNumber = form.adminMobileNumber.trim()
    payload.adminPassword = form.adminPassword
  }

  return payload
}

function validate(form, includeAdmin) {
  if (!form.companyName.trim()) return 'Tenant name is required'
  if (!form.subdomain.trim()) return 'Subdomain is required'
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(form.subdomain.trim())) return 'Subdomain can use letters, numbers, and hyphens only'
  if (form.contactEmail.trim() && !form.contactEmail.includes('@')) return 'Contact email is invalid'
  if (Number(form.maxUsers) < 1) return 'Max users must be at least 1'
  if (Number(form.maxProjects) < 1) return 'Max projects must be at least 1'

  if (includeAdmin && form.createAdminUser) {
    if (!form.adminUserName.trim()) return 'Admin username is required'
    if (!form.adminFullName.trim()) return 'Admin full name is required'
    if (!/^\d{10}$/.test(form.adminMobileNumber.trim())) return 'Admin mobile must be 10 digits'
    if (!form.adminPassword || form.adminPassword.length < 8) return 'Admin password must be at least 8 characters'
  }

  return null
}

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  )
}

function Section({ title, children }) {
  return (
    <section className="border-t border-slate-200 py-5 first:border-t-0 first:pt-0">
      <h3 className="mb-4 text-base font-semibold text-slate-900">{title}</h3>
      {children}
    </section>
  )
}

export default function TenantForm({ initialValue, mode = 'create', saving = false, baseDomain = 'your-domain.com', onSubmit, onCancel }) {
  const [form, setForm] = useState(() => toTenantForm(initialValue))
  const [error, setError] = useState('')
  const [logoFile, setLogoFile] = useState(null)
  const includeAdmin = mode === 'create'

  const previewHost = useMemo(() => {
    const sub = form.subdomain.trim().toLowerCase() || 'tenant'
    const domain = String(baseDomain || 'your-domain.com').trim().toLowerCase()
    return `${sub}.${domain || 'your-domain.com'}`
  }, [form.subdomain, baseDomain])

  const previewLogoUrl = useMemo(() => {
    if (!logoFile) return brandingLogoUrl(form)
    return URL.createObjectURL(logoFile)
  }, [form, logoFile])

  useEffect(() => {
    if (!logoFile) return undefined
    return () => URL.revokeObjectURL(previewLogoUrl)
  }, [logoFile, previewLogoUrl])

  const set = (key, value) => setForm(current => ({ ...current, [key]: value }))

  const submit = (event) => {
    event.preventDefault()
    const message = validate(form, includeAdmin)
    if (message) {
      setError(message)
      return
    }
    setError('')
    onSubmit(buildTenantPayload(form, includeAdmin), { logoFile })
  }

  return (
    <form onSubmit={submit} className="bg-white border border-slate-200 rounded-lg p-5">
      {error && (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <Section title="Tenant Profile">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Tenant name">
            <input className="input w-full" value={form.companyName} onChange={e => set('companyName', e.target.value)} />
          </Field>
          <Field label="Subdomain" hint={`Preview: ${previewHost}`}>
            <input className="input w-full" value={form.subdomain} onChange={e => set('subdomain', e.target.value.toLowerCase())} />
          </Field>
          <Field label="Plan">
            <select className="input w-full" value={form.planName} onChange={e => set('planName', e.target.value)}>
              <option>Standard</option>
              <option>Professional</option>
              <option>Enterprise</option>
              <option>Trial</option>
            </select>
          </Field>
          <Field label="Status">
            <select className="input w-full" value={form.isActive ? 'active' : 'inactive'} onChange={e => set('isActive', e.target.value === 'active')}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
        </div>
      </Section>

      <Section title="Branding">
        <div className="grid gap-4 lg:grid-cols-[160px,1fr]">
          <div className="flex h-28 w-40 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-3">
            <img src={previewLogoUrl} alt="Tenant logo" className="max-h-full max-w-full object-contain" />
          </div>
          <div className="space-y-4">
            <Field label="Logo URL">
              <input className="input w-full" value={form.logoUrl} onChange={e => set('logoUrl', e.target.value)} placeholder="https://example.com/logo.png" />
            </Field>
            <div className="flex flex-wrap gap-2">
              <label className="btn btn-outline gap-2 cursor-pointer">
                <ImagePlus size={16} />
                Upload Logo
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                  className="hidden"
                  onChange={event => {
                    const file = event.target.files?.[0] || null
                    setLogoFile(file)
                  }}
                />
              </label>
              {(logoFile || form.logoUrl) && (
                <button
                  type="button"
                  className="btn btn-danger gap-2"
                  onClick={() => {
                    setLogoFile(null)
                    set('logoUrl', '')
                  }}
                >
                  <Trash2 size={16} />
                  Clear Logo
                </button>
              )}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Contact Information">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Contact person">
            <input className="input w-full" value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)} />
          </Field>
          <Field label="Email">
            <input className="input w-full" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} />
          </Field>
          <Field label="Phone">
            <input className="input w-full" value={form.contactPhone} onChange={e => set('contactPhone', e.target.value.replace(/\D/g, '').slice(0, 10))} maxLength={10} inputMode="numeric" placeholder="10-digit phone" />
          </Field>
        </div>
      </Section>

      <Section title="Address">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Address line 1">
            <input className="input w-full" value={form.addressLine1} onChange={e => set('addressLine1', e.target.value)} />
          </Field>
          <Field label="Address line 2">
            <input className="input w-full" value={form.addressLine2} onChange={e => set('addressLine2', e.target.value)} />
          </Field>
          <Field label="City">
            <input className="input w-full" value={form.city} onChange={e => set('city', e.target.value)} />
          </Field>
          <Field label="State">
            <input className="input w-full" value={form.state} onChange={e => set('state', e.target.value)} />
          </Field>
          <Field label="Country">
            <input className="input w-full" value={form.country} onChange={e => set('country', e.target.value)} />
          </Field>
          <Field label="Postal code">
            <input className="input w-full" value={form.postalCode} onChange={e => set('postalCode', e.target.value)} />
          </Field>
          <Field label="Tax / GST / CIN">
            <input className="input w-full" value={form.taxId} onChange={e => set('taxId', e.target.value)} />
          </Field>
        </div>
      </Section>

      <Section title="Subscription & Licensing">
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Billing cycle">
            <select className="input w-full" value={form.billingCycle} onChange={e => set('billingCycle', e.target.value)}>
              <option value="Monthly">Monthly</option>
              <option value="Yearly">Yearly</option>
              <option value="Quarterly">Quarterly</option>
            </select>
          </Field>
          <Field label="Max users (seat limit)">
            <input className="input w-full" type="number" min="1" value={form.maxUsers} onChange={e => set('maxUsers', e.target.value)} />
          </Field>
          <Field label="Max projects">
            <input className="input w-full" type="number" min="1" value={form.maxProjects} onChange={e => set('maxProjects', e.target.value)} />
          </Field>
          <Field label="Storage quota (GB)">
            <input className="input w-full" type="number" min="5" value={form.storageQuotaGb} onChange={e => set('storageQuotaGb', e.target.value)} />
          </Field>
        </div>
      </Section>

      <Section title="Data Isolation & Security Policy">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Tenant isolation model" hint="Logical vs dedicated data boundary">
            <select className="input w-full" value={form.isolationModel} onChange={e => set('isolationModel', e.target.value)}>
              <option value="SharedDatabase">Shared DB with Tenant_ID</option>
              <option value="SeparateDatabase">Separate DB per Tenant</option>
            </select>
          </Field>
          <Field label="Authentication policy">
            <select className="input w-full" value={form.authPolicy} onChange={e => set('authPolicy', e.target.value)}>
              <option value="EmailPassword">Email & Password</option>
              <option value="GoogleWorkspaceSSO">Google Workspace SSO</option>
              <option value="MicrosoftEntraSSO">Microsoft Entra ID (Azure AD)</option>
            </select>
          </Field>
          <div className="flex flex-col justify-center">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer pt-4">
              <input type="checkbox" checked={form.mfaEnforced} onChange={e => set('mfaEnforced', e.target.checked)} className="rounded" />
              <span>Enforce Two-Factor Authentication (MFA)</span>
            </label>
            <span className="text-xs text-slate-500 mt-1">Requires all tenant users to verify OTP on login</span>
          </div>
        </div>
      </Section>

      <Section title="Storage & Global Regional Defaults">
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Storage provider">
            <select className="input w-full" value={form.storageProvider} onChange={e => set('storageProvider', e.target.value)}>
              <option value="Local">Local Server File Storage</option>
              <option value="AWS_S3">Amazon Web Services S3</option>
              <option value="AzureBlob">Azure Blob Storage</option>
            </select>
          </Field>
          <Field label="Data residency region">
            <input className="input w-full" value={form.dataRegion} onChange={e => set('dataRegion', e.target.value)} placeholder="ap-south-1" />
          </Field>
          <Field label="Master time zone">
            <select className="input w-full" value={form.timeZone} onChange={e => set('timeZone', e.target.value)}>
              <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
              <option value="UTC">UTC (GMT +0:00)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (BST)</option>
            </select>
          </Field>
          <Field label="Default currency">
            <select className="input w-full" value={form.defaultCurrency} onChange={e => set('defaultCurrency', e.target.value)}>
              <option value="INR">INR (₹) Indian Rupee</option>
              <option value="USD">USD ($) US Dollar</option>
              <option value="EUR">EUR (€) Euro</option>
              <option value="AED">AED (د.إ) UAE Dirham</option>
            </select>
          </Field>
        </div>
      </Section>

      {includeAdmin && (
        <Section title="Tenant Admin">
          <label className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={form.createAdminUser} onChange={e => set('createAdminUser', e.target.checked)} />
            Create admin login for this tenant
          </label>
          {form.createAdminUser && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Admin username">
                <input className="input w-full" value={form.adminUserName} onChange={e => set('adminUserName', e.target.value)} />
              </Field>
              <Field label="Admin full name">
                <input className="input w-full" value={form.adminFullName} onChange={e => set('adminFullName', e.target.value)} />
              </Field>
              <Field label="Admin mobile">
                <input className="input w-full" value={form.adminMobileNumber} onChange={e => set('adminMobileNumber', e.target.value.replace(/\D/g, '').slice(0, 10))} maxLength={10} inputMode="numeric" placeholder="10-digit mobile" />
              </Field>
              <Field label="Temporary password">
                <input className="input w-full" type="password" value={form.adminPassword} onChange={e => set('adminPassword', e.target.value)} />
              </Field>
            </div>
          )}
        </Section>
      )}

      <Section title="Notes">
        <textarea className="input min-h-24 w-full" value={form.notes} onChange={e => set('notes', e.target.value)} />
      </Section>

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={saving}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Tenant'}</button>
      </div>
    </form>
  )
}
