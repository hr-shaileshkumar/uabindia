"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
  LayoutDashboard,
  LifeBuoy,
  X,
  Building2,
  Bell,
  CheckSquare,
  FileText,
  Star,
  Users,
  Wallet,
  Briefcase,
  TrendingUp,
  Package,
  ShoppingCart,
  Landmark,
  BarChart3,
  ShieldCheck,
  Search,
  Database,
  GitBranch,
  Webhook,
  History,
  Activity,
  Globe,
  Folder,
  UserCheck,
  UserPlus,
  Clock,
  Award,
  PlayCircle,
  Shield,
  Truck,
  ShoppingBag,
  Box,
  ArrowRightLeft,
  Sliders,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { useNavigationStore } from "@/store/navigationStore";
import { useUiSchema } from "@/context/UiSchemaContext";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionContext";
import { useOrgContext } from "@/context/OrgContext";
import {
  buildWorkspaceModules,
  groupWorkspaceModulesForSidebar,
  type WorkspaceNavGroup,
  type WorkspaceNavItem,
  type WorkspaceModule,
} from "@/lib/workspace/navigation";
import ModuleIcon from "@/components/ModuleIcon";
import { getEffectiveWorkspacePath } from "@/lib/workspace/url-lock";

const GROUP_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  // Administration Pillars
  "Organization Hierarchy": Building2,
  "Tenant & Organization Hierarchy": Building2,
  "Identity & Access": ShieldCheck,
  "Identity, Access & Governance (IAM)": ShieldCheck,
  "Modules & Apps": Package,
  "Module & App Engine": Package,
  "Metadata & Studio": Database,
  "Master Data & Metadata Engine": Database,
  "Workflows & Approvals": GitBranch,
  "Workflow & Approval State Machine": GitBranch,
  "Communications": Bell,
  "Communication & Notification Hub": Bell,
  "API & Integrations": Webhook,
  "API Gateway, Webhooks & Integrations": Webhook,
  "Audit & Compliance": History,
  "Security, Compliance & Audit Vault": History,
  "System Operations": Activity,
  "System Operations & Telemetry": Activity,
  "Website & CMS": Globe,
  "Digital Presence & CMS Websites": Globe,
  // ERP & HRMS Groups
  "Self-Service": UserCheck,
  "Core HR": Users,
  "Employee Lifecycle": UserPlus,
  "Attendance & Time": Clock,
  "Talent Acquisition": Search,
  "Learning & Development": Award,
  "HR Operations": Wallet,
  "Processing": PlayCircle,
  "Setup": Sliders,
  "Compliance": Shield,
  "Overview": LayoutDashboard,
  "Accounting": Landmark,
  "Treasury": Wallet,
  "Sourcing": Truck,
  "Demand": ShoppingCart,
  "Ordering": ShoppingCart,
  "Receiving": Box,
  "Payables": Landmark,
  "CRM & Sales": ShoppingBag,
  "Pipeline": TrendingUp,
  "Pricing": Sliders,
  "Accounts": Users,
  "Delivery": Briefcase,
  "Stock Control": Box,
  "Movements": ArrowRightLeft,
  "Messaging": Bell,
  "Connectivity": Webhook,
  "Product": Package,
  "Billing": Wallet,
  "Connect": Webhook,
  "Authentication": ShieldCheck,
  "Devices": Activity,
  "Sessions": Activity,
  "Service": LifeBuoy,
};

function SidebarTooltip({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 dark:border-slate-700">
      {label}
    </span>
  );
}

function isPathActive(pathname: string, href?: string | null) {
  if (!href) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SectionLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) {
    return <li className="mx-3 my-2 border-t border-slate-100 dark:border-slate-800" aria-hidden="true" />;
  }

  return (
    <li className="list-none px-3 pb-1 pt-3">
      <p className="select-none text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
        {label}
      </p>
    </li>
  );
}

