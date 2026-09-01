export type TenantStatus = "active" | "inactive" | "suspended" | "trial";
export type PlanName = "Basic" | "Premium" | "Enterprise";

export interface TenantSummary {
  id: string;
  name: string;
  subdomain: string;
  isActive: boolean;
  subscriptionPlan?: string;
}

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  customDomain?: string | null;
  adminEmail: string;
  adminName: string;
  status: TenantStatus;
  subscriptionPlan: string;
  provisionStatus: string;
  selectedModules: string[];
  usersCount: number;
  contactNumber?: string | null;
  timezone: string;
  address?: string | null;
  district?: string | null;
  state?: string | null;
  pincode?: string | null;
  storageLimitGb?: number | null;
  employeeLimit?: number | null;
  whiteLabelEnabled: boolean;
  whatsAppIntegrationEnabled: boolean;
  smtpHost?: string | null;
  smtpFromEmail?: string | null;
  logoUrl?: string | null;
  trialExpiryDate?: string | null;
  billingStartDate?: string | null;
  billingEndDate?: string | null;
  lastActivityAt?: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt?: string | null;
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

export interface TenantFormValues {
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
}

export interface PaginatedTenants {
  data: Tenant[];
  totalCount: number;
  page: number;
  pageSize: number;
}
