"use client";

import { Module } from "@/types";
import Link from "next/link";
import { useLayoutEffect, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import ModuleIcon from "@/components/ModuleIcon";
import { ROUTES } from "@/constants/routes";
import { FALLBACK_MODULE_META } from "@/config/fallback-module-registry";

export interface SidebarProps {
  modules: Module[];
  isLoading?: boolean;
  variant?: "admin" | "user" | "superadmin";
  activeModuleKey?: string | null;
  onModuleChange?: (key: string) => void;
  isMobileOpen?: boolean;
  mobileMode?: boolean;
  onCloseMobile?: () => void;
  navQuery?: string;
}

type GroupedSubModules = { label: string; items: NonNullable<Module["subModules"]> };
type SidebarShortcut = { key: string; label: string; href: string; icon: "star" | "clock" | "file" | "users" | "wallet" | "chart" | "grid" | "shield" | "layers" };

const MODULE_ORDER = FALLBACK_MODULE_META.map((module) => module.key);
const SIDEBAR_COLLAPSED_STORAGE_KEY = "erp.sidebar.collapsed";
const RECENT_ITEMS_STORAGE_KEY = "erp.sidebar.recent-items";
const MODULE_META_MAP = new Map<string, (typeof FALLBACK_MODULE_META)[number]>(
  FALLBACK_MODULE_META.map((module) => [module.key, module])
);

function sortModules(list: Module[]): Module[] {
  const rank = new Map<string, number>(MODULE_ORDER.map((k, i) => [k, i]));
  return [...list].sort((a, b) => {
    const explicit = (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER);
    if (explicit !== 0) return explicit;
    return (rank.get(a.key) ?? 99) - (rank.get(b.key) ?? 99);
  });
}

function getDisplayModuleName(module: Module): string {
  const fallbackLabel = MODULE_META_MAP.get(module.key)?.label?.trim();
  if (fallbackLabel) return fallbackLabel;

  const displayName = module.displayName?.trim();
  if (displayName) return displayName;
  if (module.name?.trim()) return module.name;
  return MODULE_META_MAP.get(module.key)?.label || module.key;
}

function getDefaultGroupLabel(moduleKey: string): string {
  switch (moduleKey) {
    case "operations":
      return "Workspace";
    case "hrms":
      return "HRMS";
    case "payroll":
      return "Payroll";
    case "reports":
      return "Analytics & Reports";
    case "platform":
      return "Admin Console";
    case "licensing":
      return "Product";
    case "security":
      return "Security";
    case "erp_finance":
      return "Finance";
    case "erp_procurement":
      return "Procurement";
    case "erp_sales":
      return "Sales & CRM";
    case "erp_inventory":
      return "Inventory";
    default:
      return "Overview";
  }
}

function getModuleDescription(moduleKey: string): string {
  switch (moduleKey) {
    case "operations":
      return "Shared workspace — dashboard, approvals, notifications, and documents.";
    case "hrms":
      return "Core HR, attendance, leave, recruitment, and performance.";
    case "payroll":
      return "Payroll runs, setup, compliance, and statutory reports.";
    case "reports":
      return "Cross-module analytics and reporting for HR, payroll, inventory, and compliance.";
    case "platform":
      return "Tenant management, access control, configuration, and monitoring.";
    case "licensing":
      return "Module catalog, subscriptions, billing, and integrations.";
    case "security":
      return "Sessions, MFA, SSO, devices, and password policies.";
    default:
      return "Business workspace and module tools.";
  }
}

function getDisplayGroupLabel(moduleKey: string, rawLabel?: string): string {
  const label = rawLabel?.trim();
  if (!label || label.toLowerCase() === "general") {
    return getDefaultGroupLabel(moduleKey);
  }

  const normalized = label.toLowerCase();
  if (normalized === "master" || normalized === "masters") return "Master data";
  if (normalized === "setup") return "Configuration";
  if (normalized === "transaction" || normalized === "transactions") return "Transactions";
  if (normalized === "reports") return "Reports";
  if (normalized === "people ops") return "People";
  if (normalized === "talent acquisition") return "Recruitment";
  if (normalized === "learning & development") return "Learning";
  if (normalized === "access control") return "Access control";
  if (normalized === "connect") return "Integrations";
  return label;
}

function getModuleHomeHref(module: Module): string {
  if (module.basePath?.trim()) {
    return module.basePath;
  }

  switch (module.key) {
    case "operations":
      return ROUTES.DASHBOARD;
    case "hrms":
      return ROUTES.HRMS_HOME;
    case "payroll":
      return ROUTES.PAYROLL_HOME;
    case "reports":
      return ROUTES.REPORTS_HOME;
    case "platform":
      return ROUTES.PLATFORM_HOME;
    case "licensing":
      return ROUTES.LICENSING_HOME;
    case "security":
      return ROUTES.SECURITY_HOME;
    default:
      return ROUTES.DASHBOARD;
  }
}

function getResolvedModuleDescription(module: Module): string {
  return module.description?.trim() || MODULE_META_MAP.get(module.key)?.description || getModuleDescription(module.key);
}

function getResolvedModuleHomeHref(module: Module): string {
  return module.basePath?.trim() || MODULE_META_MAP.get(module.key)?.homeHref || getModuleHomeHref(module);
}

function isNavActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href.length > 1 && pathname.startsWith(`${href}/`)) return true;
  return false;
}

