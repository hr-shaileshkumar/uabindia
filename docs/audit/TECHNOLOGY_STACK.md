# ⚙️ UAB INDIA ENTERPRISE SUITE — TECHNOLOGY STACK AUDIT
**Document ID:** `AUDIT-DOC-002`  
**Evaluation Date:** November 2026  
**Auditor Roles:** Senior Full-Stack Developer, DevOps Engineer, Database Architect & Enterprise Software Architect  

---

## 1. Complete Technology Stack Matrix

| Technology Layer | Selected Component | Version Verified | Purpose / Role | Lifecycle & Maintenance Assessment |
| :--- | :--- | :--- | :--- | :--- |
| **Backend Runtime** | .NET SDK | `10.0.401` | Core backend runtime & execution environment | Cutting-edge .NET release; stable LTS support; high throughput. |
| **Backend Language** | C# | `13.0` | Primary backend programming language | Modern features: primary constructors, ref structs, pattern matching. |
| **Web API Framework** | ASP.NET Core Web API | `10.0` | REST API hosting, routing, middleware pipeline | Kestrel web server configured for high concurrency (200k conns). |
| **ORM / Data Access** | Entity Framework Core | `10.0.14` | Relational object mapping, migrations, query filters | Uses SQL Server provider with split-query behavior and retry on failure. |
| **Relational Database** | Microsoft SQL Server | `2022-latest` (Docker) | Primary transactional and relational data store | Enterprise-grade ACID compliance, relational schemas, clustered indexing. |
| **Distributed Cache** | Redis | `7-alpine` | L2 caching, distributed session state, rate limit store | High-performance in-memory cache with LRU eviction and persistence. |
| **Background Processing** | Hangfire | `1.8.22` | Distributed recurring and asynchronous job scheduling | Uses SQL Server storage; partitioned queues for isolation. |
| **Authentication & SSO** | OpenIddict & JWT | `5.8.0` / Custom | OAuth2 / OpenID Connect provider & HMAC-SHA256 JWT | Standards-compliant OpenID Connect token engine with token rotation. |
| **Structured Logging** | Serilog & Sentry | `9.0.0` / `5.16.2` | Structured log formatting, file roll, Seq, Sentry APM | PII redaction enricher configured; suppresses verbose SQL commands. |
| **Request Validation** | FluentValidation | `11.3.1` | Declarative DTO validation | Integrated into MVC model binding pipeline. |
| **Realtime WebSockets** | Microsoft SignalR | `10.0.14` | Real-time push notifications and alerts | Direct SignalR Hub (`/hubs/notifications`) with JWT query token auth. |
| **Frontend 1 (ERP)** | Next.js App Router | `15.3.9` | Enterprise Back-Office Web Application | Next.js 15 SSR/SSG with App Router and Standalone Docker output. |
| **Frontend 1 UI Lib** | React | `19.2.8` | Component rendering engine | React 19 concurrent rendering, server components, and actions. |
| **Frontend 1 Styling** | Tailwind CSS | `v4.0` (with PostCSS) | Utility-first CSS framework | Next-gen CSS-first configuration using `@tailwindcss/postcss`. |
| **Frontend 1 State** | Zustand | `5.0.14` | Client global state management | Minimalist, unopinionated reactive store for auth and UI states. |
| **Frontend 1 Data Fetch**| TanStack Query & Table | `5.99.2` / `8.21.3` | Server state caching & virtualized high-density tables | Industry benchmark for enterprise data grids and asynchronous data caching. |
| **Frontend 2 (HRMS)**| Vite SPA | `5.0.8` | Specialized standalone HRMS Client Portal | Ultra-fast client-side bundle generation (built in 5.2s). |
| **Frontend 2 UI Lib** | React | `18.2.0` | Component rendering engine for HRMS portal | Stable React 18 client-side rendering with React Router DOM 6.20. |
| **Frontend 2 Styling** | Tailwind CSS | `v3.3.6` | CSS styling for dedicated HRMS portal | Standard Tailwind v3 utility engine. |
| **Reverse Proxy / SSL** | Nginx | `1.25-alpine` | Reverse proxy, SSL termination, rate limiting | Subdomain-based routing between Full ERP and Dedicated HRMS. |
| **Container Engine** | Docker & Compose | `3.8 Specification` | Containerized staging and production deployment | Multi-stage Dockerfiles for backend API, worker, frontend, and Nginx. |

---

## 2. Version Discrepancies & Ecosystem Compatibility Analysis

### 2.1 React 19 (Frontend ERP) vs React 18 (Frontend HRMS)
- **Observation**: `frontend/` utilizes React `19.2.8` with Next.js `15.3.9`, while `frontend-hrms/` utilizes React `18.2.0` with Vite `5.0.8`.
- **Architectural Impact**: 
  - Code and components cannot be directly shared across both codebases without transpilation isolation. For example, React 19 hooks and types in `@types/react: ^19` conflict with React 18 peer dependencies.
  - Development context switching: developers must use Tailwind v4 paradigms in `frontend` and Tailwind v3 configuration in `frontend-hrms`.
- **Recommendation**: In Phase 2 of the roadmap, upgrade `frontend-hrms` to React 19 to harmonize dependencies and allow shared component libraries via a monorepo workspace.

### 2.2 ASP.NET Core & EF Core 10.0 Preview / Current Release
- **Observation**: The backend references `.NET 10.0` (`net10.0`), SDK version `10.0.401`.
- **Architectural Impact**:
  - The project is running on the latest .NET release. EF Core 10 introduces strict checks on pending model changes (`RelationalEventId.PendingModelChangesWarning` which has been suppressed in code via options).
  - Excellent long-term lifespan, but requires host environments and CI/CD pipelines to carry the .NET 10 SDK runtime.

### 2.3 Environment Variable Naming Discrepancies
- In `frontend/README.md`: `NEXT_PUBLIC_API_URL` is mandated without `/api/v1` (backend host only, e.g. `http://localhost:5000`).
- In `docker-compose.prod.yml`: Line 149 passes `NEXT_PUBLIC_API_URL=http://backend:5000/api/v1`.
- **Impact**: Appending `/api/v1` in `docker-compose.prod.yml` causes double path prefixing (`/api/v1/api/v1/...`) in some frontend client calls that append `/api/v1` internally.
- **Fix**: Standardize all environment templates to specify backend host origin only without trailing subpaths.

---

## 3. Dependency Security & Vulnerability Audit

### Backend Packages (`UabIndia.Api.csproj`, `UabIndia.Infrastructure.csproj`):
- `HtmlSanitizer` (9.2.995): Secure XSS sanitizer for rich-text inputs.
- `Microsoft.AspNetCore.Authentication.JwtBearer` (10.0.14): Official Microsoft security library.
- `Hangfire.Core` & `Hangfire.SqlServer` (1.8.22): Industry standard background task manager.
- `OpenIddict.AspNetCore` (5.8.0): High-security OAuth2/OIDC implementation.
- `YamlDotNet` (13.0.0): Used for dynamic schema definitions.
- *Status*: All backend NuGet packages are current and have no known active CVEs.

### Frontend Packages (`frontend/package.json`):
- All 51 production dependencies verified.
- Vitest 2.1.8 with jsdom 29.1.1 configured for headless component testing.
- *Warning*: `The CJS build of Vite's Node API is deprecated`. Should migrate to ESM configuration in Vite config.

### Frontend HRMS Packages (`frontend-hrms/package.json`):
- Browserslist warning: `caniuse-lite is 11 months old`.
- *Status*: Clean build with Vite 5.4.21. No critical CVE vulnerabilities detected.
