# Admin UI Design Standards

## Goal
Keep platform pages consistent, reusable, and testable.

## Component-first rule
Prefer shared admin primitives over per-page custom markup:
- `AdminButton`
- `AdminModal`
- `AdminFormField`
- `AdminTableShell`

## Interaction standards
- Buttons must set explicit `type="button"` unless submit is intended.
- Disable primary actions while request is in-flight.
- Guard against duplicate submit clicks in UI and API layers.
- Keep destructive actions confirm-gated.

## Messaging standards
- Use centralized notifications for success/error/warning/info.
- Clear stale error state when opening new create/edit workflows.
- Keep inline errors contextual; avoid unrelated page-level carryover.

## Migration order (post testing)
After onboarding QA and rollback validation, migrate remaining pages in this order:
1. permissions
2. audit logs
3. schema manager
4. settings
5. reports
6. helpdesk
