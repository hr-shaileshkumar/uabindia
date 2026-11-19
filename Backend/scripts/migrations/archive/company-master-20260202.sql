-- Migration: Add Company Master Fields
-- Date: 2026-02-02
-- Purpose: Enhance Company entity with complete master data fields

BEGIN TRANSACTION;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Companies') AND name = 'Code')
BEGIN
    ALTER TABLE dbo.Companies ADD Code NVARCHAR(50) NULL;
    CREATE INDEX IX_Companies_Code ON dbo.Companies (Code) WHERE Code IS NOT NULL;
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Companies') AND name = 'RegistrationNumber')
BEGIN
    ALTER TABLE dbo.Companies ADD RegistrationNumber NVARCHAR(100) NULL;
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Companies') AND name = 'TaxId')
BEGIN
    ALTER TABLE dbo.Companies ADD TaxId NVARCHAR(50) NULL;
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Companies') AND name = 'Email')
BEGIN
    ALTER TABLE dbo.Companies ADD Email NVARCHAR(256) NULL;
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Companies') AND name = 'PhoneNumber')
BEGIN
    ALTER TABLE dbo.Companies ADD PhoneNumber NVARCHAR(20) NULL;
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Companies') AND name = 'WebsiteUrl')
BEGIN
    ALTER TABLE dbo.Companies ADD WebsiteUrl NVARCHAR(500) NULL;
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Companies') AND name = 'LogoUrl')
BEGIN
    ALTER TABLE dbo.Companies ADD LogoUrl NVARCHAR(500) NULL;
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Companies') AND name = 'Industry')
BEGIN
    ALTER TABLE dbo.Companies ADD Industry NVARCHAR(100) NULL;
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Companies') AND name = 'CompanySize')
BEGIN
    ALTER TABLE dbo.Companies ADD CompanySize NVARCHAR(50) NULL;
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Companies') AND name = 'RegistrationAddress')
BEGIN
    ALTER TABLE dbo.Companies ADD RegistrationAddress NVARCHAR(1000) NULL;
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Companies') AND name = 'OperationalAddress')
BEGIN
    ALTER TABLE dbo.Companies ADD OperationalAddress NVARCHAR(1000) NULL;
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Companies') AND name = 'City')
BEGIN
    ALTER TABLE dbo.Companies ADD City NVARCHAR(100) NULL;
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Companies') AND name = 'State')
BEGIN
    ALTER TABLE dbo.Companies ADD State NVARCHAR(100) NULL;
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Companies') AND name = 'PostalCode')
BEGIN
    ALTER TABLE dbo.Companies ADD PostalCode NVARCHAR(20) NULL;
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Companies') AND name = 'Country')
BEGIN
    ALTER TABLE dbo.Companies ADD Country NVARCHAR(100) NULL;
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Companies') AND name = 'BankAccountNumber')
BEGIN
    ALTER TABLE dbo.Companies ADD BankAccountNumber NVARCHAR(50) NULL;
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Companies') AND name = 'BankName')
BEGIN
    ALTER TABLE dbo.Companies ADD BankName NVARCHAR(256) NULL;
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Companies') AND name = 'BankBranch')
BEGIN
    ALTER TABLE dbo.Companies ADD BankBranch NVARCHAR(256) NULL;
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Companies') AND name = 'IFSCCode')
BEGIN
    ALTER TABLE dbo.Companies ADD IFSCCode NVARCHAR(20) NULL;
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Companies') AND name = 'FinancialYearStart')
BEGIN
    ALTER TABLE dbo.Companies ADD FinancialYearStart NVARCHAR(10) NULL;
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Companies') AND name = 'FinancialYearEnd')
BEGIN
    ALTER TABLE dbo.Companies ADD FinancialYearEnd NVARCHAR(10) NULL;
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Companies') AND name = 'MaxEmployees')
BEGIN
    ALTER TABLE dbo.Companies ADD MaxEmployees INT NULL;
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Companies') AND name = 'ContactPersonName')
BEGIN
    ALTER TABLE dbo.Companies ADD ContactPersonName NVARCHAR(256) NULL;
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Companies') AND name = 'ContactPersonPhone')
BEGIN
    ALTER TABLE dbo.Companies ADD ContactPersonPhone NVARCHAR(20) NULL;
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Companies') AND name = 'ContactPersonEmail')
BEGIN
    ALTER TABLE dbo.Companies ADD ContactPersonEmail NVARCHAR(256) NULL;
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Companies') AND name = 'HR_PersonName')
BEGIN
    ALTER TABLE dbo.Companies ADD HR_PersonName NVARCHAR(256) NULL;
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Companies') AND name = 'HR_PersonEmail')
BEGIN
    ALTER TABLE dbo.Companies ADD HR_PersonEmail NVARCHAR(256) NULL;
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Companies') AND name = 'Notes')
BEGIN
    ALTER TABLE dbo.Companies ADD Notes NVARCHAR(MAX) NULL;
END

-- Create index for frequently queried fields
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Companies_TenantId_IsActive' AND object_id = OBJECT_ID('dbo.Companies'))
BEGIN
    CREATE INDEX IX_Companies_TenantId_IsActive ON dbo.Companies (TenantId, IsActive) INCLUDE (Name, City);
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Companies_Tenant_Code' AND object_id = OBJECT_ID('dbo.Companies'))
BEGIN
    CREATE UNIQUE INDEX IX_Companies_Tenant_Code ON dbo.Companies (TenantId, Code) WHERE Code IS NOT NULL AND IsDeleted = 0;
END

COMMIT TRANSACTION;
