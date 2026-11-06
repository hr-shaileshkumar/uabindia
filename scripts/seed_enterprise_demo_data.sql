USE [UabIndia_ERP_Dev];
GO

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

DECLARE @TenantId UNIQUEIDENTIFIER = '4B71B061-6D66-4030-833F-16247CB924A7'; -- Default ERP Tenant
DECLARE @CompanyId UNIQUEIDENTIFIER;

SELECT TOP 1 @CompanyId = Id FROM Companies WHERE TenantId = @TenantId AND IsDeleted = 0;
IF @CompanyId IS NULL
BEGIN
    SET @CompanyId = NEWID();
    INSERT INTO Companies (Id, TenantId, Name, Code, IsActive, CreatedAt, IsDeleted)
    VALUES (@CompanyId, @TenantId, 'UabIndia Enterprise Solutions Ltd.', 'UAB-HQ', 1, GETUTCDATE(), 0);
END

-- 1. Ensure Main Warehouse
DECLARE @WarehouseId UNIQUEIDENTIFIER;
SELECT TOP 1 @WarehouseId = Id FROM Warehouses WHERE TenantId = @TenantId AND IsDeleted = 0;
IF @WarehouseId IS NULL
BEGIN
    SET @WarehouseId = NEWID();
    INSERT INTO Warehouses (Id, TenantId, CompanyId, WarehouseCode, WarehouseName, City, State, Country, IsDefault, IsActive, CreatedAt, IsDeleted)
    VALUES (@WarehouseId, @TenantId, @CompanyId, 'WH-BHIWANDI', 'Central Logistics & Fulfillment Warehouse', 'Mumbai', 'Maharashtra', 'India', 1, 1, GETUTCDATE(), 0);
END

-- 2. Seed MSME Vendors
DECLARE @Vendor1Id UNIQUEIDENTIFIER = 'A1111111-1111-1111-1111-111111111111';
DECLARE @Vendor2Id UNIQUEIDENTIFIER = 'A2222222-2222-2222-2222-222222222222';
DECLARE @Vendor3Id UNIQUEIDENTIFIER = 'A3333333-3333-3333-3333-333333333333';

IF NOT EXISTS (SELECT 1 FROM Vendors WHERE Id = @Vendor1Id)
BEGIN
    INSERT INTO Vendors (Id, TenantId, CompanyId, VendorCode, VendorName, VendorType, GSTNumber, PANNumber, Email, BankName, BankAccountNumber, IFSCCode, CreditLimit, PaymentTerms, OpeningBalance, CurrentBalance, IsMsmeRegistered, MsmeCategory, MsmeUdyamRegistrationNumber, MsmePaymentTermsDays, Status, CreatedAt, IsDeleted)
    VALUES (@Vendor1Id, @TenantId, @CompanyId, 'VND-MSME-01', 'Bharat Precision Forgings (Micro)', 'Supplier', '27AABCB1234F1Z5', 'AABCB1234F', 'accounts@bharatforgings.in', 'HDFC Bank', '50200012345678', 'HDFC0000123', 500000, 45, 0, 174000, 1, 'Micro', 'UDYAM-MH-03-0012345', 45, 'Active', GETUTCDATE(), 0);
END

IF NOT EXISTS (SELECT 1 FROM Vendors WHERE Id = @Vendor2Id)
BEGIN
    INSERT INTO Vendors (Id, TenantId, CompanyId, VendorCode, VendorName, VendorType, GSTNumber, PANNumber, Email, BankName, BankAccountNumber, IFSCCode, CreditLimit, PaymentTerms, OpeningBalance, CurrentBalance, IsMsmeRegistered, MsmeCategory, MsmeUdyamRegistrationNumber, MsmePaymentTermsDays, Status, CreatedAt, IsDeleted)
    VALUES (@Vendor2Id, @TenantId, @CompanyId, 'VND-MSME-02', 'Zenith Tooling & Dies (Small)', 'Supplier', '07AAACZ9876K1Z2', 'AAACZ9876K', 'billing@zenithtooling.co.in', 'ICICI Bank', '000105009876', 'ICIC0000001', 1000000, 45, 0, 302400, 1, 'Small', 'UDYAM-DL-01-0098765', 45, 'Active', GETUTCDATE(), 0);
