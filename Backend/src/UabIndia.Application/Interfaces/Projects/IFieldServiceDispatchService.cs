using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace UabIndia.Application.Interfaces
{
    public class ServicePartLineDto
    {
        public Guid ItemId { get; set; }
        public string ItemCode { get; set; } = string.Empty;
        public string ItemName { get; set; } = string.Empty;
        public decimal QuantityUsed { get; set; }
        public decimal UnitCost { get; set; }
        public decimal TotalCost { get; set; }
    }

    public class ServiceTicketDto
    {
        public Guid Id { get; set; }
        public string TicketNumber { get; set; } = string.Empty;
        public Guid? CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string ServiceAddress { get; set; } = string.Empty;
        public string Priority { get; set; } = "High"; // Critical, High, Medium, Low
        public string Status { get; set; } = "Dispatched"; // Dispatched, EnRoute, InProgress, CustomerSigned, Completed
        public DateTime ScheduledDate { get; set; } = DateTime.UtcNow.AddDays(1);
        public string AssignedTechnicianName { get; set; } = string.Empty;
        public string AssignedTechnicianPhone { get; set; } = string.Empty;
        public string IssueDescription { get; set; } = string.Empty;
        public string? ResolutionNotes { get; set; }
        public string? CustomerSignatureName { get; set; }
        public DateTime? CompletedAt { get; set; }
        public List<ServicePartLineDto> PartsUsed { get; set; } = new();
    }

    public class DispatchTechnicianRequest
    {
        public Guid TicketId { get; set; }
        public string TechnicianName { get; set; } = string.Empty;
        public string TechnicianPhone { get; set; } = string.Empty;
        public DateTime ScheduledDate { get; set; } = DateTime.UtcNow.AddDays(1);
    }

    public class CompleteServiceTicketRequest
    {
        public Guid TicketId { get; set; }
        public string ResolutionNotes { get; set; } = string.Empty;
        public string CustomerSignatureName { get; set; } = string.Empty;
        public List<ServicePartLineDto> PartsUsed { get; set; } = new();
    }

    public interface IFieldServiceDispatchService
    {
        Task<IReadOnlyList<ServiceTicketDto>> GetServiceTicketsAsync(
            Guid tenantId,
            string? status = null,
            CancellationToken ct = default);

        Task<ServiceTicketDto> CreateServiceTicketAsync(
            Guid tenantId,
            ServiceTicketDto dto,
            CancellationToken ct = default);

        Task<ServiceTicketDto?> DispatchTechnicianAsync(
            Guid tenantId,
            DispatchTechnicianRequest req,
            CancellationToken ct = default);

        Task<ServiceTicketDto?> CompleteServiceTicketAsync(
            Guid tenantId,
            CompleteServiceTicketRequest req,
            CancellationToken ct = default);
    }
}
