import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../../../components/ToastProvider'
import { getManpowerPlans, createManpowerPlan, deleteManpowerPlan } from '../../../api/recruitment'
import { listCompanies } from '../../../api/companies'
import { listProjects } from '../../../api/projects'
import { getMasterItems } from '../../../api/masterData'
import { usePageLayout } from '../../../hooks/usePageLayout'
import LayoutVersionBadge from '../../../components/LayoutVersionBadge'
import {
  Users,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  RefreshCw,
  Building2,
  Briefcase,
  AlertCircle,
  FileSpreadsheet,
  X,
  Sparkles,
  FolderKanban,
  Calendar,
  IndianRupee,
  Trash2,
  Info,
  ArrowRight
} from 'lucide-react'

const DEFAULT_COLUMNS = [
  { key: 'companyName', header: 'Entity & Project', format: 'badge', width: '180px', alignment: 'left' },
  { key: 'designation', header: 'Department & Role', format: 'text', width: 'auto', alignment: 'left' },
  { key: 'approvedHeadcount', header: 'Sanctioned', format: 'number', width: '100px', alignment: 'center' },
  { key: 'currentHeadcount', header: 'Filled', format: 'number', width: '90px', alignment: 'center' },
  { key: 'vacancies', header: 'Vacancies', format: 'badge', width: '100px', alignment: 'center' },
  { key: 'estimatedCostPerPosition', header: 'Est. Cost / Pos', format: 'currency', width: '140px', alignment: 'right' },
  { key: 'totalEstimatedCost', header: 'Total Est. Cost', format: 'currency', width: '150px', alignment: 'right' },
  { key: 'timeline', header: 'Mobilization Timeline', format: 'text', width: '180px', alignment: 'left' },
  { key: 'priority', header: 'Priority', format: 'badge', width: '100px', alignment: 'center' },
  { key: 'status', header: 'Status', format: 'badge', width: '100px', alignment: 'center' },
]

