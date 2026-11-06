import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  Building,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Filter,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserCheck,
  UserX,
  X,
  Check,
  Sparkles,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  approveResignation,
  getClearances,
  getFinalSettlement,
  getResignations,
  relieveEmployee,
  submitResignation,
  updateClearance,
} from '../../../api/exitManagement'
import { listEmployees } from '../../../api/employees'
import { usePageLayout } from '../../../hooks/usePageLayout'
import { useConfirm } from '../../../components/ConfirmProvider'
import TableColumnCustomizerModal from '../../../components/TableColumnCustomizerModal'
import PageHeader from '../../../components/PageHeader'
import LayoutVersionBadge from '../../../components/LayoutVersionBadge'
import { Button } from '../../../components/ui'

const DEFAULT_EXIT_COLUMNS = [
  { key: 'employee', header: 'Employee', width: 'auto', alignment: 'left' },
  { key: 'department', header: 'Department', width: '150px', alignment: 'left' },
  { key: 'resignationDate', header: 'Resignation Date', width: '150px', alignment: 'left' },
  { key: 'noticePeriodDays', header: 'Notice Period', width: '130px', alignment: 'left' },
  { key: 'requestedRelievingDate', header: 'Target Relieving', width: '150px', alignment: 'left' },
  { key: 'status', header: 'Status', width: '120px', alignment: 'left' },
  { key: 'actions', header: 'Actions', width: '220px', alignment: 'right' },
]

