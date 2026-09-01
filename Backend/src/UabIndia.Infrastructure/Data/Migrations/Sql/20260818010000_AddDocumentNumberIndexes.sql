-- Unique document numbers per tenant.
-- SQL Server cannot index nvarchar(max) (error 1919). Shrink oversized columns first.

IF OBJECT_ID(N'dbo.ExpenseClaims', N'U') IS NOT NULL AND COL_LENGTH('dbo.ExpenseClaims', 'JournalEntryId') IS NULL
    ALTER TABLE dbo.ExpenseClaims ADD JournalEntryId UNIQUEIDENTIFIER NULL;
GO

-- COL_LENGTH returns -1 for nvarchar(max). Index keys must be <= 1700 bytes.
IF OBJECT_ID(N'dbo.SalesInvoices', N'U') IS NOT NULL
AND COL_LENGTH('dbo.SalesInvoices', 'InvoiceNumber') IS NOT NULL
AND (COL_LENGTH('dbo.SalesInvoices', 'InvoiceNumber') = -1 OR COL_LENGTH('dbo.SalesInvoices', 'InvoiceNumber') > 128)
BEGIN
    UPDATE dbo.SalesInvoices SET InvoiceNumber = LEFT(InvoiceNumber, 64) WHERE InvoiceNumber IS NOT NULL AND LEN(InvoiceNumber) > 64;
    ALTER TABLE dbo.SalesInvoices ALTER COLUMN InvoiceNumber NVARCHAR(64) NULL;
END
GO

IF OBJECT_ID(N'dbo.PurchaseInvoices', N'U') IS NOT NULL
AND COL_LENGTH('dbo.PurchaseInvoices', 'InvoiceNumber') IS NOT NULL
AND (COL_LENGTH('dbo.PurchaseInvoices', 'InvoiceNumber') = -1 OR COL_LENGTH('dbo.PurchaseInvoices', 'InvoiceNumber') > 128)
BEGIN
    UPDATE dbo.PurchaseInvoices SET InvoiceNumber = LEFT(InvoiceNumber, 64) WHERE InvoiceNumber IS NOT NULL AND LEN(InvoiceNumber) > 64;
    ALTER TABLE dbo.PurchaseInvoices ALTER COLUMN InvoiceNumber NVARCHAR(64) NULL;
END
GO

IF OBJECT_ID(N'dbo.PurchaseOrders', N'U') IS NOT NULL
AND COL_LENGTH('dbo.PurchaseOrders', 'PONumber') IS NOT NULL
AND (COL_LENGTH('dbo.PurchaseOrders', 'PONumber') = -1 OR COL_LENGTH('dbo.PurchaseOrders', 'PONumber') > 128)
BEGIN
    UPDATE dbo.PurchaseOrders SET PONumber = LEFT(PONumber, 64) WHERE PONumber IS NOT NULL AND LEN(PONumber) > 64;
    ALTER TABLE dbo.PurchaseOrders ALTER COLUMN PONumber NVARCHAR(64) NULL;
END
GO

IF OBJECT_ID(N'dbo.SalesOrders', N'U') IS NOT NULL
AND COL_LENGTH('dbo.SalesOrders', 'SONumber') IS NOT NULL
AND (COL_LENGTH('dbo.SalesOrders', 'SONumber') = -1 OR COL_LENGTH('dbo.SalesOrders', 'SONumber') > 128)
BEGIN
    UPDATE dbo.SalesOrders SET SONumber = LEFT(SONumber, 64) WHERE SONumber IS NOT NULL AND LEN(SONumber) > 64;
    ALTER TABLE dbo.SalesOrders ALTER COLUMN SONumber NVARCHAR(64) NULL;
END
GO

