"use client";

import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import ModuleIcon from "@/components/ModuleIcon";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/context/AuthContext";
import { useUiSchema } from "@/context/UiSchemaContext";
import { buildWorkspaceModules } from "@/lib/erp/navigation";
import { getPortalTheme } from "@/lib/erp/portals";
import type { ERPRole } from "@/lib/erp/types";
import { cn } from "@/lib/utils";

type NavChild = {
  label: string;
  href: string;
  icon?: string | null;
};

type NavGroup = {
  label: string;
  children: NavChild[];
};

type NavModule = {
  key: string;
  label: string;
  icon: string;
  description?: string;
  homeHref: string | null;
  groups: NavGroup[];
};

const FALLBACK_MODULES: NavModule[] = [
  { key: "dashboard", label: "Dashboard", icon: "dashboard", homeHref: ROUTES.DASHBOARD, groups: [{ label: "Pages", children: [{ label: "Home", href: ROUTES.DASHBOARD, icon: "dashboard" }] }] },
  { key: "hrms", label: "HRMS", icon: "users", homeHref: ROUTES.HRMS_HOME, groups: [{ label: "Core HR", children: [{ label: "Dashboard", href: ROUTES.HRMS_HOME, icon: "dashboard" }] }] },
  { key: "finance", label: "Finance", icon: "bank", homeHref: ROUTES.CHART_OF_ACCOUNTS, groups: [{ label: "Finance", children: [{ label: "Chart of Accounts", href: ROUTES.CHART_OF_ACCOUNTS, icon: "bank" }] }] },
  { key: "inventory", label: "Inventory", icon: "box", homeHref: ROUTES.ITEMS, groups: [{ label: "Inventory", children: [{ label: "Items", href: ROUTES.ITEMS, icon: "box" }] }] },
  { key: "procurement", label: "Procurement", icon: "shopping-cart", homeHref: ROUTES.VENDORS, groups: [{ label: "Procurement", children: [{ label: "Vendors", href: ROUTES.VENDORS, icon: "shopping-cart" }] }] },
  { key: "crm", label: "CRM", icon: "contact-round", homeHref: ROUTES.CUSTOMERS, groups: [{ label: "CRM", children: [{ label: "Customers", href: ROUTES.CUSTOMERS, icon: "users" }] }] },
  { key: "sales", label: "Sales", icon: "shopping-bag", homeHref: ROUTES.SALES_ORDERS, groups: [{ label: "Sales", children: [{ label: "Sales Orders", href: ROUTES.SALES_ORDERS, icon: "shopping-bag" }] }] },
  { key: "projects", label: "Projects", icon: "folder", homeHref: ROUTES.PLATFORM_PROJECTS, groups: [{ label: "Projects", children: [{ label: "Project Registry", href: ROUTES.PLATFORM_PROJECTS, icon: "folder" }] }] },
  { key: "assets", label: "Assets", icon: "monitor", homeHref: ROUTES.HR_ASSETS, groups: [{ label: "Assets", children: [{ label: "Asset Management", href: ROUTES.HR_ASSETS, icon: "monitor" }] }] },
  { key: "reports", label: "Reports", icon: "bar-chart", homeHref: ROUTES.REPORTS_ERP, groups: [{ label: "Reports", children: [{ label: "Business Reports", href: ROUTES.REPORTS_ERP, icon: "bar-chart" }] }] },
  { key: "workflow", label: "Workflow", icon: "git-branch", homeHref: ROUTES.APPROVALS, groups: [{ label: "Workflow", children: [{ label: "Approvals", href: ROUTES.APPROVALS, icon: "git-branch" }] }] },
  { key: "administration", label: "Administration", icon: "settings", homeHref: ROUTES.DASHBOARD, groups: [{ label: "Administration", children: [{ label: "Users", href: ROUTES.PLATFORM_USERS, icon: "users" }] }] },
];

const COLLAPSED_STORAGE_KEY = "erp.shell.sidebar.collapsed";
const isActivePath = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

const flattenModuleChildren = (module: NavModule) => module.groups.flatMap((group) => group.children);

