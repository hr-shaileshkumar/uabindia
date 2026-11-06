import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FolderKanban } from 'lucide-react'
import { listCompanies } from '../../../api/companies'
import { getProject, updateProject } from '../../../api/projects'
import { searchTenants } from '../../../api/tenants'
import { useAuth } from '../../../context/AuthContext'
import { useToast } from '../../../components/ToastProvider'
import PageHeader from '../../../components/PageHeader'
import LayoutVersionBadge from '../../../components/LayoutVersionBadge'
import PageCustomizationMenu from '../../../components/PageCustomizationMenu'
import ProjectForm from './ProjectForm'

export default function ProjectEdit() {
  const { id } = useParams()
  const auth = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [project, setProject] = useState(null)
  const [tenantOptions, setTenantOptions] = useState([])
  const [companyOptions, setCompanyOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [saving, setSaving] = useState(false)

  const roleName = String(auth?.user?.role || auth?.user?.Role || '').toLowerCase()
  const isSuperAdmin = roleName === 'superadmin'

  async function loadCompanies(tenantId) {
    setLoadingCompanies(true)
    try {
      const data = await listCompanies({
        tenantId: tenantId || undefined,
        status: 'active',
      })
      setCompanyOptions(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error(error)
      setCompanyOptions([])
    } finally {
      setLoadingCompanies(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const [projectData, tenantResponse] = await Promise.all([
          getProject(id),
          isSuperAdmin ? searchTenants({ status: 'all' }) : Promise.resolve(null),
        ])
        if (cancelled) return
        setProject(projectData)
        setTenantOptions(tenantResponse?.items || tenantResponse?.Items || [])
        await loadCompanies(projectData?.tenantId || projectData?.TenantId)
      } catch (error) {
        console.error(error)
        toast(error?.response?.data?.message || 'Failed to load project', 'error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id, isSuperAdmin])

  async function submit(payload) {
    setSaving(true)
    try {
      await updateProject(id, payload)
      navigate(`/module/hrms/projects/view/${id}`, { replace: true })
    } catch (error) {
      console.error(error)
      toast(error?.response?.data?.message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="px-4 py-4 text-sm text-slate-500">Loading project...</div>
  if (!project) return <div className="px-4 py-4 text-sm text-slate-500">Project not found.</div>

  return (
    <div className="space-y-4 antialiased pb-8">
      <PageHeader
        icon={FolderKanban}
        title="Edit Project"
        badge="Update Project"
        badgeTone="blue"
        actions={
          <div className="flex items-center gap-2">
            <LayoutVersionBadge entity="project" version={1.0} />
            <PageCustomizationMenu
              entityType="project"
              schemaId="project"
            />
            <Link to={`/module/hrms/projects/view/${id}`} className="btn btn-back text-xs py-1 px-2.5">
              <ArrowLeft size={14} /> Back
            </Link>
          </div>
        }
      />

      <ProjectForm
        mode="edit"
        initialValue={project}
        tenantOptions={tenantOptions}
        companyOptions={companyOptions}
        showTenant={isSuperAdmin}
        loadingCompanies={loadingCompanies}
        saving={saving}
        onTenantChange={loadCompanies}
        onSubmit={submit}
        onCancel={() => navigate(`/module/hrms/projects/view/${id}`)}
      />
    </div>
  )
}
