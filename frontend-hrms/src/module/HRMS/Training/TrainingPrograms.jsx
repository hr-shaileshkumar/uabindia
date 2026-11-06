import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../../../components/ToastProvider'
import { getTrainingPrograms, createTrainingProgram } from '../../../api/training'
import { usePageLayout } from '../../../hooks/usePageLayout'
import TableColumnCustomizerModal from '../../../components/TableColumnCustomizerModal'
import PageHeader from '../../../components/PageHeader'
import LayoutVersionBadge from '../../../components/LayoutVersionBadge'
import { Button } from '../../../components/ui'
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  Clock,
  Video,
  MapPin,
  Users,
  CheckCircle2,
  X,
  ExternalLink,
  Sparkles,
  SlidersHorizontal,
  Download,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react'

const DEFAULT_TRAINING_COLUMNS = [
  { key: 'programCode', header: 'Program Code', alignment: 'left', width: '130px' },
  { key: 'programTitle', header: 'Program Title', alignment: 'left' },
  { key: 'category', header: 'Category & Mode', alignment: 'left', width: '160px' },
  { key: 'dates', header: 'Dates', alignment: 'left', width: '160px' },
  { key: 'durationHours', header: 'Duration', alignment: 'center', width: '100px' },
  { key: 'trainerName', header: 'Trainer', alignment: 'left', width: '140px' },
  { key: 'enrollment', header: 'Enrollment', alignment: 'center', width: '110px' },
  { key: 'status', header: 'Status', alignment: 'center', width: '110px' },
  { key: 'actions', header: 'Actions', alignment: 'right', width: '120px' }
]

