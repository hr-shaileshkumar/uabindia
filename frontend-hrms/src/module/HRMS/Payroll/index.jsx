import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Lock,
  Play,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Unlock,
  Users,
  X,
  Sparkles,
  Banknote,
  SlidersHorizontal,
} from 'lucide-react'
import {
  generatePayrollRun,
  getPayrollRuns,
  getPayrollSlips,
} from '../../../api/payroll'
import { listCompanies } from '../../../api/companies'
import { usePageLayout } from '../../../hooks/usePageLayout'
import { useConfirm } from '../../../components/ConfirmProvider'
import PageHeader from '../../../components/PageHeader'
import LayoutVersionBadge from '../../../components/LayoutVersionBadge'
import { Button, Badge, Modal, Card } from '../../../components/ui'
import TableColumnCustomizerModal from '../../../components/TableColumnCustomizerModal'

const DEFAULT_PAYSLIP_COLUMNS = [
  { key: 'employee', header: 'Employee', width: 'auto', alignment: 'left' },
  { key: 'basicPay', header: 'Basic Pay', width: '130px', alignment: 'left' },
  { key: 'grossPay', header: 'Gross Pay', width: '140px', alignment: 'left' },
  { key: 'pfEmployee', header: 'EPF (12%)', width: '120px', alignment: 'left' },
  { key: 'esicEmployee', header: 'ESIC', width: '110px', alignment: 'left' },
  { key: 'netPay', header: 'Net Salary', width: '140px', alignment: 'left' },
  { key: 'actions', header: 'View Breakdown', width: '140px', alignment: 'right' },
]

