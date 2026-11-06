using System;
using System.Collections.Generic;
using System.Linq;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Services;

namespace UabIndia.Infrastructure.Services.Tax
{
    public class IndiaGstTaxEngine : ITaxCalculationEngine
    {
        public string TaxSystemName => "India GST (CGST/SGST/IGST)";

        public bool SupportsCountry(string countryCode) =>
            string.Equals(countryCode, "IND", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(countryCode, "IN", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(countryCode, "India", StringComparison.OrdinalIgnoreCase);

        public TaxCalculationResult CalculateTax(TaxCalculationRequest request)
        {
            var isInterState = GstCalculator.IsInterState(request.FromSubdivision, request.ToSubdivision);
            var result = new TaxCalculationResult
            {
                TaxSystemName = TaxSystemName,
                CountryCode = "IND",
                IsInterStateOrCrossBorder = isInterState
            };

            if (request.Lines != null && request.Lines.Count > 0)
            {
                decimal totalSubTotal = 0;
                decimal totalTax = 0;
                decimal totalCgst = 0;
                decimal totalSgst = 0;
                decimal totalIgst = 0;

                foreach (var line in request.Lines)
                {
                    var rate = line.TaxRate ?? request.DefaultRate;
                    var taxable = (line.Quantity * line.UnitPrice) - line.DiscountAmount;
                    if (taxable < 0) taxable = 0;

                    var calc = request.IsTaxExempt
                        ? new GstBreakdown(taxable, 0, 0, 0, 0, taxable)
                        : GstCalculator.Calculate(taxable, rate, isInterState);

                    var lineRes = new TaxLineItemResult
                    {
                        LineId = line.LineId,
                        TaxableAmount = taxable,
                        EffectiveRate = request.IsTaxExempt ? 0 : rate,
                        TaxAmount = calc.TotalTax,
                        LineTotal = calc.InvoiceTotal
                    };

                    lineRes.ComponentBreakdown["CGST"] = calc.Cgst;
                    lineRes.ComponentBreakdown["SGST"] = calc.Sgst;
                    lineRes.ComponentBreakdown["IGST"] = calc.Igst;

                    totalSubTotal += taxable;
                    totalTax += calc.TotalTax;
                    totalCgst += calc.Cgst;
                    totalSgst += calc.Sgst;
                    totalIgst += calc.Igst;

                    result.LineResults.Add(lineRes);
                }

                result.SubTotal = totalSubTotal;
                result.TotalTaxAmount = totalTax;
                result.TotalInvoiceAmount = totalSubTotal + totalTax;
                result.TaxComponents["CGST"] = totalCgst;
                result.TaxComponents["SGST"] = totalSgst;
                result.TaxComponents["IGST"] = totalIgst;
            }
            else
            {
                var taxable = request.TaxableAmount;
                var rate = request.DefaultRate;
                var calc = request.IsTaxExempt
                    ? new GstBreakdown(taxable, 0, 0, 0, 0, taxable)
                    : GstCalculator.Calculate(taxable, rate, isInterState);

                result.SubTotal = taxable;
                result.TotalTaxAmount = calc.TotalTax;
                result.TotalInvoiceAmount = calc.InvoiceTotal;
                result.TaxComponents["CGST"] = calc.Cgst;
                result.TaxComponents["SGST"] = calc.Sgst;
                result.TaxComponents["IGST"] = calc.Igst;
            }

            return result;
        }
    }
}
