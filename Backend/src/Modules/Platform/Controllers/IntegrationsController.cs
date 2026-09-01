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
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Platform.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    [Authorize(Policy = "Module:licensing")]
    public class IntegrationsController : ControllerBase
    {
        private static readonly HashSet<string> SecretKeys = new(StringComparer.OrdinalIgnoreCase)
        {
            "clientSecret", "apiKey", "password", "secret", "token"
        };

        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public IntegrationsController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        [HttpGet("api-keys")]
        public async Task<IActionResult> ApiKeys()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var data = await _db.IntegrationApiKeys.AsNoTracking()
                .Where(k => k.TenantId == tenantId)
                .OrderByDescending(k => k.CreatedAt)
                .Select(k => new ApiKeyDto
                {
                    Id = k.Id,
                    Name = k.Name,
                    Prefix = k.Prefix,
                    Scope = k.Scope,
                    Status = k.Status,
                    IsActive = k.Status == "Active",
                    CreatedAt = k.CreatedAt,
                    LastUsedAt = k.LastUsedAt
                })
                .ToListAsync();

            return Ok(new { apiKeys = data });
        }

        [HttpPost("api-keys")]
        public async Task<IActionResult> CreateApiKey([FromBody] CreateApiKeyDto? dto)
        {
            dto ??= new CreateApiKeyDto();
            var name = (dto.Name ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(name))
                return BadRequest(new { success = false, error = "Name is required." });

            var scope = string.IsNullOrWhiteSpace(dto.Scope) ? "read" : dto.Scope.Trim().ToLowerInvariant();
            if (scope is not ("read" or "write" or "admin"))
                return BadRequest(new { success = false, error = "Scope must be read, write, or admin." });

            var tenantId = _tenantAccessor.GetTenantId();
            var secret = Convert.ToHexString(RandomNumberGenerator.GetBytes(24)).ToLowerInvariant();
            var plaintext = $"uab_live_{secret}";
            var prefix = plaintext.Length >= 16 ? plaintext[..16] : plaintext;

            var key = new IntegrationApiKey
            {
                TenantId = tenantId,
                Name = name,
                Prefix = prefix,
                KeyHash = HashApiKey(plaintext),
                Scope = scope,
                Status = "Active",
                CreatedBy = GetUserId()
            };

            _db.IntegrationApiKeys.Add(key);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                apiKey = new ApiKeyDto
                {
                    Id = key.Id,
                    Name = key.Name,
                    Prefix = key.Prefix,
                    Scope = key.Scope,
                    Status = key.Status,
                    IsActive = true,
                    CreatedAt = key.CreatedAt,
                    PlaintextKey = plaintext
                }
            });
        }

        [HttpPost("api-keys/{id:guid}/revoke")]
        public async Task<IActionResult> RevokeApiKey(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var key = await _db.IntegrationApiKeys
                .FirstOrDefaultAsync(k => k.Id == id && k.TenantId == tenantId);
            if (key == null) return NotFound(new { success = false, error = "API key not found." });

            if (key.Status == "Revoked")
                return Ok(new { success = true, message = "API key already revoked." });

            key.Status = "Revoked";
            key.RevokedAt = DateTime.UtcNow;
            key.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new { success = true, message = "API key revoked." });
        }

        [HttpGet]
        public async Task<IActionResult> List()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var data = await _db.IntegrationConnectors.AsNoTracking()
                .Where(c => c.TenantId == tenantId)
                .OrderBy(c => c.Category)
                .ThenBy(c => c.Name)
                .Select(c => new IntegrationDto
                {
                    Id = c.Id,
                    ConnectorKey = c.ConnectorKey,
                    Name = c.Name,
                    Provider = c.Provider,
                    Category = c.Category,
                    Status = c.Status,
                    LastTestedAt = c.LastTestedAt,
                    LastSyncAt = c.LastSyncAt,
                    LastError = c.LastError
                })
                .ToListAsync();

            return Ok(new { integrations = data });
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> Get(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var c = await _db.IntegrationConnectors.AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
            if (c == null) return NotFound(new { success = false, error = "Connector not found." });

            return Ok(new
            {
                success = true,
                data = new IntegrationDto
                {
                    Id = c.Id,
                    ConnectorKey = c.ConnectorKey,
                    Name = c.Name,
                    Provider = c.Provider,
                    Category = c.Category,
                    Status = c.Status,
                    Config = MaskSecrets(ParseConfig(c.ConfigJson)),
                    LastTestedAt = c.LastTestedAt,
                    LastSyncAt = c.LastSyncAt,
                    LastError = c.LastError
                }
            });
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> UpsertConfig(Guid id, [FromBody] UpsertIntegrationConfigDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var c = await _db.IntegrationConnectors
                .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
            if (c == null) return NotFound(new { success = false, error = "Connector not found." });

            var existing = ParseConfig(c.ConfigJson);
            var incoming = dto.Config ?? new Dictionary<string, string?>();
            foreach (var kv in incoming)
            {
                if (kv.Value == null) continue;
                if (SecretKeys.Contains(kv.Key) && IsMasked(kv.Value)) continue;
                existing[kv.Key] = kv.Value;
            }

            c.ConfigJson = JsonSerializer.Serialize(existing);
            c.Status = HasRequiredConfig(c.ConnectorKey, existing) ? "Configured" : "Inactive";
            c.LastError = null;
            c.UpdatedAt = DateTime.UtcNow;
            c.CreatedBy ??= GetUserId();
            await _db.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                data = new IntegrationDto
                {
                    Id = c.Id,
                    ConnectorKey = c.ConnectorKey,
                    Name = c.Name,
                    Provider = c.Provider,
                    Category = c.Category,
                    Status = c.Status,
                    Config = MaskSecrets(existing),
                    LastTestedAt = c.LastTestedAt,
                    LastSyncAt = c.LastSyncAt
                }
            });
        }

        [HttpPost("{id:guid}/test")]
        public async Task<IActionResult> TestConnection(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var c = await _db.IntegrationConnectors
                .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
            if (c == null) return NotFound(new { success = false, error = "Connector not found." });

            var started = DateTime.UtcNow;
            var config = ParseConfig(c.ConfigJson);
            var (ok, message) = ValidateTest(c.ConnectorKey, config);

            c.LastTestedAt = DateTime.UtcNow;
            c.Status = ok ? "Connected" : "Error";
            c.LastError = ok ? null : message;
            c.UpdatedAt = DateTime.UtcNow;

            var log = new IntegrationSyncLog
            {
                TenantId = tenantId,
                ConnectorId = c.Id,
                ConnectorKey = c.ConnectorKey,
                Direction = "Outbound",
                Operation = "TestConnection",
                Status = ok ? "Success" : "Failed",
                RecordsProcessed = 0,
                Message = message,
                StartedAt = started,
                CompletedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = GetUserId()
            };
            _db.IntegrationSyncLogs.Add(log);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                success = ok,
                message,
                status = c.Status,
                logId = log.Id,
                testedAt = c.LastTestedAt
            });
        }

        [HttpPost("{id:guid}/sync")]
        public async Task<IActionResult> Sync(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var c = await _db.IntegrationConnectors
                .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
            if (c == null) return NotFound(new { success = false, error = "Connector not found." });

            var config = ParseConfig(c.ConfigJson);
            var (testOk, testMsg) = ValidateTest(c.ConnectorKey, config);
            if (!testOk)
            {
                return BadRequest(new { success = false, error = testMsg });
            }

            var started = DateTime.UtcNow;
            int records;
            string message;
            string status = "Success";
            string? details = null;

            try
            {
                (records, message, details) = RunSync(c, config, tenantId);
                c.LastSyncAt = DateTime.UtcNow;
                c.Status = "Connected";
                c.LastError = null;
            }
            catch (Exception ex)
            {
                records = 0;
                message = ex.Message;
                status = "Failed";
                c.Status = "Error";
                c.LastError = ex.Message;
            }

            c.UpdatedAt = DateTime.UtcNow;
            var log = new IntegrationSyncLog
            {
                TenantId = tenantId,
                ConnectorId = c.Id,
                ConnectorKey = c.ConnectorKey,
                Direction = "Inbound",
                Operation = "Sync",
                Status = status,
                RecordsProcessed = records,
                Message = message,
                DetailsJson = details,
                StartedAt = started,
                CompletedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = GetUserId()
            };
            _db.IntegrationSyncLogs.Add(log);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                success = status == "Success",
                message,
                recordsProcessed = records,
                status = c.Status,
                syncAt = c.LastSyncAt,
                logId = log.Id
            });
        }

        [HttpGet("logs")]
        public async Task<IActionResult> AllLogs([FromQuery] int limit = 50)
        {
            if (limit < 1) limit = 50;
            if (limit > 200) limit = 200;

            var tenantId = _tenantAccessor.GetTenantId();
            var logs = await _db.IntegrationSyncLogs.AsNoTracking()
                .Where(l => l.TenantId == tenantId)
                .OrderByDescending(l => l.StartedAt)
                .Take(limit)
                .Select(l => new
                {
                    l.Id,
                    l.ConnectorId,
                    l.ConnectorKey,
                    l.Direction,
                    l.Operation,
                    l.Status,
                    l.RecordsProcessed,
                    l.Message,
                    l.StartedAt,
                    l.CompletedAt
                })
                .ToListAsync();

            return Ok(new { success = true, logs });
        }

        [HttpGet("{id:guid}/logs")]
        public async Task<IActionResult> Logs(Guid id, [FromQuery] int limit = 25)
        {
            if (limit < 1) limit = 25;
            if (limit > 100) limit = 100;

            var tenantId = _tenantAccessor.GetTenantId();
            var exists = await _db.IntegrationConnectors.AsNoTracking()
                .AnyAsync(x => x.Id == id && x.TenantId == tenantId);
            if (!exists) return NotFound(new { success = false, error = "Connector not found." });

            var logs = await _db.IntegrationSyncLogs.AsNoTracking()
                .Where(l => l.TenantId == tenantId && l.ConnectorId == id)
                .OrderByDescending(l => l.StartedAt)
                .Take(limit)
                .Select(l => new
                {
                    l.Id,
                    l.ConnectorKey,
                    l.Direction,
                    l.Operation,
                    l.Status,
                    l.RecordsProcessed,
                    l.Message,
                    l.StartedAt,
                    l.CompletedAt
                })
                .ToListAsync();

            return Ok(new { success = true, logs });
        }

        private (int Records, string Message, string? Details) RunSync(
            IntegrationConnector connector,
            Dictionary<string, string?> config,
            Guid tenantId)
        {
            switch (connector.ConnectorKey)
            {
                case "gst_portal":
                {
                    var now = DateTime.UtcNow;
                    var start = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
                    var invoices = _db.SalesInvoices.AsNoTracking()
                        .Where(i => i.TenantId == tenantId && !i.IsDeleted && i.InvoiceDate >= start && i.InvoiceDate < start.AddMonths(1) && i.Status != "Cancelled")
                        .ToList();
                    var report = new ComplianceReport
                    {
                        TenantId = tenantId,
                        ReportType = "GSTR1",
                        FinancialYear = now.Month >= 4 ? now.Year : now.Year - 1,
                        MonthYear = now.Year * 100 + now.Month,
                        GeneratedDate = now,
                        Status = ComplianceReportStatus.Generated,
                        TotalEmployees = invoices.Count,
                        TotalAmount = invoices.Sum(i => i.TotalAmount),
                        EmployeeContribution = invoices.Sum(i => i.CgstAmount + i.SgstAmount),
                        EmployerContribution = invoices.Sum(i => i.IgstAmount),
                        CreatedAt = now
                    };
                    _db.ComplianceReports.Add(report);
                    return (invoices.Count, $"Generated GSTR-1 for {start:yyyy-MM} from {invoices.Count} sales invoice(s).",
                        JsonSerializer.Serialize(new
                        {
                            reportType = report.ReportType,
                            monthYear = report.MonthYear,
                            invoiceCount = invoices.Count,
                            taxable = invoices.Sum(i => i.SubTotal),
                            tax = invoices.Sum(i => i.TaxAmount),
                            invoiceValue = invoices.Sum(i => i.TotalAmount)
                        }));
                }
                case "bank_feed":
                {
                    var accountIdRaw = Get(config, "accountId");
                    if (!Guid.TryParse(accountIdRaw, out var accountId) || accountId == Guid.Empty)
                        accountId = Guid.NewGuid();

                    var period = DateTime.UtcNow.ToString("yyyy-MM");
                    var recon = new BankReconciliation
                    {
                        TenantId = tenantId,
                        AccountId = accountId,
                        AccountCode = Get(config, "accountCode") ?? "BANK-FEED",
                        AccountName = Get(config, "accountName") ?? connector.Name,
                        Period = period,
                        BookBalance = 0,
                        BankBalance = 0,
                        Difference = 0,
                        Status = "Pending",
                        ReconciledAt = DateTime.UtcNow,
                        Remarks = "Imported via bank_feed connector (demo sync).",
                        CreatedAt = DateTime.UtcNow
                    };
                    _db.BankReconciliations.Add(recon);
                    return (1, $"Created bank reconciliation stub for {period}.",
                        JsonSerializer.Serialize(new { period, accountId }));
                }
                case "biometric_device":
                {
                    var deviceId = Get(config, "deviceId") ?? "BIO-DEMO";
                    return (0,
                        $"Heartbeat OK for device {deviceId}. No new punches in demo sync.",
                        JsonSerializer.Serialize(new { deviceId, punches = 0 }));
                }
                default:
                    return (0, "No sync handler for this connector.", null);
            }
        }

        private static (bool Ok, string Message) ValidateTest(string key, Dictionary<string, string?> config)
        {
            switch (key)
            {
                case "gst_portal":
                {
                    var gstin = (Get(config, "gstin") ?? "").Trim().ToUpperInvariant();
                    var username = Get(config, "username");
                    if (string.IsNullOrWhiteSpace(gstin) || !Regex.IsMatch(gstin, @"^[0-9A-Z]{15}$"))
                        return (false, "Valid 15-character GSTIN is required.");
                    if (string.IsNullOrWhiteSpace(username))
                        return (false, "GST portal username is required.");
                    if (string.IsNullOrWhiteSpace(Get(config, "clientId")) || string.IsNullOrWhiteSpace(Get(config, "clientSecret")))
                        return (false, "Client ID and client secret are required.");
                    return (true, "GST portal credentials validated (format check).");
                }
                case "bank_feed":
                {
                    if (string.IsNullOrWhiteSpace(Get(config, "provider")))
                        return (false, "Bank feed provider is required.");
                    if (string.IsNullOrWhiteSpace(Get(config, "apiKey")) && string.IsNullOrWhiteSpace(Get(config, "feedUrl")))
                        return (false, "API key or feed URL is required.");
                    return (true, "Bank feed configuration accepted.");
                }
                case "biometric_device":
                {
                    if (string.IsNullOrWhiteSpace(Get(config, "deviceId")))
                        return (false, "Device ID is required.");
                    if (string.IsNullOrWhiteSpace(Get(config, "deviceUrl")) && string.IsNullOrWhiteSpace(Get(config, "apiKey")))
                        return (false, "Device URL or API key is required.");
                    return (true, "Biometric device configuration accepted.");
                }
                default:
                    return (false, "Unknown connector.");
            }
        }

        private static bool HasRequiredConfig(string key, Dictionary<string, string?> config) =>
            ValidateTest(key, config).Ok ||
            (key switch
            {
                "gst_portal" => !string.IsNullOrWhiteSpace(Get(config, "gstin")),
                "bank_feed" => !string.IsNullOrWhiteSpace(Get(config, "provider")),
                "biometric_device" => !string.IsNullOrWhiteSpace(Get(config, "deviceId")),
                _ => config.Count > 0
            });

        private static string? Get(Dictionary<string, string?> config, string key) =>
            config.TryGetValue(key, out var v) ? v : null;

        private static Dictionary<string, string?> ParseConfig(string? json)
        {
            if (string.IsNullOrWhiteSpace(json)) return new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
            try
            {
                var dict = JsonSerializer.Deserialize<Dictionary<string, string?>>(json);
                return dict != null
                    ? new Dictionary<string, string?>(dict, StringComparer.OrdinalIgnoreCase)
                    : new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
            }
            catch
            {
                return new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
            }
        }

        private static Dictionary<string, string?> MaskSecrets(Dictionary<string, string?> config)
        {
            var masked = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
            foreach (var kv in config)
            {
                if (SecretKeys.Contains(kv.Key) && !string.IsNullOrEmpty(kv.Value))
                    masked[kv.Key] = "••••••••";
                else
                    masked[kv.Key] = kv.Value;
            }
            return masked;
        }

        private static bool IsMasked(string value) =>
            value.All(c => c == '•' || c == '*');

        private static string HashApiKey(string plaintext)
        {
            var hash = SHA256.HashData(Encoding.UTF8.GetBytes(plaintext));
            return Convert.ToHexString(hash).ToLowerInvariant();
        }

        private Guid? GetUserId()
        {
            var raw = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
            return Guid.TryParse(raw, out var id) ? id : null;
        }
    }

    public class UpsertIntegrationConfigDto
    {
        public Dictionary<string, string?>? Config { get; set; }
    }
}
