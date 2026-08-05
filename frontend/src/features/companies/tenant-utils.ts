"use client";

import type { PlanName, TenantDto, TenantFormValues, TenantStatus } from "@/features/companies/types";

export type ProvisionLog = {
  id: string;
  stepName: string;
  status: string;
  errorMessage?: string | null;
  durationMs: number;
  createdAt: string;
  correlationId: string;
};

export type TenantHealth = {
  provisionStatus: string;
  schemaName: string;
  schemaExists: boolean;
  hasAllCoreTables: boolean;
  missingTables: string[];
  usersCount: number;
  hasAdminUser: boolean;
  hasAdminRole: boolean;
  hasAdminRoleMapping: boolean;
  adminEmail: string;
  adminLastLoginAt?: string;
  passwordResetPending: boolean;
};

export const moduleOptions = [
  { key: "hrms", label: "HRMS", desc: "Employee, attendance, leave", group: "Core operations" },
  { key: "payroll", label: "Payroll", desc: "Salary, statutory, payslips", group: "Core operations" },
  { key: "erp_finance", label: "Finance", desc: "Accounting, payments, invoices", group: "ERP suite" },
  { key: "erp_inventory", label: "Inventory", desc: "Items, warehouses, stock", group: "ERP suite" },
  { key: "erp_procurement", label: "Procurement", desc: "Vendors, purchase orders, GRN", group: "ERP suite" },
  { key: "erp_sales", label: "CRM", desc: "Customers, quotations, sales orders", group: "ERP suite" },
  { key: "projects", label: "Projects", desc: "Project delivery and execution", group: "Delivery" },
  { key: "reports", label: "Reports", desc: "Cross-module analytics", group: "Analytics" },
] as const;

export const planPolicies: Record<PlanName, { name: PlanName; maxUsers: number; maxStorageGb: number; allowedModules: string[] }> = {
  Basic: { name: "Basic", maxUsers: 10, maxStorageGb: 25, allowedModules: ["hrms"] },
  Premium: { name: "Premium", maxUsers: 100, maxStorageGb: 200, allowedModules: ["hrms", "payroll", "reports"] },
  Enterprise: {
    name: "Enterprise",
    maxUsers: 1000,
    maxStorageGb: 1000,
    allowedModules: ["hrms", "payroll", "reports", "erp_finance", "erp_procurement", "erp_inventory", "erp_sales", "projects"],
  },
};

export const wizardSteps = [
  { id: 1, title: "Basic Details", caption: "Identity and workspace naming" },
  { id: 2, title: "Contact Details", caption: "Primary contact and location" },
  { id: 3, title: "Subscription", caption: "Plan, billing, and limits" },
  { id: 4, title: "Module Access", caption: "Enabled capabilities" },
  { id: 5, title: "Admin User", caption: "Initial owner access" },
  { id: 6, title: "Review & Create", caption: "Verify before submission" },
] as const;

export function getDefaultTenantForm(): TenantFormValues {
  return {
    name: "",
    subdomain: "",
    status: "active",
    subscriptionPlan: "Basic",
    contactPersonName: "",
    contactPersonEmail: "",
    adminName: "",
    adminEmail: "",
    adminRole: "Admin",
    adminPassword: "",
    sendInviteLink: false,
    selectedModules: ["hrms"],
    contactNumber: "",
    address: "",
    state: "",
    district: "",
    pincode: "",
    logoUrl: "",
    billingStartDate: "",
    billingEndDate: "",
    trialExpiryDate: "",
    employeeLimit: "10",
    storageLimitGb: "25",
    smsCredits: "",
    timezone: "Asia/Kolkata",
    currency: "INR",
    language: "en",
    whatsAppIntegrationEnabled: false,
    smtpHost: "",
    smtpPort: "",
    smtpUsername: "",
    smtpPassword: "",
    smtpFromEmail: "",
    customDomain: "",
    whiteLabelEnabled: false,
  };
}

export const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
};

export const getErrorMessage = (err: unknown, fallback: string) => {
  if (err && typeof err === "object") {
    const response = (
      err as {
        response?: {
          data?: {
            message?: string;
            detail?: string;
            title?: string;
            errors?: Record<string, string[] | string>;
          };
        };
      }
    ).response;
    const data = response?.data;
    const message = data?.detail || data?.message || data?.title;
    if (message) return message;

    const validationErrors = data?.errors;
    if (validationErrors && typeof validationErrors === "object") {
      for (const key of Object.keys(validationErrors)) {
        const value = validationErrors[key];
        if (Array.isArray(value) && value.length > 0 && value[0]) return value[0];
        if (typeof value === "string" && value.trim()) return value.trim();
      }
      return "Validation failed. Please review the form fields.";
    }
  }

  return err instanceof Error ? err.message : fallback;
};

