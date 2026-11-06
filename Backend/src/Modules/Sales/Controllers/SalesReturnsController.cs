using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Sales.Controllers
{
    [ApiController]
    [Route("api/v1/salesreturns")]
    [Route("api/v1/sales/returns")]
    [Route("api/v1/sales-returns")]
    [Authorize(Policy = "Module:sales")]
    public class SalesReturnsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IDocumentNumberService _numbers;
        private readonly ISalesReturnService _returns;

        public SalesReturnsController(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            IDocumentNumberService numbers,
            ISalesReturnService returns)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _numbers = numbers;
            _returns = returns;
        }

        [HttpGet]
        public async Task<IActionResult> List([FromQuery] int page = 1, [FromQuery] int limit = 50)
        {
            page = Math.Max(1, page);
            limit = Math.Clamp(limit, 1, 200);
            var query = _db.SalesReturns.AsNoTracking();
            var total = await query.CountAsync();
            var data = await query.OrderByDescending(r => r.ReturnDate).Skip((page - 1) * limit).Take(limit).ToListAsync();
            return Ok(new { data, total, page, limit });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] SalesReturn dto)
        {
            if (dto.CustomerId == Guid.Empty || dto.Amount <= 0)
                return BadRequest(new { message = "Customer and amount are required." });

            var row = new SalesReturn
            {
                TenantId = _tenantAccessor.GetTenantId(),
                ReturnNumber = await _numbers.NextAsync("SalesReturn", "SR-", 5),
                CustomerId = dto.CustomerId,
                SalesInvoiceId = dto.SalesInvoiceId,
                OriginalOrderRef = dto.OriginalOrderRef,
                Amount = dto.Amount,
                Reason = string.IsNullOrWhiteSpace(dto.Reason) ? "Other" : dto.Reason,
                ReturnDate = dto.ReturnDate == default ? DateTime.UtcNow.Date : dto.ReturnDate,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };
            _db.SalesReturns.Add(row);
            await _db.SaveChangesAsync();
            return Ok(row);
        }

        [HttpPost("{id:guid}/process")]
        public async Task<IActionResult> Process(Guid id)
        {
            try
            {
                var row = await _returns.ProcessAsync(id);
                return Ok(row);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
