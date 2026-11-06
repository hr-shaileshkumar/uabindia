using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Infrastructure.Services;
using UabIndia.Tests.TestUtilities;
using Xunit;

namespace UabIndia.Tests
{
    public class InventoryAndConversionServiceTests
    {
        private static (
            ApplicationDbContext Db,
            InventoryStockService Stock,
            GoodsReceiptService Grn,
            DocumentConversionService Conversions,
            TestTenantAccessor Tenant) CreateSut()
        {
            var tenant = new TestTenantAccessor();
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            var db = new ApplicationDbContext(options, tenant, new TestEncryptionService());
            var numbers = new DocumentNumberService(db, tenant);
            var stock = new InventoryStockService(db, tenant, numbers);
            return (
                db,
                stock,
                new GoodsReceiptService(db, tenant, stock),
                new DocumentConversionService(db, tenant, numbers),
                tenant);
        }

        [Fact]
        public async Task RecordIn_IncreasesItemStock()
        {
            var (db, stock, _, _, tenant) = CreateSut();
            await using var _ = db;
            var item = new Item
            {
                TenantId = tenant.GetTenantId(),
                ItemCode = "SKU-1",
                ItemName = "Bolt",
                CurrentStock = 10,
                PurchasePrice = 5,
                CreatedAt = DateTime.UtcNow
            };
            db.Items.Add(item);
            await db.SaveChangesAsync();

            await stock.RecordAsync(new RecordStockMovementCommand(
                DateTime.UtcNow.Date,
                "In",
                item.Id,
                null,
                4,
                5,
                0,
                null,
                null,
                null,
                null,
                null,
                null,
                null));

            var stored = await db.Items.SingleAsync(i => i.Id == item.Id);
            Assert.Equal(14m, stored.CurrentStock);
        }

        [Fact]
        public async Task RecordOut_ThrowsWhenInsufficientStock()
        {
            var (db, stock, _, _, tenant) = CreateSut();
            await using var _ = db;
            var item = new Item
            {
                TenantId = tenant.GetTenantId(),
                ItemCode = "SKU-2",
                ItemName = "Nut",
                CurrentStock = 2,
                PurchasePrice = 1,
                CreatedAt = DateTime.UtcNow
            };
            db.Items.Add(item);
            await db.SaveChangesAsync();

            await Assert.ThrowsAsync<InvalidOperationException>(() => stock.RecordAsync(new RecordStockMovementCommand(
                DateTime.UtcNow.Date,
                "Out",
                item.Id,
                null,
                5,
                1,
                0,
                null,
                null,
                null,
                null,
                null,
                null,
                null)));
        }

        [Fact]
        public async Task AcceptGrn_PostsInboundStockAndMarksPoReceived()
        {
            var (db, _, grnService, _, tenant) = CreateSut();
            await using var _ = db;
            var tenantId = tenant.GetTenantId();
            var item = new Item
            {
                TenantId = tenantId,
                ItemCode = "SKU-3",
                ItemName = "Washer",
                CurrentStock = 0,
                PurchasePrice = 8,
                CreatedAt = DateTime.UtcNow
            };
            var vendor = new Vendor
            {
                TenantId = tenantId,
                VendorCode = "V-1",
                VendorName = "Supplier",
                CreatedAt = DateTime.UtcNow
            };
            db.Items.Add(item);
            db.Vendors.Add(vendor);
            await db.SaveChangesAsync();

            var po = new PurchaseOrder
            {
                TenantId = tenantId,
                PONumber = "PO-00001",
                PODate = DateTime.UtcNow.Date,
                VendorId = vendor.Id,
                TotalAmount = 80,
                Status = "Approved",
                CreatedAt = DateTime.UtcNow
            };
            po.Items.Add(new PurchaseOrderItem
            {
                TenantId = tenantId,
                ItemId = item.Id,
                Quantity = 10,
                PendingQuantity = 10,
                UnitPrice = 8,
                TotalAmount = 80,
                CreatedAt = DateTime.UtcNow
            });
            db.PurchaseOrders.Add(po);
            var grn = new GoodsReceiptNote
            {
                TenantId = tenantId,
                GrnNumber = "GRN-00001",
                PurchaseOrderId = po.Id,
                PoNumber = po.PONumber,
                VendorId = vendor.Id,
                ReceivedDate = DateTime.UtcNow.Date,
                Status = "PendingQC",
                CreatedAt = DateTime.UtcNow
            };
            db.GoodsReceiptNotes.Add(grn);
            await db.SaveChangesAsync();

            var result = await grnService.AcceptAsync(grn.Id, null);

            Assert.False(result.AlreadyAccepted);
            Assert.Single(result.Movements);
            Assert.Equal("Accepted", result.Grn.Status);
            var storedItem = await db.Items.SingleAsync(i => i.Id == item.Id);
            Assert.Equal(10m, storedItem.CurrentStock);
            var storedPo = await db.PurchaseOrders.Include(p => p.Items).SingleAsync(p => p.Id == po.Id);
            Assert.Equal("Received", storedPo.Status);
            Assert.Equal(10m, storedPo.Items.Single().ReceivedQuantity);
        }

