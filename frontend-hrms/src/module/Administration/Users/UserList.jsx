import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  Shield,
  ShieldCheck,
  Building2,
  Phone,
  KeyRound,
  CheckCircle2,
  XCircle,
  MoreVertical,
  X,
  Lock,
  UserCheck,
  AlertCircle,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react'
import { listUsers, createUser, updateUser, deleteUser, resetUserPassword } from '../../../api/users'
import { listCompanies } from '../../../api/companies'
import { usePageLayout } from '../../../hooks/usePageLayout'
import PageHeader from '../../../components/PageHeader'
import LayoutVersionBadge from '../../../components/LayoutVersionBadge'
import TableColumnCustomizerModal from '../../../components/TableColumnCustomizerModal'

const ALL_ROLES = [
  'SuperAdmin',
  'Admin',
  'HR Manager',
  'Operations Manager',
  'Field Officer',
  'Doctor',
  'Employee',
]

const SYSTEM_PAGES = [
  { key: 'Dashboard', label: 'Executive Dashboard' },
  { key: 'EmployeeMaster', label: 'Employee Directory' },
  { key: 'Attendance', label: 'Attendance & Timesheets' },
  { key: 'Leave', label: 'Leave & Absence' },
  { key: 'Payroll', label: 'Payroll & Compensation' },
  { key: 'Performance', label: 'Performance & KPI Goals' },
  { key: 'ExitManagement', label: 'Exit & Offboarding' },
  { key: 'SetupCenter', label: 'Enterprise Setup Hub' },
  { key: 'Companies', label: 'Companies Master' },
  { key: 'OrganizationMaster', label: 'Hierarchy & Locations' },
  { key: 'Projects', label: 'Projects & Allocations' },
  { key: 'Compliance', label: 'Statutory Compliance' },
  { key: 'Users', label: 'User Management' },
  { key: 'RoleAccess', label: 'Role Permissions & RBAC' },
  { key: 'Import', label: 'Universal Data Import' },
]

const DEFAULT_USER_COLUMNS = [
  { key: 'user', header: 'User Identity', alignment: 'left' },
  { key: 'mobile', header: 'Mobile Contact', alignment: 'left', width: '140px' },
  { key: 'role', header: 'Role Tier', alignment: 'left', width: '150px' },
  { key: 'company', header: 'Assigned Company', alignment: 'left', width: '180px' },
  { key: 'status', header: 'Status', alignment: 'left', width: '110px' },
  { key: 'createdAt', header: 'Created Date', alignment: 'left', width: '120px' },
  { key: 'actions', header: 'Actions', alignment: 'right', width: '120px' }
]

