import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderKanban, CheckCircle2, XCircle, Building2, Plus, RefreshCw, Sliders } from 'lucide-react'
import { listCompanies } from '../../../api/companies'
import { listProjects, updateProjectStatus } from '../../../api/projects'
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

function normalizeProject(project) {
  const id = valueOf(project, 'projectId') || valueOf(project, 'id')
  const projectName = clean(valueOf(project, 'projectName')) || '-'
  const projectCode = clean(valueOf(project, 'projectCode')) || '-'
  const clientName = clean(valueOf(project, 'clientName')) || '-'
  const companyName = clean(valueOf(project, 'companyName')) || '-'
  const companyCode = clean(valueOf(project, 'companyCode'))
  const billingType = clean(valueOf(project, 'billingType')) || 'Hourly'
  const startDate = valueOf(project, 'startDate')
  const endDate = valueOf(project, 'endDate')
  const isActive = !!valueOf(project, 'isActive', false)
  const status = clean(valueOf(project, 'status')) || (isActive ? 'Active' : 'Inactive')

  return {
    id,
    projectId: id,
    projectName,
    projectCode,
    project: projectName,
    clientName,
    company: companyName,
    companyName,
    companyCode,
    billingType,
    startDate,
    endDate,
    status,
    isActive,
    tenantId: valueOf(project, 'tenantId'),
    tenantName: valueOf(project, 'tenantName'),
    companyId: valueOf(project, 'companyId'),
    raw: project,
  }
}

