"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePermissions } from "@/context/PermissionContext";
import { useUiSchema } from "@/context/UiSchemaContext";
import { getEffectiveRoutePermissionKeys } from "@/lib/workspace/route-access";

type ProtectedRouteProps = {
  allowed?: boolean;
  permission?: string | string[];
  loading?: boolean;
  redirectTo?: string;
  children: React.ReactNode;
};

export const resolvePermissionAllowed = (
  combinedPermissionKeys: string[],
  hasPermission: (keys: string[]) => boolean
) => (combinedPermissionKeys.length > 0 ? hasPermission(combinedPermissionKeys) : true);

export const shouldBlockProtectedRoute = (
  finalLoading: boolean,
  permissionFetchFailed: boolean,
  isSuperAdmin: boolean,
  finalAllowed: boolean
) => {
  if (finalLoading) return false;
  return (permissionFetchFailed && !isSuperAdmin) || (!isSuperAdmin && !finalAllowed);
};

export default function ProtectedRoute({
  allowed,
  permission,
  loading = false,
  redirectTo = "/not-authorized",
  children,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname() || "";
  const { hasPermission, loading: permissionLoading, fetchFailed: permissionFetchFailed, isSuperAdmin } = usePermissions();
  const { routeRules, loading: schemaLoading } = useUiSchema();

  const permissionKeys = permission
    ? Array.isArray(permission)
      ? permission
      : [permission]
    : [];

  const routePermissionKeys = useMemo(
    () => getEffectiveRoutePermissionKeys(pathname, routeRules.rules) ?? [],
    [pathname, routeRules.rules]
  );

  const combinedPermissionKeys = permissionKeys.length > 0
    ? [...new Set([...permissionKeys, ...routePermissionKeys])]
    : routePermissionKeys;
  const permissionAllowed = resolvePermissionAllowed(combinedPermissionKeys, hasPermission);
  const finalAllowed = typeof allowed === "boolean" ? allowed : permissionAllowed;
  const finalLoading = (loading || permissionLoading || schemaLoading) && !isSuperAdmin;
  const blocked = shouldBlockProtectedRoute(finalLoading, permissionFetchFailed, isSuperAdmin, finalAllowed);

  useEffect(() => {
    if (blocked) {
      router.replace(redirectTo);
    }
  }, [blocked, redirectTo, router]);

  if (finalLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-slate-200 border-t-indigo-600 dark:border-slate-800 dark:border-t-indigo-400" />
          <p className="text-xs font-medium text-slate-500">Checking permissions & loading workspace...</p>
        </div>
      </div>
    );
  }

  if (blocked) {
    return null;
  }

  return <>{children}</>;
}
