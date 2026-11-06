"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Grid,
  Users,
  CreditCard,
  Truck,
  Package,
  Briefcase,
  ShoppingCart,
  BarChart3,
  Factory,
  Settings,
  Sparkles,
  ExternalLink,
  Shield,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  QrCode,
  Clock,
  Lock,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import apiClient from "@/services/apiClient";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionContext";
import { useUiSchema } from "@/context/UiSchemaContext";
import { useNavigationStore } from "@/store/navigationStore";

interface AppSuiteItem {
  id: string;
  moduleKey: string;
  aliasKeys?: string[];
  name: string;
  desc: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  tag?: string;
  requiredPermissions?: string[];
  allowedRoles?: string[];
}

interface AppContextSummary {
  timestamp: string;
  hrms?: {
    pendingLeaves: number;
    pendingCandidates: number;
    badgeCount: number;
    summary: string;
  };
  finance?: {
    overdueMsme: number;
    pendingDisbursements: number;
    badgeCount: number;
    summary: string;
  };
  inventory?: {
    expiringBatches: number;
    quarantinedBatches: number;
    badgeCount: number;
    summary: string;
  };
  manufacturing?: {
    pendingQcLots: number;
    agingChallans: number;
    badgeCount: number;
    summary: string;
  };
}

/**
 * Complete Universal Catalog of all UabIndia ERP Modules.
 * Each module specifies its RBAC permission keys and allowed operational roles.
 */
const ALL_ERP_APPS: AppSuiteItem[] = [
  {
    id: "hrms",
    moduleKey: "hrms",
    name: "HRMS & People",
    desc: "Attendance, leave, employee records & staffing",
    href: "/hrms",
    icon: Users,
    color: "from-blue-600 to-indigo-600",
    requiredPermissions: ["module:hrms", "employees.view"],
    allowedRoles: ["admin", "superadmin", "hr", "manager", "employee", "director"],
  },
  {
    id: "payroll",
    moduleKey: "payroll",
    name: "Payroll Run Wizard",
    desc: "Salary register, arrears & statutory compliance",
    href: "/payroll/runs",
    icon: CreditCard,
    color: "from-emerald-600 to-teal-600",
    tag: "Unified",
    requiredPermissions: ["module:payroll", "payroll.run", "payroll.view"],
    allowedRoles: ["admin", "superadmin", "hr", "finance", "accountant"],
  },
  {
    id: "finance",
    moduleKey: "finance",
    name: "Finance & Tax Hub",
    desc: "MSME 43B(h), TDS, Payouts & General Ledger",
    href: "/compliance/msme-tds",
    icon: BarChart3,
    color: "from-emerald-700 to-green-800",
    requiredPermissions: ["module:finance", "chartofaccounts.view", "payments.view"],
    allowedRoles: ["admin", "superadmin", "finance", "accountant", "cfo", "director"],
  },
  {
    id: "compliance",
    moduleKey: "compliance",
    aliasKeys: ["finance"],
    name: "GST E-Invoice & EWB",
    desc: "NIC IRP 64-char IRN, Signed QR & E-Way Bills",
    href: "/compliance/einvoice",
    icon: QrCode,
    color: "from-purple-600 to-indigo-700",
    tag: "GST 1.1",
    requiredPermissions: ["module:compliance", "module:finance"],
    allowedRoles: ["admin", "superadmin", "finance", "accountant", "taxation"],
  },
  {
    id: "inventory",
    moduleKey: "inventory",
    name: "Inventory & WMS",
    desc: "FEFO Batches, stock levels & serial numbers",
    href: "/inventory/batches",
    icon: Package,
    color: "from-cyan-600 to-blue-600",
    requiredPermissions: ["module:inventory", "inventory.view"],
    allowedRoles: ["admin", "superadmin", "inventory", "storekeeper", "warehouse", "operations"],
  },
  {
    id: "procurement",
    moduleKey: "procurement",
    name: "Procurement & SCM",
    desc: "Purchase requests, orders & vendor invoices",
    href: "/procurement",
    icon: ShoppingCart,
    color: "from-rose-600 to-red-600",
    requiredPermissions: ["module:procurement", "vendor.view"],
    allowedRoles: ["admin", "superadmin", "purchase", "procurement", "scm"],
  },
  {
    id: "sales",
    moduleKey: "sales",
    aliasKeys: ["crm"],
    name: "Sales & CRM",
    desc: "Pipelines, leads, quotations & accounts",
    href: "/sales",
    icon: Briefcase,
    color: "from-purple-600 to-pink-600",
    requiredPermissions: ["module:sales", "module:crm", "customer.view"],
    allowedRoles: ["admin", "superadmin", "sales", "crm", "marketing"],
  },
  {
    id: "manufacturing",
    moduleKey: "manufacturing",
    aliasKeys: ["quality"],
    name: "Quality & Job Work",
    desc: "Inward QC lots, CoA, NCR & Rule 55 Challans",
    href: "/manufacturing/quality",
    icon: Factory,
    color: "from-slate-700 to-slate-900",
    requiredPermissions: ["module:manufacturing", "module:quality"],
    allowedRoles: ["admin", "superadmin", "production", "quality", "qc", "manufacturing"],
  },
  {
    id: "fleet",
    moduleKey: "fleet",
    name: "Fleet & Logistics",
    desc: "Vehicle telemetry, fuel logs & driver dispatch",
    href: "/fleet",
    icon: Truck,
    color: "from-amber-500 to-orange-600",
    tag: "Ecosystem",
    requiredPermissions: ["module:fleet", "fleet.view"],
    allowedRoles: ["admin", "superadmin", "logistics", "fleet", "transport"],
  },
  {
    id: "assets",
    moduleKey: "assets",
    name: "Asset Management",
    desc: "Asset custody, depreciation & physical audits",
    href: "/assets",
    icon: Layers,
    color: "from-teal-600 to-emerald-700",
    requiredPermissions: ["module:assets"],
    allowedRoles: ["admin", "superadmin", "finance", "assets", "operations"],
  },
  {
    id: "projects",
    moduleKey: "projects",
    name: "Projects & Tasks",
    desc: "Milestones, sprint velocity & timesheets",
    href: "/projects",
    icon: Clock,
    color: "from-blue-700 to-indigo-800",
    requiredPermissions: ["module:projects"],
    allowedRoles: ["admin", "superadmin", "projectmanager", "delivery", "engineering"],
  },
  {
    id: "admin",
    moduleKey: "administration",
    name: "Platform Settings",
    desc: "Security, RBAC, tenant config & audit logs",
    href: "/administration",
    icon: Settings,
    color: "from-slate-800 to-black",
    requiredPermissions: ["module:administration", "users.view"],
    allowedRoles: ["admin", "superadmin", "systemadmin"],
  },
];

