using System;
using System.ComponentModel.DataAnnotations;

namespace UabIndia.Api.Models
{
    public class HelpdeskTicketDto
    {
        public Guid Id { get; set; }
        public string TicketNumber { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Requester { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public string AssignedTo { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? SlaDueAt { get; set; }
    }

    public class CreateHelpdeskTicketDto
    {
        [Required]
        [StringLength(200, MinimumLength = 3)]
        public string Subject { get; set; } = string.Empty;

        [Required]
        [StringLength(4000, MinimumLength = 5)]
        public string Description { get; set; } = string.Empty;

        [StringLength(100)]
        public string Category { get; set; } = "General";

        [StringLength(32)]
        public string Priority { get; set; } = "Low";

        public Guid? AssignedToUserId { get; set; }
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public DateTime? SlaDueAt { get; set; }
    }

    public class UpdateHelpdeskTicketDto
    {
        [StringLength(200, MinimumLength = 3)]
        public string? Subject { get; set; }

        [StringLength(4000, MinimumLength = 5)]
        public string? Description { get; set; }

        [StringLength(100)]
        public string? Category { get; set; }

        [StringLength(32)]
        public string? Priority { get; set; }

        [StringLength(32)]
        public string? Status { get; set; }

        public Guid? AssignedToUserId { get; set; }
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public DateTime? SlaDueAt { get; set; }
    }

    public class HelpdeskEscalationDto
    {
        public Guid Id { get; set; }
        public string TicketRef { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public string EscalatedTo { get; set; } = string.Empty;
        public DateTime EscalatedAt { get; set; }
        public bool SlaBreached { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public class CreateHelpdeskEscalationDto
    {
        [Required]
        public Guid TicketId { get; set; }

        [Required]
        [StringLength(1000, MinimumLength = 3)]
        public string Reason { get; set; } = string.Empty;

        public Guid? EscalatedToUserId { get; set; }
        public bool SlaBreached { get; set; }

        [StringLength(32)]
        public string Status { get; set; } = "Open";
    }

    public class HelpdeskFaqDto
    {
        public Guid Id { get; set; }
        public string Question { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int Views { get; set; }
        public int Helpful { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public class CreateHelpdeskFaqDto
    {
        [Required]
        [StringLength(300, MinimumLength = 5)]
        public string Question { get; set; } = string.Empty;

        [Required]
        [StringLength(6000, MinimumLength = 5)]
        public string Answer { get; set; } = string.Empty;

        [StringLength(100)]
        public string Category { get; set; } = "General";

        [StringLength(32)]
        public string Status { get; set; } = "Draft";

        public int DisplayOrder { get; set; }
    }

    public class UpdateHelpdeskFaqDto
    {
        [StringLength(300, MinimumLength = 5)]
        public string? Question { get; set; }

        [StringLength(6000, MinimumLength = 5)]
        public string? Answer { get; set; }

        [StringLength(100)]
        public string? Category { get; set; }

        [StringLength(32)]
        public string? Status { get; set; }

        public int? Views { get; set; }
        public int? Helpful { get; set; }
        public int? DisplayOrder { get; set; }
    }
}
