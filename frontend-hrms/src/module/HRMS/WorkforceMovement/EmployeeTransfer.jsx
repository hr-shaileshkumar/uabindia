import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRightLeft,
  Plus,
  CheckCircle2,
  Clock,
  Building2,
  MapPin,
  Calendar,
  X,
  FileText,
  AlertCircle,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Download,
  Sparkles,
  Users
} from 'lucide-react'
import { getTransfers, createTransfer, approveTransfer } from '../../../api/workforceMovement'
import { usePageLayout } from '../../../hooks/usePageLayout'
import TableColumnCustomizerModal from '../../../components/TableColumnCustomizerModal'
import PageHeader from '../../../components/PageHeader'
import LayoutVersionBadge from '../../../components/LayoutVersionBadge'
import { Button } from '../../../components/ui'
import api from '../../../api/axios'

const DEFAULT_TRANSFER_COLUMNS = [
  { key: 'transferCode', header: 'Transfer Ref', alignment: 'left', width: '130px' },
  { key: 'employee', header: 'Employee', alignment: 'left' },
  { key: 'route', header: 'Departure → Destination', alignment: 'left' },
  { key: 'transferType', header: 'Transfer Type', alignment: 'left', width: '150px' },
  { key: 'effectiveDate', header: 'Effective Date', alignment: 'left', width: '130px' },
  { key: 'relocationAllowance', header: 'Relocation (₹)', alignment: 'left', width: '130px' },
  { key: 'status', header: 'Status', alignment: 'center', width: '110px' },
  { key: 'actions', header: 'Approval Action', alignment: 'right', width: '150px' }
]

function renderTransferCell(trf, col, handleApprove) {
  const key = (col.key || '').toLowerCase()
  const alignClass = `${col.alignment === 'center' ? 'text-center' : col.alignment === 'right' ? 'text-right' : 'text-left'} whitespace-nowrap`
  const trfCode = trf.TransferCode || trf.transferCode
  const empName = trf.EmployeeName || trf.employeeName
  const empCode = trf.EmployeeCode || trf.employeeCode
  const fromRoute = trf.FromLocation || trf.fromLocation || trf.FromDepartment || trf.fromDepartment || 'Current Base'
  const toRoute = trf.ToLocation || trf.toLocation || trf.ToDepartment || trf.toDepartment
  const tType = trf.TransferType || trf.transferType
  const effDate = trf.EffectiveDate || trf.effectiveDate
  const allow = trf.RelocationAllowance != null ? trf.RelocationAllowance : trf.relocationAllowance
  const status = trf.Status || trf.status
  const trfId = trf.Id || trf.id

  if (key === 'transfercode' || key === 'code' || key === 'ref') {
    return (
      <td key={col.key} className={`py-3 px-4 ${alignClass}`}>
        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
          {trfCode || '-'}
        </span>
      </td>
    )
  }

  if (key === 'employee' || key === 'employeename') {
    const initials = (empName || 'Staff').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'EM'
    return (
      <td key={col.key} className={`py-3 px-4 ${alignClass}`}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 font-bold text-white text-xs ring-2 ring-white shadow-xs">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-slate-900 text-xs truncate">{empName}</div>
          </div>
        </div>
      </td>
    )
  }

  if (key === 'route' || key === 'destination' || key === 'location') {
    return (
      <td key={col.key} className={`py-3 px-4 ${alignClass}`}>
        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
          <span>{fromRoute}</span>
          <span className="text-blue-500">→</span>
          <span className="text-blue-700">{toRoute}</span>
        </div>
      </td>
    )
  }

  if (key === 'transfertype' || key === 'type') {
    return (
      <td key={col.key} className={`py-3 px-4 text-slate-600 ${alignClass}`}>
        {tType}
      </td>
    )
  }

  if (key === 'effectivedate' || key === 'date') {
    return (
      <td key={col.key} className={`py-3 px-4 text-slate-600 ${alignClass}`}>
        {effDate ? new Date(effDate).toLocaleDateString() : 'Immediate'}
      </td>
    )
  }

  if (key === 'relocationallowance' || key === 'allowance' || key === 'amount') {
    return (
      <td key={col.key} className={`py-3 px-4 font-mono font-bold text-slate-800 ${alignClass}`}>
        ₹{Number(allow || 0).toLocaleString('en-IN')}
      </td>
    )
  }

  if (key === 'status') {
    return (
      <td key={col.key} className={`py-3 px-4 ${alignClass}`}>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
          status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}>
          {status}
        </span>
      </td>
    )
  }

  if (key === 'actions' || key === 'action' || key === 'approvalaction') {
    return (
      <td key={col.key} className={`py-3 px-4 ${alignClass}`}>
        {status === 'Pending' ? (
          <button
            onClick={() => handleApprove(trfId)}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition"
          >
            Approve & Apply
          </button>
        ) : (
          <span className="text-[11px] text-emerald-700 font-bold flex items-center justify-end gap-1">
            <CheckCircle2 size={14} /> Approved
          </span>
        )}
      </td>
    )
  }

  return (
    <td key={col.key} className={`py-3 px-4 text-slate-700 ${alignClass}`}>
      {trf[col.key] != null ? String(trf[col.key]) : '—'}
    </td>
  )
}

