# 📂 UAB INDIA ENTERPRISE SUITE — FOLDER STRUCTURE AUDIT
**Document ID:** `AUDIT-DOC-003`  
**Evaluation Date:** November 2026  
**Auditor Roles:** Senior Full-Stack Developer, DevOps Engineer & Enterprise Software Architect  

---

## 1. Audit Classification Taxonomy

Every file and directory evaluated in this audit is classified strictly into one of seven standardized categories:

- **[KEEP]**: Required, well-implemented, and adheres to enterprise architecture standards.
- **[MODIFY]**: Required, but requires code changes, configuration corrections, or enhancements.
- **[RELOCATE]**: Required, but situated in an incorrect, unintuitive, or non-standard directory.
- **[MERGE]**: Duplicate functionality or redundant file that must be consolidated into a single authority.
- **[REMOVE CANDIDATE]**: Obsolete, temporary, or unneeded file that bloats the codebase (subject to review before deletion).
- **[INVESTIGATE]**: Unestablished runtime dependency or unclear origin requiring team alignment.
- **[CREATE]**: Essential directory or configuration file that is currently missing and must be added.

---

## 2. Root Directory Files Audit

| File / Folder | Current Location | Purpose & Dependencies | Status | Recommendation & Technical Reason |
| :--- | :--- | :--- | :--- | :--- |
| `.env` | `/` | Local environment variables & secrets | **[KEEP]** | Keep locally. Must never be committed to source control (properly listed in `.gitignore`). |
| `.env.example` | `/` | Sample environment configuration for local dev | **[MODIFY]** | Add missing variables (e.g. `SEED_ADMIN_PASSWORD`, Redis password) to match production template. |
| `.env.production` | `/` | Production environment overrides | **[KEEP]** | Keep secure on server; ensure never committed to public git repos. |
| `.env.production.example`| `/`| Reference production environment template | **[KEEP]** | Comprehensive reference for cloud/VPS deployments. |
| `build.log` | `/` | Build artifact log (274 KB) | **[REMOVE CANDIDATE]** | Build artifact generated during build. Add to `.gitignore` and delete from repository. |
| `infra_build.log` | `/` | Infrastructure build output log (2.6 MB) | **[REMOVE CANDIDATE]** | Huge 2.6 MB log file bloating git history. Add to `.gitignore` and remove. |
| `package.json` | `/` | Root npm scripts orchestrator (`dev`, `build`, etc.) | **[KEEP]** | Centralizes multi-portal commands (`dev:erp`, `dev:hrms`, `api:watch`). |
| `UabIndia.sln` | `/` | Master .NET Visual Studio solution file | **[MODIFY]** | Currently links 8 projects. Update project references once `SharedKernel` is resolved. |
| `global.json` | `/` | Enforces .NET SDK version `10.0.400` | **[KEEP]** | Ensures deterministic SDK resolution across developer machines and build agents. |
| `start-platform.ps1` | `/` | PowerShell script launching API, ERP & HRMS portals| **[KEEP]** | Highly convenient developer automation tool for multi-service launch. |
| `switch-env.ps1` | `/` | Utility script to swap `.env` files between environments| **[KEEP]** | Useful developer tool for toggling dev, staging, and prod configurations. |
| `setup.ps1` | `/` | Initial machine dependency installer | **[MODIFY]** | Ensure it checks for .NET 10 SDK and Node 24 prerequisites before proceeding. |
| `deploy.ps1` / `deploy.sh`| `/` | Root deployment scripts | **[RELOCATE]** | Move into `scripts/` directory to prevent root directory clutter. |
| `docker-compose.yml` | `/` | Dev/local Docker composition | **[MODIFY]** | Add missing `hrms` container so local docker environment matches production capabilities. |
| `docker-compose.prod.yml`| `/` | Production multi-container composition | **[MODIFY]** | Fix `NEXT_PUBLIC_API_URL` to remove trailing `/api/v1` and ensure volume mounts align with host. |
| `nginx.conf` | `/` | Root-level Nginx configuration (5.6 KB) | **[MERGE]** | Duplicate of `nginx/nginx.conf` (7.3 KB). Consolidate into `nginx/nginx.conf` and delete root copy. |
| `DESIGN.md` | `/` | Design token dictionary and layout guide | **[RELOCATE]** | Move into `docs/` or `frontend/docs/` for clean root structure. |
| `MODULAR_ARCHITECTURE_GUIDE.md`| `/`| Master enterprise platform architectural guide | **[RELOCATE]**| Move into `docs/architecture/` to preserve architecture history in one place. |
| `README.md` | `/` | Primary repository documentation | **[MODIFY]** | Update to document the dual-portal setup (ERP at port 3000, HRMS at port 3001, API at port 5000). |

