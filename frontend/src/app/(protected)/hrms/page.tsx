"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Calendar,
  Clock,
  GraduationCap,
  Plane,
  UserPlus,
  Users,
  UserMinus,
} from "lucide-react";
import { ModuleWorkspaceHub } from "@/components/workspace/module-workspace-hub";
import {
  erpPanelBodyClassName,
  erpPanelClassName,
  erpPanelHeaderClassName,
  erpPanelTitleClassName,
} from "@/components/workspace/styles";
import { ROUTES } from "@/constants/routes";
import { hrmsApi } from "@/services/modules";
import { getApiErrorMessage } from "@/lib/api-errors";
import type { DashboardStats } from "@/types";

const LINKS = [
  { href: ROUTES.EMPLOYEES, label: "Employees", icon: Users, desc: "Directory, master, and employment records" },
  { href: ROUTES.ATTENDANCE, label: "Attendance", icon: Clock, desc: "Daily punches, shifts, and overtime" },
  { href: ROUTES.LEAVE, label: "Leave", icon: Calendar, desc: "Requests, balances, and policies" },
  { href: ROUTES.ONBOARDING, label: "Onboarding", icon: UserPlus, desc: "Joiner checklists and statutory setup" },
  { href: ROUTES.RECRUITMENT, label: "Recruitment", icon: Briefcase, desc: "Openings, screening, and hiring" },
  { href: ROUTES.PERFORMANCE, label: "Performance", icon: GraduationCap, desc: "Appraisal cycles and reviews" },
  { href: ROUTES.TRAINING, label: "Training", icon: GraduationCap, desc: "Courses, assessments, and certificates" },
  { href: ROUTES.TRAVEL, label: "Travel", icon: Plane, desc: "Travel requests and expense-linked trips" },
  { href: ROUTES.OFFBOARDING, label: "Offboarding", icon: UserMinus, desc: "Exit clearance and F&F handoff" },
  { href: ROUTES.HR_ASSETS, label: "Assets", icon: Briefcase, desc: "Issue, recover, and track employee assets" },
];

export default function HrmsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    hrmsApi.dashboard
      .getStats()
      .then((response) => {
        if (!alive) return;
        setStats(response.data as DashboardStats);
      })
      .catch((err) => {
        if (!alive) return;
        setError(getApiErrorMessage(err, "Could not load HR snapshot."));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <ModuleWorkspaceHub
      title="HRMS"
      subtitle="People operations — headcount, attendance, leave, hiring, and the employee lifecycle."
      eyebrow="People"
      icon="users"
      loading={loading}
      error={error}
      links={LINKS}
      linksTitle="HR workspaces"
      stats={[
        { label: "Active people", value: stats?.activeEmployees ?? 0, helper: "On roll", href: ROUTES.EMPLOYEES, icon: Users },
        { label: "Present today", value: stats?.presentToday ?? 0, helper: "Attendance", href: ROUTES.ATTENDANCE, icon: Clock },
        { label: "On leave", value: stats?.onLeaveToday ?? 0, helper: "Today", href: ROUTES.LEAVE, icon: Calendar },
        { label: "Open positions", value: stats?.openPositions ?? 0, helper: "Recruitment", href: ROUTES.RECRUITMENT, icon: Briefcase },
      ]}
    >
      <section className={erpPanelClassName}>
        <div className={erpPanelHeaderClassName}>
          <h2 className={erpPanelTitleClassName}>Today</h2>
          <Link href={ROUTES.ESS_HOME} className="text-xs font-semibold text-slate-700 hover:text-slate-900">
            Open ESS
          </Link>
        </div>
        <div className={`${erpPanelBodyClassName} space-y-3 text-sm text-slate-600`}>
          <p>
            Joiners this month <span className="font-semibold text-slate-900">{loading ? "…" : stats?.newJoinersMTD ?? 0}</span>
            {" · "}
            Exits <span className="font-semibold text-slate-900">{loading ? "…" : stats?.exitsMTD ?? 0}</span>
          </p>
          <p>
            Pending leave <span className="font-semibold text-slate-900">{loading ? "…" : stats?.pendingLeaves ?? 0}</span>
            {" · "}
            Late check-ins <span className="font-semibold text-slate-900">{loading ? "…" : stats?.lateCheckins ?? 0}</span>
          </p>
          <p className="text-xs text-slate-500">Attendance MTD {loading ? "…" : `${stats?.attendancePctMTD ?? 0}%`}</p>
        </div>
      </section>
    </ModuleWorkspaceHub>
  );
}
