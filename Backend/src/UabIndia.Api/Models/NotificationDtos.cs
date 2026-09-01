using System;
using System.ComponentModel.DataAnnotations;

namespace UabIndia.Api.Models
{
    public class NotificationDto
    {
        public Guid Id { get; set; }
        public Guid RecipientUserId { get; set; }
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public string Channel { get; set; } = "InApp";
        public string Type { get; set; } = "General";
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending";
        public bool IsRead { get; set; }
        public DateTime? SentAt { get; set; }
        public DateTime? ReadAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? MetadataJson { get; set; }
    }

    public class CreateNotificationDto
    {
        [Required]
        public Guid RecipientUserId { get; set; }

        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }

        [Required]
        public string Channel { get; set; } = "InApp";

        [Required]
        public string Type { get; set; } = "General";

        [Required]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Message { get; set; } = string.Empty;

        public string? MetadataJson { get; set; }
    }
}
