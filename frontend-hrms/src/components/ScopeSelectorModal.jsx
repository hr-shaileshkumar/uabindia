import React, { useState, useEffect } from 'react'
import { listCompanies } from '../api/companies'
import { listProjects } from '../api/projects'
import {
  Building2,
  FolderKanban,
  Calendar,
  Check,
  Search,
  X,
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react'

export default function ScopeSelectorModal({ isOpen, onClose, onScopeChanged }) {
  if (!isOpen) return null

  const [companies, setCompanies] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  // Selected state
  const [selectedCompanyId, setSelectedCompanyId] = useState(
    () => localStorage.getItem('sel_company_id') || ''
  )
  const [selectedCompanyName, setSelectedCompanyName] = useState(
    () => localStorage.getItem('sel_company') || 'All Companies'
  )
  const [selectedProjectId, setSelectedProjectId] = useState(
    () => localStorage.getItem('sel_project_id') || ''
  )
  const [selectedProjectName, setSelectedProjectName] = useState(
    () => localStorage.getItem('sel_project') || 'All Projects'
  )
  const [selectedYear, setSelectedYear] = useState(
    () => localStorage.getItem('sel_year') || '2026-27'
  )

  // Search terms
  const [companySearch, setCompanySearch] = useState('')
  const [projectSearch, setProjectSearch] = useState('')

  // Financial Years
  const fyList = ['2026-27', '2025-26', '2024-25', '2023-24']

  // Load companies
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    listCompanies({ status: 'active' })
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.items || res?.companies || res?.records || res?.data || [])
        if (!cancelled) {
          setCompanies(list)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  // Load projects based on selected company
  useEffect(() => {
    let cancelled = false
    const params = { status: 'active' }
    if (selectedCompanyId) params.companyId = selectedCompanyId

    listProjects(params)
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.projects || res?.items || res?.records || res?.data || [])
        if (!cancelled) {
          setProjects(list)
        }
      })
      .catch(() => {
        if (!cancelled) setProjects([])
      })
    return () => { cancelled = true }
  }, [selectedCompanyId])

  const filteredCompanies = companies.filter(c => {
    const name = (c.companyName || c.CompanyName || c.name || '').toLowerCase()
    return name.includes(companySearch.toLowerCase())
  })

  const filteredProjects = projects.filter(p => {
    const name = (p.projectName || p.ProjectName || p.title || p.name || '').toLowerCase()
    return name.includes(projectSearch.toLowerCase())
  })

  const handleApply = () => {
    // Save to local storage
    if (selectedCompanyId) {
      localStorage.setItem('sel_company_id', selectedCompanyId)
      localStorage.setItem('sel_company', selectedCompanyName)
    } else {
      localStorage.removeItem('sel_company_id')
      localStorage.setItem('sel_company', 'All Companies')
    }

    if (selectedProjectId) {
      localStorage.setItem('sel_project_id', selectedProjectId)
      localStorage.setItem('sel_project', selectedProjectName)
    } else {
      localStorage.removeItem('sel_project_id')
      localStorage.setItem('sel_project', 'All Projects')
    }

    localStorage.setItem('sel_year', selectedYear)

    // Notify listeners
    window.dispatchEvent(new CustomEvent('app:context-changed'))
    if (onScopeChanged) onScopeChanged()

    onClose()

    // Smooth page context refresh
    setTimeout(() => {
      window.location.reload()
    }, 150)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150 flex flex-col max-h-[90dvh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-purple-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Switch Working Scope</h3>
              <p className="text-[11px] text-slate-500">Filter all data across Company, Project & Financial Year</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1 scrollbar-thin">
          {/* Section 1: Operating Company */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Building2 size={14} className="text-purple-600" />
                <span>Operating Company</span>
              </label>
              <span className="text-[10px] text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-full">
                {companies.length} Active
              </span>
            </div>

            {companies.length > 3 && (
              <div className="relative mb-2">
                <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  id="scope-company-search-input"
                  name="scopeCompanySearch"
                  type="text"
                  placeholder="Search company..."
                  value={companySearch}
                  onChange={e => setCompanySearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-purple-600 focus:outline-none transition"
                />
              </div>
            )}

            <div className="space-y-1 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
              <button
                type="button"
                onClick={() => {
                  setSelectedCompanyId('')
                  setSelectedCompanyName('All Companies')
                  setSelectedProjectId('')
                  setSelectedProjectName('All Projects')
                }}
                className={`flex w-full items-center justify-between p-2 rounded-xl text-xs transition cursor-pointer ${
                  !selectedCompanyId
                    ? 'bg-purple-50 text-purple-900 font-bold border border-purple-200 shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <span>All Companies (Consolidated)</span>
                {!selectedCompanyId && <Check size={14} className="text-purple-700 shrink-0" />}
              </button>

              {filteredCompanies.map(co => {
                const id = co.companyId || co.CompanyId || co.id
                const name = co.companyName || co.CompanyName || co.name || 'Company'
                const isSelected = String(id) === String(selectedCompanyId)

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setSelectedCompanyId(id)
                      setSelectedCompanyName(name)
                      setSelectedProjectId('')
                      setSelectedProjectName('All Projects')
                    }}
                    className={`flex w-full items-center justify-between p-2 rounded-xl text-xs transition cursor-pointer ${
                      isSelected
                        ? 'bg-purple-50 text-purple-900 font-bold border border-purple-200 shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <span className="truncate pr-2">{name}</span>
                    {isSelected && <Check size={14} className="text-purple-700 shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Section 2: Assigned Project */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FolderKanban size={14} className="text-indigo-600" />
                <span>Project / Scope</span>
              </label>
              <span className="text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full">
                {projects.length} Available
              </span>
            </div>

            {projects.length > 3 && (
              <div className="relative mb-2">
                <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  id="scope-project-search-input"
                  name="scopeProjectSearch"
                  type="text"
                  placeholder="Search project..."
                  value={projectSearch}
                  onChange={e => setProjectSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:outline-none transition"
                />
              </div>
            )}

            <div className="space-y-1 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
              <button
                type="button"
                onClick={() => {
                  setSelectedProjectId('')
                  setSelectedProjectName('All Projects')
                }}
                className={`flex w-full items-center justify-between p-2 rounded-xl text-xs transition cursor-pointer ${
                  !selectedProjectId
                    ? 'bg-indigo-50 text-indigo-900 font-bold border border-indigo-200 shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <span>All Projects</span>
                {!selectedProjectId && <Check size={14} className="text-indigo-700 shrink-0" />}
              </button>

              {filteredProjects.map(pr => {
                const id = pr.projectId || pr.ProjectId || pr.id
                const name = pr.projectName || pr.ProjectName || pr.title || pr.name || 'Project'
                const isSelected = String(id) === String(selectedProjectId)

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setSelectedProjectId(id)
                      setSelectedProjectName(name)
                    }}
                    className={`flex w-full items-center justify-between p-2 rounded-xl text-xs transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-900 font-bold border border-indigo-200 shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <span className="truncate pr-2">{name}</span>
                    {isSelected && <Check size={14} className="text-indigo-700 shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Section 3: Financial Year */}
          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <Calendar size={14} className="text-amber-600" />
              <span>Financial Year</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {fyList.map(fy => (
                <button
                  key={fy}
                  type="button"
                  onClick={() => setSelectedYear(fy)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition cursor-pointer border text-center ${
                    selectedYear === fy
                      ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {fy}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-purple-700 hover:bg-purple-800 text-white shadow-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <Check size={14} />
            <span>Apply & Switch Scope</span>
          </button>
        </div>
      </div>
    </div>
  )
}
