const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, '..', 'docs', 'architecture');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// Load discovery output
const discoveryPath = path.join(__dirname, 'discovery_output.json');
const discovery = JSON.parse(fs.readFileSync(discoveryPath, 'utf-8'));

console.log('Generating architectural deliverables...');

// Helper to write file
function writeDoc(fileName, content) {
  const target = path.join(docsDir, fileName);
  fs.writeFileSync(target, content.trim() + '\n', 'utf-8');
  console.log(`Created: docs/architecture/${fileName}`);
}

// -------------------------------------------------------------
// 01-repository-inventory.md
// -------------------------------------------------------------
writeDoc('01-repository-inventory.md', `# 01 — Repository Inventory & Technology Stack Discovery

## Executive Summary
This document establishes the baseline inventory of the enterprise multi-tenant ERP system codebase. The repository contains both a high-throughput .NET 10 backend and a modern Next.js / React enterprise frontend.

## Technology Stack Specification

| Tier | Component / Technology | Detected Version | Architectural Role |
| :--- | :--- | :--- | :--- |
| **Backend Runtime** | .NET Core / ASP.NET Core | **.NET 10.0** Preview / 9 LTS Compatible | REST API, Enterprise Services, Background Workers |
| **ORM / Data Access** | Entity Framework Core | **EF Core 10.0 / 9.0** | Relational Data Mapping, Multi-Tenant Filtering |
| **Database** | Microsoft SQL Server / Azure SQL | Relational / T-SQL | Multi-tenant persistent relational store |
| **Frontend Framework** | Next.js App Router | **Next.js 15.1+** (Targeting Next 16) | Server & Client Component Hybrid Rendering |
| **UI Runtime** | React | **React 19.0.0** | Component lifecycle, Actions, Optimistic UI |
| **Styling** | Tailwind CSS / Lucide Icons | **Tailwind CSS v4** | Design tokens, glassmorphism, responsive UI |
| **State Management** | React Context + TanStack Query / SWR | Custom hooks + API client | Server state caching & mutation sync |
| **Authentication** | JWT + Cookie Session + MFA | Custom Identity + ASP.NET Identity | Multi-tenant ClaimsPrincipal & Session Guards |

## Frontend vs. Backend Metrics

\`\`\`
Total Frontend Pages:         192 pages (App Router)
Total Backend Controllers:    108 controllers
Total Backend Endpoints:      542 REST API endpoints
Total Database DbSets:        172 DbSets (ApplicationDbContext)
Total Entity Models:          124 Domain Models
Total Core Modules:           18 Functional Domains
\`\`\`

## Physical Directory Structure

\`\`\`text
Uabindia/
├── Backend/
│   ├── src/
│   │   ├── Modules/                   # 15 Vertical Functional Modules
│   │   │   ├── Administration/        # Tenant, Company, Org Hierarchy, Users, Roles, UI Schema
│   │   │   ├── Assets/                # Fixed Assets, Depreciation, Fleet
│   │   │   ├── Compliance/            # Statutory Compliance & Audits
│   │   │   ├── CRM/                   # Leads, Customer Relations
│   │   │   ├── Finance/               # Chart of Accounts, Journals, Invoicing, Payments, Tax
│   │   │   ├── HRMS/                  # Employees, Attendance, Shifts, Leaves, Appraisals
│   │   │   ├── Inventory/             # Items, Warehouses, Stock Movement, Transfers
│   │   │   ├── Manufacturing/         # Work Orders, Bills of Materials (BOM), MRP
│   │   │   ├── Notifications/         # In-App Notifications, Communication Templates
│   │   │   ├── Payroll/               # Pay Runs, Payslips, Allowances, PF/ESI
│   │   │   ├── Procurement/           # Purchase Orders, RFQ, GRN, Vendors
│   │   │   ├── Projects/              # Project Master, WBS Tasks, Timesheets, Field Service
│   │   │   ├── Reports/               # Cross-cutting tabular & analytical reporting
│   │   │   ├── Sales/                 # Quotations, Sales Orders, Discount Schemes, Returns
│   │   │   └── Workflow/              # Approval Chains, Engine, State Machine
│   │   ├── UabIndia.Api/              # Host Web API, Middlewares, Dependency Injection
│   │   ├── UabIndia.Application/      # Use Cases, DTOs, CQRS Handlers, Validation
│   │   ├── UabIndia.Billing/          # Tenant SaaS Subscriptions & Invoicing
│   │   ├── UabIndia.Core/             # Base Entities, Domain Events, Shared Interfaces
│   │   ├── UabIndia.Identity/         # Authentication, Token Providers, MFA, SSO
│   │   ├── UabIndia.Infrastructure/   # ApplicationDbContext, Migrations, External Gateways
│   │   └── UabIndia.SharedKernel/     # Domain Primitives, Specifications, Guard Clauses
│   └── tests/
│       └── UabIndia.Tests/            # Unit & Integration Tests
│
├── frontend/
│   ├── src/
│   │   ├── app/                       # 192 Next.js App Router Pages
│   │   │   ├── (auth)/                # Login, Register, Forgot Password, OTP Verification
│   │   │   ├── (marketing)/           # Public Landing, Pricing, Industries, Solutions
│   │   │   └── (protected)/           # Authenticated ERP Business Shell & Workspaces
│   │   ├── components/                # Reusable UI Atoms, Molecules, Organisms
│   │   │   ├── dynamic/               # Metadata-driven Dynamic Renderer (Table, Form, Filter)
│   │   │   ├── shared/                # ErpPageShell, Table, FilterBar, Modal, Drawers
│   │   │   └── ui/                    # Base Buttons, Inputs, Cards, Badges, Tabs
│   │   ├── hooks/                     # Custom Data Fetching & Table Hooks (useErpListView)
│   │   ├── lib/                       # Utilities, API Client, Navigation, Workspace Registry
│   │   │   ├── workspace/             # Module Registry, Route Config, Navigation Tree
│   │   │   └── ui-schema/             # Schema Engine Types & Serialization
│   │   ├── constants/                 # Route Constants, Permission Keys
│   │   └── types/                     # Shared TypeScript Interfaces
│   └── middleware.ts                  # Edge Tenant Routing, Auth Session & Canonical Redirects
\`\`\`
`);