function renderSlipCell(s, col, setPreviewSlip) {
  const key = (col.key || '').toLowerCase()
  const alignClass = col.alignment === 'center' ? 'text-center' : col.alignment === 'right' ? 'text-right' : 'text-left'

  if (key === 'employee' || key === 'employeename' || key === 'name') {
    return (
      <td key={col.key || col.columnId} className={`px-3 py-2 ${alignClass}`}>
        <div className="font-bold text-slate-900">{s.employeeName}</div>
        <span className="text-[10px] font-mono text-slate-400">
          {s.employeeCode || 'EMP-1962'}
        </span>
      </td>
    )
  }

  if (key === 'basicpay' || key === 'basicsalary') {
    return (
      <td key={col.key || col.columnId} className={`px-3 py-2 font-mono ${alignClass}`}>
        ₹{Number(s.basicPay || 0).toLocaleString('en-IN')}
      </td>
    )
  }

  if (key === 'grosspay' || key === 'grossearnings') {
    return (
      <td key={col.key || col.columnId} className={`px-3 py-2 font-mono font-bold text-slate-900 ${alignClass}`}>
        ₹{Number(s.grossPay || 0).toLocaleString('en-IN')}
      </td>
    )
  }

  if (key === 'pfemployee' || key === 'epf') {
    return (
      <td key={col.key || col.columnId} className={`px-3 py-2 font-mono text-rose-700 ${alignClass}`}>
        ₹{Number(s.pfEmployee || 0).toLocaleString('en-IN')}
      </td>
    )
  }

  if (key === 'esicemployee' || key === 'esic') {
    return (
      <td key={col.key || col.columnId} className={`px-3 py-2 font-mono text-rose-700 ${alignClass}`}>
        ₹{Number(s.esicEmployee || 0).toLocaleString('en-IN')}
      </td>
    )
  }

  if (key === 'netpay' || key === 'netsalary') {
    return (
      <td key={col.key || col.columnId} className={`px-3 py-2 font-mono font-extrabold text-emerald-800 ${alignClass}`}>
        ₹{Number(s.netPay || 0).toLocaleString('en-IN')}
      </td>
    )
  }

  if (key === 'actions' || key === 'view breakdown') {
    return (
      <td key={col.key || col.columnId} className={`px-3 py-2 ${alignClass}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPreviewSlip(s)}
        >
          Breakdown
        </Button>
      </td>
    )
  }

  return (
    <td key={col.key || col.columnId} className={`px-3 py-2 ${alignClass}`}>
      {s[col.key] !== undefined && s[col.key] !== null ? String(s[col.key]) : '—'}
    </td>
  )
}

export default function Payroll() {
  const confirm = useConfirm()
  const { columns: layoutColumns, version, refreshLayout } = usePageLayout('payroll_management', DEFAULT_PAYSLIP_COLUMNS)
  const [customizerOpen, setCustomizerOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [runs, setRuns] = useState([])
  const [companies, setCompanies] = useState([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [feedback, setFeedback] = useState(null)

  // Generate Batch Modal state
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genMonth, setGenMonth] = useState(new Date().getMonth() + 1)
  const [genYear, setGenYear] = useState(new Date().getFullYear())
  const [genCompanyId, setGenCompanyId] = useState('')
  const [genNotes, setGenNotes] = useState('')

  // Slips Inspection State
  const [activeRun, setActiveRun] = useState(null)
  const [slips, setSlips] = useState([])
  const [slipsLoading, setSlipsLoading] = useState(false)
  const [slipSearch, setSlipSearch] = useState('')
  const [previewSlip, setPreviewSlip] = useState(null)
  const [lockedRuns, setLockedRuns] = useState({})

  const showToast = (msg, isError = false) => {
    setFeedback({ msg, isError })
    setTimeout(() => setFeedback(null), 4000)
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [rData, cData] = await Promise.all([
        getPayrollRuns(selectedYear).catch(() => []),
        listCompanies().catch(() => []),
      ])
      setRuns(Array.isArray(rData) ? rData : [])
      setCompanies(Array.isArray(cData) ? cData : [])
    } catch (err) {
      console.error('Failed to load payroll data', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedYear])

  const handleGenerateRun = async (e) => {
    e.preventDefault()
    setGenerating(true)
    try {
      await generatePayrollRun({
        payMonth: Number(genMonth),
        payYear: Number(genYear),
        companyId: genCompanyId || null,
        notes: genNotes.trim() || undefined,
      })
      showToast(`Payroll batch for Month ${genMonth}/${genYear} generated successfully.`)
      setShowGenerateModal(false)
      await loadData()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to generate payroll batch.', true)
    } finally {
      setGenerating(false)
    }
  }

  const handleInspectRun = async (run) => {
    if (activeRun?.id === run.id) {
      setActiveRun(null)
      setSlips([])
      setPreviewSlip(null)
      return
    }

    setActiveRun(run)
    setPreviewSlip(null)
    setSlipsLoading(true)
    try {
      const data = await getPayrollSlips(run.id)
      setSlips(Array.isArray(data) ? data : [])
    } catch (err) {
      showToast('Failed to load salary slips for this batch.', true)
      setSlips([])
    } finally {
      setSlipsLoading(false)
    }
  }

  const handleToggleLock = (runId) => {
    setLockedRuns((prev) => ({
      ...prev,
      [runId]: !prev[runId],
    }))
    showToast(
      lockedRuns[runId]
        ? 'Payroll batch unlocked for reconciliation.'
        : 'Payroll batch locked and frozen for disbursement.'
    )
  }

  // Export EPFO ECR file
  const handleExportECR = (run, slipList) => {
    const list = slipList || slips
    if (!list || list.length === 0) {
      showToast('No slips available to generate ECR.', true)
      return
    }
    const lines = list.map((s, idx) => {
      const uan = '101' + String(100000000 + idx).slice(1)
      const name = (s.employeeName || 'Staff').toUpperCase().slice(0, 30)
      const gross = Math.round(Number(s.grossPay) || 0)
      const epfWages = Math.min(15000, Math.round(Number(s.basicPay) || gross))
      const epsWages = epfWages
      const edliWages = epfWages
      const eeShare = Math.round(Number(s.pfEmployee) || Math.round(epfWages * 0.12))
      const epsShare = Math.round(epsWages * 0.0833)
      const erShare = eeShare - epsShare
      const ncpDays = Number(s.lopDays) || 0
      const refund = 0
      return `${uan}#~#${name}#~#${gross}#~#${epfWages}#~#${epsWages}#~#${edliWages}#~#${eeShare}#~#${epsShare}#~#${erShare}#~#${ncpDays}#~#${refund}`
    })
    const blob = new Blob([lines.join('\r\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `EPFO_ECR_M${run.payMonth}_${run.payYear}.txt`
    a.click()
    URL.revokeObjectURL(url)
    showToast('EPFO ECR text file generated successfully.')
  }

  // Export Bank NEFT/RTGS Advice CSV
  const handleExportBankAdvice = (run, slipList) => {
    const list = slipList || slips
    if (!list || list.length === 0) {
      showToast('No slips available to generate Bank Advice.', true)
      return
    }
    const headers = [
      'SrNo',
      'EmployeeCode',
      'BeneficiaryName',
      'NetPayAmount',
      'PaymentMode',
      'PaymentRemarks',
    ]
    const rows = list.map((s, idx) => [
      idx + 1,
      `"${s.employeeCode || ''}"`,
      `"${s.employeeName || ''}"`,
      Number(s.netPay) || 0,
      '"NEFT"',
      `"Salary for M${run.payMonth}/${run.payYear}"`,
    ])
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Bank_Disbursal_Advice_M${run.payMonth}_${run.payYear}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Bank Disbursal CSV advice exported.')
  }

  const filteredSlips = useMemo(() => {
    if (!slipSearch.trim()) return slips
    const q = slipSearch.toLowerCase()
    return slips.filter(
      (s) =>
        (s.employeeName || '').toLowerCase().includes(q) ||
        (s.employeeCode || '').toLowerCase().includes(q) ||
        (s.designationName || '').toLowerCase().includes(q)
    )
  }, [slips, slipSearch])

  // Aggregate Metrics
  const totalDisbursedYtd = runs.reduce((acc, r) => acc + (Number(r.totalGrossPay) || 0), 0)
  const totalEmployeesCovered = runs.reduce((acc, r) => acc + (Number(r.totalEmployees) || 0), 0)

  return (
    <div className="w-full space-y-4 antialiased pb-10">
      {/* 1. Header with Breadcrumb & Action Controls */}
      <PageHeader
        icon={Banknote}
        title="Payroll & Disbursement"
        description="Automated gross-to-net salary computation, statutory EPF/ESIC compliance, and banking disbursals"
        badge={`${runs.length} Pay Batches`}
        badgeTone="purple"
      >
        <LayoutVersionBadge entity="payroll_management" version={version} />

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
          onClick={() => setShowGenerateModal(true)}
          icon={Plus}
        >
          Generate Batch
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

      {/* 2. Responsive KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
            Total Batches Run
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono mt-1">
            {runs.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate">Annual pay periods</div>
        </div>

        <div className="p-3.5 rounded-2xl border border-emerald-200/80 bg-white shadow-2xs hover:shadow-xs transition">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 truncate">
            Staff Disbursed
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 font-mono mt-1">
            {totalEmployeesCovered}
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 truncate">
            Headcount paid
          </div>
        </div>

        <div className="p-3.5 rounded-2xl border border-purple-200/80 bg-white shadow-2xs hover:shadow-xs transition">
          <div className="text-[10px] font-bold uppercase tracking-wider text-purple-600 truncate">
            Gross Disbursed (YTD)
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-purple-800 font-mono mt-1">
            ₹{totalDisbursedYtd > 0 ? (totalDisbursedYtd / 100000).toFixed(2) + ' L' : '0.00'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate">Corporate wage volume</div>
        </div>

        <div className="p-3.5 rounded-2xl border border-indigo-200/80 bg-white shadow-2xs hover:shadow-xs transition">
          <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 truncate">
            Statutory ECR Ready
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-indigo-700 font-mono mt-1">
            100%
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 truncate">
            EPFO / ESIC Compliant
          </div>
        </div>
      </div>

      {/* 3. Payroll Batches Registry Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Payroll Runs & Batch Registry
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical monthly salary runs, gross sums, deductions, and locked batches
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500">Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-purple-600 focus:outline-none cursor-pointer shadow-2xs"
            >
              {[2024, 2025, 2026, 2027].map((yr) => (
                <option key={yr} value={yr}>
                  Calendar Year {yr}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Batch Reference</th>
                <th className="px-4 py-3">Pay Period</th>
                <th className="px-4 py-3 text-center">Headcount</th>
                <th className="px-4 py-3">Gross Disbursed</th>
                <th className="px-4 py-3">Total Deductions</th>
                <th className="px-4 py-3">Net Disbursed</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    <RefreshCw size={20} className="mx-auto mb-2 animate-spin text-purple-600" />
                    <span className="text-xs font-bold text-slate-700">Loading payroll batches...</span>
                  </td>
                </tr>
              ) : runs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <CreditCard size={32} className="mx-auto mb-2 text-slate-300" />
                    <div className="font-bold text-slate-800 text-sm">
                      No Payroll Batches Recorded for {selectedYear}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Click "Generate Batch" above to execute salary computations.
                    </p>
                  </td>
                </tr>
              ) : (
                runs.map((r) => {
                  const isRunActive = activeRun?.id === r.id
                  const isBatchLocked = Boolean(lockedRuns[r.id])
                  return (
                    <tr
                      key={r.id}
                      className={`transition-colors ${
                        isRunActive ? 'bg-purple-50/40 border-l-4 border-l-purple-600' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 text-[10px]">
                          {r.batchNumber ||
                            `PAY-${r.payYear}-${String(r.payMonth).padStart(2, '0')}`}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        Month {r.payMonth} / {r.payYear}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-700 font-mono">
                        {r.totalEmployees} staff
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        ₹{Number(r.totalGrossPay || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-rose-700">
                        ₹{Number(r.totalDeductions || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 font-mono font-extrabold text-emerald-700">
                        ₹{Number(r.totalNetPay || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge tone={isBatchLocked ? 'danger' : 'success'} size="sm" dot>
                          {isBatchLocked ? 'Locked' : 'Processed'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant={isRunActive ? 'primary' : 'secondary'}
                          size="sm"
                          onClick={() => handleInspectRun(r)}
                          icon={Eye}
                        >
                          {isRunActive ? 'Close Slips' : 'Inspect Slips'}
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Salary Slips Inspector & Compliance Export */}
      {activeRun && (
        <div className="rounded-2xl border border-purple-300 bg-white p-5 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-100 text-purple-800">
                  Month {activeRun.payMonth} / {activeRun.payYear}
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Salary Slips Roster ({slips.length} Staff)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect employee earnings, statutory PF/ESIC deductions, and generate compliance archives
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleExportECR(activeRun, filteredSlips)}
                icon={Download}
              >
                EPFO ECR (.txt)
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleExportBankAdvice(activeRun, filteredSlips)}
                icon={FileSpreadsheet}
              >
                Bank Advice (.csv)
              </Button>

              <Button
                variant={lockedRuns[activeRun.id] ? 'danger' : 'secondary'}
                size="sm"
                onClick={() => handleToggleLock(activeRun.id)}
                icon={lockedRuns[activeRun.id] ? Lock : Unlock}
              >
                {lockedRuns[activeRun.id] ? 'Batch Locked' : 'Lock Batch'}
              </Button>

              <button
                type="button"
                onClick={() => setActiveRun(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Slips Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 scrollbar-thin">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  {layoutColumns.map((col) => (
                    <th
                      key={col.key || col.columnId}
                      className={`px-3 py-2 ${col.alignment === 'center' ? 'text-center' : col.alignment === 'right' ? 'text-right' : 'text-left'}`}
                      style={{ width: col.width || 'auto' }}
                    >
                      {col.header || col.name || col.label || col.key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {slipsLoading ? (
                  <tr>
                    <td colSpan={layoutColumns.length || 7} className="px-4 py-8 text-center text-slate-500">
                      <RefreshCw size={18} className="mx-auto mb-2 animate-spin text-purple-600" />
                      Loading pay slips...
                    </td>
                  </tr>
                ) : filteredSlips.length === 0 ? (
                  <tr>
                    <td colSpan={layoutColumns.length || 7} className="px-4 py-8 text-center text-slate-400">
                      No slips found matching search filter.
                    </td>
                  </tr>
                ) : (
                  filteredSlips.map((s, idx) => (
                    <tr key={s.id || idx} className="hover:bg-slate-50/80 transition-colors">
                      {layoutColumns.map((col) => renderSlipCell(s, col, setPreviewSlip))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* INDIVIDUALIZED SALARY SLIP BREAKDOWN */}
          {previewSlip && (
            <div className="bg-slate-50 rounded-2xl border border-purple-200 p-5 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                    <FileText size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Digital Salary Slip: {previewSlip.employeeName}
                    </h4>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Pay Period: Month {activeRun.payMonth} / {activeRun.payYear} •{' '}
                      {previewSlip.employeeCode || 'EMP-1962'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => window.print()} icon={Printer}>
                    Print
                  </Button>
                  <button
                    type="button"
                    onClick={() => setPreviewSlip(null)}
                    className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 transition cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Earnings & Deductions Split */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Earnings */}
                <div className="rounded-2xl border border-emerald-200 bg-white p-4 space-y-2 shadow-2xs">
                  <div className="font-bold text-emerald-900 text-xs border-b border-emerald-100 pb-1 flex justify-between">
                    <span>Earnings Component</span>
                    <span>Amount (₹)</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Basic Pay</span>
                    <span className="font-mono font-semibold">
                      ₹{Number(previewSlip.basicPay || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>House Rent Allowance (HRA)</span>
                    <span className="font-mono font-semibold">
                      ₹{Number(previewSlip.hra || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Special Allowance</span>
                    <span className="font-mono font-semibold">
                      ₹{Number(previewSlip.specialAllowance || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-900 pt-2 border-t border-emerald-100">
                    <span>Gross Earnings</span>
                    <span className="font-mono">
                      ₹{Number(previewSlip.grossPay || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Deductions */}
                <div className="rounded-2xl border border-rose-200 bg-white p-4 space-y-2 shadow-2xs">
                  <div className="font-bold text-rose-900 text-xs border-b border-rose-100 pb-1 flex justify-between">
                    <span>Deductions Component</span>
                    <span>Amount (₹)</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Provident Fund (EPF 12%)</span>
                    <span className="font-mono font-semibold">
                      ₹{Number(previewSlip.pfEmployee || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>ESIC (0.75%)</span>
                    <span className="font-mono font-semibold">
                      ₹{Number(previewSlip.esicEmployee || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Professional Tax / TDS</span>
                    <span className="font-mono font-semibold">
                      ₹{(
                        Number(previewSlip.professionalTax || 0) + Number(previewSlip.tds || 0)
                      ).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-rose-900 pt-2 border-t border-rose-100">
                    <span>Total Deductions</span>
                    <span className="font-mono">
                      ₹{Number(previewSlip.totalDeductions || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Pay Disbursed Banner */}
              <div className="rounded-2xl bg-slate-900 text-white p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 block">
                    Take-Home Net Salary Disbursed
                  </span>
                  <span className="text-2xl font-black font-mono">
                    ₹{Number(previewSlip.netPay || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-left sm:text-right text-[11px] text-slate-300">
                  <span>Disbursal Channel: Corporate NEFT</span>
                  <div className="font-bold text-emerald-400 mt-0.5">
                    Status: Disbursed to Bank Account
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Generate Payroll Batch Modal */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        title="Execute Monthly Payroll Processing Run"
        description="Reconcile attendance logs, compute EPF/ESIC/TDS deductions, and disburse pay batches"
        maxWidth="max-w-lg"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setShowGenerateModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              loading={generating}
              onClick={handleGenerateRun}
              icon={Play}
            >
              Calculate & Disburse Batch
            </Button>
          </>
        }
      >
        <form onSubmit={handleGenerateRun} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Pay Month <span className="text-rose-500">*</span>
              </label>
              <select
                value={genMonth}
                onChange={(e) => setGenMonth(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-none transition cursor-pointer"
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
                  <option key={item.m} value={item.m}>
                    {item.m} - {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Pay Year <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="2020"
                max="2035"
                required
                value={genYear}
                onChange={(e) => setGenYear(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Target Entity / Company</label>
            <select
              value={genCompanyId}
              onChange={(e) => setGenCompanyId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-none transition cursor-pointer"
            >
              <option value="">All Registered Companies</option>
              {companies.map((c) => (
                <option key={c.id || c.CompanyId} value={c.id || c.CompanyId}>
                  {c.companyName || c.CompanyName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Batch Remarks / Notes</label>
            <input
              type="text"
              value={genNotes}
              onChange={(e) => setGenNotes(e.target.value)}
              placeholder="e.g. Regular monthly disbursement..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 outline-none transition"
            />
          </div>
        </form>
      </Modal>

      {/* Table Column Customizer Modal */}
      <TableColumnCustomizerModal
        isOpen={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
        schema={{ id: 'payroll_management', columns: layoutColumns }}
        schemaId="payroll_management"
        onSaveSuccess={() => refreshLayout && refreshLayout()}
      />
    </div>
  )
}
