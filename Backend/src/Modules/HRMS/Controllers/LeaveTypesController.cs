using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.HRMS.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Route("api/v1/hrms/leave-types")]
    [Authorize]
    [Authorize(Policy = "Module:hrms")]
    public class LeaveTypesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public LeaveTypesController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        private Guid TenantId => _tenantAccessor.GetTenantId();

        private static readonly (string Code, string Name, bool IsPaid, int Order, string Description)[] StandardDefaults =
        {
            ("CL", "Casual Leave", true, 1, "Short planned absence for urgent personal affairs"),
            ("SL", "Sick Leave", true, 2, "Health recuperation and medical contingencies"),
            ("EL", "Earned Leave (PL)", true, 3, "Annual vacation leave accrued based on days worked"),
            ("ML", "Maternity Leave", true, 4, "Statutory 26-week maternity benefit under Indian Law"),
            ("PL", "Paternity Leave", true, 5, "Paid leave for secondary caregiver upon child birth"),
            ("CO", "Compensatory Off", true, 6, "Time-off credited for working on declared holidays"),
            ("BL", "Bereavement Leave", true, 7, "Compassionate leave for bereavement in immediate family"),
            ("LWP", "Leave Without Pay", false, 8, "Approved unpaid absence beyond statutory entitlement")
        };

        [HttpGet]
        public async Task<IActionResult> List()
        {
            var tenantId = TenantId;
            var types = await _db.LeaveTypes
                .Where(t => t.TenantId == tenantId && !t.IsDeleted)
                .OrderBy(t => t.DisplayOrder)
                .ThenBy(t => t.Name)
                .ToListAsync();

            // Auto-initialize standard Indian leave types if tenant has none
            if (types.Count == 0)
            {
                var toAdd = new List<LeaveType>();
                var now = DateTime.UtcNow;

                foreach (var def in StandardDefaults)
                {
                    toAdd.Add(new LeaveType
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId,
                        Code = def.Code,
                        Name = def.Name,
                        IsPaid = def.IsPaid,
                        DisplayOrder = def.Order,
                        Description = def.Description,
                        IsActive = true,
                        CreatedAt = now
                    });
                }

                _db.LeaveTypes.AddRange(toAdd);
                await _db.SaveChangesAsync();
                types = toAdd;
            }

            return Ok(new { leaveTypes = types, total = types.Count });
        }

        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Create([FromBody] LeaveTypeDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Code) || string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest(new { message = "Code and Name are required." });

            var tenantId = TenantId;
            var codeUpper = dto.Code.Trim().ToUpperInvariant();

            var exists = await _db.LeaveTypes
                .AnyAsync(t => t.TenantId == tenantId && t.Code == codeUpper && !t.IsDeleted);

            if (exists)
                return Conflict(new { message = $"Leave type with code '{codeUpper}' already exists." });

            var leaveType = new LeaveType
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                Code = codeUpper,
                Name = dto.Name.Trim(),
                Description = dto.Description?.Trim(),
                IsPaid = dto.IsPaid,
                IsActive = dto.IsActive,
                DisplayOrder = dto.DisplayOrder,
                CreatedAt = DateTime.UtcNow
            };

            _db.LeaveTypes.Add(leaveType);
            await _db.SaveChangesAsync();

            return Ok(leaveType);
        }

        [HttpPut("{id:guid}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Update(Guid id, [FromBody] LeaveTypeDto dto)
        {
            var tenantId = TenantId;
            var leaveType = await _db.LeaveTypes
                .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId && !t.IsDeleted);

            if (leaveType == null)
                return NotFound(new { message = "Leave type not found." });

            if (!string.IsNullOrWhiteSpace(dto.Name))
                leaveType.Name = dto.Name.Trim();

            leaveType.Description = dto.Description?.Trim();
            leaveType.IsPaid = dto.IsPaid;
            leaveType.IsActive = dto.IsActive;
            leaveType.DisplayOrder = dto.DisplayOrder;
            leaveType.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(leaveType);
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var tenantId = TenantId;
            var leaveType = await _db.LeaveTypes
                .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId && !t.IsDeleted);

            if (leaveType == null)
                return NotFound(new { message = "Leave type not found." });

            leaveType.IsDeleted = true;
            leaveType.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new { deleted = true, id });
        }
    }

    public class LeaveTypeDto
    {
        public Guid Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsPaid { get; set; } = true;
        public bool IsActive { get; set; } = true;
        public int DisplayOrder { get; set; } = 0;
    }
}
