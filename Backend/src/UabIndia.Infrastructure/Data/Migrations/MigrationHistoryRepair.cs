using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace UabIndia.Infrastructure.Data.Migrations;

/// <summary>
/// Optional, operator-controlled repair of __EFMigrationsHistory.
/// Disabled by default — set ALLOW_MIGRATION_HISTORY_REPAIR=true to enable.
/// </summary>
public static class MigrationHistoryRepair
{
    public const string EnableEnvironmentVariable = "ALLOW_MIGRATION_HISTORY_REPAIR";

    public static bool IsEnabled()
    {
        var value = Environment.GetEnvironmentVariable(EnableEnvironmentVariable);
        return string.Equals(value, "true", StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, "1", StringComparison.OrdinalIgnoreCase);
    }

    public static async Task TryRepairPendingMigrationsAsync(
        ApplicationDbContext db,
        ILogger logger,
        CancellationToken cancellationToken = default)
    {
        if (!IsEnabled())
        {
            logger.LogWarning(
                "Migration history repair skipped. Set {EnvVar}=true to enable operator-controlled reconciliation.",
                EnableEnvironmentVariable);
            return;
        }

        logger.LogWarning(
            "Migration history repair enabled via {EnvVar}. Reconciling pending migrations conservatively.",
            EnableEnvironmentVariable);

        await MarkPendingMigrationsAsAppliedAsync(db, logger, cancellationToken);
    }

    private static async Task MarkPendingMigrationsAsAppliedAsync(
        ApplicationDbContext db,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        var pending = db.Database.GetPendingMigrations().ToList();
        if (pending.Count == 0)
        {
            logger.LogInformation("No pending migrations to mark as applied.");
            return;
        }

        var migrationsFolder = ResolveMigrationsFolder();
        var productVersion = typeof(ApplicationDbContext).Assembly
            .GetName()
            .Version?
            .ToString(3) ?? "8.0.0";

        await using var conn = db.Database.GetDbConnection();
        if (conn.State != System.Data.ConnectionState.Open)
        {
            await conn.OpenAsync(cancellationToken);
        }

        const string createHistorySql = @"
IF OBJECT_ID(N'[dbo].[__EFMigrationsHistory]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;";
        await db.Database.ExecuteSqlRawAsync(createHistorySql, cancellationToken);

        foreach (var migrationId in pending)
        {
            var tablesDetected = DetectCreatedTables(migrationsFolder, migrationId, logger);
            if (tablesDetected.Count == 0)
            {
                logger.LogInformation(
                    "Skipping automatic mark for migration {Migration} because no table targets were detected.",
                    migrationId);
                continue;
            }

            var allExist = true;
            foreach (var table in tablesDetected.Distinct(StringComparer.OrdinalIgnoreCase))
            {
                await using var cmd = conn.CreateCommand();
                cmd.CommandText = "SELECT CASE WHEN OBJECT_ID(@tableName, N'U') IS NOT NULL THEN 1 ELSE 0 END";
                var parameter = cmd.CreateParameter();
                parameter.ParameterName = "@tableName";
                parameter.Value = $"dbo.{table}";
                cmd.Parameters.Add(parameter);

                var exists = Convert.ToInt32(await cmd.ExecuteScalarAsync(cancellationToken)) == 1;
                if (!exists)
                {
                    allExist = false;
                    break;
                }
            }

            if (!allExist)
            {
                continue;
            }

            await db.Database.ExecuteSqlRawAsync(
                "IF NOT EXISTS (SELECT 1 FROM [dbo].[__EFMigrationsHistory] WHERE [MigrationId] = {0}) " +
                "INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES ({0}, {1});",
                migrationId,
                productVersion);
            logger.LogInformation("Marked migration {Migration} as applied.", migrationId);
        }
    }

    private static string? ResolveMigrationsFolder()
    {
        var cwd = Directory.GetCurrentDirectory();
        var candidatePaths = new[]
        {
            Path.GetFullPath(Path.Combine(cwd, "..", "UabIndia.Infrastructure", "Data", "Migrations")),
            Path.GetFullPath(Path.Combine(cwd, "..", "UabIndia.Infrastructure", "Migrations")),
            Path.GetFullPath(Path.Combine(cwd, "..", "..", "UabIndia.Infrastructure", "Data", "Migrations")),
            Path.GetFullPath(Path.Combine(cwd, "..", "..", "UabIndia.Infrastructure", "Migrations"))
        };

        return candidatePaths.FirstOrDefault(Directory.Exists);
    }

    private static List<string> DetectCreatedTables(string? migrationsFolder, string migrationId, ILogger logger)
    {
        var tablesDetected = new List<string>();
        if (string.IsNullOrEmpty(migrationsFolder))
        {
            return tablesDetected;
        }

        try
        {
            var files = Directory.GetFiles(migrationsFolder, $"*{migrationId}*.cs");
            if (files.Length == 0)
            {
                return tablesDetected;
            }

            var content = File.ReadAllText(files[0]);
            var createTableRegex = new Regex(
                @"CreateTable\s*\(\s*name\s*:\s*""(?<t>[^""]+)""",
                RegexOptions.Compiled);
            foreach (Match match in createTableRegex.Matches(content))
            {
                if (match.Success)
                {
                    tablesDetected.Add(match.Groups["t"].Value);
                }
            }

            var rawCreateRegex = new Regex(
                @"CREATE TABLE \[(?<t>[^\]]+)\]",
                RegexOptions.IgnoreCase | RegexOptions.Compiled);
            foreach (Match match in rawCreateRegex.Matches(content))
            {
                if (match.Success)
                {
                    tablesDetected.Add(match.Groups["t"].Value);
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogDebug(ex, "Failed to read migration file for {Migration}", migrationId);
        }

        return tablesDetected;
    }
}
