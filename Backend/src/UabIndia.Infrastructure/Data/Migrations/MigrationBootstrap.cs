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

    public static async Task EnsureExtendedSchemaAsync(
        ApplicationDbContext db,
        ILogger? logger = null,
        CancellationToken cancellationToken = default)
    {
        logger?.LogInformation("Ensuring multi-tenancy and extended schema columns across all database tables…");

        var columnAlters = new (string Table, string Column, string Ddl)[]
        {
            // Users
            ("Users", "CompanyId", "IF OBJECT_ID(N'dbo.Users', N'U') IS NOT NULL AND COL_LENGTH('dbo.Users', 'CompanyId') IS NULL ALTER TABLE dbo.Users ADD CompanyId UNIQUEIDENTIFIER NULL"),
            ("Users", "ProjectId", "IF OBJECT_ID(N'dbo.Users', N'U') IS NOT NULL AND COL_LENGTH('dbo.Users', 'ProjectId') IS NULL ALTER TABLE dbo.Users ADD ProjectId UNIQUEIDENTIFIER NULL"),
            ("Users", "PasswordResetToken", "IF OBJECT_ID(N'dbo.Users', N'U') IS NOT NULL AND COL_LENGTH('dbo.Users', 'PasswordResetToken') IS NULL ALTER TABLE dbo.Users ADD PasswordResetToken NVARCHAR(512) NULL"),
            ("Users", "PasswordResetExpires", "IF OBJECT_ID(N'dbo.Users', N'U') IS NOT NULL AND COL_LENGTH('dbo.Users', 'PasswordResetExpires') IS NULL ALTER TABLE dbo.Users ADD PasswordResetExpires DATETIME2 NULL"),

            // AuditLogs
            ("AuditLogs", "CompanyId", "IF OBJECT_ID(N'dbo.AuditLogs', N'U') IS NOT NULL AND COL_LENGTH('dbo.AuditLogs', 'CompanyId') IS NULL ALTER TABLE dbo.AuditLogs ADD CompanyId UNIQUEIDENTIFIER NULL"),
            ("AuditLogs", "ProjectId", "IF OBJECT_ID(N'dbo.AuditLogs', N'U') IS NOT NULL AND COL_LENGTH('dbo.AuditLogs', 'ProjectId') IS NULL ALTER TABLE dbo.AuditLogs ADD ProjectId UNIQUEIDENTIFIER NULL"),

            // Employees
            ("Employees", "CompanyId", "IF OBJECT_ID(N'dbo.Employees', N'U') IS NOT NULL AND COL_LENGTH('dbo.Employees', 'CompanyId') IS NULL ALTER TABLE dbo.Employees ADD CompanyId UNIQUEIDENTIFIER NULL"),
            ("Employees", "ProjectId", "IF OBJECT_ID(N'dbo.Employees', N'U') IS NOT NULL AND COL_LENGTH('dbo.Employees', 'ProjectId') IS NULL ALTER TABLE dbo.Employees ADD ProjectId UNIQUEIDENTIFIER NULL"),

            // Projects
            ("Projects", "CompanyId", "IF OBJECT_ID(N'dbo.Projects', N'U') IS NOT NULL AND COL_LENGTH('dbo.Projects', 'CompanyId') IS NULL ALTER TABLE dbo.Projects ADD CompanyId UNIQUEIDENTIFIER NULL"),
            ("Projects", "ProjectCode", "IF OBJECT_ID(N'dbo.Projects', N'U') IS NOT NULL AND COL_LENGTH('dbo.Projects', 'ProjectCode') IS NULL ALTER TABLE dbo.Projects ADD ProjectCode NVARCHAR(50) NOT NULL DEFAULT ''"),
            ("Projects", "Description", "IF OBJECT_ID(N'dbo.Projects', N'U') IS NOT NULL AND COL_LENGTH('dbo.Projects', 'Description') IS NULL ALTER TABLE dbo.Projects ADD Description NVARCHAR(MAX) NULL"),
            ("Projects", "ProjectType", "IF OBJECT_ID(N'dbo.Projects', N'U') IS NOT NULL AND COL_LENGTH('dbo.Projects', 'ProjectType') IS NULL ALTER TABLE dbo.Projects ADD ProjectType NVARCHAR(50) NOT NULL DEFAULT 'Internal'"),
            ("Projects", "Priority", "IF OBJECT_ID(N'dbo.Projects', N'U') IS NOT NULL AND COL_LENGTH('dbo.Projects', 'Priority') IS NULL ALTER TABLE dbo.Projects ADD Priority NVARCHAR(20) NOT NULL DEFAULT 'Medium'"),
            ("Projects", "Status", "IF OBJECT_ID(N'dbo.Projects', N'U') IS NOT NULL AND COL_LENGTH('dbo.Projects', 'Status') IS NULL ALTER TABLE dbo.Projects ADD Status NVARCHAR(30) NOT NULL DEFAULT 'Planned'"),
            ("Projects", "StartDate", "IF OBJECT_ID(N'dbo.Projects', N'U') IS NOT NULL AND COL_LENGTH('dbo.Projects', 'StartDate') IS NULL ALTER TABLE dbo.Projects ADD StartDate DATETIME2 NULL"),
            ("Projects", "EndDate", "IF OBJECT_ID(N'dbo.Projects', N'U') IS NOT NULL AND COL_LENGTH('dbo.Projects', 'EndDate') IS NULL ALTER TABLE dbo.Projects ADD EndDate DATETIME2 NULL"),
            ("Projects", "ActualStartDate", "IF OBJECT_ID(N'dbo.Projects', N'U') IS NOT NULL AND COL_LENGTH('dbo.Projects', 'ActualStartDate') IS NULL ALTER TABLE dbo.Projects ADD ActualStartDate DATETIME2 NULL"),
            ("Projects", "ActualEndDate", "IF OBJECT_ID(N'dbo.Projects', N'U') IS NOT NULL AND COL_LENGTH('dbo.Projects', 'ActualEndDate') IS NULL ALTER TABLE dbo.Projects ADD ActualEndDate DATETIME2 NULL"),
            ("Projects", "Budget", "IF OBJECT_ID(N'dbo.Projects', N'U') IS NOT NULL AND COL_LENGTH('dbo.Projects', 'Budget') IS NULL ALTER TABLE dbo.Projects ADD Budget DECIMAL(18,2) NULL"),
            ("Projects", "ActualCost", "IF OBJECT_ID(N'dbo.Projects', N'U') IS NOT NULL AND COL_LENGTH('dbo.Projects', 'ActualCost') IS NULL ALTER TABLE dbo.Projects ADD ActualCost DECIMAL(18,2) NULL"),
            ("Projects", "CurrencyCode", "IF OBJECT_ID(N'dbo.Projects', N'U') IS NOT NULL AND COL_LENGTH('dbo.Projects', 'CurrencyCode') IS NULL ALTER TABLE dbo.Projects ADD CurrencyCode CHAR(3) NOT NULL DEFAULT 'INR'"),
            ("Projects", "ClientName", "IF OBJECT_ID(N'dbo.Projects', N'U') IS NOT NULL AND COL_LENGTH('dbo.Projects', 'ClientName') IS NULL ALTER TABLE dbo.Projects ADD ClientName NVARCHAR(256) NULL"),
            ("Projects", "ContractNumber", "IF OBJECT_ID(N'dbo.Projects', N'U') IS NOT NULL AND COL_LENGTH('dbo.Projects', 'ContractNumber') IS NULL ALTER TABLE dbo.Projects ADD ContractNumber NVARCHAR(100) NULL"),
            ("Projects", "BillingType", "IF OBJECT_ID(N'dbo.Projects', N'U') IS NOT NULL AND COL_LENGTH('dbo.Projects', 'BillingType') IS NULL ALTER TABLE dbo.Projects ADD BillingType NVARCHAR(30) NULL"),
            ("Projects", "CompletionPercentage", "IF OBJECT_ID(N'dbo.Projects', N'U') IS NOT NULL AND COL_LENGTH('dbo.Projects', 'CompletionPercentage') IS NULL ALTER TABLE dbo.Projects ADD CompletionPercentage INT NOT NULL DEFAULT 0"),
            ("Projects", "ProjectManagerId", "IF OBJECT_ID(N'dbo.Projects', N'U') IS NOT NULL AND COL_LENGTH('dbo.Projects', 'ProjectManagerId') IS NULL ALTER TABLE dbo.Projects ADD ProjectManagerId UNIQUEIDENTIFIER NULL"),
            ("Projects", "Location", "IF OBJECT_ID(N'dbo.Projects', N'U') IS NOT NULL AND COL_LENGTH('dbo.Projects', 'Location') IS NULL ALTER TABLE dbo.Projects ADD Location NVARCHAR(256) NULL"),
            ("Projects", "UpdatedBy", "IF OBJECT_ID(N'dbo.Projects', N'U') IS NOT NULL AND COL_LENGTH('dbo.Projects', 'UpdatedBy') IS NULL ALTER TABLE dbo.Projects ADD UpdatedBy UNIQUEIDENTIFIER NULL"),

            // DocumentRecords
            ("DocumentRecords", "CompanyId", "IF OBJECT_ID(N'dbo.DocumentRecords', N'U') IS NOT NULL AND COL_LENGTH('dbo.DocumentRecords', 'CompanyId') IS NULL ALTER TABLE dbo.DocumentRecords ADD CompanyId UNIQUEIDENTIFIER NULL"),
            ("DocumentRecords", "ProjectId", "IF OBJECT_ID(N'dbo.DocumentRecords', N'U') IS NOT NULL AND COL_LENGTH('dbo.DocumentRecords', 'ProjectId') IS NULL ALTER TABLE dbo.DocumentRecords ADD ProjectId UNIQUEIDENTIFIER NULL"),

            // NotificationMessages
            ("NotificationMessages", "CompanyId", "IF OBJECT_ID(N'dbo.NotificationMessages', N'U') IS NOT NULL AND COL_LENGTH('dbo.NotificationMessages', 'CompanyId') IS NULL ALTER TABLE dbo.NotificationMessages ADD CompanyId UNIQUEIDENTIFIER NULL"),
            ("NotificationMessages", "ProjectId", "IF OBJECT_ID(N'dbo.NotificationMessages', N'U') IS NOT NULL AND COL_LENGTH('dbo.NotificationMessages', 'ProjectId') IS NULL ALTER TABLE dbo.NotificationMessages ADD ProjectId UNIQUEIDENTIFIER NULL"),

            // CommunicationTemplates
            ("CommunicationTemplates", "CompanyId", "IF OBJECT_ID(N'dbo.CommunicationTemplates', N'U') IS NOT NULL AND COL_LENGTH('dbo.CommunicationTemplates', 'CompanyId') IS NULL ALTER TABLE dbo.CommunicationTemplates ADD CompanyId UNIQUEIDENTIFIER NULL"),
            ("CommunicationTemplates", "ProjectId", "IF OBJECT_ID(N'dbo.CommunicationTemplates', N'U') IS NOT NULL AND COL_LENGTH('dbo.CommunicationTemplates', 'ProjectId') IS NULL ALTER TABLE dbo.CommunicationTemplates ADD ProjectId UNIQUEIDENTIFIER NULL"),

            // HelpdeskTickets
            ("HelpdeskTickets", "CompanyId", "IF OBJECT_ID(N'dbo.HelpdeskTickets', N'U') IS NOT NULL AND COL_LENGTH('dbo.HelpdeskTickets', 'CompanyId') IS NULL ALTER TABLE dbo.HelpdeskTickets ADD CompanyId UNIQUEIDENTIFIER NULL"),
            ("HelpdeskTickets", "ProjectId", "IF OBJECT_ID(N'dbo.HelpdeskTickets', N'U') IS NOT NULL AND COL_LENGTH('dbo.HelpdeskTickets', 'ProjectId') IS NULL ALTER TABLE dbo.HelpdeskTickets ADD ProjectId UNIQUEIDENTIFIER NULL"),

            // WorkflowDefinitions
            ("WorkflowDefinitions", "CompanyId", "IF OBJECT_ID(N'dbo.WorkflowDefinitions', N'U') IS NOT NULL AND COL_LENGTH('dbo.WorkflowDefinitions', 'CompanyId') IS NULL ALTER TABLE dbo.WorkflowDefinitions ADD CompanyId UNIQUEIDENTIFIER NULL"),
            ("WorkflowDefinitions", "ProjectId", "IF OBJECT_ID(N'dbo.WorkflowDefinitions', N'U') IS NOT NULL AND COL_LENGTH('dbo.WorkflowDefinitions', 'ProjectId') IS NULL ALTER TABLE dbo.WorkflowDefinitions ADD ProjectId UNIQUEIDENTIFIER NULL"),

            // FeatureFlags
            ("FeatureFlags", "CompanyId", "IF OBJECT_ID(N'dbo.FeatureFlags', N'U') IS NOT NULL AND COL_LENGTH('dbo.FeatureFlags', 'CompanyId') IS NULL ALTER TABLE dbo.FeatureFlags ADD CompanyId UNIQUEIDENTIFIER NULL"),
            ("FeatureFlags", "ProjectId", "IF OBJECT_ID(N'dbo.FeatureFlags', N'U') IS NOT NULL AND COL_LENGTH('dbo.FeatureFlags', 'ProjectId') IS NULL ALTER TABLE dbo.FeatureFlags ADD ProjectId UNIQUEIDENTIFIER NULL"),

            // PayrollRuns
            ("PayrollRuns", "CompanyId", "IF OBJECT_ID(N'dbo.PayrollRuns', N'U') IS NOT NULL AND COL_LENGTH('dbo.PayrollRuns', 'CompanyId') IS NULL ALTER TABLE dbo.PayrollRuns ADD CompanyId UNIQUEIDENTIFIER NULL"),
            ("PayrollRuns", "ProjectId", "IF OBJECT_ID(N'dbo.PayrollRuns', N'U') IS NOT NULL AND COL_LENGTH('dbo.PayrollRuns', 'ProjectId') IS NULL ALTER TABLE dbo.PayrollRuns ADD ProjectId UNIQUEIDENTIFIER NULL"),

            // AttendanceRecords
            ("AttendanceRecords", "ProjectId", "IF OBJECT_ID(N'dbo.AttendanceRecords', N'U') IS NOT NULL AND COL_LENGTH('dbo.AttendanceRecords', 'ProjectId') IS NULL ALTER TABLE dbo.AttendanceRecords ADD ProjectId UNIQUEIDENTIFIER NULL"),

            // OvertimeRequests
            ("OvertimeRequests", "ProjectId", "IF OBJECT_ID(N'dbo.OvertimeRequests', N'U') IS NOT NULL AND COL_LENGTH('dbo.OvertimeRequests', 'ProjectId') IS NULL ALTER TABLE dbo.OvertimeRequests ADD ProjectId UNIQUEIDENTIFIER NULL"),

            // OvertimeLogs
            ("OvertimeLogs", "ProjectId", "IF OBJECT_ID(N'dbo.OvertimeLogs', N'U') IS NOT NULL AND COL_LENGTH('dbo.OvertimeLogs', 'ProjectId') IS NULL ALTER TABLE dbo.OvertimeLogs ADD ProjectId UNIQUEIDENTIFIER NULL"),
        };

        foreach (var (tbl, col, sql) in columnAlters)
        {
            try
            {
                await db.Database.ExecuteSqlRawAsync(sql, cancellationToken);
            }
            catch (System.Exception ex)
            {
                logger?.LogWarning(ex, "Could not add column {Col} to table {Table} (may already exist).", col, tbl);
            }
        }
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
