using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Application.Interfaces;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Administration.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    [Authorize(Policy = "AdminOnly")]
    [Authorize(Policy = "Module:platform")]
    public class ContactSubmissionsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public ContactSubmissionsController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        [HttpGet]
        public async Task<IActionResult> List([FromQuery] int page = 1, [FromQuery] int limit = 20)
        {
            if (page < 1) page = 1;
            if (limit < 1) limit = 20;
            if (limit > 100) limit = 100;

            var tenantId = _tenantAccessor.GetTenantId();

            var total = await _db.ContactSubmissions
                .Where(c => c.TenantId == tenantId && !c.IsDeleted)
                .CountAsync();

            var data = await _db.ContactSubmissions
                .AsNoTracking()
                .Where(c => c.TenantId == tenantId && !c.IsDeleted)
                .OrderByDescending(c => c.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(c => new ContactSubmissionDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Email = c.Email,
                    PhoneNumber = c.PhoneNumber,
                    CompanyName = c.CompanyName,
                    Subject = c.Subject,
                    Message = c.Message,
                    Source = c.Source,
                    IsResolved = c.IsResolved,
                    CreatedAt = c.CreatedAt
                })
                .ToListAsync();

            return Ok(new { submissions = data, total, page, limit });
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateContactSubmissionDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();
            var submission = await _db.ContactSubmissions
                .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId && !c.IsDeleted);

            if (submission == null) return NotFound(new { message = "Submission not found" });

            submission.IsResolved = dto.IsResolved;
            submission.UpdatedAt = DateTime.UtcNow;

            _db.ContactSubmissions.Update(submission);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Submission updated", submissionId = submission.Id });
        }
    }
}
