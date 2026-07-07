"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePermissions } from "@/context/PermissionContext";
import { useUiSchema } from "@/context/UiSchemaContext";
import { getSchemaRouteRule } from "@/lib/erp/route-access";
import { canonicalizeProtectedPath } from "@/lib/erp/route-config";

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
          return canonicalizeProtectedPath(item.path);
        }
      }
    }

    return null;
  }, [navigation.modules]);

  useEffect(() => {
    if (permissionsLoading || schemaLoading) return;

    if (nextPath && routeRulesReady && routeHasAccess(nextPath)) {
      router.replace(canonicalizeProtectedPath(nextPath));
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
    <div className="flex min-h-[calc(100dvh-var(--erp-topbar-height)-4rem)] items-center justify-center">
      <div className="max-w-xl rounded-[1.75rem] border border-slate-200/80 bg-white/92 px-8 py-10 text-center shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm">
        <div className="mx-auto mb-5 h-12 w-12 rounded-2xl bg-[linear-gradient(135deg,rgba(15,74,125,0.14),rgba(11,123,115,0.14))] p-3">
          <div className="h-full w-full animate-pulse rounded-xl bg-[linear-gradient(135deg,#0f4a7d,#0b7b73)]" />
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Workspace Routing</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950">Preparing your workspace</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Loading the first accessible module, company context, and route permissions for this account.
        </p>
      </div>
    </div>
  );
}
