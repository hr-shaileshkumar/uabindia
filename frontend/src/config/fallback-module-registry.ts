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

export type FallbackModuleMeta = {
  key: ModuleKey;
  label: string;
  icon: string;
  description: string;
  homeHref: string;
};

export type FallbackPageDefinition = {
  key: string;
  name: string;
  path: string;
  icon?: string;
  group?: string;
  moduleKey: ModuleKey;
  permissions: string[];
};

export const FALLBACK_MODULE_META: FallbackModuleMeta[] = [
  { key: "platform", label: "Admin Console", icon: "settings", description: "Governance, roles, users, settings, and platform operations.", homeHref: ROUTES.PLATFORM_HOME },
  { key: "operations", label: "Workspace", icon: "module-operations", description: "Shared workspace dashboard, approvals, notifications, and documents.", homeHref: ROUTES.DASHBOARD },
  { key: "erp_finance", label: "Finance", icon: "payroll", description: "Chart of accounts, journals, payments, invoices, expenses, and tax.", homeHref: ROUTES.CHART_OF_ACCOUNTS },
  { key: "erp_procurement", label: "Procurement", icon: "box", description: "Vendors, purchase requests, purchase orders, and goods receipt.", homeHref: ROUTES.VENDORS },
  { key: "erp_sales", label: "Sales & CRM", icon: "users", description: "Customers, quotations, sales orders, and returns.", homeHref: ROUTES.CUSTOMERS },
  { key: "erp_inventory", label: "Inventory", icon: "box", description: "Items, warehouses, stock movements, adjustments, and transfers.", homeHref: ROUTES.ITEMS },
  { key: "hrms", label: "HRMS", icon: "employees", description: "People operations, attendance, leave, recruitment, and performance.", homeHref: ROUTES.HRMS_HOME },
  { key: "payroll", label: "Payroll", icon: "payroll", description: "Salary runs, statutory, components, structures, and payslips.", homeHref: ROUTES.PAYROLL_HOME },
  { key: "reports", label: "Analytics & Reports", icon: "file", description: "Cross-module analytics and reporting for HR, payroll, finance, compliance, and business operations.", homeHref: ROUTES.REPORTS_HOME },
  { key: "licensing", label: "Licensing", icon: "box", description: "Catalog, subscriptions, billing, and integrations.", homeHref: ROUTES.LICENSING_HOME },
  { key: "security", label: "Security", icon: "shield", description: "Sessions, MFA, SSO, devices, and password governance.", homeHref: ROUTES.SECURITY_HOME },
  { key: "integrations", label: "Integrations", icon: "settings", description: "API keys, webhooks, third-party apps, and integration logs.", homeHref: ROUTES.INTEGRATIONS_HOME },
  { key: "helpdesk", label: "Helpdesk", icon: "employees", description: "Support tickets, escalations, and FAQs.", homeHref: ROUTES.HELPDESK_HOME },
  { key: "communication", label: "Communication", icon: "bell", description: "Announcements, email/SMS templates, and push notifications.", homeHref: ROUTES.COMMUNICATION_HOME },
];

