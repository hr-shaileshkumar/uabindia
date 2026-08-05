import { ROUTES } from "@/constants/routes";

export type FrontendPageDisplay =
  | "dashboard"
  | "directory"
  | "workflow"
  | "analytics"
  | "settings"
  | "detail"
  | "form"
  | "placeholder";

export type FrontendPageStatus = "implemented" | "partial" | "missing";

export type FrontendPageDefinition = {
  label: string;
  route: string;
  purpose: string;
  display: FrontendPageDisplay;
  status: FrontendPageStatus;
};

export type FrontendSubmoduleDefinition = {
  key: string;
  label: string;
  purpose: string;
  pages: FrontendPageDefinition[];
};

export type FrontendModuleDefinition = {
  key: string;
  label: string;
  homeRoute: string;
  purpose: string;
  moduleView: string;
  submodules: FrontendSubmoduleDefinition[];
  gaps?: string[];
};

export const FRONTEND_MODULE_MAP: FrontendModuleDefinition[] = [
  {
    key: "platform",
    label: "Platform",
    homeRoute: ROUTES.PLATFORM_HOME,
    purpose: "Tenant control center for governance, configuration, branding, security, and monitoring.",
    moduleView: "Module hub with platform submodules, quick actions, module info, and page directory.",
    submodules: [
      {
        key: "overview",
        label: "Overview",
        purpose: "Primary platform entry points and operational shortcuts.",
        pages: [
          {
            label: "Admin Overview",
            route: ROUTES.PLATFORM_HOME,
            purpose: "Module landing and summary workspace.",
            display: "dashboard",
            status: "implemented",
          },
        ],
      },
      {
        key: "tenant-management",
        label: "Tenant Management",
        purpose: "Manage legal entities, tenants, and projects.",
        pages: [
          { label: "Companies", route: ROUTES.PLATFORM_COMPANIES, purpose: "Manage company records and setup.", display: "directory", status: "implemented" },
          { label: "Tenants", route: ROUTES.PLATFORM_TENANTS, purpose: "Manage tenant registry and provisioning.", display: "directory", status: "implemented" },
          { label: "Projects", route: ROUTES.PLATFORM_PROJECTS, purpose: "Project registry for shared workspace context.", display: "directory", status: "implemented" },
        ],
      },
      {
        key: "access-control",
        label: "Access Control",
        purpose: "Manage users, roles, permissions, and navigation mapping.",
        pages: [
          { label: "Users", route: ROUTES.PLATFORM_USERS, purpose: "Manage platform users and account access.", display: "directory", status: "implemented" },
          { label: "Roles", route: ROUTES.PLATFORM_ROLES, purpose: "Manage role definitions.", display: "directory", status: "implemented" },
          { label: "Permissions", route: ROUTES.PLATFORM_PERMISSIONS, purpose: "Manage page and feature permissions.", display: "directory", status: "implemented" },
          { label: "Module Mapping", route: ROUTES.PLATFORM_MODULE_MAPPING, purpose: "Map modules, routes, and UI shell metadata.", display: "settings", status: "implemented" },
        ],
      },
      {
        key: "configuration",
        label: "Master & Configuration",
        purpose: "Run setup architecture, schema, settings, flags, workflow, and activation controls from one workspace.",
        pages: [
          { label: "Schema Manager", route: ROUTES.PLATFORM_SCHEMA_MANAGER, purpose: "Manage backend UI schema and route metadata.", display: "settings", status: "implemented" },
          { label: "Master & Configuration", route: ROUTES.PLATFORM_SETTINGS, purpose: "Drive setup architecture, dependency flow, and go-live readiness from one workspace.", display: "settings", status: "implemented" },
          { label: "Feature Flags", route: ROUTES.PLATFORM_FEATURE_FLAGS, purpose: "Enable or disable product capabilities.", display: "settings", status: "implemented" },
          { label: "Workflow Config", route: ROUTES.PLATFORM_WORKFLOW_CONFIG, purpose: "Configure approval and escalation flows.", display: "settings", status: "implemented" },
          { label: "Notification Templates", route: ROUTES.PLATFORM_NOTIFICATION_TEMPLATES, purpose: "Manage reusable system templates.", display: "settings", status: "implemented" },
        ],
      },
      {
        key: "website-branding",
        label: "Website & Branding",
        purpose: "Manage website pages, themes, templates, and website settings.",
        pages: [
          { label: "Website Pages", route: ROUTES.PLATFORM_WEBSITE_PAGES, purpose: "Manage public-facing website pages.", display: "directory", status: "implemented" },
          { label: "Website Templates", route: ROUTES.PLATFORM_WEBSITE_TEMPLATES, purpose: "Manage website templates.", display: "settings", status: "implemented" },
          { label: "Website Themes", route: ROUTES.PLATFORM_WEBSITE_THEMES, purpose: "Manage theme catalog and look-and-feel.", display: "settings", status: "implemented" },
          { label: "Website Settings", route: ROUTES.PLATFORM_WEBSITE_SETTINGS, purpose: "Manage website-level configuration.", display: "settings", status: "implemented" },
        ],
      },
      {
        key: "monitoring",
        label: "Monitoring",
        purpose: "Observe system health, submissions, recycle state, and audits.",
        pages: [
          { label: "System Health", route: ROUTES.PLATFORM_SYSTEM_HEALTH, purpose: "Track service and system status.", display: "analytics", status: "implemented" },
          { label: "Contact Submissions", route: ROUTES.PLATFORM_CONTACT_SUBMISSIONS, purpose: "Review inbound contact requests.", display: "directory", status: "implemented" },
          { label: "Recycle Bin", route: ROUTES.PLATFORM_RECYCLE_BIN, purpose: "Recover deleted platform records.", display: "directory", status: "implemented" },
          { label: "Audit Logs", route: ROUTES.AUDIT_LOGS, purpose: "Review audited system actions.", display: "analytics", status: "implemented" },
        ],
      },
    ],
  },
  {
    key: "administration",
    label: "Administration",
    homeRoute: ROUTES.ADMINISTRATION_HOME,
    purpose: "Shared workspace utilities used across all modules.",
    moduleView: "Module hub for shared actions, user utilities, and cross-module operational pages.",
    submodules: [
      {
        key: "workspace-actions",
        label: "Workspace Actions",
        purpose: "Common operational actions and shell entry points.",
        pages: [
          { label: "Dashboard", route: ROUTES.DASHBOARD, purpose: "Overall workspace dashboard.", display: "dashboard", status: "implemented" },
          { label: "Approvals", route: ROUTES.ADMINISTRATION_APPROVALS, purpose: "Pending and completed approvals.", display: "workflow", status: "implemented" },
          { label: "Notifications", route: ROUTES.ADMINISTRATION_NOTIFICATIONS, purpose: "Workspace alerts and updates.", display: "directory", status: "implemented" },
          { label: "Documents", route: ROUTES.ADMINISTRATION_DOCUMENTS, purpose: "Shared documents and files.", display: "directory", status: "implemented" },
        ],
      },
      {
        key: "user-utilities",
        label: "User Utilities",
        purpose: "User account and personal workspace utilities.",
        pages: [
          { label: "Profile", route: ROUTES.ADMINISTRATION_PROFILE, purpose: "Manage user profile and preferences.", display: "form", status: "implemented" },
        ],
      },
    ],
  },
  {
    key: "hrms",
    label: "HRMS",
    homeRoute: ROUTES.HRMS_HOME,
    purpose: "People operations and employee lifecycle management.",
    moduleView: "Module hub with HR submodule cards, page directory, and quick actions.",
    submodules: [
      {
        key: "core-hr",
        label: "Core HR",
        purpose: "Employee master and foundational HR data.",
        pages: [
          { label: "HR Dashboard", route: ROUTES.HRMS_HOME, purpose: "HR workspace landing.", display: "dashboard", status: "implemented" },
          { label: "Employees", route: ROUTES.EMPLOYEES, purpose: "Employee directory and management.", display: "directory", status: "implemented" },
          { label: "Certificates", route: ROUTES.CERTIFICATES, purpose: "Employee certificates and documents.", display: "directory", status: "implemented" },
          { label: "Assets", route: ROUTES.HR_ASSETS, purpose: "Employee asset assignments.", display: "directory", status: "implemented" },
        ],
      },
      {
        key: "employee-lifecycle",
        label: "Employee Lifecycle",
        purpose: "Employee journey from onboarding to exit.",
        pages: [
          { label: "Onboarding", route: ROUTES.ONBOARDING, purpose: "Manage employee onboarding.", display: "workflow", status: "implemented" },
          { label: "Offboarding", route: ROUTES.OFFBOARDING, purpose: "Manage employee exits.", display: "workflow", status: "implemented" },
          { label: "Probation", route: ROUTES.PROBATION, purpose: "Manage probation reviews.", display: "workflow", status: "implemented" },
        ],
      },
      {
        key: "attendance-time",
        label: "Attendance & Time",
        purpose: "Attendance, shifts, overtime, and leave.",
        pages: [
          { label: "Attendance", route: ROUTES.ATTENDANCE, purpose: "Attendance calendar and daily records.", display: "analytics", status: "implemented" },
          { label: "Shifts", route: ROUTES.SHIFTS, purpose: "Shift planning and assignments.", display: "directory", status: "implemented" },
          { label: "Overtime", route: ROUTES.OVERTIME, purpose: "Overtime records and approvals.", display: "workflow", status: "implemented" },
          { label: "Leave", route: ROUTES.LEAVE, purpose: "Leave requests and balances.", display: "workflow", status: "implemented" },
        ],
      },
      {
        key: "talent-acquisition",
        label: "Talent Acquisition",
        purpose: "Recruitment and screening pipeline.",
        pages: [
          { label: "Recruitment", route: ROUTES.RECRUITMENT, purpose: "Openings and recruitment pipeline.", display: "workflow", status: "implemented" },
          { label: "Screening Schedule", route: ROUTES.SCREENING_SCHEDULE, purpose: "Schedule candidate screening.", display: "workflow", status: "implemented" },
          { label: "Screening Results", route: ROUTES.SCREENING_RESULTS, purpose: "Review screening outcomes.", display: "directory", status: "implemented" },
        ],
      },
      {
        key: "learning-development",
        label: "Learning & Development",
        purpose: "Training and employee assessments.",
        pages: [
          { label: "Training", route: ROUTES.TRAINING, purpose: "Training plans and sessions.", display: "workflow", status: "implemented" },
          { label: "Assessments", route: ROUTES.ASSESSMENTS, purpose: "Training assessments and evaluation.", display: "directory", status: "implemented" },
        ],
      },
      {
        key: "performance",
        label: "Performance",
        purpose: "Appraisals and performance evaluation.",
        pages: [
          { label: "Performance", route: ROUTES.PERFORMANCE, purpose: "Performance review and appraisal.", display: "analytics", status: "implemented" },
        ],
      },
      {
        key: "hr-operations",
        label: "HR Operations",
        purpose: "HR-linked payroll actions.",
        pages: [
          { label: "HR Payroll", route: ROUTES.HR_PAYROLL, purpose: "HR-side payroll workspace.", display: "workflow", status: "implemented" },
        ],
      },
    ],
  },
  {
    key: "payroll",
    label: "Payroll",
    homeRoute: ROUTES.PAYROLL_HOME,
    purpose: "Employee payroll processing and statutory workflows.",
    moduleView: "Module hub with payroll submodules, quick actions, and page directory.",
    submodules: [
      {
        key: "processing",
        label: "Processing",
        purpose: "Core payroll execution flow.",
        pages: [
          { label: "Payroll Run", route: ROUTES.PAYROLL_RUNS, purpose: "Run monthly payroll.", display: "workflow", status: "implemented" },
          { label: "Payslips", route: ROUTES.PAYROLL_PAYSLIPS, purpose: "Generate and review payslips.", display: "directory", status: "implemented" },
          { label: "Bonus", route: ROUTES.PAYROLL_BONUS, purpose: "Manage bonus payments.", display: "workflow", status: "implemented" },
          { label: "Arrears", route: ROUTES.PAYROLL_ARREARS, purpose: "Process arrears and adjustments.", display: "workflow", status: "implemented" },
        ],
      },
      {
        key: "setup",
        label: "Setup",
        purpose: "Payroll structure and component setup.",
        pages: [
          { label: "Structures", route: ROUTES.PAYROLL_STRUCTURES, purpose: "Manage payroll structures.", display: "settings", status: "implemented" },
          { label: "Components", route: ROUTES.PAYROLL_COMPONENTS, purpose: "Manage payroll components.", display: "settings", status: "implemented" },
          { label: "Loans", route: ROUTES.PAYROLL_LOANS, purpose: "Manage payroll-linked employee loans.", display: "directory", status: "implemented" },
          { label: "Reimbursements", route: ROUTES.PAYROLL_REIMBURSEMENTS, purpose: "Manage reimbursements.", display: "directory", status: "implemented" },
        ],
      },
      {
        key: "compliance",
        label: "Compliance",
        purpose: "Statutory and year-end payroll compliance.",
        pages: [
          { label: "Statutory", route: ROUTES.PAYROLL_STATUTORY, purpose: "Statutory setup and records.", display: "settings", status: "implemented" },
          { label: "Final Settlement", route: ROUTES.PAYROLL_FINAL_SETTLEMENT, purpose: "Final settlement workflow.", display: "workflow", status: "implemented" },
          { label: "Tax Declarations", route: ROUTES.PAYROLL_TAX_DECLARATIONS, purpose: "Tax declaration and proof workflow.", display: "workflow", status: "implemented" },
        ],
      },
    ],
  },
  {
    key: "finance",
    label: "Finance",
    homeRoute: ROUTES.FINANCE_HOME,
    purpose: "Accounting and financial operations.",
    moduleView: "Module hub should group ledger, billing, tax, and banking pages under one finance workspace.",
    submodules: [
      {
        key: "ledger-setup",
        label: "Ledger Setup",
        purpose: "Core accounting structure and journal control.",
        pages: [
          { label: "Chart of Accounts", route: ROUTES.CHART_OF_ACCOUNTS, purpose: "Maintain account master.", display: "settings", status: "implemented" },
          { label: "Journal Entries", route: ROUTES.JOURNAL_ENTRIES, purpose: "Create and manage journals.", display: "directory", status: "implemented" },
        ],
      },
      {
        key: "billing-payments",
        label: "Billing & Payments",
        purpose: "Invoicing, payment records, and expenses.",
        pages: [
          { label: "Payments", route: ROUTES.PAYMENTS, purpose: "Record money in and out.", display: "directory", status: "implemented" },
          { label: "Invoices", route: ROUTES.INVOICES, purpose: "Manage finance invoices.", display: "directory", status: "implemented" },
          { label: "Expenses", route: ROUTES.EXPENSES, purpose: "Track and approve expenses.", display: "directory", status: "implemented" },
        ],
      },
      {
        key: "tax-compliance",
        label: "Tax & Compliance",
        purpose: "Tax rules and finance compliance records.",
        pages: [
          { label: "Tax Management", route: ROUTES.TAX_MANAGEMENT, purpose: "Manage tax setup and compliance.", display: "settings", status: "implemented" },
        ],
      },
      {
        key: "banking",
        label: "Banking",
        purpose: "Bank and reconciliation workflows.",
        pages: [
          { label: "Bank Reconciliation", route: ROUTES.BANK_RECONCILIATION, purpose: "Reconcile bank statements.", display: "workflow", status: "implemented" },
        ],
      },
    ],
  },
  {
    key: "inventory",
    label: "Inventory",
    homeRoute: ROUTES.INVENTORY_HOME,
    purpose: "Item, warehouse, and stock control operations.",
    moduleView: "Module hub should group catalog, storage, and stock-control pages.",
    submodules: [
      {
        key: "catalog",
        label: "Catalog",
        purpose: "Item master and inventory setup.",
        pages: [
          { label: "Items", route: ROUTES.ITEMS, purpose: "Manage item catalog.", display: "directory", status: "implemented" },
        ],
      },
      {
        key: "warehousing",
        label: "Warehousing",
        purpose: "Warehouse and storage configuration.",
        pages: [
          { label: "Warehouses", route: ROUTES.WAREHOUSES, purpose: "Manage storage locations.", display: "directory", status: "implemented" },
        ],
      },
      {
        key: "stock-control",
        label: "Stock Control",
        purpose: "Movement, adjustment, and transfer workflows.",
        pages: [
          { label: "Stock Movements", route: ROUTES.STOCK_MOVEMENTS, purpose: "Track stock transactions.", display: "directory", status: "implemented" },
          { label: "Inventory Adjustments", route: ROUTES.INVENTORY_ADJUSTMENTS, purpose: "Adjust inventory balance.", display: "workflow", status: "implemented" },
          { label: "Inventory Transfers", route: ROUTES.INVENTORY_TRANSFERS, purpose: "Transfer stock between locations.", display: "workflow", status: "implemented" },
        ],
      },
    ],
  },
  {
    key: "procurement",
    label: "Procurement",
    homeRoute: ROUTES.PROCUREMENT_HOME,
    purpose: "Vendor management and purchasing workflow.",
    moduleView: "Module hub should group vendors, purchasing, and receiving.",
    submodules: [
      {
        key: "vendor-management",
        label: "Vendor Management",
        purpose: "Supplier master and vendor directory.",
        pages: [
          { label: "Vendors", route: ROUTES.VENDORS, purpose: "Manage supplier records.", display: "directory", status: "implemented" },
        ],
      },
      {
        key: "purchasing",
        label: "Purchasing",
        purpose: "Request and order management.",
        pages: [
          { label: "Purchase Requests", route: ROUTES.PURCHASE_REQUESTS, purpose: "Create and approve purchase requests.", display: "workflow", status: "implemented" },
          { label: "Purchase Orders", route: ROUTES.PURCHASE_ORDERS, purpose: "Manage purchase orders.", display: "workflow", status: "implemented" },
        ],
      },
      {
        key: "receiving",
        label: "Receiving",
        purpose: "Goods receipt and inventory handoff.",
        pages: [
          { label: "GRN", route: ROUTES.GRN, purpose: "Receive goods and record GRN.", display: "workflow", status: "implemented" },
        ],
      },
    ],
  },
  {
    key: "sales",
    label: "Sales",
    homeRoute: ROUTES.SALES_HOME,
    purpose: "Commercial execution and customer order flow.",
    moduleView: "Module hub should group customers, quotations, orders, and returns.",
    submodules: [
      {
        key: "customer-management",
        label: "Customer Management",
        purpose: "Customer records and account master.",
        pages: [
          { label: "Customers", route: ROUTES.CUSTOMERS, purpose: "Manage customer master.", display: "directory", status: "implemented" },
        ],
      },
      {
        key: "order-flow",
        label: "Order Flow",
        purpose: "Quotations, orders, and return processing.",
        pages: [
          { label: "Quotations", route: ROUTES.QUOTATIONS, purpose: "Manage quotes and proposals.", display: "workflow", status: "implemented" },
          { label: "Sales Orders", route: ROUTES.SALES_ORDERS, purpose: "Manage customer sales orders.", display: "workflow", status: "implemented" },
          { label: "Returns", route: ROUTES.RETURNS, purpose: "Process returns and reversals.", display: "workflow", status: "implemented" },
        ],
      },
    ],
  },
  {
    key: "crm",
    label: "CRM",
    homeRoute: ROUTES.CRM_HOME,
    purpose: "Customer relationship and funnel management.",
    moduleView: "Module hub exists, but child page implementation is still incomplete in src/app.",
    submodules: [
      {
        key: "relationship-management",
        label: "Relationship Management",
        purpose: "Lead, contact, and interaction tracking.",
        pages: [
          { label: "CRM Home", route: ROUTES.CRM_HOME, purpose: "CRM landing page.", display: "dashboard", status: "partial" },
        ],
      },
    ],
    gaps: [
      "CRM has a module home route but no dedicated CRM child pages in frontend/src/app.",
    ],
  },
  {
    key: "reports",
    label: "Reports",
    homeRoute: ROUTES.REPORTS_HOME,
    purpose: "Cross-module reporting and analytics.",
    moduleView: "Module hub with report categories and analytics pages.",
    submodules: [
      {
        key: "report-categories",
        label: "Report Categories",
        purpose: "Functional reporting areas.",
        pages: [
          { label: "HR Reports", route: ROUTES.REPORTS_HR, purpose: "Employee and HR reporting.", display: "analytics", status: "implemented" },
          { label: "Payroll Reports", route: ROUTES.REPORTS_PAYROLL, purpose: "Payroll and payout reporting.", display: "analytics", status: "implemented" },
          { label: "Compliance Reports", route: ROUTES.REPORTS_COMPLIANCE, purpose: "Compliance reporting.", display: "analytics", status: "implemented" },
          { label: "ERP Reports", route: ROUTES.REPORTS_ERP, purpose: "ERP operational reporting.", display: "analytics", status: "implemented" },
          { label: "Financial Reports", route: ROUTES.REPORTS_FINANCIAL, purpose: "Finance reporting and summaries.", display: "analytics", status: "implemented" },
          { label: "Custom Reports", route: ROUTES.REPORTS_CUSTOM, purpose: "Custom report builder and saved reports.", display: "analytics", status: "partial" },
        ],
      },
    ],
  },
  {
    key: "helpdesk",
    label: "Helpdesk",
    homeRoute: ROUTES.HELPDESK_HOME,
    purpose: "Support and service desk workflows.",
    moduleView: "Module hub with tickets, escalations, and FAQ pages.",
    submodules: [
      {
        key: "support-operations",
        label: "Support Operations",
        purpose: "Ticket and escalation management.",
        pages: [
          { label: "Tickets", route: ROUTES.HELPDESK_TICKETS, purpose: "Manage helpdesk tickets.", display: "directory", status: "implemented" },
          { label: "Escalations", route: ROUTES.HELPDESK_ESCALATIONS, purpose: "Track escalated issues.", display: "workflow", status: "implemented" },
        ],
      },
      {
        key: "knowledge-base",
        label: "Knowledge Base",
        purpose: "User documentation and FAQs.",
        pages: [
          { label: "FAQ", route: ROUTES.HELPDESK_FAQ, purpose: "Help and knowledge base.", display: "directory", status: "implemented" },
        ],
      },
    ],
  },
  {
    key: "communication",
    label: "Communication",
    homeRoute: ROUTES.COMMUNICATION_HOME,
    purpose: "Announcements and reusable messaging templates.",
    moduleView: "Module hub with announcements, email templates, and SMS templates.",
    submodules: [
      {
        key: "internal-communication",
        label: "Internal Communication",
        purpose: "Employee communication and notice workflows.",
        pages: [
          { label: "Announcements", route: ROUTES.COMMUNICATION_ANNOUNCEMENTS, purpose: "Manage announcements.", display: "directory", status: "implemented" },
        ],
      },
      {
        key: "template-library",
        label: "Template Library",
        purpose: "Reusable external and internal message templates.",
        pages: [
          { label: "Email Templates", route: ROUTES.COMMUNICATION_EMAIL_TEMPLATES, purpose: "Manage email templates.", display: "settings", status: "implemented" },
          { label: "SMS Templates", route: ROUTES.COMMUNICATION_SMS_TEMPLATES, purpose: "Manage SMS templates.", display: "settings", status: "implemented" },
        ],
      },
    ],
  },
  {
    key: "integrations",
    label: "Integrations",
    homeRoute: ROUTES.INTEGRATIONS_HOME,
    purpose: "External system connectivity and diagnostics.",
    moduleView: "Module hub with API, webhook, app, and diagnostics pages.",
    submodules: [
      {
        key: "connection-management",
        label: "Connection Management",
        purpose: "Manage connectivity and integration credentials.",
        pages: [
          { label: "API Keys", route: ROUTES.INTEGRATIONS_API_KEYS, purpose: "Manage API credentials.", display: "settings", status: "implemented" },
          { label: "Webhooks", route: ROUTES.INTEGRATIONS_WEBHOOKS, purpose: "Manage webhook events.", display: "settings", status: "implemented" },
          { label: "Apps", route: ROUTES.INTEGRATIONS_APPS, purpose: "Manage integrated apps.", display: "directory", status: "implemented" },
          { label: "Logs", route: ROUTES.INTEGRATIONS_LOGS, purpose: "Review integration diagnostics.", display: "analytics", status: "implemented" },
        ],
      },
    ],
  },
  {
    key: "licensing",
    label: "Licensing",
    homeRoute: ROUTES.LICENSING_HOME,
    purpose: "Subscription and billing administration.",
    moduleView: "Module hub with plan, subscription, usage, billing, and integration sections.",
    submodules: [
      {
        key: "subscription-management",
        label: "Subscription Management",
        purpose: "Plans, active subscriptions, and commercial controls.",
        pages: [
          { label: "Catalog", route: ROUTES.LICENSING_CATALOG, purpose: "Browse plan catalog.", display: "directory", status: "implemented" },
          { label: "Subscriptions", route: ROUTES.LICENSING_SUBSCRIPTIONS, purpose: "Manage active subscriptions.", display: "directory", status: "implemented" },
          { label: "Usage", route: ROUTES.LICENSING_USAGE, purpose: "Review usage and consumption.", display: "analytics", status: "implemented" },
          { label: "Billing History", route: ROUTES.LICENSING_BILLING_HISTORY, purpose: "Review billing history.", display: "analytics", status: "implemented" },
          { label: "Integrations", route: ROUTES.LICENSING_INTEGRATIONS, purpose: "Licensing-linked integrations.", display: "settings", status: "implemented" },
        ],
      },
    ],
  },
  {
    key: "security",
    label: "Security",
    homeRoute: ROUTES.SECURITY_HOME,
    purpose: "Authentication, session, device, and policy security controls.",
    moduleView: "Module hub with grouped security pages and quick actions.",
    submodules: [
      {
        key: "overview",
        label: "Overview",
        purpose: "Security entry point and summary view.",
        pages: [
          { label: "Security Overview", route: ROUTES.SECURITY_HOME, purpose: "Module home and security overview.", display: "dashboard", status: "implemented" },
        ],
      },
      {
        key: "authentication",
        label: "Authentication",
        purpose: "Identity verification and sign-in controls.",
        pages: [
          { label: "MFA", route: ROUTES.SECURITY_MFA, purpose: "Manage multi-factor authentication.", display: "settings", status: "implemented" },
          { label: "SSO", route: ROUTES.SECURITY_SSO, purpose: "Manage SSO providers.", display: "settings", status: "implemented" },
        ],
      },
      {
        key: "devices",
        label: "Devices",
        purpose: "Trusted device visibility.",
        pages: [
          { label: "Devices", route: ROUTES.SECURITY_DEVICES, purpose: "Manage trusted devices and endpoints.", display: "directory", status: "implemented" },
        ],
      },
      {
        key: "sessions",
        label: "Sessions",
        purpose: "Session monitoring and access history.",
        pages: [
          { label: "Sessions", route: ROUTES.SECURITY_SESSIONS, purpose: "Manage sessions and refresh tokens.", display: "directory", status: "implemented" },
          { label: "Access Logs", route: ROUTES.SECURITY_ACCESS_LOGS, purpose: "Review access activity.", display: "analytics", status: "implemented" },
        ],
      },
      {
        key: "policies",
        label: "Policies",
        purpose: "Password and network policy controls.",
        pages: [
          { label: "Password Policies", route: ROUTES.SECURITY_PASSWORD_POLICIES, purpose: "Manage password policy rules.", display: "settings", status: "implemented" },
          { label: "IP Restrictions", route: ROUTES.SECURITY_IP_RESTRICTIONS, purpose: "Manage trusted IP boundaries.", display: "settings", status: "implemented" },
        ],
      },
    ],
  },
];

export function findFrontendModuleMap(moduleKey: string) {
  return FRONTEND_MODULE_MAP.find((module) => module.key === moduleKey) ?? null;
}

export function listFrontendModuleMaps() {
  return FRONTEND_MODULE_MAP.slice();
}
