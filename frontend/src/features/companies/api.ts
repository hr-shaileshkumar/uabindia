import apiClient from "@/services/apiClient";
import type {
  CompanyRecord,
  CompanyDeleteResponse,
  CompanyListResponse,
  CompanyMutationPayload,
  CompanyResponse,
  TenantDto,
  TenantSummary,
  TenantListResponse,
} from "./types";

export const companiesRootQueryKey = ["companies"] as const;
export const companiesQueryKey = (page: number, limit: number, tenant?: string, includeDeleted?: boolean) =>
  [...companiesRootQueryKey, page, limit, tenant ?? "all-tenants", includeDeleted ? "with-deleted" : "active-only"] as const;
export const tenantsQueryKey = ["platform", "tenants"] as const;
export const tenantQueryKey = (id: string) => ["platform", "tenant", id] as const;

const toObject = (value: unknown): Record<string, unknown> =>
  (value && typeof value === "object" ? (value as Record<string, unknown>) : {});

const readString = (raw: Record<string, unknown>, camel: string, pascal: string): string | undefined => {
  const value = raw[camel] ?? raw[pascal];
  return typeof value === "string" ? value : undefined;
};

const readBoolean = (raw: Record<string, unknown>, camel: string, pascal: string): boolean | undefined => {
  const value = raw[camel] ?? raw[pascal];
  return typeof value === "boolean" ? value : undefined;
};

const readNumber = (raw: Record<string, unknown>, camel: string, pascal: string): number | undefined => {
  const value = raw[camel] ?? raw[pascal];
  return typeof value === "number" ? value : undefined;
};

const normalizeCompany = (value: unknown, index: number): CompanyRecord => {
  const raw = toObject(value);
  return {
    id: readString(raw, "id", "Id") || `company-${index}`,
    tenantId: readString(raw, "tenantId", "TenantId"),
    isDeleted: readBoolean(raw, "isDeleted", "IsDeleted") ?? false,
    name: readString(raw, "name", "Name") || "",
    legalName: readString(raw, "legalName", "LegalName"),
    code: readString(raw, "code", "Code"),
    registrationNumber: readString(raw, "registrationNumber", "RegistrationNumber"),
    taxId: readString(raw, "taxId", "TaxId"),
    email: readString(raw, "email", "Email"),
    phoneNumber: readString(raw, "phoneNumber", "PhoneNumber"),
    websiteUrl: readString(raw, "websiteUrl", "WebsiteUrl"),
    logoUrl: readString(raw, "logoUrl", "LogoUrl"),
    industry: readString(raw, "industry", "Industry"),
    companySize: readString(raw, "companySize", "CompanySize"),
    registrationAddress: readString(raw, "registrationAddress", "RegistrationAddress"),
    operationalAddress: readString(raw, "operationalAddress", "OperationalAddress"),
    city: readString(raw, "city", "City"),
    state: readString(raw, "state", "State"),
    postalCode: readString(raw, "postalCode", "PostalCode"),
    country: readString(raw, "country", "Country"),
    bankAccountNumber: readString(raw, "bankAccountNumber", "BankAccountNumber"),
    bankName: readString(raw, "bankName", "BankName"),
    bankBranch: readString(raw, "bankBranch", "BankBranch"),
    ifscCode: readString(raw, "ifscCode", "IFSCCode"),
    financialYearStart: readString(raw, "financialYearStart", "FinancialYearStart"),
    financialYearEnd: readString(raw, "financialYearEnd", "FinancialYearEnd"),
    maxEmployees: readNumber(raw, "maxEmployees", "MaxEmployees"),
    contactPersonName: readString(raw, "contactPersonName", "ContactPersonName"),
    contactPersonPhone: readString(raw, "contactPersonPhone", "ContactPersonPhone"),
    contactPersonEmail: readString(raw, "contactPersonEmail", "ContactPersonEmail"),
    hr_PersonName: readString(raw, "hr_PersonName", "HR_PersonName"),
    hr_PersonEmail: readString(raw, "hr_PersonEmail", "HR_PersonEmail"),
    notes: readString(raw, "notes", "Notes"),
    isActive: readBoolean(raw, "isActive", "IsActive") ?? true,
  };
};

const normalizeTenant = (value: unknown, index: number): TenantSummary => {
  const raw = toObject(value);
  return {
    id: readString(raw, "id", "Id") || `tenant-${index}`,
    name: readString(raw, "name", "Name") || "",
    subdomain: readString(raw, "subdomain", "Subdomain") || "",
    isActive: readBoolean(raw, "isActive", "IsActive") ?? true,
  };
};

export const listCompanies = async (page = 1, limit = 10, tenant?: string, includeDeleted = false) => {
  const response = await apiClient.get<CompanyListResponse>(`/companies?page=${page}&limit=${limit}${includeDeleted ? "&includeDeleted=true" : ""}`, tenant
    ? { headers: { "X-Tenant": tenant } }
    : undefined);
  const payload = toObject(response.data);
  const rawCompanies = Array.isArray(payload.companies) ? payload.companies : [];

  return {
    ...response.data,
    companies: rawCompanies.map((company, index) => normalizeCompany(company, index)),
    total: typeof payload.total === "number" ? payload.total : 0,
    page: typeof payload.page === "number" ? payload.page : page,
    limit: typeof payload.limit === "number" ? payload.limit : limit,
  } as CompanyListResponse;
};

export const createCompany = async (payload: CompanyMutationPayload, options?: { tenant?: string }) => {
  const response = await apiClient.post<CompanyResponse>(
    "/companies",
    payload,
    options?.tenant ? { headers: { "X-Tenant": options.tenant } } : undefined
  );

  return response.data;
};

export const updateCompany = async (id: string, payload: CompanyMutationPayload) => {
  const response = await apiClient.put<CompanyResponse>(`/companies/${id}`, payload);
  return response.data;
};

export const deleteCompany = async (id: string) => {
  const response = await apiClient.delete<CompanyDeleteResponse>(`/companies/${id}`);
  return response.data;
};

export const getTenantById = async (id: string) => {
  const response = await apiClient.get<TenantListResponse>("/tenants");
  const payload = toObject(response.data);
  const rawTenants = Array.isArray(payload.tenants) ? payload.tenants : [];
  const normalized = rawTenants.map((tenant) => normalizeTenant(tenant, 0));
  const tenant = normalized.find((item) => item.id === id);

  return {
    ...response.data,
    tenant,
  } as unknown as { success?: boolean; tenant?: TenantDto };
};

export const listTenants = async () => {
  const response = await apiClient.get<TenantListResponse>("/tenants");
  const payload = toObject(response.data);
  const rawTenants = Array.isArray(payload.tenants) ? payload.tenants : [];

  return {
    ...response.data,
    tenants: rawTenants.map((tenant, index) => normalizeTenant(tenant, index)),
  } as TenantListResponse;
};