function renderExitCell(r, col, { handleApprove, handleOpenClearances, handleOpenSettlement }) {
  const key = (col.key || '').toLowerCase()
  const alignClass = `${col.alignment === 'center' ? 'text-center' : col.alignment === 'right' ? 'text-right' : 'text-left'} whitespace-nowrap`

  if (key === 'code' || key === 'employeecode') {
    return (
      <td key={col.key || col.columnId} className={`px-4 py-3 ${alignClass}`}>
        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">
          {r.employeeCode || '-'}
        </span>
      </td>
    )
  }

  if (key === 'employee' || key === 'name' || key === 'employeename') {
    const initials = (r.employeeName || 'EM')
      .split(' ')
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase()
    return (
      <td key={col.key || col.columnId} className={`px-4 py-3 ${alignClass}`}>
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-rose-600 to-pink-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
            {initials}
          </div>
          <span className="font-bold text-slate-900">{r.employeeName}</span>
        </div>
      </td>
    )
  }

  if (key === 'department' || key === 'departmentname') {
    return (
      <td key={col.key || col.columnId} className={`px-4 py-3 font-semibold text-slate-700 ${alignClass}`}>
        {r.departmentName || 'Operations'}
      </td>
    )
  }

  if (key === 'resignationdate') {
    return (
      <td key={col.key || col.columnId} className={`px-4 py-3 text-slate-600 font-mono text-[11px] ${alignClass}`}>
        {r.resignationDate ? new Date(r.resignationDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
      </td>
    )
  }

  if (key === 'noticeperioddays' || key === 'noticeperiod') {
    return (
      <td key={col.key || col.columnId} className={`px-4 py-3 font-bold text-slate-800 ${alignClass}`}>
        {r.noticePeriodDays} days
      </td>
    )
  }

  if (key === 'requestedrelievingdate' || key === 'targetrelieving') {
    return (
      <td key={col.key || col.columnId} className={`px-4 py-3 text-slate-600 font-mono text-[11px] ${alignClass}`}>
        {r.requestedRelievingDate ? new Date(r.requestedRelievingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
      </td>
    )
  }

  if (key === 'status') {
    return (
      <td key={col.key || col.columnId} className={`px-4 py-3 ${alignClass}`}>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
          r.status === 'Relieved'
            ? 'bg-slate-100 text-slate-700 border-slate-300'
            : r.status === 'Approved'
            ? 'bg-blue-50 text-blue-700 border-blue-200'
            : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          {r.status === 'Relieved' ? <CheckCircle2 size={11} /> : <Clock size={11} />}
          <span>{r.status}</span>
        </span>
      </td>
    )
  }

  if (key === 'actions') {
    return (
      <td key={col.key || col.columnId} className={`px-4 py-3 text-right`}>
        <div className="inline-flex items-center gap-1.5">
          {r.status === 'Submitted' && (
            <button
              type="button"
              onClick={() => handleApprove(r)}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200 transition cursor-pointer"
            >
              Approve
            </button>
          )}
          <button
            type="button"
            onClick={() => handleOpenClearances(r)}
            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] border border-blue-200 transition cursor-pointer"
          >
            Clearances
          </button>
          <button
            type="button"
            onClick={() => handleOpenSettlement(r)}
            className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[11px] border border-purple-200 transition cursor-pointer"
          >
            FnF Settlement
          </button>
        </div>
      </td>
    )
  }

  return (
    <td key={col.key || col.columnId} className={`px-4 py-3 ${alignClass}`}>
      {r[col.key] !== undefined && r[col.key] !== null ? String(r[col.key]) : '—'}
    </td>
  )
}

export default function ExitManagement() {
  const confirm = useConfirm()
  const { columns: layoutColumns, version, refreshLayout } = usePageLayout('exit_management', DEFAULT_EXIT_COLUMNS)
  const [customizerOpen, setCustomizerOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resignations, setResignations] = useState([])
  const [employees, setEmployees] = useState([])
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [feedback, setFeedback] = useState(null)

  // In-Content Full-Screen Workflows (Zero Floating Modals!)
  const [showNewForm, setShowNewForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    employeeId: '',
    noticePeriodDays: 30,
    requestedRelievingDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    reason: 'Better Opportunity',
    remarks: '',
  })

  // Clearances In-Content Panel
  const [activeClearanceResignation, setActiveClearanceResignation] = useState(null)
  const [clearances, setClearances] = useState([])
  const [clearanceLoading, setClearanceLoading] = useState(false)

  // Settlement In-Content Panel
  const [activeSettlementResignation, setActiveSettlementResignation] = useState(null)
  const [settlementData, setSettlementData] = useState(null)
  const [settlementLoading, setSettlementLoading] = useState(false)
  const [relievingInProgress, setRelievingInProgress] = useState(false)

  const showToast = (msg, isError = false) => {
    setFeedback({ msg, isError })
    setTimeout(() => setFeedback(null), 4000)
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [rData, eData] = await Promise.all([
        getResignations(statusFilter !== 'ALL' ? { status: statusFilter } : {}).catch(() => []),
        listEmployees().catch(() => []),
      ])
      setResignations(Array.isArray(rData) ? rData : [])
      const empList = Array.isArray(eData) ? eData : []
      setEmployees(empList)
      if (empList.length > 0 && !formData.employeeId) {
        setFormData(prev => ({ ...prev, employeeId: empList[0].id || empList[0].employeeId }))
      }
    } catch (err) {
      console.error('Failed to load exit data', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [statusFilter])

  const handleSubmitResignation = async (e) => {
    e.preventDefault()
    if (!formData.employeeId) {
      showToast('Please select the resigning employee.', true)
      return
    }

    setSubmitting(true)
    try {
      const selectedEmp = employees.find(emp => (emp.id || emp.employeeId) == formData.employeeId)
      await submitResignation({
        employeeId: Number(formData.employeeId) || formData.employeeId,
        employeeName: selectedEmp ? (selectedEmp.name || selectedEmp.fullName || selectedEmp.employeeName) : 'Staff Member',
        departmentName: selectedEmp ? (selectedEmp.department || selectedEmp.departmentName) : 'Operations',
        noticePeriodDays: Number(formData.noticePeriodDays) || 30,
        requestedRelievingDate: formData.requestedRelievingDate,
        reason: formData.reason,
        remarks: formData.remarks.trim() || undefined,
      })
      showToast('Resignation submitted successfully.')
      setShowNewForm(false)
      setFormData(prev => ({ ...prev, remarks: '' }))
      await loadData()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to submit resignation', true)
    } finally {
      setSubmitting(false)
    }
  }

  const handleApprove = async (resignation) => {
    const ok = await confirm({
      message: `Approve resignation for "${resignation.employeeName}" and initiate departmental clearance workflows?`,
      confirmLabel: 'Approve Resignation',
      tone: 'primary',
    })
    if (!ok) return

    try {
      await approveResignation(resignation.id, {
        approvedRelievingDate: resignation.requestedRelievingDate,
        approverRemarks: 'Approved as per contractual notice agreement',
      })
      showToast('Resignation approved. Departmental clearances initiated.')
      await loadData()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to approve resignation', true)
    }
  }

  const handleOpenClearances = async (resignation) => {
    setActiveSettlementResignation(null)
    setActiveClearanceResignation(resignation)
    setClearanceLoading(true)
    try {
      const data = await getClearances(resignation.id)
      setClearances(Array.isArray(data) ? data : [])
    } catch {
      setClearances([])
    } finally {
      setClearanceLoading(false)
    }
  }

  const handleUpdateClearanceStatus = async (clearanceId, status) => {
    try {
      await updateClearance(clearanceId, {
        status,
        remarks: `Updated to ${status} by Department Authority`,
      })
      showToast(`Clearance item marked as ${status}.`)
      const updated = await getClearances(activeClearanceResignation.id)
      setClearances(Array.isArray(updated) ? updated : [])
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to update clearance', true)
    }
  }

  const handleOpenSettlement = async (resignation) => {
    setActiveClearanceResignation(null)
    setActiveSettlementResignation(resignation)
    setSettlementLoading(true)
    try {
      const data = await getFinalSettlement(resignation.id)
      setSettlementData(data)
    } catch {
      setSettlementData(null)
    } finally {
      setSettlementLoading(false)
    }
  }

  const handleRelieve = async () => {
    if (!activeSettlementResignation) return
    const ok = await confirm({
      message: `Formally relieve "${activeSettlementResignation.employeeName}" and close workforce employment profile?`,
      confirmLabel: 'Confirm Relieving & Close',
      tone: 'danger',
    })
    if (!ok) return

    setRelievingInProgress(true)
    try {
      await relieveEmployee(activeSettlementResignation.id)
      showToast(`Employee ${activeSettlementResignation.employeeName} relieved. Service letter issued.`)
      setActiveSettlementResignation(null)
      await loadData()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to relieve employee', true)
    } finally {
      setRelievingInProgress(false)
    }
  }

  const [page, setPage] = useState(1)
  const pageSize = 15

  const filteredResignations = useMemo(() => {
    return resignations.filter((r) => {
      const q = searchTerm.toLowerCase().trim()
      const matchesSearch =
        !q ||
        (r.employeeName || '').toLowerCase().includes(q) ||
        (r.employeeCode || '').toLowerCase().includes(q) ||
        (r.departmentName || '').toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [resignations, searchTerm, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredResignations.length / pageSize))
  const paginatedResignations = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredResignations.slice(start, start + pageSize)
  }, [filteredResignations, page, pageSize])

  const handleExportCSV = () => {
    if (!filteredResignations.length) {
      showToast('No separation records to export', true)
      return
    }
    const headers = ['EmployeeCode', 'EmployeeName', 'Department', 'ResignationDate', 'NoticePeriodDays', 'TargetRelievingDate', 'Status']
    const rows = filteredResignations.map((r) => [
      `"${r.employeeCode || ''}"`,
      `"${r.employeeName || ''}"`,
      `"${r.departmentName || ''}"`,
      `"${r.resignationDate || ''}"`,
      r.noticePeriodDays || 0,
      `"${r.requestedRelievingDate || ''}"`,
      `"${r.status || ''}"`,
    ])
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Separations_Export_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Separation registry exported to CSV.')
  }

  return (
    <div className="w-full space-y-4 antialiased pb-10 select-none">
      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border shadow-sm ${
          feedback.isError ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{feedback.msg}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="cursor-pointer"><X size={15} /></button>
        </div>
      )}

      {/* 1. Unified Page Header (Matching Image 3) */}
      <PageHeader
        icon={UserX}
        title="Offboarding, No-Dues Clearances & FnF Settlements"
        description="Manage resignation requests, notice period enforcement, IT/Finance/Admin no-dues clearance checklists, and computerized full & final settlements"
        badge={`${resignations.length} Exit Cases`}
        badgeTone="rose"
      >
        <LayoutVersionBadge entity="exit_management" version={version} />

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
          onClick={() => setShowNewForm(!showNewForm)}
          icon={Plus}
        >
          {showNewForm ? 'Close Form' : 'Initiate Resignation'}
        </Button>
      </PageHeader>

      {/* 2. Responsive SaaS Metric Cards (Clean 4-column Grid matching Image 3) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span className="uppercase tracking-wider">Total Exit Cases</span>
            <div className="h-7 w-7 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <UserX size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono mt-1">
            {resignations.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate">
            Offboarding records
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl border border-amber-200/80 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-[11px] font-semibold text-amber-600">
            <span className="uppercase tracking-wider">Pending Approvals</span>
            <div className="h-7 w-7 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-700 font-mono mt-1">
            {resignations.filter((r) => r.status === 'Submitted').length}
          </div>
          <div className="text-[10px] text-amber-600 font-semibold mt-0.5 truncate">
            Awaiting supervisor review
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl border border-blue-200/80 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-[11px] font-semibold text-blue-600">
            <span className="uppercase tracking-wider">In Clearance Stage</span>
            <div className="h-7 w-7 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <ShieldCheck size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-blue-700 font-mono mt-1">
            {resignations.filter((r) => r.status === 'Approved').length}
          </div>
          <div className="text-[10px] text-blue-600 font-semibold mt-0.5 truncate">
            Asset / FnF handover
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl border border-emerald-200/80 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-600">
            <span className="uppercase tracking-wider">Formally Relieved</span>
            <div className="h-7 w-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 font-mono mt-1">
            {resignations.filter((r) => r.status === 'Relieved').length}
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 truncate">
            Final service letters issued
          </div>
        </div>
      </div>

      {/* IN-CONTENT FULL-SCREEN RESIGNATION CREATION FORM (ZERO FLOATING MODALS!) */}
      {showNewForm && (
        <div className="bg-white rounded-2xl border-2 border-rose-400 p-6 shadow-xl transition-all">
          <div className="flex items-center justify-between pb-4 border-b border-rose-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-600 animate-pulse" />
                <span>Submit Employee Separation & Resignation Request</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Register employee notice period, handover schedule, and target relieving date
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowNewForm(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmitResignation} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Resigning Employee <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id || emp.employeeId} value={emp.id || emp.employeeId}>
                      {emp.name || emp.fullName || emp.employeeName} ({emp.code || emp.employeeCode || 'EMP'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notice Period (Days) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="180"
                  required
                  value={formData.noticePeriodDays}
                  onChange={(e) => setFormData({ ...formData, noticePeriodDays: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Requested Relieving Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.requestedRelievingDate}
                  onChange={(e) => setFormData({ ...formData, requestedRelievingDate: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Separation Reason <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
                >
                  <option value="Better Opportunity">Better Opportunity / Career Growth</option>
                  <option value="Higher Studies">Higher Studies / Certification</option>
                  <option value="Relocation">Geographical Relocation</option>
                  <option value="Personal / Health">Personal / Medical Reasons</option>
                  <option value="Compensation">Compensation Revision</option>
                  <option value="Retirement">Superannuation / Retirement</option>
                </select>
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Handover Notes & Documentation Plan
                </label>
                <textarea
                  rows={2}
                  placeholder="Detail assigned projects, hardware/laptop return schedule, and operational handover arrangements..."
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowNewForm(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {submitting ? 'Submitting...' : 'Commit Resignation'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* IN-CONTENT CLEARANCES WORKFLOW PANEL (REPLACING FLOATING MODAL!) */}
      {activeClearanceResignation && (
        <div className="rounded-2xl border-2 border-blue-400 bg-white p-5 shadow-lg transition-all space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-blue-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-800">
                  {activeClearanceResignation.employeeCode || 'EMP-1962'}
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Multi-Department No-Dues Clearances: {activeClearanceResignation.employeeName}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify asset surrender, IT credential revoke, library books, and financial clearance before relieving
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveClearanceResignation(null)}
              className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 transition cursor-pointer self-start sm:self-auto"
            >
              <X size={16} />
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">Clearance Department</th>
                  <th className="px-4 py-2.5">Approving Officer</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Remarks / Handover Asset</th>
                  <th className="px-4 py-2.5 text-right">Update Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {clearanceLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      <RefreshCw size={18} className="mx-auto mb-2 animate-spin text-blue-600" />
                      Loading clearance status...
                    </td>
                  </tr>
                ) : clearances.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      No clearance checklists registered for this case.
                    </td>
                  </tr>
                ) : (
                  clearances.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-2.5 font-bold text-slate-900">
                        {c.department || c.clearanceType || 'Department Clear'}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">
                        {c.clearedBy || 'Assigned Lead'}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                          c.status === 'Approved' || c.status === 'Cleared'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {c.status === 'Approved' || c.status === 'Cleared' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                          <span>{c.status || 'Pending'}</span>
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 text-[11px]">
                        {c.remarks || 'No outstanding liabilities.'}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {c.status !== 'Approved' && c.status !== 'Cleared' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateClearanceStatus(c.id, 'Approved')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200 transition cursor-pointer"
                          >
                            <Check size={11} />
                            <span>Mark Cleared</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* IN-CONTENT FULL & FINAL SETTLEMENT (FNF) PANEL (REPLACING FLOATING MODAL!) */}
      {activeSettlementResignation && (
        <div className="rounded-2xl border-2 border-emerald-400 bg-white p-5 shadow-lg transition-all space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-emerald-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                  FnF Settlement
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Full & Final Account Statement: {activeSettlementResignation.employeeName}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Computed gratuity, encashed leave balance, notice recovery, and net payable disbursement
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveSettlementResignation(null)}
              className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 transition cursor-pointer self-start sm:self-auto"
            >
              <X size={16} />
            </button>
          </div>

          {settlementLoading ? (
            <div className="py-8 text-center text-slate-500">
              <RefreshCw size={20} className="mx-auto mb-2 animate-spin text-emerald-600" />
              <span>Calculating FnF statement...</span>
            </div>
          ) : settlementData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Payables */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-3.5 space-y-2">
                  <div className="font-bold text-emerald-900 border-b border-emerald-100 pb-1 flex justify-between">
                    <span>Payable Components</span>
                    <span>Amount (₹)</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Unpaid Salary ({settlementData.unpaidDays || 0} days)</span>
                    <span className="font-mono font-semibold">₹{Number(settlementData.unpaidSalary || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Leave Encashment</span>
                    <span className="font-mono font-semibold">₹{Number(settlementData.leaveEncashment || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Gratuity Benefit</span>
                    <span className="font-mono font-semibold">₹{Number(settlementData.gratuity || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Deductions */}
                <div className="rounded-xl border border-rose-200 bg-rose-50/30 p-3.5 space-y-2">
                  <div className="font-bold text-rose-900 border-b border-rose-100 pb-1 flex justify-between">
                    <span>Recoveries & Deductions</span>
                    <span>Amount (₹)</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Notice Shortfall Recovery</span>
                    <span className="font-mono font-semibold">₹{Number(settlementData.noticeRecovery || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Asset / Loan Deductions</span>
                    <span className="font-mono font-semibold">₹{Number(settlementData.otherDeductions || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Net Payable Banner & Relieve Action */}
              <div className="rounded-xl bg-slate-900 text-white p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">Final Net Disbursable Balance</span>
                  <span className="text-2xl font-black font-mono text-emerald-400">
                    ₹{Number(settlementData.netPayable || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                {activeSettlementResignation.status !== 'Relieved' && (
                  <button
                    type="button"
                    onClick={handleRelieve}
                    disabled={relievingInProgress}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition cursor-pointer"
                  >
                    <CheckCircle2 size={14} />
                    <span>{relievingInProgress ? 'Relieving...' : 'Complete Relieving & Issue Letter'}</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-slate-400 text-xs">
              No FnF data computed yet for this resignation.
            </div>
          )}
        </div>
      )}

      {/* 3. Main Resignations Registry Table Card (Matching Image 3 Unified Standard) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table Filters Toolbar */}
        <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            {/* Segmented Status Tabs */}
            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              {[
                { id: 'ALL', label: 'All Exits' },
                { id: 'Submitted', label: 'Submitted' },
                { id: 'Approved', label: 'In Clearance' },
                { id: 'Relieved', label: 'Relieved' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setStatusFilter(tab.id)
                    setPage(1)
                  }}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer text-xs font-bold ${
                    statusFilter === tab.id
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px] max-w-sm">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff, code, dept..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPage(1)
                }}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-rose-600 font-medium bg-slate-50/50 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer"
              title="Export filtered records to CSV"
            >
              <Download size={13} className="text-slate-500" />
              <span>Export</span>
            </button>

            <button
              type="button"
              onClick={() => setCustomizerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50/80 hover:bg-rose-100 text-rose-700 text-xs font-bold transition shadow-2xs cursor-pointer"
              title="Customize Table Columns"
            >
              <SlidersHorizontal size={13} className="text-rose-600" />
              <span>Customize Columns</span>
              <span className="ml-0.5 rounded-full bg-rose-600 px-1.5 py-0.2 text-[10px] font-extrabold text-white">
                {layoutColumns.length}
              </span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                {layoutColumns.map((col) => (
                  <th
                    key={col.key || col.columnId}
                    className={`px-4 py-3 whitespace-nowrap ${col.alignment === 'center' ? 'text-center' : col.alignment === 'right' ? 'text-right' : 'text-left'}`}
                    style={{ width: col.width || 'auto' }}
                  >
                    {col.header || col.name || col.label || col.key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={layoutColumns.length || 7} className="px-4 py-12 text-center text-slate-500">
                    <RefreshCw size={22} className="mx-auto mb-2 animate-spin text-rose-600" />
                    <span>Loading separation registry...</span>
                  </td>
                </tr>
              ) : filteredResignations.length === 0 ? (
                <tr>
                  <td colSpan={layoutColumns.length || 7} className="px-4 py-12 text-center">
                    <UserX size={36} className="mx-auto mb-2 text-slate-300" />
                    <div className="font-bold text-slate-700">No Resignation Cases Found</div>
                    <p className="text-xs text-slate-400 mt-1">Click "Initiate Resignation" above to record a new separation.</p>
                  </td>
                </tr>
              ) : (
                paginatedResignations.map((r) => (
                  <tr key={r.id} className="hover:bg-rose-50/30 transition">
                    {layoutColumns.map((col) =>
                      renderExitCell(r, col, {
                        handleApprove,
                        handleOpenClearances,
                        handleOpenSettlement,
                      })
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer (Matching Image 3 Standard) */}
        <div className="p-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-medium">
          <div>
            Showing <span className="font-bold text-slate-800">{filteredResignations.length === 0 ? 0 : (page - 1) * pageSize + 1}</span> - <span className="font-bold text-slate-800">{Math.min(page * pageSize, filteredResignations.length)}</span> of <span className="font-bold text-slate-800">{filteredResignations.length}</span> records
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Rows: {pageSize}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-2 font-mono font-bold text-slate-700">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table Column Customizer Modal */}
      <TableColumnCustomizerModal
        isOpen={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
        schema={{ id: 'exit_management', columns: layoutColumns }}
        schemaId="exit_management"
        onSaveSuccess={() => {
          if (refreshLayout) refreshLayout()
        }}
      />
    </div>
  )
}