const inferPageIcon = (moduleKey: string, child: NavChild, moduleIcon: string) => {
  if (child.icon) return child.icon;

  const source = `${moduleKey} ${child.label} ${child.href}`.toLowerCase();
  const keywordMap: Array<[string[], string]> = [
    [["user", "employee", "team", "staff", "candidate"], "users"],
    [["role", "permission", "access"], "shield"],
    [["attendance", "shift", "timesheet", "time"], "clock"],
    [["leave", "holiday"], "calendar-check"],
    [["payroll", "payslip", "salary", "bonus", "arrear"], "wallet"],
    [["invoice", "billing", "payment", "expense", "journal", "account"], "bank"],
    [["warehouse", "stock"], "warehouse"],
    [["item", "inventory", "catalog"], "box"],
    [["vendor", "purchase", "procurement", "grn"], "shopping-cart"],
    [["customer", "quotation", "sales", "return"], "shopping-bag"],
    [["project", "task"], "folder"],
    [["asset", "device"], "monitor"],
    [["report", "analytics"], "bar-chart"],
    [["ticket", "helpdesk", "support", "faq"], "ticket"],
    [["notification", "alert"], "bell"],
    [["template", "announcement", "message", "communication"], "megaphone"],
    [["integration", "api", "webhook", "app"], "plug"],
    [["security", "mfa", "session", "policy", "sso"], "shield"],
    [["settings", "config"], "settings"],
    [["document", "file"], "file-text"],
  ];

  for (const [keywords, icon] of keywordMap) {
    if (keywords.some((keyword) => source.includes(keyword))) {
      return icon;
    }
  }

  return moduleIcon;
};

