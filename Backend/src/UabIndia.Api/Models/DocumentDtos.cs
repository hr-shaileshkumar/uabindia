using System;

namespace UabIndia.Api.Models
{
    public class DocumentDto
    {
        public Guid Id { get; set; }
        public Guid UploadedByUserId { get; set; }
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public Guid? EmployeeId { get; set; }
        public string Module { get; set; } = "general";
        public string Category { get; set; } = "general";
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = "application/octet-stream";
        public long FileSizeBytes { get; set; }
        public string? Tags { get; set; }
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
