# Cloud Cost Estimate (High‑Level)

> This is a planning estimate only. Final cost depends on region, scale, and traffic.

## Assumptions
- Managed App Service (Linux or Windows)
- Managed SQL (single primary, automated backups)
- Basic monitoring + log retention
- Moderate usage (HRMS for a single org)

## Monthly Estimate (USD)
- App Service (S1/P1 class): $60–$150
- Managed SQL (S0/S1 equivalent): $30–$120
- Storage (logs, backups): $5–$20
- Monitoring/Insights: $5–$25
- Bandwidth: $5–$30

**Estimated total:** $105–$345 / month

## Notes
- Costs scale with user count, database size, and retention policies.
- If HA or higher tiers are required, expect higher cost.
- Using reserved instances can reduce spend.

## Decision Inputs Needed
- Expected user count and concurrency
- Data retention policy (audit logs)
- HA requirements (single zone vs multi‑zone)
- Region and compliance constraints
