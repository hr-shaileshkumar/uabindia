# Workflow Maturity Gap Closure Plan (2026)

## Objective

Move workflow from config-centric implementation to enterprise runtime engine.

## Current state (validated)

- Workflow definitions/config are present.
- Runtime behavior is partially implemented and not yet standardized for all critical modules.
- Escalation/SLA and consistent audit traceability need hard guarantees.

## Target capabilities

1. Definition layer
   - versioned workflow definitions
   - stage-level actor resolution (role/user/dynamic resolver)
   - conditional transitions (approve/reject/rework/escalate)

2. Runtime layer
   - workflow instance creation per business record
   - action execution API with idempotency safeguards
   - state machine enforcement (no illegal jumps)

3. Traceability layer
   - action history with actor, timestamp, comments, payload snapshot
   - rejection reason mandatory enforcement
   - full audit event stream

4. SLA & escalation layer
   - stage SLA clock (dueAt)
   - escalation policy to manager/admin queue
   - overdue notifications + dashboard counters

5. Integration layer
   - Leave, Payroll, Purchase, Journal posting, Vendor onboarding
   - module action blocked unless workflow reaches terminal approved state (for guarded actions)

## Implementation slices (recommended)

### Slice 1: Core runtime tables + APIs

- Add/verify entities:
  - `WorkflowInstance`
  - `WorkflowInstanceStep`
  - `WorkflowActionLog`
- APIs:
  - `POST /workflows/instances`
  - `POST /workflows/instances/{id}/actions`
  - `GET /workflows/instances/{id}`
  - `GET /workflows/instances/{id}/history`

### Slice 2: SLA/escalation

- Add fields: `dueAt`, `escalatedAt`, `escalationLevel`.
- Add background job:
  - identify overdue steps
  - create escalation events
  - notify assignees/escalation targets

### Slice 3: Module enforcement hooks

- Leave approval finalization must require approved workflow state.
- Purchase order posting must require approved workflow state.
- Journal post (financially sensitive) must require approved workflow state where enabled.

## Acceptance criteria

- Every action is traceable (who/when/what/from-to state).
- No direct business state mutation bypassing workflow in protected modules.
- Overdue stage automatically escalates and is visible in audit/logs.
- Hidden tests expectation: invalid transition always rejected with deterministic error.

## Test matrix (minimum)

- Positive:
  - create -> submit -> approve -> complete
  - create -> submit -> reject -> rework -> approve
- Negative:
  - approve without assignment
  - repeat same action (idempotency)
  - direct transition skip
- SLA:
  - dueAt breached -> escalation created

## Delivery order

1. Runtime model + APIs
2. Module integration for Leave and Purchase
3. SLA escalation jobs
4. Dashboard and report surfaces
5. UAT signoff
