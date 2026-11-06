using UabIndia.Core.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;

namespace UabIndia.Api.Models
{
    public class DocumentLineDto
    {
        public Guid? ItemId { get; set; }
        public string? Description { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TaxRate { get; set; } = 18;

        [JsonIgnore]
        public Guid? ResolvedItemId =>
            ItemId is Guid id && id != Guid.Empty ? id : null;

        public decimal Taxable => DocumentLineMath.Taxable(Quantity, UnitPrice);

        public decimal LineTax => DocumentLineMath.LineTax(Taxable, TaxRate);

        public decimal LineTotal => Taxable + LineTax;
    }

    public static class DocumentLines
    {
        public static List<DocumentLineDto> Valid(IEnumerable<DocumentLineDto>? lines) =>
            (lines ?? Enumerable.Empty<DocumentLineDto>())
                .Where(line =>
                    line.Quantity > 0
                    && line.ItemId is Guid itemId
                    && itemId != Guid.Empty)
                .ToList();

        public static (decimal Taxable, decimal Tax, decimal Total) Sum(IEnumerable<DocumentLineDto> lines)
        {
            decimal taxable = 0;
            decimal tax = 0;
            foreach (var line in lines)
            {
                taxable += line.Taxable;
                tax += line.LineTax;
            }

            return (taxable, tax, taxable + tax);
        }

        public static (decimal Discount, decimal Net) ApplyBillDiscount(decimal billTotal, decimal requested) =>
            DocumentLineMath.ApplyBillDiscount(billTotal, requested);

        public static List<UabIndia.Application.Interfaces.DocumentLineCommand> ToCommands(IEnumerable<DocumentLineDto>? lines) =>
            (lines ?? Enumerable.Empty<DocumentLineDto>())
                .Select(line => new UabIndia.Application.Interfaces.DocumentLineCommand(
                    line.ItemId,
                    line.Description,
                    line.Quantity,
                    line.UnitPrice,
                    line.TaxRate))
                .ToList();
    }
}
