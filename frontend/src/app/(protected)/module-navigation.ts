import { ROUTES } from "@/constants/routes";

export type SubModuleLink = {
  key: string;
  name: string;
  path: string;
  icon?: string;
  group?: string;  // submodule label — e.g. "Finance", "Core HR", "Processing"
};

// ── Admin Console (Platform) ──────────────────────────────────────────────────
const platformSidebar: SubModuleLink[] = [
  { key: "admin-home",                  name: "Admin Overview",          path: ROUTES.PLATFORM_HOME,                    icon: "dashboard",   group: "Overview" },
  { key: "admin-companies",             name: "Companies",               path: ROUTES.PLATFORM_COMPANIES,               icon: "building",    group: "Tenant Management" },
  { key: "admin-tenants",               name: "Tenants",                 path: ROUTES.PLATFORM_TENANTS,                 icon: "layers",      group: "Tenant Management" },
  { key: "admin-projects",              name: "Projects",                path: ROUTES.PLATFORM_PROJECTS,                icon: "folder",      group: "Tenant Management" },
  { key: "admin-users",                 name: "Users",                   path: ROUTES.PLATFORM_USERS,                   icon: "users",       group: "Access Control" },
  { key: "admin-roles",                 name: "Roles",                   path: ROUTES.PLATFORM_ROLES,                   icon: "shield",      group: "Access Control" },
  { key: "admin-permissions",           name: "Permissions",             path: ROUTES.PLATFORM_PERMISSIONS,             icon: "key",         group: "Access Control" },
  { key: "admin-module-mapping",        name: "Module Mapping",          path: ROUTES.PLATFORM_MODULE_MAPPING,          icon: "grid",        group: "Access Control" },
  { key: "admin-schema-manager",        name: "Schema Manager",          path: ROUTES.PLATFORM_SCHEMA_MANAGER,          icon: "database",    group: "Configuration" },
  { key: "admin-settings",              name: "Settings",                path: ROUTES.PLATFORM_SETTINGS,                icon: "settings",    group: "Configuration" },
  { key: "admin-feature-flags",         name: "Feature Flags",           path: ROUTES.PLATFORM_FEATURE_FLAGS,           icon: "flag",        group: "Configuration" },
  { key: "admin-workflow-config",       name: "Workflow Config",         path: ROUTES.PLATFORM_WORKFLOW_CONFIG,         icon: "workflow",    group: "Configuration" },
  { key: "admin-notification-templates",name: "Notification Templates",  path: ROUTES.PLATFORM_NOTIFICATION_TEMPLATES,  icon: "bell",        group: "Configuration" },
  { key: "admin-website-pages",        name: "Website Pages",           path: ROUTES.PLATFORM_WEBSITE_PAGES,           icon: "file-text",   group: "Website & Branding" },
  { key: "admin-website-templates",    name: "Page Templates",          path: ROUTES.PLATFORM_WEBSITE_TEMPLATES,       icon: "layout",      group: "Website & Branding" },
  { key: "admin-website-themes",       name: "Themes",                  path: ROUTES.PLATFORM_WEBSITE_THEMES,          icon: "palette",     group: "Website & Branding" },
  { key: "admin-website-settings",     name: "Website Settings",        path: ROUTES.PLATFORM_WEBSITE_SETTINGS,        icon: "settings",    group: "Website & Branding" },
  { key: "admin-system-health",         name: "System Health",           path: ROUTES.PLATFORM_SYSTEM_HEALTH,           icon: "activity",    group: "Monitoring" },
  { key: "admin-audit",                 name: "Audit Logs",              path: ROUTES.AUDIT_LOGS,                       icon: "clipboard",   group: "Monitoring" },
  { key: "admin-contact",               name: "Contact Submissions",     path: ROUTES.PLATFORM_CONTACT_SUBMISSIONS,     icon: "mail",        group: "Monitoring" },
  { key: "admin-recycle-bin",           name: "Recycle Bin",             path: ROUTES.PLATFORM_RECYCLE_BIN,             icon: "trash",       group: "Monitoring" },
];

