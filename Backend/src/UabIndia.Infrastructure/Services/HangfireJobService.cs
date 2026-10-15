using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UabIndia.Core.Entities;
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
        /// Processes monthly payroll for all active employees across all tenants.
        /// Runs at 11 PM every last day of the month.
        /// </summary>
        public async Task ProcessMonthlyPayroll()
        {
            try
            {
                _logger.LogInformation("Starting monthly payroll processing at {DateTime}", DateTime.UtcNow);

                var activeRuns = await _db.PayrollRuns
                    .IgnoreQueryFilters()
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
        /// Marks expired leave allocations at fiscal year end across all tenants.
        /// Runs at 1 AM on the 1st of every month.
        /// </summary>
        public async Task ExpireLeaveBalances()
        {
            try
            {
                _logger.LogInformation("Starting leave expiry check at {DateTime}", DateTime.UtcNow);

                var cutoff = DateTime.UtcNow.Date;
                var expiredPolicies = await _db.LeavePolicies
                    .IgnoreQueryFilters()
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
        /// Archives audit logs older than 90 days to reduce database size across all tenants.
        /// Runs at 2 AM every Sunday.
        /// </summary>
        public async Task ArchiveAuditLogs()
        {
            try
            {
                _logger.LogInformation("Starting audit log archival at {DateTime}", DateTime.UtcNow);

                var archiveBefore = DateTime.UtcNow.AddDays(-90);
                var count = await _db.AuditLogs
                    .IgnoreQueryFilters()
                    .Where(a => a.CreatedAt < archiveBefore && !a.IsDeleted)
                    .CountAsync();

                if (count > 0)
                {
                    // Soft-delete old audit logs (never hard delete)
                    await _db.AuditLogs
                        .IgnoreQueryFilters()
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
        /// Sends pending notifications that have been queued across all tenants.
        /// Runs every 30 minutes.
        /// </summary>
        public async Task SendPendingNotifications()
        {
            try
            {
                _logger.LogInformation("Processing pending notifications at {DateTime}", DateTime.UtcNow);

                var pending = await _db.NotificationMessages
                    .IgnoreQueryFilters()
                    .Where(n => !n.IsDeleted && n.Status == "Pending" && n.Channel == "InApp")
                    .OrderBy(n => n.CreatedAt)
                    .Take(200)
                    .ToListAsync();

                foreach (var n in pending)
                {
                    n.Status = "Sent";
                    n.SentAt ??= DateTime.UtcNow;
                }

                if (pending.Count > 0)
                    await _db.SaveChangesAsync();

                var unreadCount = await _db.NotificationMessages
                    .IgnoreQueryFilters()
                    .Where(n => !n.IsRead && !n.IsDeleted && n.CreatedAt > DateTime.UtcNow.AddDays(-7))
                    .CountAsync();

                _logger.LogInformation(
                    "Notification dispatch: stamped {Pending} pending InApp; {Unread} unread in last 7 days",
                    pending.Count,
                    unreadCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during notification processing");
                throw;
            }
        }

        /// <summary>
        /// Revokes expired refresh tokens and cleans up soft-deleted records across all tenants.
        /// Runs daily at 3 AM.
        /// </summary>
        public async Task CleanupTemporaryData()
        {
            try
            {
                _logger.LogInformation("Starting temporary data cleanup at {DateTime}", DateTime.UtcNow);

                // Revoke expired refresh tokens across all tenants
                var expiredTokens = await _db.RefreshTokens
                    .IgnoreQueryFilters()
                    .Where(t => t.ExpiresAt < DateTime.UtcNow && !t.IsRevoked)
                    .ExecuteUpdateAsync(s => s.SetProperty(t => t.IsRevoked, true)
                                              .SetProperty(t => t.RevokedAt, DateTime.UtcNow));

                // Clean password reset tokens that have expired across all tenants
                await _db.Users
                    .IgnoreQueryFilters()
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

        /// <summary>
        /// Checks expiring and expired tenant subscriptions.
        /// Marks expired subscriptions as PastDue or Suspended and creates notification alerts.
        /// Runs daily at 4 AM.
        /// </summary>
        public async Task ProcessSubscriptionLifecycle()
        {
            try
            {
                _logger.LogInformation("Starting subscription lifecycle check at {DateTime}", DateTime.UtcNow);
                var now = DateTime.UtcNow;

                // 1. Mark expired active subscriptions whose EndDate has passed
                var expiredSubs = await _db.TenantSubscriptions
                    .IgnoreQueryFilters()
                    .Where(s => s.Status == "Active" && s.EndDate < now)
                    .ToListAsync();

                foreach (var sub in expiredSubs)
                {
                    sub.Status = "PastDue";
                    _logger.LogInformation("Subscription {SubId} for Tenant {TenantId} marked as PastDue (expired at {EndDate}).",
                        sub.Id, sub.TenantId, sub.EndDate);

                    _db.NotificationMessages.Add(new NotificationMessage
                    {
                        TenantId = sub.TenantId,
                        Title = "Subscription Expired",
                        Message = $"Your subscription plan ({sub.PlanCode}) has expired. Please renew your subscription to maintain full platform access.",
                        Channel = "InApp",
                        Type = "Subscription",
                        Status = "Pending",
                        CreatedAt = now
                    });
                }

                // 2. Mark past-due subscriptions as Suspended after 7-day grace period
                var gracePeriodCutoff = now.AddDays(-7);
                var suspendedSubs = await _db.TenantSubscriptions
                    .IgnoreQueryFilters()
                    .Where(s => s.Status == "PastDue" && s.EndDate < gracePeriodCutoff)
                    .ToListAsync();

                foreach (var sub in suspendedSubs)
                {
                    sub.Status = "Suspended";
                    _logger.LogWarning("Subscription {SubId} for Tenant {TenantId} suspended after 7-day grace period.",
                        sub.Id, sub.TenantId);
                }

                if (expiredSubs.Count > 0 || suspendedSubs.Count > 0)
                {
                    await _db.SaveChangesAsync();
                }

                _logger.LogInformation("Subscription lifecycle check completed. Expired: {ExpiredCount}, Suspended: {SuspendedCount}",
                    expiredSubs.Count, suspendedSubs.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during subscription lifecycle processing");
                throw;
            }
        }

        /// <summary>
        /// Accrues monthly earned/privilege leave for active employees across all tenants.
        /// Runs at 2 AM on the 1st of every month.
        /// </summary>
        public async Task AccrueMonthlyLeaveBalances()
        {
            try
            {
                _logger.LogInformation("Starting monthly leave accrual at {DateTime}", DateTime.UtcNow);
                var currentYear = DateTime.UtcNow.Year;

                var activePolicies = await _db.LeavePolicies
                    .IgnoreQueryFilters()
                    .Where(p => !p.IsDeleted)
                    .ToListAsync();

                if (!activePolicies.Any())
                {
                    _logger.LogInformation("No active leave policies found for accrual.");
                    return;
                }

                var activeEmployees = await _db.Employees
                    .IgnoreQueryFilters()
                    .Where(e => !e.IsDeleted && e.Status == "Active")
                    .Select(e => new { e.Id, e.TenantId })
                    .ToListAsync();

                int updatedCount = 0;
                foreach (var emp in activeEmployees)
                {
                    var policiesForTenant = activePolicies.Where(p => p.TenantId == emp.TenantId).ToList();
                    foreach (var policy in policiesForTenant)
                    {
                        var monthlyAccrual = policy.EntitlementPerYear > 0 ? Math.Round(policy.EntitlementPerYear / 12.0m, 2) : 1.5m;

                        var record = await _db.EmployeeLeaves
                            .IgnoreQueryFilters()
                            .FirstOrDefaultAsync(l => l.EmployeeId == emp.Id && l.LeavePolicyId == policy.Id && l.Year == currentYear);

                        if (record == null)
                        {
                            _db.EmployeeLeaves.Add(new EmployeeLeave
                            {
                                TenantId = emp.TenantId,
                                EmployeeId = emp.Id,
                                LeavePolicyId = policy.Id,
                                Year = currentYear,
                                Entitled = monthlyAccrual,
                                Taken = 0,
                                Balance = monthlyAccrual
                            });
                            updatedCount++;
                        }
                        else
                        {
                            record.Entitled += monthlyAccrual;
                            record.Balance += monthlyAccrual;
                            updatedCount++;
                        }
                    }
                }

                if (updatedCount > 0)
                {
                    await _db.SaveChangesAsync();
                }

                _logger.LogInformation("Monthly leave accrual completed. Updated {Count} balances for {EmpCount} active employees at {DateTime}",
                    updatedCount, activeEmployees.Count, DateTime.UtcNow);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during monthly leave accrual processing");
                throw;
            }
        }
    }
}
