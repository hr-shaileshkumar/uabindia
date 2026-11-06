import React, { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useToast } from '../../../components/ToastProvider'
import { getCandidates, addCandidate, updateCandidateStage, getJobs } from '../../../api/recruitment'
import { usePageLayout } from '../../../hooks/usePageLayout'
import TableColumnCustomizerModal from '../../../components/TableColumnCustomizerModal'
import PageHeader from '../../../components/PageHeader'
import LayoutVersionBadge from '../../../components/LayoutVersionBadge'
import { Button } from '../../../components/ui'
import {
  Users,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Star,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileText,
  Mail,
  Phone,
  X,
  ExternalLink,
  Sparkles,
  SlidersHorizontal,
  Download,
  UserCheck
} from 'lucide-react'

const PIPELINE_STAGES = [
  'Applied',
  'Screening',
  'Interview Scheduled',
  'Offer Extended',
  'Ready to Onboard',
  'Hired',
  'Rejected'
]

const DEFAULT_COLUMNS = [
  { key: 'candidateCode', header: 'Candidate Code', format: 'code', width: '130px', alignment: 'left' },
  { key: 'fullName', header: 'Candidate Name', format: 'avatar', width: '220px', alignment: 'left' },
  { key: 'jobTitle', header: 'Role Requisition', format: 'text', width: '200px', alignment: 'left' },
  { key: 'contact', header: 'Contact', format: 'text', width: '180px', alignment: 'left' },
  { key: 'totalExperienceYears', header: 'Experience', format: 'text', width: '110px', alignment: 'left' },
  { key: 'expectedCtc', header: 'Expected CTC', format: 'currency', width: '120px', alignment: 'left' },
  { key: 'rating', header: 'Rating', format: 'text', width: '90px', alignment: 'center' },
  { key: 'currentStage', header: 'Pipeline Stage', format: 'badge', width: '140px', alignment: 'center' },
]

function normalizeCandidate(c) {
  if (!c) return {}
  const fullName = c.FullName || c.fullName || c.Name || c.name || '-'
  const code = c.CandidateCode || c.candidateCode || '-'
  const email = c.Email || c.email || '-'
  const phone = c.MobileNumber || c.mobileNumber || c.Phone || c.phone || '-'
  const currentCompany = c.CurrentEmployer || c.currentEmployer || c.CurrentCompany || c.currentCompany || 'Fresher / Independent'
  const jobTitle = c.JobTitle || c.jobTitle || 'General Pool'
  const department = c.Department || c.department || 'Operations'
  const totalExperienceYears = c.TotalExperienceYears ?? c.totalExperienceYears ?? c.ExperienceYears ?? c.experienceYears ?? 0
  const expectedCtc = c.ExpectedCtc ?? c.expectedCtc ?? c.ExpectedCTC ?? c.expectedCTC ?? 0
  const rating = Number(c.Rating ?? c.rating ?? 3)
  const stage = c.CurrentStage || c.currentStage || c.Stage || c.stage || 'Applied'
  const id = c.Id || c.id

  return {
    ...c,
    id,
    candidateCode: code,
    fullName,
    name: fullName,
    email,
    phone,
    mobileNumber: phone,
    currentCompany,
    jobTitle,
    department,
    totalExperienceYears,
    expectedCtc,
    rating,
    currentStage: stage,
    stage,
  }
}

function renderCandidateCell(candidate, col, updatingId, handleStageChange, getStageBadgeColor) {
  const norm = normalizeCandidate(candidate)
  switch (col.key) {
    case 'candidateCode':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
          {norm.candidateCode}
        </span>
      )
    case 'fullName':
    case 'candidateName': {
      const initials = norm.fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'CD'
      return (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 to-teal-600 font-bold text-white text-xs ring-2 ring-white shadow-xs">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-slate-900 text-xs truncate">{norm.fullName}</div>
          </div>
        </div>
      )
    }
    case 'currentCompany':
      return (
        <span className="text-xs text-slate-700">{norm.currentCompany}</span>
      )
    case 'jobTitle':
      return (
        <div>
          <div className="font-semibold text-slate-700">{norm.jobTitle}</div>
          <div className="text-[11px] text-slate-400">{norm.department}</div>
        </div>
      )
    case 'contact':
    case 'mobileNumber':
      return (
        <div>
          <div className="text-slate-700 flex items-center gap-1">
            <Mail size={11} className="text-slate-400 shrink-0" />
            <span className="truncate max-w-[140px] text-xs">{norm.email}</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
            <Phone size={11} className="text-slate-400 shrink-0" />
            <span>{norm.phone}</span>
          </div>
        </div>
      )
    case 'totalExperienceYears':
    case 'experienceYears':
      return (
        <span className="font-semibold text-slate-700 font-mono text-xs">
          {norm.totalExperienceYears ? `${norm.totalExperienceYears} Yrs` : 'Fresher'}
        </span>
      )
    case 'expectedCtc':
      return (
        <span className="font-mono font-medium text-slate-700 text-xs">
          {norm.expectedCtc ? `₹${(Number(norm.expectedCtc) / 100000).toFixed(1)}L` : 'Negotiable'}
        </span>
      )
    case 'rating':
      return (
        <div className="flex items-center justify-center text-amber-500">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={11}
              className={i < (norm.rating || 3) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
            />
          ))}
        </div>
      )
    case 'currentStage':
    case 'stage':
      return (
        <select
          disabled={updatingId === norm.id}
          value={norm.stage}
          onChange={e => handleStageChange(norm.id, e.target.value)}
          className={`text-[10.5px] font-bold px-2 py-1 rounded-lg border cursor-pointer focus:outline-emerald-600 ${getStageBadgeColor(norm.stage)}`}
        >
          {PIPELINE_STAGES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      )
    default:
      return norm[col.key] != null ? String(norm[col.key]) : '-'
  }
}