// ── Operations (Dashboard, Approvals, Notifications, Documents) ───────────────
const operationsSidebar: SubModuleLink[] = [
  { key: "erp-dashboard",     name: "Dashboard",     path: ROUTES.DASHBOARD,     icon: "dashboard",    group: "Overview" },
  { key: "erp-approvals",     name: "Approvals",     path: ROUTES.APPROVALS,     icon: "check-circle", group: "Overview" },
  { key: "erp-notifications", name: "Notifications", path: ROUTES.NOTIFICATIONS, icon: "bell",         group: "Overview" },
  { key: "erp-documents",     name: "Documents",     path: ROUTES.DOCUMENTS,     icon: "document",     group: "Overview" },
];

// ── ERP Finance ───────────────────────────────────────────────────────────────
const erpFinanceSidebar: SubModuleLink[] = [
  { key: "fin-home",               name: "Finance Overview",    path: ROUTES.DASHBOARD,           icon: "dashboard",    group: "Overview" },
  { key: "fin-chart-of-accounts",  name: "Chart of Accounts",  path: ROUTES.CHART_OF_ACCOUNTS,   icon: "layers",       group: "Accounting" },
  { key: "fin-journal-entries",    name: "Journal Entries",     path: ROUTES.JOURNAL_ENTRIES,     icon: "journal",      group: "Accounting" },
  { key: "fin-payments",           name: "Payments",            path: ROUTES.PAYMENTS,            icon: "credit-card",  group: "Transactions" },
  { key: "fin-invoices",           name: "Invoices",            path: ROUTES.INVOICES,            icon: "receipt",      group: "Transactions" },
  { key: "fin-expenses",           name: "Expenses",            path: ROUTES.EXPENSES,            icon: "wallet",       group: "Transactions" },
  { key: "fin-tax-management",     name: "Tax Management",      path: ROUTES.TAX_MANAGEMENT,      icon: "calculator",   group: "Compliance" },
  { key: "fin-bank-reconciliation",name: "Bank Reconciliation", path: ROUTES.BANK_RECONCILIATION, icon: "bank",         group: "Compliance" },
];

// ── ERP Procurement ───────────────────────────────────────────────────────────
const erpProcurementSidebar: SubModuleLink[] = [
  { key: "proc-home",              name: "Procurement Overview", path: ROUTES.VENDORS,           icon: "dashboard",      group: "Overview" },
  { key: "proc-vendors",           name: "Vendors",              path: ROUTES.VENDORS,           icon: "truck",          group: "Suppliers" },
  { key: "proc-purchase-requests", name: "Purchase Requests",   path: ROUTES.PURCHASE_REQUESTS, icon: "shopping-cart",  group: "Ordering" },
  { key: "proc-purchase-orders",   name: "Purchase Orders",     path: ROUTES.PURCHASE_ORDERS,   icon: "clipboard",      group: "Ordering" },
  { key: "proc-grn",               name: "Goods Receipt (GRN)", path: ROUTES.GRN,               icon: "box",            group: "Receiving" },
];

// ── ERP Sales & CRM ───────────────────────────────────────────────────────────
const erpSalesSidebar: SubModuleLink[] = [
  { key: "sales-home",       name: "Sales Overview",  path: ROUTES.CUSTOMERS,    icon: "dashboard",    group: "Overview" },
  { key: "sales-customers",  name: "Customers",       path: ROUTES.CUSTOMERS,    icon: "users",        group: "CRM" },
  { key: "sales-quotations", name: "Quotations",      path: ROUTES.QUOTATIONS,   icon: "file-text",    group: "Sales Process" },
  { key: "sales-orders",     name: "Sales Orders",    path: ROUTES.SALES_ORDERS, icon: "shopping-bag", group: "Sales Process" },
  { key: "sales-returns",    name: "Returns",         path: ROUTES.RETURNS,      icon: "rotate-ccw",   group: "Sales Process" },
];

