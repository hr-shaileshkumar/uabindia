"use client";

import Link from "next/link";
import { Search, X } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import ModuleIcon from "@/components/ModuleIcon";
import { WorkspaceStatusPanel } from "@/components/erp/workspace-status-panel";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/context/PermissionContext";
import { useUiSchema } from "@/context/UiSchemaContext";
import {
  buildWorkspaceModules,
  filterWorkspaceModules,
  findWorkspaceModuleByPath,
} from "@/lib/erp/navigation";
import { getPortalTheme } from "@/lib/erp/portals";
import type { ERPRole } from "@/lib/erp/types";
import { cn } from "@/lib/utils";

const isActivePath = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

const formatPathMeta = (path: string) =>
  path
    .replace(/^\/+/, "")
    .split("/")
    .filter(Boolean)
    .join(" / ");

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
  const theme = getPortalTheme(role);
  const { hasPermission, isSuperAdmin } = usePermissions();
  const {
    navigation,
    enabledModules,
    navigationReady,
    requiresSetup,
    schemaError,
    refresh,
  } = useUiSchema();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const canManageWorkspaceSetup =
    isSuperAdmin ||
    hasPermission(["module:platform", "platform.*", "platform.access", "platform.view"]);

  const modules = useMemo(
    () => buildWorkspaceModules(navigation.modules, enabledModules),
    [enabledModules, navigation.modules]
  );

  const filteredModules = useMemo(
    () => filterWorkspaceModules(modules, deferredSearch),
    [deferredSearch, modules]
  );

  const activeModuleKey = useMemo(
    () => findWorkspaceModuleByPath(modules, pathname)?.key,
    [modules, pathname]
  );

  const emptyState = useMemo(() => {
    if (schemaError) {
      return (
        <WorkspaceStatusPanel
          compact
          tone="critical"
          title="Workspace navigation is unavailable"
          description="The frontend could not load navigation or route rules from the backend APIs."
          detail={schemaError}
          onRetry={() => void refresh()}
        />
      );
    }

    if (enabledModules.length === 0) {
      return (
        <WorkspaceStatusPanel
          compact
          tone="neutral"
          title="No modules are enabled"
          description="This tenant has no enabled workspace modules yet, so there is nothing to render in the sidebar."
          detail="Enable modules in the backend tenant configuration before granting user access."
        />
      );
    }

    if (!navigationReady || requiresSetup) {
      return canManageWorkspaceSetup ? (
        <WorkspaceStatusPanel
          compact
          tone="warning"
          title="Navigation setup is incomplete"
          description="Backend navigation or route rules are missing the records needed to render this workspace."
          detail={`Enabled modules: ${enabledModules.map((module) => module.displayName || module.name || module.key).join(", ")}`}
          actionLabel="Review registry"
          actionHref="/platform/module-mapping"
          onRetry={() => void refresh()}
        />
      ) : (
        <WorkspaceStatusPanel
          compact
          tone="warning"
          title="Access is not configured"
          description="Your account is authenticated, but backend navigation has not been configured for this tenant."
          detail="Contact an administrator to seed menu configuration, route rules, and module visibility."
        />
      );
    }

    return (
      <WorkspaceStatusPanel
        compact
        tone="warning"
        title={search.trim() ? "No modules match this search" : "No accessible navigation items"}
        description={
          search.trim()
            ? "Try a different module or page keyword."
            : "The backend returned navigation, but none of the pages matched your current permissions."
        }
        detail={
          search.trim()
            ? "Search by module name, page name, or route path."
            : "Review role-to-permission mapping and menu permissions for this user."
        }
        onRetry={() => void refresh()}
      />
    );
  }, [canManageWorkspaceSetup, enabledModules, navigationReady, refresh, requiresSetup, schemaError, search]);

  const content = (
    <div className="flex h-full flex-col">
      <div className={cn("border-b px-5 py-4", theme.sidebarBorderClassName)}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={cn("text-xs font-semibold uppercase tracking-[0.18em]", theme.sidebarTitleClassName)}>
              UabIndia ERP
            </p>
            <h2 className="mt-1 text-lg font-semibold">{theme.label}</h2>
            <p className="mt-1 text-xs leading-5 opacity-80">
              Module hubs and child pages stay aligned with backend navigation.
            </p>
          </div>
          {onClose ? (
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>

        <label className="mt-4 block">
          <span className="sr-only">Search modules</span>
          <span className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search modules or pages"
              className={cn(
                "w-full rounded-2xl border px-3 py-2.5 pl-10 text-sm outline-none transition",
                theme.sidebarInactiveClassName,
                theme.sidebarBorderClassName,
                "bg-transparent"
              )}
            />
          </span>
        </label>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        {filteredModules.length === 0 ? (
          emptyState
        ) : (
          <div className="space-y-4">
            {filteredModules.map((module) => {
              const moduleActive = module.key === activeModuleKey;
              const moduleHref = module.homeHref || module.groups[0]?.items[0]?.path;

              return (
                <section
                  key={module.key}
                  className={cn(
                    "rounded-3xl border p-3 transition",
                    moduleActive
                      ? cn(theme.sidebarActiveClassName, theme.sidebarBorderClassName)
                      : cn("border-transparent", theme.sidebarInactiveClassName)
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-0.5 inline-flex h-11 w-11 items-center justify-center rounded-2xl",
                        moduleActive ? theme.sidebarIconActiveClassName : theme.sidebarIconInactiveClassName
                      )}
                    >
                      <ModuleIcon name={module.icon} className="h-5 w-5" />
                    </span>

                    <div className="min-w-0 flex-1">
                      {moduleHref ? (
                        <Link
                          href={moduleHref}
                          onClick={onClose}
                          className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">{module.label}</p>
                              <p className="mt-1 line-clamp-2 text-xs leading-5 opacity-75">
                                {module.description || `${module.pageCount} workspace pages`}
                              </p>
                            </div>
                            <span className="rounded-full border border-current/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]">
                              {module.pageCount} pages
                            </span>
                          </div>
                        </Link>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{module.label}</p>
                            <p className="mt-1 line-clamp-2 text-xs leading-5 opacity-75">
                              {module.description || `${module.pageCount} workspace pages`}
                            </p>
                          </div>
                          <span className="rounded-full border border-current/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]">
                            {module.pageCount} pages
                          </span>
                        </div>
                      )}

                      <div className="mt-3 space-y-3">
                        {module.groups.map((group) => (
                          <div key={`${module.key}-${group.label}`}>
                            {module.groups.length > 1 ? (
                              <p className={cn("px-1 text-[11px] font-semibold uppercase tracking-[0.18em]", theme.sidebarSectionClassName)}>
                                {group.label}
                              </p>
                            ) : null}
                            <div className="mt-2 space-y-1.5">
                              {group.items.map((item) => {
                                const active = isActivePath(pathname, item.path);
                                return (
                                  <Link
                                    key={item.path}
                                    href={item.path}
                                    onClick={onClose}
                                    className={cn(
                                      "flex items-start gap-3 rounded-2xl px-3 py-2.5 transition",
                                      active ? theme.sidebarActiveClassName : theme.sidebarInactiveClassName
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        "mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl",
                                        active ? theme.sidebarIconActiveClassName : theme.sidebarIconInactiveClassName
                                      )}
                                    >
                                      <ModuleIcon name={item.icon || module.icon} className="h-4 w-4" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                      <span className="block text-sm font-semibold">{item.name}</span>
                                      <span className="mt-0.5 block truncate text-[11px] uppercase tracking-[0.14em] opacity-65">
                                        {formatPathMeta(item.path)}
                                      </span>
                                    </span>
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={cn(
          "hidden h-screen w-[340px] shrink-0 border-r lg:block",
          theme.sidebarClassName,
          theme.sidebarBorderClassName
        )}
      >
        {content}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/40 lg:hidden" onClick={onClose}>
          <aside
            className={cn(
              "h-full w-[90vw] max-w-[340px] border-r shadow-2xl",
              theme.sidebarClassName,
              theme.sidebarBorderClassName
            )}
            onClick={(event) => event.stopPropagation()}
          >
            {content}
          </aside>
        </div>
      ) : null}
    </>
  );
}