export const FALLBACK_PAGE_DEFINITIONS: FallbackPageDefinition[] = [
  { key: "admin-home", name: "Admin Overview", path: ROUTES.PLATFORM_HOME, icon: "dashboard", group: "Overview", moduleKey: "platform", permissions: [PERMISSIONS.PLATFORM_VIEW] },
  { key: "admin-companies", name: "Companies", path: ROUTES.PLATFORM_COMPANIES, icon: "building", group: "Tenant Management", moduleKey: "platform", permissions: [PERMISSIONS.PLATFORM_COMPANIES_VIEW] },
  { key: "admin-tenants", name: "Tenants", path: ROUTES.PLATFORM_TENANTS, icon: "layers", group: "Tenant Management", moduleKey: "platform", permissions: [PERMISSIONS.PLATFORM_TENANTS_VIEW] },
  { key: "admin-projects", name: "Projects", path: ROUTES.PLATFORM_PROJECTS, icon: "folder", group: "Tenant Management", moduleKey: "platform", permissions: [PERMISSIONS.PLATFORM_PROJECTS_VIEW] },
  { key: "admin-users", name: "Users", path: ROUTES.PLATFORM_USERS, icon: "users", group: "Access Control", moduleKey: "platform", permissions: [PERMISSIONS.PLATFORM_USERS_VIEW] },
  { key: "admin-roles", name: "Roles", path: ROUTES.PLATFORM_ROLES, icon: "shield", group: "Access Control", moduleKey: "platform", permissions: [PERMISSIONS.PLATFORM_ROLES_VIEW] },
  { key: "admin-permissions", name: "Permissions", path: ROUTES.PLATFORM_PERMISSIONS, icon: "key", group: "Access Control", moduleKey: "platform", permissions: [PERMISSIONS.PLATFORM_PERMISSIONS_VIEW] },
  { key: "admin-module-mapping", name: "Module Mapping", path: ROUTES.PLATFORM_MODULE_MAPPING, icon: "grid", group: "Access Control", moduleKey: "platform", permissions: [PERMISSIONS.PLATFORM_SETTINGS_VIEW] },
  { key: "admin-schema-manager", name: "Schema Manager", path: ROUTES.PLATFORM_SCHEMA_MANAGER, icon: "database", group: "Configuration", moduleKey: "platform", permissions: [PERMISSIONS.PLATFORM_SCHEMA_MANAGER_VIEW] },
  { key: "admin-settings", name: "Settings", path: ROUTES.PLATFORM_SETTINGS, icon: "settings", group: "Configuration", moduleKey: "platform", permissions: [PERMISSIONS.PLATFORM_SETTINGS_VIEW] },
  { key: "admin-feature-flags", name: "Feature Flags", path: ROUTES.PLATFORM_FEATURE_FLAGS, icon: "flag", group: "Configuration", moduleKey: "platform", permissions: [PERMISSIONS.PLATFORM_FEATURE_FLAGS_VIEW] },
  { key: "admin-workflow-config", name: "Workflow Config", path: ROUTES.PLATFORM_WORKFLOW_CONFIG, icon: "workflow", group: "Configuration", moduleKey: "platform", permissions: [PERMISSIONS.PLATFORM_SETTINGS_VIEW] },
  { key: "admin-notification-templates", name: "Notification Templates", path: ROUTES.PLATFORM_NOTIFICATION_TEMPLATES, icon: "bell", group: "Configuration", moduleKey: "platform", permissions: [PERMISSIONS.PLATFORM_SETTINGS_VIEW] },
  { key: "admin-website-pages", name: "Website Pages", path: ROUTES.PLATFORM_WEBSITE_PAGES, icon: "file-text", group: "Website & Branding", moduleKey: "platform", permissions: [PERMISSIONS.PLATFORM_WEBSITE_PAGES_VIEW] },
  { key: "admin-website-templates", name: "Page Templates", path: ROUTES.PLATFORM_WEBSITE_TEMPLATES, icon: "layout", group: "Website & Branding", moduleKey: "platform", permissions: [PERMISSIONS.PLATFORM_WEBSITE_TEMPLATES_VIEW] },
  { key: "admin-website-themes", name: "Themes", path: ROUTES.PLATFORM_WEBSITE_THEMES, icon: "palette", group: "Website & Branding", moduleKey: "platform", permissions: [PERMISSIONS.PLATFORM_WEBSITE_THEMES_VIEW] },
  { key: "admin-website-settings", name: "Website Settings", path: ROUTES.PLATFORM_WEBSITE_SETTINGS, icon: "settings", group: "Website & Branding", moduleKey: "platform", permissions: [PERMISSIONS.PLATFORM_WEBSITE_SETTINGS_VIEW] },
  { key: "admin-system-health", name: "System Health", path: ROUTES.PLATFORM_SYSTEM_HEALTH, icon: "activity", group: "Monitoring", moduleKey: "platform", permissions: [PERMISSIONS.PLATFORM_VIEW] },
  { key: "admin-audit", name: "Audit Logs", path: ROUTES.AUDIT_LOGS, icon: "clipboard", group: "Monitoring", moduleKey: "platform", permissions: [PERMISSIONS.AUDIT_VIEW] },
  { key: "admin-contact", name: "Contact Submissions", path: ROUTES.PLATFORM_CONTACT_SUBMISSIONS, icon: "mail", group: "Monitoring", moduleKey: "platform", permissions: [PERMISSIONS.PLATFORM_CONTACT_SUBMISSIONS_VIEW] },
  { key: "admin-recycle-bin", name: "Recycle Bin", path: ROUTES.PLATFORM_RECYCLE_BIN, icon: "trash", group: "Monitoring", moduleKey: "platform", permissions: [PERMISSIONS.PLATFORM_VIEW] },

  { key: "erp-dashboard", name: "Dashboard", path: ROUTES.DASHBOARD, icon: "dashboard", group: "Overview", moduleKey: "operations", permissions: [PERMISSIONS.DASHBOARD_VIEW] },
  { key: "erp-approvals", name: "Approvals", path: ROUTES.APPROVALS, icon: "check-circle", group: "Overview", moduleKey: "operations", permissions: [PERMISSIONS.APPROVALS_VIEW] },
  { key: "erp-notifications", name: "Notifications", path: ROUTES.NOTIFICATIONS, icon: "bell", group: "Overview", moduleKey: "operations", permissions: [PERMISSIONS.NOTIFICATIONS_VIEW] },
  { key: "erp-documents", name: "Documents", path: ROUTES.DOCUMENTS, icon: "document", group: "Overview", moduleKey: "operations", permissions: [PERMISSIONS.DOCUMENTS_VIEW] },

  { key: "fin-home", name: "Finance Overview", path: ROUTES.CHART_OF_ACCOUNTS, icon: "dashboard", group: "Overview", moduleKey: "erp_finance", permissions: [PERMISSIONS.CHART_OF_ACCOUNTS_VIEW] },
  { key: "fin-chart-of-accounts", name: "Chart of Accounts", path: ROUTES.CHART_OF_ACCOUNTS, icon: "layers", group: "Accounting", moduleKey: "erp_finance", permissions: [PERMISSIONS.CHART_OF_ACCOUNTS_VIEW] },
  { key: "fin-journal-entries", name: "Journal Entries", path: ROUTES.JOURNAL_ENTRIES, icon: "journal", group: "Accounting", moduleKey: "erp_finance", permissions: [PERMISSIONS.JOURNAL_ENTRIES_VIEW] },
  { key: "fin-payments", name: "Payments", path: ROUTES.PAYMENTS, icon: "credit-card", group: "Transactions", moduleKey: "erp_finance", permissions: [PERMISSIONS.PAYMENTS_VIEW] },
  { key: "fin-invoices", name: "Invoices", path: ROUTES.INVOICES, icon: "receipt", group: "Transactions", moduleKey: "erp_finance", permissions: [PERMISSIONS.PAYMENTS_VIEW] },
  { key: "fin-expenses", name: "Expenses", path: ROUTES.EXPENSES, icon: "wallet", group: "Transactions", moduleKey: "erp_finance", permissions: [PERMISSIONS.PAYMENTS_VIEW] },
  { key: "fin-tax-management", name: "Tax Management", path: ROUTES.TAX_MANAGEMENT, icon: "calculator", group: "Compliance", moduleKey: "erp_finance", permissions: [PERMISSIONS.CHART_OF_ACCOUNTS_VIEW] },
  { key: "fin-bank-reconciliation", name: "Bank Reconciliation", path: ROUTES.BANK_RECONCILIATION, icon: "bank", group: "Compliance", moduleKey: "erp_finance", permissions: [PERMISSIONS.PAYMENTS_VIEW] },

  { key: "proc-home", name: "Procurement Overview", path: ROUTES.VENDORS, icon: "dashboard", group: "Overview", moduleKey: "erp_procurement", permissions: [PERMISSIONS.VENDOR_VIEW] },
  { key: "proc-vendors", name: "Vendors", path: ROUTES.VENDORS, icon: "truck", group: "Suppliers", moduleKey: "erp_procurement", permissions: [PERMISSIONS.VENDOR_VIEW] },
  { key: "proc-purchase-requests", name: "Purchase Requests", path: ROUTES.PURCHASE_REQUESTS, icon: "shopping-cart", group: "Ordering", moduleKey: "erp_procurement", permissions: [PERMISSIONS.PURCHASE_ORDERS_VIEW] },
  { key: "proc-purchase-orders", name: "Purchase Orders", path: ROUTES.PURCHASE_ORDERS, icon: "clipboard", group: "Ordering", moduleKey: "erp_procurement", permissions: [PERMISSIONS.PURCHASE_ORDERS_VIEW] },
  { key: "proc-grn", name: "Goods Receipt (GRN)", path: ROUTES.GRN, icon: "box", group: "Receiving", moduleKey: "erp_procurement", permissions: [PERMISSIONS.PURCHASE_ORDERS_VIEW] },

  { key: "sales-home", name: "Sales Overview", path: ROUTES.CUSTOMERS, icon: "dashboard", group: "Overview", moduleKey: "erp_sales", permissions: [PERMISSIONS.CUSTOMER_VIEW] },
  { key: "sales-customers", name: "Customers", path: ROUTES.CUSTOMERS, icon: "users", group: "CRM", moduleKey: "erp_sales", permissions: [PERMISSIONS.CUSTOMER_VIEW] },
  { key: "sales-quotations", name: "Quotations", path: ROUTES.QUOTATIONS, icon: "file-text", group: "Sales Process", moduleKey: "erp_sales", permissions: [PERMISSIONS.SALES_ORDERS_VIEW] },
  { key: "sales-orders", name: "Sales Orders", path: ROUTES.SALES_ORDERS, icon: "shopping-bag", group: "Sales Process", moduleKey: "erp_sales", permissions: [PERMISSIONS.SALES_ORDERS_VIEW] },
  { key: "sales-returns", name: "Returns", path: ROUTES.RETURNS, icon: "rotate-ccw", group: "Sales Process", moduleKey: "erp_sales", permissions: [PERMISSIONS.SALES_ORDERS_VIEW] },

  { key: "inv-home", name: "Inventory Overview", path: ROUTES.ITEMS, icon: "dashboard", group: "Overview", moduleKey: "erp_inventory", permissions: [PERMISSIONS.ITEM_VIEW] },
  { key: "inv-items", name: "Items", path: ROUTES.ITEMS, icon: "box", group: "Catalogue", moduleKey: "erp_inventory", permissions: [PERMISSIONS.ITEM_VIEW] },
  { key: "inv-warehouses", name: "Warehouses", path: ROUTES.WAREHOUSES, icon: "warehouse", group: "Locations", moduleKey: "erp_inventory", permissions: [PERMISSIONS.WAREHOUSES_VIEW] },
  { key: "inv-stock-movement", name: "Stock Movements", path: ROUTES.STOCK_MOVEMENTS, icon: "trending-up", group: "Transactions", moduleKey: "erp_inventory", permissions: [PERMISSIONS.STOCK_MOVEMENTS_VIEW] },
  { key: "inv-adjustments", name: "Inventory Adjustments", path: ROUTES.INVENTORY_ADJUSTMENTS, icon: "sliders", group: "Transactions", moduleKey: "erp_inventory", permissions: [PERMISSIONS.STOCK_MOVEMENTS_VIEW] },
  { key: "inv-transfers", name: "Inventory Transfers", path: ROUTES.INVENTORY_TRANSFERS, icon: "arrow-right-left", group: "Transactions", moduleKey: "erp_inventory", permissions: [PERMISSIONS.STOCK_MOVEMENTS_VIEW] },

  { key: "hrms-dashboard", name: "HR Dashboard", path: ROUTES.HRMS_HOME, icon: "dashboard", group: "Core HR", moduleKey: "hrms", permissions: [PERMISSIONS.HRMS_VIEW] },
  { key: "employees", name: "Employees", path: ROUTES.EMPLOYEES, icon: "employees", group: "Core HR", moduleKey: "hrms", permissions: [PERMISSIONS.EMPLOYEE_VIEW] },
  { key: "certificates", name: "Certificates", path: ROUTES.CERTIFICATES, icon: "award", group: "Core HR", moduleKey: "hrms", permissions: [PERMISSIONS.CERTIFICATES_VIEW] },
  { key: "assets", name: "Assets", path: ROUTES.HR_ASSETS, icon: "monitor", group: "Core HR", moduleKey: "hrms", permissions: [PERMISSIONS.HR_ASSETS_VIEW] },
  { key: "onboarding", name: "Onboarding", path: ROUTES.ONBOARDING, icon: "user-plus", group: "Employee Lifecycle", moduleKey: "hrms", permissions: [PERMISSIONS.EMPLOYEE_VIEW] },
  { key: "offboarding", name: "Offboarding", path: ROUTES.OFFBOARDING, icon: "user-minus", group: "Employee Lifecycle", moduleKey: "hrms", permissions: [PERMISSIONS.EMPLOYEE_VIEW] },
  { key: "probation", name: "Probation", path: ROUTES.PROBATION, icon: "hourglass", group: "Employee Lifecycle", moduleKey: "hrms", permissions: [PERMISSIONS.EMPLOYEE_VIEW] },
  { key: "attendance", name: "Attendance", path: ROUTES.ATTENDANCE, icon: "attendance", group: "Attendance & Time", moduleKey: "hrms", permissions: [PERMISSIONS.ATTENDANCE_VIEW] },
  { key: "shifts", name: "Shifts", path: ROUTES.SHIFTS, icon: "clock", group: "Attendance & Time", moduleKey: "hrms", permissions: [PERMISSIONS.SHIFTS_VIEW] },
  { key: "overtime", name: "Overtime", path: ROUTES.OVERTIME, icon: "timer", group: "Attendance & Time", moduleKey: "hrms", permissions: [PERMISSIONS.OVERTIME_VIEW] },
  { key: "leave-management", name: "Leave", path: ROUTES.LEAVE, icon: "leave", group: "Attendance & Time", moduleKey: "hrms", permissions: [PERMISSIONS.LEAVE_VIEW] },
  { key: "recruitment", name: "Recruitment", path: ROUTES.RECRUITMENT, icon: "search", group: "Talent Acquisition", moduleKey: "hrms", permissions: [PERMISSIONS.RECRUITMENT_VIEW] },
  { key: "screening-schedule", name: "Screening Schedule", path: ROUTES.SCREENING_SCHEDULE, icon: "calendar-check", group: "Talent Acquisition", moduleKey: "hrms", permissions: [PERMISSIONS.SCREENING_SCHEDULE_VIEW] },
  { key: "screening-results", name: "Screening Results", path: ROUTES.SCREENING_RESULTS, icon: "bar-chart", group: "Talent Acquisition", moduleKey: "hrms", permissions: [PERMISSIONS.SCREENING_RESULTS_VIEW] },
  { key: "training", name: "Training & Learning", path: ROUTES.TRAINING, icon: "training", group: "Learning & Development", moduleKey: "hrms", permissions: [PERMISSIONS.TRAINING_VIEW] },
  { key: "assessments", name: "Assessments", path: ROUTES.ASSESSMENTS, icon: "clipboard-check", group: "Learning & Development", moduleKey: "hrms", permissions: [PERMISSIONS.ASSESSMENTS_VIEW] },
  { key: "performance", name: "Performance", path: ROUTES.PERFORMANCE, icon: "trending-up", group: "Performance", moduleKey: "hrms", permissions: [PERMISSIONS.PERFORMANCE_VIEW] },
  { key: "hr-payroll", name: "HR Payroll", path: ROUTES.HR_PAYROLL, icon: "payroll", group: "HR Operations", moduleKey: "hrms", permissions: [PERMISSIONS.HR_PAYROLL_VIEW] },

  { key: "payroll-dashboard", name: "Payroll Dashboard", path: ROUTES.PAYROLL_HOME, icon: "dashboard", group: "Overview", moduleKey: "payroll", permissions: [PERMISSIONS.PAYROLL_VIEW] },
  { key: "payroll-runs", name: "Payroll Runs", path: ROUTES.PAYROLL_RUNS, icon: "play-circle", group: "Processing", moduleKey: "payroll", permissions: [PERMISSIONS.PAYROLL_RUNS_VIEW] },
  { key: "payroll-payslips", name: "Payslips", path: ROUTES.PAYROLL_PAYSLIPS, icon: "file-text", group: "Processing", moduleKey: "payroll", permissions: [PERMISSIONS.PAYROLL_PAYSLIPS_VIEW] },
  { key: "payroll-bonus", name: "Bonus & Incentives", path: ROUTES.PAYROLL_BONUS, icon: "gift", group: "Processing", moduleKey: "payroll", permissions: [PERMISSIONS.PAYROLL_RUNS_VIEW] },
  { key: "payroll-arrears", name: "Arrears", path: ROUTES.PAYROLL_ARREARS, icon: "clock", group: "Processing", moduleKey: "payroll", permissions: [PERMISSIONS.PAYROLL_RUNS_VIEW] },
  { key: "payroll-structures", name: "Structures", path: ROUTES.PAYROLL_STRUCTURES, icon: "layers", group: "Setup", moduleKey: "payroll", permissions: [PERMISSIONS.PAYROLL_STRUCTURES_VIEW] },
  { key: "payroll-components", name: "Components", path: ROUTES.PAYROLL_COMPONENTS, icon: "puzzle", group: "Setup", moduleKey: "payroll", permissions: [PERMISSIONS.PAYROLL_COMPONENTS_VIEW] },
  { key: "payroll-loans", name: "Loan Management", path: ROUTES.PAYROLL_LOANS, icon: "credit-card", group: "Setup", moduleKey: "payroll", permissions: [PERMISSIONS.PAYROLL_VIEW] },
  { key: "payroll-reimbursements", name: "Reimbursements", path: ROUTES.PAYROLL_REIMBURSEMENTS, icon: "receipt", group: "Setup", moduleKey: "payroll", permissions: [PERMISSIONS.PAYROLL_VIEW] },
  { key: "payroll-statutory", name: "Statutory", path: ROUTES.PAYROLL_STATUTORY, icon: "shield", group: "Compliance", moduleKey: "payroll", permissions: [PERMISSIONS.PAYROLL_STATUTORY_VIEW] },
  { key: "payroll-final-settlement", name: "Final Settlement", path: ROUTES.PAYROLL_FINAL_SETTLEMENT, icon: "clipboard-check", group: "Compliance", moduleKey: "payroll", permissions: [PERMISSIONS.PAYROLL_VIEW] },
  { key: "payroll-tax-declarations", name: "Tax Declarations", path: ROUTES.PAYROLL_TAX_DECLARATIONS, icon: "calculator", group: "Compliance", moduleKey: "payroll", permissions: [PERMISSIONS.PAYROLL_VIEW] },

  { key: "reports-home", name: "Reports Home", path: ROUTES.REPORTS_HOME, icon: "dashboard", group: "Overview", moduleKey: "reports", permissions: [PERMISSIONS.REPORTS_VIEW] },
  { key: "reports-hr", name: "HR Reports", path: ROUTES.REPORTS_HR, icon: "employees", group: "HR", moduleKey: "reports", permissions: [PERMISSIONS.REPORTS_HR_VIEW] },
  { key: "reports-payroll", name: "Payroll Reports", path: ROUTES.REPORTS_PAYROLL, icon: "payroll", group: "Payroll", moduleKey: "reports", permissions: [PERMISSIONS.REPORTS_PAYROLL_VIEW] },
  { key: "reports-compliance", name: "Compliance Reports", path: ROUTES.REPORTS_COMPLIANCE, icon: "shield", group: "Compliance", moduleKey: "reports", permissions: [PERMISSIONS.REPORTS_COMPLIANCE_VIEW] },
  { key: "reports-erp", name: "Business Operations Reports", path: ROUTES.REPORTS_ERP, icon: "briefcase", group: "Business Operations", moduleKey: "reports", permissions: [PERMISSIONS.REPORTS_VIEW] },
  { key: "reports-financial", name: "Financial Reports", path: ROUTES.REPORTS_FINANCIAL, icon: "trending-up", group: "Finance", moduleKey: "reports", permissions: [PERMISSIONS.REPORTS_VIEW] },
  { key: "reports-custom", name: "Custom Reports", path: ROUTES.REPORTS_CUSTOM, icon: "sliders", group: "Advanced", moduleKey: "reports", permissions: [PERMISSIONS.REPORTS_VIEW] },

  { key: "licensing-home", name: "Overview", path: ROUTES.LICENSING_HOME, icon: "dashboard", group: "Overview", moduleKey: "licensing", permissions: [PERMISSIONS.LICENSING_VIEW] },
  { key: "licensing-catalog", name: "Module Catalog", path: ROUTES.LICENSING_CATALOG, icon: "grid", group: "Product", moduleKey: "licensing", permissions: [PERMISSIONS.LICENSING_CATALOG_VIEW] },
  { key: "licensing-subscriptions", name: "Subscriptions", path: ROUTES.LICENSING_SUBSCRIPTIONS, icon: "layers", group: "Product", moduleKey: "licensing", permissions: [PERMISSIONS.LICENSING_SUBSCRIPTIONS_VIEW] },
  { key: "licensing-billing", name: "Billing History", path: ROUTES.LICENSING_BILLING_HISTORY, icon: "credit-card", group: "Billing", moduleKey: "licensing", permissions: [PERMISSIONS.LICENSING_VIEW] },
  { key: "licensing-usage", name: "Usage Analytics", path: ROUTES.LICENSING_USAGE, icon: "bar-chart", group: "Billing", moduleKey: "licensing", permissions: [PERMISSIONS.LICENSING_VIEW] },
  { key: "licensing-integrations", name: "Integrations", path: ROUTES.LICENSING_INTEGRATIONS, icon: "plug", group: "Connect", moduleKey: "licensing", permissions: [PERMISSIONS.LICENSING_INTEGRATIONS_VIEW] },

  { key: "security-home", name: "Security Overview", path: ROUTES.SECURITY_HOME, icon: "shield", group: "Overview", moduleKey: "security", permissions: [PERMISSIONS.SECURITY_VIEW] },
  { key: "security-mfa", name: "MFA", path: ROUTES.SECURITY_MFA, icon: "smartphone", group: "Authentication", moduleKey: "security", permissions: [PERMISSIONS.SECURITY_MFA_VIEW] },
  { key: "security-sso", name: "SSO", path: ROUTES.SECURITY_SSO, icon: "key", group: "Authentication", moduleKey: "security", permissions: [PERMISSIONS.SECURITY_VIEW] },
  { key: "security-devices", name: "Devices", path: ROUTES.SECURITY_DEVICES, icon: "monitor", group: "Devices", moduleKey: "security", permissions: [PERMISSIONS.SECURITY_DEVICES_VIEW] },
  { key: "security-sessions", name: "Sessions", path: ROUTES.SECURITY_SESSIONS, icon: "activity", group: "Sessions", moduleKey: "security", permissions: [PERMISSIONS.SECURITY_SESSIONS_VIEW] },
  { key: "security-access-logs", name: "Access Logs", path: ROUTES.SECURITY_ACCESS_LOGS, icon: "file-text", group: "Sessions", moduleKey: "security", permissions: [PERMISSIONS.AUDIT_VIEW] },
  { key: "security-password", name: "Password Policies", path: ROUTES.SECURITY_PASSWORD_POLICIES, icon: "lock", group: "Policies", moduleKey: "security", permissions: [PERMISSIONS.SECURITY_PASSWORD_POLICIES_VIEW] },
  { key: "security-ip-restrictions", name: "IP Restrictions", path: ROUTES.SECURITY_IP_RESTRICTIONS, icon: "globe", group: "Policies", moduleKey: "security", permissions: [PERMISSIONS.SECURITY_VIEW] },

  { key: "integrations-home", name: "Overview", path: ROUTES.INTEGRATIONS_HOME, icon: "dashboard", group: "Overview", moduleKey: "integrations", permissions: [PERMISSIONS.LICENSING_VIEW] },
  { key: "integrations-api-keys", name: "API Keys", path: ROUTES.INTEGRATIONS_API_KEYS, icon: "key", group: "Developer", moduleKey: "integrations", permissions: [PERMISSIONS.LICENSING_VIEW] },
  { key: "integrations-webhooks", name: "Webhooks", path: ROUTES.INTEGRATIONS_WEBHOOKS, icon: "webhook", group: "Developer", moduleKey: "integrations", permissions: [PERMISSIONS.LICENSING_VIEW] },
  { key: "integrations-apps", name: "Third-Party Apps", path: ROUTES.INTEGRATIONS_APPS, icon: "plug", group: "Connect", moduleKey: "integrations", permissions: [PERMISSIONS.LICENSING_VIEW] },
  { key: "integrations-logs", name: "Integration Logs", path: ROUTES.INTEGRATIONS_LOGS, icon: "activity", group: "Monitoring", moduleKey: "integrations", permissions: [PERMISSIONS.AUDIT_VIEW] },

  { key: "helpdesk-home", name: "Helpdesk Overview", path: ROUTES.HELPDESK_HOME, icon: "dashboard", group: "Overview", moduleKey: "helpdesk", permissions: [PERMISSIONS.PLATFORM_VIEW] },
  { key: "helpdesk-tickets", name: "Tickets", path: ROUTES.HELPDESK_TICKETS, icon: "ticket", group: "Support", moduleKey: "helpdesk", permissions: [PERMISSIONS.PLATFORM_VIEW] },
  { key: "helpdesk-escalations", name: "Escalations", path: ROUTES.HELPDESK_ESCALATIONS, icon: "alert-triangle", group: "Support", moduleKey: "helpdesk", permissions: [PERMISSIONS.PLATFORM_VIEW] },
  { key: "helpdesk-faq", name: "FAQs", path: ROUTES.HELPDESK_FAQ, icon: "help-circle", group: "Support", moduleKey: "helpdesk", permissions: [PERMISSIONS.PLATFORM_VIEW] },

  { key: "communication-home", name: "Communication Overview", path: ROUTES.COMMUNICATION_HOME, icon: "dashboard", group: "Overview", moduleKey: "communication", permissions: [PERMISSIONS.PLATFORM_VIEW] },
  { key: "communication-announcements", name: "Announcements", path: ROUTES.COMMUNICATION_ANNOUNCEMENTS, icon: "megaphone", group: "Messaging", moduleKey: "communication", permissions: [PERMISSIONS.PLATFORM_VIEW] },
  { key: "communication-email", name: "Email Templates", path: ROUTES.COMMUNICATION_EMAIL_TEMPLATES, icon: "mail", group: "Templates", moduleKey: "communication", permissions: [PERMISSIONS.PLATFORM_SETTINGS_VIEW] },
  { key: "communication-sms", name: "SMS Templates", path: ROUTES.COMMUNICATION_SMS_TEMPLATES, icon: "message-sq", group: "Templates", moduleKey: "communication", permissions: [PERMISSIONS.PLATFORM_SETTINGS_VIEW] },
];
