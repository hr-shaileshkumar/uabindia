import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../../../components/ToastProvider'
import { getMyLeaves, applyLeave } from '../../../api/selfService'
import { getLeaveBalances } from '../../../api/leaves'
import { getMasterItems } from '../../../api/masterData'
import { usePageLayout } from '../../../hooks/usePageLayout'
import LayoutVersionBadge from '../../../components/LayoutVersionBadge'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Modal } from '../../../components/ui/Modal'
import {
  CalendarDays,
  Plus,
  RefreshCw,
  Clock,
  Sparkles,
  Inbox,
  ArrowRight
} from 'lucide-react'

const DEFAULT_LEAVES_COLUMNS = [
  { key: 'leaveType', header: 'Leave Type', alignment: 'left', width: '180px' },
  { key: 'dates', header: 'Duration', alignment: 'left' },
  { key: 'days', header: 'Days', alignment: 'left', width: '90px' },
  { key: 'reason', header: 'Reason', alignment: 'left' },
  { key: 'status', header: 'Status', alignment: 'center', width: '120px' },
  { key: 'appliedDate', header: 'Applied Date', alignment: 'left', width: '120px' }
]

function renderLeaveCell(l, col) {
  const key = (col.key || '').toLowerCase()
  const alignClass = col.alignment === 'center' ? 'text-center' : col.alignment === 'right' ? 'text-right' : 'text-left'

  if (key === 'leavetype' || key === 'type') {
    return (
      <td key={col.key} className={`py-3 px-4 font-bold text-slate-900 ${alignClass}`}>
        {l.leaveType}
      </td>
    )
  }

  if (key === 'dates' || key === 'duration' || key === 'startdate') {
    return (
      <td key={col.key} className={`py-3 px-4 font-mono text-slate-600 ${alignClass}`}>
        {l.startDate} {l.startDate !== l.endDate ? `to ${l.endDate}` : ''}
      </td>
    )
  }

  if (key === 'days' || key === 'totaldays') {
    return (
      <td key={col.key} className={`py-3 px-4 font-bold text-purple-700 font-mono ${alignClass}`}>
        {l.days || l.totalDays || 1}d
      </td>
    )
  }

  if (key === 'reason' || key === 'purpose') {
    return (
      <td key={col.key} className={`py-3 px-4 text-slate-600 max-w-xs truncate ${alignClass}`} title={l.reason}>
        {l.reason || '—'}
      </td>
    )
  }

  if (key === 'status') {
    const s = String(l.status || '').toLowerCase()
    const variant = s === 'approved' ? 'success' : s === 'rejected' ? 'danger' : 'warning'
    return (
      <td key={col.key} className={`py-3 px-4 ${alignClass}`}>
        <Badge variant={variant}>{l.status || 'Pending'}</Badge>
      </td>
    )
  }

  if (key === 'applieddate' || key === 'date' || key === 'createdat') {
    return (
      <td key={col.key} className={`py-3 px-4 text-slate-400 font-mono text-[11px] ${alignClass}`}>
        {l.appliedDate || (l.createdAt ? new Date(l.createdAt).toLocaleDateString('en-IN') : '—')}
      </td>
    )
  }

  return (
    <td key={col.key} className={`py-3 px-4 text-slate-700 ${alignClass}`}>
      {l[col.key] != null ? String(l[col.key]) : '—'}
    </td>
  )
}

