export interface CompanyRecord {
  id: string;
  tenantId?: string;
  isDeleted?: boolean;
  name: string;
  legalName?: string;
  code?: string;
  registrationNumber?: string;
  taxId?: string;
  email?: string;
  phoneNumber?: string;
  websiteUrl?: string;
  logoUrl?: string;
  industry?: string;
  companySize?: string;
  registrationAddress?: string;
  operationalAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankBranch?: string;
  ifscCode?: string;
  financialYearStart?: string;
  financialYearEnd?: string;
  maxEmployees?: number;
  contactPersonName?: string;
  contactPersonPhone?: string;
  contactPersonEmail?: string;
  hr_PersonName?: string;
  hr_PersonEmail?: string;
  notes?: string;
  isActive: boolean;
}

export interface CompanyDraft extends Omit<Partial<CompanyRecord>, "id" | "maxEmployees" | "isActive"> {
  maxEmployees?: number | string;
  isActive: boolean;
}

export type CompanyMutationPayload = Partial<Omit<CompanyRecord, "id">>;

export interface CompanyListResponse {
  success?: boolean;
  companies: CompanyRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface CompanyResponse {
  success?: boolean;
  message?: string;
  company: CompanyRecord;
}

export interface CompanyDeleteResponse {
  success?: boolean;
  message?: string;
}

import type { TenantDto } from "@/features/tenants/types";

export interface TenantListResponse {
  success?: boolean;
  message?: string;
  tenants?: TenantDto[];
  total?: number;
}

// Re-export centralized Tenant types for backwards-compatibility
export type {
  TenantStatus,
  PlanName,
  TenantSummary,
  TenantDto,
  TenantFormValues,
} from "@/features/tenants/types";
