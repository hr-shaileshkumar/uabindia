import React, { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useToast } from '../../../components/ToastProvider'
import { getAllNominations, nominateEmployee, updateNominationAttendance, getTrainingPrograms } from '../../../api/training'
import { listEmployees } from '../../../api/employees'
import { usePageLayout } from '../../../hooks/usePageLayout'
import TableColumnCustomizerModal from '../../../components/TableColumnCustomizerModal'
import PageHeader from '../../../components/PageHeader'
import LayoutVersionBadge from '../../../components/LayoutVersionBadge'
import { Button } from '../../../components/ui'
import {
  Award,
  Plus,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  FileCheck,
  GraduationCap,
  X,
  Sparkles,
  SlidersHorizontal,
  Download,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react'

const DEFAULT_NOMINATION_COLUMNS = [
  { key: 'employee', header: 'Employee', alignment: 'left' },
  { key: 'department', header: 'Department & Designation', alignment: 'left' },
  { key: 'program', header: 'Training Program', alignment: 'left' },
  { key: 'attendanceStatus', header: 'Attendance Status', alignment: 'center', width: '140px' },
  { key: 'score', header: 'Score', alignment: 'center', width: '90px' },
  { key: 'certificate', header: 'Certificate', alignment: 'center', width: '120px' },
  { key: 'actions', header: 'Update Action', alignment: 'right', width: '150px' }
]

function renderNominationCell(nom, col, { updatingId, handleUpdateStatus }) {
  const isCert = Boolean(nom.certificateIssued || nom.CertificateIssued)
  const isAttended = nom.attendanceStatus === 'Attended' || nom.attendanceStatus === 'Completed'
  const key = (col.key || '').toLowerCase()
  const alignClass = `${col.alignment === 'center' ? 'text-center' : col.alignment === 'right' ? 'text-right' : 'text-left'} whitespace-nowrap`

  if (key === 'code' || key === 'employeecode') {
    return (
      <td key={col.key} className={`py-3.5 px-4 ${alignClass}`}>
        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">
          {nom.employeeCode || '-'}
        </span>
      </td>
    )
  }

  if (key === 'employee' || key === 'employeename' || key === 'staff') {
    const initials = (nom.employeeName || 'EM')
      .split(' ')
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase()
    return (
      <td key={col.key} className={`py-3.5 px-4 ${alignClass}`}>
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
            {initials}
          </div>
          <span className="font-bold text-slate-900">{nom.employeeName}</span>
        </div>
      </td>
    )
  }

  if (key === 'department') {
    return (
      <td key={col.key} className={`py-3.5 px-4 ${alignClass}`}>
        <div className="font-semibold text-slate-700">{nom.department || 'Operations'}</div>
      </td>
    )
  }

  if (key === 'designation' || key === 'role') {
    return (
      <td key={col.key} className={`py-3.5 px-4 ${alignClass}`}>
        <div className="text-xs text-slate-600">{nom.designation || 'Staff'}</div>
      </td>
    )
  }

  if (key === 'program' || key === 'programtitle' || key === 'course') {
    return (
      <td key={col.key} className={`py-3.5 px-4 ${alignClass}`}>
        <div className="font-bold text-slate-900">{nom.programTitle}</div>
        <div className="text-[11px] font-mono text-indigo-600">{nom.programCode}</div>
      </td>
    )
  }

  if (key === 'attendancestatus' || key === 'status') {
    return (
      <td key={col.key} className={`py-3.5 px-4 ${alignClass}`}>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
          isAttended
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : nom.attendanceStatus === 'Absent'
            ? 'bg-rose-50 text-rose-700 border-rose-200'
            : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          {nom.attendanceStatus || 'Nominated'}
        </span>
      </td>
    )
  }

  if (key === 'score' || key === 'assessmentscore' || key === 'marks') {
    return (
      <td key={col.key} className={`py-3.5 px-4 font-mono font-bold text-slate-800 ${alignClass}`}>
        {nom.assessmentScore ? `${nom.assessmentScore}%` : '-'}
      </td>
    )
  }

  if (key === 'certificate' || key === 'certificateissued') {
    return (
      <td key={col.key} className={`py-3.5 px-4 ${alignClass}`}>
        {isCert ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <CheckCircle2 size={11} /> Issued
          </span>
        ) : (
          <span className="text-[10px] text-slate-400 italic">Pending</span>
        )}
      </td>
    )
  }

  if (key === 'actions' || key === 'action' || key === 'updateaction') {
    return (
      <td key={col.key} className={`py-3.5 px-4 ${alignClass}`}>
        <div className="flex items-center justify-end gap-1.5">
          {!isAttended ? (
            <button
              type="button"
              disabled={updatingId === nom.id}
              onClick={() => handleUpdateStatus(nom.id, 'Attended', isCert)}
              className="px-2.5 py-1 text-[10.5px] font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-pointer transition disabled:opacity-50"
            >
              Mark Attended
            </button>
          ) : (
            <button
              type="button"
              disabled={updatingId === nom.id}
              onClick={() => handleUpdateStatus(nom.id, 'Completed', true)}
              className="px-2.5 py-1 text-[10.5px] font-bold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 cursor-pointer transition disabled:opacity-50"
            >
              Issue Certificate
            </button>
          )}
        </div>
      </td>
    )
  }

  return (
    <td key={col.key} className={`py-3.5 px-4 text-slate-700 ${alignClass}`}>
      {nom[col.key] != null ? String(nom[col.key]) : '—'}
    </td>
  )
}