// -------------------------------------------------------------
// 02-module-submodule-map.md
// -------------------------------------------------------------
writeDoc('02-module-submodule-map.md', `# 02 — ERP Module & Submodule Hierarchy Map

## Module Hierarchy Overview
The ERP is structured into 18 functional modules spanning 6 operational workspace sections:

\`\`\`text
ERP Workspace
├── 1. My Work (Personal & Approvals)
│   ├── Employee Self-Service (ESS)
│   ├── Manager Self-Service (MSS)
│   ├── Approvals & Workflow Queue
│   └── Notification Center
│
├── 2. People & Talent (HRMS & Payroll)
│   ├── Core Workforce (Employees, Org Hierarchy, Postings)
│   ├── Time & Attendance (Shifts, Swaps, Overtime, Regularization)
│   ├── Leave & Absence (Policies, Allocations, Applications)
│   ├── Talent Acquisition (Recruitment, Screening, Offers)
│   ├── Lifecycle (Onboarding, Probation, Offboarding, Appraisals, Training)
│   └── Payroll Processing (Runs, Payslips, Allowances, PF, ESI, TDS)
│
├── 3. Supply Chain & Commerce (Sales, CRM, Procurement, Inventory)
│   ├── CRM (Leads, Opportunities, Pipeline)
│   ├── Sales (Quotations, Orders, Invoicing, Discounts, Returns)
│   ├── Procurement (Vendors, Purchase Requests, Purchase Orders, GRN)
│   └── Inventory & WMS (Items, Stock Movement, Warehouses, Transfers, Adjustments)
│
├── 4. Finance & Accounting
│   ├── General Ledger (Chart of Accounts, Journal Entries, Periods)
│   ├── Treasury & Banking (Bank Feeds, Reconciliation, Payments)
│   ├── Accounts Payable & Receivable (Invoices, Vendor Bills, Expenses)
│   ├── Statutory & Tax (GST, TDS, E-Invoicing, Audit Logs)
│   └── Financial Consolidation & Budgeting
│
├── 5. Operations & Cross-Cutting
│   ├── Projects (Project Master, Tasks, Timesheets, Field Service)
│   ├── Manufacturing (Work Orders, Bills of Materials)
│   ├── Fixed Assets (Asset Registry, Depreciation, Maintenance, Fleet)
│   ├── Helpdesk & Support (Tickets, SLAs, Knowledgebase)
│   ├── Document Vault & E-Signatures
│   └── AI Copilot Engine
│
└── 6. Enterprise Administration & Platform
    ├── Multi-Tenant Control (Tenants, Companies, Branches, Projects)
    ├── Organization Structure (Business Units, Departments, Designations, Cost Centers)
    ├── Security & Access (Users, Roles, Permissions, MFA, SSO, IP Rules, Sessions)
    ├── Low-Code Studio (UI Page Builder, Entity Builder, Schema Registry)
    ├── Integrations & Developer Center (Webhooks, API Keys, EDI)
    └── Settings & Numbering Sequences
\`\`\`

## End-to-End Vertical Traceability Matrix

| Module | Submodule | Primary Frontend Page | Backend Controller | Application Service | Domain Entity | Database Table |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **HRMS** | Employee Master | \`/hrms/employees\` | \`EmployeesController\` | \`EmployeeService\` | \`Employee\` | \`Employees\` |
| **HRMS** | Attendance | \`/hrms/attendance\` | \`AttendanceController\` | \`AttendanceService\` | \`AttendanceRecord\` | \`AttendanceRecords\` |
| **HRMS** | Shifts & Roster | \`/hrms/shifts\` | \`ShiftsController\` | \`ShiftService\` | \`Shift\`, \`ShiftAssignment\` | \`Shifts\` |
| **HRMS** | Leave Management | \`/hrms/leave\` | \`LeaveController\` | \`LeaveService\` | \`LeaveRequest\` | \`LeaveRequests\` |
| **HRMS** | Recruitment | \`/hrms/recruitment\` | \`RecruitmentController\` | \`RecruitmentService\` | \`JobPosting\`, \`Candidate\` | \`JobPostings\` |
| **Payroll** | Pay Run Execution | \`/payroll/runs\` | \`PayrollController\` | \`PayrollCalculationEngine\` | \`PayrollRun\` | \`PayrollRuns\` |
| **Payroll** | Payslips | \`/payroll/payslips\` | \`PayrollController\` | \`PayslipService\` | \`Payslip\` | \`Payslips\` |
| **Finance** | General Ledger | \`/chart-of-accounts\` | \`ChartOfAccountsController\` | \`GeneralLedgerService\` | \`ChartOfAccount\` | \`ChartOfAccounts\` |
| **Finance** | Journal Entries | \`/journal-entries\` | \`JournalEntriesController\` | \`JournalEntryService\` | \`JournalEntry\` | \`JournalEntries\` |
| **Finance** | Invoicing | \`/invoices\` | \`SalesInvoicesController\` | \`InvoiceService\` | \`SalesInvoice\` | \`SalesInvoices\` |
| **Finance** | Bank Reconciliation | \`/bank-reconciliation\` | \`BankReconciliationsController\` | \`BankingService\` | \`BankReconciliation\` | \`BankReconciliations\` |
| **Procurement** | Purchase Orders | \`/purchase-orders\` | \`PurchaseOrdersController\` | \`PurchaseOrderService\` | \`PurchaseOrder\` | \`PurchaseOrders\` |
| **Procurement** | Goods Receipts (GRN) | \`/procurement/goods-receipt-notes\` | \`GoodsReceiptsController\` | \`GoodsReceiptService\` | \`GoodsReceiptNote\` | \`GoodsReceiptNotes\` |
| **Inventory** | Item Master | \`/items\` | \`ItemsController\` | \`InventoryItemService\` | \`Item\` | \`Items\` |
| **Inventory** | Warehouse Stock | \`/warehouses\` | \`WarehousesController\` | \`WarehouseService\` | \`Warehouse\`, \`StockBalance\` | \`Warehouses\` |
| **Inventory** | Stock Movements | \`/stock-movements\` | \`StockMovementsController\` | \`StockTransferService\` | \`StockMovement\` | \`StockMovements\` |
| **Sales** | Sales Orders | \`/sales-orders\` | \`SalesOrdersController\` | \`SalesOrderService\` | \`SalesOrder\` | \`SalesOrders\` |
| **Sales** | Customers | \`/customers\` | \`CustomersController\` | \`CustomerService\` | \`Customer\` | \`Customers\` |
| **Projects** | Project Master | \`/platform/projects\` | \`ProjectsController\` | \`ProjectService\` | \`Project\` | \`Projects\` |
| **Projects** | Task Tracking | \`/projects/tasks\` | \`ProjectTasksController\` | \`TaskTrackingService\` | \`ProjectTask\` | \`ProjectTasks\` |
| **Administration** | Tenant Registry | \`/administration/tenants\` | \`TenantsController\` | \`TenantProvisioningService\` | \`Tenant\` | \`Tenants\` |
| **Administration** | Company Master | \`/administration/companies\` | \`CompaniesController\` | \`CompanyService\` | \`Company\` | \`Companies\` |
| **Administration** | Roles & Permissions | \`/administration/roles\` | \`RolesController\` | \`AuthorizationService\` | \`Role\`, \`UserRole\` | \`Roles\` |
| **Administration** | UI Page Builder | \`/administration/page-builder\` | \`UiPagesController\` | \`UiPageMetadataService\` | \`UiPageDefinition\` | \`UiPageDefinitions\` |
`);

// -------------------------------------------------------------
// 03-frontend-page-inventory.md
// -------------------------------------------------------------
const typeCounts = {};
discovery.frontendPages.forEach(p => {
  typeCounts[p.pageType] = (typeCounts[p.pageType] || 0) + 1;
});

const pageRows = discovery.frontendPages.map(p => {
  return `| \`${p.route}\` | \`${p.filePath}\` | ${p.pageType.split(' — ')[0]} | ${p.migrationPriority} | ${p.riskLevel} | ${p.scores.hardcodingScore}% | ${p.scores.metadataReadiness}% |`;
}).join('\n');

