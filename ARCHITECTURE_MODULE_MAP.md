# ARCHITECTURE_MODULE_MAP

Corrected module map for the current modular monolith state.

## Source of truth

- Active backend module root: `Backend/src/Modules`
- Legacy leftover controllers: `Backend/src/UabIndia.Api/Modules`
- Frontend protected app routes: `frontend/src/app/(protected)`
- UI shell navigation source: `Backend/src/UabIndia.Api/Services/UiSchemaService.cs` and `frontend/src/lib/erp/navigation.ts`

## Completed work

- Root API controllers were moved out of `Backend/src/UabIndia.Api/Controllers`.
- Legacy controller leftovers were moved out of `Backend/src/UabIndia.Api/Modules` into the active `Backend/src/Modules` tree.
- `Backend/src/UabIndia.Api/UabIndia.Api.csproj` already compiles `..\Modules\**\*.cs`.
- Backend build passes.
- Test imports for moved controllers were updated.

## Pending work

- Finish backend modular boundary cleanup for modules that still only have controllers.
- Add services, DTOs, validators, tests, and feature flags where missing.
- Add OpenAPI grouping annotations or group metadata consistently.
- Finish frontend navigation fallback so the sidebar renders even when backend schema loading fails.
- Split the legacy ERP-derived navigation into first-class module entries.

## Module status

### Assets
- Active backend: `Backend/src/Modules/Assets/Controllers/AssetsController.cs`
- Services detected: none
- DTOs detected: none
- Validators detected: none
- Tests detected: none
- Frontend routes detected: none
- Permission policy: `Module:assets`
- Gap: controller exists, supporting module layers are missing

### CRM
- Active backend: `Backend/src/Modules/CRM/Controllers/CustomersController.cs`
- Services detected: none
- DTOs detected: none
- Validators detected: none
- Tests detected: none
- Frontend routes detected: none
- Permission policy: `Module:crm`
- Gap: controller exists, supporting module layers are missing

### Compliance
- Active backend: `Backend/src/Modules/Compliance/Controllers/ComplianceController.cs`
- Services detected: none
- DTOs detected: none
- Validators detected: none
- Tests detected: none
- Frontend routes detected: none
- Permission policy: `Module:compliance`
- Gap: controller exists, supporting module layers are missing

### Finance
- Active backend: `Backend/src/Modules/Finance/Controllers/ChartOfAccountsController.cs`, `JournalEntriesController.cs`, `PaymentsController.cs`
- Services detected: none
- DTOs detected: none
- Validators detected: none
- Tests detected: none
- Frontend routes detected: `/chart-of-accounts`, `/journal-entries`, `/payments`, `/expenses`, `/tax-management`, `/bank-reconciliation`
- Permission policy: `Module:finance`
- Gap: controller layer exists, supporting module layers are missing

### HRMS
- Active backend: `Backend/src/Modules/HRMS/Controllers/AppraisalsController.cs`, `AttendanceController.cs`, `EmployeesController.cs`, `HrController.cs`, `LeaveController.cs`, `OvertimeController.cs`, `RecruitmentController.cs`, `ScreeningsController.cs`, `ShiftsController.cs`, `TrainingController.cs`
- Services detected: none
- DTOs detected: none
- Validators detected: none
- Tests detected: none
- Frontend routes detected: `/hrms`, `/hrms/assessments`, `/hrms/assets`, `/hrms/attendance`, `/hrms/certificates`, `/hrms/employees`, `/hrms/employees/[id]`, `/hrms/employees/new`, `/hrms/leave`, `/hrms/offboarding`, `/hrms/onboarding`, `/hrms/overtime`, `/hrms/payroll`, `/hrms/performance`, `/hrms/probation`, `/hrms/recruitment`, `/hrms/screening-results`, `/hrms/screening-schedule`, `/hrms/shifts`, `/hrms/training`
- Permission policy: `Module:hrms`
- Gap: most screens are present, but supporting module layers are missing

### Inventory
- Active backend: `Backend/src/Modules/Inventory/Controllers/ItemsController.cs`, `StockMovementsController.cs`, `WarehousesController.cs`
- Services detected: none
- DTOs detected: none
- Validators detected: none
- Tests detected: none
- Frontend routes detected: `/items`, `/warehouses`, `/stock-movements`, `/inventory-adjustments`, `/inventory-transfers`
- Permission policy: `Module:inventory`
- Gap: controller layer exists, supporting module layers are missing

### Notifications
- Active backend: `Backend/src/Modules/Notifications/Controllers/NotificationsController.cs`
- Additional controller: `Backend/src/Modules/Notifications/Controllers/CommunicationController.cs`
- Services detected: none
- DTOs detected: none
- Validators detected: none
- Tests detected: none
- Frontend routes detected: `/notifications`
- Permission policy: missing direct `Module:notifications` policy registration
- Gap: active layer exists, but policy and supporting layers are missing; legacy controller remains

