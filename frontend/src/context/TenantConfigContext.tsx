"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { platformApi } from "@/services/modules";
import { useAuth, type AuthUser } from "@/context/AuthContext";
import { isAdminRole, isSuperAdminRole } from "@/lib/auth/role-utils";

type TenantConfig = {
  configJson: string;
  uiSchemaJson: string;
  workflowJson: string;
  brandingJson: string;
  notes?: string | null;
};

type FeatureFlag = {
  id: string;
  featureKey: string;
  isEnabled: boolean;
};

type TenantConfigContextType = {
  config: TenantConfig | null;
  featureFlags: FeatureFlag[];
  loading: boolean;
  refresh: () => Promise<void>;
};

const TenantConfigContext = createContext<TenantConfigContextType | null>(null);

export const useTenantConfig = () => {
  const ctx = useContext(TenantConfigContext);
  if (!ctx) throw new Error("useTenantConfig must be used within TenantConfigProvider");
  return ctx;
};

export const TenantConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [config, setConfig] = useState<TenantConfig | null>(null);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/login")) {
      setConfig(null);
      setFeatureFlags([]);
      setLoading(false);
      return;
    }

    const roles = (user as AuthUser | null)?.roles || [];
    const roleCandidates = [...roles, (user as AuthUser | null)?.role];
    const isAdmin = roleCandidates.some((role) => isAdminRole(role) || isSuperAdminRole(role));

    if (!user) {
      setConfig(null);
      setFeatureFlags([]);
      setLoading(false);
      return;
    }

    let shouldLoadConfig = false;
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      shouldLoadConfig = isAdmin && (path.startsWith("/platform") || path.startsWith("/app/settings"));
    }

    try {
      setLoading(true);

      let nextConfig: TenantConfig | null = null;
      if (shouldLoadConfig) {
        try {
          const configRes = await platformApi.admin.tenantConfig.get();
          nextConfig = configRes.data;
        } catch {
          nextConfig = null;
        }
      }

      let flags: FeatureFlag[] = [];
      try {
        const flagsRes = await platformApi.admin.featureFlags();
        flags = flagsRes.data || [];
      } catch {
        flags = [];
      }

      setConfig(nextConfig);
      setFeatureFlags(flags);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      config,
      featureFlags,
      loading,
      refresh,
    }),
    [config, featureFlags, loading, refresh]
  );

  return <TenantConfigContext.Provider value={value}>{children}</TenantConfigContext.Provider>;
};
