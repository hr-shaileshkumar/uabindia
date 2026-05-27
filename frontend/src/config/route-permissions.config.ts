import { PERMISSIONS } from "@/constants/permissions";
import { ROUTES } from "@/constants/routes";

export type ModuleKey =
  | "operations"
  | "erp_finance"
  | "erp_procurement"
  | "erp_sales"
  | "erp_inventory"
  | "hrms"
  | "payroll"
  | "reports"
  | "platform"
  | "licensing"
  | "security"
  | "integrations"
  | "helpdesk"
  | "communication";

export type RoutePermissionRule = {
  path: string;
  moduleKey: ModuleKey;
  permissions: string[];
};

// NOTE:
// ROUTE_PERMISSION_MATRIX is now a compatibility fallback.
// Primary route-rule source is backend metadata from /ui-shell/route-rules,
// consumed in protected layout. Keep this map for resilience until parity is
// fully validated in all environments.

const normalizePath = (path: string) => {
  const stripped = path.split("?")[0].split("#")[0];
  if (!stripped || stripped === "/") return "/";
  return stripped.replace(/\/+$/, "") || "/";
};

const LEGACY_ALIAS_PREFIX: Record<string, string> = {
  "/dashboard": ROUTES.DASHBOARD,
  "/hrms": ROUTES.HRMS_HOME,
  "/payroll": ROUTES.PAYROLL_HOME,
  "/reports": ROUTES.REPORTS_HOME,
  "/notifications": ROUTES.NOTIFICATIONS,
  "/documents": ROUTES.DOCUMENTS,
  "/customers": ROUTES.CUSTOMERS,
  "/vendors": ROUTES.VENDORS,
  "/items": ROUTES.ITEMS,
  "/sales-orders": ROUTES.SALES_ORDERS,
  "/purchase-orders": ROUTES.PURCHASE_ORDERS,
  "/chart-of-accounts": ROUTES.CHART_OF_ACCOUNTS,
  "/journal-entries": ROUTES.JOURNAL_ENTRIES,
  "/payments": ROUTES.PAYMENTS,
  "/warehouses": ROUTES.WAREHOUSES,
  "/stock-movements": ROUTES.STOCK_MOVEMENTS,
  "/approvals": ROUTES.APPROVALS,
  "/licensing": ROUTES.LICENSING_HOME,
  "/security": ROUTES.SECURITY_HOME,
};

export const canonicalizeProtectedPath = (path: string) => {
  const normalized = normalizePath(path);
  if (normalized === "/" || normalized === "/context") return normalized;
  if (normalized.startsWith("/erp/") || normalized.startsWith("/platform")) return normalized;

  for (const [legacyPrefix, canonicalPrefix] of Object.entries(LEGACY_ALIAS_PREFIX)) {
    if (normalized === legacyPrefix || normalized.startsWith(`${legacyPrefix}/`)) {
      const suffix = normalized.slice(legacyPrefix.length);
      return normalizePath(`${canonicalPrefix}${suffix}`);
    }
  }

  return normalized;
};

