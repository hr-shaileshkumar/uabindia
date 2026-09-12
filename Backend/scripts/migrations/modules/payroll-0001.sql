-- Module: Payroll (0001)
SET NOCOUNT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID('dbo.ModuleMigrations', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.ModuleMigrations (
            Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
            ModuleKey NVARCHAR(64) NOT NULL,
            Version NVARCHAR(32) NOT NULL,
            AppliedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
            CONSTRAINT UQ_ModuleMigrations_Module_Version UNIQUE (ModuleKey, Version)
        );
    END

    IF NOT EXISTS (SELECT 1 FROM dbo.ModuleMigrations WHERE ModuleKey = 'payroll' AND Version = '0001')
    BEGIN
        IF OBJECT_ID('dbo.PayrollStructures', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.PayrollStructures (
                Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
                TenantId UNIQUEIDENTIFIER NOT NULL,
                Name NVARCHAR(256) NOT NULL,
                EffectiveFrom DATE NOT NULL,
                EffectiveTo DATE NULL,
                CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2 NULL,
                CreatedBy UNIQUEIDENTIFIER NULL,
                IsDeleted BIT NOT NULL DEFAULT 0
            );
        END
        ELSE
        BEGIN
            IF COL_LENGTH('dbo.PayrollStructures', 'UpdatedAt') IS NULL
                ALTER TABLE dbo.PayrollStructures ADD UpdatedAt DATETIME2 NULL;
            IF COL_LENGTH('dbo.PayrollStructures', 'CreatedBy') IS NULL
                ALTER TABLE dbo.PayrollStructures ADD CreatedBy UNIQUEIDENTIFIER NULL;
            IF COL_LENGTH('dbo.PayrollStructures', 'IsDeleted') IS NULL
                ALTER TABLE dbo.PayrollStructures ADD IsDeleted BIT NOT NULL DEFAULT 0;
        END

        IF OBJECT_ID('dbo.PayrollComponents', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.PayrollComponents (
                Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
                TenantId UNIQUEIDENTIFIER NOT NULL,
                StructureId UNIQUEIDENTIFIER NOT NULL,
                Name NVARCHAR(256) NOT NULL,
                Type NVARCHAR(32) NOT NULL,
                Amount DECIMAL(18,2) NULL,
                Percentage DECIMAL(8,4) NULL,
                IsStatutory BIT NOT NULL DEFAULT 0,
                CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2 NULL,
                CreatedBy UNIQUEIDENTIFIER NULL,
                IsDeleted BIT NOT NULL DEFAULT 0
            );
        END
        ELSE
        BEGIN
            IF COL_LENGTH('dbo.PayrollComponents', 'CreatedAt') IS NULL
                ALTER TABLE dbo.PayrollComponents ADD CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME();
            IF COL_LENGTH('dbo.PayrollComponents', 'UpdatedAt') IS NULL
                ALTER TABLE dbo.PayrollComponents ADD UpdatedAt DATETIME2 NULL;
            IF COL_LENGTH('dbo.PayrollComponents', 'CreatedBy') IS NULL
                ALTER TABLE dbo.PayrollComponents ADD CreatedBy UNIQUEIDENTIFIER NULL;
            IF COL_LENGTH('dbo.PayrollComponents', 'IsDeleted') IS NULL
                ALTER TABLE dbo.PayrollComponents ADD IsDeleted BIT NOT NULL DEFAULT 0;
        END

        IF OBJECT_ID('dbo.PayrollRuns', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.PayrollRuns (
                Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
                TenantId UNIQUEIDENTIFIER NOT NULL,
                CompanyId UNIQUEIDENTIFIER NULL,
                RunDate DATE NOT NULL,
                Status NVARCHAR(32) NOT NULL DEFAULT 'Draft',
                CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2 NULL,
                CreatedBy UNIQUEIDENTIFIER NULL,
                IsDeleted BIT NOT NULL DEFAULT 0
            );
        END
        ELSE
        BEGIN
            IF COL_LENGTH('dbo.PayrollRuns', 'UpdatedAt') IS NULL
                ALTER TABLE dbo.PayrollRuns ADD UpdatedAt DATETIME2 NULL;
            IF COL_LENGTH('dbo.PayrollRuns', 'CreatedBy') IS NULL
                ALTER TABLE dbo.PayrollRuns ADD CreatedBy UNIQUEIDENTIFIER NULL;
            IF COL_LENGTH('dbo.PayrollRuns', 'IsDeleted') IS NULL
                ALTER TABLE dbo.PayrollRuns ADD IsDeleted BIT NOT NULL DEFAULT 0;
        END

        IF OBJECT_ID('dbo.Payslips', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.Payslips (
                Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
                TenantId UNIQUEIDENTIFIER NOT NULL,
                PayrollRunId UNIQUEIDENTIFIER NOT NULL,
                EmployeeId UNIQUEIDENTIFIER NOT NULL,
                Gross DECIMAL(18,2) NOT NULL,
                Net DECIMAL(18,2) NOT NULL,
                Details NVARCHAR(MAX) NULL,
                CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2 NULL,
                CreatedBy UNIQUEIDENTIFIER NULL,
                IsDeleted BIT NOT NULL DEFAULT 0
            );
        END
        ELSE
        BEGIN
            IF COL_LENGTH('dbo.Payslips', 'UpdatedAt') IS NULL
                ALTER TABLE dbo.Payslips ADD UpdatedAt DATETIME2 NULL;
            IF COL_LENGTH('dbo.Payslips', 'CreatedBy') IS NULL
                ALTER TABLE dbo.Payslips ADD CreatedBy UNIQUEIDENTIFIER NULL;
            IF COL_LENGTH('dbo.Payslips', 'IsDeleted') IS NULL
                ALTER TABLE dbo.Payslips ADD IsDeleted BIT NOT NULL DEFAULT 0;
        END

        INSERT INTO dbo.ModuleMigrations (ModuleKey, Version) VALUES ('payroll', '0001');
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
