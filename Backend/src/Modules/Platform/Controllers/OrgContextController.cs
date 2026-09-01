using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Platform.Controllers
{
    [ApiController]
    [Route("api/v1/org-context")]
    [Authorize]
    public class OrgContextController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public OrgContextController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        [HttpPost("events")]
        public async Task<IActionResult> LogContextChange([FromBody] OrgContextChangeDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var userId = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            Guid? performedBy = Guid.TryParse(userId, out var uid) ? uid : null;

            var payload = System.Text.Json.JsonSerializer.Serialize(new
            {
                previousCompanyId = dto.PreviousCompanyId,
                previousProjectId = dto.PreviousProjectId,
                companyId = dto.CompanyId,
                projectId = dto.ProjectId,
                companyName = dto.CompanyName,
                projectName = dto.ProjectName
            });

            _db.AuditLogs.Add(new AuditLog
            {
                TenantId = tenantId,
                CompanyId = dto.CompanyId,
                ProjectId = dto.ProjectId,
                EntityName = "OrgContext",
                Action = "ContextChanged",
                NewValue = payload,
                OldValue = System.Text.Json.JsonSerializer.Serialize(new
                {
                    companyId = dto.PreviousCompanyId,
                    projectId = dto.PreviousProjectId
                }),
                PerformedBy = performedBy,
                PerformedAt = DateTime.UtcNow,
                Ip = HttpContext.Connection.RemoteIpAddress?.ToString()
            });

            await _db.SaveChangesAsync();
            return Ok(new { success = true });
        }
    }

    public class OrgContextChangeDto
    {
        public Guid? PreviousCompanyId { get; set; }
        public Guid? PreviousProjectId { get; set; }
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public string? CompanyName { get; set; }
        public string? ProjectName { get; set; }
    }
}