END

IF NOT EXISTS (SELECT 1 FROM Vendors WHERE Id = @Vendor3Id)
BEGIN
    INSERT INTO Vendors (Id, TenantId, CompanyId, VendorCode, VendorName, VendorType, GSTNumber, PANNumber, Email, BankName, BankAccountNumber, IFSCCode, CreditLimit, PaymentTerms, OpeningBalance, CurrentBalance, IsMsmeRegistered, MsmeCategory, MsmeUdyamRegistrationNumber, MsmePaymentTermsDays, Status, CreatedAt, IsDeleted)
    VALUES (@Vendor3Id, @TenantId, @CompanyId, 'VND-MSME-03', 'Delta Packaging Solutions (Micro)', 'Supplier', '24ABCPD5566L1Z8', 'ABCPD5566L', 'sales@deltapack.in', 'State Bank of India', '30012345678', 'SBIN0000456', 300000, 45, 0, 99450, 1, 'Micro', 'UDYAM-GJ-04-0044556', 45, 'Active', GETUTCDATE(), 0);
END

-- 3. Seed MSME & TDS Invoices
DECLARE @Inv1Id UNIQUEIDENTIFIER = 'B1111111-1111-1111-1111-111111111111';
IF NOT EXISTS (SELECT 1 FROM PurchaseInvoices WHERE Id = @Inv1Id)
BEGIN
    INSERT INTO PurchaseInvoices (Id, TenantId, CompanyId, InvoiceNumber, InvoiceDate, VendorId, SubTotal, TaxAmount, DiscountAmount, OtherCharges, TotalAmount, TdsSection, TdsRate, TdsAmount, NetAmountPayable, IsMsmeInvoice, MsmeDueDate, IsSection43bDisallowed, PaidAmount, BalanceAmount, Status, PaymentStatus, CreatedAt, IsDeleted)
    VALUES (@Inv1Id, @TenantId, @CompanyId, 'INV-BPF-2026-081', DATEADD(DAY, -38, GETUTCDATE()), @Vendor1Id, 150000, 27000, 0, 0, 177000, '194C', 2.0, 3000, 174000, 1, DATEADD(DAY, 7, GETUTCDATE()), 0, 0, 174000, 'Unpaid', 'Pending', GETUTCDATE(), 0);
END

DECLARE @Inv2Id UNIQUEIDENTIFIER = 'B2222222-2222-2222-2222-222222222222';
IF NOT EXISTS (SELECT 1 FROM PurchaseInvoices WHERE Id = @Inv2Id)
BEGIN
    INSERT INTO PurchaseInvoices (Id, TenantId, CompanyId, InvoiceNumber, InvoiceDate, VendorId, SubTotal, TaxAmount, DiscountAmount, OtherCharges, TotalAmount, TdsSection, TdsRate, TdsAmount, NetAmountPayable, IsMsmeInvoice, MsmeDueDate, IsSection43bDisallowed, PaidAmount, BalanceAmount, Status, PaymentStatus, CreatedAt, IsDeleted)
    VALUES (@Inv2Id, @TenantId, @CompanyId, 'INV-ZTD-2026-014', DATEADD(DAY, -52, GETUTCDATE()), @Vendor2Id, 280000, 50400, 0, 0, 330400, '194J', 10.0, 28000, 302400, 1, DATEADD(DAY, -7, GETUTCDATE()), 1, 0, 302400, 'Unpaid', 'Overdue', GETUTCDATE(), 0);
END

