"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useOrgContext } from "@/context/OrgContext";
import { useTenantConfig } from "@/context/TenantConfigContext";
import { usePermissions } from "@/context/PermissionContext";
import { useUiSchema } from "@/context/UiSchemaContext";
import { hrApi } from "@/services/hrApi";
import { Module } from "@/types";
import { canonicalizeProtectedPath, getRoutePermissionKeys, getRoutePermissionRule, type ModuleKey } from "@/config/route-permissions.config";
import moduleNavigationMap, { getSubModulesForModule as cfgGetSubModules, resolveModuleNavigationKey } from "./module-navigation";
import { getNormalizedRoleSet } from "@/lib/auth/role-utils";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import Topbar from "@/components/Topbar";
import Sidebar from "../../components/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import Breadcrumbs from "@/components/Breadcrumbs";
import { PageErrorBoundary } from "@/components/ErrorBoundary";
import { ROUTES } from "@/constants/routes";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout, isSuperAdmin } = useAuth();
  const { companyId: ctxCompanyId, projectId: ctxProjectId, financialYearKey: ctxFinancialYearKey } = useOrgContext();
  const { hasPermission, loading: permissionsLoading, fetchFailed: permissionsFetchFailed, refresh: refreshPermissions } = usePermissions();
  const { featureFlags, loading: configLoading } = useTenantConfig();
  const { navigation, routeRules, loading: schemaLoading } = useUiSchema();
  const router = useRouter();
  const pathname = usePathname();
  const [modules, setModules] = useState<Module[]>([]);
  const [modulesLoading, setModulesLoading] = useState(true);
  const [appVersion, setAppVersion] = useState("1.0.0");
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeModuleKey, setActiveModuleKey] = useState<string | null>(null);
  const [guardBlocked, setGuardBlocked] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [sidebarNavQuery, setSidebarNavQuery] = useState("");
  const orgContextRenderKey = `${ctxCompanyId || "none"}:${ctxProjectId || "none"}:${ctxFinancialYearKey || "none"}`;
  const [lastContextRefreshAt, setLastContextRefreshAt] = useState<Date | null>(null);
  const showOrgDebugPanel = process.env.NODE_ENV !== "production";

  useEffect(() => {
    const handleContextChanged = () => {
      setLastContextRefreshAt(new Date());
    };

    if (typeof window === "undefined") return;
    window.addEventListener("erp:org-context-changed", handleContextChanged);
    return () => window.removeEventListener("erp:org-context-changed", handleContextChanged);
  }, []);

  const isBusinessRoute = useMemo(
    () =>
      pathname.startsWith("/erp") ||
      pathname.startsWith("/platform") ||
      pathname.startsWith("/superadmin") ||
      [
        "/dashboard",
        "/platform",
        "/superadmin",
        "/hrms",
        "/payroll",
        "/reports",
        "/notifications",
        "/documents",
        "/customers",
        "/vendors",
        "/items",
        "/sales-orders",
        "/purchase-orders",
        "/chart-of-accounts",
        "/journal-entries",
        "/payments",
        "/warehouses",
        "/stock-movements",
        "/approvals",
        "/licensing",
        "/security",
      ].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)),
    [pathname]
  );

  const userRoleSet = useMemo(
    () => getNormalizedRoleSet([...(user?.roles || []), user?.role]),
    [user]
  );

  const isAdminUser = useMemo(() => {
    if (isSuperAdmin) return true;
    return userRoleSet.has("admin") || userRoleSet.has("tenantadmin") || userRoleSet.has("tenant admin");
  }, [isSuperAdmin, userRoleSet]);

  const shellVariant: "admin" | "user" | "superadmin" = isSuperAdmin ? "superadmin" : isAdminUser ? "admin" : "user";

  const MODULE_FALLBACK_META = useMemo<Record<string, { name: string; displayName: string; description: string; icon: string; basePath: string }>>(() => ({
    operations:      { name: "Workspace",    displayName: "Workspace",    description: "Shared workspace — dashboard, approvals, notifications, and documents.", icon: "dashboard",    basePath: ROUTES.DASHBOARD },
    erp_finance:     { name: "Finance",        displayName: "Finance",        description: "Chart of accounts, journals, payments, invoices, expenses, and tax.",  icon: "bank",        basePath: ROUTES.CHART_OF_ACCOUNTS },
    erp_procurement: { name: "Procurement",    displayName: "Procurement",    description: "Vendors, purchase requests, purchase orders, and GRN.",               icon: "truck",       basePath: ROUTES.VENDORS },
    erp_sales:       { name: "Sales & CRM",    displayName: "Sales & CRM",    description: "Customers, quotations, sales orders, and returns.",                   icon: "shopping-bag", basePath: ROUTES.CUSTOMERS },
    erp_inventory:   { name: "Inventory",      displayName: "Inventory",      description: "Items, warehouses, stock movements, adjustments, and transfers.",    icon: "warehouse",   basePath: ROUTES.ITEMS },
    hrms:            { name: "HRMS",           displayName: "HRMS",           description: "Core HR, attendance, leave, recruitment, and performance.",           icon: "employees",   basePath: ROUTES.HRMS_HOME },
    payroll:         { name: "Payroll",        displayName: "Payroll",        description: "Payroll runs, setup, compliance, and statutory reports.",            icon: "credit-card", basePath: ROUTES.PAYROLL_HOME },
    reports:         { name: "Analytics & Reports",        displayName: "Analytics & Reports",        description: "Cross-module analytics and reporting for HR, payroll, inventory, and compliance.",                        icon: "bar-chart",   basePath: ROUTES.REPORTS_HOME },
    platform:        { name: "Admin Console",  displayName: "Admin Console",  description: "Tenant management, access control, configuration, and monitoring.", icon: "settings",    basePath: ROUTES.PLATFORM_HOME },
    licensing:       { name: "Licensing",      displayName: "Licensing",      description: "Module catalog, subscriptions, billing, and integrations.",         icon: "layers",      basePath: ROUTES.LICENSING_HOME },
    security:        { name: "Security",       displayName: "Security",       description: "Sessions, MFA, SSO, devices, and password policies.",                icon: "shield",      basePath: ROUTES.SECURITY_HOME },
    integrations:    { name: "Integrations",   displayName: "Integrations",   description: "API keys, webhooks, third-party apps, and integration logs.",       icon: "plug",        basePath: ROUTES.INTEGRATIONS_HOME },
    helpdesk:        { name: "Helpdesk",       displayName: "Helpdesk",       description: "Support tickets, escalations, and FAQs.",                           icon: "ticket",      basePath: ROUTES.HELPDESK_HOME },
    communication:   { name: "Communication",  displayName: "Communication",  description: "Announcements, email/SMS templates, and notifications.",            icon: "megaphone",   basePath: ROUTES.COMMUNICATION_HOME },
  }), []);

  const enabledModules = useMemo(() => new Set(modules.map((m) => m.key)), [modules]);
  const hasModule = useCallback((key: string) => enabledModules.has(key), [enabledModules]);

  const getModuleKeyFromPath = useCallback((path: string) => {
    const canonicalPath = canonicalizeProtectedPath(path);

    let matchedRule: { pathPattern: string; moduleKey: string } | undefined;
    for (const rule of routeRules.rules) {
      const rulePath = canonicalizeProtectedPath(rule.pathPattern);
      const exact = canonicalPath === rulePath;
      const nested = canonicalPath.startsWith(`${rulePath}/`);
      if (!exact && !nested) continue;
      if (!matchedRule || rulePath.length > matchedRule.pathPattern.length) {
        matchedRule = { pathPattern: rulePath, moduleKey: rule.moduleKey };
      }
    }

    if (matchedRule?.moduleKey) {
      return resolveModuleNavigationKey(matchedRule.moduleKey);
    }

    const fallbackRule = getRoutePermissionRule(canonicalPath);
    if (fallbackRule?.moduleKey) {
      return resolveModuleNavigationKey(fallbackRule.moduleKey);
    }

    if (canonicalPath.startsWith("/erp/licensing") || canonicalPath.startsWith("/licensing")) return "licensing";
    if (canonicalPath.startsWith("/erp/security") || canonicalPath.startsWith("/security")) return "security";
    if (canonicalPath.startsWith("/erp/integrations") || canonicalPath.startsWith("/integrations")) return "integrations";
    if (canonicalPath.startsWith("/erp/helpdesk") || canonicalPath.startsWith("/helpdesk")) return "helpdesk";
    if (canonicalPath.startsWith("/erp/communication") || canonicalPath.startsWith("/communication")) return "communication";
    if (canonicalPath.startsWith("/erp/hrms") || canonicalPath.startsWith("/hrms")) return "hrms";
    if (canonicalPath.startsWith("/erp/payroll") || canonicalPath.startsWith("/payroll")) return "payroll";
    if (canonicalPath.startsWith("/erp/reports") || canonicalPath.startsWith("/reports")) return "reports";
    if (canonicalPath.startsWith("/superadmin")) return "platform";
    if (canonicalPath.startsWith("/platform")) return "platform";
    if (
      canonicalPath.startsWith("/erp") ||
      canonicalPath.startsWith("/dashboard") ||
      canonicalPath.startsWith("/notifications") ||
      canonicalPath.startsWith("/documents") ||
      canonicalPath.startsWith("/customers") ||
      canonicalPath.startsWith("/vendors") ||
      canonicalPath.startsWith("/items") ||
      canonicalPath.startsWith("/sales-orders") ||
      canonicalPath.startsWith("/purchase-orders") ||
      canonicalPath.startsWith("/chart-of-accounts") ||
      canonicalPath.startsWith("/journal-entries") ||
      canonicalPath.startsWith("/payments") ||
      canonicalPath.startsWith("/warehouses") ||
      canonicalPath.startsWith("/stock-movements") ||
      canonicalPath.startsWith("/approvals")
    ) return "operations";
    return null;
  }, [routeRules.rules]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  const featureFlagMap = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const flag of featureFlags || []) {
      if (!flag?.featureKey) continue;
      map.set(flag.featureKey.toLowerCase(), !!flag.isEnabled);
    }
    return map;
  }, [featureFlags]);

  const toFeatureKey = useCallback((path: string) =>
    path
      .replace(/^\/+/, "")
      .replace(/\/+/g, ".")
      .replace(/[^a-zA-Z0-9._-]/g, "")
      .toLowerCase(),
  []);

  const isFeatureAllowed = useCallback((keys: string[]) => {
    for (const key of keys) {
      const normalized = key.toLowerCase();
      if (!featureFlagMap.has(normalized)) continue;
      if (featureFlagMap.get(normalized) === false) {
        return false;
      }
    }
    return true;
  }, [featureFlagMap]);

  const modulePermissionKeys = useCallback((moduleKey: string) => {
    const keys = [
      `module:${moduleKey}`,
      `${moduleKey}.*`,
      `${moduleKey}.view`,
      `resource:${moduleKey}.view`,
    ];

    if (moduleKey === "operations") {
      keys.push("module:erp", "erp.*", "erp.view", "resource:erp.view");
    }

    if (moduleKey.startsWith("erp_")) {
      keys.push("module:erp", "erp.*", "erp.view", "resource:erp.view");
    }

    if (moduleKey === "platform") {
      keys.push("module:admin", "admin.*", "admin.view", "resource:admin.view");
    }

    return [...new Set(keys)];
  }, []);

  const getBackendRouteRule = useCallback((path: string) => {
    const canonicalPath = canonicalizeProtectedPath(path);
    let bestMatch: { pathPattern: string; moduleKey: string; permissionKeys: string[] } | undefined;

    for (const rule of routeRules.rules) {
      const rulePath = canonicalizeProtectedPath(rule.pathPattern);
      const exact = canonicalPath === rulePath;
      const nested = canonicalPath.startsWith(`${rulePath}/`);
      if (!exact && !nested) continue;

      if (!bestMatch || rulePath.length > bestMatch.pathPattern.length) {
        bestMatch = rule;
      }
    }

    return bestMatch;
  }, [routeRules.rules]);

  const pagePermissionKeys = useCallback((moduleKey: string, path: string) => {
    const canonicalPath = canonicalizeProtectedPath(path);
    const backendRule = getBackendRouteRule(canonicalPath);

    if (!backendRule) {
      return getRoutePermissionKeys(canonicalPath, moduleKey as ModuleKey);
    }

    const normalizedPath = toFeatureKey(canonicalPath);
    const resolvedModuleKey = backendRule.moduleKey || moduleKey;

    return [...new Set([
      ...backendRule.permissionKeys,
      `page:${normalizedPath}`,
      `path:${normalizedPath}`,
      normalizedPath,
      `resource:${normalizedPath}.view`,
      `module:${resolvedModuleKey}`,
      `${resolvedModuleKey}.*`,
      `${resolvedModuleKey}.view`,
      `resource:${resolvedModuleKey}.view`,
    ])];
  }, [getBackendRouteRule, toFeatureKey]);

  useEffect(() => {
    if (loading || permissionsLoading) return;
    if (!user) return;
    if (isSuperAdmin) return;
    if (permissionsFetchFailed) return;
    const canonicalPath = canonicalizeProtectedPath(pathname);
    const moduleKey = getModuleKeyFromPath(canonicalPath);
    if (!moduleKey) return;
    const hasPermissionAccess = hasPermission(pagePermissionKeys(moduleKey, canonicalPath));

    if (!hasPermissionAccess) {
      router.replace("/not-authorized");
    }
  }, [loading, permissionsLoading, permissionsFetchFailed, user, isSuperAdmin, pathname, getModuleKeyFromPath, hasPermission, pagePermissionKeys, router]);

  const isSidebarModuleAllowed = useCallback((moduleKey: string) => {
    if (isSuperAdmin) return true;
    if (permissionsFetchFailed) {
      return isFeatureAllowed([moduleKey, `module:${moduleKey}`]);
    }
    const hasPermissionAccess = hasPermission(modulePermissionKeys(moduleKey));

    return isFeatureAllowed([moduleKey, `module:${moduleKey}`]) &&
      hasPermissionAccess;
  }, [isSuperAdmin, permissionsFetchFailed, isFeatureAllowed, hasPermission, modulePermissionKeys]);

  const isSidebarPageAllowed = useCallback((moduleKey: string, path: string) => {
    if (isSuperAdmin) return true;
    const canonicalPath = canonicalizeProtectedPath(path);
    if (permissionsFetchFailed) {
      const normalizedPath = toFeatureKey(canonicalPath);
      return isFeatureAllowed([
        moduleKey,
        `module:${moduleKey}`,
        `page:${normalizedPath}`,
        normalizedPath,
      ]);
    }
    const hasPermissionAccess = hasPermission(pagePermissionKeys(moduleKey, canonicalPath));

    const normalizedPath = toFeatureKey(canonicalPath);
    return isFeatureAllowed([
      moduleKey,
      `module:${moduleKey}`,
      `page:${normalizedPath}`,
      normalizedPath,
    ]) && hasPermissionAccess;
  }, [isSuperAdmin, permissionsFetchFailed, isFeatureAllowed, toFeatureKey, hasPermission, pagePermissionKeys]);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("activeModuleKey") : null;
    const fromPath = getModuleKeyFromPath(pathname);
    setActiveModuleKey(fromPath || stored || "operations");
  }, [pathname, getModuleKeyFromPath]);

  // Helper: Get sub-modules/pages for each module (from config)
  type SubModuleLink = {
    key: string;
    name: string;
    path: string;
    icon?: string;
    group?: string;
  };

  type BackendModule = {
    key: string;
    name: string;
    displayName?: string;
    description?: string;
    icon?: string;
    basePath?: string;
    sortOrder?: number;
  };

  const getSubModulesForModule = useCallback((moduleKey: string) => {
    const schemaModule = navigation.modules.find((module) => module.key === moduleKey);
    if (schemaModule && schemaModule.groups.length > 0) {
      return schemaModule.groups
        .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label))
        .flatMap((group) =>
          group.items
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
            .map((item) => ({
              key: item.key,
              name: item.name,
              path: item.path,
              icon: item.icon ?? undefined,
              group: group.label,
              order: item.sortOrder,
            }))
        ) as SubModuleLink[];
    }

    return cfgGetSubModules(moduleKey) as SubModuleLink[];
  }, [navigation.modules]);

  useEffect(() => {
    const fetchModulesAndVersion = async () => {
      if (!user) return;
      try {
        setModulesLoading(true);
        
        // Fetch modules from backend
        const modulesRes = await hrApi.modules.getEnabled();
        const modulesData = (modulesRes.data.modules || []) as BackendModule[];
        
        // Transform backend modules to include routing
        const transformedModulesMap = new Map<string, Module>();

        modulesData.forEach((module) => {
          const normalizedKey = resolveModuleNavigationKey(module.key);
          const normalizedSubModules = getSubModulesForModule(normalizedKey);

          const existing = transformedModulesMap.get(normalizedKey);
          if (!existing) {
            transformedModulesMap.set(normalizedKey, {
              key: normalizedKey,
              name: module.name,
              displayName: module.displayName,
              icon: MODULE_FALLBACK_META[normalizedKey]?.icon || "grid",
              description: module.description,
              basePath: module.basePath,
              isEnabled: true,
              order: module.sortOrder,
              subModules: normalizedSubModules,
            });
            return;
          }

          const mergedSubModules = [
            ...(existing.subModules || []),
            ...normalizedSubModules,
          ].filter((item, index, arr) => arr.findIndex((entry) => entry.path === item.path) === index);

          transformedModulesMap.set(normalizedKey, {
            ...existing,
            displayName: existing.displayName || module.displayName,
            description: existing.description || module.description,
            basePath: existing.basePath || module.basePath,
            icon: existing.icon || MODULE_FALLBACK_META[normalizedKey]?.icon || "grid",
            order: Math.min(existing.order ?? Number.MAX_SAFE_INTEGER, module.sortOrder ?? Number.MAX_SAFE_INTEGER),
            subModules: mergedSubModules,
          });
        });

        const candidateModuleKeys = new Set<string>([
          ...Object.keys(moduleNavigationMap),
          ...modulesData.map((module) => resolveModuleNavigationKey(module.key)),
        ]);

        candidateModuleKeys.forEach((moduleKey) => {
          if (transformedModulesMap.has(moduleKey)) return;

          const subModules = getSubModulesForModule(moduleKey);
          if (subModules.length === 0) return;

          const fallbackMeta = MODULE_FALLBACK_META[moduleKey] || {
            name: moduleKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            displayName: moduleKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            description: "Workspace and tools",
            icon: "grid",
            basePath: subModules[0]?.path || ROUTES.DASHBOARD,
          };

          transformedModulesMap.set(moduleKey, {
            key: moduleKey,
            name: fallbackMeta.name,
            displayName: fallbackMeta.displayName,
            icon: MODULE_FALLBACK_META[moduleKey]?.icon || "grid",
            description: fallbackMeta.description,
            basePath: fallbackMeta.basePath,
            isEnabled: true,
            order: Number.MAX_SAFE_INTEGER,
            subModules,
          });
        });

        const transformedModules: Module[] = [...transformedModulesMap.values()];

        setModules(transformedModules);

        // Fetch app version
        try {
          const versionRes = await hrApi.system.getVersion();
          setAppVersion(versionRes.version || "1.0.0");
        } catch {
          // Version fetch failed, use default
        }
      } catch (error) {
        notifyError(getApiErrorMessage(error, "Failed to load module configuration."), "Modules");
        setModules([]);
      } finally {
        setModulesLoading(false);
      }
    };

    fetchModulesAndVersion();
  }, [user, refreshKey, getSubModulesForModule, MODULE_FALLBACK_META]);

  const visibleModules = useMemo(() => {
    return modules
      .filter((module) => module.isEnabled)
      .map((module) => {
        const subModules = module.subModules || [];
        const filteredSubModules = subModules.filter((sub) => isSidebarPageAllowed(module.key, sub.path));

        const moduleAllowedByPermission = isSidebarModuleAllowed(module.key);
        const moduleAllowedByPages = filteredSubModules.length > 0;

        if (!moduleAllowedByPermission && !moduleAllowedByPages) {
          return null;
        }

        return {
          ...module,
          subModules: filteredSubModules,
        } as Module;
      })
      .filter((module): module is Module => Boolean(module))
      .filter((module) => (module.subModules?.length ?? 0) > 0 || !module.subModules?.length);
  }, [modules, isSidebarModuleAllowed, isSidebarPageAllowed]);

  const shellModules = useMemo(() => {
    if (shellVariant === "admin" || shellVariant === "superadmin") {
      return visibleModules;
    }

    const userAllowedModuleKeys = new Set(["operations", "hrms", "payroll", "reports"]);
    return visibleModules.filter((module) => userAllowedModuleKeys.has(module.key));
  }, [visibleModules, shellVariant]);

  const pageAccessAllowed = useMemo(() => {
    if (!user || loading || permissionsLoading) return true;
    if (permissionsFetchFailed) return true;

    const canonicalPath = canonicalizeProtectedPath(pathname);
    const moduleKey = getModuleKeyFromPath(canonicalPath);
    if (!moduleKey) return true;

    const hasPermissionAccess = hasPermission(pagePermissionKeys(moduleKey, canonicalPath));
    return hasPermissionAccess;
  }, [user, loading, permissionsLoading, permissionsFetchFailed, pathname, getModuleKeyFromPath, hasPermission, pagePermissionKeys]);

  useEffect(() => {
    if (loading || !user) return;
    if (isSuperAdmin) {
      if (guardBlocked) {
        setGuardBlocked(false);
      }
      return;
    }
    if (modulesLoading || configLoading) return;

    const moduleKey = getModuleKeyFromPath(canonicalizeProtectedPath(pathname));
    if (moduleKey && !hasModule(moduleKey)) {
      setGuardBlocked(true);
      router.replace("/not-authorized");
      return;
    }

    const normalizedPath = toFeatureKey(pathname);
    const featureKeys = [
      moduleKey ? moduleKey : "",
      moduleKey ? `module:${moduleKey}` : "",
      normalizedPath ? `page:${normalizedPath}` : "",
      normalizedPath,
    ].filter(Boolean);

    if (!isFeatureAllowed(featureKeys)) {
      setGuardBlocked(true);
      router.replace("/not-authorized");
      return;
    }

    if (guardBlocked) {
      setGuardBlocked(false);
    }
  }, [
    loading,
    user,
    isSuperAdmin,
    modulesLoading,
    configLoading,
    pathname,
    hasModule,
    getModuleKeyFromPath,
    toFeatureKey,
    isFeatureAllowed,
    router,
    guardBlocked,
  ]);

  const navigateToModuleHome = useCallback((key: string) => {
    const selectedModule = visibleModules.find((module) => module.key === key);
    const target =
      selectedModule?.basePath ||
      selectedModule?.subModules?.[0]?.path ||
      (key === "hrms" ? ROUTES.HRMS_HOME :
      key === "payroll" ? ROUTES.PAYROLL_HOME :
      key === "reports" ? ROUTES.REPORTS_HOME :
      key === "platform" ? ROUTES.PLATFORM_HOME :
      key === "licensing" ? "/erp/licensing" :
      key === "security" ? "/erp/security" :
      ROUTES.DASHBOARD);

    router.push(target);
  }, [router, visibleModules]);

  if (loading || !user) return null;

  if (modulesLoading || configLoading || schemaLoading || guardBlocked) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Global Topbar */}
      <Topbar
        user={user}
        modules={shellModules}
        appVersion={appVersion}
        variant={shellVariant}
        onRefresh={() => setRefreshKey((prev) => prev + 1)}
        onLogout={logout}
        onOpenSidebar={() => setIsMobileSidebarOpen(true)}
        onSearchChange={(q) => setSidebarNavQuery(q)}
      />

      {isBusinessRoute && (
        <Sidebar
          modules={shellModules}
          isLoading={modulesLoading}
          variant={shellVariant}
          activeModuleKey={activeModuleKey}
          mobileMode
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          navQuery={sidebarNavQuery}
          onModuleChange={(key: string) => {
            setActiveModuleKey(key);
            if (typeof window !== "undefined") {
              window.localStorage.setItem("activeModuleKey", key);
            }
            navigateToModuleHome(key);
          }}
        />
      )}

      {permissionsFetchFailed && (
        <div className="mx-6 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <div className="flex items-center justify-between gap-3">
            <p>
              Permission sync is temporarily unavailable. Some modules may be hidden until access is refreshed.
            </p>
            <button
              type="button"
              onClick={() => {
                void refreshPermissions();
              }}
              className="whitespace-nowrap rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* App Shell: Sidebar + Content */}
      <div className="flex min-h-0 flex-1">
        {isBusinessRoute && (
          <div className="hidden lg:block">
            <Sidebar
              modules={shellModules}
              isLoading={modulesLoading}
              variant={shellVariant}
              activeModuleKey={activeModuleKey}
              navQuery={sidebarNavQuery}
              onModuleChange={(key: string) => {
                setActiveModuleKey(key);
                if (typeof window !== "undefined") {
                  window.localStorage.setItem("activeModuleKey", key);
                }
                navigateToModuleHome(key);
              }}
            />
          </div>
        )}

        {/* Content Area */}
        <main className="erp-shell-main">
          <div className="erp-shell-content-wrap">
            <Breadcrumbs />
            <div className="erp-content-surface">
              <ProtectedRoute
                allowed={pageAccessAllowed}
                loading={loading || permissionsLoading || modulesLoading || configLoading}
                redirectTo="/not-authorized"
              >
                <PageErrorBoundary>
                  <div key={orgContextRenderKey}>{children}</div>
                </PageErrorBoundary>
              </ProtectedRoute>
            </div>
          </div>
        </main>
      </div>

      {showOrgDebugPanel && (
        <div className="fixed bottom-3 right-3 z-70 w-[min(92vw,22rem)] rounded-lg border border-slate-300 bg-white/95 p-3 text-[11px] shadow-lg backdrop-blur-sm">
          <p className="mb-2 text-xs font-semibold text-slate-800">Org Context Debug</p>
          <div className="space-y-1 text-slate-700">
            <p><span className="font-medium">Company:</span> {ctxCompanyId || "none"}</p>
            <p><span className="font-medium">Project:</span> {ctxProjectId || "none"}</p>
            <p><span className="font-medium">FY:</span> {ctxFinancialYearKey || "none"}</p>
            <p>
              <span className="font-medium">Last refresh:</span>{" "}
              {lastContextRefreshAt ? lastContextRefreshAt.toLocaleTimeString() : "not yet"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
