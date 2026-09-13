using System;

namespace UabIndia.Core.Entities
{
    public class LeavePolicyRule : BaseEntity
    {
        public Guid LeavePolicyId { get; set; }
        public string ApplicableGender { get; set; } = "All"; // Male, Female, Other, All
        public string EmploymentType { get; set; } = "All"; // Permanent, Contract, Intern, All
        public bool Encashable { get; set; }
        public bool CarryForwardAllowed { get; set; }
        public decimal? MaxCarryForward { get; set; }
    }
}