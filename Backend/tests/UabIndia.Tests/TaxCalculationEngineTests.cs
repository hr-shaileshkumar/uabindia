using System;
using System.Collections.Generic;
using UabIndia.Application.Interfaces;
using UabIndia.Infrastructure.Services.Tax;
using Xunit;

namespace UabIndia.Tests;

public class TaxCalculationEngineTests
{
    private readonly TaxEngineRouter _router;

    public TaxCalculationEngineTests()
    {
        _router = new TaxEngineRouter();
    }

    [Fact]
    public void IndiaGstEngine_IntraState_SplitsCgstAndSgst()
    {
        var req = new TaxCalculationRequest
        {
            CountryCode = "IND",
            TaxableAmount = 10000m,
            DefaultRate = 18m,
            FromSubdivision = "Karnataka",
            ToSubdivision = "Karnataka"
        };

        var result = _router.CalculateTax(req);

        Assert.False(result.IsInterStateOrCrossBorder);
        Assert.Equal(10000m, result.SubTotal);
        Assert.Equal(1800m, result.TotalTaxAmount);
        Assert.Equal(11800m, result.TotalInvoiceAmount);
        Assert.Equal(900m, result.TaxComponents["CGST"]);
        Assert.Equal(900m, result.TaxComponents["SGST"]);
        Assert.Equal(0m, result.TaxComponents["IGST"]);
    }

    [Fact]
    public void IndiaGstEngine_InterState_AppliesIgst()
    {
        var req = new TaxCalculationRequest
        {
            CountryCode = "IND",
            TaxableAmount = 10000m,
            DefaultRate = 18m,
            FromSubdivision = "Karnataka",
            ToSubdivision = "Maharashtra"
        };

        var result = _router.CalculateTax(req);

        Assert.True(result.IsInterStateOrCrossBorder);
        Assert.Equal(1800m, result.TotalTaxAmount);
        Assert.Equal(0m, result.TaxComponents["CGST"]);
        Assert.Equal(0m, result.TaxComponents["SGST"]);
        Assert.Equal(1800m, result.TaxComponents["IGST"]);
    }

    [Fact]
    public void IndiaGstEngine_TaxExempt_CalculatesZeroTax()
    {
        var req = new TaxCalculationRequest
        {
            CountryCode = "IND",
            TaxableAmount = 10000m,
            DefaultRate = 18m,
            IsTaxExempt = true,
            FromSubdivision = "Delhi",
            ToSubdivision = "Delhi"
        };

        var result = _router.CalculateTax(req);

        Assert.Equal(0m, result.TotalTaxAmount);
        Assert.Equal(10000m, result.TotalInvoiceAmount);
    }

    [Fact]
    public void UkVatEngine_StandardRate_Calculates20PercentVat()
    {
        var req = new TaxCalculationRequest
        {
            CountryCode = "GBR",
            TaxableAmount = 5000m,
            DefaultRate = 20m
        };

        var result = _router.CalculateTax(req);

        Assert.Equal("UK VAT (HMRC)", result.TaxSystemName);
        Assert.Equal(5000m, result.SubTotal);
        Assert.Equal(1000m, result.TotalTaxAmount);
        Assert.Equal(6000m, result.TotalInvoiceAmount);
        Assert.Equal(1000m, result.TaxComponents["VAT"]);
    }

    [Fact]
    public void UaeVatEngine_StandardRate_Calculates5PercentVat()
    {
        var req = new TaxCalculationRequest
        {
            CountryCode = "ARE",
            TaxableAmount = 2000m
        };

        var result = _router.CalculateTax(req);

        Assert.Equal("UAE Federal Tax Authority (FTA VAT)", result.TaxSystemName);
        Assert.Equal(2000m, result.SubTotal);
        Assert.Equal(100m, result.TotalTaxAmount);
        Assert.Equal(2100m, result.TotalInvoiceAmount);
        Assert.Equal(100m, result.TaxComponents["VAT"]);
    }

    [Fact]
    public void GenericEngine_LineItems_CalculatesAccurateTotals()
    {
        var line1 = new TaxCalculationLineItem
        {
            LineId = Guid.NewGuid(),
            Quantity = 2,
            UnitPrice = 500m,
            DiscountAmount = 100m,
            TaxRate = 10m
        };

        var line2 = new TaxCalculationLineItem
        {
            LineId = Guid.NewGuid(),
            Quantity = 1,
            UnitPrice = 1000m,
            DiscountAmount = 0m,
            TaxRate = 5m
        };

        var req = new TaxCalculationRequest
        {
            CountryCode = "USA",
            Lines = new List<TaxCalculationLineItem> { line1, line2 }
        };

        var result = _router.CalculateTax(req);

        // Line 1: (2 * 500) - 100 = 900 taxable. 10% tax = 90. Total = 990
        // Line 2: 1000 taxable. 5% tax = 50. Total = 1050
        // SubTotal = 1900, TotalTax = 140, TotalInvoice = 2040
        Assert.Equal(1900m, result.SubTotal);
        Assert.Equal(140m, result.TotalTaxAmount);
        Assert.Equal(2040m, result.TotalInvoiceAmount);
        Assert.Equal(2, result.LineResults.Count);
        Assert.Equal(90m, result.LineResults[0].TaxAmount);
        Assert.Equal(50m, result.LineResults[1].TaxAmount);
    }
}
