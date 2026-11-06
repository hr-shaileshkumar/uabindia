import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../../../components/ToastProvider'
import { getJobs, createJob, toggleJobPortalPublish } from '../../../api/recruitment'
import { usePageLayout } from '../../../hooks/usePageLayout'
import TableColumnCustomizerModal from '../../../components/TableColumnCustomizerModal'
import PageHeader from '../../../components/PageHeader'
import LayoutVersionBadge from '../../../components/LayoutVersionBadge'
import { Button } from '../../../components/ui'
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Building2,
  Globe,
  Users,
  CheckCircle2,
  X,
  ExternalLink,
  Sparkles,
  SlidersHorizontal,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const DEFAULT_JOB_COLUMNS = [
  { key: 'jobCode', header: 'Job Code', alignment: 'left', width: '120px' },
  { key: 'jobTitle', header: 'Position Title', alignment: 'left' },
  { key: 'department', header: 'Department & Project', alignment: 'left' },
  { key: 'vacancies', header: 'Vacancies', alignment: 'center', width: '90px' },
  { key: 'experienceRequired', header: 'Experience', alignment: 'left', width: '120px' },
  { key: 'salaryBracket', header: 'Salary Bracket', alignment: 'left', width: '150px' },
  { key: 'portalPublished', header: 'Portal Live', alignment: 'center', width: '110px' },
  { key: 'candidateCount', header: 'Applicants', alignment: 'center', width: '100px' },
  { key: 'actions', header: 'Actions', alignment: 'right', width: '120px' }
]

function renderJobCell(job, col, { togglingId, handleTogglePublish }) {
  const isPublished = Boolean(job.portalPublished || job.PortalPublished)
  const candidateCount = Number(job.candidateCount) || 0
  const key = (col.key || '').toLowerCase()
  const alignClass = `${col.alignment === 'center' ? 'text-center' : col.alignment === 'right' ? 'text-right' : 'text-left'} whitespace-nowrap`

  if (key === 'jobcode' || key === 'code') {
    return (
      <td key={col.key} className={`py-3.5 px-4 ${alignClass}`}>
        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">
          {job.jobCode}
        </span>
      </td>
    )
  }

  if (key === 'jobtitle' || key === 'title' || key === 'position') {
    return (
      <td key={col.key} className={`py-3.5 px-4 ${alignClass}`}>
        <div className="font-bold text-slate-900">{job.jobTitle}</div>
      </td>
    )
  }

  if (key === 'skills') {
    return (
      <td key={col.key} className={`py-3.5 px-4 ${alignClass}`}>
        <span className="text-xs text-slate-600">{job.skills || 'General'}</span>
      </td>
    )
  }

  if (key === 'department') {
    return (
      <td key={col.key} className={`py-3.5 px-4 ${alignClass}`}>
        <div className="font-semibold text-slate-700">{job.department}</div>
      </td>
    )
  }

  if (key === 'project') {
    return (
      <td key={col.key} className={`py-3.5 px-4 ${alignClass}`}>
        <div className="font-semibold text-slate-700">{job.project}</div>
      </td>
    )
  }

  if (key === 'vacancies' || key === 'openings') {
    return (
      <td key={col.key} className={`py-3.5 px-4 font-mono font-bold text-slate-900 ${alignClass}`}>
        {job.vacancies}
      </td>
    )
  }

  if (key === 'experiencerequired' || key === 'experience') {
    return (
      <td key={col.key} className={`py-3.5 px-4 text-slate-600 ${alignClass}`}>
        {job.experienceRequired || '1+ Year'}
      </td>
    )
  }

  if (key === 'salarybracket' || key === 'ctc' || key === 'salary') {
    return (
      <td key={col.key} className={`py-3.5 px-4 font-mono text-[11px] text-slate-700 ${alignClass}`}>
        ₹{(Number(job.minCTC) / 100000).toFixed(1)}L - ₹{(Number(job.maxCTC) / 100000).toFixed(1)}L
      </td>
    )
  }

  if (key === 'portalpublished' || key === 'ispublished' || key === 'status') {
    return (
      <td key={col.key} className={`py-3.5 px-4 ${alignClass}`}>
        <button
          type="button"
          disabled={togglingId === job.id}
          onClick={() => handleTogglePublish(job.id, isPublished)}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold cursor-pointer transition ${
            isPublished
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
          }`}
        >
          <Globe size={11} className={isPublished ? 'text-emerald-600' : 'text-slate-400'} />
          <span>{isPublished ? 'Public' : 'Draft'}</span>
        </button>
      </td>
    )
  }

  if (key === 'candidatecount' || key === 'applicants') {
    return (
      <td key={col.key} className={`py-3.5 px-4 ${alignClass}`}>
        <Link
          to={`/module/hrms/candidates?jobId=${job.id}`}
          className="inline-flex items-center gap-1 font-mono font-bold text-purple-700 hover:underline"
        >
          <Users size={12} />
          <span>{candidateCount}</span>
        </Link>
      </td>
    )
  }

  if (key === 'actions' || key === 'action') {
    return (
      <td key={col.key} className={`py-3.5 px-4 ${alignClass}`}>
        <Link
          to={`/module/hrms/candidates?jobId=${job.id}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
        >
          <span>Review ATS</span>
          <ExternalLink size={12} />
        </Link>
      </td>
    )
  }

  return (
    <td key={col.key} className={`py-3.5 px-4 text-slate-700 ${alignClass}`}>
      {job[col.key] != null ? String(job[col.key]) : '—'}
    </td>
  )
}

