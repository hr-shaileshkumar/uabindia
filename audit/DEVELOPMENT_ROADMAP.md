# 🗺️ UAB INDIA ENTERPRISE SUITE — PRODUCT DEVELOPMENT ROADMAP
**Document ID:** `AUDIT-DOC-013`  
**Evaluation Date:** November 2026  
**Auditor Roles:** Technical Project Manager, Enterprise Software Architect & Senior Full-Stack Developer  

---

## 1. Phased Execution Overview

This implementation roadmap outlines the prioritized engineering trajectory required to transform the current codebase into a commercially viable, secure, and enterprise-grade SaaS ERP/HRMS platform.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ENTERPRISE IMPLEMENTATION PHASES                         │
│                                                                             │
│  Phase 1: Critical Bugs & Security Fixes        (Week 1)   - Urgent         │
│  Phase 2: Architecture & Code Quality           (Week 2)   - Foundation     │
│  Phase 3: Core ERP Foundation                   (Week 3-4) - Master Data    │
│  Phase 4: Complete HRMS Modules                 (Week 5-6) - Workforce Ops  │
│  Phase 5: Attendance & Payroll Engines          (Week 7-8) - Core Processing│
│  Phase 6: Compliance & Statutory Reporting      (Week 9)   - Legal Parity   │
│  Phase 7: Advanced ERP & Integration Features   (Week 10)  - Enterprise     │
│  Phase 8: Performance, Testing & Production     (Week 11)  - Launch         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Phase 1: Critical Bugs & Security Fixes

### Task 1.1: Fix Relational Joins in Leave Applications Endpoint
- **Description**: Replace hardcoded `"Employee"` and `"Leave"` strings with relational EF Core joins to `Employees` and `LeaveTypes`/`LeavePolicies`.
- **Files Affected**: `Backend/src/Modules/HRMS/Controllers/LeaveController.cs:64-66`
- **Dependencies**: None.
- **Priority**: **P0 (Critical)** | **Complexity**: Low (1-2 Hours)
- **Expected Outcome**: Leave applications list returns real employee names and leave policy descriptions.
- **Testing Requirements**: Add integration test in `GlobalHrmsPayrollTests.cs` verifying returned JSON properties match employee master records.

### Task 1.2: Enforce ₹20 Lakh Statutory Gratuity Ceiling
- **Description**: Enforce the mandatory ₹20,00,000 cap under Section 4(3) of the Payment of Gratuity Act 1972 during Full & Final (F&F) computations.
- **Files Affected**: `Backend/src/UabIndia.Infrastructure/Services/PayrollSettlementService.cs:34-36`
- **Dependencies**: None.
- **Priority**: **P0 (Critical)** | **Complexity**: Low (1 Hour)
- **Expected Outcome**: Gratuity amounts never exceed ₹20,00,000 regardless of tenure or base pay.
- **Testing Requirements**: Unit test in `IndiaStatutoryCalculatorTests.cs` verifying that a calculated gratuity of ₹35 Lakhs is capped to ₹20 Lakhs.

### Task 1.3: Magic Byte Validation in File Uploads
- **Description**: Inspect stream-level file signatures (magic bytes) to prevent executable masquerading.
- **Files Affected**: `Backend/src/UabIndia.Api/Middleware/FileUploadValidationMiddleware.cs:85-98`
- **Dependencies**: None.
- **Priority**: **P0 (Critical)** | **Complexity**: Medium (2-3 Hours)
- **Expected Outcome**: Malicious executables or HTML files renamed with `.png` or `.pdf` extensions are rejected with HTTP 400.
- **Testing Requirements**: Integration test verifying rejection of spoofed binary files.

### Task 1.4: Rethrow Secondary Concurrency Conflict Exceptions
- **Description**: Log a fatal warning and re-throw `DbUpdateConcurrencyException` instead of returning 0 upon failed resolution.
- **Files Affected**: `Backend/src/UabIndia.Infrastructure/Data/ApplicationDbContext.cs:1032-1039`
- **Dependencies**: None.
- **Priority**: **P1 (High)** | **Complexity**: Low (1 Hour)
- **Expected Outcome**: Concurrency conflicts are visibly caught and returned as HTTP 409 Conflict.
- **Testing Requirements**: Simulate simultaneous updates to an entity in a multi-threaded integration test.

---

## 3. Phase 2: Architecture & Code Quality

