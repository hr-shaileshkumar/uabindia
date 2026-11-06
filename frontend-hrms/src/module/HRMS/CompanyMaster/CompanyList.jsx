import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, CheckCircle2, XCircle, Image as ImageIcon, Plus, RefreshCw, Settings2, Sliders } from 'lucide-react'
import { deleteCompany, listCompanies, updateCompanyStatus } from '../../../api/companies'
import { searchTenants } from '../../../api/tenants'
import { useAuth } from '../../../context/AuthContext'
import { useConfirm } from '../../../components/ConfirmProvider'
import { useToast } from '../../../components/ToastProvider'
import PageHeader from '../../../components/PageHeader'
import LayoutVersionBadge from '../../../components/LayoutVersionBadge'
import { getMetadataSchema, syncSchemaFromDb } from '../../../engine/metadataStore'
import DynamicTableRenderer from '../../../engine/renderers/DynamicTableRenderer'

function clean(value) {
  return String(value ?? '').trim()
}

function valueOf(item, key, fallback = '') {
  return item?.[key] ?? item?.[key.charAt(0).toUpperCase() + key.slice(1)] ?? fallback
}

function normalizeCompany(company) {
  const id = valueOf(company, 'companyId') || valueOf(company, 'id')
  const companyName = clean(valueOf(company, 'companyName')) || '-'
  const companyCode = clean(valueOf(company, 'companyCode')) || 'NO-CODE'
  const tenantName = clean(valueOf(company, 'tenantName')) || '-'
  const tenantId = valueOf(company, 'tenantId')
  const contactPerson = clean(valueOf(company, 'contactPerson')) || '-'
  const contactEmail = clean(valueOf(company, 'contactEmail')) || clean(valueOf(company, 'contactPhone')) || ''
  const city = clean(valueOf(company, 'city')) || '-'
  const state = clean(valueOf(company, 'state')) || clean(valueOf(company, 'country')) || ''
  const panNumber = clean(valueOf(company, 'taxId')) || clean(valueOf(company, 'panNumber')) || clean(valueOf(company, 'cin')) || '-'
  const isActive = !!valueOf(company, 'isActive', false)
  const status = clean(valueOf(company, 'status')) || (isActive ? 'Active' : 'Inactive')
  const logoUrl = valueOf(company, 'logoUrl')

  return {
    id,
    companyId: id,
    company: companyName,
    companyName,
    companyCode,
    tenantName,
    tenantId,
    contact: contactPerson,
    contactPerson,
    contactEmail,
    location: city,
    city,
    state,
    panNumber,
    status,
    isActive,
    logoUrl,
    raw: company,
  }
}

