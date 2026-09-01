using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Platform.Controllers
{
    /// <summary>
    /// DPDP Act 2023 and GDPR privacy APIs for data export and deletion.
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

            var employee = await _db.Employees
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.UserId == request.UserId && e.TenantId == tenantId && !e.IsDeleted);

            var exportData = new
            {
                ExportDate = DateTime.UtcNow,
                Law = "DPDP Act 2023 (Digital Personal Data Protection) and GDPR where applicable",
                UserId = user.Id,
                TenantId = user.TenantId,
                PersonalInformation = new
                {
                    user.Email,
                    user.FullName,
                    user.IsActive,
                    user.CreatedAt,
                    user.UpdatedAt
                },
                Roles = await _db.UserRoles
                    .AsNoTracking()
                    .Where(ur => ur.UserId == request.UserId && ur.TenantId == tenantId && !ur.IsDeleted)
                    .Join(_db.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => new { r.Name, r.Description })
                    .ToListAsync(),
                EmployeeRecords = employee == null ? null : new
                {
                    employee.Id,
                    employee.FullName,
                    employee.EmployeeCode,
                    employee.Status,
                    employee.WorkEmail,
                    employee.Phone,
                    employee.DateOfBirth,
                    employee.City,
                    employee.State,
                    employee.DateOfJoining,
                    employee.ExitDate,
                    employee.Pan,
                    AadhaarMasked = string.IsNullOrWhiteSpace(employee.Aadhaar) || employee.Aadhaar.Length < 4
                        ? employee.Aadhaar
                        : new string('X', employee.Aadhaar.Length - 4) + employee.Aadhaar[^4..],
                    employee.Uan,
                    employee.PfNumber,
                    employee.EsiNumber,
                    employee.BankIfsc,
                    BankAccountMasked = string.IsNullOrWhiteSpace(employee.BankAccountNumber) || employee.BankAccountNumber.Length < 4
                        ? employee.BankAccountNumber
                        : "XXXX" + employee.BankAccountNumber[^4..]
                },
                LeaveRequests = await _db.LeaveRequests
                    .AsNoTracking()
                    .Where(lr => employee != null && lr.EmployeeId == employee.Id && lr.TenantId == tenantId && !lr.IsDeleted)
                    .Select(lr => new { lr.Id, lr.FromDate, lr.ToDate, lr.Days, lr.Status, lr.Reason })
                    .ToListAsync(),
                Attendance = employee == null ? null : await _db.AttendanceRecords
                    .AsNoTracking()
                    .Where(a => a.EmployeeId == employee.Id && a.TenantId == tenantId && !a.IsDeleted)
                    .OrderByDescending(a => a.Timestamp)
                    .Take(200)
                    .Select(a => new { a.PunchType, a.Timestamp, a.Source })
                    .ToListAsync(),
                Payslips = employee == null ? null : await _db.Payslips
                    .AsNoTracking()
                    .Where(p => p.EmployeeId == employee.Id && !p.IsDeleted)
                    .OrderByDescending(p => p.Year).ThenByDescending(p => p.Month)
                    .Take(36)
                    .Select(p => new { p.Month, p.Year, p.Gross, p.Net, p.TotalDeductions })
                    .ToListAsync(),
                ExpenseClaims = employee == null ? null : await _db.ExpenseClaims
                    .AsNoTracking()
                    .Where(e => e.EmployeeId == employee.Id && e.TenantId == tenantId && !e.IsDeleted)
                    .Select(e => new { e.ClaimNumber, e.Title, e.Amount, e.ExpenseDate, e.Status })
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

        [HttpPost("export-me")]
        public async Task<IActionResult> ExportMyData()
        {
            var userId = GetCurrentUserId();
            if (userId == Guid.Empty)
                return Unauthorized(new { message = "Sign in to export your data." });
            return await ExportUserData(new ExportDataRequest { UserId = userId });
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

            user.IsDeleted = true;
            user.IsActive = false;
            user.Email = $"deleted-{user.Id}@anonymized.local";
            user.FullName = "Deleted User";
            user.UpdatedAt = DateTime.UtcNow;
            deletedEntities++;

            var employee = await _db.Employees
                .FirstOrDefaultAsync(e => e.UserId == request.UserId && e.TenantId == tenantId && !e.IsDeleted);
            if (employee != null)
            {
                employee.FullName = "Deleted User";
                employee.WorkEmail = $"deleted-{employee.Id}@anonymized.local";
                employee.PersonalEmail = null;
                employee.Phone = null;
                employee.AlternatePhone = null;
                employee.Address = null;
                employee.Pan = null;
                employee.Aadhaar = null;
                employee.Uan = null;
                employee.PfNumber = null;
                employee.EsiNumber = null;
                employee.BankAccountHolder = null;
                employee.BankAccountNumber = null;
                employee.BankIfsc = null;
                employee.BankName = null;
                employee.Status = "Inactive";
                employee.UpdatedAt = DateTime.UtcNow;
                deletedEntities++;
            }

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
                compliance = "DPDP Act 2023 / GDPR Article 17 - Right to Erasure",
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
                    "Right to Access (DPDP Act 2023 / GDPR Article 15) - Export your data",
                    "Right to Correction (DPDP Act 2023 / GDPR Article 16)",
                    "Right to Erasure (DPDP Act 2023 / GDPR Article 17)",
                    "Right to Data Portability (GDPR Article 20)"
                },
                dataProcessingPurpose = "Human Resource Management, Payroll, and Attendance Tracking",
                dataController = "UabIndia HRMS",
                contactEmail = "privacy@uabindia.com"
            });
        }

        private Guid GetCurrentUserId()
        {
            var raw = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub")
                ?? User.FindFirstValue("userId");
            return Guid.TryParse(raw, out var id) ? id : Guid.Empty;
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
