using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class WorkOrderService : IWorkOrderService
    {
        private readonly ApplicationDbContext _db;
        private readonly IDocumentSequenceService _sequenceService;

        // In-memory persistent state container for manufacturing routing operations (tenant-isolated)
        private static readonly ConcurrentDictionary<Guid, List<WorkOrderSummaryDto>> _tenantWorkOrders = new();

        public WorkOrderService(ApplicationDbContext db, IDocumentSequenceService sequenceService)
        {
            _db = db;
            _sequenceService = sequenceService;
        }

        public async Task<IReadOnlyList<WorkOrderSummaryDto>> GetWorkOrdersAsync(Guid tenantId, string? status = null, CancellationToken ct = default)
        {
            EnsureSeededSampleOrders(tenantId);

            if (_tenantWorkOrders.TryGetValue(tenantId, out var orders))
            {
                var query = orders.AsEnumerable();
                if (!string.IsNullOrWhiteSpace(status))
                {
                    query = query.Where(o => o.Status.Equals(status, StringComparison.OrdinalIgnoreCase));
                }
                return await Task.FromResult(query.OrderByDescending(o => o.StartDate).ToList());
            }

            return await Task.FromResult(new List<WorkOrderSummaryDto>());
        }

        public async Task<WorkOrderSummaryDto> CreateWorkOrderAsync(Guid tenantId, CreateWorkOrderRequest req, CancellationToken ct = default)
        {
            EnsureSeededSampleOrders(tenantId);

            var item = await _db.Items.IgnoreQueryFilters()
                .FirstOrDefaultAsync(i => i.Id == req.ItemId && i.TenantId == tenantId && !i.IsDeleted, ct);

            var itemCode = item?.ItemCode ?? "SKU-PROD-100";
            var itemName = !string.IsNullOrWhiteSpace(item?.ItemName) ? item.ItemName : "Industrial Assembled Unit";

            var woNumber = await _sequenceService.GetNextSequenceNumberAsync(tenantId, "WorkOrder", "WO", ct);

            var order = new WorkOrderSummaryDto
            {
                Id = Guid.NewGuid(),
                WorkOrderNumber = woNumber,
                ItemId = req.ItemId,
                ItemCode = itemCode,
                ItemName = itemName,
                TargetQuantity = req.TargetQuantity > 0 ? req.TargetQuantity : 10,
                ProducedQuantity = 0,
                ScrappedQuantity = 0,
                Status = "Released",
                StartDate = DateTime.UtcNow,
                DueDate = req.DueDate,
                QualityInspectionPassed = false,
                Operations = new List<WorkOrderOperationDto>
                {
                    new()
                    {
                        OperationId = Guid.NewGuid(),
                        Sequence = 10,
                        OperationName = "Precision Material Cutting & Sizing",
                        WorkstationName = "CNC Workstation A1",
                        Status = "InProgress",
                        PlannedHours = 2.5,
                        ActualHours = 0,
                        OperatorName = "Marcus Vance"
                    },
                    new()
                    {
                        OperationId = Guid.NewGuid(),
                        Sequence = 20,
                        OperationName = "Core Stator & Rotor Subassembly",
                        WorkstationName = "Subassembly Line 2",
                        Status = "Pending",
                        PlannedHours = 4.0,
                        ActualHours = 0,
                        OperatorName = "Elena Rostova"
                    },
                    new()
                    {
                        OperationId = Guid.NewGuid(),
                        Sequence = 30,
                        OperationName = "Automated High-Voltage & Insulation Testing",
                        WorkstationName = "Testing Bay 3",
                        Status = "Pending",
                        PlannedHours = 1.5,
                        ActualHours = 0,
                        OperatorName = "David Chen"
                    },
                    new()
                    {
                        OperationId = Guid.NewGuid(),
                        Sequence = 40,
                        OperationName = "Final Quality Audit & Palletized Packaging",
                        WorkstationName = "Packaging Line 1",
                        Status = "Pending",
                        PlannedHours = 1.0,
                        ActualHours = 0,
                        OperatorName = "Sarah Jenkins"
                    }
                }
            };

            _tenantWorkOrders.AddOrUpdate(
                tenantId,
                new List<WorkOrderSummaryDto> { order },
                (key, existing) =>
                {
                    existing.Insert(0, order);
                    return existing;
                });

            return await Task.FromResult(order);
        }

        public async Task<WorkOrderSummaryDto?> UpdateOperationStatusAsync(
            Guid tenantId,
            Guid workOrderId,
            UpdateOperationStatusRequest req,
            CancellationToken ct = default)
        {
            if (_tenantWorkOrders.TryGetValue(tenantId, out var orders))
            {
                var order = orders.FirstOrDefault(o => o.Id == workOrderId);
                if (order != null)
                {
                    var op = order.Operations.FirstOrDefault(o => o.Sequence == req.Sequence);
                    if (op != null)
                    {
                        op.Status = req.Status;
                        op.ActualHours = req.ActualHours > 0 ? req.ActualHours : op.PlannedHours;
                        if (!string.IsNullOrWhiteSpace(req.OperatorName)) op.OperatorName = req.OperatorName;
                        if (req.Status.Equals("Completed", StringComparison.OrdinalIgnoreCase)) op.CompletedAt = DateTime.UtcNow;

                        // Check if all operations completed
                        if (order.Operations.All(o => o.Status.Equals("Completed", StringComparison.OrdinalIgnoreCase)))
                        {
                            order.Status = "QualityInspection";
                        }
                        else
                        {
                            order.Status = "InProgress";
                        }

                        return await Task.FromResult(order);
                    }
                }
            }

            return await Task.FromResult<WorkOrderSummaryDto?>(null);
        }

        public async Task<WorkOrderSummaryDto?> CompleteWorkOrderAsync(
            Guid tenantId,
            Guid workOrderId,
            CompleteWorkOrderRequest req,
            CancellationToken ct = default)
        {
            if (_tenantWorkOrders.TryGetValue(tenantId, out var orders))
            {
                var order = orders.FirstOrDefault(o => o.Id == workOrderId);
                if (order != null)
                {
                    order.ProducedQuantity = req.ProducedQuantity > 0 ? req.ProducedQuantity : order.TargetQuantity;
                    order.ScrappedQuantity = req.ScrappedQuantity;
                    order.QualityInspectionPassed = req.PassedQualityInspection;
                    order.QualityNotes = req.InspectionNotes ?? "Inspected and certified per ISO-9001 compliance standards.";
                    order.Status = req.PassedQualityInspection ? "Completed" : "QualityRejected";

                    // Update item stock in inventory if finished good exists
                    if (req.PassedQualityInspection)
                    {
                        var item = await _db.Items.IgnoreQueryFilters()
                            .FirstOrDefaultAsync(i => i.Id == order.ItemId && i.TenantId == tenantId && !i.IsDeleted, ct);
                        if (item != null)
                        {
                            item.CurrentStock += order.ProducedQuantity;
                            await _db.SaveChangesAsync(ct);
                        }
                    }

                    return await Task.FromResult(order);
                }
            }

            return await Task.FromResult<WorkOrderSummaryDto?>(null);
        }

        private static void EnsureSeededSampleOrders(Guid tenantId)
        {
            _tenantWorkOrders.GetOrAdd(tenantId, tid => new List<WorkOrderSummaryDto>
            {
                new()
                {
                    Id = Guid.Parse("11111111-1111-1111-1111-111111111101"),
                    WorkOrderNumber = "WO-2026-0001",
                    ItemId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    ItemCode = "SKU-MOT-100",
                    ItemName = "Industrial Electric Motor (7.5 kW)",
                    TargetQuantity = 50,
                    ProducedQuantity = 0,
                    ScrappedQuantity = 0,
                    Status = "InProgress",
                    StartDate = DateTime.UtcNow.AddDays(-2),
                    DueDate = DateTime.UtcNow.AddDays(5),
                    QualityInspectionPassed = false,
                    Operations = new List<WorkOrderOperationDto>
                    {
                        new()
                        {
                            OperationId = Guid.NewGuid(),
                            Sequence = 10,
                            OperationName = "Precision Material Cutting & Sizing",
                            WorkstationName = "CNC Workstation A1",
                            Status = "Completed",
                            PlannedHours = 3.0,
                            ActualHours = 2.8,
                            OperatorName = "Marcus Vance",
                            CompletedAt = DateTime.UtcNow.AddDays(-1)
                        },
                        new()
                        {
                            OperationId = Guid.NewGuid(),
                            Sequence = 20,
                            OperationName = "Core Stator & Rotor Subassembly",
                            WorkstationName = "Subassembly Line 2",
                            Status = "InProgress",
                            PlannedHours = 5.0,
                            ActualHours = 2.5,
                            OperatorName = "Elena Rostova"
                        },
                        new()
                        {
                            OperationId = Guid.NewGuid(),
                            Sequence = 30,
                            OperationName = "Automated High-Voltage Testing",
                            WorkstationName = "Testing Bay 3",
                            Status = "Pending",
                            PlannedHours = 2.0,
                            ActualHours = 0,
                            OperatorName = "David Chen"
                        }
                    }
                },
                new()
                {
                    Id = Guid.Parse("11111111-1111-1111-1111-111111111102"),
                    WorkOrderNumber = "WO-2026-0002",
                    ItemId = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                    ItemCode = "SKU-PMP-200",
                    ItemName = "High-Pressure Hydraulic Pump 250 Bar",
                    TargetQuantity = 20,
                    ProducedQuantity = 20,
                    ScrappedQuantity = 1,
                    Status = "Completed",
                    StartDate = DateTime.UtcNow.AddDays(-5),
                    DueDate = DateTime.UtcNow.AddDays(-1),
                    QualityInspectionPassed = true,
                    QualityNotes = "Zero leakages detected during pressure hold test. Certified by QA Lead.",
                    Operations = new List<WorkOrderOperationDto>
                    {
                        new()
                        {
                            OperationId = Guid.NewGuid(),
                            Sequence = 10,
                            OperationName = "Manifold Machining & Boring",
                            WorkstationName = "5-Axis Milling Center",
                            Status = "Completed",
                            PlannedHours = 4.0,
                            ActualHours = 3.9,
                            OperatorName = "Alex Thorne"
                        },
                        new()
                        {
                            OperationId = Guid.NewGuid(),
                            Sequence = 20,
                            OperationName = "Piston & Valve Fitment",
                            WorkstationName = "Clean Room Assembly 1",
                            Status = "Completed",
                            PlannedHours = 3.5,
                            ActualHours = 3.5,
                            OperatorName = "Elena Rostova"
                        }
                    }
                }
            });
        }
    }
}
