"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Calendar,
  Wallet,
  Clock,
  ArrowRight,
  CheckCircle2,
  UserPlus,
  Calculator,
} from "lucide-react";
import ModuleIcon from "@/components/ModuleIcon";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { StatusBadge } from "@/components/erp/status-badge";
import {
  erpActionCardClassName,
  erpActionCardIconClassName,
  erpActionCardSubtitleClassName,
  erpActionCardTitleClassName,
  erpAsidePanelClassName,
  erpButtonClassName,
  erpModuleTagClassName,
  erpPanelBodyClassName,
  erpPanelClassName,
  erpPanelHeaderClassName,
  erpPanelTitleClassName,
  erpSectionClassName,
  erpSectionEyebrowClassName,
  erpSectionTitleClassName,
  erpStatCardClassName,
  erpStatCardHelperClassName,
  erpStatCardLabelClassName,
  erpStatCardValueClassName,
  erpStatusBadgeTone,
  erpTableTdClassName,
  erpTableThClassName,
  erpTableWrapClassName,
} from "@/components/erp/erpStyles";
import { useUiSchema } from "@/context/UiSchemaContext";
import { hrmsApi } from "@/services/modules/hrms";
import { payrollApi } from "@/services/modules/payroll";
import type { DashboardStats, LeaveRequestSummary, PayrollOverviewStats, PayrollRunSummary } from "@/types";

type ActionCard = {
  key: string;
  title: string;
  summary: string;
  href?: string | null;
  icon: string;
  sectionTitle: string;
  moduleKey: string;
  emphasis: "critical" | "normal";
};

const summarizeWidget = (summary?: string, fallback?: string) =>
  summary?.trim() || fallback || "Open the workspace area linked to this action.";

const getSectionTone = (title: string) => {
  const source = title.toLowerCase();
  if (source.includes("approval") || source.includes("alert") || source.includes("exception")) {
    return "critical" as const;
  }
  return "normal" as const;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const formatShortDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

type StatCard = {
  label: string;
  value: string;
  note: string;
  icon: typeof Users;
};

const buildHrStatCards = (stats: DashboardStats | undefined, loading: boolean): StatCard[] => {
  if (loading || !stats) {
    return [
      { label: "Active Employees", value: "…", note: "Loading workforce data", icon: Users },
      { label: "Today's Attendance", value: "…", note: "Loading attendance data", icon: Clock },
      { label: "Pending Leave Requests", value: "…", note: "Loading leave queue", icon: Calendar },
    ];
  }

  return [
    {
      label: "Active Employees",
      value: String(stats.activeEmployees),
      note: `${stats.totalEmployees} total · ${stats.newJoinersMTD} joined MTD`,
      icon: Users,
    },
    {
      label: "Today's Attendance",
      value: `${stats.attendancePctMTD}%`,
      note: `${stats.presentToday} present · ${stats.absentToday} absent · ${stats.onLeaveToday} on leave`,
      icon: Clock,
    },
    {
      label: "Pending Leave Requests",
      value: String(stats.pendingLeaves),
      note: stats.pendingLeaves === 1 ? "Awaiting approval" : "Awaiting approval",
      icon: Calendar,
    },
  ];
};

const buildPayrollStatCards = (stats: PayrollOverviewStats | undefined, loading: boolean): StatCard[] => {
  if (loading || !stats) {
    return [
      { label: "Payroll Runs", value: "…", note: "Loading payroll summary", icon: Wallet },
      { label: "Payslips Generated", value: "…", note: "Loading run status", icon: CheckCircle2 },
      { label: "Total Payout", value: "…", note: "Loading payout totals", icon: Wallet },
    ];
  }

  return [
    {
      label: "Payroll Runs",
      value: String(stats.totalRuns),
      note: `${stats.draftRuns} draft · ${stats.completedRuns} completed`,
      icon: Wallet,
    },
    {
      label: "Payslips Generated",
      value: String(stats.totalPayslips),
      note: "Across all completed runs",
      icon: CheckCircle2,
    },
    {
      label: "Total Payout",
      value: formatCurrency(stats.totalPayout),
      note: "Net payout across payslips",
      icon: Wallet,
    },
  ];
};

const mapLeaveRow = (item: LeaveRequestSummary) => ({
  employee: item.employeeName?.trim() || "Unknown employee",
  type: item.period?.trim() || "Leave",
  duration: `${item.days} day${item.days === 1 ? "" : "s"} (${formatShortDate(item.fromDate)} – ${formatShortDate(item.toDate)})`,
  status: item.status?.trim() || "Pending",
});

const mapPayrollRun = (run: PayrollRunSummary) => ({
  batch: `Run ${formatShortDate(run.runDate)}`,
  count: run.companyId ? "Company run" : "Tenant run",
  amount: run.status === "Completed" ? "Completed" : "In progress",
  status: run.status?.trim() || "Draft",
});

const leaveStatusClass = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized === "approved") return erpStatusBadgeTone.success;
  if (normalized === "rejected") return erpStatusBadgeTone.danger;
  return erpStatusBadgeTone.warning;
};

