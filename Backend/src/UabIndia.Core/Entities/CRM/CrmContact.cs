using System;

namespace UabIndia.Core.Entities
{
    public class CrmContact : BaseEntity
    {
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? FullName { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? CompanyName { get; set; }
        public string? JobTitle { get; set; }
        public string Status { get; set; } = "Active";
        public string Source { get; set; } = "Website";
        public string? Notes { get; set; }
    }
}