export function AppSidebar({
  role,
  mobileOpen,
  onClose,
}: {
  role: ERPRole;
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isSuperAdmin } = useAuth();
  const { navigation, enabledModules } = useUiSchema();
  const portal = useMemo(() => getPortalTheme(role), [role]);

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(COLLAPSED_STORAGE_KEY) === "1";
  });
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  const visibleModules = useMemo(() => {
    const schemaModules = buildWorkspaceModules(navigation.modules, enabledModules)
      .map<NavModule>((module) => ({
        key: module.key,
        label: module.label,
        icon: module.icon || "grid",
        description: module.description,
        homeHref: module.homeHref,
        groups: module.groups
          .map((group) => ({
            label: group.label,
            children: group.items.map((item) => ({ label: item.name, href: item.path, icon: item.icon })),
          }))
          .filter((group) => group.children.length > 0),
      }))
      .filter((module) => flattenModuleChildren(module).length > 0);

    const sourceModules = schemaModules.length > 0 ? schemaModules : FALLBACK_MODULES;
    return sourceModules.filter((module) => (module.key === "administration" ? isSuperAdmin || role !== "employee" : true));
  }, [enabledModules, isSuperAdmin, navigation.modules, role]);

  const activeModule = useMemo(
    () => visibleModules.find((module) => flattenModuleChildren(module).some((child) => isActivePath(pathname, child.href))) || null,
    [pathname, visibleModules]
  );

  useEffect(() => {
    if (activeModule) {
      setExpandedModule(activeModule.key);
    }
  }, [activeModule]);

  const persistCollapsed = (next: boolean) => {
    setCollapsed(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(COLLAPSED_STORAGE_KEY, next ? "1" : "0");
    }
  };

  const openModuleHome = (module: NavModule) => {
    const targetHref = module.homeHref || flattenModuleChildren(module)[0]?.href;
    if (!targetHref) return;
    router.push(targetHref);
    onClose?.();
  };

  const content = (
    <div className={cn("relative flex h-full flex-col overflow-hidden", portal.sidebarClassName)}>
      {!onClose ? (
        <div className="pointer-events-none absolute right-2 top-2 z-10 hidden lg:block">
          <div className="pointer-events-auto">
            <button
              type="button"
              onClick={() => persistCollapsed(!collapsed)}
              className="inline-flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-slate-200/85 bg-white/92 text-slate-500 shadow-[0_6px_14px_rgba(15,23,42,0.08)] transition hover:bg-slate-50 hover:text-slate-900"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>
        </div>
      ) : null}
      {onClose ? (
        <div className={cn("flex items-center justify-end border-b border-slate-200/70 px-2 py-1.5 lg:hidden", portal.sidebarBorderClassName)}>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto px-1.5 py-1.5">
        <div className="space-y-1">
          <Link
            href={ROUTES.DASHBOARD}
            onClick={onClose}
            title="Dashboard"
            className={cn(
              "flex items-center gap-2 rounded-[0.95rem] px-2.25 py-2 transition",
              isActivePath(pathname, ROUTES.DASHBOARD)
                ? "bg-slate-950 text-white shadow-[0_14px_24px_rgba(15,23,42,0.18)]"
                : "bg-white/78 text-slate-700 ring-1 ring-slate-200/80 hover:bg-white hover:shadow-sm"
            )}
          >
            <span
              className={cn(
                "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.9rem] ring-1",
                isActivePath(pathname, ROUTES.DASHBOARD)
                  ? "bg-white/12 text-white ring-white/10"
                  : "bg-slate-50 text-slate-500 ring-slate-200/80"
              )}
            >
              <ModuleIcon name="dashboard" className="h-3.5 w-3.5" />
            </span>
            {!collapsed ? <span className="truncate text-sm font-semibold">Dashboard</span> : null}
          </Link>

          {visibleModules.map((module) => {
            const active = module.key === activeModule?.key;
            const expanded = !collapsed && expandedModule === module.key;

            return (
              <section key={module.key} className="space-y-1">
                <div
                  className={cn(
                    "flex items-stretch gap-1 rounded-[0.95rem] p-1 transition",
                    active
                      ? "bg-slate-950 text-white shadow-[0_14px_24px_rgba(15,23,42,0.18)]"
                      : "bg-white/78 text-slate-700 ring-1 ring-slate-200/80 hover:bg-white hover:shadow-sm"
                  )}
                >
                  <button
                    type="button"
                    title={module.label}
                    onClick={() => openModuleHome(module)}
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-[0.82rem] px-1.5 py-1 text-left"
                  >
                    <span
                      className={cn(
                        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.9rem] ring-1",
                        active ? "bg-white/12 text-white ring-white/10" : "bg-slate-50 text-slate-500 ring-slate-200/80"
                      )}
                    >
                      <ModuleIcon name={module.icon} className="h-3.5 w-3.5" />
                    </span>
                    {!collapsed ? (
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.88rem] font-semibold">{module.label}</span>
                        {module.description ? (
                          <span className={cn("block truncate text-[10px]", active ? "text-slate-200/80" : "text-slate-500")}>
                            {module.description}
                          </span>
                        ) : null}
                      </span>
                    ) : null}
                  </button>

                  {!collapsed ? (
                    <button
                      type="button"
                      aria-label={expanded ? `Collapse ${module.label}` : `Expand ${module.label}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setExpandedModule((current) => (current === module.key ? null : module.key));
                      }}
                      className={cn(
                        "inline-flex w-8 shrink-0 items-center justify-center rounded-[0.82rem] transition",
                        active ? "text-white/80 hover:bg-white/12 hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      )}
                    >
                      <ChevronDown className={cn("h-4 w-4 shrink-0 transition", expanded ? "rotate-180" : "rotate-0")} />
                    </button>
                  ) : null}
                </div>

                {expanded && !collapsed ? (
                  <div className="rounded-[0.92rem] border border-slate-200/80 bg-white/90 p-1.5 shadow-[0_6px_16px_rgba(15,23,42,0.04)]">
                    <div className="mb-1 px-2 pt-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Submodules</p>
                    </div>
                    <div className="space-y-2">
                      {module.groups.map((group) => (
                        <section key={`${module.key}-${group.label}`} className="space-y-1">
                          <div className="px-2">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                              {group.label}
                            </p>
                          </div>
                          <div className="space-y-1">
                            {group.children.map((child) => {
                              const childActive = isActivePath(pathname, child.href);

                              return (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  onClick={onClose}
                                  className={cn(
                                    "flex items-center gap-2 rounded-[0.85rem] px-2 py-1.5 text-[0.82rem] transition",
                                    childActive ? "bg-sky-50 text-sky-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "inline-flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-lg ring-1",
                                      childActive ? "bg-sky-100 text-sky-700 ring-sky-100" : "bg-white text-slate-500 ring-slate-200/80"
                                    )}
                                  >
                                    <ModuleIcon name={inferPageIcon(module.key, child, module.icon)} className="h-2.5 w-2.5" />
                                  </span>
                                  <span className="truncate">{child.label}</span>
                                </Link>
                              );
                            })}
                          </div>
                        </section>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={cn(
          "hidden shrink-0 border-r border-slate-200/70 bg-white/72 shadow-[0_14px_28px_rgba(15,23,42,0.04)] backdrop-blur-xl lg:sticky lg:top-[var(--erp-topbar-height)] lg:block lg:h-[calc(100dvh-var(--erp-topbar-height))]",
          collapsed ? "w-[4.25rem]" : "w-[clamp(12.75rem,14vw,14.5rem)]",
          portal.sidebarClassName
        )}
      >
        {content}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-x-0 bottom-0 top-[var(--erp-topbar-height)] z-50 bg-slate-950/35 lg:hidden" onClick={onClose}>
          <aside
            className="h-full w-[86vw] max-w-[20rem] border-r border-slate-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {content}
          </aside>
        </div>
      ) : null}
    </>
  );
}
