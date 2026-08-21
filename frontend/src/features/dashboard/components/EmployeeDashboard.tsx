"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, Calendar, FileText, ArrowRight, UserCheck, Plane, Wallet } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import {
  erpActionCardClassName,
  erpActionCardIconClassName,
  erpActionCardSubtitleClassName,
  erpActionCardTitleClassName,
  erpAsidePanelClassName,
  erpSectionClassName,
  erpSectionEyebrowClassName,
  erpSectionTitleClassName,
  erpStatCardClassName,
  erpStatCardHelperClassName,
  erpStatCardLabelClassName,
  erpStatCardValueClassName,
  erpStatusBadgeTone,
} from "@/components/erp/erpStyles";
import { hrmsApi } from "@/services/modules/hrms";
import { payrollApi } from "@/services/modules/payroll";
import { ROUTES } from "@/constants/routes";
import type { LeaveRequestSummary } from "@/types";

const formatShortDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const leaveStatusClass = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized === "approved") return erpStatusBadgeTone.success;
  if (normalized === "rejected") return erpStatusBadgeTone.danger;
  return erpStatusBadgeTone.warning;
};

const QUICK_LINKS = [
  { href: ROUTES.ATTENDANCE, icon: UserCheck, title: "Attendance", subtitle: "Clock in, view shifts, and time entries" },
  { href: ROUTES.LEAVE, icon: Plane, title: "Leave", subtitle: "Apply for leave and view balances" },
  { href: ROUTES.EXPENSES, icon: Wallet, title: "Expenses", subtitle: "Submit reimbursement requests" },
  { href: ROUTES.PAYROLL_PAYSLIPS, icon: FileText, title: "Payslips", subtitle: "Download salary slips" },
];

