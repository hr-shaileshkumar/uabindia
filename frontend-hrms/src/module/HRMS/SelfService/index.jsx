import React, { useState, useEffect } from 'react'
import {
  User,
  Calendar,
  CreditCard,
  HelpCircle,
  Clock,
  Plus,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Mail,
  Phone,
  Building2,
  X,
  Send,
  Printer,
  Sparkles,
  MapPin,
  CalendarDays,
  ShieldCheck,
} from 'lucide-react'
import {
  getEssOverview,
  getEssLeaves,
  applyEssLeave,
  getEssPayslips,
  getEssTickets,
  createEssTicket
} from '../../../api/selfService'
import PageHeader from '../../../components/PageHeader'
import LayoutVersionBadge from '../../../components/LayoutVersionBadge'
import { Button, Badge, Modal, Card } from '../../../components/ui'

export default function EmployeeSelfService() {
  const [activeTab, setActiveTab] = useState('overview') // overview | leaves | payslips | helpdesk
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [leaves, setLeaves] = useState([])
  const [payslips, setPayslips] = useState([])
  const [tickets, setTickets] = useState([])
  const [feedback, setFeedback] = useState(null)

  // Modals
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [selectedPayslip, setSelectedPayslip] = useState(null)

  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'Casual Leave',
    startDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    daysRequested: 2,
    reason: 'Personal family commitment'
  })

  const [ticketForm, setTicketForm] = useState({
    category: 'General HR',
    subject: '',
    description: '',
    priority: 'Medium'
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [ovData, lvData, psData, tkData] = await Promise.all([
        getEssOverview(),
        getEssLeaves(),
        getEssPayslips(),
        getEssTickets()
      ])
      setData(ovData)
      setLeaves(Array.isArray(lvData) ? lvData : [])
      setPayslips(Array.isArray(psData) ? psData : [])
      setTickets(Array.isArray(tkData) ? tkData : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const showToast = (msg, isError = false) => {
    setFeedback({ msg, isError })
    setTimeout(() => setFeedback(null), 4000)
  }

  const handleApplyLeave = async (e) => {
    e.preventDefault()
    if (!data?.profile?.Id) return
    try {
      await applyEssLeave({
        employeeId: data.profile.Id,
        ...leaveForm
      })
      showToast('Leave request submitted to your manager.')
      setShowLeaveModal(false)
      loadData()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit leave', true)
    }
  }

  const handleCreateTicket = async (e) => {
    e.preventDefault()
    if (!data?.profile?.Id) return
    try {
      await createEssTicket({
        employeeId: data.profile.Id,
        ...ticketForm
      })
      showToast('HR Helpdesk query submitted.')
      setShowTicketModal(false)
      setTicketForm({ category: 'General HR', subject: '', description: '', priority: 'Medium' })
      loadData()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit query', true)
    }
  }

  const profile = data?.profile || {}
  const leaveBalances = data?.leaveBalances || [
    { LeaveType: 'Casual Leave', AllocatedDays: 12, UsedDays: 4, RemainingDays: 8 },
    { LeaveType: 'Sick / Medical Leave', AllocatedDays: 10, UsedDays: 2, RemainingDays: 8 },
    { LeaveType: 'Earned / Privilege Leave', AllocatedDays: 15, UsedDays: 5, RemainingDays: 10 }
  ]

  const userInitials = (profile.FullName || 'Staff Member')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'EM'

  return (
    <div className="w-full space-y-4 antialiased pb-10">
      {/* 1. Page Header */}
      <PageHeader
        icon={User}
        title="Employee Self-Service (ESS)"
        description="Personal workspace for attendance, leave quotas, pay slips, and HR support"
        badge={profile.Status || 'Active Staff'}
        badgeTone="purple"
      >
        <LayoutVersionBadge entity="self_service" version={1.0} />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => { setActiveTab('helpdesk'); setShowTicketModal(true); }}
          icon={HelpCircle}
        >
          Helpdesk
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={() => { setActiveTab('leaves'); setShowLeaveModal(true); }}
          icon={Calendar}
        >
          Apply Leave
        </Button>
      </PageHeader>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between border shadow-2xs animate-in fade-in duration-150 ${
            feedback.isError
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.isError ? (
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            )}
            <span>{feedback.msg}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 rounded-lg hover:bg-slate-200/50 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 2. Employee Profile Banner Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-700 via-rose-600 to-orange-500 font-extrabold text-white text-lg shadow-md shadow-purple-600/20">
              {userInitials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight truncate">
                  {profile.FullName || 'Staff Member'}
                </h1>
                <Badge tone="purple" dot size="sm">
                  {profile.EmployeeCode || 'EMP-2026-101'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                {profile.Designation || 'Officer'} • {profile.Department || 'Operations'} • {profile.WorkLocation || 'Patna Operations'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <span className="text-[11px] font-semibold text-slate-500">
              Reporting to: <strong className="text-slate-800">{profile.ReportingManager || 'Operations Lead'}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 3. ESS Navigation Segmented Control */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-2xs overflow-hidden">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          {[
            { key: 'overview', label: 'My Balances & Roster', icon: User },
            { key: 'leaves', label: `My Leaves (${leaves.length})`, icon: Calendar },
            { key: 'payslips', label: `Salary Slips (${payslips.length})`, icon: CreditCard },
            { key: 'helpdesk', label: `HR Queries (${tickets.length})`, icon: HelpCircle },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-white' : 'text-slate-500'} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 4. Tab Panels */}
      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Leave Quota Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {leaveBalances.map((b, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:shadow-xs transition"
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                  {b.LeaveType}
                </div>
                <div className="text-2xl font-extrabold text-purple-800 font-mono mt-1">
                  {b.RemainingDays}{' '}
                  <span className="text-xs font-medium text-slate-400">days available</span>
                </div>
                <div className="mt-2 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${Math.min(100, Math.round((b.RemainingDays / (b.AllocatedDays || 1)) * 100))}%`
                    }}
                    className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full"
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 font-medium">
                  <span>Quota: {b.AllocatedDays}d</span>
                  <span>Used: {b.UsedDays}d</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Info & Shift Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                Shift & Attendance Parameters
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-slate-400">Assigned Shift</span>
                  <span className="font-bold">General Morning (09:30 AM - 06:30 PM)</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-slate-400">Grace Buffer Period</span>
                  <span className="font-semibold text-emerald-700">15 Minutes</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-slate-400">GPS Punch Validation</span>
                  <span className="font-semibold text-purple-700">Active Geofence</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                Direct Contact & Escalation
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-slate-400">HR Helpdesk Email</span>
                  <span className="font-bold text-purple-700">hr@uabindia.in</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-slate-400">Emergency Support</span>
                  <span className="font-bold font-mono">+91 99999 00000</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-slate-400">Policy Manual</span>
                  <span className="text-purple-700 font-semibold cursor-pointer hover:underline">
                    Download HR Manual v2.4
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Leaves */}
      {activeTab === 'leaves' && (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">My Leave Applications</h3>
              <p className="text-xs text-slate-500">Track pending and approved absence requests</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowLeaveModal(true)}
              icon={Plus}
            >
              Apply Leave
            </Button>
          </div>

          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2.5">Leave Type</th>
                  <th className="px-3 py-2.5">Timeline</th>
                  <th className="px-3 py-2.5 text-center">Days</th>
                  <th className="px-3 py-2.5">Reason</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {leaves.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      No leave requests logged yet.
                    </td>
                  </tr>
                ) : (
                  leaves.map((l, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-3 py-2.5 font-bold text-slate-900">{l.LeaveType}</td>
                      <td className="px-3 py-2.5 font-mono text-slate-600 text-[11px]">
                        {l.StartDate ? l.StartDate.slice(0, 10) : ''} → {l.EndDate ? l.EndDate.slice(0, 10) : ''}
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-purple-900 font-mono">
                        {l.DaysRequested}d
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 max-w-xs truncate">{l.Reason}</td>
                      <td className="px-3 py-2.5 text-center">
                        <Badge
                          tone={l.Status === 'Approved' ? 'success' : l.Status === 'Rejected' ? 'danger' : 'warning'}
                          size="sm"
                          dot
                        >
                          {l.Status || 'Pending'}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Payslips */}
      {activeTab === 'payslips' && (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4 animate-in fade-in duration-150">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Computerized Salary Slips</h3>
            <p className="text-xs text-slate-500">Monthly disbursed salary slips and earnings breakdown</p>
          </div>

          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2.5">Pay Period</th>
                  <th className="px-3 py-2.5">Gross Pay</th>
                  <th className="px-3 py-2.5">EPF (12%)</th>
                  <th className="px-3 py-2.5">ESIC</th>
                  <th className="px-3 py-2.5">Net Disbursed</th>
                  <th className="px-3 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {payslips.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No salary slips published for your account.
                    </td>
                  </tr>
                ) : (
                  payslips.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-3 py-2.5 font-bold text-slate-900">
                        {p.PayMonth}/{p.PayYear}
                      </td>
                      <td className="px-3 py-2.5 font-mono">₹{Number(p.GrossPay || 0).toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2.5 font-mono text-rose-700">₹{Number(p.PFEmployee || 0).toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2.5 font-mono text-rose-700">₹{Number(p.ESICEmployee || 0).toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2.5 font-mono font-extrabold text-emerald-800">
                        ₹{Number(p.NetPay || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPayslip(p)}
                          icon={FileText}
                        >
                          View Slip
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Helpdesk */}
      {activeTab === 'helpdesk' && (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">HR Queries & Support Tickets</h3>
              <p className="text-xs text-slate-500">Lodge requests regarding payroll, documents, or attendance corrections</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowTicketModal(true)}
              icon={Plus}
            >
              New Query
            </Button>
          </div>

          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2.5">Category</th>
                  <th className="px-3 py-2.5">Subject</th>
                  <th className="px-3 py-2.5 text-center">Priority</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                  <th className="px-3 py-2.5">Resolution Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      No support tickets logged.
                    </td>
                  </tr>
                ) : (
                  tickets.map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-3 py-2.5 font-bold text-slate-900">{t.Category}</td>
                      <td className="px-3 py-2.5 text-slate-800 font-medium">{t.Subject}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-purple-700">{t.Priority}</td>
                      <td className="px-3 py-2.5 text-center">
                        <Badge tone={t.Status === 'Closed' ? 'success' : 'warning'} size="sm" dot>
                          {t.Status || 'Open'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-slate-500 text-[11px]">{t.ResolutionNotes || 'In review by HR'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Modals */}
      {/* Leave Modal */}
      <Modal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        title="Apply for Leave"
        description="Submit planned absence or sick leave for supervisory approval"
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setShowLeaveModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleApplyLeave} icon={Send}>
              Submit Request
            </Button>
          </>
        }
      >
        <form onSubmit={handleApplyLeave} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Leave Category *</label>
            <select
              value={leaveForm.leaveType}
              onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
              className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-purple-600 focus:outline-none cursor-pointer"
            >
              <option value="Casual Leave">Casual Leave (CL)</option>
              <option value="Sick / Medical Leave">Sick / Medical Leave (SL)</option>
              <option value="Earned / Privilege Leave">Earned / Privilege Leave (EL)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">From *</label>
              <input
                type="date"
                required
                value={leaveForm.startDate}
                onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-purple-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">To *</label>
              <input
                type="date"
                required
                value={leaveForm.endDate}
                onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-purple-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Absence *</label>
            <textarea
              rows={3}
              required
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
              placeholder="Detail reasons and emergency contact details..."
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-purple-600 focus:outline-none"
            />
          </div>
        </form>
      </Modal>

      {/* Ticket Modal */}
      <Modal
        isOpen={showTicketModal}
        onClose={() => setShowTicketModal(false)}
        title="Lodge Support Query"
        description="Direct question to HR administration regarding salary, roster, or letters"
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setShowTicketModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleCreateTicket} icon={Send}>
              Submit Query
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateTicket} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
            <select
              value={ticketForm.category}
              onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
              className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-purple-600 focus:outline-none cursor-pointer"
            >
              <option value="General HR">General HR Query</option>
              <option value="Payroll & Salary">Payroll & Salary Calculation</option>
              <option value="Attendance & Punch">Attendance & Missed Punch Correction</option>
              <option value="Tax & TDS">Tax & Form 16 / TDS</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Subject *</label>
            <input
              type="text"
              required
              value={ticketForm.subject}
              onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
              placeholder="Brief summary of request..."
              className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-purple-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Explanation *</label>
            <textarea
              rows={3}
              required
              value={ticketForm.description}
              onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
              placeholder="Explain the specific issue with relevant dates or codes..."
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-purple-600 focus:outline-none"
            />
          </div>
        </form>
      </Modal>

      {/* Payslip Modal Preview */}
      {selectedPayslip && (
        <Modal
          isOpen={Boolean(selectedPayslip)}
          onClose={() => setSelectedPayslip(null)}
          title={`Digital Pay Slip • ${selectedPayslip.PayMonth}/${selectedPayslip.PayYear}`}
          description={`Employee: ${profile.FullName || 'Staff Member'} (${profile.EmployeeCode || 'EMP-1962'})`}
          maxWidth="max-w-lg"
          footer={
            <>
              <Button variant="secondary" size="md" onClick={() => setSelectedPayslip(null)}>
                Close
              </Button>
              <Button variant="primary" size="md" onClick={() => window.print()} icon={Printer}>
                Print Slip
              </Button>
            </>
          }
        >
          <div className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 space-y-1.5">
                <span className="font-bold text-emerald-900 block border-b border-emerald-200 pb-1">Earnings</span>
                <div className="flex justify-between">
                  <span>Gross Pay</span>
                  <span className="font-mono font-bold">₹{Number(selectedPayslip.GrossPay || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-3 space-y-1.5">
                <span className="font-bold text-rose-900 block border-b border-rose-200 pb-1">Deductions</span>
                <div className="flex justify-between">
                  <span>EPF (12%)</span>
                  <span className="font-mono">₹{Number(selectedPayslip.PFEmployee || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>ESIC</span>
                  <span className="font-mono">₹{Number(selectedPayslip.ESICEmployee || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-purple-950 text-white p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-purple-300">Net Take-Home Disbursed</span>
                <div className="text-xl font-black font-mono">₹{Number(selectedPayslip.NetPay || 0).toLocaleString('en-IN')}</div>
              </div>
              <span className="text-[11px] text-emerald-400 font-bold">Paid via NEFT</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
