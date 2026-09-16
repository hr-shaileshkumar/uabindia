using System;

namespace UabIndia.Core.Entities
{
    public class Employee : BaseEntity
    {
        public Guid CompanyId { get; set; }
        public string? FullName { get; set; }
        public string? EmployeeCode { get; set; }
        public Guid? ProjectId { get; set; }
        public Guid? ManagerId { get; set; }
        public Guid? ReportingManagerId { get; set; }
        public Guid? ActingManagerId { get; set; }
        public DateTime? DelegationStartDate { get; set; }
        public DateTime? DelegationEndDate { get; set; }
        public string? DelegationReason { get; set; }
        public bool IsOrganizationHead { get; set; }
        public Guid? UserId { get; set; }
        public string? Status { get; set; }

        public string? WorkEmail { get; set; }
        public string? PersonalEmail { get; set; }
        public string? Phone { get; set; }
        public string? AlternatePhone { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? Gender { get; set; }
        public string? MaritalStatus { get; set; }
        public string? Nationality { get; set; } = "Global";
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? PostalCode { get; set; }
        public string? CountryCode { get; set; } = "IND";

        public DateTime? DateOfJoining { get; set; }
        public DateTime? ConfirmationDate { get; set; }
        public DateTime? ProbationEndDate { get; set; }
        public DateTime? ExitDate { get; set; }
        public string? EmploymentType { get; set; } = "Permanent";
        public string? WorkLocation { get; set; }

        // Geofencing & Base Location Attendance Validation
        public bool ValidateGeofenceOnAttendance { get; set; } = true;
        public bool AllowAnyLocationCheckIn { get; set; } = false;
        public Guid? BaseOperationalLocationId { get; set; }
        public double? BaseLocationLatitude { get; set; }
        public double? BaseLocationLongitude { get; set; }
        public int? BaseLocationRadiusMeters { get; set; } = 150;

        // Biometric Hardware & Shift Mapping
        public string? BiometricEnrollmentId { get; set; }  // Device machine user ID (e.g. "1042")
        public string? BiometricCardNumber { get; set; }    // RFID / NFC Card Number
        public Guid? AssignedShiftId { get; set; }          // Default employee shift
        public Guid? AttendancePolicyId { get; set; }       // Custom attendance policy override

        public Guid? DepartmentId { get; set; }
        public Guid? DesignationId { get; set; }
        public Guid? BranchId { get; set; }
        public Guid? CostCenterId { get; set; }

        // Universal Global Compliance & Identification Fields
        public string? TaxIdentificationNumber { get; set; }
        public string? NationalIdNumber { get; set; }
        public string? SocialSecurityNumber { get; set; }
        public string? BankRoutingCode { get; set; }
        public string? BankIban { get; set; }
        public string? BankSwiftCode { get; set; }
        public string? CountrySpecificDataJson { get; set; } = "{}";

        // Regional Backwards Compatibility Mappings
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
}
