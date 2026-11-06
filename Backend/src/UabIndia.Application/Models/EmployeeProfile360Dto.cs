using System;
using System.Collections.Generic;

namespace UabIndia.Application.Models
{
    public class EmployeeProfile360Dto
    {
        // Core Identity
        public Guid Id { get; set; }
        public Guid TenantId { get; set; }
        public Guid CompanyId { get; set; }
        public string? CompanyName { get; set; }
        public string? FullName { get; set; }
        public string? EmployeeCode { get; set; }
        public string? Status { get; set; }
        public string? AvatarUrl { get; set; }

        // Contact & Personal
        public string? WorkEmail { get; set; }
        public string? PersonalEmail { get; set; }
        public string? Phone { get; set; }
        public string? AlternatePhone { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? Gender { get; set; }
        public string? MaritalStatus { get; set; }
        public string? Nationality { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? PostalCode { get; set; }

        // Organization & Employment
        public Guid? DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
        public Guid? DesignationId { get; set; }
        public string? DesignationName { get; set; }
        public Guid? BranchId { get; set; }
        public string? BranchName { get; set; }
        public Guid? ProjectId { get; set; }
        public string? ProjectName { get; set; }
        public Guid? CostCenterId { get; set; }
        public string? CostCenterName { get; set; }
        public Guid? ReportingManagerId { get; set; }
        public string? ReportingManagerName { get; set; }
        public string? EmploymentType { get; set; }
        public string? WorkLocation { get; set; }
        public DateTime? DateOfJoining { get; set; }
        public DateTime? ConfirmationDate { get; set; }
        public DateTime? ProbationEndDate { get; set; }
        public string? ProbationStatus { get; set; }

        // Statutory & Bank
        public string? Pan { get; set; }
        public string? Aadhaar { get; set; }
        public string? Uan { get; set; }
        public string? EsiNumber { get; set; }
        public string? PfNumber { get; set; }
        public string? BankName { get; set; }
        public string? BankAccountHolder { get; set; }
        public string? BankAccountNumber { get; set; }
        public string? BankIfsc { get; set; }

        // Compensation
        public decimal MonthlyCtc { get; set; }
        public decimal BasicSalary { get; set; }
        public string? PayrollStructureName { get; set; }

        // Aggregated Sub-domains
        public EmployeeAttendanceSummary AttendanceSummary { get; set; } = new();
        public List<EmployeeLeaveBalanceSummary> LeaveBalances { get; set; } = new();
        public List<EmployeeRecentPayslipSummary> RecentPayslips { get; set; } = new();
        public List<EmployeeAssignedAssetSummary> AssignedAssets { get; set; } = new();
        public List<EmployeeDocumentSummary> Documents { get; set; } = new();
        public List<EmployeeDirectReportSummary> DirectReports { get; set; } = new();
        public List<EmployeeTimelineEventSummary> TimelineEvents { get; set; } = new();
    }

    public class EmployeeAttendanceSummary
    {
        public int TotalWorkingDays { get; set; }
        public int PresentDays { get; set; }
        public int AbsentDays { get; set; }
        public int LateDays { get; set; }
        public int OnLeaveDays { get; set; }
        public decimal TotalHoursWorked { get; set; }
        public decimal AttendanceRate { get; set; }
        public List<EmployeeAttendanceDayLog> RecentLogs { get; set; } = new();
    }

    public class EmployeeAttendanceDayLog
    {
        public DateTime Date { get; set; }
        public string? ShiftName { get; set; }
        public string? InTime { get; set; }
        public string? OutTime { get; set; }
        public string? Status { get; set; }
        public string? Source { get; set; }
        public bool IsGpsVerified { get; set; }
        public bool IsFrsVerified { get; set; }
    }

    public class EmployeeLeaveBalanceSummary
    {
        public string LeaveType { get; set; } = string.Empty;
        public decimal TotalAllocated { get; set; }
        public decimal Used { get; set; }
        public decimal Balance { get; set; }
    }

    public class EmployeeRecentPayslipSummary
    {
        public Guid PayslipId { get; set; }
        public string MonthYear { get; set; } = string.Empty;
        public decimal GrossEarnings { get; set; }
        public decimal TotalDeductions { get; set; }
        public decimal NetSalary { get; set; }
        public string Status { get; set; } = "Paid";
        public DateTime? PaymentDate { get; set; }
    }

    public class EmployeeAssignedAssetSummary
    {
        public Guid AssetId { get; set; }
        public string AssetCode { get; set; } = string.Empty;
        public string AssetName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string? SerialNumber { get; set; }
        public DateTime? AssignedDate { get; set; }
        public string Status { get; set; } = "Active";
    }

    public class EmployeeDocumentSummary
    {
        public Guid DocumentId { get; set; }
        public string DocumentName { get; set; } = string.Empty;
        public string DocumentType { get; set; } = string.Empty;
        public string? FileUrl { get; set; }
        public DateTime UploadedDate { get; set; }
        public bool IsVerified { get; set; }
    }

    public class EmployeeDirectReportSummary
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? EmployeeCode { get; set; }
        public string? Designation { get; set; }
        public string? Department { get; set; }
        public string? Status { get; set; }
    }

    public class EmployeeTimelineEventSummary
    {
        public DateTime Timestamp { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string EventType { get; set; } = "System";
    }
}
