using System;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Data.SqlClient;
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
    private const string ExtendedSchemaVersion = "20260911-fld-wms-v7";

    public static async Task EnsureDatabaseExistsAsync(
        string? connectionString,
        ILogger? logger = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(connectionString)) return;

        try
        {
            var builder = new SqlConnectionStringBuilder(connectionString);
            var targetDbName = builder.InitialCatalog;
            if (string.IsNullOrWhiteSpace(targetDbName)) return;

            builder.InitialCatalog = "master";
            using var conn = new SqlConnection(builder.ConnectionString);
            await conn.OpenAsync(cancellationToken);

            using var cmd = conn.CreateCommand();
            cmd.CommandTimeout = 180;
            cmd.CommandText = $@"
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'{targetDbName.Replace("'", "''")}')
BEGIN
    CREATE DATABASE [{targetDbName.Replace("]", "]]")}];
END";
            await cmd.ExecuteNonQueryAsync(cancellationToken);
            logger?.LogInformation("Ensured physical database [{DbName}] exists on SQL Server.", targetDbName);
        }
        catch (Exception ex)
        {
            logger?.LogWarning(ex, "Could not verify physical database via master connection.");
        }
    }

    public static async Task EnsureInitialCleanSchemaAsync(
        ApplicationDbContext db,
        ILogger logger,
        CancellationToken cancellationToken = default)
    {
        var tenantsExists = await TenantsTableExistsAsync(db, cancellationToken);
        if (!tenantsExists)
        {
            logger.LogWarning(
                "Core schema ({Table}) is missing. Applying idempotent InitialCleanSchema SQL bootstrap.",
                TenantsTable);

            await MigrationSqlHelper.ExecuteSqlFileAsync(db, InitialCleanSchemaSql, cancellationToken);
            logger.LogInformation("InitialCleanSchema SQL bootstrap completed.");
        }

        await EnsureBaselineMigrationsRecordedAsync(db, logger, cancellationToken);
    }

    public static async Task EnsureBaselineMigrationsRecordedAsync(
        ApplicationDbContext db,
        ILogger? logger = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
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

            var baselineMigrations = new[]
            {
                "20260127190639_Initial",
                "20260128045923_AddRefreshTokenRotation",
                "20260201161904_AddLeavePolicyRules",
                "20260201170000_AddLeaveEnhancements",
                "20260201180000_AddLeaveTypes",
                "20260205175739_AddContactSubmissions",
                "20260207090000_ExpandEncryptedCompanyFields",
                "20260209190829_AddWorkflowTables_Minimal",
                "20260324190830_InitialCleanSchema"
            };

            var productVersion = typeof(ApplicationDbContext).Assembly
                .GetName()
                .Version?
                .ToString(3) ?? "8.0.0";

            foreach (var m in baselineMigrations)
            {
                await db.Database.ExecuteSqlRawAsync(
                    "IF NOT EXISTS (SELECT 1 FROM [dbo].[__EFMigrationsHistory] WHERE [MigrationId] = {0}) " +
                    "INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES ({0}, {1});",
                    m, productVersion);
            }
            logger?.LogInformation("Baseline migrations verified in __EFMigrationsHistory.");
        }
        catch (Exception ex)
        {
            logger?.LogWarning(ex, "Could not record baseline migrations in __EFMigrationsHistory.");
        }
    }

    public static async Task EnsureCriticalUserColumnsAsync(
        ApplicationDbContext db,
        ILogger? logger = null,
        CancellationToken cancellationToken = default)
    {
        const string sql = @"
IF OBJECT_ID(N'dbo.Users', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.Users', 'TwoFactorEnabled') IS NULL
        ALTER TABLE dbo.Users ADD TwoFactorEnabled BIT NOT NULL DEFAULT 0;
    IF COL_LENGTH('dbo.Users', 'TwoFactorSecret') IS NULL
        ALTER TABLE dbo.Users ADD TwoFactorSecret NVARCHAR(128) NULL;
    IF COL_LENGTH('dbo.Users', 'EmailHash') IS NULL
        ALTER TABLE dbo.Users ADD EmailHash NVARCHAR(64) NULL;
    IF COL_LENGTH('dbo.Users', 'CompanyId') IS NULL
        ALTER TABLE dbo.Users ADD CompanyId UNIQUEIDENTIFIER NULL;
    IF COL_LENGTH('dbo.Users', 'ProjectId') IS NULL
        ALTER TABLE dbo.Users ADD ProjectId UNIQUEIDENTIFIER NULL;
    IF COL_LENGTH('dbo.Users', 'PasswordResetToken') IS NULL
        ALTER TABLE dbo.Users ADD PasswordResetToken NVARCHAR(512) NULL;
    IF COL_LENGTH('dbo.Users', 'PasswordResetExpires') IS NULL
        ALTER TABLE dbo.Users ADD PasswordResetExpires DATETIME2 NULL;
    IF COL_LENGTH('dbo.Users', 'AccessFailedCount') IS NULL
        ALTER TABLE dbo.Users ADD AccessFailedCount INT NOT NULL DEFAULT 0;
    IF COL_LENGTH('dbo.Users', 'LockoutEnd') IS NULL
        ALTER TABLE dbo.Users ADD LockoutEnd DATETIME2 NULL;
    IF COL_LENGTH('dbo.Users', 'LockoutEnabled') IS NULL
        ALTER TABLE dbo.Users ADD LockoutEnabled BIT NOT NULL DEFAULT 1;
    IF COL_LENGTH('dbo.Users', 'BusinessId') IS NULL
        ALTER TABLE dbo.Users ADD BusinessId NVARCHAR(100) NULL;
END;

IF OBJECT_ID(N'dbo.AuditLogs', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.AuditLogs', 'CompanyId') IS NULL
        ALTER TABLE dbo.AuditLogs ADD CompanyId UNIQUEIDENTIFIER NULL;
    IF COL_LENGTH('dbo.AuditLogs', 'ProjectId') IS NULL
        ALTER TABLE dbo.AuditLogs ADD ProjectId UNIQUEIDENTIFIER NULL;
    IF COL_LENGTH('dbo.AuditLogs', 'BusinessId') IS NULL
        ALTER TABLE dbo.AuditLogs ADD BusinessId NVARCHAR(100) NULL;
    IF COL_LENGTH('dbo.AuditLogs', 'PrevHash') IS NULL
        ALTER TABLE dbo.AuditLogs ADD PrevHash NVARCHAR(128) NULL;
    IF COL_LENGTH('dbo.AuditLogs', 'Hash') IS NULL
        ALTER TABLE dbo.AuditLogs ADD Hash NVARCHAR(128) NULL;
END;

IF OBJECT_ID(N'dbo.SalesInvoices', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.SalesInvoices', 'Status') IS NOT NULL AND (COL_LENGTH('dbo.SalesInvoices', 'Status') = -1 OR COL_LENGTH('dbo.SalesInvoices', 'Status') > 100)
        ALTER TABLE dbo.SalesInvoices ALTER COLUMN [Status] NVARCHAR(50) NULL;
END;

IF OBJECT_ID(N'dbo.ApprovalRequests', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.ApprovalRequests', 'CompanyId') IS NULL
        ALTER TABLE dbo.ApprovalRequests ADD CompanyId UNIQUEIDENTIFIER NULL;
    IF COL_LENGTH('dbo.ApprovalRequests', 'ProjectId') IS NULL
        ALTER TABLE dbo.ApprovalRequests ADD ProjectId UNIQUEIDENTIFIER NULL;
    IF COL_LENGTH('dbo.ApprovalRequests', 'BusinessId') IS NULL
        ALTER TABLE dbo.ApprovalRequests ADD BusinessId NVARCHAR(100) NULL;
END;

IF OBJECT_ID(N'dbo.SalesInvoices', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.SalesInvoices', 'CompanyId') IS NULL
        ALTER TABLE dbo.SalesInvoices ADD CompanyId UNIQUEIDENTIFIER NULL;
    IF COL_LENGTH('dbo.SalesInvoices', 'ProjectId') IS NULL
        ALTER TABLE dbo.SalesInvoices ADD ProjectId UNIQUEIDENTIFIER NULL;
    IF COL_LENGTH('dbo.SalesInvoices', 'BusinessId') IS NULL
        ALTER TABLE dbo.SalesInvoices ADD BusinessId NVARCHAR(100) NULL;
END;

IF OBJECT_ID(N'dbo.Customers', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.Customers', 'CompanyId') IS NULL
        ALTER TABLE dbo.Customers ADD CompanyId UNIQUEIDENTIFIER NULL;
    IF COL_LENGTH('dbo.Customers', 'ProjectId') IS NULL
        ALTER TABLE dbo.Customers ADD ProjectId UNIQUEIDENTIFIER NULL;
    IF COL_LENGTH('dbo.Customers', 'BusinessId') IS NULL
        ALTER TABLE dbo.Customers ADD BusinessId NVARCHAR(100) NULL;
END;

IF OBJECT_ID(N'dbo.Vendors', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.Vendors', 'CompanyId') IS NULL
        ALTER TABLE dbo.Vendors ADD CompanyId UNIQUEIDENTIFIER NULL;
    IF COL_LENGTH('dbo.Vendors', 'ProjectId') IS NULL
        ALTER TABLE dbo.Vendors ADD ProjectId UNIQUEIDENTIFIER NULL;
    IF COL_LENGTH('dbo.Vendors', 'BusinessId') IS NULL
        ALTER TABLE dbo.Vendors ADD BusinessId NVARCHAR(100) NULL;
END;
";
        try
        {
            await db.Database.ExecuteSqlRawAsync(sql, cancellationToken);
        }
        catch (System.Exception ex)
        {
            logger?.LogWarning(ex, "Could not ensure critical entity columns.");
        }
    }

    public static async Task EnsureExtendedSchemaAsync(
        ApplicationDbContext db,
        ILogger? logger = null,
        CancellationToken cancellationToken = default)
    {
        if (await IsExtendedSchemaCurrentAsync(db, cancellationToken))
        {
            await EnsurePerformanceIndexesAsync(db, logger, cancellationToken);
            await EnsureEnterprisePolicyTablesAsync(db, logger, cancellationToken);
            await EnsureTenantWebhooksTablesAsync(db, logger, cancellationToken);
            logger?.LogInformation("Extended schema already current ({Version}); skipping column bootstrap.", ExtendedSchemaVersion);
            return;
        }

        await EnsureCriticalUserColumnsAsync(db, logger, cancellationToken);
        await EnsureSubscriptionTablesAsync(db, logger, cancellationToken);
        await EnsureOutboxMessagesTableAsync(db, logger, cancellationToken);
        await EnsureBusinessIdColumnsAsync(db, logger, cancellationToken);
        await EnsureTenantWebhooksTablesAsync(db, logger, cancellationToken);

        logger?.LogInformation("Ensuring multi-tenancy and extended schema columns across all database tables…");

        var columnAlters = new (string Table, string Column, string Ddl)[]
        {
            // Users
            ("Users", "CompanyId", "IF OBJECT_ID(N'dbo.Users', N'U') IS NOT NULL AND COL_LENGTH('dbo.Users', 'CompanyId') IS NULL ALTER TABLE dbo.Users ADD CompanyId UNIQUEIDENTIFIER NULL"),
            ("Users", "ProjectId", "IF OBJECT_ID(N'dbo.Users', N'U') IS NOT NULL AND COL_LENGTH('dbo.Users', 'ProjectId') IS NULL ALTER TABLE dbo.Users ADD ProjectId UNIQUEIDENTIFIER NULL"),
            ("Users", "PasswordResetToken", "IF OBJECT_ID(N'dbo.Users', N'U') IS NOT NULL AND COL_LENGTH('dbo.Users', 'PasswordResetToken') IS NULL ALTER TABLE dbo.Users ADD PasswordResetToken NVARCHAR(512) NULL"),
            ("Users", "PasswordResetExpires", "IF OBJECT_ID(N'dbo.Users', N'U') IS NOT NULL AND COL_LENGTH('dbo.Users', 'PasswordResetExpires') IS NULL ALTER TABLE dbo.Users ADD PasswordResetExpires DATETIME2 NULL"),
            ("Users", "AccessFailedCount", "IF OBJECT_ID(N'dbo.Users', N'U') IS NOT NULL AND COL_LENGTH('dbo.Users', 'AccessFailedCount') IS NULL ALTER TABLE dbo.Users ADD AccessFailedCount INT NOT NULL DEFAULT 0"),
            ("Users", "LockoutEnd", "IF OBJECT_ID(N'dbo.Users', N'U') IS NOT NULL AND COL_LENGTH('dbo.Users', 'LockoutEnd') IS NULL ALTER TABLE dbo.Users ADD LockoutEnd DATETIME2 NULL"),
            ("Users", "LockoutEnabled", "IF OBJECT_ID(N'dbo.Users', N'U') IS NOT NULL AND COL_LENGTH('dbo.Users', 'LockoutEnabled') IS NULL ALTER TABLE dbo.Users ADD LockoutEnabled BIT NOT NULL DEFAULT 1"),
            ("Users", "TwoFactorEnabled", "IF OBJECT_ID(N'dbo.Users', N'U') IS NOT NULL AND COL_LENGTH('dbo.Users', 'TwoFactorEnabled') IS NULL ALTER TABLE dbo.Users ADD TwoFactorEnabled BIT NOT NULL DEFAULT 0"),
            ("Users", "TwoFactorSecret", "IF OBJECT_ID(N'dbo.Users', N'U') IS NOT NULL AND COL_LENGTH('dbo.Users', 'TwoFactorSecret') IS NULL ALTER TABLE dbo.Users ADD TwoFactorSecret NVARCHAR(128) NULL"),
            ("Users", "EmailHash", "IF OBJECT_ID(N'dbo.Users', N'U') IS NOT NULL AND COL_LENGTH('dbo.Users', 'EmailHash') IS NULL ALTER TABLE dbo.Users ADD EmailHash NVARCHAR(64) NULL"),

            // Tenants global metadata
            ("Tenants", "DeletedAt", "IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL AND COL_LENGTH('dbo.Tenants', 'DeletedAt') IS NULL ALTER TABLE dbo.Tenants ADD DeletedAt DATETIME2 NULL"),
            ("Tenants", "DeletedBy", "IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL AND COL_LENGTH('dbo.Tenants', 'DeletedBy') IS NULL ALTER TABLE dbo.Tenants ADD DeletedBy UNIQUEIDENTIFIER NULL"),
            ("Tenants", "CountryCode", "IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL AND COL_LENGTH('dbo.Tenants', 'CountryCode') IS NULL ALTER TABLE dbo.Tenants ADD CountryCode NVARCHAR(10) NOT NULL DEFAULT 'IND'"),
            ("Tenants", "DefaultCurrencyCode", "IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL AND COL_LENGTH('dbo.Tenants', 'DefaultCurrencyCode') IS NULL ALTER TABLE dbo.Tenants ADD DefaultCurrencyCode NVARCHAR(10) NOT NULL DEFAULT 'INR'"),
            ("Tenants", "DefaultTimezone", "IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL AND COL_LENGTH('dbo.Tenants', 'DefaultTimezone') IS NULL ALTER TABLE dbo.Tenants ADD DefaultTimezone NVARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata'"),
            ("Tenants", "FiscalYearStartMonth", "IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL AND COL_LENGTH('dbo.Tenants', 'FiscalYearStartMonth') IS NULL ALTER TABLE dbo.Tenants ADD FiscalYearStartMonth INT NOT NULL DEFAULT 4"),
            ("Tenants", "IndustryExtensionCode", "IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL AND COL_LENGTH('dbo.Tenants', 'IndustryExtensionCode') IS NULL ALTER TABLE dbo.Tenants ADD IndustryExtensionCode NVARCHAR(50) NOT NULL DEFAULT 'Generic'"),

            // Companies global metadata
            ("Companies", "CountryCode", "IF OBJECT_ID(N'dbo.Companies', N'U') IS NOT NULL AND COL_LENGTH('dbo.Companies', 'CountryCode') IS NULL ALTER TABLE dbo.Companies ADD CountryCode NVARCHAR(10) NOT NULL DEFAULT 'IND'"),
            ("Companies", "FunctionalCurrencyCode", "IF OBJECT_ID(N'dbo.Companies', N'U') IS NOT NULL AND COL_LENGTH('dbo.Companies', 'FunctionalCurrencyCode') IS NULL ALTER TABLE dbo.Companies ADD FunctionalCurrencyCode NVARCHAR(10) NOT NULL DEFAULT 'INR'"),
            ("Companies", "ParentCompanyId", "IF OBJECT_ID(N'dbo.Companies', N'U') IS NOT NULL AND COL_LENGTH('dbo.Companies', 'ParentCompanyId') IS NULL ALTER TABLE dbo.Companies ADD ParentCompanyId UNIQUEIDENTIFIER NULL"),
            ("Companies", "BankRoutingCode", "IF OBJECT_ID(N'dbo.Companies', N'U') IS NOT NULL AND COL_LENGTH('dbo.Companies', 'BankRoutingCode') IS NULL ALTER TABLE dbo.Companies ADD BankRoutingCode NVARCHAR(100) NULL"),
            ("Companies", "BankIban", "IF OBJECT_ID(N'dbo.Companies', N'U') IS NOT NULL AND COL_LENGTH('dbo.Companies', 'BankIban') IS NULL ALTER TABLE dbo.Companies ADD BankIban NVARCHAR(100) NULL"),
            ("Companies", "BankSwiftCode", "IF OBJECT_ID(N'dbo.Companies', N'U') IS NOT NULL AND COL_LENGTH('dbo.Companies', 'BankSwiftCode') IS NULL ALTER TABLE dbo.Companies ADD BankSwiftCode NVARCHAR(50) NULL"),

            ("AuditLogs", "CompanyId", "IF OBJECT_ID(N'dbo.AuditLogs', N'U') IS NOT NULL AND COL_LENGTH('dbo.AuditLogs', 'CompanyId') IS NULL ALTER TABLE dbo.AuditLogs ADD CompanyId UNIQUEIDENTIFIER NULL"),
            ("AuditLogs", "ProjectId", "IF OBJECT_ID(N'dbo.AuditLogs', N'U') IS NOT NULL AND COL_LENGTH('dbo.AuditLogs', 'ProjectId') IS NULL ALTER TABLE dbo.AuditLogs ADD ProjectId UNIQUEIDENTIFIER NULL"),
            ("AuditLogs", "PrevHash", "IF OBJECT_ID(N'dbo.AuditLogs', N'U') IS NOT NULL AND COL_LENGTH('dbo.AuditLogs', 'PrevHash') IS NULL ALTER TABLE dbo.AuditLogs ADD PrevHash NVARCHAR(128) NULL"),
            ("AuditLogs", "Hash", "IF OBJECT_ID(N'dbo.AuditLogs', N'U') IS NOT NULL AND COL_LENGTH('dbo.AuditLogs', 'Hash') IS NULL ALTER TABLE dbo.AuditLogs ADD Hash NVARCHAR(128) NULL"),

            // Employees
            ("Employees", "CompanyId", "IF OBJECT_ID(N'dbo.Employees', N'U') IS NOT NULL AND COL_LENGTH('dbo.Employees', 'CompanyId') IS NULL ALTER TABLE dbo.Employees ADD CompanyId UNIQUEIDENTIFIER NULL"),
            ("Employees", "ProjectId", "IF OBJECT_ID(N'dbo.Employees', N'U') IS NOT NULL AND COL_LENGTH('dbo.Employees', 'ProjectId') IS NULL ALTER TABLE dbo.Employees ADD ProjectId UNIQUEIDENTIFIER NULL"),
            ("Employees", "CountryCode", "IF OBJECT_ID(N'dbo.Employees', N'U') IS NOT NULL AND COL_LENGTH('dbo.Employees', 'CountryCode') IS NULL ALTER TABLE dbo.Employees ADD CountryCode NVARCHAR(10) NOT NULL DEFAULT 'IND'"),
            ("Employees", "TaxIdentificationNumber", "IF OBJECT_ID(N'dbo.Employees', N'U') IS NOT NULL AND COL_LENGTH('dbo.Employees', 'TaxIdentificationNumber') IS NULL ALTER TABLE dbo.Employees ADD TaxIdentificationNumber NVARCHAR(100) NULL"),
            ("Employees", "NationalIdNumber", "IF OBJECT_ID(N'dbo.Employees', N'U') IS NOT NULL AND COL_LENGTH('dbo.Employees', 'NationalIdNumber') IS NULL ALTER TABLE dbo.Employees ADD NationalIdNumber NVARCHAR(100) NULL"),
            ("Employees", "SocialSecurityNumber", "IF OBJECT_ID(N'dbo.Employees', N'U') IS NOT NULL AND COL_LENGTH('dbo.Employees', 'SocialSecurityNumber') IS NULL ALTER TABLE dbo.Employees ADD SocialSecurityNumber NVARCHAR(100) NULL"),
            ("Employees", "BankRoutingCode", "IF OBJECT_ID(N'dbo.Employees', N'U') IS NOT NULL AND COL_LENGTH('dbo.Employees', 'BankRoutingCode') IS NULL ALTER TABLE dbo.Employees ADD BankRoutingCode NVARCHAR(100) NULL"),
            ("Employees", "BankIban", "IF OBJECT_ID(N'dbo.Employees', N'U') IS NOT NULL AND COL_LENGTH('dbo.Employees', 'BankIban') IS NULL ALTER TABLE dbo.Employees ADD BankIban NVARCHAR(100) NULL"),
            ("Employees", "BankSwiftCode", "IF OBJECT_ID(N'dbo.Employees', N'U') IS NOT NULL AND COL_LENGTH('dbo.Employees', 'BankSwiftCode') IS NULL ALTER TABLE dbo.Employees ADD BankSwiftCode NVARCHAR(50) NULL"),
            ("Employees", "CountrySpecificDataJson", "IF OBJECT_ID(N'dbo.Employees', N'U') IS NOT NULL AND COL_LENGTH('dbo.Employees', 'CountrySpecificDataJson') IS NULL ALTER TABLE dbo.Employees ADD CountrySpecificDataJson NVARCHAR(MAX) NOT NULL DEFAULT ''"),
            ("Employees", "ActingManagerId", "IF OBJECT_ID(N'dbo.Employees', N'U') IS NOT NULL AND COL_LENGTH('dbo.Employees', 'ActingManagerId') IS NULL ALTER TABLE dbo.Employees ADD ActingManagerId UNIQUEIDENTIFIER NULL"),
            ("Employees", "DelegationStartDate", "IF OBJECT_ID(N'dbo.Employees', N'U') IS NOT NULL AND COL_LENGTH('dbo.Employees', 'DelegationStartDate') IS NULL ALTER TABLE dbo.Employees ADD DelegationStartDate DATETIME2 NULL"),
            ("Employees", "DelegationEndDate", "IF OBJECT_ID(N'dbo.Employees', N'U') IS NOT NULL AND COL_LENGTH('dbo.Employees', 'DelegationEndDate') IS NULL ALTER TABLE dbo.Employees ADD DelegationEndDate DATETIME2 NULL"),
            ("Employees", "DelegationReason", "IF OBJECT_ID(N'dbo.Employees', N'U') IS NOT NULL AND COL_LENGTH('dbo.Employees', 'DelegationReason') IS NULL ALTER TABLE dbo.Employees ADD DelegationReason NVARCHAR(MAX) NULL"),
            ("Employees", "IsOrganizationHead", "IF OBJECT_ID(N'dbo.Employees', N'U') IS NOT NULL AND COL_LENGTH('dbo.Employees', 'IsOrganizationHead') IS NULL ALTER TABLE dbo.Employees ADD IsOrganizationHead BIT NOT NULL DEFAULT 0"),

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
            ("FeatureFlags", "Description", "IF OBJECT_ID(N'dbo.FeatureFlags', N'U') IS NOT NULL AND COL_LENGTH('dbo.FeatureFlags', 'Description') IS NULL ALTER TABLE dbo.FeatureFlags ADD Description NVARCHAR(MAX) NULL"),

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

        var batchedAlters = new StringBuilder();
        foreach (var (tbl, col, sql) in columnAlters)
        {
            batchedAlters.AppendLine(sql).AppendLine(";");
        }

        try
        {
            await db.Database.ExecuteSqlRawAsync(batchedAlters.ToString(), cancellationToken);
        }
        catch (System.Exception ex)
        {
            logger?.LogWarning(ex, "Batched column bootstrap failed; applying columns one by one.");
            foreach (var (tbl, col, sql) in columnAlters)
            {
                try
                {
                    await db.Database.ExecuteSqlRawAsync(sql, cancellationToken);
                }
                catch (System.Exception inner)
                {
                    logger?.LogWarning(inner, "Could not add column {Col} to table {Table} (may already exist).", col, tbl);
                }
            }
        }

        await EnsurePasswordResetIndexesAsync(db, logger, cancellationToken);
        await EnsureBusinessIdSequencesAsync(db, logger, cancellationToken);
        await EnsureOrganizationStructureAsync(db, logger, cancellationToken);
        await EnsureTravelAndAiAgentsAsync(db, logger, cancellationToken);
        await EnsureCrmLeadsAsync(db, logger, cancellationToken);
        await EnsureExpensesAndGrnAsync(db, logger, cancellationToken);
        await EnsureBankReconciliationsAsync(db, logger, cancellationToken);
        await EnsureProjectTasksAndTimesheetsAsync(db, logger, cancellationToken);
        await EnsureIntegrationConnectorsAsync(db, logger, cancellationToken);
        await EnsureIntegrationApiKeysAsync(db, logger, cancellationToken);
        await EnsurePayrollFinalSettlementsAsync(db, logger, cancellationToken);
        await EnsurePayrollEmployeeFinanceAsync(db, logger, cancellationToken);
        await EnsureSecurityControlsAsync(db, logger, cancellationToken);
        await EnsureCustomReportsAndLicensingAsync(db, logger, cancellationToken);
        await EnsureProductionReadyHrFinanceAsync(db, logger, cancellationToken);
        await EnsureDocumentNumberIndexesAsync(db, logger, cancellationToken);
        await EnsureOptionalDocumentLineItemIdsAsync(db, logger, cancellationToken);
        await EnsureDiscountSchemesAsync(db, logger, cancellationToken);
        await EnsureOrgScopeColumnsAsync(db, logger, cancellationToken);
        await EnsureOrgScopeIndexesAsync(db, logger, cancellationToken);
        await EnsureEnterprisePolicyTablesAsync(db, logger, cancellationToken);
        await EnsureManufacturingAndFleetTablesAsync(db, logger, cancellationToken);
        await EnsureFieldServiceWmsAndBudgetingTablesAsync(db, logger, cancellationToken);
        await MarkExtendedSchemaCurrentAsync(db, cancellationToken);
        logger?.LogInformation("Extended schema bootstrap complete ({Version}).", ExtendedSchemaVersion);
    }

    public static async Task<bool> IsExtendedSchemaCurrentAsync(
        ApplicationDbContext db,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var tableExists = await db.Database
                .SqlQueryRaw<int>(
                    "SELECT CASE WHEN OBJECT_ID(N'dbo.__SchemaBootstrap', N'U') IS NOT NULL THEN 1 ELSE 0 END AS [Value]")
                .SingleAsync(cancellationToken);
            if (tableExists != 1)
            {
                return false;
            }

            var result = await db.Database
                .SqlQueryRaw<int>(
                    "SELECT CASE WHEN EXISTS (SELECT 1 FROM dbo.__SchemaBootstrap WHERE [Version] = {0}) THEN 1 ELSE 0 END AS [Value]",
                    ExtendedSchemaVersion)
                .SingleAsync(cancellationToken);
            if (result != 1)
            {
                return false;
            }

            var columnsExist = await db.Database
                .SqlQueryRaw<int>(
                    "SELECT CASE WHEN COL_LENGTH('dbo.Tenants', 'CountryCode') IS NOT NULL AND COL_LENGTH('dbo.Tenants', 'CompanyId') IS NOT NULL AND COL_LENGTH('dbo.Users', 'CompanyId') IS NOT NULL THEN 1 ELSE 0 END AS [Value]")
                .SingleAsync(cancellationToken);
            return columnsExist == 1;
        }
        catch
        {
            return false;
        }
    }

    private static async Task MarkExtendedSchemaCurrentAsync(
        ApplicationDbContext db,
        CancellationToken cancellationToken)
    {
        await db.Database.ExecuteSqlAsync(
            $"""
            IF OBJECT_ID(N'dbo.__SchemaBootstrap', N'U') IS NULL
            BEGIN
                CREATE TABLE dbo.__SchemaBootstrap (
                    [Version] nvarchar(64) NOT NULL PRIMARY KEY,
                    [AppliedAt] datetime2 NOT NULL
                );
            END
            IF NOT EXISTS (SELECT 1 FROM dbo.__SchemaBootstrap WHERE [Version] = {ExtendedSchemaVersion})
                INSERT INTO dbo.__SchemaBootstrap ([Version], [AppliedAt]) VALUES ({ExtendedSchemaVersion}, SYSUTCDATETIME());
            """,
            cancellationToken);
    }

    private static async Task EnsureBusinessIdSequencesAsync(
        ApplicationDbContext db,
        ILogger? logger,
        CancellationToken cancellationToken)
    {
        const string sql = @"
IF OBJECT_ID(N'[dbo].[BusinessIdSequences]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[BusinessIdSequences] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [EntityName] nvarchar(450) NOT NULL,
        [Prefix] nvarchar(max) NULL,
        [Padding] int NOT NULL,
        [CurrentValue] bigint NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_BusinessIdSequences] PRIMARY KEY ([Id])
    );
    CREATE UNIQUE INDEX [IX_BusinessIdSequences_TenantId_EntityName]
        ON [dbo].[BusinessIdSequences]([TenantId], [EntityName]);
END;";

        try
        {
            await db.Database.ExecuteSqlRawAsync(sql, cancellationToken);
        }
        catch (System.Exception ex)
        {
            logger?.LogWarning(ex, "Could not ensure BusinessIdSequences table.");
        }
    }

    private static async Task EnsureOrganizationStructureAsync(
        ApplicationDbContext db,
        ILogger? logger,
        CancellationToken cancellationToken)
    {
        try
        {
            await MigrationSqlHelper.ExecuteSqlFileAsync(
                db,
                "20260809043000_AddOrganizationStructure.sql",
                cancellationToken);
        }
        catch (System.Exception ex)
        {
            logger?.LogWarning(ex, "Could not ensure organization structure tables.");
        }
    }

    private static async Task EnsureTravelAndAiAgentsAsync(
        ApplicationDbContext db,
        ILogger? logger,
        CancellationToken cancellationToken)
    {
        try
        {
            await MigrationSqlHelper.ExecuteSqlFileAsync(
                db,
                "20260809153000_AddTravelAndAiAgents.sql",
                cancellationToken);
        }
        catch (System.Exception ex)
        {
            logger?.LogWarning(ex, "Could not ensure travel and AI agent tables.");
        }
    }

    private static async Task EnsureCrmLeadsAsync(
        ApplicationDbContext db,
        ILogger? logger,
        CancellationToken cancellationToken)
    {
        try
        {
            await MigrationSqlHelper.ExecuteSqlFileAsync(
                db,
                "20260811010000_AddCrmLeads.sql",
                cancellationToken);
        }
        catch (System.Exception ex)
        {
            logger?.LogWarning(ex, "Could not ensure CRM leads table.");
        }
    }

    private static async Task EnsureExpensesAndGrnAsync(
        ApplicationDbContext db,
        ILogger? logger,
        CancellationToken cancellationToken)
    {
        try
        {
            await MigrationSqlHelper.ExecuteSqlFileAsync(
                db,
                "20260811020000_AddExpensesAndGrn.sql",
                cancellationToken);
        }
        catch (System.Exception ex)
        {
            logger?.LogWarning(ex, "Could not ensure expense and GRN tables.");
        }
    }

    private static async Task EnsureBankReconciliationsAsync(
        ApplicationDbContext db,
        ILogger? logger,
        CancellationToken cancellationToken)
    {
        try
        {
            await MigrationSqlHelper.ExecuteSqlFileAsync(
                db,
                "20260811030000_AddBankReconciliations.sql",
                cancellationToken);
        }
        catch (System.Exception ex)
        {
            logger?.LogWarning(ex, "Could not ensure bank reconciliations table.");
        }
    }

    private static async Task EnsureProjectTasksAndTimesheetsAsync(
        ApplicationDbContext db,
        ILogger? logger,
        CancellationToken cancellationToken)
    {
        try
        {
            await MigrationSqlHelper.ExecuteSqlFileAsync(
                db,
                "20260811120000_AddProjectTasksAndTimesheets.sql",
                cancellationToken);
        }
        catch (System.Exception ex)
        {
            logger?.LogWarning(ex, "Could not ensure project tasks and timesheet tables.");
        }
    }

    private static async Task EnsureIntegrationConnectorsAsync(
        ApplicationDbContext db,
        ILogger? logger,
        CancellationToken cancellationToken)
    {
        try
        {
            await MigrationSqlHelper.ExecuteSqlFileAsync(
                db,
                "20260811140000_AddIntegrationConnectors.sql",
                cancellationToken);
        }
        catch (System.Exception ex)
        {
            logger?.LogWarning(ex, "Could not ensure integration connector tables.");
        }
    }

    private static async Task EnsureIntegrationApiKeysAsync(
        ApplicationDbContext db,
        ILogger? logger,
        CancellationToken cancellationToken)
    {
        try
        {
            await MigrationSqlHelper.ExecuteSqlFileAsync(
                db,
                "20260811160000_AddIntegrationApiKeys.sql",
                cancellationToken);
        }
        catch (System.Exception ex)
        {
            logger?.LogWarning(ex, "Could not ensure integration API key tables.");
        }
    }

    private static async Task EnsurePayrollFinalSettlementsAsync(
        ApplicationDbContext db,
        ILogger? logger,
        CancellationToken cancellationToken)
    {
        try
        {
            await MigrationSqlHelper.ExecuteSqlFileAsync(
                db,
                "20260811170000_AddPayrollFinalSettlements.sql",
                cancellationToken);
        }
        catch (System.Exception ex)
        {
            logger?.LogWarning(ex, "Could not ensure payroll final settlement tables.");
        }
    }

    private static async Task EnsurePayrollEmployeeFinanceAsync(
        ApplicationDbContext db,
        ILogger? logger,
        CancellationToken cancellationToken)
    {
        try
        {
            await MigrationSqlHelper.ExecuteSqlFileAsync(
                db,
                "20260811180000_AddPayrollEmployeeFinance.sql",
                cancellationToken);
        }
        catch (System.Exception ex)
        {
            logger?.LogWarning(ex, "Could not ensure payroll loan/bonus/arrears tables.");
        }
    }

    private static async Task EnsureSecurityControlsAsync(
        ApplicationDbContext db,
        ILogger? logger,
        CancellationToken cancellationToken)
    {
        try
        {
            await MigrationSqlHelper.ExecuteSqlFileAsync(
                db,
                "20260811190000_AddSecurityControls.sql",
                cancellationToken);
        }
        catch (System.Exception ex)
        {
            logger?.LogWarning(ex, "Could not ensure security control tables.");
        }
    }

    private static async Task EnsureCustomReportsAndLicensingAsync(
        ApplicationDbContext db,
        ILogger? logger,
        CancellationToken cancellationToken)
    {
        try
        {
            await MigrationSqlHelper.ExecuteSqlFileAsync(
                db,
                "20260811200000_AddCustomReportsAndLicensing.sql",
                cancellationToken);
        }
        catch (System.Exception ex)
        {
            logger?.LogWarning(ex, "Could not ensure custom report and licensing invoice tables.");
        }
    }

    private static async Task EnsurePasswordResetIndexesAsync(
        ApplicationDbContext db,
        ILogger? logger,
        CancellationToken cancellationToken)
    {
        const string ensureIndexesSql = @"
IF OBJECT_ID(N'[dbo].[Users]', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.Users', 'PasswordResetToken') IS NOT NULL
       AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_Users_PasswordResetToken'
          AND object_id = OBJECT_ID(N'[dbo].[Users]')
    )
    BEGIN
        CREATE INDEX [IX_Users_PasswordResetToken]
            ON [dbo].[Users]([PasswordResetToken])
            WHERE [PasswordResetToken] IS NOT NULL;
    END;

    IF COL_LENGTH('dbo.Users', 'PasswordResetExpires') IS NOT NULL
       AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_Users_PasswordResetExpires'
          AND object_id = OBJECT_ID(N'[dbo].[Users]')
    )
    BEGIN
        CREATE INDEX [IX_Users_PasswordResetExpires]
            ON [dbo].[Users]([PasswordResetExpires])
            WHERE [PasswordResetExpires] IS NOT NULL;
    END;
END;";

        try
        {
            await db.Database.ExecuteSqlRawAsync(ensureIndexesSql, cancellationToken);
        }
        catch (System.Exception ex)
        {
            logger?.LogWarning(ex, "Could not ensure password reset indexes on Users.");
        }
    }

    private static async Task EnsureProductionReadyHrFinanceAsync(
        ApplicationDbContext db,
        ILogger? logger,
        CancellationToken cancellationToken)
    {
        try
        {
            await MigrationSqlHelper.ExecuteSqlFileAsync(
                db,
                "20260817120000_AddProductionReadyHrFinance.sql",
                cancellationToken);
        }
        catch (System.Exception ex)
        {
            logger?.LogWarning(ex, "Could not ensure production-ready HR/finance schema.");
        }
    }

    private static async Task EnsureDocumentNumberIndexesAsync(
        ApplicationDbContext db,
        ILogger? logger,
        CancellationToken cancellationToken)
    {
        try
        {
            await MigrationSqlHelper.ExecuteSqlFileAsync(
                db,
                "20260818010000_AddDocumentNumberIndexes.sql",
                cancellationToken);
        }
        catch (System.Exception ex)
        {
            logger?.LogWarning(ex, "Could not ensure unique document-number indexes.");
        }
    }

    private static async Task EnsureOptionalDocumentLineItemIdsAsync(
        ApplicationDbContext db,
        ILogger? logger,
        CancellationToken cancellationToken)
    {
        try
        {
            await MigrationSqlHelper.ExecuteSqlFileAsync(
                db,
                "20260819053000_OptionalDocumentLineItemIds.sql",
                cancellationToken);
        }
        catch (System.Exception ex)
        {
            logger?.LogWarning(ex, "Could not make document-line ItemId optional.");
        }
    }

    private static async Task EnsureDiscountSchemesAsync(
        ApplicationDbContext db,
        ILogger? logger,
        CancellationToken cancellationToken)
    {
        try
        {
            await MigrationSqlHelper.ExecuteSqlFileAsync(
                db,
                "20260819060000_AddDiscountSchemes.sql",
                cancellationToken);
        }
        catch (System.Exception ex)
        {
            logger?.LogWarning(ex, "Could not ensure discount scheme tables.");
        }
    }

    private static async Task EnsureOrgScopeColumnsAsync(
        ApplicationDbContext db,
        ILogger? logger,
        CancellationToken cancellationToken)
    {
        const string dynamicSql = @"
DECLARE @sqlOrg NVARCHAR(MAX) = '';
SELECT @sqlOrg = @sqlOrg + 'ALTER TABLE [' + t.TABLE_SCHEMA + '].[' + t.TABLE_NAME + '] ADD CompanyId UNIQUEIDENTIFIER NULL; '
FROM INFORMATION_SCHEMA.TABLES t
WHERE t.TABLE_TYPE = 'BASE TABLE'
  AND t.TABLE_SCHEMA = 'dbo'
  AND t.TABLE_NAME NOT LIKE '__%'
  AND NOT EXISTS (
      SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS c 
      WHERE c.TABLE_SCHEMA = t.TABLE_SCHEMA 
        AND c.TABLE_NAME = t.TABLE_NAME 
        AND c.COLUMN_NAME = 'CompanyId'
  );

SELECT @sqlOrg = @sqlOrg + 'ALTER TABLE [' + t.TABLE_SCHEMA + '].[' + t.TABLE_NAME + '] ADD ProjectId UNIQUEIDENTIFIER NULL; '
FROM INFORMATION_SCHEMA.TABLES t
WHERE t.TABLE_TYPE = 'BASE TABLE'
  AND t.TABLE_SCHEMA = 'dbo'
  AND t.TABLE_NAME NOT LIKE '__%'
  AND NOT EXISTS (
      SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS c 
      WHERE c.TABLE_SCHEMA = t.TABLE_SCHEMA 
        AND c.TABLE_NAME = t.TABLE_NAME 
        AND c.COLUMN_NAME = 'ProjectId'
  );

IF LEN(@sqlOrg) > 0 EXEC sp_executesql @sqlOrg;
";
        try
        {
            await db.Database.ExecuteSqlRawAsync(dynamicSql, cancellationToken);
            logger?.LogInformation("Ensured CompanyId and ProjectId columns across all dbo tables.");
        }
        catch (System.Exception ex)
        {
            logger?.LogWarning(ex, "Could not ensure dynamic company/project scope columns.");
        }

        try
        {
            await MigrationSqlHelper.ExecuteSqlFileAsync(
                db,
                "20260819080000_AddOrgScopeColumns.sql",
                cancellationToken);
        }
        catch (System.Exception ex)
        {
            logger?.LogWarning(ex, "Could not apply AddOrgScopeColumns SQL file.");
        }
    }

    private static async Task EnsureOrgScopeIndexesAsync(
        ApplicationDbContext db,
        ILogger? logger,
        CancellationToken cancellationToken)
    {
        try
        {
            await MigrationSqlHelper.ExecuteSqlFileAsync(
                db,
                "20260819090000_AddOrgScopeIndexes.sql",
                cancellationToken);
        }
        catch (System.Exception ex)
        {
            logger?.LogWarning(ex, "Could not ensure company/project list indexes.");
        }
    }

    public static async Task EnsureSubscriptionTablesAsync(
        ApplicationDbContext db,
        ILogger? logger,
        CancellationToken cancellationToken)
    {
        const string sql = @"
IF OBJECT_ID(N'dbo.SubscriptionPlans', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SubscriptionPlans (
        Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        TenantId UNIQUEIDENTIFIER NOT NULL,
        BusinessId NVARCHAR(100) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NULL,
        CreatedBy UNIQUEIDENTIFIER NULL,
        UpdatedBy UNIQUEIDENTIFIER NULL,
        IsDeleted BIT NOT NULL DEFAULT 0,
        PlanCode NVARCHAR(50) NOT NULL,
        Name NVARCHAR(200) NOT NULL,
        Description NVARCHAR(MAX) NOT NULL DEFAULT '',
        MonthlyPriceInr DECIMAL(18,2) NOT NULL DEFAULT 0,
        AnnualPriceInr DECIMAL(18,2) NOT NULL DEFAULT 0,
        MaxUsers INT NOT NULL DEFAULT 5,
        MaxStorageMb INT NOT NULL DEFAULT 5120,
        MaxApiCallsPerDay INT NOT NULL DEFAULT 10000,
        AllowedModulesJson NVARCHAR(MAX) NOT NULL DEFAULT '[]',
        IsCustomPricing BIT NOT NULL DEFAULT 0,
        IsActive BIT NOT NULL DEFAULT 1,
        SortOrder INT NOT NULL DEFAULT 0
    );

    CREATE UNIQUE INDEX IX_SubscriptionPlans_PlanCode ON dbo.SubscriptionPlans(PlanCode) WHERE IsDeleted = 0;
END;

IF OBJECT_ID(N'dbo.TenantSubscriptions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantSubscriptions (
        Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        TenantId UNIQUEIDENTIFIER NOT NULL,
        BusinessId NVARCHAR(100) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NULL,
        CreatedBy UNIQUEIDENTIFIER NULL,
        UpdatedBy UNIQUEIDENTIFIER NULL,
        IsDeleted BIT NOT NULL DEFAULT 0,
        PlanId UNIQUEIDENTIFIER NULL,
        PlanCode NVARCHAR(50) NOT NULL DEFAULT 'trial',
        Status NVARCHAR(50) NOT NULL DEFAULT 'Active',
        BillingCycle NVARCHAR(50) NOT NULL DEFAULT 'Monthly',
        Amount DECIMAL(18,2) NOT NULL DEFAULT 0,
        Currency NVARCHAR(10) NOT NULL DEFAULT 'INR',
        StartDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        EndDate DATETIME2 NULL,
        TrialEndsAt DATETIME2 NULL,
        NextBillingDate DATETIME2 NULL,
        GatewayProvider NVARCHAR(50) NULL,
        GatewaySubscriptionId NVARCHAR(200) NULL,
        GatewayCustomerId NVARCHAR(200) NULL,
        LastPaymentStatus NVARCHAR(50) NULL,
        LastPaymentDate DATETIME2 NULL,
        AutoRenew BIT NOT NULL DEFAULT 1
    );

    CREATE INDEX IX_TenantSubscriptions_TenantId ON dbo.TenantSubscriptions(TenantId);
END;
";
        try
        {
            await db.Database.ExecuteSqlRawAsync(sql, cancellationToken);
            logger?.LogInformation("Ensured SubscriptionPlans and TenantSubscriptions tables.");
        }
        catch (System.Exception ex)
        {
            logger?.LogWarning(ex, "Could not ensure subscription tables via DDL.");
        }
    }

    public static async Task EnsureOutboxMessagesTableAsync(
        ApplicationDbContext db,
        ILogger? logger,
        CancellationToken cancellationToken)
    {
        const string sql = @"
IF OBJECT_ID(N'dbo.OutboxMessages', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.OutboxMessages (
        Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        TenantId UNIQUEIDENTIFIER NOT NULL,
        BusinessId NVARCHAR(128) NULL,
        EventType NVARCHAR(256) NOT NULL DEFAULT '',
        PayloadJson NVARCHAR(MAX) NOT NULL DEFAULT '',
        OccurredAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        ProcessedAtUtc DATETIME2 NULL,
        Error NVARCHAR(MAX) NULL,
        RetryCount INT NOT NULL DEFAULT 0,
        IsProcessed BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NULL,
        CreatedBy UNIQUEIDENTIFIER NULL,
        IsDeleted BIT NOT NULL DEFAULT 0
    );

    CREATE NONCLUSTERED INDEX IX_OutboxMessages_Processing 
    ON dbo.OutboxMessages (IsProcessed, RetryCount, OccurredAtUtc);
END;
";
        try
        {
            await db.Database.ExecuteSqlRawAsync(sql, cancellationToken);
            logger?.LogInformation("Ensured OutboxMessages table.");
        }
        catch (System.Exception ex)
        {
            logger?.LogWarning(ex, "Could not ensure OutboxMessages table via DDL.");
        }
    }

    public static async Task EnsureBusinessIdColumnsAsync(
        ApplicationDbContext db,
        ILogger? logger,
        CancellationToken cancellationToken)
    {
        const string sql = @"
IF OBJECT_ID(N'dbo.SubscriptionPlans', N'U') IS NOT NULL AND COL_LENGTH('dbo.SubscriptionPlans', 'BusinessId') IS NULL ALTER TABLE dbo.SubscriptionPlans ADD BusinessId NVARCHAR(100) NULL;
IF OBJECT_ID(N'dbo.TenantSubscriptions', N'U') IS NOT NULL AND COL_LENGTH('dbo.TenantSubscriptions', 'BusinessId') IS NULL ALTER TABLE dbo.TenantSubscriptions ADD BusinessId NVARCHAR(100) NULL;
IF OBJECT_ID(N'dbo.AuditLogs', N'U') IS NOT NULL AND COL_LENGTH('dbo.AuditLogs', 'BusinessId') IS NULL ALTER TABLE dbo.AuditLogs ADD BusinessId NVARCHAR(100) NULL;
IF OBJECT_ID(N'dbo.Users', N'U') IS NOT NULL AND COL_LENGTH('dbo.Users', 'BusinessId') IS NULL ALTER TABLE dbo.Users ADD BusinessId NVARCHAR(100) NULL;
IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL AND COL_LENGTH('dbo.Tenants', 'BusinessId') IS NULL ALTER TABLE dbo.Tenants ADD BusinessId NVARCHAR(100) NULL;
IF OBJECT_ID(N'dbo.Roles', N'U') IS NOT NULL AND COL_LENGTH('dbo.Roles', 'BusinessId') IS NULL ALTER TABLE dbo.Roles ADD BusinessId NVARCHAR(100) NULL;
IF OBJECT_ID(N'dbo.Permissions', N'U') IS NOT NULL AND COL_LENGTH('dbo.Permissions', 'BusinessId') IS NULL ALTER TABLE dbo.Permissions ADD BusinessId NVARCHAR(100) NULL;
IF OBJECT_ID(N'dbo.UserRoles', N'U') IS NOT NULL AND COL_LENGTH('dbo.UserRoles', 'BusinessId') IS NULL ALTER TABLE dbo.UserRoles ADD BusinessId NVARCHAR(100) NULL;
IF OBJECT_ID(N'dbo.RolePermissions', N'U') IS NOT NULL AND COL_LENGTH('dbo.RolePermissions', 'BusinessId') IS NULL ALTER TABLE dbo.RolePermissions ADD BusinessId NVARCHAR(100) NULL;
IF OBJECT_ID(N'dbo.Employees', N'U') IS NOT NULL AND COL_LENGTH('dbo.Employees', 'BusinessId') IS NULL ALTER TABLE dbo.Employees ADD BusinessId NVARCHAR(100) NULL;
IF OBJECT_ID(N'dbo.Modules', N'U') IS NOT NULL AND COL_LENGTH('dbo.Modules', 'BusinessId') IS NULL ALTER TABLE dbo.Modules ADD BusinessId NVARCHAR(100) NULL;
IF OBJECT_ID(N'dbo.TenantModules', N'U') IS NOT NULL AND COL_LENGTH('dbo.TenantModules', 'BusinessId') IS NULL ALTER TABLE dbo.TenantModules ADD BusinessId NVARCHAR(100) NULL;
IF OBJECT_ID(N'dbo.TenantConfigs', N'U') IS NOT NULL AND COL_LENGTH('dbo.TenantConfigs', 'BusinessId') IS NULL ALTER TABLE dbo.TenantConfigs ADD BusinessId NVARCHAR(100) NULL;
IF OBJECT_ID(N'dbo.WebsitePages', N'U') IS NOT NULL AND COL_LENGTH('dbo.WebsitePages', 'BusinessId') IS NULL ALTER TABLE dbo.WebsitePages ADD BusinessId NVARCHAR(100) NULL;
IF OBJECT_ID(N'dbo.ContactSubmissions', N'U') IS NOT NULL AND COL_LENGTH('dbo.ContactSubmissions', 'BusinessId') IS NULL ALTER TABLE dbo.ContactSubmissions ADD BusinessId NVARCHAR(100) NULL;

DECLARE @sql NVARCHAR(MAX) = '';
SELECT @sql = @sql + 'ALTER TABLE [' + t.TABLE_SCHEMA + '].[' + t.TABLE_NAME + '] ADD BusinessId NVARCHAR(100) NULL; '
FROM INFORMATION_SCHEMA.TABLES t
WHERE t.TABLE_TYPE = 'BASE TABLE'
  AND t.TABLE_SCHEMA = 'dbo'
  AND t.TABLE_NAME NOT LIKE '__%'
  AND NOT EXISTS (
      SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS c 
      WHERE c.TABLE_SCHEMA = t.TABLE_SCHEMA 
        AND c.TABLE_NAME = t.TABLE_NAME 
        AND c.COLUMN_NAME = 'BusinessId'
  );
IF LEN(@sql) > 0 EXEC sp_executesql @sql;
";
        try
        {
            await db.Database.ExecuteSqlRawAsync(sql, cancellationToken);
            logger?.LogInformation("Ensured BusinessId column across all dbo database tables.");
        }
        catch (System.Exception ex)
        {
            logger?.LogWarning(ex, "Could not ensure BusinessId column across all tables.");
        }
    }

    public static async Task EnsurePerformanceIndexesAsync(
        ApplicationDbContext db,
        ILogger? logger,
        CancellationToken cancellationToken)
    {
        const string sql = @"
IF OBJECT_ID(N'dbo.NotificationMessages', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_NotificationMessages_Tenant_User_Read' AND object_id = OBJECT_ID('dbo.NotificationMessages'))
    BEGIN
        CREATE NONCLUSTERED INDEX [IX_NotificationMessages_Tenant_User_Read]
        ON [dbo].[NotificationMessages] ([TenantId], [RecipientUserId], [IsDeleted], [IsRead], [CreatedAt] DESC)
        INCLUDE ([Title], [Message], [Channel], [Type], [Status], [SentAt], [ReadAt], [CompanyId], [ProjectId]);
    END
END;

IF OBJECT_ID(N'dbo.AuditLogs', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AuditLogs_Tenant_Created' AND object_id = OBJECT_ID('dbo.AuditLogs'))
    BEGIN
        CREATE NONCLUSTERED INDEX [IX_AuditLogs_Tenant_Created]
        ON [dbo].[AuditLogs] ([TenantId], [CreatedAt] DESC)
        INCLUDE ([Action], [EntityName], [EntityId], [PerformedBy], [IsDeleted]);
    END
END;

IF OBJECT_ID(N'dbo.Users', N'U') IS NOT NULL AND COL_LENGTH('dbo.Users', 'EmailHash') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Users_TenantId_EmailHash' AND object_id = OBJECT_ID('dbo.Users'))
    BEGIN
        CREATE NONCLUSTERED INDEX [IX_Users_TenantId_EmailHash]
        ON [dbo].[Users] ([TenantId], [EmailHash])
        WHERE [IsDeleted] = 0;
    END
END;
";
        try
        {
            await db.Database.ExecuteSqlRawAsync(sql, cancellationToken);
            logger?.LogInformation("Ensured performance covering indexes on NotificationMessages and AuditLogs.");
        }
        catch (System.Exception ex)
        {
            logger?.LogWarning(ex, "Non-critical: could not create performance indexes.");
        }
    }

    private static async Task EnsureEnterprisePolicyTablesAsync(
        ApplicationDbContext db,
        ILogger? logger,
        CancellationToken cancellationToken)
    {
        const string sql = @"
IF OBJECT_ID(N'dbo.PolicyMasters', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PolicyMasters (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        [TenantId] UNIQUEIDENTIFIER NOT NULL,
        [BusinessId] NVARCHAR(100) NULL,
        [CreatedAt] DATETIME2 NOT NULL,
        [UpdatedAt] DATETIME2 NULL,
        [CreatedBy] UNIQUEIDENTIFIER NULL,
        [IsDeleted] BIT NOT NULL DEFAULT 0,
        [Code] NVARCHAR(100) NOT NULL,
        [Name] NVARCHAR(200) NOT NULL,
        [Category] NVARCHAR(100) NOT NULL,
        [Description] NVARCHAR(MAX) NULL,
        [IsMandatoryAcknowledgment] BIT NOT NULL DEFAULT 0,
        [IsSystemCritical] BIT NOT NULL DEFAULT 0,
        [Priority] INT NOT NULL DEFAULT 10,
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Active'
    );
    CREATE NONCLUSTERED INDEX [IX_PolicyMasters_Tenant_Category]
    ON dbo.PolicyMasters ([TenantId], [Category], [IsDeleted]);
END;

IF OBJECT_ID(N'dbo.PolicyVersions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PolicyVersions (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        [TenantId] UNIQUEIDENTIFIER NOT NULL,
        [BusinessId] NVARCHAR(100) NULL,
        [CreatedAt] DATETIME2 NOT NULL,
        [UpdatedAt] DATETIME2 NULL,
        [CreatedBy] UNIQUEIDENTIFIER NULL,
        [IsDeleted] BIT NOT NULL DEFAULT 0,
        [PolicyMasterId] UNIQUEIDENTIFIER NOT NULL,
        [Version] NVARCHAR(50) NOT NULL,
        [EffectiveFrom] DATETIME2 NOT NULL,
        [EffectiveTo] DATETIME2 NULL,
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Active',
        [ChangeLogReason] NVARCHAR(MAX) NULL,
        [AuthorName] NVARCHAR(200) NULL,
        [ApprovedByName] NVARCHAR(200) NULL,
        [ApprovedAt] DATETIME2 NULL,
        [ApplicabilityJson] NVARCHAR(MAX) NULL,
        [RuleConfigJson] NVARCHAR(MAX) NULL,
        [ApprovalWorkflowJson] NVARCHAR(MAX) NULL,
        CONSTRAINT [FK_PolicyVersions_PolicyMasters_PolicyMasterId] FOREIGN KEY ([PolicyMasterId]) REFERENCES dbo.PolicyMasters ([Id]) ON DELETE CASCADE
    );
    CREATE NONCLUSTERED INDEX [IX_PolicyVersions_PolicyMasterId]
    ON dbo.PolicyVersions ([PolicyMasterId], [Status]);
END;

IF OBJECT_ID(N'dbo.AttendancePolicies', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AttendancePolicies (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        [TenantId] UNIQUEIDENTIFIER NOT NULL,
        [BusinessId] NVARCHAR(100) NULL,
        [CreatedAt] DATETIME2 NOT NULL,
        [UpdatedAt] DATETIME2 NULL,
        [CreatedBy] UNIQUEIDENTIFIER NULL,
        [IsDeleted] BIT NOT NULL DEFAULT 0,
        [Name] NVARCHAR(200) NOT NULL,
        [Description] NVARCHAR(MAX) NULL,
        [IsDefault] BIT NOT NULL DEFAULT 0,
        [StandardShiftHours] DECIMAL(5,2) NOT NULL DEFAULT 8.0,
        [MinHalfDayHours] DECIMAL(5,2) NOT NULL DEFAULT 4.0,
        [GracePeriodMinutes] INT NOT NULL DEFAULT 15,
        [OvertimeThresholdHours] DECIMAL(5,2) NOT NULL DEFAULT 8.0,
        [MaxContinuousHours] DECIMAL(5,2) NOT NULL DEFAULT 16.0,
        [AutoDeductBreakMinutes] INT NOT NULL DEFAULT 60,
        [RequireGeofence] BIT NOT NULL DEFAULT 0,
        [AllowedRadiusMeters] INT NULL DEFAULT 250,
        [RequireFacialVerification] BIT NOT NULL DEFAULT 0,
        [MinFacialConfidenceScore] INT NULL DEFAULT 75,
        [AllowManualRegularization] BIT NOT NULL DEFAULT 1,
        [MaxRegularizationsPerMonth] INT NULL DEFAULT 3,
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Active',
        [CompanyId] UNIQUEIDENTIFIER NULL
    );
    CREATE NONCLUSTERED INDEX [IX_AttendancePolicies_Tenant_Default]
    ON dbo.AttendancePolicies ([TenantId], [IsDefault], [IsDeleted]);
END;

IF OBJECT_ID(N'dbo.PayrollPolicies', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PayrollPolicies (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        [TenantId] UNIQUEIDENTIFIER NOT NULL,
        [BusinessId] NVARCHAR(100) NULL,
        [CreatedAt] DATETIME2 NOT NULL,
        [UpdatedAt] DATETIME2 NULL,
        [CreatedBy] UNIQUEIDENTIFIER NULL,
        [IsDeleted] BIT NOT NULL DEFAULT 0,
        [Name] NVARCHAR(200) NOT NULL,
        [Description] NVARCHAR(MAX) NULL,
        [IsDefault] BIT NOT NULL DEFAULT 0,
        [PayCycle] NVARCHAR(50) NOT NULL DEFAULT 'CalendarMonth',
        [BasicPercentageOfGross] DECIMAL(5,2) NOT NULL DEFAULT 50.0,
        [HraPercentageOfBasic] DECIMAL(5,2) NOT NULL DEFAULT 40.0,
        [PfCalculationBasis] NVARCHAR(50) NOT NULL DEFAULT 'StatutoryWageCeiling',
        [PfWageCeiling] DECIMAL(18,2) NOT NULL DEFAULT 15000.0,
        [PfEmployeeRate] DECIMAL(5,2) NOT NULL DEFAULT 12.0,
        [PfEmployerRate] DECIMAL(5,2) NOT NULL DEFAULT 12.0,
        [IsEsiEnabled] BIT NOT NULL DEFAULT 1,
        [EsiWageCeiling] DECIMAL(18,2) NOT NULL DEFAULT 21000.0,
        [EsiEmployeeRate] DECIMAL(5,2) NOT NULL DEFAULT 0.75,
        [EsiEmployerRate] DECIMAL(5,2) NOT NULL DEFAULT 3.25,
        [ProfessionalTaxMonthly] DECIMAL(18,2) NOT NULL DEFAULT 200.0,
        [PayDayOfMonth] INT NOT NULL DEFAULT 1,
        [AllowNegativeTakeHome] BIT NOT NULL DEFAULT 0,
        [CompanyId] UNIQUEIDENTIFIER NULL,
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Active'
    );
    CREATE NONCLUSTERED INDEX [IX_PayrollPolicies_Tenant_Default]
    ON dbo.PayrollPolicies ([TenantId], [IsDefault], [IsDeleted]);
END;

IF OBJECT_ID(N'dbo.TravelExpensePolicies', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TravelExpensePolicies (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        [TenantId] UNIQUEIDENTIFIER NOT NULL,
        [BusinessId] NVARCHAR(100) NULL,
        [CreatedAt] DATETIME2 NOT NULL,
        [UpdatedAt] DATETIME2 NULL,
        [CreatedBy] UNIQUEIDENTIFIER NULL,
        [IsDeleted] BIT NOT NULL DEFAULT 0,
        [Name] NVARCHAR(200) NOT NULL,
        [Description] NVARCHAR(MAX) NULL,
        [IsDefault] BIT NOT NULL DEFAULT 0,
        [MaxDailyLodgingAllowance] DECIMAL(18,2) NOT NULL DEFAULT 3500.0,
        [MaxDailyMealsAllowance] DECIMAL(18,2) NOT NULL DEFAULT 800.0,
        [MileageRatePerKmCar] DECIMAL(5,2) NOT NULL DEFAULT 12.0,
        [MileageRatePerKmBike] DECIMAL(5,2) NOT NULL DEFAULT 6.0,
        [RequiresAdvanceApproval] BIT NOT NULL DEFAULT 1,
        [ApprovalThresholdAmount] DECIMAL(18,2) NOT NULL DEFAULT 5000.0,
        [MaxAdvancePercentage] DECIMAL(5,2) NOT NULL DEFAULT 80.0,
        [ReceiptRequiredAboveAmount] DECIMAL(18,2) NOT NULL DEFAULT 200.0,
        [ExpenseSubmissionWindowDays] INT NOT NULL DEFAULT 15,
        [CompanyId] UNIQUEIDENTIFIER NULL,
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Active'
    );
    CREATE NONCLUSTERED INDEX [IX_TravelExpensePolicies_Tenant_Default]
    ON dbo.TravelExpensePolicies ([TenantId], [IsDefault], [IsDeleted]);
END;

IF OBJECT_ID(N'dbo.ProbationPolicies', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ProbationPolicies (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        [TenantId] UNIQUEIDENTIFIER NOT NULL,
        [BusinessId] NVARCHAR(100) NULL,
        [CreatedAt] DATETIME2 NOT NULL,
        [UpdatedAt] DATETIME2 NULL,
        [CreatedBy] UNIQUEIDENTIFIER NULL,
        [IsDeleted] BIT NOT NULL DEFAULT 0,
        [Name] NVARCHAR(200) NOT NULL,
        [Description] NVARCHAR(MAX) NULL,
        [IsDefault] BIT NOT NULL DEFAULT 0,
        [DefaultProbationMonths] INT NOT NULL DEFAULT 3,
        [MaxExtensionMonths] INT NOT NULL DEFAULT 3,
        [NoticePeriodDaysProbation] INT NOT NULL DEFAULT 15,
        [NoticePeriodDaysConfirmed] INT NOT NULL DEFAULT 60,
        [EvaluationReminderDaysBeforeEnd] INT NOT NULL DEFAULT 15,
        [RequiresManagerReview] BIT NOT NULL DEFAULT 1,
        [RequiresHodApproval] BIT NOT NULL DEFAULT 1,
        [AutoConfirmationAllowed] BIT NOT NULL DEFAULT 0,
        [MinimumReviewScoreForConfirmation] INT NOT NULL DEFAULT 70,
        [CompanyId] UNIQUEIDENTIFIER NULL,
        [ProjectId] UNIQUEIDENTIFIER NULL,
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Active'
    );
    CREATE NONCLUSTERED INDEX [IX_ProbationPolicies_Tenant_Default]
    ON dbo.ProbationPolicies ([TenantId], [IsDefault], [IsDeleted]);
END;

IF OBJECT_ID(N'dbo.PolicyRuleDefinitions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PolicyRuleDefinitions (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        [TenantId] UNIQUEIDENTIFIER NOT NULL,
        [BusinessId] NVARCHAR(100) NULL,
        [CreatedAt] DATETIME2 NOT NULL,
        [UpdatedAt] DATETIME2 NULL,
        [CreatedBy] UNIQUEIDENTIFIER NULL,
        [IsDeleted] BIT NOT NULL DEFAULT 0,
        [CompanyId] UNIQUEIDENTIFIER NULL,
        [ProjectId] UNIQUEIDENTIFIER NULL,
        [Category] NVARCHAR(100) NOT NULL,
        [PolicyCode] NVARCHAR(100) NOT NULL,
        [FieldKey] NVARCHAR(100) NOT NULL,
        [FieldLabel] NVARCHAR(200) NOT NULL,
        [FieldType] NVARCHAR(50) NOT NULL DEFAULT 'text',
        [Section] NVARCHAR(100) NOT NULL DEFAULT 'General',
        [DefaultValue] NVARCHAR(MAX) NOT NULL DEFAULT '',
        [MinValue] DECIMAL(18,4) NULL,
        [MaxValue] DECIMAL(18,4) NULL,
        [Step] DECIMAL(18,4) NULL,
        [Unit] NVARCHAR(50) NULL,
        [OptionsJson] NVARCHAR(MAX) NULL,
        [HelpText] NVARCHAR(MAX) NULL,
        [IsRequired] BIT NOT NULL DEFAULT 1,
        [IsVisible] BIT NOT NULL DEFAULT 1,
        [IsReadOnly] BIT NOT NULL DEFAULT 0,
        [DisplayOrder] INT NOT NULL DEFAULT 0,
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'Active'
    );
    CREATE NONCLUSTERED INDEX [IX_PolicyRuleDefinitions_Tenant_Cat_Comp_Proj]
    ON dbo.PolicyRuleDefinitions ([TenantId], [Category], [CompanyId], [ProjectId], [IsDeleted]);
END;

-- Ensure CompanyId and ProjectId across all policy and structure tables
IF OBJECT_ID(N'dbo.AttendancePolicies', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.AttendancePolicies', 'CompanyId') IS NULL
        ALTER TABLE dbo.AttendancePolicies ADD CompanyId UNIQUEIDENTIFIER NULL;
    IF COL_LENGTH('dbo.AttendancePolicies', 'BranchId') IS NULL
        ALTER TABLE dbo.AttendancePolicies ADD BranchId UNIQUEIDENTIFIER NULL;
    IF COL_LENGTH('dbo.AttendancePolicies', 'ProjectId') IS NULL
        ALTER TABLE dbo.AttendancePolicies ADD ProjectId UNIQUEIDENTIFIER NULL;
END;

IF OBJECT_ID(N'dbo.PayrollPolicies', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.PayrollPolicies', 'CompanyId') IS NULL
        ALTER TABLE dbo.PayrollPolicies ADD CompanyId UNIQUEIDENTIFIER NULL;
    IF COL_LENGTH('dbo.PayrollPolicies', 'ProjectId') IS NULL
        ALTER TABLE dbo.PayrollPolicies ADD ProjectId UNIQUEIDENTIFIER NULL;
END;

IF OBJECT_ID(N'dbo.TravelExpensePolicies', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.TravelExpensePolicies', 'CompanyId') IS NULL
        ALTER TABLE dbo.TravelExpensePolicies ADD CompanyId UNIQUEIDENTIFIER NULL;
    IF COL_LENGTH('dbo.TravelExpensePolicies', 'ProjectId') IS NULL
        ALTER TABLE dbo.TravelExpensePolicies ADD ProjectId UNIQUEIDENTIFIER NULL;
END;

IF OBJECT_ID(N'dbo.ProbationPolicies', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.ProbationPolicies', 'CompanyId') IS NULL
        ALTER TABLE dbo.ProbationPolicies ADD CompanyId UNIQUEIDENTIFIER NULL;
    IF COL_LENGTH('dbo.ProbationPolicies', 'ProjectId') IS NULL
        ALTER TABLE dbo.ProbationPolicies ADD ProjectId UNIQUEIDENTIFIER NULL;
END;

IF OBJECT_ID(N'dbo.LeavePolicies', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.LeavePolicies', 'CompanyId') IS NULL
        ALTER TABLE dbo.LeavePolicies ADD CompanyId UNIQUEIDENTIFIER NULL;
    IF COL_LENGTH('dbo.LeavePolicies', 'ProjectId') IS NULL
        ALTER TABLE dbo.LeavePolicies ADD ProjectId UNIQUEIDENTIFIER NULL;
    IF COL_LENGTH('dbo.LeavePolicies', 'DepartmentId') IS NULL
        ALTER TABLE dbo.LeavePolicies ADD DepartmentId UNIQUEIDENTIFIER NULL;
    IF COL_LENGTH('dbo.LeavePolicies', 'Description') IS NULL
        ALTER TABLE dbo.LeavePolicies ADD Description NVARCHAR(MAX) NULL;
    IF COL_LENGTH('dbo.LeavePolicies', 'IsDefault') IS NULL
        ALTER TABLE dbo.LeavePolicies ADD IsDefault BIT NOT NULL DEFAULT 0;
    IF COL_LENGTH('dbo.LeavePolicies', 'Status') IS NULL
        ALTER TABLE dbo.LeavePolicies ADD Status NVARCHAR(50) NOT NULL DEFAULT 'Active';
END;

IF OBJECT_ID(N'dbo.PayrollStructures', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.PayrollStructures', 'CompanyId') IS NULL
        ALTER TABLE dbo.PayrollStructures ADD CompanyId UNIQUEIDENTIFIER NULL;
    IF COL_LENGTH('dbo.PayrollStructures', 'ProjectId') IS NULL
        ALTER TABLE dbo.PayrollStructures ADD ProjectId UNIQUEIDENTIFIER NULL;
    IF COL_LENGTH('dbo.PayrollStructures', 'Description') IS NULL
        ALTER TABLE dbo.PayrollStructures ADD Description NVARCHAR(MAX) NULL;
    IF COL_LENGTH('dbo.PayrollStructures', 'IsDefault') IS NULL
        ALTER TABLE dbo.PayrollStructures ADD IsDefault BIT NOT NULL DEFAULT 0;
END;
";
        try
        {
            await db.Database.ExecuteSqlRawAsync(sql, cancellationToken);
            logger?.LogInformation("Ensured physical database tables for PolicyMasters, PolicyVersions, AttendancePolicies, PayrollPolicies, TravelExpensePolicies, ProbationPolicies, and PolicyRuleDefinitions.");
        }
        catch (System.Exception ex)
        {
            logger?.LogWarning(ex, "Could not ensure enterprise policy tables (may already exist).");
        }
    }

    private static async Task EnsureTenantWebhooksTablesAsync(
        ApplicationDbContext db,
        ILogger? logger,
        CancellationToken cancellationToken)
    {
        const string sql = @"
IF OBJECT_ID(N'dbo.TenantWebhooks', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantWebhooks (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PK_TenantWebhooks] PRIMARY KEY,
        [TenantId] UNIQUEIDENTIFIER NOT NULL,
        [BusinessId] NVARCHAR(64) NULL,
        [Name] NVARCHAR(128) NOT NULL,
        [TargetUrl] NVARCHAR(1024) NOT NULL,
        [SecretKey] NVARCHAR(256) NOT NULL,
        [EventsJson] NVARCHAR(MAX) NOT NULL CONSTRAINT [DF_TenantWebhooks_EventsJson] DEFAULT N'[""*\""]',
        [IsActive] BIT NOT NULL CONSTRAINT [DF_TenantWebhooks_IsActive] DEFAULT 1,
        [LastTriggeredAt] DATETIME2 NULL,
        [FailureCount] INT NOT NULL CONSTRAINT [DF_TenantWebhooks_FailureCount] DEFAULT 0,
        [LastError] NVARCHAR(MAX) NULL,
        [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_TenantWebhooks_CreatedAt] DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] DATETIME2 NULL,
        [CreatedBy] UNIQUEIDENTIFIER NULL,
        [IsDeleted] BIT NOT NULL CONSTRAINT [DF_TenantWebhooks_IsDeleted] DEFAULT 0
    );

    CREATE NONCLUSTERED INDEX [IX_TenantWebhooks_Tenant_Active]
    ON dbo.TenantWebhooks ([TenantId], [IsActive], [IsDeleted]);
END;

IF OBJECT_ID(N'dbo.WebhookDeliveryLogs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WebhookDeliveryLogs (
        [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PK_WebhookDeliveryLogs] PRIMARY KEY,
        [TenantId] UNIQUEIDENTIFIER NOT NULL,
        [BusinessId] NVARCHAR(64) NULL,
        [WebhookId] UNIQUEIDENTIFIER NOT NULL,
        [EventType] NVARCHAR(128) NOT NULL,
        [TargetUrl] NVARCHAR(1024) NOT NULL,
        [PayloadJson] NVARCHAR(MAX) NOT NULL,
        [ResponseStatusCode] INT NOT NULL,
        [ResponseBody] NVARCHAR(MAX) NULL,
        [Status] NVARCHAR(64) NOT NULL CONSTRAINT [DF_WebhookDeliveryLogs_Status] DEFAULT N'Success',
        [DurationMs] BIGINT NOT NULL CONSTRAINT [DF_WebhookDeliveryLogs_DurationMs] DEFAULT 0,
        [AttemptedAt] DATETIME2 NOT NULL CONSTRAINT [DF_WebhookDeliveryLogs_AttemptedAt] DEFAULT SYSUTCDATETIME(),
        [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_WebhookDeliveryLogs_CreatedAt] DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] DATETIME2 NULL,
        [CreatedBy] UNIQUEIDENTIFIER NULL,
        [IsDeleted] BIT NOT NULL CONSTRAINT [DF_WebhookDeliveryLogs_IsDeleted] DEFAULT 0
    );

    CREATE NONCLUSTERED INDEX [IX_WebhookDeliveryLogs_WebhookId_AttemptedAt]
    ON dbo.WebhookDeliveryLogs ([WebhookId], [AttemptedAt] DESC);

    CREATE NONCLUSTERED INDEX [IX_WebhookDeliveryLogs_Tenant_AttemptedAt]
    ON dbo.WebhookDeliveryLogs ([TenantId], [AttemptedAt] DESC);
END;
";
        try
        {
            await db.Database.ExecuteSqlRawAsync(sql, cancellationToken);
            logger?.LogInformation("Ensured physical database tables for TenantWebhooks and WebhookDeliveryLogs.");
        }
        catch (System.Exception ex)
        {
            logger?.LogWarning(ex, "Could not ensure tenant webhook tables.");
        }
    }

    private static async Task EnsureManufacturingAndFleetTablesAsync(
        ApplicationDbContext db,
        ILogger? logger,
        CancellationToken cancellationToken)
    {
        const string sql = @"
IF OBJECT_ID(N'[dbo].[WorkOrders]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[WorkOrders] (
        [Id] uniqueidentifier NOT NULL PRIMARY KEY,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(100) NULL,
        [WorkOrderNumber] nvarchar(100) NOT NULL,
        [ItemId] uniqueidentifier NOT NULL,
        [TargetQuantity] decimal(18, 4) NOT NULL DEFAULT 1,
        [ProducedQuantity] decimal(18, 4) NOT NULL DEFAULT 0,
        [ScrappedQuantity] decimal(18, 4) NOT NULL DEFAULT 0,
        [Status] nvarchar(50) NOT NULL DEFAULT 'Draft',
        [StartDate] datetime2 NOT NULL,
        [DueDate] datetime2 NOT NULL,
        [QualityInspectionPassed] bit NOT NULL DEFAULT 0,
        [QualityNotes] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0
    );
    CREATE INDEX [IX_WorkOrders_TenantId] ON [dbo].[WorkOrders]([TenantId]);
    CREATE INDEX [IX_WorkOrders_WorkOrderNumber] ON [dbo].[WorkOrders]([WorkOrderNumber]);
END;

IF OBJECT_ID(N'[dbo].[WorkOrderOperations]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[WorkOrderOperations] (
        [Id] uniqueidentifier NOT NULL PRIMARY KEY,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(100) NULL,
        [WorkOrderId] uniqueidentifier NOT NULL,
        [Sequence] int NOT NULL DEFAULT 10,
        [OperationName] nvarchar(200) NOT NULL,
        [WorkstationName] nvarchar(200) NOT NULL,
        [Status] nvarchar(50) NOT NULL DEFAULT 'Pending',
        [PlannedHours] decimal(18, 2) NOT NULL DEFAULT 1,
        [ActualHours] decimal(18, 2) NOT NULL DEFAULT 0,
        [OperatorName] nvarchar(200) NULL,
        [CompletedAt] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        CONSTRAINT [FK_WorkOrderOperations_WorkOrders] FOREIGN KEY ([WorkOrderId]) REFERENCES [dbo].[WorkOrders]([Id]) ON DELETE CASCADE
    );
    CREATE INDEX [IX_WorkOrderOperations_WorkOrderId] ON [dbo].[WorkOrderOperations]([WorkOrderId]);
    CREATE INDEX [IX_WorkOrderOperations_TenantId] ON [dbo].[WorkOrderOperations]([TenantId]);
END;

IF OBJECT_ID(N'[dbo].[BillsOfMaterial]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[BillsOfMaterial] (
        [Id] uniqueidentifier NOT NULL PRIMARY KEY,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(100) NULL,
        [ParentItemId] uniqueidentifier NOT NULL,
        [BomCode] nvarchar(100) NOT NULL,
        [BomName] nvarchar(200) NOT NULL,
        [Revision] nvarchar(50) NOT NULL DEFAULT '1.0',
        [IsActive] bit NOT NULL DEFAULT 1,
        [CreatedAt] datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0
    );
    CREATE INDEX [IX_BillsOfMaterial_TenantId] ON [dbo].[BillsOfMaterial]([TenantId]);
    CREATE INDEX [IX_BillsOfMaterial_ParentItemId] ON [dbo].[BillsOfMaterial]([ParentItemId]);
END;

IF OBJECT_ID(N'[dbo].[BomItems]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[BomItems] (
        [Id] uniqueidentifier NOT NULL PRIMARY KEY,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(100) NULL,
        [BomId] uniqueidentifier NOT NULL,
        [ComponentItemId] uniqueidentifier NOT NULL,
        [Quantity] decimal(18, 4) NOT NULL DEFAULT 1,
        [UnitOfMeasure] nvarchar(50) NOT NULL DEFAULT 'Nos',
        [ScrapFactor] decimal(18, 4) NOT NULL DEFAULT 0,
        [CreatedAt] datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        CONSTRAINT [FK_BomItems_BillsOfMaterial] FOREIGN KEY ([BomId]) REFERENCES [dbo].[BillsOfMaterial]([Id]) ON DELETE CASCADE
    );
    CREATE INDEX [IX_BomItems_BomId] ON [dbo].[BomItems]([BomId]);
    CREATE INDEX [IX_BomItems_TenantId] ON [dbo].[BomItems]([TenantId]);
END;

IF OBJECT_ID(N'[dbo].[FleetVehicles]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[FleetVehicles] (
        [Id] uniqueidentifier NOT NULL PRIMARY KEY,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(100) NULL,
        [VehicleNumber] nvarchar(100) NOT NULL,
        [Make] nvarchar(100) NOT NULL,
        [Model] nvarchar(100) NOT NULL,
        [Year] int NOT NULL DEFAULT 2026,
        [Vin] nvarchar(100) NULL,
        [AssetId] uniqueidentifier NULL,
        [Status] nvarchar(50) NOT NULL DEFAULT 'Active',
        [FuelType] nvarchar(50) NOT NULL DEFAULT 'Diesel',
        [CurrentOdometer] decimal(18, 2) NOT NULL DEFAULT 0,
        [AssignedDriverId] uniqueidentifier NULL,
        [AssignedDriverName] nvarchar(200) NULL,
        [InsuranceExpiryDate] datetime2 NULL,
        [NextServiceDate] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0
    );
    CREATE INDEX [IX_FleetVehicles_TenantId] ON [dbo].[FleetVehicles]([TenantId]);
    CREATE INDEX [IX_FleetVehicles_VehicleNumber] ON [dbo].[FleetVehicles]([VehicleNumber]);
END;

IF OBJECT_ID(N'[dbo].[FleetMaintenances]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[FleetMaintenances] (
        [Id] uniqueidentifier NOT NULL PRIMARY KEY,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(100) NULL,
        [VehicleId] uniqueidentifier NOT NULL,
        [ServiceDate] datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [ServiceType] nvarchar(100) NOT NULL DEFAULT 'Routine',
        [Odometer] decimal(18, 2) NOT NULL DEFAULT 0,
        [Cost] decimal(18, 2) NOT NULL DEFAULT 0,
        [VendorName] nvarchar(200) NULL,
        [Notes] nvarchar(max) NULL,
        [Status] nvarchar(50) NOT NULL DEFAULT 'Completed',
        [CreatedAt] datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        CONSTRAINT [FK_FleetMaintenances_FleetVehicles] FOREIGN KEY ([VehicleId]) REFERENCES [dbo].[FleetVehicles]([Id]) ON DELETE CASCADE
    );
    CREATE INDEX [IX_FleetMaintenances_VehicleId] ON [dbo].[FleetMaintenances]([VehicleId]);
    CREATE INDEX [IX_FleetMaintenances_TenantId] ON [dbo].[FleetMaintenances]([TenantId]);
END;

IF OBJECT_ID(N'[dbo].[FleetFuelLogs]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[FleetFuelLogs] (
        [Id] uniqueidentifier NOT NULL PRIMARY KEY,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(100) NULL,
        [VehicleId] uniqueidentifier NOT NULL,
        [LogDate] datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [Odometer] decimal(18, 2) NOT NULL DEFAULT 0,
        [Liters] decimal(18, 2) NOT NULL DEFAULT 0,
        [TotalCost] decimal(18, 2) NOT NULL DEFAULT 0,
        [FuelStation] nvarchar(200) NULL,
        [ReceiptNumber] nvarchar(100) NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        CONSTRAINT [FK_FleetFuelLogs_FleetVehicles] FOREIGN KEY ([VehicleId]) REFERENCES [dbo].[FleetVehicles]([Id]) ON DELETE CASCADE
    );
    CREATE INDEX [IX_FleetFuelLogs_VehicleId] ON [dbo].[FleetFuelLogs]([VehicleId]);
    CREATE INDEX [IX_FleetFuelLogs_TenantId] ON [dbo].[FleetFuelLogs]([TenantId]);
END;
";
        try
        {
            await db.Database.ExecuteSqlRawAsync(sql, cancellationToken);
            logger?.LogInformation("Ensured physical database tables for WorkOrders, WorkOrderOperations, BillsOfMaterial, BomItems, FleetVehicles, FleetMaintenances, and FleetFuelLogs.");
        }
        catch (System.Exception ex)
        {
            logger?.LogWarning(ex, "Could not ensure Manufacturing and Fleet tables (may already exist).");
        }
    }

    private static async Task EnsureFieldServiceWmsAndBudgetingTablesAsync(
        ApplicationDbContext db,
        ILogger? logger,
        CancellationToken cancellationToken)
    {
        const string sql = @"
IF OBJECT_ID(N'[dbo].[FieldServiceTickets]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[FieldServiceTickets] (
        [Id] uniqueidentifier NOT NULL PRIMARY KEY,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(100) NULL,
        [TicketNumber] nvarchar(100) NOT NULL,
        [CustomerId] uniqueidentifier NULL,
        [CustomerName] nvarchar(200) NOT NULL,
        [ServiceAddress] nvarchar(500) NOT NULL,
        [Priority] nvarchar(50) NOT NULL DEFAULT 'High',
        [Status] nvarchar(50) NOT NULL DEFAULT 'Dispatched',
        [ScheduledDate] datetime2 NOT NULL,
        [AssignedTechnicianName] nvarchar(200) NOT NULL,
        [AssignedTechnicianPhone] nvarchar(50) NOT NULL,
        [IssueDescription] nvarchar(max) NOT NULL,
        [ResolutionNotes] nvarchar(max) NULL,
        [CustomerSignatureName] nvarchar(200) NULL,
        [CompletedAt] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0
    );
    CREATE INDEX [IX_FieldServiceTickets_TenantId] ON [dbo].[FieldServiceTickets]([TenantId]);
    CREATE INDEX [IX_FieldServiceTickets_TicketNumber] ON [dbo].[FieldServiceTickets]([TicketNumber]);
END;

IF OBJECT_ID(N'[dbo].[FieldServiceTechnicians]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[FieldServiceTechnicians] (
        [Id] uniqueidentifier NOT NULL PRIMARY KEY,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(100) NULL,
        [Name] nvarchar(200) NOT NULL,
        [Phone] nvarchar(50) NOT NULL,
        [Email] nvarchar(200) NOT NULL,
        [Specialty] nvarchar(200) NOT NULL DEFAULT 'General Systems',
        [IsAvailable] bit NOT NULL DEFAULT 1,
        [CurrentLatitude] decimal(10, 7) NULL,
        [CurrentLongitude] decimal(10, 7) NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0
    );
    CREATE INDEX [IX_FieldServiceTechnicians_TenantId] ON [dbo].[FieldServiceTechnicians]([TenantId]);
END;

IF OBJECT_ID(N'[dbo].[WarehouseBins]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[WarehouseBins] (
        [Id] uniqueidentifier NOT NULL PRIMARY KEY,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(100) NULL,
        [WarehouseId] uniqueidentifier NOT NULL,
        [BinCode] nvarchar(100) NOT NULL,
        [ZoneCode] nvarchar(50) NOT NULL DEFAULT 'Zone-A',
        [AisleNumber] nvarchar(50) NOT NULL DEFAULT 'Aisle-01',
        [RackNumber] nvarchar(50) NOT NULL DEFAULT 'Rack-01',
        [ShelfLevel] nvarchar(50) NOT NULL DEFAULT 'Level-1',
        [MaxWeightCapacityKg] decimal(18, 2) NOT NULL DEFAULT 1000,
        [CurrentWeightKg] decimal(18, 2) NOT NULL DEFAULT 0,
        [MaxVolumeCapacityCbm] decimal(18, 2) NOT NULL DEFAULT 5,
        [CurrentVolumeCbm] decimal(18, 2) NOT NULL DEFAULT 0,
        [Status] nvarchar(50) NOT NULL DEFAULT 'Available',
        [CreatedAt] datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0
    );
    CREATE INDEX [IX_WarehouseBins_TenantId] ON [dbo].[WarehouseBins]([TenantId]);
    CREATE INDEX [IX_WarehouseBins_WarehouseId] ON [dbo].[WarehouseBins]([WarehouseId]);
    CREATE INDEX [IX_WarehouseBins_BinCode] ON [dbo].[WarehouseBins]([BinCode]);
END;

IF OBJECT_ID(N'[dbo].[CostCenterBudgets]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[CostCenterBudgets] (
        [Id] uniqueidentifier NOT NULL PRIMARY KEY,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(100) NULL,
        [CostCenterId] uniqueidentifier NOT NULL,
        [FiscalYear] int NOT NULL DEFAULT 2026,
        [AllocatedBudget] decimal(18, 2) NOT NULL DEFAULT 0,
        [ActualSpent] decimal(18, 2) NOT NULL DEFAULT 0,
        [CommittedAmount] decimal(18, 2) NOT NULL DEFAULT 0,
        [Notes] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0
    );
    CREATE INDEX [IX_CostCenterBudgets_TenantId] ON [dbo].[CostCenterBudgets]([TenantId]);
    CREATE INDEX [IX_CostCenterBudgets_CostCenterId] ON [dbo].[CostCenterBudgets]([CostCenterId]);
END;

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Employees' AND COLUMN_NAME = 'Phone' AND CHARACTER_MAXIMUM_LENGTH < 256)
BEGIN
    ALTER TABLE [dbo].[Employees] ALTER COLUMN [Phone] NVARCHAR(256) NULL;
END;
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Employees' AND COLUMN_NAME = 'AlternatePhone' AND CHARACTER_MAXIMUM_LENGTH < 256)
BEGIN
    ALTER TABLE [dbo].[Employees] ALTER COLUMN [AlternatePhone] NVARCHAR(256) NULL;
END;
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Employees' AND COLUMN_NAME = 'Pan' AND CHARACTER_MAXIMUM_LENGTH < 256)
BEGIN
    ALTER TABLE [dbo].[Employees] ALTER COLUMN [Pan] NVARCHAR(256) NULL;
END;
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Employees' AND COLUMN_NAME = 'Aadhaar' AND CHARACTER_MAXIMUM_LENGTH < 256)
BEGIN
    ALTER TABLE [dbo].[Employees] ALTER COLUMN [Aadhaar] NVARCHAR(256) NULL;
END;
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Employees' AND COLUMN_NAME = 'BankAccountNumber' AND CHARACTER_MAXIMUM_LENGTH < 256)
BEGIN
    ALTER TABLE [dbo].[Employees] ALTER COLUMN [BankAccountNumber] NVARCHAR(256) NULL;
END;
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Employees' AND COLUMN_NAME = 'BankIfsc' AND CHARACTER_MAXIMUM_LENGTH < 256)
BEGIN
    ALTER TABLE [dbo].[Employees] ALTER COLUMN [BankIfsc] NVARCHAR(256) NULL;
END;

-- ── Geography & Business Hierarchy & Posting Tables ──
IF OBJECT_ID(N'[dbo].[GeoCountries]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[GeoCountries] (
        [Id] uniqueidentifier NOT NULL PRIMARY KEY,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(100) NULL,
        [Code] nvarchar(10) NOT NULL,
        [Iso2Code] nvarchar(10) NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [CurrencyCode] nvarchar(10) NOT NULL,
        [PhoneCode] nvarchar(10) NOT NULL,
        [IsActive] bit NOT NULL DEFAULT 1,
        [CreatedAt] datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0
    );
END;

IF OBJECT_ID(N'[dbo].[GeoStates]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[GeoStates] (
        [Id] uniqueidentifier NOT NULL PRIMARY KEY,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(100) NULL,
        [CountryId] uniqueidentifier NOT NULL,
        [StateCode] nvarchar(50) NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [CapitalCity] nvarchar(200) NULL,
        [IsActive] bit NOT NULL DEFAULT 1,
        [CreatedAt] datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0
    );
    CREATE INDEX [IX_GeoStates_CountryId] ON [dbo].[GeoStates]([CountryId]);
END;

IF OBJECT_ID(N'[dbo].[GeoDistricts]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[GeoDistricts] (
        [Id] uniqueidentifier NOT NULL PRIMARY KEY,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(100) NULL,
        [StateId] uniqueidentifier NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [DistrictCode] nvarchar(50) NULL,
        [IsActive] bit NOT NULL DEFAULT 1,
        [CreatedAt] datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0
    );
    CREATE INDEX [IX_GeoDistricts_StateId] ON [dbo].[GeoDistricts]([StateId]);
END;

IF OBJECT_ID(N'[dbo].[GeoCities]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[GeoCities] (
        [Id] uniqueidentifier NOT NULL PRIMARY KEY,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(100) NULL,
        [DistrictId] uniqueidentifier NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [PostalCode] nvarchar(50) NULL,
        [IsActive] bit NOT NULL DEFAULT 1,
        [CreatedAt] datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0
    );
    CREATE INDEX [IX_GeoCities_DistrictId] ON [dbo].[GeoCities]([DistrictId]);
END;

IF OBJECT_ID(N'[dbo].[BusinessZones]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[BusinessZones] (
        [Id] uniqueidentifier NOT NULL PRIMARY KEY,
        [TenantId] uniqueidentifier NOT NULL,
        [CompanyId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(100) NULL,
        [Code] nvarchar(64) NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [Description] nvarchar(max) NULL,
        [IsActive] bit NOT NULL DEFAULT 1,
        [HeadEmployeeId] uniqueidentifier NULL,
        [HeadEmployeeName] nvarchar(200) NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0
    );
    CREATE INDEX [IX_BusinessZones_TenantId_CompanyId] ON [dbo].[BusinessZones]([TenantId], [CompanyId]);
END;

IF OBJECT_ID(N'[dbo].[BusinessRegions]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[BusinessRegions] (
        [Id] uniqueidentifier NOT NULL PRIMARY KEY,
        [TenantId] uniqueidentifier NOT NULL,
        [CompanyId] uniqueidentifier NOT NULL,
        [ZoneId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(100) NULL,
        [Code] nvarchar(64) NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [Description] nvarchar(max) NULL,
        [IsActive] bit NOT NULL DEFAULT 1,
        [HeadEmployeeId] uniqueidentifier NULL,
        [HeadEmployeeName] nvarchar(200) NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0
    );
    CREATE INDEX [IX_BusinessRegions_ZoneId] ON [dbo].[BusinessRegions]([ZoneId]);
END;

IF OBJECT_ID(N'[dbo].[BusinessClusters]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[BusinessClusters] (
        [Id] uniqueidentifier NOT NULL PRIMARY KEY,
        [TenantId] uniqueidentifier NOT NULL,
        [CompanyId] uniqueidentifier NOT NULL,
        [RegionId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(100) NULL,
        [Code] nvarchar(64) NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [Description] nvarchar(max) NULL,
        [IsActive] bit NOT NULL DEFAULT 1,
        [HeadEmployeeId] uniqueidentifier NULL,
        [HeadEmployeeName] nvarchar(200) NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0
    );
    CREATE INDEX [IX_BusinessClusters_RegionId] ON [dbo].[BusinessClusters]([RegionId]);
END;

IF OBJECT_ID(N'[dbo].[OperationalLocations]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[OperationalLocations] (
        [Id] uniqueidentifier NOT NULL PRIMARY KEY,
        [TenantId] uniqueidentifier NOT NULL,
        [CompanyId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(100) NULL,
        [Code] nvarchar(64) NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [Description] nvarchar(max) NULL,
        [IsActive] bit NOT NULL DEFAULT 1,
        [Type] int NOT NULL DEFAULT 2,
        [DistrictId] uniqueidentifier NULL,
        [CityId] uniqueidentifier NULL,
        [Address] nvarchar(max) NULL,
        [PostalCode] nvarchar(50) NULL,
        [Latitude] float NOT NULL DEFAULT 0,
        [Longitude] float NOT NULL DEFAULT 0,
        [GeofenceRadiusMeters] int NOT NULL DEFAULT 150,
        [BusinessClusterId] uniqueidentifier NULL,
        [ContactPersonName] nvarchar(200) NULL,
        [ContactPhone] nvarchar(100) NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0
    );
    CREATE INDEX [IX_OperationalLocations_TenantId_CompanyId] ON [dbo].[OperationalLocations]([TenantId], [CompanyId]);
END;

IF OBJECT_ID(N'[dbo].[PostingUnits]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[PostingUnits] (
        [Id] uniqueidentifier NOT NULL PRIMARY KEY,
        [TenantId] uniqueidentifier NOT NULL,
        [CompanyId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(100) NULL,
        [Code] nvarchar(64) NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [Description] nvarchar(max) NULL,
        [IsActive] bit NOT NULL DEFAULT 1,
        [TargetType] int NOT NULL DEFAULT 1,
        [ParentLocationId] uniqueidentifier NULL,
        [VehicleRegistrationNumber] nvarchar(100) NULL,
        [ImeiOrGpsDeviceId] nvarchar(100) NULL,
        [ChasisOrAssetNumber] nvarchar(100) NULL,
        [OperationalRoute] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0
    );
    CREATE INDEX [IX_PostingUnits_ParentLocationId] ON [dbo].[PostingUnits]([ParentLocationId]);
END;

IF OBJECT_ID(N'[dbo].[EmployeePostingAssignments]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[EmployeePostingAssignments] (
        [Id] uniqueidentifier NOT NULL PRIMARY KEY,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(100) NULL,
        [EmployeeId] uniqueidentifier NOT NULL,
        [ProjectId] uniqueidentifier NULL,
        [BusinessClusterId] uniqueidentifier NULL,
        [OperationalLocationId] uniqueidentifier NULL,
        [PostingUnitId] uniqueidentifier NULL,
        [StateId] uniqueidentifier NULL,
        [DistrictId] uniqueidentifier NULL,
        [EffectiveFrom] datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [EffectiveTo] datetime2 NULL,
        [IsPrimary] bit NOT NULL DEFAULT 1,
        [AssignmentType] nvarchar(100) NOT NULL DEFAULT 'Permanent',
        [Status] nvarchar(50) NOT NULL DEFAULT 'Active',
        [Remarks] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0
    );
    CREATE INDEX [IX_EmployeePostingAssignments_EmployeeId] ON [dbo].[EmployeePostingAssignments]([EmployeeId]);
    CREATE INDEX [IX_EmployeePostingAssignments_PostingUnitId] ON [dbo].[EmployeePostingAssignments]([PostingUnitId]);
END;

IF OBJECT_ID(N'[dbo].[UserPermissions]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[UserPermissions] (
        [Id] uniqueidentifier NOT NULL PRIMARY KEY,
        [TenantId] uniqueidentifier NOT NULL,
        [CompanyId] uniqueidentifier NULL,
        [BusinessId] nvarchar(100) NULL,
        [UserId] uniqueidentifier NOT NULL,
        [Module] nvarchar(100) NOT NULL,
        [PageKey] nvarchar(100) NOT NULL,
        [Action] nvarchar(100) NOT NULL,
        [IsGranted] bit NOT NULL DEFAULT 1,
        [CreatedAt] datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0
    );
    CREATE INDEX [IX_UserPermissions_Tenant_User] ON [dbo].[UserPermissions]([TenantId], [UserId]);
    CREATE INDEX [IX_UserPermissions_Module_Page] ON [dbo].[UserPermissions]([Module], [PageKey], [Action]);
END;

-- Employees geofencing fields
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Employees' AND COLUMN_NAME = 'ValidateGeofenceOnAttendance')
BEGIN
    ALTER TABLE [dbo].[Employees] ADD [ValidateGeofenceOnAttendance] bit NOT NULL DEFAULT 1;
END;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Employees' AND COLUMN_NAME = 'AllowAnyLocationCheckIn')
BEGIN
    ALTER TABLE [dbo].[Employees] ADD [AllowAnyLocationCheckIn] bit NOT NULL DEFAULT 0;
END;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Employees' AND COLUMN_NAME = 'BaseOperationalLocationId')
BEGIN
    ALTER TABLE [dbo].[Employees] ADD [BaseOperationalLocationId] uniqueidentifier NULL;
END;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Employees' AND COLUMN_NAME = 'BaseLocationLatitude')
BEGIN
    ALTER TABLE [dbo].[Employees] ADD [BaseLocationLatitude] float NULL;
END;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Employees' AND COLUMN_NAME = 'BaseLocationLongitude')
BEGIN
    ALTER TABLE [dbo].[Employees] ADD [BaseLocationLongitude] float NULL;
END;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Employees' AND COLUMN_NAME = 'BaseLocationRadiusMeters')
BEGIN
    ALTER TABLE [dbo].[Employees] ADD [BaseLocationRadiusMeters] int NULL DEFAULT 150;
END;

-- AttendanceRecords geofencing fields
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'AttendanceRecords' AND COLUMN_NAME = 'DistanceFromLocationMeters')
BEGIN
    ALTER TABLE [dbo].[AttendanceRecords] ADD [DistanceFromLocationMeters] float NULL;
END;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'AttendanceRecords' AND COLUMN_NAME = 'MatchedLocationId')
BEGIN
    ALTER TABLE [dbo].[AttendanceRecords] ADD [MatchedLocationId] uniqueidentifier NULL;
END;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'AttendanceRecords' AND COLUMN_NAME = 'MatchedLocationName')
BEGIN
    ALTER TABLE [dbo].[AttendanceRecords] ADD [MatchedLocationName] nvarchar(200) NULL;
END;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'AttendanceRecords' AND COLUMN_NAME = 'IsGeofenceBreached')
BEGIN
    ALTER TABLE [dbo].[AttendanceRecords] ADD [IsGeofenceBreached] bit NOT NULL DEFAULT 0;
END;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'AttendanceRecords' AND COLUMN_NAME = 'GeofenceValidationMessage')
BEGIN
    ALTER TABLE [dbo].[AttendanceRecords] ADD [GeofenceValidationMessage] nvarchar(max) NULL;
END;

-- AttendancePolicies multi-punch & shift enforcement fields
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'AttendancePolicies' AND COLUMN_NAME = 'PunchMode')
BEGIN
    ALTER TABLE [dbo].[AttendancePolicies] ADD [PunchMode] int NOT NULL DEFAULT 1;
END;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'AttendancePolicies' AND COLUMN_NAME = 'MinPunchesRequiredPerDay')
BEGIN
    ALTER TABLE [dbo].[AttendancePolicies] ADD [MinPunchesRequiredPerDay] int NOT NULL DEFAULT 2;
END;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'AttendancePolicies' AND COLUMN_NAME = 'MaxPunchesAllowedPerDay')
BEGIN
    ALTER TABLE [dbo].[AttendancePolicies] ADD [MaxPunchesAllowedPerDay] int NULL;
END;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'AttendancePolicies' AND COLUMN_NAME = 'EarlyExitToleranceMinutes')
BEGIN
    ALTER TABLE [dbo].[AttendancePolicies] ADD [EarlyExitToleranceMinutes] int NOT NULL DEFAULT 15;
END;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'AttendancePolicies' AND COLUMN_NAME = 'MissingPunchPenalty')
BEGIN
    ALTER TABLE [dbo].[AttendancePolicies] ADD [MissingPunchPenalty] nvarchar(50) NOT NULL DEFAULT 'FlagForRegularization';
END;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'AttendancePolicies' AND COLUMN_NAME = 'DefaultShiftId')
BEGIN
    ALTER TABLE [dbo].[AttendancePolicies] ADD [DefaultShiftId] uniqueidentifier NULL;
END;

-- Shifts split-shift and overnight fields
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Shifts' AND COLUMN_NAME = 'AllowOvernightCrossMidnight')
BEGIN
    ALTER TABLE [dbo].[Shifts] ADD [AllowOvernightCrossMidnight] bit NOT NULL DEFAULT 0;
END;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Shifts' AND COLUMN_NAME = 'EarlyExitToleranceMinutes')
BEGIN
    ALTER TABLE [dbo].[Shifts] ADD [EarlyExitToleranceMinutes] int NOT NULL DEFAULT 15;
END;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Shifts' AND COLUMN_NAME = 'SplitSlot1StartTime')
BEGIN
    ALTER TABLE [dbo].[Shifts] ADD [SplitSlot1StartTime] time NULL;
END;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Shifts' AND COLUMN_NAME = 'SplitSlot1EndTime')
BEGIN
    ALTER TABLE [dbo].[Shifts] ADD [SplitSlot1EndTime] time NULL;
END;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Shifts' AND COLUMN_NAME = 'SplitSlot2StartTime')
BEGIN
    ALTER TABLE [dbo].[Shifts] ADD [SplitSlot2StartTime] time NULL;
END;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Shifts' AND COLUMN_NAME = 'SplitSlot2EndTime')
BEGIN
    ALTER TABLE [dbo].[Shifts] ADD [SplitSlot2EndTime] time NULL;
END;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Shifts' AND COLUMN_NAME = 'IsFlexiShift')
BEGIN
    ALTER TABLE [dbo].[Shifts] ADD [IsFlexiShift] bit NOT NULL DEFAULT 0;
    ALTER TABLE [dbo].[Shifts] ADD [CoreStartTime] time NULL;
    ALTER TABLE [dbo].[Shifts] ADD [CoreEndTime] time NULL;
    ALTER TABLE [dbo].[Shifts] ADD [FlexiWindowStart] time NULL;
    ALTER TABLE [dbo].[Shifts] ADD [FlexiWindowEnd] time NULL;
    ALTER TABLE [dbo].[Shifts] ADD [Is24HourShift] bit NOT NULL DEFAULT 0;
    ALTER TABLE [dbo].[Shifts] ADD [MandatoryRestHoursAfterShift] int NULL DEFAULT 24;
    ALTER TABLE [dbo].[Shifts] ADD [IsOnCallStandby] bit NOT NULL DEFAULT 0;
    ALTER TABLE [dbo].[Shifts] ADD [StandbyRateMultiplier] decimal(5,2) NOT NULL DEFAULT 1.0;
    ALTER TABLE [dbo].[Shifts] ADD [CountryId] uniqueidentifier NULL;
    ALTER TABLE [dbo].[Shifts] ADD [CompanyId] uniqueidentifier NULL;
    ALTER TABLE [dbo].[Shifts] ADD [ProjectId] uniqueidentifier NULL;
    ALTER TABLE [dbo].[Shifts] ADD [OperationalLocationId] uniqueidentifier NULL;
END;

-- AttendancePolicies Penalty Slabs, Overtime, and Deduction Basis
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'AttendancePolicies' AND COLUMN_NAME = 'DeductionBasis')
BEGIN
    ALTER TABLE [dbo].[AttendancePolicies] ADD [DeductionBasis] int NOT NULL DEFAULT 2;
    ALTER TABLE [dbo].[AttendancePolicies] ADD [AllowDailyShortfallOffsetWithOt] bit NOT NULL DEFAULT 0;
    ALTER TABLE [dbo].[AttendancePolicies] ADD [MonthlyFreeLateDays] int NOT NULL DEFAULT 3;
    ALTER TABLE [dbo].[AttendancePolicies] ADD [LatePenaltyStepFrequency] int NOT NULL DEFAULT 3;
    ALTER TABLE [dbo].[AttendancePolicies] ADD [LatePenaltyAction] nvarchar(50) NOT NULL DEFAULT 'HalfDayLop';
    ALTER TABLE [dbo].[AttendancePolicies] ADD [MinorLateWindowMinutes] int NOT NULL DEFAULT 45;
    ALTER TABLE [dbo].[AttendancePolicies] ADD [MajorLateThresholdMinutes] int NOT NULL DEFAULT 120;
    ALTER TABLE [dbo].[AttendancePolicies] ADD [EarlyExitThresholdMinutes] int NOT NULL DEFAULT 60;
    ALTER TABLE [dbo].[AttendancePolicies] ADD [EarlyExitPenaltyAction] nvarchar(50) NOT NULL DEFAULT 'HalfDay';
    ALTER TABLE [dbo].[AttendancePolicies] ADD [MinMinutesForOvertime] int NOT NULL DEFAULT 60;
    ALTER TABLE [dbo].[AttendancePolicies] ADD [RequireOvertimeApproval] bit NOT NULL DEFAULT 0;
    ALTER TABLE [dbo].[AttendancePolicies] ADD [NormalDayOtMultiplier] decimal(5,2) NOT NULL DEFAULT 1.5;
    ALTER TABLE [dbo].[AttendancePolicies] ADD [WeekendOtMultiplier] decimal(5,2) NOT NULL DEFAULT 2.0;
    ALTER TABLE [dbo].[AttendancePolicies] ADD [HolidayOtMultiplier] decimal(5,2) NOT NULL DEFAULT 2.5;
    ALTER TABLE [dbo].[AttendancePolicies] ADD [AllowCompOffInsteadOfPay] bit NOT NULL DEFAULT 1;
    ALTER TABLE [dbo].[AttendancePolicies] ADD [WeekOffPattern] nvarchar(50) NOT NULL DEFAULT 'SaturdaySunday';
END;

-- Employees biometric hardware & shift mapping fields
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Employees' AND COLUMN_NAME = 'BiometricEnrollmentId')
BEGIN
    ALTER TABLE [dbo].[Employees] ADD [BiometricEnrollmentId] nvarchar(100) NULL;
END;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Employees' AND COLUMN_NAME = 'BiometricCardNumber')
BEGIN
    ALTER TABLE [dbo].[Employees] ADD [BiometricCardNumber] nvarchar(100) NULL;
END;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Employees' AND COLUMN_NAME = 'AssignedShiftId')
BEGIN
    ALTER TABLE [dbo].[Employees] ADD [AssignedShiftId] uniqueidentifier NULL;
END;
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Employees' AND COLUMN_NAME = 'AttendancePolicyId')
BEGIN
    ALTER TABLE [dbo].[Employees] ADD [AttendancePolicyId] uniqueidentifier NULL;
END;

-- BiometricDevices table
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'BiometricDevices')
BEGIN
    CREATE TABLE [dbo].[BiometricDevices] (
        [Id] uniqueidentifier NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [TenantId] uniqueidentifier NOT NULL,
        [DeviceName] nvarchar(100) NOT NULL,
        [DeviceSerialNumber] nvarchar(100) NOT NULL,
        [DeviceBrand] nvarchar(50) NOT NULL DEFAULT 'ZKTeco',
        [ModelNumber] nvarchar(100) NULL,
        [IpAddress] nvarchar(50) NULL,
        [Port] int NOT NULL DEFAULT 4370,
        [OperationalLocationId] uniqueidentifier NULL,
        [DirectionMode] nvarchar(20) NOT NULL DEFAULT 'AUTO',
        [Status] nvarchar(50) NOT NULL DEFAULT 'Online',
        [LastHeartbeatAt] datetime2 NULL,
        [FirmwareVersion] nvarchar(50) NULL,
        [TotalPunchesLogged] int NOT NULL DEFAULT 0,
        [ApiSecretKey] nvarchar(200) NULL,
        [IsActive] bit NOT NULL DEFAULT 1,
        [CreatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0
    );
    CREATE INDEX [IX_BiometricDevices_Tenant_Serial] ON [dbo].[BiometricDevices]([TenantId], [DeviceSerialNumber]);
END;

-- AttendanceRegularizationRequests table
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'AttendanceRegularizationRequests')
BEGIN
    CREATE TABLE [dbo].[AttendanceRegularizationRequests] (
        [Id] uniqueidentifier NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [TenantId] uniqueidentifier NOT NULL,
        [EmployeeId] uniqueidentifier NOT NULL,
        [AttendanceDate] datetime2 NOT NULL,
        [RequestType] nvarchar(50) NOT NULL DEFAULT 'MissingPunch',
        [CorrectedInTime] time NULL,
        [CorrectedOutTime] time NULL,
        [Reason] nvarchar(500) NOT NULL,
        [Status] nvarchar(50) NOT NULL DEFAULT 'Pending',
        [ApprovedBy] uniqueidentifier NULL,
        [ApprovedAt] datetime2 NULL,
        [ReviewNotes] nvarchar(500) NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0
    );
    CREATE INDEX [IX_AttendanceReg_EmpDate] ON [dbo].[AttendanceRegularizationRequests]([TenantId], [EmployeeId], [AttendanceDate]);
END;
";
        try
        {
            await db.Database.ExecuteSqlRawAsync(sql, cancellationToken);
            logger?.LogInformation("Ensured physical database tables and columns for Multi-Punch, Shifts, Biometrics, and BiometricDevices.");
        }
        catch (System.Exception ex)
        {
            logger?.LogWarning(ex, "Could not ensure Field Service, WMS, and Budgeting tables (may already exist).");
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
