using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Administration.Controllers
{
    [ApiController]
    [Route("api/v1/licensing")]
    [Authorize]
    [Authorize(Policy = "Module:licensing")]
    public class LicensingController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public LicensingController(ApplicationDbContext db)
        {
            _db = db;
        }

        [HttpGet("usage")]
        public async Task<IActionResult> Usage([FromQuery] string? period)
        {
            var month = string.IsNullOrWhiteSpace(period)
                ? DateTime.UtcNow.ToString("yyyy-MM")
                : period.Trim();
            if (!DateTime.TryParse($"{month}-01", out var monthStart))
                monthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var monthEnd = monthStart.AddMonths(1);

            var activeUsers = await _db.Users.CountAsync(u => u.IsActive);
            var apiCalls = await _db.AuditLogs.CountAsync(a => a.PerformedAt >= monthStart && a.PerformedAt < monthEnd);
            var storageBytes = await _db.DocumentRecords.SumAsync(d => (long?)d.FileSizeBytes) ?? 0;
            var storageMb = Math.Round(storageBytes / 1024d / 1024d, 2);

            var catalog = await _db.Modules.AsNoTracking()
                .Where(m => m.IsEnabled)
                .OrderBy(m => m.SortOrder)
                .ThenBy(m => m.DisplayName)
                .Select(m => new { m.ModuleKey, m.DisplayName, m.Name })
                .ToListAsync();

            var enabled = await _db.TenantModules.AsNoTracking()
                .Where(tm => tm.IsEnabled)
                .Select(tm => tm.ModuleKey)
                .ToListAsync();
            var enabledSet = enabled.ToHashSet(StringComparer.OrdinalIgnoreCase);

            var rows = catalog.Select(m => new
            {
                id = m.ModuleKey,
                moduleKey = m.ModuleKey,
                moduleName = string.IsNullOrWhiteSpace(m.DisplayName) ? m.Name : m.DisplayName,
                isEnabled = enabledSet.Contains(m.ModuleKey),
                activeUsers = enabledSet.Contains(m.ModuleKey) ? activeUsers : 0,
                apiCalls = enabledSet.Contains(m.ModuleKey) ? apiCalls : 0,
                storageUsedMb = enabledSet.Contains(m.ModuleKey) ? storageMb : 0,
                period = month
            }).ToList();

            return Ok(rows);
        }

        [HttpGet("invoices")]
        [HttpGet("billing-history")]
        [HttpGet("/api/v1/licensing/billing-history")]
        public async Task<IActionResult> Invoices([FromQuery] string? status)
        {
            var query = _db.LicenseInvoices.AsNoTracking().AsQueryable();
            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(i => i.Status == status);
            var rows = await query.OrderByDescending(i => i.CreatedAt).ToListAsync();
            return Ok(new { data = rows, items = rows, invoices = rows, total = rows.Count });
        }

        [HttpPost("invoices")]
        public async Task<IActionResult> CreateInvoice([FromBody] CreateLicenseInvoiceDto dto)
        {
            if (dto.Amount <= 0)
                return BadRequest(new { message = "Amount must be greater than zero." });

            var period = string.IsNullOrWhiteSpace(dto.Period)
                ? DateTime.UtcNow.ToString("yyyy-MM")
                : dto.Period.Trim();
            var year = DateTime.UtcNow.Year;
            var count = await _db.LicenseInvoices
                .CountAsync(i => i.InvoiceNumber.StartsWith($"LIC-{year}-"));
            var invoiceNumber = string.IsNullOrWhiteSpace(dto.InvoiceNumber)
                ? $"LIC-{year}-{(count + 1):D4}"
                : dto.InvoiceNumber.Trim();

            var exists = await _db.LicenseInvoices.AnyAsync(i => i.InvoiceNumber == invoiceNumber);
            if (exists)
                return BadRequest(new { message = "Invoice number already exists." });

            var row = new LicenseInvoice
            {
                InvoiceNumber = invoiceNumber,
                Period = period,
                Plan = string.IsNullOrWhiteSpace(dto.Plan) ? "Standard" : dto.Plan.Trim(),
                Amount = dto.Amount,
                Status = "Pending",
                Remarks = string.IsNullOrWhiteSpace(dto.Remarks) ? null : dto.Remarks.Trim(),
                CreatedBy = GetUserId()
            };
            _db.LicenseInvoices.Add(row);
            await _db.SaveChangesAsync();
            return Ok(row);
        }

        [HttpPost("invoices/{id:guid}/pay")]
        public async Task<IActionResult> MarkInvoicePaid(Guid id)
        {
            var row = await _db.LicenseInvoices.FirstOrDefaultAsync(i => i.Id == id);
            if (row == null) return NotFound(new { message = "Invoice not found." });
            row.Status = "Paid";
            row.PaidDate = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(row);
        }

        [HttpDelete("invoices/{id:guid}")]
        public async Task<IActionResult> DeleteInvoice(Guid id)
        {
            var row = await _db.LicenseInvoices.FirstOrDefaultAsync(i => i.Id == id);
            if (row == null) return NotFound(new { message = "Invoice not found." });
            row.IsDeleted = true;
            await _db.SaveChangesAsync();
            return Ok(new { message = "Invoice deleted." });
        }

        private Guid? GetUserId()
        {
            var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(raw, out var id) ? id : null;
        }
    }
}
