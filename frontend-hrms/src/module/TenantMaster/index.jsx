import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Building2,
  Eye,
  Pencil,
  Power,
  RefreshCw,
  Search,
  Users,
  FolderKanban,
  BriefcaseBusiness,
  ShieldCheck,
  Plus,
  Sliders,
  Sparkles
} from 'lucide-react'
import { deleteTenant, searchTenants, updateTenantStatus } from '../../api/tenants'
import { brandingLogoUrl } from '../../api/branding'
import { getPlatformSettings, tenantHost } from '../../api/platformSettings'
import { useConfirm } from '../../components/ConfirmProvider'
import { useToast } from '../../components/ToastProvider'
import PageHeader from '../../components/PageHeader'
import LayoutVersionBadge from '../../components/LayoutVersionBadge'
import { getMetadataSchema, syncSchemaFromDb } from '../../engine/metadataStore'
import DynamicTableRenderer from '../../engine/renderers/DynamicTableRenderer'

function valueOf(item, key, fallback = '') {
  return item?.[key] ?? item?.[key.charAt(0).toUpperCase() + key.slice(1)] ?? fallback
}

function normalizeTenant(t) {
  const id = valueOf(t, 'tenantId') || valueOf(t, 'id')
  const companyName = valueOf(t, 'companyName') || valueOf(t, 'name') || '-'
  const subdomain = valueOf(t, 'subdomain') || 'app'
  const planName = valueOf(t, 'planName') || 'Enterprise'
  const isolationModel = valueOf(t, 'isolationModel') || 'Shared DB'
  const contactEmail = valueOf(t, 'contactEmail') || valueOf(t, 'email') || '-'
  const isActive = !!valueOf(t, 'isActive', false)
  const status = valueOf(t, 'status') || (isActive ? 'Active' : 'Inactive')

  return {
    id,
    tenantId: id,
    companyName,
    subdomain,
    tenant: companyName,
    plan: planName,
    isolationModel,
    contactEmail,
    status,
    isActive,
    raw: t,
  }
}

