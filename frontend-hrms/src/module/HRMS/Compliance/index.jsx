import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  FileText,
  Filter,
  Landmark,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
  Sparkles,
  AlertCircle,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  getComplianceFilings,
  recordComplianceFiling,
} from '../../../api/compliance'
import { usePageLayout } from '../../../hooks/usePageLayout'
import TableColumnCustomizerModal from '../../../components/TableColumnCustomizerModal'
import PageHeader from '../../../components/PageHeader'
import LayoutVersionBadge from '../../../components/LayoutVersionBadge'
import { Button } from '../../../components/ui'

const DEFAULT_COMPLIANCE_COLUMNS = [
  { key: 'statutoryType', header: 'Statutory Category', width: 'auto', alignment: 'left' },
  { key: 'period', header: 'Pay Period', width: '150px', alignment: 'left' },
  { key: 'challanNumber', header: 'Challan / TRRN Receipt', width: '190px', alignment: 'left' },
  { key: 'totalEmployeesCovered', header: 'Headcount', width: '130px', alignment: 'left' },
  { key: 'totalAmountPaid', header: 'Deposit Amount', width: '160px', alignment: 'left' },
  { key: 'filingStatus', header: 'Status', width: '120px', alignment: 'left' },
  { key: 'filingDate', header: 'Payment Date', width: '140px', alignment: 'right' },
]

