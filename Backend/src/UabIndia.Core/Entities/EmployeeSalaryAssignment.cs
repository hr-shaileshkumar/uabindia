using System;

namespace UabIndia.Core.Entities
{
    public class EmployeeSalaryAssignment : BaseEntity
    {
        public Guid EmployeeId { get; set; }
        public Guid? StructureId { get; set; }
        public decimal MonthlyCtc { get; set; }
        public decimal BasicSalary { get; set; }
        public decimal Hra { get; set; }
        public decimal SpecialAllowance { get; set; }
        public DateTime EffectiveFrom { get; set; }
        public DateTime? EffectiveTo { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
