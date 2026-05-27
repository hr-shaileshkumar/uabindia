"use client";

import type { ReactNode } from "react";
import { usePermissions } from "@/context/PermissionContext";
import { useTenantConfig } from "@/context/TenantConfigContext";

type CanProps = {
  permission: string | string[];
  /** Optional feature flag key(s) that must all be enabled for the content to show. */
  feature?: string | string[];
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
  children: ReactNode;
};

export default function Can({
  permission,
  feature,
  fallback = null,
  loadingFallback = null,
  children,
}: CanProps) {
  const { hasPermission, loading } = usePermissions();
  const { featureFlags, loading: flagsLoading } = useTenantConfig();

  if (loading || flagsLoading) {
    return <>{loadingFallback}</>;
  }

  const keys = Array.isArray(permission) ? permission : [permission];
  if (!hasPermission(keys)) {
    return <>{fallback}</>;
  }

  // Feature flag gate: if any required flag is explicitly disabled, hide
  if (feature) {
    const featureKeys = Array.isArray(feature) ? feature : [feature];
    const flagMap = new Map(featureFlags.map((f) => [f.featureKey.toLowerCase(), f.isEnabled]));
    for (const fk of featureKeys) {
      if (flagMap.has(fk.toLowerCase()) && flagMap.get(fk.toLowerCase()) === false) {
        return <>{fallback}</>;
      }
    }
  }

  return <>{children}</>;
}
