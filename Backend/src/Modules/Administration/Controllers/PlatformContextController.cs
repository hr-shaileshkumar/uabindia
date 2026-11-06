using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using UabIndia.Api.Hubs;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Administration.Controllers
{
    [ApiController]
    [Route("api/v1/platform")]
    [Authorize]
    public class PlatformContextController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IHubContext<NotificationHub> _hubContext;

        public PlatformContextController(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            IHubContext<NotificationHub> hubContext)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _hubContext = hubContext;
        }

        private Guid GetUserId()
        {
            var userIdClaim = User?.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                ?? User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User?.FindFirst("nameidentifier")?.Value
                ?? User?.FindFirst("sub")?.Value;

            return Guid.TryParse(userIdClaim, out var id) ? id : Guid.Empty;
        }

        /// <summary>
        /// Returns live real-time badge counts and actionable context across all suite apps (9-Dots Launcher).
        /// </summary>
        [HttpGet("app-context-summary")]
        public async Task<IActionResult> GetAppContextSummary()
        {
            var now = DateTime.UtcNow;

            // 1. HRMS Pending Approvals & Status
            var pendingLeaves = await _db.LeaveRequests.AsNoTracking()
                .CountAsync(l => !l.IsDeleted && l.Status == "Pending");

            var pendingCandidates = await _db.Candidates.AsNoTracking()
                .CountAsync(c => !c.IsDeleted && (c.Status == CandidateStatus.Applied || c.Status == CandidateStatus.InterviewScheduled));

            // 2. Finance: Overdue MSME Invoices & Draft Payouts
            var overdueMsme = await _db.PurchaseInvoices.AsNoTracking()
                .CountAsync(i => !i.IsDeleted && i.IsMsmeInvoice && i.PaymentStatus != "Paid" && i.MsmeDueDate.HasValue && i.MsmeDueDate.Value < now);

            var pendingDisbursements = await _db.DisbursementBatches.AsNoTracking()
                .CountAsync(d => !d.IsDeleted && (d.Status == "Draft" || d.Status == "ApprovalPending"));

            // 3. Inventory: FEFO Batches expiring within 30 days
            var thirtyDaysFromNow = now.AddDays(30);
            var expiringBatches = await _db.ItemBatches.AsNoTracking()
                .CountAsync(b => !b.IsDeleted && b.ExpiryDate.HasValue && b.ExpiryDate.Value <= thirtyDaysFromNow && b.QuantityCurrent > 0);

            var quarantinedBatches = await _db.ItemBatches.AsNoTracking()
                .CountAsync(b => !b.IsDeleted && b.Status == "Quarantined" && b.QuantityCurrent > 0);

            // 4. Manufacturing: Pending QC Inward Lots & Subcontracting 180-day Overdue
            var pendingQcLots = await _db.QualityInspectionLots.AsNoTracking()
                .CountAsync(q => !q.IsDeleted && q.InspectionStatus == "Pending");

            var oneEightyDaysAgo = now.AddDays(-180);
            var agingChallans = await _db.SubcontractOrders.AsNoTracking()
                .CountAsync(s => !s.IsDeleted && s.Status == "ChallanIssued" && s.ChallanDate <= oneEightyDaysAgo);

            return Ok(new
            {
                timestamp = now,
                hrms = new
                {
                    pendingLeaves,
                    pendingCandidates,
                    badgeCount = pendingLeaves + pendingCandidates,
                    summary = pendingLeaves > 0 ? $"{pendingLeaves} Leave Approvals" : "All Clear"
                },
                finance = new
                {
                    overdueMsme,
                    pendingDisbursements,
                    badgeCount = overdueMsme + pendingDisbursements,
                    summary = overdueMsme > 0 ? $"{overdueMsme} MSME 43B(h) Alerts" : "Tax Compliant"
                },
                inventory = new
                {
                    expiringBatches,
                    quarantinedBatches,
                    badgeCount = expiringBatches + quarantinedBatches,
                    summary = expiringBatches > 0 ? $"{expiringBatches} FEFO Expiry Alerts" : "Stock Healthy"
                },
                manufacturing = new
                {
                    pendingQcLots,
                    agingChallans,
                    badgeCount = pendingQcLots + agingChallans,
                    summary = pendingQcLots > 0 ? $"{pendingQcLots} QC Lots Pending" : "Quality Assured"
                }
            });
        }

        /// <summary>
        /// Executes automated daily compliance evaluation across MSME Section 43B(h), FEFO Expiry, and GST Rule 55 Challans.
        /// Inserts actionable notifications in the database and triggers real-time SignalR broadcasts.
        /// </summary>
        [HttpPost("run-compliance-audit")]
        public async Task<IActionResult> RunComplianceAudit()
        {
            var now = DateTime.UtcNow;
            var tenantId = _tenantAccessor.GetTenantId();
            var currentUserId = GetUserId();

            var msmeProcessedCount = 0;
            var batchAlertsCount = 0;
            var challanAlertsCount = 0;
            var notificationsCreated = 0;

            // 1. Evaluate MSME Invoices exceeding 45 days
            var overdueInvoices = await _db.PurchaseInvoices
                .Include(i => i.Vendor)
                .Where(i => !i.IsDeleted && i.IsMsmeInvoice && i.PaymentStatus != "Paid" && i.MsmeDueDate.HasValue && i.MsmeDueDate.Value < now)
                .ToListAsync();

            foreach (var inv in overdueInvoices)
            {
                if (!inv.IsSection43bDisallowed)
                {
                    inv.IsSection43bDisallowed = true;
                    inv.UpdatedAt = now;
                    msmeProcessedCount++;

                    // Create Actionable Notification
                    var notif = new NotificationMessage
                    {
                        Id = Guid.NewGuid(),
                        TenantId = inv.TenantId,
                        RecipientUserId = currentUserId != Guid.Empty ? currentUserId : Guid.Parse("A1000000-0000-0000-0000-000000000001"),
                        CompanyId = inv.CompanyId,
                        Channel = "InApp",
                        Type = "StatutoryCompliance",
                        Title = $"⚠️ Section 43B(h) Disallowed: {inv.InvoiceNumber}",
                        Message = $"Invoice {inv.InvoiceNumber} from MSME vendor '{inv.Vendor?.VendorName}' is overdue by {(int)(now - inv.MsmeDueDate!.Value).TotalDays} days. Income tax deduction disallowed under Sec 43B(h).",
                        Status = "Sent",
                        IsRead = false,
                        SentAt = now,
                        CreatedAt = now,
                        MetadataJson = JsonSerializer.Serialize(new
                        {
                            invoiceId = inv.Id,
                            invoiceNumber = inv.InvoiceNumber,
                            vendorName = inv.Vendor?.VendorName,
                            overdueDays = (int)(now - inv.MsmeDueDate!.Value).TotalDays,
                            route = "/compliance/msme-tds"
                        })
                    };

                    _db.NotificationMessages.Add(notif);
                    notificationsCreated++;
                }
            }

            // 2. Evaluate Batches Expiring in <= 30 days
            var thirtyDaysFromNow = now.AddDays(30);
            var expiringBatches = await _db.ItemBatches
                .Include(b => b.Item)
                .Where(b => !b.IsDeleted && b.ExpiryDate.HasValue && b.ExpiryDate.Value <= thirtyDaysFromNow && b.QuantityCurrent > 0)
                .ToListAsync();

            foreach (var batch in expiringBatches)
            {
                var daysRemaining = (int)(batch.ExpiryDate!.Value - now).TotalDays;
                batchAlertsCount++;

                var recentNotifExists = await _db.NotificationMessages.AnyAsync(n =>
                    n.TenantId == tenantId &&
                    n.Title.Contains(batch.BatchNumber) &&
                    n.CreatedAt >= now.AddDays(-1));

                if (!recentNotifExists)
                {
                    var notif = new NotificationMessage
                    {
                        Id = Guid.NewGuid(),
                        TenantId = batch.TenantId,
                        RecipientUserId = currentUserId != Guid.Empty ? currentUserId : Guid.Parse("A1000000-0000-0000-0000-000000000001"),
                        Channel = "InApp",
                        Type = "InventoryFEFO",
                        Title = $"⏳ FEFO Expiry Warning: Batch {batch.BatchNumber}",
                        Message = $"Batch {batch.BatchNumber} for item '{batch.Item?.ItemName}' has {batch.QuantityCurrent} units remaining and will expire in {daysRemaining} days. Prioritize dispatch or quarantine.",
                        Status = "Sent",
                        IsRead = false,
                        SentAt = now,
                        CreatedAt = now,
                        MetadataJson = JsonSerializer.Serialize(new
                        {
                            batchId = batch.Id,
                            batchNumber = batch.BatchNumber,
                            daysRemaining,
                            route = "/inventory/batches"
                        })
                    };

                    _db.NotificationMessages.Add(notif);
                    notificationsCreated++;
                }
            }

            // 3. Evaluate Subcontracting Delivery Challans > 180 Days
            var oneEightyDaysAgo = now.AddDays(-180);
            var agingOrders = await _db.SubcontractOrders
                .Include(s => s.Vendor)
                .Where(s => !s.IsDeleted && s.Status == "ChallanIssued" && s.ChallanDate <= oneEightyDaysAgo)
                .ToListAsync();

            foreach (var challan in agingOrders)
            {
                challanAlertsCount++;
                var daysPending = (int)(now - challan.ChallanDate).TotalDays;

                var notifExists = await _db.NotificationMessages.AnyAsync(n =>
                    n.TenantId == tenantId &&
                    n.Title.Contains(challan.DeliveryChallanNumber) &&
                    n.CreatedAt >= now.AddDays(-1));

                if (!notifExists)
                {
                    var notif = new NotificationMessage
                    {
                        Id = Guid.NewGuid(),
                        TenantId = challan.TenantId,
                        RecipientUserId = currentUserId != Guid.Empty ? currentUserId : Guid.Parse("A1000000-0000-0000-0000-000000000001"),
                        Channel = "InApp",
                        Type = "GSTSubcontracting",
                        Title = $"⚖️ GST Rule 55 Breach Alert: Challan {challan.DeliveryChallanNumber}",
                        Message = $"Delivery Challan {challan.DeliveryChallanNumber} with vendor '{challan.Vendor?.VendorName}' has exceeded the 180-day statutory return limit ({daysPending} days). Deemed supply tax liability applicable under CGST Act Section 143.",
                        Status = "Sent",
                        IsRead = false,
                        SentAt = now,
                        CreatedAt = now,
                        MetadataJson = JsonSerializer.Serialize(new
                        {
                            orderId = challan.Id,
                            challanNumber = challan.DeliveryChallanNumber,
                            daysPending,
                            route = "/manufacturing/subcontracting"
                        })
                    };

                    _db.NotificationMessages.Add(notif);
                    notificationsCreated++;
                }
            }

            await _db.SaveChangesAsync();

            // Broadcast SignalR update to connected workspace clients
            try
            {
                await _hubContext.Clients.Group($"tenant_{tenantId}").SendAsync("ReceiveNotification", new
                {
                    type = "ComplianceAuditCompleted",
                    msmeProcessedCount,
                    batchAlertsCount,
                    challanAlertsCount,
                    notificationsCreated,
                    executedAt = now
                });
            }
            catch
            {
                // SignalR background broadcast resilience
            }

            return Ok(new
            {
                success = true,
                message = "Automated compliance evaluation completed successfully.",
                executedAt = now,
                summary = new
                {
                    msmeOverdueProcessed = msmeProcessedCount,
                    fefoBatchesAlerted = batchAlertsCount,
                    gstChallansAging = challanAlertsCount,
                    totalNotificationsGenerated = notificationsCreated
                }
            });
        }
    }
}
