import React, { useState, useEffect } from 'react'
import api from '../../../api/axios'
import { useToast } from '../../../components/ToastProvider'
import { useAuth } from '../../../context/AuthContext'
import PageHeader from '../../../components/PageHeader'
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Save,
  RefreshCw,
  SlidersHorizontal,
  Check,
  Building2,
  Users,
  Clock,
  CalendarDays,
  CreditCard,
  Target,
  LogOut,
  FolderKanban,
  MapPin,
  UploadCloud,
  FileCheck2
} from 'lucide-react'

const ROLES_INFO = [
  {
    role: 'SuperAdmin',
    badge: 'Root Access',
    color: 'purple',
    description: 'Complete cross-tenant governance, provider settings, and master system initialization.',
    isRoot: true,
    capabilities: [
      'Multi-tenant provisioning & licensing',
      'Platform settings & database configuration',
      'Full HRMS read/write authority',
      'Role security overrides'
    ]
  },
  {
    role: 'Admin',
    badge: 'Enterprise Admin',
    color: 'blue',
    description: 'Legal company administrator with company setup, user access, and payroll sign-off.',
    capabilities: [
      'Company setup & enterprise hierarchy',
      'Employee onboarding directory & profiles',
      'User security & role permissions assignment',
      'Attendance & payroll approvals'
    ]
  },
  {
    role: 'HR Manager',
    badge: 'Human Resources',
    color: 'indigo',
    description: 'Workforce management, attendance muster rolls, leave policies, and statutory compliance.',
    capabilities: [
      'Attendance consolidation & leave approval',
      'Monthly payroll runs & payslips generation',
      'PF, ESI, TDS statutory filings',
      'Performance appraisals & offboarding'
    ]
  },
  {
    role: 'Manager',
    badge: 'Team Lead',
    color: 'emerald',
    description: 'Departmental head overseeing team attendance, leave recommendations, and project allocations.',
    capabilities: [
      'Team attendance review & overtime verification',
      'Leave application approvals for direct reports',
      'KPI appraisal scoring & performance reviews',
      'Project resource allocations'
    ]
  },
  {
    role: 'Employee',
    badge: 'Self Service',
    color: 'slate',
    description: 'Standard personnel access to profile, ESS attendance punch, leaves, and salary slips.',
    capabilities: [
      'Mobile/web attendance check-in & check-out',
      'Leave application submission & balance review',
      'Monthly payslip view and download',
      'Performance goals self-review'
    ]
  }
]

const APP_MODULES = [
  { key: 'Dashboard', label: 'Executive Dashboard', group: 'Overview', icon: FileCheck2 },
  { key: 'EmployeeMaster', label: 'Employee Master Directory', group: 'People & Workforce', icon: Users },
  { key: 'Attendance', label: 'Attendance & Time Management', group: 'People & Workforce', icon: Clock },
  { key: 'Leave', label: 'Leave & Absence Management', group: 'People & Workforce', icon: CalendarDays },
  { key: 'Payroll', label: 'Payroll & Salary Slips', group: 'People & Workforce', icon: CreditCard },
  { key: 'Performance', label: 'Performance & KPI Goals', group: 'People & Workforce', icon: Target },
  { key: 'ExitManagement', label: 'Exit & Offboarding', group: 'People & Workforce', icon: LogOut },
  { key: 'SetupCenter', label: 'Enterprise Setup Hub', group: 'Organization & Structure', icon: SlidersHorizontal },
  { key: 'Companies', label: 'Companies Master', group: 'Organization & Structure', icon: Building2 },
  { key: 'OrganizationMaster', label: 'Hierarchy & Locations', group: 'Organization & Structure', icon: MapPin },
  { key: 'Projects', label: 'Projects & Allocations', group: 'Organization & Structure', icon: FolderKanban },
  { key: 'Compliance', label: 'Statutory Compliance (PF/ESI)', group: 'Organization & Structure', icon: ShieldCheck },
  { key: 'Users', label: 'User Account Management', group: 'Administration & Security', icon: Users },
  { key: 'RoleAccess', label: 'Role Permissions & RBAC', group: 'Administration & Security', icon: ShieldAlert },
  { key: 'Import', label: 'Universal Data Import', group: 'Administration & Security', icon: UploadCloud }
]