IF OBJECT_ID(N'dbo.SalesQuotations', N'U') IS NOT NULL
AND COL_LENGTH('dbo.SalesQuotations', 'QuotationNumber') IS NOT NULL
AND (COL_LENGTH('dbo.SalesQuotations', 'QuotationNumber') = -1 OR COL_LENGTH('dbo.SalesQuotations', 'QuotationNumber') > 128)
BEGIN
    UPDATE dbo.SalesQuotations SET QuotationNumber = LEFT(QuotationNumber, 64) WHERE QuotationNumber IS NOT NULL AND LEN(QuotationNumber) > 64;
    ALTER TABLE dbo.SalesQuotations ALTER COLUMN QuotationNumber NVARCHAR(64) NULL;
END
GO

IF OBJECT_ID(N'dbo.Payments', N'U') IS NOT NULL
AND COL_LENGTH('dbo.Payments', 'PaymentNumber') IS NOT NULL
AND (COL_LENGTH('dbo.Payments', 'PaymentNumber') = -1 OR COL_LENGTH('dbo.Payments', 'PaymentNumber') > 128)
BEGIN
    UPDATE dbo.Payments SET PaymentNumber = LEFT(PaymentNumber, 64) WHERE PaymentNumber IS NOT NULL AND LEN(PaymentNumber) > 64;
    ALTER TABLE dbo.Payments ALTER COLUMN PaymentNumber NVARCHAR(64) NULL;
END
GO

IF OBJECT_ID(N'dbo.JournalEntries', N'U') IS NOT NULL
AND COL_LENGTH('dbo.JournalEntries', 'JournalNumber') IS NOT NULL
AND (COL_LENGTH('dbo.JournalEntries', 'JournalNumber') = -1 OR COL_LENGTH('dbo.JournalEntries', 'JournalNumber') > 128)
BEGIN
    UPDATE dbo.JournalEntries SET JournalNumber = LEFT(JournalNumber, 64) WHERE JournalNumber IS NOT NULL AND LEN(JournalNumber) > 64;
    ALTER TABLE dbo.JournalEntries ALTER COLUMN JournalNumber NVARCHAR(64) NULL;
END
GO

IF OBJECT_ID(N'dbo.ExpenseClaims', N'U') IS NOT NULL
AND COL_LENGTH('dbo.ExpenseClaims', 'ClaimNumber') IS NOT NULL
AND (COL_LENGTH('dbo.ExpenseClaims', 'ClaimNumber') = -1 OR COL_LENGTH('dbo.ExpenseClaims', 'ClaimNumber') > 128)
BEGIN
    UPDATE dbo.ExpenseClaims SET ClaimNumber = LEFT(ClaimNumber, 64) WHERE ClaimNumber IS NOT NULL AND LEN(ClaimNumber) > 64;
    ALTER TABLE dbo.ExpenseClaims ALTER COLUMN ClaimNumber NVARCHAR(64) NULL;
END
GO

IF OBJECT_ID(N'dbo.GoodsReceiptNotes', N'U') IS NOT NULL
AND COL_LENGTH('dbo.GoodsReceiptNotes', 'GrnNumber') IS NOT NULL
AND (COL_LENGTH('dbo.GoodsReceiptNotes', 'GrnNumber') = -1 OR COL_LENGTH('dbo.GoodsReceiptNotes', 'GrnNumber') > 128)
BEGIN
    UPDATE dbo.GoodsReceiptNotes SET GrnNumber = LEFT(GrnNumber, 64) WHERE GrnNumber IS NOT NULL AND LEN(GrnNumber) > 64;
    ALTER TABLE dbo.GoodsReceiptNotes ALTER COLUMN GrnNumber NVARCHAR(64) NULL;
END
GO

IF OBJECT_ID(N'dbo.StockMovements', N'U') IS NOT NULL
AND COL_LENGTH('dbo.StockMovements', 'MovementNumber') IS NOT NULL
AND (COL_LENGTH('dbo.StockMovements', 'MovementNumber') = -1 OR COL_LENGTH('dbo.StockMovements', 'MovementNumber') > 128)
BEGIN
    UPDATE dbo.StockMovements SET MovementNumber = LEFT(MovementNumber, 64) WHERE MovementNumber IS NOT NULL AND LEN(MovementNumber) > 64;
    ALTER TABLE dbo.StockMovements ALTER COLUMN MovementNumber NVARCHAR(64) NULL;