export default function TenantMaster() {
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()

  const [schema, setSchema] = useState(() => getMetadataSchema('tenant_directory'))
  const [data, setData] = useState({ items: [], total: 0, active: 0, inactive: 0, userCount: 0, projectCount: 0, companyCount: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    syncSchemaFromDb('tenant_directory', 'default', true).then(updated => {
      if (updated) setSchema(updated)
    })
  }, [])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const response = await searchTenants({ status: 'all' })
      const rawList = response?.items || response?.Items || []
      setData({
        items: rawList.map(normalizeTenant),
        total: response?.total || response?.Total || rawList.length,
        active: response?.active || response?.Active || rawList.filter(r => r.isActive).length,
        inactive: response?.inactive || response?.Inactive || rawList.filter(r => !r.isActive).length,
        userCount: response?.userCount || response?.UserCount || 0,
        projectCount: response?.projectCount || response?.ProjectCount || 0,
        companyCount: response?.companyCount || response?.CompanyCount || 0,
      })
    } catch (err) {
      console.error(err)
      setError(err?.response?.data?.message || 'Failed to load tenants')
      toast(err?.response?.data?.message || 'Failed to load tenants', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleAction = async (action, row) => {
    if (action.key === 'view' && row?.id) {
      navigate(`/tenant-master/view/${row.id}`)
    } else if (action.key === 'edit' && row?.id) {
      navigate(`/tenant-master/edit/${row.id}`)
    } else if (action.key === 'create') {
      navigate('/tenant-master/create')
    } else if (action.key === 'toggleStatus' && row?.id) {
      await toggleStatus(row.raw || row)
    } else if (action.key === 'delete' && row?.id) {
      await removeTenant(row.raw || row)
    }
  }

  async function toggleStatus(tenant) {
    const id = valueOf(tenant, 'tenantId')
    const active = !!valueOf(tenant, 'isActive', false)
    const ok = await confirm({
      message: `${active ? 'Deactivate' : 'Activate'} this tenant?`,
      confirmLabel: active ? 'Deactivate' : 'Activate',
      tone: active ? 'danger' : 'primary',
    })
    if (!ok) return

    try {
      await updateTenantStatus(id, !active)
      await load()
      toast(`Tenant ${active ? 'deactivated' : 'activated'} successfully`, 'success')
    } catch (error) {
      console.error(error)
      toast('Status update failed', 'error')
    }
  }

  async function removeTenant(tenant) {
    const id = valueOf(tenant, 'tenantId')
    const ok = await confirm({
      message: 'Delete tenant permanently? This works only after deactivation and only when no users, projects, or companies are linked.',
      confirmLabel: 'Delete',
      tone: 'danger',
    })
    if (!ok) return

    try {
      await deleteTenant(id)
      await load()
      toast('Tenant deleted successfully', 'success')
    } catch (error) {
      console.error(error)
      toast(error?.response?.data?.message || 'Delete failed', 'error')
    }
  }

  return (
    <div className="space-y-4 antialiased pb-8 select-none">
      {/* 1. Header */}
      <PageHeader
        icon={ShieldCheck}
        title={schema.title || 'Tenants & SaaS Accounts'}
        description={schema.subtitle || 'Multi-tenant isolation, subdomain routing, and SaaS licensing'}
        badge={`${data.total} Tenants`}
        badgeTone="purple"
      >
        <LayoutVersionBadge entity="tenant" version={schema?.version} />

        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
          title="Refresh tenant accounts"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin text-purple-600' : 'text-slate-500'} />
          <span>Refresh</span>
        </button>

        <Link
          to="/tenant-master/provider-setup"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition"
        >
          <ShieldCheck size={13} className="text-slate-500" />
          <span>Provider Setup</span>
        </Link>

        <button
          type="button"
          onClick={() => navigate('/tenant-master/create')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-xs hover:shadow transition cursor-pointer"
        >
          <Plus size={14} />
          <span>Add Tenant</span>
        </button>
      </PageHeader>

      {/* 2. Slim Integrated Metric Ribbon */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-2 sm:p-2.5 shadow-2xs flex items-center justify-between divide-x divide-slate-100 flex-wrap sm:flex-nowrap gap-2 sm:gap-0">
        <div className="flex items-center gap-2.5 px-3 flex-1 min-w-[130px]">
          <div className="h-8 w-8 rounded-lg bg-purple-50 border border-purple-100/80 flex items-center justify-center text-purple-600 shrink-0">
            <Building2 size={15} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Tenants</div>
            <div className="text-base font-bold text-slate-900 leading-none mt-0.5">{data.total}</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-3 flex-1 min-w-[130px]">
          <div className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-100/80 flex items-center justify-center text-emerald-600 shrink-0">
            <Power size={15} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Active Tenants</div>
            <div className="text-base font-bold text-slate-900 leading-none mt-0.5">{data.active}</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-3 flex-1 min-w-[130px]">
          <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100/80 flex items-center justify-center text-blue-600 shrink-0">
            <Users size={15} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">User Accounts</div>
            <div className="text-base font-bold text-slate-900 leading-none mt-0.5">{data.userCount}</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-3 flex-1 min-w-[130px]">
          <div className="h-8 w-8 rounded-lg bg-amber-50 border border-amber-100/80 flex items-center justify-center text-amber-600 shrink-0">
            <FolderKanban size={15} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Active Projects</div>
            <div className="text-base font-bold text-slate-900 leading-none mt-0.5">{data.projectCount}</div>
          </div>
        </div>
      </div>

      {/* 3. Metadata-Driven Dynamic Table */}
      <DynamicTableRenderer
        schema={schema}
        data={data.items}
        loading={loading}
        error={error}
        onRefresh={load}
        onAction={handleAction}
        onRowClick={row => navigate(`/tenant-master/view/${row.id}`)}
      />
    </div>
  )
}
