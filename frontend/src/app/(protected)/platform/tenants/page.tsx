"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";
import { useOrgContext } from "@/context/OrgContext";
import { usePermissions } from "@/context/PermissionContext";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { useConfirmDialog } from "@/components/ui/useConfirmDialog";
import { useTableSelection } from "@/hooks/useTableSelection";
import { BulkActionBar } from "@/components/table/BulkActionBar";
import { BulkEditDialog } from "@/components/table/BulkEditDialog";
import { SelectionCheckbox } from "@/components/table/SelectionCheckbox";
import { SelectAllCheckbox } from "@/components/table/SelectAllCheckbox";
import type { BulkActionFieldConfig } from "@/features/shared/types/bulkActions";

type TenantStatus = "active" | "inactive" | "suspended" | "trial";

type TenantRow = {
  id: string;
  name: string;
  subdomain: string;
  isDeleted?: boolean;
  isActive: boolean;
  status?: TenantStatus;
  provisionStatus?: string;
  subscriptionPlan?: string;
  selectedModules?: string[];
  adminEmail?: string;
  adminName?: string;
  adminRole?: "Admin" | "SuperAdmin";
  adminCreated?: boolean;
  passwordResetPending?: boolean;
  lastRepairAt?: string;
  createdAt?: string;
  usersCount?: number;
  lastActivityAt?: string;
  contactNumber?: string;
  timezone?: string;
  currency?: string;
  language?: string;
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
  whatsAppIntegrationEnabled?: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpFromEmail?: string;
  customDomain?: string;
  whiteLabelEnabled?: boolean;
};

type TenantProvisionLogRow = {
  id: string;
  tenantId: string;
  stepName: string;
  status: string;
  errorMessage?: string | null;
  durationMs: number;
  createdAt: string;
  correlationId: string;
};

type TenantHealthRow = {
  tenantId: string;
  tenantName: string;
  subdomain: string;
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
  updatedAt?: string;
};

type TenantForm = {
  name: string;
  subdomain: string;
  status: TenantStatus;
  subscriptionPlan: string;
  adminName: string;
  adminEmail: string;
  adminRole: "Admin" | "SuperAdmin";
  adminPassword: string;
  sendInviteLink: boolean;
  selectedModules: string[];
  contactNumber: string;
  gstNumber: string;
  panNumber: string;
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
  smtpFromEmail: string;
  customDomain: string;
  whiteLabelEnabled: boolean;
};

const moduleOptions = [
  { key: "operations", label: "Workspace", desc: "Dashboard, approvals, notifications, and documents" },
  { key: "erp_finance", label: "Finance", desc: "Accounting, payments, invoices, and tax" },
  { key: "erp_procurement", label: "Procurement", desc: "Vendors, requests, orders, and GRN" },
  { key: "erp_sales", label: "Sales & CRM", desc: "Customers, quotations, orders, and returns" },
  { key: "erp_inventory", label: "Inventory", desc: "Items, warehouses, stock, adjustments, and transfers" },
  { key: "hrms", label: "HRMS", desc: "Employee, attendance, leave" },
  { key: "payroll", label: "Payroll", desc: "Salary, statutory, payslips" },
  { key: "reports", label: "Reports", desc: "Cross-module analytics" },
] as const;

const coreModules = new Set(["platform", "licensing", "security"]);

type PlanPolicy = {
  name: "Basic" | "Premium" | "Enterprise";
  maxUsers: number;
  maxStorageGb: number;
  allowedModules: string[];
};

const planPolicies: Record<"Basic" | "Premium" | "Enterprise", PlanPolicy> = {
  Basic: { name: "Basic", maxUsers: 10, maxStorageGb: 25, allowedModules: ["hrms"] },
  Premium: { name: "Premium", maxUsers: 100, maxStorageGb: 200, allowedModules: ["hrms", "payroll", "reports", "operations"] },
  Enterprise: { name: "Enterprise", maxUsers: 1000, maxStorageGb: 1000, allowedModules: ["operations", "erp_finance", "erp_procurement", "erp_sales", "erp_inventory", "hrms", "payroll", "reports"] },
};

const getPlanPolicy = (plan: string) => {
  const normalized = plan.trim().toLowerCase();
  if (normalized === "premium") return planPolicies.Premium;
  if (normalized === "enterprise") return planPolicies.Enterprise;
  return planPolicies.Basic;
};

const defaultForm = (): TenantForm => ({
  name: "",
  subdomain: "",
  status: "active",
  subscriptionPlan: "Basic",
  adminName: "",
  adminEmail: "",
  adminRole: "Admin",
  adminPassword: "",
  sendInviteLink: false,
  selectedModules: ["hrms"],
  contactNumber: "",
  gstNumber: "",
  panNumber: "",
  address: "",
  state: "",
  district: "",
  pincode: "",
  logoUrl: "",
  billingStartDate: "",
  billingEndDate: "",
  trialExpiryDate: "",
  employeeLimit: String(planPolicies.Basic.maxUsers),
  storageLimitGb: String(planPolicies.Basic.maxStorageGb),
  smsCredits: "",
  timezone: "Asia/Kolkata",
  currency: "INR",
  language: "en",
  whatsAppIntegrationEnabled: false,
  smtpHost: "",
  smtpPort: "",
  smtpUsername: "",
  smtpFromEmail: "",
  customDomain: "",
  whiteLabelEnabled: false,
});

const wizardSteps = [
  { id: 1, title: "Company", icon: "🏢" },
  { id: 2, title: "Admin", icon: "👤" },
  { id: 3, title: "Modules", icon: "🧩" },
  { id: 4, title: "Plan", icon: "🧾" },
  { id: 5, title: "Review", icon: "✅" },
] as const;

const statusBadgeClass: Record<TenantStatus, string> = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-slate-100 text-slate-700",
  suspended: "bg-red-100 text-red-700",
  trial: "bg-amber-100 text-amber-700",
};

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err && typeof err === "object") {
    const response = (err as {
      response?: {
        data?: {
          message?: string;
          detail?: string;
          title?: string;
          errors?: Record<string, string[] | string>;
        };
      };
    }).response;

    const data = response?.data;
    const message = data?.detail || data?.message || data?.title;
    if (message) return message;

    const validationErrors = data?.errors;
    if (validationErrors && typeof validationErrors === "object") {
      for (const key of Object.keys(validationErrors)) {
        const val = validationErrors[key];
        if (Array.isArray(val) && val.length > 0 && val[0]) return val[0];
        if (typeof val === "string" && val.trim()) return val.trim();
      }
      return "Validation failed. Please review the form fields.";
    }
  }

  if (err instanceof Error) return err.message;
  return fallback;
};

const toNumberOrUndefined = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const toDateOrUndefined = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const formatDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
};

