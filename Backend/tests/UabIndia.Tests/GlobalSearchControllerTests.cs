using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using UabIndia.Api.Modules.Administration.Controllers;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Infrastructure.Services;
using UabIndia.Tests.TestUtilities;
using Xunit;

namespace UabIndia.Tests
{
    public class GlobalSearchControllerTests : IDisposable
    {
        private readonly ApplicationDbContext _db;
        private readonly GlobalSearchController _controller;
        private readonly Guid _tenantId = Guid.NewGuid();

        public GlobalSearchControllerTests()
        {
            var inMemoryConfig = new Dictionary<string, string?>
            {
                ["Encryption:Key"] = "test-key-32-chars-long-for-search-tests"
            };
            var config = new ConfigurationBuilder().AddInMemoryCollection(inMemoryConfig).Build();

            var tenantAccessor = new TestTenantAccessor();
            tenantAccessor.SetTenantId(_tenantId);

            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            var encryption = new AesEncryptionService(config);
            _db = new ApplicationDbContext(options, tenantAccessor, encryption);
            _controller = new GlobalSearchController(_db, tenantAccessor);
        }

        public void Dispose()
        {
            _db.Dispose();
        }

        [Fact]
        public async Task GlobalSearch_WithShortQuery_ReturnsEmptyResults()
        {
            var actionResult = await _controller.GlobalSearch("a", CancellationToken.None);
            var okResult = Assert.IsType<OkObjectResult>(actionResult);
            var response = Assert.IsType<GlobalSearchController.GlobalSearchResponse>(okResult.Value);
            Assert.Empty(response.Results);
        }

        [Fact]
        public async Task GlobalSearch_CrossEntitySearch_FindsRelevantRecords()
        {
            // Seed Customer
            var customerId = Guid.NewGuid();
            var customer = new Customer
            {
                Id = customerId,
                TenantId = _tenantId,
                CustomerName = "Apex Technologies India",
                CustomerCode = "CUST-APEX",
                Email = "billing@apex.in"
            };
            _db.Customers.Add(customer);

            // Seed Vendor
            _db.Vendors.Add(new Vendor
            {
                Id = Guid.NewGuid(),
                TenantId = _tenantId,
                VendorName = "Apex Logistics Hub",
                VendorCode = "VEND-APEX",
                Email = "orders@apexlogistics.in"
            });

            // Seed Project
            _db.Projects.Add(new Project
            {
                Id = Guid.NewGuid(),
                TenantId = _tenantId,
                ProjectCode = "PROJ-APEX-01",
                Name = "Apex Cloud Migration",
                ProjectType = "External",
                Status = "Active"
            });

            // Seed Sales Invoice
            _db.SalesInvoices.Add(new SalesInvoice
            {
                Id = Guid.NewGuid(),
                TenantId = _tenantId,
                InvoiceNumber = "INV-2026-APEX-99",
                TotalAmount = 145000,
                Status = "Issued",
                CustomerId = customerId,
                Customer = customer
            });

            _db.SaveChanges();

            var actionResult = await _controller.GlobalSearch("apex", CancellationToken.None);
            var okResult = Assert.IsType<OkObjectResult>(actionResult);
            var response = Assert.IsType<GlobalSearchController.GlobalSearchResponse>(okResult.Value);

            Assert.True(response.Results.Count >= 3);
            Assert.Contains(response.Results, r => r.Category == "Customer" && r.Title.Contains("Apex Technologies"));
            Assert.Contains(response.Results, r => r.Category == "Vendor" && r.Title.Contains("Apex Logistics"));
            Assert.Contains(response.Results, r => r.Category == "Project" && r.Title.Contains("Apex Cloud Migration"));
            Assert.Contains(response.Results, r => r.Category == "Invoice" && r.Title == "INV-2026-APEX-99");
        }
    }
}
