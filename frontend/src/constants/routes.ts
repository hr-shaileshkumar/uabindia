export const ROUTES = {
  LOGIN: "/login",
  NOT_AUTHORIZED: "/not-authorized",
  CONTEXT: "/context",

  DASHBOARD: "/erp/dashboard",

  // ── HRMS ────────────────────────────────────────────────────────────────────
  HRMS_HOME: "/erp/hrms",
  // Core HR
  EMPLOYEES: "/erp/hrms/employees",
  CERTIFICATES: "/erp/hrms/certificates",
  HR_ASSETS: "/erp/hrms/assets",
  ONBOARDING: "/erp/hrms/onboarding",
  OFFBOARDING: "/erp/hrms/offboarding",
  PROBATION: "/erp/hrms/probation",
  // Attendance & Time
  ATTENDANCE: "/erp/hrms/attendance",
  SHIFTS: "/erp/hrms/shifts",
  OVERTIME: "/erp/hrms/overtime",
  LEAVE: "/erp/hrms/leave",
  // Talent Acquisition
  RECRUITMENT: "/erp/hrms/recruitment",
  SCREENING_SCHEDULE: "/erp/hrms/screening-schedule",
  SCREENING_RESULTS: "/erp/hrms/screening-results",
  // Learning & Development
  TRAINING: "/erp/hrms/training",
  ASSESSMENTS: "/erp/hrms/assessments",
  // Performance
  PERFORMANCE: "/erp/hrms/performance",
  // HR Operations
  HR_PAYROLL: "/erp/hrms/payroll",

  // ── Payroll ─────────────────────────────────────────────────────────────────
  PAYROLL_HOME: "/erp/payroll",
  // Processing
  PAYROLL_RUNS: "/erp/payroll/runs",
  PAYROLL_PAYSLIPS: "/erp/payroll/payslips",
  PAYROLL_BONUS: "/erp/payroll/bonus",
  PAYROLL_ARREARS: "/erp/payroll/arrears",
  // Setup
  PAYROLL_STRUCTURES: "/erp/payroll/structures",
  PAYROLL_COMPONENTS: "/erp/payroll/components",
  PAYROLL_LOANS: "/erp/payroll/loans",
  PAYROLL_REIMBURSEMENTS: "/erp/payroll/reimbursements",
  // Compliance
  PAYROLL_STATUTORY: "/erp/payroll/statutory",
  PAYROLL_FINAL_SETTLEMENT: "/erp/payroll/final-settlement",
  PAYROLL_TAX_DECLARATIONS: "/erp/payroll/tax-declarations",

  // ── Reports ─────────────────────────────────────────────────────────────────
  REPORTS_HOME: "/erp/reports",
  REPORTS_HR: "/erp/reports/hr",
  REPORTS_PAYROLL: "/erp/reports/payroll",
  REPORTS_COMPLIANCE: "/erp/reports/compliance",
  REPORTS_ERP: "/erp/reports/erp",
  REPORTS_FINANCIAL: "/erp/reports/financial",
  REPORTS_CUSTOM: "/erp/reports/custom",

  // ── Admin Console (Platform) ─────────────────────────────────────────────────
  PLATFORM_HOME: "/platform",
  SUPERADMIN_HOME: "/superadmin",
  SUPERADMIN_DASHBOARD: "/superadmin/dashboard",
  // Tenant Management
  PLATFORM_COMPANIES: "/platform/companies",
  PLATFORM_TENANTS: "/platform/tenants",
  PLATFORM_PROJECTS: "/platform/projects",
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
  CHART_OF_ACCOUNTS: "/erp/chart-of-accounts",
  JOURNAL_ENTRIES: "/erp/journal-entries",
  PAYMENTS: "/erp/payments",
  INVOICES: "/erp/invoices",
  EXPENSES: "/erp/expenses",
  TAX_MANAGEMENT: "/erp/tax-management",
  BANK_RECONCILIATION: "/erp/bank-reconciliation",
  // Procurement
  VENDORS: "/erp/vendors",
  PURCHASE_REQUESTS: "/erp/purchase-requests",
  PURCHASE_ORDERS: "/erp/purchase-orders",
  GRN: "/erp/grn",
  // Sales & CRM
  CUSTOMERS: "/erp/customers",
  QUOTATIONS: "/erp/quotations",
  SALES_ORDERS: "/erp/sales-orders",
  RETURNS: "/erp/returns",
  // Inventory
  ITEMS: "/erp/items",
  WAREHOUSES: "/erp/warehouses",
  STOCK_MOVEMENTS: "/erp/stock-movements",
  INVENTORY_ADJUSTMENTS: "/erp/inventory-adjustments",
  INVENTORY_TRANSFERS: "/erp/inventory-transfers",
  // Operations
  APPROVALS: "/erp/approvals",
  NOTIFICATIONS: "/erp/notifications",
  DOCUMENTS: "/erp/documents",

  // ── Licensing ───────────────────────────────────────────────────────────────
  LICENSING_HOME: "/erp/licensing",
  LICENSING_CATALOG: "/erp/licensing/catalog",
  LICENSING_SUBSCRIPTIONS: "/erp/licensing/subscriptions",
  LICENSING_INTEGRATIONS: "/erp/licensing/integrations",
  LICENSING_BILLING_HISTORY: "/erp/licensing/billing-history",
  LICENSING_USAGE: "/erp/licensing/usage",

  // ── Security ────────────────────────────────────────────────────────────────
  SECURITY_HOME: "/erp/security",
  SECURITY_SESSIONS: "/erp/security/sessions",
  SECURITY_MFA: "/erp/security/mfa",
  SECURITY_DEVICES: "/erp/security/devices",
  SECURITY_PASSWORD_POLICIES: "/erp/security/password-policies",
  SECURITY_SSO: "/erp/security/sso",
  SECURITY_IP_RESTRICTIONS: "/erp/security/ip-restrictions",
  SECURITY_ACCESS_LOGS: "/erp/security/access-logs",

  // ── Integrations ────────────────────────────────────────────────────────────
  INTEGRATIONS_HOME: "/erp/integrations",
  INTEGRATIONS_API_KEYS: "/erp/integrations/api-keys",
  INTEGRATIONS_WEBHOOKS: "/erp/integrations/webhooks",
  INTEGRATIONS_APPS: "/erp/integrations/apps",
  INTEGRATIONS_LOGS: "/erp/integrations/logs",

  // ── Helpdesk ────────────────────────────────────────────────────────────────
  HELPDESK_HOME: "/erp/helpdesk",
  HELPDESK_TICKETS: "/erp/helpdesk/tickets",
  HELPDESK_ESCALATIONS: "/erp/helpdesk/escalations",
  HELPDESK_FAQ: "/erp/helpdesk/faq",

  // ── Communication ───────────────────────────────────────────────────────────
  COMMUNICATION_HOME: "/erp/communication",
  COMMUNICATION_ANNOUNCEMENTS: "/erp/communication/announcements",
  COMMUNICATION_EMAIL_TEMPLATES: "/erp/communication/email-templates",
  COMMUNICATION_SMS_TEMPLATES: "/erp/communication/sms-templates",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
