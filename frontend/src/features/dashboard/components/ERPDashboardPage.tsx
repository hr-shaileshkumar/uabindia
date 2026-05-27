"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { PERMISSIONS } from "@/constants/permissions";
import { ROUTES } from "@/constants/routes";
import { hrApi } from "@/services/hrApi";
import { useUiSchema } from "@/context/UiSchemaContext";
import { useAuth } from "@/context/AuthContext";

type DashboardMetrics = {
  totalEmployees: number;
  attendancePct: number;
  totalCustomers: number;
  totalVendors: number;
  totalItems: number;
  totalAccounts: number;
  revenue: number;
  expenses: number;
  receivables: number;
  payables: number;
};

type ProjectCompareRow = {
  projectId: string;
  projectName: string;
  totalEmployees: number;
  activeEmployees: number;
  attendanceRecords: number;
  leaveRequests: number;
  approvedLeaveDays: number;
};

const FALLBACK_DASHBOARD_MODULES = [
  {
    title: "Sales & CRM",
    description: "Manage customers and sales operations",
    items: [
      { name: "Customers", href: ROUTES.CUSTOMERS, metricKey: "totalCustomers" as const },
      { name: "Sales Orders", href: ROUTES.SALES_ORDERS },
    ],
    icon: "📊",
  },
  {
    title: "Purchase & Procurement",
    description: "Manage vendors and purchase operations",
    items: [
      { name: "Vendors", href: ROUTES.VENDORS, metricKey: "totalVendors" as const },
      { name: "Purchase Orders", href: ROUTES.PURCHASE_ORDERS },
    ],
    icon: "🛒",
  },
  {
    title: "Inventory Management",
    description: "Manage items and stock levels",
    items: [{ name: "Items", href: ROUTES.ITEMS, metricKey: "totalItems" as const }],
    icon: "📦",
  },
  {
    title: "Finance & Accounting",
    description: "Manage financial records",
    items: [
      { name: "Chart of Accounts", href: ROUTES.CHART_OF_ACCOUNTS, metricKey: "totalAccounts" as const },
      { name: "Journal Entries", href: ROUTES.JOURNAL_ENTRIES },
      { name: "Payments", href: ROUTES.PAYMENTS },
    ],
    icon: "💰",
  },
  {
    title: "Inventory",
    description: "Warehouses and stock",
    items: [
      { name: "Warehouses", href: ROUTES.WAREHOUSES },
      { name: "Stock Movements", href: ROUTES.STOCK_MOVEMENTS },
    ],
    icon: "🏭",
  },
  {
    title: "Workflow",
    description: "Approvals and control",
    items: [{ name: "Approval inbox", href: ROUTES.APPROVALS }],
    icon: "✅",
  },
] as const;

const getSectionEmoji = (sectionKey: string) => {
  const key = sectionKey.toLowerCase();
  if (key.includes("sales") || key.includes("crm")) return "📊";
  if (key.includes("purchase") || key.includes("procurement")) return "🛒";
  if (key.includes("inventory") || key.includes("stock")) return "📦";
  if (key.includes("finance") || key.includes("account")) return "💰";
  if (key.includes("warehouse")) return "🏭";
  if (key.includes("workflow") || key.includes("approval")) return "✅";
  return "📁";
};