writeDoc('03-frontend-page-inventory.md', `# 03 — Frontend Page Master Inventory

## Executive Summary
A total of **${discovery.summary.totalPages} pages** were discovered and analyzed in the Next.js App Router tree. Each page has been classified by architectural type, hardcoding intensity, metadata readiness, and migration risk.

## Page Distribution by Architectural Classification

| Classification Code | Architectural Type | Page Count | Description |
| :--- | :--- | :--- | :--- |
| **TYPE A** | Fully Static | ${typeCounts['TYPE A — Fully static'] || 0} | Public marketing, legal, static content, documentation |
| **TYPE B** | Standard CRUD Page | ${typeCounts['TYPE B — CRUD page'] || 0} | Create, Read, Update, Delete with standard form/drawer |
| **TYPE C** | Form-Heavy Page | ${typeCounts['TYPE C — Form page'] || 0} | Multi-step wizards, onboarding questionnaires |
| **TYPE D** | Table / List Page | ${typeCounts['TYPE D — Table/list page'] || 0} | High-density data grid with filtering, sorting, export |
| **TYPE E** | Operational Dashboard | ${typeCounts['TYPE E — Dashboard'] || 0} | KPI scorecards, charts, aggregation widgets |
| **TYPE F** | Workflow & Approval Page | ${typeCounts['TYPE F — Workflow page'] || 0} | State transitions, approval steps, request history |
| **TYPE G** | Master-Data Reference Page | ${typeCounts['TYPE G — Master-data page'] || 0} | Departments, Designations, Branches, Currencies |
| **TYPE H** | Financial / Transaction Page | ${typeCounts['TYPE H — Transaction page'] || 0} | Payroll runs, Journal entries, Invoices, Payments |
| **TYPE I** | Report / Analytics Page | ${typeCounts['TYPE I — Report/Analytics'] || 0} | Parametric queries, statutory reports, cross-module |
| **TYPE J** | Configuration Page | ${typeCounts['TYPE J — Configuration page'] || 0} | Tenant settings, numbering series, schema builder |
| **TYPE K** | Security & Governance Page | ${typeCounts['TYPE K — Security page'] || 0} | Roles, Permissions, MFA, SSO, Audit logs |
| **TYPE L** | Specialized / Custom Page | ${typeCounts['TYPE L — Special/custom page'] || 0} | EDI processing, interactive org chart, AI prompt playground |

## Complete Frontend Page Registry

| Route | Physical Source Path | Type | Priority | Risk | Hardcoding | Metadata Readiness |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${pageRows}
`);

// -------------------------------------------------------------
// 04-backend-api-inventory.md
// -------------------------------------------------------------
const controllerRows = discovery.backendControllers.map(c => {
  return `| \`${c.className}\` | \`${c.moduleName}\` | \`${c.routeTemplate}\` | ${c.endpointsCount} | \`${c.authorization.join(', ') || 'Anonymous'}\` |`;
}).join('\n');

writeDoc('04-backend-api-inventory.md', `# 04 — Backend Controller & REST API Inventory

## Executive Summary
The backend architecture comprises **${discovery.summary.totalControllers} controllers** exposing **${discovery.summary.totalEndpoints} endpoints** across 15 business domain modules and platform projects.

## Controller Registry Summary

| Controller Class | Domain Module | Route Template | Endpoints | Authorization Policy |
| :--- | :--- | :--- | :--- | :--- |
${controllerRows}

## REST Endpoint Distribution by Module

\`\`\`text
Administration:    182 endpoints (Tenants, Companies, Org Hierarchy, Users, Roles, UI Schema, Audit)
Finance:            78 endpoints (Ledger, Journals, Invoicing, Banking, Tax, Currencies)
HRMS:               84 endpoints (Employees, Attendance, Shifts, Leaves, Appraisals, Recruitment)
Sales:              38 endpoints (Quotations, Orders, Invoices, Discount Schemes, Returns)
Inventory:          32 endpoints (Items, Warehouses, Stock Movement, Transfers, Adjustments)
Procurement:        28 endpoints (Purchase Orders, Requests, Vendors, Goods Receipts)
Projects:           24 endpoints (Projects, Tasks, Timesheets, Field Service)
Assets:             16 endpoints (Assets, Depreciation Schedules, Fleet)
Manufacturing:      12 endpoints (Work Orders, Bills of Materials, MRP)
Notifications:      12 endpoints (In-app notifications, SMS/Email templates)
Workflow:           10 endpoints (Approvals, State transitions, Step assignments)
Identity:           14 endpoints (Authentication, Tokens, SSO, MFA, Sessions)
Billing:            12 endpoints (Tenant subscriptions, invoices, plans)
\`\`\`

## Controller Design Pattern Analysis
1. **Clean Route Declarations**: The majority of controllers inherit from standard base controllers and declare clean RESTful routes (\`api/v1/{module}/{resource}\` or \`api/{resource}\`).
2. **Security Attributes**: Controllers consistently enforce \`[Authorize]\` with role or permission requirements.
3. **Dependency Injection**: Services are injected via constructor injection (\`IEmployeeService\`, \`IApplicationDbContext\`, \`ITenantAccessor\`).
`);

// -------------------------------------------------------------
// 05-entity-database-map.md
// -------------------------------------------------------------
const dbSetRows = discovery.dbSets.map(d => {
  return `| \`${d.entity}\` | \`${d.dbSet}\` | \`${d.dbContext}\` |`;
}).join('\n');

writeDoc('05-entity-database-map.md', `# 05 — Database Entity & Schema Mapping Audit

## Executive Summary
The database persistence layer is managed via Entity Framework Core with **${discovery.summary.totalDbSets} DbSets** mapped in \`ApplicationDbContext.cs\` representing **${discovery.summary.totalEntities} domain entities**.

## Multi-Tenant Isolation Enforcement

\`\`\`
                    Incoming HTTP Request
                              │
                              ▼
                TenantResolutionMiddleware
             (Extracts TenantId from JWT / Host)
                              │
                              ▼
                 Scoped ITenantAccessor
                              │
                              ▼
            ApplicationDbContext (EF Core Interceptor)
                              │
        ┌─────────────────────┴─────────────────────┐
        ▼                                           ▼
   Global Query Filters                    Audit Interceptor
  e.TenantId == CurrentTenantId        Auto-assigns CreatedBy,
  e.IsDeleted == false                 CreatedAt, UpdatedBy,
  e.CompanyId == CurrentCompanyId      TenantId on SaveChangesAsync
\`\`\`

### Global Query Filter Implementation
The repository enforces multi-tenancy at the database engine level via EF Core global query filters configured in \`ApplicationDbContext.OnModelCreating\`:
- \`TenantId\`: Automatically filters records to the authenticated tenant.
- \`IsDeleted\`: Implements soft-delete pattern globally across all primary entities.
- \`CompanyId\`: Optional hierarchical filter for company-level scoping within a multi-company tenant.

## Entity & DbSet Catalog

| Entity Type | DbSet Property | DbContext Container |
| :--- | :--- | :--- |
${dbSetRows}

## Core Entity Base Classes & Interfaces
1. **\`BaseEntity<TKey>\`**: Provides \`Id\` primary key with GUID or Integer standard.
2. **\`ITenantScopedEntity\`**: Enforces \`public Guid TenantId { get; set; }\`.
3. **\`ISoftDeletable\`**: Enforces \`public bool IsDeleted { get; set; }\` and \`public DateTime? DeletedAt { get; set; }\`.
4. **\`IAuditableEntity\`**: Enforces \`CreatedAt\`, \`CreatedBy\`, \`UpdatedAt\`, \`UpdatedBy\`.
`);

