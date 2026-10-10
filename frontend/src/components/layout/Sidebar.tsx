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
  type WorkspaceModule,
} from "@/lib/workspace/navigation";
import ModuleIcon from "@/components/ModuleIcon";
import { getEffectiveWorkspacePath } from "@/lib/workspace/url-lock";

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
    <li className="list-none px-3 pb-1 pt-3.5">
      <p className="select-none text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
        {label}
      </p>
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
  const favorites = useNavigationStore((state) => state.favorites);
  const addFavorite = useNavigationStore((state) => state.addFavorite);
  const removeFavorite = useNavigationStore((state) => state.removeFavorite);
  const hasChildren = mod.groups.some((group) => group.items.length > 0);
  const isModActive =
    isPathActive(pathname, mod.homeHref) ||
    mod.groups.some((group) => group.items.some((item) => isPathActive(pathname, item.path)));
  const [expanded, setExpanded] = useState(isModActive);

  useEffect(() => {
    if (isModActive && hasChildren) setExpanded(true);
  }, [isModActive, hasChildren]);

  const rowClass = cn(
    "group relative flex w-full items-center gap-x-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all",
    isModActive
      ? "bg-blue-50/80 font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200",
    isCollapsed && "justify-center px-0 py-2",
  );

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
          {!isCollapsed ? <span className="min-w-0 flex-1 truncate">{mod.label}</span> : null}
          {isCollapsed ? <SidebarTooltip label={mod.label} /> : null}
        </Link>
      </li>
    );
  }

  if (isCollapsed) {
    return (
      <li className="list-none">
        <Link href={mod.homeHref || ROUTES.DASHBOARD} prefetch={true} onClick={onNavigate} className={rowClass} title={mod.label}>
          {isModActive ? (
            <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-blue-600" />
          ) : null}
          {iconWrap}
          <SidebarTooltip label={mod.label} />
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
          <span className="min-w-0 flex-1 truncate text-left">{mod.label}</span>
        </Link>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-slate-800"
          aria-label={expanded ? `Collapse ${mod.label}` : `Expand ${mod.label}`}
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
              <div key={group.label} className="ml-5 mt-0.5 border-l-2 border-slate-100 dark:border-slate-800 pl-3">
                {mod.groups.length > 1 ? (
                  <p className="mb-1 mt-2 select-none px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    {group.label}
                  </p>
                ) : null}
                <ul className="space-y-0.5 py-0.5">
                  {group.items.map((item) => {
                    const isItemActive = isPathActive(pathname, item.path);
                    const isPinned = favorites.some((f) => f.id === item.key || f.href === item.path);
                    return (
                      <li key={item.key} className="group/item relative flex items-center">
                        <Link
                          href={item.path}
                          prefetch={true}
                          onClick={onNavigate}
                          className={cn(
                            "flex flex-1 items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[12.5px] transition-colors pr-7",
                            isItemActive
                              ? "bg-blue-50/80 font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                              : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50",
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 shrink-0 rounded-full transition-colors",
                              isItemActive ? "bg-blue-600 ring-2 ring-blue-200" : "bg-slate-300 dark:bg-slate-600",
                            )}
                          />
                          <span className="truncate">{item.name}</span>
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
                            "absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded transition-all",
                            isPinned ? "text-amber-500 opacity-100" : "text-slate-300 opacity-0 group-hover/item:opacity-100 hover:text-amber-500"
                          )}
                          title={isPinned ? "Unpin from favorites" : "Pin to sidebar"}
                        >
                          <Star className={cn("h-3.5 w-3.5", isPinned && "fill-amber-400 text-amber-500")} />
                        </button>
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
  const dashboardActive = isPathActive(pathname, ROUTES.DASHBOARD);

  useEffect(() => {
    onMobileClose?.();
  }, [pathname]);

  const renderNav = (collapsed: boolean) => (
    <div className={cn("flex flex-1 flex-col min-h-0", collapsed ? "pt-2" : "pt-2")}>

      {/* Nav list */}
      <nav className="flex flex-1 flex-col overflow-y-auto px-2.5 py-2 scrollbar-thin">
        <ul role="list" className="flex flex-col gap-y-0.5">
          <li className="list-none">
            <Link
              href={ROUTES.DASHBOARD}
              onClick={onMobileClose}
              className={cn(
                "group relative flex items-center gap-x-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all",
                dashboardActive
                  ? "bg-blue-50/80 font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200",
                collapsed && "justify-center px-0 py-2",
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
              {!collapsed ? <span className="truncate">Executive Dashboard</span> : <SidebarTooltip label="Dashboard" />}
            </Link>
          </li>

          {/* Pinned Favorites Section */}
          {!collapsed && favorites.length > 0 && (
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
  const desktopWidth = isCollapsed ? "w-16" : "w-64";

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