export default function ERPDashboardPage() {
  const { user } = useAuth();
  const { dashboard } = useUiSchema();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalEmployees: 0,
    attendancePct: 0,
    totalCustomers: 0,
    totalVendors: 0,
    totalItems: 0,
    totalAccounts: 0,
    revenue: 0,
    expenses: 0,
    receivables: 0,
    payables: 0,
  });
  const [loading, setLoading] = useState(true);
  const [projectCompare, setProjectCompare] = useState<ProjectCompareRow[]>([]);
  const [compareLoading, setCompareLoading] = useState(true);
  const [alerts, setAlerts] = useState<{ id: string; title: string; message: string; isRead: boolean }[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [trendRange, setTrendRange] = useState<"monthly" | "weekly">("monthly");
  const [projectFilter, setProjectFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [customersRes, vendorsRes, itemsRes, accountsRes, notificationsRes] = await Promise.all([
          hrApi.erp.customers.getAll(1, 1),
          hrApi.erp.vendors.getAll(1, 1),
          hrApi.erp.items.getAll(1, 1),
          hrApi.erp.chartOfAccounts.getAll(),
          hrApi.notifications.listMine({ take: 5 }, { suppressGlobalError: true }).catch(() => ({ data: [] })),
        ]);

        const totalCustomers = customersRes.data?.total ?? customersRes.data?.data?.length ?? 0;
        const totalVendors = vendorsRes.data?.total ?? vendorsRes.data?.data?.length ?? 0;
        const totalItems = itemsRes.data?.total ?? itemsRes.data?.data?.length ?? 0;
        const totalAccounts = Array.isArray(accountsRes.data) ? accountsRes.data.length : 0;

        const rawAlerts = Array.isArray(notificationsRes.data) ? notificationsRes.data : [];
        setAlerts(
          rawAlerts.map((item: { id?: string; title?: string; message?: string; isRead?: boolean }, index: number) => ({
            id: item.id || `alert-${index}`,
            title: item.title || "Alert",
            message: item.message || "Action required",
            isRead: !!item.isRead,
          }))
        );
        setAlertsLoading(false);

        setMetrics((prev) => ({
          ...prev,
          totalCustomers,
          totalVendors,
          totalItems,
          totalAccounts,
        }));

        setCompareLoading(true);
        try {
          const compareRes = await hrApi.reports.hr.projectCompare();
          const rows = Array.isArray(compareRes.data?.projects) ? (compareRes.data.projects as ProjectCompareRow[]) : [];
          setProjectCompare(rows.slice(0, 6));
          const totalEmployees = rows.reduce((sum, row) => sum + (row.totalEmployees || 0), 0);
          const attendanceRecords = rows.reduce((sum, row) => sum + (row.attendanceRecords || 0), 0);
          const maxAttendanceBase = Math.max(totalEmployees * 22, 1);
          const attendancePct = Math.min(100, (attendanceRecords / maxAttendanceBase) * 100);

          setMetrics((prev) => ({
            ...prev,
            totalEmployees,
            attendancePct,
          }));
        } catch {
          setProjectCompare([]);
        } finally {
          setCompareLoading(false);
        }
      } catch {
        setMetrics((prev) => ({ ...prev }));
        setAlerts([]);
        setAlertsLoading(false);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const dashboardModules = useMemo(() => {
    if (dashboard.sections.length > 0) {
      const schemaCards = dashboard.sections
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title))
        .map((section) => {
          const items = section.widgets
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title))
            .filter((widget) => !!widget.href)
            .map((widget) => {
              const metricKey = widget.props?.metricKey as keyof DashboardMetrics | undefined;
              return {
                name: widget.title,
                href: widget.href || ROUTES.DASHBOARD,
                count: metricKey && typeof metrics[metricKey] === "number" ? metrics[metricKey] : undefined,
              };
            });

          return {
            title: section.title,
            description: section.widgets[0]?.props?.description || "Backend-driven dashboard section",
            items,
            icon: getSectionEmoji(section.key),
          };
        })
        .filter((section) => section.items.length > 0);

      if (schemaCards.length > 0) {
        return schemaCards;
      }
    }

    return FALLBACK_DASHBOARD_MODULES.map((section) => ({
      ...section,
      items: section.items.map((item) => ({
        name: item.name,
        href: item.href,
        count:
          "metricKey" in item && item.metricKey
            ? metrics[item.metricKey as keyof DashboardMetrics]
            : undefined,
      })),
    }));
  }, [dashboard.sections, metrics]);

  const roleSet = useMemo(() => {
    const roles = new Set<string>();
    if (user?.role) {
      roles.add(String(user.role).toLowerCase());
    }
    for (const role of user?.roles || []) {
      if (role) roles.add(String(role).toLowerCase());
    }
    return roles;
  }, [user]);

  const dashboardRole = useMemo<"admin" | "hr" | "finance" | "user">(() => {
    const isAdmin = roleSet.has("admin") || roleSet.has("tenantadmin") || roleSet.has("tenant admin");
    if (isAdmin) return "admin";

    const isHr = [...roleSet].some((role) => role.includes("hr") || role.includes("people") || role.includes("recruit"));
    if (isHr) return "hr";

    const isFinance = [...roleSet].some((role) => role.includes("finance") || role.includes("account") || role.includes("payroll"));
    if (isFinance) return "finance";

    return "user";
  }, [roleSet]);

  const revenueValue = metrics.revenue > 0 ? metrics.revenue : 12400000;
  const expenseValue = metrics.expenses > 0 ? metrics.expenses : 7300000;

  const allKpis = useMemo(
    () => [
      {
        key: "revenue",
        label: "Revenue",
        value: `₹${(revenueValue / 100000).toFixed(1)}L`,
        meta: "This reporting period",
        tone: "success" as const,
        icon: (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-2 0-3.5.9-3.5 2.2 0 1.5 1.3 2.1 3.5 2.6 2.2.5 3.5 1.1 3.5 2.6 0 1.3-1.5 2.2-3.5 2.2s-3.5-.9-3.5-2.2M12 5v14" />
          </svg>
        ),
      },
      {
        key: "expenses",
        label: "Expenses",
        value: `₹${(expenseValue / 100000).toFixed(1)}L`,
        meta: "Controlled against budget",
        tone: "danger" as const,
        icon: (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M7 4h10l1 3H6l1-3zm-1 3h12v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7z" />
          </svg>
        ),
      },
      {
        key: "employees",
        label: "Employees",
        value: String(loading ? "—" : metrics.totalEmployees),
        meta: "Across selected projects",
        tone: "info" as const,
        icon: (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </svg>
        ),
      },
      {
        key: "attendance",
        label: "Attendance",
        value: `${loading ? "—" : metrics.attendancePct.toFixed(1)}%`,
        meta: "Monthly average attendance",
        tone: "info" as const,
        icon: (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 11l2 2 4-4M7 3v3m10-3v3M4 8h16v11a2 2 0 01-2 2H6a2 2 0 01-2-2V8z" />
          </svg>
        ),
      },
    ],
    [expenseValue, loading, metrics.attendancePct, metrics.totalEmployees, revenueValue]
  );

  const visibleKpis = useMemo(() => {
    if (dashboardRole === "hr") {
      return allKpis.filter((kpi) => kpi.key === "employees" || kpi.key === "attendance");
    }

    if (dashboardRole === "finance") {
      return allKpis.filter((kpi) => kpi.key === "revenue" || kpi.key === "expenses");
    }

    return allKpis;
  }, [allKpis, dashboardRole]);

  const trendValues = useMemo(() => {
    const monthly = [62, 68, 71, 74, 79, 83];
    const weekly = [58, 64, 67, 72, 76, 81];
    const base = trendRange === "monthly" ? monthly : weekly;
    const attendanceAnchor = Math.max(42, Math.round(metrics.attendancePct || 68));

    return base.map((value, index) => {
      const normalized = Math.round((value * 0.55) + (attendanceAnchor * 0.45) + index);
      return Math.min(96, Math.max(34, normalized));
    });
  }, [metrics.attendancePct, trendRange]);

  const projectsForFilter = useMemo(
    () => (projectCompare.length > 0 ? projectCompare.map((project) => ({ value: project.projectId, label: project.projectName })) : [
      { value: "demo-alpha", label: "Alpha Plant" },
      { value: "demo-beta", label: "Beta Distribution" },
      { value: "demo-gamma", label: "Gamma Services" },
    ]),
    [projectCompare]
  );

  const recentActivity = useMemo(
    () => alerts.slice(0, 4),
    [alerts]
  );

  return (
    <ProtectedRoute permission={PERMISSIONS.DASHBOARD_VIEW}>
      <StandardPageLayout
        title="Dashboard"
        subtitle="Decision-first command center for HR, finance, and operations"
        eyebrow="Workspace"
        actions={
          <>
            <Link
              href={ROUTES.REPORTS_HOME}
              className="erp-action-btn erp-action-btn-secondary"
            >
              View Reports
            </Link>
            <Link href={ROUTES.NOTIFICATIONS} className="erp-action-btn erp-action-btn-primary">
              Open Alerts
            </Link>
          </>
        }
      >
        <div className="space-y-6">
          <nav className="erp-breadcrumb-nav" aria-label="Dashboard workspace breadcrumb">
            <span className="erp-breadcrumb-link">Dashboard</span>
            <span className="erp-breadcrumb-sep" aria-hidden>
              /
            </span>
            <span className="erp-breadcrumb-current">Workspace</span>
          </nav>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12 xl:gap-6">
            <section className="xl:col-span-9">
              <div className="erp-kpi-decision-grid">
                {visibleKpis.map((kpi) => {
                  const isDecisionCard = kpi.key === "revenue" || kpi.key === "expenses";
                  return (
                    <article
                      key={kpi.key}
                      className={`erp-kpi-card ${
                        kpi.tone === "success"
                          ? "erp-kpi-card-success"
                          : kpi.tone === "danger"
                            ? "erp-kpi-card-danger"
                            : "erp-kpi-card-info"
                      } ${isDecisionCard ? "erp-kpi-card-priority" : "erp-kpi-card-secondary"}`}
                    >
                      <div className="erp-kpi-head">
                        <span className="erp-kpi-icon">{kpi.icon}</span>
                        <p className="erp-kpi-label">{kpi.label}</p>
                      </div>
                      <p className={`erp-kpi-value ${kpi.key === "revenue" ? "erp-kpi-value-success" : ""} ${kpi.key === "expenses" ? "erp-kpi-value-danger" : ""}`}>
                        {kpi.value}
                      </p>
                      <p className="erp-kpi-meta">{kpi.meta}</p>
                    </article>
                  );
                })}
              </div>
            </section>

            <aside className="xl:col-span-3">
              <Card className="h-full border-slate-200/70 shadow-(--erp-shadow-sm)">
                <CardHeader>
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                  <CardDescription>Live workflow signals and pending updates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2.5 pt-4">
                  {alertsLoading ? (
                    <div className="space-y-2">
                      {[...Array(4)].map((_, idx) => (
                        <div key={`activity-skeleton-${idx}`} className="h-14 animate-pulse rounded-xl bg-slate-100" />
                      ))}
                    </div>
                  ) : recentActivity.length > 0 ? (
                    recentActivity.map((item) => (
                      <div key={item.id} className="rounded-xl border border-slate-200/70 bg-slate-50/80 p-3">
                        <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-600">{item.message}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No activity yet. Your latest approvals and alerts will appear here.</p>
                  )}
                </CardContent>
              </Card>
            </aside>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12 xl:gap-6">
            <Card className="xl:col-span-8 border-slate-200/70 shadow-(--erp-shadow-sm)">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>Performance Trend</CardTitle>
                    <CardDescription>Monthly / weekly movement with quick filters</CardDescription>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                      <button
                        type="button"
                        onClick={() => setTrendRange("monthly")}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${trendRange === "monthly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                      >
                        Monthly
                      </button>
                      <button
                        type="button"
                        onClick={() => setTrendRange("weekly")}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${trendRange === "weekly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                      >
                        Weekly
                      </button>
                    </div>

                    <select
                      value={projectFilter}
                      onChange={(e) => setProjectFilter(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700"
                    >
                      <option value="all">All Projects</option>
                      {projectsForFilter.map((project) => (
                        <option key={project.value} value={project.value}>{project.label}</option>
                      ))}
                    </select>

                    <select
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700"
                    >
                      <option value="all">All Departments</option>
                      <option value="operations">Operations</option>
                      <option value="hr">HR</option>
                      <option value="finance">Finance</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <div className="flex h-40 items-end gap-3">
                    {[...Array(6)].map((_, index) => (
                      <div key={`trend-skeleton-${index}`} className="flex-1 rounded-t-lg bg-slate-200/90 animate-pulse" style={{ height: `${36 + index * 8}%` }} />
                    ))}
                  </div>
                ) : (
                  <div className="flex h-40 items-end gap-3">
                    {trendValues.map((value, index) => (
                      <div key={`trend-${index}`} className="flex-1">
                        <div className="w-full rounded-t-lg bg-blue-500/85" style={{ height: `${Math.min(100, value)}%` }} />
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{trendRange === "monthly" ? "Monthly" : "Weekly"} trend</span>
                  <span>{projectFilter === "all" ? "All Projects" : "Scoped Project"} · {departmentFilter === "all" ? "All Departments" : "Filtered Department"}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="xl:col-span-4 border-slate-200/70 shadow-(--erp-shadow-sm)">
              <CardHeader>
                <CardTitle>Project Comparison</CardTitle>
                <CardDescription>Operational load and people utilization by project</CardDescription>
              </CardHeader>
              <CardContent>
                {compareLoading ? (
                  <div className="space-y-2">
                    {[...Array(4)].map((_, idx) => (
                      <div key={`compare-skeleton-${idx}`} className="h-16 animate-pulse rounded-xl bg-slate-100" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(projectCompare.length > 0
                      ? projectCompare.slice(0, 4)
                      : [
                          { projectId: "demo-1", projectName: "Alpha Plant", totalEmployees: 62, leaveRequests: 8 },
                          { projectId: "demo-2", projectName: "Beta Distribution", totalEmployees: 49, leaveRequests: 5 },
                          { projectId: "demo-3", projectName: "Gamma Services", totalEmployees: 38, leaveRequests: 4 },
                        ]
                    ).map((project) => (
                      <div key={project.projectId} className="rounded-xl border border-slate-200/75 bg-slate-50/70 p-3.5">
                        <p className="text-sm font-semibold text-slate-900">{project.projectName}</p>
                        <div className="mt-1.5 grid grid-cols-2 gap-2 text-xs text-slate-600">
                          <span>Employees: {project.totalEmployees}</span>
                          <span>Leave req: {project.leaveRequests}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12 xl:gap-6">
            <Card className="xl:col-span-4 border-slate-200/70 shadow-(--erp-shadow-sm)">
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                {alertsLoading ? (
                  <div className="space-y-2">
                    {[...Array(4)].map((_, idx) => (
                      <div key={`approval-skeleton-${idx}`} className="h-14 animate-pulse rounded-xl bg-slate-100" />
                    ))}
                  </div>
                ) : alerts.length === 0 ? (
                  <p className="text-sm text-gray-500">No pending approvals.</p>
                ) : (
                  <div className="space-y-2">
                    {alerts
                      .filter((item) => !item.isRead)
                      .slice(0, 5)
                      .map((item) => (
                        <div key={item.id} className="rounded-xl border border-slate-200/75 p-3.5">
                          <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                          <p className="mt-1 text-xs text-gray-600">{item.message}</p>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="xl:col-span-4 border-slate-200/70 shadow-(--erp-shadow-sm)">
              <CardHeader>
                <CardTitle>Issues & Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                {alertsLoading ? (
                  <div className="space-y-2">
                    {[...Array(4)].map((_, idx) => (
                      <div key={`issue-skeleton-${idx}`} className="h-14 animate-pulse rounded-xl bg-amber-100/60" />
                    ))}
                  </div>
                ) : alerts.length === 0 ? (
                  <p className="text-sm text-gray-500">No active issues.</p>
                ) : (
                  <div className="space-y-2">
                    {alerts.slice(0, 5).map((item) => (
                      <div key={`issue-${item.id}`} className="rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                        <p className="text-sm font-semibold text-amber-900">{item.title}</p>
                        <p className="mt-1 text-xs text-amber-800">{item.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="xl:col-span-4 border-slate-200/70 shadow-(--erp-shadow-sm)">
              <CardHeader>
                <CardTitle>Collaboration Hub</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link
                  href={ROUTES.NOTIFICATIONS}
                  className="erp-action-btn erp-action-btn-secondary w-full justify-between"
                >
                  Open Notifications Center
                </Link>
                <Link
                  href={ROUTES.DOCUMENTS}
                  className="erp-action-btn erp-action-btn-secondary w-full justify-between"
                >
                  Open Documents Library
                </Link>
                <Link
                  href="/erp/reports/hr"
                  className="erp-action-btn erp-action-btn-secondary w-full justify-between"
                >
                  View HR Analytics
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {dashboardModules.map((module) => (
              <Card key={module.title} className="transition-shadow hover:shadow-(--erp-shadow)">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{module.icon}</span>
                    {module.title}
                  </CardTitle>
                  <p className="text-sm text-gray-500">{module.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {module.items.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-gray-700">{item.name}</span>
                        {"count" in item && item.count !== undefined && (
                          <span className="text-sm font-medium text-gray-500">{item.count}</span>
                        )}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-slate-200/70 shadow-(--erp-shadow-sm)">
            <CardHeader>
              <CardTitle>System Statistics</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Avg Order Value</p>
                <p className="text-lg font-semibold mt-1">₹{(metrics.revenue / 50).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Profit Margin</p>
                <p className="text-lg font-semibold mt-1 text-green-600">
                  {((((metrics.revenue - metrics.expenses) / metrics.revenue) * 100) || 0).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Receivables Days</p>
                <p className="text-lg font-semibold mt-1">28 days</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payables Days</p>
                <p className="text-lg font-semibold mt-1">35 days</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </StandardPageLayout>
    </ProtectedRoute>
  );
}
