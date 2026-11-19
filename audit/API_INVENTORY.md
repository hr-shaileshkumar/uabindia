# 📡 UAB INDIA ENTERPRISE SUITE — API INVENTORY & SPECIFICATION
**Document ID:** `AUDIT-DOC-008`  
**Evaluation Date:** November 2026  
**Auditor Roles:** Senior Full-Stack Developer, API Architect & DevOps Engineer  

---

## 1. API Architecture & Standards Overview

The backend exposes an enterprise RESTful HTTP API governed by the following architectural standards:
- **Base Version Prefix**: Standardized as `/api/v1/[controller]` across all 148 controllers.
- **Rewrite Middleware**: Transparently rewrites legacy `/api/{path}` to `/api/v1/{path}` for client resilience.
- **Default Authentication Scheme**: JWT Bearer token via `Authorization: Bearer <token>` or HTTP-only `access_token` cookie.
- **WebSocket Protocol**: Microsoft SignalR hub mounted at `/hubs/notifications`.
- **Response Format**: Standardized JSON envelopes containing `success`, `data`, `message`, and `timestamp` fields.
- **Total Controllers**: **148 Controllers**
- **Total HTTP Endpoints**: **1,033 Endpoints**

---

## 2. Module-Wise Controller & Endpoint Distribution

```
                                   HTTP ENDPOINTS BY MODULE (TOTAL: 1,033)
  Administration  ████████████████████████████████████████ (378)
  HRMS            ███████████████████████████ (257)
  Payroll         █████████ (82)
  Finance         ████████ (74)
  Compliance      █████ (43)
  Sales           ████ (32)
  Assets          ███ (28)
  Inventory       ███ (24)
  Procurement     ██ (23)
  Notifications   ██ (21)
  Projects        ██ (19)
  CRM             ██ (18)
  Workflow        ██ (16)
  Manufacturing   █ (11)
  Identity        █ (7)
```

| Module | Controller Count | Endpoint Count | Key Controllers | Primary Business Capabilities |
| :--- | :---: | :---: | :--- | :--- |
| **Administration** | 58 | 378 | `AuthController`, `UsersController`, `RolesController`, `PermissionsController`, `AuditLogsController`, `TenantsController`, `UiPagesController` | Identity management, multi-tenancy, dynamic UI builders, audit trail, security policies |
| **HRMS** | 23 | 257 | `EmployeesController`, `AttendanceController`, `BiometricGatewayController`, `LeaveController`, `RecruitmentController`, `ShiftsController`, `AppraisalsController` | Employee master, time & attendance, biometric ingestion, ATS pipeline, leave approvals |
| **Payroll** | 10 | 82 | `PayrollRunsController`, `SalaryStructuresController`, `PayslipsController`, `FinalSettlementController`, `PayrollArrearsController`, `PayrollLoansController` | Monthly payroll runs, salary assignments, loan recovery, payslip generation, F&F settlement |
| **Finance** | 16 | 74 | `ChartOfAccountsController`, `JournalEntriesController`, `BankReconciliationController`, `PaymentsController`, `ExpenseClaimsController`, `EInvoiceController` | Double-entry GL, bank reconciliation feeds, Indian E-invoicing, payments |
| **Compliance** | 2 | 43 | `ComplianceController`, `StatutoryComplianceController` | EPF, ESIC, Professional Tax filings, statutory compliance reports and audits |
| **Sales** | 7 | 32 | `SalesQuotationsController`, `SalesOrdersController`, `SalesInvoicesController`, `PricingController`, `B2BPortalController` | Customer quotations, sales orders, GST-compliant tax invoices, pricing schemes |
| **Assets** | 3 | 28 | `AssetsController`, `AssetAllocationController`, `DepreciationController` | Fixed asset registration, employee allocation, straight-line depreciation engine |
| **Inventory** | 7 | 24 | `ItemsController`, `WarehousesController`, `StockMovementsController`, `InventoryTransferController` | Multi-warehouse inventory, item master, stock transfers, batch and serial tracking |
| **Procurement** | 5 | 23 | `VendorsController`, `PurchaseOrdersController`, `GoodsReceiptsController`, `PurchaseInvoicesController` | Vendor evaluation, purchase requests, GRN inspection, three-way matching |
| **Notifications** | 2 | 21 | `NotificationsController`, `CommunicationController` | Push notifications, email queueing, SMS/WhatsApp delivery |
| **Projects** | 4 | 19 | `ProjectsController`, `ProjectTasksController`, `TimesheetsController`, `FieldServiceController` | Milestone planning, timesheet logging, technician dispatch |
| **CRM** | 4 | 18 | `CrmLeadsController`, `CrmContactsController`, `CrmOpportunitiesController` | Lead qualification, customer contacts, sales pipeline stages |
| **Workflow** | 2 | 16 | `ApprovalsController`, `WorkflowController` | Multi-level approval steps, transition state machine, SLA triggers |
| **Manufacturing** | 4 | 11 | `WorkOrdersController`, `MrpController`, `QualityManagementController`, `SubcontractingController` | BOM hierarchy, production work orders, GST Rule 55 job work, QM lots |
| **Identity / SSO** | 1 | 7 | `AuthorizationController` | OpenIddict OAuth2 token authorization, userinfo, and token revocation |

