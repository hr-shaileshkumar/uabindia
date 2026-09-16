# 10 — Workflow & Approval Architecture Audit

## Current Workflow Assets
The repository contains a dedicated Workflow module with:
- `WorkflowDefinition`: Defines approval chains for specific entities (e.g., `PurchaseOrder`, `LeaveRequest`, `ExpenseClaim`).
- `WorkflowStep`: Defines step order, required role, approver type, and SLA.
- `ApprovalRequest`: Tracks active approval state, approval history, comments, and timestamps.
- `ApprovalsController` & `WorkflowController`: REST endpoints for submitting, approving, rejecting, and delegating requests.

## Workflow Modernization Blueprint
1. **Frontend Unified Approval Queue**: `/approvals` acts as the cross-cutting inbox for all pending approvals (Leave, Expense, Purchase Order, Attendance Regularization).
2. **Metadata-Driven Transitions**: Replace hardcoded status buttons in entity detail drawers with dynamic action buttons fetched from `/api/v1/workflow/available-transitions?entity={type}&id={id}`.
3. **Audit Trail**: Every approval/rejection must cryptographically record `ApproverUserId`, `TenantId`, `Timestamp`, `ClientIp`, and `DigitalSignature` when applicable.
