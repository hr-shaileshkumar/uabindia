using System;
using System.ComponentModel.DataAnnotations;

namespace UabIndia.Api.Models
{
    public class CreateEmployeeDto
    {
        [Required]
        public string? FullName { get; set; }
        [Required]
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
    }
}
