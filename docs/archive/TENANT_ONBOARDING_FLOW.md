# Tenant Onboarding Flow

## Objective
Provision a tenant in a deterministic, auditable, rollback-safe workflow.

## Flow (authoritative)
1. API receives `CreateTenantDto` with `tenantProvisionRequestId`.
2. Duplicate-click guard checks distributed cache key `tenant-provision:{requestId}`.
3. Tenant record is created in master table (`dbo.Tenants`) as inactive.
4. Provisioning starts (queued via Hangfire or inline fallback).
5. Template schema clone and governance validation run.
6. Baseline seed runs:
   - roles
   - admin user
   - role assignment
   - module subscriptions
   - tenant profile metadata
7. Tenant activation flag is set from status policy.
8. Provisioning completion is recorded in audit and recovery snapshot.

## Required controls
- Idempotency token on every onboarding submit.
- Config-driven role mapping (no hardcoded ADMIN/EMPLOYEE assumptions).
- Template checksum enforcement when enabled.
- Provisioning checkpoints persisted with timestamps.

## Exit criteria
- Tenant is queryable in `GET /api/v1/tenants`.
- Admin account exists and is role-mapped from policy.
- Required module subscriptions are present.
- Recovery snapshot state is `completed`.