export default function CompanyList() {
  const navigate = useNavigate()
  const auth = useAuth()
  const toast = useToast()
  const confirm = useConfirm()

  const [schema, setSchema] = useState(() => getMetadataSchema('company_directory'))
  const [items, setItems] = useState([])
  const [tenantOptions, setTenantOptions] = useState([])
  const [tenantId, setTenantId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const roleName = String(auth?.user?.role || auth?.user?.Role || '').toLowerCase()
  const isSuperAdmin = roleName === 'superadmin'

  // Sync schema from DB and listen to live metadata updates
  useEffect(() => {
    syncSchemaFromDb('company_directory', 'default', true).then(updated => {
      if (updated) setSchema(updated)
    })

    const handleSchemaUpdated = (e) => {
      if (e.detail?.schemaId === 'company_directory') {
        setSchema(e.detail?.schema || getMetadataSchema('company_directory'))
      }
    }
    window.addEventListener('hrms:metadata-updated', handleSchemaUpdated)
    return () => window.removeEventListener('hrms:metadata-updated', handleSchemaUpdated)
  }, [])

  // Load Tenants for SuperAdmin
  useEffect(() => {
    let cancelled = false
    async function loadTenants() {
      if (!isSuperAdmin) return
      try {
        const response = await searchTenants({ status: 'all' })
        const tenantItems = response?.items || response?.Items || []
        if (!cancelled) {
          setTenantOptions(tenantItems.map(item => ({
            tenantId: item.tenantId || item.TenantId,
            companyName: item.companyName || item.CompanyName,
          })))
        }
      } catch (err) {
        console.error('Failed to load tenants:', err)
      }
    }
    loadTenants()
    return () => { cancelled = true }
  }, [isSuperAdmin])

  // Load Companies
  const loadCompanies = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listCompanies({
        status: 'all',
        tenantId: tenantId || undefined,
      })
      const normalized = (Array.isArray(data) ? data : []).map(normalizeCompany)
      setItems(normalized)
    } catch (err) {
      console.error('Failed to load companies:', err)
      setError(err?.response?.data?.message || 'Failed to load companies')
      toast(err?.response?.data?.message || 'Failed to load companies', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCompanies()
  }, [tenantId])

  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter(item => item.isActive).length,
    inactive: items.filter(item => !item.isActive).length,
    withLogo: items.filter(item => !!item.logoUrl).length,
  }), [items])

  const toggleStatus = async (row) => {
    const id = row.id || row.companyId
    const active = !!row.isActive
    const ok = await confirm({
      message: `${active ? 'Deactivate' : 'Activate'} company "${row.companyName}"?`,
      confirmLabel: active ? 'Deactivate' : 'Activate',
      tone: active ? 'danger' : 'primary',
    })
    if (!ok) return

    try {
      await updateCompanyStatus(id, !active)
      toast(`Company ${active ? 'deactivated' : 'activated'} successfully`, 'success')
      loadCompanies()
    } catch (err) {
      console.error(err)
      toast(err?.response?.data?.message || 'Status update failed', 'error')
    }
  }

  const removeCompany = async (row) => {
    const id = row.id || row.companyId
    const ok = await confirm({
      message: `Delete company "${row.companyName}" permanently? This works only after deactivation.`,
      confirmLabel: 'Delete',
      tone: 'danger',
    })
    if (!ok) return

    try {
      await deleteCompany(id)
      toast('Company deleted successfully', 'success')
      loadCompanies()
    } catch (err) {
      console.error(err)
      toast(err?.response?.data?.message || 'Delete failed', 'error')
    }
  }

  const handleAction = async (action, row) => {
    if (action.key === 'view' && row?.id) {
      navigate(`/module/hrms/company-master/view/${row.id}${tenantId ? `?tenantId=${tenantId}` : ''}`)
    } else if (action.key === 'setup' && row?.id) {
      navigate(`/module/hrms/company-master/view/${row.id}?tab=setup${tenantId ? `?tenantId=${tenantId}` : ''}`)
    } else if (action.key === 'edit' && row?.id) {
      navigate(`/module/hrms/company-master/edit/${row.id}${tenantId ? `?tenantId=${tenantId}` : ''}`)
    } else if (action.key === 'toggleStatus' && row?.id) {
      await toggleStatus(row)
    } else if (action.key === 'delete' && row?.id) {
      await removeCompany(row)
    } else if (action.key === 'create') {
      navigate(`/module/hrms/company-master/create${tenantId ? `?tenantId=${tenantId}` : ''}`)
    }
  }

  return (
    <div className="space-y-4 antialiased pb-8 select-none">
      {/* 1. Header */}
      {/* 1. Page Header */}
      <PageHeader
        icon={Building2}
        title={schema.title || 'Companies & Divisions'}
        description={schema.subtitle || 'Manage registered enterprise entities, legal subsidiaries, and operational branches'}
        badge={`${stats.total} Companies`}
        badgeTone="purple"
      >
        <LayoutVersionBadge entity="company" version={schema?.version} />

        {isSuperAdmin && tenantOptions.length > 0 && (
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl text-xs">
            <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">Tenant:</span>
            <select
              className="bg-transparent text-slate-800 font-bold outline-none cursor-pointer text-xs"
              value={tenantId}
              onChange={e => setTenantId(e.target.value)}
            >
              <option value="">All Tenants</option>
              {tenantOptions.map(t => (
                <option key={t.tenantId} value={t.tenantId}>{t.companyName}</option>
              ))}
            </select>
          </div>
        )}

        <button
          type="button"
          onClick={loadCompanies}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
          title="Refresh company roster"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin text-purple-600' : 'text-slate-500'} />
          <span>Refresh</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/module/hrms/setup')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
        >
          <Settings2 size={13} className="text-slate-500" />
          <span>Setup Center</span>
        </button>

        <button
          type="button"
          onClick={() => navigate(`/module/hrms/company-master/create${tenantId ? `?tenantId=${tenantId}` : ''}`)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-xs hover:shadow transition cursor-pointer"
        >
          <Plus size={14} />
          <span>Add Company</span>
        </button>
      </PageHeader>

      {/* 2. Slim Integrated Metric Ribbon (Modern SaaS Style) */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-2 sm:p-2.5 shadow-2xs flex items-center justify-between divide-x divide-slate-100 flex-wrap sm:flex-nowrap gap-2 sm:gap-0">
        <div className="flex items-center gap-2.5 px-3 flex-1 min-w-[130px]">
          <div className="h-8 w-8 rounded-lg bg-purple-50 border border-purple-100/80 flex items-center justify-center text-purple-600 shrink-0">
            <Building2 size={15} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Entities</div>
            <div className="text-base font-bold text-slate-900 leading-none mt-0.5">{stats.total}</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-3 flex-1 min-w-[130px]">
          <div className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-100/80 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 size={15} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Active</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </div>
            <div className="text-base font-bold text-slate-900 leading-none mt-0.5">{stats.active}</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-3 flex-1 min-w-[130px]">
          <div className="h-8 w-8 rounded-lg bg-rose-50 border border-rose-100/80 flex items-center justify-center text-rose-600 shrink-0">
            <XCircle size={15} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Inactive</div>
            <div className="text-base font-bold text-slate-900 leading-none mt-0.5">{stats.inactive}</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-3 flex-1 min-w-[130px]">
          <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100/80 flex items-center justify-center text-blue-600 shrink-0">
            <ImageIcon size={15} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Branded (Logo)</div>
            <div className="text-base font-bold text-slate-900 leading-none mt-0.5">{stats.withLogo}</div>
          </div>
        </div>
      </div>

      {/* 3. Metadata-Driven Dynamic Table */}
      <DynamicTableRenderer
        schema={schema}
        data={items}
        loading={loading}
        error={error}
        onRefresh={loadCompanies}
        onAction={handleAction}
        onRowClick={row => navigate(`/module/hrms/company-master/view/${row.id}`)}
      />
    </div>
  )
}
