-- Migration: Dynamic Field Schema
-- Adds EntityFieldDefinitions and EntityFieldValues tables
-- Run after existing schema is established
-- Date: 2025

-- ── EntityFieldDefinitions ──────────────────────────────────────────────────
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'EntityFieldDefinitions'
)
BEGIN
    CREATE TABLE [dbo].[EntityFieldDefinitions] (
        [Id]          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        [TenantId]    UNIQUEIDENTIFIER NOT NULL,
        [BusinessId]  NVARCHAR(100)    NULL,
        [EntityName]  NVARCHAR(100)    NOT NULL,   -- e.g. "Employee"
        [FieldKey]    NVARCHAR(100)    NOT NULL,   -- e.g. "blood_group"
        [FieldLabel]  NVARCHAR(200)    NOT NULL,   -- e.g. "Blood Group"
        [FieldType]   NVARCHAR(50)     NOT NULL DEFAULT 'text',  -- text|number|date|boolean|select|multiselect|textarea
        [OptionsJson] NVARCHAR(MAX)    NULL,       -- JSON array for select/multiselect
        [IsRequired]  BIT              NOT NULL DEFAULT 0,
        [IsActive]    BIT              NOT NULL DEFAULT 1,
        [SortOrder]   INT              NOT NULL DEFAULT 0,
        [Section]     NVARCHAR(100)    NULL,
        [CreatedAt]   DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt]   DATETIME2        NULL,
        [CreatedBy]   UNIQUEIDENTIFIER NULL,
        [IsDeleted]   BIT              NOT NULL DEFAULT 0,
        CONSTRAINT [UQ_FieldDef_TenantEntityKey] UNIQUE ([TenantId], [EntityName], [FieldKey])
    );

    CREATE INDEX [IX_EntityFieldDefinitions_TenantEntity]
        ON [dbo].[EntityFieldDefinitions] ([TenantId], [EntityName])
        WHERE [IsDeleted] = 0;

    PRINT 'Created table EntityFieldDefinitions';
END
ELSE
    PRINT 'Table EntityFieldDefinitions already exists – skipped';

GO

-- ── EntityFieldValues ───────────────────────────────────────────────────────
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'EntityFieldValues'
)
BEGIN
    CREATE TABLE [dbo].[EntityFieldValues] (
        [Id]                 UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        [TenantId]           UNIQUEIDENTIFIER NOT NULL,
        [BusinessId]         NVARCHAR(100)    NULL,
        [FieldDefinitionId]  UNIQUEIDENTIFIER NOT NULL,
        [RecordId]           UNIQUEIDENTIFIER NOT NULL,
        [Value]              NVARCHAR(MAX)    NULL,
        [CreatedAt]          DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt]          DATETIME2        NULL,
        [CreatedBy]          UNIQUEIDENTIFIER NULL,
        [IsDeleted]          BIT              NOT NULL DEFAULT 0,
        CONSTRAINT [FK_EntityFieldValues_Definition]
            FOREIGN KEY ([FieldDefinitionId]) REFERENCES [dbo].[EntityFieldDefinitions]([Id])
            ON DELETE CASCADE,
        CONSTRAINT [UQ_FieldValue_DefRecord] UNIQUE ([FieldDefinitionId], [RecordId])
    );

    CREATE INDEX [IX_EntityFieldValues_TenantRecord]
        ON [dbo].[EntityFieldValues] ([TenantId], [RecordId])
        WHERE [IsDeleted] = 0;

    CREATE INDEX [IX_EntityFieldValues_Definition]
        ON [dbo].[EntityFieldValues] ([FieldDefinitionId])
        WHERE [IsDeleted] = 0;

    PRINT 'Created table EntityFieldValues';
END
ELSE
    PRINT 'Table EntityFieldValues already exists – skipped';

GO

PRINT 'Dynamic field schema migration complete.';
