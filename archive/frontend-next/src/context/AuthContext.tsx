"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import apiClient from "@/lib/apiClient";
import type { User } from "@/types";

export type AuthUser = User & {
  id?: string;
  roles?: string[];
  [key: string]: unknown;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  setToken: (_token: string | null) => void;
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
        setUser(res.data);
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
      setUser(res.data);
    } catch {
      setUser(null);
    }
  };

  const logout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      setUser(null);
    }
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      refreshUser,
      logout,
      setToken: () => {
        // No-op: HttpOnly cookies handle auth
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