export default function TrainingNominations() {
  const showToast = useToast()
  const [searchParams] = useSearchParams()
  const initialProgramId = searchParams.get('programId') || ''

  const [nominations, setNominations] = useState([])
  const [programs, setPrograms] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProgramId, setSelectedProgramId] = useState(initialProgramId)
  const [statusFilter, setStatusFilter] = useState('All')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)
  const [customizerOpen, setCustomizerOpen] = useState(false)
  const { layoutMeta, columns: layoutColumns, refreshLayout } = usePageLayout('training_nominations', DEFAULT_NOMINATION_COLUMNS)

  const [formData, setFormData] = useState({
    programId: initialProgramId,
    employeeId: ''
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [nomData, progData, empData] = await Promise.all([
        getAllNominations(selectedProgramId || undefined),
        getTrainingPrograms(),
        listEmployees()
      ])
      setNominations(Array.isArray(nomData) ? nomData : [])
      setPrograms(Array.isArray(progData) ? progData : [])
      setEmployees(Array.isArray(empData) ? empData : [])
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to load nominations.', 'error', 3500)
      setNominations([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedProgramId])

  const handleNominate = async (e) => {
    e.preventDefault()
    if (!formData.programId || !formData.employeeId) {
      showToast('Please select both a Training Program and an Employee.', 'warning', 3000)
      return
    }

    setSaving(true)
    try {
      await nominateEmployee(formData)
      showToast('Employee nominated for training successfully.', 'success', 3000)
      setShowCreateForm(false)
      setFormData({ programId: programs.length > 0 ? programs[0].id : '', employeeId: '' })
      await loadData()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to nominate employee.', 'error', 3500)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateStatus = async (nominationId, attendanceStatus, currentCert) => {
    setUpdatingId(nominationId)
    try {
      const certificateIssued = attendanceStatus === 'Completed' || attendanceStatus === 'Attended' ? true : currentCert
      await updateNominationAttendance(nominationId, {
        attendanceStatus,
        certificateIssued,
        assessmentScore: attendanceStatus === 'Completed' ? 90 : 80
      })
      showToast(`Nomination marked as "${attendanceStatus}".`, 'success', 2500)
      await loadData()
    } catch (err) {
      showToast('Failed to update nomination status.', 'error', 3000)
    } finally {
      setUpdatingId(null)
    }
  }

  const [page, setPage] = useState(1)
  const pageSize = 15

  // Filter nominations
  const filtered = useMemo(() => {
    return nominations.filter((n) => {
      const q = searchTerm.toLowerCase().trim()
      const matchesSearch =
        !q ||
        (n.employeeName || '').toLowerCase().includes(q) ||
        (n.employeeCode || '').toLowerCase().includes(q) ||
        (n.programTitle || '').toLowerCase().includes(q) ||
        (n.department || '').toLowerCase().includes(q)

      const matchesProg = !selectedProgramId || n.programId === selectedProgramId
      const matchesStatus = statusFilter === 'All' || n.attendanceStatus === statusFilter
      return matchesSearch && matchesProg && matchesStatus
    })
  }, [nominations, searchTerm, selectedProgramId, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginatedNominations = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  const handleExportCSV = () => {
    if (!filtered.length) {
      showToast('No nominations to export', 'warning', 2500)
      return
    }
    const headers = ['EmployeeCode', 'EmployeeName', 'Department', 'Designation', 'Program', 'AttendanceStatus', 'Score', 'CertificateIssued']
    const rows = filtered.map((n) => [
      `"${n.employeeCode || ''}"`,
      `"${n.employeeName || ''}"`,
      `"${n.department || ''}"`,
      `"${n.designation || ''}"`,
      `"${n.programTitle || ''}"`,
      `"${n.attendanceStatus || ''}"`,
      n.assessmentScore || 0,
      n.certificateIssued || n.CertificateIssued ? 'Yes' : 'No',
    ])
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Training_Nominations_Export_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Nominations registry exported to CSV.', 'success', 2500)
  }

  // Summary Metrics
  const totalNominated = nominations.length
  const attendedCount = nominations.filter((n) => n.attendanceStatus === 'Attended' || n.attendanceStatus === 'Completed').length
  const certifiedCount = nominations.filter((n) => n.certificateIssued || n.CertificateIssued).length
  const pendingCount = nominations.filter((n) => n.attendanceStatus === 'Nominated').length

  return (
    <div className="space-y-4 antialiased pb-10 select-none">
      {/* 1. Unified Page Header (Matching Image 3) */}
      <PageHeader
        icon={Award}
        title="Training Nominations & Attendance Register"
        description="Employee session enrollment, attendance verification, post-training assessment scores, and completion certificates"
        badge={`${nominations.length} Enrolled`}
        badgeTone="emerald"
      >
        <LayoutVersionBadge entity="training_nominations" version={layoutMeta?.version} />

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
          onClick={() => setShowCreateForm(!showCreateForm)}
          icon={Plus}
        >
          {showCreateForm ? 'Close Form' : '+ Nominate Employee'}
        </Button>
      </PageHeader>

      {/* 2. Responsive SaaS Metric Cards (Clean 4-column Grid matching Image 3) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span className="uppercase tracking-wider">Total Enrolled</span>
            <div className="h-7 w-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Users size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono mt-1">
            {totalNominated}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate">
            Across all programs
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl border border-emerald-200/80 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-600">
            <span className="uppercase tracking-wider">Attended / Completed</span>
            <div className="h-7 w-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 font-mono mt-1">
            {attendedCount}
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 truncate">
            Verified attendance
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl border border-indigo-200/80 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-600">
            <span className="uppercase tracking-wider">Certificates Issued</span>
            <div className="h-7 w-7 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Award size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-indigo-700 font-mono mt-1">
            {certifiedCount}
          </div>
          <div className="text-[10px] text-indigo-600 font-semibold mt-0.5 truncate">
            Compliance certified
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl border border-amber-200/80 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-[11px] font-semibold text-amber-600">
            <span className="uppercase tracking-wider">Awaiting Attendance</span>
            <div className="h-7 w-7 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-700 font-mono mt-1">
            {pendingCount}
          </div>
          <div className="text-[10px] text-amber-600 font-semibold mt-0.5 truncate">
            Pending session date
          </div>
        </div>
      </div>

      {/* IN-CONTENT FULL-SCREEN CREATION FORM (NO POPUP MODAL) */}
      {showCreateForm && (
        <div className="bg-white rounded-2xl border-2 border-emerald-300 p-5 sm:p-6 shadow-md transition-all">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-emerald-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                <span>Nominate Employee for Training</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select an active program and assign staff members for training completion
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleNominate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Training Program *</label>
                <select
                  required
                  value={formData.programId}
                  onChange={e => setFormData({ ...formData, programId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-emerald-600"
                >
                  <option value="">-- Choose Program --</option>
                  {programs.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.programTitle} ({p.programCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Employee *</label>
                <select
                  required
                  value={formData.employeeId}
                  onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-emerald-600"
                >
                  <option value="">-- Choose Staff Member --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName || `${emp.firstName || ''} ${emp.lastName || ''}`} ({emp.employeeCode}) - {emp.departmentName || emp.designationName || 'Staff'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs transition cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Nomination Saving...' : 'Confirm Nomination'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. DEDICATED TABLE CONTAINER (Matching Image 3 Unified Standard) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table Filters Toolbar */}
        <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            {/* Segmented Status Tabs */}
            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              {[
                { id: 'All', label: 'All Staff' },
                { id: 'Nominated', label: 'Nominated' },
                { id: 'Attended', label: 'Attended' },
                { id: 'Completed', label: 'Completed' },
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
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Program Selector Dropdown */}
            {programs.length > 0 && (
              <select
                value={selectedProgramId}
                onChange={(e) => {
                  setSelectedProgramId(e.target.value)
                  setPage(1)
                }}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none cursor-pointer max-w-[200px] truncate"
              >
                <option value="">All Programs</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.programTitle}</option>
                ))}
              </select>
            )}

            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px] max-w-sm">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff, code, program..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPage(1)
                }}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-emerald-600 font-medium bg-slate-50/50 focus:bg-white"
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition shadow-2xs cursor-pointer"
              title="Customize Table Columns"
            >
              <SlidersHorizontal size={13} className="text-emerald-700" />
              <span>Customize Columns</span>
              <span className="ml-0.5 rounded-full bg-emerald-700 px-1.5 py-0.2 text-[10px] font-extrabold text-white">
                {layoutColumns.length}
              </span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase text-[10.5px] font-bold tracking-wider">
              <tr>
                {layoutColumns.map((col) => (
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
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={layoutColumns.length || 7} className="py-12 text-center text-slate-400">
                    <RefreshCw size={24} className="mx-auto animate-spin text-emerald-600 mb-2" />
                    <span>Loading training nominations...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={layoutColumns.length || 7} className="py-12 text-center text-slate-400">
                    <Award size={28} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-600">No Nominations Found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Click "+ Nominate Employee" to enroll staff.</p>
                  </td>
                </tr>
              ) : (
                paginatedNominations.map((nom) => (
                  <tr key={nom.id} className="hover:bg-emerald-50/30 transition">
                    {layoutColumns.map((col) => renderNominationCell(nom, col, { updatingId, handleUpdateStatus }))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer (Matching Image 3 Standard) */}
        <div className="p-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-medium">
          <div>
            Showing <span className="font-bold text-slate-800">{filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}</span> - <span className="font-bold text-slate-800">{Math.min(page * pageSize, filtered.length)}</span> of <span className="font-bold text-slate-800">{filtered.length}</span> records
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
        schema={{ id: 'training_nominations', columns: layoutColumns }}
        schemaId="training_nominations"
        onSaveSuccess={() => {
          if (refreshLayout) refreshLayout()
        }}
      />
    </div>
  )
}
