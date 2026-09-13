using System;

namespace UabIndia.Core.Entities
{
    public class CustomReport : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string ReportType { get; set; } = "sales"; // sales, inventory, customers, finance, hrms
        public string DateRange { get; set; } = "last30days";
        public string OutputFormat { get; set; } = "pdf";
        public string Schedule { get; set; } = "Manual"; // Manual, Daily, Weekly, Monthly
        public string Status { get; set; } = "Draft"; // Draft, Active
        public string CreatedByName { get; set; } = string.Empty;
        public DateTime? LastRunAt { get; set; }
        public int LastRowCount { get; set; }
        public string? LastRunSummary { get; set; }
    }

    public class LicenseInvoice : BaseEntity
    {
        public string InvoiceNumber { get; set; } = string.Empty;
        public string Period { get; set; } = string.Empty;
        public string Plan { get; set; } = "Standard";
        public decimal Amount { get; set; }
        public string Status { get; set; } = "Pending"; // Pending, Paid, Overdue
        public DateTime? PaidDate { get; set; }
        public string? Remarks { get; set; }
    }
}
