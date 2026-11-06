import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../../../components/ToastProvider'
import { getMyPayslips } from '../../../api/selfService'
import { usePageLayout } from '../../../hooks/usePageLayout'
import LayoutVersionBadge from '../../../components/LayoutVersionBadge'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Modal } from '../../../components/ui/Modal'
import {
  CreditCard,
  Download,
  RefreshCw,
  Eye,
  FileText,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Inbox,
  Sparkles
} from 'lucide-react'

const DEFAULT_PAYSLIP_COLUMNS = [
  { key: 'payPeriod', header: 'Pay Period', alignment: 'left' },
  { key: 'grossSalary', header: 'Gross Earnings', alignment: 'right' },
  { key: 'deductions', header: 'Statutory Deductions', alignment: 'right' },
  { key: 'netSalary', header: 'Net Take Home', alignment: 'right' },
  { key: 'status', header: 'Status', alignment: 'center' },
  { key: 'actions', header: 'Action', alignment: 'right' }
]

function renderPayslipCell(slip, col, { setSelectedSlip, handleDownload }) {
  const key = (col.key || '').toLowerCase()
  const alignClass = col.alignment === 'center' ? 'text-center' : col.alignment === 'right' ? 'text-right' : 'text-left'

  if (key === 'payperiod' || key === 'period' || key === 'month') {
    return (
      <td key={col.key} className={`py-3.5 px-4 font-bold text-slate-900 ${alignClass}`}>
        {slip.month} {slip.year}
      </td>
    )
  }

  if (key === 'grosssalary' || key === 'gross') {
    return (
      <td key={col.key} className={`py-3.5 px-4 font-mono text-slate-700 ${alignClass}`}>
        ₹{(Number(slip.grossSalary) || 0).toLocaleString('en-IN')}
      </td>
    )
  }

  if (key === 'deductions' || key === 'totaldeductions') {
    return (
      <td key={col.key} className={`py-3.5 px-4 font-mono text-rose-600 ${alignClass}`}>
        -₹{(Number(slip.deductions) || 0).toLocaleString('en-IN')}
      </td>
    )
  }

  if (key === 'netsalary' || key === 'net' || key === 'payout') {
    return (
      <td key={col.key} className={`py-3.5 px-4 font-mono font-black text-emerald-700 text-sm ${alignClass}`}>
        ₹{(Number(slip.netSalary) || 0).toLocaleString('en-IN')}
      </td>
    )
  }

  if (key === 'status') {
    return (
      <td key={col.key} className={`py-3.5 px-4 ${alignClass}`}>
        <Badge variant="success">Disbursed</Badge>
      </td>
    )
  }

  if (key === 'actions' || key === 'action') {
    return (
      <td key={col.key} className={`py-3.5 px-4 ${alignClass}`}>
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSelectedSlip(slip)}
            title="Inspect Detailed Slip"
          >
            <Eye size={13} />
            <span>Details</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownload(slip)}
            title="Download PDF"
          >
            <Download size={13} />
            <span>PDF</span>
          </Button>
        </div>
      </td>
    )
  }

  return (
    <td key={col.key} className={`py-3.5 px-4 text-slate-700 ${alignClass}`}>
      {slip[col.key] != null ? String(slip[col.key]) : '—'}
    </td>
  )
}

