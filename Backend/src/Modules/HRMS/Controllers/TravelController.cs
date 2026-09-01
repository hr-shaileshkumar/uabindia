using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.HRMS.Controllers
{
    [ApiController]
    [Route("api/v1/travel")]
    [Authorize(Policy = "Module:hrms")]
    public class TravelController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IDocumentNumberService _numbers;

        public TravelController(ApplicationDbContext db, ITenantAccessor tenantAccessor, IDocumentNumberService numbers)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _numbers = numbers;
        }

        [HttpGet("requests")]
        public async Task<IActionResult> ListRequests([FromQuery] int page = 1, [FromQuery] int limit = 20, [FromQuery] string? status = null)
        {
            if (page < 1) page = 1;
            if (limit < 1) limit = 20;
            if (limit > 100) limit = 100;

            var tenantId = _tenantAccessor.GetTenantId();
            var query = _db.TravelRequests.AsNoTracking().Where(r => r.TenantId == tenantId);

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(r => r.Status == status);
            }

            var total = await query.CountAsync();
            var requests = await query
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(r => new
                {
                    r.Id,
                    r.RequestNumber,
                    r.EmployeeId,
                    r.EmployeeName,
                    r.Destination,
                    r.Purpose,
                    r.StartDate,
                    r.EndDate,
                    r.EstimatedAmount,
                    r.CurrencyCode,
                    r.Status,
                    r.CreatedAt
                })
                .ToListAsync();

            return Ok(new { success = true, data = requests, total, page, limit });
        }

        [HttpPost("requests")]
        public async Task<IActionResult> CreateRequest([FromBody] CreateTravelRequestDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Destination) || string.IsNullOrWhiteSpace(dto.Purpose))
            {
                return BadRequest(new { success = false, error = "Destination and purpose are required." });
            }

            var tenantId = _tenantAccessor.GetTenantId();
            var request = new TravelRequest
            {
                TenantId = tenantId,
                RequestNumber = await _numbers.NextAsync("TravelRequest", "TRV-", 5),
                EmployeeId = dto.EmployeeId,
                EmployeeName = dto.EmployeeName ?? string.Empty,
                Destination = dto.Destination,
                Purpose = dto.Purpose,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                EstimatedAmount = dto.EstimatedAmount,
                CurrencyCode = string.IsNullOrWhiteSpace(dto.CurrencyCode) ? "INR" : dto.CurrencyCode,
                Status = string.IsNullOrWhiteSpace(dto.Status) ? "Submitted" : dto.Status,
                CreatedAt = DateTime.UtcNow
            };

            _db.TravelRequests.Add(request);
            await _db.SaveChangesAsync();

            return Ok(new { success = true, data = request });
        }
    }

    public class CreateTravelRequestDto
    {
        public Guid EmployeeId { get; set; }
        public string? EmployeeName { get; set; }
        public string Destination { get; set; } = string.Empty;
        public string Purpose { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal EstimatedAmount { get; set; }
        public string? CurrencyCode { get; set; }
        public string? Status { get; set; }
    }
}
