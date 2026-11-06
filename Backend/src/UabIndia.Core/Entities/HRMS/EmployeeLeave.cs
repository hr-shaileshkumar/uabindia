using System;

namespace UabIndia.Core.Entities
{
    public class EmployeeLeave : BaseEntity
    {
        public Guid EmployeeId { get; set; }
        public Guid LeavePolicyId { get; set; }
        public int Year { get; set; }
        public decimal Entitled { get; set; }
        public decimal Taken { get; set; }
        public decimal Balance { get; set; }
    }
}
