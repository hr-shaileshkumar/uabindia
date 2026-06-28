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

export default function ProtectedRoute({
  allowed,
  permission,
  loading = false,
  redirectTo = "/not-authorized",
  children,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { hasPermission, loading: permissionLoading, fetchFailed: permissionFetchFailed } = usePermissions();
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
  const permissionAllowed = combinedPermissionKeys.length > 0
    ? hasPermission(combinedPermissionKeys)
    : false;
  const finalAllowed = typeof allowed === "boolean" ? allowed : permissionAllowed;
  const finalLoading = loading || permissionLoading || schemaLoading;

  useEffect(() => {
    if (finalLoading) return;
    if (permissionFetchFailed || !finalAllowed) {
      router.replace(redirectTo);
    }
  }, [finalAllowed, finalLoading, permissionFetchFailed, redirectTo, router]);

  if (finalLoading) return null;
  if (permissionFetchFailed || !finalAllowed) return null;
  return <>{children}</>;
}