export default function RoleAccess() {
  const showToast = useToast()
  const auth = useAuth()
  const currentRole = auth?.user?.roleName || auth?.user?.role || 'Admin'
  const isSuperAdmin = String(currentRole).toLowerCase() === 'superadmin'

  const [selectedRole, setSelectedRole] = useState('Admin')
  const [rolePermissions, setRolePermissions] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Fetch role permissions directly from Database via API
  const loadRolePermissions = async () => {
    setLoading(true)
    try {
      const resp = await api.get('/role-access')
      if (resp?.data) {
        setRolePermissions(resp.data)
      }
    } catch (err) {
      console.warn('Failed to load role permissions from DB:', err)
      showToast('Loaded system default permissions (database syncing...).', 'info', 3000)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRolePermissions()
  }, [])

  // Check if a page is granted for the selected role
  const isPageGranted = (role, pageKey) => {
    if (role === 'SuperAdmin') return true
    const pages = rolePermissions[role] || []
    if (pages.includes('*')) return true
    return pages.some(p => String(p).toLowerCase() === String(pageKey).toLowerCase())
  }

  // Toggle page permission for the selected role
  const handleTogglePage = (pageKey) => {
    if (selectedRole === 'SuperAdmin') return // SuperAdmin cannot be restricted

    const currentPages = rolePermissions[selectedRole] || []
    const lowerKey = pageKey.toLowerCase()
    const exists = currentPages.some(p => p.toLowerCase() === lowerKey)

    let updatedPages = []
    if (exists) {
      updatedPages = currentPages.filter(p => p.toLowerCase() !== lowerKey)
    } else {
      updatedPages = [...currentPages, pageKey]
    }

    setRolePermissions(prev => ({
      ...prev,
      [selectedRole]: updatedPages
    }))
  }

  // Save updated permissions to Database via PUT /api/role-access/{role}
  const handleSavePermissions = async () => {
    if (selectedRole === 'SuperAdmin') return

    setSaving(true)
    try {
      const pagesToSave = rolePermissions[selectedRole] || []
      await api.put(`/role-access/${encodeURIComponent(selectedRole)}`, {
        pages: pagesToSave
      })
      showToast(`Permissions for role "${selectedRole}" saved successfully to database!`, 'success', 3500)
      await loadRolePermissions()
    } catch (err) {
      const msg = err?.response?.data?.message || `Failed to update permissions for ${selectedRole}.`
      showToast(msg, 'error', 3500)
    } finally {
      setSaving(false)
    }
  }

  const activePages = rolePermissions[selectedRole] || []

  return (
    <div className="space-y-4 antialiased pb-12">
      {/* Header */}
      <PageHeader
        icon={ShieldAlert}
        title="Role Permissions & Access Control"
        badge="RBAC Matrix"
        badgeTone="purple"
      >
        <button
          type="button"
          onClick={loadRolePermissions}
          disabled={loading}
          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin text-purple-700' : 'text-slate-500'} />
          <span>Refresh</span>
        </button>
        {selectedRole !== 'SuperAdmin' && (
          <button
            type="button"
            onClick={handleSavePermissions}
            disabled={saving || loading}
            className="btn btn-save btn-sm text-xs py-1 px-3"
          >
            <Save size={14} /> {saving ? 'Saving...' : 'Save Permissions'}
          </button>
        )}
      </PageHeader>

      {/* Role Selection Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
        {ROLES_INFO.map((r) => {
          const isSelected = selectedRole === r.role
          return (
            <button
              key={r.role}
              type="button"
              onClick={() => setSelectedRole(r.role)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isSelected
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <span>{r.role}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                isSelected ? 'bg-purple-800 text-purple-200' : 'bg-slate-200 text-slate-600'
              }`}>
                {r.badge}
              </span>
            </button>
          )
        })}
      </div>

      {/* Permissions Grid */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-purple-700" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Assigned Modules for {selectedRole}
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            {selectedRole === 'SuperAdmin' ? 'All Modules Enabled (Root)' : `${activePages.length} of ${APP_MODULES.length} Granted`}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {APP_MODULES.map((mod) => {
            const Icon = mod.icon
            const granted = isPageGranted(selectedRole, mod.key)
            const isSuper = selectedRole === 'SuperAdmin'

            return (
              <label
                key={mod.key}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition ${
                  granted
                    ? 'border-purple-200 bg-purple-50/40 text-purple-950 font-semibold'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                } ${isSuper ? 'cursor-default' : ''}`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={granted}
                    disabled={isSuper}
                    onChange={() => handleTogglePage(mod.key)}
                    className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="flex items-center gap-2">
                    <Icon size={14} className={granted ? 'text-purple-700' : 'text-slate-400'} />
                    <span>{mod.label}</span>
                  </div>
                </div>
                {granted && (
                  <span className="shrink-0 text-emerald-600">
                    <Check size={14} />
                  </span>
                )}
              </label>
            )
          })}
        </div>

        {/* Summary Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500 gap-2">
          <span>
            Active Permissions: <strong className="text-purple-700 font-mono">{selectedRole === 'SuperAdmin' ? 'All (Wildcard *)' : `${activePages.length} of ${APP_MODULES.length} Modules`}</strong>
          </span>

          {selectedRole !== 'SuperAdmin' && (
            <span className="text-[11px] text-slate-400">
              Changes take effect immediately on next user session/refresh.
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