function SidebarNavGroupItem({
  group,
  modHasMultipleGroups,
  pathname,
  onNavigate,
  favorites,
  addFavorite,
  removeFavorite,
  forceExpandAll,
}: {
  group: WorkspaceNavGroup;
  modHasMultipleGroups: boolean;
  pathname: string;
  onNavigate?: () => void;
  favorites: Array<{ id: string; href?: string }>;
  addFavorite: (item: { id: string; label: string; href: string; icon?: string }) => void;
  removeFavorite: (id: string) => void;
  forceExpandAll?: boolean;
}) {
  const isGroupActive = group.items.some((item: WorkspaceNavItem) => isPathActive(pathname, item.path));
  const [groupOpen, setGroupOpen] = useState(isGroupActive);

  useEffect(() => {
    if (isGroupActive || forceExpandAll) {
      setGroupOpen(true);
    }
  }, [isGroupActive, forceExpandAll]);

  const GroupIconComponent = GROUP_ICON_MAP[group.label] || Folder;

  return (
    <div className="ml-3 mt-0.5 border-l border-slate-200/80 dark:border-slate-800 pl-2">
      {modHasMultipleGroups ? (
        <button
          type="button"
          onClick={() => setGroupOpen((prev: boolean) => !prev)}
          className={cn(
            "flex w-full items-center gap-1.5 py-1.5 px-2 text-left group/grp rounded-md transition-colors",
            isGroupActive
              ? "bg-slate-100/90 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-semibold"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-850"
          )}
        >
          <GroupIconComponent
            className={cn(
              "h-3.5 w-3.5 shrink-0 transition-colors",
              isGroupActive
                ? "text-blue-600 dark:text-blue-400"
                : "text-slate-400 group-hover/grp:text-slate-600 dark:group-hover/grp:text-slate-300"
            )}
          />
          <span className="text-[11.5px] font-medium leading-none tracking-normal truncate">
            {group.label}
          </span>
          <ChevronRight
            className={cn(
              "ml-auto h-3 w-3 shrink-0 text-slate-400 transition-transform duration-200",
              groupOpen && "rotate-90 text-slate-600 dark:text-slate-300"
            )}
          />
        </button>
      ) : null}

      <AnimatePresence initial={false}>
        {(!modHasMultipleGroups || groupOpen) && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.16, ease: "easeInOut" }}
            className="space-y-0.5 py-0.5 overflow-hidden"
          >
            {group.items.map((item: WorkspaceNavItem) => {
              const isItemActive = isPathActive(pathname, item.path);
              const isPinned = favorites.some((f) => f.id === item.key || f.href === item.path);

              return (
                <li key={item.key} className="group/item relative flex items-center">
                  <Link
                    href={item.path}
                    prefetch={true}
                    onClick={onNavigate}
                    className={cn(
                      "flex flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] transition-all pr-6",
                      isItemActive
                        ? "bg-blue-50/90 font-semibold text-blue-700 shadow-xs dark:bg-blue-950/50 dark:text-blue-300 ring-1 ring-blue-200/60 dark:ring-blue-800/40"
                        : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-100",
                    )}
                  >
                    {item.icon ? (
                      <ModuleIcon
                        name={item.icon}
                        className={cn(
                          "h-3.5 w-3.5 shrink-0 transition-colors",
                          isItemActive
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-slate-400 group-hover/item:text-slate-700 dark:text-slate-500"
                        )}
                      />
                    ) : (
                      <span
                        className={cn(
                          "h-1.5 w-1.5 shrink-0 rounded-full transition-colors",
                          isItemActive ? "bg-blue-600 ring-2 ring-blue-200" : "bg-slate-300 dark:bg-slate-600",
                        )}
                      />
                    )}
                    <span className="truncate leading-tight">{item.name}</span>
                  </Link>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (isPinned) {
                        removeFavorite(item.key);
                      } else {
                        addFavorite({ id: item.key, label: item.name, href: item.path, icon: item.icon ?? undefined });
                      }
                    }}
                    className={cn(
                      "absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded transition-all",
                      isPinned ? "text-amber-500 opacity-100" : "text-slate-300 opacity-0 group-hover/item:opacity-100 hover:text-amber-500"
                    )}
                    title={isPinned ? "Unpin from favorites" : "Pin to sidebar"}
                  >
                    <Star className={cn("h-3 w-3", isPinned && "fill-amber-400 text-amber-500")} />
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarNavItem({
  mod,
  isCollapsed,
  pathname,
  onNavigate,
  forceExpand,
}: {
  mod: WorkspaceModule;
  isCollapsed: boolean;
  pathname: string;
  onNavigate?: () => void;
  forceExpand?: boolean;
}) {
  const favorites = useNavigationStore((state) => state.favorites);
  const addFavorite = useNavigationStore((state) => state.addFavorite);
  const removeFavorite = useNavigationStore((state) => state.removeFavorite);
  const hasChildren = mod.groups.some((group) => group.items.length > 0);
  const isModActive =
    isPathActive(pathname, mod.homeHref) ||
    mod.groups.some((group) => group.items.some((item) => isPathActive(pathname, item.path)));
  const [expanded, setExpanded] = useState(isModActive || Boolean(forceExpand));

  useEffect(() => {
    if ((isModActive && hasChildren) || forceExpand) setExpanded(true);
  }, [isModActive, hasChildren, forceExpand]);

  const rowClass = cn(
    "group relative flex w-full items-center gap-x-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all",
    isModActive
      ? "bg-blue-50/80 font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200",
    isCollapsed && "justify-center px-0 py-2",
  );

  const displayLabel =
    mod.key === "platform" || mod.key === "administration"
      ? "Administration"
      : mod.label;

  const iconWrap = (
    <span
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
        isModActive
          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300"
          : "text-slate-500 group-hover:text-slate-800 dark:text-slate-400 dark:group-hover:text-slate-200",
      )}
    >
      <ModuleIcon name={mod.icon as string} className="h-4 w-4 shrink-0" />
    </span>
  );

  if (!hasChildren) {
    return (
      <li className="list-none">
        <Link href={mod.homeHref || ROUTES.DASHBOARD} prefetch={true} onClick={onNavigate} className={rowClass}>
          {isModActive ? (
            <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-blue-600" />
          ) : null}
          {iconWrap}
          {!isCollapsed ? <span className="min-w-0 flex-1 truncate">{displayLabel}</span> : null}
          {isCollapsed ? <SidebarTooltip label={displayLabel} /> : null}
        </Link>
      </li>
    );
  }

  if (isCollapsed) {
    return (
      <li className="list-none">
        <Link href={mod.homeHref || ROUTES.DASHBOARD} prefetch={true} onClick={onNavigate} className={rowClass} title={displayLabel}>
          {isModActive ? (
            <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-blue-600" />
          ) : null}
          {iconWrap}
          <SidebarTooltip label={displayLabel} />
        </Link>
      </li>
    );
  }

  return (
    <li className="list-none">
      <div className="relative flex items-center">
        <Link href={mod.homeHref || ROUTES.DASHBOARD} prefetch={true} onClick={onNavigate} className={cn(rowClass, "pr-8")}>
          {isModActive && !expanded ? (
            <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-blue-600" />
          ) : null}
          {iconWrap}
          <span className="min-w-0 flex-1 truncate text-left font-medium">{displayLabel}</span>
          {mod.pageCount > 1 ? (
            <span className="mr-1 rounded-full bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 text-[9.5px] font-semibold text-slate-400 dark:text-slate-500">
              {mod.pageCount}
            </span>
          ) : null}
        </Link>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-slate-800"
          aria-label={expanded ? `Collapse ${displayLabel}` : `Expand ${displayLabel}`}
          aria-expanded={expanded}
        >
          <motion.span animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.15 }}>
            <ChevronRight className="h-3.5 w-3.5" />
          </motion.span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {mod.groups.map((group) => (
              <SidebarNavGroupItem
                key={group.label}
                group={group}
                modHasMultipleGroups={mod.groups.length > 1}
                pathname={pathname}
                onNavigate={onNavigate}
                favorites={favorites}
                addFavorite={addFavorite}
                removeFavorite={removeFavorite}
                forceExpandAll={forceExpand}
              />
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </li>
  );
}

type SidebarProps = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const rawPathname = usePathname() || "";
  const pathname = getEffectiveWorkspacePath(rawPathname);
  const isCollapsed = useNavigationStore((state) => state.isSidebarCollapsed);
  const favorites = useNavigationStore((state) => state.favorites);
  const removeFavorite = useNavigationStore((state) => state.removeFavorite);
  const { user } = useAuth();
  const { hasPermission, isSuperAdmin } = usePermissions();
  const { companyId, projectId } = useOrgContext();
  const { navigation: schemaNav, enabledModules } = useUiSchema();

  const accessContext = useMemo(
    () => ({
      userRole: (user?.role as string) || user?.roles?.[0] || null,
      hasPermission: (keys: string | string[]) => {
        const keyArray = Array.isArray(keys) ? keys : [keys];
        return hasPermission(keyArray);
      },
      companyId: companyId || null,
      projectId: projectId || null,
      isSuperAdmin,
    }),
    [user?.role, user?.roles, hasPermission, companyId, projectId, isSuperAdmin]
  );

  const dynamicModules = buildWorkspaceModules(schemaNav.modules, enabledModules, accessContext);
  const sections = groupWorkspaceModulesForSidebar(dynamicModules);
  const [searchQuery, setSearchQuery] = useState("");
  const dashboardActive = isPathActive(pathname, ROUTES.DASHBOARD);
  const [dashboardExpanded, setDashboardExpanded] = useState(true);

  const filteredSections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return sections;

    return sections
      .map((section) => {
        const filteredModules = section.modules
          .map((mod) => {
            const modMatches = mod.label.toLowerCase().includes(query);
            const filteredGroups = mod.groups
              .map((grp) => {
                const grpMatches = grp.label.toLowerCase().includes(query);
                const filteredItems = grp.items.filter(
                  (item) =>
                    modMatches ||
                    grpMatches ||
                    item.name.toLowerCase().includes(query) ||
                    item.path.toLowerCase().includes(query)
                );
                return { ...grp, items: filteredItems };
              })
              .filter((grp) => grp.items.length > 0);

            if (filteredGroups.length === 0 && !modMatches) {
              return null;
            }

            return {
              ...mod,
              groups: filteredGroups.length > 0 ? filteredGroups : mod.groups,
            };
          })
          .filter((mod): mod is WorkspaceModule => Boolean(mod));

        return {
          ...section,
          modules: filteredModules,
        };
      })
      .filter((section) => section.modules.length > 0);
  }, [sections, searchQuery]);

  useEffect(() => {
    onMobileClose?.();
  }, [pathname]);

  const dashboardLabel = "Dashboard";

  const moduleDashboardItems = useMemo(() => [
    {
      key: "overview",
      label: isSuperAdmin ? "Super Admin Hub" : "Executive Overview",
      href: ROUTES.DASHBOARD,
      icon: LayoutDashboard,
      badge: "Main",
    },
    {
      key: "hrms",
      label: "HRMS Dashboard",
      href: ROUTES.HRMS_HOME,
      icon: Users,
    },
    {
      key: "payroll",
      label: "Payroll Dashboard",
      href: ROUTES.PAYROLL_HOME,
      icon: Wallet,
    },
    {
      key: "crm",
      label: "CRM Dashboard",
      href: ROUTES.CRM_HOME,
      icon: Briefcase,
    },
    {
      key: "sales",
      label: "Sales Dashboard",
      href: ROUTES.SALES_HOME,
      icon: TrendingUp,
    },
    {
      key: "inventory",
      label: "Inventory Dashboard",
      href: ROUTES.INVENTORY_HOME,
      icon: Package,
    },
    {
      key: "procurement",
      label: "Procurement Dashboard",
      href: ROUTES.PROCUREMENT_HOME,
      icon: ShoppingCart,
    },
    {
      key: "finance",
      label: "Finance Dashboard",
      href: ROUTES.FINANCE_HOME,
      icon: Landmark,
    },
    {
      key: "reports",
      label: "Reports & Analytics",
      href: ROUTES.REPORTS_HOME,
      icon: BarChart3,
    },
    ...(isSuperAdmin ? [{
      key: "administration",
      label: "Platform Operations",
      href: ROUTES.ADMINISTRATION_HOME,
      icon: ShieldCheck,
    }] : []),
  ], [isSuperAdmin]);

  const renderNav = (collapsed: boolean) => (
    <div className={cn("flex flex-1 flex-col min-h-0", collapsed ? "pt-2" : "pt-2")}>

      {/* Nav list */}
      <nav className="flex flex-1 flex-col overflow-y-auto px-2.5 py-2 scrollbar-thin">
        {/* Quick Search & Navigation Filter */}
        {!collapsed && (
          <div className="mb-2 px-0.5">
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter pages & modules..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-1.5 pl-8 pr-7 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none transition dark:border-slate-800 dark:bg-slate-850 dark:text-slate-200"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                  title="Clear search"
                >
                  <X className="h-3 w-3" />
                </button>
              ) : null}
            </div>
          </div>
        )}

        <ul role="list" className="flex flex-col gap-y-0.5">
          {!searchQuery && (
            <li className="list-none">
              <div className="relative flex items-center">
                <Link
                  href={ROUTES.DASHBOARD}
                  onClick={onMobileClose}
                  className={cn(
                    "group relative flex flex-1 items-center gap-x-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all",
                    dashboardActive && !dashboardExpanded
                      ? "bg-blue-50/80 font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-slate-200",
                    collapsed && "justify-center px-0 py-2",
                    !collapsed && "pr-8",
                  )}
                >
                  {dashboardActive ? (
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-blue-600" />
                  ) : null}
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                      dashboardActive
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300"
                        : "text-slate-500 group-hover:text-slate-800 dark:text-slate-400",
                    )}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                  </span>
                  {!collapsed ? <span className="truncate font-semibold">{dashboardLabel}</span> : <SidebarTooltip label={dashboardLabel} />}
                </Link>
                {!collapsed ? (
                  <button
                    type="button"
                    onClick={() => setDashboardExpanded((prev) => !prev)}
                    className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-slate-800"
                    aria-label={dashboardExpanded ? "Collapse Module Dashboards" : "Expand Module Dashboards"}
                    aria-expanded={dashboardExpanded}
                  >
                    <motion.span animate={{ rotate: dashboardExpanded ? 90 : 0 }} transition={{ duration: 0.15 }}>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </motion.span>
                  </button>
                ) : null}
              </div>

              {/* Nested Module Dashboards List */}
              {!collapsed ? (
                <AnimatePresence initial={false}>
                  {dashboardExpanded ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="ml-5 mt-0.5 border-l-2 border-slate-100 dark:border-slate-800 pl-2.5">
                        <ul className="space-y-0.5 py-1">
                          {moduleDashboardItems.map((item) => {
                            const isItemActive = isPathActive(pathname, item.href);
                            return (
                              <li key={item.key} className="group/item relative flex items-center">
                                <Link
                                  href={item.href}
                                  prefetch={true}
                                  onClick={onMobileClose}
                                  className={cn(
                                    "flex flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] transition-colors",
                                    isItemActive
                                      ? "bg-blue-50/80 font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200",
                                  )}
                                >
                                  <item.icon
                                    className={cn(
                                      "h-3.5 w-3.5 shrink-0 transition-colors",
                                      isItemActive
                                        ? "text-blue-600 dark:text-blue-400"
                                        : "text-slate-400 group-hover/item:text-slate-600 dark:text-slate-500",
                                    )}
                                  />
                                  <span className="truncate">{item.label}</span>
                                  {item.badge ? (
                                    <span className="ml-auto rounded-full bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.2 text-[9px] font-semibold text-blue-700 dark:text-blue-300">
                                      {item.badge}
                                    </span>
                                  ) : null}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              ) : null}
            </li>
          )}

          {/* Pinned Favorites Section */}
          {!collapsed && !searchQuery && favorites.length > 0 && (
            <li className="list-none">
              <ul className="space-y-0.5 py-0.5">
                <SectionLabel label="Pinned Shortcuts" collapsed={collapsed} />
                {favorites.map((fav) => {
                  const isFavActive = isPathActive(pathname, fav.href);
                  return (
                    <li key={fav.id} className="group/fav relative flex items-center">
                      <Link
                        href={fav.href}
                        prefetch={true}
                        onClick={onMobileClose}
                        className={cn(
                          "flex flex-1 items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[12.5px] transition-colors pr-7",
                          isFavActive
                            ? "bg-amber-50/80 font-bold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50",
                        )}
                      >
                        <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-500" />
                        <span className="truncate">{fav.label}</span>
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeFavorite(fav.id);
                        }}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 opacity-0 group-hover/fav:opacity-100 hover:text-rose-600 transition-opacity"
                        title="Unpin shortcut"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </li>
          )}

          {filteredSections.map((section) => (
            <li key={section.id} className="list-none">
              <ul>
                <SectionLabel label={section.label} collapsed={collapsed} />
                {section.modules.map((mod) => (
                  <SidebarNavItem
                    key={mod.key}
                    mod={mod}
                    isCollapsed={collapsed}
                    pathname={pathname}
                    onNavigate={onMobileClose}
                    forceExpand={Boolean(searchQuery)}
                  />
                ))}
              </ul>
            </li>
          ))}

          {searchQuery && filteredSections.length === 0 && (
            <li className="list-none py-6 px-3 text-center text-xs text-slate-400">
              No navigation items match &quot;{searchQuery}&quot;
            </li>
          )}
        </ul>
      </nav>

      {/* Bottom Utility Dock */}
      <div className={cn("border-t border-slate-100 p-2.5 dark:border-slate-800", collapsed && "flex justify-center p-2")}>
        <Link
          href={ROUTES.HELPDESK_HOME}
          onClick={onMobileClose}
          className={cn(
            "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800",
            collapsed && "justify-center px-0",
          )}
        >
          <LifeBuoy className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-blue-600" />
          {!collapsed ? <span>Help & Support</span> : <SidebarTooltip label="Help & Support" />}
        </Link>
      </div>
    </div>
  );

  const sidebarClasses = "flex flex-col border-r border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900";
  const desktopWidth = isCollapsed ? "w-16" : "w-[272px]";

  return (
    <>
      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
            onClick={onMobileClose}
            aria-hidden="true"
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className={cn("fixed inset-y-0 left-0 z-50 flex w-72 flex-col lg:hidden", sidebarClasses)}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Navigation</span>
              <button
                type="button"
                onClick={onMobileClose}
                aria-label="Close sidebar"
                className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-1 flex-col overflow-hidden">{renderNav(false)}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div
        className={cn(
          "hidden shrink-0 flex-col overflow-hidden transition-[width] duration-300 ease-in-out lg:flex",
          sidebarClasses,
          desktopWidth,
        )}
      >
        <div className="flex flex-1 flex-col overflow-hidden">{renderNav(isCollapsed)}</div>
      </div>
    </>
  );
}

export default Sidebar;
