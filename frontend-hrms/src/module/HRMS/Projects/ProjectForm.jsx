import React, { useEffect, useState, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import { getPreviewSequence } from '../../../api/sequences'

export function generateProjectCode() {
  return ''
}

const emptyProject = {
  tenantId: '',
  companyId: '',
  projectCode: '',
  projectName: '',
  clientName: '',
  startDate: '',
  endDate: '',
  status: 'Active',
  billingType: 'Hourly',
  budgetAllocated: 0,
  currency: 'INR',
  projectManagerId: '',
  allowTimesheets: true,
  requireOvertimeApproval: false,
  geofencingEnabled: false,
  description: '',
  isActive: true,
}

function valueOf(item, key, fallback = '') {
  return item?.[key] ?? item?.[key.charAt(0).toUpperCase() + key.slice(1)] ?? fallback
}

function toDateInput(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

export function toProjectForm(value = {}) {
  return {
    ...emptyProject,
    tenantId: valueOf(value, 'tenantId'),
    companyId: valueOf(value, 'companyId'),
    projectCode: valueOf(value, 'projectCode') || '',
    projectName: valueOf(value, 'projectName'),
    clientName: valueOf(value, 'clientName'),
    startDate: toDateInput(valueOf(value, 'startDate')),
    endDate: toDateInput(valueOf(value, 'endDate')),
    status: valueOf(value, 'status', 'Active'),
    billingType: valueOf(value, 'billingType', 'Hourly'),
    budgetAllocated: Number(valueOf(value, 'budgetAllocated', 0)),
    currency: valueOf(value, 'currency', 'INR'),
    projectManagerId: valueOf(value, 'projectManagerId', ''),
    allowTimesheets: typeof valueOf(value, 'allowTimesheets') === 'boolean' ? valueOf(value, 'allowTimesheets') : true,
    requireOvertimeApproval: typeof valueOf(value, 'requireOvertimeApproval') === 'boolean' ? valueOf(value, 'requireOvertimeApproval') : false,
    geofencingEnabled: typeof valueOf(value, 'geofencingEnabled') === 'boolean' ? valueOf(value, 'geofencingEnabled') : false,
    description: valueOf(value, 'description'),
    isActive: typeof value?.isActive === 'boolean' ? value.isActive : value?.IsActive ?? true,
  }
}

export function buildProjectPayload(form) {
  return {
    tenantId: form.tenantId || null,
    companyId: form.companyId || null,
    projectCode: (form.projectCode || generateProjectCode()).trim(),
    projectName: form.projectName.trim(),
    clientName: form.clientName?.trim() || null,
    startDate: form.startDate || null,
    endDate: form.endDate || null,
    status: form.status || 'Active',
    billingType: form.billingType || 'Hourly',
    budgetAllocated: Number(form.budgetAllocated) || 0,
    currency: form.currency || 'INR',
    projectManagerId: form.projectManagerId || null,
    allowTimesheets: !!form.allowTimesheets,
    requireOvertimeApproval: !!form.requireOvertimeApproval,
    geofencingEnabled: !!form.geofencingEnabled,
    description: form.description.trim(),
    isActive: !!form.isActive,
  }
}

function validate(form, requireTenant) {
  if (requireTenant && !form.tenantId) return 'Tenant is required'
  if (!form.companyId) return 'Company is required'
  if (!form.projectName.trim()) return 'Project name is required'
  if (form.startDate && form.endDate && form.endDate < form.startDate) return 'End date cannot be before start date'
  return null
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  )
}

export default function ProjectForm({
  initialValue,
  tenantOptions = [],
  companyOptions = [],
  showTenant = false,
  mode = 'create',
  saving = false,
  loadingCompanies = false,
  onTenantChange,
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState(() => toProjectForm(initialValue))
  const [error, setError] = useState('')
  const [codeLoading, setCodeLoading] = useState(false)

  const fetchNextCode = useCallback(async (companyId) => {
    if (mode === 'edit') return
    setCodeLoading(true)
    try {
      const res = await getPreviewSequence('Project', companyId || undefined)
      if (res?.code) {
        setForm(current => ({ ...current, projectCode: res.code }))
      }
    } catch {
      // Fallback
    } finally {
      setCodeLoading(false)
    }
  }, [mode])

  useEffect(() => {
    if (mode === 'edit') {
      setForm(toProjectForm(initialValue))
    }
  }, [initialValue, mode])

  useEffect(() => {
    if (mode !== 'create' || companyOptions.length !== 1) return
    const company = companyOptions[0]
    const cId = valueOf(company, 'companyId')
    setForm(current => {
      if (current.companyId) return current
      return {
        ...current,
        companyId: cId,
        tenantId: current.tenantId || valueOf(company, 'tenantId'),
      }
    })
    fetchNextCode(cId)
  }, [companyOptions, mode, fetchNextCode])

  useEffect(() => {
    if (mode === 'create' && form.companyId && !form.projectCode) {
      fetchNextCode(form.companyId)
    }
  }, [form.companyId, mode, form.projectCode, fetchNextCode])

  const set = (key, value) => setForm(current => ({ ...current, [key]: value }))

  const changeTenant = (tenantId) => {
    setForm(current => ({ ...current, tenantId, companyId: '', projectCode: '' }))
    onTenantChange?.(tenantId)
  }

  const changeCompany = (companyId) => {
    const company = companyOptions.find(item => String(valueOf(item, 'companyId')) === String(companyId))
    setForm(current => ({
      ...current,
      companyId,
      tenantId: current.tenantId || valueOf(company, 'tenantId'),
    }))
    if (companyId) {
      fetchNextCode(companyId)
    }
  }

  const submit = (event) => {
    event.preventDefault()
    const message = validate(form, showTenant)
    if (message) {
      setError(message)
      return
    }
    setError('')
    onSubmit(buildProjectPayload(form))
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-5">
      {error && (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {showTenant && (
          <Field label="Tenant">
            <select className="input w-full" value={form.tenantId} onChange={event => changeTenant(event.target.value)}>
              <option value="">Select tenant</option>
              {tenantOptions.map(option => (
                <option key={valueOf(option, 'tenantId')} value={valueOf(option, 'tenantId')}>
                  {valueOf(option, 'companyName')}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Company">
          <select className="input w-full" value={form.companyId} onChange={event => changeCompany(event.target.value)} disabled={loadingCompanies || (showTenant && !form.tenantId)}>
            <option value="">{showTenant && !form.tenantId ? 'Select tenant first' : loadingCompanies ? 'Loading companies...' : 'Select company'}</option>
            {companyOptions.map(option => (
              <option key={valueOf(option, 'companyId')} value={valueOf(option, 'companyId')}>
                {valueOf(option, 'companyName')} {valueOf(option, 'companyCode') ? `(${valueOf(option, 'companyCode')})` : ''}
              </option>
            ))}
          </select>
        </Field>

        {mode === 'edit' && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                Project Code
                <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">Registered</span>
              </span>
            </div>
            <input
              className="input w-full font-mono uppercase font-semibold text-blue-900 bg-slate-50/70 border-slate-300"
              value={form.projectCode}
              disabled
              placeholder="e.g. PRJ-26-001"
            />
            <p className="mt-1 text-[10px] text-slate-400">
              Official project code in system.
            </p>
          </div>
        )}

        <Field label="Project name">
          <input className="input w-full" value={form.projectName} onChange={event => set('projectName', event.target.value)} />
        </Field>

        <Field label="Client name (optional)">
          <input className="input w-full" value={form.clientName || ''} onChange={event => set('clientName', event.target.value)} placeholder="e.g. Internal / Corporate Clients" />
        </Field>

        <Field label="Lifecycle status">
          <select className="input w-full" value={form.status} onChange={event => set('status', event.target.value)}>
            <option value="Planned">Planned</option>
            <option value="Active">Active</option>
            <option value="On-Hold">On-Hold</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </Field>

        <Field label="Start date">
          <input className="input w-full" type="date" value={form.startDate} onChange={event => set('startDate', event.target.value)} />
        </Field>

        <Field label="Expected end date">
          <input className="input w-full" type="date" value={form.endDate} onChange={event => set('endDate', event.target.value)} />
        </Field>

        <Field label="Billing type">
          <select className="input w-full" value={form.billingType} onChange={event => set('billingType', event.target.value)}>
            <option value="Hourly">Hourly Rate (Timesheet Billed)</option>
            <option value="Fixed">Fixed Cost Engagement</option>
            <option value="NonBillable">Non-billable / Internal Cost Center</option>
          </select>
        </Field>

        <Field label="Total budget allocated">
          <div className="flex gap-2">
            <select className="input w-28" value={form.currency} onChange={event => set('currency', event.target.value)}>
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
            <input className="input flex-1" type="number" min="0" step="1000" value={form.budgetAllocated} onChange={event => set('budgetAllocated', event.target.value)} placeholder="0.00" />
          </div>
        </Field>

        <Field label="System status">
          <select className="input w-full" value={form.isActive ? 'active' : 'inactive'} onChange={event => set('isActive', event.target.value === 'active')}>
            <option value="active">Active (Available for allocation)</option>
            <option value="inactive">Archived / Inactive</option>
          </select>
        </Field>
      </div>

      {/* Operational Rules */}
      <div className="mt-5 rounded-xl border border-slate-200/90 bg-slate-50/60 p-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-3">Operational & Timesheet Rules</h4>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input type="checkbox" checked={form.allowTimesheets} onChange={e => set('allowTimesheets', e.target.checked)} className="rounded" />
            <span>Allow Timesheet Logging</span>
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input type="checkbox" checked={form.requireOvertimeApproval} onChange={e => set('requireOvertimeApproval', e.target.checked)} className="rounded" />
            <span>Overtime Approval Required</span>
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input type="checkbox" checked={form.geofencingEnabled} onChange={e => set('geofencingEnabled', e.target.checked)} className="rounded" />
            <span>Geofence Radius Check Enabled</span>
          </label>
        </div>
      </div>

      <div className="mt-4">
        <Field label="Description">
          <textarea className="input min-h-28 w-full" value={form.description} onChange={event => set('description', event.target.value)} />
        </Field>
      </div>

      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <button type="button" className="btn btn-back" onClick={onCancel} disabled={saving}>Cancel</button>
        <button type="submit" className="btn btn-save" disabled={saving}>
          {saving ? 'Saving...' : mode === 'edit' ? 'Save Project' : 'Create Project'}
        </button>
      </div>
    </form>
  )
}
