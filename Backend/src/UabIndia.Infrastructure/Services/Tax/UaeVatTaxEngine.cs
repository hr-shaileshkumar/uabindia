using System;
using System.Collections.Generic;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Services;

namespace UabIndia.Infrastructure.Services.Tax
{
    public class UaeVatTaxEngine : ITaxCalculationEngine
    {
        public string TaxSystemName => "UAE Federal Tax Authority (FTA VAT)";

        public bool SupportsCountry(string countryCode) =>
            string.Equals(countryCode, "ARE", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(countryCode, "AE", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(countryCode, "UAE", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(countryCode, "United Arab Emirates", StringComparison.OrdinalIgnoreCase);

        public TaxCalculationResult CalculateTax(TaxCalculationRequest request)
        {
            var result = new TaxCalculationResult
            {
                TaxSystemName = TaxSystemName,
                CountryCode = "ARE",
                IsInterStateOrCrossBorder = false
            };

            var standardRate = 5.0m; // UAE Standard VAT 5%

            if (request.Lines != null && request.Lines.Count > 0)
            {
                decimal totalSubTotal = 0;
                decimal totalTax = 0;

                foreach (var line in request.Lines)
                {
                    var rate = line.TaxRate ?? standardRate;
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
                    lineRes.ComponentBreakdown["VAT"] = tax;

                    totalSubTotal += taxable;
                    totalTax += tax;
                    result.LineResults.Add(lineRes);
                }

                result.SubTotal = totalSubTotal;
                result.TotalTaxAmount = totalTax;
                result.TotalInvoiceAmount = totalSubTotal + totalTax;
                result.TaxComponents["VAT"] = totalTax;
            }
            else
            {
                var taxable = request.TaxableAmount;
                var tax = request.IsTaxExempt ? 0 : IndiaStatutoryCalculator.RoundMoney((taxable * standardRate) / 100m);

                result.SubTotal = taxable;
                result.TotalTaxAmount = tax;
                result.TotalInvoiceAmount = taxable + tax;
                result.TaxComponents["VAT"] = tax;
            }

            return result;
        }
    }
}