export function Sidebar({
  modules,
  isLoading = false,
  variant = "admin",
  activeModuleKey,
  onModuleChange,
  isMobileOpen = false,
  mobileMode = false,
  onCloseMobile,
  navQuery = "",
}: SidebarProps) {
  const pathname = usePathname();
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHoverExpanded, setIsHoverExpanded] = useState(false);
  const [recentItems, setRecentItems] = useState<SidebarShortcut[]>([]);

  const isCompact = !mobileMode && isCollapsed && !isHoverExpanded;
  const sidebarPanelClass = [
    "erp-shell-sidebar erp-shell-sidebar-panel flex h-full shrink-0 flex-col bg-white border-r border-slate-200",
    mobileMode
      ? "erp-shell-sidebar-mobile"
      : isCompact
      ? "erp-shell-sidebar-collapsed"
      : "erp-shell-sidebar-expanded",
  ]
    .filter(Boolean)
    .join(" ");

  const pinnedShortcuts = useMemo<SidebarShortcut[]>(() => {
    const common: SidebarShortcut[] = [
      { key: "pin-dashboard", label: "Dashboard", href: ROUTES.DASHBOARD, icon: "grid" },
      { key: "pin-reports", label: "Analytics & Reports", href: ROUTES.REPORTS_HOME, icon: "chart" },
    ];

    if (variant === "user") {
      return [
        ...common,
        { key: "pin-employees", label: "Employees", href: ROUTES.EMPLOYEES, icon: "users" },
      ];
    }

    if (variant === "superadmin") {
      return [
        ...common,
        { key: "pin-superadmin", label: "SuperAdmin Console", href: ROUTES.SUPERADMIN_DASHBOARD, icon: "grid" },
        { key: "pin-tenants", label: "Tenant Management", href: ROUTES.PLATFORM_TENANTS, icon: "users" },
        { key: "pin-security", label: "Security", href: ROUTES.SECURITY_HOME, icon: "shield" },
        { key: "pin-licensing", label: "Licensing", href: ROUTES.LICENSING_HOME, icon: "layers" },
      ];
    }

    return [
      ...common,
      { key: "pin-customers", label: "Customers", href: ROUTES.CUSTOMERS, icon: "file" },
      { key: "pin-payroll", label: "Payroll Runs", href: ROUTES.PAYROLL_RUNS, icon: "wallet" },
    ];
  }, [variant]);

  const getCompactModuleClass = (isActive: boolean) =>
    isActive
      ? "erp-shell-sidebar-compact-link erp-shell-sidebar-compact-link-active"
      : "erp-shell-sidebar-compact-link";
  const getSubmoduleLinkClass = (isActive: boolean) =>
    isActive
      ? "erp-shell-sidebar-subitem erp-shell-sidebar-subitem-active"
      : "erp-shell-sidebar-subitem";
  const getIconSlotClass = (isActive: boolean) =>
    isActive ? "erp-shell-sidebar-icon-slot erp-shell-sidebar-icon-slot-active" : "erp-shell-sidebar-icon-slot";

  const handleModuleNavigate = (moduleKey: string) => {
    onModuleChange?.(moduleKey);
    if (mobileMode) {
      onCloseMobile?.();
    }
  };

  useLayoutEffect(() => {
    if (mobileMode) return;
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
    setIsCollapsed(stored === "1");
  }, [mobileMode]);

  useEffect(() => {
    if (mobileMode) return;
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, isCollapsed ? "1" : "0");
  }, [isCollapsed, mobileMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(RECENT_ITEMS_STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as SidebarShortcut[];
      if (Array.isArray(parsed)) {
        setRecentItems(parsed.slice(0, 5));
      }
    } catch {
      setRecentItems([]);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!pathname.startsWith("/erp") && !pathname.startsWith("/platform")) return;

    const segment = pathname.split("/").filter(Boolean).pop() || "dashboard";
    const label = segment
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

    const nextItem: SidebarShortcut = {
      key: `recent-${pathname}`,
      label,
      href: pathname,
      icon: "clock",
    };

    setRecentItems((prev) => {
      const deduped = [nextItem, ...prev.filter((item) => item.href !== pathname)].slice(0, 5);
      window.localStorage.setItem(RECENT_ITEMS_STORAGE_KEY, JSON.stringify(deduped));
      return deduped;
    });
  }, [pathname]);

  const businessModulesAll = useMemo(() => {
    return sortModules(modules);
  }, [modules]);

  const isSearching = navQuery.trim().length > 0;

  const filteredModules = useMemo(() => {
    const q = navQuery.trim().toLowerCase();
    if (!q) return businessModulesAll;
    return businessModulesAll.filter((m) => {
      const name = getDisplayModuleName(m).toLowerCase();
      if (name.includes(q)) return true;
      const desc = getResolvedModuleDescription(m).toLowerCase();
      if (desc.includes(q)) return true;
      const subMods = m.subModules || [];
      return subMods.some((sub) => sub.name.toLowerCase().includes(q) || (sub.group ?? "").toLowerCase().includes(q));
    });
  }, [businessModulesAll, navQuery]);

  const shouldShowDashboardLink = false;

  const getRenderableSubModules = useMemo(
    () => (moduleEntry: Module) => {
      const subModules = moduleEntry.subModules || [];
      const homeHref = getResolvedModuleHomeHref(moduleEntry);
      return subModules.filter((sub) => sub.path !== homeHref);
    },
    []
  );

  useEffect(() => {
    if (mobileMode) {
      onCloseMobile?.();
    }
  }, [pathname, mobileMode, onCloseMobile]);

  const isDashboardActive = isNavActive(pathname, ROUTES.DASHBOARD);

  const activeModuleKeyFromPath = useMemo(() => {
    for (const moduleEntry of businessModulesAll) {
      const subModules = getRenderableSubModules(moduleEntry);
      if (subModules.some((sub) => isNavActive(pathname, sub.path))) {
        return moduleEntry.key;
      }

      const homeHref = getResolvedModuleHomeHref(moduleEntry);
      if (moduleEntry.key !== "operations" && isNavActive(pathname, homeHref)) {
        return moduleEntry.key;
      }
    }

    return null;
  }, [businessModulesAll, getRenderableSubModules, pathname]);

  const selectedModuleKey = isDashboardActive ? null : activeModuleKey ?? activeModuleKeyFromPath;

  // NOTE: no auto-expand on selectedModuleKey — accordion is purely manual (click to open/close).

  const getModuleGlyph = (moduleKey: string) => {
    const sizeClass = "h-4 w-4";
    switch (moduleKey) {
      case "dashboard":
        return (
          <svg className={sizeClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 13h7V4H4v9zm9 7h7v-7h-7v7zM4 20h7v-3H4v3zm9-9h7V4h-7v7z" />
          </svg>
        );
      case "operations":
        return (
          <svg className={sizeClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16v14H4z" />
            <path strokeLinecap="round" d="M9 5v14M4 12h16" />
          </svg>
        );
      case "hrms":
        return (
          <svg className={sizeClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
          </svg>
        );
      case "payroll":
        return (
          <svg className={sizeClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <path strokeLinecap="round" d="M6 10h4M6 14h8" />
          </svg>
        );
      case "reports":
        return (
          <svg className={sizeClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 19h16M7 16V9m5 7V5m5 11v-6" />
          </svg>
        );
      case "platform":
        return (
          <svg className={sizeClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        );
      case "licensing":
        return (
          <svg className={sizeClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 12l8-4.5M12 12v9M12 12L4 7.5" />
          </svg>
        );
      case "security":
        return (
          <svg className={sizeClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        );
      default:
        return (
          <svg className={sizeClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
            <rect x="4" y="4" width="16" height="16" rx="2" />
          </svg>
        );
    }
  };

  const renderModuleGlyph = (module: Module) => {
    if (module.icon) {
      return <ModuleIcon name={module.icon} className="h-5 w-5" />;
    }

    return getModuleGlyph(module.key);
  };

  const getShortcutIcon = (type: SidebarShortcut["icon"]) => {
    switch (type) {
      case "star":
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.05 2.93c.3-.92 1.6-.92 1.9 0l1.95 6.02a1 1 0 00.95.69h6.33c.97 0 1.37 1.24.59 1.81l-5.12 3.72a1 1 0 00-.36 1.12l1.95 6.01c.3.92-.76 1.69-1.54 1.12l-5.12-3.72a1 1 0 00-1.18 0l-5.12 3.72c-.78.57-1.84-.2-1.54-1.12l1.95-6.01a1 1 0 00-.36-1.12L.28 11.45c-.78-.57-.38-1.81.59-1.81H7.2a1 1 0 00.95-.69l1.95-6.02z" />;
      case "users":
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 19v-1a4 4 0 00-4-4H5a4 4 0 00-4 4v1m20 0v-1a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M12 7a4 4 0 11-8 0 4 4 0 018 0z" />;
      case "wallet":
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 7a2 2 0 012-2h16a1 1 0 011 1v12a2 2 0 01-2 2H4a2 2 0 01-2-2V7zm14 5h5" />;
      case "chart":
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19h16M8 17V9m4 8V5m4 12v-6" />;
      case "grid":
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 7h7v-7h-7v7z" />;
      case "file":
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6" />;
      case "clock":
      default:
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />;
    }
  };

  const renderShortcutSection = (title: string, shortcuts: SidebarShortcut[], iconType: "star" | "clock") => {
    if (shortcuts.length === 0) return null;

    if (isCompact) {
      return (
        <div className="space-y-1.5">
          {shortcuts.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <div key={item.key} className="flex justify-center py-1">
                <Link href={item.href} title={item.label} className={getCompactModuleClass(active)}>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    {getShortcutIcon(item.icon)}
                  </svg>
                </Link>
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <section className="space-y-1.5">
        <p className="erp-shell-sidebar-group-label px-2">
          <span className="mr-1.5 inline-flex h-4 w-4 items-center justify-center text-slate-500">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              {getShortcutIcon(iconType)}
            </svg>
          </span>
          {title}
        </p>
        <div className="space-y-1">
          {shortcuts.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <Link key={item.key} href={item.href} className={getSubmoduleLinkClass(active)}>
                <span className={getIconSlotClass(active)}>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    {getShortcutIcon(item.icon)}
                  </svg>
                </span>
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </section>
    );
  };

  const toggleModule = (moduleKey: string) => {
    setExpandedKeys((prev) => {
      // Accordion: if already open close it; otherwise open only this one
      if (prev.has(moduleKey)) {
        return new Set<string>();
      }
      return new Set<string>([moduleKey]);
    });
  };

  const renderDashboardLink = () => {
    if (!shouldShowDashboardLink) return null;

    if (isCompact) {
      return (
        <div key="dashboard-quick-link" className="flex justify-center py-1">
          <Link
            href={ROUTES.DASHBOARD}
            title="Dashboard"
            onClick={() => handleModuleNavigate("operations")}
            className={getCompactModuleClass(isDashboardActive)}
          >
            {getModuleGlyph("dashboard")}
          </Link>
        </div>
      );
    }

    return (
      <div key="dashboard-quick-link">
        <Link
          href={ROUTES.DASHBOARD}
          onClick={() => handleModuleNavigate("operations")}
          className={`block rounded-xl border px-2.5 py-2 transition ${
            isDashboardActive
              ? "border-sky-200 bg-sky-50 text-sky-800 shadow-sm"
              : "border-transparent bg-white text-slate-700 hover:border-slate-200 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-start gap-2.5">
            <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${isDashboardActive ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-600"}`}>
              {getModuleGlyph("dashboard")}
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block text-[13px] font-semibold ${isDashboardActive ? "text-sky-800" : "text-slate-800"}`}>
                Dashboard
              </span>
            </span>
          </div>
        </Link>
      </div>
    );
  };

  const renderModule = (module: Module) => {
    const homeHref = getResolvedModuleHomeHref(module);
    const subModules = getRenderableSubModules(module);
    const hasSubModules = subModules.length > 0;
    const hasActiveSubModule = subModules.some((sub) => isNavActive(pathname, sub.path));
    const homeActive = module.key !== "operations" && isNavActive(pathname, homeHref);
    const isSelected = selectedModuleKey === module.key || hasActiveSubModule || homeActive;
    const isExpanded = isSearching || expandedKeys.has(module.key);
    const hasExplicitGroups = subModules.some((sub) => Boolean(sub.group));

    const groupedSubModules: GroupedSubModules[] = hasExplicitGroups
      ? subModules.reduce((acc: GroupedSubModules[], sub) => {
          const label = getDisplayGroupLabel(module.key, sub.group);
          const existing = acc.find((group) => group.label === label);
          if (existing) existing.items.push(sub);
          else acc.push({ label, items: [sub] });
          return acc;
        }, [])
      : [{ label: "", items: subModules }];

    const visibleGroups = groupedSubModules.filter((g) => g.items.length > 0);
    const showGroupLabels = hasExplicitGroups && visibleGroups.length > 0;

    if (isCompact) {
      const collapsedActive = isSelected;
      return (
        <div key={module.key} className="flex justify-center py-1">
          <Link
            href={homeHref}
            title={getDisplayModuleName(module)}
            onClick={() => handleModuleNavigate(module.key)}
            className={getCompactModuleClass(collapsedActive)}
          >
            {renderModuleGlyph(module)}
          </Link>
        </div>
      );
    }

    return (
      <div key={module.key}>
        {hasSubModules ? (
          <div className={`rounded-xl border ${isSelected ? "border-sky-200 bg-sky-50/70" : "border-slate-200 bg-white"}`}>
            <button
              type="button"
              onClick={() => toggleModule(module.key)}
              className="flex w-full items-start gap-2.5 px-2.5 py-2 text-left"
              aria-expanded={isExpanded}
            >
              <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${isSelected ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-600"}`}>
                {renderModuleGlyph(module)}
              </span>

              <span className="min-w-0 flex-1">
                <span className={`truncate text-[13px] font-semibold ${isSelected ? "text-sky-800" : "text-slate-800"}`}>
                  {getDisplayModuleName(module)}
                </span>
              </span>

              <span className={`mt-0.5 shrink-0 text-[10px] transition-transform ${isExpanded ? "rotate-180 text-sky-700" : "text-slate-400"}`}>
                ▼
              </span>
            </button>

            {isExpanded && visibleGroups.length > 0 && (
              <div className="border-t border-slate-200/80 px-3 pb-3 pt-2">
                <div className="space-y-3 border-l border-slate-200 pl-3">
                  {visibleGroups.map((group) => (
                    <div key={`${module.key}-${group.label || "all"}`}>
                      {showGroupLabels && group.label ? (
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">{group.label}</p>
                      ) : null}
                      <div className="space-y-1">
                        {group.items.map((sub) => {
                          const active = isNavActive(pathname, sub.path);
                          return (
                            <Link
                              key={sub.key}
                              href={sub.path}
                              onClick={() => handleModuleNavigate(module.key)}
                              className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition ${
                                active
                                  ? "bg-white text-sky-800 shadow-sm ring-1 ring-sky-100"
                                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                              }`}
                            >
                              <span className={`inline-flex h-5 w-5 items-center justify-center rounded-md ${
                                active ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500"
                              }`}>
                                {sub.icon ? <ModuleIcon name={String(sub.icon)} className="h-3 w-3" /> : <span className="block h-3 w-3" />}
                              </span>
                              <span className="min-w-0 flex-1 truncate">{sub.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link
            href={homeHref}
            onClick={() => handleModuleNavigate(module.key)}
            className={`block rounded-xl border px-2.5 py-2 transition ${
              isSelected
                ? "border-sky-200 bg-sky-50 text-sky-800 shadow-sm"
                : "border-transparent bg-white text-slate-700 hover:border-slate-200 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-start gap-2.5">
              <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${isSelected ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-600"}`}>
                {renderModuleGlyph(module)}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-[13px] font-semibold ${isSelected ? "text-sky-800" : "text-slate-800"}`}>
                  {getDisplayModuleName(module)}
                </span>
              </span>
            </div>
          </Link>
        )}
      </div>
    );
  };

  if (isLoading) {
    if (mobileMode && !isMobileOpen) return null;

    const loadingAside = (
      <aside
        className={sidebarPanelClass}
      >
        <div className="erp-shell-sidebar-header flex h-10 items-center px-3">
          <div className="h-6 flex-1 animate-pulse rounded-lg bg-slate-200/70" />
        </div>
        <div className="space-y-1.5 p-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-7 animate-pulse rounded-lg bg-slate-200/70" />
          ))}
        </div>
      </aside>
    );

    if (mobileMode) {
      return (
        <div className="erp-drawer-overlay lg:hidden" onClick={onCloseMobile}>
          <div className="erp-drawer-panel erp-drawer-panel-left erp-shell-sidebar" onClick={(e) => e.stopPropagation()}>
            {loadingAside.props.children}
          </div>
        </div>
      );
    }

    return (
      <aside className={sidebarPanelClass}>
        <div className="flex h-10 items-center border-b border-slate-200/80 px-3">
          <div className="h-6 flex-1 animate-pulse rounded-lg bg-slate-200/70" />
        </div>
        <div className="space-y-1.5 p-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-7 animate-pulse rounded-lg bg-slate-200/70" />
          ))}
        </div>
      </aside>
    );
  }

  if (mobileMode && !isMobileOpen) return null;

  const sidebarBody = (
    <>
      <div className="erp-shell-sidebar-header flex h-10 items-center justify-between gap-2 px-3">
        {!isCompact ? (
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-900">Navigation</p>
          </div>
        ) : (
          <div />
        )}

        {mobileMode ? (
          <button
            type="button"
            onClick={onCloseMobile}
            className="erp-shell-sidebar-toggle"
            title="Close navigation"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsCollapsed((p) => !p)}
            className="erp-shell-sidebar-toggle"
            title={isCompact ? "Expand" : "Collapse"}
          >
            <svg className={`h-4 w-4 ${isCompact ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
      </div>

      <nav className={`flex-1 overflow-y-auto py-2 ${isCompact ? "px-1.5" : "px-2"}`}>
        {businessModulesAll.length === 0 ? (
          !isCompact && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              No modules available. Contact your administrator for access.
            </div>
          )
        ) : filteredModules.length === 0 ? (
          !isCompact && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              No modules match your search.
            </div>
          )
        ) : (
          <div className={isCompact ? "flex flex-col gap-1" : "space-y-1.5"}>
            {false && renderShortcutSection("Favorites / Pinned", pinnedShortcuts, "star")}
            {false && renderShortcutSection("Recent Items", recentItems, "clock")}
            {renderDashboardLink()}
            {filteredModules.map((m) => renderModule(m))}
          </div>
        )}
      </nav>
    </>
  );

  if (mobileMode) {
    return (
      <div className="erp-drawer-overlay lg:hidden" onClick={onCloseMobile}>
        <div className="erp-drawer-panel erp-drawer-panel-left erp-shell-sidebar" onClick={(e) => e.stopPropagation()}>
          {sidebarBody}
        </div>
      </div>
    );
  }

  return (
    <aside
      className={sidebarPanelClass}
      onMouseEnter={() => {
        if (!mobileMode && isCollapsed) {
          setIsHoverExpanded(true);
        }
      }}
      onMouseLeave={() => setIsHoverExpanded(false)}
    >
      {sidebarBody}
    </aside>
  );
}

export default Sidebar;
