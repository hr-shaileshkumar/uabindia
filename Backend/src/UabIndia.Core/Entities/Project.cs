using System;

namespace UabIndia.Core.Entities
{
    public class Project : BaseEntity
    {
        public Guid CompanyId { get; set; }

        /// <summary>Short unique code, e.g. PROJ-001</summary>
        public string ProjectCode { get; set; } = string.Empty;

        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }

        /// <summary>Internal | External | R&amp;D | Maintenance | CapEx | OpEx</summary>
        public string ProjectType { get; set; } = "Internal";

        /// <summary>Low | Medium | High | Critical</summary>
        public string Priority { get; set; } = "Medium";

        /// <summary>Planned | Active | Completed | Hold | Cancelled</summary>
        public string Status { get; set; } = "Planned";

        public bool IsActive { get; set; } = true;

        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public DateTime? ActualStartDate { get; set; }
        public DateTime? ActualEndDate { get; set; }

        public decimal? Budget { get; set; }
        public decimal? ActualCost { get; set; }
        public string CurrencyCode { get; set; } = "INR";

        public string? ClientName { get; set; }
        public string? ContractNumber { get; set; }

        /// <summary>FixedPrice | TimeAndMaterial | Retainer | NonBillable</summary>
        public string? BillingType { get; set; }

        public int CompletionPercentage { get; set; } = 0;

        public Guid? ProjectManagerId { get; set; }
        public string? Location { get; set; }

        public Guid? UpdatedBy { get; set; }
    }
}