function renderComplianceCell(f, col) {
  const key = (col.key || '').toLowerCase()
  const alignClass = `${col.alignment === 'center' ? 'text-center' : col.alignment === 'right' ? 'text-right' : 'text-left'} whitespace-nowrap`

  if (key === 'statutorytype' || key === 'category' || key === 'type') {
    return (
      <td key={col.key || col.columnId} className={`px-4 py-3 ${alignClass}`}>
        <span className="font-bold text-slate-900">{f.statutoryType}</span>
      </td>
    )
  }

  if (key === 'period' || key === 'payperiod' || key === 'periodmonth') {
    return (
      <td key={col.key || col.columnId} className={`px-4 py-3 font-semibold text-slate-700 ${alignClass}`}>
        Month {f.periodMonth} / {f.periodYear}
      </td>
    )
  }

  if (key === 'challannumber' || key === 'challan' || key === 'trrn') {
    return (
      <td key={col.key || col.columnId} className={`px-4 py-3 ${alignClass}`}>
        <span className="font-mono font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-[10px]">
          {f.challanNumber || '-'}
        </span>
      </td>
    )
  }

  if (key === 'totalemployeescovered' || key === 'headcount') {
    return (
      <td key={col.key || col.columnId} className={`px-4 py-3 text-slate-600 ${alignClass}`}>
        {f.totalEmployeesCovered ? `${f.totalEmployeesCovered} staff` : '-'}
      </td>
    )
  }

  if (key === 'totalamountpaid' || key === 'depositamount' || key === 'amount') {
    return (
      <td key={col.key || col.columnId} className={`px-4 py-3 font-mono font-extrabold text-emerald-800 ${alignClass}`}>
        ₹{Number(f.totalAmountPaid || 0).toLocaleString('en-IN')}
      </td>
    )
  }

  if (key === 'filingstatus' || key === 'status') {
    return (
      <td key={col.key || col.columnId} className={`px-4 py-3 ${alignClass}`}>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
          f.filingStatus === 'Filed'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          {f.filingStatus === 'Filed' ? <CheckCircle2 size={11} /> : <Clock size={11} />}
          <span>{f.filingStatus}</span>
        </span>
      </td>
    )
  }

  if (key === 'filingdate' || key === 'paymentdate' || key === 'date') {
    return (
      <td key={col.key || col.columnId} className={`px-4 py-3 font-mono text-[11px] text-slate-600 ${alignClass}`}>
        {f.filingDate ? new Date(f.filingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
      </td>
    )
  }

  return (
    <td key={col.key || col.columnId} className={`px-4 py-3 ${alignClass}`}>
      {f[col.key] !== undefined && f[col.key] !== null ? String(f[col.key]) : '—'}
    </td>
  )
}

export default function Compliance() {
  const { columns: layoutColumns, version, refreshLayout } = usePageLayout('statutory_compliance', DEFAULT_COMPLIANCE_COLUMNS)
  const [customizerOpen, setCustomizerOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [filings, setFilings] = useState([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [typeFilter, setTypeFilter] = useState('all')
  const [feedback, setFeedback] = useState(null)

  // In-Content Full-Screen Form (Zero Floating Modals!)
  const [showRecordForm, setShowRecordForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    statutoryType: 'PF_ECR',
    periodMonth: new Date().getMonth() + 1,
    periodYear: new Date().getFullYear(),
    challanNumber: '',
    totalEmployeesCovered: '',
    totalWages: '',
    totalAmountPaid: '',
    dueDate: new Date().toISOString().split('T')[0],
    filingDate: new Date().toISOString().split('T')[0],
    filingStatus: 'Filed',
    remarks: '',
  })

  const showToast = (msg, isError = false) => {
    setFeedback({ msg, isError })
    setTimeout(() => setFeedback(null), 4000)
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const fData = await getComplianceFilings(null, selectedYear).catch(() => [])
      setFilings(Array.isArray(fData) ? fData : [])
    } catch (err) {
      console.error('Failed to load compliance data', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedYear])

  const handleRecord = async (e) => {
    e.preventDefault()
    if (!formData.challanNumber.trim()) {
      showToast('Please enter the challan or TRRN receipt number.', true)
      return
    }

    setSubmitting(true)
    try {
      await recordComplianceFiling({
        statutoryType: formData.statutoryType,
        periodMonth: Number(formData.periodMonth),
        periodYear: Number(formData.periodYear),
        challanNumber: formData.challanNumber.trim(),
        totalEmployeesCovered: Number(formData.totalEmployeesCovered) || 0,
        totalWages: Number(formData.totalWages) || 0,
        totalAmountPaid: Number(formData.totalAmountPaid) || 0,
        dueDate: formData.dueDate,
        filingDate: formData.filingDate || null,
        filingStatus: formData.filingStatus,
        remarks: formData.remarks.trim() || null,
      })
      showToast('Statutory compliance filing recorded successfully.')
      setShowRecordForm(false)
      setFormData(prev => ({
        ...prev,
        challanNumber: '',
        totalEmployeesCovered: '',
        totalWages: '',
        totalAmountPaid: '',
        remarks: ''
      }))
      await loadData()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to record filing', true)
    } finally {
      setSubmitting(false)
    }
  }

  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 15

  const filteredFilings = useMemo(() => {
    return filings.filter((f) => {
      const q = searchTerm.toLowerCase().trim()
      const matchesSearch =
        !q ||
        (f.statutoryType || '').toLowerCase().includes(q) ||
        (f.challanNumber || '').toLowerCase().includes(q) ||
        (f.remarks || '').toLowerCase().includes(q)
      const matchesType = typeFilter === 'all' || f.statutoryType === typeFilter
      return matchesSearch && matchesType
    })
  }, [filings, typeFilter, searchTerm])

  const totalPages = Math.max(1, Math.ceil(filteredFilings.length / pageSize))
  const paginatedFilings = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredFilings.slice(start, start + pageSize)
  }, [filteredFilings, page, pageSize])

  const handleExportCSV = () => {
    if (!filteredFilings.length) {
      showToast('No filing records to export', true)
      return
    }
    const headers = ['StatutoryType', 'PeriodMonth', 'PeriodYear', 'ChallanNumber', 'CoveredHeadcount', 'DepositAmount', 'Status', 'PaymentDate']
    const rows = filteredFilings.map((f) => [
      `"${f.statutoryType || ''}"`,
      f.periodMonth || '',
      f.periodYear || '',
      `"${f.challanNumber || ''}"`,
      f.totalEmployeesCovered || 0,
      f.totalAmountPaid || 0,
      `"${f.filingStatus || ''}"`,
      `"${f.filingDate || ''}"`,
    ])
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Statutory_Compliance_${selectedYear}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Compliance registry exported to CSV.')
  }

  // Summary Metrics
  const totalTaxPaid = filings.reduce((acc, f) => acc + (Number(f.totalAmountPaid) || 0), 0)
  const filedCount = filings.filter((f) => f.filingStatus === 'Filed').length
  const pendingCount = filings.filter((f) => f.filingStatus === 'Pending' || f.filingStatus === 'Overdue').length

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
        icon={ShieldCheck}
        title="Statutory Filings, EPFO & ESIC Registers"
        description="Corporate statutory governance: record EPFO ECR challans, ESIC contributions, Professional Tax, TDS returns, and maintain audit records"
        badge={`${filings.length} Filings`}
        badgeTone="blue"
      >
        <LayoutVersionBadge entity="statutory_compliance" version={version} />

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
          onClick={() => setShowRecordForm(!showRecordForm)}
          icon={Plus}
        >
          {showRecordForm ? 'Close Form' : 'Record Challan / Filing'}
        </Button>
      </PageHeader>

      {/* 2. Responsive SaaS Metric Cards (Clean 4-column Grid matching Image 3) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span className="uppercase tracking-wider">Total Filings Recorded</span>
            <div className="h-7 w-7 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <ShieldCheck size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono mt-1">
            {filings.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate">
            Statutory ledger entries
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl border border-emerald-200/80 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-600">
            <span className="uppercase tracking-wider">Total Deposited</span>
            <div className="h-7 w-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Landmark size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 font-mono mt-1">
            ₹{totalTaxPaid > 0 ? (totalTaxPaid / 100000).toFixed(2) + ' L' : '0.00'}
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 truncate">
            Government dues cleared
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl border border-blue-200/80 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-[11px] font-semibold text-blue-600">
            <span className="uppercase tracking-wider">Successful Filings</span>
            <div className="h-7 w-7 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-blue-700 font-mono mt-1">
            {filedCount}
          </div>
          <div className="text-[10px] text-blue-600 font-semibold mt-0.5 truncate">
            Challans confirmed
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl border border-amber-200/80 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-[11px] font-semibold text-amber-600">
            <span className="uppercase tracking-wider">Action Pending</span>
            <div className="h-7 w-7 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-700 font-mono mt-1">
            {pendingCount}
          </div>
          <div className="text-[10px] text-amber-600 font-semibold mt-0.5 truncate">
            Awaiting submission
          </div>
        </div>
      </div>

      {/* IN-CONTENT FULL-SCREEN CREATION FORM (ZERO FLOATING MODALS!) */}
      {showRecordForm && (
        <div className="bg-white rounded-2xl border-2 border-blue-400 p-6 shadow-xl transition-all">
          <div className="flex items-center justify-between pb-4 border-b border-blue-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-600 animate-pulse" />
                <span>Record Government Statutory Filing & Challan Receipt</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Register TRRN confirmation numbers, EPFO ECR payment dates, and covered employee totals
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowRecordForm(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleRecord} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Statutory Filing Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.statutoryType}
                  onChange={(e) => setFormData({ ...formData, statutoryType: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="PF_ECR">Provident Fund (EPF ECR)</option>
                  <option value="ESIC">Employees' State Insurance (ESIC)</option>
                  <option value="PT">Professional Tax (PT)</option>
                  <option value="TDS">Tax Deducted at Source (TDS 192B)</option>
                  <option value="BONUS">Payment of Bonus Act</option>
                  <option value="GRATUITY">Gratuity Trust Deposit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Period Month <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.periodMonth}
                  onChange={(e) => setFormData({ ...formData, periodMonth: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {[
                    { m: 1, label: 'January' },
                    { m: 2, label: 'February' },
                    { m: 3, label: 'March' },
                    { m: 4, label: 'April' },
                    { m: 5, label: 'May' },
                    { m: 6, label: 'June' },
                    { m: 7, label: 'July' },
                    { m: 8, label: 'August' },
                    { m: 9, label: 'September' },
                    { m: 10, label: 'October' },
                    { m: 11, label: 'November' },
                    { m: 12, label: 'December' },
                  ].map((item) => (
                    <option key={item.m} value={item.m}>{item.m} - {item.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Period Year <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="2020"
                  max="2035"
                  required
                  value={formData.periodYear}
                  onChange={(e) => setFormData({ ...formData, periodYear: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Challan / TRRN Receipt # <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TRRN-1012938472"
                  value={formData.challanNumber}
                  onChange={(e) => setFormData({ ...formData, challanNumber: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-bold text-purple-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Covered Headcount</label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 50"
                  value={formData.totalEmployeesCovered}
                  onChange={(e) => setFormData({ ...formData, totalEmployeesCovered: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Total Eligible Wages (₹)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 1500000"
                  value={formData.totalWages}
                  onChange={(e) => setFormData({ ...formData, totalWages: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Total Challan Deposited (₹) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="e.g. 180000"
                  value={formData.totalAmountPaid}
                  onChange={(e) => setFormData({ ...formData, totalAmountPaid: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-emerald-700 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Filing Status</label>
                <select
                  value={formData.filingStatus}
                  onChange={(e) => setFormData({ ...formData, filingStatus: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
                >
                  <option value="Filed">Filed / Deposited</option>
                  <option value="Pending">Pending Payment</option>
                  <option value="Overdue">Overdue Notice</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Statutory Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Actual Payment Date</label>
                <input
                  type="date"
                  value={formData.filingDate}
                  onChange={(e) => setFormData({ ...formData, filingDate: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Bank Reference & Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Paid via State Bank of India Corporate NetBanking..."
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRecordForm(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {submitting ? 'Recording...' : 'Commit Filing Record'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Main Filings Ledger Card (Matching Image 3 Unified Standard) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table Filters Toolbar */}
        <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            {/* Segmented Category Tabs */}
            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              {[
                { id: 'all', label: 'All Filings' },
                { id: 'PF_ECR', label: 'EPF ECR' },
                { id: 'ESIC', label: 'ESIC' },
                { id: 'PT', label: 'Prof Tax' },
                { id: 'TDS', label: 'TDS' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setTypeFilter(tab.id)
                    setPage(1)
                  }}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer text-xs font-bold ${
                    typeFilter === tab.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Year Selector Dropdown */}
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(Number(e.target.value))
                setPage(1)
              }}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none cursor-pointer"
            >
              {[2024, 2025, 2026, 2027].map((yr) => (
                <option key={yr} value={yr}>CY {yr}</option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px] max-w-sm">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search challan, TRRN, remarks..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPage(1)
                }}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-blue-600 font-medium bg-slate-50/50 focus:bg-white"
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/80 hover:bg-blue-100 text-blue-700 text-xs font-bold transition shadow-2xs cursor-pointer"
              title="Customize Table Columns"
            >
              <SlidersHorizontal size={13} className="text-blue-600" />
              <span>Customize Columns</span>
              <span className="ml-0.5 rounded-full bg-blue-600 px-1.5 py-0.2 text-[10px] font-extrabold text-white">
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
                    <RefreshCw size={22} className="mx-auto mb-2 animate-spin text-blue-600" />
                    <span>Loading compliance archive from database...</span>
                  </td>
                </tr>
              ) : filteredFilings.length === 0 ? (
                <tr>
                  <td colSpan={layoutColumns.length || 7} className="px-4 py-12 text-center">
                    <ShieldCheck size={36} className="mx-auto mb-2 text-slate-300" />
                    <div className="font-bold text-slate-700">No Compliance Records Logged for {selectedYear}</div>
                    <p className="text-xs text-slate-400 mt-1">Click "Record Challan / Filing" to register a payment receipt.</p>
                  </td>
                </tr>
              ) : (
                paginatedFilings.map((f) => (
                  <tr key={f.id} className="hover:bg-blue-50/30 transition">
                    {layoutColumns.map((col) => renderComplianceCell(f, col))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer (Matching Image 3 Standard) */}
        <div className="p-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-medium">
          <div>
            Showing <span className="font-bold text-slate-800">{filteredFilings.length === 0 ? 0 : (page - 1) * pageSize + 1}</span> - <span className="font-bold text-slate-800">{Math.min(page * pageSize, filteredFilings.length)}</span> of <span className="font-bold text-slate-800">{filteredFilings.length}</span> records
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
        schema={{ id: 'statutory_compliance', columns: layoutColumns }}
        schemaId="statutory_compliance"
        onSaveSuccess={() => {
          if (refreshLayout) refreshLayout()
        }}
      />
    </div>
  )
}
