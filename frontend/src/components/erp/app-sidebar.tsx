"use client";

import Link from "next/link";
import { ChevronDown, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import ModuleIcon from "@/components/ModuleIcon";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/context/AuthContext";
import { useUiSchema } from "@/context/UiSchemaContext";
import { findFrontendModuleMap } from "@/lib/erp/frontend-module-map";
import { buildWorkspaceModules } from "@/lib/erp/navigation";
import { getModuleDescription, getModuleIcon } from "@/lib/erp/module-registry";
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
  { key: "finance", label: "Finance", icon: "bank", homeHref: ROUTES.FINANCE_HOME, groups: [{ label: "Finance", children: [{ label: "Chart of Accounts", href: ROUTES.CHART_OF_ACCOUNTS, icon: "bank" }] }] },
  { key: "inventory", label: "Inventory", icon: "box", homeHref: ROUTES.INVENTORY_HOME, groups: [{ label: "Inventory", children: [{ label: "Items", href: ROUTES.ITEMS, icon: "box" }] }] },
  { key: "procurement", label: "Procurement", icon: "shopping-cart", homeHref: ROUTES.PROCUREMENT_HOME, groups: [{ label: "Procurement", children: [{ label: "Vendors", href: ROUTES.VENDORS, icon: "shopping-cart" }] }] },
  { key: "crm", label: "CRM", icon: "contact-round", homeHref: ROUTES.CRM_HOME, groups: [{ label: "CRM", children: [{ label: "Customers", href: ROUTES.CUSTOMERS, icon: "users" }] }] },
  { key: "sales", label: "Sales", icon: "shopping-bag", homeHref: ROUTES.SALES_HOME, groups: [{ label: "Sales", children: [{ label: "Sales Orders", href: ROUTES.SALES_ORDERS, icon: "shopping-bag" }] }] },
  { key: "projects", label: "Projects", icon: "folder", homeHref: ROUTES.PLATFORM_PROJECTS, groups: [{ label: "Projects", children: [{ label: "Project Registry", href: ROUTES.PLATFORM_PROJECTS, icon: "folder" }] }] },
  { key: "assets", label: "Assets", icon: "monitor", homeHref: ROUTES.HR_ASSETS, groups: [{ label: "Assets", children: [{ label: "Asset Management", href: ROUTES.HR_ASSETS, icon: "monitor" }] }] },
  { key: "reports", label: "Reports", icon: "bar-chart", homeHref: ROUTES.REPORTS_ERP, groups: [{ label: "Reports", children: [{ label: "Business Reports", href: ROUTES.REPORTS_ERP, icon: "bar-chart" }] }] },
  { key: "workflow", label: "Workflow", icon: "git-branch", homeHref: ROUTES.ADMINISTRATION_APPROVALS, groups: [{ label: "Workflow", children: [{ label: "Approvals", href: ROUTES.ADMINISTRATION_APPROVALS, icon: "git-branch" }] }] },
  { key: "administration", label: "Administration", icon: "settings", homeHref: ROUTES.ADMINISTRATION_HOME, groups: [{ label: "Administration", children: [{ label: "Users", href: ROUTES.PLATFORM_USERS, icon: "users" }] }] },
];

