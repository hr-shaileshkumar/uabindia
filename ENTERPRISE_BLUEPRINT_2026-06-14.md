# Enterprise Blueprint

Date: 2026-06-14

Product target: production-ready ERP + HRMS + Payroll + SaaS platform with SAP/Oracle/Odoo-style module boundaries, role-aware access, tenant isolation, and module-wise APIs.

This blueprint is an approval document. It does not require source-code changes by itself. After approval, implementation should proceed module by module with backward compatibility.

## 1. Final Module Map

### A. Platform / SaaS Owner
Purpose: software-owner control plane for managing tenants, subscriptions, modules, security, operational health, and global support.

Modules:
- Tenant management
- Company onboarding
- Module catalog
- Subscription and licensing
- Platform users
- Global roles and permissions
- Tenant health and provisioning
- Feature flags
- Website/page management
- Audit logs
- Global reports
- System health
- Integration registry

Primary audience:
- Super Admin / Software Owner
- Platform Operations
- Platform Support

### B. IAM / Security
Purpose: centralized identity, session, roles, permissions, and security policy layer.

Modules:
- Login/session management
- Refresh-token rotation
- Password recovery
- MFA readiness
- Device sessions
- Password policies
- IP restrictions
- SSO readiness
- Permission resolution
- Role mapping
- CSRF/session protection

Primary audience:
- Super Admin
- Company Admin
- Security Admin

### C. Company / Tenant Administration
Purpose: tenant-level business administration.

Modules:
- Company profile
- Projects / branches / locations
- Company users
- Tenant roles
- Tenant permissions
- Tenant settings
- Workflow configuration
- Notification templates
- Public company website settings

Primary audience:
- Company Admin
- HR Admin
- Operations Admin

### D. HRMS Core
Purpose: employee master and employee lifecycle.

Modules:
- Employee master
- Department
- Designation
- Employment type
- Onboarding
- Offboarding
- Probation
- Transfers and promotions
- Employee documents
- Employee self-service
- Manager team views

Primary audience:
- HR Admin
- Manager
- Employee

### E. Attendance, Leave, Shift, and Roster
Purpose: workforce time operations.

Modules:
- Attendance punch
- Attendance correction
- Attendance reports
- Leave types
- Leave policies
- Leave requests
- Leave approvals
- Leave balances
- Holidays
- Shifts
- Shift assignment
- Shift swap
- Shift rotation
- Overtime request
- Overtime approval
- Overtime compensation

Primary audience:
- HR Admin
- Manager
- Employee
- Field Staff

### F. Payroll and Statutory Compliance
Purpose: payroll processing, payslips, salary structures, and compliance.

Modules:
- Salary structures
- Payroll components
- Payroll runs
- Payslips
- Loans
- Arrears
- Bonus
- Reimbursements
- Full and final settlement
- PF
- ESI
- Professional tax
- TDS / income tax
- Tax declarations
- Compliance reports

Primary audience:
- Payroll User
- Finance User
- HR Admin
- Company Admin

### G. Recruitment and Talent
Purpose: hiring, screening, and candidate lifecycle.

Modules:
- Job postings
- Candidate applications
- Screening
- Interviews
- Offer letters
- Recruitment reports

Primary audience:
- HR Admin
- Recruiter
- Manager

### H. Performance and Learning
Purpose: employee growth, review cycles, and training.

Modules:
- Appraisal cycles
- Performance appraisals
- Competencies
- Ratings
- Training courses
- Enrollments
- Assessments
- Certificates
- Training requests

Primary audience:
- HR Admin
- Manager
- Employee

### I. ERP Finance
Purpose: accounting and financial operations.

Modules:
- Chart of accounts
- Journal entries
- Payments
- Bank reconciliation
- Tax management
- Financial reports

Primary audience:
- Finance User
- Company Admin

### J. CRM and Sales
Purpose: customer and sales lifecycle.

Modules:
- Customers
- Quotations
- Sales orders
- Invoices
- Returns
- Sales reports

Primary audience:
- Sales User
- Finance User
- Operations User

