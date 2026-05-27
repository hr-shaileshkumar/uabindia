# QA Automation Checklist (Admin Console + Onboarding)

## 1) Tenant Onboarding
- [ ] Create tenant with valid payload returns accepted/completed status.
- [ ] Duplicate request token is idempotent (no duplicate tenant).
- [ ] Admin user exists after provisioning.
- [ ] Admin role assignment follows configured role mapping.
- [ ] Core modules are enabled per policy.
- [ ] Failure path triggers rollback (tenant inactive/deleted and no partial access).

## 2) Template Governance
- [ ] Template schema exists.
- [ ] Template version present in config.
- [ ] Computed checksum generated.
- [ ] Checksum validation behavior verified:
  - [ ] `EnforceChecksum=false` allows provisioning with warning-level observability.
  - [ ] `EnforceChecksum=true` blocks provisioning on mismatch.

## 3) Employee Flow
- [ ] Employee create without login works.
- [ ] Employee create with login creates user and role mapping.
- [ ] Employee login role resolved from config mapping.
- [ ] Duplicate email prevented.

## 4) Admin Console UI Consistency
- [ ] Tenants page uses centralized notifications.
- [ ] Users page uses centralized notifications.
- [ ] Roles page uses centralized notifications.
- [ ] Permissions page uses centralized notifications.
- [ ] Companies page saves and list refreshes with correct tenant scope.
- [ ] Projects page uses centralized notifications.
- [ ] Audit logs page error handling consistent.
- [ ] Contact submissions page status toggle feedback consistent.

## 5) Notification Contract
- [ ] API error event emits from interceptor.
- [ ] Global notification component handles `success/error/warning/info`.
- [ ] No page-level floating custom error cards remain.

## 6) Build and Test Gates
- [ ] Backend build passes.
- [ ] Backend tests pass.
- [ ] Frontend production build passes.

## 7) Release Sign-off
- [ ] Architecture notes updated.
- [ ] Config changes documented.
- [ ] Rollback steps documented.
- [ ] Final checklist attached to release summary.
