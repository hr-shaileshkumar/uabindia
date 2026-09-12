using System;

namespace UabIndia.Core.Entities
{
    public class AttendancePolicy : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsDefault { get; set; } = false;
        public decimal StandardShiftHours { get; set; } = 8.0m;
        public decimal MinHalfDayHours { get; set; } = 4.0m;
        public int GracePeriodMinutes { get; set; } = 15;
        public decimal OvertimeThresholdHours { get; set; } = 8.0m;
        public decimal MaxContinuousHours { get; set; } = 16.0m;
        public int AutoDeductBreakMinutes { get; set; } = 60;
        public bool RequireGeofence { get; set; } = false;
        public int AllowedRadiusMeters { get; set; } = 250;
        public bool RequireFacialVerification { get; set; } = false;
        public int MinFacialConfidenceScore { get; set; } = 75;
        public bool AllowManualRegularization { get; set; } = true;
        public int MaxRegularizationsPerMonth { get; set; } = 3;
        public Guid? CompanyId { get; set; }
        public Guid? BranchId { get; set; }
        public Guid? ProjectId { get; set; }
        public string Status { get; set; } = "Active"; // Active, Draft, Archived
    }
}
