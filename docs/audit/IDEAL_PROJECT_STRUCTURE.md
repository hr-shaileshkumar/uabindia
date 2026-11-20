# 🏗️ UAB INDIA ENTERPRISE SUITE — IDEAL PROJECT STRUCTURE PROPOSAL
**Document ID:** `AUDIT-DOC-012`  
**Evaluation Date:** November 2026  
**Auditor Roles:** Enterprise Software Architect, Senior Full-Stack Developer & DevOps Engineer  

---

## 1. Architectural Philosophy & Structure Objectives

> [!IMPORTANT]
> **Strict Working Rule Compliance**: This document proposes an optimized enterprise structure for stakeholder review. No folders or files will be moved or restructured without explicit approval.

The ideal structure organizes the repository into a clean **Enterprise Monorepo** with three clear pillars:
1. **Backend**: Clean Architecture / Modular Monolith where domain modules are formal C# class libraries (`.csproj`) rather than raw file inclusions.
2. **Frontend Applications**: Unified monorepo structure where apps share common TypeScript contracts, UI components, and API client interceptors.
3. **DevOps & Infrastructure**: Centralized scripts, deployment configurations, and database migration histories.

---

## 2. Proposed Target Project Hierarchy

```
UabIndia-Enterprise/
├── .github/                                # CI/CD GitHub Actions workflows
│   └── workflows/
│       ├── backend-ci.yml                  # .NET 10 build, test & code quality
│       ├── frontend-ci.yml                 # Next.js & Vite build, lint, typecheck
│       └── deploy-staging.yml              # Automated staging deployment pipeline
│
├── backend/                                # .NET 10 Solution Root
│   ├── UabIndia.sln                        # Master solution file
│   ├── Directory.Build.props               # Common compilation and warning rules
│   │
│   ├── src/
│   │   ├── Core/                           # Domain Layer (Pure C#, Zero Dependencies)
│   │   │   ├── UabIndia.Core.csproj
│   │   │   ├── Entities/                   # Domain entities (BaseEntity, Auditable)
│   │   │   ├── Enums/                      # Domain enumerations (TaxRegime, SystemRole)
│   │   │   └── Statutory/                  # Pure math (IndiaStatutoryCalculator)
│   │   │
│   │   ├── Application/                    # Use Cases, CQRS & Application Contracts
│   │   │   ├── UabIndia.Application.csproj
│   │   │   ├── Interfaces/                 # Service & repository contracts
│   │   │   ├── Common/                     # ApiResponse, PagedResult, CQRS abstractions
│   │   │   └── Dtos/                       # Request & response data transfer objects
│   │   │
│   │   ├── Infrastructure/                 # Persistence, EF Core & External Integrations
│   │   │   ├── UabIndia.Infrastructure.csproj
│   │   │   ├── Data/                       # ApplicationDbContext, Mappings, Migrations
│   │   │   ├── Services/                   # LedgerPosting, PayrollEngine, S3Storage
│   │   │   └── Repositories/               # Data access implementations
│   │   │
│   │   ├── Identity/                       # OpenIddict SSO & Central Auth
│   │   │   ├── UabIndia.Identity.csproj
│   │   │   └── Services/                   # JwtService, RefreshTokenService
│   │   │
│   │   ├── Modules/                        # Bounded Context Domain Modules (Formal C# Libs)
│   │   │   ├── UabIndia.Module.HRMS/       # Attendance, Leave, Recruitment, Shifts
│   │   │   ├── UabIndia.Module.Payroll/    # Runs, Payslips, Arrears, F&F Settlement
│   │   │   ├── UabIndia.Module.Finance/    # GL, Journal Entries, Bank Reconciliation
│   │   │   ├── UabIndia.Module.Commerce/   # Sales, CRM, Procurement, Inventory
│   │   │   └── UabIndia.Module.Admin/      # Multi-Tenancy, Users, Roles, Dynamic Pages
│   │   │
│   │   ├── Api/                            # ASP.NET Core Web API Host
│   │   │   ├── UabIndia.Api.csproj
│   │   │   ├── Middleware/                 # TenantResolver, RateLimiter, Csrf, Exception
│   │   │   ├── Hubs/                       # SignalR notification hubs
│   │   │   └── Program.cs                  # Host configuration & pipeline startup
│   │   │
│   │   └── Worker/                         # Standalone Background Daemon
│   │       ├── UabIndia.Worker.csproj
│   │       ├── Jobs/                       # Hangfire recurring cron jobs & outbox processor
│   │       └── Program.cs                  # Worker host startup
│   │
│   └── tests/
│       ├── UabIndia.Tests/                 # 375+ unit & integration test suites
│       └── UabIndia.LoadTests/             # k6 concurrency & performance scripts
│
├── apps/                                   # Frontend Applications Monorepo
│   ├── web-erp/                            # Next.js 15 Full ERP Back-Office Portal (Port 3000)
│   │   ├── src/app/                        # Next.js App Router protected & auth pages
│   │   ├── src/features/                   # Domain UI modules (finance, inventory, etc.)
│   │   └── next.config.ts
│   │
│   └── web-hrms/                           # Vite + React Specialized HRMS Client Portal (Port 3001)
│       ├── src/metadata/                   # Dynamic schema catalog (hrmsCatalog.js)
│       ├── src/modules/                    # Specialized visual views (Attendance, ATS, ESS)
│       └── vite.config.js
│
├── packages/                               # Shared Frontend Packages
│   ├── ui/                                 # Shared design primitives (Button, Table, Modal)
│   ├── api-client/                         # Shared Axios interceptor, tokens, error dispatch
│   └── types/                              # Shared TypeScript models and enum contracts
│
├── deploy/                                 # Infrastructure & Deployment
│   ├── docker/
│   │   ├── docker-compose.dev.yml          # Local developer composition
│   │   ├── docker-compose.prod.yml         # Hardened production composition
│   │   ├── Dockerfile.api                  # Multi-stage API container build
│   │   ├── Dockerfile.worker               # Background worker container build
│   │   ├── Dockerfile.erp                  # Next.js standalone container build
│   │   └── Dockerfile.hrms                 # Vite static Nginx container build
│   │
│   ├── nginx/
│   │   ├── nginx.conf                      # Master reverse proxy & rate limiting
│   │   └── conf.d/                         # SSL cert and subdomain routing rules
│   │
│   └── scripts/                            # Operational Runbook Automation
│       ├── backup-database.ps1             # SQL Server automated backup
│       ├── restore-database.sh             # Disaster recovery restore
│       ├── generate-secrets.ps1            # Production secret generation
│       └── setup-vps.sh                    # Host VM prerequisites and firewall
│
├── docs/                                   # Centralized Platform Documentation
│   ├── architecture/                       # System blueprints, data models, ERDs
│   ├── compliance/                         # Indian statutory rules & legal citations
│   └── user-guides/                        # Admin, HR manager, and ESS user manuals
│
├── package.json                            # Root npm workspace configuration
├── .env.example                            # Developer local environment template
└── README.md                               # Project onboarding and launch quickstart
```

---

## 3. Key Improvements in the Proposed Structure

1. **Formal Module Projects**: Instead of raw file wildcard compilation (`<Compile Include="..\Modules\**\*.cs" />`), modules become formal class libraries (`UabIndia.Module.HRMS.csproj`). This enforces clean dependency boundaries, faster incremental builds, and independent unit testability.
2. **Consolidated DevOps Directory**: Removes deployment scripts, multiple conflicting `nginx.conf` files, and build logs from the project root into a clean `deploy/` directory.
3. **Shared Frontend Packages**: Extracts the Axios client and UI primitives into shared monorepo packages (`packages/ui`, `packages/api-client`), allowing both the Next.js ERP and the Vite HRMS portal to reuse the exact same auth token refresh, CSRF handling, and styling without duplication.
4. **Isolated Transient Files**: Stricter root `.gitignore` ensuring that build logs (`*.log`), test artifacts, and caches never pollute version control.
