using System;
using System.ComponentModel.DataAnnotations;

namespace UabIndia.Core.Entities
{
    /// <summary>
    /// Self-service employee regularization request for Missing Punches, On-Duty field tours, or WFH adjustments.
    /// </summary>
    public class AttendanceRegularizationRequest : BaseEntity
    {
        [Required]
        public Guid EmployeeId { get; set; }

        [Required]
        public DateTime AttendanceDate { get; set; }

        /// <summary>
        /// Request Type: "MissingPunch", "OnDuty", "WorkFromHome", "BiometricDispute"
        /// </summary>
        [Required]
        [StringLength(50)]
        public string RequestType { get; set; } = "MissingPunch";

        public TimeSpan? CorrectedInTime { get; set; }
        public TimeSpan? CorrectedOutTime { get; set; }

        [Required]
        [StringLength(500)]
        public string Reason { get; set; } = string.Empty;

        /// <summary>
        /// Status: "Pending", "Approved", "Rejected", "Cancelled"
        /// </summary>
        [Required]
        [StringLength(50)]
        public string Status { get; set; } = "Pending";

        public Guid? ApprovedBy { get; set; }
        public DateTime? ApprovedAt { get; set; }

        [StringLength(500)]
        public string? ReviewNotes { get; set; }

        // Navigation properties
        public virtual Employee? Employee { get; set; }
    }
}