export function EmployeeDashboard() {
  const { data: leaveData, isLoading: leaveLoading } = useQuery({
    queryKey: ["ess-leave-requests"],
    queryFn: async () => {
      const { data } = await hrmsApi.hrms.leave.list(1, 10);
      return data;
    },
    staleTime: 30_000,
  });

  const { data: leaveBalances, isLoading: balancesLoading } = useQuery({
    queryKey: ["ess-leave-balances"],
    queryFn: async () => {
      const { data } = await hrmsApi.hrms.leave.balances.list();
      return data;
    },
    staleTime: 30_000,
  });

  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ["ess-attendance"],
    queryFn: async () => {
      const { data } = await hrmsApi.hrms.attendance.list(1, 5);
      return data;
    },
    staleTime: 30_000,
  });

  const { data: payslipsData, isLoading: payslipsLoading } = useQuery({
    queryKey: ["ess-payslips"],
    queryFn: async () => {
      const { data } = await payrollApi.payslips.list();
      return data;
    },
    staleTime: 30_000,
  });

  const recentLeaves = useMemo(() => {
    const rows = leaveData?.requests ?? [];
    return rows.slice(0, 5);
  }, [leaveData]);

  const pendingCount = useMemo(
    () => recentLeaves.filter((item: LeaveRequestSummary) => (item.status ?? "").toLowerCase() === "pending").length,
    [recentLeaves]
  );

  const totalLeaveBalance = useMemo(() => {
    const balances = Array.isArray(leaveBalances)
      ? leaveBalances
      : Array.isArray(leaveBalances?.balances)
        ? leaveBalances.balances
        : [];
    if (balances.length === 0) return null;
    const total = balances.reduce((sum: number, item: { available?: number; balance?: number }) => {
      const value = item.available ?? item.balance ?? 0;
      return sum + value;
    }, 0);
    return total;
  }, [leaveBalances]);

  const latestAttendance = useMemo(() => {
    const rows = Array.isArray(attendanceData)
      ? attendanceData
      : Array.isArray(attendanceData?.records)
        ? attendanceData.records
        : Array.isArray(attendanceData?.items)
          ? attendanceData.items
          : [];
    return rows[0] ?? null;
  }, [attendanceData]);

  const latestPayslip = useMemo(() => {
    const rows = Array.isArray(payslipsData)
      ? payslipsData
      : Array.isArray(payslipsData?.payslips)
        ? payslipsData.payslips
        : Array.isArray(payslipsData?.items)
          ? payslipsData.items
          : [];
    return rows[0] ?? null;
  }, [payslipsData]);

  const attendanceLabel = attendanceLoading
    ? "…"
    : latestAttendance?.checkInTime || latestAttendance?.punchIn || latestAttendance?.status
      ? String(latestAttendance.checkInTime ?? latestAttendance.punchIn ?? latestAttendance.status)
      : "—";

  const leaveBalanceLabel = balancesLoading ? "…" : totalLeaveBalance != null ? `${totalLeaveBalance} days` : "—";

  const pendingLabel = leaveLoading ? "…" : String(pendingCount);

  const payslipLabel = payslipsLoading
    ? "…"
    : latestPayslip
      ? [latestPayslip.month, latestPayslip.year].filter(Boolean).join(" ") || "Available"
      : "—";

  return (
    <StandardPageLayout
      title="My workspace"
      subtitle="Attendance, leave, payslips, and self-service requests."
      eyebrow="Employee self-service"
      icon="user"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Latest attendance", value: attendanceLabel, note: latestAttendance ? "Most recent record" : "No records yet", icon: Clock },
          { label: "Leave balance", value: leaveBalanceLabel, note: totalLeaveBalance != null ? "Available days" : "No balance data", icon: Calendar },
          { label: "Pending requests", value: pendingLabel, note: "Leave awaiting decision", icon: Calendar },
          { label: "Latest payslip", value: payslipLabel, note: latestPayslip ? "Most recent slip" : "No payslips yet", icon: FileText },
        ].map((stat) => (
          <div key={stat.label} className={erpStatCardClassName}>
            <div className="flex items-center justify-between gap-2">
              <p className={erpStatCardLabelClassName}>{stat.label}</p>
              <stat.icon className="h-4 w-4 text-slate-400" />
            </div>
            <p className={erpStatCardValueClassName}>{stat.value}</p>
            <p className={erpStatCardHelperClassName}>{stat.note}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className={erpActionCardClassName}>
            <div className="flex items-center gap-3">
              <span className={erpActionCardIconClassName}>
                <link.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className={erpActionCardTitleClassName}>{link.title}</p>
                <p className={erpActionCardSubtitleClassName}>{link.subtitle}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className={erpSectionClassName}>
          <p className={erpSectionEyebrowClassName}>Leave</p>
          <h2 className={erpSectionTitleClassName}>Recent requests</h2>
          <div className="mt-4 space-y-2">
            {leaveLoading ? (
              <p className="text-sm text-slate-500">Loading leave requests…</p>
            ) : recentLeaves.length === 0 ? (
              <p className="text-sm text-slate-500">No leave requests yet.</p>
            ) : (
              recentLeaves.map((item: LeaveRequestSummary) => (
                <div
                  key={item.id ?? `${item.fromDate}-${item.toDate}`}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {item.period?.trim() || "Leave"} · {item.days} day{item.days === 1 ? "" : "s"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatShortDate(item.fromDate)} – {formatShortDate(item.toDate)}
                    </p>
                  </div>
                  <span className={leaveStatusClass(item.status ?? "Pending")}>{item.status ?? "Pending"}</span>
                </div>
              ))
            )}
          </div>
          <Link href={ROUTES.LEAVE} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-900">
            View all leave <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>

        <aside className={erpAsidePanelClassName}>
          <p className={erpSectionEyebrowClassName}>Help</p>
          <h3 className="mt-1 text-sm font-semibold text-slate-900">Need something else?</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Company announcements and HR notices will appear here when published through the platform.
          </p>
          <p className="mt-3 text-sm text-slate-500">No announcements at this time.</p>
        </aside>
      </div>
    </StandardPageLayout>
  );
}
