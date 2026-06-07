"use client";

import { useCallback, useEffect, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type AttendanceRecord = {
  id: string;
  date?: string;
  employeeId?: string;
  employeeName?: string;
  employeeCode?: string;
  status?: string;
  checkIn?: string;
  checkOut?: string;
  workHours?: number;
  isLate?: boolean;
  notes?: string;
};

const STATUS_COLORS: Record<string, string> = {
  present: "erp-chip erp-chip-success",
  absent: "erp-chip erp-chip-danger",
  late: "erp-chip erp-chip-warning",
  halfday: "erp-chip erp-chip-warning",
  holiday: "erp-chip erp-chip-info",
  onleave: "erp-chip erp-chip-neutral",
};

const PAGE_SIZE = 20;

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showPunchModal, setShowPunchModal] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [punchSaving, setPunchSaving] = useState(false);
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [punchForm, setPunchForm] = useState({
    employeeId: "",
    punchType: "CheckIn",
    punchTime: new Date().toISOString().slice(0, 16),
    notes: "",
  });

  const [correctionForm, setCorrectionForm] = useState({
    attendanceId: "",
    checkIn: "",
    checkOut: "",
    reason: "",
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await hrApi.hrms.attendance.list(page, PAGE_SIZE);
      const raw = res.data;
      const list: AttendanceRecord[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.records)
        ? raw.records
        : Array.isArray(raw?.data)
        ? raw.data
        : [];
      setRecords(list);
      setTotal(raw?.total ?? list.length);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load attendance records.");
      setError(msg);
      notifyError(msg, "Attendance");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const handlePunch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setPunchSaving(true);
      await hrApi.hrms.attendance.markAttendance(punchForm);
      setShowPunchModal(false);
      setPunchForm({ employeeId: "", punchType: "CheckIn", punchTime: new Date().toISOString().slice(0, 16), notes: "" });
      void loadRecords();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to mark attendance."), "Punch");
    } finally {
      setPunchSaving(false);
    }
  };

  const present = records.filter((r) => (r.status || "").toLowerCase() === "present").length;
  const absent = records.filter((r) => (r.status || "").toLowerCase() === "absent").length;
  const late = records.filter((r) => (r.status || "").toLowerCase() === "late" || r.isLate).length;
  const attendancePct = records.length > 0 ? Math.round(((present) / records.length) * 100) : 0;

  const filtered = records.filter((r) => {
    if (statusFilter && (r.status || "").toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (dateFilter && r.date && !r.date.startsWith(dateFilter)) return false;
    return true;
  });

  return (
    <>
      {/* ── Punch Modal ── */}
      {showPunchModal && (
        <div className="erp-modal-backdrop" onClick={() => setShowPunchModal(false)}>
          <div className="erp-modal-card erp-modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-accent" />
            <div className="erp-modal-header">
              <div className="flex items-center gap-3">
                <span className="erp-modal-icon">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <span className="erp-modal-title">Mark Attendance</span>
              </div>
              <button type="button" onClick={() => setShowPunchModal(false)} className="erp-modal-close" aria-label="Close">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handlePunch}>
              <div className="erp-modal-body space-y-4">
                <div>
                  <label className="erp-label">Employee ID</label>
                  <input className="erp-input" value={punchForm.employeeId} onChange={(e) => setPunchForm({ ...punchForm, employeeId: e.target.value })} placeholder="Employee ID or code" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="erp-label">Punch Type</label>
                    <select className="erp-select" value={punchForm.punchType} onChange={(e) => setPunchForm({ ...punchForm, punchType: e.target.value })}>
                      <option value="CheckIn">Check-In</option>
                      <option value="CheckOut">Check-Out</option>
                      <option value="Break">Break</option>
                      <option value="BreakEnd">Break End</option>
                    </select>
                  </div>
                  <div>
                    <label className="erp-label">Punch Time</label>
                    <input className="erp-input" type="datetime-local" value={punchForm.punchTime} onChange={(e) => setPunchForm({ ...punchForm, punchTime: e.target.value })} required />
                  </div>
                </div>
                <div>
                  <label className="erp-label">Notes (optional)</label>
                  <textarea className="erp-input" rows={2} value={punchForm.notes} onChange={(e) => setPunchForm({ ...punchForm, notes: e.target.value })} placeholder="Optional note..." />
                </div>
              </div>
              <div className="erp-modal-footer">
                <button type="button" onClick={() => setShowPunchModal(false)} className="erp-action-btn erp-action-btn-secondary">Cancel</button>
                <button type="submit" disabled={punchSaving} className="erp-action-btn erp-action-btn-primary">
                  {punchSaving ? "Saving…" : "Mark Attendance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Correction Modal ── */}
      {showCorrectionModal && (
        <div className="erp-modal-backdrop" onClick={() => setShowCorrectionModal(false)}>
          <div className="erp-modal-card erp-modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-accent erp-modal-accent-warning" />
            <div className="erp-modal-header">
              <div className="flex items-center gap-3">
                <span className="erp-modal-icon erp-modal-icon-warning">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </span>
                <span className="erp-modal-title">Request Correction</span>
              </div>
              <button type="button" onClick={() => setShowCorrectionModal(false)} className="erp-modal-close" aria-label="Close">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="erp-modal-body space-y-4">
              <div>
                <label className="erp-label">Attendance Record ID</label>
                <input className="erp-input" value={correctionForm.attendanceId} onChange={(e) => setCorrectionForm({ ...correctionForm, attendanceId: e.target.value })} placeholder="Record ID to correct" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="erp-label">Corrected Check-In</label>
                  <input className="erp-input" type="time" value={correctionForm.checkIn} onChange={(e) => setCorrectionForm({ ...correctionForm, checkIn: e.target.value })} />
                </div>
                <div>
                  <label className="erp-label">Corrected Check-Out</label>
                  <input className="erp-input" type="time" value={correctionForm.checkOut} onChange={(e) => setCorrectionForm({ ...correctionForm, checkOut: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="erp-label">Reason for Correction</label>
                <textarea className="erp-input" rows={3} value={correctionForm.reason} onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })} placeholder="Explain the correction..." required />
              </div>
            </div>
            <div className="erp-modal-footer">
              <button type="button" onClick={() => setShowCorrectionModal(false)} className="erp-action-btn erp-action-btn-secondary">Cancel</button>
              <button type="button" className="erp-action-btn erp-action-btn-warning" onClick={() => { setShowCorrectionModal(false); }}>
                Submit Correction
              </button>
            </div>
          </div>
        </div>
      )}

      <StandardPageLayout
        title="Attendance Management"
        subtitle="Track daily attendance, manage punch records, and submit corrections across the workforce."
        eyebrow="HRMS / Time & Attendance"
        icon="attendance"
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setShowCorrectionModal(true)} className="erp-action-btn erp-action-btn-secondary">
              Request Correction
            </button>
            <button type="button" onClick={() => setShowPunchModal(true)} className="erp-action-btn erp-action-btn-primary">
              Mark Attendance
            </button>
          </div>
        }
        filters={
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="erp-label">Date</label>
              <input type="date" className="erp-input w-44" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
            </div>
            <div>
              <label className="erp-label">Status</label>
              <select className="erp-select w-36" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="halfday">Half Day</option>
                <option value="onleave">On Leave</option>
                <option value="holiday">Holiday</option>
              </select>
            </div>
            {(dateFilter || statusFilter) && (
              <button type="button" onClick={() => { setDateFilter(""); setStatusFilter(""); }} className="erp-action-btn erp-action-btn-secondary">
                Clear
              </button>
            )}
          </div>
        }
      >
        {/* KPIs */}
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card erp-kpi-card-success">
            <p className="erp-kpi-label">Present</p>
            <p className="erp-kpi-value erp-kpi-value-success">{present}</p>
            <p className="erp-kpi-meta">Employees marked present today</p>
          </div>
          <div className="erp-kpi-card erp-kpi-card-danger">
            <p className="erp-kpi-label">Absent</p>
            <p className="erp-kpi-value erp-kpi-value-danger">{absent}</p>
            <p className="erp-kpi-meta">Employees not checked in</p>
          </div>
          <div className="erp-kpi-card erp-kpi-card-warning">
            <p className="erp-kpi-label">Late / Correction</p>
            <p className="erp-kpi-value">{late}</p>
            <p className="erp-kpi-meta">Late arrivals flagged for review</p>
          </div>
          <div className="erp-kpi-card erp-kpi-card-info">
            <p className="erp-kpi-label">Attendance Rate</p>
            <p className="erp-kpi-value">{attendancePct}%</p>
            <p className="erp-kpi-meta">Based on current page records</p>
          </div>
        </div>

        {error && (
          <div className="erp-alert-error">{error}</div>
        )}

        {/* Table */}
        <div className="erp-panel">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Attendance Records</h2>
              <p className="mt-1 text-sm text-slate-500">{total} total records</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="erp-table">
              <thead className="erp-thead">
                <tr>
                  <th className="erp-th">Employee</th>
                  <th className="erp-th">Date</th>
                  <th className="erp-th">Status</th>
                  <th className="erp-th">Check-In</th>
                  <th className="erp-th">Check-Out</th>
                  <th className="erp-th">Work Hrs</th>
                  <th className="erp-th">Late?</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="erp-td">
                        <div className="h-4 animate-pulse rounded bg-slate-100" />
                      </td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="erp-td py-12 text-center text-slate-400">
                      No attendance records found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id} className="erp-tr">
                      <td className="erp-td">
                        <div>
                          <p className="font-medium text-slate-900">{r.employeeName || "—"}</p>
                          {r.employeeCode && <p className="text-xs text-slate-500">{r.employeeCode}</p>}
                        </div>
                      </td>
                      <td className="erp-td text-slate-600">{r.date ? new Date(r.date).toLocaleDateString("en-IN") : "—"}</td>
                      <td className="erp-td">
                        <span className={STATUS_COLORS[(r.status || "").toLowerCase()] || "erp-chip erp-chip-neutral"}>
                          {r.status || "Unknown"}
                        </span>
                      </td>
                      <td className="erp-td text-slate-700 font-mono text-xs">{r.checkIn || "—"}</td>
                      <td className="erp-td text-slate-700 font-mono text-xs">{r.checkOut || "—"}</td>
                      <td className="erp-td text-slate-600">{r.workHours != null ? `${r.workHours}h` : "—"}</td>
                      <td className="erp-td">
                        {r.isLate ? (
                          <span className="erp-chip erp-chip-warning">Late</span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
              <p className="text-sm text-slate-500">Page {page} of {totalPages} · {total} records</p>
              <div className="flex gap-2">
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="erp-action-btn erp-action-btn-secondary disabled:opacity-40">← Prev</button>
                <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="erp-action-btn erp-action-btn-secondary disabled:opacity-40">Next →</button>
              </div>
            </div>
          )}
        </div>
      </StandardPageLayout>
    </>
  );
}