---

## 3. Backend Directory Structure Audit (`Backend/`)

### 3.1 Solution Projects Overview

| Directory / Project | Purpose | Status | Technical Analysis & Recommendation |
| :--- | :--- | :--- | :--- |
| `Backend/src/UabIndia.Api` | Web API presentation layer, middleware, hubs, startup | **[KEEP]** | Core API entry point. Houses 986-line `Program.cs`, OpenAPI/Swagger, Hangfire dashboard, and SignalR hubs. |
| `Backend/src/UabIndia.Core` | Domain entities, enums, pure business logic, statutory math | **[KEEP]** | Clean domain layer. Zero third-party web dependencies. Houses `IndiaStatutoryCalculator`. |
| `Backend/src/UabIndia.Application` | CQRS abstractions, DTO models, service interfaces | **[MODIFY]** | Clean application contracts, but contains duplicate `ApiResponse.cs` in two separate subfolders. |
| `Backend/src/UabIndia.Infrastructure` | EF Core DbContext, repositories, payment gateways, Hangfire | **[KEEP]** | Heavy infrastructure layer. Manages database mappings, migrations, and external providers. |
| `Backend/src/UabIndia.Identity` | OpenIddict SSO, OAuth2 endpoints, token issuance | **[KEEP]** | Dedicated identity layer for central enterprise authentication. |
| `Backend/src/UabIndia.Billing` | SaaS subscription plans, invoices, and license meter | **[KEEP]** | Billing service provider for multi-tenant SaaS monetization. |
| `Backend/src/UabIndia.Worker` | Dedicated Hangfire background processing worker daemon | **[KEEP]** | Offloads long-running payroll computations, outbox event delivery, and reporting from web nodes. |
| `Backend/src/UabIndia.SharedKernel` | Intended for cross-cutting domain primitives | **[REMOVE CANDIDATE]** | Completely empty folder without `.csproj` or code. Remove if not used, or populate with common records. |
| `Backend/src/Modules/` | Domain controllers compiled into `UabIndia.Api` | **[MODIFY]** | Modular monolith design. Currently compiles via `<Compile Include="..\Modules\**\*.cs" />` in `UabIndia.Api.csproj`. Recommend formalizing into proper project libraries in Phase 2. |
| `Backend/tests/UabIndia.Tests` | 375 automated unit and integration tests | **[KEEP]** | Excellent test suite covering ABAC, multitenancy, payroll, compliance, and workflows. |
| `Backend/tests/LoadTests` | k6 performance and load testing scripts | **[KEEP]** | Validates API concurrency and latency thresholds under high load. |
| `Backend/scripts/migrations` | SQL scripts, idempotent bootstrap, and migration history | **[KEEP]** | Houses `initial-clean-idempotent.sql` and versioned schema updates. |

### 3.2 Backend Module Breakdown (`Backend/src/Modules/`)

| Module Folder | Controller Count | Primary Purpose | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `Administration` | 58 Controllers | Multi-tenancy, users, roles, permissions, dynamic forms/pages, audit logs | **[KEEP]** | Largest module; provides no-code platform capability and system settings. |
| `HRMS` | 23 Controllers | Employees, attendance, shifts, leave, recruitment/ATS, appraisals, lifecycle | **[MODIFY]** | Fix relational bug in `LeaveController.cs:64-66`; add comp-off ledger endpoints. |
| `Payroll` | 10 Controllers | Salary structures, payroll runs, payslips, arrears, loans, F&F settlements | **[MODIFY]** | Add statutory cap (₹20L) to Gratuity in settlement service; link PT state calculator. |
| `Finance` | 16 Controllers | Chart of accounts, journal entries, payments, bank reconciliation, invoices | **[KEEP]** | Complete double-entry accounting engine with currency conversion. |
| `Sales` | 7 Controllers | Quotations, orders, sales invoices, pricing, returns | **[KEEP]** | Functional commercial B2B sales pipeline. |
| `Inventory` | 7 Controllers | Items, warehouses, stock movements, batch tracking, WMS | **[KEEP]** | Multi-warehouse inventory with moving average valuation. |
| `Procurement` | 5 Controllers | Purchase orders, vendor management, goods receipts, purchase invoices | **[KEEP]** | Standard purchase workflow integrated with accounts payable. |
| `Projects` | 4 Controllers | Projects, project tasks, timesheets, field service | **[KEEP]** | Time tracking and milestone management. |
| `CRM` | 4 Controllers | Leads, contacts, opportunities, CRM activities | **[KEEP]** | Customer acquisition and relationship tracking. |
| `Manufacturing`| 4 Controllers | BOM (Bill of Materials), work orders, subcontracting (GST Rule 55), QM | **[KEEP]** | Industrial production and job-work processing. |
| `Assets` | 3 Controllers | Fixed assets, depreciation schedules, asset allocations | **[KEEP]** | Asset register with straight-line depreciation engine. |
| `Compliance` | 2 Controllers | Statutory settings, PF/ESI/PT tax filings, compliance audits | **[MODIFY]** | Expand with Gratuity, LWF, and Bonus statutory registers. |
| `Notifications` | 2 Controllers | In-app alerts, email/SMS/WhatsApp message dispatch | **[KEEP]** | Multi-channel communication engine. |
| `Workflow` | 2 Controllers | Approval requests, workflow definitions, transition state engine | **[KEEP]** | Universal approval engine for leaves, expenses, and commercial documents. |

