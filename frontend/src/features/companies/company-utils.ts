import type { CompanyMutationPayload, CompanyRecord } from "./types";

export interface CompanyRow {
  id: string;
  companyCode: string;
  legalName: string;
  displayName: string;
  cin: string;
  pan: string;
  gstin: string;
  baseCurrency: string;
  employeeCount: number;
  branchCount: number;
  projectCount: number;
  status: "Active" | "Inactive" | "Archived";
  createdAt: string;
  email?: string;
  phoneNumber?: string;
  websiteUrl?: string;
  registrationAddress?: string;
  operationalAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

const PLACEHOLDER = "—";

export const mapCompanyRecordToRow = (company: CompanyRecord): CompanyRow => ({
  id: company.id,
  companyCode: company.code?.trim() || PLACEHOLDER,
  legalName: company.legalName?.trim() || company.name,
  displayName: company.name,
  cin: company.registrationNumber?.trim() || PLACEHOLDER,
  pan: company.taxId?.trim() || PLACEHOLDER,
  gstin: company.taxId?.trim() || PLACEHOLDER,
  baseCurrency: "INR (₹)",
  employeeCount: company.maxEmployees ?? 0,
  branchCount: 0,
  projectCount: 0,
  status: company.isDeleted ? "Archived" : company.isActive ? "Active" : "Inactive",
  createdAt: PLACEHOLDER,
  email: company.email,
  phoneNumber: company.phoneNumber,
  websiteUrl: company.websiteUrl,
  registrationAddress: company.registrationAddress,
  operationalAddress: company.operationalAddress,
  city: company.city,
  state: company.state,
  country: company.country,
  postalCode: company.postalCode,
});

export const buildCreatePayloadFromWizard = (input: {
  name: string;
  code: string;
  legalName: string;
  cin: string;
  gstin: string;
  phone: string;
}): CompanyMutationPayload => ({
  name: input.name.trim(),
  legalName: input.legalName.trim() || undefined,
  code: input.code.trim().toUpperCase() || undefined,
  registrationNumber: input.cin.trim() || undefined,
  taxId: input.gstin.trim() || undefined,
  phoneNumber: input.phone.trim() || undefined,
  isActive: true,
});

export const buildClonePayload = (company: CompanyRow): CompanyMutationPayload => ({
  name: `${company.displayName} (Copy)`,
  legalName: company.legalName !== PLACEHOLDER ? `${company.legalName} (Copy)` : undefined,
  code: company.companyCode !== PLACEHOLDER ? `${company.companyCode}-COPY` : undefined,
  registrationNumber: company.cin !== PLACEHOLDER ? company.cin : undefined,
  taxId: company.gstin !== PLACEHOLDER ? company.gstin : undefined,
  email: company.email,
  phoneNumber: company.phoneNumber,
  websiteUrl: company.websiteUrl,
  registrationAddress: company.registrationAddress,
  operationalAddress: company.operationalAddress,
  city: company.city,
  state: company.state,
  country: company.country,
  postalCode: company.postalCode,
  isActive: true,
});
