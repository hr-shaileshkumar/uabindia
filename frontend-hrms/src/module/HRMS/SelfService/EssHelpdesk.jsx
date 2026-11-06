import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../../../components/ToastProvider'
import { getMyTickets, raiseTicket } from '../../../api/selfService'
import { usePageLayout } from '../../../hooks/usePageLayout'
import LayoutVersionBadge from '../../../components/LayoutVersionBadge'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Modal } from '../../../components/ui/Modal'
import {
  HelpCircle,
  Plus,
  RefreshCw,
  Clock,
  Sparkles,
  Inbox,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'

const DEFAULT_HELPDESK_COLUMNS = [
  { key: 'ticketNumber', header: 'Ticket No', alignment: 'left', width: '130px' },
  { key: 'category', header: 'Category', alignment: 'left', width: '150px' },
  { key: 'subject', header: 'Subject & Description', alignment: 'left' },
  { key: 'priority', header: 'Priority', alignment: 'left', width: '110px' },
  { key: 'status', header: 'Status', alignment: 'center', width: '120px' },
  { key: 'createdAt', header: 'Created Date', alignment: 'left', width: '120px' }
]

function renderTicketCell(t, col) {
  const key = (col.key || '').toLowerCase()
  const alignClass = col.alignment === 'center' ? 'text-center' : col.alignment === 'right' ? 'text-right' : 'text-left'

  if (key === 'ticketnumber' || key === 'ticketno' || key === 'code') {
    return (
      <td key={col.key} className={`py-3.5 px-4 font-mono font-bold text-purple-700 ${alignClass}`}>
        {t.ticketNumber || `TKT-${t.id?.slice?.(0, 6) || 'REQ'}`}
      </td>
    )
  }

  if (key === 'category') {
    return (
      <td key={col.key} className={`py-3.5 px-4 font-semibold text-slate-700 ${alignClass}`}>
        {t.category}
      </td>
    )
  }

  if (key === 'subject' || key === 'description' || key === 'details') {
    return (
      <td key={col.key} className={`py-3.5 px-4 ${alignClass}`}>
        <div className="font-bold text-slate-900">{t.subject}</div>
        <div className="text-[11px] text-slate-400 truncate max-w-sm">{t.description}</div>
      </td>
    )
  }

  if (key === 'priority') {
    const p = String(t.priority || '').toLowerCase()
    const variant = p === 'urgent' ? 'danger' : p === 'high' ? 'warning' : 'slate'
    return (
      <td key={col.key} className={`py-3.5 px-4 ${alignClass}`}>
        <Badge variant={variant}>{t.priority || 'Normal'}</Badge>
      </td>
    )
  }

  if (key === 'status') {
    const s = String(t.status || '').toLowerCase()
    const variant = s === 'resolved' || s === 'closed' ? 'success' : s === 'in progress' ? 'purple' : 'warning'
    return (
      <td key={col.key} className={`py-3.5 px-4 ${alignClass}`}>
        <Badge variant={variant}>{t.status || 'Open'}</Badge>
      </td>
    )
  }

  if (key === 'createdat' || key === 'date') {
    return (
      <td key={col.key} className={`py-3.5 px-4 text-slate-400 font-mono text-[11px] ${alignClass}`}>
        {t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN') : 'Recent'}
      </td>
    )
  }

  return (
    <td key={col.key} className={`py-3.5 px-4 text-slate-700 ${alignClass}`}>
      {t[col.key] != null ? String(t[col.key]) : '—'}
    </td>
  )
}

export default function EssHelpdesk() {
  const showToast = useToast()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { layoutMeta, columns: layoutColumns } = usePageLayout('ess_helpdesk', DEFAULT_HELPDESK_COLUMNS)

  const [formData, setFormData] = useState({
    category: 'Payroll & Salary',
    subject: '',
    description: '',
    priority: 'Normal'
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getMyTickets()
      setTickets(Array.isArray(data) ? data : [])
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to load tickets.', 'error', 3500)
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRaiseTicket = async (e) => {
    e.preventDefault()
    if (!formData.subject || !formData.description) {
      showToast('Subject and description are required.', 'warning', 3000)
      return
    }

    setSubmitting(true)
    try {
      await raiseTicket(formData)
      showToast('Helpdesk support ticket submitted successfully.', 'success', 3000)
      setShowCreateModal(false)
      setFormData({
        category: 'Payroll & Salary',
        subject: '',
        description: '',
        priority: 'Normal'
      })
      await loadData()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to raise ticket.', 'error', 3500)
    } finally {
      setSubmitting(false)
    }
  }

  const openCount = tickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length
  const resolvedCount = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length

  const getPriorityBadge = (priority) => {
    const p = String(priority || '').toLowerCase()
    if (p === 'urgent') return <Badge variant="danger">Urgent</Badge>
    if (p === 'high') return <Badge variant="warning">High</Badge>
    return <Badge variant="slate">Normal</Badge>
  }

  const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase()
    if (s === 'resolved' || s === 'closed') return <Badge variant="success">Resolved</Badge>
    if (s === 'in progress') return <Badge variant="purple">In Progress</Badge>
    return <Badge variant="warning">Open</Badge>
  }

  return (
    <div className="space-y-4 sm:space-y-5 pb-10 select-none">
      {/* 1. Header with Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-1">
            <Link to="/module/hrms/self-service" className="hover:text-purple-700 transition">
              Self Service
            </Link>
            <span>/</span>
            <span className="text-purple-700 font-bold">HR Helpdesk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold shrink-0">
              <HelpCircle size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  HR Helpdesk & Query Ticketing
                </h1>
                <LayoutVersionBadge entity="ess_helpdesk" version={layoutMeta?.version} className="hidden sm:inline-flex" />
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Inquiries regarding payroll, tax declarations, PF claims, assets, or attendance rectifications.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={loadData}
            title="Refresh Table"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-purple-700' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={14} />
            <span>Raise Query</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
            Active Queries
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 font-mono mt-1">{openCount}</div>
          <div className="text-[10px] text-amber-700 font-semibold mt-1 border-t border-slate-100 pt-1.5 truncate">
            {openCount > 0 ? 'Under review by HR' : 'All clear'}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
            Resolved Queries
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono mt-1">{resolvedCount}</div>
          <div className="text-[10px] text-emerald-600 mt-1 font-semibold border-t border-slate-100 pt-1.5 truncate">
            Completed & answered
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
            Target Resolution SLA
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-700 font-mono mt-1">24 - 48h</div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium border-t border-slate-100 pt-1.5 truncate">
            Standard response turnaround
          </div>
        </div>
      </div>

      {/* 3. Ticket Register (Desktop Table + Mobile Cards) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900">Support Ticket Log</h2>
            <Badge variant="purple">{tickets.length}</Badge>
          </div>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            Active: {openCount} • Resolved: {resolvedCount}
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <RefreshCw size={20} className="mx-auto animate-spin text-purple-700 mb-2" />
            <p className="text-xs font-medium">Loading ticket register...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="h-10 w-10 mx-auto rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
              <Inbox size={20} />
            </div>
            <div className="text-sm font-bold text-slate-800">No support tickets found</div>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              If you have any questions about payroll, leaves, or tax withholding, submit an inquiry.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateModal(true)}
              className="mt-3"
            >
              <Plus size={14} />
              <span>Raise First Query</span>
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop Table (>= 640px) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase text-[10.5px] font-bold tracking-wider">
                  <tr>
                    {layoutColumns.map((col) => (
                      <th
                        key={col.key}
                        style={{ width: col.width || 'auto' }}
                        className={`py-3 px-4 ${col.alignment === 'center' ? 'text-center' : col.alignment === 'right' ? 'text-right' : 'text-left'}`}
                      >
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {tickets.map((t, idx) => (
                    <tr key={t.id || idx} className="hover:bg-slate-50/80 transition">
                      {layoutColumns.map((col) => renderTicketCell(t, col))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards (< 640px) */}
            <div className="sm:hidden divide-y divide-slate-100">
              {tickets.map((t, idx) => (
                <div key={t.id || idx} className="p-3.5 space-y-2 hover:bg-slate-50/60 transition">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-purple-700 text-xs">
                      {t.ticketNumber || `TKT-${t.id?.slice?.(0, 6) || 'REQ'}`}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {getPriorityBadge(t.priority)}
                      {getStatusBadge(t.status)}
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs">{t.subject}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{t.description}</div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                    <span>Category: <strong className="text-slate-600">{t.category}</strong></span>
                    <span>{t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN') : 'Recent'}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 4. Responsive Modal / Bottom Sheet for Raising Query */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Submit HR Helpdesk Inquiry"
        description="Our HR operations team will review your query and provide official guidance"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleRaiseTicket} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-purple-600 font-semibold"
              >
                <option value="Payroll & Salary">Payroll & Salary</option>
                <option value="Leave & Attendance">Leave & Attendance</option>
                <option value="Tax Declaration & Form 16">Tax Declaration & Form 16</option>
                <option value="PF & ESIC Clarification">PF & ESIC Clarification</option>
                <option value="Company Assets & IT">Company Assets & IT</option>
                <option value="General HR Inquiry">General HR Inquiry</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-purple-600 font-semibold"
              >
                <option value="Normal">Normal (48h Turnaround)</option>
                <option value="High">High (24h Turnaround)</option>
                <option value="Urgent">Urgent (Same-day Critical)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Subject Summary <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Discrepancy in May month overtime calculation"
              value={formData.subject}
              onChange={e => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-purple-600 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Detailed Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Provide exact details, relevant dates, or voucher numbers to expedite resolution..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-purple-600 font-medium"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submitting}
            >
              Submit Ticket
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
