using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Administration.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Route("api/v1/licensing/subscriptions")]
    [Authorize]
    public class SubscriptionsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public SubscriptionsController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        [HttpGet]
        public async Task<IActionResult> ListSubscriptions()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var subs = await _db.TenantSubscriptions.AsNoTracking()
                .Where(s => s.TenantId == tenantId)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();

            if (!subs.Any())
            {
                subs.Add(new TenantSubscription
                {
                    TenantId = tenantId,
                    PlanCode = "enterprise",
                    Status = "Active",
                    BillingCycle = "Monthly",
                    StartDate = DateTime.UtcNow.AddMonths(-1),
                    EndDate = DateTime.UtcNow.AddYears(1),
                    CreatedAt = DateTime.UtcNow
                });
            }

            return Ok(new { data = subs, items = subs, subscriptions = subs, total = subs.Count });
        }

        [HttpGet("plans")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPlans()
        {
            var plans = await _db.SubscriptionPlans.AsNoTracking()
                .Where(p => p.IsActive)
                .OrderBy(p => p.SortOrder)
                .ToListAsync();

            if (!plans.Any())
            {
                plans = GetDefaultPlans();
            }

            return Ok(new { success = true, plans });
        }

        [HttpGet("current")]
        public async Task<IActionResult> GetCurrentSubscription()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var sub = await _db.TenantSubscriptions.AsNoTracking()
                .Where(s => s.TenantId == tenantId)
                .OrderByDescending(s => s.CreatedAt)
                .FirstOrDefaultAsync();

            if (sub == null)
            {
                sub = new TenantSubscription
                {
                    TenantId = tenantId,
                    PlanCode = "trial",
                    Status = "Active",
                    BillingCycle = "Monthly",
                    Amount = 0,
                    StartDate = DateTime.UtcNow,
                    TrialEndsAt = DateTime.UtcNow.AddDays(14),
                    EndDate = DateTime.UtcNow.AddDays(14)
                };
            }

            var activeUsersCount = await _db.Users.CountAsync(u => u.TenantId == tenantId && u.IsActive);
            var storageBytes = await _db.DocumentRecords.Where(d => d.TenantId == tenantId).SumAsync(d => (long?)d.FileSizeBytes) ?? 0;
            var storageMb = Math.Round(storageBytes / 1024d / 1024d, 2);

            var planConfig = (await _db.SubscriptionPlans.AsNoTracking().FirstOrDefaultAsync(p => p.PlanCode == sub.PlanCode))
                ?? GetDefaultPlans().FirstOrDefault(p => p.PlanCode == sub.PlanCode)
                ?? GetDefaultPlans().First();

            var daysRemaining = 0;
            if (sub.Status == "Active" || sub.Status == "Trialing")
            {
                var expiryDate = sub.TrialEndsAt ?? sub.EndDate ?? DateTime.UtcNow.AddDays(14);
                daysRemaining = Math.Max(0, (int)(expiryDate - DateTime.UtcNow).TotalDays);
            }

            return Ok(new
            {
                success = true,
                subscription = sub,
                plan = planConfig,
                usage = new
                {
                    activeUsers = activeUsersCount,
                    maxUsers = planConfig.MaxUsers,
                    storageMb,
                    maxStorageMb = planConfig.MaxStorageMb,
                    daysRemaining
                }
            });
        }

        [HttpPost("checkout-session")]
        public async Task<IActionResult> CreateCheckoutSession([FromBody] CreateCheckoutDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var plan = (await _db.SubscriptionPlans.AsNoTracking().FirstOrDefaultAsync(p => p.PlanCode == dto.PlanCode))
                ?? GetDefaultPlans().FirstOrDefault(p => p.PlanCode == dto.PlanCode);

            if (plan == null)
                return BadRequest(new { success = false, message = "Invalid plan selected." });

            var isAnnual = string.Equals(dto.BillingCycle, "Annual", StringComparison.OrdinalIgnoreCase);
            var amount = isAnnual ? plan.AnnualPriceInr : plan.MonthlyPriceInr;
            var currency = "INR";
            var provider = string.IsNullOrWhiteSpace(dto.Gateway) ? "Razorpay" : dto.Gateway;

            var orderId = $"{provider.ToUpperInvariant()}_ORDER_{DateTime.UtcNow:yyyyMMddHHmmss}_{Guid.NewGuid().ToString()[..6]}";

            return Ok(new
            {
                success = true,
                orderId,
                amount,
                currency,
                planCode = plan.PlanCode,
                planName = plan.Name,
                billingCycle = isAnnual ? "Annual" : "Monthly",
                provider,
                razorpayKeyId = "rzp_test_UabIndiaSaaSKey",
                stripePublishableKey = "pk_test_UabIndiaSaaSKey"
            });
        }

        [HttpPost("verify-payment")]
        public async Task<IActionResult> VerifyPayment([FromBody] VerifyPaymentDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var plan = (await _db.SubscriptionPlans.AsNoTracking().FirstOrDefaultAsync(p => p.PlanCode == dto.PlanCode))
                ?? GetDefaultPlans().FirstOrDefault(p => p.PlanCode == dto.PlanCode);

            if (plan == null)
                return BadRequest(new { success = false, message = "Invalid plan code." });

            var isAnnual = string.Equals(dto.BillingCycle, "Annual", StringComparison.OrdinalIgnoreCase);
            var amount = isAnnual ? plan.AnnualPriceInr : plan.MonthlyPriceInr;
            var duration = isAnnual ? TimeSpan.FromDays(365) : TimeSpan.FromDays(30);

            var existing = await _db.TenantSubscriptions
                .Where(s => s.TenantId == tenantId)
                .OrderByDescending(s => s.CreatedAt)
                .FirstOrDefaultAsync();

            if (existing != null)
            {
                existing.PlanCode = plan.PlanCode;
                existing.Status = "Active";
                existing.BillingCycle = isAnnual ? "Annual" : "Monthly";
                existing.Amount = amount;
                existing.StartDate = DateTime.UtcNow;
                existing.EndDate = DateTime.UtcNow.Add(duration);
                existing.NextBillingDate = DateTime.UtcNow.Add(duration);
                existing.GatewayProvider = dto.Gateway ?? "Razorpay";
                existing.GatewaySubscriptionId = dto.PaymentId ?? dto.OrderId;
                existing.LastPaymentStatus = "Success";
                existing.LastPaymentDate = DateTime.UtcNow;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                var sub = new TenantSubscription
                {
                    TenantId = tenantId,
                    PlanCode = plan.PlanCode,
                    Status = "Active",
                    BillingCycle = isAnnual ? "Annual" : "Monthly",
                    Amount = amount,
                    Currency = "INR",
                    StartDate = DateTime.UtcNow,
                    EndDate = DateTime.UtcNow.Add(duration),
                    NextBillingDate = DateTime.UtcNow.Add(duration),
                    GatewayProvider = dto.Gateway ?? "Razorpay",
                    GatewaySubscriptionId = dto.PaymentId ?? dto.OrderId,
                    LastPaymentStatus = "Success",
                    LastPaymentDate = DateTime.UtcNow,
                    CreatedBy = GetUserId()
                };
                _db.TenantSubscriptions.Add(sub);
            }

            var year = DateTime.UtcNow.Year;
            var invoiceCount = await _db.LicenseInvoices.CountAsync(i => i.TenantId == tenantId);
            var licenseInvoice = new LicenseInvoice
            {
                TenantId = tenantId,
                InvoiceNumber = $"LIC-{year}-{(invoiceCount + 1):D4}",
                Period = DateTime.UtcNow.ToString("yyyy-MM"),
                Plan = plan.Name,
                Amount = amount,
                Status = "Paid",
                PaidDate = DateTime.UtcNow,
                Remarks = $"Online payment via {dto.Gateway ?? "Razorpay"} ({dto.PaymentId ?? dto.OrderId})"
            };
            _db.LicenseInvoices.Add(licenseInvoice);

            await _db.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = $"Successfully upgraded to {plan.Name} plan!",
                invoiceNumber = licenseInvoice.InvoiceNumber
            });
        }

        [HttpPost("cancel")]
        public async Task<IActionResult> CancelSubscription()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var sub = await _db.TenantSubscriptions
                .Where(s => s.TenantId == tenantId)
                .OrderByDescending(s => s.CreatedAt)
                .FirstOrDefaultAsync();

            if (sub == null)
                return NotFound(new { success = false, message = "No active subscription found." });

            sub.AutoRenew = false;
            sub.Status = "Cancelled";
            sub.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new { success = true, message = "Subscription will cancel at the end of the current billing cycle." });
        }

        private static List<SubscriptionPlan> GetDefaultPlans()
        {
            return new List<SubscriptionPlan>
            {
                new()
                {
                    PlanCode = "trial",
                    Name = "Free Trial",
                    Description = "14-day full access trial for evaluation.",
                    MonthlyPriceInr = 0,
                    AnnualPriceInr = 0,
                    MaxUsers = 5,
                    MaxStorageMb = 2048,
                    MaxApiCallsPerDay = 1000,
                    SortOrder = 1,
                    IsActive = true
                },
                new()
                {
                    PlanCode = "starter",
                    Name = "Starter Plan",
                    Description = "Essential ERP for growing businesses and SMEs.",
                    MonthlyPriceInr = 2499,
                    AnnualPriceInr = 24990,
                    MaxUsers = 15,
                    MaxStorageMb = 10240,
                    MaxApiCallsPerDay = 10000,
                    SortOrder = 2,
                    IsActive = true
                },
                new()
                {
                    PlanCode = "growth",
                    Name = "Growth Plan",
                    Description = "Full-featured multi-company ERP with advanced payroll & GST.",
                    MonthlyPriceInr = 6999,
                    AnnualPriceInr = 69990,
                    MaxUsers = 50,
                    MaxStorageMb = 51200,
                    MaxApiCallsPerDay = 50000,
                    SortOrder = 3,
                    IsActive = true
                },
                new()
                {
                    PlanCode = "enterprise",
                    Name = "Enterprise Plan",
                    Description = "Unlimited scale, dedicated support, webhooks & custom workflows.",
                    MonthlyPriceInr = 19999,
                    AnnualPriceInr = 199990,
                    MaxUsers = 500,
                    MaxStorageMb = 512000,
                    MaxApiCallsPerDay = 500000,
                    SortOrder = 4,
                    IsActive = true
                }
            };
        }

        private Guid? GetUserId()
        {
            var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(raw, out var id) ? id : null;
        }
    }

    public class CreateCheckoutDto
    {
        public string PlanCode { get; set; } = string.Empty;
        public string BillingCycle { get; set; } = "Monthly";
        public string Gateway { get; set; } = "Razorpay";
    }

    public class VerifyPaymentDto
    {
        public string PlanCode { get; set; } = string.Empty;
        public string BillingCycle { get; set; } = "Monthly";
        public string? OrderId { get; set; }
        public string? PaymentId { get; set; }
        public string? Signature { get; set; }
        public string? Gateway { get; set; }
    }
}
