import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Building2, Globe2, LifeBuoy, Save, SlidersHorizontal } from 'lucide-react'
import { getPlatformSettings, normalizePlatformSettings, tenantHost, updatePlatformSettings } from '../../api/platformSettings'
import { useToast } from '../../components/ToastProvider'
import PageHeader from '../../components/PageHeader'

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  )
}

function Section({ icon: Icon, title, children }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
          <Icon size={17} />
        </div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      </div>
      {children}
    </section>
  )
}

export default function PlatformSettings() {
  const [form, setForm] = useState(() => normalizePlatformSettings())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const settings = await getPlatformSettings()
        if (!cancelled) setForm(settings)
      } catch (err) {
        console.error(err)
        toast('Failed to load provider setup', 'error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const previewHost = useMemo(() => tenantHost('client', form), [form.baseDomain])
  const set = (key, value) => setForm(current => ({ ...current, [key]: value }))

  function validate() {
    if (!form.providerName.trim()) return 'Provider name is required'
    if (!form.baseDomain.trim()) return 'Base domain is required'
    if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(form.baseDomain.trim().replace(/^https?:\/\//i, '').split('/')[0].split(':')[0].replace(/\.+$/, ''))) return 'Base domain is invalid'
    if (form.supportEmail.trim() && !form.supportEmail.includes('@')) return 'Support email is invalid'
    if (Number(form.defaultMaxUsers) < 1) return 'Default max users must be at least 1'
    if (Number(form.defaultMaxProjects) < 1) return 'Default max projects must be at least 1'
    return null
  }

  async function submit(event) {
    event.preventDefault()
    const message = validate()
    if (message) {
      setError(message)
      return
    }

    setError('')
    setSaving(true)
    try {
      const saved = await updatePlatformSettings({
        ...form,
        defaultMaxUsers: Number(form.defaultMaxUsers),
        defaultMaxProjects: Number(form.defaultMaxProjects),
      })
      setForm(saved)
    } catch (err) {
      console.error(err)
      toast(err?.response?.data?.message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-4 text-sm text-slate-500">Loading provider setup...</div>

  return (
    <div className="space-y-4 antialiased pb-8">
      <PageHeader
        icon={Globe2}
        title="Provider Setup"
        badge="Platform Config"
        badgeTone="purple"
        actions={
          <Link to="/tenant-master" className="btn btn-outline text-xs py-1 px-2.5 gap-1.5">
            <ArrowLeft size={14} /> Tenants
          </Link>
        }
      />

      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <Section icon={Building2} title="Own Information">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Provider name">
              <input className="input w-full" value={form.providerName} onChange={e => set('providerName', e.target.value)} />
            </Field>
            <Field label="Brand name">
              <input className="input w-full" value={form.brandName} onChange={e => set('brandName', e.target.value)} />
            </Field>
            <Field label="Website URL">
              <input className="input w-full" value={form.websiteUrl} onChange={e => set('websiteUrl', e.target.value)} />
            </Field>
            <Field label="Tax or GST ID">
              <input className="input w-full" value={form.taxId} onChange={e => set('taxId', e.target.value)} />
            </Field>
            <Field label="Logo URL">
              <input className="input w-full" value={form.logoUrl} onChange={e => set('logoUrl', e.target.value)} />
            </Field>
            <Field label="Admin portal URL">
              <input className="input w-full" value={form.adminPortalUrl} onChange={e => set('adminPortalUrl', e.target.value)} />
            </Field>
          </div>
        </Section>

        <Section icon={Globe2} title="Domain">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Base domain" hint={`Tenant example: ${previewHost}`}>
              <input className="input w-full" value={form.baseDomain} onChange={e => set('baseDomain', e.target.value.toLowerCase())} />
            </Field>
            <Field label="Wildcard DNS target">
              <input className="input w-full" value={`*.${form.baseDomain || 'your-domain.com'}`} readOnly />
            </Field>
          </div>
        </Section>

        <Section icon={LifeBuoy} title="Support And Address">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Support email">
              <input className="input w-full" value={form.supportEmail} onChange={e => set('supportEmail', e.target.value)} />
            </Field>
            <Field label="Support phone">
              <input className="input w-full" value={form.supportPhone} onChange={e => set('supportPhone', e.target.value)} />
            </Field>
            <Field label="Country">
              <input className="input w-full" value={form.country} onChange={e => set('country', e.target.value)} />
            </Field>
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
            <Field label="Postal code">
              <input className="input w-full" value={form.postalCode} onChange={e => set('postalCode', e.target.value)} />
            </Field>
          </div>
        </Section>

        <Section icon={SlidersHorizontal} title="Tenant Defaults">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Default plan">
              <select className="input w-full" value={form.defaultPlanName} onChange={e => set('defaultPlanName', e.target.value)}>
                <option>Standard</option>
                <option>Professional</option>
                <option>Enterprise</option>
                <option>Trial</option>
              </select>
            </Field>
            <Field label="Default max users">
              <input className="input w-full" type="number" min="1" value={form.defaultMaxUsers} onChange={e => set('defaultMaxUsers', e.target.value)} />
            </Field>
            <Field label="Default max projects">
              <input className="input w-full" type="number" min="1" value={form.defaultMaxProjects} onChange={e => set('defaultMaxProjects', e.target.value)} />
            </Field>
          </div>
          <textarea className="input mt-4 min-h-24 w-full" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Internal notes" />
        </Section>

        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary gap-2" disabled={saving}>
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Setup'}
          </button>
        </div>
      </form>
    </div>
  )
}
