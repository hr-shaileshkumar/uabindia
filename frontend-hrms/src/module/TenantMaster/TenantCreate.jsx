import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { createTenant, uploadTenantLogo } from '../../api/tenants'
import { getPlatformSettings } from '../../api/platformSettings'
import { useToast } from '../../components/ToastProvider'
import PageHeader from '../../components/PageHeader'
import PageCustomizationMenu from '../../components/PageCustomizationMenu'
import TenantForm from './TenantForm'

export default function TenantCreate() {
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState(null)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const toast = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    async function loadSettings() {
      setLoadingSettings(true)
      try {
        const response = await getPlatformSettings()
        if (!cancelled) setSettings(response)
      } catch (error) {
        console.error(error)
        toast('Failed to load provider setup', 'error')
      } finally {
        if (!cancelled) setLoadingSettings(false)
      }
    }
    loadSettings()
    return () => { cancelled = true }
  }, [])

  async function submit(payload, options = {}) {
    setSaving(true)
    try {
      const response = await createTenant(payload)
      const tenantId = response?.id || response?.Id
      if (tenantId && options.logoFile) {
        await uploadTenantLogo(tenantId, options.logoFile)
      }
      navigate(`/tenant-master/view/${tenantId}`, { replace: true })
    } catch (error) {
      console.error(error)
      toast(error?.response?.data?.message || 'Create failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 antialiased pb-8">
      <PageHeader
        icon={ShieldCheck}
        title="Create Tenant"
        badge="New Account"
        badgeTone="blue"
        actions={
          <div className="flex items-center gap-2">
            <PageCustomizationMenu
              entityType="tenant"
              schemaId="tenant"
            />
            <Link to="/tenant-master" className="btn btn-outline text-xs py-1 px-2.5 gap-1.5">
              <ArrowLeft size={14} /> Back
            </Link>
          </div>
        }
      />

      {loadingSettings && <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading setup...</div>}
      {!loadingSettings && (
        <TenantForm
          key={settings?.id || 'default'}
          saving={saving}
          baseDomain={settings?.baseDomain}
          initialValue={{
            planName: settings?.defaultPlanName,
            maxUsers: settings?.defaultMaxUsers,
            maxProjects: settings?.defaultMaxProjects,
          }}
          onSubmit={submit}
          onCancel={() => navigate('/tenant-master')}
        />
      )}
    </div>
  )
}
