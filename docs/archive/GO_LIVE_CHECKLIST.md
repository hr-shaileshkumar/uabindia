# Go‑Live Checklist (Preparation Only)

## Infrastructure
- [ ] Choose cloud region
- [ ] Provision managed App Service
- [ ] Provision managed SQL
- [ ] Configure backups and retention
- [ ] Enable basic monitoring and alerts

## Security & Secrets
- [ ] Create secrets in external vault
- [ ] Set rotation policy
- [ ] Configure CORS/HTTPS/HSTS
- [ ] Verify rate limiting thresholds

## CI/CD (Gated)
- [ ] Keep deploy/migration workflows disabled until ready
- [ ] Confirm build/test CI green

## Database
- [ ] Apply master + module scripts in staging
- [ ] Validate tenant/module seeds
- [ ] Validate audit log inserts

## App Readiness
- [ ] Run staging smoke tests (auth, modules, HRMS endpoints)
- [ ] Verify empty states
- [ ] Confirm 401 logout behavior

## DNS & TLS
- [ ] Configure DNS for api.uabindia.in
- [ ] Attach TLS certificate
- [ ] Validate HTTPS only

## Launch
- [ ] Announce internal pilot
- [ ] Monitor logs for 48 hours
- [ ] Freeze changes during pilot
