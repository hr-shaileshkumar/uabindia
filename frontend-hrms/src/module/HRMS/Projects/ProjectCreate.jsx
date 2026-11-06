import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, FolderKanban } from 'lucide-react'
import { listCompanies } from '../../../api/companies'
import { createProject } from '../../../api/projects'
import { searchTenants } from '../../../api/tenants'
import { useAuth } from '../../../context/AuthContext'
import { useToast } from '../../../components/ToastProvider'
import PageHeader from '../../../components/PageHeader'
import LayoutVersionBadge from '../../../components/LayoutVersionBadge'
import PageCustomizationMenu from '../../../components/PageCustomizationMenu'
import ProjectForm from './ProjectForm'

export default function ProjectCreate() {
  const auth = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const toast = useToast()
  const requestedTenantId = new URLSearchParams(location.search).get('tenantId') || ''
  const [tenantId, setTenantId] = useState(requestedTenantId)
  const [tenantOptions, setTenantOptions] = useState([])
  const [companyOptions, setCompanyOptions] = useState([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [saving, setSaving] = useState(false)

  const roleName = String(auth?.user?.role || auth?.user?.Role || '').toLowerCase()
  const isSuperAdmin = roleName === 'superadmin'

  async function loadCompanies(nextTenantId = tenantId) {
    if (isSuperAdmin && !nextTenantId) {
      setCompanyOptions([])
      return
    }

    setLoadingCompanies(true)
    try {
      const data = await listCompanies({
        tenantId: nextTenantId || undefined,
        status: 'active',
      })
      setCompanyOptions(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error(error)
      toast('Failed to load companies', 'error')
      setCompanyOptions([])
    } finally {
      setLoadingCompanies(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    async function loadTenants() {
      if (!isSuperAdmin) return
      try {
        const response = await searchTenants({ status: 'all' })
        const tenantItems = response?.items || response?.Items || []
        if (!cancelled) setTenantOptions(tenantItems)
      } catch (error) {
        console.error(error)
      }
    }
    loadTenants()
    return () => { cancelled = true }
  }, [isSuperAdmin])

  useEffect(() => {
    loadCompanies(tenantId)
  }, [tenantId])

  async function submit(payload) {
    setSaving(true)
    try {
      const response = await createProject(payload)
      const projectId = response?.id || response?.Id
      navigate(projectId ? `/module/hrms/projects/view/${projectId}` : '/module/hrms/projects', { replace: true })
    } catch (error) {
      console.error(error)
      toast(error?.response?.data?.message || 'Create failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const initialValue = useMemo(() => ({
    tenantId,
  }), [tenantId])

  return (
    <div className="space-y-4 antialiased pb-8">
      <PageHeader
        icon={FolderKanban}
        title="Create Project"
        badge="New Assignment"
        badgeTone="blue"
        actions={
          <div className="flex items-center gap-2">
            <LayoutVersionBadge entity="project" version={1.0} />
            <PageCustomizationMenu
              entityType="project"
              schemaId="project"
            />
            <Link to="/module/hrms/projects" className="btn btn-back text-xs py-1 px-2.5">
              <ArrowLeft size={14} /> Back
            </Link>
          </div>
        }
      />

      <ProjectForm
        initialValue={initialValue}
        tenantOptions={tenantOptions}
        companyOptions={companyOptions}
        showTenant={isSuperAdmin}
        loadingCompanies={loadingCompanies}
        saving={saving}
        onTenantChange={setTenantId}
        onSubmit={submit}
        onCancel={() => navigate('/module/hrms/projects')}
      />
    </div>
  )
}
