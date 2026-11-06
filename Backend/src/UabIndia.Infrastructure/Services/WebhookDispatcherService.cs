using System;
using System.Diagnostics;
using System.Linq;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class WebhookDispatcherService : IWebhookDispatcherService
    {
        private static readonly HttpClient _httpClient = new() { Timeout = TimeSpan.FromSeconds(10) };
        private readonly ApplicationDbContext _db;
        private readonly ILogger<WebhookDispatcherService> _logger;

        public WebhookDispatcherService(ApplicationDbContext db, ILogger<WebhookDispatcherService> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task DispatchEventAsync(Guid tenantId, string eventType, object payload, CancellationToken ct = default)
        {
            if (tenantId == Guid.Empty) return;

            try
            {
                var webhooks = await _db.TenantWebhooks
                    .Where(w => w.TenantId == tenantId && !w.IsDeleted && w.IsActive)
                    .ToListAsync(ct);

                if (webhooks.Count == 0) return;

                var eventId = $"evt_{Guid.NewGuid():N}";
                var envelope = new
                {
                    id = eventId,
                    @event = eventType,
                    timestamp = DateTime.UtcNow,
                    tenantId,
                    data = payload
                };

                var payloadJson = JsonSerializer.Serialize(envelope);

                foreach (var webhook in webhooks)
                {
                    if (!IsSubscribed(webhook.EventsJson, eventType))
                        continue;

                    await FireWebhookAsync(webhook, eventId, eventType, payloadJson, ct);
                }

                await _db.SaveChangesAsync(ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to dispatch webhook event '{EventType}' for tenant '{TenantId}'", eventType, tenantId);
            }
        }

        private async Task FireWebhookAsync(
            TenantWebhook webhook,
            string eventId,
            string eventType,
            string payloadJson,
            CancellationToken ct)
        {
            var sw = Stopwatch.StartNew();
            int statusCode = 0;
            string? responseText = null;
            string status = "Failed";

            try
            {
                var signature = ComputeHmacSha256(payloadJson, webhook.SecretKey);

                var req = new HttpRequestMessage(HttpMethod.Post, webhook.TargetUrl)
                {
                    Content = new StringContent(payloadJson, Encoding.UTF8, "application/json")
                };

                req.Headers.Add("X-UabIndia-Event", eventType);
                req.Headers.Add("X-UabIndia-Event-Id", eventId);
                req.Headers.Add("X-UabIndia-Signature", signature);

                var res = await _httpClient.SendAsync(req, ct);
                sw.Stop();

                statusCode = (int)res.StatusCode;
                responseText = await res.Content.ReadAsStringAsync(ct);
                status = res.IsSuccessStatusCode ? "Success" : "Failed";

                webhook.LastTriggeredAt = DateTime.UtcNow;
                if (!res.IsSuccessStatusCode)
                {
                    webhook.FailureCount++;
                    webhook.LastError = $"HTTP {statusCode}: {(responseText.Length > 200 ? responseText[..200] : responseText)}";
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
                webhook.LastTriggeredAt = DateTime.UtcNow;
                webhook.FailureCount++;
                webhook.LastError = ex.Message;
            }

            var log = new WebhookDeliveryLog
            {
                TenantId = webhook.TenantId,
                WebhookId = webhook.Id,
                EventType = eventType,
                TargetUrl = webhook.TargetUrl,
                PayloadJson = payloadJson,
                ResponseStatusCode = statusCode,
                ResponseBody = responseText != null && responseText.Length > 1000 ? responseText[..1000] : responseText,
                Status = status,
                DurationMs = sw.ElapsedMilliseconds,
                AttemptedAt = DateTime.UtcNow
            };

            _db.WebhookDeliveryLogs.Add(log);
        }

        private static bool IsSubscribed(string? eventsJson, string eventType)
        {
            if (string.IsNullOrWhiteSpace(eventsJson)) return true;

            try
            {
                var events = JsonSerializer.Deserialize<string[]>(eventsJson);
                if (events == null || events.Length == 0) return true;

                return events.Any(e => e == "*" || string.Equals(e, eventType, StringComparison.OrdinalIgnoreCase));
            }
            catch
            {
                return eventsJson.Contains(eventType, StringComparison.OrdinalIgnoreCase) || eventsJson.Contains('*');
            }
        }

        private static string ComputeHmacSha256(string message, string secret)
        {
            if (string.IsNullOrEmpty(secret)) secret = "uab_default_webhook_secret";
            var keyBytes = Encoding.UTF8.GetBytes(secret);
            var messageBytes = Encoding.UTF8.GetBytes(message);
            using var hmac = new HMACSHA256(keyBytes);
            var hash = hmac.ComputeHash(messageBytes);
            return Convert.ToHexString(hash).ToLowerInvariant();
        }
    }
}