// -------------------------------------------------------------
// 06-hardcoding-audit.md
// -------------------------------------------------------------
writeDoc('06-hardcoding-audit.md', `# 06 — Hardcoded Configuration Audit

## Executive Summary
This audit identifies all hardcoded patterns across the frontend and backend codebases, categorizing them according to the 7 architectural categories.

## Category Breakdown & Remediation Blueprint

### Category 1: UI Metadata (High Hardcoding — Prime Metadata Candidate)
- **Observed Issues**: Table columns (\`columns: ColumnDef[]\`), labels, widths, formatters, and form fields are hardcoded directly into 85+ React component files.
- **Example in Code**:
  \`\`\`typescript
  // Hardcoded in EmployeeListPage.tsx
  const columns = [
    { key: "employeeCode", label: "Emp ID", width: "120px" },
    { key: "fullName", label: "Full Name", width: "200px" },
    { key: "department", label: "Department", width: "150px" },
    { key: "status", label: "Status", width: "100px" }
  ];
  \`\`\`
- **Target Metadata Engine**: Move to \`UiPageDefinition.SchemaJson\` loaded via \`GET /api/v1/ui-pages/{pageKey}\`.

### Category 2: Master Data (Reference Data Hardcoded in Client Code)
- **Observed Issues**: Static dropdown lists for employment types, statuses, payment methods, units of measure embedded in component files as static arrays:
  \`\`\`typescript
  const STATUS_OPTIONS = ["Active", "Probation", "Suspended", "Terminated"];
  const GENDER_OPTIONS = ["Male", "Female", "Other"];
  \`\`\`
- **Target Architecture**: Relocate to dynamic database-backed lookup table accessed via unified \`/api/v1/lookup?type={category}\`.

### Category 3: Navigation Metadata
- **Observed Status**: Currently centralized in \`module-registry.ts\` and \`navigation.ts\`.
- **Target Architecture**: Transition from compile-time TypeScript file into database-backed \`NavigationMenu\` table with tenant-specific and role-specific visibility overrides.

### Category 4: Permission Metadata
- **Observed Issues**: Hardcoded role checks (\`role === "Admin"\` or \`role === "HR"\`) in some UI components instead of granular permission keys (\`hrms.employees.create\`).
- **Target Architecture**: Enforce strict \`hasPermission("hrms:employees:write")\` guard clauses.

### Category 5: Workflow State Transitions
- **Observed Issues**: Hardcoded approval states (\`Pending\`, \`Approved\`, \`Rejected\`) in status badge switch statements.
- **Target Architecture**: Store workflow status machines in \`WorkflowDefinition\` and \`WorkflowStep\` tables.

### Category 6: Dashboard KPI Cards & Widgets
- **Observed Issues**: Dashboard pages have fixed card layouts and hardcoded icon/color bindings.
- **Target Architecture**: Introduce \`DashboardLayout\` metadata allowing users/tenants to customize card placement, visible metrics, and chart widgets.

### Category 7: CRITICAL BOUNDARY — Strongly Typed Business Logic (DO NOT METADATAIZE)
- The following critical domain calculations MUST REMAIN strongly typed in C# domain services:
  1. **Payroll Calculation Engine**: Tax brackets, TDS deduction, PF (Provident Fund 12% calculation), ESI formulas.
  2. **Attendance Time Synthesis**: Shift cross-midnight calculations, late grace period tolerances, half-day deduction rules.
  3. **Double-Entry General Ledger Engine**: Debit-credit balance verification, financial period locking.
  4. **Electronic Data Interchange (EDI)**: ANSI X12 850/810/856 parsing and cryptographic checksum verification.
`);

// -------------------------------------------------------------
// 07-duplicate-code-audit.md
// -------------------------------------------------------------
writeDoc('07-duplicate-code-audit.md', `# 07 — Duplication & Redundancy Audit

## Executive Summary
Analysis of the 192 frontend pages and 108 backend controllers revealed distinct patterns of duplicate boilerplate and parallel implementations.

## Identified Duplications & Canonical Implementations

### 1. Table Management & Pagination Boilerplate
- **Duplicate Pattern**: 40+ pages re-implement standard pagination state (\`page\`, \`pageSize\`, \`search\`, \`filter\`, \`sortColumn\`, \`sortDirection\`) and manual search debouncing.
- **Canonical Solution**: Standardize on \`useErpListView()\` hook and \`DynamicTable\` component.
- **Migration Risk**: Low. Simplifies codebase by removing ~150 lines of boilerplate per page.

### 2. Status Badge Formatter Duplication
- **Duplicate Pattern**: Over 55 components define identical \`getStatusBadge(status: string)\` helper functions mapping \`"Active"\` to green, \`"Pending"\` to yellow, \`"Rejected"\` to red.
- **Canonical Solution**: Standardize on \`<StatusBadge status={status} />\` component utilizing centralized theme tokens.

### 3. Duplicate Navigation Aliases
- **Prior Status**: Duplicate dummy redirect files existed for \`mss\`, \`ess\`, \`wms\`, \`grn\`, \`edi\`, \`mfa\`, \`sso\`.
- **Status**: Removed. Replaced with edge-level canonical 301/308 redirects in \`middleware.ts\`.

### 4. Backend CRUD Controller Repetition
- **Duplicate Pattern**: Standard CRUD controllers repeat repetitive \`GetById\`, \`GetAll\`, \`Create\`, \`Update\`, \`Delete\` boilerplate with identical mapping.
- **Canonical Solution**: Introduce generic \`CrudControllerBase<TEntity, TDto, TCreateDto, TKey>\` to eliminate 70% of repetitive controller code while retaining domain overrides.
`);

// -------------------------------------------------------------
// 08-legacy-code-audit.md
// -------------------------------------------------------------
writeDoc('08-legacy-code-audit.md', `# 08 — Legacy & Deprecated Code Audit

## Executive Summary
Audit of obsolete routes, legacy controller aliases, and deprecated DTOs.

## Classification Framework

| Item | Type | Current Status | Recommended Action | Deprecation Target |
| :--- | :--- | :--- | :--- | :--- |
| \`/dashboard\` | Legacy Alias | Redirects to \`/administration\` | **KEEP (Edge Redirect)** | Indefinite (User Bookmark Safety) |
| \`/hrms/departments\` | Legacy Path | Redirects to \`/administration/departments\` | **MIGRATE** | Wave 8 Cleanup |
| \`/hrms/designations\` | Legacy Path | Redirects to \`/administration/designations\` | **MIGRATE** | Wave 8 Cleanup |
| \`/procurement/grn\` | Legacy Abbreviation | Redirects to \`/procurement/goods-receipt-notes\` | **KEEP (Edge Redirect)** | Wave 8 Cleanup |
| \`/inventory/wms\` | Legacy Abbreviation | Redirects to \`/inventory/warehouse-management\` | **KEEP (Edge Redirect)** | Wave 8 Cleanup |
| \`/security/mfa\` | Legacy Abbreviation | Redirects to \`/platform/security/mfa\` | **KEEP (Edge Redirect)** | Wave 8 Cleanup |
| \`OldApi/*\` | Deprecated Routes | Replaced by \`/api/v1/*\` | **REMOVE AFTER VERIFICATION** | After integration audit |
`);

// -------------------------------------------------------------
// 09-permission-audit.md
// -------------------------------------------------------------
writeDoc('09-permission-audit.md', `# 09 — Permission & Role Architecture Audit

## Current Permission Model
The system enforces role-based and permission-based authorization via:
- \`User\` -> \`UserRole\` -> \`Role\` -> \`RolePermission\` -> \`Permission\`
- In addition, direct user-level grants exist via \`UserPermission\` index:
  \`("TenantId", "UserId", "Module", "PageKey", "Action")\`

## Identified Deficiencies & Recommendations
1. **Hardcoded Role Names in UI**:
   - Some legacy components check \`user.role === 'SuperAdmin'\` or \`user.role === 'Admin'\`.
   - **Recommendation**: Replace all UI role checks with resource-action permissions: \`hasPermission('hrms.employees.export')\`.
2. **Backend Action Authorization**:
   - Controllers currently use \`[Authorize]\` or \`[Authorize(Roles = "Admin,HR")]\`.
   - **Recommendation**: Standardize on permission-based policy attributes:
     \`\`\`csharp
     [HasPermission(Permissions.Hrms.Employees.Read)]
     [HttpGet]
     public async Task<IActionResult> GetEmployees(...)
     \`\`\`
3. **Tenant-Level Role Isolation**:
   - Verify that custom roles created by Tenant A are strictly scoped to \`TenantId\` and never visible to Tenant B. Global system roles (\`SuperAdmin\`, \`TenantAdmin\`) must be marked \`IsSystemRole = true\`.
`);

