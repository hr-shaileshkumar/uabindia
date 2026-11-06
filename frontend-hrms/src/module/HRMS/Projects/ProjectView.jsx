import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, FolderKanban, Pencil, Power } from 'lucide-react'
import { getProject, updateProjectStatus } from '../../../api/projects'
import { useConfirm } from '../../../components/ConfirmProvider'
import { useToast } from '../../../components/ToastProvider'
import PageHeader from '../../../components/PageHeader'
import LayoutVersionBadge from '../../../components/LayoutVersionBadge'

function get(item, key, fallback = '') {
  return item?.[key] ?? item?.[key.charAt(0).toUpperCase() + key.slice(1)] ?? fallback
}

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString()
}

function Row({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 break-words text-sm text-slate-700">{value || '-'}</div>
    </div>
  )
}

export default function ProjectView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const data = await getProject(id)
      setProject(data)
    } catch (error) {
      console.error(error)
      setProject(null)
      toast(error?.response?.data?.message || 'Failed to load project', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  async function toggleStatus() {
    if (!project) return
    const active = !!get(project, 'isActive', false)
    const ok = await confirm({
      message: `${active ? 'Deactivate' : 'Activate'} this project?`,
      confirmLabel: active ? 'Deactivate' : 'Activate',
      tone: active ? 'danger' : 'primary',
    })
    if (!ok) return

    try {
      await updateProjectStatus(id, !active)
      await load()
    } catch (error) {
      console.error(error)
      toast(error?.response?.data?.message || 'Status update failed', 'error')
    }
  }

  if (loading) return <div className="px-4 py-4 text-sm text-slate-500">Loading project...</div>
  if (!project) return <div className="px-4 py-4 text-sm text-slate-500">Project not found.</div>

  const isActive = !!get(project, 'isActive', false)

  return (
    <div className="space-y-4 antialiased pb-8">
      <PageHeader
        icon={FolderKanban}
        title={get(project, 'projectName') || 'Project Details'}
        badge={isActive ? 'Active' : 'Inactive'}
        badgeTone={isActive ? 'green' : 'amber'}
        actions={
          <div className="flex flex-wrap items-center gap-1.5">
            <LayoutVersionBadge entity="project" version={1.0} />
            <button type="button" onClick={() => navigate('/module/hrms/projects')} className="btn btn-back text-xs py-1 px-2.5">
              <ArrowLeft size={14} /> Back
            </button>
            <Link to={`/module/hrms/projects/edit/${id}`} className="btn btn-edit text-xs py-1 px-2.5">
              <Pencil size={13} /> Edit
            </Link>
            <button className={`${isActive ? 'btn btn-deactivate' : 'btn btn-activate'} text-xs py-1 px-2.5`} onClick={toggleStatus}>
              <Power size={13} />
              {isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1.1fr,0.9fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="mb-5 flex items-start gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-3">
              <CalendarDays size={28} className="text-slate-500" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xl font-semibold text-slate-900">{get(project, 'projectName')}</div>
              <div className="mt-1 text-sm text-slate-500">{get(project, 'projectCode')}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                  {get(project, 'companyName') || 'Company not linked'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Row label="Tenant" value={get(project, 'tenantName')} />
            <Row label="Company" value={get(project, 'companyName')} />
            <Row label="Company code" value={get(project, 'companyCode')} />
            <Row label="Client / Sponsor" value={get(project, 'clientName') || 'Internal Project'} />
            <Row label="Lifecycle Status" value={get(project, 'status') || 'Active'} />
            <Row label="Billing Type" value={get(project, 'billingType') || 'Hourly'} />
            <Row label="Budget Allocated" value={`${get(project, 'currency', 'INR')} ${Number(get(project, 'budgetAllocated', 0)).toLocaleString()}`} />
            <Row label="Project Manager" value={get(project, 'projectManagerName') || 'Unassigned'} />
            <Row label="Created" value={get(project, 'createdAt') ? new Date(get(project, 'createdAt')).toLocaleString() : ''} />
            <Row label="Updated" value={get(project, 'updatedAt') ? new Date(get(project, 'updatedAt')).toLocaleString() : ''} />
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h3 className="mb-4 text-base font-semibold text-slate-900">Schedule & Timeline</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Row label="Start date" value={formatDate(get(project, 'startDate'))} />
              <Row label="End date" value={formatDate(get(project, 'endDate'))} />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h3 className="mb-4 text-base font-semibold text-slate-900">Operational & Timesheet Rules</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Row label="Timesheet Logging" value={get(project, 'allowTimesheets', true) ? 'Allowed' : 'Disabled'} />
              <Row label="Overtime Approval" value={get(project, 'requireOvertimeApproval', false) ? 'Mandatory' : 'Not Required'} />
              <Row label="Geofencing Radius" value={get(project, 'geofencingEnabled', false) ? 'Enforced' : 'Off'} />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h3 className="mb-4 text-base font-semibold text-slate-900">Description</h3>
            <p className="min-h-20 text-sm leading-6 text-slate-700">{get(project, 'description') || 'No description recorded.'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