const SIDEBAR_MODULE_KEYS = [
  "platform",
  "administration",
  "hrms",
  "payroll",
  "finance",
  "inventory",
  "procurement",
  "sales",
  "crm",
  "helpdesk",
  "communication",
  "integrations",
  "reports",
  "licensing",
  "security",
] as const;

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
  collapsed = false,
  mobileOpen,
  onClose,
}: {
  role: ERPRole;
  collapsed?: boolean;
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isSuperAdmin } = useAuth();
  const { navigation, enabledModules } = useUiSchema();
  const portal = useMemo(() => getPortalTheme(role), [role]);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  const visibleModules = useMemo(() => {
    const schemaModules = buildWorkspaceModules(navigation.modules, enabledModules);
    const schemaModulesByKey = new Map(schemaModules.map((module) => [module.key, module]));

    const mappedModules = SIDEBAR_MODULE_KEYS.map<NavModule | null>((moduleKey) => {
      const frontendModule = findFrontendModuleMap(moduleKey);
      if (!frontendModule) {
        const schemaModule = schemaModulesByKey.get(moduleKey);
        if (!schemaModule) return null;

        return {
          key: schemaModule.key,
          label: schemaModule.label,
          icon: schemaModule.icon || "grid",
          description: schemaModule.description,
          homeHref: schemaModule.homeHref,
          groups: schemaModule.groups
            .map((group) => ({
              label: group.label,
              children: group.items
                .filter((item) => item.path !== ROUTES.DASHBOARD)
                .map((item) => ({ label: item.name, href: item.path, icon: item.icon })),
            }))
            .filter((group) => group.children.length > 0),
        };
      }

      const schemaModule = schemaModulesByKey.get(moduleKey);
      const schemaChildren = new Map(
        (schemaModule ? flattenModuleChildren({
          key: schemaModule.key,
          label: schemaModule.label,
          icon: schemaModule.icon || "grid",
          description: schemaModule.description,
          homeHref: schemaModule.homeHref,
          groups: schemaModule.groups.map((group) => ({
            label: group.label,
            children: group.items.map((item) => ({ label: item.name, href: item.path, icon: item.icon })),
          })),
        }) : []).map((child) => [child.href, child])
      );

      const groups = frontendModule.submodules
        .map((submodule) => ({
          label: submodule.label,
          children: submodule.pages.map((page) => {
            const schemaChild = schemaChildren.get(page.route);
            return {
              label: page.label,
              href: page.route,
              icon: schemaChild?.icon || null,
            };
          }),
        }))
        .filter((group) => group.children.length > 0);

      return {
        key: frontendModule.key,
        label: frontendModule.label,
        icon: getModuleIcon(frontendModule.key, schemaModule?.icon || "grid") || "grid",
        description: schemaModule?.description || frontendModule.purpose || getModuleDescription(frontendModule.key),
        homeHref: frontendModule.homeRoute,
        groups,
      };
    }).filter((module): module is NavModule => Boolean(module));

    const fallbackModules = mappedModules.length > 0
      ? mappedModules
      : FALLBACK_MODULES.filter((module) => SIDEBAR_MODULE_KEYS.includes(module.key as (typeof SIDEBAR_MODULE_KEYS)[number]));

    const extraSchemaModules = schemaModules
      .filter((module) => !SIDEBAR_MODULE_KEYS.includes(module.key as (typeof SIDEBAR_MODULE_KEYS)[number]))
      .filter((module) => !findFrontendModuleMap(module.key))
      .filter((module) => !["company", "settings", "notifications", "workflow"].includes(module.key))
      .map<NavModule>((module) => ({
        key: module.key,
        label: module.label,
        icon: module.icon || "grid",
        description: module.description,
        homeHref: module.homeHref,
        groups: module.groups
          .map((group) => ({
            label: group.label,
            children: group.items
              .filter((item) => item.path !== ROUTES.DASHBOARD)
              .map((item) => ({ label: item.name, href: item.path, icon: item.icon })),
          }))
          .filter((group) => group.children.length > 0),
      }));

    return [...fallbackModules, ...extraSchemaModules]
      .filter((module) => flattenModuleChildren(module).length > 0)
      .filter((module) => (module.key === "administration" ? isSuperAdmin || role !== "employee" : true));
  }, [enabledModules, isSuperAdmin, navigation.modules, role]);

  const activeModule = useMemo(
    () =>
      visibleModules.find(
        (module) =>
          (module.homeHref ? isActivePath(pathname, module.homeHref) : false) ||
          flattenModuleChildren(module).some((child) => isActivePath(pathname, child.href))
      ) || null,
    [pathname, visibleModules]
  );

  useEffect(() => {
    if (activeModule) {
      setExpandedModule(activeModule.key);
    }
  }, [activeModule]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose?.();
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen, onClose]);

  const openModuleHome = (module: NavModule) => {
    const firstPageHref = flattenModuleChildren(module)[0]?.href;
    const targetHref =
      module.key === "dashboard"
        ? ROUTES.DASHBOARD
        : module.homeHref && module.homeHref !== ROUTES.DASHBOARD
          ? module.homeHref
          : firstPageHref;
    if (!targetHref) return;
    router.push(targetHref);
    onClose?.();
  };

  const content = (
    <div className={cn("relative flex h-full flex-col overflow-hidden", portal.sidebarClassName)}>
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

      <div className="flex-1 overflow-y-auto px-2.5 py-2.5">
        <div className="space-y-1.5">
          <Link
            href={ROUTES.DASHBOARD}
            onClick={onClose}
            title="Dashboard"
            className={cn(
              collapsed
                ? "flex items-center justify-center rounded-[1rem] px-1.5 py-1.5 transition"
                : "flex items-center gap-2 rounded-[0.95rem] px-2.5 py-2 transition",
              isActivePath(pathname, ROUTES.DASHBOARD)
                ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-[0_12px_24px_rgba(79,70,229,0.16)]"
                : "bg-white text-slate-600 ring-1 ring-slate-100 hover:bg-slate-50 hover:shadow-sm"
            )}
          >
            <span
              className={cn(
                collapsed
                  ? "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] ring-1"
                  : "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.9rem] ring-1",
                isActivePath(pathname, ROUTES.DASHBOARD)
                  ? "bg-white/14 text-white ring-white/10"
                  : "bg-slate-50 text-slate-500 ring-slate-100"
              )}
            >
              <ModuleIcon name="dashboard" className={collapsed ? "h-4 w-4" : "h-3.5 w-3.5"} />
            </span>
            {!collapsed ? <span className="truncate text-[0.88rem] font-semibold">Dashboard</span> : null}
          </Link>

          {visibleModules.map((module) => {
            const active = module.key === activeModule?.key;
            const expanded = !collapsed && expandedModule === module.key;

            return (
              <section key={module.key} className="space-y-1">
                <div
                  className={cn(
                    collapsed
                      ? "flex items-stretch justify-center rounded-[1rem] p-1.5 transition"
                      : "flex items-stretch gap-1 rounded-[0.95rem] p-1 transition",
                    active
                      ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-[0_12px_24px_rgba(79,70,229,0.16)]"
                      : "bg-white text-slate-600 ring-1 ring-slate-100 hover:bg-slate-50 hover:shadow-sm"
                  )}
                >
                  <button
                    type="button"
                    title={module.label}
                    onClick={() => openModuleHome(module)}
                    className={cn(
                      "rounded-[0.82rem] text-left",
                      collapsed
                        ? "flex h-11 w-11 items-center justify-center px-0 py-0"
                        : "flex min-w-0 flex-1 items-center gap-2 px-1.5 py-1.5"
                    )}
                  >
                    <span
                      className={cn(
                        collapsed
                          ? "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] ring-1"
                          : "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.9rem] ring-1",
                        active ? "bg-white/14 text-white ring-white/10" : "bg-slate-50 text-slate-500 ring-slate-100"
                      )}
                    >
                      <ModuleIcon name={module.icon} className={collapsed ? "h-4 w-4" : "h-3.5 w-3.5"} />
                    </span>
                    {!collapsed ? (
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.87rem] font-semibold">{module.label}</span>
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
                        active ? "text-white/80 hover:bg-white/12 hover:text-white" : "text-slate-400 hover:bg-slate-50 hover:text-indigo-600"
                      )}
                    >
                      <ChevronDown className={cn("h-4 w-4 shrink-0 transition", expanded ? "rotate-180" : "rotate-0")} />
                    </button>
                  ) : null}
                </div>

                {expanded && !collapsed ? (
                  <div className="ml-4 border-l border-slate-100 pl-3">
                    <div className="space-y-2">
                      {module.groups.map((group) => (
                        <section key={`${module.key}-${group.label}`} className="space-y-1">
                          <div className="px-1 pt-1">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
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
                                    "flex items-center gap-2 rounded-[0.85rem] px-2 py-1.5 text-[0.81rem] transition",
                                    childActive ? "bg-indigo-50/70 text-indigo-700 shadow-[0_6px_14px_rgba(79,70,229,0.04)]" : "text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "inline-flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-lg ring-1",
                                      childActive ? "bg-white text-indigo-600 ring-indigo-100" : "bg-white text-slate-400 ring-slate-100"
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
          "hidden shrink-0 border-r border-slate-150 bg-white shadow-[0_16px_34px_rgba(79,70,229,0.03)] lg:sticky lg:top-[var(--erp-topbar-height)] lg:block lg:h-[calc(100dvh-var(--erp-topbar-height))]",
          collapsed ? "w-[4.5rem]" : "w-[15.625rem]",
          portal.sidebarClassName
        )}
      >
        {content}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-x-0 bottom-0 top-[var(--erp-topbar-height)] z-50 bg-slate-950/35 lg:hidden" onClick={onClose} role="presentation">
          <aside
            className="h-full w-[min(90vw,15.625rem)] border-r border-slate-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            aria-label="Workspace navigation"
          >
            {content}
          </aside>
        </div>
      ) : null}
    </>
  );
}