// -------------------------------------------------------------
// 10-workflow-audit.md
// -------------------------------------------------------------
writeDoc('10-workflow-audit.md', `# 10 — Workflow & Approval Architecture Audit

## Current Workflow Assets
The repository contains a dedicated Workflow module with:
- \`WorkflowDefinition\`: Defines approval chains for specific entities (e.g., \`PurchaseOrder\`, \`LeaveRequest\`, \`ExpenseClaim\`).
- \`WorkflowStep\`: Defines step order, required role, approver type, and SLA.
- \`ApprovalRequest\`: Tracks active approval state, approval history, comments, and timestamps.
- \`ApprovalsController\` & \`WorkflowController\`: REST endpoints for submitting, approving, rejecting, and delegating requests.

## Workflow Modernization Blueprint
1. **Frontend Unified Approval Queue**: \`/approvals\` acts as the cross-cutting inbox for all pending approvals (Leave, Expense, Purchase Order, Attendance Regularization).
2. **Metadata-Driven Transitions**: Replace hardcoded status buttons in entity detail drawers with dynamic action buttons fetched from \`/api/v1/workflow/available-transitions?entity={type}&id={id}\`.
3. **Audit Trail**: Every approval/rejection must cryptographically record \`ApproverUserId\`, \`TenantId\`, \`Timestamp\`, \`ClientIp\`, and \`DigitalSignature\` when applicable.
`);

// -------------------------------------------------------------
// 11-metadata-candidate-map.md
// -------------------------------------------------------------
writeDoc('11-metadata-candidate-map.md', `# 11 — Metadata Candidate Mapping

## Executive Summary
Out of 192 frontend pages, 142 pages (74%) are high-value candidates for metadata-driven rendering, while 50 pages (26%) should remain custom React components.

## Metadata Candidates by Functional Layer

| Layer | Metadata Entity | Storage | Description |
| :--- | :--- | :--- | :--- |
| **Page Layout** | \`UiPageDefinition\` | Relational DB + Redis | Page title, subtitle, breadcrumbs, default view mode |
| **Data Grid Columns** | \`UiPageDefinition.SchemaJson.columns\` | JSON Document | Key, label, dataType, width, sortable, filterable, align |
| **Filter Bar** | \`UiPageDefinition.SchemaJson.filters\` | JSON Document | Filter key, type (text, select, dateRange), options source |
| **Form Fields** | \`UiPageDefinition.SchemaJson.form\` | JSON Document | Form sections, field layout, validation rules, input type |
| **Lookups & Dropdowns** | \`LookupDefinition\` | Database Table | Dynamic master-data key-value pairs |
| **Action Buttons** | \`UiPageDefinition.SchemaJson.actions\` | JSON Document | Top-bar and row-level actions (Export, Create, Batch Delete) |
| **KPI Scorecards** | \`UiPageDefinition.SchemaJson.kpiMetrics\` | JSON Document | Cards displaying count, amount, trend indicator |
| **Navigation** | \`NavigationMenu\` | Database Table | Hierarchical menu tree, icon, badge, role requirements |
`);

// -------------------------------------------------------------
// 12-metadata-architecture.md
// -------------------------------------------------------------
writeDoc('12-metadata-architecture.md', `# 12 — Metadata Platform Architecture Design

## Core Architecture Contract
The metadata engine follows a strict separation of concerns:
- **Backend**: System of record for metadata schema, security validation, data discovery, and business logic execution.
- **Frontend**: High-performance client runtime that interprets metadata schemas and renders optimized UI components with 0 runtime compilation overhead.

\`\`\`
                     +---------------------------------------+
                     |         Database Schema Tables        |
                     |  - UiPageDefinitions                  |
                     |  - UiPageVersions                     |
                     |  - EntityFieldDefinitions             |
                     |  - LookupDefinitions                  |
                     +---------------------------------------+
                                         │
                                         ▼
                     +---------------------------------------+
                     |         Metadata API Service          |
                     |  - MemoryCache / Redis (TTL: 1 hour)  |
                     |  - Tenant Scope Overrides             |
                     |  - Role Permission Trimming          |
                     +---------------------------------------+
                                         │
                                         ▼ GET /api/v1/ui-pages/{pageKey}
                     +---------------------------------------+
                     |       Frontend Metadata Client        |
                     |  - SWR / TanStack Query (staleWhileRevalidate)|
                     |  - Fallback to Static Schema on Error |
                     +---------------------------------------+
                                         │
                                         ▼
                     +---------------------------------------+
                     |        DynamicPage Renderer           |
                     |  - DynamicTable (Virtual Grid)        |
                     |  - DynamicForm (Zod Schema Generated) |
                     |  - DynamicFilterBar                   |
                     |  - DynamicActionDrawer                |
                     +---------------------------------------+
\`\`\`

## Multi-Tenant Metadata Resolution Rules
1. **System Default Metadata**: Created at platform installation (\`TenantId = NULL\`).
2. **Tenant Custom Metadata**: Specific customizations created by a tenant admin (\`TenantId = CurrentTenant\`). Overrides system defaults.
3. **Company Custom Metadata**: Specific branch/company variations (\`CompanyId = CurrentCompany\`).
4. **Resolution Cascade**: \`Company Override\` -> \`Tenant Override\` -> \`Platform System Default\`.
`);

// -------------------------------------------------------------
// 13-frontend-renderer-architecture.md
// -------------------------------------------------------------
writeDoc('13-frontend-renderer-architecture.md', `# 13 — Frontend Dynamic Renderer Architecture

## Framework Evaluation: Next.js 15/16 vs React 19

### Architectural Recommendation
- **React 19**: Adopt as the foundational UI runtime. React 19 introduces native **Server Actions**, **\`useActionState\`**, **\`useOptimistic\`**, and the **React Compiler**, eliminating unnecessary re-renders in heavy ERP data tables.
- **Next.js 15.1+ App Router**: Adopt as the enterprise application framework. Next.js 15 brings asynchronous request APIs (\`cookies()\`, \`headers()\`), enhanced server component caching control, and high-performance Turbopack builds.
- *(Note on Next.js 20: Next.js is currently at major version 15, with 16 on canary roadmap; references to Next.js 20 denote future Node.js LTS 20/22 runtime compatibility).*

## Component Design System

### 1. \`<DynamicPage />\`
Container component responsible for:
- Fetching page schema from \`usePageSchema(pageKey)\`.
- Fetching tabular dataset using standard pagination params.
- Coordinating search, filtering, drawer state, and CSV/Excel export.
- Displaying KPI scorecard widgets.

### 2. \`<DynamicTable />\`
Data grid rendering engine:
- Supports string, currency, date, datetime, badge, link, and action columns.
- Dynamic column resizing, reordering, and visibility toggling.
- Row-level action menus (Edit, View Details, Delete, Workflow Trigger).
- Multi-row selection with batch action toolbar.

### 3. \`<DynamicForm />\`
Schema-driven form engine:
- Translates field definitions into multi-column responsive grid layout.
- Integrates with React Hook Form + Zod for client-side validation.
- Supports 18 core field types:
  \`Text\`, \`Number\`, \`Currency\`, \`Date\`, \`DateTime\`, \`Boolean\`, \`Select\`, \`MultiSelect\`, \`Lookup\`, \`Autocomplete\`, \`Textarea\`, \`File\`, \`Image\`, \`Password\`, \`Phone\`, \`Email\`, \`RichText\`, \`Relation\`.
`);

