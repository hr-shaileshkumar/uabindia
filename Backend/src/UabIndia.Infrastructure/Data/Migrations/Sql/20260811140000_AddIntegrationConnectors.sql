-- Idempotent companion for IntegrationConnectors + IntegrationSyncLogs (Horizon 2).

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'IntegrationConnectors')
BEGIN
    CREATE TABLE [IntegrationConnectors] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        [ConnectorKey] nvarchar(64) NOT NULL,
        [Name] nvarchar(256) NOT NULL,
        [Provider] nvarchar(128) NOT NULL,
        [Category] nvarchar(64) NOT NULL DEFAULT 'Integration',
        [Status] nvarchar(32) NOT NULL DEFAULT 'Inactive',
        [ConfigJson] nvarchar(max) NULL,
        [LastTestedAt] datetime2 NULL,
        [LastSyncAt] datetime2 NULL,
        [LastError] nvarchar(max) NULL,
        CONSTRAINT [PK_IntegrationConnectors] PRIMARY KEY ([Id])
    );
    CREATE UNIQUE INDEX [IX_IntegrationConnectors_TenantId_ConnectorKey]
        ON [IntegrationConnectors]([TenantId], [ConnectorKey])
        WHERE [IsDeleted] = 0;
    CREATE INDEX [IX_IntegrationConnectors_TenantId_Status]
        ON [IntegrationConnectors]([TenantId], [Status]);
END

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'IntegrationSyncLogs')
BEGIN
    CREATE TABLE [IntegrationSyncLogs] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        [ConnectorId] uniqueidentifier NOT NULL,
        [ConnectorKey] nvarchar(64) NOT NULL,
        [Direction] nvarchar(32) NOT NULL DEFAULT 'Outbound',
        [Operation] nvarchar(64) NOT NULL DEFAULT 'Sync',
        [Status] nvarchar(32) NOT NULL DEFAULT 'Success',
        [RecordsProcessed] int NOT NULL DEFAULT 0,
        [Message] nvarchar(max) NULL,
        [DetailsJson] nvarchar(max) NULL,
        [StartedAt] datetime2 NOT NULL,
        [CompletedAt] datetime2 NULL,
        CONSTRAINT [PK_IntegrationSyncLogs] PRIMARY KEY ([Id])
    );
    CREATE INDEX [IX_IntegrationSyncLogs_TenantId_ConnectorId]
        ON [IntegrationSyncLogs]([TenantId], [ConnectorId]);
    CREATE INDEX [IX_IntegrationSyncLogs_TenantId_StartedAt]
        ON [IntegrationSyncLogs]([TenantId], [StartedAt] DESC);
END
