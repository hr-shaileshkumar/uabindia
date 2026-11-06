"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
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

export const normalize = (value: string) => value.toLowerCase().trim();

export const isWildcardPermission = (permission: string) =>
  permission === "*" || permission === "module:*" || permission === "resource:*";

export const inferModuleScope = (permissionKey: string) => {
  if (permissionKey.startsWith("module:")) {
    return permissionKey.slice("module:".length).split(".")[0] || null;
  }

  if (permissionKey.startsWith("resource:")) {
    return permissionKey.slice("resource:".length).split(/[.:]/)[0] || null;
  }

  if (permissionKey.startsWith("page:") || permissionKey.startsWith("path:")) {
    return permissionKey.slice(permissionKey.indexOf(":") + 1).split(/[.:]/)[0] || null;
  }

  return permissionKey.split(".")[0] || null;
};

export const PermissionProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [state, setState] = useState<PermissionState>(() => {
    if (typeof window === "undefined") {
      return {
        permissions: new Set(),
        mode: "open",
        loading: true,
        fetchFailed: false,
        capabilities: defaultCapabilities,
      };
    }

    try {
      const raw = window.sessionStorage.getItem("erp.auth.permissions");
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          permissions: new Set(Array.isArray(parsed.permissions) ? parsed.permissions.map((p: string) => normalize(p)) : []),
          mode: parsed.mode || "open",
          loading: false,
          fetchFailed: false,
          capabilities: parsed.capabilities || defaultCapabilities,
        };
      }
    } catch {
      // fallback
    }

    return {
      permissions: new Set(),
      mode: "open",
      loading: true,
      fetchFailed: false,
      capabilities: defaultCapabilities,
    };
  });

  const lastRefreshAt = useRef<number>(0);
  const userRoleSet = getNormalizedRoleSet([...(user?.roles || []), user?.role]);
  const userIsSuperAdmin = [...userRoleSet].some((role) => isSuperAdminRole(role));

  const hasPermission = (keys: string[]) => {
    if (state.capabilities.isSuperAdmin || userIsSuperAdmin) return true;
    if (state.mode === "open") return true;
    if (state.fetchFailed) return false;
    if (state.permissions.has("*") || state.permissions.has("module:*") || state.permissions.has("resource:*")) return true;
    if (state.permissions.size === 0) return false;
    return keys.some((key) => {
      const normalized = normalize(key);
      if (isWildcardPermission(normalized)) return true;
      const moduleScope = inferModuleScope(normalized);

      if (state.permissions.has(normalized)) return true;

      // Dual alias check between administration and platform
      if (normalized.startsWith("administration.")) {
        const alt = "platform." + normalized.slice("administration.".length);
        if (state.permissions.has(alt)) return true;
      } else if (normalized.startsWith("platform.")) {
        const alt = "administration." + normalized.slice("platform.".length);
        if (state.permissions.has(alt)) return true;
      }

      if (normalized.endsWith(".*")) {
        const prefix = normalized.slice(0, -2);
        for (const perm of state.permissions) {
          if (perm.startsWith(prefix + ".")) return true;
        }
        return false;
      }

      if (!moduleScope) {
        return false;
      }

      const altScope = moduleScope === "administration" ? "platform" : moduleScope === "platform" ? "administration" : null;

      const candidates = [
        `module:${moduleScope}`,
        `${moduleScope}.*`,
        `${moduleScope}.access`,
        `${moduleScope}.view`,
        `resource:${moduleScope}.access`,
        `resource:${moduleScope}.view`,
      ];

      if (altScope) {
        candidates.push(
          `module:${altScope}`,
          `${altScope}.*`,
          `${altScope}.access`,
          `${altScope}.view`,
          `resource:${altScope}.access`,
          `resource:${altScope}.view`
        );
      }

      return candidates.some((candidate) => state.permissions.has(candidate));
    });
  };

  const refresh = useCallback(async () => {
    if (!user) {
      setState({ permissions: new Set(), mode: "open", loading: false, fetchFailed: false, capabilities: defaultCapabilities });
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("erp.auth.permissions");
      }
      return;
    }

    try {
      const res = await apiClient.get("/auth/permissions");
      const permissions = Array.isArray(res.data?.permissions) ? res.data.permissions : [];
      const rawMode = (res.data?.mode === "enforced" ? "enforced" : "open") as PermissionMode;
      const capabilities = {
        ...defaultCapabilities,
        ...(res.data?.capabilities && typeof res.data.capabilities === "object" ? res.data.capabilities : {}),
      } as BackendCapabilities;
      lastRefreshAt.current = Date.now();
      const mode = capabilities.isSuperAdmin ? "open" : rawMode;
      const permSet = new Set<string>(permissions.map((p: string) => normalize(p)));

      setState({
        permissions: permSet,
        mode,
        loading: false,
        fetchFailed: false,
        capabilities,
      });

      if (typeof window !== "undefined") {
        try {
          window.sessionStorage.setItem("erp.auth.permissions", JSON.stringify({
            permissions: Array.from(permSet),
            mode,
            capabilities,
          }));
        } catch {
          // ignore storage quota errors
        }
      }
    } catch {
      setState((prev) => ({
        ...prev,
        loading: false,
        fetchFailed: prev.permissions.size === 0,
      }));
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
