# Uabindia ERP Frontend

Next.js App Router frontend for the ERP, HRMS, payroll, finance, inventory, CRM, projects, and public marketing surfaces.

## Core Structure

- `src/app/`: routes and route groups
- `src/features/`: feature-owned UI
- `src/components/`: shared UI primitives and shells
- `src/services/`: runtime transport and legacy service wrappers
- `src/lib/api/v1/`: production-facing module API facade
- `src/context/`: auth, permission, org, and UI schema state
- `docs/`: audits, page maps, and design references

## API Layers

The frontend now exposes two API layers by design:

1. `src/services/apiClient.ts`
   Owns Axios config, cookies, CSRF, tenant headers, org scope headers, refresh-token retries, and global API error dispatch.

2. `src/lib/api/v1/*`
   Owns the stable module-wise frontend contract for production work. Each file maps to a business domain and declares one of:
   - `ready`
   - `partial`
   - `placeholder`

Current module map:

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

## Environment

Use these files as the contract:

- `.env.example`
- `.env.production.example`

Important rules:

- Keep API origins at the backend host only
- Do not append `/api/v1` to env values
- `NEXT_PUBLIC_API_URL` is browser-visible
- `API_BASE_URL` is used by server-side rewrites
- `BACKEND_INTERNAL_URL` is optional for private production networking
- `NEXT_PUBLIC_TENANT_SUBDOMAIN` is only a fallback for localhost or non-subdomain cases

## Local Development

```bash
npm install
npm run dev
```

Frontend default URL:

```text
http://localhost:3000
```

## Validation

Run from `frontend/`:

```bash
npm run lint
npm run typecheck
npm run build
```

## Production Readiness Notes

- Existing pages still use `hrApi` and `publicApi` where already wired
- New work should prefer `src/lib/api/v1/*`
- The facade is additive and does not break current page routes
- `assets` is intentionally a typed placeholder until backend endpoints exist

## Reference Docs

- `docs/FRONTEND_PRODUCTION_AUDIT_2026-06-29.md`
- `ARCHITECTURE.md`
