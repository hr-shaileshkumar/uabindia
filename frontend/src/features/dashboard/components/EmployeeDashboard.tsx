"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Clock,
  Calendar,
  FileText,
  ArrowRight,
  UserCheck,
  Plane,
  Wallet,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Briefcase,
  Sparkles,
  Download,
  Play,
  Square,
} from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import {
  erpButtonClassName,
  erpStatusBadgeTone,
} from "@/components/workspace/styles";
import { hrmsApi } from "@/services/modules/hrms";
import { payrollApi } from "@/services/modules/payroll";
import apiClient from "@/services/apiClient";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import type { LeaveRequestSummary } from "@/types";

const formatShortDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const leaveStatusClass = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized === "approved") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (normalized === "rejected") return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
};

export function EmployeeDashboard() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isPunchedIn, setIsPunchedIn] = useState<boolean>(false);
  const [punchDurationSeconds, setPunchDurationSeconds] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPunchedIn) {
      interval = setInterval(() => {
        setPunchDurationSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPunchedIn]);

  const formatPunchDuration = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const { data: leaveData, isLoading: leaveLoading } = useQuery({
    queryKey: ["ess-leave-requests"],
    queryFn: async () => {
      const { data } = await hrmsApi.hrms.leave.list(1, 10);
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

  const { data: balancesData } = useQuery({
    queryKey: ["ess-leave-balances"],
    queryFn: async () => {
      try {
        const res = await hrmsApi.hrms.leave.balances.mine();
        return Array.isArray(res.data) ? res.data : [];
      } catch {
        return [];
      }
    },
    staleTime: 60_000,
  });

  const { data: holidaysData } = useQuery({
    queryKey: ["ess-holidays"],
    queryFn: async () => {
      try {
        const res = await apiClient.get("/leave/holidays");
        return Array.isArray(res.data) ? res.data : [];
      } catch {
        return [];
      }
    },
    staleTime: 120_000,
  });

  const leaveSummary = useMemo(() => {
    if (!balancesData || balancesData.length === 0) {
      return [
        { label: "Casual (CL)", balance: 0 },
        { label: "Sick (SL)", balance: 0 },
        { label: "Earned (PL)", balance: 0 },
      ];
    }
    return balancesData.slice(0, 3).map((b: any) => ({
      label: b.leaveTypeName || b.leavePolicyName || "Leave",
      balance: b.balance ?? 0,
    }));
  }, [balancesData]);

  const nextHoliday = useMemo(() => {
    if (!holidaysData || holidaysData.length === 0) return null;
    const now = new Date();
    const upcoming = holidaysData
      .map((h: any) => ({ ...h, dateObj: new Date(h.date) }))
      .filter((h: any) => !isNaN(h.dateObj.getTime()) && h.dateObj >= now)
      .sort((a: any, b: any) => a.dateObj.getTime() - b.dateObj.getTime());
    return upcoming[0] ?? holidaysData[0] ?? null;
  }, [holidaysData]);

  const recentLeaves = useMemo(() => {
    const rows = leaveData?.requests ?? [];
    return rows.slice(0, 4);
  }, [leaveData]);

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

  return (
    <StandardPageLayout
      title={`Welcome back, ${user?.name || "Team Member"} 👋`}
      subtitle="Your personal self-service portal for attendance, leaves, payslips, and claims."
      eyebrow="Employee Workspace"
      icon="user"
      actions={
        <div className="flex items-center gap-2">
          <Link
            href={ROUTES.LEAVE}
            className={cn(erpButtonClassName.primary, "text-xs py-2 bg-gradient-to-r from-indigo-600 to-violet-600")}
          >
            <Plane className="h-3.5 w-3.5" />
            Apply Leave
          </Link>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-6 text-white shadow-md">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-indigo-200 backdrop-blur-md">
              <Clock className="h-3.5 w-3.5 text-indigo-400" />
              Live Punch Station
            </span>
            <span className="text-xs text-indigo-300 font-mono">
              {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
            </span>
          </div>

          <div className="mt-5 text-center">
            <p className="text-3xl font-extrabold tracking-tight font-mono text-white drop-shadow-sm">
              {currentTime || "10:00:00 AM"}
            </p>
            <p className="mt-1 text-xs text-indigo-200">
              {isPunchedIn ? (
                <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Active Shift: {formatPunchDuration(punchDurationSeconds)}
                </span>
              ) : (
                "Shift: General (09:30 AM – 06:30 PM)"
              )}
            </p>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setIsPunchedIn((prev) => !prev)}
              className={cn(
                "flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-xs font-bold transition-all shadow-md",
                isPunchedIn
                  ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-900/40"
                  : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-900/40"
              )}
            >
              {isPunchedIn ? (
                <>
                  <Square className="h-4 w-4 fill-white" /> Punch Out for Today
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-white" /> Punch In (Clock-In)
                </>
              )}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Leave Balances</p>
            <Link href={ROUTES.LEAVE} className="text-xs font-semibold text-indigo-600 hover:underline">
              History &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3 my-auto py-2">
            {leaveSummary.map((item, idx) => (
              <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-center">
                <p className="text-lg font-bold text-slate-900">{Number(item.balance).toFixed(1)}</p>
                <p className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-indigo-50/50 p-2.5 text-xs text-indigo-700 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
            <span className="truncate">Next holiday: <strong>{nextHoliday ? `${nextHoliday.name} (${new Date(nextHoliday.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })})` : "Check Calendar"}</strong></span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Latest Salary Slip</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              <CheckCircle2 className="h-3 w-3" /> Processed
            </span>
          </div>

          <div className="my-auto py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {latestPayslip ? `${latestPayslip.month || "Current"} ${latestPayslip.year || "Salary"}` : "Monthly Salary Statement"}
                </p>
                <p className="text-xs text-slate-400">Direct Deposit to Bank Account</p>
              </div>
            </div>
          </div>

          <Link
            href={ROUTES.PAYROLL_PAYSLIPS}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
          >
            <Download className="h-3.5 w-3.5" /> Download Payslip (PDF)
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: ROUTES.ATTENDANCE, icon: UserCheck, title: "My Attendance", subtitle: "Timesheets & Shift Roaster", bg: "from-blue-500/10 to-indigo-500/10 text-indigo-600 border-indigo-200/60" },
          { href: ROUTES.LEAVE, icon: Plane, title: "Leave Management", subtitle: "Apply & Track Requests", bg: "from-emerald-500/10 to-teal-500/10 text-emerald-600 border-emerald-200/60" },
          { href: ROUTES.EXPENSES, icon: Wallet, title: "Expense Claims", subtitle: "Submit Bills & Travel", bg: "from-amber-500/10 to-orange-500/10 text-amber-600 border-amber-200/60" },
          { href: "/helpdesk/tickets", icon: HelpCircle, title: "Internal IT / HR Help", subtitle: "Raise Support Ticket", bg: "from-purple-500/10 to-violet-500/10 text-purple-600 border-purple-200/60" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all"
          >
            <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-gradient-to-br", item.bg)}>
              <item.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{item.title}</p>
              <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Leave Applications</h3>
            <p className="text-xs text-slate-500 mt-0.5">Status updates from your reporting manager.</p>
          </div>
          <Link href={ROUTES.LEAVE} className="text-xs font-semibold text-indigo-600 hover:underline">
            View All &rarr;
          </Link>
        </div>

        <div className="mt-3 space-y-2">
          {leaveLoading ? (
            <p className="text-xs text-slate-400 py-4 text-center">Loading requests…</p>
          ) : recentLeaves.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No recent leave requests filed.</p>
          ) : (
            recentLeaves.map((item: LeaveRequestSummary) => (
              <div
                key={item.id ?? `${item.fromDate}-${item.toDate}`}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 hover:bg-slate-50 transition"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900">
                    {item.period?.trim() || "Leave"} · {item.days} day{item.days === 1 ? "" : "s"}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {formatShortDate(item.fromDate)} – {formatShortDate(item.toDate)}
                  </p>
                </div>
                <span className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-bold", leaveStatusClass(item.status ?? "Pending"))}>
                  {item.status ?? "Pending"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </StandardPageLayout>
  );
}
