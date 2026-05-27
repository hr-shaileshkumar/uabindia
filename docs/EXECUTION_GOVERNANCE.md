# Execution Governance Standard

## Objective

Prevent drift between implementation, documentation, and release communication.

## Mandatory Delivery Flow

1. **Development**  
   Implement change in code with scoped PR.
2. **Verification**  
   Run/observe CI gates (build, test, lint, security checks as applicable).
3. **Documentation Update**  
   Update `docs/PROJECT_STATUS_MASTER.md` and affected architecture/ops docs.
4. **Release Note Update**  
   Add a concise change entry in sprint/release notes.
5. **Approval & Merge**  
   Reviewer confirms governance checklist.

## PR Governance Checklist

- [ ] Scope clearly stated (what changed, why, risk).
- [ ] Tests added/updated (or N/A justified).
- [ ] CI passes for backend and frontend quality gates.
- [ ] `docs/PROJECT_STATUS_MASTER.md` updated.
- [ ] No stale status claims introduced.
- [ ] Operational impact documented (secrets/migrations/infra).

## Documentation Lifecycle

- `docs/PROJECT_STATUS_MASTER.md` = **current truth**.
- `docs/archive/` = historical snapshots only.
- Historical docs must include "legacy snapshot" disclaimer.

## Ownership & Cadence

- Weekly architecture/governance review: Engineering leads.
- Monthly operational readiness review: Engineering + DevOps.
- Pre-release freeze review: QA + Product + Engineering.
