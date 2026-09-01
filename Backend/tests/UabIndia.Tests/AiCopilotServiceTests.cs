using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Infrastructure.Services;
using UabIndia.Tests.TestUtilities;
using Xunit;

using Microsoft.Extensions.Logging.Abstractions;

namespace UabIndia.Tests;

public class AiCopilotServiceTests : IDisposable
{
    private readonly ApplicationDbContext _db;
    private readonly AiCopilotService _service;
    private readonly Guid _tenantId = Guid.NewGuid();

    public AiCopilotServiceTests()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Encryption:Key"] = "test-key-32-chars-long-for-copilot-tests!"
            })
            .Build();

        var encryption = new AesEncryptionService(config);
        var tenantAccessor = new TestTenantAccessor();
        tenantAccessor.SetTenantId(_tenantId);

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _db = new ApplicationDbContext(options, tenantAccessor, encryption);
        _service = new AiCopilotService(_db, tenantAccessor, NullLogger<AiCopilotService>.Instance);
    }

    [Fact]
    public async Task ExecutePromptAsync_AnswersRevenueQueriesAccurately()
    {
        var inv1 = new SalesInvoice
        {
            TenantId = _tenantId,
            InvoiceNumber = "INV-001",
            TotalAmount = 5000m,
            PaidAmount = 3000m,
            BalanceAmount = 2000m,
            Status = "Partial"
        };
        var inv2 = new SalesInvoice
        {
            TenantId = _tenantId,
            InvoiceNumber = "INV-002",
            TotalAmount = 10000m,
            PaidAmount = 10000m,
            BalanceAmount = 0m,
            Status = "Paid"
        };

        _db.SalesInvoices.AddRange(inv1, inv2);
        await _db.SaveChangesAsync();

        var response = await _service.ExecutePromptAsync(new CopilotQueryRequest
        {
            TenantId = _tenantId,
            Prompt = "What is our total sales revenue and outstanding balance?"
        });

        Assert.Equal("FinancialRevenueAnalysis", response.Intent);
        Assert.Equal(15000m, response.Metrics["TotalRevenue"]);
        Assert.Equal(13000m, response.Metrics["CollectedRevenue"]);
        Assert.Equal(2000m, response.Metrics["OutstandingReceivables"]);
        Assert.Contains("15,000.00", response.Answer);
    }

    [Fact]
    public async Task ExecutePromptAsync_AnswersInventoryQueriesAccurately()
    {
        var item1 = new Item { TenantId = _tenantId, ItemCode = "A1", CurrentStock = 2m, ReorderLevel = 10m };
        var item2 = new Item { TenantId = _tenantId, ItemCode = "A2", CurrentStock = 50m, ReorderLevel = 10m };

        _db.Items.AddRange(item1, item2);
        await _db.SaveChangesAsync();

        var response = await _service.ExecutePromptAsync(new CopilotQueryRequest
        {
            TenantId = _tenantId,
            Prompt = "Show me stock levels and inventory health"
        });

        Assert.Equal("InventoryHealthSummary", response.Intent);
        Assert.Equal(2m, response.Metrics["TotalCatalogItems"]);
        Assert.Equal(1m, response.Metrics["LowStockItemsCount"]);
    }

    [Fact]
    public async Task DetectAnomaliesAsync_IdentifiesNegativeStockAndOverdueReceivables()
    {
        var negativeItem = new Item
        {
            TenantId = _tenantId,
            ItemCode = "ANOMALY-ITEM",
            ItemName = "Defective Component",
            CurrentStock = -15m
        };
        var overdueInvoice = new SalesInvoice
        {
            TenantId = _tenantId,
            InvoiceNumber = "OVERDUE-INV-99",
            TotalAmount = 25000m,
            PaidAmount = 0m,
            BalanceAmount = 25000m,
            DueDate = DateTime.UtcNow.AddDays(-30),
            Status = "Overdue"
        };

        _db.Items.Add(negativeItem);
        _db.SalesInvoices.Add(overdueInvoice);
        await _db.SaveChangesAsync();

        var anomalies = await _service.DetectAnomaliesAsync(_tenantId);

        Assert.NotEmpty(anomalies);
        Assert.Contains(anomalies, a => a.Module == "Inventory" && a.Title.Contains("Negative Inventory Balance"));
        Assert.Contains(anomalies, a => a.Module == "Finance" && a.Title.Contains("Overdue High-Value"));
    }

    [Fact]
    public async Task ExecutePromptAsync_RoutesToActionableDraftTools_RequiringHumanApproval()
    {
        var response = await _service.ExecutePromptAsync(new CopilotQueryRequest
        {
            TenantId = _tenantId,
            Prompt = "Please draft purchase order for raw steel 100 units"
        });

        Assert.Equal("DraftPurchaseOrder", response.Intent);
        Assert.Equal("DraftPurchaseOrderTool", response.ToolExecuted);
        Assert.Equal(AiOperationMode.Draft, response.OperationMode);
        Assert.True(response.RequiresHumanApproval);
        Assert.Contains("authorized workflow approval", response.Answer);
    }

    [Fact]
    public async Task ExecutePromptAsync_RecordsAuditLog_OnToolExecution()
    {
        var response = await _service.ExecutePromptAsync(new CopilotQueryRequest
        {
            TenantId = _tenantId,
            Prompt = "What is our revenue this month?"
        });

        Assert.Equal("FinancialRevenueAnalysis", response.Intent);

        var auditLog = await _db.AuditLogs.FirstOrDefaultAsync(a => a.EntityName == "AiCopilot");
        Assert.NotNull(auditLog);
        Assert.Equal(_tenantId, auditLog.TenantId);
        Assert.Contains("FinancialAnalysisTool", auditLog.Action);
    }

    public void Dispose() => _db.Dispose();
}
