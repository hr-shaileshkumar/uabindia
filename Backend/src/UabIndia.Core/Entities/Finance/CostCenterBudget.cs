using System;

namespace UabIndia.Core.Entities
{
    public class CostCenterBudget : BaseEntity
    {
        public Guid CostCenterId { get; set; }
        public int FiscalYear { get; set; } = 2026;
        public decimal AllocatedBudget { get; set; } = 0;
        public decimal ActualSpent { get; set; } = 0;
        public decimal CommittedAmount { get; set; } = 0;
        public string? Notes { get; set; }
    }
}