function renderPlanCell(plan, col) {
  const approved = Number(plan.approvedHeadcount) || 0
  const current = Number(plan.currentHeadcount) || 0
  const vacancies = Number(plan.vacancies) || Math.max(0, approved - current)
  const costPerPos = Number(plan.estimatedCostPerPosition) || (approved > 0 ? (Number(plan.budgetedCtcPerAnnum) || 0) / approved : 0)
  const totalCost = Number(plan.totalEstimatedCost) || Number(plan.budgetedCtcPerAnnum) || (vacancies * costPerPos)
  const fromStr = plan.fromDate ? new Date(plan.fromDate).toLocaleDateString('en-GB') : null
  const toStr = plan.toDate ? new Date(plan.toDate).toLocaleDateString('en-GB') : null

  switch (col.key) {
    case 'companyName':
      return (
        <div>
          <div className="font-bold text-slate-900">{plan.companyName || 'Corporate Entity'}</div>
          {plan.projectName && (
            <div className="text-[11px] text-purple-700 font-semibold flex items-center gap-1 mt-0.5">
              <FolderKanban size={11} />
              <span>{plan.projectName}</span>
            </div>
          )}
        </div>
      )
    case 'projectName':
      return (
        <div className="text-xs text-purple-700 font-semibold flex items-center gap-1">
          <FolderKanban size={12} />
          <span>{plan.projectName || 'All Projects'}</span>
        </div>
      )
    case 'department':
      return <div className="text-xs font-semibold text-slate-700">{plan.department || '-'}</div>
    case 'designation':
      return (
        <div>
          <div className="font-bold text-slate-900">{plan.designation}</div>
          <div className="text-[11px] text-slate-500">{plan.department}</div>
          {plan.staffingType && (
            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9.5px] font-semibold bg-slate-100 text-slate-600">
              {plan.staffingType}
            </span>
          )}
        </div>
      )
    case 'approvedHeadcount':
      return <span className="font-mono font-bold text-slate-800">{approved}</span>
    case 'currentHeadcount':
      return <span className="font-mono font-semibold text-emerald-700">{current}</span>
    case 'vacancies':
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-black ${
          vacancies > 0 
            ? 'bg-rose-100 text-rose-700 border border-rose-200' 
            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        }`}>
          {vacancies}
        </span>
      )
    case 'estimatedCostPerPosition':
      return <span className="font-mono text-slate-700">₹{(costPerPos / 100000).toFixed(2)} L</span>
    case 'totalEstimatedCost':
      return <span className="font-mono font-bold text-purple-900">₹{(totalCost / 100000).toFixed(2)} L</span>
    case 'timeline':
      return fromStr || toStr ? (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
          <Calendar size={12} className="text-purple-700" />
          <span>{fromStr || 'Open'} &rarr; {toStr || 'Ongoing'}</span>
        </div>
      ) : (
        <span className="text-slate-400 italic">Not set</span>
      )
    case 'priority':
      return (
        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          {plan.priority || 'Normal'}
        </span>
      )
    case 'status':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
          plan.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}>
          {plan.status || 'Active'}
        </span>
      )
    default:
      return plan[col.key] !== undefined && plan[col.key] !== null ? String(plan[col.key]) : '-'
  }
}

export default function ManpowerPlanning() {
  const showToast = useToast()
  const { columns: layoutColumns, layout: layoutMeta, version: layoutVersion } = usePageLayout('manpower_planning', DEFAULT_COLUMNS)

  // Data & Master Lists
  const [plans, setPlans] = useState([])
  const [companies, setCompanies] = useState([])
  const [projects, setProjects] = useState([])
  const [departments, setDepartments] = useState([])
  const [designations, setDesignations] = useState([])

  // UI States
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [companyFilter, setCompanyFilter] = useState('All')
  const [projectFilter, setProjectFilter] = useState('All')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  // In-Content Form State (Full-Screen In-Content Form)
  const [formData, setFormData] = useState({
    companyId: '',
    projectId: '',
    fromDate: '2026-04-01',
    toDate: '2027-03-31',
    department: '',
    designation: '',
    approvedHeadcount: 5,
    currentHeadcount: 0,
    vacancies: 5,
    estimatedCostPerPosition: 600000,
    totalEstimatedCost: 3000000,
    priorityLevel: 'High',
    staffingType: 'New Position',
    status: 'Approved',
    notes: ''
  })

  // Load Reference Masters (Companies, Projects, Departments, Designations)
  useEffect(() => {
    let mounted = true
    const loadMasters = async () => {
      try {
        const [compData, prjData, deptData, desigData] = await Promise.allSettled([
          listCompanies(),
          listProjects(),
          getMasterItems('departments'),
          getMasterItems('designations')
        ])

        if (mounted) {
          if (compData.status === 'fulfilled') {
            const list = Array.isArray(compData.value) ? compData.value : compData.value?.items || []
            setCompanies(list)
            if (list.length > 0 && !formData.companyId) {
              setFormData(prev => ({ ...prev, companyId: list[0].companyId || list[0].id }))
            }
          }
          if (prjData.status === 'fulfilled') {
            setProjects(Array.isArray(prjData.value) ? prjData.value : prjData.value?.items || [])
          }
          if (deptData.status === 'fulfilled') {
            setDepartments(Array.isArray(deptData.value) ? deptData.value : [])
          }
          if (desigData.status === 'fulfilled') {
            setDesignations(Array.isArray(desigData.value) ? desigData.value : [])
          }
        }
      } catch (err) {
        console.warn('Failed to load reference masters for manpower planning:', err)
      }
    }

    loadMasters()
    return () => { mounted = false }
  }, [])

  // Load Manpower Plans from API (without Financial Year filter)
  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getManpowerPlans(
        undefined,
        companyFilter === 'All' ? undefined : companyFilter,
        projectFilter === 'All' ? undefined : projectFilter
      )
      setPlans(Array.isArray(data) ? data : [])
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to load manpower plans.', 'error', 3500)
      setPlans([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [companyFilter, projectFilter])

  // Dynamic Projects filtered by selected Company in Creation Form
  const formAvailableProjects = useMemo(() => {
    if (!formData.companyId) return projects
    return projects.filter(p => p.companyId === formData.companyId)
  }, [projects, formData.companyId])

  // Real-Time Headcount & Position Cost Recalculator
  const updateHeadcountAndCosts = (field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value }

      const approved = field === 'approvedHeadcount' ? (parseInt(value) || 0) : prev.approvedHeadcount
      const current = field === 'currentHeadcount' ? (parseInt(value) || 0) : prev.currentHeadcount
      const vacancies = Math.max(0, approved - current)
      const costPerPos = field === 'estimatedCostPerPosition' ? (parseFloat(value) || 0) : prev.estimatedCostPerPosition

      next.approvedHeadcount = approved
      next.currentHeadcount = current
      next.vacancies = vacancies
      next.estimatedCostPerPosition = costPerPos
      next.totalEstimatedCost = vacancies * costPerPos
      return next
    })
  }

  // Submit Handler
  const handleCreatePlan = async (e) => {
    e.preventDefault()
    if (!formData.department || !formData.designation || !formData.approvedHeadcount) {
      showToast('Please fill all mandatory fields (Company, Department, Designation, Headcount).', 'warning', 3000)
      return
    }

    setSaving(true)
    try {
      const payload = {
        companyId: formData.companyId || undefined,
        projectId: formData.projectId || undefined,
        department: formData.department.trim(),
        designation: formData.designation.trim(),
        approvedHeadcount: Number(formData.approvedHeadcount) || 1,
        currentHeadcount: Number(formData.currentHeadcount) || 0,
        vacancies: Number(formData.vacancies) || 0,
        estimatedCostPerPosition: Number(formData.estimatedCostPerPosition) || 0,
        totalEstimatedCost: Number(formData.totalEstimatedCost) || 0,
        budgetedCtcPerAnnum: Number(formData.totalEstimatedCost) || 0,
        fromDate: formData.fromDate ? new Date(formData.fromDate) : null,
        toDate: formData.toDate ? new Date(formData.toDate) : null,
        priorityLevel: formData.priorityLevel || 'High',
        staffingType: formData.staffingType || 'New Position',
        status: formData.status || 'Approved',
        notes: formData.notes || null
      }

      await createManpowerPlan(payload)
      showToast('Manpower staffing authorization plan created successfully.', 'success', 3000)
      setShowCreateForm(false)
      await loadData()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to create manpower plan.', 'error', 3500)
    } finally {
      setSaving(false)
    }
  }

  // Delete Handler
  const handleDeletePlan = async (plan) => {
    if (!window.confirm(`Are you sure you want to delete the staffing plan for "${plan.designation}" (${plan.department})?`)) {
      return
    }

    setDeletingId(plan.id)
    try {
      await deleteManpowerPlan(plan.id)
      showToast('Manpower plan deleted successfully.', 'success', 3000)
      await loadData()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to delete plan.', 'error', 3500)
    } finally {
      setDeletingId(null)
    }
  }

  // Filtered list
  const filteredPlans = plans.filter(p => {
    const q = searchTerm.toLowerCase()
    return (
      (p.department || '').toLowerCase().includes(q) ||
      (p.designation || '').toLowerCase().includes(q) ||
      (p.companyName || '').toLowerCase().includes(q) ||
      (p.projectName || '').toLowerCase().includes(q) ||
      (p.staffingType || '').toLowerCase().includes(q)
    )
  })

  // Live Summary KPI Aggregations
  const totalApproved = plans.reduce((acc, p) => acc + (Number(p.approvedHeadcount) || 0), 0)
  const totalCurrent = plans.reduce((acc, p) => acc + (Number(p.currentHeadcount) || 0), 0)
  const totalVacancies = plans.reduce((acc, p) => acc + (Number(p.vacancies) || Math.max(0, (Number(p.approvedHeadcount) || 0) - (Number(p.currentHeadcount) || 0))), 0)
  const totalBudget = plans.reduce((acc, p) => acc + (Number(p.totalEstimatedCost) || Number(p.budgetedCtcPerAnnum) || 0), 0)
  const fulfillmentRate = totalApproved > 0 ? Math.min(100, Math.round((totalCurrent / totalApproved) * 100)) : 100

  return (
    <div className="space-y-5 pb-10">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Users size={18} />
            </div>
            <h1 className="text-lg font-bold text-slate-900">Manpower Planning & Staffing Authorization</h1>
            <LayoutVersionBadge entity="manpower_planning" version={layoutMeta?.version} />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Project-based headcount budgeting, mobilization windows, and position cost modeling
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            title="Refresh Table"
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-purple-700' : ''} />
          </button>

          <button
            type="button"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer ${
              showCreateForm
                ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                : 'bg-purple-700 hover:bg-purple-800 text-white'
            }`}
          >
            {showCreateForm ? <X size={14} /> : <Plus size={14} />}
            <span>{showCreateForm ? 'Close Form' : '+ New Staffing Plan'}</span>
          </button>
        </div>
      </div>

      {/* Strategic Operational Notice */}
      <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 text-xs text-purple-900 flex items-start gap-2.5">
        <Info size={16} className="text-purple-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold">Project Staffing Architecture:</span> Headcount budgets and recruitment quotas are governed by operational <span className="font-semibold text-purple-950">From Date &rarr; To Date (mobilization / tender contract timeline)</span>. Total cost is dynamically calculated from <span className="font-semibold">Vacancies &times; Estimated Cost per Position</span>.
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Sanctioned Headcount</div>
          <div className="text-xl font-black text-slate-900 font-mono mt-1">{totalApproved}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Approved across active plans</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Currently Onboarded</div>
          <div className="text-xl font-black text-emerald-700 font-mono mt-1">{totalCurrent}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5 font-medium">{fulfillmentRate}% Fulfilled</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Net Open Vacancies</div>
          <div className="text-xl font-black text-rose-600 font-mono mt-1">{totalVacancies}</div>
          <div className="text-[10px] text-rose-500 mt-0.5 font-medium">Requisitions Required</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Budgeted CTC</div>
          <div className="text-xl font-black text-purple-900 font-mono mt-1">
            ₹{(totalBudget / 100000).toFixed(2)} L
          </div>
          <div className="text-[10px] text-purple-700 mt-0.5 font-medium">Annual Payroll Commitment</div>
        </div>
      </div>

      {/* IN-CONTENT FULL-SCREEN CREATION FORM (NO POPUP MODAL) */}
      {showCreateForm && (
        <div className="bg-white rounded-2xl border-2 border-purple-300 p-5 sm:p-6 shadow-md transition-all space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-purple-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-purple-600" />
                <span>Authorize New Manpower Staffing Plan</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure corporate entity, field project, mobilization date range, vacancy gap, and per-position cost model
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleCreatePlan} className="space-y-6">
            {/* SECTION 1: Corporate Entity & Project Governance */}
            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <Building2 size={14} className="text-purple-700" />
                <span>1. Corporate Entity & Project Mobilization Window</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Company Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Company Entity *</label>
                  <select
                    value={formData.companyId}
                    onChange={e => setFormData({ ...formData, companyId: e.target.value, projectId: '' })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-purple-600 font-semibold"
                  >
                    <option value="">-- Select Corporate Entity --</option>
                    {companies.map(c => (
                      <option key={c.companyId || c.id} value={c.companyId || c.id}>
                        {c.companyName} {c.companyCode ? `(${c.companyCode})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Project Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Project / Program *</label>
                  <select
                    value={formData.projectId}
                    onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-purple-600 font-semibold"
                  >
                    <option value="">-- Select Field Project --</option>
                    {formAvailableProjects.map(p => (
                      <option key={p.projectId || p.id} value={p.projectId || p.id}>
                        {p.projectName} {p.projectCode ? `[${p.projectCode}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Range: From Date & To Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobilization Window (From &rarr; To) *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={formData.fromDate}
                      onChange={e => setFormData({ ...formData, fromDate: e.target.value })}
                      className="px-2 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-purple-600 font-mono"
                    />
                    <input
                      type="date"
                      value={formData.toDate}
                      onChange={e => setFormData({ ...formData, toDate: e.target.value })}
                      className="px-2 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-purple-600 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: Role, Department & Staffing Strategy */}
            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <Briefcase size={14} className="text-purple-700" />
                <span>2. Department, Designation & Requisition Classification</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Department Dropdown with Custom Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Department *</label>
                  <input
                    type="text"
                    list="departments-list"
                    required
                    placeholder="e.g. Veterinary Services"
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-purple-600"
                  />
                  <datalist id="departments-list">
                    {departments.map(d => (
                      <option key={d.DepartmentId || d.departmentId || d.DepartmentName} value={d.DepartmentName || d.name} />
                    ))}
                  </datalist>
                </div>

                {/* Designation Dropdown with Custom Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Designation / Role *</label>
                  <input
                    type="text"
                    list="designations-list"
                    required
                    placeholder="e.g. Veterinary Doctor"
                    value={formData.designation}
                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-purple-600 font-semibold"
                  />
                  <datalist id="designations-list">
                    {designations.map(d => (
                      <option key={d.DesignationId || d.designationId || d.DesignationName} value={d.DesignationName || d.name} />
                    ))}
                  </datalist>
                </div>

                {/* Staffing Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Staffing Category *</label>
                  <select
                    value={formData.staffingType}
                    onChange={e => setFormData({ ...formData, staffingType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-purple-600"
                  >
                    <option value="New Position">New Position / Expansion</option>
                    <option value="Replacement / Backfill">Replacement / Backfill</option>
                    <option value="Contractual Scale-up">Contractual Scale-up (Tender)</option>
                    <option value="Temporary Seasonal">Temporary / Seasonal</option>
                  </select>
                </div>

                {/* Priority Level */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hiring Urgency *</label>
                  <select
                    value={formData.priorityLevel}
                    onChange={e => setFormData({ ...formData, priorityLevel: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-purple-600 font-bold"
                  >
                    <option value="Critical">Critical (Immediate Hiring)</option>
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low / Pipeline</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 3: Headcount Numbers & Real-Time Cost Estimator */}
            <div className="bg-purple-50/40 p-4 rounded-xl border border-purple-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-900 uppercase tracking-wider">
                  <IndianRupee size={15} className="text-purple-700" />
                  <span>3. Staffing Numbers & Financial Cost Estimator</span>
                </div>
                <div className="text-[11px] font-semibold text-purple-700">
                  Auto-calculates Vacancy & Total Estimated Budget
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                {/* Sanctioned Headcount */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sanctioned Cap *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.approvedHeadcount}
                    onChange={e => updateHeadcountAndCosts('approvedHeadcount', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-purple-600 font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Total approved headcount</span>
                </div>

                {/* Current Headcount */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Currently Filled</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.currentHeadcount}
                    onChange={e => updateHeadcountAndCosts('currentHeadcount', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-purple-600 font-mono text-emerald-700 font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Existing staff in role</span>
                </div>

                {/* Net Vacancies (Auto-Calculated) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Net Vacancies (To Hire)</label>
                  <div className="px-3 py-2 rounded-xl border border-purple-200 bg-purple-100/60 text-xs font-mono font-extrabold text-purple-900 flex items-center justify-between">
                    <span>{formData.vacancies}</span>
                    <span className="text-[10px] uppercase font-bold text-purple-700">Open Slots</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Cap - Current Filled</span>
                </div>

                {/* Estimated Cost Per Position */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Est. Cost / Position (₹) *</label>
                  <input
                    type="number"
                    step="25000"
                    min="0"
                    required
                    value={formData.estimatedCostPerPosition}
                    onChange={e => updateHeadcountAndCosts('estimatedCostPerPosition', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-purple-600 font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400">₹{(formData.estimatedCostPerPosition / 100000).toFixed(2)} Lakh / Hire</span>
                </div>

                {/* Total Estimated Cost (Auto-Calculated) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Total Estimated Budget (₹)</label>
                  <div className="px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 text-xs font-mono font-extrabold text-emerald-900 flex items-center justify-between">
                    <span>₹{formData.totalEstimatedCost.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] uppercase font-bold text-emerald-700">
                      ₹{(formData.totalEstimatedCost / 100000).toFixed(2)} L
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">Vacancies &times; Cost / Pos</span>
                </div>
              </div>

              {/* Justification & Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Strategic Justification & Business Case</label>
                <textarea
                  rows="2"
                  placeholder="Specify operational necessity, ambulance allocation, project tender requirements, or expansion goals..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-purple-600"
                />
              </div>
            </div>

            {/* Bottom Form Actions */}
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
                className="px-5 py-2 text-xs font-bold rounded-xl bg-purple-700 hover:bg-purple-800 text-white shadow-2xs transition cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Authorizing...' : 'Authorize Staffing Plan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DEDICATED TABLE CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table Filters Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by department, role, company, or project..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-purple-600"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Company Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500">Company:</span>
              <select
                value={companyFilter}
                onChange={e => setCompanyFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-purple-600"
              >
                <option value="All">All Companies</option>
                {companies.map(c => (
                  <option key={c.companyId || c.id} value={c.companyId || c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>

            {/* Project Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500">Project:</span>
              <select
                value={projectFilter}
                onChange={e => setProjectFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-purple-600"
              >
                <option value="All">All Projects</option>
                {projects.map(p => (
                  <option key={p.projectId || p.id} value={p.projectId || p.id}>
                    {p.projectName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                {layoutColumns.map((col) => (
                  <th
                    key={col.key || col.columnId}
                    style={col.width && col.width !== 'auto' ? { width: col.width } : undefined}
                    className={`py-3 px-4 ${
                      col.alignment === 'center' ? 'text-center' : col.alignment === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {col.header}
                  </th>
                ))}
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={layoutColumns.length + 1} className="py-10 text-center text-slate-400">
                    <RefreshCw size={24} className="mx-auto animate-spin text-purple-600 mb-2" />
                    <span>Loading authorized manpower plans...</span>
                  </td>
                </tr>
              ) : filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={layoutColumns.length + 1} className="py-10 text-center text-slate-400">
                    <Users size={28} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-600">No Manpower Staffing Plans Found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Click "+ New Staffing Plan" to authorize headcount capacity.</p>
                  </td>
                </tr>
              ) : (
                filteredPlans.map(plan => (
                  <tr key={plan.id} className="hover:bg-slate-50/80 transition">
                    {layoutColumns.map((col) => (
                      <td
                        key={col.key || col.columnId}
                        className={`py-3.5 px-4 ${
                          col.alignment === 'center' ? 'text-center' : col.alignment === 'right' ? 'text-right' : 'text-left'
                        }`}
                      >
                        {renderPlanCell(plan, col)}
                      </td>
                    ))}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeletePlan(plan)}
                        disabled={deletingId === plan.id}
                        title="Delete Staffing Plan"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 size={14} className={deletingId === plan.id ? 'animate-spin' : ''} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Showing {filteredPlans.length} authorized staffing plans</span>
          <Link to="/module/hrms/job-postings" className="text-purple-700 hover:underline font-bold flex items-center gap-1">
            <span>Post Job Vacancies for Open Deficit</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  )
}
