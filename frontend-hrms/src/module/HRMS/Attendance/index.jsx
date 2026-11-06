import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Smartphone,
  Fingerprint,
  Table2,
  ClipboardList,
  Clock3,
  MapPin,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Download,
  Lock,
  Unlock,
  Check,
  Send,
  Calendar,
  Layers,
  FileSpreadsheet,
  Building2,
  Search,
  Filter,
  Info,
  LayoutGrid,
  List,
  User,
  ChevronRight,
  TrendingUp,
} from 'lucide-react'
import {
  getAttendanceCalendar,
  getMasterRollStatus,
  finalizeMasterRoll,
  pushToPayroll,
  listAttendance
} from '../../../api/attendance'
import { usePageLayout } from '../../../hooks/usePageLayout'
import PageHeader from '../../../components/PageHeader'
import LayoutVersionBadge from '../../../components/LayoutVersionBadge'
import { Button, Badge, Modal, Card } from '../../../components/ui'

const views = [
  {
    key: 'ess-mobile',
    label: 'Mobile App / ESS',
    badge: 'Mobile App',
    icon: Smartphone,
    color: 'purple',
    description: 'Attendance logged via employee smartphone app & GPS geofencing'
  },
  {
    key: 'biometric',
    label: 'Biometric Records',
    badge: 'Hardware Machine',
    icon: Fingerprint,
    color: 'rose',
    description: 'Physical biometric fingerprint / facial recognition machine logs'
  },
  {
    key: 'combined',
    label: 'Consolidated Register',
    badge: 'Reconciled',
    icon: Table2,
    color: 'orange',
    description: 'Unified reconciled register combining all punch sources'
  },
  {
    key: 'master-roll',
    label: 'Master Roll (Payroll)',
    badge: 'Official Lock',
    icon: ClipboardList,
    color: 'emerald',
    description: 'Final validated monthly attendance locked for salary computation'
  },
]

function today() {
  return new Date().toISOString().slice(0, 10)
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7)
}

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function sourceLabel(value) {
  if (value === 'ESSMobile') return 'Mobile App'
  if (value === 'Biometric') return 'Biometric Machine'
  return value || '-'
}

function statusBadgeTone(status) {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'present') return 'success'
  if (normalized === 'late') return 'warning'
  if (normalized === 'absent') return 'danger'
  if (normalized === 'leave') return 'info'
  if (normalized.includes('half')) return 'warning'
  return 'slate'
}

function calendarCellClass(code) {
  switch (code) {
    case 'P':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-bold'
    case 'L':
      return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 font-semibold'
    case 'A':
      return 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 font-bold'
    case 'HD':
      return 'bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100 font-semibold'
    case 'LV':
      return 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100 font-semibold'
    case 'WO':
      return 'bg-slate-100 text-slate-500 border-slate-200 font-medium'
    case 'H':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold'
    case 'MP':
      return 'bg-orange-50 text-orange-700 border-orange-200 font-bold'
    default:
      return 'bg-slate-50/40 text-slate-300 border-slate-100'
  }
}

