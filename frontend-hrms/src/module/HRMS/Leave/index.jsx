import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Filter,
  Layers,
  Plus,
  RefreshCw,
  Search,
  User,
  X,
  XCircle,
  Sparkles,
  ChevronRight,
  AlertCircle,
  CalendarDays,
  SlidersHorizontal,
} from 'lucide-react'
import {
  applyLeave,
  getLeaveApplications,
  getLeaveBalances,
  updateLeaveStatus,
} from '../../../api/leaves'
import { getMasterItems } from '../../../api/masterData'
import { usePageLayout } from '../../../hooks/usePageLayout'
import { useConfirm } from '../../../components/ConfirmProvider'
import PageHeader from '../../../components/PageHeader'
import LayoutVersionBadge from '../../../components/LayoutVersionBadge'
import { Button, Badge, Modal, Card } from '../../../components/ui'
import TableColumnCustomizerModal from '../../../components/TableColumnCustomizerModal'

const DEFAULT_LEAVE_COLUMNS = [
  { key: 'employeeName', header: 'Employee', width: 'auto', alignment: 'left' },
  { key: 'leaveTypeName', header: 'Category', width: '150px', alignment: 'left' },
  { key: 'startDate', header: 'Timeline', width: '180px', alignment: 'left' },
  { key: 'totalDays', header: 'Days', width: '90px', alignment: 'center' },
  { key: 'reason', header: 'Reason', width: '220px', alignment: 'left' },
  { key: 'status', header: 'Status', width: '120px', alignment: 'center' },
  { key: 'supervisor', header: 'Supervisor', width: '140px', alignment: 'left' },
  { key: 'actions', header: 'Actions', width: '160px', alignment: 'right' },
]

function renderLeaveCell(app, col, handleStatusChange) {
  const key = (col.key || '').toLowerCase()
  const alignClass = col.alignment === 'center' ? 'text-center' : col.alignment === 'right' ? 'text-right' : 'text-left'

  if (key === 'employeename' || key === 'employee') {
    return (
      <td key={col.key || col.columnId} className={`px-4 py-3 ${alignClass}`}>
        <div className="font-bold text-slate-900">{app.employeeName || 'Staff Member'}</div>
        {app.applicationNumber && (
          <span className="rounded-md bg-purple-50 px-1.5 py-0.2 text-[10px] font-mono font-bold text-purple-700 border border-purple-200">
            {app.applicationNumber}
          </span>
        )}
      </td>
    )
  }

  if (key === 'leavetypename' || key === 'category' || key === 'leavetype') {
    return (
      <td key={col.key || col.columnId} className={`px-4 py-3 ${alignClass}`}>
        <span className="font-bold text-slate-800">{app.leaveTypeName}</span>
        {app.leaveTypeCode && (
          <span className="text-[10px] text-slate-400 block font-mono">
            {app.leaveTypeCode}
          </span>
        )}
      </td>
    )
  }

  if (key === 'startdate' || key === 'enddate' || key === 'timeline') {
    return (
      <td key={col.key || col.columnId} className={`px-4 py-3 text-slate-600 font-mono text-[11px] ${alignClass}`}>
        {app.startDate
          ? new Date(app.startDate).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
            })
          : '-'}{' '}
        →{' '}
        {app.endDate
          ? new Date(app.endDate).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : '-'}
      </td>
    )
  }

  if (key === 'totaldays' || key === 'days') {
    return (
      <td key={col.key || col.columnId} className={`px-4 py-3 font-black text-purple-900 font-mono ${alignClass}`}>
        {app.totalDays}d
      </td>
    )
  }

  if (key === 'reason') {
    return (
      <td key={col.key || col.columnId} className={`px-4 py-3 text-slate-600 max-w-xs truncate ${alignClass}`} title={app.reason}>
        {app.reason}
      </td>
    )
  }

  if (key === 'status') {
    return (
      <td key={col.key || col.columnId} className={`px-4 py-3 ${alignClass}`}>
        <Badge
          tone={
            app.status === 'Approved'
              ? 'success'
              : app.status === 'Rejected'
              ? 'danger'
              : 'warning'
          }
          size="sm"
          dot
        >
          {app.status}
        </Badge>
      </td>
    )
  }

  if (key === 'supervisor' || key === 'approvedbyname') {
    return (
      <td key={col.key || col.columnId} className={`px-4 py-3 text-slate-500 text-[11px] ${alignClass}`}>
        {app.approvedByName || '-'}
      </td>
    )
  }

  if (key === 'actions') {
    return (
      <td key={col.key || col.columnId} className={`px-4 py-3 ${alignClass}`}>
        {app.status === 'Pending' ? (
          <div className="inline-flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleStatusChange(app, 'Approved')}
              className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-200 transition cursor-pointer"
              title="Approve Leave"
            >
              <Check size={12} />
              <span>Approve</span>
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange(app, 'Rejected')}
              className="inline-flex items-center gap-1 rounded-xl bg-rose-50 hover:bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-800 border border-rose-200 transition cursor-pointer"
              title="Reject Leave"
            >
              <X size={12} />
              <span>Reject</span>
            </button>
          </div>
        ) : (
          <span className="text-[11px] font-bold text-slate-400">Decided</span>
        )}
      </td>
    )
  }

  return (
    <td key={col.key || col.columnId} className={`px-4 py-3 ${alignClass}`}>
      {app[col.key] !== undefined && app[col.key] !== null ? String(app[col.key]) : '—'}
    </td>
  )
}

