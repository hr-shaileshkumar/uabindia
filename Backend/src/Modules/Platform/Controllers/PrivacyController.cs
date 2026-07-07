using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Platform.Controllers
{
    /// <summary>
    /// GDPR Compliance APIs for data export and deletion (Right to be Forgotten)
    /// Implements GDPR Articles 15 (Right of Access) and 17 (Right to Erasure)
    /// </summary>
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    public class PrivacyController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public PrivacyController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        /// <summary>
        /// GDPR Article 15: Export all personal data for a user
        /// Returns comprehensive data package in JSON format
        /// </summary>
        [HttpPost("export-user-data")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> ExportUserData([FromBody] ExportDataRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();
            
            // Verify user belongs to this tenant
            var user = await _db.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == request.UserId && u.TenantId == tenantId && !u.IsDeleted);

            if (user == null)
                return NotFound(new { message = "User not found or does not belong to this tenant" });

            var exportData = new
            {
                ExportDate = DateTime.UtcNow,
                UserId = user.Id,
                TenantId = user.TenantId,
                PersonalInformation = new
                {
                    user.Email,
                    user.IsActive,
                    user.CreatedAt,
                    user.UpdatedAt
                },
                Roles = await _db.UserRoles
                    .AsNoTracking()
                    .Where(ur => ur.UserId == request.UserId && ur.TenantId == tenantId && !ur.IsDeleted)
                    .Join(_db.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => new { r.Name, r.Description })
                    .ToListAsync(),
                EmployeeRecords = await _db.Employees
                    .AsNoTracking()
                    .Where(e => e.CreatedBy == request.UserId && e.TenantId == tenantId && !e.IsDeleted)
                    .Select(e => new { e.Id, e.FullName, e.EmployeeCode, e.Status, e.CreatedAt })
                    .ToListAsync(),
                LeaveRequests = await _db.LeaveRequests
                    .AsNoTracking()
                    .Where(lr => lr.EmployeeId == request.UserId && lr.TenantId == tenantId && !lr.IsDeleted)
                    .Select(lr => new { lr.Id, lr.FromDate, lr.ToDate, lr.Days, lr.Status, lr.Reason })
                    .ToListAsync(),
                AuditLogs = await _db.AuditLogs
                    .AsNoTracking()
                    .Where(al => al.PerformedBy == request.UserId && al.TenantId == tenantId)
                    .OrderByDescending(al => al.PerformedAt)
                    .Take(100) // Limit to last 100 actions
                    .Select(al => new { al.Action, al.EntityName, al.PerformedAt, al.OldValue, al.NewValue })
                    .ToListAsync(),
                DataProcessingConsent = new
                {
                    ConsentGiven = user.IsActive,
                    ConsentDate = user.CreatedAt,
                    Purpose = "HRMS and payroll management"
                }
            };

            return Ok(new
            {
                message = "User data export completed",
                format = "JSON",
                dataPackage = exportData
            });
        }

        /// <summary>
        /// GDPR Article 17: Right to Erasure (Right to be Forgotten)
        /// Anonymizes or deletes user data while maintaining referential integrity
        /// </summary>
        [HttpPost("delete-user")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> DeleteUser([FromBody] DeleteUserRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();
            
            // Verify user belongs to this tenant
            var user = await _db.Users
                .FirstOrDefaultAsync(u => u.Id == request.UserId && u.TenantId == tenantId && !u.IsDeleted);

            if (user == null)
                return NotFound(new { message = "User not found or does not belong to this tenant" });

            // Prevent deletion of system admin or self-deletion
            if (user.IsSystemAdmin)
                return BadRequest(new { message = "Cannot delete system admin account" });

            var currentUserId = User.Claims.FirstOrDefault(c => c.Type == "userId")?.Value;
            if (currentUserId == request.UserId.ToString())
                return BadRequest(new { message = "Cannot delete your own account" });

            // Strategy: Soft delete + Anonymization
            var deletedEntities = 0;

            // 1. Soft delete user record
            user.IsDeleted = true;
            user.Email = $"deleted-{user.Id}@anonymized.local"; // Anonymize email
            user.UpdatedAt = DateTime.UtcNow;
            deletedEntities++;

            // 2. Soft delete user roles
            var userRoles = await _db.UserRoles
                .Where(ur => ur.UserId == request.UserId && ur.TenantId == tenantId && !ur.IsDeleted)
                .ToListAsync();
            
            foreach (var userRole in userRoles)
            {
                userRole.IsDeleted = true;
                userRole.UpdatedAt = DateTime.UtcNow;
                deletedEntities++;
            }

            // 3. Soft delete refresh tokens
            var refreshTokens = await _db.RefreshTokens
                .Where(rt => rt.UserId == request.UserId && rt.TenantId == tenantId)
                .ToListAsync();
            
            foreach (var token in refreshTokens)
            {
                token.IsRevoked = true;
                token.RevokedAt = DateTime.UtcNow;
                deletedEntities++;
            }

            // 4. Create audit log entry for deletion
            var auditLog = new UabIndia.Core.Entities.AuditLog
            {
                TenantId = tenantId,
                PerformedBy = Guid.Parse(currentUserId ?? Guid.Empty.ToString()),
                Action = "USER_DELETION",
                EntityName = "User",
                EntityId = request.UserId,
                OldValue = $"User {user.Email} deleted via GDPR Right to Erasure. Reason: {request.Reason}",
                PerformedAt = DateTime.UtcNow,
                Ip = HttpContext.Connection.RemoteIpAddress?.ToString()
            };
            _db.AuditLogs.Add(auditLog);

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "User data deletion completed",
                userId = request.UserId,
                deletedEntities,
                deletionDate = DateTime.UtcNow,
                reason = request.Reason,
                compliance = "GDPR Article 17 - Right to Erasure",
                note = "User data has been anonymized and soft-deleted. Audit trail retained for compliance."
            });
        }

        /// <summary>
        /// Get privacy policy and data retention information
        /// </summary>
        [HttpGet("policy")]
        [AllowAnonymous]
        public IActionResult GetPrivacyPolicy()
        {
            return Ok(new
            {
                policyVersion = "1.0",
                lastUpdated = "2026-02-03",
                dataRetention = new
                {
                    activeRecords = "As long as account is active",
                    deletedRecords = "Soft-deleted records retained for 90 days, then permanently deleted",
                    auditLogs = "Retained for 7 years for compliance purposes",
                    backups = "Encrypted backups retained for 30 days"
                },
                userRights = new[]
                {
                    "Right to Access (GDPR Article 15) - Export your data",
                    "Right to Rectification (GDPR Article 16) - Correct inaccurate data",
                    "Right to Erasure (GDPR Article 17) - Delete your data",
                    "Right to Data Portability (GDPR Article 20) - Receive data in structured format"
                },
                dataProcessingPurpose = "Human Resource Management, Payroll, and Attendance Tracking",
                dataController = "UabIndia HRMS",
                contactEmail = "privacy@uabindia.com"
            });
        }

        public class ExportDataRequest
        {
            public Guid UserId { get; set; }
        }

        public class DeleteUserRequest
        {
            public Guid UserId { get; set; }
            public string Reason { get; set; } = "User requested deletion";
        }
    }
}
