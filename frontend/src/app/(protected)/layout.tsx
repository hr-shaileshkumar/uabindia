"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { GlobalSearchCommand } from "@/components/erp/global-search-command";
import { useAuth } from "@/context/AuthContext";
import { useOrgContext } from "@/context/OrgContext";
import { usePermissions } from "@/context/PermissionContext";
import { useUiSchema } from "@/context/UiSchemaContext";
import { useNavigationStore } from "@/store/navigationStore";
import { normalizeRole } from "@/lib/erp/access";
import { buildWorkspaceModules, buildFallbackWorkspaceModules, findWorkspaceModuleByPath } from "@/lib/erp/navigation";
import { getPortalTheme } from "@/lib/erp/portals";
import { getSchemaRouteRule } from "@/lib/erp/route-access";
import { canonicalizeProtectedPath, OWNER_PATH_PREFIXES, matchesAnyPrefix } from "@/lib/erp/route-config";
import { withPublicAudience } from "@/lib/public-audience";
import { publicApi } from "@/services/modules";
import { GlobalLoading } from "@/components/ui/GlobalLoading";

const ACCESS_NOT_CONFIGURED_REASON = "access-not-configured";
const ACCESS_DENIED_REASON = "access-denied";
const PERMISSIONS_UNAVAILABLE_REASON = "permissions-unavailable";
const NAVIGATION_ERROR_REASON = "navigation-unavailable";

const isShellExemptPath = (pathname: string) =>
  pathname === "/context" || pathname === "/not-authorized";

function ProtectedShellLoading() {
  return (
    <div className="flex min-h-[100dvh] bg-[var(--erp-canvas)]" role="status" aria-live="polite">
      <span className="sr-only">Loading your workspace</span>
      <aside className="hidden w-[18rem] shrink-0 border-r border-[var(--erp-border)] bg-white lg:block" aria-hidden="true">
        <div className="h-[var(--erp-topbar-height)] border-b border-[var(--erp-border)]" />
        <div className="space-y-2 p-3">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="h-9 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="h-[var(--erp-topbar-height)] border-b border-[var(--erp-border)] bg-white" />
        <main className="mx-auto w-full max-w-[var(--erp-content-max)] space-y-5 p-[var(--erp-page-gutter)]" aria-hidden="true">
          <div className="h-24 animate-pulse rounded-xl border border-[var(--erp-border)] bg-white" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-xl border border-[var(--erp-border)] bg-white" />
            ))}
          </div>
          <div className="h-72 animate-pulse rounded-xl border border-[var(--erp-border)] bg-white" />
        </main>
      </div>
    </div>
  );
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
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
  const { companyName, projectName, financialYearLabel: _financialYearLabel } = useOrgContext();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  
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
    hasPermission(["module:platform", "platform.*", "platform.access", "platform.view"]);
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


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setSearchOpen]);


  const handleShellMenuClick = () => {
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches) {
      setSidebarCollapsed(!isSidebarCollapsed);
      return;
    }

    setMobileOpen(true);
  };


  if (loading || permissionsLoading || schemaLoading || !user || (permissionFetchFailed && !isSuperAdmin)) {
    return <ProtectedShellLoading />;
  }

  if (schemaConfigured && !routeAllowed) {
    return <ProtectedShellLoading />;
  }

  const _workspaceName =
    projectName ||
    companyName ||
    (role === "super_admin" ? "Global operations" : enabledModules[0]?.displayName || "Default workspace");

  return (
    <div className={`relative flex h-[100dvh] min-h-[100dvh] bg-background text-foreground flex-col overflow-hidden ${portal.shellClassName}`}>
      <Header onMenuClick={handleShellMenuClick} />
      <div className="flex flex-1 min-h-0 overflow-hidden bg-canvas">
        <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[var(--erp-content-max)] space-y-5">
            {children}
          </div>
        </main>
      </div>
      <GlobalSearchCommand open={isSearchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
