"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Calendar, FileText, Plane, Shield, ArrowRight, Ticket, Bell } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import ErpHeaderSummary from "@/components/layout/ErpHeaderSummary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ErpDrawerFooter } from "@/components/erp/erp-page-kit";
import {
  erpActionCardClassName,
  erpActionCardIconClassName,
  erpActionCardSubtitleClassName,
  erpActionCardTitleClassName,
  erpButtonClassName,
} from "@/components/erp/erpStyles";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import { appApi, hrmsApi, payrollApi, platformApi } from "@/services/modules";
import { ROUTES } from "@/constants/routes";

type PayslipRow = {
  id: string;
  runDate?: string;
  gross?: number;
  net?: number;
};

type LeaveType = { id: string; name?: string; code?: string };

export default function EmployeeSelfServicePage() {
  const [clockedIn, setClockedIn] = useState(false);
  const [clockTime, setClockTime] = useState<string | null>(null);
  const [latestPayslip, setLatestPayslip] = useState<PayslipRow | null>(null);
  const [leaveBalance, setLeaveBalance] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [saving, setSaving] = useState(false);
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
      title="Employee Self-Service"
      icon="user"
      meta={
        <ErpHeaderSummary
          items={[
            {
              label: "Attendance",
              value: clockedIn ? `Present${clockTime ? ` · ${clockTime}` : ""}` : "Not Clocked",
              tone: clockedIn ? "success" : "warning",
            },
            { label: "Leave", value: leaveBalance == null ? "—" : `${leaveBalance} days`, tone: "default" },
            { label: "Latest Payslip", value: latestLabel, tone: latestPayslip ? "success" : "warning" },
          ]}
        />
      }
      actions={
        <div className="flex flex-wrap gap-1.5">
          <Link href={ROUTES.NOTIFICATIONS} className={erpButtonClassName.secondary}>
            <Bell className="h-4 w-4" /> Inbox
          </Link>
          <button type="button" onClick={() => void handleToggleClock()} className={`${erpButtonClassName.primary} gap-1.5`}>
            <Clock className="h-4 w-4" />
            {clockedIn ? "Clock OUT" : "Clock IN"}
          </button>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className={erpActionCardClassName}>
          <div className="flex items-center justify-between">
            <span className={erpActionCardIconClassName}>
              <Calendar className="h-4 w-4" />
            </span>
            <Badge variant="outline" className="border-slate-200 text-slate-600">
              Leave
            </Badge>
          </div>
          <h3 className={`${erpActionCardTitleClassName} mt-3`}>Apply for Leave</h3>
          <p className={`${erpActionCardSubtitleClassName} mt-1 leading-relaxed`}>
            Submit a leave request without leaving ESS.
          </p>
          <Button size="sm" variant="outline" className="mt-3 w-full border-slate-200" onClick={() => setLeaveOpen(true)}>
            Apply leave <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>

        <div className={erpActionCardClassName}>
          <div className="flex items-center justify-between">
            <span className={`${erpActionCardIconClassName} text-emerald-700`}>
              <FileText className="h-4 w-4" />
            </span>
            <Badge variant="outline" className="border-slate-200 text-slate-600">
              {latestPayslip ? "Ready" : "Pending"}
            </Badge>
          </div>
          <h3 className={`${erpActionCardTitleClassName} mt-3`}>Download Payslips</h3>
          <p className={`${erpActionCardSubtitleClassName} mt-1 leading-relaxed`}>
            Download the latest generated payslip PDF from payroll.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3 w-full border-slate-200"
            disabled={downloading}
            onClick={() => void handleDownloadPayslip()}
          >
            {downloading ? "Downloading…" : "Download Payslip"}
          </Button>
        </div>

        <div className={erpActionCardClassName}>
          <div className="flex items-center justify-between">
            <span className={`${erpActionCardIconClassName} text-sky-700`}>
              <Plane className="h-4 w-4" />
            </span>
            <Badge variant="outline" className="border-slate-200 text-slate-600">
              Expenses
            </Badge>
          </div>
          <h3 className={`${erpActionCardTitleClassName} mt-3`}>Expense Claim</h3>
          <p className={`${erpActionCardSubtitleClassName} mt-1 leading-relaxed`}>
            Open Finance expenses to submit and track claims.
          </p>
          <Link href={ROUTES.EXPENSES} className="mt-3 block">
            <Button size="sm" variant="outline" className="w-full border-slate-200">
              Open Expenses <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        <div className={erpActionCardClassName}>
          <div className="flex items-center justify-between">
            <span className={`${erpActionCardIconClassName} text-amber-700`}>
              <Ticket className="h-4 w-4" />
            </span>
            <Badge variant="outline" className="border-slate-200 text-slate-600">
              Helpdesk
            </Badge>
          </div>
          <h3 className={`${erpActionCardTitleClassName} mt-3`}>Raise a ticket</h3>
          <p className={`${erpActionCardSubtitleClassName} mt-1 leading-relaxed`}>
            Create a support ticket for IT, HR, or facilities.
          </p>
          <Button size="sm" variant="outline" className="mt-3 w-full border-slate-200" onClick={() => setTicketOpen(true)}>
            New ticket <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>

        <div className={erpActionCardClassName}>
          <div className="flex items-center justify-between">
            <span className={`${erpActionCardIconClassName} text-violet-700`}>
              <Shield className="h-4 w-4" />
            </span>
            <Badge variant="outline" className="border-slate-200 text-slate-600">
              DPDP
            </Badge>
          </div>
          <h3 className={`${erpActionCardTitleClassName} mt-3`}>Download my data</h3>
          <p className={`${erpActionCardSubtitleClassName} mt-1 leading-relaxed`}>
            Export personal data linked to this login under the DPDP Act 2023.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3 w-full border-slate-200"
            disabled={exporting}
            onClick={() => void handleExportMyData()}
          >
            {exporting ? "Exporting…" : "Export JSON"}
          </Button>
        </div>
      </div>

      <SideDrawer
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        title="Apply for leave"
        footer={
          <ErpDrawerFooter
            onCancel={() => setLeaveOpen(false)}
            onSave={() => void submitLeave()}
            saving={saving}
            saveLabel="Submit"
          />
        }
      >
        <div className="erp-form-grid">
          <div className="erp-field md:col-span-2">
            <label className="erp-label">Leave type</label>
            <select
              className="erp-input"
              value={leaveForm.leaveTypeId}
              onChange={(e) => setLeaveForm((f) => ({ ...f, leaveTypeId: e.target.value }))}
            >
              <option value="">Select type</option>
              {leaveTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="erp-field">
            <label className="erp-label">Start date</label>
            <input
              type="date"
              className="erp-input"
              value={leaveForm.startDate}
              onChange={(e) => setLeaveForm((f) => ({ ...f, startDate: e.target.value }))}
            />
          </div>
          <div className="erp-field">
            <label className="erp-label">End date</label>
            <input
              type="date"
              className="erp-input"
              value={leaveForm.endDate}
              onChange={(e) => setLeaveForm((f) => ({ ...f, endDate: e.target.value }))}
            />
          </div>
          <div className="erp-field md:col-span-2">
            <label className="erp-label">Reason</label>
            <textarea
              className="erp-input min-h-20"
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm((f) => ({ ...f, reason: e.target.value }))}
            />
          </div>
        </div>
      </SideDrawer>

      <SideDrawer
        open={ticketOpen}
        onClose={() => setTicketOpen(false)}
        title="New helpdesk ticket"
        footer={
          <ErpDrawerFooter
            onCancel={() => setTicketOpen(false)}
            onSave={() => void submitTicket()}
            saving={saving}
            saveLabel="Create ticket"
          />
        }
      >
        <div className="erp-form-grid">
          <div className="erp-field md:col-span-2">
            <label className="erp-label">Subject</label>
            <input
              className="erp-input"
              value={ticketForm.subject}
              onChange={(e) => setTicketForm((f) => ({ ...f, subject: e.target.value }))}
            />
          </div>
          <div className="erp-field">
            <label className="erp-label">Priority</label>
            <select
              className="erp-input"
              value={ticketForm.priority}
              onChange={(e) => setTicketForm((f) => ({ ...f, priority: e.target.value }))}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </select>
          </div>
          <div className="erp-field md:col-span-2">
            <label className="erp-label">Description</label>
            <textarea
              className="erp-input min-h-24"
              value={ticketForm.description}
              onChange={(e) => setTicketForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
        </div>
      </SideDrawer>
    </StandardPageLayout>
  );
}