export const normalizeTenantStatus = (value?: string, isActive?: boolean): TenantStatus => {
  if (value === "active" || value === "inactive" || value === "suspended" || value === "trial") {
    return value;
  }
  return isActive ? "active" : "inactive";
};

export const parseTenant = (raw: Record<string, unknown>): TenantDto => {
  const stringValue = (camel: string, pascal: string) => {
    const value = raw[camel] ?? raw[pascal];
    return typeof value === "string" ? value : "";
  };
  const booleanValue = (camel: string, pascal: string) => {
    const value = raw[camel] ?? raw[pascal];
    return typeof value === "boolean" ? value : false;
  };
  const numberValue = (camel: string, pascal: string) => {
    const value = raw[camel] ?? raw[pascal];
    return typeof value === "number" ? value : undefined;
  };
  const dateValue = (camel: string, pascal: string) => {
    const value = raw[camel] ?? raw[pascal];
    if (typeof value === "string") return value;
    if (value instanceof Date) return value.toISOString();
    return undefined;
  };
  const arrayValue = (camel: string, pascal: string) => {
    const value = raw[camel] ?? raw[pascal];
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  };

  const adminName = stringValue("adminName", "AdminName");
  const adminEmail = stringValue("adminEmail", "AdminEmail");
  const isActive = booleanValue("isActive", "IsActive");

  return {
    id: stringValue("id", "Id"),
    name: stringValue("name", "Name"),
    subdomain: stringValue("subdomain", "Subdomain"),
    isDeleted: booleanValue("isDeleted", "IsDeleted"),
    isActive,
    status: normalizeTenantStatus(stringValue("status", "Status"), isActive),
    provisionStatus: stringValue("provisionStatus", "ProvisionStatus") || "Pending",
    subscriptionPlan: (stringValue("subscriptionPlan", "SubscriptionPlan") || "Basic") as PlanName,
    selectedModules: arrayValue("selectedModules", "SelectedModules"),
    adminEmail,
    adminName,
    adminRole: stringValue("adminRole", "AdminRole") || "Admin",
    adminCreated: booleanValue("adminCreated", "AdminCreated"),
    passwordResetPending: booleanValue("passwordResetPending", "PasswordResetPending"),
    lastRepairAt: dateValue("lastRepairAt", "LastRepairAt"),
    createdAt: dateValue("createdAt", "CreatedAt") || new Date().toISOString(),
    usersCount: numberValue("usersCount", "UsersCount") ?? 0,
    lastActivityAt: dateValue("lastActivityAt", "LastActivityAt"),
    contactNumber: stringValue("contactNumber", "ContactNumber"),
    timezone: stringValue("timezone", "Timezone") || "Asia/Kolkata",
    currency: stringValue("currency", "Currency") || "INR",
    language: stringValue("language", "Language") || "en",
    address: stringValue("address", "Address"),
    state: stringValue("state", "State"),
    district: stringValue("district", "District"),
    pincode: stringValue("pincode", "Pincode"),
    gstNumber: stringValue("gstNumber", "GstNumber"),
    panNumber: stringValue("panNumber", "PanNumber"),
    logoUrl: stringValue("logoUrl", "LogoUrl"),
    billingStartDate: dateValue("billingStartDate", "BillingStartDate"),
    billingEndDate: dateValue("billingEndDate", "BillingEndDate"),
    trialExpiryDate: dateValue("trialExpiryDate", "TrialExpiryDate"),
    employeeLimit: numberValue("employeeLimit", "EmployeeLimit"),
    storageLimitGb: numberValue("storageLimitGb", "StorageLimitGb"),
    smsCredits: numberValue("smsCredits", "SmsCredits"),
    whatsAppIntegrationEnabled: booleanValue("whatsAppIntegrationEnabled", "WhatsAppIntegrationEnabled"),
    smtpHost: stringValue("smtpHost", "SmtpHost"),
    smtpPort: numberValue("smtpPort", "SmtpPort"),
    smtpUsername: stringValue("smtpUsername", "SmtpUsername"),
    smtpFromEmail: stringValue("smtpFromEmail", "SmtpFromEmail"),
    customDomain: stringValue("customDomain", "CustomDomain"),
    whiteLabelEnabled: booleanValue("whiteLabelEnabled", "WhiteLabelEnabled"),
  };
};

