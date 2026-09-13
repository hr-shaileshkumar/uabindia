using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace UabIndia.Application.Interfaces
{
    public class ItemTierPriceDto
    {
        public Guid ItemId { get; set; }
        public string ItemCode { get; set; } = string.Empty;
        public string ItemName { get; set; } = string.Empty;
        public decimal BasePrice { get; set; }
        public int MinQtyTier1 { get; set; } = 1;
        public decimal PriceTier1 { get; set; }
        public int MinQtyTier2 { get; set; } = 10;
        public decimal PriceTier2 { get; set; }
        public int MinQtyTier3 { get; set; } = 50;
        public decimal PriceTier3 { get; set; }
        public decimal PromotionalDiscountPercent { get; set; }
    }

    public class PriceListSummaryDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string CustomerTier { get; set; } = "Wholesale"; // Wholesale, Distributor, Retail, VIP
        public string CurrencyCode { get; set; } = "USD";
        public DateTime ValidFrom { get; set; }
        public DateTime ValidTo { get; set; }
        public bool IsActive { get; set; } = true;
        public List<ItemTierPriceDto> Items { get; set; } = new();
    }

    public class PriceCalculationRequest
    {
        public Guid ItemId { get; set; }
        public Guid? CustomerId { get; set; }
        public string CustomerTier { get; set; } = "Wholesale";
        public decimal Quantity { get; set; } = 1;
        public string CurrencyCode { get; set; } = "USD";
    }

    public class PriceCalculationResult
    {
        public Guid ItemId { get; set; }
        public string ItemCode { get; set; } = string.Empty;
        public string ItemName { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public decimal BaseUnitPrice { get; set; }
        public decimal EffectiveUnitPrice { get; set; }
        public decimal VolumeDiscountPercent { get; set; }
        public decimal PromotionalDiscountPercent { get; set; }
        public decimal TotalDiscountAmount { get; set; }
        public decimal FinalLineTotal { get; set; }
        public string AppliedRuleDescription { get; set; } = string.Empty;
        public string CurrencyCode { get; set; } = "USD";
    }

    public interface IPricingEngineService
    {
        Task<IReadOnlyList<PriceListSummaryDto>> GetPriceListsAsync(Guid tenantId, CancellationToken ct = default);
        Task<PriceCalculationResult> CalculateEffectivePriceAsync(Guid tenantId, PriceCalculationRequest req, CancellationToken ct = default);
        Task<PriceListSummaryDto> SavePriceListAsync(Guid tenantId, PriceListSummaryDto dto, CancellationToken ct = default);
    }
}
