using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using UabIndia.Core.Entities;

namespace UabIndia.Application.Interfaces
{
    public interface IShiftRepository
    {
        #region Shift Operations

        Task<Shift?> GetShiftByIdAsync(Guid id, Guid tenantId);
        Task<IEnumerable<Shift>> GetAllShiftsAsync(Guid tenantId, int skip = 0, int take = 20);
        Task<IEnumerable<Shift>> GetActiveShiftsAsync(Guid tenantId);
        Task<IEnumerable<Shift>> GetShiftsByTypeAsync(ShiftType shiftType, Guid tenantId);
        Task<IEnumerable<Shift>> GetShiftsByDepartmentAsync(Guid? departmentId, Guid tenantId);
        Task<Shift?> GetShiftByCodeAsync(string shiftCode, Guid tenantId);
        Task<Shift> CreateShiftAsync(Shift shift);
        Task<Shift> UpdateShiftAsync(Shift shift);
        Task DeleteShiftAsync(Guid id, Guid tenantId);
        Task<bool> ShiftCodeExistsAsync(string shiftCode, Guid tenantId);

        #endregion

        #region Shift Assignment Operations

        Task<ShiftAssignment?> GetShiftAssignmentByIdAsync(Guid id, Guid tenantId);
        Task<IEnumerable<ShiftAssignment>> GetAllShiftAssignmentsAsync(Guid tenantId, int skip = 0, int take = 50);
        Task<IEnumerable<ShiftAssignment>> GetShiftAssignmentsByEmployeeAsync(Guid employeeId, Guid tenantId);
        Task<IEnumerable<ShiftAssignment>> GetShiftAssignmentsByShiftAsync(Guid shiftId, Guid tenantId);
        Task<ShiftAssignment?> GetCurrentShiftAssignmentAsync(Guid employeeId, Guid tenantId);
        Task<IEnumerable<ShiftAssignment>> GetActiveShiftAssignmentsAsync(Guid tenantId);
        Task<IEnumerable<ShiftAssignment>> GetShiftAssignmentsByDateRangeAsync(DateTime startDate, DateTime endDate, Guid tenantId);
        Task<IEnumerable<ShiftAssignment>> GetRotationalAssignmentsAsync(Guid rotationId, Guid tenantId);
        Task<ShiftAssignment> CreateShiftAssignmentAsync(ShiftAssignment assignment);
        Task<ShiftAssignment> UpdateShiftAssignmentAsync(ShiftAssignment assignment);
        Task DeleteShiftAssignmentAsync(Guid id, Guid tenantId);

        #endregion

        #region Shift Swap Operations

        Task<ShiftSwap?> GetShiftSwapByIdAsync(Guid id, Guid tenantId);
        Task<IEnumerable<ShiftSwap>> GetAllShiftSwapsAsync(Guid tenantId, int skip = 0, int take = 50);
        Task<IEnumerable<ShiftSwap>> GetShiftSwapsByEmployeeAsync(Guid employeeId, Guid tenantId);
        Task<IEnumerable<ShiftSwap>> GetPendingShiftSwapsAsync(Guid tenantId);
        Task<IEnumerable<ShiftSwap>> GetShiftSwapsByStatusAsync(ShiftSwapStatus status, Guid tenantId);
        Task<IEnumerable<ShiftSwap>> GetShiftSwapsForApprovalAsync(Guid managerId, Guid tenantId);
        Task<ShiftSwap> CreateShiftSwapAsync(ShiftSwap swap);
        Task<ShiftSwap> UpdateShiftSwapAsync(ShiftSwap swap);
        Task DeleteShiftSwapAsync(Guid id, Guid tenantId);

        #endregion

        #region Shift Rotation Operations

        Task<ShiftRotation?> GetShiftRotationByIdAsync(Guid id, Guid tenantId);
        Task<IEnumerable<ShiftRotation>> GetAllShiftRotationsAsync(Guid tenantId, int skip = 0, int take = 20);
        Task<IEnumerable<ShiftRotation>> GetActiveShiftRotationsAsync(Guid tenantId);
        Task<IEnumerable<ShiftRotation>> GetShiftRotationsByDepartmentAsync(Guid? departmentId, Guid tenantId);
        Task<IEnumerable<ShiftRotation>> GetShiftRotationsByTypeAsync(RotationType rotationType, Guid tenantId);
        Task<ShiftRotation> CreateShiftRotationAsync(ShiftRotation rotation);
        Task<ShiftRotation> UpdateShiftRotationAsync(ShiftRotation rotation);
        Task DeleteShiftRotationAsync(Guid id, Guid tenantId);

        #endregion

        #region Rotation Schedule Operations

        Task<RotationSchedule?> GetRotationScheduleByIdAsync(Guid id, Guid tenantId);
        Task<IEnumerable<RotationSchedule>> GetRotationSchedulesByRotationAsync(Guid rotationId, Guid tenantId);
        Task<IEnumerable<RotationSchedule>> GetRotationSchedulesByEmployeeAsync(Guid employeeId, Guid tenantId);
        Task<IEnumerable<RotationSchedule>> GetRotationSchedulesByDateAsync(DateTime date, Guid tenantId);
        Task<IEnumerable<RotationSchedule>> GetRotationSchedulesByDateRangeAsync(DateTime startDate, DateTime endDate, Guid tenantId);
        Task<IEnumerable<RotationSchedule>> GetSchedulesByStatusAsync(ScheduleStatus status, Guid tenantId);
        Task<RotationSchedule> CreateRotationScheduleAsync(RotationSchedule schedule);
        Task<RotationSchedule> UpdateRotationScheduleAsync(RotationSchedule schedule);
        Task DeleteRotationScheduleAsync(Guid id, Guid tenantId);
        Task<bool> GenerateRotationSchedulesAsync(Guid rotationId, Guid tenantId);

        #endregion

        #region Statistics

        Task<int> GetTotalShiftsAsync(Guid tenantId);
        Task<int> GetTotalActiveAssignmentsAsync(Guid tenantId);
        Task<int> GetPendingSwapRequestsCountAsync(Guid tenantId);
        Task<Dictionary<ShiftType, int>> GetEmployeeCountByShiftTypeAsync(Guid tenantId);
        Task<Dictionary<string, int>> GetShiftUtilizationAsync(Guid tenantId);

        #endregion
    }
}