END
GO

IF OBJECT_ID(N'dbo.CrmLeads', N'U') IS NOT NULL
AND COL_LENGTH('dbo.CrmLeads', 'LeadCode') IS NOT NULL
AND (COL_LENGTH('dbo.CrmLeads', 'LeadCode') = -1 OR COL_LENGTH('dbo.CrmLeads', 'LeadCode') > 128)
BEGIN
    UPDATE dbo.CrmLeads SET LeadCode = LEFT(LeadCode, 64) WHERE LeadCode IS NOT NULL AND LEN(LeadCode) > 64;
    ALTER TABLE dbo.CrmLeads ALTER COLUMN LeadCode NVARCHAR(64) NULL;
END
GO

IF OBJECT_ID(N'dbo.TravelRequests', N'U') IS NOT NULL
AND COL_LENGTH('dbo.TravelRequests', 'RequestNumber') IS NOT NULL
AND (COL_LENGTH('dbo.TravelRequests', 'RequestNumber') = -1 OR COL_LENGTH('dbo.TravelRequests', 'RequestNumber') > 128)
BEGIN
    UPDATE dbo.TravelRequests SET RequestNumber = LEFT(RequestNumber, 64) WHERE RequestNumber IS NOT NULL AND LEN(RequestNumber) > 64;
    ALTER TABLE dbo.TravelRequests ALTER COLUMN RequestNumber NVARCHAR(64) NULL;
END
GO

IF OBJECT_ID(N'dbo.ProjectTasks', N'U') IS NOT NULL
AND COL_LENGTH('dbo.ProjectTasks', 'TaskCode') IS NOT NULL
AND (COL_LENGTH('dbo.ProjectTasks', 'TaskCode') = -1 OR COL_LENGTH('dbo.ProjectTasks', 'TaskCode') > 128)
BEGIN
    UPDATE dbo.ProjectTasks SET TaskCode = LEFT(TaskCode, 64) WHERE TaskCode IS NOT NULL AND LEN(TaskCode) > 64;
    ALTER TABLE dbo.ProjectTasks ALTER COLUMN TaskCode NVARCHAR(64) NULL;
END
GO

IF OBJECT_ID(N'dbo.Vendors', N'U') IS NOT NULL
AND COL_LENGTH('dbo.Vendors', 'VendorCode') IS NOT NULL
AND (COL_LENGTH('dbo.Vendors', 'VendorCode') = -1 OR COL_LENGTH('dbo.Vendors', 'VendorCode') > 128)
BEGIN
    UPDATE dbo.Vendors SET VendorCode = LEFT(VendorCode, 64) WHERE VendorCode IS NOT NULL AND LEN(VendorCode) > 64;
    ALTER TABLE dbo.Vendors ALTER COLUMN VendorCode NVARCHAR(64) NULL;
END
GO

IF OBJECT_ID(N'dbo.Items', N'U') IS NOT NULL
AND COL_LENGTH('dbo.Items', 'ItemCode') IS NOT NULL
AND (COL_LENGTH('dbo.Items', 'ItemCode') = -1 OR COL_LENGTH('dbo.Items', 'ItemCode') > 128)
BEGIN
    UPDATE dbo.Items SET ItemCode = LEFT(ItemCode, 64) WHERE ItemCode IS NOT NULL AND LEN(ItemCode) > 64;
    ALTER TABLE dbo.Items ALTER COLUMN ItemCode NVARCHAR(64) NULL;
END
GO

IF OBJECT_ID(N'dbo.Warehouses', N'U') IS NOT NULL
AND COL_LENGTH('dbo.Warehouses', 'WarehouseCode') IS NOT NULL
AND (COL_LENGTH('dbo.Warehouses', 'WarehouseCode') = -1 OR COL_LENGTH('dbo.Warehouses', 'WarehouseCode') > 128)
BEGIN
    UPDATE dbo.Warehouses SET WarehouseCode = LEFT(WarehouseCode, 64) WHERE WarehouseCode IS NOT NULL AND LEN(WarehouseCode) > 64;
    ALTER TABLE dbo.Warehouses ALTER COLUMN WarehouseCode NVARCHAR(64) NULL;
