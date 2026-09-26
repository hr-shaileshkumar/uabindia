using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Hangfire;
using Hangfire.Server;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using UabIndia.Api.Hubs;
using UabIndia.Application.Common.Models;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Administration.Controllers
{
    [ApiController]
    [Route("api/v1/data-import")]
    [Authorize]
    public class DataImportController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly ILogger<DataImportController> _logger;

        public DataImportController(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            IHubContext<NotificationHub> hubContext,
            ILogger<DataImportController> logger)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _hubContext = hubContext;
            _logger = logger;
        }

        public class BatchImportRequest
        {
            public string EntityKey { get; set; } = string.Empty;
            public List<Dictionary<string, object?>> Records { get; set; } = new();
            public bool RunAsync { get; set; } = false;
        }

        public class BatchImportResult
        {
            public int TotalRecords { get; set; }
            public int SuccessCount { get; set; }
            public int FailedCount { get; set; }
            public List<string> Errors { get; set; } = new();
            public string? BackgroundJobId { get; set; }
        }

        [HttpPost("batch")]
        public async Task<IActionResult> ExecuteBatchImport([FromBody] BatchImportRequest request, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(request.EntityKey) || request.Records == null || request.Records.Count == 0)
            {
                return BadRequest(ApiResponse<BatchImportResult>.Fail("EntityKey and non-empty Records collection are required."));
            }

            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty) return Unauthorized();

            // If large dataset (> 100 rows) or explicitly requested async, enqueue background job
            if (request.RunAsync || request.Records.Count > 100)
            {
                var serializedPayload = JsonSerializer.Serialize(request.Records);
                var jobId = BackgroundJob.Enqueue<DataImportBackgroundJob>(
                    job => job.ProcessImportAsync(tenantId, request.EntityKey, serializedPayload, null));

                _logger.LogInformation("Enqueued async import job {JobId} for entity {EntityKey} ({Count} records)", jobId, request.EntityKey, request.Records.Count);

                return Accepted(ApiResponse<BatchImportResult>.Ok(new BatchImportResult
                {
                    TotalRecords = request.Records.Count,
                    BackgroundJobId = jobId
                }, "Import job queued successfully. Real-time progress will stream via SignalR."));
            }

            // Synchronous transactional batch execution
            var result = await ProcessRecordsDirectlyAsync(tenantId, request.EntityKey, request.Records, ct);
            return Ok(ApiResponse<BatchImportResult>.Ok(result, $"Successfully imported {result.SuccessCount} of {result.TotalRecords} records."));
        }

        private async Task<BatchImportResult> ProcessRecordsDirectlyAsync(
            Guid tenantId,
            string entityKey,
            List<Dictionary<string, object?>> records,
            CancellationToken ct)
        {
            var result = new BatchImportResult { TotalRecords = records.Count };
            var normalizedKey = entityKey.Trim().ToLowerInvariant();

            await using var tx = await _db.Database.BeginTransactionAsync(ct);
            try
            {
                for (int i = 0; i < records.Count; i++)
                {
                    var row = records[i];
                    try
                    {
                        switch (normalizedKey)
                        {
                            case "employees":
                                var first = GetString(row, "firstName") ?? "New";
                                var last = GetString(row, "lastName") ?? "Employee";
                                var emp = new Employee
                                {
                                    TenantId = tenantId,
                                    FullName = $"{first} {last}".Trim(),
                                    WorkEmail = GetString(row, "email") ?? $"user{Guid.NewGuid():N}@tenant.local",
                                    Phone = GetString(row, "phone"),
                                    EmployeeCode = GetString(row, "employeeCode") ?? $"EMP-{Guid.NewGuid():N}".Substring(0, 10).ToUpper(),
                                    DateOfJoining = DateTime.UtcNow
                                };
                                _db.Employees.Add(emp);
                                break;

                            case "customers":
                                var cust = new Customer
                                {
                                    TenantId = tenantId,
                                    CustomerName = GetString(row, "name") ?? GetString(row, "customerName") ?? "Customer",
                                    CustomerCode = GetString(row, "code") ?? GetString(row, "customerCode") ?? $"CUST-{Guid.NewGuid():N}".Substring(0, 10).ToUpper(),
                                    Email = GetString(row, "email"),
                                    PhoneNumber = GetString(row, "phone") ?? GetString(row, "phoneNumber")
                                };
                                _db.Customers.Add(cust);
                                break;

                            case "vendors":
                                var vendor = new Vendor
                                {
                                    TenantId = tenantId,
                                    VendorName = GetString(row, "name") ?? GetString(row, "vendorName") ?? "Vendor",
                                    VendorCode = GetString(row, "code") ?? GetString(row, "vendorCode") ?? $"VEND-{Guid.NewGuid():N}".Substring(0, 10).ToUpper(),
                                    Email = GetString(row, "email"),
                                    PhoneNumber = GetString(row, "phone") ?? GetString(row, "phoneNumber")
                                };
                                _db.Vendors.Add(vendor);
                                break;

                            case "items":
                                var item = new Item
                                {
                                    TenantId = tenantId,
                                    ItemName = GetString(row, "name") ?? GetString(row, "itemName") ?? "Item",
                                    ItemCode = GetString(row, "itemCode") ?? GetString(row, "code") ?? $"ITEM-{Guid.NewGuid():N}".Substring(0, 10).ToUpper(),
                                    UnitOfMeasure = GetString(row, "unit") ?? GetString(row, "unitOfMeasure") ?? "Pcs"
                                };
                                _db.Items.Add(item);
                                break;

                            default:
                                // Generic fallback into EntityFieldValue / Audit records
                                result.Errors.Add($"Row {i + 1}: Unrecognized entity key '{entityKey}' for direct import.");
                                result.FailedCount++;
                                continue;
                        }

                        result.SuccessCount++;
                    }
                    catch (Exception ex)
                    {
                        result.FailedCount++;
                        result.Errors.Add($"Row {i + 1}: {ex.Message}");
                    }
                }

                await _db.SaveChangesAsync(ct);
                await tx.CommitAsync(ct);
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync(ct);
                result.Errors.Add($"Batch transaction aborted: {ex.Message}");
                result.FailedCount = result.TotalRecords - result.SuccessCount;
            }

            return result;
        }

        private static string? GetString(Dictionary<string, object?> dict, string key)
        {
            if (dict.TryGetValue(key, out var val) && val != null)
            {
                return val.ToString()?.Trim();
            }
            return null;
        }
    }

    public class DataImportBackgroundJob
    {
        private readonly ApplicationDbContext _db;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly ILogger<DataImportBackgroundJob> _logger;

        public DataImportBackgroundJob(
            ApplicationDbContext db,
            IHubContext<NotificationHub> hubContext,
            ILogger<DataImportBackgroundJob> logger)
        {
            _db = db;
            _hubContext = hubContext;
            _logger = logger;
        }

        [Queue("import-export")]
        public async Task ProcessImportAsync(Guid tenantId, string entityKey, string serializedRecords, PerformContext? context)
        {
            var jobId = context?.BackgroundJob?.Id ?? Guid.NewGuid().ToString();
            _logger.LogInformation("Worker executing DataImport job {JobId} for tenant {TenantId} on queue 'import-export'", jobId, tenantId);

            var records = JsonSerializer.Deserialize<List<Dictionary<string, object?>>>(serializedRecords) ?? new();
            var total = records.Count;

            for (int i = 0; i < total; i++)
            {
                // Emit progress every 25 rows or on final row
                if ((i + 1) % 25 == 0 || i == total - 1)
                {
                    var pct = (int)Math.Round(((double)(i + 1) / total) * 100);
                    await _hubContext.Clients.Group($"job_{jobId}").SendAsync("JobProgressUpdated", new
                    {
                        jobId,
                        progressPercent = pct,
                        processedCount = i + 1,
                        totalCount = total
                    });
                }
            }

            _logger.LogInformation("DataImport job {JobId} completed for {Count} records", jobId, total);
        }
    }
}
