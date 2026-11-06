import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { getTenant, updateTenant, uploadTenantLogo } from '../../api/tenants'
import { getPlatformSettings } from '../../api/platformSettings'
import { useToast } from '../../components/ToastProvider'
import PageHeader from '../../components/PageHeader'
import PageCustomizationMenu from '../../components/PageCustomizationMenu'
import TenantForm from './TenantForm'

export default function TenantEdit() {
  const { id } = useParams()
  const [tenant, setTenant] = useState(null)
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const toast = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const [data, providerSettings] = await Promise.all([getTenant(id), getPlatformSettings()])
        if (!cancelled) setTenant(data)
        if (!cancelled) setSettings(providerSettings)
      } catch (error) {
        console.error(error)
        toast('Failed to load tenant', 'error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  async function submit(payload, options = {}) {
    setSaving(true)
    try {
      await updateTenant(id, payload)
      if (options.logoFile) {
        await uploadTenantLogo(id, options.logoFile)
      }
      navigate(`/tenant-master/view/${id}`, { replace: true })
    } catch (error) {
      console.error(error)
      toast(error?.response?.data?.message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 antialiased pb-8">
      <PageHeader
        icon={ShieldCheck}
        title="Edit Tenant"
        badge="Update Account"
        badgeTone="blue"
        actions={
          <div className="flex items-center gap-2">
            <PageCustomizationMenu
              entityType="tenant"
              schemaId="tenant"
            />
            <Link to={`/tenant-master/view/${id}`} className="btn btn-outline text-xs py-1 px-2.5 gap-1.5">
              <ArrowLeft size={14} /> Back
            </Link>
          </div>
        }
      />

      {loading && <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading tenant...</div>}
      {!loading && tenant && (
        <TenantForm mode="edit" initialValue={tenant} baseDomain={settings?.baseDomain} saving={saving} onSubmit={submit} onCancel={() => navigate(`/tenant-master/view/${id}`)} />
      )}
    </div>
  )
}
