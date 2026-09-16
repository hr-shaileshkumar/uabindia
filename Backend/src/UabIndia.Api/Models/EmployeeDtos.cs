using System;
using System.ComponentModel.DataAnnotations;

namespace UabIndia.Api.Models
{
    public class CreateEmployeeDto
    {
        public string? FullName { get; set; }
        public Guid CompanyId { get; set; }
        public string? EmployeeCode { get; set; }
        public Guid? ProjectId { get; set; }
        public string? Status { get; set; }

        public bool CreateLogin { get; set; }
        [EmailAddress]
        public string? WorkEmail { get; set; }
        public string? InitialPassword { get; set; }
        public string? LoginRole { get; set; } = "EMPLOYEE";
        public bool SendInviteLink { get; set; }

        public string? PersonalEmail { get; set; }
        public string? Phone { get; set; }
        public string? AlternatePhone { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? Gender { get; set; }
        public string? MaritalStatus { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? PostalCode { get; set; }
        public DateTime? DateOfJoining { get; set; }
        public DateTime? ConfirmationDate { get; set; }
        public DateTime? ProbationEndDate { get; set; }
        public DateTime? ExitDate { get; set; }
        public string? EmploymentType { get; set; }
        public string? WorkLocation { get; set; }

        // Geofencing & Base Location Attendance Validation
        public bool ValidateGeofenceOnAttendance { get; set; } = true;
        public bool AllowAnyLocationCheckIn { get; set; } = false;
        public Guid? BaseOperationalLocationId { get; set; }
        public double? BaseLocationLatitude { get; set; }
        public double? BaseLocationLongitude { get; set; }
        public int? BaseLocationRadiusMeters { get; set; } = 150;

        // Biometric Hardware & Shift Policy
        public string? BiometricEnrollmentId { get; set; }
        public string? BiometricCardNumber { get; set; }
        public Guid? AssignedShiftId { get; set; }
        public Guid? AttendancePolicyId { get; set; }

        public Guid? DepartmentId { get; set; }
        public Guid? DesignationId { get; set; }
        public Guid? BranchId { get; set; }
        public Guid? CostCenterId { get; set; }
        public Guid? ManagerId { get; set; }
        public Guid? ReportingManagerId { get; set; }
        public string? Pan { get; set; }
        public string? Aadhaar { get; set; }
        public string? Uan { get; set; }
        public string? EsiNumber { get; set; }
        public string? PfNumber { get; set; }
        public string? BankName { get; set; }
        public string? BankAccountHolder { get; set; }
        public string? BankAccountNumber { get; set; }
        public string? BankIfsc { get; set; }
        public Guid? PayrollStructureId { get; set; }
        public decimal MonthlyCtc { get; set; }
        public decimal BasicSalary { get; set; }
        public string? ProbationStatus { get; set; }
        public decimal? ProbationScore { get; set; }
        public string? ProbationComments { get; set; }
    }

    public class EmployeeDto
    {
        public Guid Id { get; set; }
        public string? FullName { get; set; }
        public Guid CompanyId { get; set; }
        public string? EmployeeCode { get; set; }
        public Guid? ProjectId { get; set; }
        public string? Status { get; set; }
        public bool LoginCreated { get; set; }
        public string? WorkEmail { get; set; }
        public string? TemporaryPassword { get; set; }
        public string? Phone { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? Gender { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public DateTime? DateOfJoining { get; set; }
        public DateTime? ConfirmationDate { get; set; }
        public DateTime? ProbationEndDate { get; set; }
        public DateTime? ExitDate { get; set; }
        public string? EmploymentType { get; set; }
        public string? WorkLocation { get; set; }

        // Geofencing & Base Location Attendance Validation
        public bool ValidateGeofenceOnAttendance { get; set; } = true;
        public bool AllowAnyLocationCheckIn { get; set; } = false;
        public Guid? BaseOperationalLocationId { get; set; }
        public string? BaseOperationalLocationName { get; set; }
        public double? BaseLocationLatitude { get; set; }
        public double? BaseLocationLongitude { get; set; }
        public int? BaseLocationRadiusMeters { get; set; } = 150;

        // Biometric Hardware & Shift Policy
        public string? BiometricEnrollmentId { get; set; }
        public string? BiometricCardNumber { get; set; }
        public Guid? AssignedShiftId { get; set; }
        public string? AssignedShiftName { get; set; }
        public Guid? AttendancePolicyId { get; set; }
        public string? AttendancePolicyName { get; set; }

        public Guid? DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
        public Guid? DesignationId { get; set; }
        public string? DesignationName { get; set; }
        public Guid? ManagerId { get; set; }
        public Guid? ReportingManagerId { get; set; }
        public string? ReportingManagerName { get; set; }
        public Guid? ActingManagerId { get; set; }
        public string? ActingManagerName { get; set; }
        public DateTime? DelegationStartDate { get; set; }
        public DateTime? DelegationEndDate { get; set; }
        public string? DelegationReason { get; set; }
        public bool IsOrganizationHead { get; set; }
        public Guid? UserId { get; set; }
        public string? Pan { get; set; }
        public string? Uan { get; set; }
        public string? EsiNumber { get; set; }
        public string? PfNumber { get; set; }
        public string? BankName { get; set; }
        public string? BankIfsc { get; set; }
        public Guid? PayrollStructureId { get; set; }
        public decimal MonthlyCtc { get; set; }
        public decimal BasicSalary { get; set; }
        public string? ProbationStatus { get; set; }
        public decimal? ProbationScore { get; set; }
        public string? ProbationComments { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class UpdateEmployeeDto : CreateEmployeeDto
    {
    }

    public class OrgTreeNodeDto
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? EmployeeCode { get; set; }
        public string? WorkEmail { get; set; }
        public string? Phone { get; set; }
        public Guid? DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
        public Guid? DesignationId { get; set; }
        public string? DesignationName { get; set; }
        public string? AvatarUrl { get; set; }
        public string? Status { get; set; }
        public Guid? ReportingManagerId { get; set; }
        public string? ReportingManagerName { get; set; }
        public Guid? ActingManagerId { get; set; }
        public string? ActingManagerName { get; set; }
        public bool IsOrganizationHead { get; set; }
        public int DirectReportsCount { get; set; }
        public List<OrgTreeNodeDto> Subordinates { get; set; } = new();
    }

    public class AssignManagerRequestDto
    {
        public Guid? ReportingManagerId { get; set; }
        public string? Reason { get; set; }
        public DateTime? EffectiveDate { get; set; }
    }

    public class DelegateAuthorityRequestDto
    {
        public Guid? ActingManagerId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? Reason { get; set; }
    }

    public class HierarchyTransferRequestDto
    {
        public Guid EmployeeId { get; set; }
        public Guid? ProposedManagerId { get; set; }
        public Guid? ProposedDepartmentId { get; set; }
        public string TransferType { get; set; } = "Promotion"; // Promotion, DepartmentTransfer, ManagerReassignment
        public string Reason { get; set; } = string.Empty;
        public DateTime EffectiveDate { get; set; } = DateTime.UtcNow;
    }

    public class HierarchyTransferSignOffDto
    {
        public string Role { get; set; } = "HRBP"; // OldManager, NewManager, HRBP
        public string Decision { get; set; } = "Approved"; // Approved, Rejected
        public string? Notes { get; set; }
    }

    public class HierarchyTransferDto
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public string? EmployeeName { get; set; }
        public string? EmployeeCode { get; set; }
        public Guid? CurrentManagerId { get; set; }
        public string? CurrentManagerName { get; set; }
        public Guid? ProposedManagerId { get; set; }
        public string? ProposedManagerName { get; set; }
        public Guid? CurrentDepartmentId { get; set; }
        public string? CurrentDepartmentName { get; set; }
        public Guid? ProposedDepartmentId { get; set; }
        public string? ProposedDepartmentName { get; set; }
        public string TransferType { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public DateTime EffectiveDate { get; set; }
        public string OldManagerSignOffStatus { get; set; } = string.Empty;
        public string NewManagerSignOffStatus { get; set; } = string.Empty;
        public string HrbpSignOffStatus { get; set; } = string.Empty;
        public string OverallStatus { get; set; } = string.Empty;
        public string? SignOffNotes { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class OrphanRiskDto
    {
        public Guid ExitingManagerId { get; set; }
        public string ExitingManagerName { get; set; } = string.Empty;
        public string? ExitingManagerCode { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? ExitDate { get; set; }
        public Guid? SkipLevelManagerId { get; set; }
        public string? SkipLevelManagerName { get; set; }
        public int DirectReportsCount { get; set; }
        public List<EmployeeSummaryDto> DirectReports { get; set; } = new();
    }

    public class EmployeeSummaryDto
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? EmployeeCode { get; set; }
        public string? Designation { get; set; }
        public string? Department { get; set; }
    }

    public class MyTeamMemberDto
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? EmployeeCode { get; set; }
        public string? Designation { get; set; }
        public string? Department { get; set; }
        public string? WorkEmail { get; set; }
        public string? Phone { get; set; }
        public DateTime? DateOfJoining { get; set; }
        public string Status { get; set; } = "Active";
        public string TodayAttendanceStatus { get; set; } = "Not Checked In";
        public string? FirstPunchInTime { get; set; }
        public decimal LeaveBalance { get; set; }
    }

    public class MyTeamDashboardDto
    {
        public Guid ManagerId { get; set; }
        public string ManagerName { get; set; } = string.Empty;
        public string? ManagerCode { get; set; }
        public string? ManagerDesignation { get; set; }
        public int TotalTeamMembers { get; set; }
        public int PresentToday { get; set; }
        public int OnLeaveToday { get; set; }
        public int NotCheckedInToday { get; set; }
        public int PendingApprovalsCount { get; set; }
        public List<MyTeamMemberDto> TeamMembers { get; set; } = new();
        public List<LeaveRequestDto> PendingLeaves { get; set; } = new();
    }
}