        [Fact]
        public async Task StageOutbound_DecreasesItemStock()
        {
            var (db, stock, _, _, tenant) = CreateSut();
            await using var _ = db;
            var item = new Item
            {
                TenantId = tenant.GetTenantId(),
                ItemCode = "SKU-OUT",
                ItemName = "Gasket",
                CurrentStock = 12,
                PurchasePrice = 20,
                CreatedAt = DateTime.UtcNow
            };
            db.Items.Add(item);
            await db.SaveChangesAsync();

            await stock.StageOutboundAsync(item.Id, 4, 20, null, "SalesInvoice", Guid.NewGuid(), "INV-1", "test", default);
            await db.SaveChangesAsync();

            var stored = await db.Items.SingleAsync(i => i.Id == item.Id);
            Assert.Equal(8m, stored.CurrentStock);
            var movement = await db.StockMovements.SingleAsync();
            Assert.Equal("Out", movement.MovementType);
        }

        [Fact]
        public async Task ConvertQuotation_CreatesConfirmedSalesOrder()
        {
            var (db, _, _, conversions, tenant) = CreateSut();
            await using var _ = db;
            var tenantId = tenant.GetTenantId();
            var customer = new Customer
            {
                TenantId = tenantId,
                CustomerCode = "C-1",
                CustomerName = "Acme",
                CreatedAt = DateTime.UtcNow
            };
            db.Customers.Add(customer);
            await db.SaveChangesAsync();

            var quotation = new SalesQuotation
            {
                TenantId = tenantId,
                QuotationNumber = "QT-00001",
                QuotationDate = DateTime.UtcNow.Date,
                CustomerId = customer.Id,
                ValidUntil = DateTime.UtcNow.Date.AddDays(14),
                SubTotal = 100,
                TotalAmount = 100,
                Status = "Sent",
                CreatedAt = DateTime.UtcNow
            };
            quotation.Items.Add(new SalesQuotationItem
            {
                TenantId = tenantId,
                Description = "Widget",
                Quantity = 2,
                UnitPrice = 50,
                TotalAmount = 100,
                CreatedAt = DateTime.UtcNow
            });
            db.SalesQuotations.Add(quotation);
            await db.SaveChangesAsync();

            var first = await conversions.ConvertQuotationToOrderAsync(quotation.Id);
            var second = await conversions.ConvertQuotationToOrderAsync(quotation.Id);

            Assert.False(first.AlreadyConverted);
            Assert.True(second.AlreadyConverted);
            Assert.Equal(first.Order.Id, second.Order.Id);
            Assert.Equal("Confirmed", first.Order.Status);
            Assert.Single(first.Order.Items);
            var storedQuote = await db.SalesQuotations.SingleAsync(q => q.Id == quotation.Id);
            Assert.Equal("Accepted", storedQuote.Status);
        }

        [Fact]
        public async Task ConvertQuotation_ThrowsWhenRejected()
        {
            var (db, _, _, conversions, tenant) = CreateSut();
            await using var _ = db;
            var tenantId = tenant.GetTenantId();
            var customer = new Customer
            {
                TenantId = tenantId,
                CustomerCode = "C-R",
                CustomerName = "Reject Co",
                CreatedAt = DateTime.UtcNow
            };
            db.Customers.Add(customer);
            await db.SaveChangesAsync();
            var quotation = new SalesQuotation
            {
                TenantId = tenantId,
                QuotationNumber = "QT-REJ",
                QuotationDate = DateTime.UtcNow.Date,
                CustomerId = customer.Id,
                ValidUntil = DateTime.UtcNow.Date.AddDays(7),
                TotalAmount = 50,
                Status = "Rejected",
                CreatedAt = DateTime.UtcNow
            };
            db.SalesQuotations.Add(quotation);
            await db.SaveChangesAsync();

            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                conversions.ConvertQuotationToOrderAsync(quotation.Id));
        }

