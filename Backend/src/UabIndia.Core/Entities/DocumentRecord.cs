using System;

namespace UabIndia.Core.Entities
{
    public class DocumentRecord : BaseEntity
    {
        public Guid UploadedByUserId { get; set; }
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public Guid? EmployeeId { get; set; }
        public string Module { get; set; } = "general"; // hrms, payroll, operations
        public string Category { get; set; } = "general"; // employee-doc, compliance, report
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = "application/octet-stream";
        public long FileSizeBytes { get; set; }
        public string StoragePath { get; set; } = string.Empty;
        public string? Tags { get; set; }
        public string? Description { get; set; }
    }
}