// ── ERP Inventory ─────────────────────────────────────────────────────────────
const erpInventorySidebar: SubModuleLink[] = [
  { key: "inv-home",          name: "Inventory Overview",    path: ROUTES.ITEMS,                 icon: "dashboard",       group: "Overview" },
  { key: "inv-items",         name: "Items",                 path: ROUTES.ITEMS,                 icon: "box",             group: "Catalogue" },
  { key: "inv-warehouses",    name: "Warehouses",            path: ROUTES.WAREHOUSES,            icon: "warehouse",       group: "Locations" },
  { key: "inv-stock-movement",name: "Stock Movements",       path: ROUTES.STOCK_MOVEMENTS,       icon: "trending-up",     group: "Transactions" },
  { key: "inv-adjustments",   name: "Inventory Adjustments", path: ROUTES.INVENTORY_ADJUSTMENTS, icon: "sliders",         group: "Transactions" },
  { key: "inv-transfers",     name: "Inventory Transfers",   path: ROUTES.INVENTORY_TRANSFERS,   icon: "arrow-right-left",group: "Transactions" },
];

// ── HRMS ──────────────────────────────────────────────────────────────────────
const hrmsSidebar: SubModuleLink[] = [
  { key: "hrms-dashboard",            name: "HR Dashboard",            path: ROUTES.HRMS_HOME,               icon: "dashboard",      group: "Core HR" },
  { key: "employees",                 name: "Employees",               path: ROUTES.EMPLOYEES,               icon: "employees",      group: "Core HR" },
  { key: "certificates",              name: "Certificates",            path: ROUTES.CERTIFICATES,            icon: "award",          group: "Core HR" },
  { key: "assets",                    name: "Assets",                  path: ROUTES.HR_ASSETS,               icon: "monitor",        group: "Core HR" },
  { key: "onboarding",                name: "Onboarding",              path: ROUTES.ONBOARDING,              icon: "user-plus",      group: "Employee Lifecycle" },
  { key: "offboarding",               name: "Offboarding",             path: ROUTES.OFFBOARDING,             icon: "user-minus",     group: "Employee Lifecycle" },
  { key: "probation",                 name: "Probation",               path: ROUTES.PROBATION,               icon: "hourglass",      group: "Employee Lifecycle" },
  { key: "attendance",                name: "Attendance",              path: ROUTES.ATTENDANCE,              icon: "attendance",     group: "Attendance & Time" },
  { key: "shifts",                    name: "Shifts",                  path: ROUTES.SHIFTS,                  icon: "clock",          group: "Attendance & Time" },
  { key: "overtime",                  name: "Overtime",                path: ROUTES.OVERTIME,                icon: "timer",          group: "Attendance & Time" },
  { key: "leave-management",          name: "Leave",                   path: ROUTES.LEAVE,                   icon: "leave",          group: "Attendance & Time" },
  { key: "recruitment",               name: "Recruitment",             path: ROUTES.RECRUITMENT,             icon: "search",         group: "Talent Acquisition" },
  { key: "screening-schedule",        name: "Screening Schedule",      path: ROUTES.SCREENING_SCHEDULE,      icon: "calendar-check", group: "Talent Acquisition" },
  { key: "screening-results",         name: "Screening Results",       path: ROUTES.SCREENING_RESULTS,       icon: "bar-chart",      group: "Talent Acquisition" },
  { key: "training",                  name: "Training & Learning",     path: ROUTES.TRAINING,                icon: "training",       group: "Learning & Development" },
  { key: "assessments",               name: "Assessments",             path: ROUTES.ASSESSMENTS,             icon: "clipboard-check",group: "Learning & Development" },
  { key: "performance",               name: "Performance",             path: ROUTES.PERFORMANCE,             icon: "trending-up",    group: "Performance" },
  { key: "hr-payroll",                name: "HR Payroll",              path: ROUTES.HR_PAYROLL,              icon: "payroll",        group: "HR Operations" },
];

