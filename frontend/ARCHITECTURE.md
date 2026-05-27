# ERP Frontend - Architecture Guide

## Overview

This frontend is a Next.js App Router application under `frontend/` that follows a **backend-authoritative** pattern:

- authentication, tenant scope, enabled modules, and permissions come from the backend
- the frontend focuses on rendering, navigation, local UI state, and user workflow composition
- feature logic lives close to the feature, while API access is centralized under `src/services/`

---

## Current design principles

### 1. Backend decides access
- **Authentication** uses backend-issued session/cookie flows and API responses
- **Enabled modules** come from backend metadata (`/api/v1/modules/enabled`, `ui-shell/*`)
- **Route permission rules** are primarily backend-driven, with a local fallback matrix in `src/config/route-permissions.config.ts`
- **Tenant/company/project scope** is applied via headers and persisted context values

### 2. Thin routes, feature-owned UI
- `src/app/` owns routing only
- `src/features/` owns business-facing UI and module components
- route files should stay thin and delegate rendering to feature components where practical

### 3. Centralized API layer
- `src/services/apiClient.ts` owns Axios configuration and interceptors
- `src/services/hrApi.ts` groups authenticated ERP/HRMS/platform APIs
- `src/services/publicApi.ts` groups public landing/contact/profile APIs
- `src/hooks/` contains reusable API-oriented hooks where a hook abstraction is useful

### 4. Shared utilities stay small and specific
- `src/lib/` is reserved for helper-style utilities such as public profile shaping and UI-schema helpers
- API service modules do **not** live in `src/lib/` anymore

---

## Current file structure

```
frontend/src/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (protected)/
│   │   ├── layout.tsx
│   │   ├── module-navigation.ts
│   │   ├── dashboard/page.tsx
│   │   ├── hrms/**/page.tsx
│   │   ├── payroll/**/page.tsx
│   │   ├── platform/**/page.tsx
│   │   └── ...other protected routes
│   ├── about/page.tsx
│   ├── careers/page.tsx
│   ├── contact/page.tsx
│   ├── layout.tsx
│   └── providers.tsx
├── components/
│   ├── Topbar.tsx
│   ├── Sidebar.tsx
│   ├── GlobalSearch.tsx
│   ├── ProtectedRoute.tsx
│   └── layout/
├── constants/
│   ├── permissions.ts
│   └── routes.ts
├── config/
│   └── route-permissions.config.ts
├── context/
│   ├── AuthContext.tsx
│   ├── OrgContext.tsx
│   ├── PermissionContext.tsx
│   ├── TenantConfigContext.tsx
│   └── UiSchemaContext.tsx
├── features/
│   ├── dashboard/
│   ├── erp/
│   ├── hrms/
│   └── shared/
├── hooks/
│   └── useHrmsApi.ts
├── services/
│   ├── apiClient.ts
│   ├── hrApi.ts
│   └── publicApi.ts
├── lib/
│   ├── publicProfile.ts
│   └── ui-schema/
└── types/
```

---

## Service layer

### `src/services/apiClient.ts`

This is the single Axios base client for authenticated application traffic.

Key responsibilities:
- sets `/api/v1` base URL
- enables `withCredentials`
- attaches tenant header when applicable
- attaches company/project context headers when applicable
- ensures CSRF token on mutating requests
- attempts refresh-token recovery on `401`
- dispatches global API error events for UI handling

### `src/services/hrApi.ts`

This is the main typed application API surface used by protected routes and feature components.

It groups domains such as:
- modules / licensing / platform
- system / search / ui-shell
- hrms / payroll / reports / compliance
- erp areas such as customers, vendors, items, chart of accounts, payments, warehouses, stock movements, documents, notifications, and entity fields

### `src/services/publicApi.ts`

This is the public-site API surface used by:
- landing page
- about page
- careers page
- contact page

---

## Navigation and permission model

### Sidebar/navigation sources

The app currently uses a hybrid model:

- backend metadata can provide navigation and route rules through `ui-shell/*`
- local fallback navigation is defined in `src/app/(protected)/module-navigation.ts`
- route constants live in `src/constants/routes.ts`

### Route permission fallback

`src/config/route-permissions.config.ts` provides:

- canonical route normalization
- legacy alias mapping
- a compatibility fallback permission matrix
- helpers for resolving permission keys and first accessible routes

This means the frontend stays resilient even if backend UI metadata is unavailable temporarily.

---

## App shell

### `src/app/(protected)/layout.tsx`

The protected layout is the main application shell.

Responsibilities include:
- loading authenticated user context
- loading enabled modules / permission context
- composing `Topbar`, `Sidebar`, and protected content
- handling backend-driven route rules and navigation fallbacks

### Shared chrome

- `src/components/Topbar.tsx` handles workspace context selection, global search, refresh, and user actions
- `src/components/Sidebar.tsx` renders module navigation and active-state UI
- `src/components/GlobalSearch.tsx` provides client-side navigation search UX

---

## Feature composition

Examples of current feature ownership:

- `src/features/dashboard/components/ERPDashboardPage.tsx`
- `src/features/erp/components/PageShell.tsx`
- `src/features/erp/components/SchemaCrudPage.tsx`
- `src/features/hrms/components/EmployeeList.tsx`
- `src/features/hrms/components/EmployeeForm.tsx`
- `src/features/shared/components/ModuleOverviewPage.tsx`

Guideline:

- keep `page.tsx` files lightweight
- move reusable or feature-specific UI into `src/features/<domain>/components/*`
- keep generic cross-feature UI in `src/components/*`

---

## Public pages

Public marketing/support routes live in `src/app/` outside the protected route group:

- `/`
- `/about`
- `/careers`
- `/contact`
- `/login`

These pages commonly use:
- `src/services/publicApi.ts`
- `src/lib/publicProfile.ts`

---

## Development workflow

### Recommended validation

Run from `frontend/`:

```bash
npm run lint
npm run build
```

### When adding a new page

1. add/update the route constant in `src/constants/routes.ts`
2. add navigation fallback entry in `src/app/(protected)/module-navigation.ts` if needed
3. add/update permission mapping in `src/config/route-permissions.config.ts` if applicable
4. create the route file under `src/app/(protected)/.../page.tsx`
5. place feature UI in `src/features/<domain>/components/*`
6. use `src/services/*` for API access
7. run lint and build

---

## Notes

- Package metadata and deployment/configuration paths should consistently target `frontend/`.
- `src/lib/` should remain small and utility-focused; service clients belong in `src/services/`.

**Config**:
- `next.config.ts`: API rewrites, redirects
- `src/app/providers.tsx`: AuthProvider wrapper

---

## Next Steps

1. **Verify Backend APIs**: Ensure all endpoints match this architecture
2. **Test End-to-End**: Login → modules load → navigate modules → refresh → logout
3. **Add CRM/Inventory**: Repeat module extension pattern
4. **Implement Permissioning**: Add permission checks from backend user object
5. **Add Analytics**: Track module usage, page views
6. **Production Deploy**: Set proper CORS, API domain, env variables