export default function Leave() {
  const confirm = useConfirm()
  const { columns: layoutColumns, version, refreshLayout } = usePageLayout('leave_management', DEFAULT_LEAVE_COLUMNS)
  const [customizerOpen, setCustomizerOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [balances, setBalances] = useState([])
  const [applications, setApplications] = useState([])
  const [leaveTypes, setLeaveTypes] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Application Form Modal state
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const [formData, setFormData] = useState({
    leaveTypeCode: '',
    leaveTypeName: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    totalDays: 1,
    reason: '',
  })

  const showToast = (msg, isError = false) => {
    setFeedback({ msg, isError })
    setTimeout(() => setFeedback(null), 4000)
  }

  // Load layout metadata, master leave types, live balances & applications
  const loadData = async () => {
    setLoading(true)
    try {
      const [bRes, aRes, ltRes, metaRes] = await Promise.all([
        getLeaveBalances().catch(() => []),
        getLeaveApplications(null, statusFilter).catch(() => []),
        getMasterItems('leave-type').catch(() => []),
        getUiLayout('leave_management').catch(() => null),
      ])

      setBalances(Array.isArray(bRes) ? bRes : [])
      setApplications(Array.isArray(aRes) ? aRes : [])

      const types = Array.isArray(ltRes) ? ltRes : []
      setLeaveTypes(types)
      if (types.length > 0 && !formData.leaveTypeCode) {
        setFormData((prev) => ({
          ...prev,
          leaveTypeCode: types[0].code || types[0].Code || 'CL',
          leaveTypeName: types[0].name || types[0].Name || 'Casual Leave',
        }))
      }

      if (metaRes) setLayoutMeta(metaRes)
    } catch (err) {
      console.error('Failed to load leave data', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [statusFilter])

  // Real-time calculation of total absence days
  const handleDateChange = (field, value) => {
    const updated = { ...formData, [field]: value }
    if (updated.startDate && updated.endDate) {
      const start = new Date(updated.startDate)
      const end = new Date(updated.endDate)
      if (end >= start) {
        const diffTime = Math.abs(end - start)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
        updated.totalDays = diffDays
      } else {
        updated.totalDays = 1
      }
    }
    setFormData(updated)
  }

  // Submit new leave application
  const handleApply = async (e) => {
    e.preventDefault()
    if (!formData.reason.trim()) {
      showToast('Please provide a reason for absence', true)
      return
    }

    setSubmitting(true)
    try {
      await applyLeave({
        leaveTypeCode: formData.leaveTypeCode,
        leaveTypeName: formData.leaveTypeName,
        startDate: formData.startDate,
        endDate: formData.endDate,
        totalDays: formData.totalDays,
        reason: formData.reason.trim(),
      })

      showToast('Leave application submitted successfully for review.')
      setShowApplyModal(false)
      setFormData({
        leaveTypeCode: leaveTypes[0]?.code || 'CL',
        leaveTypeName: leaveTypes[0]?.name || 'Casual Leave',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        totalDays: 1,
        reason: '',
      })
      await loadData()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to submit leave request.', true)
    } finally {
      setSubmitting(false)
    }
  }

  // Manager Approval or Rejection
  const handleStatusChange = async (app, newStatus) => {
    const isApproval = newStatus === 'Approved'
    const ok = await confirm({
      message: `Are you sure you want to ${isApproval ? 'approve' : 'reject'} leave application for ${
        app.employeeName || 'Staff Member'
      } (${app.totalDays} days)?`,
      confirmLabel: isApproval ? 'Approve Request' : 'Reject Request',
      tone: isApproval ? 'primary' : 'danger',
    })
    if (!ok) return

    try {
      await updateLeaveStatus(app.id, newStatus)
      showToast(`Leave application marked as ${newStatus}.`)
      await loadData()
    } catch (err) {
      showToast(err?.response?.data?.message || `Failed to update status to ${newStatus}.`, true)
    }
  }

  // Filter applications by search keyword
  const filteredApplications = useMemo(() => {
    if (!searchTerm.trim()) return applications
    const q = searchTerm.toLowerCase().trim()
    return applications.filter(
      (a) =>
        (a.employeeName || '').toLowerCase().includes(q) ||
        (a.leaveTypeName || '').toLowerCase().includes(q) ||
        (a.reason || '').toLowerCase().includes(q) ||
        (a.status || '').toLowerCase().includes(q)
    )
  }, [applications, searchTerm])

  const pendingCount = applications.filter((a) => a.status === 'Pending').length
  const approvedCount = applications.filter((a) => a.status === 'Approved').length

  return (
    <div className="w-full space-y-4 antialiased pb-10">
      {/* 1. Header with Breadcrumb & Action Controls */}
      <PageHeader
        icon={CalendarDays}
        title="Leave Management"
        description="Monitor departmental leave quotas, absence requests, and managerial approvals"
        badge={`${pendingCount} Pending`}
        badgeTone="purple"
      >
        <LayoutVersionBadge entity="leave_management" version={version} />
        <button
          type="button"
          onClick={() => setCustomizerOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-700 px-3 py-1.5 text-xs font-bold transition shadow-2xs cursor-pointer mr-1"
        >
          <SlidersHorizontal size={13} />
          <span>Customize Columns {layoutColumns.length}</span>
        </button>
        <Button
          variant="secondary"
          size="sm"
          onClick={loadData}
          disabled={loading}
          icon={RefreshCw}
          className={loading ? '[&_svg]:animate-spin' : ''}
        >
          Refresh
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowApplyModal(true)}
          icon={Plus}
        >
          Apply for Leave
        </Button>
      </PageHeader>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between border shadow-2xs animate-in fade-in duration-150 ${
            feedback.isError
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.isError ? (
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            )}
            <span>{feedback.msg}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 rounded-lg hover:bg-slate-200/50 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 2. Live Quota Cards (Responsive SaaS Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {balances.length > 0 ? (
          balances.slice(0, 3).map((b, idx) => (
            <div
              key={b.id || idx}
              className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition"
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                {b.leaveTypeName}
              </div>
              <div className="text-xl font-extrabold text-purple-800 font-mono mt-1">
                {b.availableBalance ?? b.AvailableBalance ?? 0}{' '}
                <span className="text-xs font-medium text-slate-400">days left</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                Accrued: {b.accruedDays ?? b.AccruedDays ?? 0}d • Used: {b.usedDays ?? b.UsedDays ?? 0}d
              </div>
            </div>
          ))
        ) : (
          <>
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                Casual Leave (CL)
              </div>
              <div className="text-xl font-extrabold text-purple-800 font-mono mt-1">12 Days</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Accrued as per tenure</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-emerald-200/80 bg-white shadow-2xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 truncate">
                Sick Leave (SL)
              </div>
              <div className="text-xl font-extrabold text-emerald-700 font-mono mt-1">7 Days</div>
              <div className="text-[10px] text-emerald-600 mt-0.5">Medical backup quota</div>
            </div>

            <div className="p-3.5 rounded-2xl border border-indigo-200/80 bg-white shadow-2xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 truncate">
                Privilege (EL)
              </div>
              <div className="text-xl font-extrabold text-indigo-700 font-mono mt-1">15 Days</div>
              <div className="text-[10px] text-indigo-600 mt-0.5">Annual carry-forward</div>
            </div>
          </>
        )}

        <div className="p-3.5 rounded-2xl border border-amber-200/80 bg-white shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 truncate">
            Review Pipeline
          </div>
          <div className="text-xl font-extrabold text-amber-700 font-mono mt-1">
            {pendingCount} <span className="text-xs font-medium text-slate-400">pending</span>
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 truncate">
            {approvedCount} requests approved
          </div>
        </div>
      </div>

      {/* 3. Leave Applications Register Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
        {/* Toolbar & Filters */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Leave Applications Register
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live employee absence submissions and managerial decisions
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-60">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, reason..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-purple-600 focus:outline-none shadow-2xs"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-purple-600 focus:outline-none cursor-pointer shadow-2xs"
            >
              <option value="all">All Applications</option>
              <option value="Pending">Pending Only</option>
              <option value="Approved">Approved Only</option>
              <option value="Rejected">Rejected Only</option>
            </select>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                {layoutColumns.map((col) => (
                  <th
                    key={col.key || col.columnId}
                    style={col.width && col.width !== 'auto' ? { width: col.width } : undefined}
                    className={`px-4 py-3 ${
                      col.alignment === 'center'
                        ? 'text-center'
                        : col.alignment === 'right'
                        ? 'text-right'
                        : 'text-left'
                    }`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={layoutColumns.length || 8} className="px-4 py-12 text-center text-slate-500">
                    <RefreshCw size={20} className="mx-auto mb-2 animate-spin text-purple-600" />
                    <span className="text-xs font-bold text-slate-700">Loading leave ledger...</span>
                  </td>
                </tr>
              ) : filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={layoutColumns.length || 8} className="px-4 py-12 text-center">
                    <Calendar size={32} className="mx-auto mb-2 text-slate-300" />
                    <div className="font-bold text-slate-800 text-sm">No Leave Applications Found</div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Submit a new application or clear active search filters.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-purple-50/20 transition-colors">
                    {layoutColumns.map((col) => renderLeaveCell(app, col, handleStatusChange))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Apply for Leave Responsive Modal */}
      <Modal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        title="Submit Leave of Absence Application"
        description="Apply for planned casual leave, privilege leave, or medical absence"
        maxWidth="max-w-lg"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setShowApplyModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              loading={submitting}
              onClick={handleApply}
              icon={Check}
            >
              Submit Application
            </Button>
          </>
        }
      >
        <form onSubmit={handleApply} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Leave Category <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={formData.leaveTypeCode}
              onChange={(e) => {
                const selected = leaveTypes.find(
                  (lt) => (lt.code || lt.Code) === e.target.value
                )
                setFormData({
                  ...formData,
                  leaveTypeCode: e.target.value,
                  leaveTypeName: selected?.name || selected?.Name || 'Leave',
                })
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-800 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-none transition cursor-pointer"
            >
              {leaveTypes.map((lt) => (
                <option key={lt.id || lt.code} value={lt.code || lt.Code}>
                  {lt.name || lt.Name} ({lt.code || lt.Code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                From Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-none transition cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                To Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-none transition cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Total Duration (Days)
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              required
              value={formData.totalDays}
              onChange={(e) =>
                setFormData({ ...formData, totalDays: parseFloat(e.target.value) || 1 })
              }
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-extrabold text-purple-700 font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Reason for Absence & Work Handover <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Detail the specific reason and the colleague handling urgent duties..."
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-800 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-none transition"
            />
          </div>
        </form>
      </Modal>

      {/* Table Column Customizer Modal */}
      <TableColumnCustomizerModal
        isOpen={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
        schema={{ id: 'leave_management', columns: layoutColumns }}
        schemaId="leave_management"
        onSaveSuccess={() => refreshLayout && refreshLayout()}
      />
    </div>
  )
}