// ── Payroll ───────────────────────────────────────────────────────────────────
const payrollSidebar: SubModuleLink[] = [
  { key: "payroll-dashboard",         name: "Payroll Dashboard",       path: ROUTES.PAYROLL_HOME,            icon: "dashboard",      group: "Overview" },
  { key: "payroll-runs",              name: "Payroll Runs",            path: ROUTES.PAYROLL_RUNS,            icon: "play-circle",    group: "Processing" },
  { key: "payroll-payslips",          name: "Payslips",                path: ROUTES.PAYROLL_PAYSLIPS,        icon: "file-text",      group: "Processing" },
  { key: "payroll-bonus",             name: "Bonus & Incentives",      path: ROUTES.PAYROLL_BONUS,           icon: "gift",           group: "Processing" },
  { key: "payroll-arrears",           name: "Arrears",                 path: ROUTES.PAYROLL_ARREARS,         icon: "clock",          group: "Processing" },
  { key: "payroll-structures",        name: "Structures",              path: ROUTES.PAYROLL_STRUCTURES,      icon: "layers",         group: "Setup" },
  { key: "payroll-components",        name: "Components",              path: ROUTES.PAYROLL_COMPONENTS,      icon: "puzzle",         group: "Setup" },
  { key: "payroll-loans",             name: "Loan Management",         path: ROUTES.PAYROLL_LOANS,           icon: "credit-card",    group: "Setup" },
  { key: "payroll-reimbursements",    name: "Reimbursements",          path: ROUTES.PAYROLL_REIMBURSEMENTS,  icon: "receipt",        group: "Setup" },
  { key: "payroll-statutory",         name: "Statutory",               path: ROUTES.PAYROLL_STATUTORY,       icon: "shield",         group: "Compliance" },
  { key: "payroll-final-settlement",  name: "Final Settlement",        path: ROUTES.PAYROLL_FINAL_SETTLEMENT,icon: "clipboard-check",group: "Compliance" },
  { key: "payroll-tax-declarations",  name: "Tax Declarations",        path: ROUTES.PAYROLL_TAX_DECLARATIONS,icon: "calculator",     group: "Compliance" },
];

// ── Reports ───────────────────────────────────────────────────────────────────
const reportsSidebar: SubModuleLink[] = [
  { key: "reports-home",              name: "Reports Home",            path: ROUTES.REPORTS_HOME,            icon: "dashboard",   group: "Overview" },
  { key: "reports-hr",                name: "HR Reports",              path: ROUTES.REPORTS_HR,              icon: "employees",   group: "HR" },
  { key: "reports-payroll",           name: "Payroll Reports",         path: ROUTES.REPORTS_PAYROLL,         icon: "payroll",     group: "Payroll" },
  { key: "reports-compliance",        name: "Compliance Reports",      path: ROUTES.REPORTS_COMPLIANCE,      icon: "shield",      group: "Compliance" },
  { key: "reports-erp",               name: "ERP Reports",             path: ROUTES.REPORTS_ERP,             icon: "briefcase",   group: "ERP" },
  { key: "reports-financial",         name: "Financial Reports",       path: ROUTES.REPORTS_FINANCIAL,       icon: "trending-up", group: "ERP" },
  { key: "reports-custom",            name: "Custom Reports",          path: ROUTES.REPORTS_CUSTOM,          icon: "sliders",     group: "Advanced" },
];

// ── Licensing ─────────────────────────────────────────────────────────────────
const licensingSidebar: SubModuleLink[] = [
  { key: "licensing-home",            name: "Overview",                path: ROUTES.LICENSING_HOME,          icon: "dashboard",   group: "Overview" },
  { key: "licensing-catalog",         name: "Module Catalog",          path: ROUTES.LICENSING_CATALOG,       icon: "grid",        group: "Product" },
  { key: "licensing-subscriptions",   name: "Subscriptions",           path: ROUTES.LICENSING_SUBSCRIPTIONS, icon: "layers",      group: "Product" },
  { key: "licensing-billing",         name: "Billing History",         path: ROUTES.LICENSING_BILLING_HISTORY,icon: "credit-card", group: "Billing" },
  { key: "licensing-usage",           name: "Usage Analytics",         path: ROUTES.LICENSING_USAGE,         icon: "bar-chart",   group: "Billing" },
  { key: "licensing-integrations",    name: "Integrations",            path: ROUTES.LICENSING_INTEGRATIONS,  icon: "plug",        group: "Connect" },
];

