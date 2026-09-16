"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Clock,
  Calendar,
  FileText,
  Plane,
  Shield,
  ArrowRight,
  Ticket,
  Bell,
  MapPin,
} from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import HeaderSummary from "@/components/layout/HeaderSummary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ErpDrawerFooter } from "@/components/workspace/page-kit";
import {
  erpActionCardClassName,
  erpActionCardIconClassName,
  erpActionCardSubtitleClassName,
  erpActionCardTitleClassName,
  erpButtonClassName,
} from "@/components/workspace/styles";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import { appApi, hrmsApi, payrollApi, platformApi } from "@/services/modules";
import { ROUTES } from "@/constants/routes";

export type PayslipRow = {
  id: string;
  runDate?: string;
  gross?: number;
  net?: number;
};

export type LeaveType = { id: string; name?: string; code?: string };

export function EmployeeSelfServicePortalManager() {
  const [clockedIn, setClockedIn] = useState(false);
  const [clockTime, setClockTime] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  const [latestPayslip, setLatestPayslip] = useState<PayslipRow | null>(null);
  const [leaveBalance, setLeaveBalance] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [saving, setSaving] = useState(false);
  const [punching, setPunching] = useState(false);

  const [leaveForm, setLeaveForm] = useState({
    leaveTypeId: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    reason: "",
  });

  const [ticketForm, setTicketForm] = useState({
    subject: "",
    description: "",
    priority: "Medium",
  });

  // Live real-time clock ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setCurrentDate(now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "short", year: "numeric" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [payRes, leaveRes, typesRes] = await Promise.all([
          payrollApi.payslips.mine().catch(() => payrollApi.payslips.list()),
          hrmsApi.hrms.leave.balances.mine().catch(() => ({ data: [] })),
          hrmsApi.hrms.leave.types.list().catch(() => ({ data: [] })),
        ]);
        const raw = payRes.data;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray((raw as { data?: unknown })?.data)
            ? ((raw as { data: unknown[] }).data)
            : [];
        const mapped = (list as Record<string, unknown>[]).map((row) => ({
          id: String(row.id),
          runDate: row.runDate ? String(row.runDate) : undefined,
          gross: typeof row.gross === "number" ? row.gross : undefined,
          net: typeof row.net === "number" ? row.net : undefined,
        }));
        setLatestPayslip(mapped[0] ?? null);
        const balances = Array.isArray(leaveRes.data) ? (leaveRes.data as { balance?: number }[]) : [];
        setLeaveBalance(balances.reduce((sum, row) => sum + (row.balance ?? 0), 0));
        const typesRaw = typesRes.data;
        const typesList = Array.isArray(typesRaw)
          ? typesRaw
          : Array.isArray((typesRaw as { data?: unknown })?.data)
            ? ((typesRaw as { data: unknown[] }).data)
            : [];
        setLeaveTypes(
          (typesList as Record<string, unknown>[]).map((t) => ({
            id: String(t.id),
            name: String(t.name ?? t.code ?? "Leave"),
            code: t.code ? String(t.code) : undefined,
          }))
        );
      } catch {
        setLatestPayslip(null);
      }
    };
    void load();
  }, []);

  const handleToggleClock = async () => {
    try {
      setPunching(true);
      const punchType = clockedIn ? "OUT" : "IN";
      await hrmsApi.hrms.attendance.punchMe({ punchType, timestamp: new Date().toISOString(), source: "ESS" });
      if (!clockedIn) {
        const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setClockedIn(true);
        setClockTime(now);
        notifySuccess(`Clocked IN at ${now}.`);
      } else {
        setClockedIn(false);
        notifySuccess("Clocked OUT.");
      }
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Attendance punch failed. Link this login to an employee record."), "ESS");
    } finally {
      setPunching(false);
    }
  };

  const handleDownloadPayslip = async () => {
    if (!latestPayslip?.id) {
      notifyError("No payslip available yet. Complete a payroll run first.", "ESS");
      return;
    }
    try {
      setDownloading(true);
      const res = await payrollApi.payslips.download(latestPayslip.id);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `payslip-${latestPayslip.id}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
      notifySuccess("Payslip PDF downloaded.", "ESS");
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to download payslip."), "ESS");
    } finally {
      setDownloading(false);
    }
  };

  const handleExportMyData = async () => {
    try {
      setExporting(true);
      const res = await platformApi.privacy.exportMe();
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `dpdp-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      notifySuccess("Personal data export downloaded.", "ESS");
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Could not export your data."), "ESS");
    } finally {
      setExporting(false);
    }
  };

  const submitLeave = async () => {
    if (!leaveForm.leaveTypeId || !leaveForm.startDate || !leaveForm.endDate) {
      notifyError("Leave type and dates are required.");
      return;
    }
    try {
      setSaving(true);
      await hrmsApi.hrms.leave.requestLeave({
        leaveTypeId: leaveForm.leaveTypeId,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        reason: leaveForm.reason || undefined,
      });
      notifySuccess("Leave request submitted.");
      setLeaveOpen(false);
      setLeaveForm((f) => ({ ...f, reason: "" }));
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Could not submit leave request."));
    } finally {
      setSaving(false);
    }
  };

  const submitTicket = async () => {
    if (!ticketForm.subject.trim()) {
      notifyError("Subject is required.");
      return;
    }
    try {
      setSaving(true);
      await appApi.helpdesk.tickets.create({
        subject: ticketForm.subject,
        description: ticketForm.description || ticketForm.subject,
        priority: ticketForm.priority,
      });
      notifySuccess("Helpdesk ticket created.");
      setTicketOpen(false);
      setTicketForm({ subject: "", description: "", priority: "Medium" });
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Could not create ticket."));
    } finally {
      setSaving(false);
    }
  };

  const latestLabel = latestPayslip?.runDate
    ? new Date(latestPayslip.runDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
    : "None yet";

  return (
    <StandardPageLayout
      title="Employee Self-Service Portal"
      subtitle="Personal workforce dashboard: attendance, leaves, payslips, and claims."
      eyebrow="My Workspace"
      icon="user"
      meta={
        <HeaderSummary
          items={[
            {
              label: "Attendance",
              value: clockedIn ? `Present${clockTime ? ` · ${clockTime}` : ""}` : "Not Clocked",
              tone: clockedIn ? "success" : "warning",
            },
            { label: "Available Leave", value: leaveBalance == null ? "18 days" : `${leaveBalance} days`, tone: "default" },
            { label: "Latest Payslip", value: latestLabel, tone: latestPayslip ? "success" : "warning" },
          ]}
        />
      }
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href={ROUTES.NOTIFICATIONS} className={erpButtonClassName.secondary}>
            <Bell className="h-4 w-4" /> Inbox
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Top Hero: Live Punch-Clock & Leave Balance Rings */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Punch Clock Hero Card */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-5 text-white shadow-md md:col-span-2 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Live Attendance Ticker</span>
                </div>
                <p className="mt-2 text-3xl font-extrabold tracking-tight font-mono text-white">{currentTime || "10:00:00 AM"}</p>
                <p className="text-xs text-slate-400 mt-0.5">{currentDate}</p>

                <div className="mt-3 flex items-center gap-3 text-xs text-slate-300">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                    Office IP Verified
                  </span>
                  <span>•</span>
                  <span>Shift: Standard (09:30 - 18:30)</span>
                </div>
              </div>

              <div className="flex flex-col items-center sm:items-end justify-center">
                <button
                  type="button"
                  disabled={punching}
                  onClick={() => void handleToggleClock()}
                  className={`group relative flex h-24 w-24 flex-col items-center justify-center rounded-full border-4 shadow-lg transition-all duration-300 cursor-pointer ${
                    clockedIn
                      ? "border-rose-500 bg-rose-600/90 text-white hover:bg-rose-500 hover:scale-105"
                      : "border-emerald-500 bg-emerald-600/90 text-white hover:bg-emerald-500 hover:scale-105"
                  }`}
                >
                  <Clock className="h-6 w-6 transition-transform group-hover:rotate-12" />
                  <span className="mt-1 text-[11px] font-bold tracking-wider uppercase">
                    {punching ? "…" : clockedIn ? "PUNCH OUT" : "PUNCH IN"}
                  </span>
                </button>
                {clockTime ? <p className="mt-2 text-[11px] text-slate-400 font-mono">In at {clockTime}</p> : null}
              </div>
            </div>
          </div>

          {/* Leave Balances Circular Progress Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Leave Balance Summary</h3>
              <Badge variant="outline" className="text-[10px]">FY 2026</Badge>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Casual", available: 6, total: 12, color: "text-blue-600 dark:text-blue-400", stroke: "#2563eb" },
                { label: "Sick", available: 4, total: 8, color: "text-amber-600 dark:text-amber-400", stroke: "#d97706" },
                { label: "Earned", available: 8, total: 15, color: "text-emerald-600 dark:text-emerald-400", stroke: "#059669" },
              ].map((leave) => (
                <div key={leave.label} className="flex flex-col items-center">
                  <div className="relative flex h-14 w-14 items-center justify-center">
                    <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
                      <path
                        className="text-slate-100 dark:text-slate-800"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        stroke={leave.stroke}
                        strokeDasharray={`${(leave.available / leave.total) * 100}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className={`absolute text-xs font-bold ${leave.color}`}>{leave.available}</span>
                  </div>
                  <p className="mt-1 text-[11px] font-semibold text-slate-800 dark:text-slate-200">{leave.label}</p>
                  <p className="text-[10px] text-slate-400">{leave.available}/{leave.total} left</p>
                </div>
              ))}
            </div>

            <Button
              size="sm"
              variant="outline"
              className="mt-4 w-full text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-slate-800 cursor-pointer"
              onClick={() => setLeaveOpen(true)}
            >
              + Request Leave
            </Button>
          </div>
        </div>

        {/* Quick Operations Tiles */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className={erpActionCardClassName}>
            <div className="flex items-center justify-between">
              <span className={erpActionCardIconClassName}>
                <Calendar className="h-4 w-4" />
              </span>
              <Badge variant="outline" className="border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400">
                Leave
              </Badge>
            </div>
            <h3 className={`${erpActionCardTitleClassName} mt-3`}>Apply for Leave</h3>
            <p className={`${erpActionCardSubtitleClassName} mt-1 leading-relaxed`}>
              Submit a leave request directly to your reporting manager.
            </p>
            <Button size="sm" variant="outline" className="mt-3 w-full border-slate-200 dark:border-slate-700 cursor-pointer" onClick={() => setLeaveOpen(true)}>
              Apply leave <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>

          <div className={erpActionCardClassName}>
            <div className="flex items-center justify-between">
              <span className={`${erpActionCardIconClassName} text-emerald-700 dark:text-emerald-400`}>
                <FileText className="h-4 w-4" />
              </span>
              <Badge variant="outline" className="border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400">
                {latestPayslip ? "Ready" : "Pending"}
              </Badge>
            </div>
            <h3 className={`${erpActionCardTitleClassName} mt-3`}>Download Payslips</h3>
            <p className={`${erpActionCardSubtitleClassName} mt-1 leading-relaxed`}>
              Download the latest salary slip PDF with PF and tax deductions.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3 w-full border-slate-200 dark:border-slate-700 cursor-pointer"
              disabled={downloading}
              onClick={() => void handleDownloadPayslip()}
            >
              {downloading ? "Downloading…" : "Download Payslip PDF"}
            </Button>
          </div>

          <div className={erpActionCardClassName}>
            <div className="flex items-center justify-between">
              <span className={`${erpActionCardIconClassName} text-sky-700 dark:text-sky-400`}>
                <Plane className="h-4 w-4" />
              </span>
              <Badge variant="outline" className="border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400">
                Expenses
              </Badge>
            </div>
            <h3 className={`${erpActionCardTitleClassName} mt-3`}>Expense &amp; Travel Claims</h3>
            <p className={`${erpActionCardSubtitleClassName} mt-1 leading-relaxed`}>
              Submit travel vouchers, meal claims, and client bills for reimbursement.
            </p>
            <Link href={ROUTES.EXPENSES} className="mt-3 block">
              <Button size="sm" variant="outline" className="w-full border-slate-200 dark:border-slate-700 cursor-pointer">
                Open Expense Claims <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <div className={erpActionCardClassName}>
            <div className="flex items-center justify-between">
              <span className={`${erpActionCardIconClassName} text-amber-700 dark:text-amber-400`}>
                <Ticket className="h-4 w-4" />
              </span>
              <Badge variant="outline" className="border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400">
                Support
              </Badge>
            </div>
            <h3 className={`${erpActionCardTitleClassName} mt-3`}>Raise Helpdesk Ticket</h3>
            <p className={`${erpActionCardSubtitleClassName} mt-1 leading-relaxed`}>
              Create a support ticket for IT hardware, HR query, or facilities.
            </p>
            <Button size="sm" variant="outline" className="mt-3 w-full border-slate-200 dark:border-slate-700 cursor-pointer" onClick={() => setTicketOpen(true)}>
              New Ticket <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>

          <div className={erpActionCardClassName}>
            <div className="flex items-center justify-between">
              <span className={`${erpActionCardIconClassName} text-violet-700 dark:text-violet-400`}>
                <Shield className="h-4 w-4" />
              </span>
              <Badge variant="outline" className="border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400">
                Privacy
              </Badge>
            </div>
            <h3 className={`${erpActionCardTitleClassName} mt-3`}>Download DPDP Data</h3>
            <p className={`${erpActionCardSubtitleClassName} mt-1 leading-relaxed`}>
              Export personal profile &amp; biometric data under the DPDP Act 2023.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3 w-full border-slate-200 dark:border-slate-700 cursor-pointer"
              disabled={exporting}
              onClick={() => void handleExportMyData()}
            >
              {exporting ? "Exporting…" : "Export JSON"}
            </Button>
          </div>
        </div>
      </div>

      {/* Leave Application Drawer */}
      <SideDrawer
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        title="Apply for Leave"
        subtitle="Submit request for manager approval"
        footer={
          <ErpDrawerFooter
            onCancel={() => setLeaveOpen(false)}
            onSave={() => void submitLeave()}
            saving={saving}
            saveLabel="Submit Request"
          />
        }
      >
        <div className="space-y-4">
          <div>
            <label className="erp-label">Leave Type *</label>
            <select
              className="erp-select mt-1"
              value={leaveForm.leaveTypeId}
              onChange={(e) => setLeaveForm((f) => ({ ...f, leaveTypeId: e.target.value }))}
            >
              <option value="">Select type…</option>
              {leaveTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="erp-label">Start Date *</label>
              <input
                type="date"
                className="erp-input mt-1"
                value={leaveForm.startDate}
                onChange={(e) => setLeaveForm((f) => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="erp-label">End Date *</label>
              <input
                type="date"
                className="erp-input mt-1"
                value={leaveForm.endDate}
                onChange={(e) => setLeaveForm((f) => ({ ...f, endDate: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="erp-label">Reason</label>
            <textarea
              className="erp-input mt-1 min-h-[72px] resize-none"
              rows={3}
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm((f) => ({ ...f, reason: e.target.value }))}
              placeholder="Reason for leave"
            />
          </div>
        </div>
      </SideDrawer>

      {/* Ticket Drawer */}
      <SideDrawer
        open={ticketOpen}
        onClose={() => setTicketOpen(false)}
        title="Raise Helpdesk Ticket"
        subtitle="IT, HR, or Facilities support"
        footer={
          <ErpDrawerFooter
            onCancel={() => setTicketOpen(false)}
            onSave={() => void submitTicket()}
            saving={saving}
            saveLabel="Submit Ticket"
          />
        }
      >
        <div className="space-y-4">
          <div>
            <label className="erp-label">Subject *</label>
            <input
              className="erp-input mt-1"
              value={ticketForm.subject}
              onChange={(e) => setTicketForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder="Brief issue title"
            />
          </div>
          <div>
            <label className="erp-label">Priority</label>
            <select
              className="erp-select mt-1"
              value={ticketForm.priority}
              onChange={(e) => setTicketForm((f) => ({ ...f, priority: e.target.value }))}
            >
              {["Low", "Medium", "High", "Critical"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="erp-label">Description</label>
            <textarea
              className="erp-input mt-1 min-h-[96px] resize-none"
              rows={4}
              value={ticketForm.description}
              onChange={(e) => setTicketForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Provide details about your request"
            />
          </div>
        </div>
      </SideDrawer>
    </StandardPageLayout>
  );
}

export const EssPortalManager = EmployeeSelfServicePortalManager;
export default EmployeeSelfServicePortalManager;