export default function JobPostings() {
  const showToast = useToast()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState(null)
  const [customizerOpen, setCustomizerOpen] = useState(false)
  const { layoutMeta, columns: layoutColumns, refreshLayout } = usePageLayout('job_postings', DEFAULT_JOB_COLUMNS)

  const [formData, setFormData] = useState({
    jobTitle: '',
    department: '',
    project: '',
    vacancies: 1,
    experienceRequired: '',
    minCTC: '',
    maxCTC: '',
    skills: '',
    jobDescription: ''
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getJobs()
      setJobs(Array.isArray(data) ? data : [])
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to load job postings.', 'error', 3500)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateJob = async (e) => {
    e.preventDefault()
    if (!formData.jobTitle || !formData.department || !formData.vacancies) {
      showToast('Please fill all mandatory job requisition fields.', 'warning', 3000)
      return
    }

    setSaving(true)
    try {
      await createJob(formData)
      showToast('Job requisition created and published successfully.', 'success', 3000)
      setShowCreateForm(false)
      setFormData({
        jobTitle: '',
        department: '',
        project: 'Bihar 1962 Ambulatory Clinic',
        vacancies: 1,
        experienceRequired: '',
        minCTC: 0,
        maxCTC: 0,
        skills: '',
        jobDescription: ''
      })
      await loadData()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to create job posting.', 'error', 3500)
    } finally {
      setSaving(false)
    }
  }

  const handleTogglePublish = async (id, currentVal) => {
    setTogglingId(id)
    try {
      await toggleJobPortalPublish(id)
      showToast(`Job portal status updated.`, 'success', 2500)
      await loadData()
    } catch (err) {
      showToast('Failed to toggle portal publishing.', 'error', 3000)
    } finally {
      setTogglingId(null)
    }
  }

  const [page, setPage] = useState(1)
  const pageSize = 15

  // Filtered Jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const q = searchTerm.toLowerCase().trim()
      const matchesSearch =
        !q ||
        (j.jobTitle || '').toLowerCase().includes(q) ||
        (j.department || '').toLowerCase().includes(q) ||
        (j.jobCode || '').toLowerCase().includes(q) ||
        (j.project || '').toLowerCase().includes(q)

      if (statusFilter === 'All') return matchesSearch
      if (statusFilter === 'Published') return matchesSearch && (j.portalPublished || j.PortalPublished)
      if (statusFilter === 'Unpublished') return matchesSearch && !(j.portalPublished || j.PortalPublished)
      return matchesSearch && j.status === statusFilter
    })
  }, [jobs, searchTerm, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize))
  const paginatedJobs = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredJobs.slice(start, start + pageSize)
  }, [filteredJobs, page, pageSize])

  const handleExportCSV = () => {
    if (!filteredJobs.length) {
      showToast('No job openings to export', 'warning', 2500)
      return
    }
    const headers = ['JobCode', 'PositionTitle', 'Department', 'Project', 'Vacancies', 'ExperienceRequired', 'PortalPublished', 'Applicants']
    const rows = filteredJobs.map((j) => [
      `"${j.jobCode || ''}"`,
      `"${j.jobTitle || ''}"`,
      `"${j.department || ''}"`,
      `"${j.project || ''}"`,
      j.vacancies || 0,
      `"${j.experienceRequired || ''}"`,
      j.portalPublished || j.PortalPublished ? 'Yes' : 'No',
      j.candidateCount || 0,
    ])
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Job_Openings_Export_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Job requisitions exported to CSV.', 'success', 2500)
  }

  // Summary Metrics
  const totalRoles = jobs.length
  const totalVacancies = jobs.reduce((acc, j) => acc + (Number(j.vacancies) || 0), 0)
  const publishedCount = jobs.filter((j) => j.portalPublished || j.PortalPublished).length
  const totalApplicants = jobs.reduce((acc, j) => acc + (Number(j.candidateCount) || 0), 0)

  return (
    <div className="space-y-4 antialiased pb-10 select-none">
      {/* 1. Unified Page Header (Matching Image 3) */}
      <PageHeader
        icon={Briefcase}
        title="Job Postings & Career Requisitions"
        description="Active vacancies, public job portal integration, candidate acquisition targets, and sourcing requisition board"
        badge={`${jobs.length} Openings`}
        badgeTone="blue"
      >
        <LayoutVersionBadge entity="job_postings" version={layoutMeta?.version} />

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
          {showCreateForm ? 'Close Form' : '+ Post New Job'}
        </Button>
      </PageHeader>

      {/* 2. Responsive SaaS Metric Cards (Clean 4-column Grid matching Image 3) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span className="uppercase tracking-wider">Active Requisitions</span>
            <div className="h-7 w-7 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Briefcase size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono mt-1">
            {totalRoles}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate">
            Active Job Openings
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl border border-indigo-200/80 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-600">
            <span className="uppercase tracking-wider">Open Vacancies</span>
            <div className="h-7 w-7 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Building2 size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-indigo-700 font-mono mt-1">
            {totalVacancies}
          </div>
          <div className="text-[10px] text-indigo-600 font-semibold mt-0.5 truncate">
            Approved Headcount
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl border border-emerald-200/80 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-600">
            <span className="uppercase tracking-wider">Portal Published</span>
            <div className="h-7 w-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Globe size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 font-mono mt-1">
            {publishedCount}
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 truncate">
            Accepting applicants online
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl border border-purple-200/80 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-[11px] font-semibold text-purple-600">
            <span className="uppercase tracking-wider">Total Applicants</span>
            <div className="h-7 w-7 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Users size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-purple-700 font-mono mt-1">
            {totalApplicants}
          </div>
          <div className="text-[10px] text-purple-600 font-semibold mt-0.5 truncate">
            Tracked in ATS candidate pool
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
                <span>Create New Job Vacancy Requisition</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Publish positions to internal ATS and public job portal
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

          <form onSubmit={handleCreateJob} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Call Center Officer / EMT"
                  value={formData.jobTitle}
                  onChange={e => setFormData({ ...formData, jobTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operations / Logistics"
                  value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Project Assignment</label>
                <input
                  type="text"
                  placeholder="e.g. Bihar 1962 Ambulatory Clinic"
                  value={formData.project}
                  onChange={e => setFormData({ ...formData, project: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Open Vacancies *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.vacancies}
                  onChange={e => setFormData({ ...formData, vacancies: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-indigo-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Experience Required</label>
                <input
                  type="text"
                  placeholder="e.g. 1 - 3 Years"
                  value={formData.experienceRequired}
                  onChange={e => setFormData({ ...formData, experienceRequired: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Min CTC (₹)</label>
                  <input
                    type="number"
                    value={formData.minCTC}
                    onChange={e => setFormData({ ...formData, minCTC: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-indigo-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max CTC (₹)</label>
                  <input
                    type="number"
                    value={formData.maxCTC}
                    onChange={e => setFormData({ ...formData, maxCTC: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-indigo-600 font-mono"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">Required Skills (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Emergency Care, Driving License, Hindi Fluency"
                  value={formData.skills}
                  onChange={e => setFormData({ ...formData, skills: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-indigo-600"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">Job Description & Responsibilities</label>
                <textarea
                  rows="2"
                  placeholder="Brief description of the day-to-day duties..."
                  value={formData.jobDescription}
                  onChange={e => setFormData({ ...formData, jobDescription: e.target.value })}
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
                className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Publishing...' : 'Create & Publish Requisition'}
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
                { id: 'All', label: 'All Openings' },
                { id: 'Published', label: 'Published' },
                { id: 'Unpublished', label: 'Draft / Internal' },
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
                placeholder="Search job title, code, dept, project..."
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
                    <span>Loading job requisitions...</span>
                  </td>
                </tr>
              ) : filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={layoutColumns.length || 9} className="py-12 text-center text-slate-400">
                    <Briefcase size={28} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-600">No Job Requisitions Found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Click "+ Post New Job" to create an active opening.</p>
                  </td>
                </tr>
              ) : (
                paginatedJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-blue-50/30 transition">
                    {layoutColumns.map((col) => renderJobCell(job, col, { togglingId, handleTogglePublish }))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer (Matching Image 3 Standard) */}
        <div className="p-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-medium">
          <div>
            Showing <span className="font-bold text-slate-800">{filteredJobs.length === 0 ? 0 : (page - 1) * pageSize + 1}</span> - <span className="font-bold text-slate-800">{Math.min(page * pageSize, filteredJobs.length)}</span> of <span className="font-bold text-slate-800">{filteredJobs.length}</span> records
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
        schema={{ id: 'job_postings', columns: layoutColumns }}
        schemaId="job_postings"
        onSaveSuccess={() => {
          if (refreshLayout) refreshLayout()
        }}
      />
    </div>
  )
}