### K. Procurement and Inventory
Purpose: vendor, purchase, warehouse, and stock operations.

Modules:
- Vendors
- Purchase requests
- Purchase orders
- GRN
- Items
- Warehouses
- Stock movements
- Stock transfers
- Inventory adjustments
- Inventory reports

Primary audience:
- Operations User
- Procurement User
- Finance User

### L. Asset Management
Purpose: company assets and allocations.

Modules:
- Fixed assets
- Asset allocation
- Asset maintenance
- Asset depreciation
- Asset reports

Primary audience:
- HR Admin
- Operations User
- Finance User

### M. Projects and Work Management
Purpose: project context for tenant work, approvals, and reporting.

Modules:
- Projects
- Project employees
- Project reports
- Project-based access scope

Primary audience:
- Company Admin
- Manager
- Operations User

### N. Helpdesk, Documents, Notifications, and Communication
Purpose: cross-module support and communication.

Modules:
- Helpdesk tickets
- Escalations
- FAQ
- Document vault
- Announcements
- Email templates
- SMS templates
- Notifications

Primary audience:
- Employee
- Manager
- HR Admin
- Support User

### O. Reports and Analytics
Purpose: consolidated reporting layer.

Modules:
- HR reports
- Payroll reports
- Compliance reports
- Finance reports
- ERP reports
- Custom reports
- Dashboard KPIs

Primary audience:
- Super Admin
- Company Admin
- HR Admin
- Finance User
- Manager

## 2. Final Role and Permission Matrix

Permission rules:
- Backend is authoritative.
- Frontend only hides or disables UI; backend must enforce every action.
- Permissions are module-scoped and action-scoped.
- Tenant, company, project, team, and self-data scope must be evaluated separately from role name.

### Core roles

| Role | Scope | Primary Permissions |
| --- | --- | --- |
| Super Admin / Software Owner | All tenants | Manage tenants, modules, subscriptions, global users, global audit, system health, platform settings, support access |
| Platform Operations | All tenants, operational only | Provision tenants, view health, manage feature flags, inspect logs, no payroll/document PII by default |
| Platform Support | Approved tenant support sessions | View limited tenant support data, manage tickets, no direct salary/document access unless elevated |
| Company Admin | Own tenant | Manage company profile, users, roles, modules assigned to tenant, projects, workflows, settings |
| HR Admin | Own tenant | Manage employees, attendance, leave, recruitment, onboarding, performance, HR reports |
| Payroll User | Own tenant | Manage payroll structures, payroll runs, payslips, statutory records, payroll reports |
| Finance User | Own tenant | Manage finance, chart of accounts, journals, payments, invoices, tax, financial reports |
| Operations User | Own tenant | Manage procurement, inventory, warehouses, assets, projects, operational reports |
| Manager | Own mapped team/project | Approve leave/attendance/overtime, view team dashboards, team reports, assigned project data |
| Employee | Self only | ESS dashboard, attendance, leave request, payslip view, documents, tickets, announcements |
| Field Staff | Self and assigned field tasks | Attendance, shift, assigned tickets/tasks, limited mobile ESS |
| Recruiter | Own tenant | Job postings, candidates, screening workflows |
| Auditor | Own tenant or platform scoped | Read-only audit, reports, compliance evidence, no mutation |

### Permission model

Use this format:

```text
module.resource.action
```

Examples:
- `hrms.employee.read`
- `hrms.employee.create`
- `hrms.attendance.approve`
- `payroll.run.process`
- `payroll.payslip.read.self`
- `erp.finance.journal.post`
- `platform.tenant.provision`
- `iam.role.assign`
- `reports.payroll.export`

### Data scope model

Every permission must resolve with one data scope:
- `global`: platform-wide
- `tenant`: own tenant
- `company`: own company
- `project`: assigned project
- `team`: mapped reporting team
- `self`: own user/employee record

Example:
- Employee may have `payroll.payslip.read` with `self`.
- Manager may have `hrms.leave.approve` with `team`.
- Company Admin may have `iam.user.manage` with `tenant`.
- Super Admin may have `platform.tenant.manage` with `global`.

