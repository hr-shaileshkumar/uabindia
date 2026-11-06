using System;

namespace UabIndia.Core.Entities
{
    public class TravelRequest : BaseEntity
    {
        public string RequestNumber { get; set; } = string.Empty;
        public Guid EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string Destination { get; set; } = string.Empty;
        public string Purpose { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal EstimatedAmount { get; set; }
        public string CurrencyCode { get; set; } = "INR";
        public string Status { get; set; } = "Draft";
    }

    public class AiAgent : BaseEntity
    {
        public string AgentKey { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Provider { get; set; } = "OpenAI";
        public string ModelName { get; set; } = string.Empty;
        public string Category { get; set; } = "General";
        public bool IsEnabled { get; set; }
    }
}
