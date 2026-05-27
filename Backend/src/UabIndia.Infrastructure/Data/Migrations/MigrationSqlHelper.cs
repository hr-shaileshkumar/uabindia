using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Data.Migrations;

internal static class MigrationSqlHelper
{
    public static void ExecuteSqlFile(MigrationBuilder migrationBuilder, string fileName)
    {
        var sql = PrepareSql(File.ReadAllText(ResolveSqlFilePath(fileName)));
        ExecuteBatches(migrationBuilder, sql);
    }

    public static async Task ExecuteSqlFileAsync(
        ApplicationDbContext db,
        string fileName,
        CancellationToken cancellationToken = default)
    {
        var sql = PrepareSql(await File.ReadAllTextAsync(ResolveSqlFilePath(fileName), cancellationToken));
        foreach (var batch in SplitBatches(sql))
        {
            await db.Database.ExecuteSqlRawAsync(batch, cancellationToken);
        }
    }

    private static string ResolveSqlFilePath(string fileName)
    {
        var candidates = new List<string>
        {
            Path.Combine(AppContext.BaseDirectory, "Migrations", "Sql", fileName),
            Path.Combine(AppContext.BaseDirectory, "Sql", fileName),
        };

        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        for (var i = 0; i < 8 && dir != null; i++, dir = dir.Parent)
        {
            candidates.Add(Path.Combine(dir.FullName, "Data", "Migrations", "Sql", fileName));
            candidates.Add(Path.Combine(dir.FullName, "Backend", "src", "UabIndia.Infrastructure", "Data", "Migrations", "Sql", fileName));
        }

        foreach (var candidate in candidates.Distinct(StringComparer.OrdinalIgnoreCase))
        {
            if (File.Exists(candidate))
            {
                return candidate;
            }
        }

        throw new FileNotFoundException(
            $"Migration SQL file '{fileName}' was not found. Searched: {string.Join("; ", candidates)}");
    }

    private static void ExecuteBatches(MigrationBuilder migrationBuilder, string sql)
    {
        foreach (var batch in SplitBatches(sql))
        {
            migrationBuilder.Sql(batch);
        }
    }

    private static string PrepareSql(string sql)
    {
        // Strip empty transactions and comment-only batches produced during SQL export cleanup.
        return sql;
    }

    private static IEnumerable<string> SplitBatches(string sql)
    {
        const string batchMarker = "GO";
        return Regex.Split(sql, $@"(?m)^\s*{Regex.Escape(batchMarker)}\s*$")
            .Select(b => b.Trim())
            .Where(b => b.Length > 0);
    }
}
