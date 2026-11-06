"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionContext";
import { useUiSchema } from "@/context/UiSchemaContext";
import { getSchemaRouteRule } from "@/lib/workspace/route-access";
import { canonicalizeProtectedPath, getRoleDefaultPath } from "@/lib/workspace/route-config";
import { GlobalLoading } from "@/components/ui/GlobalLoading";

const resolveSafeNextPath = (value: string | null): string | null => {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  if (value.startsWith("/login") || value.startsWith("/register") || value.startsWith("/context")) return null;
  return value;
};

export default function ContextSelectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { hasPermission, loading: permissionsLoading, isSuperAdmin } = usePermissions();
  const {
    routeRules,
    enabledModules,
    loading: schemaLoading,
    routeRulesReady,
  } = useUiSchema();
  const nextPath = resolveSafeNextPath(searchParams?.get("next") ?? null);

  const enabledModuleKeys = useMemo(
    () => new Set(enabledModules.map((module) => module.key.toLowerCase())),
    [enabledModules]
  );

  const routeHasAccess = useCallback((path: string) => {
    const rule = getSchemaRouteRule(path, routeRules.rules);
    if (!rule) {
      return false;
    }

    return enabledModuleKeys.has(rule.moduleKey.toLowerCase());
  }, [enabledModuleKeys, routeRules.rules]);

  useEffect(() => {
    if (authLoading || permissionsLoading || schemaLoading) return;

    // 1. If explicit nextPath was requested and user has access
    if (nextPath && routeRulesReady && routeHasAccess(nextPath)) {
      router.replace(canonicalizeProtectedPath(nextPath));
      return;
    }

    // 2. Role-based Default Redirect:
    // - SuperAdmin -> Admin Overview (/platform)
    // - Admin / Manager / HR -> HR Dashboard (/dashboard)
    // - Other Users (Standard Employees) -> ESS Page (/ess)
    const roleDefaultTarget = getRoleDefaultPath(user?.roles || user?.role, isSuperAdmin);
    router.replace(roleDefaultTarget);
  }, [
    authLoading,
    isSuperAdmin,
    nextPath,
    permissionsLoading,
    routeHasAccess,
    routeRulesReady,
    router,
    schemaLoading,
    user,
  ]);

  return (
    <div className="flex min-h-[calc(100dvh-var(--erp-topbar-height)-4rem)] items-center justify-center">
      <GlobalLoading
        variant="card"
        label="Preparing your workspace..."
        sublabel="Routing to your role workspace dashboard."
      />
    </div>
  );
}
