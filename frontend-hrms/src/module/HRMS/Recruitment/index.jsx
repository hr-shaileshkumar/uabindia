import React, { useState, useEffect } from 'react'
import {
  Users,
  Briefcase,
  UserCheck,
  TrendingUp,
  Plus,
  Search,
  Globe,
  Share2,
  CheckCircle2,
  Clock,
  ChevronRight,
  Filter,
  ArrowRight,
  X,
  Sparkles,
  Building2,
  Mail,
  Phone,
  Calendar,
  AlertCircle
} from 'lucide-react'
import {
  getManpowerPlans,
  createManpowerPlan,
  getJobs,
  createJob,
  toggleJobPortalPublish,
  getCandidates,
  addCandidate,
  updateCandidateStage,
  convertCandidateToEmployee
} from '../../../api/recruitment'

export default function RecruitmentHub() {
  const [activeTab, setActiveTab] = useState('manpower') // manpower | jobs | candidates | onboarding
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState(null)

  // Data states
  const [plans, setPlans] = useState([])
  const [jobs, setJobs] = useState([])
  const [candidates, setCandidates] = useState([])
  const [selectedJobFilter, setSelectedJobFilter] = useState('all')

  // Full-screen content area form states (Zero floating modals!)
  const [showPlanForm, setShowPlanForm] = useState(false)
  const [showJobForm, setShowJobForm] = useState(false)
  const [showCandidateForm, setShowCandidateForm] = useState(false)
  const [onboardCandidateTarget, setOnboardCandidateTarget] = useState(null)

  // Forms
  const [planForm, setPlanForm] = useState({
    department: 'Veterinary Services',
    designation: 'Veterinary Surgeon',
    approvedHeadcount: 5,
    budgetedCtcPerAnnum: 4500000,
    fromDate: '',
    toDate: '',
    notes: 'Urgent mobile ambulance roster'
  })

  const [jobForm, setJobForm] = useState({
    jobTitle: '',
    department: 'Veterinary Services',
    designation: '',
    jobLocation: 'Patna HQ / Field Units',
    vacancies: 2,
    employmentType: 'Permanent Full-Time',
    minExperienceYears: 2,
    maxExperienceYears: 6,
    minSalary: 600000,
    maxSalary: 950000,
    skillsRequired: '',
    jobDescription: '',
    portalPublished: true
  })

  const [candidateForm, setCandidateForm] = useState({
    jobPostingId: '',
    fullName: '',
    email: '',
    mobileNumber: '',
    currentLocation: 'Patna, Bihar',
    totalExperienceYears: 3,
    currentEmployer: '',
    currentCtc: 500000,
    expectedCtc: 700000,
    noticePeriodDays: 30,
    interviewNotes: ''
  })

  const [onboardForm, setOnboardForm] = useState({
    salutation: 'Dr.',
    gender: 'Male',
    joiningDate: new Date().toISOString().split('T')[0],
    employmentType: 'Permanent Full-Time',
    department: '',
    designation: '',
    workLocation: 'Patna Central HQ'
  })

  const loadAll = async () => {
    setLoading(true)
    try {
      const [pData, jData, cData] = await Promise.all([
        getManpowerPlans(),
        getJobs(),
        getCandidates()
      ])
      setPlans(pData)
      setJobs(jData)
      setCandidates(cData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const showToast = (msg, isError = false) => {
    setFeedback({ msg, isError })
    setTimeout(() => setFeedback(null), 4000)
  }

  // Handlers
  const handleSavePlan = async (e) => {
    e.preventDefault()
    try {
      await createManpowerPlan(planForm)
      showToast('Manpower staffing plan created successfully.')
      setShowPlanForm(false)
      loadAll()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save plan', true)
    }
  }

  const handleSaveJob = async (e) => {
    e.preventDefault()
    try {
      await createJob(jobForm)
      showToast('Job posting created and synced.')
      setShowJobForm(false)
      loadAll()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save job', true)
    }
  }

  const handleTogglePortal = async (jobId) => {
    try {
      const res = await toggleJobPortalPublish(jobId)
      showToast(res.message)
      loadAll()
    } catch (err) {
      showToast('Error toggling portal', true)
    }
  }

  const handleSaveCandidate = async (e) => {
    e.preventDefault()
    try {
      await addCandidate(candidateForm)
      showToast('Candidate enrolled into ATS pipeline.')
      setShowCandidateForm(false)
      loadAll()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add candidate', true)
    }
  }

  const handleStageChange = async (candId, newStage) => {
    try {
      await updateCandidateStage(candId, newStage)
      showToast(`Candidate moved to ${newStage}.`)
      loadAll()
    } catch (err) {
      showToast('Failed to update stage', true)
    }
  }

  const handleExecuteOnboard = async (e) => {
    e.preventDefault()
    if (!onboardCandidateTarget) return
    try {
      const res = await convertCandidateToEmployee(onboardCandidateTarget.Id, onboardForm)
      showToast(res.message)
      setOnboardCandidateTarget(null)
      loadAll()
    } catch (err) {
      showToast(err.response?.data?.message || 'Onboarding failed', true)
    }
  }

  // Computed metrics
  const totalApproved = plans.reduce((acc, p) => acc + (p.ApprovedHeadcount || 0), 0)
  const totalCurrent = plans.reduce((acc, p) => acc + (p.CurrentHeadcount || 0), 0)
  const totalVacant = Math.max(0, totalApproved - totalCurrent)
  const activePostings = jobs.filter(j => j.Status === 'Active').length
  const totalInPipeline = candidates.length
  const readyToOnboardCount = candidates.filter(c => c.CurrentStage === 'Ready to Onboard' || c.CurrentStage === 'Offer Extended').length

  const filteredCandidates = selectedJobFilter === 'all'
    ? candidates
    : candidates.filter(c => c.JobPostingId === selectedJobFilter)

  return (
    <div className="w-full space-y-6">
      {/* Toast Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
            feedback.isError
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-sm'
          }`}
        >
          <span>{feedback.msg}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/30 text-purple-200 border border-purple-400/30 uppercase tracking-wider">
              Talent Acquisition & Staffing
            </span>
            <span className="text-xs text-purple-200/70">• Bihar 1962 Ambulatory Operations</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1">
            Recruitment & Manpower Planning Hub
          </h1>
          <p className="text-xs text-purple-200/80 mt-1 max-w-2xl">
            Seamless end-to-end recruitment lifecycle: Approved staffing plans, career job portal sync, candidate tracking stages (ATS), and automated 1-click onboarding to employee profile.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'manpower' && (
            <button
              onClick={() => { setShowPlanForm(!showPlanForm); setShowJobForm(false); setShowCandidateForm(false); }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg transition"
            >
              <Plus size={16} />
              {showPlanForm ? 'Close Plan Form' : 'New Staffing Plan'}
            </button>
          )}
          {activeTab === 'jobs' && (
            <button
              onClick={() => { setShowJobForm(!showJobForm); setShowPlanForm(false); setShowCandidateForm(false); }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg transition"
            >
              <Plus size={16} />
              {showJobForm ? 'Close Job Form' : 'Post New Job Vacancy'}
            </button>
          )}
          {activeTab === 'candidates' && (
            <button
              onClick={() => { setShowCandidateForm(!showCandidateForm); setShowPlanForm(false); setShowJobForm(false); }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg transition"
            >
              <Plus size={16} />
              {showCandidateForm ? 'Close Form' : 'Enroll Candidate'}
            </button>
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Approved Headcount</span>
            <Users size={16} className="text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalApproved}</span>
            <span className="text-[11px] text-slate-500 font-semibold">Staffed: {totalCurrent}</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-purple-600 h-full rounded-full"
              style={{ width: `${totalApproved ? Math.min(100, Math.round((totalCurrent / totalApproved) * 100)) : 0}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Open Vacancy Gap</span>
            <Briefcase size={16} className="text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">{totalVacant}</span>
            <span className="text-[11px] text-slate-500 font-semibold">positions open</span>
          </div>
          <span className="text-[10px] text-slate-400">Approved vs Actual deficit</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Candidates in ATS</span>
            <TrendingUp size={16} className="text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-600">{totalInPipeline}</span>
            <span className="text-[11px] text-slate-500 font-semibold">Active talent</span>
          </div>
          <span className="text-[10px] text-slate-400">Across all evaluation stages</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Ready for Onboarding</span>
            <UserCheck size={16} className="text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">{readyToOnboardCount}</span>
            <span className="text-[11px] text-slate-500 font-semibold">1-Click hire</span>
          </div>
          <span className="text-[10px] text-slate-400">Offer accepted & vetted</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-6">
        <button
          onClick={() => setActiveTab('manpower')}
          className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'manpower'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users size={16} />
          1. Manpower Planning & Headcount Budgets ({plans.length})
        </button>

        <button
          onClick={() => setActiveTab('jobs')}
          className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'jobs'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Briefcase size={16} />
          2. Job Postings & Portal Sync ({jobs.length})
        </button>

        <button
          onClick={() => setActiveTab('candidates')}
          className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'candidates'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp size={16} />
          3. Candidate Pipeline & ATS Stages ({candidates.length})
        </button>

        <button
          onClick={() => setActiveTab('onboarding')}
          className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'onboarding'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles size={16} className="text-purple-600" />
          4. 1-Click Automated Onboarding ({readyToOnboardCount})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* FULL-SCREEN IN-CONTENT FORMS (Zero Popups!) */}
      {/* ========================================================================= */}

      {/* 1. Full-screen Manpower Plan Form */}
      {showPlanForm && (
        <div className="bg-white border-2 border-purple-300 rounded-2xl p-6 shadow-md transition-all">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Define Manpower Staffing Plan Requisition</h2>
              <p className="text-xs text-slate-500">Specify departmental headcount authorization, approved budget, and target fiscal year</p>
            </div>
            <button onClick={() => setShowPlanForm(false)} className="text-slate-400 hover:text-slate-600 p-1">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSavePlan} className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
              <input
                type="text"
                required
                value={planForm.department}
                onChange={e => setPlanForm({ ...planForm, department: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Designation / Role *</label>
              <input
                type="text"
                required
                value={planForm.designation}
                onChange={e => setPlanForm({ ...planForm, designation: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Approved Headcount *</label>
              <input
                type="number"
                min="1"
                required
                value={planForm.approvedHeadcount}
                onChange={e => setPlanForm({ ...planForm, approvedHeadcount: parseInt(e.target.value) || 1 })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Budgeted Annual CTC (₹)</label>
              <input
                type="number"
                value={planForm.budgetedCtcPerAnnum}
                onChange={e => setPlanForm({ ...planForm, budgetedCtcPerAnnum: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">From Date (Mobilization Start)</label>
              <input
                type="date"
                value={planForm.fromDate}
                onChange={e => setPlanForm({ ...planForm, fromDate: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">To Date (Mobilization End)</label>
              <input
                type="date"
                value={planForm.toDate}
                onChange={e => setPlanForm({ ...planForm, toDate: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Justification</label>
              <input
                type="text"
                value={planForm.notes}
                onChange={e => setPlanForm({ ...planForm, notes: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPlanForm(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md"
              >
                Save Staffing Requisition
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Full-screen Job Posting Form */}
      {showJobForm && (
        <div className="bg-white border-2 border-purple-300 rounded-2xl p-6 shadow-md transition-all">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Publish New Career Job Vacancy</h2>
              <p className="text-xs text-slate-500">Configure role requirements, salary brackets, and public career portal sync</p>
            </div>
            <button onClick={() => setShowJobForm(false)} className="text-slate-400 hover:text-slate-600 p-1">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSaveJob} className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Veterinary Medical Officer"
                value={jobForm.jobTitle}
                onChange={e => setJobForm({ ...jobForm, jobTitle: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
              <input
                type="text"
                required
                value={jobForm.department}
                onChange={e => setJobForm({ ...jobForm, department: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Posting Location</label>
              <input
                type="text"
                value={jobForm.jobLocation}
                onChange={e => setJobForm({ ...jobForm, jobLocation: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Vacancies</label>
              <input
                type="number"
                min="1"
                value={jobForm.vacancies}
                onChange={e => setJobForm({ ...jobForm, vacancies: parseInt(e.target.value) || 1 })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Employment Type</label>
              <select
                value={jobForm.employmentType}
                onChange={e => setJobForm({ ...jobForm, employmentType: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500"
              >
                <option value="Permanent Full-Time">Permanent Full-Time</option>
                <option value="Contractual">Contractual</option>
                <option value="Internship">Internship</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Experience Bracket (Years)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={jobForm.minExperienceYears}
                  onChange={e => setJobForm({ ...jobForm, minExperienceYears: parseFloat(e.target.value) || 0 })}
                  className="w-1/2 rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={jobForm.maxExperienceYears}
                  onChange={e => setJobForm({ ...jobForm, maxExperienceYears: parseFloat(e.target.value) || 0 })}
                  className="w-1/2 rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Salary Range (₹ / Annum)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min ₹"
                  value={jobForm.minSalary}
                  onChange={e => setJobForm({ ...jobForm, minSalary: parseFloat(e.target.value) || 0 })}
                  className="w-1/2 rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="number"
                  placeholder="Max ₹"
                  value={jobForm.maxSalary}
                  onChange={e => setJobForm({ ...jobForm, maxSalary: parseFloat(e.target.value) || 0 })}
                  className="w-1/2 rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={jobForm.portalPublished}
                  onChange={e => setJobForm({ ...jobForm, portalPublished: e.target.checked })}
                  className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500"
                />
                <span>Sync & Publish to Careers Portal</span>
              </label>
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Skills Required</label>
              <input
                type="text"
                placeholder="Comma separated: B.V.Sc, Bovine Surgery, Emergency Triage"
                value={jobForm.skillsRequired}
                onChange={e => setJobForm({ ...jobForm, skillsRequired: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowJobForm(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md"
              >
                Publish Job
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Full-screen Candidate Enrollment Form */}
      {showCandidateForm && (
        <div className="bg-white border-2 border-purple-300 rounded-2xl p-6 shadow-md transition-all">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Enroll Candidate into Recruitment Pipeline</h2>
              <p className="text-xs text-slate-500">Add applicant details, experience background, compensation expectations and resume</p>
            </div>
            <button onClick={() => setShowCandidateForm(false)} className="text-slate-400 hover:text-slate-600 p-1">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSaveCandidate} className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assign to Vacancy</label>
              <select
                value={candidateForm.jobPostingId}
                onChange={e => setCandidateForm({ ...candidateForm, jobPostingId: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500"
              >
                <option value="">General Talent Pool</option>
                {jobs.map(j => (
                  <option key={j.Id} value={j.Id}>{j.JobCode} • {j.JobTitle}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Candidate Full Name *</label>
              <input
                type="text"
                required
                value={candidateForm.fullName}
                onChange={e => setCandidateForm({ ...candidateForm, fullName: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={candidateForm.email}
                onChange={e => setCandidateForm({ ...candidateForm, email: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Contact *</label>
              <input
                type="tel"
                required
                value={candidateForm.mobileNumber}
                onChange={e => setCandidateForm({ ...candidateForm, mobileNumber: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current Location</label>
              <input
                type="text"
                value={candidateForm.currentLocation}
                onChange={e => setCandidateForm({ ...candidateForm, currentLocation: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Total Experience (Years)</label>
              <input
                type="number"
                step="0.5"
                value={candidateForm.totalExperienceYears}
                onChange={e => setCandidateForm({ ...candidateForm, totalExperienceYears: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current CTC (₹)</label>
              <input
                type="number"
                value={candidateForm.currentCtc}
                onChange={e => setCandidateForm({ ...candidateForm, currentCtc: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expected CTC (₹)</label>
              <input
                type="number"
                value={candidateForm.expectedCtc}
                onChange={e => setCandidateForm({ ...candidateForm, expectedCtc: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Period (Days)</label>
              <input
                type="number"
                value={candidateForm.noticePeriodDays}
                onChange={e => setCandidateForm({ ...candidateForm, noticePeriodDays: parseInt(e.target.value) || 30 })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCandidateForm(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md"
              >
                Save to ATS Pipeline
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Full-screen 1-Click Onboarding Modal Form */}
      {onboardCandidateTarget && (
        <div className="bg-gradient-to-br from-emerald-50 via-white to-purple-50 border-2 border-emerald-400 rounded-2xl p-6 shadow-xl transition-all">
          <div className="flex items-center justify-between pb-4 border-b border-emerald-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
                ⚡
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Instant 1-Click Employee Onboarding
                </h2>
                <p className="text-xs text-slate-600">
                  Converting candidate <strong>{onboardCandidateTarget.FullName}</strong> ({onboardCandidateTarget.CandidateCode}) directly into a live Master Profile
                </p>
              </div>
            </div>
            <button onClick={() => setOnboardCandidateTarget(null)} className="text-slate-400 hover:text-slate-600 p-1">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleExecuteOnboard} className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Salutation</label>
              <select
                value={onboardForm.salutation}
                onChange={e => setOnboardForm({ ...onboardForm, salutation: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Mr.">Mr.</option>
                <option value="Ms.">Ms.</option>
                <option value="Dr.">Dr.</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
              <select
                value={onboardForm.gender}
                onChange={e => setOnboardForm({ ...onboardForm, gender: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Joining Date *</label>
              <input
                type="date"
                required
                value={onboardForm.joiningDate}
                onChange={e => setOnboardForm({ ...onboardForm, joiningDate: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Employment Type</label>
              <select
                value={onboardForm.employmentType}
                onChange={e => setOnboardForm({ ...onboardForm, employmentType: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Permanent Full-Time">Permanent Full-Time</option>
                <option value="Contractual">Contractual</option>
                <option value="Probationary">Probationary</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                value={onboardForm.department || onboardCandidateTarget.Department || 'Veterinary Services'}
                onChange={e => setOnboardForm({ ...onboardForm, department: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
              <input
                type="text"
                value={onboardForm.designation || onboardCandidateTarget.JobTitle || 'Medical Officer'}
                onChange={e => setOnboardForm({ ...onboardForm, designation: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Work Location Base</label>
              <input
                type="text"
                value={onboardForm.workLocation}
                onChange={e => setOnboardForm({ ...onboardForm, workLocation: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="md:col-span-4 flex items-center justify-between pt-3 border-t border-emerald-200">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Auto-generates Employee Code, corporate email, contacts, and payroll link.</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOnboardCandidateTarget(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-lg flex items-center gap-2"
                >
                  <Sparkles size={16} />
                  Confirm & Create Profile in Master
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT AREAS */}
      {/* ========================================================================= */}

      {/* TAB 1: MANPOWER PLANNING & HEADCOUNT BUDGETS */}
      {activeTab === 'manpower' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Approved Staffing Plans & Headcount Budgets</h3>
              <p className="text-xs text-slate-500">Organizational headcount ceilings by department, project and fiscal budget</p>
            </div>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              Approved Staffing Plans
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Department & Role</th>
                  <th className="py-3 px-4">Approved Ceilings</th>
                  <th className="py-3 px-4">Current Staffed</th>
                  <th className="py-3 px-4">Fulfillment %</th>
                  <th className="py-3 px-4">Budgeted CTC (₹)</th>
                  <th className="py-3 px-4">Mobilization Timeline</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {plans.map((p, idx) => {
                  const percent = p.ApprovedHeadcount > 0 ? Math.round((p.CurrentHeadcount / p.ApprovedHeadcount) * 100) : 0
                  return (
                    <tr key={p.Id || idx} className="hover:bg-purple-50/30 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{p.Designation}</div>
                        <div className="text-[11px] text-slate-400">{p.Department}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {p.ApprovedHeadcount} posts
                      </td>
                      <td className="py-3 px-4 font-semibold text-emerald-700">
                        {p.CurrentHeadcount} active
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${percent >= 80 ? 'bg-emerald-500' : percent >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ width: `${Math.min(100, percent)}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-slate-600">{percent}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                        ₹{Number(p.BudgetedCtcPerAnnum || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {p.FromDate ? (
                          <span>{new Date(p.FromDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} → {p.ToDate ? new Date(p.ToDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Open'}</span>
                        ) : (
                          <span className="text-slate-400 italic">Continuous</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {p.Status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setActiveTab('jobs')
                            setJobForm(prev => ({
                              ...prev,
                              department: p.Department,
                              designation: p.Designation,
                              jobTitle: `${p.Designation} (${p.Department})`,
                              vacancies: Math.max(1, p.ApprovedHeadcount - p.CurrentHeadcount)
                            }))
                            setShowJobForm(true)
                          }}
                          className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[11px] transition"
                        >
                          Create Job Vacancy →
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: JOB OPENINGS & PORTAL SYNC */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {jobs.map(job => (
              <div
                key={job.Id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {job.JobCode}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      job.Status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {job.Status}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug">{job.JobTitle}</h3>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Building2 size={13} className="text-slate-400" />
                    {job.Department} • {job.JobLocation}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                      {job.Vacancies} Vacancies
                    </span>
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                      {job.MinExperienceYears}-{job.MaxExperienceYears} Yrs Exp
                    </span>
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                      ₹{Math.round(job.MinSalary / 100000)}L - {Math.round(job.MaxSalary / 100000)}L CTC
                    </span>
                  </div>

                  {job.SkillsRequired && (
                    <p className="mt-3 text-[11px] text-slate-500 line-clamp-2">
                      <strong className="text-slate-700">Skills:</strong> {job.SkillsRequired}
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  {/* Public Portal Sync Toggle */}
                  <button
                    onClick={() => handleTogglePortal(job.Id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                      job.PortalPublished
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <Globe size={14} className={job.PortalPublished ? 'text-emerald-600' : 'text-slate-400'} />
                    <span>{job.PortalPublished ? 'Live on Portal' : 'Draft / Internal'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedJobFilter(job.Id)
                      setActiveTab('candidates')
                    }}
                    className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1"
                  >
                    <span>View Candidates ({job.CandidateCount || 0})</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CANDIDATE TRACKING PIPELINE (ATS) */}
      {activeTab === 'candidates' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-700">Filter by Vacancy:</span>
              <select
                value={selectedJobFilter}
                onChange={e => setSelectedJobFilter(e.target.value)}
                className="text-xs rounded-lg border border-slate-300 px-3 py-1.5 focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Vacancies ({candidates.length})</option>
                {jobs.map(j => (
                  <option key={j.Id} value={j.Id}>{j.JobCode} • {j.JobTitle}</option>
                ))}
              </select>
            </div>

            <span className="text-xs font-semibold text-slate-500">
              Showing {filteredCandidates.length} candidate applications
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Candidate Profile</th>
                  <th className="py-3 px-4">Job Role / Dept</th>
                  <th className="py-3 px-4">Exp & Notice</th>
                  <th className="py-3 px-4">CTC Expectation</th>
                  <th className="py-3 px-4">Current Stage (ATS)</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4 text-right">Advance Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredCandidates.map(cand => (
                  <tr key={cand.Id} className="hover:bg-purple-50/20 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{cand.FullName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{cand.CandidateCode} • {cand.MobileNumber}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{cand.JobTitle || 'General Pool'}</div>
                      <div className="text-[11px] text-slate-400">{cand.Department || 'Bihar Ambulatory'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold">{cand.TotalExperienceYears} Yrs</span>
                      <span className="text-slate-400 text-[11px] block">{cand.NoticePeriodDays}d Notice</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-800">
                        ₹{Number(cand.ExpectedCtc || 0).toLocaleString('en-IN')}
                      </div>
                      <span className="text-[11px] text-slate-400">Current: ₹{Number(cand.CurrentCtc || 0).toLocaleString('en-IN')}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        cand.CurrentStage === 'Ready to Onboard' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                        cand.CurrentStage === 'Offer Extended' ? 'bg-purple-50 text-purple-700 border-purple-300' :
                        cand.CurrentStage === 'Interview Scheduled' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                        cand.CurrentStage === 'Hired' ? 'bg-teal-50 text-teal-800 border-teal-300' :
                        'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {cand.CurrentStage}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-amber-500 font-bold">★ {cand.Rating || 4.0}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {cand.CurrentStage === 'Hired' ? (
                        <span className="text-[11px] text-emerald-700 font-bold flex items-center justify-end gap-1">
                          <CheckCircle2 size={14} /> Profile Live
                        </span>
                      ) : (
                        <select
                          value={cand.CurrentStage}
                          onChange={e => handleStageChange(cand.Id, e.target.value)}
                          className="text-xs rounded-lg border border-slate-300 bg-white px-2 py-1 font-semibold text-slate-700 focus:ring-2 focus:ring-purple-500 cursor-pointer"
                        >
                          <option value="Applied">Applied</option>
                          <option value="Screening">Screening</option>
                          <option value="Interview Scheduled">Interview Scheduled</option>
                          <option value="Offer Extended">Offer Extended</option>
                          <option value="Ready to Onboard">Ready to Onboard</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: 1-CLICK AUTOMATED ONBOARDING TO EMPLOYEE MASTER */}
      {activeTab === 'onboarding' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-emerald-900 to-teal-900 rounded-2xl p-6 text-white shadow-lg flex items-center justify-between">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 uppercase tracking-wider">
                Automated Pipeline Bridge
              </span>
              <h2 className="text-xl font-black mt-1">1-Click Candidate to Employee Profile Conversion</h2>
              <p className="text-xs text-emerald-100/80 mt-1 max-w-xl">
                Candidates vetted through the ATS can be immediately converted into official staff profiles in <strong>EmployeeMaster</strong> with auto-generated Employee Codes, official email addresses, contacts, and organization master entries.
              </p>
            </div>
            <Sparkles size={36} className="text-emerald-300 opacity-80" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {candidates
              .filter(c => c.CurrentStage === 'Ready to Onboard' || c.CurrentStage === 'Offer Extended')
              .map(cand => (
                <div
                  key={cand.Id}
                  className="bg-white rounded-2xl border-2 border-emerald-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {cand.CandidateCode}
                      </span>
                      <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                        {cand.CurrentStage}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 mt-2">{cand.FullName}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Applied for: <strong className="text-slate-800">{cand.JobTitle || 'Veterinary Medical Officer'}</strong>
                    </p>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Email</span>
                        <span className="font-semibold text-slate-800 truncate">{cand.Email}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Mobile</span>
                        <span className="font-semibold text-slate-800">{cand.MobileNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Offered CTC</span>
                        <span className="font-mono font-bold text-emerald-700">₹{Number(cand.ExpectedCtc || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Total Experience</span>
                        <span className="font-semibold text-slate-800">{cand.TotalExperienceYears} Years</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">
                      Status: <strong>Ready to Convert</strong>
                    </span>

                    <button
                      onClick={() => {
                        setOnboardCandidateTarget(cand)
                        setOnboardForm(prev => ({
                          ...prev,
                          department: cand.Department || 'Veterinary Services',
                          designation: cand.JobTitle || 'Medical Officer',
                          workLocation: cand.CurrentLocation || 'Patna Central HQ'
                        }))
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
                    >
                      <Sparkles size={14} />
                      <span>Onboard as Employee →</span>
                    </button>
                  </div>
                </div>
              ))}

            {candidates.filter(c => c.CurrentStage === 'Ready to Onboard' || c.CurrentStage === 'Offer Extended').length === 0 && (
              <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center">
                <CheckCircle2 size={32} className="mx-auto text-slate-400 mb-2" />
                <h4 className="font-bold text-slate-700 text-sm">No Pending Candidates for Onboarding</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Advance candidates to <strong>'Ready to Onboard'</strong> in the Candidate Pipeline tab to execute 1-click employee onboarding.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
