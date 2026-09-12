-- Module: Core/Tenant (0001)
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

    IF NOT EXISTS (SELECT 1 FROM dbo.ModuleMigrations WHERE ModuleKey = 'core' AND Version = '0001')
    BEGIN
        IF OBJECT_ID('dbo.Tenants', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.Tenants (
                Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
                Subdomain NVARCHAR(128) NOT NULL UNIQUE,
                Name NVARCHAR(256) NOT NULL,
                IsActive BIT NOT NULL DEFAULT 1,
                FeatureFlags NVARCHAR(MAX) NULL,
                CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2 NULL,
                CreatedBy UNIQUEIDENTIFIER NULL,
                IsDeleted BIT NOT NULL DEFAULT 0
            );
        END

        IF OBJECT_ID('dbo.Companies', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.Companies (
                Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
                TenantId UNIQUEIDENTIFIER NOT NULL,
                Name NVARCHAR(256) NOT NULL,
                LegalName NVARCHAR(512) NULL,
                IsActive BIT NOT NULL DEFAULT 1,
                CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2 NULL,
                CreatedBy UNIQUEIDENTIFIER NULL,
                IsDeleted BIT NOT NULL DEFAULT 0,
                CONSTRAINT FK_Companies_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants(Id)
            );
        END

        IF OBJECT_ID('dbo.Projects', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.Projects (
                Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
                TenantId UNIQUEIDENTIFIER NOT NULL,
                CompanyId UNIQUEIDENTIFIER NOT NULL,
                ProjectCode NVARCHAR(50) NOT NULL DEFAULT '',
                Name NVARCHAR(256) NOT NULL,
                Description NVARCHAR(MAX) NULL,
                ProjectType NVARCHAR(50) NOT NULL DEFAULT 'Internal',
                Priority NVARCHAR(20) NOT NULL DEFAULT 'Medium',
                Status NVARCHAR(30) NOT NULL DEFAULT 'Planned',
                IsActive BIT NOT NULL DEFAULT 1,
                StartDate DATETIME2 NULL,
                EndDate DATETIME2 NULL,
                ActualStartDate DATETIME2 NULL,
                ActualEndDate DATETIME2 NULL,
                Budget DECIMAL(18,2) NULL,
                ActualCost DECIMAL(18,2) NULL,
                CurrencyCode CHAR(3) NOT NULL DEFAULT 'INR',
                ClientName NVARCHAR(256) NULL,
                ContractNumber NVARCHAR(100) NULL,
                BillingType NVARCHAR(30) NULL,
                CompletionPercentage INT NOT NULL DEFAULT 0,
                ProjectManagerId UNIQUEIDENTIFIER NULL,
                Location NVARCHAR(256) NULL,
                UpdatedBy UNIQUEIDENTIFIER NULL,
                CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2 NULL,
                CreatedBy UNIQUEIDENTIFIER NULL,
                IsDeleted BIT NOT NULL DEFAULT 0,
                CONSTRAINT FK_Projects_Companies FOREIGN KEY (CompanyId) REFERENCES dbo.Companies(Id)
            );
        END

        IF OBJECT_ID('dbo.TenantModules', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.TenantModules (
                Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
                TenantId UNIQUEIDENTIFIER NOT NULL,
                ModuleKey NVARCHAR(64) NOT NULL,
                IsEnabled BIT NOT NULL DEFAULT 1,
                CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2 NULL,
                CreatedBy UNIQUEIDENTIFIER NULL,
                IsDeleted BIT NOT NULL DEFAULT 0,
                CONSTRAINT FK_TenantModules_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants(Id)
            );
        END

        IF OBJECT_ID('dbo.FeatureFlags', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.FeatureFlags (
                Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
                TenantId UNIQUEIDENTIFIER NOT NULL,
                FeatureKey NVARCHAR(256) NOT NULL,
                IsEnabled BIT NOT NULL DEFAULT 0,
                CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2 NULL,
                CreatedBy UNIQUEIDENTIFIER NULL,
                IsDeleted BIT NOT NULL DEFAULT 0
            );
        END
        ELSE
        BEGIN
            IF COL_LENGTH('dbo.FeatureFlags', 'UpdatedAt') IS NULL
                ALTER TABLE dbo.FeatureFlags ADD UpdatedAt DATETIME2 NULL;
            IF COL_LENGTH('dbo.FeatureFlags', 'CreatedBy') IS NULL
                ALTER TABLE dbo.FeatureFlags ADD CreatedBy UNIQUEIDENTIFIER NULL;
            IF COL_LENGTH('dbo.FeatureFlags', 'IsDeleted') IS NULL
                ALTER TABLE dbo.FeatureFlags ADD IsDeleted BIT NOT NULL DEFAULT 0;
        END

        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_TenantModules_Tenant_Module' AND object_id = OBJECT_ID('dbo.TenantModules'))
            CREATE UNIQUE INDEX IX_TenantModules_Tenant_Module ON dbo.TenantModules (TenantId, ModuleKey);

        IF NOT EXISTS (SELECT 1 FROM dbo.Tenants)
        BEGIN
            INSERT INTO dbo.Tenants (Id, Subdomain, Name, IsActive, CreatedAt)
            VALUES (NEWID(), 'demo', 'Demo Tenant', 1, SYSUTCDATETIME());
        END

        DECLARE @DemoTenantId UNIQUEIDENTIFIER;
        SELECT TOP 1 @DemoTenantId = Id FROM dbo.Tenants WHERE Subdomain = 'demo';

        IF @DemoTenantId IS NOT NULL
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM dbo.TenantModules WHERE TenantId = @DemoTenantId AND ModuleKey = 'core')
                INSERT INTO dbo.TenantModules (TenantId, ModuleKey, IsEnabled) VALUES (@DemoTenantId, 'core', 1);
            IF NOT EXISTS (SELECT 1 FROM dbo.TenantModules WHERE TenantId = @DemoTenantId AND ModuleKey = 'hrms')
                INSERT INTO dbo.TenantModules (TenantId, ModuleKey, IsEnabled) VALUES (@DemoTenantId, 'hrms', 1);
            IF NOT EXISTS (SELECT 1 FROM dbo.TenantModules WHERE TenantId = @DemoTenantId AND ModuleKey = 'payroll')
                INSERT INTO dbo.TenantModules (TenantId, ModuleKey, IsEnabled) VALUES (@DemoTenantId, 'payroll', 1);
            IF NOT EXISTS (SELECT 1 FROM dbo.TenantModules WHERE TenantId = @DemoTenantId AND ModuleKey = 'reports')
                INSERT INTO dbo.TenantModules (TenantId, ModuleKey, IsEnabled) VALUES (@DemoTenantId, 'reports', 1);
        END

        INSERT INTO dbo.ModuleMigrations (ModuleKey, Version) VALUES ('core', '0001');
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
