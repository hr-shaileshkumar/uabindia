-- Idempotent companion for AddBankReconciliations EF migration.

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'BankReconciliations')
BEGIN
    CREATE TABLE [BankReconciliations] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL CONSTRAINT [DF_BankReconciliations_IsDeleted] DEFAULT 0,
        [AccountId] uniqueidentifier NOT NULL,
        [AccountCode] nvarchar(64) NOT NULL,
        [AccountName] nvarchar(256) NOT NULL,
        [Period] nvarchar(16) NOT NULL,
        [BookBalance] decimal(18,2) NOT NULL CONSTRAINT [DF_BankReconciliations_BookBalance] DEFAULT 0,
        [BankBalance] decimal(18,2) NOT NULL CONSTRAINT [DF_BankReconciliations_BankBalance] DEFAULT 0,
        [Difference] decimal(18,2) NOT NULL CONSTRAINT [DF_BankReconciliations_Difference] DEFAULT 0,
        [Status] nvarchar(32) NOT NULL CONSTRAINT [DF_BankReconciliations_Status] DEFAULT 'Pending',
        [ReconciledAt] datetime2 NOT NULL,
        [Remarks] nvarchar(max) NULL,
        CONSTRAINT [PK_BankReconciliations] PRIMARY KEY ([Id])
    );
    CREATE INDEX [IX_BankReconciliations_TenantId_Period] ON [BankReconciliations]([TenantId], [Period]);
    CREATE INDEX [IX_BankReconciliations_TenantId_AccountId] ON [BankReconciliations]([TenantId], [AccountId]);
END
