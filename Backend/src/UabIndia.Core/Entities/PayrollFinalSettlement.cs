using System;

namespace UabIndia.Core.Entities
{
    public class PayrollFinalSettlement : BaseEntity
    {
        public Guid EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public DateTime ExitDate { get; set; }
        public decimal Gratuity { get; set; }
        public decimal LeaveEncashment { get; set; }
        public decimal OtherDues { get; set; }
        public decimal Recoveries { get; set; }
        public decimal TotalSettlement { get; set; }
        public string Status { get; set; } = "Pending";
        public string? Remarks { get; set; }
        public DateTime? SettledAt { get; set; }
    }
}
