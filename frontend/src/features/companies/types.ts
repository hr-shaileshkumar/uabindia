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

export type TenantStatus = "active" | "inactive" | "suspended" | "trial";
export type PlanName = "Basic" | "Premium" | "Enterprise";

export interface TenantSummary {
  id: string;
  name: string;
  subdomain: string;
  isActive: boolean;
}

export interface TenantDto extends TenantSummary {
  isDeleted?: boolean;
  status: TenantStatus;
  provisionStatus: string;
  subscriptionPlan: PlanName;
  selectedModules: string[];
  adminEmail: string;
  adminName: string;
  adminRole: string;
  adminCreated: boolean;
  passwordResetPending: boolean;
  lastRepairAt?: string;
  createdAt: string;
  usersCount: number;
  lastActivityAt?: string;
  contactNumber?: string;
  timezone: string;
  currency: string;
  language: string;
  address?: string;
  state?: string;
  district?: string;
  pincode?: string;
  gstNumber?: string;
  panNumber?: string;
  logoUrl?: string;
  billingStartDate?: string;
  billingEndDate?: string;
  trialExpiryDate?: string;
  employeeLimit?: number;
  storageLimitGb?: number;
  smsCredits?: number;
  whatsAppIntegrationEnabled: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpFromEmail?: string;
  customDomain?: string;
  whiteLabelEnabled: boolean;
}

export type TenantFormValues = {
  name: string;
  subdomain: string;
  status: TenantStatus;
  subscriptionPlan: PlanName;
  contactPersonName: string;
  contactPersonEmail: string;
  adminName: string;
  adminEmail: string;
  adminRole: "Admin" | "SuperAdmin";
  adminPassword: string;
  sendInviteLink: boolean;
  selectedModules: string[];
  contactNumber: string;
  address: string;
  state: string;
  district: string;
  pincode: string;
  logoUrl: string;
  billingStartDate: string;
  billingEndDate: string;
  trialExpiryDate: string;
  employeeLimit: string;
  storageLimitGb: string;
  smsCredits: string;
  timezone: string;
  currency: string;
  language: string;
  whatsAppIntegrationEnabled: boolean;
  smtpHost: string;
  smtpPort: string;
  smtpUsername: string;
  smtpPassword: string;
  smtpFromEmail: string;
  customDomain: string;
  whiteLabelEnabled: boolean;
};

export interface TenantListResponse {
  success?: boolean;
  tenants: TenantSummary[];
}
