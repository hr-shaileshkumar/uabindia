# Deployment Readiness Gap Closure (2026)

## Objective

Close infra and release-management gaps so ERP can move to predictable production operations.

## Critical gaps

- Environment and secret handling are not uniformly enforced across services.
- Rollback/playbook depth is inconsistent.
- Monitoring and alerting are not fully tied to business-critical flows.

## Required baseline before go-live

### 1) Environment hardening

- All required env vars documented and validated at startup.
- No secrets in repo; vault-backed configuration only.
- Separate dev/stage/prod values with immutable deploy artifacts.

### 2) CI/CD gates (must pass)

- Backend: restore + build + tests.
- Frontend: install + lint + build.
- Security checks: dependency + secret scan + container/image scan (where applicable).
- Migration checks for DB changes.

### 3) Release safety

- Blue/green or canary deploy pattern (preferred).
- Rollback target artifact pre-verified.
- Post-deploy smoke tests automated.

### 4) Observability

- Logs centralized (request-id and tenant correlation).
- Metrics: API latency/error rates, queue depth, workflow SLA misses.
- Alerts: auth failure spike, payment/posting failures, escalation backlog.

### 5) Data protection

- Automated backups with restore drill evidence.
- RPO/RTO documented.
- DB migration rollback strategy tested.

## Go-live checklist (exit criteria)

- [ ] Secrets loaded from vault only.
- [ ] CI pipeline green on main and release branch.
- [ ] Smoke tests pass on staging and production.
- [ ] Rollback rehearsal completed in staging.
- [ ] Monitoring dashboards + pager alerts active.
- [ ] UAT signoff by module owners.

## Ownership model

- Engineering: build/test gates, release automation, rollback scripts.
- DevOps: infra, secrets, observability, backup/restore.
- QA/UAT: signoff matrix by role/persona.
- Product/Ops: go-live approval and hypercare priorities.

## Hypercare (first 7 days)

- Daily incident triage at fixed slot.
- Real-time error budget tracking.
- Priority SLA for auth, payroll posting, approvals, document upload.
- Freeze non-critical feature merges.
