import React, { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useToast } from '../../../components/ToastProvider'
import { getCandidates, convertCandidateToEmployee } from '../../../api/recruitment'
import {
  UserCheck,
  Search,
  RefreshCw,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Building2,
  Mail,
  Phone,
  Briefcase,
  ShieldCheck,
  Clock,
  X
} from 'lucide-react'

export default function AutomatedOnboarding() {
  const showToast = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedCandidateId = searchParams.get('candidateId')

  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [converting, setConverting] = useState(false)

  const [onboardForm, setOnboardForm] = useState({
    corporateEmail: '',
    employmentType: 'Permanent Full-Time',
    department: '',
    designation: '',
    dateOfJoining: new Date().toISOString().split('T')[0]
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getCandidates()
      const list = Array.isArray(data) ? data : []
      // Show ready to onboard and recently hired candidates
      setCandidates(list.filter(c => c.stage === 'Ready to Onboard' || c.stage === 'Hired' || c.stage === 'Offer Extended'))

      if (preselectedCandidateId) {
        const found = list.find(c => c.id === preselectedCandidateId)
        if (found) {
          selectCandidateForOnboarding(found)
        }
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to load onboarding candidates.', 'error', 3500)
      setCandidates([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const selectCandidateForOnboarding = (candidate) => {
    setSelectedCandidate(candidate)
    const baseEmail = candidate.fullName.toLowerCase().replace(/[^a-z0-9]/g, '.')
    setOnboardForm({
      corporateEmail: `${baseEmail}@uabindia.in`,
      employmentType: 'Permanent Full-Time',
      department: candidate.department || 'Operations',
      designation: candidate.jobTitle || 'Field Officer',
      dateOfJoining: new Date().toISOString().split('T')[0]
    })
  }

  const handleConvert = async (e) => {
    e.preventDefault()
    if (!selectedCandidate) return

    setConverting(true)
    try {
      const res = await convertCandidateToEmployee(selectedCandidate.id, onboardForm)
      showToast(`Candidate ${selectedCandidate.fullName} converted to employee ${res.employeeCode}! 🎉`, 'success', 4000)
      setSelectedCandidate(null)
      await loadData()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to onboard candidate.', 'error', 3500)
    } finally {
      setConverting(false)
    }
  }

  // Filter candidates
  const filtered = candidates.filter(c => {
    const q = searchTerm.toLowerCase()
    return (
      (c.fullName || '').toLowerCase().includes(q) ||
      (c.candidateCode || '').toLowerCase().includes(q) ||
      (c.jobTitle || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    )
  })

  const readyCount = candidates.filter(c => c.stage === 'Ready to Onboard').length
  const hiredCount = candidates.filter(c => c.stage === 'Hired').length

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
              <UserCheck size={18} />
            </div>
            <h1 className="text-lg font-bold text-slate-900">Automated 1-Click Employee Onboarding</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Seamlessly generate employee profiles, contacts, and organization master records from ATS candidate data
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            title="Refresh Table"
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-teal-700' : ''} />
          </button>

          <Link
            to="/module/hrms/employee-master"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-2xs transition"
          >
            <ShieldCheck size={14} className="text-teal-700" />
            <span>Open Employee Master</span>
          </Link>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Ready to Onboard</div>
          <div className="text-xl font-black text-teal-800 font-mono mt-1">{readyCount}</div>
          <div className="text-[10px] text-teal-600 mt-0.5 font-medium">Pre-hire verification complete</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Successfully Hired</div>
          <div className="text-xl font-black text-emerald-700 font-mono mt-1">{hiredCount}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5 font-medium">Converted to active employee profile</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Auto Employee Code</div>
          <div className="text-base font-black text-purple-900 font-mono mt-1">EMP-YYMM-XXX</div>
          <div className="text-[10px] text-purple-700 mt-0.5 font-medium">Auto-generated upon onboarding</div>
        </div>
      </div>

      {/* IN-CONTENT FULL-SCREEN PROFILE REVIEW & CONVERSION PANEL (NO POPUP MODAL) */}
      {selectedCandidate && (
        <div className="bg-white rounded-2xl border-2 border-teal-400 p-5 sm:p-6 shadow-md transition-all">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-teal-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles size={16} className="text-teal-600" />
                <span>Onboarding Profile Review: {selectedCandidate.fullName}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify corporate credentials and assign organizational structure before generating profile
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCandidate(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleConvert} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-teal-50/50 p-4 rounded-xl border border-teal-100">
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400">Candidate Name</div>
                <div className="text-xs font-bold text-slate-900 mt-0.5">{selectedCandidate.fullName}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400">Personal Contact</div>
                <div className="text-xs font-mono text-slate-700 mt-0.5">{selectedCandidate.phone} • {selectedCandidate.email}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400">Offered Position</div>
                <div className="text-xs font-semibold text-slate-900 mt-0.5">{selectedCandidate.jobTitle || 'Staff Member'}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Generated Corporate Email *</label>
                <input
                  type="email"
                  required
                  value={onboardForm.corporateEmail}
                  onChange={e => setOnboardForm({ ...onboardForm, corporateEmail: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-teal-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Employment Type *</label>
                <select
                  value={onboardForm.employmentType}
                  onChange={e => setOnboardForm({ ...onboardForm, employmentType: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-teal-600"
                >
                  <option value="Permanent Full-Time">Permanent Full-Time</option>
                  <option value="Contractual">Contractual (Fixed Term)</option>
                  <option value="Probationary">Probationary (6 Months)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date of Joining *</label>
                <input
                  type="date"
                  required
                  value={onboardForm.dateOfJoining}
                  onChange={e => setOnboardForm({ ...onboardForm, dateOfJoining: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-teal-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Department</label>
                <input
                  type="text"
                  value={onboardForm.department}
                  onChange={e => setOnboardForm({ ...onboardForm, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Official Designation</label>
                <input
                  type="text"
                  value={onboardForm.designation}
                  onChange={e => setOnboardForm({ ...onboardForm, designation: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-teal-600"
                />
              </div>

              <div className="flex items-end">
                <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200 w-full">
                  <span className="font-bold text-slate-700">Auto Action:</span> Inserts into <code className="font-mono text-teal-800 font-bold">EmployeeMaster</code> and links organization profile.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={converting}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-teal-700 hover:bg-teal-800 text-white shadow-2xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Sparkles size={14} />
                <span>{converting ? 'Generating Profile...' : 'Complete 1-Click Onboarding'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DEDICATED TABLE CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table Filters Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidate by name, code or role..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-teal-600"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase text-[10.5px] font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Candidate Code</th>
                <th className="py-3 px-4">Candidate Name</th>
                <th className="py-3 px-4">Role & Department</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Expected CTC</th>
                <th className="py-3 px-4 text-center">Stage Status</th>
                <th className="py-3 px-4 text-center">Employee ID</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-10 text-center text-slate-400">
                    <RefreshCw size={24} className="mx-auto animate-spin text-teal-600 mb-2" />
                    <span>Loading onboarding candidates...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-10 text-center text-slate-400">
                    <UserCheck size={28} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-600">No Candidates Waiting for Onboarding</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Move candidates to "Ready to Onboard" from the Candidate Pipeline page.</p>
                  </td>
                </tr>
              ) : (
                filtered.map(c => {
                  const isHired = c.stage === 'Hired'
                  const isReady = c.stage === 'Ready to Onboard'

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-teal-800">
                        {c.candidateCode}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{c.fullName}</div>
                        <div className="text-[11px] text-slate-400">{c.currentCompany || 'Selected Candidate'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-700">{c.jobTitle || 'Staff Member'}</div>
                        <div className="text-[11px] text-slate-400">{c.department || 'Operations'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-700">{c.email}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{c.phone}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {c.expectedCTC ? `₹${(Number(c.expectedCTC) / 100000).toFixed(1)}L` : 'Standard Grade'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isHired
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : isReady
                            ? 'bg-teal-50 text-teal-800 border-teal-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}>
                          {c.stage}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                        {c.hiredAsEmployeeId ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            Converted
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Pending</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isHired ? (
                          <Link
                            to="/module/hrms/employee-master"
                            className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:underline"
                          >
                            <span>View in Master</span>
                            <ArrowRight size={11} />
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => selectCandidateForOnboarding(c)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-2xs transition cursor-pointer"
                          >
                            <Sparkles size={12} />
                            <span>Onboard &rarr;</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Showing {filtered.length} candidates in onboarding pipeline</span>
          <Link to="/module/hrms/employee-master" className="text-teal-700 hover:underline font-bold">
            Explore Employee Master & Directory &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}