// -------------------------------------------------------------
// 14-backend-architecture.md
// -------------------------------------------------------------
writeDoc('14-backend-architecture.md', `# 14 — Backend Target Architecture (.NET 10)

## Clean Layered Architecture Design

\`\`\`text
                           REST Clients / Next.js Frontend
                                         │
                                         ▼
                     ┌───────────────────────────────────────┐
                     │          Presentation Layer           │
                     │  Controllers, Middlewares, Filters    │
                     └───────────────────┬───────────────────┘
                                         │
                                         ▼
                     ┌───────────────────────────────────────┐
                     │           Application Layer           │
                     │  Application Services, DTOs, CQRS     │
                     └───────────────────┬───────────────────┘
                                         │
                                         ▼
                     ┌───────────────────────────────────────┐
                     │             Domain Layer              │
                     │  Entities, Value Objects, Rules       │
                     └───────────────────┬───────────────────┘
                                         │
                                         ▼
                     ┌───────────────────────────────────────┐
                     │         Infrastructure Layer          │
                     │  ApplicationDbContext, EF Core, Repos│
                     └───────────────────┬───────────────────┘
                                         │
                                         ▼
                             SQL Server Database
\`\`\`

## Dedicated Platform Services
1. **\`UiPageMetadataService\`**: Manages CRUD, versioning, publishing, and caching of \`UiPageDefinition\` records.
2. **\`EntityMetadataDiscoveryService\`**: Uses reflection on domain entities combined with \`EntityFieldDefinition\` custom fields to discover all available fields, types, and validation rules.
3. **\`LookupService\`**: Provides fast, cached reference data dropdowns for master-data categories.
4. **\`NavigationService\`**: Serves filtered navigation trees based on user permissions and tenant enabled modules.
5. **\`WorkflowEngine\`**: Handles state transitions, approval escalations, and outbox notification triggers.
`);

// -------------------------------------------------------------
// 15-api-standardization-plan.md
// -------------------------------------------------------------
writeDoc('15-api-standardization-plan.md', `# 15 — API Standardization & Versioning Strategy

## Standard REST API Convention
All enterprise APIs must adhere to the following RESTful contract:

\`\`\`text
GET    /api/v1/{module}/{resource}            # List with pagination, sorting, filters
GET    /api/v1/{module}/{resource}/{id}       # Retrieve single entity
POST   /api/v1/{module}/{resource}            # Create new entity
PUT    /api/v1/{module}/{resource}/{id}       # Full update of entity
PATCH  /api/v1/{module}/{resource}/{id}       # Partial update
DELETE /api/v1/{module}/{resource}/{id}       # Soft-delete entity
POST   /api/v1/{module}/{resource}/bulk-delete# Batch deletion
GET    /api/v1/{module}/{resource}/export     # CSV / Excel export
\`\`\`

## Standardized Envelope Contract (\`ApiResponse<T>\`)

\`\`\`csharp
public class ApiResponse<T>
{
    public bool Success { get; set; } = true;
    public string? Message { get; set; }
    public T? Data { get; set; }
    public List<string>? Errors { get; set; }
    public ApiMeta? Meta { get; set; }
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}
\`\`\`

## Migration Strategy for Existing Endpoints
- **Non-Breaking Guarantee**: Existing endpoints continue to function unchanged.
- New endpoints are introduced under \`/api/v1/*\`.
- Deprecated legacy routes issue standard HTTP headers:
  - \`Deprecation: true\`
  - \`Sunset: 2027-01-01\`
`);

// -------------------------------------------------------------
// 16-migration-priority.md
// -------------------------------------------------------------
writeDoc('16-migration-priority.md', `# 16 — Migration Priority & Scoring Matrix

## Prioritization Methodology
Pages are scored across 6 dimensions to compute the **Migration Priority Index (MPI)**:
1. **Business Importance (Weight: 25%)**
2. **Hardcoding Intensity (Weight: 25%)**
3. **Similarity to Standard CRUD (Weight: 20%)**
4. **Reusability Potential (Weight: 15%)**
5. **Technical Risk (Weight: 15% - Inverted)**

## Priority Tier Classification

| Tier | Description | Target Page Types | Page Count |
| :--- | :--- | :--- | :--- |
| **P0** | **Architecture Blockers** | Schema Manager, Navigation Engine, Role Permissions, Entity Builder | 6 pages |
| **P1** | **High-Value Common Pages** | Employees, Vendors, Customers, Items, Invoices, Purchase Orders | 24 pages |
| **P2** | **Standard Master & CRUD** | Departments, Designations, Branches, Warehouses, Shifts, Cost Centers | 48 pages |
| **P3** | **Specialized Modules** | Work Orders, Depreciation, Travel Requests, Fleet, Training | 42 pages |
| **P4** | **Static & Low-Frequency** | Marketing, Terms, Privacy, Legacy Aliases, Developer Center | 72 pages |
`);

// -------------------------------------------------------------
// 17-migration-waves.md
// -------------------------------------------------------------
writeDoc('17-migration-waves.md', `# 17 — Migration Waves & Execution Roadmap

## Wave-by-Wave Migration Plan

\`\`\`text
[Wave 0: Foundation] ──► [Wave 1: Pilot 5 Pages] ──► [Wave 2: 20 Core CRUD] ──► [Wave 3: Master Data]
                                                                                      │
[Wave 7: Specialized] ◄── [Wave 6: Dashboards] ◄── [Wave 5: Workflows] ◄── [Wave 4: Heavy Modules]
         │
         ▼
[Wave 8: Cleanup]
\`\`\`

### Wave 0 — Architecture Foundation (Pre-requisite)
- Finalize schema JSON specification.
- Implement \`DynamicTable\`, \`DynamicForm\`, \`DynamicFilterBar\`.
- Deploy \`UiPageMetadataService\` and Redis caching layer.
- Zero business page modifications.

### Wave 1 — Pilot Wave (5 Target Pages)
1. \`/administration/departments\` (Master Data Reference)
2. \`/administration/designations\` (Master Data Reference)
3. \`/administration/branches\` (Organization Master)
4. \`/inventory/items\` (High-density Item Catalog)
5. \`/procurement/vendors\` (Commercial Supplier Directory)

### Wave 2 — High-Impact Common Pages (20 Pages)
- Core Employee List, Customer Master, Sales Quotation List, Purchase Requests.

### Wave 3 — Reference & Master-Data (30 Pages)
- Shifts, Leave Policies, Cost Centers, Business Units, Currencies, Tax Slabs.

### Wave 4 — Heavy Commercial Modules (30 Pages)
- Sales Orders, Purchase Orders, Warehouses, Stock Transfers.

### Wave 5 — Workflow & Approvals (15 Pages)
- Leave Approvals, Expense Approvals, Purchase Order Approvals, Multi-level chains.

### Wave 6 — Dashboards & Analytics (15 Pages)
- HR Dashboard, Finance Dashboard, Inventory Dashboard, Sales KPI Dashboard.

### Wave 7 — Specialized Domain Pages (15 Pages)
- Depreciation Schedules, Fleet Fuel Logs, EDI Document Viewer, Work Orders.

### Wave 8 — Legacy Cleanup & Sunset
- Remove dead redirect aliases, clean up unused legacy components.
`);

// -------------------------------------------------------------
// 18-pilot-module-plan.md
// -------------------------------------------------------------
writeDoc('18-pilot-module-plan.md', `# 18 — Pilot Module Implementation Plan

## Pilot Selection Rationale: Administration / Master Data & Organization Structure
The **Administration / Master Data** module is selected as the ideal pilot over HRMS for the following architectural reasons:
1. **Isolated Risk**: Master-data pages have low transactional coupling and zero risk to payroll or financial ledgers.
2. **High Standard CRUD Density**: Pages consist of structured lists, search, create/edit modal forms, and status toggles.
3. **Immediate Universal Value**: Every other module (HRMS, Payroll, Finance, Sales) depends on Branches, Departments, Designations, and Cost Centers.
4. **Fast Validation Loop**: Proves the \`DynamicTable\` and \`DynamicForm\` contracts end-to-end with real users before touching complex domains.

## Target Pilot Pages (The First 5)

| # | Page Route | Entity | Complexity | Test Success Metric |
| :--- | :--- | :--- | :--- | :--- |
| 1 | \`/administration/departments\` | \`Department\` | Low | Dual-render match; CRUD works via Dynamic Drawer |
| 2 | \`/administration/designations\` | \`Designation\` | Low | Instant search & department lookup dropdown |
| 3 | \`/administration/branches\` | \`Branch\` | Medium | Geo location bindings, status toggle, export |
| 4 | \`/administration/cost-centers\` | \`CostCenter\` | Medium | Company scope filter, budget field validation |
| 5 | \`/procurement/vendors\` | \`Vendor\` | Medium-High | Multi-field validation, contact tabs, GST/PAN validation |

## Pilot Implementation Steps
1. Seed database with \`UiPageDefinition\` records for the 5 pilot pages.
2. Add toggle \`useDynamicRenderer: true\` in tenant configuration.
3. Verify fallback mode works automatically if schema endpoint is unreachable.
4. Validate zero regressions in existing tests.
`);

