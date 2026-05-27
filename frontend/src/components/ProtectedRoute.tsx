"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePermissions } from "@/context/PermissionContext";
import { canonicalizeProtectedPath, getRoutePermissionKeys, getRoutePermissionRule } from "@/config/route-permissions.config";

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

  const permissionKeys = permission
    ? Array.isArray(permission)
      ? permission
      : [permission]
    : [];

  const fallbackRouteKeys = useMemo(() => {
    const canonicalPath = canonicalizeProtectedPath(pathname);
    const rule = getRoutePermissionRule(canonicalPath);
    return getRoutePermissionKeys(canonicalPath, rule?.moduleKey ?? null);
  }, [pathname]);

  const permissionAllowed = permissionKeys.length > 0
    ? hasPermission(permissionKeys) || hasPermission(fallbackRouteKeys)
    : true;
  const finalAllowed = permissionFetchFailed
    ? true
    : (typeof allowed === "boolean" ? allowed : permissionAllowed);
  const finalLoading = loading || (permissionKeys.length > 0 && permissionLoading);

  useEffect(() => {
    if (finalLoading) return;
    if (!finalAllowed) {
      router.replace(redirectTo);
    }
  }, [finalAllowed, finalLoading, redirectTo, router]);

  if (finalLoading) return null;
  if (!finalAllowed) return null;
  return <>{children}</>;
}
