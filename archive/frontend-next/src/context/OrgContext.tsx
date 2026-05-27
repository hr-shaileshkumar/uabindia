"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";

type OrgContextState = {
  companyId: string | null;
  companyName: string | null;
  projectId: string | null;
  projectName: string | null;
};

type OrgContextValue = OrgContextState & {
  hasContext: boolean;
  setContext: (next: OrgContextState) => void;
  clearContext: () => void;
};

const STORAGE_KEYS = {
  companyId: "activeCompanyId",
  companyName: "activeCompanyName",
  projectId: "activeProjectId",
  projectName: "activeProjectName",
};

const readStoredContext = (): OrgContextState => {
  if (typeof window === "undefined") {
    return { companyId: null, companyName: null, projectId: null, projectName: null };
  }

  const companyId = window.localStorage.getItem(STORAGE_KEYS.companyId) || null;
  const companyName = window.localStorage.getItem(STORAGE_KEYS.companyName) || null;
  const projectId = window.localStorage.getItem(STORAGE_KEYS.projectId) || null;
  const projectName = window.localStorage.getItem(STORAGE_KEYS.projectName) || null;

  return {
    companyId,
    companyName,
    projectId,
    projectName,
  };
};

const OrgContext = createContext<OrgContextValue | null>(null);

export const useOrgContext = () => {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrgContext must be used within OrgContextProvider");
  return ctx;
};

export const OrgContextProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [state, setState] = useState<OrgContextState>(() => readStoredContext());

  const setContext = (next: OrgContextState) => {
    setState(next);
    if (typeof window === "undefined") return;
    if (next.companyId) window.localStorage.setItem(STORAGE_KEYS.companyId, next.companyId);
    else window.localStorage.removeItem(STORAGE_KEYS.companyId);
    if (next.companyName) window.localStorage.setItem(STORAGE_KEYS.companyName, next.companyName);
    else window.localStorage.removeItem(STORAGE_KEYS.companyName);
    if (next.projectId) window.localStorage.setItem(STORAGE_KEYS.projectId, next.projectId);
    else window.localStorage.removeItem(STORAGE_KEYS.projectId);
    if (next.projectName) window.localStorage.setItem(STORAGE_KEYS.projectName, next.projectName);
    else window.localStorage.removeItem(STORAGE_KEYS.projectName);
  };

  const clearContext = () => {
    setState({ companyId: null, companyName: null, projectId: null, projectName: null });
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEYS.companyId);
    window.localStorage.removeItem(STORAGE_KEYS.companyName);
    window.localStorage.removeItem(STORAGE_KEYS.projectId);
    window.localStorage.removeItem(STORAGE_KEYS.projectName);
  };

  useEffect(() => {
    if (!user) {
      if (typeof window === "undefined") return;
      window.localStorage.removeItem(STORAGE_KEYS.companyId);
      window.localStorage.removeItem(STORAGE_KEYS.companyName);
      window.localStorage.removeItem(STORAGE_KEYS.projectId);
      window.localStorage.removeItem(STORAGE_KEYS.projectName);
    }
  }, [user]);

  const value = useMemo(() => {
    const effectiveState: OrgContextState = user
      ? state
      : { companyId: null, companyName: null, projectId: null, projectName: null };

    return {
      ...effectiveState,
      hasContext: !!effectiveState.companyId && !!effectiveState.projectId,
      setContext,
      clearContext,
    };
  }, [state, user]);

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
};
