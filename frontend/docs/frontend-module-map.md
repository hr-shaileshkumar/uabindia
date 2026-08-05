# Frontend Module, Submodule, and Page Map

This document is derived from the current `frontend/src/app` structure and the centralized module registry.

## App Structure

- `src/app/(auth)`:
  Authentication and recovery routes such as login, register, forgot password, OTP, and reset password.
- `src/app/(protected)`:
  Logged-in ERP shell routes. This is the main workspace area.
- `src/app/*` public folders:
  Marketing and public website pages such as products, industries, pricing, contact, about, resources, privacy, and terms.

## UI Contract

### Module Level

Module home should show:

- Module title, purpose, and top actions
- Submodule cards
- Quick actions for the module
- Module information summary
- Page directory grouped by submodule

Examples:

- `/platform`
- `/hrms`
- `/payroll`
- `/finance`
- `/inventory`
- `/procurement`
- `/sales`
- `/security`

### Submodule Level

Submodule view should show:

- Only pages belonging to that submodule
- Focused quick actions for that submodule
- Optional submodule KPIs or summary badges
- A clean page list or card grid

Examples:

- Platform → `Tenant Management`
- HRMS → `Attendance & Time`
- Security → `Authentication`
- Inventory → `Stock Control`

### Page Level

Page view should show:

- The actual task UI
- Table, wizard, form, analytics view, or detail layout depending on the route
- No duplicate module branding or repeated shell chrome
- Clear relation to the selected submodule

Examples:

- `/platform/tenants`
- `/hrms/employees`
- `/payroll/runs`
- `/items`
- `/vendors`
- `/security/mfa`

## Current Module Map

The code version of this mapping lives in:

- `src/lib/erp/frontend-module-map.ts`

Use that file as the frontend source of truth for:

- module home route
- submodule grouping
- page purpose
- current implementation state

## Important Current Gaps

- CRM currently has a module home route, but child CRM routes are still missing in `src/app/(protected)`.
- Administration is conceptually a module, but many child pages still live as top-level legacy routes like `/dashboard`, `/approvals`, `/notifications`, and `/documents`.
- Finance and Inventory are structurally mapped now, but some child pages still need stronger visual alignment with the shared module-hub experience.
- Some routes still use placeholder-style mapped pages where a full SaaS-standard task page would be better.

## Recommended Rule

- Module route: summary and navigation only
- Submodule route or filter: grouped subset of pages
- Page route: actual execution screen

That separation should remain consistent across the whole protected frontend.