// ── Security ──────────────────────────────────────────────────────────────────
const securitySidebar: SubModuleLink[] = [
  { key: "security-home",             name: "Security Overview",       path: ROUTES.SECURITY_HOME,            icon: "shield",      group: "Overview" },
  { key: "security-mfa",              name: "MFA",                     path: ROUTES.SECURITY_MFA,             icon: "smartphone",  group: "Authentication" },
  { key: "security-sso",              name: "SSO",                     path: ROUTES.SECURITY_SSO,             icon: "key",         group: "Authentication" },
  { key: "security-devices",          name: "Devices",                 path: ROUTES.SECURITY_DEVICES,         icon: "monitor",     group: "Devices" },
  { key: "security-sessions",         name: "Sessions",                path: ROUTES.SECURITY_SESSIONS,        icon: "activity",    group: "Sessions" },
  { key: "security-access-logs",      name: "Access Logs",             path: ROUTES.SECURITY_ACCESS_LOGS,     icon: "file-text",   group: "Sessions" },
  { key: "security-password",         name: "Password Policies",       path: ROUTES.SECURITY_PASSWORD_POLICIES,icon: "lock",       group: "Policies" },
  { key: "security-ip-restrictions",  name: "IP Restrictions",         path: ROUTES.SECURITY_IP_RESTRICTIONS, icon: "globe",       group: "Policies" },
];

// ── Integrations ──────────────────────────────────────────────────────────────
const integrationsSidebar: SubModuleLink[] = [
  { key: "integrations-home",         name: "Overview",                path: ROUTES.INTEGRATIONS_HOME,        icon: "dashboard",   group: "Overview" },
  { key: "integrations-api-keys",     name: "API Keys",                path: ROUTES.INTEGRATIONS_API_KEYS,    icon: "key",         group: "Developer" },
  { key: "integrations-webhooks",     name: "Webhooks",                path: ROUTES.INTEGRATIONS_WEBHOOKS,    icon: "webhook",     group: "Developer" },
  { key: "integrations-apps",         name: "Third-Party Apps",        path: ROUTES.INTEGRATIONS_APPS,        icon: "plug",        group: "Connect" },
  { key: "integrations-logs",         name: "Integration Logs",        path: ROUTES.INTEGRATIONS_LOGS,        icon: "activity",    group: "Monitoring" },
];

// ── Helpdesk ──────────────────────────────────────────────────────────────────
const helpdeskSidebar: SubModuleLink[] = [
  { key: "helpdesk-home",             name: "Helpdesk Overview",       path: ROUTES.HELPDESK_HOME,            icon: "dashboard",      group: "Overview" },
  { key: "helpdesk-tickets",          name: "Tickets",                 path: ROUTES.HELPDESK_TICKETS,         icon: "ticket",         group: "Support" },
  { key: "helpdesk-escalations",      name: "Escalations",             path: ROUTES.HELPDESK_ESCALATIONS,     icon: "alert-triangle", group: "Support" },
  { key: "helpdesk-faq",              name: "FAQs",                    path: ROUTES.HELPDESK_FAQ,             icon: "help-circle",    group: "Support" },
];

// ── Communication ─────────────────────────────────────────────────────────────
const communicationSidebar: SubModuleLink[] = [
  { key: "communication-home",         name: "Communication Overview",  path: ROUTES.COMMUNICATION_HOME,           icon: "dashboard",    group: "Overview" },
  { key: "communication-announcements",name: "Announcements",           path: ROUTES.COMMUNICATION_ANNOUNCEMENTS,  icon: "megaphone",    group: "Messaging" },
  { key: "communication-email",        name: "Email Templates",         path: ROUTES.COMMUNICATION_EMAIL_TEMPLATES,icon: "mail",         group: "Templates" },
  { key: "communication-sms",          name: "SMS Templates",           path: ROUTES.COMMUNICATION_SMS_TEMPLATES,  icon: "message-sq",   group: "Templates" },
];

const moduleMap: Record<string, SubModuleLink[]> = {
  platform:        platformSidebar,
  operations:      operationsSidebar,
  erp_finance:     erpFinanceSidebar,
  erp_procurement: erpProcurementSidebar,
  erp_sales:       erpSalesSidebar,
  erp_inventory:   erpInventorySidebar,
  hrms:            hrmsSidebar,
  payroll:         payrollSidebar,
  reports:         reportsSidebar,
  licensing:       licensingSidebar,
  security:        securitySidebar,
  integrations:    integrationsSidebar,
  helpdesk:        helpdeskSidebar,
  communication:   communicationSidebar,
};