### Payroll
- Active backend: `Backend/src/Modules/Payroll/Controllers/PayrollController.cs`
- Services detected: none
- DTOs detected: none
- Validators detected: none
- Tests detected: none
- Frontend routes detected: `/payroll`, `/payroll/arrears`, `/payroll/bonus`, `/payroll/components`, `/payroll/final-settlement`, `/payroll/loans`, `/payroll/payslips`, `/payroll/reimbursements`, `/payroll/runs`, `/payroll/statutory`, `/payroll/structures`, `/payroll/tax-declarations`
- Permission policy: `Module:payroll`
- Gap: controller layer exists, supporting module layers are missing

### Platform
- Active backend: `Backend/src/Modules/Platform/Controllers/AuditLogsController.cs`, `CompaniesController.cs`, `ContactSubmissionsController.cs`, `ModulesController.cs`, `PermissionsController.cs`, `RolesController.cs`, `SettingsController.cs`, `SystemController.cs`, `TenantsController.cs`, `UiShellController.cs`, `UsersController.cs`, `WebsiteController.cs`
- Additional controllers: `Backend/src/Modules/Platform/Controllers/AuthController.cs`, `DocumentsController.cs`, `EntityFieldsController.cs`, `HelpdeskController.cs`, `IntegrationsController.cs`, `PrivacyController.cs`, `PublicController.cs`, `SearchController.cs`, `SecurityController.cs`
- Services detected: none
- DTOs detected: none
- Validators detected: none
- Tests detected: none
- Frontend routes detected: `/platform`, `/platform/audit-logs`, `/platform/companies`, `/platform/contact-submissions`, `/platform/feature-flags`, `/platform/module-mapping`, `/platform/notification-templates`, `/platform/permissions`, `/platform/projects`, `/platform/recycle-bin`, `/platform/roles`, `/platform/schema-manager`, `/platform/settings`, `/platform/system-health`, `/platform/tenants`, `/platform/users`, `/platform/website/pages`, `/platform/website/settings`, `/platform/website/templates`, `/platform/website/themes`
- Permission policy: `Module:platform`
- Gap: controller layer exists, supporting module layers are missing

### Procurement
- Active backend: `Backend/src/Modules/Procurement/Controllers/PurchaseOrdersController.cs`, `VendorsController.cs`
- Services detected: none
- DTOs detected: none
- Validators detected: none
- Tests detected: none
- Frontend routes detected: `/vendors`, `/purchase-requests`, `/purchase-orders`, `/grn`
- Permission policy: `Module:procurement`
- Gap: controller layer exists, supporting module layers are missing

### Projects
- Active backend: `Backend/src/Modules/Projects/Controllers/ProjectsController.cs`
- Services detected: none
- DTOs detected: none
- Validators detected: none
- Tests detected: none
- Frontend routes detected: none
- Permission policy: missing direct `Module:projects` policy registration
- Gap: controller layer exists, but permission and supporting layers are missing

### Reports
- Active backend: `Backend/src/Modules/Reports/Controllers/ReportsController.cs`
- Services detected: none
- DTOs detected: none
- Validators detected: none
- Tests detected: none
- Frontend routes detected: `/reports`, `/reports/compliance`, `/reports/custom`, `/reports/erp`, `/reports/financial`, `/reports/hr`, `/reports/payroll`
- Permission policy: `Module:reports`
- Gap: controller layer exists, supporting module layers are missing

### Sales
- Active backend: `Backend/src/Modules/Sales/Controllers/SalesOrdersController.cs`
- Services detected: none
- DTOs detected: none
- Validators detected: none
- Tests detected: none
- Frontend routes detected: `/customers`, `/quotations`, `/sales-orders`, `/returns`
- Permission policy: missing direct `Module:sales` policy registration
- Gap: controller layer exists, but permission and supporting layers are missing

### Workflow
- Active backend: `Backend/src/Modules/Workflow/Controllers/ApprovalsController.cs`, `WorkflowController.cs`
- Services detected: none
- DTOs detected: none
- Validators detected: none
- Tests detected: none
- Frontend routes detected: none
- Permission policy: missing direct `Module:workflow` policy registration
- Gap: controller layer exists, but permission and supporting layers are missing

## Duplicate and legacy files

- Empty legacy root controller folder was removed: `Backend/src/UabIndia.Api/Controllers`
- Legacy controllers were moved into the active module tree under `Backend/src/Modules`
- The old `Backend/src/UabIndia.Api/Modules` folder is now empty

## Current vs required gap

- Current state: the backend is a partial modular monolith, but most modules are still controller-only and need service/DTO/validator/test layers
- Current state: the backend is a partial modular monolith, but most modules are still controller-only and need service/DTO/validator/test layers
- Required state: every module should have controller, service, DTOs, validators, permissions, feature flag, tests, OpenAPI grouping, and navigation mapping
- Frontend state: sidebar/navigation is already schema-driven in part, but still needs a hard fallback path so it can render when backend navigation fails
- Biggest gaps: services, DTOs, validators, module-specific policies, tests, and consistent frontend nav splitting for all business modules

## Notes

- This document now reflects the real active backend source root instead of the legacy leftovers.
- It is intentionally split between active module files and legacy copies so the migration backlog is visible.