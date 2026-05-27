# Architecture Remediation Plan (2026)

## Why this exists

Architecture is strong, but execution governance and operational maturity need structured closure.

## Priority Tracks

### Track A — Documentation & Governance (Week 1)

- Establish single truth file: `docs/PROJECT_STATUS_MASTER.md`.
- Classify old audit docs as legacy snapshots.
- Enforce PR checklist requiring status/doc updates.

### Track B — Workflow Engine Maturity (Week 2)

- Expand from definition CRUD toward runtime engine capabilities:
  - instance lifecycle tracking
  - approval history and rejection traces
  - escalation matrix and SLA handling
  - audit/event trail per action
- Add acceptance tests for business-critical flows (leave/payroll/purchase).
- Detailed execution guide: `docs/WORKFLOW_MATURITY_GAP_CLOSURE.md`.

### Track C — CI/CD & Quality Gates (Week 3)

- Enforce backend build + test and frontend lint + build on PR.
- Ensure pre-commit scripts and pipeline paths are consistent (`frontend` lowercase).
- Keep security scan visible and non-blocking only where explicitly justified.

### Track D — Production Operations Readiness (Week 4)

- Close infra checklist: cloud target, vault, DNS/TLS, backups, monitoring.
- Validate rollback strategy and smoke checks.
- Detailed execution guide: `docs/DEPLOYMENT_READINESS_GAP_CLOSURE.md`.

### Track E — UAT & Release (Weeks 5-6)

- UAT with role/persona matrix.
- Freeze, fix, sign-off, go-live.

## Structural Refactoring Guidance (Incremental)

### Backend

- Keep strict layering:
  - Controller -> Application -> Domain -> Infrastructure
- Move heavy controller logic into application services/use-cases.

### Frontend

- Adopt domain-first module ownership incrementally:
  - `src/modules/<domain>/{components,hooks,services,types,pages}`
- Continue using App Router as composition shell.

### Mobile

- Decide strategic scope (Lite vs Full ERP).
- Avoid mixed strategy; align roadmap and API contracts accordingly.
