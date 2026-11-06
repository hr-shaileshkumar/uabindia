# Migration scripts

This folder contains SQL migration artifacts for the HRMS module-based schema.

- File: `master_setup.sql` — single, idempotent master setup that provisions all modules.
- File: `role_cleanup_standardize_20260425.sql` — one-time role normalization script to standardize role names to `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `EMPLOYEE` and remap references.
- Folder: `modules/` — module-specific, idempotent migrations (Auth, Core, HRMS, Payroll, Reports).
- Folder: `archive/` — legacy one-off migrations kept for reference only:
	- `migrate-20260201.sql` (consolidated schema)
	- `migrate-20260201-holidays.sql`
	- `migrate-20260201-modules.sql`
	- `migrate-20260201-update-modules.sql`
	- `company-master-20260202.sql`

Notes:
- **Canonical runtime path:** EF Core migrations in `Backend/src/UabIndia.Infrastructure/Data/Migrations/` (applied automatically on API startup).
- This folder (`migrations_scripts/`) is for **manual provisioning, brownfield repair, and reference** only.
- Supported manual path is `master_setup.sql` and the module scripts in `modules/` when EF history is unavailable.
- Legacy one-off migrations are kept in the `archive/` folder for reference only.

Usage (review first):

- To run locally with `sqlcmd`:

```powershell
sqlcmd -S <server> -U <user> -P <password> -i Backend\migrations_scripts\master_setup.sql
```

CI/Migrations:

- The staging and production migration workflows are intentionally disabled while the DB is local-only.
- Re-enable them after public infrastructure is ready and secrets are configured.

- `STAGING_DB_SERVER` — host or host,port
- `STAGING_DB_USER`
- `STAGING_DB_PASSWORD`

Production deployment

- The production workflow uploads an audit artifact before executing SQL.

Secrets required for production (set in repository secrets):

- `PRODUCTION_DB_SERVER`
- `PRODUCTION_DB_USER`
- `PRODUCTION_DB_PASSWORD`

Notes:
- Use `master_setup.sql` for full provisioning.
- Use `modules/*.sql` for module-by-module upgrades.
- Best practice: review SQL, run against staging, then promote to production via approval-gated workflows.
