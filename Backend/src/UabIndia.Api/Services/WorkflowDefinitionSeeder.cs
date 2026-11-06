using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Services
{
    /// <summary>
    /// Seeds default multi-tier enterprise approval workflows (WorkflowDefinition + WorkflowStep)
    /// for all platform tenants. Runs idempotently at startup and on-demand via the WorkflowController.
    /// Preserves custom tenant overrides while guaranteeing core approval chains exist.
    /// </summary>
    public sealed class WorkflowDefinitionSeeder
    {
        public async Task EnsureWorkflowDefinitionsAsync(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            ILogger logger)
        {
            List<Tenant> tenants;
            try
            {
                tenants = await db.Tenants.AsNoTracking()
                    .Where(t => t.IsActive && !t.IsDeleted)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "WorkflowDefinitionSeeder: could not load tenants, skipping.");
                return;
            }

            foreach (var tenant in tenants)
            {
                tenantAccessor.SetTenantId(tenant.Id);
                tenantAccessor.SetTenantSchema(
                    $"tenant_{tenant.Subdomain ?? tenant.Id.ToString("N")}");
                try
                {
                    await EnsureWorkflowDefinitionsForTenantAsync(db, tenant.Id, logger);
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex,
                        "WorkflowDefinitionSeeder: tenant {TenantId} failed, continuing.", tenant.Id);
                }
            }
        }

        public async Task<int> EnsureWorkflowDefinitionsForTenantAsync(
            ApplicationDbContext db,
            Guid tenantId,
            ILogger? logger = null)
        {
            var existingKeys = await db.WorkflowDefinitions
                .IgnoreQueryFilters()
                .Where(w => w.TenantId == tenantId && !w.IsDeleted)
                .Select(w => w.ModuleKey.ToLower())
                .ToHashSetAsync();

            var defaults = BuildDefaultDefinitions(tenantId);
            var added = 0;

            foreach (var def in defaults)
            {
                if (existingKeys.Contains(def.ModuleKey.ToLowerInvariant()))
                    continue;

                db.WorkflowDefinitions.Add(def);
                added++;
            }

            if (added > 0)
            {
                await db.SaveChangesAsync();
                logger?.LogInformation(
                    "WorkflowDefinitionSeeder: seeded {Count} workflow definitions for tenant {TenantId}",
                    added, tenantId);
            }

            return added;
        }

        public async Task<int> SyncAllTenantsWorkflowDefinitionsAsync(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            ILogger? logger = null)
        {
            List<Tenant> tenants;
            try
            {
                tenants = await db.Tenants.AsNoTracking()
                    .Where(t => t.IsActive && !t.IsDeleted)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                logger?.LogWarning(ex, "WorkflowDefinitionSeeder: could not load tenants, skipping.");
                return 0;
            }

            var totalAdded = 0;
            foreach (var tenant in tenants)
            {
                tenantAccessor.SetTenantId(tenant.Id);
                tenantAccessor.SetTenantSchema($"tenant_{tenant.Subdomain ?? tenant.Id.ToString("N")}");
                try
                {
                    totalAdded += await EnsureWorkflowDefinitionsForTenantAsync(db, tenant.Id, logger);
                }
                catch (Exception ex)
                {
                    logger?.LogWarning(ex, "WorkflowDefinitionSeeder: tenant {TenantId} failed, continuing.", tenant.Id);
                }
            }

            return totalAdded;
        }

        private static List<WorkflowDefinition> BuildDefaultDefinitions(Guid tenantId)
        {
            return new List<WorkflowDefinition>
            {
                // 1. Employee Leave Approval Chain
                new()
                {
                    TenantId = tenantId,
                    ModuleKey = "leave_approval",
                    Name = "Employee Leave Approval Chain",
                    IsActive = true,
                    Steps = new List<WorkflowStep>
                    {
                        new() { TenantId = tenantId, StepOrder = 1, RoleRequired = "ReportingManager", ApprovalType = "Any", EscalationDays = 2 },
                        new() { TenantId = tenantId, StepOrder = 2, RoleRequired = "HRManager", ApprovalType = "Any", EscalationDays = 3 },
                    }
                },

                // 2. Expense Claim Reimbursement Approval Chain
                new()
                {
                    TenantId = tenantId,
                    ModuleKey = "expense_approval",
                    Name = "Expense Claim Reimbursement Chain",
                    IsActive = true,
                    Steps = new List<WorkflowStep>
                    {
                        new() { TenantId = tenantId, StepOrder = 1, RoleRequired = "ReportingManager", ApprovalType = "Any", EscalationDays = 2 },
                        new() { TenantId = tenantId, StepOrder = 2, RoleRequired = "FinanceAdmin", ApprovalType = "Any", EscalationDays = 3 },
                    }
                },

                // 3. Purchase Order Approval Chain
                new()
                {
                    TenantId = tenantId,
                    ModuleKey = "purchase_order_approval",
                    Name = "Commercial Purchase Order Approval Chain",
                    IsActive = true,
                    Steps = new List<WorkflowStep>
                    {
                        new() { TenantId = tenantId, StepOrder = 1, RoleRequired = "DepartmentHead", ApprovalType = "Any", EscalationDays = 2 },
                        new() { TenantId = tenantId, StepOrder = 2, RoleRequired = "ProcurementHead", ApprovalType = "Any", EscalationDays = 2 },
                        new() { TenantId = tenantId, StepOrder = 3, RoleRequired = "CFO", ApprovalType = "Any", EscalationDays = 3 },
                    }
                },

                // 4. Full & Final Separation Settlement Approval Chain
                new()
                {
                    TenantId = tenantId,
                    ModuleKey = "final_settlement_approval",
                    Name = "Full & Final Settlement Approval Chain",
                    IsActive = true,
                    Steps = new List<WorkflowStep>
                    {
                        new() { TenantId = tenantId, StepOrder = 1, RoleRequired = "HRAdmin", ApprovalType = "Any", EscalationDays = 2 },
                        new() { TenantId = tenantId, StepOrder = 2, RoleRequired = "FinanceAdmin", ApprovalType = "Any", EscalationDays = 3 },
                    }
                },

                // 5. Overtime Hours Approval Chain
                new()
                {
                    TenantId = tenantId,
                    ModuleKey = "overtime_approval",
                    Name = "Overtime Hours Approval Chain",
                    IsActive = true,
                    Steps = new List<WorkflowStep>
                    {
                        new() { TenantId = tenantId, StepOrder = 1, RoleRequired = "ReportingManager", ApprovalType = "Any", EscalationDays = 1 },
                        new() { TenantId = tenantId, StepOrder = 2, RoleRequired = "HRAdmin", ApprovalType = "Any", EscalationDays = 2 },
                    }
                },

                // 6. Business Travel Approval Chain
                new()
                {
                    TenantId = tenantId,
                    ModuleKey = "travel_approval",
                    Name = "Business Travel Request Approval Chain",
                    IsActive = true,
                    Steps = new List<WorkflowStep>
                    {
                        new() { TenantId = tenantId, StepOrder = 1, RoleRequired = "ReportingManager", ApprovalType = "Any", EscalationDays = 2 },
                        new() { TenantId = tenantId, StepOrder = 2, RoleRequired = "FinanceAdmin", ApprovalType = "Any", EscalationDays = 2 },
                    }
                },

                // 7. Vendor Bill Accounts Payable Approval Chain
                new()
                {
                    TenantId = tenantId,
                    ModuleKey = "vendor_bill_approval",
                    Name = "Vendor Bill Accounts Payable Approval Chain",
                    IsActive = true,
                    Steps = new List<WorkflowStep>
                    {
                        new() { TenantId = tenantId, StepOrder = 1, RoleRequired = "Accountant", ApprovalType = "Any", EscalationDays = 2 },
                        new() { TenantId = tenantId, StepOrder = 2, RoleRequired = "FinanceHead", ApprovalType = "Any", EscalationDays = 3 },
                    }
                },

                // 8. General Ledger Journal Entry Approval Chain
                new()
                {
                    TenantId = tenantId,
                    ModuleKey = "journal_entry_approval",
                    Name = "General Ledger Journal Entry Approval Chain",
                    IsActive = true,
                    Steps = new List<WorkflowStep>
                    {
                        new() { TenantId = tenantId, StepOrder = 1, RoleRequired = "SeniorAccountant", ApprovalType = "Any", EscalationDays = 2 },
                        new() { TenantId = tenantId, StepOrder = 2, RoleRequired = "FinanceController", ApprovalType = "Any", EscalationDays = 2 },
                    }
                },
            };
        }
    }
}
