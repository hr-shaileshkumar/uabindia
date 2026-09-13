using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace UabIndia.Application.Interfaces
{
    public class WorkOrderOperationDto
    {
        public Guid OperationId { get; set; }
        public int Sequence { get; set; }
        public string OperationName { get; set; } = string.Empty;
        public string WorkstationName { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending"; // Pending, InProgress, Completed
        public double PlannedHours { get; set; }
        public double ActualHours { get; set; }
        public string? OperatorName { get; set; }
        public DateTime? CompletedAt { get; set; }
    }

    public class WorkOrderSummaryDto
    {
        public Guid Id { get; set; }
        public string WorkOrderNumber { get; set; } = string.Empty;
        public Guid ItemId { get; set; }
        public string ItemCode { get; set; } = string.Empty;
        public string ItemName { get; set; } = string.Empty;
        public decimal TargetQuantity { get; set; }
        public decimal ProducedQuantity { get; set; }
        public decimal ScrappedQuantity { get; set; }
        public string Status { get; set; } = "Draft"; // Draft, Released, InProgress, QualityInspection, Completed, Cancelled
        public DateTime StartDate { get; set; } = DateTime.UtcNow;
        public DateTime DueDate { get; set; } = DateTime.UtcNow.AddDays(7);
        public bool QualityInspectionPassed { get; set; }
        public string? QualityNotes { get; set; }
        public List<WorkOrderOperationDto> Operations { get; set; } = new();
    }

    public class CreateWorkOrderRequest
    {
        public Guid ItemId { get; set; }
        public decimal TargetQuantity { get; set; }
        public DateTime DueDate { get; set; } = DateTime.UtcNow.AddDays(7);
        public string? Notes { get; set; }
    }

    public class UpdateOperationStatusRequest
    {
        public int Sequence { get; set; }
        public string Status { get; set; } = "Completed";
        public double ActualHours { get; set; }
        public string OperatorName { get; set; } = string.Empty;
    }

    public class CompleteWorkOrderRequest
    {
        public decimal ProducedQuantity { get; set; }
        public decimal ScrappedQuantity { get; set; }
        public bool PassedQualityInspection { get; set; } = true;
        public string? InspectionNotes { get; set; }
    }

    public interface IWorkOrderService
    {
        Task<IReadOnlyList<WorkOrderSummaryDto>> GetWorkOrdersAsync(Guid tenantId, string? status = null, CancellationToken ct = default);
        Task<WorkOrderSummaryDto> CreateWorkOrderAsync(Guid tenantId, CreateWorkOrderRequest req, CancellationToken ct = default);
        Task<WorkOrderSummaryDto?> UpdateOperationStatusAsync(Guid tenantId, Guid workOrderId, UpdateOperationStatusRequest req, CancellationToken ct = default);
        Task<WorkOrderSummaryDto?> CompleteWorkOrderAsync(Guid tenantId, Guid workOrderId, CompleteWorkOrderRequest req, CancellationToken ct = default);
    }
}
