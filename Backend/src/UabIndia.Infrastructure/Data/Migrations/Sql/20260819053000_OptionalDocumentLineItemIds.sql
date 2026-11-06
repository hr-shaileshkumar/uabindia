-- Allow document lines without a catalog item so users can type a manual item.

IF OBJECT_ID(N'dbo.SalesQuotationItems', N'U') IS NOT NULL
AND COL_LENGTH('dbo.SalesQuotationItems', 'ItemId') IS NOT NULL
AND COLUMNPROPERTY(OBJECT_ID(N'dbo.SalesQuotationItems'), 'ItemId', 'AllowsNull') = 0
    ALTER TABLE dbo.SalesQuotationItems ALTER COLUMN ItemId UNIQUEIDENTIFIER NULL;
GO

IF OBJECT_ID(N'dbo.SalesOrderItems', N'U') IS NOT NULL
AND COL_LENGTH('dbo.SalesOrderItems', 'ItemId') IS NOT NULL
AND COLUMNPROPERTY(OBJECT_ID(N'dbo.SalesOrderItems'), 'ItemId', 'AllowsNull') = 0
    ALTER TABLE dbo.SalesOrderItems ALTER COLUMN ItemId UNIQUEIDENTIFIER NULL;
GO

IF OBJECT_ID(N'dbo.SalesInvoiceItems', N'U') IS NOT NULL
AND COL_LENGTH('dbo.SalesInvoiceItems', 'ItemId') IS NOT NULL
AND COLUMNPROPERTY(OBJECT_ID(N'dbo.SalesInvoiceItems'), 'ItemId', 'AllowsNull') = 0
    ALTER TABLE dbo.SalesInvoiceItems ALTER COLUMN ItemId UNIQUEIDENTIFIER NULL;
GO

IF OBJECT_ID(N'dbo.PurchaseOrderItems', N'U') IS NOT NULL
AND COL_LENGTH('dbo.PurchaseOrderItems', 'ItemId') IS NOT NULL
AND COLUMNPROPERTY(OBJECT_ID(N'dbo.PurchaseOrderItems'), 'ItemId', 'AllowsNull') = 0
    ALTER TABLE dbo.PurchaseOrderItems ALTER COLUMN ItemId UNIQUEIDENTIFIER NULL;
GO

IF OBJECT_ID(N'dbo.PurchaseInvoiceItems', N'U') IS NOT NULL
AND COL_LENGTH('dbo.PurchaseInvoiceItems', 'ItemId') IS NOT NULL
AND COLUMNPROPERTY(OBJECT_ID(N'dbo.PurchaseInvoiceItems'), 'ItemId', 'AllowsNull') = 0
    ALTER TABLE dbo.PurchaseInvoiceItems ALTER COLUMN ItemId UNIQUEIDENTIFIER NULL;
GO
