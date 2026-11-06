-- Idempotent companion for SSO providers, IP rules, MFA enrollments, and tenant security policy.

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SecurityPolicies')
BEGIN
    CREATE TABLE [SecurityPolicies] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        [MinLength] int NOT NULL DEFAULT 8,
        [RequireUppercase] bit NOT NULL DEFAULT 1,
        [RequireLowercase] bit NOT NULL DEFAULT 1,
        [RequireNumber] bit NOT NULL DEFAULT 1,
        [RequireSpecial] bit NOT NULL DEFAULT 0,
        [MaxAgeDays] int NOT NULL DEFAULT 90,
        [MaxFailedAttempts] int NOT NULL DEFAULT 5,
        [LockoutMinutes] int NOT NULL DEFAULT 15,
        [RequireMfaPlatformAdmins] bit NOT NULL DEFAULT 0,
        [RequireMfaTenantAdmins] bit NOT NULL DEFAULT 0,
        [AllowTotp] bit NOT NULL DEFAULT 1,
        [AllowSmsOtp] bit NOT NULL DEFAULT 0,
        CONSTRAINT [PK_SecurityPolicies] PRIMARY KEY ([Id])
    );
    CREATE UNIQUE INDEX [IX_SecurityPolicies_TenantId]
        ON [SecurityPolicies]([TenantId])
        WHERE [IsDeleted] = 0;
END

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SsoIdentityProviders')
BEGIN
    CREATE TABLE [SsoIdentityProviders] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        [Name] nvarchar(128) NOT NULL,
        [Protocol] nvarchar(32) NOT NULL DEFAULT 'OIDC',
        [Provider] nvarchar(64) NOT NULL DEFAULT 'Custom',
        [Issuer] nvarchar(512) NOT NULL DEFAULT '',
        [ClientId] nvarchar(256) NOT NULL DEFAULT '',
        [ClientSecretHash] nvarchar(128) NULL,
        [MetadataUrl] nvarchar(512) NULL,
        [RedirectUri] nvarchar(512) NULL,
        [Scopes] nvarchar(256) NULL,
        [Status] nvarchar(32) NOT NULL DEFAULT 'Inactive',
        [LastError] nvarchar(max) NULL,
        [LastTestedAt] datetime2 NULL,
        [EnabledAt] datetime2 NULL,
        CONSTRAINT [PK_SsoIdentityProviders] PRIMARY KEY ([Id])
    );
    CREATE INDEX [IX_SsoIdentityProviders_TenantId_Status]
        ON [SsoIdentityProviders]([TenantId], [Status]);
END

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'IpAccessRules')
BEGIN
    CREATE TABLE [IpAccessRules] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        [IpRange] nvarchar(64) NOT NULL,
        [Description] nvarchar(256) NULL,
        [Action] nvarchar(16) NOT NULL DEFAULT 'ALLOW',
        [Status] nvarchar(32) NOT NULL DEFAULT 'Active',
        CONSTRAINT [PK_IpAccessRules] PRIMARY KEY ([Id])
    );
    CREATE INDEX [IX_IpAccessRules_TenantId_Status]
        ON [IpAccessRules]([TenantId], [Status]);
END

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'MfaEnrollments')
BEGIN
    CREATE TABLE [MfaEnrollments] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        [UserId] uniqueidentifier NULL,
        [UserName] nvarchar(256) NOT NULL DEFAULT '',
        [UserEmail] nvarchar(256) NOT NULL DEFAULT '',
        [Method] nvarchar(32) NOT NULL DEFAULT 'TOTP',
        [Status] nvarchar(32) NOT NULL DEFAULT 'Pending',
        [EnrolledAt] datetime2 NULL,
        CONSTRAINT [PK_MfaEnrollments] PRIMARY KEY ([Id])
    );
    CREATE INDEX [IX_MfaEnrollments_TenantId_Status]
        ON [MfaEnrollments]([TenantId], [Status]);
END