## 3. Final Frontend Route Architecture

Route rules:
- Public platform routes are separate from tenant public routes.
- Protected business routes live under `/erp`.
- Platform owner routes live under `/platform` and `/superadmin`.
- Legacy aliases can remain during migration but should redirect to canonical routes.

### Public platform website

```text
/
/features
/industries
/pricing
/contact
/login
/forgot-password
/reset-password
/register
```

### Public company portal

```text
/company
/about
/careers
/help-support
/tenant-not-found
```

### Auth

```text
/login
/forgot-password
/reset-password
/register
/otp-verification
```

Future target:
- keep route names for compatibility,
- update behavior to match backend capabilities,
- introduce MFA/OTP only when backend supports it.

### Super Admin / Software Owner

```text
/superadmin/dashboard
/platform
/platform/tenants
/platform/companies
/platform/users
/platform/roles
/platform/permissions
/platform/module-mapping
/platform/feature-flags
/platform/system-health
/platform/audit-logs
/platform/contact-submissions
/platform/website/pages
/platform/website/settings
/platform/website/themes
/platform/website/templates
/platform/workflow-config
```

### Company workspace

```text
/erp/dashboard
/erp/context
/erp/hrms
/erp/payroll
/erp/reports
/erp/documents
/erp/helpdesk
/erp/communication
/erp/security
/erp/integrations
```

### HRMS

```text
/erp/hrms/employees
/erp/hrms/employees/new
/erp/hrms/employees/[id]
/erp/hrms/attendance
/erp/hrms/leave
/erp/hrms/shifts
/erp/hrms/overtime
/erp/hrms/recruitment
/erp/hrms/onboarding
/erp/hrms/offboarding
/erp/hrms/probation
/erp/hrms/performance
/erp/hrms/training
/erp/hrms/certificates
/erp/hrms/assets
```

### Payroll

```text
/erp/payroll
/erp/payroll/structures
/erp/payroll/components
/erp/payroll/runs
/erp/payroll/payslips
/erp/payroll/statutory
/erp/payroll/tax-declarations
/erp/payroll/loans
/erp/payroll/arrears
/erp/payroll/bonus
/erp/payroll/reimbursements
/erp/payroll/final-settlement
```

### ERP Finance, CRM, Procurement, Inventory

```text
/erp/chart-of-accounts
/erp/journal-entries
/erp/payments
/erp/bank-reconciliation
/erp/tax-management
/erp/customers
/erp/quotations
/erp/sales-orders
/erp/invoices
/erp/returns
/erp/vendors
/erp/purchase-requests
/erp/purchase-orders
/erp/grn
/erp/items
/erp/warehouses
/erp/stock-movements
/erp/inventory-transfers
/erp/inventory-adjustments
```

### Reports

```text
/erp/reports
/erp/reports/hr
/erp/reports/payroll
/erp/reports/compliance
/erp/reports/financial
/erp/reports/erp
/erp/reports/custom
```

## 4. Final Backend API Namespace Architecture

Rules:
- All new APIs use `/api/v1`.
- Controllers remain backward-compatible during migration.
- New module-wise namespaces should be introduced behind service abstractions.
- Existing endpoints can be redirected, proxied, or preserved until frontend migration is complete.

### IAM

```text
/api/v1/iam/auth/login
/api/v1/iam/auth/logout
/api/v1/iam/auth/refresh
/api/v1/iam/auth/csrf-token
/api/v1/iam/auth/me
/api/v1/iam/auth/permissions
/api/v1/iam/password/forgot
/api/v1/iam/password/reset
/api/v1/iam/sessions
/api/v1/iam/roles
/api/v1/iam/permissions
```

### Platform