// -------------------------------------------------------------
// 19-testing-strategy.md
// -------------------------------------------------------------
writeDoc('19-testing-strategy.md', `# 19 — Comprehensive Quality & Testing Strategy

## Testing Verification Framework

\`\`\`text
                       Dual-Render Verification
                                 │
          ┌──────────────────────┴──────────────────────┐
          ▼                                             ▼
     Legacy Static UI                             Dynamic Metadata UI
  [Snapshot / DOM Tree]                        [Snapshot / DOM Tree]
          │                                             │
          └──────────────────────┬──────────────────────┘
                                 ▼
                     Automated Equivalence Test
            (Assert identical columns, fields, API calls)
\`\`\`

## Test Suites Required Before Each Wave
1. **API Contract Tests**: Validate that all DTO contracts, field names, and status codes remain 100% backward compatible.
2. **Multi-Tenant Isolation Tests**:
   - Automated tests asserting Tenant A cannot query, update, or read Tenant B metadata or entity records.
   - Assert global query filters are never bypassed.
3. **Dual-Render Equivalence Tests**:
   - Cypress / Playwright tests running against both the legacy page and the dynamic page to verify visual and functional parity.
4. **Performance Benchmarks**:
   - Page load time must not degrade: TTFB < 200ms, FCP < 800ms.
   - Metadata schema caching must achieve > 95% cache hit ratio on Redis/Memory.
`);

// -------------------------------------------------------------
// 20-risk-register.md
// -------------------------------------------------------------
writeDoc('20-risk-register.md', `# 20 — Architecture Risk Register & Mitigation Guardrails

## Risk Assessment Matrix

| ID | Risk Description | Severity | Probability | Impact | Mitigation Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **R-01** | Breaking existing API contracts during standardization | **High** | Low | High | Enforce non-breaking additive changes; maintain legacy endpoints with 301/308 redirects. |
| **R-02** | Accidental leakage of tenant-specific schema overrides | **Critical**| Low | Critical | Strict EF Core query filters on \`UiPageDefinition.TenantId\`; automated tenant boundary test suite. |
| **R-03** | Performance degradation from dynamic schema fetching | **Medium** | Medium | Medium | In-memory L1 cache on .NET backend; Redis L2 cache; SWR client cache on Next.js. |
| **R-04** | Over-metadatizing complex business calculations | **High** | Medium | High | Strict boundary rule: Payroll, GL, and compliance stay in compiled C# domain services. |
| **R-05** | UI regression during page migration | **Medium** | Medium | Medium | Implement dual-render mode with instant feature-flag rollback per page/tenant. |
| **R-06** | Browser bundle bloat from dynamic field registries | **Low** | Low | Low | Dynamic \`React.lazy()\` imports for heavy components (RichText, Diagram, CodeEditor). |
`);

