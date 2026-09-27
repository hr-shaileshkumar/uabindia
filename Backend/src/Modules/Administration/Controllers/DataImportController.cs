using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
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

        public class RowValidationError
        {
            public int RowIndex { get; set; }
            public string? Field { get; set; }
            public string Message { get; set; } = string.Empty;
        }

        public class BatchImportValidationResult
        {
            public bool IsValid { get; set; }
            public int TotalRecords { get; set; }
            public int ValidRecords { get; set; }
            public int InvalidRecords { get; set; }
            public List<RowValidationError> Errors { get; set; } = new();
        }

        [HttpPost("validate")]
        public async Task<IActionResult> ValidateBatchImport([FromBody] BatchImportRequest request, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(request.EntityKey) || request.Records == null || request.Records.Count == 0)
            {
                return BadRequest(ApiResponse<BatchImportValidationResult>.Fail("EntityKey and non-empty Records collection are required."));
            }

            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty) return Unauthorized();

            var result = await DataImportEngine.ValidateRecordsCoreAsync(_db, tenantId, request.EntityKey, request.Records, ct);
            return Ok(ApiResponse<BatchImportValidationResult>.Ok(result, result.IsValid ? "All rows passed validation." : $"Validation completed with {result.InvalidRecords} error(s)."));
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
            var result = await DataImportEngine.ProcessRecordsCoreAsync(_db, tenantId, request.EntityKey, request.Records, ct);
            return Ok(ApiResponse<BatchImportResult>.Ok(result, $"Successfully imported {result.SuccessCount} of {result.TotalRecords} records."));
        }
    }

    public static class DataImportEngine
    {
        public static async Task<DataImportController.BatchImportValidationResult> ValidateRecordsCoreAsync(
            ApplicationDbContext db,
            Guid tenantId,
            string entityKey,
            List<Dictionary<string, object?>> records,
            CancellationToken ct)
        {
            var result = new DataImportController.BatchImportValidationResult
            {
                TotalRecords = records.Count
            };

            var normalizedKey = entityKey.Trim().ToLowerInvariant().Replace("-", "").Replace("_", "");

            var seenCodes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var seenEmails = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            // Pre-fetch existing codes/emails to avoid N+1 queries during validation
            HashSet<string> existingDbCodes = new(StringComparer.OrdinalIgnoreCase);
            HashSet<string> existingDbEmails = new(StringComparer.OrdinalIgnoreCase);

            if (normalizedKey.Contains("employee"))
            {
                var dbEmpData = await db.Employees.AsNoTracking()
                    .Where(e => e.TenantId == tenantId && !e.IsDeleted)
                    .Select(e => new { e.EmployeeCode, e.WorkEmail })
                    .ToListAsync(ct);

                foreach (var e in dbEmpData)
                {
                    if (!string.IsNullOrWhiteSpace(e.EmployeeCode)) existingDbCodes.Add(e.EmployeeCode);
                    if (!string.IsNullOrWhiteSpace(e.WorkEmail)) existingDbEmails.Add(e.WorkEmail);
                }
            }
            else if (normalizedKey.Contains("customer"))
            {
                var codes = await db.Customers.AsNoTracking()
                    .Where(c => c.TenantId == tenantId && !c.IsDeleted)
                    .Select(c => c.CustomerCode)
                    .ToListAsync(ct);
                foreach (var c in codes) if (!string.IsNullOrWhiteSpace(c)) existingDbCodes.Add(c);
            }
            else if (normalizedKey.Contains("vendor"))
            {
                var codes = await db.Vendors.AsNoTracking()
                    .Where(v => v.TenantId == tenantId && !v.IsDeleted)
                    .Select(v => v.VendorCode)
                    .ToListAsync(ct);
                foreach (var c in codes) if (!string.IsNullOrWhiteSpace(c)) existingDbCodes.Add(c);
            }
            else if (normalizedKey.Contains("item"))
            {
                var codes = await db.Items.AsNoTracking()
                    .Where(i => i.TenantId == tenantId && !i.IsDeleted)
                    .Select(i => i.ItemCode)
                    .ToListAsync(ct);
                foreach (var c in codes) if (!string.IsNullOrWhiteSpace(c)) existingDbCodes.Add(c);
            }

            for (int i = 0; i < records.Count; i++)
            {
                var row = records[i];
                var rowNumber = i + 1;
                bool rowHasError = false;

                if (normalizedKey.Contains("employee"))
                {
                    var name = GetString(row, "name") ?? GetString(row, "fullName") ?? GetString(row, "firstName");
                    if (string.IsNullOrWhiteSpace(name))
                    {
                        result.Errors.Add(new DataImportController.RowValidationError { RowIndex = rowNumber, Field = "fullName", Message = "Employee name is required." });
                        rowHasError = true;
                    }

                    var email = GetString(row, "email") ?? GetString(row, "workEmail");
                    if (!string.IsNullOrWhiteSpace(email))
                    {
                        if (!email.Contains('@') || !email.Contains('.'))
                        {
                            result.Errors.Add(new DataImportController.RowValidationError { RowIndex = rowNumber, Field = "email", Message = $"Invalid email format: '{email}'." });
                            rowHasError = true;
                        }
                        else if (!seenEmails.Add(email))
                        {
                            result.Errors.Add(new DataImportController.RowValidationError { RowIndex = rowNumber, Field = "email", Message = $"Duplicate email '{email}' in batch." });
                            rowHasError = true;
                        }
                        else if (existingDbEmails.Contains(email))
                        {
                            result.Errors.Add(new DataImportController.RowValidationError { RowIndex = rowNumber, Field = "email", Message = $"Email '{email}' already exists in database." });
                            rowHasError = true;
                        }
                    }

                    var code = GetString(row, "code") ?? GetString(row, "employeeCode");
                    if (!string.IsNullOrWhiteSpace(code))
                    {
                        if (!seenCodes.Add(code))
                        {
                            result.Errors.Add(new DataImportController.RowValidationError { RowIndex = rowNumber, Field = "employeeCode", Message = $"Duplicate employee code '{code}' in batch." });
                            rowHasError = true;
                        }
                        else if (existingDbCodes.Contains(code))
                        {
                            result.Errors.Add(new DataImportController.RowValidationError { RowIndex = rowNumber, Field = "employeeCode", Message = $"Employee code '{code}' already exists in database." });
                            rowHasError = true;
                        }
                    }
                }
                else if (normalizedKey.Contains("customer"))
                {
                    var name = GetString(row, "name") ?? GetString(row, "customerName");
                    if (string.IsNullOrWhiteSpace(name))
                    {
                        result.Errors.Add(new DataImportController.RowValidationError { RowIndex = rowNumber, Field = "customerName", Message = "Customer name is required." });
                        rowHasError = true;
                    }

                    var code = GetString(row, "code") ?? GetString(row, "customerCode");
                    if (!string.IsNullOrWhiteSpace(code))
                    {
                        if (!seenCodes.Add(code))
                        {
                            result.Errors.Add(new DataImportController.RowValidationError { RowIndex = rowNumber, Field = "customerCode", Message = $"Duplicate customer code '{code}' in batch." });
                            rowHasError = true;
                        }
                        else if (existingDbCodes.Contains(code))
                        {
                            result.Errors.Add(new DataImportController.RowValidationError { RowIndex = rowNumber, Field = "customerCode", Message = $"Customer code '{code}' already exists in database." });
                            rowHasError = true;
                        }
                    }
                }
                else if (normalizedKey.Contains("vendor"))
                {
                    var name = GetString(row, "name") ?? GetString(row, "vendorName");
                    if (string.IsNullOrWhiteSpace(name))
                    {
                        result.Errors.Add(new DataImportController.RowValidationError { RowIndex = rowNumber, Field = "vendorName", Message = "Vendor name is required." });
                        rowHasError = true;
                    }

                    var code = GetString(row, "code") ?? GetString(row, "vendorCode");
                    if (!string.IsNullOrWhiteSpace(code))
                    {
                        if (!seenCodes.Add(code))
                        {
                            result.Errors.Add(new DataImportController.RowValidationError { RowIndex = rowNumber, Field = "vendorCode", Message = $"Duplicate vendor code '{code}' in batch." });
                            rowHasError = true;
                        }
                        else if (existingDbCodes.Contains(code))
                        {
                            result.Errors.Add(new DataImportController.RowValidationError { RowIndex = rowNumber, Field = "vendorCode", Message = $"Vendor code '{code}' already exists in database." });
                            rowHasError = true;
                        }
                    }
                }
                else if (normalizedKey.Contains("item"))
                {
                    var name = GetString(row, "name") ?? GetString(row, "itemName");
                    if (string.IsNullOrWhiteSpace(name))
                    {
                        result.Errors.Add(new DataImportController.RowValidationError { RowIndex = rowNumber, Field = "itemName", Message = "Item name is required." });
                        rowHasError = true;
                    }

                    var code = GetString(row, "code") ?? GetString(row, "itemCode");
                    if (!string.IsNullOrWhiteSpace(code))
                    {
                        if (!seenCodes.Add(code))
                        {
                            result.Errors.Add(new DataImportController.RowValidationError { RowIndex = rowNumber, Field = "itemCode", Message = $"Duplicate item code '{code}' in batch." });
                            rowHasError = true;
                        }
                        else if (existingDbCodes.Contains(code))
                        {
                            result.Errors.Add(new DataImportController.RowValidationError { RowIndex = rowNumber, Field = "itemCode", Message = $"Item code '{code}' already exists in database." });
                            rowHasError = true;
                        }
                    }
                }
                else
                {
                    // Generic validation against EF Core entity properties
                    var efEntityType = db.Model.GetEntityTypes().FirstOrDefault(t =>
                        string.Equals(t.ClrType.Name.Replace("_", ""), normalizedKey, StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(t.GetTableName()?.Replace("_", ""), normalizedKey, StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(t.ClrType.Name.Replace("_", "").TrimEnd('s'), normalizedKey.TrimEnd('s'), StringComparison.OrdinalIgnoreCase));

                    if (efEntityType == null)
                    {
                        result.Errors.Add(new DataImportController.RowValidationError { RowIndex = rowNumber, Message = $"Entity key '{entityKey}' is not recognized for import." });
                        rowHasError = true;
                    }
                }

                if (rowHasError)
                {
                    result.InvalidRecords++;
                }
                else
                {
                    result.ValidRecords++;
                }
            }

            result.IsValid = result.InvalidRecords == 0;
            return result;
        }

        public static async Task<DataImportController.BatchImportResult> ProcessRecordsCoreAsync(
            ApplicationDbContext db,
            Guid tenantId,
            string entityKey,
            List<Dictionary<string, object?>> records,
            CancellationToken ct)
        {
            var result = new DataImportController.BatchImportResult { TotalRecords = records.Count };
            var normalizedKey = entityKey.Trim().ToLowerInvariant().Replace("-", "").Replace("_", "");

            Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction? tx = null;
            if (db.Database.IsRelational())
            {
                tx = await db.Database.BeginTransactionAsync(ct);
            }

            try
            {
                for (int i = 0; i < records.Count; i++)
                {
                    var row = records[i];
                    try
                    {
                        if (normalizedKey.Contains("employee"))
                        {
                            var first = GetString(row, "firstName") ?? GetString(row, "name") ?? "New";
                            var last = GetString(row, "lastName") ?? (first.Contains(' ') ? string.Empty : "Employee");
                            var fullName = GetString(row, "fullName") ?? $"{first} {last}".Trim();

                            var emp = new Employee
                            {
                                TenantId = tenantId,
                                FullName = fullName,
                                WorkEmail = GetString(row, "email") ?? GetString(row, "workEmail") ?? $"user{Guid.NewGuid():N}@tenant.local",
                                Phone = GetString(row, "phone") ?? GetString(row, "phoneNumber"),
                                EmployeeCode = GetString(row, "employeeCode") ?? GetString(row, "code") ?? $"EMP-{Guid.NewGuid():N}".Substring(0, 10).ToUpper(),
                                DateOfJoining = DateTime.UtcNow
                            };
                            db.Employees.Add(emp);
                        }
                        else if (normalizedKey.Contains("customer"))
                        {
                            var cust = new Customer
                            {
                                TenantId = tenantId,
                                CustomerName = GetString(row, "name") ?? GetString(row, "customerName") ?? "Customer",
                                CustomerCode = GetString(row, "code") ?? GetString(row, "customerCode") ?? $"CUST-{Guid.NewGuid():N}".Substring(0, 10).ToUpper(),
                                Email = GetString(row, "email"),
                                PhoneNumber = GetString(row, "phone") ?? GetString(row, "phoneNumber")
                            };
                            db.Customers.Add(cust);
                        }
                        else if (normalizedKey.Contains("vendor"))
                        {
                            var vendor = new Vendor
                            {
                                TenantId = tenantId,
                                VendorName = GetString(row, "name") ?? GetString(row, "vendorName") ?? "Vendor",
                                VendorCode = GetString(row, "code") ?? GetString(row, "vendorCode") ?? $"VEND-{Guid.NewGuid():N}".Substring(0, 10).ToUpper(),
                                Email = GetString(row, "email"),
                                PhoneNumber = GetString(row, "phone") ?? GetString(row, "phoneNumber")
                            };
                            db.Vendors.Add(vendor);
                        }
                        else if (normalizedKey.Contains("item"))
                        {
                            var item = new Item
                            {
                                TenantId = tenantId,
                                ItemName = GetString(row, "name") ?? GetString(row, "itemName") ?? "Item",
                                ItemCode = GetString(row, "itemCode") ?? GetString(row, "code") ?? $"ITEM-{Guid.NewGuid():N}".Substring(0, 10).ToUpper(),
                                UnitOfMeasure = GetString(row, "unit") ?? GetString(row, "unitOfMeasure") ?? "Pcs"
                            };
                            db.Items.Add(item);
                        }
                        else
                        {
                            // Dynamic EF Core Entity Reflection Fallback
                            var efEntityType = db.Model.GetEntityTypes().FirstOrDefault(t =>
                                string.Equals(t.ClrType.Name.Replace("_", ""), normalizedKey, StringComparison.OrdinalIgnoreCase) ||
                                string.Equals(t.GetTableName()?.Replace("_", ""), normalizedKey, StringComparison.OrdinalIgnoreCase) ||
                                string.Equals(t.ClrType.Name.Replace("_", "").TrimEnd('s'), normalizedKey.TrimEnd('s'), StringComparison.OrdinalIgnoreCase));

                            if (efEntityType != null)
                            {
                                var entity = Activator.CreateInstance(efEntityType.ClrType);
                                if (entity != null)
                                {
                                    var props = efEntityType.ClrType.GetProperties(BindingFlags.Public | BindingFlags.Instance);
                                    foreach (var prop in props)
                                    {
                                        if (!prop.CanWrite) continue;

                                        if (prop.Name.Equals("TenantId", StringComparison.OrdinalIgnoreCase) && prop.PropertyType == typeof(Guid))
                                        {
                                            prop.SetValue(entity, tenantId);
                                            continue;
                                        }

                                        if (prop.Name.Equals("Id", StringComparison.OrdinalIgnoreCase) && prop.PropertyType == typeof(Guid))
                                        {
                                            var existing = (Guid)(prop.GetValue(entity) ?? Guid.Empty);
                                            if (existing == Guid.Empty) prop.SetValue(entity, Guid.NewGuid());
                                            continue;
                                        }

                                        if (prop.Name.Equals("CreatedAt", StringComparison.OrdinalIgnoreCase) && prop.PropertyType == typeof(DateTime))
                                        {
                                            prop.SetValue(entity, DateTime.UtcNow);
                                            continue;
                                        }

                                        var matchKey = row.Keys.FirstOrDefault(k => string.Equals(k, prop.Name, StringComparison.OrdinalIgnoreCase));
                                        if (matchKey != null && row[matchKey] != null)
                                        {
                                            var rawVal = row[matchKey];
                                            try
                                            {
                                                var targetType = Nullable.GetUnderlyingType(prop.PropertyType) ?? prop.PropertyType;
                                                if (targetType == typeof(Guid))
                                                {
                                                    if (Guid.TryParse(rawVal?.ToString(), out var g)) prop.SetValue(entity, g);
                                                }
                                                else if (targetType == typeof(DateTime))
                                                {
                                                    if (DateTime.TryParse(rawVal?.ToString(), out var dt)) prop.SetValue(entity, dt);
                                                }
                                                else if (targetType.IsEnum)
                                                {
                                                    var enumVal = Enum.Parse(targetType, rawVal?.ToString() ?? string.Empty, true);
                                                    prop.SetValue(entity, enumVal);
                                                }
                                                else
                                                {
                                                    var converted = Convert.ChangeType(rawVal, targetType);
                                                    prop.SetValue(entity, converted);
                                                }
                                            }
                                            catch
                                            {
                                                // Ignore invalid property coercion
                                            }
                                        }
                                    }

                                    db.Add(entity);
                                }
                                else
                                {
                                    result.Errors.Add($"Row {i + 1}: Failed to instantiate entity '{efEntityType.ClrType.Name}'.");
                                    result.FailedCount++;
                                    continue;
                                }
                            }
                            else
                            {
                                result.Errors.Add($"Row {i + 1}: Unrecognized entity key '{entityKey}' for import.");
                                result.FailedCount++;
                                continue;
                            }
                        }

                        result.SuccessCount++;
                    }
                    catch (Exception ex)
                    {
                        result.FailedCount++;
                        result.Errors.Add($"Row {i + 1}: {ex.Message}");
                    }
                }

                await db.SaveChangesAsync(ct);
                if (tx != null) await tx.CommitAsync(ct);
            }
            catch (Exception ex)
            {
                if (tx != null) await tx.RollbackAsync(ct);
                result.Errors.Add($"Batch transaction aborted: {ex.Message}");
                result.FailedCount = result.TotalRecords - result.SuccessCount;
            }
            finally
            {
                if (tx != null) await tx.DisposeAsync();
            }

            return result;
        }

        public static string? GetString(Dictionary<string, object?> dict, string key)
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

            // Execute the batch persistence inside the background worker
            var result = await DataImportEngine.ProcessRecordsCoreAsync(_db, tenantId, entityKey, records, CancellationToken.None);

            // Stream final completion status via SignalR
            await _hubContext.Clients.Group($"job_{jobId}").SendAsync("JobProgressUpdated", new
            {
                jobId,
                progressPercent = 100,
                processedCount = result.SuccessCount,
                failedCount = result.FailedCount,
                totalCount = total,
                isCompleted = true,
                errors = result.Errors
            });

            _logger.LogInformation("DataImport job {JobId} completed: {Success} succeeded, {Failed} failed out of {Total} records", 
                jobId, result.SuccessCount, result.FailedCount, total);
        }
    }
}
