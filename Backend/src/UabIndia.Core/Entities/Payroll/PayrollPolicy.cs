using System;

namespace UabIndia.Core.Entities
{
    public class PayrollPolicy : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsDefault { get; set; } = false;
        public string PayCycle { get; set; } = "Fixed30Days"; // Fixed30Days, CalendarMonth, WorkingDaysOnly
        public decimal BasicPercentageOfGross { get; set; } = 50.0m;
        public decimal HraPercentageOfBasic { get; set; } = 40.0m;
        public string PfCalculationBasis { get; set; } = "StatutoryWageCeiling"; // StatutoryWageCeiling, ActualBasic, Disabled
        public decimal PfWageCeiling { get; set; } = 15000.0m;
        public decimal PfEmployeeRate { get; set; } = 12.0m;
        public decimal PfEmployerRate { get; set; } = 12.0m;
        public bool IsEsiEnabled { get; set; } = true;
        public decimal EsiWageCeiling { get; set; } = 21000.0m;
        public decimal EsiEmployeeRate { get; set; } = 0.75m;
        public decimal EsiEmployerRate { get; set; } = 3.25m;
        public decimal ProfessionalTaxMonthly { get; set; } = 200.0m;
        public int PayDayOfMonth { get; set; } = 1;
        public bool AllowNegativeTakeHome { get; set; } = false;
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public string Status { get; set; } = "Active"; // Active, Draft, Archived
    }
}
