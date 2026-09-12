-- Module: Auth (0001)
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

    IF NOT EXISTS (SELECT 1 FROM dbo.ModuleMigrations WHERE ModuleKey = 'auth' AND Version = '0001')
    BEGIN
        IF OBJECT_ID('dbo.Users', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.Users (
                Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
                TenantId UNIQUEIDENTIFIER NOT NULL,
                Email NVARCHAR(256) NOT NULL,
                PasswordHash NVARCHAR(512) NOT NULL,
                FullName NVARCHAR(256) NULL,
                IsSystemAdmin BIT NOT NULL DEFAULT 0,
                IsActive BIT NOT NULL DEFAULT 1,
                CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2 NULL,
                CreatedBy UNIQUEIDENTIFIER NULL,
                IsDeleted BIT NOT NULL DEFAULT 0,
                CONSTRAINT FK_Users_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants(Id)
            );
        END
        ELSE
        BEGIN
            IF COL_LENGTH('dbo.Users', 'IsSystemAdmin') IS NULL
                ALTER TABLE dbo.Users ADD IsSystemAdmin BIT NOT NULL DEFAULT 0;
            IF COL_LENGTH('dbo.Users', 'IsActive') IS NULL
                ALTER TABLE dbo.Users ADD IsActive BIT NOT NULL DEFAULT 1;
            IF COL_LENGTH('dbo.Users', 'Email') IS NULL
                ALTER TABLE dbo.Users ADD Email NVARCHAR(256) NOT NULL DEFAULT '';
            IF COL_LENGTH('dbo.Users', 'PasswordHash') IS NULL
                ALTER TABLE dbo.Users ADD PasswordHash NVARCHAR(512) NOT NULL DEFAULT '';
            IF COL_LENGTH('dbo.Users', 'FullName') IS NULL
                ALTER TABLE dbo.Users ADD FullName NVARCHAR(256) NULL;
        END

        IF OBJECT_ID('dbo.Roles', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.Roles (
                Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
                TenantId UNIQUEIDENTIFIER NOT NULL,
                Name NVARCHAR(128) NOT NULL,
                Description NVARCHAR(512) NULL,
                CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2 NULL,
                CreatedBy UNIQUEIDENTIFIER NULL,
                IsDeleted BIT NOT NULL DEFAULT 0,
                CONSTRAINT UQ_Roles_Tenant_Name UNIQUE (TenantId, Name)
            );
        END

        IF OBJECT_ID('dbo.UserRoles', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.UserRoles (
                Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
                TenantId UNIQUEIDENTIFIER NOT NULL,
                UserId UNIQUEIDENTIFIER NOT NULL,
                RoleId UNIQUEIDENTIFIER NOT NULL,
                CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2 NULL,
                CreatedBy UNIQUEIDENTIFIER NULL,
                IsDeleted BIT NOT NULL DEFAULT 0,
                CONSTRAINT FK_UserRoles_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id),
                CONSTRAINT FK_UserRoles_Roles FOREIGN KEY (RoleId) REFERENCES dbo.Roles(Id)
            );
        END

        IF OBJECT_ID('dbo.RefreshTokens', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.RefreshTokens (
                Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
                TenantId UNIQUEIDENTIFIER NOT NULL,
                UserId UNIQUEIDENTIFIER NOT NULL,
                TokenHash NVARCHAR(512) NOT NULL,
                DeviceId NVARCHAR(256) NULL,
                ExpiresAt DATETIME2 NOT NULL,
                IsRevoked BIT NOT NULL DEFAULT 0,
                RevokedAt DATETIME2 NULL,
                ParentTokenId UNIQUEIDENTIFIER NULL,
                ReplacedByTokenId UNIQUEIDENTIFIER NULL,
                CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2 NULL,
                CreatedBy UNIQUEIDENTIFIER NULL,
                IsDeleted BIT NOT NULL DEFAULT 0
            );
        END
        ELSE
        BEGIN
            IF COL_LENGTH('dbo.RefreshTokens', 'UpdatedAt') IS NULL
                ALTER TABLE dbo.RefreshTokens ADD UpdatedAt DATETIME2 NULL;
            IF COL_LENGTH('dbo.RefreshTokens', 'CreatedBy') IS NULL
                ALTER TABLE dbo.RefreshTokens ADD CreatedBy UNIQUEIDENTIFIER NULL;
            IF COL_LENGTH('dbo.RefreshTokens', 'IsDeleted') IS NULL
                ALTER TABLE dbo.RefreshTokens ADD IsDeleted BIT NOT NULL DEFAULT 0;
        END

        IF OBJECT_ID('dbo.AuditLogs', 'U') IS NULL
        BEGIN
            CREATE TABLE dbo.AuditLogs (
                Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
                TenantId UNIQUEIDENTIFIER NOT NULL,
                EntityName NVARCHAR(256) NOT NULL,
                EntityId UNIQUEIDENTIFIER NULL,
                Action NVARCHAR(64) NOT NULL,
                OldValue NVARCHAR(MAX) NULL,
                NewValue NVARCHAR(MAX) NULL,
                PerformedBy UNIQUEIDENTIFIER NULL,
                PerformedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                Ip NVARCHAR(64) NULL,
                CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                UpdatedAt DATETIME2 NULL,
                CreatedBy UNIQUEIDENTIFIER NULL,
                IsDeleted BIT NOT NULL DEFAULT 0
            );
        END
        ELSE
        BEGIN
            IF COL_LENGTH('dbo.AuditLogs', 'CreatedAt') IS NULL
                ALTER TABLE dbo.AuditLogs ADD CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME();
            IF COL_LENGTH('dbo.AuditLogs', 'UpdatedAt') IS NULL
                ALTER TABLE dbo.AuditLogs ADD UpdatedAt DATETIME2 NULL;
            IF COL_LENGTH('dbo.AuditLogs', 'CreatedBy') IS NULL
                ALTER TABLE dbo.AuditLogs ADD CreatedBy UNIQUEIDENTIFIER NULL;
            IF COL_LENGTH('dbo.AuditLogs', 'IsDeleted') IS NULL
                ALTER TABLE dbo.AuditLogs ADD IsDeleted BIT NOT NULL DEFAULT 0;
        END

        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Users_Tenant_Email' AND object_id = OBJECT_ID('dbo.Users'))
            CREATE UNIQUE INDEX IX_Users_Tenant_Email ON dbo.Users (TenantId, Email);

        INSERT INTO dbo.ModuleMigrations (ModuleKey, Version) VALUES ('auth', '0001');
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