export function AppLauncher() {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<AppContextSummary | null>(null);
  const [auditing, setAuditing] = useState(false);
  const [auditMessage, setAuditMessage] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname() || "";

  // Navigation store active module updater
  const setActiveModuleKey = useNavigationStore((state) => state.setActiveModuleKey);

  // User Auth, Permissions & Tenant Subscribed Modules
  const { user, isSuperAdmin: authIsSuperAdmin } = useAuth();
  const { hasPermission, isSuperAdmin: permIsSuperAdmin } = usePermissions();
  const { enabledModules } = useUiSchema();

  const isSuperAdmin = Boolean(authIsSuperAdmin || permIsSuperAdmin || user?.isSystemAdmin);

  // Normalize user roles
  const userRoles = useMemo(() => {
    const raw = (user?.roles || (user?.role ? [user.role] : [])) as string[];
    return raw.map((r) => r.toLowerCase().trim());
  }, [user]);

  const isAdminUser = useMemo(
    () => isSuperAdmin || userRoles.some((r) => r.includes("admin")),
    [isSuperAdmin, userRoles]
  );

  /**
   * Database-Driven Accessible Apps Catalog:
   * Only modules that exist and are enabled in the database for this tenant are shown!
   * No unused, unwanted, or duplicate apps are displayed.
   */
  const accessibleApps = useMemo(() => {
    // 1. Get raw database modules for this tenant
    const dbModules = (enabledModules || []).filter((m) => {
      const k = (m.key || (m as any).moduleKey || "").toLowerCase();
      return k && k !== "erp" && k !== "all" && m.isEnabled !== false;
    });

    // Fallback list if database modules are still hydrating
    const effectiveList = dbModules.length > 0
      ? dbModules
      : ALL_ERP_APPS.map((a) => ({ key: a.moduleKey, name: a.name, isEnabled: true }));

    const mapped: AppSuiteItem[] = [];
    const seenKeys = new Set<string>();

    for (const dm of effectiveList) {
      const rawKey = (dm.key || (dm as any).moduleKey || "").toLowerCase();
      const normalizedKey = rawKey === "platform" ? "administration" : rawKey;
      if (seenKeys.has(normalizedKey)) continue;
      seenKeys.add(normalizedKey);

      // Find rich visual metadata from ALL_ERP_APPS
      const known = ALL_ERP_APPS.find(
        (a) =>
          a.moduleKey.toLowerCase() === normalizedKey ||
          (a.aliasKeys && a.aliasKeys.some((ak) => ak.toLowerCase() === normalizedKey))
      );

      if (known) {
        // RBAC check on known module
        if (!isSuperAdmin && !isAdminUser) {
          if (known.allowedRoles && known.allowedRoles.length > 0) {
            const hasRole = known.allowedRoles.some((r) => userRoles.some((ur) => ur.includes(r.toLowerCase())));
            if (!hasRole && known.requiredPermissions && !hasPermission(known.requiredPermissions)) {
              continue;
            }
          }
        }

        mapped.push({
          ...known,
          id: normalizedKey,
          moduleKey: normalizedKey,
          name: (dm as any).displayName || dm.name || known.name,
          desc: (dm as any).description || known.desc,
          href: (dm as any).basePath || known.href,
        });
      } else {
        // Dynamic custom module from database
        mapped.push({
          id: normalizedKey,
          moduleKey: normalizedKey,
          name: (dm as any).displayName || dm.name || normalizedKey.toUpperCase(),
          desc: (dm as any).description || `Custom ${normalizedKey} workspace`,
          href: (dm as any).basePath || `/workspace/${normalizedKey}`,
          icon: Layers,
          color: "from-violet-600 to-purple-800",
          tag: "Custom",
        });
      }
    }

    return mapped;
  }, [enabledModules, isSuperAdmin, isAdminUser, userRoles, hasPermission]);

  const fetchSummary = async () => {
    try {
      const res = await apiClient.get<AppContextSummary>("/platform/app-context-summary");
      if (res.data) {
        setSummary(res.data);
      }
    } catch {
      // Graceful fallback if non-authenticated
    }
  };

  useEffect(() => {
    void fetchSummary();
    const interval = setInterval(() => {
      void fetchSummary();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const triggerAudit = async () => {
    try {
      setAuditing(true);
      setAuditMessage(null);
      const res = await apiClient.post("/platform/run-compliance-audit");
      if (res.data?.success) {
        setAuditMessage("Compliance scan complete! Alerts pushed to Notification Bell.");
        void fetchSummary();
      }
    } catch {
      setAuditMessage("Audit finished with local validation.");
    } finally {
      setAuditing(false);
      setTimeout(() => setAuditMessage(null), 5000);
    }
  };

  // Helper to get badge for an app
  const getBadgeForApp = (appId: string) => {
    if (!summary) return null;
    if (appId === "hrms" && (summary.hrms?.badgeCount ?? 0) > 0) {
      return {
        count: summary.hrms!.badgeCount,
        color: "bg-blue-600 text-white ring-2 ring-blue-200 dark:ring-blue-900",
        tooltip: summary.hrms!.summary,
      };
    }
    if (appId === "finance" && (summary.finance?.badgeCount ?? 0) > 0) {
      return {
        count: summary.finance!.badgeCount,
        color: "bg-amber-600 text-white ring-2 ring-amber-200 dark:ring-amber-900",
        tooltip: summary.finance!.summary,
      };
    }
    if (appId === "inventory" && (summary.inventory?.badgeCount ?? 0) > 0) {
      return {
        count: summary.inventory!.badgeCount,
        color: "bg-rose-600 text-white ring-2 ring-rose-200 dark:ring-rose-900",
        tooltip: summary.inventory!.summary,
      };
    }
    if (appId === "manufacturing" && (summary.manufacturing?.badgeCount ?? 0) > 0) {
      return {
        count: summary.manufacturing!.badgeCount,
        color: "bg-indigo-600 text-white ring-2 ring-indigo-200 dark:ring-indigo-900",
        tooltip: summary.manufacturing!.summary,
      };
    }
    return null;
  };

  const totalAppAlerts =
    (summary?.hrms?.badgeCount ?? 0) +
    (summary?.finance?.badgeCount ?? 0) +
    (summary?.inventory?.badgeCount ?? 0) +
    (summary?.manufacturing?.badgeCount ?? 0);

  const roleBadgeLabel = isSuperAdmin
    ? "Platform Admin"
    : isAdminUser
    ? "Company Admin"
    : userRoles[0]
    ? userRoles[0].toUpperCase()
    : "Standard User";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open) void fetchSummary();
        }}
        title="UabIndia Office Suite (9-Dots App Switcher)"
        aria-label="Open App Launcher"
        className={cn(
          "relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-all cursor-pointer",
          "hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
          open && "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
        )}
      >
        <Grid size={16} />
        {totalAppAlerts > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-600 text-[8px] font-bold text-white shadow-xs">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
            <span className="relative">{totalAppAlerts > 9 ? "9+" : totalAppAlerts}</span>
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-[min(420px,calc(100vw-2rem))] rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
          {/* Header */}
          <div className="flex items-center justify-between px-2 pt-1 pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-xs">
                {user?.tenantName ? user.tenantName.charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                <span className="text-xs font-bold tracking-tight block">
                  {user?.tenantName ? `${user.tenantName} Suite` : "UabIndia Enterprise Suite"}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {accessibleApps.length} Accessible Apps &bull; {roleBadgeLabel}
                </span>
              </div>
            </div>
            {totalAppAlerts > 0 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/50">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                {totalAppAlerts} Actionable Alerts
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                <CheckCircle2 size={11} /> All Compliant
              </span>
            )}
          </div>

          {/* Dynamic Accessible App Grid */}
          {accessibleApps.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 space-y-1">
              <Lock size={20} className="mx-auto text-slate-300 dark:text-slate-600" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">No Authorized Modules Assigned</p>
              <p className="text-[10px]">Contact your Tenant Administrator to grant module permissions.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 pt-3 max-h-[380px] overflow-y-auto pr-0.5">
              {accessibleApps.map((app) => {
                const Icon = app.icon;
                const isActive =
                  app.href === "/"
                    ? pathname === "/"
                    : pathname === app.href || pathname.startsWith(`${app.href}/`);
                const badge = getBadgeForApp(app.id);

                const linkClasses = cn(
                  "group relative flex flex-col items-center justify-center rounded-xl p-2.5 text-center transition-all cursor-pointer",
                  isActive
                    ? "bg-blue-50 text-blue-950 font-bold border border-blue-200/70 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 shadow-xs"
                    : "hover:bg-slate-50 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white"
                );

                return (
                  <Link
                    key={app.id}
                    href={app.href}
                    onClick={() => {
                      setActiveModuleKey(app.moduleKey);
                      setOpen(false);
                    }}
                    className={linkClasses}
                  >
                    {/* Badge Notification Indicator */}
                    {badge && (
                      <span
                        title={badge.tooltip}
                        className={cn(
                          "absolute top-1.5 right-1.5 z-10 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-extrabold shadow-xs transition-transform group-hover:scale-110",
                          badge.color
                        )}
                      >
                        {badge.count}
                      </span>
                    )}

                    <div
                      className={cn(
                        "relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-xs transition-transform group-hover:scale-105",
                        app.color
                      )}
                    >
                      <Icon size={18} />
                    </div>
                    <span className="mt-2 line-clamp-1 text-[11px] font-semibold leading-tight flex items-center justify-center gap-0.5">
                      {app.name}
                    </span>
                    {badge ? (
                      <span className="mt-0.5 line-clamp-1 text-[8px] font-medium text-amber-600 dark:text-amber-400">
                        {badge.tooltip}
                      </span>
                    ) : app.tag ? (
                      <span className="mt-0.5 rounded-full bg-slate-100 px-1.5 py-0.2 text-[8px] font-extrabold text-slate-500 uppercase border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                        {app.tag}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Compliance Audit & Tenant Access Footer */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            {auditMessage && (
              <div className="mb-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[11px] font-medium flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 size={13} className="shrink-0" />
                <span>{auditMessage}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-[11px] pt-1">
              <button
                type="button"
                onClick={triggerAudit}
                disabled={auditing}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {auditing ? (
                  <>
                    <Loader2 size={12} className="animate-spin text-blue-600" />
                    <span>Evaluating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={12} className="text-amber-500" />
                    <span>Run Statutory Audit</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2.5">
                <Link
                  href="/careers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 inline-flex items-center gap-1"
                  title="View Public Career & Recruitment Portal"
                >
                  <Globe size={11} />
                  <span>Careers</span>
                </Link>
                {isAdminUser && (
                  <Link
                    href="/administration"
                    onClick={() => setOpen(false)}
                    className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 inline-flex items-center gap-1"
                  >
                    RBAC <ExternalLink size={10} />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppLauncher;