export default function EmployeeTransfer() {
  const [transfers, setTransfers] = useState([])
  const [employees, setEmployees] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [customizerOpen, setCustomizerOpen] = useState(false)
  const { layoutMeta, columns: layoutColumns, refreshLayout } = usePageLayout('transfers', DEFAULT_TRANSFER_COLUMNS)

  const [form, setForm] = useState({
    employeeId: '',
    fromProjectId: '',
    toProjectId: '',
    fromDepartment: '',
    toDepartment: '',
    fromLocation: '',
    toLocation: '',
    transferType: 'Inter-Project Transfer',
    effectiveDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    relocationAllowance: '',
    reason: '',
    handoverNotes: ''
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [tData, eRes, pRes] = await Promise.all([
        getTransfers(),
        api.get('/employees').catch(() => ({ data: [] })),
        api.get('/projects').catch(() => ({ data: [] }))
      ])
      setTransfers(Array.isArray(tData) ? tData : [])
      setEmployees(eRes.data || [])
      setProjects(pRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const handleContextChange = () => loadData()
    window.addEventListener('app:context-changed', handleContextChange)
    return () => window.removeEventListener('app:context-changed', handleContextChange)
  }, [])

  const showToast = (msg, isError = false) => {
    setFeedback({ msg, isError })
    setTimeout(() => setFeedback(null), 4000)
  }

  const handleEmployeeSelect = (empId) => {
    const emp = employees.find(e => e.id === empId || e.Id === empId)
    setForm(prev => ({
      ...prev,
      employeeId: empId,
      fromDepartment: emp?.department || 'Field Veterinary Operations',
      fromLocation: emp?.workLocation || 'Patna Regional Depot'
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.employeeId) {
      showToast('Please select an employee.', true)
      return
    }
    try {
      await createTransfer(form)
      showToast('Employee transfer request initiated for approval.')
      setShowForm(false)
      loadData()
    } catch (err) {
      showToast(err.response?.data?.message || 'Transfer initiation failed', true)
    }
  }

  const handleApprove = async (id) => {
    try {
      await approveTransfer(id)
      showToast('Transfer approved and employee organization master synchronized.')
      loadData()
    } catch (err) {
      showToast('Failed to approve transfer', true)
    }
  }

  const filteredTransfers = useMemo(() => {
    return transfers.filter(t => {
      const q = searchTerm.toLowerCase().trim()
      const empName = (t.EmployeeName || t.employeeName || '').toLowerCase()
      const empCode = (t.EmployeeCode || t.employeeCode || '').toLowerCase()
      const tCode = (t.TransferCode || t.transferCode || '').toLowerCase()
      const matchesSearch = !q || empName.includes(q) || empCode.includes(q) || tCode.includes(q)
      const st = t.Status || t.status || 'Pending'
      const matchesStatus = statusFilter === 'All' || st.toLowerCase() === statusFilter.toLowerCase()
      return matchesSearch && matchesStatus
    })
  }, [transfers, searchTerm, statusFilter])

  // Summary Metrics
  const totalCount = transfers.length
  const pendingCount = transfers.filter(t => (t.Status || t.status) === 'Pending').length
  const approvedCount = transfers.filter(t => (t.Status || t.status) === 'Approved').length
  const interProjectCount = transfers.filter(t => (t.TransferType || t.transferType || '').includes('Inter-Project')).length

  const handleExportCSV = () => {
    if (!filteredTransfers.length) {
      showToast('No transfer records to export', true)
      return
    }
    const headers = ['TransferRef', 'Employee', 'FromStation', 'ToStation', 'Type', 'EffectiveDate', 'RelocationAllowance', 'Status']
    const rows = filteredTransfers.map(t => [
      `"${t.TransferCode || t.transferCode || ''}"`,
      `"${t.EmployeeName || t.employeeName || ''}"`,
      `"${t.FromLocation || t.fromLocation || ''}"`,
      `"${t.ToLocation || t.toLocation || ''}"`,
      `"${t.TransferType || t.transferType || ''}"`,
      `"${t.EffectiveDate || t.effectiveDate || ''}"`,
      t.RelocationAllowance || t.relocationAllowance || 0,
      `"${t.Status || t.status || ''}"`
    ])
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Transfers_Export_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Transfer registry exported to CSV.')
  }

  return (
    <div className="space-y-4 antialiased pb-8 select-none">
      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between border shadow-2xs ${
          feedback.isError ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          <span>{feedback.msg}</span>
          <button onClick={() => setFeedback(null)} className="cursor-pointer"><X size={15} /></button>
        </div>
      )}

      {/* 1. Unified Page Header (Matching Image 3) */}
      <PageHeader
        icon={ArrowRightLeft}
        title="Employee Transfers & Deputations"
        description="Manage inter-project reallocations, branch transfers, field ambulatory rotations, and relocation allowances"
        badge={`${transfers.length} Records`}
        badgeTone="blue"
      >
        <LayoutVersionBadge entity="transfers" version={layoutMeta?.version} />

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
          onClick={() => setShowForm(!showForm)}
          icon={Plus}
        >
          {showForm ? 'Close Form' : 'Initiate Transfer'}
        </Button>
      </PageHeader>

      {/* 2. Responsive SaaS Metric Cards (Clean 4-column Grid matching Image 3) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Metric 1: Total Transfers */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span className="uppercase tracking-wider">Total Transfers</span>
            <div className="h-7 w-7 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <ArrowRightLeft size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono mt-1">
            {totalCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate">
            All relocation orders
          </div>
        </div>

        {/* Metric 2: Pending Approval */}
        <div className="bg-white rounded-2xl border border-amber-200/80 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-[11px] font-semibold text-amber-600">
            <span className="uppercase tracking-wider">Pending Approval</span>
            <div className="h-7 w-7 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-700 font-mono mt-1">
            {pendingCount}
          </div>
          <div className="text-[10px] text-amber-600 font-semibold mt-0.5 truncate">
            Awaiting executive sign-off
          </div>
        </div>

        {/* Metric 3: Approved */}
        <div className="bg-white rounded-2xl border border-emerald-200/80 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-600">
            <span className="uppercase tracking-wider">Approved</span>
            <div className="h-7 w-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 font-mono mt-1">
            {approvedCount}
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 truncate">
            Synchronized to rosters
          </div>
        </div>

        {/* Metric 4: Inter-Project */}
        <div className="bg-white rounded-2xl border border-purple-200/80 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-[11px] font-semibold text-purple-600">
            <span className="uppercase tracking-wider">Inter-Project</span>
            <div className="h-7 w-7 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Building2 size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-purple-700 font-mono mt-1">
            {interProjectCount}
          </div>
          <div className="text-[10px] text-purple-600 font-semibold mt-0.5 truncate">
            Cross-project deployment
          </div>
        </div>
      </div>

      {/* Full-Screen Content Area Form */}
      {showForm && (
        <div className="bg-white border-2 border-blue-300 rounded-2xl p-6 shadow-md transition-all">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Initiate Transfer Reassignment</h2>
              <p className="text-xs text-slate-500">Specify employee, departure and destination projects, effective date, and relocation benefits</p>
            </div>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 p-1">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Employee *</label>
              <select
                required
                value={form.employeeId}
                onChange={e => handleEmployeeSelect(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Choose Employee --</option>
                {employees.map(e => (
                  <option key={e.id || e.Id} value={e.id || e.Id}>
                    {e.code || e.EmployeeCode} • {e.name || (e.FirstName + ' ' + e.LastName)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Transfer Type</label>
              <select
                value={form.transferType}
                onChange={e => setForm({ ...form, transferType: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
              >
                <option value="Inter-Project Transfer">Inter-Project Transfer</option>
                <option value="Branch Relocation">Branch Relocation</option>
                <option value="Deputation">Deputation</option>
                <option value="Department Reassignment">Department Reassignment</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Effective Transfer Date *</label>
              <input
                type="date"
                required
                value={form.effectiveDate}
                onChange={e => setForm({ ...form, effectiveDate: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Departure Specs */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Current Departure Specs</span>
              <div>
                <label className="block text-[11px] font-medium text-slate-600">Current Department</label>
                <input
                  type="text"
                  value={form.fromDepartment}
                  onChange={e => setForm({ ...form, fromDepartment: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600">Current Base Location</label>
                <input
                  type="text"
                  value={form.fromLocation}
                  onChange={e => setForm({ ...form, fromLocation: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                />
              </div>
            </div>

            {/* Destination Specs */}
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 space-y-2 md:col-span-2">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">Proposed Destination Specs</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600">Destination Department *</label>
                  <input
                    type="text"
                    required
                    value={form.toDepartment}
                    onChange={e => setForm({ ...form, toDepartment: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600">Destination Base Location *</label>
                  <input
                    type="text"
                    required
                    value={form.toLocation}
                    onChange={e => setForm({ ...form, toLocation: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Relocation Allowance (₹)</label>
              <input
                type="number"
                value={form.relocationAllowance}
                onChange={e => setForm({ ...form, relocationAllowance: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Operational Justification / Reason</label>
              <input
                type="text"
                value={form.reason}
                onChange={e => setForm({ ...form, reason: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md"
              >
                Submit Transfer Proposal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transfers Table Container (Matching Image 3 Unified Standard) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table Filters Toolbar */}
        <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            {/* Segmented Status Tabs */}
            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              {['All', 'Pending', 'Approved'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer text-xs font-bold ${
                    statusFilter === st
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {st === 'All' ? 'All Transfers' : st}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px] max-w-sm">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Transfers by employee, code..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-purple-600 font-medium bg-slate-50/50 focus:bg-white"
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-700 text-xs font-bold transition shadow-2xs cursor-pointer"
              title="Customize visible columns"
            >
              <SlidersHorizontal size={13} className="text-purple-600" />
              <span>Customize Columns</span>
              <span className="h-4 min-w-[16px] px-1 rounded-full bg-purple-200 text-purple-800 text-[10px] flex items-center justify-center font-bold">
                {layoutColumns.length}
              </span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {layoutColumns.map(col => (
                  <th
                    key={col.key}
                    style={col.width && col.width !== 'auto' ? { width: col.width } : undefined}
                    className={`py-3 px-4 whitespace-nowrap ${col.alignment === 'center' ? 'text-center' : col.alignment === 'right' ? 'text-right' : 'text-left'}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={layoutColumns.length || 8} className="py-8 text-center text-slate-400 text-xs">
                    <RefreshCw size={22} className="mx-auto mb-2 animate-spin text-purple-600" />
                    Loading transfer records...
                  </td>
                </tr>
              ) : filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={layoutColumns.length || 8} className="py-8 text-center text-slate-400 text-xs">
                    <ArrowRightLeft size={30} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-600">No Transfer Records Found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Click 'Initiate Transfer' above to record a new relocation order.</p>
                  </td>
                </tr>
              ) : (
                filteredTransfers.map(trf => (
                  <tr key={trf.Id || trf.id} className="hover:bg-purple-50/20 transition">
                    {layoutColumns.map(col => renderTransferCell(trf, col, handleApprove))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer (Matching Image 3 Unified Standard) */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 font-medium">
          <div>
            Showing <strong className="text-slate-700">1 - {filteredTransfers.length}</strong> of <strong className="text-slate-700">{transfers.length}</strong> records
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span>Rows:</span>
              <select className="border border-slate-200 rounded px-1.5 py-0.5 text-xs font-bold bg-white outline-none cursor-pointer">
                <option value="15">15</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </div>
            <div className="flex items-center gap-1 text-slate-600 font-bold">
              <span>&lt;</span>
              <span>1/1</span>
              <span>&gt;</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table Column Customizer Modal */}
      <TableColumnCustomizerModal
        isOpen={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
        schema={{ id: 'transfers', columns: layoutColumns }}
        schemaId="transfers"
        onSaveSuccess={() => {
          if (refreshLayout) refreshLayout()
        }}
      />
    </div>
  )
}
