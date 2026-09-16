using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class AttendanceSynthesisService : IAttendanceSynthesisService
    {
        private readonly ApplicationDbContext _db;

        public AttendanceSynthesisService(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<DailyAttendanceSynthesisResult> SynthesizeDayAsync(
            Guid tenantId,
            Guid employeeId,
            DateTime date,
            CancellationToken ct = default)
        {
            var dayStart = date.Date;
            var dayEnd = dayStart.AddDays(1).AddTicks(-1);

            var employee = await _db.Employees.AsNoTracking()
                .FirstOrDefaultAsync(e => e.Id == employeeId && e.TenantId == tenantId && !e.IsDeleted, ct);

            var employeeName = employee?.FullName ?? "Unknown Employee";
            var employeeCode = employee?.EmployeeCode;

            // 1. Resolve Department Name
            string? deptName = null;
            if (employee?.DepartmentId.HasValue == true)
            {
                deptName = await _db.Departments.AsNoTracking()
                    .Where(d => d.Id == employee.DepartmentId.Value)
                    .Select(d => d.Name)
                    .FirstOrDefaultAsync(ct);
            }

            // 2. Resolve Applicable Attendance Policy via Database Cascading Hierarchy
            // Priority: Employee Specific -> Project Policy -> Company Policy -> Country Policy -> Global Default Policy in DB
            AttendancePolicy? policy = null;
            if (employee?.AttendancePolicyId.HasValue == true)
            {
                policy = await _db.AttendancePolicies.AsNoTracking()
                    .FirstOrDefaultAsync(p => p.Id == employee.AttendancePolicyId.Value && p.TenantId == tenantId && !p.IsDeleted, ct);
            }
            if (policy == null && employee?.ProjectId.HasValue == true)
            {
                policy = await _db.AttendancePolicies.AsNoTracking()
                    .FirstOrDefaultAsync(p => p.ProjectId == employee.ProjectId.Value && p.TenantId == tenantId && !p.IsDeleted, ct);
            }
            if (policy == null && employee != null && employee.CompanyId != Guid.Empty)
            {
                policy = await _db.AttendancePolicies.AsNoTracking()
                    .FirstOrDefaultAsync(p => p.CompanyId == employee.CompanyId && p.TenantId == tenantId && !p.IsDeleted, ct);
            }
            if (policy == null)
            {
                policy = await _db.AttendancePolicies.AsNoTracking()
                    .Where(p => p.TenantId == tenantId && !p.IsDeleted)
                    .OrderByDescending(p => p.IsDefault)
                    .FirstOrDefaultAsync(ct);
            }

            // Fallback default policy if none configured in database yet
            policy ??= new AttendancePolicy
            {
                PunchMode = PunchPolicyMode.TwoPunchFirstInLastOut,
                StandardShiftHours = 8.0m,
                MinHalfDayHours = 4.0m,
                GracePeriodMinutes = 15,
                AutoDeductBreakMinutes = 60,
                MinPunchesRequiredPerDay = 2,
                DeductionBasis = DeductionBasis.MonthlyAccumulatedSlabs,
                MonthlyFreeLateDays = 3,
                LatePenaltyStepFrequency = 1,
                LatePenaltyAction = "HalfDay",
                MinorLateWindowMinutes = 15,
                MajorLateThresholdMinutes = 45,
                EarlyExitToleranceMinutes = 15,
                EarlyExitThresholdMinutes = 60,
                EarlyExitPenaltyAction = "HalfDay",
                NormalDayOtMultiplier = 1.5m,
                WeekendOtMultiplier = 2.0m,
                HolidayOtMultiplier = 2.5m,
                MissingPunchGraceDays = 3,
                MissingPunchPenalty = "HalfDay",
                WeekOffPattern = "SundayOnly"
            };

            // 3. Resolve Shift via Database Cascading Hierarchy
            // Priority: Rostered Assignment -> Employee Assigned Shift -> Policy Default Shift -> Database Default Shift
            Shift? shift = null;
            var shiftAssignment = await _db.Set<ShiftAssignment>().AsNoTracking()
                .Include(sa => sa.Shift)
                .Where(sa => sa.EmployeeId == employeeId && sa.TenantId == tenantId && !sa.IsDeleted &&
                             sa.EffectiveFrom.Date <= dayStart && (!sa.EffectiveTo.HasValue || sa.EffectiveTo.Value.Date >= dayStart))
                .OrderByDescending(sa => sa.EffectiveFrom)
                .FirstOrDefaultAsync(ct);

            if (shiftAssignment?.Shift != null)
            {
                shift = shiftAssignment.Shift;
            }
            else if (employee?.AssignedShiftId.HasValue == true)
            {
                shift = await _db.Set<Shift>().AsNoTracking()
                    .FirstOrDefaultAsync(s => s.Id == employee.AssignedShiftId.Value && s.TenantId == tenantId && !s.IsDeleted, ct);
            }
            else if (policy.DefaultShiftId.HasValue)
            {
                shift = await _db.Set<Shift>().AsNoTracking()
                    .FirstOrDefaultAsync(s => s.Id == policy.DefaultShiftId.Value && s.TenantId == tenantId && !s.IsDeleted, ct);
            }
            if (shift == null)
            {
                shift = await _db.Set<Shift>().AsNoTracking()
                    .Where(s => s.TenantId == tenantId && !s.IsDeleted)
                    .OrderByDescending(s => s.IsActive)
                    .FirstOrDefaultAsync(ct);
            }

            // Fallback general shift if none configured in database yet
            shift ??= new Shift
            {
                ShiftName = "Standard General Shift",
                StartTime = new TimeSpan(9, 0, 0),
                EndTime = new TimeSpan(18, 0, 0),
                DurationHours = 9.0m,
                GracePeriodMinutes = policy.GracePeriodMinutes,
                BreakDurationMinutes = policy.AutoDeductBreakMinutes
            };

            // 4. Check for Holiday from Database
            var holiday = await _db.Holidays.AsNoTracking()
                .FirstOrDefaultAsync(h => h.Date.Date == dayStart && h.TenantId == tenantId && !h.IsDeleted, ct);

            bool isHoliday = holiday != null;
            string? holidayName = holiday?.Name;

            // 5. Evaluate Scheduled Week-Off from Policy Pattern stored in Database
            bool isWeekOff = false;
            var weekOffPattern = policy.WeekOffPattern ?? "SundayOnly";
            if (weekOffPattern.Equals("AllSaturdaysSunday", StringComparison.OrdinalIgnoreCase))
            {
                isWeekOff = dayStart.DayOfWeek == DayOfWeek.Saturday || dayStart.DayOfWeek == DayOfWeek.Sunday;
            }
            else if (weekOffPattern.Equals("AlternateSaturdaySunday", StringComparison.OrdinalIgnoreCase))
            {
                if (dayStart.DayOfWeek == DayOfWeek.Sunday)
                {
                    isWeekOff = true;
                }
                else if (dayStart.DayOfWeek == DayOfWeek.Saturday)
                {
                    int saturdayOfMonth = ((dayStart.Day - 1) / 7) + 1;
                    isWeekOff = saturdayOfMonth == 2 || saturdayOfMonth == 4;
                }
            }
            else
            {
                isWeekOff = dayStart.DayOfWeek == DayOfWeek.Sunday;
            }

            // 6. Check for Approved Regularization Request in Database
            var approvedRegularization = await _db.AttendanceRegularizationRequests.AsNoTracking()
                .FirstOrDefaultAsync(r => r.EmployeeId == employeeId && r.TenantId == tenantId && !r.IsDeleted &&
                                          r.AttendanceDate.Date == dayStart && r.Status == "Approved", ct);

            // 7. Fetch Raw Punches for this date from Database
            var rawPunches = await _db.AttendanceRecords.AsNoTracking()
                .Where(r => r.EmployeeId == employeeId && r.TenantId == tenantId && !r.IsDeleted &&
                            r.Timestamp >= dayStart && r.Timestamp <= dayEnd)
                .OrderBy(r => r.Timestamp)
                .ToListAsync(ct);

            var result = new DailyAttendanceSynthesisResult
            {
                Date = dayStart,
                EmployeeId = employeeId,
                EmployeeName = employeeName,
                EmployeeCode = employeeCode,
                DepartmentName = deptName,
                ShiftId = shift.Id,
                ShiftName = shift.ShiftName,
                PunchPolicyMode = policy.PunchMode.ToString(),
                TotalPunches = rawPunches.Count,
                IsHoliday = isHoliday,
                HolidayName = holidayName,
                IsWeekOff = isWeekOff,
                OtRateMultiplier = 1.0m
            };

            // Handle On-Duty (OD) or Work-From-Home (WFH) Regularization
            if (approvedRegularization != null &&
                (approvedRegularization.RequestType == "OnDuty" || approvedRegularization.RequestType == "WorkFromHome"))
            {
                result.Status = "Present";
                result.GrossDurationHours = policy.StandardShiftHours;
                result.NetEffectiveWorkHours = policy.StandardShiftHours;
                result.IsRegularized = true;
                result.RegularizationReason = $"{approvedRegularization.RequestType}: {approvedRegularization.Reason}";
                result.Remarks = $"Approved {approvedRegularization.RequestType} Regularization: {approvedRegularization.Reason}";
                return result;
            }

            // Handle Missing Punch Regularization: augment punch records with manager-approved times
            if (approvedRegularization != null && approvedRegularization.RequestType == "MissingPunch")
            {
                result.IsRegularized = true;
                result.RegularizationReason = approvedRegularization.Reason;

                if (approvedRegularization.CorrectedInTime.HasValue && rawPunches.Count == 0)
                {
                    rawPunches.Add(new AttendanceRecord
                    {
                        EmployeeId = employeeId,
                        TenantId = tenantId,
                        Timestamp = dayStart.Add(approvedRegularization.CorrectedInTime.Value),
                        PunchType = "IN",
                        Source = "RegularizationApproved",
                        MatchedLocationName = "Approved Regularization"
                    });
                }
                if (approvedRegularization.CorrectedOutTime.HasValue && rawPunches.Count <= 1)
                {
                    rawPunches.Add(new AttendanceRecord
                    {
                        EmployeeId = employeeId,
                        TenantId = tenantId,
                        Timestamp = dayStart.Add(approvedRegularization.CorrectedOutTime.Value),
                        PunchType = "OUT",
                        Source = "RegularizationApproved",
                        MatchedLocationName = "Approved Regularization"
                    });
                }
                result.TotalPunches = rawPunches.Count;
            }

            // If No Punches Logged at all
            if (rawPunches.Count == 0)
            {
                if (isHoliday)
                {
                    result.Status = "Holiday";
                    result.Remarks = $"Public Holiday: {holidayName}";
                }
                else if (isWeekOff)
                {
                    result.Status = "WeekOff";
                    result.Remarks = "Scheduled Weekly Off";
                }
                else
                {
                    result.Status = "Absent";
                    result.DayDeductionEquivalent = 1.0m;
                    result.Remarks = "No punch recorded for scheduled shift";
                }
                return result;
            }

            result.FirstInTime = rawPunches.First().Timestamp;
            result.LastOutTime = rawPunches.Count > 1 ? rawPunches.Last().Timestamp : (DateTime?)null;

            // Late Arrival Evaluation (Database driven)
            var expectedStart = dayStart.Add(shift.StartTime);
            var graceDeadline = expectedStart.AddMinutes(shift.GracePeriodMinutes);
            if (result.FirstInTime.Value > graceDeadline)
            {
                result.LateMinutes = (int)Math.Round((result.FirstInTime.Value - expectedStart).TotalMinutes);
            }

            // Early Departure Evaluation (Database driven)
            if (result.LastOutTime.HasValue)
            {
                var expectedEnd = dayStart.Add(shift.EndTime);
                var earlyTolerance = expectedEnd.AddMinutes(-policy.EarlyExitToleranceMinutes);
                if (result.LastOutTime.Value < earlyTolerance)
                {
                    result.EarlyExitMinutes = (int)Math.Round((expectedEnd - result.LastOutTime.Value).TotalMinutes);
                }
            }

            // Process Work Session synthesis according to Policy Punch Mode
            switch (policy.PunchMode)
            {
                case PunchPolicyMode.TwoPunchFirstInLastOut:
                default:
                    ProcessTwoPunchMode(result, rawPunches, policy, shift);
                    break;

                case PunchPolicyMode.MultiPunchPairwise:
                    ProcessMultiPunchPairwise(result, rawPunches, policy, shift);
                    break;

                case PunchPolicyMode.SplitShiftFourPunch:
                    ProcessSplitShiftMode(result, rawPunches, policy, shift);
                    break;

                case PunchPolicyMode.ContinuousRoaming:
                    ProcessContinuousRoamingMode(result, rawPunches, policy, shift);
                    break;
            }

            // Special Shift Calculations (Flexi Core Hours, 24-Hour Emergency Shift)
            ApplyShiftSpecificRules(result, shift, policy);

            // Apply Late Deduction & Monthly Slab Matrices (Database driven)
            await ApplyLateAndEarlyPenaltiesAsync(result, policy, shift, dayStart, tenantId, employeeId, ct);

            // Shortfall Pay-As-You-Go vs Daily Offset with Overtime
            ApplyShortfallAndOvertime(result, policy, isHoliday, isWeekOff);

            // Status Override for Holiday / Week-Off punches
            if (isHoliday && result.NetEffectiveWorkHours > 0)
            {
                result.Status = "HolidayPresent";
                result.Remarks += $" [Holiday Worked: {holidayName}]";
            }
            else if (isWeekOff && result.NetEffectiveWorkHours > 0)
            {
                result.Status = "WeekOffPresent";
                result.Remarks += " [WeekOff Worked]";
            }

            return result;
        }

        public async Task<List<DailyAttendanceSynthesisResult>> SynthesizeBatchAsync(
            Guid tenantId,
            DateTime startDate,
            DateTime endDate,
            Guid? employeeId = null,
            Guid? departmentId = null,
            CancellationToken ct = default)
        {
            var query = _db.Employees.AsNoTracking()
                .Where(e => e.TenantId == tenantId && !e.IsDeleted && e.Status == "Active");

            if (employeeId.HasValue) query = query.Where(e => e.Id == employeeId.Value);
            if (departmentId.HasValue) query = query.Where(e => e.DepartmentId == departmentId.Value);

            var employees = await query.Select(e => e.Id).ToListAsync(ct);
            var results = new List<DailyAttendanceSynthesisResult>();

            for (var d = startDate.Date; d <= endDate.Date; d = d.AddDays(1))
            {
                foreach (var empId in employees)
                {
                    var dayRes = await SynthesizeDayAsync(tenantId, empId, d, ct);
                    results.Add(dayRes);
                }
            }

            return results;
        }

        // ─── Mode Handlers ────────────────────────────────────────────────────────

        private static void ProcessTwoPunchMode(
            DailyAttendanceSynthesisResult result,
            List<AttendanceRecord> punches,
            AttendancePolicy policy,
            Shift shift)
        {
            var firstIn = punches.First();
            var lastOut = punches.Count > 1 ? punches.Last() : null;

            if (lastOut == null)
            {
                // Single punch only - check grace window
                result.GrossDurationHours = 0;
                result.NetEffectiveWorkHours = 0;
                result.BreakDurationHours = 0;

                var daysSince = (DateTime.UtcNow.Date - result.Date).TotalDays;
                if (daysSince <= policy.MissingPunchGraceDays && !result.IsRegularized)
                {
                    result.Status = "MissingPunch";
                    result.Remarks = $"Missing OUT punch. Within {policy.MissingPunchGraceDays}-day regularization window.";
                }
                else
                {
                    result.Status = policy.MissingPunchPenalty switch
                    {
                        "HalfDay" => "HalfDay",
                        "Absent" => "Absent",
                        _ => "MissingPunch"
                    };
                    result.DayDeductionEquivalent = result.Status == "Absent" ? 1.0m : (result.Status == "HalfDay" ? 0.5m : 0.0m);
                    result.Remarks = $"Missing OUT punch. Grace window expired. Auto penalty applied: {result.Status}.";
                }

                result.PunchSessions.Add(new PunchSessionDto
                {
                    InTime = firstIn.Timestamp.ToString("HH:mm"),
                    InSource = firstIn.Source,
                    MatchedLocationName = firstIn.MatchedLocationName,
                    DurationHours = 0
                });
                return;
            }

            var totalSpan = (decimal)(lastOut.Timestamp - firstIn.Timestamp).TotalHours;
            result.GrossDurationHours = Math.Round(Math.Max(0, totalSpan), 2);

            var breakHours = totalSpan > 5.0m ? (decimal)policy.AutoDeductBreakMinutes / 60.0m : 0.0m;
            result.BreakDurationHours = Math.Round(breakHours, 2);
            result.NetEffectiveWorkHours = Math.Round(Math.Max(0, result.GrossDurationHours - result.BreakDurationHours), 2);

            result.PunchSessions.Add(new PunchSessionDto
            {
                InTime = firstIn.Timestamp.ToString("HH:mm"),
                OutTime = lastOut.Timestamp.ToString("HH:mm"),
                DurationHours = result.NetEffectiveWorkHours,
                InSource = firstIn.Source,
                OutSource = lastOut.Source,
                MatchedLocationName = firstIn.MatchedLocationName ?? lastOut.MatchedLocationName
            });

            AssignStandardStatus(result, policy);
        }

        private static void ProcessMultiPunchPairwise(
            DailyAttendanceSynthesisResult result,
            List<AttendanceRecord> punches,
            AttendancePolicy policy,
            Shift shift)
        {
            decimal totalWorkHours = 0;
            decimal totalBreakHours = 0;
            AttendanceRecord? currentIn = null;

            for (int i = 0; i < punches.Count; i++)
            {
                var punch = punches[i];
                var punchType = punch.PunchType.ToUpperInvariant();

                if (punchType == "IN" || punchType == "BREAK_IN" || currentIn == null)
                {
                    if (currentIn != null && i > 0)
                    {
                        var breakSpan = (decimal)(punch.Timestamp - punches[i - 1].Timestamp).TotalHours;
                        if (breakSpan > 0) totalBreakHours += breakSpan;
                    }
                    currentIn = punch;
                }
                else if (punchType == "OUT" || punchType == "BREAK_OUT" || (currentIn != null && i == punches.Count - 1))
                {
                    if (currentIn != null)
                    {
                        var workSpan = (decimal)(punch.Timestamp - currentIn.Timestamp).TotalHours;
                        var duration = Math.Round(Math.Max(0, workSpan), 2);
                        totalWorkHours += duration;

                        result.PunchSessions.Add(new PunchSessionDto
                        {
                            InTime = currentIn.Timestamp.ToString("HH:mm"),
                            OutTime = punch.Timestamp.ToString("HH:mm"),
                            DurationHours = duration,
                            InSource = currentIn.Source,
                            OutSource = punch.Source,
                            MatchedLocationName = currentIn.MatchedLocationName ?? punch.MatchedLocationName
                        });

                        currentIn = null;
                    }
                }
            }

            if (currentIn != null)
            {
                result.PunchSessions.Add(new PunchSessionDto
                {
                    InTime = currentIn.Timestamp.ToString("HH:mm"),
                    InSource = currentIn.Source,
                    MatchedLocationName = currentIn.MatchedLocationName,
                    DurationHours = 0
                });
            }

            result.NetEffectiveWorkHours = Math.Round(totalWorkHours, 2);
            result.BreakDurationHours = Math.Round(totalBreakHours, 2);
            result.GrossDurationHours = Math.Round(totalWorkHours + totalBreakHours, 2);

            if (currentIn != null)
            {
                result.Remarks = "Odd punches detected: open session without corresponding OUT punch.";
            }

            AssignStandardStatus(result, policy);
        }

        private static void ProcessSplitShiftMode(
            DailyAttendanceSynthesisResult result,
            List<AttendanceRecord> punches,
            AttendancePolicy policy,
            Shift shift)
        {
            if (punches.Count < 2)
            {
                result.Status = "MissingPunch";
                result.Remarks = "Split shift requires both morning & evening slot punches.";
                result.DayDeductionEquivalent = 0.5m;
                return;
            }

            decimal totalWork = 0;
            for (int i = 0; i < punches.Count - 1; i += 2)
            {
                var pIn = punches[i];
                var pOut = punches[i + 1];
                var span = (decimal)(pOut.Timestamp - pIn.Timestamp).TotalHours;
                var dur = Math.Round(Math.Max(0, span), 2);
                totalWork += dur;

                result.PunchSessions.Add(new PunchSessionDto
                {
                    InTime = pIn.Timestamp.ToString("HH:mm"),
                    OutTime = pOut.Timestamp.ToString("HH:mm"),
                    DurationHours = dur,
                    InSource = pIn.Source,
                    OutSource = pOut.Source,
                    MatchedLocationName = pIn.MatchedLocationName ?? pOut.MatchedLocationName
                });
            }

            result.NetEffectiveWorkHours = Math.Round(totalWork, 2);
            result.GrossDurationHours = result.NetEffectiveWorkHours;

            // Split shift: requires both slots for full day present
            if (result.PunchSessions.Count >= 2 && result.NetEffectiveWorkHours >= policy.StandardShiftHours)
            {
                result.Status = result.LateMinutes > 0 ? "Late" : "Present";
                result.Remarks = "Split shift completed with 2 full slots.";
            }
            else if (result.PunchSessions.Count >= 1)
            {
                result.Status = "HalfDay";
                result.DayDeductionEquivalent = 0.5m;
                result.Remarks = "Only 1 split shift slot attended.";
            }
            else
            {
                result.Status = "Absent";
                result.DayDeductionEquivalent = 1.0m;
            }
        }

        private static void ProcessContinuousRoamingMode(
            DailyAttendanceSynthesisResult result,
            List<AttendanceRecord> punches,
            AttendancePolicy policy,
            Shift shift)
        {
            var firstIn = punches.First();
            var lastOut = punches.Last();
            var totalSpan = (decimal)(lastOut.Timestamp - firstIn.Timestamp).TotalHours;

            result.GrossDurationHours = Math.Round(Math.Max(0, totalSpan), 2);
            result.NetEffectiveWorkHours = result.GrossDurationHours;

            foreach (var p in punches)
            {
                result.PunchSessions.Add(new PunchSessionDto
                {
                    InTime = p.Timestamp.ToString("HH:mm"),
                    InSource = p.Source,
                    MatchedLocationName = p.MatchedLocationName ?? "Field Checkpoint",
                    DurationHours = 0
                });
            }

            if (punches.Count >= 4 && result.NetEffectiveWorkHours >= policy.StandardShiftHours)
            {
                result.Status = "Present";
                result.Remarks = $"Field roaming: {punches.Count} active checkpoints visited.";
            }
            else if (punches.Count >= 2)
            {
                result.Status = "HalfDay";
                result.DayDeductionEquivalent = 0.5m;
                result.Remarks = $"Field roaming: only {punches.Count} checkpoints visited (min 4 required for full day).";
            }
            else
            {
                result.Status = "Absent";
                result.DayDeductionEquivalent = 1.0m;
                result.Remarks = "Insufficient checkpoints visited.";
            }
        }

        // ─── Shift-Specific Calculations (Flexi Core, 24-Hour Emergency) ───────────

        private static void ApplyShiftSpecificRules(DailyAttendanceSynthesisResult result, Shift shift, AttendancePolicy policy)
        {
            // 1. Flexi Core Window Shift
            if (shift.IsFlexiShift || shift.ShiftType == ShiftType.Flexible)
            {
                if (shift.CoreStartTime.HasValue && shift.CoreEndTime.HasValue && result.FirstInTime.HasValue && result.LastOutTime.HasValue)
                {
                    var coreStart = result.Date.Add(shift.CoreStartTime.Value);
                    var coreEnd = result.Date.Add(shift.CoreEndTime.Value);

                    bool missedCoreStart = result.FirstInTime.Value > coreStart.AddMinutes(shift.GracePeriodMinutes);
                    bool missedCoreEnd = result.LastOutTime.Value < coreEnd.AddMinutes(-policy.EarlyExitToleranceMinutes);

                    if (missedCoreStart || missedCoreEnd)
                    {
                        result.Remarks += $" [Core Hours ({shift.CoreStartTime.Value:hh\\:mm} - {shift.CoreEndTime.Value:hh\\:mm}) breached]";
                        if (result.NetEffectiveWorkHours < policy.StandardShiftHours)
                        {
                            result.Status = "HalfDay";
                            result.DayDeductionEquivalent = Math.Max(result.DayDeductionEquivalent, 0.5m);
                        }
                    }
                }
            }

            // 2. 24-Hour Emergency Shift
            if (shift.Is24HourShift || shift.ShiftType == ShiftType.Extended24Hour)
            {
                result.Remarks += $" [24h Emergency Shift. Mandatory rest: {shift.MandatoryRestHoursAfterShift}h post-shift]";
                if (result.NetEffectiveWorkHours >= 20.0m)
                {
                    result.Status = "Present";
                }
                else if (result.NetEffectiveWorkHours >= 10.0m)
                {
                    result.Status = "HalfDay";
                    result.DayDeductionEquivalent = 0.5m;
                }
                else
                {
                    result.Status = "Absent";
                    result.DayDeductionEquivalent = 1.0m;
                }
            }
        }

        // ─── Late Arrival & Early Exit Penalty Matrices (Database Driven) ─────────

        private async Task ApplyLateAndEarlyPenaltiesAsync(
            DailyAttendanceSynthesisResult result,
            AttendancePolicy policy,
            Shift shift,
            DateTime dayStart,
            Guid tenantId,
            Guid employeeId,
            CancellationToken ct)
        {
            // 1. Major Late Cutoff Check (>45m or >120m)
            if (result.LateMinutes > policy.MajorLateThresholdMinutes && policy.MajorLateThresholdMinutes > 0)
            {
                if (result.LateMinutes > 120)
                {
                    result.Status = "Absent";
                    result.DayDeductionEquivalent = Math.Max(result.DayDeductionEquivalent, 1.0m);
                    result.Remarks += $" [Major Late >120m: marked Absent]";
                }
                else
                {
                    result.Status = "HalfDay";
                    result.DayDeductionEquivalent = Math.Max(result.DayDeductionEquivalent, 0.5m);
                    result.Remarks += $" [Major Late ({result.LateMinutes}m > {policy.MajorLateThresholdMinutes}m threshold): marked HalfDay]";
                }
            }

            // 2. Monthly Late Accumulation & Step Penalties
            if (result.LateMinutes > 0 && policy.DeductionBasis != DeductionBasis.HourlyPayAsYouGo)
            {
                var monthStart = new DateTime(dayStart.Year, dayStart.Month, 1);
                var prevLatesCount = await _db.AttendanceRecords.AsNoTracking()
                    .Where(r => r.EmployeeId == employeeId && r.TenantId == tenantId && !r.IsDeleted &&
                                r.Timestamp >= monthStart && r.Timestamp < dayStart)
                    .GroupBy(r => r.Timestamp.Date)
                    .Where(g => g.Min(r => r.Timestamp).TimeOfDay > shift.StartTime.Add(TimeSpan.FromMinutes(shift.GracePeriodMinutes)))
                    .CountAsync(ct);

                int currentLateNumber = prevLatesCount + 1;

                if (currentLateNumber <= policy.MonthlyFreeLateDays)
                {
                    result.Remarks += $" [Late #{currentLateNumber}/{policy.MonthlyFreeLateDays} (Grace Free)]";
                }
                else
                {
                    int excessLates = currentLateNumber - policy.MonthlyFreeLateDays;
                    int step = policy.LatePenaltyStepFrequency > 0 ? policy.LatePenaltyStepFrequency : 1;

                    if (excessLates % step == 0 || excessLates == 1)
                    {
                        decimal deductionAmount = policy.LatePenaltyAction switch
                        {
                            "FullDay" => 1.0m,
                            "QuarterDay" => 0.25m,
                            _ => 0.5m
                        };
                        result.DayDeductionEquivalent = Math.Max(result.DayDeductionEquivalent, deductionAmount);
                        result.PenaltyRuleApplied = $"Monthly Late #{currentLateNumber} (exceeded {policy.MonthlyFreeLateDays} free grace days). Applied {deductionAmount} day deduction.";
                        result.Remarks += $" [{result.PenaltyRuleApplied}]";
                    }
                }
            }

            // 3. Early Exit Tolerance & Deduction
            if (result.EarlyExitMinutes >= policy.EarlyExitThresholdMinutes && policy.EarlyExitThresholdMinutes > 0)
            {
                decimal earlyCut = policy.EarlyExitPenaltyAction switch
                {
                    "FullDay" => 1.0m,
                    "QuarterDay" => 0.25m,
                    _ => 0.5m
                };
                result.DayDeductionEquivalent = Math.Max(result.DayDeductionEquivalent, earlyCut);
                result.Remarks += $" [Early Exit Penalty: {result.EarlyExitMinutes}m early. Cut: {earlyCut} day]";
            }
        }

        // ─── Shortfall (Pay-as-you-go) and Overtime Multipliers ───────────────────

        private static void ApplyShortfallAndOvertime(
            DailyAttendanceSynthesisResult result,
            AttendancePolicy policy,
            bool isHoliday,
            bool isWeekOff)
        {
            // 1. Shortfall Calculation
            if (policy.DeductionBasis == DeductionBasis.HourlyPayAsYouGo || policy.DeductionBasis == DeductionBasis.HybridBoth)
            {
                if (result.NetEffectiveWorkHours < policy.StandardShiftHours && result.NetEffectiveWorkHours > 0)
                {
                    result.ShortfallHours = Math.Round(policy.StandardShiftHours - result.NetEffectiveWorkHours, 2);
                    result.Remarks += $" [Shortfall: {result.ShortfallHours}h]";
                }
            }

            // 2. Overtime Multipliers (Database driven)
            if (result.NetEffectiveWorkHours > policy.OvertimeThresholdHours)
            {
                decimal rawOt = result.NetEffectiveWorkHours - policy.OvertimeThresholdHours;
                int otMinutes = (int)(rawOt * 60);

                if (otMinutes >= policy.MinMinutesForOvertime)
                {
                    decimal multiplier = isHoliday
                        ? policy.HolidayOtMultiplier
                        : (isWeekOff ? policy.WeekendOtMultiplier : policy.NormalDayOtMultiplier);

                    result.OvertimeHours = Math.Round(rawOt, 2);
                    result.OtRateMultiplier = multiplier;
                    result.Remarks += $" [OT: {result.OvertimeHours}h @ {multiplier}x multiplier]";

                    // Daily Shortfall Offset with OT
                    if (policy.AllowDailyShortfallOffsetWithOt && result.ShortfallHours > 0)
                    {
                        decimal offset = Math.Min(result.ShortfallHours, result.OvertimeHours);
                        result.ShortfallHours = Math.Round(result.ShortfallHours - offset, 2);
                        result.Remarks += $" [OT Offset {offset}h shortfall]";
                    }
                }
            }
        }

        private static void AssignStandardStatus(DailyAttendanceSynthesisResult result, AttendancePolicy policy)
        {
            if (result.NetEffectiveWorkHours >= policy.StandardShiftHours)
            {
                result.Status = result.LateMinutes > 0 ? "Late" : (result.EarlyExitMinutes > 0 ? "EarlyExit" : "Present");
            }
            else if (result.NetEffectiveWorkHours >= policy.MinHalfDayHours)
            {
                result.Status = "HalfDay";
                result.DayDeductionEquivalent = Math.Max(result.DayDeductionEquivalent, 0.5m);
                result.Remarks = $"Attended {result.NetEffectiveWorkHours}h (minimum full-day is {policy.StandardShiftHours}h).";
            }
            else
            {
                result.Status = "Absent";
                result.DayDeductionEquivalent = 1.0m;
                result.Remarks = $"Worked {result.NetEffectiveWorkHours}h, below half-day threshold ({policy.MinHalfDayHours}h).";
            }
        }
    }
}
