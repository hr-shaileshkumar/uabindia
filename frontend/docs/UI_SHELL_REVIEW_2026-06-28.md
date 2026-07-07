# UI Shell Review

Date: 2026-06-28
Scope: `frontend` Next.js app shell, routing, public marketing pages, protected ERP workspace, and RBAC/navigation integration.

## Summary

The frontend already has the right architectural direction:

- Public and protected experiences are separated.
- Protected navigation is backend-driven through `UiSchemaContext`.
- Permission checks are centralized through `PermissionContext`.
- Route matching already supports canonical backend paths and legacy aliases.

The main problems are not missing foundations. The problems are inconsistency and drift:

- More than one internal page-shell pattern is active.
- The protected shell is visually split by role instead of sharing one SaaS layout.
- Breadcrumb and search are not centralized at the layout layer.
- A few pages still bypass the shared page system and render custom chrome.

## Strengths

- `src/app/(protected)/layout.tsx` already acts as the protected shell entry point.
- `src/context/UiSchemaContext.tsx` preserves backend-driven navigation and route rules.
- `src/lib/erp/navigation.ts` already builds reusable module/group/page structures from backend schema.
- Public marketing pages are largely unified around `PublicAudiencePageFrame`.

## Duplicate UI / Layout Patterns Found

1. `StandardPageLayout`
   Primary internal page shell used by many ERP, HRMS, payroll, reports, and platform pages.

2. `PageShell`
   Secondary internal page shell used by pages such as payments, journal entries, warehouses, and stock movements.

3. `PageHeader`-driven dashboard pages
   Used by `DashboardPage` and `WorkspacePage`, with their own breadcrumb/header row outside the standard page system.

4. Raw page-level layout
   `src/app/(protected)/notifications/page.tsx` was rendering custom page chrome instead of the shared layout.

## Route / Navigation Findings

- Internal browser routes are implemented as clean paths like `/notifications`, `/profile`, `/hrms/...`.
- Canonical route constants still use `/erp/...`, with Next rewrites and redirects bridging the gap.
- This works, but it increases mental overhead and can hide navigation bugs if components assume browser and canonical paths are the same.
- The route and RBAC model should stay backend-driven; the frontend should normalize paths rather than duplicate role logic.

## RBAC Findings

- Permission evaluation is centralized and reusable.
- UI schema loading is centralized and reusable.
- The main RBAC risk is not permissions themselves; it is hardcoding page chrome or navigation behavior outside the shared shell.

## Design / UX Findings

- Platform owner was using a dark shell while other portals used light shells.
- That violates the "one common layout system" requirement and makes the app feel like multiple products.
- Breadcrumbs were not globally guaranteed on all internal pages.
- Global search was visually present in the topbar but not implemented as a reusable workspace action surface.

## New Layout Target

One protected shell for all authenticated users:

- Light SaaS canvas
- Shared topbar
- Shared sidebar
- Shared breadcrumb layer
- Shared global search command surface
- Role-aware accents only
- Backend-driven menu and route access

## First Implementation Slice Completed

This audit turn also includes the first shell refactor:

- Added a global breadcrumb component for all protected routes.
- Added a backend-driven global search command surface.
- Unified portal themes onto one light shell system.
- Merged legacy `PageShell` onto `StandardPageLayout`.
- Moved notifications onto the shared internal page layout.

## Pending Work

- Normalize dashboard and module landing pages into the new shell language.
- Expand dashboard strategy for the requested role and module dashboard variants.
- Convert remaining legacy pages that still rely on bespoke page structures.
- Review public auth pages for any unnecessary duplication.
- Run a full route-by-route visual QA pass after module refactors.
