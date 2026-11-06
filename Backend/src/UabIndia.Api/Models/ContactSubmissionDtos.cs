using System;
using System.ComponentModel.DataAnnotations;

namespace UabIndia.Api.Models
{
    public class ContactSubmissionDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string? CompanyName { get; set; }
        public string? Subject { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? Source { get; set; }
        public bool IsResolved { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class UpdateContactSubmissionDto
    {
        [Required]
        public bool IsResolved { get; set; }
    }
}
