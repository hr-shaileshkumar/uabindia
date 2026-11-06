import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp,
  Plus,
  CheckCircle2,
  Award,
  X,
  FileCheck,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Download,
  Sparkles,
  Clock,
  ArrowUpRight
} from 'lucide-react'
import { getPromotions, createPromotion, approvePromotion } from '../../../api/workforceMovement'
import { usePageLayout } from '../../../hooks/usePageLayout'
import TableColumnCustomizerModal from '../../../components/TableColumnCustomizerModal'
import PageHeader from '../../../components/PageHeader'
import LayoutVersionBadge from '../../../components/LayoutVersionBadge'
import { Button } from '../../../components/ui'
import api from '../../../api/axios'

const DEFAULT_PROMOTION_COLUMNS = [
  { key: 'promotionCode', header: 'Promotion Ref', alignment: 'left', width: '130px' },
  { key: 'employee', header: 'Employee Profile', alignment: 'left' },
  { key: 'roleProgression', header: 'Role Progression', alignment: 'left' },
  { key: 'compensationRevision', header: 'Compensation Revision', alignment: 'left' },
  { key: 'hikePercentage', header: 'Hike %', alignment: 'center', width: '90px' },
  { key: 'effectiveDate', header: 'Effective Date', alignment: 'left', width: '130px' },
  { key: 'status', header: 'Status', alignment: 'center', width: '110px' },
  { key: 'actions', header: 'Approval Action', alignment: 'right', width: '150px' }
]

