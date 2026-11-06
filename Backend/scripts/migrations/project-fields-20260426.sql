-- ============================================================
-- Migration: project-fields-20260426
-- Adds extended project management fields to dbo.Projects
-- Safe to run multiple times (IF COL_LENGTH guards each column)
-- ============================================================

IF COL_LENGTH('dbo.Projects', 'ProjectCode') IS NULL
    ALTER TABLE dbo.Projects ADD ProjectCode NVARCHAR(50) NOT NULL DEFAULT '';

IF COL_LENGTH('dbo.Projects', 'Description') IS NULL
    ALTER TABLE dbo.Projects ADD Description NVARCHAR(MAX) NULL;

IF COL_LENGTH('dbo.Projects', 'ProjectType') IS NULL
    ALTER TABLE dbo.Projects ADD ProjectType NVARCHAR(50) NOT NULL DEFAULT 'Internal';

IF COL_LENGTH('dbo.Projects', 'Priority') IS NULL
    ALTER TABLE dbo.Projects ADD Priority NVARCHAR(20) NOT NULL DEFAULT 'Medium';

IF COL_LENGTH('dbo.Projects', 'Status') IS NULL
    ALTER TABLE dbo.Projects ADD Status NVARCHAR(30) NOT NULL DEFAULT 'Planned';

IF COL_LENGTH('dbo.Projects', 'StartDate') IS NULL
    ALTER TABLE dbo.Projects ADD StartDate DATETIME2 NULL;

IF COL_LENGTH('dbo.Projects', 'EndDate') IS NULL
    ALTER TABLE dbo.Projects ADD EndDate DATETIME2 NULL;

IF COL_LENGTH('dbo.Projects', 'ActualStartDate') IS NULL
    ALTER TABLE dbo.Projects ADD ActualStartDate DATETIME2 NULL;

IF COL_LENGTH('dbo.Projects', 'ActualEndDate') IS NULL
    ALTER TABLE dbo.Projects ADD ActualEndDate DATETIME2 NULL;

IF COL_LENGTH('dbo.Projects', 'Budget') IS NULL
    ALTER TABLE dbo.Projects ADD Budget DECIMAL(18,2) NULL;

IF COL_LENGTH('dbo.Projects', 'ActualCost') IS NULL
    ALTER TABLE dbo.Projects ADD ActualCost DECIMAL(18,2) NULL;

IF COL_LENGTH('dbo.Projects', 'CurrencyCode') IS NULL
    ALTER TABLE dbo.Projects ADD CurrencyCode CHAR(3) NOT NULL DEFAULT 'INR';

IF COL_LENGTH('dbo.Projects', 'ClientName') IS NULL
    ALTER TABLE dbo.Projects ADD ClientName NVARCHAR(256) NULL;

IF COL_LENGTH('dbo.Projects', 'ContractNumber') IS NULL
    ALTER TABLE dbo.Projects ADD ContractNumber NVARCHAR(100) NULL;

IF COL_LENGTH('dbo.Projects', 'BillingType') IS NULL
    ALTER TABLE dbo.Projects ADD BillingType NVARCHAR(30) NULL;

IF COL_LENGTH('dbo.Projects', 'CompletionPercentage') IS NULL
    ALTER TABLE dbo.Projects ADD CompletionPercentage INT NOT NULL DEFAULT 0;

IF COL_LENGTH('dbo.Projects', 'ProjectManagerId') IS NULL
    ALTER TABLE dbo.Projects ADD ProjectManagerId UNIQUEIDENTIFIER NULL;

IF COL_LENGTH('dbo.Projects', 'Location') IS NULL
    ALTER TABLE dbo.Projects ADD Location NVARCHAR(256) NULL;

IF COL_LENGTH('dbo.Projects', 'UpdatedBy') IS NULL
    ALTER TABLE dbo.Projects ADD UpdatedBy UNIQUEIDENTIFIER NULL;

-- Back-fill Status from IsActive for existing rows
UPDATE dbo.Projects
SET Status = CASE WHEN IsActive = 1 THEN 'Active' ELSE 'Hold' END
WHERE Status = 'Planned' AND CreatedAt < SYSUTCDATETIME();

-- Back-fill ProjectCode for rows without one (PRJ- + first 6 chars of Id)
UPDATE dbo.Projects
SET ProjectCode = 'PRJ-' + UPPER(LEFT(REPLACE(CAST(Id AS NVARCHAR(36)), '-', ''), 6))
WHERE ProjectCode = '';