function renderUserCell(user, col, { toggleUserStatus, setSelectedUser, setNewPassword, setModalError, setResetModalOpen, getRoleBadge }) {
  const key = (col.key || '').toLowerCase()
  const alignClass = col.alignment === 'center' ? 'text-center' : col.alignment === 'right' ? 'text-right' : 'text-left'
  const initials = (user.fullName || user.userName || 'U')
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  if (key === 'user' || key === 'identity' || key === 'fullname' || key === 'name' || key === 'username') {
    return (
      <td key={col.key} className={`px-5 py-3.5 ${alignClass}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-100 to-indigo-100 text-xs font-bold text-purple-800 shadow-2xs">
            {initials}
          </div>
          <div>
            <div className="font-bold text-slate-900">{user.fullName || user.userName}</div>
            <div className="text-[11px] font-mono text-slate-400">@{user.userName}</div>
          </div>
        </div>
      </td>
    )
  }

  if (key === 'mobile' || key === 'phone' || key === 'contact') {
    return (
      <td key={col.key} className={`px-4 py-3.5 ${alignClass}`}>
        <div className="flex items-center gap-1.5 font-mono text-slate-700">
          <Phone size={13} className="text-slate-400" />
          <span>{user.mobileNumber || 'N/A'}</span>
        </div>
      </td>
    )
  }

  if (key === 'role' || key === 'roletier') {
    return (
      <td key={col.key} className={`px-4 py-3.5 ${alignClass}`}>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${getRoleBadge(user.role)}`}>
          <Shield size={11} />
          {user.role}
        </span>
      </td>
    )
  }

  if (key === 'company' || key === 'companyname') {
    return (
      <td key={col.key} className={`px-4 py-3.5 ${alignClass}`}>
        <div className="flex items-center gap-1.5 text-slate-700">
          <Building2 size={13} className="text-slate-400" />
          <span className="truncate max-w-[160px]">{user.companyName || 'Enterprise Level'}</span>
        </div>
      </td>
    )
  }

  if (key === 'status' || key === 'isactive') {
    return (
      <td key={col.key} className={`px-4 py-3.5 ${alignClass}`}>
        <button
          type="button"
          onClick={() => toggleUserStatus(user)}
          title="Click to toggle status"
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition ${
            user.isActive
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          {user.isActive ? 'Active' : 'Suspended'}
        </button>
      </td>
    )
  }

  if (key === 'createdat' || key === 'date') {
    return (
      <td key={col.key} className={`px-4 py-3.5 font-mono text-[11px] text-slate-500 ${alignClass}`}>
        {user.createdAt ? user.createdAt.substring(0, 10) : 'N/A'}
      </td>
    )
  }

  if (key === 'actions' || key === 'action') {
    return (
      <td key={col.key} className={`px-5 py-3.5 ${alignClass}`}>
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => {
              setSelectedUser(user)
              setNewPassword('')
              setModalError('')
              setResetModalOpen(true)
            }}
            title="Reset password"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-purple-700 transition"
          >
            <KeyRound size={15} />
          </button>
        </div>
      </td>
    )
  }

  return (
    <td key={col.key} className={`px-4 py-3.5 text-slate-700 ${alignClass}`}>
      {user[col.key] != null ? String(user[col.key]) : '—'}
    </td>
  )
}

