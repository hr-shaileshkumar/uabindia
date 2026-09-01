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
        public Guid? DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
        public Guid? DesignationId { get; set; }
        public string? DesignationName { get; set; }
        public Guid? ManagerId { get; set; }
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
}