### Task 2.1: Prune Build Logs and Clean Git State
- **Description**: Add `*.log` to `.gitignore`, delete `infra_build.log`, `build.log`, `msbuild.log`, prune `Backend/src/UabIndia.SharedKernel`, and commit the unstaged metadata refactoring in `frontend-hrms`.
- **Files Affected**: `.gitignore`, root directory, `frontend-hrms/`
- **Dependencies**: Phase 1.
- **Priority**: **P1 (High)** | **Complexity**: Low (2 Hours)
- **Expected Outcome**: Clean `git status`, repository size reduced by 4+ MB.
- **Testing Requirements**: Verify clean builds across backend and both frontends.

### Task 2.2: Consolidate Duplicate Files & Nginx Configurations
- **Description**: Merge duplicate `ApiResponse.cs` into `UabIndia.Application.Common.Models`; consolidate root `nginx.conf` into `nginx/nginx.conf`.
- **Files Affected**: `Backend/src/UabIndia.Application/`, `nginx/nginx.conf`, `nginx.conf`
- **Dependencies**: Task 2.1.
- **Priority**: **P2 (Medium)** | **Complexity**: Low (2 Hours)
- **Expected Outcome**: Single source of truth for API envelopes and proxy configurations.
- **Testing Requirements**: Build validation and Nginx syntax verification (`nginx -t`).

---

## 4. Phase 3: Core ERP Foundation

### Task 3.1: Sequential GUID Primary Key Migration
- **Description**: Introduce sequential GUID generation (`NewSequentialId()` / `RT.Comb`) for high-throughput tables (`AttendanceRecords`, `AuditLogs`, `StockMovements`) to minimize SQL Server B-tree index fragmentation.
- **Files Affected**: `Backend/src/UabIndia.Infrastructure/Data/ApplicationDbContext.cs`
- **Dependencies**: Phase 2.
- **Priority**: **P2 (Medium)** | **Complexity**: Medium (1 Day)
- **Expected Outcome**: Higher insert throughput; reduced page splits during morning turnstile rush.
- **Testing Requirements**: Performance benchmark measuring insert throughput with k6.

### Task 3.2: Multi-Company Organization Context Switcher
- **Description**: Ensure the frontend topbar allows administrators of multi-company tenants to switch active company context seamlessly, automatically updating `X-Company-Id` request headers.
- **Files Affected**: `frontend/src/context/OrgContext.tsx`, `frontend-hrms/src/layout/Topbar.jsx`
- **Dependencies**: Phase 2.
- **Priority**: **P1 (High)** | **Complexity**: Medium (2 Days)
- **Expected Outcome**: Single admin can toggle between subsidiaries without logging out.
- **Testing Requirements**: Cypress / Playwright E2E test verifying company context isolation.

---

## 5. Phase 4: Complete HRMS Modules

### Task 4.1: Compensatory Off (Comp-Off) Backend Ledger
- **Description**: Build `CompOffLedger` entity, accrual requests for weekend/holiday work, and deduction hooks during leave applications.
- **Files Affected**: `Backend/src/UabIndia.Core/Entities/HRMS/`, `LeaveController.cs`, `LeaveRequestService.cs`
- **Dependencies**: Phase 3.
- **Priority**: **P1 (High)** | **Complexity**: Medium (2 Days)
- **Expected Outcome**: Employees working on holidays receive approved comp-off credits that can be applied as leave.
- **Testing Requirements**: End-to-end integration test verifying accrual and deduction balance.

### Task 4.2: Standalone Leave Encashment Workflow
- **Description**: Enable mid-year or year-end leave encashment requests subject to policy rules (`MaxEncashmentDays`, `MinBalanceRetained`).
- **Files Affected**: `Backend/src/Modules/HRMS/Controllers/LeaveController.cs`, `PayrollSettlementService.cs`
- **Dependencies**: Task 4.1.
- **Priority**: **P2 (Medium)** | **Complexity**: Medium (2 Days)
- **Expected Outcome**: Approved encashment automatically feeds into the next payroll run earnings.
- **Testing Requirements**: Test verifying encashed days debit the leave balance and add taxable earnings to payslip.

---

## 6. Phase 5: Attendance & Payroll Engines

### Task 5.1: Harmonize Professional Tax Multi-State Calculation
- **Description**: Ensure `IndiaPayrollEngine.cs` uses `IndiaStatutoryCalculator.CalculateProfessionalTax` with company state code rather than a hardcoded flat ₹200.
- **Files Affected**: `Backend/src/UabIndia.Infrastructure/Services/Payroll/IndiaPayrollEngine.cs:52-57`
- **Dependencies**: Phase 1.
- **Priority**: **P1 (High)** | **Complexity**: Low (2 Hours)
- **Expected Outcome**: State-accurate PT deductions for Karnataka, Maharashtra, Tamil Nadu, West Bengal, and Gujarat.
- **Testing Requirements**: Unit test calculating February PT for Karnataka (₹300) and Maharashtra slabs.

