USE [UabIndia_ERP_Dev];
GO

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

DECLARE @TenantId UNIQUEIDENTIFIER = '4B71B061-6D66-4030-833F-16247CB924A7';
DECLARE @CompanyId UNIQUEIDENTIFIER;
SELECT TOP 1 @CompanyId = Id FROM Companies WHERE TenantId = @TenantId AND IsDeleted = 0;

DECLARE @BatchPayoutId UNIQUEIDENTIFIER = 'F3333333-3333-3333-3333-333333333333';
IF NOT EXISTS (SELECT 1 FROM DisbursementBatches WHERE Id = @BatchPayoutId)
BEGIN
    INSERT INTO DisbursementBatches (Id, TenantId, CompanyId, BatchNumber, DisbursementType, PaymentMode, DebitAccountNumber, TotalAmount, TotalBeneficiaries, Status, GatewayProvider, CreatedAt, IsDeleted)
    VALUES (@BatchPayoutId, @TenantId, @CompanyId, 'PAY-BATCH-20261105-01', 'VendorPayments', 'NEFT', '000105001234', 575850, 3, 'Draft', 'ICICI_Connected_Banking', GETUTCDATE(), 0);

    INSERT INTO DisbursementItems (Id, TenantId, DisbursementBatchId, BeneficiaryName, BeneficiaryAccountNumber, BeneficiaryIfsc, Amount, Status, CreatedAt, IsDeleted)
    VALUES (NEWID(), @TenantId, @BatchPayoutId, 'Bharat Precision Forgings (Micro)', '50200012345678', 'HDFC0000123', 174000, 'Pending', GETUTCDATE(), 0),
           (NEWID(), @TenantId, @BatchPayoutId, 'Zenith Tooling & Dies (Small)', '000105009876', 'ICIC0000001', 302400, 'Pending', GETUTCDATE(), 0),
           (NEWID(), @TenantId, @BatchPayoutId, 'Delta Packaging Solutions (Micro)', '30012345678', 'SBIN0000456', 99450, 'Pending', GETUTCDATE(), 0);
END

PRINT 'Disbursement demo batch seeded!';

