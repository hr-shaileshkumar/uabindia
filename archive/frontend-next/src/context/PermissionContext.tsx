"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";

type PermissionMode = "open" | "enforced";

type PermissionState = {
  permissions: Set<string>;
  mode: PermissionMode;
  loading: boolean;
};

type PermissionContextValue = PermissionState & {
  refresh: () => Promise<void>;
  hasPermission: (keys: string[]) => boolean;
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
  });

  const hasPermission = (keys: string[]) => {
    if (state.mode === "open") return true;
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
      setState({ permissions: new Set(), mode: "open", loading: false });
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));
    try {
      const res = await apiClient.get("/auth/permissions");
      const permissions = Array.isArray(res.data?.permissions) ? res.data.permissions : [];
      const mode = (res.data?.mode === "enforced" ? "enforced" : "open") as PermissionMode;
      setState({
        permissions: new Set(permissions.map((p: string) => normalize(p))),
        mode,
        loading: false,
      });
    } catch {
      setState({ permissions: new Set(), mode: "open", loading: false });
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value: PermissionContextValue = {
    ...state,
    refresh,
    hasPermission,
  };

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
};
