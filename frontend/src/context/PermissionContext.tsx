"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import apiClient from "@/services/apiClient";
import { useAuth } from "@/context/AuthContext";
import { getNormalizedRoleSet, isSuperAdminRole } from "@/lib/auth/role-utils";

type PermissionMode = "open" | "enforced";

type BackendCapabilities = {
  isSuperAdmin: boolean;
  includeDeletedByDefault: boolean;
  includeAllTenantsByDefault: boolean;
  canRestoreDeleted: boolean;
  canHardDelete: boolean;
};

type PermissionState = {
  permissions: Set<string>;
  mode: PermissionMode;
  loading: boolean;
  fetchFailed: boolean;
  capabilities: BackendCapabilities;
};

type PermissionContextValue = PermissionState & {
  refresh: () => Promise<void>;
  hasPermission: (keys: string[]) => boolean;
  isSuperAdmin: boolean;
};

const defaultCapabilities: BackendCapabilities = {
  isSuperAdmin: false,
  includeDeletedByDefault: false,
  includeAllTenantsByDefault: false,
  canRestoreDeleted: false,
  canHardDelete: false,
};

const PermissionContext = createContext<PermissionContextValue | null>(null);

export const usePermissions = () => {
  const ctx = useContext(PermissionContext);
  if (!ctx) throw new Error("usePermissions must be used within PermissionProvider");
  return ctx;
};

const normalize = (value: string) => value.toLowerCase();

export const PermissionProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [state, setState] = useState<PermissionState>({
    permissions: new Set(),
    mode: "open",
    loading: true,
    fetchFailed: false,
    capabilities: defaultCapabilities,
  });
  const lastRefreshAt = useRef<number>(0);
  const userRoleSet = getNormalizedRoleSet([...(user?.roles || []), user?.role]);
  const userIsSuperAdmin = [...userRoleSet].some((role) => isSuperAdminRole(role));

  const hasPermission = (keys: string[]) => {
    if (state.capabilities.isSuperAdmin || userIsSuperAdmin) return true;
    if (state.fetchFailed) return false;
    if (state.permissions.has("*")) return true; // Explicit wildcard from backend
    if (state.permissions.size === 0) return false;
    return keys.some((key) => {
      const normalized = normalize(key);
      if (normalized.endsWith(".*")) {
        const prefix = normalized.slice(0, -2);
        for (const perm of state.permissions) {
          if (perm.startsWith(prefix + ".")) return true;
        }
        return false;
      }
      return state.permissions.has(normalized);
    });
  };

  const refresh = useCallback(async () => {
    if (!user) {
      setState({ permissions: new Set(), mode: "open", loading: false, fetchFailed: false, capabilities: defaultCapabilities });
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));
    try {
      const res = await apiClient.get("/auth/permissions");
      const permissions = Array.isArray(res.data?.permissions) ? res.data.permissions : [];
      const rawMode = (res.data?.mode === "enforced" ? "enforced" : "open") as PermissionMode;
      const capabilities = {
        ...defaultCapabilities,
        ...(res.data?.capabilities && typeof res.data.capabilities === "object" ? res.data.capabilities : {}),
      } as BackendCapabilities;
      lastRefreshAt.current = Date.now();
      if (typeof window !== "undefined") {
        window.localStorage.setItem("erp:capabilities", JSON.stringify(capabilities));
      }
      const mode = capabilities.isSuperAdmin ? "open" : rawMode;
      setState({
        permissions: new Set(permissions.map((p: string) => normalize(p))),
        mode,
        loading: false,
        fetchFailed: false,
        capabilities,
      });
    } catch {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("erp:capabilities");
      }
      setState({ permissions: new Set(), mode: "enforced", loading: false, fetchFailed: true, capabilities: defaultCapabilities });
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const refreshIntervalMs = 5 * 60 * 1000;
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastRefreshAt.current < refreshIntervalMs) return;
      void refresh();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [refresh]);

  const isSuperAdmin = state.capabilities.isSuperAdmin || userIsSuperAdmin || state.permissions.has("*");

  const value: PermissionContextValue = {
    ...state,
    refresh,
    hasPermission,
    isSuperAdmin,
  };

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
};