export default function UserList() {
  const [users, setUsers] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const { columns: layoutColumns, version, refreshLayout } = usePageLayout('users', DEFAULT_USER_COLUMNS)
  const [customizerOpen, setCustomizerOpen] = useState(false)

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState('')

  // Create Form State
  const [form, setForm] = useState({
    userName: '',
    fullName: '',
    mobileNumber: '',
    role: 'Employee',
    companyId: '',
    password: '',
    allowedPages: ['Dashboard', 'EmployeeMaster', 'Attendance', 'Leave'],
  })

  // Reset Password State
  const [newPassword, setNewPassword] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const [uRes, cRes] = await Promise.all([
        listUsers(),
        listCompanies({ status: 'active' }).catch(() => [])
      ])
      setUsers(Array.isArray(uRes) ? uRes : [])
      setCompanies(Array.isArray(cRes) ? cRes : [])
    } catch (err) {
      console.error('Failed to load users:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchSearch =
        !searchTerm ||
        (user.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.mobileNumber || '').includes(searchTerm) ||
        (user.companyName || '').toLowerCase().includes(searchTerm.toLowerCase())

      const matchRole = roleFilter === 'ALL' || user.role === roleFilter
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && user.isActive) ||
        (statusFilter === 'INACTIVE' && !user.isActive)

      return matchSearch && matchRole && matchStatus
    })
  }, [users, searchTerm, roleFilter, statusFilter])

  // Metrics
  const metrics = useMemo(() => {
    const total = users.length
    const active = users.filter(u => u.isActive).length
    const superAdmins = users.filter(u => String(u.role).toLowerCase() === 'superadmin').length
    const fieldStaff = users.filter(u => ['field officer', 'doctor', 'operations manager'].includes(String(u.role).toLowerCase())).length
    return { total, active, superAdmins, fieldStaff }
  }, [users])

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    setModalError('')

    if (form.mobileNumber.length !== 10 || !/^\d+$/.test(form.mobileNumber)) {
      setModalError('Mobile number must be exactly 10 digits.')
      return
    }

    if (!form.password || form.password.length < 6) {
      setModalError('Password must be at least 6 characters long.')
      return
    }

    setSubmitting(true)
    try {
      await createUser({
        userName: form.userName.trim(),
        fullName: form.fullName.trim(),
        mobileNumber: form.mobileNumber.trim(),
        role: form.role,
        companyId: form.companyId || null,
        password: form.password,
        allowedPages: form.allowedPages,
      })
      setCreateModalOpen(false)
      setForm({
        userName: '',
        fullName: '',
        mobileNumber: '',
        role: 'Employee',
        companyId: '',
        password: '',
        allowedPages: ['Dashboard', 'EmployeeMaster', 'Attendance', 'Leave'],
      })
      await loadData()
    } catch (err) {
      setModalError(err?.response?.data?.message || err?.message || 'Failed to create user')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResetSubmit = async (e) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) {
      setModalError('New password must be at least 6 characters long.')
      return
    }
    setSubmitting(true)
    try {
      await resetUserPassword(selectedUser.userId, newPassword)
      setResetModalOpen(false)
      setNewPassword('')
      setSelectedUser(null)
    } catch (err) {
      setModalError(err?.response?.data?.message || 'Failed to reset password')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleUserStatus = async (user) => {
    try {
      await updateUser(user.userId, {
        fullName: user.fullName,
        mobileNumber: user.mobileNumber,
        role: user.role,
        companyId: user.companyId || null,
        isActive: !user.isActive,
        allowedPages: user.allowedPages || [],
      })
      await loadData()
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update user status')
    }
  }

  const getRoleBadge = (role) => {
    const r = String(role || '').toLowerCase()
    if (r === 'superadmin') {
      return 'bg-purple-50 text-purple-700 border-purple-200'
    }
    if (r.includes('admin') || r.includes('hr')) {
      return 'bg-blue-50 text-blue-700 border-blue-200'
    }
    if (r.includes('operation') || r.includes('manager')) {
      return 'bg-amber-50 text-amber-700 border-amber-200'
    }
    if (r.includes('payroll') || r.includes('lead') || r.includes('supervisor')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    }
    return 'bg-slate-50 text-slate-700 border-slate-200'
  }

  return (
    <div className="space-y-4 antialiased pb-8">
      <PageHeader
        icon={ShieldCheck}
        title="User Accounts & Access"
        badge={`${users.length} Users`}
        badgeTone="purple"
      >
        <LayoutVersionBadge entity="users" version={version} />
        <button
          type="button"
          onClick={() => setCustomizerOpen(true)}
          className="flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-700 px-3 py-1.5 text-xs font-bold transition shadow-2xs cursor-pointer"
        >
          <SlidersHorizontal size={13} />
          <span>Customize Columns</span>
        </button>
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin text-purple-700' : 'text-slate-500'} />
          <span>Refresh</span>
        </button>
        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="btn btn-save btn-sm text-xs py-1 px-3"
        >
          <UserPlus size={14} /> Create User
        </button>
      </PageHeader>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total System Users</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-900">{metrics.total}</div>
          <span className="mt-1 block text-[11px] text-slate-400">Registered platform accounts</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Personnel</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-emerald-700">{metrics.active}</div>
          <span className="mt-1 block text-[11px] text-slate-400">Enabled for system authentication</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Super Administrators</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-indigo-700">{metrics.superAdmins}</div>
          <span className="mt-1 block text-[11px] text-slate-400">Root governance authority</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Field Operations Staff</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <UserCheck size={18} />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-amber-700">{metrics.fieldStaff}</div>
          <span className="mt-1 block text-[11px] text-slate-400">Mobile units & field clinics</span>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, username, mobile, company..."
              className="input pl-9 w-full text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input text-xs h-9 min-w-36"
            >
              <option value="ALL">All Roles</option>
              {ALL_ROLES.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input text-xs h-9 min-w-32"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <tr>
                {layoutColumns.map(col => (
                  <th
                    key={col.key}
                    style={col.width && col.width !== 'auto' ? { width: col.width } : undefined}
                    className={`px-4 py-3.5 ${col.alignment === 'center' ? 'text-center' : col.alignment === 'right' ? 'text-right' : 'text-left'}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={layoutColumns.length || 7} className="px-4 py-12 text-center text-slate-500">
                    <RefreshCw size={22} className="mx-auto mb-2 animate-spin text-purple-600" />
                    Loading user directory...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={layoutColumns.length || 7} className="px-4 py-12 text-center text-slate-500">
                    <Users size={32} className="mx-auto mb-2 text-slate-300" />
                    <div className="font-semibold text-slate-700">No User Accounts Found</div>
                    <p className="text-xs text-slate-400 mt-1">
                      Try adjusting search filters or register a new user account.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.userId} className="hover:bg-slate-50/70 transition">
                    {layoutColumns.map(col => renderUserCell(user, col, {
                      toggleUserStatus,
                      setSelectedUser,
                      setNewPassword,
                      setModalError,
                      setResetModalOpen,
                      getRoleBadge
                    }))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE USER IN-CONTENT PANEL */}
      {createModalOpen && (
        <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-600 text-white">
                  <UserPlus size={16} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Create System User</h4>
                  <p className="text-[11px] text-slate-500">Provision portal account and authentication credentials.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {modalError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Username (Login ID) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.userName}
                    onChange={(e) => setForm(prev => ({ ...prev, userName: e.target.value }))}
                    placeholder="e.g. shailesh.hr"
                    className="input w-full text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.fullName}
                    onChange={(e) => setForm(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="e.g. Shailesh Kumar"
                    className="input w-full text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Mobile Number (10 Digits) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={form.mobileNumber}
                    onChange={(e) => setForm(prev => ({ ...prev, mobileNumber: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    placeholder="e.g. 9876543210"
                    className="input w-full text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Initial Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={form.password}
                    onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Min 6 characters"
                    className="input w-full text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Role Tier <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm(prev => ({ ...prev, role: e.target.value }))}
                    className="select w-full text-xs font-semibold"
                  >
                    {ALL_ROLES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Company Affiliation
                  </label>
                  <select
                    value={form.companyId}
                    onChange={(e) => setForm(prev => ({ ...prev, companyId: e.target.value }))}
                    className="select w-full text-xs"
                  >
                    <option value="">All Companies / Group Level</option>
                    {companies.map(c => (
                      <option key={c.companyId} value={c.companyId}>
                        {c.companyName} {c.companyCode ? `(${c.companyCode})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Page Permissions Matrix */}
              <div className="pt-2 border-t border-slate-100">
                <label className="text-xs font-semibold text-slate-800 block mb-2">
                  Assigned Module Permissions
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50/70 rounded-xl border border-slate-200">
                  {SYSTEM_PAGES.map(page => (
                    <label key={page.key} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.allowedPages.includes(page.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForm(prev => ({ ...prev, allowedPages: [...prev.allowedPages, page.key] }))
                          } else {
                            setForm(prev => ({ ...prev, allowedPages: prev.allowedPages.filter(k => k !== page.key) }))
                          }
                        }}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span>{page.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="btn btn-outline btn-sm"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary btn-sm min-w-28 shadow-xs"
                >
                  {submitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
        </div>
      )}

      {/* RESET PASSWORD IN-CONTENT PANEL */}
      {resetModalOpen && selectedUser && (
        <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500 text-white">
                  <KeyRound size={16} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Reset User Password</h4>
                  <p className="text-[11px] text-slate-500">For @{selectedUser.userName} ({selectedUser.fullName})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleResetSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="input w-full text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  className="btn btn-outline btn-sm"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary btn-sm min-w-28 shadow-xs"
                >
                  {submitting ? 'Updating...' : 'Set Password'}
                </button>
              </div>
            </form>
        </div>
      )}

      {/* Table Column Customizer Modal */}
      <TableColumnCustomizerModal
        isOpen={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
        schemaId="user_directory"
        onSaveSuccess={() => refreshLayout && refreshLayout()}
      />
    </div>
  )
}
