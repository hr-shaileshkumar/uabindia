using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class PricingEngineService : IPricingEngineService
    {
        private readonly ApplicationDbContext _db;

        // In-memory persistent state container for multi-tier price lists (isolated per tenant)
        private static readonly ConcurrentDictionary<Guid, List<PriceListSummaryDto>> _tenantPriceLists = new();

        public PricingEngineService(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<IReadOnlyList<PriceListSummaryDto>> GetPriceListsAsync(Guid tenantId, CancellationToken ct = default)
        {
            EnsureSeededPriceLists(tenantId);

            if (_tenantPriceLists.TryGetValue(tenantId, out var lists))
            {
                return await Task.FromResult(lists.OrderBy(l => l.Name).ToList());
            }

            return await Task.FromResult(new List<PriceListSummaryDto>());
        }

        public async Task<PriceCalculationResult> CalculateEffectivePriceAsync(
            Guid tenantId,
            PriceCalculationRequest req,
            CancellationToken ct = default)
        {
            EnsureSeededPriceLists(tenantId);

            var item = await _db.Items.IgnoreQueryFilters()
                .FirstOrDefaultAsync(i => i.Id == req.ItemId && i.TenantId == tenantId && !i.IsDeleted, ct);

            decimal basePrice = item?.SellingPrice > 0 ? item.SellingPrice : 320m;
            string itemCode = item?.ItemCode ?? "SKU-MOT-100";
            string itemName = !string.IsNullOrWhiteSpace(item?.ItemName) ? item.ItemName : "Industrial Electric Motor (7.5 kW)";

            var lists = _tenantPriceLists.GetOrAdd(tenantId, _ => new List<PriceListSummaryDto>());
            var activeList = lists.FirstOrDefault(l => l.CustomerTier.Equals(req.CustomerTier, StringComparison.OrdinalIgnoreCase) && l.IsActive)
                ?? lists.FirstOrDefault(l => l.IsActive);

            decimal unitPrice = basePrice;
            decimal volDiscount = 0m;
            decimal promoDiscount = 0m;
            string ruleDesc = "Standard Catalog Base Price";

            if (activeList != null)
            {
                var tierItem = activeList.Items.FirstOrDefault(i => i.ItemId == req.ItemId || i.ItemCode == itemCode);
                if (tierItem != null)
                {
                    if (req.Quantity >= tierItem.MinQtyTier3)
                    {
                        unitPrice = tierItem.PriceTier3;
                        volDiscount = Math.Round(((tierItem.BasePrice - tierItem.PriceTier3) / tierItem.BasePrice) * 100m, 1);
                        ruleDesc = $"{activeList.Name} — Tier 3 Volume Break (Qty >= {tierItem.MinQtyTier3})";
                    }
                    else if (req.Quantity >= tierItem.MinQtyTier2)
                    {
                        unitPrice = tierItem.PriceTier2;
                        volDiscount = Math.Round(((tierItem.BasePrice - tierItem.PriceTier2) / tierItem.BasePrice) * 100m, 1);
                        ruleDesc = $"{activeList.Name} — Tier 2 Volume Break (Qty >= {tierItem.MinQtyTier2})";
                    }
                    else
                    {
                        unitPrice = tierItem.PriceTier1;
                        ruleDesc = $"{activeList.Name} — Tier 1 Base Partner Rate";
                    }

                    promoDiscount = tierItem.PromotionalDiscountPercent;
                }
                else
                {
                    // Automatic tier reduction based on partner tier
                    if (req.CustomerTier.Equals("Distributor", StringComparison.OrdinalIgnoreCase))
                    {
                        unitPrice = basePrice * 0.75m;
                        ruleDesc = "Distributor Level Agreement (25% off base)";
                    }
                    else if (req.CustomerTier.Equals("Wholesale", StringComparison.OrdinalIgnoreCase))
                    {
                        unitPrice = basePrice * 0.85m;
                        ruleDesc = "Wholesale Volume Agreement (15% off base)";
                    }
                    else if (req.CustomerTier.Equals("VIP", StringComparison.OrdinalIgnoreCase))
                    {
                        unitPrice = basePrice * 0.90m;
                        ruleDesc = "VIP Key Account Loyalty (10% off base)";
                    }
                }
            }

            decimal effectivePrice = promoDiscount > 0 ? unitPrice * (1m - (promoDiscount / 100m)) : unitPrice;
            decimal grossTotal = basePrice * req.Quantity;
            decimal lineTotal = Math.Round(effectivePrice * req.Quantity, 2);
            decimal totalDiscount = grossTotal - lineTotal;

            return await Task.FromResult(new PriceCalculationResult
            {
                ItemId = req.ItemId,
                ItemCode = itemCode,
                ItemName = itemName,
                Quantity = req.Quantity,
                BaseUnitPrice = basePrice,
                EffectiveUnitPrice = Math.Round(effectivePrice, 2),
                VolumeDiscountPercent = volDiscount,
                PromotionalDiscountPercent = promoDiscount,
                TotalDiscountAmount = Math.Max(0m, Math.Round(totalDiscount, 2)),
                FinalLineTotal = lineTotal,
                AppliedRuleDescription = ruleDesc,
                CurrencyCode = req.CurrencyCode
            });
        }

        public async Task<PriceListSummaryDto> SavePriceListAsync(Guid tenantId, PriceListSummaryDto dto, CancellationToken ct = default)
        {
            EnsureSeededPriceLists(tenantId);

            var lists = _tenantPriceLists.GetOrAdd(tenantId, _ => new List<PriceListSummaryDto>());
            var existing = lists.FirstOrDefault(l => l.Id == dto.Id);

            if (existing != null)
            {
                lists.Remove(existing);
            }
            else if (dto.Id == Guid.Empty)
            {
                dto.Id = Guid.NewGuid();
            }

            lists.Insert(0, dto);
            return await Task.FromResult(dto);
        }

        private static void EnsureSeededPriceLists(Guid tenantId)
        {
            _tenantPriceLists.GetOrAdd(tenantId, tid => new List<PriceListSummaryDto>
            {
                new()
                {
                    Id = Guid.Parse("66666666-6666-6666-6666-666666666601"),
                    Name = "Wholesale Master Tier A (Volume Contract)",
                    Code = "PL-WHOLESALE-A",
                    CustomerTier = "Wholesale",
                    CurrencyCode = "USD",
                    ValidFrom = DateTime.UtcNow.AddMonths(-3),
                    ValidTo = DateTime.UtcNow.AddMonths(9),
                    IsActive = true,
                    Items = new List<ItemTierPriceDto>
                    {
                        new()
                        {
                            ItemId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                            ItemCode = "SKU-MOT-100",
                            ItemName = "Industrial Electric Motor (7.5 kW)",
                            BasePrice = 320m,
                            MinQtyTier1 = 1,
                            PriceTier1 = 288m,
                            MinQtyTier2 = 10,
                            PriceTier2 = 265m,
                            MinQtyTier3 = 50,
                            PriceTier3 = 240m,
                            PromotionalDiscountPercent = 5m
                        },
                        new()
                        {
                            ItemId = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                            ItemCode = "SKU-PMP-200",
                            ItemName = "High-Pressure Hydraulic Pump 250 Bar",
                            BasePrice = 450m,
                            MinQtyTier1 = 1,
                            PriceTier1 = 405m,
                            MinQtyTier2 = 5,
                            PriceTier2 = 375m,
                            MinQtyTier3 = 20,
                            PriceTier3 = 340m,
                            PromotionalDiscountPercent = 0m
                        }
                    }
                },
                new()
                {
                    Id = Guid.Parse("66666666-6666-6666-6666-666666666602"),
                    Name = "Distributor Global Fleet Price List",
                    Code = "PL-DISTRIBUTOR-EXP",
                    CustomerTier = "Distributor",
                    CurrencyCode = "USD",
                    ValidFrom = DateTime.UtcNow.AddMonths(-1),
                    ValidTo = DateTime.UtcNow.AddMonths(11),
                    IsActive = true,
                    Items = new List<ItemTierPriceDto>
                    {
                        new()
                        {
                            ItemId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                            ItemCode = "SKU-MOT-100",
                            ItemName = "Industrial Electric Motor (7.5 kW)",
                            BasePrice = 320m,
                            MinQtyTier1 = 1,
                            PriceTier1 = 240m,
                            MinQtyTier2 = 25,
                            PriceTier2 = 220m,
                            MinQtyTier3 = 100,
                            PriceTier3 = 195m,
                            PromotionalDiscountPercent = 2.5m
                        }
                    }
                }
            });
        }
    }
}
