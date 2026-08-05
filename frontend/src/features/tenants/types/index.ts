export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  customDomain?: string | null;
  adminEmail: string;
  adminName: string;
  status: "active" | "inactive" | "suspended" | "trial";
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

export interface PaginatedTenants {
  data: Tenant[];
  totalCount: number;
  page: number;
  pageSize: number;
}