const runStatusClass = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized === "completed") return erpStatusBadgeTone.success;
  return erpStatusBadgeTone.neutral;
};

export function DashboardPage() {
  const {
    dashboard,
    dashboardReady,
    enabledModules,
    loading,
    schemaError,
    refresh,
  } = useUiSchema();

  const sections = (dashboard?.sections || [])
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder || left.title.localeCompare(right.title))
    .map((section) => ({
      ...section,
      widgets: (section.widgets || [])
        .slice()
        .sort((left, right) => left.sortOrder - right.sortOrder || left.title.localeCompare(right.title)),
    }))
    .filter((section) => section.widgets.length > 0);

  const actionCards: ActionCard[] = sections.flatMap((section) =>
    section.widgets.map((widget) => ({
      key: widget.key,
      title: widget.title,
      summary: summarizeWidget(widget.props.summary, widget.props.description),
      href: widget.href,
      icon: widget.icon || "grid",
      sectionTitle: section.title,
      moduleKey: widget.moduleKey || "workspace",
      emphasis: getSectionTone(section.title),
    }))
  );

  const priorityActions = actionCards.filter((card) => card.emphasis === "critical").slice(0, 4);
  const commonActions = actionCards.filter((card) => card.emphasis === "normal").slice(0, 6);

  const {
    data: hrDashboard,
    isLoading: hrStatsLoading,
    isError: hrStatsError,
  } = useQuery({
    queryKey: ["hr-dashboard"],
    queryFn: async () => {
      const { data } = await hrmsApi.dashboard.getStats();
      return data;
    },
    staleTime: 30_000,
  });

  const {
    data: payrollOverview,
    isLoading: payrollStatsLoading,
  } = useQuery({
    queryKey: ["payroll-overview"],
    queryFn: async () => {
      const { data } = await payrollApi.dashboard();
      return data;
    },
    staleTime: 30_000,
  });

  const {
    data: leaveRequests,
    isLoading: leaveLoading,
  } = useQuery({
    queryKey: ["leave-requests", "dashboard"],
    queryFn: async () => {
      const { data } = await hrmsApi.hrms.leave.list(1, 20);
      return data;
    },
    staleTime: 30_000,
  });

  const {
    data: payrollRuns,
    isLoading: payrollRunsLoading,
  } = useQuery({
    queryKey: ["payroll-runs", "dashboard"],
    queryFn: async () => {
      const { data } = await payrollApi.runs.list();
      return data;
    },
    staleTime: 30_000,
  });

  const hrStats = useMemo(
    () => buildHrStatCards(hrDashboard, hrStatsLoading),
    [hrDashboard, hrStatsLoading]
  );

  const payrollStats = useMemo(
    () => buildPayrollStatCards(payrollOverview, payrollStatsLoading),
    [payrollOverview, payrollStatsLoading]
  );

  const recentLeaveQueue = useMemo(() => {
    const rows = leaveRequests?.requests ?? [];
    const pending = rows.filter((item: LeaveRequestSummary) => (item.status ?? "").toLowerCase() === "pending");
    const source = pending.length > 0 ? pending : rows;
    return source.slice(0, 5).map(mapLeaveRow);
  }, [leaveRequests]);

  const payrollBatches = useMemo(() => {
    const runs = payrollRuns ?? [];
    return runs.slice(0, 3).map(mapPayrollRun);
  }, [payrollRuns]);

  return (
    <StandardPageLayout
      title="Workspace overview"
      subtitle="Pending work, operational shortcuts, and live HR and payroll signals for this role."
      eyebrow="Workspace"
      icon="dashboard"
      meta={
        <>
          <StatusBadge tone={schemaError ? "critical" : dashboardReady ? "positive" : "warning"}>
            {loading ? "Refreshing workspace" : schemaError ? "Using fallback state" : "Workspace ready"}
          </StatusBadge>
          {hrStatsError ? (
            <span className={erpStatusBadgeTone.warning}>HR stats unavailable</span>
          ) : null}
        </>
      }
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/context" className={erpButtonClassName.primary}>
            Open workspace setup
          </Link>
          <button type="button" onClick={() => void refresh()} className={erpButtonClassName.secondary}>
            Refresh workspace
          </button>
        </div>
      }
    >
      {sections.length === 0 ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(19rem,0.7fr)]">
          <div className="space-y-5">
            <section className={erpSectionClassName}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className={erpSectionEyebrowClassName}>Workforce</p>
                  <h2 className={erpSectionTitleClassName}>HRMS & personnel</h2>
                </div>
                <Link href="/hrms" className={`${erpButtonClassName.ghost} !h-8 !px-3 !text-xs`}>
                  Go to HRMS <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {hrStats.map((stat) => (
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

              <div className="mt-5">
                <p className={erpSectionEyebrowClassName}>Recent leave requests</p>
                <div className={`mt-2 ${erpTableWrapClassName}`}>
                  {leaveLoading ? (
                    <p className="px-4 py-6 text-sm text-slate-500">Loading leave requests…</p>
                  ) : recentLeaveQueue.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-slate-500">No leave requests yet.</p>
                  ) : (
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead>
                        <tr>
                          <th className={erpTableThClassName}>Employee</th>
                          <th className={erpTableThClassName}>Leave type</th>
                          <th className={erpTableThClassName}>Duration</th>
                          <th className={`${erpTableThClassName} text-right`}>Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {recentLeaveQueue.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className={`${erpTableTdClassName} font-medium text-slate-900`}>{item.employee}</td>
                            <td className={erpTableTdClassName}>{item.type}</td>
                            <td className={erpTableTdClassName}>{item.duration}</td>
                            <td className={`${erpTableTdClassName} text-right`}>
                              <span className={leaveStatusClass(item.status)}>{item.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </section>

            <section className={erpSectionClassName}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className={erpSectionEyebrowClassName}>Compensation</p>
                  <h2 className={erpSectionTitleClassName}>Payroll & disbursements</h2>
                </div>
                <Link href="/payroll" className={`${erpButtonClassName.ghost} !h-8 !px-3 !text-xs`}>
                  Go to Payroll <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {payrollStats.map((stat) => (
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

              <div className="mt-5">
                <p className={erpSectionEyebrowClassName}>Recent payroll runs</p>
                {payrollRunsLoading ? (
                  <p className="mt-2 text-sm text-slate-500">Loading payroll runs…</p>
                ) : payrollBatches.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">No payroll runs yet.</p>
                ) : (
                  <div className="mt-2 grid gap-3 sm:grid-cols-3">
                    {payrollBatches.map((item, idx) => (
                      <div key={idx} className={erpStatCardClassName}>
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="truncate text-sm font-semibold text-slate-900">{item.batch}</h4>
                          <span className={runStatusClass(item.status)}>{item.status}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{item.count}</p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">{item.amount}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <div className={erpAsidePanelClassName}>
              <p className={erpSectionEyebrowClassName}>Shortcuts</p>
              <h3 className="mt-1 text-sm font-semibold text-slate-900">Quick operations</h3>
              <div className="mt-3 space-y-2">
                {[
                  { href: "/hrms/employees", icon: UserPlus, label: "Add employee" },
                  { href: "/payroll", icon: Calculator, label: "Process salary run" },
                  { href: "/hrms/attendance", icon: Clock, label: "View attendance" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <span className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 text-slate-500" />
                      {item.label}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  </Link>
                ))}
              </div>
            </div>

            <div className={erpAsidePanelClassName}>
              <p className={erpSectionEyebrowClassName}>Modules</p>
              <h3 className="mt-1 text-sm font-semibold text-slate-900">Enabled workspaces</h3>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {enabledModules.length === 0 ? (
                  <p className="text-sm text-slate-500">No modules enabled.</p>
                ) : (
                  enabledModules.slice(0, 10).map((module) => (
                    <span key={module.key} className={erpModuleTagClassName}>
                      {module.displayName || module.name || module.key}
                    </span>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(19rem,0.7fr)]">
          <div className="space-y-5">
            <section className={erpPanelClassName}>
              <div className={erpPanelHeaderClassName}>
                <div>
                  <p className={erpSectionEyebrowClassName}>Priority work</p>
                  <h2 className={erpPanelTitleClassName}>Items that may block operations</h2>
                </div>
                <StatusBadge tone={priorityActions.length > 0 ? "warning" : "positive"}>
                  {priorityActions.length > 0 ? `${priorityActions.length} to review` : "Clear"}
                </StatusBadge>
              </div>
              <div className={`${erpPanelBodyClassName} grid gap-3 md:grid-cols-2`}>
                {(priorityActions.length > 0 ? priorityActions : commonActions.slice(0, 2)).map((card) => {
                  const content = (
                    <div className={`${erpActionCardClassName} h-full`}>
                      <div className="flex items-center gap-3">
                        <span className={erpActionCardIconClassName}>
                          <ModuleIcon name={card.icon} className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className={erpActionCardTitleClassName}>{card.title}</p>
                          <p className={erpActionCardSubtitleClassName}>{card.sectionTitle}</p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{card.summary}</p>
                    </div>
                  );

                  return card.href ? (
                    <Link key={card.key} href={card.href} className="block h-full">
                      {content}
                    </Link>
                  ) : (
                    <div key={card.key}>{content}</div>
                  );
                })}
              </div>
            </section>

            <section className={erpPanelClassName}>
              <div className={erpPanelHeaderClassName}>
                <div>
                  <p className={erpSectionEyebrowClassName}>Work areas</p>
                  <h2 className={erpPanelTitleClassName}>Module shortcuts</h2>
                </div>
                <StatusBadge tone="info">{commonActions.length} links</StatusBadge>
              </div>
              <div className={`${erpPanelBodyClassName} grid gap-3 lg:grid-cols-3`}>
                {commonActions.map((card) =>
                  card.href ? (
                    <Link key={card.key} href={card.href} className={erpActionCardClassName}>
                      <div className="flex items-center gap-3">
                        <span className={erpActionCardIconClassName}>
                          <ModuleIcon name={card.icon} className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className={erpActionCardTitleClassName}>{card.title}</p>
                          <p className={erpActionCardSubtitleClassName}>{card.moduleKey}</p>
                        </div>
                      </div>
                    </Link>
                  ) : null
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <div className={erpAsidePanelClassName}>
              <p className={erpSectionEyebrowClassName}>Enabled modules</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {enabledModules.slice(0, 10).map((module) => (
                  <span key={module.key} className={erpModuleTagClassName}>
                    {module.displayName || module.name || module.key}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}
    </StandardPageLayout>
  );
}
