# 🏢 UAB INDIA ENTERPRISE SUITE — PROJECT OVERVIEW
**Document ID:** `AUDIT-DOC-001`  
**Evaluation Date:** November 2026  
**Auditor Roles:** Enterprise Software Architect, ERP/HRMS Product Consultant, Database Architect, Senior Full-Stack Developer, DevOps Engineer, Cybersecurity Auditor & Technical Project Manager  
**Platform Version:** 1.0.1  
**Project Workspace:** `C:\Users\hp\Desktop\Uabindia`

---

## 1. Executive Summary & Project Purpose

The **UAB India Enterprise Suite** is a full-stack, multi-tenant enterprise software platform engineered to deliver comprehensive **Human Resource Management Systems (HRMS)**, **Payroll & Indian Statutory Compliance**, and **Enterprise Resource Planning (ERP)** capabilities for commercial SaaS operations.

### 1.1 Commercial & Operational Goals
- **Multi-Tenant SaaS Operations**: Supports multi-tenant isolation where multiple independent companies, client organizations, and subsidiaries operate securely within isolated tenant boundaries.
- **Unified Indian Statutory Compliance**: Designed to automate Indian compliance frameworks including Employee Provident Fund (EPF/EPS/EDLI), Employee State Insurance (ESIC), Professional Tax (PT across Indian States), Income Tax TDS (Old vs New Finance Act 2025 regimes), Payment of Gratuity Act 1972, GST Section 170 rounding, and vendor TDS (Sections 194C, 194J, 194Q).
- **Dual-Surface Delivery Model**:
  1. **Full ERP Suite (`frontend/`)**: A rich, data-dense Next.js 15 App Router platform for full enterprise back-office management (HRMS, Payroll, Finance & Double-Entry GL, Procurement, Inventory/WMS, Sales/CRM, Manufacturing, and System Administration).
  2. **Dedicated HRMS Portal (`frontend-hrms/`)**: A dedicated, lightweight, high-performance Vite + React portal exclusively focused on Human Resource Operations, Time & Attendance, ATS Recruitment, Employee Self-Service (ESS), and Manager Self-Service (MSS).

---

## 2. Architecture Topology & System Blueprint

The platform employs a **Server-Authoritative Modular Monolith Architecture** with centralized security, tenant scoping, policy engines, and background asynchronous jobs.

```
                                  CLIENT BROWSERS & MOBILE CLIENTS
                                                 │
                                                 ▼
                                ┌──────────────────────────────────┐
                                │      NGINX REVERSE PROXY         │
                                │   (Rate Limiting & SSL Offload)  │
                                └────────────────┬─────────────────┘
                                                 │
                   ┌─────────────────────────────┴─────────────────────────────┐
                   │ Subdomain: hrms.*                                         │ Default / Tenant Subdomains
                   ▼                                                           ▼
       ┌───────────────────────────┐                               ┌───────────────────────────┐
       │   DEDICATED HRMS PORTAL   │                               │       FULL ERP SUITE      │
       │    (frontend-hrms)        │                               │         (frontend)        │
       │  Vite 5 + React 18 SPA    │                               │ Next.js 15 + React 19 SSR │
       │  Port: 3001 (Nginx 80)    │                               │ Port: 3000                │
       └─────────────┬─────────────┘                               └─────────────┬─────────────┘
                     │                                                           │
                     │                 /api/v1/* (REST) & /hubs/* (SignalR)      │
                     └───────────────────────────┬───────────────────────────────┘
                                                 │
                                                 ▼
                               ┌───────────────────────────────────┐
                               │   ASP.NET CORE 10 WEB API         │
                               │   (Backend/src/UabIndia.Api)      │
                               │   Port: 5000 | 148 Controllers    │
                               │   1,033 HTTP REST Endpoints       │
                               └─────────────────┬─────────────────┘
                                                 │
                 ┌───────────────────────────────┼───────────────────────────────┐
                 │                               │                               │
                 ▼                               ▼                               ▼
   ┌───────────────────────────┐   ┌───────────────────────────┐   ┌───────────────────────────┐
   │    SQL SERVER 2022        │   │    REDIS 7 CACHE          │   │  HANGFIRE DEDICATED       │
   │    DATABASE ENGINE        │   │    Distributed Sessions   │   │  BACKGROUND WORKER        │
   │ 100+ Tables (Relational)  │   │    L2 Cache, Rate Limits  │   │  Outbox, Payroll, Sync    │
   │ Global Query Filters (EF) │   │    Port: 6379             │   │  (UabIndia.Worker)        │
   │ Port: 1433                │   └───────────────────────────┘   └───────────────────────────┘
   └───────────────────────────┘
```

