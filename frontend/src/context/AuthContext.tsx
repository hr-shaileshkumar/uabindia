"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import apiClient from "@/services/apiClient";
import type { User } from "@/types";
import { isSuperAdminRole } from "@/lib/auth/role-utils";

export type AuthUser = User & {
  id?: string;
  roles?: string[];
  [key: string]: unknown;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  isSuperAdmin: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  setToken: (_token: string | null) => void;
};

const asOptionalString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0 ? value : undefined;

const clearClientSessionArtifacts = () => {
  if (typeof window === "undefined") return;
  const keys = [
    "activeCompanyId",
    "activeCompanyName",
    "activeProjectId",
    "activeProjectName",
    "activeModuleKey",
  ];

  for (const key of keys) {
    window.localStorage.removeItem(key);
  }
};

const normalizeAuthUser = (payload: unknown): AuthUser | null => {
  if (!payload || typeof payload !== "object") return null;

  const data = payload as Record<string, unknown>;
  const roleList = Array.isArray(data.roles)
    ? data.roles.filter((role): role is string => typeof role === "string" && role.trim().length > 0)
    : [];

  const role = asOptionalString(data.role) ?? roleList[0] ?? "Employee";
  const userId = asOptionalString(data.userId) ?? asOptionalString(data.id);
  const email = asOptionalString(data.email);

  if (!userId || !email) return null;

  return {
    id: asOptionalString(data.id) ?? userId,
    userId,
    email,
    fullName: asOptionalString(data.fullName) ?? "",
    role,
    roles: roleList.length > 0 ? roleList : [role],
    companyId: asOptionalString(data.companyId),
    tenantId: asOptionalString(data.tenantId),
    isActive: typeof data.isActive === "boolean" ? data.isActive : true,
  };
};

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (typeof window !== "undefined" && window.location.pathname.startsWith("/login")) {
        setLoading(false);
        return;
      }
      try {
        const res = await apiClient.get("/auth/me");
        setUser(normalizeAuthUser(res.data));
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const refreshUser = async () => {
    try {
      const res = await apiClient.get("/auth/me");
      setUser(normalizeAuthUser(res.data));
    } catch {
      setUser(null);
      clearClientSessionArtifacts();
    }
  };

  const logout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Session may already be expired — ignore logout errors
    } finally {
      setUser(null);
      clearClientSessionArtifacts();
    }
  };

  const isSuperAdmin = !!user?.roles?.some((role) => isSuperAdminRole(role));

  const value = useMemo(
    () => ({
      user,
      loading,
      isSuperAdmin,
      refreshUser,
      logout,
      setToken: () => {
        // No-op: HttpOnly cookies handle auth
      },
    }),
    [user, loading, isSuperAdmin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