function renderPromotionCell(prm, col, handleApprove) {
  const key = (col.key || '').toLowerCase()
  const alignClass = `${col.alignment === 'center' ? 'text-center' : col.alignment === 'right' ? 'text-right' : 'text-left'} whitespace-nowrap`
  const pCode = prm.PromotionCode || prm.promotionCode
  const empName = prm.EmployeeName || prm.employeeName
  const empCode = prm.EmployeeCode || prm.employeeCode
  const curDesig = prm.CurrentDesignation || prm.currentDesignation
  const propDesig = prm.ProposedDesignation || prm.proposedDesignation
  const curCtc = prm.CurrentCtc != null ? prm.CurrentCtc : prm.currentCtc
  const propCtc = prm.ProposedCtc != null ? prm.ProposedCtc : prm.proposedCtc
  const hike = prm.HikePercentage != null ? prm.HikePercentage : prm.hikePercentage
  const effDate = prm.EffectiveDate || prm.effectiveDate
  const status = prm.Status || prm.status
  const pId = prm.Id || prm.id

  if (key === 'promotioncode' || key === 'code' || key === 'ref') {
    return (
      <td key={col.key} className={`py-3 px-4 ${alignClass}`}>
        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
          {pCode || '-'}
        </span>
      </td>
    )
  }

  if (key === 'employee' || key === 'employeename') {
    const initials = (empName || 'Staff').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'EM'
    return (
      <td key={col.key} className={`py-3 px-4 ${alignClass}`}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 to-teal-600 font-bold text-white text-xs ring-2 ring-white shadow-xs">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-slate-900 text-xs truncate">{empName}</div>
          </div>
        </div>
      </td>
    )
  }

  if (key === 'roleprogression' || key === 'designation') {
    return (
      <td key={col.key} className={`py-3 px-4 ${alignClass}`}>
        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
          <span>{curDesig}</span>
          <span className="text-emerald-500">→</span>
          <span className="text-emerald-800 font-bold">{propDesig}</span>
        </div>
      </td>
    )
  }

  if (key === 'compensationrevision' || key === 'ctc' || key === 'salary') {
    return (
      <td key={col.key} className={`py-3 px-4 font-mono font-semibold ${alignClass}`}>
        <span className="text-slate-400">₹{Number(curCtc || 0).toLocaleString('en-IN')}</span>
        <span className="text-emerald-600 mx-1">→</span>
        <span className="text-emerald-800 font-bold">₹{Number(propCtc || 0).toLocaleString('en-IN')}</span>
      </td>
    )
  }

  if (key === 'hikepercentage' || key === 'hike') {
    return (
      <td key={col.key} className={`py-3 px-4 font-black text-emerald-700 ${alignClass}`}>
        +{hike}%
      </td>
    )
  }

  if (key === 'effectivedate' || key === 'date') {
    return (
      <td key={col.key} className={`py-3 px-4 text-slate-600 ${alignClass}`}>
        {effDate ? new Date(effDate).toLocaleDateString() : 'Effective'}
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
            onClick={() => handleApprove(pId)}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition"
          >
            Approve Elevation
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
      {prm[col.key] != null ? String(prm[col.key]) : '—'}
    </td>
  )
}

export default function EmployeePromotion() {
  const [promotions, setPromotions] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [customizerOpen, setCustomizerOpen] = useState(false)
  const { layoutMeta, columns: layoutColumns, refreshLayout } = usePageLayout('promotions', DEFAULT_PROMOTION_COLUMNS)

  const [form, setForm] = useState({
    employeeId: '',
    currentDesignation: '',
    proposedDesignation: '',
    currentGrade: '',
    proposedGrade: '',
    currentCtc: '',
    proposedCtc: '',
    effectiveDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    performanceRating: 'Exceeds Expectations',
    justificationNotes: ''
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [pData, eRes] = await Promise.all([
        getPromotions(),
        api.get('/employees').catch(() => ({ data: [] }))
      ])
      setPromotions(Array.isArray(pData) ? pData : [])
      setEmployees(eRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
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
      currentDesignation: emp?.designation || 'Medical Officer',
      currentGrade: emp?.grade || 'G3',
      currentCtc: emp?.ctc || 600000,
      proposedCtc: Math.round((emp?.ctc || 600000) * 1.25)
    }))
  }

  const calculatedHike = form.currentCtc > 0 && form.proposedCtc > form.currentCtc
    ? Math.round(((form.proposedCtc - form.currentCtc) / form.currentCtc) * 100)
    : 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.employeeId || !form.proposedDesignation) {
      showToast('Please select an employee and enter proposed designation.', true)
      return
    }
    try {
      await createPromotion(form)
      showToast('Promotion and salary revision proposal submitted.')
      setShowForm(false)
      loadData()
    } catch (err) {
      showToast(err.response?.data?.message || 'Promotion proposal failed', true)
    }
  }

  const handleApprove = async (id) => {
    try {
      await approvePromotion(id)
      showToast('Promotion approved and employee designation synchronized.')
      loadData()
    } catch (err) {
      showToast('Failed to approve promotion', true)
    }
  }

  const filteredPromotions = useMemo(() => {
    return promotions.filter(p => {
      const q = searchTerm.toLowerCase().trim()
      const empName = (p.EmployeeName || p.employeeName || '').toLowerCase()
      const empCode = (p.EmployeeCode || p.employeeCode || '').toLowerCase()
      const pCode = (p.PromotionCode || p.promotionCode || '').toLowerCase()
      const matchesSearch = !q || empName.includes(q) || empCode.includes(q) || pCode.includes(q)
      const st = p.Status || p.status || 'Pending'
      const matchesStatus = statusFilter === 'All' || st.toLowerCase() === statusFilter.toLowerCase()
      return matchesSearch && matchesStatus
    })
  }, [promotions, searchTerm, statusFilter])

  // Summary Metrics
  const totalCount = promotions.length
  const pendingCount = promotions.filter(p => (p.Status || p.status) === 'Pending').length
  const approvedCount = promotions.filter(p => (p.Status || p.status) === 'Approved').length
  const avgHike = promotions.length > 0
    ? Math.round(promotions.reduce((sum, p) => sum + (Number(p.HikePercentage || p.hikePercentage) || 0), 0) / promotions.length)
    : 15

  const handleExportCSV = () => {
    if (!filteredPromotions.length) {
      showToast('No promotion proposals to export', true)
      return
    }
    const headers = ['PromotionRef', 'Employee', 'CurrentRole', 'ProposedRole', 'CurrentCTC', 'ProposedCTC', 'Hike%', 'EffectiveDate', 'Status']
    const rows = filteredPromotions.map(p => [
      `"${p.PromotionCode || p.promotionCode || ''}"`,
      `"${p.EmployeeName || p.employeeName || ''}"`,
      `"${p.CurrentDesignation || p.currentDesignation || ''}"`,
      `"${p.ProposedDesignation || p.proposedDesignation || ''}"`,
      p.CurrentCtc || p.currentCtc || 0,
      p.ProposedCtc || p.proposedCtc || 0,
      `"${p.HikePercentage || p.hikePercentage || 0}%"`,
      `"${p.EffectiveDate || p.effectiveDate || ''}"`,
      `"${p.Status || p.status || ''}"`
    ])
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Promotions_Export_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Promotion register exported to CSV.')
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
        icon={TrendingUp}
        title="Employee Promotion & Appraisal Hub"
        description="Authorize role elevations, pay band progressions, appraisal hike calculations, and official letters"
        badge={`${promotions.length} Records`}
        badgeTone="emerald"
      >
        <LayoutVersionBadge entity="promotions" version={layoutMeta?.version} />

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
          {showForm ? 'Close Form' : 'Propose Promotion / Hike'}
        </Button>
      </PageHeader>

      {/* 2. Responsive SaaS Metric Cards (Clean 4-column Grid matching Image 3) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Metric 1: Total Promotions */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span className="uppercase tracking-wider">Total Proposals</span>
            <div className="h-7 w-7 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <TrendingUp size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono mt-1">
            {totalCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate">
            All submitted elevations
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
            Awaiting executive decision
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
            Elevated & payroll linked
          </div>
        </div>

        {/* Metric 4: Average Hike */}
        <div className="bg-white rounded-2xl border border-blue-200/80 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-[11px] font-semibold text-blue-600">
            <span className="uppercase tracking-wider">Average Hike</span>
            <div className="h-7 w-7 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <ArrowUpRight size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-blue-700 font-mono mt-1">
            {avgHike}%
          </div>
          <div className="text-[10px] text-blue-600 font-semibold mt-0.5 truncate">
            Mean salary increment
          </div>
        </div>
      </div>

      {/* Full-Screen Content Area Form */}
      {showForm && (
        <div className="bg-white border-2 border-emerald-300 rounded-2xl p-6 shadow-md transition-all">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Propose Promotion & Compensation Revision</h2>
              <p className="text-xs text-slate-500">Configure new designation, grade progression, salary hike percentage and performance basis</p>
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
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500"
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current Role / Designation</label>
              <input
                type="text"
                value={form.currentDesignation}
                onChange={e => setForm({ ...form, currentDesignation: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Proposed Elevated Role *</label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Veterinary Consultant"
                value={form.proposedDesignation}
                onChange={e => setForm({ ...form, proposedDesignation: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current CTC (₹ / Annum)</label>
              <input
                type="number"
                value={form.currentCtc}
                onChange={e => setForm({ ...form, currentCtc: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Proposed CTC (₹ / Annum) *</label>
              <input
                type="number"
                required
                value={form.proposedCtc}
                onChange={e => setForm({ ...form, proposedCtc: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Calculated Hike %</label>
              <div className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800 flex items-center justify-between">
                <span>{calculatedHike}% Increase</span>
                <span className="text-[10px] text-emerald-600 font-normal">Auto-computed</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Effective Date *</label>
              <input
                type="date"
                required
                value={form.effectiveDate}
                onChange={e => setForm({ ...form, effectiveDate: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Performance Rating Basis</label>
              <select
                value={form.performanceRating}
                onChange={e => setForm({ ...form, performanceRating: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Outstanding (O)">Outstanding (O) • Top 5%</option>
                <option value="Exceeds Expectations (A+)">Exceeds Expectations (A+)</option>
                <option value="Meets Expectations (A)">Meets Expectations (A)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Justification / Committee Remarks</label>
              <input
                type="text"
                value={form.justificationNotes}
                onChange={e => setForm({ ...form, justificationNotes: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500"
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
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md"
              >
                Submit Promotion Proposal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Promotions Table Container (Matching Image 3 Unified Standard) */}
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
                  {st === 'All' ? 'All Promotions' : st}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px] max-w-sm">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Promotions by employee, code..."
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
                    Loading promotion proposals...
                  </td>
                </tr>
              ) : filteredPromotions.length === 0 ? (
                <tr>
                  <td colSpan={layoutColumns.length || 8} className="py-8 text-center text-slate-400 text-xs">
                    <TrendingUp size={30} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-600">No Promotion Proposals Found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Click 'Propose Promotion / Hike' above to initiate an elevation.</p>
                  </td>
                </tr>
              ) : (
                filteredPromotions.map(prm => (
                  <tr key={prm.Id || prm.id} className="hover:bg-purple-50/20 transition">
                    {layoutColumns.map(col => renderPromotionCell(prm, col, handleApprove))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer (Matching Image 3 Unified Standard) */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 font-medium">
          <div>
            Showing <strong className="text-slate-700">1 - {filteredPromotions.length}</strong> of <strong className="text-slate-700">{promotions.length}</strong> records
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
        schema={{ id: 'promotions', columns: layoutColumns }}
        schemaId="promotions"
        onSaveSuccess={() => {
          if (refreshLayout) refreshLayout()
        }}
      />
    </div>
  )
}
