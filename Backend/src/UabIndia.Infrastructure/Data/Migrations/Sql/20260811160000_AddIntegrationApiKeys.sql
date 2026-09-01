-- Idempotent companion for IntegrationApiKeys.

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'IntegrationApiKeys')
BEGIN
    CREATE TABLE [IntegrationApiKeys] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        [Name] nvarchar(128) NOT NULL,
        [Prefix] nvarchar(32) NOT NULL,
        [KeyHash] nvarchar(128) NOT NULL,
        [Scope] nvarchar(64) NOT NULL DEFAULT 'read',
        [Status] nvarchar(32) NOT NULL DEFAULT 'Active',
        [LastUsedAt] datetime2 NULL,
        [RevokedAt] datetime2 NULL,
        CONSTRAINT [PK_IntegrationApiKeys] PRIMARY KEY ([Id])
    );
    CREATE UNIQUE INDEX [IX_IntegrationApiKeys_TenantId_KeyHash]
        ON [IntegrationApiKeys]([TenantId], [KeyHash])
        WHERE [IsDeleted] = 0;
    CREATE INDEX [IX_IntegrationApiKeys_TenantId_Status]
        ON [IntegrationApiKeys]([TenantId], [Status]);
END
