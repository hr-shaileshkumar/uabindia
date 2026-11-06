using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Administration.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Route("api/v1/administration/payment-terms")]
    [Authorize]
    [Authorize(Policy = "Module:platform")]
    public class PaymentTermsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public PaymentTermsController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        private Guid TenantId => _tenantAccessor.GetTenantId();

        private static readonly List<PaymentTermRecord> DefaultPaymentTerms = new()
        {
            new() { Id = "net30", Code = "NET30", Name = "Net 30 Days", DueDays = 30, DiscountDays = 0, DiscountPercent = 0, IsActive = true, Description = "Standard commercial payment due within 30 days of invoice date" },
            new() { Id = "net15", Code = "NET15", Name = "Net 15 Days", DueDays = 15, DiscountDays = 0, DiscountPercent = 0, IsActive = true, Description = "Accelerated settlement terms due in 15 days" },
            new() { Id = "net45", Code = "NET45", Name = "Net 45 Days", DueDays = 45, DiscountDays = 0, DiscountPercent = 0, IsActive = true, Description = "Standard vendor credit terms, due in 45 days" },
            new() { Id = "net60", Code = "NET60", Name = "Net 60 Days", DueDays = 60, DiscountDays = 0, DiscountPercent = 0, IsActive = true, Description = "Extended enterprise credit window, due in 60 days" },
            new() { Id = "cashdisc", Code = "2_10_NET30", Name = "2/10 Net 30", DueDays = 30, DiscountDays = 10, DiscountPercent = 2.0m, IsActive = true, Description = "2% cash discount if settled within 10 days, otherwise full amount net 30" },
            new() { Id = "imm", Code = "IMMEDIATE", Name = "Immediate / Due Upon Receipt", DueDays = 0, DiscountDays = 0, DiscountPercent = 0, IsActive = true, Description = "Payable immediately upon invoice presentation" },
            new() { Id = "adv", Code = "ADVANCE", Name = "100% Advance Payment", DueDays = 0, DiscountDays = 0, DiscountPercent = 0, IsActive = true, Description = "Proforma advance payment cleared prior to consignment dispatch" },
            new() { Id = "cod", Code = "COD", Name = "Cash On Delivery (COD)", DueDays = 0, DiscountDays = 0, DiscountPercent = 0, IsActive = true, Description = "Payment collected upon physical consignment handover" }
        };

        private async Task<(TenantConfig Config, List<PaymentTermRecord> Items)> GetOrCreateItemsAsync()
        {
            var tenantId = TenantId;
            var config = await _db.TenantConfigs.FirstOrDefaultAsync(c => c.TenantId == tenantId);
            if (config == null)
            {
                config = new TenantConfig { TenantId = tenantId, ConfigJson = "{}" };
                _db.TenantConfigs.Add(config);
            }

            var root = new Dictionary<string, object>();
            try
            {
                if (!string.IsNullOrWhiteSpace(config.ConfigJson) && config.ConfigJson != "{}")
                {
                    root = JsonSerializer.Deserialize<Dictionary<string, object>>(config.ConfigJson) ?? new();
                }
            }
            catch { }

            List<PaymentTermRecord> items;
            if (root.TryGetValue("paymentTerms", out var raw) && raw != null)
            {
                var json = raw.ToString() ?? "[]";
                items = JsonSerializer.Deserialize<List<PaymentTermRecord>>(json) ?? new();
            }
            else
            {
                items = DefaultPaymentTerms.Select(p => new PaymentTermRecord
                {
                    Id = Guid.NewGuid().ToString("N"),
                    Code = p.Code,
                    Name = p.Name,
                    DueDays = p.DueDays,
                    DiscountDays = p.DiscountDays,
                    DiscountPercent = p.DiscountPercent,
                    IsActive = p.IsActive,
                    Description = p.Description
                }).ToList();

                root["paymentTerms"] = items;
                config.ConfigJson = JsonSerializer.Serialize(root);
                await _db.SaveChangesAsync();
            }

            return (config, items);
        }

        private async Task SaveItemsAsync(TenantConfig config, List<PaymentTermRecord> items)
        {
            var root = new Dictionary<string, object>();
            try
            {
                if (!string.IsNullOrWhiteSpace(config.ConfigJson) && config.ConfigJson != "{}")
                {
                    root = JsonSerializer.Deserialize<Dictionary<string, object>>(config.ConfigJson) ?? new();
                }
            }
            catch { }

            root["paymentTerms"] = items;
            config.ConfigJson = JsonSerializer.Serialize(root);
            await _db.SaveChangesAsync();
        }

        [HttpGet]
        public async Task<IActionResult> List()
        {
            var (_, items) = await GetOrCreateItemsAsync();
            var ordered = items.OrderBy(p => p.DueDays).ThenBy(p => p.Code).ToList();
            return Ok(new { paymentTerms = ordered, total = ordered.Count });
        }

        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Create([FromBody] PaymentTermRecord dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Code) || string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest(new { message = "Code and Name are required." });

            var (config, items) = await GetOrCreateItemsAsync();
            var codeUpper = dto.Code.Trim().ToUpperInvariant();

            if (items.Any(p => p.Code.Equals(codeUpper, StringComparison.OrdinalIgnoreCase)))
                return Conflict(new { message = $"Payment terms code '{codeUpper}' already exists." });

            var newItem = new PaymentTermRecord
            {
                Id = Guid.NewGuid().ToString("N"),
                Code = codeUpper,
                Name = dto.Name.Trim(),
                DueDays = Math.Max(0, dto.DueDays),
                DiscountDays = Math.Max(0, dto.DiscountDays),
                DiscountPercent = Math.Max(0, dto.DiscountPercent),
                IsActive = dto.IsActive,
                Description = dto.Description?.Trim()
            };

            items.Add(newItem);
            await SaveItemsAsync(config, items);

            return Ok(newItem);
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Update(string id, [FromBody] PaymentTermRecord dto)
        {
            var (config, items) = await GetOrCreateItemsAsync();
            var item = items.FirstOrDefault(p => p.Id.Equals(id, StringComparison.OrdinalIgnoreCase) || p.Code.Equals(id, StringComparison.OrdinalIgnoreCase));

            if (item == null)
                return NotFound(new { message = "Payment term not found." });

            if (!string.IsNullOrWhiteSpace(dto.Name)) item.Name = dto.Name.Trim();
            item.DueDays = Math.Max(0, dto.DueDays);
            item.DiscountDays = Math.Max(0, dto.DiscountDays);
            item.DiscountPercent = Math.Max(0, dto.DiscountPercent);
            item.IsActive = dto.IsActive;
            item.Description = dto.Description?.Trim();

            await SaveItemsAsync(config, items);
            return Ok(item);
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Delete(string id)
        {
            var (config, items) = await GetOrCreateItemsAsync();
            var item = items.FirstOrDefault(p => p.Id.Equals(id, StringComparison.OrdinalIgnoreCase) || p.Code.Equals(id, StringComparison.OrdinalIgnoreCase));

            if (item == null)
                return NotFound(new { message = "Payment term not found." });

            items.Remove(item);
            await SaveItemsAsync(config, items);

            return Ok(new { message = "Payment term deleted successfully.", id });
        }

        [HttpPost("reset-defaults")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> ResetDefaults()
        {
            var tenantId = TenantId;
            var config = await _db.TenantConfigs.FirstOrDefaultAsync(c => c.TenantId == tenantId);
            if (config == null)
            {
                config = new TenantConfig { TenantId = tenantId, ConfigJson = "{}" };
                _db.TenantConfigs.Add(config);
            }

            var items = DefaultPaymentTerms.Select(p => new PaymentTermRecord
            {
                Id = Guid.NewGuid().ToString("N"),
                Code = p.Code,
                Name = p.Name,
                DueDays = p.DueDays,
                DiscountDays = p.DiscountDays,
                DiscountPercent = p.DiscountPercent,
                IsActive = p.IsActive,
                Description = p.Description
            }).ToList();

            await SaveItemsAsync(config, items);
            return Ok(new { message = "Standard payment terms reset to SAP OBB8 defaults.", paymentTerms = items });
        }
    }

    public class PaymentTermRecord
    {
        public string Id { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int DueDays { get; set; } = 30;
        public int DiscountDays { get; set; } = 0;
        public decimal DiscountPercent { get; set; } = 0;
        public bool IsActive { get; set; } = true;
        public string? Description { get; set; }
    }
}
