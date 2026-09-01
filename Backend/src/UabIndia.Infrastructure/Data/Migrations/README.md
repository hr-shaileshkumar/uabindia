# EF Core migrations (canonical runtime path)

The API applies schema changes through **EF Core migrations** on startup (`DatabaseInitializationService` → `db.Database.MigrateAsync()`).

## Layout

| Path | Purpose |
|------|---------|
| `*.cs` migration classes | Versioned EF migrations checked into source control |
| `ApplicationDbContextModelSnapshot.cs` | Current model snapshot |
| `Sql/*.sql` | Idempotent SQL companions executed by `MigrationSqlHelper` when referenced |
| `MigrationBootstrap.cs` | Safety net when core tables are missing or columns drift |
| `MigrationHistoryRepair.cs` | Repairs `__EFMigrationsHistory` after partial/manual restores |

## Startup order

1. `MigrationBootstrap.EnsureInitialCleanSchemaAsync` — runs `Sql/20260324190830_InitialCleanSchema.sql` if `dbo.Tenants` is missing
2. `MigrationBootstrap.EnsureExtendedSchemaAsync` — idempotent column/index patches for drift
3. `db.Database.MigrateAsync()` — applies pending EF migrations
4. On SQL 2714/2705 errors, `MigrationHistoryRepair` may reconcile history and retry

## Manual SQL scripts

Historical/manual scripts live in `Backend/migrations_scripts/`. They are **reference and disaster-recovery only** — do not duplicate new schema work there. Add EF migrations + optional `Sql/` companions instead.

## Adding a migration

```powershell
cd Backend/src/UabIndia.Api
dotnet ef migrations add <Name> --project ../UabIndia.Infrastructure

Recent migrations include `20260809153000_AddTravelAndAiAgents` (TravelRequests + AiAgents tables).
```

Review generated SQL, add an idempotent companion under `Sql/` when needed for brownfield installs, then run tests locally.
