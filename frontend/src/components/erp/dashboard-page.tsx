"use client";

import Link from "next/link";
import { 
  Users, 
  Calendar, 
  Wallet, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  UserPlus, 
  Calculator, 
  AlertCircle,
  TrendingUp
} from "lucide-react";
import ModuleIcon from "@/components/ModuleIcon";
import { ErpMotionBackdrop, ErpMotionItem, ErpMotionSection } from "@/components/erp/motion";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { StatusBadge } from "@/components/erp/status-badge";
import { useUiSchema } from "@/context/UiSchemaContext";

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

  const mockHrStats = [
    { label: "Active Employees", value: "128", note: "+4 joined this month", icon: Users, color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
    { label: "Today's Attendance", value: "96.8%", note: "124 present / 4 absent", icon: Clock, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
    { label: "Pending Leave Requests", value: "5 Requests", note: "Awaiting HR approval", icon: Calendar, color: "text-amber-600 bg-amber-50 border-amber-100" },
  ];

  const mockPayrollStats = [
    { label: "July 2026 Payroll", value: "Rs 6,48,200", note: "Fully calculated", icon: Wallet, color: "text-blue-600 bg-blue-50 border-blue-100" },
    { label: "Disbursement status", value: "Ready", note: "Awaiting batch transfer", icon: CheckCircle2, color: "text-cyan-600 bg-cyan-50 border-cyan-100" },
    { label: "Pending Reimbursements", value: "3 Claims", note: "Rs 14,500 total value", icon: TrendingUp, color: "text-rose-600 bg-rose-50 border-rose-100" },
  ];

  const recentLeaveQueue = [
    { employee: "Rajesh Kumar", type: "Casual Leave", duration: "2 days (Jul 17 - Jul 18)", reason: "Family event", status: "Pending" },
    { employee: "Sneha Sharma", type: "Sick Leave", duration: "1 day (Today)", reason: "Medical checkup", status: "Pending" },
    { employee: "Ankit Patel", type: "Earned Leave", duration: "5 days (Jul 21 - Jul 25)", reason: "Annual vacation", status: "Approved" },
  ];

  const payrollBatches = [
    { batch: "Operations & Support", count: "48 Employees", amount: "Rs 1,92,000", status: "Processed" },
    { batch: "Product Engineering", count: "32 Employees", amount: "Rs 2,40,000", status: "Processed" },
    { batch: "Sales & Marketing", count: "24 Employees", amount: "Rs 1,16,200", status: "Draft" },
  ];

  return (
    <StandardPageLayout
      title="Workspace overview"
      subtitle="Start from pending work, recent business areas, and the operational shortcuts that matter for this role."
      eyebrow="Workspace / Control Center"
      icon="dashboard"
      meta={
        <>
          <StatusBadge tone={schemaError ? "critical" : dashboardReady ? "positive" : "warning"}>
            {loading ? "Refreshing workspace" : schemaError ? "Using fallback state" : "Workspace ready"}
          </StatusBadge>
          <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-700">
            Business Dashboard Active
          </span>
        </>
      }
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/context" className="erp-action-btn erp-action-btn-primary">
            Open workspace setup
          </Link>
          <button type="button" onClick={() => void refresh()} className="erp-action-btn erp-action-btn-secondary">
            Refresh workspace
          </button>
        </div>
      }
    >
      {/* ── Welcome Banner ─────────────────────────── */}
      <ErpMotionSection className="relative overflow-hidden rounded-[var(--erp-radius-panel)] border border-[var(--erp-border)] bg-white p-5 shadow-[var(--erp-shadow-sm)]">
        <ErpMotionBackdrop />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 z-10">
          <div className="space-y-2.5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-600">
              Operational Focus
            </p>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
              Focusing on your core people & payroll operations.
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-500">
              Surface key workforce stats, track payroll cycle disbursements, and clear pending approval items in one click.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link 
              href="/hrms" 
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600 shadow-sm"
            >
              <Users className="h-4 w-4 text-indigo-600" />
              HRMS Module
            </Link>
            <Link 
              href="/payroll" 
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600 shadow-sm"
            >
              <Wallet className="h-4 w-4 text-emerald-600" />
              Payroll Module
            </Link>
          </div>
        </div>
      </ErpMotionSection>

      {/* ── If Backend Widgets are Empty, Render HR/Payroll Centered Dashboard ─────────────────── */}
      {sections.length === 0 ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(19rem,0.7fr)]">
          {/* Main Column */}
          <div className="space-y-5">
            
            {/* 1. HRMS Overview Section */}
            <ErpMotionSection className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Workforce Metrics</p>
                  <h3 className="text-lg font-bold text-slate-900">HRMS & Core Personnel</h3>
                </div>
                <Link href="/hrms" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition">
                  Go to HRMS <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {/* KPI Grid */}
              <div className="grid gap-4 sm:grid-cols-3">
                {mockHrStats.map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 shadow-none">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-500">{stat.label}</p>
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${stat.color}`}>
                        <stat.icon className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="mt-2 text-2xl font-extrabold text-slate-900 tracking-tight">{stat.value}</p>
                    <p className="mt-1 text-[11px] font-medium text-slate-400">{stat.note}</p>
                  </div>
                ))}
              </div>

              {/* Leave approvals list */}
              <div className="mt-5">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Pending Leave Approvals</p>
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <table className="min-w-full divide-y divide-slate-150">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Employee</th>
                        <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Leave Type</th>
                        <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Duration</th>
                        <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {recentLeaveQueue.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition">
                          <td className="px-4 py-2.5 text-xs font-bold text-slate-800">{item.employee}</td>
                          <td className="px-4 py-2.5 text-xs text-slate-500">{item.type}</td>
                          <td className="px-4 py-2.5 text-xs text-slate-400">{item.duration}</td>
                          <td className="px-4 py-2.5 text-right">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                              item.status === "Approved" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-amber-50 text-amber-700 border border-amber-100"
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </ErpMotionSection>

            {/* 2. Payroll Overview Section */}
            <ErpMotionSection className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" delay={0.05}>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Compensation & Cycles</p>
                  <h3 className="text-lg font-bold text-slate-900">Payroll & Disbursements</h3>
                </div>
                <Link href="/payroll" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition">
                  Go to Payroll <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {/* KPI Grid */}
              <div className="grid gap-4 sm:grid-cols-3">
                {mockPayrollStats.map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 shadow-none">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-500">{stat.label}</p>
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${stat.color}`}>
                        <stat.icon className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="mt-2 text-2xl font-extrabold text-slate-900 tracking-tight">{stat.value}</p>
                    <p className="mt-1 text-[11px] font-medium text-slate-400">{stat.note}</p>
                  </div>
                ))}
              </div>

              {/* Payroll Batches list */}
              <div className="mt-5">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Current Month Batch Progress</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {payrollBatches.map((item, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-none flex flex-col justify-between hover:border-indigo-200 transition">
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-800 truncate">{item.batch}</h4>
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            item.status === "Processed" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        <p className="mt-1 text-[10px] text-slate-400">{item.count}</p>
                      </div>
                      <p className="mt-4 text-base font-extrabold text-slate-900 leading-none">{item.amount}</p>
                    </div>
                  ))}
                </div>
              </div>
            </ErpMotionSection>
          </div>

          {/* Right Sidebar Column */}
          <aside className="space-y-4">
            {/* Quick Actions Panel */}
            <ErpMotionItem className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Shortcuts</p>
              <h3 className="mt-1.5 text-sm font-bold text-slate-800">Quick Operations</h3>
              <div className="mt-4 space-y-2">
                <Link 
                  href="/hrms/employees" 
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 hover:bg-white hover:border-indigo-200 transition"
                >
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-700">Add New Employee</span>
                  </div>
                  <ArrowRight className="h-3 w-3 text-slate-400" />
                </Link>
                <Link 
                  href="/payroll" 
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 hover:bg-white hover:border-indigo-200 transition"
                >
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-700">Process Salary Run</span>
                  </div>
                  <ArrowRight className="h-3 w-3 text-slate-400" />
                </Link>
                <Link 
                  href="/hrms" 
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 hover:bg-white hover:border-indigo-200 transition"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-bold text-slate-700">Log Timesheets</span>
                  </div>
                  <ArrowRight className="h-3 w-3 text-slate-400" />
                </Link>
              </div>
            </ErpMotionItem>

            {/* Compliance checklist */}
            <ErpMotionItem className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Statutory Compliance</p>
              <h3 className="mt-1.5 text-sm font-bold text-slate-800">July 2026 Checklist</h3>
              <div className="mt-4 space-y-3">
                {[
                  { label: "Provident Fund (PF) Filing", done: true },
                  { label: "Employee State Insurance (ESI)", done: true },
                  { label: "Professional Tax (PT) Deposit", done: false },
                  { label: "TDS Salary (Form 24Q) Prep", done: false },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5">
                    {item.done ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    )}
                    <span className={`text-xs ${item.done ? "text-slate-500 line-through" : "text-slate-700 font-semibold"}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </ErpMotionItem>

            {/* Enabled modules */}
            <ErpMotionItem className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">System Modules</p>
              <h3 className="mt-1.5 text-sm font-bold text-slate-800">Active Workspaces</h3>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {enabledModules.slice(0, 10).map((module) => (
                  <span
                    key={module.key}
                    className="rounded-lg border border-slate-100 bg-slate-50/50 px-2.5 py-1 text-[10px] font-semibold text-slate-500"
                  >
                    {module.displayName || module.name || module.key}
                  </span>
                ))}
              </div>
            </ErpMotionItem>
          </aside>
        </div>
      ) : (
        /* ── Otherwise render dynamic dashboard sections ── */
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(19rem,0.7fr)]">
          <div className="space-y-5">
            <ErpMotionSection className="rounded-[0.75rem] border border-slate-200 bg-white p-5 shadow-[var(--erp-shadow-sm)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Priority Work
                  </p>
                  <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                    Start with the items most likely to block operations.
                  </h2>
                </div>
                <StatusBadge tone={priorityActions.length > 0 ? "warning" : "positive"}>
                  {priorityActions.length > 0 ? `${priorityActions.length} items to review` : "No urgent items"}
                </StatusBadge>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {(priorityActions.length > 0 ? priorityActions : commonActions.slice(0, 2)).map((card) => {
                  const content = (
                    <div className="flex h-full flex-col rounded-[1rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_12px_24px_rgba(15,23,42,0.06)]">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef4ff] text-[color:var(--erp-primary)]">
                          <ModuleIcon name={card.icon} className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950">{card.title}</p>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                            {card.sectionTitle}
                          </p>
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-6 text-slate-600">{card.summary}</p>
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
            </ErpMotionSection>

            <ErpMotionSection className="rounded-[0.75rem] border border-slate-200 bg-white p-5 shadow-[var(--erp-shadow-sm)]" delay={0.08}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Work Areas
                  </p>
                  <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                    Continue into the modules you use most often.
                  </h2>
                </div>
                <StatusBadge tone="info">{commonActions.length} shortcuts</StatusBadge>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                {commonActions.map((card) =>
                  card.href ? (
                    <Link
                      key={card.key}
                      href={card.href}
                      className="rounded-[1rem] border border-slate-200 bg-white px-4 py-4 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-[#3157a7]">
                          <ModuleIcon name={card.icon} className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950">{card.title}</p>
                          <p className="truncate text-xs text-slate-500">{card.moduleKey}</p>
                        </div>
                      </div>
                    </Link>
                  ) : null
                )}
              </div>
            </ErpMotionSection>
          </div>

          <aside className="space-y-4">
            <ErpMotionItem className="rounded-[0.75rem] border border-slate-200 bg-white p-4 shadow-[var(--erp-shadow-sm)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Enabled Business Areas
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {enabledModules.slice(0, 10).map((module) => (
                  <span
                    key={module.key}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600"
                  >
                    {module.displayName || module.name || module.key}
                  </span>
                ))}
              </div>
            </ErpMotionItem>

            <ErpMotionItem className="rounded-[0.75rem] border border-slate-200 bg-white p-4 shadow-[var(--erp-shadow-sm)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Workspace Notes
              </p>
              <div className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
                <p>Keep this page focused on decisions, exceptions, and shortcuts.</p>
                <p>Detailed module setup, schema internals, and route contracts should stay inside admin pages.</p>
              </div>
            </ErpMotionItem>
          </aside>
        </div>
      )}
    </StandardPageLayout>
  );
}