const MODULE_KEY_ALIASES: Record<string, string> = {
  erp: "operations",
  operations: "operations",
  workspace: "operations",
  ops: "operations",
  finance: "erp_finance",
  erpfinance: "erp_finance",
  "erp-finance": "erp_finance",
  procurement: "erp_procurement",
  erpprocurement: "erp_procurement",
  "erp-procurement": "erp_procurement",
  sales: "erp_sales",
  crm: "erp_sales",
  salescrm: "erp_sales",
  sales_crm: "erp_sales",
  "sales-crm": "erp_sales",
  erpsales: "erp_sales",
  "erp-sales": "erp_sales",
  inventory: "erp_inventory",
  erpinventory: "erp_inventory",
  "erp-inventory": "erp_inventory",
  admin: "platform",
  adminconsole: "platform",
  admin_console: "platform",
  "admin-console": "platform",
};

export function resolveModuleNavigationKey(moduleKey: string): string {
  const raw = (moduleKey || "").trim();
  if (!raw) return raw;

  if (moduleMap[raw]) return raw;

  const normalized = raw.toLowerCase();
  if (moduleMap[normalized]) return normalized;

  const compact = normalized.replace(/[^a-z0-9_]/g, "");
  const aliased = MODULE_KEY_ALIASES[normalized] || MODULE_KEY_ALIASES[compact] || raw;

  return moduleMap[aliased] ? aliased : aliased;
}

/**
 * Pages that have a physical page.tsx implementation.
 * Links whose path is not in this set will be hidden from the sidebar.
 * Update this set whenever a new page is added.
 */
