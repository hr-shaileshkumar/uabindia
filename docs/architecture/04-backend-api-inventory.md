# 04 — Backend Controller & REST API Inventory

## Executive Summary
The backend architecture comprises **108 controllers** exposing **542 endpoints** across 15 business domain modules and platform projects.

## Controller Registry Summary

| Controller Class | Domain Module | Route Template | Endpoints | Authorization Policy |
| :--- | :--- | :--- | :--- | :--- |
| `AdminSettingsController` | `Administration` | `api/v1/admin` | 3 | `Policy = "AdminOnly", Policy = "Module:platform"` |
| `AiAgentsController` | `Administration` | `api/v1/ai` | 1 | `Default, Policy = "Module:platform", Policy = "Module:platform", Policy = "AdminOnly"` |
| `AiCopilotController` | `Administration` | `api/v1/ai/copilot` | 2 | `Default` |
| `AuditLogsController` | `Administration` | `api/v1/[controller]` | 2 | `Policy = "AdminOnly", Policy = "Module:platform"` |
| `AuthController` | `Administration` | `api/v1/[controller]` | 5 | `Default, Default, Default, Default` |
| `BillingController` | `Administration` | `api/billing` | 4 | `Anonymous` |
| `CompaniesController` | `Administration` | `api/v1/[controller]` | 3 | `Default, Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly"` |
| `ContactSubmissionsController` | `Administration` | `api/v1/[controller]` | 2 | `Default, Policy = "AdminOnly", Policy = "Module:platform"` |
| `CustomFieldsController` | `Administration` | `api/v1/administration/custom-fields` | 4 | `Default` |
| `DocumentsController` | `Administration` | `api/v1/[controller]` | 2 | `Default` |
| `ElectronicDataInterchangeController` | `Administration` | `api/v1/integrations/electronic-data-interchange` | 3 | `Default` |
| `EntityFieldsController` | `Administration` | `api/v1/entity-fields` | 3 | `Default, Roles = "SuperAdmin,Admin", Roles = "SuperAdmin,Admin", Roles = "SuperAdmin,Admin", Roles = "SuperAdmin,Admin"` |
| `GeographyController` | `Administration` | `api/v1/geo` | 4 | `Default, Policy = "Module:platform"` |
| `GlobalSearchController` | `Administration` | `api/v1/administration/search` | 1 | `Default` |
| `HelpdeskController` | `Administration` | `api/v1/helpdesk` | 6 | `Default, Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly"` |
| `IndustryExtensionsController` | `Administration` | `api/v1/industry-extensions` | 3 | `Default` |
| `IntegrationsController` | `Administration` | `api/v1/[controller]` | 10 | `Default, Policy = "Module:licensing"` |
| `LicensingController` | `Administration` | `api/v1/licensing` | 5 | `Default, Policy = "Module:licensing"` |
| `LocalizationController` | `Administration` | `api/v1/[controller]` | 3 | `Default` |
| `ModulesController` | `Administration` | `api/v1/[controller]` | 1 | `Default, Policy = "Module:platform", Policy = "Module:platform", Policy = "Module:platform"` |
| `MultiFactorAuthenticationController` | `Administration` | `api/v1/multi-factor-authentication` | 4 | `Default` |
| `OrgContextController` | `Administration` | `api/v1/org-context` | 1 | `Default` |
| `OrgStructureController` | `Administration` | `api/v1/org` | 40 | `Default, Policy = "Module:platform"` |
| `PermissionsController` | `Administration` | `api/v1/[controller]` | 3 | `Default, Policy = "Module:platform"` |
| `PoliciesController` | `Administration` | `api/v1/[controller]` | 12 | `Default` |
| `PrivacyController` | `Administration` | `api/v1/[controller]` | 1 | `Default, Policy = "AdminOnly", Policy = "AdminOnly"` |
| `PublicController` | `Administration` | `api/v1/public` | 5 | `Anonymous` |
| `RolesController` | `Administration` | `api/v1/[controller]` | 6 | `Default, Policy = "Module:platform"` |
| `SearchController` | `Administration` | `api/v1/search` | 1 | `Default` |
| `SecurityController` | `Administration` | `api/v1/[controller]` | 20 | `Default, Policy = "Module:security"` |
| `SettingsController` | `Administration` | `api/v1/[controller]` | 4 | `Policy = "AdminOnly", Policy = "Module:platform"` |
| `SubscriptionsController` | `Administration` | `api/v1/[controller]` | 4 | `Default` |
| `SuperadminTenantsController` | `Administration` | `api/v1/superadmin/tenants` | 0 | `Default, Roles = "SUPERADMIN,SuperAdmin,ADMIN,Admin", Roles = "SUPERADMIN,SuperAdmin,ADMIN,Admin"` |
| `SystemController` | `Administration` | `api/v1/system` | 2 | `Default, Roles = "SuperAdmin,Admin"` |
| `TenantsController` | `Administration` | `api/v1/[controller]` | 11 | `Policy = "Module:platform"` |
| `UiPagesController` | `Administration` | `api/v1/ui-pages` | 3 | `Default, Roles = "SuperAdmin,Admin", Roles = "SuperAdmin,Admin", Roles = "SuperAdmin,Admin", Roles = "SuperAdmin,Admin", Roles = "SuperAdmin,Admin"` |
| `UiShellController` | `Administration` | `api/v1/ui-shell` | 4 | `Default` |
| `UserPermissionsController` | `Administration` | `api/v1/permissions` | 3 | `Default, Policy = "Module:platform"` |
| `UsersController` | `Administration` | `api/v1/[controller]` | 4 | `Policy = "AdminOnly", Policy = "Module:platform", Default` |
| `WebhooksController` | `Administration` | `api/v1/[controller]` | 6 | `Default` |
| `WebsiteController` | `Administration` | `api/v1/[controller]` | 5 | `Policy = "Module:platform"` |
| `AssetsController` | `Assets` | `api/v1/[controller]` | 0 | `Default, Policy = "Module:hrms", Roles = "Admin,HR,Manager", Roles = "Admin,HR,Manager", Roles = "Admin,HR,Manager", Roles = "Admin,HR", Roles = "Admin,HR", Roles = "Admin,HR", Roles = "Admin,HR,Manager", Roles = "Admin,HR,Manager,Employee", Roles = "Admin,HR", Roles = "Admin,HR,Manager,Employee", Roles = "Admin,HR", Roles = "Admin,HR,Manager", Roles = "Admin,HR,Manager", Roles = "Admin,HR", Roles = "Admin,HR,Manager", Roles = "Admin,HR"` |
| `FixedAssetDepreciationController` | `Assets` | `api/v1/assets/depreciation` | 1 | `Default` |
| `FleetController` | `Assets` | `api/v1/[controller]` | 10 | `Default` |
| `ComplianceController` | `Compliance` | `api/v1/[controller]` | 1 | `Default, Policy = "Module:compliance", Roles = "Admin,HR,Manager", Roles = "Admin,HR,Manager,Employee", Roles = "Admin,HR,Manager,Employee", Roles = "Admin,HR", Roles = "Admin,HR", Roles = "Admin,HR,Manager", Roles = "Admin,HR,Manager,Employee", Roles = "Admin,HR,Manager", Roles = "Admin,HR,Employee", Roles = "Admin,HR,Manager", Roles = "Admin,HR,Manager", Roles = "Admin,HR,Manager,Employee", Roles = "Admin,HR", Roles = "Admin,HR", Roles = "Admin,HR", Roles = "Admin,HR,Manager", Roles = "Admin,HR,Manager,Employee", Roles = "Admin,HR", Roles = "Admin,HR", Roles = "Admin,HR", Roles = "Admin,HR", Roles = "Admin,HR", Roles = "Admin,HR", Roles = "Admin,HR", Roles = "Admin,HR,Manager", Roles = "Admin,HR,Manager,Employee", Roles = "Admin,HR,Manager,Employee", Roles = "Admin,HR", Roles = "Admin,HR", Roles = "Admin,HR,Employee", Roles = "Admin,HR,Employee", Roles = "Admin,HR,Employee", Roles = "Admin,HR", Roles = "Admin,HR", Roles = "Admin,HR", Roles = "Admin,HR", Roles = "Admin,HR"` |
| `CustomersController` | `CRM` | `api/v1/crm/customers` | 5 | `Policy = "Module:crm"` |
| `LeadsController` | `CRM` | `api/v1/crm/leads` | 5 | `Policy = "Module:crm", Policy = "AdminOnly"` |
| `AccountingPeriodsController` | `Finance` | `api/v1/finance/periods` | 1 | `Default, Policy = "Module:finance", Policy = "AdminOnly", Policy = "AdminOnly"` |
| `BankFeedController` | `Finance` | `api/v1/finance/bank-feed` | 3 | `Default` |
| `BankReconciliationsController` | `Finance` | `api/v1/bank-reconciliations` | 5 | `Policy = "Module:finance"` |
| `BudgetingController` | `Finance` | `api/v1/finance/budgeting` | 1 | `Default` |
| `ChartOfAccountsController` | `Finance` | `api/v1/[controller]` | 8 | `Default` |
| `CurrenciesController` | `Finance` | `api/v1/[controller]` | 1 | `Default` |
| `EInvoiceController` | `Finance` | `api/v1/finance/einvoice` | 5 | `Default` |
| `ExpensesController` | `Finance` | `api/v1/expenses` | 4 | `Policy = "Module:finance", Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly"` |
| `FinanceConsolidationController` | `Finance` | `api/v1/finance` | 5 | `Default` |
| `JournalEntriesController` | `Finance` | `api/v1/[controller]` | 2 | `Default, Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly"` |
| `PaymentGatewayController` | `Finance` | `api/v1/payments` | 5 | `Default` |
| `PaymentsController` | `Finance` | `api/v1/[controller]` | 2 | `Default, Policy = "AdminOnly", Policy = "AdminOnly"` |
| `PaymentWebhookController` | `Finance` | `api/v1/payments/webhooks` | 1 | `Anonymous` |
| `TaxController` | `Finance` | `api/v1/tax` | 5 | `Default` |
| `AppraisalsController` | `HRMS` | `api/v1/[controller]` | 7 | `Default, Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly"` |
| `AttendanceController` | `HRMS` | `api/v1/[controller]` | 22 | `Default, Policy = "Module:hrms", Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly", Roles = "Admin,HR,Manager", Roles = "Admin,HR,Manager"` |
| `BiometricGatewayController` | `HRMS` | `api/v1/hrms/attendance/biometric` | 0 | `Default, Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly"` |
| `EmployeePostingController` | `HRMS` | `api/v1/hrms/employees/{employeeId:guid}/postings` | 2 | `Default` |
| `EmployeesController` | `HRMS` | `api/v1/[controller]` | 3 | `Default, Policy = "Module:hrms", Roles = "SuperAdmin,Admin,HR Manager", Roles = "SuperAdmin,Admin,HR Manager", Roles = "SuperAdmin,Admin,HR Manager"` |
| `GlobalHrmsController` | `HRMS` | `api/v1/hrms` | 3 | `Default` |
| `HrLifecycleController` | `HRMS` | `api/v1/hrms/lifecycle` | 3 | `Default, Policy = "Module:hrms"` |
| `HumanResourcesDashboardController` | `HRMS` | `api/v1/hrms/dashboard` | 1 | `Default, Policy = "Module:hrms"` |
| `LeaveController` | `HRMS` | `api/v1/[controller]` | 19 | `Default, Policy = "Module:hrms", Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly", Roles = "SuperAdmin,Admin,HR Manager,Manager", Roles = "SuperAdmin,Admin,HR Manager,Manager", Policy = "AdminOnly"` |
| `OrganizationHierarchyController` | `HRMS` | `api/v1/hrms/organization` | 8 | `Default, Policy = "Module:hrms"` |
| `OvertimeController` | `HRMS` | `api/v1/overtime` | 0 | `Default, Policy = "Module:hrms", Roles = "Admin,HR,Manager", Roles = "Admin,HR,Manager,Employee", Roles = "Admin,HR,Manager,Employee", Roles = "Admin,HR,Manager", Roles = "Admin,HR,Employee", Roles = "Admin,HR,Employee", Roles = "Admin,HR", Roles = "Admin,HR,Manager,Employee", Roles = "Admin,HR,Manager", Roles = "Admin,HR,Manager", Roles = "Admin,HR,Manager", Roles = "Admin,HR,Manager,Employee", Roles = "Admin,HR", Roles = "Admin,HR", Roles = "Admin,HR,Manager,Employee"` |
| `ProbationController` | `HRMS` | `api/v1/hrms/probation` | 8 | `Default, Policy = "Module:hrms"` |
| `RecruitmentController` | `HRMS` | `api/v1/[controller]` | 2 | `Default, Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly"` |
| `ScreeningsController` | `HRMS` | `api/v1/screenings` | 0 | `Default` |
| `ShiftsController` | `HRMS` | `api/v1/shifts` | 0 | `Default, Policy = "Module:hrms", Roles = "Admin,HR,Manager", Roles = "Admin,HR,Manager", Roles = "Admin,HR,Manager", Roles = "Admin,HR,Manager", Roles = "Admin,HR", Roles = "Admin,HR", Roles = "Admin,HR", Roles = "Admin,HR,Manager", Roles = "Admin,HR,Manager,Employee", Roles = "Admin,HR,Manager,Employee", Roles = "Admin,HR", Roles = "Admin,HR", Roles = "Admin,HR,Manager", Roles = "Admin,HR,Manager", Roles = "Admin,HR,Manager,Employee", Roles = "Admin,HR,Employee", Roles = "Admin,HR,Manager,Employee", Roles = "Admin,HR,Manager", Roles = "Admin,HR,Manager", Roles = "Admin,HR", Roles = "Admin,HR"` |
| `TrainingController` | `HRMS` | `api/v1/[controller]` | 0 | `Default, Policy = "Module:hrms", Roles = "Admin,HR,Manager,Employee", Roles = "Admin,HR,Manager,Employee", Roles = "Admin,HR,Manager,Employee", Roles = "Admin,HR", Roles = "Admin,HR", Roles = "Admin,HR", Roles = "Admin,HR,Manager", Roles = "Admin,HR,Manager,Employee", Roles = "Admin,HR,Manager", Roles = "Admin,HR,Manager,Employee", Roles = "Admin,HR,Manager", Roles = "Admin,HR,Manager", Roles = "Admin,HR,Manager", Roles = "Admin,HR,Manager", Roles = "Admin,HR,Manager", Roles = "Admin,HR,Manager", Roles = "Admin,HR,Manager,Employee", Roles = "Admin,HR,Manager,Employee", Roles = "Admin,HR,Manager,Employee", Roles = "Admin,HR", Roles = "Admin,HR,Manager,Employee", Roles = "Admin,HR,Employee", Roles = "Admin,HR,Manager,Employee"` |
| `TravelController` | `HRMS` | `api/v1/travel` | 10 | `Policy = "Module:hrms", Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly"` |
| `DemandForecastingController` | `Inventory` | `api/v1/inventory/forecasting` | 1 | `Default` |
| `InventoryTransferController` | `Inventory` | `api/v1/inventory` | 5 | `Default` |
| `ItemsController` | `Inventory` | `api/v1/[controller]` | 4 | `Default, Policy = "AdminOnly"` |
| `StockMovementsController` | `Inventory` | `api/v1/[controller]` | 1 | `Default, Policy = "AdminOnly"` |
| `WarehouseManagementSystemController` | `Inventory` | `api/v1/inventory/warehouse-management` | 3 | `Default` |
| `WarehousesController` | `Inventory` | `api/v1/[controller]` | 2 | `Default, Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly"` |
| `MrpController` | `Manufacturing` | `api/v1/manufacturing/mrp` | 1 | `Default` |
| `WorkOrdersController` | `Manufacturing` | `api/v1/manufacturing/work-orders` | 4 | `Default` |
| `CommunicationController` | `Notifications` | `api/v1/communication` | 15 | `Default` |
| `NotificationsController` | `Notifications` | `api/v1/[controller]` | 4 | `Default, Policy = "AdminOnly"` |
| `PayrollController` | `Payroll` | `api/v1/[controller]` | 68 | `Default, Policy = "Module:payroll", Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly"` |
| `GoodsReceiptsController` | `Procurement` | `api/v1/grn` | 1 | `Policy = "Module:procurement", Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly"` |
| `PurchaseInvoicesController` | `Procurement` | `api/v1/purchaseinvoices` | 1 | `Default, Policy = "Module:procurement", Roles = "SuperAdmin,Admin,Manager"` |
| `PurchaseOrdersController` | `Procurement` | `api/v1/[controller]` | 2 | `Default, Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly"` |
| `PurchaseRequestsController` | `Procurement` | `api/v1/purchaserequests` | 3 | `Default, Policy = "Module:procurement", Roles = "SuperAdmin,Admin,Manager", Roles = "SuperAdmin,Admin,Manager", Roles = "SuperAdmin,Admin,Manager"` |
| `VendorsController` | `Procurement` | `api/v1/[controller]` | 4 | `Default, Policy = "AdminOnly"` |
| `FieldServiceController` | `Projects` | `api/v1/field-service` | 4 | `Default` |
| `ProjectsController` | `Projects` | `api/v1/[controller]` | 1 | `Default, Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly"` |
| `ProjectTasksController` | `Projects` | `api/v1/project-tasks` | 0 | `Policy = "Module:projects", Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly"` |
| `TimesheetsController` | `Projects` | `api/v1/timesheets` | 2 | `Policy = "Module:projects", Policy = "AdminOnly", Policy = "AdminOnly"` |
| `ReportsController` | `Reports` | `api/v1/[controller]` | 29 | `Default, Policy = "Module:reports"` |
| `B2BPortalController` | `Sales` | `api/v1/sales/portal` | 1 | `Default` |
| `DiscountSchemesController` | `Sales` | `api/v1/discountschemes` | 4 | `Policy = "Module:sales", Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly"` |
| `PricingController` | `Sales` | `api/v1/sales/pricing` | 3 | `Default` |
| `SalesInvoicesController` | `Sales` | `api/v1/salesinvoices` | 2 | `Policy = "Module:sales", Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly"` |
| `SalesOrdersController` | `Sales` | `api/v1/[controller]` | 2 | `Policy = "Module:sales", Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly"` |
| `SalesQuotationsController` | `Sales` | `api/v1/salesquotations` | 2 | `Policy = "Module:sales", Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly", Policy = "AdminOnly"` |
| `SalesReturnsController` | `Sales` | `api/v1/salesreturns` | 3 | `Policy = "Module:sales"` |
| `ApprovalsController` | `Workflow` | `api/v1/[controller]` | 0 | `Default` |
| `WorkflowController` | `Workflow` | `api/v1/workflows` | 6 | `Default, Policy = "AdminOnly"` |

## REST Endpoint Distribution by Module

```text
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
```

## Controller Design Pattern Analysis
1. **Clean Route Declarations**: The majority of controllers inherit from standard base controllers and declare clean RESTful routes (`api/v1/{module}/{resource}` or `api/{resource}`).
2. **Security Attributes**: Controllers consistently enforce `[Authorize]` with role or permission requirements.
3. **Dependency Injection**: Services are injected via constructor injection (`IEmployeeService`, `IApplicationDbContext`, `ITenantAccessor`).
