"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/erp/app-sidebar";
import { GlobalSearchCommand } from "@/components/erp/global-search-command";
import { ERPTopbar } from "@/components/erp/topbar";
import { useAuth } from "@/context/AuthContext";
import { useOrgContext } from "@/context/OrgContext";
import { usePermissions } from "@/context/PermissionContext";
import { useUiSchema } from "@/context/UiSchemaContext";
import { normalizeRole } from "@/lib/erp/access";
import { getPortalTheme } from "@/lib/erp/portals";
import { getSchemaRouteRule } from "@/lib/erp/route-access";
import { OWNER_PATH_PREFIXES, matchesAnyPrefix } from "@/lib/erp/route-config";
import { withPublicAudience } from "@/lib/public-audience";
import { publicApi } from "@/services/modules";

const ACCESS_NOT_CONFIGURED_REASON = "access-not-configured";
const ACCESS_DENIED_REASON = "access-denied";
const PERMISSIONS_UNAVAILABLE_REASON = "permissions-unavailable";
const NAVIGATION_ERROR_REASON = "navigation-unavailable";

const isShellExemptPath = (pathname: string) =>
  pathname === "/context" || pathname === "/not-authorized";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const {
    hasPermission,
    loading: permissionsLoading,
    fetchFailed: permissionFetchFailed,
    isSuperAdmin,
  } = usePermissions();
  const {
    routeRules,
    enabledModules,
    loading: schemaLoading,
    schemaError,
    usingCache,
    navigationReady,
    routeRulesReady,
    requiresSetup,
  } = useUiSchema();
  const { companyName, projectName, financialYearLabel } = useOrgContext();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [tenantDisplayName, setTenantDisplayName] = useState<string | undefined>(undefined);

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
  const shellStatus = useMemo(() => {
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

  const matchedRouteRule = useMemo(() => {
    if (!schemaConfigured || isShellExemptPath(pathname)) {
      return null;
    }

    return getSchemaRouteRule(pathname, routeRules.rules);
  }, [pathname, routeRules.rules, schemaConfigured]);

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

    if (!schemaConfigured) {
      return canManageWorkspaceSetup;
    }

    if (matchedRouteRule && !enabledModuleKeys.has(matchedRouteRule.moduleKey.toLowerCase())) {
      return false;
    }

    return !!matchedRouteRule;
  }, [canManageWorkspaceSetup, enabledModuleKeys, isSuperAdmin, isSuperAdminRoute, matchedRouteRule, pathname, schemaConfigured]);

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
      // If we have a cached fallback, allow the user to continue in read-only/offline mode.
      if (!usingCache) {
        router.replace(`/not-authorized?reason=${NAVIGATION_ERROR_REASON}`);
        return;
      }
      return;
    }

    if (!hasEnabledModules && !canManageWorkspaceSetup && !isShellExemptPath(pathname)) {
      router.replace(`/not-authorized?reason=${ACCESS_NOT_CONFIGURED_REASON}`);
      return;
    }

    if (requiresSetup && !canManageWorkspaceSetup && !isShellExemptPath(pathname)) {
      router.replace(`/not-authorized?reason=${ACCESS_NOT_CONFIGURED_REASON}`);
      return;
    }

    if (schemaConfigured && !routeAllowed) {
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
  ]);

  useEffect(() => {
    if (!user || role === "super_admin") {
      setTenantDisplayName(role === "super_admin" ? "Platform workspace" : undefined);
      return;
    }

    publicApi
      .getCompanyProfile("tenant")
      .then((response) => {
        const nextName = response.data?.company?.name || response.data?.tenant?.name;
        if (nextName) {
          setTenantDisplayName(nextName);
        }
      })
      .catch(() => undefined);
  }, [role, user]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (loading || permissionsLoading || schemaLoading || !user || (permissionFetchFailed && !isSuperAdmin)) {
    return null;
  }

  if (schemaConfigured && !routeAllowed) {
    return null;
  }

  const workspaceName =
    projectName ||
    companyName ||
    (role === "super_admin" ? "Global operations" : enabledModules[0]?.displayName || "Default workspace");

  return (
    <div className={`relative flex h-[100dvh] min-h-[100dvh] flex-col overflow-hidden ${portal.shellClassName}`}>
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(15,74,125,0.08),transparent_34%),radial-gradient(circle_at_top_right,rgba(11,123,115,0.08),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.52),rgba(248,250,252,0.92)_60%,rgba(241,245,249,0.96))]" />
      <ERPTopbar
        role={role}
        userName={user.fullName || user.email}
        tenantName={tenantDisplayName || companyName || undefined}
        workspaceName={workspaceName}
        financialYearLabel={financialYearLabel || undefined}
        workspaceStatus={shellStatus}
        onMenuClick={() => setMobileOpen(true)}
        onLogout={() => void logout()}
        onSearchOpen={() => setCommandOpen(true)}
      />
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <AppSidebar role={role} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <main className="erp-shell-main">
            <div className="erp-shell-content-wrap flex w-full flex-col gap-3.5">
              {children}
            </div>
          </main>
        </div>
      </div>
      <GlobalSearchCommand open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
