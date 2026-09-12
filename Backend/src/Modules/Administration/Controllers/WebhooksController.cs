using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net.Http;
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
    [Authorize]
    public class WebhooksController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private static readonly HttpClient _httpClient = new() { Timeout = TimeSpan.FromSeconds(10) };

        public WebhooksController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        [HttpGet]
        public async Task<IActionResult> List()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var webhooks = await _db.TenantWebhooks.AsNoTracking()
                .Where(w => w.TenantId == tenantId && !w.IsDeleted)
                .OrderByDescending(w => w.CreatedAt)
                .ToListAsync();

            return Ok(new { success = true, webhooks });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateWebhookDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.TargetUrl))
                return BadRequest(new { success = false, message = "Name and Target URL are required." });

            if (!Uri.TryCreate(dto.TargetUrl, UriKind.Absolute, out _))
                return BadRequest(new { success = false, message = "Invalid Target URL format." });

            var tenantId = _tenantAccessor.GetTenantId();
            var secret = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();

            var webhook = new TenantWebhook
            {
                TenantId = tenantId,
                Name = dto.Name.Trim(),
                TargetUrl = dto.TargetUrl.Trim(),
                SecretKey = secret,
                EventsJson = JsonSerializer.Serialize(dto.Events ?? new List<string> { "*" }),
                IsActive = true,
                CreatedBy = GetUserId()
            };

            _db.TenantWebhooks.Add(webhook);
            await _db.SaveChangesAsync();

            return Ok(new { success = true, webhook });
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] CreateWebhookDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var webhook = await _db.TenantWebhooks
                .FirstOrDefaultAsync(w => w.Id == id && w.TenantId == tenantId && !w.IsDeleted);

            if (webhook == null)
                return NotFound(new { success = false, message = "Webhook not found." });

            webhook.Name = dto.Name?.Trim() ?? webhook.Name;
            if (!string.IsNullOrWhiteSpace(dto.TargetUrl) && Uri.TryCreate(dto.TargetUrl, UriKind.Absolute, out _))
            {
                webhook.TargetUrl = dto.TargetUrl.Trim();
            }
            if (dto.Events != null)
            {
                webhook.EventsJson = JsonSerializer.Serialize(dto.Events);
            }
            webhook.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(new { success = true, webhook });
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var webhook = await _db.TenantWebhooks
                .FirstOrDefaultAsync(w => w.Id == id && w.TenantId == tenantId && !w.IsDeleted);

            if (webhook == null)
                return NotFound(new { success = false, message = "Webhook not found." });

            webhook.IsDeleted = true;
            webhook.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new { success = true, message = "Webhook deleted successfully." });
        }

        [HttpPost("{id:guid}/test")]
        public async Task<IActionResult> TestFire(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var webhook = await _db.TenantWebhooks
                .FirstOrDefaultAsync(w => w.Id == id && w.TenantId == tenantId && !w.IsDeleted);

            if (webhook == null)
                return NotFound(new { success = false, message = "Webhook not found." });

            var payload = new
            {
                @event = "test.ping",
                timestamp = DateTime.UtcNow,
                tenantId,
                data = new
                {
                    message = "This is a test webhook payload from UabIndia SaaS ERP.",
                    platform = "UabIndia ERP v3.0"
                }
            };

            var payloadJson = JsonSerializer.Serialize(payload);
            var signature = ComputeHmacSha256(payloadJson, webhook.SecretKey);

            var sw = Stopwatch.StartNew();
            int statusCode = 0;
            string? responseText = null;
            string status = "Failed";

            try
            {
                var req = new HttpRequestMessage(HttpMethod.Post, webhook.TargetUrl)
                {
                    Content = new StringContent(payloadJson, Encoding.UTF8, "application/json")
                };
                req.Headers.Add("X-UabIndia-Event", "test.ping");
                req.Headers.Add("X-UabIndia-Signature", signature);

                var res = await _httpClient.SendAsync(req);
                sw.Stop();
                statusCode = (int)res.StatusCode;
                responseText = await res.Content.ReadAsStringAsync();
                status = res.IsSuccessStatusCode ? "Success" : "Failed";

                webhook.LastTriggeredAt = DateTime.UtcNow;
                if (!res.IsSuccessStatusCode)
                {
                    webhook.FailureCount++;
                    webhook.LastError = $"HTTP {statusCode}: {responseText}";
                }
                else
                {
                    webhook.LastError = null;
                }
            }
            catch (Exception ex)
            {
                sw.Stop();
                status = "Failed";
                responseText = ex.Message;
                webhook.FailureCount++;
                webhook.LastError = ex.Message;
            }

            var log = new WebhookDeliveryLog
            {
                TenantId = tenantId,
                WebhookId = webhook.Id,
                EventType = "test.ping",
                TargetUrl = webhook.TargetUrl,
                PayloadJson = payloadJson,
                ResponseStatusCode = statusCode,
                ResponseBody = responseText != null && responseText.Length > 1000 ? responseText[..1000] : responseText,
                Status = status,
                DurationMs = sw.ElapsedMilliseconds,
                AttemptedAt = DateTime.UtcNow,
                CreatedBy = GetUserId()
            };
            _db.WebhookDeliveryLogs.Add(log);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                success = status == "Success",
                statusCode,
                durationMs = sw.ElapsedMilliseconds,
                response = responseText,
                status
            });
        }

        [HttpGet("logs")]
        public async Task<IActionResult> Logs([FromQuery] int limit = 50)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var logs = await _db.WebhookDeliveryLogs.AsNoTracking()
                .Where(l => l.TenantId == tenantId)
                .OrderByDescending(l => l.AttemptedAt)
                .Take(limit)
                .ToListAsync();

            return Ok(new { success = true, logs });
        }

        private static string ComputeHmacSha256(string message, string secret)
        {
            var keyBytes = Encoding.UTF8.GetBytes(secret);
            var messageBytes = Encoding.UTF8.GetBytes(message);
            using var hmac = new HMACSHA256(keyBytes);
            var hash = hmac.ComputeHash(messageBytes);
            return Convert.ToHexString(hash).ToLowerInvariant();
        }

        private Guid? GetUserId()
        {
            var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(raw, out var id) ? id : null;
        }
    }

    public class CreateWebhookDto
    {
        public string Name { get; set; } = string.Empty;
        public string TargetUrl { get; set; } = string.Empty;
        public List<string>? Events { get; set; }
    }
}
