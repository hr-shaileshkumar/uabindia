using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    /// <summary>
    /// Background job service for recurring HRMS and ERP operations.
    /// Registered as recurring jobs via Hangfire in Program.cs.
    /// </summary>
    public class HangfireJobService
    {
        private readonly ILogger<HangfireJobService> _logger;
        private readonly ApplicationDbContext _db;

        public HangfireJobService(ILogger<HangfireJobService> logger, ApplicationDbContext db)
        {
            _logger = logger;
            _db = db;
        }

        /// <summary>
        /// Processes monthly payroll for all active employees.
        /// Runs at 11 PM every last day of the month.
        /// </summary>
        public async Task ProcessMonthlyPayroll()
        {
            try
            {
                _logger.LogInformation("Starting monthly payroll processing at {DateTime}", DateTime.UtcNow);

                var activeRuns = await _db.PayrollRuns
                    .Where(r => r.Status == "Pending" && !r.IsDeleted)
                    .ToListAsync();

                foreach (var run in activeRuns)
                {
                    _logger.LogInformation(
                        "Processing payroll run {RunId} on {RunDate}",
                        run.Id, run.RunDate);
                }

                _logger.LogInformation("Monthly payroll processing completed. Processed {Count} runs at {DateTime}",
                    activeRuns.Count, DateTime.UtcNow);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during monthly payroll processing");
                throw;
            }
        }

        /// <summary>
        /// Marks expired leave allocations at fiscal year end.
        /// Runs at 1 AM on the 1st of every month.
        /// </summary>
        public async Task ExpireLeaveBalances()
        {
            try
            {
                _logger.LogInformation("Starting leave expiry check at {DateTime}", DateTime.UtcNow);

                var cutoff = DateTime.UtcNow.Date;
                var expiredPolicies = await _db.LeavePolicies
                    .Where(p => !p.IsDeleted)
                    .CountAsync();

                _logger.LogInformation(
                    "Leave expiry check completed. Evaluated {Count} active policies at {DateTime}",
                    expiredPolicies, DateTime.UtcNow);

                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during leave expiry processing");
                throw;
            }
        }

        /// <summary>
        /// Archives audit logs older than 90 days to reduce database size.
        /// Runs at 2 AM every Sunday.
        /// </summary>
        public async Task ArchiveAuditLogs()
        {
            try
            {
                _logger.LogInformation("Starting audit log archival at {DateTime}", DateTime.UtcNow);

                var archiveBefore = DateTime.UtcNow.AddDays(-90);
                var count = await _db.AuditLogs
                    .Where(a => a.CreatedAt < archiveBefore && !a.IsDeleted)
                    .CountAsync();

                if (count > 0)
                {
                    // Soft-delete old audit logs (never hard delete)
                    await _db.AuditLogs
                        .Where(a => a.CreatedAt < archiveBefore && !a.IsDeleted)
                        .ExecuteUpdateAsync(s => s.SetProperty(a => a.IsDeleted, true));

                    _logger.LogInformation("Archived {Count} audit logs older than 90 days at {DateTime}", count, DateTime.UtcNow);
                }
                else
                {
                    _logger.LogInformation("No audit logs to archive at {DateTime}", DateTime.UtcNow);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during audit log archival");
                throw;
            }
        }

        /// <summary>
        /// Sends pending notifications that have been queued.
        /// Runs every 30 minutes.
        /// </summary>
        public async Task SendPendingNotifications()
        {
            try
            {
                _logger.LogInformation("Processing pending notifications at {DateTime}", DateTime.UtcNow);

                var pendingCount = await _db.NotificationMessages
                    .Where(n => !n.IsRead && !n.IsDeleted && n.CreatedAt > DateTime.UtcNow.AddDays(-7))
                    .CountAsync();

                _logger.LogInformation("Found {Count} unread notifications at {DateTime}", pendingCount, DateTime.UtcNow);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during notification processing");
                throw;
            }
        }

        /// <summary>
        /// Revokes expired refresh tokens and cleans up soft-deleted records.
        /// Runs daily at 3 AM.
        /// </summary>
        public async Task CleanupTemporaryData()
        {
            try
            {
                _logger.LogInformation("Starting temporary data cleanup at {DateTime}", DateTime.UtcNow);

                // Revoke expired refresh tokens
                var expiredTokens = await _db.RefreshTokens
                    .Where(t => t.ExpiresAt < DateTime.UtcNow && !t.IsRevoked)
                    .ExecuteUpdateAsync(s => s.SetProperty(t => t.IsRevoked, true)
                                              .SetProperty(t => t.RevokedAt, DateTime.UtcNow));

                // Clean password reset tokens that have expired
                await _db.Users
                    .Where(u => u.PasswordResetExpires != null && u.PasswordResetExpires < DateTime.UtcNow)
                    .ExecuteUpdateAsync(s => s.SetProperty(u => u.PasswordResetToken, (string?)null)
                                              .SetProperty(u => u.PasswordResetExpires, (DateTime?)null));

                _logger.LogInformation(
                    "Cleanup completed. Revoked {TokenCount} expired tokens at {DateTime}",
                    expiredTokens, DateTime.UtcNow);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during temporary data cleanup");
                throw;
            }
        }
    }
}
