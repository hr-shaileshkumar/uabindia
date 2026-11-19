# ⚖️ UAB INDIA ENTERPRISE SUITE — FUNCTIONAL GAP ANALYSIS & BENCHMARKING
**Document ID:** `AUDIT-DOC-010`  
**Evaluation Date:** November 2026  
**Auditor Roles:** ERP/HRMS Product Consultant, Enterprise Software Architect & Technical Project Manager  

---

## 1. Enterprise ERP & HRMS Benchmarking

To transform the UAB India platform into an enterprise-grade commercial product, we benchmarked the current implementation against established industry platforms: **SAP SuccessFactors / S/4HANA**, **Oracle HCM Cloud**, **Microsoft Dynamics 365**, **Odoo Enterprise**, **ERPNext / Frappe HR**, and **Zoho People**.

| Enterprise Capability | Industry Benchmark (Frappe HR / Zoho / SAP) | Existing UAB India Implementation | Competitive Evaluation & Missing Gap |
| :--- | :--- | :--- | :--- |
| **Attendance Ingestion** | Multiple input streams: Biometric push, Mobile Geofence, Face AI, Web check-in | Biometric push endpoint + GPS Geofence + Web check-in | **Parity Achieved** for hardware and geofence; **Gap**: Face AI recognition engine is missing. |
| **Leave Management** | Accrual rules, carry-forward, encashment, compensatory off ledger, sandwich rules | Privilege/Casual/Sick policies, accrual proration | **Gap**: Compensatory off has no backend ledger; leave applications list has relational join bug. |
| **Indian Statutory Payroll** | Automated EPF, EPS, ESIC, PT, TDS (New/Old), LWF, Gratuity, Bonus Act | EPF, EPS, ESIC, PT, TDS (New/Old), F&F Gratuity | **Near Parity**: Needs LWF, Gratuity ₹20L cap, Bonus Act wage ceiling, and EPFO ECR text export. |
| **Double-Entry GL Sync**| Automatic journal entry posting on payroll and commercial document completion | Direct GL posting (`JE-PAY-...`, `JE-FNF-...`) | **Parity Achieved**: Seamless automatic double-entry journal creation into General Ledger. |
| **Multi-Tenancy** | Schema or row-level tenant separation with custom domain mapping | EF Core Global Query Filter on `TenantId` + custom domain | **Parity Achieved**: Strong multi-tenant data boundaries with zero cross-tenant leakage. |
| **Employee Dossier (360°)**| Single consolidated view: personal, career, compensation, assets, documents, timeline | `Employee360View.jsx` + `EmployeeProfile360Dto` | **Parity Achieved**: High-density 360° employee dossier with interactive action drawers. |
| **ATS / Recruitment** | Visual Kanban candidate pipeline, job requisitions, scorecards | Visual Kanban pipeline (`AtsPipelineKanban.jsx`), scorecards | **Parity Achieved**: Fluid drag-and-drop talent acquisition workflow. |

---

## 2. Comprehensive Functional Gap Analysis Matrix

| Area | Existing Status | Missing Features | Issues | Recommended Action | Priority |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **Leave Management** | Partially Developed | Relational employee and leave type names in applications list | `LeaveController.cs:64-66` hardcodes `"Employee"` and `"Leave"` | Add EF Core join with `Employees` and `LeaveTypes` to return real names. | **CRITICAL** |
| **Statutory Gratuity** | Partially Developed | ₹20 Lakh statutory cap under Payment of Gratuity Act 1972 | Uncapped computation creates excess financial liability | Enforce `Math.Min(gratuity, 2000000m)` in `PayrollSettlementService.cs:34`. | **HIGH** |
| **Compensatory Off** | UI Only | Backend credit/debit transaction ledger and approval workflow | Exists only as a metadata dropdown in `frontend-hrms` | Create `CompOffLedger` entity, accrual endpoint, and deduction during leave apply. | **HIGH** |
| **Labour Welfare Fund**| Not Started | State-specific LWF deductions (e.g. Maharashtra, Karnataka, Haryana) | No LWF tables or deduction calculations in payroll runs | Add `LabourWelfareFund` policy table and semi-annual deduction logic in payroll engine. | **HIGH** |
| **Statutory Registers**| Partially Developed | Form 16 Part A/B, EPFO ECR text file, and ESIC monthly return export | Only Form 25 Muster Roll exists on frontend | Create export generators producing official ECR text and Form 16 PDF templates. | **HIGH** |
| **Bonus Act Compliance**| Partially Developed | Statutory annual bonus calculation under Payment of Bonus Act 1965 | Only manual discretionary bonuses supported | Implement 8.33% to 20% calculation on ₹7,000 statutory wage ceiling. | **MEDIUM** |
| **Minimum Wages Check**| Not Started | Validation comparing basic pay against state/skill minimum wages | No statutory minimum wage thresholds stored in database | Create `StateMinimumWage` master table and validation warning on salary creation. | **MEDIUM** |
| **File Upload Security**| Partially Developed | Stream-level Magic Byte inspection (file signatures) | Relies on client-controlled file extension and MIME header | Inspect initial 16 bytes for valid file headers (`%PDF-`, PNG, JPEG) in middleware. | **HIGH** |
| **Concurrency Handling**| Partially Developed | Explicit error propagation when secondary update conflict occurs | Returns 0 silently in `ApplicationDbContext.SaveChanges` | Throw `DbUpdateConcurrencyException` to trigger HTTP 409 Conflict. | **HIGH** |
| **Face Recognition** | Not Started | Facial embedding model, camera capture, matching service | Hardware turnstiles supported, but no mobile/web Face AI punch | Integrate face capture library (e.g. face-api.js or server-side OpenCV/ONNX model). | **LOW** |
| **Disciplinary Inquiries**| Not Started | Show-cause notices, enquiry committee, and disciplinary actions | No disciplinary tracking tables exist | Create `DisciplinaryCase`, `ShowCauseNotice`, and `InquiryAction` entities and screens. | **LOW** |
| **Frontend Convergence**| Functioning | Harmonized component library and uniform design tokens | Two separate frontends running React 18 vs 19 and Tailwind v3 vs v4 | Upgrade `frontend-hrms` to React 19 and share `@uab/ui` primitives via monorepo. | **MEDIUM** |
| **Repository Hygiene** | Functioning | Clean git status, automated cleanup of huge logs | 2.6 MB `infra_build.log`, empty `SharedKernel`, unstaged files in hrms | Commit unstaged metadata migration, delete log files, and prune empty directory. | **MEDIUM** |

---

## 3. Prioritized Action Plan Summary

1. **Immediate Tier (Critical Bugs & Security)**:
   - Fix `LeaveController.cs:64-66` hardcoding bug.
   - Enforce ₹20,00,000 Gratuity statutory cap in `PayrollSettlementService.cs`.
   - Add magic byte verification to `FileUploadValidationMiddleware.cs`.
   - Rethrow concurrency exceptions in `ApplicationDbContext.SaveChanges()`.

2. **Short-Term Tier (Indian Statutory Completion)**:
   - Implement Compensatory Off backend ledger and balance management.
   - Implement Labour Welfare Fund (LWF) state rules.
   - Build EPFO ECR and ESIC monthly return text file generators.

3. **Medium-Term Tier (Architecture & Commercialization)**:
   - Unify `frontend-hrms` and `frontend` dependency versions (React 19).
   - Clean up repository logs and prune empty directories.
   - Prepare multi-tenant tenant onboarding self-service wizard.
