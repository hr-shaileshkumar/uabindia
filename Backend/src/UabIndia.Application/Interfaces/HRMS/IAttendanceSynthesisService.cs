using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace UabIndia.Application.Interfaces
{
    public class PunchSessionDto
    {
        public string InTime { get; set; } = string.Empty;
        public string? OutTime { get; set; }
        public decimal DurationHours { get; set; }
        public string? InSource { get; set; }
        public string? OutSource { get; set; }
        public string? MatchedLocationName { get; set; }
        public bool IsComplete => !string.IsNullOrEmpty(OutTime);
    }

    public class DailyAttendanceSynthesisResult
    {
        public DateTime Date { get; set; }
        public Guid EmployeeId { get; set; }
        public string? EmployeeName { get; set; }
        public string? EmployeeCode { get; set; }
        public string? DepartmentName { get; set; }
        public Guid? ShiftId { get; set; }
        public string? ShiftName { get; set; }
        public string PunchPolicyMode { get; set; } = "TwoPunchFirstInLastOut";
        public DateTime? FirstInTime { get; set; }
        public DateTime? LastOutTime { get; set; }
        public int TotalPunches { get; set; }
        public decimal GrossDurationHours { get; set; }
        public decimal BreakDurationHours { get; set; }
        public decimal NetEffectiveWorkHours { get; set; }
        public string Status { get; set; } = "Absent"; // Present, HalfDay, Absent, Late, EarlyExit, MissingPunch, HolidayPresent, WeekOffPresent, OnLeave
        public int LateMinutes { get; set; }
        public int EarlyExitMinutes { get; set; }
        public decimal OvertimeHours { get; set; }
        public decimal ShortfallHours { get; set; }
        public decimal DayDeductionEquivalent { get; set; }
        public string? PenaltyRuleApplied { get; set; }
        public decimal OtRateMultiplier { get; set; } = 1.0m;
        public bool IsRegularized { get; set; }
        public string? RegularizationReason { get; set; }
        public List<PunchSessionDto> PunchSessions { get; set; } = new();
        public bool IsHoliday { get; set; }
        public string? HolidayName { get; set; }
        public bool IsWeekOff { get; set; }
        public string? Remarks { get; set; }
    }

    public interface IAttendanceSynthesisService
    {
        Task<DailyAttendanceSynthesisResult> SynthesizeDayAsync(
            Guid tenantId,
            Guid employeeId,
            DateTime date,
            CancellationToken ct = default);

        Task<List<DailyAttendanceSynthesisResult>> SynthesizeBatchAsync(
            Guid tenantId,
            DateTime startDate,
            DateTime endDate,
            Guid? employeeId = null,
            Guid? departmentId = null,
            CancellationToken ct = default);
    }
}
