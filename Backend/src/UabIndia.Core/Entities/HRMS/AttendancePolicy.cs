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
        public Guid? CountryId { get; set; }
        public string Status { get; set; } = "Active"; // Active, Draft, Archived

        // Multi-Punch & Shift Enforcement Rules
        public PunchPolicyMode PunchMode { get; set; } = PunchPolicyMode.TwoPunchFirstInLastOut;
        public int MinPunchesRequiredPerDay { get; set; } = 2;
        public int? MaxPunchesAllowedPerDay { get; set; }
        public int EarlyExitToleranceMinutes { get; set; } = 15;
        public string MissingPunchPenalty { get; set; } = "FlagForRegularization"; // "HalfDay", "Absent", "FlagForRegularization"
        public int MissingPunchGraceDays { get; set; } = 3;
        public Guid? DefaultShiftId { get; set; }

        // Deduction Basis & Mathematical Penalty Models
        public DeductionBasis DeductionBasis { get; set; } = DeductionBasis.MonthlyAccumulatedSlabs;
        public bool AllowDailyShortfallOffsetWithOt { get; set; } = false;

        // Progressive Late Coming Slabs
        public int MonthlyFreeLateDays { get; set; } = 3;
        public int LatePenaltyStepFrequency { get; set; } = 3;
        public string LatePenaltyAction { get; set; } = "HalfDayLop"; // "HalfDayLop", "CasualLeaveDeduction", "FullDayLop"
        public int MinorLateWindowMinutes { get; set; } = 45;
        public int MajorLateThresholdMinutes { get; set; } = 120;

        // Early Exit Thresholds & Actions
        public int EarlyExitThresholdMinutes { get; set; } = 60;
        public string EarlyExitPenaltyAction { get; set; } = "HalfDay"; // "HalfDay", "Absent", "Warning"

        // Overtime (OT) Multipliers & Comp-Off Banking
        public int MinMinutesForOvertime { get; set; } = 60;
        public bool RequireOvertimeApproval { get; set; } = false;
        public decimal NormalDayOtMultiplier { get; set; } = 1.5m;
        public decimal WeekendOtMultiplier { get; set; } = 2.0m;
        public decimal HolidayOtMultiplier { get; set; } = 2.5m;
        public bool AllowCompOffInsteadOfPay { get; set; } = true;

        // Weekly-Off Pattern
        public string WeekOffPattern { get; set; } = "SaturdaySunday"; // "AllSundays", "SaturdaySunday", "SecondFourthSaturday", "FirstThirdSaturday", "FridaySaturday", "Rotational"
    }

    public enum DeductionBasis
    {
        HourlyPayAsYouGo = 1,
        MonthlyAccumulatedSlabs = 2,
        HybridBoth = 3
    }

    public enum PunchPolicyMode
    {
        TwoPunchFirstInLastOut = 1,   // Standard corporate: First IN, Last OUT
        MultiPunchPairwise = 2,       // Precise break & work intervals: IN1-OUT1, IN2-OUT2
        SplitShiftFourPunch = 3,      // Split duty: 4 punches (Slot 1 IN/OUT + Slot 2 IN/OUT)
        ContinuousRoaming = 4         // Uncapped check-in events (Field visits, MVU patrol)
    }
}
