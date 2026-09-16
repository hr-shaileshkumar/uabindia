"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { WorkspaceBreadcrumb } from "@/components/layout/WorkspaceBreadcrumb";
import { GlobalSearchCommand } from "@/components/workspace/global-search-command";
import { KeyboardShortcutsHandler } from "@/components/layout/KeyboardShortcutsHandler";
import { AiCopilotDrawer } from "@/components/ai/AiCopilotDrawer";
import { useAuth } from "@/context/AuthContext";
import { useOrgContext } from "@/context/OrgContext";
import { usePermissions } from "@/context/PermissionContext";
import { useUiSchema } from "@/context/UiSchemaContext";
import { useNavigationStore } from "@/store/navigationStore";
import { normalizeRole } from "@/lib/workspace/access";
import { buildWorkspaceModules, buildFallbackWorkspaceModules, findWorkspaceModuleByPath } from "@/lib/workspace/navigation";
import { getPortalTheme } from "@/lib/workspace/portals";
import { getSchemaRouteRule } from "@/lib/workspace/route-access";
import { canonicalizeProtectedPath, OWNER_PATH_PREFIXES, matchesAnyPrefix } from "@/lib/workspace/route-config";
import { withPublicAudience } from "@/lib/public-audience";
import { publicApi } from "@/services/modules";
import { cn } from "@/lib/utils";

const ACCESS_NOT_CONFIGURED_REASON = "access-not-configured";
const ACCESS_DENIED_REASON = "access-denied";
const PERMISSIONS_UNAVAILABLE_REASON = "permissions-unavailable";
const NAVIGATION_ERROR_REASON = "navigation-unavailable";

const isShellExemptPath = (pathname: string) =>
  pathname === "/context" || pathname === "/not-authorized";