        [Fact]
        public async Task ConvertLead_SecondCallReturnsSameQuotation()
        {
            var (db, _, _, conversions, tenant) = CreateSut();
            await using var _ = db;
            var lead = new CrmLead
            {
                TenantId = tenant.GetTenantId(),
                LeadCode = "LD-LOCK",
                LeadName = "Asha",
                Value = 100,
                Status = "Open",
                Stage = "Qualified",
                CreatedAt = DateTime.UtcNow
            };
            db.CrmLeads.Add(lead);
            await db.SaveChangesAsync();

            var first = await conversions.ConvertLeadToQuotationAsync(lead.Id);
            var second = await conversions.ConvertLeadToQuotationAsync(lead.Id);

            Assert.Equal(first.QuotationId, second.QuotationId);
            Assert.Equal(1, await db.SalesQuotations.CountAsync());
        }

        [Fact]
        public async Task ConvertPurchaseRequest_SecondCallReturnsSamePo()
        {
            var (db, _, _, conversions, tenant) = CreateSut();
            await using var _ = db;
            var tenantId = tenant.GetTenantId();
            db.Vendors.Add(new Vendor
            {
                TenantId = tenantId,
                VendorCode = "V-LOCK",
                VendorName = "Repeat",
                CreatedAt = DateTime.UtcNow
            });
            var request = new PurchaseRequest
            {
                TenantId = tenantId,
                RequestNumber = "PR-LOCK",
                ItemDescription = "Cables",
                EstimatedCost = 500,
                Status = "Approved",
                CreatedAt = DateTime.UtcNow
            };
            db.PurchaseRequests.Add(request);
            await db.SaveChangesAsync();

            var first = await conversions.ConvertPurchaseRequestAsync(request.Id);
            var second = await conversions.ConvertPurchaseRequestAsync(request.Id);

            Assert.Equal(first.PurchaseOrderId, second.PurchaseOrderId);
            Assert.Equal(1, await db.PurchaseOrders.CountAsync());
        }

        [Fact]
        public async Task ConvertLead_CreatesCustomerAndDraftQuotation()
        {
            var (db, _, _, conversions, tenant) = CreateSut();
            await using var _ = db;
            var lead = new CrmLead
            {
                TenantId = tenant.GetTenantId(),
                LeadCode = "LD-00001",
                LeadName = "Priya",
                CompanyName = "Priya Co",
                Email = "priya@example.com",
                Value = 2500,
                Status = "Open",
                Stage = "Qualified",
                CreatedAt = DateTime.UtcNow
            };
            db.CrmLeads.Add(lead);
            await db.SaveChangesAsync();

            var result = await conversions.ConvertLeadToQuotationAsync(lead.Id);

            Assert.Equal(2500m, result.Quotation.TotalAmount);
            Assert.Equal("Draft", result.Quotation.Status);
            var storedLead = await db.CrmLeads.SingleAsync(l => l.Id == lead.Id);
            Assert.Equal("Converted", storedLead.Status);
            Assert.Equal("Won", storedLead.Stage);
            Assert.True(await db.Customers.AnyAsync(c => c.Id == result.CustomerId));
        }

        [Fact]
        public async Task ConvertPurchaseRequest_CreatesDraftPoWhenApproved()
        {
            var (db, _, _, conversions, tenant) = CreateSut();
            await using var _ = db;
            var tenantId = tenant.GetTenantId();
            db.Vendors.Add(new Vendor
            {
                TenantId = tenantId,
                VendorCode = "V-2",
                VendorName = "Hardware",
                CreatedAt = DateTime.UtcNow
            });
            var request = new PurchaseRequest
            {
                TenantId = tenantId,
                RequestNumber = "PR-00001",
                ItemDescription = "Laptops",
                EstimatedCost = 90000,
                Status = "Approved",
                CreatedAt = DateTime.UtcNow
            };
            db.PurchaseRequests.Add(request);
            await db.SaveChangesAsync();

            var result = await conversions.ConvertPurchaseRequestAsync(request.Id);

            Assert.Equal("Converted", result.Request.Status);
            Assert.StartsWith("PO-", result.PoNumber);
            Assert.Equal(result.PurchaseOrderId, result.Request.PurchaseOrderId);
        }
    }
}