export default function TenantsPage() {
  const { confirm, confirmDialog } = useConfirmDialog();
  const router = useRouter();
  // Platform pages are global admin views – intentionally ignore topbar org context
  const { companyId: ctxCompanyId } = useOrgContext();
  const { isSuperAdmin } = usePermissions();
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [showDeleted, setShowDeleted] = useState(false);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [form, setForm] = useState<TenantForm>(defaultForm());

  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const [editingTenant, setEditingTenant] = useState<TenantRow | null>(null);
  const [logsTenant, setLogsTenant] = useState<TenantRow | null>(null);
  const [provisionLogs, setProvisionLogs] = useState<TenantProvisionLogRow[]>([]);
  const [tenantHealth, setTenantHealth] = useState<TenantHealthRow | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [repairingTenantId, setRepairingTenantId] = useState<string | null>(null);
  const [companyTenantMap, setCompanyTenantMap] = useState<Record<string, string>>({});
  const isBusy = creating || updating || deletingId !== null;

  // ─── Bulk selection ──────────────────────────────────────────────────────────
  const selection = useTableSelection<TenantRow>();
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkApplying, setBulkApplying] = useState(false);

  const tenantBulkFields: BulkActionFieldConfig[] = [
    {
      key: "status", label: "Status", fieldType: "select",
      options: [
        { value: "active", label: "Active" }, { value: "inactive", label: "Inactive" },
        { value: "suspended", label: "Suspended" }, { value: "trial", label: "Trial" },
      ],
    },
    {
      key: "subscriptionPlan", label: "Subscription Plan", fieldType: "select",
      options: [
        { value: "Basic", label: "Basic" }, { value: "Premium", label: "Premium" },
        { value: "Enterprise", label: "Enterprise" },
      ],
    },
    { key: "timezone", label: "Timezone", fieldType: "text", placeholder: "Asia/Kolkata" },
    { key: "currency", label: "Currency", fieldType: "text", placeholder: "INR" },
    { key: "language", label: "Language", fieldType: "text", placeholder: "en" },
  ];

  const handleBulkDelete = async () => {
    const count = selection.selectionCount;
    const ok = await confirm({
      title: "Delete selected tenants",
      message: `Delete ${count} selected tenant${count === 1 ? "" : "s"}? You can restore from the deleted list.`,
      confirmText: "Delete All",
      variant: "danger",
    });
    if (!ok) return;
    let successCount = 0;
    for (const tenant of selection.selectedItems) {
      try { await hrApi.platform.deleteTenant(tenant.id); successCount += 1; } catch { /* continue */ }
    }
    selection.clearSelection();
    notifySuccess(`Deleted ${successCount} of ${count} tenant${count === 1 ? "" : "s"}.`);
    await load();
  };

  const handleBulkEdit = async (updates: Record<string, unknown>) => {
    setBulkApplying(true);
    let successCount = 0;
    const count = selection.selectionCount;
    for (const tenant of selection.selectedItems) {
      try {
        await hrApi.platform.updateTenant(tenant.id, updates as Parameters<typeof hrApi.platform.updateTenant>[1]);
        successCount += 1;
      } catch { /* continue */ }
    }
    setBulkApplying(false);
    setBulkEditOpen(false);
    selection.clearSelection();
    notifySuccess(`Updated ${successCount} of ${count} tenant${count === 1 ? "" : "s"}.`);
    await load();
  };

  const subdomainPreview = useMemo(() => {
    if (!form.subdomain.trim()) return "{tenant-code}.yourdomain.com";
    return `${form.subdomain.trim()}.yourdomain.com`;
  }, [form.subdomain]);

  const normalizeTenant = (raw: Record<string, unknown>): TenantRow => {
    const readId = () => {
      const value = raw.id ?? raw.Id ?? raw.tenantId ?? raw.TenantId;
      if (typeof value === "string") return value;
      if (typeof value === "number" || typeof value === "bigint") return String(value);
      return undefined;
    };

    const readString = (camel: string, pascal: string) => {
      const value = raw[camel] ?? raw[pascal];
      return typeof value === "string" ? value : undefined;
    };
    const readBoolean = (camel: string, pascal: string) => {
      const value = raw[camel] ?? raw[pascal];
      return typeof value === "boolean" ? value : undefined;
    };
    const readNumber = (camel: string, pascal: string) => {
      const value = raw[camel] ?? raw[pascal];
      return typeof value === "number" ? value : undefined;
    };
    const readArray = (camel: string, pascal: string) => {
      const value = raw[camel] ?? raw[pascal];
      return Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : undefined;
    };

    const isActive = readBoolean("isActive", "IsActive") ?? false;
    const statusRaw = (readString("status", "Status") || (isActive ? "active" : "inactive")).toLowerCase();
    const status: TenantStatus = statusRaw === "trial" || statusRaw === "inactive" || statusRaw === "suspended"
      ? statusRaw
      : "active";

    return {
      id: readId() || "",
      name: readString("name", "Name") || "",
      subdomain: readString("subdomain", "Subdomain") || "",
      isDeleted: readBoolean("isDeleted", "IsDeleted") ?? false,
      isActive,
      status,
      provisionStatus: readString("provisionStatus", "ProvisionStatus") || "Pending",
      subscriptionPlan: readString("subscriptionPlan", "SubscriptionPlan") || "Basic",
      selectedModules: readArray("selectedModules", "SelectedModules") || [],
      adminEmail: readString("adminEmail", "AdminEmail") || "",
      adminName: readString("adminName", "AdminName") || "",
      adminRole: ((readString("adminRole", "AdminRole") || "Admin") as "Admin" | "SuperAdmin"),
      adminCreated: readBoolean("adminCreated", "AdminCreated") ?? false,
      passwordResetPending: readBoolean("passwordResetPending", "PasswordResetPending") ?? false,
      lastRepairAt: readString("lastRepairAt", "LastRepairAt"),
      createdAt: readString("createdAt", "CreatedAt"),
      usersCount: readNumber("usersCount", "UsersCount") ?? 0,
      lastActivityAt: readString("lastActivityAt", "LastActivityAt"),
      contactNumber: readString("contactNumber", "ContactNumber"),
      timezone: readString("timezone", "Timezone") || "Asia/Kolkata",
      currency: readString("currency", "Currency") || "INR",
      language: readString("language", "Language") || "en",
      address: readString("address", "Address"),
      state: readString("state", "State"),
      district: readString("district", "District"),
      pincode: readString("pincode", "Pincode"),
      gstNumber: readString("gstNumber", "GstNumber"),
      panNumber: readString("panNumber", "PanNumber"),
      logoUrl: readString("logoUrl", "LogoUrl"),
      billingStartDate: readString("billingStartDate", "BillingStartDate"),
      billingEndDate: readString("billingEndDate", "BillingEndDate"),
      trialExpiryDate: readString("trialExpiryDate", "TrialExpiryDate"),
      employeeLimit: readNumber("employeeLimit", "EmployeeLimit"),
      storageLimitGb: readNumber("storageLimitGb", "StorageLimitGb"),
      smsCredits: readNumber("smsCredits", "SmsCredits"),
      whatsAppIntegrationEnabled: readBoolean("whatsAppIntegrationEnabled", "WhatsAppIntegrationEnabled"),
      smtpHost: readString("smtpHost", "SmtpHost"),
      smtpPort: readNumber("smtpPort", "SmtpPort"),
      smtpUsername: readString("smtpUsername", "SmtpUsername"),
      smtpFromEmail: readString("smtpFromEmail", "SmtpFromEmail"),
      customDomain: readString("customDomain", "CustomDomain"),
      whiteLabelEnabled: readBoolean("whiteLabelEnabled", "WhiteLabelEnabled"),
    };
  };

  const planOptions = useMemo(
    () => Array.from(new Set(["Basic", "Premium", "Enterprise", ...tenants.map((t) => t.subscriptionPlan || "Basic")])),
    [tenants]
  );

  const filteredTenants = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return tenants.filter((tenant) => {
      if (showDeleted) {
        if (!tenant.isDeleted) return false;
      } else if (tenant.isDeleted) {
        return false;
      }

      const status = tenant.status || (tenant.isActive ? "active" : "inactive");
      const plan = tenant.subscriptionPlan || "Basic";
      const adminName = tenant.adminName || "";
      const adminEmail = tenant.adminEmail || "";
      const modules = (tenant.selectedModules || []).filter((m) => !coreModules.has(m));

      const matchesKeyword =
        !keyword ||
        tenant.name.toLowerCase().includes(keyword) ||
        tenant.subdomain.toLowerCase().includes(keyword) ||
        adminName.toLowerCase().includes(keyword) ||
        adminEmail.toLowerCase().includes(keyword) ||
        modules.join(" ").toLowerCase().includes(keyword);

      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesPlan = planFilter === "all" || plan === planFilter;

      // When a specific company is selected, show only its tenant
      if (ctxCompanyId) {
        const tenantId = companyTenantMap[ctxCompanyId];
        if (!tenantId || tenant.id !== tenantId) return false;
      }

      return matchesKeyword && matchesStatus && matchesPlan;
    });
  }, [tenants, showDeleted, search, statusFilter, planFilter, ctxCompanyId, companyTenantMap]);

  const load = async (includeDeletedFlag?: boolean) => {
    try {
      setLoading(true);
      const [tenantsRes, companiesRes] = await Promise.allSettled([
        hrApi.platform.tenants(includeDeletedFlag ?? showDeleted),
        hrApi.company.getAllForSuperAdmin(),
      ]);

      if (tenantsRes.status === "rejected") {
        throw tenantsRes.reason;
      }

      const payload = Array.isArray(tenantsRes.value.data?.tenants) ? tenantsRes.value.data.tenants : [];
      setTenants(payload.map((row: Record<string, unknown>) => normalizeTenant(row)));

      if (companiesRes.status === "fulfilled") {
        const companies = Array.isArray((companiesRes.value.data as { companies?: Array<{ id: string; tenantId: string }> }).companies)
          ? (companiesRes.value.data as { companies: Array<{ id: string; tenantId: string }> }).companies
          : [];
        const nextMap: Record<string, string> = {};
        companies.forEach((company) => {
          if (company?.id && company?.tenantId) {
            nextMap[company.id] = company.tenantId;
          }
        });
        setCompanyTenantMap(nextMap);
      }

      setError(null);
    } catch (err) {
      const message = getErrorMessage(err, "Failed to load tenants");
      setError(message);
      notifyError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDeleted, ctxCompanyId]);

  // Keep selection in sync with filtered rows
  useEffect(() => {
    selection.setItems(filteredTenants);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredTenants]);

  useEffect(() => {
    if (!openMenuId) return;

    const closeMenu = () => setOpenMenuId(null);
    window.addEventListener("resize", closeMenu);
    window.addEventListener("scroll", closeMenu, true);

    return () => {
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [openMenuId]);

  useEffect(() => {
    if (!openMenuId) return;

    const handleOutsidePointer = (event: PointerEvent) => {
      const menuElement = document.getElementById(`tenant-action-menu-${openMenuId}`);
      const buttonElement = document.querySelector<HTMLButtonElement>(`button[data-action-menu-id='${openMenuId}']`);
      if (
        menuElement &&
        buttonElement &&
        !menuElement.contains(event.target as Node) &&
        !buttonElement.contains(event.target as Node)
      ) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("pointerdown", handleOutsidePointer);
    return () => document.removeEventListener("pointerdown", handleOutsidePointer);
  }, [openMenuId]);

  const toggleActionMenu = (tenantId: string, button: HTMLButtonElement) => {
    if (openMenuId === tenantId) {
      setOpenMenuId(null);
      return;
    }

    const rect = button.getBoundingClientRect();
    const viewportPadding = 8;
    const menuWidth = 176;
    const estimatedMenuHeight = 260;
    const spaceBelow = window.innerHeight - rect.bottom;

    const top = spaceBelow < estimatedMenuHeight
      ? Math.max(viewportPadding, rect.top - estimatedMenuHeight - 4)
      : Math.max(viewportPadding, rect.bottom + 4);

    const left = Math.max(
      viewportPadding,
      Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - viewportPadding)
    );

    setMenuPosition({ top, left });
    setOpenMenuId(tenantId);
  };

  const updateForm = <K extends keyof TenantForm>(key: K, value: TenantForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleModule = (moduleKey: string) => {
    setForm((prev) => {
      const exists = prev.selectedModules.includes(moduleKey);
      return {
        ...prev,
        selectedModules: exists ? prev.selectedModules.filter((m) => m !== moduleKey) : [...prev.selectedModules, moduleKey],
      };
    });
  };

  const validateWizardForm = (isEditMode: boolean) => {
    const planPolicy = getPlanPolicy(form.subscriptionPlan);

    if (!form.name.trim()) return "Tenant name is required.";
    if (!form.subdomain.trim()) return "Tenant code / slug is required.";
    if (!/^[a-z0-9-]+$/.test(form.subdomain.trim())) return "Tenant code can only contain lowercase letters, numbers, and hyphens.";
    if (!form.adminName.trim()) return "Admin name is required.";
    if (!form.adminEmail.trim()) return "Admin email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.adminEmail.trim())) return "Admin email format is invalid.";
    if (!form.adminRole) return "Admin role is required.";
    if (!isEditMode && !form.sendInviteLink && !form.adminPassword.trim()) return "Admin password is required when invite flow is off.";
    if (!isEditMode && !form.sendInviteLink && form.adminPassword.trim().length < 8) return "Admin password must be at least 8 characters.";
    if (!form.subscriptionPlan.trim()) return "Subscription plan is required.";
    if (!form.status) return "Status is required.";
    if (form.selectedModules.length === 0) return "At least one module must be selected.";

    const disallowedModule = form.selectedModules.find((m) => !planPolicy.allowedModules.includes(m));
    if (disallowedModule) {
      return `${disallowedModule.toUpperCase()} is not available on ${planPolicy.name} plan.`;
    }

    const employeeLimit = toNumberOrUndefined(form.employeeLimit);
    if (employeeLimit !== undefined && employeeLimit > planPolicy.maxUsers) {
      return `User limit for ${planPolicy.name} plan cannot exceed ${planPolicy.maxUsers}.`;
    }

    const storageLimit = toNumberOrUndefined(form.storageLimitGb);
    if (storageLimit !== undefined && storageLimit > planPolicy.maxStorageGb) {
      return `Storage limit for ${planPolicy.name} plan cannot exceed ${planPolicy.maxStorageGb} GB.`;
    }

    return null;
  };

  const buildPayload = (source: TenantForm) => {
    const planPolicy = getPlanPolicy(source.subscriptionPlan);
    const allowedModules = source.selectedModules.filter((m) =>
      planPolicy.allowedModules.includes(m)
    );

    const tenantProvisionRequestId = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    return {
    tenantProvisionRequestId,
    name: source.name.trim(),
    subdomain: source.subdomain.trim(),
    status: source.status,
    subscriptionPlan: planPolicy.name,
    adminName: source.adminName.trim(),
    adminEmail: source.adminEmail.trim(),
    adminRole: source.adminRole,
    adminPassword: source.sendInviteLink ? undefined : source.adminPassword,
    sendInviteLink: source.sendInviteLink,
    selectedModules: allowedModules.length > 0 ? allowedModules : [...planPolicy.allowedModules],
    contactNumber: source.contactNumber || undefined,
    gstNumber: source.gstNumber || undefined,
    panNumber: source.panNumber || undefined,
    address: source.address || undefined,
    state: source.state || undefined,
    district: source.district || undefined,
    pincode: source.pincode || undefined,
    logoUrl: source.logoUrl || undefined,
    billingStartDate: toDateOrUndefined(source.billingStartDate),
    billingEndDate: toDateOrUndefined(source.billingEndDate),
    trialExpiryDate: toDateOrUndefined(source.trialExpiryDate),
    employeeLimit: Math.min(toNumberOrUndefined(source.employeeLimit) ?? planPolicy.maxUsers, planPolicy.maxUsers),
    storageLimitGb: Math.min(toNumberOrUndefined(source.storageLimitGb) ?? planPolicy.maxStorageGb, planPolicy.maxStorageGb),
    smsCredits: toNumberOrUndefined(source.smsCredits),
    timezone: source.timezone || "Asia/Kolkata",
    currency: source.currency || "INR",
    language: source.language || "en",
    whatsAppIntegrationEnabled: source.whatsAppIntegrationEnabled,
    smtpHost: source.smtpHost || undefined,
    smtpPort: toNumberOrUndefined(source.smtpPort),
    smtpUsername: source.smtpUsername || undefined,
    smtpFromEmail: source.smtpFromEmail || undefined,
    customDomain: source.customDomain || undefined,
    whiteLabelEnabled: source.whiteLabelEnabled,
    };
  };

  const buildUpdatePayload = (source: TenantForm, original: TenantRow) => {
    const payload = {
      name: source.name.trim(),
      status: source.status,
      isActive: source.status === "active" || source.status === "trial",
      subscriptionPlan: source.subscriptionPlan.trim(),
      selectedModules: source.selectedModules,
      adminName: source.adminName.trim() || undefined,
      adminEmail: source.adminEmail.trim() || undefined,
      contactNumber: source.contactNumber || undefined,
      gstNumber: source.gstNumber || undefined,
      panNumber: source.panNumber || undefined,
      address: source.address || undefined,
      state: source.state || undefined,
      district: source.district || undefined,
      pincode: source.pincode || undefined,
      logoUrl: source.logoUrl || undefined,
      billingStartDate: toDateOrUndefined(source.billingStartDate),
      billingEndDate: toDateOrUndefined(source.billingEndDate),
      trialExpiryDate: toDateOrUndefined(source.trialExpiryDate),
      employeeLimit: toNumberOrUndefined(source.employeeLimit),
      storageLimitGb: toNumberOrUndefined(source.storageLimitGb),
      smsCredits: toNumberOrUndefined(source.smsCredits),
      timezone: source.timezone || "Asia/Kolkata",
      currency: source.currency || "INR",
      language: source.language || "en",
      whatsAppIntegrationEnabled: source.whatsAppIntegrationEnabled,
      smtpHost: source.smtpHost || undefined,
      smtpPort: toNumberOrUndefined(source.smtpPort),
      smtpUsername: source.smtpUsername || undefined,
      smtpFromEmail: source.smtpFromEmail || undefined,
      customDomain: source.customDomain || undefined,
      whiteLabelEnabled: source.whiteLabelEnabled,
      subdomain: source.subdomain.trim(),
    };

    if (source.subdomain.trim().toLowerCase() === original.subdomain.trim().toLowerCase()) {
      return { ...payload, subdomain: undefined };
    }

    return payload;
  };

  const resetWizard = () => {
    setForm(defaultForm());
    setWizardStep(1);
    setWizardOpen(false);
    setEditingTenant(null);
    setError(null);
  };

  const handleCreate = async () => {
    if (creating || updating) return;

    const validation = validateWizardForm(false);
    if (validation) {
      notifyError(validation);
      return;
    }

    const ok = await confirm({
      title: "Create tenant",
      message: `Create tenant \"${form.name.trim()}\" (${form.subdomain.trim()}) and start provisioning?`,
      confirmText: "Create",
    });
    if (!ok) return;

    try {
      setError(null);
      setCreating(true);
      const response = await hrApi.platform.createTenant(buildPayload(form));
      resetWizard();

      const onboarding = (response.data as { onboardingCredentials?: { adminEmail?: string; temporaryPassword?: string | null; requirePasswordReset?: boolean } })?.onboardingCredentials;

      if (onboarding?.adminEmail) {
        const tempPasswordHint = onboarding.temporaryPassword
          ? ` Temporary Password: ${onboarding.temporaryPassword}`
          : " Temporary Password: Invite/managed flow.";
        const resetHint = onboarding.requirePasswordReset ? " Password reset required on first login." : "";
        notifySuccess(`Tenant provisioning started. Admin Email: ${onboarding.adminEmail}.${tempPasswordHint}${resetHint}`);
      } else {
        notifySuccess("Tenant provisioning started successfully.");
      }

      await load();
    } catch (err) {
      const message = getErrorMessage(err, "Failed to create tenant");
      setError(message);
      notifyError(message);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async () => {
    if (creating || updating) return;
    if (!editingTenant) return;
    if (!editingTenant.id?.trim()) {
      const message = "Tenant ID is missing. Please refresh the page and try again.";
      setError(message);
      notifyError(message);
      return;
    }

    const validation = validateWizardForm(true);
    if (validation) {
      notifyError(validation);
      return;
    }

    const ok = await confirm({
      title: "Update tenant",
      message: `Save updates for tenant \"${form.name.trim()}\"?`,
      confirmText: "Update",
    });
    if (!ok) return;

    try {
      setError(null);
      setUpdating(true);
      await hrApi.platform.updateTenant(editingTenant.id, buildUpdatePayload(form, editingTenant));
      resetWizard();
      notifySuccess("Tenant updated successfully.");
      await load();
    } catch (err) {
      const message = getErrorMessage(err, "Failed to update tenant");
      setError(message);
      notifyError(message);
    } finally {
      setUpdating(false);
    }
  };

  const startEdit = (tenant: TenantRow) => {
    if (!tenant.id?.trim()) {
      const message = "Tenant ID is missing for this row. Please refresh and retry.";
      setError(message);
      notifyError(message);
      return;
    }

    const editableModules = (tenant.selectedModules || []).filter((m) => !coreModules.has(m));

    setEditingTenant(tenant);
    setForm({
      ...defaultForm(),
      name: tenant.name,
      subdomain: tenant.subdomain,
      status: tenant.status || (tenant.isActive ? "active" : "inactive"),
      subscriptionPlan: tenant.subscriptionPlan || "Basic",
      adminName: tenant.adminName || "",
      adminEmail: tenant.adminEmail || "",
      adminRole: tenant.adminRole || "Admin",
      selectedModules: editableModules.length > 0 ? editableModules : ["hrms"],
      contactNumber: tenant.contactNumber || "",
      gstNumber: tenant.gstNumber || "",
      panNumber: tenant.panNumber || "",
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
      timezone: tenant.timezone || "Asia/Kolkata",
      currency: tenant.currency || "INR",
      language: tenant.language || "en",
      whatsAppIntegrationEnabled: !!tenant.whatsAppIntegrationEnabled,
      smtpHost: tenant.smtpHost || "",
      smtpPort: tenant.smtpPort ? String(tenant.smtpPort) : "",
      smtpUsername: tenant.smtpUsername || "",
      smtpFromEmail: tenant.smtpFromEmail || "",
      customDomain: tenant.customDomain || "",
      whiteLabelEnabled: !!tenant.whiteLabelEnabled,
    });

    setWizardStep(1);
    setWizardOpen(true);
    setOpenMenuId(null);
  };

  const handleManageUsers = () => {
    setOpenMenuId(null);
    router.push("/platform/users");
  };

  const handleManageModules = (tenant: TenantRow) => {
    setOpenMenuId(null);
    startEdit(tenant);
  };

  const handleBilling = (tenant: TenantRow) => {
    setOpenMenuId(null);
    startEdit(tenant);
  };

  const fetchTenantLogsAndHealth = async (tenantId: string) => {
    const [logsRes, healthRes] = await Promise.all([
      hrApi.platform.tenantProvisioningLogs(tenantId, 100),
      hrApi.platform.tenantHealth(tenantId),
    ]);

    const rawLogs = Array.isArray(logsRes.data?.logs) ? logsRes.data.logs : [];
    const normalizedLogs: TenantProvisionLogRow[] = rawLogs.map((row: Record<string, unknown>) => ({
      id: String(row.id ?? row.Id ?? ""),
      tenantId: String(row.tenantId ?? row.TenantId ?? ""),
      stepName: String(row.stepName ?? row.StepName ?? ""),
      status: String(row.status ?? row.Status ?? ""),
      errorMessage:
        row.errorMessage === null || row.ErrorMessage === null
          ? null
          : String(row.errorMessage ?? row.ErrorMessage ?? ""),
      durationMs: Number(row.durationMs ?? row.DurationMs ?? 0),
      createdAt: String(row.createdAt ?? row.CreatedAt ?? ""),
      correlationId: String(row.correlationId ?? row.CorrelationId ?? ""),
    }));

    const health = healthRes.data as Record<string, unknown>;
    const missingTablesRaw = health.missingTables ?? health.MissingTables;
    const normalizedHealth: TenantHealthRow = {
      tenantId: String(health.tenantId ?? health.TenantId ?? ""),
      tenantName: String(health.tenantName ?? health.TenantName ?? ""),
      subdomain: String(health.subdomain ?? health.Subdomain ?? ""),
      provisionStatus: String(health.provisionStatus ?? health.ProvisionStatus ?? ""),
      schemaName: String(health.schemaName ?? health.SchemaName ?? ""),
      schemaExists: Boolean(health.schemaExists ?? health.SchemaExists),
      hasAllCoreTables: Boolean(health.hasAllCoreTables ?? health.HasAllCoreTables),
      missingTables: Array.isArray(missingTablesRaw)
        ? missingTablesRaw.map((x: unknown) => String(x))
        : [],
      usersCount: Number(health.usersCount ?? health.UsersCount ?? 0),
      hasAdminUser: Boolean(health.hasAdminUser ?? health.HasAdminUser),
      hasAdminRole: Boolean(health.hasAdminRole ?? health.HasAdminRole),
      hasAdminRoleMapping: Boolean(health.hasAdminRoleMapping ?? health.HasAdminRoleMapping),
      adminEmail: String(health.adminEmail ?? health.AdminEmail ?? ""),
      adminLastLoginAt: String(health.adminLastLoginAt ?? health.AdminLastLoginAt ?? ""),
      passwordResetPending: Boolean(health.passwordResetPending ?? health.PasswordResetPending),
      updatedAt: String(health.updatedAt ?? health.UpdatedAt ?? ""),
    };

    setProvisionLogs(normalizedLogs);
    setTenantHealth(normalizedHealth);
  };

  const handleProvisionLogs = async (tenant: TenantRow) => {
    if (!tenant.id?.trim()) {
      const message = "Tenant ID is missing. Unable to load provisioning logs.";
      setError(message);
      notifyError(message);
      return;
    }

    try {
      setOpenMenuId(null);
      setLogsTenant(tenant);
      setProvisionLogs([]);
      setTenantHealth(null);
      setLogsLoading(true);

      await fetchTenantLogsAndHealth(tenant.id);
    } catch (err) {
      const message = getErrorMessage(err, "Failed to load provisioning logs");
      setError(message);
      notifyError(message);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleRepairNow = async () => {
    if (!logsTenant?.id?.trim()) {
      const message = "Tenant ID is missing. Unable to trigger repair.";
      setError(message);
      notifyError(message);
      return;
    }

    try {
      setRepairingTenantId(logsTenant.id);
      await hrApi.platform.repairTenant(logsTenant.id);
      notifySuccess("Tenant repair completed. Refreshing logs and health...");
      await fetchTenantLogsAndHealth(logsTenant.id);
      await load();
    } catch (err) {
      const message = getErrorMessage(err, "Tenant repair failed");
      setError(message);
      notifyError(message);
    } finally {
      setRepairingTenantId(null);
    }
  };

  const handleDelete = async (tenant: TenantRow) => {
    if (deletingId) return;
    if (!tenant.id?.trim()) {
      const message = "Tenant ID is missing. Unable to delete this tenant.";
      setError(message);
      notifyError(message);
      return;
    }

    const ok = await confirm({
      title: "Delete tenant",
      message: `Delete tenant "${tenant.name}"? You can restore it later from deleted list.`,
      confirmText: "Delete",
      variant: "danger",
    });
    if (!ok) return;

    try {
      setError(null);
      setDeletingId(tenant.id);
      await hrApi.platform.deleteTenant(tenant.id);
      if (editingTenant?.id === tenant.id) resetWizard();
      notifySuccess("Tenant deleted successfully.");
      await load();
    } catch (err) {
      const message = getErrorMessage(err, "Failed to delete tenant");
      setError(message);
      notifyError(message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRestore = async (tenant: TenantRow) => {
    if (!tenant.id?.trim()) return;
    try {
      setError(null);
      await hrApi.platform.recycleBin.restore("Tenants", tenant.id);
      notifySuccess("Tenant restored successfully.");
      await load();
    } catch (err) {
      const message = getErrorMessage(err, "Failed to restore tenant");
      setError(message);
      notifyError(message);
    }
  };

  const handleHardDelete = async (tenant: TenantRow) => {
    if (!tenant.id?.trim()) return;
    const ok = await confirm({
      title: "Permanent delete tenant",
      message: `Permanently delete tenant "${tenant.name}" from database? This cannot be undone.`,
      confirmText: "Permanent Delete",
      variant: "danger",
    });
    if (!ok) return;

    try {
      setError(null);
      await hrApi.platform.recycleBin.hardDelete("Tenants", tenant.id);
      notifySuccess("Tenant permanently deleted.");
      await load();
    } catch (err) {
      const message = getErrorMessage(err, "Failed to permanently delete tenant");
      setError(message);
      notifyError(message);
    }
  };

  const renderWizardStepBody = () => {
    if (wizardStep === 1) {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Tenant name *</label>
            <input value={form.name} onChange={(e) => updateForm("name", e.target.value)} placeholder="UABINDIA" className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Tenant code / slug *</label>
            <input value={form.subdomain} onChange={(e) => updateForm("subdomain", e.target.value.toLowerCase())} placeholder="uab-india" className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
            <p className="mt-1 text-xs text-slate-500">Preview: <span className="font-semibold text-slate-700">{subdomainPreview}</span></p>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Status *</label>
            <select value={form.status} onChange={(e) => updateForm("status", e.target.value as TenantStatus)} className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm">
              <option value="active">active</option>
              <option value="inactive">inactive</option>
              <option value="suspended">suspended</option>
              <option value="trial">trial</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Contact number</label>
            <input value={form.contactNumber} onChange={(e) => updateForm("contactNumber", e.target.value)} placeholder="+91 98xxxx" className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">GST number</label>
            <input value={form.gstNumber} onChange={(e) => updateForm("gstNumber", e.target.value)} placeholder="27ABCDE1234F1Z5" className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">PAN number</label>
            <input value={form.panNumber} onChange={(e) => updateForm("panNumber", e.target.value)} placeholder="ABCDE1234F" className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Address</label>
            <input value={form.address} onChange={(e) => updateForm("address", e.target.value)} placeholder="Company address" className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          </div>
        </div>
      );
    }

    if (wizardStep === 2) {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Admin name *</label>
            <input value={form.adminName} onChange={(e) => updateForm("adminName", e.target.value)} placeholder="Super Admin" className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Admin email *</label>
            <input value={form.adminEmail} onChange={(e) => updateForm("adminEmail", e.target.value)} placeholder="admin@company.com" className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Admin role *</label>
            <select value={form.adminRole} onChange={(e) => updateForm("adminRole", e.target.value as "Admin" | "SuperAdmin")} className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm">
              <option value="Admin">Admin</option>
              <option value="SuperAdmin">SuperAdmin</option>
            </select>
          </div>
          <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={form.sendInviteLink} onChange={(e) => updateForm("sendInviteLink", e.target.checked)} />
              Send invite link (no password now)
            </label>
            <p className="mt-2 text-xs text-slate-600">Only one default user is created at onboarding: this Tenant Admin account. Additional users can be added later from User Management.</p>
          </div>
          {!form.sendInviteLink && !editingTenant && (
            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Admin password *</label>
              <input type="password" value={form.adminPassword} onChange={(e) => updateForm("adminPassword", e.target.value)} placeholder="Temporary password" className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
            </div>
          )}
        </div>
      );
    }

    if (wizardStep === 3) {
      const planPolicy = getPlanPolicy(form.subscriptionPlan);
      return (
        <div>
          <p className="text-sm text-slate-600">Select modules allowed in the chosen plan ({planPolicy.name}).</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {moduleOptions.map((module) => {
              const checked = form.selectedModules.includes(module.key);
              const availableInPlan = planPolicy.allowedModules.includes(module.key);
              return (
                <button
                  key={module.key}
                  onClick={() => availableInPlan && toggleModule(module.key)}
                  disabled={!availableInPlan}
                  type="button"
                  className={`rounded-xl border p-4 text-left transition ${
                    !availableInPlan
                      ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                      : checked
                        ? "border-emerald-400 bg-emerald-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">{module.label}</p>
                    <span className={`text-xs font-semibold ${!availableInPlan ? "text-slate-400" : checked ? "text-emerald-700" : "text-slate-500"}`}>
                      {!availableInPlan ? "Plan upgrade required" : checked ? "Selected" : "Select"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{module.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (wizardStep === 4) {
      const planPolicy = getPlanPolicy(form.subscriptionPlan);
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Subscription plan *</label>
            <select
              value={form.subscriptionPlan}
              onChange={(e) => {
                const nextPolicy = getPlanPolicy(e.target.value);
                setForm((prev) => {
                  const allowed = prev.selectedModules.filter((m) =>
                    nextPolicy.allowedModules.includes(m)
                  );

                  return {
                    ...prev,
                    subscriptionPlan: nextPolicy.name,
                    selectedModules: allowed.length > 0 ? allowed : [...nextPolicy.allowedModules],
                    employeeLimit: String(nextPolicy.maxUsers),
                    storageLimitGb: String(nextPolicy.maxStorageGb),
                  };
                });
              }}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            >
              <option>Basic</option>
              <option>Premium</option>
              <option>Enterprise</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">Plan-controlled max users: {planPolicy.maxUsers}, max storage: {planPolicy.maxStorageGb} GB</p>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Trial expiry</label>
            <input type="date" value={form.trialExpiryDate} onChange={(e) => updateForm("trialExpiryDate", e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Billing start</label>
            <input type="date" value={form.billingStartDate} onChange={(e) => updateForm("billingStartDate", e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Billing end</label>
            <input type="date" value={form.billingEndDate} onChange={(e) => updateForm("billingEndDate", e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Employee limit</label>
            <input value={form.employeeLimit} onChange={(e) => updateForm("employeeLimit", e.target.value)} placeholder="500" className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
            <p className="mt-1 text-xs text-slate-500">Includes the Tenant Admin user.</p>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Storage limit (GB)</label>
            <input value={form.storageLimitGb} onChange={(e) => updateForm("storageLimitGb", e.target.value)} placeholder="100" className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h4 className="font-semibold text-slate-900">Review Summary</h4>
          <div className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
            <p><span className="font-semibold">Company:</span> {form.name || "—"}</p>
            <p><span className="font-semibold">Code:</span> {form.subdomain || "—"}</p>
            <p><span className="font-semibold">Status:</span> {form.status}</p>
            <p><span className="font-semibold">Plan:</span> {form.subscriptionPlan}</p>
            <p><span className="font-semibold">Admin:</span> {form.adminName || "—"}</p>
            <p><span className="font-semibold">Admin Email:</span> {form.adminEmail || "—"}</p>
            <p><span className="font-semibold">Admin Role:</span> {form.adminRole}</p>
            <p><span className="font-semibold">Initial Users:</span> 1 (Tenant Admin)</p>
            <p className="md:col-span-2"><span className="font-semibold">Modules:</span> {form.selectedModules.length ? form.selectedModules.join(", ") : "No modules selected"}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {confirmDialog}
      <StandardPageLayout
        title="Tenant Management"
        subtitle="Enterprise onboarding with module control, plan governance, and admin provisioning."
        eyebrow="Platform / Core"
        actions={
          <div className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row lg:flex-wrap lg:items-center lg:justify-end">
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => setShowDeleted((prev) => !prev)}
                className={`erp-action-btn w-full lg:w-auto ${showDeleted ? "erp-action-btn-warning" : "erp-action-btn-secondary"}`}
              >
                {showDeleted ? "Hide Deleted" : "Show Deleted"}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (isBusy) return;
                setEditingTenant(null);
                setForm(defaultForm());
                setWizardStep(1);
                setWizardOpen(true);
                setError(null);
              }}
              disabled={isBusy}
              className="erp-action-btn erp-action-btn-primary w-full lg:w-auto"
            >
              + Create Tenant
            </button>
          </div>
        }
      >
      {/* KPI summary cards – counts reflect current filter (company/status/plan) */}
      <div className="erp-kpi-grid mb-4">
        <div className="erp-kpi-card"><p className="erp-kpi-label">Total Tenants</p><p className="erp-kpi-value">{filteredTenants.length}</p><p className="erp-kpi-meta">All provisioned tenants</p></div>
        <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Active</p><p className="erp-kpi-value erp-kpi-value-success">{filteredTenants.filter(t => t.isActive && !t.isDeleted).length}</p><p className="erp-kpi-meta">Live tenant accounts</p></div>
        <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Provisioned</p><p className="erp-kpi-value">{filteredTenants.filter(t => (t.provisionStatus || '').toLowerCase() === 'provisioned').length}</p><p className="erp-kpi-meta">Fully onboarded</p></div>
        <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Pending</p><p className="erp-kpi-value">{filteredTenants.filter(t => (t.provisionStatus || '').toLowerCase() === 'pending').length}</p><p className="erp-kpi-meta">Awaiting provisioning</p></div>
      </div>

      {error && !wizardOpen && <div className="erp-alert-error">{error}</div>}

      {/* Bulk action bar — visible when rows are selected */}
      {selection.selectionCount > 0 && (
        <BulkActionBar
          selectionCount={selection.selectionCount}
          onEdit={() => setBulkEditOpen(true)}
          onRefresh={() => { selection.clearSelection(); void load(); }}
          onDelete={() => void handleBulkDelete()}
          onClear={selection.clearSelection}
          loading={bulkApplying}
        />
      )}

      {bulkEditOpen && (
        <BulkEditDialog
          fields={tenantBulkFields}
          selectionCount={selection.selectionCount}
          onApply={handleBulkEdit}
          onClose={() => setBulkEditOpen(false)}
          loading={bulkApplying}
        />
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 grid gap-3 md:grid-cols-[1.3fr_0.8fr_0.8fr]">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tenant, code, admin, module..." className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm">
            <option value="all">All status</option><option value="active">Active</option><option value="trial">Trial</option><option value="inactive">Inactive</option><option value="suspended">Suspended</option>
          </select>
          <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm">
            <option value="all">All plans</option>
            {planOptions.map((plan) => <option key={plan} value={plan}>{plan}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto overflow-y-visible">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2 text-left">
                  <SelectAllCheckbox
                    checked={selection.isAllSelected}
                    indeterminate={selection.isIndeterminate}
                    onChange={selection.isAllSelected ? selection.clearSelection : selection.selectAll}
                  />
                </th>
                <th className="px-4 py-2 text-left">Tenant</th><th className="px-4 py-2 text-left">Status</th><th className="px-4 py-2 text-left">Provision</th><th className="px-4 py-2 text-left">Plan</th><th className="px-4 py-2 text-left">Admin</th><th className="px-4 py-2 text-left">Modules</th><th className="px-4 py-2 text-left">Created</th><th className="px-4 py-2 text-left">Users</th><th className="px-4 py-2 text-left">Last Repair</th><th className="px-4 py-2 text-left">Last activity</th><th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.map((tenant) => {
                const status = tenant.status || (tenant.isActive ? "active" : "inactive");
                const businessModules = (tenant.selectedModules || []).filter((m) => !coreModules.has(m));
                const adminInfo = tenant.adminName || tenant.adminEmail ? `${tenant.adminName || ""}${tenant.adminEmail ? ` (${tenant.adminEmail})` : ""}` : "No admin assigned";

                return (
                  <tr key={tenant.id} className={`border-t border-slate-100 align-top${tenant.isDeleted ? " bg-red-50 opacity-60" : ""}`}>
                    <td className="px-4 py-3">
                      <SelectionCheckbox
                        checked={selection.isSelected(tenant.id)}
                        onChange={() => selection.toggleSelection(tenant.id)}
                        label={`Select ${tenant.name}`}
                      />
                    </td>
                    <td className="px-4 py-3"><p className="font-semibold text-slate-900">{tenant.name}</p><p className="text-xs text-slate-500">{tenant.subdomain}.yourdomain.com</p></td>
                    <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${tenant.isDeleted ? "bg-red-100 text-red-700" : statusBadgeClass[status]}`}>{tenant.isDeleted ? "deleted" : status}</span></td>
                    <td className="px-4 py-3 text-slate-700">
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{tenant.provisionStatus || "Pending"}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{tenant.subscriptionPlan || "Basic"}</td>
                    <td className="px-4 py-3 text-slate-700">
                      <div>{adminInfo}</div>
                      <div className="mt-1 text-xs text-slate-500">Admin Created: {tenant.adminCreated ? "Yes" : "No"}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{businessModules.length ? businessModules.join(", ") : "No modules selected"}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(tenant.createdAt)}</td>
                    <td className="px-4 py-3 text-slate-600">{tenant.usersCount ?? 0}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(tenant.lastRepairAt)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(tenant.lastActivityAt)}</td>
                    <td className="px-4 py-3">
                      {isSuperAdmin ? (
                        <div className={`relative ${openMenuId === tenant.id ? "z-50" : "z-10"}`}>
                          <button
                            type="button"
                            data-action-menu-id={tenant.id}
                            onClick={(event) => toggleActionMenu(tenant.id, event.currentTarget)}
                            onPointerDown={(event) => event.stopPropagation()}
                            className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Actions ▾
                          </button>
                          {openMenuId === tenant.id && (
                            <div
                              id={`tenant-action-menu-${tenant.id}`}
                              className="fixed w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                              style={{ top: menuPosition.top, left: menuPosition.left, zIndex: 9999 }}
                              onPointerDown={(event) => event.stopPropagation()}
                            >
                              {!tenant.isDeleted ? (
                                <>
                                  <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => startEdit(tenant)} className="block w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50">Edit</button>
                                  <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={handleManageUsers} className="block w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50">Manage Users</button>
                                  <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => handleManageModules(tenant)} className="block w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50">Manage Modules</button>
                                  <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => handleBilling(tenant)} className="block w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50">Billing</button>
                                  <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => void handleProvisionLogs(tenant)} className="block w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50">Provision Logs</button>
                                  <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => { setOpenMenuId(null); void handleDelete(tenant); }} disabled={deletingId === tenant.id} className="block w-full px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60">{deletingId === tenant.id ? "Deleting..." : "Delete"}</button>
                                </>
                              ) : (
                                <>
                                  <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => { setOpenMenuId(null); void handleRestore(tenant); }} className="block w-full px-3 py-2 text-left text-xs font-medium text-green-700 hover:bg-green-50">Restore</button>
                                  <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => { setOpenMenuId(null); void handleHardDelete(tenant); }} className="block w-full px-3 py-2 text-left text-xs font-medium text-red-700 hover:bg-red-50">Permanent Delete</button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">No actions available</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {!loading && filteredTenants.length === 0 && (
                <tr><td colSpan={12} className="px-4 py-10 text-center text-sm text-slate-500">{showDeleted ? "No deleted tenants found for selected filters." : "No tenants found for selected filters."}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      </StandardPageLayout>

      {wizardOpen && (
        <div className="erp-modal-backdrop">
          <div className="erp-modal-card erp-modal-xl mx-auto flex" style={{height: "min(92vh, 900px)", maxHeight: "92vh"}}>
            <div className="erp-modal-accent" />
            <div className="erp-modal-header">
              <div className="flex min-w-0 items-center gap-3">
                <span className="erp-modal-icon">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 00-1-1h-2a1 1 0 00-1 1v5m4 0H9" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <div className="erp-modal-title">{editingTenant ? "Edit Tenant Wizard" : "Create Tenant Wizard"}</div>
                  <div className="erp-modal-subtitle">Step-by-step onboarding with mandatory and optional business data.</div>
                </div>
              </div>
              <button type="button" onClick={resetWizard} className="erp-modal-close" title="Close (Esc)">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className="border-b border-slate-200 px-6 py-3">
              <div className="grid grid-cols-5 gap-2">
                {wizardSteps.map((step) => (
                  <button type="button" key={step.id} onClick={() => setWizardStep(step.id)} className={`rounded-lg px-3 py-2 text-left transition ${wizardStep === step.id ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                    <p className="text-xs font-semibold">{step.icon} {step.id}. {step.title}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-auto px-6 py-5">{renderWizardStepBody()}</div>

            <div className="erp-modal-footer justify-between">
              <button type="button" onClick={() => setWizardStep((prev) => Math.max(1, prev - 1))} disabled={wizardStep === 1 || isBusy} className="erp-action-btn erp-action-btn-secondary disabled:opacity-40">Previous</button>
              <div className="flex items-center gap-2">
                <button type="button" onClick={resetWizard} className="erp-action-btn erp-action-btn-ghost">Cancel</button>
                {wizardStep < 5 ? (
                  <button type="button" onClick={() => setWizardStep((prev) => Math.min(5, prev + 1))} disabled={isBusy} className="erp-action-btn erp-action-btn-primary disabled:opacity-60">Next →</button>
                ) : (
                  <button type="button" onClick={editingTenant ? handleUpdate : handleCreate} disabled={editingTenant ? updating : creating} className="erp-action-btn erp-action-btn-success disabled:opacity-60">
                    {editingTenant ? (updating ? "Updating..." : "Update Tenant") : (creating ? "Creating..." : "✓ Create Tenant")}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {logsTenant && (
        <div className="erp-modal-backdrop">
          <div className="erp-modal-card erp-modal-xl mx-auto flex" style={{height: "min(88vh, 860px)", maxHeight: "88vh"}}>
            <div className="erp-modal-accent erp-modal-accent-warning" />
            <div className="erp-modal-header">
              <div className="flex min-w-0 items-center gap-3">
                <span className="erp-modal-icon erp-modal-icon-warning">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <div className="erp-modal-title">Provisioning Logs</div>
                  <div className="erp-modal-subtitle">{logsTenant.name} ({logsTenant.subdomain})</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleRepairNow()}
                  disabled={repairingTenantId === logsTenant.id || logsLoading}
                  className="erp-action-btn erp-action-btn-warning disabled:opacity-60 text-xs"
                >
                  {repairingTenantId === logsTenant.id ? "Repairing..." : "Repair Now"}
                </button>
                <button
                  type="button"
                  onClick={() => { setLogsTenant(null); setProvisionLogs([]); setTenantHealth(null); }}
                  className="erp-modal-close"
                  title="Close"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="erp-modal-body">
              {tenantHealth && (
                <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid gap-2 text-xs text-slate-700 md:grid-cols-3">
                    <p><span className="font-semibold">Provision Status:</span> {tenantHealth.provisionStatus || "—"}</p>
                    <p><span className="font-semibold">Schema:</span> {tenantHealth.schemaName || "—"}</p>
                    <p><span className="font-semibold">Schema Exists:</span> {tenantHealth.schemaExists ? "Yes" : "No"}</p>
                    <p><span className="font-semibold">Core Tables Ready:</span> {tenantHealth.hasAllCoreTables ? "Yes" : "No"}</p>
                    <p><span className="font-semibold">Admin User:</span> {tenantHealth.hasAdminUser ? "Yes" : "No"}</p>
                    <p><span className="font-semibold">Admin Role:</span> {tenantHealth.hasAdminRole ? "Yes" : "No"}</p>
                    <p><span className="font-semibold">Role Mapping:</span> {tenantHealth.hasAdminRoleMapping ? "Yes" : "No"}</p>
                    <p><span className="font-semibold">Admin Email:</span> {tenantHealth.adminEmail || "—"}</p>
                    <p><span className="font-semibold">Password Reset Pending:</span> {tenantHealth.passwordResetPending ? "Yes" : "No"}</p>
                    <p><span className="font-semibold">Admin Last Login:</span> {formatDate(tenantHealth.adminLastLoginAt)}</p>
                    <p><span className="font-semibold">Users:</span> {tenantHealth.usersCount}</p>
                    <p className="md:col-span-2"><span className="font-semibold">Missing Tables:</span> {tenantHealth.missingTables.length ? tenantHealth.missingTables.join(", ") : "None"}</p>
                  </div>
                </div>
              )}

              {logsLoading ? (
                <div className="text-sm text-slate-600">Loading provisioning logs...</div>
              ) : provisionLogs.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                  No provisioning logs found for this tenant.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-4 py-2 text-left">Time</th>
                        <th className="px-4 py-2 text-left">Step</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-left">Duration (ms)</th>
                        <th className="px-4 py-2 text-left">Correlation</th>
                        <th className="px-4 py-2 text-left">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {provisionLogs.map((log) => (
                        <tr key={log.id} className="border-t border-slate-100 align-top">
                          <td className="px-4 py-2 text-slate-700">{formatDate(log.createdAt)}</td>
                          <td className="px-4 py-2 text-slate-900 font-medium">{log.stepName || "—"}</td>
                          <td className="px-4 py-2">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                log.status.toLowerCase() === "success" || log.status.toLowerCase() === "completed"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : log.status.toLowerCase() === "failed"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {log.status || "Unknown"}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-slate-700">{Number.isFinite(log.durationMs) ? log.durationMs : 0}</td>
                          <td className="px-4 py-2 text-xs text-slate-500">{log.correlationId || "—"}</td>
                          <td className="px-4 py-2 text-xs text-red-700">{log.errorMessage || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
