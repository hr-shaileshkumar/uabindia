"use client";

import React, { useState, useMemo } from "react";
import {
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  FileText,
  MessageSquare,
  Award,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Check,
  X,
  Phone,
  Mail,
  Building2,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { notifySuccess, notifyError } from "@/lib/notifications";

export interface TeamMember {
  id: string;
  name: string;
  employeeCode: string;
  designation: string;
  department: string;
  attendanceToday: "PRESENT" | "ON_LEAVE" | "REMOTE_WFH" | "ABSENT";
  punchInTime?: string;
  kpiScorePct: number;
  openTasksCount: number;
  avatarUrl?: string;
}

export interface TeamApprovalRequest {
  id: string;
  employeeName: string;
  type: "LEAVE" | "MISSED_PUNCH" | "EXPENSE" | "OVERTIME";
  details: string;
  datesOrHours: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: string;
}

export const INITIAL_TEAM: TeamMember[] = [
  {
    id: "tm-1",
    name: "Ananya Roy",
    employeeCode: "UAB-EMP-014",
    designation: "Senior Frontend Architect",
    department: "Engineering & IT",
    attendanceToday: "PRESENT",
    punchInTime: "09:12 AM",
    kpiScorePct: 94,
    openTasksCount: 3,
  },
  {
    id: "tm-2",
    name: "Ganesh Kulkarni",
    employeeCode: "UAB-EMP-028",
    designation: "Senior Automation & Field Engineer",
    department: "Customer Success",
    attendanceToday: "REMOTE_WFH",
    punchInTime: "08:55 AM",
    kpiScorePct: 91,
    openTasksCount: 4,
  },
  {
    id: "tm-3",
    name: "Vikram Seth",
    employeeCode: "UAB-EMP-033",
    designation: "Chartered Accountant / Tax Lead",
    department: "Corporate Finance",
    attendanceToday: "PRESENT",
    punchInTime: "09:28 AM",
    kpiScorePct: 88,
    openTasksCount: 2,
  },
  {
    id: "tm-4",
    name: "Sanjay Deshmukh",
    employeeCode: "UAB-EMP-042",
    designation: "Plant Procurement Specialist",
    department: "Supply Chain",
    attendanceToday: "ON_LEAVE",
    kpiScorePct: 85,
    openTasksCount: 1,
  },
];

export const INITIAL_APPROVALS: TeamApprovalRequest[] = [
  {
    id: "appr-1",
    employeeName: "Ananya Roy",
    type: "LEAVE",
    details: "Privilege Leave (PL) - Personal family commitment",
    datesOrHours: "04 Nov 2026 - 06 Nov 2026 (3 Days)",
    status: "PENDING",
    requestedAt: "Yesterday, 04:30 PM",
  },
  {
    id: "appr-2",
    employeeName: "Ganesh Kulkarni",
    type: "MISSED_PUNCH",
    details: "Field duty punch-out missed due to emergency plant visit",
    datesOrHours: "31 Oct 2026 (Regularize 07:45 PM)",
    status: "PENDING",
    requestedAt: "Today, 08:45 AM",
  },
  {
    id: "appr-3",
    employeeName: "Vikram Seth",
    type: "OVERTIME",
    details: "Month-end GST reconciliation and payroll locking",
    datesOrHours: "4.5 Hours OT on 31 Oct",
    status: "PENDING",
    requestedAt: "Yesterday, 06:15 PM",
  },
];

export function ManagerSelfServiceStudio() {
  const [team, setTeam] = useState<TeamMember[]>(INITIAL_TEAM);
  const [approvals, setApprovals] = useState<TeamApprovalRequest[]>(INITIAL_APPROVALS);
  const [searchQuery, setSearchQuery] = useState("");

  const pendingApprovals = useMemo(() => approvals.filter((a) => a.status === "PENDING"), [approvals]);

  const handleDecision = (id: string, decision: "APPROVED" | "REJECTED") => {
    setApprovals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: decision } : a))
    );
    notifySuccess(`Request has been ${decision.toLowerCase()}.`);
  };

  const filteredTeam = useMemo(() => {
    return team.filter((m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.employeeCode.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [team, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border/70 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Manager Self-Service (MSS) Leadership Center
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                People Manager Portal
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Team headcount oversight, real-time punch radar, 1-click leave/overtime approvals, and performance tracking
            </p>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Direct Reports</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground mt-2">
            {team.length} Members
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Across 3 operational departments
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Present on Duty Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {team.filter((t) => t.attendanceToday === "PRESENT" || t.attendanceToday === "REMOTE_WFH").length} / {team.length}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            1 On Planned Leave
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Pending Team Approvals</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {pendingApprovals.length} Actions
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Leaves, Overtime, Punch fixes
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Average Team KPI Score</span>
            <Award className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-foreground mt-2">
            89.5%
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Top performing squad in Q3
          </div>
        </div>
      </div>

      {/* Main Split: Pending Approvals & Team Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Pending Team Approvals (5 cols) */}
        <div className="lg:col-span-5 bg-card border border-border/70 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/80 pb-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">Action Needed: Team Requests</h2>
              <p className="text-xs text-muted-foreground">Approve or reject workforce requests with 1 click</p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600">
              {pendingApprovals.length} Pending
            </span>
          </div>

          <div className="space-y-3">
            {pendingApprovals.map((req) => (
              <div
                key={req.id}
                className="p-3.5 rounded-xl border border-border/80 bg-background space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">{req.employeeName}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-muted text-foreground">
                    {req.type.replace("_", " ")}
                  </span>
                </div>

                <div className="text-xs text-foreground font-medium">{req.details}</div>
                <div className="text-[11px] text-primary font-semibold font-mono">{req.datesOrHours}</div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <span className="text-[10px] text-muted-foreground">{req.requestedAt}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDecision(req.id, "REJECTED")}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-rose-500/30 text-rose-600 hover:bg-rose-500/10 transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleDecision(req.id, "APPROVED")}
                      className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {pendingApprovals.length === 0 && (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-xl">
                No pending approval requests. Your team is all caught up!
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Direct Reports Roster (7 cols) */}
        <div className="lg:col-span-7 bg-card border border-border/70 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/80 pb-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">Direct Reports Roster & Attendance Radar</h2>
              <p className="text-xs text-muted-foreground">Today's live punch status and performance scoring</p>
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search reportee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-input bg-background focus:ring-1 focus:ring-primary outline-hidden"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredTeam.map((member) => (
              <div
                key={member.id}
                className="p-3.5 rounded-xl border border-border/80 bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-primary/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    {member.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">{member.name}</div>
                    <div className="text-[11px] text-muted-foreground">{member.designation}</div>
                    <div className="text-[10px] font-mono text-primary font-semibold">{member.employeeCode}</div>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs justify-between sm:justify-end">
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-muted-foreground block">Today:</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        member.attendanceToday === "PRESENT"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : member.attendanceToday === "REMOTE_WFH"
                          ? "bg-blue-500/10 text-blue-600"
                          : "bg-amber-500/10 text-amber-600"
                      }`}
                    >
                      {member.attendanceToday.replace("_", " ")}
                    </span>
                    {member.punchInTime && (
                      <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        In: {member.punchInTime}
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-muted-foreground block">KPI Score:</span>
                    <span className="text-sm font-extrabold text-foreground">{member.kpiScorePct}%</span>
                    <div className="text-[10px] text-muted-foreground">{member.openTasksCount} active tasks</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

