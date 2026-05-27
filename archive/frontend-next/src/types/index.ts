/**
 * Core Domain Types - Backend Authoritative
 */

export interface User {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  companyId?: string;
  tenantId?: string;
  isActive: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface Module {
  key: string;
  name: string;
  icon?: string;
  description?: string;
  subModules?: SubModule[];
  isEnabled: boolean;
  order?: number;
}

export interface SubModule {
  key: string;
  name: string;
  path: string;
  icon?: string;
  group?: string;
  order?: number;
}

export interface ModulesResponse {
  modules: Module[];
  version?: string;
}

export interface Company {
  id: string;
  tenantId?: string;
  name: string;
  code?: string;
  isActive: boolean;
  logoUrl?: string;
  projects?: Project[];
}

export interface Project {
  id: string;
  tenantId?: string;
  name: string;
  code?: string;
  companyId: string;
  companyName?: string;
  isActive: boolean;
}

export interface CompaniesResponse {
  companies: Company[];
  total: number;
  page: number;
  limit: number;
}

export interface ProjectsResponse {
  projects: Project[];
}

export interface AppVersion {
  version: string;
  buildNumber: string;
  releaseDate: string;
}

export interface SearchResult {
  title: string;
  path: string;
  module: string;
  category: "module" | "page" | "action";
  icon?: string;
}

export interface FinancialYear {
  key: string;
  label: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  onLeave: number;
  newJoiners: number;
  pendingApprovals: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  details?: Record<string, string | number | boolean>;
}
