using System;
using System.Collections.Generic;

namespace UabIndia.Core.Entities
{
    public class DiscountScheme : BaseEntity
    {
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public string SchemeCode { get; set; } = string.Empty;
        public string SchemeName { get; set; } = string.Empty;
        public string DiscountType { get; set; } = "Percent"; // Percent, Amount, SpecialPrice
        public string Scope { get; set; } = "Items"; // AllItems, Category, Items
        public decimal Value { get; set; }
        public int Priority { get; set; } = 10;
        public DateTime ValidFrom { get; set; }
        public DateTime ValidTo { get; set; }
        public decimal MinQuantity { get; set; }
        public decimal MinBillAmount { get; set; }
        public decimal MaxDiscountAmount { get; set; }
        public string Status { get; set; } = "Active"; // Draft, Active, Inactive
        public string? Category { get; set; }
        public string? Notes { get; set; }
        public ICollection<DiscountSchemeLine> Lines { get; set; } = new List<DiscountSchemeLine>();
    }

    public class DiscountSchemeLine : BaseEntity
    {
        public Guid DiscountSchemeId { get; set; }
        public DiscountScheme DiscountScheme { get; set; } = null!;
        public Guid? ItemId { get; set; }
        public Item? Item { get; set; }
        public string? Category { get; set; }
        public decimal? Value { get; set; }
    }
}
