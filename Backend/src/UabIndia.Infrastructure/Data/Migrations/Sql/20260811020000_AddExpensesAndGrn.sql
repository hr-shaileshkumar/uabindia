-- Idempotent companion for AddExpensesAndGrn EF migration.

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'ExpenseClaims')
BEGIN
    CREATE TABLE [ExpenseClaims] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL CONSTRAINT [DF_ExpenseClaims_IsDeleted] DEFAULT 0,
        [ClaimNumber] nvarchar(64) NOT NULL,
        [EmployeeId] uniqueidentifier NULL,
        [EmployeeName] nvarchar(256) NOT NULL CONSTRAINT [DF_ExpenseClaims_EmployeeName] DEFAULT '',
        [Title] nvarchar(256) NOT NULL,
        [Description] nvarchar(max) NULL,
        [Category] nvarchar(64) NOT NULL CONSTRAINT [DF_ExpenseClaims_Category] DEFAULT 'General',
        [Amount] decimal(18,2) NOT NULL CONSTRAINT [DF_ExpenseClaims_Amount] DEFAULT 0,
        [CurrencyCode] nvarchar(8) NOT NULL CONSTRAINT [DF_ExpenseClaims_Currency] DEFAULT 'INR',
        [ExpenseDate] datetime2 NOT NULL,
        [Status] nvarchar(32) NOT NULL CONSTRAINT [DF_ExpenseClaims_Status] DEFAULT 'Draft',
        [ReceiptUrl] nvarchar(max) NULL,
        [ApprovedBy] nvarchar(256) NULL,
        [SubmittedAt] datetime2 NULL,
        CONSTRAINT [PK_ExpenseClaims] PRIMARY KEY ([Id])
    );
    CREATE INDEX [IX_ExpenseClaims_TenantId_Status] ON [ExpenseClaims]([TenantId], [Status]);
END

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'GoodsReceiptNotes')
BEGIN
    CREATE TABLE [GoodsReceiptNotes] (
        [Id] uniqueidentifier NOT NULL,
        [TenantId] uniqueidentifier NOT NULL,
        [BusinessId] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedBy] uniqueidentifier NULL,
        [IsDeleted] bit NOT NULL CONSTRAINT [DF_GoodsReceiptNotes_IsDeleted] DEFAULT 0,
        [GrnNumber] nvarchar(64) NOT NULL,
        [PurchaseOrderId] uniqueidentifier NULL,
        [PoNumber] nvarchar(64) NULL,
        [VendorId] uniqueidentifier NOT NULL,
        [VendorName] nvarchar(256) NULL,
        [ReceivedDate] datetime2 NOT NULL,
        [TotalItems] int NOT NULL CONSTRAINT [DF_GoodsReceiptNotes_TotalItems] DEFAULT 0,
        [TotalAmount] decimal(18,2) NOT NULL CONSTRAINT [DF_GoodsReceiptNotes_TotalAmount] DEFAULT 0,
        [Status] nvarchar(32) NOT NULL CONSTRAINT [DF_GoodsReceiptNotes_Status] DEFAULT 'PendingQC',
        [Remarks] nvarchar(max) NULL,
        CONSTRAINT [PK_GoodsReceiptNotes] PRIMARY KEY ([Id])
    );
    CREATE INDEX [IX_GoodsReceiptNotes_TenantId_Status] ON [GoodsReceiptNotes]([TenantId], [Status]);
    CREATE INDEX [IX_GoodsReceiptNotes_TenantId_VendorId] ON [GoodsReceiptNotes]([TenantId], [VendorId]);
END
