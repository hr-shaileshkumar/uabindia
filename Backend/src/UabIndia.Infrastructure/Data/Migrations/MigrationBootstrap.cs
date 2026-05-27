using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Data.Migrations;

/// <summary>
/// Ensures the idempotent InitialCleanSchema SQL ran when the database has migration
/// history but is missing core tables (for example after a prior no-op migration).
/// </summary>
public static class MigrationBootstrap
{
    private const string TenantsTable = "dbo.Tenants";
    private const string InitialCleanSchemaSql = "20260324190830_InitialCleanSchema.sql";

    public static async Task EnsureInitialCleanSchemaAsync(
        ApplicationDbContext db,
        ILogger logger,
        CancellationToken cancellationToken = default)
    {
        var tenantsExists = await TenantsTableExistsAsync(db, cancellationToken);
        if (tenantsExists)
        {
            return;
        }

        logger.LogWarning(
            "Core schema ({Table}) is missing. Applying idempotent InitialCleanSchema SQL bootstrap.",
            TenantsTable);

        await MigrationSqlHelper.ExecuteSqlFileAsync(db, InitialCleanSchemaSql, cancellationToken);
        logger.LogInformation("InitialCleanSchema SQL bootstrap completed.");
    }

    private static async Task<bool> TenantsTableExistsAsync(
        ApplicationDbContext db,
        CancellationToken cancellationToken)
    {
        var result = await db.Database
            .SqlQueryRaw<int>("SELECT CASE WHEN OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL THEN 1 ELSE 0 END AS [Value]")
            .SingleAsync(cancellationToken);

        return result == 1;
    }
}
