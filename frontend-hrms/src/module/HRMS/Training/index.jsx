import React, { useState, useEffect } from 'react'
import {
  GraduationCap,
  Plus,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  Award,
  Video,
  MapPin,
  X,
  FileText
} from 'lucide-react'
import { getTrainingPrograms, createTrainingProgram, getProgramNominations, nominateEmployee, updateNominationAttendance } from '../../../api/training'
import api from '../../../api/axios'

export default function TrainingHub() {
  const [programs, setPrograms] = useState([])
  const [selectedProgram, setSelectedProgram] = useState(null)
  const [nominations, setNominations] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showProgramForm, setShowProgramForm] = useState(false)
  const [showNominateForm, setShowNominateForm] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const [programForm, setProgramForm] = useState({
    programTitle: '',
    category: 'Technical',
    trainerName: '',
    trainingMode: 'Online Webinar',
    startDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0],
    durationHours: 8,
    maxParticipants: 40,
    venueOrLink: 'https://meet.google.com/uabindia-training-session',
    description: 'Comprehensive clinical procedures and diagnostic protocol.'
  })

  const [nominateForm, setNominateForm] = useState({
    employeeId: ''
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [progData, empRes] = await Promise.all([
        getTrainingPrograms(),
        api.get('/employees').catch(() => ({ data: [] }))
      ])
      setPrograms(progData)
      setEmployees(empRes.data || [])
      if (progData.length > 0 && !selectedProgram) {
        setSelectedProgram(progData[0])
        loadNominations(progData[0].Id)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadNominations = async (progId) => {
    try {
      const nomData = await getProgramNominations(progId)
      setNominations(nomData)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const showToast = (msg, isError = false) => {
    setFeedback({ msg, isError })
    setTimeout(() => setFeedback(null), 4000)
  }

  const handleCreateProgram = async (e) => {
    e.preventDefault()
    try {
      await createTrainingProgram(programForm)
      showToast('Training program scheduled successfully.')
      setShowProgramForm(false)
      loadData()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create training', true)
    }
  }

  const handleNominate = async (e) => {
    e.preventDefault()
    if (!selectedProgram || !nominateForm.employeeId) return
    try {
      await nominateEmployee({
        programId: selectedProgram.Id,
        employeeId: nominateForm.employeeId
      })
      showToast('Employee nominated successfully.')
      setShowNominateForm(false)
      loadNominations(selectedProgram.Id)
    } catch (err) {
      showToast(err.response?.data?.message || 'Nomination failed', true)
    }
  }

  const handleAttendance = async (nomId, status, score = 85) => {
    try {
      await updateNominationAttendance(nomId, {
        attendanceStatus: status,
        assessmentScore: score,
        certificateIssued: status === 'Attended'
      })
      showToast(`Attendance marked as ${status}. Certificate issued!`)
      if (selectedProgram) loadNominations(selectedProgram.Id)
    } catch (err) {
      showToast('Failed to update attendance', true)
    }
  }

  return (
    <div className="w-full space-y-6">
      {feedback && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
          feedback.isError ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          <span>{feedback.msg}</span>
          <button onClick={() => setFeedback(null)}><X size={16} /></button>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-violet-900 via-purple-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/30 text-purple-200 border border-purple-400/30 uppercase tracking-wider">
              Learning & Workforce Capability
            </span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">
            Training & Skill Development (L&D)
          </h1>
          <p className="text-xs text-purple-200/80 mt-1 max-w-2xl">
            Schedule specialized veterinary clinical workshops, POSH compliance seminars, defensive driving programs, employee nominations, and certification tracking.
          </p>
        </div>

        <button
          onClick={() => setShowProgramForm(!showProgramForm)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg transition"
        >
          <Plus size={16} />
          {showProgramForm ? 'Close Form' : 'Schedule Training Program'}
        </button>
      </div>

      {/* Full-Screen Content Area Program Form */}
      {showProgramForm && (
        <div className="bg-white border-2 border-purple-300 rounded-2xl p-6 shadow-md transition-all">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Schedule New Learning & Skill Program</h2>
              <p className="text-xs text-slate-500">Configure program module, trainer profile, mode of delivery and participation capacity</p>
            </div>
            <button onClick={() => setShowProgramForm(false)} className="text-slate-400 hover:text-slate-600 p-1">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleCreateProgram} className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Program Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Advanced Ultrasound Diagnostics for Mobile Ambulances"
                value={programForm.programTitle}
                onChange={e => setProgramForm({ ...programForm, programTitle: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={programForm.category}
                onChange={e => setProgramForm({ ...programForm, category: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500"
              >
                <option value="Technical">Technical & Clinical</option>
                <option value="POSH & Compliance">POSH & Compliance</option>
                <option value="Field Operations">Field Ambulatory Operations</option>
                <option value="Leadership">Leadership & Soft Skills</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Trainer / Facilitator Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. K. N. Sinha"
                value={programForm.trainerName}
                onChange={e => setProgramForm({ ...programForm, trainerName: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Training Mode</label>
              <select
                value={programForm.trainingMode}
                onChange={e => setProgramForm({ ...programForm, trainingMode: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500"
              >
                <option value="Online Webinar">Online Webinar</option>
                <option value="In-Person">In-Person Workshop</option>
                <option value="LMS Self-Paced">LMS Self-Paced</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Hours)</label>
              <input
                type="number"
                value={programForm.durationHours}
                onChange={e => setProgramForm({ ...programForm, durationHours: parseInt(e.target.value) || 8 })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={programForm.startDate}
                onChange={e => setProgramForm({ ...programForm, startDate: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                value={programForm.endDate}
                onChange={e => setProgramForm({ ...programForm, endDate: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Max Participants</label>
              <input
                type="number"
                value={programForm.maxParticipants}
                onChange={e => setProgramForm({ ...programForm, maxParticipants: parseInt(e.target.value) || 40 })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Venue or Meeting Link</label>
              <input
                type="text"
                placeholder="Google Meet / Zoom URL or Physical Conference Room"
                value={programForm.venueOrLink}
                onChange={e => setProgramForm({ ...programForm, venueOrLink: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowProgramForm(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md"
              >
                Schedule Program
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Program Catalog & Nominations Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Programs Catalog */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            Active Programs ({programs.length})
          </h3>

          {programs.map(prog => {
            const isSelected = selectedProgram?.Id === prog.Id
            return (
              <div
                key={prog.Id}
                onClick={() => {
                  setSelectedProgram(prog)
                  loadNominations(prog.Id)
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-purple-50 border-purple-400 shadow-md ring-1 ring-purple-300'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-mono font-bold text-purple-700 bg-purple-100/60 px-2 py-0.5 rounded text-[10px]">
                    {prog.ProgramCode}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {prog.Category}
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 text-sm leading-snug">{prog.ProgramTitle}</h4>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <Users size={12} className="text-slate-400" />
                  Trainer: {prog.TrainerName}
                </p>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {prog.DurationHours}h • {prog.TrainingMode}
                  </span>
                  <span className="font-bold text-purple-700">
                    {prog.NominatedCount || 0} / {prog.MaxParticipants} Nominated
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Right Column: Program Details & Nominations */}
        <div className="lg:col-span-2 space-y-4">
          {selectedProgram ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                      {selectedProgram.ProgramCode}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">• {selectedProgram.Category}</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-1">{selectedProgram.ProgramTitle}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Trainer: <strong>{selectedProgram.TrainerName}</strong> • {selectedProgram.TrainingMode} • {selectedProgram.DurationHours} Hours
                  </p>
                </div>

                <button
                  onClick={() => setShowNominateForm(!showNominateForm)}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow transition flex items-center gap-1.5 shrink-0"
                >
                  <Plus size={14} />
                  Nominate Staff
                </button>
              </div>

              {/* Inline Nominate Form */}
              {showNominateForm && (
                <form onSubmit={handleNominate} className="bg-purple-50/60 p-4 rounded-xl border border-purple-200 space-y-3">
                  <h4 className="text-xs font-bold text-purple-900">Nominate Employee for this Program</h4>
                  <div className="flex items-center gap-2">
                    <select
                      required
                      value={nominateForm.employeeId}
                      onChange={e => setNominateForm({ ...nominateForm, employeeId: e.target.value })}
                      className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">-- Choose Employee --</option>
                      {employees.map(e => (
                        <option key={e.id || e.Id} value={e.id || e.Id}>
                          {e.code || e.EmployeeCode} • {e.name || (e.FirstName + ' ' + e.LastName)}
                        </option>
                      ))}
                    </select>

                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow"
                    >
                      Confirm Nomination
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNominateForm(false)}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Nominations List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Enrolled Nominations ({nominations.length})</span>
                  <span className="text-slate-400 font-normal">Attendance & Score Tracker</span>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                  {nominations.map(nom => (
                    <div key={nom.Id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{nom.EmployeeName}</span>
                        <div className="text-[11px] text-slate-400">
                          {nom.EmployeeCode} • {nom.Designation || 'Field Staff'}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {nom.CertificateIssued ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <Award size={12} /> Certified ({nom.AssessmentScore || 85}%)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                            {nom.AttendanceStatus}
                          </span>
                        )}

                        {nom.AttendanceStatus !== 'Attended' && (
                          <button
                            onClick={() => handleAttendance(nom.Id, 'Attended', 90)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition"
                          >
                            Mark Attended & Certify
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {nominations.length === 0 && (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      No employees nominated yet. Click 'Nominate Staff' above to enroll participants.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs">
              Select a training program from the left to view sessions and employee attendance.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
