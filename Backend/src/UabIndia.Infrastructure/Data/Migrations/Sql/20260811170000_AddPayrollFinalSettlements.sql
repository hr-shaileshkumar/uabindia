-- Idempotent companion for PayrollFinalSettlements.

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'PayrollFinalSettlements')
BEGIN
    CREATE TABLE [PayrollFinalSettlements] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        [EmployeeId] uniqueidentifier NOT NULL,
        [EmployeeName] nvarchar(256) NOT NULL,
        [ExitDate] datetime2 NOT NULL,
        [Gratuity] decimal(18,2) NOT NULL DEFAULT 0,
        [LeaveEncashment] decimal(18,2) NOT NULL DEFAULT 0,
        [OtherDues] decimal(18,2) NOT NULL DEFAULT 0,
        [Recoveries] decimal(18,2) NOT NULL DEFAULT 0,
        [TotalSettlement] decimal(18,2) NOT NULL DEFAULT 0,
        [Status] nvarchar(32) NOT NULL DEFAULT 'Pending',
        [Remarks] nvarchar(max) NULL,
        [SettledAt] datetime2 NULL,
        CONSTRAINT [PK_PayrollFinalSettlements] PRIMARY KEY ([Id])
    );
    CREATE INDEX [IX_PayrollFinalSettlements_TenantId_EmployeeId]
        ON [PayrollFinalSettlements]([TenantId], [EmployeeId]);
    CREATE INDEX [IX_PayrollFinalSettlements_TenantId_Status]
        ON [PayrollFinalSettlements]([TenantId], [Status]);
END
