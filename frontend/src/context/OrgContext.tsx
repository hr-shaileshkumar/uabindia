"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/services/apiClient";
import { isSuperAdminRole } from "@/lib/auth/role-utils";
import { useQueryClient } from "@tanstack/react-query";

type OrgContextState = {
  companyId: string | null;
  companyName: string | null;
  projectId: string | null;
  projectName: string | null;
  financialYearKey: string | null;
  financialYearLabel: string | null;
};

type OrgContextValue = OrgContextState & {
  hasContext: boolean;
  setContext: (next: Partial<OrgContextState>) => void;
  clearContext: () => void;
  setFinancialYear: (financialYearKey: string | null, financialYearLabel: string | null) => void;
  clearFinancialYear: () => void;
};

const STORAGE_KEYS = {
  companyId: "activeCompanyId",
  companyName: "activeCompanyName",
  projectId: "activeProjectId",
  projectName: "activeProjectName",
  financialYearKey: "activeFinancialYearKey",
  financialYearLabel: "activeFinancialYearLabel",
};

const readStoredContext = (): OrgContextState => {
  if (typeof window === "undefined") {
    return {
      companyId: null,
      companyName: null,
      projectId: null,
      projectName: null,
      financialYearKey: null,
      financialYearLabel: null,
    };
  }

  const companyId = window.localStorage.getItem(STORAGE_KEYS.companyId) || null;
  const companyName = window.localStorage.getItem(STORAGE_KEYS.companyName) || null;
  const projectId = window.localStorage.getItem(STORAGE_KEYS.projectId) || null;
  const projectName = window.localStorage.getItem(STORAGE_KEYS.projectName) || null;
  const financialYearKey = window.localStorage.getItem(STORAGE_KEYS.financialYearKey) || null;
  const financialYearLabel = window.localStorage.getItem(STORAGE_KEYS.financialYearLabel) || null;

  return {
    companyId,
    companyName,
    projectId,
    projectName,
    financialYearKey,
    financialYearLabel,
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
  const queryClient = useQueryClient();
  const lastContextSignatureRef = useRef<string>("");

  const persistState = (next: OrgContextState) => {
    if (typeof window === "undefined") return;
    if (next.companyId) window.localStorage.setItem(STORAGE_KEYS.companyId, next.companyId);
    else window.localStorage.removeItem(STORAGE_KEYS.companyId);
    if (next.companyName) window.localStorage.setItem(STORAGE_KEYS.companyName, next.companyName);
    else window.localStorage.removeItem(STORAGE_KEYS.companyName);
    if (next.projectId) window.localStorage.setItem(STORAGE_KEYS.projectId, next.projectId);
    else window.localStorage.removeItem(STORAGE_KEYS.projectId);
    if (next.projectName) window.localStorage.setItem(STORAGE_KEYS.projectName, next.projectName);
    else window.localStorage.removeItem(STORAGE_KEYS.projectName);
    if (next.financialYearKey) window.localStorage.setItem(STORAGE_KEYS.financialYearKey, next.financialYearKey);
    else window.localStorage.removeItem(STORAGE_KEYS.financialYearKey);
    if (next.financialYearLabel) window.localStorage.setItem(STORAGE_KEYS.financialYearLabel, next.financialYearLabel);
    else window.localStorage.removeItem(STORAGE_KEYS.financialYearLabel);
  };

  const setContext = useCallback((next: Partial<OrgContextState>) => {
    setState((previous) => {
      const merged = { ...previous, ...next };

      const companyChanged = Object.prototype.hasOwnProperty.call(next, "companyId")
        && next.companyId !== previous.companyId;

      if (companyChanged) {
        merged.projectId = Object.prototype.hasOwnProperty.call(next, "projectId")
          ? merged.projectId
          : null;
        merged.projectName = Object.prototype.hasOwnProperty.call(next, "projectName")
          ? merged.projectName
          : null;
      }

      if (!merged.companyId) {
        merged.projectId = null;
        merged.projectName = null;
      }

      const scopeChanged =
        previous.companyId !== merged.companyId || previous.projectId !== merged.projectId;

      persistState(merged);

      if (scopeChanged && typeof window !== "undefined" && user) {
        // Fire-and-forget audit of workspace context switches
        void import("@/services/modules/org")
          .then(({ orgApi }) =>
            orgApi.contextEvents.log({
              previousCompanyId: previous.companyId,
              previousProjectId: previous.projectId,
              companyId: merged.companyId,
              projectId: merged.projectId,
              companyName: merged.companyName,
              projectName: merged.projectName,
            }),
          )
          .catch(() => {
            // never block UI on audit failure
          });
      }

      return merged;
    });
  }, [user]);

  const setFinancialYear = useCallback((financialYearKey: string | null, financialYearLabel: string | null) => {
    setContext({ financialYearKey, financialYearLabel });
  }, [setContext]);

  const clearContext = useCallback(() => {
    setContext({
      companyId: null,
      companyName: null,
      projectId: null,
      projectName: null,
    });
  }, [setContext]);

  const clearFinancialYear = useCallback(() => {
    setContext({ financialYearKey: null, financialYearLabel: null });
  }, [setContext]);

  useEffect(() => {
    if (!user) {
      const cleared: OrgContextState = {
        companyId: null,
        companyName: null,
        projectId: null,
        projectName: null,
        financialYearKey: null,
        financialYearLabel: null,
      };
      setState(cleared);
      persistState(cleared);
      if (typeof window === "undefined") return;
      window.localStorage.removeItem(STORAGE_KEYS.companyId);
      window.localStorage.removeItem(STORAGE_KEYS.companyName);
      window.localStorage.removeItem(STORAGE_KEYS.projectId);
      window.localStorage.removeItem(STORAGE_KEYS.projectName);
      window.localStorage.removeItem(STORAGE_KEYS.financialYearKey);
      window.localStorage.removeItem(STORAGE_KEYS.financialYearLabel);
    }
  }, [user]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncFromStorage = (event: StorageEvent) => {
      if (!event.key) return;
      if (!Object.values(STORAGE_KEYS).includes(event.key)) return;
      setState(readStoredContext());
    };

    window.addEventListener("storage", syncFromStorage);
    return () => window.removeEventListener("storage", syncFromStorage);
  }, []);

  const { companyId, projectId } = state;

  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const validateContext = async () => {
      if (!user) return;

      try {
        const roles = Array.isArray((user as { roles?: unknown[] }).roles)
          ? ((user as { roles?: unknown[] }).roles as unknown[])
          : [];
        const roleCandidates = [...roles, (user as { role?: unknown }).role];
        const isSuperAdmin = roleCandidates.some((role) => isSuperAdminRole(role));
        const companyRes = isSuperAdmin
          ? await apiClient.get("/companies/all")
          : await apiClient.get("/companies?page=1&limit=200");
        const companies = Array.isArray(companyRes.data?.companies) ? companyRes.data.companies : [];
        const current = stateRef.current;

        if (!companyId) {
          return;
        }

        const selectedCompany = companies.find((c: { id?: string; name?: string }) => c.id === companyId);

        if (!selectedCompany) {
          const cleared: OrgContextState = {
            companyId: null,
            companyName: null,
            projectId: null,
            projectName: null,
            financialYearKey: current.financialYearKey,
            financialYearLabel: current.financialYearLabel,
          };
          setState(cleared);
          persistState(cleared);
          return;
        }

        if (!projectId) {
          if (current.companyName !== (selectedCompany.name || null)) {
            const next: OrgContextState = {
              ...current,
              companyName: selectedCompany.name || null,
            };
            setState(next);
            persistState(next);
          }
          return;
        }

        const projectsRes = await apiClient.get(`/projects?companyId=${companyId}`);
        const projects = Array.isArray(projectsRes.data?.projects) ? projectsRes.data.projects : [];
        const selectedProject = projects.find((p: { id?: string; name?: string }) => p.id === projectId);

        if (!selectedProject) {
          const next: OrgContextState = {
            companyId,
            companyName: selectedCompany.name || null,
            projectId: null,
            projectName: null,
            financialYearKey: current.financialYearKey,
            financialYearLabel: current.financialYearLabel,
          };
          setState(next);
          persistState(next);
          return;
        }

        if (current.companyName !== (selectedCompany.name || null) || current.projectName !== (selectedProject.name || null)) {
          const next: OrgContextState = {
            companyId,
            companyName: selectedCompany.name || null,
            projectId,
            projectName: selectedProject.name || null,
            financialYearKey: current.financialYearKey,
            financialYearLabel: current.financialYearLabel,
          };
          setState(next);
          persistState(next);
        }
      } catch {
        // Validation is best-effort; avoid hard-failing UX on transient network errors.
      }
    };

    void validateContext();
  }, [companyId, projectId, user]);

  useEffect(() => {
    const signature = [
      state.companyId || "",
      state.projectId || "",
      state.financialYearKey || "",
    ].join("|");

    if (!lastContextSignatureRef.current) {
      lastContextSignatureRef.current = signature;
      return;
    }

    if (lastContextSignatureRef.current === signature) {
      return;
    }

    lastContextSignatureRef.current = signature;

    void queryClient.invalidateQueries({ refetchType: "active" });

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("erp:org-context-changed", {
          detail: {
            companyId: state.companyId,
            projectId: state.projectId,
            financialYearKey: state.financialYearKey,
          },
        })
      );
    }
  }, [state.companyId, state.projectId, state.financialYearKey, queryClient]);

  const value = useMemo(() => {
    const effectiveState: OrgContextState = user
      ? state
      : {
          companyId: null,
          companyName: null,
          projectId: null,
          projectName: null,
          financialYearKey: null,
          financialYearLabel: null,
        };

    return {
      ...effectiveState,
      hasContext: !!effectiveState.companyId && !!effectiveState.projectId,
      setContext,
      clearContext,
      setFinancialYear,
      clearFinancialYear,
    };
  }, [state, user, setContext, clearContext, setFinancialYear, clearFinancialYear]);

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
};
