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

namespace UabIndia.Tests;

public class AdvancedEnterpriseEnginesTests : IDisposable
{
    private readonly ApplicationDbContext _db;
    private readonly BankFeedParserService _bankParser;
    private readonly MrpEngineService _mrpService;
    private readonly Guid _tenantId = Guid.NewGuid();

    public AdvancedEnterpriseEnginesTests()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Encryption:Key"] = "test-key-32-chars-long-for-mrp-tests!!!"
            })
            .Build();

        var encryption = new AesEncryptionService(config);
        var tenantAccessor = new TestTenantAccessor();
        tenantAccessor.SetTenantId(_tenantId);

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _db = new ApplicationDbContext(options, tenantAccessor, encryption);
        _bankParser = new BankFeedParserService();
        _mrpService = new MrpEngineService(_db);
    }

    [Fact]
    public void BankFeedParserService_ParsesOfxStatementAccurately()
    {
        var ofxContent = @"
            <OFX>
                <BANKMSGSRSV1>
                    <STMTTRNRS>
                        <STMTRS>
                            <CURDEF>USD
                            <BANKACCTFROM>
                                <ACCTID>1234567890
                            </BANKACCTFROM>
                            <BANKTRANLIST>
                                <STMTTRN>
                                    <TRNTYPE>CREDIT
                                    <DTPOSTED>20260824
                                    <TRNAMT>5000.00
                                    <FITID>TXN-101
                                    <NAME>ACME Corp Invoice Payment
                                </STMTTRN>
                            </BANKTRANLIST>
                            <LEDGERBAL>
                                <BALAMT>25000.00
                            </LEDGERBAL>
                        </STMTRS>
                    </STMTTRNRS>
                </BANKMSGSRSV1>
            </OFX>";

        var result = _bankParser.ParseOfxStatement(ofxContent);

        Assert.Equal("USD", result.Currency);
        Assert.Equal("1234567890", result.AccountNumber);
        Assert.Equal(25000.00m, result.ClosingBalance);
        Assert.Single(result.Transactions);
        Assert.Equal(5000.00m, result.Transactions[0].Amount);
        Assert.Equal("Credit", result.Transactions[0].TransactionType);
        Assert.Equal("TXN-101", result.Transactions[0].ReferenceNumber);
    }

    [Fact]
    public void BankFeedParserService_ParsesCsvStatementAccurately()
    {
        var csvContent = @"Date,Description,Amount,Type,Reference
2026-08-24,Customer Wire Transfer,1500.50,Credit,REF-99
2026-08-23,Office Utility Bill,-250.00,Debit,REF-100";

        var result = _bankParser.ParseCsvStatement(csvContent, "EUR");

        Assert.Equal("EUR", result.Currency);
        Assert.Equal(2, result.Transactions.Count);
        Assert.Equal(1500.50m, result.Transactions[0].Amount);
        Assert.Equal("Credit", result.Transactions[0].TransactionType);
        Assert.Equal(250.00m, result.Transactions[1].Amount);
        Assert.Equal("Debit", result.Transactions[1].TransactionType);
    }

    [Fact]
    public async Task MrpEngineService_CalculatesMaterialRequirementsAndShortages()
    {
        var finishedGood = new Item
        {
            TenantId = _tenantId,
            ItemCode = "FG-001",
            ItemName = "High-Voltage Electric Pump",
            IsActive = true
        };
        var rawMaterial1 = new Item
        {
            TenantId = _tenantId,
            ItemCode = "RM-001",
            ItemName = "Copper Coils",
            CurrentStock = 10m,
            PurchasePrice = 45m,
            IsActive = true
        };

        _db.Items.AddRange(finishedGood, rawMaterial1);
        await _db.SaveChangesAsync();

        var mrpReq = new MrpCalculationRequest
        {
            TenantId = _tenantId,
            FinishedGoodItemId = finishedGood.Id,
            TargetProductionQuantity = 20m, // Requires 40 units of RM
            RequiredByDate = DateTime.UtcNow.AddDays(14)
        };

        var mrpResult = await _mrpService.CalculateMaterialRequirementsAsync(mrpReq);

        Assert.NotNull(mrpResult);
        Assert.Equal(20m, mrpResult.TargetQuantity);
        Assert.True(mrpResult.HasMaterialShortage);

        var comp = mrpResult.RequiredComponents[0];
        Assert.Equal(40m, comp.RequiredQuantity);
        Assert.Equal(10m, comp.AvailableStock);
        Assert.Equal(30m, comp.ShortageQuantity);
        Assert.Equal("PurchaseRequisitionRequired", comp.ActionRecommendation);
    }

    public void Dispose() => _db.Dispose();
}