END
GO

IF OBJECT_ID(N'dbo.SalesInvoices', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_SalesInvoices_Tenant_Number' AND object_id = OBJECT_ID(N'dbo.SalesInvoices'))
AND NOT EXISTS (SELECT 1 FROM dbo.SalesInvoices WHERE IsDeleted = 0 AND InvoiceNumber IS NOT NULL AND InvoiceNumber <> '' GROUP BY TenantId, InvoiceNumber HAVING COUNT(*) > 1)
    CREATE UNIQUE INDEX [IX_SalesInvoices_Tenant_Number] ON [dbo].[SalesInvoices]([TenantId], [InvoiceNumber]) WHERE [IsDeleted] = 0 AND [InvoiceNumber] IS NOT NULL AND [InvoiceNumber] <> '';
GO

IF OBJECT_ID(N'dbo.PurchaseInvoices', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PurchaseInvoices_Tenant_Number' AND object_id = OBJECT_ID(N'dbo.PurchaseInvoices'))
AND NOT EXISTS (SELECT 1 FROM dbo.PurchaseInvoices WHERE IsDeleted = 0 AND InvoiceNumber IS NOT NULL AND InvoiceNumber <> '' GROUP BY TenantId, InvoiceNumber HAVING COUNT(*) > 1)
    CREATE UNIQUE INDEX [IX_PurchaseInvoices_Tenant_Number] ON [dbo].[PurchaseInvoices]([TenantId], [InvoiceNumber]) WHERE [IsDeleted] = 0 AND [InvoiceNumber] IS NOT NULL AND [InvoiceNumber] <> '';
GO

IF OBJECT_ID(N'dbo.PurchaseOrders', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PurchaseOrders_Tenant_Number' AND object_id = OBJECT_ID(N'dbo.PurchaseOrders'))
AND NOT EXISTS (SELECT 1 FROM dbo.PurchaseOrders WHERE IsDeleted = 0 AND PONumber IS NOT NULL AND PONumber <> '' GROUP BY TenantId, PONumber HAVING COUNT(*) > 1)
    CREATE UNIQUE INDEX [IX_PurchaseOrders_Tenant_Number] ON [dbo].[PurchaseOrders]([TenantId], [PONumber]) WHERE [IsDeleted] = 0 AND [PONumber] IS NOT NULL AND [PONumber] <> '';
GO

IF OBJECT_ID(N'dbo.SalesOrders', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_SalesOrders_Tenant_Number' AND object_id = OBJECT_ID(N'dbo.SalesOrders'))
AND NOT EXISTS (SELECT 1 FROM dbo.SalesOrders WHERE IsDeleted = 0 AND SONumber IS NOT NULL AND SONumber <> '' GROUP BY TenantId, SONumber HAVING COUNT(*) > 1)
    CREATE UNIQUE INDEX [IX_SalesOrders_Tenant_Number] ON [dbo].[SalesOrders]([TenantId], [SONumber]) WHERE [IsDeleted] = 0 AND [SONumber] IS NOT NULL AND [SONumber] <> '';
GO

IF OBJECT_ID(N'dbo.SalesQuotations', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_SalesQuotations_Tenant_Number' AND object_id = OBJECT_ID(N'dbo.SalesQuotations'))
AND NOT EXISTS (SELECT 1 FROM dbo.SalesQuotations WHERE IsDeleted = 0 AND QuotationNumber IS NOT NULL AND QuotationNumber <> '' GROUP BY TenantId, QuotationNumber HAVING COUNT(*) > 1)
    CREATE UNIQUE INDEX [IX_SalesQuotations_Tenant_Number] ON [dbo].[SalesQuotations]([TenantId], [QuotationNumber]) WHERE [IsDeleted] = 0 AND [QuotationNumber] IS NOT NULL AND [QuotationNumber] <> '';
GO

IF OBJECT_ID(N'dbo.Payments', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Payments_Tenant_Number' AND object_id = OBJECT_ID(N'dbo.Payments'))
AND NOT EXISTS (SELECT 1 FROM dbo.Payments WHERE IsDeleted = 0 AND PaymentNumber IS NOT NULL AND PaymentNumber <> '' GROUP BY TenantId, PaymentNumber HAVING COUNT(*) > 1)
    CREATE UNIQUE INDEX [IX_Payments_Tenant_Number] ON [dbo].[Payments]([TenantId], [PaymentNumber]) WHERE [IsDeleted] = 0 AND [PaymentNumber] IS NOT NULL AND [PaymentNumber] <> '';
GO

IF OBJECT_ID(N'dbo.JournalEntries', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_JournalEntries_Tenant_Number' AND object_id = OBJECT_ID(N'dbo.JournalEntries'))
AND NOT EXISTS (SELECT 1 FROM dbo.JournalEntries WHERE IsDeleted = 0 AND JournalNumber IS NOT NULL AND JournalNumber <> '' GROUP BY TenantId, JournalNumber HAVING COUNT(*) > 1)
    CREATE UNIQUE INDEX [IX_JournalEntries_Tenant_Number] ON [dbo].[JournalEntries]([TenantId], [JournalNumber]) WHERE [IsDeleted] = 0 AND [JournalNumber] IS NOT NULL AND [JournalNumber] <> '';
GO

IF OBJECT_ID(N'dbo.ExpenseClaims', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ExpenseClaims_Tenant_Number' AND object_id = OBJECT_ID(N'dbo.ExpenseClaims'))
AND NOT EXISTS (SELECT 1 FROM dbo.ExpenseClaims WHERE IsDeleted = 0 AND ClaimNumber IS NOT NULL AND ClaimNumber <> '' GROUP BY TenantId, ClaimNumber HAVING COUNT(*) > 1)
    CREATE UNIQUE INDEX [IX_ExpenseClaims_Tenant_Number] ON [dbo].[ExpenseClaims]([TenantId], [ClaimNumber]) WHERE [IsDeleted] = 0 AND [ClaimNumber] IS NOT NULL AND [ClaimNumber] <> '';
GO

IF OBJECT_ID(N'dbo.GoodsReceiptNotes', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_GoodsReceiptNotes_Tenant_Number' AND object_id = OBJECT_ID(N'dbo.GoodsReceiptNotes'))
AND NOT EXISTS (SELECT 1 FROM dbo.GoodsReceiptNotes WHERE IsDeleted = 0 AND GrnNumber IS NOT NULL AND GrnNumber <> '' GROUP BY TenantId, GrnNumber HAVING COUNT(*) > 1)
    CREATE UNIQUE INDEX [IX_GoodsReceiptNotes_Tenant_Number] ON [dbo].[GoodsReceiptNotes]([TenantId], [GrnNumber]) WHERE [IsDeleted] = 0 AND [GrnNumber] IS NOT NULL AND [GrnNumber] <> '';
GO

IF OBJECT_ID(N'dbo.StockMovements', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_StockMovements_Tenant_Number' AND object_id = OBJECT_ID(N'dbo.StockMovements'))
AND NOT EXISTS (SELECT 1 FROM dbo.StockMovements WHERE IsDeleted = 0 AND MovementNumber IS NOT NULL AND MovementNumber <> '' GROUP BY TenantId, MovementNumber HAVING COUNT(*) > 1)
    CREATE UNIQUE INDEX [IX_StockMovements_Tenant_Number] ON [dbo].[StockMovements]([TenantId], [MovementNumber]) WHERE [IsDeleted] = 0 AND [MovementNumber] IS NOT NULL AND [MovementNumber] <> '';
GO

IF OBJECT_ID(N'dbo.CrmLeads', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_CrmLeads_Tenant_LeadCode' AND object_id = OBJECT_ID(N'dbo.CrmLeads'))
AND NOT EXISTS (SELECT 1 FROM dbo.CrmLeads WHERE IsDeleted = 0 AND LeadCode IS NOT NULL AND LeadCode <> '' GROUP BY TenantId, LeadCode HAVING COUNT(*) > 1)
    CREATE UNIQUE INDEX [IX_CrmLeads_Tenant_LeadCode] ON [dbo].[CrmLeads]([TenantId], [LeadCode]) WHERE [IsDeleted] = 0 AND [LeadCode] IS NOT NULL AND [LeadCode] <> '';
GO

IF OBJECT_ID(N'dbo.TravelRequests', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_TravelRequests_Tenant_Number' AND object_id = OBJECT_ID(N'dbo.TravelRequests'))
AND NOT EXISTS (SELECT 1 FROM dbo.TravelRequests WHERE IsDeleted = 0 AND RequestNumber IS NOT NULL AND RequestNumber <> '' GROUP BY TenantId, RequestNumber HAVING COUNT(*) > 1)
    CREATE UNIQUE INDEX [IX_TravelRequests_Tenant_Number] ON [dbo].[TravelRequests]([TenantId], [RequestNumber]) WHERE [IsDeleted] = 0 AND [RequestNumber] IS NOT NULL AND [RequestNumber] <> '';
GO

IF OBJECT_ID(N'dbo.ProjectTasks', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ProjectTasks_Tenant_Code' AND object_id = OBJECT_ID(N'dbo.ProjectTasks'))
AND NOT EXISTS (SELECT 1 FROM dbo.ProjectTasks WHERE IsDeleted = 0 AND TaskCode IS NOT NULL AND TaskCode <> '' GROUP BY TenantId, TaskCode HAVING COUNT(*) > 1)
    CREATE UNIQUE INDEX [IX_ProjectTasks_Tenant_Code] ON [dbo].[ProjectTasks]([TenantId], [TaskCode]) WHERE [IsDeleted] = 0 AND [TaskCode] IS NOT NULL AND [TaskCode] <> '';
GO

IF OBJECT_ID(N'dbo.Vendors', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Vendors_Tenant_Code' AND object_id = OBJECT_ID(N'dbo.Vendors'))
AND NOT EXISTS (SELECT 1 FROM dbo.Vendors WHERE IsDeleted = 0 AND VendorCode IS NOT NULL AND VendorCode <> '' GROUP BY TenantId, VendorCode HAVING COUNT(*) > 1)
    CREATE UNIQUE INDEX [IX_Vendors_Tenant_Code] ON [dbo].[Vendors]([TenantId], [VendorCode]) WHERE [IsDeleted] = 0 AND [VendorCode] IS NOT NULL AND [VendorCode] <> '';
GO

IF OBJECT_ID(N'dbo.Items', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Items_Tenant_Code' AND object_id = OBJECT_ID(N'dbo.Items'))
AND NOT EXISTS (SELECT 1 FROM dbo.Items WHERE IsDeleted = 0 AND ItemCode IS NOT NULL AND ItemCode <> '' GROUP BY TenantId, ItemCode HAVING COUNT(*) > 1)
    CREATE UNIQUE INDEX [IX_Items_Tenant_Code] ON [dbo].[Items]([TenantId], [ItemCode]) WHERE [IsDeleted] = 0 AND [ItemCode] IS NOT NULL AND [ItemCode] <> '';
GO

IF OBJECT_ID(N'dbo.Warehouses', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Warehouses_Tenant_Code' AND object_id = OBJECT_ID(N'dbo.Warehouses'))
AND NOT EXISTS (SELECT 1 FROM dbo.Warehouses WHERE IsDeleted = 0 AND WarehouseCode IS NOT NULL AND WarehouseCode <> '' GROUP BY TenantId, WarehouseCode HAVING COUNT(*) > 1)
    CREATE UNIQUE INDEX [IX_Warehouses_Tenant_Code] ON [dbo].[Warehouses]([TenantId], [WarehouseCode]) WHERE [IsDeleted] = 0 AND [WarehouseCode] IS NOT NULL AND [WarehouseCode] <> '';
GO