```text
/api/v1/platform/tenants
/api/v1/platform/tenants/{id}/health
/api/v1/platform/tenants/{id}/repair
/api/v1/platform/modules
/api/v1/platform/subscriptions
/api/v1/platform/companies
/api/v1/platform/users
/api/v1/platform/settings
/api/v1/platform/feature-flags
/api/v1/platform/audit-logs
/api/v1/platform/system-health
/api/v1/platform/contact-submissions
/api/v1/platform/website/pages
```

### Public

```text
/api/v1/public/company-profile
/api/v1/public/website-pages/{pageType}
/api/v1/public/contact
/api/v1/public/jobs
```

### HRMS

```text
/api/v1/hrms/dashboard
/api/v1/hrms/employees
/api/v1/hrms/attendance
/api/v1/hrms/leave
/api/v1/hrms/shifts
/api/v1/hrms/overtime
/api/v1/hrms/recruitment
/api/v1/hrms/onboarding
/api/v1/hrms/performance
/api/v1/hrms/training
/api/v1/hrms/assets
```

### Payroll and Compliance

```text
/api/v1/payroll/structures
/api/v1/payroll/components
/api/v1/payroll/runs
/api/v1/payroll/payslips
/api/v1/payroll/loans
/api/v1/payroll/arrears
/api/v1/payroll/bonus
/api/v1/payroll/reimbursements
/api/v1/payroll/statutory
/api/v1/compliance/pf
/api/v1/compliance/esi
/api/v1/compliance/pt
/api/v1/compliance/tds
/api/v1/compliance/reports
```

### ERP

```text
/api/v1/erp/finance/chart-of-accounts
/api/v1/erp/finance/journal-entries
/api/v1/erp/finance/payments
/api/v1/erp/finance/bank-reconciliation
/api/v1/erp/crm/customers
/api/v1/erp/crm/quotations
/api/v1/erp/crm/sales-orders
/api/v1/erp/crm/invoices
/api/v1/erp/crm/returns
/api/v1/erp/procurement/vendors
/api/v1/erp/procurement/purchase-requests
/api/v1/erp/procurement/purchase-orders
/api/v1/erp/procurement/grn
/api/v1/erp/inventory/items
/api/v1/erp/inventory/warehouses
/api/v1/erp/inventory/stock-movements
/api/v1/erp/inventory/transfers
/api/v1/erp/inventory/adjustments
```

### Shared

```text
/api/v1/projects
/api/v1/helpdesk/tickets
/api/v1/helpdesk/escalations
/api/v1/helpdesk/faq
/api/v1/documents
/api/v1/notifications
/api/v1/communication/announcements
/api/v1/workflows
/api/v1/approvals
/api/v1/reports
/api/v1/integrations
```

### API response standard

Target response envelope for non-file endpoints:

```json
{
  "success": true,
  "data": {},
  "message": "",
  "errors": [],
  "meta": {
    "traceId": "",
    "page": 1,
    "limit": 20,
    "total": 0
  }
}
```

## 5. Final Database Multi-Tenant Strategy

Recommended strategy: row-level multi-tenancy as the primary model, with global platform tables in `dbo`.

Reason:
- The existing model already uses `TenantId` across most business entities.
- It is simpler to operate at 5,000-50,000 employees across multiple companies.
- It avoids EF model-cache complexity from schema-per-tenant for every request.
- SQL Server indexes and partitioning can scale this pattern if designed well.

### Global tables

Keep in `dbo`:
- Tenants
- Modules
- Subscription plans
- Platform users if separate from tenant users
- Global feature flags
- Tenant provisioning logs
- System-level audit

### Tenant-scoped tables

Every tenant data table must include:
- `TenantId`
- `CompanyId` where company context matters
- `ProjectId` where project context matters
- `CreatedAt`
- `CreatedBy`
- `UpdatedAt`
- `UpdatedBy`
- `IsDeleted`
- `DeletedAt`
- `DeletedBy`
- optional `RowVersion`

### Isolation rules

- All normal queries must filter by `TenantId`.
- Privileged cross-tenant reads must use explicit service methods and audit reason codes.
- `IgnoreQueryFilters()` must be restricted to approved infrastructure/service paths.
- Support access must be time-bound and audited.

### Required database hardening

