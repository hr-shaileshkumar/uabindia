using System;
using System.Collections.Generic;

namespace UabIndia.Application.Interfaces
{
    public class TaxCalculationRequest
    {
        public string CountryCode { get; set; } = "GLOBAL";
        public decimal TaxableAmount { get; set; }
        public decimal DefaultRate { get; set; } = 18m;
        public string? FromSubdivision { get; set; } // State / Province / Emirate
        public string? ToSubdivision { get; set; }   // State / Province / Emirate
        public string? ItemHsnSacCode { get; set; }
        public bool IsTaxExempt { get; set; } = false;
        public string? TaxIdNumber { get; set; }     // GSTIN / VAT ID / EIN
        public IReadOnlyList<TaxCalculationLineItem>? Lines { get; set; }
    }

    public class TaxCalculationLineItem
    {
        public Guid? LineId { get; set; }
        public Guid? ItemId { get; set; }
        public string? ItemCode { get; set; }
        public decimal Quantity { get; set; } = 1m;
        public decimal UnitPrice { get; set; }
        public decimal DiscountAmount { get; set; } = 0m;
        public decimal? TaxRate { get; set; }
        public string? HsnSacCode { get; set; }
    }

    public class TaxCalculationResult
    {
        public string TaxSystemName { get; set; } = string.Empty;
        public string CountryCode { get; set; } = string.Empty;
        public bool IsInterStateOrCrossBorder { get; set; }
        public decimal SubTotal { get; set; }
        public decimal TotalTaxAmount { get; set; }
        public decimal TotalInvoiceAmount { get; set; }
        public Dictionary<string, decimal> TaxComponents { get; set; } = new();
        public List<TaxLineItemResult> LineResults { get; set; } = new();
    }

    public class TaxLineItemResult
    {
        public Guid? LineId { get; set; }
        public decimal TaxableAmount { get; set; }
        public decimal EffectiveRate { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal LineTotal { get; set; }
        public Dictionary<string, decimal> ComponentBreakdown { get; set; } = new();
    }

    public interface ITaxCalculationEngine
    {
        string TaxSystemName { get; }
        bool SupportsCountry(string countryCode);
        TaxCalculationResult CalculateTax(TaxCalculationRequest request);
    }
}