---

## 3. High-Level Inventory of Verified Components

Empirical code inspection and automated test execution reveal the following verified component counts:

| Dimension | Verified Metric | Details / Status |
| :--- | :--- | :--- |
| **Backend Projects** | 8 Projects | `UabIndia.Api`, `UabIndia.Core`, `UabIndia.Application`, `UabIndia.Infrastructure`, `UabIndia.Identity`, `UabIndia.Billing`, `UabIndia.Worker`, `UabIndia.Tests` |
| **Backend Controllers** | 148 Controllers | 58 Admin, 23 HRMS, 10 Payroll, 16 Finance, 7 Sales, 7 Inventory, 5 Procurement, 4 Projects, 4 CRM, 4 Mfg, 3 Assets, 2 Compliance, 2 Notify, 2 Workflow, 1 Identity |
| **API Endpoints** | 1,033 HTTP Routes | 378 Admin, 257 HRMS, 82 Payroll, 74 Finance, 43 Compliance, 32 Sales, 28 Assets, 24 Inventory, 23 Procurement, 21 Notify, 19 Projects, 18 CRM, 16 Workflow, 11 Mfg, 7 Identity |
| **Database Entities** | 100+ DbSets | Defined in `ApplicationDbContext.cs` with Tenant isolation and soft-delete filters |
| **Automated Tests** | 546 Tests Passing | **375 Backend xUnit tests (100% pass)** + **171 Frontend Vitest tests (100% pass)** |
| **Next.js Pages (ERP)** | 192 Routes (`page.tsx`) | Located under `frontend/src/app/(protected)/...` and `frontend/src/app/(auth)/...` |
| **HRMS Pages (Vite)** | 25+ Page Catalogs | Metadata-driven catalog `hrmsCatalog.js` + dedicated operational screens |
| **Background Jobs** | 6 Hangfire Queues | `critical`, `payroll`, `reports`, `import-export`, `tenant-provisioning`, `default` |

---

## 4. Current State Assessment

### What the Platform Has Built Well:
1. **Robust Core Multi-Tenant Architecture**: Deeply integrated tenant resolution via subdomain, custom domain, and fallback header; enforced via EF Core Global Query Filters (`e.TenantId == _tenantAccessor.GetTenantId()`) across all database queries.
2. **Indian Statutory Payroll Foundation**: Accurate PF calculation with EPF/EPS split, ESI wage ceiling enforcement, Professional Tax state logic (KA, MH, TN, WB, GJ), Income Tax TDS calculator for Old and New FY 2025-26 regimes, and automatic GL ledger posting.
3. **Comprehensive Attendance Engine**: Web check-in, geofence radius validation with Haversine GPS distance calculation, turnstile biometric gateway push/heartbeat ingestion, roster/shift rotations, and Bradford score absenteeism analytics.
4. **Strong Test Baseline**: Cleanly passing test suites for both backend (375 tests) and frontend (171 tests), indicating high baseline stability for core libraries and utilities.

### What Is Incomplete, Broken, or Vulnerable:
1. **Critical Leave Bug**: `LeaveController.cs` (lines 64-66) hardcodes `EmployeeName = "Employee"` and `LeaveTypeName = "Leave"` in the `GetLeaveApplications` endpoint rather than performing relational joins with the `Employees` and `LeaveTypes` tables.
2. **Compensatory Off & Standalone Leave Encashment**: Exists purely as UI metadata in `frontend-hrms` without backend transaction logic, balance deduction, or approval workflow.
3. **Missing Statutory Gratuity Cap**: While F&F calculates gratuity at `(Basic * 15/26 * Years)`, it omits the statutory maximum ceiling of ₹20,00,000 under the Payment of Gratuity Act 1972.
4. **Missing Statutory Modules**: Labour Welfare Fund (LWF), Payment of Bonus Act 1965 calculations, and Minimum Wages Act compliance verification are absent.
5. **Security Gaps**: File uploads only validate file extension and Content-Type header without magic byte (file signature) inspection; `ApplicationDbContext.SaveChanges()` suppresses concurrency exceptions upon secondary failure by returning 0 without rethrowing.
6. **Repository Bloat**: Unused empty folder `Backend/src/UabIndia.SharedKernel`, massive build logs (`infra_build.log` 2.6 MB, `build.log` 274 KB, `msbuild.log` 1 MB), and duplicate `nginx.conf` files.
