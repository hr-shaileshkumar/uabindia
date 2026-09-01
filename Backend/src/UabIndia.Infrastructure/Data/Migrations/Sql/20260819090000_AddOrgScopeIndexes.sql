IF OBJECT_ID(N'dbo.SalesInvoices', N'U') IS NOT NULL AND COL_LENGTH('dbo.SalesInvoices', 'CompanyId') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_SalesInvoices_Tenant_Company_Date' AND object_id = OBJECT_ID(N'dbo.SalesInvoices'))
    CREATE NONCLUSTERED INDEX [IX_SalesInvoices_Tenant_Company_Date] ON dbo.SalesInvoices ([TenantId], [CompanyId], [InvoiceDate] DESC) WHERE [IsDeleted] = 0;
GO

IF OBJECT_ID(N'dbo.SalesOrders', N'U') IS NOT NULL AND COL_LENGTH('dbo.SalesOrders', 'CompanyId') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_SalesOrders_Tenant_Company_Date' AND object_id = OBJECT_ID(N'dbo.SalesOrders'))
    CREATE NONCLUSTERED INDEX [IX_SalesOrders_Tenant_Company_Date] ON dbo.SalesOrders ([TenantId], [CompanyId], [SODate] DESC) WHERE [IsDeleted] = 0;
GO

IF OBJECT_ID(N'dbo.SalesQuotations', N'U') IS NOT NULL AND COL_LENGTH('dbo.SalesQuotations', 'CompanyId') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_SalesQuotations_Tenant_Company_Date' AND object_id = OBJECT_ID(N'dbo.SalesQuotations'))
    CREATE NONCLUSTERED INDEX [IX_SalesQuotations_Tenant_Company_Date] ON dbo.SalesQuotations ([TenantId], [CompanyId], [QuotationDate] DESC) WHERE [IsDeleted] = 0;
GO

IF OBJECT_ID(N'dbo.PurchaseOrders', N'U') IS NOT NULL AND COL_LENGTH('dbo.PurchaseOrders', 'CompanyId') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PurchaseOrders_Tenant_Company_Date' AND object_id = OBJECT_ID(N'dbo.PurchaseOrders'))
    CREATE NONCLUSTERED INDEX [IX_PurchaseOrders_Tenant_Company_Date] ON dbo.PurchaseOrders ([TenantId], [CompanyId], [PODate] DESC) WHERE [IsDeleted] = 0;
GO

IF OBJECT_ID(N'dbo.PurchaseInvoices', N'U') IS NOT NULL AND COL_LENGTH('dbo.PurchaseInvoices', 'CompanyId') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PurchaseInvoices_Tenant_Company_Date' AND object_id = OBJECT_ID(N'dbo.PurchaseInvoices'))
    CREATE NONCLUSTERED INDEX [IX_PurchaseInvoices_Tenant_Company_Date] ON dbo.PurchaseInvoices ([TenantId], [CompanyId], [InvoiceDate] DESC) WHERE [IsDeleted] = 0;
GO

IF OBJECT_ID(N'dbo.Customers', N'U') IS NOT NULL AND COL_LENGTH('dbo.Customers', 'CompanyId') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Customers_Tenant_Company' AND object_id = OBJECT_ID(N'dbo.Customers'))
    CREATE NONCLUSTERED INDEX [IX_Customers_Tenant_Company] ON dbo.Customers ([TenantId], [CompanyId]) WHERE [IsDeleted] = 0;
GO

IF OBJECT_ID(N'dbo.Vendors', N'U') IS NOT NULL AND COL_LENGTH('dbo.Vendors', 'CompanyId') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Vendors_Tenant_Company' AND object_id = OBJECT_ID(N'dbo.Vendors'))
    CREATE NONCLUSTERED INDEX [IX_Vendors_Tenant_Company] ON dbo.Vendors ([TenantId], [CompanyId]) WHERE [IsDeleted] = 0;
GO

IF OBJECT_ID(N'dbo.Items', N'U') IS NOT NULL AND COL_LENGTH('dbo.Items', 'CompanyId') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Items_Tenant_Company' AND object_id = OBJECT_ID(N'dbo.Items'))
    CREATE NONCLUSTERED INDEX [IX_Items_Tenant_Company] ON dbo.Items ([TenantId], [CompanyId]) WHERE [IsDeleted] = 0;
GO

IF OBJECT_ID(N'dbo.JournalEntries', N'U') IS NOT NULL AND COL_LENGTH('dbo.JournalEntries', 'CompanyId') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_JournalEntries_Tenant_Company_Date' AND object_id = OBJECT_ID(N'dbo.JournalEntries'))
    CREATE NONCLUSTERED INDEX [IX_JournalEntries_Tenant_Company_Date] ON dbo.JournalEntries ([TenantId], [CompanyId], [EntryDate] DESC) WHERE [IsDeleted] = 0;
GO

IF OBJECT_ID(N'dbo.Payments', N'U') IS NOT NULL AND COL_LENGTH('dbo.Payments', 'CompanyId') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Payments_Tenant_Company_Date' AND object_id = OBJECT_ID(N'dbo.Payments'))
    CREATE NONCLUSTERED INDEX [IX_Payments_Tenant_Company_Date] ON dbo.Payments ([TenantId], [CompanyId], [PaymentDate] DESC) WHERE [IsDeleted] = 0;
GO

IF OBJECT_ID(N'dbo.Employees', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Employees_UserId' AND object_id = OBJECT_ID(N'dbo.Employees'))
    CREATE NONCLUSTERED INDEX [IX_Employees_UserId] ON dbo.Employees ([UserId]) WHERE [UserId] IS NOT NULL AND [IsDeleted] = 0;
GO