- Check in EF Core migrations.
- Add module-wise indexes.
- Add FK review per module.
- Add uniqueness constraints scoped by `TenantId`.
- Add row versioning to high-contention entities.
- Add audit/archive policy for large history tables.
- Mask or avoid storing sensitive request/response bodies in audit logs.

### Index priorities

- `Users(TenantId, Email)`
- `Employees(TenantId, CompanyId, EmployeeCode)`
- `AttendanceRecords(TenantId, EmployeeId, Timestamp)`
- `LeaveRequests(TenantId, EmployeeId, Status, FromDate)`
- `PayrollRuns(TenantId, CompanyId, Period)`
- `Payslips(TenantId, EmployeeId, PayrollRunId)`
- `HelpdeskTickets(TenantId, TicketNumber)`
- `Documents(TenantId, EntityName, EntityId)`
- `Notifications(TenantId, UserId, IsRead, CreatedAt)`
- `AuditLogs(TenantId, EntityName, EntityId, PerformedAt)`

## 6. Final UI Design System Structure

Design target: restrained enterprise ERP UI. Dense but readable. Operational first, not marketing-heavy inside the app.

### Token groups

```text
colors
typography
spacing
radii
shadows
borders
z-index
status
module-colors
data-viz
```

### Core primitives

```text
Button
IconButton
Input
Textarea
Select
Combobox
Checkbox
Switch
RadioGroup
DatePicker
Tabs
Badge
Tooltip
Popover
DropdownMenu
Dialog
Drawer
Toast
Skeleton
EmptyState
ErrorState
ConfirmDialog
```

### ERP workspace components

```text
AppShell
Sidebar
Topbar
Breadcrumbs
PageHeader
ModuleHeader
FilterBar
ActionToolbar
DataTable
KpiCard
SummaryStrip
StatusBadge
AuditTimeline
ApprovalPanel
DetailDrawer
FormSection
BulkActionBar
ExportMenu
```

### Page pattern

Every protected page should follow:

```text
PageHeader
KPI/Summary strip when useful
FilterBar
Primary content table/cards
DetailDrawer or Dialog
Empty/loading/error states
Audit/approval actions where relevant
```

### Role-based UI

- Super Admin: platform console, tenant health, provisioning, audit, system KPIs.
- Company Admin: company operations, users, modules, workflows, tenant reports.
- HR Admin: employee lifecycle, attendance, leave, recruitment, HR dashboards.
- Manager: approvals, team view, project/team reports.
- Employee: ESS-first mobile-friendly UI.
- Finance/Payroll: table-heavy, period-driven, audit-friendly workflows.
- Operations: inventory/procurement/project task visibility.

## 7. Final Folder Structure

### Frontend target

```text
frontend/src/
  app/
    (public-platform)/
    (public-company)/
    (auth)/
    (workspace)/
      erp/
      platform/
      superadmin/
  components/
    ui/
    erp/
    public/
    layout/
  features/
    iam/
    platform/
    company-admin/
    hrms/
    attendance/
    leave/
    payroll/
    compliance/
    recruitment/
    performance/
    training/
    finance/
    crm/
    procurement/
    inventory/
    assets/
    projects/
    helpdesk/
    documents/
    notifications/
    reports/
  services/
    api/
    modules/
  hooks/
  context/
  lib/
    auth/
    permissions/
    routing/
    tenant/
    formatting/
    validation/
  styles/
    tokens/
    themes/
  types/
  constants/
```

### Backend target

```text
Backend/src/
  UabIndia.Api/
    Controllers/
      Iam/
      Platform/
      Public/
      Hrms/
      Payroll/
      Erp/
      Shared/
    Middleware/
    Filters/
    Contracts/
    Extensions/
  UabIndia.Application/
    Common/
      Behaviors/
      Validation/
      Security/
      Responses/
    Modules/
      Iam/
      Platform/
      Hrms/
      Payroll/
      Compliance/
      Finance/
      Crm/
      Procurement/
      Inventory/
      Assets/
      Projects/
      Helpdesk/
      Reports/
  UabIndia.Core/
    Entities/
    ValueObjects/
    Enums/
    Authorization/
    DomainEvents/
  UabIndia.Infrastructure/
    Data/
    Migrations/
    Repositories/
    Services/
    Caching/
    Storage/
    Jobs/
    Integrations/
  UabIndia.Identity/
    Tokens/
    Sessions/
    Passwords/
    Policies/
```

