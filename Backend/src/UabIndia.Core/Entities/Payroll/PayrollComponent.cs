using System;

namespace UabIndia.Core.Entities
{
    /// <summary>
    /// Represents an earning, deduction, or statutory salary component.
    /// Supports Fixed Amount, Percentage of Basic/Gross/CTC, or Dynamic Math Formula.
    /// </summary>
    public class PayrollComponent : BaseEntity
    {
        public Guid StructureId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = "Earning"; // Earning, Deduction, Statutory
        public string CalculationType { get; set; } = "FixedAmount"; // FixedAmount, PercentageOfBasic, PercentageOfGross, PercentageOfCtc, Formula
        public decimal? Amount { get; set; }
        public decimal? Percentage { get; set; }
        public string? Formula { get; set; } // e.g., "BASIC * 0.12", "(BASIC + HRA) * 0.05", "GROSS * 0.02"
        public string? PercentageBase { get; set; } = "Basic"; // Basic, Gross, CTC, Taxable
        public bool IsStatutory { get; set; }
        public int SortOrder { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