---

## 4. Frontend Directory Structure Audit (`frontend/`)

| Directory / File | Purpose | Status | Technical Recommendation |
| :--- | :--- | :--- | :--- |
| `frontend/src/app/(auth)` | Login, register, password reset, OTP verification | **[KEEP]** | Next.js App Router public auth routes. |
| `frontend/src/app/(protected)`| 192 authenticated enterprise ERP pages | **[KEEP]** | Dense operational back-office pages organized by functional domain. |
| `frontend/src/components/ui` | Radix UI primitives (Dialog, Select, Table, Toast, etc.) | **[KEEP]** | Accessible, headless UI component foundations. |
| `frontend/src/components/dynamic`| Metadata page renderers and universal form engines | **[KEEP]** | Renders metadata-driven views configured in the database. |
| `frontend/src/features/` | Feature-owned UI modules (hrms, payroll, finance, etc.) | **[KEEP]** | Domain-sliced feature components preventing monolithic page bloat. |
| `frontend/src/services/` | Axios client (`apiClient.ts`) and modular domain clients | **[KEEP]** | Handles token refresh retries, CSRF injection, and error dispatch. |
| `frontend/next.config.ts` | Next.js configuration, rewrites, standalone output | **[KEEP]** | Configured for Docker standalone deployment and server-side rewrites. |
| `frontend/tsconfig.json` | TypeScript compiler configuration | **[KEEP]** | Strict mode enabled; typecheck passes cleanly with zero errors. |

---

## 5. Dedicated HRMS Portal Audit (`frontend-hrms/`)

| Directory / File | Purpose | Status | Technical Recommendation |
| :--- | :--- | :--- | :--- |
| `src/metadata/hrmsCatalog.js`| Master schema catalog for 25+ HRMS/Payroll pages (88 KB)| **[KEEP]** | Core metadata engine driving dynamic tables, forms, and drawer views. |
| `src/services/hrmsService.js`| Dual-mode resilient service with localStorage mock fallback | **[MODIFY]** | Ensure production mode logs warnings when falling back to mock data so users know backend status. |
| `src/modules/attendance/` | Muster Roll Form 25, Attendance Tracker, Duty Clock | **[KEEP]** | Highly responsive, visual workforce attendance tracking. |
| `src/modules/payroll/` | 4-Step Payroll Wizard, Printable Payslips with print CSS | **[KEEP]** | Ready-to-use client interface for monthly payroll run execution. |
| `src/modules/recruitment/` | ATS visual Kanban pipeline, job postings, candidates | **[KEEP]** | Drag-and-drop talent acquisition workflow. |
| `src/modules/selfservice/` | ESS & MSS portal views for employees and managers | **[KEEP]** | Self-service punch, leave requests, and approval actions. |
| `vite.config.js` | Vite build tool configuration with dev proxy | **[KEEP]** | Proxies `/api` requests to backend on `http://127.0.0.1:5000`. |
| `Dockerfile` & `nginx.conf` | Containerization for standalone static hosting | **[KEEP]** | Builds lightweight 256MB Nginx static container. |

---

## 6. Miscellaneous & Documentation Folders

| Directory | Purpose | Status | Notes |
| :--- | :--- | :--- | :--- |
| `docs/` | Architecture guides, API collection, audit history | **[KEEP]** | Keep as centralized platform documentation repository. |
| `docs/architecture/` | In-depth architecture specifications and legacy maps | **[KEEP]** | Valuable historical audit and design documentation. |
| `nginx/` | Dedicated Nginx container configuration | **[KEEP]** | Houses master `nginx.conf` for reverse proxy and load balancing. |
| `scripts/` | VPS deployment, database backup, and maintenance scripts | **[KEEP]** | Essential DevOps operations runbook scripts. |
| `.agents/` | Agentic AI guidelines and configuration | **[KEEP]** | Development workflow tooling. |
| `.github/` | GitHub Actions CI/CD pipeline definitions | **[KEEP]** | Automated build and test verification pipeline. |
