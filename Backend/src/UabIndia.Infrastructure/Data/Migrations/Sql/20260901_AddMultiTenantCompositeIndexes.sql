-- 20260901_AddMultiTenantCompositeIndexes.sql
-- High performance composite indexes for high-frequency multi-tenant queries

-- 1. AuditLogs Composite Indexes
IF OBJECT_ID(N'dbo.AuditLogs', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_AuditLogs_Tenant_CreatedAt' AND object_id = OBJECT_ID(N'dbo.AuditLogs'))
    CREATE NONCLUSTERED INDEX [IX_AuditLogs_Tenant_CreatedAt] ON dbo.AuditLogs ([TenantId], [CreatedAt] DESC);
GO

IF OBJECT_ID(N'dbo.AuditLogs', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_AuditLogs_Tenant_Action_CreatedAt' AND object_id = OBJECT_ID(N'dbo.AuditLogs'))
    CREATE NONCLUSTERED INDEX [IX_AuditLogs_Tenant_Action_CreatedAt] ON dbo.AuditLogs ([TenantId], [Action], [CreatedAt] DESC);
GO

-- 2. SalesInvoices Status & Date Composite Index
IF OBJECT_ID(N'dbo.SalesInvoices', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_SalesInvoices_Tenant_Status_Date' AND object_id = OBJECT_ID(N'dbo.SalesInvoices'))
    CREATE NONCLUSTERED INDEX [IX_SalesInvoices_Tenant_Status_Date] ON dbo.SalesInvoices ([TenantId], [Status], [InvoiceDate] DESC) WHERE [IsDeleted] = 0;
GO

-- 3. StockMovements Item & Date Composite Index
IF OBJECT_ID(N'dbo.StockMovements', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_StockMovements_Tenant_Item_Date' AND object_id = OBJECT_ID(N'dbo.StockMovements'))
    CREATE NONCLUSTERED INDEX [IX_StockMovements_Tenant_Item_Date] ON dbo.StockMovements ([TenantId], [ItemId], [MovementDate] DESC) WHERE [IsDeleted] = 0;
GO

-- 4. AttendanceRecords Employee & Date Composite Index
IF OBJECT_ID(N'dbo.AttendanceRecords', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_AttendanceRecords_Tenant_Employee_Date' AND object_id = OBJECT_ID(N'dbo.AttendanceRecords'))
    CREATE NONCLUSTERED INDEX [IX_AttendanceRecords_Tenant_Employee_Date] ON dbo.AttendanceRecords ([TenantId], [EmployeeId], [Date] DESC) WHERE [IsDeleted] = 0;
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