export const ROUTE_PERMISSION_MATRIX: RoutePermissionRule[] = [
  // ── Operations — Shared (dashboard, approvals, notifications, documents) ───
  { path: ROUTES.DASHBOARD, moduleKey: "operations", permissions: [PERMISSIONS.DASHBOARD_VIEW] },
  { path: ROUTES.NOTIFICATIONS, moduleKey: "operations", permissions: [PERMISSIONS.NOTIFICATIONS_VIEW] },
  { path: ROUTES.DOCUMENTS, moduleKey: "operations", permissions: [PERMISSIONS.DOCUMENTS_VIEW] },
  { path: ROUTES.APPROVALS, moduleKey: "operations", permissions: [PERMISSIONS.APPROVALS_VIEW] },

  // ── ERP Finance ────────────────────────────────────────────────────────────
  { path: ROUTES.CHART_OF_ACCOUNTS, moduleKey: "erp_finance", permissions: [PERMISSIONS.CHART_OF_ACCOUNTS_VIEW] },
  { path: ROUTES.JOURNAL_ENTRIES,   moduleKey: "erp_finance", permissions: [PERMISSIONS.JOURNAL_ENTRIES_VIEW] },
  { path: ROUTES.PAYMENTS,          moduleKey: "erp_finance", permissions: [PERMISSIONS.PAYMENTS_VIEW] },
  { path: ROUTES.INVOICES,          moduleKey: "erp_finance", permissions: [PERMISSIONS.PAYMENTS_VIEW] },
  { path: ROUTES.EXPENSES,          moduleKey: "erp_finance", permissions: [PERMISSIONS.PAYMENTS_VIEW] },
  { path: ROUTES.TAX_MANAGEMENT,    moduleKey: "erp_finance", permissions: [PERMISSIONS.CHART_OF_ACCOUNTS_VIEW] },
  { path: ROUTES.BANK_RECONCILIATION, moduleKey: "erp_finance", permissions: [PERMISSIONS.PAYMENTS_VIEW] },

  // ── ERP Procurement ────────────────────────────────────────────────────────
  { path: ROUTES.VENDORS,           moduleKey: "erp_procurement", permissions: [PERMISSIONS.VENDOR_VIEW] },
  { path: ROUTES.PURCHASE_REQUESTS, moduleKey: "erp_procurement", permissions: [PERMISSIONS.PURCHASE_ORDERS_VIEW] },
  { path: ROUTES.PURCHASE_ORDERS,   moduleKey: "erp_procurement", permissions: [PERMISSIONS.PURCHASE_ORDERS_VIEW] },
  { path: ROUTES.GRN,               moduleKey: "erp_procurement", permissions: [PERMISSIONS.PURCHASE_ORDERS_VIEW] },

  // ── ERP Sales & CRM ────────────────────────────────────────────────────────
  { path: ROUTES.CUSTOMERS,         moduleKey: "erp_sales", permissions: [PERMISSIONS.CUSTOMER_VIEW] },
  { path: ROUTES.QUOTATIONS,        moduleKey: "erp_sales", permissions: [PERMISSIONS.SALES_ORDERS_VIEW] },
  { path: ROUTES.SALES_ORDERS,      moduleKey: "erp_sales", permissions: [PERMISSIONS.SALES_ORDERS_VIEW] },
  { path: ROUTES.RETURNS,           moduleKey: "erp_sales", permissions: [PERMISSIONS.SALES_ORDERS_VIEW] },

  // ── ERP Inventory ──────────────────────────────────────────────────────────
  { path: ROUTES.ITEMS,                  moduleKey: "erp_inventory", permissions: [PERMISSIONS.ITEM_VIEW] },
  { path: ROUTES.WAREHOUSES,             moduleKey: "erp_inventory", permissions: [PERMISSIONS.WAREHOUSES_VIEW] },
  { path: ROUTES.STOCK_MOVEMENTS,        moduleKey: "erp_inventory", permissions: [PERMISSIONS.STOCK_MOVEMENTS_VIEW] },
  { path: ROUTES.INVENTORY_ADJUSTMENTS,  moduleKey: "erp_inventory", permissions: [PERMISSIONS.STOCK_MOVEMENTS_VIEW] },
  { path: ROUTES.INVENTORY_TRANSFERS,    moduleKey: "erp_inventory", permissions: [PERMISSIONS.STOCK_MOVEMENTS_VIEW] },

  // ── HRMS ──────────────────────────────────────────────────────────────────
  { path: ROUTES.HRMS_HOME, moduleKey: "hrms", permissions: [PERMISSIONS.HRMS_VIEW] },
  // Core HR
  { path: ROUTES.EMPLOYEES, moduleKey: "hrms", permissions: [PERMISSIONS.EMPLOYEE_VIEW] },
  { path: ROUTES.CERTIFICATES, moduleKey: "hrms", permissions: [PERMISSIONS.CERTIFICATES_VIEW] },
  { path: ROUTES.HR_ASSETS, moduleKey: "hrms", permissions: [PERMISSIONS.HR_ASSETS_VIEW] },
  { path: ROUTES.ONBOARDING, moduleKey: "hrms", permissions: [PERMISSIONS.EMPLOYEE_VIEW] },
  { path: ROUTES.OFFBOARDING, moduleKey: "hrms", permissions: [PERMISSIONS.EMPLOYEE_VIEW] },
  { path: ROUTES.PROBATION, moduleKey: "hrms", permissions: [PERMISSIONS.EMPLOYEE_VIEW] },
  // Attendance & Time
  { path: ROUTES.ATTENDANCE, moduleKey: "hrms", permissions: [PERMISSIONS.ATTENDANCE_VIEW] },
  { path: ROUTES.SHIFTS, moduleKey: "hrms", permissions: [PERMISSIONS.SHIFTS_VIEW] },
  { path: ROUTES.OVERTIME, moduleKey: "hrms", permissions: [PERMISSIONS.OVERTIME_VIEW] },
  { path: ROUTES.LEAVE, moduleKey: "hrms", permissions: [PERMISSIONS.LEAVE_VIEW] },
  // Talent Acquisition
  { path: ROUTES.RECRUITMENT, moduleKey: "hrms", permissions: [PERMISSIONS.RECRUITMENT_VIEW] },
  { path: ROUTES.SCREENING_SCHEDULE, moduleKey: "hrms", permissions: [PERMISSIONS.SCREENING_SCHEDULE_VIEW] },
  { path: ROUTES.SCREENING_RESULTS, moduleKey: "hrms", permissions: [PERMISSIONS.SCREENING_RESULTS_VIEW] },
  // Learning & Development
  { path: ROUTES.TRAINING, moduleKey: "hrms", permissions: [PERMISSIONS.TRAINING_VIEW] },
  { path: ROUTES.ASSESSMENTS, moduleKey: "hrms", permissions: [PERMISSIONS.ASSESSMENTS_VIEW] },
  // Performance
  { path: ROUTES.PERFORMANCE, moduleKey: "hrms", permissions: [PERMISSIONS.PERFORMANCE_VIEW] },
  // HR Operations
  { path: ROUTES.HR_PAYROLL, moduleKey: "hrms", permissions: [PERMISSIONS.HR_PAYROLL_VIEW] },

  // ── Payroll ───────────────────────────────────────────────────────────────
  { path: ROUTES.PAYROLL_HOME, moduleKey: "payroll", permissions: [PERMISSIONS.PAYROLL_VIEW] },
  // Processing
  { path: ROUTES.PAYROLL_RUNS, moduleKey: "payroll", permissions: [PERMISSIONS.PAYROLL_RUNS_VIEW] },
  { path: ROUTES.PAYROLL_PAYSLIPS, moduleKey: "payroll", permissions: [PERMISSIONS.PAYROLL_PAYSLIPS_VIEW] },
  { path: ROUTES.PAYROLL_BONUS, moduleKey: "payroll", permissions: [PERMISSIONS.PAYROLL_RUNS_VIEW] },
  { path: ROUTES.PAYROLL_ARREARS, moduleKey: "payroll", permissions: [PERMISSIONS.PAYROLL_RUNS_VIEW] },
  // Setup
  { path: ROUTES.PAYROLL_STRUCTURES, moduleKey: "payroll", permissions: [PERMISSIONS.PAYROLL_STRUCTURES_VIEW] },
  { path: ROUTES.PAYROLL_COMPONENTS, moduleKey: "payroll", permissions: [PERMISSIONS.PAYROLL_COMPONENTS_VIEW] },
  { path: ROUTES.PAYROLL_LOANS, moduleKey: "payroll", permissions: [PERMISSIONS.PAYROLL_VIEW] },
  { path: ROUTES.PAYROLL_REIMBURSEMENTS, moduleKey: "payroll", permissions: [PERMISSIONS.PAYROLL_VIEW] },
  // Compliance
  { path: ROUTES.PAYROLL_STATUTORY, moduleKey: "payroll", permissions: [PERMISSIONS.PAYROLL_STATUTORY_VIEW] },
  { path: ROUTES.PAYROLL_FINAL_SETTLEMENT, moduleKey: "payroll", permissions: [PERMISSIONS.PAYROLL_VIEW] },
  { path: ROUTES.PAYROLL_TAX_DECLARATIONS, moduleKey: "payroll", permissions: [PERMISSIONS.PAYROLL_VIEW] },

  // ── Reports ───────────────────────────────────────────────────────────────
  { path: ROUTES.REPORTS_HOME, moduleKey: "reports", permissions: [PERMISSIONS.REPORTS_VIEW] },
  { path: ROUTES.REPORTS_HR, moduleKey: "reports", permissions: [PERMISSIONS.REPORTS_HR_VIEW] },
  { path: ROUTES.REPORTS_PAYROLL, moduleKey: "reports", permissions: [PERMISSIONS.REPORTS_PAYROLL_VIEW] },
  { path: ROUTES.REPORTS_COMPLIANCE, moduleKey: "reports", permissions: [PERMISSIONS.REPORTS_COMPLIANCE_VIEW] },
  { path: ROUTES.REPORTS_ERP, moduleKey: "reports", permissions: [PERMISSIONS.REPORTS_VIEW] },
  { path: ROUTES.REPORTS_FINANCIAL, moduleKey: "reports", permissions: [PERMISSIONS.REPORTS_VIEW] },
  { path: ROUTES.REPORTS_CUSTOM, moduleKey: "reports", permissions: [PERMISSIONS.REPORTS_VIEW] },

  // ── Admin Console ─────────────────────────────────────────────────────────
  { path: ROUTES.PLATFORM_HOME, moduleKey: "platform", permissions: [PERMISSIONS.PLATFORM_VIEW] },
  // Tenant Management
  { path: ROUTES.PLATFORM_COMPANIES, moduleKey: "platform", permissions: [PERMISSIONS.PLATFORM_COMPANIES_VIEW] },
  { path: ROUTES.PLATFORM_TENANTS, moduleKey: "platform", permissions: [PERMISSIONS.PLATFORM_TENANTS_VIEW] },
  { path: ROUTES.PLATFORM_PROJECTS, moduleKey: "platform", permissions: [PERMISSIONS.PLATFORM_PROJECTS_VIEW] },
  // Access Control
  { path: ROUTES.PLATFORM_USERS, moduleKey: "platform", permissions: [PERMISSIONS.PLATFORM_USERS_VIEW] },
  { path: ROUTES.PLATFORM_ROLES, moduleKey: "platform", permissions: [PERMISSIONS.PLATFORM_ROLES_VIEW] },
  { path: ROUTES.PLATFORM_PERMISSIONS, moduleKey: "platform", permissions: [PERMISSIONS.PLATFORM_PERMISSIONS_VIEW] },
  { path: ROUTES.PLATFORM_MODULE_MAPPING, moduleKey: "platform", permissions: [PERMISSIONS.PLATFORM_SETTINGS_VIEW] },
  // Configuration
  { path: ROUTES.PLATFORM_SCHEMA_MANAGER, moduleKey: "platform", permissions: [PERMISSIONS.PLATFORM_SCHEMA_MANAGER_VIEW] },
  { path: ROUTES.PLATFORM_SETTINGS, moduleKey: "platform", permissions: [PERMISSIONS.PLATFORM_SETTINGS_VIEW] },
  { path: ROUTES.PLATFORM_FEATURE_FLAGS, moduleKey: "platform", permissions: [PERMISSIONS.PLATFORM_FEATURE_FLAGS_VIEW] },
  { path: ROUTES.PLATFORM_WORKFLOW_CONFIG, moduleKey: "platform", permissions: [PERMISSIONS.PLATFORM_SETTINGS_VIEW] },
  { path: ROUTES.PLATFORM_NOTIFICATION_TEMPLATES, moduleKey: "platform", permissions: [PERMISSIONS.PLATFORM_SETTINGS_VIEW] },
  // Website & Branding
  { path: ROUTES.PLATFORM_WEBSITE_PAGES, moduleKey: "platform", permissions: [PERMISSIONS.PLATFORM_WEBSITE_PAGES_VIEW] },
  { path: ROUTES.PLATFORM_WEBSITE_TEMPLATES, moduleKey: "platform", permissions: [PERMISSIONS.PLATFORM_WEBSITE_TEMPLATES_VIEW] },
  { path: ROUTES.PLATFORM_WEBSITE_THEMES, moduleKey: "platform", permissions: [PERMISSIONS.PLATFORM_WEBSITE_THEMES_VIEW] },
  { path: ROUTES.PLATFORM_WEBSITE_SETTINGS, moduleKey: "platform", permissions: [PERMISSIONS.PLATFORM_WEBSITE_SETTINGS_VIEW] },
  // Monitoring
  { path: ROUTES.PLATFORM_SYSTEM_HEALTH, moduleKey: "platform", permissions: [PERMISSIONS.PLATFORM_VIEW] },
  { path: ROUTES.PLATFORM_RECYCLE_BIN, moduleKey: "platform", permissions: [PERMISSIONS.PLATFORM_VIEW] },
  { path: ROUTES.PLATFORM_CONTACT_SUBMISSIONS, moduleKey: "platform", permissions: [PERMISSIONS.PLATFORM_CONTACT_SUBMISSIONS_VIEW] },
  { path: ROUTES.AUDIT_LOGS, moduleKey: "platform", permissions: [PERMISSIONS.AUDIT_VIEW] },

  // ── Licensing ─────────────────────────────────────────────────────────────
  { path: ROUTES.LICENSING_HOME, moduleKey: "licensing", permissions: [PERMISSIONS.LICENSING_VIEW] },
  { path: ROUTES.LICENSING_CATALOG, moduleKey: "licensing", permissions: [PERMISSIONS.LICENSING_CATALOG_VIEW] },
  { path: ROUTES.LICENSING_SUBSCRIPTIONS, moduleKey: "licensing", permissions: [PERMISSIONS.LICENSING_SUBSCRIPTIONS_VIEW] },
  { path: ROUTES.LICENSING_INTEGRATIONS, moduleKey: "licensing", permissions: [PERMISSIONS.LICENSING_INTEGRATIONS_VIEW] },
  { path: ROUTES.LICENSING_BILLING_HISTORY, moduleKey: "licensing", permissions: [PERMISSIONS.LICENSING_VIEW] },
  { path: ROUTES.LICENSING_USAGE, moduleKey: "licensing", permissions: [PERMISSIONS.LICENSING_VIEW] },

  // ── Security ──────────────────────────────────────────────────────────────
  { path: ROUTES.SECURITY_HOME, moduleKey: "security", permissions: [PERMISSIONS.SECURITY_VIEW] },
  { path: ROUTES.SECURITY_SESSIONS, moduleKey: "security", permissions: [PERMISSIONS.SECURITY_SESSIONS_VIEW] },
  { path: ROUTES.SECURITY_MFA, moduleKey: "security", permissions: [PERMISSIONS.SECURITY_MFA_VIEW] },
  { path: ROUTES.SECURITY_DEVICES, moduleKey: "security", permissions: [PERMISSIONS.SECURITY_DEVICES_VIEW] },
  { path: ROUTES.SECURITY_PASSWORD_POLICIES, moduleKey: "security", permissions: [PERMISSIONS.SECURITY_PASSWORD_POLICIES_VIEW] },
  { path: ROUTES.SECURITY_SSO, moduleKey: "security", permissions: [PERMISSIONS.SECURITY_VIEW] },
  { path: ROUTES.SECURITY_IP_RESTRICTIONS, moduleKey: "security", permissions: [PERMISSIONS.SECURITY_VIEW] },
  { path: ROUTES.SECURITY_ACCESS_LOGS, moduleKey: "security", permissions: [PERMISSIONS.AUDIT_VIEW] },

  // ── Integrations ──────────────────────────────────────────────────────────
  { path: ROUTES.INTEGRATIONS_HOME, moduleKey: "integrations", permissions: [PERMISSIONS.LICENSING_VIEW] },
  { path: ROUTES.INTEGRATIONS_API_KEYS, moduleKey: "integrations", permissions: [PERMISSIONS.LICENSING_VIEW] },
  { path: ROUTES.INTEGRATIONS_WEBHOOKS, moduleKey: "integrations", permissions: [PERMISSIONS.LICENSING_VIEW] },
  { path: ROUTES.INTEGRATIONS_APPS, moduleKey: "integrations", permissions: [PERMISSIONS.LICENSING_VIEW] },
  { path: ROUTES.INTEGRATIONS_LOGS, moduleKey: "integrations", permissions: [PERMISSIONS.AUDIT_VIEW] },

  // ── Helpdesk ──────────────────────────────────────────────────────────────
  { path: ROUTES.HELPDESK_HOME, moduleKey: "helpdesk", permissions: [PERMISSIONS.PLATFORM_VIEW] },
  { path: ROUTES.HELPDESK_TICKETS, moduleKey: "helpdesk", permissions: [PERMISSIONS.PLATFORM_VIEW] },
  { path: ROUTES.HELPDESK_ESCALATIONS, moduleKey: "helpdesk", permissions: [PERMISSIONS.PLATFORM_VIEW] },
  { path: ROUTES.HELPDESK_FAQ, moduleKey: "helpdesk", permissions: [PERMISSIONS.PLATFORM_VIEW] },

  // ── Communication ─────────────────────────────────────────────────────────
  { path: ROUTES.COMMUNICATION_HOME, moduleKey: "communication", permissions: [PERMISSIONS.PLATFORM_VIEW] },
  { path: ROUTES.COMMUNICATION_ANNOUNCEMENTS, moduleKey: "communication", permissions: [PERMISSIONS.PLATFORM_VIEW] },
  { path: ROUTES.COMMUNICATION_EMAIL_TEMPLATES, moduleKey: "communication", permissions: [PERMISSIONS.PLATFORM_SETTINGS_VIEW] },
  { path: ROUTES.COMMUNICATION_SMS_TEMPLATES, moduleKey: "communication", permissions: [PERMISSIONS.PLATFORM_SETTINGS_VIEW] },
];