### Task 5.2: Batch Payroll Execution via Hangfire Background Worker
- **Description**: Wire large payroll runs (> 250 employees) to the dedicated `UabIndia.Worker` process using Hangfire queue `"payroll"`, streaming progress via SignalR.
- **Files Affected**: `Backend/src/UabIndia.Worker/`, `PayrollEngineService.cs`, `PayrollRunsController.cs`
- **Dependencies**: Phase 3.
- **Priority**: **P1 (High)** | **Complexity**: High (3 Days)
- **Expected Outcome**: 2,000+ payslips process asynchronously without web HTTP timeout.
- **Testing Requirements**: Stress test simulating 2,000 employee payroll run under 60 seconds.

---

## 7. Phase 6: Compliance & Statutory Reporting

### Task 6.1: Labour Welfare Fund (LWF) Engine
- **Description**: Implement LWF state deduction rules (employee/employer contributions in June/December for applicable states).
- **Files Affected**: `IndiaStatutoryCalculator.cs`, `PayrollEngineService.cs`, `StatutoryComplianceController.cs`
- **Dependencies**: Phase 5.
- **Priority**: **P1 (High)** | **Complexity**: Medium (2 Days)
- **Expected Outcome**: LWF deducted accurately in statutory months; GL liabilities posted.
- **Testing Requirements**: Unit tests covering Maharashtra, Karnataka, and Haryana LWF rates.

### Task 6.2: EPFO ECR & ESIC Monthly Return Export Generator
- **Description**: Generate official government Electronic Challan-cum-Return (ECR) text files formatted for EPFO unified portal and ESIC monthly Excel upload.
- **Files Affected**: `Backend/src/Modules/Payroll/Controllers/StatutoryComplianceController.cs`
- **Dependencies**: Phase 5.
- **Priority**: **P1 (High)** | **Complexity**: Medium (2 Days)
- **Expected Outcome**: HR managers can download 1-click text files ready for upload to the EPFO employer portal.
- **Testing Requirements**: Validation against EPFO official ECR file specification delimiter format (`#~#`).

---

## 8. Phase 7: Advanced ERP & Integration Features

### Task 7.1: Frontend Dependency Harmonization (React 19)
- **Description**: Upgrade `frontend-hrms` to React 19 and Tailwind v4, extracting shared UI primitives and Axios interceptors into a monorepo workspace.
- **Files Affected**: `frontend-hrms/package.json`, shared components
- **Dependencies**: Phase 6.
- **Priority**: **P2 (Medium)** | **Complexity**: High (4 Days)
- **Expected Outcome**: Zero version divergence across ERP and HRMS client portals.
- **Testing Requirements**: E2E smoke test verifying full visual parity.

### Task 7.2: Face Recognition Attendance Engine (Optional Future Upgrade)
- **Description**: Integrate browser/mobile camera face capture with server-side embedding comparison for touchless attendance.
- **Files Affected**: `AttendanceController.cs`, `frontend-hrms/src/modules/attendance/`
- **Dependencies**: Phase 5.
- **Priority**: **P3 (Low)** | **Complexity**: High (1-2 Weeks)
- **Expected Outcome**: Mobile check-in supports liveness detection and facial biometric match.
- **Testing Requirements**: Accuracy eval against false-acceptance and false-rejection test datasets.

---

## 9. Phase 8: Performance, Testing & Production Deployment

### Task 8.1: High-Density Database Indexing & Table Partitioning
- **Description**: Apply non-clustered composite indexes on `[AttendanceRecords]`, `[AuditLogs]`, and `[Payslips]`. Set up monthly/yearly partition schemes.
- **Files Affected**: `Backend/scripts/migrations/`
- **Dependencies**: All prior phases.
- **Priority**: **P1 (High)** | **Complexity**: Medium (2 Days)
- **Expected Outcome**: Sub-50ms query times on 2.5M+ row datasets.
- **Testing Requirements**: SQL Server Execution Plan verification confirming Index Seeks instead of Table Scans.

### Task 8.2: Production Staging Verification & Disaster Recovery Dry-Run
- **Description**: Execute full deployment rehearsal using `docker-compose.prod.yml`, verify automated database backup and restore (`scripts/backup-database.ps1`, `scripts/restore-database.sh`), and run complete k6 load test suite.
- **Files Affected**: `deploy/`, `scripts/`, `Backend/tests/LoadTests/`
- **Dependencies**: Task 8.1.
- **Priority**: **P0 (Critical)** | **Complexity**: Medium (2 Days)
- **Expected Outcome**: 100% verified backup recovery, zero critical vulnerabilities, production go-live signoff.
- **Testing Requirements**: k6 load test passing with p95 < 200ms at 100 concurrent virtual users.
