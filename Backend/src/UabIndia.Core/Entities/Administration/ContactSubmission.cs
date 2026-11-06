using System;

namespace UabIndia.Core.Entities
{
    public class ContactSubmission : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string? CompanyName { get; set; }
        public string? Subject { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? Source { get; set; }
        public bool IsResolved { get; set; }
    }
}