export const IMPLEMENTED_PAGES = new Set<string>([
  // ERP shared
  ROUTES.DASHBOARD,
  ROUTES.APPROVALS,
  ROUTES.NOTIFICATIONS,
  ROUTES.DOCUMENTS,
  // HRMS
  ROUTES.HRMS_HOME,
  ROUTES.EMPLOYEES,
  ROUTES.CERTIFICATES,
  ROUTES.HR_ASSETS,
  ROUTES.ATTENDANCE,
  ROUTES.SHIFTS,
  ROUTES.OVERTIME,
  ROUTES.LEAVE,
  ROUTES.RECRUITMENT,
  ROUTES.SCREENING_SCHEDULE,
  ROUTES.SCREENING_RESULTS,
  ROUTES.TRAINING,
  ROUTES.ASSESSMENTS,
  ROUTES.PERFORMANCE,
  ROUTES.HR_PAYROLL,
  // Payroll
  ROUTES.PAYROLL_HOME,
  ROUTES.PAYROLL_RUNS,
  ROUTES.PAYROLL_PAYSLIPS,
  ROUTES.PAYROLL_STRUCTURES,
  ROUTES.PAYROLL_COMPONENTS,
  ROUTES.PAYROLL_STATUTORY,
  // Reports
  ROUTES.REPORTS_HOME,
  ROUTES.REPORTS_HR,
  ROUTES.REPORTS_PAYROLL,
  ROUTES.REPORTS_COMPLIANCE,
  // Platform (Admin Console)
  ROUTES.PLATFORM_HOME,
  ROUTES.PLATFORM_COMPANIES,
  ROUTES.PLATFORM_TENANTS,
  ROUTES.PLATFORM_PROJECTS,
  ROUTES.PLATFORM_USERS,
  ROUTES.PLATFORM_ROLES,
  ROUTES.PLATFORM_PERMISSIONS,
  ROUTES.PLATFORM_MODULE_MAPPING,
  ROUTES.PLATFORM_SCHEMA_MANAGER,
  ROUTES.PLATFORM_SETTINGS,
  ROUTES.PLATFORM_FEATURE_FLAGS,
  ROUTES.PLATFORM_RECYCLE_BIN,
  ROUTES.AUDIT_LOGS,
  ROUTES.PLATFORM_CONTACT_SUBMISSIONS,
  ROUTES.PLATFORM_WEBSITE_PAGES,
  ROUTES.PLATFORM_WEBSITE_TEMPLATES,
  ROUTES.PLATFORM_WEBSITE_THEMES,
  ROUTES.PLATFORM_WEBSITE_SETTINGS,
  // Finance
  ROUTES.CHART_OF_ACCOUNTS,
  ROUTES.JOURNAL_ENTRIES,
  ROUTES.PAYMENTS,
  // Procurement
  ROUTES.VENDORS,
  ROUTES.PURCHASE_ORDERS,
  // Sales
  ROUTES.CUSTOMERS,
  ROUTES.SALES_ORDERS,
  // Inventory
  ROUTES.ITEMS,
  ROUTES.WAREHOUSES,
  ROUTES.STOCK_MOVEMENTS,
  // Licensing
  ROUTES.LICENSING_HOME,
  ROUTES.LICENSING_CATALOG,
  ROUTES.LICENSING_SUBSCRIPTIONS,
  ROUTES.LICENSING_INTEGRATIONS,
  // Security
  ROUTES.SECURITY_HOME,
  ROUTES.SECURITY_SESSIONS,
  ROUTES.SECURITY_MFA,
  ROUTES.SECURITY_DEVICES,
  ROUTES.SECURITY_PASSWORD_POLICIES,
  // HRMS Lifecycle
  ROUTES.ONBOARDING,
  ROUTES.OFFBOARDING,
  ROUTES.PROBATION,
  // Payroll extras
  ROUTES.PAYROLL_BONUS,
  ROUTES.PAYROLL_ARREARS,
  ROUTES.PAYROLL_LOANS,
  ROUTES.PAYROLL_REIMBURSEMENTS,
  ROUTES.PAYROLL_FINAL_SETTLEMENT,
  ROUTES.PAYROLL_TAX_DECLARATIONS,
  // Reports extras
  ROUTES.REPORTS_ERP,
  ROUTES.REPORTS_FINANCIAL,
  ROUTES.REPORTS_CUSTOM,
  // Finance extras
  ROUTES.INVOICES,
  ROUTES.EXPENSES,
  ROUTES.TAX_MANAGEMENT,
  ROUTES.BANK_RECONCILIATION,
  // Procurement extras
  ROUTES.PURCHASE_REQUESTS,
  ROUTES.GRN,
  // Sales extras
  ROUTES.QUOTATIONS,
  ROUTES.RETURNS,
  // Inventory extras
  ROUTES.INVENTORY_ADJUSTMENTS,
  ROUTES.INVENTORY_TRANSFERS,
  // Licensing extras
  ROUTES.LICENSING_BILLING_HISTORY,
  ROUTES.LICENSING_USAGE,
  // Security extras
  ROUTES.SECURITY_SSO,
  ROUTES.SECURITY_IP_RESTRICTIONS,
  ROUTES.SECURITY_ACCESS_LOGS,
  // Platform extras
  ROUTES.PLATFORM_SYSTEM_HEALTH,
  ROUTES.PLATFORM_WORKFLOW_CONFIG,
  ROUTES.PLATFORM_NOTIFICATION_TEMPLATES,
  // Integrations
  ROUTES.INTEGRATIONS_HOME,
  ROUTES.INTEGRATIONS_API_KEYS,
  ROUTES.INTEGRATIONS_WEBHOOKS,
  ROUTES.INTEGRATIONS_APPS,
  ROUTES.INTEGRATIONS_LOGS,
  // Helpdesk
  ROUTES.HELPDESK_HOME,
  ROUTES.HELPDESK_TICKETS,
  ROUTES.HELPDESK_ESCALATIONS,
  ROUTES.HELPDESK_FAQ,
  // Communication
  ROUTES.COMMUNICATION_HOME,
  ROUTES.COMMUNICATION_ANNOUNCEMENTS,
  ROUTES.COMMUNICATION_EMAIL_TEMPLATES,
  ROUTES.COMMUNICATION_SMS_TEMPLATES,
]);

export function getSubModulesForModule(moduleKey: string): SubModuleLink[] {
  const links = moduleMap[resolveModuleNavigationKey(moduleKey)] || [];
  return links.filter((link) => IMPLEMENTED_PAGES.has(link.path));
}

export default moduleMap;