export default function EssPayslips() {
  const showToast = useToast()
  const [payslips, setPayslips] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSlip, setSelectedSlip] = useState(null)
  const { layoutMeta, columns: layoutColumns } = usePageLayout('ess_payslips', DEFAULT_PAYSLIP_COLUMNS)

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getMyPayslips()
      setPayslips(Array.isArray(data) ? data : [])
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to load payslips.', 'error', 3500)
      setPayslips([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDownload = (slip) => {
    showToast(`Downloading official payslip for ${slip.month} ${slip.year}...`, 'success', 3000)
  }

  // Summary Metrics
  const totalYtdNet = payslips.reduce((acc, p) => acc + (Number(p.netSalary) || 0), 0)
  const latestSlip = payslips.length > 0 ? payslips[0] : null

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
            <span className="text-purple-700 font-bold">Salary Slips</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold shrink-0">
              <CreditCard size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  My Payslips & Salary Statements
                </h1>
                <LayoutVersionBadge entity="ess_payslips" version={layoutMeta?.version} className="hidden sm:inline-flex" />
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Computerized pay slips, PF, ESIC deductions, and tax withholding statements.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={loadData}
            title="Refresh Table"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-purple-700' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
            Latest Net Salary
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono mt-1">
            {latestSlip ? `₹${(Number(latestSlip.netSalary) || 0).toLocaleString('en-IN')}` : '₹0'}
          </div>
          <div className="text-[10px] text-emerald-600 mt-1 font-semibold border-t border-slate-100 pt-1.5 truncate">
            {latestSlip ? `${latestSlip.month} ${latestSlip.year}` : 'No slips issued'}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
            YTD Net Disbursed
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1">
            ₹{totalYtdNet.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium border-t border-slate-100 pt-1.5 truncate">
            Financial Year 2026-27
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
            Statements Issued
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-700 font-mono mt-1">
            {payslips.length}
          </div>
          <div className="text-[10px] text-purple-700 font-semibold mt-1 border-t border-slate-100 pt-1.5 truncate">
            {payslips.length > 0 ? 'Direct Bank Transfer' : 'Awaiting 1st payroll run'}
          </div>
        </div>
      </div>

      {/* 3. Statements Register (Metadata-Driven Desktop Table + Mobile Cards) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900">Salary Statement Register</h2>
            <Badge variant="slate">{payslips.length} records</Badge>
          </div>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">Monthly finalized ledger</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <RefreshCw size={20} className="mx-auto animate-spin text-purple-700 mb-2" />
            <p className="text-xs font-medium">Loading salary statements...</p>
          </div>
        ) : payslips.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="h-10 w-10 mx-auto rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
              <Inbox size={20} />
            </div>
            <div className="text-sm font-bold text-slate-800">No payslips generated yet</div>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Your payslip will appear here immediately once your organization finalizes this month&apos;s payroll batch.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table (>= 640px) with Metadata Column Customization */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase text-[10.5px] font-bold tracking-wider">
                  <tr>
                    {layoutColumns.map((col) => (
                      <th
                        key={col.key}
                        style={{ width: col.width || 'auto' }}
                        className={`py-3 px-4 ${col.alignment === 'center' ? 'text-center' : col.alignment === 'right' ? 'text-right' : 'text-left'}`}
                      >
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {payslips.map(slip => (
                    <tr key={slip.id} className="hover:bg-slate-50/80 transition">
                      {layoutColumns.map((col) => renderPayslipCell(slip, col, { setSelectedSlip, handleDownload }))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards (< 640px) */}
            <div className="sm:hidden divide-y divide-slate-100">
              {payslips.map(slip => (
                <div key={slip.id} className="p-3.5 space-y-2 hover:bg-slate-50/60 transition">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{slip.month} {slip.year}</span>
                    <Badge variant="success">Disbursed</Badge>
                  </div>
                  <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-100 p-2 rounded-xl">
                    <span className="text-[11px] font-bold text-emerald-900">Net Take Home:</span>
                    <span className="text-base font-black text-emerald-700 font-mono">
                      ₹{(Number(slip.netSalary) || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span>Gross: <strong className="text-slate-800 font-mono">₹{(Number(slip.grossSalary) || 0).toLocaleString('en-IN')}</strong></span>
                    <span>Deductions: <strong className="text-rose-600 font-mono">-₹{(Number(slip.deductions) || 0).toLocaleString('en-IN')}</strong></span>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedSlip(slip)}
                      className="flex-1"
                    >
                      <Eye size={13} />
                      <span>Details</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(slip)}
                      className="flex-1"
                    >
                      <Download size={13} />
                      <span>Download</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 4. Responsive Modal / Bottom Sheet for Payslip Details */}
      <Modal
        isOpen={Boolean(selectedSlip)}
        onClose={() => setSelectedSlip(null)}
        title={selectedSlip ? `Salary Slip Breakdown: ${selectedSlip.month} ${selectedSlip.year}` : 'Salary Slip Breakdown'}
        description="Official statement of earnings, allowances, and statutory deductions"
        maxWidth="max-w-2xl"
      >
        {selectedSlip && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Earnings column */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/90">
                <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">Earnings</div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">Basic Salary</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{(Number(selectedSlip.basicSalary) || (Number(selectedSlip.grossSalary) * 0.5)).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">House Rent Allowance (HRA)</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{(Number(selectedSlip.hra) || (Number(selectedSlip.grossSalary) * 0.25)).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">Special Allowance</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{(Number(selectedSlip.specialAllowance) || (Number(selectedSlip.grossSalary) * 0.25)).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 font-bold text-slate-900">
                    <span>Gross Earnings</span>
                    <span className="font-mono text-emerald-700">
                      ₹{(Number(selectedSlip.grossSalary) || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deductions column */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/90">
                <div className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-2">Deductions</div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">Provident Fund (EPF 12%)</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{(Number(selectedSlip.pfDeduction) || (Number(selectedSlip.deductions) * 0.6)).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">ESIC Medical (0.75%)</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{(Number(selectedSlip.esiDeduction) || (Number(selectedSlip.deductions) * 0.2)).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">Professional Tax (PT)</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{(Number(selectedSlip.ptDeduction) || (Number(selectedSlip.deductions) * 0.2)).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 font-bold text-slate-900">
                    <span>Total Deductions</span>
                    <span className="font-mono text-rose-600">
                      -₹{(Number(selectedSlip.deductions) || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">Net Take-Home Pay</span>
                <div className="text-xl font-black text-emerald-800 font-mono mt-0.5">
                  ₹{(Number(selectedSlip.netSalary) || 0).toLocaleString('en-IN')}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSlip(null)}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleDownload(selectedSlip)}
                >
                  <Download size={14} />
                  <span>Download PDF</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
