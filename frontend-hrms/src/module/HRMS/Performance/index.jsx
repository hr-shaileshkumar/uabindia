import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Star,
  TrendingUp,
  UserCheck,
  X,
  Zap,
  ChevronRight,
  AlertCircle,
  Sparkles,
  SlidersHorizontal,
  Download,
  Building2,
  Users,
  ChevronLeft,
} from 'lucide-react'
import {
  createCycle,
  getAppraisals,
  getCycles,
  submitManagerReview,
  submitSelfReview,
} from '../../../api/performance'
import { usePageLayout } from '../../../hooks/usePageLayout'
import TableColumnCustomizerModal from '../../../components/TableColumnCustomizerModal'
import PageHeader from '../../../components/PageHeader'
import LayoutVersionBadge from '../../../components/LayoutVersionBadge'
import { Button } from '../../../components/ui'

const DEFAULT_APPRAISAL_COLUMNS = [
  { key: 'employee', header: 'Employee', width: 'auto', alignment: 'left' },
  { key: 'department', header: 'Department', width: '160px', alignment: 'left' },
  { key: 'selfRating', header: 'Self Rating', width: '140px', alignment: 'left' },
  { key: 'managerRating', header: 'Manager Rating', width: '150px', alignment: 'left' },
  { key: 'finalScore', header: 'Final Score', width: '130px', alignment: 'left' },
  { key: 'status', header: 'Status', width: '130px', alignment: 'left' },
  { key: 'actions', header: 'Actions', width: '160px', alignment: 'right' },
]

function renderAppraisalCell(a, col, { handleOpenSelf, handleOpenManager }) {
  const key = (col.key || '').toLowerCase()
  const alignClass = `${col.alignment === 'center' ? 'text-center' : col.alignment === 'right' ? 'text-right' : 'text-left'} whitespace-nowrap`

  if (key === 'code' || key === 'employeecode') {
    return (
      <td key={col.key || col.columnId} className={`px-4 py-3 ${alignClass}`}>
        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">
          {a.employeeCode || '-'}
        </span>
      </td>
    )
  }

  if (key === 'employee' || key === 'name' || key === 'employeename') {
    const initials = (a.employeeName || 'EM')
      .split(' ')
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase()
    return (
      <td key={col.key || col.columnId} className={`px-4 py-3 ${alignClass}`}>
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
            {initials}
          </div>
          <span className="font-bold text-slate-900">{a.employeeName}</span>
        </div>
      </td>
    )
  }

  if (key === 'department' || key === 'departmentname') {
    return (
      <td key={col.key || col.columnId} className={`px-4 py-3 font-semibold text-slate-700 ${alignClass}`}>
        {a.departmentName || 'General Staff'}
      </td>
    )
  }

  if (key === 'selfrating') {
    return (
      <td key={col.key || col.columnId} className={`px-4 py-3 ${alignClass}`}>
        {a.selfRating ? (
          <span className="font-bold text-purple-700 font-mono bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
            {Number(a.selfRating).toFixed(1)} / 5.0
          </span>
        ) : (
          <span className="text-slate-400 italic">Pending</span>
        )}
      </td>
    )
  }

  if (key === 'managerrating') {
    return (
      <td key={col.key || col.columnId} className={`px-4 py-3 ${alignClass}`}>
        {a.managerRating ? (
          <span className="font-bold text-emerald-800 font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            {Number(a.managerRating).toFixed(1)} / 5.0
          </span>
        ) : (
          <span className="text-slate-400 italic">Pending</span>
        )}
      </td>
    )
  }

  if (key === 'finalscore') {
    return (
      <td key={col.key || col.columnId} className={`px-4 py-3 ${alignClass}`}>
        {a.finalScore ? (
          <span className="font-extrabold text-indigo-900 font-mono bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
            {Number(a.finalScore).toFixed(1)}
          </span>
        ) : (
          <span className="text-slate-400 italic">-</span>
        )}
      </td>
    )
  }

  if (key === 'status') {
    return (
      <td key={col.key || col.columnId} className={`px-4 py-3 ${alignClass}`}>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
          a.status === 'Completed'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          {a.status === 'Completed' ? <CheckCircle2 size={11} /> : <Clock size={11} />}
          <span>{a.status}</span>
        </span>
      </td>
    )
  }

  if (key === 'actions') {
    return (
      <td key={col.key || col.columnId} className={`px-4 py-3 text-right`}>
        <div className="inline-flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleOpenSelf(a)}
            className="px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[11px] transition cursor-pointer"
          >
            Self Review
          </button>
          <button
            type="button"
            onClick={() => handleOpenManager(a)}
            className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] transition cursor-pointer"
          >
            Manager Review
          </button>
        </div>
      </td>
    )
  }

  return (
    <td key={col.key || col.columnId} className={`px-4 py-3 ${alignClass}`}>
      {a[col.key] !== undefined && a[col.key] !== null ? String(a[col.key]) : '—'}
    </td>
  )
}