function ProtectedShellLoading() {
  const [loadStage, setLoadStage] = useState<"initial" | "connecting" | "slow">("initial");

  useEffect(() => {
    const t1 = setTimeout(() => setLoadStage("connecting"), 3000);
    const t2 = setTimeout(() => setLoadStage("slow"), 8000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="erp-app-canvas relative flex min-h-[100dvh] flex-col overflow-hidden bg-slate-50/50" role="status" aria-live="polite">
      <span className="sr-only">Loading your workspace</span>

      {/* Top indeterminate loading indicator bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-slate-200/50 overflow-hidden">
        <div className="h-full w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-500 animate-[loading-progress_1.6s_ease-in-out_infinite]" />
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar Skeleton */}
        <aside className="hidden w-[var(--erp-sidebar-width,260px)] shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col" aria-hidden="true">
          <div className="h-[var(--erp-topbar-height,56px)] border-b border-slate-200 flex items-center px-4 gap-3">
            <div className="h-7 w-7 animate-pulse rounded-lg bg-slate-200" />
            <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
          </div>
          <div className="space-y-1.5 p-3 flex-1">
            <div className="h-3 w-16 mb-2 ml-2 rounded bg-slate-100" />
            {Array.from({ length: 7 }, (_, index) => (
              <div key={index} className="h-9 animate-pulse rounded-lg bg-slate-50 flex items-center gap-3 px-3">
                <div className="h-4 w-4 rounded bg-slate-200 shrink-0" />
                <div className="h-3.5 rounded bg-slate-200" style={{ width: `${55 + (index % 4) * 12}%` }} />
              </div>
            ))}
          </div>
        </aside>

        {/* Content Skeleton */}
        <div className="min-w-0 flex-1 flex flex-col">
          {/* Header Placeholder */}
          <div className="h-[var(--erp-topbar-height,56px)] border-b border-slate-200 bg-white flex items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="h-5 w-28 animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-3 animate-pulse rounded bg-slate-100" />
              <div className="h-5 w-24 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-44 animate-pulse rounded-lg bg-slate-100 hidden sm:block" />
              <div className="h-8 w-8 animate-pulse rounded-full bg-slate-100" />
            </div>
          </div>

          <main className="relative mx-auto w-full max-w-[var(--erp-content-max,1400px)] flex-1 space-y-5 p-4 sm:p-6" aria-hidden="true">
            {/* Header Card Skeleton */}
            <div className="h-20 animate-pulse rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-center gap-2">
              <div className="h-5 w-48 rounded bg-slate-100" />
              <div className="h-3.5 w-80 max-w-full rounded bg-slate-100" />
            </div>

            {/* 4 Stats Cards */}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="h-20 animate-pulse rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between">
                  <div className="h-3.5 w-24 rounded bg-slate-100" />
                  <div className="h-6 w-16 rounded bg-slate-100" />
                </div>
              ))}
            </div>

            {/* Main Content / Table Card */}
            <div className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white p-5 space-y-4">
              <div className="h-8 w-full rounded bg-slate-50 border-b border-slate-100" />
              <div className="space-y-3 pt-2">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="h-7 w-full rounded bg-slate-50" />
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Center Floating Status Badge */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        {loadStage === "initial" && (
          <div className="flex items-center gap-2.5 rounded-full border border-slate-200/90 bg-white/95 px-4 py-2 text-xs font-medium text-slate-700 shadow-lg shadow-slate-900/5 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-sky-500 animate-ping" />
            <span>Loading workspace...</span>
          </div>
        )}

        {loadStage === "connecting" && (
          <div className="flex items-center gap-2.5 rounded-full border border-amber-200 bg-amber-50/95 px-4 py-2 text-xs font-medium text-amber-900 shadow-lg shadow-amber-900/5 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Connecting to backend services...</span>
          </div>
        )}

        {loadStage === "slow" && (
          <div className="flex flex-col sm:flex-row items-center gap-3 rounded-2xl border border-amber-300 bg-white/95 p-3 sm:px-4 sm:py-2.5 text-xs text-slate-700 shadow-xl shadow-slate-900/10 backdrop-blur-sm max-w-[90vw]">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
              <span>Backend is taking longer than usual to respond.</span>
            </div>
            <div className="flex items-center gap-2 mt-1 sm:mt-0">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-lg bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Reload
              </button>
              <a
                href="/login"
                className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Login
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Client workspace chrome. Keep `app/(protected)/layout.tsx` a Server Component. */
export function ProtectedWorkspaceShell({ children }: { children: ReactNode }) {
  const { user, loading, logout: _logout } = useAuth();
  const {
    hasPermission,
    loading: permissionsLoading,
    fetchFailed: permissionFetchFailed,
    isSuperAdmin,
  } = usePermissions();
  const {
    navigation,
    routeRules,
    enabledModules,
    loading: schemaLoading,
    schemaError,
    usingCache,
    navigationReady,
    routeRulesReady,
    requiresSetup,
  } = useUiSchema();
  const { companyId, projectId, financialYearKey } = useOrgContext();
  const router = useRouter();
  const pathname = usePathname() || "";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const isSearchOpen = useNavigationStore(state => state.isSearchOpen);
  const setSearchOpen = useNavigationStore(state => state.setSearchOpen);
  const isSidebarCollapsed = useNavigationStore(state => state.isSidebarCollapsed);
  const setSidebarCollapsed = useNavigationStore(state => state.setSidebarCollapsed);

  const role = useMemo(() => normalizeRole(user?.role), [user?.role]);
  const portal = useMemo(() => getPortalTheme(role), [role]);
  const schemaConfigured = navigationReady && routeRulesReady;
  const hasEnabledModules = enabledModules.length > 0;
  const enabledModuleKeys = useMemo(
    () => new Set(enabledModules.map((module) => module.key.toLowerCase())),
    [enabledModules]
  );
  const canManageWorkspaceSetup =
    isSuperAdmin ||
    hasPermission([
      "module:administration",
      "administration.*",
      "administration.access",
      "administration.view",
      "module:platform",
      "platform.*",
      "platform.access",
      "platform.view",
    ]);
  const isSuperAdminRoute = pathname.startsWith("/superadmin");
  const _shellStatus = useMemo(() => {
    if (schemaError && !usingCache) {
      return { label: "Schema issue", tone: "critical" as const };
    }

    if (schemaError && usingCache) {
      return { label: "Offline (cached)", tone: "warning" as const };
    }

    if (!hasEnabledModules || requiresSetup) {
      return { label: "Setup required", tone: "warning" as const };
    }

    return { label: "Synced", tone: "positive" as const };
  }, [hasEnabledModules, requiresSetup, schemaError, usingCache]);

  const workspaceModules = useMemo(
    () => {
      if (!navigationReady && navigation.modules.length === 0 && enabledModules.length > 0) {
        return buildFallbackWorkspaceModules(enabledModules);
      }
      return buildWorkspaceModules(navigation.modules, enabledModules);
    },
    [enabledModules, navigation, navigationReady]
  );

  const matchedRouteRule = useMemo(() => {
    if (!schemaConfigured || isShellExemptPath(pathname)) {
      return null;
    }

    return getSchemaRouteRule(pathname, routeRules.rules);
  }, [pathname, routeRules.rules, schemaConfigured]);

  const matchedWorkspaceModule = useMemo(() => {
    if ((!schemaConfigured && enabledModules.length === 0) || isShellExemptPath(pathname)) {
      return null;
    }

    return findWorkspaceModuleByPath(workspaceModules, pathname);
  }, [pathname, schemaConfigured, enabledModules.length, workspaceModules]);

  const moduleHomeAllowed = useMemo(() => {
    if (!matchedWorkspaceModule?.homeHref) {
      return false;
    }

    return (
      canonicalizeProtectedPath(pathname) === canonicalizeProtectedPath(matchedWorkspaceModule.homeHref) &&
      enabledModuleKeys.has(matchedWorkspaceModule.key.toLowerCase())
    );
  }, [enabledModuleKeys, matchedWorkspaceModule, pathname]);

  const routeAllowed = useMemo(() => {
    if (isSuperAdmin) {
      return true;
    }

    if (isShellExemptPath(pathname)) {
      return true;
    }

    if (isSuperAdminRoute) {
      return isSuperAdmin;
    }

    // Platform routes for admins / managers
    if (matchesAnyPrefix(pathname, OWNER_PATH_PREFIXES) && canManageWorkspaceSetup) {
      return true;
    }

    if (schemaConfigured) {
      if (matchedRouteRule && !enabledModuleKeys.has(matchedRouteRule.moduleKey.toLowerCase())) {
        return false;
      }

      if (matchedRouteRule) {
        return true;
      }

      if (matchedWorkspaceModule && enabledModuleKeys.has(matchedWorkspaceModule.key.toLowerCase())) {
        return true;
      }

      return moduleHomeAllowed;
    }

    // Fallback: If backend schema failed but page is mapped locally in our fallback workspaceModules
    if (enabledModules.length > 0) {
      const fallbackModule = findWorkspaceModuleByPath(workspaceModules, pathname);
      if (fallbackModule && enabledModuleKeys.has(fallbackModule.key.toLowerCase())) {
        return true;
      }
    }

    return canManageWorkspaceSetup;
  }, [canManageWorkspaceSetup, enabledModuleKeys, enabledModules.length, isSuperAdmin, isSuperAdminRoute, matchedRouteRule, matchedWorkspaceModule, moduleHomeAllowed, pathname, schemaConfigured, workspaceModules]);

  useEffect(() => {
    if (loading || permissionsLoading || schemaLoading) return;

    if (!user) {
      const audience = matchesAnyPrefix(pathname, OWNER_PATH_PREFIXES) ? "platform" : "tenant";
      router.replace(withPublicAudience(`/login?next=${encodeURIComponent(pathname)}`, audience));
      return;
    }

    if (permissionFetchFailed && !isSuperAdmin) {
      router.replace(`/not-authorized?reason=${PERMISSIONS_UNAVAILABLE_REASON}`);
      return;
    }

    if (schemaError && !canManageWorkspaceSetup && !isShellExemptPath(pathname)) {
      // If we have a cached fallback or a generated local fallback, allow user to continue.
      const hasLocalFallback = workspaceModules.length > 0;
      if (!usingCache && !hasLocalFallback) {
        router.replace(`/not-authorized?reason=${NAVIGATION_ERROR_REASON}`);
        return;
      }
    }

    if (!hasEnabledModules && !canManageWorkspaceSetup && !isShellExemptPath(pathname)) {
      router.replace(`/not-authorized?reason=${ACCESS_NOT_CONFIGURED_REASON}`);
      return;
    }

    if (requiresSetup && !canManageWorkspaceSetup && !isShellExemptPath(pathname)) {
      const hasLocalFallback = workspaceModules.length > 0;
      if (!hasLocalFallback) {
        router.replace(`/not-authorized?reason=${ACCESS_NOT_CONFIGURED_REASON}`);
        return;
      }
    }

    if (!routeAllowed) {
      router.replace(`/not-authorized?reason=${ACCESS_DENIED_REASON}`);
    }
  }, [
    canManageWorkspaceSetup,
    loading,
    pathname,
    isSuperAdmin,
    permissionFetchFailed,
    permissionsLoading,
    routeAllowed,
    router,
    hasEnabledModules,
    schemaConfigured,
    schemaError,
    schemaLoading,
    requiresSetup,
    usingCache,
    user,
    workspaceModules.length,
  ]);

  useEffect(() => {
    if (!user || role === "super_admin") {
      return;
    }

    publicApi
      .getCompanyProfile("tenant")
      .then((response) => {
        const _nextName = response.data?.company?.name || response.data?.tenant?.name;
        // Company name is available in OrgContext — no local state needed
      })
      .catch(() => undefined);
  }, [role, user]);





  const handleShellMenuClick = () => {
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches) {
      setSidebarCollapsed(!isSidebarCollapsed);
      return;
    }

    setMobileOpen(true);
  };


  if (!mounted || loading || permissionsLoading || schemaLoading || !user || (permissionFetchFailed && !isSuperAdmin)) {
    return <ProtectedShellLoading />;
  }

  if (schemaConfigured && !routeAllowed) {
    return <ProtectedShellLoading />;
  }

  const workspaceScopeKey = `${companyId ?? ""}|${projectId ?? ""}|${financialYearKey ?? ""}`;

  return (
    <div className={cn("relative flex h-[100dvh] min-h-[100dvh] bg-background text-foreground flex-col overflow-hidden", portal.shellClassName)}>
      <Header onMenuClick={handleShellMenuClick} />
      <div className="flex flex-1 min-h-0 overflow-hidden bg-slate-50/60 dark:bg-slate-950">
        <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
        <main id="erp-workspace-content" className="relative isolate min-h-0 flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 scrollbar-thin">
          <div className="mx-auto w-full max-w-[1600px]">
            <WorkspaceBreadcrumb className="mb-3 sm:mb-4" />
            <div key={workspaceScopeKey}>{children}</div>
          </div>
        </main>
      </div>
      <GlobalSearchCommand open={isSearchOpen} onOpenChange={setSearchOpen} />
      <KeyboardShortcutsHandler />
      <AiCopilotDrawer />
    </div>
  );
}
