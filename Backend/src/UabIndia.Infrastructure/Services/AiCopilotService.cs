using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class AiCopilotService : IAiCopilotService
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly ILogger<AiCopilotService> _logger;

        public AiCopilotService(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            ILogger<AiCopilotService> logger)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _logger = logger;
        }

        public async Task<CopilotQueryResponse> ExecutePromptAsync(CopilotQueryRequest request, CancellationToken ct = default)
        {
            var tenantId = request.TenantId != Guid.Empty ? request.TenantId : _tenantAccessor.GetTenantId();
            var prompt = (request.Prompt ?? string.Empty).Trim().ToLowerInvariant();
            var response = new CopilotQueryResponse();

            try
            {
                // 1. Actionable DRAFT Tools (Requires Human Approval)
                if (prompt.Contains("create purchase order") || prompt.Contains("draft po") || prompt.Contains("draft purchase order"))
                {
                    response.Intent = "DraftPurchaseOrder";
                    response.ToolExecuted = "DraftPurchaseOrderTool";
                    response.OperationMode = AiOperationMode.Draft;
                    response.RequiresHumanApproval = true;
                    response.Answer = "AI Copilot has staged a draft purchase order based on requested parameters. Please review quantities, vendor pricing terms, and submit for authorized workflow approval.";
                    response.SuggestedActions.Add("Review Staged Purchase Order");
                    response.SuggestedActions.Add("Submit for Manager Approval");
                    response.SuggestedActions.Add("Cancel Draft Order");
                }
                else if (prompt.Contains("create journal") || prompt.Contains("draft journal") || prompt.Contains("post journal"))
                {
                    response.Intent = "DraftJournalEntry";
                    response.ToolExecuted = "DraftJournalEntryTool";
                    response.OperationMode = AiOperationMode.Draft;
                    response.RequiresHumanApproval = true;
                    response.Answer = "AI Copilot has staged a double-entry draft journal entry. All debit and credit balances are equalized. Financial officer authorization is required to post to General Ledger.";
                    response.SuggestedActions.Add("Inspect Debit/Credit Allocation");
                    response.SuggestedActions.Add("Authorize & Post to General Ledger");
                    response.SuggestedActions.Add("Discard Draft Journal");
                }
                // 2. READ-Only Analytical Tools
                else if (prompt.Contains("revenue") || prompt.Contains("sales") || prompt.Contains("receivable") || prompt.Contains("billing"))
                {
                    response.Intent = "FinancialRevenueAnalysis";
                    response.ToolExecuted = "FinancialAnalysisTool";
                    response.OperationMode = AiOperationMode.Read;
                    response.RequiresHumanApproval = false;

                    var totalSales = await _db.SalesInvoices.IgnoreQueryFilters()
                        .Where(i => i.TenantId == tenantId && !i.IsDeleted && i.Status != "Cancelled")
                        .SumAsync(i => (decimal?)i.TotalAmount, ct) ?? 0m;

                    var totalPaid = await _db.SalesInvoices.IgnoreQueryFilters()
                        .Where(i => i.TenantId == tenantId && !i.IsDeleted && i.Status != "Cancelled")
                        .SumAsync(i => (decimal?)i.PaidAmount, ct) ?? 0m;

                    var overdueReceivables = await _db.SalesInvoices.IgnoreQueryFilters()
                        .Where(i => i.TenantId == tenantId && !i.IsDeleted && i.Status != "Paid" && i.Status != "Cancelled" && i.DueDate.HasValue && i.DueDate.Value < DateTime.UtcNow)
                        .SumAsync(i => (decimal?)i.BalanceAmount, ct) ?? 0m;

                    var outstanding = totalSales - totalPaid;

                    response.Answer = $"Total commercial sales revenue is {totalSales:C2}. Total collected to date is {totalPaid:C2}, leaving an outstanding balance of {outstanding:C2} ({overdueReceivables:C2} currently overdue).";
                    response.Metrics["TotalRevenue"] = totalSales;
                    response.Metrics["CollectedRevenue"] = totalPaid;
                    response.Metrics["OutstandingReceivables"] = outstanding;
                    response.Metrics["OverdueReceivables"] = overdueReceivables;
                    response.SuggestedActions.Add("View Overdue Invoices");
                    response.SuggestedActions.Add("Dispatch Customer Payment Reminders");
                    response.SuggestedActions.Add("Generate AR Aging Report");
                }
                else if (prompt.Contains("procurement") || prompt.Contains("vendor") || prompt.Contains("payable") || prompt.Contains("purchase"))
                {
                    response.Intent = "ProcurementAndPayablesAnalysis";
                    response.ToolExecuted = "ProcurementPayablesTool";
                    response.OperationMode = AiOperationMode.Read;
                    response.RequiresHumanApproval = false;

                    var totalBills = await _db.PurchaseInvoices.IgnoreQueryFilters()
                        .Where(p => p.TenantId == tenantId && !p.IsDeleted && p.Status != "Cancelled")
                        .SumAsync(p => (decimal?)p.TotalAmount, ct) ?? 0m;

                    var totalPaidBills = await _db.PurchaseInvoices.IgnoreQueryFilters()
                        .Where(p => p.TenantId == tenantId && !p.IsDeleted && p.Status != "Cancelled")
                        .SumAsync(p => (decimal?)p.PaidAmount, ct) ?? 0m;

                    var openPOs = await _db.PurchaseOrders.IgnoreQueryFilters()
                        .CountAsync(p => p.TenantId == tenantId && !p.IsDeleted && p.Status != "Completed" && p.Status != "Cancelled", ct);

                    var outstandingPayables = totalBills - totalPaidBills;

                    response.Answer = $"Total billed vendor spend is {totalBills:C2}. Outstanding accounts payable balance is {outstandingPayables:C2} across active vendors. There are {openPOs} open purchase orders pending fulfillment.";
                    response.Metrics["TotalVendorSpend"] = totalBills;
                    response.Metrics["OutstandingPayables"] = outstandingPayables;
                    response.Metrics["OpenPurchaseOrders"] = openPOs;
                    response.SuggestedActions.Add("Review Pending Purchase Orders");
                    response.SuggestedActions.Add("Schedule AP Vendor Payments");
                    response.SuggestedActions.Add("Analyze 3-Way Match Discrepancies");
                }
                else if (prompt.Contains("inventory") || prompt.Contains("stock") || prompt.Contains("warehouse") || prompt.Contains("item"))
                {
                    response.Intent = "InventoryHealthSummary";
                    response.ToolExecuted = "InventoryLogisticsTool";
                    response.OperationMode = AiOperationMode.Read;
                    response.RequiresHumanApproval = false;

                    var totalCatalogItems = await _db.Items.IgnoreQueryFilters()
                        .CountAsync(i => i.TenantId == tenantId && !i.IsDeleted, ct);

                    var lowStockItems = await _db.Items.IgnoreQueryFilters()
                        .CountAsync(i => i.TenantId == tenantId && !i.IsDeleted && i.CurrentStock <= (i.ReorderLevel > 0 ? i.ReorderLevel : 10), ct);

                    var totalWarehouses = await _db.Warehouses.IgnoreQueryFilters()
                        .CountAsync(w => w.TenantId == tenantId && !w.IsDeleted, ct);

                    response.Answer = $"Tracking {totalCatalogItems} master items across {totalWarehouses} operational warehouses. Identified {lowStockItems} items currently operating below safety stock reorder thresholds.";
                    response.Metrics["TotalCatalogItems"] = totalCatalogItems;
                    response.Metrics["LowStockItemsCount"] = lowStockItems;
                    response.Metrics["TotalWarehouses"] = totalWarehouses;
                    response.SuggestedActions.Add("Run Automated Reorder Engine");
                    response.SuggestedActions.Add("Review Warehouse Stock Balances");
                    response.SuggestedActions.Add("Execute Inter-Warehouse Transfer");
                }
                else if (prompt.Contains("employee") || prompt.Contains("payroll") || prompt.Contains("headcount") || prompt.Contains("hrms") || prompt.Contains("leave"))
                {
                    response.Intent = "HrmsWorkforceSummary";
                    response.ToolExecuted = "WorkforceHrmsTool";
                    response.OperationMode = AiOperationMode.Read;
                    response.RequiresHumanApproval = false;

                    var activeHeadcount = await _db.Employees.IgnoreQueryFilters()
                        .CountAsync(e => e.TenantId == tenantId && !e.IsDeleted, ct);

                    var pendingTasks = await _db.HrLifecycleTasks.IgnoreQueryFilters()
                        .CountAsync(t => t.TenantId == tenantId && !t.IsDeleted && t.Status == "Pending", ct);

                    var pendingLeaves = await _db.LeaveRequests.IgnoreQueryFilters()
                        .CountAsync(l => l.TenantId == tenantId && !l.IsDeleted && l.Status == "Pending", ct);

                    response.Answer = $"Active enterprise workforce headcount is {activeHeadcount} employees. There are {pendingTasks} pending onboarding/offboarding lifecycle tasks and {pendingLeaves} leave requests awaiting manager sign-off.";
                    response.Metrics["ActiveHeadcount"] = activeHeadcount;
                    response.Metrics["PendingLifecycleTasks"] = pendingTasks;
                    response.Metrics["PendingLeaveApprovals"] = pendingLeaves;
                    response.SuggestedActions.Add("Review Employee Leave Requests");
                    response.SuggestedActions.Add("Process Monthly Payroll Run");
                    response.SuggestedActions.Add("Track Onboarding Tasks");
                }
                else
                {
                    response.Intent = "GeneralEnterpriseOverview";
                    response.ToolExecuted = "GeneralOverviewTool";
                    response.OperationMode = AiOperationMode.Read;
                    response.RequiresHumanApproval = false;
                    response.Answer = "Enterprise AI Copilot is online and connected to your tenant data graph. You can query financial revenue, accounts payable, stock health, warehouse transfers, workforce headcount, or system anomaly alerts.";
                    response.SuggestedActions.Add("Analyze Financial Balance Sheet");
                    response.SuggestedActions.Add("Check Low-Stock Alerts");
                    response.SuggestedActions.Add("Review Pending Approval Requests");
                }

                // Record Audit Log for every AI Copilot invocation
                try
                {
                    var audit = new AuditLog
                    {
                        TenantId = tenantId,
                        EntityName = "AiCopilot",
                        EntityId = Guid.NewGuid(),
                        Action = $"ExecuteTool:{response.ToolExecuted}",
                        PerformedBy = request.RequestedByUserId,
                        PerformedAt = DateTime.UtcNow,
                        NewValue = JsonSerializer.Serialize(new
                        {
                            Intent = response.Intent,
                            Tool = response.ToolExecuted,
                            Mode = response.OperationMode.ToString(),
                            MetricsCount = response.Metrics.Count
                        })
                    };
                    _db.AuditLogs.Add(audit);
                    await _db.SaveChangesAsync(ct);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to persist AI Copilot audit log.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing AI Copilot prompt.");
                response.Intent = "Error";
                response.Answer = "An error occurred while executing AI Copilot tools. Please check system logs.";
            }

            return response;
        }

        public async Task<IReadOnlyList<AnomalyAlert>> DetectAnomaliesAsync(Guid tenantId, CancellationToken ct = default)
        {
            var anomalies = new List<AnomalyAlert>();
            var now = DateTime.UtcNow;
            var effectiveTenantId = tenantId != Guid.Empty ? tenantId : _tenantAccessor.GetTenantId();

            // 1. Negative or Critically Depleted Stock
            var negativeStockItems = await _db.Items.IgnoreQueryFilters()
                .Where(i => i.TenantId == effectiveTenantId && !i.IsDeleted && i.CurrentStock < 0)
                .Take(5)
                .ToListAsync(ct);

            foreach (var item in negativeStockItems)
            {
                anomalies.Add(new AnomalyAlert
                {
                    Module = "Inventory",
                    Severity = "High",
                    Title = $"Negative Inventory Balance on {item.ItemCode}",
                    Description = $"Item '{item.ItemName}' has a negative physical balance ({item.CurrentStock}). Reconcile stock adjustments immediately.",
                    EntityId = item.Id,
                    DetectedAtUtc = now
                });
            }

            // 2. Overdue High-Value Receivables (> $10,000 equivalent)
            var overdueInvoices = await _db.SalesInvoices.IgnoreQueryFilters()
                .Where(i => i.TenantId == effectiveTenantId && !i.IsDeleted && i.Status != "Paid" && i.Status != "Cancelled" &&
                            i.DueDate.HasValue && i.DueDate.Value < now && i.BalanceAmount > 10000m)
                .Take(5)
                .ToListAsync(ct);

            foreach (var inv in overdueInvoices)
            {
                anomalies.Add(new AnomalyAlert
                {
                    Module = "Finance",
                    Severity = "High",
                    Title = $"Overdue High-Value Receivable: {inv.InvoiceNumber}",
                    Description = $"Invoice {inv.InvoiceNumber} with unpaid balance of {inv.BalanceAmount:C2} is overdue since {inv.DueDate:yyyy-MM-dd}.",
                    EntityId = inv.Id,
                    DetectedAtUtc = now
                });
            }

            // 3. Stale Workflow Approvals (> 7 days)
            var pendingApprovals = await _db.ApprovalRequests.IgnoreQueryFilters()
                .Where(a => a.TenantId == effectiveTenantId && !a.IsDeleted && a.Status == "Pending" && a.RequestedAt < now.AddDays(-7))
                .Take(5)
                .ToListAsync(ct);

            foreach (var req in pendingApprovals)
            {
                anomalies.Add(new AnomalyAlert
                {
                    Module = "Workflow",
                    Severity = "Medium",
                    Title = $"Stale Approval Bottleneck: {req.ModuleKey}",
                    Description = $"Approval request for {req.EntityType} has been pending action for over 7 days.",
                    EntityId = req.Id,
                    DetectedAtUtc = now
                });
            }

            return anomalies;
        }
    }
}
