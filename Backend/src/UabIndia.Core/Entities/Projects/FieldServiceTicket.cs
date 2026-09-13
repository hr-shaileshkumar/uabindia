using System;

namespace UabIndia.Core.Entities
{
    public class FieldServiceTicket : BaseEntity
    {
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
    }
}
