# ERP Frontend Architecture

## Overview

This frontend is a Next.js App Router application under `frontend/` and follows a backend-authoritative SaaS model:

- authentication and session state come from backend cookies
- tenant, company, and project scope are backend-aware
- permissions and module enablement are backend-driven
- the frontend owns rendering, UX composition, and route-safe fallbacks

## Application Layers

### Routes

`src/app/` contains route groups for:

- public marketing and support
- auth
- protected ERP workspace

Routes should stay thin and delegate real UI to feature components.

### Features and UI

- `src/features/` contains feature-owned pages, schemas, and business UI
- `src/components/` contains reusable UI, layout, and shared page shell pieces
- `src/context/` contains auth, org scope, permissions, tenant config, and UI schema state

### API and Data

The frontend now has a two-tier API structure:

1. `src/services/`
   This is the runtime transport layer and existing service implementation layer.

   Important files:
   - `src/services/apiClient.ts`
   - `src/services/hrApi.ts`
   - `src/services/publicApi.ts`
   - `src/services/modules/*`

2. `src/lib/api/v1/`
   This is the production-facing frontend API contract.

   Each domain has its own module file and descriptor:
   - `auth`
   - `tenants`
   - `companies`
   - `projects`
   - `users`
   - `roles`
   - `permissions`
   - `employees`
   - `attendance`
   - `leave`
   - `payroll`
   - `recruitment`
   - `assets`
   - `documents`
   - `reports`
   - `finance`
   - `inventory`
   - `crm`
   - `operations`
   - `settings`

   Each module declares a status:
   - `ready`
   - `partial`
   - `placeholder`

   This keeps production readiness explicit without forcing a risky full rewrite of existing page integrations in one pass.

## Transport Layer Responsibilities

`src/services/apiClient.ts` is the single Axios client and owns:

- `/api/v1` base usage
- `withCredentials`
- tenant header propagation
- company and project scope headers
- CSRF token bootstrap for mutating requests
- refresh-token retry handling on `401`
- global API error event dispatch

## Service Layer Responsibilities

### `src/services/hrApi.ts`

This remains the large authenticated service surface for existing pages and covers:

- platform and tenant administration
- company and project management
- HRMS
- payroll
- reports and compliance
- ERP domains such as customers, vendors, items, finance, warehousing, and stock movement
- workflows, approvals, notifications, helpdesk, and communication

### `src/services/publicApi.ts`

This remains the public-facing service surface for:

- marketing pages
- company profile data
- public content
- job postings
- contact and request-access forms

## Protected Workspace

The protected workspace uses one common shell rooted in `src/app/(protected)/layout.tsx`.

The shell is responsible for:

- authenticated access flow
- module-aware navigation
- tenant/company/project context display
- shared topbar and navigation behavior
- workspace-safe fallback routing

## Public Experience

Public routes live outside the protected route group and share common marketing primitives instead of page-specific one-off layouts.

These routes include:

- `/`
- `/about`
- `/careers`
- `/contact`
- `/pricing`
- `/products`
- `/industries`
- `/resources`
- `/login`

## Navigation and Permissions

The app uses a hybrid model:

- backend UI-shell payloads can shape menus and route rules
- local route config provides normalization and safe fallbacks
- legacy `/erp/*` compatibility still exists and should be treated as transitional

## Environment Contract

Frontend deployment should use:

- `.env.example`
- `.env.production.example`

Rules:

- do not append `/api/v1` to env values
- `NEXT_PUBLIC_API_URL` is the public browser-visible origin
- `API_BASE_URL` is the main server-side rewrite origin
- `BACKEND_INTERNAL_URL` is optional for private network routing

## Validation Workflow

Run from `frontend/`:

```bash
npm run lint
npm run typecheck
npm run build
```

## Current Migration Guidance

- Existing page code may continue to use `hrApi` while stable
- New frontend work should prefer `src/lib/api/v1/*`
- Do not remove legacy wrappers until their consumers have been migrated and verified
