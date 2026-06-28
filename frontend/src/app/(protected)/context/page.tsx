"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePermissions } from "@/context/PermissionContext";
import { useUiSchema } from "@/context/UiSchemaContext";
import { getSchemaRouteRule } from "@/lib/erp/route-access";

const PLATFORM_SETUP_ROUTE = "/platform/module-mapping";

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
  const { hasPermission, loading: permissionsLoading, isSuperAdmin } = usePermissions();
  const {
    routeRules,
    navigation,
    enabledModules,
    loading: schemaLoading,
    navigationReady,
    routeRulesReady,
  } = useUiSchema();
  const nextPath = resolveSafeNextPath(searchParams.get("next"));

  const canManageWorkspaceSetup =
    isSuperAdmin ||
    hasPermission(["module:platform", "platform.*", "platform.access", "platform.view"]);
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

  const firstAccessibleNavigationPath = useMemo(() => {
    const modules = navigation.modules
      .slice()
      .sort((left, right) => left.sortOrder - right.sortOrder || left.displayName.localeCompare(right.displayName));

    for (const navModule of modules) {
      const groups = navModule.groups
        .slice()
        .sort((left, right) => left.sortOrder - right.sortOrder || left.label.localeCompare(right.label));

      for (const group of groups) {
        const items = group.items
          .slice()
          .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name));

        for (const item of items) {
          return item.path;
        }
      }
    }

    return null;
  }, [navigation.modules]);

  useEffect(() => {
    if (permissionsLoading || schemaLoading) return;

    if (nextPath && routeRulesReady && routeHasAccess(nextPath)) {
      router.replace(nextPath);
      return;
    }

    if (navigationReady && firstAccessibleNavigationPath) {
      router.replace(firstAccessibleNavigationPath);
      return;
    }

    if ((!navigationReady || !routeRulesReady) && canManageWorkspaceSetup) {
      router.replace(PLATFORM_SETUP_ROUTE);
      return;
    }

    router.replace("/not-authorized?reason=access-not-configured");
  }, [
    canManageWorkspaceSetup,
    firstAccessibleNavigationPath,
    navigationReady,
    nextPath,
    permissionsLoading,
    routeHasAccess,
    routeRulesReady,
    router,
    schemaLoading,
  ]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-6 py-10 text-sm font-medium text-slate-500">
      Redirecting to your workspace...
    </div>
  );
}