export default function Attendance() {
  const navigate = useNavigate()
  const { view } = useParams()
  const activeView = views.find((item) => item.key === view) || views[0]

  const [month, setMonth] = useState(currentMonth())
  const [displayMode, setDisplayMode] = useState('matrix') // 'matrix', 'cards' (mobile roster), or 'daily'
  const [calendarData, setCalendarData] = useState(null)
  const [dailyRows, setDailyRows] = useState([])
  const [lockStatus, setLockStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')

  // Master Roll Validation State
  const [hrFinalRemarks, setHrFinalRemarks] = useState('')
  const [employeeRemarks, setEmployeeRemarks] = useState({})
  const [employeeValidations, setEmployeeValidations] = useState({})
  const [isSubmittingLock, setIsSubmittingLock] = useState(false)
  const [isPushingPayroll, setIsPushingPayroll] = useState(false)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setError('')
    setActionSuccess('')
    try {
      // 1. Fetch Calendar Matrix
      const cal = await getAttendanceCalendar({ month, view: activeView.key })
      setCalendarData(cal)

      // 2. Fetch Master Roll Lock Status
      const lock = await getMasterRollStatus({ month })
      setLockStatus(lock)
      if (lock?.finalRemarks) {
        setHrFinalRemarks(lock.finalRemarks)
      }
      if (lock?.validationData) {
        try {
          const parsed = JSON.parse(lock.validationData)
          if (parsed.remarks) setEmployeeRemarks(parsed.remarks)
          if (parsed.validations) setEmployeeValidations(parsed.validations)
        } catch {
          // ignore
        }
      }

      // 3. If in daily view, fetch daily logs
      if (displayMode === 'daily') {
        const logs = await listAttendance({ month, source: activeView.key })
        setDailyRows(Array.isArray(logs) ? logs : [])
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load attendance records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [month, activeView.key, displayMode])

  const days = calendarData?.days || []
  const employees = calendarData?.employees || []
  const isLocked = Boolean(lockStatus?.isLocked)

  // Filter employees by Search & Department
  const filteredEmployees = useMemo(() => {
    let list = Array.isArray(employees) ? [...employees] : []

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter((emp) => {
        const name = String(emp.employeeName || emp.EmployeeName || '').toLowerCase()
        const code = String(emp.employeeCode || emp.EmployeeCode || '').toLowerCase()
        const dept = String(emp.departmentName || emp.DepartmentName || '').toLowerCase()
        return name.includes(q) || code.includes(q) || dept.includes(q)
      })
    }

    if (departmentFilter !== 'all') {
      list = list.filter((emp) => {
        const d = String(emp.departmentName || emp.DepartmentName || '').toLowerCase()
        return d === departmentFilter.toLowerCase()
      })
    }

    return list
  }, [employees, searchQuery, departmentFilter])

  // Available unique departments for filter dropdown
  const departments = useMemo(() => {
    const set = new Set()
    employees.forEach((e) => {
      const d = e.departmentName || e.DepartmentName
      if (d) set.add(d)
    })
    return Array.from(set)
  }, [employees])

  // Overall KPI Statistics
  const overallStats = useMemo(() => {
    let totalPresentDays = 0
    let totalAbsentDays = 0
    let totalPayableDays = 0
    let totalExceptions = 0

    filteredEmployees.forEach((emp) => {
      const s = emp.summary || emp.Summary || {}
      totalPresentDays += Number(s.presentDays || s.PresentDays || 0)
      totalAbsentDays += Number(s.absentDays || s.AbsentDays || 0)
      totalPayableDays += Number(s.payableDays || s.PayableDays || 0)
      totalExceptions += Number(s.exceptions || s.Exceptions || 0)
    })

    return {
      totalEmployees: filteredEmployees.length,
      totalPresentDays,
      totalAbsentDays,
      totalPayableDays,
      totalExceptions
    }
  }, [filteredEmployees])

  // Handle Master Roll Finalization
  const handleFinalizeMasterRoll = async () => {
    if (!hrFinalRemarks.trim()) {
      setError('Please provide mandatory HR final validation remarks before locking.')
      return
    }

    setIsSubmittingLock(true)
    setError('')
    try {
      const validationPayload = {
        remarks: employeeRemarks,
        validations: employeeValidations,
        finalizedAt: new Date().toISOString()
      }

      await finalizeMasterRoll({
        month,
        finalRemarks: hrFinalRemarks.trim(),
        validationData: JSON.stringify(validationPayload)
      })

      setActionSuccess(`Master Roll for ${month} successfully locked and sealed for payroll.`)
      setConfirmModalOpen(false)
      await loadData()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to finalize master roll.')
    } finally {
      setIsSubmittingLock(false)
    }
  }

  // Handle Push to Payroll Engine
  const handlePushToPayroll = async () => {
    setIsPushingPayroll(true)
    setError('')
    setActionSuccess('')
    try {
      await pushToPayroll({ month })
      setActionSuccess(`Attendance for ${month} pushed to payroll computation engine.`)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to push master roll to payroll.')
    } finally {
      setIsPushingPayroll(false)
    }
  }

  // CSV Export
  const handleExportCSV = () => {
    if (!filteredEmployees.length) return

    const headers = [
      'Employee Code',
      'Employee Name',
      'Department',
      'Designation',
      ...days.map((d) => `Day ${d}`),
      'Present',
      'Absent',
      'Leave',
      'Weekly Off',
      'Payable Days'
    ]

    const rows = filteredEmployees.map((emp) => {
      const s = emp.summary || emp.Summary || {}
      const empDays = emp.days || emp.Days || []
      const dayCodes = days.map((dayNum) => {
        const dObj = empDays.find((d) => (d.day || d.Day) === dayNum)
        return dObj?.code || dObj?.Code || '-'
      })

      return [
        `"${emp.employeeCode || emp.EmployeeCode || ''}"`,
        `"${emp.employeeName || emp.EmployeeName || ''}"`,
        `"${emp.departmentName || emp.DepartmentName || ''}"`,
        `"${emp.designationName || emp.DesignationName || ''}"`,
        ...dayCodes.map((c) => `"${c}"`),
        s.presentDays || s.PresentDays || 0,
        s.absentDays || s.AbsentDays || 0,
        s.leaveDays || s.LeaveDays || 0,
        s.weeklyOffDays || s.WeeklyOffDays || 0,
        s.payableDays || s.PayableDays || 0
      ]
    })

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Attendance_${activeView.key}_${month}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-3.5 antialiased max-w-full pb-10">
      {/* ========================================================= */}
      {/* 1. Page Header & Action Controls                          */}
      {/* ========================================================= */}
      <PageHeader
        icon={activeView.icon}
        title={activeView.label}
        description={activeView.description}
        badge={activeView.badge}
        badgeTone="purple"
      >
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <LayoutVersionBadge entity="attendance" version={1.0} />

          {/* Month Capsule */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
            <Calendar size={14} className="text-purple-700 shrink-0" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Month:</span>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="text-xs font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
            />
          </div>

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
            variant="secondary"
            size="sm"
            onClick={handleExportCSV}
            disabled={!filteredEmployees.length}
            icon={Download}
          >
            Export CSV
          </Button>
        </div>
      </PageHeader>

      {/* ========================================================= */}
      {/* 2. Mode / Views Segmented Bar (Horizontal Scroll on Mobile) */}
      {/* ========================================================= */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-2 sm:p-2.5 shadow-2xs overflow-hidden">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          {views.map((v) => {
            const Icon = v.icon
            const isActive = v.key === activeView.key

            return (
              <button
                key={v.key}
                type="button"
                onClick={() => navigate(`/module/hrms/attendance/${v.key}`)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                title={v.description}
              >
                <Icon size={14} className={isActive ? 'text-white' : 'text-slate-500'} />
                <span>{v.label}</span>
                {v.key === 'master-roll' && isLocked && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      isActive ? 'bg-purple-900/60 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    Locked
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. Alerts & Master Roll Status Box                        */}
      {/* ========================================================= */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800 flex items-center gap-2 animate-in fade-in duration-150">
          <AlertCircle size={15} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Master Roll Compact Status Box */}
      {activeView.key === 'master-roll' && (
        <div
          className={`rounded-2xl border p-3 sm:p-4 transition ${
            isLocked
              ? 'border-emerald-200 bg-emerald-50/50 shadow-2xs'
              : 'border-amber-200 bg-amber-50/50 shadow-2xs'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                  isLocked ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                }`}
              >
                {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                    {isLocked ? 'Master Roll Locked for Payroll' : 'Master Roll in Draft'}
                  </span>
                  <Badge tone={isLocked ? 'success' : 'warning'} size="sm">
                    {isLocked ? 'LOCKED' : 'DRAFT'}
                  </Badge>
                </div>
                {isLocked && (
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Finalized by <strong className="text-slate-800">{lockStatus?.lockedByName || 'HR'}</strong> on{' '}
                    {formatDate(lockStatus?.lockedAt)}
                    {lockStatus?.finalRemarks && ` • "${lockStatus.finalRemarks}"`}
                  </p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {!isLocked ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setConfirmModalOpen(true)}
                  icon={Lock}
                >
                  Finalize & Lock Roll
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handlePushToPayroll}
                  disabled={isPushingPayroll}
                  icon={Send}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isPushingPayroll ? 'Pushing...' : 'Push to Payroll Engine'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. KPI Summary Micro-Cards (Clean responsive grid)        */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
            Total Staff
          </div>
          <div className="text-xl font-extrabold text-slate-900 font-mono mt-1">
            {overallStats.totalEmployees}
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200/80 bg-white p-3 shadow-2xs">
          <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider truncate">
            Present Days
          </div>
          <div className="text-xl font-extrabold text-emerald-700 font-mono mt-1">
            {overallStats.totalPresentDays}
          </div>
        </div>

        <div className="rounded-2xl border border-rose-200/80 bg-white p-3 shadow-2xs">
          <div className="text-[10px] font-bold text-rose-600 uppercase tracking-wider truncate">
            Absent Days
          </div>
          <div className="text-xl font-extrabold text-rose-700 font-mono mt-1">
            {overallStats.totalAbsentDays}
          </div>
        </div>

        <div className="rounded-2xl border border-purple-200/80 bg-white p-3 shadow-2xs">
          <div className="text-[10px] font-bold text-purple-600 uppercase tracking-wider truncate">
            Payable Days
          </div>
          <div className="text-xl font-extrabold text-purple-800 font-mono mt-1">
            {overallStats.totalPayableDays}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200/80 bg-white p-3 shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider truncate">
            Exceptions
          </div>
          <div className="text-xl font-extrabold text-amber-700 font-mono mt-1">
            {overallStats.totalExceptions}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. Toolbar: Search, Dept Filter, & View Mode Switcher     */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search bar */}
          <div className="relative w-full sm:w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employee or code..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-purple-600 focus:outline-none shadow-2xs"
            />
          </div>

          {/* Department Filter */}
          {departments.length > 0 && (
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-purple-600 focus:outline-none cursor-pointer shadow-2xs"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* View Mode Toggle: Matrix vs Roster Cards vs Daily */}
        <div className="inline-flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/70 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setDisplayMode('matrix')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              displayMode === 'matrix'
                ? 'bg-white text-purple-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table2 size={13} />
            <span>Matrix (31d)</span>
          </button>

          <button
            type="button"
            onClick={() => setDisplayMode('cards')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              displayMode === 'cards'
                ? 'bg-white text-purple-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid size={13} />
            <span>Roster Cards</span>
          </button>

          {activeView.key !== 'master-roll' && (
            <button
              type="button"
              onClick={() => setDisplayMode('daily')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                displayMode === 'daily'
                  ? 'bg-white text-purple-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List size={13} />
              <span>Punch Logs</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 6. Main Data Presentation                                 */}
      {/* ========================================================= */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs font-semibold text-slate-500 shadow-2xs">
          <div className="flex items-center justify-center gap-2 mb-2">
            <RefreshCw size={18} className="animate-spin text-purple-700" />
            <span className="text-sm font-bold text-slate-700">Loading {activeView.label} records...</span>
          </div>
          <p className="text-xs text-slate-400">Aggregating punch logs and computing payable hours for {month}</p>
        </div>
      ) : displayMode === 'daily' && activeView.key !== 'master-roll' ? (
        /* Daily Punch Log View */
        <DailyPunchTable rows={dailyRows} activeView={activeView} />
      ) : displayMode === 'cards' ? (
        /* Mobile-Friendly Roster Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredEmployees.map((emp) => {
            const empId = emp.employeeId || emp.EmployeeId
            const s = emp.summary || emp.Summary || {}
            const empDays = emp.days || emp.Days || []
            const present = Number(s.presentDays || s.PresentDays || 0)
            const payable = Number(s.payableDays || s.PayableDays || 0)
            const absent = Number(s.absentDays || s.AbsentDays || 0)
            const rate = days.length > 0 ? Math.round((present / days.length) * 100) : 0

            return (
              <div
                key={empId}
                className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:shadow-sm transition"
              >
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="min-w-0">
                    <div className="font-extrabold text-sm text-slate-900 truncate">
                      {emp.employeeName || emp.EmployeeName}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                      <span className="font-mono text-purple-700 font-semibold">
                        {emp.employeeCode || emp.EmployeeCode}
                      </span>
                      <span>•</span>
                      <span className="truncate">{emp.departmentName || emp.DepartmentName || 'General'}</span>
                    </div>
                  </div>
                  <Badge tone={rate >= 75 ? 'success' : rate >= 50 ? 'warning' : 'danger'} size="sm">
                    {rate}%
                  </Badge>
                </div>

                {/* Metrics bar */}
                <div className="grid grid-cols-3 gap-2 py-3 border-b border-slate-100 text-center text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Present</div>
                    <div className="font-bold text-emerald-700 text-sm mt-0.5">{present}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Absent</div>
                    <div className="font-bold text-rose-700 text-sm mt-0.5">{absent}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Payable</div>
                    <div className="font-extrabold text-purple-800 text-sm mt-0.5">{payable}</div>
                  </div>
                </div>

                {/* Recent punch pills preview */}
                <div className="pt-2.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Recent Days Status
                  </div>
                  <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1">
                    {days.slice(-7).map((dNum) => {
                      const dObj = empDays.find((d) => (d.day || d.Day) === dNum)
                      const code = dObj?.code || dObj?.Code || '-'
                      return (
                        <div
                          key={dNum}
                          className={`flex-1 min-w-[28px] h-7 rounded-lg flex items-center justify-center text-[10px] font-bold border ${calendarCellClass(
                            code
                          )}`}
                          title={`Day ${dNum}: ${code}`}
                        >
                          {code}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}

          {filteredEmployees.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-xs text-slate-500 font-medium">
              No employee attendance records matched your filter criteria.
            </div>
          )}
        </div>
      ) : (
        /* 31-Day Matrix Table with Sticky Employee Column */
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
          {/* Legend row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-2.5 bg-slate-50/90 border-b border-slate-200 gap-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>{activeView.label} Matrix</span>
              <span className="text-slate-400 font-normal">({month} • Days 1-{days.length})</span>
            </span>

            {/* Attendance Legend Chips */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">P: Present</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">L: Late</span>
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">A: Absent</span>
              <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">HD: Half</span>
              <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">LV: Leave</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">WO: Off</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">H: Holiday</span>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[620px] relative scrollbar-thin">
            <table className="min-w-full text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 sticky top-0 z-20 shadow-2xs font-bold">
                <tr>
                  {/* Sticky Left: Employee Column */}
                  <th className="sticky left-0 z-30 bg-slate-100 px-4 py-3 text-left w-64 min-w-[220px] border-r border-b border-slate-200">
                    Employee Details
                  </th>

                  {/* Day Columns: 1 to 31 */}
                  {days.map((dayNum) => (
                    <th
                      key={dayNum}
                      className="px-2 py-2.5 text-center min-w-[34px] border-r border-b border-slate-200 text-[11px]"
                    >
                      {dayNum}
                    </th>
                  ))}

                  {/* Monthly Totals Columns */}
                  <th className="px-3 py-2 text-center bg-emerald-50 text-emerald-900 border-r border-b border-slate-200">
                    P
                  </th>
                  <th className="px-3 py-2 text-center bg-rose-50 text-rose-900 border-r border-b border-slate-200">
                    A
                  </th>
                  <th className="px-3 py-2 text-center bg-sky-50 text-sky-900 border-r border-b border-slate-200">
                    LV
                  </th>
                  <th className="px-3 py-2 text-center bg-slate-100 text-slate-800 border-r border-b border-slate-200">
                    WO
                  </th>
                  <th className="px-3 py-2 text-center bg-purple-100 text-purple-900 border-r border-b border-slate-200 font-black">
                    Payable
                  </th>

                  {/* Master Roll Validation Columns */}
                  {activeView.key === 'master-roll' && (
                    <>
                      <th className="px-4 py-2 text-center bg-slate-100 border-r border-b border-slate-200 min-w-[110px]">
                        HR Validation
                      </th>
                      <th className="px-4 py-2 text-left bg-slate-100 border-b border-slate-200 min-w-[200px]">
                        Final Remarks
                      </th>
                    </>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredEmployees.map((emp) => {
                  const empId = emp.employeeId || emp.EmployeeId
                  const empDays = emp.days || emp.Days || []
                  const s = emp.summary || emp.Summary || {}
                  const isValidated = employeeValidations[empId] ?? true
                  const empRemark = employeeRemarks[empId] || ''

                  return (
                    <tr key={empId} className="hover:bg-purple-50/20 transition-colors">
                      {/* Sticky Left: Employee Column */}
                      <td className="sticky left-0 z-10 bg-white px-4 py-2.5 border-r border-slate-200 shadow-xs">
                        <div className="font-extrabold text-slate-900 truncate">
                          {emp.employeeName || emp.EmployeeName}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          <span className="font-mono font-semibold text-purple-700">
                            {emp.employeeCode || emp.EmployeeCode}
                          </span>
                          <span>•</span>
                          <span className="truncate">
                            {emp.designationName || emp.DesignationName || 'Staff'}
                          </span>
                        </div>
                      </td>

                      {/* Day Columns */}
                      {days.map((dayNum) => {
                        const dObj = empDays.find((d) => (d.day || d.Day) === dayNum)
                        const code = dObj?.code || dObj?.Code || '-'
                        const status = dObj?.status || dObj?.Status || 'No Record'
                        const inTime = dObj?.checkInAt || dObj?.CheckInAt || ''
                        const outTime = dObj?.checkOutAt || dObj?.CheckOutAt || ''

                        return (
                          <td
                            key={dayNum}
                            title={`${emp.employeeName || ''} - Day ${dayNum}: ${status}${
                              inTime ? ` (${inTime} - ${outTime || 'Open'})` : ''
                            }`}
                            className={`px-1 py-1 text-center border-r border-slate-100 font-semibold cursor-default ${calendarCellClass(
                              code
                            )}`}
                          >
                            <span className="inline-block text-[11px]">{code}</span>
                          </td>
                        )
                      })}

                      {/* Summary Columns */}
                      <td className="px-3 py-2 text-center font-bold text-emerald-800 bg-emerald-50/50 border-r border-slate-200 font-mono">
                        {s.presentDays || s.PresentDays || 0}
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-rose-800 bg-rose-50/50 border-r border-slate-200 font-mono">
                        {s.absentDays || s.AbsentDays || 0}
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-sky-800 bg-sky-50/50 border-r border-slate-200 font-mono">
                        {s.leaveDays || s.LeaveDays || 0}
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-slate-700 bg-slate-50 border-r border-slate-200 font-mono">
                        {s.weeklyOffDays || s.WeeklyOffDays || 0}
                      </td>
                      <td className="px-3 py-2 text-center font-black text-purple-900 bg-purple-100/60 border-r border-slate-200 font-mono">
                        {s.payableDays || s.PayableDays || 0}
                      </td>

                      {/* Master Roll Validation Controls */}
                      {activeView.key === 'master-roll' && (
                        <>
                          <td className="px-3 py-2 text-center border-r border-slate-200">
                            {isLocked ? (
                              <Badge tone="success" size="sm">
                                Validated
                              </Badge>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setEmployeeValidations((prev) => ({
                                    ...prev,
                                    [empId]: !isValidated
                                  }))
                                }
                                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                                  isValidated
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-slate-100 text-slate-600 border border-slate-300'
                                }`}
                              >
                                <Check
                                  size={12}
                                  className={isValidated ? 'text-emerald-700' : 'text-slate-400'}
                                />
                                <span>{isValidated ? 'Verified' : 'Pending'}</span>
                              </button>
                            )}
                          </td>
                          <td className="px-3 py-2 text-left">
                            {isLocked ? (
                              <span className="text-xs text-slate-700 font-medium">
                                {empRemark || 'Approved by HR for payroll'}
                              </span>
                            ) : (
                              <input
                                type="text"
                                value={empRemark}
                                onChange={(e) =>
                                  setEmployeeRemarks((prev) => ({
                                    ...prev,
                                    [empId]: e.target.value
                                  }))
                                }
                                placeholder="HR validation remarks..."
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-800 focus:bg-white focus:border-purple-600 focus:outline-none"
                              />
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  )
                })}

                {filteredEmployees.length === 0 && (
                  <tr>
                    <td
                      colSpan={days.length + (activeView.key === 'master-roll' ? 8 : 6)}
                      className="px-4 py-12 text-center text-xs text-slate-500 font-semibold"
                    >
                      No employee attendance records matched this criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. Master Roll Permanent Finalization Confirmation Modal   */}
      {/* ========================================================= */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Finalize & Lock Master Roll"
        description={`Freeze attendance register for ${month} before final salary computation`}
        maxWidth="max-w-lg"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setConfirmModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              loading={isSubmittingLock}
              disabled={!hrFinalRemarks.trim()}
              onClick={handleFinalizeMasterRoll}
              icon={Lock}
            >
              Confirm & Lock Roll
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900 space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-amber-950">
              <AlertCircle size={15} className="text-amber-700 shrink-0" />
              <span>Permanent Lock Acknowledgment</span>
            </div>
            <p>Once finalized and locked:</p>
            <ul className="list-disc pl-4 space-y-1 text-amber-900 font-medium">
              <li>Attendance for {month} will be <strong>strictly read-only</strong>.</li>
              <li>No further punch marks, regularizations, or approvals will be permitted.</li>
              <li>Finalized payable days will be frozen and pushed to final Payroll.</li>
            </ul>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Final HR Validation Remarks <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={hrFinalRemarks}
              onChange={(e) => setHrFinalRemarks(e.target.value)}
              placeholder="Enter mandatory final validation note..."
              className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-800 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 focus:outline-none transition"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

const DEFAULT_PUNCH_COLUMNS = [
  { key: 'employee', header: 'Employee', alignment: 'left' },
  { key: 'code', header: 'Code', alignment: 'left', width: '100px' },
  { key: 'date', header: 'Date', alignment: 'left', width: '120px' },
  { key: 'inTime', header: 'In Time', alignment: 'left', width: '100px' },
  { key: 'outTime', header: 'Out Time', alignment: 'left', width: '100px' },
  { key: 'duration', header: 'Duration', alignment: 'left', width: '100px' },
  { key: 'status', header: 'Status', alignment: 'left', width: '110px' },
  { key: 'source', header: 'Punch Source', alignment: 'left', width: '130px' },
  { key: 'device', header: 'Device / Geo', alignment: 'left', width: '150px' },
  { key: 'approval', header: 'Approval', alignment: 'left', width: '110px' }
]

function renderPunchCell(row, col) {
  const key = (col.key || '').toLowerCase()
  const alignClass =
    col.alignment === 'center' ? 'text-center' : col.alignment === 'right' ? 'text-right' : 'text-left'
  const status = row.status || row.Status
  const minutes = row.workMinutes ?? row.WorkMinutes

  if (key === 'employee' || key === 'name') {
    return (
      <td key={col.key} className={`px-4 py-2.5 font-bold text-slate-900 ${alignClass}`}>
        {row.employeeName || row.EmployeeName}
      </td>
    )
  }

  if (key === 'code' || key === 'employeecode') {
    return (
      <td key={col.key} className={`px-4 py-2.5 font-mono text-purple-700 font-semibold ${alignClass}`}>
        {row.employeeCode || row.EmployeeCode}
      </td>
    )
  }

  if (key === 'date' || key === 'attendancedate') {
    return (
      <td key={col.key} className={`px-4 py-2.5 text-slate-600 ${alignClass}`}>
        {formatDate(row.attendanceDate || row.AttendanceDate)}
      </td>
    )
  }

  if (key === 'intime' || key === 'checkin') {
    return (
      <td key={col.key} className={`px-4 py-2.5 font-mono font-medium text-emerald-700 ${alignClass}`}>
        {formatTime(row.checkInAt || row.CheckInAt)}
      </td>
    )
  }

  if (key === 'outtime' || key === 'checkout') {
    return (
      <td key={col.key} className={`px-4 py-2.5 font-mono font-medium text-slate-700 ${alignClass}`}>
        {formatTime(row.checkOutAt || row.CheckOutAt)}
      </td>
    )
  }

  if (key === 'duration' || key === 'workminutes') {
    return (
      <td key={col.key} className={`px-4 py-2.5 text-slate-600 font-medium ${alignClass}`}>
        {minutes ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : '-'}
      </td>
    )
  }

  if (key === 'status') {
    return (
      <td key={col.key} className={`px-4 py-2.5 ${alignClass}`}>
        <Badge tone={statusBadgeTone(status)} size="sm">
          {status || 'Present'}
        </Badge>
      </td>
    )
  }

  if (key === 'source' || key === 'punchsource') {
    return (
      <td key={col.key} className={`px-4 py-2.5 text-slate-600 font-medium ${alignClass}`}>
        {sourceLabel(row.source || row.Source)}
      </td>
    )
  }

  if (key === 'device' || key === 'location' || key === 'geo') {
    return (
      <td key={col.key} className={`px-4 py-2.5 text-slate-500 truncate max-w-[160px] ${alignClass}`}>
        {row.locationName || row.LocationName || row.deviceId || row.DeviceId || '-'}
      </td>
    )
  }

  if (key === 'approval' || key === 'isapproved') {
    const isApp = row.isApproved || row.IsApproved
    return (
      <td key={col.key} className={`px-4 py-2.5 font-medium ${alignClass}`}>
        <Badge tone={isApp ? 'success' : 'warning'} size="sm">
          {isApp ? 'Approved' : 'Pending'}
        </Badge>
      </td>
    )
  }

  return (
    <td key={col.key} className={`px-4 py-2.5 text-slate-700 ${alignClass}`}>
      {row[col.key] != null ? String(row[col.key]) : '—'}
    </td>
  )
}

function DailyPunchTable({ rows, activeView }) {
  const { layoutMeta, columns: layoutColumns } = usePageLayout('attendance_punches', DEFAULT_PUNCH_COLUMNS)

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
          {activeView.label} • Daily Raw Punch Logs
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Detailed check-in/out stamps, hardware device IDs, geo-coordinates, and approval status.
        </p>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="min-w-full text-xs">
          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              {layoutColumns.map((col) => (
                <th
                  key={col.key}
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
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => {
              const id = row.attendanceId || row.AttendanceId
              return (
                <tr key={id} className="hover:bg-purple-50/20 transition-colors">
                  {layoutColumns.map((col) => renderPunchCell(row, col))}
                </tr>
              )
            })}

            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={layoutColumns.length || 10}
                  className="px-4 py-12 text-center text-xs text-slate-500 font-semibold"
                >
                  No daily punch logs recorded for this period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
