// context/TenantContext.tsx – Multi-Tenant, Multi-Company, Multi-Project Context
// Supports: switching tenants, companies, projects at runtime
import React, {
  createContext, useContext, useState, useEffect, ReactNode,
} from "react";
import { setApiAuth } from "../utils/api";
import { loadAuthData } from "../utils/storage";

export interface TenantInfo {
  tenantId: string;
  tenantName: string;
  subdomain: string;
  logoUrl?: string;
  primaryColor?: string;
}

export interface CompanyInfo {
  companyId: string;
  companyName: string;
  companyCode?: string;
  address?: string;
}

export interface ProjectInfo {
  projectId: string;
  projectName: string;
  projectCode?: string;
  clientName?: string;
}

interface TenantContextType {
  tenant: TenantInfo | null;
  company: CompanyInfo | null;
  project: ProjectInfo | null;
  availableCompanies: CompanyInfo[];
  availableProjects: ProjectInfo[];
  setTenant: (t: TenantInfo) => void;
  setCompany: (c: CompanyInfo) => void;
  setProject: (p: ProjectInfo | null) => void;
  setAvailableCompanies: (cs: CompanyInfo[]) => void;
  setAvailableProjects: (ps: ProjectInfo[]) => void;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null, company: null, project: null,
  availableCompanies: [], availableProjects: [],
  setTenant: () => {}, setCompany: () => {}, setProject: () => {},
  setAvailableCompanies: () => {}, setAvailableProjects: () => {},
});

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenantState] = useState<TenantInfo | null>(null);
  const [company, setCompanyState] = useState<CompanyInfo | null>(null);
  const [project, setProjectState] = useState<ProjectInfo | null>(null);
  const [availableCompanies, setAvailableCompanies] = useState<CompanyInfo[]>([]);
  const [availableProjects, setAvailableProjects] = useState<ProjectInfo[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const saved = await loadAuthData();
        if (saved) {
          const u = saved.user;
          if (u.tenantId) {
            setTenantState({ tenantId: u.tenantId, tenantName: u.companyName ?? "Uabindia", subdomain: "erp" });
          }
          if (u.companyId) {
            setCompanyState({ companyId: u.companyId, companyName: u.companyName ?? "Default Company" });
          }
        }
      } catch {}
    })();
  }, []);

  const setTenant = (t: TenantInfo) => {
    setTenantState(t);
    // Re-arm API with new tenant
    setApiAuth(/* token */ "", t.tenantId);
  };

  const setCompany = (c: CompanyInfo) => setCompanyState(c);
  const setProject = (p: ProjectInfo | null) => setProjectState(p);

  return (
    <TenantContext.Provider value={{
      tenant, company, project,
      availableCompanies, availableProjects,
      setTenant, setCompany, setProject,
      setAvailableCompanies, setAvailableProjects,
    }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}
