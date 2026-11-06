using System;

namespace UabIndia.Core.Services
{
    public static class GstCalculator
    {
        public static GstBreakdown Calculate(decimal taxableAmount, decimal taxRatePercent, bool interState)
        {
            var taxable = Math.Max(0m, taxableAmount);
            var rate = Math.Max(0m, taxRatePercent);
            var totalTax = IndiaStatutoryCalculator.RoundMoney(taxable * rate / 100m);
            if (interState)
            {
                return new GstBreakdown(taxable, 0, 0, totalTax, totalTax, IndiaStatutoryCalculator.RoundMoney(taxable + totalTax));
            }

            var half = IndiaStatutoryCalculator.RoundMoney(totalTax / 2m);
            var sgst = IndiaStatutoryCalculator.RoundMoney(totalTax - half);
            return new GstBreakdown(taxable, half, sgst, 0, totalTax, IndiaStatutoryCalculator.RoundMoney(taxable + totalTax));
        }

        public static bool IsInterState(string? fromState, string? toState)
        {
            var a = NormalizeState(fromState);
            var b = NormalizeState(toState);
            if (string.IsNullOrEmpty(a) || string.IsNullOrEmpty(b)) return false;
            return !string.Equals(a, b, StringComparison.OrdinalIgnoreCase);
        }

        private static string NormalizeState(string? value)
        {
            var v = (value ?? string.Empty).Trim().ToUpperInvariant();
            return v.Length <= 2 ? v : v[..2];
        }
    }

    public readonly record struct GstBreakdown(
        decimal TaxableAmount,
        decimal Cgst,
        decimal Sgst,
        decimal Igst,
        decimal TotalTax,
        decimal InvoiceTotal);
}
