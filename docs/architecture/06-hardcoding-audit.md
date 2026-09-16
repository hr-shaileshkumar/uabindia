# 06 — Hardcoded Configuration Audit

## Executive Summary
This audit identifies all hardcoded patterns across the frontend and backend codebases, categorizing them according to the 7 architectural categories.

## Category Breakdown & Remediation Blueprint

### Category 1: UI Metadata (High Hardcoding — Prime Metadata Candidate)
- **Observed Issues**: Table columns (`columns: ColumnDef[]`), labels, widths, formatters, and form fields are hardcoded directly into 85+ React component files.
- **Example in Code**:
  ```typescript
  // Hardcoded in EmployeeListPage.tsx
  const columns = [
    { key: "employeeCode", label: "Emp ID", width: "120px" },
    { key: "fullName", label: "Full Name", width: "200px" },
    { key: "department", label: "Department", width: "150px" },
    { key: "status", label: "Status", width: "100px" }
  ];
  ```
- **Target Metadata Engine**: Move to `UiPageDefinition.SchemaJson` loaded via `GET /api/v1/ui-pages/{pageKey}`.

### Category 2: Master Data (Reference Data Hardcoded in Client Code)
- **Observed Issues**: Static dropdown lists for employment types, statuses, payment methods, units of measure embedded in component files as static arrays:
  ```typescript
  const STATUS_OPTIONS = ["Active", "Probation", "Suspended", "Terminated"];
  const GENDER_OPTIONS = ["Male", "Female", "Other"];
  ```
- **Target Architecture**: Relocate to dynamic database-backed lookup table accessed via unified `/api/v1/lookup?type={category}`.

### Category 3: Navigation Metadata
- **Observed Status**: Currently centralized in `module-registry.ts` and `navigation.ts`.
- **Target Architecture**: Transition from compile-time TypeScript file into database-backed `NavigationMenu` table with tenant-specific and role-specific visibility overrides.

### Category 4: Permission Metadata
- **Observed Issues**: Hardcoded role checks (`role === "Admin"` or `role === "HR"`) in some UI components instead of granular permission keys (`hrms.employees.create`).
- **Target Architecture**: Enforce strict `hasPermission("hrms:employees:write")` guard clauses.

### Category 5: Workflow State Transitions
- **Observed Issues**: Hardcoded approval states (`Pending`, `Approved`, `Rejected`) in status badge switch statements.
- **Target Architecture**: Store workflow status machines in `WorkflowDefinition` and `WorkflowStep` tables.

### Category 6: Dashboard KPI Cards & Widgets
- **Observed Issues**: Dashboard pages have fixed card layouts and hardcoded icon/color bindings.
- **Target Architecture**: Introduce `DashboardLayout` metadata allowing users/tenants to customize card placement, visible metrics, and chart widgets.

### Category 7: CRITICAL BOUNDARY — Strongly Typed Business Logic (DO NOT METADATAIZE)
- The following critical domain calculations MUST REMAIN strongly typed in C# domain services:
  1. **Payroll Calculation Engine**: Tax brackets, TDS deduction, PF (Provident Fund 12% calculation), ESI formulas.
  2. **Attendance Time Synthesis**: Shift cross-midnight calculations, late grace period tolerances, half-day deduction rules.
  3. **Double-Entry General Ledger Engine**: Debit-credit balance verification, financial period locking.
  4. **Electronic Data Interchange (EDI)**: ANSI X12 850/810/856 parsing and cryptographic checksum verification.
