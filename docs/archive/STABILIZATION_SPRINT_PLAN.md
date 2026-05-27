# Stabilization Sprint Plan (No New Features)

## Objective
Freeze architecture and execute a 3-phase hardening sprint to eliminate reactive patching and improve release discipline.

## Scope Lock
- No new feature development during this sprint.
- Work items limited to:
  1. Backend hardening
  2. Frontend design-system migration
  3. QA automation + release checklists
  4. Documentation completion

## Phase 1 — Backend Architecture Freeze

### Goals
- Make tenant onboarding deterministic and governance-driven.
- Remove hardcoded role behavior from provisioning/login creation paths.
- Add traceability for each provisioning step.

### Deliverables
- Config-driven role mapping:
  - `TenantProvisioning:RoleMappings:DefaultAdminRole`
  - `TenantProvisioning:RoleMappings:AllowedAdminRoles`
  - `TenantProvisioning:RoleMappings:DefaultEmployeeRole`
  - `TenantProvisioning:RoleMappings:AllowedEmployeeRoles`
- Template governance:
  - `TemplateVersion`
  - `TemplateChecksum`
  - `EnforceChecksum`
- Provisioning dashboard fields:
  - template schema
  - configured checksum
  - computed checksum
  - checksum validity
- Provisioning audit checkpoints:
  - started
  - template cloned
  - seed completed
  - completed/failed

### Exit Criteria
- No hardcoded admin/employee role assignment in onboarding or employee login creation.
- Governance checksum enforcement available via config.
- Provisioning dashboard reports governance status.

## Phase 2 — Frontend Design System Freeze

### Goals
- Ensure all admin-console pages use shared interaction and visual primitives.
- Remove one-off styling and ad-hoc toast placements.

### Required Common Building Blocks
- Common button variants (`Primary`, `Secondary`, `Danger`, `Approve`)
- Common table container (search/filter/empty-state/pagination slots)
- Common form field wrapper (label/error/help)
- Common modal wrapper
- Common notification interface (success/error/info/warning)

### Migration Target
- Platform pages: tenants, users, roles, permissions, companies, projects, feature-flags, schema-manager, audit-logs, contact-submissions, settings.

### Exit Criteria
- All platform pages consume common wrappers for action buttons and table shells.
- Notification UX is consistent and centralized.

## Phase 3 — QA Automation + Release Discipline

### Goals
- Establish repeatable validation gates and eliminate manual-only confidence.

### Mandatory Automation
- Tenant onboarding flow:
  - create tenant
  - idempotency duplicate request
  - admin user creation
  - role mapping assignment
  - rollback on failure
- Employee flow:
  - employee create with/without login
  - configured employee role mapping
- UI consistency smoke checks:
  - major platform pages render + list loaded state + empty state
- Notification contract checks:
  - API failure dispatch -> global toast

### Build/Test Gate (must pass before merge)
- `dotnet build UabIndia.sln --nologo`
- `dotnet test Backend/tests/UabIndia.Tests/UabIndia.Tests.csproj --nologo -v minimal`
- `npm --prefix frontend run build`

### Exit Criteria
- All gates pass in CI and local pre-release validation.
- QA checklist complete and attached to release note.

## Release Governance
- Every PR must map to one sprint phase and include:
  - impacted module(s)
  - tests added/updated
  - risk + rollback note
  - docs update (if behavior/config changed)
