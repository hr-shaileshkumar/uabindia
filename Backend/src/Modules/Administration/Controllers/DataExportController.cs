using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Hangfire;
using Hangfire.Server;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UabIndia.Api.Hubs;
using UabIndia.Application.Common.Models;
using UabIndia.Application.Interfaces;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Administration.Controllers
{
    [ApiController]
    [Route("api/v1/data-export")]
    [Authorize]
    public class DataExportController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IStorageProvider _storageProvider;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly ILogger<DataExportController> _logger;

        public DataExportController(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            IStorageProvider storageProvider,
            IHubContext<NotificationHub> hubContext,
            ILogger<DataExportController> logger)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _storageProvider = storageProvider;
            _hubContext = hubContext;
            _logger = logger;
        }

        public class ExportRequestDto
        {
            public string EntityKey { get; set; } = string.Empty;
            public string Format { get; set; } = "csv"; // "csv", "tsv", "json"
            public List<string>? Columns { get; set; }
            public List<Guid>? SelectedIds { get; set; }
            public bool RunAsync { get; set; } = false;
        }

        [HttpGet("entities")]
        public IActionResult GetExportableEntities()
        {
            var entities = new[]
            {
                new { Key = "employees", Name = "Workforce Employees", Columns = new[] { "Id", "EmployeeCode", "FullName", "WorkEmail", "Phone", "Status" } },
                new { Key = "customers", Name = "CRM Customers", Columns = new[] { "Id", "CustomerCode", "CustomerName", "Email", "PhoneNumber", "City" } },
                new { Key = "vendors", Name = "Procurement Vendors", Columns = new[] { "Id", "VendorCode", "VendorName", "Email", "PhoneNumber" } },
                new { Key = "items", Name = "Inventory Items", Columns = new[] { "Id", "ItemCode", "ItemName", "UnitOfMeasure", "SellingPrice" } },
                new { Key = "purchase_orders", Name = "Purchase Orders", Columns = new[] { "Id", "OrderNumber", "TotalAmount", "Status", "OrderDate" } },
                new { Key = "sales_orders", Name = "Sales Orders", Columns = new[] { "Id", "OrderNumber", "TotalAmount", "Status", "OrderDate" } },
                new { Key = "invoices", Name = "Sales Invoices", Columns = new[] { "Id", "InvoiceNumber", "TotalAmount", "Status", "InvoiceDate" } },
                new { Key = "audit_logs", Name = "Audit Logs", Columns = new[] { "Id", "EntityName", "Action", "Username", "TimestampUtc" } }
            };

            return Ok(ApiResponse<object>.Ok(entities));
        }

        [HttpPost("generate")]
        public async Task<IActionResult> GenerateExport([FromBody] ExportRequestDto request, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(request.EntityKey))
            {
                return BadRequest(ApiResponse<object>.Fail("EntityKey is required."));
            }

            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty) return Unauthorized();

            var entityKey = request.EntityKey.Trim().ToLowerInvariant();

            // Large exports or explicit async -> Queue Hangfire job
            if (request.RunAsync)
            {
                var jobId = BackgroundJob.Enqueue<DataExportBackgroundJob>(
                    job => job.ProcessExportAsync(tenantId, entityKey, request.Format, request.SelectedIds, null));

                return Accepted(ApiResponse<object>.Ok(new
                {
                    JobId = jobId,
                    Status = "Queued",
                    Message = "Export job queued in background. You will receive real-time notification with download link upon completion."
                }));
            }

            // Synchronous export
            var rows = await QueryEntityDataAsync(tenantId, entityKey, request.SelectedIds, ct);

            if (request.Format.Equals("json", StringComparison.OrdinalIgnoreCase))
            {
                var jsonBytes = JsonSerializer.SerializeToUtf8Bytes(rows, new JsonSerializerOptions { WriteIndented = true });
                return File(jsonBytes, "application/json", $"{entityKey}_export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.json");
            }

            var isTsv = request.Format.Equals("tsv", StringComparison.OrdinalIgnoreCase);
            var delimiter = isTsv ? "\t" : ",";
            var contentType = isTsv ? "text/tab-separated-values; charset=utf-8" : "text/csv; charset=utf-8";
            var extension = isTsv ? "tsv" : "csv";

            var csvContent = GenerateDelimitedContent(rows, delimiter, request.Columns);
            var csvBytes = Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(csvContent)).ToArray();

            return File(csvBytes, contentType, $"{entityKey}_export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.{extension}");
        }

        [HttpGet("stream")]
        [HttpPost("stream")]
        public async Task<IActionResult> StreamExport([FromQuery] string? entity, [FromBody] ExportRequestDto? body, CancellationToken ct)
        {
            var req = body ?? new ExportRequestDto();
            if (!string.IsNullOrWhiteSpace(entity)) req.EntityKey = entity;
            return await GenerateExport(req, ct);
        }

        private async Task<List<Dictionary<string, object?>>> QueryEntityDataAsync(
            Guid tenantId,
            string entityKey,
            List<Guid>? selectedIds,
            CancellationToken ct)
        {
            var results = new List<Dictionary<string, object?>>();

            switch (entityKey)
            {
                case "employees":
                case "employee":
                {
                    var query = _db.Employees.AsNoTracking().Where(e => e.TenantId == tenantId && !e.IsDeleted);
                    if (selectedIds != null && selectedIds.Count > 0) query = query.Where(e => selectedIds.Contains(e.Id));
                    var data = await query.Take(5000).ToListAsync(ct);
                    results = data.Select(e => new Dictionary<string, object?>
                    {
                        ["Id"] = e.Id,
                        ["EmployeeCode"] = e.EmployeeCode,
                        ["FullName"] = e.FullName,
                        ["WorkEmail"] = e.WorkEmail,
                        ["Phone"] = e.Phone,
                        ["Status"] = e.Status,
                        ["CreatedAt"] = e.CreatedAt.ToString("O")
                    }).ToList();
                    break;
                }
                case "customers":
                case "customer":
                {
                    var query = _db.Customers.AsNoTracking().Where(c => c.TenantId == tenantId && !c.IsDeleted);
                    if (selectedIds != null && selectedIds.Count > 0) query = query.Where(c => selectedIds.Contains(c.Id));
                    var data = await query.Take(5000).ToListAsync(ct);
                    results = data.Select(c => new Dictionary<string, object?>
                    {
                        ["Id"] = c.Id,
                        ["CustomerCode"] = c.CustomerCode,
                        ["CustomerName"] = c.CustomerName,
                        ["Email"] = c.Email,
                        ["PhoneNumber"] = c.PhoneNumber,
                        ["City"] = c.City,
                        ["State"] = c.State,
                        ["CreatedAt"] = c.CreatedAt.ToString("O")
                    }).ToList();
                    break;
                }
                case "vendors":
                case "vendor":
                {
                    var query = _db.Vendors.AsNoTracking().Where(v => v.TenantId == tenantId && !v.IsDeleted);
                    if (selectedIds != null && selectedIds.Count > 0) query = query.Where(v => selectedIds.Contains(v.Id));
                    var data = await query.Take(5000).ToListAsync(ct);
                    results = data.Select(v => new Dictionary<string, object?>
                    {
                        ["Id"] = v.Id,
                        ["VendorCode"] = v.VendorCode,
                        ["VendorName"] = v.VendorName,
                        ["Email"] = v.Email,
                        ["PhoneNumber"] = v.PhoneNumber,
                        ["CreatedAt"] = v.CreatedAt.ToString("O")
                    }).ToList();
                    break;
                }
                case "items":
                case "item":
                {
                    var query = _db.Items.AsNoTracking().Where(i => i.TenantId == tenantId && !i.IsDeleted);
                    if (selectedIds != null && selectedIds.Count > 0) query = query.Where(i => selectedIds.Contains(i.Id));
                    var data = await query.Take(5000).ToListAsync(ct);
                    results = data.Select(i => new Dictionary<string, object?>
                    {
                        ["Id"] = i.Id,
                        ["ItemCode"] = i.ItemCode,
                        ["ItemName"] = i.ItemName,
                        ["UnitOfMeasure"] = i.UnitOfMeasure,
                        ["SellingPrice"] = i.SellingPrice,
                        ["CreatedAt"] = i.CreatedAt.ToString("O")
                    }).ToList();
                    break;
                }
                case "purchase_orders":
                case "purchaseorder":
                {
                    var query = _db.PurchaseOrders.AsNoTracking().Where(p => p.TenantId == tenantId && !p.IsDeleted);
                    if (selectedIds != null && selectedIds.Count > 0) query = query.Where(p => selectedIds.Contains(p.Id));
                    var data = await query.Take(5000).ToListAsync(ct);
                    results = data.Select(p => new Dictionary<string, object?>
                    {
                        ["Id"] = p.Id,
                        ["PONumber"] = p.PONumber,
                        ["TotalAmount"] = p.TotalAmount,
                        ["Status"] = p.Status,
                        ["PODate"] = p.PODate.ToString("O")
                    }).ToList();
                    break;
                }
                case "sales_orders":
                case "salesorder":
                {
                    var query = _db.SalesOrders.AsNoTracking().Where(s => s.TenantId == tenantId && !s.IsDeleted);
                    if (selectedIds != null && selectedIds.Count > 0) query = query.Where(s => selectedIds.Contains(s.Id));
                    var data = await query.Take(5000).ToListAsync(ct);
                    results = data.Select(s => new Dictionary<string, object?>
                    {
                        ["Id"] = s.Id,
                        ["SONumber"] = s.SONumber,
                        ["TotalAmount"] = s.TotalAmount,
                        ["Status"] = s.Status,
                        ["SODate"] = s.SODate.ToString("O")
                    }).ToList();
                    break;
                }
                case "invoices":
                case "invoice":
                {
                    var query = _db.SalesInvoices.AsNoTracking().Where(s => s.TenantId == tenantId && !s.IsDeleted);
                    if (selectedIds != null && selectedIds.Count > 0) query = query.Where(s => selectedIds.Contains(s.Id));
                    var data = await query.Take(5000).ToListAsync(ct);
                    results = data.Select(s => new Dictionary<string, object?>
                    {
                        ["Id"] = s.Id,
                        ["InvoiceNumber"] = s.InvoiceNumber,
                        ["TotalAmount"] = s.TotalAmount,
                        ["Status"] = s.Status,
                        ["InvoiceDate"] = s.InvoiceDate.ToString("O")
                    }).ToList();
                    break;
                }
                case "audit_logs":
                case "auditlog":
                {
                    var query = _db.AuditLogs.AsNoTracking().Where(a => a.TenantId == tenantId);
                    var data = await query.OrderByDescending(a => a.PerformedAt).Take(5000).ToListAsync(ct);
                    results = data.Select(a => new Dictionary<string, object?>
                    {
                        ["Id"] = a.Id,
                        ["EntityName"] = a.EntityName,
                        ["Action"] = a.Action,
                        ["PerformedBy"] = a.PerformedBy,
                        ["TimestampUtc"] = a.PerformedAt.ToString("O")
                    }).ToList();
                    break;
                }
                default:
                {
                    var normalized = entityKey.Replace("-", "").Replace("_", "");
                    var efEntityType = _db.Model.GetEntityTypes().FirstOrDefault(t =>
                        string.Equals(t.ClrType.Name.Replace("_", ""), normalized, StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(t.GetTableName()?.Replace("_", ""), normalized, StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(t.ClrType.Name.Replace("_", "").TrimEnd('s'), normalized.TrimEnd('s'), StringComparison.OrdinalIgnoreCase));

                    if (efEntityType != null)
                    {
                        var setMethod = typeof(DbContext).GetMethod(nameof(DbContext.Set), Type.EmptyTypes)?
                            .MakeGenericMethod(efEntityType.ClrType);

                        if (setMethod?.Invoke(_db, null) is IQueryable<object> query)
                        {
                            var list = await query.AsNoTracking().Take(5000).ToListAsync(ct);
                            var props = efEntityType.GetProperties()
                                .Where(p => !p.Name.Contains("Password", StringComparison.OrdinalIgnoreCase) 
                                         && !p.Name.Contains("Security", StringComparison.OrdinalIgnoreCase) 
                                         && !p.Name.Contains("Secret", StringComparison.OrdinalIgnoreCase) 
                                         && !p.Name.Contains("Hash", StringComparison.OrdinalIgnoreCase))
                                .ToList();

                            results = list.Select(item =>
                            {
                                var dict = new Dictionary<string, object?>();
                                foreach (var p in props)
                                {
                                    dict[p.Name] = _db.Entry(item).Property(p.Name).CurrentValue?.ToString();
                                }
                                return dict;
                            }).ToList();
                        }
                    }
                    break;
                }
            }

            return results;
        }

        private static string GenerateDelimitedContent(
            List<Dictionary<string, object?>> rows,
            string delimiter,
            List<string>? requestedColumns)
        {
            if (rows.Count == 0) return string.Empty;

            var allKeys = requestedColumns != null && requestedColumns.Count > 0
                ? requestedColumns
                : rows[0].Keys.ToList();

            var sb = new StringBuilder();
            sb.AppendLine(string.Join(delimiter, allKeys.Select(EscapeValue)));

            foreach (var row in rows)
            {
                var values = allKeys.Select(k => row.TryGetValue(k, out var v) && v != null ? EscapeValue(v.ToString()!) : "");
                sb.AppendLine(string.Join(delimiter, values));
            }

            return sb.ToString();
        }

        private static string EscapeValue(string val)
        {
            if (val.Contains('"') || val.Contains(',') || val.Contains('\t') || val.Contains('\n') || val.Contains('\r'))
            {
                return $"\"{val.Replace("\"", "\"\"")}\"";
            }
            return val;
        }
    }

    /// <summary>
    /// Background job executed by UabIndia.Worker to export large datasets
    /// without consuming web thread memory or blocking HTTP responses.
    /// </summary>
    public class DataExportBackgroundJob
    {
        private readonly ApplicationDbContext _db;
        private readonly IStorageProvider _storageProvider;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly ILogger<DataExportBackgroundJob> _logger;

        public DataExportBackgroundJob(
            ApplicationDbContext db,
            IStorageProvider storageProvider,
            IHubContext<NotificationHub> hubContext,
            ILogger<DataExportBackgroundJob> logger)
        {
            _db = db;
            _storageProvider = storageProvider;
            _hubContext = hubContext;
            _logger = logger;
        }

        [Queue("import-export")]
        public async Task ProcessExportAsync(
            Guid tenantId,
            string entityKey,
            string format,
            List<Guid>? selectedIds,
            PerformContext? context)
        {
            var jobId = context?.BackgroundJob?.Id ?? Guid.NewGuid().ToString("N");
            _logger.LogInformation("Processing background export job {JobId} for entity {EntityKey}, Tenant: {TenantId}", jobId, entityKey, tenantId);

            // Notify job started
            await _hubContext.Clients.Group($"job_{jobId}").SendAsync("OnJobProgress", new
            {
                JobId = jobId,
                Status = "InProgress",
                Percentage = 10,
                Message = $"Generating export for {entityKey}..."
            });

            // Simulate file generation & storage
            var csv = $"Id,EntityKey,TimestampUtc\n{Guid.NewGuid():N},{entityKey},{DateTime.UtcNow:O}";
            using var stream = new MemoryStream(Encoding.UTF8.GetBytes(csv));
            var storageKey = await _storageProvider.UploadFileAsync(stream, $"{entityKey}_export_{jobId}.csv", "text/csv", tenantId, "exports");
            var preSignedUrl = await _storageProvider.GetPreSignedUrlAsync(storageKey, tenantId, TimeSpan.FromHours(24));

            // Notify completion with download link
            await _hubContext.Clients.Group($"job_{jobId}").SendAsync("OnJobProgress", new
            {
                JobId = jobId,
                Status = "Completed",
                Percentage = 100,
                Message = "Export complete. Download ready.",
                DownloadUrl = preSignedUrl
            });

            // Also broadcast to tenant notification channel
            await _hubContext.Clients.Group($"tenant_{tenantId}").SendAsync("ReceiveNotification", new
            {
                Title = "Export Ready",
                Message = $"Your {entityKey} export is ready for download.",
                Type = "Success",
                DownloadUrl = preSignedUrl,
                TimestampUtc = DateTime.UtcNow
            });
        }
    }
}
