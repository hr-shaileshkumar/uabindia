"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, LayoutDashboard, LifeBuoy, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { useNavigationStore } from "@/store/navigationStore";
import { useUiSchema } from "@/context/UiSchemaContext";
import {
  buildWorkspaceModules,
  groupWorkspaceModulesForSidebar,
  type WorkspaceModule,
} from "@/lib/erp/navigation";
import ModuleIcon from "@/components/ModuleIcon";

function SidebarTooltip({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100">
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
    return <li className="mx-2 my-1.5 border-t border-slate-200" aria-hidden="true" />;
  }

  return (
    <li className="list-none px-3 pb-1 pt-3">
      <p className="select-none text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
    </li>
  );
}

function SidebarNavItem({
  mod,
  isCollapsed,
  pathname,
  onNavigate,
}: {
  mod: WorkspaceModule;
  isCollapsed: boolean;
  pathname: string;
  onNavigate?: () => void;
}) {
  const hasChildren = mod.groups.some((group) => group.items.length > 0);
  const isModActive = isPathActive(pathname, mod.homeHref) ||
    mod.groups.some((group) => group.items.some((item) => isPathActive(pathname, item.path)));
  const [expanded, setExpanded] = useState(isModActive);

  useEffect(() => {
    if (isModActive && hasChildren) setExpanded(true);
  }, [isModActive, hasChildren]);

  const rowClass = cn(
    "group relative flex w-full items-center gap-x-2.5 rounded-lg px-2 py-1.5 text-[13px] font-medium transition",
    isModActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
    isCollapsed && "justify-center px-0",
  );

  const iconWrap = (
    <span
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
        isModActive ? "bg-blue-100 text-blue-700" : "text-slate-500",
      )}
    >
      <ModuleIcon name={mod.icon as string} className="h-4 w-4 shrink-0" />
    </span>
  );

  if (!hasChildren) {
    return (
      <li className="list-none">
        <Link href={mod.homeHref || ROUTES.DASHBOARD} onClick={onNavigate} className={rowClass}>
          {isModActive ? <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-blue-600" /> : null}
          {iconWrap}
          {!isCollapsed ? <span className="min-w-0 flex-1 truncate">{mod.label}</span> : null}
          {isCollapsed ? <SidebarTooltip label={mod.label} /> : null}
        </Link>
      </li>
    );
  }

  if (isCollapsed) {
    return (
      <li className="list-none">
        <Link href={mod.homeHref || ROUTES.DASHBOARD} onClick={onNavigate} className={rowClass} title={mod.label}>
          {isModActive ? <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-blue-600" /> : null}
          {iconWrap}
          <SidebarTooltip label={mod.label} />
        </Link>
      </li>
    );
  }

  return (
    <li className="list-none">
      <div className="relative flex items-center">
        <Link href={mod.homeHref || ROUTES.DASHBOARD} onClick={onNavigate} className={cn(rowClass, "pr-8")}>
          {isModActive && !expanded ? (
            <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-blue-600" />
          ) : null}
          {iconWrap}
          <span className="min-w-0 flex-1 truncate text-left">{mod.label}</span>
        </Link>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label={expanded ? `Collapse ${mod.label}` : `Expand ${mod.label}`}
          aria-expanded={expanded}
        >
          <motion.span animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.16 }}>
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
              <div key={group.label} className="ml-5 mt-0.5 border-l border-slate-200 pl-2.5">
                {mod.groups.length > 1 ? (
                  <p className="mb-0.5 mt-1.5 select-none px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    {group.label}
                  </p>
                ) : null}
                <ul className="space-y-px py-0.5">
                  {group.items.map((item) => {
                    const isItemActive = isPathActive(pathname, item.path);
                    return (
                      <li key={item.key}>
                        <Link
                          href={item.path}
                          onClick={onNavigate}
                          className={cn(
                            "flex items-center gap-2 rounded-md px-2 py-1.5 text-[12.5px] transition",
                            isItemActive
                              ? "bg-blue-50 font-semibold text-blue-700"
                              : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
                          )}
                        >
                          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", isItemActive ? "bg-blue-600" : "bg-slate-300")} />
                          <span className="truncate">{item.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
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
  const pathname = usePathname();
  const isCollapsed = useNavigationStore((state) => state.isSidebarCollapsed);
  const { navigation: schemaNav, enabledModules } = useUiSchema();
  const dynamicModules = buildWorkspaceModules(schemaNav.modules, enabledModules);
  const sections = groupWorkspaceModulesForSidebar(dynamicModules);
  const dashboardActive = isPathActive(pathname, ROUTES.DASHBOARD);

  useEffect(() => {
    onMobileClose?.();
  }, [pathname]); // close the drawer on route change only

  const renderNav = (collapsed: boolean) => (
    <>
      <nav className="flex flex-1 flex-col overflow-y-auto px-2 py-2">
        <ul role="list" className="flex flex-col gap-y-0.5">
          <li className="list-none">
            <Link
              href={ROUTES.DASHBOARD}
              onClick={onMobileClose}
              className={cn(
                "group relative flex items-center gap-x-2.5 rounded-lg px-2 py-1.5 text-[13px] font-medium transition",
                dashboardActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                collapsed && "justify-center px-0",
              )}
            >
              {dashboardActive ? (
                <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-blue-600" />
              ) : null}
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                  dashboardActive ? "bg-blue-100 text-blue-700" : "text-slate-500",
                )}
              >
                <LayoutDashboard className="h-4 w-4" />
              </span>
              {!collapsed ? <span className="truncate">Dashboard</span> : <SidebarTooltip label="Dashboard" />}
            </Link>
          </li>

          {sections.map((section) => (
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
                  />
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </nav>

      <div className={cn("border-t border-slate-200 p-2", collapsed && "flex justify-center")}>
        <Link
          href={ROUTES.HELPDESK_HOME}
          onClick={onMobileClose}
          className={cn(
            "group relative flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[12.5px] font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-800",
            collapsed && "justify-center px-0",
          )}
        >
          <LifeBuoy className="h-4 w-4 shrink-0" />
          {!collapsed ? <span>Helpdesk</span> : <SidebarTooltip label="Helpdesk" />}
        </Link>
      </div>
    </>
  );

  const sidebarClasses = "flex flex-col border-r border-slate-200 bg-white";
  const desktopWidth = isCollapsed ? "w-[var(--erp-sidebar-collapsed-width)]" : "w-[var(--erp-sidebar-width)]";

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
            className={cn("fixed inset-y-0 left-0 z-50 flex w-[var(--erp-sidebar-width)] flex-col lg:hidden", sidebarClasses)}
          >
            <div className="flex items-center justify-end border-b border-slate-200 px-3 py-3">
              <button
                type="button"
                onClick={onMobileClose}
                aria-label="Close sidebar"
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
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