export default function CandidatePipeline() {
  const showToast = useToast()
  const { columns: layoutColumns, layout: layoutMeta, refreshLayout } = usePageLayout('candidates', DEFAULT_COLUMNS)
  const [customizerOpen, setCustomizerOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const initialJobId = searchParams.get('jobId') || ''

  const [candidates, setCandidates] = useState([])
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedJobId, setSelectedJobId] = useState(initialJobId)
  const [selectedStage, setSelectedStage] = useState('All')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)

  const [formData, setFormData] = useState({
    jobId: initialJobId,
    fullName: '',
    email: '',
    phone: '',
    currentCompany: '',
    experienceYears: '',
    currentCTC: '',
    expectedCTC: '',
    rating: 4,
    stage: 'Applied',
    notes: ''
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [candData, jobsData] = await Promise.all([
        getCandidates(selectedJobId || undefined, selectedStage === 'All' ? undefined : selectedStage),
        getJobs()
      ])
      const list = Array.isArray(candData) ? candData.map(normalizeCandidate) : []
      setCandidates(list)
      setJobs(Array.isArray(jobsData) ? jobsData : [])
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to load candidates.', 'error', 3500)
      setCandidates([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const handleContextChange = () => loadData()
    window.addEventListener('app:context-changed', handleContextChange)
    return () => window.removeEventListener('app:context-changed', handleContextChange)
  }, [selectedJobId, selectedStage])

  const handleAddCandidate = async (e) => {
    e.preventDefault()
    if (!formData.fullName || !formData.email || !formData.phone) {
      showToast('Full Name, Email, and Phone are mandatory.', 'warning', 3000)
      return
    }

    setSaving(true)
    try {
      await addCandidate({
        ...formData,
        jobId: formData.jobId || (jobs.length > 0 ? jobs[0].id : null)
      })
      showToast('Candidate profile registered into ATS pipeline.', 'success', 3000)
      setShowCreateForm(false)
      setFormData({
        jobId: jobs.length > 0 ? jobs[0].id : '',
        fullName: '',
        email: '',
        phone: '',
        currentCompany: '',
        experienceYears: 1,
        currentCTC: 0,
        expectedCTC: 0,
        rating: 3,
        stage: 'Screening',
        notes: ''
      })
      await loadData()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to add candidate.', 'error', 3500)
    } finally {
      setSaving(false)
    }
  }

  const handleStageChange = async (candidateId, newStage) => {
    setUpdatingId(candidateId)
    try {
      await updateCandidateStage(candidateId, newStage, `Stage updated to ${newStage}`)
      showToast(`Candidate stage moved to "${newStage}".`, 'success', 2500)
      await loadData()
    } catch (err) {
      showToast('Failed to update stage.', 'error', 3000)
    } finally {
      setUpdatingId(null)
    }
  }

  // Filter candidates
  const filteredCandidates = candidates.filter(c => {
    const q = searchTerm.toLowerCase()
    return (
      (c.fullName || '').toLowerCase().includes(q) ||
      (c.candidateCode || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.jobTitle || '').toLowerCase().includes(q)
    )
  })

  // Summary counts
  const totalCount = candidates.length
  const screeningCount = candidates.filter(c => c.stage === 'Screening' || c.stage === 'Applied').length
  const interviewCount = candidates.filter(c => c.stage === 'Interview Scheduled').length
  const readyToOnboardCount = candidates.filter(c => c.stage === 'Ready to Onboard').length
  const hiredCount = candidates.filter(c => c.stage === 'Hired').length

  const getStageBadgeColor = (stage) => {
    switch (stage) {
      case 'Applied': return 'bg-slate-100 text-slate-700 border-slate-200'
      case 'Screening': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'Interview Scheduled': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'Offer Extended': return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'Ready to Onboard': return 'bg-emerald-50 text-emerald-800 border-emerald-300 font-extrabold'
      case 'Hired': return 'bg-teal-50 text-teal-800 border-teal-300'
      case 'Rejected': return 'bg-rose-50 text-rose-700 border-rose-200'
      default: return 'bg-slate-50 text-slate-600 border-slate-200'
    }
  }

  // Export candidates to CSV
  const handleExportCSV = () => {
    if (!filteredCandidates.length) {
      showToast('No candidates available to export', 'warning', 2500)
      return
    }
    const headers = ['CandidateCode', 'FullName', 'Email', 'Phone', 'JobTitle', 'Department', 'Experience', 'ExpectedCTC', 'Stage', 'Rating']
    const rows = filteredCandidates.map(c => [
      `"${c.candidateCode || ''}"`,
      `"${c.fullName || ''}"`,
      `"${c.email || ''}"`,
      `"${c.phone || ''}"`,
      `"${c.jobTitle || ''}"`,
      `"${c.department || ''}"`,
      `"${c.totalExperienceYears || 0} Yrs"`,
      `"${c.expectedCtc || ''}"`,
      `"${c.stage || ''}"`,
      c.rating || 0
    ])
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Candidates_Export_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Candidate roster exported to CSV successfully.', 'success', 3000)
  }

  return (
    <div className="space-y-4 antialiased pb-8 select-none">
      {/* 1. Unified Page Header */}
      <PageHeader
        icon={Users}
        title="Candidate Pipeline & ATS"
        description="Applicant tracking system, candidate interview stages, ratings, and hiring workflow"
        badge={`${candidates.length} In ATS`}
        badgeTone="emerald"
      >
        <LayoutVersionBadge entity="candidates" version={layoutMeta?.version} />

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
          {showCreateForm ? 'Close Form' : 'Add Candidate'}
        </Button>
      </PageHeader>

      {/* 2. Responsive SaaS Metric Cards (Clean 4-column Grid matching Image 3) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Metric 1: Total in ATS */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span className="uppercase tracking-wider">Total In ATS</span>
            <div className="h-7 w-7 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Users size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono mt-1">
            {totalCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate">
            All registered applicants
          </div>
        </div>

        {/* Metric 2: Screening */}
        <div className="bg-white rounded-2xl border border-amber-200/80 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-[11px] font-semibold text-amber-600">
            <span className="uppercase tracking-wider">Screening</span>
            <div className="h-7 w-7 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-700 font-mono mt-1">
            {screeningCount}
          </div>
          <div className="text-[10px] text-amber-600 font-semibold mt-0.5 truncate">
            Under active evaluation
          </div>
        </div>

        {/* Metric 3: Interviews */}
        <div className="bg-white rounded-2xl border border-blue-200/80 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-[11px] font-semibold text-blue-600">
            <span className="uppercase tracking-wider">Interviews</span>
            <div className="h-7 w-7 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Star size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-blue-700 font-mono mt-1">
            {interviewCount}
          </div>
          <div className="text-[10px] text-blue-600 mt-0.5 truncate">
            Rounds scheduled
          </div>
        </div>

        {/* Metric 4: Ready to Onboard */}
        <div className="bg-white rounded-2xl border border-emerald-200/80 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-600">
            <span className="uppercase tracking-wider">Ready to Onboard</span>
            <div className="h-7 w-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 font-mono mt-1">
            {readyToOnboardCount}
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 truncate">
            Ready for 1-click profile creation
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
                <span>Register Candidate into ATS Pipeline</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Capture applicant profile, expected compensation, initial rating, and stage
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

          <form onSubmit={handleAddCandidate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Applying For Job Requisition *</label>
                <select
                  value={formData.jobId}
                  onChange={e => setFormData({ ...formData, jobId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-emerald-600"
                >
                  <option value="">-- General Application / Talent Pool --</option>
                  {jobs.map(j => (
                    <option key={j.id} value={j.id}>
                      {j.jobTitle} ({j.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Ramesh Kumar"
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="ramesh.kumar@example.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-emerald-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Current Employer / Org</label>
                <input
                  type="text"
                  placeholder="e.g. Apollo / Patna Clinic"
                  value={formData.currentCompany}
                  onChange={e => setFormData({ ...formData, currentCompany: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Experience (Years)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.experienceYears}
                  onChange={e => setFormData({ ...formData, experienceYears: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-emerald-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Current Annual CTC (₹)</label>
                <input
                  type="number"
                  value={formData.currentCTC}
                  onChange={e => setFormData({ ...formData, currentCTC: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-emerald-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Expected Annual CTC (₹)</label>
                <input
                  type="number"
                  value={formData.expectedCTC}
                  onChange={e => setFormData({ ...formData, expectedCTC: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-emerald-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Initial Pipeline Stage</label>
                <select
                  value={formData.stage}
                  onChange={e => setFormData({ ...formData, stage: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-emerald-600"
                >
                  {PIPELINE_STAGES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">Interviewer Notes & Qualifications</label>
                <input
                  type="text"
                  placeholder="e.g. Valid driving license, B.V.Sc graduate, ready for immediate relocation"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-emerald-600"
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
                className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs transition cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Adding...' : 'Add Candidate to Pipeline'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DEDICATED TABLE CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table Filters Toolbar (Matching Image 3 Unified Standard) */}
        <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            {/* Segmented Stage Filter Tabs */}
            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              {['All', 'Screening', 'Interview Scheduled', 'Ready to Onboard'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStage(st)}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer text-xs font-bold ${
                    selectedStage === st
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {st === 'All' ? 'All Stages' : st}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px] max-w-sm">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Candidates..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-purple-600 font-medium bg-slate-50/50 focus:bg-white"
              />
            </div>

            {/* Requisition Dropdown */}
            <select
              value={selectedJobId}
              onChange={e => setSelectedJobId(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-purple-600 max-w-[180px] truncate cursor-pointer"
            >
              <option value="">All Requisitions</option>
              {jobs.map(j => (
                <option key={j.id} value={j.id}>{j.jobTitle}</option>
              ))}
            </select>
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
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase text-[10.5px] font-bold tracking-wider">
              <tr>
                {layoutColumns.map((col) => (
                  <th
                    key={col.key || col.columnId}
                    style={col.width && col.width !== 'auto' ? { width: col.width } : undefined}
                    className={`py-3 px-4 whitespace-nowrap ${
                      col.alignment === 'center' ? 'text-center' : col.alignment === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {col.header}
                  </th>
                ))}
                <th className="py-3 px-4 text-right whitespace-nowrap sticky right-0 bg-slate-50/95 backdrop-blur-xs shadow-[-6px_0_10px_-2px_rgba(0,0,0,0.06)] z-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={layoutColumns.length + 1} className="py-10 text-center text-slate-400">
                    <RefreshCw size={24} className="mx-auto animate-spin text-purple-600 mb-2" />
                    <span>Loading candidate pipeline...</span>
                  </td>
                </tr>
              ) : filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={layoutColumns.length + 1} className="py-10 text-center text-slate-400">
                    <Users size={28} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-600">No Candidates Found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Click "+ Add Candidate" to enter a candidate into the pipeline.</p>
                  </td>
                </tr>
              ) : (
                filteredCandidates.map(candidate => (
                  <tr key={candidate.id} className="group hover:bg-slate-50/80 transition">
                    {layoutColumns.map((col) => (
                      <td
                        key={col.key || col.columnId}
                        className={`py-3.5 px-4 whitespace-nowrap ${
                          col.alignment === 'center' ? 'text-center' : col.alignment === 'right' ? 'text-right' : 'text-left'
                        }`}
                      >
                        {renderCandidateCell(candidate, col, updatingId, handleStageChange, getStageBadgeColor)}
                      </td>
                    ))}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap sticky right-0 bg-white group-hover:bg-slate-50/95 shadow-[-6px_0_10px_-2px_rgba(0,0,0,0.06)] z-10">
                      {candidate.stage === 'Ready to Onboard' ? (
                        <Link
                          to={`/module/hrms/onboarding?candidateId=${candidate.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10.5px] shadow-2xs transition"
                        >
                          <span>Onboard</span>
                          <ArrowRight size={11} />
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStageChange(candidate.id, 'Ready to Onboard')}
                          className="text-[10.5px] font-bold text-slate-600 hover:text-emerald-700 underline cursor-pointer"
                        >
                          Mark Ready
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer (Matching Image 3 Unified Standard) */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 font-medium">
          <div>
            Showing <strong className="text-slate-700">1 - {filteredCandidates.length}</strong> of <strong className="text-slate-700">{candidates.length}</strong> records
          </div>
          <div className="flex items-center gap-3">
            <Link to="/module/hrms/onboarding" className="text-emerald-700 hover:underline font-bold text-xs">
              Proceed to Automated 1-Click Onboarding &rarr;
            </Link>
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
        schema={{ id: 'candidates', columns: layoutColumns }}
        schemaId="candidates"
        onSaveSuccess={() => {
          if (refreshLayout) refreshLayout()
        }}
      />
    </div>
  )
}
