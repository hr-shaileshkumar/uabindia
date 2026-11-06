-- Idempotent companion for saved custom reports and licensing invoices.

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'CustomReports')
BEGIN
    CREATE TABLE [CustomReports] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        [Name] nvarchar(256) NOT NULL,
        [ReportType] nvarchar(32) NOT NULL DEFAULT 'sales',
        [DateRange] nvarchar(32) NOT NULL DEFAULT 'last30days',
        [OutputFormat] nvarchar(16) NOT NULL DEFAULT 'pdf',
        [Schedule] nvarchar(32) NOT NULL DEFAULT 'Manual',
        [Status] nvarchar(32) NOT NULL DEFAULT 'Draft',
        [CreatedByName] nvarchar(256) NOT NULL DEFAULT '',
        [LastRunAt] datetime2 NULL,
        [LastRowCount] int NOT NULL DEFAULT 0,
        [LastRunSummary] nvarchar(max) NULL,
        CONSTRAINT [PK_CustomReports] PRIMARY KEY ([Id])
    );
    CREATE INDEX [IX_CustomReports_TenantId_Status]
        ON [CustomReports]([TenantId], [Status]);
END

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'LicenseInvoices')
BEGIN
    CREATE TABLE [LicenseInvoices] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        [InvoiceNumber] nvarchar(64) NOT NULL,
        [Period] nvarchar(16) NOT NULL,
        [Plan] nvarchar(64) NOT NULL DEFAULT 'Standard',
        [Amount] decimal(18,2) NOT NULL DEFAULT 0,
        [Status] nvarchar(32) NOT NULL DEFAULT 'Pending',
        [PaidDate] datetime2 NULL,
        [Remarks] nvarchar(max) NULL,
        CONSTRAINT [PK_LicenseInvoices] PRIMARY KEY ([Id])
    );
    CREATE UNIQUE INDEX [IX_LicenseInvoices_TenantId_InvoiceNumber]
        ON [LicenseInvoices]([TenantId], [InvoiceNumber])
        WHERE [IsDeleted] = 0;
    CREATE INDEX [IX_LicenseInvoices_TenantId_Status]
        ON [LicenseInvoices]([TenantId], [Status]);
END