export const buildTenantFormFromDto = (tenant: TenantDto): TenantFormValues => ({
  name: tenant.name,
  subdomain: tenant.subdomain.toLowerCase(),
  status: tenant.status,
  subscriptionPlan: tenant.subscriptionPlan,
  contactPersonName: tenant.adminName,
  contactPersonEmail: tenant.adminEmail,
  adminName: tenant.adminName,
  adminEmail: tenant.adminEmail,
  adminRole: tenant.adminRole === "SuperAdmin" ? "SuperAdmin" : "Admin",
  adminPassword: "",
  sendInviteLink: false,
  selectedModules: tenant.selectedModules,
  contactNumber: tenant.contactNumber || "",
  address: tenant.address || "",
  state: tenant.state || "",
  district: tenant.district || "",
  pincode: tenant.pincode || "",
  logoUrl: tenant.logoUrl || "",
  billingStartDate: tenant.billingStartDate || "",
  billingEndDate: tenant.billingEndDate || "",
  trialExpiryDate: tenant.trialExpiryDate || "",
  employeeLimit: tenant.employeeLimit ? String(tenant.employeeLimit) : "",
  storageLimitGb: tenant.storageLimitGb ? String(tenant.storageLimitGb) : "",
  smsCredits: tenant.smsCredits ? String(tenant.smsCredits) : "",
  timezone: tenant.timezone,
  currency: tenant.currency,
  language: tenant.language,
  whatsAppIntegrationEnabled: tenant.whatsAppIntegrationEnabled,
  smtpHost: tenant.smtpHost || "",
  smtpPort: tenant.smtpPort ? String(tenant.smtpPort) : "",
  smtpUsername: tenant.smtpUsername || "",
  smtpPassword: "",
  smtpFromEmail: tenant.smtpFromEmail || "",
  customDomain: tenant.customDomain || "",
  whiteLabelEnabled: tenant.whiteLabelEnabled,
});

const parseNumber = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export const buildTenantCreatePayload = (values: TenantFormValues) => ({
  tenantProvisionRequestId: `tenant-${Date.now()}`,
  name: values.name.trim(),
  subdomain: values.subdomain.trim().toLowerCase(),
  status: values.status,
  subscriptionPlan: values.subscriptionPlan,
  adminName: values.adminName.trim(),
  adminEmail: values.adminEmail.trim(),
  adminRole: values.adminRole,
  adminPassword: values.sendInviteLink ? undefined : values.adminPassword.trim(),
  sendInviteLink: values.sendInviteLink,
  selectedModules: values.selectedModules,
  contactNumber: values.contactNumber.trim() || undefined,
  address: values.address.trim() || undefined,
  state: values.state.trim() || undefined,
  district: values.district.trim() || undefined,
  pincode: values.pincode.trim() || undefined,
  logoUrl: values.logoUrl.trim() || undefined,
  billingStartDate: values.billingStartDate || undefined,
  billingEndDate: values.billingEndDate || undefined,
  trialExpiryDate: values.trialExpiryDate || undefined,
  employeeLimit: parseNumber(values.employeeLimit),
  storageLimitGb: parseNumber(values.storageLimitGb),
  smsCredits: parseNumber(values.smsCredits),
  timezone: values.timezone,
  currency: values.currency,
  language: values.language,
  whatsAppIntegrationEnabled: values.whatsAppIntegrationEnabled,
  smtpHost: values.smtpHost.trim() || undefined,
  smtpPort: parseNumber(values.smtpPort),
  smtpUsername: values.smtpUsername.trim() || undefined,
  smtpPassword: values.smtpPassword.trim() || undefined,
  smtpFromEmail: values.smtpFromEmail.trim() || undefined,
  customDomain: values.customDomain.trim() || undefined,
  whiteLabelEnabled: values.whiteLabelEnabled,
});

export const buildTenantUpdatePayload = (values: TenantFormValues) => ({
  name: values.name.trim() || undefined,
  status: values.status,
  subscriptionPlan: values.subscriptionPlan,
  selectedModules: values.selectedModules,
  adminName: values.adminName.trim() || undefined,
  adminEmail: values.adminEmail.trim() || undefined,
  contactNumber: values.contactNumber.trim() || undefined,
  address: values.address.trim() || undefined,
  state: values.state.trim() || undefined,
  district: values.district.trim() || undefined,
  pincode: values.pincode.trim() || undefined,
  logoUrl: values.logoUrl.trim() || undefined,
  billingStartDate: values.billingStartDate || undefined,
  billingEndDate: values.billingEndDate || undefined,
  trialExpiryDate: values.trialExpiryDate || undefined,
  employeeLimit: parseNumber(values.employeeLimit),
  storageLimitGb: parseNumber(values.storageLimitGb),
  smsCredits: parseNumber(values.smsCredits),
  timezone: values.timezone,
  currency: values.currency,
  language: values.language,
  whatsAppIntegrationEnabled: values.whatsAppIntegrationEnabled,
  smtpHost: values.smtpHost.trim() || undefined,
  smtpPort: parseNumber(values.smtpPort),
  smtpUsername: values.smtpUsername.trim() || undefined,
  smtpPassword: values.smtpPassword.trim() || undefined,
  smtpFromEmail: values.smtpFromEmail.trim() || undefined,
  customDomain: values.customDomain.trim() || undefined,
  whiteLabelEnabled: values.whiteLabelEnabled,
});
