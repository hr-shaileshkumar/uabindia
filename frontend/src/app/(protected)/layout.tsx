"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/erp/app-sidebar";
import { ERPTopbar } from "@/components/erp/topbar";
import { WorkspaceStatusPanel } from "@/components/erp/workspace-status-panel";
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
    refresh,
    navigationReady,
    routeRulesReady,
    requiresSetup,
  } = useUiSchema();
  const { companyName, projectName, financialYearLabel } = useOrgContext();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
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

  const matchedRouteRule = useMemo(() => {
    if (!schemaConfigured || isShellExemptPath(pathname)) {
      return null;
    }

    return getSchemaRouteRule(pathname, routeRules.rules);
  }, [pathname, routeRules.rules, schemaConfigured]);

  const routeAllowed = useMemo(() => {
    if (isShellExemptPath(pathname)) {
      return true;
    }

    if (!schemaConfigured) {
      return canManageWorkspaceSetup;
    }

    if (matchedRouteRule && !enabledModuleKeys.has(matchedRouteRule.moduleKey.toLowerCase())) {
      return false;
    }

    return !!matchedRouteRule;
  }, [canManageWorkspaceSetup, enabledModuleKeys, matchedRouteRule, pathname, schemaConfigured]);

  useEffect(() => {
    if (loading || permissionsLoading || schemaLoading) return;

    if (!user) {
      const audience = matchesAnyPrefix(pathname, OWNER_PATH_PREFIXES) ? "platform" : "tenant";
      router.replace(withPublicAudience(`/login?next=${encodeURIComponent(pathname)}`, audience));
      return;
    }

    if (permissionFetchFailed) {
      router.replace(`/not-authorized?reason=${PERMISSIONS_UNAVAILABLE_REASON}`);
      return;
    }

    if (schemaError && !canManageWorkspaceSetup && !isShellExemptPath(pathname)) {
      router.replace(`/not-authorized?reason=${NAVIGATION_ERROR_REASON}`);
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
    permissionFetchFailed,
    permissionsLoading,
    routeAllowed,
    router,
    hasEnabledModules,
    schemaConfigured,
    schemaError,
    schemaLoading,
    requiresSetup,
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

  if (loading || permissionsLoading || schemaLoading || !user || permissionFetchFailed) {
    return null;
  }

  if (schemaConfigured && !routeAllowed) {
    return null;
  }

  const showSetupPanel = !isShellExemptPath(pathname) && canManageWorkspaceSetup && (schemaError || requiresSetup || !hasEnabledModules);
  const workspaceName =
    projectName ||
    companyName ||
    (role === "super_admin" ? "Global operations" : enabledModules[0]?.displayName || "Default workspace");
  const setupDetail = schemaError
    ? schemaError
    : enabledModules.length > 0
      ? `Enabled modules: ${enabledModules.map((module) => module.displayName || module.name || module.key).join(", ")}`
      : "No modules are enabled for this tenant.";

  return (
    <div className={`flex min-h-screen ${portal.shellClassName}`}>
      <AppSidebar role={role} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <ERPTopbar
          role={role}
          userName={user.fullName || user.email}
          tenantName={tenantDisplayName || companyName || undefined}
          workspaceName={workspaceName}
          financialYearLabel={financialYearLabel || undefined}
          onMenuClick={() => setMobileOpen(true)}
          onLogout={() => void logout()}
        />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1600px] px-4 py-6 lg:px-6">
            {showSetupPanel ? (
              <WorkspaceStatusPanel
                tone={schemaError ? "critical" : "warning"}
                title={
                  schemaError
                    ? "Workspace navigation failed to load"
                    : hasEnabledModules
                      ? "Backend workspace setup is incomplete"
                      : "No workspace modules are enabled"
                }
                description={
                  schemaError
                    ? "The shell could not load backend navigation, route rules, or module metadata for this session."
                    : hasEnabledModules
                      ? "This tenant has enabled modules, but backend `/ui-shell/navigation` and `/ui-shell/route-rules` are not fully configured yet."
                      : "The authenticated user reached a protected shell, but the tenant has no enabled modules to render."
                }
                detail={setupDetail}
                actionLabel={pathname === "/platform/module-mapping" ? undefined : "Open navigation registry"}
                actionHref={pathname === "/platform/module-mapping" ? undefined : "/platform/module-mapping"}
                onRetry={() => void refresh()}
              />
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
