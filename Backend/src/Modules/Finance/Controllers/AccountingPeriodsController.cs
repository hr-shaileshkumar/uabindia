using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Finance.Controllers
{
    [ApiController]
    [Route("api/v1/finance/periods")]
    [Authorize]
    [Authorize(Policy = "Module:finance")]
    public class AccountingPeriodsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly IAccountingPeriodService _periods;

        public AccountingPeriodsController(ApplicationDbContext db, IAccountingPeriodService periods)
        {
            _db = db;
            _periods = periods;
        }

        [HttpGet]
        public async Task<IActionResult> List([FromQuery] int? year = null)
        {
            var y = year ?? DateTime.UtcNow.Year;
            var rows = await _db.AccountingPeriods.AsNoTracking()
                .Where(p => p.Year == y)
                .OrderBy(p => p.Month)
                .ToListAsync();
            return Ok(new { year = y, periods = rows });
        }

        [HttpPost("close")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Close([FromBody] PeriodRequest request)
        {
            try
            {
                var row = await _periods.CloseAsync(request.Year, request.Month, GetUserId(), request.Notes);
                return Ok(row);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("reopen")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Reopen([FromBody] PeriodRequest request)
        {
            try
            {
                var row = await _periods.ReopenAsync(request.Year, request.Month);
                return Ok(row);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        private Guid? GetUserId()
        {
            var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(raw, out var id) ? id : null;
        }

        public class PeriodRequest
        {
            public int Year { get; set; } = DateTime.UtcNow.Year;
            public int Month { get; set; } = DateTime.UtcNow.Month;
            public string? Notes { get; set; }
        }
    }
}