export default function Performance() {
  const { columns: layoutColumns, version, refreshLayout } = usePageLayout('performance_appraisals', DEFAULT_APPRAISAL_COLUMNS)
  const [customizerOpen, setCustomizerOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cycles, setCycles] = useState([])
  const [selectedCycleId, setSelectedCycleId] = useState('')
  const [appraisals, setAppraisals] = useState([])
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [feedback, setFeedback] = useState(null)

  // In-Content Full-Screen Workflows (Zero Floating Modals!)
  const [showCycleForm, setShowCycleForm] = useState(false)
  const [submittingCycle, setSubmittingCycle] = useState(false)
  const [cycleForm, setCycleForm] = useState({
    cycleName: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 90).toISOString().split('T')[0],
  })

  // Self Review In-Content Panel
  const [activeSelfAppraisal, setActiveSelfAppraisal] = useState(null)
  const [selfRating, setSelfRating] = useState(4.0)
  const [selfComments, setSelfComments] = useState('')
  const [submittingSelf, setSubmittingSelf] = useState(false)

  // Manager Review In-Content Panel
  const [activeManagerAppraisal, setActiveManagerAppraisal] = useState(null)
  const [managerRating, setManagerRating] = useState(4.5)
  const [finalScore, setFinalScore] = useState(4.3)
  const [promotionRecommended, setPromotionRecommended] = useState(false)
  const [proposedDesignation, setProposedDesignation] = useState('')
  const [proposedIncrement, setProposedIncrement] = useState(12.5)
  const [managerComments, setManagerComments] = useState('')
  const [submittingManager, setSubmittingManager] = useState(false)

  const showToast = (msg, isError = false) => {
    setFeedback({ msg, isError })
    setTimeout(() => setFeedback(null), 4000)
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const cRes = await getCycles().catch(() => [])
      const cList = Array.isArray(cRes) ? cRes : []
      setCycles(cList)

      const activeId = selectedCycleId || (cList.length > 0 ? cList[0].id : '')
      if (activeId) {
        setSelectedCycleId(activeId)
        const aRes = await getAppraisals(activeId)
        setAppraisals(Array.isArray(aRes) ? aRes : [])
      } else {
        setAppraisals([])
      }
    } catch (err) {
      console.error('Failed to load performance data', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedCycleId])

  const handleCreateCycle = async (e) => {
    e.preventDefault()
    if (!cycleForm.cycleName.trim()) {
      showToast('Please enter an appraisal cycle title.', true)
      return
    }

    setSubmittingCycle(true)
    try {
      await createCycle({
        cycleName: cycleForm.cycleName.trim(),
        financialYear: `${cycleForm.startDate.slice(0, 4)}-${cycleForm.endDate.slice(0, 4)}`,
        startDate: cycleForm.startDate,
        endDate: cycleForm.endDate,
      })
      showToast('Appraisal cycle created successfully.')
      setShowCycleForm(false)
      setCycleForm({
        cycleName: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 86400000 * 90).toISOString().split('T')[0],
      })
      await loadData()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to create appraisal cycle', true)
    } finally {
      setSubmittingCycle(false)
    }
  }

  const handleOpenSelf = (appraisal) => {
    setActiveManagerAppraisal(null)
    setActiveSelfAppraisal(appraisal)
    setSelfRating(appraisal.selfRating || 4.0)
    setSelfComments(appraisal.selfReviewComments || '')
  }

  const handleSubmitSelf = async (e) => {
    e.preventDefault()
    setSubmittingSelf(true)
    try {
      await submitSelfReview(activeSelfAppraisal.id, {
        rating: Number(selfRating),
        comments: selfComments.trim(),
      })
      showToast('Self appraisal submitted successfully.')
      setActiveSelfAppraisal(null)
      await loadData()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to submit self review', true)
    } finally {
      setSubmittingSelf(false)
    }
  }

  const handleOpenManager = (appraisal) => {
    setActiveSelfAppraisal(null)
    setActiveManagerAppraisal(appraisal)
    setManagerRating(appraisal.managerRating || 4.0)
    setFinalScore(appraisal.finalScore || 4.0)
    setPromotionRecommended(Boolean(appraisal.promotionRecommended))
    setProposedDesignation(appraisal.proposedDesignation || '')
    setProposedIncrement(appraisal.proposedIncrementPercent || 10.0)
    setManagerComments(appraisal.managerReviewComments || '')
  }

  const handleSubmitManager = async (e) => {
    e.preventDefault()
    setSubmittingManager(true)
    try {
      await submitManagerReview(activeManagerAppraisal.id, {
        managerRating: Number(managerRating),
        finalScore: Number(finalScore),
        promotionRecommended,
        proposedDesignation: promotionRecommended ? proposedDesignation.trim() : null,
        proposedIncrementPercent: Number(proposedIncrement) || 0,
        comments: managerComments.trim(),
      })
      showToast('Manager appraisal finalized and scores committed.')
      setActiveManagerAppraisal(null)
      await loadData()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to submit manager review', true)
    } finally {
      setSubmittingManager(false)
    }
  }

  const [page, setPage] = useState(1)
  const pageSize = 15

  const filteredAppraisals = useMemo(() => {
    return appraisals.filter((a) => {
      const matchSearch =
        !searchTerm.trim() ||
        (a.employeeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.employeeCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.departmentName || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchStatus = statusFilter === 'ALL' || a.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [appraisals, searchTerm, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredAppraisals.length / pageSize))
  const paginatedAppraisals = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredAppraisals.slice(start, start + pageSize)
  }, [filteredAppraisals, page, pageSize])

  const handleExportCSV = () => {
    if (!filteredAppraisals.length) {
      showToast('No appraisal records to export', true)
      return
    }
    const headers = ['EmployeeCode', 'EmployeeName', 'Department', 'SelfRating', 'ManagerRating', 'FinalScore', 'Status', 'PromotionRecommended']
    const rows = filteredAppraisals.map((a) => [
      `"${a.employeeCode || ''}"`,
      `"${a.employeeName || ''}"`,
      `"${a.departmentName || ''}"`,
      a.selfRating || '',
      a.managerRating || '',
      a.finalScore || '',
      `"${a.status || ''}"`,
      a.promotionRecommended ? 'Yes' : 'No',
    ])
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Appraisals_Export_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Appraisal ledger exported to CSV.')
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
        icon={Award}
        title="Performance Appraisals & Cadre Evaluation"
        description="Track employee performance appraisal cycles, KRA goal fulfillment, self-evaluation, managerial review, ratings, and salary increment recommendations"
        badge={`${appraisals.length} Appraisals`}
        badgeTone="purple"
      >
        <LayoutVersionBadge entity="performance_appraisals" version={version} />

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
          onClick={() => setShowCycleForm(!showCycleForm)}
          icon={Plus}
        >
          {showCycleForm ? 'Close Form' : 'New Appraisal Cycle'}
        </Button>
      </PageHeader>

      {/* 2. Responsive SaaS Metric Cards (Clean 4-column Grid matching Image 3) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span className="uppercase tracking-wider">Appraisal Cycles</span>
            <div className="h-7 w-7 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Calendar size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono mt-1">
            {cycles.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate">
            Recorded campaigns
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl border border-indigo-200/80 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-600">
            <span className="uppercase tracking-wider">Total Appraisals</span>
            <div className="h-7 w-7 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Award size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-indigo-700 font-mono mt-1">
            {appraisals.length}
          </div>
          <div className="text-[10px] text-indigo-600 font-semibold mt-0.5 truncate">
            Assigned staff evaluations
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl border border-emerald-200/80 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-600">
            <span className="uppercase tracking-wider">Completed Reviews</span>
            <div className="h-7 w-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 font-mono mt-1">
            {appraisals.filter((a) => a.status === 'Completed').length}
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 truncate">
            Final scores committed
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl border border-amber-200/80 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-[11px] font-semibold text-amber-600">
            <span className="uppercase tracking-wider">Promotions Recommended</span>
            <div className="h-7 w-7 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <TrendingUp size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-700 font-mono mt-1">
            {appraisals.filter((a) => a.promotionRecommended).length}
          </div>
          <div className="text-[10px] text-amber-600 font-semibold mt-0.5 truncate">
            Cadre elevations proposed
          </div>
        </div>
      </div>

      {/* IN-CONTENT FULL-SCREEN CREATION FORM FOR APPRAISAL CYCLE (ZERO FLOATING MODALS!) */}
      {showCycleForm && (
        <div className="bg-white rounded-2xl border-2 border-indigo-400 p-6 shadow-xl transition-all">
          <div className="flex items-center justify-between pb-4 border-b border-indigo-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-600 animate-pulse" />
                <span>Initiate New Performance Appraisal Cycle</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Launch a targeted performance evaluation campaign with defined mobilization dates and KRA review windows
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCycleForm(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleCreateCycle} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Appraisal Cycle Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={cycleForm.cycleName}
                  onChange={(e) => setCycleForm({ ...cycleForm, cycleName: e.target.value })}
                  placeholder="e.g. Annual Appraisal Cycle 2026"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Start Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={cycleForm.startDate}
                  onChange={(e) => setCycleForm({ ...cycleForm, startDate: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target End Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={cycleForm.endDate}
                  onChange={(e) => setCycleForm({ ...cycleForm, endDate: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCycleForm(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                disabled={submittingCycle}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingCycle}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {submittingCycle ? 'Creating Cycle...' : 'Launch Cycle'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* IN-CONTENT SELF APPRAISAL FORM */}
      {activeSelfAppraisal && (
        <div className="bg-white rounded-2xl border-2 border-purple-400 p-6 shadow-xl transition-all space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-purple-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Self Appraisal Submission: {activeSelfAppraisal.employeeName}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Self-evaluate achievements, key performance indicators (KPIs), and growth competencies
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSelfAppraisal(null)}
              className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmitSelf} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Self-Rating Score (1.0 to 5.0) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.1"
                    value={selfRating}
                    onChange={(e) => setSelfRating(parseFloat(e.target.value))}
                    className="w-full accent-purple-600 cursor-pointer"
                  />
                  <span className="font-mono font-extrabold text-base text-purple-700 w-12 text-center bg-purple-50 py-1 rounded border border-purple-200">
                    {selfRating.toFixed(1)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Self-Review Justification & Achievements <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={selfComments}
                  onChange={(e) => setSelfComments(e.target.value)}
                  placeholder="Summarize key targets achieved, challenges resolved, and goals for the upcoming period..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveSelfAppraisal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingSelf}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
              >
                {submittingSelf ? 'Submitting...' : 'Commit Self Appraisal'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* IN-CONTENT MANAGER REVIEW & PROMOTION FORM */}
      {activeManagerAppraisal && (
        <div className="bg-white rounded-2xl border-2 border-emerald-400 p-6 shadow-xl transition-all space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Supervisory Manager Review: {activeManagerAppraisal.employeeName}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluate subordinate performance, assign final score, and propose cadre elevations or salary increments
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveManagerAppraisal(null)}
              className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmitManager} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Manager Rating (1.0 - 5.0)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.1"
                    value={managerRating}
                    onChange={(e) => setManagerRating(parseFloat(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <span className="font-mono font-bold text-emerald-800 text-sm bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                    {managerRating.toFixed(1)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Final Weighted Score (1.0 - 5.0)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.1"
                    value={finalScore}
                    onChange={(e) => setFinalScore(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <span className="font-mono font-bold text-indigo-800 text-sm bg-indigo-50 px-2 py-1 rounded border border-indigo-200">
                    {finalScore.toFixed(1)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Proposed Increment (%)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={proposedIncrement}
                  onChange={(e) => setProposedIncrement(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-emerald-700 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="md:col-span-3 flex items-center gap-3 p-3 rounded-xl bg-amber-50/60 border border-amber-200">
                <input
                  type="checkbox"
                  id="promoCheck"
                  checked={promotionRecommended}
                  onChange={(e) => setPromotionRecommended(e.target.checked)}
                  className="h-4 w-4 rounded accent-indigo-600 cursor-pointer"
                />
                <label htmlFor="promoCheck" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Recommend Employee for Promotion & Cadre Re-titling
                </label>
              </div>

              {promotionRecommended && (
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Proposed Elevated Designation *</label>
                  <input
                    type="text"
                    required={promotionRecommended}
                    value={proposedDesignation}
                    onChange={(e) => setProposedDesignation(e.target.value)}
                    placeholder="e.g. Senior Medical Officer / Field Team Lead"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
              )}

              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">Managerial Comments & Feedback</label>
                <textarea
                  rows={2}
                  value={managerComments}
                  onChange={(e) => setManagerComments(e.target.value)}
                  placeholder="Key strengths, developmental areas, and promotion recommendation rationale..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveManagerAppraisal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingManager}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
              >
                {submittingManager ? 'Committing...' : 'Commit Manager Review'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Main Appraisals Ledger Card (Matching Image 3 Unified Standard) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table Filters Toolbar */}
        <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            {/* Segmented Status Tabs */}
            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              {[
                { id: 'ALL', label: 'All Reviews' },
                { id: 'Completed', label: 'Completed' },
                { id: 'Manager Review', label: 'In Review' },
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
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Cycle Selector Dropdown */}
            {cycles.length > 0 && (
              <select
                value={selectedCycleId}
                onChange={(e) => {
                  setSelectedCycleId(e.target.value)
                  setPage(1)
                }}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-purple-600 focus:outline-none cursor-pointer"
              >
                {cycles.map((c) => (
                  <option key={c.id} value={c.id}>{c.cycleName}</option>
                ))}
              </select>
            )}

            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px] max-w-sm">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff, code, role..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPage(1)
                }}
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50/80 hover:bg-purple-100 text-purple-700 text-xs font-bold transition shadow-2xs cursor-pointer"
              title="Customize Table Columns"
            >
              <SlidersHorizontal size={13} className="text-purple-600" />
              <span>Customize Columns</span>
              <span className="ml-0.5 rounded-full bg-purple-600 px-1.5 py-0.2 text-[10px] font-extrabold text-white">
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
                    <RefreshCw size={22} className="mx-auto mb-2 animate-spin text-purple-600" />
                    <span>Loading appraisals from database...</span>
                  </td>
                </tr>
              ) : filteredAppraisals.length === 0 ? (
                <tr>
                  <td colSpan={layoutColumns.length || 7} className="px-4 py-12 text-center">
                    <Award size={36} className="mx-auto mb-2 text-slate-300" />
                    <div className="font-bold text-slate-700">No Appraisal Records Found</div>
                    <p className="text-xs text-slate-400 mt-1">Select another cycle or create a new appraisal cycle above.</p>
                  </td>
                </tr>
              ) : (
                paginatedAppraisals.map((a) => (
                  <tr key={a.id} className="hover:bg-purple-50/30 transition">
                    {layoutColumns.map((col) =>
                      renderAppraisalCell(a, col, { handleOpenSelf, handleOpenManager })
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
            Showing <span className="font-bold text-slate-800">{filteredAppraisals.length === 0 ? 0 : (page - 1) * pageSize + 1}</span> - <span className="font-bold text-slate-800">{Math.min(page * pageSize, filteredAppraisals.length)}</span> of <span className="font-bold text-slate-800">{filteredAppraisals.length}</span> records
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
        schema={{ id: 'performance_appraisals', columns: layoutColumns }}
        schemaId="performance_appraisals"
        onSaveSuccess={() => {
          if (refreshLayout) refreshLayout()
        }}
      />
    </div>
  )
}
