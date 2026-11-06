-- 20260901_AddMultiTenantCompositeIndexes.sql
-- High performance composite indexes for high-frequency multi-tenant queries

-- 1. AuditLogs Composite Indexes
IF OBJECT_ID(N'dbo.AuditLogs', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.AuditLogs', 'Hash') IS NULL
        ALTER TABLE dbo.AuditLogs ADD Hash NVARCHAR(128) NULL;
    IF COL_LENGTH('dbo.AuditLogs', 'PrevHash') IS NULL
        ALTER TABLE dbo.AuditLogs ADD PrevHash NVARCHAR(128) NULL;
    IF COL_LENGTH('dbo.AuditLogs', 'Action') = -1 OR COL_LENGTH('dbo.AuditLogs', 'Action') > 200
    BEGIN
        IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_AuditLogs_Tenant_Created' AND object_id = OBJECT_ID(N'dbo.AuditLogs'))
            DROP INDEX [IX_AuditLogs_Tenant_Created] ON dbo.AuditLogs;
        IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_AuditLogs_Tenant_Action_CreatedAt' AND object_id = OBJECT_ID(N'dbo.AuditLogs'))
            DROP INDEX [IX_AuditLogs_Tenant_Action_CreatedAt] ON dbo.AuditLogs;

        ALTER TABLE dbo.AuditLogs ALTER COLUMN [Action] NVARCHAR(100) NULL;
    END

    IF COL_LENGTH('dbo.AuditLogs', 'EntityName') = -1 OR COL_LENGTH('dbo.AuditLogs', 'EntityName') > 200
    BEGIN
        IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_AuditLogs_Tenant_Created' AND object_id = OBJECT_ID(N'dbo.AuditLogs'))
            DROP INDEX [IX_AuditLogs_Tenant_Created] ON dbo.AuditLogs;
        IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_AuditLogs_Tenant_Action_CreatedAt' AND object_id = OBJECT_ID(N'dbo.AuditLogs'))
            DROP INDEX [IX_AuditLogs_Tenant_Action_CreatedAt] ON dbo.AuditLogs;

        ALTER TABLE dbo.AuditLogs ALTER COLUMN [EntityName] NVARCHAR(100) NULL;
    END
END;
GO

IF OBJECT_ID(N'dbo.AuditLogs', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_AuditLogs_Tenant_Created' AND object_id = OBJECT_ID(N'dbo.AuditLogs'))
    CREATE NONCLUSTERED INDEX [IX_AuditLogs_Tenant_Created] ON dbo.AuditLogs ([TenantId], [CreatedAt] DESC) INCLUDE ([Action], [EntityName], [EntityId], [PerformedBy], [IsDeleted]);
GO

IF OBJECT_ID(N'dbo.AuditLogs', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_AuditLogs_Tenant_Action_CreatedAt' AND object_id = OBJECT_ID(N'dbo.AuditLogs'))
    CREATE NONCLUSTERED INDEX [IX_AuditLogs_Tenant_Action_CreatedAt] ON dbo.AuditLogs ([TenantId], [Action], [CreatedAt] DESC);
GO

-- 2. SalesInvoices Status & Date Composite Index
IF OBJECT_ID(N'dbo.SalesInvoices', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.SalesInvoices', 'Status') IS NOT NULL AND (COL_LENGTH('dbo.SalesInvoices', 'Status') = -1 OR COL_LENGTH('dbo.SalesInvoices', 'Status') > 100)
        ALTER TABLE dbo.SalesInvoices ALTER COLUMN [Status] NVARCHAR(50) NULL;
END;
GO

IF OBJECT_ID(N'dbo.SalesInvoices', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_SalesInvoices_Tenant_Status_Date' AND object_id = OBJECT_ID(N'dbo.SalesInvoices'))
    CREATE NONCLUSTERED INDEX [IX_SalesInvoices_Tenant_Status_Date] ON dbo.SalesInvoices ([TenantId], [Status], [InvoiceDate] DESC) WHERE [IsDeleted] = 0;
GO

-- 3. StockMovements Item & Date Composite Index
IF OBJECT_ID(N'dbo.StockMovements', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_StockMovements_Tenant_Item_Date' AND object_id = OBJECT_ID(N'dbo.StockMovements'))
    CREATE NONCLUSTERED INDEX [IX_StockMovements_Tenant_Item_Date] ON dbo.StockMovements ([TenantId], [ItemId], [MovementDate] DESC) WHERE [IsDeleted] = 0;
GO

-- 4. AttendanceRecords Employee & Timestamp Composite Index
IF OBJECT_ID(N'dbo.AttendanceRecords', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_AttendanceRecords_Tenant_Employee_Date' AND object_id = OBJECT_ID(N'dbo.AttendanceRecords'))
BEGIN
    IF COL_LENGTH('dbo.AttendanceRecords', 'Timestamp') IS NOT NULL
        CREATE NONCLUSTERED INDEX [IX_AttendanceRecords_Tenant_Employee_Date] ON dbo.AttendanceRecords ([TenantId], [EmployeeId], [Timestamp] DESC) WHERE [IsDeleted] = 0;
    ELSE IF COL_LENGTH('dbo.AttendanceRecords', 'Date') IS NOT NULL
        CREATE NONCLUSTERED INDEX [IX_AttendanceRecords_Tenant_Employee_Date] ON dbo.AttendanceRecords ([TenantId], [EmployeeId], [Date] DESC) WHERE [IsDeleted] = 0;
END;
GO

-- 5. BankTransactions BankAccount & Date Composite Index
IF OBJECT_ID(N'dbo.BankTransactions', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_BankTransactions_Tenant_Account_Date' AND object_id = OBJECT_ID(N'dbo.BankTransactions'))
    CREATE NONCLUSTERED INDEX [IX_BankTransactions_Tenant_Account_Date] ON dbo.BankTransactions ([TenantId], [BankAccountId], [TransactionDate] DESC) WHERE [IsDeleted] = 0;
GO

-- 6. Users EmailHash Blind-Index Lookups
IF OBJECT_ID(N'dbo.Users', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Users_Tenant_EmailHash' AND object_id = OBJECT_ID(N'dbo.Users'))
    CREATE NONCLUSTERED INDEX [IX_Users_Tenant_EmailHash] ON dbo.Users ([TenantId], [EmailHash]) WHERE [EmailHash] IS NOT NULL AND [IsDeleted] = 0;
GO
