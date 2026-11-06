# 02 — ERP Module & Submodule Hierarchy Map

## Module Hierarchy Overview
The ERP is structured into 18 functional modules spanning 6 operational workspace sections:

```text
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
```

## End-to-End Vertical Traceability Matrix

| Module | Submodule | Primary Frontend Page | Backend Controller | Application Service | Domain Entity | Database Table |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **HRMS** | Employee Master | `/hrms/employees` | `EmployeesController` | `EmployeeService` | `Employee` | `Employees` |
| **HRMS** | Attendance | `/hrms/attendance` | `AttendanceController` | `AttendanceService` | `AttendanceRecord` | `AttendanceRecords` |
| **HRMS** | Shifts & Roster | `/hrms/shifts` | `ShiftsController` | `ShiftService` | `Shift`, `ShiftAssignment` | `Shifts` |
| **HRMS** | Leave Management | `/hrms/leave` | `LeaveController` | `LeaveService` | `LeaveRequest` | `LeaveRequests` |
| **HRMS** | Recruitment | `/hrms/recruitment` | `RecruitmentController` | `RecruitmentService` | `JobPosting`, `Candidate` | `JobPostings` |
| **Payroll** | Pay Run Execution | `/payroll/runs` | `PayrollController` | `PayrollCalculationEngine` | `PayrollRun` | `PayrollRuns` |
| **Payroll** | Payslips | `/payroll/payslips` | `PayrollController` | `PayslipService` | `Payslip` | `Payslips` |
| **Finance** | General Ledger | `/chart-of-accounts` | `ChartOfAccountsController` | `GeneralLedgerService` | `ChartOfAccount` | `ChartOfAccounts` |
| **Finance** | Journal Entries | `/journal-entries` | `JournalEntriesController` | `JournalEntryService` | `JournalEntry` | `JournalEntries` |
| **Finance** | Invoicing | `/invoices` | `SalesInvoicesController` | `InvoiceService` | `SalesInvoice` | `SalesInvoices` |
| **Finance** | Bank Reconciliation | `/bank-reconciliation` | `BankReconciliationsController` | `BankingService` | `BankReconciliation` | `BankReconciliations` |
| **Procurement** | Purchase Orders | `/purchase-orders` | `PurchaseOrdersController` | `PurchaseOrderService` | `PurchaseOrder` | `PurchaseOrders` |
| **Procurement** | Goods Receipts (GRN) | `/procurement/goods-receipt-notes` | `GoodsReceiptsController` | `GoodsReceiptService` | `GoodsReceiptNote` | `GoodsReceiptNotes` |
| **Inventory** | Item Master | `/items` | `ItemsController` | `InventoryItemService` | `Item` | `Items` |
| **Inventory** | Warehouse Stock | `/warehouses` | `WarehousesController` | `WarehouseService` | `Warehouse`, `StockBalance` | `Warehouses` |
| **Inventory** | Stock Movements | `/stock-movements` | `StockMovementsController` | `StockTransferService` | `StockMovement` | `StockMovements` |
| **Sales** | Sales Orders | `/sales-orders` | `SalesOrdersController` | `SalesOrderService` | `SalesOrder` | `SalesOrders` |
| **Sales** | Customers | `/customers` | `CustomersController` | `CustomerService` | `Customer` | `Customers` |
| **Projects** | Project Master | `/platform/projects` | `ProjectsController` | `ProjectService` | `Project` | `Projects` |
| **Projects** | Task Tracking | `/projects/tasks` | `ProjectTasksController` | `TaskTrackingService` | `ProjectTask` | `ProjectTasks` |
| **Administration** | Tenant Registry | `/administration/tenants` | `TenantsController` | `TenantProvisioningService` | `Tenant` | `Tenants` |
| **Administration** | Company Master | `/administration/companies` | `CompaniesController` | `CompanyService` | `Company` | `Companies` |
| **Administration** | Roles & Permissions | `/administration/roles` | `RolesController` | `AuthorizationService` | `Role`, `UserRole` | `Roles` |
| **Administration** | UI Page Builder | `/administration/page-builder` | `UiPagesController` | `UiPageMetadataService` | `UiPageDefinition` | `UiPageDefinitions` |