---

## 3. High-Priority API Controller Specifications

### 3.1 Authentication & Identity (`AuthController.cs`)
- `POST /api/v1/auth/login`: Authenticates user credentials via PBKDF2; checks account lockout; generates 15-minute JWT access token and 30-day refresh token. Rate-limited (`auth-login`).
- `POST /api/v1/auth/refresh`: Rotates refresh token with reuse-detection family tracking. Rate-limited (`auth-refresh`).
- `GET /api/v1/auth/csrf-token`: Issues cryptographic double-submit anti-CSRF cookie and response token.
- `POST /api/v1/auth/logout`: Revokes refresh token hash and clears authentication cookies.

### 3.2 Workforce & Attendance (`AttendanceController.cs`)
- `POST /api/v1/hrms/attendance/punch`: Records employee clock-in/out. Enforces GPS geofencing with Haversine distance calculation against registered facilities.
- `POST /api/v1/hrms/attendance/punch/me`: ESS 1-click punch endpoint for the authenticated user.
- `POST /api/v1/hrms/attendance/web-checkin`: Web check-in capturing client browser metadata and coordinates.
- `GET /api/v1/hrms/attendance/summary/daily-synthesis`: Computes real-time daily presence, half-day, and late hours.
- `GET /api/v1/hrms/attendance/analytics/bradford`: Computes absenteeism Bradford Factor scores across departments.
- `POST /api/v1/hrms/attendance/regularization`: Submits an attendance correction request for manager approval.

### 3.3 Hardware Turnstile Biometric Gateway (`BiometricGatewayController.cs`)
- `POST /api/v1/hrms/attendance/biometric/push`: Machine ingestion endpoint for physical turnstile devices (ZKTeco, eSSL, Realtime). Accepts batch punch arrays authenticated via Device API Key.
- `POST /api/v1/hrms/attendance/biometric/heartbeat`: Receives hardware telemetry: firmware version, online status, user count, and unsynced log counter.

### 3.4 Payroll Engine (`PayrollRunsController.cs` & `PayrollEngineService.cs`)
- `POST /api/v1/payroll/runs`: Initiates a monthly payroll run for a specific company or organization branch.
- `POST /api/v1/payroll/runs/{id}/calculate`: Executes the `PayrollEngineService` calculation pipeline:
  - Deducts unpaid LOP leave days from calendar working days.
  - Computes statutory EPF, EPS, ESIC, Professional Tax, and Income Tax TDS.
  - Applies loan recoveries, approved bonuses, and retroactive arrears.
  - Generates individual `Payslip` and `PayslipLine` records.
  - Posts balanced double-entry GL journal entry (`JE-PAY-...`) to the General Ledger.
- `GET /api/v1/payroll/payslips/{id}/download`: Streams printable/downloadable payslip HTML/PDF.

### 3.5 Full and Final Settlement (`FinalSettlementController.cs`)
- `POST /api/v1/payroll/settlements/compute`: Previews F&F calculation without database commitment (service years, statutory gratuity, unavailed leave encashment, loan recoveries).
- `POST /api/v1/payroll/settlements`: Initiates an F&F settlement record.
- `POST /api/v1/payroll/settlements/{id}/settle`: Finalizes settlement payout and posts `JE-FNF-...` journal entry.

---

## 4. API Security & Validation Infrastructure

1. **Rate Limiting**:
   - `auth-login`: 5 requests per minute per IP to mitigate credential stuffing.
   - `auth-refresh`: 20 requests per minute per IP.
   - Global API limit: 30 requests/second per IP with burst capacity of 20 in Nginx.
2. **Input Validation**:
   - Declarative DTO validators (`CreateTenantDtoValidator`, `AttendancePunchDtoValidator`) executed via FluentValidation before reaching controller actions.
3. **Audit Logging**:
   - `AuditMiddleware` intercepts mutating state-changing requests (POST, PUT, DELETE) and records user ID, IP address, user-agent, entity name, and execution latency.