export default function EssLeaves() {
  const showToast = useToast()
  const [leaves, setLeaves] = useState([])
  const [balances, setBalances] = useState([])
  const [leaveTypes, setLeaveTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { layoutMeta, columns: layoutColumns } = usePageLayout('ess_leaves', DEFAULT_LEAVES_COLUMNS)

  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: ''
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [lData, bData, ltData] = await Promise.all([
        getMyLeaves().catch(() => []),
        getLeaveBalances().catch(() => []),
        getMasterItems('leave-type').catch(() => [])
      ])
      setLeaves(Array.isArray(lData) ? lData : [])
      setBalances(Array.isArray(bData) ? bData : [])
      const types = Array.isArray(ltData) ? ltData : []
      setLeaveTypes(types)
      if (types.length > 0 && !formData.leaveType) {
        setFormData(prev => ({
          ...prev,
          leaveType: types[0].name || types[0].Name || 'Casual Leave (CL)'
        }))
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to load leave records.', 'error', 3500)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleApply = async (e) => {
    e.preventDefault()
    if (!formData.reason || !formData.startDate || !formData.endDate) {
      showToast('Please provide leave dates and a valid reason.', 'warning', 3000)
      return
    }

    setSubmitting(true)
    try {
      await applyLeave(formData)
      showToast('Leave application submitted successfully.', 'success', 3000)
      setShowApplyModal(false)
      setFormData(prev => ({
        ...prev,
        reason: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      }))
      await loadData()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to apply leave.', 'error', 3500)
    } finally {
      setSubmitting(false)
    }
  }

  const pendingCount = leaves.filter(l => (l.status || '').toLowerCase() === 'pending').length
  const approvedCount = leaves.filter(l => (l.status || '').toLowerCase() === 'approved').length

  const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase()
    if (s === 'approved') return <Badge variant="success">Approved</Badge>
    if (s === 'rejected') return <Badge variant="danger">Rejected</Badge>
    return <Badge variant="warning">Pending</Badge>
  }

  return (
    <div className="space-y-4 sm:space-y-5 pb-10 select-none">
      {/* 1. Header with Breadcrumb & Metadata Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-1">
            <Link to="/module/hrms/self-service" className="hover:text-purple-700 transition">
              Self Service
            </Link>
            <span>/</span>
            <span className="text-purple-700 font-bold">Leave Ledger</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold shrink-0">
              <CalendarDays size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  My Leave Ledger & Quota
                </h1>
                <LayoutVersionBadge entity="ess_leaves" version={layoutMeta?.version} className="hidden sm:inline-flex" />
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                View balance quotas, request time-off, and track approvals in real time.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={loadData}
            title="Refresh Table"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-purple-700' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowApplyModal(true)}
          >
            <Plus size={14} />
            <span>Apply Leave</span>
          </Button>
        </div>
      </div>

      {/* 2. Leave Balance Quota Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {balances.length > 0 ? (
          balances.slice(0, 3).map((b, idx) => (
            <div
              key={b.id || idx}
              className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-purple-300 transition"
            >
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
                {b.leaveTypeName || 'Leave Balance'}
              </div>
              <div className="text-2xl font-black text-purple-700 font-mono mt-1">
                {b.availableBalance ?? b.AvailableBalance ?? 0}
                <span className="text-xs font-semibold text-slate-400 ml-1">days</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-medium border-t border-slate-100 pt-1.5 truncate">
                Accrued: {b.accruedDays ?? b.AccruedDays ?? 0}d • Used: {b.usedDays ?? b.UsedDays ?? 0}d
              </div>
            </div>
          ))
        ) : (
          <>
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Casual Leave (CL)</div>
              <div className="text-2xl font-black text-purple-700 font-mono mt-1">12 <span className="text-xs text-slate-400 font-semibold">days</span></div>
              <div className="text-[10px] text-slate-500 mt-1 border-t border-slate-100 pt-1.5">Annual privilege quota</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Sick Leave (SL)</div>
              <div className="text-2xl font-black text-emerald-700 font-mono mt-1">10 <span className="text-xs text-slate-400 font-semibold">days</span></div>
              <div className="text-[10px] text-slate-500 mt-1 border-t border-slate-100 pt-1.5">Medical contingent quota</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Earned Leave (EL)</div>
              <div className="text-2xl font-black text-blue-700 font-mono mt-1">15 <span className="text-xs text-slate-400 font-semibold">days</span></div>
              <div className="text-[10px] text-slate-500 mt-1 border-t border-slate-100 pt-1.5">Accumulated privilege</div>
            </div>
          </>
        )}

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pending Requests</div>
          <div className="text-2xl font-black text-amber-600 font-mono mt-1">{pendingCount}</div>
          <div className="text-[10px] text-amber-700 font-semibold mt-1 border-t border-slate-100 pt-1.5 truncate">
            {pendingCount > 0 ? 'Under manager review' : 'All decisions cleared'}
          </div>
        </div>
      </div>

      {/* 3. Leave Requests: Metadata-Driven Table + Mobile Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900">Application History</h2>
            <Badge variant="purple">{leaves.length}</Badge>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">Approved: {approvedCount} • Pending: {pendingCount}</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <RefreshCw size={20} className="mx-auto mb-2 animate-spin text-purple-700" />
            <p className="text-xs font-medium">Loading leave ledger...</p>
          </div>
        ) : leaves.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="h-10 w-10 mx-auto rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
              <Inbox size={20} />
            </div>
            <div className="text-sm font-bold text-slate-800">No leave requests yet</div>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              When you submit a leave application, it will appear here with live tracking.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowApplyModal(true)}
              className="mt-3"
            >
              <Plus size={14} />
              <span>Apply for First Leave</span>
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop Table View (>= 640px) with Metadata Column Customization */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    {layoutColumns.map((col) => (
                      <th
                        key={col.key}
                        style={{ width: col.width || 'auto' }}
                        className={`py-2.5 px-4 ${col.alignment === 'center' ? 'text-center' : col.alignment === 'right' ? 'text-right' : 'text-left'}`}
                      >
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {leaves.map((l, idx) => (
                    <tr key={l.id || idx} className="hover:bg-slate-50/80 transition">
                      {layoutColumns.map((col) => renderLeaveCell(l, col))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List (< 640px) */}
            <div className="sm:hidden divide-y divide-slate-100">
              {leaves.map((l, idx) => (
                <div key={l.id || idx} className="p-3.5 space-y-2 hover:bg-slate-50/60 transition">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 text-xs">{l.leaveType}</span>
                    {getStatusBadge(l.status)}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-mono text-[11px]">
                      {l.startDate} {l.startDate !== l.endDate ? `→ ${l.endDate}` : ''}
                    </span>
                    <span className="font-bold text-purple-700 font-mono">{l.days || 1} day(s)</span>
                  </div>
                  {l.reason && (
                    <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg line-clamp-2">
                      {l.reason}
                    </p>
                  )}
                  {l.appliedDate && (
                    <div className="text-[10px] text-slate-400 font-mono pt-1">
                      Applied: {l.appliedDate}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 4. Responsive Modal / Bottom Sheet for Applying Leave */}
      <Modal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        title="Apply for Leave of Absence"
        description="Submit planned or medical leave for reporting manager approval"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleApply} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Leave Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.leaveType}
              onChange={e => setFormData({ ...formData, leaveType: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-purple-600 font-semibold"
            >
              {leaveTypes.length > 0 ? (
                leaveTypes.map(t => (
                  <option key={t.id || t.code || t.Code} value={t.name || t.Name}>
                    {t.name || t.Name} ({t.code || t.Code})
                  </option>
                ))
              ) : (
                <>
                  <option value="Casual Leave (CL)">Casual Leave (CL)</option>
                  <option value="Sick Leave (SL)">Sick Leave (SL)</option>
                  <option value="Earned Leave (EL)">Earned Leave (EL)</option>
                  <option value="Compensatory Off">Compensatory Off</option>
                </>
              )}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                From Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-purple-600 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                To Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-purple-600 font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Reason for Absence <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={formData.reason}
              onChange={e => setFormData({ ...formData, reason: e.target.value })}
              placeholder="State clear purpose of leave..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-purple-600 font-medium"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowApplyModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submitting}
            >
              Submit Application
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
