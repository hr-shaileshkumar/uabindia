# Rollback Flow

## Objective
On onboarding failure, restore to a clean and explainable state.

## Trigger conditions
- Provisioning exception during schema clone/seed.
- Explicit rollback call (`RollbackTenantCreationAsync`).

## Persisted rollback artifacts
Stored under `tenantProfile.provisioningRecovery` in `dbo.TenantConfigs.ConfigJson`:
- `state` (`failed`, `rolled_back`, `completed`, etc.)
- `lastAction`
- `lastDetail`
- `lastUpdatedAtUtc`
- `schema`
- `schemaSnapshot`
  - table count
  - table list
- template governance metadata
  - configured checksum
  - computed checksum
  - validation result
- `recoveryLogs[]`
  - timestamp
  - action
  - state
  - detail
  - reason (if available)

## Rollback sequence
1. Mark tenant soft-deleted + inactive.
2. Write failure audit checkpoint.
3. Persist recovery snapshot and append recovery log entry.
4. Keep evidence immutable in logs for post-mortem.

## Operational rule
No new feature work should proceed until rollback evidence is complete for failed onboarding attempts.
