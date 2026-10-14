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
    label: "Administration",
    homeRoute: ROUTES.ADMINISTRATION_HOME,
    purpose: "Enterprise platform administration center for multi-tenant governance, IAM, metadata engines, workflows, security vault, and telemetry.",
    moduleView: "Enterprise administration command hub with structured functional pillars, telemetry metrics, and complete page directory.",
    submodules: [
      {
        key: "tenant-org",
        label: "Organization Hierarchy",
        purpose: "Manage multi-tenant provisioning, legal companies, operational branches, business units, and organizational hierarchies.",
        pages: [
          { label: "Tenants", route: ROUTES.ADMINISTRATION_TENANTS, purpose: "Manage tenant registry, provisioning, and isolation.", display: "directory", status: "implemented" },
          { label: "Companies", route: ROUTES.ADMINISTRATION_COMPANIES, purpose: "Manage legal corporate entities, fiscal years, and tax registrations.", display: "directory", status: "implemented" },
          { label: "Branches", route: ROUTES.ADMINISTRATION_BRANCHES, purpose: "Branch, warehouse, and operational facility units.", display: "directory", status: "implemented" },
          { label: "Geography & Hierarchy", route: ROUTES.ADMINISTRATION_GEOGRAPHY_HIERARCHY, purpose: "Business zones, regions, and regional posting structures.", display: "directory", status: "implemented" },
          { label: "Business Units", route: ROUTES.ADMINISTRATION_BUSINESS_UNITS, purpose: "Strategic business unit divisions.", display: "directory", status: "implemented" },
          { label: "Departments", route: ROUTES.ADMINISTRATION_DEPARTMENTS, purpose: "Departmental hierarchy and organizational structure.", display: "directory", status: "implemented" },
          { label: "Designations", route: ROUTES.ADMINISTRATION_DESIGNATIONS, purpose: "Job titles, bands, and designation hierarchy.", display: "directory", status: "implemented" },
          { label: "Cost Centers", route: ROUTES.ADMINISTRATION_COST_CENTERS, purpose: "Financial cost centers and overhead allocation.", display: "directory", status: "implemented" },
          { label: "Projects Register", route: ROUTES.ADMINISTRATION_PROJECTS, purpose: "Enterprise project master for operational context.", display: "directory", status: "implemented" },
          { label: "Holiday Calendar", route: ROUTES.ADMINISTRATION_HOLIDAY_CALENDAR, purpose: "Official company holiday and working day schedule.", display: "settings", status: "implemented" },
          { label: "Org Chart", route: ROUTES.ADMINISTRATION_ORG_CHART, purpose: "Visual organization chart and reporting lines.", display: "analytics", status: "implemented" },
        ],
      },
      {
        key: "iam",
        label: "Identity & Access",
        purpose: "Zero-trust identity access management, granular RBAC/ABAC matrices, active sessions, and security policies.",
        pages: [
          { label: "Users", route: ROUTES.ADMINISTRATION_USERS, purpose: "Manage user accounts, credentials, and state lifecycle.", display: "directory", status: "implemented" },
          { label: "Roles", route: ROUTES.ADMINISTRATION_ROLES, purpose: "Define role hierarchies and permission assignments.", display: "directory", status: "implemented" },
          { label: "Permissions Matrix", route: ROUTES.ADMINISTRATION_PERMISSIONS, purpose: "Granular resource-action permission matrix inspection.", display: "directory", status: "implemented" },
          { label: "Access Control & Sessions", route: ROUTES.ADMINISTRATION_SECURITY, purpose: "Monitor active sessions, trusted devices, and terminate unauthorized logins.", display: "settings", status: "implemented" },
          { label: "Security & Password Policies", route: ROUTES.ADMINISTRATION_POLICIES, purpose: "Enforce password complexity, MFA requirements, and session timeout policies.", display: "settings", status: "implemented" },
        ],
      },
      {
        key: "app-engine",
        label: "Modules & Apps",
        purpose: "Modular application marketplace, feature flags, rollouts, and license quota entitlements.",
        pages: [
          { label: "Navigation & Module Registry", route: ROUTES.ADMINISTRATION_NAVIGATION, purpose: "Map modules, dynamic routes, and navigation UI schemas.", display: "settings", status: "implemented" },
          { label: "Feature Flags & Beta Labs", route: ROUTES.ADMINISTRATION_FEATURE_FLAGS, purpose: "Safely toggle experimental capabilities and tenant rollouts.", display: "settings", status: "implemented" },
          { label: "Licensing & Subscriptions", route: ROUTES.ADMINISTRATION_LICENSING, purpose: "Manage subscription plans, seat allocations, and module licenses.", display: "settings", status: "implemented" },
        ],
      },
      {
        key: "metadata-engine",
        label: "Metadata & Studio",
        purpose: "Dynamic schema modeling, custom fields, document auto-numbering, localization, and form designer studio.",
        pages: [
          { label: "Entity & Custom Fields Builder", route: ROUTES.ADMINISTRATION_ENTITY_BUILDER, purpose: "Visual entity schema and dynamic custom fields modeler.", display: "settings", status: "implemented" },
          { label: "Schema & UI Layout Master", route: ROUTES.ADMINISTRATION_SCHEMA_MANAGER, purpose: "Backend UI schema, JSON layout definitions, and form rules.", display: "settings", status: "implemented" },
          { label: "Document Number Ranges", route: ROUTES.ADMINISTRATION_NUMBER_RANGES, purpose: "Fiscal year auto-increment document prefixes and sequences.", display: "settings", status: "implemented" },
          { label: "Payment Terms Master", route: ROUTES.ADMINISTRATION_PAYMENT_TERMS, purpose: "Commercial credit terms and payment milestone schedules.", display: "settings", status: "implemented" },
          { label: "Master Data & Localization", route: ROUTES.ADMINISTRATION_MASTER_DATA, purpose: "Jurisdictions, tax regimes, and multi-currency rules.", display: "directory", status: "implemented" },
          { label: "Visual Page Builder", route: ROUTES.ADMINISTRATION_PAGE_BUILDER, purpose: "Interactive visual drag-and-drop page and layout designer studio.", display: "settings", status: "implemented" },
          { label: "Menu & Navigation Builder", route: ROUTES.ADMINISTRATION_MENU_BUILDER, purpose: "Visual drag-and-drop navigation and sidebar menu builder.", display: "settings", status: "implemented" },
          { label: "Schema Migration Dashboard", route: ROUTES.ADMINISTRATION_MIGRATION_DASHBOARD, purpose: "DocType and metadata schema migration tracking.", display: "analytics", status: "implemented" },
          { label: "System Settings", route: ROUTES.ADMINISTRATION_SETTINGS, purpose: "Global enterprise defaults, branding, and regional localization.", display: "settings", status: "implemented" },
        ],
      },
      {
        key: "workflow-engine",
        label: "Workflows & Approvals",
        purpose: "Multi-level approval chains, Delegation of Authority (DoA), and cross-module sign-off queues.",
        pages: [
          { label: "Workflows & Graph Config", route: ROUTES.ADMINISTRATION_WORKFLOWS, purpose: "Design state transition graphs, approval conditions, and escalations.", display: "settings", status: "implemented" },
          { label: "Approvals Inbox", route: ROUTES.ADMINISTRATION_APPROVALS, purpose: "Review and act on pending cross-module approval requests.", display: "workflow", status: "implemented" },
        ],
      },
      {
        key: "communication-hub",
        label: "Communications",
        purpose: "Multi-channel notification delivery, message templates, and transactional outbox gateways.",
        pages: [
          { label: "Notification Dispatch & Alerts", route: ROUTES.ADMINISTRATION_NOTIFICATIONS, purpose: "Workspace alerts, system broadcasts, and user notifications.", display: "directory", status: "implemented" },
          { label: "Notification Templates", route: ROUTES.ADMINISTRATION_NOTIFICATION_TEMPLATES, purpose: "WYSIWYG email, SMS, and WhatsApp merge-field templates.", display: "settings", status: "implemented" },
        ],
      },
      {
        key: "integrations-gateway",
        label: "API & Integrations",
        purpose: "Developer center, secure API keys, real-time webhooks, and third-party connector adapters.",
        pages: [
          { label: "Developer Center & API Keys", route: ROUTES.ADMINISTRATION_DEVELOPER_CENTER, purpose: "REST API keys, OpenAPI documentation, and machine clients.", display: "settings", status: "implemented" },
          { label: "Webhooks Subscriptions", route: ROUTES.ADMINISTRATION_WEBHOOKS, purpose: "Real-time webhook event subscriptions and delivery logs.", display: "settings", status: "implemented" },
          { label: "Integration Connectors Hub", route: ROUTES.ADMINISTRATION_INTEGRATIONS, purpose: "Manage ERP connectors, endpoints, and external software links.", display: "settings", status: "implemented" },
          { label: "Electronic Data Interchange (EDI X12)", route: ROUTES.ADMINISTRATION_EDI, purpose: "EDI X12 transaction interchange and mapper studio.", display: "settings", status: "implemented" },
        ],
      },
      {
        key: "audit-compliance",
        label: "Audit & Compliance",
        purpose: "Immutable audit trails, enterprise data governance, DPDP privacy compliance, and disaster recovery.",
        pages: [
          { label: "Immutable Audit Logs", route: ROUTES.ADMINISTRATION_AUDIT_LOGS, purpose: "Tamper-resistant audit trail with before/after state diffs.", display: "analytics", status: "implemented" },
          { label: "Data Governance & Registries", route: ROUTES.ADMINISTRATION_DATA_MANAGEMENT, purpose: "Enterprise master registries and tenant data isolation controls.", display: "directory", status: "implemented" },
          { label: "Data Privacy & DPDP Vault", route: ROUTES.ADMINISTRATION_PRIVACY, purpose: "DPDP Act 2023 compliance, personal dossier export, and Right to Erasure.", display: "settings", status: "implemented" },
          { label: "Backup & Disaster Recovery", route: ROUTES.ADMINISTRATION_BACKUP, purpose: "Automated database snapshots, WAL backups, and point-in-time recovery.", display: "settings", status: "implemented" },
          { label: "Recycle Bin", route: ROUTES.ADMINISTRATION_RECYCLE_BIN, purpose: "Inspect and restore soft-deleted records across all entities.", display: "directory", status: "implemented" },
        ],
      },
      {
        key: "system-ops",
        label: "System Operations",
        purpose: "Live infrastructure telemetry, AI copilot agents, platform diagnostic support, and inbound leads.",
        pages: [
          { label: "System Health & Telemetry", route: ROUTES.ADMINISTRATION_SYSTEM_HEALTH, purpose: "Monitor service status, DB latency, memory, and Redis cache.", display: "analytics", status: "implemented" },
          { label: "AI Copilot Agents", route: ROUTES.ADMINISTRATION_AI_ASSISTANT, purpose: "Configure enterprise AI LLM models, prompts, and autonomous tools.", display: "settings", status: "implemented" },
          { label: "Support & Diagnostics", route: ROUTES.ADMINISTRATION_SUPPORT, purpose: "Platform error logs, support tickets, and diagnostic traces.", display: "directory", status: "implemented" },
          { label: "Contact Submissions", route: ROUTES.ADMINISTRATION_CONTACT_SUBMISSIONS, purpose: "Review inbound web contact form submissions.", display: "directory", status: "implemented" },
        ],
      },
      {
        key: "digital-presence",
        label: "Website & CMS",
        purpose: "Manage tenant customer-facing websites, landing pages, branding themes, and CMS templates.",
        pages: [
          { label: "Website CMS Pages", route: ROUTES.ADMINISTRATION_WEBSITE_PAGES, purpose: "Manage tenant website pages, themes, and branding content.", display: "directory", status: "implemented" },
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
          { label: "Org Chart & Hierarchy", route: ROUTES.ORG_CHART, purpose: "Interactive organization tree and reporting hierarchy.", display: "workflow", status: "implemented" },
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
        purpose: "Travel and payroll entry points for HR.",
        pages: [
          { label: "Travel", route: ROUTES.TRAVEL, purpose: "Employee travel requests.", display: "workflow", status: "implemented" },
          { label: "HR Payroll", route: ROUTES.HR_PAYROLL, purpose: "Redirect into payroll runs.", display: "workflow", status: "implemented" },
        ],
      },
      {
        key: "self-service",
        label: "Self-Service Portals",
        purpose: "Manager and employee personal workspace.",
        pages: [
          { label: "Manager Self-Service", route: "/manager-self-service", purpose: "Team directory, direct report monitoring, and approvals.", display: "workflow", status: "implemented" },
          { label: "Employee Self-Service", route: "/employee-self-service", purpose: "Personal profile, leave applications, and payslips.", display: "workflow", status: "implemented" },
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
          { label: "Payroll Dashboard", route: ROUTES.PAYROLL_HOME, purpose: "Payroll workspace landing.", display: "dashboard", status: "implemented" },
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
    purpose: "General ledger, receivables, payables, taxation, and financial consolidation.",
    moduleView: "Module hub grouping ledger, billing, tax, banking, and consolidation under one finance workspace.",
    submodules: [
      {
        key: "ledger-setup",
        label: "General Ledger",
        purpose: "Core accounting structure, journals, and fiscal periods.",
        pages: [
          { label: "Finance Dashboard", route: ROUTES.FINANCE_HOME, purpose: "Finance workspace landing and operational shortcuts.", display: "dashboard", status: "implemented" },
          { label: "Chart of Accounts", route: ROUTES.CHART_OF_ACCOUNTS, purpose: "Maintain account tree and ledger heads.", display: "settings", status: "implemented" },
          { label: "Journal Entries", route: ROUTES.JOURNAL_ENTRIES, purpose: "Create and post debit/credit journal vouchers.", display: "directory", status: "implemented" },
          { label: "Accounting Periods", route: ROUTES.ACCOUNTING_PERIODS, purpose: "Fiscal calendar management and period closing.", display: "settings", status: "implemented" },
        ],
      },
      {
        key: "billing-payments",
        label: "Billing & Treasury",
        purpose: "Invoicing, accounts payable, payment records, and expenses.",
        pages: [
          { label: "Customer Invoices", route: ROUTES.INVOICES, purpose: "Manage customer sales invoices.", display: "directory", status: "implemented" },
          { label: "Vendor Bills", route: ROUTES.VENDOR_BILLS, purpose: "Manage accounts payable supplier bills.", display: "directory", status: "implemented" },
          { label: "Payments", route: ROUTES.PAYMENTS, purpose: "Record money in and out transactions.", display: "directory", status: "implemented" },
          { label: "Expenses", route: ROUTES.EXPENSES, purpose: "Track and approve operational expenses.", display: "directory", status: "implemented" },
        ],
      },
      {
        key: "tax-compliance",
        label: "Taxation & Compliance",
        purpose: "Tax rules, GST slabs, and regulatory compliance records.",
        pages: [
          { label: "Tax Management", route: ROUTES.TAX_MANAGEMENT, purpose: "Manage tax slabs, HSN rates, and compliance.", display: "settings", status: "implemented" },
          { label: "E-Invoicing & Compliance", route: ROUTES.COMPLIANCE, purpose: "IRN hash generation, E-Way bills, and tax verification.", display: "settings", status: "implemented" },
        ],
      },
      {
        key: "banking",
        label: "Banking & Treasury",
        purpose: "Bank feeds, accounts, and reconciliation workflows.",
        pages: [
          { label: "Bank Reconciliation", route: ROUTES.BANK_RECONCILIATION, purpose: "Reconcile bank statements against ledger transactions.", display: "workflow", status: "implemented" },
        ],
      },
      {
        key: "planning-consolidation",
        label: "Planning & Consolidation",
        purpose: "Corporate budgeting and multi-entity financial consolidation.",
        pages: [
          { label: "Budgeting & Forecasting", route: ROUTES.FINANCE_BUDGETING, purpose: "Manage departmental budgets, limits, and variance analysis.", display: "analytics", status: "implemented" },
          { label: "Financial Consolidation", route: ROUTES.FINANCE_CONSOLIDATION, purpose: "Multi-company group trial balance and intercompany eliminations.", display: "analytics", status: "implemented" },
        ],
      },
    ],
  },
  {
    key: "inventory",
    label: "Inventory",
    homeRoute: ROUTES.INVENTORY_HOME,
    purpose: "Item, warehouse, stock control, and warehouse management operations.",
    moduleView: "Module hub grouping catalog, storage, stock-control, and WMS bin pages.",
    submodules: [
      {
        key: "catalog",
        label: "Catalog & Warehousing",
        purpose: "Item master, warehouse facilities, and storage setup.",
        pages: [
          { label: "Inventory Dashboard", route: ROUTES.INVENTORY_HOME, purpose: "Inventory workspace landing and stock valuation summary.", display: "dashboard", status: "implemented" },
          { label: "Item Catalog", route: ROUTES.ITEMS, purpose: "Manage item SKUs, barcodes, and pricing.", display: "directory", status: "implemented" },
          { label: "Warehouses", route: ROUTES.WAREHOUSES, purpose: "Manage multi-site storage locations.", display: "directory", status: "implemented" },
          { label: "Warehouse Management System (WMS) & Bin Locations", route: ROUTES.INVENTORY_WMS, purpose: "Zone, rack, shelf bin capacities and barcode scanner.", display: "settings", status: "implemented" },
        ],
      },
      {
        key: "stock-control",
        label: "Stock Operations",
        purpose: "Stock movements, adjustments, inter-warehouse transfers, and manufacturing.",
        pages: [
          { label: "Stock Movements", route: ROUTES.STOCK_MOVEMENTS, purpose: "Track real-time stock ins, outs, and audit entries.", display: "directory", status: "implemented" },
          { label: "Inventory Adjustments", route: ROUTES.INVENTORY_ADJUSTMENTS, purpose: "Physical count adjustments, damages, and write-offs.", display: "workflow", status: "implemented" },
          { label: "Inventory Transfers", route: ROUTES.INVENTORY_TRANSFERS, purpose: "Inter-warehouse transfers, in-transit tracking, and MRP.", display: "workflow", status: "implemented" },
          { label: "Work Orders", route: ROUTES.MANUFACTURING_WORK_ORDERS, purpose: "Manufacturing production work orders and assembly lines.", display: "workflow", status: "implemented" },
        ],
      },
    ],
  },
  {
    key: "procurement",
    label: "Procurement",
    homeRoute: ROUTES.PROCUREMENT_HOME,
    purpose: "Vendor management, purchase requisitions, orders, receiving, and bills.",
    moduleView: "Module hub grouping vendors, purchasing, GRN, and vendor bills.",
    submodules: [
      {
        key: "vendor-management",
        label: "Vendor Sourcing",
        purpose: "Supplier master and vendor directory.",
        pages: [
          { label: "Procurement Dashboard", route: ROUTES.PROCUREMENT_HOME, purpose: "Procurement workspace landing and purchasing summary.", display: "dashboard", status: "implemented" },
          { label: "Vendors", route: ROUTES.VENDORS, purpose: "Manage supplier records, terms, and tax IDs.", display: "directory", status: "implemented" },
        ],
      },
      {
        key: "purchasing",
        label: "Purchasing & Payables",
        purpose: "Requisitions, purchase orders, receiving, and bills.",
        pages: [
          { label: "Purchase Requests", route: ROUTES.PURCHASE_REQUESTS, purpose: "Create and approve departmental purchase requests.", display: "workflow", status: "implemented" },
          { label: "Purchase Orders", route: ROUTES.PURCHASE_ORDERS, purpose: "Issue and track supplier purchase orders.", display: "workflow", status: "implemented" },
          { label: "Goods Receipt Notes (GRN)", route: ROUTES.GRN, purpose: "Receive goods, inspect quality, and record GRN.", display: "workflow", status: "implemented" },
          { label: "Vendor Bills", route: ROUTES.VENDOR_BILLS, purpose: "Record supplier invoices and 3-way match against PO.", display: "workflow", status: "implemented" },
        ],
      },
    ],
  },
  {
    key: "sales",
    label: "Sales",
    homeRoute: ROUTES.SALES_HOME,
    purpose: "Commercial execution, quotations, orders, returns, and portal.",
    moduleView: "Module hub grouping customers, quotes, orders, returns, and B2B portal.",
    submodules: [
      {
        key: "customer-management",
        label: "Customer Management",
        purpose: "Customer records, account master, and CRM links.",
        pages: [
          { label: "Sales Dashboard", route: ROUTES.SALES_HOME, purpose: "Sales workspace landing and commercial summary.", display: "dashboard", status: "implemented" },
          { label: "Customers", route: ROUTES.CUSTOMERS, purpose: "Manage customer master accounts.", display: "directory", status: "implemented" },
        ],
      },
      {
        key: "quotes-pricing",
        label: "Quotes & Pricing",
        purpose: "Sales quotations, price tiers, and discount schemes.",
        pages: [
          { label: "Quotations", route: ROUTES.QUOTATIONS, purpose: "Manage customer quotes and convert to order.", display: "workflow", status: "implemented" },
          { label: "Pricing Matrix", route: ROUTES.SALES_PRICING, purpose: "Wholesale, distributor, and retail tier pricing.", display: "settings", status: "implemented" },
          { label: "Discounts", route: ROUTES.DISCOUNTS, purpose: "Product, category, and promotional discount schemes.", display: "directory", status: "implemented" },
        ],
      },
      {
        key: "order-fulfillment",
        label: "Orders & Fulfillment",
        purpose: "Customer sales orders, invoices, returns, and customer portal.",
        pages: [
          { label: "Sales Orders", route: ROUTES.SALES_ORDERS, purpose: "Manage customer sales orders and dispatch status.", display: "workflow", status: "implemented" },
          { label: "Invoices", route: ROUTES.INVOICES, purpose: "Customer sales invoices and payment tracking.", display: "directory", status: "implemented" },
          { label: "Returns & Credits", route: ROUTES.RETURNS, purpose: "Customer returns, stock reversal, and credit notes.", display: "workflow", status: "implemented" },
          { label: "B2B Customer Portal", route: ROUTES.PORTAL, purpose: "Customer self-service quote approval and payments.", display: "directory", status: "implemented" },
        ],
      },
    ],
  },
  {
    key: "crm",
    label: "CRM",
    homeRoute: ROUTES.CRM_HOME,
    purpose: "Customer relationship, leads, and opportunity pipeline management.",
    moduleView: "Module hub with leads pipeline, visual Kanban, and contact directory.",
    submodules: [
      {
        key: "pipeline",
        label: "Opportunity Pipeline",
        purpose: "Lead funnel, stages, and deal conversion.",
        pages: [
          { label: "CRM Overview", route: ROUTES.CRM_HOME, purpose: "CRM landing and funnel telemetry.", display: "dashboard", status: "implemented" },
          { label: "Leads", route: ROUTES.LEADS, purpose: "Lead register and qualification.", display: "workflow", status: "implemented" },
          { label: "Visual Pipeline", route: ROUTES.CRM_PIPELINE, purpose: "Interactive drag-and-drop Kanban pipeline board.", display: "workflow", status: "implemented" },
        ],
      },
      {
        key: "accounts-contacts",
        label: "Accounts & Contacts",
        purpose: "Customer master and decision maker contact directory.",
        pages: [
          { label: "Customer Accounts", route: ROUTES.CUSTOMERS, purpose: "Customer business accounts directory.", display: "directory", status: "implemented" },
          { label: "Contacts Directory", route: ROUTES.CRM_CONTACTS, purpose: "Designated contact persons, phone numbers, and emails.", display: "directory", status: "implemented" },
        ],
      },
    ],
  },
  {
    key: "projects",
    label: "Projects & Service",
    homeRoute: ROUTES.PROJECTS_HOME,
    purpose: "Project governance, task delivery, timesheets, field service, and fixed assets.",
    moduleView: "Module hub with project register, task board, timesheets, field service, and depreciation.",
    submodules: [
      {
        key: "execution",
        label: "Project Execution",
        purpose: "Projects register, task management, and timesheets.",
        pages: [
          { label: "Projects Hub", route: ROUTES.PROJECTS_HOME, purpose: "Cross-functional project tracking, workspaces, and milestones.", display: "dashboard", status: "implemented" },
          { label: "Projects Register", route: ROUTES.PLATFORM_PROJECTS, purpose: "Manage client projects and delivery scope.", display: "directory", status: "implemented" },
          { label: "Task Board", route: ROUTES.PROJECT_TASKS, purpose: "Interactive task board and backlog.", display: "workflow", status: "implemented" },
          { label: "Timesheets", route: ROUTES.PROJECT_TIMESHEETS, purpose: "Time logging, billing hours, and approvals.", display: "workflow", status: "implemented" },
        ],
      },
      {
        key: "field-service",
        label: "Field Service",
        purpose: "Field work orders and technician dispatch.",
        pages: [
          { label: "Field Service", route: ROUTES.FIELD_SERVICE, purpose: "Dispatched service tickets, routing, and customer signatures.", display: "workflow", status: "implemented" },
        ],
      },
      {
        key: "asset-lifecycle",
        label: "Asset Lifecycle",
        purpose: "Fixed asset depreciation schedules and vehicle fleet tracking.",
        pages: [
          { label: "Fixed Asset Depreciation", route: ROUTES.ASSET_DEPRECIATION, purpose: "Fixed asset depreciation runs and schedules.", display: "workflow", status: "implemented" },
          { label: "Fleet Management", route: ROUTES.FLEET_HOME, purpose: "Vehicle registry, maintenance logs, and fuel tracking.", display: "workflow", status: "implemented" },
        ],
      },
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
          { label: "Reports Home", route: ROUTES.REPORTS_HOME, purpose: "Reports workspace landing.", display: "dashboard", status: "implemented" },
          { label: "HR Reports", route: ROUTES.REPORTS_HR, purpose: "Employee and HR reporting.", display: "analytics", status: "implemented" },
          { label: "Payroll Reports", route: ROUTES.REPORTS_PAYROLL, purpose: "Payroll and payout reporting.", display: "analytics", status: "implemented" },
          { label: "Compliance Reports", route: ROUTES.REPORTS_COMPLIANCE, purpose: "Compliance reporting.", display: "analytics", status: "implemented" },
          { label: "ERP Reports", route: ROUTES.REPORTS_ERP, purpose: "ERP operational reporting.", display: "analytics", status: "implemented" },
          { label: "Financial Reports", route: ROUTES.REPORTS_FINANCIAL, purpose: "Finance reporting and summaries.", display: "analytics", status: "implemented" },
          { label: "Custom Reports", route: ROUTES.REPORTS_CUSTOM, purpose: "Custom report builder and saved reports.", display: "analytics", status: "implemented" },
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
          { label: "Helpdesk Overview", route: ROUTES.HELPDESK_HOME, purpose: "Helpdesk workspace landing.", display: "dashboard", status: "implemented" },
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
          { label: "Communication Overview", route: ROUTES.COMMUNICATION_HOME, purpose: "Communication workspace landing.", display: "dashboard", status: "implemented" },
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
          { label: "Integrations Overview", route: ROUTES.INTEGRATIONS_HOME, purpose: "Integrations workspace landing.", display: "dashboard", status: "implemented" },
          { label: "Connector Studio", route: ROUTES.ADMINISTRATION_INTEGRATIONS, purpose: "Configure third-party connectors, webhooks, and sync pipelines.", display: "settings", status: "implemented" },
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
          { label: "Multi-Factor Authentication (MFA)", route: ROUTES.SECURITY_MFA, purpose: "Manage multi-factor authentication.", display: "settings", status: "implemented" },
          { label: "Single Sign-On (SSO)", route: ROUTES.SECURITY_SSO, purpose: "Manage SSO providers.", display: "settings", status: "implemented" },
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
  {
    key: "manufacturing",
    label: "Manufacturing",
    homeRoute: ROUTES.MANUFACTURING_HOME,
    purpose: "Production planning, work orders, bill of materials, shop floor tracking, and assembly line execution.",
    moduleView: "Module hub grouping work orders, production schedules, operations routing, and quality assurance.",
    submodules: [
      {
        key: "production-control",
        label: "Production Control",
        purpose: "Manage work orders, operations sequencing, and execution.",
        pages: [
          { label: "Manufacturing Dashboard", route: ROUTES.MANUFACTURING_HOME, purpose: "Production telemetry, yield rates, and work order summary.", display: "dashboard", status: "implemented" },
          { label: "Work Orders", route: ROUTES.MANUFACTURING_WORK_ORDERS, purpose: "Assembly orders, bills of material, and operations routing.", display: "workflow", status: "implemented" },
        ],
      },
    ],
  },
  {
    key: "ai",
    label: "AI Assistant",
    homeRoute: "/ai",
    purpose: "Enterprise conversational copilot, grounded RAG tools, and AI agent prompt configurations.",
    moduleView: "Conversational copilot shell with live tenant citations and agent management.",
    submodules: [
      {
        key: "copilot",
        label: "Copilot & Tools",
        purpose: "Interactive tenant-grounded chat and conversational tools.",
        pages: [
          { label: "AI Copilot", route: "/ai", purpose: "Tenant-grounded conversational assistant.", display: "workflow", status: "implemented" },
          { label: "AI Agents Manager", route: ROUTES.ADMINISTRATION_AI_ASSISTANT, purpose: "Configure enterprise AI models and system prompts.", display: "settings", status: "implemented" },
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
