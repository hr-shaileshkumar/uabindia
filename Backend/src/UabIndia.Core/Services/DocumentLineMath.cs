using System;

namespace UabIndia.Core.Services
{
    public static class DocumentLineMath
    {
        public static decimal Taxable(decimal quantity, decimal unitPrice) =>
            Math.Round(quantity * unitPrice, 2, MidpointRounding.AwayFromZero);

        public static decimal LineTax(decimal taxable, decimal taxRate)
        {
            var rate = taxRate <= 0 ? 18m : taxRate;
            return Math.Round(taxable * rate / 100m, 2, MidpointRounding.AwayFromZero);
        }

        public static decimal LineTotal(decimal quantity, decimal unitPrice, decimal taxRate)
        {
            var taxable = Taxable(quantity, unitPrice);
            return taxable + LineTax(taxable, taxRate);
        }

        public static (decimal Discount, decimal Net) ApplyBillDiscount(decimal billTotal, decimal requested)
        {
            if (requested <= 0 || billTotal <= 0)
                return (0, billTotal);

            var discount = Math.Round(Math.Min(requested, billTotal), 2, MidpointRounding.AwayFromZero);
            return (discount, billTotal - discount);
        }
    }
}
