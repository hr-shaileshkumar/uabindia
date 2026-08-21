export const ROUTES = {
  LOGIN: "/login",
  NOT_AUTHORIZED: "/not-authorized",
  CONTEXT: "/context",
  SUPERADMIN_DASHBOARD: "/superadmin/dashboard",

  DASHBOARD: "/dashboard",
  ESS_HOME: "/ess",
  MSS_HOME: "/mss",
  ADMINISTRATION_HOME: "/platform/settings",
  ADMINISTRATION_APPROVALS: "/approvals",
  ADMINISTRATION_NOTIFICATIONS: "/notifications",
  ADMINISTRATION_DOCUMENTS: "/documents",
  ADMINISTRATION_PROFILE: "/profile",
  ADMINISTRATION_SECURITY: "/security",

  // ── HRMS ────────────────────────────────────────────────────────────────────
  HRMS_HOME: "/hrms",
  // Core HR
  EMPLOYEES: "/hrms/employees",
  CERTIFICATES: "/hrms/certificates",
  HR_ASSETS: "/hrms/assets",
  ONBOARDING: "/hrms/onboarding",
  OFFBOARDING: "/hrms/offboarding",
  PROBATION: "/hrms/probation",
  // Attendance & Time
  ATTENDANCE: "/hrms/attendance",
  SHIFTS: "/hrms/shifts",
  OVERTIME: "/hrms/overtime",
  LEAVE: "/hrms/leave",
  // Talent Acquisition
  RECRUITMENT: "/hrms/recruitment",
  SCREENING_SCHEDULE: "/hrms/screening-schedule",
  SCREENING_RESULTS: "/hrms/screening-results",
  // Learning & Development
  TRAINING: "/hrms/training",
  ASSESSMENTS: "/hrms/assessments",
  // Performance
  PERFORMANCE: "/hrms/performance",
  // Travel
  TRAVEL: "/hrms/travel",
  // HR Operations
  HR_PAYROLL: "/hrms/payroll",

  // ── Payroll ─────────────────────────────────────────────────────────────────
  PAYROLL_HOME: "/payroll",
  // Processing
  PAYROLL_RUNS: "/payroll/runs",
  PAYROLL_PAYSLIPS: "/payroll/payslips",
  PAYROLL_BONUS: "/payroll/bonus",
  PAYROLL_ARREARS: "/payroll/arrears",
  // Setup
  PAYROLL_STRUCTURES: "/payroll/structures",
  PAYROLL_COMPONENTS: "/payroll/components",
  PAYROLL_LOANS: "/payroll/loans",
  PAYROLL_REIMBURSEMENTS: "/payroll/reimbursements",
  // Compliance
  PAYROLL_STATUTORY: "/payroll/statutory",
  PAYROLL_FINAL_SETTLEMENT: "/payroll/final-settlement",
  PAYROLL_TAX_DECLARATIONS: "/payroll/tax-declarations",

  // ── Reports ─────────────────────────────────────────────────────────────────
  REPORTS_HOME: "/reports",
  REPORTS_HR: "/reports/hr",
  REPORTS_PAYROLL: "/reports/payroll",
  REPORTS_COMPLIANCE: "/reports/compliance",
  REPORTS_ERP: "/reports/erp",
  REPORTS_FINANCIAL: "/reports/financial",
  REPORTS_CUSTOM: "/reports/custom",

  // ── Admin Console (Platform) ─────────────────────────────────────────────────
  PLATFORM_HOME: "/platform",
  // Tenant Management
  PLATFORM_COMPANIES: "/platform/companies",
  PLATFORM_TENANTS: "/platform/tenants",
  PLATFORM_TENANTS_NEW: "/platform/tenants/new",
  PLATFORM_TENANTS_DETAIL: "/platform/tenants/[id]",
  PLATFORM_TENANTS_EDIT: "/platform/tenants/[id]/edit",
  PLATFORM_PROJECTS: "/platform/projects",
  PROJECT_TASKS: "/projects/tasks",
  PROJECT_TIMESHEETS: "/projects/timesheets",
  // Organization masters (canonical — not under HRMS)
  PLATFORM_DEPARTMENTS: "/platform/departments",
  PLATFORM_DESIGNATIONS: "/platform/designations",
  PLATFORM_BRANCHES: "/platform/branches",
  PLATFORM_COST_CENTERS: "/platform/cost-centers",
  PLATFORM_BUSINESS_UNITS: "/platform/business-units",
  PLATFORM_ORG_CHART: "/platform/org-chart",
  PLATFORM_HOLIDAY_CALENDAR: "/platform/holiday-calendar",
  // Access Control
  PLATFORM_USERS: "/platform/users",
  PLATFORM_ROLES: "/platform/roles",
  PLATFORM_PERMISSIONS: "/platform/permissions",
  PLATFORM_MODULE_MAPPING: "/platform/module-mapping",
  // Configuration
  PLATFORM_SCHEMA_MANAGER: "/platform/schema-manager",
  PLATFORM_SETTINGS: "/platform/settings",
  PLATFORM_FEATURE_FLAGS: "/platform/feature-flags",
  PLATFORM_WORKFLOW_CONFIG: "/platform/workflow-config",
  PLATFORM_NOTIFICATION_TEMPLATES: "/platform/notification-templates",
  // Website & Branding
  PLATFORM_WEBSITE_PAGES: "/platform/website/pages",
  PLATFORM_WEBSITE_TEMPLATES: "/platform/website/templates",
  PLATFORM_WEBSITE_THEMES: "/platform/website/themes",
  PLATFORM_WEBSITE_SETTINGS: "/platform/website/settings",
  // Monitoring
  PLATFORM_SYSTEM_HEALTH: "/platform/system-health",
  PLATFORM_CONTACT_SUBMISSIONS: "/platform/contact-submissions",
  PLATFORM_RECYCLE_BIN: "/platform/recycle-bin",
  AUDIT_LOGS: "/platform/audit-logs",

  // ── ERP Workspace ────────────────────────────────────────────────────────────
  // Finance
  FINANCE_HOME: "/finance",
  CHART_OF_ACCOUNTS: "/chart-of-accounts",
  JOURNAL_ENTRIES: "/journal-entries",
  PAYMENTS: "/payments",
  INVOICES: "/invoices",
  VENDOR_BILLS: "/vendor-bills",
  EXPENSES: "/expenses",
  TAX_MANAGEMENT: "/tax-management",
  BANK_RECONCILIATION: "/bank-reconciliation",
  ACCOUNTING_PERIODS: "/accounting-periods",
  // Procurement
  PROCUREMENT_HOME: "/procurement",
  VENDORS: "/vendors",
  PURCHASE_REQUESTS: "/purchase-requests",
  PURCHASE_ORDERS: "/purchase-orders",
  GRN: "/grn",
  // Sales & CRM
  CRM_HOME: "/crm",
  LEADS: "/crm/leads",
  SALES_HOME: "/sales",
  CUSTOMERS: "/crm/customers",
    QUOTATIONS: "/quotations",
    DISCOUNTS: "/discounts",
    SALES_ORDERS: "/sales-orders",
  RETURNS: "/returns",
  // Inventory
  INVENTORY_HOME: "/inventory",
  ITEMS: "/items",
  WAREHOUSES: "/warehouses",
  STOCK_MOVEMENTS: "/stock-movements",
  INVENTORY_ADJUSTMENTS: "/inventory-adjustments",
  INVENTORY_TRANSFERS: "/inventory-transfers",
  // Operations
  APPROVALS: "/approvals",
  NOTIFICATIONS: "/notifications",
  DOCUMENTS: "/documents",
  PROFILE: "/profile",
  ASSETS_HOME: "/hrms/assets",

  // ── Licensing ───────────────────────────────────────────────────────────────
  LICENSING_HOME: "/licensing",
  LICENSING_CATALOG: "/licensing/catalog",
  LICENSING_SUBSCRIPTIONS: "/licensing/subscriptions",
  LICENSING_INTEGRATIONS: "/licensing/integrations",
  LICENSING_BILLING_HISTORY: "/licensing/billing-history",
  LICENSING_USAGE: "/licensing/usage",

  // ── Security ────────────────────────────────────────────────────────────────
  SECURITY_HOME: "/security",
  SECURITY_SESSIONS: "/platform/security/sessions",
  SECURITY_MFA: "/security/mfa",
  SECURITY_DEVICES: "/security/devices",
  SECURITY_PASSWORD_POLICIES: "/security/password-policies",
  SECURITY_SSO: "/security/sso",
  SECURITY_IP_RESTRICTIONS: "/security/ip-restrictions",
  SECURITY_ACCESS_LOGS: "/security/access-logs",

  // ── Integrations ────────────────────────────────────────────────────────────
  INTEGRATIONS_HOME: "/integrations",
  INTEGRATIONS_API_KEYS: "/integrations/api-keys",
  INTEGRATIONS_WEBHOOKS: "/integrations/webhooks",
  INTEGRATIONS_APPS: "/integrations/apps",
  INTEGRATIONS_LOGS: "/integrations/logs",

  // ── Helpdesk ────────────────────────────────────────────────────────────────
  HELPDESK_HOME: "/helpdesk",
  HELPDESK_TICKETS: "/helpdesk/tickets",
  HELPDESK_ESCALATIONS: "/helpdesk/escalations",
  HELPDESK_FAQ: "/helpdesk/faq",

  // ── Communication ───────────────────────────────────────────────────────────
  COMMUNICATION_HOME: "/communication",
  COMMUNICATION_ANNOUNCEMENTS: "/communication/announcements",
  COMMUNICATION_EMAIL_TEMPLATES: "/communication/email-templates",
  COMMUNICATION_SMS_TEMPLATES: "/communication/sms-templates",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