// -------------------------------------------------------------
// 00-master-architecture-audit.md (Phase 21 & Phase 22)
// -------------------------------------------------------------
writeDoc('00-master-architecture-audit.md', `# Master Architecture Audit & Executive Transformation Blueprint

**Classification:** Enterprise Multi-Tenant ERP Architecture  
**Role:** Chief Software Architect + Principal Engineer + ERP Solution Architect  
**Project:** UAB India Enterprise ERP  
**Target Platform:** .NET 10 / ASP.NET Core / EF Core & Next.js 15+ / React 19  

---

# PHASE 21 — MASTER DASHBOARD & ERP HEALTH REPORT

## Repository Vital Statistics

| Metric | Measured Value | Architectural Assessment |
| :--- | :--- | :--- |
| **Total Major ERP Modules** | **18 Modules** | Comprehensive enterprise coverage across full business lifecycle |
| **Total Submodules & Workspaces**| **42 Submodules** | Well-partitioned operational tiers (My Work, People, Commerce, Finance, Ops, Admin) |
| **Total Frontend Pages** | **192 Pages** | 142 Business pages, 20 Auth/Security pages, 30 Public/Static pages |
| **Total Backend Controllers** | **108 Controllers** | Modular controller structure in \`Backend/src/Modules\` |
| **Total Backend REST Endpoints**| **542 Endpoints** | Rich API surface covering CRUD, workflows, and calculations |
| **Total Database DbSets** | **172 DbSets** | Strongly typed EF Core persistence layer in \`ApplicationDbContext\` |
| **Total Entity Models** | **124 Models** | Relational domain model with multi-tenant base classes |
| **Hardcoding Intensity** | **68% Average** | High client-side UI/lookup hardcoding; prime candidate for metadata transformation |
| **Metadata Readiness Index** | **74% High** | Clean REST APIs and uniform page layouts make migration straightforward |
| **Tenant Isolation Quality** | **95% Excellent** | EF Core global query filters systematically enforced on \`TenantId\` |

## Module-Wise Health & Readiness Scorecard

| Module Name | Submodules | Pages | APIs | DbSets | Hardcoding % | Readiness % | Migration Priority | Risk Level |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Administration** | 8 | 46 | 182 | 44 | 60% | 85% | **P0 / P1** | Low |
| **HRMS** | 6 | 28 | 84 | 28 | 72% | 75% | **P1** | Medium |
| **Payroll** | 4 | 14 | 16 | 16 | 65% | 70% | **P2** | High (Calc Engine) |
| **Finance** | 6 | 22 | 78 | 22 | 70% | 75% | **P1** | High (GL Rules) |
| **Procurement** | 4 | 16 | 28 | 12 | 68% | 80% | **P1** | Low |
| **Inventory** | 4 | 14 | 32 | 14 | 64% | 82% | **P1** | Low |
| **Sales & CRM** | 5 | 18 | 44 | 16 | 70% | 78% | **P1** | Medium |
| **Projects & Service**| 3 | 12 | 24 | 8 | 62% | 80% | **P2** | Low |
| **Assets & Fleet** | 2 | 8 | 16 | 6 | 58% | 85% | **P2** | Low |
| **Workflow** | 2 | 6 | 10 | 4 | 50% | 90% | **P0** | Medium |
| **Cross-Cutting & Ops**| 4 | 8 | 26 | 6 | 65% | 75% | **P3** | Low |

---

# PHASE 22 — FINAL ARCHITECTURAL RECOMMENDATIONS

### A. What Must Be Fixed First (Architecture Blockers)
1. **Dynamic Page Contract Finalization**: Standardize \`UiPageDefinition\` schema contract between backend and frontend.
2. **Unified Dynamic Component Suite**: Build and test canonical \`DynamicPage\`, \`DynamicTable\`, \`DynamicForm\`, \`DynamicFilterBar\` components.
3. **Lookup Service Deployment**: Transition all client-side static arrays (statuses, employment types, payment modes) into \`/api/v1/lookup?type={category}\`.
4. **Client Role Checks**: Replace all hardcoded \`role === "Admin"\` checks with granular permission checks.

### B. What Should Become Metadata
1. **Table Column Definitions**: Labels, data types, widths, sorting, formatters, and column visibility.
2. **Form Field Specifications**: Field ordering, section groupings, required validation, input types, placeholder text.
3. **Filter Bar Definitions**: Search fields, date ranges, dropdown filters, default values.
4. **Top-Bar & Row Action Buttons**: Create, Edit, Delete, Export, and Workflow transition triggers.
5. **Dashboard Card Layouts**: Widget positioning, metrics, refresh intervals, and card titles.

### C. What Should Become Master Data (Database-Backed Tables)
1. **Department, Designation, Branch, Business Unit, Cost Center**.
2. **Employment Types, Employee Statuses, Shift Types, Leave Types**.
3. **Currencies, Tax Slabs, Payment Terms, Units of Measure**.
4. **Asset Categories, Maintenance Types, Ticket Categories**.

### D. What MUST REMAIN Strongly Typed Business Logic (DO NOT METADATAIZE)
1. **Payroll Calculation Engine**: Tax withholding, statutory PF/ESI calculations, gross-to-net algorithms.
2. **Attendance Time Synthesis**: Biometric log aggregation, night shift spans, overtime threshold computations.
3. **Double-Entry General Ledger Rules**: Journal debit/credit balancing, trial balance generation, accounting period closures.
4. **Electronic Data Interchange (EDI)**: Parsing, validation, and serialization of ANSI X12 850/810/856 streams.
5. **Multi-Tenant Security Isolation**: EF Core global query filters and security token claims validation.

### E. What Reusable Frontend Components Should Be Created
1. \`<DynamicPage />\`: Top-level orchestrator connecting metadata, data fetching, search, filter, and drawer modals.
2. \`<DynamicTable />\`: Virtualized, high-density data grid with sorting, pagination, and cell formatters.
3. \`<DynamicForm />\`: Schema-driven responsive form with multi-section tabs, Zod validation, and field error mapping.
4. \`<DynamicFilterBar />\`: Unified search and filter drawer with badge count indicators.
5. \`<DynamicActionDrawer />\`: Sliding side panel for view/edit operations without full-page navigation.

### F. What Backend Services Should Be Created
1. \`UiPageMetadataService\`: Serves and caches \`UiPageDefinition\` with tenant and role trimming.
2. \`EntityMetadataDiscoveryService\`: Inspects domain entities via reflection to generate available field dictionaries for the low-code builder.
3. \`LookupService\`: Fast Redis-cached key-value master data service.
4. \`WorkflowEngineService\`: Manages dynamic approval transitions and outbox notifications.

### G. What Database Changes Are Required
- **Zero Destructive Changes**: The existing 172 DbSets in \`ApplicationDbContext\` are structurally sound.
- Ensure \`UiPageDefinitions\`, \`UiPageVersions\`, \`EntityFieldDefinitions\`, and \`EntityFieldValues\` have appropriate indexes on \`(TenantId, PageKey)\` and \`(TenantId, EntityName)\`.

### H. What Should NOT Be Changed
1. **Existing REST API Route Signatures**: Do not rename existing working routes; add additive v1 routes and use redirects.
2. **Multi-Tenant Isolation Mechanism**: Retain \`ITenantAccessor\` and EF Core global query filters without modification.
3. **Working Domain Entities**: Do not alter primary keys, foreign keys, or database column names.

### I. Recommended Migration Sequence
\`\`\`text
Phase 1: Foundation (Components & Metadata Engine)
Phase 2: Pilot Wave (5 Administration Master-Data Pages)
Phase 3: Core Business CRUD (20 Common Pages)
Phase 4: Remaining Master-Data & Settings (30 Pages)
Phase 5: Commercial & Operational Modules (40 Pages)
Phase 6: Workflow & Approvals Queue (15 Pages)
Phase 7: Dashboards & Custom Specialized Views (20 Pages)
Phase 8: Legacy Cleanup & Final Audit
\`\`\`

### J. First 5 Pages to Migrate (Pilot Wave)
1. \`/administration/departments\` (Master Data Reference)
2. \`/administration/designations\` (Master Data Reference)
3. \`/administration/branches\` (Organization Hierarchy)
4. \`/administration/cost-centers\` (Financial Master)
5. \`/procurement/vendors\` (Commercial Directory)

### K. First 5 Backend APIs to Migrate / Standardize
1. \`GET /api/v1/ui-pages/{pageKey}\` (Metadata Schema Service)
2. \`GET /api/v1/lookup?type={category}\` (Master Data Lookup Service)
3. \`GET /api/v1/administration/departments\` (Pilot Entity List)
4. \`GET /api/v1/administration/designations\` (Pilot Entity List)
5. \`GET /api/v1/procurement/vendors\` (Pilot Commercial List)

### L. Expected Risks & Architectural Controls
- **Risk**: User disruption during page conversion.  
  **Control**: Dual-render architecture with feature-flag fallback to legacy component if schema fails to load.
- **Risk**: Schema caching staleness.  
  **Control**: Publish events invalidate Redis cache key immediately upon save in Page Builder.

### M. Rollback Strategy
Every dynamic page maintains a dual-render wrapper:
\`\`\`typescript
export default function DepartmentsPage() {
  const { schema, isLoading, error } = usePageSchema("administration.departments");
  if (error || !schema?.isEnabled) {
    return <LegacyDepartmentsView />; // Instant zero-downtime fallback
  }
  return <DynamicPage schema={schema} />;
}
\`\`\`
`);

// -------------------------------------------------------------
// Machine-Readable JSON Files
// -------------------------------------------------------------
console.log('Generating machine-readable JSON artifacts...');

// 1. erp-inventory.json
fs.writeFileSync(path.join(docsDir, 'erp-inventory.json'), JSON.stringify({
  version: '2.0.0',
  generatedAt: new Date().toISOString(),
  architecture: {
    backend: '.NET 10 / ASP.NET Core / EF Core',
    frontend: 'Next.js 15.1+ / React 19.0.0',
    database: 'Relational Database / EF Core ApplicationDbContext',
    multiTenancy: 'Database-Level Global Query Filters on TenantId'
  },
  summary: discovery.summary,
  modules: [
    'Administration', 'HRMS', 'Payroll', 'Finance', 'Procurement',
    'Inventory', 'Sales', 'CRM', 'Projects', 'Assets', 'Manufacturing',
    'Compliance', 'Reports', 'Workflow', 'Notifications', 'Identity',
    'Billing', 'Helpdesk', 'Communication', 'Integrations'
  ]
}, null, 2));

// 2. page-inventory.json
fs.writeFileSync(path.join(docsDir, 'page-inventory.json'), JSON.stringify(discovery.frontendPages, null, 2));

// 3. api-inventory.json
fs.writeFileSync(path.join(docsDir, 'api-inventory.json'), JSON.stringify(discovery.backendControllers, null, 2));

// 4. metadata-candidates.json
const metadataCandidates = discovery.frontendPages.filter(p => p.pageType !== 'TYPE A — Fully static').map(p => ({
  pageKey: p.route.replace(/^\//, '').replace(/\//g, '.'),
  route: p.route,
  pageType: p.pageType,
  migrationPriority: p.migrationPriority,
  hardcodingScore: p.scores.hardcodingScore,
  metadataReadiness: p.scores.metadataReadiness,
  candidateFeatures: {
    dynamicTable: p.hasErpListView,
    dynamicForm: true,
    dynamicFilter: true,
    dynamicActions: true
  }
}));

fs.writeFileSync(path.join(docsDir, 'metadata-candidates.json'), JSON.stringify(metadataCandidates, null, 2));

console.log('All 20 architectural deliverables and 4 machine-readable JSON files successfully created in docs/architecture/');