DECLARE @Inv3Id UNIQUEIDENTIFIER = 'B3333333-3333-3333-3333-333333333333';
IF NOT EXISTS (SELECT 1 FROM PurchaseInvoices WHERE Id = @Inv3Id)
BEGIN
    INSERT INTO PurchaseInvoices (Id, TenantId, CompanyId, InvoiceNumber, InvoiceDate, VendorId, SubTotal, TaxAmount, DiscountAmount, OtherCharges, TotalAmount, TdsSection, TdsRate, TdsAmount, NetAmountPayable, IsMsmeInvoice, MsmeDueDate, IsSection43bDisallowed, PaidAmount, BalanceAmount, Status, PaymentStatus, CreatedAt, IsDeleted)
    VALUES (@Inv3Id, @TenantId, @CompanyId, 'INV-DPS-2026-112', DATEADD(DAY, -15, GETUTCDATE()), @Vendor3Id, 85000, 15300, 0, 0, 100300, '194C', 1.0, 850, 99450, 1, DATEADD(DAY, 30, GETUTCDATE()), 0, 0, 99450, 'Unpaid', 'Pending', GETUTCDATE(), 0);
END

-- 4. Seed Batch-Tracked & Serial-Tracked Items
DECLARE @Item1Id UNIQUEIDENTIFIER = 'C1111111-1111-1111-1111-111111111111';
DECLARE @Item2Id UNIQUEIDENTIFIER = 'C2222222-2222-2222-2222-222222222222';

IF NOT EXISTS (SELECT 1 FROM Items WHERE Id = @Item1Id)
BEGIN
    INSERT INTO Items (Id, TenantId, CompanyId, ItemCode, ItemName, ItemType, Category, UnitOfMeasure, HSNCode, PurchasePrice, SellingPrice, MRP, MinStockLevel, MaxStockLevel, ReorderLevel, ReorderQuantity, CurrentStock, IsBatchTracked, ShelfLifeDays, IsTaxable, TaxRate, IsActive, CreatedAt, IsDeleted)
    VALUES (@Item1Id, @TenantId, @CompanyId, 'RAW-PHARMA-501', 'Paracetamol IP 500mg Granules (Pharma Grade)', 'Stockable', 'Raw Material', 'Kg', '300490', 320, 480, 520, 50, 2000, 100, 200, 500, 1, 365, 1, 18.0, 1, GETUTCDATE(), 0);
END

IF NOT EXISTS (SELECT 1 FROM Items WHERE Id = @Item2Id)
BEGIN
    INSERT INTO Items (Id, TenantId, CompanyId, ItemCode, ItemName, ItemType, Category, UnitOfMeasure, HSNCode, PurchasePrice, SellingPrice, MRP, MinStockLevel, MaxStockLevel, ReorderLevel, ReorderQuantity, CurrentStock, IsSerialTracked, IsTaxable, TaxRate, IsActive, CreatedAt, IsDeleted)
    VALUES (@Item2Id, @TenantId, @CompanyId, 'EQP-ANODE-802', 'High-Efficiency Industrial Electroplating Anodes', 'Stockable', 'Capital Equipment', 'Pcs', '846693', 18500, 24000, 26000, 2, 50, 5, 10, 15, 1, 1, 18.0, 1, GETUTCDATE(), 0);
END

-- 5. Seed Item Batches (FEFO priority test)
DECLARE @Batch1Id UNIQUEIDENTIFIER = 'D1111111-1111-1111-1111-111111111111';
IF NOT EXISTS (SELECT 1 FROM ItemBatches WHERE Id = @Batch1Id)
BEGIN
    INSERT INTO ItemBatches (Id, TenantId, CompanyId, ItemId, WarehouseId, BatchNumber, LotNumber, ManufactureDate, ExpiryDate, QuantityReceived, QuantityCurrent, UnitCost, Status, CreatedAt, IsDeleted)
    VALUES (@Batch1Id, @TenantId, @CompanyId, @Item1Id, @WarehouseId, 'BAT-PARA-2026-A1', 'LOT-QC-991', DATEADD(DAY, -340, GETUTCDATE()), DATEADD(DAY, 25, GETUTCDATE()), 500, 450, 320, 'Active', GETUTCDATE(), 0);
END

