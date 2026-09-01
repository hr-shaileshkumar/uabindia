-- Idempotent companion for payroll loans, bonuses, and arrears.

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'PayrollLoans')
BEGIN
    CREATE TABLE [PayrollLoans] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        [EmployeeId] uniqueidentifier NOT NULL,
        [EmployeeName] nvarchar(256) NOT NULL,
        [EmployeeCode] nvarchar(64) NOT NULL DEFAULT '',
        [LoanType] nvarchar(64) NOT NULL DEFAULT 'Personal Loan',
        [PrincipalAmount] decimal(18,2) NOT NULL DEFAULT 0,
        [OutstandingAmount] decimal(18,2) NOT NULL DEFAULT 0,
        [EmiAmount] decimal(18,2) NOT NULL DEFAULT 0,
        [InterestRate] decimal(18,4) NOT NULL DEFAULT 0,
        [DisbursementDate] datetime2 NOT NULL,
        [TotalInstallments] int NOT NULL DEFAULT 12,
        [InstallmentsPaid] int NOT NULL DEFAULT 0,
        [Purpose] nvarchar(max) NULL,
        [Status] nvarchar(32) NOT NULL DEFAULT 'Pending',
        [ClosedAt] datetime2 NULL,
        CONSTRAINT [PK_PayrollLoans] PRIMARY KEY ([Id])
    );
    CREATE INDEX [IX_PayrollLoans_TenantId_EmployeeId] ON [PayrollLoans]([TenantId], [EmployeeId]);
    CREATE INDEX [IX_PayrollLoans_TenantId_Status] ON [PayrollLoans]([TenantId], [Status]);
END

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'PayrollBonuses')
BEGIN
    CREATE TABLE [PayrollBonuses] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        [EmployeeId] uniqueidentifier NOT NULL,
        [EmployeeName] nvarchar(256) NOT NULL,
        [EmployeeCode] nvarchar(64) NOT NULL DEFAULT '',
        [BonusType] nvarchar(64) NOT NULL DEFAULT 'Performance Bonus',
        [Amount] decimal(18,2) NOT NULL DEFAULT 0,
        [PaymentMonth] nvarchar(16) NOT NULL,
        [Remarks] nvarchar(max) NULL,
        [Status] nvarchar(32) NOT NULL DEFAULT 'Pending',
        [PaidAt] datetime2 NULL,
        CONSTRAINT [PK_PayrollBonuses] PRIMARY KEY ([Id])
    );
    CREATE INDEX [IX_PayrollBonuses_TenantId_EmployeeId] ON [PayrollBonuses]([TenantId], [EmployeeId]);
    CREATE INDEX [IX_PayrollBonuses_TenantId_Status] ON [PayrollBonuses]([TenantId], [Status]);
END

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'PayrollArrears')
BEGIN
    CREATE TABLE [PayrollArrears] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL DEFAULT 0,
        [EmployeeId] uniqueidentifier NOT NULL,
        [EmployeeName] nvarchar(256) NOT NULL,
        [EmployeeCode] nvarchar(64) NOT NULL DEFAULT '',
        [Period] nvarchar(16) NOT NULL,
        [Amount] decimal(18,2) NOT NULL DEFAULT 0,
        [Reason] nvarchar(128) NOT NULL DEFAULT 'Other',
        [Status] nvarchar(32) NOT NULL DEFAULT 'Pending',
        [ProcessedAt] datetime2 NULL,
        CONSTRAINT [PK_PayrollArrears] PRIMARY KEY ([Id])
    );
    CREATE INDEX [IX_PayrollArrears_TenantId_EmployeeId] ON [PayrollArrears]([TenantId], [EmployeeId]);
    CREATE INDEX [IX_PayrollArrears_TenantId_Status] ON [PayrollArrears]([TenantId], [Status]);
END
