using System;
using System.Collections.Generic;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Services;

namespace UabIndia.Infrastructure.Services.Tax
{
    public class GenericSalesTaxEngine : ITaxCalculationEngine
    {
        public string TaxSystemName => "Standard Sales Tax / Commercial VAT";

        public bool SupportsCountry(string countryCode) => true; // Fallback default for any country

        public TaxCalculationResult CalculateTax(TaxCalculationRequest request)
        {
            var country = string.IsNullOrWhiteSpace(request.CountryCode) ? "GLOBAL" : request.CountryCode.ToUpperInvariant();
            var isInterState = !string.IsNullOrWhiteSpace(request.FromSubdivision) &&
                               !string.IsNullOrWhiteSpace(request.ToSubdivision) &&
                               !string.Equals(request.FromSubdivision, request.ToSubdivision, StringComparison.OrdinalIgnoreCase);

            var result = new TaxCalculationResult
            {
                TaxSystemName = TaxSystemName,
                CountryCode = country,
                IsInterStateOrCrossBorder = isInterState
            };

            var defaultRate = request.DefaultRate >= 0 ? request.DefaultRate : 0m;

            if (request.Lines != null && request.Lines.Count > 0)
            {
                decimal totalSubTotal = 0;
                decimal totalTax = 0;

                foreach (var line in request.Lines)
                {
                    var rate = line.TaxRate ?? defaultRate;
                    var taxable = (line.Quantity * line.UnitPrice) - line.DiscountAmount;
                    if (taxable < 0) taxable = 0;

                    var tax = request.IsTaxExempt ? 0 : IndiaStatutoryCalculator.RoundMoney((taxable * rate) / 100m);
                    var lineTotal = taxable + tax;

                    var lineRes = new TaxLineItemResult
                    {
                        LineId = line.LineId,
                        TaxableAmount = taxable,
                        EffectiveRate = request.IsTaxExempt ? 0 : rate,
                        TaxAmount = tax,
                        LineTotal = lineTotal
                    };
                    lineRes.ComponentBreakdown["SalesTax"] = tax;

                    totalSubTotal += taxable;
                    totalTax += tax;
                    result.LineResults.Add(lineRes);
                }

                result.SubTotal = totalSubTotal;
                result.TotalTaxAmount = totalTax;
                result.TotalInvoiceAmount = totalSubTotal + totalTax;
                result.TaxComponents["SalesTax"] = totalTax;
            }
            else
            {
                var taxable = request.TaxableAmount;
                var tax = request.IsTaxExempt ? 0 : IndiaStatutoryCalculator.RoundMoney((taxable * defaultRate) / 100m);

                result.SubTotal = taxable;
                result.TotalTaxAmount = tax;
                result.TotalInvoiceAmount = taxable + tax;
                result.TaxComponents["SalesTax"] = tax;
            }

            return result;
        }
    }
}
