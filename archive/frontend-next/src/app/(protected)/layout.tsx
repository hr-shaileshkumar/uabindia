"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, type AuthUser } from "@/context/AuthContext";
import { useTenantConfig } from "@/context/TenantConfigContext";
import { useOrgContext } from "@/context/OrgContext";
import { usePermissions } from "@/context/PermissionContext";
import { hrApi } from "@/lib/hrApi";
import { Module } from "@/types";
import { hasModuleAccess, hasPageAccess } from "@/config/role-permissions.config";
import { getSubModulesForModule as cfgGetSubModules } from "@/config/modules.config";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const { hasContext } = useOrgContext();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const { featureFlags, loading: configLoading } = useTenantConfig();
  const router = useRouter();
  const pathname = usePathname();
  const [modules, setModules] = useState<Module[]>([]);
  const [modulesLoading, setModulesLoading] = useState(true);
  const [appVersion, setAppVersion] = useState("1.0.0");
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeModuleKey, setActiveModuleKey] = useState<string | null>(null);
  const [guardBlocked, setGuardBlocked] = useState(false);
  const isErpRoute = pathname.startsWith("/erp");

  const frozenModuleKeys = useMemo(
    () => new Set(["erp", "hrms", "payroll", "reports", "platform", "licensing", "security"]),
    []
  );


  const enabledModules = useMemo(() => new Set(modules.map((m) => m.key)), [modules]);
  const hasModule = useCallback((key: string) => enabledModules.has(key), [enabledModules]);

  const getModuleKeyFromPath = useCallback((path: string) => {
    if (path.startsWith("/erp/hrms")) return "hrms";
    if (path.startsWith("/erp/payroll")) return "payroll";
    if (path.startsWith("/erp/reports")) return "reports";
    if (path.startsWith("/erp")) return "erp";
    if (path.startsWith("/platform")) return "platform";
    if (path.startsWith("/licensing")) return "licensing";
    if (path.startsWith("/security")) return "security";
    return null;
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  const userRoles = useMemo(() => (user as AuthUser | null)?.roles || [], [user]);

  const isAdmin = useMemo(() => {
    return userRoles.some((role) =>
      ["admin", "super admin", "administrator", "systemadmin"].includes(role.toLowerCase())
    );
  }, [userRoles]);

  useEffect(() => {
    if (loading || !user) return;
    if (!isErpRoute) return;
    if (pathname === "/context") return;
    if (isAdmin) return;
    if (!hasContext) {
      router.replace("/context");
    }
  }, [loading, user, isErpRoute, pathname, isAdmin, hasContext, router]);

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

  const modulePermissionKeys = useCallback((moduleKey: string) => ([
    `module:${moduleKey}`,
    `${moduleKey}.*`,
    `${moduleKey}.view`,
    `resource:${moduleKey}.view`,
  ]), []);

  const pagePermissionKeys = useCallback((moduleKey: string, path: string) => {
    const normalizedPath = toFeatureKey(path);
    return [
      `page:${normalizedPath}`,
      `path:${normalizedPath}`,
      normalizedPath,
      `resource:${normalizedPath}.view`,
      ...modulePermissionKeys(moduleKey),
    ];
  }, [toFeatureKey, modulePermissionKeys]);

  useEffect(() => {
    if (loading || permissionsLoading) return;
    if (!user) return;
    if (pathname === "/context") return;
    const moduleKey = getModuleKeyFromPath(pathname);
    if (!moduleKey) return;
    if (isAdmin) return;

    // Check role-based access
    const hasRoleAccess = userRoles.some(role => hasPageAccess(role, pathname));
    if (!hasRoleAccess) {
      router.replace("/not-authorized");
      return;
    }

    const allowed = hasPermission(pagePermissionKeys(moduleKey, pathname));
    if (!allowed) {
      router.replace("/not-authorized");
    }
  }, [loading, permissionsLoading, user, pathname, getModuleKeyFromPath, isAdmin, hasPermission, pagePermissionKeys, router, userRoles]);

  const isSidebarModuleAllowed = useCallback((moduleKey: string) => {
    // Check role-based access first
    const hasRoleAccess = userRoles.some(role => hasModuleAccess(role, moduleKey));
    if (!hasRoleAccess) return false;

    // Then check feature flags and permissions
    return isFeatureAllowed([moduleKey, `module:${moduleKey}`]) &&
      hasPermission(modulePermissionKeys(moduleKey));
  }, [isFeatureAllowed, hasPermission, modulePermissionKeys, userRoles]);

  const isSidebarPageAllowed = useCallback((moduleKey: string, path: string) => {
    // Check role-based access first
    const hasRoleAccess = userRoles.some(role => hasPageAccess(role, path));
    if (!hasRoleAccess) return false;

    const normalizedPath = toFeatureKey(path);
    return isFeatureAllowed([
      moduleKey,
      `module:${moduleKey}`,
      `page:${normalizedPath}`,
      normalizedPath,
    ]) && hasPermission(pagePermissionKeys(moduleKey, path));
  }, [isFeatureAllowed, toFeatureKey, hasPermission, pagePermissionKeys, userRoles]);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("activeModuleKey") : null;
    const fromPath = getModuleKeyFromPath(pathname);
    setActiveModuleKey(fromPath || stored || "erp");
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
  };

  const getSubModulesForModule = useCallback((moduleKey: string) => {
    return cfgGetSubModules(moduleKey) as SubModuleLink[];
  }, []);

  useEffect(() => {
    const fetchModulesAndVersion = async () => {
      if (!user) return;
      try {
        setModulesLoading(true);
        
        // Fetch modules from backend
        const modulesRes = await hrApi.modules.getEnabled();
        const modulesData = (modulesRes.data.modules || []) as BackendModule[];
        const filteredModules = modulesData.filter((module) => frozenModuleKeys.has(module.key));
        
        // Transform backend modules to include routing
        const transformedModules: Module[] = filteredModules.map((module) => ({
          key: module.key,
          name: module.name,
          isEnabled: true,
          subModules: getSubModulesForModule(module.key),
        }));
        
        setModules(transformedModules);

        // Fetch app version
        try {
          const versionRes = await hrApi.system.getVersion();
          setAppVersion(versionRes.version || "1.0.0");
        } catch {
          // Version fetch failed, use default
        }
      } catch (error) {
        console.error("Failed to fetch modules:", error);
        setModules([]);
      } finally {
        setModulesLoading(false);
      }
    };

    fetchModulesAndVersion();
  }, [user, refreshKey, frozenModuleKeys, getSubModulesForModule]);

  const visibleModules = useMemo(() => {
    return modules
      .filter((module) => module.isEnabled && isSidebarModuleAllowed(module.key))
      .map((module) => {
        if (!module.subModules || module.subModules.length === 0) return module;
        const filteredSubModules = module.subModules.filter((sub) =>
          isSidebarPageAllowed(module.key, sub.path)
        );
        return { ...module, subModules: filteredSubModules };
      })
      .filter((module) => (module.subModules?.length ?? 0) > 0 || !module.subModules?.length);
  }, [modules, isSidebarModuleAllowed, isSidebarPageAllowed]);

  useEffect(() => {
    if (loading || !user) return;
    if (modulesLoading || configLoading) return;

    const moduleKey = getModuleKeyFromPath(pathname);
    if (moduleKey && !hasModule(moduleKey)) {
      setGuardBlocked(true);
      router.replace("/not-authorized");
      return;
    }

    const adminOnlyModules = new Set(["platform", "licensing", "security"]);
    if (moduleKey && adminOnlyModules.has(moduleKey) && !isAdmin) {
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
    modulesLoading,
    configLoading,
    pathname,
    isAdmin,
    hasModule,
    getModuleKeyFromPath,
    toFeatureKey,
    isFeatureAllowed,
    router,
    guardBlocked,
  ]);

  if (loading || !user || modulesLoading || configLoading || guardBlocked) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Global Topbar */}
      <Topbar
        user={user}
        modules={visibleModules}
        appVersion={appVersion}
        onRefresh={() => setRefreshKey((prev) => prev + 1)}
        onLogout={logout}
      />

      {/* App Shell: Sidebar + Content */}
      <div className="flex h-[calc(100vh-64px)]">
        {isErpRoute && (
          <Sidebar
            modules={visibleModules}
            isLoading={modulesLoading}
            activeModuleKey={activeModuleKey}
            onModuleChange={(key) => {
              setActiveModuleKey(key);
              if (typeof window !== "undefined") {
                window.localStorage.setItem("activeModuleKey", key);
              }
              if (key === "hrms") router.push("/erp/hrms");
              else if (key === "payroll") router.push("/erp/payroll");
              else if (key === "reports") router.push("/erp/reports");
              else if (key === "erp") router.push("/erp");
            }}
          />
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
