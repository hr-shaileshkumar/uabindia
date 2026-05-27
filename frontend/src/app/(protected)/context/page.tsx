"use client";

import { useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { usePermissions } from "@/context/PermissionContext";
import { useUiSchema } from "@/context/UiSchemaContext";
import { getFirstAccessibleRoute, getRoutePermissionRule, getRoutePermissionKeys, type ModuleKey } from "@/config/route-permissions.config";

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
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const { routeRules, navigation, loading: schemaLoading } = useUiSchema();
  const nextPath = resolveSafeNextPath(searchParams.get("next"));

  const canonicalizePath = (path: string) => {
    const stripped = path.split("?")[0].split("#")[0];
    if (!stripped || stripped === "/") return "/";
    return stripped.replace(/\/+$/, "") || "/";
  };

  const toFeatureKey = (path: string) =>
    path
      .replace(/^\/+/, "")
      .replace(/\/+/g, ".")
      .replace(/[^a-zA-Z0-9._-]/g, "")
      .toLowerCase();

  const getBackendRouteRule = useCallback((path: string) => {
    const canonicalPath = canonicalizePath(path);
    let bestMatch: { pathPattern: string; moduleKey: string; permissionKeys: string[] } | undefined;

    for (const rule of routeRules.rules) {
      const rulePath = canonicalizePath(rule.pathPattern);
      const exact = canonicalPath === rulePath;
      const nested = canonicalPath.startsWith(`${rulePath}/`);
      if (!exact && !nested) continue;

      if (!bestMatch || rulePath.length > bestMatch.pathPattern.length) {
        bestMatch = rule;
      }
    }

    return bestMatch;
  }, [routeRules.rules]);

  const getBackendPermissionKeys = useCallback((path: string) => {
    const canonicalPath = canonicalizePath(path);
    const backendRule = getBackendRouteRule(canonicalPath);
    if (!backendRule) return null;

    const normalizedPath = toFeatureKey(canonicalPath);
    return [...new Set([
      ...backendRule.permissionKeys,
      `page:${normalizedPath}`,
      `path:${normalizedPath}`,
      normalizedPath,
      `resource:${normalizedPath}.view`,
      `module:${backendRule.moduleKey}`,
      `${backendRule.moduleKey}.*`,
      `${backendRule.moduleKey}.view`,
      `resource:${backendRule.moduleKey}.view`,
    ])];
  }, [getBackendRouteRule]);

  const getFirstAccessibleSchemaRoute = useCallback(() => {
    const navModules = navigation.modules.slice().sort((a, b) => a.sortOrder - b.sortOrder);
    for (const navModule of navModules) {
      const groups = navModule.groups.slice().sort((a, b) => a.sortOrder - b.sortOrder);
      for (const group of groups) {
        const items = group.items.slice().sort((a, b) => a.sortOrder - b.sortOrder);
        for (const item of items) {
          const path = canonicalizePath(item.path);
          if (!path || path === "/") continue;

          const backendKeys = getBackendPermissionKeys(path);
          if (backendKeys && hasPermission(backendKeys)) {
            return path;
          }

          const fallbackKeys = getRoutePermissionKeys(path, navModule.key as ModuleKey);
          if (hasPermission(fallbackKeys)) {
            return path;
          }
        }
      }
    }

    return null;
  }, [getBackendPermissionKeys, hasPermission, navigation.modules]);

  useEffect(() => {
    if (permissionsLoading || schemaLoading) return;

    if (nextPath) {
      const backendKeys = getBackendPermissionKeys(nextPath);
      if (backendKeys ? hasPermission(backendKeys) : (() => {
        const rule = getRoutePermissionRule(nextPath);
        return !rule || hasPermission(getRoutePermissionKeys(nextPath, rule.moduleKey));
      })()) {
        router.replace(nextPath);
        return;
      }
    }

    const schemaFirstAllowed = getFirstAccessibleSchemaRoute();
    if (schemaFirstAllowed) {
      router.replace(schemaFirstAllowed);
      return;
    }

    const firstAllowed = getFirstAccessibleRoute(hasPermission);
    if (firstAllowed) {
      router.replace(firstAllowed);
      return;
    }

    router.replace(ROUTES.NOT_AUTHORIZED);
  }, [
    getFirstAccessibleSchemaRoute,
    getBackendPermissionKeys,
    hasPermission,
    nextPath,
    permissionsLoading,
    router,
    schemaLoading,
  ]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-6 py-10 text-sm font-medium text-slate-500">
      Redirecting to your workspace...
    </div>
  );
}