function renderTrainingCell(p, col) {
  const key = (col.key || '').toLowerCase()
  const alignClass = `${col.alignment === 'center' ? 'text-center' : col.alignment === 'right' ? 'text-right' : 'text-left'} whitespace-nowrap`
  const sDate = p.startDate ? new Date(p.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '-'
  const eDate = p.endDate ? new Date(p.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '-'
  const nominatedCount = Number(p.nominatedCount) || 0
  const capacity = Number(p.maxParticipants) || 30

  if (key === 'programcode' || key === 'code') {
    return (
      <td key={col.key} className={`py-3.5 px-4 ${alignClass}`}>
        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">
          {p.programCode}
        </span>
      </td>
    )
  }

  if (key === 'programtitle' || key === 'title') {
    return (
      <td key={col.key} className={`py-3.5 px-4 ${alignClass}`}>
        <div className="font-bold text-slate-900">{p.programTitle}</div>
      </td>
    )
  }

  if (key === 'venueorlink' || key === 'venue' || key === 'link') {
    return (
      <td key={col.key} className={`py-3.5 px-4 ${alignClass}`}>
        <div className="text-xs text-slate-600 truncate max-w-xs">{p.venueOrLink || '-'}</div>
      </td>
    )
  }

  if (key === 'category') {
    return (
      <td key={col.key} className={`py-3.5 px-4 ${alignClass}`}>
        <div className="font-semibold text-slate-700">{p.category}</div>
      </td>
    )
  }

  if (key === 'trainingmode' || key === 'mode') {
    return (
      <td key={col.key} className={`py-3.5 px-4 ${alignClass}`}>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
          {p.trainingMode}
        </span>
      </td>
    )
  }

  if (key === 'dates' || key === 'startdate' || key === 'enddate') {
    return (
      <td key={col.key} className={`py-3.5 px-4 font-mono text-[11px] text-slate-700 ${alignClass}`}>
        {sDate} - {eDate}
      </td>
    )
  }

  if (key === 'durationhours' || key === 'duration') {
    return (
      <td key={col.key} className={`py-3.5 px-4 font-mono font-bold text-slate-800 ${alignClass}`}>
        {p.durationHours} hrs
      </td>
    )
  }

  if (key === 'trainername' || key === 'trainer') {
    return (
      <td key={col.key} className={`py-3.5 px-4 text-slate-700 ${alignClass}`}>
        {p.trainerName}
      </td>
    )
  }

  if (key === 'enrollment' || key === 'participants' || key === 'nominatedcount') {
    return (
      <td key={col.key} className={`py-3.5 px-4 ${alignClass}`}>
        <Link
          to={`/module/hrms/training-nominations?programId=${p.id}`}
          className="font-mono font-bold text-indigo-700 hover:underline"
        >
          {nominatedCount} / {capacity}
        </Link>
      </td>
    )
  }

  if (key === 'status') {
    return (
      <td key={col.key} className={`py-3.5 px-4 ${alignClass}`}>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
          p.status === 'Ongoing'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : p.status === 'Completed'
            ? 'bg-slate-100 text-slate-600 border-slate-200'
            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
        }`}>
          {p.status || 'Upcoming'}
        </span>
      </td>
    )
  }

  if (key === 'actions' || key === 'action') {
    return (
      <td key={col.key} className={`py-3.5 px-4 ${alignClass}`}>
        <Link
          to={`/module/hrms/training-nominations?programId=${p.id}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
        >
          <span>Nominations</span>
          <ExternalLink size={12} />
        </Link>
      </td>
    )
  }

  return (
    <td key={col.key} className={`py-3.5 px-4 text-slate-700 ${alignClass}`}>
      {p[col.key] != null ? String(p[col.key]) : '—'}
    </td>
  )
}

export default function TrainingPrograms() {
  const showToast = useToast()
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [customizerOpen, setCustomizerOpen] = useState(false)
  const { layoutMeta, columns: layoutColumns, refreshLayout } = usePageLayout('training_programs', DEFAULT_TRAINING_COLUMNS)

  const [formData, setFormData] = useState({
    programTitle: '',
    category: 'Field Operations',
    trainerName: '',
    trainingMode: 'In-Person',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    durationHours: 8,
    maxParticipants: 30,
    venueOrLink: '',
    description: '',
    status: 'Upcoming'
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getTrainingPrograms()
      setPrograms(Array.isArray(data) ? data : [])
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to load training programs.', 'error', 3500)
      setPrograms([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateProgram = async (e) => {
    e.preventDefault()
    if (!formData.programTitle || !formData.trainerName) {
      showToast('Program Title and Trainer Name are required.', 'warning', 3000)
      return
    }

    setSaving(true)
    try {
      await createTrainingProgram(formData)
      showToast('Training program scheduled and added to catalog.', 'success', 3000)
      setShowCreateForm(false)
      setFormData({
        programTitle: '',
        category: 'Technical',
        trainerName: '',
        trainingMode: 'Online Webinar',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        durationHours: 8,
        maxParticipants: 30,
        venueOrLink: '',
        description: '',
        status: 'Upcoming'
      })
      await loadData()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to schedule program.', 'error', 3500)
    } finally {
      setSaving(false)
    }
  }

  const [page, setPage] = useState(1)
  const pageSize = 15

  // Filter programs
  const filtered = useMemo(() => {
    return programs.filter((p) => {
      const q = searchTerm.toLowerCase().trim()
      const matchesSearch =
        !q ||
        (p.programTitle || '').toLowerCase().includes(q) ||
        (p.programCode || '').toLowerCase().includes(q) ||
        (p.trainerName || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)

      if (statusFilter === 'All') return matchesSearch
      return matchesSearch && p.status === statusFilter
    })
  }, [programs, searchTerm, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginatedPrograms = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  const handleExportCSV = () => {
    if (!filtered.length) {
      showToast('No training programs to export', 'warning', 2500)
      return
    }
    const headers = ['ProgramCode', 'ProgramTitle', 'Category', 'StartDate', 'EndDate', 'DurationHours', 'Trainer', 'Capacity', 'Enrolled', 'Status']
    const rows = filtered.map((p) => [
      `"${p.programCode || ''}"`,
      `"${p.programTitle || ''}"`,
      `"${p.category || ''}"`,
      `"${p.startDate || ''}"`,
      `"${p.endDate || ''}"`,
      p.durationHours || 0,
      `"${p.trainerName || ''}"`,
      p.maxParticipants || 0,
      p.nominatedCount || 0,
      `"${p.status || ''}"`,
    ])
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Training_Programs_Export_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Training catalog exported to CSV.', 'success', 2500)
  }

  // Summary Metrics
  const totalPrograms = programs.length
  const upcomingCount = programs.filter((p) => p.status === 'Upcoming').length
  const ongoingCount = programs.filter((p) => p.status === 'Ongoing').length
  const totalNominated = programs.reduce((acc, p) => acc + (Number(p.nominatedCount) || 0), 0)

  return (
    <div className="space-y-4 antialiased pb-10 select-none">
      {/* 1. Unified Page Header (Matching Image 3) */}
      <PageHeader
        icon={GraduationCap}
        title="Training Programs & Capability Building"
        description="Skill development workshops, compliance webinars, POSH drills, and technical certifications"
        badge={`${programs.length} Programs`}
        badgeTone="blue"
      >
        <LayoutVersionBadge entity="training_programs" version={layoutMeta?.version} />

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
          {showCreateForm ? 'Close Form' : '+ Schedule Program'}
        </Button>
      </PageHeader>

      {/* 2. Responsive SaaS Metric Cards (Clean 4-column Grid matching Image 3) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span className="uppercase tracking-wider">Total Courses</span>
            <div className="h-7 w-7 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <GraduationCap size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono mt-1">
            {totalPrograms}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate">
            Catalogued Modules
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl border border-indigo-200/80 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-600">
            <span className="uppercase tracking-wider">Upcoming</span>
            <div className="h-7 w-7 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Calendar size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-indigo-700 font-mono mt-1">
            {upcomingCount}
          </div>
          <div className="text-[10px] text-indigo-600 font-semibold mt-0.5 truncate">
            Scheduled Sessions
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl border border-emerald-200/80 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-600">
            <span className="uppercase tracking-wider">Ongoing</span>
            <div className="h-7 w-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Clock size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 font-mono mt-1">
            {ongoingCount}
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 truncate">
            Currently in session
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl border border-purple-200/80 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-[11px] font-semibold text-purple-600">
            <span className="uppercase tracking-wider">Nominations</span>
            <div className="h-7 w-7 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Users size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-purple-700 font-mono mt-1">
            {totalNominated}
          </div>
          <div className="text-[10px] text-purple-600 font-semibold mt-0.5 truncate">
            Enrolled Participants
          </div>
        </div>
      </div>

      {/* IN-CONTENT FULL-SCREEN CREATION FORM (NO POPUP MODAL) */}
      {showCreateForm && (
        <div className="bg-white rounded-2xl border-2 border-indigo-300 p-5 sm:p-6 shadow-md transition-all">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-indigo-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-600" />
                <span>Schedule New Training / L&D Session</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Define session curriculum, venue/webinar links, trainer details, and capacity
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

          <form onSubmit={handleCreateProgram} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Program Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. POSH & Workplace Safety Certification"
                  value={formData.programTitle}
                  onChange={e => setFormData({ ...formData, programTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-indigo-600"
                >
                  <option value="Technical">Technical & Operations</option>
                  <option value="Field Operations">Field Operations & Driving</option>
                  <option value="POSH & Compliance">POSH & Statutory Compliance</option>
                  <option value="Leadership">Leadership & Soft Skills</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Trainer / Faculty Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. K. K. Sharma"
                  value={formData.trainerName}
                  onChange={e => setFormData({ ...formData, trainerName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Training Mode *</label>
                <select
                  value={formData.trainingMode}
                  onChange={e => setFormData({ ...formData, trainingMode: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-indigo-600"
                >
                  <option value="Online Webinar">Online Webinar (MS Teams / Zoom)</option>
                  <option value="In-Person Workshop">In-Person Workshop</option>
                  <option value="Classroom & Field Drill">Classroom & Field Drill</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Max Participants</label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxParticipants}
                  onChange={e => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) || 20 })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-indigo-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Start Date *</label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-indigo-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">End Date *</label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-indigo-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Hours)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.durationHours}
                  onChange={e => setFormData({ ...formData, durationHours: parseInt(e.target.value) || 4 })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-indigo-600 font-mono"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">Venue Address / Webinar Meeting Link</label>
                <input
                  type="text"
                  placeholder="e.g. https://teams.microsoft.com/l/meetup-join/... or Conference Hall 2, Patna"
                  value={formData.venueOrLink}
                  onChange={e => setFormData({ ...formData, venueOrLink: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-indigo-600"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">Description & Learning Outcomes</label>
                <textarea
                  rows="2"
                  placeholder="Summary of course modules and certificate criteria..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-indigo-600"
                />
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
                className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white shadow-2xs transition cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Scheduling...' : 'Schedule Training Program'}
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
                { id: 'All', label: 'All Courses' },
                { id: 'Upcoming', label: 'Upcoming' },
                { id: 'Ongoing', label: 'Ongoing' },
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
                      ? 'bg-blue-600 text-white shadow-xs'
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
                placeholder="Search program by title, code, trainer or category..."
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
                  <td colSpan={layoutColumns.length || 9} className="py-12 text-center text-slate-400">
                    <RefreshCw size={24} className="mx-auto animate-spin text-blue-600 mb-2" />
                    <span>Loading training programs...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={layoutColumns.length || 9} className="py-12 text-center text-slate-400">
                    <GraduationCap size={28} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-600">No Training Programs Found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Click "+ Schedule Program" to organize a workshop.</p>
                  </td>
                </tr>
              ) : (
                paginatedPrograms.map((p) => (
                  <tr key={p.id} className="hover:bg-blue-50/30 transition">
                    {layoutColumns.map((col) => renderTrainingCell(p, col))}
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
        schema={{ id: 'training_programs', columns: layoutColumns }}
        schemaId="training_programs"
        onSaveSuccess={() => {
          if (refreshLayout) refreshLayout()
        }}
      />
    </div>
  )
}