export default function ProjectsList() {
  const navigate = useNavigate()
  const auth = useAuth()
  const toast = useToast()
  const confirm = useConfirm()

  const [schema, setSchema] = useState(() => getMetadataSchema('project_directory'))
  const [items, setItems] = useState([])
  const [tenantOptions, setTenantOptions] = useState([])
  const [companyOptions, setCompanyOptions] = useState([])
  const [tenantId, setTenantId] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [loading, setLoading] = useState(false)
  const [companiesLoading, setCompaniesLoading] = useState(false)
  const [error, setError] = useState(null)

  const roleName = String(auth?.user?.role || auth?.user?.Role || '').toLowerCase()
  const isSuperAdmin = roleName === 'superadmin'

  // Sync schema from DB and listen to live metadata updates
  useEffect(() => {
    syncSchemaFromDb('project_directory', 'default', true).then(updated => {
      if (updated) setSchema(updated)
    })

    const handleSchemaUpdated = (e) => {
      if (e.detail?.schemaId === 'project_directory') {
        setSchema(e.detail?.schema || getMetadataSchema('project_directory'))
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
        if (!cancelled) setTenantOptions(tenantItems)
      } catch (err) {
        console.error('Failed to load tenants:', err)
      }
    }
    loadTenants()
    return () => { cancelled = true }
  }, [isSuperAdmin])

  // Load Companies
  useEffect(() => {
    let cancelled = false
    async function loadComps() {
      setCompaniesLoading(true)
      try {
        const data = await listCompanies({
          tenantId: tenantId || undefined,
          status: 'active',
        })
        if (!cancelled) {
          setCompanyOptions(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        if (!cancelled) setCompanyOptions([])
      } finally {
        if (!cancelled) setCompaniesLoading(false)
      }
    }
    loadComps()
    setCompanyId('')
    return () => { cancelled = true }
  }, [tenantId])

  // Load Projects
  const loadProjects = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listProjects({
        status: 'all',
        tenantId: tenantId || undefined,
        companyId: companyId || undefined,
      })
      const normalized = (Array.isArray(data) ? data : []).map(normalizeProject)
      setItems(normalized)
    } catch (err) {
      console.error('Failed to load projects:', err)
      setError(err?.response?.data?.message || 'Failed to load projects')
      toast(err?.response?.data?.message || 'Failed to load projects', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [tenantId, companyId])

  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter(item => item.isActive).length,
    inactive: items.filter(item => !item.isActive).length,
    linked: items.filter(item => !!item.companyId).length,
  }), [items])

  const toggleStatus = async (row) => {
    const id = row.id || row.projectId
    const active = !!row.isActive
    const ok = await confirm({
      message: `${active ? 'Deactivate' : 'Activate'} project "${row.projectName}"?`,
      confirmLabel: active ? 'Deactivate' : 'Activate',
      tone: active ? 'danger' : 'primary',
    })
    if (!ok) return

    try {
      await updateProjectStatus(id, !active)
      toast(`Project ${active ? 'deactivated' : 'activated'} successfully`, 'success')
      loadProjects()
    } catch (err) {
      console.error(err)
      toast(err?.response?.data?.message || 'Status update failed', 'error')
    }
  }

  const handleAction = async (action, row) => {
    if (action.key === 'view' && row?.id) {
      navigate(`/module/hrms/projects/view/${row.id}`)
    } else if (action.key === 'edit' && row?.id) {
      navigate(`/module/hrms/projects/edit/${row.id}`)
    } else if (action.key === 'toggleStatus' && row?.id) {
      await toggleStatus(row)
    } else if (action.key === 'create') {
      navigate(`/module/hrms/projects/create${tenantId ? `?tenantId=${tenantId}` : ''}`)
    }
  }

  return (
    <div className="space-y-4 antialiased pb-8 select-none">
      {/* 1. Header */}
      <PageHeader
        icon={FolderKanban}
        title={schema.title || 'Projects & Program Allocations'}
        description={schema.subtitle || 'Track field programs, budgets, and team workforce deployment'}
        badge={`${stats.total} Projects`}
        badgeTone="purple"
      >
        <LayoutVersionBadge entity="project" version={schema?.version} />

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
                <option key={valueOf(t, 'tenantId')} value={valueOf(t, 'tenantId')}>{valueOf(t, 'companyName')}</option>
              ))}
            </select>
          </div>
        )}

        {companyOptions.length > 0 && (
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl text-xs">
            <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">Company:</span>
            <select
              className="bg-transparent text-slate-800 font-bold outline-none cursor-pointer text-xs"
              value={companyId}
              onChange={e => setCompanyId(e.target.value)}
              disabled={companiesLoading}
            >
              <option value="">{companiesLoading ? 'Loading...' : 'All Companies'}</option>
              {companyOptions.map(c => (
                <option key={valueOf(c, 'companyId')} value={valueOf(c, 'companyId')}>{valueOf(c, 'companyName')}</option>
              ))}
            </select>
          </div>
        )}

        <button
          type="button"
          onClick={loadProjects}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
          title="Refresh project roster"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin text-purple-600' : 'text-slate-500'} />
          <span>Refresh</span>
        </button>

        <button
          type="button"
          onClick={() => navigate(`/module/hrms/projects/create${tenantId ? `?tenantId=${tenantId}` : ''}`)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-xs hover:shadow transition cursor-pointer"
        >
          <Plus size={14} />
          <span>Add Project</span>
        </button>
      </PageHeader>

      {/* 2. Slim Integrated Metric Ribbon (Modern SaaS Style) */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-2 sm:p-2.5 shadow-2xs flex items-center justify-between divide-x divide-slate-100 flex-wrap sm:flex-nowrap gap-2 sm:gap-0">
        <div className="flex items-center gap-2.5 px-3 flex-1 min-w-[130px]">
          <div className="h-8 w-8 rounded-lg bg-purple-50 border border-purple-100/80 flex items-center justify-center text-purple-600 shrink-0">
            <FolderKanban size={15} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Projects</div>
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
            <Building2 size={15} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Company Linked</div>
            <div className="text-base font-bold text-slate-900 leading-none mt-0.5">{stats.linked}</div>
          </div>
        </div>
      </div>

      {/* 3. Metadata-Driven Dynamic Table */}
      <DynamicTableRenderer
        schema={schema}
        data={items}
        loading={loading}
        error={error}
        onRefresh={loadProjects}
        onAction={handleAction}
        onRowClick={row => navigate(`/module/hrms/projects/view/${row.id}`)}
      />
    </div>
  )
}
