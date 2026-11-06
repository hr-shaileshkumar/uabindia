using System;

namespace UabIndia.Core.Entities
{
    public class TravelExpensePolicy : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsDefault { get; set; } = false;
        public decimal MaxDailyLodgingAllowance { get; set; } = 3500.0m;
        public decimal MaxDailyMealsAllowance { get; set; } = 800.0m;
        public decimal MileageRatePerKmCar { get; set; } = 12.0m;
        public decimal MileageRatePerKmBike { get; set; } = 6.0m;
        public bool RequiresAdvanceApproval { get; set; } = true;
        public decimal ApprovalThresholdAmount { get; set; } = 5000.0m;
        public decimal MaxAdvancePercentage { get; set; } = 80.0m;
        public decimal ReceiptRequiredAboveAmount { get; set; } = 200.0m;
        public int ExpenseSubmissionWindowDays { get; set; } = 15;
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public string Status { get; set; } = "Active"; // Active, Draft, Archived
    }
}
