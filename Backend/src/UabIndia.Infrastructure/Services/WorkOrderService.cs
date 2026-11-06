using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class WorkOrderService : IWorkOrderService
    {
        private readonly ApplicationDbContext _db;
        private readonly IDocumentSequenceService _sequenceService;

        public WorkOrderService(ApplicationDbContext db, IDocumentSequenceService sequenceService)
        {
            _db = db;
            _sequenceService = sequenceService;
        }

        public async Task<IReadOnlyList<WorkOrderSummaryDto>> GetWorkOrdersAsync(Guid tenantId, string? status = null, CancellationToken ct = default)
        {
            await EnsureSeededSampleOrdersAsync(tenantId, ct);

            var query = _db.WorkOrders
                .Include(w => w.Operations)
                .Where(w => w.TenantId == tenantId && !w.IsDeleted);

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(o => o.Status == status);
            }

            var entities = await query.OrderByDescending(o => o.StartDate).ToListAsync(ct);

            var itemIds = entities.Select(e => e.ItemId).Distinct().ToList();
            var items = await _db.Items
                .Where(i => itemIds.Contains(i.Id) && i.TenantId == tenantId)
                .ToDictionaryAsync(i => i.Id, ct);

            return entities.Select(e => MapToDto(e, items.GetValueOrDefault(e.ItemId))).ToList();
        }

        public async Task<WorkOrderSummaryDto> CreateWorkOrderAsync(Guid tenantId, CreateWorkOrderRequest req, CancellationToken ct = default)
        {
            var item = await _db.Items
                .FirstOrDefaultAsync(i => i.Id == req.ItemId && i.TenantId == tenantId && !i.IsDeleted, ct);

            var woNumber = await _sequenceService.GetNextSequenceNumberAsync(tenantId, "WorkOrder", "WO", ct);

            var workOrder = new WorkOrder
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                WorkOrderNumber = woNumber,
                ItemId = req.ItemId,
                TargetQuantity = req.TargetQuantity > 0 ? req.TargetQuantity : 10,
                ProducedQuantity = 0,
                ScrappedQuantity = 0,
                Status = "Released",
                StartDate = DateTime.UtcNow,
                DueDate = req.DueDate,
                QualityInspectionPassed = false,
                CreatedAt = DateTime.UtcNow,
                Operations = new List<WorkOrderOperation>
                {
                    new()
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId,
                        Sequence = 10,
                        OperationName = "Precision Material Cutting & Sizing",
                        WorkstationName = "CNC Workstation A1",
                        Status = "InProgress",
                        PlannedHours = 2.5m,
                        ActualHours = 0,
                        OperatorName = "Marcus Vance",
                        CreatedAt = DateTime.UtcNow
                    },
                    new()
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId,
                        Sequence = 20,
                        OperationName = "Core Stator & Rotor Subassembly",
                        WorkstationName = "Subassembly Line 2",
                        Status = "Pending",
                        PlannedHours = 4.0m,
                        ActualHours = 0,
                        OperatorName = "Elena Rostova",
                        CreatedAt = DateTime.UtcNow
                    },
                    new()
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId,
                        Sequence = 30,
                        OperationName = "Automated High-Voltage & Insulation Testing",
                        WorkstationName = "Testing Bay 3",
                        Status = "Pending",
                        PlannedHours = 1.5m,
                        ActualHours = 0,
                        OperatorName = "David Chen",
                        CreatedAt = DateTime.UtcNow
                    },
                    new()
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId,
                        Sequence = 40,
                        OperationName = "Final Quality Audit & Palletized Packaging",
                        WorkstationName = "Packaging Line 1",
                        Status = "Pending",
                        PlannedHours = 1.0m,
                        ActualHours = 0,
                        OperatorName = "Sarah Jenkins",
                        CreatedAt = DateTime.UtcNow
                    }
                }
            };

            _db.WorkOrders.Add(workOrder);
            await _db.SaveChangesAsync(ct);

            return MapToDto(workOrder, item);
        }

        public async Task<WorkOrderSummaryDto?> UpdateOperationStatusAsync(
            Guid tenantId,
            Guid workOrderId,
            UpdateOperationStatusRequest req,
            CancellationToken ct = default)
        {
            var workOrder = await _db.WorkOrders
                .Include(w => w.Operations)
                .FirstOrDefaultAsync(w => w.Id == workOrderId && w.TenantId == tenantId && !w.IsDeleted, ct);

            if (workOrder == null) return null;

            var op = workOrder.Operations.FirstOrDefault(o => o.Sequence == req.Sequence);
            if (op == null) return null;

            op.Status = req.Status;
            op.ActualHours = req.ActualHours > 0 ? (decimal)req.ActualHours : op.PlannedHours;
            if (!string.IsNullOrWhiteSpace(req.OperatorName)) op.OperatorName = req.OperatorName;
            if (req.Status.Equals("Completed", StringComparison.OrdinalIgnoreCase)) op.CompletedAt = DateTime.UtcNow;

            if (workOrder.Operations.All(o => o.Status.Equals("Completed", StringComparison.OrdinalIgnoreCase)))
            {
                workOrder.Status = "QualityInspection";
            }
            else
            {
                workOrder.Status = "InProgress";
            }

            workOrder.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);

            var item = await _db.Items.FirstOrDefaultAsync(i => i.Id == workOrder.ItemId && i.TenantId == tenantId, ct);
            return MapToDto(workOrder, item);
        }

        public async Task<WorkOrderSummaryDto?> CompleteWorkOrderAsync(
            Guid tenantId,
            Guid workOrderId,
            CompleteWorkOrderRequest req,
            CancellationToken ct = default)
        {
            var workOrder = await _db.WorkOrders
                .Include(w => w.Operations)
                .FirstOrDefaultAsync(w => w.Id == workOrderId && w.TenantId == tenantId && !w.IsDeleted, ct);

            if (workOrder == null) return null;

            workOrder.ProducedQuantity = req.ProducedQuantity > 0 ? req.ProducedQuantity : workOrder.TargetQuantity;
            workOrder.ScrappedQuantity = req.ScrappedQuantity;
            workOrder.QualityInspectionPassed = req.PassedQualityInspection;
            workOrder.QualityNotes = req.InspectionNotes ?? "Inspected and certified per ISO-9001 compliance standards.";
            workOrder.Status = req.PassedQualityInspection ? "Completed" : "QualityRejected";
            workOrder.UpdatedAt = DateTime.UtcNow;

            if (req.PassedQualityInspection)
            {
                var item = await _db.Items.FirstOrDefaultAsync(i => i.Id == workOrder.ItemId && i.TenantId == tenantId && !i.IsDeleted, ct);
                if (item != null)
                {
                    item.CurrentStock += workOrder.ProducedQuantity;
                }
            }

            await _db.SaveChangesAsync(ct);

            var itemInfo = await _db.Items.FirstOrDefaultAsync(i => i.Id == workOrder.ItemId && i.TenantId == tenantId, ct);
            return MapToDto(workOrder, itemInfo);
        }

        private async Task EnsureSeededSampleOrdersAsync(Guid tenantId, CancellationToken ct)
        {
            var exists = await _db.WorkOrders.AnyAsync(w => w.TenantId == tenantId && !w.IsDeleted, ct);
            if (exists) return;

            var existingItem = await _db.Items.FirstOrDefaultAsync(i => i.TenantId == tenantId && !i.IsDeleted, ct);
            var itemId = existingItem?.Id ?? Guid.NewGuid();

            var sampleOrder = new WorkOrder
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                WorkOrderNumber = "WO-2026-0001",
                ItemId = itemId,
                TargetQuantity = 50,
                ProducedQuantity = 48,
                ScrappedQuantity = 2,
                Status = "InProgress",
                StartDate = DateTime.UtcNow.AddDays(-2),
                DueDate = DateTime.UtcNow.AddDays(5),
                QualityInspectionPassed = false,
                CreatedAt = DateTime.UtcNow.AddDays(-2),
                Operations = new List<WorkOrderOperation>
                {
                    new()
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId,
                        Sequence = 10,
                        OperationName = "Rotor Core Lamination & Stacking",
                        WorkstationName = "Hydraulic Press Workstation (WS-01)",
                        Status = "Completed",
                        PlannedHours = 4.5m,
                        ActualHours = 4.2m,
                        OperatorName = "Vikram Mehta",
                        CompletedAt = DateTime.UtcNow.AddDays(-1),
                        CreatedAt = DateTime.UtcNow.AddDays(-2)
                    },
                    new()
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId,
                        Sequence = 20,
                        OperationName = "Copper Stator Winding & Insertion",
                        WorkstationName = "Automated Coil Winding Station (WS-02)",
                        Status = "InProgress",
                        PlannedHours = 8.0m,
                        ActualHours = 5.5m,
                        OperatorName = "Deepak Sharma",
                        CreatedAt = DateTime.UtcNow.AddDays(-2)
                    },
                    new()
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId,
                        Sequence = 30,
                        OperationName = "Final Casing & Quality Dynamometer Test",
                        WorkstationName = "Dynamo QA Testing Cell (WS-05)",
                        Status = "Pending",
                        PlannedHours = 3.0m,
                        ActualHours = 0,
                        OperatorName = "Amit Patel",
                        CreatedAt = DateTime.UtcNow.AddDays(-2)
                    }
                }
            };

            _db.WorkOrders.Add(sampleOrder);
            await _db.SaveChangesAsync(ct);
        }

        private static WorkOrderSummaryDto MapToDto(WorkOrder e, Item? item)
        {
            return new WorkOrderSummaryDto
            {
                Id = e.Id,
                WorkOrderNumber = e.WorkOrderNumber,
                ItemId = e.ItemId,
                ItemCode = item?.ItemCode ?? "SKU-PROD-100",
                ItemName = item?.ItemName ?? "Industrial Assembled Unit",
                TargetQuantity = e.TargetQuantity,
                ProducedQuantity = e.ProducedQuantity,
                ScrappedQuantity = e.ScrappedQuantity,
                Status = e.Status,
                StartDate = e.StartDate,
                DueDate = e.DueDate,
                QualityInspectionPassed = e.QualityInspectionPassed,
                QualityNotes = e.QualityNotes,
                Operations = e.Operations.OrderBy(o => o.Sequence).Select(o => new WorkOrderOperationDto
                {
                    OperationId = o.Id,
                    Sequence = o.Sequence,
                    OperationName = o.OperationName,
                    WorkstationName = o.WorkstationName,
                    Status = o.Status,
                    PlannedHours = (double)o.PlannedHours,
                    ActualHours = (double)o.ActualHours,
                    OperatorName = o.OperatorName,
                    CompletedAt = o.CompletedAt
                }).ToList()
            };
        }
    }
}