-- 6. Seed Serial Numbers
DECLARE @Serial1Id UNIQUEIDENTIFIER = 'E1111111-1111-1111-1111-111111111111';
DECLARE @Serial2Id UNIQUEIDENTIFIER = 'E2222222-2222-2222-2222-222222222222';
IF NOT EXISTS (SELECT 1 FROM ItemSerialNumbers WHERE Id = @Serial1Id)
BEGIN
    INSERT INTO ItemSerialNumbers (Id, TenantId, CompanyId, ItemId, WarehouseId, SerialNumber, Status, WarrantyExpiryDate, CreatedAt, IsDeleted)
    VALUES (@Serial1Id, @TenantId, @CompanyId, @Item2Id, @WarehouseId, 'SN-ANODE-2026-001', 'InStock', DATEADD(YEAR, 1, GETUTCDATE()), GETUTCDATE(), 0);
    
    INSERT INTO ItemSerialNumbers (Id, TenantId, CompanyId, ItemId, WarehouseId, SerialNumber, Status, WarrantyExpiryDate, AssignedCustomerOrProject, CreatedAt, IsDeleted)
    VALUES (@Serial2Id, @TenantId, @CompanyId, @Item2Id, NULL, 'SN-ANODE-2026-002', 'Dispatched', DATEADD(MONTH, 8, GETUTCDATE()), 'Tata Motors Pune Plant', GETUTCDATE(), 0);
END

-- 7. Seed Quality Inspection Lots & NCR
DECLARE @QcLotId UNIQUEIDENTIFIER = 'F1111111-1111-1111-1111-111111111111';
IF NOT EXISTS (SELECT 1 FROM QualityInspectionLots WHERE Id = @QcLotId)
BEGIN
    INSERT INTO QualityInspectionLots (Id, TenantId, CompanyId, LotNumber, SourceType, ReferenceNumber, ItemId, BatchNumber, QuantityToInspect, SampleQuantity, PassedQuantity, RejectedQuantity, InspectionStatus, InspectorName, InspectionDate, CertificateOfAnalysisUrl, CreatedAt, IsDeleted)
    VALUES (@QcLotId, @TenantId, @CompanyId, 'QC-GRN-2026-0104', 'GRN', 'GRN-2026-0988', @Item1Id, 'BAT-PARA-2026-A1', 500, 10, 10, 0, 'Passed', 'Dr. Arvind Sharma (QA Head)', GETUTCDATE(), '/reports/coa/QC-GRN-2026-0104.pdf', GETUTCDATE(), 0);

    INSERT INTO QualityInspectionParameters (Id, TenantId, QualityInspectionLotId, ParameterName, StandardSpecification, MinAcceptable, MaxAcceptable, ActualMeasurement, UnitOfMeasure, Result, CreatedAt, IsDeleted)
    VALUES (NEWID(), @TenantId, @QcLotId, 'Assay Purity', '99.0% - 101.0%', 99.0, 101.0, 99.85, '%', 'Pass', GETUTCDATE(), 0),
           (NEWID(), @TenantId, @QcLotId, 'Moisture Content (LOD)', 'Max 0.50%', 0.0, 0.50, 0.22, '%', 'Pass', GETUTCDATE(), 0);
END

-- 8. Seed Subcontracting (Job Work GST Rule 55)
DECLARE @SubcontractId UNIQUEIDENTIFIER = 'F2222222-2222-2222-2222-222222222222';
IF NOT EXISTS (SELECT 1 FROM SubcontractOrders WHERE Id = @SubcontractId)
BEGIN
    INSERT INTO SubcontractOrders (Id, TenantId, CompanyId, OrderNumber, DeliveryChallanNumber, ChallanDate, VendorId, ProcessDescription, ExpectedReturnDate, TotalRawMaterialValue, AgreedServiceRate, ServiceTaxAmount, TotalServiceAmount, Status, CreatedAt, IsDeleted)
    VALUES (@SubcontractId, @TenantId, @CompanyId, 'SCO-2026-0041', 'CHL-RULE55-2026-0108', DATEADD(DAY, -20, GETUTCDATE()), @Vendor1Id, 'Precision CNC Profiling & Phosphate Coating', DATEADD(DAY, 160, GETUTCDATE()), 420000, 35000, 6300, 41300, 'ChallanIssued', GETUTCDATE(), 0);
END

PRINT 'Demo data seeded successfully for UabIndia Enterprise!';
