-- Idempotent companion for AddTravelAndAiAgents EF migration.

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TravelRequests')
BEGIN
    CREATE TABLE [TravelRequests] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        [RequestNumber] nvarchar(64) NOT NULL,
        [EmployeeId] uniqueidentifier NOT NULL,
        [EmployeeName] nvarchar(max) NOT NULL,
        [Destination] nvarchar(max) NOT NULL,
        [Purpose] nvarchar(max) NOT NULL,
        [StartDate] datetime2 NOT NULL,
        [EndDate] datetime2 NOT NULL,
        [EstimatedAmount] decimal(18,2) NOT NULL DEFAULT 0,
        [CurrencyCode] nvarchar(8) NOT NULL DEFAULT 'INR',
        [Status] nvarchar(32) NOT NULL DEFAULT 'Draft',
        CONSTRAINT [PK_TravelRequests] PRIMARY KEY ([Id])
    );
    CREATE INDEX [IX_TravelRequests_TenantId_Status] ON [TravelRequests]([TenantId], [Status]);
END

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'AiAgents')
BEGIN
    CREATE TABLE [AiAgents] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        [AgentKey] nvarchar(128) NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        [Description] nvarchar(max) NULL,
        [Provider] nvarchar(64) NOT NULL DEFAULT 'OpenAI',
        [ModelName] nvarchar(max) NOT NULL DEFAULT '',
        [Category] nvarchar(64) NOT NULL DEFAULT 'General',
        [IsEnabled] bit NOT NULL DEFAULT 0,
        CONSTRAINT [PK_AiAgents] PRIMARY KEY ([Id])
    );
    CREATE UNIQUE INDEX [IX_AiAgents_TenantId_AgentKey] ON [AiAgents]([TenantId], [AgentKey]);
END
