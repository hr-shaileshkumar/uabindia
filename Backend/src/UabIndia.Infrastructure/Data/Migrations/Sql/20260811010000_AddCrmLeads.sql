-- Idempotent companion for AddCrmLeads EF migration.

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'CrmLeads')
BEGIN
    CREATE TABLE [CrmLeads] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL CONSTRAINT [DF_CrmLeads_IsDeleted] DEFAULT 0,
        [LeadCode] nvarchar(64) NOT NULL,
        [LeadName] nvarchar(256) NOT NULL,
        [CompanyName] nvarchar(256) NULL,
        [Email] nvarchar(256) NULL,
        [Phone] nvarchar(64) NULL,
        [Stage] nvarchar(64) NOT NULL CONSTRAINT [DF_CrmLeads_Stage] DEFAULT 'New',
        [Status] nvarchar(64) NOT NULL CONSTRAINT [DF_CrmLeads_Status] DEFAULT 'Open',
        [Value] decimal(18,2) NOT NULL CONSTRAINT [DF_CrmLeads_Value] DEFAULT 0,
        [Probability] int NOT NULL CONSTRAINT [DF_CrmLeads_Probability] DEFAULT 0,
        [ExpectedCloseDate] datetime2 NULL,
        [OwnerName] nvarchar(256) NULL,
        [OwnerUserId] uniqueidentifier NULL,
        [Source] nvarchar(128) NULL,
        [Notes] nvarchar(max) NULL,
        CONSTRAINT [PK_CrmLeads] PRIMARY KEY ([Id])
    );
    CREATE INDEX [IX_CrmLeads_TenantId_Stage] ON [CrmLeads]([TenantId], [Stage]);
    CREATE INDEX [IX_CrmLeads_TenantId_LeadCode] ON [CrmLeads]([TenantId], [LeadCode]);
END
