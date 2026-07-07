"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePermissions } from "@/context/PermissionContext";
import { useUiSchema } from "@/context/UiSchemaContext";
import { getEffectiveRoutePermissionKeys } from "@/lib/erp/route-access";

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
  const pathname = usePathname();
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
  const finalLoading = loading || permissionLoading || schemaLoading;
  const blocked = shouldBlockProtectedRoute(finalLoading, permissionFetchFailed, isSuperAdmin, finalAllowed);

  useEffect(() => {
    if (blocked) {
      router.replace(redirectTo);
    }
  }, [blocked, redirectTo, router]);

  if (finalLoading) return null;
  if (blocked) return null;
  return <>{children}</>;
}
