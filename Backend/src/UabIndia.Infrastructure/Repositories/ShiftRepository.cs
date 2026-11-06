using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Repositories
{
    public class ShiftRepository : IShiftRepository
    {
        private readonly ApplicationDbContext _context;

        public ShiftRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        #region Shift Operations

        public async Task<Shift?> GetShiftByIdAsync(Guid id, Guid tenantId)
        {
            return await _context.Shifts
                .Include(s => s.ShiftAssignments)
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == id && s.TenantId == tenantId && !s.IsDeleted);
        }

        public async Task<IEnumerable<Shift>> GetAllShiftsAsync(Guid tenantId, int skip = 0, int take = 20)
        {
            return await _context.Shifts
                .AsNoTracking()
                .Where(s => s.TenantId == tenantId && !s.IsDeleted)
                .OrderBy(s => s.ShiftName)
                .Skip(skip)
                .Take(Math.Clamp(take, 1, 100))
                .ToListAsync();
        }

        public async Task<IEnumerable<Shift>> GetActiveShiftsAsync(Guid tenantId)
        {
            return await _context.Shifts
                .AsNoTracking()
                .Where(s => s.TenantId == tenantId && !s.IsDeleted && s.IsActive)
                .OrderBy(s => s.StartTime)
                .ToListAsync();
        }

        public async Task<IEnumerable<Shift>> GetShiftsByTypeAsync(ShiftType shiftType, Guid tenantId)
        {
            return await _context.Shifts
                .AsNoTracking()
                .Where(s => s.TenantId == tenantId && !s.IsDeleted && s.ShiftType == shiftType)
                .OrderBy(s => s.ShiftName)
                .ToListAsync();
        }

        public async Task<IEnumerable<Shift>> GetShiftsByDepartmentAsync(Guid? departmentId, Guid tenantId)
        {
            return await _context.Shifts
                .AsNoTracking()
                .Where(s => s.TenantId == tenantId && !s.IsDeleted && s.DepartmentId == departmentId)
                .OrderBy(s => s.ShiftName)
                .ToListAsync();
        }

        public async Task<Shift?> GetShiftByCodeAsync(string shiftCode, Guid tenantId)
        {
            return await _context.Shifts
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.ShiftCode == shiftCode && s.TenantId == tenantId && !s.IsDeleted);
        }

        public async Task<Shift> CreateShiftAsync(Shift shift)
        {
            _context.Shifts.Add(shift);
            await _context.SaveChangesAsync();
            return shift;
        }

        public async Task<Shift> UpdateShiftAsync(Shift shift)
        {
            _context.Shifts.Update(shift);
            await _context.SaveChangesAsync();
            return shift;
        }

        public async Task DeleteShiftAsync(Guid id, Guid tenantId)
        {
            var shift = await _context.Shifts
                .FirstOrDefaultAsync(s => s.Id == id && s.TenantId == tenantId && !s.IsDeleted);

            if (shift != null)
            {
                shift.IsDeleted = true;

                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> ShiftCodeExistsAsync(string shiftCode, Guid tenantId)
        {
            return await _context.Shifts
                .AsNoTracking()
                .AnyAsync(s => s.ShiftCode == shiftCode && s.TenantId == tenantId && !s.IsDeleted);
        }

        #endregion

        #region Shift Assignment Operations

        public async Task<ShiftAssignment?> GetShiftAssignmentByIdAsync(Guid id, Guid tenantId)
        {
            return await _context.ShiftAssignments
                .Include(sa => sa.Shift)
                .Include(sa => sa.Rotation)
                .AsNoTracking()
                .FirstOrDefaultAsync(sa => sa.Id == id && sa.TenantId == tenantId && !sa.IsDeleted);
        }

        public async Task<IEnumerable<ShiftAssignment>> GetAllShiftAssignmentsAsync(Guid tenantId, int skip = 0, int take = 50)
        {
            return await _context.ShiftAssignments
                .Include(sa => sa.Shift)
                .AsNoTracking()
                .Where(sa => sa.TenantId == tenantId && !sa.IsDeleted)
                .OrderByDescending(sa => sa.EffectiveFrom)
                .Skip(skip)
                .Take(Math.Clamp(take, 1, 100))
                .ToListAsync();
        }

        public async Task<IEnumerable<ShiftAssignment>> GetShiftAssignmentsByEmployeeAsync(Guid employeeId, Guid tenantId)
        {
            return await _context.ShiftAssignments
                .Include(sa => sa.Shift)
                .AsNoTracking()
                .Where(sa => sa.EmployeeId == employeeId && sa.TenantId == tenantId && !sa.IsDeleted)
                .OrderByDescending(sa => sa.EffectiveFrom)
                .ToListAsync();
        }

        public async Task<IEnumerable<ShiftAssignment>> GetShiftAssignmentsByShiftAsync(Guid shiftId, Guid tenantId)
        {
            return await _context.ShiftAssignments
                .Include(sa => sa.Shift)
                .AsNoTracking()
                .Where(sa => sa.ShiftId == shiftId && sa.TenantId == tenantId && !sa.IsDeleted)
                .OrderByDescending(sa => sa.EffectiveFrom)
                .ToListAsync();
        }

        public async Task<ShiftAssignment?> GetCurrentShiftAssignmentAsync(Guid employeeId, Guid tenantId)
        {
            var now = DateTime.UtcNow;
            return await _context.ShiftAssignments
                .Include(sa => sa.Shift)
                .AsNoTracking()
                .Where(sa => sa.EmployeeId == employeeId 
                    && sa.TenantId == tenantId 
                    && !sa.IsDeleted
                    && sa.Status == ShiftAssignmentStatus.Active
                    && sa.EffectiveFrom <= now
                    && (sa.EffectiveTo == null || sa.EffectiveTo >= now))
                .OrderByDescending(sa => sa.EffectiveFrom)
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<ShiftAssignment>> GetActiveShiftAssignmentsAsync(Guid tenantId)
        {
            return await _context.ShiftAssignments
                .Include(sa => sa.Shift)
                .AsNoTracking()
                .Where(sa => sa.TenantId == tenantId && !sa.IsDeleted && sa.Status == ShiftAssignmentStatus.Active)
                .OrderBy(sa => sa.EffectiveFrom)
                .ToListAsync();
        }

        public async Task<IEnumerable<ShiftAssignment>> GetShiftAssignmentsByDateRangeAsync(DateTime startDate, DateTime endDate, Guid tenantId)
        {
            return await _context.ShiftAssignments
                .Include(sa => sa.Shift)
                .AsNoTracking()
                .Where(sa => sa.TenantId == tenantId 
                    && !sa.IsDeleted
                    && sa.EffectiveFrom <= endDate
                    && (sa.EffectiveTo == null || sa.EffectiveTo >= startDate))
                .OrderBy(sa => sa.EffectiveFrom)
                .ToListAsync();
        }

        public async Task<IEnumerable<ShiftAssignment>> GetRotationalAssignmentsAsync(Guid rotationId, Guid tenantId)
        {
            return await _context.ShiftAssignments
                .Include(sa => sa.Shift)
                .AsNoTracking()
                .Where(sa => sa.RotationId == rotationId && sa.TenantId == tenantId && !sa.IsDeleted)
                .OrderBy(sa => sa.EmployeeId)
                .ToListAsync();
        }

        public async Task<ShiftAssignment> CreateShiftAssignmentAsync(ShiftAssignment assignment)
        {
            _context.ShiftAssignments.Add(assignment);
            await _context.SaveChangesAsync();
            return assignment;
        }

        public async Task<ShiftAssignment> UpdateShiftAssignmentAsync(ShiftAssignment assignment)
        {
            _context.ShiftAssignments.Update(assignment);
            await _context.SaveChangesAsync();
            return assignment;
        }

        public async Task DeleteShiftAssignmentAsync(Guid id, Guid tenantId)
        {
            var assignment = await _context.ShiftAssignments
                .FirstOrDefaultAsync(sa => sa.Id == id && sa.TenantId == tenantId && !sa.IsDeleted);

            if (assignment != null)
            {
                assignment.IsDeleted = true;

                await _context.SaveChangesAsync();
            }
        }

        #endregion

        #region Shift Swap Operations

        public async Task<ShiftSwap?> GetShiftSwapByIdAsync(Guid id, Guid tenantId)
        {
            return await _context.ShiftSwaps
                .Include(ss => ss.RequestorShiftAssignment)
                    .ThenInclude(sa => sa.Shift)
                .Include(ss => ss.TargetShiftAssignment)
                    .ThenInclude(sa => sa.Shift)
                .AsNoTracking()
                .FirstOrDefaultAsync(ss => ss.Id == id && ss.TenantId == tenantId && !ss.IsDeleted);
        }

        public async Task<IEnumerable<ShiftSwap>> GetAllShiftSwapsAsync(Guid tenantId, int skip = 0, int take = 50)
        {
            return await _context.ShiftSwaps
                .Include(ss => ss.RequestorShiftAssignment)
                .Include(ss => ss.TargetShiftAssignment)
                .AsNoTracking()
                .Where(ss => ss.TenantId == tenantId && !ss.IsDeleted)
                .OrderByDescending(ss => ss.CreatedAt)
                .Skip(skip)
                .Take(Math.Clamp(take, 1, 100))
                .ToListAsync();
        }

        public async Task<IEnumerable<ShiftSwap>> GetShiftSwapsByEmployeeAsync(Guid employeeId, Guid tenantId)
        {
            return await _context.ShiftSwaps
                .Include(ss => ss.RequestorShiftAssignment)
                .Include(ss => ss.TargetShiftAssignment)
                .AsNoTracking()
                .Where(ss => (ss.RequestorEmployeeId == employeeId || ss.TargetEmployeeId == employeeId)
                    && ss.TenantId == tenantId 
                    && !ss.IsDeleted)
                .OrderByDescending(ss => ss.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<ShiftSwap>> GetPendingShiftSwapsAsync(Guid tenantId)
        {
            return await _context.ShiftSwaps
                .Include(ss => ss.RequestorShiftAssignment)
                .Include(ss => ss.TargetShiftAssignment)
                .AsNoTracking()
                .Where(ss => ss.TenantId == tenantId 
                    && !ss.IsDeleted
                    && ss.Status == ShiftSwapStatus.Pending)
                .OrderBy(ss => ss.SwapDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<ShiftSwap>> GetShiftSwapsByStatusAsync(ShiftSwapStatus status, Guid tenantId)
        {
            return await _context.ShiftSwaps
                .Include(ss => ss.RequestorShiftAssignment)
                .Include(ss => ss.TargetShiftAssignment)
                .AsNoTracking()
                .Where(ss => ss.Status == status && ss.TenantId == tenantId && !ss.IsDeleted)
                .OrderByDescending(ss => ss.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<ShiftSwap>> GetShiftSwapsForApprovalAsync(Guid managerId, Guid tenantId)
        {
            return await _context.ShiftSwaps
                .Include(ss => ss.RequestorShiftAssignment)
                .Include(ss => ss.TargetShiftAssignment)
                .AsNoTracking()
                .Where(ss => ss.TenantId == tenantId 
                    && !ss.IsDeleted
                    && ss.Status == ShiftSwapStatus.TargetApproved)
                .OrderBy(ss => ss.SwapDate)
                .ToListAsync();
        }

        public async Task<ShiftSwap> CreateShiftSwapAsync(ShiftSwap swap)
        {
            _context.ShiftSwaps.Add(swap);
            await _context.SaveChangesAsync();
            return swap;
        }

        public async Task<ShiftSwap> UpdateShiftSwapAsync(ShiftSwap swap)
        {
            _context.ShiftSwaps.Update(swap);
            await _context.SaveChangesAsync();
            return swap;
        }

        public async Task DeleteShiftSwapAsync(Guid id, Guid tenantId)
        {
            var swap = await _context.ShiftSwaps
                .FirstOrDefaultAsync(ss => ss.Id == id && ss.TenantId == tenantId && !ss.IsDeleted);

            if (swap != null)
            {
                swap.IsDeleted = true;

                await _context.SaveChangesAsync();
            }
        }

        #endregion

        #region Shift Rotation Operations

        public async Task<ShiftRotation?> GetShiftRotationByIdAsync(Guid id, Guid tenantId)
        {
            return await _context.ShiftRotations
                .Include(sr => sr.Assignments)
                .Include(sr => sr.Schedules)
                .AsNoTracking()
                .FirstOrDefaultAsync(sr => sr.Id == id && sr.TenantId == tenantId && !sr.IsDeleted);
        }

        public async Task<IEnumerable<ShiftRotation>> GetAllShiftRotationsAsync(Guid tenantId, int skip = 0, int take = 20)
        {
            return await _context.ShiftRotations
                .AsNoTracking()
                .Where(sr => sr.TenantId == tenantId && !sr.IsDeleted)
                .OrderByDescending(sr => sr.StartDate)
                .Skip(skip)
                .Take(Math.Clamp(take, 1, 100))
                .ToListAsync();
        }

        public async Task<IEnumerable<ShiftRotation>> GetActiveShiftRotationsAsync(Guid tenantId)
        {
            return await _context.ShiftRotations
                .AsNoTracking()
                .Where(sr => sr.TenantId == tenantId && !sr.IsDeleted && sr.IsActive)
                .OrderBy(sr => sr.RotationName)
                .ToListAsync();
        }

        public async Task<IEnumerable<ShiftRotation>> GetShiftRotationsByDepartmentAsync(Guid? departmentId, Guid tenantId)
        {
            return await _context.ShiftRotations
                .AsNoTracking()
                .Where(sr => sr.DepartmentId == departmentId && sr.TenantId == tenantId && !sr.IsDeleted)
                .OrderBy(sr => sr.RotationName)
                .ToListAsync();
        }

        public async Task<IEnumerable<ShiftRotation>> GetShiftRotationsByTypeAsync(RotationType rotationType, Guid tenantId)
        {
            return await _context.ShiftRotations
                .AsNoTracking()
                .Where(sr => sr.RotationType == rotationType && sr.TenantId == tenantId && !sr.IsDeleted)
                .OrderBy(sr => sr.RotationName)
                .ToListAsync();
        }

        public async Task<ShiftRotation> CreateShiftRotationAsync(ShiftRotation rotation)
        {
            _context.ShiftRotations.Add(rotation);
            await _context.SaveChangesAsync();
            return rotation;
        }

        public async Task<ShiftRotation> UpdateShiftRotationAsync(ShiftRotation rotation)
        {
            _context.ShiftRotations.Update(rotation);
            await _context.SaveChangesAsync();
            return rotation;
        }

        public async Task DeleteShiftRotationAsync(Guid id, Guid tenantId)
        {
            var rotation = await _context.ShiftRotations
                .FirstOrDefaultAsync(sr => sr.Id == id && sr.TenantId == tenantId && !sr.IsDeleted);

            if (rotation != null)
            {
                rotation.IsDeleted = true;

                await _context.SaveChangesAsync();
            }
        }

        #endregion

        #region Rotation Schedule Operations

        public async Task<RotationSchedule?> GetRotationScheduleByIdAsync(Guid id, Guid tenantId)
        {
            return await _context.RotationSchedules
                .Include(rs => rs.Rotation)
                .Include(rs => rs.Shift)
                .AsNoTracking()
                .FirstOrDefaultAsync(rs => rs.Id == id && rs.TenantId == tenantId && !rs.IsDeleted);
        }

        public async Task<IEnumerable<RotationSchedule>> GetRotationSchedulesByRotationAsync(Guid rotationId, Guid tenantId)
        {
            return await _context.RotationSchedules
                .Include(rs => rs.Shift)
                .AsNoTracking()
                .Where(rs => rs.RotationId == rotationId && rs.TenantId == tenantId && !rs.IsDeleted)
                .OrderBy(rs => rs.ScheduledDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<RotationSchedule>> GetRotationSchedulesByEmployeeAsync(Guid employeeId, Guid tenantId)
        {
            return await _context.RotationSchedules
                .Include(rs => rs.Shift)
                .Include(rs => rs.Rotation)
                .AsNoTracking()
                .Where(rs => rs.EmployeeId == employeeId && rs.TenantId == tenantId && !rs.IsDeleted)
                .OrderBy(rs => rs.ScheduledDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<RotationSchedule>> GetRotationSchedulesByDateAsync(DateTime date, Guid tenantId)
        {
            var dateOnly = date.Date;
            return await _context.RotationSchedules
                .Include(rs => rs.Shift)
                .AsNoTracking()
                .Where(rs => rs.ScheduledDate.Date == dateOnly && rs.TenantId == tenantId && !rs.IsDeleted)
                .OrderBy(rs => rs.EmployeeId)
                .ToListAsync();
        }

        public async Task<IEnumerable<RotationSchedule>> GetRotationSchedulesByDateRangeAsync(DateTime startDate, DateTime endDate, Guid tenantId)
        {
            return await _context.RotationSchedules
                .Include(rs => rs.Shift)
                .AsNoTracking()
                .Where(rs => rs.ScheduledDate >= startDate 
                    && rs.ScheduledDate <= endDate 
                    && rs.TenantId == tenantId 
                    && !rs.IsDeleted)
                .OrderBy(rs => rs.ScheduledDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<RotationSchedule>> GetSchedulesByStatusAsync(ScheduleStatus status, Guid tenantId)
        {
            return await _context.RotationSchedules
                .Include(rs => rs.Shift)
                .AsNoTracking()
                .Where(rs => rs.Status == status && rs.TenantId == tenantId && !rs.IsDeleted)
                .OrderBy(rs => rs.ScheduledDate)
                .ToListAsync();
        }

        public async Task<RotationSchedule> CreateRotationScheduleAsync(RotationSchedule schedule)
        {
            _context.RotationSchedules.Add(schedule);
            await _context.SaveChangesAsync();
            return schedule;
        }

        public async Task<RotationSchedule> UpdateRotationScheduleAsync(RotationSchedule schedule)
        {
            _context.RotationSchedules.Update(schedule);
            await _context.SaveChangesAsync();
            return schedule;
        }

        public async Task DeleteRotationScheduleAsync(Guid id, Guid tenantId)
        {
            var schedule = await _context.RotationSchedules
                .FirstOrDefaultAsync(rs => rs.Id == id && rs.TenantId == tenantId && !rs.IsDeleted);

            if (schedule != null)
            {
                schedule.IsDeleted = true;

                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> GenerateRotationSchedulesAsync(Guid rotationId, Guid tenantId)
        {
            var rotation = await _context.ShiftRotations
                .Include(sr => sr.Assignments)
                .FirstOrDefaultAsync(sr => sr.Id == rotationId && sr.TenantId == tenantId && !sr.IsDeleted);

            if (rotation == null || !rotation.IsActive)
                return false;

            // This would contain logic to auto-generate schedules based on rotation pattern
            // For now, return true to indicate the method exists
            return true;
        }

        #endregion

        #region Statistics

        public async Task<int> GetTotalShiftsAsync(Guid tenantId)
        {
            return await _context.Shifts
                .AsNoTracking()
                .CountAsync(s => s.TenantId == tenantId && !s.IsDeleted);
        }

        public async Task<int> GetTotalActiveAssignmentsAsync(Guid tenantId)
        {
            return await _context.ShiftAssignments
                .AsNoTracking()
                .CountAsync(sa => sa.TenantId == tenantId && !sa.IsDeleted && sa.Status == ShiftAssignmentStatus.Active);
        }

        public async Task<int> GetPendingSwapRequestsCountAsync(Guid tenantId)
        {
            return await _context.ShiftSwaps
                .AsNoTracking()
                .CountAsync(ss => ss.TenantId == tenantId && !ss.IsDeleted && ss.Status == ShiftSwapStatus.Pending);
        }

        public async Task<Dictionary<ShiftType, int>> GetEmployeeCountByShiftTypeAsync(Guid tenantId)
        {
            var assignments = await _context.ShiftAssignments
                .Include(sa => sa.Shift)
                .AsNoTracking()
                .Where(sa => sa.TenantId == tenantId && !sa.IsDeleted && sa.Status == ShiftAssignmentStatus.Active)
                .ToListAsync();

            return assignments
                .GroupBy(sa => sa.Shift.ShiftType)
                .ToDictionary(g => g.Key, g => g.Count());
        }

        public async Task<Dictionary<string, int>> GetShiftUtilizationAsync(Guid tenantId)
        {
            var shifts = await _context.Shifts
                .Include(s => s.ShiftAssignments.Where(sa => !sa.IsDeleted && sa.Status == ShiftAssignmentStatus.Active))
                .AsNoTracking()
                .Where(s => s.TenantId == tenantId && !s.IsDeleted && s.IsActive)
                .ToListAsync();

            return shifts.ToDictionary(
                s => s.ShiftName,
                s => s.ShiftAssignments.Count
            );
        }

        #endregion
    }
}