### Backend module internal pattern

```text
Module/
  Commands/
  Queries/
  Validators/
  Dtos/
  Services/
  Policies/
  Mapping/
```

## 8. Phase-Wise Implementation Plan

### Phase 0: Approval and freeze

Deliverables:
- approve this blueprint
- freeze module names
- freeze role matrix
- freeze API namespace plan
- freeze frontend canonical routes
- freeze database tenancy decision

No code refactor before this phase is approved.

### Phase 1: IAM, tenant context, and routing stabilization

Deliverables:
- final login/session/password flow
- tenant resolution contract
- role/permission resolver contract
- canonical route redirects
- auth middleware cleanup
- backend permission enforcement audit

Compatibility:
- keep existing auth endpoints during migration
- add aliases only after stable service layer exists

### Phase 2: Frontend shell and design system

Deliverables:
- final public-platform shell
- final public-company shell
- final workspace shell
- final owner-console shell
- standard page header, filter bar, table, drawer, dialog, empty/error/loading states
- remove inconsistent page-level visual patterns module by module

Compatibility:
- pages keep current URLs
- each page migrates to shared patterns incrementally

### Phase 3: Platform module

Deliverables:
- tenants
- companies
- users
- roles
- permissions
- modules
- feature flags
- system health
- audit logs

Backend:
- introduce `/api/v1/platform/*`
- preserve old endpoints until frontend migration is complete

### Phase 4: HRMS module

Deliverables:
- employees
- attendance
- leave
- shifts
- overtime
- recruitment
- onboarding/offboarding
- performance
- training
- HR reports

Backend:
- introduce `/api/v1/hrms/*`
- centralize validators and service logic

### Phase 5: Payroll and compliance

Deliverables:
- salary structures
- payroll components
- payroll runs
- payslips
- statutory compliance
- payroll reports
- export/audit controls

Backend:
- standardize payroll APIs
- add strict permission and audit checks

### Phase 6: ERP finance, CRM, procurement, inventory

Deliverables:
- finance workflows
- sales workflows
- purchase workflows
- warehouse and stock workflows
- operational reports

Backend:
- introduce `/api/v1/erp/*` namespaces
- standardize document numbering and status transitions

### Phase 7: Shared modules

Deliverables:
- documents
- helpdesk
- notifications
- communication
- approvals
- workflows
- integrations

Backend:
- centralize workflow and approval actions
- standardize notification delivery and read status

### Phase 8: Database hardening

Deliverables:
- checked-in migrations
- indexes
- FK review
- audit data masking
- archive policy
- rowversion where needed
- migration runbook

### Phase 9: Production operations

Deliverables:
- CI build validation
- backend health checks
- frontend build checks
- environment templates
- Redis verification
- Hangfire dashboard policy
- structured logging
- Sentry/Application Insights verification
- deployment checklist

### Phase 10: Documentation

Deliverables:
- system architecture document
- API documentation
- database ERD
- role matrix
- module flow diagrams
- admin/user operating guide

## 9. Implementation Rules After Approval

- Work module by module.
- Preserve current working endpoints until replacement routes are verified.
- Do not delete legacy routes without migration redirects.
- Do not move database tables without migrations and rollback plan.
- Do not rely on frontend permission checks for security.
- Every module migration must include:
  - build verification,
  - smoke test,
  - route check,
  - API compatibility check,
  - permission check.

## 10. Recommended First Implementation Module

Start with Phase 1: IAM, tenant context, and routing stabilization.

Reason:
- every module depends on tenant and permission correctness,
- login and role routing are the entry point,
- API namespace migration needs stable identity and policy contracts first.
