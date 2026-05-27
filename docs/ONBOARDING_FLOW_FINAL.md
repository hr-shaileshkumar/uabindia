# Tenant Onboarding Final Flow (Frozen)

## Final Sequence
1. Receive request with idempotency token.
2. Validate request.
3. Create tenant record (inactive).
4. Validate template governance (schema/version/checksum policy).
5. Clone template schema to tenant schema.
6. Seed baseline tenant data (roles/modules/config).
7. Create/update tenant admin user.
8. Assign configured admin role mapping.
9. Apply plan + module policy.
10. Emit provisioning audit checkpoints.
11. Mark tenant active per status policy.
12. Return queued/completed state.

## Non-Goals During Stabilization Sprint
- No runtime tenant migrations.
- No new onboarding feature flags.
- No schema shape changes without template governance update.

## Configuration Contracts
- `TenantProvisioning:TemplateSchema`
- `TenantProvisioning:TemplateGovernance:TemplateVersion`
- `TenantProvisioning:TemplateGovernance:TemplateChecksum`
- `TenantProvisioning:TemplateGovernance:EnforceChecksum`
- `TenantProvisioning:RoleMappings:*`

## Audit Checkpoints
- `TenantProvisioningStarted`
- `TemplateSchemaCloned`
- `TenantSeedCompleted`
- `TenantProvisioningCompleted`
- `TenantProvisioningFailed`

## Operational Dashboard Expectations
Each provisioning row should expose:
- provisioning status
- schema/core table readiness
- user/admin-role assignment health
- template schema + version
- configured checksum + computed checksum + validity
