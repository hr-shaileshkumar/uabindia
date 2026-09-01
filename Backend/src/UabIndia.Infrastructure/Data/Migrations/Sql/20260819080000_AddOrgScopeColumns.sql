DECLARE @tables TABLE (
    TableName sysname NOT NULL,
    AddProject bit NOT NULL
);

INSERT INTO @tables (TableName, AddProject) VALUES
    ('Customers', 1),
    ('Vendors', 1),
    ('Items', 1),
    ('Warehouses', 1),
    ('StockMovements', 1),
    ('StockBalances', 0),
    ('SalesQuotations', 1),
    ('SalesOrders', 1),
    ('SalesInvoices', 1),
    ('PurchaseOrders', 1),
    ('PurchaseInvoices', 1),
    ('PurchaseRequests', 1),
    ('GoodsReceiptNotes', 1),
    ('JournalEntries', 1),
    ('Payments', 1),
    ('ExpenseClaims', 0),
    ('CrmLeads', 1),
    ('DiscountSchemes', 1),
    ('BankReconciliations', 0),
    ('SalesReturns', 1),
    ('FixedAssets', 1);

DECLARE @table sysname;
DECLARE @addProject bit;
DECLARE @sql nvarchar(max);

DECLARE table_cursor CURSOR LOCAL FAST_FORWARD FOR
    SELECT TableName, AddProject FROM @tables;

OPEN table_cursor;
FETCH NEXT FROM table_cursor INTO @table, @addProject;

WHILE @@FETCH_STATUS = 0
BEGIN
    IF OBJECT_ID(N'dbo.' + @table, N'U') IS NOT NULL AND COL_LENGTH('dbo.' + @table, 'CompanyId') IS NULL
    BEGIN
        SET @sql = N'ALTER TABLE dbo.' + QUOTENAME(@table) + N' ADD CompanyId uniqueidentifier NULL';
        EXEC sp_executesql @sql;
    END

    IF @addProject = 1 AND OBJECT_ID(N'dbo.' + @table, N'U') IS NOT NULL AND COL_LENGTH('dbo.' + @table, 'ProjectId') IS NULL
    BEGIN
        SET @sql = N'ALTER TABLE dbo.' + QUOTENAME(@table) + N' ADD ProjectId uniqueidentifier NULL';
        EXEC sp_executesql @sql;
    END

    FETCH NEXT FROM table_cursor INTO @table, @addProject;
END

CLOSE table_cursor;
DEALLOCATE table_cursor;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId
FROM dbo.Customers t
INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId
WHERE t.CompanyId IS NULL;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId FROM dbo.Vendors t INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId WHERE t.CompanyId IS NULL;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId FROM dbo.Items t INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId WHERE t.CompanyId IS NULL;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId FROM dbo.Warehouses t INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId WHERE t.CompanyId IS NULL;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId FROM dbo.SalesInvoices t INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId WHERE t.CompanyId IS NULL;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId FROM dbo.SalesOrders t INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId WHERE t.CompanyId IS NULL;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId FROM dbo.SalesQuotations t INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId WHERE t.CompanyId IS NULL;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId FROM dbo.PurchaseOrders t INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId WHERE t.CompanyId IS NULL;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId FROM dbo.PurchaseInvoices t INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId WHERE t.CompanyId IS NULL;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId FROM dbo.JournalEntries t INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId WHERE t.CompanyId IS NULL;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId FROM dbo.Payments t INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId WHERE t.CompanyId IS NULL;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId FROM dbo.CrmLeads t INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId WHERE t.CompanyId IS NULL;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId FROM dbo.ExpenseClaims t INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId WHERE t.CompanyId IS NULL;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId FROM dbo.DiscountSchemes t INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId WHERE t.CompanyId IS NULL;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId FROM dbo.StockMovements t INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId WHERE t.CompanyId IS NULL;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId FROM dbo.GoodsReceiptNotes t INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId WHERE t.CompanyId IS NULL;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId FROM dbo.PurchaseRequests t INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId WHERE t.CompanyId IS NULL;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId FROM dbo.SalesReturns t INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId WHERE t.CompanyId IS NULL;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId FROM dbo.FixedAssets t INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId WHERE t.CompanyId IS NULL;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId FROM dbo.BankReconciliations t INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId WHERE t.CompanyId IS NULL;
GO

;WITH FirstCompany AS (
    SELECT c.TenantId, c.Id AS CompanyId
    FROM dbo.Companies c
    INNER JOIN (
        SELECT TenantId, MIN(CreatedAt) AS CreatedAt
        FROM dbo.Companies
        WHERE IsDeleted = 0
        GROUP BY TenantId
    ) firstOn ON firstOn.TenantId = c.TenantId AND firstOn.CreatedAt = c.CreatedAt
    WHERE c.IsDeleted = 0
)
UPDATE t SET t.CompanyId = fc.CompanyId FROM dbo.StockBalances t INNER JOIN FirstCompany fc ON fc.TenantId = t.TenantId WHERE t.CompanyId IS NULL;
GO
