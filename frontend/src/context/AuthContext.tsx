"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import apiClient from "@/services/apiClient";
import type { User } from "@/types";
import { isSuperAdminRole } from "@/lib/auth/role-utils";
import {
  AUTH_PATH_PREFIXES,
  BUSINESS_PATH_PREFIXES,
  OWNER_PATH_PREFIXES,
  matchesAnyPrefix,
} from "@/lib/workspace/route-config";

export type AuthUser = User & {
  id?: string;
  roles?: string[];
  tenantName?: string;
  tenantSubdomain?: string;
  isSystemAdmin?: boolean;
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

const resolveAvatarUrl = (data: Record<string, unknown>) =>
  asOptionalString(data.avatarUrl) ??
  asOptionalString(data.profilePhotoUrl) ??
  asOptionalString(data.profileImageUrl) ??
  asOptionalString(data.photoUrl) ??
  asOptionalString(data.imageUrl);

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
    employeeId: asOptionalString(data.employeeId),
    companyId: asOptionalString(data.companyId),
    tenantId: asOptionalString(data.tenantId),
    tenantName: asOptionalString(data.tenantName),
    tenantSubdomain: asOptionalString(data.tenantSubdomain),
    isSystemAdmin: Boolean(data.isSystemAdmin),
    isActive: typeof data.isActive === "boolean" ? data.isActive : true,
    avatarUrl: resolveAvatarUrl(data),
  };
};

const AuthContext = createContext<AuthContextType | null>(null);
const AUTH_CONTEXT_REQUIRED_PREFIXES = [...BUSINESS_PATH_PREFIXES, ...OWNER_PATH_PREFIXES, "/context"] as const;

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Hydrate user from sessionStorage synchronously on first load for instant rendering
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const cached = window.sessionStorage.getItem("erp.auth.user");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      const cached = window.sessionStorage.getItem("erp.auth.user");
      return !cached;
    } catch {
      return true;
    }
  });

  const pathname = usePathname();
  const currentPath = pathname || "/";
  const isAuthRoute = matchesAnyPrefix(currentPath, AUTH_PATH_PREFIXES);
  const requiresAuthBootstrap = !isAuthRoute && matchesAnyPrefix(currentPath, AUTH_CONTEXT_REQUIRED_PREFIXES);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      // If public auth page, mark loading false immediately
      if (!requiresAuthBootstrap) {
        if (isActive) {
          setLoading(false);
        }
        return;
      }

      try {
        const res = await apiClient.get("/auth/me");
        if (!isActive) return;
        const normalized = normalizeAuthUser(res.data);
        setUser(normalized);
        if (normalized && typeof window !== "undefined") {
          try {
            window.sessionStorage.setItem("erp.auth.user", JSON.stringify(normalized));
          } catch {
            // ignore storage quota errors
          }
        }
      } catch {
        if (!isActive) return;
        setUser(null);
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem("erp.auth.user");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      isActive = false;
    };
  }, [requiresAuthBootstrap]);

  const refreshUser = async () => {
    try {
      const res = await apiClient.get("/auth/me");
      setUser(normalizeAuthUser(res.data));
    } catch (error) {
      setUser(null);
      clearClientSessionArtifacts();
      throw error;
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

  const isSuperAdmin = Boolean(user?.isSystemAdmin);

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
