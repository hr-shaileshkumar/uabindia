using System;
using System.Collections.Generic;

namespace UabIndia.Core.Entities
{
    public class Payslip : BaseEntity
    {
        public Guid PayrollRunId { get; set; }
        public Guid EmployeeId { get; set; }
        public decimal Gross { get; set; }
        public decimal Net { get; set; }
        public string? Details { get; set; }

        public int Month { get; set; }
        public int Year { get; set; }
        public decimal WorkingDays { get; set; }
        public decimal PayableDays { get; set; }
        public decimal LopDays { get; set; }
        public decimal Basic { get; set; }
        public decimal TotalEarnings { get; set; }
        public decimal TotalDeductions { get; set; }
        public decimal PfEmployee { get; set; }
        public decimal EsiEmployee { get; set; }
        public decimal ProfessionalTax { get; set; }
        public decimal Tds { get; set; }
        public Guid? JournalEntryId { get; set; }

        public ICollection<PayslipLine> Lines { get; set; } = new List<PayslipLine>();
    }

    public class PayslipLine : BaseEntity
    {
        public Guid PayslipId { get; set; }
        public Payslip Payslip { get; set; } = null!;
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = "Earning";
        public decimal Amount { get; set; }
        public bool IsStatutory { get; set; }
        public int SortOrder { get; set; }
    }
}