const toFeatureKey = (path: string) =>
  path
    .replace(/^\/+/, "")
    .replace(/\/+/g, ".")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .toLowerCase();

export const getRoutePermissionRule = (path: string): RoutePermissionRule | undefined => {
  const normalized = canonicalizeProtectedPath(path);
  let bestMatch: RoutePermissionRule | undefined;

  for (const rule of ROUTE_PERMISSION_MATRIX) {
    const rulePath = normalizePath(rule.path);
    const exact = normalized === rulePath;
    const nested = normalized.startsWith(`${rulePath}/`);
    if (!exact && !nested) continue;

    if (!bestMatch || rulePath.length > bestMatch.path.length) {
      bestMatch = rule;
    }
  }

  return bestMatch;
};

export const getRoutePermissionKeys = (path: string, moduleKeyFallback?: ModuleKey | null): string[] => {
  const canonicalPath = canonicalizeProtectedPath(path);
  const rule = getRoutePermissionRule(canonicalPath);
  const moduleKey = rule?.moduleKey ?? moduleKeyFallback;
  const normalizedPath = toFeatureKey(canonicalPath);

  const keys: string[] = [
    ...(rule?.permissions ?? []),
    `page:${normalizedPath}`,
    `path:${normalizedPath}`,
    normalizedPath,
    `resource:${normalizedPath}.view`,
  ];

  if (moduleKey) {
    keys.push(
      `module:${moduleKey}`,
      `${moduleKey}.*`,
      `${moduleKey}.view`,
      `resource:${moduleKey}.view`
    );
  }

  return [...new Set(keys)];
};

export const getFirstAccessibleRoute = (hasPermissionFn: (keys: string[]) => boolean): string | null => {
  for (const rule of ROUTE_PERMISSION_MATRIX) {
    const keys = getRoutePermissionKeys(rule.path, rule.moduleKey);
    if (hasPermissionFn(keys)) {
      return rule.path;
    }
  }

  return null;
};
